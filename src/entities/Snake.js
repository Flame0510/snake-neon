import { Config } from '../Config.js';

export const DIR = Object.freeze({
  UP:    [ 0, -1],
  DOWN:  [ 0,  1],
  LEFT:  [-1,  0],
  RIGHT: [ 1,  0],
});

export class Snake {
  #segments = [];
  #dir      = DIR.RIGHT;
  #dirQueue = [];   // buffered direction changes (max 2), consumed one per step
  #maxLen   = 0;

  reset() {
    const mid       = Math.floor(Config.GRID / 2);
    this.#segments  = [[mid, mid], [mid - 1, mid], [mid - 2, mid]];
    this.#dir       = DIR.RIGHT;
    this.#dirQueue  = [];
    this.#maxLen    = Config.INITIAL_SNAKE_LEN;
  }

  /**
   * Queues a direction change, ignoring 180° reversals against the last queued dir.
   * Holds up to 2 pending inputs so rapid double-taps aren't silently dropped.
   * @param {[number, number]} d
   */
  queueDir(d) {
    const last = this.#dirQueue.length
      ? this.#dirQueue[this.#dirQueue.length - 1]
      : this.#dir;
    if (d[0] === -last[0] && d[1] === -last[1]) return; // ignore 180°
    if (this.#dirQueue.length < 2) this.#dirQueue.push(d);
  }

  /**
   * Advances the snake by one cell.
   * @returns {boolean} false if the new head collides with the body.
   */
  step() {
    if (this.#dirQueue.length) this.#dir = this.#dirQueue.shift();
    const [hx, hy] = this.#segments[0];
    const nx = (hx + this.#dir[0] + Config.GRID) % Config.GRID;
    const ny = (hy + this.#dir[1] + Config.GRID) % Config.GRID;

    // Skip the last segment: it moves away this tick, so no collision possible.
    for (let i = 1; i < this.#segments.length - 1; i++) {
      if (this.#segments[i][0] === nx && this.#segments[i][1] === ny) return false;
    }

    this.#segments.unshift([nx, ny]);
    return true;
  }

  /** Remove the tail (called when the snake does NOT eat). */
  popTail() { this.#segments.pop(); }

  /** Shorten the snake by a fraction of its current length, keeping at least INITIAL_SNAKE_LEN segments. */
  cutTail(fraction = 1 / 3) {
    const cut    = Math.max(1, Math.floor(this.#segments.length * fraction));
    const newLen = Math.max(Config.INITIAL_SNAKE_LEN, this.#segments.length - cut);
    this.#segments.splice(newLen);
  }

  /** Track the peak length seen this session. */
  trackMaxLen() {
    if (this.#segments.length > this.#maxLen) this.#maxLen = this.#segments.length;
  }

  occupies(x, y) {
    return this.#segments.some(([sx, sy]) => sx === x && sy === y);
  }

  get segments()  { return this.#segments; }
  get head()      { return this.#segments[0]; }
  get length()    { return this.#segments.length; }
  get dir()       { return this.#dir; }
  get maxLength() { return this.#maxLen; }
}
