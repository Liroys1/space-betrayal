// ============================================
// CONNECTION
// ============================================
const socket = io();

// ============================================
// CONSTANTS (KEEP IN SYNC WITH server.js)
// ============================================
const PLAYER_RADIUS = 18;
const KILL_RANGE = 80;
const REPORT_RANGE = 100;
const TASK_RANGE = 60;
const EMERGENCY_RANGE = 60;
const VISION_RADIUS_BASE = 200;

const COLORS = [
  '#c51111', '#132ed2', '#11802d', '#ee54bb',
  '#f07d06', '#f6f657', '#3f474e', '#d6e0f0',
  '#6b2fbb', '#71491e', '#38fedb', '#50ef39',
];

const MAP = {
  width: 2000,
  height: 1500,
  rooms: [
    { name: 'Cafeteria',    x: 750,  y: 300,  w: 300, h: 250, color: '#1e2a3a' },
    { name: 'Upper Engine', x: 850,  y: 50,   w: 200, h: 180, color: '#1a2e1a' },
    { name: 'MedBay',       x: 400,  y: 350,  w: 250, h: 200, color: '#1e2a3a' },
    { name: 'Weapons',      x: 1150, y: 350,  w: 250, h: 200, color: '#3a1a1a' },
    { name: 'Security',     x: 400,  y: 650,  w: 250, h: 200, color: '#1e2a3a' },
    { name: 'Storage',      x: 750,  y: 650,  w: 300, h: 200, color: '#1a1a2e' },
    { name: 'O2',           x: 1150, y: 650,  w: 250, h: 200, color: '#1a3a3a' },
    { name: 'Electrical',   x: 400,  y: 950,  w: 250, h: 200, color: '#2e2e1a' },
    { name: 'Lower Engine', x: 750,  y: 950,  w: 300, h: 200, color: '#1a2e1a' },
    { name: 'Shields',      x: 1150, y: 950,  w: 250, h: 200, color: '#2a1a3a' },
    { name: 'Navigation',   x: 800,  y: 1250, w: 250, h: 180, color: '#1a1a3a' },
  ],
  hallways: [
    // Vertical hallways (overlap 20px into rooms on each side)
    { x: 910, y: 210, w: 60, h: 110 },   // Upper Engine <-> Cafeteria
    { x: 910, y: 530, w: 60, h: 140 },   // Cafeteria <-> Storage
    { x: 910, y: 830, w: 60, h: 140 },   // Storage <-> Lower Engine
    { x: 900, y: 1130, w: 60, h: 140 },  // Lower Engine <-> Navigation
    // Horizontal hallways (overlap 20px into rooms on each side)
    { x: 630, y: 400, w: 140, h: 60 },   // MedBay <-> Cafeteria
    { x: 1030, y: 400, w: 140, h: 60 },  // Cafeteria <-> Weapons
    { x: 630, y: 700, w: 140, h: 60 },   // Security <-> Storage
    { x: 1030, y: 700, w: 140, h: 60 },  // Storage <-> O2
    { x: 630, y: 1000, w: 140, h: 60 },  // Electrical <-> Lower Engine
    { x: 1030, y: 1000, w: 140, h: 60 }, // Lower Engine <-> Shields
  ],
  emergencyButton: { x: 900, y: 425 },
  spawnPoint: { x: 900, y: 425 },
};

// ============================================
// STATE
// ============================================
let myId = null;
let myRole = null;
let roomCode = null;
let isHost = false;
let gamePhase = 'menu';
let players = [];
let bodies = [];
let taskBar = 0;
let myTasks = [];
let keys = {};
let camera = { x: 0, y: 0 };
let activeTask = null;
let settings = {};
let votedFor = null;
let voters = new Set();
let myHatIndex = 0;
let myOutfitIndex = 0;
let myColor = '#c51111';
let lobbyPlayers_data = [];
let meetingTimerEnd = 0;
let otherImpostors = [];
let killFlashes = [];
let roleFlash = { active: false, timer: 0, role: '' };

// === VISUAL EFFECTS STATE ===
let particles = [];
let ambientDust = [];
let screenShake = { trauma: 0, offsetX: 0, offsetY: 0 };
let playerAnimState = {}; // playerId -> { walkPhase, lastX, lastY, moving, bobOffset }
let shootingStars = [];
let lightFlickers = {}; // roomName -> flickerAlpha

// Pre-generate stars for space background
const bgStars = [];
for (let i = 0; i < 250; i++) {
  bgStars.push({
    x: Math.random() * 4000 - 1000, y: Math.random() * 3000 - 500,
    size: Math.random() * 2.5 + 0.5,
    speed: Math.random() * 0.3 + 0.05,
    color: ['#ffffff', '#aaccff', '#ffccaa', '#aaffcc'][Math.floor(Math.random() * 4)],
    twinkleOffset: Math.random() * Math.PI * 2,
    twinkleSpeed: Math.random() * 2 + 1,
  });
}

// Pre-generate ambient dust particles
for (let i = 0; i < 60; i++) {
  ambientDust.push({
    x: Math.random() * 2000, y: Math.random() * 1500,
    vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.1,
    size: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.15 + 0.05,
    drift: Math.random() * Math.PI * 2,
  });
}

