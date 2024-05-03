function createScene(engine,canvas) {
    //This creates a basic Babylon scene object
    var scene = new BABYLON.Scene(engine)

    // ArcRotateCamera
    var camera = new BABYLON.ArcRotateCamera("camera1", 0, Math.PI / 4, 30, BABYLON.Vector3(0, 0, 0), scene);
    // Get the current camera position and target
    var currentPosition = camera.position;
    var currentTarget = camera.target;

    // Adjust the camera position and target to move the game set lower
    camera.position = new BABYLON.Vector3(currentPosition.x, currentPosition.y - 3, currentPosition.z);
    camera.target = new BABYLON.Vector3(currentTarget.x, currentTarget.y + 5, currentTarget.z);

    camera.attachControl(canvas, true);


    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(0, 0, -1), scene);
    var light3 = new BABYLON.DirectionalLight("light3", new BABYLON.Vector3(-1, 0, 0), scene);
    var light4 = new BABYLON.DirectionalLight("light4", new BABYLON.Vector3(0, -1, 0), scene);
    //var light5 = new BABYLON.DirectionalLight("light5", new BABYLON.Vector3(-1, -1, -1), scene);


    // Default intensity is 1. Let's dim the light a small amount
    light1.intensity = .7;
    light2.intensity = .1;
    light3.intensity = .5;
    light4.intensity = .5;
    //light5.intensity = .7;


    // Create a background plane
    var backgroundPlane = BABYLON.MeshBuilder.CreatePlane("backgroundPlane", { size: 1000 }, scene);
    backgroundPlane.position.y = 0; // Position the plane behind all other objects
    backgroundPlane.rotation.x = Math.PI / 2;
    backgroundPlane.rotation.y = 0;
    backgroundPlane.rotation.z = 0;

    // Create a standard material for the background plane
    var backgroundMaterial = new BABYLON.StandardMaterial("backgroundMaterial", scene);
    backgroundMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.6); // Set the color of the material
    backgroundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    backgroundMaterial.backFaceCulling = false; // Enable double-sided rendering
    backgroundPlane.material = backgroundMaterial;



    //CREATE THE BOARD CONTAINER

    var boardContainer = new BABYLON.TransformNode("boardContainer", scene);

    // Rotate by the sine of the "magic angle" for x and the cosine of it for z, to make the set stand on its point

    boardContainer.rotation = new BABYLON.Vector3(-(1 / Math.sqrt(3)), 0, Math.cos(Math.asin(1 / Math.sqrt(3))));
    boardContainer.position.y += 1.45;


    //THE BASE

    // Create the hexagonal base
    var baseSideLength = 3.91;
    //var baseRadius = baseSideLength / (2 * Math.sin(Math.PI / 6));
    var baseRadius = baseSideLength
    var baseThickness = 0.5;
    var baseShape = [];

    for (var i = 0; i < 6; i++) {
        var angle = i * Math.PI / 3;
        var x = baseRadius * Math.cos(angle);
        var z = baseRadius * Math.sin(angle);
        baseShape.push(new BABYLON.Vector3(x, 0, z));
    }
    baseShape.push(baseShape[0]);

    var baseOptions = {
        shape: baseShape,
        depth: baseThickness,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
    };

    var baseMesh = BABYLON.MeshBuilder.ExtrudePolygon("base", baseOptions, scene);
    baseMesh.visibility = 1;

    // Create a material for the base
    var baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);
    baseMaterial.diffuseColor = BABYLON.Color3.FromInts(88, 54, 41);
    baseMesh.material = baseMaterial;

    // Rotate the base by 30 degrees in the plane
    baseMesh.rotation.y = Math.PI / 3;
    baseMesh.position.y += 0.51;

    baseMesh.actionManager = new BABYLON.ActionManager(scene);
    baseMesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            function () {
                var isVisible = baseMesh.visibility === 1;
                baseMesh.visibility = isVisible ? 0 : 1;
                fin1.visibility = isVisible ? 0 : 1;
                fin2.visibility = isVisible ? 0 : 1;
                fin3.visibility = isVisible ? 0 : 1;
            }
        )
    );


    //THE FINS FOR THE BASE

    // Create the first fin
    var finHeight = 4.79;
    var finBaseLength = 3.386;
    var finThickness = 0.5;

    var finMaterial = new BABYLON.StandardMaterial("finMaterial", scene);
    finMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);


    var finShape = [
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(finBaseLength, 0, 0),
        new BABYLON.Vector3(finBaseLength, 0, finHeight),
        new BABYLON.Vector3(0, 0, 0)
    ];

    var finOptions = {
        shape: finShape,
        depth: finThickness,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
    };

    var fin1 = BABYLON.MeshBuilder.ExtrudePolygon("fin1", finOptions, scene);
    fin1.material = baseMaterial;
    fin1.visibility = 1;
    fin1.rotation.x = -Math.PI / 2;
    fin1.rotation.y = Math.PI / 6;
    fin1.parent = baseMesh;
    // Calculate the translation vector in the rotated coordinate system
    var translationVector = new BABYLON.Vector3(0.15, 0, -0.22);
    var rotationMatrix = BABYLON.Matrix.RotationY(Math.PI / 3);
    var rotatedTranslationVector = BABYLON.Vector3.TransformCoordinates(translationVector, rotationMatrix);
    // Apply the translation to the fin
    fin1.position.addInPlace(rotatedTranslationVector);

    // Create the second fin
    var fin2 = BABYLON.MeshBuilder.ExtrudePolygon("fin2", finOptions, scene);
    fin2.material = baseMaterial;
    fin2.visibility = 1;
    fin2.rotation.x = -Math.PI / 2;
    fin2.rotation.y = Math.PI * 5 / 6;
    fin2.parent = baseMesh;
    // Calculate the translation vector in the rotated coordinate system
    var translationVector = new BABYLON.Vector3(-0.2, 0, 0);
    var rotationMatrix = BABYLON.Matrix.RotationY(Math.PI / 3);
    var rotatedTranslationVector = BABYLON.Vector3.TransformCoordinates(translationVector, rotationMatrix);
    // Apply the translation to the fin
    fin2.position.addInPlace(rotatedTranslationVector);


    // Create the third fin
    var fin3 = BABYLON.MeshBuilder.ExtrudePolygon("fin3", finOptions, scene);
    fin3.material = baseMaterial;
    fin3.visibility = 1;
    fin3.rotation.x = -Math.PI / 2;
    fin3.rotation.y = -Math.PI / 2;
    fin3.parent = baseMesh;
    // Calculate the translation vector in the rotated coordinate system
    var translationVector = new BABYLON.Vector3(0.1, 0, 0.26);
    var rotationMatrix = BABYLON.Matrix.RotationY(Math.PI / 3);
    var rotatedTranslationVector = BABYLON.Vector3.TransformCoordinates(translationVector, rotationMatrix);
    // Apply the translation to the fin
    fin3.position.addInPlace(rotatedTranslationVector);




   // INFO TEXT SET-UP
