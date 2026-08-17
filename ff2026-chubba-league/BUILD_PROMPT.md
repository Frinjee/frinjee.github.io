# Build prompt: FF2026 Chubba League resource page

Paste this whole file into an external coding agent. Build only what this document asks for. Do not invent a framework, do not copy a MySpace/retro profile look, and do not add controls marked as removed.

---

## 1. Goal

Build a static page at:

- **URL:** `https://jenhammond.me/ff2026-chubba-league/`
- **Folder:** `ff2026-chubba-league/`

It is a beginner-friendly fantasy football resource hub for a 12-team Half-PPR league. Four experienced members use it to help newer managers this season. The page has two jobs:

1. A full-width searchable rankings table (top section).
2. A minimal modern bento layout of curated resources (below).

Audience: people learning fantasy football. Keep copy short and plain.

---

## 2. Hard stack constraints

Taken from the site's Hoard-style app conventions. Use only these.

| Rule | Detail |
|------|--------|
| Hosting | Static site (GitHub Pages / Cloudflare Pages). No server runtime. |
| Languages | Plain HTML, CSS, browser JavaScript. |
| Build | No bundler, no package.json requirement, no React/Vue/Svelte/Astro/Next. |
| Ownership | One HTML shell, one page CSS, one page JS module. Content in data files. |
| Layout shell | Mobile-first. Viewport meta required. Use [Unsemantic](https://unsemantic.com/about) (`grid-container`, `grid-100`, tablet/mobile grids) for the page shell and breakpoints. |
| Bento cells | CSS Grid inside the Unsemantic shell (Unsemantic alone is weak for asymmetric bento). |
| Modules | Prefer one ES module (`app.js` as `type="module"`). JSDoc typedefs are fine. |
| CDNs | jsDelivr or cdnjs only for libraries/fonts/icons. Document every external URL in an HTML comment near the includes. |
| Accessibility | Labeled controls, table headers with `scope`, `role="status"` live region for filter/search results count, keyboard-usable toggles and carousel. |
| Paths | Relative paths correct from `ff2026-chubba-league/`. |

Do **not** use: jQuery, Splide, Fuse.js, JSZip, gzip data bundles, Town Square, or the main site's ridge/GIF/MySpace chrome.

---

## 3. File layout

```
ff2026-chubba-league/
  index.html
  style.css
  app.js
  08-16-rankings.csv
  data/
    resources.json
  BUILD_PROMPT.md   (this file; leave in place)
```

Optional later: more JSON or CSV refreshes. Default templates in `resources.json` stay small (manual expansion later).

---

## 4. Visual direction

Modern, minimal, calm utility page. One composition per viewport section. Not a dashboard of cards stacked for decoration.

- Define CSS custom properties for background, surface, text, accent, border, muted text.
- Prefer a quiet light surface with a soft atmospheric background (subtle gradient or faint pattern). Avoid flat pure white only if it feels dead; still keep contrast readable.
- Typography: pick purposeful free fonts from Google Fonts or Fontshare (not Inter, Roboto, Arial, or system-only stacks as the primary face).
- Avoid these AI-default looks: purple-to-indigo gradients, warm cream + terracotta + display serif, broadsheet hairline newspaper columns, glow effects, rounded-full pill spam, multi-layer shadows, decorative emojis.
- Cards: only when they wrap a real interaction or a resource link group. Rankings toolbar and table are not "card widgets." Hero/bento should not be a collage of floating badges.
- Motion: 2–3 small intentional motions max (e.g. toggle state, carousel slide, row hover). Respect `prefers-reduced-motion`.
- Mobile and desktop both work. Rankings toolbar stays usable on narrow screens (wrap controls vertically if needed; still no horizontal scroll on the toolbar itself).

---

## 5. Page architecture

### Top: rankings band (full width of page max-width)

- Spans the allotted page boundary with tightened margin and padding.
- **No horizontal scrollbar on the control row.**
- Contains the searchable rankings interface described in section 6.
- Default visible player rows: **top 12 overall** (All Pos). Table body scrolls vertically to see the rest of the filtered list.
- If stat columns overflow, allow **horizontal scroll only on the table wrapper**, not on the whole page or toolbar.

### Below: resource bento

CSS grid bento with three resource types (section 7). One job per cell: headline, short support line, content.

Suggested desktop structure (adjust spans as needed):

- One wide cell: external articles/PDFs list
- One medium cell: YouTube carousel + supplemental links
- One medium cell: league-created GDrive docs

On mobile, stack to a single column.

---

## 6. Rankings interface

Scoring is fixed **Half-PPR**. Show a static text label such as `Half-PPR` if useful. Do **not** ship a scoring dropdown.

### Controls to include

1. **Position dropdown** (default `All Pos`)
   - Options: `All Pos`, `QB`, `RB`, `WR`, `TE`, `K`, `D/ST`, `FLEX`
   - `FLEX` filters to players whose `Pos` is `RB`, `WR`, or `TE`
   - CSV stores defense as `DST`; display as `D/ST`
2. **Proj / Stats toggle** (pill or segmented control)
   - `Proj` shows projection columns
   - `Stats` shows non-projection stat columns
3. **Search** (magnifying glass + text input)
   - Filter players by name (case-insensitive substring is enough)

### Controls to omit

- Scoring selector (H-PPR dropdown)
- ADP selector / ADP source switcher
- Download / export button
- Player notepad / notes icons
- Tier band headers (no tier column in data)

### Columns

Always show (order):

| UI | CSV field(s) |
|----|----------------|
| RK | `RK` |
| PLAYER | `Player` (+ optional Status badge; see icons) |
| POS | `Pos` (badge; map `DST` → `D/ST`) |
| TEAM | `Team` (logo or abbr fallback) |
| BYE | `BYE` |
| PTS | `PTS` when Stats; `PTS (Projections)` when Proj |
| SOS RANK | `SoS Rank` |
| ADP | `ADP (Y!)` |
| P-RK | `P-RK` |

Then position-relevant stat columns. Empty / missing values render as `—`.

**Stats mode** uses base columns:

`YPC`, `Rush`, `RUSH YDS`, `RUSH TD`, `REC`, `REC YDS`, `REC TD`, `YPR`, `Rec/Tar Game`, `PASS YDS`, `PASS TD`, `INT`, `CMP%`, `ATT/ GM`, `QB YPC`

**Proj mode** uses matching `* (Projections)` columns:

`YPC (Projections)`, `Rush (Projections)`, `RUSH YDS (Projections)`, `RUSH TD (Projections)`, `REC (Projections)`, `REC YDS (Projections)`, `REC TD (Projections)`, `YPR (Projections)`, `Rec/Tar Game (Projections)`, `PASS YDS (Projections)`, `PASS TD (Projections)`, `INT (Projections)`, `CMP% (Projections)`, `ATT/ GM (Projections)`, `QB YPC (Projections)`

Do not show `Auction $` or `Target Round` unless you have spare width and keep them optional/hidden by default.

### Behavior

1. Load `08-16-rankings.csv` with `fetch` (same origin).
2. Parse CSV in JS (small dependency-free parser is fine; Papa Parse via CDN is acceptable if documented).
3. Always keep overall `RK` ascending order after filtering (do not re-sort by `P-RK`).
4. Apply position filter, then name search.
5. Render all matching rows into a scrollable tbody/viewport sized to show ~12 rows by default.
6. Update a live region: e.g. `Showing 12 of 400` / `Showing 8 of 95 RBs`.
7. Soft-fail if CSV missing: visible message, empty table, no console-only failure.

### Visual cues (lightweight)

- Rank number in a small accent square/circle is fine.
- POS as a compact badge.
- PTS and SOS can use distinct text colors for scanability (not neon).
- Alternating row backgrounds for readability.

---

## 7. Resource bento types

Drive content from `data/resources.json`. Keep descriptions to **one short sentence** (about 1–1.8 sentences max). Prefer one.

### Type 1: External resources

Hyperlinked title → article, PDF, or tool. Brief description.

Example shape:

```json
{
  "external": [
    {
      "title": "Fantasy RB Sleepers",
      "source": "Rotowire",
      "url": "https://example.com/rb-sleepers",
      "blurb": "A shortlist of sleeper RB picks for Half-PPR."
    }
  ]
}
```

Render as: `Fantasy RB Sleepers (Rotowire): A shortlist of sleeper RB picks for Half-PPR.`

Ship **4–8** placeholder external items max in the default template (editable later).

### Type 2: Video cell

- Carousel of **3–5** YouTube embeds (`https://www.youtube-nocookie.com/embed/{id}`)
- Compact list of **3–4** supplemental links under the carousel
- Controls: prev/next (and dots or a counter). Keep chrome small.

```json
{
  "videos": {
    "items": [
      { "title": "Draft strategy basics", "youtubeId": "dQw4w9WgXcQ" }
    ],
    "links": [
      { "title": "League rules PDF", "url": "https://drive.google.com/..." }
    ]
  }
}
```

### Type 3: League-created resources

Hyperlinked title → Google Drive PDF/Doc/Sheet. Brief description. Default template: **4–5** items only.

```json
{
  "leagueDocs": [
    {
      "title": "Jen's Drafting Recap",
      "url": "https://docs.google.com/...",
      "blurb": "Recap of draft decisions and afterthoughts from Jen, Tai, & Garrett."
    }
  ]
}
```

Use real placeholder URLs the maintainers can replace (`#` is acceptable only if styled as disabled and labeled "add link").

---

## 8. CSV contract: `08-16-rankings.csv`

Place the rankings file next to `index.html` as **`08-16-rankings.csv`**.

Expected header (Rotoballer-style Half-PPR overall rankings):

```text
RK,Player,Pos,Team,BYE,PTS,SoS Rank,ADP (Y!),P-RK,YPC,Rush,RUSH YDS,RUSH TD,REC,REC YDS,REC TD,YPR,Rec/Tar Game,PASS YDS,PASS TD,INT,CMP%,ATT/ GM,QB YPC,PTS (Projections),YPC (Projections),Rush (Projections),RUSH YDS (Projections),RUSH TD (Projections),REC (Projections),REC YDS (Projections),REC TD (Projections),YPR (Projections),Rec/Tar Game (Projections),PASS YDS (Projections),PASS TD (Projections),INT (Projections),CMP% (Projections),ATT/ GM (Projections),QB YPC (Projections),Auction $,Target Round
```

Known `Pos` values: `QB`, `RB`, `WR`, `TE`, `K`, `DST`.

Known `Team` values: standard NFL abbreviations (`DET`, `ATL`, `LAR`, …).

**Not in this CSV:**

- Injury / game status (`Q`, `IR`, `O`, etc.)
- Tier numbers
- Player notes

Do not invent injury statuses. See icons section for optional future `Status` support.

---

## 9. CDN and icons appendix

Document every include. Prefer pinned versions on jsDelivr/cdnjs.

### Available (use these)

| Need | Suggested source | Notes |
|------|------------------|-------|
| Unsemantic CSS | jsDelivr or unsemantic.com CSS | Page shell / breakpoints |
| UI icons (search, chevron) | Lucide or Font Awesome via jsDelivr | Decorative; pair with text labels / `aria-label` |
| Fonts | Google Fonts or Fontshare | Pick 1–2 families; keep request light |
| NFL team logos | `https://a.espncdn.com/i/teamlogos/nfl/500/{abbr}.png` | Lowercase CSV team abbr. On `error`, fall back to text abbr. Personal non-commercial page only; not an official NFL CDN; trademarks belong to the NFL / clubs. |
| NFL logos alternate | nflverse squared logos via GitHub raw / nflverse data | Use if ESPN hotlink fails broadly |
| CSV parse (optional) | Papa Parse on cdnjs/jsDelivr | Or write a tiny RFC4180-ish parser |
| YouTube | `youtube-nocookie.com` iframes | Lazy-load iframes when possible |

### Not available / do not fake

| Need | Reality |
|------|---------|
| Official free injury-status icon CDN (Q, IR, O) | None reliable for this stack. Use small local CSS text badges (`Q`, `IR`) only when a `Status` field exists. |
| Live injury feed | Out of scope. Do not scrape or invent. |
| Official NFL logo CDN with license grant | Not provided here. Hotlink patterns above are common in open fantasy tooling; still trademarked. |

### Optional Status badges

If a future CSV/JSON adds `Status` with values like `Q` or `IR`, render a compact colored text badge beside the player name. If absent, render nothing (no empty icon hole).

---

## 10. Implementation notes for `app.js`

Keep responsibilities clear:

1. Fetch and parse CSV → array of player objects.
2. Fetch `data/resources.json` → render bento sections.
3. Wire position select, Proj/Stats toggle, search input.
4. Re-render table on filter/mode change.
5. Wire video carousel prev/next.

Avoid global library soup. No localStorage requirement for v1.

---

## 11. Acceptance checklist

- [ ] Page loads at `/ff2026-chubba-league/` with viewport meta and mobile-usable layout
- [ ] Stack is static HTML/CSS/vanilla JS module; no framework
- [ ] Unsemantic used for shell; CSS Grid used for bento
- [ ] Rankings toolbar full width of content max-width; tightened spacing; **no** toolbar horizontal scrollbar
- [ ] Controls present: position dropdown, Proj/Stats toggle, search
- [ ] Controls absent: scoring dropdown, ADP selector, download button
- [ ] Position options include All Pos, QB, RB, WR, TE, K, D/ST, FLEX
- [ ] FLEX = RB + WR + TE
- [ ] DST displayed as D/ST
- [ ] Data loads from `08-16-rankings.csv`
- [ ] Default view: top 12 overall visible; vertical scroll reveals more
- [ ] Proj vs Stats swaps the correct column sets
- [ ] Empty stats show `—`
- [ ] Search filters by player name
- [ ] Live region announces result counts
- [ ] Team logos load with text fallback
- [ ] Q/IR only if Status provided; otherwise omitted
- [ ] Bento has external links, YouTube carousel (3–5) + 3–4 links, league docs (4–5 defaults)
- [ ] Blurbs stay to one short sentence
- [ ] External CDNs documented; youtube-nocookie used for embeds
- [ ] `prefers-reduced-motion` honored for carousel/animations
- [ ] No MySpace/retro profile styling borrowed from the main homepage

---

## 12. What not to build in v1

- User accounts, chat, draft room simulator
- Editable rankings or admin CMS
- Scoring format switcher beyond fixed Half-PPR
- ADP source switcher or CSV download button
- Injury API integration
- Tier headers / notepad icons
- More than ~5 league-doc templates by default

---

End of prompt. Build the page to satisfy sections 1–11.
