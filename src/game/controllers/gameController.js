// GAME CONTROLLER MODULE
// Coordinates game flow, validation, and state management

import { GAME_CONFIG } from "../../config/gameConfig.js";
import { animatePieceMovement, getOffsetVectorForBoardFace } from "../rendering/animations.js";

export function createGameController(dependencies) {
  const { 
    scene, 
    gameStateManager, 
    cubesOnTheThreeFaces,
    animateCapturedPieceToOwlHalla,
    getOwlHallaCubeName,
    getPositionFromOwlHallaCubeName,
    updatePiecesArrivingOnOwlHalla,
    owlHallaCubes
  } = dependencies;

  return {
    // PIECE POSITIONING
    setPiecePosition(piece, cubesOnTheThreeFaces, name, offsetX, offsetY, offsetZ) {
      const cube = cubesOnTheThreeFaces.find((cube) => cube.name === name);
      piece.position = cube.position
        .clone()
        .add(new Vector3(offsetX, offsetY, offsetZ));
      piece.rotation = cube.rotation.clone();
    },

    initializePiecePositions(pieces, cubesOnTheThreeFaces) {
      const { brownOwl, brownKite, brownRaven, yellowOwl, yellowKite, yellowRaven, greenOwl, greenKite, greenRaven } = pieces;
      
      this.setPiecePosition(brownOwl, cubesOnTheThreeFaces, "b7-1", 0, 3.75, 0);
      this.setPiecePosition(brownKite, cubesOnTheThreeFaces, "b6-2", 0, 3.75, 0);
      this.setPiecePosition(brownRaven, cubesOnTheThreeFaces, "b5-3", 0, 3.75, 0);
      this.setPiecePosition(yellowOwl, cubesOnTheThreeFaces, "y7-1", 3.75, 0, 0);
      this.setPiecePosition(yellowKite, cubesOnTheThreeFaces, "y6-2", 3.75, 0, 0);
      this.setPiecePosition(yellowRaven, cubesOnTheThreeFaces, "y5-3", 3.75, 0, 0);
      this.setPiecePosition(greenOwl, cubesOnTheThreeFaces, "g7-1", 0, 0, 3.75);
      this.setPiecePosition(greenKite, cubesOnTheThreeFaces, "g6-2", 0, 0, 3.75);
      this.setPiecePosition(greenRaven, cubesOnTheThreeFaces, "g5-3", 0, 0, 3.75);
    },

    // MOVE VALIDATION
    validateMove(pieceName, fromSquare, toSquare) {
      console.log(`🔍 Validating move: ${pieceName} from ${fromSquare} to ${toSquare}`);
      
      // Find the piece in 3D scene
      const piece3D = scene.getMeshByName(pieceName);
      if (!piece3D) {
        return { valid: false, reason: `Piece ${pieceName} not found in scene` };
      }
      
      // Check if piece is at the claimed starting position
      const actualPosition = gameStateManager.piecePositions[pieceName];
      if (actualPosition !== fromSquare) {
        return { valid: false, reason: `${pieceName} is not at ${fromSquare} (actually at ${actualPosition})` };
      }
      
      // Check if piece is captured
      if (actualPosition === "captured") {
        return { valid: false, reason: `${pieceName} is captured and cannot move` };
      }
      
      // Find the target cube
      const targetCube = cubesOnTheThreeFaces.find(cube => cube.name === toSquare.replace(/(\d)(\d)$/, '$1-$2'));
      if (!targetCube) {
        return { valid: false, reason: `Target square ${toSquare} not found on board` };
      }
      
      // Check if target is an Owl Halla cube
      if (targetCube.name.endsWith("--1")) {
        return { valid: false, reason: `Cannot move to Owl Halla square ${toSquare}` };
      }
      
      // Check if target square is already occupied
      const occupyingPiece = scene.meshes.find((mesh) => {
        return (
          mesh !== piece3D &&
          (mesh.name.endsWith("Owl") ||
            mesh.name.endsWith("Kite") ||
            mesh.name.endsWith("Raven")) &&
          mesh.position.x.toFixed(2) ===
            (
              targetCube.position.x +
              (targetCube.name.startsWith("y") ? 3.75 : 0)
            ).toFixed(2) &&
          mesh.position.y.toFixed(2) ===
            (
              targetCube.position.y +
              (targetCube.name.startsWith("b") ? 3.75 : 0)
            ).toFixed(2) &&
          mesh.position.z.toFixed(2) ===
            (
              targetCube.position.z +
              (targetCube.name.startsWith("g") ? 3.75 : 0)
            ).toFixed(2)
        );
      });
      
      if (occupyingPiece) {
        return { valid: false, reason: `Square ${toSquare} is already occupied by ${occupyingPiece.name}` };
      }
      
      // Check shadowing rules
      gameStateManager.updateShadowedRows(pieceName);
      if (this.isMoveCollidingWithShadowedRows(targetCube.name, piece3D)) {
        return { valid: false, reason: `Square ${toSquare} is shadowed and cannot be moved to` };
      }
      
      console.log(`✅ Move validation passed for ${pieceName}: ${fromSquare} → ${toSquare}`);
      return { valid: true, reason: "Move is valid" };
    },

    // SHADOWING LOGIC
    isMoveCollidingWithShadowedRows(targetCube, selectedPiece) {
      // Update shadowed rows excluding the selected piece
      gameStateManager.updateShadowedRows(selectedPiece.name);
      // Iterate through each color in the shadowed rows
      for (const color in gameStateManager.shadowedRows) {
        const shadowedCubes = gameStateManager.shadowedRows[color];
        // Check if the target cube is in the shadowed rows for the current color
        if (shadowedCubes.includes(targetCube)) {
          return true;
        }
      }
      return false;
    },

    // CAPTURE DETECTION
    getAdjacentSquaresForCapture(square) {
      const face = square[0];
      const coords = square.substring(1).split("-");
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
          adjacent.push(`${face}${newRow}-${newCol}`);
        }
      }
      
      return adjacent;
    },

    findPieceAtSquareForCapture(square, piecePositions) {
      for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
        if (piecePos === square && piecePos !== "captured") {
          return pieceName;
        }
      }
      return null;
    },

    // POSITION UTILITIES
    getPositionFromCubeName(cubeName) {
      const cube = scene.getMeshByName(cubeName);
      if (cube) {
        const position = cube.position.clone();
        console.log(`🔧 getPositionFromCubeName(${cubeName}): cube position =`, position);
        
        // Add the offset based on which board the cube is on
        const boardFace = cubeName[0];
        console.log(`🔧 getPositionFromCubeName: boardFace = ${boardFace}`);
        
        const offsetVector = getOffsetVectorForBoardFace(boardFace);
        
        // Use addInPlace() to modify the vector in-place (Babylon.js 7.x behavior)
        position.addInPlace(offsetVector);
        
        return position;
      }
      return new Vector3(0, 0, 0);
    },

    getRotationFromCubeName(cubeName) {
      const cube = scene.getMeshByName(cubeName);
      return cube ? cube.rotation.clone() : new Vector3(0, 0, 0);
    },

    // PIECE ANIMATION COORDINATION
    animatePieceToPosition(piece, targetPosition, targetRotation, onComplete) {
      animatePieceMovement(
        piece,
        targetPosition,
        targetRotation,
        GAME_CONFIG.ANIMATION.PIECE_MOVEMENT_DURATION,
        onComplete
      );
    },

    // CAPTURE HANDLING
    handlePieceCapture(pieceName) {
      console.log(`🏰 Using game controller logic to move ${pieceName} to Owl Halla`);
      
      // Use the passed-in capture handling function (now handlePieceDoubleClickForCapture)
      animateCapturedPieceToOwlHalla(pieceName);
    },

    // GAME STATE COORDINATION
    processMove(selectedPiece, targetCube, onMoveComplete) {
      const boardFace = targetCube.name[0];
      const offsetVector = getOffsetVectorForBoardFace(boardFace);
      
      // Calculate the target position and rotation for the selected piece
      const targetPosition = targetCube.position.clone().add(offsetVector);
      const targetRotation = targetCube.rotation.clone();

      // Store the current position before the move
      const currentPosition = gameStateManager.piecePositions[selectedPiece.name];

      // Animate the selected piece movement
      this.animatePieceToPosition(
        selectedPiece,
        targetPosition,
        targetRotation,
        () => {
          // Update the position of the moved piece in gameStateManager.piecePositions
          gameStateManager.piecePositions[selectedPiece.name] = targetCube.name;
          
          if (onMoveComplete) {
            onMoveComplete(currentPosition, targetCube.name);
          }
        }
      );
    }
  };
}

import { Vector3 } from "@babylonjs/core";