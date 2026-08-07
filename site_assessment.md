# Site assessment

## 1. Current working tech

This project is a static GitHub Pages site served from the repository root with a custom domain in `CNAME`. The working stack is plain HTML, CSS, and browser JavaScript, with no build step, package manifest, component compiler, module bundler, or server runtime in the committed repo. Pages load assets directly from relative paths under `assets/` and from public CDNs.

The primary page, `index.html`, uses static HTML for the MySpace-style profile layout and mixes inline JavaScript with linked scripts. Its client-side behavior uses browser APIs such as `fetch`, `localStorage`, `contenteditable`, DOM events, `Audio`, `setInterval`, and `matchMedia`. It also depends on jQuery 3.7.1 for the music player, Splide 4.1.4 plus the Splide auto-scroll extension for photo and event carousels, Font Awesome 7 for the player icon, Google Fonts for the main typography, and Town Square as an external embedded community widget.

The QR tool at `qr-dex.html` uses plain HTML forms, W3CSS, Font Awesome 4, Canvas 2D, `FileReader`, image upload preview, and a vendored `QRCode for JavaScript` library in `assets/js/qrcode.js`. Its application logic lives in `assets/js/qr-dex.js`.

The Panopto tooling page at `assets/panopto.html` uses static HTML, `assets/styles/panopto.css`, Google Fonts, the UnoCSS runtime CDN, inline dashboard wiring, and `assets/js/panopto/Panopto-Video-DL.js` as a module script. The active Panopto script calls Panopto `DeliveryInfo.aspx` endpoints from the browser, relies on existing Panopto login cookies, opens direct video URLs, and copies HLS stream URLs when needed. A second Panopto adapter, `assets/js/panopto/panopto-dashboard.js`, exports similar browser globals but is not referenced by the current HTML.

Data is kept in JSON files under `assets/json/`. `moods.json` feeds the profile mood selector and `flickr_album_recent.json` feeds the Flickr photo stream. Images, fonts, CSS backgrounds, and audio are treated as direct static files. The tracked asset tree is broad, but it still has some ownership drift: a few committed files are unused, and a few references resolve through brittle or incorrect relative paths.

## 2. Project summary for AI rules, skills, and prompts

This repository is a personal static site with a strong retro web identity. The main page is not a generic portfolio shell. It is a deliberately styled MySpace-era profile: boxed sections, ridge borders, small typography, status and mood chrome, GIF headers, badge-like links, a custom single-song player, a photo stream, an events carousel, bookmarks, and a culture queue. The work is personality-led and asset-led. Future automation or AI guidance should preserve the oddness, density, and desktop-web nostalgia rather than smoothing it into a modern SaaS landing page.

The repo currently has three user-facing page surfaces. `index.html` is the core personal homepage. `qr-dex.html` is a standalone QR image generator. `assets/panopto.html` is a separate Panopto download helper dashboard with a different dark application aesthetic. These pages share the static hosting model, but they do not share one unified design system or app shell yet.

The root files are minimal. `CNAME` maps the site to `jenhammond.me`. `.gitignore` excludes `notes/` and `.cursor/`, which means planning notes and Cursor metadata are local-only. `.vscode/settings.json` disables automatic import rewrites and some Python auto-analysis behavior. There is no `package.json`, no lockfile, no test runner, no formatting configuration, and no framework convention for routes, components, or data loading.

The `assets/` directory is both an application asset store and a place for standalone tools. `assets/styles/` contains global page CSS, QR-specific CSS, Panopto-specific CSS, style-scoped image folders, and a font icon stylesheet. `assets/js/` contains small page scripts, a large vendored AmplitudeJS build, QR code generation logic, audio, and Panopto logic. `assets/json/` holds small content feeds. `assets/imgs/` contains profile images, FF7 sprites, event flyers, media covers, contact-table GIFs, headers, blinkies, badges, status images, favorites, and other decorative layout assets. `assets/fonts/` contains nested material-player font files whose path does not match the current `fonts.css` references.

The most important implementation pattern is direct DOM ownership. HTML declares the layout and IDs/classes. CSS supplies the visual contract. Scripts then find page elements by selector and bind behavior at `DOMContentLoaded` or direct load time. `index.html` also contains inline state code for the mood/status header. There is no data abstraction layer; JSON files and hard-coded markup are the content source.

