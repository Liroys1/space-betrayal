const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// Pending disconnects: stores player data during grace period for mobile reconnection
// Key: "roomCode:playerName" -> { playerData, roomCode, timeout, oldSocketId }
const pendingReconnects = new Map();
const RECONNECT_GRACE_MS = 30000; // 30 seconds

// ============================================
// CONSTANTS (KEEP IN SYNC WITH game.js)
// ============================================
const PLAYER_RADIUS = 18;
const KILL_RANGE = 80;
const REPORT_RANGE = 100;
const TASK_RANGE = 60;
const EMERGENCY_RANGE = 60;
const TICK_RATE = 100; // ms per tick (10 Hz)
const SABOTAGE_COOLDOWN = 30; // seconds between sabotages
const SABOTAGE_FIX_RANGE = 80;
const SABOTAGE_TIMERS = { lights: 0, o2: 45, reactor: 60 }; // 0 = no auto-lose

const COLORS = [
  '#c51111', '#132ed2', '#11802d', '#ee54bb',
  '#f07d06', '#f6f657', '#3f474e', '#d6e0f0',
  '#6b2fbb', '#71491e', '#38fedb', '#50ef39',
];

const HATS = ['none', 'crown', 'tophat', 'partyhat', 'chef', 'headband', 'flower', 'devil', 'halo', 'beanie', 'antenna', 'pirate', 'glasses', 'sunglasses', 'headphones', 'cap', 'wizard', 'cowboy', 'ninja', 'santa', 'witch', 'elfhat', 'bunnyears', 'pumpkin'];
const OUTFITS = ['none', 'suit', 'labcoat', 'military', 'scarf', 'cape', 'toolbelt', 'astronaut', 'hoodie', 'police', 'pirate_outfit', 'ninja_outfit'];
const PETS = ['none', 'mini_crewmate', 'dog', 'cat', 'robot', 'alien', 'hamster'];

