/*
   Markdown script.js
   State, rendering, layout, drag-and-drop, mobile tabs, resize
*/

/* State */
let currentTheme   = 'github';
let currentLayout  = 'split';
let currentMobTab  = 'editor';
let hasContent     = false;
let isMobile       = false;

/* DOM refs */
const editor        = document.getElementById('editor');
const editorWrap    = document.getElementById('editor-wrap');
const editorPane    = document.getElementById('editor-pane');
const editorStatus  = document.getElementById('editor-statusbar');
const dropZone      = document.getElementById('drop-zone');
const previewPane   = document.getElementById('preview-pane');
const previewDoc    = document.getElementById('preview-doc');
const previewEmpty  = document.getElementById('preview-empty');
const fileInput     = document.getElementById('file-input');
const workspace     = document.getElementById('workspace');
const resizer       = document.getElementById('resizer');

/* Marked renderer setup */
const renderer = new marked.Renderer();

// GFM task-list checkboxes
renderer.checkbox = (checked) =>
  `<input type="checkbox" ${checked ? 'checked' : ''} disabled> `;

// Syntax-highlighted fenced code blocks
renderer.code = (code, lang) => {
  const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(code, { language: validLang }).value;
  const label = (validLang !== 'plaintext' && lang)
    ? `<span class="code-lang-label">${escapeHtml(lang)}</span>` : '';
  return `<pre>${label}<code class="hljs language-${validLang}">${highlighted}</code></pre>`;
};

marked.use({ renderer, gfm: true, breaks: false, pedantic: false });

/* Utility */
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function isMobileViewport() {
  return window.innerWidth <= 640;
}

/* Render */
function render(md) {
  if (!md || !md.trim()) {
    previewDoc.style.display  = 'none';
    previewEmpty.style.display = 'flex';
    updateStats('');
    return;
  }
  previewDoc.innerHTML      = marked.parse(md);
  previewDoc.style.display  = 'block';
  previewEmpty.style.display = 'none';
  updateStats(md);
}

