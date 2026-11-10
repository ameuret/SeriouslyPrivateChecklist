# Requirements — SeriouslyPrivateChecklist

Status: agreed with the product owner (this document is the shared understanding).
Scope of the current phase: requirements + README only. Implementation follows.

## 1. Context and motivation

The goal is a **seriously private, web-based, serverless checklist / todo list** with two
features that existing tools do not offer together:

1. **Sharing via URL fragment encoding** — send the whole list to someone else by sending a link.
2. **Markdown-like checkbox rendering** — the list looks and behaves like Markdown task lists
   (`- [ ]` / `- [x]`), and items can be marked done ✅.

Gap analysis of the closest existing candidate, <https://onlinenotepad.net/todo/>:

| Need | onlinenotepad.net/todo | SeriouslyPrivateChecklist |
|---|---|---|
| Serverless / private | ✅ localStorage only, nothing sent to a server | ✅ same guarantee |
| Share list via URL fragment | ❌ no share-by-link | ✅ address bar *is* the share link |
| Markdown checkbox syntax | ❌ plain GUI checkboxes only | ✅ Markdown is the source of truth |
| Private (encrypted) sharing | ❌ none | ✅ optional passphrase encryption |

## 2. Product summary

A single-page, dependency-free web app. The checklist **is a Markdown document** (task list
syntax), encoded **live into the URL fragment** (`#…`) — the fragment is the *only* storage,
so the address bar is always a complete, shareable link. No account, no server-side storage,
no cookies, no localStorage, no tracking.

## 3. Definitions

- **Fragment** — the `#…` part of a URL. Per HTTP semantics it is *never sent to the server*
  in a request; it exists only in the browser.
- **Plain share link** — URL whose fragment carries the (compressed, base64url-encoded) Markdown.
- **Private share link** — URL whose fragment carries the same data encrypted with a passphrase
  (AES-256-GCM, key derived via PBKDF2-SHA-256, random salt + IV per share).

## 4. Functional requirements

| ID | Feature | Acceptance criteria |
|---|---|---|
| F1 | Render Markdown checklist | Lines `- [ ]` render as an unchecked box; `- [x]` / `- [X]` render as done ✅ with strikethrough. Other Markdown lines (headings, plain text) render as formatted text. |
| F2 | Markdown is the source of truth | Ticking a box rewrites the underlying line from `- [ ]` to `- [x]` (and back). Users can view/edit the raw Markdown directly. |
| F3 | Basic editing | Add item, delete item, reorder items (move up/down). Every change updates the Markdown. |
| F4 | URL-only state | No cookies, no localStorage, no session storage — the fragment is the single source of truth in the browser. Reloading with an empty fragment starts an empty list. Behavior is identical in private/incognito modes. |
| F5 | Live fragment sync | The URL fragment always reflects the current list (via `history.replaceState`, no history spam). Copying the address bar always yields a working share link. There is no local copy — nothing is persisted outside the URL. |
| F6 | Open a shared link | Opening a URL with a fragment loads that list into the editor and the fragment. |
| F7 | Share privately | "Share privately" prompts for a passphrase, encrypts the Markdown (PBKDF2-SHA-256, ≥ 600 000 iterations, random 16-byte salt, random 12-byte IV, AES-256-GCM), and puts `#e1.<base64url(salt‖iv‖ciphertext)>` in the fragment. Recipients are prompted for the passphrase; a wrong passphrase yields a clear error and no partial output. |
| F8 | Plain share format | Plain links use `#d1.<base64url(deflate-raw(markdown))>` (compressed with the CompressionStream API before encoding to keep URLs short). The `d1`/`e1` prefixes version the format. |
| F9 | URL length indicator | The UI shows the current fragment length. Soft warning above ~2 000 chars (many messengers truncate long links), hard warning above ~8 000 chars, error if the browser refuses the URL — the list keeps working locally regardless. |
| F10 | Export | "Copy as Markdown" (clipboard) and "Download .md" both produce the raw Markdown. |
| F11 | Offline | Once loaded, the app works fully offline (no external requests; optionally a service worker for repeat visits). |
| F12 | No accounts / no tracking | No sign-up, no cookies, no analytics, no third-party requests of any kind. |

## 5. Non-functional requirements

### 5.1 Privacy (core promise)

- **N1 — Serverless:** the app is static files only. There is no backend, no database, no API.
  The fragment is never transmitted to any server (HTTP fragments are client-side by spec).
  No cookies and no localStorage are used at all, so behavior is identical in
  private/incognito modes, where storage is restricted or lingers after the session closes.
