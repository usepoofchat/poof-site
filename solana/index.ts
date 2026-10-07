import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createSolanaRpc,
  createTransactionMessage,
  getBase58Decoder,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  type Address,
  type Instruction,
} from "@solana/kit";
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";
import {
  TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction,
} from "@solana-program/token";
import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";

/**
 * Solana for paying a Super Quant-Room: the wallets in this browser (Wallet Standard: Phantom,
 * Solflare, Backpack and the like, or a phone wallet's own browser), a stablecoin transfer to
 * Poof's address, and a signed message. No UI of its own: the page lists the wallets and shows
 * what happens.
 *
 * The transaction is built here and sent by the wallet. Nothing is logged.
 */

const MAINNET = "solana:mainnet";

interface ConnectFeature {
  connect(input?: { silent?: boolean }): Promise<{ accounts: readonly WalletAccount[] }>;
}
interface DisconnectFeature {
  disconnect(): Promise<void>;
}
interface SignAndSendTransactionFeature {
  signAndSendTransaction(
    ...inputs: { account: WalletAccount; chain: string; transaction: Uint8Array }[]
  ): Promise<readonly { signature: Uint8Array }[]>;
}
interface SignMessageFeature {
  signMessage(
    ...inputs: { account: WalletAccount; message: Uint8Array }[]
  ): Promise<readonly { signature: Uint8Array; signedMessage: Uint8Array }[]>;
}

export interface SolanaWalletChoice {
  name: string;
  /** A data: URI, or "". */
  icon: string;
  connect(opts: { rpcUrl: string }): Promise<SolanaConnection>;
}

export interface SolanaConnection {
  /** The wallet's address, base58. */
  address: string;
  /** Lamports (for the network fee) and the wallet's balance of `mint`, in the token's own units; null where unknown. */
  balances(mint: string): Promise<{ sol: bigint | null; token: bigint | null }>;
  /** Sends `amount` units of `mint` to the wallet `to`. Resolves to the transaction signature (base58). */
  pay(opts: { mint: string; to: string; amount: bigint; decimals: number }): Promise<string>;
  /** ed25519 over the text's UTF-8 bytes, base58. */
  signMessage(text: string): Promise<string>;
  disconnect(): Promise<void>;
}

const canPay = (w: Wallet) =>
  w.chains.includes(MAINNET) &&
  "standard:connect" in w.features &&
  "solana:signAndSendTransaction" in w.features &&
  "solana:signMessage" in w.features;

/** The Solana wallets in this browser that can pay and sign. */
export function listSolanaWallets(): SolanaWalletChoice[] {
  return getWallets()
    .get()
    .filter(canPay)
    .map((w) => ({
      name: w.name,
      icon: /^data:image\//.test(w.icon) ? w.icon : "",
      connect: (opts) => connect(w, opts.rpcUrl),
    }));
}

async function connect(wallet: Wallet, rpcUrl: string): Promise<SolanaConnection> {
  const features = wallet.features as Record<string, unknown>;
  const { accounts } = await (features["standard:connect"] as ConnectFeature).connect();
  const account = accounts.find((a) => a.chains.includes(MAINNET)) ?? accounts[0];
  if (!account) throw new Error("The wallet didn't share an address.");
  const rpc = createSolanaRpc(rpcUrl);
  const owner = address(account.address);
  const tokenAccount = async (mint: Address, of: Address) =>
    (await findAssociatedTokenPda({ owner: of, mint, tokenProgram: TOKEN_PROGRAM_ADDRESS }))[0];
  const exists = async (a: Address) =>
    (await rpc.getAccountInfo(a, { encoding: "base64" }).send()).value !== null;

  return {
    address: account.address,

    async balances(mintText) {
      const mint = address(mintText);
      const sol = await rpc
        .getBalance(owner)
        .send()
        .then((r) => BigInt(r.value))
        .catch(() => null);
      let token: bigint | null = null;
      try {
        const mine = await tokenAccount(mint, owner);
        token = (await exists(mine))
          ? BigInt((await rpc.getTokenAccountBalance(mine).send()).value.amount)
          : 0n;
      } catch {
        // unknown: the wallet is still asked
      }
      return { sol, token };
    },

    async pay({ mint: mintText, to: toText, amount, decimals }) {
      const mint = address(mintText);
      const to = address(toText);
      const signer = createNoopSigner(owner); // the wallet signs
      const source = await tokenAccount(mint, owner);
      const destination = await tokenAccount(mint, to);
      const instructions: Instruction[] = [
        getSetComputeUnitLimitInstruction({ units: 60_000 }),
        getSetComputeUnitPriceInstruction({ microLamports: 50_000n }),
      ];
      // Poof's token account for this stablecoin, if it doesn't exist yet (a one-time rent).
      if (!(await exists(destination))) {
        instructions.push(
          getCreateAssociatedTokenIdempotentInstruction({
            payer: signer,
            ata: destination,
            owner: to,
            mint,
          }),
        );
      }
      instructions.push(
        getTransferCheckedInstruction({
          source,
          mint,
          destination,
          authority: signer,
          amount,
          decimals,
        }),
      );
      const { value: latest } = await rpc.getLatestBlockhash({ commitment: "confirmed" }).send();
      const message = pipe(
        createTransactionMessage({ version: "legacy" }),
        (m) => setTransactionMessageFeePayerSigner(signer, m),
        (m) => setTransactionMessageLifetimeUsingBlockhash(latest, m),
        (m) => appendTransactionMessageInstructions(instructions, m),
      );
      const wire = new Uint8Array(getTransactionEncoder().encode(compileTransaction(message)));
      const [sent] = await (
        features["solana:signAndSendTransaction"] as SignAndSendTransactionFeature
      ).signAndSendTransaction({ account, chain: MAINNET, transaction: wire });
      if (!sent) throw new Error("The wallet didn't send the payment.");
      return getBase58Decoder().decode(sent.signature);
    },

    async signMessage(text) {
      const [signed] = await (features["solana:signMessage"] as SignMessageFeature).signMessage({
        account,
        message: new TextEncoder().encode(text),
      });
      if (!signed) throw new Error("The wallet didn't sign.");
      return getBase58Decoder().decode(signed.signature);
    },

    async disconnect() {
      await (features["standard:disconnect"] as DisconnectFeature | undefined)?.disconnect();
    },
  };
}
