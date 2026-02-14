import { audio } from '../utils/helpers.js';

/**
 * CutsceneManager - úvodní příběhová cutscéna.
 * Černé obrazovky s typewriter textem, tap/klik pro pokračování.
 * Max 6 obrazovek, velký font čitelný pro 6leté děti.
 */
export class CutsceneManager {
  constructor() {
    this.active = false;
    this.steps = [];
    this.currentStep = 0;
    this.charIndex = 0;
    this.charTimer = 0;
    this.charsPerSec = 18;
    this.onComplete = null;
    this.waitingForInput = false;
    this.fadeAlpha = 1;
    this.starParticles = [];
  }

  /**
   * Start cutscene with array of steps.
   * Each step: { text: string, speaker?: string, color?: string }
   */
  start(steps, onComplete) {
    this.active = true;
    this.steps = steps;
    this.currentStep = 0;
    this.charIndex = 0;
    this.charTimer = 0;
    this.onComplete = onComplete;
    this.waitingForInput = false;
    this.fadeAlpha = 1;

    // Background stars
    this.starParticles = [];
    for (let i = 0; i < 40; i++) {
      this.starParticles.push({
        x: Math.random(),
        y: Math.random(),
        size: 1 + Math.random() * 2,
        speed: 0.01 + Math.random() * 0.03,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }

    audio.playEffect('dialog');
  }

  handleInput() {
    if (!this.active) return false;

    const step = this.steps[this.currentStep];
    if (!step) return false;

    if (this.charIndex < step.text.length) {
      // Skip to end of current text
      this.charIndex = step.text.length;
      this.waitingForInput = true;
    } else {
      // Advance to next step
      this.currentStep++;
      if (this.currentStep >= this.steps.length) {
        this.active = false;
        if (this.onComplete) this.onComplete();
      } else {
        this.charIndex = 0;
        this.charTimer = 0;
        this.waitingForInput = false;
        audio.playEffect('dialog');
      }
    }
    return true;
  }

  update(dt) {
    if (!this.active) return;

    // Animate stars
    for (const s of this.starParticles) {
      s.y -= s.speed * dt;
      if (s.y < -0.05) { s.y = 1.05; s.x = Math.random(); }
    }

    if (this.waitingForInput) return;

    const step = this.steps[this.currentStep];
    if (!step) return;

    this.charTimer += dt * this.charsPerSec;
    const newIdx = Math.floor(this.charTimer);
    if (newIdx > this.charIndex) {
      this.charIndex = Math.min(newIdx, step.text.length);
    }

    if (this.charIndex >= step.text.length) {
      this.waitingForInput = true;
    }
  }

  /**
   * Draw cutscene on the MAIN canvas (full screen, above everything).
   */
  draw(ctx, W, H) {
    if (!this.active) return;

    const step = this.steps[this.currentStep];
    if (!step) return;

    const text = step.text.substring(0, this.charIndex);

    // Dark background
    ctx.fillStyle = 'rgba(5, 2, 20, 0.97)';
    ctx.fillRect(0, 0, W, H);

    // Animated stars
    for (const s of this.starParticles) {
      const pulse = Math.sin(Date.now() * 0.002 + s.x * 10) * 0.3 + 0.7;
      ctx.globalAlpha = s.alpha * pulse;
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(
        Math.floor(s.x * W),
        Math.floor(s.y * H),
        Math.ceil(s.size),
        Math.ceil(s.size)
      );
    }
    ctx.globalAlpha = 1;

    // Speaker name
    const speakerY = H * 0.28;
    if (step.speaker) {
      ctx.fillStyle = step.color || '#ffd700';
      ctx.font = `bold ${Math.max(20, Math.floor(H * 0.045))}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(step.speaker, W / 2, speakerY);
    }

    // Main text - LARGE and readable for kids
    const fontSize = Math.max(22, Math.floor(H * 0.04));
    ctx.fillStyle = '#ffffff';
    ctx.font = `${fontSize}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';

    // Word wrap
    const maxWidth = W * 0.75;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = fontSize * 1.5;
    const startY = step.speaker ? H * 0.4 : H * 0.38;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], W / 2, startY + i * lineHeight);
    }

    // "Klikni pro pokračování" hint
    if (this.waitingForInput) {
      const blink = Math.sin(Date.now() * 0.004) > 0;
      if (blink) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.font = `${Math.max(14, Math.floor(H * 0.025))}px "Segoe UI", sans-serif`;
        ctx.fillText('▼ Klikni pro pokračování', W / 2, H * 0.88);
      }
    }

    // Step dots (progress indicator)
    const dotSize = 8;
    const dotGap = 20;
    const dotsW = this.steps.length * dotGap;
    const dotsX = W / 2 - dotsW / 2;
    for (let i = 0; i < this.steps.length; i++) {
      ctx.fillStyle = i === this.currentStep ? '#ffd700' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(dotsX + i * dotGap + dotGap / 2, H * 0.93, i === this.currentStep ? dotSize / 2 : dotSize / 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.textAlign = 'left'; // Reset
  }

  isActive() {
    return this.active;
  }
}

/**
 * Default intro cutscene steps for Míša & Kristinka.
 */
export const INTRO_STEPS = [
  {
    text: 'Země Pixelů žila v harmonii... Každý svět byl krásný a plný radosti.',
  },
  {
    text: 'Ale jednoho dne přišel Prchavec Zmatek a všechno se změnilo!',
    speaker: '⚡ Pozor!',
    color: '#ff6040',
  },
  {
    text: 'Rozbil brány mezi světy! Magický les uvadá, oceán se bouří, vesmírná stanice se rozpadá...',
  },
  {
    text: 'Teď je potřeba, aby dva odvážní hrdinové zachránili Zemi Pixelů!',
    speaker: '✨ Naděje',
    color: '#50d0ff',
  },
  {
    text: 'Míša - Čaroděj čísel, a Kristinka - Umělkyně barev. Společně dokážou cokoli!',
    speaker: '🌟 Hrdinové',
    color: '#ffd700',
  },
  {
    text: 'Vaše dobrodružství začíná... TEĎKA!',
    speaker: '🚀 Jdeme na to!',
    color: '#4aff4a',
  },
];
