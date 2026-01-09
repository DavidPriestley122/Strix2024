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

    // PHASE 2: Learn from opening moves (first 6 moves)
    this.learnFromOpening(moves, result);

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
   * Learn from opening moves - track which opening sequences lead to wins/losses
   */
  learnFromOpening(moves, result) {
    if (!moves || moves.length < 2) return;

    // Initialize opening book if it doesn't exist
    if (!this.memory.openingBook) {
      this.memory.openingBook = {};
    }

    // Track opening sequences (first 6 moves = 2 full rounds)
    const openingDepth = Math.min(6, moves.length);

    // For each of OUR moves in the opening, track the outcome
    for (let i = 0; i < openingDepth; i++) {
      const move = moves[i];

      // Only track our moves
      if (!move.includes(this.playerColor.charAt(0))) continue;

      // Create position key from previous moves (what led to this position)
      const positionKey = i === 0 ? 'start' : moves.slice(0, i).join('_');

      // Initialize position entry if needed
      if (!this.memory.openingBook[positionKey]) {
        this.memory.openingBook[positionKey] = {};
      }

      // Initialize move entry if needed
      if (!this.memory.openingBook[positionKey][move]) {
        this.memory.openingBook[positionKey][move] = { wins: 0, losses: 0, draws: 0, count: 0 };
      }

      // Record outcome for this move
      const moveStats = this.memory.openingBook[positionKey][move];
      moveStats.count++;

      if (result === 'win') {
        moveStats.wins++;
      } else if (result === 'loss') {
        moveStats.losses++;
      } else {
        moveStats.draws++;
      }
    }
  }

  /**
   * Get best opening move based on learned experience
   * Returns null if no experience for this position, or move with best win rate
   */
  getBestOpeningMove(priorMoves) {
    if (!this.memory || !this.memory.openingBook) return null;

    // Only use opening book for first 6 moves
    if (priorMoves.length >= 6) return null;

    // Create position key from prior moves
    const positionKey = priorMoves.length === 0 ? 'start' : priorMoves.join('_');

    // Check if we have experience with this position
    const movesAtPosition = this.memory.openingBook[positionKey];
    if (!movesAtPosition || Object.keys(movesAtPosition).length === 0) {
      return null; // No experience yet
    }

    // Find move with best win rate (minimum 2 games played to avoid noise)
    let bestMove = null;
    let bestWinRate = -1;
    let bestScore = -Infinity;

    for (const [move, stats] of Object.entries(movesAtPosition)) {
      if (stats.count < 2) continue; // Need at least 2 games for confidence

      const winRate = stats.wins / stats.count;
      // Score = winRate - lossRate (so draws are neutral)
      const score = (stats.wins - stats.losses) / stats.count;

      if (score > bestScore || (score === bestScore && winRate > bestWinRate)) {
        bestMove = move;
        bestWinRate = winRate;
        bestScore = score;
      }
    }

    if (bestMove) {
      const stats = movesAtPosition[bestMove];
      console.log(`📚 LEARNED OPENING: Position "${positionKey}" → ${bestMove} (${stats.wins}W-${stats.losses}L-${stats.draws}D, score: ${bestScore.toFixed(2)})`);
    }

    return bestMove;
  }

  /**
   * Get all candidate moves for a position with their statistics
   */
  getOpeningMoveStats(priorMoves) {
    if (!this.memory || !this.memory.openingBook) return null;

    const positionKey = priorMoves.length === 0 ? 'start' : priorMoves.join('_');
    return this.memory.openingBook[positionKey] || null;
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
