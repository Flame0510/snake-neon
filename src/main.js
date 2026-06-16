import { Game } from './Game.js';

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  new Game(canvas);
});
