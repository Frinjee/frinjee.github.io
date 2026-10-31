// --- Simple single-song player in .media-player-box ---

var myspaceCurrentAudio = null;
var myspaceCurrentURL = null;
var myspaceInterval = null;

// update this to your real file + labels
var MYSPACE_SONG_URL = 'assets/js/audio/Jay-Z x 3 Doors Down - Here Without You Remix.mp3';
var MYSPACE_SONG_NAME = 'Song Cry x Here Without You Remix';
var MYSPACE_SONG_ARTIST = 'Jay-Z x 3 Doors Down';

$(function () {
  // guard: only run if the player exists on this page
  if (!$('.music_player_container').length) return;

  $('.music_player_track_artist').text(MYSPACE_SONG_ARTIST);
  updateMyspaceTitleMarquee();
  $(window).on('resize', updateMyspaceTitleMarquee);
  paintMyspaceVisualizerSnapshot();

  $('.music_player_play_button').on('click', function () {
    if (myspaceCurrentURL === MYSPACE_SONG_URL &&
        myspaceCurrentAudio &&
        !myspaceCurrentAudio.paused) {
      stopMyspacePlayer();
      return;
    }
    startMyspacePlayer();
  });
});

function updateMyspaceTitleMarquee() {
  var $title = $('.music_player_track_title');
  if (!$title.length) return;

  $title.removeClass('is-marquee').text(MYSPACE_SONG_NAME);
  if ($title[0].scrollWidth <= $title[0].clientWidth) return;

  var $run = $('<span class="music_player_track_title_run"></span>');
  $run.append($('<span class="music_player_track_title_text"></span>').text(MYSPACE_SONG_NAME));
  $run.append($('<span class="music_player_track_title_text"></span>').text(MYSPACE_SONG_NAME));
  $title.empty().addClass('is-marquee').append($run);
}

function startMyspacePlayer() {
  stopMyspacePlayer();

  myspaceCurrentURL = MYSPACE_SONG_URL;
  myspaceCurrentAudio = new Audio(myspaceCurrentURL);
  myspaceCurrentAudio.play();

  $('.music_player_play_button')
    .attr('aria-label', 'Stop')
    .html('<i class="fa-solid fa-stop"></i>');

  myspaceCurrentAudio.addEventListener('ended', function () {
    stopMyspacePlayer();
  });

  myspaceInterval = setInterval(myspaceVisualizer, 100);
}

function stopMyspacePlayer() {
  if (myspaceCurrentAudio) {
    myspaceCurrentAudio.pause();
    myspaceCurrentAudio.currentTime = 0;
  }
  myspaceCurrentAudio = null;
  myspaceCurrentURL = null;

  clearInterval(myspaceInterval);
  myspaceInterval = null;

  $('.music_player_visual_bar').children().remove();

  $('.music_player_play_button')
    .attr('aria-label', 'Play')
    .html('<i class="fa-solid fa-play"></i>');
}

// Still frame shown until playback starts. startMyspacePlayer clears it.
var MYSPACE_VISUAL_SNAPSHOT = [2, 3, 4, 6, 5, 4, 2, 1];

function paintMyspaceVisualizerSnapshot() {
  for (var i = 0; i < MYSPACE_VISUAL_SNAPSHOT.length; i++) {
    var $bar = $('#visual_' + i);
    var pips = '';
    for (var n = 0; n < MYSPACE_VISUAL_SNAPSHOT[i]; n++) {
      pips += '<div class="music_player_visual_pip"></div>';
    }
    $bar.html(pips);
  }
}

function myspaceVisualizer() {
  for (var i = 0; i < 8; i++) {
    var $bar = $('#visual_' + i);
    var len = $bar.children().length;

    switch (i) {
      case 0:
      case 7:
        if (rand(1, 10) > 5) {
          if (len === 3) {
            $bar.children().last().remove();
          } else {
            $bar.append('<div class="music_player_visual_pip"></div>');
          }
        } else {
          if (i === 0 && $('#visual_1').children().length === 0) {
            $bar.children().last().remove();
          } else if (i === 7 && $('#visual_6').children().length === 0) {
            $bar.children().last().remove();
          }
        }
        break;
      case 1:
      case 6:
        if (rand(1, 10) > 5) {
          if (len === 4) {
            $bar.children().last().remove();
          } else {
            $bar.append('<div class="music_player_visual_pip"></div>');
          }
        } else {
          $bar.children().last().remove();
        }
        break;
      case 2:
      case 5:
        if (rand(1, 10) > 5) {
          if (len === 5) {
            $bar.children().last().remove();
          } else {
            $bar.append('<div class="music_player_visual_pip"></div>');
          }
        } else {
          $bar.children().last().remove();
        }
        break;
      case 3:
      case 4:
        if (rand(1, 10) > 5) {
          if (len === 7) {
            $bar.children().last().remove();
          } else {
            $bar.append('<div class="music_player_visual_pip"></div>');
          }
        } else {
          $bar.children().last().remove();
        }
        break;
    }
  }
}

function rand(min, max) {
  return Math.floor(Math.random() * max) + min;
}