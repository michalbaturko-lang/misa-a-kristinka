import { Game } from './engine/Game.js';

// Prevent default touch behaviors (zoom, scroll)
document.addEventListener('touchmove', (e) => {
  if (e.target.tagName !== 'INPUT') {
    e.preventDefault();
  }
}, { passive: false });

// Prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Request fullscreen on tablets
function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) {
    el.requestFullscreen().catch(() => {});
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  }
}

// Initialize game
async function main() {
  const game = new Game();
  await game.init();

  // Attempt fullscreen on first touch
  let fullscreenRequested = false;
  document.addEventListener('touchstart', () => {
    if (!fullscreenRequested) {
      fullscreenRequested = true;
      requestFullscreen();
    }
  }, { once: true });

  // Handle visibility change (pause when tab hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.running = false;
    } else {
      game.running = true;
      game.lastTime = performance.now();
      game.gameLoop();
    }
  });

  // Expose game to console for debugging
  window.game = game;
}

main().catch(console.error);
