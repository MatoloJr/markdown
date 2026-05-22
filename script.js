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

/* Marked renderer setup*/
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

/* Utility*/
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

/* Theme*/
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

/* Mobile tabs*/
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

/* File upload*/
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

/* Drag & drop*/

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

/* Clear*/
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

/* Pane resizer (desktop drag)*/
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

/*
  TIPS FEATURE
*/

/* Tips state */
let tipsOpen       = false;
let activeCat      = 'all';
let tipsRendered   = false;

/* Tips data*/
const TIPS = [

  /*  FORMATTING  */
  {
    id: 'github-alerts',
    category: 'formatting',
    title: 'GitHub Alerts (Callouts)',
    desc: 'Highlight important information using GitHub\'s special blockquote syntax. Renders as coloured callout boxes on GitHub.',
    snippet:
`> [!NOTE]
> Useful information that users should know.

> [!TIP]
> Helpful advice for doing things better.

> [!IMPORTANT]
> Key information users need to know.

> [!WARNING]
> Urgent info that needs immediate attention.

> [!CAUTION]
> Advises about risks or negative outcomes.`,
    link: 'https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts'
  },

  {
    id: 'keyboard-keys',
    category: 'formatting',
    title: 'Keyboard Key Styling',
    desc: 'Use the HTML <kbd> tag to display keyboard keys and shortcuts in a styled pill. Works inside GitHub markdown.',
    snippet:
`Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.

Use <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>
to open the command palette.`,
    link: null
  },

  {
    id: 'collapsible-sections',
    category: 'formatting',
    title: 'Collapsible Sections',
    desc: 'Use HTML <details> and <summary> to create accordion-style expandable sections. Great for FAQs, long code, or optional content.',
    snippet:
`<details>
<summary>Click to expand</summary>

Content goes here. You can include **markdown**,
code blocks and even nested lists.

\`\`\`js
console.log('hello from inside details');
\`\`\`

</details>`,
    link: null
  },

  {
    id: 'highlight-text',
    category: 'formatting',
    title: 'Highlighted Text',
    desc: 'Use the HTML <mark> tag to add a yellow highlight to text. Useful for drawing attention to specific words.',
    snippet:
`This is <mark>highlighted text</mark> using HTML.

You can also combine with **bold**:
<mark>**important highlighted term**</mark>`,
    link: null
  },

  {
    id: 'superscript-subscript',
    category: 'formatting',
    title: 'Superscript & Subscript',
    desc: 'Use HTML tags for scientific notation, footnote markers, or chemical formulae inline in your text.',
    snippet:
`E = mc<sup>2</sup>

H<sub>2</sub>O

Footnote marker<sup>1</sup>

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>`,
    link: null
  },

  {
    id: 'strikethrough',
    category: 'formatting',
    title: 'Strikethrough Text',
    desc: 'Mark text as removed or deprecated using GFM strikethrough. Useful for changelogs or showing corrections.',
    snippet:
`~~This feature is deprecated.~~

- ~~Old approach~~ → New approach
- ~~v1 API~~ Use v2 instead`,
    link: null
  },

  /*  STRUCTURE  */
  {
    id: 'table-of-contents',
    category: 'structure',
    title: 'Manual Table of Contents',
    desc: 'GitHub auto-generates a TOC button, but adding one inline makes it visible everywhere. Links use lowercase heading text with spaces as hyphens.',
    snippet:
`## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)`,
    link: null
  },

  {
    id: 'footnotes',
    category: 'structure',
    title: 'Footnotes',
    desc: 'Add numbered footnotes that render as superscript links with definitions at the bottom of the page. Supported on GitHub.',
    snippet:
`Here is a sentence with a footnote.[^1]

Another sentence with a second reference.[^note]

[^1]: This is the first footnote definition.
[^note]: Footnotes can also use labels instead of numbers.`,
    link: 'https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#footnotes'
  },

  {
    id: 'reference-links',
    category: 'structure',
    title: 'Reference-Style Links',
    desc: 'Separate URLs from inline text for cleaner reading. Useful when the same link appears multiple times or URLs are very long.',
    snippet:
`See the [official documentation][docs] for details.
Check out [this tutorial][tutorial] to get started.
The [docs][docs] cover all edge cases.

[docs]: https://example.com/docs
[tutorial]: https://example.com/tutorial "Optional title"`,
    link: null
  },

  {
    id: 'section-dividers',
    category: 'structure',
    title: 'Visual Section Dividers',
    desc: 'Use horizontal rules to break long documents into clear sections. Three hyphens, asterisks, or underscores all work.',
    snippet:
`## Section One

Content here.

---

## Section Two

Content here.

---

## Section Three`,
    link: null
  },

  {
    id: 'nested-lists',
    category: 'structure',
    title: 'Nested Lists & Mixed Types',
    desc: 'Indent with 2–4 spaces to create sub-lists. You can mix ordered and unordered lists at different levels.',
    snippet:
`- Item one
  - Sub-item A
  - Sub-item B
    - Deeper level
- Item two
  1. Ordered sub-item
  2. Another ordered
- Item three

1. First step
   - Detail about this step
   - Another detail
2. Second step
3. Third step`,
    link: null
  },

  /*  GITHUB  */
  {
    id: 'mermaid-diagrams',
    category: 'github',
    title: 'Mermaid Diagrams',
    desc: 'Render flowcharts, sequence diagrams, Gantt charts and more directly in GitHub using Mermaid syntax in a fenced code block.',
    snippet:
`\`\`\`mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
\`\`\`

\`\`\`mermaid
sequenceDiagram
    Client->>Server: POST /api/login
    Server-->>Client: 200 OK + token
    Client->>Server: GET /api/data
    Server-->>Client: 200 OK + data
\`\`\``,
    link: 'https://mermaid.js.org/'
  },

  {
    id: 'math-latex',
    category: 'github',
    title: 'Math & LaTeX Equations',
    desc: 'Render mathematical expressions using LaTeX syntax. Use single $ for inline and double $$ for block equations. Supported on GitHub.',
    snippet:
`Inline: $E = mc^2$

Block equation:

$$
\\frac{d}{dx}\\left(\\int_a^x f(t)\\,dt\\right) = f(x)
$$

$$
\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$`,
    link: 'https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions'
  },

  {
    id: 'github-emoji',
    category: 'github',
    title: 'Emoji Shortcodes',
    desc: 'Use GitHub emoji shortcodes to add icons inline. These render on GitHub and many other markdown platforms.',
    snippet:
`## Status :rocket:

- :white_check_mark: Feature complete
- :construction: In progress
- :bug: Known bug
- :warning: Needs review

:bulb: **Tip:** Use emoji sparingly for clarity.

:star: :star: :star: :star: :star:`,
    link: 'https://github.com/ikatyang/emoji-cheat-sheet'
  },

  {
    id: 'relative-links',
    category: 'github',
    title: 'Relative Links to Files',
    desc: 'Link to other files in your repo using relative paths. GitHub resolves them correctly whether you\'re on a branch or a tag.',
    snippet:
`[Contributing Guide](CONTRIBUTING.md)
[API Docs](docs/api.md)
[Config Example](examples/config.yaml)
[Source Code](src/index.js)

<!-- Link to a specific heading -->
[Installation steps](README.md#installation)

<!-- Link to a folder -->
[Tests directory](tests/)`,
    link: null
  },

  {
    id: 'github-auto-refs',
    category: 'github',
    title: 'Auto-Linked References',
    desc: 'GitHub automatically converts issue numbers, PR numbers, commit SHAs and @mentions into links in issue/PR bodies and commit messages.',
    snippet:
`Fixes #42
Closes #17, #18

Related to #100

See also PR #55

Reverts abc1234

Thanks @username for the review.

<!-- These only auto-link on github.com, not in static previews -->`,
    link: 'https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls'
  },

  /*  VISUALS  */
  {
    id: 'shields-badges',
    category: 'visuals',
    title: 'Status Badges (Shields.io)',
    desc: 'Add dynamic or static badges to show build status, version, license and more. Generate custom ones at shields.io.',
    snippet:
`![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-92%25-yellow.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

<!-- Clickable badge -->
[![npm](https://img.shields.io/npm/v/your-package)](https://npmjs.com/package/your-package)`,
    link: 'https://shields.io'
  },

  {
    id: 'centered-image',
    category: 'visuals',
    title: 'Centred Images',
    desc: 'Centre images using an HTML wrapper. Works on GitHub and most markdown renderers that allow inline HTML.',
    snippet:
`<div align="center">
  <img src="https://example.com/logo.png"
       alt="Project Logo"
       width="200" />
</div>

<!-- With a caption -->
<div align="center">
  <img src="screenshot.png" alt="App screenshot" width="600" />
  <br/>
  <em>The main dashboard view</em>
</div>`,
    link: null
  },

  {
    id: 'image-with-link',
    category: 'visuals',
    title: 'Clickable Images & Badges',
    desc: 'Wrap an image in a link so clicking it navigates somewhere. Essential for demo GIFs, badge links and hero images.',
    snippet:
`<!-- Clickable image -->
[![Demo](screenshot.png)](https://your-demo-url.com)

<!-- Badge that links somewhere -->
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new)

<!-- Logo linking to homepage -->
[![Logo](logo.svg)](https://yourproject.com)`,
    link: null
  },

  {
    id: 'image-sizing',
    category: 'visuals',
    title: 'Image Size Control',
    desc: 'Native markdown image syntax has no size control use HTML img tags with width/height attributes for precise sizing.',
    snippet:
`<!-- Percentage width -->
<img src="screenshot.png" alt="Screenshot" width="80%" />

<!-- Fixed pixel width -->
<img src="avatar.png" alt="Avatar" width="120" height="120" />

<!-- Responsive with max-width -->
<img src="diagram.svg" alt="Diagram"
     style="max-width:100%;height:auto;" />`,
    link: null
  },

  {
    id: 'demo-gif',
    category: 'visuals',
    title: 'Demo GIFs & Video Previews',
    desc: 'Animated GIFs autoplay inline and are the standard way to show a feature demo in a README. Keep them under 10MB.',
    snippet:
`<!-- Inline GIF demo -->
![Feature Demo](demo.gif)

<!-- Centred with caption -->
<div align="center">
  <img src="demo.gif" alt="Demo" width="600" />
  <p><em>Drag and drop to reorder items</em></p>
</div>

<!-- GitHub supports mp4 via drag-drop in issue editor,
     which generates a CDN link you can embed as an image -->`,
    link: null
  },

  /*  CODE  */
  {
    id: 'syntax-highlight-langs',
    category: 'code',
    title: 'Syntax Highlighting Language Tags',
    desc: 'Add a language identifier after the opening ``` to enable syntax highlighting. Common tags that work on GitHub and this previewer.',
    snippet:
`\`\`\`javascript
const greet = name => \`Hello, \${name}!\`;
\`\`\`

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"
\`\`\`

\`\`\`bash
npm install && npm run dev
\`\`\`

\`\`\`json
{ "name": "project", "version": "1.0.0" }
\`\`\`

\`\`\`sql
SELECT * FROM users WHERE active = true;
\`\`\`

\`\`\`yaml
name: CI
on: [push, pull_request]
\`\`\``,
    link: 'https://github.com/highlightjs/highlight.js/blob/main/SUPPORTED_LANGUAGES.md'
  },

  {
    id: 'diff-blocks',
    category: 'code',
    title: 'Diff Code Blocks',
    desc: 'Use the diff language tag to show additions (+) and removals (-) in a colour-coded block. Great for showing code changes.',
    snippet:
`\`\`\`diff
- const old = "deprecated approach"
+ const newWay = "updated approach"

  function unchanged() {
-   return false;
+   return true;
  }
\`\`\``,
    link: null
  },

  {
    id: 'inline-code-ui',
    category: 'code',
    title: 'Inline Code for UI Elements',
    desc: 'Use inline code backticks for file names, commands, variable names, menu paths and UI element labels for consistency.',
    snippet:
`Run \`npm install\` to install dependencies.

Edit the \`config.json\` file in the root directory.

Navigate to \`Settings\` → \`Developer\` → \`Tokens\`.

The \`--force\` flag skips all confirmation prompts.

Set the \`PORT\` environment variable before starting.`,
    link: null
  },

  {
    id: 'shell-output',
    category: 'code',
    title: 'Shell Commands & Output',
    desc: 'Show terminal sessions clearly by separating commands from their output. Use $ or # as a prompt prefix for commands.',
    snippet:
`\`\`\`bash
# Install the package
npm install my-package

# Run with options
node index.js --port 3000 --verbose
\`\`\`

\`\`\`
$ npm test

> project@1.0.0 test
> jest --coverage

✓ renders correctly (12ms)
✓ handles edge cases (5ms)

Tests: 2 passed, 2 total
\`\`\``,
    link: null
  },

  /*  TOOLS  */
  {
    id: 'carbon-code-screenshots',
    category: 'tools',
    title: 'Carbon Beautiful Code Screenshots',
    desc: 'Create and share beautiful images of your code. Paste code into Carbon, customise the theme and language, then export as PNG to embed in your README.',
    snippet:
`<!-- After generating at carbon.now.sh, embed like this: -->

<div align="center">
  <img src="carbon.png"
       alt="Code snippet"
       width="600" />
</div>

<!-- Or link directly to a Carbon URL -->
[![Code](https://carbon.now.sh/badge.svg)](https://carbon.now.sh/?code=your-code-here)`,
    link: 'https://carbon.now.sh'
  },

  {
    id: 'shields-io-tool',
    category: 'tools',
    title: 'Shields.io Badge Generator',
    desc: 'Generate custom static or dynamic badges for your README. Connect to npm, GitHub, PyPI and dozens of other sources.',
    snippet:
`<!-- Static badge: shields.io/badge/LABEL-MESSAGE-COLOR -->
![Custom](https://img.shields.io/badge/Made_with-Love-red)

<!-- Dynamic: pulls real data from npm -->
![npm downloads](https://img.shields.io/npm/dm/your-package)

<!-- GitHub stars -->
![Stars](https://img.shields.io/github/stars/user/repo?style=social)

<!-- Latest release -->
![Release](https://img.shields.io/github/v/release/user/repo)`,
    link: 'https://shields.io'
  },

  {
    id: 'mermaid-live',
    category: 'tools',
    title: 'Mermaid Live Diagram Editor',
    desc: 'A live editor for Mermaid diagrams. Design your flowchart, sequence diagram, or ERD visually, then paste the code into your markdown.',
    snippet:
`<!-- Design at mermaid.live, then paste here: -->

\`\`\`mermaid
erDiagram
    USER {
        int id PK
        string email
        string name
    }
    POST {
        int id PK
        string title
        int userId FK
    }
    USER ||--o{ POST : "writes"
\`\`\``,
    link: 'https://mermaid.live'
  },

  {
    id: 'tables-generator',
    category: 'tools',
    title: 'Tables Generator Markdown Tables',
    desc: 'Building complex markdown tables by hand is tedious. Use Tables Generator to build them visually and paste the output.',
    snippet:
`<!-- Paste generated tables like this: -->

| Name       | Type     | Required | Default | Description          |
|------------|----------|----------|---------|----------------------|
| \`apiKey\`   | string   | ✅       |       | Your API key         |
| \`timeout\`  | number   | ❌       | 5000    | Request timeout (ms) |
| \`retries\`  | number   | ❌       | 3       | Max retry attempts   |
| \`debug\`    | boolean  | ❌       | false   | Enable debug logging |`,
    link: 'https://www.tablesgenerator.com/markdown_tables'
  }

];

