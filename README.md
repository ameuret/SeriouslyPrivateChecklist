# ✅ SeriouslyPrivateChecklist

[![License: Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](https://unlicense.org)
[![Serverless](https://img.shields.io/badge/serverless-100%25-success.svg)](#)
[![No tracking](https://img.shields.io/badge/tracking-none-success.svg)](#)

> [!WARNING]
> **Alpha phase.** This project has not yet reached acceptable maturity. The features described below are **projected and not yet available**.

A seriously **private**, **serverless** checklist you **share** with a simple link.

📝 No account.

🌐 No server.

🛜 No tracking.

——

🧘‍♀️ Your list lives in your browser, in the URL itself

🔀 The address bar is always a complete, ready-to-send copy of your checklist.

🔗 The list lives **only in the URL** — nothing is ever written to cookies or storage on your device.

## Features

- ✅ **Markdown task lists** — your checklist *is* Markdown: `- [ ] buy milk` → `- [x] buy milk`.
  Tick a box and the Markdown updates; edit the raw Markdown directly whenever you want.
- 🔗 **Share by URL** — the list is encoded into the URL fragment (`#…`), which is never sent
  to any server. Copy the address bar, paste it anywhere, done.
- 🔒 **Optional private sharing** — encrypt the link with a passphrase (AES-256-GCM via WebCrypto).
  Only people with the passphrase can read the list.
- 🌐 **Lives in the URL** — the fragment is the only storage; nothing touches cookies or localStorage; works fully offline once loaded.
- 📏 **URL length awareness** — compressed encoding keeps links short, with warnings if a link
  gets too long for some messengers.
- 📋 **Export** — copy the list as Markdown or download it as a `.md` file.

## How sharing works

```
https://ameuret.github.io/SeriouslyPrivateChecklist/#d1.<base64url(deflate(markdown))>     ← plain share link
https://ameuret.github.io/SeriouslyPrivateChecklist/#e1.<base64url(salt‖iv‖AES-256-GCM)>   ← passphrase-encrypted link
```

The `#…` fragment stays in the browser by HTTP design — no server ever sees it.
Open a link and the list appears; open an encrypted one and you'll be asked for the passphrase.

## Privacy guarantees

- **Zero server-side anything.** Static files only; there is no backend to breach, subpoena, or trust.
- **No cookies, no analytics, no third-party requests, no external assets.**
- **No localStorage either** — the URL fragment is the only storage, so private/incognito modes behave identically (no site data lingering after the session).
- **Fragments are never transmitted** in HTTP requests — only the page path is.
- **Optional end-to-end encryption** for links you send (fresh salt + IV per share; the
  passphrase is never stored or sent).
- **Responsible supply chain defense policy.** Reputable dependencies with update cooldowns.
- **Honest residual risks:**
  - a link can end up in browser history -> use private navigation
  - a link can linger in your clipboard -> review your OS settings
  - a link can leak in a screen share
  - a plain link is readable by anyone who has it
  - private navigation modes are private if used correctly. See below!
  - a forgotten passphrase means the shared copy is **gone for good**.

## On private navigation (aka Incognito) and how to use it securely

⚠️ The key detail: **the session doesn't end when you close a single tab**.

It ends only when **ALL** private windows and tabs are closed.

Until then:
 - The in-memory **history** list persists (yes, even of closed tabs!)
 - Cookies and site data for the session remain active
 - Multiple private tabs/windows share the same session state 
 
Wikipedia also notes a subtler issue:

*"Data erasure by the browser alone is found to be insufficient. For example, the records of visited websites during the private session can be retained in memory for a long time even after the private session is closed."*
Meaning RAM may hold traces even after the window closes, until the process is killed or memory is reused. 

## A note on URL length

Fragments never hit the server, so server URL limits don't apply. Desktop browsers accept very
long fragments (Chrome/Firefox up to ~2 MB, Safari historically ~64 KB). The real limit is
**shareability**: many messengers and mail clients truncate links around 2 000–8 000 characters.
The app compresses the list before encoding (typically −60–70 %) and warns you when a link gets
long — with a one-click "Copy as Markdown" fallback.

## Tech approach

Vanilla HTML/CSS/JS, no framework: the URL fragment is the only storage (live
`history.replaceState` sync), compression + base64url for encoding (built-in
CompressionStream today; a small compression library may be vendored later under the
supply-chain policy above), WebCrypto (PBKDF2-SHA-256 → AES-256-GCM) for private links,
strict CSP, and XSS-safe DOM rendering only.

## Contributing

Ideas, issues and PRs welcome. Please read [REQUIREMENTS.md](REQUIREMENTS.md) first — it
captures the agreed scope, especially what's deliberately out of scope for v1.

## AI or no AI

This tool is developed by me personally (unless you’re using a git clone or a derivative), with full transparency, partly with the assistance of coding agents.

Such is the present and the future until someone comes from the future to change this. Open source is meant to promote human **entraide** for the greater good, not private interests — which makes it a deeply real moral concern that benevolent developers may unknowingly contribute their work to LLM training data. It’s a multifaceted issue unlikely to find a practical outcome soon, let’s keep looking for one.

## License

Released into the public domain under the [Unlicense](LICENSE). Do whatever you want with it.