function spawnParticle(x, y, type) {
  const count = type === 'kill' ? 20 : type === 'footstep' ? 3 : 5;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = type === 'kill' ? (Math.random() * 3 + 1) : (Math.random() * 0.8 + 0.2);
    particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (type === 'footstep' ? 0.5 : 0),
      life: 1, decay: type === 'kill' ? 0.015 : 0.03,
      size: type === 'kill' ? (Math.random() * 4 + 2) : (Math.random() * 2 + 1),
      color: type === 'kill' ? '#ff2222' : type === 'spark' ? '#ffdd44' : 'rgba(200,200,220,0.4)',
      gravity: type === 'kill' ? 0.05 : 0.01,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += p.gravity;
    p.life -= p.decay; p.vx *= 0.98;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function getAnimState(id) {
  if (!playerAnimState[id]) {
    playerAnimState[id] = { walkPhase: 0, lastX: 0, lastY: 0, moving: false, bobOffset: 0, squash: 1, stretch: 1, facingRight: true };
  }
  return playerAnimState[id];
}

function updatePlayerAnims() {
  for (const player of players) {
    const anim = getAnimState(player.id);
    const dx = player.x - anim.lastX;
    const dy = player.y - anim.lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    anim.moving = dist > 0.5;
    if (anim.moving) {
      anim.walkPhase += dist * 0.3;
      anim.facingRight = dx >= 0;
      // Footstep particles (occasionally)
      if (Math.random() < 0.15 && player.alive) {
        spawnParticle(player.x, player.y + PLAYER_RADIUS, 'footstep');
      }
    }
    anim.bobOffset = anim.moving ? Math.sin(anim.walkPhase) * 2 : Math.sin(Date.now() * 0.003) * 0.8;
    // Squash/stretch
    if (anim.moving) {
      anim.squash = 1 + Math.abs(Math.sin(anim.walkPhase * 0.5)) * 0.05;
      anim.stretch = 1 / anim.squash;
    } else {
      anim.squash += (1 - anim.squash) * 0.1;
      anim.stretch += (1 - anim.stretch) * 0.1;
    }
    anim.lastX = player.x; anim.lastY = player.y;
  }
}

// ============================================
// CANVAS SETUP
// ============================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ============================================
// DOM REFERENCES
// ============================================
const menuScreen = document.getElementById('menu-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const meetingScreen = document.getElementById('meeting-screen');
const resultsScreen = document.getElementById('results-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const taskScreen = document.getElementById('task-screen');

const nameInput = document.getElementById('name-input');
const codeInput = document.getElementById('code-input');
const menuError = document.getElementById('menu-error');
const createBtn = document.getElementById('create-btn');
const joinBtn = document.getElementById('join-btn');

const lobbyCode = document.getElementById('lobby-code');
const lobbyPlayers = document.getElementById('lobby-players');
const lobbyCount = document.getElementById('lobby-count');
const startBtn = document.getElementById('start-btn');
const lobbyWait = document.getElementById('lobby-wait');

const skinPreview = document.getElementById('skin-preview');
const skinPreviewCtx = skinPreview.getContext('2d');
const hatPrev = document.getElementById('hat-prev');
const hatNext = document.getElementById('hat-next');
const hatLabel = document.getElementById('hat-label');
const outfitPrev = document.getElementById('outfit-prev');
const outfitNext = document.getElementById('outfit-next');
const outfitLabel = document.getElementById('outfit-label');

const meetingHeader = document.getElementById('meeting-header');
const meetingTimer = document.getElementById('meeting-timer');
const meetingPhaseLabel = document.getElementById('meeting-phase-label');
const voteGrid = document.getElementById('vote-grid');
const skipBtn = document.getElementById('skip-btn');

const resultText = document.getElementById('result-text');
const resultRole = document.getElementById('result-role');

const gameoverPanel = document.getElementById('gameover-panel');
const winTitle = document.getElementById('win-title');
const winReason = document.getElementById('win-reason');
const roleList = document.getElementById('role-list');
const lobbyBtn = document.getElementById('lobby-btn');

const taskTitle = document.getElementById('task-title');
const taskCanvas = document.getElementById('task-canvas');
const taskCtx = taskCanvas.getContext('2d');
const taskClose = document.getElementById('task-close');

// ============================================
// UI HELPERS
// ============================================
function showScreen(screen) {
  [menuScreen, lobbyScreen, meetingScreen, resultsScreen, gameoverScreen, taskScreen].forEach(s => s.classList.remove('active'));
  if (screen) screen.classList.add('active');
}

function updateLobbyUI(playerList) {
  lobbyCode.textContent = roomCode;
  lobbyPlayers_data = playerList;
  lobbyPlayers.innerHTML = '';
  playerList.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="player-color" style="background:${p.color}"></span>
      <span class="player-name">${escapeHtml(p.name)}</span>
      ${p.id === isHost ? '<span class="host-badge">HOST</span>' : ''}`;
    lobbyPlayers.appendChild(li);
    if (p.id === socket.id) {
      myColor = p.color;
    }
  });
  lobbyCount.textContent = `${playerList.length} / 10 players`;

  if (socket.id === isHost) {
    startBtn.style.display = 'inline-block';
    startBtn.disabled = playerList.length < 3;
    lobbyWait.style.display = 'none';
  } else {
    startBtn.style.display = 'none';
    lobbyWait.style.display = 'block';
  }
  drawSkinPreview();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function drawSkinPreview() {
  const c = skinPreviewCtx;
  const w = skinPreview.width;
  const h = skinPreview.height;
  c.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 10;
  const s = 1.8;
  const R = PLAYER_RADIUS * s;

  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath();
  c.ellipse(cx, cy + R + 4, R * 0.8, 5 * s, 0, 0, Math.PI * 2);
  c.fill();

  // Body
  c.fillStyle = myColor;
  c.beginPath();
  c.arc(cx, cy - 4 * s, R, 0, Math.PI * 2);
  c.fill();

  // Legs
  c.fillStyle = myColor;
  c.fillRect(cx - 12 * s, cy + R - 8 * s, 10 * s, 10 * s);
  c.fillRect(cx + 2 * s, cy + R - 8 * s, 10 * s, 10 * s);

  // Backpack
  c.fillStyle = darkenColor(myColor, 0.65);
  c.fillRect(cx - R - 5 * s, cy - 10 * s, 7 * s, 16 * s);
  c.strokeStyle = darkenColor(myColor, 0.5);
  c.lineWidth = 1 * s;
  c.strokeRect(cx - R - 5 * s, cy - 10 * s, 7 * s, 16 * s);

  // Visor
  c.fillStyle = '#7ec8e3';
  c.beginPath();
  c.ellipse(cx + 6 * s, cy - 6 * s, 9 * s, 7 * s, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.4)';
  c.beginPath();
  c.ellipse(cx + 4 * s, cy - 8 * s, 4 * s, 3 * s, -0.3, 0, Math.PI * 2);
  c.fill();

  // Outfit
  const outfitId = OUTFITS[myOutfitIndex];
  if (outfitId !== 'none') {
    drawOutfit(c, cx, cy - 4 * s, outfitId, myColor, s);
  }

  // Hat
  const hatId = HATS[myHatIndex];
  if (hatId !== 'none') {
    drawHat(c, cx, cy - 4 * s, hatId, s);
  }
}

hatPrev.addEventListener('click', () => {
  myHatIndex = (myHatIndex - 1 + HATS.length) % HATS.length;
  hatLabel.textContent = HAT_NAMES[HATS[myHatIndex]];
  drawSkinPreview();
  socket.emit('changeSkin', { hat: HATS[myHatIndex], outfit: OUTFITS[myOutfitIndex] });
});
hatNext.addEventListener('click', () => {
  myHatIndex = (myHatIndex + 1) % HATS.length;
  hatLabel.textContent = HAT_NAMES[HATS[myHatIndex]];
  drawSkinPreview();
  socket.emit('changeSkin', { hat: HATS[myHatIndex], outfit: OUTFITS[myOutfitIndex] });
});
outfitPrev.addEventListener('click', () => {
  myOutfitIndex = (myOutfitIndex - 1 + OUTFITS.length) % OUTFITS.length;
  outfitLabel.textContent = OUTFIT_NAMES[OUTFITS[myOutfitIndex]];
  drawSkinPreview();
  socket.emit('changeSkin', { hat: HATS[myHatIndex], outfit: OUTFITS[myOutfitIndex] });
});
outfitNext.addEventListener('click', () => {
  myOutfitIndex = (myOutfitIndex + 1) % OUTFITS.length;
  outfitLabel.textContent = OUTFIT_NAMES[OUTFITS[myOutfitIndex]];
  drawSkinPreview();
  socket.emit('changeSkin', { hat: HATS[myHatIndex], outfit: OUTFITS[myOutfitIndex] });
});

function darkenColor(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
}

const HATS = ['none', 'crown', 'tophat', 'partyhat', 'chef', 'headband', 'flower', 'devil', 'halo', 'beanie', 'antenna', 'pirate'];
const OUTFITS = ['none', 'suit', 'labcoat', 'military', 'scarf', 'cape', 'toolbelt'];
const HAT_NAMES = { none: 'None', crown: 'Crown', tophat: 'Top Hat', partyhat: 'Party Hat', chef: 'Chef Hat', headband: 'Headband', flower: 'Flower', devil: 'Devil Horns', halo: 'Halo', beanie: 'Beanie', antenna: 'Antenna', pirate: 'Pirate Hat' };
const OUTFIT_NAMES = { none: 'None', suit: 'Suit', labcoat: 'Lab Coat', military: 'Military', scarf: 'Scarf', cape: 'Cape', toolbelt: 'Tool Belt' };

function drawHat(c, x, y, hatType, scale) {
  const s = scale || 1;
  const R = PLAYER_RADIUS * s;
  c.save();
  switch (hatType) {
    case 'crown':
      c.fillStyle = '#ffd700';
      c.beginPath();
      c.moveTo(x - R * 0.65, y - R * 0.6);
      c.lineTo(x - R * 0.5, y - R * 1.3);
      c.lineTo(x - R * 0.2, y - R * 0.85);
      c.lineTo(x, y - R * 1.4);
      c.lineTo(x + R * 0.2, y - R * 0.85);
      c.lineTo(x + R * 0.5, y - R * 1.3);
      c.lineTo(x + R * 0.65, y - R * 0.6);
      c.closePath();
      c.fill();
      c.strokeStyle = '#b8960f';
      c.lineWidth = 1 * s;
      c.stroke();
      // gems
      c.fillStyle = '#ff0000';
      c.beginPath(); c.arc(x, y - R * 1.1, 2 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#0066ff';
      c.beginPath(); c.arc(x - R * 0.35, y - R * 0.95, 1.5 * s, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x + R * 0.35, y - R * 0.95, 1.5 * s, 0, Math.PI * 2); c.fill();
      break;
    case 'tophat':
      c.fillStyle = '#1a1a2e';
      // brim
      c.beginPath();
      c.ellipse(x, y - R * 0.65, R * 0.9, R * 0.2, 0, 0, Math.PI * 2);
      c.fill();
      // cylinder
      c.fillRect(x - R * 0.5, y - R * 1.6, R * 1, R * 1);
      c.strokeStyle = '#333';
      c.lineWidth = 1 * s;
      c.strokeRect(x - R * 0.5, y - R * 1.6, R * 1, R * 1);
      // band
      c.fillStyle = '#cc3333';
      c.fillRect(x - R * 0.5, y - R * 0.85, R * 1, R * 0.18);
      break;
    case 'partyhat':
      c.fillStyle = '#ff6699';
      c.beginPath();
      c.moveTo(x - R * 0.55, y - R * 0.55);
      c.lineTo(x, y - R * 1.7);
      c.lineTo(x + R * 0.55, y - R * 0.55);
      c.closePath();
      c.fill();
      // stripes
      c.strokeStyle = '#ffdd44';
      c.lineWidth = 2 * s;
      c.beginPath();
      c.moveTo(x - R * 0.35, y - R * 0.75);
      c.lineTo(x + R * 0.35, y - R * 0.75);
      c.moveTo(x - R * 0.2, y - R * 1.1);
      c.lineTo(x + R * 0.2, y - R * 1.1);
      c.stroke();
      // pom pom
      c.fillStyle = '#ffdd44';
      c.beginPath(); c.arc(x, y - R * 1.7, 3 * s, 0, Math.PI * 2); c.fill();
      break;
    case 'chef':
      c.fillStyle = '#ffffff';
      // poofy top
      c.beginPath(); c.arc(x - R * 0.3, y - R * 1.2, R * 0.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x + R * 0.3, y - R * 1.2, R * 0.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x, y - R * 1.4, R * 0.45, 0, Math.PI * 2); c.fill();
      // band
      c.fillRect(x - R * 0.6, y - R * 0.85, R * 1.2, R * 0.3);
      c.strokeStyle = '#ccc';
      c.lineWidth = 1 * s;
      c.strokeRect(x - R * 0.6, y - R * 0.85, R * 1.2, R * 0.3);
      break;
    case 'headband':
      c.strokeStyle = '#ff4444';
      c.lineWidth = 3 * s;
      c.beginPath();
      c.arc(x, y - R * 0.15, R * 0.85, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
      // knot
      c.fillStyle = '#ff4444';
      c.beginPath(); c.arc(x + R * 0.7, y - R * 0.55, 3 * s, 0, Math.PI * 2); c.fill();
      // tails
      c.strokeStyle = '#ff4444';
      c.lineWidth = 2 * s;
      c.beginPath();
      c.moveTo(x + R * 0.7, y - R * 0.55);
      c.lineTo(x + R * 1.1, y - R * 0.3);
      c.moveTo(x + R * 0.7, y - R * 0.55);
      c.lineTo(x + R * 1.0, y - R * 0.1);
      c.stroke();
      break;
    case 'flower':
      const petals = 5;
      const cx = x, cy = y - R * 1.1;
      c.fillStyle = '#ff69b4';
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
        c.beginPath();
        c.arc(cx + Math.cos(angle) * 4 * s, cy + Math.sin(angle) * 4 * s, 4 * s, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#ffdd00';
      c.beginPath(); c.arc(cx, cy, 3 * s, 0, Math.PI * 2); c.fill();
      // stem
      c.strokeStyle = '#22aa22';
      c.lineWidth = 2 * s;
      c.beginPath(); c.moveTo(cx, cy + 4 * s); c.lineTo(cx, y - R * 0.65); c.stroke();
      break;
    case 'devil':
      c.fillStyle = '#cc0000';
      // left horn
      c.beginPath();
      c.moveTo(x - R * 0.5, y - R * 0.5);
      c.lineTo(x - R * 0.8, y - R * 1.5);
      c.lineTo(x - R * 0.15, y - R * 0.7);
      c.closePath();
      c.fill();
      // right horn
      c.beginPath();
      c.moveTo(x + R * 0.5, y - R * 0.5);
      c.lineTo(x + R * 0.8, y - R * 1.5);
      c.lineTo(x + R * 0.15, y - R * 0.7);
      c.closePath();
      c.fill();
      break;
    case 'halo':
      c.strokeStyle = '#ffdd44';
      c.lineWidth = 2.5 * s;
      c.shadowColor = '#ffdd44';
      c.shadowBlur = 8 * s;
      c.beginPath();
      c.ellipse(x, y - R * 1.2, R * 0.55, R * 0.15, 0, 0, Math.PI * 2);
      c.stroke();
      c.shadowBlur = 0;
      break;
    case 'beanie':
      c.fillStyle = '#2255aa';
      c.beginPath();
      c.arc(x, y - R * 0.15, R * 0.95, Math.PI, Math.PI * 2);
      c.fill();
      // folded rim
      c.fillStyle = '#1a3a7a';
      c.beginPath();
      c.ellipse(x, y - R * 0.15, R * 0.95, R * 0.2, 0, Math.PI, Math.PI * 2);
      c.fill();
      // pom pom
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(x, y - R * 1.1, 4 * s, 0, Math.PI * 2); c.fill();
      break;
    case 'antenna':
      c.strokeStyle = '#888';
      c.lineWidth = 2 * s;
      c.beginPath();
      c.moveTo(x, y - R * 0.7);
      c.lineTo(x, y - R * 1.7);
      c.stroke();
      // ball
      c.fillStyle = '#ff3333';
      c.beginPath(); c.arc(x, y - R * 1.7, 4 * s, 0, Math.PI * 2); c.fill();
      // glow
      c.fillStyle = 'rgba(255,50,50,0.3)';
      c.beginPath(); c.arc(x, y - R * 1.7, 7 * s, 0, Math.PI * 2); c.fill();
      break;
    case 'pirate':
      c.fillStyle = '#1a1a1a';
      // hat body
      c.beginPath();
      c.moveTo(x - R * 0.9, y - R * 0.6);
      c.quadraticCurveTo(x - R * 0.7, y - R * 1.4, x, y - R * 1.2);
      c.quadraticCurveTo(x + R * 0.7, y - R * 1.4, x + R * 0.9, y - R * 0.6);
      c.closePath();
      c.fill();
      c.strokeStyle = '#333';
      c.lineWidth = 1 * s;
      c.stroke();
      // skull
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(x, y - R * 0.95, 3.5 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1a1a1a';
      c.beginPath(); c.arc(x - 1.5 * s, y - R * 0.98, 1 * s, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x + 1.5 * s, y - R * 0.98, 1 * s, 0, Math.PI * 2); c.fill();
      break;
  }
  c.restore();
}

function drawOutfit(c, x, y, outfitType, playerColor, scale) {
  const s = scale || 1;
  const R = PLAYER_RADIUS * s;
  c.save();
  switch (outfitType) {
    case 'suit':
      // tie
      c.fillStyle = '#cc3333';
      c.beginPath();
      c.moveTo(x, y - R * 0.3);
      c.lineTo(x - 3 * s, y + R * 0.2);
      c.lineTo(x, y + R * 0.5);
      c.lineTo(x + 3 * s, y + R * 0.2);
      c.closePath();
      c.fill();
      // lapels
      c.strokeStyle = '#222';
      c.lineWidth = 2 * s;
      c.beginPath();
      c.moveTo(x - 3 * s, y - R * 0.35);
      c.lineTo(x - R * 0.4, y + R * 0.3);
      c.moveTo(x + 3 * s, y - R * 0.35);
      c.lineTo(x + R * 0.4, y + R * 0.3);
      c.stroke();
      break;
    case 'labcoat':
      // white coat overlay
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.beginPath();
      c.arc(x, y - 4 * s, R * 0.85, Math.PI * 0.3, Math.PI * 0.7);
      c.fill();
      // pocket
      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.lineWidth = 1 * s;
      c.strokeRect(x + R * 0.15, y - 2 * s, R * 0.3, R * 0.25);
      // pen
      c.fillStyle = '#3366ff';
      c.fillRect(x + R * 0.25, y - 5 * s, 2 * s, R * 0.25);
      break;
    case 'military':
      // ammo belt diagonal
      c.strokeStyle = '#5a4a2a';
      c.lineWidth = 4 * s;
      c.beginPath();
      c.moveTo(x - R * 0.5, y - R * 0.4);
      c.lineTo(x + R * 0.3, y + R * 0.4);
      c.stroke();
      // ammo dots
      c.fillStyle = '#8a7a4a';
      for (let i = 0; i < 4; i++) {
        const t = i / 3;
        const bx = x - R * 0.5 + (R * 0.8) * t;
        const by = y - R * 0.4 + (R * 0.8) * t;
        c.beginPath(); c.arc(bx, by, 2 * s, 0, Math.PI * 2); c.fill();
      }
      // star badge
      c.fillStyle = '#ffd700';
      c.beginPath(); c.arc(x + R * 0.4, y - R * 0.25, 3 * s, 0, Math.PI * 2); c.fill();
      break;
    case 'scarf':
      c.fillStyle = '#cc4444';
      // wrap around neck
      c.beginPath();
      c.ellipse(x, y + R * 0.35, R * 0.7, R * 0.2, 0, 0, Math.PI * 2);
      c.fill();
      // hanging tail
      c.fillStyle = '#aa3333';
      c.beginPath();
      c.moveTo(x + R * 0.2, y + R * 0.45);
      c.lineTo(x + R * 0.15, y + R * 1.0);
      c.lineTo(x + R * 0.45, y + R * 0.95);
      c.lineTo(x + R * 0.4, y + R * 0.45);
      c.closePath();
      c.fill();
      // stripe
      c.fillStyle = '#ffdd44';
      c.fillRect(x + R * 0.18, y + R * 0.65, R * 0.22, R * 0.08);
      break;
    case 'cape':
      c.fillStyle = 'rgba(130,0,180,0.6)';
      c.beginPath();
      c.moveTo(x - R * 0.6, y - R * 0.15);
      c.quadraticCurveTo(x - R * 1.2, y + R * 0.8, x - R * 0.5, y + R * 1.2);
      c.lineTo(x, y + R * 0.5);
      c.closePath();
      c.fill();
      // clasp
      c.fillStyle = '#ffd700';
      c.beginPath(); c.arc(x - R * 0.55, y - R * 0.1, 2.5 * s, 0, Math.PI * 2); c.fill();
      break;
    case 'toolbelt':
      // belt
      c.fillStyle = '#6b4c2a';
      c.fillRect(x - R * 0.75, y + R * 0.2, R * 1.5, R * 0.2);
      // buckle
      c.fillStyle = '#c0c0c0';
      c.fillRect(x - R * 0.1, y + R * 0.18, R * 0.2, R * 0.24);
      // wrench
      c.fillStyle = '#888';
      c.fillRect(x + R * 0.4, y + R * 0.1, 2 * s, R * 0.35);
      // hammer
      c.fillStyle = '#996633';
      c.fillRect(x - R * 0.5, y + R * 0.1, 2 * s, R * 0.35);
      c.fillStyle = '#888';
      c.fillRect(x - R * 0.6, y + R * 0.05, R * 0.22, R * 0.15);
      break;
  }
  c.restore();
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function worldToScreen(wx, wy) {
  return { x: wx - camera.x, y: wy - camera.y };
}

function pointInAnyRect(px, py, rects) {
  for (const rect of rects) {
    if (px >= rect.x && px <= rect.x + rect.w &&
        py >= rect.y && py <= rect.y + rect.h) {
      return true;
    }
  }
  return false;
}

function isWalkable(x, y) {
  const m = PLAYER_RADIUS * 0.6;
  const allRects = [...MAP.rooms, ...MAP.hallways];
  return (
    pointInAnyRect(x - m, y - m, allRects) &&
    pointInAnyRect(x + m, y - m, allRects) &&
    pointInAnyRect(x - m, y + m, allRects) &&
    pointInAnyRect(x + m, y + m, allRects)
  );
}

// ============================================
// INPUT
// ============================================
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;

  if (gamePhase === 'playing' && !activeTask) {
    const me = players.find(p => p.id === myId);
    if (!me) return;

    if (e.key.toLowerCase() === 'q' && myRole === 'impostor' && me.alive) {
      socket.emit('doKill');
    }
    if (e.key.toLowerCase() === 'r' && me.alive) {
      socket.emit('reportBody');
    }
    if (e.key.toLowerCase() === 'e' && me.alive) {
      // Check for task or emergency
      const nearestTask = findNearestTask(me);
      if (nearestTask && myRole === 'crewmate') {
        openTask(nearestTask);
      } else if (distance(me, MAP.emergencyButton) < EMERGENCY_RANGE) {
        socket.emit('callEmergency');
      } else if (nearestTask && myRole === 'impostor') {
        openTask(nearestTask); // impostors can fake tasks
      }
    }
  }
});

document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

// Click on canvas for action buttons
canvas.addEventListener('click', (e) => {
  if (gamePhase !== 'playing' || activeTask) return;
  const me = players.find(p => p.id === myId);
  if (!me || !me.alive) return;

  if (window._actionButtons) {
    for (const btn of window._actionButtons) {
      if (btn.hitbox &&
          e.clientX >= btn.hitbox.x && e.clientX <= btn.hitbox.x + btn.hitbox.w &&
          e.clientY >= btn.hitbox.y && e.clientY <= btn.hitbox.y + btn.hitbox.h) {
        if (btn.action === 'kill') socket.emit('doKill');
        else if (btn.action === 'report') socket.emit('reportBody');
        else if (btn.action === 'use') {
          const task = findNearestTask(me);
          if (task) openTask(task);
        }
        else if (btn.action === 'emergency') socket.emit('callEmergency');
        break;
      }
    }
  }
});

function findNearestTask(me) {
  let nearest = null;
  let nearestDist = TASK_RANGE;
  for (const task of myTasks) {
    if (task.completed) continue;
    const d = distance(me, task);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = task;
    }
  }
  return nearest;
}

// ============================================
// MOVEMENT
// ============================================
function handleInput() {
  const me = players.find(p => p.id === myId);
  if (!me) return;

  let dx = 0, dy = 0;
  if (keys['arrowup'] || keys['w']) dy -= 1;
  if (keys['arrowdown'] || keys['s']) dy += 1;
  if (keys['arrowleft'] || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  if (dx !== 0 || dy !== 0) {
    const speed = settings.playerSpeed || 3;

    if (me.alive) {
      const newX = me.x + dx * speed;
      const newY = me.y + dy * speed;

      if (isWalkable(newX, newY)) {
        me.x = newX;
        me.y = newY;
        socket.emit('playerMove', { x: newX, y: newY });
      } else if (isWalkable(newX, me.y)) {
        me.x = newX;
        socket.emit('playerMove', { x: newX, y: me.y });
      } else if (isWalkable(me.x, newY)) {
        me.y = newY;
        socket.emit('playerMove', { x: me.x, y: newY });
      }
    } else {
      // Ghost: free movement
      me.x += dx * speed;
      me.y += dy * speed;
      socket.emit('ghostMove', { x: me.x, y: me.y });
    }
  }
}

// ============================================
// CAMERA
// ============================================
function updateCamera() {
  const me = players.find(p => p.id === myId);
  if (!me) return;
  const targetX = me.x - canvas.width / 2;
  const targetY = me.y - canvas.height / 2;
  camera.x += (targetX - camera.x) * 0.12;
  camera.y += (targetY - camera.y) * 0.12;
  // Screen shake
  screenShake.trauma = Math.max(0, screenShake.trauma - 0.02);
  const shake = screenShake.trauma * screenShake.trauma;
  screenShake.offsetX = shake * 8 * (Math.random() * 2 - 1);
  screenShake.offsetY = shake * 8 * (Math.random() * 2 - 1);
}

// ============================================
// RENDERING
// ============================================
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gamePhase === 'playing' || gamePhase === 'meeting' || gamePhase === 'voting' || gamePhase === 'results') {
    // Apply screen shake
    ctx.save();
    ctx.translate(screenShake.offsetX, screenShake.offsetY);

    drawSpace();
    drawMap();
    drawEmergencyButton();
    drawTaskLocations();
    drawBodies();
    drawParticles();
    drawPlayers();

    const me = players.find(p => p.id === myId);
    if (me && me.alive) {
      drawVisionMask();
    }

    drawKillFlashes();
    ctx.restore(); // end screen shake

    drawHUD();
    drawMinimap();

    if (gamePhase === 'playing') {
      drawActionButtons();
    }

    if (roleFlash.active) {
      drawRoleFlash();
    }
  } else {
    drawMenuBackground();
  }
}

function drawParticles() {
  for (const p of particles) {
    const s = worldToScreen(p.x, p.y);
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMenuBackground() {
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#050510');
  grad.addColorStop(0.5, '#0a0a1e');
  grad.addColorStop(1, '#0f0520');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const time = Date.now() / 5000;
  // Nebula glow
  ctx.globalCompositeOperation = 'lighter';
  const nebGrad = ctx.createRadialGradient(canvas.width * 0.7, canvas.height * 0.3, 0, canvas.width * 0.7, canvas.height * 0.3, 300);
  nebGrad.addColorStop(0, `rgba(40,10,60,${0.05 + Math.sin(time) * 0.02})`);
  nebGrad.addColorStop(1, 'rgba(40,10,60,0)');
  ctx.fillStyle = nebGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

  // Stars
  for (let i = 0; i < 150; i++) {
    const x = ((i * 137.5 + time * 8) % canvas.width);
    const y = ((i * 97.3) % canvas.height);
    const brightness = 0.2 + Math.sin(time * 1.5 + i * 0.7) * 0.3 + 0.2;
    const size = (i % 7 === 0) ? 2 : 1;
    ctx.fillStyle = `rgba(255,255,255,${brightness})`;
    ctx.beginPath(); ctx.arc(x, y, size * 0.7, 0, Math.PI * 2); ctx.fill();
  }
}

function drawSpace() {
  // Deep space gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#050510');
  grad.addColorStop(0.5, '#0a0a1e');
  grad.addColorStop(1, '#0f0520');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Nebula clouds (subtle colored fog)
  const t = Date.now() / 20000;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const nx = (canvas.width * 0.3 + i * 200 - camera.x * 0.03 + Math.sin(t + i) * 30) % (canvas.width + 300) - 150;
    const ny = (canvas.height * 0.4 + i * 150 - camera.y * 0.03 + Math.cos(t * 0.7 + i) * 20) % (canvas.height + 200) - 100;
    const nebGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, 200 + i * 50);
    const colors = [
      [`rgba(40,10,60,${0.04 + Math.sin(t + i) * 0.01})`, 'rgba(40,10,60,0)'],
      [`rgba(10,20,50,${0.04 + Math.sin(t * 1.3 + i) * 0.01})`, 'rgba(10,20,50,0)'],
      [`rgba(50,10,30,${0.03 + Math.sin(t * 0.8 + i) * 0.01})`, 'rgba(50,10,30,0)'],
    ];
    nebGrad.addColorStop(0, colors[i][0]);
    nebGrad.addColorStop(1, colors[i][1]);
    ctx.fillStyle = nebGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.globalCompositeOperation = 'source-over';

  // Stars with parallax, twinkling, and varied sizes/colors
  for (const star of bgStars) {
    const px = ((star.x - camera.x * star.speed) % (canvas.width + 400)) - 200;
    const py = ((star.y - camera.y * star.speed) % (canvas.height + 400)) - 200;
    const twinkle = 0.3 + Math.sin(Date.now() * 0.001 * star.twinkleSpeed + star.twinkleOffset) * 0.35 + 0.35;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(px, py, star.size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    // Glow on bigger stars
    if (star.size > 1.8) {
      ctx.globalAlpha = twinkle * 0.2;
      ctx.beginPath();
      ctx.arc(px, py, star.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Shooting stars (occasional)
  if (Math.random() < 0.003 && shootingStars.length < 2) {
    shootingStars.push({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.5,
      vx: 6 + Math.random() * 4, vy: 2 + Math.random() * 2, life: 1,
    });
  }
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const ss = shootingStars[i];
    ctx.strokeStyle = `rgba(255,255,255,${ss.life})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ss.x, ss.y);
    ctx.lineTo(ss.x - ss.vx * 8, ss.y - ss.vy * 8);
    ctx.stroke();
    ss.x += ss.vx; ss.y += ss.vy; ss.life -= 0.025;
    if (ss.life <= 0) shootingStars.splice(i, 1);
  }
}

function drawMap() {
  const time = Date.now();

  // Draw hallways first (behind rooms)
  for (const hall of MAP.hallways) {
    const s = worldToScreen(hall.x, hall.y);
    // Floor gradient
    const hGrad = ctx.createLinearGradient(s.x, s.y, s.x + hall.w, s.y + hall.h);
    hGrad.addColorStop(0, '#10102a');
    hGrad.addColorStop(1, '#141430');
    ctx.fillStyle = hGrad;
    ctx.fillRect(s.x, s.y, hall.w, hall.h);
    // Floor tiles
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    const tileSize = 25;
    for (let gx = hall.x; gx < hall.x + hall.w; gx += tileSize) {
      const gs = worldToScreen(gx, hall.y);
      ctx.beginPath(); ctx.moveTo(gs.x, gs.y); ctx.lineTo(gs.x, gs.y + hall.h); ctx.stroke();
    }
    for (let gy = hall.y; gy < hall.y + hall.h; gy += tileSize) {
      const gs = worldToScreen(hall.x, gy);
      ctx.beginPath(); ctx.moveTo(gs.x, gs.y); ctx.lineTo(gs.x + hall.w, gs.y); ctx.stroke();
    }
    // Hallway running lights (small dots along edges)
    const isVertical = hall.h > hall.w;
    const lightCount = isVertical ? Math.floor(hall.h / 40) : Math.floor(hall.w / 40);
    for (let li = 0; li < lightCount; li++) {
      const pulse = 0.3 + Math.sin(time * 0.003 + li * 0.8) * 0.25;
      ctx.fillStyle = `rgba(80,140,255,${pulse})`;
      if (isVertical) {
        const lx = worldToScreen(hall.x + 4, hall.y + 20 + li * 40);
        ctx.beginPath(); ctx.arc(lx.x, lx.y, 1.5, 0, Math.PI * 2); ctx.fill();
        const rx = worldToScreen(hall.x + hall.w - 4, hall.y + 20 + li * 40);
        ctx.beginPath(); ctx.arc(rx.x, rx.y, 1.5, 0, Math.PI * 2); ctx.fill();
      } else {
        const ty = worldToScreen(hall.x + 20 + li * 40, hall.y + 4);
        ctx.beginPath(); ctx.arc(ty.x, ty.y, 1.5, 0, Math.PI * 2); ctx.fill();
        const by = worldToScreen(hall.x + 20 + li * 40, hall.y + hall.h - 4);
        ctx.beginPath(); ctx.arc(by.x, by.y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Border glow
    ctx.strokeStyle = 'rgba(60,80,120,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x, s.y, hall.w, hall.h);
  }

  // Draw rooms
  for (const room of MAP.rooms) {
    const s = worldToScreen(room.x, room.y);
    // Room floor gradient
    const rGrad = ctx.createLinearGradient(s.x, s.y, s.x + room.w, s.y + room.h);
    const baseColor = room.color || '#1e2a3a';
    rGrad.addColorStop(0, baseColor);
    rGrad.addColorStop(1, darkenColor(baseColor.startsWith('#') ? baseColor : '#1e2a3a', 0.85));
    ctx.fillStyle = rGrad;
    ctx.fillRect(s.x, s.y, room.w, room.h);

    // Alternating floor tiles
    const tileSize = 30;
    for (let tx = 0; tx < room.w; tx += tileSize) {
      for (let ty = 0; ty < room.h; ty += tileSize) {
        const checker = ((Math.floor(tx / tileSize) + Math.floor(ty / tileSize)) % 2 === 0);
        if (checker) {
          ctx.fillStyle = 'rgba(255,255,255,0.015)';
          ctx.fillRect(s.x + tx, s.y + ty, tileSize, tileSize);
        }
      }
    }
    // Tile grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let gx = room.x + tileSize; gx < room.x + room.w; gx += tileSize) {
      const gs = worldToScreen(gx, room.y);
      ctx.beginPath(); ctx.moveTo(gs.x, gs.y); ctx.lineTo(gs.x, gs.y + room.h); ctx.stroke();
    }
    for (let gy = room.y + tileSize; gy < room.y + room.h; gy += tileSize) {
      const gs = worldToScreen(room.x, gy);
      ctx.beginPath(); ctx.moveTo(gs.x, gs.y); ctx.lineTo(gs.x + room.w, gs.y); ctx.stroke();
    }

    // Wall border (double line for depth)
    ctx.strokeStyle = '#1a2a45';
    ctx.lineWidth = 4;
    ctx.strokeRect(s.x - 1, s.y - 1, room.w + 2, room.h + 2);
    ctx.strokeStyle = '#3a5a8a';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x, s.y, room.w, room.h);

    // Wall rivets
    for (let rx = room.x + 15; rx < room.x + room.w; rx += 30) {
      const rs = worldToScreen(rx, room.y);
      ctx.fillStyle = 'rgba(100,130,180,0.3)';
      ctx.beginPath(); ctx.arc(rs.x, rs.y, 1.5, 0, Math.PI * 2); ctx.fill();
      const rsb = worldToScreen(rx, room.y + room.h);
      ctx.beginPath(); ctx.arc(rsb.x, rsb.y, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // Room decorations
    drawRoomDecorations(room, s, time);

    // Room label (with glow)
    ctx.save();
    ctx.shadowColor = 'rgba(100,180,255,0.5)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = "bold 14px 'Orbitron', 'Segoe UI', Arial";
    ctx.textAlign = 'center';
    ctx.letterSpacing = '2px';
    ctx.fillText(room.name.toUpperCase(), s.x + room.w / 2, s.y + room.h / 2 + 4);
    ctx.restore();
  }

  // Ambient dust (floating in rooms)
  for (const d of ambientDust) {
    d.x += d.vx + Math.sin(time * 0.001 + d.drift) * 0.02;
    d.y += d.vy + Math.cos(time * 0.0008 + d.drift) * 0.015;
    if (d.x < 0) d.x = 2000; if (d.x > 2000) d.x = 0;
    if (d.y < 0) d.y = 1500; if (d.y > 1500) d.y = 0;
    const ds = worldToScreen(d.x, d.y);
    ctx.globalAlpha = d.alpha;
    ctx.fillStyle = '#aabbdd';
    ctx.beginPath(); ctx.arc(ds.x, ds.y, d.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRoomDecorations(room, s, time) {
  // Room-specific decorations
  switch (room.name) {
    case 'Cafeteria':
      // Tables
      for (let i = 0; i < 3; i++) {
        const tx = s.x + 40 + i * 90, ty = s.y + 60 + (i % 2) * 80;
        ctx.fillStyle = '#2a3040';
        ctx.beginPath();
        ctx.ellipse(tx, ty, 28, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a4a5a';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Chairs
        for (let c = 0; c < 4; c++) {
          const ca = (c / 4) * Math.PI * 2;
          ctx.fillStyle = '#1a2030';
          ctx.beginPath();
          ctx.arc(tx + Math.cos(ca) * 35, ty + Math.sin(ca) * 22, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Vending machine
      ctx.fillStyle = '#1a2535';
      ctx.fillRect(s.x + room.w - 35, s.y + 15, 25, 45);
      ctx.strokeStyle = '#3a5a7a';
      ctx.strokeRect(s.x + room.w - 35, s.y + 15, 25, 45);
      const vmPulse = 0.5 + Math.sin(time * 0.004) * 0.3;
      ctx.fillStyle = `rgba(50,200,100,${vmPulse})`;
      ctx.fillRect(s.x + room.w - 31, s.y + 20, 17, 8);
      break;

    case 'Electrical':
      // Breaker panels on walls
      for (let i = 0; i < 4; i++) {
        const px = s.x + 20 + i * 55, py = s.y + 15;
        ctx.fillStyle = '#252530';
        ctx.fillRect(px, py, 40, 50);
        ctx.strokeStyle = '#3a3a4a';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, 40, 50);
        // Switches
        for (let si = 0; si < 6; si++) {
          ctx.fillStyle = Math.random() > 0.5 ? '#44aa44' : '#aa4444';
          ctx.fillRect(px + 6 + (si % 3) * 12, py + 8 + Math.floor(si / 3) * 20, 6, 12);
        }
      }
      // Spark effect (flickering)
      if (Math.sin(time * 0.01) > 0.8) {
        const sx = s.x + 30 + Math.random() * 180, sy = s.y + 40 + Math.random() * 30;
        ctx.strokeStyle = `rgba(255,255,100,${0.5 + Math.random() * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (Math.random() - 0.5) * 10, sy + Math.random() * 8);
        ctx.lineTo(sx + (Math.random() - 0.5) * 12, sy + Math.random() * 15);
        ctx.stroke();
      }
      // Wire bundles
      const wireColors = ['#cc3333', '#3333cc', '#33cc33', '#cccc33'];
      for (let wi = 0; wi < 4; wi++) {
        ctx.strokeStyle = wireColors[wi];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x + 10, s.y + 90 + wi * 8);
        ctx.bezierCurveTo(s.x + 80, s.y + 85 + wi * 10, s.x + 150, s.y + 95 + wi * 6, s.x + room.w - 10, s.y + 90 + wi * 8);
        ctx.stroke();
      }
      break;

    case 'MedBay':
      // Medical bed
      ctx.fillStyle = '#2a3540';
      ctx.fillRect(s.x + 30, s.y + 50, 80, 40);
      ctx.strokeStyle = '#4a6a8a';
      ctx.strokeRect(s.x + 30, s.y + 50, 80, 40);
      ctx.fillStyle = '#1a4a4a';
      ctx.fillRect(s.x + 35, s.y + 55, 70, 30);
      // Heart monitor
      ctx.fillStyle = '#111';
      ctx.fillRect(s.x + 130, s.y + 30, 50, 35);
      ctx.strokeStyle = '#2a5a3a';
      ctx.strokeRect(s.x + 130, s.y + 30, 50, 35);
      // Heartbeat line
      ctx.strokeStyle = '#33ff66';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let hx = 0; hx < 44; hx++) {
        const hy = s.y + 48 + Math.sin((time * 0.005 + hx * 0.3)) * 6 * (hx % 10 < 3 ? 2.5 : 0.5);
        if (hx === 0) ctx.moveTo(s.x + 133 + hx, hy);
        else ctx.lineTo(s.x + 133 + hx, hy);
      }
      ctx.stroke();
      // Medical cross
      ctx.fillStyle = 'rgba(255,80,80,0.3)';
      ctx.fillRect(s.x + room.w - 40, s.y + 15, 6, 18);
      ctx.fillRect(s.x + room.w - 46, s.y + 21, 18, 6);
      break;

    case 'Weapons':
      // Targeting display
      const wcx = s.x + room.w / 2, wcy = s.y + room.h / 2 - 20;
      ctx.strokeStyle = `rgba(255,60,60,${0.3 + Math.sin(time * 0.003) * 0.15})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(wcx, wcy, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(wcx, wcy, 18, 0, Math.PI * 2); ctx.stroke();
      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(wcx - 35, wcy); ctx.lineTo(wcx + 35, wcy);
      ctx.moveTo(wcx, wcy - 35); ctx.lineTo(wcx, wcy + 35);
      ctx.stroke();
      // Rotating scan line
      const scanAngle = time * 0.002;
      ctx.strokeStyle = 'rgba(255,100,100,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wcx, wcy);
      ctx.lineTo(wcx + Math.cos(scanAngle) * 30, wcy + Math.sin(scanAngle) * 30);
      ctx.stroke();
      // Console
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(s.x + 20, s.y + room.h - 40, room.w - 40, 30);
      // Buttons
      for (let bi = 0; bi < 6; bi++) {
        ctx.fillStyle = ['#ff3333', '#33ff33', '#3333ff', '#ffff33', '#ff33ff', '#33ffff'][bi];
        ctx.globalAlpha = 0.5 + Math.sin(time * 0.004 + bi) * 0.2;
        ctx.beginPath(); ctx.arc(s.x + 40 + bi * 30, s.y + room.h - 25, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;

    case 'Security':
      // Monitor wall (3x2 grid)
      for (let mx = 0; mx < 3; mx++) {
        for (let my = 0; my < 2; my++) {
          const monX = s.x + 20 + mx * 70, monY = s.y + 20 + my * 65;
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(monX, monY, 55, 45);
          ctx.strokeStyle = '#2a2a3a';
          ctx.strokeRect(monX, monY, 55, 45);
          // Static / screen content
          ctx.fillStyle = `rgba(30,60,40,${0.4 + Math.sin(time * 0.002 + mx + my) * 0.2})`;
          ctx.fillRect(monX + 3, monY + 3, 49, 39);
          // Scanlines
          for (let sl = 0; sl < 10; sl++) {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(monX + 3, monY + 3 + sl * 4, 49, 1);
          }
        }
      }
      // Desk
      ctx.fillStyle = '#2a2a35';
      ctx.fillRect(s.x + 15, s.y + room.h - 35, room.w - 30, 20);
      break;

    case 'Navigation':
      // Star map display
      ctx.fillStyle = '#050510';
      ctx.fillRect(s.x + 30, s.y + 20, 190, 80);
      ctx.strokeStyle = '#2a3a5a';
      ctx.strokeRect(s.x + 30, s.y + 20, 190, 80);
      // Stars on display
      for (let si = 0; si < 20; si++) {
        const starPulse = 0.3 + Math.sin(time * 0.002 + si * 2) * 0.4;
        ctx.fillStyle = `rgba(200,220,255,${starPulse})`;
        ctx.beginPath();
        ctx.arc(s.x + 40 + (si * 37 % 170), s.y + 30 + (si * 23 % 60), 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Ship indicator (blinking)
      const shipBlink = Math.sin(time * 0.005) > 0 ? 0.8 : 0.2;
      ctx.fillStyle = `rgba(255,100,100,${shipBlink})`;
      ctx.beginPath(); ctx.arc(s.x + 125, s.y + 60, 3, 0, Math.PI * 2); ctx.fill();
      // Steering wheel
      ctx.strokeStyle = '#4a4a5a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x + room.w / 2, s.y + room.h - 50, 22, 0, Math.PI * 2);
      ctx.stroke();
      for (let sp = 0; sp < 4; sp++) {
        const a = sp * Math.PI / 2 + time * 0.0005;
        ctx.beginPath();
        ctx.moveTo(s.x + room.w / 2, s.y + room.h - 50);
        ctx.lineTo(s.x + room.w / 2 + Math.cos(a) * 22, s.y + room.h - 50 + Math.sin(a) * 22);
        ctx.stroke();
      }
      break;

    case 'O2':
      // Oxygen tanks
      for (let oi = 0; oi < 3; oi++) {
        const ox = s.x + 30 + oi * 50, oy = s.y + 30;
        ctx.fillStyle = '#2a4a5a';
        ctx.beginPath();
        ctx.moveTo(ox, oy + 50);
        ctx.lineTo(ox, oy + 10);
        ctx.arc(ox + 15, oy + 10, 15, Math.PI, 0);
        ctx.lineTo(ox + 30, oy + 50);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4a7a8a';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Pressure gauge
        const gauge = 0.5 + Math.sin(time * 0.001 + oi) * 0.3;
        ctx.fillStyle = `rgba(100,255,200,${gauge})`;
        ctx.beginPath(); ctx.arc(ox + 15, oy + 30, 4, 0, Math.PI * 2); ctx.fill();
      }
      // Plants
      for (let pi = 0; pi < 2; pi++) {
        const px = s.x + room.w - 60 + pi * 35, py = s.y + room.h - 50;
        // Pot
        ctx.fillStyle = '#5a3a2a';
        ctx.fillRect(px - 8, py, 16, 14);
        ctx.fillRect(px - 10, py - 2, 20, 4);
        // Leaves
        ctx.fillStyle = '#2a8a3a';
        ctx.beginPath(); ctx.arc(px, py - 10, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3aaa4a';
        ctx.beginPath(); ctx.arc(px - 4, py - 14, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 5, py - 12, 6, 0, Math.PI * 2); ctx.fill();
      }
      break;

    case 'Storage':
      // Crates
      for (let ci = 0; ci < 5; ci++) {
        const cx = s.x + 20 + (ci % 3) * 80, cy = s.y + 30 + Math.floor(ci / 3) * 70;
        ctx.fillStyle = '#2a2520';
        ctx.fillRect(cx, cy, 50, 40);
        ctx.strokeStyle = '#4a4030';
        ctx.strokeRect(cx, cy, 50, 40);
        // Cross strap
        ctx.strokeStyle = '#3a3525';
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(cx + 50, cy + 40);
        ctx.moveTo(cx + 50, cy); ctx.lineTo(cx, cy + 40);
        ctx.stroke();
      }
      // Shelving
      ctx.fillStyle = '#1a1a25';
      ctx.fillRect(s.x + room.w - 45, s.y + 15, 35, room.h - 30);
      for (let sh = 0; sh < 5; sh++) {
        ctx.strokeStyle = '#3a3a4a';
        ctx.beginPath();
        ctx.moveTo(s.x + room.w - 45, s.y + 15 + sh * 30);
        ctx.lineTo(s.x + room.w - 10, s.y + 15 + sh * 30);
        ctx.stroke();
      }
      break;

    case 'Upper Engine':
    case 'Lower Engine':
      // Engine core (pulsing)
      const ecx = s.x + room.w / 2, ecy = s.y + room.h / 2;
      const ePulse = 0.4 + Math.sin(time * 0.004) * 0.3;
      // Outer ring
      ctx.strokeStyle = `rgba(100,180,255,${ePulse * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ecx, ecy, 35, 0, Math.PI * 2); ctx.stroke();
      // Inner ring
      ctx.strokeStyle = `rgba(100,200,255,${ePulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ecx, ecy, 22, 0, Math.PI * 2); ctx.stroke();
      // Core
      ctx.fillStyle = `rgba(80,180,255,${ePulse})`;
      ctx.beginPath(); ctx.arc(ecx, ecy, 10, 0, Math.PI * 2); ctx.fill();
      // Core glow
      ctx.save();
      ctx.shadowColor = `rgba(80,180,255,${ePulse})`;
      ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(ecx, ecy, 8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Pipes from engine
      ctx.strokeStyle = '#3a5a5a';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ecx - 35, ecy); ctx.lineTo(s.x + 8, ecy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ecx + 35, ecy); ctx.lineTo(s.x + room.w - 8, ecy); ctx.stroke();
      ctx.lineCap = 'butt';
      break;

    case 'Shields':
      // Shield grid display
      const sgx = s.x + room.w / 2, sgy = s.y + room.h / 2 - 10;
      ctx.strokeStyle = `rgba(100,100,255,${0.3 + Math.sin(time * 0.003) * 0.15})`;
      ctx.lineWidth = 1;
      // Hexagonal pattern
      for (let hi = 0; hi < 7; hi++) {
        const ha = (hi / 7) * Math.PI * 2;
        const hx = sgx + Math.cos(ha) * 25;
        const hy = sgy + Math.sin(ha) * 25;
        ctx.beginPath(); ctx.arc(hx, hy, 12, 0, Math.PI * 2); ctx.stroke();
        // Some shields "active"
        if (hi % 2 === 0) {
          ctx.fillStyle = `rgba(80,80,255,${0.15 + Math.sin(time * 0.002 + hi) * 0.1})`;
          ctx.fill();
        }
      }
      ctx.beginPath(); ctx.arc(sgx, sgy, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(120,120,255,${0.2 + Math.sin(time * 0.003) * 0.1})`;
      ctx.fill();
      break;
  }

  // Room ceiling lights (all rooms)
  const lightX = s.x + room.w / 2;
  const lightY = s.y + 8;
  const lPulse = 0.15 + Math.sin(time * 0.002 + room.x * 0.01) * 0.08;
  const lightGrad = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 60);
  lightGrad.addColorStop(0, `rgba(200,220,255,${lPulse})`);
  lightGrad.addColorStop(1, 'rgba(200,220,255,0)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(s.x, s.y, room.w, Math.min(70, room.h));
}

function drawEmergencyButton() {
  const s = worldToScreen(MAP.emergencyButton.x, MAP.emergencyButton.y);
  const pulse = Math.sin(Date.now() / 500) * 0.15 + 0.85;
  const glow = Math.sin(Date.now() / 300) * 0.3 + 0.5;

  // Outer glow
  ctx.save();
  ctx.shadowColor = '#ff3333';
  ctx.shadowBlur = 15 * glow;

  // Button pedestal
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(s.x, s.y + 2, 20, 0, Math.PI * 2);
  ctx.fill();

  // Button base
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(s.x, s.y, 18, 0, Math.PI * 2);
  ctx.fill();

  // Yellow ring
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 16, 0, Math.PI * 2);
  ctx.stroke();

  // Red button with gradient
  const btnGrad = ctx.createRadialGradient(s.x - 3, s.y - 3, 0, s.x, s.y, 14);
  btnGrad.addColorStop(0, `rgba(255, 100, 100, ${pulse})`);
  btnGrad.addColorStop(1, `rgba(200, 30, 30, ${pulse})`);
  ctx.fillStyle = btnGrad;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 13, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(s.x - 3, s.y - 4, 5, 3.5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = "bold 9px 'Exo 2', Arial";
  ctx.textAlign = 'center';
  ctx.fillText('EMERGENCY', s.x, s.y + 28);
}

function drawTaskLocations() {
  const me = players.find(p => p.id === myId);
  if (!me) return;

  for (const task of myTasks) {
    if (task.completed) continue;
    const s = worldToScreen(task.x, task.y);
    const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;

    // Glow
    ctx.globalAlpha = pulse * 0.3;
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Dot
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Arrow pointing down
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 22);
    ctx.lineTo(s.x - 5, s.y - 30);
    ctx.lineTo(s.x + 5, s.y - 30);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}

function drawBodies() {
  for (const body of bodies) {
    const s = worldToScreen(body.x, body.y);

    // Bottom half
    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(s.x - 5, s.y + 2, PLAYER_RADIUS * 0.7, 0, Math.PI);
    ctx.fill();

    // Top half offset
    ctx.beginPath();
    ctx.arc(s.x + 7, s.y - 2, PLAYER_RADIUS * 0.65, Math.PI, Math.PI * 2);
    ctx.fill();

    // Bone
    ctx.fillStyle = '#ddd';
    ctx.fillRect(s.x - 1, s.y - 6, 3, 10);

    // X eyes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x + 8, s.y - 8);
    ctx.lineTo(s.x + 14, s.y - 2);
    ctx.moveTo(s.x + 14, s.y - 8);
    ctx.lineTo(s.x + 8, s.y - 2);
    ctx.stroke();

    // Hat on dead body
    if (body.hat && body.hat !== 'none') {
      drawHat(ctx, s.x, s.y - 2, body.hat, 0.7);
    }
  }
}

function drawPlayers() {
  const me = players.find(p => p.id === myId);

  for (const player of players) {
    if (!player.alive && player.id !== myId) {
      if (me && me.alive) continue;
    }

    const s = worldToScreen(player.x, player.y);
    const isGhost = !player.alive;
    const anim = getAnimState(player.id);
    const bob = anim.bobOffset;
    const facing = anim.facingRight ? 1 : -1;

    ctx.globalAlpha = isGhost ? 0.4 : 1;

    ctx.save();
    ctx.translate(s.x, s.y + bob);

    // Shadow (scales with bob)
    if (!isGhost) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, PLAYER_RADIUS + 2 - bob, PLAYER_RADIUS * 0.8 + Math.abs(bob) * 0.3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Squash/stretch
    ctx.save();
    ctx.scale(anim.stretch, anim.squash);

    // Legs with walking animation
    ctx.fillStyle = darkenColor(player.color.startsWith('#') ? player.color : '#c51111', 0.85);
    const legSwing = anim.moving ? Math.sin(anim.walkPhase) * 5 : 0;
    // Left leg
    ctx.fillRect(-12 + legSwing, PLAYER_RADIUS - 9, 10, 11);
    // Right leg
    ctx.fillRect(2 - legSwing, PLAYER_RADIUS - 9, 10, 11);
    // Leg shoes
    ctx.fillStyle = darkenColor(player.color.startsWith('#') ? player.color : '#c51111', 0.55);
    ctx.fillRect(-12 + legSwing, PLAYER_RADIUS + 1, 10, 3);
    ctx.fillRect(2 - legSwing, PLAYER_RADIUS + 1, 10, 3);

    // Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, -4, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    // Body outline
    ctx.strokeStyle = darkenColor(player.color.startsWith('#') ? player.color : '#c51111', 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -4, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Backpack
    const bpX = -facing * (PLAYER_RADIUS + 5);
    ctx.fillStyle = darkenColor(player.color.startsWith('#') ? player.color : '#c51111', 0.65);
    ctx.fillRect(bpX, -10, 7 * facing, 16);
    ctx.strokeStyle = darkenColor(player.color.startsWith('#') ? player.color : '#c51111', 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(bpX, -10, 7 * facing, 16);

    // Visor
    ctx.fillStyle = '#7ec8e3';
    ctx.beginPath();
    ctx.ellipse(6 * facing, -6, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Visor shine
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(4 * facing, -8, 4, 3, -0.3 * facing, 0, Math.PI * 2);
    ctx.fill();
    // Visor outline
    ctx.strokeStyle = 'rgba(100,170,200,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(6 * facing, -6, 9, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore(); // end squash/stretch

    // Outfit
    if (player.outfit && player.outfit !== 'none') {
      drawOutfit(ctx, 0, -4, player.outfit, player.color, 1);
    }

    // Hat
    if (player.hat && player.hat !== 'none') {
      drawHat(ctx, 0, -4, player.hat, 1);
    }

    ctx.restore(); // end translate

    // Name (with shadow for readability)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = isGhost ? 'rgba(255,255,255,0.5)' : '#fff';
    ctx.font = "bold 12px 'Exo 2', 'Segoe UI', Arial";
    ctx.textAlign = 'center';
    ctx.fillText(player.name, s.x, s.y + bob - PLAYER_RADIUS - 14);
    ctx.restore();

    // Impostor name color
    if (myRole === 'impostor' && player.role === 'impostor' && player.id !== myId && player.alive) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,0,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff4444';
      ctx.font = "bold 12px 'Exo 2', 'Segoe UI', Arial";
      ctx.textAlign = 'center';
      ctx.fillText(player.name, s.x, s.y + bob - PLAYER_RADIUS - 14);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
  }
}

function drawVisionMask() {
  const me = players.find(p => p.id === myId);
  if (!me) return;

  const visionMult = myRole === 'impostor' ? (settings.impostorVision || 1.5) : (settings.crewmateVision || 1.0);
  const radius = VISION_RADIUS_BASE * visionMult;
  const s = worldToScreen(me.x, me.y);

  // Dark overlay with circular cutout
  ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.arc(s.x, s.y, radius, 0, Math.PI * 2, true);
  ctx.fill();

  // Soft gradient edge
  const gradient = ctx.createRadialGradient(s.x, s.y, radius * 0.75, s.x, s.y, radius);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.88)');
  ctx.beginPath();
  ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function drawKillFlashes() {
  const now = Date.now();
  killFlashes = killFlashes.filter(f => now - f.time < 500);

  for (const flash of killFlashes) {
    const s = worldToScreen(flash.x, flash.y);
    const alpha = 1 - (now - flash.time) / 500;
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 40 + (now - flash.time) * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHUD() {
  // Task bar
  const barWidth = 200;
  const barHeight = 22;
  const barX = canvas.width / 2 - barWidth / 2;
  const barY = 15;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(barX, barY, barWidth * taskBar, barHeight);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = '#fff';
  ctx.font = "11px 'Exo 2', Arial";
  ctx.textAlign = 'center';
  ctx.fillText(`Tasks: ${Math.round(taskBar * 100)}%`, barX + barWidth / 2, barY + 15);

  // Role indicator
  ctx.font = "bold 18px 'Orbitron', 'Segoe UI', Arial";
  ctx.textAlign = 'left';
  if (myRole === 'impostor') {
    ctx.save();
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff4444';
    ctx.fillText('IMPOSTOR', 20, 32);
    ctx.restore();
  } else {
    ctx.save();
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#44ff44';
    ctx.fillText('CREWMATE', 20, 32);
    ctx.restore();
  }

  // Kill cooldown (impostor)
  const me = players.find(p => p.id === myId);
  if (me && myRole === 'impostor' && me.alive) {
    if (me.killCooldown > 0) {
      ctx.fillStyle = '#aaa';
      ctx.font = '14px Arial';
      ctx.fillText(`Kill: ${Math.ceil(me.killCooldown)}s`, 20, 54);
    }
  }

  // Ghost indicator
  if (me && !me.alive) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GHOST', canvas.width / 2, 60);
  }

  // Task list (right side)
  if (me && myTasks.length > 0) {
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    const startY = 80;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(canvas.width - 210, startY - 20, 200, myTasks.length * 20 + 30);
    ctx.fillStyle = '#ffdd00';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('Tasks:', canvas.width - 200, startY);
    ctx.font = '11px Arial';
    myTasks.forEach((task, i) => {
      ctx.fillStyle = task.completed ? '#44aa44' : '#ccc';
      const prefix = task.completed ? '✓ ' : '○ ';
      ctx.fillText(prefix + task.type + ' (' + task.roomName + ')', canvas.width - 200, startY + 20 + i * 18);
    });
  }
}

function drawMinimap() {
  const mmW = 160;
  const mmH = 120;
  const mmX = 15;
  const mmY = canvas.height - mmH - 15;
  const scaleX = mmW / MAP.width;
  const scaleY = mmH / MAP.height;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(mmX, mmY, mmW, mmH);

  // Rooms
  for (const room of MAP.rooms) {
    ctx.fillStyle = 'rgba(40,50,70,0.8)';
    ctx.fillRect(mmX + room.x * scaleX, mmY + room.y * scaleY, room.w * scaleX, room.h * scaleY);
  }
  for (const hall of MAP.hallways) {
    ctx.fillStyle = 'rgba(30,30,50,0.8)';
    ctx.fillRect(mmX + hall.x * scaleX, mmY + hall.y * scaleY, hall.w * scaleX, hall.h * scaleY);
  }

  // Players (only show self and impostors if impostor)
  const me = players.find(p => p.id === myId);
  if (me) {
    // Self
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(mmX + me.x * scaleX, mmY + me.y * scaleY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bodies on minimap
  for (const body of bodies) {
    ctx.fillStyle = body.color;
    ctx.fillRect(mmX + body.x * scaleX - 2, mmY + body.y * scaleY - 2, 4, 4);
  }

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(mmX, mmY, mmW, mmH);
}

function drawActionButtons() {
  const me = players.find(p => p.id === myId);
  if (!me || !me.alive) { window._actionButtons = []; return; }

  const buttons = [];

  // Kill (impostor, near crewmate, cooldown 0)
  if (myRole === 'impostor') {
    let hasTarget = false;
    for (const p of players) {
      if (p.id !== myId && p.alive && p.role !== 'impostor' && distance(me, p) < KILL_RANGE) {
        hasTarget = true;
        break;
      }
    }
    if (hasTarget && (!me.killCooldown || me.killCooldown <= 0)) {
      buttons.push({ label: 'KILL', color: '#ff0000', action: 'kill', key: 'Q' });
    }
  }

  // Report
  let nearBody = false;
  for (const body of bodies) {
    if (distance(me, body) < REPORT_RANGE) { nearBody = true; break; }
  }
  if (nearBody) {
    buttons.push({ label: 'REPORT', color: '#ffaa00', action: 'report', key: 'R' });
  }

  // Use task
  const nearTask = findNearestTask(me);
  if (nearTask) {
    buttons.push({ label: 'USE', color: '#00aaff', action: 'use', key: 'E' });
  }

  // Emergency
  if (distance(me, MAP.emergencyButton) < EMERGENCY_RANGE && !nearTask) {
    buttons.push({ label: 'EMERGENCY', color: '#ff4444', action: 'emergency', key: 'E' });
  }

  // Draw bottom-right
  const btnSize = 56;
  buttons.forEach((btn, i) => {
    const bx = canvas.width - 70 - i * 70;
    const by = canvas.height - 70;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(bx + 2, by + 2, btnSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Button
    ctx.fillStyle = btn.color;
    ctx.beginPath();
    ctx.arc(bx, by, btnSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, btnSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(btn.label, bx, by + 2);
    ctx.font = '9px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`[${btn.key}]`, bx, by + 14);

    btn.hitbox = { x: bx - btnSize / 2, y: by - btnSize / 2, w: btnSize, h: btnSize };
  });

  window._actionButtons = buttons;
}

function drawRoleFlash() {
  const elapsed = Date.now() - roleFlash.startTime;
  const duration = 3000;
  if (elapsed > duration) {
    roleFlash.active = false;
    return;
  }

  let alpha = 1;
  if (elapsed < 500) alpha = elapsed / 500;
  else if (elapsed > duration - 500) alpha = (duration - elapsed) / 500;

  ctx.fillStyle = `rgba(0,0,0,${alpha * 0.85})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';

  if (roleFlash.role === 'impostor') {
    ctx.save();
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 30;
    ctx.font = "bold 60px 'Orbitron', sans-serif";
    ctx.fillStyle = `rgba(255, 68, 68, ${alpha})`;
    ctx.fillText('IMPOSTOR', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('IMPOSTOR', canvas.width / 2, canvas.height / 2 - 10);
    ctx.restore();
    ctx.font = "20px 'Exo 2', Arial";
    ctx.fillStyle = `rgba(255, 150, 150, ${alpha})`;
    if (otherImpostors.length > 0) {
      ctx.fillText('Fellow impostor: ' + otherImpostors.map(i => i.name).join(', '), canvas.width / 2, canvas.height / 2 + 30);
    }
  } else {
    ctx.save();
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 30;
    ctx.font = "bold 60px 'Orbitron', sans-serif";
    ctx.fillStyle = `rgba(68, 255, 68, ${alpha})`;
    ctx.fillText('CREWMATE', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('CREWMATE', canvas.width / 2, canvas.height / 2 - 10);
    ctx.restore();
    ctx.font = "20px 'Exo 2', Arial";
    ctx.fillStyle = `rgba(150, 255, 150, ${alpha})`;
    ctx.fillText('Complete your tasks. Find the impostor.', canvas.width / 2, canvas.height / 2 + 30);
  }
}

// ============================================
// TASK MINI-GAMES
// ============================================
let taskAnimFrame = null;

function openTask(task) {
  activeTask = { ...task, state: {} };
  taskTitle.textContent = getTaskName(task.type);
  taskScreen.classList.add('active');

  switch (task.type) {
    case 'wires': initWiresTask(); break;
    case 'swipeCard': initSwipeTask(); break;
    case 'asteroids': initAsteroidsTask(); break;
    case 'download': initDownloadTask(); break;
    case 'fuel': initFuelTask(); break;
    case 'calibrate': initCalibrateTask(); break;
  }
}

function getTaskName(type) {
  const names = {
    wires: 'Fix Wiring',
    swipeCard: 'Swipe Card',
    asteroids: 'Clear Asteroids',
    download: 'Download Data',
    fuel: 'Fuel Engines',
    calibrate: 'Calibrate Distributor',
  };
  return names[type] || type;
}

function closeTask(completed) {
  if (completed && activeTask) {
    socket.emit('completeTask', { taskId: activeTask.id });
    const t = myTasks.find(t => t.id === activeTask.id);
    if (t) t.completed = true;
  }
  activeTask = null;
  taskScreen.classList.remove('active');
  if (taskAnimFrame) cancelAnimationFrame(taskAnimFrame);
  taskAnimFrame = null;
  // Remove task-specific listeners
  taskCanvas.onmousedown = null;
  taskCanvas.onmousemove = null;
  taskCanvas.onmouseup = null;
  taskCanvas.onclick = null;
}

taskClose.addEventListener('click', () => closeTask(false));

// --- WIRES TASK ---
function initWiresTask() {
  const colors = ['#ff0000', '#0066ff', '#ffff00', '#ff00ff'];
  const rightOrder = [...colors].sort(() => Math.random() - 0.5);
  const state = activeTask.state;
  state.colors = colors;
  state.rightOrder = rightOrder;
  state.connections = []; // [{from, to}]
  state.dragging = null; // index
  state.mouseX = 0;
  state.mouseY = 0;

  function renderWires() {
    taskCtx.fillStyle = '#1a1a2e';
    taskCtx.fillRect(0, 0, 350, 250);

    const leftX = 40;
    const rightX = 310;
    const gap = 50;
    const startY = 35;

    // Draw connected wires
    for (const conn of state.connections) {
      taskCtx.strokeStyle = colors[conn.from];
      taskCtx.lineWidth = 4;
      taskCtx.beginPath();
      taskCtx.moveTo(leftX, startY + conn.from * gap);
      taskCtx.lineTo(rightX, startY + conn.to * gap);
      taskCtx.stroke();
    }

    // Draw dragging wire
    if (state.dragging !== null) {
      taskCtx.strokeStyle = colors[state.dragging];
      taskCtx.lineWidth = 4;
      taskCtx.beginPath();
      taskCtx.moveTo(leftX, startY + state.dragging * gap);
      taskCtx.lineTo(state.mouseX, state.mouseY);
      taskCtx.stroke();
    }

    // Left endpoints
    for (let i = 0; i < 4; i++) {
      taskCtx.fillStyle = colors[i];
      taskCtx.fillRect(10, startY + i * gap - 10, 30, 20);
      taskCtx.fillStyle = '#111';
      taskCtx.fillRect(30, startY + i * gap - 3, 12, 6);
    }

    // Right endpoints
    for (let i = 0; i < 4; i++) {
      taskCtx.fillStyle = rightOrder[i];
      taskCtx.fillRect(310, startY + i * gap - 10, 30, 20);
      taskCtx.fillStyle = '#111';
      taskCtx.fillRect(308, startY + i * gap - 3, 12, 6);
    }

    if (state.connections.length < 4) {
      taskAnimFrame = requestAnimationFrame(renderWires);
    }
  }

  taskCanvas.onmousedown = (e) => {
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width);
    const my = (e.clientY - rect.top) * (250 / rect.height);
    const startY = 35;
    const gap = 50;

    if (mx < 60) {
      for (let i = 0; i < 4; i++) {
        if (Math.abs(my - (startY + i * gap)) < 20) {
          if (!state.connections.find(c => c.from === i)) {
            state.dragging = i;
          }
        }
      }
    }
  };

  taskCanvas.onmousemove = (e) => {
    const rect = taskCanvas.getBoundingClientRect();
    state.mouseX = (e.clientX - rect.left) * (350 / rect.width);
    state.mouseY = (e.clientY - rect.top) * (250 / rect.height);
  };

  taskCanvas.onmouseup = (e) => {
    if (state.dragging === null) return;
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width);
    const my = (e.clientY - rect.top) * (250 / rect.height);
    const startY = 35;
    const gap = 50;

    if (mx > 290) {
      for (let i = 0; i < 4; i++) {
        if (Math.abs(my - (startY + i * gap)) < 20) {
          // Check if this right endpoint matches the color
          if (rightOrder[i] === colors[state.dragging]) {
            if (!state.connections.find(c => c.to === i)) {
              state.connections.push({ from: state.dragging, to: i });
            }
          }
        }
      }
    }

    state.dragging = null;

    if (state.connections.length === 4) {
      setTimeout(() => closeTask(true), 300);
    }
  };

  renderWires();
}

// --- SWIPE CARD TASK ---
function initSwipeTask() {
  const state = activeTask.state;
  state.cardX = 30;
  state.dragging = false;
  state.speed = 0;
  state.lastX = 0;
  state.lastTime = 0;
  state.result = null;

  function renderSwipe() {
    taskCtx.fillStyle = '#1a1a2e';
    taskCtx.fillRect(0, 0, 350, 250);

    // Card reader
    taskCtx.fillStyle = '#333';
    taskCtx.fillRect(40, 80, 270, 90);
    taskCtx.fillStyle = '#222';
    taskCtx.fillRect(50, 90, 250, 70);

    // Slot
    taskCtx.fillStyle = '#111';
    taskCtx.fillRect(50, 115, 250, 20);

    // Green arrow
    taskCtx.fillStyle = '#44aa44';
    ctx.font = '20px Arial';
    taskCtx.textAlign = 'center';
    taskCtx.fillText('→ SWIPE →', 175, 108);

    // Card
    taskCtx.fillStyle = '#3366cc';
    taskCtx.fillRect(state.cardX, 100, 60, 50);
    taskCtx.fillStyle = '#ffdd00';
    taskCtx.fillRect(state.cardX + 5, 110, 20, 15);
    taskCtx.strokeStyle = '#ddd';
    taskCtx.lineWidth = 1;
    taskCtx.beginPath();
    taskCtx.moveTo(state.cardX + 5, 135);
    taskCtx.lineTo(state.cardX + 55, 135);
    taskCtx.stroke();

    // Result
    if (state.result) {
      taskCtx.font = 'bold 16px Arial';
      taskCtx.textAlign = 'center';
      if (state.result === 'success') {
        taskCtx.fillStyle = '#44ff44';
        taskCtx.fillText('Accepted!', 175, 200);
      } else if (state.result === 'fast') {
        taskCtx.fillStyle = '#ff4444';
        taskCtx.fillText('Too fast. Try again.', 175, 200);
      } else if (state.result === 'slow') {
        taskCtx.fillStyle = '#ff4444';
        taskCtx.fillText('Too slow. Try again.', 175, 200);
      }
    } else {
      taskCtx.font = '12px Arial';
      taskCtx.textAlign = 'center';
      taskCtx.fillStyle = '#888';
      taskCtx.fillText('Drag card from left to right', 175, 200);
    }

    if (!state.done) taskAnimFrame = requestAnimationFrame(renderSwipe);
  }

  taskCanvas.onmousedown = (e) => {
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width);
    const my = (e.clientY - rect.top) * (250 / rect.height);
    if (mx >= state.cardX && mx <= state.cardX + 60 && my >= 100 && my <= 150) {
      state.dragging = true;
      state.lastX = mx;
      state.lastTime = Date.now();
      state.result = null;
    }
  };

  taskCanvas.onmousemove = (e) => {
    if (!state.dragging) return;
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width);
    state.cardX = Math.max(30, Math.min(260, mx - 30));
    const now = Date.now();
    const dt = now - state.lastTime;
    if (dt > 0) {
      state.speed = (mx - state.lastX) / dt;
    }
    state.lastX = mx;
    state.lastTime = now;
  };

  taskCanvas.onmouseup = () => {
    if (!state.dragging) return;
    state.dragging = false;

    if (state.cardX > 240) {
      if (state.speed > 0.3 && state.speed < 1.2) {
        state.result = 'success';
        state.done = true;
        setTimeout(() => closeTask(true), 500);
      } else if (state.speed >= 1.2) {
        state.result = 'fast';
        state.cardX = 30;
      } else {
        state.result = 'slow';
        state.cardX = 30;
      }
    } else {
      state.cardX = 30;
    }
  };

  renderSwipe();
}

// --- ASTEROIDS TASK ---
function initAsteroidsTask() {
  const state = activeTask.state;
  state.asteroids = [];
  state.destroyed = 0;
  state.total = 10;
  state.spawnTimer = 0;

  function spawnAsteroid() {
    state.asteroids.push({
      x: -20,
      y: 20 + Math.random() * 210,
      size: 10 + Math.random() * 15,
      speed: 0.5 + Math.random() * 1,
      alive: true,
    });
  }

  for (let i = 0; i < 3; i++) spawnAsteroid();

  function renderAsteroids() {
    taskCtx.fillStyle = '#000011';
    taskCtx.fillRect(0, 0, 350, 250);

    // Stars
    for (let i = 0; i < 30; i++) {
      taskCtx.fillStyle = 'rgba(255,255,255,0.3)';
      taskCtx.fillRect((i * 47) % 350, (i * 31) % 250, 1, 1);
    }

    // Crosshair in center area
    taskCtx.strokeStyle = 'rgba(0,255,0,0.3)';
    taskCtx.lineWidth = 1;
    taskCtx.beginPath();
    taskCtx.moveTo(175, 0);
    taskCtx.lineTo(175, 250);
    taskCtx.moveTo(0, 125);
    taskCtx.lineTo(350, 125);
    taskCtx.stroke();

    state.spawnTimer++;
    if (state.spawnTimer > 30 && state.asteroids.filter(a => a.alive).length < 4 && state.destroyed + state.asteroids.filter(a => a.alive).length < state.total) {
      spawnAsteroid();
      state.spawnTimer = 0;
    }

    for (const ast of state.asteroids) {
      if (!ast.alive) continue;
      ast.x += ast.speed;
      if (ast.x > 370) { ast.x = -20; ast.y = 20 + Math.random() * 210; }

      // Draw asteroid
      taskCtx.fillStyle = '#665544';
      taskCtx.beginPath();
      taskCtx.arc(ast.x, ast.y, ast.size, 0, Math.PI * 2);
      taskCtx.fill();
      taskCtx.fillStyle = '#554433';
      taskCtx.beginPath();
      taskCtx.arc(ast.x - 3, ast.y + 2, ast.size * 0.4, 0, Math.PI * 2);
      taskCtx.fill();
    }

    // Counter
    taskCtx.fillStyle = '#fff';
    taskCtx.font = '14px Arial';
    taskCtx.textAlign = 'left';
    taskCtx.fillText(`Destroyed: ${state.destroyed}/${state.total}`, 10, 20);

    if (state.destroyed < state.total) {
      taskAnimFrame = requestAnimationFrame(renderAsteroids);
    }
  }

  taskCanvas.onclick = (e) => {
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width);
    const my = (e.clientY - rect.top) * (250 / rect.height);

    for (const ast of state.asteroids) {
      if (!ast.alive) continue;
      const d = Math.sqrt((mx - ast.x) ** 2 + (my - ast.y) ** 2);
      if (d < ast.size + 5) {
        ast.alive = false;
        state.destroyed++;
        if (state.destroyed >= state.total) {
          setTimeout(() => closeTask(true), 300);
        }
        break;
      }
    }
  };

  renderAsteroids();
}

// --- DOWNLOAD TASK ---
function initDownloadTask() {
  const state = activeTask.state;
  state.progress = 0;
  state.downloading = false;
  state.done = false;

  function renderDownload() {
    taskCtx.fillStyle = '#1a1a2e';
    taskCtx.fillRect(0, 0, 350, 250);

    // Screen
    taskCtx.fillStyle = '#111';
    taskCtx.fillRect(50, 40, 250, 150);
    taskCtx.strokeStyle = '#333';
    taskCtx.lineWidth = 2;
    taskCtx.strokeRect(50, 40, 250, 150);

    if (!state.downloading && !state.done) {
      // Download button
      taskCtx.fillStyle = '#2266aa';
      taskCtx.fillRect(125, 100, 100, 40);
      taskCtx.fillStyle = '#fff';
      taskCtx.font = 'bold 14px Arial';
      taskCtx.textAlign = 'center';
      taskCtx.fillText('Download', 175, 125);
    } else {
      // Progress bar
      taskCtx.fillStyle = '#222';
      taskCtx.fillRect(70, 100, 210, 30);
      taskCtx.fillStyle = '#44aaff';
      taskCtx.fillRect(70, 100, 210 * state.progress, 30);
      taskCtx.strokeStyle = '#444';
      taskCtx.strokeRect(70, 100, 210, 30);
      taskCtx.fillStyle = '#fff';
      taskCtx.font = '12px Arial';
      taskCtx.textAlign = 'center';
      taskCtx.fillText(`${Math.round(state.progress * 100)}%`, 175, 120);

      // Folder icon
      taskCtx.fillStyle = '#ffaa00';
      taskCtx.fillRect(155, 60, 40, 30);
      taskCtx.fillRect(150, 65, 50, 25);

      if (state.downloading) {
        state.progress += 0.008;
        if (state.progress >= 1) {
          state.progress = 1;
          state.downloading = false;
          state.done = true;
          setTimeout(() => closeTask(true), 500);
        }
      }
    }

    if (!state.done) taskAnimFrame = requestAnimationFrame(renderDownload);
  }

  taskCanvas.onclick = (e) => {
    if (state.downloading || state.done) return;
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width);
    const my = (e.clientY - rect.top) * (250 / rect.height);
    if (mx >= 125 && mx <= 225 && my >= 100 && my <= 140) {
      state.downloading = true;
    }
  };

  renderDownload();
}

// --- FUEL TASK ---
function initFuelTask() {
  const state = activeTask.state;
  state.fuelLevel = 0;
  state.targetLevel = 0.7 + Math.random() * 0.2; // 70-90%
  state.holding = false;
  state.done = false;

  function renderFuel() {
    taskCtx.fillStyle = '#1a1a2e';
    taskCtx.fillRect(0, 0, 350, 250);

    // Tank
    const tankX = 100;
    const tankY = 30;
    const tankW = 80;
    const tankH = 180;

    taskCtx.fillStyle = '#222';
    taskCtx.fillRect(tankX, tankY, tankW, tankH);
    taskCtx.strokeStyle = '#555';
    taskCtx.lineWidth = 2;
    taskCtx.strokeRect(tankX, tankY, tankW, tankH);

    // Fuel level
    const fuelH = tankH * state.fuelLevel;
    taskCtx.fillStyle = '#ffaa00';
    taskCtx.fillRect(tankX + 2, tankY + tankH - fuelH, tankW - 4, fuelH);

    // Target line
    const targetY = tankY + tankH - tankH * state.targetLevel;
    taskCtx.strokeStyle = '#ff0000';
    taskCtx.lineWidth = 2;
    taskCtx.setLineDash([5, 5]);
    taskCtx.beginPath();
    taskCtx.moveTo(tankX - 10, targetY);
    taskCtx.lineTo(tankX + tankW + 10, targetY);
    taskCtx.stroke();
    taskCtx.setLineDash([]);

    // Target label
    taskCtx.fillStyle = '#ff4444';
    taskCtx.font = '11px Arial';
    taskCtx.textAlign = 'left';
    taskCtx.fillText('TARGET', tankX + tankW + 15, targetY + 4);

    // Button
    const btnX = 220;
    const btnY = 100;
    taskCtx.fillStyle = state.holding ? '#ff6600' : '#cc4400';
    taskCtx.fillRect(btnX, btnY, 80, 60);
    taskCtx.strokeStyle = '#ff8800';
    taskCtx.lineWidth = 2;
    taskCtx.strokeRect(btnX, btnY, 80, 60);
    taskCtx.fillStyle = '#fff';
    taskCtx.font = 'bold 12px Arial';
    taskCtx.textAlign = 'center';
    taskCtx.fillText('HOLD TO', btnX + 40, btnY + 25);
    taskCtx.fillText('FILL', btnX + 40, btnY + 42);

    // Instruction
    taskCtx.fillStyle = '#888';
    taskCtx.font = '11px Arial';
    taskCtx.textAlign = 'center';
    taskCtx.fillText('Fill to the red line, then release', 175, 235);

    if (state.holding && !state.done) {
      state.fuelLevel = Math.min(1, state.fuelLevel + 0.01);
    }

    if (!state.done) taskAnimFrame = requestAnimationFrame(renderFuel);
  }

  taskCanvas.onmousedown = (e) => {
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width);
    const my = (e.clientY - rect.top) * (250 / rect.height);
    if (mx >= 220 && mx <= 300 && my >= 100 && my <= 160) {
      state.holding = true;
    }
  };

  taskCanvas.onmouseup = () => {
    if (!state.holding) return;
    state.holding = false;
    // Check if fuel is near target
    if (Math.abs(state.fuelLevel - state.targetLevel) < 0.05) {
      state.done = true;
      setTimeout(() => closeTask(true), 300);
    } else {
      state.fuelLevel = 0; // Reset
    }
  };

  renderFuel();
}

// --- CALIBRATE TASK ---
function initCalibrateTask() {
  const state = activeTask.state;
  state.angle = 0;
  state.speed = 0.03;
  state.targetAngle = Math.PI * 0.5; // target zone center
  state.targetWidth = 0.4; // radians
  state.hits = 0;
  state.total = 3;
  state.done = false;
  state.flash = 0;

  function renderCalibrate() {
    taskCtx.fillStyle = '#1a1a2e';
    taskCtx.fillRect(0, 0, 350, 250);

    const cx = 175;
    const cy = 125;
    const r = 80;

    // Ring background
    taskCtx.strokeStyle = '#333';
    taskCtx.lineWidth = 15;
    taskCtx.beginPath();
    taskCtx.arc(cx, cy, r, 0, Math.PI * 2);
    taskCtx.stroke();

    // Target zone
    const tStart = state.targetAngle - state.targetWidth / 2;
    const tEnd = state.targetAngle + state.targetWidth / 2;
    taskCtx.strokeStyle = '#44ff44';
    taskCtx.lineWidth = 15;
    taskCtx.beginPath();
    taskCtx.arc(cx, cy, r, tStart, tEnd);
    taskCtx.stroke();

    // Spinning needle
    state.angle += state.speed;
    if (state.angle > Math.PI * 2) state.angle -= Math.PI * 2;

    const needleX = cx + Math.cos(state.angle) * (r + 10);
    const needleY = cy + Math.sin(state.angle) * (r + 10);
    taskCtx.strokeStyle = '#ff4444';
    taskCtx.lineWidth = 3;
    taskCtx.beginPath();
    taskCtx.moveTo(cx, cy);
    taskCtx.lineTo(needleX, needleY);
    taskCtx.stroke();

    // Center dot
    taskCtx.fillStyle = '#fff';
    taskCtx.beginPath();
    taskCtx.arc(cx, cy, 5, 0, Math.PI * 2);
    taskCtx.fill();

    // Progress
    taskCtx.fillStyle = '#fff';
    taskCtx.font = '14px Arial';
    taskCtx.textAlign = 'center';
    taskCtx.fillText(`${state.hits}/${state.total}`, cx, cy + r + 35);
    taskCtx.font = '11px Arial';
    taskCtx.fillStyle = '#888';
    taskCtx.fillText('Click when needle is in green zone', cx, cy + r + 55);

    // Flash on hit/miss
    if (state.flash > 0) {
      state.flash--;
      taskCtx.fillStyle = state.lastHit ? 'rgba(0,255,0,0.15)' : 'rgba(255,0,0,0.15)';
      taskCtx.fillRect(0, 0, 350, 250);
    }

    if (!state.done) taskAnimFrame = requestAnimationFrame(renderCalibrate);
  }

  taskCanvas.onclick = () => {
    if (state.done) return;

    // Check if needle is in target zone
    let angle = state.angle % (Math.PI * 2);
    let diff = Math.abs(angle - state.targetAngle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;

    if (diff < state.targetWidth / 2) {
      state.hits++;
      state.flash = 10;
      state.lastHit = true;
      state.speed += 0.01; // Speed up
      state.targetAngle = Math.random() * Math.PI * 2; // New target
      if (state.hits >= state.total) {
        state.done = true;
        setTimeout(() => closeTask(true), 300);
      }
    } else {
      state.flash = 10;
      state.lastHit = false;
      state.hits = Math.max(0, state.hits - 1);
    }
  };

  renderCalibrate();
}

// ============================================
// MEETING UI
// ============================================
function buildMeetingUI(meetingPlayers) {
  voteGrid.innerHTML = '';
  votedFor = null;
  voters = new Set();

  meetingPlayers.forEach(p => {
    const card = document.createElement('div');
    card.className = 'vote-card' + (p.alive ? '' : ' dead');
    card.dataset.playerId = p.id;
    card.innerHTML = `
      <span class="player-color" style="background:${p.color}"></span>
      <span>${escapeHtml(p.name)}</span>
      <span class="check">✓</span>
    `;
    if (p.alive && p.id !== myId) {
      card.addEventListener('click', () => castVote(p.id, card));
    }
    voteGrid.appendChild(card);
  });
}

function castVote(targetId, card) {
  if (votedFor !== null) return;
  const me = players.find(p => p.id === myId);
  if (!me || !me.alive) return;
  if (gamePhase !== 'voting') return;

  votedFor = targetId;
  socket.emit('castVote', { targetId });

  // Highlight
  document.querySelectorAll('.vote-card').forEach(c => c.classList.add('disabled'));
  card.classList.add('selected');
}

skipBtn.addEventListener('click', () => {
  if (votedFor !== null) return;
  const me = players.find(p => p.id === myId);
  if (!me || !me.alive) return;
  if (gamePhase !== 'voting') return;

  votedFor = 'skip';
  socket.emit('castVote', { targetId: 'skip' });
  skipBtn.disabled = true;
  document.querySelectorAll('.vote-card').forEach(c => c.classList.add('disabled'));
});

function startMeetingTimer(duration) {
  meetingTimerEnd = Date.now() + duration * 1000;
  updateMeetingTimer();
}

function updateMeetingTimer() {
  const remaining = Math.max(0, Math.ceil((meetingTimerEnd - Date.now()) / 1000));
  meetingTimer.textContent = `${remaining}s`;
  if (remaining > 0) {
    setTimeout(updateMeetingTimer, 200);
  }
}

// ============================================
// SOCKET EVENT HANDLERS
// ============================================
socket.on('connect', () => {
  myId = socket.id;
});

socket.on('roomCreated', ({ code, player, settings: s }) => {
  roomCode = code;
  settings = s;
  isHost = socket.id;
  gamePhase = 'lobby';
  myHatIndex = 0;
  myOutfitIndex = 0;
  hatLabel.textContent = HAT_NAMES[HATS[0]];
  outfitLabel.textContent = OUTFIT_NAMES[OUTFITS[0]];
  showScreen(lobbyScreen);
  updateLobbyUI([player]);
});

socket.on('roomJoined', ({ code, players: pList, settings: s, host }) => {
  roomCode = code;
  settings = s;
  isHost = host;
  gamePhase = 'lobby';
  myHatIndex = 0;
  myOutfitIndex = 0;
  hatLabel.textContent = HAT_NAMES[HATS[0]];
  outfitLabel.textContent = OUTFIT_NAMES[OUTFITS[0]];
  showScreen(lobbyScreen);
  updateLobbyUI(pList);
});

socket.on('joinError', ({ message }) => {
  menuError.textContent = message;
});

socket.on('playerJoined', (player) => {
  lobbyPlayers_data.push(player);
  // Just re-query from server -- for simplicity, add new player
  const li = document.createElement('li');
  li.innerHTML = `<span class="player-color" style="background:${player.color}"></span>
    <span class="player-name">${escapeHtml(player.name)}</span>`;
  lobbyPlayers.appendChild(li);
  lobbyCount.textContent = `${lobbyPlayers.children.length} / 10 players`;
  if (socket.id === isHost) {
    startBtn.disabled = lobbyPlayers.children.length < 3;
  }
});

socket.on('skinChanged', ({ playerId, hat, outfit }) => {
  const p = lobbyPlayers_data.find(pl => pl.id === playerId);
  if (p) {
    p.hat = hat;
    p.outfit = outfit;
  }
});

socket.on('playerLeft', ({ playerId }) => {
  // Remove from lobby list
  const items = lobbyPlayers.querySelectorAll('li');
  lobbyPlayers_data = lobbyPlayers_data.filter(p => p.id !== playerId);
  // We can't easily identify by id in the DOM, so just refresh count
  lobbyCount.textContent = `Players in lobby`;
});

socket.on('hostChanged', ({ hostId }) => {
  isHost = hostId;
  if (gamePhase === 'lobby') {
    if (socket.id === isHost) {
      startBtn.style.display = 'inline-block';
      lobbyWait.style.display = 'none';
    } else {
      startBtn.style.display = 'none';
      lobbyWait.style.display = 'block';
    }
  }
});

socket.on('gameStarted', ({ role, tasks, players: pList, otherImpostors: otherImp, settings: s }) => {
  myRole = role;
  myTasks = tasks;
  players = pList;
  settings = s;
  otherImpostors = otherImp || [];
  bodies = [];
  taskBar = 0;
  gamePhase = 'playing';
  showScreen(null);

  // Also store role on player objects for impostor identification
  if (myRole === 'impostor') {
    for (const p of players) {
      if (otherImpostors.find(i => i.id === p.id)) {
        p.role = 'impostor';
      }
    }
    const me = players.find(p => p.id === myId);
    if (me) me.role = 'impostor';
  }

  // Show role flash
  roleFlash = { active: true, startTime: Date.now(), role: myRole };
});

socket.on('gameState', ({ players: pList, bodies: bList, taskBar: tb }) => {
  // Update positions but keep local role info
  for (const serverP of pList) {
    const existing = players.find(p => p.id === serverP.id);
    if (existing) {
      // Don't overwrite own position (client prediction)
      if (serverP.id !== myId) {
        existing.x = serverP.x;
        existing.y = serverP.y;
      }
      existing.alive = serverP.alive;
      existing.name = serverP.name;
      existing.color = serverP.color;
      existing.hat = serverP.hat;
      existing.outfit = serverP.outfit;
      if (serverP.killCooldown !== undefined) existing.killCooldown = serverP.killCooldown;
    } else {
      players.push(serverP);
    }
  }
  // Remove disconnected players
  players = players.filter(p => pList.find(sp => sp.id === p.id));
  bodies = bList;
  taskBar = tb;
});

socket.on('playerKilled', ({ victimId, body }) => {
  const victim = players.find(p => p.id === victimId);
  if (victim) {
    victim.alive = false;
    killFlashes.push({ x: body.x, y: body.y, time: Date.now() });
    spawnParticle(body.x, body.y, 'kill');
    screenShake.trauma = Math.min(1, screenShake.trauma + 0.6);
  }
  if (victimId === myId) {
    screenShake.trauma = 1;
  }
});

socket.on('meetingStarted', ({ callerName, reportedBody, players: meetingPlayers, phase, duration }) => {
  gamePhase = 'meeting';

  if (reportedBody) {
    meetingHeader.textContent = `${callerName} reported a dead body!`;
    meetingHeader.style.color = '#ffaa00';
  } else {
    meetingHeader.textContent = `${callerName} called an Emergency Meeting!`;
    meetingHeader.style.color = '#ff4444';
  }

  meetingPhaseLabel.textContent = 'Discussion phase - talk it out!';
  skipBtn.style.display = 'none';
  skipBtn.disabled = false;

  buildMeetingUI(meetingPlayers);
  showScreen(meetingScreen);
  startMeetingTimer(duration);

  // Disable voting during discussion
  document.querySelectorAll('.vote-card').forEach(c => c.classList.add('disabled'));
});

socket.on('votingPhase', ({ duration }) => {
  gamePhase = 'voting';
  meetingPhaseLabel.textContent = 'Vote now!';
  skipBtn.style.display = 'inline-block';
  startMeetingTimer(duration);

  const me = players.find(p => p.id === myId);
  if (me && me.alive) {
    document.querySelectorAll('.vote-card:not(.dead)').forEach(c => {
      if (c.dataset.playerId !== myId) {
        c.classList.remove('disabled');
      }
    });
  }
});

socket.on('voteUpdate', ({ voterId }) => {
  voters.add(voterId);
  const card = document.querySelector(`.vote-card[data-player-id="${voterId}"]`);
  if (card) {
    const check = card.querySelector('.check');
    if (check) check.classList.add('visible');
  }
});

socket.on('votingResults', ({ votes, ejected, ejectedName, ejectedColor, ejectedRole }) => {
  gamePhase = 'results';
  showScreen(resultsScreen);

  if (ejected === 'skip') {
    resultText.textContent = 'No one was ejected.';
    resultText.style.color = '#aaa';
    resultRole.textContent = '(Skipped)';
    resultRole.style.color = '#888';
  } else {
    resultText.innerHTML = `<span style="color:${ejectedColor}">${escapeHtml(ejectedName)}</span> was ejected.`;
    if (ejectedRole === 'impostor') {
      resultRole.textContent = `${ejectedName} was an Impostor.`;
      resultRole.style.color = '#ff4444';
    } else {
      resultRole.textContent = `${ejectedName} was not an Impostor.`;
      resultRole.style.color = '#44ff44';
    }
  }
});

socket.on('resumeGame', () => {
  gamePhase = 'playing';
  showScreen(null);
});

socket.on('taskUpdate', ({ taskBar: tb }) => {
  taskBar = tb;
});

socket.on('gameOver', ({ winner, reason, roles }) => {
  gamePhase = 'gameover';
  showScreen(gameoverScreen);

  gameoverPanel.className = 'gameover-panel ' + winner;

  if (winner === 'crewmates') {
    winTitle.textContent = 'CREWMATES WIN';
    winTitle.style.color = '#44ff44';
  } else {
    winTitle.textContent = 'IMPOSTORS WIN';
    winTitle.style.color = '#ff4444';
  }
  winReason.textContent = reason;

  roleList.innerHTML = '';
  for (const [id, info] of Object.entries(roles)) {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="player-color" style="background:${info.color}"></span>
      <span>${escapeHtml(info.name)}</span>
      <span class="role-tag ${info.role}">${info.role.toUpperCase()}</span>
      ${!info.alive ? '<span class="dead-marker">(dead)</span>' : ''}
    `;
    roleList.appendChild(li);
  }

  if (socket.id === isHost) {
    lobbyBtn.style.display = 'inline-block';
  } else {
    lobbyBtn.style.display = 'none';
  }
});

socket.on('returnedToLobby', ({ players: pList, settings: s, host }) => {
  gamePhase = 'lobby';
  settings = s;
  isHost = host;
  myRole = null;
  myTasks = [];
  bodies = [];
  taskBar = 0;
  players = [];
  killFlashes = [];
  roleFlash.active = false;
  // Restore skin indices from server data
  const me = pList.find(p => p.id === socket.id);
  if (me) {
    myHatIndex = HATS.indexOf(me.hat) >= 0 ? HATS.indexOf(me.hat) : 0;
    myOutfitIndex = OUTFITS.indexOf(me.outfit) >= 0 ? OUTFITS.indexOf(me.outfit) : 0;
    hatLabel.textContent = HAT_NAMES[HATS[myHatIndex]];
    outfitLabel.textContent = OUTFIT_NAMES[OUTFITS[myOutfitIndex]];
  }
  showScreen(lobbyScreen);
  updateLobbyUI(pList);
});

// ============================================
// UI EVENT HANDLERS
// ============================================
createBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) { menuError.textContent = 'Enter a name'; return; }
  menuError.textContent = '';
  socket.emit('createRoom', { name });
});

joinBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const code = codeInput.value.trim().toUpperCase();
  if (!name) { menuError.textContent = 'Enter a name'; return; }
  if (!code) { menuError.textContent = 'Enter a room code'; return; }
  menuError.textContent = '';
  socket.emit('joinRoom', { code, name });
});

startBtn.addEventListener('click', () => {
  socket.emit('startGame');
});

lobbyBtn.addEventListener('click', () => {
  socket.emit('returnToLobby');
});

// Enter key support
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (codeInput.value.trim()) joinBtn.click();
    else createBtn.click();
  }
});
codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinBtn.click();
});

// ============================================
// GAME LOOP
// ============================================
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (gamePhase === 'playing' && !activeTask) {
    handleInput();
    updateCamera();
  } else if (gamePhase === 'playing' || gamePhase === 'meeting' || gamePhase === 'voting' || gamePhase === 'results') {
    updateCamera();
  }

  updateParticles();
  updatePlayerAnims();
  render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// ============================================
// MOBILE TOUCH CONTROLS
// ============================================
const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const mobileJoystick = document.getElementById('mobile-joystick');
const joystickThumb = document.getElementById('joystick-thumb');
const mobileActions = document.getElementById('mobile-actions');

let joystickActive = false;
let joystickOrigin = { x: 0, y: 0 };
let joystickDir = { x: 0, y: 0 };

function showMobileControls(show) {
  if (!isMobile) return;
  mobileJoystick.style.display = show ? 'block' : 'none';
  mobileActions.style.display = show ? 'flex' : 'none';
}

function updateMobileActionButtons() {
  if (!isMobile) return;
  const me = players.find(p => p.id === myId);
  if (!me || !me.alive || gamePhase !== 'playing') {
    mobileActions.innerHTML = '';
    return;
  }

  const btns = [];

  // Kill button (impostor)
  if (myRole === 'impostor') {
    let hasTarget = false;
    for (const p of players) {
      if (p.id !== myId && p.alive && p.role !== 'impostor' && distance(me, p) < KILL_RANGE) {
        hasTarget = true; break;
      }
    }
    if (hasTarget && (!me.killCooldown || me.killCooldown <= 0)) {
      btns.push({ label: 'KILL', bg: '#cc0000', action: () => socket.emit('doKill') });
    }
  }

  // Report
  let nearBody = false;
  for (const body of bodies) {
    if (distance(me, body) < REPORT_RANGE) { nearBody = true; break; }
  }
  if (nearBody) {
    btns.push({ label: 'REPORT', bg: '#cc8800', action: () => socket.emit('reportBody') });
  }

  // Use / Emergency
  const nearTask = findNearestTask(me);
  if (nearTask) {
    btns.push({ label: 'USE', bg: '#0088cc', action: () => openTask(nearTask) });
  } else if (distance(me, MAP.emergencyButton) < EMERGENCY_RANGE) {
    btns.push({ label: 'EMERGENCY', bg: '#cc2222', action: () => socket.emit('callEmergency') });
  }

  // Only rebuild if changed
  const currentLabels = [...mobileActions.children].map(c => c.textContent).join(',');
  const newLabels = btns.map(b => b.label).join(',');
  if (currentLabels === newLabels) return;

  mobileActions.innerHTML = '';
  mobileActions.style.flexDirection = 'column';
  mobileActions.style.alignItems = 'center';
  for (const btn of btns) {
    const el = document.createElement('div');
    el.className = 'mobile-action-btn';
    el.style.background = btn.bg;
    el.textContent = btn.label;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); btn.action(); });
    mobileActions.appendChild(el);
  }
}

if (isMobile) {
  const joystickBase = mobileJoystick.querySelector('.joystick-base');
  const baseRadius = 65;
  const thumbRadius = 25;
  const maxDist = 40;

  mobileJoystick.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    const rect = joystickBase.getBoundingClientRect();
    joystickOrigin.x = rect.left + baseRadius;
    joystickOrigin.y = rect.top + baseRadius;
    handleJoystickMove(e);
  }, { passive: false });

  mobileJoystick.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (joystickActive) handleJoystickMove(e);
  }, { passive: false });

  mobileJoystick.addEventListener('touchend', (e) => {
    e.preventDefault();
    joystickActive = false;
    joystickDir = { x: 0, y: 0 };
    joystickThumb.style.left = (baseRadius - thumbRadius) + 'px';
    joystickThumb.style.top = (baseRadius - thumbRadius) + 'px';
    keys['w'] = false; keys['a'] = false; keys['s'] = false; keys['d'] = false;
  }, { passive: false });

  function handleJoystickMove(e) {
    const touch = e.touches[0];
    let dx = touch.clientX - joystickOrigin.x;
    let dy = touch.clientY - joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }
    joystickThumb.style.left = (baseRadius - thumbRadius + dx) + 'px';
    joystickThumb.style.top = (baseRadius - thumbRadius + dy) + 'px';

    const deadzone = 8;
    if (dist < deadzone) {
      joystickDir = { x: 0, y: 0 };
      keys['w'] = false; keys['a'] = false; keys['s'] = false; keys['d'] = false;
    } else {
      joystickDir = { x: dx / maxDist, y: dy / maxDist };
      keys['w'] = dy < -deadzone;
      keys['s'] = dy > deadzone;
      keys['a'] = dx < -deadzone;
      keys['d'] = dx > deadzone;
    }
  }

  // Show/hide mobile controls based on game phase
  const _origShowScreen = showScreen;
  showScreen = function(screen) {
    _origShowScreen(screen);
    showMobileControls(gamePhase === 'playing' && !screen);
  };

  // Update mobile action buttons periodically
  setInterval(updateMobileActionButtons, 200);
}

// ============================================
// PROCEDURAL SOUND EFFECTS
// ============================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    switch (type) {
      case 'kill':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
        break;
      case 'meeting':
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.1);
        osc.frequency.setValueAtTime(1000, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
        break;
      case 'vote':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(700, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'task':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1000, now + 0.08);
        osc.frequency.setValueAtTime(1200, now + 0.16);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now); osc.stop(now + 0.25);
        break;
      case 'eject':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.6);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
        break;
      case 'start':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(500, now + 0.1);
        osc.frequency.setValueAtTime(600, now + 0.2);
        osc.frequency.setValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
        break;
      case 'win':
        osc.type = 'triangle';
        [523, 659, 784, 1047].forEach((freq, i) => {
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
        });
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.8);
        osc.start(now); osc.stop(now + 0.8);
        break;
      case 'lose':
        osc.type = 'sawtooth';
        [400, 350, 300, 200].forEach((freq, i) => {
          osc.frequency.setValueAtTime(freq, now + i * 0.2);
        });
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 1);
        osc.start(now); osc.stop(now + 1);
        break;
    }
  } catch (e) { /* audio not supported */ }
}

// Hook sounds into existing socket events
const _origOnKilled = socket.listeners('playerKilled')[0];
socket.off('playerKilled');
socket.on('playerKilled', (data) => {
  _origOnKilled(data);
  playSound('kill');
});

const _origOnMeeting = socket.listeners('meetingStarted')[0];
socket.off('meetingStarted');
socket.on('meetingStarted', (data) => {
  _origOnMeeting(data);
  playSound('meeting');
});

const _origOnGameStarted = socket.listeners('gameStarted')[0];
socket.off('gameStarted');
socket.on('gameStarted', (data) => {
  _origOnGameStarted(data);
  playSound('start');
});

const _origOnVotingResults = socket.listeners('votingResults')[0];
socket.off('votingResults');
socket.on('votingResults', (data) => {
  _origOnVotingResults(data);
  if (data.ejected !== 'skip') playSound('eject');
});

const _origOnGameOver = socket.listeners('gameOver')[0];
socket.off('gameOver');
socket.on('gameOver', (data) => {
  _origOnGameOver(data);
  const _me = players.find(p => p.id === myId);
  if (_me) {
    const iWon = (data.winner === 'crewmates' && _me.role !== 'impostor') ||
                 (data.winner === 'impostors' && _me.role === 'impostor');
    playSound(iWon ? 'win' : 'lose');
  }
});

// Sound on task complete
const _origCloseTask = closeTask;
closeTask = function(completed) {
  if (completed) playSound('task');
  _origCloseTask(completed);
};
