// REFACTORED STRIX GAME MODULE
// Orchestrates the complete game scene using modular architecture

// IMPORT STATEMENTS
import { createBaseAndFins } from "./gameBaseAndFins.js";
import { createGUI } from "./gameStateManager.js";
import { createGameStateManager } from "./gameStateManager.js";
import { createCheckerBoards } from "./gameCheckerBoards.js";
import { createOwlSquareToruses } from "./gameCheckerBoards.js";
import { createPlayingPieces } from "./gamePieces.js";
import { createAI } from "./gameAI.js";

// Rendering modules
import { createScene, setupCamera, setupLighting, createBackground, createBoardContainer } from "./rendering/sceneSetup.js";
import { animatePieceMovement } from "./rendering/animations.js";

// Controller modules
import { createGameController } from "./controllers/gameController.js";
import { createEventController } from "./controllers/eventController.js";

// Configuration
import { GAME_CONFIG } from "../config/gameConfig.js";

// Babylon.js imports
import { Color3, StandardMaterial, Vector3 } from "@babylonjs/core";

// MAIN SCENE CREATION FUNCTION
export default function createStrixGame(engine, canvas) {
  // Create scene and basic setup
  const { scene, camera, boardContainer, updateProgress } = createScene(engine, canvas);

  // BASE AND FIN CREATION
  updateProgress(GAME_CONFIG.LOADING_STEPS.BASE_AND_FINS);
  createBaseAndFins(scene, boardContainer);

  // GAME ELEMENTS CREATION
  updateProgress(GAME_CONFIG.LOADING_STEPS.GUI_ELEMENTS);
  const guiElements = createGUI(scene);

  const { cubesOnTheThreeFaces, mainBoardCubes } = createCheckerBoards(
    scene,
    boardContainer
  );

  updateProgress(GAME_CONFIG.LOADING_STEPS.PLAYING_PIECES);
  const pieces = createPlayingPieces(scene, boardContainer);
  
  createOwlSquareToruses(scene, boardContainer, cubesOnTheThreeFaces);

  // OWL HALLA SETUP
  const owlHallaCubes = createOwlHallaCubes(mainBoardCubes, scene, boardContainer);
  const piecesOnOwlHalla = [];
  const originalPositions = initializeOriginalPositions();

  // UTILITY FUNCTIONS (created after gameStateManager is available)
  let utilityFunctions;

  // INITIAL PIECE POSITIONS
  updateProgress(GAME_CONFIG.LOADING_STEPS.INITIAL_POSITIONS);

  // Helper function for setting piece positions
  function setPiecePosition(piece, cubesOnTheThreeFaces, name, offsetX, offsetY, offsetZ) {
    const cube = cubesOnTheThreeFaces.find((cube) => cube.name === name);
    piece.position = cube.position
      .clone()
      .add(new Vector3(offsetX, offsetY, offsetZ));
    piece.rotation = cube.rotation.clone();
  }

  // Create gameStateManager with dependencies
  const gameStateManager = createGameStateManager(guiElements, {
    scene: scene,
    setPiecePosition: setPiecePosition,
    cubesOnTheThreeFaces: cubesOnTheThreeFaces,
    animatePieceMovement: animatePieceMovement,
  });

  // Create utility functions after gameStateManager is available
  utilityFunctions = createUtilityFunctions(scene, owlHallaCubes, originalPositions, gameStateManager, piecesOnOwlHalla);

  // Create game controller
  const gameController = createGameController({
    scene,
    gameStateManager,
    cubesOnTheThreeFaces,
    animateCapturedPieceToOwlHalla: utilityFunctions.handlePieceDoubleClickForCapture,
    getOwlHallaCubeName: utilityFunctions.getOwlHallaCubeName,
    getPositionFromOwlHallaCubeName: utilityFunctions.getPositionFromOwlHallaCubeName,
    updatePiecesArrivingOnOwlHalla: utilityFunctions.updatePiecesArrivingOnOwlHalla,
    owlHallaCubes
  });

  // Initialize piece positions
  gameController.initializePiecePositions(pieces, cubesOnTheThreeFaces);

  // Create event controller
  const eventController = createEventController({
    scene,
    gameStateManager,
    gameController,
    cubesOnTheThreeFaces,
    owlHallaCubes,
    piecesOnOwlHalla,
    originalPositions,
    getOwlHallaCubeName: utilityFunctions.getOwlHallaCubeName,
    getPositionFromOwlHallaCubeName: utilityFunctions.getPositionFromOwlHallaCubeName,
    updatePiecesArrivingOnOwlHalla: utilityFunctions.updatePiecesArrivingOnOwlHalla,
    updatePiecesLeavingOwlHalla: utilityFunctions.updatePiecesLeavingOwlHalla
  });

  // Setup event listeners
  eventController.setupButtonListeners();
  eventController.setupCubeClickListeners();
  eventController.setupPieceActionManagers(pieces);
  eventController.setupOwlHallaInteraction();

  // Initialize move input functionality
  gameStateManager.initializeMoveInput();

  // Create AI and pass it to gameStateManager
  const aiModule = createAI(scene, gameStateManager, {
    animatePieceMovement: animatePieceMovement,
    isMoveCollidingWithShadowedRows: gameController.isMoveCollidingWithShadowedRows,
    updateShadowedRows: gameStateManager.updateShadowedRows.bind(gameStateManager),
    updatePiecesArrivingOnOwlHalla: utilityFunctions.updatePiecesArrivingOnOwlHalla,
  });
  gameStateManager.setAI(aiModule);

  gameStateManager.updateNextPlayerDisplay();

  // REGISTER GLOBAL FUNCTIONS (temporary compatibility layer)
  const globalFunctions = {
    animateCapturedPieceToOwlHalla: utilityFunctions.handlePieceDoubleClickForCapture,
    validateMove: gameController.validateMove,
    handlePieceDoubleClickForCapture: utilityFunctions.handlePieceDoubleClickForCapture
  };

  // Make functions available globally for compatibility
  Object.assign(window, globalFunctions);

  updateProgress(GAME_CONFIG.LOADING_STEPS.COMPLETE);

  return scene;
}

