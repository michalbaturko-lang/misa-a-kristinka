import { BLOCKS } from '../utils/constants.js';
import { createNoise, octaveNoise } from '../utils/helpers.js';

/**
 * Space World - Space station orbiting a planet
 *
 * Puzzles:
 * 1. Power Generator - Restore power with math sequences
 * 2. Control Room - Color-code the systems
 * 3. Airlock Repair - Calculate pressure + pattern
 * 4. Alien Message - Decode numbers and draw symbols
 */
export function buildSpaceWorld(world) {
  world.clear();

  // Space has a flat metal floor with void below
  const floorY = 10;

  // === MAIN STATION STRUCTURE ===
  const cx = 32, cz = 32;

  // Central hub (large circular platform)
  for (let dx = -12; dx <= 12; dx++) {
    for (let dz = -12; dz <= 12; dz++) {
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= 12) {
        world.setBlock(cx + dx, floorY, cz + dz, BLOCKS.METAL);
        world.setBlock(cx + dx, floorY - 1, cz + dz, BLOCKS.METAL);
        // Walls at edge
        if (dist > 11 && dist <= 12) {
          for (let dy = 1; dy <= 3; dy++) {
            world.setBlock(cx + dx, floorY + dy, cz + dz, BLOCKS.METAL);
          }
        }
      }
    }
  }

  // Central tower
  for (let dy = 1; dy <= 8; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (Math.abs(dx) + Math.abs(dz) <= 1) {
          world.setBlock(cx + dx, floorY + dy, cz + dz, BLOCKS.METAL);
        }
      }
    }
  }
  world.setBlock(cx, floorY + 9, cz, BLOCKS.LIGHT);

  // Corridor to wing 1 (north - power room)
  const wing1Z = cz - 20;
  for (let z = cz - 12; z >= wing1Z; z--) {
    for (let dx = -2; dx <= 2; dx++) {
      world.setBlock(cx + dx, floorY, z, BLOCKS.METAL);
      if (Math.abs(dx) === 2) {
        world.setBlock(cx + dx, floorY + 1, z, BLOCKS.METAL);
        world.setBlock(cx + dx, floorY + 2, z, BLOCKS.METAL);
      }
      world.setBlock(cx + dx, floorY + 3, z, BLOCKS.METAL);
    }
    // Lights every 4 blocks
    if ((cz - z) % 4 === 0) {
      world.setBlock(cx, floorY + 3, z, BLOCKS.LIGHT);
    }
  }

  // Wing 1: Power Room
  for (let dx = -5; dx <= 5; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      world.setBlock(cx + dx, floorY, wing1Z + dz, BLOCKS.METAL);
      // Walls
      if (Math.abs(dx) === 5 || Math.abs(dz) === 5) {
        for (let dy = 1; dy <= 4; dy++) {
          world.setBlock(cx + dx, floorY + dy, wing1Z + dz, BLOCKS.METAL);
        }
      }
      world.setBlock(cx + dx, floorY + 5, wing1Z + dz, BLOCKS.METAL);
    }
  }
  // Doorway
  for (let dy = 1; dy <= 3; dy++) {
    world.setBlock(cx - 1, floorY + dy, wing1Z + 5, BLOCKS.AIR);
    world.setBlock(cx, floorY + dy, wing1Z + 5, BLOCKS.AIR);
    world.setBlock(cx + 1, floorY + dy, wing1Z + 5, BLOCKS.AIR);
  }

  // Power generator (crystal + gold blocks)
  world.setBlock(cx, floorY + 1, wing1Z, BLOCKS.GOLD);
  world.setBlock(cx, floorY + 2, wing1Z, BLOCKS.CRYSTAL);
  world.setBlock(cx - 2, floorY + 1, wing1Z - 2, BLOCKS.LIGHT);
  world.setBlock(cx + 2, floorY + 1, wing1Z - 2, BLOCKS.LIGHT);
  world.setBlock(cx + 3, floorY + 2, wing1Z, BLOCKS.PUZZLE_BLOCK);
  world.setBlock(cx - 3, floorY + 2, wing1Z, BLOCKS.PUZZLE_BLOCK);

  world.addInteractable(cx, floorY + 2, wing1Z, {
    type: 'puzzle',
    puzzleType: 'power',
    puzzleId: 'space_power',
    name: 'Generátor energie',
    description: 'Generátor nefunguje! Míša musí zadat správnou energetickou sekvenci, Kristinka nastaví barevné filtry.',
    mathTask: 'Energetická sekvence: 2, 4, 8, 16, ? (jaké číslo pokračuje?)',
    creativeTask: 'Nastav filtry: červená-oranžová-žlutá (jako sluneční energie)',
    mathAnswer: 32,
    requiredColors: ['#e74c3c', '#e67e22', '#f1c40f'],
  });

  // Corridor to wing 2 (east - control room)
  const wing2X = cx + 20;
  for (let x = cx + 12; x <= wing2X; x++) {
    for (let dz = -2; dz <= 2; dz++) {
      world.setBlock(x, floorY, cz + dz, BLOCKS.METAL);
      if (Math.abs(dz) === 2) {
        world.setBlock(x, floorY + 1, cz + dz, BLOCKS.METAL);
        world.setBlock(x, floorY + 2, cz + dz, BLOCKS.METAL);
      }
      world.setBlock(x, floorY + 3, cz + dz, BLOCKS.METAL);
    }
    if ((x - cx) % 4 === 0) {
      world.setBlock(x, floorY + 3, cz, BLOCKS.LIGHT);
    }
  }

  // Wing 2: Control Room
  for (let dx = -5; dx <= 5; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      world.setBlock(wing2X + dx, floorY, cz + dz, BLOCKS.METAL);
      if (Math.abs(dx) === 5 || Math.abs(dz) === 5) {
        for (let dy = 1; dy <= 4; dy++) {
          world.setBlock(wing2X + dx, floorY + dy, cz + dz, BLOCKS.METAL);
        }
      }
      world.setBlock(wing2X + dx, floorY + 5, cz + dz, BLOCKS.METAL);
    }
  }
  // Windows
  for (let dz = -2; dz <= 2; dz++) {
    world.setBlock(wing2X + 5, floorY + 2, cz + dz, BLOCKS.GLASS);
    world.setBlock(wing2X + 5, floorY + 3, cz + dz, BLOCKS.GLASS);
  }
  // Door
  for (let dy = 1; dy <= 3; dy++) {
    world.setBlock(wing2X - 5, floorY + dy, cz - 1, BLOCKS.AIR);
    world.setBlock(wing2X - 5, floorY + dy, cz, BLOCKS.AIR);
    world.setBlock(wing2X - 5, floorY + dy, cz + 1, BLOCKS.AIR);
  }

  // Control consoles
  for (let dz = -3; dz <= 3; dz++) {
    world.setBlock(wing2X + 3, floorY + 1, cz + dz, BLOCKS.METAL);
    world.setBlock(wing2X + 3, floorY + 2, cz + dz, BLOCKS.PUZZLE_BLOCK);
  }
  world.setBlock(wing2X, floorY + 4, cz, BLOCKS.LIGHT);

  world.addInteractable(wing2X + 3, floorY + 2, cz, {
    type: 'puzzle',
    puzzleType: 'controls',
    puzzleId: 'space_controls',
    name: 'Řídicí centrum',
    description: 'Systémy stanice jsou offline! Obnovte je společně.',
    mathTask: 'Kód pro systém: 144 ÷ 12 = ?',
    creativeTask: 'Každý systém má svou barvu: navigace=modrá, kyslík=zelená, štíty=červená. Přiřaď správně!',
    mathAnswer: 12,
    requiredColors: ['#3498db', '#2ecc71', '#e74c3c'],
  });

  // Corridor to wing 3 (south - airlock)
  const wing3Z = cz + 20;
  for (let z = cz + 12; z <= wing3Z; z++) {
    for (let dx = -2; dx <= 2; dx++) {
      world.setBlock(cx + dx, floorY, z, BLOCKS.METAL);
      if (Math.abs(dx) === 2) {
        world.setBlock(cx + dx, floorY + 1, z, BLOCKS.METAL);
        world.setBlock(cx + dx, floorY + 2, z, BLOCKS.METAL);
      }
      world.setBlock(cx + dx, floorY + 3, z, BLOCKS.METAL);
    }
    if ((z - cz) % 4 === 0) {
      world.setBlock(cx, floorY + 3, z, BLOCKS.LIGHT);
    }
  }

  // Wing 3: Airlock
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      world.setBlock(cx + dx, floorY, wing3Z + dz, BLOCKS.METAL);
      if (Math.abs(dx) === 4 || Math.abs(dz) === 4) {
        for (let dy = 1; dy <= 4; dy++) {
          world.setBlock(cx + dx, floorY + dy, wing3Z + dz, BLOCKS.METAL);
        }
      }
      world.setBlock(cx + dx, floorY + 5, wing3Z + dz, BLOCKS.METAL);
    }
  }
  // Door in
  for (let dy = 1; dy <= 3; dy++) {
    world.setBlock(cx - 1, floorY + dy, wing3Z - 4, BLOCKS.AIR);
    world.setBlock(cx, floorY + dy, wing3Z - 4, BLOCKS.AIR);
    world.setBlock(cx + 1, floorY + dy, wing3Z - 4, BLOCKS.AIR);
  }

  // Airlock mechanism
  world.setBlock(cx + 2, floorY + 2, wing3Z + 2, BLOCKS.PUZZLE_BLOCK);
  world.setBlock(cx - 2, floorY + 2, wing3Z + 2, BLOCKS.PUZZLE_BLOCK);
  world.setBlock(cx, floorY + 1, wing3Z, BLOCKS.LIGHT);

  world.addInteractable(cx, floorY + 1, wing3Z, {
    type: 'puzzle',
    puzzleType: 'airlock',
    puzzleId: 'space_airlock',
    name: 'Oprava vzduchové komory',
    description: 'Vzduchová komora je poškozená! Opravte ji, než dojde vzduch!',
    mathTask: 'Správný tlak: stanice má 100 jednotek, únik je 37. Kolik zbývá?',
    creativeTask: 'Zapoj kabely: zelený-modrý-červený-žlutý (podle schématu)',
    mathAnswer: 63,
    requiredColors: ['#2ecc71', '#3498db', '#e74c3c', '#f1c40f'],
  });

  // Corridor to wing 4 (west - comm room)
  const wing4X = cx - 20;
  for (let x = cx - 12; x >= wing4X; x--) {
    for (let dz = -2; dz <= 2; dz++) {
      world.setBlock(x, floorY, cz + dz, BLOCKS.METAL);
      if (Math.abs(dz) === 2) {
        world.setBlock(x, floorY + 1, cz + dz, BLOCKS.METAL);
        world.setBlock(x, floorY + 2, cz + dz, BLOCKS.METAL);
      }
      world.setBlock(x, floorY + 3, cz + dz, BLOCKS.METAL);
    }
    if ((cx - x) % 4 === 0) {
      world.setBlock(x, floorY + 3, cz, BLOCKS.LIGHT);
    }
  }

  // Wing 4: Communication Room (Alien Message)
  for (let dx = -5; dx <= 5; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      world.setBlock(wing4X + dx, floorY, cz + dz, BLOCKS.METAL);
      if (Math.abs(dx) === 5 || Math.abs(dz) === 5) {
        for (let dy = 1; dy <= 4; dy++) {
          world.setBlock(wing4X + dx, floorY + dy, cz + dz, BLOCKS.METAL);
        }
      }
      world.setBlock(wing4X + dx, floorY + 5, cz + dz, BLOCKS.METAL);
    }
  }
  // Door
  for (let dy = 1; dy <= 3; dy++) {
    world.setBlock(wing4X + 5, floorY + dy, cz - 1, BLOCKS.AIR);
    world.setBlock(wing4X + 5, floorY + dy, cz, BLOCKS.AIR);
    world.setBlock(wing4X + 5, floorY + dy, cz + 1, BLOCKS.AIR);
  }

  // Alien display (grid of crystals)
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = 1; dy <= 3; dy++) {
      world.setBlock(wing4X - 3, floorY + dy, cz + dx, BLOCKS.CRYSTAL);
    }
  }
  world.setBlock(wing4X, floorY + 4, cz, BLOCKS.LIGHT);

  world.addInteractable(wing4X - 3, floorY + 2, cz, {
    type: 'puzzle',
    puzzleType: 'alien',
    puzzleId: 'space_alien',
    name: 'Mimozemský vzkaz',
    description: 'Přijali jsme zprávu od mimozemšťanů! Rozluštěte ji společně.',
    mathTask: 'Mimozemské číslo: ▲●● = 1×100 + 2×10 + 2×1 = ?',
    creativeTask: 'Nakresli odpověď mimozemšťanům - symbol míru v 5 barvách!',
    mathAnswer: 122,
  });

  // Spawn area portal
  world.buildPortal(cx + 5, floorY + 1, cz + 5);
  world.addInteractable(cx + 7, floorY + 2, cz + 5, {
    type: 'portal',
    world: 'hub',
    name: 'Zpět na základnu',
    description: 'Teleportovat zpět na Zemi',
  });

  // Decorative: Some "stars" below the station (glowing blocks in the void)
  for (let i = 0; i < 30; i++) {
    const sx = Math.floor(Math.random() * 60) + 2;
    const sz = Math.floor(Math.random() * 60) + 2;
    const sy = Math.floor(Math.random() * 5);
    world.setBlock(sx, sy, sz, BLOCKS.LIGHT);
  }

  return {
    spawnPoint: { x: cx, y: floorY + 1, z: cz + 3 },
    skyColors: { top: 0x000011, bottom: 0x000033, fog: 0x000022 },
    name: 'Vesmírná stanice',
  };
}
