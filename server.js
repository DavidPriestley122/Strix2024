import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || './data';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log(`📁 Data directory ready: ${DATA_DIR}`);
  } catch (error) {
    console.error('❌ Failed to create data directory:', error);
  }
}

// ============================================================================
// ANALYSIS LIBRARY ENDPOINTS (Existing)
// ============================================================================

// GET /analysis-library - Retrieve saved game analysis library
app.get('/analysis-library', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, 'analysis-library.json');

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const library = JSON.parse(data);
      console.log(`📚 Retrieved library with ${library.games?.length || 0} games`);
      res.json(library);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet - return empty library
        const emptyLibrary = {
          version: '1.0',
          description: 'Curated collection of interesting games for pattern analysis and AI training',
          games: [],
          patternDefinitions: {}
        };
        console.log('📚 No existing library - returning empty');
        res.json(emptyLibrary);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error retrieving library:', error);
    res.status(500).json({ error: 'Failed to retrieve library' });
  }
});

// POST /analysis-library - Save game analysis library
app.post('/analysis-library', async (req, res) => {
  try {
    const library = req.body;

    // Validation
    if (!library || typeof library !== 'object') {
      return res.status(400).json({ error: 'Invalid library data' });
    }

    const filePath = path.join(DATA_DIR, 'analysis-library.json');
    await fs.writeFile(filePath, JSON.stringify(library, null, 2), 'utf8');

    console.log(`💾 Saved library with ${library.games?.length || 0} games`);
    res.json({ success: true, gamesCount: library.games?.length || 0 });
  } catch (error) {
    console.error('❌ Error saving library:', error);
    res.status(500).json({ error: 'Failed to save library' });
  }
});

// ============================================================================
// AI MEMORY ENDPOINTS (New)
// ============================================================================

