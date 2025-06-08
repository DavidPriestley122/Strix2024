import { validateOwlMove } from './rules/pieces/owlRules.js';
import { validateKiteMove } from './rules/pieces/kiteRules.js';
import { validateRavenMove } from './rules/pieces/ravenRules.js';

export function createAI(scene, gameStateManager, gameFunctions) {
  return {
    // Store reference to gameStateManager
    gameState: gameStateManager,

    makeMove: function (playerColor) {
      console.log(`AI (${playerColor}) is thinking...`);

      setTimeout(() => {
        // Check if game is still running and not paused before making the move
        if (!this.gameState.aiGameRunning || this.gameState.aiGamePaused) {
          console.log(
            `AI move cancelled - game running: ${this.gameState.aiGameRunning}, paused: ${this.gameState.aiGamePaused}`
          );
          return;
        }

        console.log(`AI (${playerColor}) making move...`);
        this.executeSimpleMove(playerColor);
      }, 5000);
    },

    executeSimpleMove: function (playerColor) {
      console.log(`AI finding ${playerColor} pieces...`);

      // Find all pieces belonging to this player
      const playerPieces = scene.meshes.filter(
        (mesh) =>
          mesh.name.startsWith(playerColor) &&
          (mesh.name.endsWith("Owl") ||
            mesh.name.endsWith("Kite") ||
            mesh.name.endsWith("Raven"))
      );

      if (playerPieces.length === 0) {
        console.log(`No ${playerColor} pieces found`);
        return;
      }

      // Find all board squares
      const boardSquares = scene.meshes.filter(
        (mesh) =>
          (mesh.name.startsWith("b") ||
            mesh.name.startsWith("y") ||
            mesh.name.startsWith("g")) &&
          mesh.name.includes("-") &&
          !mesh.name.includes("--")
      );

      // Try each piece until we find one that can make a valid move
      // Randomize the order to get more variety in piece selection
      const shuffledPieces = [...playerPieces].sort(() => Math.random() - 0.5);
      let pieceToMove = null;
      let targetSquare = null;
      
      for (let piece of shuffledPieces) {
        console.log(`AI trying piece: ${piece.name}`);
        
        // Find a valid destination square for this piece
        const currentPos = this.gameState.piecePositions[piece.name];
        
        // For Kites and Ravens, explore orthogonal paths like a human would
        if (piece.name.includes('Kite') || piece.name.includes('Raven')) {
          console.log(`DEBUG: Exploring orthogonal paths for ${piece.name} from ${currentPos}`);
          const validDestinations = this.exploreOrthogonalPaths(currentPos, piece.name);
          console.log(`DEBUG: Found ${validDestinations.length} orthogonal destinations for ${piece.name}`);
          
          if (validDestinations.length > 0) {
            // Pick a random valid destination
            const randomDestination = validDestinations[Math.floor(Math.random() * validDestinations.length)];
            targetSquare = scene.meshes.find(mesh => mesh.name === randomDestination);
            if (targetSquare) {
              pieceToMove = piece;
              console.log(`AI found orthogonal path move: ${piece.name} to ${randomDestination}`);
              break;
            }
          } else {
            console.log(`DEBUG: No orthogonal destinations found for ${piece.name} - will use fallback method`);
          }
        }
        
        // For Owls, only try adjacent orthogonal squares (one square moves only)
        if (piece.name.includes('Owl')) {
          const adjacentSquares = this.getAdjacentSquares(currentPos);
          for (const adjacentSquare of adjacentSquares) {
            // Check if square exists and is not occupied
            const square = scene.meshes.find(mesh => mesh.name === adjacentSquare);
            if (!square) continue;
            
            const isOccupied = Object.values(this.gameState.piecePositions || {}).includes(adjacentSquare);
            if (isOccupied) continue;
            
            // Check shadowing (excluding moving piece)
            this.gameState.updateShadowedRows(piece.name);
            let isShadowed = false;
            for (const color in this.gameState.shadowedRows) {
              const shadowedCubes = this.gameState.shadowedRows[color];
              if (shadowedCubes.includes(adjacentSquare)) {
                isShadowed = true;
                break;
              }
            }
            if (isShadowed) continue;
            
            // Validate with piece rules
            if (this.isValidPieceMove(piece, adjacentSquare)) {
              pieceToMove = piece;
              targetSquare = square;
              console.log(`AI found valid Owl move: ${piece.name} to ${adjacentSquare}`);
              break;
            }
          }
          if (pieceToMove && targetSquare) break;
        }
        
        // Fallback: use old method if path exploration failed
        if (!pieceToMove) {
          console.log(`DEBUG: Using fallback method for ${piece.name}`);
          const { squares: shuffledSquares, targetCrossFace } = this.prioritizeCrossFaceMoves(boardSquares, currentPos);
          const targetCrossFaceSquare = targetCrossFace;
        
          for (let square of shuffledSquares) {
          // Debug logging for cross-face target
          if (targetCrossFaceSquare && square.name === targetCrossFaceSquare) {
            console.log(`CROSS-FACE: Checking target ${square.name} for ${piece.name} from ${currentPos}`);
          }
          
          // Check if square is occupied
          const isOccupied = Object.values(
            this.gameState.piecePositions || {}
          ).includes(square.name);

          if (!isOccupied) {
            if (targetCrossFaceSquare && square.name === targetCrossFaceSquare) {
              console.log(`CROSS-FACE: ${square.name} is not occupied`);
            }
            // Check if the square is shadowed (excluding the moving piece like human version)
            this.gameState.updateShadowedRows(piece.name);
            let isShadowed = false;
            // Directly check shadowed rows like human version
            for (const color in this.gameState.shadowedRows) {
              const shadowedCubes = this.gameState.shadowedRows[color];
              if (shadowedCubes.includes(square.name)) {
                isShadowed = true;
                break;
              }
            }

            if (!isShadowed) {
              if (targetCrossFaceSquare && square.name === targetCrossFaceSquare) {
                console.log(`CROSS-FACE: ${square.name} is not shadowed`);
              }
              // Check if path is clear
              if (this.isPathClear(piece, square.name)) {
                if (targetCrossFaceSquare && square.name === targetCrossFaceSquare) {
                  console.log(`CROSS-FACE: Path to ${square.name} is clear`);
                }
                // Validate piece-specific rules
                if (this.isValidPieceMove(piece, square.name)) {
                  if (targetCrossFaceSquare && square.name === targetCrossFaceSquare) {
                    console.log(`CROSS-FACE: SUCCESS! ${piece.name} can move to ${square.name}`);
                  }
                  pieceToMove = piece;
                  targetSquare = square;
                  console.log(`AI found valid move: ${piece.name} to ${square.name}`);
                  break;
                } else {
                  if (targetCrossFaceSquare && square.name === targetCrossFaceSquare) {
                    console.log(`CROSS-FACE: FAILED - ${square.name} violates piece rules`);
                  }
                  console.log(`Move ${piece.name} to ${square.name} violates piece rules`);
                }
              } else {
                if (targetCrossFaceSquare && square.name === targetCrossFaceSquare) {
                  console.log(`CROSS-FACE: FAILED - Path to ${square.name} is blocked`);
                }
                console.log(`Path from ${piece.name} to ${square.name} is blocked`);
              }
            } else {
              if (targetCrossFaceSquare && square.name === targetCrossFaceSquare) {
                console.log(`CROSS-FACE: FAILED - ${square.name} is shadowed`);
              }
            }
          } else {
            if (targetCrossFaceSquare && square.name === targetCrossFaceSquare) {
              console.log(`CROSS-FACE: FAILED - ${square.name} is occupied`);
            }
          }
        }
        
        // If we found a valid move, stop trying other pieces
        if (pieceToMove && targetSquare) {
          break;
        }
        }
      }

      if (!pieceToMove || !targetSquare) {
        console.log("AI could not find any valid move with any piece");
        return;
      }

      // IMMEDIATELY update the piece position to reserve the square
      const oldPosition = this.gameState.piecePositions[pieceToMove.name];
      this.gameState.piecePositions[pieceToMove.name] = targetSquare.name;
      console.log(
        `Reserved square ${targetSquare.name} for ${pieceToMove.name}`
      );

      // Calculate position and rotation from the target square
      const targetPosition = targetSquare.position.clone();
      const targetRotation = targetSquare.rotation.clone();

      // Add the offset based on which board the square is on
      if (targetSquare.name.startsWith("b")) {
        targetPosition.y += 3.75;
      } else if (targetSquare.name.startsWith("y")) {
        targetPosition.x += 3.75;
      } else if (targetSquare.name.startsWith("g")) {
        targetPosition.z += 3.75;
      }

      // Execute the move
      gameFunctions.animatePieceMovement(
        pieceToMove,
        targetPosition,
        targetRotation,
        30,
        function () {
          console.log(
            "=== AI animation completed for",
            pieceToMove.name,
            "==="
          );

          // Add the move to history (this advances the turn)
          gameStateManager.addMoveToHistory(
            pieceToMove.name,
            oldPosition,
            targetSquare.name
          );
        }
      );
    },

    // Add this function inside the AI object, after executeSimpleMove
    isPathClear: function (pieceToMove, targetSquareName) {
      const startPos = this.gameState.piecePositions[pieceToMove.name];
      if (!startPos) return false;

      // Parse square coordinates (e.g., "b3-5" -> face: "b", row: 3, col: 5)
      const parseSquare = (squareName) => {
        const face = squareName[0];
        const coords = squareName.substring(1).split("-");
        return { face, row: parseInt(coords[0]), col: parseInt(coords[1]) };
      };

      const start = parseSquare(startPos);
      const target = parseSquare(targetSquareName);

      // Must be orthogonal move (same row OR same column, not both different)
      if (start.face !== target.face) {
        // Cross-face move - for now allow it (more complex validation needed)
        return true;
      }

      // Same face move - check path for blocking pieces
      const path = [];

      if (start.row === target.row) {
        // Moving along columns
        const minCol = Math.min(start.col, target.col);
        const maxCol = Math.max(start.col, target.col);
        for (let col = minCol + 1; col < maxCol; col++) {
          path.push(`${start.face}${start.row}-${col}`);
        }
      } else if (start.col === target.col) {
        // Moving along rows
        const minRow = Math.min(start.row, target.row);
        const maxRow = Math.max(start.row, target.row);
        for (let row = minRow + 1; row < maxRow; row++) {
          path.push(`${start.face}${row}-${start.col}`);
        }
      } else {
        // Not orthogonal move
        return false;
      }

      // Check if any piece is blocking the path (on same face)
      for (let pathSquare of path) {
        for (let [pieceName, piecePos] of Object.entries(
          this.gameState.piecePositions
        )) {
          if (piecePos === pathSquare) {
            console.log(`Path blocked by ${pieceName} at ${pathSquare}`);
            return false;
          }
        }
      }

      return true;
    },

    // Validate piece-specific movement rules
    isValidPieceMove: function(pieceToMove, targetSquareName) {
      const currentPos = this.gameState.piecePositions[pieceToMove.name];
      
      // Validate based on piece type
      if (pieceToMove.name.includes('Owl')) {
        return validateOwlMove(currentPos, targetSquareName);
      } else if (pieceToMove.name.includes('Kite')) {
        return validateKiteMove(currentPos, targetSquareName);
      } else if (pieceToMove.name.includes('Raven')) {
        return validateRavenMove(currentPos, targetSquareName);
      }
      
      return false; // Unknown piece type
    },

    // Prioritize cross-face moves when piece is on edge
    prioritizeCrossFaceMoves: function(boardSquares, currentPos) {
      if (!currentPos) return [...boardSquares].sort(() => Math.random() - 0.5);
      
      const face = currentPos[0];
      const coords = currentPos.substring(1).split('-');
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);
      
      // Only attempt cross-face moves from edges that connect through the center convergence
      // The nest (b7-7, y7-7, g7-7) is where all three faces meet at 90° angles
      // Cross-face moves are only possible along edges radiating from this convergence point
      let targetCrossFaceSquare = null;
      
      // Correct cross-face mappings based on actual geometry:
      // g5-7 → y7-5, y3-7 → b7-3, b7-4 → y4-7, b3-7 → g7-3
      
      if (face === 'g' && col === 7) {
        // Green col=7 → Yellow row=7: g5-7 → y7-5 (coordinates flip)
        targetCrossFaceSquare = `y7-${row}`;
      } else if (face === 'y' && col === 7) {
        // Yellow col=7 → Brown row=7: y3-7 → b7-3 (coordinates flip)  
        targetCrossFaceSquare = `b7-${row}`;
      } else if (face === 'b' && row === 7) {
        // Brown row=7 → Yellow col=7: b7-4 → y4-7 (coordinates flip)
        targetCrossFaceSquare = `y${col}-7`;
      } else if (face === 'b' && col === 7) {
        // Brown col=7 → Green row=7: b3-7 → g7-3 (coordinates flip)
        targetCrossFaceSquare = `g7-${row}`;
      }
      
      if (targetCrossFaceSquare) {
        console.log(`${currentPos} can cross to ${targetCrossFaceSquare} - prioritizing this move`);
        
        // Find the specific target square and put it first
        const targetSquare = boardSquares.find(square => square.name === targetCrossFaceSquare);
        const otherSquares = boardSquares.filter(square => square.name !== targetCrossFaceSquare);
        
        if (targetSquare) {
          // Put the specific cross-face target first, then shuffle the rest
          console.log(`Found target square ${targetCrossFaceSquare} - putting it first`);
          return {
            squares: [targetSquare, ...otherSquares.sort(() => Math.random() - 0.5)],
            targetCrossFace: targetCrossFaceSquare
          };
        } else {
          console.log(`Target square ${targetCrossFaceSquare} NOT FOUND in boardSquares`);
          return {
            squares: [...boardSquares].sort(() => Math.random() - 0.5),
            targetCrossFace: targetCrossFaceSquare
          };
        }
      }
      
      // If no cross-face target, just shuffle normally
      return {
        squares: [...boardSquares].sort(() => Math.random() - 0.5),
        targetCrossFace: null
      };
    },

    // Explore orthogonal paths from current position like a human player would
    exploreOrthogonalPaths: function(currentPos, pieceName) {
      if (!currentPos) return [];
      
      const face = currentPos[0];
      const coords = currentPos.substring(1).split('-');
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);
      
      console.log(`Exploring orthogonal paths from ${currentPos} for ${pieceName}`);
      
      const validDestinations = [];
      
      // Explore in 4 orthogonal directions
      const directions = [
        { name: 'north', deltaRow: -1, deltaCol: 0 },
        { name: 'south', deltaRow: 1, deltaCol: 0 },
        { name: 'east', deltaRow: 0, deltaCol: 1 },
        { name: 'west', deltaRow: 0, deltaCol: -1 }
      ];
      
      for (const direction of directions) {
        console.log(`Exploring ${direction.name} from ${currentPos} for ${pieceName}`);
        
        let currentRow = row;
        let currentCol = col;
        let currentFace = face;
        const pathDestinations = []; // Store all valid destinations in this direction
        
        // Step along this direction until blocked or max distance reached
        for (let step = 1; step <= 13; step++) { // Max 13 steps (across faces)
          currentRow += direction.deltaRow;
          currentCol += direction.deltaCol;
          
          // Check if we've gone off the current face
          if (currentRow < 1 || currentRow > 7 || currentCol < 1 || currentCol > 7) {
            // Get the last valid position on this face before crossing
            const lastValidRow = currentRow - direction.deltaRow;
            const lastValidCol = currentCol - direction.deltaCol;
            console.log(`Hit edge at ${currentFace}${lastValidRow}-${lastValidCol}, attempting cross-face`);
            
            // Try to cross to adjacent face if we're on a connecting edge
            const crossFaceResult = this.attemptFaceCrossing(currentFace, lastValidRow, lastValidCol, direction);
            if (crossFaceResult) {
              currentFace = crossFaceResult.face;
              currentRow = crossFaceResult.row;
              currentCol = crossFaceResult.col;
              console.log(`SUCCESS: Crossed to ${currentFace}${currentRow}-${currentCol}`);
            } else {
              console.log(`FAILED: No cross-face path from ${currentFace}${lastValidRow}-${lastValidCol} in ${direction.name}`);
              break; // Can't continue in this direction
            }
          }
          
          const targetSquare = `${currentFace}${currentRow}-${currentCol}`;
          
          // Check if this square is occupied
          const isOccupied = Object.values(this.gameState.piecePositions || {}).includes(targetSquare);
          if (isOccupied) {
            console.log(`Path blocked at ${targetSquare}`);
            break; // Path blocked
          }
          
          // Check if this is a nest square (only Owls can land there, and only to win)
          const isNestSquare = targetSquare.endsWith('7-7');
          if (isNestSquare) {
            console.log(`${targetSquare} is nest - stopping exploration in this direction`);
            // Stop exploring in this direction when we hit the nest
            break;
          }
          
          // Check if this square is shadowed (excluding the moving piece)
          this.gameState.updateShadowedRows(pieceName);
          let isShadowed = false;
          for (const color in this.gameState.shadowedRows) {
            const shadowedCubes = this.gameState.shadowedRows[color];
            if (shadowedCubes.includes(targetSquare)) {
              isShadowed = true;
              break;
            }
          }
          
          if (!isShadowed) {
            // Also validate against piece-specific rules
            const pieceValidation = this.isValidPieceMove({ name: pieceName }, targetSquare);
            if (pieceValidation) {
              // TEMPORARILY ALLOW ALL MOVES FOR DEBUGGING
              pathDestinations.push({ square: targetSquare, distance: step });
              console.log(`Valid destination: ${targetSquare} (distance: ${step}) - Face: ${currentFace} vs Start: ${currentPos[0]}`);
              if (currentFace !== currentPos[0]) {
                console.log(`*** CROSS-FACE MOVE FOUND: ${currentPos} → ${targetSquare} ***`);
              }
            } else {
              console.log(`${targetSquare} violates piece rules for ${pieceName} (${currentPos} → ${targetSquare})`);
            }
          } else {
            console.log(`${targetSquare} is shadowed`);
          }
          // Continue path exploration even if shadowed (for passing through)
        }
        
        // Prefer longer moves - add destinations with EXTREME distance weighting
        for (const dest of pathDestinations) {
          // Much more extreme bias toward longer moves
          let weight;
          if (dest.distance === 1) {
            weight = 1; // Short moves get minimal weight
          } else if (dest.distance >= 4) {
            weight = 50; // Long moves get massive weight
          } else {
            weight = dest.distance * dest.distance * 3; // Medium moves get squared weight
          }
          
          // Extra bonus for cross-face moves
          const startFace = currentPos[0];
          const destFace = dest.square[0];
          if (startFace !== destFace) {
            weight *= 10; // 10x bonus for cross-face moves!
            console.log(`CROSS-FACE BONUS: ${dest.square} gets ${weight} weight`);
          }
          
          for (let i = 0; i < weight; i++) {
            validDestinations.push(dest.square);
          }
        }
      }
      
      console.log(`Found ${validDestinations.length} valid destinations:`, validDestinations);
      return validDestinations;
    },

    // Attempt to cross from one face to another when hitting an edge
    attemptFaceCrossing: function(fromFace, edgeRow, edgeCol, direction) {
      console.log(`DEBUG: attemptFaceCrossing(${fromFace}, ${edgeRow}, ${edgeCol}, ${direction.name})`);
      
      // Only allow crossing from connecting edges (row=7 or col=7)
      if (fromFace === 'b' && edgeRow === 7) {
        // Brown row=7 can cross to Yellow col=7
        console.log(`DEBUG: Brown row=7 crossing to Yellow col=7`);
        return { face: 'y', row: edgeCol, col: 7 };
      }
      if (fromFace === 'b' && edgeCol === 7) {
        // Brown col=7 can cross to Green row=7  
        console.log(`DEBUG: Brown col=7 crossing to Green row=7`);
        return { face: 'g', row: 7, col: edgeRow };
      }
      if (fromFace === 'y' && edgeRow === 7) {
        // Yellow row=7 can cross to Green col=7
        console.log(`DEBUG: Yellow row=7 crossing to Green col=7`);
        return { face: 'g', row: edgeCol, col: 7 };
      }
      if (fromFace === 'y' && edgeCol === 7) {
        // Yellow col=7 can cross to Brown row=7
        console.log(`DEBUG: Yellow col=7 crossing to Brown row=7`);
        return { face: 'b', row: 7, col: edgeRow };
      }
      if (fromFace === 'g' && edgeRow === 7) {
        // Green row=7 can cross to Brown col=7 or Yellow row=7
        // For simplicity, prefer Brown
        console.log(`DEBUG: Green row=7 crossing to Brown col=7`);
        return { face: 'b', row: edgeCol, col: 7 };
      }
      if (fromFace === 'g' && edgeCol === 7) {
        // Green col=7 can cross to Yellow row=7
        console.log(`DEBUG: Green col=7 crossing to Yellow row=7`);
        return { face: 'y', row: 7, col: edgeRow };
      }
      
      console.log(`DEBUG: No crossing possible from ${fromFace}${edgeRow}-${edgeCol}`);
      return null; // No crossing possible
    },

    // Get adjacent orthogonal squares for Owl movement (one square only)
    getAdjacentSquares: function(currentPos) {
      if (!currentPos) return [];
      
      const face = currentPos[0];
      const coords = currentPos.substring(1).split('-');
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);
      
      const adjacent = [];
      
      // Same face adjacent squares
      const directions = [
        { deltaRow: -1, deltaCol: 0 }, // north
        { deltaRow: 1, deltaCol: 0 },  // south
        { deltaRow: 0, deltaCol: 1 },  // east
        { deltaRow: 0, deltaCol: -1 }  // west
      ];
      
      for (const direction of directions) {
        const newRow = row + direction.deltaRow;
        const newCol = col + direction.deltaCol;
        
        // Same face move
        if (newRow >= 1 && newRow <= 7 && newCol >= 1 && newCol <= 7) {
          adjacent.push(`${face}${newRow}-${newCol}`);
        }
        // Cross-face move (only from connecting edges)
        else {
          const crossFaceResult = this.attemptFaceCrossing(face, row, col, direction);
          if (crossFaceResult) {
            adjacent.push(`${crossFaceResult.face}${crossFaceResult.row}-${crossFaceResult.col}`);
          }
        }
      }
      
      return adjacent;
    },
  };
}
