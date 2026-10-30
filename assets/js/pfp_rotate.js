const PFP_BASE = 'assets/imgs/pfp/';
const PFP_FILES = ['pfp.jpg', 'pfp-2.jpg', 'pfp-3.jpg', 'pfp-4.jpg'];
const PFP_START_FILE = 'pfp-2.jpg';
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
// Slot 0 (pfp-2) starts at this UTC instant; first rotation after 8 hours.
const ROTATION_ANCHOR_MS = Date.parse('2026-10-31T00:00:00Z');
const SHUFFLE_SEED = 0x4652494e;

let cachedOrder = null;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(items, seed) {
  const out = items.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function getOrder() {
  if (!cachedOrder) {
    cachedOrder = seededShuffle(PFP_FILES, SHUFFLE_SEED);
  }
  return cachedOrder;
}

function getCurrentSlot() {
  const elapsed = Date.now() - ROTATION_ANCHOR_MS;
  if (elapsed < 0) return 0;
  return Math.floor(elapsed / EIGHT_HOURS_MS);
}

function getPfpPathForSlot(slot) {
  const order = getOrder();
  const startIndex = order.indexOf(PFP_START_FILE);
  const index = startIndex >= 0 ? (startIndex + slot) % order.length : slot % order.length;
  return PFP_BASE + order[index];
}

function applyProfilePic() {
  const img = document.getElementById('top-profile-pic');
  if (!img) return;
  img.src = getPfpPathForSlot(getCurrentSlot());
}

function msUntilNextBoundary() {
  const elapsed = Date.now() - ROTATION_ANCHOR_MS;
  if (elapsed < 0) {
    return Math.max(0, ROTATION_ANCHOR_MS - Date.now());
  }
  const slot = getCurrentSlot();
  const nextBoundary = ROTATION_ANCHOR_MS + (slot + 1) * EIGHT_HOURS_MS;
  return Math.max(0, nextBoundary - Date.now());
}

function scheduleNextBoundary() {
  window.setTimeout(() => {
    applyProfilePic();
    scheduleNextBoundary();
  }, msUntilNextBoundary());
}

document.addEventListener('DOMContentLoaded', () => {
  applyProfilePic();
  scheduleNextBoundary();
});
