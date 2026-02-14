import { BLOCKS } from '../utils/constants.js';
import { createNoise, octaveNoise } from '../utils/helpers.js';

/**
 * Forest World - Magical forest with cooperative puzzles
 *
 * Puzzles:
 * 1. Bridge Puzzle - Míša calculates, Kristinka colors
 * 2. Guardian Tree - Both must contribute
 * 3. Treasure Chest - Two locks (math + creative)
 * 4. Animal Rescue - Help trapped creatures
 */
export function buildForestWorld(world) {
  world.clear();
  const noise = createNoise(456);
  const noise2 = createNoise(789);

  // Generate forest terrain (hillier than hub)
  for (let x = 0; x < world.sizeX; x++) {
    for (let z = 0; z < world.sizeZ; z++) {
      const n = octaveNoise(noise, x * 0.03, z * 0.03, 4, 0.5);
      const n2 = octaveNoise(noise2, x * 0.08, z * 0.08, 2, 0.5);
      const height = Math.floor(8 + n * 5 + n2 * 2);

      for (let y = 0; y <= height; y++) {
        if (y === height) {
          world.setBlock(x, y, z, BLOCKS.GRASS);
        } else if (y > height - 3) {
          world.setBlock(x, y, z, BLOCKS.DIRT);
        } else {
          world.setBlock(x, y, z, BLOCKS.STONE);
        }
      }

      // Dense forest - lots of mushrooms and flowers
      if (world.getBlock(x, height, z) === BLOCKS.GRASS) {
        if (Math.random() < 0.05) {
          world.setBlock(x, height + 1, z, BLOCKS.FLOWER_RED);
        } else if (Math.random() < 0.04) {
          world.setBlock(x, height + 1, z, BLOCKS.FLOWER_YELLOW);
        } else if (Math.random() < 0.02) {
          world.setBlock(x, height + 1, z, BLOCKS.MUSHROOM);
        }
      }
    }
  }

  // Dense trees
  const treeSeeds = createNoise(111);
  for (let x = 2; x < world.sizeX - 2; x += 3) {
    for (let z = 2; z < world.sizeZ - 2; z += 3) {
      const v = treeSeeds(x * 0.5, z * 0.5);
      if (v > -0.1) {
        const h = world.getHeight(x, z);
        if (h > 5 && h < 20) {
          // Don't place trees in puzzle areas
          const cx = 32, cz = 32;
          const dist = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
          if (dist > 8) {
            world.buildTree(x, h, z, 4 + Math.floor(Math.random() * 4), 2 + Math.floor(Math.random() * 2));
          }
        }
      }
    }
  }

  // === RIVER ===
  // Create a river running through the middle
  for (let x = 0; x < world.sizeX; x++) {
    const riverZ = 32 + Math.floor(Math.sin(x * 0.1) * 3);
    for (let dz = -2; dz <= 2; dz++) {
      const rz = riverZ + dz;
      if (rz >= 0 && rz < world.sizeZ) {
        const h = world.getHeight(x, rz);
        // Dig the riverbed
        for (let y = h; y >= h - 2; y--) {
          world.setBlock(x, y, rz, BLOCKS.AIR);
        }
        world.setBlock(x, h - 3, rz, BLOCKS.SAND);
        world.setBlock(x, h - 2, rz, BLOCKS.WATER);
        if (Math.abs(dz) <= 1) {
          world.setBlock(x, h - 1, rz, BLOCKS.WATER);
        }
      }
    }
  }

  // Spawn area - small clearing
  const sx = 10, sz = 15;
  const spawnH = world.getHeight(sx, sz);
  // Clear trees and make flat
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      for (let dy = spawnH + 1; dy < spawnH + 10; dy++) {
        world.setBlock(sx + dx, dy, sz + dz, BLOCKS.AIR);
      }
      world.setBlock(sx + dx, spawnH, sz + dz, BLOCKS.GRASS);
    }
  }

  // Return portal
  world.buildPortal(sx - 3, spawnH + 1, sz - 2);
  world.addInteractable(sx - 1, spawnH + 2, sz - 2, {
    type: 'portal',
    world: 'hub',
    name: 'Zpět na základnu',
    description: 'Vrátit se na základnu dobrodruhů',
  });

  // === PUZZLE 1: BRIDGE ===
  // Broken bridge over the river
  const bridgeX = 25;
  const bridgeZ = 32 + Math.floor(Math.sin(bridgeX * 0.1) * 3);
  const bridgeH = world.getHeight(bridgeX - 3, bridgeZ - 4);

  // Bridge foundations on both sides
  for (let dz = -1; dz <= 1; dz++) {
    for (let dy = 0; dy < 3; dy++) {
      world.setBlock(bridgeX - 3, bridgeH + dy, bridgeZ + dz, BLOCKS.COBBLESTONE);
      world.setBlock(bridgeX + 6, bridgeH + dy, bridgeZ + dz, BLOCKS.COBBLESTONE);
    }
  }

  // Some bridge planks already in place (broken)
  world.setBlock(bridgeX - 2, bridgeH + 2, bridgeZ, BLOCKS.PLANKS);
  world.setBlock(bridgeX + 5, bridgeH + 2, bridgeZ, BLOCKS.PLANKS);

  // Bridge puzzle marker
  world.setBlock(bridgeX - 3, bridgeH + 3, bridgeZ - 2, BLOCKS.MAGIC_STONE);
  world.addInteractable(bridgeX - 3, bridgeH + 3, bridgeZ - 2, {
    type: 'puzzle',
    puzzleType: 'bridge',
    puzzleId: 'forest_bridge',
    name: 'Rozbořený most',
    description: 'Most je rozbitý! Míša musí spočítat kolik desek chybí, a Kristinka je musí nabarvit správnou barvou.',
    mathTask: 'Kolik desek potřebujeme? Spočítej: most je 8 bloků dlouhý, 2 desky jsou, kolik chybí?',
    creativeTask: 'Nabarvi desky jako duha - od červené po fialovou!',
    mathAnswer: 6,
    requiredColors: ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'],
    bridgePositions: [
      { x: bridgeX - 1, y: bridgeH + 2, z: bridgeZ },
      { x: bridgeX, y: bridgeH + 2, z: bridgeZ },
      { x: bridgeX + 1, y: bridgeH + 2, z: bridgeZ },
      { x: bridgeX + 2, y: bridgeH + 2, z: bridgeZ },
      { x: bridgeX + 3, y: bridgeH + 2, z: bridgeZ },
      { x: bridgeX + 4, y: bridgeH + 2, z: bridgeZ },
    ],
  });

  // === PUZZLE 2: GUARDIAN TREE ===
  const guardX = 40, guardZ = 20;
  const guardH = world.getHeight(guardX, guardZ);

  // Clear area for guardian
  for (let dx = -5; dx <= 5; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      for (let dy = guardH + 1; dy < guardH + 15; dy++) {
        world.setBlock(guardX + dx, dy, guardZ + dz, BLOCKS.AIR);
      }
    }
  }

  // Giant tree (the guardian)
  for (let y = guardH; y < guardH + 10; y++) {
    world.setBlock(guardX, y, guardZ, BLOCKS.WOOD);
    world.setBlock(guardX + 1, y, guardZ, BLOCKS.WOOD);
    world.setBlock(guardX, y, guardZ + 1, BLOCKS.WOOD);
    world.setBlock(guardX + 1, y, guardZ + 1, BLOCKS.WOOD);
    if (y < guardH + 5) {
      world.setBlock(guardX - 1, y, guardZ, BLOCKS.WOOD);
      world.setBlock(guardX + 2, y, guardZ, BLOCKS.WOOD);
    }
  }

  // Guardian's face (made of magic stone)
  world.setBlock(guardX - 1, guardH + 5, guardZ - 1, BLOCKS.CRYSTAL);
  world.setBlock(guardX + 2, guardH + 5, guardZ - 1, BLOCKS.CRYSTAL);
  world.setBlock(guardX, guardH + 3, guardZ - 1, BLOCKS.MAGIC_STONE);
  world.setBlock(guardX + 1, guardH + 3, guardZ - 1, BLOCKS.MAGIC_STONE);

  // Large canopy
  for (let dx = -5; dx <= 6; dx++) {
    for (let dz = -5; dz <= 6; dz++) {
      for (let dy = 0; dy <= 4; dy++) {
        const r = 5 - dy;
        if (dx * dx + dz * dz <= r * r + 2) {
          const bx = guardX + dx, by = guardH + 8 + dy, bz = guardZ + dz;
          if (world.getBlock(bx, by, bz) === BLOCKS.AIR) {
            world.setBlock(bx, by, bz, BLOCKS.LEAVES);
          }
        }
      }
    }
  }

  // Guardian puzzle marker
  world.addInteractable(guardX, guardH + 4, guardZ - 1, {
    type: 'puzzle',
    puzzleType: 'guardian',
    puzzleId: 'forest_guardian',
    name: 'Strážce lesa',
    description: 'Starý strom strážce spí! Míša ho musí probudit čísly a Kristinka ho ozdobit květinami.',
    mathTask: 'Strážce se ptá: Kolik listů má strom, když každá z 5 větví má 7 listů?',
    creativeTask: 'Namaluj vzor z květin na strážcovu korunu! Střídej 3 barvy.',
    mathAnswer: 35,
    patternSize: 3,
    patternColors: 3,
  });

  // === PUZZLE 3: TREASURE CHEST ===
  const chestX = 50, chestZ = 45;
  const chestH = world.getHeight(chestX, chestZ);

  // Small stone chamber
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      world.setBlock(chestX + dx, chestH, chestZ + dz, BLOCKS.COBBLESTONE);
      if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
        world.setBlock(chestX + dx, chestH + 1, chestZ + dz, BLOCKS.COBBLESTONE);
        world.setBlock(chestX + dx, chestH + 2, chestZ + dz, BLOCKS.COBBLESTONE);
      }
      // Clear inside
      if (Math.abs(dx) < 2 && Math.abs(dz) < 2) {
        for (let dy = chestH + 1; dy < chestH + 8; dy++) {
          world.setBlock(chestX + dx, dy, chestZ + dz, BLOCKS.AIR);
        }
      }
    }
  }

  // Entrance
  world.setBlock(chestX, chestH + 1, chestZ - 2, BLOCKS.AIR);
  world.setBlock(chestX, chestH + 2, chestZ - 2, BLOCKS.AIR);

  // Chest inside
  world.setBlock(chestX, chestH + 1, chestZ + 1, BLOCKS.CHEST);
  world.addInteractable(chestX, chestH + 1, chestZ + 1, {
    type: 'puzzle',
    puzzleType: 'chest',
    puzzleId: 'forest_chest',
    name: 'Pokladová truhla',
    description: 'Truhla má dva zámky! Jeden na čísla a jeden na barvy. Otevřete ji společně!',
    mathTask: 'Zadej kód: Součin číslic 3 a 9',
    creativeTask: 'Nabarvi klíč správnými barvami: modrá-zelená-červená-žlutá',
    mathAnswer: 27,
    requiredColors: ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f'],
  });

  // Torches/lights around chamber
  world.setBlock(chestX - 2, chestH + 2, chestZ, BLOCKS.LIGHT);
  world.setBlock(chestX + 2, chestH + 2, chestZ, BLOCKS.LIGHT);

  // === PUZZLE 4: ANIMAL RESCUE ===
  const animalX = 15, animalZ = 45;
  const animalH = world.getHeight(animalX, animalZ);

  // Clear area
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      for (let dy = animalH + 1; dy < animalH + 8; dy++) {
        world.setBlock(animalX + dx, dy, animalZ + dz, BLOCKS.AIR);
      }
    }
  }

  // Three cages (small cobblestone enclosures)
  const cagePositions = [
    { x: animalX - 3, z: animalZ - 2 },
    { x: animalX, z: animalZ + 2 },
    { x: animalX + 3, z: animalZ - 2 },
  ];

  cagePositions.forEach((cage, i) => {
    const cy = world.getHeight(cage.x, cage.z);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        world.setBlock(cage.x + dx, cy + 1, cage.z + dz, BLOCKS.COBBLESTONE);
        if (Math.abs(dx) === 1 || Math.abs(dz) === 1) {
          world.setBlock(cage.x + dx, cy + 2, cage.z + dz, BLOCKS.COBBLESTONE);
        }
        world.setBlock(cage.x + dx, cy + 3, cage.z + dz, BLOCKS.COBBLESTONE);
      }
    }
    // Animal inside (represented by a crystal)
    world.setBlock(cage.x, cy + 2, cage.z, BLOCKS.CRYSTAL);
  });

  // Animal rescue puzzle
  world.setBlock(animalX, animalH + 1, animalZ, BLOCKS.MAGIC_STONE);
  world.addInteractable(animalX, animalH + 1, animalZ, {
    type: 'puzzle',
    puzzleType: 'rescue',
    puzzleId: 'forest_rescue',
    name: 'Záchrana zvířátek',
    description: 'Tři zvířátka jsou uvězněná! Míša musí vyřešit 3 příklady a Kristinka namalovat 3 vzory.',
    mathTasks: [
      { question: '4 + 8 = ?', answer: 12 },
      { question: '6 × 3 = ?', answer: 18 },
      { question: '25 - 7 = ?', answer: 18 },
    ],
    patternSize: 2,
    patternColors: 3,
    cagePositions,
  });

  // Pathway torches
  for (let x = 12; x < 50; x += 4) {
    const pathZ = 28;
    const ph = world.getHeight(x, pathZ);
    world.setBlock(x, ph + 1, pathZ, BLOCKS.LIGHT);
  }

  return {
    spawnPoint: { x: sx, y: spawnH + 1, z: sz },
    skyColors: { top: 0x2d5a27, bottom: 0x5d8a3c, fog: 0x4a7a3a },
    name: 'Magický les',
  };
}
