document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('photo-carousel-list');
  if (!listEl) return;

  try {
    const res = await fetch('assets/json/flickr_album_recent.json', { cache: 'no-store' });
    const data = await res.json();
    const items = Array.isArray(data) ? data.slice(0, 8) : [];

    listEl.innerHTML = items.map((item) => `
      <li class="splide__slide">
        <a class="activity-photo-card" href="${item.album_photo_url || '#'}" target="_blank" rel="noreferrer">
          <img class="activity-photo-thumb" src="${item.thumbnail || ''}" alt="${item.title || 'Recent photo'}">
          <div class="activity-photo-meta">
            <span class="activity-photo-title">${item.title || 'Untitled'}</span>
            <span class="activity-photo-details">@Jen Hammond - Taken On: ${item.creation_timestamp || ''} Uploaded On: ${item.upload_timestamp || ''}</span>
          </div>
        </a>
      </li>
    `).join('');

    if (window.Splide) {
      const splide = new Splide('#photo-carousel', {
        type: 'loop',
        drag: 'free',
        arrows: false,
        pagination: false,
        autoWidth: true,
        focus: 'center',
        pauseOnHover: true,
        pauseOnFocus: false,
        autoScroll: {
          speed: 0.10,
        }
      });

      splide.mount(window.splide.Extensions);
    }
  } catch (err) {
    console.error('Unable to load Flickr album data', err);
  }
});