// Create GUI manager
var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

// Create dynamic text object to display information
var infoText = new BABYLON.GUI.TextBlock();
infoText.text = "";
infoText.color = "white";
infoText.fontSize = 24;
infoText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
infoText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
infoText.top = "20px";
infoText.left = "20px";
infoText.isVisible = true;
advancedTexture.addControl(infoText);

var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

var messageRect = new BABYLON.GUI.Rectangle("messageRect");
messageRect.width = "40%";
messageRect.height = "20%";
messageRect.cornerRadius = 20;
messageRect.color = "white";
messageRect.thickness = 4;
messageRect.background = "rgba(0, 0, 0, 0.7)";
messageRect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
messageRect.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
messageRect.isVisible = false;
advancedTexture.addControl(messageRect);

var messageText = new BABYLON.GUI.TextBlock("messageText");
messageText.text = "";
messageText.color = "white";
messageText.fontSize = 24;
messageText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
messageText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
messageText.resizeToFit = true;
messageText.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
messageText.paddingLeft = "5%";
messageText.paddingRight = "5%";
messageRect.addControl(messageText);

// Create a container for the move history
var moveHistoryContainer = new BABYLON.GUI.Rectangle("moveHistoryContainer");
moveHistoryContainer.width = "100px";
moveHistoryContainer.height = "200px";
moveHistoryContainer.background = "rgba(0, 0, 0, 0.7)";
moveHistoryContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
moveHistoryContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
moveHistoryContainer.top = "80px";
moveHistoryContainer.left = "20px";
advancedTexture.addControl(moveHistoryContainer);

