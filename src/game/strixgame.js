import {gameStateManager} from './gameStateManager.js';
import { baseMesh as _baseMesh, fin1 as _fin1, fin2 as _fin2, fin3 as _fin3 } from "./gameBaseAndFins.js";
import {
    brownOwl,
    brownKite,
    brownRaven,
    yellowOwl,
    yellowKite,
    yellowRaven,
    greenOwl,
    greenKite,
    greenRaven,
} from "./gamePieces.js";
import { mainBoardCubes } from "./gameCheckerBoards.js";
import { Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, MeshBuilder,StandardMaterial, MultiMaterial,  TransformNode, Mesh, SubMesh, ActionManager, ExecuteCodeAction, Matrix } from "@babylonjs/core";
import {AdvancedDynamicTexture, TextBlock, Control,Rectangle, TextWrapping, ScrollViewer } from '@babylonjs/gui/2D'
import {Animation,CubicEase,EasingFunction} from '@babylonjs/core'

export function createScene(engine,canvas) {
    //This creates a basic Babylon scene object
    var scene = new Scene(engine)

    // ArcRotateCamera
    var camera = new ArcRotateCamera("camera1", 0, Math.PI / 4, 30, new Vector3(0, 0, 0), scene);
    // Get the current camera position and target
    var currentPosition = camera.position;
    var currentTarget = camera.target;

    // Adjust the camera position and target to move the game set lower
    camera.position = new Vector3(currentPosition.x, currentPosition.y - 3, currentPosition.z);
    camera.target = new Vector3(currentTarget.x, currentTarget.y + 5, currentTarget.z);

    camera.attachControl(canvas, true);


    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light1 = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
    var light2 = new DirectionalLight("light2", new Vector3(0, 0, -1), scene);
    var light3 = new DirectionalLight("light3", new Vector3(-1, 0, 0), scene);
    var light4 = new DirectionalLight("light4", new Vector3(0, -1, 0), scene);
    //var light5 = new DirectionalLight("light5", new Vector3(-1, -1, -1), scene);


    // Default intensity is 1. Let's dim the light a small amount
    light1.intensity = .7;
    light2.intensity = .1;
    light3.intensity = .5;
    light4.intensity = .5;
    //light5.intensity = .7;


    // Create a background plane
    var backgroundPlane = MeshBuilder.CreatePlane("backgroundPlane", { size: 1000 }, scene);
    backgroundPlane.position.y = 0; // Position the plane behind all other objects
    backgroundPlane.rotation.x = Math.PI / 2;
    backgroundPlane.rotation.y = 0;
    backgroundPlane.rotation.z = 0;

    // Create a standard material for the background plane
    var backgroundMaterial = new StandardMaterial("backgroundMaterial", scene);
    backgroundMaterial.diffuseColor = new Color3(0.1, 0.4, 0.6); // Set the color of the material
    backgroundMaterial.specularColor = new Color3(0, 0, 0);
    backgroundMaterial.backFaceCulling = false; // Enable double-sided rendering
    backgroundPlane.material = backgroundMaterial;



    //CREATE THE BOARD CONTAINER

    var boardContainer = new TransformNode("boardContainer", scene);

    // Pass the boardContainer to the modules
    gameBaseAndFins(boardContainer);
    gameCheckerBoards(boardContainer);
    gamePieces(boardContainer);

    // Rotate by the sine of the "magic angle" for x and the cosine of it for z, to make the set stand on its point

    boardContainer.rotation = new Vector3(-(1 / Math.sqrt(3)), 0, Math.cos(Math.asin(1 / Math.sqrt(3))));
    boardContainer.position.y += 1.45;


   // INFO TEXT SET-UP
// Create GUI manager
var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

// Create dynamic text object to display information ..
var infoText = new TextBlock();
infoText.text = "";
infoText.color = "white";
infoText.fontSize = 24;
infoText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
infoText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
infoText.top = "20px";
infoText.left = "20px";
infoText.isVisible = true;
advancedTexture.addControl(infoText);

var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

var messageRect = new Rectangle("messageRect");
messageRect.width = "40%";
messageRect.height = "20%";
messageRect.cornerRadius = 20;
messageRect.color = "white";
messageRect.thickness = 4;
messageRect.background = "rgba(0, 0, 0, 0.7)";
messageRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
messageRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
messageRect.isVisible = false;
advancedTexture.addControl(messageRect);

var messageText = new TextBlock("messageText");
messageText.text = "";
messageText.color = "white";
messageText.fontSize = 24;
messageText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
messageText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
messageText.resizeToFit = true;
messageText.textWrapping = TextWrapping.WordWrap;
messageText.paddingLeft = "5%";
messageText.paddingRight = "5%";
messageRect.addControl(messageText);

// Create a container for the move history
var moveHistoryContainer = new Rectangle("moveHistoryContainer");
moveHistoryContainer.width = "100px";
moveHistoryContainer.height = "200px";
moveHistoryContainer.background = "rgba(0, 0, 0, 0.7)";
moveHistoryContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
moveHistoryContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
moveHistoryContainer.top = "80px";
moveHistoryContainer.left = "20px";
advancedTexture.addControl(moveHistoryContainer);

// Create a scroll viewer for the move history
var moveHistoryViewer = new ScrollViewer("moveHistoryViewer");
moveHistoryViewer.width = "100%";
moveHistoryViewer.height = "100%";
moveHistoryContainer.addControl(moveHistoryViewer);


// Create a text block to display the move history
var moveHistoryText = new TextBlock("moveHistoryText");
moveHistoryText.text = "";
moveHistoryText.color = "white";
moveHistoryText.fontSize = 16;
moveHistoryText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
moveHistoryText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
moveHistoryText.resizeToFit = true;
moveHistoryText.textWrapping = TextWrapping.WordWrap;
moveHistoryViewer.addControl(moveHistoryText);



    // STARTING POSITIONS OF THE PLAYING PIECES

    // Set the starting positions of the pieces
    function setPiecePosition(piece, cubes, name, offsetX, offsetY, offsetZ) {
        var cube = cubes.find(cube => cube.name === name);
        piece.position = cube.position.clone().add(new Vector3(offsetX, offsetY, offsetZ));
        piece.rotation = cube.rotation.clone();
    }

    setPiecePosition(brownOwl, cubes, "b7-1", 0, 3.75, 0);

    setPiecePosition(brownKite, cubes, "b6-2", 0, 3.75, 0);

    setPiecePosition(brownRaven, cubes, "b5-3", 0, 3.75, 0);

    setPiecePosition(yellowOwl, cubes, "y7-1", 3.75, 0, 0);

    setPiecePosition(yellowKite, cubes, "y6-2", 3.75, 0, 0);

    setPiecePosition(yellowRaven, cubes, "y5-3", 3.75, 0, 0);

    setPiecePosition(greenOwl, cubes, "g7-1", 0, 0, 3.75);

    setPiecePosition(greenKite, cubes, "g6-2", 0, 0, 3.75);

    setPiecePosition(greenRaven, cubes, "g5-3", 0, 0, 3.75);


  

    // Function to update the position of a piece in the game state manager
    function updatePiecePosition(pieceName, position) {
        gameStateManager.piecePositions[pieceName] = position;
    }


    function isMoveCollidingWithShadowedRows(targetCube, selectedPiece) {
        // Update shadowed rows excluding the selected piece
        //  gameStateManager.updateShadowedRows(selectedPiece.name);

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

    var selectedPiece = null;

    function animatePieceMovement(piece, targetPosition, targetRotation, duration, onAnimationEnd) {
        var easingFunction = new CubicEase();
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

        Animation.CreateAndStartAnimation("pieceAnimation", piece, "position", 60, duration, piece.position, targetPosition, 0, easingFunction, onAnimationEnd);
        Animation.CreateAndStartAnimation("pieceRotationAnimation", piece, "rotation", 60, duration, piece.rotation, targetRotation, 0, easingFunction);
    }

    function addCubeClickListener(cube) {
        cube.actionManager = new ActionManager(scene);
        cube.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, function () {
            if (selectedPiece) {
                // Check if the clicked cube is an owlHalla cube
                if (cube.name.endsWith("--1")) {
                    // The clicked cube is an owlHalla cube, do not allow piece movement
                    return;
                }

                // Check if the clicked cube already contains a piece
                var occupyingPiece = scene.meshes.find(mesh => {
                    return mesh !== selectedPiece && (mesh.name.endsWith("Owl") || mesh.name.endsWith("Kite") || mesh.name.endsWith("Raven")) &&
                        mesh.position.x.toFixed(2) === (cube.position.x + (cube.name.startsWith("y") ? 3.75 : 0)).toFixed(2) &&
                        mesh.position.y.toFixed(2) === (cube.position.y + (cube.name.startsWith("b") ? 3.75 : 0)).toFixed(2) &&
                        mesh.position.z.toFixed(2) === (cube.position.z + (cube.name.startsWith("g") ? 3.75 : 0)).toFixed(2);
                });

                if (occupyingPiece) {
                    // The clicked cube is already occupied by another piece
                    displayInfoMessage("Destination square already occupied. Please choose another move.");
                    selectedPiece = null;
                } else {
                    // Check if the clicked cube is shadowed
                    gameStateManager.updateShadowedRows(selectedPiece.name);
                    if (isMoveCollidingWithShadowedRows(cube.name, selectedPiece)) {
                        displayInfoMessage("The destination square is shadowed. Please choose another move.");
                        selectedPiece = null;
                    } else {
                        var offsetVector;
                        if (cube.name.startsWith("b")) {
                            // Cube is on the brown checkerboard
                            offsetVector = new Vector3(0, 3.75, 0);
                        } else if (cube.name.startsWith("y")) {
                            // Cube is on the yellow checkerboard
                            offsetVector = new Vector3(3.75, 0, 0);
                        } else if (cube.name.startsWith("g")) {
                            // Cube is on the green checkerboard
                            offsetVector = new Vector3(0, 0, 3.75);
                        }

                        // Calculate the target position and rotation for the selected piece
                        var targetPosition = cube.position.clone().add(offsetVector);
                        var targetRotation = cube.rotation.clone();

                        // Store the current position before the move
                        var currentPosition = gameStateManager.piecePositions[selectedPiece.name];

                        // Animate the selected piece movement
                        animatePieceMovement(selectedPiece, targetPosition, targetRotation, 30, function () {
                            // Update the position of the moved piece in gameStateManager.piecePositions
                            gameStateManager.piecePositions[selectedPiece.name] = cube.name;

                            // Add the move to the move history
                            gameStateManager.addMoveToHistory(selectedPiece.name, currentPosition, cube.name);

                            // Store the selected piece name before setting it to null
                            var movedPieceName = selectedPiece.name;
                            selectedPiece = null;

                            // Update shadowed rows after the move
                            gameStateManager.updateShadowedRows(movedPieceName);
                        });
                    }
                }
            }
        }));
    }
    function displayInfoMessage(message) {
        messageText.text = message;
        messageRect.isVisible = true;

        setTimeout(function () {
            messageRect.isVisible = false;
        }, 2000);
    }

    // Add click event listeners to the cubes
    cubes.forEach(function (cube) {
        addCubeClickListener(cube);
    });


    // OWLHALLA CUBES


    function createOwlHallaCubes(mainBoardCubes) {

        var owlHallaCubes = [];

        // Clone and position the owlHalla cubes for the brown side
        for (var i = 1; i <= 3; i++) {
            var cubeName = "b" + (8 - i) + "--1";
            var cube = mainBoardCubes["b" + (8 - i) + "-1"].clone(cubeName);
            cube.position = new Vector3(i - 0.5, -0.25, 8.5);
            cube.material = brownTeamMat;
            cube.visibility = false;
            cube.parent = boardContainer;
            owlHallaCubes.push(cube);
        }

        // Clone and position the owlHalla cubes for the yellow side
        for (var i = 1; i <= 3; i++) {
            var cubeName = "y" + (8 - i) + "--1";
            var cube = mainBoardCubes["y" + (8 - i) + "-1"].clone(cubeName);
            cube.position = new Vector3(-0.25, 8.5, i - 0.5);
            cube.material = yellowTeamMat;
            cube.visibility = false;
            cube.parent = boardContainer;
            owlHallaCubes.push(cube);
        }

        // Clone and position the owlHalla cubes for the green side
        for (var i = 1; i <= 3; i++) {
            var cubeName = "g" + (8 - i) + "--1";
            var cube = mainBoardCubes["g" + (8 - i) + "-1"].clone(cubeName);
            cube.position = new Vector3(8.5, i - 0.5, -0.25);
            cube.material = greenTeamMat;
            cube.visibility = false;
            cube.parent = boardContainer;
            owlHallaCubes.push(cube);
        }

        return owlHallaCubes;
    }

    var owlHallaCubes = createOwlHallaCubes(mainBoardCubes);

    // Create action manager for edge strips
    var edgeStripActionManager = new ActionManager(scene);

    // Register action for click event on edge strips
    edgeStripActionManager.registerAction(
        new ExecuteCodeAction(
            ActionManager.OnPickDownTrigger,
            function (evt) {
                // Handle click event on edge strips
                var pickedMesh = evt.meshUnderPointer;
                if (pickedMesh && pickedMesh.name === "edgeStrip") {
                    // Toggle visibility of owlHalla cubes and any pieces
                    toggleOwlHallaVisibility();
                }
            }
        )
    );

    // Assign action manager to edge strips
    scene.meshes.forEach(function (mesh) {
        if (mesh.name === "edgeStrip") {
            mesh.actionManager = edgeStripActionManager;
        }
    });

    var piecesOnOwlHalla = [];

    // Function to toggle visibility of owlHalla cubes and any pieces
    function toggleOwlHallaVisibility() {
        var owlHallaVisible = !owlHallaCubes[0].visibility;

        owlHallaCubes.forEach(function (cube) {
            cube.visibility = owlHallaVisible;
        });

        // Toggle visibility of pieces on owlHalla squares
        piecesOnOwlHalla.forEach(function (pieceName) {
            var piece = scene.getMeshByName(pieceName);
            piece.visibility = owlHallaVisible;
        });
    }

    // Function to update the piecesOnOwlHalla array when a piece is leaving owlHalla
    function updatePiecesLeavingOwlHalla(pieceName) {
        var index = piecesOnOwlHalla.indexOf(pieceName);
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
    var originalPositions = {
        brownOwl: null,
        brownKite: null,
        brownRaven: null,
        yellowOwl: null,
        yellowKite: null,
        yellowRaven: null,
        greenOwl: null,
        greenKite: null,
        greenRaven: null
    };

    // Function to handle the single click event for a piece
    function handlePieceSingleClick(piece) {
        var pieceName = piece.name;
        var currentPosition = gameStateManager.piecePositions[pieceName];

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
        var pieceName = piece.name;
        var originalPosition = originalPositions[pieceName];

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
            var owlHallaCubeName = getOwlHallaCubeName(pieceName);
            var owlHallaPosition = getPositionFromCubeName(owlHallaCubeName);

            // Apply the offset based on the color of the piece
            if (pieceName.startsWith("brown")) {
                owlHallaPosition.y += 3.5;
            } else if (pieceName.startsWith("yellow")) {
                owlHallaPosition.x += 3.5;
            } else if (pieceName.startsWith("green")) {
                owlHallaPosition.z += 3.5;
            }

            piece.position = owlHallaPosition;
            var owlHallaCube = scene.getMeshByName(owlHallaCubeName);
            piece.rotation = owlHallaCube.rotation.clone(); // Copy the rotation from the owlHalla cube

            piece.visibility = false; // Make the piece invisible when moved to the owlHalla square
            gameStateManager.updatePiecePosition(pieceName, owlHallaCubeName); // Update the piece position in the game state manager
            // Call the update function when the piece is arriving on owlHalla
            updatePiecesArrivingOnOwlHalla(pieceName);
        }
    }

    // Function to get the owlHalla cube name for a piece
    function getOwlHallaCubeName(pieceName) {
        var owlHallaCubeNames = {
            brownOwl: "b7--1",
            brownKite: "b6--1",
            brownRaven: "b5--1",
            yellowOwl: "y7--1",
            yellowKite: "y6--1",
            yellowRaven: "y5--1",
            greenOwl: "g7--1",
            greenKite: "g6--1",
            greenRaven: "g5--1"
        };

        return owlHallaCubeNames[pieceName];
    }

    // Function to get the position from a cube name
    function getPositionFromCubeName(cubeName) {
        var cube = scene.getMeshByName(cubeName);
        return cube.position.clone();
    }

    // Function to create action manager for a piece
    function createPieceActionManager(piece) {
        var actionManager = new ActionManager(scene);

        actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnPickTrigger,
                function () {
                    handlePieceSingleClick(piece);
                }
            )
        );

        actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnDoublePickTrigger,
                function () {
                    handlePieceDoubleClick(piece);
                }
            )
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




    /*// Add x-axis (red)
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
};

//Make the createScene function globally accessible
window.createScene = createScene;

