import { SpriteGenerator } from './SpriteGenerator.js';
import { Renderer } from './Renderer.js';
import { Controls } from './Controls.js';
import { Player, RemotePlayer } from './Player.js';
import { ParticleSystem } from './Particles.js';
import { DialogSystem } from './DialogSystem.js';
import { WorldManager } from '../worlds/WorldManager.js';
import { PuzzleManager } from '../puzzles/PuzzleManager.js';
import { Network } from '../network/Network.js';
import { TILE_SIZE, ROLES, DIRECTIONS } from '../utils/constants.js';
import { audio, createCanvas } from '../utils/helpers.js';

/**
 * Game - main controller. Start screen, game loop, multiplayer.
 */
export class Game {
  constructor() {
    this.state = 'start'; // start | lobby | playing
    this.canvas = document.getElementById('game-canvas');
    this.sprites = new SpriteGenerator();
    this.renderer = new Renderer(this.canvas, this.sprites);
    this.controls = new Controls();
    this.particles = new ParticleSystem();
    this.dialog = new DialogSystem();
    this.worldManager = new WorldManager();
    this.network = new Network();
    this.puzzleManager = new PuzzleManager(this.network);

    this.player = null;
    this.remotePlayers = new Map();
    this.role = null;
    this.roomCode = null;
    this.stars = 0;
    this.lastTime = 0;
    this.portalSparkleTimer = 0;

    // Start screen animation
    this.startAnimTime = 0;
    this.startStars = [];
    for (let i = 0; i < 30; i++) {
      this.startStars.push({
        x: Math.random() * 256,
        y: Math.random() * 192,
        speed: 5 + Math.random() * 15,
        size: 1 + Math.random(),
        alpha: 0.3 + Math.random() * 0.7,
      });
    }

    this.setupUI();
    this.setupNetwork();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setupUI() {
    // Start screen buttons
    document.getElementById('btn-create')?.addEventListener('click', () => this.createRoom());
    document.getElementById('btn-join')?.addEventListener('click', () => this.joinRoom());

    // Character selection
    document.getElementById('card-misa')?.addEventListener('click', () => this.selectRole(ROLES.MATHEMATICIAN));
    document.getElementById('card-kristinka')?.addEventListener('click', () => this.selectRole(ROLES.ARTIST));

    // Draw portraits on start screen
    this.drawStartPortraits();
  }

  drawStartPortraits() {
    const misaImg = document.getElementById('portrait-misa');
    const kristImg = document.getElementById('portrait-kristinka');
    if (misaImg) {
      const p = this.sprites.getPortrait(ROLES.MATHEMATICIAN);
      misaImg.width = 64; misaImg.height = 64;
      misaImg.getContext('2d').drawImage(p, 0, 0);
    }
    if (kristImg) {
      const p = this.sprites.getPortrait(ROLES.ARTIST);
      kristImg.width = 64; kristImg.height = 64;
      kristImg.getContext('2d').drawImage(p, 0, 0);
    }
  }

  selectRole(role) {
    this.role = role;
    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    const id = role === ROLES.MATHEMATICIAN ? 'card-misa' : 'card-kristinka';
    document.getElementById(id)?.classList.add('selected');
    audio.playEffect('ui_click');
  }

  async createRoom() {
    if (!this.role) {
      this.showMessage('Vyber si postavu!');
      return;
    }
    try {
      await this.network.connect();
      const name = this.role === ROLES.MATHEMATICIAN ? 'Míša' : 'Kristinka';
      this.network.createRoom(this.role, name);
    } catch (e) {
      this.showMessage('Nepodařilo se připojit k serveru');
    }
  }

  async joinRoom() {
    if (!this.role) {
      this.showMessage('Vyber si postavu!');
      return;
    }
    const codeInput = document.getElementById('room-code-input');
    const code = codeInput?.value?.trim()?.toUpperCase();
    if (!code || code.length < 3) {
      this.showMessage('Zadej kód místnosti!');
      return;
    }
    try {
      await this.network.connect();
      const name = this.role === ROLES.MATHEMATICIAN ? 'Míša' : 'Kristinka';
      this.network.joinRoom(code, this.role, name);
    } catch (e) {
      this.showMessage('Nepodařilo se připojit k serveru');
    }
  }

  setupNetwork() {
    this.network.on('room:created', ({ roomCode }) => {
      this.roomCode = roomCode;
      this.showLobby(roomCode);
    });

    this.network.on('room:state', ({ players }) => {
      // Update lobby
      const lobbyPlayers = document.getElementById('lobby-players');
      if (lobbyPlayers) {
        lobbyPlayers.innerHTML = players.map(p =>
          `<div class="lobby-player">${p.role === ROLES.MATHEMATICIAN ? '★ Míša' : '♥ Kristinka'} - ${p.name}</div>`
        ).join('');
      }
    });

    this.network.on('room:error', ({ message }) => {
      this.showMessage(message);
    });

    this.network.on('game:start', ({ players, world }) => {
      this.startGame(players, world);
    });

    this.network.on('player:move', ({ id, position, rotation }) => {
      const rp = this.remotePlayers.get(id);
      if (rp) {
        rp.setTarget(position.x, position.y, rotation.y);
      }
    });

    this.network.on('player:leave', ({ id }) => {
      this.remotePlayers.delete(id);
    });

    this.network.on('world:change', ({ world }) => {
      this.loadWorld(world);
    });

    this.network.on('puzzle:progress', ({ puzzleId, state }) => {
      this.puzzleManager.onPartnerProgress(puzzleId, state);
    });

    this.network.on('puzzle:complete', ({ puzzleId, stars }) => {
      this.stars = stars;
      this.puzzleManager.onPuzzleComplete(puzzleId);
      this.particles.celebrate(this.player.x, this.player.y - 20);
      this.renderer.shake(4);
    });

    this.network.on('celebration', ({ title, text }) => {
      this.showCelebration(title, text);
    });
  }

  showLobby(code) {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'flex';
    document.getElementById('lobby-code').textContent = code;
  }

  showMessage(msg) {
    const el = document.getElementById('message');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }

  showCelebration(title, text) {
    const el = document.getElementById('celebration-overlay');
    if (!el) return;
    el.innerHTML = `<div class="celebration-content"><h1>${title}</h1><p>${text}</p></div>`;
    el.style.display = 'flex';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  startGame(players, world) {
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';

    this.state = 'playing';
    this.player = new Player(this.role, this.sprites);
    this.puzzleManager.setRole(this.role);

    // Setup remote players
    const myId = this.network.getSocketId();
    for (const p of players) {
      if (p.id !== myId) {
        const rp = new RemotePlayer(p.id, p.role, p.name, this.sprites);
        this.remotePlayers.set(p.id, rp);
      }
    }

    this.loadWorld(world || 'hub');

    // Intro dialog
    setTimeout(() => {
      if (this.worldManager.currentWorld === 'hub') {
        const npc = this.worldManager.npcs[0];
        if (npc) {
          this.dialog.startDialog(
            npc.dialogs,
            npc.x * TILE_SIZE + TILE_SIZE / 2,
            npc.y * TILE_SIZE - 8,
          );
        }
      }
    }, 1000);
  }

  loadWorld(worldName) {
    this.worldManager.loadWorld(worldName);
    const wd = this.worldManager.getWorld();
    this.player.setPosition(wd.spawnX, wd.spawnY);
    this.renderer.snapCamera(this.player.x, this.player.y);
    this.particles.clear();

    // Notify network
    if (this.network.connected) {
      this.network.sendWorldChange(worldName);
    }
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (this.state === 'start') {
      this.drawStartScreen(dt);
    } else if (this.state === 'playing') {
      this.updateGame(dt);
      this.drawGame();
    }

    requestAnimationFrame(this.loop);
  }

  // ============ START SCREEN ============
  drawStartScreen(dt) {
    this.startAnimTime += dt;
    const c = this.renderer.bufCtx;
    const r = this.renderer;

    // Background gradient
    const grad = c.createLinearGradient(0, 0, 0, r.logicalH);
    grad.addColorStop(0, '#1a0a3a');
    grad.addColorStop(0.5, '#2a1a5a');
    grad.addColorStop(1, '#0a2a4a');
    c.fillStyle = grad;
    c.fillRect(0, 0, r.logicalW, r.logicalH);

    // Animated stars
    for (const s of this.startStars) {
      s.y -= s.speed * dt;
      if (s.y < -2) { s.y = r.logicalH + 2; s.x = Math.random() * r.logicalW; }
      c.globalAlpha = s.alpha * (0.5 + Math.sin(this.startAnimTime * 2 + s.x) * 0.5);
      c.fillStyle = '#ffd700';
      c.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    }
    c.globalAlpha = 1;

    // Title
    c.fillStyle = '#ffd700';
    c.font = 'bold 12px monospace';
    const title = 'Míša & Kristinka';
    c.fillText(title, r.logicalW / 2 - c.measureText(title).width / 2, 40);

    c.fillStyle = '#e8d0ff';
    c.font = '7px monospace';
    const sub = 'Dobrodruzi';
    c.fillText(sub, r.logicalW / 2 - c.measureText(sub).width / 2, 55);

    // Floating characters
    const misaY = 75 + Math.sin(this.startAnimTime * 1.5) * 3;
    const kristY = 75 + Math.sin(this.startAnimTime * 1.5 + 1) * 3;
    const misaSheet = this.sprites.getCharacter(ROLES.MATHEMATICIAN);
    const kristSheet = this.sprites.getCharacter(ROLES.ARTIST);
    c.drawImage(misaSheet, 0, 0, 16, 24, 90, misaY, 16, 24);
    c.drawImage(kristSheet, 0, 0, 16, 24, 150, kristY, 16, 24);

    // Render to screen
    r.endFrame();
  }

  // ============ GAME LOOP ============
  updateGame(dt) {
    this.controls.update();

    // Dialog handling
    if (this.dialog.isActive()) {
      this.dialog.update(dt);
      if (this.controls.interactJustPressed) {
        this.dialog.handleInput();
      }
      this.renderer.update(dt);
      this.particles.update(dt);
      return;
    }

    // Puzzle active - don't move
    if (this.puzzleManager.isPuzzleActive()) {
      this.renderer.update(dt);
      this.particles.update(dt);
      return;
    }

    // Player movement
    this.player.update(dt, this.controls, this.worldManager);

    // Camera follow
    this.renderer.setCamera(this.player.x, this.player.y);
    this.renderer.update(dt);

    // Remote players
    for (const [, rp] of this.remotePlayers) {
      rp.update(dt);
    }

    // Particles
    this.particles.update(dt);

    // Walking dust
    if (this.player.moving && this.player.footstepTimer < 0.01) {
      this.particles.walkDust(this.player.x, this.player.y + 4);
    }

    // Portal sparkles
    this.portalSparkleTimer += dt;
    if (this.portalSparkleTimer > 0.2) {
      this.portalSparkleTimer = 0;
      for (const p of this.worldManager.portals) {
        this.particles.portalSparkle(p.x * TILE_SIZE + 8, p.y * TILE_SIZE + 8);
      }
    }

    // Network position sync
    if (this.network.connected) {
      const state = this.player.getNetworkState();
      this.network.sendPosition(state.position, state.rotation);
    }

    // Interaction check
    this.checkInteractions();
  }

  checkInteractions() {
    if (!this.controls.interactJustPressed) return;

    const facingTile = this.player.getFacingTile();
    const playerTile = this.player.getTilePos();

    // Check NPCs
    for (const npc of this.worldManager.npcs) {
      const dx = Math.abs(playerTile.x - npc.x);
      const dy = Math.abs(playerTile.y - npc.y);
      if (dx <= 2 && dy <= 2) {
        this.dialog.startDialog(
          npc.dialogs,
          npc.x * TILE_SIZE + TILE_SIZE / 2,
          npc.y * TILE_SIZE - 8,
        );
        audio.playEffect('interact');
        return;
      }
    }

    // Check portals
    for (const portal of this.worldManager.portals) {
      const dx = Math.abs(playerTile.x - portal.x);
      const dy = Math.abs(playerTile.y - portal.y);
      if (dx <= 1 && dy <= 1) {
        audio.playEffect('portal');
        this.loadWorld(portal.targetWorld);
        return;
      }
    }

    // Check puzzles
    const puzzle = this.puzzleManager.getNearbyPuzzle(
      this.player.x, this.player.y, this.worldManager.puzzles
    );
    if (puzzle) {
      this.puzzleManager.startPuzzle(puzzle, (completed) => {
        this.particles.celebrate(this.player.x, this.player.y - 20);
        this.renderer.shake(5);
      });
      return;
    }
  }

  // ============ RENDERING ============
  drawGame() {
    const r = this.renderer;
    const world = this.worldManager;

    r.beginFrame(world.bgColor);
    r.drawTileMap(world);

    // Collect all drawable objects for Y-sorting
    const drawables = [];

    // Decorations
    for (const d of world.decorations) {
      drawables.push({ type: 'decor', y: d.y, data: d });
    }

    // Portals
    for (const p of world.portals) {
      drawables.push({ type: 'portal', y: p.y, data: p });
    }

    // NPCs
    for (const n of world.npcs) {
      drawables.push({ type: 'npc', y: n.y + 1, data: n });
    }

    // Local player
    drawables.push({
      type: 'player',
      y: this.player.y / TILE_SIZE,
      data: this.player,
    });

    // Remote players
    for (const [, rp] of this.remotePlayers) {
      drawables.push({
        type: 'remote',
        y: rp.y / TILE_SIZE,
        data: rp,
      });
    }

    // Sort by Y position (back to front)
    drawables.sort((a, b) => a.y - b.y);

    // Draw sorted
    for (const d of drawables) {
      switch (d.type) {
        case 'decor':
          r.drawDecoration(d.data);
          break;
        case 'portal':
          r.drawPortal(d.data);
          break;
        case 'npc':
          r.drawNPC(d.data);
          break;
        case 'player':
          r.drawCharacter(d.data.sheet, d.data.x, d.data.y, d.data.dir, d.data.animFrame);
          break;
        case 'remote':
          r.drawCharacter(d.data.sheet, d.data.x, d.data.y, d.data.dir, d.data.animFrame, 0.9);
          r.drawNameTag(d.data.x, d.data.y, d.data.name,
            d.data.role === ROLES.MATHEMATICIAN ? '#5898ff' : '#ff5878');
          break;
      }
    }

    // Particles
    r.drawParticles(this.particles.getParticles());

    // Interaction prompts
    this.drawInteractionPrompts();

    // Dialog
    this.dialog.draw(r);

    // End frame (scale buffer to screen)
    r.endFrame();

    // HUD (drawn on main canvas, after buffer scale)
    r.drawHUD(this.stars, this.role, this.roomCode, world.name);
  }

  drawInteractionPrompts() {
    const playerTile = this.player.getTilePos();
    const r = this.renderer;

    // NPC prompts
    for (const npc of this.worldManager.npcs) {
      const dx = Math.abs(playerTile.x - npc.x);
      const dy = Math.abs(playerTile.y - npc.y);
      if (dx <= 2 && dy <= 2) {
        r.drawInteractionPrompt(
          npc.x * TILE_SIZE + TILE_SIZE / 2,
          npc.y * TILE_SIZE,
          '[E] Mluvit'
        );
      }
    }

    // Portal prompts
    for (const portal of this.worldManager.portals) {
      const dx = Math.abs(playerTile.x - portal.x);
      const dy = Math.abs(playerTile.y - portal.y);
      if (dx <= 2 && dy <= 2) {
        r.drawInteractionPrompt(
          portal.x * TILE_SIZE + TILE_SIZE / 2,
          portal.y * TILE_SIZE,
          `[E] ${portal.label}`
        );
      }
    }

    // Puzzle prompts
    const puzzle = this.puzzleManager.getNearbyPuzzle(
      this.player.x, this.player.y, this.worldManager.puzzles
    );
    if (puzzle) {
      r.drawInteractionPrompt(
        puzzle.x * TILE_SIZE + TILE_SIZE / 2,
        puzzle.y * TILE_SIZE,
        `[E] ${puzzle.name}`
      );
    }
  }
}
