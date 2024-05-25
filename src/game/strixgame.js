import { createBaseAndFins } from "./gameBaseAndFins.js";
import { createGUI } from "./gameStateManager.js";
import { createGameStateManager } from "./gameStateManager.js";
import { createCheckerBoards } from './gameCheckerBoards.js';
import { createPlayingPieces } from './gamePieces.js';

import {
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  MultiMaterial,
  TransformNode,
  Mesh,
  SubMesh,
  ActionManager,
  ExecuteCodeAction,
  Matrix,
} from "@babylonjs/core";
import { Animation, CubicEase, EasingFunction } from "@babylonjs/core";

export default function createScene(engine, canvas) {
  //This creates a basic Babylon scene object
  const scene = new Scene(engine);

  // ArcRotateCamera
  const camera = new ArcRotateCamera(
    "camera1",
    0,
    Math.PI / 4,
    30,
    new Vector3(0, 0, 0),
    scene
  );
  // Get the current camera position and target
  const currentPosition = camera.position;
  const currentTarget = camera.target;

  // Adjust the camera position and target to move the game set lower
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

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light1 = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
  const light2 = new DirectionalLight("light2", new Vector3(0, 0, -1), scene);
  const light3 = new DirectionalLight("light3", new Vector3(-1, 0, 0), scene);
  const light4 = new DirectionalLight("light4", new Vector3(0, -1, 0), scene);
  //var light5 = new DirectionalLight("light5", new Vector3(-1, -1, -1), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light1.intensity = 0.7;
  light2.intensity = 0.1;
  light3.intensity = 0.5;
  light4.intensity = 0.5;
  //light5.intensity = .7;

  // Create a background plane
  const backgroundPlane = MeshBuilder.CreatePlane(
    "backgroundPlane",
    { size: 1000 },
    scene
  );
  backgroundPlane.position.y = 0; // Position the plane behind all other objects
  backgroundPlane.rotation.x = Math.PI / 2;
  backgroundPlane.rotation.y = 0;
  backgroundPlane.rotation.z = 0;

  // Create a standard material for the background plane
  const backgroundMaterial = new StandardMaterial("backgroundMaterial", scene);
  backgroundMaterial.diffuseColor = new Color3(0.1, 0.4, 0.6); // Set the color of the material
  backgroundMaterial.specularColor = new Color3(0, 0, 0);
  backgroundMaterial.backFaceCulling = false; // Enable double-sided rendering
  backgroundPlane.material = backgroundMaterial;

  //CREATE THE BOARD CONTAINER

  const boardContainer = new TransformNode("boardContainer", scene);

  // Rotate by the sine of the "magic angle" for x and the cosine of it for z, to make the set stand on its point

  boardContainer.rotation = new Vector3(
    -(1 / Math.sqrt(3)),
    0,
    Math.cos(Math.asin(1 / Math.sqrt(3)))
  );
  boardContainer.position.y += 1.45;

  createBaseAndFins(scene, boardContainer);
  const guiElements = createGUI(scene);
  const gameStateManager = createGameStateManager(guiElements);
  const { cubesOnTheThreeFaces, mainBoardCubes } = createCheckerBoards(scene, boardContainer);
  //createPlayingPieces(scene, boardContainer);
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

 /*
  // MAKING THE PLAYING PIECES

  // Create materials for the cylinder
  const brownMaterial = new StandardMaterial("brownMaterial", scene);
  brownMaterial.diffuseColor = Color3.FromInts(88, 54, 41); // Brown

  const owlMat = new StandardMaterial("owlMat", scene);
  owlMat.diffuseColor = Color3.FromInts(204, 153, 102); // Owl Color

  const kiteMat = new StandardMaterial("kiteMat", scene);
  kiteMat.diffuseColor = Color3.FromInts(139, 0, 0); // Kite Color

  const ravenMat = new StandardMaterial("ravenMat", scene);
  ravenMat.diffuseColor = Color3.FromInts(10, 10, 10); // Raven Color

  const brownTeamMat = new StandardMaterial("brownTeamMat", scene);
  brownTeamMat.diffuseColor = Color3.FromInts(88, 54, 41); // Brown Team Color

  const yellowTeamMat = new StandardMaterial("yellowTeamMat", scene);
  yellowTeamMat.diffuseColor = Color3.FromInts(255, 204, 0); // Yellow Team Color

  const greenTeamMat = new StandardMaterial("greenTeamMat", scene);
  greenTeamMat.diffuseColor = Color3.FromInts(8, 64, 0); // Green Team Color

  // Create the multimeshes for the cylinders
  function createMeshWithMultiMaterial(name, material, teamMaterial, scene) {
    const mesh = MeshBuilder.CreateCylinder(
      name,
      { height: 7, diameter: 0.5, subdivisions: 7 },
      scene
    );
    const multiMaterial = new MultiMaterial("multiMaterial_" + name, scene);

    // Create sub-materials
    for (let i = 0; i < 6; i++) {
      multiMaterial.subMaterials.push(material);
    }
    multiMaterial.subMaterials.push(teamMaterial); // Bottom section
    multiMaterial.subMaterials.push(teamMaterial); // Top section

    // Apply multi-material to mesh
    mesh.material = multiMaterial;

    // Define sub-meshes
    mesh.subMeshes = [];
    const verticesCount = mesh.getTotalVertices();
    for (let j = 0; j < 8; j++) {
      let start = j * 144;
      new SubMesh(j, 0, verticesCount, start, 144, mesh);
    }

    mesh.parent = boardContainer;
    return mesh;
  }
  const brownOwl = createMeshWithMultiMaterial(
    "brownOwl",
    owlMat,
    brownTeamMat,
    scene
  );
  brownOwl.parent = boardContainer;
  const brownKite = createMeshWithMultiMaterial(
    "brownKite",
    kiteMat,
    brownTeamMat,
    scene
  );
  brownKite.parent = boardContainer;
  const brownRaven = createMeshWithMultiMaterial(
    "brownRaven",
    ravenMat,
    brownTeamMat,
    scene
  );
  brownRaven.parent = boardContainer;
  const yellowOwl = createMeshWithMultiMaterial(
    "yellowOwl",
    owlMat,
    yellowTeamMat,
    scene
  );
  yellowOwl.parent = boardContainer;
  const yellowKite = createMeshWithMultiMaterial(
    "yellowKite",
    kiteMat,
    yellowTeamMat,
    scene
  );
  yellowKite.parent = boardContainer;
  const yellowRaven = createMeshWithMultiMaterial(
    "yellowRaven",
    ravenMat,
    yellowTeamMat,
    scene
  );
  yellowRaven.parent = boardContainer;
  const greenOwl = createMeshWithMultiMaterial(
    "greenOwl",
    owlMat,
    greenTeamMat,
    scene
  );
  greenOwl.parent = boardContainer;
  const greenKite = createMeshWithMultiMaterial(
    "greenKite",
    kiteMat,
    greenTeamMat,
    scene
  );
  greenKite.parent = boardContainer;
  const greenRaven = createMeshWithMultiMaterial(
    "greenRaven",
    ravenMat,
    greenTeamMat,
    scene
  );
  greenRaven.parent = boardContainer;
*/
  // THE OWL SQUARES - MARKED BY TORUSES

  // Place a flattened torus on top of the cube named "b7-1"
  const targetCube1 = cubesOnTheThreeFaces.find((cube) => cube.name === "b7-1");
  if (targetCube1) {
    const torus1 = MeshBuilder.CreateTorus(
      "torus1",
      {
        diameter: 0.75,
        thickness: 0.1,
        tessellation: 32,
      },
      scene
    );
    torus1.position.x = targetCube1.position.x;
    torus1.position.y = targetCube1.position.y + 0.25; // Adjust the height above the cube
    torus1.position.z = targetCube1.position.z;
    torus1.rotation = targetCube1.rotation.clone();
    //torus1.material = brownTeamMat; // Use the same material as the brown owlHalla cubes
    torus1.material = new StandardMaterial("torus1Material", scene);
    torus1.material.diffuseColor = Color3.FromInts(88, 54, 41); // Brown color
    torus1.parent = boardContainer;
  }

  // Place a flattened torus on top of the cube named "y7-1"
  const targetCube2 = cubesOnTheThreeFaces.find((cube) => cube.name === "y7-1");
  if (targetCube2) {
    const torus2 = MeshBuilder.CreateTorus(
      "torus_y7-1",
      {
        diameter: 0.75,
        thickness: 0.1,
        tessellation: 32,
      },
      scene
    );
    torus2.position.x = targetCube2.position.x + 0.25; // Adjust the height above the cube
    torus2.position.y = targetCube2.position.y;
    torus2.position.z = targetCube2.position.z;
    torus2.rotation = targetCube2.rotation.clone();
    //torus2.material = yellowTeamMat; // Use the same material as the yellow owlHalla cubes
    torus2.material = new StandardMaterial("torus2Material", scene);
     torus2.material.diffuseColor = Color3.FromInts(255, 204, 0); // Yellow color
    torus2.parent = boardContainer;
  }

  // Place a flattened torus on top of the cube named "g7-1"
  const targetCube3 = cubesOnTheThreeFaces.find((cube) => cube.name === "g7-1");
  if (targetCube3) {
    const torus3 = MeshBuilder.CreateTorus(
      "torus_g7-1",
      {
        diameter: 0.75,
        thickness: 0.1,
        tessellation: 32,
      },
      scene
    );
    torus3.position.x = targetCube3.position.x;
    torus3.position.y = targetCube3.position.y;
    torus3.position.z = targetCube3.position.z + 0.25; // Adjust the height above the cube
    torus3.rotation = targetCube3.rotation.clone();
    //torus3.material = greenTeamMat; // Use the same material as the green owlHalla cubes
    torus3.material = new StandardMaterial("torus3Material", scene);
    torus3.material.diffuseColor = Color3.FromInts(8, 64, 0); // Green color
    torus3.parent = boardContainer;
  }

  // STARTING POSITIONS OF THE PLAYING PIECES

  // Set the starting positions of the pieces
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
      .add(new Vector3(offsetX, offsetY, offsetZ));
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

  function isMoveCollidingWithShadowedRows(targetCube, selectedPiece) {
    // Update shadowed rows excluding the selected piece
    gameStateManager.updateShadowedRows(selectedPiece.name);

    // Iterate through each color in the shadowed rows
    for (const color in gameStateManager.shadowedRows) {
      const shadowedCubes = gameStateManager.shadowedRows[color];
      // Check if the target cube is in the shadowed rows for the current color
      if (shadowedCubes.includes(targetCube)) {
        return true; // Collision detected
      }
    }
    return false; // No collision detected
  }

  //MOVING THE PIECES

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

              // Animate the selected piece movement
              animatePieceMovement(
                selectedPiece,
                targetPosition,
                targetRotation,
                30,
                function () {
                  // Update the position of the moved piece in gameStateManager.piecePositions
                  gameStateManager.piecePositions[selectedPiece.name] =
                    clickedCube.name;

                  // Add the move to the move history
                  gameStateManager.addMoveToHistory(
                    selectedPiece.name,
                    currentPosition,
                    clickedCube.name
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

  // Add click event listeners to the cubes
  cubesOnTheThreeFaces.forEach(function (clickedCube) {
    addCubeClickListener(clickedCube);
  });

  function createOwlHallaCubes(mainBoardCubes) {
    const owlHallaCubes = [];

    // Clone and position the owlHalla cubes for the brown side
    for (let i = 1; i <= 3; i++) {
      const cubeNameOHBrown = "b" + (8 - i) + "--1";
      const cubeOHBrown =
        mainBoardCubes["b" + (8 - i) + "-1"].clone(cubeNameOHBrown);
      cubeOHBrown.position = new Vector3(i - 0.5, -0.25, 8.5);
      //cubeOHBrown.material = brownTeamMat;
      cubeOHBrown.material = new StandardMaterial("brownMaterial", scene);
      cubeOHBrown.material.diffuseColor = Color3.FromInts(88, 54, 41); // Brown color
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
      //cubeOHYellow.material = yellowTeamMat;
      cubeOHYellow.material = new StandardMaterial("yellowMaterial", scene);
      cubeOHYellow.material.diffuseColor = Color3.FromInts(255, 204, 0); // Yellow color
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
      //cubeOHGreen.material = greenTeamMat;
      cubeOHGreen.material = new StandardMaterial("greenMaterial", scene);
      cubeOHGreen.material.diffuseColor = Color3.FromInts(8, 64, 0); // Green color
      cubeOHGreen.visibility = false;
      cubeOHGreen.parent = boardContainer;
      owlHallaCubes.push(cubeOHGreen);
    }

    return owlHallaCubes;
  }

  const owlHallaCubes = createOwlHallaCubes(mainBoardCubes);

  // Create action manager for edge strips
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

  const piecesOnOwlHalla = [];

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

  // TAKING PLAYING PIECES - DOUBLE-CLICK CODE

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

  // Function to handle the single click event for a piece
  function handlePieceSingleClick(piece) {
    const pieceName = piece.name;
    const currentPosition = gameStateManager.piecePositions[pieceName];

    if (currentPosition && currentPosition.endsWith("--1")) {
      // The clicked piece is on an owlHalla square, clear the selection
      selectedPiece = null;
      //infoText.text = "Cannot select a piece on an owlHalla square";
    } else {
      selectedPiece = piece;
      //infoText.text = "Single click on piece: " + pieceName;
    }
  }

  // Function to handle the double click event for a piece
  function handlePieceDoubleClick(piece) {
    const pieceName = piece.name;
    const originalPosition = originalPositions[pieceName];

    if (originalPosition) {
      // The piece is on the owlHalla square, move it back to its original position
      piece.position = originalPosition;
      piece.rotation = originalPositions[pieceName + "Rotation"];
      piece.visibility = true; // Make the piece visible when moved back to the original position
      originalPositions[pieceName] = null;
      originalPositions[pieceName + "Rotation"] = null;
      gameStateManager.updateShadowedRows(pieceName); // Update shadowed rows after the piece is moved back to the original position
      // Call the update function when the piece is leaving owlHalla
      updatePiecesLeavingOwlHalla(pieceName);
    } else {
      // The piece is on the main board, store its original position and rotation
      // Move it to the owlHalla square and copy the rotation from the owlHalla square
      originalPositions[pieceName] = piece.position.clone();
      originalPositions[pieceName + "Rotation"] = piece.rotation.clone();
      const owlHallaCubeName = getOwlHallaCubeName(pieceName);
      const owlHallaPosition = getPositionFromCubeName(owlHallaCubeName);

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
      piece.rotation = owlHallaCube.rotation.clone(); // Copy the rotation from the owlHalla cube

      piece.visibility = false; // Make the piece invisible when moved to the owlHalla square
      gameStateManager.updatePiecePosition(pieceName, owlHallaCubeName); // Update the piece position in the game state manager
      // Call the update function when the piece is arriving on owlHalla
      updatePiecesArrivingOnOwlHalla(pieceName);
    }
  }

  // Function to get the owlHalla cube name for a piece
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

  // Function to get the position from a cube name
  function getPositionFromCubeName(cubeName) {
    const cube = scene.getMeshByName(cubeName);
    return cube.position.clone();
  }

  // Function to create action manager for a piece
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

  // Attach action manager to each piece
  brownOwl.actionManager = createPieceActionManager(brownOwl);
  brownKite.actionManager = createPieceActionManager(brownKite);
  brownRaven.actionManager = createPieceActionManager(brownRaven);
  yellowOwl.actionManager = createPieceActionManager(yellowOwl);
  yellowKite.actionManager = createPieceActionManager(yellowKite);
  yellowRaven.actionManager = createPieceActionManager(yellowRaven);
  greenOwl.actionManager = createPieceActionManager(greenOwl);
  greenKite.actionManager = createPieceActionManager(greenKite);
  greenRaven.actionManager = createPieceActionManager(greenRaven);

  /*
    // Add x-axis (red)
    var xAxis = Mesh.CreateLines("xAxis", [
        new Vector3(-5, 0, 0),
        new Vector3(5, 0, 0)
    ], scene);
    xAxis.color = new Color3(1, 0, 0); // Red
    
    // Add y-axis (green)
    var yAxis = Mesh.CreateLines("yAxis", [
        new Vector3(0, -5, 0),
        new Vector3(0, 5, 0)
    ], scene);
    yAxis.color = new Color3(0, 1, 0); // Green
    
    // Add z-axis (blue)
    var zAxis = Mesh.CreateLines("zAxis", [
        new Vector3(0, 0, -5),
        new Vector3(0, 0, 5)
    ], scene);
    zAxis.color = new Color3(0, 0, 1); // Blue
  */
  return scene;
}
