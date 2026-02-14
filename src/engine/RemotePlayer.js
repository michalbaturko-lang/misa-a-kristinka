import * as THREE from 'three';
import { ROLES } from '../utils/constants.js';
import { lerp } from '../utils/helpers.js';

/**
 * RemotePlayer - represents the other player (network synced)
 */
export class RemotePlayer {
  constructor(data) {
    this.id = data.id;
    this.role = data.role;
    this.name = data.name;
    this.targetPosition = new THREE.Vector3(
      data.position?.x || 32,
      data.position?.y || 10,
      data.position?.z || 34
    );
    this.targetRotation = data.rotation?.y || 0;
    this.model = this.createModel();
    this.model.position.copy(this.targetPosition);
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
    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-0.12, 0.3, 0);
    group.add(this.leftLeg);
    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(0.12, 0.3, 0);
    group.add(this.rightLeg);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.15, 0.5, 0.2);
    const armMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-0.35, 0.85, 0);
    group.add(this.leftArm);
    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(0.35, 0.85, 0);
    group.add(this.rightArm);

    // Role indicator
    const indicatorGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    const indicatorColor = isMathe ? 0x3498db : 0xe74c3c;
    const indicatorMat = new THREE.MeshLambertMaterial({
      color: indicatorColor,
      emissive: indicatorColor,
      emissiveIntensity: 0.3,
    });
    this.indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    this.indicator.position.y = 1.9;
    group.add(this.indicator);

    // Name tag
    const nameTag = this.createNameTag(this.name);
    nameTag.position.y = 2.2;
    group.add(nameTag);

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

  updateFromNetwork(data) {
    if (data.position) {
      this.targetPosition.set(data.position.x, data.position.y, data.position.z);
    }
    if (data.rotation) {
      this.targetRotation = data.rotation.y;
    }
  }

  update(dt) {
    // Smooth interpolation
    this.model.position.lerp(this.targetPosition, 0.15);
    this.model.rotation.y = lerp(this.model.rotation.y, this.targetRotation, 0.15);

    // Walking animation based on movement
    const dx = this.targetPosition.x - this.model.position.x;
    const dz = this.targetPosition.z - this.model.position.z;
    const speed = Math.sqrt(dx * dx + dz * dz);

    if (speed > 0.01) {
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

  dispose(scene) {
    scene.remove(this.model);
    this.model.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
