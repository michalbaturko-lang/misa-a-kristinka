import { clamp } from '../utils/helpers.js';

/**
 * Controls - touch controls optimized for tablet
 * Left side: virtual joystick for movement
 * Right side: drag to look/rotate camera
 * Buttons: jump, ability
 */
export class Controls {
  constructor(player) {
    this.player = player;
    this.active = false;

    // Joystick state
    this.joystickActive = false;
    this.joystickTouchId = null;
    this.joystickStartX = 0;
    this.joystickStartY = 0;
    this.joystickX = 0;
    this.joystickY = 0;

    // Camera drag state
    this.cameraTouchId = null;
    this.cameraLastX = 0;
    this.cameraLastY = 0;

    // DOM elements
    this.joystickZone = document.getElementById('joystick-zone');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickThumb = document.getElementById('joystick-thumb');
    this.jumpBtn = document.getElementById('jump-btn');
    this.abilityBtn = document.getElementById('ability-btn');
    this.touchControls = document.getElementById('touch-controls');

    // Callbacks
    this.onJump = null;
    this.onAbility = null;

    this.setupTouchListeners();
    this.setupKeyboardListeners(); // For desktop testing
  }

  activate() {
    this.active = true;
    this.touchControls.classList.remove('hidden');
    this.touchControls.classList.add('active');
  }

  deactivate() {
    this.active = false;
    this.touchControls.classList.add('hidden');
    this.touchControls.classList.remove('active');
    this.player.moveInput.x = 0;
    this.player.moveInput.z = 0;
  }

  setupTouchListeners() {
    const canvas = document.getElementById('game-canvas');

    // Joystick touch
    this.joystickZone.addEventListener('touchstart', (e) => {
      if (!this.active) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;
      this.joystickActive = true;
      const rect = this.joystickBase.getBoundingClientRect();
      this.joystickStartX = rect.left + rect.width / 2;
      this.joystickStartY = rect.top + rect.height / 2;
      this.updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    // Camera touch (on canvas, right side)
    canvas.addEventListener('touchstart', (e) => {
      if (!this.active) return;
      for (const touch of e.changedTouches) {
        // Only use touches on right 60% of screen for camera
        if (touch.clientX > window.innerWidth * 0.35 && this.cameraTouchId === null) {
          this.cameraTouchId = touch.identifier;
          this.cameraLastX = touch.clientX;
          this.cameraLastY = touch.clientY;
        }
      }
    }, { passive: true });

    // Touch move (global)
    document.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystickTouchId) {
          e.preventDefault();
          this.updateJoystick(touch.clientX, touch.clientY);
        }
        if (touch.identifier === this.cameraTouchId) {
          const dx = touch.clientX - this.cameraLastX;
          const dy = touch.clientY - this.cameraLastY;
          this.cameraLastX = touch.clientX;
          this.cameraLastY = touch.clientY;

          this.player.cameraAngleX += dx * 0.005;
          this.player.cameraAngleY = clamp(
            this.player.cameraAngleY + dy * 0.003,
            -0.2, 0.8
          );
        }
      }
    }, { passive: false });

    // Touch end
    document.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.joystickActive = false;
          this.joystickX = 0;
          this.joystickY = 0;
          this.joystickThumb.style.transform = 'translate(0px, 0px)';
          this.player.moveInput.x = 0;
          this.player.moveInput.z = 0;
        }
        if (touch.identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
        }
      }
    });

    document.addEventListener('touchcancel', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.joystickActive = false;
          this.joystickThumb.style.transform = 'translate(0px, 0px)';
          this.player.moveInput.x = 0;
          this.player.moveInput.z = 0;
        }
        if (touch.identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
        }
      }
    });

    // Jump button
    this.jumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onJump) this.onJump();
    }, { passive: false });

    // Ability button
    this.abilityBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onAbility) this.onAbility();
    }, { passive: false });
  }

  updateJoystick(touchX, touchY) {
    const maxRadius = 40;
    let dx = touchX - this.joystickStartX;
    let dy = touchY - this.joystickStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    this.joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;

    // Normalize to -1 to 1
    this.joystickX = dx / maxRadius;
    this.joystickY = dy / maxRadius;

    // Dead zone
    if (Math.abs(this.joystickX) < 0.15) this.joystickX = 0;
    if (Math.abs(this.joystickY) < 0.15) this.joystickY = 0;

    // Map to movement (forward is negative Z in local space)
    this.player.moveInput.x = this.joystickX;
    this.player.moveInput.z = -this.joystickY;
  }

  setupKeyboardListeners() {
    // For desktop testing
    const keys = {};
    document.addEventListener('keydown', (e) => {
      if (!this.active) return;
      keys[e.code] = true;
      this.updateKeyboardInput(keys);
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.onJump) this.onJump();
      }
      if (e.code === 'KeyE') {
        if (this.onAbility) this.onAbility();
      }
    });
    document.addEventListener('keyup', (e) => {
      keys[e.code] = false;
      this.updateKeyboardInput(keys);
    });

    // Mouse look for desktop testing
    let mouseDown = false;
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('mousedown', (e) => {
      if (!this.active) return;
      mouseDown = true;
      this.cameraLastX = e.clientX;
      this.cameraLastY = e.clientY;
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.active || !mouseDown) return;
      const dx = e.clientX - this.cameraLastX;
      const dy = e.clientY - this.cameraLastY;
      this.cameraLastX = e.clientX;
      this.cameraLastY = e.clientY;
      this.player.cameraAngleX += dx * 0.005;
      this.player.cameraAngleY = clamp(this.player.cameraAngleY + dy * 0.003, -0.2, 0.8);
    });
    document.addEventListener('mouseup', () => { mouseDown = false; });
  }

  updateKeyboardInput(keys) {
    let x = 0, z = 0;
    if (keys['KeyW'] || keys['ArrowUp']) z = 1;
    if (keys['KeyS'] || keys['ArrowDown']) z = -1;
    if (keys['KeyA'] || keys['ArrowLeft']) x = -1;
    if (keys['KeyD'] || keys['ArrowRight']) x = 1;
    this.player.moveInput.x = x;
    this.player.moveInput.z = z;
  }
}
