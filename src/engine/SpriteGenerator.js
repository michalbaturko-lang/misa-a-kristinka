import { TILE_SIZE, CHAR_W, CHAR_H, DIRECTIONS } from '../utils/constants.js';
import { createCanvas, setPixel, fillRect } from '../utils/helpers.js';

/**
 * Generates ALL pixel art procedurally on Canvas.
 * No external images - everything is drawn with code.
 */
export class SpriteGenerator {
  constructor() {
    this.tiles = {};
    this.characters = {};
    this.decorations = {};
    this.portraits = {};
    this.npcSprites = {};
    this.uiSprites = {};
    this.generate();
  }

  generate() {
    this.generateTiles();
    this.generateCharacters();
    this.generateDecorations();
    this.generatePortraits();
    this.generateNPC();
    this.generateUI();
  }

  // ============ TILES (16x16 each) ============
  generateTiles() {
    this.tiles.grass = this.drawGrassTile();
    this.tiles.grass2 = this.drawGrassTile(true);
    this.tiles.grass_dark = this.drawDarkGrassTile();
    this.tiles.grass_flower = this.drawGrassFlowerTile();
    this.tiles.water = this.drawWaterFrames();
    this.tiles.path = this.drawPathTile();
    this.tiles.dirt = this.drawDirtTile();
    this.tiles.sand = this.drawSandTile();
    this.tiles.stone_floor = this.drawStoneFloorTile();
    this.tiles.wood_floor = this.drawWoodFloorTile();
    this.tiles.bridge = this.drawBridgeTile();
    this.tiles.metal_floor = this.drawMetalFloorTile();
    this.tiles.coral_floor = this.drawCoralFloorTile();
  }