/* Open / Close */
function openTips() {
  const drawer   = document.getElementById('tips-drawer');
  const backdrop = document.getElementById('tips-backdrop');
  const btn      = document.getElementById('tips-toggle-btn');

  tipsOpen = true;
  drawer.classList.add('open');
  backdrop.classList.add('visible');
  btn.classList.add('active');

  // Render tips list on first open
  if (!tipsRendered) {
    renderTips();
    tipsRendered = true;
  }

  // Focus search input for keyboard users
  setTimeout(() => {
    const search = document.getElementById('tips-search');
    if (search) search.focus();
  }, 240);
}

function closeTips() {
  const drawer   = document.getElementById('tips-drawer');
  const backdrop = document.getElementById('tips-backdrop');
  const btn      = document.getElementById('tips-toggle-btn');

  tipsOpen = false;
  drawer.classList.remove('open');
  backdrop.classList.remove('visible');
  btn.classList.remove('active');
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tipsOpen) closeTips();
});

/* Category filter*/
function setCat(cat) {
  activeCat = cat;

  // Update pill states
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.cat === cat);
  });

  // Re-render filtered list
  renderTips();
}

/* Search */
function filterTips() {
  renderTips();
}

/* Render tips list */
function renderTips() {
  const query  = (document.getElementById('tips-search').value || '').toLowerCase().trim();
  const list   = document.getElementById('tips-list');
  const count  = document.getElementById('tips-count');

  const filtered = TIPS.filter(tip => {
    const matchesCat  = activeCat === 'all' || tip.category === activeCat;
    const matchesQ    = !query ||
      tip.title.toLowerCase().includes(query) ||
      tip.desc.toLowerCase().includes(query) ||
      tip.snippet.toLowerCase().includes(query) ||
      tip.category.toLowerCase().includes(query);
    return matchesCat && matchesQ;
  });

  count.textContent = filtered.length === TIPS.length
    ? `${TIPS.length} tips`
    : `${filtered.length} of ${TIPS.length} tips`;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="tips-empty">
        <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.2">
          <circle cx="18" cy="18" r="15"/>
          <path d="M12 18h12M18 12v12"/>
        </svg>
        <p>No tips match "<strong>${escapeHtml(query)}</strong>"</p>
        <span style="font-size:11px;color:var(--text-tertiary)">Try a different search term</span>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(tip => buildTipCard(tip)).join('');
}

