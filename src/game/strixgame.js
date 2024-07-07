//IMPORT STATEMENTS
import { createBaseAndFins } from "./gameBaseAndFins.js";
import { createGUI } from "./gameStateManager.js";
import { createGameStateManager } from "./gameStateManager.js";
import { createCheckerBoards } from "./gameCheckerBoards.js";
import { createOwlSquareToruses } from "./gameCheckerBoards.js";
import { createPlayingPieces } from "./gamePieces.js";

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

//MAIN SCENE CREATION FUNCTION

export default function createScene(engine, canvas) {
  const scene = new Scene(engine);

  //CAMERA SETUP

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

  const light1 = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
  const light2 = new DirectionalLight("light2", new Vector3(0, 0, -1), scene);
  const light3 = new DirectionalLight("light3", new Vector3(-1, 0, 0), scene);
  const light4 = new DirectionalLight("light4", new Vector3(0, -1, 0), scene);

  light1.intensity = 0.7;
  light2.intensity = 0.1;
  light3.intensity = 0.5;
  light4.intensity = 0.5;

  //BACKGROUND CREATION

  const backgroundPlane = MeshBuilder.CreatePlane(
    "backgroundPlane",
    { size: 1000 },
    scene
  );
  backgroundPlane.position.y = 0; // Position the plane behind all other objects
  backgroundPlane.rotation.x = Math.PI / 2;
  backgroundPlane.rotation.y = 0;
  backgroundPlane.rotation.z = 0;

  const backgroundMaterial = new StandardMaterial("backgroundMaterial", scene);
  backgroundMaterial.diffuseColor = new Color3(0.1, 0.4, 0.6); // Set the color of the material
  backgroundMaterial.specularColor = new Color3(0, 0, 0);
  backgroundMaterial.backFaceCulling = false; // Enable double-sided rendering
  backgroundPlane.material = backgroundMaterial;

  //BOARD CONTAINER CREATION
  const boardContainer = new TransformNode("boardContainer", scene);
  // Rotate by the sine of the "magic angle" for x and the cosine of it for z, to make the set stand on its point
  boardContainer.rotation = new Vector3(
    -(1 / Math.sqrt(3)),
    0,
    Math.cos(Math.asin(1 / Math.sqrt(3)))
  );
  boardContainer.position.y += 1.45;

  //BASE AND FIN CREATION
  createBaseAndFins(scene, boardContainer);

  //GAME ELEMENTS CREATION
  const guiElements = createGUI(scene);
  const gameStateManager = createGameStateManager(guiElements);
  gameStateManager.updateNextPlayerDisplay();
  const { cubesOnTheThreeFaces, mainBoardCubes } = createCheckerBoards(
    scene,
    boardContainer
  );
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
  createOwlSquareToruses(scene, boardContainer, cubesOnTheThreeFaces);

  //INITIAL PIECE POSITIONS

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

  //GAME LOGIC FUNCTIONS

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

              // NEW: Check for a captured piece
              const capturedPiece = scene.meshes.find((mesh) => {
                return (
                  mesh !== selectedPiece &&
                  (mesh.name.endsWith("Owl") ||
                    mesh.name.endsWith("Kite") ||
                    mesh.name.endsWith("Raven")) &&
                  mesh.position.equals(targetPosition)
                );
              });

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
                    clickedCube.name,
                    capturedPiece
                  );

                  console.log(
                    "Move completed:",
                    selectedPiece.name,
                    "from",
                    currentPosition,
                    "to",
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
      cubeOHGreen.material = new StandardMaterial("greenMaterial", scene);
      cubeOHGreen.material.diffuseColor = Color3.FromInts(8, 64, 0); // Green color
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
    const currentPosition = gameStateManager.piecePositions[pieceName];

    console.log("Piece clicked:", pieceName);
    console.log("Current position:", currentPosition);
    console.log("Current lastMove:", gameStateManager.lastMove);

    if (currentPosition && currentPosition.endsWith("--1")) {
      selectedPiece = null;
      console.log("Piece is on owlHalla square, deselected");
    } else if (
      gameStateManager.isPotentialRetraction(pieceName) &&
      !gameStateManager.justCancelledRetraction
    ) {
      console.log("Potential move retraction detected, showing confirmation");
      gameStateManager.showRetractionConfirmation(piece, () => {
        performRetraction(piece);
        gameStateManager.updateNextPlayerDisplay();
        console.log("Retraction completed, player turn updated");
      });
    } else {
      selectedPiece = piece;
      console.log("New piece selected:", pieceName);
      gameStateManager.justCancelledRetraction = false;
      console.log("justCancelledRetraction reset to false");
    }

    console.log("Current player turn:", gameStateManager.currentPlayerTurn);
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

          if (lastMove.capturedPiece) {
            const capturedPiece = scene.getMeshByName(lastMove.capturedPiece);
            if (capturedPiece) {
              capturedPiece.position = getPositionFromCubeName(
                lastMove.destinationSquare
              );
              capturedPiece.rotation = getRotationFromCubeName(
                lastMove.destinationSquare
              );
              capturedPiece.setEnabled(true);
            }
          }

          console.log("Move retracted");
        }
      );
    } else {
      console.error("Cannot retract move. Invalid last move data:", lastMove);
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
        position.y += 3.75; // Adjust for brown board
      } else if (cubeName.startsWith("y")) {
        position.x += 3.75; // Adjust for yellow board
      } else if (cubeName.startsWith("g")) {
        position.z += 3.75; // Adjust for green board
      }
      return position;
    }
    return new Vector3(0, 0, 0);
  }

  function getPositionFromOwlHallaCubeName(cubeName) {
    const cube = scene.getMeshByName(cubeName);
    if (cube) {
      return cube.position.clone(); // No additional offset for owlHalla cubes
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

  return scene;
}
