const CACHE = 'snake-neon-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './src/main.js',
  './src/Game.js',
  './src/Config.js',
  './src/audio/AudioManager.js',
  './src/core/EventBus.js',
  './src/core/ObjectPool.js',
  './src/entities/DriftParticle.js',
  './src/entities/FloatingText.js',
  './src/entities/Food.js',
  './src/entities/Particle.js',
  './src/entities/Snake.js',
  './src/input/Action.js',
  './src/input/InputManager.js',
  './src/rendering/Renderer.js',
  './src/states/DeadState.js',
  './src/states/MenuState.js',
  './src/states/PausedState.js',
  './src/states/PlayingState.js',
  './src/states/State.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached ?? fetch(e.request))
  );
});
