function normalizePortraitThumbnails(root = document) {
  const thumbnails = root.querySelectorAll('.thumbnail--portrait');

  thumbnails.forEach((thumbnail) => {
    thumbnail.width = 103;
    thumbnail.height = 129;
    thumbnail.decoding = 'async';

    if (!thumbnail.loading) {
      thumbnail.loading = 'lazy';
    }
  });

  return thumbnails.length;
}

function mountEventCarousel() {
  const carousel = document.getElementById('event-carousel');
  if (!carousel || !window.Splide) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const eventCarousel = new window.Splide(carousel, {
    type: 'loop',
    drag: 'free',
    arrows: false,
    pagination: false,
    autoWidth: true,
    focus: 'center',
    pauseOnHover: true,
    pauseOnFocus: true,
    autoScroll: {
      speed: 0.10,
    },
  });

  if (reduceMotion || !window.splide || !window.splide.Extensions) {
    eventCarousel.mount();
    return;
  }

  eventCarousel.mount(window.splide.Extensions);
}

function initializeUpcomingEvents() {
  normalizePortraitThumbnails();
  mountEventCarousel();
}

window.normalizePortraitThumbnails = normalizePortraitThumbnails;
document.addEventListener('DOMContentLoaded', initializeUpcomingEvents);
