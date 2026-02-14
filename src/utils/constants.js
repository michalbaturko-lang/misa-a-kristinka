// ===== TILE TYPES =====
export const TILES = {
  EMPTY: 0,
  GRASS: 1,
  GRASS_DARK: 2,
  WATER: 3,
  PATH: 4,
  DIRT: 5,
  SAND: 6,
  STONE_FLOOR: 7,
  WOOD_FLOOR: 8,
  BRIDGE: 9,
  METAL_FLOOR: 10,
  CORAL_FLOOR: 11,
  GLASS_FLOOR: 12,
  GRASS_FLOWER: 13,
};

// Solid tiles that block movement
export const SOLID_TILES = new Set([TILES.EMPTY, TILES.WATER]);

// ===== DECORATION TYPES =====
export const DECOR = {
  TREE: 'tree',
  TREE_DARK: 'tree_dark',
  TREE_PINE: 'tree_pine',
  FLOWER_RED: 'flower_red',
  FLOWER_YELLOW: 'flower_yellow',
  FLOWER_BLUE: 'flower_blue',
  FLOWER_PURPLE: 'flower_purple',
  ROCK: 'rock',
  ROCK_BIG: 'rock_big',
  BUSH: 'bush',
  MUSHROOM_RED: 'mushroom_red',
  MUSHROOM_BLUE: 'mushroom_blue',
  FENCE_H: 'fence_h',
  FENCE_V: 'fence_v',
  HOUSE: 'house',
  SIGN: 'sign',
  WELL: 'well',
  STUMP: 'stump',
  LOG: 'log',
  // Forest specific
  VINE: 'vine',
  FAIRY_LIGHT: 'fairy_light',
  ANIMAL_BUNNY: 'animal_bunny',
  ANIMAL_FOX: 'animal_fox',
  // Ocean specific
  CORAL_PINK: 'coral_pink',
  CORAL_BLUE: 'coral_blue',
  SHELL: 'shell',
  STARFISH: 'starfish',
  BUBBLE: 'bubble',
  // Space specific
  CONSOLE: 'console',
  ANTENNA: 'antenna',
  CRATE: 'crate',
};

// Solid decorations that block movement (2x2 tile footprint)
export const SOLID_DECORS = new Set([
  DECOR.TREE, DECOR.TREE_DARK, DECOR.TREE_PINE,
  DECOR.ROCK_BIG, DECOR.HOUSE, DECOR.WELL,
]);

// Small solid decorations (1x1 tile footprint)
export const SMALL_SOLID_DECORS = new Set([
  DECOR.ROCK, DECOR.FENCE_H, DECOR.FENCE_V,
  DECOR.STUMP, DECOR.SIGN,
]);

// ===== SPRITE SIZES =====
export const TILE_SIZE = 16;  // Pixel art tile resolution
export const CHAR_W = 16;     // Character sprite width
export const CHAR_H = 24;     // Character sprite height

// ===== PLAYER =====
export const PLAYER_SPEED = 80;   // pixels per second (in sprite space)
export const DIRECTIONS = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 };
export const DIR_VECTORS = {
  [0]: { x: 0, y: 1 },   // DOWN
  [1]: { x: -1, y: 0 },  // LEFT
  [2]: { x: 1, y: 0 },   // RIGHT
  [3]: { x: 0, y: -1 },  // UP
};
export const ANIM_FRAMES = 4;
export const ANIM_SPEED = 8; // frames per second

// ===== ROLES =====
export const ROLES = {
  MATHEMATICIAN: 'mathematician',
  ARTIST: 'artist',
};

// ===== GAME EVENTS =====
export const EVENTS = {
  PLAYER_MOVE: 'player:move',
  PLAYER_JOIN: 'player:join',
  PLAYER_LEAVE: 'player:leave',
  PLAYER_READY: 'player:ready',
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_STATE: 'room:state',
  GAME_START: 'game:start',
  WORLD_CHANGE: 'world:change',
  PUZZLE_START: 'puzzle:start',
  PUZZLE_PROGRESS: 'puzzle:progress',
  PUZZLE_COMPLETE: 'puzzle:complete',
  BLOCK_CHANGE: 'block:change',
  INTERACT: 'interact',
  CHAT: 'chat',
  CELEBRATION: 'celebration',
};

// ===== WORLDS =====
export const WORLDS = {
  HUB: 'hub',
  FOREST: 'forest',
  OCEAN: 'ocean',
  SPACE: 'space',
};

// ===== AUDIO PLACEHOLDER EVENTS =====
export const SOUNDS = {
  FOOTSTEP: 'footstep',
  JUMP: 'jump',
  INTERACT: 'interact',
  PORTAL: 'portal',
  PUZZLE_START: 'puzzle_start',
  PUZZLE_SUCCESS: 'puzzle_success',
  CELEBRATION: 'celebration',
  UI_CLICK: 'ui_click',
  DIALOG: 'dialog',
  PICKUP: 'pickup',
};
