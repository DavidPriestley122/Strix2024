// ANIMATIONS MODULE
// Handles all piece movement and capture animations

import { Animation, CubicEase, EasingFunction, Vector3 } from "@babylonjs/core";
import { GAME_CONFIG } from "../../config/gameConfig.js";

export function animatePieceMovement(
  piece,
  targetPosition,
  targetRotation,
  duration = GAME_CONFIG.ANIMATION.PIECE_MOVEMENT_DURATION,
  onAnimationEnd = null
) {
  const easingFunction = new CubicEase();
  easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

  Animation.CreateAndStartAnimation(
    "pieceAnimation",
    piece,
    "position",
    GAME_CONFIG.ANIMATION.PIECE_MOVEMENT_FPS,
    duration,
    piece.position,
    targetPosition,
    0,
    easingFunction,
    onAnimationEnd
  );
  
  Animation.CreateAndStartAnimation(
    "pieceRotationAnimation",
    piece,
    "rotation",
    GAME_CONFIG.ANIMATION.PIECE_MOVEMENT_FPS,
    duration,
    piece.rotation,
    targetRotation,
    0,
    easingFunction
  );
}

export function calculateTargetPosition(cube, boardFace) {
  const offsetVector = getOffsetVectorForBoardFace(boardFace);
  return cube.position.clone().addInPlace(offsetVector);
}

export function getOffsetVectorForBoardFace(boardFace) {
  switch (boardFace) {
    case 'b':
      return new Vector3(
        GAME_CONFIG.PIECE_OFFSETS.BROWN.x,
        GAME_CONFIG.PIECE_OFFSETS.BROWN.y,
        GAME_CONFIG.PIECE_OFFSETS.BROWN.z
      );
    case 'y':
      return new Vector3(
        GAME_CONFIG.PIECE_OFFSETS.YELLOW.x,
        GAME_CONFIG.PIECE_OFFSETS.YELLOW.y,
        GAME_CONFIG.PIECE_OFFSETS.YELLOW.z
      );
    case 'g':
      return new Vector3(
        GAME_CONFIG.PIECE_OFFSETS.GREEN.x,
        GAME_CONFIG.PIECE_OFFSETS.GREEN.y,
        GAME_CONFIG.PIECE_OFFSETS.GREEN.z
      );
    default:
      return new Vector3(0, 0, 0);
  }
}

export function getOwlHallaOffsetForPiece(pieceName) {
  if (pieceName.startsWith("brown")) {
    return new Vector3(
      GAME_CONFIG.OWL_HALLA_OFFSETS.BROWN.x,
      GAME_CONFIG.OWL_HALLA_OFFSETS.BROWN.y,
      GAME_CONFIG.OWL_HALLA_OFFSETS.BROWN.z
    );
  } else if (pieceName.startsWith("yellow")) {
    return new Vector3(
      GAME_CONFIG.OWL_HALLA_OFFSETS.YELLOW.x,
      GAME_CONFIG.OWL_HALLA_OFFSETS.YELLOW.y,
      GAME_CONFIG.OWL_HALLA_OFFSETS.YELLOW.z
    );
  } else if (pieceName.startsWith("green")) {
    return new Vector3(
      GAME_CONFIG.OWL_HALLA_OFFSETS.GREEN.x,
      GAME_CONFIG.OWL_HALLA_OFFSETS.GREEN.y,
      GAME_CONFIG.OWL_HALLA_OFFSETS.GREEN.z
    );
  }
  return new Vector3(0, 0, 0);
}

export function animateCapturedPieceToOwlHalla(scene, pieceName, getOwlHallaCubeName, getPositionFromOwlHallaCubeName, updatePiecesArrivingOnOwlHalla, gameStateManager, owlHallaCubes) {
  console.log(`🎯 Animating captured piece ${pieceName} to Owl Halla`);
  
  const piece3D = scene.getMeshByName(pieceName);
  if (!piece3D) {
    console.log(`❌ Could not find 3D piece: ${pieceName}`);
    return;
  }

  const owlHallaCubeName = getOwlHallaCubeName(pieceName);
  if (!owlHallaCubeName) {
    console.log(`❌ Could not determine Owl Halla cube for: ${pieceName}`);
    return;
  }

  const owlHallaPosition = getPositionFromOwlHallaCubeName(owlHallaCubeName);
  if (!owlHallaPosition) {
    console.log(`❌ Could not get Owl Halla position for: ${owlHallaCubeName}`);
    return;
  }

  // Apply the offset based on the color of the piece
  const offset = getOwlHallaOffsetForPiece(pieceName);
  owlHallaPosition.add(offset);

  const owlHallaCube = scene.getMeshByName(owlHallaCubeName);
  const targetRotation = owlHallaCube ? owlHallaCube.rotation.clone() : piece3D.rotation.clone();

  console.log(`📍 Animating ${pieceName} to Owl Halla position:`, owlHallaPosition);

  // Animate the piece to Owl Halla
  animatePieceMovement(
    piece3D,
    owlHallaPosition,
    targetRotation,
    GAME_CONFIG.ANIMATION.CAPTURE_ANIMATION_DURATION,
    () => {
      console.log(`✅ ${pieceName} arrived at Owl Halla`);
      
      // Update piece position to Owl Halla cube name
      gameStateManager.updatePiecePosition(pieceName, owlHallaCubeName);
      
      // Add to pieces on Owl Halla array
      updatePiecesArrivingOnOwlHalla(pieceName);
      
      // Set visibility based on current Owl Halla visibility state
      const owlHallaVisible = owlHallaCubes[0].visibility;
      piece3D.visibility = owlHallaVisible;
      
      console.log(`🎭 Set ${pieceName} visibility to ${owlHallaVisible} (matching Owl Halla state)`);
    }
  );
}