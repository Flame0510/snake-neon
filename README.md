# Snake Neon 🐍

**Live:** https://snake.micheletornello.com

Classic Snake with a neon arcade aesthetic — built with vanilla JavaScript ES6 modules and Canvas 2D. Zero dependencies, no build step required.

## Play

```bash
npx serve -p 4500 .
```

Then open [http://localhost:4500](http://localhost:4500).

## Controls

| Input | Action |
|---|---|
| `↑ ↓ ← →` / `WASD` | Move |
| `Space` / `Enter` | Start / Confirm |
| `P` / `Space` | Pause |
| Swipe | Move (touch) |
| Tap | Start / Confirm (touch) |

## Food types

| Food | Points | Effect |
|---|---|---|
| 🟢 Normal | +1 | Snake grows |
| 🟡 Bonus | +5 | Snake grows |
| 🔵 Speed ⚡ | +2 | Temporary speed boost |
| 🟣 Shrink ✂ | +3 | Cuts tail by ⅓ |

Eat in quick succession to build a **combo multiplier** (up to ×5).

## Architecture

| Pattern | Where |
|---|---|
| State | `Game` (Context) + `MenuState`, `PlayingState`, `PausedState`, `DeadState` |
| Observer | `EventBus` — decouples audio, input, and game logic |
| Command | `Action` — typed input objects instead of raw strings |
| Factory | `FoodFactory` — food spawning and type selection |
| Object Pool | `particlePool`, `floatPool` — reuse particle/text objects to avoid GC pressure |
| Singleton | `AudioManager` — one `AudioContext` per page |

```
src/
├── Config.js            # All tuning constants (frozen)
├── Game.js              # State pattern Context, main loop
├── main.js              # Entry point
├── audio/
│   └── AudioManager.js  # Procedural Web Audio, pure bus observer
├── core/
│   ├── EventBus.js      # Pub/sub with unsubscribe
│   └── ObjectPool.js    # Generic prewarm pool
├── entities/
│   ├── Snake.js         # Movement, direction buffer, collision
│   ├── Food.js          # Food types + FoodFactory
│   ├── Particle.js      # Burst particles (pooled)
│   ├── FloatingText.js  # Score popups (pooled)
│   └── DriftParticle.js # Ambient background particles
├── input/
│   ├── Action.js        # Command objects
│   └── InputManager.js  # Keyboard + touch → Actions → bus
├── rendering/
│   └── Renderer.js      # All Canvas 2D drawing, zero game logic
└── states/
    ├── State.js         # Abstract base with shared _drainPools()
    ├── MenuState.js
    ├── PlayingState.js
    ├── PausedState.js
    └── DeadState.js
```

## License

MIT
