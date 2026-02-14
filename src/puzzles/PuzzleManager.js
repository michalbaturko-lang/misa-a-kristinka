import { ROLES } from '../utils/constants.js';

/**
 * PuzzleManager - manages cooperative puzzles
 * Each puzzle requires both players to contribute
 */
export class PuzzleManager {
  constructor(game) {
    this.game = game;
    this.activePuzzle = null;
    this.completedPuzzles = new Set();
    this.puzzleStates = new Map(); // puzzleId -> { math: bool, creative: bool }

    this.setupUI();
  }

  setupUI() {
    // Math puzzle numpad
    document.querySelectorAll('.numpad-btn').forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleNumpadInput(btn.dataset.num);
      }, { passive: false });
      btn.addEventListener('click', () => {
        this.handleNumpadInput(btn.dataset.num);
      });
    });

    // Math puzzle close
    document.getElementById('math-puzzle-close').addEventListener('click', () => {
      this.closeMathPuzzle();
    });

    // Creative puzzle color palette
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        this.selectedColor = swatch.dataset.color;
      });
      swatch.addEventListener('touchstart', (e) => {
        e.preventDefault();
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        this.selectedColor = swatch.dataset.color;
      }, { passive: false });
    });

    // Creative puzzle submit
    document.getElementById('creative-submit').addEventListener('click', () => {
      this.submitCreativePuzzle();
    });

    // Creative puzzle close
    document.getElementById('creative-puzzle-close').addEventListener('click', () => {
      this.closeCreativePuzzle();
    });

    // Dialog next button
    document.getElementById('dialog-next').addEventListener('click', () => {
      this.closeDialog();
    });

    this.mathAnswer = '';
    this.selectedColor = '#e74c3c';
    this.patternColors = [];
  }

  // Check if a puzzle is completed
  isPuzzleCompleted(puzzleId) {
    return this.completedPuzzles.has(puzzleId);
  }

  // Start a puzzle interaction
  startPuzzle(puzzleData) {
    if (this.completedPuzzles.has(puzzleData.puzzleId)) {
      this.showDialog('Hotovo!', 'Tato hádanka je už vyřešená! ★');
      return;
    }

    this.activePuzzle = puzzleData;

    // Initialize puzzle state if not exists
    if (!this.puzzleStates.has(puzzleData.puzzleId)) {
      this.puzzleStates.set(puzzleData.puzzleId, { math: false, creative: false });
    }

    const state = this.puzzleStates.get(puzzleData.puzzleId);
    const role = this.game.player.role;

    // Show appropriate puzzle UI based on role
    if (role === ROLES.MATHEMATICIAN) {
      if (state.math) {
        this.showDialog(puzzleData.name, 'Tvoje část je hotová! Počkej na kamaráda.');
      } else {
        this.showMathPuzzle(puzzleData);
      }
    } else if (role === ROLES.ARTIST) {
      if (state.creative) {
        this.showDialog(puzzleData.name, 'Tvoje část je hotová! Počkej na kamaráda.');
      } else {
        this.showCreativePuzzle(puzzleData);
      }
    }

    // Notify other player
    this.game.network.sendPuzzleStart(puzzleData.puzzleId);
  }

  // Show math puzzle
  showMathPuzzle(data) {
    this.mathAnswer = '';
    const screen = document.getElementById('math-puzzle-screen');
    document.getElementById('math-puzzle-title').textContent = data.name;
    document.getElementById('math-puzzle-question').textContent = data.mathTask;
    document.getElementById('math-answer-display').textContent = '?';

    const feedback = document.getElementById('math-puzzle-feedback');
    feedback.classList.add('hidden');
    feedback.classList.remove('correct', 'incorrect');

    screen.classList.remove('hidden');
    screen.classList.add('active');

    this.game.controls.deactivate();
  }

  // Handle numpad input
  handleNumpadInput(value) {
    if (!this.activePuzzle) return;

    const display = document.getElementById('math-answer-display');
    const feedback = document.getElementById('math-puzzle-feedback');

    if (value === 'clear') {
      this.mathAnswer = '';
      display.textContent = '?';
      feedback.classList.add('hidden');
    } else if (value === 'submit') {
      const answer = parseInt(this.mathAnswer);
      if (isNaN(answer)) return;

      if (answer === this.activePuzzle.mathAnswer) {
        // Correct!
        feedback.textContent = '✓ Správně! Výborně!';
        feedback.classList.remove('hidden', 'incorrect');
        feedback.classList.add('correct');

        const state = this.puzzleStates.get(this.activePuzzle.puzzleId);
        state.math = true;

        // Notify network
        this.game.network.sendPuzzleProgress(
          this.activePuzzle.puzzleId,
          { math: true },
          ROLES.MATHEMATICIAN
        );

        // Celebrate locally
        this.game.particles.sparkle(
          this.game.player.position.x,
          this.game.player.position.y + 2,
          this.game.player.position.z,
          0x3498db
        );

        // Check if puzzle fully complete
        setTimeout(() => {
          this.checkPuzzleCompletion(this.activePuzzle.puzzleId);
          this.closeMathPuzzle();
        }, 1200);
      } else {
        feedback.textContent = '✕ Zkus to znovu!';
        feedback.classList.remove('hidden', 'correct');
        feedback.classList.add('incorrect');
        this.mathAnswer = '';
        setTimeout(() => {
          display.textContent = '?';
        }, 500);
      }
    } else {
      if (this.mathAnswer.length < 6) {
        this.mathAnswer += value;
        display.textContent = this.mathAnswer;
      }
    }
  }

  closeMathPuzzle() {
    document.getElementById('math-puzzle-screen').classList.add('hidden');
    document.getElementById('math-puzzle-screen').classList.remove('active');
    this.game.controls.activate();
  }

  // Show creative puzzle
  showCreativePuzzle(data) {
    const screen = document.getElementById('creative-puzzle-screen');
    document.getElementById('creative-puzzle-title').textContent = data.name;
    document.getElementById('creative-puzzle-instruction').textContent = data.creativeTask;

    const feedback = document.getElementById('creative-puzzle-feedback');
    feedback.classList.add('hidden');
    feedback.classList.remove('correct', 'incorrect');

    // Setup pattern grid or drawing canvas based on puzzle type
    this.patternColors = [];
    this.setupCreativePuzzleUI(data);

    screen.classList.remove('hidden');
    screen.classList.add('active');

    this.game.controls.deactivate();
  }

  setupCreativePuzzleUI(data) {
    const canvas = document.getElementById('creative-canvas');
    const patternGrid = document.getElementById('pattern-grid');

    if (data.requiredColors && data.requiredColors.length > 0) {
      // Pattern matching puzzle - show grid
      canvas.classList.add('hidden');
      patternGrid.classList.remove('hidden');
      patternGrid.innerHTML = '';

      const cols = data.requiredColors.length;
      patternGrid.style.gridTemplateColumns = `repeat(${Math.min(cols, 4)}, 48px)`;

      this.patternColors = new Array(cols).fill(null);

      for (let i = 0; i < cols; i++) {
        const cell = document.createElement('div');
        cell.className = 'pattern-cell target';
        cell.style.background = 'rgba(255,255,255,0.1)';
        cell.dataset.index = i;

        const clickHandler = () => {
          if (this.selectedColor) {
            cell.style.background = this.selectedColor;
            cell.classList.remove('target');
            this.patternColors[i] = this.selectedColor;
          }
        };

        cell.addEventListener('click', clickHandler);
        cell.addEventListener('touchstart', (e) => {
          e.preventDefault();
          clickHandler();
        }, { passive: false });

        patternGrid.appendChild(cell);
      }
    } else {
      // Drawing puzzle - use canvas
      patternGrid.classList.add('hidden');
      canvas.classList.remove('hidden');

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let drawing = false;
      const draw = (x, y) => {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = this.selectedColor;
        ctx.fill();
      };

      canvas.ontouchstart = (e) => {
        e.preventDefault();
        drawing = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
        draw(x, y);
      };
      canvas.ontouchmove = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
        draw(x, y);
      };
      canvas.ontouchend = () => { drawing = false; };

      // Mouse fallback
      canvas.onmousedown = (e) => {
        drawing = true;
        const rect = canvas.getBoundingClientRect();
        draw(e.clientX - rect.left, e.clientY - rect.top);
      };
      canvas.onmousemove = (e) => {
        if (!drawing) return;
        const rect = canvas.getBoundingClientRect();
        draw(e.clientX - rect.left, e.clientY - rect.top);
      };
      canvas.onmouseup = () => { drawing = false; };
    }
  }

  submitCreativePuzzle() {
    if (!this.activePuzzle) return;

    const feedback = document.getElementById('creative-puzzle-feedback');
    let isCorrect = false;

    if (this.activePuzzle.requiredColors && this.activePuzzle.requiredColors.length > 0) {
      // Check pattern matching
      isCorrect = true;
      for (let i = 0; i < this.activePuzzle.requiredColors.length; i++) {
        if (!this.patternColors[i] || this.patternColors[i].toLowerCase() !== this.activePuzzle.requiredColors[i].toLowerCase()) {
          isCorrect = false;
          break;
        }
      }
    } else {
      // Drawing puzzles are always "correct" (creative expression)
      isCorrect = true;
    }

    if (isCorrect) {
      feedback.textContent = '✓ Krásná práce!';
      feedback.classList.remove('hidden', 'incorrect');
      feedback.classList.add('correct');

      const state = this.puzzleStates.get(this.activePuzzle.puzzleId);
      state.creative = true;

      this.game.network.sendPuzzleProgress(
        this.activePuzzle.puzzleId,
        { creative: true },
        ROLES.ARTIST
      );

      this.game.particles.sparkle(
        this.game.player.position.x,
        this.game.player.position.y + 2,
        this.game.player.position.z,
        0xe74c3c
      );

      setTimeout(() => {
        this.checkPuzzleCompletion(this.activePuzzle.puzzleId);
        this.closeCreativePuzzle();
      }, 1200);
    } else {
      feedback.textContent = '✕ Zkus to znovu! Podívej se na barvy.';
      feedback.classList.remove('hidden', 'correct');
      feedback.classList.add('incorrect');
    }
  }

  closeCreativePuzzle() {
    document.getElementById('creative-puzzle-screen').classList.add('hidden');
    document.getElementById('creative-puzzle-screen').classList.remove('active');
    this.game.controls.activate();
  }

  // Check if both parts of a puzzle are done
  checkPuzzleCompletion(puzzleId) {
    const state = this.puzzleStates.get(puzzleId);
    if (state && state.math && state.creative) {
      this.completePuzzle(puzzleId);
    } else if (state) {
      // One part done
      if (state.math && !state.creative) {
        this.showDialog('Dobrá práce!', 'Matematická část je hotová! Teď musí Kristinka dokončit svůj úkol.');
      } else if (state.creative && !state.math) {
        this.showDialog('Dobrá práce!', 'Tvůrčí část je hotová! Teď musí Míša vyřešit svůj příklad.');
      }
    }
  }

  // Both parts complete - celebrate!
  completePuzzle(puzzleId) {
    if (this.completedPuzzles.has(puzzleId)) return;

    this.completedPuzzles.add(puzzleId);
    this.game.network.sendPuzzleComplete(puzzleId);

    // Big celebration
    const pos = this.game.player.position;
    this.game.particles.celebrate(pos.x, pos.y + 2, pos.z);

    // Show celebration overlay
    this.showCelebration('Hádanka vyřešena!', 'Skvělá týmová práce! Získáváte hvězdu! ★');

    // Update star count
    this.game.addStar();
  }

  // Handle network puzzle progress from other player
  onNetworkPuzzleProgress(data) {
    const { puzzleId, state } = data;
    if (!this.puzzleStates.has(puzzleId)) {
      this.puzzleStates.set(puzzleId, { math: false, creative: false });
    }
    const currentState = this.puzzleStates.get(puzzleId);
    if (state.math !== undefined) currentState.math = state.math;
    if (state.creative !== undefined) currentState.creative = state.creative;

    this.checkPuzzleCompletion(puzzleId);
  }

  onNetworkPuzzleComplete(data) {
    const { puzzleId, stars } = data;
    if (!this.completedPuzzles.has(puzzleId)) {
      this.completedPuzzles.add(puzzleId);
      const pos = this.game.player.position;
      this.game.particles.celebrate(pos.x, pos.y + 2, pos.z);
      this.showCelebration('Hádanka vyřešena!', 'Skvělá týmová práce!');
    }
    this.game.stars = stars;
    document.getElementById('stars-count').textContent = stars;
  }

  // Dialog system
  showDialog(speaker, text) {
    const dialog = document.getElementById('dialog-box');
    document.getElementById('dialog-speaker').textContent = speaker;
    document.getElementById('dialog-text').textContent = text;
    dialog.classList.remove('hidden');
    dialog.classList.add('active');
  }

  closeDialog() {
    const dialog = document.getElementById('dialog-box');
    dialog.classList.add('hidden');
    dialog.classList.remove('active');
  }

  // Celebration overlay
  showCelebration(title, text) {
    const overlay = document.getElementById('celebration-overlay');
    document.getElementById('celebration-title').textContent = title;
    document.getElementById('celebration-text').textContent = text;
    overlay.classList.remove('hidden');
    overlay.classList.add('active');

    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('active');
    }, 3000);
  }

  // Show quest notification
  showQuest(text) {
    const notif = document.getElementById('quest-notification');
    document.getElementById('quest-text').textContent = text;
    notif.classList.remove('hidden');
    setTimeout(() => {
      notif.classList.add('hidden');
    }, 5000);
  }
}
