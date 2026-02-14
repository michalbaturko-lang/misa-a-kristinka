import { TILE_SIZE, CHAR_W, CHAR_H, TILES } from '../utils/constants.js';
import { lerp, createCanvas } from '../utils/helpers.js';

/**
 * Canvas 2D Renderer - top-down pixel art game.
 * Offscreen buffer at logical resolution, scaled up crisp.
 */
export class Renderer {
  constructor(canvas, sprites) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = sprites;
    this.logicalW = 256;
    this.logicalH = 192;
    const buf = createCanvas(this.logicalW, this.logicalH);
    this.buffer = buf.canvas;
    this.bufCtx = buf.ctx;
    this.camX = 0; this.camY = 0;
    this.targetCamX = 0; this.targetCamY = 0;
    this.waterFrame = 0; this.waterTimer = 0;
    this.portalFrame = 0; this.portalTimer = 0;
    this.shakeAmount = 0; this.time = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
    const sx = this.canvas.width / this.logicalW;
    const sy = this.canvas.height / this.logicalH;
    this.renderScale = Math.min(sx, sy);
    this.offsetX = Math.floor((this.canvas.width - this.logicalW * this.renderScale) / 2);
    this.offsetY = Math.floor((this.canvas.height - this.logicalH * this.renderScale) / 2);
  }

  setCamera(x, y) { this.targetCamX = x; this.targetCamY = y; }
  snapCamera(x, y) { this.camX = this.targetCamX = x; this.camY = this.targetCamY = y; }

  update(dt) {
    this.time += dt;
    this.camX = lerp(this.camX, this.targetCamX, 0.08);
    this.camY = lerp(this.camY, this.targetCamY, 0.08);
    this.waterTimer += dt;
    if (this.waterTimer > 0.3) { this.waterTimer -= 0.3; this.waterFrame = (this.waterFrame + 1) % 4; }
    this.portalTimer += dt;
    if (this.portalTimer > 0.12) { this.portalTimer -= 0.12; this.portalFrame = (this.portalFrame + 1) % 8; }
    if (this.shakeAmount > 0.1) this.shakeAmount *= 0.9; else this.shakeAmount = 0;
  }

  shake(amount) { this.shakeAmount = amount || 3; }

  w2s(wx, wy) {
    const sx = this.shakeAmount ? (Math.random() - 0.5) * this.shakeAmount : 0;
    const sy = this.shakeAmount ? (Math.random() - 0.5) * this.shakeAmount : 0;
    return { x: Math.floor(wx - this.camX + this.logicalW / 2 + sx), y: Math.floor(wy - this.camY + this.logicalH / 2 + sy) };
  }

  screenToWorld(scx, scy) {
    const lx = (scx - this.offsetX) / this.renderScale;
    const ly = (scy - this.offsetY) / this.renderScale;
    return { x: lx + this.camX - this.logicalW / 2, y: ly + this.camY - this.logicalH / 2 };
  }

  beginFrame(bgColor) {
    this.bufCtx.fillStyle = bgColor || '#4a8a4a';
    this.bufCtx.fillRect(0, 0, this.logicalW, this.logicalH);
  }

  drawTileMap(world) {
    const c = this.bufCtx, ts = TILE_SIZE;
    const x0 = Math.max(0, Math.floor((this.camX - this.logicalW / 2) / ts) - 1);
    const y0 = Math.max(0, Math.floor((this.camY - this.logicalH / 2) / ts) - 1);
    const x1 = Math.min(world.width, Math.ceil((this.camX + this.logicalW / 2) / ts) + 1);
    const y1 = Math.min(world.height, Math.ceil((this.camY + this.logicalH / 2) / ts) + 1);
    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        const tile = world.getTile(tx, ty);
        if (tile === TILES.EMPTY) continue;
        const sp = this.w2s(tx * ts, ty * ts);
        let img;
        switch (tile) {
          case TILES.GRASS: img = this.sprites.getTile((tx + ty) % 2 ? 'grass' : 'grass2'); break;
          case TILES.GRASS_DARK: img = this.sprites.getTile('grass_dark'); break;
          case TILES.GRASS_FLOWER: img = this.sprites.getTile('grass_flower'); break;
          case TILES.WATER: img = this.sprites.getTile('water', this.waterFrame); break;
          case TILES.PATH: img = this.sprites.getTile('path'); break;
          case TILES.DIRT: img = this.sprites.getTile('dirt'); break;
          case TILES.SAND: img = this.sprites.getTile('sand'); break;
          case TILES.STONE_FLOOR: img = this.sprites.getTile('stone_floor'); break;
          case TILES.WOOD_FLOOR: img = this.sprites.getTile('wood_floor'); break;
          case TILES.BRIDGE: img = this.sprites.getTile('bridge'); break;
          case TILES.METAL_FLOOR: img = this.sprites.getTile('metal_floor'); break;
          case TILES.CORAL_FLOOR: img = this.sprites.getTile('coral_floor'); break;
          default: img = this.sprites.getTile('grass');
        }
        if (img) c.drawImage(img, sp.x, sp.y, ts, ts);
      }
    }
  }

  drawDecoration(decor) {
    let sprite = this.sprites.getDecoration(decor.type);
    if (!sprite) return;
    if (Array.isArray(sprite)) sprite = sprite[this.portalFrame % sprite.length];
    const sp = this.w2s(decor.x * TILE_SIZE, decor.y * TILE_SIZE);
    this.bufCtx.drawImage(sprite, sp.x + Math.floor((TILE_SIZE - sprite.width) / 2), sp.y + TILE_SIZE - sprite.height, sprite.width, sprite.height);
  }

  drawCharacter(sheet, x, y, dir, frame, alpha) {
    const c = this.bufCtx, sp = this.w2s(x, y);
    if (alpha != null && alpha < 1) c.globalAlpha = alpha;
    c.drawImage(sheet, (frame % 4) * CHAR_W, dir * CHAR_H, CHAR_W, CHAR_H,
      sp.x - CHAR_W / 2, sp.y - CHAR_H + 6, CHAR_W, CHAR_H);
    if (alpha != null && alpha < 1) c.globalAlpha = 1;
  }

  drawNPC(npc) {
    const c = this.bufCtx;
    const sp = this.w2s(npc.x * TILE_SIZE + TILE_SIZE / 2, npc.y * TILE_SIZE + TILE_SIZE);
    const sheet = this.sprites.getNPC(npc.npcType);
    if (!sheet) return;
    c.drawImage(sheet, (Math.floor(this.time * 1.5) % 2) * CHAR_W, 0, CHAR_W, CHAR_H,
      sp.x - CHAR_W / 2, sp.y - CHAR_H + 6, CHAR_W, CHAR_H);
    if (npc.canInteract) {
      const bob = Math.sin(this.time * 4) * 2;
      c.fillStyle = '#ffd700';
      c.fillRect(sp.x - 1, sp.y - CHAR_H - 4 + bob, 3, 4);
      c.fillRect(sp.x, sp.y - CHAR_H + 1 + bob, 1, 1);
    }
  }

  drawPortal(portal) {
    const frames = this.sprites.getDecoration('portal');
    if (!frames || !Array.isArray(frames)) return;
    const sp = this.w2s(portal.x * TILE_SIZE, portal.y * TILE_SIZE);
    this.bufCtx.drawImage(frames[this.portalFrame], sp.x - 8, sp.y - 16, 32, 32);
    if (portal.label) {
      this.bufCtx.fillStyle = '#fff'; this.bufCtx.font = '4px monospace';
      const tw = this.bufCtx.measureText(portal.label).width;
      this.bufCtx.fillText(portal.label, sp.x + TILE_SIZE / 2 - tw / 2 - 8, sp.y - 20);
    }
  }

  drawParticles(particles) {
    const c = this.bufCtx;
    for (const p of particles) {
      const sp = this.w2s(p.x, p.y);
      c.globalAlpha = p.alpha || 1;
      c.fillStyle = p.color;
      c.fillRect(sp.x, sp.y, p.size || 1, p.size || 1);
    }
    c.globalAlpha = 1;
  }

  drawDialogBubble(wx, wy, text, charIdx) {
    const c = this.bufCtx, sp = this.w2s(wx, wy);
    const disp = text.substring(0, charIdx);
    if (!disp.length) return;
    const maxW = 90, lines = []; let line = '';
    for (const w of disp.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (t.length * 3 > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    const lh = 6, pad = 3, bw = maxW + pad * 2, bh = lines.length * lh + pad * 2;
    const bx = Math.floor(sp.x - bw / 2), by = Math.floor(sp.y - bh - 10);
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.fillRect(bx, by, bw, bh); c.fillRect(sp.x - 2, by + bh, 4, 3);
    c.strokeStyle = '#6040a0'; c.lineWidth = 0.5; c.strokeRect(bx, by, bw, bh);
    c.fillStyle = '#2a2a3a'; c.font = '4px monospace';
    for (let i = 0; i < lines.length; i++) c.fillText(lines[i], bx + pad, by + pad + (i + 1) * lh - 1);
  }

  drawInteractionPrompt(x, y, text) {
    const c = this.bufCtx, sp = this.w2s(x, y);
    const bob = Math.sin(this.time * 3) * 1.5;
    c.font = '4px monospace';
    const tw = c.measureText(text).width;
    c.fillStyle = 'rgba(0,0,0,0.6)';
    c.fillRect(sp.x - tw / 2 - 3, sp.y - CHAR_H - 12 + bob, tw + 6, 7);
    c.fillStyle = '#ffd700';
    c.fillText(text, sp.x - tw / 2, sp.y - CHAR_H - 7 + bob);
  }

  drawNameTag(x, y, name, color) {
    const c = this.bufCtx, sp = this.w2s(x, y);
    c.fillStyle = color || '#fff'; c.font = '3px monospace';
    c.fillText(name, sp.x - c.measureText(name).width / 2, sp.y - CHAR_H + 2);
  }

  drawHUD(stars, role, roomCode, worldName) {
    const c = this.ctx, w = this.canvas.width;
    c.fillStyle = 'rgba(20,10,40,0.55)'; c.fillRect(0, 0, w, 48);
    c.fillStyle = '#ffd700'; c.font = 'bold 22px "Segoe UI",sans-serif';
    c.fillText(`★ ${stars}`, 14, 33);
    if (role) {
      c.fillStyle = role === 'mathematician' ? '#5898ff' : '#ff5878';
      c.font = 'bold 16px "Segoe UI",sans-serif';
      c.fillText(role === 'mathematician' ? '★ Míša' : '♥ Kristinka', 80, 31);
    }
    c.fillStyle = '#e8e0f0'; c.font = '15px "Segoe UI",sans-serif';
    const wn = worldName || '';
    c.fillText(wn, w / 2 - c.measureText(wn).width / 2, 31);
    if (roomCode) {
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.font = '13px monospace';
      const rc = `Kód: ${roomCode}`;
      c.fillText(rc, w - c.measureText(rc).width - 14, 31);
    }
  }

  endFrame() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.buffer, 0, 0, this.logicalW, this.logicalH,
      this.offsetX, this.offsetY,
      Math.floor(this.logicalW * this.renderScale), Math.floor(this.logicalH * this.renderScale));
  }
}
