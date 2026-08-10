/*
  hoard/app.js — Dragon Hoard Search
  load: version.json (no-cache) -> data.<hash>.json.gz (force-cache) -> materialize -> Fuse index
  features: search (hybrid contains-first + Fuse fallback, a:/t: field scope),
            browse (A-Z letter strip / shuffle), play, bookmarks, bulk download, export
*/

'use strict';

// ---- constants ----
const MAX_RESULTS   = 500;
const PAGE_SIZE     = 100;
const DL_DELAY      = 600;   // ms between bulk downloads
const LS_KEY        = 'hoard_bookmarks_v1';
const ARCHIVE_PFX   = 'https://archive.org/download/';
// Archive item that hosts the MySpace Dragon Hoard MP3s as per-path zip files.
// URL format: HOARD_ITEM + '{col}.zip/{col}%2F{filename}'
// Derived from the original viewer.js parseMetadata() in myspace_dragon_hoard_searcher.
const HOARD_ITEM    = 'https://archive.org/download/myspace_dragon_hoard_2010/';

// ---- state ----
let hoardData  = null;   // raw bundle {p, a, t, e}
let entries    = [];     // materialized [{ai, ti, url}]
let fuseInst   = null;
let results    = [];     // current search result entries
let curPage    = 0;
let bookmarks  = loadBookmarks();
let curEntry   = null;   // currently playing
let isPlaying  = false;
let dlRunning  = false;
// radio + seek state
let radioMode  = false;
let isSeeking  = false;
// fallback state
const deadUrls = new Set();   // permanent stream failures
let retryCount = 0;           // reset on each new src assignment
// hybrid search: pre-lowercased lookup arrays (indexed by ai / ti)
let lcArtists  = [];
let lcTitles   = [];
// tracks whether last search used Fuse (for '(capped)' indicator)
let lastSearchWasFuse = false;
// browse tab
let letterIndex    = new Map();  // first-letter key → entries[]
let browseResults  = [];         // current browse tab result list
let browsePage     = 0;
let browseLabelCtx = '';         // context string shown in browse-info

// ---- dom refs (assigned after DOMContentLoaded) ----
let elQ, elResultsInfo, elResultsTbody, elPagination;
let elBmBadge, elBmTbody, elBmEmpty, elBmActions;
let elStatus, elNowPlaying, elAudio, elAudioBtn;
let elOverlay, elOverlayMsg, elOverlaySub;
let elTabSearch, elTabBm, elTabExport, elTabBrowse;
let elBrowseInfo, elBrowseTbody, elBrowsePagination;
let elSeekBar, elSeekTime, elSeekDuration, elRadioBtn;

// ---- init ----
document.addEventListener('DOMContentLoaded', () => {
  elQ                = document.getElementById('q');
  elResultsInfo      = document.getElementById('results-info');
  elResultsTbody     = document.getElementById('results-tbody');
  elPagination       = document.getElementById('pagination');
  elBmBadge          = document.getElementById('bm-badge');
  elBmTbody          = document.getElementById('bm-tbody');
  elBmEmpty          = document.getElementById('bm-empty');
  elBmActions        = document.getElementById('bm-actions');
  elStatus           = document.getElementById('status-msg');
  elNowPlaying       = document.getElementById('now-playing-text');
  elAudio            = document.getElementById('audio-el');
  elAudioBtn         = document.getElementById('audio-btn');
  elOverlay          = document.getElementById('loading-overlay');
  elOverlayMsg       = document.getElementById('loading-msg');
  elOverlaySub       = document.getElementById('loading-sub');
  elTabSearch        = document.getElementById('tab-search');
  elTabBm            = document.getElementById('tab-bm');
  elTabExport        = document.getElementById('tab-export');
  elTabBrowse        = document.getElementById('tab-browse');
  elBrowseInfo       = document.getElementById('browse-info');
  elBrowseTbody      = document.getElementById('browse-tbody');
  elBrowsePagination = document.getElementById('browse-pagination');
  elSeekBar          = document.getElementById('seek-bar');
  elSeekTime         = document.getElementById('seek-time');
  elSeekDuration     = document.getElementById('seek-duration');
  elRadioBtn         = document.getElementById('radio-btn');

  setupTabs();
  setupSearch();
  setupAudio();
  setupRadio();
  setupBmActions();
  setupBrowse();
  updateBmBadge();
  renderBmTable();

  run();
});

