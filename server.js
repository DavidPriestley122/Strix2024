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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  await ensureDataDir();
  app.listen(PORT, () => {
    console.log(`🚀 Strix Analysis Backend running on port ${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
  });
}

start();
