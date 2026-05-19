// assets/js/player.js

const BASE_PATH = './assets/audio/';

const DEFAULT_TRACK = {
  id: 'default',
  label: 'Smash and Young Crip - Bit Too Much For Me',
  src: `${BASE_PATH}Smash and Young Crip - Bit Too Much For Me.mp3`
};

const MIXES = {
  'mix-1': {
    id: 'mix-1',
    label: 'mix-1',
    tracks: [
      { title: 'Blood Bank', src: `${BASE_PATH}mix-1/Blood Bank.mp3` },
      { title: "Fallin' remix", src: `${BASE_PATH}mix-1/Fallin' remix.mp3` },
      { title: 'Hi-Tek - "Baby We Can Do It" (feat. Czar-Nok)', src: `${BASE_PATH}mix-1/Hi-Tek - ＂Baby We Can Do It＂ (feat. Czar-Nok)  [Of.mp3` },
      { title: 'Between Me & You', src: `${BASE_PATH}mix-1/Ja Rule, Christina Milian - Between Me & You - Album Version (Edited).mp3` },
      { title: 'Where the Party At', src: `${BASE_PATH}mix-1/Jagged Edge, Nelly - Where the Party At (feat. Nelly).mp3` },
      { title: "Big Pimpin'", src: `${BASE_PATH}mix-1/JAŸ-Z, UGK - Big Pimpin'.mp3` },
      { title: 'Jump Off Pt. 6', src: `${BASE_PATH}mix-1/K-Swift - Jump Off Pt.6 - Slide To The Left.mp3` },
      { title: 'Backyard Boogie', src: `${BASE_PATH}mix-1/Mack 10 - Backyard Boogie.mp3` },
      { title: 'Back To Me', src: `${BASE_PATH}mix-1/Marian Hill, Lauren Jauregui - Back To Me.mp3` },
      { title: 'Program (DJ Mix)', src: `${BASE_PATH}mix-1/Program (feat. IRAH) (DJ Mix).mp3` },
      { title: "'03 Love", src: `${BASE_PATH}mix-1/Rosemarie, JUVENILE - '03 Love (feat. Juvenile).mp3` },
      { title: 'Gangsta Kid (Remix)', src: `${BASE_PATH}mix-1/Shy Fx - Gangsta Kid (Hyper Funk T Power Remix).mp3` },
      { title: 'Coffee', src: `${BASE_PATH}mix-1/Sylvan Esso - Coffee (Official Audio).mp3` },
      { title: 'Break You Off', src: `${BASE_PATH}mix-1/The Roots, Musiq Soulchild - Break You Off.mp3` }
    ]
  },
  'mix-2': {
    id: 'mix-2',
    label: 'mix-2',
    tracks: [
      { title: 'Electric Relaxation', src: `${BASE_PATH}mix-2/A Tribe Called Quest - Electric Relaxation.mp3` },
      { title: 'Good Morning', src: `${BASE_PATH}mix-2/Black Thought, Pusha T, Swizz Beatz, Killer Mike - Good Morning (feat. Pusha T, Swizz Beatz & Killer Mike).mp3` },
      { title: 'Down And Out', src: `${BASE_PATH}mix-2/Cam'ron, Kanye West, Syleena Johnson - Down And Out.mp3` },
      { title: 'Party Like A Rock Star (Bmore)', src: `${BASE_PATH}mix-2/DJ+B-Eazy+[Bmore+Original]+Party+Like+A+Rock+Star.mp3` },
      { title: "Can't Let You Go", src: `${BASE_PATH}mix-2/Fabolous, Lil' Mo, Mike Shorey - Can't Let You Go (feat. Mike Shorey & Lil' Mo).mp3` },
      { title: 'Diamonds 2', src: `${BASE_PATH}mix-2/Freddie Gibbs, Cassie Jo Craig, Irie Jane Gibbs - Diamonds 2 (feat. Cassie Jo Craig & Irie Jane Gibbs).mp3` },
      { title: 'G.O.M.D', src: `${BASE_PATH}mix-2/J. Cole - G.O.M.D.mp3` },
      { title: 'Down Ass Bitch', src: `${BASE_PATH}mix-2/Ja Rule, Chuck - Down Ass Bitch.mp3` },
      { title: 'DJ Play A Love Song', src: `${BASE_PATH}mix-2/Jamie Foxx, Twista - DJ Play A Love Song (feat. Twista).mp3` },
      { title: 'Excuse Me Miss', src: `${BASE_PATH}mix-2/JAŸ-Z - Excuse Me Miss.mp3` },
      { title: 'Can I Get A...', src: `${BASE_PATH}mix-2/JAŸ-Z, Amil, Ja Rule - Can I Get A... - From The Rush Hour Soundtrack.mp3` },
      { title: 'Get a High', src: `${BASE_PATH}mix-2/Mamas Gun - Get a High.mp3` },
      { title: "Clubbin'", src: `${BASE_PATH}mix-2/Marques Houston, Joe Budden, Pied Piper - Clubbin'.mp3` },
      { title: 'Darjeeling', src: `${BASE_PATH}mix-2/T.H.C. - Darjeeling.mp3` }
    ]
  },
  'mix-3': {
    id: 'mix-3',
    label: 'mix-3',
    tracks: [
      { title: "I'll Whip Ya Head Boy", src: `${BASE_PATH}mix-3/50 Cent, Young Buck - I'll Whip Ya Head Boy.mp3` },
      { title: 'Hey Mama', src: `${BASE_PATH}mix-3/Black Eyed Peas - Hey Mama.mp3` },
      { title: 'Hey Ma', src: `${BASE_PATH}mix-3/Cam'ron, Juelz Santana, Freekey Zeekey, Toya - Hey Ma.mp3` },
      { title: 'Knuck If You Buck', src: `${BASE_PATH}mix-3/Crime Mob, Lil Scrappy - Knuck If You Buck (feat. Lil' Scrappy).mp3` },
      { title: 'Hip-Hopera', src: `${BASE_PATH}mix-3/Fugees, Bounty Killer - Hip-Hopera [Radio Edit].mp3` },
      { title: 'I Like It', src: `${BASE_PATH}mix-3/Grand Puba - I Like It (I Wanna Be Where You Are).mp3` },
      { title: "I'm Into You", src: `${BASE_PATH}mix-3/I'm Into You.mp3` },
      { title: 'I Need A Forest Fire', src: `${BASE_PATH}mix-3/James Blake, Bon Iver - I Need A Forest Fire.mp3` },
      { title: 'If I Had A Boat', src: `${BASE_PATH}mix-3/James Vincent McMorrow - If I Had A Boat.mp3` },
      { title: "I Don't Trust Myself", src: `${BASE_PATH}mix-3/John Mayer - I Don't Trust Myself (With Loving You).mp3` },
      { title: 'Workin Em', src: `${BASE_PATH}mix-3/lil wayne workin em.mp3` },
      { title: 'Jimmy Choo', src: `${BASE_PATH}mix-3/Shyne, Ashanti - Jimmy Choo.mp3` },
      { title: "I'm Sprung", src: `${BASE_PATH}mix-3/T-Pain - I'm Sprung.mp3` },
      { title: 'In the Mood', src: `${BASE_PATH}mix-3/Talib Kweli, Kanye West, Roy Ayers - In the Mood (feat. Kanye West & Roy Ayers).mp3` }
    ]
  },
  'mix-4': {
    id: 'mix-4',
    label: 'mix-4',
    tracks: [
      { title: 'My Happy Ending', src: `${BASE_PATH}mix-4/Avril Lavigne - My Happy Ending.mp3` },
      { title: 'More Than Letters', src: `${BASE_PATH}mix-4/Benjamin Francis Leftwich - More Than Letters.mp3` },
      { title: 'ROBOSHOTTA', src: `${BASE_PATH}mix-4/Busta Rhymes, Burna Boy - ROBOSHOTTA (feat. Burna Boy).mp3` },
      { title: 'One Call Away', src: `${BASE_PATH}mix-4/Chingy, Jason Weaver - One Call Away.mp3` },
      { title: "Livin' It Up", src: `${BASE_PATH}mix-4/Ja Rule, Case - Livin' It Up.mp3` },
      { title: 'Put It On Me', src: `${BASE_PATH}mix-4/Ja Rule, Vita - Put It On Me.mp3` },
      { title: 'Limit To Your Love', src: `${BASE_PATH}mix-4/James Blake - Limit To Your Love.mp3` },
      { title: "Pimpin' All Over The World", src: `${BASE_PATH}mix-4/Ludacris, Bobby V. - Pimpin' All Over The World.mp3` },
      { title: 'Numba 1 (Tide Is High)', src: `${BASE_PATH}mix-4/Numba 1 (Tide is high).mp3` },
      { title: 'Lay Your Body Down', src: `${BASE_PATH}mix-4/Pretty Willie -  - Lay Your Body Down.mp3` },
      { title: 'Rock N Roll', src: `${BASE_PATH}mix-4/Raekwon - Rock N Roll.mp3` },
      { title: 'Lingus', src: `${BASE_PATH}mix-4/Snarky Puppy - Lingus.mp3` },
      { title: "Passin' Me By", src: `${BASE_PATH}mix-4/The Pharcyde - Passin' Me By.mp3` },
      { title: 'Overnight Celebrity', src: `${BASE_PATH}mix-4/Twista, Miri Ben-Ari - Overnight Celebrity (feat. Miri Ben-Ari).mp3` },
      { title: 'Original Nuttah 25 (Remix)', src: `${BASE_PATH}mix-4/Uk Apache, SHY FX, IRAH, Chase & Status - Original Nuttah 25 (feat. IRAH) - Chase & Status Remix.mp3` }
    ]
  },
  'mix-5': {
    id: 'mix-5',
    label: 'mix-5',
    tracks: [
      { title: 'Trojans', src: `${BASE_PATH}mix-5/Atlas Genius - Trojans - EP Version.mp3` },
      { title: 'Teeny Weeny Little Lovin', src: `${BASE_PATH}mix-5/Beres Hammond - Teeny Weeny Little Lovin.mp3` },
      { title: 'Steak Um', src: `${BASE_PATH}mix-5/Black Thought, ScHoolboy Q - Steak Um (feat. ScHoolboy Q).mp3` },
      { title: 'Touch It or Not', src: `${BASE_PATH}mix-5/Cam'ron, Lil Wayne - Touch It or Not.mp3` },
      { title: 'Wanna Get To Know You', src: `${BASE_PATH}mix-5/G-Unit, Joe - Wanna Get To Know You.mp3` },
      { title: 'Shaolin Monk Motherfunk', src: `${BASE_PATH}mix-5/Hiatus Kaiyote - Shaolin Monk Motherfunk.mp3` },
      { title: 'Timeless', src: `${BASE_PATH}mix-5/James Blake - Timeless.mp3` },
      { title: "We Don't Eat", src: `${BASE_PATH}mix-5/James Vincent McMorrow - We Don't Eat.mp3` },
      { title: 'Wicked Game (Live)', src: `${BASE_PATH}mix-5/James Vincent McMorrow - Wicked Game - Recorded Live at St Canice Cathedral, Kilkenny.mp3` },
      { title: 'To B Honest', src: `${BASE_PATH}mix-5/Jill Scott, JID - To B Honest.mp3` },
      { title: 'Sunshine', src: `${BASE_PATH}mix-5/Lil' Flip, Lea - Sunshine (feat. Lea).mp3` },
      { title: 'Paradise Circus (Zeds Dead Remix)', src: `${BASE_PATH}mix-5/Paradise Circus (Zeds Dead Remix).mp3` },
      { title: 'Studio', src: `${BASE_PATH}mix-5/ScHoolboy Q, BJ The Chicago Kid - Studio.mp3` },
      { title: 'Rocket Chamber', src: `${BASE_PATH}mix-5/Tony Yayo, Lloyd Banks - Rocket Chamber.mp3` },
      { title: 'Explosive Lady', src: `${BASE_PATH}mix-5/Wantigga - Explosive Lady.mp3` }
    ]
  }
};