// UTILITY FUNCTIONS MODULE
function createUtilityFunctions(scene, owlHallaCubes, originalPositions, gameStateManager, piecesOnOwlHallaRef) {

  return {

    getOwlHallaCubeName(pieceName) {
      return GAME_CONFIG.OWL_HALLA_CUBES[pieceName];
    },

    getPositionFromOwlHallaCubeName(cubeName) {
      const cube = scene.getMeshByName(cubeName);
      if (cube) {
        return cube.position.clone();
      }
      return new Vector3(0, 0, 0);
    },

    updatePiecesArrivingOnOwlHalla(pieceName) {
      piecesOnOwlHallaRef.push(pieceName);
    },

    updatePiecesLeavingOwlHalla(pieceName) {
      const index = piecesOnOwlHallaRef.indexOf(pieceName);
      if (index > -1) {
        piecesOnOwlHallaRef.splice(index, 1);
      }
    },

    handlePieceDoubleClickForCapture(pieceName) {
      console.log(`🏰 DETAILED: Starting handlePieceDoubleClickForCapture for ${pieceName}`);
      
      const piece = scene.getMeshByName(pieceName);
      if (!piece) {
        console.log(`❌ Could not find piece ${pieceName} in scene`);
        return;
      }
      console.log(`✅ Found piece ${pieceName} in scene at position:`, piece.position);
      
      // This is the exact original logic from the working double-click system
      console.log(`📍 Storing original position for ${pieceName}`);
      originalPositions[pieceName] = piece.position.clone();
      originalPositions[pieceName + "Rotation"] = piece.rotation.clone();
      originalPositions[pieceName + "Name"] = gameStateManager.piecePositions[pieceName];
      console.log(`📍 Original position stored:`, originalPositions[pieceName]);
      
      // Use direct function calls instead of this.method
      const owlHallaCubeName = GAME_CONFIG.OWL_HALLA_CUBES[pieceName];
      console.log(`🏰 Owl Halla cube name: ${owlHallaCubeName}`);
      
      const owlHallaCube = scene.getMeshByName(owlHallaCubeName);
      const owlHallaPosition = owlHallaCube ? owlHallaCube.position.clone() : new Vector3(0, 0, 0);
      console.log(`🏰 Owl Halla position before offset:`, owlHallaPosition);

      // Apply the offset based on the color of the piece
      if (pieceName.startsWith("brown")) {
        owlHallaPosition.y += 3.5;
      } else if (pieceName.startsWith("yellow")) {
        owlHallaPosition.x += 3.5;
      } else if (pieceName.startsWith("green")) {
        owlHallaPosition.z += 3.5;
      }
      console.log(`🏰 Owl Halla position after offset:`, owlHallaPosition);

      piece.position = owlHallaPosition;
      if (owlHallaCube) {
        piece.rotation = owlHallaCube.rotation.clone();
        console.log(`🔄 Set piece rotation to match Owl Halla cube`);
      }

      console.log(`👻 Setting piece visibility to match Owl Halla state`);
      // Set visibility to match current Owl Halla visibility
      const owlHallaVisible = owlHallaCubes.length > 0 ? owlHallaCubes[0].visibility : false;
      piece.visibility = owlHallaVisible;
      console.log(`👻 Piece visibility set to: ${piece.visibility} (matching Owl Halla visibility: ${owlHallaVisible})`);
      
      console.log(`📊 Updating game state...`);
      gameStateManager.updatePiecePosition(pieceName, "captured"); // This should be "captured" for UI display
      gameStateManager.addOwlHallaMove(pieceName, true);
      piecesOnOwlHallaRef.push(pieceName);
      
      // Update displays to show the piece in Owl Halla
      gameStateManager.updateOwlHallaDisplay();
      
      console.log(`✅ ${pieceName} positioned in Owl Halla using proven original logic`);
    }
  };
}