async function run() {
  setOverlay('loading version info\u2026', '');
  try {
    const ver = await fetch('version.json', { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error(`version.json HTTP ${r.status}`);
      return r.json();
    });
    setStatus(`${ver.n?.toLocaleString() ?? '?'} tracks \u2014 v${ver.v} built ${ver.built ?? ''}`);
    setOverlay(`loading bundle (${ver.n?.toLocaleString() ?? '?'} tracks)\u2026`, 'first visit ~5s; cached visits instant');
    hoardData = await loadBundle(ver.v);
    setOverlay('building search index\u2026', 'one-time setup; results ready in seconds');
    // yield to browser paint before blocking Fuse init
    await tick();
    entries = materialize(hoardData);
    buildFuse();
    buildAlphaStrip();
    hideOverlay();
    setStatus(`${hoardData.e.length.toLocaleString()} tracks ready \u2014 type to search`);
  } catch (err) {
    setOverlay('\u26a0 load failed', err.message);
    elOverlayMsg && (elOverlayMsg.style.color = '#ff6644');
    console.error('[hoard]', err);
  }
}

// ---- bundle loading ----
async function loadBundle(hash) {
  const resp = await fetch(`data.${hash}.json.gz`, { cache: 'force-cache' });
  if (!resp.ok) throw new Error(`bundle HTTP ${resp.status}`);
  const buf = await resp.arrayBuffer();
  const magic = new Uint8Array(buf, 0, 2);

  // gzip magic bytes 1f 8b — decompress manually
  if (magic[0] === 0x1f && magic[1] === 0x8b) {
    if (typeof DecompressionStream !== 'undefined') {
      return gunzip(buf);
    }
    // no DecompressionStream — try plain json fallback (--plain flag)
    const pr = await fetch(`data.${hash}.json`, { cache: 'force-cache' });
    if (pr.ok) return pr.json();
    throw new Error('DecompressionStream unavailable; re-run pipeline.py --plain for old browser support');
  }

  // not gzip — already decompressed (Cloudflare Content-Encoding) or plain json
  return JSON.parse(new TextDecoder().decode(buf));
}

async function gunzip(buf) {
  const ds     = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();
  writer.write(new Uint8Array(buf));
  writer.close();
  const chunks = [];
  let done = false;
  while (!done) {
    const { value, done: d } = await reader.read();
    done = d;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out   = new Uint8Array(total);
  let off     = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return JSON.parse(new TextDecoder().decode(out));
}

// ---- materialize delta-encoded entries ----
function materialize(data) {
  let prev = 0;
  return data.e.map(([da, ti, rel]) => {
    const ai = prev + da;
    prev = ai;
    // rel is the original MySpace CDN URL (http://cache*.myspacecdn.com/{col}/{file}).
    // Map it to the archive.org myspace_dragon_hoard_2010 zip path — the same logic
    // used by the original viewer.js parseMetadata() in the archive item.
    // For future rebuilt bundles where rel is already a bare archive path, fall back.
    let url;
    if (rel.startsWith('http://') || rel.startsWith('https://')) {
      const parts = rel.split('/');
      const col   = parts[3];   // e.g. '81'
      const file  = parts[4];   // e.g. 'std_0c6ecb7a...mp3'
      url = `${HOARD_ITEM}${col}.zip/${col}%2F${file}`;
    } else {
      url = data.p + rel;
    }
    return { ai, ti, url };
  });
}

// ---- fuse index + browse indexes ----
function buildFuse() {
  // Pre-lowercase lookup arrays: O(1) access during every hybrid search pass.
  // Indexed by artist-index (ai) / title-index (ti) — same keys as entries[].
  lcArtists = hoardData.a.map(s => (s || '').toLowerCase());
  lcTitles  = hoardData.t.map(s => (s || '').toLowerCase());

  // Letter index for A-Z browse tab: one O(n) pass, built once.
  letterIndex = new Map();
  for (const entry of entries) {
    const first = (hoardData.a[entry.ai] || '')[0] || '';
    const key   = /[A-Za-z]/.test(first) ? first.toUpperCase() : '#';
    if (!letterIndex.has(key)) letterIndex.set(key, []);
    letterIndex.get(key).push(entry);
  }

  // Fuse is now the typo-fallback only; tighter threshold reduces fuzzy noise.
  fuseInst = new Fuse(entries, {
    threshold:          0.2,          // was 0.35 — stricter, fewer spurious hits
    ignoreLocation:     true,
    includeScore:       true,
    minMatchCharLength: 2,            // don't fire on 1-char input
    keys: [
      { name: 'artist', weight: 2, getFn: e => hoardData.a[e.ai] },
      { name: 'title',  weight: 1, getFn: e => hoardData.t[e.ti] },
    ],
  });
}

// ---- search ----
let debounce = null;

function setupSearch() {
  elQ.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(doSearch, 200);
  });
  elQ.addEventListener('keydown', e => {
    if (e.key === 'Escape') { elQ.value = ''; doSearch(); }
  });
}

