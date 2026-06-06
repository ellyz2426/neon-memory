import {
  World,
  PanelUI,
  Follower,
  FollowBehavior,
  PanelDocument,
  ScreenSpace,
  type UIKitDocument,
  Mesh,
  Group,
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  PlaneGeometry,
  TorusGeometry,
  RingGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  Color,
  Vector3,
  Quaternion,
  Euler,
  EdgesGeometry,
  LineSegments,
  AdditiveBlending,
  Float32BufferAttribute,
  BufferGeometry,
  AmbientLight,
  PointLight,
  DirectionalLight,
  Fog,
  Raycaster,
  Vector2,
  type Object3D,
} from '@iwsdk/core';

// ═══════════════════════════════════════════════
// NEON MEMORY VR — 3D Simon Says Memory Game
// ═══════════════════════════════════════════════

// ─── Types & Constants ─────────────────────────

type GameState = 'title' | 'modeselect' | 'difficulty' | 'layout' | 'playing' | 'watching' | 'input' | 'pause' | 'gameover' | 'leaderboard' | 'achievements' | 'settings' | 'help' | 'stats' | 'skins' | 'countdown';

interface PanelInfo {
  index: number;
  mesh: Mesh;
  glowMesh: Mesh;
  edgeMesh: LineSegments;
  baseColor: Color;
  activeColor: Color;
  frequency: number; // Audio tone
  angle: number;
}

interface GameMode {
  name: string;
  description: string;
  maxLives: number;
  speedMultiplier: number;
  showTimer: boolean;
  reverse: boolean;
  timed: boolean;
  timeLimit: number;
}

interface LayoutConfig {
  name: string;
  panelCount: number;
  description: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  check: () => boolean;
}

interface LeaderboardEntry {
  score: number;
  level: number;
  mode: string;
  layout: string;
  date: string;
}

interface PanelSkin {
  name: string;
  colors: string[];
  glowIntensity: number;
  unlockCondition: string;
}

// ─── Arena Themes ──────────────────────────────

interface ArenaTheme {
  name: string;
  grid: string;
  accent: string;
  fog: string;
  panel: string;
  glow: string;
  bg: string;
}

const ARENA_THEMES: ArenaTheme[] = [
  { name: 'Neon Holodeck', grid: '#00ffff', accent: '#ff00ff', fog: '#000811', panel: '#001a2e', glow: '#00ffff', bg: '#000508' },
  { name: 'Crimson Arcade', grid: '#ff3344', accent: '#ff8800', fog: '#110005', panel: '#2e0008', glow: '#ff3344', bg: '#080002' },
  { name: 'Toxic Neon', grid: '#00ff44', accent: '#88ff00', fog: '#001108', panel: '#002e0a', glow: '#00ff44', bg: '#000805' },
  { name: 'Ultra Violet', grid: '#aa44ff', accent: '#ff44aa', fog: '#0a0011', panel: '#1a002e', glow: '#aa44ff', bg: '#050008' },
  { name: 'Solar Blaze', grid: '#ffaa00', accent: '#ff4400', fog: '#110800', panel: '#2e1a00', glow: '#ffaa00', bg: '#080500' },
];

// Panel colors — distinct, vibrant, colorblind-friendly tones
const PANEL_COLORS: { base: string; active: string; freq: number }[] = [
  { base: '#003344', active: '#00ffff', freq: 261.63 },  // C4 - Cyan
  { base: '#440033', active: '#ff00ff', freq: 293.66 },  // D4 - Magenta
  { base: '#004400', active: '#00ff44', freq: 329.63 },  // E4 - Green
  { base: '#443300', active: '#ffaa00', freq: 349.23 },  // F4 - Orange
  { base: '#330044', active: '#aa44ff', freq: 392.00 },  // G4 - Purple
  { base: '#440000', active: '#ff3344', freq: 440.00 },  // A4 - Red
  { base: '#004433', active: '#00ffaa', freq: 493.88 },  // B4 - Teal
  { base: '#333300', active: '#ffff00', freq: 523.25 },  // C5 - Yellow
  { base: '#003300', active: '#44ff00', freq: 587.33 },  // D5 - Lime
  { base: '#440022', active: '#ff4488', freq: 659.25 },  // E5 - Pink
  { base: '#002244', active: '#4488ff', freq: 698.46 },  // F5 - Blue
  { base: '#442200', active: '#ff8844', freq: 783.99 },  // G5 - Amber
];

const GAME_MODES: GameMode[] = [
  { name: 'Classic', description: 'Repeat the growing sequence', maxLives: 3, speedMultiplier: 1.0, showTimer: false, reverse: false, timed: false, timeLimit: 0 },
  { name: 'Speed', description: 'Faster playback each round', maxLives: 3, speedMultiplier: 0.7, showTimer: false, reverse: false, timed: false, timeLimit: 0 },
  { name: 'Reverse', description: 'Repeat the sequence backwards', maxLives: 3, speedMultiplier: 1.0, showTimer: false, reverse: true, timed: false, timeLimit: 0 },
  { name: 'Rush', description: '60 seconds to reach max level', maxLives: 1, speedMultiplier: 0.8, showTimer: true, reverse: false, timed: true, timeLimit: 60 },
  { name: 'Zen', description: 'No lives, just play', maxLives: 999, speedMultiplier: 1.2, showTimer: false, reverse: false, timed: false, timeLimit: 0 },
  { name: 'Daily', description: 'Same sequence for everyone today', maxLives: 3, speedMultiplier: 1.0, showTimer: false, reverse: false, timed: false, timeLimit: 0 },
  { name: 'Survival', description: 'One mistake and it is over', maxLives: 1, speedMultiplier: 1.0, showTimer: false, reverse: false, timed: false, timeLimit: 0 },
  { name: 'Marathon', description: 'Reach level 50!', maxLives: 5, speedMultiplier: 1.0, showTimer: false, reverse: false, timed: false, timeLimit: 0 },
];

const LAYOUTS: LayoutConfig[] = [
  { name: 'Quad', panelCount: 4, description: '4 panels - Classic Simon' },
  { name: 'Pentagon', panelCount: 5, description: '5 panels - Medium challenge' },
  { name: 'Hexagon', panelCount: 6, description: '6 panels - Standard' },
  { name: 'Octagon', panelCount: 8, description: '8 panels - Advanced' },
  { name: 'Decagon', panelCount: 10, description: '10 panels - Expert' },
  { name: 'Dodecagon', panelCount: 12, description: '12 panels - Master' },
];

