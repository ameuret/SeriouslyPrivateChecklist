# FEATURES — user-facing behavior as observable workflows

Feature specifications in a Gherkin-like dialect: short description, the workflow as
Given/When bullets, and the expected observation. One block per user-facing feature.
Acceptance tests (manual or Playwright specs under `tests/e2e/`) follow these blocks;
IDs map to the functional requirements in [REQUIREMENTS.md](REQUIREMENTS.md).

---

# Checklist rendering (F1)

- Given a list whose lines are Markdown (`- [ ]`, `- [x]`, headings, plain text)
- When the page loads
- Then tasks render as checkboxes, done items show a strikethrough, checkboxes ticked
  in the UI match the `[x]` marks in the Markdown.

# Checkbox interaction — Markdown is the source of truth (F2)

- Given a rendered task list
- When you click a checkbox
- Then the underlying Markdown line flips `- [ ]` / `- [x]` (inspect via Edit Markdown),
  the item's style and the URL fragment both update.

# Title editing (new, post-MVP)

- Given the checklist shows its title next to the pencil button
- When you click the pencil
- Then an in-place editor opens, prefilled, with the title hidden.

- Given the editor is open
- When you press Enter or click elsewhere
- Then the title commits; the fragment re-encodes; after a reload the shared link
  still carries the new title.

- Given the editor is open
- When you press Escape
- Then the edit is discarded and the previous title restored.

# Adding, moving, deleting items (F3)

- Given the "Add an item" input
- When you type text and press Enter (or click Add)
- Then a new unchecked item appears at the end of the list and the Markdown updates.
- When you click ↑ / ↓ on an item
- Then the item swaps with its neighbor in UI and Markdown (no-op at list edges).
- When you click ✕ on an item
- Then the item is removed from UI and Markdown.

# Live fragment sync and link sharing (F5, F8)

- Given any list state (edit, tick, move, title change)
- When the change settles (~150 ms)
- Then the URL fragment always encodes the current list; copying the address bar
  always yields a complete share link (`#d1.<base64url(deflate-raw(markdown))>`).

# Opening a shared plain link (F6)

- Given a plain `#d1.` link to a list
- When you open it
- Then the list renders exactly as the sender left it.

# Private sharing by passphrase (F7)

- Given a list you want to send privately
- When you click "Share privately" and enter a passphrase
- Then the fragment becomes `#e1.<salt‖iv‖AES-256-GCM ciphertext>`; the passphrase
  is never stored or transmitted.

- Given an encrypted `#e1.` link
- When you open it and enter the passphrase
- Then it decrypts and renders; subsequent edits stay encrypted.
- When the passphrase is wrong
- Then a clear error shows and no list data leaks to the UI.

# Export as Markdown (F10)

- Given any list
- When you click "Copy Markdown" or "Download .md"
- Then the exported document is the raw Markdown.

# Raw Markdown editor (F2)

- Given the list view
- When you toggle "Edit Markdown"
- Then a textarea shows the source; your edits render back on exit.

# URL length indicator (F9)

- Given a list whose encoded link grows
- When the fragment passes ~2 000 then ~8 000 chars
- Then the indicator warns, then errors — while the list keeps working locally.

# Offline operation (F11)

- Given the page loaded once
- When the network drops (or you reload from cache)
- Then everything above keeps working; no external requests occur.

# Native share sheet on mobile (planned)

- Given a mobile OS (Android/iOS) and a Web Share capable browser
- When you tap the share button
- Then the native share panel pops up, offering the URL to send.
- Given a browser without Web Share (desktop)
- When you tap the share button
- Then the UI falls back to the existing "Copy link" flow.

⚠ Testing constraint: the native sheet itself cannot be simulated by Playwright +
Chromium (OS-level UI, and `navigator.share` isn't wired on desktop Chromium) —
stub the API at its boundary in specs, and verify the real sheet on hardware once.
