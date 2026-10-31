const STATUS_BASE = 'assets/imgs/layout/status/rotation-usage/';
const STATUS_FILES = [
  'textbeans.gif',
  'textmusiclife.gif',
  'textplayst.gif',
  'offline-hearts.gif',
  'online-superhero.gif',
  'onlineheartbubble.gif',
];
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
// Slot 0 (textbeans) starts at this UTC instant; first rotation after 6 hours.
const ROTATION_ANCHOR_MS = Date.parse('2026-10-31T18:00:00Z');

function getCurrentSlot() {
  const elapsed = Date.now() - ROTATION_ANCHOR_MS;
  if (elapsed < 0) return 0;
  return Math.floor(elapsed / SIX_HOURS_MS);
}

function getStatusPathForSlot(slot) {
  const index = ((slot % STATUS_FILES.length) + STATUS_FILES.length) % STATUS_FILES.length;
  return STATUS_BASE + STATUS_FILES[index];
}

function applyStatusGif() {
  const img = document.getElementById('status-rotation');
  if (!img) return;
  img.src = getStatusPathForSlot(getCurrentSlot());
}

function msUntilNextBoundary() {
  const elapsed = Date.now() - ROTATION_ANCHOR_MS;
  if (elapsed < 0) {
    return Math.max(0, ROTATION_ANCHOR_MS - Date.now());
  }
  const slot = getCurrentSlot();
  const nextBoundary = ROTATION_ANCHOR_MS + (slot + 1) * SIX_HOURS_MS;
  return Math.max(0, nextBoundary - Date.now());
}

function scheduleNextBoundary() {
  window.setTimeout(() => {
    applyStatusGif();
    scheduleNextBoundary();
  }, msUntilNextBoundary());
}

document.addEventListener('DOMContentLoaded', () => {
  applyStatusGif();
  scheduleNextBoundary();
});
