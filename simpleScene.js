function createScene(engine, canvas) {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
  
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


  
    return scene;
}

    