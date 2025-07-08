// ORIGINAL STRIX GAME - COMMENTED OUT (REPLACED BY strixGameRefactored.js)
// This file is preserved for reference but is no longer used
// All functionality has been moved to the modular architecture

/*
//IMPORT STATEMENTS
import { createBaseAndFins } from "./gameBaseAndFins.js";
import { createGUI } from "./gameStateManager.js";
import { createGameStateManager } from "./gameStateManager.js";
import { createCheckerBoards } from "./gameCheckerBoards.js";
import { createOwlSquareToruses } from "./gameCheckerBoards.js";
import { createPlayingPieces } from "./gamePieces.js";
import { createAI } from "./gameAI.js";
import { checkRavenCaptureOpportunities } from "./rules/ravenRules.js";

import {
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  //MultiMaterial,
  TransformNode,
  //Mesh,
  //SubMesh,
  ActionManager,
  ExecuteCodeAction,
  //Matrix,
  //Texture,
} from "@babylonjs/core";
import { Animation, CubicEase, EasingFunction } from "@babylonjs/core";

//MAIN SCENE CREATION FUNCTION
export default function createScene(engine, canvas) {
  const scene = new Scene(engine);

  function updateProgress(progress) {
    if (window.updateLoadingBar) {
      window.updateLoadingBar(progress);
    }
  }

  //CAMERA SETUP
  updateProgress(10);
  const camera = new ArcRotateCamera(
    "camera1",
    0,
    Math.PI / 4,
    30,
    new Vector3(0, 0, 0),
    scene
  );
  const currentPosition = camera.position;
  const currentTarget = camera.target;
  camera.position = new Vector3(
    currentPosition.x,
    currentPosition.y - 3,
    currentPosition.z
  );
  camera.target = new Vector3(
    currentTarget.x,
    currentTarget.y + 5,
    currentTarget.z
  );
  camera.attachControl(canvas, true);

  //LIGHTING SETUP
  updateProgress(20);
  const light1 = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
  const light2 = new DirectionalLight("light2", new Vector3(0, 0, -1), scene);
  const light3 = new DirectionalLight("light3", new Vector3(-1, 0, 0), scene);
  const light4 = new DirectionalLight("light4", new Vector3(0, -1, 0), scene);

  light1.intensity = 0.7;
  light2.intensity = 0.1;
  light3.intensity = 0.5;
  light4.intensity = 0.5;

  //BACKGROUND CREATION
  updateProgress(30);
  const backgroundPlane = MeshBuilder.CreatePlane(
    "backgroundPlane",
    { size: 1000 },
    scene
  );
  backgroundPlane.position.y = 0;
  backgroundPlane.rotation.x = Math.PI / 2;
  backgroundPlane.rotation.y = 0;
  backgroundPlane.rotation.z = 0;

  const backgroundMaterial = new StandardMaterial("backgroundMaterial", scene);

  // Convert RGB values from 0-255 range to 0-1 range
  const r = 24.3 / 100;
  const g = 43.9 / 100;
  const b = 57.6 / 100;

  backgroundMaterial.diffuseColor = new Color3(r, g, b);
  backgroundMaterial.specularColor = new Color3(0, 0, 0);
  backgroundMaterial.backFaceCulling = false;
  backgroundPlane.material = backgroundMaterial;

  //BOARD CONTAINER CREATION
  updateProgress(40);
  const boardContainer = new TransformNode("boardContainer", scene);
  // Rotate by the sine of the "magic angle" for x and the cosine of it for z, to make the set stand on its point
  boardContainer.rotation = new Vector3(
    -(1 / Math.sqrt(3)),
    0,
    Math.cos(Math.asin(1 / Math.sqrt(3)))
  );
  boardContainer.position.y += 1.45;

  //BASE AND FIN CREATION
  updateProgress(50);
  createBaseAndFins(scene, boardContainer);

  //GAME ELEMENTS CREATION
  updateProgress(60);
  const guiElements = createGUI(scene);
  //const gameStateManager = createGameStateManager(guiElements);

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
      startBtn.addEventListener("click", function () {
        console.log("Start button clicked!");
        gameStateManager.startAIGame();
      });
      console.log("Start button listener added");
    }

    if (pauseBtn) {
      pauseBtn.addEventListener("click", function () {
        console.log("Pause button clicked!");
        gameStateManager.pauseAIGame();
      });
      console.log("Pause button listener added");
    }

    if (resumeBtn) {
      resumeBtn.addEventListener("click", function () {
        console.log("Resume button clicked!");
        gameStateManager.resumeAIGame();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        console.log("Reset button clicked!");
        gameStateManager.resetGame();
      });
    }
  }, 2000); // Wait 2 seconds for everything to load

  const { cubesOnTheThreeFaces, mainBoardCubes } = createCheckerBoards(
    scene,
    boardContainer
  );

  updateProgress(70);
  const {
    brownOwl,
    brownKite,
    brownRaven,
    yellowOwl,
    yellowKite,
    yellowRaven,
    greenOwl,
    greenKite,
    greenRaven,
  } = createPlayingPieces(scene, boardContainer);
  updateProgress(80);
  createOwlSquareToruses(scene, boardContainer, cubesOnTheThreeFaces);

  //INITIAL PIECE POSITIONS
  updateProgress(90);

  function setPiecePosition(
    piece,
    cubesOnTheThreeFaces,
    name,
    offsetX,
    offsetY,
    offsetZ
  ) {
    const cube = cubesOnTheThreeFaces.find((cube) => cube.name === name);
    piece.position = cube.position
      .clone()
      .addInPlace(new Vector3(offsetX, offsetY, offsetZ));
    piece.rotation = cube.rotation.clone();
  }
  setPiecePosition(brownOwl, cubesOnTheThreeFaces, "b7-1", 0, 3.75, 0);
  setPiecePosition(brownKite, cubesOnTheThreeFaces, "b6-2", 0, 3.75, 0);
  setPiecePosition(brownRaven, cubesOnTheThreeFaces, "b5-3", 0, 3.75, 0);
  setPiecePosition(yellowOwl, cubesOnTheThreeFaces, "y7-1", 3.75, 0, 0);
  setPiecePosition(yellowKite, cubesOnTheThreeFaces, "y6-2", 3.75, 0, 0);
  setPiecePosition(yellowRaven, cubesOnTheThreeFaces, "y5-3", 3.75, 0, 0);
  setPiecePosition(greenOwl, cubesOnTheThreeFaces, "g7-1", 0, 0, 3.75);
  setPiecePosition(greenKite, cubesOnTheThreeFaces, "g6-2", 0, 0, 3.75);
  setPiecePosition(greenRaven, cubesOnTheThreeFaces, "g5-3", 0, 0, 3.75);

  //CAPTURE DETECTION HELPER FUNCTIONS

  function getAdjacentSquaresForCapture(square) {
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
  }

  function findPieceAtSquareForCapture(square, piecePositions) {
    for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
      if (piecePos === square && piecePos !== "captured") {
        return pieceName;
      }
    }
    return null;
  }

  //GAME LOGIC FUNCTIONS

  function isMoveCollidingWithShadowedRows(targetCube, selectedPiece) {
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
  }

  // Create gameStateManager and pass it the functions it needs
  const gameStateManager = createGameStateManager(guiElements, {
    scene: scene,
    setPiecePosition: setPiecePosition,
    cubesOnTheThreeFaces: cubesOnTheThreeFaces,
    animatePieceMovement: animatePieceMovement,
  });

  // Initialize move input functionality
  gameStateManager.initializeMoveInput();

  // Create AI and pass it to gameStateManager
  const aiModule = createAI(scene, gameStateManager, {
    animatePieceMovement: animatePieceMovement,
    isMoveCollidingWithShadowedRows: isMoveCollidingWithShadowedRows,
    updateShadowedRows:
      gameStateManager.updateShadowedRows.bind(gameStateManager),
    updatePiecesArrivingOnOwlHalla: updatePiecesArrivingOnOwlHalla,
  });
  gameStateManager.setAI(aiModule);

  gameStateManager.updateNextPlayerDisplay();

  // PIECE MOVEMENT

  let selectedPiece = null;
  function animatePieceMovement(
    piece,
    targetPosition,
    targetRotation,
    duration,
    onAnimationEnd
  ) {
    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    Animation.CreateAndStartAnimation(
      "pieceAnimation",
      piece,
      "position",
      60,
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
      60,
      duration,
      piece.rotation,
      targetRotation,
      0,
      easingFunction
    );
  }

  function addCubeClickListener(clickedCube) {
    clickedCube.actionManager = new ActionManager(scene);
    clickedCube.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, function () {
        if (selectedPiece) {
          // Check if the clicked cube is an owlHalla cube
          if (clickedCube.name.endsWith("--1")) {
            // The clicked cube is an owlHalla cube, do not allow piece movement
            return;
          }

          // Check if the clicked cube already contains a piece
          const occupyingPiece = scene.meshes.find((mesh) => {
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

          if (occupyingPiece) {
            // The clicked cube is already occupied by another piece
            gameStateManager.displayInfoMessage(
              "Destination square already occupied. Please choose another move."
            );
            selectedPiece = null;
          } else {
            // Check if the clicked cube is shadowed
            gameStateManager.updateShadowedRows(selectedPiece.name);
            if (
              isMoveCollidingWithShadowedRows(clickedCube.name, selectedPiece)
            ) {
              gameStateManager.displayInfoMessage(
                "The destination square is shadowed. Please choose another move."
              );
              selectedPiece = null;
            } else {
              let offsetVector;
              if (clickedCube.name.startsWith("b")) {
                // Cube is on the brown checkerboard
                offsetVector = new Vector3(0, 3.75, 0);
              } else if (clickedCube.name.startsWith("y")) {
                // Cube is on the yellow checkerboard
                offsetVector = new Vector3(3.75, 0, 0);
              } else if (clickedCube.name.startsWith("g")) {
                // Cube is on the green checkerboard
                offsetVector = new Vector3(0, 0, 3.75);
              }

              // Calculate the target position and rotation for the selected piece
              const targetPosition = clickedCube.position
                .clone()
                .add(offsetVector);
              const targetRotation = clickedCube.rotation.clone();

              // Store the current position before the move
              const currentPosition =
                gameStateManager.piecePositions[selectedPiece.name];

              // Check for potential captures based on piece type
              let capturedPiece = null;
              
              if (selectedPiece.name.includes('Owl')) {
                // Owl captures: direct occupation
                capturedPiece = scene.meshes.find((mesh) => {
                  return (
                    mesh !== selectedPiece &&
                    (mesh.name.endsWith("Owl") ||
                      mesh.name.endsWith("Kite") ||
                      mesh.name.endsWith("Raven")) &&
                    mesh.position.equals(targetPosition)
                  );
                });
              } else if (selectedPiece.name.includes('Kite')) {
                // Kite captures: check if this is a cross-face move AND if there are adjacent victims
                const startFace = currentPosition[0];
                const endFace = clickedCube.name[0];
                if (startFace !== endFace) {
                  // Cross-face move - check for actual adjacent victims
                  const adjacentSquares = getAdjacentSquaresForCapture(clickedCube.name);
                  const hasVictims = adjacentSquares.some(square => {
                    const occupyingPiece = findPieceAtSquareForCapture(square, gameStateManager.piecePositions);
                    if (occupyingPiece) {
                      const kiteColor = selectedPiece.name.split(/(?=[A-Z])/)[0];
                      const victimColor = occupyingPiece.split(/(?=[A-Z])/)[0];
                      return kiteColor !== victimColor; // Different teams
                    }
                    return false;
                  });
                  
                  if (hasVictims) {
                    capturedPiece = { name: "potential_kite_capture" };
                  }
                }
              } else if (selectedPiece.name.includes('Raven')) {
                // Raven captures: check if the Raven actually has mobbing opportunities at the destination
                const hasActualCaptures = checkRavenCaptureOpportunities(
                  clickedCube.name, 
                  gameStateManager.piecePositions, 
                  selectedPiece.name
                );
                
                if (hasActualCaptures) {
                  capturedPiece = { name: "potential_raven_mobbing" };
                }
              }

              // Animate the selected piece movement
              animatePieceMovement(
                selectedPiece,
                targetPosition,
                targetRotation,
                30,
                function () {
                  // Capture game state BEFORE updating positions for takeback
                  const gameStateBeforeMove = {
                    piecePositions: JSON.parse(JSON.stringify(gameStateManager.piecePositions)),
                    currentPlayer: gameStateManager.currentPlayerTurn,
                    captureHistory: JSON.parse(JSON.stringify(gameStateManager.captureHistory)),
                    knockedOutTeam: gameStateManager.knockedOutTeam,
                    isPlayAgainState: gameStateManager.isPlayAgainState,
                    gameOver: gameStateManager.gameOver
                  };
                  
                  // Update the position of the moved piece in gameStateManager.piecePositions
                  gameStateManager.piecePositions[selectedPiece.name] =
                    clickedCube.name;

                  // Add the move to the move history (with pre-move state)
                  gameStateManager.addMoveToHistory(
                    selectedPiece.name,
                    currentPosition,
                    clickedCube.name,
                    capturedPiece,
                    gameStateBeforeMove
                  );

                  // Store the selected piece name before setting it to null
                  const movedPieceName = selectedPiece.name;
                  selectedPiece = null;

                  // Update shadowed rows after the move
                  gameStateManager.updateShadowedRows(movedPieceName);
                }
              );
            }
          }
        }
      })
    );
  }

  // Function to handle captured pieces - extracted from original double-click logic
  function handlePieceDoubleClickForCapture(pieceName) {
    console.log(`🏰 Using original logic to move ${pieceName} to Owl Halla`);
    
    const piece = scene.getMeshByName(pieceName);
    if (!piece) {
      console.log(`❌ Could not find piece ${pieceName} in scene`);
      return;
    }
    
    // This is the exact original logic from the working double-click system
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
    if (owlHallaCube) {
      piece.rotation = owlHallaCube.rotation.clone();
    }

    piece.visibility = false;
    gameStateManager.updatePiecePosition(pieceName, "captured");
    gameStateManager.addOwlHallaMove(pieceName, true);
    updatePiecesArrivingOnOwlHalla(pieceName);
    
    console.log(`✅ ${pieceName} positioned in Owl Halla using proven original logic`);
  }
  
  // Make function available globally
  window.handlePieceDoubleClickForCapture = handlePieceDoubleClickForCapture;

  cubesOnTheThreeFaces.forEach(function (clickedCube) {
    addCubeClickListener(clickedCube);
  });

  //OWLHALLA CUBE CREATION AND MANAGEMENT

  function createOwlHallaCubes(mainBoardCubes) {
    const owlHallaCubes = [];

    // Clone and position the owlHalla cubes for the brown side
    for (let i = 1; i <= 3; i++) {
      const cubeNameOHBrown = "b" + (8 - i) + "--1";
      const cubeOHBrown =
        mainBoardCubes["b" + (8 - i) + "-1"].clone(cubeNameOHBrown);
      cubeOHBrown.position = new Vector3(i - 0.5, -0.25, 8.5);
      cubeOHBrown.material = new StandardMaterial("brownMaterial", scene);
      cubeOHBrown.material.diffuseColor = Color3.FromInts(88, 54, 41);
      cubeOHBrown.visibility = false;
      cubeOHBrown.parent = boardContainer;
      owlHallaCubes.push(cubeOHBrown);
    }

    // Clone and position the owlHalla cubes for the yellow side
    for (let i = 1; i <= 3; i++) {
      const cubeNameOHYellow = "y" + (8 - i) + "--1";
      const cubeOHYellow =
        mainBoardCubes["y" + (8 - i) + "-1"].clone(cubeNameOHYellow);
      cubeOHYellow.position = new Vector3(-0.25, 8.5, i - 0.5);
      cubeOHYellow.material = new StandardMaterial("yellowMaterial", scene);
      cubeOHYellow.material.diffuseColor = Color3.FromInts(255, 204, 0);
      cubeOHYellow.visibility = false;
      cubeOHYellow.parent = boardContainer;
      owlHallaCubes.push(cubeOHYellow);
    }

    // Clone and position the owlHalla cubes for the green side
    for (let i = 1; i <= 3; i++) {
      const cubeNameOHGreen = "g" + (8 - i) + "--1";
      const cubeOHGreen =
        mainBoardCubes["g" + (8 - i) + "-1"].clone(cubeNameOHGreen);
      cubeOHGreen.position = new Vector3(8.5, i - 0.5, -0.25);
      cubeOHGreen.material = new StandardMaterial("greenMaterial", scene);
      cubeOHGreen.material.diffuseColor = Color3.FromInts(8, 64, 0);
      cubeOHGreen.visibility = false;
      cubeOHGreen.parent = boardContainer;
      owlHallaCubes.push(cubeOHGreen);
    }

    return owlHallaCubes;
  }

  const owlHallaCubes = createOwlHallaCubes(mainBoardCubes);

  const piecesOnOwlHalla = [];

  // Function to update the piecesOnOwlHalla array when a piece is leaving owlHalla
  function updatePiecesLeavingOwlHalla(pieceName) {
    const index = piecesOnOwlHalla.indexOf(pieceName);
    if (index > -1) {
      piecesOnOwlHalla.splice(index, 1);
    }
  }

  // Function to update the piecesOnOwlHalla array when a piece is arriving on owlHalla
  function updatePiecesArrivingOnOwlHalla(pieceName) {
    piecesOnOwlHalla.push(pieceName);
  }

  //EDGE STRIP INTERACTION SETUP AND OPERATION

  const edgeStripActionManager = new ActionManager(scene);
  // Register action for click event on edge strips
  edgeStripActionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPickDownTrigger, function (evt) {
      // Handle click event on edge strips
      const pickedMesh = evt.meshUnderPointer;
      if (pickedMesh && pickedMesh.name === "edgeStrip") {
        // Toggle visibility of owlHalla cubes and any pieces
        toggleOwlHallaVisibility();
      }
    })
  );

  // Assign action manager to edge strips
  scene.meshes.forEach(function (mesh) {
    if (mesh.name === "edgeStrip") {
      mesh.actionManager = edgeStripActionManager;
    }
  });

  // Function to toggle visibility of owlHalla cubes and any pieces
  function toggleOwlHallaVisibility() {
    const owlHallaVisible = !owlHallaCubes[0].visibility;

    owlHallaCubes.forEach(function (cube) {
      cube.visibility = owlHallaVisible;
    });

    // Toggle visibility of pieces on owlHalla squares
    piecesOnOwlHalla.forEach(function (pieceName) {
      const piece = scene.getMeshByName(pieceName);
      piece.visibility = owlHallaVisible;
    });
  }

  //PIECE INTERACTION LOGIC

  // Object to store the original positions of the pieces
  const originalPositions = {
    brownOwl: null,
    brownKite: null,
    brownRaven: null,
    yellowOwl: null,
    yellowKite: null,
    yellowRaven: null,
    greenOwl: null,
    greenKite: null,
    greenRaven: null,
  };

  function handlePieceSingleClick(piece) {
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
        performRetraction(piece);
        gameStateManager.updateNextPlayerDisplay();
      });
    } else {
      selectedPiece = piece;

      gameStateManager.justCancelledRetraction = false;
    }
  }

  function performRetraction(piece) {
    const lastMove = gameStateManager.lastMove;
    if (lastMove && lastMove.piece === piece.name && lastMove.sourceSquare) {
      let sourcePosition;
      if (lastMove.sourceSquare.endsWith("--1")) {
        sourcePosition = getPositionFromOwlHallaCubeName(lastMove.sourceSquare);
      } else {
        sourcePosition = getPositionFromCubeName(lastMove.sourceSquare);
      }
      const sourceRotation = getRotationFromCubeName(lastMove.sourceSquare);

      animatePieceMovement(
        piece,
        sourcePosition,
        sourceRotation,
        30,
        function () {
          gameStateManager.retractMove();
        }
      );
    } else {
      console.error("Cannot retract move. Invalid last move data:", lastMove);
    }
  }

  // Function to handle the double click event for a piece
  function handlePieceDoubleClick(piece) {
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
    } else {
      console.log(`❌ NO CAPTURE TIMER ACTIVE - using generic double-click behavior`);
    }
    
    // Check if we're in hybrid capture mode and this piece can be captured
    if (gameStateManager.hybridCaptureMode && piece._hybridCaptureHandler) {
      console.log(`🔄 Double-click during hybrid capture mode - adding ${pieceName} to capture list`);
      piece._hybridCaptureHandler();
      return;
    }
    
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
      originalPositions[pieceName + "Name"] =
        gameStateManager.piecePositions[pieceName];
      const owlHallaCubeName = getOwlHallaCubeName(pieceName);
      const owlHallaPosition =
        getPositionFromOwlHallaCubeName(owlHallaCubeName);

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
  }

  //UTILITY FUNCTIONS

  function getOwlHallaCubeName(pieceName) {
    const owlHallaCubeNames = {
      brownOwl: "b7--1",
      brownKite: "b6--1",
      brownRaven: "b5--1",
      yellowOwl: "y7--1",
      yellowKite: "y6--1",
      yellowRaven: "y5--1",
      greenOwl: "g7--1",
      greenKite: "g6--1",
      greenRaven: "g5--1",
    };
    return owlHallaCubeNames[pieceName];
  }

  function getPositionFromCubeName(cubeName) {
    const cube = scene.getMeshByName(cubeName);
    if (cube) {
      const position = cube.position.clone();
      // Add the offset based on which board the cube is on
      if (cubeName.startsWith("b")) {
        position.y += 3.75;
      } else if (cubeName.startsWith("y")) {
        position.x += 3.75;
      } else if (cubeName.startsWith("g")) {
        position.z += 3.75;
      }
      return position;
    }
    return new Vector3(0, 0, 0);
  }

  function getPositionFromOwlHallaCubeName(cubeName) {
    const cube = scene.getMeshByName(cubeName);
    if (cube) {
      return cube.position.clone();
    }
    return new Vector3(0, 0, 0);
  }

  function getRotationFromCubeName(cubeName) {
    const cube = scene.getMeshByName(cubeName);
    return cube ? cube.rotation.clone() : new Vector3(0, 0, 0);
  }

  //ACTION MANAGERS CREATION

  function createPieceActionManager(piece) {
    const actionManager = new ActionManager(scene);

    actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, function () {
        handlePieceSingleClick(piece);
      })
    );

    actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnDoublePickTrigger, function () {
        handlePieceDoubleClick(piece);
      })
    );
    return actionManager;
  }
  //ATTACH ACTIONMANAGERS TO PIECES

  brownOwl.actionManager = createPieceActionManager(brownOwl);
  brownKite.actionManager = createPieceActionManager(brownKite);
  brownRaven.actionManager = createPieceActionManager(brownRaven);
  yellowOwl.actionManager = createPieceActionManager(yellowOwl);
  yellowKite.actionManager = createPieceActionManager(yellowKite);
  yellowRaven.actionManager = createPieceActionManager(yellowRaven);
  greenOwl.actionManager = createPieceActionManager(greenOwl);
  greenKite.actionManager = createPieceActionManager(greenKite);
  greenRaven.actionManager = createPieceActionManager(greenRaven);

  // Function to animate captured pieces to Owl Halla
  function animateCapturedPieceToOwlHalla(pieceName) {
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
    if (pieceName.startsWith("brown")) {
      owlHallaPosition.y += 3.5;
    } else if (pieceName.startsWith("yellow")) {
      owlHallaPosition.x += 3.5;
    } else if (pieceName.startsWith("green")) {
      owlHallaPosition.z += 3.5;
    }

    const owlHallaCube = scene.getMeshByName(owlHallaCubeName);
    const targetRotation = owlHallaCube ? owlHallaCube.rotation.clone() : piece3D.rotation.clone();

    console.log(`📍 Animating ${pieceName} to Owl Halla position:`, owlHallaPosition);

    // Animate the piece to Owl Halla
    animatePieceMovement(
      piece3D,
      owlHallaPosition,
      targetRotation,
      30, // duration
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

  // Function to validate moves using existing rule systems
  function validateMove(pieceName, fromSquare, toSquare) {
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
    if (isMoveCollidingWithShadowedRows(targetCube.name, piece3D)) {
      return { valid: false, reason: `Square ${toSquare} is shadowed and cannot be moved to` };
    }
    
    // Additional piece-specific movement validation could go here
    // For now, we'll rely on the existing capture detection for move legality
    
    console.log(`✅ Move validation passed for ${pieceName}: ${fromSquare} → ${toSquare}`);
    return { valid: true, reason: "Move is valid" };
  }

  // Make functions available to gameStateManager
  window.animateCapturedPieceToOwlHalla = animateCapturedPieceToOwlHalla;
  window.validateMove = validateMove;

  updateProgress(100);

  return scene;
}
*/