const MAP = {
  width: 2000,
  height: 1500,
  rooms: [
    { name: 'Cafeteria',    x: 750,  y: 300,  w: 300, h: 250 },
    { name: 'Upper Engine', x: 850,  y: 50,   w: 200, h: 180 },
    { name: 'MedBay',       x: 400,  y: 350,  w: 250, h: 200 },
    { name: 'Weapons',      x: 1150, y: 350,  w: 250, h: 200 },
    { name: 'Security',     x: 400,  y: 650,  w: 250, h: 200 },
    { name: 'Storage',      x: 750,  y: 650,  w: 300, h: 200 },
    { name: 'O2',           x: 1150, y: 650,  w: 250, h: 200 },
    { name: 'Electrical',   x: 400,  y: 950,  w: 250, h: 200 },
    { name: 'Lower Engine', x: 750,  y: 950,  w: 300, h: 200 },
    { name: 'Shields',      x: 1150, y: 950,  w: 250, h: 200 },
    { name: 'Navigation',   x: 800,  y: 1250, w: 250, h: 180 },
    { name: 'Kitchen',      x: 1150, y: 1200, w: 280, h: 220 },
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
    { id: 0, roomName: 'Electrical', x: 630, y: 1020, w: 12, h: 60 },   // Electrical entrance
    { id: 1, roomName: 'MedBay',     x: 630, y: 420,  w: 12, h: 60 },   // MedBay entrance
    { id: 2, roomName: 'Security',   x: 630, y: 720,  w: 12, h: 60 },   // Security entrance
    { id: 3, roomName: 'O2',         x: 1150, y: 720, w: 12, h: 60 },   // O2 entrance
    { id: 4, roomName: 'Navigation', x: 920, y: 1250, w: 60, h: 12 },   // Navigation entrance
    { id: 5, roomName: 'Shields',    x: 1150, y: 1020,w: 12, h: 60 },   // Shields entrance
  ],
  cameras: [
    { id: 0, name: 'Cafeteria', x: 900, y: 425, range: 200 },
    { id: 1, name: 'MedBay',    x: 500, y: 450, range: 180 },
    { id: 2, name: 'Navigation', x: 900, y: 1340, range: 180 },
    { id: 3, name: 'Electrical', x: 500, y: 1050, range: 180 },
  ],
  securityConsole: { x: 450, y: 750, roomName: 'Security' },
  adminConsole: { x: 850, y: 750, roomName: 'Storage' },
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


const TASK_DEFINITIONS = [
  { id: 'wires_1',      type: 'wires',     roomName: 'Electrical',   x: 480, y: 1020 },
  { id: 'wires_2',      type: 'wires',     roomName: 'Storage',      x: 830, y: 720 },
  { id: 'swipe_1',      type: 'swipeCard', roomName: 'Storage',      x: 950, y: 750 },
  { id: 'asteroids_1',  type: 'asteroids', roomName: 'Weapons',      x: 1280, y: 420 },
  { id: 'download_1',   type: 'download',  roomName: 'Cafeteria',    x: 820, y: 380 },
  { id: 'download_2',   type: 'download',  roomName: 'Navigation',   x: 880, y: 1320 },
  { id: 'fuel_upper',   type: 'fuel',      roomName: 'Upper Engine', x: 920, y: 130 },
  { id: 'fuel_lower',   type: 'fuel',      roomName: 'Lower Engine', x: 920, y: 1030 },
  { id: 'calibrate_1',  type: 'calibrate', roomName: 'Navigation',   x: 950, y: 1350 },
  { id: 'medscan_1',    type: 'download',  roomName: 'MedBay',       x: 500, y: 430 },
  { id: 'shields_1',    type: 'wires',     roomName: 'Shields',      x: 1250, y: 1020 },
  { id: 'security_1',   type: 'download',  roomName: 'Security',     x: 500, y: 730 },
  { id: 'kitchen_cook',  type: 'calibrate', roomName: 'Kitchen',      x: 1200, y: 1230 },
  { id: 'kitchen_fridge',type: 'download',  roomName: 'Kitchen',      x: 1370, y: 1300 },
  { id: 'simon_1',      type: 'simon',   roomName: 'O2',        x: 1220, y: 700 },
  { id: 'unlock_1',     type: 'unlock',  roomName: 'Weapons',   x: 1300, y: 470 },
  { id: 'trash_1',      type: 'trash',   roomName: 'Cafeteria', x: 900,  y: 480 },
];

// ============================================
// MAP BETA - Space Station Beta (blue/white theme)
// ============================================
const MAP_BETA = {
  width: 2000,
  height: 1500,
  rooms: [
    { name: 'Central Hub',    x: 750,  y: 380,  w: 300, h: 260 },
    { name: 'Bridge',         x: 750,  y: 80,   w: 280, h: 200 },
    { name: 'Reactor Core',   x: 250,  y: 100,  w: 220, h: 180 },
    { name: 'Observatory',    x: 1350, y: 100,  w: 220, h: 180 },
    { name: 'Laboratory',     x: 300,  y: 400,  w: 260, h: 220 },
    { name: 'Armory',         x: 1300, y: 400,  w: 260, h: 220 },
    { name: 'Communications', x: 250,  y: 750,  w: 260, h: 220 },
    { name: 'Cargo Bay',      x: 750,  y: 750,  w: 300, h: 220 },
    { name: 'Life Support',   x: 1350, y: 750,  w: 260, h: 220 },
    { name: 'Greenhouse',     x: 300,  y: 1100, w: 260, h: 220 },
    { name: 'Airlock',        x: 750,  y: 1100, w: 300, h: 200 },
  ],
  hallways: [
    // Top row horizontal
    { x: 470,  y: 150, w: 280, h: 60 },    // Reactor <-> Bridge
    { x: 1030, y: 150, w: 320, h: 60 },    // Bridge <-> Observatory
    // Top to middle vertical
    { x: 350,  y: 280, w: 60, h: 120 },    // Reactor <-> Laboratory
    { x: 870,  y: 280, w: 60, h: 100 },    // Bridge <-> Central Hub
    { x: 1420, y: 280, w: 60, h: 120 },    // Observatory <-> Armory
    // Middle row horizontal
    { x: 560,  y: 480, w: 190, h: 60 },    // Laboratory <-> Central Hub
    { x: 1050, y: 480, w: 250, h: 60 },    // Central Hub <-> Armory
    // Middle to bottom vertical
    { x: 380,  y: 620, w: 60, h: 130 },    // Laboratory <-> Communications
    { x: 870,  y: 640, w: 60, h: 110 },    // Central Hub <-> Cargo Bay
    { x: 1430, y: 620, w: 60, h: 130 },    // Armory <-> Life Support
    // Bottom row horizontal
    { x: 510,  y: 830, w: 240, h: 60 },    // Communications <-> Cargo Bay
    { x: 1050, y: 830, w: 300, h: 60 },    // Cargo Bay <-> Life Support
    // Bottom to lower vertical
    { x: 380,  y: 970, w: 60, h: 130 },    // Communications <-> Greenhouse
    { x: 870,  y: 970, w: 60, h: 130 },    // Cargo Bay <-> Airlock
  ],
  vents: [
    { a: { x: 380, y: 500 }, b: { x: 380, y: 850 } },     // Lab <-> Communications
    { a: { x: 1430, y: 500 }, b: { x: 1430, y: 850 } },   // Armory <-> Life Support
    { a: { x: 880, y: 170 }, b: { x: 880, y: 1190 } },    // Bridge <-> Airlock
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
    { id: 0, name: 'Central Hub', x: 900, y: 510, range: 200 },
    { id: 1, name: 'Bridge',      x: 890, y: 180, range: 180 },
    { id: 2, name: 'Cargo Bay',   x: 900, y: 860, range: 180 },
    { id: 3, name: 'Greenhouse',  x: 430, y: 1210, range: 180 },
  ],
  securityConsole: { x: 350, y: 850, roomName: 'Communications' },
  adminConsole: { x: 900, y: 850, roomName: 'Cargo Bay' },
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

const TASK_DEFINITIONS_BETA = [
  { id: 'b_wires_1',     type: 'wires',     roomName: 'Communications', x: 350, y: 850 },
  { id: 'b_wires_2',     type: 'wires',     roomName: 'Laboratory',     x: 400, y: 500 },
  { id: 'b_swipe_1',     type: 'swipeCard', roomName: 'Bridge',         x: 880, y: 150 },
  { id: 'b_asteroids_1', type: 'asteroids', roomName: 'Armory',         x: 1430, y: 480 },
  { id: 'b_download_1',  type: 'download',  roomName: 'Central Hub',    x: 850, y: 450 },
  { id: 'b_download_2',  type: 'download',  roomName: 'Observatory',    x: 1450, y: 180 },
  { id: 'b_fuel_1',      type: 'fuel',      roomName: 'Reactor Core',   x: 340, y: 180 },
  { id: 'b_fuel_2',      type: 'fuel',      roomName: 'Greenhouse',     x: 430, y: 1200 },
  { id: 'b_calibrate_1', type: 'calibrate', roomName: 'Observatory',    x: 1480, y: 220 },
  { id: 'b_download_3',  type: 'download',  roomName: 'Life Support',   x: 1480, y: 850 },
  { id: 'b_simon_1',     type: 'simon',     roomName: 'Life Support',   x: 1450, y: 800 },
  { id: 'b_unlock_1',    type: 'unlock',    roomName: 'Armory',         x: 1380, y: 550 },
  { id: 'b_trash_1',     type: 'trash',     roomName: 'Cargo Bay',      x: 900, y: 900 },
  { id: 'b_wires_3',     type: 'wires',     roomName: 'Airlock',        x: 880, y: 1200 },
  { id: 'b_calibrate_2', type: 'calibrate', roomName: 'Greenhouse',     x: 380, y: 1250 },
];

function getMap(room) {
  return room.settings && room.settings.mapName === 'beta' ? MAP_BETA : MAP;
}

function getTaskDefs(room) {
  return room.settings && room.settings.mapName === 'beta' ? TASK_DEFINITIONS_BETA : TASK_DEFINITIONS;
}

// ============================================
// STATE
// ============================================
const rooms = new Map();
const socketToRoom = new Map(); // socketId -> roomCode

// ============================================
// HELPERS
// ============================================
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms.has(code));
  return code;
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

function isWalkable(x, y, map) {
  const m = PLAYER_RADIUS * 0.6;
  const theMap = map || MAP;
  const allRects = [...theMap.rooms, ...theMap.hallways];
  return (
    pointInAnyRect(x - m, y - m, allRects) &&
    pointInAnyRect(x + m, y - m, allRects) &&
    pointInAnyRect(x - m, y + m, allRects) &&
    pointInAnyRect(x + m, y + m, allRects)
  );
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getAvailableColor(room) {
  const usedColors = new Set([...room.players.values()].map(p => p.color));
  return COLORS.find(c => !usedColors.has(c)) || COLORS[0];
}

function buildSnapshot(room) {
  const players = [];
  for (const [, p] of room.players) {
    players.push({
      id: p.id, x: p.x, y: p.y, color: p.color,
      alive: p.alive, name: p.name, hat: p.hat, outfit: p.outfit, pet: p.pet,
      killCooldown: p.role === 'impostor' ? p.killCooldown : undefined,
    });
  }
  return {
    players,
    bodies: room.bodies,
    taskBar: room.totalTasks > 0 ? room.completedTasks / room.totalTasks : 0,
    sabotage: room.activeSabotage ? {
      type: room.activeSabotage.type,
      timeLeft: room.activeSabotage.timeLeft,
      fixProgress: room.activeSabotage.fixProgress,
    } : null,
    doors: room.doors ? room.doors.map(d => ({ id: d.id, closed: d.closed })) : [],
  };
}

function assignRoles(room) {
  const playerList = [...room.players.values()];
  // Prefer players who weren't impostor last round
  const prev = room.previousImpostors || new Set();
  const shuffled = playerList.sort((a, b) => {
    const aWas = prev.has(a.id) ? 1 : 0;
    const bWas = prev.has(b.id) ? 1 : 0;
    if (aWas !== bWas) return aWas - bWas;
    return Math.random() - 0.5;
  });

  const numImpostors = room.settings.numImpostors;
  for (let i = 0; i < shuffled.length; i++) {
    shuffled[i].role = i < numImpostors ? 'impostor' : 'crewmate';
    shuffled[i].alive = true;
    shuffled[i].killCooldown = room.settings.killCooldown;
    shuffled[i].canCallEmergency = true;
    shuffled[i].specialRole = null;
    shuffled[i].sheriffShots = 0;
    shuffled[i].engineerVents = 0;
    shuffled[i].vitalsCooldown = 0;
  }

  // Assign special crewmate roles if enabled
  if (room.settings.specialRoles) {
    const crewmates = shuffled.filter(p => p.role === 'crewmate');
    const shuffledCrew = crewmates.sort(() => Math.random() - 0.5);
    const roles = ['sheriff', 'engineer', 'scientist'];
    for (let i = 0; i < Math.min(roles.length, shuffledCrew.length); i++) {
      shuffledCrew[i].specialRole = roles[i];
      if (roles[i] === 'sheriff') shuffledCrew[i].sheriffShots = 1;
      if (roles[i] === 'engineer') shuffledCrew[i].engineerVents = 3;
    }
  }

  room.previousImpostors = new Set(shuffled.filter(p => p.role === 'impostor').map(p => p.id));
}

function assignTasks(room) {
  const crewmates = [...room.players.values()].filter(p => p.role === 'crewmate');
  const impostors = [...room.players.values()].filter(p => p.role === 'impostor');
  const taskCount = room.settings.taskCount;

  room.totalTasks = crewmates.length * taskCount;
  room.completedTasks = 0;

  const taskDefs = getTaskDefs(room);
  for (const player of crewmates) {
    const shuffled = [...taskDefs].sort(() => Math.random() - 0.5);
    player.tasks = shuffled.slice(0, taskCount).map(t => ({ ...t, completed: false }));
  }

  for (const player of impostors) {
    const shuffled = [...taskDefs].sort(() => Math.random() - 0.5);
    player.tasks = shuffled.slice(0, taskCount).map(t => ({ ...t, completed: false }));
  }
}

function spawnPlayers(room) {
  const sp = getMap(room).spawnPoint;
  for (const [, player] of room.players) {
    player.x = sp.x + (Math.random() - 0.5) * 100;
    player.y = sp.y + (Math.random() - 0.5) * 100;
  }
}

function checkWinConditions(room) {
  if (room.phase !== 'playing') return;

  const alive = [...room.players.values()].filter(p => p.alive);
  const aliveImpostors = alive.filter(p => p.role === 'impostor');
  const aliveCrewmates = alive.filter(p => p.role === 'crewmate');

  if (aliveImpostors.length >= aliveCrewmates.length) {
    endGame(room, 'impostors', 'Impostors outnumber crewmates');
    return;
  }

  if (aliveImpostors.length === 0) {
    endGame(room, 'crewmates', 'All impostors were ejected');
    return;
  }

  if (room.totalTasks > 0 && room.completedTasks >= room.totalTasks) {
    endGame(room, 'crewmates', 'All tasks completed');
    return;
  }
}

function endGame(room, winner, reason) {
  room.phase = 'gameover';
  if (room.loopInterval) {
    clearInterval(room.loopInterval);
    room.loopInterval = null;
  }

  const roles = {};
  for (const [, p] of room.players) {
    roles[p.id] = { name: p.name, color: p.color, role: p.role, alive: p.alive };
  }

  // Build end-game stats
  const stats = { kills: {}, tasksCompleted: {} };
  for (const [, p] of room.players) {
    if (room.gameStats && room.gameStats[p.id] && room.gameStats[p.id].kills) {
      stats.kills[p.id] = { name: p.name, color: p.color, count: room.gameStats[p.id].kills };
    }
    if (p.role === 'crewmate') {
      const done = p.tasks.filter(t => t.completed).length;
      if (done > 0) {
        stats.tasksCompleted[p.id] = { name: p.name, color: p.color, count: done };
      }
    }
  }
  room.gameStats = {};

  io.to(room.code).emit('gameOver', { winner, reason, roles, stats });
}

function startGameLoop(room) {
  room.loopInterval = setInterval(() => {
    if (room.phase !== 'playing') return;

    for (const [, player] of room.players) {
      if (player.role === 'impostor' && player.killCooldown > 0) {
        player.killCooldown = Math.max(0, player.killCooldown - TICK_RATE / 1000);
      }
      if (player.vitalsCooldown > 0) {
        player.vitalsCooldown = Math.max(0, player.vitalsCooldown - TICK_RATE / 1000);
      }
    }

    // Sabotage cooldown
    if (room.sabotageCooldown > 0) {
      room.sabotageCooldown = Math.max(0, room.sabotageCooldown - TICK_RATE / 1000);
    }

    // Sabotage timer countdown
    if (room.activeSabotage && room.activeSabotage.timeLeft > 0) {
      room.activeSabotage.timeLeft -= TICK_RATE / 1000;
      if (room.activeSabotage.timeLeft <= 0) {
        // Sabotage timer expired — impostors win
        endGame(room, 'impostors', `${room.activeSabotage.type.toUpperCase()} sabotage was not fixed in time!`);
        return;
      }
    }

    // Reactor hold check — if nobody is holding, progress resets
    if (room.activeSabotage && room.activeSabotage.type === 'reactor') {
      const stations = getMap(room).sabotageFixStations.reactor;
      let holdingA = false, holdingB = false;
      for (const [, p] of room.players) {
        if (!p.alive || p.role === 'impostor') continue;
        if (distance(p, stations[0]) < SABOTAGE_FIX_RANGE && p.holdingReactor) holdingA = true;
        if (distance(p, stations[1]) < SABOTAGE_FIX_RANGE && p.holdingReactor) holdingB = true;
      }
      if (holdingA && holdingB) {
        room.activeSabotage.fixProgress = (room.activeSabotage.fixProgress || 0) + TICK_RATE / 1000;
        if (room.activeSabotage.fixProgress >= 3) {
          clearSabotage(room);
        }
      } else {
        room.activeSabotage.fixProgress = 0;
      }
    }

    const snapshot = buildSnapshot(room);
    io.to(room.code).emit('gameState', snapshot);
  }, TICK_RATE);
}

function clearSabotage(room) {
  room.activeSabotage = null;
  room.sabotageCooldown = SABOTAGE_COOLDOWN;
  for (const [, p] of room.players) {
    p.holdingReactor = false;
  }
  io.to(room.code).emit('sabotageFixed');
}

function startMeeting(room, callerId, body) {
  room.phase = 'meeting';
  room.meetingCaller = callerId;
  room.reportedBody = body || null;
  room.votes.clear();
  room.bodies = [];
  // Clear sabotage on meeting
  if (room.activeSabotage) {
    room.activeSabotage = null;
    room.sabotageCooldown = SABOTAGE_COOLDOWN;
    for (const [, p] of room.players) p.holdingReactor = false;
    io.to(room.code).emit('sabotageFixed');
  }

  const spM = getMap(room).spawnPoint;
  for (const [, player] of room.players) {
    if (player.alive) {
      player.x = spM.x + (Math.random() - 0.5) * 100;
      player.y = spM.y + (Math.random() - 0.5) * 100;
    }
  }

  const alivePlayers = [...room.players.values()]
    .map(p => ({ id: p.id, name: p.name, color: p.color, alive: p.alive }));

  const callerPlayer = room.players.get(callerId);

  io.to(room.code).emit('meetingStarted', {
    callerName: callerPlayer ? callerPlayer.name : 'Unknown',
    reportedBody: body,
    players: alivePlayers,
    phase: 'discussion',
    duration: room.settings.discussionTime,
  });

  room.meetingTimer = setTimeout(() => {
    room.phase = 'voting';
    io.to(room.code).emit('votingPhase', { duration: room.settings.votingTime });

    room.votingTimer = setTimeout(() => {
      tallyVotes(room);
    }, room.settings.votingTime * 1000);
  }, room.settings.discussionTime * 1000);
}

function tallyVotes(room) {
  clearTimeout(room.votingTimer);
  room.votingTimer = null;

  const voteCounts = new Map();
  voteCounts.set('skip', 0);

  for (const [, target] of room.votes) {
    voteCounts.set(target, (voteCounts.get(target) || 0) + 1);
  }

  let maxVotes = 0;
  let ejectedId = 'skip';
  let tied = false;

  for (const [target, count] of voteCounts) {
    if (count > maxVotes) {
      maxVotes = count;
      ejectedId = target;
      tied = false;
    } else if (count === maxVotes && count > 0) {
      tied = true;
    }
  }

  if (tied) ejectedId = 'skip';

  let ejectedName = null;
  let ejectedColor = null;
  let ejectedRole = null;
  if (ejectedId !== 'skip') {
    const ejected = room.players.get(ejectedId);
    if (ejected) {
      ejected.alive = false;
      ejectedName = ejected.name;
      ejectedColor = ejected.color;
      ejectedRole = ejected.role;
    }
  }

  const voteMap = {};
  for (const [voter, target] of room.votes) {
    voteMap[voter] = target;
  }

  room.phase = 'results';
  io.to(room.code).emit('votingResults', {
    votes: room.settings.anonymousVotes ? {} : voteMap,
    ejected: ejectedId,
    ejectedName,
    ejectedColor,
    ejectedRole: room.settings.confirmEjects !== false ? ejectedRole : null,
  });

  setTimeout(() => {
    if (room.phase !== 'results') return;
    room.phase = 'playing';

    for (const [, player] of room.players) {
      if (player.role === 'impostor' && player.alive) {
        player.killCooldown = room.settings.killCooldown;
      }
    }

    io.to(room.code).emit('resumeGame');
    checkWinConditions(room);
  }, 5000);
}

function cleanupRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  if (room.loopInterval) clearInterval(room.loopInterval);
  if (room.meetingTimer) clearTimeout(room.meetingTimer);
  if (room.votingTimer) clearTimeout(room.votingTimer);
  rooms.delete(code);
}

// ============================================
// SOCKET.IO
// ============================================
io.on('connection', (socket) => {

  // --- CREATE ROOM ---
  socket.on('createRoom', ({ name }) => {
    if (!name || name.trim().length === 0) {
      socket.emit('joinError', { message: 'Name is required' });
      return;
    }
    const code = generateRoomCode();
    const room = {
      code,
      host: socket.id,
      phase: 'lobby',
      settings: {
        maxPlayers: 10,
        numImpostors: 1,
        killCooldown: 30,
        votingTime: 120,
        discussionTime: 15,
        playerSpeed: 3,
        crewmateVision: 1.0,
        impostorVision: 1.5,
        taskCount: 5,
        specialRoles: false,
        mapName: 'alpha',
      },
      players: new Map(),
      bodies: [],
      totalTasks: 0,
      completedTasks: 0,
      votes: new Map(),
      meetingCaller: null,
      reportedBody: null,
      meetingTimer: null,
      votingTimer: null,
      loopInterval: null,
      activeSabotage: null,
      sabotageCooldown: 0,
      doors: MAP.doors.map(d => ({ ...d, closed: false, cooldown: 0, timer: null })),
      isPublic: false,
      spectators: new Set(),
    };

    const player = {
      id: socket.id,
      name: name.trim().substring(0, 12),
      color: COLORS[0],
      hat: 'none',
      outfit: 'none',
      pet: 'none',
      avatar: null,
      x: MAP.spawnPoint.x,
      y: MAP.spawnPoint.y,
      role: null,
      alive: true,
      tasks: [],
      killCooldown: 0,
      canCallEmergency: true,
    };

    room.players.set(socket.id, player);
    rooms.set(code, room);
    socketToRoom.set(socket.id, code);
    socket.join(code);

    socket.emit('roomCreated', {
      code,
      player: { id: player.id, name: player.name, color: player.color, hat: player.hat, outfit: player.outfit, pet: player.pet, avatar: player.avatar},
      settings: room.settings,
    });
  });

  // --- JOIN ROOM ---
  socket.on('joinRoom', ({ code, name }) => {
    if (!name || name.trim().length === 0) {
      socket.emit('joinError', { message: 'Name is required' });
      return;
    }
    const roomCode = (code || '').toUpperCase().trim();
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('joinError', { message: 'Room not found' });
      return;
    }
    if (room.phase !== 'lobby') {
      socket.emit('joinError', { message: 'Game already in progress' });
      return;
    }
    if (room.players.size >= room.settings.maxPlayers) {
      socket.emit('joinError', { message: 'Room is full' });
      return;
    }

    const joinMap = getMap(room);
    const player = {
      id: socket.id,
      name: name.trim().substring(0, 12),
      color: getAvailableColor(room),
      hat: 'none',
      outfit: 'none',
      pet: 'none',
      avatar: null,
      x: joinMap.spawnPoint.x,
      y: joinMap.spawnPoint.y,
      role: null,
      alive: true,
      tasks: [],
      killCooldown: 0,
      canCallEmergency: true,
    };

    room.players.set(socket.id, player);
    socketToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    const playersList = [...room.players.values()].map(p => ({
      id: p.id, name: p.name, color: p.color, hat: p.hat, outfit: p.outfit, pet: p.pet, avatar: p.avatar,
    }));

    socket.emit('roomJoined', {
      code: roomCode,
      players: playersList,
      settings: room.settings,
      host: room.host,
    });

    socket.to(roomCode).emit('playerJoined', {
      id: player.id, name: player.name, color: player.color, hat: player.hat, outfit: player.outfit, avatar: player.avatar,
    });
  });

  // --- START GAME ---
  socket.on('startGame', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.host !== socket.id) return;
    if (room.phase !== 'lobby') return;
    if (room.players.size < 3) {
      socket.emit('joinError', { message: 'Need at least 3 players' });
      return;
    }

    if (room.players.size >= 7) {
      room.settings.numImpostors = 2;
    } else {
      room.settings.numImpostors = 1;
    }

    // Rebuild doors for the selected map
    const currentMap = getMap(room);
    room.doors = currentMap.doors.map(d => ({ ...d, closed: false, cooldown: 0, timer: null }));

    assignRoles(room);
    assignTasks(room);
    spawnPlayers(room);
    room.phase = 'playing';
    room.bodies = [];

    for (const [id, player] of room.players) {
      const otherImpostors = [...room.players.values()]
        .filter(p => p.role === 'impostor' && p.id !== id)
        .map(p => ({ id: p.id, name: p.name, color: p.color }));

      io.to(id).emit('gameStarted', {
        role: player.role,
        specialRole: player.specialRole,
        tasks: player.tasks,
        players: [...room.players.values()].map(p => ({
          id: p.id, name: p.name, color: p.color, hat: p.hat, outfit: p.outfit, pet: p.pet, avatar: p.avatar, x: p.x, y: p.y, alive: true,
          killCooldown: p.role === 'impostor' ? p.killCooldown : undefined,
        })),
        otherImpostors: player.role === 'impostor' ? otherImpostors : [],
        settings: room.settings,
      });
    }

    startGameLoop(room);
  });

  // --- PLAYER MOVE ---
  socket.on('playerMove', ({ x, y }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive) return;

    const dx = x - player.x;
    const dy = y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = room.settings.playerSpeed * 1.5; // allow some slack

    let targetX = x;
    let targetY = y;

    if (dist > maxDist) {
      targetX = player.x + (dx / dist) * maxDist;
      targetY = player.y + (dy / dist) * maxDist;
    }

    const currentMap = getMap(room);
    if (isWalkable(targetX, targetY, currentMap)) {
      player.x = targetX;
      player.y = targetY;
    } else {
      // Try sliding along axes
      if (isWalkable(targetX, player.y, currentMap)) {
        player.x = targetX;
      } else if (isWalkable(player.x, targetY, currentMap)) {
        player.y = targetY;
      }
    }
  });

  // --- GHOST MOVE (dead players move freely) ---
  socket.on('ghostMove', ({ x, y }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || player.alive) return;

    player.x = x;
    player.y = y;
  });

  // --- KILL ---
  socket.on('doKill', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive || player.role !== 'impostor') return;
    if (player.killCooldown > 0) return;

    let nearestDist = KILL_RANGE;
    let victim = null;
    for (const [, other] of room.players) {
      if (other.id === player.id || !other.alive || other.role === 'impostor') continue;
      const d = distance(player, other);
      if (d < nearestDist) {
        nearestDist = d;
        victim = other;
      }
    }

    if (!victim) return;

    victim.alive = false;
    player.killCooldown = room.settings.killCooldown;

    const body = {
      playerId: victim.id,
      color: victim.color,
      hat: victim.hat,
      outfit: victim.outfit,
      x: victim.x,
      y: victim.y,
    };
    room.bodies.push(body);

    // Track kill stats
    if (!room.gameStats) room.gameStats = {};
    if (!room.gameStats[player.id]) room.gameStats[player.id] = { kills: 0 };
    room.gameStats[player.id].kills = (room.gameStats[player.id].kills || 0) + 1;

    const killAnimTypes = ['tongue', 'knife', 'snap'];
    const animType = killAnimTypes[Math.floor(Math.random() * killAnimTypes.length)];

    io.to(room.code).emit('playerKilled', {
      victimId: victim.id,
      body,
      killerId: player.id,
      killerColor: player.color,
      victimColor: victim.color,
      animType,
    });

    // Snap impostor to victim's position
    player.x = victim.x;
    player.y = victim.y;

    checkWinConditions(room);
  });

  // --- REPORT BODY ---
  socket.on('reportBody', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive) return;

    let nearestBody = null;
    let nearestDist = REPORT_RANGE;
    for (const body of room.bodies) {
      const d = distance(player, body);
      if (d < nearestDist) {
        nearestDist = d;
        nearestBody = body;
      }
    }

    if (!nearestBody) return;
    startMeeting(room, socket.id, nearestBody);
  });

  // --- EMERGENCY ---
  socket.on('callEmergency', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    if (room.activeSabotage) return; // Can't call emergency during sabotage
    const player = room.players.get(socket.id);
    if (!player || !player.alive || !player.canCallEmergency) return;

    const d = distance(player, getMap(room).emergencyButton);
    if (d > EMERGENCY_RANGE) return;

    player.canCallEmergency = false;
    startMeeting(room, socket.id, null);
  });

  // --- SABOTAGE ---
  socket.on('triggerSabotage', ({ type }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive || player.role !== 'impostor') return;
    if (room.activeSabotage) return; // already active
    if (room.sabotageCooldown > 0) return;
    if (!['lights', 'o2', 'reactor'].includes(type)) return;

    room.activeSabotage = {
      type,
      timeLeft: SABOTAGE_TIMERS[type],
      fixProgress: 0,
    };
    // For lights: track which switches are fixed (5 switches)
    if (type === 'lights') {
      room.activeSabotage.switches = [false, false, false, false, false];
    }
    // For O2: two code panels
    if (type === 'o2') {
      room.activeSabotage.panelsFixed = [false, false];
    }

    io.to(room.code).emit('sabotageStarted', {
      type,
      timeLeft: SABOTAGE_TIMERS[type],
    });
  });

  // --- FIX SABOTAGE ---
  socket.on('fixSabotage', ({ stationIndex, action }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing' || !room.activeSabotage) return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive) return;

    const sab = room.activeSabotage;
    const stations = getMap(room).sabotageFixStations[sab.type];
    if (!stations || !stations[stationIndex]) return;

    const station = stations[stationIndex];
    if (distance(player, station) > SABOTAGE_FIX_RANGE) return;

    if (sab.type === 'lights') {
      // Toggle switch
      if (action === 'toggleSwitch' && typeof stationIndex === 'number') {
        // stationIndex is 0 for lights (single panel), action data has switchIndex
        // Actually for lights we just track completion
        sab.fixProgress = (sab.fixProgress || 0) + 1;
        if (sab.fixProgress >= 5) {
          clearSabotage(room);
        }
      }
    } else if (sab.type === 'o2') {
      sab.panelsFixed[stationIndex] = true;
      if (sab.panelsFixed[0] && sab.panelsFixed[1]) {
        clearSabotage(room);
      } else {
        io.to(room.code).emit('sabotageProgress', {
          type: 'o2',
          panelsFixed: [...sab.panelsFixed],
        });
      }
    } else if (sab.type === 'reactor') {
      // Hold reactor button
      if (action === 'hold') {
        player.holdingReactor = true;
      } else if (action === 'release') {
        player.holdingReactor = false;
      }
    }
  });

  // --- VOTE ---
  socket.on('castVote', ({ targetId }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'voting') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive) return;
    if (room.votes.has(socket.id)) return; // already voted

    if (targetId !== 'skip') {
      const target = room.players.get(targetId);
      if (!target || !target.alive) return;
    }

    room.votes.set(socket.id, targetId);
    io.to(room.code).emit('voteUpdate', { voterId: socket.id });

    // Check if all alive players have voted
    const aliveCount = [...room.players.values()].filter(p => p.alive).length;
    if (room.votes.size >= aliveCount) {
      clearTimeout(room.votingTimer);
      tallyVotes(room);
    }
  });

  // --- MEETING CHAT ---
  socket.on('meetingChat', ({ message }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || (room.phase !== 'meeting' && room.phase !== 'voting')) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    const text = String(message).trim().slice(0, 200);
    if (!text) return;

    const chatData = {
      senderId: socket.id,
      name: player.name,
      color: player.color,
      message: text,
      ghost: !player.alive,
    };

    // Living players see only living chat; dead see all
    for (const [, p] of room.players) {
      if (!player.alive && !p.alive) {
        // Ghost to ghost
        io.to(p.id).emit('meetingChatMessage', chatData);
      } else if (player.alive) {
        // Living player's message goes to everyone
        io.to(p.id).emit('meetingChatMessage', chatData);
      }
    }
  });

  // --- COMPLETE TASK ---
  socket.on('completeTask', ({ taskId }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || (room.phase !== 'playing' && room.phase !== 'meeting' && room.phase !== 'voting')) return;
    const player = room.players.get(socket.id);
    if (!player) return;

    const task = player.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    task.completed = true;

    // Only crewmate tasks count toward task bar
    if (player.role === 'crewmate') {
      room.completedTasks++;
      io.to(room.code).emit('taskUpdate', {
        taskBar: room.totalTasks > 0 ? room.completedTasks / room.totalTasks : 0,
      });
      checkWinConditions(room);
    }
  });

  // --- RETURN TO LOBBY ---
  socket.on('returnToLobby', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.host !== socket.id) return;

    if (room.loopInterval) {
      clearInterval(room.loopInterval);
      room.loopInterval = null;
    }
    if (room.meetingTimer) clearTimeout(room.meetingTimer);
    if (room.votingTimer) clearTimeout(room.votingTimer);

    room.phase = 'lobby';
    room.bodies = [];
    room.votes.clear();
    room.totalTasks = 0;
    room.completedTasks = 0;
    room.activeSabotage = null;
    room.sabotageCooldown = 0;

    for (const [, player] of room.players) {
      player.role = null;
      player.alive = true;
      player.tasks = [];
      player.killCooldown = 0;
      player.canCallEmergency = true;
      player.holdingReactor = false;
      const lobbyMap = getMap(room);
      player.x = lobbyMap.spawnPoint.x;
      player.y = lobbyMap.spawnPoint.y;
    }

    const playersList = [...room.players.values()].map(p => ({
      id: p.id, name: p.name, color: p.color, hat: p.hat, outfit: p.outfit, pet: p.pet, avatar: p.avatar,
    }));

    io.to(room.code).emit('returnedToLobby', {
      players: playersList,
      settings: room.settings,
      host: room.host,
    });
  });

  // --- CLOSE DOOR ---
  socket.on('closeDoor', ({ doorId }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive || player.role !== 'impostor') return;

    const door = room.doors.find(d => d.id === doorId);
    if (!door || door.closed || door.cooldown > 0) return;

    door.closed = true;
    io.to(room.code).emit('doorStateChanged', { doorId, closed: true });

    // Auto-open after 10 seconds
    door.timer = setTimeout(() => {
      door.closed = false;
      door.cooldown = 30; // 30s cooldown
      io.to(room.code).emit('doorStateChanged', { doorId, closed: false });

      // Cooldown countdown
      const cooldownInterval = setInterval(() => {
        door.cooldown--;
        if (door.cooldown <= 0) {
          door.cooldown = 0;
          clearInterval(cooldownInterval);
        }
      }, 1000);
    }, 10000);
  });

  // --- EMOTE ---
  socket.on('emote', ({ emoteId }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive) return;
    if (typeof emoteId !== 'number' || emoteId < 0 || emoteId > 5) return;
    socket.to(roomCode).emit('playerEmote', { playerId: socket.id, emoteId });
  });

  // --- QUICK CHAT ---
  socket.on('quickChat', ({ messageId }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive) return;
    if (typeof messageId !== 'number' || messageId < 0 || messageId > 7) return;
    socket.to(roomCode).emit('playerQuickChat', { playerId: socket.id, messageId });
  });

  // --- UPDATE SETTINGS ---
  socket.on('updateSettings', (newSettings) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'lobby') return;
    if (room.host !== socket.id) return; // only host can change

    const s = room.settings;
    if (newSettings.numImpostors !== undefined) s.numImpostors = Math.min(3, Math.max(1, parseInt(newSettings.numImpostors) || 1));
    if (newSettings.killCooldown !== undefined) s.killCooldown = Math.min(60, Math.max(5, parseInt(newSettings.killCooldown) || 30));
    if (newSettings.playerSpeed !== undefined) s.playerSpeed = Math.min(6, Math.max(1, parseInt(newSettings.playerSpeed) || 3));
    if (newSettings.taskCount !== undefined) s.taskCount = Math.min(10, Math.max(1, parseInt(newSettings.taskCount) || 5));
    if (newSettings.discussionTime !== undefined) s.discussionTime = Math.min(300, Math.max(5, parseInt(newSettings.discussionTime) || 15));
    if (newSettings.votingTime !== undefined) s.votingTime = Math.min(300, Math.max(15, parseInt(newSettings.votingTime) || 120));
    if (newSettings.crewmateVision !== undefined) s.crewmateVision = Math.min(2, Math.max(0.25, parseFloat(newSettings.crewmateVision) || 1));
    if (newSettings.impostorVision !== undefined) s.impostorVision = Math.min(3, Math.max(0.5, parseFloat(newSettings.impostorVision) || 1.5));
    if (newSettings.confirmEjects !== undefined) s.confirmEjects = !!newSettings.confirmEjects;
    if (newSettings.anonymousVotes !== undefined) s.anonymousVotes = !!newSettings.anonymousVotes;
    if (newSettings.specialRoles !== undefined) s.specialRoles = !!newSettings.specialRoles;
    if (newSettings.mapName !== undefined) s.mapName = ['alpha', 'beta'].includes(newSettings.mapName) ? newSettings.mapName : 'alpha';

    io.to(roomCode).emit('settingsUpdated', room.settings);
  });

  // --- CHANGE SKIN ---
  socket.on('changeSkin', ({ hat, outfit, pet }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.get(socket.id);
    if (!player) return;

    if (hat !== undefined && HATS.includes(hat)) player.hat = hat;
    if (outfit !== undefined && OUTFITS.includes(outfit)) player.outfit = outfit;
    if (pet !== undefined && PETS.includes(pet)) player.pet = pet;

    socket.to(roomCode).emit('skinChanged', {
      playerId: socket.id, hat: player.hat, outfit: player.outfit, pet: player.pet,
    });
  });

  // --- CHANGE AVATAR ---
  socket.on('changeAvatar', ({ avatar }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.get(socket.id);
    if (!player) return;

    if (avatar !== null) {
      if (typeof avatar !== 'string' || avatar.length > 13334) return;
      if (!/^[A-Za-z0-9+/=]+$/.test(avatar)) return;
    }

    player.avatar = avatar;
    socket.to(roomCode).emit('avatarChanged', {
      playerId: socket.id, avatar: player.avatar,
    });
  });

  // --- CHANGE COLOR ---
  socket.on('changeColor', ({ color }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.get(socket.id);
    if (!player) return;
    if (!COLORS.includes(color)) return;
    // Check color not taken
    const taken = [...room.players.values()].some(p => p.id !== socket.id && p.color === color);
    if (taken) return;
    player.color = color;
    io.to(roomCode).emit('colorChanged', { playerId: socket.id, color });
  });

  // --- TOGGLE PUBLIC ROOM ---
  socket.on('togglePublic', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return;
    room.isPublic = !room.isPublic;
    socket.emit('publicToggled', { isPublic: room.isPublic });
  });

  // --- LIST PUBLIC ROOMS ---
  socket.on('listRooms', () => {
    const roomList = [];
    for (const [code, room] of rooms) {
      if (room.isPublic && room.phase === 'lobby') {
        const host = room.players.get(room.host);
        roomList.push({
          code,
          hostName: host ? host.name : 'Unknown',
          playerCount: room.players.size,
          maxPlayers: room.settings.maxPlayers,
        });
      }
    }
    socket.emit('roomList', { rooms: roomList });
  });

  // --- SPECTATE ---
  socket.on('spectateRoom', ({ code, name }) => {
    const roomCode = (code || '').toUpperCase().trim();
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('joinError', { message: 'Room not found' });
      return;
    }
    socketToRoom.set(socket.id, roomCode);
    socket.join(roomCode);
    room.spectators.add(socket.id);

    const pList = [...room.players.values()].map(p => ({
      id: p.id, name: p.name, color: p.color, hat: p.hat, outfit: p.outfit, pet: p.pet, avatar: p.avatar,
      x: p.x, y: p.y, alive: p.alive,
    }));
    socket.emit('spectateJoined', {
      code: roomCode,
      phase: room.phase,
      players: pList,
      bodies: room.bodies,
      settings: room.settings,
    });
  });

  // --- VENT MOVE ---
  socket.on('ventMove', ({ ventIndex }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive) return;
    const isEngineer = player.role === 'crewmate' && player.specialRole === 'engineer';
    if (player.role !== 'impostor' && !isEngineer) return;
    if (isEngineer && player.engineerVents <= 0) return;
    const vent = getMap(room).vents[ventIndex];
    if (!vent) return;
    let dest;
    if (distance(player, vent.a) < 60) dest = vent.b;
    else if (distance(player, vent.b) < 60) dest = vent.a;
    else return;
    player.x = dest.x;
    player.y = dest.y;
    if (isEngineer) {
      player.engineerVents--;
      socket.emit('engineerVentsLeft', { remaining: player.engineerVents });
    }
    socket.emit('ventTeleport', { x: dest.x, y: dest.y });
  });

  // --- SHERIFF KILL ---
  socket.on('sheriffKill', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive || player.specialRole !== 'sheriff') return;
    if (player.sheriffShots <= 0) return;

    player.sheriffShots--;
    let nearestDist = KILL_RANGE;
    let target = null;
    for (const [, other] of room.players) {
      if (other.id === player.id || !other.alive) continue;
      const d = distance(player, other);
      if (d < nearestDist) { nearestDist = d; target = other; }
    }
    if (!target) return;

    if (target.role === 'impostor') {
      // Sheriff correctly identified impostor
      target.alive = false;
      room.bodies.push({ playerId: target.id, color: target.color, hat: target.hat, outfit: target.outfit, x: target.x, y: target.y });
      io.to(room.code).emit('playerKilled', { playerId: target.id, color: target.color, hat: target.hat, outfit: target.outfit, x: target.x, y: target.y, killerId: player.id, animType: 'knife' });
    } else {
      // Sheriff killed innocent — sheriff dies
      player.alive = false;
      room.bodies.push({ playerId: player.id, color: player.color, hat: player.hat, outfit: player.outfit, x: player.x, y: player.y });
      io.to(room.code).emit('playerKilled', { playerId: player.id, color: player.color, hat: player.hat, outfit: player.outfit, x: player.x, y: player.y, killerId: player.id, animType: 'snap' });
    }
    checkWinConditions(room);
  });

  // --- VITALS (Scientist) ---
  socket.on('checkVitals', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive || player.specialRole !== 'scientist') return;
    if (player.vitalsCooldown > 0) return;

    player.vitalsCooldown = 30; // 30 second cooldown
    const vitals = [...room.players.values()].map(p => ({
      name: p.name, color: p.color, alive: p.alive,
    }));
    socket.emit('vitalsData', { vitals });
  });

  // --- SECURITY CAMERAS ---
  socket.on('watchCameras', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive) return;
    if (distance(player, getMap(room).securityConsole) > 80) return;

    player.watchingCameras = true;
    io.to(roomCode).emit('cameraWatcher', { watching: true });
  });

  socket.on('stopWatchCameras', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    player.watchingCameras = false;
    // Check if anyone else is watching
    const anyWatching = [...room.players.values()].some(p => p.watchingCameras);
    if (!anyWatching) {
      io.to(roomCode).emit('cameraWatcher', { watching: false });
    }
  });

  socket.on('requestCameraFeed', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.watchingCameras) return;

    const feed = getMap(room).cameras.map(cam => {
      const playersInView = [];
      for (const [, p] of room.players) {
        if (!p.alive) continue;
        if (distance(p, cam) < cam.range) {
          playersInView.push({ color: p.color, x: p.x, y: p.y, name: p.name });
        }
      }
      return { id: cam.id, name: cam.name, cx: cam.x, cy: cam.y, players: playersInView };
    });
    socket.emit('cameraFeed', { feed });
  });

  // --- ADMIN TABLE ---
  socket.on('requestAdminTable', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'playing') return;
    const player = room.players.get(socket.id);
    if (!player || !player.alive) return;
    const adminMap = getMap(room);
    if (distance(player, adminMap.adminConsole) > 80) return;

    const occupancy = {};
    for (const r of adminMap.rooms) {
      occupancy[r.name] = 0;
    }
    for (const [, p] of room.players) {
      if (!p.alive) continue;
      for (const r of adminMap.rooms) {
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
          occupancy[r.name]++;
          break;
        }
      }
    }
    socket.emit('adminTableData', { occupancy });
  });

  // --- REJOIN (mobile reconnection) ---
  socket.on('rejoinRoom', ({ code, name }) => {
    const key = code + ':' + name;
    const pending = pendingReconnects.get(key);
    if (!pending) {
      socket.emit('rejoinFailed');
      return;
    }
    const room = rooms.get(pending.roomCode);
    if (!room) {
      pendingReconnects.delete(key);
      socket.emit('rejoinFailed');
      return;
    }
    // Clear the grace timeout
    clearTimeout(pending.timeout);
    pendingReconnects.delete(key);
    // Restore player with new socket id
    const playerData = pending.playerData;
    playerData.id = socket.id;
    room.players.set(socket.id, playerData);
    socketToRoom.set(socket.id, pending.roomCode);
    socket.join(pending.roomCode);

    if (room.phase === 'lobby') {
      const pList = [...room.players.values()].map(p => ({ id: p.id, name: p.name, color: p.color, hat: p.hat, outfit: p.outfit, avatar: p.avatar }));
      socket.emit('roomJoined', { code: pending.roomCode, players: pList, settings: room.settings, host: room.host });
      io.to(pending.roomCode).emit('playerJoined', { id: socket.id, name: playerData.name, color: playerData.color, hat: playerData.hat, outfit: playerData.outfit, pet: playerData.pet, avatar: playerData.avatar });
    } else {
      // Rejoin mid-game: send gameStarted with current state
      const otherImp = playerData.role === 'impostor'
        ? [...room.players.values()].filter(p => p.role === 'impostor' && p.id !== socket.id).map(p => ({ id: p.id, name: p.name }))
        : [];
      const pList = [...room.players.values()].map(p => ({
        id: p.id, name: p.name, color: p.color, hat: p.hat, outfit: p.outfit, pet: p.pet, avatar: p.avatar,
        x: p.x, y: p.y, alive: p.alive, killCooldown: p.role === 'impostor' ? p.killCooldown : undefined,
      }));
      socket.emit('gameStarted', {
        role: playerData.role,
        specialRole: playerData.specialRole,
        tasks: playerData.tasks,
        players: pList,
        otherImpostors: otherImp,
        settings: room.settings,
      });
    }
  });

  // --- WEBRTC VOICE CHAT SIGNALING ---
  socket.on('voiceReady', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    player.voiceReady = true;
    // Notify other voice-ready players to initiate peer connection
    for (const [id, p] of room.players) {
      if (id !== socket.id && p.voiceReady) {
        io.to(id).emit('voicePeerJoined', { peerId: socket.id });
      }
    }
  });

  socket.on('voiceOffer', ({ targetId, offer }) => {
    io.to(targetId).emit('voiceOffer', { fromId: socket.id, offer });
  });

  socket.on('voiceAnswer', ({ targetId, answer }) => {
    io.to(targetId).emit('voiceAnswer', { fromId: socket.id, answer });
  });

  socket.on('voiceIceCandidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('voiceIceCandidate', { fromId: socket.id, candidate });
  });

  socket.on('voiceStop', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (player) player.voiceReady = false;
    io.to(roomCode).emit('voicePeerLeft', { peerId: socket.id });
  });

  // --- DISCONNECT ---
  socket.on('disconnect', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    // Clean up spectators
    if (room.spectators && room.spectators.has(socket.id)) {
      room.spectators.delete(socket.id);
      socketToRoom.delete(socket.id);
      return;
    }

    const player = room.players.get(socket.id);
    if (!player) return;

    // Save player data for potential reconnection
    const playerData = { ...player };
    const key = roomCode + ':' + player.name;

    room.players.delete(socket.id);
    socketToRoom.delete(socket.id);

    if (room.players.size === 0) {
      // Last player - clean up after grace period too
      const timeout = setTimeout(() => {
        pendingReconnects.delete(key);
        if (rooms.has(roomCode) && rooms.get(roomCode).players.size === 0) {
          cleanupRoom(roomCode);
        }
      }, RECONNECT_GRACE_MS);
      pendingReconnects.set(key, { playerData, roomCode, timeout, oldSocketId: socket.id });
      return;
    }

    // Store pending reconnect with grace period
    const timeout = setTimeout(() => {
      pendingReconnects.delete(key);
      // Player didn't reconnect - notify others
      io.to(roomCode).emit('playerLeft', { playerId: playerData.id });
      const currentRoom = rooms.get(roomCode);
      if (currentRoom) {
        // Transfer host if this was the host
        if (currentRoom.host === playerData.id && currentRoom.players.size > 0) {
          currentRoom.host = currentRoom.players.keys().next().value;
          io.to(roomCode).emit('hostChanged', { hostId: currentRoom.host });
        }
        if (currentRoom.phase === 'playing' || currentRoom.phase === 'meeting' || currentRoom.phase === 'voting') {
          checkWinConditions(currentRoom);
          if (currentRoom.phase === 'voting') {
            const aliveCount = [...currentRoom.players.values()].filter(p => p.alive).length;
            if (currentRoom.votes.size >= aliveCount) {
              clearTimeout(currentRoom.votingTimer);
              tallyVotes(currentRoom);
            }
          }
        }
      }
    }, RECONNECT_GRACE_MS);

    pendingReconnects.set(key, { playerData, roomCode, timeout, oldSocketId: socket.id });

    // Transfer host immediately if needed (so game can continue)
    if (room.host === socket.id) {
      room.host = room.players.keys().next().value;
      io.to(room.code).emit('hostChanged', { hostId: room.host });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Space Betrayal server running on http://localhost:${PORT}`);
});