// OWL HALLA CUBE CREATION
function createOwlHallaCubes(mainBoardCubes, scene, boardContainer) {
  const owlHallaCubes = [];

  // Clone and position the owlHalla cubes for the brown side
  for (let i = 1; i <= 3; i++) {
    const cubeNameOHBrown = "b" + (8 - i) + "--1";
    const cubeOHBrown = mainBoardCubes["b" + (8 - i) + "-1"].clone(cubeNameOHBrown);
    cubeOHBrown.position = new Vector3(i - 0.5, -0.25, 8.5);
    cubeOHBrown.material = new StandardMaterial("brownMaterial", scene);
    cubeOHBrown.material.diffuseColor = Color3.FromInts(
      GAME_CONFIG.MATERIALS.BROWN.r,
      GAME_CONFIG.MATERIALS.BROWN.g,
      GAME_CONFIG.MATERIALS.BROWN.b
    );
    cubeOHBrown.visibility = false;
    cubeOHBrown.parent = boardContainer;
    owlHallaCubes.push(cubeOHBrown);
  }

  // Clone and position the owlHalla cubes for the yellow side
  for (let i = 1; i <= 3; i++) {
    const cubeNameOHYellow = "y" + (8 - i) + "--1";
    const cubeOHYellow = mainBoardCubes["y" + (8 - i) + "-1"].clone(cubeNameOHYellow);
    cubeOHYellow.position = new Vector3(-0.25, 8.5, i - 0.5);
    cubeOHYellow.material = new StandardMaterial("yellowMaterial", scene);
    cubeOHYellow.material.diffuseColor = Color3.FromInts(
      GAME_CONFIG.MATERIALS.YELLOW.r,
      GAME_CONFIG.MATERIALS.YELLOW.g,
      GAME_CONFIG.MATERIALS.YELLOW.b
    );
    cubeOHYellow.visibility = false;
    cubeOHYellow.parent = boardContainer;
    owlHallaCubes.push(cubeOHYellow);
  }

  // Clone and position the owlHalla cubes for the green side
  for (let i = 1; i <= 3; i++) {
    const cubeNameOHGreen = "g" + (8 - i) + "--1";
    const cubeOHGreen = mainBoardCubes["g" + (8 - i) + "-1"].clone(cubeNameOHGreen);
    cubeOHGreen.position = new Vector3(8.5, i - 0.5, -0.25);
    cubeOHGreen.material = new StandardMaterial("greenMaterial", scene);
    cubeOHGreen.material.diffuseColor = Color3.FromInts(
      GAME_CONFIG.MATERIALS.GREEN.r,
      GAME_CONFIG.MATERIALS.GREEN.g,
      GAME_CONFIG.MATERIALS.GREEN.b
    );
    cubeOHGreen.visibility = false;
    cubeOHGreen.parent = boardContainer;
    owlHallaCubes.push(cubeOHGreen);
  }

  return owlHallaCubes;
}

// INITIALIZE ORIGINAL POSITIONS STORAGE
function initializeOriginalPositions() {
  return {
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
}