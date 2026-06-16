import { State }  from './State.js';
import { Action } from '../input/Action.js';

export class DeadState extends State {
  update(game) {
    // Keep draining any residual particle/float animations.
    this._drainPools(game);
    if (game.shakeLeft > 0) game.shakeLeft--;
  }

  render(game, renderer) {
    renderer.clearCanvas();
    renderer.drawGrid();
    renderer.drawDrifts(game.drifts);
    renderer.drawParticles(game.particles);
    renderer.drawGameOverOverlay(game);
    renderer.drawCRT();
  }

  onInput(game, action) {
    if (action === Action.CONFIRM) game.startSession();
  }
}
