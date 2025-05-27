export function createAI(scene, gameStateManager, gameFunctions) {
  return {
    // Main function called when it's an AI's turn
    makeMove: function (playerColor) {
      console.log(`AI (${playerColor}) is thinking...`);

      // Add 2 second delay to feel natural
      setTimeout(() => {
        console.log(`AI (${playerColor}) making move...`);
        this.executeSimpleMove(playerColor);
      }, 2000);
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
        // Check if square is empty (no piece occupying it)
        const isOccupied = scene.meshes.some((mesh) => {
          if (
            !mesh.name.endsWith("Owl") &&
            !mesh.name.endsWith("Kite") &&
            !mesh.name.endsWith("Raven")
          ) {
            return false;
          }

          // Calculate expected position for this square
          let expectedPos = square.position.clone();
          if (square.name.startsWith("b")) expectedPos.y += 3.75;
          else if (square.name.startsWith("y")) expectedPos.x += 3.75;
          else if (square.name.startsWith("g")) expectedPos.z += 3.75;

          return mesh.position.equals(expectedPos);
        });

        if (!isOccupied) {
          // Also check if the square is shadowed
          const isShadowed = gameFunctions.isMoveCollidingWithShadowedRows(
            square.name,
            pieceToMove.name
          );

          if (!isShadowed) {
            targetSquare = square;
            console.log(`Found empty, non-shadowed square: ${square.name}`);
            break;
          } else {
            console.log(`Square ${square.name} is shadowed`);
          }
        } else {
          console.log(`Square ${square.name} is occupied`);
        }
      }

      if (!targetSquare) {
        console.log("AI could not find valid move");
        return;
      }

      console.log(`AI targeting empty square: ${targetSquare.name}`);

      // Calculate position and rotation from the target square
      const targetPosition = targetSquare.position.clone();
      const targetRotation = targetSquare.rotation.clone();

      // Add the offset based on which board the square is on
      if (targetSquare.name.startsWith("b")) {
        targetPosition.y += 3.75; // Brown board offset
      } else if (targetSquare.name.startsWith("y")) {
        targetPosition.x += 3.75; // Yellow board offset
      } else if (targetSquare.name.startsWith("g")) {
        targetPosition.z += 3.75; // Green board offset
      }

      // Execute the move
      gameFunctions.animatePieceMovement(
        pieceToMove,
        targetPosition,
        targetRotation,
        30,
        function () {
          console.log("AI move completed");
        }
      );
    },

    // Future functions:
    // evaluatePosition()
    // findValidMoves()
    // selectBestMove()
    // etc.
  };
}
