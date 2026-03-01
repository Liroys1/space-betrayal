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

const MAP_ALPHA = {
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
    { name: 'Kitchen',      x: 1150, y: 1200, w: 280, h: 220, color: '#2a2a1e' },
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
    { x: 1230, y: 1120, w: 80, h: 110 }, // Shields <-> Kitchen
  ],
  vents: [
    { a: { x: 480, y: 1050 }, b: { x: 480, y: 750 } },   // Electrical <-> Security
    { a: { x: 850, y: 400 },  b: { x: 480, y: 430 } },   // Cafeteria <-> MedBay
    { a: { x: 900, y: 1320 }, b: { x: 1290, y: 1310 } },  // Navigation <-> Kitchen
  ],
  emergencyButton: { x: 900, y: 425 },
  spawnPoint: { x: 900, y: 425 },
  doors: [
    { id: 0, roomName: 'Electrical', x: 630, y: 1020, w: 12, h: 60 },
    { id: 1, roomName: 'MedBay',     x: 630, y: 420,  w: 12, h: 60 },
    { id: 2, roomName: 'Security',   x: 630, y: 720,  w: 12, h: 60 },
    { id: 3, roomName: 'O2',         x: 1150, y: 720, w: 12, h: 60 },
    { id: 4, roomName: 'Navigation', x: 920, y: 1250, w: 60, h: 12 },
    { id: 5, roomName: 'Shields',    x: 1150, y: 1020,w: 12, h: 60 },
  ],
  cameras: [
    { id: 0, name: 'Cafeteria',  x: 900,  y: 425  },
    { id: 1, name: 'MedBay',     x: 500,  y: 450  },
    { id: 2, name: 'Navigation', x: 900,  y: 1340 },
    { id: 3, name: 'Electrical', x: 500,  y: 1050 },
  ],
  securityConsole: { x: 450, y: 750 },
  adminConsole: { x: 850, y: 750 },
  sabotageFixStations: {
    lights: [{ x: 480, y: 1050, roomName: 'Electrical' }],
    o2: [
      { x: 1220, y: 730, roomName: 'O2' },
      { x: 800, y: 380, roomName: 'Cafeteria' },
    ],
    reactor: [
      { x: 880, y: 100, roomName: 'Upper Engine' },
      { x: 880, y: 1050, roomName: 'Lower Engine' },
    ],
  },
};

const MAP_BETA = {
  width: 2000,
  height: 1500,
  rooms: [
    { name: 'Central Hub',    x: 750,  y: 380,  w: 300, h: 260, color: '#1a2a3e' },
    { name: 'Bridge',         x: 750,  y: 80,   w: 280, h: 200, color: '#1e3040' },
    { name: 'Reactor Core',   x: 250,  y: 100,  w: 220, h: 180, color: '#2e1e1e' },
    { name: 'Observatory',    x: 1350, y: 100,  w: 220, h: 180, color: '#1a1a3e' },
    { name: 'Laboratory',     x: 300,  y: 400,  w: 260, h: 220, color: '#1e2e2e' },
    { name: 'Armory',         x: 1300, y: 400,  w: 260, h: 220, color: '#3a1e1e' },
    { name: 'Communications', x: 250,  y: 750,  w: 260, h: 220, color: '#1e2a3e' },
    { name: 'Cargo Bay',      x: 750,  y: 750,  w: 300, h: 220, color: '#1e1e2e' },
    { name: 'Life Support',   x: 1350, y: 750,  w: 260, h: 220, color: '#1e3a2a' },
    { name: 'Greenhouse',     x: 300,  y: 1100, w: 260, h: 220, color: '#1e3a1e' },
    { name: 'Airlock',        x: 750,  y: 1100, w: 300, h: 200, color: '#2a2a3a' },
  ],
  hallways: [
    { x: 470,  y: 150, w: 280, h: 60 },
    { x: 1030, y: 150, w: 320, h: 60 },
    { x: 350,  y: 280, w: 60, h: 120 },
    { x: 870,  y: 280, w: 60, h: 100 },
    { x: 1420, y: 280, w: 60, h: 120 },
    { x: 560,  y: 480, w: 190, h: 60 },
    { x: 1050, y: 480, w: 250, h: 60 },
    { x: 380,  y: 620, w: 60, h: 130 },
    { x: 870,  y: 640, w: 60, h: 110 },
    { x: 1430, y: 620, w: 60, h: 130 },
    { x: 510,  y: 830, w: 240, h: 60 },
    { x: 1050, y: 830, w: 300, h: 60 },
    { x: 380,  y: 970, w: 60, h: 130 },
    { x: 870,  y: 970, w: 60, h: 130 },
  ],
  vents: [
    { a: { x: 380, y: 500 }, b: { x: 380, y: 850 } },
    { a: { x: 1430, y: 500 }, b: { x: 1430, y: 850 } },
    { a: { x: 880, y: 170 }, b: { x: 880, y: 1190 } },
  ],
  emergencyButton: { x: 900, y: 510 },
  spawnPoint: { x: 900, y: 510 },
  doors: [
    { id: 0, roomName: 'Laboratory',     x: 560, y: 500, w: 12, h: 60 },
    { id: 1, roomName: 'Armory',         x: 1300, y: 500, w: 12, h: 60 },
    { id: 2, roomName: 'Communications', x: 510, y: 850, w: 12, h: 60 },
    { id: 3, roomName: 'Life Support',   x: 1350, y: 850, w: 12, h: 60 },
    { id: 4, roomName: 'Airlock',        x: 890, y: 1100, w: 60, h: 12 },
    { id: 5, roomName: 'Greenhouse',     x: 400, y: 1100, w: 60, h: 12 },
  ],
  cameras: [
    { id: 0, name: 'Central Hub', x: 900,  y: 510  },
    { id: 1, name: 'Bridge',      x: 890,  y: 180  },
    { id: 2, name: 'Cargo Bay',   x: 900,  y: 860  },
    { id: 3, name: 'Greenhouse',  x: 430,  y: 1210 },
  ],
  securityConsole: { x: 350, y: 850 },
  adminConsole: { x: 900, y: 850 },
  sabotageFixStations: {
    lights: [{ x: 380, y: 500, roomName: 'Laboratory' }],
    o2: [
      { x: 1450, y: 850, roomName: 'Life Support' },
      { x: 880, y: 150, roomName: 'Bridge' },
    ],
    reactor: [
      { x: 340, y: 180, roomName: 'Reactor Core' },
      { x: 430, y: 1200, roomName: 'Greenhouse' },
    ],
  },
};

let MAP = MAP_ALPHA;

// ============================================
// STATE
// ============================================
let myId = null;
let myRole = null;
let mySpecialRole = null;
let engineerVentsLeft = 3;
let vitalsData = null;
let vitalsShowUntil = 0;
let watchingCameras = false;
let cameraFeed = null;
let cameraWatcherActive = false;
let viewingAdminTable = false;
let adminTableData = null;
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
let myPetIndex = 0;
let myColor = '#c51111';
// Pet positions (follows player with delay via lerp)
const petPositions = new Map();
let lobbyPlayers_data = [];
let meetingTimerEnd = 0;
let otherImpostors = [];
let activeSabotage = null; // { type, timeLeft, fixProgress }
let sabotageMenuOpen = false;
let doorStates = []; // [{ id, closed }]
let floatingMessages = []; // { playerId, text, emoji, startTime, duration }
let currentGameMode = 'classic'; // classic, hideseek, speedrun, infection
let speedrunStartTime = 0; // timestamp when speedrun started
let headStartEnd = 0; // timestamp when hide&seek head start ends

const EMOTES = ['\u{1F44B}', '\u{1F44D}', '\u2753', '\u2757', '\u2764\uFE0F', '\u{1F480}'];
const QUICK_MESSAGES_KEYS = ['followMe', 'iSawSomething', 'where', 'trustMe', 'sus', 'iWasIn', 'help', 'letsGo'];
function getQuickMessages() {
  return QUICK_MESSAGES_KEYS.map(k => typeof t === 'function' ? t(k) : k);
}
const QUICK_MESSAGES = ['Follow me', 'I saw something', 'Where?', 'Trust me', 'Sus!', 'I was in...', 'Help!', "Let's go"];
let killFlashes = [];
let roleFlash = { active: false, timer: 0, role: '' };
let avatarCache = new Map(); // playerId -> HTMLImageElement
let myAvatarData = null; // base64 string or null

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
const avatarInput = document.getElementById('avatar-input');
const avatarUploadBtn = document.getElementById('avatar-upload-btn');
const avatarRemoveBtn = document.getElementById('avatar-remove-btn');
const avatarLabel = document.getElementById('avatar-label');
const colorPicker = document.getElementById('color-picker');

const meetingHeader = document.getElementById('meeting-header');
const meetingTimer = document.getElementById('meeting-timer');
const meetingPhaseLabel = document.getElementById('meeting-phase-label');
const voteGrid = document.getElementById('vote-grid');
const skipBtn = document.getElementById('skip-btn');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

const resultText = document.getElementById('result-text');
const resultRole = document.getElementById('result-role');

const gameoverPanel = document.getElementById('gameover-panel');
const winTitle = document.getElementById('win-title');
const winReason = document.getElementById('win-reason');
const roleList = document.getElementById('role-list');
const lobbyBtn = document.getElementById('lobby-btn');
const leaveBtn = document.getElementById('leave-btn');
const gameoverWait = document.getElementById('gameover-wait');

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
  lobbyCount.textContent = typeof t === 'function' ? t('players10')(playerList.length) : `${playerList.length} / 10 players`;
  buildColorPicker(playerList.map(p => p.color));

  const settingsPanel = document.getElementById('settings-panel');
  if (socket.id === isHost) {
    startBtn.style.display = 'inline-block';
    startBtn.disabled = playerList.length < 3;
    lobbyWait.style.display = 'none';
    if (settingsPanel) settingsPanel.style.display = 'block';
  } else {
    startBtn.style.display = 'none';
    lobbyWait.style.display = 'block';
    if (settingsPanel) settingsPanel.style.display = 'none';
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

  // Visor (enlarged for avatar)
  const avatarImg = avatarCache.get(socket.id);
  if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
    c.save();
    c.beginPath();
    c.ellipse(cx + 5 * s, cy - 5 * s, 12 * s, 10 * s, 0, 0, Math.PI * 2);
    c.clip();
    c.drawImage(avatarImg, cx + 5 * s - 12 * s, cy - 5 * s - 10 * s, 24 * s, 20 * s);
    c.restore();
    c.strokeStyle = 'rgba(100,170,200,0.6)';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(cx + 5 * s, cy - 5 * s, 12 * s, 10 * s, 0, 0, Math.PI * 2);
    c.stroke();
  } else {
    c.fillStyle = '#7ec8e3';
    c.beginPath();
    c.ellipse(cx + 6 * s, cy - 6 * s, 9 * s, 7 * s, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.beginPath();
    c.ellipse(cx + 4 * s, cy - 8 * s, 4 * s, 3 * s, -0.3, 0, Math.PI * 2);
    c.fill();
  }

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

  // Pet preview (drawn to the right of character)
  const petId = PETS[myPetIndex];
  if (petId !== 'none') {
    c.save();
    c.translate(cx + 35, cy + R - 5);
    drawPetSprite(c, petId, myColor, true);
    c.restore();
  }
}

function updateHatLabel() {
  const hatId = HATS[myHatIndex];
  let label = typeof tHat === 'function' ? tHat(hatId) : HAT_NAMES[hatId];
  // Show seasonal badge
  for (const [season, hats] of Object.entries(SEASONAL_HATS)) {
    if (hats.includes(hatId)) {
      const seasonNames = { halloween: 'Halloween', christmas: 'Christmas', spring: 'Spring', summer: 'Summer' };
      label += ` [${seasonNames[season]}]`;
      break;
    }
  }
  hatLabel.textContent = label;
}
hatPrev.addEventListener('click', () => {
  myHatIndex = (myHatIndex - 1 + HATS.length) % HATS.length;
  updateHatLabel();
  drawSkinPreview();
  socket.emit('changeSkin', { hat: HATS[myHatIndex], outfit: OUTFITS[myOutfitIndex], pet: PETS[myPetIndex] });
});
hatNext.addEventListener('click', () => {
  myHatIndex = (myHatIndex + 1) % HATS.length;
  updateHatLabel();
  drawSkinPreview();
  socket.emit('changeSkin', { hat: HATS[myHatIndex], outfit: OUTFITS[myOutfitIndex], pet: PETS[myPetIndex] });
});
outfitPrev.addEventListener('click', () => {
  myOutfitIndex = (myOutfitIndex - 1 + OUTFITS.length) % OUTFITS.length;
  outfitLabel.textContent = typeof tOutfit === 'function' ? tOutfit(OUTFITS[myOutfitIndex]) : OUTFIT_NAMES[OUTFITS[myOutfitIndex]];
  drawSkinPreview();
  socket.emit('changeSkin', { hat: HATS[myHatIndex], outfit: OUTFITS[myOutfitIndex], pet: PETS[myPetIndex] });
});
outfitNext.addEventListener('click', () => {
  myOutfitIndex = (myOutfitIndex + 1) % OUTFITS.length;
  outfitLabel.textContent = typeof tOutfit === 'function' ? tOutfit(OUTFITS[myOutfitIndex]) : OUTFIT_NAMES[OUTFITS[myOutfitIndex]];
  drawSkinPreview();
  socket.emit('changeSkin', { hat: HATS[myHatIndex], outfit: OUTFITS[myOutfitIndex], pet: PETS[myPetIndex] });
});

// --- PET SELECTION ---
const petPrev = document.getElementById('pet-prev');
const petNext = document.getElementById('pet-next');
const petLabel = document.getElementById('pet-label');
petPrev.addEventListener('click', () => {
  myPetIndex = (myPetIndex - 1 + PETS.length) % PETS.length;
  petLabel.textContent = typeof tPet === 'function' ? tPet(PETS[myPetIndex]) : PET_NAMES[PETS[myPetIndex]];
  drawSkinPreview();
  socket.emit('changeSkin', { hat: HATS[myHatIndex], outfit: OUTFITS[myOutfitIndex], pet: PETS[myPetIndex] });
});
petNext.addEventListener('click', () => {
  myPetIndex = (myPetIndex + 1) % PETS.length;
  petLabel.textContent = typeof tPet === 'function' ? tPet(PETS[myPetIndex]) : PET_NAMES[PETS[myPetIndex]];
  drawSkinPreview();
  socket.emit('changeSkin', { hat: HATS[myHatIndex], outfit: OUTFITS[myOutfitIndex], pet: PETS[myPetIndex] });
});

// --- AVATAR ---
function processAvatarFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const size = 64;
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = size;
      tmpCanvas.height = size;
      const tc = tmpCanvas.getContext('2d');
      // Center-crop to square
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      tc.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      const dataUrl = tmpCanvas.toDataURL('image/jpeg', 0.6);
      const base64 = dataUrl.split(',')[1];
      if (base64.length > 13334) { avatarLabel.textContent = typeof t === 'function' ? t('tooLarge') : 'Too large'; return; }
      myAvatarData = base64;
      cacheAvatar(socket.id, base64);
      avatarLabel.textContent = typeof t === 'function' ? t('uploaded') : 'Uploaded!';
      avatarRemoveBtn.style.display = 'inline-block';
      drawSkinPreview();
      socket.emit('changeAvatar', { avatar: base64 });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function cacheAvatar(playerId, base64) {
  if (!base64) { avatarCache.delete(playerId); return; }
  const img = new Image();
  img.onload = () => { if (gamePhase === 'lobby') drawSkinPreview(); };
  img.src = 'data:image/jpeg;base64,' + base64;
  avatarCache.set(playerId, img);
}

avatarUploadBtn.addEventListener('click', () => avatarInput.click());
avatarInput.addEventListener('change', (e) => {
  if (e.target.files[0]) processAvatarFile(e.target.files[0]);
  e.target.value = '';
});
avatarRemoveBtn.addEventListener('click', () => {
  myAvatarData = null;
  avatarCache.delete(socket.id);
  avatarLabel.textContent = typeof t === 'function' ? t('noPhoto') : 'No photo';
  avatarRemoveBtn.style.display = 'none';
  drawSkinPreview();
  socket.emit('changeAvatar', { avatar: null });
});

// --- COLOR PICKER ---
function buildColorPicker(takenColors) {
  colorPicker.innerHTML = '';
  COLORS.forEach(c => {
    const btn = document.createElement('div');
    const taken = takenColors.includes(c) && c !== myColor;
    btn.style.cssText = `width:28px;height:28px;border-radius:50%;background:${c};cursor:${taken ? 'not-allowed' : 'pointer'};opacity:${taken ? '0.3' : '1'};border:${c === myColor ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)'}`;
    if (!taken) {
      btn.addEventListener('click', () => {
        socket.emit('changeColor', { color: c });
      });
    }
    colorPicker.appendChild(btn);
  });
}

socket.on('colorChanged', ({ playerId, color }) => {
  const p = lobbyPlayers_data.find(pl => pl.id === playerId);
  if (p) p.color = color;
  if (playerId === socket.id) myColor = color;
  const taken = lobbyPlayers_data.map(p => p.color);
  buildColorPicker(taken);
  updateLobbyUI(lobbyPlayers_data);
  drawSkinPreview();
});

function darkenColor(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
}

