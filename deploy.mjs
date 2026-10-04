// Uploads the Poof website to the hosting over FTPS.
// Usage: npm run deploy        (upload)
//        npm run deploy:dry    (only check the connection and list what would be uploaded)
import { Client } from "basic-ftp";
import fs from "node:fs";
import path from "node:path";

// Brand kit files shown and offered for download on usepoof.chat/docs/#/brandkit (served from /brand/).
const BRAND = [
  "svg/poof-logo-for-dark-bg.svg", "svg/poof-logo-for-light-bg.svg", "svg/poof-logo-currentcolor.svg",
  "svg/poof-mark.svg", "svg/poof-mark-padded.svg",
  "png-transparent/poof-logo-for-dark-bg-1600w.png", "png-transparent/poof-logo-for-dark-bg-800w.png",
  "png-transparent/poof-logo-for-light-bg-1600w.png", "png-transparent/poof-logo-for-light-bg-800w.png",
  "png-transparent/poof-mark-512.png", "png-transparent/poof-mark-1024.png", "png-transparent/poof-mark-2048.png",
  "poof-logo-on-dark.png", "x-avatar-400x400.png", "x-profile/poof-x-avatar-1000.png",
  "x-cover-1500x500.png", "x-cover-3000x1000.png",
  "telegram/avatar-ink.png", "telegram/avatar-rust.png", "telegram/portal.jpg", "telegram/portal.mp4",
  "telegram/welcome.jpg", "telegram/welcome.mp4",
  "poof-brand-kit.zip",
  ...fs.readdirSync("brand/telegram/emoji").filter(f => f.endsWith(".webm")).map(f => "telegram/emoji/" + f),
].map(f => "brand/" + f);
// Link previews: one image per page in og/, plus a small page per docs section (docs/<page>/index.html) and /join/
const listDir = (dir, test) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(test).map(f => path.posix.join(dir, f)) : [];
const PREVIEWS = [
  ...listDir("og", f => f.endsWith(".png")),
  ...fs.readdirSync("docs", {withFileTypes: true}).filter(e => e.isDirectory()).map(e => `docs/${e.name}/index.html`).filter(f => fs.existsSync(f)),
  "join/index.html",
];
// The client engine for live quant-rooms, built from usepoofchat/poof-app (`pnpm build:engine`), with its checksum.
const ENGINE = ["engine/poof-engine.js", "engine/poof-engine.js.sha256"];
const FILES = ["index.html", "favicon.svg", "og-image.png", "robots.txt", "apple-touch-icon.png", ".htaccess", "docs/index.html", "room/index.html", ...ENGINE, "stats/index.html", "buybot/index.html", ...listDir("buybot/media", () => true), ...BRAND, ...PREVIEWS];
const dry = process.argv.includes("--dry");
// Another target: node deploy.mjs --env=.env.staging  (default .env)
const ENV_FILE = (process.argv.find(a => a.startsWith("--env=")) || "--env=.env").slice(6);

function loadEnv() {
  // Local runs read .env; GitHub Actions passes the same names as environment variables (repo secrets).
  const env = {};
  for (const k of ["FTP_HOST", "FTP_USER", "FTP_PASSWORD", "FTP_PORT", "FTP_DIR", "FTP_SECURE"]) {
    if (process.env[k]) env[k] = process.env[k];
  }
  if (!fs.existsSync(ENV_FILE) && !env.FTP_HOST) {
    console.error(`Missing ${ENV_FILE}. Copy .env.example to ${ENV_FILE} and fill in the FTP details.`);
    process.exit(1);
  }
  const lines = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/) : [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  for (const k of ["FTP_HOST", "FTP_USER", "FTP_PASSWORD"]) {
    if (!env[k]) { console.error(`${ENV_FILE} is missing ${k}.`); process.exit(1); }
  }
  return env;
}

const env = loadEnv();
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.error(`File not found: ${f}`); process.exit(1); }
}

const client = new Client(30000);
try {
  await client.access({
    host: env.FTP_HOST,
    port: Number(env.FTP_PORT || 21),
    user: env.FTP_USER,
    password: env.FTP_PASSWORD,
    secure: env.FTP_SECURE !== "false",
    secureOptions: { servername: env.FTP_HOST },
  });
  const dir = env.FTP_DIR || "/";
  await client.ensureDir(dir);
  console.log(`Connected to ${env.FTP_HOST}, folder ${dir}`);
  for (const f of FILES) {
    const kb = (fs.statSync(f).size / 1024).toFixed(1);
    if (dry) { console.log(`would upload ${f} (${kb} KB)`); continue; }
    // files in sub-folders (docs/index.html) go into the same sub-folder on the server
    await client.ensureDir(path.posix.join(dir, path.posix.dirname(f)));
    await client.uploadFrom(f, path.posix.basename(f));
    console.log(`uploaded ${f} (${kb} KB)`);
  }
  console.log(dry ? "Dry run OK. Nothing was uploaded." : `Done. Uploaded to ${env.FTP_HOST}${dir}`);
} catch (err) {
  console.error("Deploy failed:", err.message);
  if (/certificate|altnames|self.signed/i.test(err.message)) {
    console.error("Tip: FTP_HOST must be the FTP server name given by the hosting, not the domain.");
  }
  if (/530|login|authentication/i.test(err.message)) {
    console.error("Tip: check FTP_USER (the full username, e.g. deploy@yourdomain) and FTP_PASSWORD in .env.");
  }
  process.exitCode = 1;
} finally {
  client.close();
}
