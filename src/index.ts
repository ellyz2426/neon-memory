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
// Round 3: Tutorial, Daily Streaks, Performance Ratings, Accessibility
// ═══════════════════════════════════════════════

// ─── Types & Constants ─────────────────────────

type GameState = 'title' | 'modeselect' | 'difficulty' | 'layout' | 'playing' | 'watching' | 'input' | 'pause' | 'gameover' | 'leaderboard' | 'achievements' | 'settings' | 'help' | 'stats' | 'skins' | 'countdown' | 'challenge' | 'tutorial';

interface PanelInfo {
  index: number;
  mesh: Mesh;
  glowMesh: Mesh;
  edgeMesh: LineSegments;
  baseColor: Color;
  activeColor: Color;
  frequency: number;
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
  hidden?: boolean;
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
  unlockLevel: number;
}

interface PowerUp {
  id: string;
  name: string;
  icon: string;
  description: string;
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
  unlockLevel: number;
}

const ARENA_THEMES: ArenaTheme[] = [
  { name: 'Neon Holodeck', grid: '#00ffff', accent: '#ff00ff', fog: '#000811', panel: '#001a2e', glow: '#00ffff', bg: '#000508', unlockLevel: 0 },
  { name: 'Crimson Arcade', grid: '#ff3344', accent: '#ff8800', fog: '#110005', panel: '#2e0008', glow: '#ff3344', bg: '#080002', unlockLevel: 0 },
  { name: 'Toxic Neon', grid: '#00ff44', accent: '#88ff00', fog: '#001108', panel: '#002e0a', glow: '#00ff44', bg: '#000805', unlockLevel: 0 },
  { name: 'Ultra Violet', grid: '#aa44ff', accent: '#ff44aa', fog: '#0a0011', panel: '#1a002e', glow: '#aa44ff', bg: '#050008', unlockLevel: 0 },
  { name: 'Solar Blaze', grid: '#ffaa00', accent: '#ff4400', fog: '#110800', panel: '#2e1a00', glow: '#ffaa00', bg: '#080500', unlockLevel: 0 },
  { name: 'Cyberpunk City', grid: '#ff0088', accent: '#00ffaa', fog: '#0d0011', panel: '#2e0028', glow: '#ff0088', bg: '#060009', unlockLevel: 10 },
  { name: 'Frozen Tundra', grid: '#88ddff', accent: '#ffffff', fog: '#040810', panel: '#0a1a2e', glow: '#88ddff', bg: '#020508', unlockLevel: 20 },
  { name: 'Volcanic Core', grid: '#ff4400', accent: '#ff0000', fog: '#110400', panel: '#2e0a00', glow: '#ff4400', bg: '#080200', unlockLevel: 30 },
];

const PANEL_COLORS: { base: string; active: string; freq: number }[] = [
  { base: '#003344', active: '#00ffff', freq: 261.63 },
  { base: '#440033', active: '#ff00ff', freq: 293.66 },
  { base: '#004400', active: '#00ff44', freq: 329.63 },
  { base: '#443300', active: '#ffaa00', freq: 349.23 },
  { base: '#330044', active: '#aa44ff', freq: 392.00 },
  { base: '#440000', active: '#ff3344', freq: 440.00 },
  { base: '#004433', active: '#00ffaa', freq: 493.88 },
  { base: '#333300', active: '#ffff00', freq: 523.25 },
  { base: '#003300', active: '#44ff00', freq: 587.33 },
  { base: '#440022', active: '#ff4488', freq: 659.25 },
  { base: '#002244', active: '#4488ff', freq: 698.46 },
  { base: '#442200', active: '#ff8844', freq: 783.99 },
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
  { name: 'Neon Classic', colors: ['#00ffff', '#ff00ff', '#00ff44', '#ffaa00', '#aa44ff', '#ff3344', '#00ffaa', '#ffff00', '#44ff00', '#ff4488', '#4488ff', '#ff8844'], glowIntensity: 1.0, unlockCondition: 'Default', unlockLevel: 0 },
  { name: 'Solar Flare', colors: ['#ff6600', '#ff3300', '#ffaa00', '#ff0066', '#ff8800', '#ffcc00', '#ff4400', '#ff7700', '#ff2200', '#ff5500', '#ff9900', '#ffbb00'], glowIntensity: 1.2, unlockCondition: 'Level 5', unlockLevel: 5 },
  { name: 'Frost Core', colors: ['#44ccff', '#0088ff', '#00ccff', '#44aaff', '#0066ff', '#88ddff', '#00aaff', '#2299ff', '#0055ff', '#66bbff', '#0077ff', '#33bbff'], glowIntensity: 0.9, unlockCondition: 'Level 8', unlockLevel: 8 },
  { name: 'Toxic Pulse', colors: ['#00ff00', '#44ff44', '#00cc00', '#88ff00', '#00ff88', '#33ff33', '#00ee00', '#66ff00', '#00ff66', '#22ff22', '#00dd00', '#44ff00'], glowIntensity: 1.1, unlockCondition: 'Level 12', unlockLevel: 12 },
  { name: 'Void Purple', colors: ['#9900ff', '#bb44ff', '#7700ff', '#cc66ff', '#aa22ff', '#dd88ff', '#8800ff', '#bb33ff', '#6600ff', '#cc55ff', '#9911ff', '#aa00ff'], glowIntensity: 1.3, unlockCondition: 'Level 18', unlockLevel: 18 },
  { name: 'Chrome', colors: ['#cccccc', '#aaaaaa', '#dddddd', '#bbbbbb', '#eeeeee', '#999999', '#e0e0e0', '#b0b0b0', '#d0d0d0', '#a0a0a0', '#c0c0c0', '#909090'], glowIntensity: 0.8, unlockCondition: 'Level 22', unlockLevel: 22 },
  { name: 'Rainbow', colors: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#7700ff', '#ff00ff', '#ff0077', '#ff7700', '#77ff00', '#00ff77'], glowIntensity: 1.4, unlockCondition: 'Level 28', unlockLevel: 28 },
  { name: 'Midnight', colors: ['#001155', '#002266', '#003377', '#001144', '#002255', '#003366', '#001133', '#002244', '#003355', '#001122', '#002233', '#003344'], glowIntensity: 0.6, unlockCondition: 'Level 15', unlockLevel: 15 },
  { name: 'Lava Flow', colors: ['#ff2200', '#ff4400', '#ff6600', '#ff3300', '#ff5500', '#ff7700', '#cc2200', '#ee3300', '#ff8800', '#dd4400', '#ff9900', '#cc5500'], glowIntensity: 1.5, unlockCondition: 'Level 32', unlockLevel: 32 },
  { name: 'Ocean Deep', colors: ['#003366', '#005588', '#0077aa', '#004477', '#006699', '#0088bb', '#003355', '#005577', '#007799', '#004466', '#006688', '#0088aa'], glowIntensity: 0.9, unlockCondition: 'Level 38', unlockLevel: 38 },
  { name: 'Neon Prism', colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0088', '#00ff88', '#8800ff', '#ff8800', '#0088ff', '#88ff00', '#ff0044', '#44ff00', '#0044ff'], glowIntensity: 1.6, unlockCondition: 'Level 42', unlockLevel: 42 },
  { name: 'Digital Grid', colors: ['#00cc66', '#00aa55', '#00ee77', '#009944', '#00bb66', '#00dd77', '#008833', '#00cc55', '#00ff88', '#007722', '#00aa44', '#00ee66'], glowIntensity: 1.0, unlockCondition: 'Level 48', unlockLevel: 48 },
];

// ─── XP Level System ───────────────────────────

const XP_THRESHOLDS: number[] = [];
{
  // 50 levels with escalating thresholds
  let xp = 0;
  for (let i = 0; i < 50; i++) {
    xp += 100 + i * 40 + Math.floor(i * i * 2);
    XP_THRESHOLDS.push(xp);
  }
}

const LEVEL_BADGES = ['Newbie', 'Learner', 'Student', 'Apprentice', 'Adept',
  'Skilled', 'Expert', 'Master', 'Grandmaster', 'Legend',
  'Champion', 'Prodigy', 'Virtuoso', 'Sage', 'Oracle',
  'Titan', 'Colossus', 'Mythic', 'Transcendent', 'Ascended',
  'Ethereal', 'Cosmic', 'Celestial', 'Divine', 'Immortal',
  'Apex', 'Zenith', 'Pinnacle', 'Ultimate', 'Paragon',
  'Supreme', 'Sovereign', 'Absolute', 'Infinite', 'Eternal',
  'Omega', 'Singularity', 'Nexus', 'Genesis', 'Primordial',
  'Nova', 'Quasar', 'Nebula', 'Pulsar', 'Supernova',
  'Hypernova', 'Void Walker', 'Time Lord', 'Reality Bender', 'NEON GOD'];

function getPlayerLevel(totalXP: number): number {
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (totalXP < XP_THRESHOLDS[i]) return i + 1;
  }
  return 50;
}

function getXPForLevel(level: number): { current: number; needed: number; progress: number } {
  if (level <= 1) return { current: 0, needed: XP_THRESHOLDS[0], progress: 0 };
  if (level >= 50) return { current: 0, needed: 0, progress: 1 };
  const prevThreshold = XP_THRESHOLDS[level - 2] || 0;
  const nextThreshold = XP_THRESHOLDS[level - 1];
  return { current: 0, needed: nextThreshold - prevThreshold, progress: 0 };
}

function getXPProgress(totalXP: number): { level: number; current: number; needed: number; progress: number; badge: string } {
  const level = getPlayerLevel(totalXP);
  if (level >= 50) return { level: 50, current: 0, needed: 0, progress: 1, badge: LEVEL_BADGES[49] };
  const prevThreshold = level > 1 ? XP_THRESHOLDS[level - 2] : 0;
  const nextThreshold = XP_THRESHOLDS[level - 1];
  const current = totalXP - prevThreshold;
  const needed = nextThreshold - prevThreshold;
  const progress = needed > 0 ? current / needed : 1;
  return { level, current, needed, progress, badge: LEVEL_BADGES[Math.min(level - 1, 49)] };
}

// ─── Power-Up Definitions ──────────────────────

const POWER_UPS: PowerUp[] = [
  { id: 'replay', name: 'REPLAY', icon: '↻', description: 'See the sequence one more time' },
  { id: 'slowmo', name: 'SLOW-MO', icon: '◎', description: 'Next sequence at 50% speed' },
  { id: 'shield', name: 'SHIELD', icon: '◈', description: 'Block one mistake' },
  { id: 'hint', name: 'HINT', icon: '◇', description: 'First panel flashes as reminder' },
];

// ─── Challenge Code System ─────────────────────

function encodeChallengeCode(seed: number): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  let v = Math.abs(seed) % (36 ** 6);
  for (let i = 0; i < 6; i++) {
    code += chars[v % 36];
    v = Math.floor(v / 36);
  }
  return code;
}

