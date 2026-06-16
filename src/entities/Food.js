import { Config } from '../Config.js';

export const FoodType = Object.freeze({
  NORMAL: { id: 'NORMAL', pts: 1, color: '#00ff88', glow: '#00ff88', label: null,  shape: 'circle'  },
  BONUS:  { id: 'BONUS',  pts: 5, color: '#ffd700', glow: '#ffbb00', label: '×5',  shape: 'circle'  },
  SPEED:  { id: 'SPEED',  pts: 2, color: '#22aaff', glow: '#0088ff', label: '⚡',  shape: 'circle'  },
  SHRINK: { id: 'SHRINK', pts: 3, color: '#cc44ff', glow: '#aa22ff', label: '✂',   shape: 'diamond' },
});

// Cumulative probability thresholds — order matters.
const TYPE_THRESHOLDS = [
  [FoodType.NORMAL, 0.55],
  [FoodType.BONUS,  0.74],
  [FoodType.SPEED,  0.89],
  [FoodType.SHRINK, 1.00],
];

export class Food {
  constructor(x, y, type) {
    this.x    = x;
    this.y    = y;
    this.type = type;
    this.age  = 0;
  }
  tick() { this.age++; }
}

/**
 * Factory pattern — centralises Food creation and random-type selection.
 * Callers never construct Food directly or know about the probability table.
 */
export class FoodFactory {
  /** Spawn a food item at a cell not already occupied. Returns null if no room. */
  static spawnSafe(existingFoods, snake) {
    const blocked = new Set([
      ...existingFoods.map(f => `${f.x},${f.y}`),
    ]);
    let x, y, tries = 0;
    do {
      x = Math.floor(Math.random() * Config.GRID);
      y = Math.floor(Math.random() * Config.GRID);
      if (++tries > 500) return null;
    } while (blocked.has(`${x},${y}`) || snake.occupies(x, y));

    return new Food(x, y, FoodFactory.#pickType());
  }

  static #pickType() {
    const r = Math.random();
    for (const [type, threshold] of TYPE_THRESHOLDS)
      if (r < threshold) return type;
    return FoodType.NORMAL;
  }
}
