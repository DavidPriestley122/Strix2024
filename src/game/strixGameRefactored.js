// REFACTORED STRIX GAME MODULE
// Orchestrates the complete game scene using modular architecture

// IMPORT STATEMENTS
import { createBaseAndFins } from "./board/gameBaseAndFins.js";
import { createGUI } from "./managers/gameStateManager.js";
import { createGameStateManager } from "./managers/gameStateManager.js";
import { createCheckerBoards } from "./board/gameCheckerBoards.js";
import { createOwlSquareToruses } from "./board/gameCheckerBoards.js";
import { createPlayingPieces } from "./board/gamePieces.js";
import { createAI } from "../ai/gameAI.js";

// Rendering modules
import { createScene, setupCamera, setupLighting, createBackground, createBoardContainer } from "./rendering/sceneSetup.js";
import { animatePieceMovement } from "./rendering/animations.js";

// Controller modules
import { createGameController } from "./controllers/gameController.js";
import { createEventController } from "./controllers/eventController.js";
import { createExportController } from "./controllers/exportController.js";

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
      .addInPlace(new Vector3(offsetX, offsetY, offsetZ));
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

  // Create export controller
  const exportController = createExportController(gameStateManager);
  exportController.initializeExportControls();

  // Create AI and pass it to gameStateManager
  const aiModule = createAI(scene, gameStateManager, {
    animatePieceMovement: animatePieceMovement,
    isMoveCollidingWithShadowedRows: gameController.isMoveCollidingWithShadowedRows,
    updateShadowedRows: gameStateManager.updateShadowedRows.bind(gameStateManager),
    updatePiecesArrivingOnOwlHalla: utilityFunctions.updatePiecesArrivingOnOwlHalla,
  });
  gameStateManager.setAI(aiModule);

  gameStateManager.updateNextPlayerDisplay();

  // Glass Mode Toggle Function
  let isGlassMode = false;
  function toggleGlassMode() {
    isGlassMode = !isGlassMode;

    // Get all materials from the scene
    scene.materials.forEach(material => {
      if (material.name === "baseMaterial" || material.name === "finMaterial") {
        // Base and fins: PBR glass
        if (isGlassMode) {
          material.albedoColor = new Color3(1.0, 1.0, 1.0);
          material.metallic = 0.0;
          material.roughness = 0.0; // Smooth glass
          material.alpha = 0.3;
          material.indexOfRefraction = 1.5;
          material.linkRefractionWithTransparency = true;
          material.emissiveColor = new Color3(0.15, 0.15, 0.15);
          material.backFaceCulling = false;
        } else {
          material.albedoColor = Color3.FromInts(88, 54, 41);
          material.roughness = 1.0; // Matte in solid mode
          material.alpha = 1.0;
          material.emissiveColor = new Color3(0, 0, 0);
          material.backFaceCulling = true;
        }
      } else if (material.name === "backPanelMaterial") {
        // Backing panels: glassy brown veneer
        material.alpha = isGlassMode ? 0.5 : 1.0;
        material.backFaceCulling = !isGlassMode;
      } else if (material.name.includes("_checker")) {
        // Board squares Face 4 (checkerboard pattern) using PBR
        const metadata = material.metadata || {};
        const isDark = metadata.isDark || false;

        if (isGlassMode) {
          if (isDark) {
            // Dark brown squares: frosted/sand-blasted glass effect
            material.albedoColor = Color3.FromInts(50, 25, 15);
            material.metallic = 0.0;
            material.roughness = 0.9; // High roughness = frosted/sand-blasted appearance
            material.alpha = 0.95; // Mostly opaque but slightly translucent
            material.emissiveColor = new Color3(0.05, 0.03, 0.02); // Slight warm glow
          } else {
            // Light squares: crystalline clear glass
            material.albedoColor = new Color3(1.0, 1.0, 1.0);
            material.metallic = 0.0;
            material.roughness = 0.1; // Very smooth, slight texture
            material.alpha = 0.15;
            material.emissiveColor = new Color3(0.2, 0.2, 0.2); // Bright for clarity
          }
          material.backFaceCulling = true;
        } else {
          // Solid mode: restore original colors
          material.albedoColor = isDark
            ? Color3.FromInts(50, 25, 15)
            : Color3.FromInts(240, 230, 140);
          material.roughness = 1.0; // Matte
          material.alpha = 1.0;
          material.emissiveColor = new Color3(0, 0, 0);
          material.backFaceCulling = true;
        }
      } else if (material.name.includes("_glass")) {
        // Board cube other faces (0-3, 5): clear glass in glass mode using PBR
        const metadata = material.metadata || {};
        const cubeIsDark = metadata.isDark || false;

        if (isGlassMode) {
          // PBR glass properties for realistic crystalline appearance
          material.albedoColor = new Color3(1.0, 1.0, 1.0); // Pure clear white
          material.metallic = 0.0; // Glass is not metallic
          material.roughness = 0.0; // Perfectly smooth for clarity
          material.alpha = 0.1; // Slightly visible
          material.indexOfRefraction = 1.5; // Standard glass IOR
          material.linkRefractionWithTransparency = true; // Connect refraction to transparency
          material.emissiveColor = new Color3(0.2, 0.2, 0.2); // Bright self-illumination
          material.backFaceCulling = false; // Show both sides
        } else {
          // Solid mode: restore color based on dark/light square
          material.albedoColor = cubeIsDark
            ? Color3.FromInts(50, 25, 15)
            : Color3.FromInts(240, 230, 140);
          material.metallic = 0.0;
          material.roughness = 1.0; // Matte in solid mode
          material.alpha = 1.0;
          material.emissiveColor = new Color3(0, 0, 0); // Reset emissive
          material.backFaceCulling = true;
        }
      } else if (material.name === "edgeStripMaterial") {
        // Green edges: translucent
        material.alpha = isGlassMode ? 0.6 : 1.0;
        material.backFaceCulling = !isGlassMode;
      }
    });

    return isGlassMode;
  }

  // REGISTER GLOBAL FUNCTIONS (temporary compatibility layer)
  const globalFunctions = {
    animateCapturedPieceToOwlHalla: utilityFunctions.handlePieceDoubleClickForCapture,
    validateMove: gameController.validateMove,
    handlePieceDoubleClickForCapture: utilityFunctions.handlePieceDoubleClickForCapture,
    updatePiecesArrivingOnOwlHalla: utilityFunctions.updatePiecesArrivingOnOwlHalla,
    updatePiecesLeavingOwlHalla: utilityFunctions.updatePiecesLeavingOwlHalla,
    toggleGlassMode: toggleGlassMode
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