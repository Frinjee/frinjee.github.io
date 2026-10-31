const MOODS_URL = 'assets/json/moods.json';
const STORAGE_KEY = 'myspaceHeaderState';
const STATUS_URL = 'assets/status-files/status-test-lyrics.txt';
const INITIAL_STATUS = 'Choppa quiet missile VV diamonds time ticker';
const ROTATION_START_MS = Date.parse('2026-11-01T16:00:00Z');
const STATUS_DAY_HOUR = 11;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to parse saved state', e);
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}

async function loadMoods() {
  try {
    console.log('Loading moods from', MOODS_URL);
    const response = await fetch(MOODS_URL);
    const data = await response.json();
    const moods = data.moods || [];

    if (!moods.length) {
      console.warn('No moods found in JSON');
      return;
    }

    const emojiEl = document.getElementById('mood-emoji');
    const textEl = document.getElementById('mood-text');
    const selectEl = document.getElementById('mood-select');
    const emojiWrapper = document.getElementById('mood-emoji-wrapper');
    const moodContainer = document.getElementById('mood-container');
    const timeEl = document.getElementById('mood-time');
    const dateEl = document.getElementById('mood-date');

    if (!emojiEl || !textEl || !selectEl || !emojiWrapper || !moodContainer || !timeEl || !dateEl) {
      console.warn('Header elements missing');
      return;
    }

    // Populate dropdown from JSON
    selectEl.innerHTML = '';
    moods.forEach(mood => {
      const option = document.createElement('option');
      option.value = mood.id;
      option.textContent = `${mood.emoji} ${mood.label}`;
      selectEl.appendChild(option);
    });

    // Load any previously saved state
    const saved = loadState();

    let currentMood = moods[0];
    if (saved && saved.moodId) {
      const found = moods.find(m => m.id === saved.moodId);
      if (found) currentMood = found;
    }

    applyMood(currentMood, emojiEl, textEl, selectEl);

    if (saved && saved.time && saved.date) {
      timeEl.textContent = saved.time;
      dateEl.textContent = saved.date;
    }

    // Change handler (dropdown -> UI + save)
    selectEl.addEventListener('change', () => {
      const selected = moods.find(m => m.id === selectEl.value);
      if (!selected) return;
      applyMood(selected, emojiEl, textEl, selectEl);
      updateMoodTimestamp(timeEl, dateEl);
      selectEl.style.display = 'none';
      persistHeaderState(selected.id, timeEl.textContent, dateEl.textContent);
    });

    // Click emoji to toggle popup
    emojiWrapper.addEventListener('click', () => {
      const isVisible = selectEl.style.display === 'block';
      if (isVisible) {
        selectEl.style.display = 'none';
        return;
      }

      const emojiRect = emojiWrapper.getBoundingClientRect();
      const containerRect = moodContainer.getBoundingClientRect();
      const offsetLeft = emojiRect.left - containerRect.left;
      const offsetTop = emojiRect.bottom - containerRect.top;

      selectEl.style.left = offsetLeft + 'px';
      selectEl.style.top = offsetTop + 'px';
      selectEl.style.display = 'block';
      selectEl.focus();
    });

    // Hide when it loses focus
    selectEl.addEventListener('blur', () => {
      selectEl.style.display = 'none';
    });

  } catch (e) {
    console.error('Failed to load moods.json', e);
  }
}

function applyMood(mood, emojiEl, textEl, selectEl) {
  emojiEl.textContent = mood.emoji;
  textEl.textContent = mood.label;
  selectEl.value = mood.id;
}

// Later: pick a mood from the loaded list on a timer, apply it, then refresh the timestamp.
function randomizeMoodOnInterval(moods, apply) {
}

function updateMoodTimestamp(timeEl, dateEl) {
  if (!timeEl || !dateEl) return;

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = ((hours + 11) % 12) + 1;

  timeEl.textContent = `${hour12}:${minutes} ${ampm}`;
  dateEl.textContent = now.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

function persistHeaderState(moodId, time, date) {
  const state = {
    moodId,
    time,
    date
  };
  saveState(state);
}

function easternParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const get = (type) => parts.find(part => part.type === type).value;
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0;
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour
  };
}

function statusPeriodKey(date) {
  const { year, month, day, hour } = easternParts(date);
  if (hour >= STATUS_DAY_HOUR) {
    return `${year}-${month}-${day}`;
  }
  const prev = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)) - 86400000);
  const yy = prev.getUTCFullYear();
  const mm = String(prev.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(prev.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function djb2(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

async function applyDailyStatus() {
  const statusEl = document.getElementById('status-text');
  if (!statusEl) return;

  statusEl.textContent = INITIAL_STATUS;
  if (Date.now() < ROTATION_START_MS) return;

  try {
    const response = await fetch(STATUS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const lines = (await response.text())
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    if (!lines.length) return;
    const key = statusPeriodKey(new Date());
    statusEl.textContent = lines[djb2(key) % lines.length];
  } catch (e) {
    console.warn('Failed to load status lyrics', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyDailyStatus();
  loadMoods();
});
