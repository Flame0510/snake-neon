/**
 * Singleton pattern — one AudioContext for the lifetime of the page.
 * Subscribes to the EventBus so game logic never calls audio directly:
 * the audio layer is a pure Observer of game events.
 */
export class AudioManager {
  static #instance = null;
  #ctx = null;

  static getInstance() {
    AudioManager.#instance ??= new AudioManager();
    return AudioManager.#instance;
  }

  #getCtx() {
    this.#ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    return this.#ctx;
  }

  tone(f1, f2, dur, type = 'sine', vol = 0.28) {
    try {
      const ctx  = this.#getCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(f1, ctx.currentTime);
      if (f2 !== f1)
        osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + dur);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.01);
    } catch (_) { /* AudioContext not available */ }
  }

  /** Wire this manager to the game event bus. Call once at startup. */
  subscribe(bus) {
    bus.on('game:food-eaten', ({ food, combo }) => {
      const id = food.type.id;
      const b  = 440 + (combo - 1) * 80;
      if (id === 'NORMAL') {
        this.tone(b, b * 2, 0.1);
      } else if (id === 'BONUS') {
        const f = 660 + (combo - 1) * 100;
        this.tone(f, f * 2, 0.14, 'sine', 0.3);
        setTimeout(() => this.tone(f * 1.5, f * 3, 0.11, 'sine', 0.22), 75);
      } else if (id === 'SPEED') {
        this.tone(330, 990, 0.2, 'triangle', 0.3);
      } else if (id === 'SHRINK') {
        this.tone(880, 440, 0.2, 'sine', 0.3);
        setTimeout(() => this.tone(440, 220, 0.14, 'sine', 0.2), 100);
      }
      if (combo >= 2) {
        const comboFreqs = [0, 0, 523, 659, 784, 1047];
        const n = Math.min(combo, 5);
        this.tone(comboFreqs[n], comboFreqs[n] * 1.5, 0.14, 'sine', 0.33);
      }
    });

    bus.on('game:snake-died', () => {
      this.tone(220, 55, 0.6, 'sawtooth', 0.4);
    });
  }
}
