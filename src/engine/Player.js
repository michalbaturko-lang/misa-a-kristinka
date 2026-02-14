import { TILE_SIZE, CHAR_W, CHAR_H, PLAYER_SPEED, DIRECTIONS, ANIM_SPEED,
  SOLID_TILES, SOLID_DECORS, SMALL_SOLID_DECORS } from '../utils/constants.js';
import { clamp, audio } from '../utils/helpers.js';

/**
 * Player - 2D character with tile collision, walk animation.
 */
export class Player {
  constructor(role, sprites) {
    this.role = role;
    this.sheet = sprites.getCharacter(role);
    this.x = 0;
    this.y = 0;
    this.dir = DIRECTIONS.DOWN;
    this.animFrame = 0;
    this.animTimer = 0;
    this.moving = false;
    this.speed = PLAYER_SPEED;

    // Collision box (in sprite-space pixels, centered on x,y which is feet)
    this.colW = 8;
    this.colH = 6;

    // Footstep timer
    this.footstepTimer = 0;
  }

  setPosition(tx, ty) {
    this.x = tx * TILE_SIZE + TILE_SIZE / 2;
    this.y = ty * TILE_SIZE + TILE_SIZE / 2;
  }

  update(dt, controls, world) {
    const mx = controls.moveX;
    const my = controls.moveY;
    this.moving = mx !== 0 || my !== 0;

    if (this.moving) {
      this.dir = controls.direction;

      // Normalize diagonal
      let len = Math.sqrt(mx * mx + my * my);
      if (len > 1) len = 1;
      const dx = (mx / (len || 1)) * this.speed * dt;
      const dy = (my / (len || 1)) * this.speed * dt;

      // Move with collision (separate axes)
      const newX = this.x + dx;
      if (!this.collides(newX, this.y, world)) {
        this.x = newX;
      }
      const newY = this.y + dy;
      if (!this.collides(this.x, newY, world)) {
        this.y = newY;
      }

      // Clamp to world bounds
      this.x = clamp(this.x, this.colW / 2, world.width * TILE_SIZE - this.colW / 2);
      this.y = clamp(this.y, this.colH / 2, world.height * TILE_SIZE - this.colH / 2);

      // Walk animation
      this.animTimer += dt * ANIM_SPEED;
      if (this.animTimer >= 1) {
        this.animTimer -= 1;
        this.animFrame = (this.animFrame + 1) % 4;
      }

      // Footstep sound
      this.footstepTimer += dt;
      if (this.footstepTimer > 0.35) {
        this.footstepTimer = 0;
        audio.playEffect('footstep');
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
      this.footstepTimer = 0;
    }
  }

  collides(px, py, world) {
    const hw = this.colW / 2, hh = this.colH / 2;
    // Check tile collision at four corners of collision box
    const corners = [
      { x: px - hw, y: py - hh },
      { x: px + hw, y: py - hh },
      { x: px - hw, y: py + hh },
      { x: px + hw, y: py + hh },
    ];
    for (const c of corners) {
      const tx = Math.floor(c.x / TILE_SIZE);
      const ty = Math.floor(c.y / TILE_SIZE);
      const tile = world.getTile(tx, ty);
      if (SOLID_TILES.has(tile)) return true;
    }

    // Check decoration collision
    for (const d of world.decorations) {
      if (SOLID_DECORS.has(d.type)) {
        // 2x2 tile footprint
        const dx = d.x * TILE_SIZE, dy = d.y * TILE_SIZE;
        if (px + hw > dx && px - hw < dx + TILE_SIZE * 2 &&
            py + hh > dy && py - hh < dy + TILE_SIZE) {
          return true;
        }
      } else if (SMALL_SOLID_DECORS.has(d.type)) {
        const dx = d.x * TILE_SIZE, dy = d.y * TILE_SIZE;
        if (px + hw > dx + 2 && px - hw < dx + TILE_SIZE - 2 &&
            py + hh > dy + 2 && py - hh < dy + TILE_SIZE - 2) {
          return true;
        }
      }
    }

    return false;
  }

  // Get tile player is standing on
  getTilePos() {
    return {
      x: Math.floor(this.x / TILE_SIZE),
      y: Math.floor(this.y / TILE_SIZE),
    };
  }

  // Get tile player is facing
  getFacingTile() {
    const t = this.getTilePos();
    switch (this.dir) {
      case DIRECTIONS.UP: return { x: t.x, y: t.y - 1 };
      case DIRECTIONS.DOWN: return { x: t.x, y: t.y + 1 };
      case DIRECTIONS.LEFT: return { x: t.x - 1, y: t.y };
      case DIRECTIONS.RIGHT: return { x: t.x + 1, y: t.y };
    }
    return t;
  }

  getNetworkState() {
    return {
      position: { x: this.x, y: this.y },
      rotation: { y: this.dir },
    };
  }
}

/**
 * RemotePlayer - renders another player's character.
 */
export class RemotePlayer {
  constructor(id, role, name, sprites) {
    this.id = id;
    this.role = role;
    this.name = name;
    this.sheet = sprites.getCharacter(role);
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.dir = DIRECTIONS.DOWN;
    this.animFrame = 0;
    this.animTimer = 0;
    this.moving = false;
  }

  setTarget(x, y, dir) {
    this.targetX = x;
    this.targetY = y;
    this.dir = dir;
  }

  update(dt) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.moving = dist > 1;

    if (this.moving) {
      const speed = Math.min(dist, PLAYER_SPEED * dt * 1.5);
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;

      this.animTimer += dt * ANIM_SPEED;
      if (this.animTimer >= 1) {
        this.animTimer -= 1;
        this.animFrame = (this.animFrame + 1) % 4;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }
}