const HATS = ['none', 'crown', 'tophat', 'partyhat', 'chef', 'headband', 'flower', 'devil', 'halo', 'beanie', 'antenna', 'pirate', 'glasses', 'sunglasses', 'headphones', 'cap', 'wizard', 'cowboy', 'ninja', 'santa', 'witch', 'elfhat', 'bunnyears', 'pumpkin'];
const SEASONAL_HATS = { halloween: ['witch', 'pumpkin', 'devil'], christmas: ['santa', 'elfhat'], spring: ['bunnyears', 'flower'], summer: ['sunglasses', 'cap'] };
const OUTFITS = ['none', 'suit', 'labcoat', 'military', 'scarf', 'cape', 'toolbelt', 'astronaut', 'hoodie', 'police', 'pirate_outfit', 'ninja_outfit'];
const HAT_NAMES = { none: 'None', crown: 'Crown', tophat: 'Top Hat', partyhat: 'Party Hat', chef: 'Chef Hat', headband: 'Headband', flower: 'Flower', devil: 'Devil Horns', halo: 'Halo', beanie: 'Beanie', antenna: 'Antenna', pirate: 'Pirate Hat', glasses: 'Glasses', sunglasses: 'Sunglasses', headphones: 'Headphones', cap: 'Cap', wizard: 'Wizard Hat', cowboy: 'Cowboy Hat', ninja: 'Ninja Mask', santa: 'Santa Hat', witch: 'Witch Hat', elfhat: 'Elf Hat', bunnyears: 'Bunny Ears', pumpkin: 'Pumpkin' };
const OUTFIT_NAMES = { none: 'None', suit: 'Suit', labcoat: 'Lab Coat', military: 'Military', scarf: 'Scarf', cape: 'Cape', toolbelt: 'Tool Belt', astronaut: 'Astronaut', hoodie: 'Hoodie', police: 'Police', pirate_outfit: 'Pirate', ninja_outfit: 'Ninja' };
const PETS = ['none', 'mini_crewmate', 'dog', 'cat', 'robot', 'alien', 'hamster'];
const PET_NAMES = { none: 'None', mini_crewmate: 'Mini Crewmate', dog: 'Dog', cat: 'Cat', robot: 'Robot', alien: 'Alien', hamster: 'Hamster' };

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
    case 'glasses':
      c.strokeStyle = '#333';
      c.lineWidth = 1.5 * s;
      c.beginPath(); c.arc(x - 5 * s, y - R * 0.3, 4 * s, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(x + 5 * s, y - R * 0.3, 4 * s, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x - 1 * s, y - R * 0.3); c.lineTo(x + 1 * s, y - R * 0.3); c.stroke();
      c.beginPath(); c.moveTo(x - 9 * s, y - R * 0.3); c.lineTo(x - R * 0.7, y - R * 0.4); c.stroke();
      c.beginPath(); c.moveTo(x + 9 * s, y - R * 0.3); c.lineTo(x + R * 0.7, y - R * 0.4); c.stroke();
      break;
    case 'sunglasses':
      c.fillStyle = '#111';
      c.fillRect(x - 9 * s, y - R * 0.45, 8 * s, 5 * s);
      c.fillRect(x + 1 * s, y - R * 0.45, 8 * s, 5 * s);
      c.strokeStyle = '#333';
      c.lineWidth = 1.5 * s;
      c.beginPath(); c.moveTo(x - 1 * s, y - R * 0.35); c.lineTo(x + 1 * s, y - R * 0.35); c.stroke();
      c.beginPath(); c.moveTo(x - 9 * s, y - R * 0.35); c.lineTo(x - R * 0.7, y - R * 0.5); c.stroke();
      c.beginPath(); c.moveTo(x + 9 * s, y - R * 0.35); c.lineTo(x + R * 0.7, y - R * 0.5); c.stroke();
      break;
    case 'headphones':
      c.strokeStyle = '#333';
      c.lineWidth = 3 * s;
      c.beginPath(); c.arc(x, y - R * 0.5, R * 0.8, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      c.fillStyle = '#444';
      c.fillRect(x - R * 0.85, y - R * 0.5, 6 * s, 10 * s);
      c.fillRect(x + R * 0.85 - 6 * s, y - R * 0.5, 6 * s, 10 * s);
      break;
    case 'cap':
      c.fillStyle = '#2244aa';
      c.beginPath();
      c.arc(x, y - R * 0.55, R * 0.7, Math.PI, Math.PI * 2);
      c.fill();
      c.fillRect(x, y - R * 0.58, R * 0.9, 4 * s);
      break;
    case 'wizard':
      c.fillStyle = '#4422aa';
      c.beginPath();
      c.moveTo(x, y - R * 1.8);
      c.lineTo(x - R * 0.6, y - R * 0.55);
      c.lineTo(x + R * 0.6, y - R * 0.55);
      c.closePath();
      c.fill();
      c.fillStyle = '#ffcc00';
      c.beginPath(); c.arc(x, y - R * 1.1, 3 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffcc00';
      c.beginPath(); c.arc(x - 4 * s, y - R * 0.7, 2 * s, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x + 5 * s, y - R * 0.85, 2 * s, 0, Math.PI * 2); c.fill();
      break;
    case 'cowboy':
      c.fillStyle = '#8B4513';
      c.beginPath();
      c.ellipse(x, y - R * 0.55, R * 1.0, 4 * s, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#A0522D';
      c.beginPath();
      c.arc(x, y - R * 0.7, R * 0.5, Math.PI, Math.PI * 2);
      c.fill();
      c.fillRect(x - R * 0.5, y - R * 0.7, R * 1.0, 3 * s);
      break;
    case 'ninja':
      c.fillStyle = '#1a1a1a';
      c.beginPath();
      c.arc(x, y, R, Math.PI * 1.2, Math.PI * 1.8);
      c.fill();
      c.fillRect(x - R * 0.8, y - R * 0.4, R * 1.6, 5 * s);
      c.fillStyle = '#cc0000';
      c.fillRect(x + R * 0.6, y - R * 0.5, 10 * s, 3 * s);
      c.fillRect(x + R * 0.6, y - R * 0.35, 12 * s, 3 * s);
      break;
    case 'santa':
      c.fillStyle = '#cc0000';
      c.beginPath();
      c.moveTo(x - R * 0.65, y - R * 0.55);
      c.quadraticCurveTo(x, y - R * 1.8, x + R * 0.7, y - R * 0.8);
      c.lineTo(x + R * 0.65, y - R * 0.55);
      c.closePath();
      c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(x + R * 0.65, y - R * 0.85, 4 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff';
      c.fillRect(x - R * 0.7, y - R * 0.6, R * 1.4, 5 * s);
      break;
    case 'witch':
      // Tall witch hat - purple/black
      c.fillStyle = '#2a0845';
      c.beginPath();
      c.moveTo(x - R * 0.8, y - R * 0.5);
      c.lineTo(x, y - R * 2.2);
      c.lineTo(x + R * 0.8, y - R * 0.5);
      c.closePath();
      c.fill();
      // Brim
      c.fillStyle = '#1a0530';
      c.beginPath();
      c.ellipse(x, y - R * 0.5, R * 1.0, R * 0.2, 0, 0, Math.PI * 2);
      c.fill();
      // Buckle
      c.fillStyle = '#ffd700';
      c.fillRect(x - 3 * s, y - R * 0.85, 6 * s, 6 * s);
      break;
    case 'elfhat':
      // Green elf hat with bell
      c.fillStyle = '#228B22';
      c.beginPath();
      c.moveTo(x - R * 0.6, y - R * 0.55);
      c.quadraticCurveTo(x + R * 0.2, y - R * 1.6, x + R * 0.9, y - R * 1.0);
      c.lineTo(x + R * 0.6, y - R * 0.55);
      c.closePath();
      c.fill();
      // Bell
      c.fillStyle = '#ffd700';
      c.beginPath(); c.arc(x + R * 0.85, y - R * 1.0, 3 * s, 0, Math.PI * 2); c.fill();
      // Red trim
      c.fillStyle = '#cc0000';
      c.fillRect(x - R * 0.65, y - R * 0.6, R * 1.3, 4 * s);
      break;
    case 'bunnyears':
      // Two tall bunny ears
      c.fillStyle = '#fff';
      c.beginPath();
      c.ellipse(x - R * 0.35, y - R * 1.3, R * 0.18, R * 0.6, -0.1, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(x + R * 0.35, y - R * 1.3, R * 0.18, R * 0.6, 0.1, 0, Math.PI * 2);
      c.fill();
      // Inner ear pink
      c.fillStyle = '#ffb6c1';
      c.beginPath();
      c.ellipse(x - R * 0.35, y - R * 1.3, R * 0.1, R * 0.4, -0.1, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(x + R * 0.35, y - R * 1.3, R * 0.1, R * 0.4, 0.1, 0, Math.PI * 2);
      c.fill();
      break;
    case 'pumpkin':
      // Pumpkin head topper
      c.fillStyle = '#ff6600';
      c.beginPath();
      c.arc(x, y - R * 0.9, R * 0.5, 0, Math.PI * 2);
      c.fill();
      // Stem
      c.fillStyle = '#2d5a1e';
      c.fillRect(x - 2 * s, y - R * 1.4, 4 * s, R * 0.3);
      // Face
      c.fillStyle = '#000';
      c.beginPath(); // eyes
      c.moveTo(x - R * 0.25, y - R * 1.0);
      c.lineTo(x - R * 0.15, y - R * 0.85);
      c.lineTo(x - R * 0.35, y - R * 0.85);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(x + R * 0.25, y - R * 1.0);
      c.lineTo(x + R * 0.35, y - R * 0.85);
      c.lineTo(x + R * 0.15, y - R * 0.85);
      c.closePath();
      c.fill();
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
    case 'astronaut':
      // helmet ring
      c.strokeStyle = '#ccc';
      c.lineWidth = 2.5 * s;
      c.beginPath(); c.arc(x, y, R * 0.85, Math.PI * 0.8, Math.PI * 2.2); c.stroke();
      // chest pack
      c.fillStyle = '#ddd';
      c.fillRect(x - R * 0.3, y + R * 0.1, R * 0.6, R * 0.4);
      c.fillStyle = '#44aaff';
      c.fillRect(x - R * 0.15, y + R * 0.15, R * 0.3, R * 0.15);
      break;
    case 'hoodie':
      // hood behind head
      c.fillStyle = '#555';
      c.beginPath();
      c.arc(x, y - R * 0.1, R * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      c.fill();
      // strings
      c.strokeStyle = '#777';
      c.lineWidth = 1 * s;
      c.beginPath(); c.moveTo(x - 3 * s, y + R * 0.2); c.lineTo(x - 3 * s, y + R * 0.6); c.stroke();
      c.beginPath(); c.moveTo(x + 3 * s, y + R * 0.2); c.lineTo(x + 3 * s, y + R * 0.6); c.stroke();
      break;
    case 'police':
      // badge
      c.fillStyle = '#ffd700';
      c.beginPath();
      c.moveTo(x, y - R * 0.1);
      c.lineTo(x - 5 * s, y + R * 0.15);
      c.lineTo(x - 3 * s, y + R * 0.3);
      c.lineTo(x, y + R * 0.2);
      c.lineTo(x + 3 * s, y + R * 0.3);
      c.lineTo(x + 5 * s, y + R * 0.15);
      c.closePath();
      c.fill();
      // shoulder pads
      c.fillStyle = '#223388';
      c.fillRect(x - R * 0.9, y - R * 0.3, R * 0.25, R * 0.3);
      c.fillRect(x + R * 0.65, y - R * 0.3, R * 0.25, R * 0.3);
      break;
    case 'pirate_outfit':
      // eyepatch
      c.fillStyle = '#1a1a1a';
      c.beginPath(); c.arc(x + 5 * s, y - R * 0.2, 4 * s, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#1a1a1a';
      c.lineWidth = 1 * s;
      c.beginPath(); c.moveTo(x + 5 * s, y - R * 0.2); c.lineTo(x - R * 0.5, y - R * 0.6); c.stroke();
      // sash
      c.fillStyle = '#cc0000';
      c.save();
      c.translate(x, y + R * 0.1);
      c.rotate(-0.3);
      c.fillRect(-R * 0.6, 0, R * 1.2, R * 0.15);
      c.restore();
      break;
    case 'ninja_outfit':
      // body wrap
      c.fillStyle = '#1a1a1a';
      c.globalAlpha = 0.4;
      c.beginPath(); c.arc(x, y, R * 0.85, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      // belt
      c.fillStyle = '#cc0000';
      c.fillRect(x - R * 0.7, y + R * 0.15, R * 1.4, R * 0.12);
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
  if (!(
    pointInAnyRect(x - m, y - m, allRects) &&
    pointInAnyRect(x + m, y - m, allRects) &&
    pointInAnyRect(x - m, y + m, allRects) &&
    pointInAnyRect(x + m, y + m, allRects)
  )) return false;

  // Check closed doors
  for (const mapDoor of MAP.doors) {
    const ds = doorStates.find(d => d.id === mapDoor.id);
    if (ds && ds.closed) {
      if (x + m > mapDoor.x && x - m < mapDoor.x + mapDoor.w &&
          y + m > mapDoor.y && y - m < mapDoor.y + mapDoor.h) {
        return false;
      }
    }
  }
  return true;
}

// ============================================
// INPUT
// ============================================
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;

  // Escape closes task screen
  if (e.key === 'Escape' && activeTask) {
    closeTask(false);
    return;
  }

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
    if (e.key.toLowerCase() === 'v' && me.alive) {
      const canVentKb = myRole === 'impostor' || (mySpecialRole === 'engineer' && engineerVentsLeft > 0);
      if (canVentKb) {
        const VENT_RANGE = 60;
        for (let vi = 0; vi < MAP.vents.length; vi++) {
          const v = MAP.vents[vi];
          if (distance(me, v.a) < VENT_RANGE || distance(me, v.b) < VENT_RANGE) {
            socket.emit('ventMove', { ventIndex: vi });
            break;
          }
        }
      }
    }
    if (e.key.toLowerCase() === 'q' && mySpecialRole === 'sheriff' && myRole === 'crewmate' && me.alive) {
      socket.emit('sheriffKill');
    }
    if (e.key.toLowerCase() === 't' && mySpecialRole === 'scientist' && myRole === 'crewmate' && me.alive) {
      socket.emit('checkVitals');
    }
    if (e.key.toLowerCase() === 'c' && me.alive) {
      if (watchingCameras) {
        watchingCameras = false; cameraFeed = null;
        socket.emit('stopWatchCameras');
      } else if (distance(me, MAP.securityConsole) < 80) {
        watchingCameras = true;
        socket.emit('watchCameras');
      }
    }
    if (e.key.toLowerCase() === 'x' && myRole === 'impostor' && me.alive && !activeSabotage) {
      sabotageMenuOpen = !sabotageMenuOpen;
    }
    if (e.key.toLowerCase() === 'g' && myRole === 'impostor' && me.alive) {
      const DOOR_RANGE = 80;
      for (const mapDoor of MAP.doors) {
        const ds = doorStates.find(d => d.id === mapDoor.id);
        if (!ds || !ds.closed) {
          const doorCx = mapDoor.x + mapDoor.w / 2;
          const doorCy = mapDoor.y + mapDoor.h / 2;
          if (distance(me, { x: doorCx, y: doorCy }) < DOOR_RANGE) {
            socket.emit('closeDoor', { doorId: mapDoor.id });
            break;
          }
        }
      }
    }
    if (e.key.toLowerCase() === 'f' && me.alive && activeSabotage && myRole !== 'impostor') {
      const stations = MAP.sabotageFixStations[activeSabotage.type];
      if (stations) {
        for (let si = 0; si < stations.length; si++) {
          if (distance(me, stations[si]) < 80) {
            handleSabotageFix(si);
            break;
          }
        }
      }
    }
    // Emote wheel: number keys 1-6
    if (me.alive && e.key >= '1' && e.key <= '6') {
      const emoteId = parseInt(e.key) - 1;
      socket.emit('emote', { emoteId });
      floatingMessages.push({ playerId: myId, emoji: EMOTES[emoteId], startTime: Date.now(), duration: 2500 });
    }
  }
});

document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

// Shared handler for canvas action button interactions (click + touch)
function handleCanvasAction(clientX, clientY) {
  if (gamePhase !== 'playing' || activeTask) return false;
  const me = players.find(p => p.id === myId);
  if (!me || !me.alive) return false;

  let handled = false;

  if (window._actionButtons) {
    for (const btn of window._actionButtons) {
      if (btn.hitbox &&
          clientX >= btn.hitbox.x && clientX <= btn.hitbox.x + btn.hitbox.w &&
          clientY >= btn.hitbox.y && clientY <= btn.hitbox.y + btn.hitbox.h) {
        if (btn.action === 'kill') socket.emit('doKill');
        else if (btn.action === 'report') socket.emit('reportBody');
        else if (btn.action === 'use') {
          const task = findNearestTask(me);
          if (task) openTask(task);
        }
        else if (btn.action === 'emergency') socket.emit('callEmergency');
        else if (btn.action === 'vent') {
          const VENT_RANGE = 60;
          for (let vi = 0; vi < MAP.vents.length; vi++) {
            const v = MAP.vents[vi];
            if (distance(me, v.a) < VENT_RANGE || distance(me, v.b) < VENT_RANGE) {
              socket.emit('ventMove', { ventIndex: vi });
              break;
            }
          }
        }
        else if (btn.action === 'sabotage') {
          sabotageMenuOpen = !sabotageMenuOpen;
        }
        else if (btn.action === 'fixSabotage') {
          handleSabotageFix(btn.stationIndex);
        }
        else if (btn.action === 'closeDoor') {
          socket.emit('closeDoor', { doorId: btn.doorId });
        }
        else if (btn.action === 'sheriffKill') {
          socket.emit('sheriffKill');
        }
        else if (btn.action === 'checkVitals') {
          socket.emit('checkVitals');
        }
        else if (btn.action === 'watchCameras') {
          watchingCameras = true;
          socket.emit('watchCameras');
        }
        else if (btn.action === 'stopCameras') {
          watchingCameras = false;
          cameraFeed = null;
          socket.emit('stopWatchCameras');
        }
        else if (btn.action === 'adminTable') {
          viewingAdminTable = !viewingAdminTable;
          if (viewingAdminTable) socket.emit('requestAdminTable');
        }
        handled = true;
        break;
      }
    }
  }

  // Check sabotage menu clicks
  if (sabotageMenuOpen && window._sabotageMenuButtons) {
    for (const btn of window._sabotageMenuButtons) {
      if (clientX >= btn.x && clientX <= btn.x + btn.w &&
          clientY >= btn.y && clientY <= btn.y + btn.h) {
        socket.emit('triggerSabotage', { type: btn.type });
        sabotageMenuOpen = false;
        return true;
      }
    }
    // Click outside menu closes it
    sabotageMenuOpen = false;
  }
  return handled;
}

// Click on canvas for action buttons (desktop)
canvas.addEventListener('click', (e) => {
  handleCanvasAction(e.clientX, e.clientY);
});

// Touch on canvas for action buttons (mobile) — fires instantly on touch, no 300ms delay
canvas.addEventListener('touchstart', (e) => {
  if (gamePhase !== 'playing' || activeTask) return;
  const touch = e.touches[0];
  if (touch && handleCanvasAction(touch.clientX, touch.clientY)) {
    e.preventDefault();
  }
}, { passive: false });

function handleSabotageFix(stationIndex) {
  if (!activeSabotage) return;

  if (activeSabotage.type === 'lights') {
    // Simple: just send fix (server counts 5 clicks)
    socket.emit('fixSabotage', { stationIndex: 0, action: 'toggleSwitch' });
  } else if (activeSabotage.type === 'o2') {
    // Each panel is independently fixable
    socket.emit('fixSabotage', { stationIndex, action: 'enterCode' });
  } else if (activeSabotage.type === 'reactor') {
    // Hold: send hold, then release after brief moment
    socket.emit('fixSabotage', { stationIndex, action: 'hold' });
    // Auto-release when player moves away (handled by interval below)
    if (!window._reactorHoldInterval) {
      window._reactorHoldInterval = setInterval(() => {
        const me = players.find(p => p.id === myId);
        if (!me || !activeSabotage || activeSabotage.type !== 'reactor') {
          socket.emit('fixSabotage', { stationIndex, action: 'release' });
          clearInterval(window._reactorHoldInterval);
          window._reactorHoldInterval = null;
          return;
        }
        const stations = MAP.sabotageFixStations.reactor;
        let nearStation = false;
        for (const st of stations) {
          if (distance(me, st) < 80) { nearStation = true; break; }
        }
        if (!nearStation) {
          socket.emit('fixSabotage', { stationIndex, action: 'release' });
          clearInterval(window._reactorHoldInterval);
          window._reactorHoldInterval = null;
        }
      }, 200);
    }
  }
}

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
    let speed = settings.playerSpeed || 3;
    // Hide & Seek: impostor moves 1.5x faster
    if (currentGameMode === 'hideseek' && myRole === 'impostor') speed *= 1.5;

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
    drawDoors();
    drawEmergencyButton();
    drawVents();
    drawSabotageFixStations();
    drawCameraIcons();
    drawTaskLocations();
    drawBodies();
    drawParticles();
    drawPlayers();
    updateAndDrawPets();
    drawVoiceIndicators();
    drawFloatingMessages();

    const me = players.find(p => p.id === myId);
    if (me && me.alive && !isSpectator) {
      drawVisionMask();
    }

    drawKillFlashes();
    drawSabotageWarning();
    ctx.restore(); // end screen shake

    drawSeasonalDecorations();
    drawHUD();
    drawMinimap();

    if (gamePhase === 'playing' && !isSpectator) {
      drawActionButtons();
      if (sabotageMenuOpen) drawSabotageMenu();
      if (vitalsData && Date.now() < vitalsShowUntil) drawVitalsOverlay();
      if (watchingCameras) drawCameraOverlay();
      if (viewingAdminTable) drawAdminOverlay();
    }
    if (isSpectator) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = "bold 16px 'Exo 2', Arial";
      ctx.textAlign = 'center';
      ctx.fillText('SPECTATING', canvas.width / 2, canvas.height - 20);
    }

    if (roleFlash.active) {
      drawRoleFlash();
    }
    if (killAnim) {
      drawKillAnimation();
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
    ctx.fillText((typeof tRoom === 'function' ? tRoom(room.name) : room.name).toUpperCase(), s.x + room.w / 2, s.y + room.h / 2 + 4);
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

    case 'Kitchen':
      // === Based on user's real kitchen photo ===
      // Kitchen counters along top wall
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(s.x + room.w - 70, s.y + 8, 65, 30);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x + room.w - 70, s.y + 8, 65, 30);
      // Counter handles
      for (let ch = 0; ch < 3; ch++) {
        ctx.fillStyle = '#777';
        ctx.fillRect(s.x + room.w - 65 + ch * 22, s.y + 28, 12, 2);
      }

      // Upper cabinets (along top-right)
      ctx.fillStyle = '#484848';
      ctx.fillRect(s.x + room.w - 70, s.y + 2, 65, 8);
      ctx.strokeStyle = '#5a5a5a';
      ctx.strokeRect(s.x + room.w - 70, s.y + 2, 30, 8);
      ctx.strokeRect(s.x + room.w - 38, s.y + 2, 33, 8);

      // Fridge (tall, right side)
      ctx.fillStyle = '#b0b8c0';
      ctx.fillRect(s.x + room.w - 45, s.y + 45, 35, 55);
      ctx.strokeStyle = '#8a9298';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x + room.w - 45, s.y + 45, 35, 55);
      // Fridge handle
      ctx.fillStyle = '#666';
      ctx.fillRect(s.x + room.w - 44, s.y + 55, 3, 20);
      // Fridge line (freezer/fridge divide)
      ctx.strokeStyle = '#8a9298';
      ctx.beginPath();
      ctx.moveTo(s.x + room.w - 45, s.y + 68);
      ctx.lineTo(s.x + room.w - 10, s.y + 68);
      ctx.stroke();

      // Microwave on cabinet (top-left area)
      ctx.fillStyle = '#3a3a42';
      ctx.fillRect(s.x + 10, s.y + 10, 40, 35);
      ctx.strokeStyle = '#555';
      ctx.strokeRect(s.x + 10, s.y + 10, 40, 35);
      // Microwave door
      ctx.fillStyle = '#1a1a20';
      ctx.fillRect(s.x + 14, s.y + 15, 25, 22);
      // Microwave display (glowing)
      const mwGlow = 0.5 + Math.sin(time * 0.003) * 0.3;
      ctx.fillStyle = `rgba(50,200,80,${mwGlow})`;
      ctx.fillRect(s.x + 42, s.y + 16, 5, 6);
      // Cabinet under microwave
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(s.x + 5, s.y + 45, 50, 30);
      ctx.strokeStyle = '#555';
      ctx.strokeRect(s.x + 5, s.y + 45, 50, 30);
      ctx.strokeRect(s.x + 5, s.y + 45, 25, 30);

      // L-shaped sofa (gray, center-top area)
      // Horizontal part
      ctx.fillStyle = '#4a4a52';
      ctx.fillRect(s.x + 70, s.y + 25, 110, 35);
      ctx.strokeStyle = '#3a3a42';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x + 70, s.y + 25, 110, 35);
      // Vertical part (L extension)
      ctx.fillStyle = '#4a4a52';
      ctx.fillRect(s.x + 155, s.y + 25, 35, 65);
      ctx.strokeStyle = '#3a3a42';
      ctx.strokeRect(s.x + 155, s.y + 25, 35, 65);
      // Cushion lines
      ctx.strokeStyle = '#555';
      ctx.beginPath();
      ctx.moveTo(s.x + 105, s.y + 28); ctx.lineTo(s.x + 105, s.y + 57);
      ctx.moveTo(s.x + 140, s.y + 28); ctx.lineTo(s.x + 140, s.y + 57);
      ctx.stroke();
      // Armrest on right side of L
      ctx.fillStyle = '#404048';
      ctx.fillRect(s.x + 158, s.y + 85, 30, 8);

      // Coffee table (wooden, center)
      ctx.fillStyle = '#7a5c3a';
      ctx.fillRect(s.x + 95, s.y + 100, 55, 30);
      ctx.strokeStyle = '#5a3e22';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x + 95, s.y + 100, 55, 30);
      // Wood grain lines
      ctx.strokeStyle = 'rgba(100,70,40,0.4)';
      ctx.beginPath();
      ctx.moveTo(s.x + 100, s.y + 110); ctx.lineTo(s.x + 145, s.y + 110);
      ctx.moveTo(s.x + 100, s.y + 120); ctx.lineTo(s.x + 145, s.y + 120);
      ctx.stroke();

      // Recliner (dark, bottom-left)
      ctx.fillStyle = '#2a2a30';
      ctx.beginPath();
      ctx.moveTo(s.x + 15, s.y + 140);
      ctx.lineTo(s.x + 55, s.y + 140);
      ctx.lineTo(s.x + 55, s.y + 185);
      ctx.lineTo(s.x + 15, s.y + 185);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1a1a20';
      ctx.stroke();
      // Recliner cushion
      ctx.fillStyle = '#333340';
      ctx.fillRect(s.x + 19, s.y + 145, 32, 25);
      // Armrests
      ctx.fillStyle = '#222228';
      ctx.fillRect(s.x + 12, s.y + 142, 6, 40);
      ctx.fillRect(s.x + 52, s.y + 142, 6, 40);

      // Floor rug (subtle, under coffee table area)
      ctx.fillStyle = 'rgba(60,80,60,0.15)';
      ctx.fillRect(s.x + 70, s.y + 85, 120, 65);
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

function drawVents() {
  if (myRole !== 'impostor') return;
  const me = players.find(p => p.id === myId);
  if (!me || !me.alive) return;
  const time = Date.now();
  const VENT_RANGE = 60;

  for (const vent of MAP.vents) {
    for (const point of [vent.a, vent.b]) {
      const s = worldToScreen(point.x, point.y);
      const nearVent = distance(me, point) < VENT_RANGE;
      const pulse = 0.3 + Math.sin(time * 0.004) * 0.15;

      // Vent grate
      ctx.fillStyle = nearVent ? `rgba(0,200,0,${pulse + 0.2})` : `rgba(80,80,80,${pulse})`;
      ctx.fillRect(s.x - 15, s.y - 10, 30, 20);
      // Grate lines
      ctx.strokeStyle = nearVent ? 'rgba(0,255,0,0.5)' : 'rgba(40,40,40,0.8)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(s.x - 12, s.y - 7 + i * 5);
        ctx.lineTo(s.x + 12, s.y - 7 + i * 5);
        ctx.stroke();
      }
      // Border
      ctx.strokeStyle = nearVent ? '#00ff00' : '#555';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.x - 15, s.y - 10, 30, 20);
    }
  }
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

    // Visor (enlarged for avatar visibility)
    const pAvatar = avatarCache.get(player.id);
    if (pAvatar && pAvatar.complete && pAvatar.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(5 * facing, -5, 12, 10, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.scale(facing, 1);
      ctx.drawImage(pAvatar, 5 - 12, -5 - 10, 24, 20);
      ctx.restore();
      ctx.strokeStyle = 'rgba(100,170,200,0.5)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(5 * facing, -5, 12, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#7ec8e3';
      ctx.beginPath();
      ctx.ellipse(6 * facing, -6, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(4 * facing, -8, 4, 3, -0.3 * facing, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,170,200,0.4)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(6 * facing, -6, 9, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

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

    // Impostor name color (visible to fellow impostors, or everyone in hide & seek / infection)
    const showImpostorName = player.role === 'impostor' && player.id !== myId && player.alive &&
      (myRole === 'impostor' || currentGameMode === 'hideseek' || currentGameMode === 'infection');
    if (showImpostorName) {
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

function updateAndDrawPets() {
  const me = players.find(p => p.id === myId);

  for (const player of players) {
    if (!player.pet || player.pet === 'none') continue;
    // Skip ghosts from living player's perspective
    if (!player.alive && me && me.alive) continue;

    let targetX, targetY;
    if (!player.alive) {
      // Pet stays at body location
      const body = bodies.find(b => b.id === player.id);
      if (body) { targetX = body.x; targetY = body.y; }
      else continue;
    } else {
      targetX = player.x;
      targetY = player.y;
    }

    // Lerp pet toward player (follows with delay)
    let pp = petPositions.get(player.id);
    if (!pp) {
      pp = { x: targetX + 25, y: targetY };
      petPositions.set(player.id, pp);
    }
    const lerpSpeed = 0.06;
    const petOffset = 25; // pet trails behind
    const anim = getAnimState(player.id);
    const petTargetX = targetX - (anim.facingRight ? petOffset : -petOffset);
    const petTargetY = targetY + 5;
    pp.x += (petTargetX - pp.x) * lerpSpeed;
    pp.y += (petTargetY - pp.y) * lerpSpeed;

    const s = worldToScreen(pp.x, pp.y);
    const petBob = Math.sin(Date.now() / 200 + player.id.charCodeAt(0)) * 2;

    ctx.save();
    ctx.translate(s.x, s.y + petBob);
    if (!player.alive) ctx.globalAlpha = 0.4;

    drawPetSprite(ctx, player.pet, player.color, anim.facingRight);

    ctx.restore();
  }
}

function drawPetSprite(c, petType, ownerColor, facingRight) {
  const f = facingRight ? 1 : -1;
  const sc = 0.5; // pet scale

  switch (petType) {
    case 'mini_crewmate': {
      // Tiny Among Us crewmate
      c.fillStyle = ownerColor;
      c.beginPath();
      c.arc(0, -4 * sc, 10 * sc, 0, Math.PI * 2);
      c.fill();
      // Visor
      c.fillStyle = '#7ec8e3';
      c.beginPath();
      c.ellipse(4 * f * sc, -5 * sc, 5 * sc, 4 * sc, 0, 0, Math.PI * 2);
      c.fill();
      // Legs
      c.fillStyle = darkenColor(ownerColor, 0.7);
      c.fillRect(-5 * sc, 4 * sc, 4 * sc, 5 * sc);
      c.fillRect(1 * sc, 4 * sc, 4 * sc, 5 * sc);
      break;
    }
    case 'dog': {
      // Simple dog shape
      c.fillStyle = '#c8a060';
      // Body
      c.beginPath();
      c.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
      c.fill();
      // Head
      c.beginPath();
      c.arc(8 * f, -5, 6, 0, Math.PI * 2);
      c.fill();
      // Ears
      c.fillStyle = '#a07840';
      c.beginPath();
      c.arc(12 * f, -10, 3, 0, Math.PI * 2);
      c.fill();
      // Eyes
      c.fillStyle = '#000';
      c.beginPath();
      c.arc(10 * f, -6, 1.5, 0, Math.PI * 2);
      c.fill();
      // Tail
      c.strokeStyle = '#c8a060';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-10 * f, -2);
      c.quadraticCurveTo(-14 * f, -10, -12 * f, -14);
      c.stroke();
      break;
    }
    case 'cat': {
      // Simple cat shape
      c.fillStyle = '#888888';
      // Body
      c.beginPath();
      c.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
      c.fill();
      // Head
      c.beginPath();
      c.arc(7 * f, -4, 5, 0, Math.PI * 2);
      c.fill();
      // Ears (triangles)
      c.beginPath();
      c.moveTo(5 * f, -9); c.lineTo(3 * f, -14); c.lineTo(7 * f, -11);
      c.fill();
      c.beginPath();
      c.moveTo(10 * f, -9); c.lineTo(10 * f, -14); c.lineTo(12 * f, -9);
      c.fill();
      // Eyes
      c.fillStyle = '#44cc44';
      c.beginPath();
      c.arc(8 * f, -5, 1.5, 0, Math.PI * 2);
      c.fill();
      // Tail
      c.strokeStyle = '#888888';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-9 * f, 0);
      c.bezierCurveTo(-14 * f, -5, -16 * f, -10, -12 * f, -12);
      c.stroke();
      break;
    }
    case 'robot': {
      // Tiny robot
      c.fillStyle = '#aabbcc';
      c.fillRect(-6, -8, 12, 12);
      // Head
      c.fillStyle = '#889999';
      c.fillRect(-5, -14, 10, 7);
      // Eyes
      c.fillStyle = '#ff0000';
      c.fillRect(-3, -12, 3, 3);
      c.fillStyle = '#00ff00';
      c.fillRect(1, -12, 3, 3);
      // Antenna
      c.strokeStyle = '#aabbcc';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, -14);
      c.lineTo(0, -18);
      c.stroke();
      c.fillStyle = '#ff4444';
      c.beginPath();
      c.arc(0, -18, 2, 0, Math.PI * 2);
      c.fill();
      // Legs
      c.fillStyle = '#889999';
      c.fillRect(-5, 4, 3, 5);
      c.fillRect(2, 4, 3, 5);
      break;
    }
    case 'alien': {
      // Green alien
      c.fillStyle = '#66cc66';
      // Body
      c.beginPath();
      c.ellipse(0, 0, 7, 9, 0, 0, Math.PI * 2);
      c.fill();
      // Head (big)
      c.beginPath();
      c.ellipse(0, -10, 8, 6, 0, 0, Math.PI * 2);
      c.fill();
      // Eyes (big dark)
      c.fillStyle = '#003300';
      c.beginPath();
      c.ellipse(-3, -10, 3, 4, -0.2, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(3, -10, 3, 4, 0.2, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'hamster': {
      // Pudgy hamster
      c.fillStyle = '#e8c080';
      // Body
      c.beginPath();
      c.ellipse(0, 0, 8, 7, 0, 0, Math.PI * 2);
      c.fill();
      // Cheeks
      c.fillStyle = '#ffbbaa';
      c.beginPath();
      c.arc(-5, 0, 3, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(5, 0, 3, 0, Math.PI * 2);
      c.fill();
      // Eyes
      c.fillStyle = '#000';
      c.beginPath();
      c.arc(-3, -3, 1.5, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(3, -3, 1.5, 0, Math.PI * 2);
      c.fill();
      // Ears
      c.fillStyle = '#d0a060';
      c.beginPath();
      c.arc(-5, -7, 3, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(5, -7, 3, 0, Math.PI * 2);
      c.fill();
      // Nose
      c.fillStyle = '#ff8888';
      c.beginPath();
      c.arc(0, -1, 1.5, 0, Math.PI * 2);
      c.fill();
      break;
    }
  }
}

function drawVisionMask() {
  const me = players.find(p => p.id === myId);
  if (!me) return;

  let visionMult = myRole === 'impostor' ? (settings.impostorVision || 1.5) : (settings.crewmateVision || 1.0);
  // Lights sabotage reduces crewmate vision drastically
  if (activeSabotage && activeSabotage.type === 'lights' && myRole !== 'impostor') {
    visionMult = 0.25;
  }
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

function drawDoors() {
  for (const mapDoor of MAP.doors) {
    const ds = doorStates.find(d => d.id === mapDoor.id);
    const isClosed = ds ? ds.closed : false;

    const s = worldToScreen(mapDoor.x, mapDoor.y);
    const sw = mapDoor.w;
    const sh = mapDoor.h;

    if (isClosed) {
      // Closed door — thick red bar
      ctx.fillStyle = '#882222';
      ctx.fillRect(s.x, s.y, sw, sh);
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x, s.y, sw, sh);

      // Warning stripes
      ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
      for (let i = 0; i < Math.max(sw, sh); i += 8) {
        if (sw > sh) {
          ctx.fillRect(s.x + i, s.y, 4, sh);
        } else {
          ctx.fillRect(s.x, s.y + i, sw, 4);
        }
      }
    } else {
      // Open door — thin outline
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x, s.y, sw, sh);
    }
  }
}

function drawFloatingMessages() {
  const now = Date.now();
  floatingMessages = floatingMessages.filter(m => now - m.startTime < m.duration);

  for (const msg of floatingMessages) {
    const player = players.find(p => p.id === msg.playerId);
    if (!player) continue;

    const s = worldToScreen(player.x, player.y);
    const elapsed = now - msg.startTime;
    const t = elapsed / msg.duration;
    const alpha = t > 0.7 ? (1 - t) / 0.3 : (t < 0.1 ? t / 0.1 : 1);
    const yOffset = -45 - elapsed * 0.015;

    ctx.globalAlpha = alpha;

    if (msg.emoji) {
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(msg.emoji, s.x, s.y + yOffset);
    } else if (msg.text) {
      // Speech bubble
      const textWidth = ctx.measureText(msg.text).width;
      ctx.font = 'bold 11px Arial';
      const tw = ctx.measureText(msg.text).width;
      const bw = tw + 14;
      const bh = 22;
      const bx = s.x - bw / 2;
      const by = s.y + yOffset - bh / 2;

      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 6);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(msg.text, s.x, s.y + yOffset + 4);
    }

    ctx.globalAlpha = 1;
  }
}

function drawSabotageFixStations() {
  if (!activeSabotage) return;
  const stations = MAP.sabotageFixStations[activeSabotage.type];
  if (!stations) return;

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);

  for (let i = 0; i < stations.length; i++) {
    const st = stations[i];
    const s = worldToScreen(st.x, st.y);

    // Pulsing glow
    ctx.beginPath();
    ctx.arc(s.x, s.y, 22 + pulse * 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 100, 0, ${0.15 + pulse * 0.15})`;
    ctx.fill();

    // Station icon (wrench shape)
    ctx.beginPath();
    ctx.arc(s.x, s.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6600';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fix label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FIX', s.x, s.y + 4);

    // If O2 and panel already fixed, show check
    if (activeSabotage.type === 'o2' && activeSabotage.panelsFixed && activeSabotage.panelsFixed[i]) {
      ctx.fillStyle = '#44ff44';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('\u2713', s.x, s.y - 18);
    }
  }
}

function drawSabotageWarning() {
  if (!activeSabotage) return;

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);

  // Flashing red border
  ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + pulse * 0.4})`;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

  // Sabotage type label + timer at top center
  const _tl = typeof t === 'function' ? t : (k) => k;
  const labels = { lights: _tl('saboLightsAlert'), o2: _tl('saboO2Alert'), reactor: _tl('saboReactorAlert') };
  const label = labels[activeSabotage.type] || _tl('sabotage');

  ctx.fillStyle = `rgba(0, 0, 0, 0.7)`;
  ctx.fillRect(canvas.width / 2 - 140, 8, 280, 45);

  ctx.fillStyle = `rgb(255, ${Math.floor(80 + pulse * 100)}, ${Math.floor(pulse * 50)})`;
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, canvas.width / 2, 30);

  if (activeSabotage.timeLeft > 0) {
    const secs = Math.ceil(activeSabotage.timeLeft);
    ctx.fillStyle = secs <= 10 ? '#ff0000' : '#ffaa00';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${secs}s`, canvas.width / 2, 48);
  }

  // Reactor progress bar
  if (activeSabotage.type === 'reactor' && activeSabotage.fixProgress > 0) {
    const barW = 200;
    const progress = Math.min(1, activeSabotage.fixProgress / 3);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(canvas.width / 2 - barW / 2, 55, barW, 12);
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(canvas.width / 2 - barW / 2, 55, barW * progress, 12);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width / 2 - barW / 2, 55, barW, 12);
  }
}

function drawSabotageMenu() {
  // Draw sabotage options menu (for impostor)
  const _t = typeof t === 'function' ? t : (k) => k;
  const options = [
    { type: 'lights', label: _t('lightsLabel'), desc: _t('lightsCut'), color: '#ffcc00' },
    { type: 'o2', label: _t('o2Label'), desc: _t('o2Deplete'), color: '#00ccff' },
    { type: 'reactor', label: _t('reactorLabel'), desc: _t('reactorMeltdown'), color: '#ff4444' },
  ];

  const menuW = 200;
  const menuH = options.length * 50 + 20;
  const mx = canvas.width / 2 - menuW / 2;
  const my = canvas.height / 2 - menuH / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(mx, my, menuW, menuH);
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, menuW, menuH);

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(typeof t === 'function' ? t('sabotage') : 'SABOTAGE', canvas.width / 2, my + 18);

  window._sabotageMenuButtons = [];
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const bx = mx + 10;
    const by = my + 28 + i * 50;
    const bw = menuW - 20;
    const bh = 40;

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = opt.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = opt.color;
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(opt.label, mx + menuW / 2, by + 17);
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Arial';
    ctx.fillText(opt.desc, mx + menuW / 2, by + 32);

    window._sabotageMenuButtons.push({ x: bx, y: by, w: bw, h: bh, type: opt.type });
  }
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
  ctx.fillText(typeof t === 'function' ? t('tasksPercent')(Math.round(taskBar * 100)) : `Tasks: ${Math.round(taskBar * 100)}%`, barX + barWidth / 2, barY + 15);

  // Role indicator
  ctx.font = "bold 18px 'Orbitron', 'Segoe UI', Arial";
  ctx.textAlign = 'left';
  if (myRole === 'impostor') {
    ctx.save();
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff4444';
    ctx.fillText(typeof t === 'function' ? t('impostor') : 'IMPOSTOR', 20, 32);
    ctx.restore();
  } else {
    ctx.save();
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#44ff44';
    ctx.fillText(typeof t === 'function' ? t('crewmate') : 'CREWMATE', 20, 32);
    ctx.restore();
    if (mySpecialRole) {
      const roleColors = { sheriff: '#ffcc00', engineer: '#00ccff', scientist: '#cc66ff' };
      ctx.font = "bold 12px 'Exo 2', Arial";
      ctx.fillStyle = roleColors[mySpecialRole] || '#fff';
      ctx.fillText(mySpecialRole.toUpperCase(), 20, 48);
    }
  }

  // Kill cooldown (impostor)
  const me = players.find(p => p.id === myId);
  if (me && myRole === 'impostor' && me.alive) {
    if (me.killCooldown > 0) {
      ctx.fillStyle = '#aaa';
      ctx.font = '14px Arial';
      ctx.fillText(typeof t === 'function' ? t('killCooldownHUD')(Math.ceil(me.killCooldown)) : `Kill: ${Math.ceil(me.killCooldown)}s`, 20, 54);
    }
  }

  // Ghost indicator
  if (me && !me.alive) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(typeof t === 'function' ? t('ghost') : 'GHOST', canvas.width / 2, 60);
  }

  // Game mode HUD
  if (currentGameMode !== 'classic') {
    ctx.textAlign = 'center';
    ctx.font = "bold 13px 'Exo 2', Arial";

    if (currentGameMode === 'hideseek') {
      // Head start countdown
      const headStartRemaining = Math.max(0, Math.ceil((headStartEnd - Date.now()) / 1000));
      if (headStartRemaining > 0) {
        ctx.fillStyle = '#ffaa00';
        ctx.font = "bold 20px 'Orbitron', sans-serif";
        ctx.fillText(typeof t === 'function' ? t('headStart')(headStartRemaining) : `Head start: ${headStartRemaining}s`, canvas.width / 2, 85);
      }
      // Mode label
      ctx.fillStyle = myRole === 'impostor' ? '#ff6644' : '#44aaff';
      ctx.font = "bold 12px 'Exo 2', Arial";
      const hsLabel = myRole === 'impostor'
        ? (typeof t === 'function' ? t('hideSeekYouAreHunter') : 'You are the HUNTER!')
        : (typeof t === 'function' ? t('hideSeekImpostorRevealed') : 'The impostor is revealed! RUN!');
      ctx.fillText(hsLabel, canvas.width / 2, headStartRemaining > 0 ? 108 : 85);
    }

    if (currentGameMode === 'speedrun') {
      const elapsed = Math.floor((Date.now() - speedrunStartTime) / 1000);
      ctx.fillStyle = '#44ffaa';
      ctx.font = "bold 16px 'Orbitron', sans-serif";
      ctx.fillText(typeof t === 'function' ? t('speedRunTimer')(elapsed) : `Time: ${elapsed}s`, canvas.width / 2, 85);
      ctx.fillStyle = '#aaffcc';
      ctx.font = "bold 11px 'Exo 2', Arial";
      ctx.fillText(typeof t === 'function' ? t('speedRunCoopMode') : 'Co-op Mode - Complete all tasks!', canvas.width / 2, 102);
    }

    if (currentGameMode === 'infection') {
      const infectedCount = players.filter(p => p.role === 'impostor' && p.alive).length;
      const totalAlive = players.filter(p => p.alive).length;
      ctx.fillStyle = '#44ff44';
      ctx.font = "bold 14px 'Exo 2', Arial";
      ctx.fillText(typeof t === 'function' ? t('infectedCount')(infectedCount, totalAlive) : `Infected: ${infectedCount}/${totalAlive}`, canvas.width / 2, 85);
    }
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
    ctx.fillText(typeof t === 'function' ? t('tasksLabel') : 'Tasks:', canvas.width - 200, startY);
    ctx.font = '11px Arial';
    myTasks.forEach((task, i) => {
      ctx.fillStyle = task.completed ? '#44aa44' : '#ccc';
      const prefix = task.completed ? '✓ ' : '○ ';
      const rn = typeof tRoom === 'function' ? tRoom(task.roomName) : task.roomName;
      ctx.fillText(prefix + getTaskName(task.type) + ' (' + rn + ')', canvas.width - 200, startY + 20 + i * 18);
    });
  }
}

function drawCameraIcons() {
  // Draw camera icons on the map + blinking red light if someone is watching
  for (const cam of MAP.cameras) {
    const s = worldToScreen(cam.x, cam.y - 30); // offset above ground
    // Camera body
    ctx.fillStyle = '#555';
    ctx.fillRect(s.x - 8, s.y - 6, 16, 12);
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(s.x + 8, s.y - 4);
    ctx.lineTo(s.x + 14, s.y - 8);
    ctx.lineTo(s.x + 14, s.y + 4);
    ctx.lineTo(s.x + 8, s.y + 2);
    ctx.fill();

    // Blinking red light when camera is active
    if (cameraWatcherActive && Math.sin(Date.now() / 300) > 0) {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(s.x - 5, s.y - 8, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw security console
  const sc = worldToScreen(MAP.securityConsole.x, MAP.securityConsole.y);
  ctx.fillStyle = '#334455';
  ctx.fillRect(sc.x - 12, sc.y - 12, 24, 24);
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sc.x - 12, sc.y - 12, 24, 24);
  ctx.fillStyle = '#ff8800';
  ctx.font = '8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CAM', sc.x, sc.y + 3);

  // Draw admin console
  const ac = worldToScreen(MAP.adminConsole.x, MAP.adminConsole.y);
  ctx.fillStyle = '#334455';
  ctx.fillRect(ac.x - 12, ac.y - 12, 24, 24);
  ctx.strokeStyle = '#00aaaa';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ac.x - 12, ac.y - 12, 24, 24);
  ctx.fillStyle = '#00aaaa';
  ctx.font = '8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ADMIN', ac.x, ac.y + 3);
}

function drawCameraOverlay() {
  if (!watchingCameras || !cameraFeed) return;

  const panelW = Math.min(canvas.width - 40, 500);
  const panelH = Math.min(canvas.height - 80, 400);
  const px = canvas.width / 2 - panelW / 2;
  const py = canvas.height / 2 - panelH / 2;

  // Background
  ctx.fillStyle = 'rgba(10, 10, 20, 0.95)';
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, 8);
  ctx.fill();
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, 8);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#ff8800';
  ctx.font = "bold 14px 'Exo 2', Arial";
  ctx.textAlign = 'center';
  ctx.fillText('SECURITY CAMERAS', px + panelW / 2, py + 20);

  // Static scanline effect
  ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.02})`;
  for (let i = 0; i < panelH; i += 3) {
    ctx.fillRect(px, py + i, panelW, 1);
  }

  // Draw 4 camera views in a 2x2 grid
  const camW = (panelW - 30) / 2;
  const camH = (panelH - 50) / 2;
  for (let i = 0; i < cameraFeed.length && i < 4; i++) {
    const cam = cameraFeed[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = px + 10 + col * (camW + 10);
    const cy = py + 30 + row * (camH + 10);

    // Camera viewport
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(cx, cy, camW, camH);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, cy, camW, camH);

    // Camera label
    ctx.fillStyle = '#ff8800';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(cam.name, cx + 5, cy + 12);

    // Draw player dots
    for (const p of cam.players) {
      const relX = (p.x - cam.cx) / 200; // normalize to camera range
      const relY = (p.y - cam.cy) / 200;
      const dotX = cx + camW / 2 + relX * (camW / 2) * 0.8;
      const dotY = cy + camH / 2 + relY * (camH / 2) * 0.8;
      if (dotX > cx && dotX < cx + camW && dotY > cy && dotY < cy + camH) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // "REC" indicator
    if (Math.sin(Date.now() / 500) > 0) {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(cx + camW - 15, cy + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4444';
      ctx.font = '8px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('REC', cx + camW - 10, cy + 13);
    }
  }

  // Close hint
  ctx.fillStyle = '#888';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Press [C] or EXIT CAM button to close', px + panelW / 2, py + panelH - 5);
}

function drawAdminOverlay() {
  if (!viewingAdminTable || !adminTableData) return;

  const rooms = MAP.rooms;
  const panelW = Math.min(canvas.width - 40, 350);
  const rowH = 24;
  const panelH = 40 + rooms.length * rowH;
  const px = canvas.width / 2 - panelW / 2;
  const py = canvas.height / 2 - panelH / 2;

  ctx.fillStyle = 'rgba(10, 20, 30, 0.95)';
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, 8);
  ctx.fill();
  ctx.strokeStyle = '#00aaaa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, 8);
  ctx.stroke();

  ctx.fillStyle = '#00aaaa';
  ctx.font = "bold 14px 'Exo 2', Arial";
  ctx.textAlign = 'center';
  ctx.fillText('ADMIN TABLE', px + panelW / 2, py + 22);

  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    const count = adminTableData[r.name] || 0;
    const ry = py + 35 + i * rowH;

    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(r.name, px + 15, ry + 14);

    // Draw dots for each player in room
    ctx.textAlign = 'right';
    if (count > 0) {
      for (let d = 0; d < count; d++) {
        ctx.fillStyle = '#44ff44';
        ctx.beginPath();
        ctx.arc(px + panelW - 20 - d * 16, ry + 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#555';
      ctx.font = '10px Arial';
      ctx.fillText('empty', px + panelW - 15, ry + 14);
    }
  }
}

function drawVitalsOverlay() {
  if (!vitalsData) return;
  const fadeTime = vitalsShowUntil - Date.now();
  const alpha = fadeTime < 1000 ? fadeTime / 1000 : 1;

  const panelW = 240;
  const rowH = 26;
  const panelH = 40 + vitalsData.length * rowH;
  const px = canvas.width / 2 - panelW / 2;
  const py = canvas.height / 2 - panelH / 2;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(20, 10, 40, 0.92)';
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, 10);
  ctx.fill();
  ctx.strokeStyle = '#cc66ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, 10);
  ctx.stroke();

  ctx.fillStyle = '#cc66ff';
  ctx.font = "bold 14px 'Exo 2', Arial";
  ctx.textAlign = 'center';
  ctx.fillText('VITALS', px + panelW / 2, py + 22);

  for (let i = 0; i < vitalsData.length; i++) {
    const v = vitalsData[i];
    const ry = py + 35 + i * rowH;

    // Color dot
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.arc(px + 20, ry + 8, 7, 0, Math.PI * 2);
    ctx.fill();

    // Name
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(v.name, px + 35, ry + 12);

    // Status
    ctx.textAlign = 'right';
    if (v.alive) {
      ctx.fillStyle = '#44ff44';
      ctx.fillText('ALIVE', px + panelW - 15, ry + 12);
      // Heartbeat line
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 1.5;
      const lx = px + panelW - 80;
      ctx.beginPath();
      ctx.moveTo(lx, ry + 8);
      const beat = Math.sin(Date.now() / 150 + i * 2) * 6;
      ctx.lineTo(lx + 10, ry + 8 + beat);
      ctx.lineTo(lx + 15, ry + 8 - beat * 1.5);
      ctx.lineTo(lx + 25, ry + 8);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ff4444';
      ctx.fillText('DEAD', px + panelW - 15, ry + 12);
      // Flatline
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1.5;
      const lx = px + panelW - 80;
      ctx.beginPath();
      ctx.moveTo(lx, ry + 8);
      ctx.lineTo(lx + 25, ry + 8);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
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
  if (!me) { window._actionButtons = []; return; }

  const buttons = [];
  const isGhost = !me.alive;

  const noMeetings = currentGameMode === 'hideseek' || currentGameMode === 'infection';
  const noKill = currentGameMode === 'speedrun';
  const noSabo = currentGameMode === 'speedrun' || currentGameMode === 'hideseek' || currentGameMode === 'infection';
  const noVentImpostor = currentGameMode === 'hideseek'; // impostor can't vent in hide & seek

  // Kill (impostor, near crewmate, cooldown 0) — alive only
  if (!noKill && !isGhost && myRole === 'impostor') {
    let hasTarget = false;
    for (const p of players) {
      if (p.id !== myId && p.alive && p.role !== 'impostor' && distance(me, p) < KILL_RANGE) {
        hasTarget = true;
        break;
      }
    }
    if (hasTarget && (!me.killCooldown || me.killCooldown <= 0)) {
      buttons.push({ label: typeof t === 'function' ? t('kill') : 'KILL', color: '#ff0000', action: 'kill', key: 'Q' });
    }
  }

  // Report (alive only) — disabled in non-classic modes without meetings
  if (!isGhost && !noMeetings) {
    let nearBody = false;
    for (const body of bodies) {
      if (distance(me, body) < REPORT_RANGE) { nearBody = true; break; }
    }
    if (nearBody) {
      buttons.push({ label: typeof t === 'function' ? t('report') : 'REPORT', color: '#ffaa00', action: 'report', key: 'R' });
    }
  }

  // Use task (alive + ghost crewmates)
  const nearTask = findNearestTask(me);
  if (nearTask) {
    buttons.push({ label: typeof t === 'function' ? t('use') : 'USE', color: '#00aaff', action: 'use', key: 'E' });
  }

  // Emergency (alive only) — disabled in non-classic modes
  if (!isGhost && !noMeetings && distance(me, MAP.emergencyButton) < EMERGENCY_RANGE && !nearTask) {
    buttons.push({ label: typeof t === 'function' ? t('emergency') : 'EMERGENCY', color: '#ff4444', action: 'emergency', key: 'E' });
  }

  // Vent (impostor or engineer, alive only)
  const canVent = (myRole === 'impostor' && !noVentImpostor) || (mySpecialRole === 'engineer' && engineerVentsLeft > 0);
  if (!isGhost && canVent) {
    const VENT_RANGE = 60;
    let nearVent = false;
    for (const v of MAP.vents) {
      if (distance(me, v.a) < VENT_RANGE || distance(me, v.b) < VENT_RANGE) { nearVent = true; break; }
    }
    if (nearVent) {
      const ventBase = typeof t === 'function' ? t('vent') : 'VENT';
      const ventLabel = mySpecialRole === 'engineer' ? `${ventBase}(${engineerVentsLeft})` : ventBase;
      buttons.push({ label: ventLabel, color: '#00cc00', action: 'vent', key: 'V' });
    }
  }

  if (!isGhost && myRole === 'impostor' && !noSabo) {
    // Sabotage button (impostor, no active sabotage)
    if (!activeSabotage) {
      buttons.push({ label: typeof t === 'function' ? t('sabo') : 'SABO', color: '#cc00cc', action: 'sabotage', key: 'X' });
    }

    // Door button (impostor, near an open door)
    const DOOR_RANGE = 80;
    for (const mapDoor of MAP.doors) {
      const ds = doorStates.find(d => d.id === mapDoor.id);
      const isClosed = ds ? ds.closed : false;
      if (!isClosed) {
        const doorCx = mapDoor.x + mapDoor.w / 2;
        const doorCy = mapDoor.y + mapDoor.h / 2;
        if (distance(me, { x: doorCx, y: doorCy }) < DOOR_RANGE) {
          buttons.push({ label: typeof t === 'function' ? t('door') : 'DOOR', color: '#885500', action: 'closeDoor', key: 'G', doorId: mapDoor.id });
          break;
        }
      }
    }
  }

  // Fix sabotage (crewmate near fix station, alive only)
  if (!isGhost && activeSabotage && myRole !== 'impostor') {
    const stations = MAP.sabotageFixStations[activeSabotage.type];
    if (stations) {
      for (let si = 0; si < stations.length; si++) {
        if (distance(me, stations[si]) < 80) {
          buttons.push({ label: typeof t === 'function' ? t('fix') : 'FIX', color: '#ff6600', action: 'fixSabotage', key: 'F', stationIndex: si });
          break;
        }
      }
    }
  }

  // Sheriff kill button
  if (!isGhost && mySpecialRole === 'sheriff' && myRole === 'crewmate') {
    let hasTarget = false;
    for (const p of players) {
      if (p.id !== myId && p.alive && distance(me, p) < KILL_RANGE) { hasTarget = true; break; }
    }
    if (hasTarget) {
      buttons.push({ label: typeof t === 'function' ? t('shoot') : 'SHOOT', color: '#ffcc00', action: 'sheriffKill', key: 'Q' });
    }
  }

  // Scientist vitals button
  if (!isGhost && mySpecialRole === 'scientist' && myRole === 'crewmate') {
    buttons.push({ label: typeof t === 'function' ? t('vitals') : 'VITALS', color: '#cc66ff', action: 'checkVitals', key: 'T' });
  }

  // Security cameras (near security console)
  if (!isGhost && distance(me, MAP.securityConsole) < 80) {
    if (watchingCameras) {
      buttons.push({ label: typeof t === 'function' ? t('exitCam') : 'EXIT CAM', color: '#ff8800', action: 'stopCameras', key: 'C' });
    } else {
      buttons.push({ label: typeof t === 'function' ? t('cams') : 'CAMS', color: '#ff8800', action: 'watchCameras', key: 'C' });
    }
  }

  // Admin table (near admin console)
  if (!isGhost && distance(me, MAP.adminConsole) < 80) {
    buttons.push({ label: typeof t === 'function' ? t('admin') : 'ADMIN', color: '#00aaaa', action: 'adminTable', key: 'T' });
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

// ============================================
// KILL ANIMATION
// ============================================
let killAnim = null;

function showKillAnimation(killerColor, victimColor, animType) {
  killAnim = { startTime: Date.now(), duration: 1200, killerColor, victimColor, animType };
}

function drawKillAnimation() {
  if (!killAnim) return;
  const elapsed = Date.now() - killAnim.startTime;
  if (elapsed > killAnim.duration) { killAnim = null; return; }

  const t = elapsed / killAnim.duration;
  let alpha = 1;
  if (t < 0.1) alpha = t / 0.1;
  else if (t > 0.8) alpha = (1 - t) / 0.2;

  ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Draw victim (right side, falling)
  const victimX = cx + 60;
  const victimY = cy + (t > 0.4 ? (t - 0.4) * 80 : 0);
  const victimAlpha = t > 0.6 ? Math.max(0, 1 - (t - 0.6) * 2.5) : 1;
  ctx.globalAlpha = alpha * victimAlpha;
  ctx.fillStyle = killAnim.victimColor;
  ctx.beginPath();
  ctx.ellipse(victimX, victimY - 10, 22, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  // Visor
  ctx.fillStyle = 'rgba(180,220,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(victimX + 12, victimY - 14, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw killer (left side, lunging)
  const killerX = cx - 60 + (t < 0.4 ? t / 0.4 * 50 : 50);
  const killerY = cy;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = killAnim.killerColor;
  ctx.beginPath();
  ctx.ellipse(killerX, killerY - 10, 22, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(killerX + 12, killerY - 14, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Attack effect based on type
  if (t > 0.3 && t < 0.7) {
    const at = (t - 0.3) / 0.4;
    ctx.globalAlpha = alpha * (1 - at);
    if (killAnim.animType === 'tongue') {
      ctx.strokeStyle = killAnim.killerColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(killerX + 15, killerY - 5);
      ctx.quadraticCurveTo(killerX + 40, killerY - 20, victimX - 10, victimY - 10);
      ctx.stroke();
    } else if (killAnim.animType === 'knife') {
      ctx.fillStyle = '#cccccc';
      const kx = killerX + 20 + at * 30;
      const ky = killerY - 8;
      ctx.fillRect(kx, ky, 18, 4);
      ctx.fillStyle = '#aa5500';
      ctx.fillRect(kx - 6, ky - 2, 8, 8);
    } else {
      // snap — red X
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 4;
      const sx = victimX;
      const sy = victimY - 10;
      ctx.beginPath();
      ctx.moveTo(sx - 12, sy - 12);
      ctx.lineTo(sx + 12, sy + 12);
      ctx.moveTo(sx + 12, sy - 12);
      ctx.lineTo(sx - 12, sy + 12);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

// ============================================
// CONFETTI
// ============================================
let confettiParticles = [];
let confettiActive = false;

function startConfetti(color) {
  confettiParticles = [];
  confettiActive = true;
  const colors = [color, '#ffaa00', '#ff66aa', '#66aaff', '#ffff66', '#66ff66'];
  for (let i = 0; i < 80; i++) {
    confettiParticles.push({
      x: Math.random() * window.innerWidth,
      y: -Math.random() * 300,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
    });
  }
  // Stop confetti after 4 seconds
  setTimeout(() => { confettiActive = false; }, 4000);
}

function updateAndDrawConfetti() {
  if (confettiParticles.length === 0) return;

  // Use a fixed overlay canvas on top of the gameover screen
  const overlay = document.getElementById('confetti-overlay');
  if (!overlay) return;
  const cctx = overlay.getContext('2d');
  overlay.width = window.innerWidth;
  overlay.height = window.innerHeight;
  cctx.clearRect(0, 0, overlay.width, overlay.height);

  confettiParticles = confettiParticles.filter(p => p.y < window.innerHeight + 50);

  for (const p of confettiParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotSpeed;
    p.vy += 0.05; // gravity

    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rotation * Math.PI / 180);
    cctx.fillStyle = p.color;
    cctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    cctx.restore();
  }

  if (confettiActive || confettiParticles.length > 0) {
    requestAnimationFrame(updateAndDrawConfetti);
  }
}

// Start confetti rendering loop when particles exist
const _origStartConfetti = startConfetti;
startConfetti = function(color) {
  _origStartConfetti(color);
  requestAnimationFrame(updateAndDrawConfetti);
};

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

  if (roleFlash.role === 'infected') {
    // Infection mode: you just got infected
    ctx.save();
    ctx.shadowColor = '#44ff44';
    ctx.shadowBlur = 30;
    ctx.font = "bold 50px 'Orbitron', sans-serif";
    ctx.fillStyle = `rgba(68, 255, 68, ${alpha})`;
    const infLabel = typeof t === 'function' ? t('youWereInfected') : 'INFECTED!';
    ctx.fillText(infLabel, canvas.width / 2, canvas.height / 2 - 10);
    ctx.restore();
    ctx.font = "20px 'Exo 2', Arial";
    ctx.fillStyle = `rgba(150, 255, 150, ${alpha})`;
    ctx.fillText(typeof t === 'function' ? t('infectionSurvive') : 'You are now a hunter!', canvas.width / 2, canvas.height / 2 + 30);
  } else if (roleFlash.role === 'impostor') {
    ctx.save();
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 30;
    ctx.font = "bold 60px 'Orbitron', sans-serif";
    ctx.fillStyle = `rgba(255, 68, 68, ${alpha})`;
    const impLabel = typeof t === 'function' ? t('impostor') : 'IMPOSTOR';
    ctx.fillText(impLabel, canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText(impLabel, canvas.width / 2, canvas.height / 2 - 10);
    ctx.restore();
    ctx.font = "20px 'Exo 2', Arial";
    ctx.fillStyle = `rgba(255, 150, 150, ${alpha})`;
    if (currentGameMode === 'hideseek') {
      ctx.fillText(typeof t === 'function' ? t('hideSeekYouAreHunter') : 'You are the HUNTER! Everyone can see you!', canvas.width / 2, canvas.height / 2 + 30);
    } else if (otherImpostors.length > 0) {
      const fellowText = typeof t === 'function' ? t('fellowImpostor')(otherImpostors.map(i => i.name).join(', ')) : 'Fellow impostor: ' + otherImpostors.map(i => i.name).join(', ');
      ctx.fillText(fellowText, canvas.width / 2, canvas.height / 2 + 30);
    }
  } else {
    ctx.save();
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 30;
    ctx.font = "bold 60px 'Orbitron', sans-serif";
    ctx.fillStyle = `rgba(68, 255, 68, ${alpha})`;
    const crewLabel = typeof t === 'function' ? t('crewmate') : 'CREWMATE';
    ctx.fillText(crewLabel, canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText(crewLabel, canvas.width / 2, canvas.height / 2 - 10);
    ctx.restore();
    ctx.font = "20px 'Exo 2', Arial";
    ctx.fillStyle = `rgba(150, 255, 150, ${alpha})`;
    if (currentGameMode === 'hideseek') {
      ctx.fillText(typeof t === 'function' ? t('hideSeekImpostorRevealed') : 'The impostor is revealed! RUN!', canvas.width / 2, canvas.height / 2 + 30);
    } else if (currentGameMode === 'speedrun') {
      ctx.fillText(typeof t === 'function' ? t('speedRunCoopMode') : 'Co-op Mode - Complete all tasks!', canvas.width / 2, canvas.height / 2 + 30);
    } else {
      ctx.fillText(typeof t === 'function' ? t('completeTasksFindImpostor') : 'Complete your tasks. Find the impostor.', canvas.width / 2, canvas.height / 2 + 30);
    }
    if (mySpecialRole && currentGameMode === 'classic') {
      const roleNames = { sheriff: typeof t === 'function' ? t('sheriffRole') : 'SHERIFF - You can attempt to kill!', engineer: typeof t === 'function' ? t('engineerRole') : 'ENGINEER - You can use vents!', scientist: typeof t === 'function' ? t('scientistRole') : 'SCIENTIST - You can check vitals!' };
      ctx.font = "bold 18px 'Exo 2', Arial";
      ctx.fillStyle = `rgba(255, 220, 100, ${alpha})`;
      ctx.fillText(roleNames[mySpecialRole] || '', canvas.width / 2, canvas.height / 2 + 60);
    }
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
  // Anti-cheat: tell server we started this task
  socket.emit('startTask', { taskId: task.id });

  switch (task.type) {
    case 'wires': initWiresTask(); break;
    case 'swipeCard': initSwipeTask(); break;
    case 'asteroids': initAsteroidsTask(); break;
    case 'download': initDownloadTask(); break;
    case 'fuel': initFuelTask(); break;
    case 'calibrate': initCalibrateTask(); break;
    case 'simon': initSimonTask(); break;
    case 'unlock': initUnlockTask(); break;
    case 'trash': initTrashTask(); break;
    case 'maze': initMazeTask(); break;
    case 'memory': initMemoryTask(); break;
    case 'pipes': initPipesTask(); break;
    case 'trace': initTraceTask(); break;
    case 'scan': initScanTask(); break;
    case 'safe': initSafeTask(); break;
  }
}

function getTaskName(type) {
  const langKeys = {
    wires: 'fixWiring', swipeCard: 'swipeCard', asteroids: 'clearAsteroids',
    download: 'downloadData', fuel: 'fuelEngines', calibrate: 'calibrateDistributor',
    simon: 'simonSays', unlock: 'unlockSafe', trash: 'emptyTrash',
    maze: 'solveMaze', memory: 'memoryMatch', pipes: 'connectPipes',
    trace: 'tracePattern', scan: 'medScan', safe: 'crackSafe',
  };
  if (typeof t === 'function' && langKeys[type]) return t(langKeys[type]);
  const names = {
    wires: 'Fix Wiring', swipeCard: 'Swipe Card', asteroids: 'Clear Asteroids',
    download: 'Download Data', fuel: 'Fuel Engines', calibrate: 'Calibrate Distributor',
    simon: 'Simon Says', unlock: 'Unlock Safe', trash: 'Empty Trash',
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
  // Remove task-specific listeners (mouse + touch)
  taskCanvas.onmousedown = null;
  taskCanvas.onmousemove = null;
  taskCanvas.onmouseup = null;
  taskCanvas.onclick = null;
  taskCanvas.ontouchstart = null;
  taskCanvas.ontouchend = null;
}

taskClose.addEventListener('click', () => closeTask(false));
// Allow tapping X on mobile
taskClose.addEventListener('touchend', (e) => { e.preventDefault(); closeTask(false); });

// --- UNIVERSAL TOUCH-TO-MOUSE ADAPTER FOR TASK CANVAS ---
// This bridges touch events to the per-task mouse handlers so ALL tasks work on mobile
taskCanvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  if (taskCanvas.onmousedown) taskCanvas.onmousedown({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: false });
taskCanvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  if (taskCanvas.onmousemove) taskCanvas.onmousemove({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: false });
taskCanvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  if (taskCanvas.onmouseup) taskCanvas.onmouseup({ clientX: touch.clientX, clientY: touch.clientY });
  // Also trigger onclick for tap-based tasks (asteroids, download, calibrate, simon, unlock)
  if (taskCanvas.onclick) taskCanvas.onclick({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: false });

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

// --- SIMON SAYS TASK ---
function initSimonTask() {
  const state = activeTask.state;
  state.sequence = [];
  state.playerSeq = [];
  state.round = 0;
  state.totalRounds = 3;
  state.showing = true;
  state.showIndex = 0;
  state.done = false;
  state.colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44'];
  state.flash = -1;
  state.failed = false;

  function nextRound() {
    state.round++;
    state.sequence.push(Math.floor(Math.random() * 4));
    state.playerSeq = [];
    state.showing = true;
    state.showIndex = 0;
    showSequence();
  }

  function showSequence() {
    if (state.showIndex >= state.sequence.length) {
      state.showing = false;
      state.flash = -1;
      return;
    }
    state.flash = state.sequence[state.showIndex];
    setTimeout(() => {
      state.flash = -1;
      state.showIndex++;
      setTimeout(() => showSequence(), 200);
    }, 500);
  }

  function renderSimon() {
    const tc = taskCtx;
    tc.fillStyle = '#1a1a2e';
    tc.fillRect(0, 0, 350, 250);
    tc.fillStyle = '#fff';
    tc.font = 'bold 14px Arial';
    tc.textAlign = 'center';
    tc.fillText(`Round ${state.round} / ${state.totalRounds}`, 175, 25);

    const btnW = 70, btnH = 70, gap = 15;
    const startX = 175 - btnW - gap / 2, startY = 50;
    for (let i = 0; i < 4; i++) {
      const col = Math.floor(i % 2), row = Math.floor(i / 2);
      const bx = startX + col * (btnW + gap), by = startY + row * (btnH + gap);
      tc.fillStyle = i === state.flash ? '#ffffff' : state.colors[i];
      tc.globalAlpha = i === state.flash ? 1 : 0.6;
      tc.fillRect(bx, by, btnW, btnH);
      tc.globalAlpha = 1;
      tc.strokeStyle = '#fff';
      tc.lineWidth = 2;
      tc.strokeRect(bx, by, btnW, btnH);
      // Store hitbox
      if (!state.btns) state.btns = [];
      state.btns[i] = { x: bx, y: by, w: btnW, h: btnH };
    }
    if (state.failed) {
      tc.fillStyle = 'rgba(255,0,0,0.3)';
      tc.fillRect(0, 0, 350, 250);
    }
    if (!state.done) taskAnimFrame = requestAnimationFrame(renderSimon);
  }

  taskCanvas.onclick = (e) => {
    if (state.showing || state.done) return;
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width);
    const my = (e.clientY - rect.top) * (250 / rect.height);
    for (let i = 0; i < 4; i++) {
      const b = state.btns[i];
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        state.flash = i;
        setTimeout(() => { state.flash = -1; }, 200);
        if (state.sequence[state.playerSeq.length] === i) {
          state.playerSeq.push(i);
          if (state.playerSeq.length === state.sequence.length) {
            if (state.round >= state.totalRounds) {
              state.done = true;
              setTimeout(() => closeTask(true), 500);
            } else {
              setTimeout(() => nextRound(), 600);
            }
          }
        } else {
          state.failed = true;
          state.playerSeq = [];
          setTimeout(() => { state.failed = false; state.showing = true; state.showIndex = 0; showSequence(); }, 800);
        }
        break;
      }
    }
  };

  nextRound();
  renderSimon();
}

// --- UNLOCK SAFE TASK ---
function initUnlockTask() {
  const state = activeTask.state;
  state.combo = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
  state.current = 0;
  state.dialAngle = 0;
  state.selectedNum = 0;
  state.done = false;
  state.confirmed = [];
  state.dragging = false;

  function renderUnlock() {
    const tc = taskCtx;
    tc.fillStyle = '#1a1a2e';
    tc.fillRect(0, 0, 350, 250);

    // Safe door
    tc.fillStyle = '#444';
    tc.fillRect(50, 20, 250, 210);
    tc.strokeStyle = '#666';
    tc.lineWidth = 3;
    tc.strokeRect(50, 20, 250, 210);

    // Combo display
    tc.fillStyle = '#fff';
    tc.font = 'bold 14px Arial';
    tc.textAlign = 'center';
    tc.fillText(`Code: ${state.combo.join(' - ')}`, 175, 45);
    tc.fillText(`Turn dial to: ${state.combo[state.current]}`, 175, 65);

    // Dial
    const cx = 175, cy = 145, r = 55;
    tc.fillStyle = '#222';
    tc.beginPath(); tc.arc(cx, cy, r, 0, Math.PI * 2); tc.fill();
    tc.strokeStyle = '#888';
    tc.lineWidth = 2;
    tc.stroke();

    // Numbers around dial
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const nx = cx + Math.cos(a) * (r - 12);
      const ny = cy + Math.sin(a) * (r - 12);
      tc.fillStyle = i === state.combo[state.current] ? '#ffcc00' : '#aaa';
      tc.font = 'bold 12px Arial';
      tc.fillText(String(i), nx, ny + 4);
    }

    // Dial pointer
    const pa = (state.selectedNum / 10) * Math.PI * 2 - Math.PI / 2;
    tc.strokeStyle = '#ff4444';
    tc.lineWidth = 3;
    tc.beginPath();
    tc.moveTo(cx, cy);
    tc.lineTo(cx + Math.cos(pa) * (r - 20), cy + Math.sin(pa) * (r - 20));
    tc.stroke();

    // Confirmed
    tc.fillStyle = '#0f0';
    tc.font = '12px Arial';
    tc.fillText(`Unlocked: ${state.confirmed.join(', ') || 'none'}`, 175, 230);

    if (!state.done) taskAnimFrame = requestAnimationFrame(renderUnlock);
  }

  taskCanvas.onclick = (e) => {
    if (state.done) return;
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width);
    const my = (e.clientY - rect.top) * (250 / rect.height);
    const cx = 175, cy = 145;
    const angle = Math.atan2(my - cy, mx - cx) + Math.PI / 2;
    let num = Math.round(((angle < 0 ? angle + Math.PI * 2 : angle) / (Math.PI * 2)) * 10) % 10;
    state.selectedNum = num;

    if (num === state.combo[state.current]) {
      state.confirmed.push(num);
      state.current++;
      if (state.current >= state.combo.length) {
        state.done = true;
        setTimeout(() => closeTask(true), 500);
      }
    }
  };

  renderUnlock();
}

// --- EMPTY TRASH TASK ---
function initTrashTask() {
  const state = activeTask.state;
  state.holding = false;
  state.progress = 0;
  state.done = false;
  state.lastTime = Date.now();

  function renderTrash() {
    const tc = taskCtx;
    const now = Date.now();
    const dt = (now - state.lastTime) / 1000;
    state.lastTime = now;

    if (state.holding && !state.done) {
      state.progress = Math.min(1, state.progress + dt / 3);
      if (state.progress >= 1) {
        state.done = true;
        setTimeout(() => closeTask(true), 300);
      }
    }

    tc.fillStyle = '#1a1a2e';
    tc.fillRect(0, 0, 350, 250);

    // Trash chute
    tc.fillStyle = '#555';
    tc.fillRect(125, 30, 100, 160);
    tc.strokeStyle = '#777';
    tc.lineWidth = 2;
    tc.strokeRect(125, 30, 100, 160);

    // Trash inside (decreases as progress increases)
    const trashH = 120 * (1 - state.progress);
    tc.fillStyle = '#8B4513';
    tc.fillRect(130, 30 + 155 - trashH, 90, trashH);
    // Trash bits
    if (trashH > 10) {
      tc.fillStyle = '#666';
      tc.fillRect(140, 30 + 155 - trashH + 5, 15, 10);
      tc.fillStyle = '#999';
      tc.fillRect(165, 30 + 155 - trashH + 15, 20, 8);
      tc.fillStyle = '#777';
      tc.fillRect(145, 30 + 155 - trashH + 30, 12, 12);
    }

    // Lever
    const leverY = 200;
    const leverPulled = state.holding;
    tc.fillStyle = '#888';
    tc.fillRect(260, leverY - (leverPulled ? 40 : 0), 20, 50);
    tc.fillStyle = leverPulled ? '#ff4444' : '#cc0000';
    tc.beginPath();
    tc.arc(270, leverY - (leverPulled ? 40 : 0), 15, 0, Math.PI * 2);
    tc.fill();

    // Progress bar
    tc.fillStyle = '#333';
    tc.fillRect(50, 220, 250, 15);
    tc.fillStyle = '#44cc44';
    tc.fillRect(50, 220, 250 * state.progress, 15);
    tc.strokeStyle = '#666';
    tc.strokeRect(50, 220, 250, 15);

    tc.fillStyle = '#fff';
    tc.font = '12px Arial';
    tc.textAlign = 'center';
    tc.fillText(state.done ? 'Done!' : 'Hold lever to empty trash', 175, 15);

    if (!state.done) taskAnimFrame = requestAnimationFrame(renderTrash);
  }

  taskCanvas.onmousedown = () => { state.holding = true; };
  taskCanvas.onmouseup = () => { state.holding = false; };

  renderTrash();
}

// --- MAZE TASK ---
function initMazeTask() {
  const state = activeTask.state;
  const cols = 8, rows = 6, cellW = 350 / cols, cellH = 220 / rows;
  // Generate maze using recursive backtracking
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ top: true, right: true, bottom: true, left: true, visited: false })));
  const stack = [{ r: 0, c: 0 }];
  grid[0][0].visited = true;
  while (stack.length > 0) {
    const { r, c } = stack[stack.length - 1];
    const neighbors = [];
    if (r > 0 && !grid[r - 1][c].visited) neighbors.push({ r: r - 1, c, dir: 'top' });
    if (c < cols - 1 && !grid[r][c + 1].visited) neighbors.push({ r, c: c + 1, dir: 'right' });
    if (r < rows - 1 && !grid[r + 1][c].visited) neighbors.push({ r: r + 1, c, dir: 'bottom' });
    if (c > 0 && !grid[r][c - 1].visited) neighbors.push({ r, c: c - 1, dir: 'left' });
    if (neighbors.length === 0) { stack.pop(); continue; }
    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    if (next.dir === 'top') { grid[r][c].top = false; grid[next.r][next.c].bottom = false; }
    if (next.dir === 'right') { grid[r][c].right = false; grid[next.r][next.c].left = false; }
    if (next.dir === 'bottom') { grid[r][c].bottom = false; grid[next.r][next.c].top = false; }
    if (next.dir === 'left') { grid[r][c].left = false; grid[next.r][next.c].right = false; }
    grid[next.r][next.c].visited = true;
    stack.push(next);
  }
  state.grid = grid;
  state.playerR = 0; state.playerC = 0;
  state.goalR = rows - 1; state.goalC = cols - 1;
  state.dragging = false;

  function renderMaze() {
    const tc = taskCtx;
    tc.fillStyle = '#1a1a2e'; tc.fillRect(0, 0, 350, 250);
    const ox = 0, oy = 15;
    // Draw cells
    tc.strokeStyle = '#4488ff'; tc.lineWidth = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * cellW, y = oy + r * cellH;
        const cell = state.grid[r][c];
        if (cell.top) { tc.beginPath(); tc.moveTo(x, y); tc.lineTo(x + cellW, y); tc.stroke(); }
        if (cell.right) { tc.beginPath(); tc.moveTo(x + cellW, y); tc.lineTo(x + cellW, y + cellH); tc.stroke(); }
        if (cell.bottom) { tc.beginPath(); tc.moveTo(x, y + cellH); tc.lineTo(x + cellW, y + cellH); tc.stroke(); }
        if (cell.left) { tc.beginPath(); tc.moveTo(x, y); tc.lineTo(x, y + cellH); tc.stroke(); }
      }
    }
    // Goal
    tc.fillStyle = '#44ff44';
    tc.fillRect(ox + state.goalC * cellW + cellW * 0.2, oy + state.goalR * cellH + cellH * 0.2, cellW * 0.6, cellH * 0.6);
    // Player
    tc.fillStyle = '#ff4444';
    tc.beginPath();
    tc.arc(ox + state.playerC * cellW + cellW / 2, oy + state.playerR * cellH + cellH / 2, Math.min(cellW, cellH) * 0.3, 0, Math.PI * 2);
    tc.fill();
    tc.fillStyle = '#aaa'; tc.font = '11px Arial'; tc.textAlign = 'center';
    tc.fillText('Tap arrows or swipe to navigate', 175, 248);
    taskAnimFrame = requestAnimationFrame(renderMaze);
  }

  function movePlayer(dr, dc) {
    const cell = state.grid[state.playerR][state.playerC];
    if (dr === -1 && cell.top) return;
    if (dr === 1 && cell.bottom) return;
    if (dc === -1 && cell.left) return;
    if (dc === 1 && cell.right) return;
    state.playerR += dr; state.playerC += dc;
    if (state.playerR === state.goalR && state.playerC === state.goalC) {
      setTimeout(() => closeTask(true), 300);
    }
  }

  let touchStart = null;
  taskCanvas.onmousedown = (e) => { touchStart = { x: e.offsetX, y: e.offsetY }; };
  taskCanvas.onmouseup = (e) => {
    if (!touchStart) return;
    const dx = e.offsetX - touchStart.x, dy = e.offsetY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > Math.abs(dy)) { movePlayer(0, dx > 0 ? 1 : -1); } else { movePlayer(dy > 0 ? 1 : -1, 0); }
  };
  renderMaze();
}

// --- MEMORY MATCH TASK ---
function initMemoryTask() {
  const state = activeTask.state;
  const symbols = ['★', '●', '▲', '■', '◆', '♥'];
  const cards = [...symbols, ...symbols];
  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  state.cards = cards;
  state.revealed = Array(12).fill(false);
  state.matched = Array(12).fill(false);
  state.selected = [];
  state.lockTime = 0;
  const cols = 4, rows = 3, cw = 75, ch = 70, ox = (350 - cols * cw) / 2, oy = (250 - rows * ch) / 2;

  function renderMemory() {
    const tc = taskCtx;
    tc.fillStyle = '#1a1a2e'; tc.fillRect(0, 0, 350, 250);
    for (let i = 0; i < 12; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      const x = ox + c * cw + 5, y = oy + r * ch + 5, w = cw - 10, h = ch - 10;
      if (state.matched[i]) {
        tc.fillStyle = 'rgba(68,255,68,0.2)'; tc.fillRect(x, y, w, h);
        tc.strokeStyle = '#44ff44';
      } else if (state.revealed[i]) {
        tc.fillStyle = '#2a2a4e'; tc.fillRect(x, y, w, h);
        tc.strokeStyle = '#6688ff';
      } else {
        tc.fillStyle = '#3a3a6e'; tc.fillRect(x, y, w, h);
        tc.strokeStyle = '#555';
      }
      tc.lineWidth = 2; tc.strokeRect(x, y, w, h);
      if (state.revealed[i] || state.matched[i]) {
        tc.fillStyle = state.matched[i] ? '#44ff44' : '#ffdd44';
        tc.font = 'bold 24px Arial'; tc.textAlign = 'center';
        tc.fillText(state.cards[i], x + w / 2, y + h / 2 + 8);
      }
    }
    taskAnimFrame = requestAnimationFrame(renderMemory);
  }

  taskCanvas.onclick = (e) => {
    if (Date.now() < state.lockTime) return;
    const rect = taskCanvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (350 / rect.width);
    const sy = (e.clientY - rect.top) * (250 / rect.height);
    const c = Math.floor((sx - ox) / cw), r = Math.floor((sy - oy) / ch);
    if (c < 0 || c >= cols || r < 0 || r >= rows) return;
    const idx = r * cols + c;
    if (state.matched[idx] || state.revealed[idx]) return;
    state.revealed[idx] = true;
    state.selected.push(idx);
    if (state.selected.length === 2) {
      const [a, b] = state.selected;
      if (state.cards[a] === state.cards[b]) {
        state.matched[a] = true; state.matched[b] = true;
        state.selected = [];
        if (state.matched.every(m => m)) setTimeout(() => closeTask(true), 500);
      } else {
        state.lockTime = Date.now() + 800;
        setTimeout(() => { state.revealed[a] = false; state.revealed[b] = false; state.selected = []; }, 800);
      }
    }
  };
  renderMemory();
}

// --- PIPES CONNECT TASK ---
function initPipesTask() {
  const state = activeTask.state;
  const cols = 5, rows = 4;
  // Pipe types: 0=straight-h, 1=straight-v, 2=corner-tr, 3=corner-br, 4=corner-bl, 5=corner-tl
  const types = [0, 1, 2, 3, 4, 5];
  state.grid = [];
  // Generate a solvable pipe path from left to right
  let path = [{ r: Math.floor(rows / 2), c: 0 }];
  let cr = path[0].r, cc = 0;
  while (cc < cols - 1) {
    const moves = [];
    if (cr > 0 && !path.find(p => p.r === cr - 1 && p.c === cc)) moves.push({ r: cr - 1, c: cc });
    if (cr < rows - 1 && !path.find(p => p.r === cr + 1 && p.c === cc)) moves.push({ r: cr + 1, c: cc });
    if (!path.find(p => p.r === cr && p.c === cc + 1)) moves.push({ r: cr, c: cc + 1 });
    if (moves.length === 0) { cc++; path.push({ r: cr, c: cc }); continue; }
    const next = moves[Math.floor(Math.random() * moves.length)];
    path.push(next); cr = next.r; cc = next.c;
  }
  // Build grid with random rotations
  for (let r = 0; r < rows; r++) {
    state.grid[r] = [];
    for (let c = 0; c < cols; c++) {
      state.grid[r][c] = { rotation: Math.floor(Math.random() * 4), onPath: !!path.find(p => p.r === r && p.c === c) };
    }
  }
  state.startR = path[0].r; state.endR = path[path.length - 1].r;
  state.solveCheck = 0;

  const cellW = 350 / cols, cellH = 220 / rows, oy = 15;

  function renderPipes() {
    const tc = taskCtx;
    tc.fillStyle = '#1a1a2e'; tc.fillRect(0, 0, 350, 250);
    // Start/end indicators
    tc.fillStyle = '#44ff44'; tc.fillRect(0, oy + state.startR * cellH + cellH * 0.3, 8, cellH * 0.4);
    tc.fillStyle = '#ff4444'; tc.fillRect(342, oy + state.endR * cellH + cellH * 0.3, 8, cellH * 0.4);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW, y = oy + r * cellH;
        const cell = state.grid[r][c];
        tc.strokeStyle = cell.onPath ? '#4488ff' : '#333'; tc.lineWidth = 1;
        tc.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);
        // Draw pipe based on rotation
        tc.save();
        tc.translate(x + cellW / 2, y + cellH / 2);
        tc.rotate(cell.rotation * Math.PI / 2);
        tc.strokeStyle = cell.onPath ? '#66bbff' : '#555'; tc.lineWidth = 6; tc.lineCap = 'round';
        // Elbow shape (connects top to right)
        tc.beginPath();
        tc.moveTo(0, -cellH / 2 + 5); tc.lineTo(0, 0); tc.lineTo(cellW / 2 - 5, 0);
        tc.stroke();
        tc.restore();
      }
    }
    tc.fillStyle = '#aaa'; tc.font = '10px Arial'; tc.textAlign = 'center';
    tc.fillText('Tap tiles to rotate pipes', 175, 248);
    taskAnimFrame = requestAnimationFrame(renderPipes);
  }

  taskCanvas.onclick = (e) => {
    const rect = taskCanvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (350 / rect.width);
    const sy = (e.clientY - rect.top) * (250 / rect.height);
    const c = Math.floor(sx / cellW), r = Math.floor((sy - oy) / cellH);
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    state.grid[r][c].rotation = (state.grid[r][c].rotation + 1) % 4;
    // Check if all path cells have correct rotation (simplified: after enough clicks, auto-complete)
    state.solveCheck++;
    if (state.solveCheck >= cols * rows) {
      setTimeout(() => closeTask(true), 500);
    }
  };
  renderPipes();
}

// --- TRACE PATTERN TASK ---
function initTraceTask() {
  const state = activeTask.state;
  // Generate a star/zigzag pattern
  const cx = 175, cy = 115, r = 80;
  const points = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const dist = i % 2 === 0 ? r : r * 0.45;
    points.push({ x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist });
  }
  state.points = points;
  state.progress = 0;
  state.tracing = false;
  state.nextIdx = 0;

  function renderTrace() {
    const tc = taskCtx;
    tc.fillStyle = '#1a1a2e'; tc.fillRect(0, 0, 350, 250);
    // Draw dotted pattern
    tc.setLineDash([5, 5]);
    tc.strokeStyle = '#335588'; tc.lineWidth = 3;
    tc.beginPath();
    tc.moveTo(state.points[0].x, state.points[0].y);
    for (let i = 1; i < state.points.length; i++) tc.lineTo(state.points[i].x, state.points[i].y);
    tc.closePath(); tc.stroke();
    tc.setLineDash([]);
    // Draw completed portion
    if (state.nextIdx > 0) {
      tc.strokeStyle = '#44ff44'; tc.lineWidth = 4;
      tc.beginPath();
      tc.moveTo(state.points[0].x, state.points[0].y);
      for (let i = 1; i <= state.nextIdx && i < state.points.length; i++) tc.lineTo(state.points[i].x, state.points[i].y);
      tc.stroke();
    }
    // Draw checkpoints
    for (let i = 0; i < state.points.length; i++) {
      tc.fillStyle = i < state.nextIdx ? '#44ff44' : (i === state.nextIdx ? '#ffdd44' : '#555');
      tc.beginPath(); tc.arc(state.points[i].x, state.points[i].y, 6, 0, Math.PI * 2); tc.fill();
    }
    // Progress bar
    tc.fillStyle = '#333'; tc.fillRect(50, 225, 250, 12);
    tc.fillStyle = '#44ff44'; tc.fillRect(50, 225, 250 * (state.nextIdx / state.points.length), 12);
    tc.fillStyle = '#aaa'; tc.font = '10px Arial'; tc.textAlign = 'center';
    tc.fillText('Tap each point in order', 175, 248);
    if (state.nextIdx < state.points.length) taskAnimFrame = requestAnimationFrame(renderTrace);
  }

  taskCanvas.onclick = (e) => {
    if (state.nextIdx >= state.points.length) return;
    const rect = taskCanvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (350 / rect.width);
    const sy = (e.clientY - rect.top) * (250 / rect.height);
    const target = state.points[state.nextIdx];
    const dx = sx - target.x, dy = sy - target.y;
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      state.nextIdx++;
      if (state.nextIdx >= state.points.length) {
        setTimeout(() => closeTask(true), 500);
      }
    }
  };
  renderTrace();
}

// --- MEDBAY SCAN TASK ---
function initScanTask() {
  const state = activeTask.state;
  state.progress = 0;
  state.scanY = 0;
  state.scanDir = 1;
  state.done = false;
  state.lastTime = Date.now();

  function renderScan() {
    const tc = taskCtx;
    const now = Date.now();
    const dt = (now - state.lastTime) / 1000;
    state.lastTime = now;

    if (!state.done) {
      state.progress = Math.min(1, state.progress + dt / 10);
      state.scanY += state.scanDir * dt * 100;
      if (state.scanY > 180) state.scanDir = -1;
      if (state.scanY < 0) state.scanDir = 1;
      if (state.progress >= 1) {
        state.done = true;
        setTimeout(() => closeTask(true), 500);
      }
    }

    tc.fillStyle = '#0a0a1a'; tc.fillRect(0, 0, 350, 250);
    // Body outline
    tc.strokeStyle = '#224466'; tc.lineWidth = 2;
    tc.beginPath();
    tc.ellipse(175, 120, 35, 75, 0, 0, Math.PI * 2); tc.stroke();
    // Head
    tc.beginPath(); tc.arc(175, 40, 18, 0, Math.PI * 2); tc.stroke();
    // Arms
    tc.beginPath(); tc.moveTo(140, 70); tc.lineTo(115, 130); tc.stroke();
    tc.beginPath(); tc.moveTo(210, 70); tc.lineTo(235, 130); tc.stroke();
    // Legs
    tc.beginPath(); tc.moveTo(160, 195); tc.lineTo(150, 230); tc.stroke();
    tc.beginPath(); tc.moveTo(190, 195); tc.lineTo(200, 230); tc.stroke();
    // Scan line
    if (!state.done) {
      tc.strokeStyle = '#00ff88'; tc.lineWidth = 3;
      const sy = 20 + state.scanY;
      tc.beginPath(); tc.moveTo(100, sy); tc.lineTo(250, sy); tc.stroke();
      tc.fillStyle = `rgba(0, 255, 136, ${0.1 + Math.sin(now / 200) * 0.05})`;
      tc.fillRect(100, sy - 10, 150, 20);
    }
    // Progress bar
    tc.fillStyle = '#222'; tc.fillRect(50, 225, 250, 14);
    tc.fillStyle = state.done ? '#44ff44' : '#00ccff'; tc.fillRect(50, 225, 250 * state.progress, 14);
    tc.strokeStyle = '#555'; tc.strokeRect(50, 225, 250, 14);
    tc.fillStyle = '#fff'; tc.font = '12px Arial'; tc.textAlign = 'center';
    tc.fillText(state.done ? 'SCAN COMPLETE' : `SCANNING... ${Math.round(state.progress * 100)}%`, 175, 217);
    if (!state.done) taskAnimFrame = requestAnimationFrame(renderScan);
  }
  renderScan();
}

// --- SAFE CRACKING TASK ---
function initSafeTask() {
  const state = activeTask.state;
  state.combo = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
  state.current = 0;
  state.angle = 0;
  state.confirmed = [];
  state.dragging = false;
  state.lastAngle = 0;
  state.done = false;

  const cx = 175, cy = 110, r = 80;

  function renderSafe() {
    const tc = taskCtx;
    tc.fillStyle = '#1a1a2e'; tc.fillRect(0, 0, 350, 250);
    // Safe body
    tc.fillStyle = '#444'; tc.fillRect(95, 25, 160, 175);
    tc.strokeStyle = '#666'; tc.lineWidth = 3; tc.strokeRect(95, 25, 160, 175);
    // Dial
    tc.fillStyle = '#222';
    tc.beginPath(); tc.arc(cx, cy, r, 0, Math.PI * 2); tc.fill();
    tc.strokeStyle = '#888'; tc.lineWidth = 2;
    tc.beginPath(); tc.arc(cx, cy, r, 0, Math.PI * 2); tc.stroke();
    // Numbers around dial
    tc.fillStyle = '#aaa'; tc.font = 'bold 12px Arial'; tc.textAlign = 'center';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      tc.fillText(String(i), cx + Math.cos(a) * (r - 15), cy + Math.sin(a) * (r - 15) + 4);
    }
    // Pointer
    const pAngle = (state.angle / 10) * Math.PI * 2 - Math.PI / 2;
    tc.strokeStyle = '#ff4444'; tc.lineWidth = 3;
    tc.beginPath(); tc.moveTo(cx, cy); tc.lineTo(cx + Math.cos(pAngle) * (r - 25), cy + Math.sin(pAngle) * (r - 25)); tc.stroke();
    // Marker at top
    tc.fillStyle = '#ff4444';
    tc.beginPath(); tc.moveTo(cx, cy - r - 5); tc.lineTo(cx - 6, cy - r - 15); tc.lineTo(cx + 6, cy - r - 15); tc.fill();
    // Info
    tc.fillStyle = '#ffdd44'; tc.font = 'bold 14px Arial';
    tc.fillText(`Code: ${state.combo.join(' - ')}`, 175, 218);
    tc.fillStyle = '#aaa'; tc.font = '11px Arial';
    tc.fillText(`Turn to: ${state.combo[state.current]}`, 175, 235);
    tc.fillText(`Unlocked: ${state.confirmed.join(', ') || 'none'}`, 175, 248);
    if (!state.done) taskAnimFrame = requestAnimationFrame(renderSafe);
  }

  taskCanvas.onmousedown = (e) => {
    state.dragging = true;
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width) - cx;
    const my = (e.clientY - rect.top) * (250 / rect.height) - cy;
    state.lastAngle = Math.atan2(my, mx);
  };
  taskCanvas.onmousemove = (e) => {
    if (!state.dragging || state.done) return;
    const rect = taskCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (350 / rect.width) - cx;
    const my = (e.clientY - rect.top) * (250 / rect.height) - cy;
    const newAngle = Math.atan2(my, mx);
    let delta = (newAngle - state.lastAngle) / (Math.PI * 2) * 10;
    state.angle = ((state.angle + delta) % 10 + 10) % 10;
    state.lastAngle = newAngle;
  };
  taskCanvas.onmouseup = () => {
    if (!state.dragging || state.done) return;
    state.dragging = false;
    const rounded = Math.round(state.angle) % 10;
    if (rounded === state.combo[state.current]) {
      state.confirmed.push(rounded);
      state.current++;
      if (state.current >= state.combo.length) {
        state.done = true;
        setTimeout(() => closeTask(true), 500);
      }
    }
  };
  renderSafe();
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
  // Auto-rejoin if we had a session (mobile reconnect after minimize/screen off)
  const savedRoom = sessionStorage.getItem('sb_room');
  const savedName = sessionStorage.getItem('sb_name');
  if (savedRoom && savedName && gamePhase !== 'menu') {
    socket.emit('rejoinRoom', { code: savedRoom, name: savedName });
  }
});

socket.on('rejoinFailed', () => {
  sessionStorage.removeItem('sb_room');
  sessionStorage.removeItem('sb_name');
  gamePhase = 'menu';
  showScreen(menuScreen);
});

socket.on('roomCreated', ({ code, player, settings: s }) => {
  roomCode = code;
  sessionStorage.setItem('sb_room', code);
  sessionStorage.setItem('sb_name', player.name);
  settings = s;
  isHost = socket.id;
  gamePhase = 'lobby';
  myHatIndex = 0;
  myOutfitIndex = 0;
  myPetIndex = 0;
  myAvatarData = null;
  avatarCache.clear();
  avatarLabel.textContent = typeof t === 'function' ? t('noPhoto') : 'No photo';
  avatarRemoveBtn.style.display = 'none';
  hatLabel.textContent = typeof tHat === 'function' ? tHat(HATS[0]) : HAT_NAMES[HATS[0]];
  outfitLabel.textContent = OUTFIT_NAMES[OUTFITS[0]];
  petLabel.textContent = PET_NAMES[PETS[0]];
  showScreen(lobbyScreen);
  updateLobbyUI([player]);
  updateMusic();
  if (player.avatar) cacheAvatar(player.id, player.avatar);
});

socket.on('roomJoined', ({ code, players: pList, settings: s, host }) => {
  roomCode = code;
  sessionStorage.setItem('sb_room', code);
  const me = pList.find(p => p.id === socket.id);
  if (me) sessionStorage.setItem('sb_name', me.name);
  settings = s;
  isHost = host;
  gamePhase = 'lobby';
  myHatIndex = 0;
  myOutfitIndex = 0;
  myPetIndex = 0;
  myAvatarData = null;
  avatarCache.clear();
  avatarLabel.textContent = typeof t === 'function' ? t('noPhoto') : 'No photo';
  avatarRemoveBtn.style.display = 'none';
  hatLabel.textContent = typeof tHat === 'function' ? tHat(HATS[0]) : HAT_NAMES[HATS[0]];
  outfitLabel.textContent = OUTFIT_NAMES[OUTFITS[0]];
  petLabel.textContent = PET_NAMES[PETS[0]];
  showScreen(lobbyScreen);
  updateLobbyUI(pList);
  pList.forEach(p => { if (p.avatar) cacheAvatar(p.id, p.avatar); });
});

socket.on('joinError', ({ message }) => {
  menuError.textContent = message;
});

socket.on('playerJoined', (player) => {
  lobbyPlayers_data.push(player);
  if (player.avatar) cacheAvatar(player.id, player.avatar);
  // Just re-query from server -- for simplicity, add new player
  const li = document.createElement('li');
  li.innerHTML = `<span class="player-color" style="background:${player.color}"></span>
    <span class="player-name">${escapeHtml(player.name)}</span>`;
  lobbyPlayers.appendChild(li);
  lobbyCount.textContent = typeof t === 'function' ? t('players10')(lobbyPlayers.children.length) : `${lobbyPlayers.children.length} / 10 players`;
  if (socket.id === isHost) {
    startBtn.disabled = lobbyPlayers.children.length < 3;
  }
});

socket.on('skinChanged', ({ playerId, hat, outfit, pet }) => {
  const p = lobbyPlayers_data.find(pl => pl.id === playerId);
  if (p) {
    p.hat = hat;
    p.outfit = outfit;
    if (pet !== undefined) p.pet = pet;
  }
});

socket.on('avatarChanged', ({ playerId, avatar }) => {
  cacheAvatar(playerId, avatar);
});

socket.on('ventTeleport', ({ x, y }) => {
  const me = players.find(p => p.id === myId);
  if (me) { me.x = x; me.y = y; }
  spawnParticle(x, y, 'spark');
});

socket.on('playerLeft', ({ playerId }) => {
  lobbyPlayers_data = lobbyPlayers_data.filter(p => p.id !== playerId);
  avatarCache.delete(playerId);
  if (gamePhase === 'lobby') {
    updateLobbyUI(lobbyPlayers_data);
  }
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

socket.on('gameStarted', ({ role, specialRole, tasks, players: pList, otherImpostors: otherImp, settings: s, gameMode }) => {
  // Switch map based on settings
  MAP = (s.mapName === 'beta') ? MAP_BETA : MAP_ALPHA;
  myRole = role;
  mySpecialRole = specialRole || null;
  engineerVentsLeft = 3;
  vitalsData = null;
  vitalsShowUntil = 0;
  watchingCameras = false;
  cameraFeed = null;
  viewingAdminTable = false;
  adminTableData = null;
  myTasks = tasks;
  players = pList;
  settings = s;
  otherImpostors = otherImp || [];
  bodies = [];
  taskBar = 0;
  petPositions.clear();
  gamePhase = 'playing';
  currentGameMode = gameMode || 'classic';
  speedrunStartTime = currentGameMode === 'speedrun' ? Date.now() : 0;
  headStartEnd = currentGameMode === 'hideseek' ? Date.now() + 10000 : 0; // 10s head start
  showScreen(null);
  pList.forEach(p => { if (p.avatar) cacheAvatar(p.id, p.avatar); });

  // Show voice button during gameplay
  const vb = document.getElementById('voice-btn');
  if (vb) vb.style.display = 'block';

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

  // Hide & Seek: impostor role is already sent in player data from server
  // Mark all players with their roles for visibility
  if (currentGameMode === 'hideseek') {
    for (const p of pList) {
      const existing = players.find(pl => pl.id === p.id);
      if (existing && p.role) existing.role = p.role;
    }
  }

  // Show role flash
  roleFlash = { active: true, startTime: Date.now(), role: myRole };

  // Track stats
  incrementStat('gamesPlayed');
  if (myRole === 'impostor') incrementStat('timesImpostor');
});

// Infection mode: you got infected
socket.on('infected', ({ role }) => {
  myRole = role;
  const me = players.find(p => p.id === myId);
  if (me) me.role = 'impostor';
  // Show infected flash
  roleFlash = { active: true, startTime: Date.now(), role: 'infected' };
  if (typeof playSound === 'function') playSound('alarm');
});

// Infection mode: another player got infected
socket.on('playerInfected', ({ playerId, infectorId }) => {
  const victim = players.find(p => p.id === playerId);
  if (victim) victim.role = 'impostor';
  // Spawn infection particles at victim location
  if (victim) {
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: victim.x + (Math.random() - 0.5) * 30,
        y: victim.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        color: '#44ff44',
        size: 3 + Math.random() * 4,
      });
    }
  }
});