// GET /api/ai/memory/:color - Load AI memory for a specific color
app.get('/api/ai/memory/:color', async (req, res) => {
  try {
    const { color } = req.params;

    // Validate color
    if (!['brown', 'yellow', 'green'].includes(color)) {
      return res.status(400).json({ error: 'Invalid color. Must be brown, yellow, or green.' });
    }

    const filePath = path.join(DATA_DIR, `ai_memory_${color}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const memory = JSON.parse(data);
      console.log(`🧠 Retrieved ${color} AI memory (${memory.statistics?.gamesPlayed || 0} games played)`);
      res.json(memory);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet - return default memory structure
        const defaultMemory = {
          version: '1.0',
          playerColor: color,
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
        console.log(`🧠 No existing memory for ${color} - returning default`);
        res.json(defaultMemory);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(`❌ Error loading ${req.params.color} AI memory:`, error);
    res.status(500).json({ error: 'Failed to load AI memory' });
  }
});

// POST /api/ai/memory/:color - Save AI memory for a specific color
app.post('/api/ai/memory/:color', async (req, res) => {
  try {
    const { color } = req.params;
    const memory = req.body;

    // Validate color
    if (!['brown', 'yellow', 'green'].includes(color)) {
      return res.status(400).json({ error: 'Invalid color. Must be brown, yellow, or green.' });
    }

    // Validation
    if (!memory || typeof memory !== 'object') {
      return res.status(400).json({ error: 'Invalid memory data' });
    }

    const filePath = path.join(DATA_DIR, `ai_memory_${color}.json`);
    await fs.writeFile(filePath, JSON.stringify(memory, null, 2), 'utf8');

    const gamesPlayed = memory.statistics?.gamesPlayed || 0;
    const winRate = gamesPlayed > 0
      ? ((memory.statistics.wins / gamesPlayed) * 100).toFixed(1)
      : '0.0';

    console.log(`💾 Saved ${color} AI memory (${gamesPlayed} games, ${winRate}% win rate)`);
    res.json({
      success: true,
      gamesPlayed,
      winRate: parseFloat(winRate)
    });
  } catch (error) {
    console.error(`❌ Error saving ${req.params.color} AI memory:`, error);
    res.status(500).json({ error: 'Failed to save AI memory' });
  }
});

// ============================================================================
// GAME HISTORY ENDPOINTS (New)
// ============================================================================

// POST /api/games - Record a game result
app.post('/api/games', async (req, res) => {
  try {
    const gameData = req.body;

    // Validation
    if (!gameData || typeof gameData !== 'object') {
      return res.status(400).json({ error: 'Invalid game data' });
    }

    const filePath = path.join(DATA_DIR, 'game_history.json');

    // Load existing history
    let history = [];
    try {
      const data = await fs.readFile(filePath, 'utf8');
      history = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist yet - start with empty array
    }

    // Add new game with timestamp
    history.push({
      ...gameData,
      timestamp: new Date().toISOString()
    });

    // Keep only last 1000 games to prevent file bloat
    const trimmed = history.slice(-1000);
    await fs.writeFile(filePath, JSON.stringify(trimmed, null, 2), 'utf8');

    console.log(`📝 Recorded game (${trimmed.length} total in history)`);
    res.json({
      success: true,
      totalGames: trimmed.length
    });
  } catch (error) {
    console.error('❌ Error recording game:', error);
    res.status(500).json({ error: 'Failed to record game' });
  }
});

// GET /api/games - Retrieve game history
app.get('/api/games', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const filePath = path.join(DATA_DIR, 'game_history.json');

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const history = JSON.parse(data);

      // Return most recent games up to limit
      const recent = history.slice(-limit);

      console.log(`📚 Retrieved ${recent.length} games from history`);
      res.json(recent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // No history yet
        console.log('📚 No game history yet - returning empty array');
        res.json([]);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error loading game history:', error);
    res.status(500).json({ error: 'Failed to load game history' });
  }
});

// ============================================================================
// BACKUP ENDPOINT (New)
// ============================================================================

// GET /api/backup - Download complete backup of all AI data
app.get('/api/backup', async (req, res) => {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    // Load all AI memories
    for (const color of ['brown', 'yellow', 'green']) {
      const filePath = path.join(DATA_DIR, `ai_memory_${color}.json`);
      try {
        const data = await fs.readFile(filePath, 'utf8');
        backup.data[color] = JSON.parse(data);
      } catch (error) {
        if (error.code === 'ENOENT') {
          backup.data[color] = null; // No data for this color yet
        } else {
          throw error;
        }
      }
    }

    // Load game history
    const historyPath = path.join(DATA_DIR, 'game_history.json');
    try {
      const data = await fs.readFile(historyPath, 'utf8');
      backup.data.gameHistory = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        backup.data.gameHistory = [];
      } else {
        throw error;
      }
    }

    // Load analysis library
    const libraryPath = path.join(DATA_DIR, 'analysis-library.json');
    try {
      const data = await fs.readFile(libraryPath, 'utf8');
      backup.data.analysisLibrary = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        backup.data.analysisLibrary = null;
      } else {
        throw error;
      }
    }

    console.log('💾 Generated complete backup');
    res.json(backup);
  } catch (error) {
    console.error('❌ Error generating backup:', error);
    res.status(500).json({ error: 'Failed to generate backup' });
  }
});

// POST /api/restore - Restore from backup
app.post('/api/restore', async (req, res) => {
  try {
    const backup = req.body;

    if (!backup || !backup.data) {
      return res.status(400).json({ error: 'Invalid backup format' });
    }

    let restored = 0;

    // Restore AI memories
    for (const color of ['brown', 'yellow', 'green']) {
      if (backup.data[color]) {
        const filePath = path.join(DATA_DIR, `ai_memory_${color}.json`);
        await fs.writeFile(filePath, JSON.stringify(backup.data[color], null, 2), 'utf8');
        restored++;
      }
    }

    // Restore game history
    if (backup.data.gameHistory) {
      const historyPath = path.join(DATA_DIR, 'game_history.json');
      await fs.writeFile(historyPath, JSON.stringify(backup.data.gameHistory, null, 2), 'utf8');
      restored++;
    }

    // Restore analysis library
    if (backup.data.analysisLibrary) {
      const libraryPath = path.join(DATA_DIR, 'analysis-library.json');
      await fs.writeFile(libraryPath, JSON.stringify(backup.data.analysisLibrary, null, 2), 'utf8');
      restored++;
    }

    console.log(`✅ Restored ${restored} data files from backup`);
    res.json({
      success: true,
      filesRestored: restored,
      timestamp: backup.timestamp
    });
  } catch (error) {
    console.error('❌ Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

// GET /api/status - Get system status and statistics
app.get('/api/status', async (req, res) => {
  try {
    const status = {
      server: 'running',
      timestamp: new Date().toISOString(),
      dataDirectory: DATA_DIR,
      aiMemory: {}
    };

    // Check each AI's status
    for (const color of ['brown', 'yellow', 'green']) {
      const filePath = path.join(DATA_DIR, `ai_memory_${color}.json`);
      try {
        const data = await fs.readFile(filePath, 'utf8');
        const memory = JSON.parse(data);
        status.aiMemory[color] = {
          exists: true,
          gamesPlayed: memory.statistics?.gamesPlayed || 0,
          wins: memory.statistics?.wins || 0,
          losses: memory.statistics?.losses || 0,
          lastUpdated: memory.lastUpdated
        };
      } catch (error) {
        status.aiMemory[color] = { exists: false };
      }
    }

    // Check game history
    const historyPath = path.join(DATA_DIR, 'game_history.json');
    try {
      const data = await fs.readFile(historyPath, 'utf8');
      const history = JSON.parse(data);
      status.gameHistory = {
        exists: true,
        totalGames: history.length
      };
    } catch (error) {
      status.gameHistory = { exists: false };
    }

    res.json(status);
  } catch (error) {
    console.error('❌ Error getting status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function start() {
  await ensureDataDir();
  app.listen(PORT, () => {
    console.log(`🚀 Strix Backend Server running on port ${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`💾 Volume-backed persistent storage enabled`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   Analysis Library:`);
    console.log(`     GET  /analysis-library`);
    console.log(`     POST /analysis-library`);
    console.log(`   AI Memory:`);
    console.log(`     GET  /api/ai/memory/:color`);
    console.log(`     POST /api/ai/memory/:color`);
    console.log(`   Game History:`);
    console.log(`     GET  /api/games?limit=100`);
    console.log(`     POST /api/games`);
    console.log(`   Backup:`);
    console.log(`     GET  /api/backup`);
    console.log(`     POST /api/restore`);
    console.log(`   Status:`);
    console.log(`     GET  /api/status`);
    console.log(`     GET  /health`);
  });
}

start();