  drawGrassTile(variant = false) {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    const base = variant ? '#5ab55e' : '#4fa854';
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 16, 16);
    // Grass detail
    const details = variant
      ? [[2,3,'#6bc96f'],[7,8,'#3d9142'],[11,2,'#6bc96f'],[5,12,'#3d9142'],[13,10,'#6bc96f']]
      : [[3,5,'#5cb860'],[9,2,'#3d9142'],[1,11,'#6bc96f'],[12,7,'#3d9142'],[6,14,'#5cb860'],[14,13,'#3d9142']];
    for (const [x, y, c] of details) setPixel(ctx, x, y, c);
    // Tiny grass blades
    const blades = variant
      ? [[4,6,'#6bc96f'],[10,3,'#6bc96f'],[8,13,'#5cb860']]
      : [[2,8,'#6bc96f'],[7,1,'#5cb860'],[13,11,'#6bc96f'],[5,4,'#5cb860']];
    for (const [x, y, c] of blades) setPixel(ctx, x, y, c);
    return canvas;
  }

  drawDarkGrassTile() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#3a7a3e';
    ctx.fillRect(0, 0, 16, 16);
    const details = [[2,4,'#327035'],[8,1,'#458a48'],[12,9,'#327035'],[4,12,'#458a48'],[10,6,'#2d632f'],[1,8,'#458a48'],[14,3,'#327035']];
    for (const [x, y, c] of details) setPixel(ctx, x, y, c);
    return canvas;
  }

  drawGrassFlowerTile() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    ctx.drawImage(this.drawGrassTile(), 0, 0);
    // Small flower
    setPixel(ctx, 7, 6, '#fff05a');
    setPixel(ctx, 6, 7, '#fff05a');
    setPixel(ctx, 8, 7, '#fff05a');
    setPixel(ctx, 7, 8, '#fff05a');
    setPixel(ctx, 7, 7, '#e8a030');
    // Stem
    setPixel(ctx, 7, 9, '#3d9142');
    setPixel(ctx, 7, 10, '#3d9142');
    return canvas;
  }

  drawWaterFrames() {
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#3b8beb';
      ctx.fillRect(0, 0, 16, 16);
      // Animated shimmer
      for (let i = 0; i < 6; i++) {
        const x = (i * 3 + f * 2) % 15;
        const y = (i * 5 + f * 3) % 15;
        setPixel(ctx, x, y, '#5ea8f5');
        setPixel(ctx, (x + 1) % 16, y, '#6bb5ff');
      }
      // Deeper blue spots
      for (let i = 0; i < 4; i++) {
        const x = (i * 4 + f) % 14 + 1;
        const y = (i * 3 + f * 2 + 7) % 14 + 1;
        setPixel(ctx, x, y, '#2d6fc4');
      }
      // Bright highlights
      const hx = (f * 4 + 3) % 14;
      const hy = (f * 3 + 5) % 14;
      setPixel(ctx, hx, hy, '#8cd4ff');
      setPixel(ctx, (hx + 7) % 15, (hy + 4) % 15, '#8cd4ff');
      frames.push(canvas);
    }
    return frames;
  }

  drawPathTile() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#c8a96e';
    ctx.fillRect(0, 0, 16, 16);
    const details = [[3,4,'#b8984f'],[9,7,'#d4b87a'],[5,12,'#b8984f'],[12,2,'#d4b87a'],[1,9,'#b8984f'],[14,14,'#d4b87a'],[7,1,'#b8984f']];
    for (const [x, y, c] of details) setPixel(ctx, x, y, c);
    return canvas;
  }

  drawDirtTile() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#8b6b3e';
    ctx.fillRect(0, 0, 16, 16);
    const details = [[2,3,'#7a5c32'],[8,8,'#9c7a4a'],[13,5,'#7a5c32'],[5,11,'#9c7a4a'],[10,1,'#7a5c32'],[1,14,'#9c7a4a']];
    for (const [x, y, c] of details) setPixel(ctx, x, y, c);
    return canvas;
  }

  drawSandTile() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#e8d5a3';
    ctx.fillRect(0, 0, 16, 16);
    const details = [[3,5,'#dcc48e'],[10,2,'#f0e0b3'],[7,10,'#dcc48e'],[14,8,'#f0e0b3'],[1,13,'#dcc48e']];
    for (const [x, y, c] of details) setPixel(ctx, x, y, c);
    return canvas;
  }

  drawStoneFloorTile() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(0, 0, 16, 16);
    // Grid lines
    fillRect(ctx, 0, 7, 16, 1, '#888');
    fillRect(ctx, 7, 0, 1, 16, '#888');
    // Highlight
    fillRect(ctx, 1, 1, 5, 1, '#aaa');
    fillRect(ctx, 9, 9, 5, 1, '#aaa');
    return canvas;
  }

  drawWoodFloorTile() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#b08050';
    ctx.fillRect(0, 0, 16, 16);
    // Planks
    fillRect(ctx, 0, 3, 16, 1, '#9a6a3a');
    fillRect(ctx, 0, 7, 16, 1, '#9a6a3a');
    fillRect(ctx, 0, 11, 16, 1, '#9a6a3a');
    fillRect(ctx, 0, 15, 16, 1, '#9a6a3a');
    // Grain
    setPixel(ctx, 4, 1, '#c09060');
    setPixel(ctx, 10, 5, '#c09060');
    setPixel(ctx, 2, 9, '#c09060');
    setPixel(ctx, 12, 13, '#c09060');
    return canvas;
  }

  drawBridgeTile() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#a07040';
    ctx.fillRect(0, 0, 16, 16);
    // Plank lines
    fillRect(ctx, 0, 0, 16, 1, '#8a5a30');
    fillRect(ctx, 0, 5, 16, 1, '#8a5a30');
    fillRect(ctx, 0, 10, 16, 1, '#8a5a30');
    fillRect(ctx, 0, 15, 16, 1, '#8a5a30');
    // Nails
    setPixel(ctx, 2, 2, '#666');
    setPixel(ctx, 13, 2, '#666');
    setPixel(ctx, 2, 7, '#666');
    setPixel(ctx, 13, 7, '#666');
    setPixel(ctx, 2, 12, '#666');
    setPixel(ctx, 13, 12, '#666');
    // Railing hints
    fillRect(ctx, 0, 0, 1, 16, '#6a4a20');
    fillRect(ctx, 15, 0, 1, 16, '#6a4a20');
    return canvas;
  }

  drawMetalFloorTile() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#8a8a9a';
    ctx.fillRect(0, 0, 16, 16);
    fillRect(ctx, 0, 0, 16, 1, '#7a7a8a');
    fillRect(ctx, 0, 0, 1, 16, '#7a7a8a');
    fillRect(ctx, 15, 0, 1, 16, '#9a9aaa');
    fillRect(ctx, 0, 15, 16, 1, '#9a9aaa');
    // Rivet
    setPixel(ctx, 2, 2, '#6a6a7a');
    setPixel(ctx, 13, 13, '#6a6a7a');
    return canvas;
  }

  drawCoralFloorTile() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#4a90c8';
    ctx.fillRect(0, 0, 16, 16);
    // Sandy bottom
    const details = [[3,12,'#c8a868'],[7,14,'#c8a868'],[11,13,'#c8a868'],[5,11,'#b89858']];
    for (const [x, y, c] of details) setPixel(ctx, x, y, c);
    return canvas;
  }

  // ============ CHARACTERS (16x24 sprite sheet, 4 dirs x 4 frames) ============
  generateCharacters() {
    this.characters.misa = this.drawCharacterSheet('misa');
    this.characters.kristinka = this.drawCharacterSheet('kristinka');
  }

  drawCharacterSheet(who) {
    // 4 columns (frames) x 4 rows (directions: down, left, right, up)
    const cols = 4, rows = 4;
    const { canvas, ctx } = createCanvas(CHAR_W * cols, CHAR_H * rows);
    for (let dir = 0; dir < 4; dir++) {
      for (let frame = 0; frame < 4; frame++) {
        ctx.save();
        ctx.translate(frame * CHAR_W, dir * CHAR_H);
        if (who === 'misa') {
          this.drawMisa(ctx, dir, frame);
        } else {
          this.drawKristinka(ctx, dir, frame);
        }
        ctx.restore();
      }
    }
    return canvas;
  }

  drawMisa(ctx, dir, frame) {
    // Míša - Blue wizard with star hat, wand
    const skin = '#fcd8b4';
    const hat = '#2855a8';
    const hatLight = '#3a6dc8';
    const robe = '#3060b8';
    const robeLight = '#4878d0';
    const robeDark = '#1e3a6e';
    const hair = '#6a4420';
    const star = '#ffd700';
    const shoe = '#5a3a1a';
    const wand = '#c8a040';

    const isWalk = frame === 1 || frame === 3;
    const legOff = frame === 1 ? -1 : (frame === 3 ? 1 : 0);

    if (dir === DIRECTIONS.DOWN) {
      // Hat
      fillRect(ctx, 6, 0, 4, 1, star); // Star on tip
      setPixel(ctx, 7, 0, '#ffe44d');
      fillRect(ctx, 5, 1, 6, 2, hat);
      fillRect(ctx, 4, 3, 8, 2, hat);
      fillRect(ctx, 3, 5, 10, 1, hatLight); // Brim
      // Face
      fillRect(ctx, 4, 6, 8, 6, skin);
      // Eyes
      fillRect(ctx, 5, 8, 2, 2, '#fff');
      fillRect(ctx, 9, 8, 2, 2, '#fff');
      setPixel(ctx, 6, 9, '#2a2a4a');
      setPixel(ctx, 10, 9, '#2a2a4a');
      // Smile
      setPixel(ctx, 6, 11, '#c87060');
      fillRect(ctx, 7, 11, 2, 1, '#c87060');
      setPixel(ctx, 9, 11, '#c87060');
      // Robe body
      fillRect(ctx, 3, 12, 10, 6, robe);
      fillRect(ctx, 4, 12, 8, 1, robeLight);
      // Arms
      fillRect(ctx, 2, 13, 1, 4, robe);
      fillRect(ctx, 13, 13, 1, 4, robe);
      // Wand in right hand
      fillRect(ctx, 14, 11, 1, 5, wand);
      setPixel(ctx, 14, 10, star);
      // Belt
      fillRect(ctx, 4, 16, 8, 1, robeDark);
      // Legs
      fillRect(ctx, 5 + legOff, 18, 3, 4, robeDark);
      fillRect(ctx, 8 - legOff, 18, 3, 4, robeDark);
      // Shoes
      fillRect(ctx, 5 + legOff, 22, 3, 2, shoe);
      fillRect(ctx, 8 - legOff, 22, 3, 2, shoe);
    } else if (dir === DIRECTIONS.UP) {
      // Hat from behind
      fillRect(ctx, 6, 0, 4, 1, hat);
      fillRect(ctx, 5, 1, 6, 2, hat);
      fillRect(ctx, 4, 3, 8, 2, hat);
      fillRect(ctx, 3, 5, 10, 1, hatLight);
      // Hair/head back
      fillRect(ctx, 4, 6, 8, 6, hair);
      // Robe
      fillRect(ctx, 3, 12, 10, 6, robe);
      fillRect(ctx, 2, 13, 1, 4, robe);
      fillRect(ctx, 13, 13, 1, 4, robe);
      fillRect(ctx, 4, 16, 8, 1, robeDark);
      // Legs
      fillRect(ctx, 5 - legOff, 18, 3, 4, robeDark);
      fillRect(ctx, 8 + legOff, 18, 3, 4, robeDark);
      fillRect(ctx, 5 - legOff, 22, 3, 2, shoe);
      fillRect(ctx, 8 + legOff, 22, 3, 2, shoe);
    } else {
      // Side view (LEFT or RIGHT)
      const flip = dir === DIRECTIONS.RIGHT;
      const ox = flip ? 0 : 0;
      // Hat
      fillRect(ctx, 5, 0, 3, 1, star);
      fillRect(ctx, 4, 1, 6, 2, hat);
      fillRect(ctx, 3, 3, 8, 2, hat);
      fillRect(ctx, 2, 5, 10, 1, hatLight);
      // Face
      fillRect(ctx, 4, 6, 7, 6, skin);
      // Eye
      if (flip) {
        fillRect(ctx, 8, 8, 2, 2, '#fff');
        setPixel(ctx, 9, 9, '#2a2a4a');
      } else {
        fillRect(ctx, 5, 8, 2, 2, '#fff');
        setPixel(ctx, 5, 9, '#2a2a4a');
      }
      // Mouth
      setPixel(ctx, flip ? 9 : 5, 11, '#c87060');
      // Robe
      fillRect(ctx, 4, 12, 8, 6, robe);
      fillRect(ctx, 4, 12, 7, 1, robeLight);
      // Arm with wand
      if (flip) {
        fillRect(ctx, 12, 13, 1, 4, robe);
        fillRect(ctx, 13, 12, 1, 5, wand);
        setPixel(ctx, 13, 11, star);
      } else {
        fillRect(ctx, 3, 13, 1, 4, robe);
        fillRect(ctx, 2, 12, 1, 5, wand);
        setPixel(ctx, 2, 11, star);
      }
      fillRect(ctx, 5, 16, 6, 1, robeDark);
      // Legs
      fillRect(ctx, 5 + legOff, 18, 3, 4, robeDark);
      fillRect(ctx, 7 - legOff, 18, 3, 4, robeDark);
      fillRect(ctx, 5 + legOff, 22, 3, 2, shoe);
      fillRect(ctx, 7 - legOff, 22, 3, 2, shoe);
    }
  }

  drawKristinka(ctx, dir, frame) {
    // Kristinka - Red artist with beret and palette
    const skin = '#fcd8b4';
    const beret = '#d43030';
    const beretLight = '#e85050';
    const dress = '#e83838';
    const dressLight = '#f05858';
    const dressDark = '#a02020';
    const hair = '#8a5030';
    const hairLight = '#a06840';
    const shoe = '#e8508a';
    const palette = '#e8c868';

    const isWalk = frame === 1 || frame === 3;
    const legOff = frame === 1 ? -1 : (frame === 3 ? 1 : 0);

    if (dir === DIRECTIONS.DOWN) {
      // Beret
      fillRect(ctx, 3, 2, 10, 3, beret);
      fillRect(ctx, 5, 1, 6, 1, beretLight);
      setPixel(ctx, 7, 0, beret); // Beret nub
      // Hair
      fillRect(ctx, 3, 5, 2, 4, hair);
      fillRect(ctx, 11, 5, 2, 4, hair);
      // Face
      fillRect(ctx, 4, 5, 8, 7, skin);
      // Eyes
      fillRect(ctx, 5, 7, 2, 2, '#fff');
      fillRect(ctx, 9, 7, 2, 2, '#fff');
      setPixel(ctx, 6, 8, '#2a2a4a');
      setPixel(ctx, 10, 8, '#2a2a4a');
      // Eyelashes
      setPixel(ctx, 5, 7, '#4a2a1a');
      setPixel(ctx, 9, 7, '#4a2a1a');
      // Cheeks
      setPixel(ctx, 4, 10, '#f0a8a0');
      setPixel(ctx, 11, 10, '#f0a8a0');
      // Smile
      fillRect(ctx, 6, 10, 4, 1, '#d06050');
      // Dress body
      fillRect(ctx, 3, 12, 10, 4, dress);
      fillRect(ctx, 4, 12, 8, 1, dressLight);
      // Skirt (wider at bottom)
      fillRect(ctx, 2, 16, 12, 3, dress);
      fillRect(ctx, 3, 16, 10, 1, dressDark);
      // Arms
      fillRect(ctx, 1, 13, 2, 3, skin);
      fillRect(ctx, 13, 13, 2, 3, skin);
      // Palette in left hand
      fillRect(ctx, 0, 14, 2, 2, palette);
      setPixel(ctx, 0, 14, '#e83838');
      setPixel(ctx, 1, 15, '#3878e8');
      // Legs
      fillRect(ctx, 5 + legOff, 19, 2, 3, skin);
      fillRect(ctx, 9 - legOff, 19, 2, 3, skin);
      // Shoes
      fillRect(ctx, 4 + legOff, 22, 3, 2, shoe);
      fillRect(ctx, 8 - legOff, 22, 3, 2, shoe);
    } else if (dir === DIRECTIONS.UP) {
      // Beret back
      fillRect(ctx, 3, 2, 10, 3, beret);
      fillRect(ctx, 5, 1, 6, 1, beret);
      setPixel(ctx, 7, 0, beret);
      // Hair from behind
      fillRect(ctx, 3, 5, 10, 7, hair);
      fillRect(ctx, 4, 5, 8, 2, hairLight);
      // Dress
      fillRect(ctx, 3, 12, 10, 4, dress);
      fillRect(ctx, 2, 16, 12, 3, dress);
      // Arms
      fillRect(ctx, 1, 13, 2, 3, skin);
      fillRect(ctx, 13, 13, 2, 3, skin);
      // Legs
      fillRect(ctx, 5 - legOff, 19, 2, 3, skin);
      fillRect(ctx, 9 + legOff, 19, 2, 3, skin);
      fillRect(ctx, 4 - legOff, 22, 3, 2, shoe);
      fillRect(ctx, 8 + legOff, 22, 3, 2, shoe);
    } else {
      const flip = dir === DIRECTIONS.RIGHT;
      // Beret
      fillRect(ctx, 3, 2, 9, 3, beret);
      fillRect(ctx, 5, 1, 5, 1, beretLight);
      setPixel(ctx, 7, 0, beret);
      // Hair
      if (flip) {
        fillRect(ctx, 3, 5, 3, 5, hair);
      } else {
        fillRect(ctx, 9, 5, 3, 5, hair);
      }
      // Face
      fillRect(ctx, 4, 5, 7, 7, skin);
      // Eye
      if (flip) {
        fillRect(ctx, 8, 7, 2, 2, '#fff');
        setPixel(ctx, 9, 8, '#2a2a4a');
        setPixel(ctx, 8, 7, '#4a2a1a');
      } else {
        fillRect(ctx, 5, 7, 2, 2, '#fff');
        setPixel(ctx, 5, 8, '#2a2a4a');
        setPixel(ctx, 6, 7, '#4a2a1a');
      }
      // Cheek
      setPixel(ctx, flip ? 9 : 4, 10, '#f0a8a0');
      setPixel(ctx, flip ? 9 : 5, 10, '#d06050');
      // Dress
      fillRect(ctx, 4, 12, 8, 4, dress);
      fillRect(ctx, 3, 16, 10, 3, dress);
      fillRect(ctx, 4, 12, 7, 1, dressLight);
      // Arm + palette
      if (flip) {
        fillRect(ctx, 12, 13, 2, 3, skin);
        fillRect(ctx, 13, 14, 2, 2, palette);
      } else {
        fillRect(ctx, 2, 13, 2, 3, skin);
        fillRect(ctx, 0, 14, 2, 2, palette);
      }
      fillRect(ctx, 4, 16, 8, 1, dressDark);
      // Legs
      fillRect(ctx, 5 + legOff, 19, 2, 3, skin);
      fillRect(ctx, 8 - legOff, 19, 2, 3, skin);
      fillRect(ctx, 4 + legOff, 22, 3, 2, shoe);
      fillRect(ctx, 7 - legOff, 22, 3, 2, shoe);
    }
  }

  // ============ DECORATIONS ============
  generateDecorations() {
    this.decorations.tree = this.drawTree('#4a8a30', '#5ca040', '#3a6a20');
    this.decorations.tree_dark = this.drawTree('#2a5a2a', '#387038', '#1a3a1a');
    this.decorations.tree_pine = this.drawPineTree();
    this.decorations.flower_red = this.drawFlower('#e83838', '#ff5050');
    this.decorations.flower_yellow = this.drawFlower('#f0d030', '#ffe850');
    this.decorations.flower_blue = this.drawFlower('#3878d8', '#58a0f0');
    this.decorations.flower_purple = this.drawFlower('#9838d8', '#b858f0');
    this.decorations.rock = this.drawRock();
    this.decorations.rock_big = this.drawBigRock();
    this.decorations.bush = this.drawBush();
    this.decorations.mushroom_red = this.drawMushroom('#e83838', '#fff');
    this.decorations.mushroom_blue = this.drawMushroom('#3878d8', '#c8d8ff');
    this.decorations.sign = this.drawSign();
    this.decorations.stump = this.drawStump();
    this.decorations.well = this.drawWell();
    this.decorations.portal = this.drawPortalFrames();
    this.decorations.house = this.drawHouse();
    this.decorations.fence_h = this.drawFenceH();
    this.decorations.fence_v = this.drawFenceV();
    this.decorations.fairy_light = this.drawFairyLight();
    this.decorations.animal_bunny = this.drawBunny();
    this.decorations.animal_fox = this.drawFox();
    this.decorations.vine = this.drawVine();
    this.decorations.coral_pink = this.drawCoral('#ff69b4', '#ff89c4');
    this.decorations.coral_blue = this.drawCoral('#40c0d8', '#60e0f0');
    this.decorations.shell = this.drawShell();
    this.decorations.starfish = this.drawStarfish();
  }

  drawTree(c1, c2, c3) {
    // 32x32 tree (takes 2x2 tile space, drawn from center bottom)
    const { canvas, ctx } = createCanvas(32, 32);
    // Trunk
    fillRect(ctx, 13, 20, 6, 12, '#8a5a30');
    fillRect(ctx, 14, 20, 4, 12, '#a06a38');
    // Shadow on trunk
    fillRect(ctx, 13, 20, 1, 12, '#6a4020');
    // Crown (round)
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = x - 16, dy = y - 10;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) {
          const n = Math.sin(x * 2.3 + y * 1.7) * 0.5 + 0.5;
          ctx.fillStyle = n > 0.6 ? c2 : (n > 0.3 ? c1 : c3);
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Highlights
    fillRect(ctx, 10, 4, 3, 2, c2);
    fillRect(ctx, 18, 6, 2, 2, c2);
    return canvas;
  }

  drawPineTree() {
    const { canvas, ctx } = createCanvas(32, 32);
    // Trunk
    fillRect(ctx, 14, 24, 4, 8, '#8a5a30');
    fillRect(ctx, 15, 24, 2, 8, '#a06a38');
    // Triangular layers
    const layers = [
      { y: 4, w: 4, h: 7, c: '#2a6a2a' },
      { y: 9, w: 8, h: 7, c: '#3a8a3a' },
      { y: 15, w: 12, h: 7, c: '#2a6a2a' },
      { y: 20, w: 14, h: 5, c: '#3a8a3a' },
    ];
    for (const l of layers) {
      for (let row = 0; row < l.h; row++) {
        const w = Math.round(l.w * (1 - row / l.h / 2));
        fillRect(ctx, 16 - Math.floor(w / 2), l.y + row, w, 1, l.c);
      }
    }
    // Snow/highlight on tips
    setPixel(ctx, 16, 4, '#8ac880');
    setPixel(ctx, 14, 10, '#8ac880');
    setPixel(ctx, 18, 10, '#8ac880');
    return canvas;
  }

  drawFlower(c1, c2) {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    // Stem
    fillRect(ctx, 7, 8, 2, 7, '#3a8a30');
    // Leaf
    fillRect(ctx, 9, 11, 3, 2, '#4a9a40');
    // Petals
    setPixel(ctx, 7, 4, c1);
    setPixel(ctx, 8, 4, c1);
    setPixel(ctx, 6, 5, c1);
    setPixel(ctx, 9, 5, c1);
    setPixel(ctx, 6, 6, c1);
    setPixel(ctx, 9, 6, c1);
    setPixel(ctx, 7, 7, c1);
    setPixel(ctx, 8, 7, c1);
    // Center
    fillRect(ctx, 7, 5, 2, 2, c2);
    return canvas;
  }

  drawRock() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    fillRect(ctx, 4, 8, 8, 6, '#8a8a8a');
    fillRect(ctx, 5, 7, 6, 1, '#9a9a9a');
    fillRect(ctx, 5, 14, 6, 1, '#7a7a7a');
    // Highlight
    setPixel(ctx, 6, 8, '#aaa');
    setPixel(ctx, 7, 8, '#aaa');
    // Shadow
    fillRect(ctx, 4, 13, 8, 1, '#6a6a6a');
    return canvas;
  }

  drawBigRock() {
    const { canvas, ctx } = createCanvas(32, 24);
    // Main body
    for (let y = 4; y < 20; y++) {
      for (let x = 3; x < 29; x++) {
        const dx = x - 16, dy = y - 12;
        if (dx * dx / 169 + dy * dy / 64 < 1) {
          const n = Math.sin(x * 1.5 + y * 2.1) * 0.3 + 0.5;
          ctx.fillStyle = n > 0.5 ? '#9a9a9a' : '#8a8a8a';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Highlight
    fillRect(ctx, 10, 6, 4, 2, '#aaa');
    // Crack
    setPixel(ctx, 18, 10, '#6a6a6a');
    setPixel(ctx, 19, 11, '#6a6a6a');
    setPixel(ctx, 18, 12, '#6a6a6a');
    return canvas;
  }

  drawBush() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    for (let y = 4; y < 14; y++) {
      for (let x = 2; x < 14; x++) {
        const dx = x - 8, dy = y - 9;
        if (dx * dx / 36 + dy * dy / 25 < 1) {
          const n = Math.sin(x * 2 + y * 3) * 0.3 + 0.5;
          ctx.fillStyle = n > 0.5 ? '#4a9848' : '#3a8038';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Berries
    setPixel(ctx, 5, 7, '#e83838');
    setPixel(ctx, 10, 9, '#e83838');
    setPixel(ctx, 8, 6, '#e83838');
    return canvas;
  }

  drawMushroom(capColor, spotColor) {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    // Stem
    fillRect(ctx, 6, 10, 4, 5, '#f0e0c8');
    // Cap
    fillRect(ctx, 3, 6, 10, 5, capColor);
    fillRect(ctx, 4, 5, 8, 1, capColor);
    // Spots
    setPixel(ctx, 5, 7, spotColor);
    setPixel(ctx, 9, 8, spotColor);
    setPixel(ctx, 7, 6, spotColor);
    return canvas;
  }

  drawSign() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    // Post
    fillRect(ctx, 7, 6, 2, 10, '#8a6a30');
    // Board
    fillRect(ctx, 2, 3, 12, 6, '#c8a050');
    fillRect(ctx, 3, 4, 10, 4, '#d8b060');
    // Text hint (just a line)
    fillRect(ctx, 4, 5, 8, 1, '#6a4a10');
    return canvas;
  }

  drawStump() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    fillRect(ctx, 4, 8, 8, 6, '#8a5a30');
    fillRect(ctx, 3, 7, 10, 2, '#a06a38');
    // Top rings
    fillRect(ctx, 5, 7, 6, 1, '#c8a060');
    setPixel(ctx, 7, 7, '#a08040');
    return canvas;
  }

  drawWell() {
    const { canvas, ctx } = createCanvas(32, 32);
    // Stone base
    fillRect(ctx, 4, 16, 24, 12, '#8a8a8a');
    fillRect(ctx, 6, 14, 20, 2, '#9a9a9a');
    // Inner dark
    fillRect(ctx, 8, 16, 16, 6, '#2a3a5a');
    // Roof posts
    fillRect(ctx, 6, 4, 2, 12, '#8a5a30');
    fillRect(ctx, 24, 4, 2, 12, '#8a5a30');
    // Roof
    fillRect(ctx, 4, 2, 24, 4, '#b04020');
    fillRect(ctx, 6, 1, 20, 1, '#c05030');
    // Bucket
    fillRect(ctx, 14, 8, 4, 3, '#6a4a2a');
    // Rope
    fillRect(ctx, 15, 4, 1, 4, '#a08860');
    return canvas;
  }

  drawHouse() {
    const { canvas, ctx } = createCanvas(48, 48);
    // Walls
    fillRect(ctx, 6, 20, 36, 24, '#e8d8b0');
    fillRect(ctx, 8, 22, 32, 20, '#f0e0c0');
    // Roof
    for (let row = 0; row < 14; row++) {
      const w = 42 - row;
      fillRect(ctx, Math.floor((48 - w) / 2), 8 + row, w, 1, row % 2 === 0 ? '#c04030' : '#b03828');
    }
    // Door
    fillRect(ctx, 19, 30, 10, 14, '#8a5a30');
    fillRect(ctx, 20, 31, 8, 12, '#a06a38');
    setPixel(ctx, 26, 37, '#ffd700'); // Knob
    // Windows
    fillRect(ctx, 10, 26, 6, 6, '#88c8f8');
    fillRect(ctx, 32, 26, 6, 6, '#88c8f8');
    fillRect(ctx, 12, 26, 1, 6, '#6a4a2a');
    fillRect(ctx, 10, 28, 6, 1, '#6a4a2a');
    fillRect(ctx, 34, 26, 1, 6, '#6a4a2a');
    fillRect(ctx, 32, 28, 6, 1, '#6a4a2a');
    return canvas;
  }

  drawFenceH() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    fillRect(ctx, 0, 6, 16, 2, '#b08050');
    fillRect(ctx, 0, 10, 16, 2, '#b08050');
    fillRect(ctx, 1, 4, 2, 10, '#a07040');
    fillRect(ctx, 13, 4, 2, 10, '#a07040');
    return canvas;
  }

  drawFenceV() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    fillRect(ctx, 6, 0, 2, 16, '#b08050');
    fillRect(ctx, 10, 0, 2, 16, '#b08050');
    fillRect(ctx, 4, 1, 10, 2, '#a07040');
    fillRect(ctx, 4, 13, 10, 2, '#a07040');
    return canvas;
  }

  drawPortalFrames() {
    const frames = [];
    for (let f = 0; f < 8; f++) {
      const { canvas, ctx } = createCanvas(32, 32);
      const t = f / 8;
      // Outer glow
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const dx = x - 16, dy = y - 16;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 14 && dist > 4) {
            const angle = Math.atan2(dy, dx) + t * Math.PI * 2;
            const glow = Math.sin(angle * 3 + dist * 0.5) * 0.3 + 0.5;
            if (glow > 0.3) {
              const alpha = Math.floor((1 - dist / 14) * glow * 255);
              const hue = (angle / Math.PI * 180 + t * 360) % 360;
              const r = Math.floor(128 + Math.sin(hue * Math.PI / 180) * 80);
              const g = Math.floor(60 + Math.sin((hue + 120) * Math.PI / 180) * 40);
              const b = Math.floor(200 + Math.sin((hue + 240) * Math.PI / 180) * 55);
              ctx.fillStyle = `rgba(${r},${g},${b},${alpha / 255})`;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      }
      // Inner bright core
      for (let y = 8; y < 24; y++) {
        for (let x = 8; x < 24; x++) {
          const dx = x - 16, dy = y - 16;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 6) {
            const brightness = 1 - dist / 6;
            const pulse = Math.sin(t * Math.PI * 2 + dist) * 0.2 + 0.8;
            const a = Math.floor(brightness * pulse * 200);
            ctx.fillStyle = `rgba(200,150,255,${a / 255})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      frames.push(canvas);
    }
    return frames;
  }

  drawFairyLight() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    // Tiny glowing orb
    const cx = 8, cy = 8;
    for (let y = 4; y < 12; y++) {
      for (let x = 4; x < 12; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 4) {
          const a = 1 - dist / 4;
          ctx.fillStyle = `rgba(255,255,180,${a})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    setPixel(ctx, 8, 8, '#ffffc0');
    return canvas;
  }

  drawBunny() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    // Body
    fillRect(ctx, 5, 9, 6, 5, '#e8e0d0');
    // Head
    fillRect(ctx, 6, 6, 5, 4, '#e8e0d0');
    // Ears
    fillRect(ctx, 7, 2, 1, 4, '#e8e0d0');
    fillRect(ctx, 10, 2, 1, 4, '#e8e0d0');
    setPixel(ctx, 7, 3, '#f0b0a0');
    setPixel(ctx, 10, 3, '#f0b0a0');
    // Eye
    setPixel(ctx, 8, 7, '#2a2a2a');
    // Tail
    setPixel(ctx, 11, 10, '#fff');
    return canvas;
  }

  drawFox() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    // Body
    fillRect(ctx, 3, 9, 8, 5, '#e87830');
    // Head
    fillRect(ctx, 5, 5, 6, 5, '#e87830');
    // Ears
    fillRect(ctx, 5, 3, 2, 3, '#e87830');
    fillRect(ctx, 9, 3, 2, 3, '#e87830');
    // Snout
    fillRect(ctx, 7, 8, 2, 2, '#f0e0c8');
    setPixel(ctx, 7, 8, '#2a2a2a'); // Nose
    // Eye
    setPixel(ctx, 7, 6, '#2a2a2a');
    // Tail
    fillRect(ctx, 11, 8, 3, 2, '#e87830');
    fillRect(ctx, 13, 7, 2, 2, '#f0a030');
    setPixel(ctx, 14, 7, '#fff');
    return canvas;
  }

  drawVine() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    setPixel(ctx, 8, 0, '#3a7030');
    setPixel(ctx, 7, 1, '#3a7030');
    setPixel(ctx, 8, 2, '#4a8040');
    setPixel(ctx, 9, 3, '#3a7030');
    setPixel(ctx, 8, 4, '#4a8040');
    setPixel(ctx, 7, 5, '#3a7030');
    setPixel(ctx, 7, 6, '#4a8040');
    setPixel(ctx, 8, 7, '#3a7030');
    // Leaves
    fillRect(ctx, 5, 3, 2, 2, '#5a9848');
    fillRect(ctx, 10, 5, 2, 2, '#5a9848');
    return canvas;
  }

  drawCoral(c1, c2) {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    fillRect(ctx, 6, 10, 4, 6, c1);
    fillRect(ctx, 4, 6, 2, 6, c1);
    fillRect(ctx, 10, 7, 2, 5, c1);
    fillRect(ctx, 3, 4, 3, 3, c2);
    fillRect(ctx, 9, 5, 3, 3, c2);
    fillRect(ctx, 6, 8, 4, 2, c2);
    return canvas;
  }

  drawShell() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    fillRect(ctx, 5, 9, 6, 4, '#ffd0a0');
    fillRect(ctx, 6, 8, 4, 1, '#ffe0b0');
    fillRect(ctx, 7, 7, 2, 1, '#ffe0b0');
    // Ridges
    setPixel(ctx, 6, 10, '#e8b880');
    setPixel(ctx, 8, 10, '#e8b880');
    setPixel(ctx, 10, 10, '#e8b880');
    return canvas;
  }

  drawStarfish() {
    const { canvas, ctx } = createCanvas(TILE_SIZE, TILE_SIZE);
    const c = '#e87838';
    setPixel(ctx, 8, 5, c);
    fillRect(ctx, 7, 6, 3, 1, c);
    fillRect(ctx, 5, 7, 7, 2, c);
    fillRect(ctx, 4, 8, 2, 2, c);
    fillRect(ctx, 11, 8, 2, 2, c);
    fillRect(ctx, 6, 9, 5, 2, c);
    fillRect(ctx, 5, 11, 2, 2, c);
    fillRect(ctx, 10, 11, 2, 2, c);
    setPixel(ctx, 8, 8, '#f0a060'); // Center
    return canvas;
  }

  // ============ PORTRAITS (64x64 for character select) ============
  generatePortraits() {
    this.portraits.misa = this.drawPortrait('misa');
    this.portraits.kristinka = this.drawPortrait('kristinka');
  }

  drawPortrait(who) {
    const { canvas, ctx } = createCanvas(64, 64);
    const isMisa = who === 'misa';
    const skin = '#fcd8b4';

    // Background circle
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const dx = x - 32, dy = y - 32;
        if (dx * dx + dy * dy < 900) {
          ctx.fillStyle = isMisa ? '#1a3060' : '#601020';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    if (isMisa) {
      // Hat
      fillRect(ctx, 26, 4, 12, 4, '#ffd700'); // Star
      fillRect(ctx, 22, 8, 20, 6, '#2855a8');
      fillRect(ctx, 18, 14, 28, 4, '#3a6dc8');
      // Face
      fillRect(ctx, 20, 18, 24, 20, skin);
      // Eyes
      fillRect(ctx, 24, 24, 5, 5, '#fff');
      fillRect(ctx, 35, 24, 5, 5, '#fff');
      fillRect(ctx, 26, 26, 3, 3, '#2a2a6a');
      fillRect(ctx, 37, 26, 3, 3, '#2a2a6a');
      setPixel(ctx, 27, 27, '#111');
      setPixel(ctx, 38, 27, '#111');
      // Smile
      fillRect(ctx, 26, 33, 12, 2, '#c87060');
      fillRect(ctx, 28, 35, 8, 1, '#c87060');
      // Robe collar
      fillRect(ctx, 18, 38, 28, 10, '#3060b8');
      fillRect(ctx, 20, 38, 24, 2, '#4878d0');
      // Wand
      fillRect(ctx, 48, 30, 3, 16, '#c8a040');
      fillRect(ctx, 47, 28, 5, 4, '#ffd700');
    } else {
      // Beret
      fillRect(ctx, 20, 8, 24, 8, '#d43030');
      fillRect(ctx, 24, 6, 16, 4, '#e85050');
      setPixel(ctx, 31, 4, '#d43030');
      setPixel(ctx, 32, 4, '#d43030');
      // Hair
      fillRect(ctx, 18, 16, 6, 12, '#8a5030');
      fillRect(ctx, 40, 16, 6, 12, '#8a5030');
      // Face
      fillRect(ctx, 20, 16, 24, 22, skin);
      // Eyes
      fillRect(ctx, 24, 22, 5, 5, '#fff');
      fillRect(ctx, 35, 22, 5, 5, '#fff');
      fillRect(ctx, 26, 24, 3, 3, '#2a2a6a');
      fillRect(ctx, 37, 24, 3, 3, '#2a2a6a');
      setPixel(ctx, 27, 25, '#111');
      setPixel(ctx, 38, 25, '#111');
      // Eyelashes
      fillRect(ctx, 24, 22, 5, 1, '#4a2a1a');
      fillRect(ctx, 35, 22, 5, 1, '#4a2a1a');
      // Cheeks
      fillRect(ctx, 22, 30, 3, 2, '#f0a8a0');
      fillRect(ctx, 39, 30, 3, 2, '#f0a8a0');
      // Smile
      fillRect(ctx, 27, 32, 10, 2, '#d06050');
      fillRect(ctx, 29, 34, 6, 1, '#d06050');
      // Dress collar
      fillRect(ctx, 18, 38, 28, 10, '#e83838');
      fillRect(ctx, 20, 38, 24, 2, '#f05858');
      // Palette
      fillRect(ctx, 8, 40, 12, 8, '#e8c868');
      fillRect(ctx, 10, 42, 2, 2, '#e83838');
      fillRect(ctx, 14, 42, 2, 2, '#3878e8');
      fillRect(ctx, 12, 44, 2, 2, '#4ac848');
    }

    return canvas;
  }

  // ============ NPC (Rozumělka) ============
  generateNPC() {
    this.npcSprites.rozumelka = this.drawRozumelkaSheet();
  }

  drawRozumelkaSheet() {
    // Simple 2-frame idle animation, facing down only
    const { canvas, ctx } = createCanvas(CHAR_W * 2, CHAR_H);
    for (let f = 0; f < 2; f++) {
      ctx.save();
      ctx.translate(f * CHAR_W, 0);
      this.drawRozumelka(ctx, f);
      ctx.restore();
    }
    return canvas;
  }

  drawRozumelka(ctx, frame) {
    const skin = '#fcd8b4';
    const robe = '#8848c8';
    const robeLight = '#a068e0';
    const glasses = '#ffd700';
    const bob = frame === 1 ? 1 : 0;

    // Hair/head covering
    fillRect(ctx, 4, 2 + bob, 8, 3, '#888');
    // Face
    fillRect(ctx, 4, 4 + bob, 8, 7, skin);
    // Glasses
    fillRect(ctx, 4, 6 + bob, 3, 3, glasses);
    fillRect(ctx, 9, 6 + bob, 3, 3, glasses);
    fillRect(ctx, 7, 7 + bob, 2, 1, glasses);
    // Eyes behind glasses
    setPixel(ctx, 5, 7 + bob, '#2a2a4a');
    setPixel(ctx, 10, 7 + bob, '#2a2a4a');
    // Smile
    fillRect(ctx, 6, 10 + bob, 4, 1, '#c87060');
    // Robe
    fillRect(ctx, 3, 11 + bob, 10, 6, robe);
    fillRect(ctx, 4, 11 + bob, 8, 1, robeLight);
    // Book in hand
    fillRect(ctx, 1, 13, 3, 4, '#4a6a9a');
    fillRect(ctx, 1, 13, 3, 1, '#6a8aba');
    // Other arm
    fillRect(ctx, 13, 13, 2, 3, robe);
    // Belt
    fillRect(ctx, 4, 16 + bob, 8, 1, '#6030a0');
    // Legs
    fillRect(ctx, 5, 17 + bob, 3, 4, '#5030a0');
    fillRect(ctx, 8, 17 + bob, 3, 4, '#5030a0');
    // Shoes
    fillRect(ctx, 5, 21 + bob, 3, 3, '#3a2a1a');
    fillRect(ctx, 8, 21 + bob, 3, 3, '#3a2a1a');
  }

  // ============ UI SPRITES ============
  generateUI() {
    this.uiSprites.star = this.drawStar();
    this.uiSprites.heart = this.drawHeart();
    this.uiSprites.arrow_up = this.drawArrow(0);
    this.uiSprites.arrow_down = this.drawArrow(1);
    this.uiSprites.arrow_left = this.drawArrow(2);
    this.uiSprites.arrow_right = this.drawArrow(3);
    this.uiSprites.btn_interact = this.drawInteractBtn();
    this.uiSprites.btn_jump = this.drawJumpBtn();
  }

  drawStar() {
    const { canvas, ctx } = createCanvas(16, 16);
    const c = '#ffd700';
    const d = '#e8a800';
    // 5-pointed star shape
    setPixel(ctx, 7, 1, c); setPixel(ctx, 8, 1, c);
    setPixel(ctx, 7, 2, c); setPixel(ctx, 8, 2, c);
    fillRect(ctx, 6, 3, 4, 2, c);
    fillRect(ctx, 2, 5, 12, 2, c);
    fillRect(ctx, 3, 7, 10, 2, c);
    fillRect(ctx, 4, 9, 8, 1, c);
    fillRect(ctx, 3, 10, 4, 2, c);
    fillRect(ctx, 9, 10, 4, 2, c);
    fillRect(ctx, 2, 12, 3, 2, d);
    fillRect(ctx, 11, 12, 3, 2, d);
    return canvas;
  }

  drawHeart() {
    const { canvas, ctx } = createCanvas(16, 16);
    const c = '#e83838';
    fillRect(ctx, 2, 4, 4, 3, c);
    fillRect(ctx, 10, 4, 4, 3, c);
    fillRect(ctx, 1, 5, 6, 4, c);
    fillRect(ctx, 9, 5, 6, 4, c);
    fillRect(ctx, 2, 9, 12, 2, c);
    fillRect(ctx, 3, 11, 10, 1, c);
    fillRect(ctx, 4, 12, 8, 1, c);
    fillRect(ctx, 5, 13, 6, 1, c);
    fillRect(ctx, 6, 14, 4, 1, c);
    fillRect(ctx, 7, 15, 2, 1, c);
    return canvas;
  }

  drawArrow(dir) {
    // dir: 0=up, 1=down, 2=left, 3=right
    const { canvas, ctx } = createCanvas(16, 16);
    ctx.fillStyle = '#fff';
    if (dir === 0) { // up
      fillRect(ctx, 7, 2, 2, 12, '#fff');
      for (let i = 0; i < 4; i++) fillRect(ctx, 7 - i, 2 + i, 1, 1, '#fff');
      for (let i = 0; i < 4; i++) fillRect(ctx, 8 + i, 2 + i, 1, 1, '#fff');
    } else if (dir === 1) { // down
      fillRect(ctx, 7, 2, 2, 12, '#fff');
      for (let i = 0; i < 4; i++) fillRect(ctx, 7 - i, 13 - i, 1, 1, '#fff');
      for (let i = 0; i < 4; i++) fillRect(ctx, 8 + i, 13 - i, 1, 1, '#fff');
    } else if (dir === 2) { // left
      fillRect(ctx, 2, 7, 12, 2, '#fff');
      for (let i = 0; i < 4; i++) fillRect(ctx, 2 + i, 7 - i, 1, 1, '#fff');
      for (let i = 0; i < 4; i++) fillRect(ctx, 2 + i, 8 + i, 1, 1, '#fff');
    } else { // right
      fillRect(ctx, 2, 7, 12, 2, '#fff');
      for (let i = 0; i < 4; i++) fillRect(ctx, 13 - i, 7 - i, 1, 1, '#fff');
      for (let i = 0; i < 4; i++) fillRect(ctx, 13 - i, 8 + i, 1, 1, '#fff');
    }
    return canvas;
  }

  drawInteractBtn() {
    const { canvas, ctx } = createCanvas(16, 16);
    // "E" letter
    fillRect(ctx, 4, 3, 8, 10, '#f0a020');
    fillRect(ctx, 5, 4, 6, 1, '#fff');
    fillRect(ctx, 5, 7, 5, 1, '#fff');
    fillRect(ctx, 5, 11, 6, 1, '#fff');
    fillRect(ctx, 5, 4, 1, 8, '#fff');
    return canvas;
  }

  drawJumpBtn() {
    const { canvas, ctx } = createCanvas(16, 16);
    // Jump arrow
    fillRect(ctx, 3, 4, 10, 8, '#40b840');
    fillRect(ctx, 7, 2, 2, 3, '#fff');
    for (let i = 0; i < 3; i++) {
      setPixel(ctx, 7 - i - 1, 4 + i, '#fff');
      setPixel(ctx, 8 + i + 1, 4 + i, '#fff');
    }
    fillRect(ctx, 6, 8, 4, 2, '#fff');
    return canvas;
  }

  // ============ GET METHODS ============
  getTile(name, frame = 0) {
    const t = this.tiles[name];
    if (Array.isArray(t)) return t[frame % t.length];
    return t;
  }

  getCharacter(role) {
    return role === 'mathematician' ? this.characters.misa : this.characters.kristinka;
  }

  getDecoration(type) {
    const d = this.decorations[type];
    if (Array.isArray(d)) return d;
    return d;
  }

  getPortrait(role) {
    return role === 'mathematician' ? this.portraits.misa : this.portraits.kristinka;
  }

  getNPC(name) {
    return this.npcSprites[name];
  }
}
