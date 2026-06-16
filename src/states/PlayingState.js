import { State }          from './State.js';
import { Action }         from '../input/Action.js';
import { Config }         from '../Config.js';
import { DIR }            from '../entities/Snake.js';
import { FoodFactory }    from '../entities/Food.js';
import { particlePool }   from '../entities/Particle.js';
import { floatPool }      from '../entities/FloatingText.js';

const ACTION_TO_DIR = new Map([
  [Action.MOVE_UP,    DIR.UP],
  [Action.MOVE_DOWN,  DIR.DOWN],
  [Action.MOVE_LEFT,  DIR.LEFT],
  [Action.MOVE_RIGHT, DIR.RIGHT],
]);

export class PlayingState extends State {
  #lastStep = 0;

  enter(game) {
    this.#lastStep = performance.now();
    // Spawn initial food only on fresh sessions — not on resume from pause.
    if (game.foods.length === 0) {
      for (let i = 0; i < 2; i++) {
        const f = FoodFactory.spawnSafe(game.foods, game.snake);
        if (f) game.foods.push(f);
      }
    }
  }

  update(game, now) {
    game.drifts.forEach(d => d.update());
    game.foods.forEach(f => f.tick());
    game.comboTimer = now - game.lastEatMs;
    game.elapsedMs  = now - game.startTime;

    this.#step(game, now);

    this._drainPools(game);
    if (game.shakeLeft > 0) game.shakeLeft--;
  }

  render(game, renderer) {
    renderer.clearCanvas();
    renderer.drawGrid();
    renderer.drawDrifts(game.drifts);
    renderer.drawBoostBorder(game.boostLeft);
    renderer.drawParticles(game.particles);
    renderer.drawFoods(game.foods, game.frame);
    renderer.drawSnake(game.snake, game.boostLeft > 0);
    renderer.drawFloats(game.floats);
    renderer.drawHUD(game);
    renderer.drawCRT();
  }

  onInput(game, action) {
    const dir = ACTION_TO_DIR.get(action);
    if (dir) {
      game.snake.queueDir(dir);
      return;
    }
    if (action === Action.CONFIRM || action === Action.PAUSE)
      game.setState(game.states.paused);
  }

  // ── Private step logic ──────────────────────────────────────────────────

  #step(game, now) {
    const effectiveSpeed = game.boostLeft > 0
      ? game.speed * Config.BOOST_SPEED_FACTOR
      : game.speed;
    if (now - this.#lastStep < effectiveSpeed) return;
    this.#lastStep = now;

    if (game.boostLeft > 0) game.boostLeft--;

    const moved = game.snake.step();
    if (!moved) { this.#die(game, now); return; }

    game.snake.trackMaxLen();

    const [hx, hy] = game.snake.head;
    const eatenIdx  = game.foods.findIndex(f => f.x === hx && f.y === hy);

    if (eatenIdx !== -1) this.#eatFood(game, eatenIdx, now);
    else                  game.snake.popTail();
  }

  #eatFood(game, idx, now) {
    const food = game.foods.splice(idx, 1)[0];
    const fd   = food.type;

    // Combo: eating within COMBO_WINDOW ms of the last eat extends the chain.
    const chained    = (now - game.lastEatMs) <= Config.COMBO_WINDOW;
    game.combo       = chained ? game.combo + 1 : 1;
    game.lastEatMs   = now;
    game.comboTimer  = 0;

    const mult   = Math.min(game.combo, Config.MAX_COMBO);
    const gained = fd.pts * mult;
    game.score  += gained;

    const [hx, hy] = game.snake.head;
    const cx = hx * Config.CELL + Config.CELL / 2;
    const cy = hy * Config.CELL + Config.CELL / 2;

    for (let i = 0; i < Config.PARTICLES_ON_EAT; i++)
      game.particles.push(particlePool.acquire(cx, cy, fd.glow));

    const label = mult > 1 ? `+${gained} ×${mult}` : `+${gained}`;
    game.floats.push(floatPool.acquire(cx, cy - 10, label, fd.color, 13 + mult * 2));
    if (game.combo >= 2)
      game.floats.push(floatPool.acquire(cx, cy - 32, `COMBO ×${game.combo}!`, '#fff', 12));

    if (fd.id === 'SPEED')       game.boostLeft = Config.BOOST_FRAMES;
    else if (fd.id === 'SHRINK') game.snake.cutTail();

    game.bus.emit('game:food-eaten', { food, gained, combo: game.combo });

    const prevSpeed = game.speed;
    game.speed = Math.max(
      Config.MIN_SPEED_MS,
      Config.INITIAL_SPEED_MS - Math.floor(game.score / Config.SPEED_SCORE_INTERVAL) * Config.SPEED_DECREMENT,
    );
    if (game.speed < prevSpeed)
      game.floats.push(floatPool.acquire(Config.W / 2, Config.H / 2 - 60, 'SPEED UP!', '#ffdd44', 15));

    this.#respawnFood(game);
  }

  #respawnFood(game) {
    const food = FoodFactory.spawnSafe(game.foods, game.snake);
    if (!food) return;
    game.foods.push(food);
    while (game.foods.length > Config.MAX_FOODS) game.foods.shift();
  }

  #die(game, now) {
    game.snake.segments.forEach(([sx, sy]) => {
      for (let i = 0; i < Config.PARTICLES_ON_DIE; i++)
        game.particles.push(
          particlePool.acquire(sx * Config.CELL + Config.CELL / 2, sy * Config.CELL + Config.CELL / 2, '#ff2244')
        );
    });

    game.shakeLeft  = Config.SHAKE_FRAMES;
    game.elapsedMs  = now - game.startTime;

    if (game.score > game.highScore) {
      game.highScore   = game.score;
      game.isNewRecord = true;
      localStorage.setItem(Config.LS_KEY, game.highScore);
    }

    game.bus.emit('game:snake-died', { score: game.score });
    game.setState(game.states.dead);
  }
}
