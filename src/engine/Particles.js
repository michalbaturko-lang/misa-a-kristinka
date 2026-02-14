import * as THREE from 'three';

/**
 * Simple particle system for celebration effects, magic, etc.
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.emitters = [];
  }

  // Emit particles at position
  emit(x, y, z, options = {}) {
    const {
      count = 20,
      color = 0xf9ca24,
      size = 0.15,
      spread = 2,
      lifetime = 2,
      gravity = -3,
      velocity = 5,
    } = options;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      velocities.push(
        (Math.random() - 0.5) * spread * velocity,
        Math.random() * velocity,
        (Math.random() - 0.5) * spread * velocity
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.emitters.push({
      points,
      velocities,
      gravity,
      lifetime,
      age: 0,
      count,
    });
  }

  // Star celebration burst
  celebrate(x, y, z) {
    const colors = [0xf9ca24, 0xff6b6b, 0x48dbfb, 0x2ecc71, 0xa29bfe];
    for (const color of colors) {
      this.emit(x, y, z, { count: 10, color, spread: 3, velocity: 6, size: 0.2 });
    }
  }

  // Magic sparkle
  sparkle(x, y, z, color = 0xa29bfe) {
    this.emit(x, y, z, { count: 8, color, spread: 1, velocity: 2, size: 0.1, lifetime: 1.5 });
  }

  update(dt) {
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i];
      emitter.age += dt;

      if (emitter.age >= emitter.lifetime) {
        this.scene.remove(emitter.points);
        emitter.points.geometry.dispose();
        emitter.points.material.dispose();
        this.emitters.splice(i, 1);
        continue;
      }

      const positions = emitter.points.geometry.attributes.position.array;
      for (let j = 0; j < emitter.count; j++) {
        positions[j * 3] += emitter.velocities[j * 3] * dt;
        positions[j * 3 + 1] += emitter.velocities[j * 3 + 1] * dt;
        positions[j * 3 + 2] += emitter.velocities[j * 3 + 2] * dt;
        emitter.velocities[j * 3 + 1] += emitter.gravity * dt;
      }
      emitter.points.geometry.attributes.position.needsUpdate = true;

      // Fade out
      const progress = emitter.age / emitter.lifetime;
      emitter.points.material.opacity = 1 - progress;
    }
  }

  dispose() {
    for (const emitter of this.emitters) {
      this.scene.remove(emitter.points);
      emitter.points.geometry.dispose();
      emitter.points.material.dispose();
    }
    this.emitters = [];
  }
}
