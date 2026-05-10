'use strict';

// ── DOM refs ──────────────────────────────────────────────────────
const introScreen      = document.getElementById('intro-screen');
const introVideoEl     = document.getElementById('intro-video');
const introCamPlaceholder = document.getElementById('intro-cam-placeholder');
const camRequestBtn    = document.getElementById('cam-request-btn');
const playBtn          = document.getElementById('play-btn');
const introHint        = document.getElementById('intro-hint');
const appEl            = document.getElementById('app');

const strangerVideo    = document.getElementById('stranger-video');
const yourVideo        = document.getElementById('your-video');
const jumpscareOverlay = document.getElementById('jumpscare-overlay');
const jumpscareImg     = document.getElementById('jumpscare-img');
const nextSound        = document.getElementById('next-sound');
const nextBtn          = document.getElementById('next-btn');
const stopBtn          = document.getElementById('stop-btn');
const connecting       = document.getElementById('connecting');
const camBlocked       = document.getElementById('cam-blocked');
const strangerScoreEl  = document.getElementById('stranger-score');
const yourScoreEl      = document.getElementById('your-score');
const strangerVerdict  = document.getElementById('stranger-verdict');
const yourVerdict      = document.getElementById('your-verdict');
const strangerCard     = document.getElementById('stranger-card');
const youCard          = document.getElementById('you-card');
const resultBanner     = document.getElementById('result-banner');
const resultText       = document.getElementById('result-text');
const onlineCountEl    = document.getElementById('online-count');

// ── Video pool ────────────────────────────────────────────────────
const ALL_VIDEOS            = ['person1.mp4', 'person2.mp4', 'person3.mp4', 'person4.mp4', 'person_5.mp4'];
const FIRST_STRANGER_VIDEOS = ALL_VIDEOS.filter(v => v !== 'person4.mp4');

function randomVideo(exclude) {
  const pool = ALL_VIDEOS.filter(v => v !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Camera ────────────────────────────────────────────────────────
let cameraStream = null;

async function requestCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    // Show live preview on intro screen
    introVideoEl.srcObject = cameraStream;
    introCamPlaceholder.style.display = 'none';
    introVideoEl.style.display = 'block';
    camRequestBtn.textContent = '✓ Camera ready';
    camRequestBtn.classList.add('granted');
    introHint.textContent = 'Looking good! Ready to enter the battle?';
    playBtn.classList.remove('hidden');
  } catch {
    introHint.textContent = 'Camera denied — you can still battle without a score.';
    introHint.style.color = '#e94560';
    playBtn.classList.remove('hidden');
  }
}

function attachCameraToGame() {
  if (cameraStream) {
    yourVideo.srcObject = cameraStream;
  } else {
    camBlocked.classList.remove('hidden');
  }
}

// ── Volatile score engine ─────────────────────────────────────────
// Each person has a "true" score that drifts; displayed score jitters around it.
const strangerState = { base: 9.1,  displayed: null, interval: null };
const yourState     = { base: null, displayed: null, interval: null };

function randBase(min, max) { return +(min + Math.random() * (max - min)).toFixed(1); }

function jitter(base, range = 0.4) {
  const v = base + (Math.random() - 0.5) * range * 2;
  return +Math.max(0, Math.min(10, v)).toFixed(1);
}

function scoreColor(v) {
  if (v >= 8)   return 'high';
  if (v >= 5.5) return 'mid';
  return 'low';
}

function updateScore(el, state) {
  const newVal = jitter(state.base);
  if (newVal === state.displayed) return;
  state.displayed = newVal;
  el.textContent = newVal.toFixed(1);
  el.className = 'score-value ' + scoreColor(newVal);
  // brief pop animation
  el.classList.remove('score-pop');
  void el.offsetWidth;
  el.classList.add('score-pop');
}

let verdictTimer = null;

function startScores() {
  strangerState.base = 9.1;
  yourState.base = randBase(5.0, 8.5);

  clearInterval(strangerState.interval);
  clearInterval(yourState.interval);

  strangerState.interval = setInterval(() => {
    strangerState.base = +(strangerState.base + (Math.random() - 0.5) * 0.15).toFixed(2);
    strangerState.base = Math.max(8.5, Math.min(9.8, strangerState.base));
    updateScore(strangerScoreEl, strangerState);
  }, 280 + Math.random() * 200);

  yourState.interval = setInterval(() => {
    yourState.base = +(yourState.base + (Math.random() - 0.5) * 0.2).toFixed(2);
    yourState.base = Math.max(4.0, Math.min(9.0, yourState.base));
    updateScore(yourScoreEl, yourState);
  }, 320 + Math.random() * 250);
}

function scheduleVerdict() {
  clearTimeout(verdictTimer);
  verdictTimer = setTimeout(showVerdict, 3500);
}