/* Build a single tip card HTML */
function buildTipCard(tip) {
  const tagClass = `tip-tag tip-tag-${tip.category}`;
  const tagLabel = tip.category.charAt(0).toUpperCase() + tip.category.slice(1);

  const snippetEscaped = escapeHtml(tip.snippet);
  const snippetData    = encodeURIComponent(tip.snippet);

  const linkHtml = tip.link
    ? `<a class="tip-link" href="${tip.link}" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4">
          <path d="M6 2H3a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-3M9 2h3v3M7 7l5-5"/>
        </svg>
        Learn more
      </a>`
    : '';

  return `
    <div class="tip-card" role="listitem">
      <div class="tip-card-top">
        <div class="tip-card-meta">
          <div class="tip-title">${escapeHtml(tip.title)}</div>
          <div class="tip-desc">${escapeHtml(tip.desc)}</div>
        </div>
        <span class="${tagClass}">${tagLabel}</span>
      </div>
      <div class="tip-snippet">
        <div class="tip-snippet-bar">
          <span class="tip-snippet-label">Markdown</span>
          <div class="tip-snippet-actions">
            <button class="tip-action-btn"
              onclick="copyTipSnippet(decodeURIComponent('${snippetData}'), this)"
              title="Copy snippet to clipboard">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3">
                <rect x="3" y="3" width="7" height="8" rx="1"/>
                <path d="M1 9V2a1 1 0 011-1h7"/>
              </svg>
              Copy
            </button>
            <button class="tip-action-btn insert-btn"
              onclick="insertTipSnippet(decodeURIComponent('${snippetData}'))"
              title="Insert snippet at cursor in editor">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3">
                <path d="M2 6h8M6 2l4 4-4 4"/>
              </svg>
              Insert
            </button>
          </div>
        </div>
        <pre>${snippetEscaped}</pre>
      </div>
      ${linkHtml}
    </div>`;
}

