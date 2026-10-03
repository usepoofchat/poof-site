# Poof website

Landing page and documentation for [usepoof.chat](https://usepoof.chat): a private, account-free, temporary chatroom.

- `index.html`: the landing page (HTML, CSS and JS in one file)
- `docs/index.html`: the documentation, served at `/docs/`
- `favicon.svg`, `apple-touch-icon.png`, `og-image.png`, `robots.txt`
- `brand/`: logo, mark and social assets (not deployed)
- `deploy.mjs`: uploads the site to the hosting over FTPS

## Run locally

```
npx serve .
```

Then open http://localhost:3000 (site) and http://localhost:3000/docs/ (docs).

## Deploy

Every push to `main` deploys automatically: GitHub Actions runs `deploy.mjs` with these repository secrets
(Settings → Secrets and variables → Actions):

- `FTP_HOST`: the FTP server shown in cPanel
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

## Hosting setup (once)

In cPanel:

- **FTP Accounts**: create an account for the domain with directory `public_html`, then note the server,
  username and port from **Configure FTP Client**.
- **SSL/TLS Status**: run AutoSSL so the site works over `https://`.
- If the hosting's default page shows instead of Poof, delete the default file from `public_html`
  (File Manager).

## Rolling back

```
git log
git checkout <commit> -- index.html
```

Then commit and push.