const PANEL_SKINS: PanelSkin[] = [
  { name: 'Neon Classic', colors: ['#00ffff', '#ff00ff', '#00ff44', '#ffaa00', '#aa44ff', '#ff3344', '#00ffaa', '#ffff00', '#44ff00', '#ff4488', '#4488ff', '#ff8844'], glowIntensity: 1.0, unlockCondition: 'Default' },
  { name: 'Solar Flare', colors: ['#ff6600', '#ff3300', '#ffaa00', '#ff0066', '#ff8800', '#ffcc00', '#ff4400', '#ff7700', '#ff2200', '#ff5500', '#ff9900', '#ffbb00'], glowIntensity: 1.2, unlockCondition: 'Reach level 10' },
  { name: 'Frost Core', colors: ['#44ccff', '#0088ff', '#00ccff', '#44aaff', '#0066ff', '#88ddff', '#00aaff', '#2299ff', '#0055ff', '#66bbff', '#0077ff', '#33bbff'], glowIntensity: 0.9, unlockCondition: 'Score 5000 points' },
  { name: 'Toxic Pulse', colors: ['#00ff00', '#44ff44', '#00cc00', '#88ff00', '#00ff88', '#33ff33', '#00ee00', '#66ff00', '#00ff66', '#22ff22', '#00dd00', '#44ff00'], glowIntensity: 1.1, unlockCondition: 'Play 20 games' },
  { name: 'Void Purple', colors: ['#9900ff', '#bb44ff', '#7700ff', '#cc66ff', '#aa22ff', '#dd88ff', '#8800ff', '#bb33ff', '#6600ff', '#cc55ff', '#9911ff', '#aa00ff'], glowIntensity: 1.3, unlockCondition: 'Level 15 streak' },
  { name: 'Chrome', colors: ['#cccccc', '#aaaaaa', '#dddddd', '#bbbbbb', '#eeeeee', '#999999', '#e0e0e0', '#b0b0b0', '#d0d0d0', '#a0a0a0', '#c0c0c0', '#909090'], glowIntensity: 0.8, unlockCondition: '100% accuracy' },
  { name: 'Rainbow', colors: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#7700ff', '#ff00ff', '#ff0077', '#ff7700', '#77ff00', '#00ff77'], glowIntensity: 1.4, unlockCondition: 'Complete all modes' },
  { name: 'Midnight', colors: ['#001155', '#002266', '#003377', '#001144', '#002255', '#003366', '#001133', '#002244', '#003355', '#001122', '#002233', '#003344'], glowIntensity: 0.6, unlockCondition: 'Play at midnight' },
];

// ─── Game State Manager ────────────────────────

class GameStateManager {
  // Persistence
  games = 0;
  bestScore = 0;
  bestLevel = 0;
  totalCorrect = 0;
  totalWrong = 0;
  totalPanelHits = 0;
  bestStreak = 0;
  perfectGames = 0;
  modesPlayed = new Set<string>();
  layoutsPlayed = new Set<string>();
  skinsUsed = new Set<string>();
  themesUsed = new Set<string>();
  dailyBest = 0;
  dailyDate = '';
  achievements: Set<string> = new Set();
  leaderboard: LeaderboardEntry[] = [];
  selectedSkin = 0;
  selectedTheme = 0;
  masterVolume = 0.7;
  sfxVolume = 0.8;
  musicVolume = 0.5;
  totalPlayTime = 0;

  // Session state
  state: GameState = 'title';
  sequence: number[] = [];
  playerIndex = 0;
  level = 0;
  score = 0;
  lives = 0;
  combo = 0;
  maxCombo = 0;
  streak = 0;
  currentMode: GameMode = GAME_MODES[0];
  currentLayout: LayoutConfig = LAYOUTS[2]; // Hexagon default
  difficulty = 1; // 0=easy, 1=medium, 2=hard
  timeRemaining = 0;
  roundStartTime = 0;
  sessionStartTime = 0;
  isShowingSequence = false;
  sequenceShowIndex = 0;
  sequenceTimer = 0;
  inputTimer = 0;
  inputTimeout = 10;
  panelFlashTimer = 0;
  correctThisRound = 0;
  wrongThisRound = 0;
  gameStartTime = 0;

  constructor() {
    this.load();
  }

  save() {
    try {
      localStorage.setItem('neon-memory-save', JSON.stringify({
        games: this.games,
        bestScore: this.bestScore,
        bestLevel: this.bestLevel,
        totalCorrect: this.totalCorrect,
        totalWrong: this.totalWrong,
        totalPanelHits: this.totalPanelHits,
        bestStreak: this.bestStreak,
        perfectGames: this.perfectGames,
        modesPlayed: [...this.modesPlayed],
        layoutsPlayed: [...this.layoutsPlayed],
        skinsUsed: [...this.skinsUsed],
        themesUsed: [...this.themesUsed],
        dailyBest: this.dailyBest,
        dailyDate: this.dailyDate,
        achievements: [...this.achievements],
        leaderboard: this.leaderboard.slice(0, 20),
        selectedSkin: this.selectedSkin,
        selectedTheme: this.selectedTheme,
        masterVolume: this.masterVolume,
        sfxVolume: this.sfxVolume,
        musicVolume: this.musicVolume,
        totalPlayTime: this.totalPlayTime,
      }));
    } catch {}
  }

  load() {
    try {
      const data = localStorage.getItem('neon-memory-save');
      if (!data) return;
      const d = JSON.parse(data);
      this.games = d.games || 0;
      this.bestScore = d.bestScore || 0;
      this.bestLevel = d.bestLevel || 0;
      this.totalCorrect = d.totalCorrect || 0;
      this.totalWrong = d.totalWrong || 0;
      this.totalPanelHits = d.totalPanelHits || 0;
      this.bestStreak = d.bestStreak || 0;
      this.perfectGames = d.perfectGames || 0;
      this.modesPlayed = new Set(d.modesPlayed || []);
      this.layoutsPlayed = new Set(d.layoutsPlayed || []);
      this.skinsUsed = new Set(d.skinsUsed || []);
      this.themesUsed = new Set(d.themesUsed || []);
      this.dailyBest = d.dailyBest || 0;
      this.dailyDate = d.dailyDate || '';
      this.achievements = new Set(d.achievements || []);
      this.leaderboard = d.leaderboard || [];
      this.selectedSkin = d.selectedSkin || 0;
      this.selectedTheme = d.selectedTheme || 0;
      this.masterVolume = d.masterVolume ?? 0.7;
      this.sfxVolume = d.sfxVolume ?? 0.8;
      this.musicVolume = d.musicVolume ?? 0.5;
      this.totalPlayTime = d.totalPlayTime || 0;
    } catch {}
  }

  addLeaderboard(entry: LeaderboardEntry) {
    this.leaderboard.push(entry);
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 20);
    this.save();
  }

  getSpeedForLevel(): number {
    const base = 600; // ms per panel flash
    const modeMultiplier = this.currentMode.speedMultiplier;
    const diffMultiplier = [1.3, 1.0, 0.75][this.difficulty];
    const levelReduction = Math.min(this.level * 15, 350);
    return Math.max(150, (base - levelReduction) * modeMultiplier * diffMultiplier);
  }

  getGapForLevel(): number {
    return Math.max(80, this.getSpeedForLevel() * 0.4);
  }

  getInputTimeout(): number {
    return [15, 10, 6][this.difficulty];
  }

  getDailySeededRandom(): () => number {
    const today = new Date().toISOString().slice(0, 10);
    let seed = 0;
    for (let i = 0; i < today.length; i++) {
      seed = ((seed << 5) - seed) + today.charCodeAt(i);
      seed |= 0;
    }
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };
  }
}

// ─── Audio Manager ─────────────────────────────

class AudioManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  droneOsc1: OscillatorNode | null = null;
  droneOsc2: OscillatorNode | null = null;
  droneLfo: OscillatorNode | null = null;
  shimmerOsc: OscillatorNode | null = null;

  init(gs: GameStateManager) {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = gs.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = gs.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = gs.musicVolume;
    this.musicGain.connect(this.masterGain);
  }

  startDrone() {
    if (!this.ctx || !this.musicGain || this.droneOsc1) return;

    // Base drone
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.value = 55;
    const lp1 = this.ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.value = 400;
    this.droneOsc1.connect(lp1);
    lp1.connect(this.musicGain);
    this.droneOsc1.start();

    // Pad
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.value = 82.5;
    const lp2 = this.ctx.createBiquadFilter();
    lp2.type = 'lowpass';
    lp2.frequency.value = 350;
    this.droneOsc2.connect(lp2);
    lp2.connect(this.musicGain);
    this.droneOsc2.start();

    // LFO
    this.droneLfo = this.ctx.createOscillator();
    this.droneLfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 50;
    this.droneLfo.connect(lfoGain);
    lfoGain.connect(lp1.frequency);
    this.droneLfo.start();

    // Shimmer
    this.shimmerOsc = this.ctx.createOscillator();
    this.shimmerOsc.type = 'sine';
    this.shimmerOsc.frequency.value = 330;
    const shimGain = this.ctx.createGain();
    shimGain.gain.value = 0.03;
    this.shimmerOsc.connect(shimGain);
    shimGain.connect(this.musicGain);
    this.shimmerOsc.start();
  }

  stopDrone() {
    try {
      this.droneOsc1?.stop();
      this.droneOsc2?.stop();
      this.droneLfo?.stop();
      this.shimmerOsc?.stop();
    } catch {}
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneLfo = null;
    this.shimmerOsc = null;
  }

  playTone(frequency: number, duration = 0.3, volume = 0.4) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const pitchVar = 1 + (Math.random() - 0.5) * 0.02;

    // Main tone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency * pitchVar;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);

    // Harmonic
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = frequency * 2 * pitchVar;
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(volume * 0.2, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.8);
    osc2.connect(g2);
    g2.connect(this.sfxGain);
    osc2.start(t);
    osc2.stop(t + duration);
  }

  playCorrect() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [523, 659, 784].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.3, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.2);
    });
  }

  playWrong() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [300, 280].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      const lp = this.ctx!.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      g.gain.setValueAtTime(0.25, t + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.4);
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.4);
    });
  }

  playLevelComplete() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.25, t + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.3);
    });
  }

  playGameOver() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [440, 392, 349, 293].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.3, t + i * 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.5);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t + i * 0.2);
      osc.stop(t + i * 0.2 + 0.5);
    });
  }

  playCountdown(high = false) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = high ? 880 : 440;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playAchievement() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [660, 784, 880, 1047, 1320].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.2, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.25);
    });
  }

  playClick() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 600;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(g);
    osc2.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.05);
    osc2.stop(t + 0.05);
  }

  playCombo(level: number) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const baseFreq = 660 + level * 110;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = baseFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playSequenceStart() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [440, 554, 660].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.15, t + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.15);
    });
  }

  updateVolumes(gs: GameStateManager) {
    if (this.masterGain) this.masterGain.gain.value = gs.masterVolume;
    if (this.sfxGain) this.sfxGain.gain.value = gs.sfxVolume;
    if (this.musicGain) this.musicGain.gain.value = gs.musicVolume;
  }
}

