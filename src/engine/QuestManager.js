import { QUEST_STATES, TILE_SIZE } from '../utils/constants.js';
import { audio } from '../utils/helpers.js';

/**
 * QuestManager - stavový automat questů.
 * Děti VŽDY vědí co mají dělat. Každý stav má popis, cíl, NPC dialogy.
 * Ukládání do localStorage. Idle timer pro rady.
 */

const Q = QUEST_STATES;

/**
 * Quest data: popis pro děti (česky), cílová pozice (tile coords),
 * targetWorld, NPC dialogy, idle hint.
 */
const QUEST_DATA = {
  [Q.INTRO]: {
    description: '',
    emoji: '',
    targetWorld: null,
    targetX: 0, targetY: 0,
    hint: '',
  },
  [Q.HUB_FIND_ROZUMELKA]: {
    description: 'Najdi Rozumělku u stromu!',
    emoji: '🎯',
    targetWorld: 'hub',
    targetX: 18, targetY: 17,
    npcTarget: 'rozumelka',
    hint: 'Rozumělka stojí u velkého stromu uprostřed louky!',
    portalBlink: null,
  },
  [Q.HUB_GO_TO_FOREST]: {
    description: 'Vstup do portálu Magického lesa!',
    emoji: '🌳',
    targetWorld: 'hub',
    targetX: 4, targetY: 14,
    portalBlink: 'forest',
    hint: 'Zelený portál je vlevo! Jdi k němu!',
  },
  [Q.FOREST_FIND_KVETUNKA]: {
    description: 'Najdi Květunku v lese!',
    emoji: '🌸',
    targetWorld: 'forest',
    targetX: 15, targetY: 30,
    npcTarget: 'kvetunka',
    hint: 'Květunka je na mýtině na jihu lesa! Jdi dolů!',
  },
  [Q.FOREST_PUZZLE_1]: {
    description: 'Vyřeš hádanku: Léčivé semínko!',
    emoji: '🌱',
    targetWorld: 'forest',
    targetX: 15, targetY: 30,
    hint: 'Pomoz Květunce - vyřeš hádanku!',
  },
  [Q.FOREST_FIND_BRIDGE]: {
    description: 'Najdi rozbitý most přes řeku!',
    emoji: '🌉',
    targetWorld: 'forest',
    targetX: 10, targetY: 29,
    npcTarget: null,
    hint: 'Most přes řeku je na jihu! Jdi doleva a dolů!',
  },
  [Q.FOREST_PUZZLE_2]: {
    description: 'Oprav most přes řeku!',
    emoji: '🔨',
    targetWorld: 'forest',
    targetX: 10, targetY: 29,
    hint: 'Postav most - vyřeš hádanku!',
  },
  [Q.FOREST_COMPLETE]: {
    description: 'Vrať se k Rozumělce!',
    emoji: '↩️',
    targetWorld: 'hub',
    targetX: 18, targetY: 17,
    portalBlink: 'hub',
    hint: 'Výborně! Vrať se portálem zpět do Hubu!',
  },
  [Q.HUB_RETURN]: {
    description: 'Promluv s Rozumělkou!',
    emoji: '💬',
    targetWorld: 'hub',
    targetX: 18, targetY: 17,
    npcTarget: 'rozumelka',
    hint: 'Rozumělka je u stromu! Jdi k ní!',
  },
  [Q.GAME_COMPLETE]: {
    description: 'Gratulace! Les je zachráněn!',
    emoji: '⭐',
    targetWorld: null,
    targetX: 0, targetY: 0,
    hint: '',
  },
};

/**
 * NPC dialogy pro každý quest stav.
 * Klíč: `${questState}_${npcType}`
 */
const NPC_DIALOGS = {
  // Rozumělka v hubu - první setkání
  [`${Q.HUB_FIND_ROZUMELKA}_rozumelka`]: [
    'Ahoj! Já jsem Rozumělka, vaše průvodkyně!',
    'Země Pixelů potřebuje vaši pomoc...',
    'Rozverný Prchavec Zmatek rozbil brány mezi světy!',
    'V Magickém lese žije Květunka - víla květin.',
    'Její kouzelná květina uvadá! Musíte jí pomoct!',
    'Jděte do zeleného portálu vlevo - vede do lesa!',
  ],

  // Květunka v lese - první setkání
  [`${Q.FOREST_FIND_KVETUNKA}_kvetunka`]: [
    'Ach, konečně! Já jsem Květunka, víla květin.',
    'Moje kouzelná květina umírá! Potřebuju Léčivé semínko!',
    'Míšo, spočítej hvězdičky - najdeš správné číslo!',
    'Kristinko, namíchej správnou barvu pro květinu!',
    'Pojďte, pomožte mi!',
  ],

  // Květunka po puzzle 1
  [`${Q.FOREST_FIND_BRIDGE}_kvetunka`]: [
    'Děkuji! Květina ožívá!',
    'Ale... most přes řeku je rozbitý!',
    'Bez mostu se nikdo nedostane na druhou stranu.',
    'Jděte k řece na jih - uvidíte zbytky mostu!',
  ],

  // Rozumělka v lese
  [`${Q.FOREST_FIND_BRIDGE}_rozumelka`]: [
    'Skvělá práce s Květunkou!',
    'Teď opravte most - je na jihu u řeky!',
  ],

  // Květunka po mostu
  [`${Q.FOREST_COMPLETE}_kvetunka`]: [
    'Most je opraven! Jste úžasní!',
    'Vraťte se k Rozumělce - bude mít radost!',
  ],

  // Rozumělka - návrat do hubu
  [`${Q.HUB_RETURN}_rozumelka`]: [
    'Výborně! Květunku jste zachránili!',
    'A most jste taky opravili! Jste praví hrdinové!',
    'Magický les je zase v pořádku díky vám!',
    'Brzy budou potřebovat pomoc i další světy...',
    'Ale to je příběh na jindy. DĚKUJI VÁM!',
  ],

  // Rozumělka - hra hotova
  [`${Q.GAME_COMPLETE}_rozumelka`]: [
    'Jste nejlepší dobrodruzi v celé Zemi Pixelů!',
    'Přijďte zas, až budou další světy potřebovat pomoc!',
  ],
};

