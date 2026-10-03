// Poof Telegram bot (@usepoofbot) - Cloudflare Worker
// Secret needed in the Worker settings: BOT_TOKEN (from @BotFather).
// After deploy, open https://<worker-url>/setup once to connect Telegram.

const SITE = 'https://usepoof.chat';
const LINKS = {
  website: SITE,
  x: 'https://x.com/usepoofchat',
  docs: SITE + '/docs/',
  github: 'https://github.com/usepoofchat',
  telegram: 'https://t.me/usepoofchat',
};
const OWNER_ID = 8984315558;            // Jason - only this account can run admin commands
const PORTAL = '@usepoofchat';          // Poof Portal channel
const VERIFY_URL = 'https://t.me/guardianapp/portal?startapp=HjxHQ5DKnoXIxGr4&mode=compact';
const IMG = 'https://raw.githubusercontent.com/usepoofchat/poof-site/main/brand/telegram/';
const IMG_FALLBACK = 'https://raw.githubusercontent.com/usepoofchat/poof-site/main/og-image.png';

const btn = (text, url) => ({ text, url });
const LINK_ROWS = [
  [btn('Website', LINKS.website), btn('X', LINKS.x)],
  [btn('Docs', LINKS.docs), btn('GitHub', LINKS.github)],
];

const TEXT = {
  links: '<b>Official Poof links</b>\n\nWebsite: usepoof.chat\nX: @usepoofchat\nDocs: usepoof.chat/docs\nGitHub: github.com/usepoofchat\nTelegram: t.me/usepoofchat\n\nAdmins never DM first.',
  website: '<b>Poof</b>\nPrivate rooms in your browser. No email, no phone, no account. Nothing is kept.\n\nusepoof.chat',
  x: '<b>Poof on X</b>\nNews and updates: @usepoofchat',
  docs: '<b>Poof docs</b>\nHow rooms work, security, threat model and FAQ.\n\nusepoof.chat/docs',
  github: '<b>Poof on GitHub</b>\ngithub.com/usepoofchat',
  ca: '<b>Contract address</b>\nThere is no contract address yet. The official one will be posted here, on usepoof.chat and on X (@usepoofchat) at launch.\n\nNever trust a CA sent to you in DMs.',
  rules: '<b>Poof - Group rules</b>\n\n1. Be respectful. No hate or harassment.\n2. No spam, shilling or unsolicited promotion.\n3. No links from members. Ask an admin to share one.\n4. Admins never DM first. Anyone who does is a scammer.\n5. No financial advice. Do your own research.\n6. English in the main chat.',
  start: '<b>Hi, I\'m the Poof bot.</b>\n\nPoof is a private, temporary chatroom in your browser. Talk freely. Then poof.\n\nCommands: /links /website /x /docs /github /ca /rules',
  portal: '<b>Welcome to Poof.</b>\n\nPrivate rooms in your browser. No email, no phone, no account. Nothing is kept.\n\nTap <b>Verify and join</b> to enter the community.\nAdmins never DM first.',
};

const ALIASES = {
  links: 'links', link: 'links', socials: 'links', help: 'start', start: 'start',
  website: 'website', site: 'website', web: 'website', app: 'website',
  x: 'x', twitter: 'x',
  docs: 'docs', documentation: 'docs', doc: 'docs',
  github: 'github', git: 'github',
  ca: 'ca', contract: 'ca',
  rules: 'rules',
};

const BUTTONS = {
  links: LINK_ROWS,
  start: LINK_ROWS,
  website: [[btn('Open usepoof.chat', LINKS.website)]],
  x: [[btn('Open @usepoofchat', LINKS.x)]],
  docs: [[btn('Read the docs', LINKS.docs)]],
  github: [[btn('Open GitHub', LINKS.github)]],
  ca: [[btn('Follow @usepoofchat', LINKS.x)]],
  rules: null,
};

async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function hookSecret(env) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('poof:' + env.BOT_TOKEN));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 48);
}

async function imageUrl(name) {
  const r = await fetch(IMG + name, { method: 'HEAD' });
  return r.ok ? IMG + name : IMG_FALLBACK;
}

async function postPortal(env) {
  const photo = await imageUrl('portal.jpg');
  const sent = await tg(env, 'sendPhoto', {
    chat_id: PORTAL,
    photo,
    caption: TEXT.portal,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [[btn('Verify and join', VERIFY_URL)], ...LINK_ROWS] },
  });
  if (sent.ok) {
    await tg(env, 'pinChatMessage', { chat_id: PORTAL, message_id: sent.result.message_id, disable_notification: true });
  }
  return sent;
}

async function handle(env, update) {
  const msg = update.message;
  if (!msg || !msg.text || !msg.text.startsWith('/')) return;
  const [raw] = msg.text.trim().split(/\s+/);
  const [cmdRaw, target] = raw.slice(1).toLowerCase().split('@');
  if (target && target !== 'usepoofbot') return;

  if (cmdRaw === 'postportal' && msg.chat.type === 'private' && msg.from && msg.from.id === OWNER_ID) {
    const r = await postPortal(env);
    await tg(env, 'sendMessage', { chat_id: msg.chat.id, text: r.ok ? 'Portal post published and pinned.' : 'Portal post failed: ' + r.description });
    return;
  }

  const key = ALIASES[cmdRaw];
  if (!key) return;
  const body = {
    chat_id: msg.chat.id,
    text: TEXT[key],
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (msg.chat.type !== 'private') body.reply_parameters = { message_id: msg.message_id, allow_sending_without_reply: true };
  if (BUTTONS[key]) body.reply_markup = { inline_keyboard: BUTTONS[key] };
  await tg(env, 'sendMessage', body);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!env.BOT_TOKEN) return new Response('BOT_TOKEN secret is missing', { status: 500 });

    if (url.pathname === '/setup') {
      const secret = await hookSecret(env);
      const r = await tg(env, 'setWebhook', {
        url: `${url.origin}/tg`,
        secret_token: secret,
        allowed_updates: ['message'],
        drop_pending_updates: true,
      });
      return Response.json(r);
    }

    if (url.pathname === '/tg' && request.method === 'POST') {
      if (request.headers.get('x-telegram-bot-api-secret-token') !== await hookSecret(env)) {
        return new Response('forbidden', { status: 403 });
      }
      const update = await request.json();
      try { await handle(env, update); } catch (e) { console.log('error', e && e.message); }
      return new Response('ok');
    }

    return new Response('Poof bot is running.');
  },
};