// ─── Particle System ───────────────────────────

interface Particle {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

class ParticleSystem {
  particles: Particle[] = [];
  scene: Object3D;

  constructor(scene: Object3D, max = 150) {
    this.scene = scene;
    const geo = new SphereGeometry(0.015, 4, 4);
    for (let i = 0; i < max; i++) {
      const mat = new MeshBasicMaterial({ color: '#00ffff', transparent: true, opacity: 1, blending: AdditiveBlending });
      const mesh = new Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      this.particles.push({ mesh, velocity: new Vector3(), life: 0, maxLife: 1, active: false });
    }
  }

  burst(pos: Vector3, color: string, count = 12) {
    let spawned = 0;
    for (const p of this.particles) {
      if (p.active || spawned >= count) continue;
      p.mesh.position.copy(pos);
      p.velocity.set((Math.random() - 0.5) * 3, Math.random() * 2 + 1, (Math.random() - 0.5) * 3);
      p.life = 0;
      p.maxLife = 0.5 + Math.random() * 0.5;
      p.active = true;
      p.mesh.visible = true;
      (p.mesh.material as MeshBasicMaterial).color.set(color);
      (p.mesh.material as MeshBasicMaterial).opacity = 1;
      spawned++;
    }
  }

  ring(pos: Vector3, color: string, count = 16) {
    let spawned = 0;
    for (const p of this.particles) {
      if (p.active || spawned >= count) continue;
      const angle = (spawned / count) * Math.PI * 2;
      p.mesh.position.copy(pos);
      p.velocity.set(Math.cos(angle) * 2.5, 0.3, Math.sin(angle) * 2.5);
      p.life = 0;
      p.maxLife = 0.6;
      p.active = true;
      p.mesh.visible = true;
      (p.mesh.material as MeshBasicMaterial).color.set(color);
      (p.mesh.material as MeshBasicMaterial).opacity = 1;
      spawned++;
    }
  }

  update(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 4 * dt;
      const t = p.life / p.maxLife;
      (p.mesh.material as MeshBasicMaterial).opacity = 1 - t;
      const s = 1 - t * 0.5;
      p.mesh.scale.setScalar(s);
    }
  }
}

// ─── Achievements ──────────────────────────────

function getAchievements(gs: GameStateManager): Achievement[] {
  return [
    { id: 'first_game', name: 'First Step', description: 'Play your first game', check: () => gs.games >= 1 },
    { id: 'ten_games', name: 'Regular', description: 'Play 10 games', check: () => gs.games >= 10 },
    { id: 'fifty_games', name: 'Veteran', description: 'Play 50 games', check: () => gs.games >= 50 },
    { id: 'hundred_games', name: 'Dedicated', description: 'Play 100 games', check: () => gs.games >= 100 },
    { id: 'level_5', name: 'Getting Started', description: 'Reach level 5', check: () => gs.bestLevel >= 5 },
    { id: 'level_10', name: 'Sharp Mind', description: 'Reach level 10', check: () => gs.bestLevel >= 10 },
    { id: 'level_15', name: 'Memory Master', description: 'Reach level 15', check: () => gs.bestLevel >= 15 },
    { id: 'level_20', name: 'Photographic', description: 'Reach level 20', check: () => gs.bestLevel >= 20 },
    { id: 'level_30', name: 'Savant', description: 'Reach level 30', check: () => gs.bestLevel >= 30 },
    { id: 'level_50', name: 'Legendary Mind', description: 'Reach level 50', check: () => gs.bestLevel >= 50 },
    { id: 'score_1k', name: 'Score Hunter', description: 'Score 1,000 points', check: () => gs.bestScore >= 1000 },
    { id: 'score_5k', name: 'Score Chaser', description: 'Score 5,000 points', check: () => gs.bestScore >= 5000 },
    { id: 'score_10k', name: 'Score Legend', description: 'Score 10,000 points', check: () => gs.bestScore >= 10000 },
    { id: 'score_25k', name: 'Score God', description: 'Score 25,000 points', check: () => gs.bestScore >= 25000 },
    { id: 'streak_5', name: 'On Fire', description: '5 perfect rounds in a row', check: () => gs.bestStreak >= 5 },
    { id: 'streak_10', name: 'Unstoppable', description: '10 perfect rounds in a row', check: () => gs.bestStreak >= 10 },
    { id: 'streak_20', name: 'Flawless', description: '20 perfect rounds in a row', check: () => gs.bestStreak >= 20 },
    { id: 'perfect_game', name: 'Perfect Game', description: 'Complete a game with zero mistakes', check: () => gs.perfectGames >= 1 },
    { id: 'perfect_5', name: 'Perfectionist', description: 'Complete 5 perfect games', check: () => gs.perfectGames >= 5 },
    { id: 'combo_5', name: 'Combo Starter', description: 'Get a x5 combo', check: () => gs.maxCombo >= 5 },
    { id: 'combo_10', name: 'Combo King', description: 'Get a x10 combo', check: () => gs.maxCombo >= 10 },
    { id: 'daily_done', name: 'Daily Player', description: 'Complete a Daily Challenge', check: () => gs.dailyDate === new Date().toISOString().slice(0, 10) },
    { id: 'all_modes', name: 'Explorer', description: 'Play all game modes', check: () => gs.modesPlayed.size >= GAME_MODES.length },
    { id: 'all_layouts', name: 'Architect', description: 'Play all layouts', check: () => gs.layoutsPlayed.size >= LAYOUTS.length },
    { id: 'skin_unlock', name: 'Fashionista', description: 'Unlock a panel skin', check: () => gs.skinsUsed.size >= 2 },
    { id: 'theme_explore', name: 'Theme Explorer', description: 'Try all arena themes', check: () => gs.themesUsed.size >= ARENA_THEMES.length },
    { id: 'total_500', name: 'Panel Tapper', description: 'Hit 500 panels total', check: () => gs.totalPanelHits >= 500 },
    { id: 'total_2k', name: 'Panel Masher', description: 'Hit 2,000 panels total', check: () => gs.totalPanelHits >= 2000 },
    { id: 'total_5k', name: 'Panel Legend', description: 'Hit 5,000 panels total', check: () => gs.totalPanelHits >= 5000 },
    { id: 'survival_10', name: 'Survivor', description: 'Reach level 10 in Survival', check: () => gs.modesPlayed.has('Survival') && gs.bestLevel >= 10 },
    { id: 'marathon_25', name: 'Marathoner', description: 'Reach level 25 in Marathon', check: () => gs.modesPlayed.has('Marathon') && gs.bestLevel >= 25 },
    { id: 'reverse_10', name: 'Backwards Brain', description: 'Reach level 10 in Reverse', check: () => gs.modesPlayed.has('Reverse') && gs.bestLevel >= 10 },
    { id: 'speed_10', name: 'Quick Thinker', description: 'Reach level 10 in Speed', check: () => gs.modesPlayed.has('Speed') && gs.bestLevel >= 10 },
    { id: 'master_layout', name: 'Master Layout', description: 'Reach level 10 with 12 panels', check: () => gs.layoutsPlayed.has('Dodecagon') && gs.bestLevel >= 10 },
    { id: 'octo_15', name: 'Octo Master', description: 'Reach level 15 with 8 panels', check: () => gs.layoutsPlayed.has('Octagon') && gs.bestLevel >= 15 },
    { id: 'accuracy_100', name: 'Precision', description: '100 correct in a row', check: () => gs.totalCorrect >= 100 },
    { id: 'hard_mode_10', name: 'Hard Mode Hero', description: 'Reach level 10 on Hard difficulty', check: () => gs.difficulty === 2 && gs.bestLevel >= 10 },
    { id: 'zen_master', name: 'Zen Master', description: 'Reach level 30 in Zen', check: () => gs.modesPlayed.has('Zen') && gs.bestLevel >= 30 },
    { id: 'rush_20', name: 'Rush Expert', description: 'Reach level 20 in Rush', check: () => gs.modesPlayed.has('Rush') && gs.bestLevel >= 20 },
    { id: 'welcome', name: 'Welcome', description: 'Start your first game', check: () => gs.games >= 1 },
  ];
}

