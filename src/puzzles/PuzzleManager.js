import { ROLES, TILE_SIZE } from '../utils/constants.js';
import { audio } from '../utils/helpers.js';

/**
 * PuzzleManager - cooperative puzzles.
 * Míša (mathematician) = numbers, Kristinka (artist) = colors.
 */
export class PuzzleManager {
  constructor(network) {
    this.network = network;
    this.activePuzzle = null;
    this.puzzleUI = null;
    this.role = null;
    this.myProgress = false;
    this.partnerProgress = false;
    this.completedPuzzles = new Set();
    this.onComplete = null;
    this.singlePlayer = false;
    this.singlePlayerPhase = 0; // 0=first role, 1=second role
  }

  setRole(role) {
    this.role = role;
  }

  setSinglePlayer(val) {
    this.singlePlayer = !!val;
  }

  isPuzzleActive() {
    return this.activePuzzle !== null;
  }

  startPuzzle(puzzleDef, onComplete) {
    if (this.completedPuzzles.has(puzzleDef.id)) return;
    this.activePuzzle = puzzleDef;
    this.onComplete = onComplete;
    this.myProgress = false;
    this.partnerProgress = false;
    audio.playEffect('puzzle_start');

    if (!this.singlePlayer) {
      this.network.sendPuzzleStart(puzzleDef.id);
    }
    this.showPuzzleUI(puzzleDef);
  }

