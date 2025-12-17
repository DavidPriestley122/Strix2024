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
import { Color3, StandardMaterial, Vector3, PBRMaterial, MultiMaterial, CubeTexture, SpotLight } from "@babylonjs/core";

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

  // Glass Mode Toggle Function - Material Swapping Approach
  let isGlassMode = false;
  let materialsInitialized = false;
  const originalMaterials = new Map();  // mesh.uniqueId -> original material
  const glassMaterials = new Map();     // mesh.uniqueId -> glass material

  // Store original light intensities for toggling
  const originalLightIntensities = new Map();

  // Spotlight for glass mode color enhancement
  let glassSpotlight = null;

  function createGlassMaterial(scene, name, type) {
    const glassMat = new PBRMaterial(name, scene);

    // THE KEY FIX: Enable alpha transparency mode
    glassMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;

    // Common glass properties
    glassMat.metallic = 0.0;
    glassMat.backFaceCulling = false;

    // Enable refraction for realistic glass
    glassMat.subSurface.isRefractionEnabled = true;
    glassMat.subSurface.indexOfRefraction = 1.5;
    glassMat.subSurface.refractionIntensity = 0.8;
    // IMPORTANT: Set to false when using manual alpha
    glassMat.subSurface.linkRefractionWithTransparency = false;

    // Lighting properties for glass (balanced for color visibility)
    glassMat.environmentIntensity = 0.5; // Environment reflections
    glassMat.directIntensity = 0.6; // Higher to show colors (was 0.3, too dark)
    glassMat.specularIntensity = 1.0; // Specular highlights from direct lights

    switch (type) {
      case "clear":
        glassMat.albedoColor = Color3.FromInts(120, 60, 30); // Brown - more saturated and vibrant
        glassMat.roughness = 0.05;
        glassMat.alpha = 0.3; // Glass-like transparency
        break;

      case "frosted":
        glassMat.albedoColor = new Color3(0.92, 0.92, 0.94);
        glassMat.roughness = 0.3;
        glassMat.alpha = 0.5; // Slightly more opaque for frosted effect
        glassMat.subSurface.refractionIntensity = 0.6;
        break;

      case "tinted":
        glassMat.albedoColor = new Color3(0.9, 0.85, 0.8);
        glassMat.roughness = 0.05;
        glassMat.alpha = 0.35; // Glass-like transparency
        break;

      case "tinted_green":
        glassMat.albedoColor = Color3.FromInts(5, 130, 0); // Green - much more saturated and vibrant
        glassMat.roughness = 0.05;
        glassMat.alpha = 1.0; // Fully opaque to show green color
        break;

      case "tinted_brown_center":
        // Override transparency mode to OPAQUE for solid rendering
        glassMat.transparencyMode = PBRMaterial.PBRMATERIAL_OPAQUE;
        glassMat.albedoColor = Color3.FromInts(50, 25, 15); // Dark brown like original brown squares
        glassMat.roughness = 0.2;
        glassMat.alpha = 1.0; // Fully solid
        glassMat.backFaceCulling = true; // Standard for opaque materials
        // DISABLE glass properties
        glassMat.subSurface.isRefractionEnabled = false;
        glassMat.environmentIntensity = 0.5; // Some reflection for depth
        break;

      case "invisible":
        glassMat.alpha = 0;
        glassMat.subSurface.isRefractionEnabled = false;
        break;
    }

    return glassMat;
  }

  function initializeGlassMaterials(scene) {
    if (materialsInitialized) return;

    // Create environment texture for glass reflections (only when glass mode is first used)
    if (!scene.environmentTexture) {
      // TODO: Find a working natural environment texture (forest.env returns 404)
      // Using default environment for now
      scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(
        "https://playground.babylonjs.com/textures/environment.env",
        scene
      );
      scene.environmentIntensity = 0; // Start at 0, will be set to 0.4 when glass mode is enabled
    }

    scene.meshes.forEach(mesh => {
      if (!mesh.material) return;

      const mat = mesh.material;
      const matName = mat.name;

      // Store original material - NEVER modify these
      originalMaterials.set(mesh.uniqueId, mat);

      // Create glass alternatives based on mesh/material type
      if (matName === "baseMaterial" || matName === "finMaterial") {
        glassMaterials.set(mesh.uniqueId, createGlassMaterial(scene, matName + "_glassVer", "clear"));
      }
      else if (matName === "backPanelMaterial") {
        glassMaterials.set(mesh.uniqueId, createGlassMaterial(scene, matName + "_glassVer", "tinted"));
      }
      else if (matName === "edgeStripMaterial") {
        glassMaterials.set(mesh.uniqueId, createGlassMaterial(scene, matName + "_glassVer", "tinted_green"));
      }
      else if (mat instanceof MultiMaterial || mat.subMaterials) {
        // Board cubes use MultiMaterial
        const glassMultiMat = new MultiMaterial(mat.name + "_glassVer", scene);

        // Check if this is one of the three nest squares (center of the board)
        const isNestSquare = mesh.name === "b7-7" || mesh.name === "y7-7" || mesh.name === "g7-7";

        mat.subMaterials.forEach((subMat, index) => {
          if (subMat.name.includes("_checker")) {
            let glassType;
            if (isNestSquare) {
              // Nest squares get brown tint
              glassType = "tinted_brown_center";
            } else {
              // REVERSED: Light squares (isDark=false) are now frosted, dark squares are clear
              const isDark = subMat.metadata?.isDark || false;
              glassType = isDark ? "clear" : "frosted";
            }
            glassMultiMat.subMaterials.push(
              createGlassMaterial(scene, subMat.name + "_glassVer", glassType)
            );
          } else if (subMat.name.includes("_glass")) {
            // Internal cube faces - invisible to prevent flicker
            glassMultiMat.subMaterials.push(
              createGlassMaterial(scene, subMat.name + "_invisible", "invisible")
            );
          } else {
            // Unknown sub-material, clone as-is
            glassMultiMat.subMaterials.push(subMat);
          }
        });

        glassMaterials.set(mesh.uniqueId, glassMultiMat);
      }
    });

    materialsInitialized = true;
  }

  function toggleGlassMode() {
    // Initialize glass materials on first call
    initializeGlassMaterials(scene);

    isGlassMode = !isGlassMode;

    // Toggle environment texture intensity - this does 80% of the work for glass
    // Higher intensity for glass mode as per Opus recommendation
    scene.environmentIntensity = isGlassMode ? 0.9 : 0;

    // Create or toggle spotlight for glass mode to highlight colored elements
    if (isGlassMode) {
      // Create spotlight if it doesn't exist
      if (!glassSpotlight) {
        glassSpotlight = new SpotLight(
          "glassSpotlight",
          new Vector3(5, 8, 5), // Position above and to side of board
          new Vector3(-1, -1, -1), // Direction toward base
          Math.PI / 3, // Angle
          2, // Exponent
          scene
        );
        glassSpotlight.intensity = 1.5;
      }
      glassSpotlight.setEnabled(true);
    } else {
      // Disable spotlight in non-glass mode
      if (glassSpotlight) {
        glassSpotlight.setEnabled(false);
      }
    }

    // Adjust lighting for glass mode - REDUCE direct lights (too bright makes glass look plastic)
    const lights = scene.lights;
    lights.forEach(light => {
      if (!originalLightIntensities.has(light.name)) {
        // Store original intensity on first toggle
        originalLightIntensities.set(light.name, light.intensity);
      }

      if (isGlassMode) {
        // Moderate lighting for glass mode (0.7x) - balanced for transparency and color
        light.intensity = originalLightIntensities.get(light.name) * 0.7;
      } else {
        // Restore original lighting - non-glass mode UNCHANGED
        light.intensity = originalLightIntensities.get(light.name);
      }
    });

    scene.meshes.forEach(mesh => {
      if (!mesh.material) return;

      const meshId = mesh.uniqueId;

      if (isGlassMode && glassMaterials.has(meshId)) {
        mesh.material = glassMaterials.get(meshId);
      } else if (!isGlassMode && originalMaterials.has(meshId)) {
        mesh.material = originalMaterials.get(meshId);
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