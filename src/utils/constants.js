// Block types
export const BLOCKS = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  WATER: 6,
  SAND: 7,
  FLOWER_RED: 8,
  FLOWER_YELLOW: 9,
  MUSHROOM: 10,
  PLANKS: 11,
  COBBLESTONE: 12,
  BRICK: 13,
  GLASS: 14,
  PORTAL: 15,
  CORAL_PINK: 16,
  CORAL_BLUE: 17,
  SEAWEED: 18,
  SHELL: 19,
  METAL: 20,
  LIGHT: 21,
  CRYSTAL: 22,
  ICE: 23,
  SNOW: 24,
  PUZZLE_BLOCK: 25,
  GOLD: 26,
  CHEST: 27,
  MAGIC_STONE: 28,
  MOSS: 29,
  LAVA: 30,
};

// Block colors (for voxel rendering)
export const BLOCK_COLORS = {
  [BLOCKS.GRASS]: { top: '#4CAF50', side: '#8B6914', bottom: '#8B6914' },
  [BLOCKS.DIRT]: { top: '#8B6914', side: '#8B6914', bottom: '#8B6914' },
  [BLOCKS.STONE]: { top: '#9E9E9E', side: '#888888', bottom: '#777777' },
  [BLOCKS.WOOD]: { top: '#A0522D', side: '#8B4513', bottom: '#A0522D' },
  [BLOCKS.LEAVES]: { top: '#2E7D32', side: '#388E3C', bottom: '#1B5E20' },
  [BLOCKS.WATER]: { top: '#2196F3', side: '#1976D2', bottom: '#1565C0' },
  [BLOCKS.SAND]: { top: '#F5DEB3', side: '#DEB887', bottom: '#D2B48C' },
  [BLOCKS.FLOWER_RED]: { top: '#E74C3C', side: '#27AE60', bottom: '#27AE60' },
  [BLOCKS.FLOWER_YELLOW]: { top: '#F1C40F', side: '#27AE60', bottom: '#27AE60' },
  [BLOCKS.MUSHROOM]: { top: '#E74C3C', side: '#F5DEB3', bottom: '#F5DEB3' },
  [BLOCKS.PLANKS]: { top: '#C19A6B', side: '#B8860B', bottom: '#C19A6B' },
  [BLOCKS.COBBLESTONE]: { top: '#808080', side: '#696969', bottom: '#606060' },
  [BLOCKS.BRICK]: { top: '#B22222', side: '#A52A2A', bottom: '#8B0000' },
  [BLOCKS.GLASS]: { top: '#87CEEB55', side: '#87CEEB55', bottom: '#87CEEB55' },
  [BLOCKS.PORTAL]: { top: '#9B59B6', side: '#8E44AD', bottom: '#6C3483' },
  [BLOCKS.CORAL_PINK]: { top: '#FF69B4', side: '#FF1493', bottom: '#C71585' },
  [BLOCKS.CORAL_BLUE]: { top: '#00CED1', side: '#00B4D8', bottom: '#0096C7' },
  [BLOCKS.SEAWEED]: { top: '#006400', side: '#228B22', bottom: '#006400' },
  [BLOCKS.SHELL]: { top: '#FFDAB9', side: '#FFE4C4', bottom: '#FFDAB9' },
  [BLOCKS.METAL]: { top: '#C0C0C0', side: '#A9A9A9', bottom: '#808080' },
  [BLOCKS.LIGHT]: { top: '#FFFACD', side: '#FFEAA7', bottom: '#FDCB6E' },
  [BLOCKS.CRYSTAL]: { top: '#E8DAEF', side: '#D2B4DE', bottom: '#BB8FCE' },
  [BLOCKS.ICE]: { top: '#B3E5FC', side: '#81D4FA', bottom: '#4FC3F7' },
  [BLOCKS.SNOW]: { top: '#FFFFFF', side: '#F5F5F5', bottom: '#EEEEEE' },
  [BLOCKS.PUZZLE_BLOCK]: { top: '#FF9800', side: '#F57C00', bottom: '#E65100' },
  [BLOCKS.GOLD]: { top: '#FFD700', side: '#FFC107', bottom: '#FF8F00' },
  [BLOCKS.CHEST]: { top: '#A0522D', side: '#8B4513', bottom: '#654321' },
  [BLOCKS.MAGIC_STONE]: { top: '#7E57C2', side: '#5E35B1', bottom: '#4527A0' },
  [BLOCKS.MOSS]: { top: '#558B2F', side: '#689F38', bottom: '#558B2F' },
  [BLOCKS.LAVA]: { top: '#FF5722', side: '#E64A19', bottom: '#D84315' },
};

// Transparent blocks (for face culling)
export const TRANSPARENT_BLOCKS = new Set([
  BLOCKS.AIR, BLOCKS.WATER, BLOCKS.GLASS, BLOCKS.FLOWER_RED,
  BLOCKS.FLOWER_YELLOW, BLOCKS.MUSHROOM, BLOCKS.SEAWEED, BLOCKS.PORTAL
]);

// Player constants
export const PLAYER = {
  HEIGHT: 1.7,
  WIDTH: 0.6,
  SPEED: 5,
  JUMP_FORCE: 8,
  GRAVITY: 20,
  REACH: 4,
};

// World constants
export const WORLD = {
  CHUNK_SIZE: 16,
  MAX_HEIGHT: 64,
};

// Roles
export const ROLES = {
  MATHEMATICIAN: 'mathematician',
  ARTIST: 'artist',
};

// Game events
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
