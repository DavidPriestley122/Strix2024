// MOVE HISTORY MANAGEMENT MODULE
// Handles move history, takeback functionality, and move display

import { moveNotation } from "../rules/moveNotation.js";

export function createMoveHistoryManager(gameState, resetFunctions) {
  const { scene, animatePieceMovement } = resetFunctions;

  return {
    // MOVE HISTORY MANAGEMENT
    addMoveToHistory: function (piece, sourceSquare, destinationSquare, capturedPiece, gameStateBeforeMove = null, allCapturedPieces = null) {
      console.log(
        `=== addMoveToHistory called: ${piece} from ${sourceSquare} to ${destinationSquare} ===`
      );

      const pieceNotation = gameState.abbreviatePiece(piece);
      let moveText = `${pieceNotation}-${destinationSquare.replace("-", "")}`;
      
      // Add capture notation if there was a capture
      if (allCapturedPieces && allCapturedPieces.length > 0) {
        // Use the explicitly provided captured pieces list
        const captureNotations = allCapturedPieces
          .map(cap => moveNotation.getNotationFromPieceName(cap))
          .filter(Boolean);
        if (captureNotations.length > 0) {
          moveText += ` x ${captureNotations.join(' x ')}`;
        }
      } else if (capturedPiece && capturedPiece.name !== "text_input_capture" && capturedPiece.name !== "hybrid_in_progress") {
        // For direct captures, add the captured piece notation
        if (typeof capturedPiece === 'string') {
          // Single piece name
          const captureNotation = moveNotation.getNotationFromPieceName(capturedPiece);
          if (captureNotation) {
            moveText += ` x ${captureNotation}`;
          }
        } else if (capturedPiece.name && capturedPiece.name !== "potential_kite_capture" && capturedPiece.name !== "potential_raven_mobbing") {
          // Single piece object with name
          const captureNotation = moveNotation.getNotationFromPieceName(capturedPiece.name);
          if (captureNotation) {
            moveText += ` x ${captureNotation}`;
          }
        }
      }
      
      // Extract the player color from the piece name (this is who made the move)
      const movingPlayerColor = piece.split(/(?=[A-Z])/)[0];
      
      // Create move record with game state snapshot for takeback
      const moveRecord = {
        notation: moveText,
        piece: piece,
        from: sourceSquare,
        to: destinationSquare,
        captured: capturedPiece,
        moveNumber: gameState.moveHistory.length + 1,
        
        // Store complete game state BEFORE this move for restoration
        gameState: gameStateBeforeMove || {
          piecePositions: JSON.parse(JSON.stringify(gameState.piecePositions)),
          currentPlayer: movingPlayerColor, // Save who made this move (not who's next)
          captureHistory: JSON.parse(JSON.stringify(gameState.captureHistory)),
          knockedOutTeam: gameState.knockedOutTeam,
          isPlayAgainState: gameState.isPlayAgainState,
          gameOver: gameState.gameOver
        }
      };
      
      console.log(`💾 TAKEBACK DEBUG: Move ${moveRecord.moveNumber} by ${movingPlayerColor}, currentPlayerTurn was ${gameState.currentPlayerTurn}`);

      console.log(`💾 Saving move record for takeback:`, moveRecord);
      console.log(`💾 Game state snapshot:`, moveRecord.gameState);

      // Add to move history
      gameState.moveHistory.push(moveRecord);
      gameState.lastMove = moveRecord;


      // Check win condition
      const winningMessage = gameState.checkWinningConditions(piece, destinationSquare);
      if (winningMessage) {
        gameState.moveHistory.push(winningMessage);
        gameState.gameOver = true;
        console.log("Game over:", winningMessage);
        
        // Finalize export manager
        if (gameState.gameExportManager && typeof gameState.gameExportManager.finalizeGame === 'function') {
          gameState.gameExportManager.finalizeGame();
        }
        
        // IMPORTANT: Update the UI to show the win properly
        gameState.updateGameOverDisplay(winningMessage);
        return; // Don't proceed to next turn
      }

      // Check if this is a hybrid capture in progress FIRST
      const isHybridInProgress = capturedPiece && capturedPiece.name === "hybrid_in_progress";
      
      // Update game state
      gameState.lastMove = { piece, sourceSquare, destinationSquare, moveText };
      gameState.isPlayAgainState = false;
      
      // Don't advance turn if this is a hybrid capture in progress
      if (isHybridInProgress) {
        console.log(`🔄 Hybrid capture in progress - NOT advancing turn or updating displays yet`);
        this.updateMoveHistoryDisplay();
        return; // Exit early, don't advance turn or call proceedToNextTurn()
      }
      
      // Normal flow for non-hybrid moves - DON'T advance turn yet (wait for captures)
      this.updateMoveHistoryDisplay();
      gameState.updateOwlHallaDisplay(); // Update captured pieces display
      // gameState.updateNextPlayer(); // MOVED: This will be called later in proceedToNextTurn
      // gameState.updateNextPlayerDisplay(); // MOVED: This will be called later in proceedToNextTurn

      gameState.updatePlayerTypes(); // Read the radio buttons first

      // Check if this was a human move with potential captures
      // movingPlayerColor already declared above
      const isHumanMove = !gameState.isAIPlayer(movingPlayerColor);
      const hasPotentialCapture = capturedPiece !== null && capturedPiece !== undefined;
      const isTextInputCapture = capturedPiece && capturedPiece.name === "text_input_capture";
      const isRavenMove = piece.includes('Raven');
      
      // Don't start timer for text input captures (they're already completed) or if game is over
      if (isHumanMove && hasPotentialCapture && !isTextInputCapture && !gameState.gameOver) {
        console.log(`🕒 Starting 7-second capture decision timer for ${piece}`);
        console.log(`🔍 Timer will be set for moving player: ${movingPlayerColor}`);
        console.log(`🔍 Current turn is now: ${gameState.currentPlayerTurn}`);
        
        // Use captureManager methods to start timer
        if (gameState.captureManager) {
          gameState.captureManager.isRavenCaptureInProgress = isRavenMove;
          gameState.captureManager.capturingPlayer = movingPlayerColor;
          
          // Start visual countdown
          gameState.startCaptureTimerDisplay();
          
          // Start 7-second timer for capture decisions
          gameState.captureManager.captureDecisionTimer = setTimeout(() => {
            console.log(`⏰ Capture decision timer expired - proceeding to next turn`);
            gameState.captureManager.captureDecisionTimer = null;
            gameState.captureManager.isRavenCaptureInProgress = false;
            gameState.captureManager.capturingPlayer = null;
            gameState.stopCaptureTimerDisplay();
            // Store move info for win checking
            gameState.lastMovePiece = piece;
            gameState.lastMoveDestination = destinationSquare;
            gameState.proceedToNextTurn();
          }, 7000);
        } else {
          // Fallback: proceed immediately if captureManager not available
          // Store move info for win checking
          gameState.lastMovePiece = piece;
          gameState.lastMoveDestination = destinationSquare;
          gameState.proceedToNextTurn();
        }
      } else {
        // No capture timer needed - proceed immediately
        // Store move info for win checking
        gameState.lastMovePiece = piece;
        gameState.lastMoveDestination = destinationSquare;
        gameState.proceedToNextTurn();
      }
    },

    // MOVE DISPLAY MANAGEMENT  
    updateMoveHistoryDisplay: function() {
      const moveHistoryEl = document.getElementById('move-history-display');
      if (!moveHistoryEl) return;

      // Clear existing content except for template
      moveHistoryEl.innerHTML = '';

      // Add moves from history
      if (gameState.moveHistory && gameState.moveHistory.length > 0) {
        gameState.moveHistory.forEach((move, index) => {
          const moveEl = document.createElement('div');
          moveEl.className = 'move-entry';
          if (index === gameState.moveHistory.length - 1) {
            moveEl.classList.add('new-move');
          }

          // Handle both string moves (legacy) and object moves (new format)
          const moveText = typeof move === 'string' ? move : (move.notation || this.formatMoveForDisplay(move));

          moveEl.innerHTML = `
            <span class="move-number">${index + 1}.</span>
            <span class="move-notation">${moveText}</span>
            <button class="takeback-btn" data-move-index="${index}" title="Restore game to this position">↺</button>
          `;

          moveHistoryEl.appendChild(moveEl);
        });

        // Add takeback listeners
        moveHistoryEl.querySelectorAll('.takeback-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            const moveIndex = parseInt(e.target.dataset.moveIndex);
            console.log(`🖱️ Takeback button clicked for move index: ${moveIndex}`);
            this.takebackToMove(moveIndex);
          });
        });
      }
    },

    formatMoveForDisplay: function(move) {
      // Format move for display - convert internal move to notation
      const piece = moveNotation.getNotationFromPieceName(move.piece);
      const destination = move.destination;
      const captures = move.capturedPiece ? ' x ??' : '';
      return `${piece}-${destination}${captures}`;
    },

    // TAKEBACK FUNCTIONALITY
    takebackToMove: function(moveIndex) {
      console.log(`🔄 Taking back to move ${moveIndex + 1}`);
      console.log(`📊 Current move history length: ${gameState.moveHistory.length}`);
      console.log(`📊 Current moveHistory:`, gameState.moveHistory);
      
      if (moveIndex < 0 || moveIndex >= gameState.moveHistory.length) {
        console.log(`❌ Invalid move index: ${moveIndex} (length: ${gameState.moveHistory.length})`);
        gameState.displayInfoMessage(`Invalid move index: ${moveIndex + 1}`);
        return;
      }
      
      const targetMove = gameState.moveHistory[moveIndex];
      console.log(`🎯 Target move:`, targetMove);
      
      // Handle legacy string format moves
      if (typeof targetMove === 'string') {
        console.log(`❌ Legacy string format move: ${targetMove}`);
        gameState.displayInfoMessage('Cannot takeback to legacy move format');
        return;
      }
      
      if (!targetMove.gameState) {
        console.log(`❌ No game state in target move:`, targetMove);
        gameState.displayInfoMessage('No game state saved for this move');
        return;
      }
      
      console.log(`📍 Restoring game state to move ${moveIndex + 1}: ${targetMove.notation}`);
      console.log(`📊 Target game state:`, targetMove.gameState);
      
      // Store current positions for animation
      const currentPositions = JSON.parse(JSON.stringify(gameState.piecePositions));
      console.log(`📊 Current positions before restore:`, currentPositions);
      console.log(`📊 Target positions after restore:`, targetMove.gameState.piecePositions);
      
      // Restore the game state completely - this should be the EXACT state after the target move
      gameState.piecePositions = JSON.parse(JSON.stringify(targetMove.gameState.piecePositions));
      gameState.currentPlayerTurn = targetMove.gameState.currentPlayer;
      gameState.captureHistory = JSON.parse(JSON.stringify(targetMove.gameState.captureHistory));
      gameState.knockedOutTeam = targetMove.gameState.knockedOutTeam;
      gameState.isPlayAgainState = targetMove.gameState.isPlayAgainState;
      gameState.gameOver = targetMove.gameState.gameOver;
      
      
      // The saved game state should have currentPlayer as the NEXT player to move
      // So we don't need to call updateNextPlayer() - it's already correct
      console.log(`📍 Restored to state where next player to move is: ${gameState.currentPlayerTurn}`);
      
      // Pause AI game temporarily to prevent immediate AI move after takeback
      const wasAIGameRunning = gameState.aiGameRunning;
      if (gameState.aiGameRunning) {
        console.log('🔄 Temporarily pausing AI game during takeback');
        gameState.aiGamePaused = true;
      }
      
      console.log(`✅ Game state restored. New current player: ${gameState.currentPlayerTurn}`);
      
      // Truncate move history to the target move
      const oldHistoryLength = gameState.moveHistory.length;
      gameState.moveHistory = gameState.moveHistory.slice(0, moveIndex + 1);
      console.log(`✂️ Truncated move history from ${oldHistoryLength} to ${gameState.moveHistory.length} moves`);
      
      // Animate all pieces to their restored positions
      this.animatePiecesToRestoredPositions(currentPositions, gameState.piecePositions);
      
      // Update all displays
      this.updateMoveHistoryDisplay();
      gameState.updateOwlHallaDisplay();
      gameState.updateNextPlayerDisplay();
      
      // Resume AI game after a short delay to allow animation to complete
      if (wasAIGameRunning) {
        setTimeout(() => {
          console.log('🔄 Resuming AI game after takeback animation');
          gameState.aiGamePaused = false;
          
          // Use bullet-proof AI triggering after takeback
          if (gameState.triggerAIMoveIfNeeded) {
            gameState.triggerAIMoveIfNeeded();
          }
        }, 1000); // Wait 1 second for animation to complete
      }
      
      gameState.displayInfoMessage(`Restored to move ${moveIndex + 1}: ${targetMove.notation}`);
    },

    // ANIMATION HELPERS
    animatePiecesToRestoredPositions: function(fromPositions, toPositions) {
      console.log('🎬 Animating pieces to restored positions');
      console.log('📊 From positions:', fromPositions);
      console.log('📊 To positions:', toPositions);
      
      let changesFound = 0;
      
      // Animate each piece that has changed position
      for (const [pieceName, toPosition] of Object.entries(toPositions)) {
        const fromPosition = fromPositions[pieceName];
        
        if (fromPosition !== toPosition) {
          changesFound++;
          console.log(`📍 Change #${changesFound}: ${pieceName}: ${fromPosition} → ${toPosition}`);
          
          const piece3D = this.findPieceInScene(pieceName);
          if (!piece3D) {
            console.log(`❌ Could not find 3D piece: ${pieceName}`);
            continue;
          }
          
          if (toPosition === "captured") {
            console.log(`🎯 ${pieceName} should go to Owl Halla`);
            // Piece should be in Owl Halla - animate to Owl Halla
            if (typeof window.animateCapturedPieceToOwlHalla === 'function') {
              window.animateCapturedPieceToOwlHalla(pieceName);
            } else {
              console.log(`❌ animateCapturedPieceToOwlHalla function not available for ${pieceName}`);
              piece3D.setEnabled(false);
            }
          } else if (fromPosition === "captured") {
            console.log(`🎯 ${pieceName} should come back from Owl Halla to ${toPosition}`);
            // Piece is coming back from Owl Halla - make visible and animate to board
            piece3D.setEnabled(true);
            piece3D.visibility = true;
            this.animatePieceToBoard(pieceName, toPosition);
          } else {
            console.log(`🎯 ${pieceName} should move from ${fromPosition} to ${toPosition}`);
            // Regular board-to-board move
            this.animatePieceToBoard(pieceName, toPosition);
          }
        }
      }
      
      if (changesFound === 0) {
        console.log('📊 No position changes detected during takeback');
      } else {
        console.log(`📊 Animated ${changesFound} pieces to restored positions`);
      }
    },

    animatePieceToBoard: function(pieceName, targetSquare) {
      console.log(`🎬 animatePieceToBoard called: ${pieceName} → ${targetSquare}`);
      
      const piece3D = this.findPieceInScene(pieceName);
      if (!piece3D) {
        console.log(`❌ Could not find 3D piece: ${pieceName}`);
        return;
      }
      
      const targetCube = scene.getMeshByName(targetSquare);
      if (!targetCube) {
        console.log(`❌ Could not find target square: ${targetSquare}`);
        return;
      }
      
      const targetPosition = targetCube.position.clone();
      const targetRotation = targetCube.rotation.clone();
      
      // Add the offset based on which board the square is on
      if (targetSquare.startsWith("b")) {
        targetPosition.y += 3.75;
      } else if (targetSquare.startsWith("y")) {
        targetPosition.x += 3.75;
      } else if (targetSquare.startsWith("g")) {
        targetPosition.z += 3.75;
      }
      
      // Animate the piece movement
      if (typeof animatePieceMovement === 'function') {
        animatePieceMovement(piece3D, targetPosition, targetRotation, 15, () => {
          console.log(`✅ ${pieceName} animated to restored position: ${targetSquare}`);
        });
      } else {
        console.log(`❌ animatePieceMovement function not available`);
        // Fallback: instant position change
        piece3D.position = targetPosition;
        piece3D.rotation = targetRotation;
      }
    },

    // HELPER FUNCTIONS
    findPieceInScene: function(pieceName) {
      console.log(`Looking for piece: ${pieceName}`);
      const piece = scene.meshes.find(mesh => mesh.name === pieceName);
      console.log(`Found piece:`, piece ? piece.name : 'NOT FOUND');
      return piece;
    },

    // UTILITY FUNCTIONS FOR HISTORY MANAGEMENT
    getRecentCaptures: function() {
      const captured = [];
      for (const [pieceName, position] of Object.entries(gameState.piecePositions)) {
        if (position === "captured") {
          captured.push(pieceName);
        }
      }
      return captured;
    },
  };
}