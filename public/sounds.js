// ============================================
// SPACE BETRAYAL — SOUND ENGINE
// Procedural Web Audio API synthesizer
// No audio files needed — all sounds generated
// ============================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.currentMusic = null;
    this.musicNodes = [];
    this.loadVolumes();
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyVolumes();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  ensure() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.initialized;
  }

  // --- Volume Management ---
  loadVolumes() {
    try {
      const saved = JSON.parse(localStorage.getItem('sb_volume'));
      this.volumes = { master: 0.7, sfx: 0.8, music: 0.4, ...(saved || {}) };
    } catch { this.volumes = { master: 0.7, sfx: 0.8, music: 0.4 }; }
  }

  saveVolumes() {
    localStorage.setItem('sb_volume', JSON.stringify(this.volumes));
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.masterGain) return;
    this.masterGain.gain.value = this.volumes.master;
    this.sfxGain.gain.value = this.volumes.sfx;
    this.musicGain.gain.value = this.volumes.music;
  }

  setVolume(type, val) {
    this.volumes[type] = Math.max(0, Math.min(1, val));
    this.saveVolumes();
  }

  // --- Utility: create noise buffer ---
  noiseBuffer(duration) {
    const len = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // --- Utility: play oscillator with envelope ---
  osc(type, freq, start, dur, gainVal, dest) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gainVal, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g);
    g.connect(dest || this.sfxGain);
    o.start(start);
    o.stop(start + dur);
  }

  // --- Utility: play noise burst ---
  noise(start, dur, gainVal, dest) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer(dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainVal, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    src.connect(g);
    g.connect(dest || this.sfxGain);
    src.start(start);
    src.stop(start + dur);
  }

  // =====================
  // SOUND EFFECTS
  // =====================

  play(name) {
    if (!this.ensure()) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'kill': this.playKill(t); break;
      case 'meeting': this.playMeeting(t); break;
      case 'vote': this.playVote(t); break;
      case 'taskComplete': this.playTaskComplete(t); break;
      case 'sabotageAlarm': this.playSabotageAlarm(t); break;
      case 'doorClose': this.playDoorClose(t); break;
      case 'ventMove': this.playVentMove(t); break;
      case 'footstep': this.playFootstep(t); break;
      case 'buttonClick': this.playButtonClick(t); break;
      case 'gameStart': this.playGameStart(t); break;
      case 'victory': this.playVictory(t); break;
      case 'defeat': this.playDefeat(t); break;
      case 'emergency': this.playEmergency(t); break;
      case 'eject': this.playEject(t); break;
      case 'chat': this.playChat(t); break;
      case 'emote': this.playEmote(t); break;
      case 'sabotageFixed': this.playSabotageFixed(t); break;
    }
  }

  playKill(t) {
    // Stab hit: sawtooth sweep down + noise burst
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(400, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.3);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + 0.35);
    this.noise(t, 0.15, 0.4);
    // Short scream: high sine wobble
    this.osc('sine', 800, t + 0.05, 0.2, 0.25);
    this.osc('sine', 900, t + 0.1, 0.15, 0.15);
  }

  playMeeting(t) {
    // Alarm bell: rapid triangle hits
    for (let i = 0; i < 6; i++) {
      this.osc('triangle', 880, t + i * 0.12, 0.08, 0.4);
      this.osc('triangle', 1100, t + i * 0.12 + 0.06, 0.06, 0.25);
    }
  }

  playVote(t) {
    // Stamp click
    this.noise(t, 0.06, 0.3);
    this.osc('sine', 300, t, 0.08, 0.2);
  }

  playTaskComplete(t) {
    // Happy ascending chime
    this.osc('sine', 523, t, 0.15, 0.3);       // C5
    this.osc('sine', 659, t + 0.12, 0.15, 0.3); // E5
    this.osc('sine', 784, t + 0.24, 0.2, 0.35); // G5
    this.osc('sine', 1047, t + 0.36, 0.3, 0.25); // C6
  }

  playSabotageAlarm(t) {
    // Warning siren: oscillating square wave
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(400, t);
    o.frequency.linearRampToValueAtTime(800, t + 0.5);
    o.frequency.linearRampToValueAtTime(400, t + 1.0);
    g.gain.setValueAtTime(0.2, t);
    g.gain.setValueAtTime(0.2, t + 0.9);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + 1.0);
  }

  playDoorClose(t) {
    // Heavy metal slam
    this.noise(t, 0.2, 0.5);
    this.osc('sine', 80, t, 0.3, 0.4);
    this.osc('sine', 50, t + 0.05, 0.25, 0.3);
  }

  playVentMove(t) {
    // Whoosh: filtered noise sweep
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer(0.4);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(2000, t + 0.2);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    filter.Q.value = 2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    src.connect(filter); filter.connect(g); g.connect(this.sfxGain);
    src.start(t); src.stop(t + 0.4);
  }

  playFootstep(t) {
    // Very soft short tap
    this.noise(t, 0.03, 0.08);
    this.osc('sine', 120 + Math.random() * 40, t, 0.04, 0.06);
  }

  playButtonClick(t) {
    this.osc('sine', 1200, t, 0.04, 0.15);
    this.osc('sine', 800, t + 0.03, 0.03, 0.1);
  }

  playGameStart(t) {
    // Dramatic reveal: building chord
    this.osc('sine', 220, t, 0.6, 0.15);        // A3
    this.osc('sine', 330, t + 0.15, 0.5, 0.15);  // E4
    this.osc('sine', 440, t + 0.3, 0.5, 0.2);    // A4
    this.osc('triangle', 550, t + 0.45, 0.6, 0.2); // C#5
    this.osc('triangle', 660, t + 0.6, 0.5, 0.25); // E5
    this.noise(t + 0.7, 0.15, 0.15);
  }

  playVictory(t) {
    // Ascending major fanfare
    const notes = [523, 659, 784, 1047, 784, 1047]; // C E G C G C
    for (let i = 0; i < notes.length; i++) {
      this.osc('sine', notes[i], t + i * 0.12, 0.2, 0.25);
      this.osc('triangle', notes[i] * 0.5, t + i * 0.12, 0.2, 0.1);
    }
  }

  playDefeat(t) {
    // Sad descending minor
    const notes = [440, 415, 349, 330, 262]; // A Ab F E C
    for (let i = 0; i < notes.length; i++) {
      this.osc('sine', notes[i], t + i * 0.2, 0.3, 0.2);
    }
    this.osc('sawtooth', 130, t + 0.8, 0.6, 0.1);
  }

  playEmergency(t) {
    // Frantic buzzer
    for (let i = 0; i < 4; i++) {
      this.osc('square', 600, t + i * 0.15, 0.08, 0.25);
      this.osc('square', 800, t + i * 0.15 + 0.08, 0.06, 0.2);
    }
  }

  playEject(t) {
    // Whoosh out with pitch shift
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(500, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.8);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + 0.8);
    // Noise whoosh
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer(0.6);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(5000, t + 0.6);
    const gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.25, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    src.connect(filter); filter.connect(gn); gn.connect(this.sfxGain);
    src.start(t); src.stop(t + 0.6);
  }

  playChat(t) {
    // Soft notification blip
    this.osc('sine', 880, t, 0.06, 0.12);
    this.osc('sine', 1100, t + 0.06, 0.08, 0.08);
  }

  playEmote(t) {
    this.osc('sine', 600, t, 0.05, 0.1);
    this.osc('sine', 900, t + 0.05, 0.06, 0.08);
  }

  playSabotageFixed(t) {
    // Relief chime: descending then resolving up
    this.osc('sine', 660, t, 0.12, 0.2);
    this.osc('sine', 550, t + 0.1, 0.12, 0.2);
    this.osc('sine', 660, t + 0.2, 0.12, 0.25);
    this.osc('sine', 880, t + 0.3, 0.25, 0.3);
  }

  // =====================
  // BACKGROUND MUSIC
  // =====================

  startMusic(scene) {
    if (!this.ensure()) return;
    this.stopMusic();
    this.currentMusic = scene;
    switch (scene) {
      case 'lobby': this.musicLobby(); break;
      case 'playing': this.musicPlaying(); break;
      case 'meeting': this.musicMeeting(); break;
    }
  }

  stopMusic() {
    this.currentMusic = null;
    this.musicNodes.forEach(n => { try { n.stop(); } catch {} });
    this.musicNodes = [];
  }

  musicLobby() {
    // Ambient space pad: low drone + slow arpeggios
    const t = this.ctx.currentTime;
    const dur = 16; // loop length
    const loop = () => {
      if (this.currentMusic !== 'lobby') return;
      const now = this.ctx.currentTime;
      // Drone
      const drone = this.ctx.createOscillator();
      const dg = this.ctx.createGain();
      drone.type = 'sine';
      drone.frequency.value = 110;
      dg.gain.setValueAtTime(0.08, now);
      dg.gain.setValueAtTime(0.08, now + dur - 0.5);
      dg.gain.linearRampToValueAtTime(0, now + dur);
      drone.connect(dg); dg.connect(this.musicGain);
      drone.start(now); drone.stop(now + dur);
      this.musicNodes.push(drone);
      // Arpeggios
      const notes = [220, 330, 440, 330, 262, 330, 440, 523];
      for (let i = 0; i < notes.length; i++) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = notes[i];
        const nt = now + i * 2;
        g.gain.setValueAtTime(0, nt);
        g.gain.linearRampToValueAtTime(0.06, nt + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, nt + 1.8);
        o.connect(g); g.connect(this.musicGain);
        o.start(nt); o.stop(nt + 1.9);
        this.musicNodes.push(o);
      }
      setTimeout(loop, (dur - 0.5) * 1000);
    };
    loop();
  }

  musicPlaying() {
    // Tense underscore: minor pad + heartbeat
    const loop = () => {
      if (this.currentMusic !== 'playing') return;
      const now = this.ctx.currentTime;
      const dur = 8;
      // Dark pad
      [165, 196, 247].forEach(freq => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.04, now);
        g.gain.setValueAtTime(0.04, now + dur - 0.5);
        g.gain.linearRampToValueAtTime(0, now + dur);
        o.connect(g); g.connect(this.musicGain);
        o.start(now); o.stop(now + dur);
        this.musicNodes.push(o);
      });
      // Heartbeat pulse
      for (let i = 0; i < 8; i++) {
        const bt = now + i * 1.0;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 55;
        g.gain.setValueAtTime(0.1, bt);
        g.gain.exponentialRampToValueAtTime(0.001, bt + 0.2);
        o.connect(g); g.connect(this.musicGain);
        o.start(bt); o.stop(bt + 0.25);
        this.musicNodes.push(o);
      }
      setTimeout(loop, (dur - 0.5) * 1000);
    };
    loop();
  }

  musicMeeting() {
    // Urgent: ticking + tension
    const loop = () => {
      if (this.currentMusic !== 'meeting') return;
      const now = this.ctx.currentTime;
      const dur = 4;
      // Tension drone
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = 185;
      g.gain.setValueAtTime(0.05, now);
      g.gain.setValueAtTime(0.05, now + dur - 0.3);
      g.gain.linearRampToValueAtTime(0, now + dur);
      o.connect(g); g.connect(this.musicGain);
      o.start(now); o.stop(now + dur);
      this.musicNodes.push(o);
      // Ticking
      for (let i = 0; i < 8; i++) {
        const tt = now + i * 0.5;
        const tick = this.ctx.createOscillator();
        const tg = this.ctx.createGain();
        tick.type = 'sine';
        tick.frequency.value = 1500;
        tg.gain.setValueAtTime(0.06, tt);
        tg.gain.exponentialRampToValueAtTime(0.001, tt + 0.03);
        tick.connect(tg); tg.connect(this.musicGain);
        tick.start(tt); tick.stop(tt + 0.04);
        this.musicNodes.push(tick);
      }
      setTimeout(loop, (dur - 0.3) * 1000);
    };
    loop();
  }
}

// Global instance
const soundEngine = new SoundEngine();

// Initialize on first user interaction
['click', 'touchstart', 'keydown'].forEach(ev => {
  document.addEventListener(ev, () => soundEngine.init(), { once: false, passive: true });
});