// ─── Main App ──────────────────────────────────

async function main() {
  const container = document.getElementById('app') as HTMLDivElement;

  const world = await World.create(container, {
    xr: { offer: 'once' as const },
    input: { canvasPointerEvents: true },
    features: {
      grabbing: false,
      locomotion: false,
      physics: false,
      spatialUI: true,
    },
    render: {
      near: 0.01,
      far: 200,
      camera: { position: [0, 1.6, 0], lookAt: [0, 1.4, -2] },
    },
  });

  const gs = new GameStateManager();
  const audio = new AudioManager();
  const particles = new ParticleSystem(world.scene);
  const raycaster = new Raycaster();
  const mouse = new Vector2();

  // ─── Environment ─────────────────────────────

  function applyTheme(themeIndex: number) {
    const theme = ARENA_THEMES[themeIndex];
    world.scene.fog = new Fog(theme.fog, 5, 25);

    // Find and update existing grid lines or create new ones
    const existingGrids = world.scene.children.filter((c: Object3D) => c.userData?.isGrid);
    existingGrids.forEach((g: Object3D) => world.scene.remove(g));

    // Floor grid
    const gridMat = new LineBasicMaterial({ color: theme.grid, transparent: true, opacity: 0.3 });
    const gridSize = 20;
    for (let axis = 0; axis < 2; axis++) {
      for (let i = -gridSize; i <= gridSize; i++) {
        const geo = new BufferGeometry();
        const verts = axis === 0
          ? [i, 0, -gridSize, i, 0, gridSize]
          : [-gridSize, 0, i, gridSize, 0, i];
        geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
        const line = new LineSegments(geo, gridMat.clone());
        line.userData.isGrid = true;
        world.scene.add(line);
      }
    }

    // Ceiling grid
    const ceilMat = new LineBasicMaterial({ color: theme.grid, transparent: true, opacity: 0.15 });
    for (let axis = 0; axis < 2; axis++) {
      for (let i = -gridSize; i <= gridSize; i += 2) {
        const geo = new BufferGeometry();
        const verts = axis === 0
          ? [i, 4, -gridSize, i, 4, gridSize]
          : [-gridSize, 4, i, gridSize, 4, i];
        geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
        const line = new LineSegments(geo, ceilMat.clone());
        line.userData.isGrid = true;
        world.scene.add(line);
      }
    }
  }

  // Lighting
  const ambient = new AmbientLight('#222233', 0.4);
  world.scene.add(ambient);
  const pointL1 = new PointLight('#00ffff', 1.5, 15);
  pointL1.position.set(3, 3, 3);
  world.scene.add(pointL1);
  const pointL2 = new PointLight('#ff00ff', 1.2, 15);
  pointL2.position.set(-3, 3, -3);
  world.scene.add(pointL2);
  const dirLight = new DirectionalLight('#ffffff', 0.3);
  dirLight.position.set(0, 5, 0);
  world.scene.add(dirLight);

  applyTheme(gs.selectedTheme);

  // Floating wireframe decorations
  const decos: { mesh: Object3D; speed: number; bobSpeed: number; baseY: number }[] = [];
  const decoShapes = [
    new TorusGeometry(0.15, 0.04, 8, 16),
    new BoxGeometry(0.2, 0.2, 0.2),
    new SphereGeometry(0.12, 8, 8),
    new CylinderGeometry(0, 0.15, 0.25, 6),
  ];

  for (let i = 0; i < 14; i++) {
    const geo = decoShapes[i % decoShapes.length];
    const edges = new EdgesGeometry(geo);
    const mat = new LineBasicMaterial({ color: ARENA_THEMES[gs.selectedTheme].accent, transparent: true, opacity: 0.2 + Math.random() * 0.15 });
    const mesh = new LineSegments(edges, mat);
    const angle = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 6;
    const y = 1 + Math.random() * 2.5;
    mesh.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    world.scene.add(mesh);
    decos.push({ mesh, speed: 0.2 + Math.random() * 0.5, bobSpeed: 0.5 + Math.random() * 0.5, baseY: y });
  }

  // Ambient particles
  const ambientParticles: { mesh: Mesh; basePos: Vector3; phase: number }[] = [];
  for (let i = 0; i < 40; i++) {
    const geo = new SphereGeometry(0.008, 4, 4);
    const mat = new MeshBasicMaterial({ color: ARENA_THEMES[gs.selectedTheme].glow, transparent: true, opacity: 0.3, blending: AdditiveBlending });
    const mesh = new Mesh(geo, mat);
    const pos = new Vector3((Math.random() - 0.5) * 16, Math.random() * 3.5, (Math.random() - 0.5) * 16);
    mesh.position.copy(pos);
    world.scene.add(mesh);
    ambientParticles.push({ mesh, basePos: pos.clone(), phase: Math.random() * Math.PI * 2 });
  }

  // ─── Panel Ring ──────────────────────────────

  let panels: PanelInfo[] = [];
  const panelGroup = new Group();
  world.scene.add(panelGroup);

  function createPanels(layout: LayoutConfig) {
    // Remove existing panels
    while (panelGroup.children.length > 0) {
      panelGroup.remove(panelGroup.children[0]);
    }
    panels = [];

    const count = layout.panelCount;
    const radius = 2.0;
    const panelWidth = Math.min(0.6, (2 * Math.PI * radius) / count * 0.7);
    const panelHeight = 0.8;

    const skin = PANEL_SKINS[gs.selectedSkin];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const colorIndex = i % PANEL_COLORS.length;

      // Panel body
      const geo = new BoxGeometry(panelWidth, panelHeight, 0.08);
      const baseCol = new Color(skin.colors[colorIndex] || PANEL_COLORS[colorIndex].base);
      baseCol.multiplyScalar(0.3);
      const mat = new MeshStandardMaterial({
        color: baseCol,
        emissive: baseCol,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new Mesh(geo, mat);

      // Position on ring
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      mesh.position.set(x, 1.3, z);
      mesh.lookAt(0, 1.3, 0);
      mesh.userData.panelIndex = i;

      // Glow sphere
      const glowGeo = new SphereGeometry(panelWidth * 0.6, 8, 8);
      const activeCol = new Color(skin.colors[colorIndex] || PANEL_COLORS[colorIndex].active);
      const glowMat = new MeshBasicMaterial({
        color: activeCol,
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
      });
      const glowMesh = new Mesh(glowGeo, glowMat);
      glowMesh.position.set(0, 0, 0.06);
      mesh.add(glowMesh);

      // Wireframe edges
      const edgesGeo = new EdgesGeometry(geo);
      const edgeMat = new LineBasicMaterial({ color: activeCol, transparent: true, opacity: 0.4 });
      const edgeMesh = new LineSegments(edgesGeo, edgeMat);
      mesh.add(edgeMesh);

      panelGroup.add(mesh);

      panels.push({
        index: i,
        mesh,
        glowMesh,
        edgeMesh,
        baseColor: baseCol.clone(),
        activeColor: activeCol.clone(),
        frequency: PANEL_COLORS[colorIndex].frequency,
        angle,
      });
    }
  }

  createPanels(gs.currentLayout);

  // ─── Center Pedestal ─────────────────────────

  const pedestalGeo = new CylinderGeometry(0.3, 0.35, 0.05, 32);
  const pedestalMat = new MeshStandardMaterial({ color: '#001122', emissive: '#003355', emissiveIntensity: 0.5, metalness: 0.9, roughness: 0.2 });
  const pedestal = new Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(0, 0.025, 0);
  world.scene.add(pedestal);

  // Center ring indicator
  const centerRingGeo = new TorusGeometry(0.25, 0.015, 8, 32);
  const centerRingMat = new MeshBasicMaterial({ color: '#00ffff', transparent: true, opacity: 0.5, blending: AdditiveBlending });
  const centerRing = new Mesh(centerRingGeo, centerRingMat);
  centerRing.position.set(0, 0.06, 0);
  centerRing.rotation.x = -Math.PI / 2;
  world.scene.add(centerRing);

  // ─── UI Entities ─────────────────────────────

  // Title Screen
  const titleEntity = world.createTransformEntity(undefined, { persistent: true });
  titleEntity.object3D.position.set(0, 1.6, -2.5);
  titleEntity.addComponent(PanelUI, { config: '/ui/title.json', maxWidth: 1.0, maxHeight: 1.2 });

  // Mode Select
  const modeEntity = world.createTransformEntity(undefined, { persistent: true });
  modeEntity.object3D.position.set(0, 1.6, -2.5);
  modeEntity.addComponent(PanelUI, { config: '/ui/modeselect.json', maxWidth: 1.0, maxHeight: 1.2 });

  // Difficulty
  const diffEntity = world.createTransformEntity(undefined, { persistent: true });
  diffEntity.object3D.position.set(0, 1.6, -2.5);
  diffEntity.addComponent(PanelUI, { config: '/ui/difficulty.json', maxWidth: 0.8, maxHeight: 0.8 });

  // Layout Select
  const layoutEntity = world.createTransformEntity(undefined, { persistent: true });
  layoutEntity.object3D.position.set(0, 1.6, -2.5);
  layoutEntity.addComponent(PanelUI, { config: '/ui/layout.json', maxWidth: 1.0, maxHeight: 1.0 });

  // HUD
  const hudEntity = world.createTransformEntity(undefined, { persistent: true });
  hudEntity.addComponent(PanelUI, { config: '/ui/hud.json', maxWidth: 0.35, maxHeight: 0.2 });
  hudEntity.addComponent(Follower, { target: world.player.head, offsetPosition: [0.25, -0.15, -0.5], behavior: FollowBehavior.PivotY, speed: 5, tolerance: 0.3 });

  // Sequence Indicator
  const seqEntity = world.createTransformEntity(undefined, { persistent: true });
  seqEntity.addComponent(PanelUI, { config: '/ui/sequence.json', maxWidth: 0.25, maxHeight: 0.1 });
  seqEntity.addComponent(Follower, { target: world.player.head, offsetPosition: [-0.2, 0.1, -0.5], behavior: FollowBehavior.PivotY, speed: 5, tolerance: 0.3 });

  // Toast
  const toastEntity = world.createTransformEntity(undefined, { persistent: true });
  toastEntity.addComponent(PanelUI, { config: '/ui/toast.json', maxWidth: 0.35, maxHeight: 0.08 });
  toastEntity.addComponent(Follower, { target: world.player.head, offsetPosition: [0, 0.2, -0.5], behavior: FollowBehavior.PivotY, speed: 5, tolerance: 0.3 });

  // Countdown
  const countdownEntity = world.createTransformEntity(undefined, { persistent: true });
  countdownEntity.addComponent(PanelUI, { config: '/ui/countdown.json', maxWidth: 0.3, maxHeight: 0.2 });
  countdownEntity.addComponent(Follower, { target: world.player.head, offsetPosition: [0, 0, -0.6], behavior: FollowBehavior.PivotY, speed: 5, tolerance: 0.3 });

  // Pause
  const pauseEntity = world.createTransformEntity(undefined, { persistent: true });
  pauseEntity.object3D.position.set(0, 1.6, -2.0);
  pauseEntity.addComponent(PanelUI, { config: '/ui/pause.json', maxWidth: 0.6, maxHeight: 0.5 });

  // Game Over
  const gameoverEntity = world.createTransformEntity(undefined, { persistent: true });
  gameoverEntity.object3D.position.set(0, 1.6, -2.5);
  gameoverEntity.addComponent(PanelUI, { config: '/ui/gameover.json', maxWidth: 0.9, maxHeight: 1.0 });

  // Leaderboard
  const lbEntity = world.createTransformEntity(undefined, { persistent: true });
  lbEntity.object3D.position.set(0, 1.6, -2.5);
  lbEntity.addComponent(PanelUI, { config: '/ui/leaderboard.json', maxWidth: 0.9, maxHeight: 1.0 });

  // Achievements
  const achEntity = world.createTransformEntity(undefined, { persistent: true });
  achEntity.object3D.position.set(0, 1.6, -2.5);
  achEntity.addComponent(PanelUI, { config: '/ui/achievements.json', maxWidth: 0.9, maxHeight: 1.2 });

  // Settings
  const settingsEntity = world.createTransformEntity(undefined, { persistent: true });
  settingsEntity.object3D.position.set(0, 1.6, -2.5);
  settingsEntity.addComponent(PanelUI, { config: '/ui/settings.json', maxWidth: 0.9, maxHeight: 1.0 });

  // Help
  const helpEntity = world.createTransformEntity(undefined, { persistent: true });
  helpEntity.object3D.position.set(0, 1.6, -2.5);
  helpEntity.addComponent(PanelUI, { config: '/ui/help.json', maxWidth: 0.9, maxHeight: 1.2 });

  // Stats
  const statsEntity = world.createTransformEntity(undefined, { persistent: true });
  statsEntity.object3D.position.set(0, 1.6, -2.5);
  statsEntity.addComponent(PanelUI, { config: '/ui/stats.json', maxWidth: 0.9, maxHeight: 1.0 });

  // Skins
  const skinsEntity = world.createTransformEntity(undefined, { persistent: true });
  skinsEntity.object3D.position.set(0, 1.6, -2.5);
  skinsEntity.addComponent(PanelUI, { config: '/ui/skins.json', maxWidth: 0.9, maxHeight: 1.0 });

  // ─── UI Helpers ──────────────────────────────

  function getDoc(entity: any): UIKitDocument | null {
    try {
      return entity.getValue(PanelDocument, 'document') as UIKitDocument | null;
    } catch { return null; }
  }

  function setText(doc: UIKitDocument | null, id: string, text: string) {
    if (!doc) return;
    const el = doc.getElementById(id);
    if (el && (el as any).text) (el as any).text.value = text;
  }

  function showPanel(state: GameState) {
    gs.state = state;
    const map: Record<string, any> = {
      title: titleEntity,
      modeselect: modeEntity,
      difficulty: diffEntity,
      layout: layoutEntity,
      pause: pauseEntity,
      gameover: gameoverEntity,
      leaderboard: lbEntity,
      achievements: achEntity,
      settings: settingsEntity,
      help: helpEntity,
      stats: statsEntity,
      skins: skinsEntity,
    };
    const all = [titleEntity, modeEntity, diffEntity, layoutEntity, pauseEntity,
      gameoverEntity, lbEntity, achEntity, settingsEntity, helpEntity, statsEntity, skinsEntity];

    for (const e of all) {
      e.object3D.visible = false;
    }

    if (map[state]) {
      map[state].object3D.visible = true;
    }

    // HUD visibility
    const playing = state === 'playing' || state === 'watching' || state === 'input';
    hudEntity.object3D.visible = playing;
    seqEntity.object3D.visible = playing;
    countdownEntity.object3D.visible = state === 'countdown';

    // Panels visibility
    panelGroup.visible = playing || state === 'countdown' || state === 'pause';
  }

  let toastTimer = 0;
  function showToast(text: string, duration = 2.0) {
    toastEntity.object3D.visible = true;
    toastTimer = duration;
    const doc = getDoc(toastEntity);
    setText(doc, 'toast-text', text);
  }

  let countdownValue = 3;
  let countdownTimer = 0;

  function startCountdown() {
    countdownValue = 3;
    countdownTimer = 1.0;
    showPanel('countdown');
    audio.playCountdown(false);
    const doc = getDoc(countdownEntity);
    setText(doc, 'countdown-text', '3');
  }

  // ─── Game Logic ──────────────────────────────

  function startGame() {
    audio.init(gs);
    audio.startDrone();

    gs.sequence = [];
    gs.playerIndex = 0;
    gs.level = 0;
    gs.score = 0;
    gs.lives = gs.currentMode.maxLives;
    gs.combo = 0;
    gs.maxCombo = 0;
    gs.streak = 0;
    gs.correctThisRound = 0;
    gs.wrongThisRound = 0;
    gs.gameStartTime = Date.now();
    gs.timeRemaining = gs.currentMode.timeLimit;
    gs.sessionStartTime = Date.now();

    gs.modesPlayed.add(gs.currentMode.name);
    gs.layoutsPlayed.add(gs.currentLayout.name);
    gs.skinsUsed.add(PANEL_SKINS[gs.selectedSkin].name);
    gs.themesUsed.add(ARENA_THEMES[gs.selectedTheme].name);

    createPanels(gs.currentLayout);
    nextRound();
  }

  function nextRound() {
    gs.level++;
    gs.correctThisRound = 0;

    // Add to sequence
    if (gs.currentMode.name === 'Daily') {
      const rng = gs.getDailySeededRandom();
      // Generate deterministic sequence for today
      while (gs.sequence.length < gs.level) {
        gs.sequence.push(Math.floor(rng() * gs.currentLayout.panelCount));
      }
    } else {
      gs.sequence.push(Math.floor(Math.random() * gs.currentLayout.panelCount));
    }

    // Score bonus for completing a round
    if (gs.level > 1) {
      const roundBonus = gs.level * 100 + gs.combo * 50;
      gs.score += roundBonus;
      audio.playLevelComplete();
      showToast(`Level ${gs.level}! +${roundBonus}`);
    }

    // Start showing the sequence
    gs.isShowingSequence = true;
    gs.sequenceShowIndex = 0;
    gs.sequenceTimer = 0.5; // initial delay
    gs.playerIndex = 0;
    gs.inputTimer = 0;

    showPanel('watching');
    updateHUD();

    const doc = getDoc(seqEntity);
    setText(doc, 'seq-text', 'WATCH...');

    audio.playSequenceStart();
  }

  function flashPanel(index: number, duration = 0.3) {
    if (index < 0 || index >= panels.length) return;
    const panel = panels[index];
    const mat = panel.mesh.material as MeshStandardMaterial;
    mat.emissive.copy(panel.activeColor);
    mat.emissiveIntensity = 1.5;
    (panel.glowMesh.material as MeshBasicMaterial).opacity = 0.6;
    (panel.edgeMesh.material as LineBasicMaterial).opacity = 1.0;

    panel.mesh.scale.setScalar(1.1);

    // Play tone
    audio.playTone(panel.frequency, duration * 1.5, 0.35);

    gs.panelFlashTimer = duration;
  }

  function resetPanel(index: number) {
    if (index < 0 || index >= panels.length) return;
    const panel = panels[index];
    const mat = panel.mesh.material as MeshStandardMaterial;
    mat.emissive.copy(panel.baseColor);
    mat.emissiveIntensity = 0.3;
    (panel.glowMesh.material as MeshBasicMaterial).opacity = 0;
    (panel.edgeMesh.material as LineBasicMaterial).opacity = 0.4;
    panel.mesh.scale.setScalar(1.0);
  }

  function resetAllPanels() {
    for (let i = 0; i < panels.length; i++) resetPanel(i);
  }

  function handlePanelHit(panelIndex: number) {
    if (gs.state !== 'input') return;

    gs.totalPanelHits++;

    const expectedSequence = gs.currentMode.reverse ? [...gs.sequence].reverse() : gs.sequence;
    const expected = expectedSequence[gs.playerIndex];

    flashPanel(panelIndex, 0.2);
    particles.burst(panels[panelIndex].mesh.position.clone(), panels[panelIndex].activeColor.getStyle());

    if (panelIndex === expected) {
      // Correct!
      gs.playerIndex++;
      gs.totalCorrect++;
      gs.correctThisRound++;
      gs.combo++;
      gs.streak++;
      if (gs.combo > gs.maxCombo) gs.maxCombo = gs.combo;
      if (gs.streak > gs.bestStreak) gs.bestStreak = gs.streak;
      gs.inputTimer = 0;

      // Combo feedback
      if (gs.combo > 0 && gs.combo % 5 === 0) {
        audio.playCombo(Math.min(gs.combo / 5, 5));
        showToast(`x${gs.combo} COMBO!`);
        particles.ring(new Vector3(0, 1.3, 0), panels[panelIndex].activeColor.getStyle());
      }

      // Score for each correct hit
      const hitScore = 10 + gs.level * 5 + Math.floor(gs.combo / 2) * 10;
      gs.score += hitScore;

      if (gs.playerIndex >= gs.sequence.length) {
        // Round complete!
        resetAllPanels();
        setTimeout(() => nextRound(), 800);
      }
    } else {
      // Wrong!
      gs.totalWrong++;
      gs.wrongThisRound++;
      gs.combo = 0;
      gs.streak = 0;
      gs.lives--;
      audio.playWrong();

      // Flash the correct panel briefly
      setTimeout(() => {
        flashPanel(expected, 0.5);
        setTimeout(() => resetPanel(expected), 500);
      }, 300);

      if (gs.lives <= 0) {
        endGame();
      } else {
        showToast(`Wrong! ${gs.lives} lives left`);
        // Replay the sequence
        gs.playerIndex = 0;
        gs.inputTimer = 0;
        setTimeout(() => {
          gs.isShowingSequence = true;
          gs.sequenceShowIndex = 0;
          gs.sequenceTimer = 0.5;
          showPanel('watching');
          const doc = getDoc(seqEntity);
          setText(doc, 'seq-text', 'WATCH AGAIN...');
        }, 1000);
      }
    }

    updateHUD();
  }

  function endGame() {
    gs.games++;
    const totalTime = (Date.now() - gs.gameStartTime) / 1000;
    gs.totalPlayTime += totalTime;

    if (gs.score > gs.bestScore) gs.bestScore = gs.score;
    if (gs.level > gs.bestLevel) gs.bestLevel = gs.level;
    if (gs.wrongThisRound === 0 && gs.level > 1) gs.perfectGames++;

    if (gs.currentMode.name === 'Daily') {
      const today = new Date().toISOString().slice(0, 10);
      gs.dailyDate = today;
      if (gs.score > gs.dailyBest) gs.dailyBest = gs.score;
    }

    // Leaderboard
    gs.addLeaderboard({
      score: gs.score,
      level: gs.level,
      mode: gs.currentMode.name,
      layout: gs.currentLayout.name,
      date: new Date().toISOString().slice(0, 10),
    });

    // Check achievements
    checkAchievements();

    gs.save();
    audio.playGameOver();

    showPanel('gameover');
    updateGameOver();
    resetAllPanels();
  }

  function updateHUD() {
    const doc = getDoc(hudEntity);
    if (!doc) return;
    setText(doc, 'hud-score', `${gs.score}`);
    setText(doc, 'hud-level', `LV ${gs.level}`);
    setText(doc, 'hud-lives', gs.currentMode.maxLives < 100 ? `${'*'.repeat(Math.max(0, gs.lives))}` : 'ZEN');
    setText(doc, 'hud-combo', gs.combo > 1 ? `x${gs.combo}` : '');
    setText(doc, 'hud-mode', gs.currentMode.name.toUpperCase());
    if (gs.currentMode.timed) {
      setText(doc, 'hud-time', `${Math.ceil(gs.timeRemaining)}s`);
    } else {
      setText(doc, 'hud-time', '');
    }
  }

  function updateGameOver() {
    const doc = getDoc(gameoverEntity);
    if (!doc) return;
    setText(doc, 'go-score', `${gs.score}`);
    setText(doc, 'go-level', `Level ${gs.level}`);
    setText(doc, 'go-combo', `Best Combo: x${gs.maxCombo}`);
    setText(doc, 'go-accuracy', `Accuracy: ${gs.totalCorrect > 0 ? Math.round(gs.totalCorrect / (gs.totalCorrect + gs.totalWrong) * 100) : 0}%`);
    setText(doc, 'go-streak', `Best Streak: ${gs.bestStreak}`);
    setText(doc, 'go-mode', `${gs.currentMode.name} / ${gs.currentLayout.name}`);
  }

  function updateLeaderboard() {
    const doc = getDoc(lbEntity);
    if (!doc) return;
    for (let i = 0; i < 10; i++) {
      const entry = gs.leaderboard[i];
      if (entry) {
        setText(doc, `lb-rank-${i}`, `${i + 1}`);
        setText(doc, `lb-score-${i}`, `${entry.score}`);
        setText(doc, `lb-level-${i}`, `Lv${entry.level}`);
        setText(doc, `lb-mode-${i}`, entry.mode);
        setText(doc, `lb-date-${i}`, entry.date);
      } else {
        setText(doc, `lb-rank-${i}`, `${i + 1}`);
        setText(doc, `lb-score-${i}`, '---');
        setText(doc, `lb-level-${i}`, '---');
        setText(doc, `lb-mode-${i}`, '---');
        setText(doc, `lb-date-${i}`, '---');
      }
    }
  }

  function updateAchievements() {
    const doc = getDoc(achEntity);
    if (!doc) return;
    const achs = getAchievements(gs);
    for (let i = 0; i < 20 && i < achs.length; i++) {
      const a = achs[i];
      const unlocked = gs.achievements.has(a.id);
      setText(doc, `ach-check-${i}`, unlocked ? '[X]' : '[ ]');
      setText(doc, `ach-name-${i}`, a.name);
      setText(doc, `ach-desc-${i}`, a.description);
    }
  }

  let achPage = 0;
  function updateAchievementsPage() {
    const doc = getDoc(achEntity);
    if (!doc) return;
    const achs = getAchievements(gs);
    const start = achPage * 20;
    for (let i = 0; i < 20; i++) {
      const a = achs[start + i];
      if (a) {
        const unlocked = gs.achievements.has(a.id);
        setText(doc, `ach-check-${i}`, unlocked ? '[X]' : '[ ]');
        setText(doc, `ach-name-${i}`, a.name);
        setText(doc, `ach-desc-${i}`, a.description);
      } else {
        setText(doc, `ach-check-${i}`, '');
        setText(doc, `ach-name-${i}`, '');
        setText(doc, `ach-desc-${i}`, '');
      }
    }
    setText(doc, 'ach-page', `${achPage + 1}/${Math.ceil(achs.length / 20)}`);
  }

  function updateStats() {
    const doc = getDoc(statsEntity);
    if (!doc) return;
    setText(doc, 'stat-games', `${gs.games}`);
    setText(doc, 'stat-best-score', `${gs.bestScore}`);
    setText(doc, 'stat-best-level', `${gs.bestLevel}`);
    setText(doc, 'stat-correct', `${gs.totalCorrect}`);
    setText(doc, 'stat-accuracy', `${gs.totalCorrect > 0 ? Math.round(gs.totalCorrect / (gs.totalCorrect + gs.totalWrong) * 100) : 0}%`);
    setText(doc, 'stat-streak', `${gs.bestStreak}`);
    setText(doc, 'stat-perfect', `${gs.perfectGames}`);
    setText(doc, 'stat-panels', `${gs.totalPanelHits}`);
    setText(doc, 'stat-modes', `${gs.modesPlayed.size}/${GAME_MODES.length}`);
    setText(doc, 'stat-time', `${Math.floor(gs.totalPlayTime / 60)}m`);
  }

  function updateSettings() {
    const doc = getDoc(settingsEntity);
    if (!doc) return;
    setText(doc, 'set-master', `${Math.round(gs.masterVolume * 100)}%`);
    setText(doc, 'set-sfx', `${Math.round(gs.sfxVolume * 100)}%`);
    setText(doc, 'set-music', `${Math.round(gs.musicVolume * 100)}%`);
    setText(doc, 'set-theme', ARENA_THEMES[gs.selectedTheme].name);
  }

  function updateSkins() {
    const doc = getDoc(skinsEntity);
    if (!doc) return;
    for (let i = 0; i < PANEL_SKINS.length; i++) {
      const skin = PANEL_SKINS[i];
      const isSelected = i === gs.selectedSkin;
      setText(doc, `skin-name-${i}`, `${isSelected ? '> ' : ''}${skin.name}`);
      setText(doc, `skin-desc-${i}`, skin.unlockCondition);
    }
  }

  function checkAchievements() {
    const achs = getAchievements(gs);
    for (const a of achs) {
      if (!gs.achievements.has(a.id) && a.check()) {
        gs.achievements.add(a.id);
        showToast(`Achievement: ${a.name}!`);
        audio.playAchievement();
        particles.ring(new Vector3(0, 1.5, 0), '#ffaa00', 20);
      }
    }
  }

  // ─── Button Wiring ──────────────────────────

  function wireButtons() {
    // We'll wire buttons each frame since docs might not be ready immediately
    // Using a simple polling approach
    const wireOnce = new Set<string>();

    function tryWire(entity: any, btnId: string, handler: () => void) {
      const key = `${btnId}`;
      if (wireOnce.has(key)) return;
      const doc = getDoc(entity);
      if (!doc) return;
      const btn = doc.getElementById(btnId);
      if (!btn) return;
      btn.addEventListener('click', () => {
        audio.init(gs);
        audio.playClick();
        handler();
      });
      wireOnce.add(key);
    }

    return function wireAll() {
      // Title
      tryWire(titleEntity, 'btn-play', () => { showPanel('modeselect'); });
      tryWire(titleEntity, 'btn-scores', () => { updateLeaderboard(); showPanel('leaderboard'); });
      tryWire(titleEntity, 'btn-achievements', () => { achPage = 0; updateAchievementsPage(); showPanel('achievements'); });
      tryWire(titleEntity, 'btn-stats', () => { updateStats(); showPanel('stats'); });
      tryWire(titleEntity, 'btn-skins', () => { updateSkins(); showPanel('skins'); });
      tryWire(titleEntity, 'btn-settings', () => { updateSettings(); showPanel('settings'); });
      tryWire(titleEntity, 'btn-help', () => { showPanel('help'); });

      // Mode Select
      for (let i = 0; i < GAME_MODES.length; i++) {
        const idx = i;
        tryWire(modeEntity, `btn-mode-${i}`, () => {
          gs.currentMode = GAME_MODES[idx];
          showPanel('layout');
        });
      }
      tryWire(modeEntity, 'btn-mode-back', () => { showPanel('title'); });

      // Layout Select
      for (let i = 0; i < LAYOUTS.length; i++) {
        const idx = i;
        tryWire(layoutEntity, `btn-layout-${i}`, () => {
          gs.currentLayout = LAYOUTS[idx];
          showPanel('difficulty');
        });
      }
      tryWire(layoutEntity, 'btn-layout-back', () => { showPanel('modeselect'); });

      // Difficulty
      tryWire(diffEntity, 'btn-easy', () => { gs.difficulty = 0; startCountdown(); });
      tryWire(diffEntity, 'btn-medium', () => { gs.difficulty = 1; startCountdown(); });
      tryWire(diffEntity, 'btn-hard', () => { gs.difficulty = 2; startCountdown(); });
      tryWire(diffEntity, 'btn-diff-back', () => { showPanel('layout'); });

      // Pause
      tryWire(pauseEntity, 'btn-resume', () => { showPanel(gs.isShowingSequence ? 'watching' : 'input'); });
      tryWire(pauseEntity, 'btn-quit', () => { endGame(); });

      // Game Over
      tryWire(gameoverEntity, 'btn-rematch', () => { startCountdown(); });
      tryWire(gameoverEntity, 'btn-go-title', () => { showPanel('title'); });

      // Leaderboard
      tryWire(lbEntity, 'btn-lb-back', () => { showPanel('title'); });

      // Achievements
      tryWire(achEntity, 'btn-ach-back', () => { showPanel('title'); });
      tryWire(achEntity, 'btn-ach-prev', () => { achPage = Math.max(0, achPage - 1); updateAchievementsPage(); });
      tryWire(achEntity, 'btn-ach-next', () => { const maxP = Math.ceil(getAchievements(gs).length / 20) - 1; achPage = Math.min(maxP, achPage + 1); updateAchievementsPage(); });

      // Settings
      tryWire(settingsEntity, 'btn-master-up', () => { gs.masterVolume = Math.min(1, gs.masterVolume + 0.1); audio.updateVolumes(gs); updateSettings(); gs.save(); });
      tryWire(settingsEntity, 'btn-master-down', () => { gs.masterVolume = Math.max(0, gs.masterVolume - 0.1); audio.updateVolumes(gs); updateSettings(); gs.save(); });
      tryWire(settingsEntity, 'btn-sfx-up', () => { gs.sfxVolume = Math.min(1, gs.sfxVolume + 0.1); audio.updateVolumes(gs); updateSettings(); gs.save(); });
      tryWire(settingsEntity, 'btn-sfx-down', () => { gs.sfxVolume = Math.max(0, gs.sfxVolume - 0.1); audio.updateVolumes(gs); updateSettings(); gs.save(); });
      tryWire(settingsEntity, 'btn-music-up', () => { gs.musicVolume = Math.min(1, gs.musicVolume + 0.1); audio.updateVolumes(gs); updateSettings(); gs.save(); });
      tryWire(settingsEntity, 'btn-music-down', () => { gs.musicVolume = Math.max(0, gs.musicVolume - 0.1); audio.updateVolumes(gs); updateSettings(); gs.save(); });
      tryWire(settingsEntity, 'btn-theme-prev', () => { gs.selectedTheme = (gs.selectedTheme - 1 + ARENA_THEMES.length) % ARENA_THEMES.length; applyTheme(gs.selectedTheme); updateSettings(); gs.save(); });
      tryWire(settingsEntity, 'btn-theme-next', () => { gs.selectedTheme = (gs.selectedTheme + 1) % ARENA_THEMES.length; applyTheme(gs.selectedTheme); updateSettings(); gs.save(); });
      tryWire(settingsEntity, 'btn-set-back', () => { showPanel('title'); });

      // Stats
      tryWire(statsEntity, 'btn-stats-back', () => { showPanel('title'); });

      // Help
      tryWire(helpEntity, 'btn-help-back', () => { showPanel('title'); });

      // Skins
      for (let i = 0; i < PANEL_SKINS.length; i++) {
        const idx = i;
        tryWire(skinsEntity, `btn-skin-${i}`, () => {
          gs.selectedSkin = idx;
          gs.skinsUsed.add(PANEL_SKINS[idx].name);
          updateSkins();
          gs.save();
          showToast(`Skin: ${PANEL_SKINS[idx].name}`);
        });
      }
      tryWire(skinsEntity, 'btn-skins-back', () => { showPanel('title'); });
    };
  }

  const doWiring = wireButtons();

  // ─── Input Handling ──────────────────────────

  let lastClickTime = 0;

  function onPointerDown(event: MouseEvent) {
    if (gs.state !== 'input') return;
    if (Date.now() - lastClickTime < 200) return; // debounce
    lastClickTime = Date.now();

    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, (world as any).scene?.parent?.children?.find?.((c: any) => c.isCamera) || (world as any).renderer?.xr?.getCamera() || findCamera());
    const hits = raycaster.intersectObjects(panels.map(p => p.mesh), false);
    if (hits.length > 0) {
      const panelIndex = hits[0].object.userData.panelIndex;
      if (panelIndex !== undefined) {
        handlePanelHit(panelIndex);
      }
    }
  }

  function findCamera(): any {
    // Walk scene to find the active camera
    let cam: any = null;
    world.scene.traverse((child: any) => {
      if (child.isCamera && !cam) cam = child;
    });
    // If not in scene, try the renderer
    if (!cam) {
      try {
        cam = (world as any).renderer?.xr?.isPresenting
          ? (world as any).renderer.xr.getCamera()
          : (world as any).camera;
      } catch {}
    }
    return cam;
  }

  container.addEventListener('pointerdown', onPointerDown);

  // Keyboard
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (gs.state === 'input' || gs.state === 'watching') {
        showPanel('pause');
      } else if (gs.state === 'pause') {
        showPanel(gs.isShowingSequence ? 'watching' : 'input');
      }
    }
    if (event.key === 'r' || event.key === 'R') {
      if (gs.state === 'gameover') {
        startCountdown();
      }
    }

    // Number keys for panel selection during input
    if (gs.state === 'input') {
      const num = parseInt(event.key);
      if (!isNaN(num) && num >= 1 && num <= panels.length) {
        handlePanelHit(num - 1);
      }
    }
  }
  document.addEventListener('keydown', onKeyDown);

  // ─── Game Loop ───────────────────────────────

  let lastTime = performance.now();

  showPanel('title');
  toastEntity.object3D.visible = false;

  world.onUpdate(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Wire buttons
    doWiring();

    // Update particles
    particles.update(dt);

    // Animate decorations
    const time = now / 1000;
    for (const d of decos) {
      d.mesh.rotation.y += d.speed * dt;
      d.mesh.rotation.x += d.speed * 0.3 * dt;
      (d.mesh as LineSegments).position.y = d.baseY + Math.sin(time * d.bobSpeed) * 0.1;
    }

    // Ambient particles
    for (const ap of ambientParticles) {
      ap.mesh.position.x = ap.basePos.x + Math.sin(time * 0.3 + ap.phase) * 0.2;
      ap.mesh.position.y = ap.basePos.y + Math.sin(time * 0.5 + ap.phase * 2) * 0.1;
      (ap.mesh.material as MeshBasicMaterial).opacity = 0.2 + Math.sin(time * 0.8 + ap.phase) * 0.15;
    }

    // Center ring pulse
    centerRing.rotation.z += dt * 0.3;
    (centerRingMat as MeshBasicMaterial).opacity = 0.3 + Math.sin(time * 2) * 0.2;

    // Panel idle animation — subtle breathing
    if (gs.state === 'input' || gs.state === 'watching' || gs.state === 'countdown') {
      for (const panel of panels) {
        const breathe = 0.2 + Math.sin(time * 1.5 + panel.index * 0.5) * 0.08;
        (panel.edgeMesh.material as LineBasicMaterial).opacity = breathe + 0.2;
      }
    }

    // Toast timer
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) {
        toastEntity.object3D.visible = false;
      }
    }

    // Countdown
    if (gs.state === 'countdown') {
      countdownTimer -= dt;
      if (countdownTimer <= 0) {
        countdownValue--;
        if (countdownValue <= 0) {
          // Start game
          const doc = getDoc(countdownEntity);
          setText(doc, 'countdown-text', 'GO!');
          audio.playCountdown(true);
          setTimeout(() => {
            startGame();
          }, 400);
        } else {
          const doc = getDoc(countdownEntity);
          setText(doc, 'countdown-text', `${countdownValue}`);
          audio.playCountdown(false);
          countdownTimer = 1.0;
        }
      }
    }

    // Sequence playback
    if (gs.state === 'watching' && gs.isShowingSequence) {
      gs.sequenceTimer -= dt;
      if (gs.sequenceTimer <= 0) {
        // Reset previous panel
        if (gs.sequenceShowIndex > 0) {
          resetPanel(gs.sequence[gs.sequenceShowIndex - 1]);
        }

        if (gs.sequenceShowIndex < gs.sequence.length) {
          const panelIdx = gs.sequence[gs.sequenceShowIndex];
          const speed = gs.getSpeedForLevel();
          flashPanel(panelIdx, speed / 1000);
          gs.sequenceShowIndex++;
          gs.sequenceTimer = (speed + gs.getGapForLevel()) / 1000;
        } else {
          // Sequence done, wait for input
          resetAllPanels();
          gs.isShowingSequence = false;
          gs.playerIndex = 0;
          gs.inputTimer = 0;
          showPanel('input');
          const doc = getDoc(seqEntity);
          setText(doc, 'seq-text', 'YOUR TURN!');
        }
      }
    }

    // Panel flash decay (smooth)
    if (gs.panelFlashTimer > 0) {
      gs.panelFlashTimer -= dt;
    }

    // Input timeout
    if (gs.state === 'input') {
      gs.inputTimer += dt;
      if (gs.inputTimer > gs.getInputTimeout()) {
        // Timeout — treat as wrong
        gs.lives--;
        gs.combo = 0;
        gs.streak = 0;
        audio.playWrong();
        showToast('Too slow!');
        if (gs.lives <= 0) {
          endGame();
        } else {
          // Replay
          gs.playerIndex = 0;
          gs.inputTimer = 0;
          setTimeout(() => {
            gs.isShowingSequence = true;
            gs.sequenceShowIndex = 0;
            gs.sequenceTimer = 0.5;
            showPanel('watching');
            const doc = getDoc(seqEntity);
            setText(doc, 'seq-text', 'WATCH AGAIN...');
          }, 800);
        }
      }

      // Time mode countdown
      if (gs.currentMode.timed) {
        gs.timeRemaining -= dt;
        if (gs.timeRemaining <= 0) {
          endGame();
        }
        updateHUD();
      }
    }

    // XR controller input
    try {
      const rightGamepad = (world.input as any)?.xr?.gamepads?.right;
      if (rightGamepad) {
        // Trigger to select
        if (rightGamepad.getButtonDown?.(0)) { // Trigger
          if (gs.state === 'input') {
            // Raycast from right controller
            const rightSpace = (world as any).playerSpaceEntities?.raySpaces?.right;
            if (rightSpace) {
              const origin = new Vector3();
              const direction = new Vector3(0, 0, -1);
              rightSpace.object3D.getWorldPosition(origin);
              direction.applyQuaternion(rightSpace.object3D.getWorldQuaternion(new Quaternion()));
              raycaster.set(origin, direction);
              const hits = raycaster.intersectObjects(panels.map(p => p.mesh), false);
              if (hits.length > 0) {
                const panelIndex = hits[0].object.userData.panelIndex;
                if (panelIndex !== undefined) {
                  handlePanelHit(panelIndex);
                }
              }
            }
          }
        }

        // B button pause
        if (rightGamepad.getButtonDown?.(4)) { // B button
          if (gs.state === 'input' || gs.state === 'watching') {
            showPanel('pause');
          } else if (gs.state === 'pause') {
            showPanel(gs.isShowingSequence ? 'watching' : 'input');
          }
        }
      }
    } catch {}
  });
}

main().catch(console.error);