function updateStats(md) {
  const words    = md.trim() ? md.trim().split(/\s+/).filter(Boolean).length : 0;
  const lines    = md.split('\n').length;
  const chars    = md.length;
  const headings = (md.match(/^#{1,6}\s/gm) || []).length;
  const links    = (md.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length;

  document.getElementById('stat-lines').textContent    = lines + ' line' + (lines !== 1 ? 's' : '');
  document.getElementById('stat-words').textContent    = words + ' word' + (words !== 1 ? 's' : '');
  document.getElementById('stat-chars').textContent    = chars + ' char' + (chars !== 1 ? 's' : '');

  document.getElementById('preview-stat-words').textContent    = words + ' word' + (words !== 1 ? 's' : '');
  document.getElementById('preview-stat-headings').textContent = headings + ' heading' + (headings !== 1 ? 's' : '');
  document.getElementById('preview-stat-links').textContent    = links + ' link' + (links !== 1 ? 's' : '');
}

/* Show editor states */

/** Transition from drop-zone to blank editor (user clicked "Start writing") */
function showEditorDirect() {
  dropZone.style.display = 'none';
  editorWrap.classList.add('visible');
  editorStatus.classList.add('visible');
  hasContent = true;
  editor.focus();
  render(editor.value);

  // On mobile, keep editor tab active
  if (isMobileViewport()) setMobileTab('editor');
}

/** Load text content (from file or paste) into the editor */
function showEditorWithContent(text, filename) {
  dropZone.style.display = 'none';
  editorWrap.classList.add('visible');
  editorStatus.classList.add('visible');
  editor.value = text;
  document.getElementById('filename-display').textContent = filename || 'untitled.md';
  hasContent = true;
  render(text);

  // On mobile switch to preview so user sees the result immediately
  if (isMobileViewport()) setMobileTab('preview');
}

/* Live editing */
editor.addEventListener('input', () => render(editor.value));

editor.addEventListener('keydown', (e) => {
  // Tab → insert two spaces instead of focus-trap
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end   = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    render(editor.value);
  }
});

/* Theme ─*/
function setTheme(t) {
  currentTheme = t;

  document.getElementById('btn-gh').classList.toggle('active', t === 'github');
  document.getElementById('btn-cl').classList.toggle('active', t === 'claude');

  previewDoc.classList.toggle('theme-github', t === 'github');
  previewDoc.classList.toggle('theme-claude', t === 'claude');

  const badge = document.getElementById('theme-badge');
  const statTheme = document.getElementById('preview-stat-theme');

  if (t === 'github') {
    badge.className = 'theme-badge badge-gh';
    badge.innerHTML = `<svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M7 .5C3.41.5.5 3.41.5 7c0 2.88 1.87 5.33 4.47 6.19.33.06.45-.14.45-.31v-1.09c-1.83.4-2.22-.88-2.22-.88-.3-.76-.73-.96-.73-.96-.6-.4.04-.4.04-.4.66.05 1.01.68 1.01.68.59 1 1.54.71 1.92.54.06-.42.23-.71.42-.87-1.46-.17-3-.73-3-3.23 0-.71.25-1.3.68-1.75-.07-.16-.29-.83.06-1.73 0 0 .55-.18 1.8.67A6.3 6.3 0 017 3.5c.56 0 1.12.08 1.65.22 1.25-.85 1.79-.67 1.79-.67.36.9.14 1.57.07 1.73.42.45.67 1.04.67 1.75 0 2.51-1.54 3.06-3 3.23.24.2.44.6.44 1.2v1.79c0 .17.12.37.45.31A6.51 6.51 0 0013.5 7C13.5 3.41 10.59.5 7 .5z"/></svg>GitHub README`;
    statTheme.textContent = 'GitHub README';
  } else {
    badge.className = 'theme-badge badge-cl';
    badge.innerHTML = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M7 1.5l1.2 3.7h3.8l-3.1 2.2 1.2 3.7L7 9l-3.1 2.1 1.2-3.7L2 5.2h3.8z"/></svg>Claude`;
    statTheme.textContent = 'Claude';
  }

  if (hasContent) render(editor.value);
}

/* Desktop layout */
function setLayout(l) {
  if (isMobileViewport()) return; // mobile uses tabs instead

  currentLayout = l;
  ['split', 'editor-only', 'preview-only'].forEach(id =>
    document.getElementById('btn-' + id).classList.toggle('active', id === l)
  );

  const hideEditor  = l === 'preview-only';
  const hidePreview = l === 'editor-only';

  editorPane.classList.toggle('hidden-pane', hideEditor);
  previewPane.classList.toggle('hidden-pane', hidePreview);
  resizer.style.display = l === 'split' ? '' : 'none';

  // Reset any manual flex widths when switching layout
  if (l !== 'split') {
    editorPane.style.flex  = '';
    previewPane.style.flex = '';
  }
}

/* Mobile tabs */
function setMobileTab(tab) {
  currentMobTab = tab;

  document.getElementById('mob-tab-editor').classList.toggle('active',  tab === 'editor');
  document.getElementById('mob-tab-preview').classList.toggle('active', tab === 'preview');

  editorPane.classList.toggle('mob-hidden',  tab !== 'editor');
  previewPane.classList.toggle('mob-hidden', tab !== 'preview');
}

/* Resize observer switch between mobile & desktop */
function onResize() {
  const mobile = isMobileViewport();

  if (mobile && !isMobile) {
    // Switched to mobile
    isMobile = true;
    // Remove desktop hidden-pane classes; use mob-hidden instead
    editorPane.classList.remove('hidden-pane');
    previewPane.classList.remove('hidden-pane');
    editorPane.style.flex  = '';
    previewPane.style.flex = '';
    setMobileTab(currentMobTab);
  } else if (!mobile && isMobile) {
    // Switched back to desktop
    isMobile = false;
    editorPane.classList.remove('mob-hidden');
    previewPane.classList.remove('mob-hidden');
    setLayout(currentLayout);
  }
}

const resizeObserver = new ResizeObserver(onResize);
resizeObserver.observe(document.body);

/* File upload */
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) loadFile(file);
  fileInput.value = ''; // reset so same file can be re-uploaded
});

function loadFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload  = (e) => showEditorWithContent(e.target.result, file.name);
  reader.onerror = ()  => alert('Could not read file. Please try again.');
  reader.readAsText(file);
}

/* Drag & drop */

// Drop zone keyboard access
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

// Highlight drop zone when file dragged over editor pane
['dragenter', 'dragover'].forEach(ev =>
  editorPane.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-active');
  })
);
['dragleave', 'drop'].forEach(ev =>
  editorPane.addEventListener(ev, () => dropZone.classList.remove('drag-active'))
);
editorPane.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) { loadFile(file); return; }
  const text = e.dataTransfer.getData('text');
  if (text) showEditorWithContent(text, 'pasted.md');
});

