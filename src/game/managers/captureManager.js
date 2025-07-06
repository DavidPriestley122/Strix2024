// CAPTURE MANAGEMENT MODULE
// Handles all capture-related functionality including timers and hybrid captures

import { moveNotation } from "../rules/moveNotation.js";

export function createCaptureManager(gameState, uiElements) {
  const { captureTimerText } = uiElements;

  return {
    // Timer-related properties (will be managed by this module)
    captureDecisionTimer: null,
    captureCountdownTimer: null,
    isRavenCaptureInProgress: false,
    captureTimeRemaining: 0,
    capturingPlayer: null,

    // Hybrid capture properties
    hybridCaptureMode: false,
    pendingHybridMove: null,
    hybridCaptureVictims: [],
    hybridClickHandlers: new Map(),

    // TIMER MANAGEMENT
    startCaptureTimerDisplay: function() {
      this.captureTimeRemaining = 7;
      captureTimerText.isVisible = true;
      this.updateCaptureTimerDisplay();
      
      // Update countdown every second
      this.captureCountdownTimer = setInterval(() => {
        this.captureTimeRemaining--;
        this.updateCaptureTimerDisplay();
        if (this.captureTimeRemaining <= 0) {
          this.stopCaptureTimerDisplay();
        }
      }, 1000);
    },

    updateCaptureTimerDisplay: function() {
      captureTimerText.text = `Capture decision: ${this.captureTimeRemaining}s`;
    },

    stopCaptureTimerDisplay: function() {
      if (this.captureCountdownTimer) {
        clearInterval(this.captureCountdownTimer);
        this.captureCountdownTimer = null;
      }
      captureTimerText.isVisible = false;
      captureTimerText.text = "";
    },

    cancelCaptureDecisionTimer: function() {
      if (this.captureDecisionTimer) {
        console.log("🚫 Capture decision timer cancelled - proceeding to next turn");
        clearTimeout(this.captureDecisionTimer);
        this.captureDecisionTimer = null;
        this.isRavenCaptureInProgress = false;
        this.capturingPlayer = null; // Clear capturing player
        this.stopCaptureTimerDisplay();
        gameState.proceedToNextTurn();
      } else {
        console.log("🤔 cancelCaptureDecisionTimer called but no timer was active");
      }
    },

    // CORE CAPTURE LOGIC
    recordCapture: function (capturedPiece) {
      console.log("📥 Capturing piece:", capturedPiece);
      console.log("📥 Current player before capture:", gameState.currentPlayerTurn);

      // Track if this is a timer-based capture before we cancel the timer
      // Check both the local timer and the gameState timer for compatibility
      const isTimerCapture = !!(this.captureDecisionTimer || gameState.captureDecisionTimer);

      // For Raven captures, let the timer run to completion (multiple victims possible)
      // For Owl/Kite captures, cancel timer immediately (single victim only)
      if (this.captureDecisionTimer && !this.isRavenCaptureInProgress) {
        console.log("🚫 Single-victim capture complete - cancelling timer");
        this.cancelCaptureDecisionTimer();
      } else if (this.captureDecisionTimer) {
        console.log("🐦 Raven capture - timer continues running for additional victims");
      } else {
        console.log("📥 No active timer to cancel");
      }

      const abbreviatedCaptured = gameState.abbreviatePiece(capturedPiece);
      const captureText = `(${abbreviatedCaptured} captured)`;

      // Add to captureHistory
      gameState.captureHistory.push({
        moveIndex: gameState.moveHistory.length - 1,
        text: captureText,
      });

      // For captures that happen during timer periods, we need to update the current move notation
      // since the move has already been added to history
      if (isTimerCapture || this.hybridCaptureMode) {
        if (gameState.moveHistory.length > 0) {
          const lastMoveIndex = gameState.moveHistory.length - 1;
          const lastMove = gameState.moveHistory[lastMoveIndex];
          
          if (typeof lastMove === 'object' && lastMove.notation) {
            // Add capture notation to the move if not already present
            const captureNotation = gameState.abbreviatePiece(capturedPiece);
            if (!lastMove.notation.includes(` x ${captureNotation}`)) {
              lastMove.notation += ` x ${captureNotation}`;
              console.log(`📝 Updated move notation for timer/hybrid capture: ${lastMove.notation}`);
            }
          }
        }
      } else {
        console.log(`📝 Regular capture - notation will be handled by addMoveToHistory`);
      }

      // Update the piece positions
      gameState.piecePositions[capturedPiece] = "captured";
      
      // Use the existing double-click logic to position piece in Owl Halla
      console.log(`🏰 Positioning ${capturedPiece} in Owl Halla using original double-click logic`);
      
      // Call the original double-click handler directly (it has the proven positioning code)
      if (typeof window.handlePieceDoubleClickForCapture === 'function') {
        window.handlePieceDoubleClickForCapture(capturedPiece);
      } else {
        console.log(`⚠️ handlePieceDoubleClickForCapture function not available - piece will just disappear`);
        if (typeof findPieceInScene === 'function') {
          const piece3D = findPieceInScene(capturedPiece);
          if (piece3D) {
            piece3D.visibility = false;
          }
        }
      }

      // Check if the captured piece is an Owl
      if (capturedPiece.includes("Owl")) {
        const capturedTeam = gameState.getColorFromPieceName(capturedPiece);
        console.log("🦉 OWL CAPTURE DEBUG: Setting knockedOutTeam from", gameState.knockedOutTeam, "to", capturedTeam);
        gameState.knockedOutTeam = capturedTeam;
        console.log("🦉 OWL CAPTURE: Owl captured. Knocked out team:", capturedTeam);
        console.log("🦉 CURRENT STATE: knockedOutTeam =", gameState.knockedOutTeam, "currentPlayerTurn =", gameState.currentPlayerTurn);

        const teams = ["brown", "yellow", "green"];
        const capturingTeam =
          teams[(teams.indexOf(gameState.currentPlayerTurn) - 1 + 3) % 3];

        // Explicitly handle Owl capture scenarios
        if (capturingTeam === "yellow" && capturedTeam === "green") {
          console.log(
            "Yellow captured Green Owl. Setting next player to Brown."
          );
          gameState.currentPlayerTurn = "brown";
        } else if (capturingTeam === "brown" && capturedTeam === "yellow") {
          console.log(
            "Brown captured Yellow Owl. Setting next player to Green."
          );
          gameState.currentPlayerTurn = "green";
        } else if (capturingTeam === "green" && capturedTeam === "brown") {
          console.log(
            "Green captured Brown Owl. Setting next player to Yellow."
          );
          gameState.currentPlayerTurn = "yellow";
        } else {
          console.log("Owl capture did not result in player change.");
        }

        console.log("Current player after Owl capture logic:", gameState.currentPlayerTurn);
      }

      // Check for win condition
      const winningMessage = gameState.checkWinningConditions(capturedPiece, "captured");
      if (winningMessage) {
        gameState.moveHistory.push(winningMessage);
        gameState.gameOver = true;
        console.log("Game over after capture:", winningMessage);
        gameState.updateGameOverDisplay(winningMessage);
        return; // Stop processing when game is over
      }

      // Update displays only if game continues
      if (capturedPiece.includes("Owl")) {
        gameState.updateNextPlayerDisplay();
      }
      gameState.updateOwlHallaDisplay();
      console.log("recordCapture completed. Current player:", gameState.currentPlayerTurn);
    },

    // POTENTIAL CAPTURE DETECTION
    checkPotentialCaptures: function(pieceName, destination) {
      // Check if this is a cross-face move that might enable captures
      if (!pieceName || !destination) return false;
      
      const currentPos = gameState.piecePositions[pieceName];
      if (!currentPos || currentPos === "captured") return false;
      
      const startFace = currentPos[0];
      const endFace = destination[0];
      
      // Only cross-face moves can result in captures (except for Owls)
      if (startFace === endFace && !pieceName.includes('Owl')) {
        return false;
      }
      
      // Different pieces have different capture mechanics
      if (pieceName.includes('Kite')) {
        return this.checkKiteCaptureOpportunity(destination);
      } else if (pieceName.includes('Raven')) {
        return this.checkRavenMobbingOpportunity(pieceName, destination);
      } else if (pieceName.includes('Owl')) {
        return this.checkOwlCaptureOpportunity(destination);
      }
      
      return false;
    },

    checkKiteCaptureOpportunity: function(destination) {
      const adjacentSquares = this.getAdjacentSquares(destination);
      
      for (const adjSquare of adjacentSquares) {
        const occupyingPiece = this.findPieceAtSquare(adjSquare);
        if (occupyingPiece && gameState.piecePositions[occupyingPiece] !== "captured") {
          return true; // Found a potential victim
        }
      }
      return false;
    },

    checkRavenMobbingOpportunity: function(ravenName, destination) {
      // Check if there are other Ravens that could form a mobbing pair
      const allRavens = Object.entries(gameState.piecePositions).filter(([name, pos]) => 
        name.endsWith('Raven') && 
        pos !== "captured" && 
        name !== ravenName
      );
      
      return allRavens.length > 0; // Simplified check - could be more sophisticated
    },

    checkOwlCaptureOpportunity: function(destination) {
      // Check if the destination square is occupied by an opponent piece
      const occupyingPiece = Object.entries(gameState.piecePositions).find(
        ([pieceName, pos]) => pos === destination
      );
      
      return !!occupyingPiece;
    },

    // HYBRID CAPTURE MODE
    startHybridCaptureMode: function(parsedMove) {
      console.log('🔄 Starting hybrid capture mode for move:', parsedMove);
      
      // Store the pending move
      this.pendingHybridMove = parsedMove;
      this.hybridCaptureMode = true;
      this.hybridCaptureVictims = [];
      
      // Update text input to show move is being processed
      const moveInput = document.getElementById('move-input');
      if (moveInput) {
        moveInput.value = moveNotation.moveToNotation(parsedMove);
        moveInput.classList.add('hybrid-capture');
      }
      
      // Enable piece clicking for captures
      this.enableHybridPieceClicking();
      
      // Start a timer to auto-finish if no captures are made
      this.startHybridCaptureTimer();
      
      // Update display
      gameState.displayInfoMessage(`Hybrid mode: Move completed. Click pieces to capture or wait 7 seconds to finish.`);
    },

    startHybridCaptureTimer: function() {
      // Start 7-second timer
      setTimeout(() => {
        if (this.hybridCaptureMode) {
          console.log('🕒 Hybrid capture timer expired - finishing capture mode');
          this.finishHybridCapture();
        }
      }, 7000);
    },

    enableHybridPieceClicking: function() {
      // Get potential victims based on the move
      const potentialVictims = this.getPotentialVictims(this.pendingHybridMove);
      console.log('🎯 Enabling hybrid clicking for potential victims:', potentialVictims);
      
      // Make potential victim pieces clickable and highlight them
      potentialVictims.forEach(victimName => {
        const piece3D = gameState.findPieceInScene(victimName);
        if (piece3D && gameState.piecePositions[victimName] !== "captured") {
          // Store original scale for restoration
          if (!piece3D.originalScaling) {
            piece3D.originalScaling = piece3D.scaling.clone();
          }
          
          // Highlight the piece
          piece3D.scaling = piece3D.originalScaling.scale(1.2);
          
          // Create click handler
          const clickHandler = () => {
            this.addHybridCaptureVictim(victimName);
          };
          
          // Store handler for cleanup
          this.hybridClickHandlers.set(victimName, clickHandler);
          
          // Add click action (simplified - would need proper Babylon.js action setup)
          if (piece3D.actionManager) {
            piece3D.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
              BABYLON.ActionManager.OnPickTrigger,
              clickHandler
            ));
          }
        }
      });
    },

    getPotentialVictims: function(parsedMove) {
      const victims = [];
      const movingPiece = parsedMove.piece;
      const destination = parsedMove.destination;
      
      if (movingPiece.includes('Kite')) {
        // Kite can capture adjacent pieces after cross-face moves
        const adjacentSquares = this.getAdjacentSquares(destination);
        adjacentSquares.forEach(square => {
          const piece = this.findPieceAtSquare(square);
          if (piece && this.isOpponentPiece(movingPiece, piece)) {
            victims.push(piece);
          }
        });
      }
      // Add Raven and Owl logic as needed
      
      return victims;
    },

    addHybridCaptureVictim: function(victimPieceName) {
      if (!this.hybridCaptureVictims.includes(victimPieceName)) {
        console.log(`📥 HYBRID: Adding victim: ${victimPieceName}`);
        this.hybridCaptureVictims.push(victimPieceName);
        
        // Execute the capture immediately
        gameState.piecePositions[victimPieceName] = "captured";
        this.recordCapture(victimPieceName);
        
        // Remove highlighting and click handler
        const piece3D = gameState.findPieceInScene(victimPieceName);
        if (piece3D && piece3D.originalScaling) {
          piece3D.scaling = piece3D.originalScaling;
        }
        this.hybridClickHandlers.delete(victimPieceName);
      }
    },

    finishHybridCapture: function() {
      console.log(`🔄 Hybrid capture complete - now updating displays and advancing turn`);
      this.disableHybridPieceClicking();
      this.hybridCaptureMode = false;
      this.pendingHybridMove = null;
      this.hybridCaptureVictims = [];
      
      // Clear hybrid styling
      const moveInput = document.getElementById('move-input');
      if (moveInput) {
        moveInput.classList.remove('hybrid-capture');
      }
      
      gameState.updateNextPlayer();
      gameState.updateOwlHallaDisplay();
      gameState.updateNextPlayerDisplay();
      gameState.updatePlayerTypes();
      gameState.proceedToNextTurn();
    },

    disableHybridPieceClicking: function() {
      // Remove temporary click handlers and reset piece scaling
      this.hybridClickHandlers.forEach((handler, pieceName) => {
        const piece3D = gameState.findPieceInScene(pieceName);
        if (piece3D) {
          // Restore original scaling
          if (piece3D.originalScaling) {
            piece3D.scaling = piece3D.originalScaling;
          }
          // Remove click handler (would need proper Babylon.js cleanup)
        }
      });
      this.hybridClickHandlers.clear();
    },

    executeDirectCapture: function(parsedMove) {
      for (const victim of parsedMove.victims) {
        const victimPieceName = moveNotation.getPieceName(victim);
        if (victimPieceName && gameState.piecePositions[victimPieceName] !== "captured") {
          gameState.piecePositions[victimPieceName] = "captured";
          
          // Animate the 3D piece to Owl Halla
          console.log(`📥 DIRECT CAPTURE: Animating piece to Owl Halla: ${victimPieceName}`);
          if (typeof window.animateCapturedPieceToOwlHalla === 'function') {
            window.animateCapturedPieceToOwlHalla(victimPieceName);
          } else {
            console.log(`📥 DIRECT CAPTURE: WARNING: animateCapturedPieceToOwlHalla function not available`);
          }
          
          gameState.displayInfoMessage(`Captured: ${victim}`);
        } else {
          gameState.displayInfoMessage(`Piece ${victim} not found or already captured`);
        }
      }
      gameState.updateOwlHallaDisplay();
    },

    // UTILITY FUNCTIONS
    getAdjacentSquares: function(square) {
      console.log(`🔍 getAdjacentSquares called with: ${square}`);
      
      const face = square[0];
      let coords;
      
      // Handle both formats: "g61" and "g6-1"
      if (square.includes('-')) {
        coords = square.substring(1).split("-");
      } else {
        // Parse format like "g61" -> row=6, col=1
        const numberPart = square.substring(1);
        if (numberPart.length >= 2) {
          coords = [numberPart.substring(0, numberPart.length - 1), numberPart.substring(numberPart.length - 1)];
        } else {
          console.log(`❌ Invalid square format: ${square}`);
          return [];
        }
      }
      
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);
      
      const adjacent = [];
      const directions = [
        [0, 1], [0, -1], [1, 0], [-1, 0]  // right, left, down, up
      ];
      
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 1 && newRow <= 7 && newCol >= 1 && newCol <= 7) {
          // Use the same format as the input square
          const adjacentSquare = square.includes('-') ? 
            `${face}${newRow}-${newCol}` : 
            `${face}${newRow}${newCol}`;
          adjacent.push(adjacentSquare);
        }
      }
      
      return adjacent;
    },

    findPieceAtSquare: function(square) {
      // Convert square format to match stored positions
      let normalizedSquare = square;
      if (!square.includes('-') && square.length >= 3) {
        const face = square[0];
        const numbers = square.substring(1);
        if (numbers.length >= 2) {
          const row = numbers.substring(0, numbers.length - 1);
          const col = numbers.substring(numbers.length - 1);
          normalizedSquare = `${face}${row}-${col}`;
        }
      }
      
      for (const [pieceName, position] of Object.entries(gameState.piecePositions)) {
        if (position === normalizedSquare && position !== "captured") {
          return pieceName;
        }
      }
      return null;
    },

    isOpponentPiece: function(movingPiece, targetPiece) {
      const movingColor = gameState.getColorFromPieceName(movingPiece);
      const targetColor = gameState.getColorFromPieceName(targetPiece);
      return movingColor !== targetColor;
    }
  };
}