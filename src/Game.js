import { Config }        from './Config.js';
import { EventBus }      from './core/EventBus.js';
import { Action }        from './input/Action.js';
import { InputManager }  from './input/InputManager.js';
import { AudioManager }  from './audio/AudioManager.js';
import { Snake }         from './entities/Snake.js';
import { DriftParticle } from './entities/DriftParticle.js';
import { Renderer }      from './rendering/Renderer.js';
import { MenuState }     from './states/MenuState.js';
import { PlayingState }  from './states/PlayingState.js';
import { PausedState }   from './states/PausedState.js';
import { DeadState }     from './states/DeadState.js';

/**
 * Game — the State pattern Context.
 *
 * Owns all session-scoped data that states read and mutate.
 * Owns state instances (created once, reused across sessions).
 * Drives the main loop and delegates update/render to the current state.
 */
export class Game {
  // Infrastructure (permanent)
  bus;
  renderer;

  // All state instances — instantiated once, reused.
  states = {};

  // ── Session data (reset by startSession) ──────────────────────────────
  snake;
  foods     = [];
  particles = [];
  floats    = [];
  drifts    = [];

  score       = 0;
  highScore   = 0;
  speed       = Config.INITIAL_SPEED_MS;
  boostLeft   = 0;
  combo       = 0;
  comboTimer  = 0;  // ms elapsed since last eat (used by renderer for combo bar ratio)
  lastEatMs   = 0;  // timestamp of last eat, for ms-based combo window
  startTime   = 0;
  elapsedMs   = 0;
  isNewRecord = false;
  shakeLeft   = 0;
  frame       = 0;

  // ── Private ───────────────────────────────────────────────────────────
  #currentState = null;
  #pauseBtn     = null;

  constructor(canvas) {
    this.bus      = new EventBus();
    this.renderer = new Renderer(canvas);

    const input = new InputManager(this.bus);
    input.bindTouch();

    AudioManager.getInstance().subscribe(this.bus);

    this.snake      = new Snake();
    this.highScore  = +localStorage.getItem(Config.LS_KEY)
                    || +localStorage.getItem(Config.LS_KEY_LEGACY)
                    || 0;
    this.drifts     = Array.from({ length: Config.DRIFT_COUNT }, () => new DriftParticle(true));

    this.states = {
      menu:    new MenuState(),
      playing: new PlayingState(),
      paused:  new PausedState(),
      dead:    new DeadState(),
    };

    this.bus.on('input:action', action => this.#currentState?.onInput(this, action));

    // Floating pause button — visible only during play/pause, wired to the bus.
    this.#pauseBtn = document.getElementById('btn-pause');
    this.#pauseBtn?.addEventListener('pointerdown', e => {
      e.preventDefault();
      this.bus.emit('input:action', Action.PAUSE);
    });

    this.setState(this.states.menu);
    requestAnimationFrame(t => this.#loop(t));
  }

  /** Transition to a new state, calling exit/enter hooks. */
  setState(newState) {
    this.#currentState?.exit(this);
    this.#currentState = newState;
    newState.enter(this);
    this.#updatePauseBtn();
  }

  #updatePauseBtn() {
    if (!this.#pauseBtn) return;
    const playing = this.#currentState === this.states.playing;
    const paused  = this.#currentState === this.states.paused;
    this.#pauseBtn.hidden       = !playing && !paused;
    this.#pauseBtn.innerHTML    = paused ? '▶' : '<span class="icon-pause"></span>';
    this.#pauseBtn.setAttribute('aria-label', paused ? 'Riprendi' : 'Pausa');
  }

  /** Reset all session state and transition to PlayingState. */
  startSession() {
    this.snake.reset();
    this.foods      = [];
    this.particles  = [];
    this.floats     = [];
    this.score      = 0;
    this.speed      = Config.INITIAL_SPEED_MS;
    this.boostLeft  = 0;
    this.combo      = 0;
    this.comboTimer = 0;
    this.lastEatMs  = 0;
    this.startTime  = performance.now();
    this.elapsedMs  = 0;
    this.isNewRecord = false;
    this.shakeLeft  = 0;
    // PlayingState.enter() handles initial food spawn.
    this.setState(this.states.playing);
  }

  // ── Main loop ──────────────────────────────────────────────────────────

  #loop(now) {
    requestAnimationFrame(t => this.#loop(t));
    this.frame++;
    this.#currentState.update(this, now);

    // Screen shake is a rendering concern: apply the transform around
    // the entire render call so states don't need to know about it.
    const ctx = this.renderer.ctx;
    ctx.save();
    if (this.shakeLeft > 0) {
      const amp = Config.SHAKE_AMPLITUDE * (this.shakeLeft / Config.SHAKE_FRAMES);
      ctx.translate((Math.random() - 0.5) * amp * 2, (Math.random() - 0.5) * amp * 2);
    }
    this.#currentState.render(this, this.renderer);
    ctx.restore();
  }
}