For prompting or rule creation, describe this project as a static, asset-driven personal site with a preservation-first visual requirement. Ask AI tools to keep the existing profile chrome, naming style, content density, and nostalgic visual language intact. Good changes should make paths, data ownership, responsive behavior, and script boundaries cleaner without flattening the site into a generic modern template.

### 2.1 Design schematic

The main visual schematic starts with a fixed-feel 900px page centered over a tiled animated background. The page has a top profile bar and a two-column layout below it. The left column is narrow and personal: music player, welcome banner, interests, details, bookmarks, and events. The right column is wider and feed-oriented: Town Square, photo activity, writing placeholders, side quests, culture queue, and a secret section.

The core design vocabulary is early-2000s profile chrome. Use white box backgrounds, ridge borders, compact font sizes, blue link treatment, small labels, inline badges, GIF headers, and dense modules. The site should feel hand-assembled in a good way. It can become more organized internally, but the visible result should still read as a personal web page with quirks, not a normalized design-system demo.

Typography is split by surface. The homepage leans on IBM Plex Sans, Space Grotesk, Orbitron, Share Tech Mono, and system Arial fallbacks. The Panopto page uses Atkinson Hyperlegible, Comic Relief, and Lexend. QRImage is plainer and form-like, using default browser and W3CSS styling with a simple green slider accent.

Color and texture carry meaning. The homepage uses black page grounding, white content boxes, blue links, grey borders, rainbow/GIF accents, and dark media-player internals. The Panopto dashboard uses a dark app shell, purple accents, rounded panes, traffic-light dots, and status chips. The QR tool uses a light, utilitarian form layout and purple QR code output.

The component schematic for future rules can be described as:

- Page shell: root document, fonts, global CSS, external libraries, and page scripts.
- Profile chrome: top bar, profile image, status text, mood selector, timestamp, external links, and contact GIF buttons.
- Box modules: each content section owns a small HTML block, a predictable heading style, and a limited set of selectors.
- Data-fed modules: mood selector reads `moods.json`; photo carousel reads `flickr_album_recent.json`; event and media lists are currently hard-coded.
- Tool pages: QRImage and Panopto behave like separate utilities and should not inherit the homepage's visual rules unless intentionally redesigned later.

## 3. Overhaul planning while keeping the current design intact

The safest site overhaul is structural first, visual last. Keep the current layout, section order, colors, typography, GIF usage, and content density in place while moving toward cleaner ownership. The first pass should document every local asset path, fix broken relative paths, and decide which missing referenced assets belong in the repo versus an external sync source. That single cleanup would make later framework work much less risky.

Next, separate page content from page behavior. The homepage currently mixes hard-coded content, inline state logic, CDN setup, and feature scripts in one document. Without changing the rendered page, move repeatable content into small JSON or markdown-like data files where it makes sense: bookmarks, events, culture queue items, writing placeholders, and side quests. Keep static HTML output possible, but make the source of each section clear.

After content ownership is clearer, normalize script boundaries. The mood/status logic in `index.html` can become its own small module beside `player.js`, `photo_stream.js`, and `event_carousel.js`. The Panopto page should load the script that actually defines `scanPanoptoLinks` and `queuePanoptoDownloads`; right now the inline dashboard expects those functions, but the referenced module is the original userscript variant, while `panopto-dashboard.js` looks closer to the dashboard contract. That mismatch should be resolved before a broader rewrite.

For styles, keep the current look but split by role. `main.css` can retain homepage styling while gaining clearer sections for page shell, top bar, reusable boxes, media player, activity stream, events, media queue, and responsive rules. Path references should be made consistent from the CSS file location. The font icon stylesheet should either point to committed font files or be removed if the font is not used.

Framework readiness should be treated as portability work, not a framework migration. Build a clean inventory of pages, local assets, external dependencies, data feeds, and DOM behaviors. Then define future page units in a way any later choice could adopt: routes, layout shell, section components, data files, and client-only widgets. React, Next.js, Astro, Eleventy, SvelteKit, or another tool could all consume that model later, but the repo does not need to choose yet.

