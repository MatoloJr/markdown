# Markdown Preview your .md files

> Instantly preview `.md` files as they appear on **GitHub** or in **Claude** no account, no build step, no dependencies to install. Open the file in a browser and start writing.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
  - [Rendering Pipeline](#rendering-pipeline)
  - [Render Themes](#render-themes)
  - [Responsive Layout System](#responsive-layout-system)
  - [State Management](#state-management)
- [Usage Guide](#usage-guide)
  - [Loading a File](#loading-a-file)
  - [Writing Directly](#writing-directly)
  - [Formatting Toolbar](#formatting-toolbar)
  - [Layout Modes](#layout-modes)
  - [Switching Themes](#switching-themes)
  - [Copying Rendered HTML](#copying-rendered-html)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Supported Markdown Syntax](#supported-markdown-syntax)
- [Dependencies](#dependencies)
- [Browser Support](#browser-support)
- [Customisation](#customisation)
  - [Adding a New Render Theme](#adding-a-new-render-theme)
  - [Changing the Accent Colour](#changing-the-accent-colour)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**Markdown** is a zero-dependency, single-page markdown previewer that solves a simple but persistent problem: developers and writers often author `.md` files locally and have to push to GitHub or paste into Claude just to see how they render. This tool eliminates that round-trip entirely.

The tool renders markdown in two pixel-accurate styles: **GitHub README** (the most common target for documentation) and **Claude** (the AI assistant's response style with its characteristic serif body text and warm tones). Both themes are implemented from scratch in pure CSS, faithfully reproducing typography, spacing, code block styling, table striping, blockquote treatment and task-list rendering.

Everything runs in the browser. There is no server, no build process, no npm install and no login.

---

## Features

### Core
- **Drag-and-drop file loading** drop a `.md`, `.markdown`, or `.txt` file anywhere on the page
- **Click-to-upload** file picker via the header button or the drop zone
- **Live editing** the preview updates on every keystroke with zero debounce lag
- **Blank default state** nothing is pre-loaded; the editor only appears once the user actively starts
- **Copy rendered HTML** copies the fully-rendered inner HTML to the clipboard in one click

### Render Themes
- **GitHub README** exact font stack, `#f6f8fa` code blocks, border-bottom headings, zebra-striped tables, `0.25em` left-border blockquotes and link colour matching `github.com`
- **Claude** serif body (`Georgia`), warm off-white backgrounds, amber-tinted links, pill-style blockquotes with background fill and sans-serif headings

### Editor
- Inline formatting toolbar: **Bold**, _Italic_, `code` and table insertion
- Tab key inserts two spaces (prevents focus loss)
- Live status bar: line count, word count, character count
- Filename display updates to the loaded file's name

### Preview
- Live status bar: word count, heading count, link count, active theme name
- Theme badge in the pane header updates with the active theme's icon and colour
- Empty state with instructional copy while no content is loaded

### Layout
- **Split** (default) editor and preview side-by-side with a draggable resizer
- **Editor only** full-width editor, preview hidden
- **Preview only** full-width preview, editor hidden
- **Draggable resizer** drag the 4px divider to any split between 18% and 82%
- **Touch resizing** the resizer also responds to touch events for tablet landscape use

### Responsive
- **Desktop** (`> 960px`) full toolbar with labels, split-pane layout with resizer
- **Tablet** (`≤ 960px`) icon-only buttons, layout group hidden, statusbar trimmed
- **Mobile** (`≤ 640px`) full-screen single-pane with Editor / Preview tab bar at top, logo text hidden to save space
- **Small phones** (`≤ 380px`) further font-size reduction, theme badge hidden
- **Tall screens** (`height > 900px`) extra vertical padding in preview scroll
- **Wide screens** (`> 1400px`) wider preview document card (up to `820px`)

---

## Getting Started

Markdown is a static web application. No installation, package manager, or server is needed.

**Option 1 Open directly in the browser**

```
Double-click index.html
```

That's it. The file runs entirely client-side. All dependencies are loaded from CDN.

**Option 2 Serve locally** (recommended for clipboard API over HTTPS)

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .

# VS Code
# Install the "Live Server" extension and click "Go Live"
```

Then open `http://localhost:8080` in your browser.

> **Note:** The `Copy HTML` button uses the browser Clipboard API which requires either `localhost` or an `https://` origin. It will not work when the file is opened directly via `file://` in some browsers.

---

## Project Structure

```
markdown/
├── index.html   # Application shell, HTML structure, CDN script tags, inline SVG favicon
├── style.css    # All visual styling dark chrome, render themes, responsive breakpoints
├── script.js    # All behaviour rendering, state, drag-drop, resize, clipboard
└── README.md    # This file
```

The project is intentionally kept as three files with no build tooling, making it trivial to fork, self-host, or embed in another project.

---

## How It Works

### Rendering Pipeline

When the user types or loads a file, `script.js` calls `render(md)`:

```
Raw markdown string
        │
        ▼
  marked.parse(md)        ← marked.js 9.1.6 with GFM enabled
        │
        ├── renderer.checkbox()   ← converts [ ] / [x] to disabled <input> elements
        └── renderer.code()       ← pipes each fenced block through highlight.js
                │
                ▼
        HTML string injected into #preview-doc
                │
                ▼
  CSS class .theme-github or .theme-claude applied to #preview-doc
  controls all visual styling without touching the HTML
```

`updateStats(md)` runs on the same raw string via regex to count words, lines, characters, headings (`/^#{1,6}\s/gm`) and inline links (`/\[([^\]]+)\]\([^)]+\)/g`), updating both status bars.

### Render Themes

Both themes are scoped CSS classes applied to the `#preview-doc` container. Switching themes only toggles `.theme-github` ↔ `.theme-claude` on that element the HTML inside never changes.

| Property | GitHub | Claude |
|---|---|---|
| Body font | `-apple-system, "Segoe UI", Helvetica` | `Georgia, "Times New Roman"` |
| Body size | `16px` | `16.5px` |
| Line height | `1.6` | `1.75` |
| Heading font | same as body | `var(--font-sans)` (switches to sans-serif) |
| Code background | `#f6f8fa` | `#f3f0ea` (warm tint) |
| Inline code colour | inherited text | `#b34000` (rust orange) |
| Link colour | `#0969da` (GitHub blue) | `#b35500` (amber brown) |
| Blockquote | left border only, grey text | left border + background fill, warm tint |
| Table stripe | `#f6f8fa` rows | `#fdf7f0` rows |
| `<hr>` | `0.25em` filled bar | `1px` hairline |
| Checkbox accent | browser default | `#b35500` |

Highlight.js uses `github.min.css` (light) for the GitHub theme. For the Claude theme, the `hljs` background is overridden via `.theme-claude .hljs { background: var(--cl-code-bg) !important; }` to match the warm code block colour.

### Responsive Layout System

The layout uses two separate strategies depending on viewport:

**Desktop (`> 640px`)** Flexbox split. `editor-pane` and `preview-pane` share flex space. The `hidden-pane` class sets `flex: 0 0 0%` and `opacity: 0` to collapse a pane. The resizer bar sits between them and updates `flex` values directly via `mousemove`/`touchmove`.

**Mobile (`≤ 640px`)** Absolute overlay. Both panes are `position: absolute; inset: 0` filling the workspace. The active pane gets `z-index: 1`; the inactive one gets `z-index: 0` and `opacity: 0` via the `mob-hidden` class. This gives a clean tab-switch without any layout reflow.

A `ResizeObserver` on `document.body` watches for the viewport crossing the `640px` boundary and calls `onResize()`, which cleanly swaps between the two strategies at runtime so resizing a browser window from desktop to mobile width works seamlessly.

### State Management

Five state variables are maintained in `script.js`:

| Variable | Type | Purpose |
|---|---|---|
| `currentTheme` | `string` | `'github'` or `'claude'` |
| `currentLayout` | `string` | `'split'`, `'editor-only'`, or `'preview-only'` |
| `currentMobTab` | `string` | `'editor'` or `'preview'` |
| `hasContent` | `boolean` | Guards the drop-zone → editor transition; prevents spurious `confirm()` on clear |
| `isMobile` | `boolean` | Tracks which layout strategy is currently active |

`hasContent` is the gating variable for the blank default behaviour. The drop zone is the initial visible state of the editor pane. It transitions to the textarea only when the user loads a file (`showEditorWithContent`) or clicks "Start writing" (`showEditorDirect`). Calling `clearEditor()` reverses this transition.

---

## Usage Guide

### Loading a File

Three ways to load a `.md` file:

1. **Drag and drop** drag the file from your file manager and drop it anywhere on the page (not just the drop zone)
2. **Upload button** click **Upload .md** in the header and select a file from the file picker
3. **Drop zone** click the drop zone in the editor pane to open the file picker directly

Supported extensions: `.md`, `.markdown`, `.txt`

After loading, the filename appears in the editor pane header (e.g. `README.md`). On mobile, the view automatically switches to the Preview tab so the rendered output is immediately visible.

### Writing Directly

Click **Start writing** inside the drop zone to skip file loading and open a blank editor. The preview pane shows an empty state until at least one non-whitespace character is typed.

### Formatting Toolbar

The four icon buttons in the editor pane header insert or wrap markdown syntax:

| Button | Action | Output |
|---|---|---|
| **B** | Bold | `**selected text**` |
| _I_ | Italic | `_selected text_` |
| `<>` | Inline code | `` `selected text` `` |
| ⊞ | Insert table | 3-column table template at cursor |

Select text before clicking Bold, Italic, or Code to wrap the selection. Click without a selection to insert placeholder text. Table insertion always places the template at the current cursor position.

### Layout Modes

Use the **Split / Editor / Preview** button group in the header (desktop only):

- **Split** default side-by-side view; drag the centre divider to redistribute space between 18% and 82%
- **Editor** full-width editor; useful for extended writing sessions
- **Preview** full-width preview; useful for final review or copy

On mobile (≤ 640px) the layout group is hidden and replaced by the **Editor / Preview** tab bar at the top of the workspace.

### Switching Themes

Use the **GitHub / Claude** button group in the header. The theme switches instantly without re-parsing only a CSS class changes on the preview document container.

On tablet widths (≤ 960px) the text labels "GitHub" and "Claude" are hidden; only the icons remain.

### Copying Rendered HTML

Click **Copy HTML** in the header to copy the fully-rendered inner HTML of the preview document to the clipboard. This is the HTML as styled by the active theme's CSS variables resolved at copy time the raw tags only, not the scoped CSS.

The button shows a checkmark confirmation for 2.2 seconds after a successful copy.

> Requires `localhost` or `https://` for the Clipboard API. Over `file://`, the button will alert with an explanation.

---

## Keyboard Shortcuts

| Key | Context | Behaviour |
|---|---|---|
| `Tab` | Editor focused | Inserts 2 spaces at cursor (does not trap focus) |
| `Enter` / `Space` | Drop zone focused | Opens file picker |

There are no global keyboard shortcuts for layout or theme switching in the current version (see [Roadmap](#roadmap)).

---

## Supported Markdown Syntax

Markdown is parsed with **marked.js** in GFM (GitHub Flavored Markdown) mode (`gfm: true`, `breaks: false`, `pedantic: false`).

| Syntax | Supported |
|---|---|
| Headings `# h1` through `###### h6` | ✅ |
| Paragraphs | ✅ |
| **Bold** `**text**` | ✅ |
| _Italic_ `_text_` | ✅ |
| ~~Strikethrough~~ `~~text~~` | ✅ |
| Inline code `` `code` `` | ✅ |
| Fenced code blocks with language tag | ✅ with syntax highlighting |
| Blockquotes `>` | ✅ |
| Unordered lists `- item` | ✅ |
| Ordered lists `1. item` | ✅ |
| Task lists `- [x] done` | ✅ renders as disabled checkboxes |
| Tables | ✅ with header, alignment, zebra rows |
| Horizontal rules `---` | ✅ |
| Links `[text](url)` | ✅ |
| Images `![alt](url)` | ✅ |
| HTML in markdown | ✅ (passed through by marked) |
| Autolinks | ✅ (GFM) |

Syntax highlighting is provided by **highlight.js** for all fenced code blocks with a recognised language tag. Unsupported languages fall back to `plaintext` (no highlighting, but still formatted as a code block).

---

## Dependencies

All dependencies are loaded from `cdnjs.cloudflare.com` at runtime. No local copies are bundled.

| Library | Version | Purpose | CDN URL |
|---|---|---|---|
| [marked.js](https://marked.js.org/) | `9.1.6` | GFM markdown → HTML parser | `cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js` |
| [highlight.js](https://highlightjs.org/) | `11.9.0` | Syntax highlighting for fenced code blocks | `cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js` |
| highlight.js `github` theme | `11.9.0` | Light syntax colours (GitHub theme) | `.../styles/github.min.css` |
| highlight.js `github-dark` theme | `11.9.0` | Dark syntax colours (loaded but currently unused) | `.../styles/github-dark.min.css` |

The `github-dark.min.css` stylesheet is loaded with `disabled` attribute it is wired in for future use (e.g. a dark GitHub theme variant) and adds no network overhead while disabled.

There are no runtime JavaScript framework dependencies. The application uses vanilla JS with no transpilation, no module bundler and no package manager.

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome / Edge 88+ | ✅ Full support |
| Firefox 78+ | ✅ Full support |
| Safari 14+ | ✅ Full support |
| Safari iOS 14+ | ✅ Full support (mobile layout) |
| Chrome Android | ✅ Full support (mobile layout) |

**APIs used:**

- `ResizeObserver` for responsive breakpoint detection at runtime
- `FileReader` for reading uploaded files
- `navigator.clipboard.writeText()` for Copy HTML (requires `localhost` or HTTPS)
- `DataTransfer` (drag and drop) for file drop events
- CSS `min()` function used in drop zone width
- CSS `position: absolute; inset: 0` used in mobile layout

All of the above are baseline-supported in any browser released after 2020.

---

## Customisation

### Adding a New Render Theme

1. **Add a theme button** in `index.html` inside the `.toolbar-group[aria-label="Render theme"]`:

```html
<button class="tb-btn" id="btn-notion" onclick="setTheme('notion')" title="Notion style">
  <!-- SVG icon -->
  <span class="theme-label">Notion</span>
</button>
```

2. **Add CSS** in `style.css` scope all rules under `.theme-notion`:

```css
.theme-notion {
  font-family: ui-sans-serif, "Segoe UI", sans-serif;
  font-size: 16px;
  line-height: 1.65;
  color: #37352f;
}
.theme-notion h1 { font-size: 1.875em; font-weight: 700; margin: 0 0 4px; }
/* ... etc */
```

3. **Update `setTheme()`** in `script.js` add a new `else if` branch:

```js
} else if (t === 'notion') {
  badge.className = 'theme-badge badge-notion';
  badge.innerHTML = `<!-- icon SVG --> Notion`;
  statTheme.textContent = 'Notion';
}
```

4. **Add a badge colour** in `style.css`:

```css
.badge-notion {
  background: rgba(55,53,47,0.1);
  color: #37352f;
  border: 1px solid rgba(55,53,47,0.2);
}
```

### Changing the Accent Colour

The amber accent (`#d97706` / `#f59e0b`) is defined in two CSS custom properties in `:root`:

```css
:root {
  --accent:      #d97706;   /* used for resizer hover, drag-active outline */
  --accent-text: #f59e0b;   /* used for logo dot, active SVG icons, caret, Upload button */
  --accent-dim:  rgba(217,119,6,0.15);  /* Upload button background */
}
```

Change these three values to retheme the entire interactive chrome at once.

---

## Roadmap

Potential features for future iterations:

- [ ] **Export to PDF** `window.print()` with `@media print` styles scoped to `.preview-doc`
- [ ] **Shareable URL** base64-encode the markdown into a `#hash` so a preview can be shared via link with no backend
- [ ] **More themes** Notion, VS Code Preview, Obsidian, npm package page
- [ ] **Side-by-side diff** paste two `.md` versions and highlight rendering differences
- [ ] **Keyboard shortcuts** `Ctrl/Cmd+1/2/3` for layout modes, `Ctrl/Cmd+Shift+T` for theme toggle
- [ ] **Outline panel** auto-generated TOC from headings, click to scroll
- [ ] **Dark/light app chrome toggle** while keeping render themes independent of the shell
- [ ] **PWA / offline** service worker to cache CDN assets so it works without internet

---

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense and/or sell copies of the Software and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.