socket.on('gameState', ({ players: pList, bodies: bList, taskBar: tb, sabotage: sab, doors: doorData }) => {
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
  if (sab) {
    activeSabotage = sab;
  }
  if (doorData) {
    doorStates = doorData;
  }
});

socket.on('playerKilled', ({ victimId, body, killerId, killerColor, victimColor, animType }) => {
  const victim = players.find(p => p.id === victimId);
  if (victim) {
    victim.alive = false;
    killFlashes.push({ x: body.x, y: body.y, time: Date.now() });
    spawnParticle(body.x, body.y, 'kill');
    screenShake.trauma = Math.min(1, screenShake.trauma + 0.6);
  }
  if (victimId === myId || killerId === myId) {
    screenShake.trauma = 1;
    // Show kill animation for killer and victim
    showKillAnimation(killerColor || '#ff0000', victimColor || '#ffffff', animType || 'knife');
  }
});

socket.on('meetingStarted', ({ callerName, reportedBody, players: meetingPlayers, phase, duration }) => {
  gamePhase = 'meeting';
  chatMessages.innerHTML = '';
  chatInput.value = '';
  if (typeof clearDrawBoard === 'function') clearDrawBoard();

  if (reportedBody) {
    meetingHeader.textContent = typeof t === 'function' ? t('reportedBody')(callerName) : `${callerName} reported a dead body!`;
    meetingHeader.style.color = '#ffaa00';
  } else {
    meetingHeader.textContent = typeof t === 'function' ? t('calledMeeting')(callerName) : `${callerName} called an Emergency Meeting!`;
    meetingHeader.style.color = '#ff4444';
  }

  meetingPhaseLabel.textContent = typeof t === 'function' ? t('discussionPhase') : 'Discussion phase - talk it out!';
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
  meetingPhaseLabel.textContent = typeof t === 'function' ? t('voteNow') : 'Vote now!';
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
    resultText.textContent = typeof t === 'function' ? t('noOneEjected') : 'No one was ejected.';
    resultText.style.color = '#aaa';
    resultRole.textContent = typeof t === 'function' ? t('skipped') : '(Skipped)';
    resultRole.style.color = '#888';
  } else {
    const ejectedText = typeof t === 'function' ? t('wasEjected')(ejectedName) : `${ejectedName} was ejected.`;
    resultText.innerHTML = `<span style="color:${ejectedColor}">${escapeHtml(ejectedName)}</span> ${ejectedText.replace(ejectedName, '').trim()}`;
    if (ejectedRole === 'impostor') {
      resultRole.textContent = typeof t === 'function' ? t('wasImpostor')(ejectedName) : `${ejectedName} was an Impostor.`;
      resultRole.style.color = '#ff4444';
    } else {
      resultRole.textContent = typeof t === 'function' ? t('wasNotImpostor')(ejectedName) : `${ejectedName} was not an Impostor.`;
      resultRole.style.color = '#44ff44';
    }
  }
});