The main risk in an overhaul is accidental visual cleanup. Avoid redesigning borders, spacing, GIFs, font choices, or page density while reorganizing internals. Use before/after screenshots when code starts moving. The target is a site that looks the same to visitors but has fewer broken paths, clearer data ownership, smaller script contracts, and a shape that can survive a later technology decision.

## 4. Technology suggestions to replace or extend current functionality

- Static site generator candidate, such as Astro, Eleventy, or another content-first tool. This would keep static hosting simple while giving the project layouts, partials, collections, and repeatable content generation without requiring a full app runtime.

- Component framework candidate, such as React, Vue, Svelte, or Web Components. This could help turn repeated boxes, carousels, player controls, and profile modules into isolated units, but it should be adopted only after the current visual output is captured.

- Data/content layer using JSON, YAML, Markdown, or front matter. Moving bookmarks, events, media queue items, writing entries, and mood options into structured data would reduce HTML churn and make future AI-assisted edits safer.

- Asset manifest and validation script. A small script that scans HTML, CSS, and JS for local asset references would catch missing images, fonts, MP3s, wrong relative paths, and unused committed assets before deployment.

- Modern carousel strategy. Splide is already working, but a future pass could keep it as the standard carousel dependency or replace simple auto-scroll sections with native CSS scroll-snap when behavior is simple enough.

- Module-based JavaScript. Moving inline page behavior into explicit ES modules would make ownership clearer and reduce global leakage while preserving browser-native delivery.

- Type checking by JSDoc or TypeScript. Either option would help document data shapes for moods, Flickr items, Panopto scan results, and carousel setup without forcing a framework choice.

- Image processing pipeline. If the site keeps many event, media, GIF, and photo assets locally, a simple optimization step could normalize dimensions, generate WebP/AVIF where appropriate, and preserve originals for the visual archive.

- Lightweight test and verification tooling. Basic link checks, asset existence checks, and a screenshot comparison workflow would protect the retro design during internal rewrites.

- Dependency hosting policy. CDN links are convenient, but documenting which external scripts and styles are allowed would make the site easier to reproduce and safer to migrate later.

## Current inventory notes

The present repo is small enough to reason about manually. Root files define hosting, editor settings, and pages. `assets/styles/main.css` is the visual center of the homepage. `assets/styles/qr-dex.css` and `assets/styles/panopto.css` are page-specific. `assets/styles/fonts.css` defines a material-player icon font, but the committed font file is nested differently from the referenced path. `assets/js/player.js`, `photo_stream.js`, and `event_carousel.js` support `index.html`. `qrcode.js` and `qr-dex.js` support `qr-dex.html`. `Panopto-Video-DL.js` and `panopto-dashboard.js` both concern Panopto behavior, but the page currently points at the former while its inline dashboard expects functions found in the latter. `amplitude.js` is a large vendored audio library and is not referenced by the current pages.

The biggest consistency issue is not the stack. It is path and ownership drift. Several committed assets are unused, and a few local references are fragile because the path text does not match where the file actually lives. Fixing that inventory will make future rules and skills more reliable because the AI will know which paths are canonical, which files are legacy, and which files are expected to come from an external asset source.

## 5. Hoard Search addition (August 2026)

The repo now includes a fourth page surface: `hoard/index.html`, the Dragon Hoard Search — a static, self-hosted MySpace archive search tool. It follows stricter conventions than the existing pages and serves as the model for any future refactor.

### New files

| Path | Role |
|------|------|
| `hoard/index.html` | Dragon Hoard Search — main app |
| `hoard/app.js` | Load, search, play, bookmark, export logic (vanilla ES2020, no jQuery) |
| `hoard/style.css` | Hoard-specific styles; retro app aesthetic, Unsemantic grid |
| `hoard/version.json` | Generated by `pipeline.py`; fetched no-cache; points at data bundle |
| `hoard/data.<hash>.json.gz` | Generated by `pipeline.py`; immutable, cached by hash filename |
| `hoard/my/index.html` | Personal player sub-site; reads `my/data.json.gz`; no bookmarks/export |
| `pipeline.py` | Offline builder: downloads TSV, dedupes, sorts, delta-encodes, gzips |
| `tools/validate-assets.py` | Asset path validator: scans HTML/CSS/JS for broken local refs |
| `_headers` | Cloudflare Pages caching headers; ignored by GitHub Pages |
| `assets/json/events.json` | Events data extracted from hard-coded HTML (content separation start) |
| `assets/json/bookmarks_rota.json` | Bookmark rota data extracted from hard-coded HTML |

