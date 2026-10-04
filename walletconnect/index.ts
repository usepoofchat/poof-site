import UniversalProvider from "@walletconnect/universal-provider";

/**
 * WalletConnect for paying a Super Quant-Room from a phone wallet, with no UI of its own: the page
 * shows `uri` as a QR code (or opens it on a phone) and gets back a provider with the same
 * `request({ method, params })` shape as a browser wallet (EIP-1193).
 *
 * Telemetry is off and nothing is logged. WalletConnect's relay carries the (end-to-end encrypted)
 * messages between this page and the wallet.
 */

export interface WalletChain {
  chainId: number;
  rpcUrl: string;
}

export interface WalletConnection {
  address: `0x${string}`;
  /** Calls go to `chainId` (the payment's chain). */
  request(args: { method: string; params?: unknown[] }, chainId: number): Promise<unknown>;
  disconnect(): Promise<void>;
}

export async function connectWalletConnect(opts: {
  projectId: string;
  chains: WalletChain[];
  /** Show this `wc:` URI: a QR code on a computer, a link on a phone. */
  onUri: (uri: string) => void;
}): Promise<WalletConnection> {
  const provider = await UniversalProvider.init({
    projectId: opts.projectId,
    metadata: {
      name: "Poof",
      description: "Pay for a Super Quant-Room",
      url: "https://usepoof.chat",
      icons: ["https://usepoof.chat/apple-touch-icon.png"],
    },
    logger: "silent",
    telemetryEnabled: false,
  });
  provider.on("display_uri", opts.onUri);
  const chains = opts.chains.map((c) => `eip155:${c.chainId}`);
  const session = await provider.connect({
    optionalNamespaces: {
      eip155: {
        chains,
        methods: ["eth_sendTransaction", "personal_sign", "eth_chainId", "eth_accounts"],
        events: ["accountsChanged", "chainChanged"],
        rpcMap: Object.fromEntries(opts.chains.map((c) => [String(c.chainId), c.rpcUrl])),
      },
    },
  });
  const account = session?.namespaces.eip155?.accounts[0];
  const address = account?.split(":")[2];
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    await provider.disconnect().catch(() => undefined);
    throw new Error("The wallet didn't share an address.");
  }
  return {
    address: address as `0x${string}`,
    request: (args, chainId) => provider.request(args, `eip155:${chainId}`),
    disconnect: () => provider.disconnect(),
  };
}