function doSearch() {
  if (!fuseInst) return;
  const raw = elQ.value.trim();

  // parse optional field-scope prefix:  a:query  or  t:query
  let field = null;
  let q = raw;
  if (/^a:/i.test(raw)) { field = 'artist'; q = raw.slice(2).trim(); }
  else if (/^t:/i.test(raw)) { field = 'title';  q = raw.slice(2).trim(); }

  if (!q) {
    results = []; curPage = 0; renderResults(); return;
  }

  const ql = q.toLowerCase();
  lastSearchWasFuse = false;

  if (field) {
    // field-scoped: direct prefix + contains filter; no Fuse fallback needed
    const getLC  = field === 'artist' ? (e => lcArtists[e.ai]) : (e => lcTitles[e.ti]);
    const pre    = entries.filter(e => getLC(e).startsWith(ql));
    const preSet = new Set(pre);
    const con    = [];
    for (const e of entries) {
      if (con.length >= MAX_RESULTS) break;
      if (!preSet.has(e) && getLC(e).includes(ql)) con.push(e);
    }
    results = [...pre, ...con];
  } else {
    // unscoped hybrid: prefix hits first (artist + title), then contains hits,
    // fall through to Fuse only when direct matches are sparse (typo queries).
    const pre    = entries.filter(e => lcArtists[e.ai].startsWith(ql) || lcTitles[e.ti].startsWith(ql));
    const preSet = new Set(pre);
    const con    = [];
    for (const e of entries) {
      if (con.length >= MAX_RESULTS) break;
      if (!preSet.has(e) && (lcArtists[e.ai].includes(ql) || lcTitles[e.ti].includes(ql))) con.push(e);
    }
    if (pre.length + con.length >= 5) {
      results = [...pre, ...con];
    } else {
      // Fuse fallback: handles typos/transpositions
      results           = fuseInst.search(q, { limit: MAX_RESULTS }).map(r => r.item);
      lastSearchWasFuse = true;
    }
  }

  curPage = 0;
  renderResults();
}

// ---- render results ----
function renderResults() {
  const total     = results.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const start     = curPage * PAGE_SIZE;
  const slice     = results.slice(start, start + PAGE_SIZE);

  if (!total) {
    elResultsInfo.textContent  = elQ.value.trim() ? '0 results' : '';
    elResultsTbody.innerHTML   = '';
    elPagination.innerHTML     = '';
    return;
  }

  const capped = lastSearchWasFuse && total === MAX_RESULTS ? ' (capped)' : '';
  elResultsInfo.textContent = `${total.toLocaleString()} result${total === 1 ? '' : 's'}${capped}  \u2014  page ${curPage + 1} of ${pageCount}`;

  const rows = slice.map(entry => buildRow(entry)).join('');
  elResultsTbody.innerHTML = rows;
  bindRowActions(elResultsTbody, results.slice(start, start + PAGE_SIZE));

  renderPagination(pageCount);
}

