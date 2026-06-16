/**
 * Observer pattern — decouples event producers from consumers.
 * Returns an unsubscribe function from `on()` for easy cleanup.
 */
export class EventBus {
  #listeners = new Map();

  on(event, handler) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(handler);
    return () => this.#listeners.get(event)?.delete(handler);
  }

  emit(event, payload) {
    this.#listeners.get(event)?.forEach(h => h(payload));
  }

  clear() { this.#listeners.clear(); }
}
