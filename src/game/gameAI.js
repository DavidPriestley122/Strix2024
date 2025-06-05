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

      // Pick the first piece
      const pieceToMove = playerPieces[0];
      console.log(`AI selected piece: ${pieceToMove.name}`);

      // Find all board squares
      const boardSquares = scene.meshes.filter(
        (mesh) =>
          (mesh.name.startsWith("b") ||
            mesh.name.startsWith("y") ||
            mesh.name.startsWith("g")) &&
          mesh.name.includes("-") &&
          !mesh.name.includes("--")
      );

      // Find a valid destination square
      let targetSquare = null;
      for (let square of boardSquares) {
        // Check if square is occupied by looking at gameStateManager.piecePositions
        const isOccupied = Object.values(
          this.gameState.piecePositions || {}
        ).includes(square.name);

        if (!isOccupied) {
          // Also check if the square is shadowed
          const isShadowed = gameFunctions.isMoveCollidingWithShadowedRows(
            square.name,
            pieceToMove.name
          );

          if (!isShadowed) {
            // NEW: Check if path is clear
            if (this.isPathClear(pieceToMove, square.name)) {
              targetSquare = square;
              console.log(`AI found valid square: ${square.name}`);
              break;
            } else {
              console.log(`Path to ${square.name} is blocked`);
            }
          }
        }
      }

      // Fallback: find any empty square if no non-shadowed squares available
      if (!targetSquare) {
        console.log(
          "AI could not find non-shadowed move - trying any empty square"
        );
        for (let square of boardSquares) {
          const isOccupied = Object.values(
            this.gameState.piecePositions || {}
          ).includes(square.name);
          if (!isOccupied) {
            targetSquare = square;
            console.log(`AI found fallback square: ${square.name}`);
            break;
          }
        }
      }

      if (!targetSquare) {
        console.log("AI could not find any valid move");
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
  };
}
