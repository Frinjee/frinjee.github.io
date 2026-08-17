/**
 * FF2026 Chubba League — rankings + resource bento
 */

/** @typedef {{ title: string, source?: string, url: string, blurb?: string, note?: string }} ResourceLink */
/** @typedef {{ title: string, youtubeId: string }} VideoItem */
/** @typedef {{ favorites: Record<string, ResourceLink[]>, helpfulLinks: ResourceLink[], videos: { items: VideoItem[] }, leagueDocs: ResourceLink[] }} ResourcesData */

const CSV_URL = "./08-16-rankings.csv";
const RESOURCES_URL = "./data/resources.json";

const CORE_COLS = [
  { key: "RK", label: "RK" },
  { key: "Player", label: "Player" },
  { key: "Pos", label: "Pos" },
  { key: "Team", label: "Team" },
  { key: "BYE", label: "Bye" },
  { key: "PTS", label: "Pts", projKey: "PTS (Projections)" },
  { key: "SoS Rank", label: "SOS" },
  { key: "ADP (Y!)", label: "ADP" },
  { key: "P-RK", label: "P-RK" },
];

const STAT_COLS = [
  { key: "YPC", label: "YPC", projKey: "YPC (Projections)" },
  { key: "Rush", label: "Rush", projKey: "Rush (Projections)" },
  { key: "RUSH YDS", label: "Rush Yds", projKey: "RUSH YDS (Projections)" },
  { key: "RUSH TD", label: "Rush TD", projKey: "RUSH TD (Projections)" },
  { key: "REC", label: "Rec", projKey: "REC (Projections)" },
  { key: "REC YDS", label: "Rec Yds", projKey: "REC YDS (Projections)" },
  { key: "REC TD", label: "Rec TD", projKey: "REC TD (Projections)" },
  { key: "YPR", label: "YPR", projKey: "YPR (Projections)" },
  { key: "Rec/Tar Game", label: "Rec/Tar", projKey: "Rec/Tar Game (Projections)" },
  { key: "PASS YDS", label: "Pass Yds", projKey: "PASS YDS (Projections)" },
  { key: "PASS TD", label: "Pass TD", projKey: "PASS TD (Projections)" },
  { key: "INT", label: "INT", projKey: "INT (Projections)" },
  { key: "CMP%", label: "Cmp%", projKey: "CMP% (Projections)" },
  { key: "ATT/ GM", label: "Att/Gm", projKey: "ATT/ GM (Projections)" },
  { key: "QB YPC", label: "QB YPC", projKey: "QB YPC (Projections)" },
];

/** @type {Record<string, string>[]} */
let players = [];

/** @type {"proj" | "stats"} */
let mode = "proj";

let videoIndex = 0;
/** @type {VideoItem[]} */
let videoItems = [];

const els = {
  pos: /** @type {HTMLSelectElement} */ (document.getElementById("pos-filter")),
  search: /** @type {HTMLInputElement} */ (document.getElementById("player-search")),
  modeProj: /** @type {HTMLButtonElement} */ (document.getElementById("mode-proj")),
  modeStats: /** @type {HTMLButtonElement} */ (document.getElementById("mode-stats")),
  status: /** @type {HTMLElement} */ (document.getElementById("rankings-status")),
  thead: /** @type {HTMLElement} */ (document.getElementById("rankings-thead")),
  tbody: /** @type {HTMLElement} */ (document.getElementById("rankings-tbody")),
  favoritesRoot: /** @type {HTMLElement} */ (document.getElementById("favorites-root")),
  helpfulLinks: /** @type {HTMLElement} */ (document.getElementById("helpful-links")),
  docsList: /** @type {HTMLElement} */ (document.getElementById("docs-list")),
  videoFrame: /** @type {HTMLElement} */ (document.getElementById("video-frame")),
  videoPrev: /** @type {HTMLButtonElement} */ (document.getElementById("video-prev")),
  videoNext: /** @type {HTMLButtonElement} */ (document.getElementById("video-next")),
  videoCounter: /** @type {HTMLElement} */ (document.getElementById("video-counter")),
};

