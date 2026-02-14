import { BLOCKS } from '../utils/constants.js';
import { createNoise, octaveNoise } from '../utils/helpers.js';

/**
 * Hub World - The starting area with portals to other worlds
 * A cozy meadow with a central treehouse and three portals
 */
export function buildHubWorld(world) {
  world.clear();
  const noise = createNoise(123);
  const cx = 32, cz = 32; // Center

  // Generate terrain (gentle hills)
  for (let x = 0; x < world.sizeX; x++) {
    for (let z = 0; z < world.sizeZ; z++) {
      const n = octaveNoise(noise, x * 0.04, z * 0.04, 3, 0.5);
      const height = Math.floor(8 + n * 3);

      for (let y = 0; y <= height; y++) {
        if (y === height) {
          world.setBlock(x, y, z, BLOCKS.GRASS);
        } else if (y > height - 3) {
          world.setBlock(x, y, z, BLOCKS.DIRT);
        } else {
          world.setBlock(x, y, z, BLOCKS.STONE);
        }
      }

      // Flowers scattered around
      if (Math.random() < 0.03 && world.getBlock(x, height, z) === BLOCKS.GRASS) {
        world.setBlock(x, height + 1, z, Math.random() < 0.5 ? BLOCKS.FLOWER_RED : BLOCKS.FLOWER_YELLOW);
      }
    }
  }

  // Central platform (raised area)
  const platformY = 10;
  for (let x = cx - 6; x <= cx + 6; x++) {
    for (let z = cz - 6; z <= cz + 6; z++) {
      const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
      if (dist <= 6) {
        // Fill up to platform height
        for (let y = world.getHeight(x, z); y <= platformY; y++) {
          world.setBlock(x, y, z, y === platformY ? BLOCKS.GRASS : BLOCKS.DIRT);
        }
      }
    }
  }

  // Stairway up to platform
  for (let i = 0; i < 5; i++) {
    const sy = platformY - 4 + i;
    world.setBlock(cx - 7 + i, sy, cz, BLOCKS.COBBLESTONE);
    world.setBlock(cx - 7 + i, sy, cz + 1, BLOCKS.COBBLESTONE);
    // Clear above stairs
    for (let h = 1; h <= 3; h++) {
      world.setBlock(cx - 7 + i, sy + h, cz, BLOCKS.AIR);
      world.setBlock(cx - 7 + i, sy + h, cz + 1, BLOCKS.AIR);
    }
  }

  // Central treehouse
  const treeX = cx, treeZ = cz;
  const treeBase = platformY + 1;

  // Large tree trunk
  for (let y = treeBase; y < treeBase + 8; y++) {
    world.setBlock(treeX, y, treeZ, BLOCKS.WOOD);
    world.setBlock(treeX + 1, y, treeZ, BLOCKS.WOOD);
    world.setBlock(treeX, y, treeZ + 1, BLOCKS.WOOD);
    world.setBlock(treeX + 1, y, treeZ + 1, BLOCKS.WOOD);
  }

  // Tree canopy (large)
  const canopyY = treeBase + 6;
  for (let dx = -4; dx <= 5; dx++) {
    for (let dz = -4; dz <= 5; dz++) {
      for (let dy = 0; dy <= 3; dy++) {
        const r = 4 - dy;
        if (dx * dx + dz * dz <= r * r + 2) {
          const bx = treeX + dx, by = canopyY + dy, bz = treeZ + dz;
          if (world.getBlock(bx, by, bz) === BLOCKS.AIR) {
            world.setBlock(bx, by, bz, BLOCKS.LEAVES);
          }
        }
      }
    }
  }

  // Small platform in tree (treehouse floor)
  const housePlatY = treeBase + 4;
  for (let dx = -2; dx <= 3; dx++) {
    for (let dz = -2; dz <= 3; dz++) {
      world.setBlock(treeX + dx, housePlatY, treeZ + dz, BLOCKS.PLANKS);
    }
  }

  // Decorative trees around the hub
  const treePositions = [
    [10, 15], [15, 10], [50, 15], [48, 50], [12, 48],
    [20, 45], [45, 20], [8, 30], [55, 35], [30, 55],
  ];
  for (const [tx, tz] of treePositions) {
    const h = world.getHeight(tx, tz);
    if (h > 0) {
      world.buildTree(tx, h, tz, 4 + Math.floor(Math.random() * 3));
    }
  }

  // === PORTALS ===

  // Portal 1: Magický les (Magic Forest) - green
  const p1x = cx - 12, p1z = cz;
  const p1y = world.getHeight(p1x, p1z);
  // Platform
  for (let dx = -1; dx <= 5; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      world.setBlock(p1x + dx, p1y, p1z + dz, BLOCKS.MOSS);
    }
  }
  world.buildPortal(p1x, p1y + 1, p1z);
  world.addInteractable(p1x + 2, p1y + 2, p1z, {
    type: 'portal',
    world: 'forest',
    name: 'Magický les',
    description: 'Vstupte do tajemného lesa plného hádanek a kouzel!',
  });

  // Sign for portal 1
  world.setBlock(p1x - 1, p1y + 1, p1z + 2, BLOCKS.PLANKS);
  world.setBlock(p1x - 1, p1y + 2, p1z + 2, BLOCKS.PLANKS);

  // Portal 2: Podmořský svět (Underwater) - blue
  const p2x = cx, p2z = cz + 14;
  const p2y = world.getHeight(p2x, p2z);
  for (let dx = -1; dx <= 5; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      world.setBlock(p2x + dx, p2y, p2z + dz, BLOCKS.SAND);
    }
  }
  world.buildPortal(p2x, p2y + 1, p2z);
  world.addInteractable(p2x + 2, p2y + 2, p2z, {
    type: 'portal',
    world: 'underwater',
    name: 'Podmořský svět',
    description: 'Ponořte se do hlubin oceánu a objevte korálové tajemství!',
  });

  // Portal 3: Vesmírná stanice (Space) - purple
  const p3x = cx + 12, p3z = cz;
  const p3y = world.getHeight(p3x, p3z);
  for (let dx = -1; dx <= 5; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      world.setBlock(p3x + dx, p3y, p3z + dz, BLOCKS.METAL);
    }
  }
  world.buildPortal(p3x, p3y + 1, p3z);
  world.addInteractable(p3x + 2, p3y + 2, p3z, {
    type: 'portal',
    world: 'space',
    name: 'Vesmírná stanice',
    description: 'Vydejte se do vesmíru a opravte stanici!',
  });

  // Welcome sign near spawn
  world.setBlock(cx - 3, platformY + 1, cz - 4, BLOCKS.PLANKS);
  world.setBlock(cx - 3, platformY + 2, cz - 4, BLOCKS.PLANKS);
  world.addInteractable(cx - 3, platformY + 2, cz - 4, {
    type: 'sign',
    text: 'Vítejte, dobrodruzi! Společně prozkoumejte portály a vyřešte hádanky v každém světě.',
  });

  // Small pond
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= 3) {
        const px = cx + 8 + dx, pz = cz - 8 + dz;
        const h = world.getHeight(px, pz);
        world.setBlock(px, h - 1, pz, BLOCKS.SAND);
        world.setBlock(px, h, pz, BLOCKS.AIR);
        if (dist <= 2) {
          world.setBlock(px, h - 1, pz, BLOCKS.WATER);
        }
      }
    }
  }

  return {
    spawnPoint: { x: cx - 5, y: platformY + 1, z: cz },
    skyColors: { top: 0x4a90d9, bottom: 0x87CEEB, fog: 0x87CEEB },
    name: 'Základna Dobrodruhů',
  };
}
