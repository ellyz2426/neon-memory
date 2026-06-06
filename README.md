# Neon Memory VR

A neon-themed 3D Simon Says memory game built with [IWSDK](https://iwsdk.dev) (Immersive Web SDK). Play in VR on Meta Quest or in your browser — same game, same features, full spatial UI.

**[Play Now →](https://ellyz2426.github.io/neon-memory/)**

## Features

### Core Gameplay
- **6 panel layouts** — Quad (4) through Dodecagon (12) panels arranged in a 3D ring
- **8 game modes** — Classic, Speed, Reverse, Rush, Zen, Daily Challenge, Survival, Marathon
- **3 difficulty levels** — Easy, Medium, Hard with different speeds and timeouts
- **Combo scoring system** — Build streaks for multiplied points
- **Challenge mode** — Generate shareable 6-character codes for competitive play

### Progression
- **XP/Level system** — 50 levels from Newbie to NEON GOD
- **89+ achievements** — Including hidden achievements and milestone rewards
- **12 panel skins** — Level-gated unlocks with unique color palettes
- **8 arena themes** — Each with unique ambient audio and visual identity
- **Daily streak tracking** — Consecutive day bonuses with XP rewards
- **Top 20 leaderboard** — Track your best scores across all modes
- **Performance rating** — S through F grades based on accuracy, level, and combo

### Power-Ups
- **Replay** — See the sequence one more time
- **Slow-Mo** — Half speed for 2 rounds
- **Shield** — Block one mistake
- **Hint** — Flash the next expected panel

### Accessibility
- **Unique geometric markers** on each panel (sphere, cube, cone, ring, etc.) for colorblind support
- **Keyboard shortcuts** (1-9 for panels, Q/W for power-ups)

### Technical
- **Dual runtime** — Full VR with XR controllers + browser with mouse/keyboard
- **20 PanelUI spatial UI templates** — Zero HTML DOM, all game UI works in XR
- **Theme-specific procedural audio** — Unique drone frequencies and arpeggiator scales per arena
- **Procedural sound system** — 12 harmonic tones, 15+ sound effects, ambient drone
- **Particle effects** — Hit bursts, combo rings, wave ripples, firework celebrations
- **Tutorial system** — Guided onboarding for first-time players
- **Post-game replay** — Watch the sequence that beat you

## Controls

| Action | Browser | VR |
|--------|---------|-----|
| Select panel | Click / 1-9 keys | Trigger |
| Pause | ESC | B button |
| Power-up 1 | Q | A button |
| Power-up 2 | W | — |
| Rematch | R | — |

## Development

Built with IWSDK 0.4.1 on Node.js 20.19+.

```bash
npm install
npm run dev     # Start dev server
npm run build   # Production build
```

## Tech Stack

- [IWSDK](https://iwsdk.dev) — Immersive Web SDK (WebXR framework)
- [@pmndrs/uikit](https://github.com/pmndrs/uikit) — Spatial UI via PanelUI
- [Three.js](https://threejs.org/) — 3D rendering (via @iwsdk/core)
- Web Audio API — Procedural sound synthesis
- TypeScript + Vite

## License

MIT
