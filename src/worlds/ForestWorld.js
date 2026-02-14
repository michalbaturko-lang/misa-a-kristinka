import { TILES, DECOR } from '../utils/constants.js';

/**
 * Forest World - "Magický Les"
 * Dark green forest with river, bridge puzzle, animals, fairy lights.
 * Size: 50x40 tiles
 */
export function buildForestWorld() {
  const W = 50, H = 40;
  const tiles = [];

  for (let y = 0; y < H; y++) {
    tiles[y] = [];
    for (let x = 0; x < W; x++) tiles[y][x] = TILES.GRASS_DARK;
  }

  // Border
  for (let x = 0; x < W; x++) { tiles[0][x] = TILES.EMPTY; tiles[H - 1][x] = TILES.EMPTY; }
  for (let y = 0; y < H; y++) { tiles[y][0] = TILES.EMPTY; tiles[y][W - 1] = TILES.EMPTY; }

  // River (x≈25, winding)
  for (let y = 0; y < H; y++) {
    const rx = 25 + Math.round(Math.sin(y * 0.3) * 3);
    for (let dx = -2; dx <= 2; dx++) {
      const x = rx + dx;
      if (x > 0 && x < W - 1) tiles[y][x] = TILES.WATER;
    }
  }

  // Bridge at y≈20
  for (let dx = -3; dx <= 3; dx++) {
    const bx = 25 + Math.round(Math.sin(20 * 0.3) * 3) + dx;
    if (bx > 0 && bx < W - 1) {
      tiles[19][bx] = TILES.BRIDGE; tiles[20][bx] = TILES.BRIDGE; tiles[21][bx] = TILES.BRIDGE;
    }
  }

  // Paths
  for (let x = 2; x < 23; x++) { tiles[20][x] = TILES.PATH; tiles[21][x] = TILES.PATH; }
  for (let x = 28; x < 48; x++) { tiles[20][x] = TILES.PATH; tiles[21][x] = TILES.PATH; }
  for (let y = 5; y < 35; y++) { tiles[y][10] = TILES.PATH; tiles[y][11] = TILES.PATH; }

  // Dirt clearing
  for (let y = 28; y < 33; y++)
    for (let x = 6; x < 14; x++) tiles[y][x] = TILES.DIRT;

  // Flower spots
  const fl = [[36,9],[39,11],[41,9],[37,12],[42,10],[8,6],[14,34],[40,32]];
  for (const [x, y] of fl) if (tiles[y] && tiles[y][x] === TILES.GRASS_DARK) tiles[y][x] = TILES.GRASS_FLOWER;

  const decorations = [
    { type: DECOR.TREE_DARK, x: 3, y: 3 }, { type: DECOR.TREE_DARK, x: 7, y: 5 },
    { type: DECOR.TREE_PINE, x: 5, y: 8 }, { type: DECOR.TREE_DARK, x: 2, y: 12 },
    { type: DECOR.TREE_PINE, x: 8, y: 10 }, { type: DECOR.TREE_DARK, x: 4, y: 16 },
    { type: DECOR.TREE_DARK, x: 14, y: 5 }, { type: DECOR.TREE_PINE, x: 17, y: 3 },
    { type: DECOR.TREE_DARK, x: 15, y: 10 }, { type: DECOR.TREE_DARK, x: 18, y: 8 },
    { type: DECOR.TREE_DARK, x: 3, y: 24 }, { type: DECOR.TREE_PINE, x: 6, y: 35 },
    { type: DECOR.TREE_DARK, x: 14, y: 30 }, { type: DECOR.TREE_DARK, x: 17, y: 25 },
    { type: DECOR.TREE_PINE, x: 19, y: 33 }, { type: DECOR.TREE_DARK, x: 32, y: 3 },
    { type: DECOR.TREE_PINE, x: 38, y: 5 }, { type: DECOR.TREE_DARK, x: 44, y: 4 },
    { type: DECOR.TREE_DARK, x: 34, y: 15 }, { type: DECOR.TREE_PINE, x: 40, y: 18 },
    { type: DECOR.TREE_DARK, x: 46, y: 12 }, { type: DECOR.TREE_DARK, x: 33, y: 28 },
    { type: DECOR.TREE_PINE, x: 42, y: 30 }, { type: DECOR.TREE_DARK, x: 45, y: 25 },
    { type: DECOR.TREE_DARK, x: 38, y: 35 },
    { type: DECOR.MUSHROOM_RED, x: 6, y: 14 }, { type: DECOR.MUSHROOM_BLUE, x: 16, y: 7 },
    { type: DECOR.MUSHROOM_RED, x: 36, y: 22 }, { type: DECOR.MUSHROOM_BLUE, x: 43, y: 28 },
    { type: DECOR.FAIRY_LIGHT, x: 9, y: 7 }, { type: DECOR.FAIRY_LIGHT, x: 13, y: 12 },
    { type: DECOR.FAIRY_LIGHT, x: 6, y: 18 }, { type: DECOR.FAIRY_LIGHT, x: 37, y: 10 },
    { type: DECOR.FAIRY_LIGHT, x: 41, y: 16 },
    { type: DECOR.ANIMAL_BUNNY, x: 12, y: 15 }, { type: DECOR.ANIMAL_FOX, x: 40, y: 10 },
    { type: DECOR.ANIMAL_BUNNY, x: 35, y: 32 },
    { type: DECOR.FLOWER_PURPLE, x: 36, y: 9 }, { type: DECOR.FLOWER_BLUE, x: 39, y: 11 },
    { type: DECOR.FLOWER_PURPLE, x: 41, y: 9 },
    { type: DECOR.ROCK, x: 22, y: 10 }, { type: DECOR.ROCK, x: 29, y: 15 },
    { type: DECOR.ROCK_BIG, x: 22, y: 30 },
    { type: DECOR.STUMP, x: 16, y: 18 }, { type: DECOR.STUMP, x: 8, y: 27 },
    { type: DECOR.VINE, x: 4, y: 9 }, { type: DECOR.VINE, x: 13, y: 6 }, { type: DECOR.VINE, x: 35, y: 7 },
  ];

  return {
    name: 'Magický Les',
    width: W, height: H, tiles, decorations,
    portals: [{ x: 2, y: 20, targetWorld: 'hub', label: 'Zpět' }],
    npcs: [{
      npcType: 'rozumelka', x: 8, y: 20, canInteract: true,
      dialogs: [
        'Vítejte v Magickém lese!',
        'Řeka vám brání v cestě. Musíte postavit most!',
        'Míšo, spočítej délku prken. Kristinko, namaluj na ně vzor!',
      ],
    }],
    puzzles: [{ id: 'forest_bridge', x: 10, y: 29, name: 'Most přes řeku', type: 'bridge' }],
    spawnX: 4, spawnY: 20, bgColor: '#1a4a2a', skyColor: '#4a7a5a',
  };
}
