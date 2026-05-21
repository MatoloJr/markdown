  /* State */
  let currentTheme  = 'github';
  let currentLayout = 'split';
  let hasContent    = false;

  const editor       = document.getElementById('editor');
  const editorWrap   = document.getElementById('editor-wrap');
  const dropZone     = document.getElementById('drop-zone');
  const editorPane   = document.getElementById('editor-pane');
  const previewPane  = document.getElementById('preview-pane');
  const previewDoc   = document.getElementById('preview-doc');
  const previewEmpty = document.getElementById('preview-empty');
  const fileInput    = document.getElementById('file-input');

  /* Marked setup */
  const renderer = new marked.Renderer();

  // GFM checkbox
  renderer.checkbox = (checked) =>
    `<input type="checkbox" ${checked ? 'checked' : ''} disabled> `;

  // Syntax-highlighted code blocks
  renderer.code = (code, lang) => {
    const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    const highlighted = hljs.highlight(code, { language: validLang }).value;
    const langLabel = validLang !== 'plaintext' ? `<span class="code-lang">${lang}</span>` : '';
    return `<pre>${langLabel}<code class="hljs language-${validLang}">${highlighted}</code></pre>`;
  };

  marked.use({ renderer, gfm: true, breaks: false, pedantic: false });

  /* Render */
  function render(md) {
    if (!md || !md.trim()) {
      previewDoc.style.display = 'none';
      previewEmpty.style.display = 'flex';
      updateStats('', '');
      return;
    }

    const html = marked.parse(md);
    previewDoc.innerHTML = html;
    previewDoc.style.display = 'block';
    previewEmpty.style.display = 'none';

    updateStats(md, html);
  }

  function updateStats(md, html) {
    const words    = md.trim() ? md.trim().split(/\s+/).filter(Boolean).length : 0;
    const lines    = md.split('\n').length;
    const chars    = md.length;
    const headings = (md.match(/^#{1,6}\s/gm) || []).length;
    const links    = (md.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length;

    // Editor statusbar
    document.getElementById('stat-lines').textContent = lines + ' lines';
    document.getElementById('stat-words').textContent = words + ' words';
    document.getElementById('stat-chars').textContent = chars + ' chars';

    // Preview statusbar
    document.getElementById('preview-stat-words').textContent    = words + ' words';
    document.getElementById('preview-stat-headings').textContent = headings + ' heading' + (headings !== 1 ? 's' : '');
    document.getElementById('preview-stat-links').textContent    = links + ' link' + (links !== 1 ? 's' : '');
  }

  /* Show editor (from drop-zone state) */
  function showEditorDirect() {
    dropZone.style.display = 'none';
    editorWrap.classList.add('visible');
    document.getElementById('editor-statusbar').style.display = 'flex';
    hasContent = true;
    editor.focus();
    render(editor.value);
  }

  function showEditorWithContent(text, filename) {
    dropZone.style.display = 'none';
    editorWrap.classList.add('visible');
    document.getElementById('editor-statusbar').style.display = 'flex';
    editor.value = text;
    document.getElementById('filename-display').textContent = filename || 'untitled.md';
    hasContent = true;
    render(text);
  }

  /* Live editing */
  editor.addEventListener('input', () => render(editor.value));
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end   = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      render(editor.value);
    }
  });

  /* Theme */
  function setTheme(t) {
    currentTheme = t;

    document.getElementById('btn-gh').classList.toggle('active', t === 'github');
    document.getElementById('btn-cl').classList.toggle('active', t === 'claude');

    previewDoc.classList.toggle('theme-github', t === 'github');
    previewDoc.classList.toggle('theme-claude', t === 'claude');

    const badge = document.getElementById('theme-badge');
    if (t === 'github') {
      badge.className = 'theme-badge badge-gh';
      badge.innerHTML = `<svg viewBox="0 0 14 14" fill="currentColor"><path d="M7 .5C3.41.5.5 3.41.5 7c0 2.88 1.87 5.33 4.47 6.19.33.06.45-.14.45-.31v-1.09c-1.83.4-2.22-.88-2.22-.88-.3-.76-.73-.96-.73-.96-.6-.4.04-.4.04-.4.66.05 1.01.68 1.01.68.59 1 1.54.71 1.92.54.06-.42.23-.71.42-.87-1.46-.17-3-.73-3-3.23 0-.71.25-1.3.68-1.75-.07-.16-.29-.83.06-1.73 0 0 .55-.18 1.8.67A6.3 6.3 0 017 3.5c.56 0 1.12.08 1.65.22 1.25-.85 1.79-.67 1.79-.67.36.9.14 1.57.07 1.73.42.45.67 1.04.67 1.75 0 2.51-1.54 3.06-3 3.23.24.2.44.6.44 1.2v1.79c0 .17.12.37.45.31A6.51 6.51 0 0013.5 7C13.5 3.41 10.59.5 7 .5z"/></svg> GitHub README`;
      document.getElementById('preview-stat-theme').textContent = 'GitHub README';
    } else {
      badge.className = 'theme-badge badge-cl';
      badge.innerHTML = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M7 1.5l1.2 3.7h3.8l-3.1 2.2 1.2 3.7L7 9l-3.1 2.1 1.2-3.7L2 5.2h3.8z"/></svg> Claude`;
      document.getElementById('preview-stat-theme').textContent = 'Claude';
    }

    // Re-render to pick up theme
    if (hasContent) render(editor.value);
  }

  /* Layout */
  function setLayout(l) {
    currentLayout = l;
    ['split', 'editor-only', 'preview-only'].forEach(x =>
      document.getElementById('btn-' + x).classList.toggle('active', x === l)
    );
    editorPane.classList.toggle('hidden-pane',  l === 'preview-only');
    previewPane.classList.toggle('hidden-pane', l === 'editor-only');
    document.getElementById('resizer').style.display = l === 'split' ? '' : 'none';
  }

  /* File upload */
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) loadFile(file);
    fileInput.value = '';
  });

  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => showEditorWithContent(e.target.result, file.name);
    reader.readAsText(file);
  }

  /* Drag & drop */
  const dz = document.getElementById('drop-zone');
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });

  ['dragenter', 'dragover'].forEach(ev =>
    editorPane.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag-active'); })
  );
  ['dragleave', 'drop'].forEach(ev =>
    editorPane.addEventListener(ev, () => dz.classList.remove('drag-active'))
  );
  editorPane.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { loadFile(file); return; }
    const text = e.dataTransfer.getData('text');
    if (text) showEditorWithContent(text, 'pasted.md');
  });

  /* Also allow dropping onto the whole page */
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = Array.from(e.dataTransfer.files).find(f => /\.(md|markdown|txt)$/i.test(f.name));
    if (file) loadFile(file);
  });

  /* Clear */
  function clearEditor() {
    editor.value = '';
    document.getElementById('filename-display').textContent = 'untitled.md';
    editorWrap.classList.remove('visible');
    document.getElementById('editor-statusbar').style.display = 'none';
    dropZone.style.display = '';
    hasContent = false;
    render('');
  }

  /* Copy HTML */
  function copyHTML() {
    const html = previewDoc.innerHTML;
    if (!html.trim()) { alert('Nothing to copy write or upload some markdown first.'); return; }
    navigator.clipboard.writeText(html).then(() => {
      const btn = document.getElementById('copy-btn');
      const origText = btn.innerHTML;
      btn.innerHTML = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 7l3 3 7-6"/></svg> Copied!`;
      btn.classList.add('copy-flash');
      setTimeout(() => { btn.innerHTML = origText; btn.classList.remove('copy-flash'); }, 2000);
    });
  }

  /* Format helpers */
  function formatSelection(type) {
    if (!hasContent) showEditorDirect();
    const start = editor.selectionStart;
    const end   = editor.selectionEnd;
    const sel   = editor.value.substring(start, end);
    let wrapped;

    if (type === 'bold')   wrapped = `**${sel || 'bold text'}**`;
    if (type === 'italic') wrapped = `_${sel || 'italic text'}_`;
    if (type === 'code')   wrapped = `\`${sel || 'code'}\``;

    editor.value = editor.value.substring(0, start) + wrapped + editor.value.substring(end);
    editor.selectionStart = start + wrapped.length;
    editor.selectionEnd   = start + wrapped.length;
    editor.focus();
    render(editor.value);
  }

  function wrapTable() {
    if (!hasContent) showEditorDirect();
    const table = '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n| Cell     | Cell     | Cell     |\n';
    const pos   = editor.selectionStart;
    editor.value = editor.value.substring(0, pos) + table + editor.value.substring(pos);
    editor.selectionStart = editor.selectionEnd = pos + table.length;
    editor.focus();
    render(editor.value);
  }

  /* Resizer drag */
  const resizer   = document.getElementById('resizer');
  const workspace = document.getElementById('workspace');
  let isResizing  = false;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const rect   = workspace.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    const total  = rect.width - 4; // minus resizer width
    const pct    = Math.min(Math.max(offset / total * 100, 20), 80);
    editorPane.style.flex  = `0 0 ${pct}%`;
    previewPane.style.flex = `0 0 ${100 - pct}%`;
  });

  document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    resizer.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  /* Init */
  setTheme('github');

  // Pre-load a sample document for instant demonstration
  const SAMPLE = `# MDPreview Markdown Previewer

Upload any \`.md\` file or start typing. Switch between **GitHub README** and **Claude** render styles.

## Features

- 📂 **Upload** any \`.md\` file via drag & drop or the button
- ✏️ **Live editing** changes render instantly
- 🎨 **Two themes** pixel-perfect GitHub and Claude styles
- 📐 **Resizable split** pane drag the divider
- 📋 **Copy HTML** grab the rendered output

## Code Example

\`\`\`javascript
// Arrow function with destructuring
const greet = ({ name, role = "visitor" }) => {
  return \`Hello, \${name}! You are a \${role}.\`;
};

console.log(greet({ name: "jr", role: "developer" }));
\`\`\`

## Comparison Table

| Feature | GitHub | Claude |
|---------|--------|--------|
| Serif body font | ❌ | ✅ |
| GFM tables | ✅ | ✅ |
| Task lists | ✅ | ✅ |
| Syntax highlight | ✅ | ✅ |
| Warm blockquotes | ❌ | ✅ |

## Task List

- [x] Build markdown previewer
- [x] GitHub render theme
- [x] Claude render theme
- [x] Drag-and-drop upload
- [ ] Export to PDF
- [ ] Shareable URL

## Blockquote

> "The best documentation is the one that actually gets written and that someone can actually read."

---

Drag a \`.md\` file anywhere on the page to load it.
`;

  showEditorWithContent(SAMPLE, 'README.md');
