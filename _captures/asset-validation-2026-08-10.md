# Asset validation report — 2026-08-10

Run: `python tools/validate-assets.py`

## Summary

- **Broken references: 0** — no HTML/CSS/JS path is pointing at a missing file.
- **Unreferenced committed assets: 117** — files present in the repo but not found in any scanned source.
- **Possible path mismatches: 0**

## Notes on unreferenced assets

These are **not broken** — they are a design palette, Dropbox-synced library, and future-use assets.

### JSON feeds flagged as unreferenced
`bookmarks_rota.json`, `events.json`, `flickr_album_recent.json`, `moods.json` are loaded via
`fetch()` at runtime, not referenced as static paths, so the validator does not see them. This is
expected. After Phase 2 render scripts land, the validator may or may not catch fetch URLs —
acceptable either way.

### Dividers / badges / blinkies
`assets/styles/imgs/dividers/`, `assets/imgs/layout/badges/`, `assets/imgs/layout/blinkies/` —
large image library used as a rotating design palette. Not removing any of these.

### Player assets
`assets/js/audio/Jay-Z x 3 Doors Down - Here Without You Remix.mp3` is loaded by `player.js`
with a hard-coded path inside the script. The validator cannot see dynamic string refs.
`assets/imgs/player/` EQ images are similarly player-internal refs.

### amplitude.js
`assets/js/amplitude.js` — not currently linked from any page. Possibly a former experiment.
Keep until there is a reason to remove.

### panopto.html and panopto JS
`assets/panopto.html` and `assets/js/panopto/Panopto-Video-DL.js` are standalone tools.
Not linked from index.html by design.

## Action taken
No paths changed. Goal was documentation only.
