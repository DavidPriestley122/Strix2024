// GAME IMPORT MANAGER MODULE
// Handles importing and replaying games from various formats

import { moveNotation } from "../rules/moveNotation.js";

export function createGameImportManager(gameState) {
  return {
    // MAIN IMPORT FUNCTIONS
    importFromSGN: function(sgnText) {
      console.log('📥 Importing SGN format game');
      
      try {
        // Parse metadata (lines starting with [])
        const metadata = this.parseSGNMetadata(sgnText);
        
        // Parse moves (everything after empty line)
        const moves = this.parseSGNMoves(sgnText);
        
        return {
          success: true,
          metadata: metadata,
          moves: moves,
          format: 'sgn'
        };
      } catch (error) {
        console.error('❌ Failed to parse SGN:', error);
        return {
          success: false,
          error: error.message,
          format: 'sgn'
        };
      }
    },

    importFromText: function(textContent) {
      console.log('📥 Importing text format game');
      
      try {
        const lines = textContent.split('\n').map(line => line.trim());
        
        // Find metadata
        const metadata = {};
        let movesStartIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('Date:')) {
            metadata.Date = line.substring(5).trim();
          } else if (line.startsWith('Players:')) {
            metadata.Players = line.substring(8).trim();
          } else if (line.startsWith('Result:')) {
            metadata.Result = line.substring(7).trim();
          } else if (line === 'MOVES:') {
            movesStartIndex = i + 1;
            break;
          }
        }
        
        // Parse moves
        let moves = [];
        if (movesStartIndex !== -1) {
          const moveLines = lines.slice(movesStartIndex).filter(line => 
            line && !line.startsWith('//') && line.trim() !== ''
          );
          moves = this.parseTextMoves(moveLines.join(' '));
        }
        
        return {
          success: true,
          metadata: metadata,
          moves: moves,
          format: 'text'
        };
      } catch (error) {
        console.error('❌ Failed to parse text:', error);
        return {
          success: false,
          error: error.message,
          format: 'text'
        };
      }
    },

    importFromJSON: function(jsonText) {
      console.log('📥 Importing JSON format game');
      
      try {
        const data = JSON.parse(jsonText);
        
        // Extract moves from JSON structure
        const moves = data.moves ? data.moves
          .filter(move => move.notation && move.type !== 'system')
          .map(move => move.notation) : [];
        
        return {
          success: true,
          metadata: data.metadata || {},
          moves: moves,
          format: 'json',
          fullData: data
        };
      } catch (error) {
        console.error('❌ Failed to parse JSON:', error);
        return {
          success: false,
          error: error.message,
          format: 'json'
        };
      }
    },

    // PARSING HELPERS
    parseSGNMetadata: function(sgnText) {
      const metadata = {};
      const lines = sgnText.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
          // Parse [Key "Value"] format
          const match = trimmedLine.match(/\[(\w+)\s+"(.+)"\]/);
          if (match) {
            metadata[match[1]] = match[2];
          }
        } else if (trimmedLine === '') {
          // Empty line means end of metadata
          break;
        }
      }
      
      return metadata;
    },

    parseSGNMoves: function(sgnText) {
      const lines = sgnText.split('\n');
      let movesStarted = false;
      let moveText = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!movesStarted) {
          if (trimmedLine === '') {
            movesStarted = true; // Empty line after metadata
          }
          continue;
        }
        
        if (trimmedLine && !trimmedLine.startsWith('//')) {
          moveText += ' ' + trimmedLine;
        }
      }
      
      return this.parseTextMoves(moveText);
    },

    parseTextMoves: function(moveText) {
      const moves = [];
      
      // Remove move numbers (1., 2., etc.) and split by spaces
      const tokens = moveText.replace(/\d+\./g, '').split(/\s+/).filter(token => token.trim() !== '');
      
      console.log('🔍 Parsing tokens:', tokens);
      
      let i = 0;
      while (i < tokens.length) {
        const token = tokens[i];
        
        if (token && !token.startsWith('//')) {
          // Check if this is a move (contains '-') 
          if (token.includes('-')) {
            let fullMove = token;
            
            // Look ahead for captures (x followed by piece notation)
            let j = i + 1;
            while (j < tokens.length) {
              if (tokens[j] === 'x' && j + 1 < tokens.length) {
                // Found capture: add "x piece" to the move
                fullMove += ` x ${tokens[j + 1]}`;
                j += 2; // Skip both 'x' and the captured piece
              } else if (tokens[j].startsWith('//') || tokens[j].includes('-')) {
                // Hit a comment or next move, stop looking for captures
                break;
              } else {
                // Skip unknown tokens
                j++;
              }
            }
            
            console.log(`📝 Parsed move: ${fullMove}`);
            moves.push(fullMove.trim());
            i = j; // Continue from where we left off
          } else if (token === 'restore') {
            moves.push(token);
            i++;
          } else {
            // Skip tokens that aren't moves (like standalone 'x' or piece names)
            i++;
          }
        } else {
          i++;
        }
      }
      
      console.log('✅ Final parsed moves:', moves);
      return moves;
    },

    // REPLAY FUNCTIONALITY
    replayGame: function(importResult, options = {}) {
      const defaultOptions = {
        speed: 1000, // 1 second between moves
        autoStart: true,
        resetFirst: true,
        showProgress: true
      };
      
      const replayOptions = { ...defaultOptions, ...options };
      
      if (!importResult.success) {
        gameState.displayInfoMessage(`Import failed: ${importResult.error}`);
        return;
      }
      
      console.log('🎬 Starting game replay');
      console.log('📊 Metadata:', importResult.metadata);
      console.log('🎯 Moves to replay:', importResult.moves);
      
      // Reset game if requested
      if (replayOptions.resetFirst) {
        gameState.resetGame();
      }
      
      // Show import info
      const playerInfo = importResult.metadata.Players || 'Unknown players';
      const gameDate = importResult.metadata.Date || 'Unknown date';
      gameState.displayInfoMessage(`Replaying game: ${playerInfo} (${gameDate})`);
      
      // Execute move sequence using existing functionality
      if (gameState.executeMoveSequence) {
        // Use the integrated function which has built-in timing and error handling
        gameState.executeMoveSequence(importResult.moves);
      } else {
        // Fallback: use our custom replay sequence
        this.executeReplaySequence(importResult.moves, replayOptions);
      }
    },

    executeReplaySequence: function(moves, options) {
      if (!Array.isArray(moves) || moves.length === 0) {
        gameState.displayInfoMessage('No moves to replay');
        return;
      }

      console.log(`🎬 Executing replay sequence: ${moves.length} moves`);
      
      let currentIndex = 0;
      const totalMoves = moves.length;
      
      const executeNext = () => {
        if (currentIndex >= totalMoves) {
          gameState.displayInfoMessage(`Replay complete: ${totalMoves} moves`);
          return;
        }

        const move = moves[currentIndex];
        console.log(`🎬 Replaying move ${currentIndex + 1}/${totalMoves}: ${move}`);
        
        // Show progress if enabled
        if (options.showProgress) {
          gameState.displayInfoMessage(`Replaying move ${currentIndex + 1}/${totalMoves}: ${move}`);
        }
        
        // Parse and execute the move
        const parsedMove = moveNotation.parseMove(move);
        
        if (parsedMove && parsedMove.valid) {
          try {
            gameState.executeParsedMove(parsedMove);
            
            // Ensure captured pieces are visually updated
            if (parsedMove.victims && parsedMove.victims.length > 0) {
              console.log(`🎯 Move has captures:`, parsedMove.victims);
              setTimeout(() => {
                gameState.updateOwlHallaDisplay();
                
                // Force visual update of captured pieces
                for (const victim of parsedMove.victims) {
                  const victimPieceName = moveNotation.getPieceName(victim);
                  if (victimPieceName) {
                    console.log(`🏰 Processing capture for: ${victimPieceName}`);
                    console.log(`📍 Piece position in gameState:`, gameState.piecePositions[victimPieceName]);
                    
                    // Call the capture animation function if available
                    if (typeof window.animateCapturedPieceToOwlHalla === 'function') {
                      console.log(`🎬 Calling animateCapturedPieceToOwlHalla for ${victimPieceName}`);
                      window.animateCapturedPieceToOwlHalla(victimPieceName);
                    } else {
                      console.log(`⚠️ animateCapturedPieceToOwlHalla function not available`);
                      
                      // Try alternative: call the double-click handler
                      if (typeof window.handlePieceDoubleClickForCapture === 'function') {
                        console.log(`🎬 Calling handlePieceDoubleClickForCapture for ${victimPieceName}`);
                        window.handlePieceDoubleClickForCapture(victimPieceName);
                      }
                    }
                  }
                }
              }, 500); // Increased delay to ensure move animation completes
            }
          } catch (error) {
            console.error(`❌ Failed to execute move ${move}:`, error);
            gameState.displayInfoMessage(`Error at move ${currentIndex + 1}: ${move}`);
            return;
          }
        } else {
          console.warn(`⚠️ Skipping invalid move: ${move}`);
        }
        
        currentIndex++;
        
        // Schedule next move
        setTimeout(executeNext, options.speed);
      };

      // Start replay
      if (options.autoStart) {
        executeNext();
      }
    },

    // FILE UPLOAD HANDLING
    handleFileUpload: function(file, options = {}) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const content = event.target.result;
          let importResult;
          
          // Detect format based on file extension or content
          const fileName = file.name.toLowerCase();
          
          if (fileName.endsWith('.sgn') || content.includes('[Event')) {
            importResult = this.importFromSGN(content);
          } else if (fileName.endsWith('.json')) {
            importResult = this.importFromJSON(content);
          } else {
            // Default to text format
            importResult = this.importFromText(content);
          }
          
          if (importResult.success && options.autoReplay !== false) {
            this.replayGame(importResult, options);
          }
          
          resolve(importResult);
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
      });
    },

    // CONVENIENCE METHODS
    loadGameFromClipboard: function(options = {}) {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          console.log('📋 Loading game from clipboard');
          
          let importResult;
          if (text.includes('[Event')) {
            importResult = this.importFromSGN(text);
          } else if (text.trim().startsWith('{')) {
            importResult = this.importFromJSON(text);
          } else {
            importResult = this.importFromText(text);
          }
          
          this.replayGame(importResult, options);
        }).catch(err => {
          console.error('Failed to read clipboard:', err);
          gameState.displayInfoMessage('Failed to read from clipboard');
        });
      } else {
        gameState.displayInfoMessage('Clipboard access not available');
      }
    }
  };
}