/**
 * Minimal RFC4180-ish CSV parser.
 * @param {string} text
 * @returns {Record<string, string>[]}
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // ignore; handle \r\n via \n
    } else {
      field += ch;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map((h) => h.trim());
  /** @type {Record<string, string>[]} */
  const out = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells.length || (cells.length === 1 && cells[0] === "")) continue;
    /** @type {Record<string, string>} */
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (cells[c] ?? "").trim();
    }
    if (obj.Player || obj.RK) out.push(obj);
  }

  return out;
}

/**
 * @param {string} value
 * @returns {string}
 */
function displayCell(value) {
  if (value == null || value === "") return "—";
  return value;
}

/**
 * @param {string} pos
 * @returns {string}
 */
function displayPos(pos) {
  return pos === "DST" ? "D/ST" : pos;
}

/**
 * @param {string} team
 * @returns {string}
 */
function teamLogoUrl(team) {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${team.toLowerCase()}.png`;
}

/**
 * @param {Record<string, string>} player
 * @returns {boolean}
 */
function matchesPosition(player) {
  const filter = els.pos.value;
  const pos = player.Pos || "";
  if (filter === "ALL") return true;
  if (filter === "FLEX") return pos === "RB" || pos === "WR" || pos === "TE";
  return pos === filter;
}

/**
 * @param {Record<string, string>} player
 * @returns {boolean}
 */
function matchesSearch(player) {
  const q = els.search.value.trim().toLowerCase();
  if (!q) return true;
  return (player.Player || "").toLowerCase().includes(q);
}

/**
 * @returns {Record<string, string>[]}
 */
function filteredPlayers() {
  return players.filter((p) => matchesPosition(p) && matchesSearch(p));
}

/**
 * @param {string} filter
 * @returns {string}
 */
function filterLabel(filter) {
  if (filter === "ALL") return "";
  if (filter === "DST") return " D/ST";
  if (filter === "FLEX") return " FLEX";
  return ` ${filter}s`;
}

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.classList.toggle("is-error", isError);
}

function renderTableHead() {
  const cols = [...CORE_COLS, ...STAT_COLS];
  const tr = document.createElement("tr");
  for (const col of cols) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = col.label;
    tr.appendChild(th);
  }
  els.thead.replaceChildren(tr);
}

/**
 * @param {Record<string, string>} player
 * @param {{ key: string, projKey?: string }} col
 * @returns {string}
 */
function resolveValue(player, col) {
  if (col.projKey) {
    const key = mode === "proj" ? col.projKey : col.key;
    return player[key] ?? "";
  }
  return player[col.key] ?? "";
}

/**
 * @param {Record<string, string>} player
 * @returns {HTMLTableRowElement}
 */
function buildRow(player) {
  const tr = document.createElement("tr");

  // RK
  {
    const td = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = "rank-chip";
    chip.textContent = displayCell(player.RK);
    td.appendChild(chip);
    tr.appendChild(td);
  }

  // Player + optional Status
  {
    const td = document.createElement("td");
    const wrap = document.createElement("span");
    wrap.className = "player-cell";
    const name = document.createElement("span");
    name.textContent = displayCell(player.Player);
    wrap.appendChild(name);
    const status = (player.Status || "").trim().toUpperCase();
    if (status === "Q" || status === "IR") {
      const badge = document.createElement("span");
      badge.className = `status-badge status-badge--${status.toLowerCase()}`;
      badge.textContent = status;
      badge.title = status === "Q" ? "Questionable" : "Injured Reserve";
      wrap.appendChild(badge);
    }
    td.appendChild(wrap);
    tr.appendChild(td);
  }

  // Pos
  {
    const td = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "pos-badge";
    badge.textContent = displayPos(player.Pos || "");
    td.appendChild(badge);
    tr.appendChild(td);
  }

  // Team
  {
    const td = document.createElement("td");
    const team = player.Team || "";
    if (team) {
      const img = document.createElement("img");
      img.className = "team-logo";
      img.src = teamLogoUrl(team);
      img.alt = "";
      img.loading = "lazy";
      img.width = 22;
      img.height = 22;
      img.addEventListener("error", () => {
        const abbr = document.createElement("span");
        abbr.className = "team-abbr";
        abbr.textContent = team;
        img.replaceWith(abbr);
      });
      td.appendChild(img);
    } else {
      const empty = document.createElement("span");
      empty.className = "num-empty";
      empty.textContent = "—";
      td.appendChild(empty);
    }
    tr.appendChild(td);
  }

  // BYE
  {
    const td = document.createElement("td");
    const v = displayCell(player.BYE);
    td.textContent = v;
    if (v === "—") td.className = "num-empty";
    tr.appendChild(td);
  }

  // PTS
  {
    const td = document.createElement("td");
    const ptsCol = CORE_COLS.find((c) => c.key === "PTS");
    const v = displayCell(resolveValue(player, /** @type {{key:string,projKey?:string}} */ (ptsCol)));
    td.textContent = v;
    td.className = v === "—" ? "num-empty" : "pts-cell";
    tr.appendChild(td);
  }

  // SOS
  {
    const td = document.createElement("td");
    const v = displayCell(player["SoS Rank"]);
    td.textContent = v;
    td.className = v === "—" ? "num-empty" : "sos-cell";
    tr.appendChild(td);
  }

  // ADP
  {
    const td = document.createElement("td");
    const v = displayCell(player["ADP (Y!)"]);
    td.textContent = v;
    if (v === "—") td.className = "num-empty";
    tr.appendChild(td);
  }

  // P-RK
  {
    const td = document.createElement("td");
    const v = displayCell(player["P-RK"]);
    td.textContent = v;
    if (v === "—") td.className = "num-empty";
    tr.appendChild(td);
  }

  for (const col of STAT_COLS) {
    const td = document.createElement("td");
    const v = displayCell(resolveValue(player, col));
    td.textContent = v;
    if (v === "—") td.className = "num-empty";
    tr.appendChild(td);
  }

  return tr;
}

function renderTable() {
  const list = filteredPlayers();
  const frag = document.createDocumentFragment();
  for (const player of list) {
    frag.appendChild(buildRow(player));
  }
  els.tbody.replaceChildren(frag);

  const shown = Math.min(12, list.length);
  const label = filterLabel(els.pos.value);
  setStatus(
    list.length
      ? `Showing ${shown} of ${list.length}${label} (scroll for more)`
      : `No players match${label || " your filters"}`
  );
}

function setMode(next) {
  mode = next;
  els.modeProj.classList.toggle("is-active", mode === "proj");
  els.modeStats.classList.toggle("is-active", mode === "stats");
  els.modeProj.setAttribute("aria-pressed", String(mode === "proj"));
  els.modeStats.setAttribute("aria-pressed", String(mode === "stats"));
  renderTable();
}

/**
 * @param {ResourceLink} item
 * @param {boolean} withSource
 * @returns {HTMLLIElement}
 */
function buildResourceItem(item, withSource) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  const isPlaceholder = !item.url || item.url === "#";
  a.href = isPlaceholder ? "#" : item.url;
  if (isPlaceholder) {
    a.className = "is-disabled";
    a.setAttribute("aria-disabled", "true");
    a.textContent = `${item.title} (awaiting league start)`;
  } else {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = withSource && item.source
      ? `${item.title} (${item.source})`
      : item.title;
  }
  li.appendChild(a);
  if (item.note) {
    const note = document.createElement("span");
    note.className = "resource-list__note";
    note.textContent = item.note;
    li.appendChild(note);
  }
  if (item.blurb) {
    const meta = document.createElement("span");
    meta.className = "resource-list__meta";
    meta.textContent = item.blurb;
    li.appendChild(meta);
  }
  return li;
}

function renderVideo() {
  if (!videoItems.length) {
    els.videoFrame.replaceChildren(
      Object.assign(document.createElement("div"), {
        className: "video-placeholder",
        textContent: "No videos configured yet.",
      })
    );
    els.videoCounter.textContent = "0 / 0";
    return;
  }

  const item = videoItems[videoIndex];
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.youtubeId)}`;
  iframe.title = item.title || "League video";
  iframe.loading = "lazy";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  els.videoFrame.replaceChildren(iframe);
  els.videoCounter.textContent = `${videoIndex + 1} / ${videoItems.length}`;
}