  showPuzzleUI(puzzle) {
    const overlay = document.getElementById('puzzle-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'puzzle-container';

    const title = document.createElement('h2');
    title.className = 'puzzle-title';
    title.textContent = puzzle.name;
    container.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'puzzle-desc';
    container.appendChild(desc);

    const content = document.createElement('div');
    content.className = 'puzzle-content';
    container.appendChild(content);

    const status = document.createElement('div');
    status.className = 'puzzle-status';
    status.innerHTML = '<span class="status-me">Ty: ...</span> <span class="status-partner">Partner: ...</span>';
    container.appendChild(status);
    this.statusEl = status;

    if (puzzle.type === 'seed') {
      this.buildSeedPuzzle(content, desc);
    } else if (puzzle.type === 'bridge') {
      this.buildBridgePuzzle(content, desc);
    }

    overlay.appendChild(container);
    this.puzzleUI = overlay;
  }

  buildSeedPuzzle(content, desc) {
    if (this.role === ROLES.MATHEMATICIAN) {
      desc.textContent = 'Spočítej hvězdičky a zadej součet!';
      // Generate star groups
      const groups = [3, 2, 1, 4, 2]; // sum = 12
      const answer = groups.reduce((a, b) => a + b, 0);

      const starsDiv = document.createElement('div');
      starsDiv.className = 'star-groups';
      groups.forEach((count, i) => {
        const group = document.createElement('span');
        group.className = 'star-group';
        group.textContent = '★'.repeat(count);
        if (i < groups.length - 1) group.textContent += ' + ';
        starsDiv.appendChild(group);
      });
      content.appendChild(starsDiv);

      const label = document.createElement('div');
      label.className = 'puzzle-label';
      label.textContent = '= ?';
      content.appendChild(label);

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'puzzle-input';
      input.placeholder = 'Výsledek...';
      content.appendChild(input);

      const btn = document.createElement('button');
      btn.className = 'puzzle-btn';
      btn.textContent = 'Potvrdit';
      btn.onclick = () => {
        const val = parseInt(input.value);
        if (val === answer) {
          this.myProgress = true;
          if (!this.singlePlayer) this.network.sendPuzzleProgress(this.activePuzzle.id, true, this.role);
          this.updateStatus();
          btn.textContent = 'Správně! ★';
          btn.disabled = true;
          input.disabled = true;
          audio.playEffect('puzzle_success');
          this.checkBothDone();
        } else {
          input.classList.add('shake');
          setTimeout(() => input.classList.remove('shake'), 500);
          input.value = '';
          input.placeholder = 'Zkus znovu...';
        }
      };
      content.appendChild(btn);
    } else {
      desc.textContent = 'Namíchej zelenou barvu! Přetáhni modrou na žlutou.';

      const mixArea = document.createElement('div');
      mixArea.className = 'color-mix-area';

      const colors = [
        { color: '#3878e8', name: 'Modrá', x: 30 },
        { color: '#f0d030', name: 'Žlutá', x: 170 },
      ];
      const target = '#4ac848'; // green

      const resultCircle = document.createElement('div');
      resultCircle.className = 'color-result';
      resultCircle.style.background = '#888';
      resultCircle.textContent = '?';

      let dragColor = null;
      let mixedColors = new Set();

      for (const c of colors) {
        const circle = document.createElement('div');
        circle.className = 'color-circle';
        circle.style.background = c.color;
        circle.textContent = c.name;
        circle.draggable = true;
        circle.addEventListener('dragstart', () => { dragColor = c.color; });
        circle.addEventListener('touchstart', (e) => { e.preventDefault(); dragColor = c.color; });
        circle.addEventListener('click', () => {
          mixedColors.add(c.color);
          circle.classList.add('used');
          if (mixedColors.size >= 2) {
            resultCircle.style.background = target;
            resultCircle.textContent = '✓';
            this.myProgress = true;
            if (!this.singlePlayer) this.network.sendPuzzleProgress(this.activePuzzle.id, true, this.role);
            this.updateStatus();
            audio.playEffect('puzzle_success');
            this.checkBothDone();
          } else {
            resultCircle.style.background = c.color;
            resultCircle.textContent = '';
          }
        });
        mixArea.appendChild(circle);
      }

      mixArea.appendChild(resultCircle);
      content.appendChild(mixArea);

      const hint = document.createElement('p');
      hint.className = 'puzzle-hint';
      hint.textContent = 'Klikni na obě barvy pro smíchání!';
      content.appendChild(hint);
    }
  }

  buildBridgePuzzle(content, desc) {
    if (this.role === ROLES.MATHEMATICIAN) {
      desc.textContent = 'Řeka je 8 bloků široká. Vyber prkna!';

      const planks = [2, 3, 3, 5];
      const target = 8;
      let selected = [];

      const plankDiv = document.createElement('div');
      plankDiv.className = 'plank-select';

      const sumDisplay = document.createElement('div');
      sumDisplay.className = 'sum-display';
      sumDisplay.textContent = 'Součet: 0 / 8';

      for (const len of planks) {
        const btn = document.createElement('button');
        btn.className = 'plank-btn';
        btn.textContent = `Prkno ${len}m`;
        btn.style.width = `${len * 30}px`;
        let isSelected = false;
        btn.onclick = () => {
          if (isSelected) {
            selected = selected.filter(v => { if (v === len && !isSelected) return false; isSelected = false; return true; });
            // Simpler: toggle
            const idx = selected.indexOf(len);
            if (idx >= 0) selected.splice(idx, 1);
            btn.classList.remove('selected');
          } else {
            selected.push(len);
            btn.classList.add('selected');
          }
          isSelected = !isSelected;
          const sum = selected.reduce((a, b) => a + b, 0);
          sumDisplay.textContent = `Součet: ${sum} / ${target}`;
          if (sum === target) {
            this.myProgress = true;
            if (!this.singlePlayer) this.network.sendPuzzleProgress(this.activePuzzle.id, true, this.role);
            this.updateStatus();
            sumDisplay.textContent = 'Správně! Most se staví...';
            sumDisplay.classList.add('success');
            audio.playEffect('puzzle_success');
            this.checkBothDone();
          }
        };
        plankDiv.appendChild(btn);
      }

      content.appendChild(plankDiv);
      content.appendChild(sumDisplay);
    } else {
      desc.textContent = 'Namaluj vzor na prkna: červená-modrá-červená-modrá';

      const patternDiv = document.createElement('div');
      patternDiv.className = 'pattern-paint';

      const correctPattern = ['#e83838', '#3878e8', '#e83838', '#3878e8'];
      const slots = [];
      const availColors = ['#e83838', '#3878e8'];
      let currentColor = availColors[0];

      // Color picker
      const picker = document.createElement('div');
      picker.className = 'color-picker';
      for (const c of availColors) {
        const btn = document.createElement('div');
        btn.className = 'color-pick-btn';
        btn.style.background = c;
        if (c === currentColor) btn.classList.add('active');
        btn.onclick = () => {
          currentColor = c;
          picker.querySelectorAll('.color-pick-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        };
        picker.appendChild(btn);
      }
      content.appendChild(picker);

      // Paint slots
      for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        slot.className = 'paint-slot';
        slot.style.background = '#a07040';
        slot.dataset.color = '';
        slot.onclick = () => {
          slot.style.background = currentColor;
          slot.dataset.color = currentColor;
          // Check pattern
          const filled = Array.from(patternDiv.children).map(s => s.dataset.color);
          const correct = filled.every((c, idx) => c === correctPattern[idx]);
          if (correct && filled.every(c => c !== '')) {
            this.myProgress = true;
            if (!this.singlePlayer) this.network.sendPuzzleProgress(this.activePuzzle.id, true, this.role);
            this.updateStatus();
            audio.playEffect('puzzle_success');
            this.checkBothDone();
          }
        };
        patternDiv.appendChild(slot);
        slots.push(slot);
      }
      content.appendChild(patternDiv);
    }
  }

  updateStatus() {
    if (!this.statusEl) return;
    const me = this.statusEl.querySelector('.status-me');
    const partner = this.statusEl.querySelector('.status-partner');
    if (me) me.textContent = `Ty: ${this.myProgress ? '✓ Hotovo!' : '...'}`;
    if (partner) partner.textContent = `Partner: ${this.partnerProgress ? '✓ Hotovo!' : '...'}`;
  }

  onPartnerProgress(puzzleId, state) {
    const otherRole = this.role === ROLES.MATHEMATICIAN ? ROLES.ARTIST : ROLES.MATHEMATICIAN;
    if (state[otherRole]) {
      this.partnerProgress = true;
      this.updateStatus();
      this.checkBothDone();
    }
  }

  checkBothDone() {
    if (this.singlePlayer) {
      // In single player, completing one part is enough
      if (this.myProgress) {
        this.partnerProgress = true;
        this.updateStatus();
        this.completePuzzle();
      }
    } else {
      if (this.myProgress && this.partnerProgress) {
        this.completePuzzle();
      }
    }
  }

  completePuzzle() {
    if (!this.activePuzzle) return;
    this.completedPuzzles.add(this.activePuzzle.id);
    if (!this.singlePlayer) this.network.sendPuzzleComplete(this.activePuzzle.id);
    audio.playEffect('celebration');

    // Show success
    setTimeout(() => {
      this.hidePuzzleUI();
      if (this.onComplete) this.onComplete(this.activePuzzle);
      this.activePuzzle = null;
    }, 1500);
  }

  // Called when partner completes (from network)
  onPuzzleComplete(puzzleId) {
    this.completedPuzzles.add(puzzleId);
    this.hidePuzzleUI();
    this.activePuzzle = null;
  }

  hidePuzzleUI() {
    const overlay = document.getElementById('puzzle-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    }
    this.puzzleUI = null;
  }

  // Check if player is near a puzzle
  getNearbyPuzzle(playerX, playerY, puzzles) {
    const px = Math.floor(playerX / TILE_SIZE);
    const py = Math.floor(playerY / TILE_SIZE);
    for (const p of puzzles) {
      if (this.completedPuzzles.has(p.id)) continue;
      const dx = Math.abs(px - p.x);
      const dy = Math.abs(py - p.y);
      if (dx <= 2 && dy <= 2) return p;
    }
    return null;
  }
}
