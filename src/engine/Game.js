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
 * Game - main game controller
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
  }

  async init() {
    // Setup renderer
    const canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(canvas);

    // Setup world manager
    this.worldManager = new WorldManager();

    // Setup particles
    this.particles = new ParticleSystem(this.renderer.scene);

    // Setup network
    this.network = new Network();
    try {
      await this.network.connect();
    } catch (err) {
      console.error('Failed to connect to server:', err);
    }

    // Setup network callbacks
    this.setupNetworkCallbacks();

    // Setup start screen
    this.setupStartScreen();
  }

  setupStartScreen() {
    let selectedRole = null;
    const cards = document.querySelectorAll('.character-card');
    const roomSetup = document.getElementById('room-setup');
    const waitingMessage = document.getElementById('waiting-message');

    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedRole = card.dataset.role;
        roomSetup.classList.remove('hidden');
      });
    });

    // Create room
    document.getElementById('create-room-btn').addEventListener('click', () => {
      if (!selectedRole) return;
      const name = selectedRole === ROLES.MATHEMATICIAN ? 'Míša' : 'Kristinka';
      this.network.createRoom(selectedRole, name);
    });

    // Join room
    document.getElementById('join-room-btn').addEventListener('click', () => {
      if (!selectedRole) return;
      const code = document.getElementById('room-code-input').value.trim();
      if (!code) return;
      const name = selectedRole === ROLES.MATHEMATICIAN ? 'Míša' : 'Kristinka';
      this.network.joinRoom(code, selectedRole, name);
    });

    // Network: room created
    this.network.on('room:created', ({ roomCode }) => {
      document.getElementById('room-code-display').textContent = roomCode;
      roomSetup.classList.add('hidden');
      waitingMessage.classList.remove('hidden');
    });

    // Network: room error
    this.network.on('room:error', ({ message }) => {
      alert(message);
    });

    // Network: game start
    this.network.on('game:start', ({ players, world }) => {
      const myId = this.network.getSocketId();
      const myData = players.find(p => p.id === myId);
      const otherData = players.find(p => p.id !== myId);

      if (myData) {
        this.startGame(myData.role, myData.name, otherData);
      }
    });
  }

  startGame(role, name, otherPlayerData) {
    // Hide start screen
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('hidden');

    // Create player
    this.player = new Player(role, name);
    this.renderer.scene.add(this.player.model);

    // Create remote player if data available
    if (otherPlayerData) {
      this.remotePlayer = new RemotePlayer(otherPlayerData);
      this.renderer.scene.add(this.remotePlayer.model);
    }

    // Setup controls
    this.controls = new Controls(this.player);
    this.controls.onJump = () => this.player.jump();
    this.controls.onAbility = () => this.handleAbility();

    // Setup puzzle manager
    this.puzzleManager = new PuzzleManager(this);

    // Load hub world
    this.loadWorld('hub');

    // Show HUD
    const hud = document.getElementById('hud');
    hud.classList.remove('hidden');
    hud.classList.add('active');

    // Set player info in HUD
    const roleIcon = document.getElementById('player-role-icon');
    roleIcon.textContent = role === ROLES.MATHEMATICIAN ? '🔢' : '🎨';
    roleIcon.style.background = role === ROLES.MATHEMATICIAN ? '#3498db' : '#e74c3c';
    document.getElementById('player-name').textContent = name;

    // Set ability button icon
    const abilityBtn = document.getElementById('ability-btn');
    abilityBtn.textContent = role === ROLES.MATHEMATICIAN ? '🔢' : '🎨';

    // Activate controls
    this.controls.activate();

    // Welcome dialog
    setTimeout(() => {
      this.puzzleManager.showDialog(
        'Dobrodruzi!',
        `Vítej, ${name}! Prozkoumej základnu a najdi portály do jiných světů. Hádanky řešte společně!`
      );
    }, 1000);

    // Start game loop
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  loadWorld(worldName) {
    const info = this.worldManager.loadWorld(worldName, this.renderer.scene);

    // Set sky colors
    const colors = this.worldManager.getSkyColors();
    this.renderer.setSkyColors(colors.top, colors.bottom, colors.fog);

    // Move player to spawn
    const spawn = this.worldManager.getSpawnPoint();
    this.player.position.set(spawn.x, spawn.y + 1, spawn.z);
    this.player.velocity.set(0, 0, 0);

    // Show world name
    this.puzzleManager?.showQuest(`📍 ${this.worldManager.getWorldName()}`);
  }

  setupNetworkCallbacks() {
    // Remote player movement
    this.network.on('player:move', (data) => {
      if (this.remotePlayer && data.id === this.remotePlayer.id) {
        this.remotePlayer.updateFromNetwork(data);
      }
    });

    // Room state update (when second player joins)
    this.network.on('room:state', ({ players }) => {
      const myId = this.network.getSocketId();
      const otherData = players.find(p => p.id !== myId);

      if (otherData && !this.remotePlayer && this.renderer) {
        this.remotePlayer = new RemotePlayer(otherData);
        this.renderer.scene.add(this.remotePlayer.model);
      }
    });

    // Player leave
    this.network.on('player:leave', ({ id }) => {
      if (this.remotePlayer && this.remotePlayer.id === id) {
        this.remotePlayer.dispose(this.renderer.scene);
        this.remotePlayer = null;
        this.puzzleManager?.showQuest('⚠️ Kamarád se odpojil...');
      }
    });

    // World change
    this.network.on('world:change', ({ world }) => {
      this.loadWorld(world);
    });

    // Puzzle progress
    this.network.on('puzzle:progress', (data) => {
      this.puzzleManager?.onNetworkPuzzleProgress(data);
    });

    // Puzzle complete
    this.network.on('puzzle:complete', (data) => {
      this.puzzleManager?.onNetworkPuzzleComplete(data);
    });

    // Celebration
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
    // Check for nearby interactable
    if (!this.nearInteractable) {
      this.puzzleManager?.showQuest(
        this.player.role === ROLES.MATHEMATICIAN
          ? '🔢 Přejdi k hádance a stiskni tlačítko!'
          : '🎨 Přejdi k hádance a stiskni tlačítko!'
      );
      return;
    }

    const inter = this.nearInteractable;

    if (inter.type === 'portal') {
      // Portal interaction
      this.puzzleManager?.showDialog(inter.name, inter.description);
      setTimeout(() => {
        this.puzzleManager?.closeDialog();
        this.network.sendWorldChange(inter.world);
        this.loadWorld(inter.world);
      }, 1500);
    } else if (inter.type === 'puzzle') {
      this.puzzleManager.startPuzzle(inter);
    } else if (inter.type === 'sign') {
      this.puzzleManager?.showDialog('📜 Tabule', inter.text);
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

    // Cap delta time to prevent physics issues
    dt = Math.min(dt, 0.05);

    // Update player
    this.player.update(dt, this.worldManager.voxelWorld);
    this.player.updateCamera(this.renderer.camera);

    // Update remote player
    if (this.remotePlayer) {
      this.remotePlayer.update(dt);
    }

    // Update particles
    this.particles.update(dt);

    // Send position to network
    this.network.sendPosition(
      this.player.getSerializableState().position,
      this.player.getSerializableState().rotation
    );

    // Check for nearby interactables
    this.checkInteractables();

    // Update partner direction indicator
    this.updatePartnerIndicator();

    // Animate portal blocks
    this.animatePortals(now);

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

      if (inter.type === 'portal') {
        interactBtn.textContent = `🌀 ${inter.name}`;
      } else if (inter.type === 'puzzle') {
        if (this.puzzleManager.isPuzzleCompleted(inter.puzzleId)) {
          interactBtn.textContent = `✅ ${inter.name}`;
        } else {
          interactBtn.textContent = `✋ ${inter.name}`;
        }
      } else if (inter.type === 'sign') {
        interactBtn.textContent = `📜 Přečíst`;
      }

      // Touch the interact button to trigger
      interactBtn.onclick = () => this.handleAbility();
    } else if (!inter) {
      this.nearInteractable = null;
      interactPrompt.classList.add('hidden');
    }
  }

  updatePartnerIndicator() {
    if (!this.remotePlayer) return;

    const indicator = document.getElementById('partner-indicator');
    const nameEl = document.getElementById('partner-name');
    const arrowEl = indicator.querySelector('.partner-arrow');

    indicator.classList.remove('hidden');
    nameEl.textContent = this.remotePlayer.name;

    // Calculate direction to partner
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

  animatePortals(time) {
    // Subtle glow effect on portal blocks - handled by Three.js material updates
    // This is a simplified version; full implementation would modify emissive intensity
  }
}