/**
 * @param {Record<string, ResourceLink[]>} [favorites]
 */
function renderFavorites(favorites) {
  const groups = favorites || {};
  const frag = document.createDocumentFragment();

  for (const [name, links] of Object.entries(groups)) {
    const group = document.createElement("div");
    group.className = "favorites-group";
    const heading = document.createElement("h4");
    heading.className = "favorites-group__name";
    heading.textContent = name;
    const ul = document.createElement("ul");
    ul.className = "resource-list resource-list--compact";
    for (const item of links || []) {
      ul.appendChild(buildResourceItem(item, false));
    }
    group.append(heading, ul);
    frag.appendChild(group);
  }

  els.favoritesRoot.replaceChildren(frag);
}

/**
 * @param {ResourceLink[]} items
 */
function renderHelpfulLinks(items) {
  if (!items.length) {
    els.helpfulLinks.replaceChildren();
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach((item, i) => {
    if (i > 0) {
      frag.appendChild(document.createTextNode(" | "));
    }
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.source ? `${item.title} (${item.source})` : item.title;
    frag.appendChild(a);
    if (item.blurb) {
      frag.appendChild(document.createTextNode(` — ${item.blurb}`));
    }
  });
  els.helpfulLinks.replaceChildren(frag);
}

/**
 * @param {ResourcesData} data
 */
function renderResources(data) {
  const docs = data.leagueDocs || [];
  const videos = data.videos || { items: [] };

  renderFavorites(data.favorites);
  renderHelpfulLinks(data.helpfulLinks || []);
  els.docsList.replaceChildren(
    ...docs.map((item) => buildResourceItem(item, false))
  );

  videoItems = videos.items || [];
  videoIndex = 0;
  renderVideo();
}

function wireEvents() {
  els.pos.addEventListener("change", renderTable);
  els.search.addEventListener("input", renderTable);
  els.modeProj.addEventListener("click", () => setMode("proj"));
  els.modeStats.addEventListener("click", () => setMode("stats"));

  els.videoPrev.addEventListener("click", () => {
    if (!videoItems.length) return;
    videoIndex = (videoIndex - 1 + videoItems.length) % videoItems.length;
    renderVideo();
  });
  els.videoNext.addEventListener("click", () => {
    if (!videoItems.length) return;
    videoIndex = (videoIndex + 1) % videoItems.length;
    renderVideo();
  });
}

async function loadRankings() {
  try {
    const res = await fetch(CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    players = parseCsv(text);
    players.sort((a, b) => Number(a.RK) - Number(b.RK));
    renderTableHead();
    renderTable();
  } catch (err) {
    console.error(err);
    players = [];
    els.tbody.replaceChildren();
    setStatus("Rankings unavailable right now. Check 08-16-rankings.csv.", true);
  }
}

async function loadResources() {
  try {
    const res = await fetch(RESOURCES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    /** @type {ResourcesData} */
    const data = await res.json();
    renderResources(data);
  } catch (err) {
    console.error(err);
    els.favoritesRoot.replaceChildren(
      Object.assign(document.createElement("p"), {
        textContent: "Resources unavailable right now.",
      })
    );
  }
}

wireEvents();
await Promise.all([loadRankings(), loadResources()]);
