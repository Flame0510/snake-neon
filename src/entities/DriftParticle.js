import { Config } from '../Config.js';

/** Slow-drifting ambient background particles — purely decorative. */
export class DriftParticle {
  constructor(init = false) { this.#reset(init); }

  #reset(init = false) {
    this.x     = Math.random() * Config.W;
    this.y     = init ? Math.random() * Config.H : -4;
    this.vx    = (Math.random() - 0.5) * 0.18;
    this.vy    = Math.random() * 0.35 + 0.1;
    this.r     = Math.random() * 1.4 + 0.3;
    this.alpha = Math.random() * 0.1 + 0.02;
    this.color = Math.random() < 0.6 ? '#00ff88' : '#22aaff';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y > Config.H + 4) this.#reset();
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
