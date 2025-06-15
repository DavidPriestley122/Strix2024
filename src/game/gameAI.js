import {
  checkCrossAdjacency,
  calculateSimpleGhostingDestination,
} from "./rules/flightwayUtils.js";

// Make them globally available for console testing
window.checkCrossAdjacency = checkCrossAdjacency;
window.calculateSimpleGhostingDestination = calculateSimpleGhostingDestination;

import {
  validateOwlMove,
  getAllOwlMoves,
  getAdjacentSquares,
} from "./rules/owlRules.js";
import { validateKiteMove } from "./rules/kiteRules.js";
import { validateRavenMove } from "./rules/ravenRules.js";

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

      // PRIORITY: Try Owls first (they can ghost!)
      //const owls = playerPieces.filter((piece) => piece.name.includes("Owl"));
      const owls = []; // Force empty so fallback logic runs
      let pieceToMove = null;
      let targetSquare = null;

      for (let owl of owls) {
        const currentPos = this.gameState.piecePositions[owl.name];

        // Use the new function that includes both regular and ghosting moves

        /*// Get all possible moves, then filter through isValidMove
        const allPossibleMoves = getAllOwlMoves(
          currentPos,
          this.gameState.piecePositions
        );
        const allValidMoves = allPossibleMoves.filter((move) =>
          this.isValidMove(move, owl.name)
        );
*/
        const allPossibleMoves = getAllOwlMoves(
          currentPos,
          this.gameState.piecePositions
        );
        console.log(`📋 getAllOwlMoves returned:`, allPossibleMoves);
        const allValidMoves = allPossibleMoves.filter((move) =>
          this.isValidMove(move, owl.name)
        );
        console.log(`✅ After validation:`, allValidMoves);

        if (allValidMoves.length > 0) {
          /* console.log(`${owl.name} at ${currentPos} has ${allValidMoves.length} valid moves:`, allValidMoves);
          
          // Separate ghosting from regular moves
          const regularMoves = getAdjacentSquares(currentPos);
          const ghostingMoves = allValidMoves.filter(move => !regularMoves.includes(move));
          
          if (ghostingMoves.length > 0) {
            console.log(`🦉 GHOSTING FOUND: ${owl.name} can ghost to:`, ghostingMoves);
            */
          console.log(
            `${owl.name} at ${currentPos} has ${allValidMoves.length} valid moves:`,
            allValidMoves
          );

          // Separate ghosting from regular moves
          const regularMoves = getAdjacentSquares(currentPos);

          console.log(`🔧 Regular moves for ${currentPos}:`, [...regularMoves]); // ADD THIS LINE

          const ghostingMoves = allValidMoves.filter(
            (move) => !regularMoves.includes(move)
          );

          console.log(`  Regular moves:`, [...regularMoves]);
          console.log(`  Ghosting moves:`, ghostingMoves);

          if (ghostingMoves.length > 0) {
            console.log(`🦉 GHOSTING FOUND: ${owl.name} can ghost to:`, [
              ...ghostingMoves,
            ]);

            // Prefer ghosting moves
            const chosenMove =
              ghostingMoves[Math.floor(Math.random() * ghostingMoves.length)];
            targetSquare = scene.meshes.find(
              (mesh) => mesh.name === chosenMove
            );
          } else {
            // Use regular moves if no ghosting available
            const chosenMove =
              allValidMoves[Math.floor(Math.random() * allValidMoves.length)];
            targetSquare = scene.meshes.find(
              (mesh) => mesh.name === chosenMove
            );
          }

          if (targetSquare) {
            pieceToMove = owl;
            break; // Found a move for this owl
          }
        }
      }

      // FALLBACK: If no owl moves available, try other pieces
      if (!pieceToMove) {
        /*const nonOwlPieces = playerPieces.filter(
          (piece) => !piece.name.includes("Owl")
        );
        */

        const nonOwlPieces = playerPieces; // Include all pieces for random selection

        const shuffledPieces = [...nonOwlPieces].sort(
          () => Math.random() - 0.5
        );

        for (let piece of shuffledPieces) {
          const currentPos = this.gameState.piecePositions[piece.name];

          // For Kites and Ravens, find all orthogonal moves
          const orthogonalMoves = this.findOrthogonalMoves(
            currentPos,
            piece.name
          );
          if (orthogonalMoves.length > 0) {
            const chosenMove =
              orthogonalMoves[
                Math.floor(Math.random() * orthogonalMoves.length)
              ];
            targetSquare = scene.meshes.find(
              (mesh) => mesh.name === chosenMove
            );
            if (targetSquare) {
              pieceToMove = piece;
              break;
            }
          }
        }
      }

      if (!pieceToMove || !targetSquare) {
        console.log(`No valid moves found for ${playerColor}`);
        return;
      }

      console.log(`AI moving ${pieceToMove.name} to ${targetSquare.name}`);
      this.executeMoveDirectly(pieceToMove, targetSquare);
    },

    executeMoveDirectly: function (piece, targetSquare) {
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
    findOrthogonalMoves: function (currentPos, pieceName) {
      if (!currentPos) return [];

      const face = currentPos[0];
      const coords = currentPos.substring(1).split("-");
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);

      const possibleMoves = [];

      // Route 1: Fixed row, varying column (crosses faces via row edges)
      const route1 = this.generateRoute(face, row, "row");

      // Route 2: Fixed column, varying row (crosses faces via column edges)
      const route2 = this.generateRoute(face, col, "column");

      // Combine both routes, excluding current position
      const allRouteSquares = [...route1, ...route2].filter(
        (square) => square !== currentPos
      );

      // Filter for valid moves
      for (const square of allRouteSquares) {
        if (this.isValidMove(square, pieceName)) {
          possibleMoves.push(square);
        }
      }

      return possibleMoves;
    },

    // Generate a complete 14-square route
    generateRoute: function (startFace, lineNumber, lineType) {
      const route = [];

      if (lineType === "row") {
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

    getRowCrossFace: function (face) {
      // Row flightways: Brown→Green, Yellow→Brown, Green→Yellow
      const rowCrossing = { b: "g", y: "b", g: "y" };
      return rowCrossing[face];
    },

    getColCrossFace: function (face) {
      // Column flightways: Brown→Yellow, Yellow→Green, Green→Brown
      const colCrossing = { b: "y", y: "g", g: "b" };
      return colCrossing[face];
    },

    // Check if a move is valid
    isValidMove: function (targetSquare, pieceName) {
      console.log(`🎯 Validating move: ${pieceName} to ${targetSquare}`);
      const currentPos = this.gameState.piecePositions[pieceName];

      const moveCoords = targetSquare.substring(1).split("-");
      const moveRow = parseInt(moveCoords[0]);
      const moveCol = parseInt(moveCoords[1]);

      // Check bounds
      if (moveRow < 1 || moveRow > 7 || moveCol < 1 || moveCol > 7) {
        return false;
      }

      // Check not occupied
      const isOccupied = Object.values(
        this.gameState.piecePositions || {}
      ).includes(targetSquare);
      console.log(`🔍 Checking ${targetSquare} - occupied: ${isOccupied}`);
      if (isOccupied) {
        console.log(`❌ Move blocked - ${targetSquare} is occupied`);
        return false;
      }

      // Check not nest (except for owls)
      if (targetSquare.endsWith("7-7") && !pieceName.includes("Owl")) {
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
      if (pieceName.includes("Owl")) {
        return validateOwlMove(
          currentPos,
          targetSquare,
          this.gameState.piecePositions
        );
      } else if (pieceName.includes("Kite")) {
        return validateKiteMove(
          currentPos,
          targetSquare,
          this.gameState.piecePositions
        );
      } else if (pieceName.includes("Raven")) {
        return validateRavenMove(
          currentPos,
          targetSquare,
          this.gameState.piecePositions
        );
      }

      return false;
    },
  };
}