function stopScores() {
  clearInterval(strangerState.interval);
  clearInterval(yourState.interval);
  clearTimeout(verdictTimer);
  strangerScoreEl.textContent = '—';
  yourScoreEl.textContent = '—';
  strangerScoreEl.className = 'score-value';
  yourScoreEl.className = 'score-value';
  hideVerdict();
}

function showVerdict() {
  const sScore = strangerState.displayed ?? strangerState.base;
  const yScore = yourState.displayed ?? yourState.base;
  const youWin = yScore > sScore;

  strangerVerdict.classList.remove('hidden', 'mogger', 'mogged');
  yourVerdict.classList.remove('hidden', 'mogger', 'mogged');
  strangerCard.classList.remove('winner', 'loser');
  youCard.classList.remove('winner', 'loser');

  if (youWin) {
    strangerVerdict.textContent = 'MOGGED';
    strangerVerdict.classList.add('mogged');
    strangerCard.classList.add('loser');
    yourVerdict.textContent = 'MOGGER';
    yourVerdict.classList.add('mogger');
    youCard.classList.add('winner');
    resultBanner.className = 'result-banner you-win';
    resultText.textContent = '🏆 YOU MOGGED THE STRANGER';
  } else {
    strangerVerdict.textContent = 'MOGGER';
    strangerVerdict.classList.add('mogger');
    strangerCard.classList.add('winner');
    yourVerdict.textContent = 'MOGGED';
    yourVerdict.classList.add('mogged');
    youCard.classList.add('loser');
    resultBanner.className = 'result-banner you-lose';
    resultText.textContent = 'YOU GOT MOGGED';
  }
}

function hideVerdict() {
  strangerVerdict.classList.add('hidden');
  yourVerdict.classList.add('hidden');
  strangerCard.classList.remove('winner', 'loser');
  youCard.classList.remove('winner', 'loser');
  resultBanner.className = 'result-banner hidden';
}

// ── Simulated fluctuating online count ───────────────────────────
setInterval(() => {
  const base = 38412;
  const drift = Math.floor((Math.random() - 0.5) * 200);
  onlineCountEl.textContent = (base + drift).toLocaleString();
}, 4000);

// ── Jumpscare ─────────────────────────────────────────────────────
const JUMPSCARE_MIN_MS  = 8_000;
const JUMPSCARE_MAX_MS  = 25_000;
const JUMPSCARE_HOLD_MS = 2_400;

// jumpscare.jpg is set at the bottom of init

function triggerJumpscare() {
  nextSound.currentTime = 0;
  nextSound.volume = 1;
  nextSound.play().catch(() => {});

  jumpscareOverlay.classList.remove('hidden');

  setTimeout(() => {
    jumpscareOverlay.classList.add('hidden');
    nextSound.pause();
    showConnecting(1800);
  }, JUMPSCARE_HOLD_MS);
}

function scheduleJumpscare() {
  const delay = JUMPSCARE_MIN_MS + Math.random() * (JUMPSCARE_MAX_MS - JUMPSCARE_MIN_MS);
  setTimeout(triggerJumpscare, delay);
}

// ── Connecting / next stranger ────────────────────────────────────
function showConnecting(durationMs) {
  stopScores();
  connecting.classList.remove('hidden');
  strangerVideo.pause();

  const currentSrc = strangerVideo.src.split('/').pop();

  setTimeout(() => {
    strangerVideo.src = randomVideo(currentSrc);
    strangerVideo.load();
    connecting.classList.add('hidden');
    strangerVideo.currentTime = 0;
    strangerVideo.play().catch(() => {});
    startScores();
    scheduleVerdict(); // verdict is always shown for battles after the first
  }, durationMs);
}

// ── Controls ──────────────────────────────────────────────────────
nextBtn.addEventListener('click', () => {
  nextSound.currentTime = 0;
  nextSound.play().catch(() => {});
  showConnecting(1500);
  // No jumpscare on Next — it only fires on the random timer
});

stopBtn.addEventListener('click', () => {
  stopScores();
  connecting.classList.remove('hidden');
  strangerVideo.pause();
});

// ── Intro screen ──────────────────────────────────────────────────
camRequestBtn.addEventListener('click', requestCamera);

playBtn.addEventListener('click', () => {
  introScreen.classList.add('hidden');
  appEl.classList.remove('hidden');
  attachCameraToGame();
  startGame();
});

function startGame() {
  const firstVideo = FIRST_STRANGER_VIDEOS[Math.floor(Math.random() * FIRST_STRANGER_VIDEOS.length)];
  strangerVideo.src = firstVideo;
  strangerVideo.load();
  strangerVideo.play().catch(() => {});
  startScores();
  scheduleJumpscare();
}

// ── Init ──────────────────────────────────────────────────────────
jumpscareImg.src = 'jumpscare.jpg';