socket.on('resumeGame', () => {
  gamePhase = 'playing';
  showScreen(null);
});

socket.on('doorStateChanged', ({ doorId, closed }) => {
  const ds = doorStates.find(d => d.id === doorId);
  if (ds) ds.closed = closed;
  else doorStates.push({ id: doorId, closed });
});

socket.on('playerEmote', ({ playerId, emoteId }) => {
  floatingMessages.push({ playerId, emoji: EMOTES[emoteId], startTime: Date.now(), duration: 2500 });
});

socket.on('playerQuickChat', ({ playerId, messageId }) => {
  floatingMessages.push({ playerId, text: getQuickMessages()[messageId] || QUICK_MESSAGES[messageId], startTime: Date.now(), duration: 3000 });
});

socket.on('sabotageStarted', ({ type, timeLeft }) => {
  activeSabotage = { type, timeLeft, fixProgress: 0 };
  sabotageMenuOpen = false;
  if (typeof playSound === 'function') playSound('alarm');
});

socket.on('sabotageFixed', () => {
  activeSabotage = null;
});

socket.on('sabotageProgress', ({ type, panelsFixed }) => {
  // Update sabotage fix progress display
  if (activeSabotage && activeSabotage.type === type) {
    activeSabotage.panelsFixed = panelsFixed;
  }
});

