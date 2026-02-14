import { clamp } from '../utils/helpers.js';

/**
 * Controls - enhanced touch controls
 * Bigger joystick zone, visual feedback, camera damping, button feedback
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

    // Smoothed movement input
    this.smoothMoveX = 0;
    this.smoothMoveZ = 0;

    // Camera drag state
    this.cameraTouchId = null;
    this.cameraLastX = 0;
    this.cameraLastY = 0;
    this.cameraDragDeltaX = 0;
    this.cameraDragDeltaY = 0;

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
    this.setupKeyboardListeners();
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
    this.smoothMoveX = 0;
    this.smoothMoveZ = 0;
  }

  setupTouchListeners() {
    const canvas = document.getElementById('game-canvas');

    // Joystick touch - dynamic positioning where user touches
    this.joystickZone.addEventListener('touchstart', (e) => {
      if (!this.active) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;
      this.joystickActive = true;

      // Move joystick base to touch point
      const zoneRect = this.joystickZone.getBoundingClientRect();
      const localX = touch.clientX - zoneRect.left;
      const localY = touch.clientY - zoneRect.top;
      this.joystickBase.style.left = (localX - 60) + 'px';
      this.joystickBase.style.bottom = 'auto';
      this.joystickBase.style.top = (localY - 60) + 'px';

      this.joystickStartX = touch.clientX;
      this.joystickStartY = touch.clientY;

      // Visual feedback
      this.joystickBase.classList.add('active');
      this.joystickThumb.classList.add('active');
    }, { passive: false });

    // Camera touch (right side)
    canvas.addEventListener('touchstart', (e) => {
      if (!this.active) return;
      for (const touch of e.changedTouches) {
        if (touch.clientX > window.innerWidth * 0.35 && this.cameraTouchId === null) {
          this.cameraTouchId = touch.identifier;
          this.cameraLastX = touch.clientX;
          this.cameraLastY = touch.clientY;
        }
      }
    }, { passive: true });

    // Touch move
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

          // Accumulate camera drag delta for smoothing
          this.cameraDragDeltaX += dx * 0.004;
          this.cameraDragDeltaY += dy * 0.002;
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
          this.joystickBase.classList.remove('active');
          this.joystickThumb.classList.remove('active');
          // Reset base position
          this.joystickBase.style.left = '10px';
          this.joystickBase.style.bottom = '10px';
          this.joystickBase.style.top = 'auto';
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
          this.joystickBase.classList.remove('active');
          this.joystickThumb.classList.remove('active');
          this.joystickBase.style.left = '10px';
          this.joystickBase.style.bottom = '10px';
          this.joystickBase.style.top = 'auto';
          this.player.moveInput.x = 0;
          this.player.moveInput.z = 0;
        }
        if (touch.identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
        }
      }
    });

    // Jump button - immediate with visual feedback
    this.jumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.jumpBtn.classList.add('pressed');
      if (this.onJump) this.onJump();
    }, { passive: false });
    this.jumpBtn.addEventListener('touchend', () => {
      this.jumpBtn.classList.remove('pressed');
    });

    // Ability button
    this.abilityBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.abilityBtn.classList.add('pressed');
      if (this.onAbility) this.onAbility();
    }, { passive: false });
    this.abilityBtn.addEventListener('touchend', () => {
      this.abilityBtn.classList.remove('pressed');
    });
  }

  updateJoystick(touchX, touchY) {
    const maxRadius = 50; // Larger radius for more control
    let dx = touchX - this.joystickStartX;
    let dy = touchY - this.joystickStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    this.joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;

    this.joystickX = dx / maxRadius;
    this.joystickY = dy / maxRadius;

    // Dead zone
    if (Math.abs(this.joystickX) < 0.12) this.joystickX = 0;
    if (Math.abs(this.joystickY) < 0.12) this.joystickY = 0;
  }

  // Called each frame to apply smoothed input and camera damping
  updateSmoothing(dt) {
    // Smooth movement input
    const targetX = this.joystickX;
    const targetZ = -this.joystickY;
    const smoothing = 0.15;
    this.smoothMoveX += (targetX - this.smoothMoveX) * smoothing;
    this.smoothMoveZ += (targetZ - this.smoothMoveZ) * smoothing;

    // Apply dead zone after smoothing
    this.player.moveInput.x = Math.abs(this.smoothMoveX) > 0.05 ? this.smoothMoveX : 0;
    this.player.moveInput.z = Math.abs(this.smoothMoveZ) > 0.05 ? this.smoothMoveZ : 0;

    // Apply camera smoothing
    const cameraDamping = 0.12;
    this.player.cameraAngleX += this.cameraDragDeltaX * cameraDamping;
    this.player.cameraAngleY = clamp(
      this.player.cameraAngleY + this.cameraDragDeltaY * cameraDamping,
      -0.15, 0.7 // Limited range for tablet comfort
    );
    this.cameraDragDeltaX *= (1 - cameraDamping);
    this.cameraDragDeltaY *= (1 - cameraDamping);
    if (Math.abs(this.cameraDragDeltaX) < 0.0001) this.cameraDragDeltaX = 0;
    if (Math.abs(this.cameraDragDeltaY) < 0.0001) this.cameraDragDeltaY = 0;
  }

  setupKeyboardListeners() {
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

    // Mouse look
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
      this.player.cameraAngleY = clamp(this.player.cameraAngleY + dy * 0.003, -0.15, 0.7);
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