/* Copy snippet */
function copyTipSnippet(snippet, btn) {
  navigator.clipboard.writeText(snippet).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M1.5 6l3 3 6-5.5"/></svg> Copied!`;
    btn.style.color = '#34d399';
    btn.style.borderColor = 'rgba(52,211,153,0.4)';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  }).catch(() => {
    alert('Copy failed try HTTPS or localhost.');
  });
}

/* Insert snippet into editor*/
function insertTipSnippet(snippet) {
  // Ensure editor is visible
  if (!hasContent) showEditorDirect();

  const start = editor.selectionStart;
  const end   = editor.selectionEnd;

  // Add newline padding if cursor is mid-content
  const before    = editor.value.substring(0, start);
  const after     = editor.value.substring(end);
  const needsBefore = before.length > 0 && !before.endsWith('\n\n') ? '\n\n' : '';
  const needsAfter  = after.length > 0  && !after.startsWith('\n')  ? '\n'   : '';

  const insertion = needsBefore + snippet + needsAfter;
  editor.value = before + insertion + after;

  // Move cursor to after inserted snippet
  const newPos = start + insertion.length;
  editor.selectionStart = editor.selectionEnd = newPos;
  editor.focus();
  render(editor.value);

  // On mobile: switch to preview after inserting so user sees result
  if (isMobileViewport()) {
    setTimeout(() => setMobileTab('preview'), 120);
  }
}