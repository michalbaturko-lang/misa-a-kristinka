import { TILE_SIZE } from '../utils/constants.js';
import { audio } from '../utils/helpers.js';

/**
 * DialogSystem - text bubbles above NPCs, typewriter effect.
 */
export class DialogSystem {
  constructor() {
    this.active = false;
    this.queue = [];
    this.currentText = '';
    this.charIndex = 0;
    this.charTimer = 0;
    this.charSpeed = 25; // characters per second
    this.worldX = 0;
    this.worldY = 0;
    this.onComplete = null;
    this.waitingForInput = false;
    this.displayTime = 0;
  }

  startDialog(texts, worldX, worldY, onComplete) {
    this.queue = [...texts];
    this.worldX = worldX;
    this.worldY = worldY;
    this.onComplete = onComplete;
    this.active = true;
    this.nextLine();
  }

  nextLine() {
    if (this.queue.length === 0) {
      this.active = false;
      if (this.onComplete) this.onComplete();
      return;
    }
    this.currentText = this.queue.shift();
    this.charIndex = 0;
    this.charTimer = 0;
    this.waitingForInput = false;
    this.displayTime = 0;
    audio.playEffect('dialog');
  }

  update(dt) {
    if (!this.active) return;

    if (this.waitingForInput) {
      this.displayTime += dt;
      return;
    }

    this.charTimer += dt * this.charSpeed;
    const newIdx = Math.floor(this.charTimer);
    if (newIdx > this.charIndex) {
      this.charIndex = Math.min(newIdx, this.currentText.length);
    }

    if (this.charIndex >= this.currentText.length) {
      this.waitingForInput = true;
      this.displayTime = 0;
    }
  }

  handleInput() {
    if (!this.active) return false;

    if (this.waitingForInput) {
      this.nextLine();
      return true;
    }

    // Skip to end of current line
    this.charIndex = this.currentText.length;
    this.waitingForInput = true;
    return true;
  }

  draw(renderer) {
    if (!this.active) return;
    renderer.drawDialogBubble(this.worldX, this.worldY, this.currentText, this.charIndex);
  }

  isActive() {
    return this.active;
  }

  skip() {
    this.queue = [];
    this.active = false;
    if (this.onComplete) this.onComplete();
  }
}
