const MOODS_URL = 'assets/json/moods.json';
const STORAGE_KEY = 'myspaceHeaderState';

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
    const statusEl = document.getElementById('status-text');
    const timeEl = document.getElementById('mood-time');
    const dateEl = document.getElementById('mood-date');

    if (!emojiEl || !textEl || !selectEl || !emojiWrapper || !moodContainer || !statusEl || !timeEl || !dateEl) {
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

    // Apply mood, status, and timestamp from saved state or defaults
    applyMood(currentMood, emojiEl, textEl, selectEl);

    if (saved && typeof saved.status === 'string') {
      statusEl.textContent = saved.status;
    }

    if (saved && saved.time && saved.date) {
      timeEl.textContent = saved.time;
      dateEl.textContent = saved.date;
    } else {
      updateMoodTimestamp(timeEl, dateEl); // initialize once
    }

    // Change handler (dropdown -> UI + save)
    selectEl.addEventListener('change', () => {
      const selected = moods.find(m => m.id === selectEl.value);
      if (!selected) return;
      applyMood(selected, emojiEl, textEl, selectEl);
      updateMoodTimestamp(timeEl, dateEl);
      selectEl.style.display = 'none';
      persistHeaderState(selected.id, statusEl.textContent, timeEl.textContent, dateEl.textContent);
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

    // Status editing: enforce ~20 chars and save
    statusEl.addEventListener('input', () => {
      if (statusEl.textContent.length > 20) {
        statusEl.textContent = statusEl.textContent.slice(0, 20);
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(statusEl);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });

    statusEl.addEventListener('blur', () => {
      // When status changes, update timestamp + save
      updateMoodTimestamp(timeEl, dateEl);
      const savedMoodId = selectEl.value || currentMood.id;
      persistHeaderState(savedMoodId, statusEl.textContent, timeEl.textContent, dateEl.textContent);
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

function persistHeaderState(moodId, status, time, date) {
  const state = {
    moodId,
    status,
    time,
    date
  };
  saveState(state);
}

document.addEventListener('DOMContentLoaded', loadMoods);