function buildRow(entry) {
  const artist   = esc(hoardData.a[entry.ai]);
  const title    = esc(hoardData.t[entry.ti]);
  const url      = entry.url;
  const playing  = curEntry && curEntry.url === url && isPlaying;
  const starred  = isBookmarked(url);
  const dead     = deadUrls.has(url);
  return `<tr class="${playing ? 'playing' : ''}${dead ? ' dead' : ''}" data-url="${esc(url)}">
    <td class="col-play"><button class="play-btn${playing ? ' active' : ''}" aria-label="play ${title}">${playing ? '&#9646;' : '&#9654;'}</button></td>
    <td class="col-star"><button class="star-btn${starred ? ' on' : ''}" aria-label="${starred ? 'remove bookmark' : 'bookmark'}">${starred ? '\u2605' : '\u2606'}</button></td>
    <td class="col-artist" title="${artist}">${artist}</td>
    <td class="col-title"  title="${title}">${title}</td>
  </tr>`;
}

function markEntryDead(url) {
  // mark all visible rows for this URL without a full re-render
  document.querySelectorAll(`tr[data-url="${CSS.escape(url)}"]`).forEach(r => r.classList.add('dead'));
}

function bindRowActions(tbody, slice) {
  const rows = tbody.querySelectorAll('tr');
  rows.forEach((row, i) => {
    const entry = slice[i];
    if (!entry) return;
    row.querySelector('.play-btn').addEventListener('click', () => togglePlay(entry, row));
    row.querySelector('.star-btn').addEventListener('click', () => {
      toggleBookmark(entry);
      // re-render star in place
      const btn = row.querySelector('.star-btn');
      const on  = isBookmarked(entry.url);
      btn.className   = `star-btn${on ? ' on' : ''}`;
      btn.textContent = on ? '\u2605' : '\u2606';
      btn.setAttribute('aria-label', on ? 'remove bookmark' : 'bookmark');
    });
    // artist drill-down: click artist cell → filter to that artist via a: prefix
    row.querySelector('.col-artist').addEventListener('click', () => {
      elQ.value = `a:${hoardData.a[entry.ai]}`;
      switchTab('search');
      doSearch();
    });
  });
}

function renderPagination(pageCount) {
  if (pageCount <= 1) { elPagination.innerHTML = ''; return; }
  const prev = curPage > 0;
  const next = curPage < pageCount - 1;
  elPagination.innerHTML = `
    <button class="page-btn" id="pg-prev" ${prev ? '' : 'disabled'}>&#8592; prev</button>
    <span>page ${curPage + 1} / ${pageCount}</span>
    <button class="page-btn" id="pg-next" ${next ? '' : 'disabled'}>next &#8594;</button>`;
  elPagination.querySelector('#pg-prev')?.addEventListener('click', () => { curPage--; renderResults(); scrollTop(); });
  elPagination.querySelector('#pg-next')?.addEventListener('click', () => { curPage++; renderResults(); scrollTop(); });
}

// ---- browse tab (A-Z strip + shuffle) ----
function setupBrowse() {
  document.getElementById('shuffle-btn')?.addEventListener('click', doShuffle);
}

function buildAlphaStrip() {
  const strip = document.getElementById('alpha-strip');
  if (!strip) return;
  // only show letters actually present in the data
  const letters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'].filter(l => letterIndex.has(l));
  strip.innerHTML = letters.map(l =>
    `<button class="alpha-btn" data-letter="${l}" aria-label="browse ${l}">${l}</button>`
  ).join('');
  strip.querySelectorAll('.alpha-btn').forEach(btn => {
    btn.addEventListener('click', () => doBrowse(btn.dataset.letter));
  });
  if (elBrowseInfo) elBrowseInfo.textContent = 'select a letter or shuffle to browse';
}

function doBrowse(letter) {
  document.querySelectorAll('.alpha-btn').forEach(b => b.classList.toggle('active', b.dataset.letter === letter));
  browseResults  = letterIndex.get(letter) || [];
  browsePage     = 0;
  const total    = browseResults.length;
  browseLabelCtx = `browsing ${letter}  \u2014  ${total.toLocaleString()} track${total === 1 ? '' : 's'}`;
  renderBrowseResults();
}

