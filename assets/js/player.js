const BASE_PATH = './assets/audio/';
const COVER_PATH = './assets/audio/cover-art/';
const FALLBACK_COVER = './assets/imgs/default-cover.jpg';

const COVER_ART = {
  'Bit Too Much For Me': `${COVER_PATH}410Smash aka Tmac - A Bit Too Much For Me (feat. Young Crip).jpg.jpg`,
  'Blood Bank': `${COVER_PATH}Blood Bank.jpg.jpg`,
  "Fallin' remix": `${COVER_PATH}Fallin remix.webp`,
  'Baby We Can Do It': `${COVER_PATH}hi-tek.jpg`,
  'Where the Party At': `${COVER_PATH}jedge.jpg`,
  "Big Pimpin'": `${COVER_PATH}JAŸ-Z - Big Pimpin'.jpg.jpg`,
  'Jump Off Pt. 6': `${COVER_PATH}K-Swift - Jump Off Pt.6 - Slide To The Left.jpg.jpg`,
  'Backyard Boogie': `${COVER_PATH}Mack 10 - Backyard Boogie.jpg.jpg`,
  'Back To Me': `${COVER_PATH}Marian Hill, Lauren Jauregui - Back To Me.jpg.jpg`,
  'Program (DJ Mix)': `${COVER_PATH}rtrniifabric.webp`,
  "'03 Love": `${COVER_PATH}Rosemarie, JUVENILE - 03 Love feat. Juvenile.jpg.jpg`,
  'Gangsta Kid (Remix)': `${COVER_PATH}shyfx.jpg`,
  'Coffee': `${COVER_PATH}s_esso.jpg`,
  'Break You Off': `${COVER_PATH}The Roots, Musiq Soulchild - Break You Off.jpg.jpg`,

  'Electric Relaxation': `${COVER_PATH}A Tribe Called Quest - Electric Relaxation.jpg.jpg`,
  'Good Morning': `${COVER_PATH}Black Thought, Pusha T, Killer Mike, Swizz Beatz - Good Morning.jpg.jpg`,
  'Down And Out': `${COVER_PATH}Cam\'ron, Kanye West, Syleena Johnson - Down And Out (Clean).jpg.jpg`,
  'Party Like A Rock Star (Bmore)': `${COVER_PATH}DJ B-Eazy [Bmore Original] Party Like A Rock Star.jpg.png`,
  "Can't Let You Go": `${COVER_PATH}Fabolous, Mike Shorey, Lil' Mo - Can't Let You Go (Instrumental).jpg.jpg`,
  'Diamonds 2': `${COVER_PATH}Freddie Gibbs - Diamonds 2.jpg.jpg`,
  'G.O.M.D': `${COVER_PATH}J. Cole - G.O.M.D.jpg.jpg`,
  'Down Ass Bitch': `${COVER_PATH}Ja RuleChuck - Down Ass Bitch.jpg.jpg`,
  'DJ Play A Love Song': `${COVER_PATH}Jamie Foxx, Twista - DJ Play A Love Song (Radio Edit).jpg.jpg`,
  'Excuse Me Miss': `${COVER_PATH}JAŸ-Z - Excuse Me Miss.jpg.jpg`,
  'Can I Get A...': `${COVER_PATH}JAŸ-ZAmilJa Rule - Can I Get A... - From The Rush Hour Soundtrack.jpg.jpg`,
  'Get a High': `${COVER_PATH}Mamas Gun - Get a High.jpg.jpg`,
  'Clubbin\'': `${COVER_PATH}Marques Houston, Joe Budden, The Pied Piper - Clubbin\' (Instrumental).jpg.jpg`,
  'Darjeeling': `${COVER_PATH}T.H.C. - Darjeeling.jpg.jpg`,

  "I'll Whip Ya Head Boy": `${COVER_PATH}50 Cent - I'll Whip Ya Head Boy (Remix) (Clean).jpg.jpg`,
  'Hey Mama': `${COVER_PATH}Black Eyed Peas - Hey Mama.jpg.jpg`,
  'Hey Ma': `${COVER_PATH}Cam\'ron, Juelz Santana, Freekey Zeekey, Toya - Hey Ma (Radio Edit).jpg.jpg`,
  'Knuck If You Buck': `${COVER_PATH}Crime Mob, Lil\' Scrappy - Knuck If You Buck (Instrumental).jpg.jpg`,
  'Hip-Hopera': `${COVER_PATH}FugeesBounty Killer - Hip-Hopera [Radio Edit].jpg.jpg`,
  'I Like It': `${COVER_PATH}Grand Puba - I Like It (I Wanna Be Where You Are).jpg.jpg`,
  "I'm Into You": `${COVER_PATH}Chet Faker - I\'m Into You.jpg.jpg`,
  'I Need A Forest Fire': `${COVER_PATH}James Blake - I Need A Forest Fire.jpg.jpg`,
  'If I Had A Boat': `${COVER_PATH}James Vincent McMorrow - If I Had a Boat.jpg.jpg`,
  "I Don't Trust Myself": `${COVER_PATH}John Mayer - I Don\'t Trust Myself (With Loving You).jpg.jpg`,
  'Workin Em': `${COVER_PATH}ded2.jpg`,
  'Jimmy Choo': `${COVER_PATH}Shyne, Ashanti - Jimmy Choo (Radio).jpg.jpg`,
  "I'm Sprung": `${COVER_PATH}T-Pain - I\'m Sprung.jpg.jpg`,
  'In the Mood': `${COVER_PATH}Talib Kweli - In The Mood.jpg.jpg`,

  'More Than Letters': `${COVER_PATH}Benjamin Francis Leftwich - More Than Letters.jpg.jpg`,
  'ROBOSHOTTA': `${COVER_PATH}Busta Rhymes - Roboshotta.jpg.jpg`,
  'One Call Away': `${COVER_PATH}chingy.jpg`,
  "Livin' It Up": `${COVER_PATH}Ja Rule - Livin' It Up (Radio Edit).jpg.jpg`,
  'Put It On Me': `${COVER_PATH}Ja Rule, Lil' Mo, Vita - Put It On Me.jpg.jpg`,
  'Limit To Your Love': `${COVER_PATH}James Blake - Limit To Your Love.jpg.jpg`,
  "Pimpin' All Over The World": `${COVER_PATH}Ludacris - Pimpin' All Over The World.jpg.jpg`,
  'Numba 1 (Tide Is High)': `${COVER_PATH}Kardinal Offishall, Rihanna - Numba 1 (Tide Is High).jpg.jpg`,
  'Lay Your Body Down': `${COVER_PATH}Pretty Willie - Lay Your Body Down.jpg.jpg`,
  'Rock N Roll': `${COVER_PATH}Raekwon, Ghostface Killah, Kobe James, Jim Jones - Rock N Roll.jpg.jpg`,
  'Lingus': `${COVER_PATH}Snarky Puppy - Lingus.jpg.jpg`,
  "Passin' Me By": `${COVER_PATH}The Pharcyde - Passin' Me By.jpg.jpg`,
  'Overnight Celebrity': `${COVER_PATH}Twista - Overnight Celebrity (Instrumental).jpg.jpg`,
  'Original Nuttah 25 (Remix)': `${COVER_PATH}UK Apachi, Shy FX - Original Nuttah 25 (Chase & Status Remix).jpg.jpg`,

  'Trojans': `${COVER_PATH}Atlas Genius - Trojans - EP Version.jpg.jpg`,
  'Teeny Weeny Little Lovin': `${COVER_PATH}Beres Hammond - Teeny Weeny Little Lovin.jpg.jpg`,
  'Steak Um': `${COVER_PATH}Black Thought - Steak Um.jpg.jpg`,
  'Touch It or Not': `${COVER_PATH}Cam\'ron, Lil Wayne - Touch It Or Not (Clean).jpg.jpg`,
  'Wanna Get To Know You': `${COVER_PATH}G-Unit, Joe - Wanna Get To Know You (Clean).jpg.jpg`,
  'Shaolin Monk Motherfunk': `${COVER_PATH}Hiatus Kaiyote - Shaolin Monk Motherfunk.jpg.jpg`,
  'Timeless': `${COVER_PATH}James Blake - Timeless.jpg.jpg`,
  "We Don't Eat": `${COVER_PATH}James Vincent McMorrow - We Don't Eat.jpg.jpg`,
  'Wicked Game (Live)': `${COVER_PATH}James Vincent McMorrow - Wicked Game (Recorded Live At St. Canice Cathedral, Kilkenny).jpg.jpg`,
  'To B Honest': `${COVER_PATH}Jill Scott - To B Honest (feat. J.I.D).jpg.jpg`,
  'Sunshine': `${COVER_PATH}Lil\' Flip - Sunshine.jpg.jpg`,
  'Paradise Circus (Zeds Dead Remix)': `${COVER_PATH}Massive Attack - Paradise Circus (Zed\'s Dead Remix).jpg.jpg`,
  'Studio': `${COVER_PATH}Schoolboy Q - Studio.jpg.jpg`,
  'Rocket Chamber': `${COVER_PATH}Tony Yayo, Lloyd Banks - Rocket Chamber.jpg.jpg`,
  'Explosive Lady': `${COVER_PATH}Eykah Badu, Dr. Dre, Wantigga - Explosive Lady.jpg.jpg`
};

