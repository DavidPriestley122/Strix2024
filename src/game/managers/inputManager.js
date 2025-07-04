// INPUT MANAGEMENT MODULE
// Handles move input, parsing, validation, and execution

import { moveNotation } from "../rules/moveNotation.js";

export function createInputManager(gameState, resetFunctions) {
  const { scene, animatePieceMovement } = resetFunctions;

  return {
    // MOVE INPUT INITIALIZATION
    initializeMoveInput: function() {
      // Get HTML elements
      const moveInput = document.getElementById('move-input');
      const executeBtn = document.getElementById('execute-move-btn');
      const clearBtn = document.getElementById('clear-input-btn');
      const validateBtn = document.getElementById('validate-move-btn');
      const capturedPiecesEl = document.getElementById('captured-pieces');
      const moveHistoryEl = document.getElementById('move-history-display');
      
      if (!moveInput || !executeBtn || !clearBtn || !validateBtn) {
        console.warn('Move input elements not found in DOM');
        return;
      }

      // Clear button handler
      clearBtn.addEventListener('click', () => {
        moveInput.value = '';
        moveInput.classList.remove('valid', 'invalid');
      });

      // Real-time validation on input
      moveInput.addEventListener('input', () => {
        const input = moveInput.value.trim();
        if (!input) {
          moveInput.classList.remove('valid', 'invalid');
          return;
        }

        const parsedMove = moveNotation.parseMove(input);
        if (parsedMove && parsedMove.valid) {
          // Check notation validity first
          if (parsedMove.type === 'move') {
            // For regular moves, also validate game rules
            const pieceName = moveNotation.getPieceName(parsedMove.piece);
            const currentPosition = gameState.piecePositions[pieceName];
            
            if (pieceName && currentPosition && currentPosition !== "captured") {
              // Only validate if we have the validation function available
              if (typeof window.validateMove === 'function') {
                const validation = window.validateMove(pieceName, currentPosition, parsedMove.destination);
                if (validation.valid) {
                  moveInput.classList.remove('invalid');
                  moveInput.classList.add('valid');
                } else {
                  moveInput.classList.remove('valid');
                  moveInput.classList.add('invalid');
                  moveInput.title = validation.reason; // Show reason on hover
                }
              } else {
                // Fallback to notation-only validation
                moveInput.classList.remove('invalid');
                moveInput.classList.add('valid');
              }
            } else {
              moveInput.classList.remove('valid');
              moveInput.classList.add('invalid');
              moveInput.title = `Piece ${parsedMove.piece} not found or captured`;
            }
          } else {
            // For capture/restore moves, just check notation validity
            moveInput.classList.remove('invalid');
            moveInput.classList.add('valid');
          }
        } else {
          moveInput.classList.remove('valid');
          moveInput.classList.add('invalid');
          moveInput.title = 'Invalid move notation';
        }
      });

      // Validate button handler
      validateBtn.addEventListener('click', () => {
        const input = moveInput.value.trim();
        if (!input) {
          gameState.displayInfoMessage('Please enter a move to validate');
          return;
        }

        const parsedMove = moveNotation.parseMove(input);
        if (parsedMove && parsedMove.valid) {
          gameState.displayInfoMessage(`Valid: ${moveNotation.moveToNotation(parsedMove)}`);
        } else {
          gameState.displayInfoMessage('Invalid move notation');
        }
      });

      // Execute button handler
      executeBtn.addEventListener('click', () => {
        const input = moveInput.value.trim();
        if (!input) {
          gameState.displayInfoMessage('Please enter a move to execute');
          return;
        }

        this.executeParsedMove(moveNotation.parseMove(input));
      });

      // Enter key handler
      moveInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          executeBtn.click();
        }
      });

      console.log('Move input system initialized');
    },

    // MOVE EXECUTION
    executeParsedMove: function(parsedMove) {
      try {
        switch (parsedMove.type) {
          case 'move':
            this.executeRegularMove(parsedMove);
            break;
          case 'capture':
            gameState.executeDirectCapture(parsedMove);
            break;
          case 'restore':
            gameState.executeRestore(parsedMove);
            break;
          default:
            gameState.displayInfoMessage(`Unknown move type: ${parsedMove.type}`);
        }
      } catch (error) {
        console.error('Error executing parsed move:', error);
        gameState.displayInfoMessage(`Error: ${error.message}`);
      }
    },

    executeRegularMove: function(parsedMove) {
      console.log(`🎯 executeRegularMove called with:`, parsedMove);
      
      if (!parsedMove || !parsedMove.valid) {
        gameState.displayInfoMessage('Invalid move');
        return;
      }

      const pieceName = moveNotation.getPieceName(parsedMove.piece);
      const currentPosition = gameState.piecePositions[pieceName];
      
      if (!pieceName || !currentPosition || currentPosition === "captured") {
        gameState.displayInfoMessage(`Piece ${parsedMove.piece} not found or captured`);
        return;
      }

      // Check if the piece has captures specified in the move notation
      if (parsedMove.victims && parsedMove.victims.length > 0) {
        console.log(`📥 TEXT INPUT: Move has explicit captures:`, parsedMove.victims);
        
        // Validate that the piece can actually capture the specified victims
        if (this.validateExplicitCaptures(pieceName, parsedMove.destination, parsedMove.victims)) {
          // Execute movement then captures
          this.executeMovementThenCaptures(parsedMove);
        } else {
          gameState.displayInfoMessage(`Invalid captures specified for ${parsedMove.piece}`);
        }
      } else {
        // Regular move execution - check for potential captures
        this.executeMovementAndCaptures(parsedMove);
      }
    },

    executeMovementThenCaptures: function(parsedMove) {
      console.log(`🎯 executeMovementThenCaptures: Moving piece first, then starting capture mode`);
      
      const pieceName = moveNotation.getPieceName(parsedMove.piece);
      const currentPosition = gameState.piecePositions[pieceName];
      
      // Store game state before movement
      const gameStateBeforeMove = {
        piecePositions: JSON.parse(JSON.stringify(gameState.piecePositions)),
        currentPlayer: gameState.currentPlayerTurn,
        captureHistory: JSON.parse(JSON.stringify(gameState.captureHistory)),
        knockedOutTeam: gameState.knockedOutTeam,
        isPlayAgainState: gameState.isPlayAgainState,
        gameOver: gameState.gameOver
      };

      // Execute the movement animation first
      const piece3D = scene.getMeshByName(pieceName);
      
      // Convert destination format from "y22" to "y2-2" for scene lookup
      let sceneDestination = parsedMove.destination;
      if (!sceneDestination.includes('-') && sceneDestination.length >= 3) {
        const face = sceneDestination[0];
        const numbers = sceneDestination.substring(1);
        if (numbers.length >= 2) {
          const row = numbers.substring(0, numbers.length - 1);
          const col = numbers.substring(numbers.length - 1);
          sceneDestination = `${face}${row}-${col}`;
        }
      }
      
      const targetCube = scene.getMeshByName(sceneDestination);
      
      if (!piece3D || !targetCube) {
        gameState.displayInfoMessage(`Could not find piece or destination for ${pieceName} -> ${sceneDestination}`);
        return;
      }

      const targetPosition = targetCube.position.clone();
      const targetRotation = targetCube.rotation.clone();

      // Add offset based on board
      if (parsedMove.destination.startsWith("b")) {
        targetPosition.y += 3.75;
      } else if (parsedMove.destination.startsWith("y")) {
        targetPosition.x += 3.75;
      } else if (parsedMove.destination.startsWith("g")) {
        targetPosition.z += 3.75;
      }

      // Animate piece movement
      if (typeof animatePieceMovement === 'function') {
        animatePieceMovement(piece3D, targetPosition, targetRotation, 30, () => {
          console.log(`✅ Movement animation complete - now processing captures`);
          
          // Update game state after movement
          gameState.piecePositions[pieceName] = parsedMove.destination;
          
          // Add basic move to history (captures will be added later)
          // Note: We pass a special flag to indicate this is a hybrid move in progress
          gameState.addMoveToHistory(pieceName, currentPosition, parsedMove.destination, { name: "hybrid_in_progress" }, gameStateBeforeMove);
          
          // NOW start the hybrid capture mode
          gameState.startHybridCaptureMode(parsedMove);
        });
      } else {
        console.log('❌ animatePieceMovement function not available');
        // Fallback: update position without animation
        gameState.piecePositions[pieceName] = parsedMove.destination;
        gameState.addMoveToHistory(pieceName, currentPosition, parsedMove.destination, { name: "hybrid_in_progress" }, gameStateBeforeMove);
        gameState.startHybridCaptureMode(parsedMove);
      }
    },

    executeMovementAndCaptures: function(parsedMove) {
      const pieceName = moveNotation.getPieceName(parsedMove.piece);
      const currentPosition = gameState.piecePositions[pieceName];
      
      console.log(`📥 TEXT INPUT: Executing movement and captures for ${pieceName}`);
      console.log(`📥 TEXT INPUT: Current position: ${currentPosition}`);
      console.log(`📥 TEXT INPUT: Target position: ${parsedMove.destination}`);
      console.log(`📥 TEXT INPUT: Current player: ${gameState.currentPlayerTurn}`);
      console.log(`📥 TEXT INPUT: Parsed move:`, parsedMove);
      
      // Store game state before move for takeback
      const gameStateBeforeMove = {
        piecePositions: JSON.parse(JSON.stringify(gameState.piecePositions)),
        currentPlayer: gameState.currentPlayerTurn,
        captureHistory: JSON.parse(JSON.stringify(gameState.captureHistory)),
        knockedOutTeam: gameState.knockedOutTeam,
        isPlayAgainState: gameState.isPlayAgainState,
        gameOver: gameState.gameOver
      };

      // Update piece position AND animate visually
      gameState.piecePositions[pieceName] = parsedMove.destination;
      
      // Animate the piece movement visually
      const piece3D = scene.getMeshByName(pieceName);
      
      // Convert destination format from "y22" to "y2-2" for scene lookup
      let sceneDestination = parsedMove.destination;
      if (!sceneDestination.includes('-') && sceneDestination.length >= 3) {
        const face = sceneDestination[0];
        const numbers = sceneDestination.substring(1);
        if (numbers.length >= 2) {
          const row = numbers.substring(0, numbers.length - 1);
          const col = numbers.substring(numbers.length - 1);
          sceneDestination = `${face}${row}-${col}`;
        }
      }
      
      const targetCube = scene.getMeshByName(sceneDestination);
      
      if (piece3D && targetCube) {
        const targetPosition = targetCube.position.clone();
        const targetRotation = targetCube.rotation.clone();

        // Add offset based on board
        if (parsedMove.destination.startsWith("b")) {
          targetPosition.y += 3.75;
        } else if (parsedMove.destination.startsWith("y")) {
          targetPosition.x += 3.75;
        } else if (parsedMove.destination.startsWith("g")) {
          targetPosition.z += 3.75;
        }

        // Animate piece movement
        if (typeof animatePieceMovement === 'function') {
          animatePieceMovement(piece3D, targetPosition, targetRotation, 30);
        } else {
          // Fallback: instant position change
          piece3D.position = targetPosition;
          piece3D.rotation = targetRotation;
        }
      }

      // Execute captures first (from text input)
      if (parsedMove.victims && parsedMove.victims.length > 0) {
        for (const victim of parsedMove.victims) {
          const victimPieceName = moveNotation.getPieceName(victim);
          console.log(`📥 TEXT INPUT: Capturing: ${victim} -> ${victimPieceName}`);
          
          if (victimPieceName && gameState.piecePositions[victimPieceName] !== "captured") {
            gameState.piecePositions[victimPieceName] = "captured";
            
            // Call the same recordCapture function used by click-based captures
            gameState.recordCapture(victimPieceName);
            
            // Animate the 3D piece to Owl Halla
            console.log(`📥 TEXT INPUT: Animating piece to Owl Halla: ${victimPieceName}`);
            if (typeof window.animateCapturedPieceToOwlHalla === 'function') {
              window.animateCapturedPieceToOwlHalla(victimPieceName);
            } else {
              console.log(`📥 TEXT INPUT: WARNING: animateCapturedPieceToOwlHalla function not available`);
            }
          }
        }
      }

      // Add to move history
      gameState.addMoveToHistory(pieceName, currentPosition, parsedMove.destination, 
                           parsedMove.victims && parsedMove.victims.length > 0 ? { name: "text_input_capture" } : null,
                           gameStateBeforeMove);
      
      gameState.displayInfoMessage(`Executed: ${moveNotation.moveToNotation(parsedMove)}`);
    },

    // VALIDATION HELPERS
    validateExplicitCaptures: function(pieceName, destination, victims) {
      // This is a simplified validation - in a full implementation, 
      // you'd check if the piece can actually capture those specific victims
      console.log(`🔍 Validating explicit captures for ${pieceName}:`, victims);
      
      // Check that all victim pieces exist and aren't captured
      for (const victim of victims) {
        const victimPieceName = moveNotation.getPieceName(victim);
        if (!victimPieceName || gameState.piecePositions[victimPieceName] === "captured") {
          console.log(`❌ Victim ${victim} not valid`);
          return false;
        }
      }
      
      return true;
    },

    // INPUT UTILITIES
    clearMoveInput: function() {
      const moveInput = document.getElementById('move-input');
      if (moveInput) {
        moveInput.value = '';
        moveInput.classList.remove('valid', 'invalid', 'hybrid-capture');
      }
    },

    setMoveInputValue: function(value) {
      const moveInput = document.getElementById('move-input');
      if (moveInput) {
        moveInput.value = value;
        // Trigger input event to update validation
        moveInput.dispatchEvent(new Event('input'));
      }
    },

    getMoveInputValue: function() {
      const moveInput = document.getElementById('move-input');
      return moveInput ? moveInput.value.trim() : '';
    },

    // INPUT VALIDATION STATE
    setInputValidationState: function(isValid, message = '') {
      const moveInput = document.getElementById('move-input');
      if (!moveInput) return;

      moveInput.classList.remove('valid', 'invalid');
      
      if (isValid) {
        moveInput.classList.add('valid');
        moveInput.removeAttribute('title');
      } else {
        moveInput.classList.add('invalid');
        if (message) {
          moveInput.title = message;
        }
      }
    },

    // BATCH MOVE PROCESSING
    executeMoveSequence: function(moveSequence) {
      if (!Array.isArray(moveSequence) || moveSequence.length === 0) {
        gameState.displayInfoMessage('Invalid move sequence');
        return;
      }

      console.log(`🎯 Executing move sequence:`, moveSequence);
      
      // Execute moves one by one with delays
      let index = 0;
      const executeNext = () => {
        if (index >= moveSequence.length) {
          gameState.displayInfoMessage(`Completed ${moveSequence.length} move sequence`);
          return;
        }

        const move = moveSequence[index];
        const parsedMove = moveNotation.parseMove(move);
        
        if (parsedMove && parsedMove.valid) {
          this.executeParsedMove(parsedMove);
          index++;
          setTimeout(executeNext, 1000); // 1 second delay between moves
        } else {
          gameState.displayInfoMessage(`Invalid move in sequence: ${move}`);
        }
      };

      executeNext();
    }
  };
}