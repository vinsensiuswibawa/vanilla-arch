# Visual Companion

Browser-based visual brainstorming companion for showing mockups, diagrams, and options.

## When to Use

Decide per-question, not per-session. The test: **would the user understand this better by seeing it than reading it?**

**Use the browser** when the content itself is visual:

- **UI mockups** — wireframes, layouts, navigation structures, component designs
- **Architecture diagrams** — system components, data flow, relationship maps
- **Side-by-side visual comparisons** — comparing two layouts, two color schemes, two design directions
- **Design polish** — when the question is about look and feel, spacing, visual hierarchy
- **Spatial relationships** — state machines, flowcharts, entity relationships rendered as diagrams

**Use the terminal** when the content is text or tabular:

- **Requirements and scope questions** — "what does X mean?", "which features are in scope?"
- **Conceptual A/B/C choices** — picking between approaches described in words
- **Tradeoff lists** — pros/cons, comparison tables
- **Technical decisions** — API design, data modeling, architectural approach selection
- **Clarifying questions** — anything where the answer is words, not a visual preference

A question *about* a UI topic is not automatically a visual question. "What kind of wizard do you want?" is conceptual — use the terminal. "Which of these wizard layouts feels right?" is visual — use the browser.

## How It Works

The server watches a directory for HTML files and serves the newest one to the browser. You write HTML content to `screen_dir`, the user sees it in their browser and can click to select options. Selections are recorded to `state_dir/events` that you read on your next turn.

**Content fragments vs full documents:** If your HTML file starts with `<!DOCTYPE` or `<html`, the server serves it as-is (just injects the helper script). Otherwise, the server automatically wraps your content in the frame template — adding the header, CSS theme, connection status, and all interactive infrastructure. **Write content fragments by default.** Only write full documents when you need complete control over the page.

## Starting a Session

```bash
# Start AFTER the user approves the companion. --open auto-opens their browser on
# the first screen; --project-dir persists mockups and enables same-port restart.
scripts/start-server.sh --project-dir /path/to/project --open

# Returns: {"type":"server-started","port":52341,
#           "url":"http://localhost:52341/?key=ab12…",
#           "screen_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000/content",
#           "state_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000/state"}
```

Save `screen_dir` and `state_dir` from the response. With `--open`, the browser opens itself when you push the first screen — you don't need to ask the user to open it, but still share the URL as a fallback (headless/remote setups won't auto-open).

**The URL contains a session key (`?key=…`).** The server rejects any request without it, so always give the user the **complete** URL from the `url` field — never strip the query string, and never hand out a bare `http://host:port`.

## The Loop

1. **Check server is alive**, then **write HTML** to a new file in `screen_dir`
   - Use semantic filenames: `platform.html`, `visual-style.html`, `layout.html`
   - **Never reuse filenames** — each screen gets a fresh file
   - Server automatically serves the newest file

2. **Tell user what to expect and end your turn:**
   - Remind them of the URL (every step, not just first)
   - Give a brief text summary of what's on screen
   - Ask them to respond in the terminal

3. **On your next turn** — read `$STATE_DIR/events` if it exists (user browser clicks as JSON lines), merge with terminal text

4. **Iterate or advance** — write a new file (e.g., `layout-v2.html`) if feedback changes current screen

5. **Unload when returning to terminal** — push a waiting screen to clear stale content:
   ```html
   <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
     <p class="subtitle">Continuing in terminal...</p>
   </div>
   ```

## Writing Content Fragments

Write just the content that goes inside the page. The server wraps it in the frame template automatically.

**Minimal example:**

```html
<h2>Which layout works better?</h2>
<p class="subtitle">Consider readability and visual hierarchy</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Single Column</h3>
      <p>Clean, focused reading experience</p>
    </div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content">
      <h3>Two Column</h3>
      <p>Sidebar navigation with main content</p>
    </div>
  </div>
</div>
```

## CSS Classes Available

- `.options` + `.option` — A/B/C choice cards (add `data-multiselect` for multi-select)
- `.cards` + `.card` — visual design cards with images
- `.mockup` + `.mockup-header` + `.mockup-body` — mockup container
- `.split` — side-by-side split view
- `.pros-cons` with `.pros` and `.cons` — tradeoff comparison
- `.mock-nav`, `.mock-sidebar`, `.mock-content`, `.mock-button`, `.mock-input`, `.placeholder` — wireframe building blocks
- `h2`, `h3`, `.subtitle`, `.section`, `.label` — typography

## Browser Events Format

```jsonl
{"type":"click","choice":"a","text":"Option A - Simple Layout","timestamp":1706000101}
```

The last `choice` event is typically the final selection, but the full stream shows the user's exploration path.

## Design Tips

- **Scale fidelity to the question** — wireframes for layout, polish for polish questions
- **Explain the question on each page** — "Which layout feels more professional?" not just "Pick one"
- **2-4 options max** per screen
- **Use real content when it matters** — for a photography portfolio, use actual images
- **Keep mockups simple** — focus on layout and structure
- **Never reuse filenames** — each screen must be a new file with a version suffix if iterating
