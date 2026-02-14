import { TILES, DECOR } from '../utils/constants.js';

/**
 * Hub World - "Louka Harmonie"
 * Green meadow with tree in center, 3 portal gates, Rozumělka NPC.
 * Size: 40x30 tiles
 */
export function buildHubWorld() {
  const W = 40, H = 30;
  const tiles = [];

  // Fill with grass
  for (let y = 0; y < H; y++) {
    tiles[y] = [];
    for (let x = 0; x < W; x++) {
      tiles[y][x] = TILES.GRASS;
    }
  }

  // Water border (top, left edges)
  for (let x = 0; x < W; x++) {
    tiles[0][x] = TILES.WATER;
    tiles[H - 1][x] = TILES.WATER;
  }
  for (let y = 0; y < H; y++) {
    tiles[y][0] = TILES.WATER;
    tiles[y][W - 1] = TILES.WATER;
  }

  // Water pond (bottom-right)
  for (let y = 22; y < 27; y++) {
    for (let x = 30; x < 37; x++) {
      const dx = x - 33, dy = y - 24.5;
      if (dx * dx / 12 + dy * dy / 6 < 1) {
        tiles[y][x] = TILES.WATER;
      }
    }
  }

  // Paths - cross pattern from center
  const cx = 20, cy = 15;
  // Horizontal path
  for (let x = 5; x < 35; x++) {
    tiles[cy][x] = TILES.PATH;
    tiles[cy - 1][x] = TILES.PATH;
  }
  // Vertical path
  for (let y = 3; y < 27; y++) {
    tiles[y][cx] = TILES.PATH;
    tiles[y][cx + 1] = TILES.PATH;
  }

  // Path to portals
  // Left portal area
  for (let y = 13; y < 17; y++) {
    for (let x = 2; x < 7; x++) tiles[y][x] = TILES.PATH;
  }
  // Right portal area
  for (let y = 13; y < 17; y++) {
    for (let x = 33; x < 38; x++) tiles[y][x] = TILES.PATH;
  }
  // Top portal area
  for (let x = 18; x < 23; x++) {
    for (let y = 2; y < 6; y++) tiles[y][x] = TILES.PATH;
  }

  // Flower patches
  const flowerSpots = [
    [8, 8], [10, 10], [12, 7], [28, 8], [30, 10], [32, 7],
    [8, 22], [10, 20], [12, 23], [28, 22], [30, 20], [14, 5],
    [26, 5], [15, 25], [25, 25], [7, 14], [33, 14],
  ];
  for (const [x, y] of flowerSpots) {
    if (tiles[y] && tiles[y][x] === TILES.GRASS) {
      tiles[y][x] = TILES.GRASS_FLOWER;
    }
  }

  // Decorations
  const decorations = [
    // Central big tree
    { type: DECOR.TREE, x: 19, y: 13 },

    // Trees around edges
    { type: DECOR.TREE, x: 3, y: 3 },
    { type: DECOR.TREE, x: 7, y: 4 },
    { type: DECOR.TREE, x: 35, y: 3 },
    { type: DECOR.TREE, x: 32, y: 5 },
    { type: DECOR.TREE, x: 3, y: 25 },
    { type: DECOR.TREE, x: 7, y: 26 },
    { type: DECOR.TREE, x: 35, y: 25 },

    // Flowers
    { type: DECOR.FLOWER_RED, x: 9, y: 9 },
    { type: DECOR.FLOWER_YELLOW, x: 11, y: 11 },
    { type: DECOR.FLOWER_BLUE, x: 13, y: 8 },
    { type: DECOR.FLOWER_RED, x: 29, y: 9 },
    { type: DECOR.FLOWER_YELLOW, x: 31, y: 11 },
    { type: DECOR.FLOWER_PURPLE, x: 27, y: 7 },
    { type: DECOR.FLOWER_BLUE, x: 15, y: 22 },
    { type: DECOR.FLOWER_RED, x: 25, y: 22 },

    // Rocks
    { type: DECOR.ROCK, x: 14, y: 4 },
    { type: DECOR.ROCK, x: 26, y: 4 },
    { type: DECOR.ROCK, x: 6, y: 19 },
    { type: DECOR.ROCK_BIG, x: 28, y: 24 },

    // Bushes
    { type: DECOR.BUSH, x: 5, y: 10 },
    { type: DECOR.BUSH, x: 34, y: 10 },
    { type: DECOR.BUSH, x: 5, y: 20 },
    { type: DECOR.BUSH, x: 34, y: 20 },

    // Mushrooms
    { type: DECOR.MUSHROOM_RED, x: 11, y: 5 },
    { type: DECOR.MUSHROOM_BLUE, x: 29, y: 24 },

    // Sign near spawn
    { type: DECOR.SIGN, x: 22, y: 18 },
  ];

  // Portals
  const portals = [
    { x: 4, y: 14, targetWorld: 'forest', label: 'Les' },
    { x: 35, y: 14, targetWorld: 'ocean', label: 'Oceán' },
    { x: 20, y: 3, targetWorld: 'space', label: 'Vesmír' },
  ];

  // NPCs
  const npcs = [
    {
      npcType: 'rozumelka',
      x: 18,
      y: 17,
      canInteract: true,
      dialogs: [
        'Ahoj Míšo a Kristinko! Jsem Rozumělka.',
        'Prchavec Zmatek zamíchal všechny světy!',
        'Potřebuji vaši pomoc - Míšo, tvoje čísla, a Kristinko, tvoje barvy dokážou všechno napravit!',
        'Vidíte ten strom uprostřed? Potřebuje Léčivé semínko!',
        'Spolupracujte - Míša spočítá a Kristinka namíchá barvu.',
      ],
    },
  ];

  // Puzzles
  const puzzles = [
    {
      id: 'hub_seed',
      x: 20,
      y: 12,
      name: 'Léčivé semínko',
      type: 'seed',
    },
  ];

  return {
    name: 'Louka Harmonie',
    width: W,
    height: H,
    tiles,
    decorations,
    portals,
    npcs,
    puzzles,
    spawnX: 20,
    spawnY: 20,
    bgColor: '#3a8a4a',
    skyColor: '#88ccff',
  };
}