const TRACKS = [
  { key: 'Bit Too Much For Me', name: 'Bit Too Much For Me', artist: 'Smash and Young Crip', url: `${BASE_PATH}Smash and Young Crip - Bit Too Much For Me.mp3` },

  { key: 'Blood Bank', name: 'Blood Bank', artist: '', url: `${BASE_PATH}mix-1/Blood Bank.mp3` },
  { key: "Fallin' remix", name: "Fallin' remix", artist: '', url: `${BASE_PATH}mix-1/Fallin' remix.mp3` },
  { key: 'Baby We Can Do It', name: 'Baby We Can Do It', artist: 'Hi-Tek feat. Czar-Nok', url: `${BASE_PATH}mix-1/Hi-Tek - ＂Baby We Can Do It＂ (feat. Czar-Nok)  [Of.mp3` },
  { key: 'Where the Party At', name: 'Where the Party At', artist: 'Jagged Edge, Nelly', url: `${BASE_PATH}mix-1/Jagged Edge, Nelly - Where the Party At (feat. Nelly).mp3` },
  { key: "Big Pimpin'", name: "Big Pimpin'", artist: 'JAŸ-Z, UGK', url: `${BASE_PATH}mix-1/JAŸ-Z, UGK - Big Pimpin'.mp3` },
  { key: 'Jump Off Pt. 6', name: 'Jump Off Pt. 6', artist: 'K-Swift', url: `${BASE_PATH}mix-1/K-Swift - Jump Off Pt.6 - Slide To The Left.mp3` },
  { key: 'Backyard Boogie', name: 'Backyard Boogie', artist: 'Mack 10', url: `${BASE_PATH}mix-1/Mack 10 - Backyard Boogie.mp3` },
  { key: 'Back To Me', name: 'Back To Me', artist: 'Marian Hill, Lauren Jauregui', url: `${BASE_PATH}mix-1/Marian Hill, Lauren Jauregui - Back To Me.mp3` },
  { key: 'Program (DJ Mix)', name: 'Program (DJ Mix)', artist: 'feat. IRAH', url: `${BASE_PATH}mix-1/Program (feat. IRAH) (DJ Mix).mp3` },
  { key: "'03 Love", name: "'03 Love", artist: 'Rosemarie, JUVENILE', url: `${BASE_PATH}mix-1/Rosemarie, JUVENILE - '03 Love (feat. Juvenile).mp3` },
  { key: 'Gangsta Kid (Remix)', name: 'Gangsta Kid (Remix)', artist: 'Shy Fx', url: `${BASE_PATH}mix-1/Shy Fx - Gangsta Kid (Hyper Funk T Power Remix).mp3` },
  { key: 'Coffee', name: 'Coffee', artist: 'Sylvan Esso', url: `${BASE_PATH}mix-1/Sylvan Esso - Coffee (Official Audio).mp3` },
  { key: 'Break You Off', name: 'Break You Off', artist: 'The Roots, Musiq Soulchild', url: `${BASE_PATH}mix-1/The Roots, Musiq Soulchild - Break You Off.mp3` },

  { key: 'Electric Relaxation', name: 'Electric Relaxation', artist: 'A Tribe Called Quest', url: `${BASE_PATH}mix-2/A Tribe Called Quest - Electric Relaxation.mp3` },
  { key: 'Good Morning', name: 'Good Morning', artist: 'Black Thought, Pusha T, Swizz Beatz, Killer Mike', url: `${BASE_PATH}mix-2/Black Thought, Pusha T, Swizz Beatz, Killer Mike - Good Morning (feat. Pusha T, Swizz Beatz & Killer Mike).mp3` },
  { key: 'Down And Out', name: 'Down And Out', artist: "Cam'ron, Kanye West, Syleena Johnson", url: `${BASE_PATH}mix-2/Cam'ron, Kanye West, Syleena Johnson - Down And Out.mp3` },
  { key: 'Party Like A Rock Star (Bmore)', name: 'Party Like A Rock Star (Bmore)', artist: 'DJ B-Eazy', url: `${BASE_PATH}mix-2/DJ+B-Eazy+[Bmore+Original]+Party+Like+A+Rock+Star.mp3` },
  { key: "Can't Let You Go", name: "Can't Let You Go", artist: "Fabolous, Lil' Mo, Mike Shorey", url: `${BASE_PATH}mix-2/Fabolous, Lil' Mo, Mike Shorey - Can't Let You Go (feat. Mike Shorey & Lil' Mo).mp3` },
  { key: 'Diamonds 2', name: 'Diamonds 2', artist: 'Freddie Gibbs, Cassie Jo Craig, Irie Jane Gibbs', url: `${BASE_PATH}mix-2/Freddie Gibbs, Cassie Jo Craig, Irie Jane Gibbs - Diamonds 2 (feat. Cassie Jo Craig & Irie Jane Gibbs).mp3` },
  { key: 'G.O.M.D', name: 'G.O.M.D', artist: 'J. Cole', url: `${BASE_PATH}mix-2/J. Cole - G.O.M.D.mp3` },
  { key: 'Down Ass Bitch', name: 'Down Ass Bitch', artist: 'Ja Rule, Chuck', url: `${BASE_PATH}mix-2/Ja Rule, Chuck - Down Ass Bitch.mp3` },
  { key: 'DJ Play A Love Song', name: 'DJ Play A Love Song', artist: 'Jamie Foxx, Twista', url: `${BASE_PATH}mix-2/Jamie Foxx, Twista - DJ Play A Love Song (feat. Twista).mp3` },
  { key: 'Excuse Me Miss', name: 'Excuse Me Miss', artist: 'JAŸ-Z', url: `${BASE_PATH}mix-2/JAŸ-Z - Excuse Me Miss.mp3` },
  { key: 'Can I Get A...', name: 'Can I Get A...', artist: 'JAŸ-Z, Amil, Ja Rule', url: `${BASE_PATH}mix-2/JAŸ-Z, Amil, Ja Rule - Can I Get A... - From The Rush Hour Soundtrack.mp3` },
  { key: 'Get a High', name: 'Get a High', artist: 'Mamas Gun', url: `${BASE_PATH}mix-2/Mamas Gun - Get a High.mp3` },
  { key: "Clubbin'", name: "Clubbin'", artist: 'Marques Houston, Joe Budden, Pied Piper', url: `${BASE_PATH}mix-2/Marques Houston, Joe Budden, Pied Piper - Clubbin'.mp3` },
  { key: 'Darjeeling', name: 'Darjeeling', artist: 'T.H.C.', url: `${BASE_PATH}mix-2/T.H.C. - Darjeeling.mp3` },

  { key: "I'll Whip Ya Head Boy", name: "I'll Whip Ya Head Boy", artist: '50 Cent, Young Buck', url: `${BASE_PATH}mix-3/50 Cent, Young Buck - I'll Whip Ya Head Boy.mp3` },
  { key: 'Hey Mama', name: 'Hey Mama', artist: 'Black Eyed Peas', url: `${BASE_PATH}mix-3/Black Eyed Peas - Hey Mama.mp3` },
  { key: 'Hey Ma', name: 'Hey Ma', artist: "Cam'ron, Juelz Santana, Freekey Zeekey, Toya", url: `${BASE_PATH}mix-3/Cam'ron, Juelz Santana, Freekey Zeekey, Toya - Hey Ma.mp3` },
  { key: 'Knuck If You Buck', name: 'Knuck If You Buck', artist: "Crime Mob, Lil Scrappy", url: `${BASE_PATH}mix-3/Crime Mob, Lil Scrappy - Knuck If You Buck (feat. Lil' Scrappy).mp3` },
  { key: 'Hip-Hopera', name: 'Hip-Hopera', artist: 'Fugees, Bounty Killer', url: `${BASE_PATH}mix-3/Fugees, Bounty Killer - Hip-Hopera [Radio Edit].mp3` },
  { key: 'I Like It', name: 'I Like It', artist: 'Grand Puba', url: `${BASE_PATH}mix-3/Grand Puba - I Like It (I Wanna Be Where You Are).mp3` },
  { key: "I'm Into You", name: "I'm Into You", artist: '', url: `${BASE_PATH}mix-3/I'm Into You.mp3` },
  { key: 'I Need A Forest Fire', name: 'I Need A Forest Fire', artist: 'James Blake, Bon Iver', url: `${BASE_PATH}mix-3/James Blake, Bon Iver - I Need A Forest Fire.mp3` },
  { key: 'If I Had A Boat', name: 'If I Had A Boat', artist: 'James Vincent McMorrow', url: `${BASE_PATH}mix-3/James Vincent McMorrow - If I Had A Boat.mp3` },
  { key: "I Don't Trust Myself", name: "I Don't Trust Myself", artist: 'John Mayer', url: `${BASE_PATH}mix-3/John Mayer - I Don't Trust Myself (With Loving You).mp3` },
  { key: 'Workin Em', name: 'Workin Em', artist: 'Lil Wayne', url: `${BASE_PATH}mix-3/lil wayne workin em.mp3` },
  { key: 'Jimmy Choo', name: 'Jimmy Choo', artist: 'Shyne, Ashanti', url: `${BASE_PATH}mix-3/Shyne, Ashanti - Jimmy Choo.mp3` },
  { key: "I'm Sprung", name: "I'm Sprung", artist: 'T-Pain', url: `${BASE_PATH}mix-3/T-Pain - I'm Sprung.mp3` },
  { key: 'In the Mood', name: 'In the Mood', artist: 'Talib Kweli, Kanye West, Roy Ayers', url: `${BASE_PATH}mix-3/Talib Kweli, Kanye West, Roy Ayers - In the Mood (feat. Kanye West & Roy Ayers).mp3` },

  { key: 'More Than Letters', name: 'More Than Letters', artist: 'Benjamin Francis Leftwich', url: `${BASE_PATH}mix-4/Benjamin Francis Leftwich - More Than Letters.mp3` },
  { key: 'ROBOSHOTTA', name: 'ROBOSHOTTA', artist: 'Busta Rhymes, Burna Boy', url: `${BASE_PATH}mix-4/Busta Rhymes, Burna Boy - ROBOSHOTTA (feat. Burna Boy).mp3` },
  { key: 'One Call Away', name: 'One Call Away', artist: 'Chingy, Jason Weaver', url: `${BASE_PATH}mix-4/Chingy, Jason Weaver - One Call Away.mp3` },
  { key: "Livin' It Up", name: "Livin' It Up", artist: 'Ja Rule, Case', url: `${BASE_PATH}mix-4/Ja Rule, Case - Livin' It Up.mp3` },
  { key: 'Put It On Me', name: 'Put It On Me', artist: 'Ja Rule, Vita', url: `${BASE_PATH}mix-4/Ja Rule, Vita - Put It On Me.mp3` },
  { key: 'Limit To Your Love', name: 'Limit To Your Love', artist: 'James Blake', url: `${BASE_PATH}mix-4/James Blake - Limit To Your Love.mp3` },
  { key: "Pimpin' All Over The World", name: "Pimpin' All Over The World", artist: 'Ludacris, Bobby V.', url: `${BASE_PATH}mix-4/Ludacris, Bobby V. - Pimpin' All Over The World.mp3` },
  { key: 'Numba 1 (Tide Is High)', name: 'Numba 1 (Tide Is High)', artist: '', url: `${BASE_PATH}mix-4/Numba 1 (Tide is high).mp3` },
  { key: 'Lay Your Body Down', name: 'Lay Your Body Down', artist: 'Pretty Willie', url: `${BASE_PATH}mix-4/Pretty Willie -  - Lay Your Body Down.mp3` },
  { key: 'Rock N Roll', name: 'Rock N Roll', artist: 'Raekwon', url: `${BASE_PATH}mix-4/Raekwon - Rock N Roll.mp3` },
  { key: 'Lingus', name: 'Lingus', artist: 'Snarky Puppy', url: `${BASE_PATH}mix-4/Snarky Puppy - Lingus.mp3` },
  { key: "Passin' Me By", name: "Passin' Me By", artist: 'The Pharcyde', url: `${BASE_PATH}mix-4/The Pharcyde - Passin' Me By.mp3` },
  { key: 'Overnight Celebrity', name: 'Overnight Celebrity', artist: 'Twista, Miri Ben-Ari', url: `${BASE_PATH}mix-4/Twista, Miri Ben-Ari - Overnight Celebrity (feat. Miri Ben-Ari).mp3` },
  { key: 'Original Nuttah 25 (Remix)', name: 'Original Nuttah 25 (Remix)', artist: 'Uk Apache, SHY FX, IRAH, Chase & Status', url: `${BASE_PATH}mix-4/Uk Apache, SHY FX, IRAH, Chase & Status - Original Nuttah 25 (feat. IRAH) - Chase & Status Remix.mp3` },

  { key: 'Trojans', name: 'Trojans', artist: 'Atlas Genius', url: `${BASE_PATH}mix-5/Atlas Genius - Trojans - EP Version.mp3` },
  { key: 'Teeny Weeny Little Lovin', name: 'Teeny Weeny Little Lovin', artist: 'Beres Hammond', url: `${BASE_PATH}mix-5/Beres Hammond - Teeny Weeny Little Lovin.mp3` },
  { key: 'Steak Um', name: 'Steak Um', artist: 'Black Thought, ScHoolboy Q', url: `${BASE_PATH}mix-5/Black Thought, ScHoolboy Q - Steak Um (feat. ScHoolboy Q).mp3` },
  { key: 'Touch It or Not', name: 'Touch It or Not', artist: 'Cam\'ron, Lil Wayne', url: `${BASE_PATH}mix-5/Cam\'ron, Lil Wayne - Touch It or Not.mp3` },
  { key: 'Wanna Get To Know You', name: 'Wanna Get To Know You', artist: 'G-Unit, Joe', url: `${BASE_PATH}mix-5/G-Unit, Joe - Wanna Get To Know You.mp3` },
  { key: 'Shaolin Monk Motherfunk', name: 'Shaolin Monk Motherfunk', artist: 'Hiatus Kaiyote', url: `${BASE_PATH}mix-5/Hiatus Kaiyote - Shaolin Monk Motherfunk.mp3` },
  { key: 'Timeless', name: 'Timeless', artist: 'James Blake', url: `${BASE_PATH}mix-5/James Blake - Timeless.mp3` },
  { key: "We Don't Eat", name: "We Don't Eat", artist: 'James Vincent McMorrow', url: `${BASE_PATH}mix-5/James Vincent McMorrow - We Don\'t Eat.mp3` },
  { key: 'Wicked Game (Live)', name: 'Wicked Game (Live)', artist: 'James Vincent McMorrow', url: `${BASE_PATH}mix-5/James Vincent McMorrow - Wicked Game - Recorded Live at St Canice Cathedral, Kilkenny.mp3` },
  { key: 'To B Honest', name: 'To B Honest', artist: 'Jill Scott, JID', url: `${BASE_PATH}mix-5/Jill Scott, JID - To B Honest.mp3` },
  { key: 'Sunshine', name: 'Sunshine', artist: "Lil' Flip, Lea", url: `${BASE_PATH}mix-5/Lil' Flip, Lea - Sunshine (feat. Lea).mp3` },
  { key: 'Paradise Circus (Zeds Dead Remix)', name: 'Paradise Circus (Zeds Dead Remix)', artist: '', url: `${BASE_PATH}mix-5/Paradise Circus (Zeds Dead Remix).mp3` },
  { key: 'Studio', name: 'Studio', artist: 'ScHoolboy Q, BJ The Chicago Kid', url: `${BASE_PATH}mix-5/ScHoolboy Q, BJ The Chicago Kid - Studio.mp3` },
  { key: 'Rocket Chamber', name: 'Rocket Chamber', artist: 'Tony Yayo, Lloyd Banks', url: `${BASE_PATH}mix-5/Tony Yayo, Lloyd Banks - Rocket Chamber.mp3` },
  { key: 'Explosive Lady', name: 'Explosive Lady', artist: 'Wantigga', url: `${BASE_PATH}mix-5/Wantigga - Explosive Lady.mp3` }
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

  Amplitude.init({
    bindings: {
      37: 'prev',
      39: 'next',
      32: 'play_pause'
    },
    songs: buildSongs(),
    start_song: 0
  });

  wireProgressSeek();
  wireTrackEvents();
  setEqState();
}

document.addEventListener('DOMContentLoaded', initPlayer);