function doShuffle() {
  if (!entries.length) return;
  const shuffled = [];
  const seen     = new Set();
  while (shuffled.length < Math.min(50, entries.length)) {
    const idx = Math.floor(Math.random() * entries.length);
    if (!seen.has(idx)) { seen.add(idx); shuffled.push(entries[idx]); }
  }
  document.querySelectorAll('.alpha-btn').forEach(b => b.classList.remove('active'));
  browseResults  = shuffled;
  browsePage     = 0;
  browseLabelCtx = '\uD83C\uDFB2 50 random tracks';
  renderBrowseResults();
}

function renderBrowseResults() {
  const total     = browseResults.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const start     = browsePage * PAGE_SIZE;
  const slice     = browseResults.slice(start, start + PAGE_SIZE);

  if (!total) {
    elBrowseInfo.textContent     = 'select a letter or shuffle to browse';
    elBrowseTbody.innerHTML      = '';
    elBrowsePagination.innerHTML = '';
    return;
  }

  const pageInfo = pageCount > 1 ? `  \u2014  page ${browsePage + 1} of ${pageCount}` : '';
  elBrowseInfo.textContent = `${browseLabelCtx}${pageInfo}`;

  elBrowseTbody.innerHTML = slice.map(entry => buildRow(entry)).join('');
  bindRowActions(elBrowseTbody, slice);

  if (pageCount <= 1) { elBrowsePagination.innerHTML = ''; return; }
  const prev = browsePage > 0;
  const next = browsePage < pageCount - 1;
  elBrowsePagination.innerHTML = `
    <button class="page-btn" id="br-prev" ${prev ? '' : 'disabled'}>&#8592; prev</button>
    <span>page ${browsePage + 1} / ${pageCount}</span>
    <button class="page-btn" id="br-next" ${next ? '' : 'disabled'}>next &#8594;</button>`;
  elBrowsePagination.querySelector('#br-prev')?.addEventListener('click', () => { browsePage--; renderBrowseResults(); scrollTop(); });
  elBrowsePagination.querySelector('#br-next')?.addEventListener('click', () => { browsePage++; renderBrowseResults(); scrollTop(); });
}

// ---- audio ----
function setupAudio() {
  elAudio.addEventListener('ended', () => {
    isPlaying = false;
    updateAudioBtn();
    resetSeekBar();
    if (radioMode) playRadioNext();
  });
  elAudio.addEventListener('pause',  () => { isPlaying = false; updateAudioBtn(); });
  elAudio.addEventListener('play',   () => { isPlaying = true;  updateAudioBtn(); });

  // seek bar — track position
  elAudio.addEventListener('timeupdate', () => {
    if (isSeeking || !elSeekBar) return;
    const pct = elAudio.duration ? elAudio.currentTime / elAudio.duration : 0;
    elSeekBar.value = pct * 100;
    elSeekBar.style.setProperty('--pct', pct);
    if (elSeekTime) elSeekTime.textContent = fmtTime(elAudio.currentTime);
  });
  elAudio.addEventListener('durationchange', () => {
    if (elSeekDuration) elSeekDuration.textContent = fmtTime(elAudio.duration);
    if (elSeekTime)     elSeekTime.textContent = '0:00';
    if (elSeekBar)      elSeekBar.value = 0;
  });

  if (elSeekBar) {
    elSeekBar.addEventListener('mousedown',  () => { isSeeking = true; });
    elSeekBar.addEventListener('touchstart', () => { isSeeking = true; }, { passive: true });
    elSeekBar.addEventListener('input', () => {
      if (elSeekTime) elSeekTime.textContent = fmtTime((elSeekBar.value / 100) * (elAudio.duration || 0));
    });
    elSeekBar.addEventListener('change', () => {
      elAudio.currentTime = (elSeekBar.value / 100) * (elAudio.duration || 0);
      isSeeking = false;
    });
  }

  // error — multi-stage fallback (see fallback chain below)
  elAudio.addEventListener('error', handleAudioError);

  elAudioBtn.addEventListener('click', () => {
    if (!curEntry) return;
    if (isPlaying) {
      elAudio.pause();
    } else {
      elAudio.play().catch(console.warn);
    }
  });
}