socket.on('engineerVentsLeft', ({ remaining }) => {
  engineerVentsLeft = remaining;
});

socket.on('vitalsData', ({ vitals }) => {
  vitalsData = vitals;
  vitalsShowUntil = Date.now() + 5000; // show for 5 seconds
});

socket.on('cameraWatcher', ({ watching }) => {
  cameraWatcherActive = watching;
});

socket.on('cameraFeed', ({ feed }) => {
  cameraFeed = feed;
});

// Poll camera feed while watching
setInterval(() => {
  if (watchingCameras) socket.emit('requestCameraFeed');
  if (viewingAdminTable) socket.emit('requestAdminTable');
}, 500);

socket.on('adminTableData', ({ occupancy }) => {
  adminTableData = occupancy;
});

socket.on('meetingChatMessage', ({ name, color, message, ghost }) => {
  const me = players.find(p => p.id === myId);
  const myAlive = me ? me.alive : false;
  // Living players don't see ghost messages
  if (ghost && myAlive) return;

  const div = document.createElement('div');
  div.className = 'chat-msg' + (ghost ? ' chat-ghost' : '');
  const nameSpan = document.createElement('span');
  nameSpan.className = 'chat-name';
  nameSpan.style.color = color;
  nameSpan.textContent = name + ':';
  const textNode = document.createTextNode(' ' + message);
  div.appendChild(nameSpan);
  div.appendChild(textNode);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// ============================================
// MEETING DRAWING BOARD
// ============================================
const drawCanvas = document.getElementById('meeting-draw-canvas');
const drawCtx = drawCanvas ? drawCanvas.getContext('2d') : null;
let drawColor = '#ffffff';
let drawIsEraser = false;
let drawIsDrawing = false;
let drawPoints = [];
let drawLastSend = 0;

function clearDrawBoard() {
  if (drawCtx) {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  }
}

function drawStroke(points, color) {
  if (!drawCtx || points.length < 2) return;
  drawCtx.strokeStyle = color;
  drawCtx.lineWidth = color === '#1a1a2e' ? 12 : 3;
  drawCtx.lineCap = 'round';
  drawCtx.lineJoin = 'round';
  drawCtx.beginPath();
  drawCtx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    drawCtx.lineTo(points[i].x, points[i].y);
  }
  drawCtx.stroke();
}

function getDrawPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = drawCanvas.width / rect.width;
  const scaleY = drawCanvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

if (drawCanvas) {
  // Color buttons
  document.querySelectorAll('.draw-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      drawColor = btn.dataset.color;
      drawIsEraser = false;
      document.querySelectorAll('.draw-color-btn').forEach(b => b.style.borderColor = '#555');
      btn.style.borderColor = '#fff';
      const eraserBtn = document.getElementById('draw-eraser');
      if (eraserBtn) eraserBtn.style.background = '';
    });
  });
  // Default first color selected
  const firstColorBtn = document.querySelector('.draw-color-btn');
  if (firstColorBtn) firstColorBtn.style.borderColor = '#fff';

  const eraserBtn = document.getElementById('draw-eraser');
  if (eraserBtn) {
    eraserBtn.addEventListener('click', () => {
      drawIsEraser = true;
      drawColor = '#1a1a2e'; // background color = eraser
      document.querySelectorAll('.draw-color-btn').forEach(b => b.style.borderColor = '#555');
      eraserBtn.style.background = '#555';
    });
  }

  const clearBtnDraw = document.getElementById('draw-clear');
  if (clearBtnDraw) {
    clearBtnDraw.addEventListener('click', () => {
      clearDrawBoard();
      socket.emit('meetingDraw', { clear: true });
    });
  }

  // Drawing events
  function startDraw(e) {
    if (gamePhase !== 'meeting' && gamePhase !== 'voting') return;
    const me = players.find(p => p.id === myId);
    if (!me || !me.alive) return;
    drawIsDrawing = true;
    drawPoints = [getDrawPos(e)];
    e.preventDefault();
  }
  function moveDraw(e) {
    if (!drawIsDrawing) return;
    const pos = getDrawPos(e);
    drawPoints.push(pos);
    // Draw locally
    if (drawPoints.length >= 2) {
      drawStroke(drawPoints.slice(-2), drawColor);
    }
    // Send periodically (every 80ms)
    const now = Date.now();
    if (now - drawLastSend > 80 && drawPoints.length >= 2) {
      socket.emit('meetingDraw', { points: drawPoints, color: drawColor });
      drawLastSend = now;
      drawPoints = [pos]; // keep last point for continuity
    }
    e.preventDefault();
  }
  function endDraw(e) {
    if (!drawIsDrawing) return;
    drawIsDrawing = false;
    if (drawPoints.length >= 2) {
      socket.emit('meetingDraw', { points: drawPoints, color: drawColor });
    }
    drawPoints = [];
  }

  drawCanvas.addEventListener('mousedown', startDraw);
  drawCanvas.addEventListener('mousemove', moveDraw);
  drawCanvas.addEventListener('mouseup', endDraw);
  drawCanvas.addEventListener('mouseleave', endDraw);
  drawCanvas.addEventListener('touchstart', startDraw, { passive: false });
  drawCanvas.addEventListener('touchmove', moveDraw, { passive: false });
  drawCanvas.addEventListener('touchend', endDraw);
}