- **N2 — No telemetry:** no analytics, no trackers, no cookies, no fingerprinting, no external fonts/CDN.
- **N3 — Optional end-to-end encryption** for sharing (F7). The passphrase is never stored,
  never sent anywhere, and never logged.
- **N4 — Threat-model honesty:** the README must state the residual risks: the link can appear
  in browser history, clipboard, screen shares, and shoulder surfing; a shared plain link is
  readable by anyone who has it; a forgotten passphrase means the shared copy is unrecoverable.
  The README also documents mitigation guidance for private/incognito navigation (the session
  ends only when ALL private windows and tabs are closed; RAM traces may persist afterwards),
  plus clipboard hygiene and screen-share awareness.

### 5.2 Economy

- **N5 — Zero marginal cost:** hostable on any static host. Canonical deployment target is the
  free GitHub Pages tier at <https://ameuret.github.io/SeriouslyPrivateChecklist/> (activated).
  No build step, no runtime dependencies today (a compression library may be vendored later
  under the responsible supply-chain policy), no paid services.

### 5.3 Security

- **N6 — XSS-safe rendering:** list content is rendered exclusively via `textContent` / DOM node
  APIs — never `innerHTML` with user data. Strict Content-Security-Policy (assets served as
  separate same-origin files so inline script can be disallowed).
- **N7 — Crypto hygiene:** WebCrypto only (no hand-rolled crypto); AES-256-GCM authenticated
  encryption; fresh random salt and IV per encryption; constant-time comparison is delegated to
  the GCM authentication tag.
- **N8 — Secure context:** encryption requires a secure context (HTTPS or `localhost`); the app
  detects `window.isSecureContext` and degrades to plain-only sharing with a clear message.

### 5.4 URL length limits

| Boundary | Practical limit | Handling |
|---|---|---|
| Messenger/email truncation | ~2 000 chars (varies by app) | soft warning; suggest "Copy as Markdown" fallback |
| General shareability | ~8 000 chars | hard warning |
| Safari (historical) | ~64 KB full URL | warning + rely on compression |
| Chrome/Edge/Firefox fragments | up to ~2 MB | accepted; local use unaffected |
| Server limits (~8 KB) | **irrelevant** — fragments never reach the server | stated in README so users don't worry |

Deflate compression before base64url typically shrinks checklist text by 60–70 %, keeping
realistic shopping-list-sized checklists well under the 2 000-char soft limit.

### 5.5 Performance & compatibility

- **N9 — Tiny:** total payload target < 100 KB, loads instantly, zero network requests beyond its own static files.
- **N10 — Browsers:** latest Chrome, Edge, Firefox, Safari (requires `CompressionStream` and WebCrypto). Unsupported browsers get a clear message instead of a broken page.
- **N11 — Accessibility:** fully keyboard operable, proper ARIA roles/labels on checkboxes, readable contrast, respects `prefers-color-scheme`.
- **N12 — i18n:** English first, French second.

## 6. Out of scope for v1

Accounts and login; real-time multi-user collaboration; due dates, times and reminders; multiple
named lists (a single Markdown document can contain `#` sections instead); native mobile apps;
browser extensions; sync across devices.

## 7. Open risks

- Long lists shared through truncating messengers → mitigated by F8 compression + F9 warnings + F10 Markdown fallback.
- URL-only storage means closing the tab without copying the link loses the list → mitigated by the always-visible address bar and a persistent "Copy link" action; documented in the README.
- Passphrase loss → unrecoverable by design; documented.

## 8. Decision log

| Decision | Source |
|---|---|
| Storage is **URL-fragment-only** — supersedes the initial hybrid localStorage+fragment idea: private navigation modes restrict cookies/localStorage yet let them linger after the session, so no storage is used at all | owner review after enabling GitHub Pages |
| Passphrase encryption is optional, not mandatory | owner interview |
| The Markdown document is the literal source of truth | owner interview |
| v1 scope: single-document checklist; no accounts, reminders, or multiple named lists | owner interview |
| Canonical host: GitHub Pages at <https://ameuret.github.io/SeriouslyPrivateChecklist/> — activated | owner, after enabling Pages |
| Sharing is non-destructive for the sender's local list (corrects a draft README claim that sharing would wipe local data) | owner review of README |
| README documents private-navigation (incognito) guidance and AI-assistance transparency | owner review of README |
| Project is in **alpha**: top warning banner in README + self-contained `index.html` landing page on GitHub Pages (replaces the 404); projected features marked unavailable | owner request |
