import * as THREE from 'three';
import { PLAYER, ROLES } from '../utils/constants.js';
import { clamp } from '../utils/helpers.js';

/**
 * Player - local player with physics, smoother camera, walking state tracking
 */
export class Player {
  constructor(role, name) {
    this.role = role;
    this.name = name;
    this.position = new THREE.Vector3(32, 20, 32);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = { y: 0 };
    this.onGround = false;
    this.wasOnGround = false; // For landing detection
    this.moveInput = { x: 0, z: 0 };
    this.cameraAngleX = 0;
    this.cameraAngleY = 0.3;
    this.cameraDistance = 8;
    this.isWalking = false;
    this.walkTime = 0; // For dust particle timing

    // Smoothed camera position
    this.smoothCamPos = new THREE.Vector3(32, 25, 40);

    this.model = this.createModel();
    this.model.position.copy(this.position);
  }

  createModel() {
    const group = new THREE.Group();
    const isMathe = this.role === ROLES.MATHEMATICIAN;

    const skinColor = 0xfdbcb4;
    const shirtColor = isMathe ? 0x3498db : 0xe74c3c;
    const pantsColor = isMathe ? 0x2c3e50 : 0x8e44ad;

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    const bodyMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.35;
    head.castShadow = true;
    group.add(head);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.44, 0.15, 0.44);
    const hairColor = isMathe ? 0x4a3728 : 0xd4a03c;
    const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.6;
    group.add(hair);

    if (!isMathe) {
      const longHairGeo = new THREE.BoxGeometry(0.42, 0.5, 0.15);
      const longHair = new THREE.Mesh(longHairGeo, hairMat);
      longHair.position.set(0, 1.3, -0.2);
      group.add(longHair);
    }

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 1.38, 0.2);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 1.38, 0.2);
    group.add(rightEye);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.22);
    const legMat = new THREE.MeshLambertMaterial({ color: pantsColor });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.12, 0.3, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    this.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.12, 0.3, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    this.rightLeg = rightLeg;

    // Arms
    const armGeo = new THREE.BoxGeometry(0.15, 0.5, 0.2);
    const armMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.35, 0.85, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    this.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.35, 0.85, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    this.rightArm = rightArm;

    // Role indicator
    const indicatorGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    const indicatorColor = isMathe ? 0x3498db : 0xe74c3c;
    const indicatorMat = new THREE.MeshLambertMaterial({
      color: indicatorColor,
      emissive: indicatorColor,
      emissiveIntensity: 0.3,
    });
    const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    indicator.position.y = 1.9;
    group.add(indicator);
    this.indicator = indicator;

    // Name tag
    this.nameTag = this.createNameTag(this.name);
    this.nameTag.position.y = 2.2;
    group.add(this.nameTag);

    return group;
  }

  createNameTag(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.roundRect(0, 8, 256, 48, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 42);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);
    return sprite;
  }

  update(dt, world) {
    // Track previous ground state for landing detection
    this.wasOnGround = this.onGround;

    // Gravity
    this.velocity.y -= PLAYER.GRAVITY * dt;

    // Movement
    const moveSpeed = PLAYER.SPEED;
    const sin = Math.sin(this.rotation.y);
    const cos = Math.cos(this.rotation.y);

    const moveX = this.moveInput.x * cos - this.moveInput.z * sin;
    const moveZ = this.moveInput.x * sin + this.moveInput.z * cos;

    this.velocity.x = moveX * moveSpeed;
    this.velocity.z = moveZ * moveSpeed;

    // Collision
    const nextX = this.position.x + this.velocity.x * dt;
    const nextY = this.position.y + this.velocity.y * dt;
    const nextZ = this.position.z + this.velocity.z * dt;
    const hw = PLAYER.WIDTH / 2;

    if (!this.checkCollision(nextX, this.position.y, this.position.z, hw, world)) {
      this.position.x = nextX;
    } else {
      this.velocity.x = 0;
    }

    if (!this.checkCollision(this.position.x, this.position.y, nextZ, hw, world)) {
      this.position.z = nextZ;
    } else {
      this.velocity.z = 0;
    }

    if (!this.checkCollision(this.position.x, nextY, this.position.z, hw, world)) {
      this.position.y = nextY;
      this.onGround = false;
    } else {
      if (this.velocity.y < 0) {
        this.onGround = true;
        this.position.y = Math.floor(this.position.y) + 0.001;
      }
      this.velocity.y = 0;
    }

    // Bounds
    this.position.x = clamp(this.position.x, 1, world.sizeX - 1);
    this.position.z = clamp(this.position.z, 1, world.sizeZ - 1);

    if (this.position.y < -5) {
      this.position.y = 30;
      this.velocity.y = 0;
    }

    // Walking state
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    this.isWalking = speed > 0.5 && this.onGround;
    if (this.isWalking) this.walkTime += dt;
    else this.walkTime = 0;

    // Just landed detection
    this.justLanded = !this.wasOnGround && this.onGround && this.velocity.y === 0;

    // Update model
    this.model.position.copy(this.position);
    this.model.rotation.y = this.rotation.y;

    // Animate limbs
    if (speed > 0.5) {
      const t = performance.now() / 200;
      const swing = Math.sin(t) * 0.5;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing;
      this.rightArm.rotation.x = swing;
    } else {
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      this.leftArm.rotation.x *= 0.8;
      this.rightArm.rotation.x *= 0.8;
    }

    this.indicator.rotation.y += dt * 2;
  }

  checkCollision(x, y, z, hw, world) {
    const checks = [
      [x - hw, y, z - hw],
      [x + hw, y, z - hw],
      [x - hw, y, z + hw],
      [x + hw, y, z + hw],
      [x - hw, y + PLAYER.HEIGHT, z - hw],
      [x + hw, y + PLAYER.HEIGHT, z - hw],
      [x - hw, y + PLAYER.HEIGHT, z + hw],
      [x + hw, y + PLAYER.HEIGHT, z + hw],
      [x, y + PLAYER.HEIGHT * 0.5, z],
    ];
    for (const [cx, cy, cz] of checks) {
      if (world.isSolid(cx, cy, cz)) return true;
    }
    return false;
  }

  jump() {
    if (this.onGround) {
      this.velocity.y = PLAYER.JUMP_FORCE;
      this.onGround = false;
    }
  }

  updateCamera(camera) {
    // Smoothed third-person camera
    const targetX = this.position.x - Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY) * this.cameraDistance;
    const targetY = this.position.y + PLAYER.HEIGHT + Math.sin(this.cameraAngleY) * this.cameraDistance;
    const targetZ = this.position.z - Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY) * this.cameraDistance;

    // Smooth camera with stronger damping
    this.smoothCamPos.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.06);
    camera.position.copy(this.smoothCamPos);

    camera.lookAt(
      this.position.x,
      this.position.y + PLAYER.HEIGHT * 0.7,
      this.position.z
    );

    this.rotation.y = this.cameraAngleX;
  }

  getSerializableState() {
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      rotation: { y: this.rotation.y },
    };
  }
}