export class QuestManager {
  constructor() {
    this.state = Q.INTRO;
    this.idleTimer = 0;
    this.hintShown = false;
    this.hintCallback = null;
    this.load();
  }

  save() {
    try {
      localStorage.setItem('misa_quest_state', this.state);
    } catch (e) { /* ignore */ }
  }

  load() {
    try {
      const saved = localStorage.getItem('misa_quest_state');
      if (saved && Object.values(Q).includes(saved)) {
        this.state = saved;
      }
    } catch (e) { /* ignore */ }
  }

  reset() {
    this.state = Q.INTRO;
    this.idleTimer = 0;
    this.hintShown = false;
    this.save();
  }

  setState(newState) {
    this.state = newState;
    this.idleTimer = 0;
    this.hintShown = false;
    this.save();
  }

  getState() {
    return this.state;
  }

  getCurrentQuest() {
    return QUEST_DATA[this.state] || null;
  }

  getDescription() {
    const q = this.getCurrentQuest();
    if (!q || !q.description) return '';
    return `${q.emoji} ${q.description}`;
  }

  getTargetPosition() {
    const q = this.getCurrentQuest();
    if (!q || !q.targetWorld) return null;
    return {
      x: q.targetX * TILE_SIZE + TILE_SIZE / 2,
      y: q.targetY * TILE_SIZE + TILE_SIZE / 2,
      world: q.targetWorld,
    };
  }

  shouldPortalBlink(portalTargetWorld) {
    const q = this.getCurrentQuest();
    return q && q.portalBlink === portalTargetWorld;
  }

  shouldNPCGlow(npcType) {
    const q = this.getCurrentQuest();
    return q && q.npcTarget === npcType;
  }

  isTargetInCurrentWorld(currentWorld) {
    const q = this.getCurrentQuest();
    return q && q.targetWorld === currentWorld;
  }

  /**
   * Get NPC dialog for current quest state.
   * Returns array of strings or null if no special dialog.
   */
  getNPCDialog(npcType) {
    const key = `${this.state}_${npcType}`;
    return NPC_DIALOGS[key] || null;
  }

  /**
   * Called when dialog with an NPC completes.
   * Advances quest if appropriate.
   */
  onDialogComplete(npcType) {
    switch (this.state) {
      case Q.HUB_FIND_ROZUMELKA:
        if (npcType === 'rozumelka') {
          this.setState(Q.HUB_GO_TO_FOREST);
          return true;
        }
        break;
      case Q.FOREST_FIND_KVETUNKA:
        if (npcType === 'kvetunka') {
          this.setState(Q.FOREST_PUZZLE_1);
          return 'start_puzzle_seed';
        }
        break;
      case Q.FOREST_FIND_BRIDGE:
        if (npcType === 'kvetunka') {
          // Just dialog, no state change
          return false;
        }
        break;
      case Q.HUB_RETURN:
        if (npcType === 'rozumelka') {
          this.setState(Q.GAME_COMPLETE);
          return 'game_complete';
        }
        break;
    }
    return false;
  }

  /**
   * Called when a puzzle is completed.
   */
  onPuzzleComplete(puzzleId) {
    switch (this.state) {
      case Q.FOREST_PUZZLE_1:
        this.setState(Q.FOREST_FIND_BRIDGE);
        return true;
      case Q.FOREST_PUZZLE_2:
        this.setState(Q.FOREST_COMPLETE);
        return true;
    }
    return false;
  }

  /**
   * Called when player enters a new world via portal.
   */
  onWorldChange(worldName) {
    switch (this.state) {
      case Q.HUB_GO_TO_FOREST:
        if (worldName === 'forest') {
          this.setState(Q.FOREST_FIND_KVETUNKA);
          return true;
        }
        break;
      case Q.FOREST_COMPLETE:
        if (worldName === 'hub') {
          this.setState(Q.HUB_RETURN);
          return true;
        }
        break;
    }
    return false;
  }

  /**
   * Update idle timer. Returns hint string if player has been idle 15+ seconds.
   */
  updateIdle(dt, isMoving) {
    if (isMoving) {
      this.idleTimer = 0;
      this.hintShown = false;
    } else {
      this.idleTimer += dt;
    }

    if (this.idleTimer > 15 && !this.hintShown) {
      this.hintShown = true;
      const q = this.getCurrentQuest();
      return q ? q.hint : null;
    }

    return null;
  }

  /**
   * Check if player is near the puzzle that should be started for current quest.
   */
  shouldStartPuzzle(puzzleId) {
    if (this.state === Q.FOREST_PUZZLE_1 && puzzleId === 'forest_seed') return true;
    if (this.state === Q.FOREST_FIND_BRIDGE && puzzleId === 'forest_bridge') {
      this.setState(Q.FOREST_PUZZLE_2);
      return true;
    }
    if (this.state === Q.FOREST_PUZZLE_2 && puzzleId === 'forest_bridge') return true;
    return false;
  }
}
