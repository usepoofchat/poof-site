// Builds brand/poof-brand-kit.zip, the "Download all" file on usepoof.chat/docs/#/brandkit.
// Usage: npm run brand-zip   (run it again whenever a brand file changes, then commit the zip)
import fs from "node:fs";
import zlib from "node:zlib";

// [path inside the zip, source file]
const FILES = [
  ["logo/poof-logo-for-dark-bg.svg", "brand/svg/poof-logo-for-dark-bg.svg"],
  ["logo/poof-logo-for-light-bg.svg", "brand/svg/poof-logo-for-light-bg.svg"],
  ["logo/poof-logo-currentcolor.svg", "brand/svg/poof-logo-currentcolor.svg"],
  ["logo/poof-logo-for-dark-bg-1600w.png", "brand/png-transparent/poof-logo-for-dark-bg-1600w.png"],
  ["logo/poof-logo-for-dark-bg-800w.png", "brand/png-transparent/poof-logo-for-dark-bg-800w.png"],
  ["logo/poof-logo-for-light-bg-1600w.png", "brand/png-transparent/poof-logo-for-light-bg-1600w.png"],
  ["logo/poof-logo-for-light-bg-800w.png", "brand/png-transparent/poof-logo-for-light-bg-800w.png"],
  ["logo/poof-logo-on-dark-1200x400.png", "brand/poof-logo-on-dark.png"],
  ["mark/poof-mark.svg", "brand/svg/poof-mark.svg"],
  ["mark/poof-mark-padded.svg", "brand/svg/poof-mark-padded.svg"],
  ["mark/poof-mark-512.png", "brand/png-transparent/poof-mark-512.png"],
  ["mark/poof-mark-1024.png", "brand/png-transparent/poof-mark-1024.png"],
  ["mark/poof-mark-2048.png", "brand/png-transparent/poof-mark-2048.png"],
  ["mark/poof-app-icon-180.png", "apple-touch-icon.png"],
  ["social/poof-share-image-1200x630.png", "og-image.png"],
  ["social/x/poof-x-avatar-fox-400.png", "brand/x-avatar-400x400.png"],
  ["social/x/poof-x-avatar-mark-1000.png", "brand/x-profile/poof-x-avatar-1000.png"],
  ["social/x/poof-x-cover-1500x500.png", "brand/x-cover-1500x500.png"],
  ["social/x/poof-x-cover-3000x1000.png", "brand/x-cover-3000x1000.png"],
  ["social/telegram/poof-tg-avatar-ink.png", "brand/telegram/avatar-ink.png"],
  ["social/telegram/poof-tg-avatar-rust.png", "brand/telegram/avatar-rust.png"],
  ["social/telegram/poof-tg-portal.jpg", "brand/telegram/portal.jpg"],
  ["social/telegram/poof-tg-portal.mp4", "brand/telegram/portal.mp4"],
  ["social/telegram/poof-tg-welcome.jpg", "brand/telegram/welcome.jpg"],
  ["social/telegram/poof-tg-welcome.mp4", "brand/telegram/welcome.mp4"],
  // animated custom emoji (100 x 100 WEBM, Telegram format)
  ...fs.readdirSync("brand/telegram/emoji").filter(f => f.endsWith(".webm")).map(f => ["social/telegram/emoji/poof-emoji-" + f.replace(/^\d+-/, ""), "brand/telegram/emoji/" + f]),
];

const README = `Poof brand kit
usepoof.chat/docs/brandbook/

Colors
  Rust    #e8661f   primary accent
  Burnt   #9c3b14   rust for text on light grounds
  Ink     #1d1f2b   text, dark surfaces
  Stone   #a7a49b   quiet details
  Cream   #fbf7ef   light surfaces
  Frost   #9db4ff   quantum / future topics only
  Light ground #e8e9e4   Dark ground #16171f

Type
  Geist (headlines and body), Geist Mono (labels, system and crypto details).
  The wordmark is drawn, not typed. Never set "Poof" in a font as a logo.

Use the files as they are: no recoloring, stretching, rotating or effects.
Questions: contact@usepoof.chat
`;

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const entries = [...FILES.map(([name, src]) => [name, fs.readFileSync(src)]), ["README.txt", Buffer.from(README)]];
const local = [], central = [];
let offset = 0;
for (const [name, data] of entries) {
  const nameBuf = Buffer.from(name);
  const packed = zlib.deflateRawSync(data, { level: 9 });
  const store = packed.length >= data.length;          // png/jpg/mp4 are already compressed
  const body = store ? data : packed;
  const crc = crc32(data);
  const h = Buffer.alloc(30);
  h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6);
  h.writeUInt16LE(store ? 0 : 8, 8); h.writeUInt16LE(0, 10); h.writeUInt16LE(0x21, 12);   // fixed date 1980-01-01
  h.writeUInt32LE(crc, 14); h.writeUInt32LE(body.length, 18); h.writeUInt32LE(data.length, 22);
  h.writeUInt16LE(nameBuf.length, 26); h.writeUInt16LE(0, 28);
  local.push(h, nameBuf, body);
  const c = Buffer.alloc(46);
  c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8);
  c.writeUInt16LE(store ? 0 : 8, 10); c.writeUInt16LE(0, 12); c.writeUInt16LE(0x21, 14);
  c.writeUInt32LE(crc, 16); c.writeUInt32LE(body.length, 20); c.writeUInt32LE(data.length, 24);
  c.writeUInt16LE(nameBuf.length, 28); c.writeUInt32LE(offset, 42);
  central.push(c, nameBuf);
  offset += h.length + nameBuf.length + body.length;
}
const cdSize = central.reduce((s, b) => s + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(cdSize, 12); end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...local, ...central, end]);
fs.writeFileSync("brand/poof-brand-kit.zip", zip);
console.log(`brand/poof-brand-kit.zip: ${entries.length} files, ${(zip.length / 1024).toFixed(0)} KB`);
