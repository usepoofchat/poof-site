# Poof website

Landing page and documentation for [usepoof.chat](https://usepoof.chat): a private, account-free, temporary chatroom.

- `index.html`: the landing page (HTML, CSS and JS in one file)
- `docs/index.html`: the documentation, served at `/docs/`
- `room/index.html`: create and use a quant-room; `join/index.html` opens invite links
- `engine/poof-engine.js`: the client engine for live quant-rooms (encryption, WebRTC, signaling), copied from a build of [usepoofchat/poof-app](https://github.com/usepoofchat/poof-app) (`pnpm build:engine`); `poof-engine.js.sha256` says which commit. Cloudflare caches `.js` files, so pages import it as `poof-engine.js?v=<first 12 characters of its SHA-256>`: after replacing the engine, update `?v=` in `index.html` and `room/index.html`
- `favicon.svg`, `apple-touch-icon.png`, `og-image.png`, `robots.txt`
- `.htaccess`: cache rules (HTML always revalidated, images cached for a day)
- `brand/`: logo, mark and social assets; the files offered in the docs brand kit are deployed to `/brand/`
- `scripts/brand-zip.mjs`: rebuilds `brand/poof-brand-kit.zip` (`npm run brand-zip`)
- `deploy.mjs`: uploads the site to the hosting over FTPS

## Run locally

```
npx serve .
```

Then open http://localhost:3000 (site) and http://localhost:3000/docs/ (docs).

## Deploy

Every push to `main` deploys automatically: GitHub Actions runs `deploy.mjs` with these repository secrets
(Settings → Secrets and variables → Actions):

- `FTP_HOST`: the FTP server
- `FTP_USER`: the full FTP username
- `FTP_PASSWORD`: the FTP account password
- optional: `FTP_PORT` (default `21`), `FTP_DIR` (default `/`)

Progress is visible in the **Actions** tab (green check = live, about 30 seconds).

### Manual deploy

1. Copy `.env.example` to `.env` and fill it in. `.env` is git-ignored and never leaves your machine.
2. `npm install`
3. `npm run deploy:dry` checks the FTP connection and lists the files, without uploading.
4. `npm run deploy` uploads the site.

To deploy to another hosting account, create another env file (e.g. `.env.staging`, also git-ignored)
and run `node deploy.mjs --env=.env.staging`.

## Rolling back

```
git log
git checkout <commit> -- index.html
```

Then commit and push.
