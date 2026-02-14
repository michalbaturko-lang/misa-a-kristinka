import { DIRECTIONS } from '../utils/constants.js';

/**
 * Controls - D-pad (touch) + WASD/Arrows (keyboard).
 * Returns movement direction and action button state.
 */
export class Controls {
  constructor() {
    this.moveX = 0;
    this.moveY = 0;
    this.direction = DIRECTIONS.DOWN;
    this.interact = false;
    this.jump = false;
    this.interactJustPressed = false;
    this.jumpJustPressed = false;

    // Keyboard state
    this.keys = {};
    this._prevInteract = false;
    this._prevJump = false;

    // D-pad touch state
    this.dpadActive = false;
    this.dpadTouchId = null;
    this.dpadDir = null;

    // Touch buttons
    this.touchInteract = false;
    this.touchJump = false;

    this.isTouchDevice = 'ontouchstart' in window;

    this.setupKeyboard();
    if (this.isTouchDevice) {
      this.setupTouchUI();
    }
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
          e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setupTouchUI() {
    // Show touch controls
    const dpad = document.getElementById('dpad');
    const actions = document.getElementById('action-buttons');
    if (dpad) dpad.style.display = 'flex';
    if (actions) actions.style.display = 'flex';

    // D-pad buttons
    const dirs = [
      { id: 'dpad-up', dir: DIRECTIONS.UP, mx: 0, my: -1 },
      { id: 'dpad-down', dir: DIRECTIONS.DOWN, mx: 0, my: 1 },
      { id: 'dpad-left', dir: DIRECTIONS.LEFT, mx: -1, my: 0 },
      { id: 'dpad-right', dir: DIRECTIONS.RIGHT, mx: 1, my: 0 },
    ];

    for (const d of dirs) {
      const el = document.getElementById(d.id);
      if (!el) continue;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.dpadDir = d;
        this.dpadActive = true;
        el.classList.add('active');
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        el.classList.remove('active');
        if (this.dpadDir === d) {
          this.dpadDir = null;
          this.dpadActive = false;
        }
      });
      el.addEventListener('touchcancel', () => {
        el.classList.remove('active');
        if (this.dpadDir === d) {
          this.dpadDir = null;
          this.dpadActive = false;
        }
      });
    }

    // Action buttons
    const btnInteract = document.getElementById('btn-interact');
    const btnJump = document.getElementById('btn-jump');

    if (btnInteract) {
      btnInteract.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchInteract = true;
        btnInteract.classList.add('active');
      });
      btnInteract.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.touchInteract = false;
        btnInteract.classList.remove('active');
      });
    }

    if (btnJump) {
      btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchJump = true;
        btnJump.classList.add('active');
      });
      btnJump.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.touchJump = false;
        btnJump.classList.remove('active');
      });
    }
  }

  update() {
    let mx = 0, my = 0;

    // Keyboard input
    if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;

    // D-pad input
    if (this.dpadDir) {
      mx = this.dpadDir.mx;
      my = this.dpadDir.my;
    }

    this.moveX = mx;
    this.moveY = my;

    // Direction
    if (mx !== 0 || my !== 0) {
      if (Math.abs(my) >= Math.abs(mx)) {
        this.direction = my > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
      } else {
        this.direction = mx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
      }
    }

    // Interact
    const interact = this.keys['KeyE'] || this.keys['Enter'] || this.touchInteract;
    this.interactJustPressed = interact && !this._prevInteract;
    this.interact = interact;
    this._prevInteract = interact;

    // Jump
    const jump = this.keys['Space'] || this.touchJump;
    this.jumpJustPressed = jump && !this._prevJump;
    this.jump = jump;
    this._prevJump = jump;
  }

  isMoving() {
    return this.moveX !== 0 || this.moveY !== 0;
  }

  destroy() {
    // Cleanup if needed
  }
}
