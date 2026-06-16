/**
 * Object Pool pattern — reuses instances to avoid GC pressure during
 * high-frequency allocations (particle bursts, floating text).
 *
 * @template T
 */
export class ObjectPool {
  #pool     = [];
  #factory;
  #onAcquire;
  #onRelease;

  /**
   * @param {{ factory: () => T, onAcquire: (obj: T, ...args) => void, onRelease?: (obj: T) => void, prewarm?: number }} opts
   */
  constructor({ factory, onAcquire, onRelease = () => {}, prewarm = 0 }) {
    this.#factory   = factory;
    this.#onAcquire = onAcquire;
    this.#onRelease = onRelease;
    for (let i = 0; i < prewarm; i++) this.#pool.push(factory());
  }

  acquire(...args) {
    const obj = this.#pool.length ? this.#pool.pop() : this.#factory();
    this.#onAcquire(obj, ...args);
    return obj;
  }

  release(obj) {
    this.#onRelease(obj);
    this.#pool.push(obj);
  }

  get poolSize() { return this.#pool.length; }
}
