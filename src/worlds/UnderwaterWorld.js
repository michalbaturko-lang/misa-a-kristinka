import { BLOCKS } from '../utils/constants.js';
import { createNoise, octaveNoise } from '../utils/helpers.js';

/**
 * Underwater World - Coral reefs, sunken ships, sea creatures
 *
 * Puzzles:
 * 1. Coral Garden - Grow coral with math + colors
 * 2. Sunken Ship - Open sealed doors together
 * 3. Pearl Collector - Count and arrange pearls
 * 4. Sea Gate - Open the ancient gate
 */
export function buildUnderwaterWorld(world) {
  world.clear();
  const noise = createNoise(777);
  const noise2 = createNoise(888);

  // Generate ocean floor terrain
  for (let x = 0; x < world.sizeX; x++) {
    for (let z = 0; z < world.sizeZ; z++) {
      const n = octaveNoise(noise, x * 0.03, z * 0.03, 4, 0.5);
      const n2 = octaveNoise(noise2, x * 0.06, z * 0.06, 2, 0.5);
      const height = Math.floor(6 + n * 4 + n2 * 2);

      for (let y = 0; y <= height; y++) {
        if (y === height) {
          world.setBlock(x, y, z, BLOCKS.SAND);
        } else if (y > height - 2) {
          world.setBlock(x, y, z, BLOCKS.SAND);
        } else {
          world.setBlock(x, y, z, BLOCKS.STONE);
        }
      }

      // Fill with water above the ocean floor up to waterline
      const waterLevel = 20;
      for (let y = height + 1; y <= waterLevel; y++) {
        world.setBlock(x, y, z, BLOCKS.WATER);
      }

      // Scatter seaweed
      if (height > 4 && Math.random() < 0.04) {
        const seaweedH = 1 + Math.floor(Math.random() * 3);
        for (let sy = 1; sy <= seaweedH; sy++) {
          world.setBlock(x, height + sy, z, BLOCKS.SEAWEED);
        }
      }

      // Scatter shells
      if (Math.random() < 0.01) {
        world.setBlock(x, height + 1, z, BLOCKS.SHELL);
      }
    }
  }

  // Air dome for spawn area (so players can breathe)
  const sx = 10, sz = 10;
  const domeRadius = 6;
  const domeCenter = 14;
  const floorH = world.getHeight(sx, sz);

  // Build the dome
  for (let dx = -domeRadius; dx <= domeRadius; dx++) {
    for (let dy = 0; dy <= domeRadius; dy++) {
      for (let dz = -domeRadius; dz <= domeRadius; dz++) {
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist <= domeRadius && dist >= domeRadius - 1) {
          world.setBlock(sx + dx, floorH + dy, sz + dz, BLOCKS.GLASS);
        } else if (dist < domeRadius - 1 && dy > 0) {
          world.setBlock(sx + dx, floorH + dy, sz + dz, BLOCKS.AIR);
        }
      }
    }
  }
  // Dome floor
  for (let dx = -domeRadius + 1; dx < domeRadius; dx++) {
    for (let dz = -domeRadius + 1; dz < domeRadius; dz++) {
      if (dx * dx + dz * dz < (domeRadius - 1) * (domeRadius - 1)) {
        world.setBlock(sx + dx, floorH, sz + dz, BLOCKS.PLANKS);
      }
    }
  }

  // Return portal in dome
  world.buildPortal(sx - 3, floorH + 1, sz);
  world.addInteractable(sx - 1, floorH + 2, sz, {
    type: 'portal',
    world: 'hub',
    name: 'Zpět na základnu',
    description: 'Vrátit se na základnu',
  });

  // Light in dome
  world.setBlock(sx, floorH + domeRadius - 1, sz, BLOCKS.LIGHT);

  // === CORAL REEF STRUCTURES ===
  const coralPositions = [
    { x: 25, z: 15 }, { x: 30, z: 20 }, { x: 20, z: 25 },
    { x: 35, z: 25 }, { x: 40, z: 15 }, { x: 28, z: 30 },
  ];

  for (const cp of coralPositions) {
    const ch = world.getHeight(cp.x, cp.z);
    const coralType = Math.random() < 0.5 ? BLOCKS.CORAL_PINK : BLOCKS.CORAL_BLUE;
    const coralH = 2 + Math.floor(Math.random() * 4);
    for (let dy = 1; dy <= coralH; dy++) {
      world.setBlock(cp.x, ch + dy, cp.z, coralType);
      if (dy > 1 && Math.random() < 0.5) {
        const dx = Math.random() < 0.5 ? 1 : -1;
        world.setBlock(cp.x + dx, ch + dy, cp.z, coralType);
      }
      if (dy > 1 && Math.random() < 0.5) {
        const dz = Math.random() < 0.5 ? 1 : -1;
        world.setBlock(cp.x, ch + dy, cp.z + dz, coralType);
      }
    }
  }

  // === PUZZLE 1: CORAL GARDEN ===
  const gardenX = 25, gardenZ = 25;
  const gardenH = world.getHeight(gardenX, gardenZ);

  // Clear a flat area underwater
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      const gx = gardenX + dx, gz = gardenZ + dz;
      world.setBlock(gx, gardenH, gz, BLOCKS.SAND);
      world.setBlock(gx, gardenH + 1, gz, BLOCKS.WATER);
    }
  }

  // Garden puzzle marker (magic stone on the ocean floor)
  world.setBlock(gardenX, gardenH + 1, gardenZ - 4, BLOCKS.MAGIC_STONE);
  world.addInteractable(gardenX, gardenH + 1, gardenZ - 4, {
    type: 'puzzle',
    puzzleType: 'garden',
    puzzleId: 'underwater_garden',
    name: 'Korálová zahrada',
    description: 'Vypěstujte korálovou zahradu! Míša spočítá kolik korálů potřebujete, Kristinka vybere barvy.',
    mathTask: 'V zahradě je místo pro 4 řady po 3 korálech. Kolik korálů celkem?',
    creativeTask: 'Vybarvi korály střídavě růžově a modře!',
    mathAnswer: 12,
    requiredPattern: ['pink', 'blue'],
  });

  // === PUZZLE 2: SUNKEN SHIP ===
  const shipX = 42, shipZ = 35;
  const shipH = world.getHeight(shipX, shipZ);

  // Build a simple ship hull
  for (let sx = 0; sx < 12; sx++) {
    const width = sx < 2 ? sx + 1 : sx > 9 ? 12 - sx : 3;
    for (let dz = -width; dz <= width; dz++) {
      world.setBlock(shipX + sx, shipH, shipZ + dz, BLOCKS.PLANKS);
      if (Math.abs(dz) === width || sx === 0 || sx === 11) {
        world.setBlock(shipX + sx, shipH + 1, shipZ + dz, BLOCKS.PLANKS);
        world.setBlock(shipX + sx, shipH + 2, shipZ + dz, BLOCKS.PLANKS);
      }
    }
  }

  // Ship cabin
  for (let dx = 3; dx <= 8; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      world.setBlock(shipX + dx, shipH + 3, shipZ + dz, BLOCKS.PLANKS);
      if (Math.abs(dz) === 2 || dx === 3 || dx === 8) {
        world.setBlock(shipX + dx, shipH + 4, shipZ + dz, BLOCKS.PLANKS);
      }
    }
  }

  // Mast
  for (let dy = 0; dy < 8; dy++) {
    world.setBlock(shipX + 5, shipH + 3 + dy, shipZ, BLOCKS.WOOD);
  }

  // Ship puzzle
  world.setBlock(shipX + 5, shipH + 1, shipZ, BLOCKS.CHEST);
  world.addInteractable(shipX + 5, shipH + 1, shipZ, {
    type: 'puzzle',
    puzzleType: 'ship',
    puzzleId: 'underwater_ship',
    name: 'Potopená loď',
    description: 'V potopené lodi je poklad! Otevřete kajutu společně.',
    mathTask: 'Kapitánův kód: 7 × 8 = ?',
    creativeTask: 'Nakresli pirátskou vlajku - bílý symbol na černém pozadí!',
    mathAnswer: 56,
  });

  // === PUZZLE 3: PEARL COLLECTOR ===
  const pearlX = 15, pearlZ = 40;
  const pearlH = world.getHeight(pearlX, pearlZ);

  // Giant clam
  for (let dx = -2; dx <= 2; dx++) {
    world.setBlock(pearlX + dx, pearlH, pearlZ, BLOCKS.SHELL);
    world.setBlock(pearlX + dx, pearlH + 1, pearlZ - 1, BLOCKS.SHELL);
    world.setBlock(pearlX + dx, pearlH + 1, pearlZ + 1, BLOCKS.SHELL);
  }
  world.setBlock(pearlX, pearlH + 1, pearlZ, BLOCKS.CRYSTAL);

  world.addInteractable(pearlX, pearlH + 1, pearlZ, {
    type: 'puzzle',
    puzzleType: 'pearls',
    puzzleId: 'underwater_pearls',
    name: 'Sběr perel',
    description: 'Obří škeble střeží perly! Míša spočítá vzácné perly, Kristinka je seřadí podle barvy.',
    mathTask: 'Ve škeblích je 15 perel. 6 je bílých, 4 růžových, zbytek modrých. Kolik je modrých?',
    creativeTask: 'Seřaď perly od nejsvětlejší po nejtmavší!',
    mathAnswer: 5,
    requiredColors: ['#ffffff', '#FFB6C1', '#87CEEB', '#4169E1', '#191970'],
  });

  // === PUZZLE 4: SEA GATE ===
  const gateX = 50, gateZ = 50;
  const gateH = world.getHeight(gateX, gateZ);

  // Ancient underwater gate structure
  for (let dx = 0; dx <= 6; dx++) {
    world.setBlock(gateX + dx, gateH + 1, gateZ, BLOCKS.COBBLESTONE);
    if (dx === 0 || dx === 6) {
      for (let dy = 2; dy <= 6; dy++) {
        world.setBlock(gateX + dx, gateH + dy, gateZ, BLOCKS.COBBLESTONE);
      }
    }
    world.setBlock(gateX + dx, gateH + 7, gateZ, BLOCKS.COBBLESTONE);
  }

  // Gate magic stones
  world.setBlock(gateX + 2, gateH + 4, gateZ - 1, BLOCKS.MAGIC_STONE);
  world.setBlock(gateX + 4, gateH + 4, gateZ - 1, BLOCKS.MAGIC_STONE);

  world.addInteractable(gateX + 3, gateH + 3, gateZ, {
    type: 'puzzle',
    puzzleType: 'gate',
    puzzleId: 'underwater_gate',
    name: 'Podmořská brána',
    description: 'Pradávná brána do tajného podmořského chrámu! Oba musíte přiložit ruce.',
    mathTask: 'Levý kámen: kolik je 12 × 4?',
    creativeTask: 'Pravý kámen: namaluj symbol moře (vlny) modrými odstíny!',
    mathAnswer: 48,
  });

  // Bubble columns (decorative)
  for (let i = 0; i < 8; i++) {
    const bx = 10 + Math.floor(Math.random() * 50);
    const bz = 10 + Math.floor(Math.random() * 50);
    const bh = world.getHeight(bx, bz);
    for (let dy = 1; dy <= 10; dy++) {
      if (world.getBlock(bx, bh + dy, bz) === BLOCKS.WATER) {
        world.setBlock(bx, bh + dy, bz, BLOCKS.GLASS);
      }
    }
  }

  return {
    spawnPoint: { x: sx, y: floorH + 1, z: sz },
    skyColors: { top: 0x001a33, bottom: 0x004466, fog: 0x003355 },
    name: 'Podmořský svět',
  };
}