function decodeChallengeCode(code: string): number {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let seed = 0;
  for (let i = 0; i < code.length; i++) {
    const idx = chars.indexOf(code[i].toUpperCase());
    if (idx < 0) return 0;
    seed += idx * (36 ** i);
  }
  return seed;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s % 10000) / 10000;
  };
}


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
  totalXP = 0;
  powerUpsUsed = 0;
  challengesPlayed = 0;
  challengesCreated = 0;
  dailyStreak = 0;
  lastPlayDate = '';
  bestDailyStreak = 0;
  tutorialSeen = false;
  totalGamesWon = 0;
  recentGames: { score: number; level: number; mode: string; grade: string; date: string }[] = [];

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
  currentLayout: LayoutConfig = LAYOUTS[2];
  difficulty = 1;
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

  // Power-ups
  powerUpSlots: (string | null)[] = [null, null];
  shieldActive = false;
  slowMoActive = false;
  slowMoRoundsLeft = 0;

  // Challenge
  challengeSeed = 0;
  challengeCode = '';
  challengeMode = 0;
  challengeLayout = 2;
  challengeDifficulty = 1;
  isChallenge = false;

  // Camera shake
  shakeIntensity = 0;
  shakeDecay = 0;

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
        totalXP: this.totalXP,
        powerUpsUsed: this.powerUpsUsed,
        challengesPlayed: this.challengesPlayed,
        challengesCreated: this.challengesCreated,
        dailyStreak: this.dailyStreak,
        lastPlayDate: this.lastPlayDate,
        bestDailyStreak: this.bestDailyStreak,
        tutorialSeen: this.tutorialSeen,
        totalGamesWon: this.totalGamesWon,
        recentGames: this.recentGames.slice(0, 10),
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
      this.totalXP = d.totalXP || 0;
      this.powerUpsUsed = d.powerUpsUsed || 0;
      this.challengesPlayed = d.challengesPlayed || 0;
      this.challengesCreated = d.challengesCreated || 0;
      this.dailyStreak = d.dailyStreak || 0;
      this.lastPlayDate = d.lastPlayDate || '';
      this.bestDailyStreak = d.bestDailyStreak || 0;
      this.tutorialSeen = d.tutorialSeen || false;
      this.totalGamesWon = d.totalGamesWon || 0;
      this.recentGames = d.recentGames || [];
    } catch {}
  }

  addLeaderboard(entry: LeaderboardEntry) {
    this.leaderboard.push(entry);
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 20);
    this.save();
  }

  getSpeedForLevel(): number {
    const base = 600;
    const modeMultiplier = this.currentMode.speedMultiplier;
    const diffMultiplier = [1.3, 1.0, 0.75][this.difficulty];
    const levelReduction = Math.min(this.level * 15, 350);
    const slowMo = this.slowMoActive ? 2.0 : 1.0;
    return Math.max(150, (base - levelReduction) * modeMultiplier * diffMultiplier * slowMo);
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
    return seededRandom(seed);
  }

  awardXP(amount: number): { leveledUp: boolean; oldLevel: number; newLevel: number } {
    const oldLevel = getPlayerLevel(this.totalXP);
    this.totalXP += amount;
    const newLevel = getPlayerLevel(this.totalXP);
    this.save();
    return { leveledUp: newLevel > oldLevel, oldLevel, newLevel };
  }

  grantRandomPowerUp(): string | null {
    // Check if we have an empty slot
    const emptySlot = this.powerUpSlots.indexOf(null);
    if (emptySlot === -1) return null;
    const pu = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
    this.powerUpSlots[emptySlot] = pu.id;
    return pu.id;
  }

  usePowerUp(slot: number): string | null {
    if (slot < 0 || slot >= 2) return null;
    const id = this.powerUpSlots[slot];
    if (!id) return null;
    this.powerUpSlots[slot] = null;
    this.powerUpsUsed++;
    return id;
  }

  updateDailyStreak(): { streakUpdated: boolean; streakBonus: number } {
    const today = new Date().toISOString().slice(0, 10);
    if (this.lastPlayDate === today) {
      return { streakUpdated: false, streakBonus: 0 };
    }

    // Check if yesterday was the last play date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (this.lastPlayDate === yesterdayStr) {
      this.dailyStreak++;
    } else {
      this.dailyStreak = 1;
    }

    this.lastPlayDate = today;
    if (this.dailyStreak > this.bestDailyStreak) {
      this.bestDailyStreak = this.dailyStreak;
    }

    const streakBonus = Math.min(this.dailyStreak * 25, 500);
    this.save();
    return { streakUpdated: true, streakBonus };
  }

  getPerformanceRating(): { grade: string; label: string; color: string } {
    const accuracy = this.totalCorrect > 0
      ? this.totalCorrect / (this.totalCorrect + this.totalWrong)
      : 0;
    const levelScore = Math.min(1, this.level / 20);
    const comboScore = Math.min(1, this.maxCombo / 15);
    const total = accuracy * 0.4 + levelScore * 0.35 + comboScore * 0.25;

    if (total >= 0.95) return { grade: 'S', label: 'LEGENDARY', color: '#ffaa00' };
    if (total >= 0.85) return { grade: 'A', label: 'EXCELLENT', color: '#00ffff' };
    if (total >= 0.70) return { grade: 'B', label: 'GREAT', color: '#00ff44' };
    if (total >= 0.50) return { grade: 'C', label: 'GOOD', color: '#ffff00' };
    if (total >= 0.30) return { grade: 'D', label: 'FAIR', color: '#ff8844' };
    return { grade: 'F', label: 'TRY AGAIN', color: '#ff3344' };
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
  arpOsc: OscillatorNode | null = null;
  arpGain: GainNode | null = null;
  arpInterval: number | null = null;

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

  startDrone(themeIndex = 0) {
    if (!this.ctx || !this.musicGain || this.droneOsc1) return;

    // Theme-specific drone frequencies for unique ambient feel
    const themeAudio = [
      { f1: 55, f2: 82.5, shimmer: 330, lfoRate: 0.15, filterCutoff: 400 },   // Neon Holodeck
      { f1: 65.4, f2: 98.0, shimmer: 392, lfoRate: 0.2, filterCutoff: 450 },  // Crimson Arcade
      { f1: 49, f2: 73.4, shimmer: 293.66, lfoRate: 0.12, filterCutoff: 350 },// Toxic Neon
      { f1: 58.3, f2: 87.3, shimmer: 349.23, lfoRate: 0.18, filterCutoff: 380 }, // Ultra Violet
      { f1: 73.4, f2: 110, shimmer: 440, lfoRate: 0.25, filterCutoff: 500 },  // Solar Blaze
      { f1: 51.9, f2: 77.8, shimmer: 311.13, lfoRate: 0.1, filterCutoff: 320 }, // Cyberpunk City
      { f1: 46.2, f2: 69.3, shimmer: 277.18, lfoRate: 0.08, filterCutoff: 280 }, // Frozen Tundra
      { f1: 61.7, f2: 92.5, shimmer: 369.99, lfoRate: 0.22, filterCutoff: 460 }, // Volcanic Core
    ];
    const ta = themeAudio[themeIndex % themeAudio.length];

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.value = ta.f1;
    const lp1 = this.ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.value = ta.filterCutoff;
    this.droneOsc1.connect(lp1);
    lp1.connect(this.musicGain);
    this.droneOsc1.start();

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.value = ta.f2;
    const lp2 = this.ctx.createBiquadFilter();
    lp2.type = 'lowpass';
    lp2.frequency.value = ta.filterCutoff - 50;
    this.droneOsc2.connect(lp2);
    lp2.connect(this.musicGain);
    this.droneOsc2.start();

    this.droneLfo = this.ctx.createOscillator();
    this.droneLfo.frequency.value = ta.lfoRate;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 50;
    this.droneLfo.connect(lfoGain);
    lfoGain.connect(lp1.frequency);
    this.droneLfo.start();

    this.shimmerOsc = this.ctx.createOscillator();
    this.shimmerOsc.type = 'sine';
    this.shimmerOsc.frequency.value = ta.shimmer;
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
    this.stopArpeggiator();
  }

  // Musical scale system: panels play harmonically related notes
  getHarmonicFrequency(panelIndex: number, panelCount: number): number {
    // Major pentatonic scale intervals
    const scaleIntervals = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
    const baseFreq = 261.63; // C4
    const semitones = scaleIntervals[panelIndex % scaleIntervals.length];
    return baseFreq * Math.pow(2, semitones / 12);
  }

  playTone(frequency: number, duration = 0.3, volume = 0.4) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const pitchVar = 1 + (Math.random() - 0.5) * 0.01;

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

    // Sub-harmonic for richness
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = frequency * 0.5 * pitchVar;
    const g3 = this.ctx.createGain();
    g3.gain.setValueAtTime(volume * 0.1, t);
    g3.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.6);
    osc3.connect(g3);
    g3.connect(this.sfxGain);
    osc3.start(t);
    osc3.stop(t + duration);
  }

  // Arpeggiator that adapts tempo to current level
  startArpeggiator(bpm: number, themeIndex = 0) {
    if (!this.ctx || !this.musicGain) return;
    this.stopArpeggiator();

    this.arpGain = this.ctx.createGain();
    this.arpGain.gain.value = 0.04;
    this.arpGain.connect(this.musicGain);

    // Theme-specific arpeggiator scales
    const themeScales = [
      [261.63, 329.63, 392.00, 523.25],       // C major pentatonic
      [293.66, 349.23, 440.00, 587.33],        // D minor-ish
      [246.94, 329.63, 369.99, 493.88],        // B ambiguous
      [277.18, 349.23, 415.30, 554.37],        // Db lydian
      [329.63, 415.30, 493.88, 659.25],        // E bright
      [261.63, 311.13, 392.00, 466.16],        // C minor
      [220.00, 277.18, 329.63, 440.00],        // A cold/icy
      [293.66, 370.00, 440.00, 587.33],        // D fiery
    ];
    const notes = themeScales[themeIndex % themeScales.length];
    let noteIdx = 0;
    const interval = (60 / bpm) * 1000 / 2;

    this.arpInterval = window.setInterval(() => {
      if (!this.ctx || !this.arpGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = notes[noteIdx % notes.length];
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g);
      g.connect(this.arpGain!);
      osc.start(t);
      osc.stop(t + 0.12);
      noteIdx++;
    }, interval);
  }

  stopArpeggiator() {
    if (this.arpInterval !== null) {
      clearInterval(this.arpInterval);
      this.arpInterval = null;
    }
  }

  updateArpTempo(level: number, themeIndex = 0) {
    const bpm = Math.min(200, 80 + level * 5);
    this.startArpeggiator(bpm, themeIndex);
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

  playPowerUp(type: string) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const freqs: Record<string, number[]> = {
      replay: [440, 660, 880, 660],
      slowmo: [880, 660, 440, 330],
      shield: [523, 659, 784, 1047],
      hint: [784, 880, 784, 1047],
    };
    const notes = freqs[type] || [523, 659];
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.2, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.15);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.15);
    });
  }

  playLevelUp() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
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

  playFireworks() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      const delay = Math.random() * 0.5;
      const freq = 600 + Math.random() * 1200;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.3);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + delay);
      osc.stop(t + delay + 0.3);
    }
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

  constructor(scene: Object3D, max = 200) {
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

  // Fireworks effect for milestones
  fireworks(pos: Vector3, count = 30) {
    const colors = ['#ff0000', '#ffaa00', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ffffff'];
    let spawned = 0;
    for (const p of this.particles) {
      if (p.active || spawned >= count) continue;
      p.mesh.position.copy(pos);
      const angle = Math.random() * Math.PI * 2;
      const elev = Math.random() * Math.PI - Math.PI / 2;
      const speed = 2 + Math.random() * 3;
      p.velocity.set(
        Math.cos(angle) * Math.cos(elev) * speed,
        Math.sin(elev) * speed + 2,
        Math.sin(angle) * Math.cos(elev) * speed
      );
      p.life = 0;
      p.maxLife = 0.8 + Math.random() * 0.6;
      p.active = true;
      p.mesh.visible = true;
      (p.mesh.material as MeshBasicMaterial).color.set(colors[spawned % colors.length]);
      (p.mesh.material as MeshBasicMaterial).opacity = 1;
      const s = 0.8 + Math.random() * 0.4;
      p.mesh.scale.setScalar(s);
      spawned++;
    }
  }

  // Wave effect rippling outward from a panel
  wave(pos: Vector3, color: string, count = 10) {
    let spawned = 0;
    for (const p of this.particles) {
      if (p.active || spawned >= count) continue;
      const angle = (spawned / count) * Math.PI * 2;
      p.mesh.position.copy(pos);
      p.velocity.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
      p.life = 0;
      p.maxLife = 0.4;
      p.active = true;
      p.mesh.visible = true;
      (p.mesh.material as MeshBasicMaterial).color.set(color);
      (p.mesh.material as MeshBasicMaterial).opacity = 0.7;
      p.mesh.scale.setScalar(0.5);
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

// ─── Achievements (80+) ────────────────────────

function getAchievements(gs: GameStateManager): Achievement[] {
  const playerLevel = getPlayerLevel(gs.totalXP);
  return [
    // Basic progression
    { id: 'first_game', name: 'First Step', description: 'Play your first game', check: () => gs.games >= 1 },
    { id: 'ten_games', name: 'Regular', description: 'Play 10 games', check: () => gs.games >= 10 },
    { id: 'fifty_games', name: 'Veteran', description: 'Play 50 games', check: () => gs.games >= 50 },
    { id: 'hundred_games', name: 'Dedicated', description: 'Play 100 games', check: () => gs.games >= 100 },
    { id: 'level_5', name: 'Getting Started', description: 'Reach game level 5', check: () => gs.bestLevel >= 5 },
    { id: 'level_10', name: 'Sharp Mind', description: 'Reach game level 10', check: () => gs.bestLevel >= 10 },
    { id: 'level_15', name: 'Memory Master', description: 'Reach game level 15', check: () => gs.bestLevel >= 15 },
    { id: 'level_20', name: 'Photographic', description: 'Reach game level 20', check: () => gs.bestLevel >= 20 },
    { id: 'level_30', name: 'Savant', description: 'Reach game level 30', check: () => gs.bestLevel >= 30 },
    { id: 'level_50', name: 'Legendary Mind', description: 'Reach game level 50', check: () => gs.bestLevel >= 50 },

    // Score
    { id: 'score_1k', name: 'Score Hunter', description: 'Score 1,000 points', check: () => gs.bestScore >= 1000 },
    { id: 'score_5k', name: 'Score Chaser', description: 'Score 5,000 points', check: () => gs.bestScore >= 5000 },
    { id: 'score_10k', name: 'Score Legend', description: 'Score 10,000 points', check: () => gs.bestScore >= 10000 },
    { id: 'score_25k', name: 'Score God', description: 'Score 25,000 points', check: () => gs.bestScore >= 25000 },
    { id: 'score_50k', name: 'Score Titan', description: 'Score 50,000 points', check: () => gs.bestScore >= 50000 },

    // Streaks & Combos
    { id: 'streak_5', name: 'On Fire', description: '5 perfect rounds in a row', check: () => gs.bestStreak >= 5 },
    { id: 'streak_10', name: 'Unstoppable', description: '10 perfect rounds', check: () => gs.bestStreak >= 10 },
    { id: 'streak_20', name: 'Flawless', description: '20 perfect rounds', check: () => gs.bestStreak >= 20 },
    { id: 'perfect_game', name: 'Perfect Game', description: 'Zero mistakes in a game', check: () => gs.perfectGames >= 1 },
    { id: 'perfect_5', name: 'Perfectionist', description: '5 perfect games', check: () => gs.perfectGames >= 5 },
    { id: 'combo_5', name: 'Combo Starter', description: 'Get a x5 combo', check: () => gs.maxCombo >= 5 },
    { id: 'combo_10', name: 'Combo King', description: 'Get a x10 combo', check: () => gs.maxCombo >= 10 },
    { id: 'combo_15', name: 'Combo Emperor', description: 'Get a x15 combo', check: () => gs.maxCombo >= 15 },
    { id: 'combo_20', name: 'Combo Overlord', description: 'Get a x20 combo', check: () => gs.maxCombo >= 20 },
    { id: 'combo_30', name: 'Combo Transcendent', description: 'Get a x30 combo', check: () => gs.maxCombo >= 30 },

    // XP / Level milestones
    { id: 'xp_lv5', name: 'Rising Star', description: 'Reach XP Level 5', check: () => playerLevel >= 5 },
    { id: 'xp_lv10', name: 'Seasoned', description: 'Reach XP Level 10', check: () => playerLevel >= 10 },
    { id: 'xp_lv25', name: 'Expert Player', description: 'Reach XP Level 25', check: () => playerLevel >= 25 },
    { id: 'xp_lv50', name: 'NEON GOD', description: 'Reach XP Level 50', check: () => playerLevel >= 50 },

    // Play time
    { id: 'time_1h', name: 'Hour Glass', description: 'Play for 1 hour total', check: () => gs.totalPlayTime >= 3600 },
    { id: 'time_5h', name: 'Dedicated Player', description: 'Play for 5 hours total', check: () => gs.totalPlayTime >= 18000 },
    { id: 'time_10h', name: 'Neon Addict', description: 'Play for 10 hours total', check: () => gs.totalPlayTime >= 36000 },

    // Mode specific
    { id: 'daily_done', name: 'Daily Player', description: 'Complete a Daily Challenge', check: () => gs.dailyDate === new Date().toISOString().slice(0, 10) },
    { id: 'all_modes', name: 'Explorer', description: 'Play all game modes', check: () => gs.modesPlayed.size >= GAME_MODES.length },
    { id: 'all_layouts', name: 'Architect', description: 'Play all layouts', check: () => gs.layoutsPlayed.size >= LAYOUTS.length },
    { id: 'survival_10', name: 'Survivor', description: 'Level 10 in Survival', check: () => gs.modesPlayed.has('Survival') && gs.bestLevel >= 10 },
    { id: 'marathon_25', name: 'Marathoner', description: 'Level 25 in Marathon', check: () => gs.modesPlayed.has('Marathon') && gs.bestLevel >= 25 },
    { id: 'reverse_10', name: 'Backwards Brain', description: 'Level 10 in Reverse', check: () => gs.modesPlayed.has('Reverse') && gs.bestLevel >= 10 },
    { id: 'speed_10', name: 'Quick Thinker', description: 'Level 10 in Speed', check: () => gs.modesPlayed.has('Speed') && gs.bestLevel >= 10 },
    { id: 'zen_master', name: 'Zen Master', description: 'Level 30 in Zen', check: () => gs.modesPlayed.has('Zen') && gs.bestLevel >= 30 },
    { id: 'rush_20', name: 'Rush Expert', description: 'Level 20 in Rush', check: () => gs.modesPlayed.has('Rush') && gs.bestLevel >= 20 },
    { id: 'survival_20', name: 'Iron Will', description: 'Level 20 in Survival', check: () => gs.modesPlayed.has('Survival') && gs.bestLevel >= 20 },
    { id: 'marathon_50', name: 'Marathon Legend', description: 'Level 50 in Marathon', check: () => gs.modesPlayed.has('Marathon') && gs.bestLevel >= 50 },

    // Layout mastery
    { id: 'master_layout', name: 'Master Layout', description: 'Level 10 with 12 panels', check: () => gs.layoutsPlayed.has('Dodecagon') && gs.bestLevel >= 10 },
    { id: 'octo_15', name: 'Octo Master', description: 'Level 15 with 8 panels', check: () => gs.layoutsPlayed.has('Octagon') && gs.bestLevel >= 15 },
    { id: 'quad_20', name: 'Classic King', description: 'Level 20 on Quad', check: () => gs.layoutsPlayed.has('Quad') && gs.bestLevel >= 20 },
    { id: 'deca_15', name: 'Decagon Pro', description: 'Level 15 on Decagon', check: () => gs.layoutsPlayed.has('Decagon') && gs.bestLevel >= 15 },
    { id: 'dodeca_20', name: 'Dodeca Champion', description: 'Level 20 on Dodecagon', check: () => gs.layoutsPlayed.has('Dodecagon') && gs.bestLevel >= 20 },

    // Panel hits
    { id: 'total_500', name: 'Panel Tapper', description: 'Hit 500 panels total', check: () => gs.totalPanelHits >= 500 },
    { id: 'total_2k', name: 'Panel Masher', description: 'Hit 2,000 panels', check: () => gs.totalPanelHits >= 2000 },
    { id: 'total_5k', name: 'Panel Legend', description: 'Hit 5,000 panels', check: () => gs.totalPanelHits >= 5000 },
    { id: 'total_10k', name: 'Panel Deity', description: 'Hit 10,000 panels', check: () => gs.totalPanelHits >= 10000 },

    // Skins & Themes
    { id: 'skin_unlock', name: 'Fashionista', description: 'Use 2 different skins', check: () => gs.skinsUsed.size >= 2 },
    { id: 'all_skins', name: 'Skin Collector', description: 'Use all panel skins', check: () => gs.skinsUsed.size >= PANEL_SKINS.length },
    { id: 'theme_explore', name: 'Theme Explorer', description: 'Try all arena themes', check: () => gs.themesUsed.size >= ARENA_THEMES.length },

    // Difficulty
    { id: 'hard_mode_10', name: 'Hard Mode Hero', description: 'Level 10 on Hard', check: () => gs.difficulty === 2 && gs.bestLevel >= 10 },
    { id: 'hard_mode_20', name: 'Hard Mode Legend', description: 'Level 20 on Hard', check: () => gs.difficulty === 2 && gs.bestLevel >= 20 },

    // Accuracy
    { id: 'accuracy_100', name: 'Precision', description: '100 correct in a row', check: () => gs.totalCorrect >= 100 },
    { id: 'accuracy_500', name: 'Machine', description: '500 correct total', check: () => gs.totalCorrect >= 500 },

    // Power-ups
    { id: 'first_powerup', name: 'Power Player', description: 'Use your first power-up', check: () => gs.powerUpsUsed >= 1 },
    { id: 'powerup_10', name: 'Empowered', description: 'Use 10 power-ups', check: () => gs.powerUpsUsed >= 10 },
    { id: 'powerup_50', name: 'Power Hoarder', description: 'Use 50 power-ups', check: () => gs.powerUpsUsed >= 50 },

    // Challenges
    { id: 'first_challenge', name: 'Challenger', description: 'Play a challenge', check: () => gs.challengesPlayed >= 1 },
    { id: 'create_challenge', name: 'Challenge Creator', description: 'Create a challenge code', check: () => gs.challengesCreated >= 1 },
    { id: 'challenge_10', name: 'Challenge Addict', description: 'Play 10 challenges', check: () => gs.challengesPlayed >= 10 },

    // Speed run
    { id: 'speed_run_lv10', name: 'Speed Runner', description: 'Level 10 under 2 min', check: () => {
      const elapsed = (Date.now() - gs.gameStartTime) / 1000;
      return gs.level >= 10 && elapsed < 120;
    }},

    // Perfect on hard
    { id: 'perfect_hard', name: 'Diamond Perfect', description: 'Perfect game on Hard', check: () => gs.difficulty === 2 && gs.perfectGames >= 1 },

    // Hidden achievements
    { id: 'night_owl', name: 'Night Owl', description: 'Play between midnight and 4am', check: () => { const h = new Date().getHours(); return h >= 0 && h < 4 && gs.games >= 1; }, hidden: true },
    { id: 'century', name: 'Century', description: 'Score exactly 100 points', check: () => gs.score === 100, hidden: true },
    { id: 'level_42', name: 'Answer', description: 'Reach level 42', check: () => gs.bestLevel >= 42, hidden: true },
    { id: 'full_ring', name: 'Full Circle', description: 'Level 12 on Dodecagon', check: () => gs.layoutsPlayed.has('Dodecagon') && gs.bestLevel >= 12, hidden: true },

    // Additional mastery
    { id: 'penta_15', name: 'Pentagon Pro', description: 'Level 15 on Pentagon', check: () => gs.layoutsPlayed.has('Pentagon') && gs.bestLevel >= 15 },
    { id: 'hex_20', name: 'Hex Champion', description: 'Level 20 on Hexagon', check: () => gs.layoutsPlayed.has('Hexagon') && gs.bestLevel >= 20 },
    { id: 'classic_20', name: 'Classic Master', description: 'Level 20 in Classic', check: () => gs.modesPlayed.has('Classic') && gs.bestLevel >= 20 },
    { id: 'speed_15', name: 'Lightning Fast', description: 'Level 15 in Speed', check: () => gs.modesPlayed.has('Speed') && gs.bestLevel >= 15 },
    { id: 'perfect_10', name: 'Perfect Ten', description: '10 perfect games', check: () => gs.perfectGames >= 10 },
    { id: 'perfect_25', name: 'Flawless Record', description: '25 perfect games', check: () => gs.perfectGames >= 25 },
    { id: 'total_20k', name: 'Panel Immortal', description: 'Hit 20,000 panels', check: () => gs.totalPanelHits >= 20000 },
    { id: 'combo_40', name: 'Combo Deity', description: 'Get a x40 combo', check: () => gs.maxCombo >= 40 },

    // Welcome
    { id: 'welcome', name: 'Welcome', description: 'Start your first game', check: () => gs.games >= 1 },

    // Daily streak
    { id: 'streak_days_3', name: 'Three Day Streak', description: 'Play 3 days in a row', check: () => gs.dailyStreak >= 3 },
    { id: 'streak_days_7', name: 'Weekly Warrior', description: 'Play 7 days in a row', check: () => gs.dailyStreak >= 7 },
    { id: 'streak_days_14', name: 'Fortnight Focus', description: 'Play 14 days in a row', check: () => gs.dailyStreak >= 14 },
    { id: 'streak_days_30', name: 'Monthly Master', description: '30-day streak!', check: () => gs.dailyStreak >= 30 },

    // Performance grades
    { id: 'grade_s', name: 'S-Rank', description: 'Earn an S performance rating', check: () => gs.getPerformanceRating().grade === 'S' },
    { id: 'grade_a', name: 'A-Rank Player', description: 'Earn an A performance rating', check: () => gs.getPerformanceRating().grade === 'A' || gs.getPerformanceRating().grade === 'S' },

    // Win milestones
    { id: 'wins_10', name: 'Frequent Winner', description: 'Win 10 games (reach level 5+)', check: () => gs.totalGamesWon >= 10 },
    { id: 'wins_50', name: 'Serial Winner', description: 'Win 50 games', check: () => gs.totalGamesWon >= 50 },
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

    const existingGrids = world.scene.children.filter((c: Object3D) => c.userData?.isGrid);
    existingGrids.forEach((g: Object3D) => world.scene.remove(g));

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

    // Update pedestal ring to match theme
    if (centerRingMat) {
      (centerRingMat as MeshBasicMaterial).color.set(theme.glow);
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

  // Floor reflection (semi-transparent mirror plane)
  const floorGeo = new PlaneGeometry(30, 30);
  const floorMat = new MeshStandardMaterial({
    color: '#000000',
    metalness: 0.95,
    roughness: 0.1,
    transparent: true,
    opacity: 0.15,
  });
  const floor = new Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.001;
  world.scene.add(floor);

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
    while (panelGroup.children.length > 0) {
      panelGroup.remove(panelGroup.children[0]);
    }
    panels = [];

    const count = layout.panelCount;
    const radius = 2.0;
    const panelWidth = Math.min(0.6, (2 * Math.PI * radius) / count * 0.7);
    const panelHeight = 0.8;
    const skin = PANEL_SKINS[gs.selectedSkin];

    // Unique marker shapes for accessibility (colorblind support)
    const markerGeos = [
      new SphereGeometry(0.03, 6, 6),         // 0: sphere
      new BoxGeometry(0.05, 0.05, 0.05),       // 1: cube
      new CylinderGeometry(0, 0.04, 0.06, 3),  // 2: triangle/cone
      new TorusGeometry(0.025, 0.008, 6, 12),  // 3: ring
      new CylinderGeometry(0.03, 0.03, 0.05, 4), // 4: diamond
      new CylinderGeometry(0.03, 0.03, 0.05, 6), // 5: hexagon
      new BoxGeometry(0.06, 0.025, 0.025),      // 6: bar
      new CylinderGeometry(0.03, 0.03, 0.05, 8), // 7: octagon
      new BoxGeometry(0.04, 0.04, 0.04),        // 8: rotated cube
      new CylinderGeometry(0.01, 0.035, 0.05, 4), // 9: pyramid
      new SphereGeometry(0.02, 4, 4),           // 10: small sphere
      new TorusGeometry(0.03, 0.01, 4, 8),      // 11: thick ring
    ];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const colorIndex = i % PANEL_COLORS.length;

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

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      mesh.position.set(x, 1.3, z);
      mesh.lookAt(0, 1.3, 0);
      mesh.userData.panelIndex = i;

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

      const edgesGeo = new EdgesGeometry(geo);
      const edgeMat = new LineBasicMaterial({ color: activeCol, transparent: true, opacity: 0.4 });
      const edgeMesh = new LineSegments(edgesGeo, edgeMat);
      mesh.add(edgeMesh);

      // Add unique shape marker for accessibility
      const markerGeo = markerGeos[i % markerGeos.length];
      const markerMat = new MeshBasicMaterial({
        color: activeCol.clone(),
        transparent: true,
        opacity: 0.6,
      });
      const marker = new Mesh(markerGeo, markerMat);
      marker.position.set(0, -panelHeight * 0.3, 0.05);
      if (i % markerGeos.length === 8) marker.rotation.z = Math.PI / 4; // rotate the cube
      mesh.add(marker);

      panelGroup.add(mesh);

      // Use harmonic frequency for musical scale
      const freq = audio.getHarmonicFrequency(i, count);

      panels.push({
        index: i,
        mesh,
        glowMesh,
        edgeMesh,
        baseColor: baseCol.clone(),
        activeColor: activeCol.clone(),
        frequency: freq,
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

  // XP Bar HUD
  const xpEntity = world.createTransformEntity(undefined, { persistent: true });
  xpEntity.addComponent(PanelUI, { config: '/ui/xpbar.json', maxWidth: 0.25, maxHeight: 0.1 });
  xpEntity.addComponent(Follower, { target: world.player.head, offsetPosition: [0.25, -0.28, -0.5], behavior: FollowBehavior.PivotY, speed: 5, tolerance: 0.3 });

  // Power-ups HUD
  const puEntity = world.createTransformEntity(undefined, { persistent: true });
  puEntity.addComponent(PanelUI, { config: '/ui/powerups.json', maxWidth: 0.25, maxHeight: 0.1 });
  puEntity.addComponent(Follower, { target: world.player.head, offsetPosition: [-0.25, -0.15, -0.5], behavior: FollowBehavior.PivotY, speed: 5, tolerance: 0.3 });

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

  // Challenge
  const challengeEntity = world.createTransformEntity(undefined, { persistent: true });
  challengeEntity.object3D.position.set(0, 1.6, -2.5);
  challengeEntity.addComponent(PanelUI, { config: '/ui/challenge.json', maxWidth: 0.9, maxHeight: 1.2 });

  // Tutorial
  const tutorialEntity = world.createTransformEntity(undefined, { persistent: true });
  tutorialEntity.object3D.position.set(0, 1.6, -2.5);
  tutorialEntity.addComponent(PanelUI, { config: '/ui/tutorial.json', maxWidth: 0.9, maxHeight: 1.4 });

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
      challenge: challengeEntity,
      tutorial: tutorialEntity,
    };
    const all = [titleEntity, modeEntity, diffEntity, layoutEntity, pauseEntity,
      gameoverEntity, lbEntity, achEntity, settingsEntity, helpEntity, statsEntity,
      skinsEntity, challengeEntity, tutorialEntity];

    for (const e of all) {
      e.object3D.visible = false;
    }

    if (map[state]) {
      map[state].object3D.visible = true;
    }

    const playing = state === 'playing' || state === 'watching' || state === 'input';
    hudEntity.object3D.visible = playing;
    seqEntity.object3D.visible = playing;
    xpEntity.object3D.visible = playing;
    puEntity.object3D.visible = playing;
    countdownEntity.object3D.visible = state === 'countdown';
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

  function updateXPBar() {
    const doc = getDoc(xpEntity);
    if (!doc) return;
    const xp = getXPProgress(gs.totalXP);
    setText(doc, 'xp-level', `LV ${xp.level}`);
    if (xp.level >= 50) {
      setText(doc, 'xp-amount', 'MAX');
    } else {
      setText(doc, 'xp-amount', `${xp.current}/${xp.needed} XP`);
    }
    setText(doc, 'xp-badge', xp.badge);
    // Width percentage for fill bar
    const fillEl = doc.getElementById('xp-fill');
    if (fillEl) {
      try { (fillEl as any).style = { width: `${Math.floor(xp.progress * 100)}%` }; } catch {}
    }
  }

  function updatePowerUpHUD() {
    const doc = getDoc(puEntity);
    if (!doc) return;
    for (let i = 0; i < 2; i++) {
      const id = gs.powerUpSlots[i];
      if (id) {
        const pu = POWER_UPS.find(p => p.id === id);
        setText(doc, `pu-icon-${i}`, pu?.icon || '?');
        setText(doc, `pu-name-${i}`, pu?.name || '???');
      } else {
        setText(doc, `pu-icon-${i}`, '-');
        setText(doc, `pu-name-${i}`, 'EMPTY');
      }
    }
  }


  // ─── Game Logic ──────────────────────────────

  function startGame() {
    audio.init(gs);
    audio.startDrone(gs.selectedTheme);

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
    gs.powerUpSlots = [null, null];
    gs.shieldActive = false;
    gs.slowMoActive = false;
    gs.slowMoRoundsLeft = 0;

    gs.modesPlayed.add(gs.currentMode.name);
    gs.layoutsPlayed.add(gs.currentLayout.name);
    gs.skinsUsed.add(PANEL_SKINS[gs.selectedSkin].name);
    gs.themesUsed.add(ARENA_THEMES[gs.selectedTheme].name);

    if (gs.isChallenge) {
      gs.challengesPlayed++;
    }

    // Daily streak tracking
    const streakResult = gs.updateDailyStreak();
    if (streakResult.streakUpdated) {
      if (gs.dailyStreak > 1) {
        showToast(`${gs.dailyStreak}-day streak! +${streakResult.streakBonus} XP`);
        gs.awardXP(streakResult.streakBonus);
      }
    }

    createPanels(gs.currentLayout);
    updatePowerUpHUD();
    updateXPBar();
    audio.updateArpTempo(1, gs.selectedTheme);
    nextRound();
  }

  function nextRound() {
    gs.level++;
    gs.correctThisRound = 0;

    // Slow-Mo wears off
    if (gs.slowMoActive) {
      gs.slowMoRoundsLeft--;
      if (gs.slowMoRoundsLeft <= 0) {
        gs.slowMoActive = false;
        showToast('Slow-Mo ended');
      }
    }

    // Add to sequence
    if (gs.isChallenge) {
      const rng = seededRandom(gs.challengeSeed + gs.level);
      while (gs.sequence.length < gs.level) {
        gs.sequence.push(Math.floor(rng() * gs.currentLayout.panelCount));
      }
    } else if (gs.currentMode.name === 'Daily') {
      const rng = gs.getDailySeededRandom();
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

      // XP award
      const xpGain = gs.level * 10 + gs.combo * 5;
      const result = gs.awardXP(xpGain);
      if (result.leveledUp) {
        showToast(`LEVEL UP! XP Level ${result.newLevel}!`);
        audio.playLevelUp();
        particles.fireworks(new Vector3(0, 2, 0), 25);
      }
      updateXPBar();

      // Power-up grant: chance on level 5, 10, 15... or milestone levels
      if (gs.level % 5 === 0 || gs.level === 3) {
        const puId = gs.grantRandomPowerUp();
        if (puId) {
          const pu = POWER_UPS.find(p => p.id === puId);
          showToast(`Power-up: ${pu?.name || puId}!`);
          updatePowerUpHUD();
        }
      }

      // Fireworks celebration every 10 levels
      if (gs.level % 10 === 0) {
        particles.fireworks(new Vector3(0, 2.5, -1), 30);
        particles.fireworks(new Vector3(1, 2, -1.5), 20);
        particles.fireworks(new Vector3(-1, 2, -1.5), 20);
        audio.playFireworks();
      }
    }

    // Update arpeggiator tempo
    audio.updateArpTempo(gs.level, gs.selectedTheme);

    gs.isShowingSequence = true;
    gs.sequenceShowIndex = 0;
    gs.sequenceTimer = 0.5;
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

    audio.playTone(panel.frequency, duration * 1.5, 0.35);

    // Wave effect on activation
    particles.wave(panel.mesh.position.clone(), panel.activeColor.getStyle(), 8);

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

  function usePowerUp(slot: number) {
    const puId = gs.usePowerUp(slot);
    if (!puId) return;

    audio.playPowerUp(puId);
    updatePowerUpHUD();

    switch (puId) {
      case 'replay':
        // Replay the current sequence
        gs.isShowingSequence = true;
        gs.sequenceShowIndex = 0;
        gs.sequenceTimer = 0.5;
        gs.playerIndex = 0;
        gs.inputTimer = 0;
        showPanel('watching');
        setText(getDoc(seqEntity), 'seq-text', 'REPLAY...');
        showToast('Replaying sequence!');
        break;
      case 'slowmo':
        gs.slowMoActive = true;
        gs.slowMoRoundsLeft = 2;
        showToast('Slow-Mo active for 2 rounds!');
        break;
      case 'shield':
        gs.shieldActive = true;
        showToast('Shield active!');
        particles.ring(new Vector3(0, 1.3, 0), '#00ff88', 16);
        break;
      case 'hint':
        // Flash the first panel of the expected sequence
        const expectedSequence = gs.currentMode.reverse ? [...gs.sequence].reverse() : gs.sequence;
        if (gs.playerIndex < expectedSequence.length) {
          const hintIdx = expectedSequence[gs.playerIndex];
          flashPanel(hintIdx, 0.4);
          setTimeout(() => resetPanel(hintIdx), 400);
          showToast('Hint: watch the flash!');
        }
        break;
    }
  }

  function handlePanelHit(panelIndex: number) {
    if (gs.state !== 'input') return;

    gs.totalPanelHits++;

    const expectedSequence = gs.currentMode.reverse ? [...gs.sequence].reverse() : gs.sequence;
    const expected = expectedSequence[gs.playerIndex];

    flashPanel(panelIndex, 0.2);
    particles.burst(panels[panelIndex].mesh.position.clone(), panels[panelIndex].activeColor.getStyle());

    if (panelIndex === expected) {
      gs.playerIndex++;
      gs.totalCorrect++;
      gs.correctThisRound++;
      gs.combo++;
      gs.streak++;
      if (gs.combo > gs.maxCombo) gs.maxCombo = gs.combo;
      if (gs.streak > gs.bestStreak) gs.bestStreak = gs.streak;
      gs.inputTimer = 0;

      if (gs.combo > 0 && gs.combo % 5 === 0) {
        audio.playCombo(Math.min(gs.combo / 5, 5));
        showToast(`x${gs.combo} COMBO!`);
        particles.ring(new Vector3(0, 1.3, 0), panels[panelIndex].activeColor.getStyle());
      }

      const hitScore = 10 + gs.level * 5 + Math.floor(gs.combo / 2) * 10;
      gs.score += hitScore;

      if (gs.playerIndex >= gs.sequence.length) {
        resetAllPanels();
        setTimeout(() => nextRound(), 800);
      }
    } else {
      // Wrong!
      gs.totalWrong++;
      gs.wrongThisRound++;

      // Shield check
      if (gs.shieldActive) {
        gs.shieldActive = false;
        showToast('Shield blocked the mistake!');
        audio.playCorrect();
        particles.ring(new Vector3(0, 1.3, 0), '#00ff88', 12);
        // Don't lose a life, don't reset combo
        return;
      }

      gs.combo = 0;
      gs.streak = 0;
      gs.lives--;
      audio.playWrong();

      // Camera shake
      gs.shakeIntensity = 0.03;
      gs.shakeDecay = 3.0;

      setTimeout(() => {
        flashPanel(expected, 0.5);
        setTimeout(() => resetPanel(expected), 500);
      }, 300);

      if (gs.lives <= 0) {
        endGame();
      } else {
        showToast(`Wrong! ${gs.lives} lives left`);
        gs.playerIndex = 0;
        gs.inputTimer = 0;
        setTimeout(() => {
          gs.isShowingSequence = true;
          gs.sequenceShowIndex = 0;
          gs.sequenceTimer = 0.5;
          showPanel('watching');
          setText(getDoc(seqEntity), 'seq-text', 'WATCH AGAIN...');
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
    if (gs.level >= 5) gs.totalGamesWon++;

    // Record to recent games history
    const rating = gs.getPerformanceRating();
    gs.recentGames.unshift({
      score: gs.score,
      level: gs.level,
      mode: gs.isChallenge ? 'Challenge' : gs.currentMode.name,
      grade: rating.grade,
      date: new Date().toISOString().slice(0, 10),
    });
    gs.recentGames = gs.recentGames.slice(0, 10);

    if (gs.currentMode.name === 'Daily') {
      const today = new Date().toISOString().slice(0, 10);
      gs.dailyDate = today;
      if (gs.score > gs.dailyBest) gs.dailyBest = gs.score;
    }

    // End-of-game XP
    const endXP = gs.score > 0 ? Math.floor(gs.score / 10) + gs.level * 5 : 0;
    if (endXP > 0) {
      const result = gs.awardXP(endXP);
      if (result.leveledUp) {
        showToast(`LEVEL UP! XP Level ${result.newLevel}!`);
        audio.playLevelUp();
      }
    }

    gs.addLeaderboard({
      score: gs.score,
      level: gs.level,
      mode: gs.isChallenge ? `Challenge` : gs.currentMode.name,
      layout: gs.currentLayout.name,
      date: new Date().toISOString().slice(0, 10),
    });

    checkAchievements();
    gs.isChallenge = false;
    gs.save();
    audio.playGameOver();
    audio.stopArpeggiator();

    showPanel('gameover');
    updateGameOver();
    resetAllPanels();
  }


  // ─── UI Update Functions ─────────────────────

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
    const rating = gs.getPerformanceRating();
    setText(doc, 'go-grade', rating.grade);
    setText(doc, 'go-grade-label', rating.label);
    setText(doc, 'go-score', `${gs.score}`);
    const endXP = gs.score > 0 ? Math.floor(gs.score / 10) + gs.level * 5 : 0;
    setText(doc, 'go-xp', `+${endXP} XP`);
    setText(doc, 'go-level', `Level ${gs.level}`);
    setText(doc, 'go-combo', `Best Combo: x${gs.maxCombo}`);
    setText(doc, 'go-accuracy', `Accuracy: ${gs.totalCorrect > 0 ? Math.round(gs.totalCorrect / (gs.totalCorrect + gs.totalWrong) * 100) : 0}%`);
    setText(doc, 'go-streak', gs.dailyStreak > 0 ? `${gs.dailyStreak} day streak` : 'Start a daily streak!');
    setText(doc, 'go-mode', `${gs.isChallenge ? 'Challenge' : gs.currentMode.name} / ${gs.currentLayout.name}`);
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
        const hidden = a.hidden && !unlocked;
        setText(doc, `ach-check-${i}`, unlocked ? '[X]' : '[ ]');
        setText(doc, `ach-name-${i}`, hidden ? '???' : a.name);
        setText(doc, `ach-desc-${i}`, hidden ? 'Hidden achievement' : a.description);
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
    const xp = getXPProgress(gs.totalXP);
    setText(doc, 'stat-xp-level', `LV ${xp.level} - ${xp.badge}`);
    setText(doc, 'stat-xp-total', `${gs.totalXP}`);
    setText(doc, 'stat-streak', gs.dailyStreak > 0 ? `${gs.dailyStreak} days (best: ${gs.bestDailyStreak})` : '0 days');
    setText(doc, 'stat-ach-count', `${gs.achievements.size}/${getAchievements(gs).length}`);
    setText(doc, 'stat-games', `${gs.games}`);
    setText(doc, 'stat-best-score', `${gs.bestScore}`);
    setText(doc, 'stat-best-level', `${gs.bestLevel}`);
    setText(doc, 'stat-correct', `${gs.totalCorrect}`);
    setText(doc, 'stat-accuracy', `${gs.totalCorrect > 0 ? Math.round(gs.totalCorrect / (gs.totalCorrect + gs.totalWrong) * 100) : 0}%`);
    setText(doc, 'stat-best-streak', `${gs.bestStreak}`);
    setText(doc, 'stat-best-combo', `x${gs.maxCombo}`);
    setText(doc, 'stat-perfect', `${gs.perfectGames}`);
    setText(doc, 'stat-panels', `${gs.totalPanelHits}`);
    setText(doc, 'stat-modes', `${gs.modesPlayed.size}/${GAME_MODES.length}`);
    setText(doc, 'stat-layouts', `${gs.layoutsPlayed.size}/${LAYOUTS.length}`);
    setText(doc, 'stat-skins', `${gs.skinsUsed.size}/${PANEL_SKINS.length}`);
    setText(doc, 'stat-challenges', `${gs.challengesPlayed}`);
    setText(doc, 'stat-powerups', `${gs.powerUpsUsed}`);
    setText(doc, 'stat-time', `${Math.floor(gs.totalPlayTime / 3600)}h ${Math.floor((gs.totalPlayTime % 3600) / 60)}m`);
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
    const playerLevel = getPlayerLevel(gs.totalXP);
    for (let i = 0; i < PANEL_SKINS.length; i++) {
      const skin = PANEL_SKINS[i];
      const isSelected = i === gs.selectedSkin;
      const locked = skin.unlockLevel > playerLevel;
      if (locked) {
        setText(doc, `skin-name-${i}`, `🔒 ${skin.name}`);
        setText(doc, `skin-desc-${i}`, `Unlock at XP Level ${skin.unlockLevel}`);
      } else {
        setText(doc, `skin-name-${i}`, `${isSelected ? '> ' : ''}${skin.name}`);
        setText(doc, `skin-desc-${i}`, skin.unlockCondition);
      }
    }
  }

  function updateChallenge() {
    const doc = getDoc(challengeEntity);
    if (!doc) return;
    setText(doc, 'ch-mode', GAME_MODES[gs.challengeMode].name);
    setText(doc, 'ch-layout', LAYOUTS[gs.challengeLayout].name);
    setText(doc, 'ch-diff', ['Easy', 'Medium', 'Hard'][gs.challengeDifficulty]);
    setText(doc, 'ch-code', gs.challengeCode || '------');
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

  function updateTitleProfile() {
    const doc = getDoc(titleEntity);
    if (!doc) return;
    const xp = getXPProgress(gs.totalXP);
    setText(doc, 'profile-level', `LV ${xp.level}`);
    setText(doc, 'profile-badge', xp.badge);
    setText(doc, 'profile-streak', gs.dailyStreak > 0 ? `${gs.dailyStreak} day streak` : 'No streak');
    setText(doc, 'profile-ach', `${gs.achievements.size} achievements`);
  }

  // ─── Button Wiring ──────────────────────────

  function wireButtons() {
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
      tryWire(titleEntity, 'btn-play', () => {
        if (!gs.tutorialSeen) {
          showPanel('tutorial');
          return;
        }
        showPanel('modeselect');
      });
      tryWire(titleEntity, 'btn-challenge', () => { updateChallenge(); showPanel('challenge'); });
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
      tryWire(gameoverEntity, 'btn-replay-last', () => {
        // Replay the last sequence that beat the player
        if (gs.sequence.length === 0) return;
        showToast('Replaying last sequence...');
        panelGroup.visible = true;
        createPanels(gs.currentLayout);
        let idx = 0;
        const seq = gs.currentMode.reverse ? [...gs.sequence].reverse() : gs.sequence;
        const interval = setInterval(() => {
          if (idx > 0) resetPanel(seq[idx - 1]);
          if (idx >= seq.length) {
            clearInterval(interval);
            setTimeout(() => {
              resetAllPanels();
              panelGroup.visible = false;
            }, 500);
            return;
          }
          flashPanel(seq[idx], 0.4);
          idx++;
        }, 500);
      });
      tryWire(gameoverEntity, 'btn-go-title', () => { updateTitleProfile(); showPanel('title'); });

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
      tryWire(settingsEntity, 'btn-theme-prev', () => {
        gs.selectedTheme = (gs.selectedTheme - 1 + ARENA_THEMES.length) % ARENA_THEMES.length;
        applyTheme(gs.selectedTheme);
        updateSettings();
        gs.save();
      });
      tryWire(settingsEntity, 'btn-theme-next', () => {
        gs.selectedTheme = (gs.selectedTheme + 1) % ARENA_THEMES.length;
        applyTheme(gs.selectedTheme);
        updateSettings();
        gs.save();
      });
      tryWire(settingsEntity, 'btn-set-back', () => { showPanel('title'); });

      // Stats
      tryWire(statsEntity, 'btn-stats-back', () => { showPanel('title'); });

      // Help
      tryWire(helpEntity, 'btn-help-back', () => { showPanel('title'); });

      // Skins
      for (let i = 0; i < PANEL_SKINS.length; i++) {
        const idx = i;
        tryWire(skinsEntity, `btn-skin-${i}`, () => {
          const playerLevel = getPlayerLevel(gs.totalXP);
          if (PANEL_SKINS[idx].unlockLevel > playerLevel) {
            showToast(`Locked! Reach XP Level ${PANEL_SKINS[idx].unlockLevel}`);
            return;
          }
          gs.selectedSkin = idx;
          gs.skinsUsed.add(PANEL_SKINS[idx].name);
          updateSkins();
          gs.save();
          showToast(`Skin: ${PANEL_SKINS[idx].name}`);
        });
      }
      tryWire(skinsEntity, 'btn-skins-back', () => { showPanel('title'); });

      // Challenge
      tryWire(challengeEntity, 'btn-ch-mode-prev', () => {
        gs.challengeMode = (gs.challengeMode - 1 + GAME_MODES.length) % GAME_MODES.length;
        updateChallenge();
      });
      tryWire(challengeEntity, 'btn-ch-mode-next', () => {
        gs.challengeMode = (gs.challengeMode + 1) % GAME_MODES.length;
        updateChallenge();
      });
      tryWire(challengeEntity, 'btn-ch-layout-prev', () => {
        gs.challengeLayout = (gs.challengeLayout - 1 + LAYOUTS.length) % LAYOUTS.length;
        updateChallenge();
      });
      tryWire(challengeEntity, 'btn-ch-layout-next', () => {
        gs.challengeLayout = (gs.challengeLayout + 1) % LAYOUTS.length;
        updateChallenge();
      });
      tryWire(challengeEntity, 'btn-ch-diff-prev', () => {
        gs.challengeDifficulty = (gs.challengeDifficulty - 1 + 3) % 3;
        updateChallenge();
      });
      tryWire(challengeEntity, 'btn-ch-diff-next', () => {
        gs.challengeDifficulty = (gs.challengeDifficulty + 1) % 3;
        updateChallenge();
      });
      tryWire(challengeEntity, 'btn-ch-generate', () => {
        const seed = Date.now() ^ (Math.random() * 0xffffffff);
        gs.challengeSeed = seed;
        gs.challengeCode = encodeChallengeCode(seed);
        gs.challengesCreated++;
        updateChallenge();
        showToast(`Code: ${gs.challengeCode}`);
        gs.save();
      });
      tryWire(challengeEntity, 'btn-ch-play', () => {
        if (!gs.challengeCode || gs.challengeCode === '------') {
          showToast('Generate or enter a code first!');
          return;
        }
        gs.challengeSeed = decodeChallengeCode(gs.challengeCode);
        gs.isChallenge = true;
        gs.currentMode = GAME_MODES[gs.challengeMode];
        gs.currentLayout = LAYOUTS[gs.challengeLayout];
        gs.difficulty = gs.challengeDifficulty;
        startCountdown();
      });
      tryWire(challengeEntity, 'btn-ch-back', () => { showPanel('title'); });

      // Power-up slots
      tryWire(puEntity, 'pu-slot-0', () => { if (gs.state === 'input' || gs.state === 'watching') usePowerUp(0); });
      tryWire(puEntity, 'pu-slot-1', () => { if (gs.state === 'input' || gs.state === 'watching') usePowerUp(1); });

      // Tutorial
      tryWire(tutorialEntity, 'btn-tutorial-ok', () => {
        gs.tutorialSeen = true;
        gs.save();
        showPanel('modeselect');
      });
    };
  }

  const doWiring = wireButtons();


  // ─── Input Handling ──────────────────────────

  let lastClickTime = 0;

  function onPointerDown(event: MouseEvent) {
    if (gs.state !== 'input') return;
    if (Date.now() - lastClickTime < 200) return;
    lastClickTime = Date.now();

    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, findCamera());
    const hits = raycaster.intersectObjects(panels.map(p => p.mesh), false);
    if (hits.length > 0) {
      const panelIndex = hits[0].object.userData.panelIndex;
      if (panelIndex !== undefined) {
        handlePanelHit(panelIndex);
      }
    }
  }

  function findCamera(): any {
    let cam: any = null;
    world.scene.traverse((child: any) => {
      if (child.isCamera && !cam) cam = child;
    });
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

    // Power-up keys Q and W
    if (gs.state === 'input' || gs.state === 'watching') {
      if (event.key === 'q' || event.key === 'Q') usePowerUp(0);
      if (event.key === 'w' || event.key === 'W') usePowerUp(1);
    }

    // C for challenge code entry (simple prompt)
    if (event.key === 'c' || event.key === 'C') {
      if (gs.state === 'challenge') {
        const code = prompt('Enter 6-character challenge code:');
        if (code && code.length === 6) {
          gs.challengeCode = code.toUpperCase();
          gs.challengeSeed = decodeChallengeCode(gs.challengeCode);
          updateChallenge();
          showToast(`Code entered: ${gs.challengeCode}`);
        }
      }
    }
  }
  document.addEventListener('keydown', onKeyDown);

  // ─── Game Loop ───────────────────────────────

  let lastTime = performance.now();
  const cameraBasePos = new Vector3(0, 1.6, 0);

  showPanel('title');
  updateTitleProfile();
  toastEntity.object3D.visible = false;

  world.onUpdate(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    doWiring();
    particles.update(dt);

    const time = now / 1000;

    // Animate decorations
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

    // Pedestal ring color matches current skin
    const currentSkinColor = PANEL_SKINS[gs.selectedSkin].colors[0];
    (centerRingMat as MeshBasicMaterial).color.set(currentSkinColor);

    // Panel idle animation
    if (gs.state === 'input' || gs.state === 'watching' || gs.state === 'countdown') {
      for (const panel of panels) {
        const breathe = 0.2 + Math.sin(time * 1.5 + panel.index * 0.5) * 0.08;
        (panel.edgeMesh.material as LineBasicMaterial).opacity = breathe + 0.2;
      }
    }

    // Camera shake
    if (gs.shakeIntensity > 0.001) {
      gs.shakeIntensity *= Math.exp(-gs.shakeDecay * dt);
      const cam = findCamera();
      if (cam && cam.position) {
        cam.position.x = cameraBasePos.x + (Math.random() - 0.5) * gs.shakeIntensity;
        cam.position.y = cameraBasePos.y + (Math.random() - 0.5) * gs.shakeIntensity;
      }
    }

    // Floor reflection pulsing
    floorMat.opacity = 0.12 + Math.sin(time * 0.5) * 0.03;

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

    // Panel flash decay
    if (gs.panelFlashTimer > 0) {
      gs.panelFlashTimer -= dt;
    }

    // Input timeout
    if (gs.state === 'input') {
      gs.inputTimer += dt;
      if (gs.inputTimer > gs.getInputTimeout()) {
        gs.lives--;
        gs.combo = 0;
        gs.streak = 0;
        audio.playWrong();
        gs.shakeIntensity = 0.02;
        gs.shakeDecay = 3.0;
        showToast('Too slow!');
        if (gs.lives <= 0) {
          endGame();
        } else {
          gs.playerIndex = 0;
          gs.inputTimer = 0;
          setTimeout(() => {
            gs.isShowingSequence = true;
            gs.sequenceShowIndex = 0;
            gs.sequenceTimer = 0.5;
            showPanel('watching');
            setText(getDoc(seqEntity), 'seq-text', 'WATCH AGAIN...');
          }, 800);
        }
      }

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
        if (rightGamepad.getButtonDown?.(0)) {
          if (gs.state === 'input') {
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

        if (rightGamepad.getButtonDown?.(4)) {
          if (gs.state === 'input' || gs.state === 'watching') {
            showPanel('pause');
          } else if (gs.state === 'pause') {
            showPanel(gs.isShowingSequence ? 'watching' : 'input');
          }
        }

        // A button for power-up slot 0, B for power-up slot 1
        if (rightGamepad.getButtonDown?.(3)) {
          if (gs.state === 'input' || gs.state === 'watching') usePowerUp(0);
        }
      }
    } catch {}
  });
}

main().catch(console.error);