// ---- radio ----
function setupRadio() {
  if (!elRadioBtn) return;
  elRadioBtn.addEventListener('click', () => {
    radioMode = !radioMode;
    elRadioBtn.classList.toggle('active', radioMode);
    elRadioBtn.setAttribute('aria-pressed', radioMode);
    elRadioBtn.textContent = radioMode ? '\uD83D\uDCFB on air' : '\uD83D\uDCFB radio';
  });
}

function playRadioNext() {
  const pool = results.length ? results : entries;
  if (!pool.length) return;
  // skip known-dead URLs
  let next, attempts = 0;
  do {
    next = pool[Math.floor(Math.random() * pool.length)];
    attempts++;
  } while (attempts < 10 && pool.length > 1 && (
    (curEntry && next.url === curEntry.url) || deadUrls.has(next.url)
  ));
  if (deadUrls.has(next.url)) return; // all tried, bail
  curEntry    = next;
  retryCount  = 0;
  elAudio.src = next.url;
  elAudio.play().catch(console.warn);
  updateNowPlaying();
  renderResults();
  if (browseResults.length) renderBrowseResults();
}

// ---- seek bar helpers ----
function resetSeekBar() {
  if (!elSeekBar) return;
  elSeekBar.value = 0;
  elSeekBar.style.setProperty('--pct', 0);
  if (elSeekTime)     elSeekTime.textContent     = '0:00';
  if (elSeekDuration) elSeekDuration.textContent = '0:00';
}

