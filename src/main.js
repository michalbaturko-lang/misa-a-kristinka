import { Game } from './engine/Game.js';

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => {
  if (e.target.closest('#game-canvas, #dpad, #action-buttons')) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('gesturestart', (e) => e.preventDefault());

// Start game when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Game());
} else {
  new Game();
}
