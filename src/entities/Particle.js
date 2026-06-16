import { ObjectPool } from '../core/ObjectPool.js';

export class Particle {
  constructor() {
    this.x = this.y = this.vx = this.vy = this.r = this.life = 0;
    this.color = '';
  }

  init(x, y, color, speed = 9) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = Math.random() * speed + 2;
    this.x     = x;       this.y     = y;
    this.vx    = Math.cos(angle) * spd;
    this.vy    = Math.sin(angle) * spd;
    this.life  = 1;
    this.color = color;
    this.r     = Math.random() * 3 + 1;
  }

  /** @returns {boolean} true while still alive */
  update() {
    this.x   += this.vx;  this.y   += this.vy;
    this.vx  *= 0.87;     this.vy  *= 0.87;
    this.life -= 0.032;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export const particlePool = new ObjectPool({
  factory:   () => new Particle(),
  onAcquire: (p, x, y, color, speed) => p.init(x, y, color, speed),
  prewarm:   80,
});
