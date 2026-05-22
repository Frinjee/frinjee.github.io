const BASE_PATH = './assets/audio/';
const COVER_PATH = './assets/audio/cover-art/';
const FALLBACK_COVER = './assets/imgs/default-cover.jpg';

const COVER_ART = {
  'Bit Too Much For Me': `${COVER_PATH}Smash and Young Crip - Bit Too Much For Me.jpg`,
  'Baby We Can Do It': `${COVER_PATH}Hi-Tek - Baby We Can Do It (feat. Czar-Nok).jpg`,
  'Program (DJ Mix)': `${COVER_PATH}Chase and Status - Program (feat. IRAH) (DJ Mix).jpg`,
  "'03 Love": `${COVER_PATH}Rosemarie, JUVENILE - '03 Love (feat. Juvenile).jpg`,
  'Gangster Kid (Remix)': `${COVER_PATH}Shy Fx - Gangster Kid (Hyper Funk T Power Remix).jpg`,
  'Good Morning': `${COVER_PATH}Black Thought, Pusha T, Killer Mike, Swizz Beatz - Good Morning.jpg`,
  'Down And Out': `${COVER_PATH}Cam'ron, Kanye West, Syleena Johnson - Down And Out.jpg`,
  'Party Like A Rock Star (Bmore)': `${COVER_PATH}DJ B-Eazy [Bmore Original] Party Like A Rock Star.png`,
  'Darjeeling': `${COVER_PATH}T.H.C. - Darjeeling.jpg`,
  'Hip-Hopera': `${COVER_PATH}Fugees + Bounty Killer - Hip-Hopera [Radio Edit].jpg`,
  "I'm Into You": `${COVER_PATH}Chet Faker - I'm Into You.jpg`,
  'I Need A Forest Fire': `${COVER_PATH}James Blake, Bon Iver - I Need A Forest Fire.jpg`,
  'Rock N Roll': `${COVER_PATH}Raekwon, Ghostface Killah, Kobe James, Jim Jones - Rock N Roll.jpg`,
  'Shaolin Monk Motherfunk': `${COVER_PATH}Hiatus Kaiyote - Shaolin Monk Motherfunk.jpg`,
  'Teeny Weeny Little Lovin': `${COVER_PATH}Beres Hammond - Teeny Weeny Little Lovin.jpg`,
  'Rocket Chamber': `${COVER_PATH}Tony Yayo, Lloyd Banks - Rocket Chamber.jpg`,
  'Explosive Lady': `${COVER_PATH}Eykah Badu, Dr. Dre, Wantigga - Explosive Lady.jpg`
};

