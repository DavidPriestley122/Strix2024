// MOVE HISTORY MANAGEMENT MODULE
// Handles move history, takeback functionality, and move display

import { moveNotation } from "./moveNotation.js";

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
          currentPlayer: gameState.currentPlayerTurn,
          captureHistory: JSON.parse(JSON.stringify(gameState.captureHistory)),
          knockedOutTeam: gameState.knockedOutTeam,
          isPlayAgainState: gameState.isPlayAgainState,
          gameOver: gameState.gameOver
        }
      };

      console.log(`💾 Saving move record for takeback:`, moveRecord);
      console.log(`💾 Game state snapshot:`, moveRecord.gameState);

      // Add to move history
      gameState.moveHistory.push(moveRecord);
      gameState.lastMove = moveRecord;

      // Check win condition
      gameState.checkWinningConditions(piece, destinationSquare);

      // Update displays
      gameState.updateNextPlayer();
      this.updateMoveHistoryDisplay();
      gameState.updateOwlHallaDisplay(); // Update captured pieces display
      gameState.updateNextPlayerDisplay();
      
      // Trigger next turn (including AI moves)
      gameState.proceedToNextTurn();
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
      
      // Restore the game state
      gameState.piecePositions = JSON.parse(JSON.stringify(targetMove.gameState.piecePositions));
      gameState.currentPlayerTurn = targetMove.gameState.currentPlayer;
      gameState.captureHistory = JSON.parse(JSON.stringify(targetMove.gameState.captureHistory));
      gameState.knockedOutTeam = targetMove.gameState.knockedOutTeam;
      gameState.isPlayAgainState = targetMove.gameState.isPlayAgainState;
      gameState.gameOver = targetMove.gameState.gameOver;
      
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
          
          // Only trigger AI move if current player is AI
          if (gameState.isAIPlayer(gameState.currentPlayerTurn)) {
            console.log(`🤖 Current player ${gameState.currentPlayerTurn} is AI - triggering move`);
            gameState.proceedToNextTurn();
          } else {
            console.log(`👤 Current player ${gameState.currentPlayerTurn} is human - waiting for input`);
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