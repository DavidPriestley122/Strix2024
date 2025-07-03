// EVENT CONTROLLER MODULE
// Handles all user interactions, clicks, and input events

import { ActionManager, ExecuteCodeAction } from "@babylonjs/core";
import { checkRavenCaptureOpportunities } from "../rules/ravenRules.js";
import { GAME_CONFIG } from "../../config/gameConfig.js";

export function createEventController(dependencies) {
  const { 
    scene, 
    gameStateManager, 
    gameController,
    cubesOnTheThreeFaces,
    owlHallaCubes,
    piecesOnOwlHalla,
    originalPositions,
    getOwlHallaCubeName,
    getPositionFromOwlHallaCubeName,
    updatePiecesArrivingOnOwlHalla,
    updatePiecesLeavingOwlHalla
  } = dependencies;

  let selectedPiece = null;

  return {
    // BUTTON EVENT SETUP
    setupButtonListeners() {
      // Wait for DOM to be ready, then add button listeners
      setTimeout(() => {
        console.log("Adding button listeners after delay...");

        const startBtn = document.getElementById("start-ai-game");
        const pauseBtn = document.getElementById("pause-game");
        const resumeBtn = document.getElementById("resume-game");
        const resetBtn = document.getElementById("reset-game");

        console.log("Start button found:", startBtn !== null);
        console.log("Pause button found:", pauseBtn !== null);

        if (startBtn) {
          startBtn.addEventListener("click", () => {
            console.log("Start button clicked!");
            gameStateManager.startAIGame();
          });
          console.log("Start button listener added");
        }

        if (pauseBtn) {
          pauseBtn.addEventListener("click", () => {
            console.log("Pause button clicked!");
            gameStateManager.pauseAIGame();
          });
          console.log("Pause button listener added");
        }

        if (resumeBtn) {
          resumeBtn.addEventListener("click", () => {
            console.log("Resume button clicked!");
            gameStateManager.resumeAIGame();
          });
        }

        if (resetBtn) {
          resetBtn.addEventListener("click", () => {
            console.log("Reset button clicked!");
            gameStateManager.resetGame();
          });
        }
      }, GAME_CONFIG.TIMERS.BUTTON_LISTENER_DELAY);
    },

    // CUBE CLICK HANDLERS
    addCubeClickListener(clickedCube) {
      clickedCube.actionManager = new ActionManager(scene);
      clickedCube.actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          this.handleCubeClick(clickedCube);
        })
      );
    },

    handleCubeClick(clickedCube) {
      if (!selectedPiece) return;

      // Check if the clicked cube is an owlHalla cube
      if (clickedCube.name.endsWith("--1")) {
        return; // Do not allow piece movement to Owl Halla
      }

      // Check if the clicked cube already contains a piece
      const occupyingPiece = this.findOccupyingPiece(clickedCube);
      if (occupyingPiece) {
        gameStateManager.displayInfoMessage(
          "Destination square already occupied. Please choose another move."
        );
        selectedPiece = null;
        return;
      }

      // Check if the clicked cube is shadowed
      if (gameController.isMoveCollidingWithShadowedRows(clickedCube.name, selectedPiece)) {
        gameStateManager.displayInfoMessage(
          "The destination square is shadowed. Please choose another move."
        );
        selectedPiece = null;
        return;
      }

      // Process the move
      this.processPieceMove(selectedPiece, clickedCube);
    },

    findOccupyingPiece(clickedCube) {
      return scene.meshes.find((mesh) => {
        return (
          mesh !== selectedPiece &&
          (mesh.name.endsWith("Owl") ||
            mesh.name.endsWith("Kite") ||
            mesh.name.endsWith("Raven")) &&
          mesh.position.x.toFixed(2) ===
            (
              clickedCube.position.x +
              (clickedCube.name.startsWith("y") ? 3.75 : 0)
            ).toFixed(2) &&
          mesh.position.y.toFixed(2) ===
            (
              clickedCube.position.y +
              (clickedCube.name.startsWith("b") ? 3.75 : 0)
            ).toFixed(2) &&
          mesh.position.z.toFixed(2) ===
            (
              clickedCube.position.z +
              (clickedCube.name.startsWith("g") ? 3.75 : 0)
            ).toFixed(2)
        );
      });
    },

    processPieceMove(piece, targetCube) {
      const currentPosition = gameStateManager.piecePositions[piece.name];
      
      // Check for potential captures based on piece type
      const capturedPiece = this.detectPotentialCaptures(piece, currentPosition, targetCube);

      gameController.processMove(piece, targetCube, (fromPosition, toPosition) => {
        // Capture game state BEFORE updating positions for takeback
        const gameStateBeforeMove = {
          piecePositions: JSON.parse(JSON.stringify(gameStateManager.piecePositions)),
          currentPlayer: gameStateManager.currentPlayerTurn,
          captureHistory: JSON.parse(JSON.stringify(gameStateManager.captureHistory)),
          knockedOutTeam: gameStateManager.knockedOutTeam,
          isPlayAgainState: gameStateManager.isPlayAgainState,
          gameOver: gameStateManager.gameOver
        };

        // Add the move to the move history (with pre-move state)
        gameStateManager.addMoveToHistory(
          piece.name,
          fromPosition,
          toPosition,
          capturedPiece,
          gameStateBeforeMove
        );

        // Store the selected piece name before setting it to null
        const movedPieceName = piece.name;
        selectedPiece = null;

        // Update shadowed rows after the move
        gameStateManager.updateShadowedRows(movedPieceName);
      });
    },

    detectPotentialCaptures(piece, currentPosition, targetCube) {
      let capturedPiece = null;
      
      if (piece.name.includes('Owl')) {
        // Owl captures: direct occupation
        capturedPiece = scene.meshes.find((mesh) => {
          return (
            mesh !== piece &&
            (mesh.name.endsWith("Owl") ||
              mesh.name.endsWith("Kite") ||
              mesh.name.endsWith("Raven")) &&
            mesh.position.equals(gameController.getPositionFromCubeName(targetCube.name))
          );
        });
      } else if (piece.name.includes('Kite')) {
        // Kite captures: check if this is a cross-face move AND if there are adjacent victims
        const startFace = currentPosition[0];
        const endFace = targetCube.name[0];
        if (startFace !== endFace) {
          // Cross-face move - check for actual adjacent victims
          const adjacentSquares = gameController.getAdjacentSquaresForCapture(targetCube.name);
          const hasVictims = adjacentSquares.some(square => {
            const occupyingPiece = gameController.findPieceAtSquareForCapture(square, gameStateManager.piecePositions);
            if (occupyingPiece) {
              const kiteColor = piece.name.split(/(?=[A-Z])/)[0];
              const victimColor = occupyingPiece.split(/(?=[A-Z])/)[0];
              return kiteColor !== victimColor; // Different teams
            }
            return false;
          });
          
          if (hasVictims) {
            capturedPiece = { name: "potential_kite_capture" };
          }
        }
      } else if (piece.name.includes('Raven')) {
        // Raven captures: check if the Raven actually has mobbing opportunities at the destination
        const hasActualCaptures = checkRavenCaptureOpportunities(
          targetCube.name, 
          gameStateManager.piecePositions, 
          piece.name
        );
        
        if (hasActualCaptures) {
          capturedPiece = { name: "potential_raven_mobbing" };
        }
      }

      return capturedPiece;
    },

    setupCubeClickListeners() {
      cubesOnTheThreeFaces.forEach((cube) => {
        this.addCubeClickListener(cube);
      });
    },

    // PIECE CLICK HANDLERS
    createPieceActionManager(piece) {
      const actionManager = new ActionManager(scene);

      actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
          this.handlePieceSingleClick(piece);
        })
      );

      actionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnDoublePickTrigger, () => {
          this.handlePieceDoubleClick(piece);
        })
      );
      
      return actionManager;
    },

    handlePieceSingleClick(piece) {
      const pieceName = piece.name;
      
      // Check if we're in hybrid capture mode and this piece can be captured
      if (gameStateManager.hybridCaptureMode && piece._hybridCaptureHandler) {
        piece._hybridCaptureHandler();
        return;
      }
      
      const currentPosition = gameStateManager.piecePositions[pieceName];

      if (currentPosition && currentPosition.endsWith("--1")) {
        selectedPiece = null;
      } else if (
        gameStateManager.isPotentialRetraction(pieceName) &&
        !gameStateManager.justCancelledRetraction
      ) {
        gameStateManager.showRetractionConfirmation(piece, () => {
          this.performRetraction(piece);
          gameStateManager.updateNextPlayerDisplay();
        });
      } else {
        selectedPiece = piece;
        gameStateManager.justCancelledRetraction = false;
      }
    },

    performRetraction(piece) {
      const lastMove = gameStateManager.lastMove;
      if (lastMove && lastMove.piece === piece.name && lastMove.sourceSquare) {
        let sourcePosition;
        if (lastMove.sourceSquare.endsWith("--1")) {
          sourcePosition = getPositionFromOwlHallaCubeName(lastMove.sourceSquare);
        } else {
          sourcePosition = gameController.getPositionFromCubeName(lastMove.sourceSquare);
        }
        const sourceRotation = gameController.getRotationFromCubeName(lastMove.sourceSquare);

        gameController.animatePieceToPosition(
          piece,
          sourcePosition,
          sourceRotation,
          () => {
            gameStateManager.retractMove();
          }
        );
      } else {
        console.error("Cannot retract move. Invalid last move data:", lastMove);
      }
    },

    handlePieceDoubleClick(piece) {
      const pieceName = piece.name;
      console.log(`🖱️ DOUBLE-CLICK EVENT on ${pieceName}`);
      console.log(`🔍 Timer status: ${gameStateManager.captureDecisionTimer ? 'ACTIVE' : 'INACTIVE'}`);
      console.log(`🔍 Current player: ${gameStateManager.currentPlayerTurn}`);
      console.log(`🔍 Hybrid mode: ${gameStateManager.hybridCaptureMode ? 'ACTIVE' : 'INACTIVE'}`);
      
      // Check if we're in capture decision timer period (for regular captures)
      if (gameStateManager.captureDecisionTimer) {
        console.log(`⏰ Double-click during capture timer - attempting to capture ${pieceName}`);
        // Only allow capturing opponent pieces, not your own pieces
        const pieceColor = gameStateManager.getColorFromPieceName(pieceName);
        const capturingPlayer = gameStateManager.capturingPlayer;
        console.log(`🔍 Piece color: ${pieceColor}, Capturing player: ${capturingPlayer}`);
        if (pieceColor !== capturingPlayer) {
          console.log(`✅ Capturing opponent piece: ${pieceName}`);
          gameStateManager.recordCapture(pieceName);
          return;
        } else {
          console.log(`❌ Cannot capture your own piece: ${pieceName}`);
          return;
        }
      }
      
      // Check if we're in hybrid capture mode and this piece can be captured
      if (gameStateManager.hybridCaptureMode && piece._hybridCaptureHandler) {
        console.log(`🔄 Double-click during hybrid capture mode - adding ${pieceName} to capture list`);
        piece._hybridCaptureHandler();
        return;
      }
      
      // Standard Owl Halla toggle behavior
      this.togglePieceOwlHallaPosition(piece);
    },

    togglePieceOwlHallaPosition(piece) {
      const pieceName = piece.name;
      const originalPosition = originalPositions[pieceName];

      if (originalPosition) {
        // The piece is on the owlHalla square, move it back to its original position
        piece.position = originalPosition;
        piece.rotation = originalPositions[pieceName + "Rotation"];
        piece.visibility = true;
        piece.isPickable = true;

        const originalPositionName = originalPositions[pieceName + "Name"];
        gameStateManager.updatePiecePosition(pieceName, originalPositionName);
        gameStateManager.addOwlHallaMove(pieceName, false);

        originalPositions[pieceName] = null;
        originalPositions[pieceName + "Rotation"] = null;
        originalPositions[pieceName + "Name"] = null;
        gameStateManager.updateShadowedRows(pieceName);
        updatePiecesLeavingOwlHalla(pieceName);
      } else {
        // The piece is on the main board, move it to owlHalla
        originalPositions[pieceName] = piece.position.clone();
        originalPositions[pieceName + "Rotation"] = piece.rotation.clone();
        originalPositions[pieceName + "Name"] = gameStateManager.piecePositions[pieceName];
        
        const owlHallaCubeName = getOwlHallaCubeName(pieceName);
        const owlHallaPosition = getPositionFromOwlHallaCubeName(owlHallaCubeName);

        // Apply the offset based on the color of the piece
        if (pieceName.startsWith("brown")) {
          owlHallaPosition.y += 3.5;
        } else if (pieceName.startsWith("yellow")) {
          owlHallaPosition.x += 3.5;
        } else if (pieceName.startsWith("green")) {
          owlHallaPosition.z += 3.5;
        }

        piece.position = owlHallaPosition;
        const owlHallaCube = scene.getMeshByName(owlHallaCubeName);
        piece.rotation = owlHallaCube.rotation.clone();

        piece.visibility = false;
        gameStateManager.updatePiecePosition(pieceName, owlHallaCubeName);
        gameStateManager.addOwlHallaMove(pieceName, true);
        updatePiecesArrivingOnOwlHalla(pieceName);

        // Record the capture along with the position of the captured piece
        const capturePosition = gameStateManager.piecePositions[pieceName];
        gameStateManager.recordCapture(pieceName, capturePosition);
      }
    },

    setupPieceActionManagers(pieces) {
      const { brownOwl, brownKite, brownRaven, yellowOwl, yellowKite, yellowRaven, greenOwl, greenKite, greenRaven } = pieces;
      
      brownOwl.actionManager = this.createPieceActionManager(brownOwl);
      brownKite.actionManager = this.createPieceActionManager(brownKite);
      brownRaven.actionManager = this.createPieceActionManager(brownRaven);
      yellowOwl.actionManager = this.createPieceActionManager(yellowOwl);
      yellowKite.actionManager = this.createPieceActionManager(yellowKite);
      yellowRaven.actionManager = this.createPieceActionManager(yellowRaven);
      greenOwl.actionManager = this.createPieceActionManager(greenOwl);
      greenKite.actionManager = this.createPieceActionManager(greenKite);
      greenRaven.actionManager = this.createPieceActionManager(greenRaven);
    },

    // OWL HALLA INTERACTION
    setupOwlHallaInteraction() {
      const edgeStripActionManager = new ActionManager(scene);
      
      // Register action for click event on edge strips
      edgeStripActionManager.registerAction(
        new ExecuteCodeAction(ActionManager.OnPickDownTrigger, (evt) => {
          // Handle click event on edge strips
          const pickedMesh = evt.meshUnderPointer;
          if (pickedMesh && pickedMesh.name === "edgeStrip") {
            // Toggle visibility of owlHalla cubes and any pieces
            this.toggleOwlHallaVisibility();
          }
        })
      );

      // Assign action manager to edge strips
      scene.meshes.forEach((mesh) => {
        if (mesh.name === "edgeStrip") {
          mesh.actionManager = edgeStripActionManager;
        }
      });
    },

    toggleOwlHallaVisibility() {
      const owlHallaVisible = !owlHallaCubes[0].visibility;

      owlHallaCubes.forEach((cube) => {
        cube.visibility = owlHallaVisible;
      });

      // Toggle visibility of pieces on owlHalla squares
      piecesOnOwlHalla.forEach((pieceName) => {
        const piece = scene.getMeshByName(pieceName);
        piece.visibility = owlHallaVisible;
      });
    },

    // PUBLIC INTERFACE
    getSelectedPiece() {
      return selectedPiece;
    },

    clearSelectedPiece() {
      selectedPiece = null;
    }
  };
}