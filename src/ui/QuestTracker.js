import { TILE_SIZE } from '../utils/constants.js';

/**
 * QuestTracker - vždy viditelný quest box + navigační šipka.
 * - Malý box vlevo nahoře s aktuálním úkolem (velký font, česky)
 * - Šipka/kompas na obrazovce ukazující směr k cíli
 * - Pulzující animace když je cíl blízko
 */
export class QuestTracker {
  constructor() {
    this.description = '';
    this.targetX = 0;
    this.targetY = 0;
    this.targetWorld = null;
    this.hasTarget = false;
    this.time = 0;
    this.showArrow = true;
    this.pulseNear = false;
    this.celebrationTimer = 0;
    this.newQuestTimer = 0;
  }

  setQuest(description, targetX, targetY, targetWorld) {
    this.description = description || '';
    this.targetX = targetX || 0;
    this.targetY = targetY || 0;
    this.targetWorld = targetWorld;
    this.hasTarget = !!targetWorld;
    this.newQuestTimer = 1.5; // Flash animation for new quest
  }

  clear() {
    this.description = '';
    this.hasTarget = false;
  }

  celebrate() {
    this.celebrationTimer = 3;
  }

  update(dt) {
    this.time += dt;
    if (this.celebrationTimer > 0) this.celebrationTimer -= dt;
    if (this.newQuestTimer > 0) this.newQuestTimer -= dt;
  }

  /**
   * Draw quest description box on MAIN canvas (top-left corner, above HUD).
   */
  drawHUD(ctx, canvasW, canvasH) {
    if (!this.description) return;

    const padding = 12;
    const maxW = Math.min(380, canvasW * 0.45);
    const x = 12;
    const y = 56; // Below the stars/role HUD bar

    // Background
    const isNew = this.newQuestTimer > 0;
    const bgAlpha = isNew ? 0.85 + Math.sin(this.time * 8) * 0.1 : 0.75;
    ctx.fillStyle = `rgba(20, 10, 50, ${bgAlpha})`;

    // Measure text for background size
    const fontSize = Math.max(15, Math.min(18, canvasW * 0.028));
    ctx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;

    // Word wrap
    const words = this.description.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW - padding * 2 && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineHeight = fontSize * 1.4;
    const boxH = lines.length * lineHeight + padding * 2;
    const boxW = maxW;

    // Rounded rect background
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + boxW - r, y);
    ctx.quadraticCurveTo(x + boxW, y, x + boxW, y + r);
    ctx.lineTo(x + boxW, y + boxH - r);
    ctx.quadraticCurveTo(x + boxW, y + boxH, x + boxW - r, y + boxH);
    ctx.lineTo(x + r, y + boxH);
    ctx.quadraticCurveTo(x, y + boxH, x, y + boxH - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // Border glow for new quest
    if (isNew) {
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(this.time * 6) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(200, 160, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Text
    ctx.fillStyle = isNew ? '#ffd700' : '#ffffff';
    ctx.textAlign = 'left';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x + padding, y + padding + (i + 1) * lineHeight - 4);
    }
  }

  /**
   * Draw navigation arrow in BUFFER space (pixel art).
   * Points from player toward target position.
   */
  drawArrow(bufCtx, renderer, playerX, playerY, currentWorld) {
    if (!this.hasTarget || !this.description) return;

    // If target is in different world, show portal arrow direction
    // Otherwise show arrow pointing to target position
    const inSameWorld = this.targetWorld === currentWorld;
    if (!inSameWorld) return; // Arrow only shown when target is in current world

    const dx = this.targetX - playerX;
    const dy = this.targetY - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 16) return; // Too close, no arrow needed

    // Pulse when close
    this.pulseNear = dist < 48;

    // Calculate angle
    const angle = Math.atan2(dy, dx);

    // Arrow position: at edge of screen, in direction of target
    const halfW = renderer.logicalW / 2;
    const halfH = renderer.logicalH / 2;

    // Clamp arrow to screen edge (with margin)
    const margin = 16;
    const maxR = Math.min(halfW - margin, halfH - margin);
    const arrowDist = Math.min(dist * 0.3, maxR);

    const sp = renderer.w2s(playerX, playerY);
    let arrowX = sp.x + Math.cos(angle) * arrowDist;
    let arrowY = sp.y + Math.sin(angle) * arrowDist;

    // Clamp to screen bounds
    arrowX = Math.max(margin, Math.min(renderer.logicalW - margin, arrowX));
    arrowY = Math.max(margin, Math.min(renderer.logicalH - margin, arrowY));

    // Draw arrow
    const c = bufCtx;
    const pulse = this.pulseNear ? Math.sin(this.time * 6) * 0.3 + 0.7 : 1;
    const size = this.pulseNear ? 5 + Math.sin(this.time * 6) * 1 : 4;

    c.save();
    c.translate(Math.floor(arrowX), Math.floor(arrowY));
    c.rotate(angle);

    // Arrow shape
    c.globalAlpha = 0.85 * pulse;
    c.fillStyle = '#ffd700';
    c.beginPath();
    c.moveTo(size, 0);
    c.lineTo(-size * 0.6, -size * 0.6);
    c.lineTo(-size * 0.3, 0);
    c.lineTo(-size * 0.6, size * 0.6);
    c.closePath();
    c.fill();

    // Outline
    c.strokeStyle = '#b08800';
    c.lineWidth = 0.5;
    c.stroke();

    c.globalAlpha = 1;
    c.restore();

    // Distance indicator (small text)
    const distTiles = Math.floor(dist / TILE_SIZE);
    if (distTiles > 3) {
      c.fillStyle = 'rgba(255,215,0,0.6)';
      c.font = '3px monospace';
      c.textAlign = 'center';
      c.fillText(`${distTiles}`, Math.floor(arrowX), Math.floor(arrowY) + size + 4);
      c.textAlign = 'left';
    }
  }
}
