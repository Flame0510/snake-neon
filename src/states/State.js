import { particlePool } from '../entities/Particle.js';
import { floatPool }    from '../entities/FloatingText.js';

/**
 * State pattern — abstract base.
 * Each concrete state encapsulates its own update, render, and input logic.
 * The Game instance is the Context; states call game.setState() to transition.
 */
export class State {
  /** Called once when entering this state. */
  enter(game)            {} // eslint-disable-line no-unused-vars
  /** Called once when leaving this state. */
  exit(game)             {} // eslint-disable-line no-unused-vars
  /** Called every frame while this state is active. */
  update(game, now)      {} // eslint-disable-line no-unused-vars
  /** Called every frame to draw the scene. */
  render(game, renderer) {} // eslint-disable-line no-unused-vars
  /** Called when an Action is dispatched from the InputManager. */
  onInput(game, action)  {} // eslint-disable-line no-unused-vars

  /** Drain particle/float pools, releasing dead objects. Shared by PlayingState and DeadState. */
  _drainPools(game) {
    game.particles = game.particles.filter(p => {
      const alive = p.update();
      if (!alive) particlePool.release(p);
      return alive;
    });
    game.floats = game.floats.filter(f => {
      const alive = f.update();
      if (!alive) floatPool.release(f);
      return alive;
    });
  }
}
