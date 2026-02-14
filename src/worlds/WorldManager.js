import { VoxelWorld } from '../engine/VoxelWorld.js';
import { buildHubWorld } from './HubWorld.js';
import { buildForestWorld } from './ForestWorld.js';
import { buildUnderwaterWorld } from './UnderwaterWorld.js';
import { buildSpaceWorld } from './SpaceWorld.js';

/**
 * WorldManager - handles loading/switching between worlds
 */
export class WorldManager {
  constructor() {
    this.currentWorld = null;
    this.currentWorldName = null;
    this.voxelWorld = new VoxelWorld(64, 40, 64);
    this.worldInfo = null;
  }

  loadWorld(worldName, scene) {
    console.log(`Loading world: ${worldName}`);
    this.currentWorldName = worldName;

    let builder;
    switch (worldName) {
      case 'hub': builder = buildHubWorld; break;
      case 'forest': builder = buildForestWorld; break;
      case 'underwater': builder = buildUnderwaterWorld; break;
      case 'space': builder = buildSpaceWorld; break;
      default:
        console.error(`Unknown world: ${worldName}`);
        builder = buildHubWorld;
    }

    this.worldInfo = builder(this.voxelWorld);
    this.voxelWorld.buildMesh(scene);
    return this.worldInfo;
  }

  getSpawnPoint() {
    return this.worldInfo?.spawnPoint || { x: 32, y: 15, z: 32 };
  }

  getSkyColors() {
    return this.worldInfo?.skyColors || { top: 0x4a90d9, bottom: 0x87CEEB, fog: 0x87CEEB };
  }

  getWorldName() {
    return this.worldInfo?.name || 'Neznámý svět';
  }
}
