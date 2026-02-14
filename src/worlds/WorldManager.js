import { buildHubWorld } from './HubWorld.js';
import { buildForestWorld } from './ForestWorld.js';
import { TILES, TILE_SIZE } from '../utils/constants.js';

/**
 * WorldManager - loads and manages tile-based worlds.
 */
export class WorldManager {
  constructor() {
    this.builders = {
      hub: buildHubWorld,
      forest: buildForestWorld,
    };
    this.currentWorld = null;
    this.worldData = null;
  }

  loadWorld(worldName) {
    const builder = this.builders[worldName];
    if (!builder) {
      console.warn(`World "${worldName}" not implemented, loading hub`);
      this.worldData = buildHubWorld();
    } else {
      this.worldData = builder();
    }
    this.currentWorld = worldName;
    return this.worldData;
  }

  getWorld() {
    return this.worldData;
  }

  getTile(tx, ty) {
    if (!this.worldData) return TILES.EMPTY;
    if (tx < 0 || ty < 0 || tx >= this.worldData.width || ty >= this.worldData.height) return TILES.EMPTY;
    return this.worldData.tiles[ty][tx];
  }

  // Delegate methods so world can be used directly
  get width() { return this.worldData ? this.worldData.width : 0; }
  get height() { return this.worldData ? this.worldData.height : 0; }
  get decorations() { return this.worldData ? this.worldData.decorations : []; }
  get portals() { return this.worldData ? this.worldData.portals : []; }
  get npcs() { return this.worldData ? this.worldData.npcs : []; }
  get puzzles() { return this.worldData ? this.worldData.puzzles : []; }
  get name() { return this.worldData ? this.worldData.name : ''; }
  get bgColor() { return this.worldData ? this.worldData.bgColor : '#000'; }
  get spawnX() { return this.worldData ? this.worldData.spawnX : 5; }
  get spawnY() { return this.worldData ? this.worldData.spawnY : 5; }
}
