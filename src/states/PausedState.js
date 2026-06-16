import { State }  from './State.js';
import { Action } from '../input/Action.js';

export class PausedState extends State {
  render(game, renderer) {
    renderer.clearCanvas();
    renderer.drawGrid();
    renderer.drawDrifts(game.drifts);
    renderer.drawParticles(game.particles);
    renderer.drawFoods(game.foods, game.frame);
    renderer.drawSnake(game.snake, false);
    renderer.drawFloats(game.floats);
    renderer.drawHUD(game);
    renderer.drawPauseOverlay();
    renderer.drawCRT();
  }

  onInput(game, action) {
    if (action === Action.CONFIRM || action === Action.PAUSE)
      game.setState(game.states.playing);
  }
}
