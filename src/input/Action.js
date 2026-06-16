/**
 * Command pattern — wraps user intent as a typed object,
 * decoupling input devices (keyboard, touch) from game logic.
 */
export class Action {
  static MOVE_UP    = new Action('MOVE_UP');
  static MOVE_DOWN  = new Action('MOVE_DOWN');
  static MOVE_LEFT  = new Action('MOVE_LEFT');
  static MOVE_RIGHT = new Action('MOVE_RIGHT');
  static CONFIRM    = new Action('CONFIRM');
  static PAUSE      = new Action('PAUSE');

  #name;
  constructor(name) { this.#name = name; }
  get name()  { return this.#name; }
  toString()  { return `Action(${this.#name})`; }
}
