// UI MANAGEMENT MODULE
// Handles all UI updates and display management

import { moveNotation } from "../rules/moveNotation.js";
import { TextBlock, Rectangle, Control } from "@babylonjs/gui";

export function createUIManager(gameState, guiElements) {
  const { advancedTexture } = guiElements;
  let nextPlayerText = null; // Variable to store the reference to nextPlayerText control

  return {
    // PLAYER TYPE MANAGEMENT
    updatePlayerTypes: function () {
      gameState.playerTypes.brown = document.querySelector(
        'input[name="brown-player"]:checked'
      ).value;
      gameState.playerTypes.yellow = document.querySelector(
        'input[name="yellow-player"]:checked'
      ).value;
      gameState.playerTypes.green = document.querySelector(
        'input[name="green-player"]:checked'
      ).value;

      console.log("Player types updated:", gameState.playerTypes);
    },

    // NEXT PLAYER DISPLAY
    updateNextPlayerDisplay: function () {
      console.log(
        "Updating next player display. Current player:",
        gameState.currentPlayerTurn
      );
      if (nextPlayerText) {
        advancedTexture.removeControl(nextPlayerText);
      }

      const nextPlayerRect = new Rectangle("nextPlayerRect");
      nextPlayerRect.width = "150px";
      nextPlayerRect.height = "60px";
      nextPlayerRect.cornerRadius = 1;
      nextPlayerRect.color = "white";
      nextPlayerRect.thickness = 2;
      nextPlayerRect.background = "rgba(0, 0, 0, 0.7)";
      nextPlayerRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      nextPlayerRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      nextPlayerRect.left = "0px";
      nextPlayerRect.top = "0px";
      nextPlayerRect.paddingLeft = "20px";
      nextPlayerRect.paddingBottom = "20px";
      advancedTexture.addControl(nextPlayerRect);

      nextPlayerText = new TextBlock("nextPlayerText");
      if (gameState.gameOver) {
        nextPlayerText.text = gameState.moveHistory[gameState.moveHistory.length - 1]; // Display winning message
      } else {
        const playerColor = gameState.currentPlayerTurn;
        nextPlayerText.text = gameState.isPlayAgainState
          ? `${playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} to play again`
          : `${playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} to play`;
      }
      nextPlayerText.color = "white";
      nextPlayerText.fontSize = 16;
      nextPlayerText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      nextPlayerText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      nextPlayerText.resizeToFit = true;
      nextPlayerRect.addControl(nextPlayerText);

      console.log("New next player text:", nextPlayerText.text);
      console.log("Next player display updated.");
    },

    // OWL HALLA DISPLAY
    updateOwlHallaDisplay: function() {
      const capturedPiecesEl = document.getElementById('captured-pieces');
      if (!capturedPiecesEl) {
        console.log('❌ Owl Halla display element not found');
        return;
      }

      console.log('=== Updating Owl Halla Display ===');
      console.log('Current piece positions:', gameState.piecePositions);

      const capturedPieces = [];
      for (const [pieceName, position] of Object.entries(gameState.piecePositions)) {
        if (position === "captured") {
          const notation = moveNotation.getNotationFromPieceName(pieceName);
          console.log(`Found captured piece: ${pieceName} -> ${notation}`);
          if (notation) {
            capturedPieces.push(notation);
          } else {
            console.log(`❌ Could not get notation for captured piece: ${pieceName}`);
          }
        }
      }

      console.log('Captured pieces for display:', capturedPieces);

      // Clear existing content
      capturedPiecesEl.innerHTML = '';
      
      if (capturedPieces.length === 0) {
        capturedPiecesEl.innerHTML = '<span class="empty-message">none</span>';
      } else {
        capturedPieces.forEach(piece => {
          const pieceEl = document.createElement('span');
          pieceEl.className = 'captured-piece';
          pieceEl.textContent = piece;
          pieceEl.title = 'Click to restore (not yet implemented)';
          capturedPiecesEl.appendChild(pieceEl);
        });
      }
    },

    // GENERAL UI UPDATES
    showMessage: function(message, duration = 2000) {
      // Use the existing displayInfoMessage system
      if (gameState.displayInfoMessage) {
        gameState.displayInfoMessage(message);
      } else {
        console.log(`📢 UI Message: ${message}`);
      }
    },

    // UI STATE MANAGEMENT
    updateAllDisplays: function() {
      console.log('🖥️ Updating all UI displays');
      this.updateNextPlayerDisplay();
      this.updateOwlHallaDisplay();
      this.updatePlayerTypes();
    },

    // GAME STATE UI HELPERS
    updateGameOverDisplay: function(winnerMessage) {
      console.log('🏆 Game Over - updating UI');
      gameState.gameOver = true;
      
      // Store the winning message in move history for display
      if (gameState.moveHistory && gameState.moveHistory.length > 0) {
        gameState.moveHistory[gameState.moveHistory.length - 1] = winnerMessage;
      }
      
      this.updateNextPlayerDisplay();
      this.showMessage(winnerMessage, 5000);
    },

    // UTILITY FUNCTIONS
    capitalizeFirst: function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    getPlayerDisplayName: function(playerColor) {
      return this.capitalizeFirst(playerColor);
    },

    // INPUT VALIDATION UI
    updateInputValidationState: function(inputElement, isValid, isHybridCapture = false) {
      if (!inputElement) return;
      
      // Remove existing validation classes
      inputElement.classList.remove('valid', 'invalid', 'hybrid-capture');
      
      // Add appropriate class
      if (isHybridCapture) {
        inputElement.classList.add('hybrid-capture');
      } else if (isValid) {
        inputElement.classList.add('valid');
      } else {
        inputElement.classList.add('invalid');
      }
    },

    clearInputValidationState: function(inputElement) {
      if (!inputElement) return;
      inputElement.classList.remove('valid', 'invalid', 'hybrid-capture');
    },

    // RESPONSIVE UI ADJUSTMENTS
    adjustForScreenSize: function() {
      // Future enhancement: adjust UI elements based on screen size
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      console.log(`🖥️ Screen size: ${screenWidth}x${screenHeight}`);
      
      // Could add responsive adjustments here
      if (screenWidth < 1024) {
        console.log('📱 Small screen detected - could adjust UI');
      }
    },

    // THEME MANAGEMENT (if needed)
    setTheme: function(theme) {
      console.log(`🎨 Setting UI theme: ${theme}`);
      document.body.setAttribute('data-theme', theme);
    }
  };
}