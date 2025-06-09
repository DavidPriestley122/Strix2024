import { validateOwlMove } from './rules/pieces/owlRules.js';
import { validateKiteMove } from './rules/pieces/kiteRules.js';
import { validateRavenMove } from './rules/pieces/ravenRules.js';

export function createAI(scene, gameStateManager, gameFunctions) {
  return {
    gameState: gameStateManager,

    makeMove: function (playerColor) {
      setTimeout(() => {
        if (!this.gameState.aiGameRunning || this.gameState.aiGamePaused) {
          return;
        }
        this.executeSimpleMove(playerColor);
      }, 2000);
    },

    executeSimpleMove: function (playerColor) {
      // Find all pieces belonging to this player
      const playerPieces = scene.meshes.filter(
        (mesh) =>
          mesh.name.startsWith(playerColor) &&
          (mesh.name.endsWith("Owl") ||
            mesh.name.endsWith("Kite") ||
            mesh.name.endsWith("Raven"))
      );

      if (playerPieces.length === 0) {
        return;
      }

      // Round-robin: give all pieces equal chance to move
      const shuffledPieces = [...playerPieces].sort(() => Math.random() - 0.5);
      let pieceToMove = null;
      let targetSquare = null;
      
      for (let piece of shuffledPieces) {
        const currentPos = this.gameState.piecePositions[piece.name];
        
        // For Kites and Ravens, find all orthogonal moves
        if (piece.name.includes('Kite') || piece.name.includes('Raven')) {
          const orthogonalMoves = this.findOrthogonalMoves(currentPos, piece.name);
          if (orthogonalMoves.length > 0) {
            // Pick a random valid orthogonal move
            const chosenMove = orthogonalMoves[Math.floor(Math.random() * orthogonalMoves.length)];
            targetSquare = scene.meshes.find(mesh => mesh.name === chosenMove);
            if (targetSquare) {
              pieceToMove = piece;
              break;
            }
          }
        }
        
        // For Owls, prioritize ghosting moves if available
        if (piece.name.includes('Owl')) {
          const orthogonalMoves = this.findOrthogonalMoves(currentPos, piece.name);
          
          if (orthogonalMoves.length > 0) {
            // Separate ghosting moves from regular moves
            const ghostingMoves = [];
            const regularMoves = [];
            
            for (const move of orthogonalMoves) {
              // Ghosting move = different face than current position
              if (move[0] !== currentPos[0]) {
                ghostingMoves.push(move);
              } else {
                regularMoves.push(move);
              }
            }
            
            // Prioritize ghosting moves if available
            let chosenMove;
            if (ghostingMoves.length > 0) {
              console.log(`GHOSTING AVAILABLE: ${piece.name} at ${currentPos} can ghost to:`, ghostingMoves);
              chosenMove = ghostingMoves[Math.floor(Math.random() * ghostingMoves.length)];
            } else {
              chosenMove = regularMoves[Math.floor(Math.random() * regularMoves.length)];
            }
            
            targetSquare = scene.meshes.find(mesh => mesh.name === chosenMove);
            if (targetSquare) {
              pieceToMove = piece;
              break;
            }
          }
        }
      }

      if (!pieceToMove || !targetSquare) {
        return;
      }

      this.executeMoveDirectly(pieceToMove, targetSquare);
    },

    executeMoveDirectly: function(piece, targetSquare) {
      // Execute the move
      const oldPosition = this.gameState.piecePositions[piece.name];
      this.gameState.piecePositions[piece.name] = targetSquare.name;

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
        piece,
        targetPosition,
        targetRotation,
        30,
        function () {
          gameStateManager.addMoveToHistory(
            piece.name,
            oldPosition,
            targetSquare.name
          );
        }
      );
    },

    // Find moves along the 2 orthogonal routes from current position
    findOrthogonalMoves: function(currentPos, pieceName) {
      if (!currentPos) return [];
      
      const face = currentPos[0];
      const coords = currentPos.substring(1).split('-');
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);
      
      const possibleMoves = [];
      
      // Route 1: Fixed row, varying column (crosses faces via row edges)
      const route1 = this.generateRoute(face, row, 'row');
      
      // Route 2: Fixed column, varying row (crosses faces via column edges)  
      const route2 = this.generateRoute(face, col, 'column');
      
      // Combine both routes, excluding current position
      const allRouteSquares = [...route1, ...route2].filter(square => square !== currentPos);
      
      // Filter for valid moves
      for (const square of allRouteSquares) {
        if (this.isValidMove(square, pieceName)) {
          possibleMoves.push(square);
        }
      }
      
      return possibleMoves;
    },

    // Generate a complete 14-square route
    generateRoute: function(startFace, lineNumber, lineType) {
      const route = [];
      
      if (lineType === 'row') {
        // Fixed row route: crosses via row=7 edges
        // Generate squares on starting face
        for (let col = 1; col <= 7; col++) {
          route.push(`${startFace}${lineNumber}-${col}`);
        }
        
        // Cross to next face: Brown row→Green, Yellow row→Brown, Green row→Yellow
        const nextFace = this.getRowCrossFace(startFace);
        for (let col = 7; col >= 1; col--) {
          route.push(`${nextFace}${col}-${lineNumber}`);
        }
      } else {
        // Fixed column route: crosses via col=7 edges  
        // Generate squares on starting face
        for (let row = 1; row <= 7; row++) {
          route.push(`${startFace}${row}-${lineNumber}`);
        }
        
        // Cross to next face: Brown col→Yellow, Yellow col→Green, Green col→Brown
        const nextFace = this.getColCrossFace(startFace);
        for (let col = 7; col >= 1; col--) {
          route.push(`${nextFace}${lineNumber}-${col}`);
        }
      }
      
      return route;
    },

    getRowCrossFace: function(face) {
      // Row flightways: Brown→Green, Yellow→Brown, Green→Yellow
      const rowCrossing = { 'b': 'g', 'y': 'b', 'g': 'y' };
      return rowCrossing[face];
    },

    getColCrossFace: function(face) {
      // Column flightways: Brown→Yellow, Yellow→Green, Green→Brown
      const colCrossing = { 'b': 'y', 'y': 'g', 'g': 'b' };
      return colCrossing[face];
    },

    // Find a same-face move
    findSameFaceMove: function(currentPos, pieceName) {
      if (!currentPos) return null;
      
      const face = currentPos[0];
      const coords = currentPos.substring(1).split('-');
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);
      
      // Try basic orthogonal moves
      const testMoves = [
        `${face}${row+1}-${col}`,
        `${face}${row-1}-${col}`, 
        `${face}${row}-${col+1}`,
        `${face}${row}-${col-1}`,
        `${face}${row+2}-${col}`,
        `${face}${row}-${col+2}`,
        `${face}${row+3}-${col}`,
        `${face}${row}-${col+3}`
      ];
      
      for (const move of testMoves) {
        if (this.isValidMove(move, pieceName)) {
          return move;
        }
      }
      
      return null;
    },

    // Check if a move is valid
    isValidMove: function(targetSquare, pieceName) {
      const currentPos = this.gameState.piecePositions[pieceName];
      
      const moveCoords = targetSquare.substring(1).split('-');
      const moveRow = parseInt(moveCoords[0]);
      const moveCol = parseInt(moveCoords[1]);
      
      // Check bounds
      if (moveRow < 1 || moveRow > 7 || moveCol < 1 || moveCol > 7) {
        return false;
      }
      
      // Check not occupied
      const isOccupied = Object.values(this.gameState.piecePositions || {}).includes(targetSquare);
      if (isOccupied) {
        return false;
      }
      
      // Check not nest (except for owls)
      if (targetSquare.endsWith('7-7') && !pieceName.includes('Owl')) {
        return false;
      }
      
      // Check not shadowed
      this.gameState.updateShadowedRows(pieceName);
      for (const color in this.gameState.shadowedRows) {
        const shadowedCubes = this.gameState.shadowedRows[color];
        if (shadowedCubes.includes(targetSquare)) {
          return false;
        }
      }
      
      // Validate piece-specific rules
      if (pieceName.includes('Owl')) {
        return validateOwlMove(currentPos, targetSquare, this.gameState.piecePositions);
      } else if (pieceName.includes('Kite')) {
        return validateKiteMove(currentPos, targetSquare, this.gameState.piecePositions);
      } else if (pieceName.includes('Raven')) {
        return validateRavenMove(currentPos, targetSquare, this.gameState.piecePositions);
      }
      
      return false;
    }
  };
}