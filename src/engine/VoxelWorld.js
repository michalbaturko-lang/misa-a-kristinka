import * as THREE from 'three';
import { BLOCKS, BLOCK_COLORS, TRANSPARENT_BLOCKS } from '../utils/constants.js';
import { TextureGenerator } from './TextureGenerator.js';

/**
 * VoxelWorld - manages voxel data and mesh generation
 * With procedural texture atlas and per-vertex ambient occlusion
 */
export class VoxelWorld {
  constructor(sizeX = 64, sizeY = 40, sizeZ = 64) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    this.data = new Uint8Array(sizeX * sizeY * sizeZ);
    this.mesh = null;
    this.waterMesh = null;
    this.interactables = new Map();
    this.particles = [];
    this.textureGen = new TextureGenerator();
    this.portalMeshes = [];
  }

  getBlock(x, y, z) {
    if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY || z < 0 || z >= this.sizeZ) {
      return BLOCKS.AIR;
    }
    return this.data[x + y * this.sizeX + z * this.sizeX * this.sizeY];
  }

  setBlock(x, y, z, type) {
    if (x < 0 || x >= this.sizeX || y < 0 || y >= this.sizeY || z < 0 || z >= this.sizeZ) return;
    this.data[x + y * this.sizeX + z * this.sizeX * this.sizeY] = type;
  }

  addInteractable(x, y, z, data) {
    const key = `${x},${y},${z}`;
    this.interactables.set(key, { x, y, z, ...data });
  }

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

  getHeight(x, z) {
    for (let y = this.sizeY - 1; y >= 0; y--) {
      const block = this.getBlock(x, y, z);
      if (block !== BLOCKS.AIR && block !== BLOCKS.WATER) {
        return y + 1;
      }
    }
    return 0;
  }

  isSolid(x, y, z) {
    const block = this.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    return block !== BLOCKS.AIR && block !== BLOCKS.WATER &&
           block !== BLOCKS.FLOWER_RED && block !== BLOCKS.FLOWER_YELLOW &&
           block !== BLOCKS.MUSHROOM && block !== BLOCKS.SEAWEED &&
           block !== BLOCKS.PORTAL;
  }

  buildMesh(scene) {
    // Remove old meshes
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
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
    for (const pm of this.portalMeshes) {
      scene.remove(pm);
      if (pm.geometry) pm.geometry.dispose();
      if (pm.material) pm.material.dispose();
    }
    this.portalMeshes = [];

    const positions = [];
    const normals = [];
    const colors = [];
    const uvs = [];
    const indices = [];
    const waterPositions = [];
    const waterNormals = [];
    const waterUvs = [];
    const waterIndices = [];

    let vertexCount = 0;
    let waterVertexCount = 0;

    const faces = [
      { dir: [0, 1, 0], faceType: 0, corners: [[0,1,0],[1,1,0],[1,1,1],[0,1,1]], normal: [0,1,0] },
      { dir: [0, -1, 0], faceType: 2, corners: [[0,0,1],[1,0,1],[1,0,0],[0,0,0]], normal: [0,-1,0] },
      { dir: [1, 0, 0], faceType: 1, corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]], normal: [1,0,0] },
      { dir: [-1, 0, 0], faceType: 1, corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]], normal: [-1,0,0] },
      { dir: [0, 0, 1], faceType: 1, corners: [[0,0,1],[0,1,1],[1,1,1],[1,0,1]], normal: [0,0,1] },
      { dir: [0, 0, -1], faceType: 1, corners: [[1,0,0],[1,1,0],[0,1,0],[0,0,0]], normal: [0,0,-1] },
    ];

    const portalPositions = [];

    for (let y = 0; y < this.sizeY; y++) {
      for (let z = 0; z < this.sizeZ; z++) {
        for (let x = 0; x < this.sizeX; x++) {
          const block = this.getBlock(x, y, z);
          if (block === BLOCKS.AIR) continue;

          if (block === BLOCKS.PORTAL) {
            portalPositions.push({ x, y, z });
          }

          const isWater = block === BLOCKS.WATER;
          const blockColor = BLOCK_COLORS[block];
          if (!blockColor) continue;

          for (const face of faces) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];
            const neighbor = this.getBlock(nx, ny, nz);

            const shouldRender = isWater
              ? (neighbor === BLOCKS.AIR)
              : (TRANSPARENT_BLOCKS.has(neighbor) && neighbor !== block);

            if (!shouldRender) continue;

            const uv = this.textureGen.getUV(block, face.faceType);
            const uvCorners = [
              [uv.u0, uv.v0],
              [uv.u1, uv.v0],
              [uv.u1, uv.v1],
              [uv.u0, uv.v1],
            ];

            // Per-vertex AO
            const aoValues = [];
            for (let ci = 0; ci < 4; ci++) {
              const c = face.corners[ci];
              const cdx = c[0] === 0 ? -1 : 1;
              const cdy = c[1] === 0 ? -1 : 1;
              const cdz = c[2] === 0 ? -1 : 1;

              const ox = x + face.dir[0];
              const oy = y + face.dir[1];
              const oz = z + face.dir[2];

              const s1 = this.getBlock(ox + cdx, oy, oz) !== BLOCKS.AIR ? 1 : 0;
              const s2 = this.getBlock(ox, oy + cdy, oz) !== BLOCKS.AIR ? 1 : 0;
              const s3 = this.getBlock(ox, oy, oz + cdz) !== BLOCKS.AIR ? 1 : 0;
              const cr = this.getBlock(ox + cdx, oy + cdy, oz + cdz) !== BLOCKS.AIR ? 1 : 0;

              const ao = s1 + s2 + s3 + (s1 && s2 ? 1 : cr);
              aoValues.push(Math.max(0.5, 1.0 - ao * 0.1));
            }

            let faceBrightness = 1.0;
            if (face.faceType === 1) faceBrightness = 0.85;
            if (face.faceType === 2) faceBrightness = 0.7;

            if (isWater) {
              for (let ci = 0; ci < 4; ci++) {
                const c = face.corners[ci];
                waterPositions.push(x + c[0], y + c[1] * 0.85, z + c[2]);
                waterNormals.push(...face.normal);
                waterUvs.push(uvCorners[ci][0], uvCorners[ci][1]);
              }
              waterIndices.push(
                waterVertexCount, waterVertexCount + 1, waterVertexCount + 2,
                waterVertexCount, waterVertexCount + 2, waterVertexCount + 3
              );
              waterVertexCount += 4;
            } else {
              for (let ci = 0; ci < 4; ci++) {
                const c = face.corners[ci];
                positions.push(x + c[0], y + c[1], z + c[2]);
                normals.push(...face.normal);
                uvs.push(uvCorners[ci][0], uvCorners[ci][1]);
                const brightness = aoValues[ci] * faceBrightness;
                colors.push(brightness, brightness, brightness);
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

    // Solid mesh with texture atlas
    if (positions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);

      const material = new THREE.MeshLambertMaterial({
        map: this.textureGen.texture,
        vertexColors: true,
        side: THREE.FrontSide,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.receiveShadow = true;
      this.mesh.castShadow = true;
      scene.add(this.mesh);
    }

    // Water mesh
    if (waterPositions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2));
      geometry.setIndex(waterIndices);

      const material = new THREE.MeshLambertMaterial({
        map: this.textureGen.texture,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      });

      this.waterMesh = new THREE.Mesh(geometry, material);
      scene.add(this.waterMesh);
    }

    // Portal glow effects
    this.createPortalGlows(scene, portalPositions);
  }

  createPortalGlows(scene, portalPositions) {
    if (portalPositions.length === 0) return;

    // Cluster nearby portal blocks
    const visited = new Set();
    const clusters = [];

    for (const pos of portalPositions) {
      const key = `${pos.x},${pos.y},${pos.z}`;
      if (visited.has(key)) continue;

      const cluster = [];
      const stack = [pos];
      while (stack.length > 0) {
        const p = stack.pop();
        const k = `${p.x},${p.y},${p.z}`;
        if (visited.has(k)) continue;
        visited.add(k);
        cluster.push(p);

        for (const pp of portalPositions) {
          const dk = `${pp.x},${pp.y},${pp.z}`;
          if (!visited.has(dk) && Math.abs(pp.x - p.x) + Math.abs(pp.y - p.y) + Math.abs(pp.z - p.z) <= 2) {
            stack.push(pp);
          }
        }
      }
      if (cluster.length > 0) clusters.push(cluster);
    }

    for (const cluster of clusters) {
      let cx = 0, cy = 0, cz = 0;
      for (const p of cluster) {
        cx += p.x + 0.5;
        cy += p.y + 0.5;
        cz += p.z + 0.5;
      }
      cx /= cluster.length;
      cy /= cluster.length;
      cz /= cluster.length;

      // Outer glow sphere
      const glowGeo = new THREE.SphereGeometry(1.8, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xb060ff,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.set(cx, cy, cz);
      glowMesh.userData.isPortalGlow = true;
      glowMesh.userData.baseOpacity = 0.25;
      scene.add(glowMesh);
      this.portalMeshes.push(glowMesh);

      // Inner bright orb
      const innerGeo = new THREE.SphereGeometry(0.8, 12, 12);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xd0a0ff,
        transparent: true,
        opacity: 0.5,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.position.set(cx, cy, cz);
      innerMesh.userData.isPortalGlow = true;
      innerMesh.userData.baseOpacity = 0.5;
      innerMesh.userData.isInner = true;
      scene.add(innerMesh);
      this.portalMeshes.push(innerMesh);

      // Portal point light
      const light = new THREE.PointLight(0xb060ff, 2, 10);
      light.position.set(cx, cy, cz);
      scene.add(light);
      this.portalMeshes.push(light);
    }
  }

  animatePortals(time) {
    for (const mesh of this.portalMeshes) {
      if (mesh.isPointLight) {
        mesh.intensity = 1.5 + Math.sin(time * 0.003) * 0.8;
      } else if (mesh.userData.isPortalGlow) {
        const t = time * 0.001;
        const pulse = Math.sin(t * 2) * 0.15;
        mesh.material.opacity = mesh.userData.baseOpacity + pulse;
        if (mesh.userData.isInner) {
          mesh.rotation.y = t * 1.5;
          mesh.rotation.z = Math.sin(t) * 0.3;
          mesh.scale.setScalar(1 + Math.sin(t * 3) * 0.1);
        } else {
          mesh.rotation.y = t;
          mesh.scale.setScalar(1 + Math.sin(t * 2) * 0.15);
        }
      }
    }
  }

  clear() {
    this.data.fill(BLOCKS.AIR);
    this.interactables.clear();
  }

  fillBox(x1, y1, z1, x2, y2, z2, blockType) {
    for (let y = y1; y <= y2; y++) {
      for (let z = z1; z <= z2; z++) {
        for (let x = x1; x <= x2; x++) {
          this.setBlock(x, y, z, blockType);
        }
      }
    }
  }

  buildTree(x, y, z, height = 5, leafRadius = 2) {
    for (let i = 0; i < height; i++) {
      this.setBlock(x, y + i, z, BLOCKS.WOOD);
    }
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

  buildHouse(x, y, z, width = 5, depth = 5, height = 4, wallBlock = BLOCKS.PLANKS, roofBlock = BLOCKS.BRICK) {
    this.fillBox(x, y, z, x + width - 1, y, z + depth - 1, wallBlock);
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
    const doorX = x + Math.floor(width / 2);
    this.setBlock(doorX, y + 1, z, BLOCKS.AIR);
    this.setBlock(doorX, y + 2, z, BLOCKS.AIR);
    if (width >= 5) {
      this.setBlock(x + 1, y + 2, z, BLOCKS.GLASS);
      this.setBlock(x + width - 2, y + 2, z, BLOCKS.GLASS);
    }
    for (let i = 0; i < width + 2; i++) {
      for (let j = 0; j < depth + 2; j++) {
        this.setBlock(x - 1 + i, y + height, z - 1 + j, roofBlock);
      }
    }
  }

  buildPortal(x, y, z, color = BLOCKS.PORTAL) {
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
