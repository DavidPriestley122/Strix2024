// GAME EXPORT MANAGER MODULE
// Handles exporting games to various text formats

export function createGameExportManager(gameState) {
  return {
    // MAIN EXPORT FUNCTIONS
    exportToSGN: function() {
      // SGN = Strix Game Notation (similar to chess PGN)
      const metadata = this.generateMetadata();
      const moves = this.formatMovesForExport();
      
      let sgn = '';
      
      // Add metadata headers
      for (const [key, value] of Object.entries(metadata)) {
        sgn += `[${key} "${value}"]\n`;
      }
      
      sgn += '\n'; // Empty line after headers
      
      // Add moves
      sgn += moves;
      
      return sgn;
    },

    exportToSimpleText: function() {
      const metadata = this.generateMetadata();
      const moves = this.formatMovesForExport();
      
      let text = `STRIX GAME\n`;
      text += `Date: ${metadata.Date}\n`;
      text += `Players: ${metadata.Players}\n`;
      text += `Result: ${metadata.Result}\n\n`;
      text += `MOVES:\n`;
      text += moves;
      
      return text;
    },

    exportToJSON: function() {
      const metadata = this.generateMetadata();
      const formattedMoves = this.getDetailedMoveHistory();
      
      const exportData = {
        metadata: metadata,
        moves: formattedMoves,
        finalPositions: JSON.parse(JSON.stringify(gameState.piecePositions)),
        captureHistory: JSON.parse(JSON.stringify(gameState.captureHistory)),
        gameOver: gameState.gameOver
      };
      
      return JSON.stringify(exportData, null, 2);
    },

    // HELPER FUNCTIONS
    generateMetadata: function() {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '.');
      
      const players = `Brown: ${this.getPlayerTypeDisplay('brown')}, Yellow: ${this.getPlayerTypeDisplay('yellow')}, Green: ${this.getPlayerTypeDisplay('green')}`;
      
      let result = 'In progress';
      if (gameState.gameOver) {
        // Find winning message in move history
        const lastMoves = gameState.moveHistory.slice(-3); // Check last 3 entries
        for (const move of lastMoves) {
          if (typeof move === 'string' && move.includes('wins')) {
            result = move;
            break;
          }
        }
      }
      
      return {
        Event: 'Strix Game',
        Date: dateStr,
        Players: players,
        Result: result,
        Moves: gameState.moveHistory.length
      };
    },

    getPlayerTypeDisplay: function(color) {
      const type = gameState.playerTypes && gameState.playerTypes[color];
      return type === 'computer' ? 'Computer' : 'Human';
    },

    formatMovesForExport: function() {
      let moveText = '';
      let moveNumber = 1;
      let currentRoundMoves = [];
      let lastPlayerInRound = null;
      
      for (let i = 0; i < gameState.moveHistory.length; i++) {
        const move = gameState.moveHistory[i];
        
        // Skip non-move entries (like winning messages)
        if (typeof move === 'string' && (move.includes('wins') || move.includes('retracted'))) {
          moveText += `// ${move}\n`;
          continue;
        }
        
        // Handle move objects
        if (typeof move === 'object' && move.notation) {
          // Get the player who made this move (from the game state before the move)
          const currentPlayer = move.gameState ? move.gameState.currentPlayer : 'unknown';
          
          // If this is the start of a new round (we've seen this player before in current round)
          // OR if we have 3 moves already, finish the current round
          if (currentRoundMoves.length >= 3 || 
              (currentRoundMoves.length > 0 && currentRoundMoves.some(m => 
                m.gameState && m.gameState.currentPlayer === currentPlayer))) {
            
            // Write out the completed round
            if (currentRoundMoves.length > 0) {
              moveText += `${moveNumber}. `;
              moveText += currentRoundMoves.map(m => m.notation).join(' ');
              moveText += '\n';
              moveNumber++;
            }
            
            // Start new round
            currentRoundMoves = [];
          }
          
          // Add current move to the round
          currentRoundMoves.push(move);
          lastPlayerInRound = currentPlayer;
        }
      }
      
      // Write out any remaining moves in the final round
      if (currentRoundMoves.length > 0) {
        moveText += `${moveNumber}. `;
        moveText += currentRoundMoves.map(m => m.notation).join(' ');
        moveText += '\n';
      }
      
      return moveText.trim();
    },

    getDetailedMoveHistory: function() {
      return gameState.moveHistory.map((move, index) => {
        if (typeof move === 'object' && move.notation) {
          return {
            moveNumber: index + 1,
            notation: move.notation,
            piece: move.piece,
            from: move.from,
            to: move.to,
            captured: move.captured
          };
        } else {
          return {
            moveNumber: index + 1,
            type: 'system',
            message: move
          };
        }
      });
    },

    // UTILITY FUNCTIONS
    copyToClipboard: function(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => {
          console.log('Game exported to clipboard');
          return true;
        }).catch(err => {
          console.error('Failed to copy to clipboard:', err);
          return false;
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful;
        } catch (err) {
          console.error('Fallback clipboard copy failed:', err);
          document.body.removeChild(textArea);
          return false;
        }
      }
    },

    downloadAsFile: function(text, filename) {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },

    generateFilename: function(format) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      
      const extension = {
        'sgn': 'sgn',
        'text': 'txt', 
        'json': 'json'
      }[format] || 'txt';
      
      return `strix-game-${dateStr}-${timeStr}.${extension}`;
    },

    // MAIN EXPORT FUNCTIONS WITH UI FEEDBACK
    exportGame: function(format = 'sgn', action = 'copy') {
      let exportText = '';
      
      switch (format) {
        case 'sgn':
          exportText = this.exportToSGN();
          break;
        case 'text':
          exportText = this.exportToSimpleText();
          break;
        case 'json':
          exportText = this.exportToJSON();
          break;
        default:
          exportText = this.exportToSGN();
      }
      
      if (action === 'copy') {
        const success = this.copyToClipboard(exportText);
        if (success) {
          gameState.displayInfoMessage(`Game exported to clipboard (${format.toUpperCase()})`);
        } else {
          gameState.displayInfoMessage('Failed to copy to clipboard');
        }
        return exportText;
      } else if (action === 'download') {
        const filename = this.generateFilename(format);
        this.downloadAsFile(exportText, filename);
        gameState.displayInfoMessage(`Game saved as ${filename}`);
        return exportText;
      }
      
      return exportText;
    }
  };
}