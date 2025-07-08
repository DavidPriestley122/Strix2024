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

        // Add radio button listeners for player type changes
        this.setupPlayerTypeListeners();

        // Add export button listeners
        this.setupExportButtonListeners();
        
        // Add import button listeners
        this.setupImportButtonListeners();
        
        // Add collapsible section listeners
        this.setupCollapsibleSections();
      }, GAME_CONFIG.TIMERS.BUTTON_LISTENER_DELAY);
    },

    // PLAYER TYPE RADIO BUTTON SETUP
    setupPlayerTypeListeners() {
      console.log("Setting up player type radio button listeners...");
      
      const radioButtons = document.querySelectorAll('input[name$="-player"]');
      console.log(`Found ${radioButtons.length} player type radio buttons`);
      
      radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
          console.log(`Player type changed: ${radio.name} = ${radio.value}`);
          
          // Update player types immediately
          gameStateManager.updatePlayerTypes();
          
          // If game is paused and current player was switched to AI, trigger AI move
          if (gameStateManager.aiGameRunning && 
              gameStateManager.aiGamePaused && 
              gameStateManager.isAIPlayer(gameStateManager.currentPlayerTurn)) {
            console.log(`🤖 Player switched to AI while paused - triggering AI move for ${gameStateManager.currentPlayerTurn}`);
            gameStateManager.triggerAIMoveIfNeeded();
          }
        });
      });
      
      console.log("Player type radio button listeners added");
    },

    // EXPORT BUTTON SETUP
    setupExportButtonListeners() {
      const exportSgnBtn = document.getElementById("export-sgn-btn");
      const exportTxtBtn = document.getElementById("export-txt-btn");
      const exportJsonBtn = document.getElementById("export-json-btn");
      const copyGameBtn = document.getElementById("copy-game-btn");
      const saveGameBtn = document.getElementById("save-game-btn");

      let selectedFormat = 'sgn'; // Default format

      if (exportSgnBtn) {
        exportSgnBtn.addEventListener("click", () => {
          selectedFormat = 'sgn';
          this.updateExportButtonStyles('sgn');
          console.log("SGN format selected");
        });
      }

      if (exportTxtBtn) {
        exportTxtBtn.addEventListener("click", () => {
          selectedFormat = 'text';
          this.updateExportButtonStyles('text');
          console.log("Text format selected");
        });
      }

      if (exportJsonBtn) {
        exportJsonBtn.addEventListener("click", () => {
          selectedFormat = 'json';
          this.updateExportButtonStyles('json');
          console.log("JSON format selected");
        });
      }

      if (copyGameBtn) {
        copyGameBtn.addEventListener("click", () => {
          console.log(`Copying game in ${selectedFormat} format`);
          gameStateManager.exportGame(selectedFormat, 'copy');
        });
      }

      if (saveGameBtn) {
        saveGameBtn.addEventListener("click", () => {
          console.log(`Saving game in ${selectedFormat} format`);
          gameStateManager.exportGame(selectedFormat, 'download');
        });
      }

      // Set initial button state
      this.updateExportButtonStyles('sgn');
    },

    updateExportButtonStyles(selectedFormat) {
      const buttons = {
        'sgn': document.getElementById("export-sgn-btn"),
        'text': document.getElementById("export-txt-btn"),
        'json': document.getElementById("export-json-btn")
      };

      // Remove active class from all buttons
      Object.values(buttons).forEach(btn => {
        if (btn) btn.classList.remove('active');
      });

      // Add active class to selected button
      if (buttons[selectedFormat]) {
        buttons[selectedFormat].classList.add('active');
      }
    },

    // IMPORT BUTTON SETUP
    setupImportButtonListeners() {
      const importFileBtn = document.getElementById("import-file-btn");
      const importFileInput = document.getElementById("import-file-input");
      const importClipboardBtn = document.getElementById("import-clipboard-btn");
      const replaySpeedSelect = document.getElementById("replay-speed");

      if (importFileBtn && importFileInput) {
        importFileBtn.addEventListener("click", () => {
          console.log("Opening file picker for game import");
          importFileInput.click();
        });

        importFileInput.addEventListener("change", (event) => {
          const file = event.target.files[0];
          if (file) {
            console.log(`Importing game file: ${file.name}`);
            
            const speed = parseInt(replaySpeedSelect?.value || 1000);
            const options = {
              speed: speed,
              autoStart: true,
              resetFirst: true,
              showProgress: true
            };
            
            gameStateManager.handleFileUpload(file, options)
              .then(result => {
                if (result.success) {
                  console.log('✅ Game import successful');
                } else {
                  console.error('❌ Game import failed:', result.error);
                }
              })
              .catch(error => {
                console.error('❌ File upload error:', error);
                gameStateManager.displayInfoMessage(`Import error: ${error.message}`);
              });
            
            // Clear the input for next use
            event.target.value = '';
          }
        });
      }

      if (importClipboardBtn) {
        importClipboardBtn.addEventListener("click", () => {
          console.log("Loading game from clipboard");
          
          const speed = parseInt(replaySpeedSelect?.value || 1000);
          const options = {
            speed: speed,
            autoStart: true,
            resetFirst: true,
            showProgress: true
          };
          
          gameStateManager.loadGameFromClipboard(options);
        });
      }

      console.log("Import button listeners added");
    },

    // COLLAPSIBLE SECTIONS SETUP
    setupCollapsibleSections() {
      console.log("Setting up collapsible sections...");
      
      const sectionHeaders = document.querySelectorAll('.section-header');
      
      // Initially collapse all sections
      sectionHeaders.forEach(header => {
        const section = header.dataset.section;
        const content = document.getElementById(`${section}-content`);
        
        if (content) {
          header.classList.add('collapsed');
          content.classList.add('collapsed');
        }
        
        header.addEventListener('click', () => {
          const isCollapsed = header.classList.contains('collapsed');
          
          if (isCollapsed) {
            // Expand this section
            header.classList.remove('collapsed');
            content.classList.remove('collapsed');
            console.log(`Expanded ${section} section`);
          } else {
            // Collapse this section
            header.classList.add('collapsed');
            content.classList.add('collapsed');
            console.log(`Collapsed ${section} section`);
          }
        });
      });
      
      console.log(`Set up ${sectionHeaders.length} collapsible sections`);
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
      // FIRST: Clean up the piecesOnOwlHalla array before toggling
      this.cleanUpPiecesOnOwlHallaArray();
      
      const owlHallaVisible = !owlHallaCubes[0].visibility;

      console.log(`🔍 DEBUGGING: Toggling Owl Halla visibility to ${owlHallaVisible}`);
      console.log(`🔍 piecesOnOwlHalla array contains:`, piecesOnOwlHalla);

      owlHallaCubes.forEach((cube) => {
        cube.visibility = owlHallaVisible;
      });

      // Toggle visibility of pieces on owlHalla squares
      piecesOnOwlHalla.forEach((pieceName) => {
        const piece = scene.getMeshByName(pieceName);
        const gameStatePosition = gameStateManager.piecePositions[pieceName];
        
        console.log(`🔍 ${pieceName}: gameState=${gameStatePosition}, 3D position=(${piece.position.x.toFixed(1)}, ${piece.position.y.toFixed(1)}, ${piece.position.z.toFixed(1)})`);
        
        if (gameStatePosition !== "captured") {
          console.log(`⚠️ MISMATCH: ${pieceName} is in piecesOnOwlHalla array but gameState position is ${gameStatePosition}, not "captured"`);
        }
        
        piece.visibility = owlHallaVisible;
      });
    },

    // CLEANUP FUNCTION
    cleanUpPiecesOnOwlHallaArray() {
      console.log(`🧹 CLEANUP: piecesOnOwlHalla before cleanup:`, [...piecesOnOwlHalla]);
      
      // Remove duplicates and pieces that aren't actually captured
      const cleanedArray = [];
      const seenPieces = new Set();
      
      for (const pieceName of piecesOnOwlHalla) {
        if (!seenPieces.has(pieceName)) {
          const gameStatePosition = gameStateManager.piecePositions[pieceName];
          if (gameStatePosition === "captured") {
            cleanedArray.push(pieceName);
            seenPieces.add(pieceName);
          } else {
            console.log(`🧹 REMOVED: ${pieceName} (gameState: ${gameStatePosition})`);
          }
        } else {
          console.log(`🧹 REMOVED DUPLICATE: ${pieceName}`);
        }
      }
      
      // Clear and repopulate the original array
      piecesOnOwlHalla.length = 0;
      piecesOnOwlHalla.push(...cleanedArray);
      
      console.log(`🧹 CLEANUP: piecesOnOwlHalla after cleanup:`, [...piecesOnOwlHalla]);
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