# JavaScript functionalities

## player.js

Files referenced or utilized:
- `index.html`
- `assets/styles/main.css`
- `assets/js/audio/Jay-Z x 3 Doors Down - Here Without You Remix.mp3`
- External `jquery.min.js`
- External Font Awesome CSS

`player.js` powers the small MySpace-style single-song player in the homepage left column. It sets the visible track title and artist, swaps the play button between play and stop states, starts/stops browser audio playback, and drives the fake equalizer bars.

The script waits for jQuery's ready callback and exits if `.music_player_container` is missing, which lets the file load safely on pages without the player. When playback starts, it creates a new `Audio` object using the hard-coded MP3 path, updates the button icon and ARIA label, and starts a `setInterval` loop. The visualizer randomly appends or removes `.music_player_visual_pip` elements inside the eight bar containers, while CSS in `main.css` gives those pips their stacked colors. Stopping playback pauses and resets the audio, clears the interval, removes generated pips, and restores the play icon.

## photo_stream.js

Files referenced or utilized:
- `index.html`
- `assets/json/flickr_album_recent.json`
- `assets/styles/main.css`
- External Splide JS and Splide auto-scroll extension
- External Flickr image URLs stored in `flickr_album_recent.json`

`photo_stream.js` populates the homepage photo carousel from the local Flickr JSON feed. It turns the first eight feed items into Splide slide markup with image thumbnails, titles, capture/upload dates, and outbound Flickr links.

The script runs after `DOMContentLoaded`, finds `#photo-carousel-list`, and stops if the target does not exist. It fetches `assets/json/flickr_album_recent.json` with `cache: 'no-store'`, maps each item into an HTML string, and injects the resulting slides into the list. If the global `Splide` object exists, it mounts a looped, auto-width, free-drag carousel with the auto-scroll extension. Errors are caught and logged, so a failed feed fetch does not break the rest of the page.

## event_carousel.js

Files referenced or utilized:
- `index.html`
- `assets/styles/main.css`
- External Splide JS and Splide auto-scroll extension
- Event flyer image paths declared in `index.html`

`event_carousel.js` normalizes event flyer thumbnail behavior and mounts the upcoming-events carousel on the homepage. It does not create event content itself; it enhances the hard-coded event cards already present in `index.html`.

The script first updates every `.thumbnail--portrait` image with fixed `width`, `height`, async decoding, and lazy loading where not already set. It then looks for `#event-carousel` and the global `window.Splide`; if either is missing, it exits without throwing. The carousel uses looped, free-drag, auto-width behavior and respects `prefers-reduced-motion` by mounting without the auto-scroll extension when reduced motion is requested or the extension is unavailable. It exposes `normalizePortraitThumbnails` on `window`, which makes the thumbnail normalization reusable from the console or future scripts.

## qr-dex.js

Files referenced or utilized:
- `qr-dex.html`
- `assets/js/qrcode.js`
- `assets/styles/qr-dex.css`
- Uploaded image files selected through the browser file input
- Canvas elements `#imageCanvas` and `#myCanvas`

`qr-dex.js` is the application logic for QRImage, the standalone QR code generator. It accepts an optional uploaded image, a URL string, bit-size and border sliders, an error-correction setting, and a white-background toggle, then draws a customized QR code to canvas for PNG download.

On load, it binds the file input to `FileReader`, previews the uploaded image on `#imageCanvas`, and initializes a hidden `QRCode` instance supplied by `qrcode.js`. Slider handlers keep the printed values and internal drawing variables in sync. `makeCode()` validates the URL, asks the QR library to generate the module matrix, sizes the output canvas, optionally paints the uploaded image behind the QR modules, and draws each QR bit as a square whose size is controlled by the bit-size slider. Position bits are forced to full-size squares through `isSafeBit()` so the generated code stays more scannable.

## qrcode.js

Files referenced or utilized:
- `qr-dex.html`
- `assets/js/qr-dex.js`
- DOM target `#qrcode`
- Canvas, SVG, table, and image APIs inside the browser

