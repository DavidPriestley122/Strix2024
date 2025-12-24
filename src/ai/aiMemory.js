/**
 * AI Memory - Handles learning and pattern recognition for AI players
 * Uses storage abstraction to persist learning across sessions
 */
export class AIMemory {
  constructor(playerColor, storage) {
    this.playerColor = playerColor;
    this.storage = storage;
    this.memory = null;
    this.initialized = false;
  }

  /**
   * Initialize AI memory (load from storage)
   */
  async initialize() {
    if (this.initialized) return;

    this.memory = await this.storage.loadMemory(this.playerColor);
    this.initialized = true;

    console.log(`🧠 AI Memory initialized for ${this.playerColor}:`, {
      gamesPlayed: this.memory.statistics.gamesPlayed,
      winRate: this.getWinRate()
    });
  }

  /**
   * Get evaluation weights (can be tuned based on learning)
   */
  getEvaluationWeights() {
    if (!this.memory) return {};
    return this.memory.evaluationWeights;
  }

  /**
   * Calculate win rate
   */
  getWinRate() {
    if (!this.memory || this.memory.statistics.gamesPlayed === 0) {
      return 0;
    }
    return this.memory.statistics.wins / this.memory.statistics.gamesPlayed;
  }

  /**
   * Record game outcome and update learning
   */
  async recordGameResult(gameData) {
    if (!this.memory) await this.initialize();

    const { result, moves, finalPosition } = gameData;

    // Update statistics
    this.memory.statistics.gamesPlayed++;

    if (result === 'win') {
      this.memory.statistics.wins++;
    } else if (result === 'loss') {
      this.memory.statistics.losses++;
    } else {
      this.memory.statistics.draws++;
    }

    // Learn from the game (Phase 2 - implement later)
    // For now, just track statistics

    this.memory.lastUpdated = new Date().toISOString();

    // Save to storage
    await this.storage.saveMemory(this.playerColor, this.memory);

    // Record full game to history
    await this.storage.recordGame({
      playerColor: this.playerColor,
      result,
      moves,
      moveCount: moves.length
    });

    console.log(`🧠 ${this.playerColor} AI updated:`, {
      gamesPlayed: this.memory.statistics.gamesPlayed,
      winRate: this.getWinRate().toFixed(2)
    });
  }

  /**
   * Check if a position pattern should be avoided (future learning feature)
   */
  shouldAvoidPattern(positionHash) {
    if (!this.memory) return false;

    // Phase 2: Check against learned bad patterns
    // For now, return false
    return false;
  }

  /**
   * Get evaluation adjustment based on learned patterns (future)
   */
  getPatternAdjustment(position) {
    if (!this.memory) return 0;

    // Phase 2: Return score adjustment based on similar positions
    // For now, return 0
    return 0;
  }

  /**
   * Reset AI memory (for testing or fresh start)
   */
  async reset() {
    this.memory = await this.storage.createDefaultMemory?.(this.playerColor) ||
                   this.storage.loadMemory(this.playerColor);
    await this.storage.saveMemory(this.playerColor, this.memory);
    console.log(`🧠 ${this.playerColor} AI memory reset`);
  }
}
