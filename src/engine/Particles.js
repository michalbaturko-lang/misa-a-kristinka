import * as THREE from 'three';

/**
 * Enhanced particle system - walking dust, landing impact,
 * portal sparkles, big celebration with confetti
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.emitters = [];
    this.persistentEmitters = []; // For continuous effects like portal sparkles
  }

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
      points, velocities, gravity, lifetime, age: 0, count,
    });
  }

  // Walking dust - small brown particles
  walkDust(x, y, z) {
    this.emit(x, y, z, {
      count: 4,
      color: 0x8B6914,
      size: 0.08,
      spread: 0.3,
      lifetime: 0.6,
      gravity: -1,
      velocity: 0.8,
    });
  }

  // Jump landing impact - burst of particles
  landImpact(x, y, z) {
    this.emit(x, y, z, {
      count: 12,
      color: 0x8B6914,
      size: 0.12,
      spread: 1.5,
      lifetime: 0.8,
      gravity: -5,
      velocity: 3,
    });
    // Small stones
    this.emit(x, y, z, {
      count: 5,
      color: 0x999999,
      size: 0.08,
      spread: 1,
      lifetime: 0.6,
      gravity: -8,
      velocity: 4,
    });
  }

  // Portal sparkle ring - emit around a portal position
  portalSparkle(x, y, z) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 0.5;
    const px = x + Math.cos(angle) * radius;
    const pz = z + Math.sin(angle) * radius;
    const py = y + Math.random() * 3;

    this.emit(px, py, pz, {
      count: 2,
      color: Math.random() > 0.5 ? 0xb060ff : 0xd0a0ff,
      size: 0.1,
      spread: 0.2,
      lifetime: 1.5,
      gravity: 1, // float upward
      velocity: 0.5,
    });
  }

  // Star celebration burst - BIG
  celebrate(x, y, z) {
    // Confetti explosion
    const confettiColors = [0xf9ca24, 0xff6b6b, 0x48dbfb, 0x2ecc71, 0xa29bfe, 0xff9ff3, 0xfeca57];
    for (const color of confettiColors) {
      this.emit(x, y, z, {
        count: 15,
        color,
        spread: 4,
        velocity: 8,
        size: 0.25,
        lifetime: 3,
        gravity: -4,
      });
    }
    // Star burst (larger particles)
    this.emit(x, y + 1, z, {
      count: 8,
      color: 0xffd700,
      size: 0.4,
      spread: 2,
      velocity: 6,
      lifetime: 2.5,
      gravity: -2,
    });
    // Sparkle ring outward
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const px = x + Math.cos(angle) * 0.5;
      const pz = z + Math.sin(angle) * 0.5;
      this.emit(px, y + 1, pz, {
        count: 3,
        color: 0xffffff,
        size: 0.15,
        spread: 0.5,
        velocity: 4,
        lifetime: 1.5,
        gravity: -1,
      });
    }
  }

  // Magic sparkle (smaller celebration)
  sparkle(x, y, z, color = 0xa29bfe) {
    this.emit(x, y, z, {
      count: 10,
      color,
      spread: 1.2,
      velocity: 2.5,
      size: 0.12,
      lifetime: 1.5,
    });
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
