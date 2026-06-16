import { ObjectPool } from '../core/ObjectPool.js';

export class FloatingText {
  constructor() {
    this.x = this.y = this.vy = this.life = this.size = 0;
    this.text = ''; this.color = '';
  }

  init(x, y, text, color, size = 14) {
    this.x    = x;     this.y    = y;
    this.text = text;  this.color = color;
    this.size = size;
    this.life = 1;
    this.vy   = -1.8;
  }

  /** @returns {boolean} true while still alive */
  update() {
    this.y   += this.vy;
    this.vy  *= 0.94;
    this.life -= 0.022;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha  = Math.max(0, this.life * this.life);
    ctx.font         = `bold ${this.size}px "Courier New"`;
    ctx.fillStyle    = this.color;
    ctx.shadowColor  = this.color;
    ctx.shadowBlur   = 10;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export const floatPool = new ObjectPool({
  factory:   () => new FloatingText(),
  onAcquire: (f, x, y, text, color, size) => f.init(x, y, text, color, size),
  prewarm:   20,
});
