import { Action } from './Action.js';

const KEY_MAP = new Map([
  ['ArrowUp',    Action.MOVE_UP],
  ['ArrowDown',  Action.MOVE_DOWN],
  ['ArrowLeft',  Action.MOVE_LEFT],
  ['ArrowRight', Action.MOVE_RIGHT],
  ['w', Action.MOVE_UP],    ['W', Action.MOVE_UP],
  ['s', Action.MOVE_DOWN],  ['S', Action.MOVE_DOWN],
  ['a', Action.MOVE_LEFT],  ['A', Action.MOVE_LEFT],
  ['d', Action.MOVE_RIGHT], ['D', Action.MOVE_RIGHT],
  [' ',     Action.CONFIRM],
  ['Enter', Action.CONFIRM],
  ['p', Action.PAUSE], ['P', Action.PAUSE],
]);

const PREVENT_DEFAULT_KEYS = new Set([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/**
 * Translates raw DOM events into Action objects and emits them on the bus.
 * Game states subscribe to 'input:action' and respond without knowing
 * anything about keyboards or touch screens.
 */
export class InputManager {
  #bus;
  #boundKeydown;

  constructor(bus) {
    this.#bus          = bus;
    this.#boundKeydown = this.#onKeydown.bind(this);
    document.addEventListener('keydown', this.#boundKeydown);
  }

  #onKeydown(e) {
    if (PREVENT_DEFAULT_KEYS.has(e.key)) e.preventDefault();
    const action = KEY_MAP.get(e.key);
    if (action) this.#bus.emit('input:action', action);
  }

  bindTouch(canvas) {
    let startX = 0, startY = 0;
    canvas.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });

    canvas.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.hypot(dx, dy) < 12) {
        this.#bus.emit('input:action', Action.CONFIRM);
        return;
      }
      const action = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? Action.MOVE_RIGHT : Action.MOVE_LEFT)
        : (dy > 0 ? Action.MOVE_DOWN  : Action.MOVE_UP);
      this.#bus.emit('input:action', action);
      e.preventDefault();
    }, { passive: false });
  }

  destroy() {
    document.removeEventListener('keydown', this.#boundKeydown);
  }
}
