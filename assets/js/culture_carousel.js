function normalizeCultureThumbnails(root = document) {
  const thumbnails = root.querySelectorAll('.thumbnail--culture');

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

function mountCultureCarousel() {
  const carousel = document.getElementById('culture-carousel');
  if (!carousel || !window.Splide) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cultureCarousel = new window.Splide(carousel, {
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
    cultureCarousel.mount();
    return;
  }

  cultureCarousel.mount(window.splide.Extensions);
}

function initializeCultureQueue() {
  normalizeCultureThumbnails();
  mountCultureCarousel();
}

window.normalizeCultureThumbnails = normalizeCultureThumbnails;
document.addEventListener('DOMContentLoaded', initializeCultureQueue);
