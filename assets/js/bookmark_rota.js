const BOOKMARK_ROTA_URL = 'assets/json/bookmarks_rota.json';
const HTTP_URL_PATTERN = /^https?:\/\//;

function isValidItem(item) {
  return item
    && typeof item.title === 'string'
    && item.title.trim()
    && typeof item.url === 'string'
    && HTTP_URL_PATTERN.test(item.url);
}

function formatCurrentDateHeading() {
  const formatted = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
  return `Bookmark Rota - Week of ${formatted}`;
}

function createListItem(title, url) {
  const li = document.createElement('li');
  li.className = 'bookmark-rota-li';

  const link = document.createElement('a');
  link.href = url;
  link.textContent = title;
  li.appendChild(link);

  return li;
}

function showFallback(listEl, message) {
  listEl.replaceChildren();

  const li = document.createElement('li');
  li.className = 'bookmark-rota-li';
  li.textContent = message;
  listEl.appendChild(li);
}

async function loadBookmarkRota() {
  const listEl = document.getElementById('bookmark-rota-list');
  if (!listEl) return;

  const boxEl = listEl.closest('.bookmark-rota-box');
  const headingEl = boxEl ? boxEl.querySelector('h2') : null;

  try {
    const response = await fetch(BOOKMARK_ROTA_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid feed shape');
    }

    const fragment = document.createDocumentFragment();

    for (const item of data) {
      if (!isValidItem(item)) continue;
      fragment.appendChild(createListItem(item.title.trim(), item.url));
    }

    if (!fragment.childNodes.length) {
      showFallback(listEl, 'Bookmark rota unavailable right now.');
      return;
    }

    listEl.replaceChildren(fragment);

    if (headingEl) {
      headingEl.textContent = formatCurrentDateHeading();
    }
  } catch (err) {
    console.warn('Bookmark rota fetch failed', err);
    showFallback(listEl, 'Bookmark rota unavailable right now.');
  }
}

document.addEventListener('DOMContentLoaded', loadBookmarkRota);
