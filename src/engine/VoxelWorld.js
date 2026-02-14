import * as THREE from 'three';
import { BLOCKS, BLOCK_COLORS, TRANSPARENT_BLOCKS } from '../utils/constants.js';

/**
 * VoxelWorld - manages voxel data and mesh generation
 * Optimized for tablet performance using merged geometry
 */
export class VoxelWorld {
  constructor(sizeX = 64, sizeY = 40, sizeZ = 64) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    this.data = new Uint8Array(sizeX * sizeY * sizeZ);
    this.mesh = null;
    this.waterMesh = null;
    this.interactables = new Map(); // position key -> interactable data
    this.particles = [];
  }

  // Get voxel at position
  getBlock(x, y, z) {
    if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY || z < 0 || z >= this.sizeZ) {
      return BLOCKS.AIR;
    }
    return this.data[x + y * this.sizeX + z * this.sizeX * this.sizeY];
  }

  // Set voxel at position
  setBlock(x, y, z, type) {
    if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY || z < 0 || z >= this.sizeZ) return;
    this.data[x + y * this.sizeX + z * this.sizeX * this.sizeY] = type;
  }

  // Add an interactable object at position
  addInteractable(x, y, z, data) {
    const key = `${x},${y},${z}`;
    this.interactables.set(key, { x, y, z, ...data });
  }

  // Get interactable near position
  getInteractableNear(px, py, pz, radius = 3) {
    let closest = null;
    let closestDist = radius;
    for (const [, inter] of this.interactables) {
      const dx = inter.x + 0.5 - px;
      const dy = inter.y + 0.5 - py;
      const dz = inter.z + 0.5 - pz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < closestDist) {
        closestDist = dist;
        closest = inter;
      }
    }
    return closest;
  }

  // Get height at x,z (topmost solid block)
  getHeight(x, z) {
    for (let y = this.sizeY - 1; y >= 0; y--) {
      const block = this.getBlock(x, y, z);
      if (block !== BLOCKS.AIR && block !== BLOCKS.WATER) {
        return y + 1;
      }
    }
    return 0;
  }

  // Check if block at position is solid (for collision)
  isSolid(x, y, z) {
    const block = this.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    return block !== BLOCKS.AIR && block !== BLOCKS.WATER &&
           block !== BLOCKS.FLOWER_RED && block !== BLOCKS.FLOWER_YELLOW &&
           block !== BLOCKS.MUSHROOM && block !== BLOCKS.SEAWEED &&
           block !== BLOCKS.PORTAL;
  }

  // Build optimized mesh from voxel data
  buildMesh(scene) {
    // Remove old meshes
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.mesh.material.length) {
        this.mesh.material.forEach(m => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }
    if (this.waterMesh) {
      scene.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh.material.dispose();
    }

    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    const waterPositions = [];
    const waterNormals = [];
    const waterIndices = [];

    let vertexCount = 0;
    let waterVertexCount = 0;

    // Face definitions: [dx, dy, dz, vertices, normal]
    const faces = [
      { dir: [0, 1, 0], name: 'top', corners: [[0,1,0],[1,1,0],[1,1,1],[0,1,1]], normal: [0,1,0] },
      { dir: [0, -1, 0], name: 'bottom', corners: [[0,0,1],[1,0,1],[1,0,0],[0,0,0]], normal: [0,-1,0] },
      { dir: [1, 0, 0], name: 'side', corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], normal: [1,0,0] },
      { dir: [-1, 0, 0], name: 'side', corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], normal: [-1,0,0] },
      { dir: [0, 0, 1], name: 'side', corners: [[0,0,1],[0,1,1],[1,1,1],[1,0,1]], normal: [0,0,1] },  // Fixed winding
      { dir: [0, 0, -1], name: 'side', corners: [[1,0,0],[1,1,0],[0,1,0],[0,0,0]], normal: [0,0,-1] }, // Fixed winding
    ];

    for (let y = 0; y < this.sizeY; y++) {
      for (let z = 0; z < this.sizeZ; z++) {
        for (let x = 0; x < this.sizeX; x++) {
          const block = this.getBlock(x, y, z);
          if (block === BLOCKS.AIR) continue;

          const isWater = block === BLOCKS.WATER;
          const isTransparent = TRANSPARENT_BLOCKS.has(block);
          const blockColor = BLOCK_COLORS[block];
          if (!blockColor) continue;

          for (const face of faces) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];
            const neighbor = this.getBlock(nx, ny, nz);

            // Only render face if neighbor is air (or transparent and different)
            const shouldRender = isWater
              ? (neighbor === BLOCKS.AIR)
              : (TRANSPARENT_BLOCKS.has(neighbor) && neighbor !== block);

            if (!shouldRender) continue;

            const colorKey = face.name === 'top' ? 'top' : face.name === 'bottom' ? 'bottom' : 'side';
            const color = blockColor[colorKey] || blockColor.top;
            const rgb = hexToRgbFast(color);

            // Add ambient occlusion-like darkening for side/bottom faces
            let r = rgb.r, g = rgb.g, b = rgb.b;
            if (face.name === 'side') { r *= 0.85; g *= 0.85; b *= 0.85; }
            if (face.name === 'bottom') { r *= 0.7; g *= 0.7; b *= 0.7; }

            if (isWater) {
              for (const corner of face.corners) {
                waterPositions.push(x + corner[0], y + corner[1] * 0.85, z + corner[2]);
                waterNormals.push(...face.normal);
              }
              waterIndices.push(
                waterVertexCount, waterVertexCount + 1, waterVertexCount + 2,
                waterVertexCount, waterVertexCount + 2, waterVertexCount + 3
              );
              waterVertexCount += 4;
            } else {
              for (const corner of face.corners) {
                positions.push(x + corner[0], y + corner[1], z + corner[2]);
                normals.push(...face.normal);
                colors.push(r, g, b);
              }
              indices.push(
                vertexCount, vertexCount + 1, vertexCount + 2,
                vertexCount, vertexCount + 2, vertexCount + 3
              );
              vertexCount += 4;
            }
          }
        }
      }
    }

    // Create solid mesh
    if (positions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);

      const material = new THREE.MeshLambertMaterial({
        vertexColors: true,
        side: THREE.FrontSide,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.receiveShadow = true;
      this.mesh.castShadow = true;
      scene.add(this.mesh);
    }

    // Create water mesh
    if (waterPositions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
      geometry.setIndex(waterIndices);

      const material = new THREE.MeshLambertMaterial({
        color: 0x2196F3,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });

      this.waterMesh = new THREE.Mesh(geometry, material);
      scene.add(this.waterMesh);
    }
  }

  // Clear all data
  clear() {
    this.data.fill(BLOCKS.AIR);
    this.interactables.clear();
  }

  // Fill a rectangular region
  fillBox(x1, y1, z1, x2, y2, z2, blockType) {
    for (let y = y1; y <= y2; y++) {
      for (let z = z1; z <= z2; z++) {
        for (let x = x1; x <= x2; x++) {
          this.setBlock(x, y, z, blockType);
        }
      }
    }
  }

  // Build a tree at position
  buildTree(x, y, z, height = 5, leafRadius = 2) {
    // Trunk
    for (let i = 0; i < height; i++) {
      this.setBlock(x, y + i, z, BLOCKS.WOOD);
    }
    // Leaves (sphere-ish)
    const leafY = y + height - 1;
    for (let dy = -1; dy <= leafRadius; dy++) {
      const r = dy === leafRadius ? 1 : leafRadius;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx * dx + dz * dz <= r * r + 1) {
            const bx = x + dx, by = leafY + dy, bz = z + dz;
            if (this.getBlock(bx, by, bz) === BLOCKS.AIR) {
              this.setBlock(bx, by, bz, BLOCKS.LEAVES);
            }
          }
        }
      }
    }
  }

  // Build a simple house
  buildHouse(x, y, z, width = 5, depth = 5, height = 4, wallBlock = BLOCKS.PLANKS, roofBlock = BLOCKS.BRICK) {
    // Floor
    this.fillBox(x, y, z, x + width - 1, y, z + depth - 1, wallBlock);
    // Walls
    for (let h = 1; h < height; h++) {
      for (let i = 0; i < width; i++) {
        this.setBlock(x + i, y + h, z, wallBlock);
        this.setBlock(x + i, y + h, z + depth - 1, wallBlock);
      }
      for (let i = 1; i < depth - 1; i++) {
        this.setBlock(x, y + h, z + i, wallBlock);
        this.setBlock(x + width - 1, y + h, z + i, wallBlock);
      }
    }
    // Door (remove blocks)
    const doorX = x + Math.floor(width / 2);
    this.setBlock(doorX, y + 1, z, BLOCKS.AIR);
    this.setBlock(doorX, y + 2, z, BLOCKS.AIR);
    // Window
    if (width >= 5) {
      this.setBlock(x + 1, y + 2, z, BLOCKS.GLASS);
      this.setBlock(x + width - 2, y + 2, z, BLOCKS.GLASS);
    }
    // Roof
    for (let i = 0; i < width + 2; i++) {
      for (let j = 0; j < depth + 2; j++) {
        this.setBlock(x - 1 + i, y + height, z - 1 + j, roofBlock);
      }
    }
  }

  // Build a portal (vertical ring)
  buildPortal(x, y, z, color = BLOCKS.PORTAL) {
    // 5x5 portal frame
    const frame = [
      [0,0],[1,0],[2,0],[3,0],[4,0],
      [0,1],[4,1],
      [0,2],[4,2],
      [0,3],[4,3],
      [0,4],[1,4],[2,4],[3,4],[4,4],
    ];
    const inside = [
      [1,1],[2,1],[3,1],
      [1,2],[2,2],[3,2],
      [1,3],[2,3],[3,3],
    ];
    for (const [dx, dy] of frame) {
      this.setBlock(x + dx, y + dy, z, BLOCKS.MAGIC_STONE);
    }
    for (const [dx, dy] of inside) {
      this.setBlock(x + dx, y + dy, z, color);
    }
  }
}

// Fast hex to RGB (0-1 range)
function hexToRgbFast(hex) {
  // Handle transparent colors
  if (hex.length > 7) hex = hex.slice(0, 7);
  const num = parseInt(hex.slice(1), 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}
