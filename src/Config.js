export const Config = Object.freeze({
  GRID: 20,
  CELL: 28,
  W:    20 * 28,
  H:    20 * 28,

  INITIAL_SPEED_MS:     145,
  MIN_SPEED_MS:          50,
  SPEED_DECREMENT:        9,
  SPEED_SCORE_INTERVAL:   6,

  BOOST_FRAMES:        35,
  BOOST_SPEED_FACTOR:  0.48,

  COMBO_WINDOW:   3000,  // ms between eats to sustain a combo
  MAX_COMBO:        5,

  MAX_FOODS:        3,
  INITIAL_SNAKE_LEN: 3,

  PARTICLES_ON_EAT: 14,
  PARTICLES_ON_DIE:  6,

  // Shake: short and subtle — felt but not nauseating
  SHAKE_FRAMES:     8,
  SHAKE_AMPLITUDE:  3,   // max px offset, decays linearly with remaining frames

  MENU_SNAKE_STEP_INTERVAL: 9,   // frames between menu-snake moves
  MENU_SNAKE_MAX_LEN:       14,

  DRIFT_COUNT: 40,

  LS_KEY:        'snakeNeonHS2',
  LS_KEY_LEGACY: 'snakeNeonHS',
});