`qrcode.js` is a vendored copy of `QRCode for JavaScript`. It provides the global `QRCode` constructor and the error-correction/model internals that `qr-dex.js` uses to build QR module data.

The library turns text into QR byte data, chooses a QR type number, computes Reed-Solomon error-correction blocks, maps the resulting bitstream into a QR matrix, and draws the result. Depending on browser support, it can draw with Canvas, SVG, or an HTML table fallback. In this project, `qr-dex.js` mostly uses it as a matrix generator by reading `qrcode._oQRCode.modules` after `qrcode.makeCode(url)`. That private-field usage works with this vendored version but should be treated carefully in any future library replacement.

## amplitude.js

Files referenced or utilized:
- No current local HTML reference found
- Internal package metadata for `amplitudejs` 5.3.2
- Browser audio APIs, media events, and DOM APIs inside the vendored library

`amplitude.js` is a large vendored build of AmplitudeJS, an audio-player library. It is committed under `assets/js/`, but the current pages do not load it, and the homepage music player instead uses the smaller custom `player.js`.

The library provides a full-featured audio control system: audio state management, playlists, metadata, album art updates, playback controls, events, and browser capability handling. Its internal code creates and manages `Audio` objects and updates DOM elements based on active song metadata. For this project, it looks like either a previous player experiment or a future option, not active site behavior. If kept, it should be documented as a candidate dependency; if unused, removing it would reduce repo weight and confusion.

## Panopto-Video-DL.js

Files referenced or utilized:
- `assets/panopto.html`
- Panopto Viewer, Embed, List, and `DeliveryInfo.aspx` endpoints
- Browser `fetch`, `Blob`, `URL.createObjectURL`, `navigator.clipboard`, `window.open`, and `localStorage`
- Greasemonkey/Tampermonkey APIs when available: `GM_addStyle`, `GM_setClipboard`, `GM_openInTab`, `GM_registerMenuCommand`
- External Notify userscript library when run as a userscript

`Panopto-Video-DL.js` is the original Panopto downloader userscript adapted into the repository. It injects download controls into Panopto pages, requests delivery metadata, extracts stream and caption URLs, copies HLS links, opens direct downloads, and can generate SRT subtitle files.

The script is wrapped in an immediately invoked function and branches based on `location.pathname` for Panopto list, viewer, and embed pages. It posts to `location.origin + '/Panopto/Pages/Viewer/DeliveryInfo.aspx'`, reads `PodcastStreams`, `Streams`, and `AvailableCaptions`, then decides whether to open a direct URL or copy a stream URL for another downloader. It also creates modal UI fragments and inline styles directly in the target page. In the current repo, `assets/panopto.html` references this file, but that dashboard's inline code expects globals such as `scanPanoptoLinks` and `queuePanoptoDownloads`, which this userscript file does not define.

## panopto-dashboard.js

Files referenced or utilized:
- No current local HTML reference found
- Intended companion for `assets/panopto.html`
- Panopto `DeliveryInfo.aspx` and login endpoints
- Browser `fetch`, `credentials: 'include'`, `navigator.clipboard`, `window.open`, and DOM modal creation

`panopto-dashboard.js` is a dashboard-oriented Panopto adapter that matches the inline function contract in `assets/panopto.html`. It parses pasted Panopto URLs, checks login state, exposes scan results to the page, and queues downloads in automatic or manual stream-selection modes.

The script defines `parsePanoptoUrl()`, posts authenticated requests to the detected Panopto host, extracts primary and alternate streams, and places `scanPanoptoLinks` plus `queuePanoptoDownloads` on `window`. In auto mode it chooses the primary stream, opens direct media URLs, or copies HLS URLs when clipboard access works. In manual mode it builds a temporary modal stream chooser before opening or copying the chosen source. It appears more appropriate for `assets/panopto.html` than the currently referenced `Panopto-Video-DL.js`, but it is not loaded by that page in the current snapshot.