const TRACKS = [
  { key: 'Bit Too Much For Me', name: 'Bit Too Much For Me', artist: 'Smash and Young Crip', url: `${BASE_PATH}Smash and Young Crip - Bit Too Much For Me.mp3` },
  { key: 'Baby We Can Do It', name: 'Baby We Can Do It', artist: 'Hi-Tek feat. Czar-Nok', url: `${BASE_PATH}Hi-Tek - Baby We Can Do It (feat. Czar-Nok).mp3` },
  { key: 'Program (DJ Mix)', name: 'Program (DJ Mix)', artist: 'Chase and Status feat. IRAH', url: `${BASE_PATH}Chase and Status - Program (feat. IRAH) (DJ Mix).mp3` },
  { key: "'03 Love", name: "'03 Love", artist: 'Rosemarie, JUVENILE', url: `${BASE_PATH}Rosemarie, JUVENILE - '03 Love (feat. Juvenile).mp3` },
  { key: 'Gangster Kid (Remix)', name: 'Gangster Kid (Remix)', artist: 'Shy Fx', url: `${BASE_PATH}Shy Fx - Gangster Kid (Hyper Funk T Power Remix).mp3` },
  { key: 'Good Morning', name: 'Good Morning', artist: 'Black Thought, Pusha T, Killer Mike, Swizz Beatz', url: `${BASE_PATH}Black Thought, Pusha T, Killer Mike, Swizz Beatz - Good Morning.mp3` },
  { key: 'Down And Out', name: 'Down And Out', artist: "Cam'ron, Kanye West, Syleena Johnson", url: `${BASE_PATH}Cam'ron, Kanye West, Syleena Johnson - Down And Out.mp3` },
  { key: 'Party Like A Rock Star (Bmore)', name: 'Party Like A Rock Star (Bmore)', artist: 'DJ B-Eazy', url: `${BASE_PATH}DJ B-Eazy [Bmore Original] Party Like A Rock Star.mp3` },
  { key: 'Darjeeling', name: 'Darjeeling', artist: 'T.H.C.', url: `${BASE_PATH}T.H.C. - Darjeeling.mp3` },
  { key: 'Hip-Hopera', name: 'Hip-Hopera', artist: 'Fugees, Bounty Killer', url: `${BASE_PATH}Fugees + Bounty Killer - Hip-Hopera [Radio Edit].mp3` },
  { key: "I'm Into You", name: "I'm Into You", artist: 'Chet Faker', url: `${BASE_PATH}Chet Faker - I'm Into You.mp3` },
  { key: 'I Need A Forest Fire', name: 'I Need A Forest Fire', artist: 'James Blake, Bon Iver', url: `${BASE_PATH}James Blake, Bon Iver - I Need A Forest Fire.mp3` },
  { key: 'Rock N Roll', name: 'Rock N Roll', artist: 'Raekwon, Ghostface Killah, Kobe James, Jim Jones', url: `${BASE_PATH}Raekwon, Ghostface Killah, Kobe James, Jim Jones - Rock N Roll.mp3` },
  { key: 'Shaolin Monk Motherfunk', name: 'Shaolin Monk Motherfunk', artist: 'Hiatus Kaiyote', url: `${BASE_PATH}Hiatus Kaiyote - Shaolin Monk Motherfunk.mp3` },
  { key: 'Teeny Weeny Little Lovin', name: 'Teeny Weeny Little Lovin', artist: 'Beres Hammond', url: `${BASE_PATH}Beres Hammond - Teeny Weeny Little Lovin.mp3` },
  { key: 'Rocket Chamber', name: 'Rocket Chamber', artist: 'Tony Yayo, Lloyd Banks', url: `${BASE_PATH}Tony Yayo, Lloyd Banks - Rocket Chamber.mp3` },
  { key: 'Explosive Lady', name: 'Explosive Lady', artist: 'Eykah Badu, Dr. Dre, Wantigga', url: `${BASE_PATH}Eykah Badu, Dr. Dre, Wantigga - Explosive Lady.mp3` }
];

function withCoverArt(track) {
  return {
    name: track.name,
    artist: track.artist,
    url: track.url,
    cover_art_url: COVER_ART[track.key] || FALLBACK_COVER
  };
}

function buildSongs() {
  return TRACKS.map(withCoverArt);
}

function setEqState() {
  const img = document.querySelector('.mmp-eq-container img');
  if (!img) return;
  const playing = document.body.classList.contains('amplitude-playing');
  img.src = playing ? './assets/imgs/player/myspace-mp-player/eq_play.gif' : './assets/imgs/player/myspace-mp-player/eq_pause.png';
}

function wireProgressSeek() {
  const bar = document.querySelector('.amplitude-song-played-progress');
  if (!bar) return;
  bar.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x / this.offsetWidth) * 100;
    Amplitude.setSongPlayedPercentage(Math.max(0, Math.min(100, pct)));
  });
}

function wireTrackEvents() {
  document.addEventListener('play', setEqState, true);
  document.addEventListener('pause', setEqState, true);
  document.addEventListener('ended', setEqState, true);
}

function initPlayer() {
  if (typeof Amplitude === 'undefined') {
    console.error('[ERROR] amplitude.js not loaded');
    return;
  }

  const songs = buildSongs();
  const startSong = Math.floor(Math.random() * songs.length);

  Amplitude.init({
    bindings: {
      37: 'prev',
      39: 'next',
      32: 'play_pause'
    },
    songs,
    start_song: startSong
  });

  wireProgressSeek();
  wireTrackEvents();
  setEqState();
}

document.addEventListener('DOMContentLoaded', initPlayer);