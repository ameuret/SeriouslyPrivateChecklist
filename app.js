'use strict';

const FRAGMENT_PLAIN = 'd1.';
const FRAGMENT_ENC = 'e1.';
const PBKDF2_ITERATIONS = 600000;
const SOFT_LIMIT = 2000;
const HARD_LIMIT = 8000;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function b64urlEncode(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function compressText(str) {
  const cs = new CompressionStream('deflate-raw');
  const stream = new Blob([str]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompressBytes(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return textDecoder.decode(await new Response(stream).arrayBuffer());
}

async function encodePlainFragment(markdown) {
  return FRAGMENT_PLAIN + b64urlEncode(await compressText(markdown));
}

async function decodePlainPayload(payload) {
  return decompressBytes(b64urlDecode(payload));
}

async function deriveKey(passphrase, salt) {
  const baseKey = await crypto.subtle.importKey(
    'raw', textEncoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptFragment(markdown, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, textEncoder.encode(markdown)));
  const payload = new Uint8Array(16 + 12 + ct.length);
  payload.set(salt, 0);
  payload.set(iv, 16);
  payload.set(ct, 28);
  return FRAGMENT_ENC + b64urlEncode(payload);
}

async function decryptPayload(payload, passphrase) {
  const raw = b64urlDecode(payload);
  if (raw.length < 29) throw new Error('Malformed encrypted link');
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const ct = raw.slice(28);
  const key = await deriveKey(passphrase, salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return textDecoder.decode(pt);
}

function parseFragment(hash) {
  if (!hash || hash.length < 2) return null;
  const frag = hash.startsWith('#') ? hash.slice(1) : hash;
  if (frag.startsWith(FRAGMENT_PLAIN)) return { type: 'plain', payload: frag.slice(FRAGMENT_PLAIN.length) };
  if (frag.startsWith(FRAGMENT_ENC)) return { type: 'encrypted', payload: frag.slice(FRAGMENT_ENC.length) };
  return { type: 'unknown', payload: frag };
}

const TASK_RE = /^(\s*[-*+]\s+)\[([ xX])\]\s+(.*)$/;

function parseMarkdown(md) {
  return md.split('\n').map((raw) => {
    const m = raw.match(TASK_RE);
    if (m) return { type: 'task', raw, done: m[2] !== ' ', text: m[3] };
    const h = raw.match(/^(#{1,6})\s+(.*)$/);
    if (h) return { type: 'heading', level: h[1].length, text: h[2], raw };
    return { type: 'text', text: raw, raw };
  });
}

function toggleTaskLine(raw) {
  return raw.replace(TASK_RE, (m, prefix, mark, rest) =>
    prefix + (mark === ' ' ? '[x]' : '[ ]') + ' ' + rest);
}

function replaceLine(markdown, index, newRaw) {
  const lines = markdown.split('\n');
  lines[index] = newRaw;
  return lines.join('\n');
}

function getTitle(markdown) {
  for (const line of parseMarkdown(markdown)) {
    if (line.type === 'heading' && line.level === 1) return line.text;
  }
  return '';
}

function setTitle(markdown, title) {
  const clean = title.replace(/\s+/g, ' ').trim();
  const lines = markdown.split('\n');
  const index = lines.findIndex((l) => /^#\s+/.test(l));
  if (!clean) {
    if (index === -1) return markdown;
    lines.splice(index, 1);
    return lines.join('\n');
  }
  const heading = '# ' + clean;
  if (index === -1) {
    if (!lines.some((l) => l.trim())) return heading;
    return heading + '\n\n' + lines.join('\n');
  }
  lines[index] = heading;
  return lines.join('\n');
}

function moveLine(markdown, index, delta) {
  const lines = markdown.split('\n');
  const j = index + delta;
  if (j < 0 || j >= lines.length) return markdown;
  [lines[index], lines[j]] = [lines[j], lines[index]];
  return lines.join('\n');
}

function removeLine(markdown, index) {
  const lines = markdown.split('\n');
  lines.splice(index, 1);
  return lines.join('\n');
}

function appendTask(markdown, text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return markdown;
  const sep = markdown && !markdown.endsWith('\n') ? '\n' : '';
  return markdown + sep + '- [ ] ' + clean;
}

function isSupported() {
  return typeof CompressionStream !== 'undefined' &&
    typeof DecompressionStream !== 'undefined' &&
    typeof crypto !== 'undefined' && crypto.subtle;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FRAGMENT_PLAIN, FRAGMENT_ENC, SOFT_LIMIT, HARD_LIMIT,
    b64urlEncode, b64urlDecode, compressText, decompressBytes,
    encodePlainFragment, decodePlainPayload, encryptFragment, decryptPayload,
    parseFragment, parseMarkdown, toggleTaskLine, replaceLine, moveLine,
    removeLine, appendTask, getTitle, setTitle, isSupported,
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => initApp());
}

function initApp() {
  if (!isSupported()) {
    showStatus('This browser lacks CompressionStream or WebCrypto — the app cannot run here.', 'error');
    return;
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  const state = { markdown: '', passphrase: null };

  const listEl = document.getElementById('list');
  const rawEl = document.getElementById('raw');
  const statusEl = document.getElementById('status');
  const lengthEl = document.getElementById('length');
  const newTaskEl = document.getElementById('new-task');
  const titleEl = document.getElementById('list-title');
  const titleInput = document.getElementById('title-input');
  const editTitleBtn = document.getElementById('edit-title');
  let titleEditing = false;
  const passPanel = document.getElementById('pass-panel');
  const passInput = document.getElementById('pass-input');
  const passError = document.getElementById('pass-error');
  let passCallback = null;

  function showStatus(msg, kind) {
    statusEl.textContent = msg || '';
    statusEl.className = 'status ' + (kind || '');
  }

  function updateLength() {
    const len = location.hash.length;
    let cls = 'ok', msg = 'Link length: ' + len + ' chars';
    if (len > HARD_LIMIT) { cls = 'error'; msg += ' — too long for some browsers/messengers; use Copy Markdown instead'; }
    else if (len > SOFT_LIMIT) { cls = 'warn'; msg += ' — may be truncated by some messengers; Copy Markdown is safer'; }
    lengthEl.textContent = msg;
    lengthEl.className = 'length ' + cls;
  }

  let syncTimer = null;
  function scheduleSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncFragment, 150);
  }

  async function syncFragment() {
    try {
      const frag = state.passphrase
        ? await encryptFragment(state.markdown, state.passphrase)
        : await encodePlainFragment(state.markdown);
      history.replaceState(null, '', '#' + frag);
    } catch (e) {
      showStatus('Could not update the URL (list still works): ' + e.message, 'error');
    }
    updateLength();
  }

  function setMarkdown(md, sync) {
    state.markdown = md;
    render();
    if (rawEl && !rawEl.hidden) rawEl.value = md;
    if (sync !== false) scheduleSync();
  }

  function render() {
    if (!titleEditing) {
      titleEl.textContent = getTitle(state.markdown) || 'Untitled checklist';
    }
    listEl.textContent = '';
    const lines = parseMarkdown(state.markdown);
    const titleIdx = lines.findIndex((l) => l.type === 'heading' && l.level === 1);
    if (!lines.some((l, i) =>
      i !== titleIdx && (l.type !== 'text' || l.text.trim() !== ''))) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Empty list — add your first item above.';
      listEl.appendChild(li);
      return;
    }
    lines.forEach((line, index) => {
      if (index === titleIdx) return;
      if (line.type === 'task') {
        const li = document.createElement('li');
        li.className = 'task' + (line.done ? ' done' : '');
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = line.done;
        cb.setAttribute('aria-label', 'Mark done: ' + line.text);
        cb.addEventListener('change', () => {
          setMarkdown(replaceLine(state.markdown, index, toggleTaskLine(line.raw)));
        });
        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = (line.done ? '✅ ' : '') + line.text;
        label.appendChild(cb);
        label.appendChild(span);
        const up = mkBtn('↑', 'Move up: ' + line.text, () => setMarkdown(moveLine(state.markdown, index, -1)));
        const down = mkBtn('↓', 'Move down: ' + line.text, () => setMarkdown(moveLine(state.markdown, index, 1)));
        const del = mkBtn('✕', 'Delete: ' + line.text, () => setMarkdown(removeLine(state.markdown, index)));
        li.appendChild(label);
        li.appendChild(up);
        li.appendChild(down);
        li.appendChild(del);
        listEl.appendChild(li);
      } else if (line.type === 'heading') {
        const h = document.createElement('h' + Math.min(line.level + 1, 6));
        h.textContent = line.text;
        listEl.appendChild(h);
      } else {
        const p = document.createElement('li');
        p.className = 'text-line';
        p.textContent = line.text;
        listEl.appendChild(p);
      }
    });
  }

  function mkBtn(txt, aria, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'row-btn';
    b.textContent = txt;
    b.setAttribute('aria-label', aria);
    b.addEventListener('click', fn);
    return b;
  }

  function openPassPanel(mode, cb) {
    passCallback = cb;
    passError.textContent = '';
    passInput.value = '';
    document.getElementById('pass-title').textContent =
      mode === 'decrypt' ? 'This link is encrypted — enter the passphrase' : 'Choose a passphrase for an encrypted link';
    passPanel.hidden = false;
    passInput.focus();
  }

  function closePassPanel() {
    passPanel.hidden = true;
    passCallback = null;
  }

  document.getElementById('pass-ok').addEventListener('click', async () => {
    const pw = passInput.value;
    if (!pw) { passError.textContent = 'Passphrase cannot be empty.'; return; }
    const cb = passCallback;
    closePassPanel();
    if (cb) await cb(pw);
  });
  document.getElementById('pass-cancel').addEventListener('click', () => {
    const cb = passCallback;
    closePassPanel();
    if (cb) cb(null);
  });
  passInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('pass-ok').click();
  });

  function addTask() {
    const next = appendTask(state.markdown, newTaskEl.value);
    if (next !== state.markdown) {
      newTaskEl.value = '';
      setMarkdown(next);
    }
  }
  document.getElementById('add-btn').addEventListener('click', addTask);
  newTaskEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });

  function commitTitleEdit(commit) {
    if (!titleEditing) return;
    const value = titleInput.value;
    titleEditing = false;
    titleInput.hidden = true;
    titleEl.hidden = false;
    editTitleBtn.hidden = false;
    if (commit) {
      const next = setTitle(state.markdown, value);
      if (next !== state.markdown) setMarkdown(next);
    }
  }
  function beginTitleEdit() {
    if (titleEditing) return;
    titleEditing = true;
    titleEl.hidden = true;
    editTitleBtn.hidden = true;
    titleInput.hidden = false;
    titleInput.value = getTitle(state.markdown);
    titleInput.focus();
    titleInput.select();
  }
  editTitleBtn.addEventListener('click', beginTitleEdit);
  titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitTitleEdit(true);
    else if (e.key === 'Escape') commitTitleEdit(false);
  });
  titleInput.addEventListener('blur', () => commitTitleEdit(true));

  document.getElementById('copy-link').addEventListener('click', async () => {
    await syncFragment();
    try {
      await navigator.clipboard.writeText(location.href);
      showStatus('Link copied — it contains the whole list.', 'ok');
    } catch (e) {
      showStatus('Copy the URL from the address bar instead.', 'warn');
    }
  });

  const shareBtn = document.getElementById('share-private');
  if (!window.isSecureContext) {
    shareBtn.disabled = true;
    shareBtn.title = 'Requires a secure context (HTTPS or localhost)';
  } else {
    shareBtn.addEventListener('click', () => {
      openPassPanel('encrypt', async (pw) => {
        if (!pw) return;
        state.passphrase = pw;
        await syncFragment();
        showStatus('Encrypted link is in the address bar. The passphrase is kept only in memory.', 'ok');
      });
    });
  }

  document.getElementById('copy-md').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(state.markdown);
      showStatus('Markdown copied.', 'ok');
    } catch (e) {
      rawEl.hidden = false;
      rawEl.value = state.markdown;
      rawEl.select();
      showStatus('Select and copy the Markdown from the editor below.', 'warn');
    }
  });

  document.getElementById('download-md').addEventListener('click', () => {
    const blob = new Blob([state.markdown], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'checklist.md';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('edit-md').addEventListener('click', () => {
    const show = rawEl.hidden;
    rawEl.hidden = !show;
    document.getElementById('edit-md').textContent = show ? '👁 View list' : '✏️ Edit Markdown';
    if (show) {
      rawEl.value = state.markdown;
      rawEl.focus();
    } else {
      setMarkdown(rawEl.value);
    }
  });

  rawEl.addEventListener('input', () => {
    state.markdown = rawEl.value;
    render();
    scheduleSync();
  });

  (async function load() {
    const parsed = parseFragment(location.hash);
    if (!parsed) {
      setMarkdown('# My checklist\n\n- [ ] Try the app\n', false);
      await syncFragment();
      return;
    }
    if (parsed.type === 'plain') {
      try {
        setMarkdown(await decodePlainPayload(parsed.payload), false);
        await syncFragment();
      } catch (e) {
        showStatus('Could not decode this link: ' + e.message, 'error');
      }
    } else if (parsed.type === 'encrypted') {
      openPassPanel('decrypt', async (pw) => {
        if (!pw) { showStatus('Encrypted link not loaded.', 'warn'); return; }
        try {
          const md = await decryptPayload(parsed.payload, pw);
          state.passphrase = pw;
          setMarkdown(md, false);
          await syncFragment();
          showStatus('Decrypted. Edits keep the link encrypted (passphrase stays in memory only).', 'ok');
        } catch (e) {
          showStatus('Wrong passphrase or corrupted link.', 'error');
        }
      });
    } else {
      showStatus('Unrecognized link format — starting with an empty list.', 'warn');
      setMarkdown('', false);
      await syncFragment();
    }
    updateLength();
  })();
}