// Receive drawings from other players
socket.on('meetingDrawData', ({ points, color, clear }) => {
  if (clear) {
    clearDrawBoard();
    return;
  }
  if (points && points.length >= 2) {
    drawStroke(points, color);
  }
});

socket.on('taskUpdate', ({ taskBar: tb }) => {
  taskBar = tb;
});

socket.on('gameOver', ({ winner, reason, roles, stats }) => {
  gamePhase = 'gameover';
  activeSabotage = null;
  showScreen(gameoverScreen);
  // Hide voice button
  const vbtn = document.getElementById('voice-btn');
  if (vbtn) vbtn.style.display = 'none';
  startConfetti(winner === 'crewmates' ? '#44ff44' : '#ff4444');

  gameoverPanel.className = 'gameover-panel ' + winner;

  if (winner === 'crewmates') {
    winTitle.textContent = typeof t === 'function' ? t('crewmatesWin') : 'CREWMATES WIN';
    winTitle.style.color = '#44ff44';
  } else {
    winTitle.textContent = typeof t === 'function' ? t('impostorsWin') : 'IMPOSTORS WIN';
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

  // Show stats
  let statsEl = document.getElementById('gameover-stats');
  if (!statsEl) {
    statsEl = document.createElement('div');
    statsEl.id = 'gameover-stats';
    statsEl.style.cssText = 'margin-top:12px;font-size:0.85em;color:#ccc;text-align:center;';
    roleList.parentNode.insertBefore(statsEl, lobbyBtn.parentNode === roleList.parentNode ? lobbyBtn : null);
  }
  statsEl.innerHTML = '';
  if (stats) {
    // Top killer
    const topKiller = Object.values(stats.kills || {}).sort((a, b) => b.count - a.count)[0];
    if (topKiller) {
      statsEl.innerHTML += `<div style="margin:4px 0"><span style="color:${topKiller.color}">${escapeHtml(topKiller.name)}</span> — ${topKiller.count} kill${topKiller.count > 1 ? 's' : ''}</div>`;
    }
    // Top task completer
    const topTasker = Object.values(stats.tasksCompleted || {}).sort((a, b) => b.count - a.count)[0];
    if (topTasker) {
      statsEl.innerHTML += `<div style="margin:4px 0"><span style="color:${topTasker.color}">${escapeHtml(topTasker.name)}</span> — ${topTasker.count} task${topTasker.count > 1 ? 's' : ''} completed</div>`;
    }
  }

  if (socket.id === isHost) {
    lobbyBtn.style.display = 'inline-block';
    leaveBtn.style.display = 'none';
    gameoverWait.style.display = 'none';
  } else {
    lobbyBtn.style.display = 'none';
    leaveBtn.style.display = 'inline-block';
    gameoverWait.style.display = 'block';
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
  currentGameMode = 'classic';
  // Restore skin indices and avatar from server data
  const me = pList.find(p => p.id === socket.id);
  if (me) {
    myHatIndex = HATS.indexOf(me.hat) >= 0 ? HATS.indexOf(me.hat) : 0;
    myOutfitIndex = OUTFITS.indexOf(me.outfit) >= 0 ? OUTFITS.indexOf(me.outfit) : 0;
    myPetIndex = PETS.indexOf(me.pet) >= 0 ? PETS.indexOf(me.pet) : 0;
    updateHatLabel();
    outfitLabel.textContent = typeof tOutfit === 'function' ? tOutfit(OUTFITS[myOutfitIndex]) : OUTFIT_NAMES[OUTFITS[myOutfitIndex]];
    petLabel.textContent = typeof tPet === 'function' ? tPet(PETS[myPetIndex]) : PET_NAMES[PETS[myPetIndex]];
    if (me.avatar) {
      myAvatarData = me.avatar;
      avatarLabel.textContent = typeof t === 'function' ? t('uploaded') : 'Uploaded!';
      avatarRemoveBtn.style.display = 'inline-block';
    } else {
      myAvatarData = null;
      avatarLabel.textContent = typeof t === 'function' ? t('noPhoto') : 'No photo';
      avatarRemoveBtn.style.display = 'none';
    }
  }
  avatarCache.clear();
  pList.forEach(p => { if (p.avatar) cacheAvatar(p.id, p.avatar); });
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

// Settings change handlers
['set-impostors', 'set-killcd', 'set-speed', 'set-tasks', 'set-discuss', 'set-voting', 'set-crewvision', 'set-impvision', 'set-confirmeject', 'set-anonvotes', 'set-specialroles', 'set-map', 'set-gamemode'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', () => {
      socket.emit('updateSettings', {
        numImpostors: parseInt(document.getElementById('set-impostors').value),
        killCooldown: parseInt(document.getElementById('set-killcd').value),
        playerSpeed: parseInt(document.getElementById('set-speed').value),
        taskCount: parseInt(document.getElementById('set-tasks').value),
        discussionTime: parseInt(document.getElementById('set-discuss').value),
        votingTime: parseInt(document.getElementById('set-voting').value),
        crewmateVision: parseFloat(document.getElementById('set-crewvision').value),
        impostorVision: parseFloat(document.getElementById('set-impvision').value),
        confirmEjects: document.getElementById('set-confirmeject').value === '1',
        anonymousVotes: document.getElementById('set-anonvotes').value === '1',
        specialRoles: document.getElementById('set-specialroles').value === '1',
        mapName: document.getElementById('set-map').value,
        gameMode: document.getElementById('set-gamemode').value,
      });
    });
  }
});

socket.on('settingsUpdated', (s) => {
  settings = s;
  // Sync settings UI for non-host
  const setMap = document.getElementById('set-map');
  if (setMap && s.mapName) setMap.value = s.mapName;
  const setSpec = document.getElementById('set-specialroles');
  if (setSpec) setSpec.value = s.specialRoles ? '1' : '0';
  const setGM = document.getElementById('set-gamemode');
  if (setGM && s.gameMode) setGM.value = s.gameMode;
});

lobbyBtn.addEventListener('click', () => {
  socket.emit('returnToLobby');
});

leaveBtn.addEventListener('click', () => {
  sessionStorage.removeItem('sb_room');
  sessionStorage.removeItem('sb_name');
  if (voiceEnabled) stopVoiceChat();
  socket.disconnect();
  socket.connect();
  showScreen(menuScreen);
  gamePhase = 'menu';
});

// Voice chat button
const voiceBtn = document.getElementById('voice-btn');
if (voiceBtn) {
  voiceBtn.addEventListener('click', () => {
    if (!voiceEnabled) {
      initVoiceChat();
    } else if (voiceMuted) {
      toggleVoiceMute(); // unmute
    } else {
      toggleVoiceMute(); // mute
    }
  });
  // Long press to stop voice entirely
  let voiceLongPress = null;
  voiceBtn.addEventListener('mousedown', () => {
    voiceLongPress = setTimeout(() => { if (voiceEnabled) stopVoiceChat(); }, 1500);
  });
  voiceBtn.addEventListener('mouseup', () => clearTimeout(voiceLongPress));
  voiceBtn.addEventListener('mouseleave', () => clearTimeout(voiceLongPress));
}

// Meeting chat send
function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  socket.emit('meetingChat', { message: text });
  chatInput.value = '';
}
chatSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); }
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
  // Update mobile action buttons every frame for instant responsiveness
  if (typeof updateMobileActionButtons === 'function') updateMobileActionButtons();
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

let _lastMobileBtnKey = '';
let _mobileBtnActions = {}; // label -> action, updated every frame without DOM rebuild
let _lastMobileActionTime = 0; // debounce guard against double-fire

function updateMobileActionButtons() {
  if (!isMobile) return;
  const me = players.find(p => p.id === myId);
  if (!me || gamePhase !== 'playing') {
    if (_lastMobileBtnKey !== '') {
      mobileActions.innerHTML = '';
      _lastMobileBtnKey = '';
      _mobileBtnActions = {};
    }
    return;
  }

  const btns = [];
  const isGhost = !me.alive;

  // Kill button — ALWAYS visible for impostor so it's always tappable
  // Shows red when active (target in range + no cooldown), grey when disabled
  if (!isGhost && myRole === 'impostor') {
    let hasTarget = false;
    for (const p of players) {
      if (p.id !== myId && p.alive && p.role !== 'impostor' && distance(me, p) < KILL_RANGE) {
        hasTarget = true; break;
      }
    }
    const killReady = hasTarget && (!me.killCooldown || me.killCooldown <= 0);
    const cooldownText = me.killCooldown > 0 ? Math.ceil(me.killCooldown) + 's' : '';
    btns.push({
      label: cooldownText ? `KILL ${cooldownText}` : 'KILL',
      actionKey: 'KILL', // stable key for action lookup (label changes with cooldown)
      bg: killReady ? '#cc0000' : '#444444',
      disabled: !killReady,
      action: () => { if (killReady) socket.emit('doKill'); },
    });
  }

  // Sheriff shoot button — ALWAYS visible for sheriff so it's always tappable
  if (!isGhost && mySpecialRole === 'sheriff' && myRole === 'crewmate') {
    let hasTarget = false;
    for (const p of players) {
      if (p.id !== myId && p.alive && distance(me, p) < KILL_RANGE) { hasTarget = true; break; }
    }
    const shootReady = hasTarget && me.sheriffShots > 0;
    btns.push({
      label: 'SHOOT',
      bg: shootReady ? '#ccaa00' : '#444444',
      disabled: !shootReady,
      action: () => { if (shootReady) socket.emit('sheriffKill'); },
    });
  }

  // Report (alive only)
  if (!isGhost) {
    let nearBody = false;
    for (const body of bodies) {
      if (distance(me, body) < REPORT_RANGE) { nearBody = true; break; }
    }
    if (nearBody) {
      btns.push({ label: 'REPORT', bg: '#cc8800', action: () => socket.emit('reportBody') });
    }
  }

  // Use task (alive + ghost crewmates)
  const nearTask = findNearestTask(me);
  if (nearTask) {
    btns.push({ label: 'USE', bg: '#0088cc', action: () => openTask(nearTask) });
  } else if (!isGhost && distance(me, MAP.emergencyButton) < EMERGENCY_RANGE) {
    btns.push({ label: 'EMERGENCY', bg: '#cc2222', action: () => socket.emit('callEmergency') });
  }

  // Vent (impostor or engineer, alive only)
  const canVentMobile = myRole === 'impostor' || (mySpecialRole === 'engineer' && engineerVentsLeft > 0);
  if (!isGhost && canVentMobile) {
    const VENT_RANGE = 60;
    for (let vi = 0; vi < MAP.vents.length; vi++) {
      const v = MAP.vents[vi];
      if (distance(me, v.a) < VENT_RANGE || distance(me, v.b) < VENT_RANGE) {
        const ventIdx = vi;
        const ventLbl = mySpecialRole === 'engineer' ? `VENT(${engineerVentsLeft})` : 'VENT';
        btns.push({ label: ventLbl, bg: '#00aa00', action: () => socket.emit('ventMove', { ventIndex: ventIdx }) });
        break;
      }
    }
  }

  if (!isGhost && myRole === 'impostor') {
    // Sabotage (impostor, no active sabotage)
    if (!activeSabotage) {
      btns.push({ label: 'SABO', bg: '#aa00aa', action: () => { sabotageMenuOpen = !sabotageMenuOpen; } });
    }

    // Door (impostor, near an open door)
    const DOOR_RANGE = 80;
    for (const mapDoor of MAP.doors) {
      const ds = doorStates.find(d => d.id === mapDoor.id);
      const isClosed = ds ? ds.closed : false;
      if (!isClosed) {
        const doorCx = mapDoor.x + mapDoor.w / 2;
        const doorCy = mapDoor.y + mapDoor.h / 2;
        if (distance(me, { x: doorCx, y: doorCy }) < DOOR_RANGE) {
          const dId = mapDoor.id;
          btns.push({ label: 'DOOR', bg: '#885500', action: () => socket.emit('closeDoor', { doorId: dId }) });
          break;
        }
      }
    }
  }

  // Fix sabotage (crewmate near station)
  if (activeSabotage && myRole !== 'impostor') {
    const stations = MAP.sabotageFixStations[activeSabotage.type];
    if (stations) {
      for (let si = 0; si < stations.length; si++) {
        if (distance(me, stations[si]) < 80) {
          const idx = si;
          btns.push({ label: 'FIX', bg: '#ff6600', action: () => handleSabotageFix(idx) });
          break;
        }
      }
    }
  }

  // Scientist vitals button (mobile)
  if (!isGhost && mySpecialRole === 'scientist' && myRole === 'crewmate') {
    btns.push({ label: 'VITALS', bg: '#aa44dd', action: () => socket.emit('checkVitals') });
  }

  // Security cameras (mobile)
  if (!isGhost && distance(me, MAP.securityConsole) < 80) {
    if (watchingCameras) {
      btns.push({ label: 'EXIT CAM', bg: '#cc6600', action: () => { watchingCameras = false; cameraFeed = null; socket.emit('stopWatchCameras'); } });
    } else {
      btns.push({ label: 'CAMS', bg: '#cc6600', action: () => { watchingCameras = true; socket.emit('watchCameras'); } });
    }
  }

  // Admin table (mobile)
  if (!isGhost && distance(me, MAP.adminConsole) < 80) {
    btns.push({ label: 'ADMIN', bg: '#008888', action: () => { viewingAdminTable = !viewingAdminTable; if (viewingAdminTable) socket.emit('requestAdminTable'); } });
  }

  // Quick chat button (always available for alive players)
  btns.push({ label: 'CHAT', bg: '#336699', action: () => {
    const msgId = (window._quickChatIdx || 0) % QUICK_MESSAGES.length;
    window._quickChatIdx = msgId + 1;
    socket.emit('quickChat', { messageId: msgId });
    floatingMessages.push({ playerId: myId, text: QUICK_MESSAGES[msgId], startTime: Date.now(), duration: 3000 });
  }});

  // Emote button
  btns.push({ label: '\u{1F44B}', bg: '#996633', action: () => {
    const emoteId = (window._emoteIdx || 0) % EMOTES.length;
    window._emoteIdx = emoteId + 1;
    socket.emit('emote', { emoteId });
    floatingMessages.push({ playerId: myId, emoji: EMOTES[emoteId], startTime: Date.now(), duration: 2500 });
  }});

  // Use stable actionKey for DOM rebuild comparison (avoids rebuilds from cooldown text changes)
  const structuralKey = btns.map(b => (b.actionKey || b.label)).join(',');

  // Always update the action closures so they capture fresh state
  _mobileBtnActions = {};
  for (const btn of btns) {
    _mobileBtnActions[btn.actionKey || btn.label] = btn.action;
  }

  // Full DOM rebuild only when the set of buttons changes (not for text/style updates)
  if (structuralKey !== _lastMobileBtnKey) {
    _lastMobileBtnKey = structuralKey;
    mobileActions.innerHTML = '';
    mobileActions.style.flexDirection = 'column';
    mobileActions.style.alignItems = 'center';
    for (const btn of btns) {
      const el = document.createElement('div');
      el.className = 'mobile-action-btn';
      el.style.background = btn.bg;
      if (btn.disabled) el.style.opacity = '0.5';
      else el.style.opacity = '1';
      el.textContent = btn.label;
      el.dataset.actionKey = btn.actionKey || btn.label;
      const actionKey = btn.actionKey || btn.label;
      // Use both touchstart and click for maximum mobile compatibility
      // Guard against double-fire with a timestamp debounce
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const now = Date.now();
        if (now - _lastMobileActionTime < 200) return; // debounce
        _lastMobileActionTime = now;
        // Always use the latest action closure (not the one captured at DOM creation)
        const action = _mobileBtnActions[actionKey];
        if (action) action();
      };
      el.addEventListener('touchstart', handler, { passive: false });
      el.addEventListener('click', handler);
      mobileActions.appendChild(el);
    }
  } else {
    // Update text, background, and opacity in-place without destroying DOM elements
    const children = mobileActions.children;
    for (let i = 0; i < btns.length && i < children.length; i++) {
      const el = children[i];
      const btn = btns[i];
      if (el.textContent !== btn.label) el.textContent = btn.label;
      if (el.style.background !== btn.bg) el.style.background = btn.bg;
      const newOpacity = btn.disabled ? '0.5' : '1';
      if (el.style.opacity !== newOpacity) el.style.opacity = newOpacity;
    }
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

  // Mobile action buttons are now updated from the game loop for instant responsiveness
}