function initLocalPlayer() {
  const audioEl = document.getElementById('local-audio');
  const textSpan = document.getElementById('player-scrolling-text');
  const mixSelect = document.getElementById('mix-select');
  const trackListEl = document.getElementById('track-list');
  const playlistTitleEl = document.getElementById('playlist-title');
  const btnPlay = document.getElementById('btn-play');
  const btnPause = document.getElementById('btn-pause');
  const btnLoad = document.getElementById('btn-load');

  if (!audioEl || !textSpan || !mixSelect || !trackListEl || !playlistTitleEl || !btnPlay || !btnPause || !btnLoad) return;

  let currentMixId = 'default';
  let currentTracks = [DEFAULT_TRACK];
  let currentIndex = 0;

  function setToDefault() {
    currentMixId = 'default';
    currentTracks = [DEFAULT_TRACK];
    currentIndex = 0;
    updateUIForCurrent();
  }

  function setToMix(mixId) {
    const mix = MIXES[mixId];
    if (!mix || !mix.tracks || !mix.tracks.length) {
      setToDefault();
      return;
    }
    currentMixId = mixId;
    currentTracks = mix.tracks.slice();
    currentIndex = 0;
    updateUIForCurrent();
  }

  function updateUIForCurrent() {
    const currentTrack = currentTracks[currentIndex];

    audioEl.src = currentTrack.src;
    audioEl.load();

    if (currentMixId === 'default') {
      // scrolling text = full track name, title bar = "Fave Song"
      textSpan.textContent = DEFAULT_TRACK.label;
      playlistTitleEl.textContent = 'Fave Song';
    } else {
      const mix = MIXES[currentMixId];
      // scrolling text = current track name, title bar = "mix-1", "mix-2", etc.
      textSpan.textContent = currentTrack.title;
      playlistTitleEl.textContent = mix.label;
    }

    trackListEl.innerHTML = '';

    if (currentMixId === 'default') {
      const li = document.createElement('li');
      li.textContent = DEFAULT_TRACK.label;
      li.classList.add('current');
      trackListEl.appendChild(li);
    } else {
      currentTracks.forEach((track, idx) => {
        const li = document.createElement('li');
        li.textContent = track.title;
        if (idx === currentIndex) li.classList.add('current');
        li.addEventListener('click', () => {
          currentIndex = idx;
          updateUIForCurrent();
          playCurrent();
        });
        trackListEl.appendChild(li);
      });
    }
  }

  function playCurrent() {
    audioEl.play().catch((err) => {
      console.error('Playback blocked:', err);
    });
  }

  audioEl.addEventListener('ended', () => {
    currentIndex++;
    if (currentIndex >= currentTracks.length) currentIndex = 0;
    updateUIForCurrent();
    playCurrent();
  });

  btnPlay.addEventListener('click', (e) => {
    e.preventDefault();
    playCurrent();
  });

  btnPause.addEventListener('click', (e) => {
    e.preventDefault();
    audioEl.pause();
  });

  btnLoad.addEventListener('click', (e) => {
    e.preventDefault();
    const isVisible = mixSelect.style.display === 'block';
    mixSelect.style.display = isVisible ? 'none' : 'block';
  });

  mixSelect.addEventListener('change', () => {
    const value = mixSelect.value;
    if (value === 'default') {
      setToDefault();
    } else {
      setToMix(value);
    }
    mixSelect.style.display = 'none';
  });

  setToDefault();
}

document.addEventListener('DOMContentLoaded', initLocalPlayer);