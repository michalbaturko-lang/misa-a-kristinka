import * as THREE from 'three';
import { BLOCKS, BLOCK_COLORS } from '../utils/constants.js';

const TILE_SIZE = 16;
const ATLAS_TILES = 16; // 16x16 grid
const ATLAS_SIZE = TILE_SIZE * ATLAS_TILES; // 256x256

/**
 * TextureGenerator - creates procedural block textures via Canvas
 * Generates a texture atlas with unique tiles for each block face
 */
export class TextureGenerator {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = ATLAS_SIZE;
    this.canvas.height = ATLAS_SIZE;
    this.ctx = this.canvas.getContext('2d');
    this.texture = null;

    this.generateAtlas();
    this.createTexture();
  }

  getTileIndex(blockType, faceType) {
    return blockType * 3 + faceType;
  }

  getTilePos(blockType, faceType) {
    const index = this.getTileIndex(blockType, faceType);
    return {
      x: (index % ATLAS_TILES) * TILE_SIZE,
      y: Math.floor(index / ATLAS_TILES) * TILE_SIZE,
    };
  }

  getUV(blockType, faceType) {
    const index = this.getTileIndex(blockType, faceType);
    const tx = index % ATLAS_TILES;
    const ty = Math.floor(index / ATLAS_TILES);
    // Small inset to prevent bleeding
    const eps = 0.001;
    return {
      u0: tx / ATLAS_TILES + eps,
      v0: 1 - (ty + 1) / ATLAS_TILES + eps,
      u1: (tx + 1) / ATLAS_TILES - eps,
      v1: 1 - ty / ATLAS_TILES - eps,
    };
  }

  generateAtlas() {
    const ctx = this.ctx;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

    for (const [blockTypeStr, colors] of Object.entries(BLOCK_COLORS)) {
      const blockType = parseInt(blockTypeStr);
      this.drawBaseTiles(blockType, colors);
    }

    // Special procedural textures
    this.drawGrassTexture();
    this.drawDirtTexture();
    this.drawStoneTexture();
    this.drawWoodTexture();
    this.drawLeavesTexture();
    this.drawWaterTexture();
    this.drawSandTexture();
    this.drawPlanksTexture();
    this.drawCobblestoneTexture();
    this.drawBrickTexture();
    this.drawPortalTexture();
    this.drawMagicStoneTexture();
    this.drawGoldTexture();
    this.drawCrystalTexture();
    this.drawLavaTexture();
  }

  drawBaseTiles(blockType, colors) {
    const ctx = this.ctx;
    const faces = [colors.top, colors.side, colors.bottom];
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(blockType, f);
      let color = faces[f] || colors.top;
      if (color.length > 7) color = color.slice(0, 7);
      ctx.fillStyle = color;
      ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
    }
  }

  drawGrassTexture() {
    const ctx = this.ctx;
    // Top: green with grass blade pattern
    const top = this.getTilePos(BLOCKS.GRASS, 0);
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const r = Math.random();
        if (r < 0.3) ctx.fillStyle = '#3d8b40';
        else if (r < 0.6) ctx.fillStyle = '#5cb85c';
        else ctx.fillStyle = '#4CAF50';
        ctx.fillRect(top.x + x, top.y + y, 1, 1);
      }
    }

    // Side: green top strip + dirt below
    const side = this.getTilePos(BLOCKS.GRASS, 1);
    // Dirt base
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const shade = 0.85 + Math.random() * 0.15;
        ctx.fillStyle = `rgb(${Math.floor(139 * shade)},${Math.floor(105 * shade)},${Math.floor(20 * shade)})`;
        ctx.fillRect(side.x + x, side.y + y, 1, 1);
      }
    }
    // Green top strip
    for (let x = 0; x < TILE_SIZE; x++) {
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(side.x + x, side.y, 1, 2);
      if (Math.random() > 0.3) {
        ctx.fillStyle = '#3d8b40';
        const h = 2 + Math.floor(Math.random() * 2);
        ctx.fillRect(side.x + x, side.y + 2, 1, h);
      }
    }
  }

  drawDirtTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.DIRT, f);
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const shade = 0.8 + Math.random() * 0.2;
          ctx.fillStyle = `rgb(${Math.floor(139 * shade)},${Math.floor(105 * shade)},${Math.floor(20 * shade)})`;
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
      // Small stone specks
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#999';
        ctx.fillRect(pos.x + Math.floor(Math.random() * 14) + 1, pos.y + Math.floor(Math.random() * 14) + 1, 1, 1);
      }
    }
  }

  drawStoneTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.STONE, f);
      const base = f === 0 ? 158 : f === 1 ? 140 : 120;
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const noise = (Math.sin(x * 1.3 + y * 0.7) * 0.1 + Math.random() * 0.15);
          const v = Math.floor(base * (0.85 + noise));
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
      // Crack lines
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(pos.x + Math.random() * TILE_SIZE, pos.y + Math.random() * TILE_SIZE);
        ctx.lineTo(pos.x + Math.random() * TILE_SIZE, pos.y + Math.random() * TILE_SIZE);
        ctx.stroke();
      }
    }
  }

  drawWoodTexture() {
    const ctx = this.ctx;
    // Side: vertical wood grain
    const side = this.getTilePos(BLOCKS.WOOD, 1);
    for (let x = 0; x < TILE_SIZE; x++) {
      const grain = Math.sin(x * 1.2) * 0.15;
      for (let y = 0; y < TILE_SIZE; y++) {
        const shade = 0.8 + grain + Math.random() * 0.05;
        ctx.fillStyle = `rgb(${Math.floor(139 * shade)},${Math.floor(69 * shade)},${Math.floor(19 * shade)})`;
        ctx.fillRect(side.x + x, side.y + y, 1, 1);
      }
    }
    // Knot
    ctx.fillStyle = '#5a3010';
    ctx.beginPath();
    ctx.arc(side.x + 6, side.y + 10, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d200a';
    ctx.beginPath();
    ctx.arc(side.x + 6, side.y + 10, 1, 0, Math.PI * 2);
    ctx.fill();

    // Top: tree rings
    const top = this.getTilePos(BLOCKS.WOOD, 0);
    const cx = top.x + 8, cy = top.y + 8;
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(top.x, top.y, TILE_SIZE, TILE_SIZE);
    for (let r = 6; r > 0; r -= 2) {
      ctx.strokeStyle = r % 4 === 0 ? '#7a4010' : '#b06020';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#5a3010';
    ctx.beginPath();
    ctx.arc(cx, cy, 1, 0, Math.PI * 2);
    ctx.fill();

    // Bottom same as top
    const bot = this.getTilePos(BLOCKS.WOOD, 2);
    ctx.drawImage(this.canvas, top.x, top.y, TILE_SIZE, TILE_SIZE, bot.x, bot.y, TILE_SIZE, TILE_SIZE);
  }

  drawLeavesTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.LEAVES, f);
      const baseG = f === 0 ? 130 : f === 1 ? 145 : 100;
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const r = Math.random();
          if (r < 0.15) {
            // Hole / gap
            ctx.fillStyle = 'rgba(20,60,20,0.8)';
          } else {
            const shade = 0.7 + Math.random() * 0.3;
            ctx.fillStyle = `rgb(${Math.floor(40 * shade)},${Math.floor(baseG * shade)},${Math.floor(45 * shade)})`;
          }
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
    }
  }

  drawWaterTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.WATER, f);
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const wave = Math.sin(x * 0.6 + y * 0.4) * 0.1 + 0.9;
          ctx.fillStyle = `rgb(${Math.floor(33 * wave)},${Math.floor(150 * wave)},${Math.floor(243 * wave)})`;
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
      // Highlight streaks
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const sy = pos.y + 2 + i * 5;
        ctx.moveTo(pos.x, sy);
        ctx.quadraticCurveTo(pos.x + 8, sy - 2, pos.x + TILE_SIZE, sy);
        ctx.stroke();
      }
    }
  }

  drawSandTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.SAND, f);
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const shade = 0.85 + Math.random() * 0.15;
          ctx.fillStyle = `rgb(${Math.floor(245 * shade)},${Math.floor(222 * shade)},${Math.floor(179 * shade)})`;
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
      // Darker specks
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = '#c4a060';
        ctx.fillRect(pos.x + Math.floor(Math.random() * 14) + 1, pos.y + Math.floor(Math.random() * 14) + 1, 1, 1);
      }
    }
  }

  drawPlanksTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.PLANKS, f);
      // Wood grain base
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const plank = Math.floor(y / 4);
          const shade = 0.85 + Math.sin(x * 0.8 + plank * 2) * 0.1 + Math.random() * 0.05;
          ctx.fillStyle = `rgb(${Math.floor(193 * shade)},${Math.floor(154 * shade)},${Math.floor(107 * shade)})`;
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
      // Plank division lines
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let row = 1; row < 4; row++) {
        ctx.fillRect(pos.x, pos.y + row * 4, TILE_SIZE, 1);
      }
      // Nail marks
      ctx.fillStyle = '#666';
      ctx.fillRect(pos.x + 2, pos.y + 2, 1, 1);
      ctx.fillRect(pos.x + 13, pos.y + 6, 1, 1);
      ctx.fillRect(pos.x + 5, pos.y + 10, 1, 1);
      ctx.fillRect(pos.x + 11, pos.y + 14, 1, 1);
    }
  }

  drawCobblestoneTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.COBBLESTONE, f);
      ctx.fillStyle = '#696969';
      ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
      // Stone shapes
      const stones = [
        [2, 1, 5, 4], [9, 1, 5, 4], [1, 6, 4, 4], [6, 5, 5, 5], [12, 6, 3, 4],
        [2, 11, 5, 4], [8, 11, 6, 4],
      ];
      for (const [sx, sy, sw, sh] of stones) {
        const shade = 0.7 + Math.random() * 0.3;
        ctx.fillStyle = `rgb(${Math.floor(130 * shade)},${Math.floor(130 * shade)},${Math.floor(130 * shade)})`;
        ctx.fillRect(pos.x + sx, pos.y + sy, sw, sh);
      }
      // Mortar
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      for (const [sx, sy, sw, sh] of stones) {
        ctx.strokeRect(pos.x + sx, pos.y + sy, sw, sh);
      }
    }
  }

  drawBrickTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.BRICK, f);
      // Mortar background
      ctx.fillStyle = '#8a8070';
      ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
      // Bricks
      for (let row = 0; row < 4; row++) {
        const offset = (row % 2) * 5;
        for (let col = -1; col < 3; col++) {
          const bx = pos.x + offset + col * 8;
          const by = pos.y + row * 4;
          const shade = 0.85 + Math.random() * 0.15;
          ctx.fillStyle = `rgb(${Math.floor(178 * shade)},${Math.floor(34 * shade)},${Math.floor(34 * shade)})`;
          ctx.fillRect(Math.max(bx, pos.x), by + 1, Math.min(7, pos.x + TILE_SIZE - bx), 3);
        }
      }
    }
  }

  drawPortalTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.PORTAL, f);
      // Swirling purple energy
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const cx = x - 8, cy = y - 8;
          const dist = Math.sqrt(cx * cx + cy * cy);
          const angle = Math.atan2(cy, cx);
          const swirl = Math.sin(dist * 0.8 + angle * 2) * 0.3;
          const base = 0.6 + swirl + Math.random() * 0.1;
          ctx.fillStyle = `rgb(${Math.floor(155 * base)},${Math.floor(89 * base)},${Math.floor(182 * base)})`;
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
      // Bright center glow
      const grad = ctx.createRadialGradient(pos.x + 8, pos.y + 8, 0, pos.x + 8, pos.y + 8, 8);
      grad.addColorStop(0, 'rgba(200,150,255,0.4)');
      grad.addColorStop(1, 'rgba(155,89,182,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
    }
  }

  drawMagicStoneTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.MAGIC_STONE, f);
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const shimmer = Math.sin(x * 0.8 + y * 0.6) * 0.1;
          const shade = 0.8 + shimmer + Math.random() * 0.1;
          ctx.fillStyle = `rgb(${Math.floor(126 * shade)},${Math.floor(87 * shade)},${Math.floor(194 * shade)})`;
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
      // Glowing rune marks
      ctx.fillStyle = 'rgba(180,140,255,0.5)';
      ctx.fillRect(pos.x + 4, pos.y + 4, 2, 8);
      ctx.fillRect(pos.x + 10, pos.y + 4, 2, 8);
      ctx.fillRect(pos.x + 4, pos.y + 7, 8, 2);
    }
  }

  drawGoldTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.GOLD, f);
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const shimmer = Math.sin(x * 1.2 + y * 0.9) * 0.15;
          const shade = 0.8 + shimmer + Math.random() * 0.1;
          ctx.fillStyle = `rgb(${Math.floor(255 * shade)},${Math.floor(215 * shade)},${Math.floor(0)})`;
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
      // Sparkle highlights
      ctx.fillStyle = 'rgba(255,255,200,0.6)';
      ctx.fillRect(pos.x + 3, pos.y + 3, 2, 2);
      ctx.fillRect(pos.x + 11, pos.y + 9, 2, 2);
      ctx.fillRect(pos.x + 7, pos.y + 13, 1, 1);
    }
  }

  drawCrystalTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.CRYSTAL, f);
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const facet = Math.abs(Math.sin(x * 2 + y * 1.5)) * 0.2;
          const shade = 0.75 + facet + Math.random() * 0.05;
          ctx.fillStyle = `rgb(${Math.floor(232 * shade)},${Math.floor(218 * shade)},${Math.floor(239 * shade)})`;
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
      // Facet lines
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pos.x + 2, pos.y + 2);
      ctx.lineTo(pos.x + 14, pos.y + 8);
      ctx.moveTo(pos.x + 4, pos.y + 12);
      ctx.lineTo(pos.x + 12, pos.y + 4);
      ctx.stroke();
    }
  }

  drawLavaTexture() {
    const ctx = this.ctx;
    for (let f = 0; f < 3; f++) {
      const pos = this.getTilePos(BLOCKS.LAVA, f);
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const flow = Math.sin(x * 0.5 + y * 0.3) * 0.2;
          const shade = 0.7 + flow + Math.random() * 0.1;
          const r = Math.min(255, Math.floor(255 * shade));
          const g = Math.floor(87 * shade + 40 * Math.max(0, flow));
          ctx.fillStyle = `rgb(${r},${g},25)`;
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
      // Hot spots
      ctx.fillStyle = 'rgba(255,200,50,0.4)';
      ctx.beginPath();
      ctx.arc(pos.x + 5, pos.y + 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pos.x + 12, pos.y + 11, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  createTexture() {
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestMipmapLinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.needsUpdate = true;
  }
}
