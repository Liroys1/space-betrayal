const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// ============================================
// CONSTANTS (KEEP IN SYNC WITH game.js)
// ============================================
const PLAYER_RADIUS = 18;
const KILL_RANGE = 80;
const REPORT_RANGE = 100;
const TASK_RANGE = 60;
const EMERGENCY_RANGE = 60;
const TICK_RATE = 100; // ms per tick (10 Hz)

const COLORS = [
  '#c51111', '#132ed2', '#11802d', '#ee54bb',
  '#f07d06', '#f6f657', '#3f474e', '#d6e0f0',
  '#6b2fbb', '#71491e', '#38fedb', '#50ef39',
];

const HATS = ['none', 'crown', 'tophat', 'partyhat', 'chef', 'headband', 'flower', 'devil', 'halo', 'beanie', 'antenna', 'pirate'];
const OUTFITS = ['none', 'suit', 'labcoat', 'military', 'scarf', 'cape', 'toolbelt'];

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
    { x: 1250, y: 1130, w: 60, h: 90 },  // Shields <-> Kitchen
  ],
  emergencyButton: { x: 900, y: 425 },
  spawnPoint: { x: 900, y: 425 },
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
];

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
      alive: p.alive, name: p.name, hat: p.hat, outfit: p.outfit,
      killCooldown: p.role === 'impostor' ? p.killCooldown : undefined,
    });
  }
  return {
    players,
    bodies: room.bodies,
    taskBar: room.totalTasks > 0 ? room.completedTasks / room.totalTasks : 0,
  };
}

function assignRoles(room) {
  const playerList = [...room.players.values()];
  const shuffled = playerList.sort(() => Math.random() - 0.5);
  const numImpostors = room.settings.numImpostors;

  for (let i = 0; i < shuffled.length; i++) {
    shuffled[i].role = i < numImpostors ? 'impostor' : 'crewmate';
    shuffled[i].alive = true;
    shuffled[i].killCooldown = room.settings.killCooldown;
    shuffled[i].canCallEmergency = true;
  }
}

function assignTasks(room) {
  const crewmates = [...room.players.values()].filter(p => p.role === 'crewmate');
  const impostors = [...room.players.values()].filter(p => p.role === 'impostor');
  const taskCount = room.settings.taskCount;

  room.totalTasks = crewmates.length * taskCount;
  room.completedTasks = 0;

  for (const player of crewmates) {
    const shuffled = [...TASK_DEFINITIONS].sort(() => Math.random() - 0.5);
    player.tasks = shuffled.slice(0, taskCount).map(t => ({ ...t, completed: false }));
  }

  for (const player of impostors) {
    const shuffled = [...TASK_DEFINITIONS].sort(() => Math.random() - 0.5);
    player.tasks = shuffled.slice(0, taskCount).map(t => ({ ...t, completed: false }));
  }
}

function spawnPlayers(room) {
  const sp = MAP.spawnPoint;
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

  io.to(room.code).emit('gameOver', { winner, reason, roles });
}

function startGameLoop(room) {
  room.loopInterval = setInterval(() => {
    if (room.phase !== 'playing') return;

    for (const [, player] of room.players) {
      if (player.role === 'impostor' && player.killCooldown > 0) {
        player.killCooldown = Math.max(0, player.killCooldown - TICK_RATE / 1000);
      }
    }

    const snapshot = buildSnapshot(room);
    io.to(room.code).emit('gameState', snapshot);
  }, TICK_RATE);
}

function startMeeting(room, callerId, body) {
  room.phase = 'meeting';
  room.meetingCaller = callerId;
  room.reportedBody = body || null;
  room.votes.clear();
  room.bodies = [];

  const sp = MAP.spawnPoint;
  for (const [, player] of room.players) {
    if (player.alive) {
      player.x = sp.x + (Math.random() - 0.5) * 100;
      player.y = sp.y + (Math.random() - 0.5) * 100;
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
    votes: voteMap,
    ejected: ejectedId,
    ejectedName,
    ejectedColor,
    ejectedRole,
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
    };

    const player = {
      id: socket.id,
      name: name.trim().substring(0, 12),
      color: COLORS[0],
      hat: 'none',
      outfit: 'none',
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
      player: { id: player.id, name: player.name, color: player.color, hat: player.hat, outfit: player.outfit, avatar: player.avatar },
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

    const player = {
      id: socket.id,
      name: name.trim().substring(0, 12),
      color: getAvailableColor(room),
      hat: 'none',
      outfit: 'none',
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
    socketToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    const playersList = [...room.players.values()].map(p => ({
      id: p.id, name: p.name, color: p.color, hat: p.hat, outfit: p.outfit, avatar: p.avatar,
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
        tasks: player.tasks,
        players: [...room.players.values()].map(p => ({
          id: p.id, name: p.name, color: p.color, hat: p.hat, outfit: p.outfit, avatar: p.avatar, x: p.x, y: p.y, alive: true,
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

    if (isWalkable(targetX, targetY)) {
      player.x = targetX;
      player.y = targetY;
    } else {
      // Try sliding along axes
      if (isWalkable(targetX, player.y)) {
        player.x = targetX;
      } else if (isWalkable(player.x, targetY)) {
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

    io.to(room.code).emit('playerKilled', { victimId: victim.id, body });

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
    const player = room.players.get(socket.id);
    if (!player || !player.alive || !player.canCallEmergency) return;

    const d = distance(player, MAP.emergencyButton);
    if (d > EMERGENCY_RANGE) return;

    player.canCallEmergency = false;
    startMeeting(room, socket.id, null);
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

    for (const [, player] of room.players) {
      player.role = null;
      player.alive = true;
      player.tasks = [];
      player.killCooldown = 0;
      player.canCallEmergency = true;
      player.x = MAP.spawnPoint.x;
      player.y = MAP.spawnPoint.y;
    }

    const playersList = [...room.players.values()].map(p => ({
      id: p.id, name: p.name, color: p.color, hat: p.hat, outfit: p.outfit, avatar: p.avatar,
    }));

    io.to(room.code).emit('returnedToLobby', {
      players: playersList,
      settings: room.settings,
      host: room.host,
    });
  });

  // --- CHANGE SKIN ---
  socket.on('changeSkin', ({ hat, outfit }) => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.get(socket.id);
    if (!player) return;

    if (hat !== undefined && HATS.includes(hat)) player.hat = hat;
    if (outfit !== undefined && OUTFITS.includes(outfit)) player.outfit = outfit;

    socket.to(roomCode).emit('skinChanged', {
      playerId: socket.id, hat: player.hat, outfit: player.outfit,
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

  // --- DISCONNECT ---
  socket.on('disconnect', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    room.players.delete(socket.id);
    socketToRoom.delete(socket.id);

    if (room.players.size === 0) {
      cleanupRoom(roomCode);
      return;
    }

    // Transfer host if needed
    if (room.host === socket.id) {
      room.host = room.players.keys().next().value;
      io.to(room.code).emit('hostChanged', { hostId: room.host });
    }

    io.to(room.code).emit('playerLeft', { playerId: socket.id });

    if (room.phase === 'playing' || room.phase === 'meeting' || room.phase === 'voting') {
      checkWinConditions(room);

      // If during voting, check if all remaining alive have voted
      if (room.phase === 'voting') {
        const aliveCount = [...room.players.values()].filter(p => p.alive).length;
        if (room.votes.size >= aliveCount) {
          clearTimeout(room.votingTimer);
          tallyVotes(room);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Space Betrayal server running on http://localhost:${PORT}`);
});
