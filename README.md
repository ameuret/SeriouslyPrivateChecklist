# ✅ SeriouslyPrivateChecklist

**A seriously private, serverless checklist you share with a link.**

No account. No server. No tracking. Your list lives in your browser and in the URL itself —
so the address bar is always a complete, ready-to-send copy of your checklist.

[![License: Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](https://unlicense.org)
[![Serverless](https://img.shields.io/badge/serverless-100%25-success.svg)](#)
[![No tracking](https://img.shields.io/badge/tracking-none-success.svg)](#)

## Features

- ✅ **Markdown task lists** — your checklist *is* Markdown: `- [ ] buy milk` → `- [x] buy milk`.
  Tick a box and the Markdown updates; edit the raw Markdown directly whenever you want.
- 🔗 **Share by URL** — the list is encoded into the URL fragment (`#…`), which is never sent
  to any server. Copy the address bar, paste it anywhere, done.
- 🔒 **Optional private sharing** — encrypt the link with a passphrase (AES-256-GCM via WebCrypto).
  Only people with the passphrase can read the list.
- 💾 **Autosaves locally** — everything persists in `localStorage`; works fully offline once loaded.
- 📏 **URL length awareness** — compressed encoding keeps links short, with warnings if a link
  gets too long for some messengers.
- 📋 **Export** — copy the list as Markdown or download it as a `.md` file.

## How sharing works

```
https://<host>/index.html#d1.<base64url(deflate(markdown))>     ← plain share link
https://<host>/index.html#e1.<base64url(salt‖iv‖AES-256-GCM)>   ← passphrase-encrypted link
```

The `#…` fragment stays in the browser by HTTP design — no server ever sees it.
Open a link and the list appears; open an encrypted one and you'll be asked for the passphrase.

## Privacy guarantees

- **Zero server-side anything.** Static files only; there is no backend to breach, subpoena, or trust.
- **No cookies, no analytics, no third-party requests, no external assets.**
- **Fragments are never transmitted** in HTTP requests — only the page path is.
- **Optional end-to-end encryption** for links you send (fresh salt + IV per share; the
  passphrase is never stored or sent).
- **Honest residual risks:** a link can end up in browser history, your clipboard, or a screen
  share; a plain link is readable by anyone who has it; a forgotten passphrase means the shared
  copy is gone for good.

## A note on URL length

Fragments never hit the server, so server URL limits don't apply. Desktop browsers accept very
long fragments (Chrome/Firefox up to ~2 MB, Safari historically ~64 KB). The real limit is
**shareability**: many messengers and mail clients truncate links around 2 000–8 000 characters.
The app compresses the list before encoding (typically −60–70 %) and warns you when a link gets
long — with a one-click "Copy as Markdown" fallback.

## Run it

It's a static site — no build step, no dependencies:

```bash
git clone https://github.com/ameuret/SeriouslyPrivateChecklist.git
cd SeriouslyPrivateChecklist
# serve the folder with any static server, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000
```

Or deploy the folder to any static host (GitHub Pages works out of the box, free).
Encryption and compression require a secure context (HTTPS or `localhost`).

## Status

📝 **Requirements & design phase** — the full functional and non-functional requirements
(privacy model, URL-length limits, security, scope) are in
[**REQUIREMENTS.md**](REQUIREMENTS.md). Implementation follows that document.

## Tech approach

Vanilla HTML/CSS/JS, no framework, no runtime dependencies: `localStorage` for persistence,
live `history.replaceState` for fragment sync, CompressionStream (deflate) + base64url for
encoding, WebCrypto (PBKDF2-SHA-256 → AES-256-GCM) for private links, strict CSP, and
XSS-safe DOM rendering only.

## Contributing

Ideas, issues and PRs welcome. Please read [REQUIREMENTS.md](REQUIREMENTS.md) first — it
captures the agreed scope, especially what's deliberately out of scope for v1.

## License

Released into the public domain under the [Unlicense](LICENSE). Do whatever you want with it.
