# Neon Memory VR

A holodeck-style 3D Simon Says memory game built with IWSDK 0.4.1.

## Gameplay

A ring of neon panels surrounds you. Watch them light up in sequence, then repeat the pattern by clicking/pointing at the panels. Each round adds one more step to the sequence. How far can you go?

## Features

- **6 Panel Layouts:** Quad (4), Pentagon (5), Hexagon (6), Octagon (8), Decagon (10), Dodecagon (12)
- **8 Game Modes:** Classic, Speed, Reverse, Rush (60s), Zen, Daily Challenge, Survival, Marathon
- **3 Difficulty Levels:** Easy, Medium, Hard — affecting playback speed and input timeout
- **8 Panel Skins:** Neon Classic, Solar Flare, Frost Core, Toxic Pulse, Void Purple, Chrome, Rainbow, Midnight
- **5 Arena Themes:** Neon Holodeck, Crimson Arcade, Toxic Neon, Ultra Violet, Solar Blaze
- **40 Achievements** with localStorage persistence
- **Top 20 Leaderboard** per-game history
- **Career Statistics:** games, scores, accuracy, streaks, play time
- **Combo System:** consecutive correct hits build multiplier
- **Procedural Audio:** distinct musical tone per panel, 15+ SFX, ambient synthwave drone
- **Particle Effects:** burst on panel hit, ring on combo, celebration effects
- **Dual Runtime:** VR (XR controller laser pointer + trigger) and browser (mouse click + number keys)
- **16 PanelUI Templates** — zero HTML DOM overlays

## Controls

### Browser
- **Click** panels to select
- **1-9 keys** for quick panel select
- **ESC** to pause
- **R** to rematch (game over screen)

### VR
- **Right trigger** to select pointed panel
- **B button** to pause
- **Laser pointer** for menu interaction

## Tech Stack

- IWSDK 0.4.1 (WebXR framework)
- TypeScript + Vite
- PanelUI spatial UI system
- Web Audio API (procedural)

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
```