// Allow dropping anywhere on the page
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = Array.from(e.dataTransfer.files)
    .find(f => /\.(md|markdown|txt)$/i.test(f.name));
  if (file) loadFile(file);
});

/* Clear ─*/
function clearEditor() {
  if (hasContent) {
    const confirmed = confirm('Clear all content and start fresh?');
    if (!confirmed) return;
  }

  editor.value = '';
  document.getElementById('filename-display').textContent = 'untitled.md';

  editorWrap.classList.remove('visible');
  editorStatus.classList.remove('visible');
  dropZone.style.display = '';

  hasContent = false;
  render('');

  // On mobile go back to editor tab
  if (isMobileViewport()) setMobileTab('editor');
}

/* Copy rendered HTML */
function copyHTML() {
  const html = previewDoc.innerHTML || '';
  if (!html.trim()) {
    alert('Nothing to copy write or upload some markdown first.');
    return;
  }
  navigator.clipboard.writeText(html).then(() => {
    const btn = document.getElementById('copy-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 7l3 3 7-6"/></svg><span class="btn-label">Copied!</span>`;
    btn.classList.add('copy-flash');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copy-flash'); }, 2200);
  }).catch(() => {
    alert('Copy failed your browser may not support clipboard access over HTTP.');
  });
}

/* Format helpers */
function formatSelection(type) {
  if (!hasContent) showEditorDirect();

  const start = editor.selectionStart;
  const end   = editor.selectionEnd;
  const sel   = editor.value.substring(start, end);
  let wrapped;

  switch (type) {
    case 'bold':   wrapped = `**${sel || 'bold text'}**`;      break;
    case 'italic': wrapped = `_${sel  || 'italic text'}_`;     break;
    case 'code':   wrapped = `\`${sel || 'code'}\``;           break;
    default: return;
  }

  editor.value =
    editor.value.substring(0, start) + wrapped + editor.value.substring(end);

  // Place cursor at end of inserted text
  const cursor = start + wrapped.length;
  editor.selectionStart = editor.selectionEnd = cursor;
  editor.focus();
  render(editor.value);
}

function wrapTable() {
  if (!hasContent) showEditorDirect();

  const table =
    '\n| Column 1 | Column 2 | Column 3 |\n' +
    '|----------|----------|----------|\n' +
    '| Cell     | Cell     | Cell     |\n' +
    '| Cell     | Cell     | Cell     |\n';

  const pos = editor.selectionStart;
  editor.value =
    editor.value.substring(0, pos) + table + editor.value.substring(pos);
  editor.selectionStart = editor.selectionEnd = pos + table.length;
  editor.focus();
  render(editor.value);
}

/* Pane resizer (desktop drag) */
let isResizing = false;

resizer.addEventListener('mousedown', () => {
  isResizing = true;
  resizer.classList.add('dragging');
  document.body.style.cursor     = 'col-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const rect   = workspace.getBoundingClientRect();
  const offset = e.clientX - rect.left;
  const total  = rect.width - 4; // subtract resizer width
  const pct    = Math.min(Math.max((offset / total) * 100, 18), 82);
  editorPane.style.flex  = `0 0 ${pct}%`;
  previewPane.style.flex = `0 0 ${100 - pct}%`;
});

document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  resizer.classList.remove('dragging');
  document.body.style.cursor     = '';
  document.body.style.userSelect = '';
});

// Touch resizing (tablet landscape)
resizer.addEventListener('touchstart', (e) => {
  isResizing = true;
  resizer.classList.add('dragging');
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (!isResizing) return;
  const touch  = e.touches[0];
  const rect   = workspace.getBoundingClientRect();
  const offset = touch.clientX - rect.left;
  const total  = rect.width - 4;
  const pct    = Math.min(Math.max((offset / total) * 100, 18), 82);
  editorPane.style.flex  = `0 0 ${pct}%`;
  previewPane.style.flex = `0 0 ${100 - pct}%`;
}, { passive: true });

document.addEventListener('touchend', () => {
  if (!isResizing) return;
  isResizing = false;
  resizer.classList.remove('dragging');
});

/* Init */
(function init() {
  // Detect initial viewport
  isMobile = isMobileViewport();

  // Apply initial theme (sets badge + classes)
  setTheme('github');

  // On mobile, ensure correct tab state at load
  if (isMobile) {
    document.getElementById('mobile-tabs').style.display = 'flex';
    setMobileTab('editor');
  }

  // Start with blank state drop zone visible, no content
  // (no SAMPLE content loaded)
})();