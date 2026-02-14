/**
 * ParticleSystem - Canvas 2D particles (stars, confetti, dust, sparkles).
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, opts = {}) {
    const count = opts.count || 5;
    const colors = opts.colors || ['#ffd700'];
    const spread = opts.spread || 20;
    const life = opts.life || 1;
    const speed = opts.speed || 30;
    const size = opts.size || 1;
    const gravity = opts.gravity || 0;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x: x + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: life * (0.7 + Math.random() * 0.3),
        maxLife: life,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: size * (0.5 + Math.random() * 0.5),
        gravity,
        alpha: 1,
      });
    }
  }

  // Walking dust
  walkDust(x, y) {
    this.emit(x, y, {
      count: 2,
      colors: ['#c8a868', '#a08848', '#d8b878'],
      spread: 4,
      life: 0.4,
      speed: 8,
      size: 1,
      gravity: 5,
    });
  }

  // Portal sparkles
  portalSparkle(x, y) {
    this.emit(x, y, {
      count: 1,
      colors: ['#c878ff', '#a858e0', '#e8a8ff', '#fff'],
      spread: 16,
      life: 0.8,
      speed: 12,
      size: 1,
    });
  }

  // Celebration confetti
  celebrate(x, y) {
    this.emit(x, y, {
      count: 40,
      colors: ['#ff3838', '#ff8838', '#ffd838', '#38ff58', '#3878ff', '#c838ff', '#ff38a8'],
      spread: 10,
      life: 2.5,
      speed: 50,
      size: 2,
      gravity: 20,
    });
    // Gold stars
    this.emit(x, y, {
      count: 15,
      colors: ['#ffd700', '#ffe44d', '#ffcc00'],
      spread: 5,
      life: 2,
      speed: 60,
      size: 2,
    });
  }

  // Puzzle success sparkle
  successSparkle(x, y) {
    this.emit(x, y, {
      count: 20,
      colors: ['#ffd700', '#fff', '#ffe44d'],
      spread: 8,
      life: 1.2,
      speed: 30,
      size: 1,
    });
  }

  // Dialog bubble pop
  dialogPop(x, y) {
    this.emit(x, y, {
      count: 6,
      colors: ['#fff', '#e8e0ff', '#c8b8ff'],
      spread: 6,
      life: 0.5,
      speed: 15,
      size: 1,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.alpha = Math.min(1, p.life / (p.maxLife * 0.3));
    }
  }

  getParticles() {
    return this.particles;
  }

  clear() {
    this.particles = [];
  }
}
