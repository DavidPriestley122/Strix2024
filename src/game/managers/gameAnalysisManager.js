// GAME ANALYSIS MANAGER MODULE
// Handles saving interesting games for pattern analysis and AI training

export function createGameAnalysisManager(gameState) {
  const STORAGE_KEY = 'strix-analysis-library';

  return {
    // Initialize the analysis feature
    initialize: function() {
      console.log('📊 Initializing Game Analysis Manager');

      // Set up event listeners
      this.setupEventListeners();

      // Load existing library from localStorage
      this.loadLibraryFromStorage();
    },

    setupEventListeners: function() {
      // Save to Analysis button
      const saveBtn = document.getElementById('save-to-analysis-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.openSaveDialog());
      }

      // Analysis Library button
      const libraryBtn = document.getElementById('analysis-library-btn');
      if (libraryBtn) {
        libraryBtn.addEventListener('click', () => this.openLibraryBrowser());
      }

      // Export Library button
      const exportBtn = document.getElementById('export-analysis-btn');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => this.exportLibrary());
      }

      // Dialog buttons
      const saveDialogBtn = document.getElementById('analysis-save-btn');
      if (saveDialogBtn) {
        saveDialogBtn.addEventListener('click', () => this.saveCurrentGame());
      }

      const cancelBtn = document.getElementById('analysis-cancel-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.closeSaveDialog());
      }

      // Overlay click to close
      const overlay = document.getElementById('analysis-overlay');
      if (overlay) {
        overlay.addEventListener('click', () => this.closeSaveDialog());
      }
    },

    openSaveDialog: function() {
      console.log('📋 Opening Save to Analysis dialog');

      // Check if there are any moves in the game
      if (!gameState.moveHistory || gameState.moveHistory.length === 0) {
        gameState.displayInfoMessage('No moves to save - play some moves first');
        return;
      }

      // Show dialog and overlay
      const dialog = document.getElementById('analysis-dialog');
      const overlay = document.getElementById('analysis-overlay');

      if (dialog && overlay) {
        // Pre-fill current move number
        const criticalMoveInput = document.getElementById('analysis-critical-move');
        if (criticalMoveInput) {
          criticalMoveInput.value = gameState.moveHistory.length;
        }

        dialog.style.display = 'block';
        overlay.style.display = 'block';
      }
    },

    closeSaveDialog: function() {
      const dialog = document.getElementById('analysis-dialog');
      const overlay = document.getElementById('analysis-overlay');

      if (dialog && overlay) {
        dialog.style.display = 'none';
        overlay.style.display = 'none';

        // Clear form
        this.clearDialogForm();
      }
    },

    clearDialogForm: function() {
      document.getElementById('analysis-pattern-name').value = '';
      document.getElementById('analysis-tags').value = '';
      document.getElementById('analysis-critical-move').value = '';
      document.getElementById('analysis-thicket').value = '1';
      document.getElementById('analysis-notes').value = '';
    },

    saveCurrentGame: function() {
      console.log('💾 Saving current game to analysis library');

      // Collect metadata from form
      const patternName = document.getElementById('analysis-pattern-name').value.trim();
      const tagsInput = document.getElementById('analysis-tags').value.trim();
      const criticalMove = parseInt(document.getElementById('analysis-critical-move').value);
      const thicket = parseInt(document.getElementById('analysis-thicket').value);
      const notes = document.getElementById('analysis-notes').value.trim();

      // Validation
      if (!patternName) {
        gameState.displayInfoMessage('Pattern name is required');
        return;
      }

      if (!criticalMove || criticalMove < 1 || criticalMove > gameState.moveHistory.length) {
        gameState.displayInfoMessage(`Critical move must be between 1 and ${gameState.moveHistory.length}`);
        return;
      }

      // Parse tags
      const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

      // Extract notation strings from move history
      // moveHistory contains objects with {notation, piece, from, to, ...}
      // We only need the notation strings for replay
      const moveNotations = gameState.moveHistory
        .map(move => typeof move === 'string' ? move : move.notation)
        .filter(notation => notation && !notation.includes('wins!')); // Filter out winning messages

      // Collect game data
      const gameData = {
        id: this.generateGameId(),
        savedAt: new Date().toISOString(),
        patternName: patternName,
        tags: tags,
        criticalMove: criticalMove,
        thicket: thicket,
        notes: notes,

        // Game state
        moves: moveNotations,
        totalMoves: moveNotations.length,
        currentPlayer: gameState.currentPlayer,
        winner: gameState.winner || null,

        // Metadata
        metadata: {
          date: new Date().toLocaleDateString(),
          moveCount: moveNotations.length,
          capturedPieces: this.getCapturedPiecesSummary()
        }
      };

      // Save to library
      this.addGameToLibrary(gameData);

      // Close dialog
      this.closeSaveDialog();

      gameState.displayInfoMessage(`Saved game "${patternName}" to analysis library`);
    },

    generateGameId: function() {
      return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    getCapturedPiecesSummary: function() {
      const captured = {
        brown: [],
        yellow: [],
        green: []
      };

      // Check piece positions for captured pieces (captured = null position)
      if (gameState.piecePositions) {
        for (const [pieceName, position] of Object.entries(gameState.piecePositions)) {
          if (position === null) {
            const color = pieceName.charAt(0);
            if (color === 'b') captured.brown.push(pieceName);
            else if (color === 'y') captured.yellow.push(pieceName);
            else if (color === 'g') captured.green.push(pieceName);
          }
        }
      }

      return captured;
    },

    loadLibraryFromStorage: function() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.library = JSON.parse(stored);
          console.log(`📚 Loaded ${this.library.games.length} games from analysis library`);
        } else {
          // Initialize empty library with structure
          this.library = {
            version: '1.0',
            description: 'Curated collection of interesting games for pattern analysis and AI training',
            games: [],
            patternDefinitions: {
              'kingmaking-via-ghosting': {
                description: 'Move creates ghosting opportunity for third player when second player near victory',
                severity: 'high',
                preventable: true,
                rule: 'third-bird'
              }
            }
          };
          console.log('📚 Initialized new analysis library');
        }
      } catch (error) {
        console.error('❌ Failed to load library from storage:', error);
        this.library = {
          version: '1.0',
          description: 'Curated collection of interesting games for pattern analysis and AI training',
          games: [],
          patternDefinitions: {}
        };
      }
    },

    saveLibraryToStorage: function() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.library));
        console.log(`💾 Saved library with ${this.library.games.length} games to localStorage`);
      } catch (error) {
        console.error('❌ Failed to save library to storage:', error);
        gameState.displayInfoMessage('Failed to save to local storage');
      }
    },

    addGameToLibrary: function(gameData) {
      this.library.games.push(gameData);
      this.saveLibraryToStorage();
      console.log(`✅ Added game to library: ${gameData.patternName}`);
    },

    exportLibrary: function() {
      console.log('📥 Exporting analysis library');

      if (this.library.games.length === 0) {
        gameState.displayInfoMessage('Analysis library is empty - save some games first');
        return;
      }

      // Create JSON blob
      const jsonStr = JSON.stringify(this.library, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `strix-analysis-library-${new Date().toISOString().split('T')[0]}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      gameState.displayInfoMessage(`Exported ${this.library.games.length} games to file`);
    },

    openLibraryBrowser: function() {
      console.log('📚 Opening analysis library browser');

      if (this.library.games.length === 0) {
        gameState.displayInfoMessage('Analysis library is empty - save some games first');
        return;
      }

      // Create and show library browser dialog
      this.showLibraryBrowser();
    },

    showLibraryBrowser: function() {
      // Create library browser UI
      const browserHTML = `
        <div id="library-browser" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--dark-chocolate); border: 2px solid var(--owl-beak); border-radius: 10px; padding: 20px; z-index: 2000; width: 600px; max-height: 80vh; overflow-y: auto;">
          <h3 style="color: var(--owl-beak); margin-top: 0;">Analysis Library</h3>
          <div style="color: var(--owl-light); margin-bottom: 15px;">
            ${this.library.games.length} saved game${this.library.games.length !== 1 ? 's' : ''}
          </div>
          <div id="library-games-list" style="max-height: 400px; overflow-y: auto;">
            ${this.generateGamesList()}
          </div>
          <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
            <button id="library-close-btn" class="control-button secondary">Close</button>
          </div>
        </div>
        <div id="library-overlay" style="display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1999;"></div>
      `;

      // Add to page
      const container = document.createElement('div');
      container.innerHTML = browserHTML;
      document.body.appendChild(container);

      // Set up event listeners
      document.getElementById('library-close-btn').addEventListener('click', () => {
        document.body.removeChild(container);
      });

      document.getElementById('library-overlay').addEventListener('click', () => {
        document.body.removeChild(container);
      });

      // Load game buttons
      const loadButtons = container.querySelectorAll('.load-game-btn');
      loadButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const gameId = e.target.dataset.gameId;
          this.loadGameById(gameId);
          document.body.removeChild(container);
        });
      });

      // Delete game buttons
      const deleteButtons = container.querySelectorAll('.delete-game-btn');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const gameId = e.target.dataset.gameId;
          if (confirm('Delete this game from the analysis library?')) {
            this.deleteGameById(gameId);
            // Refresh the browser
            document.body.removeChild(container);
            this.showLibraryBrowser();
          }
        });
      });
    },

    generateGamesList: function() {
      return this.library.games.map(game => `
        <div style="background: rgba(0,0,0,0.3); padding: 15px; margin-bottom: 10px; border-radius: 5px; border: 1px solid var(--owl-light);">
          <div style="font-weight: bold; color: var(--owl-beak); margin-bottom: 8px;">
            ${game.patternName}
          </div>
          <div style="color: var(--owl-light); font-size: 0.9em; margin-bottom: 5px;">
            Saved: ${new Date(game.savedAt).toLocaleDateString()} ${new Date(game.savedAt).toLocaleTimeString()}
          </div>
          ${game.tags.length > 0 ? `
            <div style="color: var(--owl-light); font-size: 0.9em; margin-bottom: 5px;">
              Tags: ${game.tags.join(', ')}
            </div>
          ` : ''}
          <div style="color: var(--owl-light); font-size: 0.9em; margin-bottom: 5px;">
            Moves: ${game.totalMoves} | Critical Move: ${game.criticalMove} | Thicket: ${game.thicket}
          </div>
          ${game.notes ? `
            <div style="color: var(--owl-light); font-size: 0.9em; margin-bottom: 10px; font-style: italic;">
              "${game.notes}"
            </div>
          ` : ''}
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button class="load-game-btn control-button primary" data-game-id="${game.id}" style="flex: 1;">
              Load & Replay
            </button>
            <button class="delete-game-btn control-button secondary" data-game-id="${game.id}">
              Delete
            </button>
          </div>
        </div>
      `).join('');
    },

    loadGameById: function(gameId) {
      const game = this.library.games.find(g => g.id === gameId);

      if (!game) {
        gameState.displayInfoMessage('Game not found in library');
        return;
      }

      console.log(`📥 Loading game from library: ${game.patternName}`);

      // Extract notation strings (handle both old and new format)
      const moveNotations = game.moves.map(move =>
        typeof move === 'string' ? move : move.notation
      ).filter(notation => notation && !notation.includes('wins!'));

      if (moveNotations.length === 0) {
        gameState.displayInfoMessage('No moves to replay in this game');
        return;
      }

      // Reset game
      gameState.resetGame();

      // Display info
      gameState.displayInfoMessage(`Loading: ${game.patternName} (${moveNotations.length} moves)`);

      // Replay the game using executeMoveSequence
      if (gameState.executeMoveSequence) {
        // Use step-by-step mode so user can analyze
        gameState.executeMoveSequence(moveNotations, 0);
      } else {
        console.error('executeMoveSequence not available');
        gameState.displayInfoMessage('Error: Cannot replay game');
      }
    },

    deleteGameById: function(gameId) {
      const index = this.library.games.findIndex(g => g.id === gameId);

      if (index !== -1) {
        const game = this.library.games[index];
        this.library.games.splice(index, 1);
        this.saveLibraryToStorage();
        console.log(`🗑️ Deleted game: ${game.patternName}`);
        gameState.displayInfoMessage(`Deleted "${game.patternName}" from library`);
      }
    }
  };
}
