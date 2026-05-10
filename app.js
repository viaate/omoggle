'use strict';

const strangerVideo   = document.getElementById('stranger-video');
const jumpscareOverlay = document.getElementById('jumpscare-overlay');
const jumpscareVideo  = document.getElementById('jumpscare-video');
const nextSound       = document.getElementById('next-sound');
const nextBtn         = document.getElementById('next-btn');
const stopBtn         = document.getElementById('stop-btn');
const connecting      = document.getElementById('connecting');
const chatMessages    = document.getElementById('chat-messages');
const chatInput       = document.getElementById('chat-input');
const sendBtn         = document.getElementById('send-btn');

// ── Jumpscare config ──────────────────────────────────────────────
// Fires between MIN and MAX seconds after page load (random uniform).
const JUMPSCARE_MIN_MS = 8_000;
const JUMPSCARE_MAX_MS = 25_000;
// Duration the jumpscare stays on screen (ms).
const JUMPSCARE_DURATION_MS = 2_200;

// ── Jumpscare logic ───────────────────────────────────────────────
function triggerJumpscare() {
  // Unmute and blast the jumpscare video
  jumpscareVideo.currentTime = 0;
  jumpscareVideo.muted = false;
  jumpscareVideo.volume = 1;

  // Play the next.wav sound effect simultaneously
  nextSound.currentTime = 0;
  nextSound.volume = 1;
  nextSound.play().catch(() => {});

  jumpscareVideo.play().catch(() => {});
  jumpscareOverlay.classList.remove('hidden');

  setTimeout(() => {
    jumpscareOverlay.classList.add('hidden');
    jumpscareVideo.pause();
    jumpscareVideo.muted = true;
    nextSound.pause();

    // Reconnect screen after scare
    showConnecting(1800);
  }, JUMPSCARE_DURATION_MS);
}

function scheduleJumpscare() {
  const delay = JUMPSCARE_MIN_MS + Math.random() * (JUMPSCARE_MAX_MS - JUMPSCARE_MIN_MS);
  setTimeout(triggerJumpscare, delay);
}

// ── Connecting animation ──────────────────────────────────────────
function showConnecting(durationMs) {
  connecting.classList.remove('hidden');
  strangerVideo.pause();
  setTimeout(() => {
    connecting.classList.add('hidden');
    strangerVideo.currentTime = 0;
    strangerVideo.play().catch(() => {});
    addSystemMsg('Connected to a new stranger.');
  }, durationMs);
}

// ── Chat helpers ──────────────────────────────────────────────────
const strangerLines = [
  'hi', 'hey', 'asl?', 'where r u from', 'sup', 'you look nice', 'haha',
  'lol', 'ur cute', 'wanna talk?', 'what are you up to', 'bored af',
];

function addMsg(type, text) {
  const el = document.createElement('div');
  el.className = `chat-msg ${type}`;
  if (type === 'stranger') {
    el.innerHTML = `<span>Stranger:</span> ${escHtml(text)}`;
  } else if (type === 'you') {
    el.innerHTML = `<span>You:</span> ${escHtml(text)}`;
  } else {
    el.textContent = text;
  }
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMsg(text) { addMsg('system', text); }

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function randomStrangerReply() {
  const delay = 800 + Math.random() * 3000;
  setTimeout(() => {
    addMsg('stranger', strangerLines[Math.floor(Math.random() * strangerLines.length)]);
  }, delay);
}

// ── Controls ──────────────────────────────────────────────────────
nextBtn.addEventListener('click', () => {
  nextSound.currentTime = 0;
  nextSound.play().catch(() => {});
  showConnecting(1500);
  scheduleJumpscare();
});

stopBtn.addEventListener('click', () => {
  connecting.classList.remove('hidden');
  strangerVideo.pause();
  addSystemMsg('You have disconnected.');
});

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMsg('you', text);
  chatInput.value = '';
  randomStrangerReply();
}

// ── Init ──────────────────────────────────────────────────────────
strangerVideo.play().catch(() => {});
scheduleJumpscare();