// Create a scroll viewer for the move history
var moveHistoryViewer = new BABYLON.GUI.ScrollViewer("moveHistoryViewer");
moveHistoryViewer.width = "100%";
moveHistoryViewer.height = "100%";
moveHistoryContainer.addControl(moveHistoryViewer);


// Create a text block to display the move history
var moveHistoryText = new BABYLON.GUI.TextBlock("moveHistoryText");
moveHistoryText.text = "";
moveHistoryText.color = "white";
moveHistoryText.fontSize = 16;
moveHistoryText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
moveHistoryText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
moveHistoryText.resizeToFit = true;
moveHistoryText.textWrapping = BABYLON.GUI.TextWrapping.WordWrap;
moveHistoryViewer.addControl(moveHistoryText);



    // Define colors for each face of the bright cube
    var brightFaceColors = [
        new BABYLON.Color3(1, 0, 0), // Red
        new BABYLON.Color3(0, 1, 0), // Green
        new BABYLON.Color3(0, 0, 1), // Blue
        new BABYLON.Color3(1, 1, 0), // Yellow
        new BABYLON.Color3.FromInts(50, 20, 15), // Dark Magenta
        new BABYLON.Color3(0, 1, 1) // Cyan
    ];

    // Define paler colors for each face of the pale cube
    var paleFaceColors = [
        new BABYLON.Color3(1, 0.8, 0.8), // Pale Red
        new BABYLON.Color3(0.8, 1, 0.8), // Pale Green
        new BABYLON.Color3(0.8, 0.8, 1), // Pale Blue
        new BABYLON.Color3(1, 1, 0.8), // Pale Yellow
        new BABYLON.Color3.FromInts(240, 230, 140), // Pale Magenta
        new BABYLON.Color3(0.8, 1, 1) // Pale Cyan
    ];




    // Create the first checkerboard with a 7x7 pattern
    var cubes = [];
    var instanceNames = "";
    for (var i = 1; i < 8; i++) {
        for (var j = 1; j < 8; j++) {
            var cubeName = `b${i}-${j}`;
            var cube = BABYLON.MeshBuilder.CreateBox(cubeName, { size: 1 }, scene);
            // Create a multi-material for the cube
            var multiMaterial = new BABYLON.MultiMaterial(`multiMaterial_${i}-${j}`, scene);
            // Create materials for each face and assign them to the multi-material
            for (var k = 0; k < 6; k++) {
                var material = new BABYLON.StandardMaterial(`material_${i}-${j}-${k}`, scene);
                material.diffuseColor = ((i + j) % 2 === 0) ? brightFaceColors[k] : paleFaceColors[k];
                multiMaterial.subMaterials.push(material);
            }
            // Apply the multi-material to the cube
            cube.material = multiMaterial;
            // Apply the face UVs to the cube
            cube.subMeshes = [];
            var verticesCount = cube.getTotalVertices();
            for (var k = 0; k < 6; k++) {
                new BABYLON.SubMesh(k, 0, verticesCount, k * 6, 6, cube);
            }
            cube.position.x = 6 - (i - 1) + 0.5; // Adjust the x position
            cube.position.z = 6 - (j - 1) + 0.5; // Adjust the z position
            cube.position.y = -0.25; // Adjust the y position
            cube.scaling.y = 0.5; // Scale the cubes by 0.5 in the y-direction
            cubes.push(cube);
            cube.parent = boardContainer;
            instanceNames += cubeName + " ";
            // Add a line break after every 3 instances
            if ((j + 1) % 3 === 0) {
                instanceNames += "\n";
            }
        }
    }

    // Create the second checkerboard at right angles to the first one
    for (var i = 1; i < 8; i++) {
        for (var j = 1; j < 8; j++) {
            var cube;
            var cubeName;
            if ((i + j) % 2 === 0) {
                cubeName = `y${i}-${j}`;
                cube = BABYLON.MeshBuilder.CreateBox(cubeName, { size: 1 }, scene);
                // Create a multi-material for the cube
                var multiMaterial = new BABYLON.MultiMaterial(`cubeMultiMaterial_${i}-${j}`, scene);
                // Create materials for each face and assign them to the multi-material
                for (var k = 0; k < 6; k++) {
                    var material = new BABYLON.StandardMaterial(`material_${i}-${j}-${k}`, scene);
                    material.diffuseColor = brightFaceColors[k];
                    multiMaterial.subMaterials.push(material);
                }
                // Apply the multi-material to the cube
                cube.material = multiMaterial;
            } else {
                cubeName = `y${i}-${j}`;
                cube = BABYLON.MeshBuilder.CreateBox(cubeName, { size: 1 }, scene);
                // Create a multi-material for the cube
                var multiMaterial = new BABYLON.MultiMaterial(`cubeMultiMaterial_${i}-${j}`, scene);
                // Create materials for each face and assign them to the multi-material
                for (var k = 0; k < 6; k++) {
                    var material = new BABYLON.StandardMaterial(`material_${i}-${j}-${k}`, scene);
                    material.diffuseColor = paleFaceColors[k];
                    multiMaterial.subMaterials.push(material);
                }
                // Apply the multi-material to the cube
                cube.material = multiMaterial;
            }
            // Apply the face UVs to the cube
            cube.subMeshes = [];
            var verticesCount = cube.getTotalVertices();
            for (var k = 0; k < 6; k++) {
                new BABYLON.SubMesh(k, 0, verticesCount, k * 6, 6, cube);
            }
            cube.position.x = -0.25; // Set the x position to align with the back row of the first checkerboard
            cube.position.z = 6 - (i - 1) + 0.5; // Adjust the z position
            cube.position.y = 6 - (j - 1) + 0.5; // Adjust the y position
            cube.scaling.y = 0.5; // Scale the cubes by 0.5 in the x-direction
            cube.rotation.z = -Math.PI / 2; // Rotate the cubes by 90 degrees around the z-axis
            cubes.push(cube);
            cube.parent = boardContainer;
            instanceNames += cubeName + " ";

            // Add a line break after every 3 instances
            if ((j + 1) % 3 === 0) {
                instanceNames += "\n";
            }

        }
    }

    // Create the third checkerboard at right angles to both existing ones
    for (var i = 1; i < 8; i++) {
        for (var j = 1; j < 8; j++) {
            var cube;
            var cubeName;
            if ((i + j) % 2 === 0) {
                cubeName = `g${8 - i}-${8 - j}`;
                cube = BABYLON.MeshBuilder.CreateBox(cubeName, { size: 1 }, scene);
                // Create a multi-material for the cube
                var multiMaterial = new BABYLON.MultiMaterial(`cubeMultiMaterial_${i}-${j}`, scene);
                // Create materials for each face and assign them to the multi-material
                for (var k = 0; k < 6; k++) {
                    var material = new BABYLON.StandardMaterial(`material_${i}-${j}-${k}`, scene);
                    material.diffuseColor = brightFaceColors[k];
                    multiMaterial.subMaterials.push(material);
                }
                // Apply the multi-material to the cube
                cube.material = multiMaterial;
            } else {
                cubeName = `g${8 - i}-${8 - j}`;
                cube = BABYLON.MeshBuilder.CreateBox(cubeName, { size: 1 }, scene);
                // Create a multi-material for the cube
                var multiMaterial = new BABYLON.MultiMaterial(`cubeMultiMaterial_${i}-${j}`, scene);
                // Create materials for each face and assign them to the multi-material
                for (var k = 0; k < 6; k++) {
                    var material = new BABYLON.StandardMaterial(`material_${i}-${j}-${k}`, scene);
                    material.diffuseColor = paleFaceColors[k];
                    multiMaterial.subMaterials.push(material);
                }
                // Apply the multi-material to the cube
                cube.material = multiMaterial;
            }
            // Apply the face UVs to the cube
            cube.subMeshes = [];
            var verticesCount = cube.getTotalVertices();
            for (var k = 0; k < 6; k++) {
                new BABYLON.SubMesh(k, 0, verticesCount, k * 6, 6, cube);
            }
            cube.position.x = j; // Adjust the x position
            cube.position.z = -0.25; // Set the z position to align with the left side of the "b" board
            cube.position.y = i; // Adjust the y position
            cube.scaling.y = 0.5; // Scale the cubes by 0.5 in the z-direction
            cube.rotation.x = Math.PI / 2; // Rotate the cubes by 90 degrees around the y-axis
            cube.position.y -= 0.5;
            cube.position.x -= 0.5;

            cubes.push(cube);
            cube.parent = boardContainer;
            instanceNames += cubeName + " ";

            // Add a line break after every 3 instances
            if ((j + 1) % 3 === 0) {
                instanceNames += "\n";
            }
        }
    }

    var mainBoardCubes = {};
    for (var i = 0; i < cubes.length; i++) {
        var cube = cubes[i];
        mainBoardCubes[cube.name] = cube;
    }



    //OTHER BOARD STRUCTURE
    // Create the back panels
    var backPanelWidth = 7.55;
    var backPanelHeight = 7.55;
    var backPanelThickness = 0.05;
    var backPanelMaterial = new BABYLON.StandardMaterial("backPanelMaterial", scene);
    backPanelMaterial.diffuseColor = BABYLON.Color3.FromInts(88, 54, 41);

    function createBackPanel(position, rotation) {
        var backPanel = BABYLON.MeshBuilder.CreateBox("backPanel",
            { width: backPanelWidth, height: backPanelHeight, depth: backPanelThickness }, scene);
        backPanel.material = backPanelMaterial;
        backPanel.position = position;
        backPanel.rotation = rotation;
        backPanel.parent = boardContainer;
    }

    createBackPanel(new BABYLON.Vector3(3.22, -0.525, 3.22), new BABYLON.Vector3(Math.PI / 2, 0, 0));
    createBackPanel(new BABYLON.Vector3(-0.525, 3.22, 3.22), new BABYLON.Vector3(0, Math.PI / 2, 0));
    createBackPanel(new BABYLON.Vector3(3.22, 3.22, -0.525), new BABYLON.Vector3(0, 0, Math.PI / 2));


    // Create the edge strips
    var edgeStripWidth = 0.55;
    var edgeStripHeight = 7.6;
    var edgeStripThickness = 0.05;
    var edgeStripMaterial = new BABYLON.StandardMaterial("edgeStripMaterial", scene);
    edgeStripMaterial.diffuseColor = BABYLON.Color3.FromInts(8, 64, 0); // Green Team Colour;

    function createEdgeStrip(position, rotation) {
        var edgeStrip = BABYLON.MeshBuilder.CreateBox("edgeStrip",
            { width: edgeStripWidth, height: edgeStripHeight, depth: edgeStripThickness }, scene);
        edgeStrip.material = edgeStripMaterial;
        edgeStrip.position = position;
        edgeStrip.rotation = rotation;
        edgeStrip.parent = boardContainer;
    }
    createEdgeStrip(new BABYLON.Vector3(7.025, -.275, 3.25), new BABYLON.Vector3(0, Math.PI / 2, Math.PI / 2));
    createEdgeStrip(new BABYLON.Vector3(3.25, -0.275, 7.025), new BABYLON.Vector3(0, 0, Math.PI / 2));
    createEdgeStrip(new BABYLON.Vector3(-0.275, 3.25, 7.025), new BABYLON.Vector3(0, 0, 0));
    createEdgeStrip(new BABYLON.Vector3(-0.275, 7.025, 3.25), new BABYLON.Vector3(Math.PI / 2, 0, 0));
    createEdgeStrip(new BABYLON.Vector3(3.25, 7.025, -.275), new BABYLON.Vector3(Math.PI / 2, 0, Math.PI / 2));
    createEdgeStrip(new BABYLON.Vector3(7.025, 3.25, -.275), new BABYLON.Vector3(0, Math.PI / 2, 0));


    // MAKING THE PLAYING PIECES

    // Create materials for the cylinder
    var brownMaterial = new BABYLON.StandardMaterial("brownMaterial", scene);
    brownMaterial.diffuseColor = BABYLON.Color3.FromInts(88, 54, 41); // Brown

    var owlMat = new BABYLON.StandardMaterial("owlMat", scene);
    owlMat.diffuseColor = BABYLON.Color3.FromInts(204, 153, 102); // Owl Color

    var kiteMat = new BABYLON.StandardMaterial("kiteMat", scene);
    kiteMat.diffuseColor = BABYLON.Color3.FromInts(139, 0, 0); // Kite Color

    var ravenMat = new BABYLON.StandardMaterial("ravenMat", scene);
    ravenMat.diffuseColor = BABYLON.Color3.FromInts(10, 10, 10); // Raven Color

    var brownTeamMat = new BABYLON.StandardMaterial("brownTeamMat", scene);
    brownTeamMat.diffuseColor = BABYLON.Color3.FromInts(88, 54, 41); // Brown Team Color

    var yellowTeamMat = new BABYLON.StandardMaterial("yellowTeamMat", scene);
    yellowTeamMat.diffuseColor = BABYLON.Color3.FromInts(255, 204, 0); // Yellow Team Color

    var greenTeamMat = new BABYLON.StandardMaterial("greenTeamMat", scene);
    greenTeamMat.diffuseColor = BABYLON.Color3.FromInts(8, 64, 0); // Green Team Color

    // Create the multimeshes for the cylinders
    function createMeshWithMultiMaterial(name, material, teamMaterial, scene) {
        var mesh = BABYLON.MeshBuilder.CreateCylinder(name, { height: 7, diameter: 0.5, subdivisions: 7 }, scene);
        var multiMaterial = new BABYLON.MultiMaterial("multiMaterial_" + name, scene);

        // Create sub-materials
        for (var i = 0; i < 6; i++) {
            multiMaterial.subMaterials.push(material);
        }
        multiMaterial.subMaterials.push(teamMaterial); // Bottom section
        multiMaterial.subMaterials.push(teamMaterial); // Top section

        // Apply multi-material to mesh
        mesh.material = multiMaterial;

        // Define sub-meshes
        mesh.subMeshes = [];
        var verticesCount = mesh.getTotalVertices();
        for (var j = 0; j < 8; j++) {
            var start = j * 144;
            new BABYLON.SubMesh(j, 0, verticesCount, start, 144, mesh);
        }

        mesh.parent = boardContainer;
        return mesh;
    }
    var brownOwl = createMeshWithMultiMaterial("brownOwl", owlMat, brownTeamMat, scene);
    brownOwl.parent = boardContainer;
    var brownKite = createMeshWithMultiMaterial("brownKite", kiteMat, brownTeamMat, scene);
    brownKite.parent = boardContainer;
    var brownRaven = createMeshWithMultiMaterial("brownRaven", ravenMat, brownTeamMat, scene);
    brownRaven.parent = boardContainer;
    var yellowOwl = createMeshWithMultiMaterial("yellowOwl", owlMat, yellowTeamMat, scene);
    yellowOwl.parent = boardContainer;
    var yellowKite = createMeshWithMultiMaterial("yellowKite", kiteMat, yellowTeamMat, scene);
    yellowKite.parent = boardContainer;
    var yellowRaven = createMeshWithMultiMaterial("yellowRaven", ravenMat, yellowTeamMat, scene);
    yellowRaven.parent = boardContainer;
    var greenOwl = createMeshWithMultiMaterial("greenOwl", owlMat, greenTeamMat, scene);
    greenOwl.parent = boardContainer;
    var greenKite = createMeshWithMultiMaterial("greenKite", kiteMat, greenTeamMat, scene);
    greenKite.parent = boardContainer;
    var greenRaven = createMeshWithMultiMaterial("greenRaven", ravenMat, greenTeamMat, scene);
    greenRaven.parent = boardContainer;

    // THE OWL SQUARES - MARKED BY TORUSES

    // Place a flattened torus on top of the cube named "b7-1"
    var targetCube1 = cubes.find(cube => cube.name === "b7-1");
    if (targetCube1) {
        var torus1 = BABYLON.MeshBuilder.CreateTorus("torus1", {
            diameter: 0.75,
            thickness: 0.1,
            tessellation: 32
        }, scene);
        torus1.position.x = targetCube1.position.x;
        torus1.position.y = targetCube1.position.y + 0.25; // Adjust the height above the cube
        torus1.position.z = targetCube1.position.z;
        torus1.rotation = targetCube1.rotation.clone();
        torus1.material = brownTeamMat; // Use the same material as the brown owlHalla cubes
        torus1.parent = boardContainer;
    }

    // Place a flattened torus on top of the cube named "y7-1"
    var targetCube2 = cubes.find(cube => cube.name === "y7-1");
    if (targetCube2) {
        var torus2 = BABYLON.MeshBuilder.CreateTorus("torus_y7-1", {
            diameter: 0.75,
            thickness: 0.1,
            tessellation: 32
        }, scene);
        torus2.position.x = targetCube2.position.x + 0.25; // Adjust the height above the cube
        torus2.position.y = targetCube2.position.y;
        torus2.position.z = targetCube2.position.z;
        torus2.rotation = targetCube2.rotation.clone();
        torus2.material = yellowTeamMat; // Use the same material as the yellow owlHalla cubes
        torus2.parent = boardContainer;
    }

    // Place a flattened torus on top of the cube named "g7-1"
    var targetCube3 = cubes.find(cube => cube.name === "g7-1");
    if (targetCube3) {
        var torus3 = BABYLON.MeshBuilder.CreateTorus("torus_g7-1", {
            diameter: 0.75,
            thickness: 0.1,
            tessellation: 32
        }, scene);
        torus3.position.x = targetCube3.position.x;
        torus3.position.y = targetCube3.position.y;
        torus3.position.z = targetCube3.position.z + 0.25; // Adjust the height above the cube
        torus3.rotation = targetCube3.rotation.clone();
        torus3.material = greenTeamMat; // Use the same material as the green owlHalla cubes
        torus3.parent = boardContainer;
    }


    // STARTING POSITIONS OF THE PLAYING PIECES

    // Set the starting positions of the pieces
    function setPiecePosition(piece, cubes, name, offsetX, offsetY, offsetZ) {
        var cube = cubes.find(cube => cube.name === name);
        piece.position = cube.position.clone().add(new BABYLON.Vector3(offsetX, offsetY, offsetZ));
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


    var gameStateManager = {

        piecePositions: {
            brownOwl: "b7-1",
            brownKite: "b6-2",
            brownRaven: "b5-3",
            yellowOwl: "y7-1",
            yellowKite: "y6-2",
            yellowRaven: "y5-3",
            greenOwl: "g7-1",
            greenKite: "g6-2",
            greenRaven: "g5-3"
        },



        updateShadowedRows: function (excludedPiece) {
            // Reset shadowed rows
            this.shadowedRows = {
                b: [],
                y: [],
                g: []
            };

            // Iterate through each piece
            for (let pieceName in this.piecePositions) {
                let piecePosition = this.piecePositions[pieceName];

                // Skip the excluded piece and pieces on owlHalla squares
                if (pieceName === excludedPiece || piecePosition.includes("--")) {
                    continue;
                }

                let boardColor = piecePosition.charAt(0);
                let row = parseInt(piecePosition.charAt(1));
                let column = parseInt(piecePosition.charAt(3));

                // Update shadowed rows and columns based on the current piece's position
                if (boardColor === 'b') {
                    // Generate shadowed rows for yellow board
                    for (let i = 1; i <= 7; i++) {
                        this.shadowedRows.y.push(`y${column}-${i}`);
                    }
                    // Generate shadowed columns for green board
                    for (let i = 1; i <= 7; i++) {
                        this.shadowedRows.g.push(`g${i}-${row}`);
                    }
                } else if (boardColor === 'y') {
                    // Generate shadowed rows for brown board
                    for (let i = 1; i <= 7; i++) {
                        this.shadowedRows.b.push(`b${i}-${row}`);
                    }
                    // Generate shadowed columns for green board
                    for (let i = 1; i <= 7; i++) {
                        this.shadowedRows.g.push(`g${column}-${i}`);
                    }
                } else if (boardColor === 'g') {
                    // Generate shadowed rows for brown board
                    for (let i = 1; i <= 7; i++) {
                        this.shadowedRows.b.push(`b${column}-${i}`);
                    }
                    // Generate shadowed rows for yellow board
                    for (let i = 1; i <= 7; i++) {
                        this.shadowedRows.y.push(`y${i}-${row}`);
                    }
                }
            }
        },

        updatePiecePosition: function (pieceName, position) {
            this.piecePositions[pieceName] = position;
        },

        moveHistory: [],

        addMoveToHistory: function (piece, sourceSquare, destinationSquare) {
            var abbreviatedPiece = "";
            switch (piece) {
                case "brownOwl":
                    abbreviatedPiece = "bO";
                    break;
                case "brownKite":
                    abbreviatedPiece = "bK";
                    break;
                case "brownRaven":
                    abbreviatedPiece = "bR";
                    break;
                case "yellowOwl":
                    abbreviatedPiece = "yO";
                    break;
                case "yellowKite":
                    abbreviatedPiece = "yK";
                    break;
                case "yellowRaven":
                    abbreviatedPiece = "yR";
                    break;
                case "greenOwl":
                    abbreviatedPiece = "gO";
                    break;
                case "greenKite":
                    abbreviatedPiece = "gK";
                    break;
                case "greenRaven":
                    abbreviatedPiece = "gR";
                    break;
            }

            var formattedDestination = destinationSquare.replace("-", "");

            this.moveHistory.push(`${abbreviatedPiece} - ${formattedDestination}`);

            /*// Limit the move history to the last 9 moves
            if (this.moveHistory.length > 9) {
                this.moveHistory.shift();
            }
            */

            this.updateMoveHistoryDisplay();
        },

        updateMoveHistoryDisplay: function () {
            var moveHistoryText = moveHistoryViewer.getChildByName("moveHistoryText");
            moveHistoryText.text = this.moveHistory.join("\n");
        }



    }



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
        var easingFunction = new BABYLON.CubicEase();
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

        BABYLON.Animation.CreateAndStartAnimation("pieceAnimation", piece, "position", 60, duration, piece.position, targetPosition, 0, easingFunction, onAnimationEnd);
        BABYLON.Animation.CreateAndStartAnimation("pieceRotationAnimation", piece, "rotation", 60, duration, piece.rotation, targetRotation, 0, easingFunction);
    }

    function addCubeClickListener(cube) {
        cube.actionManager = new BABYLON.ActionManager(scene);
        cube.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
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
                            offsetVector = new BABYLON.Vector3(0, 3.75, 0);
                        } else if (cube.name.startsWith("y")) {
                            // Cube is on the yellow checkerboard
                            offsetVector = new BABYLON.Vector3(3.75, 0, 0);
                        } else if (cube.name.startsWith("g")) {
                            // Cube is on the green checkerboard
                            offsetVector = new BABYLON.Vector3(0, 0, 3.75);
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
            cube.position = new BABYLON.Vector3(i - 0.5, -0.25, 8.5);
            cube.material = brownTeamMat;
            cube.visibility = false;
            cube.parent = boardContainer;
            owlHallaCubes.push(cube);
        }

        // Clone and position the owlHalla cubes for the yellow side
        for (var i = 1; i <= 3; i++) {
            var cubeName = "y" + (8 - i) + "--1";
            var cube = mainBoardCubes["y" + (8 - i) + "-1"].clone(cubeName);
            cube.position = new BABYLON.Vector3(-0.25, 8.5, i - 0.5);
            cube.material = yellowTeamMat;
            cube.visibility = false;
            cube.parent = boardContainer;
            owlHallaCubes.push(cube);
        }

        // Clone and position the owlHalla cubes for the green side
        for (var i = 1; i <= 3; i++) {
            var cubeName = "g" + (8 - i) + "--1";
            var cube = mainBoardCubes["g" + (8 - i) + "-1"].clone(cubeName);
            cube.position = new BABYLON.Vector3(8.5, i - 0.5, -0.25);
            cube.material = greenTeamMat;
            cube.visibility = false;
            cube.parent = boardContainer;
            owlHallaCubes.push(cube);
        }

        return owlHallaCubes;
    }

    var owlHallaCubes = createOwlHallaCubes(mainBoardCubes);

    // Create action manager for edge strips
    var edgeStripActionManager = new BABYLON.ActionManager(scene);

    // Register action for click event on edge strips
    edgeStripActionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickDownTrigger,
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
        var actionManager = new BABYLON.ActionManager(scene);

        actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                function () {
                    handlePieceSingleClick(piece);
                }
            )
        );

        actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnDoublePickTrigger,
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
    var xAxis = BABYLON.Mesh.CreateLines("xAxis", [
        new BABYLON.Vector3(-5, 0, 0),
        new BABYLON.Vector3(5, 0, 0)
    ], scene);
    xAxis.color = new BABYLON.Color3(1, 0, 0); // Red
    
    // Add y-axis (green)
    var yAxis = BABYLON.Mesh.CreateLines("yAxis", [
        new BABYLON.Vector3(0, -5, 0),
        new BABYLON.Vector3(0, 5, 0)
    ], scene);
    yAxis.color = new BABYLON.Color3(0, 1, 0); // Green
    
    // Add z-axis (blue)
    var zAxis = BABYLON.Mesh.CreateLines("zAxis", [
        new BABYLON.Vector3(0, 0, -5),
        new BABYLON.Vector3(0, 0, 5)
    ], scene);
    zAxis.color = new BABYLON.Color3(0, 0, 1); // Blue
    */
    return scene;
};

//Make the createScene function globally accessible
window.createScene = createScene;