// Overflow marquee for the week-bar song line. Same measure-and-duplicate
// approach as the player title in player.js.

$(function () {
  if (!$('.top-week-banner').length) return;

  var $source = $('.top-week-banner .top-week-banner__text').first().clone();
  $('.top-week-banner').data('source', $source);

  updateTopWeekBanner();
  $(window).on('resize', updateTopWeekBanner);
});

function updateTopWeekBanner() {
  var $banner = $('.top-week-banner');
  var $source = $banner.data('source');
  if (!$banner.length || !$source) return;

  $banner.removeClass('is-marquee').empty().append($source.clone());

  var text = $banner[0].querySelector('.top-week-banner__text');
  if (!text || text.scrollWidth <= $banner[0].clientWidth) return;

  var $run = $('<span class="top-week-banner__run"></span>');
  $run.append($source.clone());
  $run.append($source.clone().attr('aria-hidden', 'true'));
  $banner.empty().addClass('is-marquee').append($run);
}