function fmtTime(s) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m   = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${sec}`;
}

// ---- streaming fallback chain ----
function altUrl(url) {
  // try unencoded-slash variant: 46.zip/46%2Ffile.mp3 → 46.zip/46/file.mp3
  return url.replace(/\.zip\/([^%/]+)%2F/, '.zip/$1/');
}

async function handleAudioError() {
  const code = elAudio.error?.code ?? 0;
  const src  = elAudio.src;

  // code 2 = MEDIA_ERR_NETWORK — transient; retry once
  if (code === 2 && retryCount < 1) {
    retryCount++;
    setStatus('\u26a0 network error \u2014 retrying\u2026', true);
    await delay(1200);
    elAudio.load();
    elAudio.play().catch(console.warn);
    return;
  }

  // code 1 = MEDIA_ERR_ABORTED — user action, no fallback needed
  if (code !== 1) {
    const alt = altUrl(src);
    if (alt !== src && !deadUrls.has(alt)) {
      // try unencoded-slash variant
      retryCount = 0;
      elAudio.src = alt;
      elAudio.play().catch(console.warn);
      return;
    }
    // both variants exhausted — mark dead
    deadUrls.add(src);
    if (alt !== src) deadUrls.add(alt);
    markEntryDead(src);
  }

  const msg = code ? `stream error (code ${code})` : 'stream error';
  setStatus(`\u26d4 ${msg} \u2014 track unavailable`, true);
  isPlaying = false;
  updateAudioBtn();
  if (radioMode) playRadioNext();
}

function togglePlay(entry, row) {
  if (curEntry && curEntry.url === entry.url) {
    if (isPlaying) { elAudio.pause(); }
    else           { elAudio.play().catch(console.warn); }
    return;
  }
  curEntry       = entry;
  retryCount     = 0;
  elAudio.src    = entry.url;
  elAudio.play().catch(console.warn);
  updateNowPlaying();
  // refresh playing indicator in search and browse tables
  renderResults();
  if (browseResults.length) renderBrowseResults();
}

function updateNowPlaying() {
  if (!curEntry) {
    elNowPlaying.textContent  = 'nothing playing';
    elNowPlaying.className    = 'now-playing-text idle';
    return;
  }
  const a = hoardData.a[curEntry.ai];
  const t = hoardData.t[curEntry.ti];
  elNowPlaying.textContent = `${a} \u2014 ${t}`;
  elNowPlaying.className   = 'now-playing-text';
}

function updateAudioBtn() {
  elAudioBtn.textContent = isPlaying ? '\u23f8 pause' : '\u25b6 play';
  elAudioBtn.className   = `audio-btn${isPlaying ? ' playing' : ''}`;
  updateNowPlaying();
}

// ---- bookmarks ----
function loadBookmarks() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function saveBookmarks() {
  localStorage.setItem(LS_KEY, JSON.stringify(bookmarks));
  updateBmBadge();
  renderBmTable();
}

function toggleBookmark(entry) {
  const url = entry.url;
  const idx = bookmarks.findIndex(b => b.url === url);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push({ a: hoardData.a[entry.ai], t: hoardData.t[entry.ti], url });
  }
  saveBookmarks();
}

function isBookmarked(url) {
  return bookmarks.some(b => b.url === url);
}

function updateBmBadge() {
  const n = bookmarks.length;
  elBmBadge.textContent   = n;
  elBmBadge.dataset.count = n;
}

function renderBmTable() {
  const n = bookmarks.length;
  elBmEmpty.classList.toggle('hidden', n > 0);
  elBmActions.classList.toggle('hidden', n === 0);
  if (!n) { elBmTbody.innerHTML = ''; return; }
  elBmTbody.innerHTML = bookmarks.map((bm, i) => `
    <tr>
      <td class="col-play"><button class="play-btn" aria-label="play ${esc(bm.t)}" data-idx="${i}">&#9654;</button></td>
      <td class="col-star"><button class="star-btn on" aria-label="remove bookmark" data-idx="${i}">\u2605</button></td>
      <td class="col-artist" title="${esc(bm.a)}">${esc(bm.a)}</td>
      <td class="col-title"  title="${esc(bm.t)}">${esc(bm.t)}</td>
    </tr>`).join('');
  elBmTbody.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bm = bookmarks[+btn.dataset.idx];
      if (!bm) return;
      // synthesize entry from bookmark for playback
      const ai = hoardData.a.indexOf(bm.a);
      const ti = hoardData.t.indexOf(bm.t);
      if (ai < 0 || ti < 0) {
        // data not loaded yet or bookmark from different build — play direct
        curEntry = { ai: 0, ti: 0, url: bm.url };
        hoardData.a[0] = bm.a;
        hoardData.t[0] = bm.t;
      } else {
        curEntry = { ai, ti, url: bm.url };
      }
      elAudio.src = bm.url;
      elAudio.play().catch(console.warn);
      updateNowPlaying();
    });
  });
  elBmTbody.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bookmarks.splice(+btn.dataset.idx, 1);
      saveBookmarks();
    });
  });
  // artist drill-down on bookmark rows (same pattern as search/browse)
  elBmTbody.querySelectorAll('.col-artist').forEach(cell => {
    cell.addEventListener('click', () => {
      elQ.value = `a:${cell.textContent.trim()}`;
      switchTab('search');
      doSearch();
    });
  });
}

function setupBmActions() {
  document.getElementById('dl-btn').addEventListener('click', bulkDownload);
  document.getElementById('export-btn-bm').addEventListener('click', exportBookmarks);
  document.getElementById('clear-bm-btn').addEventListener('click', () => {
    if (confirm('clear all bookmarks?')) { bookmarks = []; saveBookmarks(); }
  });
  document.getElementById('export-btn-panel').addEventListener('click', exportBookmarks);
}

// ---- bulk download ----
async function bulkDownload() {
  if (!bookmarks.length || dlRunning) return;
  dlRunning = true;
  const btn = document.getElementById('dl-btn');
  btn.disabled = true;
  btn.textContent = 'downloading\u2026';
  for (let i = 0; i < bookmarks.length; i++) {
    const bm  = bookmarks[i];
    const num = String(i + 1).padStart(3, '0');
    // sanitize filename: strip chars illegal on most filesystems
    const safe = s => s.replace(/[\/\\:*?"<>|]/g, '_');
    const name = `${num} - ${safe(bm.a)} - ${safe(bm.t)}.mp3`;
    btn.textContent = `${i + 1}/${bookmarks.length} \u2014 downloading\u2026`;
    try {
      const r    = await fetch(bm.url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      triggerDownload(blob, name);
    } catch (err) {
      console.warn(`[hoard] download failed: ${name}`, err);
    }
    if (i < bookmarks.length - 1) await delay(DL_DELAY);
  }
  btn.disabled    = false;
  btn.textContent = '\u2913 bulk download';
  dlRunning       = false;
}

function triggerDownload(blob, name) {
  const a  = document.createElement('a');
  a.href   = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

// ---- export ----
async function exportBookmarks() {
  if (!bookmarks.length) { alert('no bookmarks to export'); return; }
  const btn = document.getElementById('export-btn-panel');
  btn.disabled    = true;
  btn.textContent = 'building\u2026';
  try {
    const bundle  = buildExportBundle();
    const payload = JSON.stringify(bundle, null, 0);
    const bytes   = new TextEncoder().encode(payload);

    // gzip via CompressionStream if available
    let gz = null;
    if (typeof CompressionStream !== 'undefined') {
      gz = await gzip(bytes);
    }

    const zip = new JSZip();
    zip.file('data.json', payload);
    if (gz) zip.file('data.json.gz', gz);
    zip.file('README.md', exportReadme(bookmarks.length));

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    triggerDownload(blob, 'my-hoard-data.zip');
  } catch (err) {
    alert(`export failed: ${err.message}`);
    console.error('[hoard] export', err);
  }
  btn.disabled    = false;
  btn.textContent = '\u2913 export my-hoard-data.zip';
}

function buildExportBundle() {
  const a_map = {}, t_map = {}, a_list = [], t_list = [];
  const intern_a = s => { if (!(s in a_map)) { a_map[s] = a_list.length; a_list.push(s); } return a_map[s]; };
  const intern_t = s => { if (!(s in t_map)) { t_map[s] = t_list.length; t_list.push(s); } return t_map[s]; };
  const p       = ARCHIVE_PFX;
  const sorted  = [...bookmarks].sort((x, y) => x.a.localeCompare(y.a));
  let prev_ai   = 0;
  const encoded = sorted.map(bm => {
    const ai = intern_a(bm.a);
    const ti = intern_t(bm.t);
    const rel = bm.url.startsWith(p) ? bm.url.slice(p.length) : bm.url;
    const da  = ai - prev_ai;
    prev_ai   = ai;
    return [da, ti, rel];
  });
  return { p, a: a_list, t: t_list, e: encoded };
}

async function gzip(bytes) {
  const cs     = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  const reader = cs.readable.getReader();
  writer.write(bytes);
  writer.close();
  const chunks = [];
  let done = false;
  while (!done) {
    const { value, done: d } = await reader.read();
    done = d;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out   = new Uint8Array(total);
  let off     = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

function exportReadme(count) {
  return `# My Dragon Hoard\n\n${count} track${count === 1 ? '' : 's'} exported from Dragon Hoard Search.\n\n## Deploy\n\nUnzip this archive into \`hoard/my/\` in your site repo and commit.\nThe personal player at \`my/index.html\` reads \`data.json.gz\` (fallback \`data.json\`).\n\n## Source\n\nMP3s stream from https://archive.org — nothing is hosted here.\n`;
}

// ---- tabs ----
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  elTabSearch.classList.toggle('hidden', name !== 'search');
  elTabBm.classList.toggle('hidden',     name !== 'bm');
  elTabExport.classList.toggle('hidden', name !== 'export');
  elTabBrowse.classList.toggle('hidden', name !== 'browse');
  if (name === 'bm') renderBmTable();
}

// ---- overlay / status ----
function setOverlay(msg, sub) {
  elOverlay.classList.remove('hidden');
  elOverlayMsg.textContent = msg;
  elOverlaySub.textContent = sub || '';
}

function hideOverlay() {
  elOverlay.classList.add('hidden');
}

function setStatus(msg, isError) {
  elStatus.textContent = msg;
  elStatus.className   = `hoard-status${isError ? ' error' : ''}`;
}

// ---- helpers ----
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function tick()    { return new Promise(r => setTimeout(r, 0)); }

function scrollTop() {
  document.querySelector('.hoard-shell')?.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
