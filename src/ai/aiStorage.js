/**
 * Abstract base class for AI storage
 * Allows swapping between LocalStorage (offline) and Backend (online) without changing AI logic
 */
export class AIStorage {
  async loadMemory(playerColor) {
    throw new Error('loadMemory() must be implemented by subclass');
  }

  async saveMemory(playerColor, data) {
    throw new Error('saveMemory() must be implemented by subclass');
  }

  async recordGame(gameData) {
    throw new Error('recordGame() must be implemented by subclass');
  }

  async getGameHistory(limit = 100) {
    throw new Error('getGameHistory() must be implemented by subclass');
  }
}

/**
 * LocalStorage implementation for offline AI learning
 * Uses browser's localStorage to persist AI memory across sessions
 */
export class LocalAIStorage extends AIStorage {
  constructor() {
    super();
    this.memoryPrefix = 'strix_ai_memory_';
    this.historyKey = 'strix_game_history';
  }

  async loadMemory(playerColor) {
    try {
      const key = this.memoryPrefix + playerColor;
      const data = localStorage.getItem(key);

      if (!data) {
        // Return default memory structure
        return this.createDefaultMemory(playerColor);
      }

      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading AI memory for ${playerColor}:`, error);
      return this.createDefaultMemory(playerColor);
    }
  }

  async saveMemory(playerColor, data) {
    try {
      const key = this.memoryPrefix + playerColor;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving AI memory for ${playerColor}:`, error);
    }
  }

  async recordGame(gameData) {
    try {
      const history = await this.getGameHistory();
      history.push({
        ...gameData,
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 games to avoid storage bloat
      const trimmed = history.slice(-100);
      localStorage.setItem(this.historyKey, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error recording game:', error);
    }
  }

  async getGameHistory(limit = 100) {
    try {
      const data = localStorage.getItem(this.historyKey);
      if (!data) return [];

      const history = JSON.parse(data);
      return history.slice(-limit);
    } catch (error) {
      console.error('Error loading game history:', error);
      return [];
    }
  }

  createDefaultMemory(playerColor) {
    return {
      version: '1.0',
      playerColor: playerColor,
      statistics: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0
      },
      patterns: {
        avoidedMoves: [],
        successfulMoves: []
      },
      evaluationWeights: {
        owlDistanceToNest: 50,
        pieceValue: 100,
        ghostingThreat: -5000,
        captureOpportunity: 200
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Backend implementation for cloud-based AI learning
 * Uses Railway backend API for centralized, persistent learning
 */
export class BackendAIStorage extends AIStorage {
  constructor(apiUrl) {
    super();
    this.apiUrl = apiUrl;
  }

  async loadMemory(playerColor) {
    try {
      const response = await fetch(`${this.apiUrl}/api/ai/memory/${playerColor}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const memory = await response.json();
      console.log(`🌐 Loaded ${playerColor} AI memory from backend (${memory.statistics?.gamesPlayed || 0} games)`);
      return memory;
    } catch (error) {
      console.error(`Error loading AI memory from backend for ${playerColor}:`, error);
      // Return default memory structure as fallback
      return this.createDefaultMemory(playerColor);
    }
  }

  async saveMemory(playerColor, data) {
    try {
      const response = await fetch(`${this.apiUrl}/api/ai/memory/${playerColor}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log(`🌐 Saved ${playerColor} AI memory to backend (${result.gamesPlayed} games, ${result.winRate}% win rate)`);
    } catch (error) {
      console.error(`Error saving AI memory to backend for ${playerColor}:`, error);
      throw error; // Re-throw to let caller know save failed
    }
  }

  async recordGame(gameData) {
    try {
      const response = await fetch(`${this.apiUrl}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log(`🌐 Recorded game to backend (${result.totalGames} total games)`);
    } catch (error) {
      console.error('Error recording game to backend:', error);
    }
  }

  async getGameHistory(limit = 100) {
    try {
      const response = await fetch(`${this.apiUrl}/api/games?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const history = await response.json();
      console.log(`🌐 Loaded ${history.length} games from backend`);
      return history;
    } catch (error) {
      console.error('Error loading game history from backend:', error);
      return [];
    }
  }

  createDefaultMemory(playerColor) {
    return {
      version: '1.0',
      playerColor: playerColor,
      statistics: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0
      },
      patterns: {
        avoidedMoves: [],
        successfulMoves: []
      },
      evaluationWeights: {
        owlDistanceToNest: 50,
        pieceValue: 100,
        ghostingThreat: -5000,
        captureOpportunity: 200
      },
      openingBook: {},
      lastUpdated: new Date().toISOString()
    };
  }
}