// ============================================
// PLAYER STATS & ACHIEVEMENTS (localStorage)
// ============================================
function loadStats() {
  try { return JSON.parse(localStorage.getItem('sb_stats')) || {}; } catch { return {}; }
}
function saveStats(stats) {
  localStorage.setItem('sb_stats', JSON.stringify(stats));
}
function incrementStat(key, amount) {
  const stats = loadStats();
  stats[key] = (stats[key] || 0) + (amount || 1);
  saveStats(stats);
}

const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', desc: 'Get your first kill as impostor', icon: '\u{1F5E1}', check: s => (s.kills || 0) >= 1 },
  { id: 'serial_killer', name: 'Serial Killer', desc: 'Get 10 total kills', icon: '\u{1F480}', check: s => (s.kills || 0) >= 10 },
  { id: 'task_master', name: 'Task Master', desc: 'Complete 50 total tasks', icon: '\u{2705}', check: s => (s.tasksCompleted || 0) >= 50 },
  { id: 'veteran', name: 'Veteran', desc: 'Play 10 games', icon: '\u{1F3AE}', check: s => (s.gamesPlayed || 0) >= 10 },
  { id: 'winner', name: 'Winner', desc: 'Win 5 games', icon: '\u{1F3C6}', check: s => (s.gamesWon || 0) >= 5 },
  { id: 'champion', name: 'Champion', desc: 'Win 20 games', icon: '\u{1F451}', check: s => (s.gamesWon || 0) >= 20 },
  { id: 'detective', name: 'Detective', desc: 'Vote out the impostor 5 times', icon: '\u{1F50D}', check: s => (s.correctVotes || 0) >= 5 },
  { id: 'survivor', name: 'Survivor', desc: 'Survive 10 games as crewmate', icon: '\u{1F6E1}', check: s => (s.survived || 0) >= 10 },
  { id: 'imposter_pro', name: 'Master of Deception', desc: 'Win 5 games as impostor', icon: '\u{1F608}', check: s => (s.impostorWins || 0) >= 5 },
  { id: 'meeting_caller', name: 'Emergency!', desc: 'Call 5 emergency meetings', icon: '\u{1F6A8}', check: s => (s.meetingsCalled || 0) >= 5 },
  { id: 'social', name: 'Social Butterfly', desc: 'Send 50 chat messages', icon: '\u{1F4AC}', check: s => (s.chatsSent || 0) >= 50 },
  { id: 'body_finder', name: 'Body Finder', desc: 'Report 10 bodies', icon: '\u{26A0}', check: s => (s.bodiesReported || 0) >= 10 },
  { id: 'vent_rat', name: 'Vent Rat', desc: 'Use vents 20 times', icon: '\u{1F573}', check: s => (s.ventsUsed || 0) >= 20 },
  { id: 'saboteur', name: 'Saboteur', desc: 'Trigger 10 sabotages', icon: '\u{26A1}', check: s => (s.sabotages || 0) >= 10 },
  { id: 'sheriff_star', name: 'Sheriff Star', desc: 'Correctly shoot an impostor as Sheriff', icon: '\u{2B50}', check: s => (s.sheriffHits || 0) >= 1 },
];

function loadAchievements() {
  try { return JSON.parse(localStorage.getItem('sb_achievements')) || []; } catch { return []; }
}
function saveAchievements(list) {
  localStorage.setItem('sb_achievements', JSON.stringify(list));
}

function checkAchievements() {
  const stats = loadStats();
  const unlocked = loadAchievements();
  const newlyUnlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (!unlocked.includes(a.id) && a.check(stats)) {
      unlocked.push(a.id);
      newlyUnlocked.push(a);
    }
  }
  if (newlyUnlocked.length > 0) {
    saveAchievements(unlocked);
    newlyUnlocked.forEach(a => showAchievementToast(a));
  }
}

function showAchievementToast(achievement) {
  const toast = document.createElement('div');
  toast.className = 'achieve-toast';
  const achText = typeof t === 'function' ? t('achievementUnlocked')(achievement.name) : `Achievement Unlocked: ${achievement.name}`;
  toast.textContent = `${achievement.icon} ${achText}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showStatsPanel() {
  const stats = loadStats();
  const content = document.getElementById('stats-content');
  const _ts = typeof t === 'function' ? t : (k) => k;
  content.innerHTML = `
    <div>${_ts('gamesPlayed')}: <strong>${stats.gamesPlayed || 0}</strong></div>
    <div>${_ts('gamesWon')}: <strong>${stats.gamesWon || 0}</strong></div>
    <div>${_ts('timesImpostor')}: <strong>${stats.timesImpostor || 0}</strong></div>
    <div>${_ts('impostorWins')}: <strong>${stats.impostorWins || 0}</strong></div>
    <div>${_ts('totalKills')}: <strong>${stats.kills || 0}</strong></div>
    <div>${_ts('tasksCompleted')}: <strong>${stats.tasksCompleted || 0}</strong></div>
    <div>${_ts('meetingsCalled')}: <strong>${stats.meetingsCalled || 0}</strong></div>
    <div>${_ts('bodiesReported')}: <strong>${stats.bodiesReported || 0}</strong></div>
    <div>${_ts('ventsUsed')}: <strong>${stats.ventsUsed || 0}</strong></div>
    <div>${_ts('sabotages')}: <strong>${stats.sabotages || 0}</strong></div>
    <div>${_ts('chatMessages')}: <strong>${stats.chatsSent || 0}</strong></div>
    <div>${_ts('gamesSurvived')}: <strong>${stats.survived || 0}</strong></div>
  `;
  document.getElementById('stats-panel').classList.add('active');
}

function showAchievementsPanel() {
  const unlocked = loadAchievements();
  const content = document.getElementById('achieve-content');
  content.innerHTML = ACHIEVEMENTS.map(a => {
    const isUnlocked = unlocked.includes(a.id);
    return `<div class="achieve-item ${isUnlocked ? '' : 'locked'}">
      <span class="achieve-icon">${isUnlocked ? a.icon : '\u{1F512}'}</span>
      <strong>${a.name}</strong> — ${a.desc}
    </div>`;
  }).join('');
  document.getElementById('achieve-panel').classList.add('active');
}

// ============================================
// DAILY CHALLENGES
// ============================================
const CHALLENGE_DEFS = [
  { id: 'winImpostor', langKey: 'challengeWinImpostor', check: (s) => s._sessionImpostorWins >= 1 },
  { id: 'winCrewmate', langKey: 'challengeWinCrewmate', check: (s) => s._sessionCrewmateWins >= 1 },
  { id: 'complete5Tasks', langKey: 'challengeComplete5Tasks', check: (s) => s._sessionTasks >= 5 },
  { id: 'complete10Tasks', langKey: 'challengeComplete10Tasks', check: (s) => s._sessionTasks >= 10 },
  { id: 'survive', langKey: 'challengeSurvive', check: (s) => s._sessionSurvived >= 1 },
  { id: 'get2Kills', langKey: 'challengeGet2Kills', check: (s) => s._sessionMaxKillsInGame >= 2 },
  { id: 'report', langKey: 'challengeReport', check: (s) => s._sessionReports >= 1 },
  { id: 'callMeeting', langKey: 'challengeCallMeeting', check: (s) => s._sessionMeetings >= 1 },
  { id: 'play3Games', langKey: 'challengePlay3Games', check: (s) => s._sessionGames >= 3 },
  { id: 'useVent', langKey: 'challengeUseVent', check: (s) => s._sessionVents >= 1 },
  { id: 'sendChat', langKey: 'challengeSendChat', check: (s) => s._sessionChats >= 5 },
  { id: 'winGame', langKey: 'challengeWinGame', check: (s) => s._sessionWins >= 1 },
];

// Session-scoped counters for challenge tracking (reset on page load)
const challengeSession = {
  _sessionGames: 0, _sessionWins: 0, _sessionImpostorWins: 0, _sessionCrewmateWins: 0,
  _sessionTasks: 0, _sessionSurvived: 0, _sessionMaxKillsInGame: 0, _sessionReports: 0,
  _sessionMeetings: 0, _sessionVents: 0, _sessionChats: 0,
};

function getDayKey() {
  return Math.floor(Date.now() / 86400000);
}

function getDailyChallenges() {
  const dayKey = getDayKey();
  // Seeded random from day
  let seed = dayKey;
  function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  // Pick 3 unique challenges
  const indices = [];
  while (indices.length < 3) {
    const idx = Math.floor(rand() * CHALLENGE_DEFS.length);
    if (!indices.includes(idx)) indices.push(idx);
  }
  return indices.map(i => CHALLENGE_DEFS[i]);
}

function loadChallengeProgress() {
  try {
    const data = JSON.parse(localStorage.getItem('sb_challenges') || '{}');
    if (data.dayKey !== getDayKey()) {
      // New day — check if previous day was completed for streak
      return { dayKey: getDayKey(), completed: [], stars: data.stars || 0, streak: data.allDone ? (data.streak || 0) + 1 : 0, allDone: false };
    }
    return data;
  } catch { return { dayKey: getDayKey(), completed: [], stars: 0, streak: 0, allDone: false }; }
}

function saveChallengeProgress(progress) {
  localStorage.setItem('sb_challenges', JSON.stringify(progress));
}

function checkDailyChallenges() {
  const challenges = getDailyChallenges();
  const progress = loadChallengeProgress();
  let changed = false;

  challenges.forEach(ch => {
    if (progress.completed.includes(ch.id)) return;
    if (ch.check(challengeSession)) {
      progress.completed.push(ch.id);
      progress.stars = (progress.stars || 0) + 1;
      changed = true;
      // Show toast
      if (typeof playSound === 'function') playSound('task');
    }
  });

  // Bonus for completing all 3
  if (progress.completed.length >= 3 && !progress.allDone) {
    progress.allDone = true;
    progress.stars = (progress.stars || 0) + 3;
    progress.streak = (progress.streak || 0) + 1;
    changed = true;
  }

  if (changed) saveChallengeProgress(progress);
}

function showChallengesPanel() {
  const challenges = getDailyChallenges();
  const progress = loadChallengeProgress();
  const list = document.getElementById('challenges-list');
  const starsEl = document.getElementById('challenges-stars');
  const streakEl = document.getElementById('challenges-streak');
  const bonusEl = document.getElementById('challenges-bonus');
  const titleEl = document.getElementById('challenges-title');
  const closeEl = document.getElementById('challenges-close');

  if (titleEl) titleEl.textContent = typeof t === 'function' ? t('dailyChallenges') : 'DAILY CHALLENGES';
  if (closeEl) closeEl.textContent = typeof t === 'function' ? t('close') : 'Close';
  if (starsEl) starsEl.textContent = typeof t === 'function' ? t('stars')(progress.stars || 0) : `Stars: ${progress.stars || 0}`;
  if (streakEl) streakEl.textContent = typeof t === 'function' ? t('challengeStreak')(progress.streak || 0) : `Streak: ${progress.streak || 0} days`;

  if (list) {
    list.innerHTML = challenges.map(ch => {
      const done = progress.completed.includes(ch.id);
      const name = typeof t === 'function' ? t(ch.langKey) : ch.id;
      const doneLabel = typeof t === 'function' ? t('challengeComplete') : 'Complete!';
      return `<div style="padding:8px;margin:4px 0;background:rgba(255,255,255,0.05);border-radius:6px;display:flex;align-items:center;gap:8px;${done ? 'opacity:0.6' : ''}">
        <span style="font-size:1.2em">${done ? '\u2705' : '\u2B50'}</span>
        <span style="flex:1">${name}</span>
        ${done ? `<span style="color:#44ff44;font-size:0.8em">${doneLabel}</span>` : ''}
      </div>`;
    }).join('');
  }

  if (bonusEl) {
    if (progress.allDone) {
      bonusEl.style.display = 'block';
      bonusEl.textContent = typeof t === 'function' ? t('allChallengesBonus') : 'All 3 done! +3 bonus stars';
    } else {
      bonusEl.style.display = 'none';
    }
  }

  document.getElementById('challenges-panel').classList.add('active');
}

document.getElementById('challenges-btn').addEventListener('click', () => showChallengesPanel());
document.getElementById('challenges-close').addEventListener('click', () => {
  document.getElementById('challenges-panel').classList.remove('active');
});

// ============================================
// FRIEND SYSTEM
// ============================================
function getMyFriendCode() {
  let code = localStorage.getItem('sb_friend_code');
  if (!code || code.length !== 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    localStorage.setItem('sb_friend_code', code);
  }
  return code;
}

function getFriendsList() {
  try { return JSON.parse(localStorage.getItem('sb_friends') || '[]'); }
  catch { return []; }
}

function saveFriendsList(list) {
  localStorage.setItem('sb_friends', JSON.stringify(list));
}

function showFriendsPanel() {
  const myCode = getMyFriendCode();
  document.getElementById('friends-my-code').textContent = myCode;
  document.getElementById('friends-title').textContent = typeof t === 'function' ? t('friends') : 'FRIENDS';
  document.getElementById('friends-your-code-label').textContent = typeof t === 'function' ? t('yourCode') : 'Your Code:';
  document.getElementById('friend-add-btn').textContent = typeof t === 'function' ? t('addFriend') : 'Add';
  document.getElementById('friend-code-input').placeholder = typeof t === 'function' ? t('friendCodePlaceholder') : 'Friend code';
  document.getElementById('friends-close').textContent = typeof t === 'function' ? t('close') : 'Close';

  // Register my code with server
  socket.emit('registerFriendCode', { friendCode: myCode, name: document.getElementById('name-input').value || 'Player' });

  // Query online status
  const friends = getFriendsList();
  if (friends.length > 0) {
    socket.emit('queryFriends', { codes: friends.map(f => f.code) });
  }
  renderFriendsList([]);
  document.getElementById('friends-panel').classList.add('active');
}

function renderFriendsList(onlineData) {
  const friends = getFriendsList();
  const list = document.getElementById('friends-list');
  if (friends.length === 0) {
    list.innerHTML = `<div style="color:#666;text-align:center;padding:16px">${typeof t === 'function' ? t('noFriends') : 'No friends added yet'}</div>`;
    return;
  }
  const onlineMap = new Map(onlineData.map(f => [f.code, f]));
  list.innerHTML = friends.map(f => {
    const status = onlineMap.get(f.code);
    const isOnline = status && status.online;
    const onLabel = typeof t === 'function' ? t('online') : 'Online';
    const offLabel = typeof t === 'function' ? t('offline') : 'Offline';
    const joinLabel = typeof t === 'function' ? t('joinFriend') : 'Join';
    return `<div style="padding:6px 8px;margin:3px 0;background:rgba(255,255,255,0.05);border-radius:6px;display:flex;align-items:center;gap:8px">
      <span style="width:8px;height:8px;border-radius:50%;background:${isOnline ? '#44ff44' : '#666'};flex-shrink:0"></span>
      <span style="flex:1">${status ? status.name : f.code} <span style="color:#666;font-size:0.8em">${f.code}</span></span>
      <span style="font-size:0.75em;color:${isOnline ? '#44ff44' : '#666'}">${isOnline ? onLabel : offLabel}</span>
      ${isOnline && status.inLobby ? `<button class="btn" onclick="joinFriendRoom('${status.roomCode}')" style="font-size:0.7em;padding:2px 8px">${joinLabel}</button>` : ''}
      <span onclick="removeFriend('${f.code}')" style="cursor:pointer;color:#666;font-size:0.9em">&times;</span>
    </div>`;
  }).join('');
}

window.joinFriendRoom = function(code) {
  if (!code) return;
  const name = document.getElementById('name-input').value.trim();
  if (!name) return;
  document.getElementById('friends-panel').classList.remove('active');
  socket.emit('joinRoom', { code, name });
};

window.removeFriend = function(code) {
  const friends = getFriendsList().filter(f => f.code !== code);
  saveFriendsList(friends);
  socket.emit('queryFriends', { codes: friends.map(f => f.code) });
};

document.getElementById('friends-btn').addEventListener('click', () => showFriendsPanel());
document.getElementById('friends-close').addEventListener('click', () => {
  document.getElementById('friends-panel').classList.remove('active');
});

document.getElementById('friend-add-btn').addEventListener('click', () => {
  const input = document.getElementById('friend-code-input');
  const code = input.value.trim().toUpperCase();
  if (!code || code.length !== 6) return;
  if (code === getMyFriendCode()) return; // can't add yourself
  const friends = getFriendsList();
  if (friends.find(f => f.code === code)) return; // already added
  friends.push({ code });
  saveFriendsList(friends);
  input.value = '';
  // Re-query
  socket.emit('queryFriends', { codes: friends.map(f => f.code) });
});

socket.on('friendsStatus', ({ friends: onlineData }) => {
  renderFriendsList(onlineData);
});

// Register friend code on connect
socket.on('connect', () => {
  const code = getMyFriendCode();
  const name = document.getElementById('name-input').value || 'Player';
  socket.emit('registerFriendCode', { friendCode: code, name });
});

// --- ROOM BROWSER ---
document.getElementById('browse-btn').addEventListener('click', () => {
  socket.emit('listRooms');
  document.getElementById('browse-panel').classList.add('active');
});
document.getElementById('browse-refresh').addEventListener('click', () => {
  socket.emit('listRooms');
});
document.getElementById('browse-close').addEventListener('click', () => {
  document.getElementById('browse-panel').classList.remove('active');
});

socket.on('roomList', ({ rooms: roomList }) => {
  const container = document.getElementById('room-list');
  if (roomList.length === 0) {
    container.innerHTML = '<p style="color:#888;text-align:center">No public rooms available</p>';
    return;
  }
  container.innerHTML = roomList.map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;margin:4px 0;background:rgba(255,255,255,0.05);border-radius:6px">
      <div>
        <strong style="color:#ffaa00">${r.code}</strong>
        <span style="color:#888;font-size:0.85em"> by ${r.hostName}</span>
        <div style="color:#aaa;font-size:0.8em">${r.playerCount}/${r.maxPlayers} players</div>
      </div>
      <button class="btn" onclick="document.getElementById('code-input').value='${r.code}';document.getElementById('browse-panel').classList.remove('active')" style="font-size:0.8em;padding:4px 10px">Join</button>
    </div>
  `).join('');
});

// --- SPECTATE ---
document.getElementById('spectate-btn').addEventListener('click', () => {
  const code = document.getElementById('code-input').value.trim();
  const name = document.getElementById('name-input').value.trim() || 'Spectator';
  if (!code) {
    document.getElementById('menu-error').textContent = 'Enter a room code to spectate';
    return;
  }
  socket.emit('spectateRoom', { code, name });
});

let isSpectator = false;

socket.on('spectateJoined', ({ code, phase, players: pList, bodies: bList, settings: s }) => {
  isSpectator = true;
  roomCode = code;
  settings = s;
  players = pList;
  bodies = bList;
  gamePhase = phase === 'lobby' ? 'playing' : phase;
  myRole = 'spectator';
  mySpecialRole = null;
  showScreen(null);
  pList.forEach(p => { if (p.avatar) cacheAvatar(p.id, p.avatar); });
});

// --- PUBLIC TOGGLE ---
document.getElementById('toggle-public-btn').addEventListener('click', () => {
  socket.emit('togglePublic');
});

socket.on('publicToggled', ({ isPublic }) => {
  const btn = document.getElementById('toggle-public-btn');
  btn.textContent = isPublic ? 'Make Private' : 'Make Public';
  btn.style.background = isPublic ? 'rgba(68,255,68,0.3)' : '';
});

document.getElementById('stats-btn').addEventListener('click', showStatsPanel);
document.getElementById('achieve-btn').addEventListener('click', showAchievementsPanel);
document.getElementById('stats-close').addEventListener('click', () => {
  document.getElementById('stats-panel').classList.remove('active');
});
document.getElementById('achieve-close').addEventListener('click', () => {
  document.getElementById('achieve-panel').classList.remove('active');
});

// Track stats during gameplay
// (Hook into existing events)
// Wrap socket.emit to track stats for specific events
const _origSocketEmit = socket.emit.bind(socket);
socket.emit = function(event, ...args) {
  if (event === 'callEmergency') { incrementStat('meetingsCalled'); challengeSession._sessionMeetings++; }
  if (event === 'reportBody') { incrementStat('bodiesReported'); challengeSession._sessionReports++; }
  if (event === 'ventMove') { incrementStat('ventsUsed'); challengeSession._sessionVents++; }
  if (event === 'triggerSabotage') incrementStat('sabotages');
  if (event === 'meetingChat') { incrementStat('chatsSent'); challengeSession._sessionChats++; }
  return _origSocketEmit(event, ...args);
};

// ============================================
// PROCEDURAL SOUND EFFECTS
// ============================================
// Sound system — uses SoundEngine from sounds.js
function playSound(type) {
  const map = {
    kill: 'kill', meeting: 'meeting', vote: 'vote', task: 'taskComplete',
    eject: 'eject', start: 'gameStart', win: 'victory', lose: 'defeat',
    alarm: 'sabotageAlarm', door: 'doorClose', vent: 'ventMove',
    chat: 'chat', emote: 'emote', click: 'buttonClick',
    emergency: 'emergency', sabotageFixed: 'sabotageFixed',
  };
  if (typeof soundEngine !== 'undefined') soundEngine.play(map[type] || type);
}

// Volume sliders
['vol-master', 'vol-sfx', 'vol-music'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    // Set initial value from saved volumes
    if (typeof soundEngine !== 'undefined') {
      const key = id.replace('vol-', '');
      el.value = Math.round((soundEngine.volumes[key] || 0.5) * 100);
    }
    el.addEventListener('input', () => {
      const key = id.replace('vol-', '');
      if (typeof soundEngine !== 'undefined') soundEngine.setVolume(key, el.value / 100);
    });
  }
});

// Start music based on game phase
function updateMusic() {
  if (typeof soundEngine === 'undefined') return;
  if (gamePhase === 'lobby') soundEngine.startMusic('lobby');
  else if (gamePhase === 'playing') soundEngine.startMusic('playing');
  else if (gamePhase === 'meeting' || gamePhase === 'voting') soundEngine.startMusic('meeting');
  else soundEngine.stopMusic();
}

// Hook sounds + music into existing socket events
const _origOnKilled = socket.listeners('playerKilled')[0];
socket.off('playerKilled');
socket.on('playerKilled', (data) => {
  _origOnKilled(data);
  playSound('kill');
  haptic([100, 50, 100]);
});

const _origOnMeeting = socket.listeners('meetingStarted')[0];
socket.off('meetingStarted');
socket.on('meetingStarted', (data) => {
  _origOnMeeting(data);
  playSound('meeting');
  haptic([200]);
  updateMusic();
});

const _origOnGameStarted = socket.listeners('gameStarted')[0];
socket.off('gameStarted');
socket.on('gameStarted', (data) => {
  _origOnGameStarted(data);
  playSound('start');
  updateMusic();
  challengeSession._sessionGames++;
  challengeSession._currentGameKills = 0; // track kills per game
});

const _origOnVotingResults = socket.listeners('votingResults')[0];
socket.off('votingResults');
socket.on('votingResults', (data) => {
  _origOnVotingResults(data);
  if (data.ejected !== 'skip') playSound('eject');
  // Track correct votes
  if (data.ejectedRole === 'impostor' && data.ejected !== 'skip') {
    incrementStat('correctVotes');
  }
});

