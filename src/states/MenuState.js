import { State }          from './State.js';
import { Action }         from '../input/Action.js';
import { Config }         from '../Config.js';
import { DriftParticle }  from '../entities/DriftParticle.js';

export class MenuState extends State {
  #snake  = [];
  #dir    = [1, 0];
  #ticker = 0;

  enter(game) {
    const mid     = Math.floor(Config.GRID / 2);
    this.#snake   = [[mid,mid],[mid-1,mid],[mid-2,mid],[mid-3,mid],[mid-4,mid]];
    this.#dir     = [1, 0];
    this.#ticker  = 0;
    if (!game.drifts.length)
      game.drifts = Array.from({ length: Config.DRIFT_COUNT }, () => new DriftParticle(true));
  }

  update(game) {
    game.drifts.forEach(d => d.update());
    this.#tickDemoSnake();
  }

  render(game, renderer) {
    renderer.clearCanvas();
    renderer.drawGrid();
    renderer.drawDrifts(game.drifts);
    renderer.drawMenuBgSnake(this.#snake);
    renderer.drawMenuOverlay(game);
    renderer.drawCRT();
  }

  onInput(game, action) {
    if (action === Action.CONFIRM) game.startSession();
  }

  #tickDemoSnake() {
    if (++this.#ticker % Config.MENU_SNAKE_STEP_INTERVAL !== 0) return;

    const [hx, hy] = this.#snake[0];
    const candidates = [[1,0],[-1,0],[0,1],[0,-1]].filter(
      d => !(d[0] === -this.#dir[0] && d[1] === -this.#dir[1])
    );

    if (Math.random() < 0.22) {
      // Bias toward centre so the snake stays visible, with noise to avoid loops.
      candidates.sort((a, b) => {
        const dist = ([dx, dy]) => {
          const nx = (hx + dx + Config.GRID) % Config.GRID;
          const ny = (hy + dy + Config.GRID) % Config.GRID;
          return Math.abs(nx - Config.GRID / 2) + Math.abs(ny - Config.GRID / 2);
        };
        return (dist(a) - dist(b)) + (Math.random() - 0.5) * 4;
      });
      this.#dir = candidates[0];
    }

    const nx = (hx + this.#dir[0] + Config.GRID) % Config.GRID;
    const ny = (hy + this.#dir[1] + Config.GRID) % Config.GRID;
    this.#snake.unshift([nx, ny]);
    if (this.#snake.length > Config.MENU_SNAKE_MAX_LEN) this.#snake.pop();
  }
}