### Hoard conventions to carry forward

The hoard project establishes the target conventions for the full site overhaul:

- **Separate JS module per page**: `app.js` is the only script for `hoard/index.html`; no inline logic in HTML.
- **Data files own content**: `events.json`, `bookmarks_rota.json`, `version.json` — content is never hard-coded in markup when it can live in JSON.
- **Predictable relative paths**: all asset refs use paths correct from the file's own directory; no doubled-prefix bugs.
- **Mobile-first Unsemantic layout**: `grid-container` + `grid-100` + responsive breakpoints on every new page.
- **CDN policy documented**: Fuse.js 7, JSZip, Unsemantic, Splide, jQuery, Font Awesome — all via jsDelivr or cdnjs; no unlocked local copies.

### Path fixes applied

| File | Fix |
|------|-----|
| `assets/styles/fonts.css` | `../fonts/` → `../fonts/fonts/` (actual location of material-player files) |
| `assets/panopto.html` | Script `Panopto-Video-DL.js` → `panopto-dashboard.js` (correct dashboard contract) |
| `assets/panopto.html` | `./assets/styles/panopto.css` → `./styles/panopto.css` (fixed doubled prefix) |
| `assets/panopto.html` | `./assets/js/panopto/` → `./js/panopto/` (fixed doubled prefix) |
| `qr-dex.html` | Removed broken `./images/demo_squid.png` favicon reference |
| `.gitignore` | Added `metadata.tsv` (large local-only download) |

### Framework readiness inventory

Routes (page surfaces):

| URL | File | Stack |
|-----|------|-------|
| `/` | `index.html` | jQuery, Splide, Font Awesome, vanilla JS |
| `/qr-dex.html` | `qr-dex.html` | W3CSS, Font Awesome 4, vanilla JS |
| `/assets/panopto.html` | `assets/panopto.html` | UnoCSS runtime, Google Fonts, vanilla JS module |
| `/hoard/` | `hoard/index.html` | Fuse.js 7, JSZip, Unsemantic, vanilla JS |
| `/hoard/my/` | `hoard/my/index.html` | Fuse.js 7, Unsemantic, inline script |

Layout shell components (present in `index.html`):

- `#top-bar` — profile header: pic, status, mood, links
- `#left-column` — narrow: player, banner, interests, details, bookmarks, events
- `#right-column` — wide: Town Square, activity stream, media queue, side quests
- `.music_player_container` — single-song player (player.js)
- `#photo-carousel-list` — Flickr stream (photo_stream.js)
- `#event-carousel` — events Splide (event_carousel.js)

Data feeds to externalize (content separation target):

| Section | Current | Target |
|---------|---------|--------|
| Events | Hard-coded HTML slides | `assets/json/events.json` ✓ extracted |
| Bookmark rota | Hard-coded `<li>` list | `assets/json/bookmarks_rota.json` ✓ extracted |
| Culture queue | Hard-coded `<div>` slots | `assets/json/culture_queue.json` (pending) |
| Writing entries | Hard-coded placeholder | `assets/json/writing.json` (pending) |
| Side quests | Hard-coded placeholder | `assets/json/side_quests.json` (pending) |
| Mood options | `assets/json/moods.json` | already a data file |
| Photo stream | `assets/json/flickr_album_recent.json` | already a data file |

Script boundary targets (script normalization):

- Extract inline mood/status logic from `index.html` → `assets/js/mood.js`
- Confirm `assets/js/event_carousel.js` loads events from `assets/json/events.json` (currently reads from pre-rendered HTML)
- Add loader script for bookmarks rota reading `assets/json/bookmarks_rota.json`
- Remove or document `assets/js/amplitude.js` (unused vendored library)