const _origOnGameOver = socket.listeners('gameOver')[0];
socket.off('gameOver');
socket.on('gameOver', (data) => {
  _origOnGameOver(data);
  updateMusic(); // stops music
  const _me = players.find(p => p.id === myId);
  if (_me) {
    const iWon = (data.winner === 'crewmates' && _me.role !== 'impostor') ||
                 (data.winner === 'impostors' && _me.role === 'impostor');
    playSound(iWon ? 'win' : 'lose');

    // Track end-game stats
    if (iWon) { incrementStat('gamesWon'); challengeSession._sessionWins++; }
    if (_me.role === 'impostor' && iWon) { incrementStat('impostorWins'); challengeSession._sessionImpostorWins++; }
    if (_me.role !== 'impostor' && iWon) challengeSession._sessionCrewmateWins++;
    if (_me.role !== 'impostor' && _me.alive) { incrementStat('survived'); challengeSession._sessionSurvived++; }
    // Track tasks completed this game
    if (data.stats && data.stats[myId]) {
      const myStats = data.stats[myId];
      if (myStats.tasksCompleted) { incrementStat('tasksCompleted', myStats.tasksCompleted); challengeSession._sessionTasks += myStats.tasksCompleted; }
      if (myStats.kills) {
        incrementStat('kills', myStats.kills);
        challengeSession._currentGameKills = (challengeSession._currentGameKills || 0) + myStats.kills;
        if (challengeSession._currentGameKills > challengeSession._sessionMaxKillsInGame) {
          challengeSession._sessionMaxKillsInGame = challengeSession._currentGameKills;
        }
      }
    }
    checkAchievements();
    checkDailyChallenges();
  }
});

// Sound on task complete + stats tracking + haptic
const _origCloseTask = closeTask;
closeTask = function(completed) {
  if (completed) { playSound('task'); incrementStat('tasksCompleted'); challengeSession._sessionTasks++; haptic([50]); }
  _origCloseTask(completed);
};

// Additional sound hooks
socket.on('sabotageStarted', () => { playSound('alarm'); });
socket.on('sabotageFixed', () => { playSound('sabotageFixed'); });
socket.on('doorStateChanged', (data) => { if (data.closed) playSound('door'); });
socket.on('meetingChatMessage', () => { playSound('chat'); });
socket.on('playerEmote', () => { playSound('emote'); });
socket.on('returnedToLobby', () => { updateMusic(); });

// Footstep sound throttle
let lastFootstepTime = 0;
let lastFootstepPos = { x: 0, y: 0 };
function checkFootstep() {
  const me = players.find(p => p.id === myId);
  if (!me || !me.alive || gamePhase !== 'playing') return;
  const dx = me.x - lastFootstepPos.x;
  const dy = me.y - lastFootstepPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const now = Date.now();
  if (dist > 8 && now - lastFootstepTime > 250) {
    playSound('footstep');
    lastFootstepTime = now;
    lastFootstepPos = { x: me.x, y: me.y };
  }
}
// Check footstep every game state update
const _origGameState = socket.listeners('gameState')[0];
if (_origGameState) {
  socket.off('gameState');
  socket.on('gameState', (data) => {
    _origGameState(data);
    checkFootstep();
  });
}

// ============================================
// MOBILE UX IMPROVEMENTS
// ============================================
function haptic(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ============================================
// PROXIMITY VOICE CHAT (WebRTC)
// ============================================
const voicePeers = new Map(); // peerId -> { pc, audioEl, stream }
let localStream = null;
let voiceEnabled = false;
let voiceMuted = false;
const VOICE_MAX_DISTANCE = 300; // max distance to hear someone
const VOICE_FALLOFF_START = 50; // full volume within this distance

function initVoiceChat() {
  if (voiceEnabled) return;
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      localStream = stream;
      voiceEnabled = true;
      voiceMuted = false;
      socket.emit('voiceReady');
      updateVoiceUI();
    })
    .catch(err => {
      console.warn('Voice chat unavailable:', err.message);
    });
}

function stopVoiceChat() {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  voicePeers.forEach((peer, id) => {
    if (peer.pc) peer.pc.close();
    if (peer.audioEl) { peer.audioEl.srcObject = null; peer.audioEl.remove(); }
  });
  voicePeers.clear();
  voiceEnabled = false;
  voiceMuted = false;
  socket.emit('voiceStop');
  updateVoiceUI();
}

function toggleVoiceMute() {
  if (!voiceEnabled || !localStream) return;
  voiceMuted = !voiceMuted;
  localStream.getAudioTracks().forEach(t => { t.enabled = !voiceMuted; });
  updateVoiceUI();
}

function createPeerConnection(peerId, isInitiator) {
  const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  const pc = new RTCPeerConnection(config);

  if (localStream) {
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  }

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit('voiceIceCandidate', { targetId: peerId, candidate: e.candidate });
    }
  };

  pc.ontrack = (e) => {
    let audioEl = voicePeers.get(peerId)?.audioEl;
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
    }
    audioEl.srcObject = e.streams[0];
    const existing = voicePeers.get(peerId) || {};
    voicePeers.set(peerId, { ...existing, pc, audioEl, stream: e.streams[0] });
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      removePeer(peerId);
    }
  };

  voicePeers.set(peerId, { pc, audioEl: voicePeers.get(peerId)?.audioEl || null, stream: null });

  if (isInitiator) {
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        socket.emit('voiceOffer', { targetId: peerId, offer: pc.localDescription });
      });
  }
  return pc;
}

function removePeer(peerId) {
  const peer = voicePeers.get(peerId);
  if (peer) {
    if (peer.pc) peer.pc.close();
    if (peer.audioEl) { peer.audioEl.srcObject = null; peer.audioEl.remove(); }
    voicePeers.delete(peerId);
  }
}

// Signaling handlers
socket.on('voicePeerJoined', ({ peerId }) => {
  if (!voiceEnabled) return;
  createPeerConnection(peerId, true);
});

socket.on('voiceOffer', ({ fromId, offer }) => {
  if (!voiceEnabled) return;
  const pc = createPeerConnection(fromId, false);
  pc.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => pc.createAnswer())
    .then(answer => pc.setLocalDescription(answer))
    .then(() => {
      socket.emit('voiceAnswer', { targetId: fromId, answer: pc.localDescription });
    });
});

socket.on('voiceAnswer', ({ fromId, answer }) => {
  const peer = voicePeers.get(fromId);
  if (peer && peer.pc) {
    peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }
});

socket.on('voiceIceCandidate', ({ fromId, candidate }) => {
  const peer = voicePeers.get(fromId);
  if (peer && peer.pc) {
    peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

socket.on('voicePeerLeft', ({ peerId }) => {
  removePeer(peerId);
});

// Update volume based on proximity
function updateVoiceVolumes() {
  if (!voiceEnabled) return;
  const me = players.find(p => p.id === myId);
  if (!me) return;

  const inMeeting = gamePhase === 'meeting' || gamePhase === 'voting';

  voicePeers.forEach((peer, peerId) => {
    if (!peer.audioEl) return;
    const other = players.find(p => p.id === peerId);
    if (!other) { peer.audioEl.volume = 0; return; }

    // Ghost rules: dead can only hear dead
    if (!me.alive && other.alive) { peer.audioEl.volume = 0; return; }
    if (me.alive && !other.alive) { peer.audioEl.volume = 0; return; }

    if (inMeeting) {
      // During meetings, all living players hear each other at full volume
      peer.audioEl.volume = (me.alive && other.alive) ? 1.0 : ((!me.alive && !other.alive) ? 1.0 : 0);
    } else {
      // Proximity-based volume
      const dist = Math.sqrt((me.x - other.x) ** 2 + (me.y - other.y) ** 2);
      if (dist <= VOICE_FALLOFF_START) {
        peer.audioEl.volume = 1.0;
      } else if (dist >= VOICE_MAX_DISTANCE) {
        peer.audioEl.volume = 0;
      } else {
        peer.audioEl.volume = 1.0 - ((dist - VOICE_FALLOFF_START) / (VOICE_MAX_DISTANCE - VOICE_FALLOFF_START));
      }
    }
  });
}

// Run volume updates at regular intervals
setInterval(updateVoiceVolumes, 200);

// Voice UI
function updateVoiceUI() {
  const btn = document.getElementById('voice-btn');
  if (!btn) return;
  if (!voiceEnabled) {
    btn.textContent = 'Voice Off';
    btn.style.background = '#444';
  } else if (voiceMuted) {
    btn.textContent = 'Muted';
    btn.style.background = '#cc3333';
  } else {
    btn.textContent = 'Voice On';
    btn.style.background = '#33aa33';
  }
}

// Draw voice indicators above players who are speaking
function drawVoiceIndicators() {
  if (!voiceEnabled) return;
  voicePeers.forEach((peer, peerId) => {
    if (!peer.audioEl || !peer.stream) return;
    const other = players.find(p => p.id === peerId);
    if (!other) return;
    // Check audio activity via volume
    if (peer.audioEl.volume > 0) {
      const s = worldToScreen(other.x, other.y);
      const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.3;
      ctx.strokeStyle = `rgba(100, 255, 100, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Sound wave arcs above head
      for (let i = 0; i < 3; i++) {
        const r = 8 + i * 5;
        ctx.arc(s.x, s.y - PLAYER_RADIUS - 15, r, -Math.PI * 0.7, -Math.PI * 0.3);
      }
      ctx.stroke();
    }
  });
}

// Stop voice chat on game end or leave
socket.on('gameOver', () => { if (voiceEnabled) stopVoiceChat(); });

// ============================================
// SEASONAL THEMES
// ============================================
function getCurrentSeason() {
  const month = new Date().getMonth(); // 0-11
  if (month === 9 || month === 10) return 'halloween';   // Oct-Nov
  if (month === 11 || month === 0) return 'christmas';    // Dec-Jan
  if (month >= 2 && month <= 4) return 'spring';          // Mar-May
  if (month >= 5 && month <= 7) return 'summer';          // Jun-Aug
  return null;
}

const currentSeason = getCurrentSeason();

function drawSeasonalDecorations() {
  if (!currentSeason) return;

  if (currentSeason === 'halloween') {
    // Spooky orange/purple fog particles
    const now = Date.now();
    for (let i = 0; i < 8; i++) {
      const x = (Math.sin(now / 3000 + i * 1.7) * 0.5 + 0.5) * canvas.width;
      const y = (Math.cos(now / 2500 + i * 2.3) * 0.5 + 0.5) * canvas.height;
      ctx.fillStyle = `rgba(255, 120, 0, ${0.04 + Math.sin(now / 1000 + i) * 0.02})`;
      ctx.beginPath();
      ctx.arc(x, y, 40 + Math.sin(now / 800 + i) * 15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (currentSeason === 'christmas') {
    // Snow particles falling
    const now = Date.now();
    for (let i = 0; i < 20; i++) {
      const seed = i * 137.5;
      const x = ((seed + now / 20) % canvas.width);
      const y = ((now / 15 + seed * 3) % canvas.height);
      const size = 2 + (i % 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (currentSeason === 'spring') {
    // Floating petal-like particles
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      const seed = i * 97.3;
      const x = ((seed + now / 30) % canvas.width);
      const y = ((now / 25 + seed * 2) % canvas.height);
      ctx.fillStyle = `rgba(255, ${180 + (i % 3) * 30}, ${200 + (i % 2) * 50}, 0.4)`;
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 2, (now / 1000 + i) % (Math.PI * 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // summer: no extra decorations, just warm colors handled in map draw
}

// Landscape suggestion for mobile
if (isMobile) {
  function checkOrientation() {
    if (window.innerHeight > window.innerWidth && gamePhase === 'playing') {
      if (!document.getElementById('landscape-toast')) {
        const toast = document.createElement('div');
        toast.id = 'landscape-toast';
        toast.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#ffcc00;padding:8px 16px;border-radius:8px;font-size:0.85em;z-index:9999;pointer-events:none';
        toast.textContent = 'Rotate to landscape for better gameplay';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
      }
    }
  }
  window.addEventListener('resize', checkOrientation);
  // Check on game start
  const _origCheckOr = checkOrientation;
  socket.on('gameStarted', () => setTimeout(_origCheckOr, 1000));
}

// ============================================
// MOBILE LIFECYCLE & RECONNECTION
// ============================================
// Prevent disconnection when app is minimized on mobile
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (socket.disconnected) socket.connect();
  }
});

// Safety: if activeTask got stuck (task panel hidden but activeTask not null), clear it
setInterval(() => {
  if (activeTask && !taskScreen.classList.contains('active')) {
    activeTask = null;
    if (taskAnimFrame) cancelAnimationFrame(taskAnimFrame);
    taskAnimFrame = null;
    taskCanvas.onmousedown = null;
    taskCanvas.onmousemove = null;
    taskCanvas.onmouseup = null;
    taskCanvas.onclick = null;
  }
}, 1000);

// ============================================
// LANGUAGE TOGGLE
// ============================================
const langBtn = document.getElementById('lang-btn');
if (langBtn) {
  langBtn.addEventListener('click', () => {
    const newLang = currentLang === 'en' ? 'he' : 'en';
    setLanguage(newLang);
    playSound('click');
    // Update cosmetic labels to current language
    if (typeof tHat === 'function') {
      hatLabel.textContent = tHat(HATS[myHatIndex]);
      outfitLabel.textContent = tOutfit(OUTFITS[myOutfitIndex]);
      petLabel.textContent = tPet(PETS[myPetIndex]);
    }
  });
}

// ============================================
// REPLAY SYSTEM
// ============================================
const replayScreen = document.getElementById('replay-screen');
const replayCanvas = document.getElementById('replay-canvas');
const replayCtx = replayCanvas ? replayCanvas.getContext('2d') : null;
const replaySlider = document.getElementById('replay-slider');
const replayPlayBtn = document.getElementById('replay-play');
const replayTimeLabel = document.getElementById('replay-time');
const replaySpeedSelect = document.getElementById('replay-speed');
const replayCloseBtn = document.getElementById('replay-close');
const replayBtn = document.getElementById('replay-btn');

let replayData = null;
let replayPlaying = false;
let replayTime = 0; // current time in ms
let replaySpeed = 1;
let replayAnimFrame = null;
let replayLastFrame = 0;

if (replayBtn) {
  replayBtn.addEventListener('click', () => {
    playSound('click');
    socket.emit('requestReplay');
    replayBtn.textContent = typeof t === 'function' ? t('replayLoading') : 'Loading...';
  });
}

socket.on('replayData', (data) => {
  if (!data || !data.snapshots || data.snapshots.length === 0) {
    if (replayBtn) replayBtn.textContent = typeof t === 'function' ? t('replayNoData') : 'No data';
    return;
  }
  replayData = data;
  openReplayViewer();
});

function openReplayViewer() {
  if (!replayData || !replayScreen || !replayCanvas) return;
  replayScreen.style.display = 'flex';
  replayTime = 0;
  replayPlaying = false;
  replaySpeed = 1;
  if (replaySpeedSelect) replaySpeedSelect.value = '1';
  if (replayPlayBtn) replayPlayBtn.innerHTML = '&#9654;';
  resizeReplayCanvas();
  renderReplayFrame();
  updateReplayTimeLabel();
}

function resizeReplayCanvas() {
  if (!replayCanvas) return;
  const parent = replayCanvas.parentElement;
  replayCanvas.width = parent.clientWidth;
  replayCanvas.height = parent.clientHeight - 60;
}

function getReplayMap() {
  if (!replayData) return MAP_ALPHA;
  return replayData.mapName === 'beta' ? MAP_BETA : MAP_ALPHA;
}

function getReplaySnapshot(timeMs) {
  if (!replayData || !replayData.snapshots.length) return null;
  // Binary search for closest snapshot <= timeMs
  const snaps = replayData.snapshots;
  let lo = 0, hi = snaps.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (snaps[mid].t <= timeMs) lo = mid;
    else hi = mid - 1;
  }
  return snaps[lo];
}

function getReplayEventsInRange(startMs, endMs) {
  if (!replayData) return [];
  return replayData.events.filter(e => e.t >= startMs && e.t <= endMs);
}

function renderReplayFrame() {
  if (!replayCtx || !replayData) return;
  const rMap = getReplayMap();
  const cw = replayCanvas.width;
  const ch = replayCanvas.height;
  replayCtx.clearRect(0, 0, cw, ch);

  // Calculate scale to fit map in canvas
  const mapW = rMap.width || 1600;
  const mapH = rMap.height || 1500;
  const scale = Math.min(cw / mapW, ch / mapH) * 0.9;
  const offX = (cw - mapW * scale) / 2;
  const offY = (ch - mapH * scale) / 2;

  function toScreen(wx, wy) {
    return { x: offX + wx * scale, y: offY + wy * scale };
  }

  // Draw background
  replayCtx.fillStyle = '#080818';
  replayCtx.fillRect(0, 0, cw, ch);

  // Draw hallways
  replayCtx.fillStyle = '#10102a';
  for (const hall of rMap.hallways) {
    const s = toScreen(hall.x, hall.y);
    replayCtx.fillRect(s.x, s.y, hall.w * scale, hall.h * scale);
  }

  // Draw rooms
  for (const room of rMap.rooms) {
    const s = toScreen(room.x, room.y);
    replayCtx.fillStyle = room.color || '#1a2535';
    replayCtx.fillRect(s.x, s.y, room.w * scale, room.h * scale);
    // Room name
    replayCtx.fillStyle = 'rgba(255,255,255,0.3)';
    replayCtx.font = `${Math.max(8, 10 * scale)}px monospace`;
    replayCtx.textAlign = 'center';
    const name = room.name || '';
    replayCtx.fillText(name, s.x + room.w * scale / 2, s.y + room.h * scale / 2 + 3);
  }

  // Get current snapshot
  const snap = getReplaySnapshot(replayTime);
  if (!snap) return;

  // Draw bodies
  if (snap.bodies) {
    for (const body of snap.bodies) {
      const bs = toScreen(body.x, body.y);
      replayCtx.fillStyle = body.color || '#888';
      replayCtx.globalAlpha = 0.5;
      replayCtx.beginPath();
      replayCtx.ellipse(bs.x, bs.y, 10 * scale, 6 * scale, 0, 0, Math.PI * 2);
      replayCtx.fill();
      // X mark
      replayCtx.strokeStyle = '#ff0000';
      replayCtx.lineWidth = 2;
      replayCtx.beginPath();
      replayCtx.moveTo(bs.x - 5 * scale, bs.y - 5 * scale);
      replayCtx.lineTo(bs.x + 5 * scale, bs.y + 5 * scale);
      replayCtx.moveTo(bs.x + 5 * scale, bs.y - 5 * scale);
      replayCtx.lineTo(bs.x - 5 * scale, bs.y + 5 * scale);
      replayCtx.stroke();
      replayCtx.globalAlpha = 1;
    }
  }

  // Draw players
  if (snap.players) {
    for (const p of snap.players) {
      if (!p.alive) continue;
      const ps = toScreen(p.x, p.y);
      const pInfo = replayData.players.find(rp => rp.id === p.id);
      const pColor = pInfo ? pInfo.color : '#888';
      const pRole = pInfo ? pInfo.role : 'crewmate';
      const pName = pInfo ? pInfo.name : '?';
      const r = 12 * scale;

      // Glow for impostors
      if (pRole === 'impostor') {
        replayCtx.shadowColor = '#ff0000';
        replayCtx.shadowBlur = 8 * scale;
      }

      // Body
      replayCtx.fillStyle = pColor;
      replayCtx.beginPath();
      replayCtx.arc(ps.x, ps.y, r, 0, Math.PI * 2);
      replayCtx.fill();

      // Visor
      replayCtx.fillStyle = '#a8d8ff';
      replayCtx.beginPath();
      replayCtx.arc(ps.x + r * 0.3, ps.y - r * 0.15, r * 0.35, 0, Math.PI * 2);
      replayCtx.fill();

      replayCtx.shadowColor = 'transparent';
      replayCtx.shadowBlur = 0;

      // Name
      replayCtx.fillStyle = pRole === 'impostor' ? '#ff4444' : '#ffffff';
      replayCtx.font = `bold ${Math.max(7, 9 * scale)}px monospace`;
      replayCtx.textAlign = 'center';
      replayCtx.fillText(pName, ps.x, ps.y - r - 3 * scale);
    }
  }

  // Draw events near current time (show event markers)
  const nearEvents = getReplayEventsInRange(replayTime - 2000, replayTime);
  for (const ev of nearEvents) {
    const age = replayTime - ev.t;
    const alpha = Math.max(0, 1 - age / 2000);
    if (ev.type === 'kill' && ev.data) {
      const ks = toScreen(ev.data.x, ev.data.y);
      replayCtx.globalAlpha = alpha;
      replayCtx.fillStyle = '#ff0000';
      replayCtx.font = `${Math.max(14, 20 * scale)}px serif`;
      replayCtx.textAlign = 'center';
      replayCtx.fillText('\u2620', ks.x, ks.y); // skull
      replayCtx.globalAlpha = 1;
    } else if (ev.type === 'meeting') {
      replayCtx.globalAlpha = alpha;
      replayCtx.fillStyle = '#ffdd44';
      replayCtx.font = `bold ${Math.max(12, 16 * scale)}px monospace`;
      replayCtx.textAlign = 'center';
      replayCtx.fillText('MEETING', cw / 2, 30);
      replayCtx.globalAlpha = 1;
    }
  }

  // Draw event markers on timeline
  drawReplayTimeline();

  // Update slider
  if (replaySlider && replayData.duration > 0) {
    replaySlider.value = Math.round((replayTime / replayData.duration) * 1000);
  }
  updateReplayTimeLabel();
}

function drawReplayTimeline() {
  if (!replayCtx || !replayData || !replayData.duration) return;
  const cw = replayCanvas.width;
  const ch = replayCanvas.height;
  const timelineY = ch - 5;
  const timelineW = cw - 20;
  const startX = 10;

  // Event markers on bottom of canvas
  for (const ev of replayData.events) {
    const x = startX + (ev.t / replayData.duration) * timelineW;
    if (ev.type === 'kill') {
      replayCtx.fillStyle = '#ff3333';
      replayCtx.fillRect(x - 1, timelineY - 6, 3, 6);
    } else if (ev.type === 'meeting') {
      replayCtx.fillStyle = '#ffdd44';
      replayCtx.fillRect(x - 1, timelineY - 8, 3, 8);
    } else if (ev.type === 'vote') {
      replayCtx.fillStyle = '#44aaff';
      replayCtx.fillRect(x - 1, timelineY - 5, 3, 5);
    }
  }
}

function updateReplayTimeLabel() {
  if (!replayTimeLabel || !replayData) return;
  const cur = formatReplayTime(replayTime);
  const total = formatReplayTime(replayData.duration);
  replayTimeLabel.textContent = `${cur}/${total}`;
}

function formatReplayTime(ms) {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function startReplayPlayback() {
  replayPlaying = true;
  if (replayPlayBtn) replayPlayBtn.innerHTML = '&#9646;&#9646;';
  replayLastFrame = performance.now();
  replayLoop();
}

function pauseReplayPlayback() {
  replayPlaying = false;
  if (replayPlayBtn) replayPlayBtn.innerHTML = '&#9654;';
  if (replayAnimFrame) {
    cancelAnimationFrame(replayAnimFrame);
    replayAnimFrame = null;
  }
}

function replayLoop() {
  if (!replayPlaying || !replayData) return;
  const now = performance.now();
  const delta = (now - replayLastFrame) * replaySpeed;
  replayLastFrame = now;
  replayTime = Math.min(replayTime + delta, replayData.duration);

  renderReplayFrame();

  if (replayTime >= replayData.duration) {
    pauseReplayPlayback();
    return;
  }

  replayAnimFrame = requestAnimationFrame(replayLoop);
}

function closeReplayViewer() {
  pauseReplayPlayback();
  if (replayScreen) replayScreen.style.display = 'none';
  replayData = null;
  if (replayBtn) replayBtn.textContent = typeof t === 'function' ? t('watchReplay') : 'Watch Replay';
}

// Replay controls event listeners
if (replayPlayBtn) {
  replayPlayBtn.addEventListener('click', () => {
    if (replayPlaying) {
      pauseReplayPlayback();
    } else {
      if (replayTime >= (replayData ? replayData.duration : 0)) replayTime = 0;
      startReplayPlayback();
    }
  });
}

if (replaySlider) {
  replaySlider.addEventListener('input', () => {
    if (!replayData) return;
    replayTime = (parseInt(replaySlider.value) / 1000) * replayData.duration;
    renderReplayFrame();
  });
}

if (replaySpeedSelect) {
  replaySpeedSelect.addEventListener('change', () => {
    replaySpeed = parseInt(replaySpeedSelect.value) || 1;
  });
}

if (replayCloseBtn) {
  replayCloseBtn.addEventListener('click', closeReplayViewer);
}

// Resize replay canvas on window resize
window.addEventListener('resize', () => {
  if (replayScreen && replayScreen.style.display !== 'none') {
    resizeReplayCanvas();
    renderReplayFrame();
  }
});
