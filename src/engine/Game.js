import { Renderer } from './Renderer.js';
import { Player } from './Player.js';
import { RemotePlayer } from './RemotePlayer.js';
import { Controls } from './Controls.js';
import { ParticleSystem } from './Particles.js';
import { WorldManager } from '../worlds/WorldManager.js';
import { PuzzleManager } from '../puzzles/PuzzleManager.js';
import { Network } from '../network/Network.js';
import { ROLES, PLAYER } from '../utils/constants.js';

/**
 * Game - main controller with enhanced visuals, particles, and portal effects
 */
export class Game {
  constructor() {
    this.renderer = null;
    this.player = null;
    this.remotePlayer = null;
    this.controls = null;
    this.particles = null;
    this.worldManager = null;
    this.puzzleManager = null;
    this.network = null;
    this.stars = 0;
    this.running = false;
    this.lastTime = 0;
    this.nearInteractable = null;
    this.walkDustTimer = 0;
    this.portalSparkleTimer = 0;
  }

  async init() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(canvas);
    this.worldManager = new WorldManager();
    this.particles = new ParticleSystem(this.renderer.scene);

    this.network = new Network();
    try {
      await this.network.connect();
    } catch (err) {
      console.error('Failed to connect to server:', err);
    }

    this.setupNetworkCallbacks();
    this.setupStartScreen();
  }

  setupStartScreen() {
    let selectedRole = null;
    const cards = document.querySelectorAll('.character-card');
    const roomSetup = document.getElementById('room-setup');
    const waitingMessage = document.getElementById('waiting-message');

    // Draw procedural character avatars
    this.drawCharacterAvatars();

    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedRole = card.dataset.role;
        roomSetup.classList.remove('hidden');
      });
    });

    document.getElementById('create-room-btn').addEventListener('click', () => {
      if (!selectedRole) return;
      const name = selectedRole === ROLES.MATHEMATICIAN ? 'Misa' : 'Kristinka';
      this.network.createRoom(selectedRole, name);
    });

    document.getElementById('join-room-btn').addEventListener('click', () => {
      if (!selectedRole) return;
      const code = document.getElementById('room-code-input').value.trim();
      if (!code) return;
      const name = selectedRole === ROLES.MATHEMATICIAN ? 'Misa' : 'Kristinka';
      this.network.joinRoom(code, selectedRole, name);
    });

    this.network.on('room:created', ({ roomCode }) => {
      document.getElementById('room-code-display').textContent = roomCode;
      roomSetup.classList.add('hidden');
      waitingMessage.classList.remove('hidden');
    });

    this.network.on('room:error', ({ message }) => {
      alert(message);
    });

    this.network.on('game:start', ({ players }) => {
      const myId = this.network.getSocketId();
      const myData = players.find(p => p.id === myId);
      const otherData = players.find(p => p.id !== myId);
      if (myData) {
        this.startGame(myData.role, myData.name, otherData);
      }
    });

    // Animated background for start screen
    this.setupStartScreenAnimation();
  }

  drawCharacterAvatars() {
    // Draw Misa (blue) on canvas
    const misaCanvas = document.getElementById('misa-avatar-canvas');
    if (misaCanvas) {
      const ctx = misaCanvas.getContext('2d');
      this.drawCharacter(ctx, 40, 45, '#3498db', '#2c3e50', '#4a3728', false);
    }

    // Draw Kristinka (red) on canvas
    const kristinkaCanvas = document.getElementById('kristinka-avatar-canvas');
    if (kristinkaCanvas) {
      const ctx = kristinkaCanvas.getContext('2d');
      this.drawCharacter(ctx, 40, 45, '#e74c3c', '#8e44ad', '#d4a03c', true);
    }
  }

  drawCharacter(ctx, cx, cy, shirtColor, pantsColor, hairColor, isGirl) {
    const s = 2.2; // scale

    // Legs
    ctx.fillStyle = pantsColor;
    ctx.fillRect(cx - 6 * s, cy + 4 * s, 4 * s, 8 * s);
    ctx.fillRect(cx + 2 * s, cy + 4 * s, 4 * s, 8 * s);

    // Body
    ctx.fillStyle = shirtColor;
    ctx.fillRect(cx - 7 * s, cy - 5 * s, 14 * s, 10 * s);

    // Arms
    ctx.fillRect(cx - 11 * s, cy - 4 * s, 4 * s, 8 * s);
    ctx.fillRect(cx + 7 * s, cy - 4 * s, 4 * s, 8 * s);

    // Head
    ctx.fillStyle = '#fdbcb4';
    ctx.fillRect(cx - 5 * s, cy - 12 * s, 10 * s, 8 * s);

    // Hair
    ctx.fillStyle = hairColor;
    ctx.fillRect(cx - 6 * s, cy - 14 * s, 12 * s, 3 * s);
    if (isGirl) {
      // Long hair sides
      ctx.fillRect(cx - 7 * s, cy - 12 * s, 3 * s, 10 * s);
      ctx.fillRect(cx + 4 * s, cy - 12 * s, 3 * s, 10 * s);
    }

    // Eyes
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(cx - 3 * s, cy - 10 * s, 2 * s, 2 * s);
    ctx.fillRect(cx + 1 * s, cy - 10 * s, 2 * s, 2 * s);

    // Smile
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(cx - 2 * s, cy - 7 * s, 4 * s, 1 * s);

    // Role icon above head
    ctx.fillStyle = shirtColor;
    ctx.beginPath();
    ctx.arc(cx, cy - 18 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // Icon symbol
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${6 * s}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isGirl ? '\u2665' : '\u2605', cx, cy - 18 * s);
  }

  setupStartScreenAnimation() {
    const startScreen = document.getElementById('start-screen');
    const bgCanvas = document.getElementById('start-bg-canvas');
    if (!bgCanvas) return;

    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    const ctx = bgCanvas.getContext('2d');

    // Floating blocks
    const blocks = [];
    const blockColors = ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#a29bfe', '#00cec9'];
    for (let i = 0; i < 25; i++) {
      blocks.push({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        size: 8 + Math.random() * 20,
        color: blockColors[Math.floor(Math.random() * blockColors.length)],
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: -0.2 - Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        opacity: 0.1 + Math.random() * 0.2,
      });
    }

    // Sparkle particles
    const sparkles = [];
    for (let i = 0; i < 30; i++) {
      sparkles.push({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        size: 1 + Math.random() * 3,
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const animateBg = () => {
      if (!startScreen.classList.contains('active')) return;
      requestAnimationFrame(animateBg);

      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

      // Draw floating blocks
      for (const block of blocks) {
        block.x += block.speedX;
        block.y += block.speedY;
        block.rotation += block.rotSpeed;

        if (block.y < -30) {
          block.y = bgCanvas.height + 30;
          block.x = Math.random() * bgCanvas.width;
        }
        if (block.x < -30) block.x = bgCanvas.width + 30;
        if (block.x > bgCanvas.width + 30) block.x = -30;

        ctx.save();
        ctx.translate(block.x, block.y);
        ctx.rotate(block.rotation);
        ctx.globalAlpha = block.opacity;
        ctx.fillStyle = block.color;
        ctx.fillRect(-block.size / 2, -block.size / 2, block.size, block.size);
        // Highlight edge
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(-block.size / 2, -block.size / 2, block.size, block.size * 0.3);
        ctx.restore();
      }

      // Draw sparkles
      const time = performance.now() * 0.001;
      for (const sp of sparkles) {
        sp.y -= sp.speed;
        if (sp.y < -10) {
          sp.y = bgCanvas.height + 10;
          sp.x = Math.random() * bgCanvas.width;
        }
        const twinkle = Math.sin(time * 3 + sp.phase) * 0.5 + 0.5;
        ctx.globalAlpha = twinkle * 0.5;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    animateBg();
  }

  startGame(role, name, otherPlayerData) {
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('hidden');

    this.player = new Player(role, name);
    this.renderer.scene.add(this.player.model);

    if (otherPlayerData) {
      this.remotePlayer = new RemotePlayer(otherPlayerData);
      this.renderer.scene.add(this.remotePlayer.model);
    }

    this.controls = new Controls(this.player);
    this.controls.onJump = () => this.player.jump();
    this.controls.onAbility = () => this.handleAbility();

    this.puzzleManager = new PuzzleManager(this);

    this.loadWorld('hub');

    const hud = document.getElementById('hud');
    hud.classList.remove('hidden');
    hud.classList.add('active');

    const roleIcon = document.getElementById('player-role-icon');
    roleIcon.textContent = role === ROLES.MATHEMATICIAN ? '\u2605' : '\u2665';
    roleIcon.style.background = role === ROLES.MATHEMATICIAN
      ? 'linear-gradient(135deg, #3498db, #2980b9)'
      : 'linear-gradient(135deg, #e74c3c, #c0392b)';
    document.getElementById('player-name').textContent = name;

    const abilityBtn = document.getElementById('ability-btn');
    abilityBtn.textContent = role === ROLES.MATHEMATICIAN ? '\u2605' : '\u2665';

    this.controls.activate();

    setTimeout(() => {
      this.puzzleManager.showDialog(
        'Dobrodruzi!',
        `Vitej, ${name}! Prozkoumej zakladnu a najdi portaly do jinych svetu. Hadanky reste spolecne!`
      );
    }, 1000);

    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  loadWorld(worldName) {
    this.worldManager.loadWorld(worldName, this.renderer.scene);
    const colors = this.worldManager.getSkyColors();
    this.renderer.setSkyColors(colors.top, colors.bottom, colors.fog);

    const spawn = this.worldManager.getSpawnPoint();
    this.player.position.set(spawn.x, spawn.y + 1, spawn.z);
    this.player.velocity.set(0, 0, 0);

    this.puzzleManager?.showQuest(`\uD83D\uDCCD ${this.worldManager.getWorldName()}`);
  }

  setupNetworkCallbacks() {
    this.network.on('player:move', (data) => {
      if (this.remotePlayer && data.id === this.remotePlayer.id) {
        this.remotePlayer.updateFromNetwork(data);
      }
    });

    this.network.on('room:state', ({ players }) => {
      const myId = this.network.getSocketId();
      const otherData = players.find(p => p.id !== myId);
      if (otherData && !this.remotePlayer && this.renderer) {
        this.remotePlayer = new RemotePlayer(otherData);
        this.renderer.scene.add(this.remotePlayer.model);
      }
    });

    this.network.on('player:leave', ({ id }) => {
      if (this.remotePlayer && this.remotePlayer.id === id) {
        this.remotePlayer.dispose(this.renderer.scene);
        this.remotePlayer = null;
        this.puzzleManager?.showQuest('\u26A0\uFE0F Kamarad se odpojil...');
      }
    });

    this.network.on('world:change', ({ world }) => {
      this.loadWorld(world);
    });

    this.network.on('puzzle:progress', (data) => {
      this.puzzleManager?.onNetworkPuzzleProgress(data);
    });

    this.network.on('puzzle:complete', (data) => {
      this.puzzleManager?.onNetworkPuzzleComplete(data);
    });

    this.network.on('celebration', ({ title, text }) => {
      this.puzzleManager?.showCelebration(title, text);
      if (this.player) {
        this.particles.celebrate(
          this.player.position.x,
          this.player.position.y + 2,
          this.player.position.z
        );
      }
    });
  }

  handleAbility() {
    if (!this.nearInteractable) {
      this.puzzleManager?.showQuest(
        this.player.role === ROLES.MATHEMATICIAN
          ? '\u2605 Prejdi k hadance a stiskni tlacitko!'
          : '\u2665 Prejdi k hadance a stiskni tlacitko!'
      );
      return;
    }

    const inter = this.nearInteractable;

    if (inter.type === 'portal') {
      this.puzzleManager?.showDialog(inter.name, inter.description);
      setTimeout(() => {
        this.puzzleManager?.closeDialog();
        this.network.sendWorldChange(inter.world);
        this.loadWorld(inter.world);
      }, 1500);
    } else if (inter.type === 'puzzle') {
      this.puzzleManager.startPuzzle(inter);
    } else if (inter.type === 'sign') {
      this.puzzleManager?.showDialog('\uD83D\uDCDC Tabule', inter.text);
    }
  }

  addStar() {
    this.stars++;
    document.getElementById('stars-count').textContent = this.stars;
  }

  gameLoop() {
    if (!this.running) return;
    requestAnimationFrame(() => this.gameLoop());

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    dt = Math.min(dt, 0.05);

    // Update controls smoothing
    if (this.controls) {
      this.controls.updateSmoothing(dt);
    }

    // Update player
    this.player.update(dt, this.worldManager.voxelWorld);
    this.player.updateCamera(this.renderer.camera);

    // Walking dust particles
    if (this.player.isWalking) {
      this.walkDustTimer += dt;
      if (this.walkDustTimer > 0.15) {
        this.walkDustTimer = 0;
        this.particles.walkDust(
          this.player.position.x,
          this.player.position.y,
          this.player.position.z
        );
      }
    } else {
      this.walkDustTimer = 0;
    }

    // Landing impact particles
    if (this.player.justLanded) {
      this.particles.landImpact(
        this.player.position.x,
        this.player.position.y,
        this.player.position.z
      );
    }

    // Update remote player
    if (this.remotePlayer) {
      this.remotePlayer.update(dt);
    }

    // Update particles
    this.particles.update(dt);

    // Portal sparkle particles (periodic)
    this.portalSparkleTimer += dt;
    if (this.portalSparkleTimer > 0.2) {
      this.portalSparkleTimer = 0;
      for (const [, inter] of this.worldManager.voxelWorld.interactables) {
        if (inter.type === 'portal') {
          this.particles.portalSparkle(inter.x + 2, inter.y, inter.z);
        }
      }
    }

    // Send position
    this.network.sendPosition(
      this.player.getSerializableState().position,
      this.player.getSerializableState().rotation
    );

    // Check interactables
    this.checkInteractables();

    // Update partner indicator
    this.updatePartnerIndicator();

    // Animate portals (glow/rotation)
    this.worldManager.voxelWorld.animatePortals(now);

    // Update clouds
    this.renderer.updateClouds(now);

    // Render
    this.renderer.render();
  }

  checkInteractables() {
    const pos = this.player.position;
    const inter = this.worldManager.voxelWorld.getInteractableNear(pos.x, pos.y, pos.z, 3.5);

    const interactPrompt = document.getElementById('interaction-prompt');
    const interactBtn = document.getElementById('interact-btn');

    if (inter && inter !== this.nearInteractable) {
      this.nearInteractable = inter;
      interactPrompt.classList.remove('hidden');
      interactPrompt.classList.add('glow');

      if (inter.type === 'portal') {
        interactBtn.textContent = `\uD83C\uDF00 ${inter.name}`;
      } else if (inter.type === 'puzzle') {
        if (this.puzzleManager.isPuzzleCompleted(inter.puzzleId)) {
          interactBtn.textContent = `\u2705 ${inter.name}`;
        } else {
          interactBtn.textContent = `\u270B ${inter.name}`;
        }
      } else if (inter.type === 'sign') {
        interactBtn.textContent = `\uD83D\uDCDC Precist`;
      }

      interactBtn.onclick = () => this.handleAbility();
    } else if (!inter) {
      this.nearInteractable = null;
      interactPrompt.classList.add('hidden');
      interactPrompt.classList.remove('glow');
    }
  }

  updatePartnerIndicator() {
    if (!this.remotePlayer) return;

    const indicator = document.getElementById('partner-indicator');
    const nameEl = document.getElementById('partner-name');
    const arrowEl = indicator.querySelector('.partner-arrow');

    indicator.classList.remove('hidden');
    nameEl.textContent = this.remotePlayer.name;

    const dx = this.remotePlayer.model.position.x - this.player.position.x;
    const dz = this.remotePlayer.model.position.z - this.player.position.z;
    const angle = Math.atan2(dx, dz) - this.player.cameraAngleX;

    arrowEl.style.transform = `rotate(${angle}rad)`;

    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 15) {
      nameEl.textContent = `${this.remotePlayer.name} (daleko)`;
      indicator.style.borderColor = 'rgba(231, 76, 60, 0.5)';
    } else {
      indicator.style.borderColor = 'rgba(46, 204, 113, 0.5)';
    }
  }
}
