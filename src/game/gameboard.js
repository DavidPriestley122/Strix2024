 
 import { Mesh, MeshBuilder, Vector3, Color3, StandardMaterial, ActionManager, ExecuteCodeAction, Matrix } from "@babylonjs/core";

 export var baseMesh, fin1, fin2, fin3;
 
 (function () {
 
 
 
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
        baseShape.push(new Vector3(x, 0, z));
    }
    baseShape.push(baseShape[0]);

    var baseOptions = {
        shape: baseShape,
        depth: baseThickness,
        sideOrientation: Mesh.DOUBLESIDE
    };

    var baseMesh = MeshBuilder.ExtrudePolygon("base", baseOptions, scene);
    baseMesh.visibility = 1;

    // Create a material for the base
    var baseMaterial = new StandardMaterial("baseMaterial", scene);
    baseMaterial.diffuseColor = Color3.FromInts(88, 54, 41);
    baseMesh.material = baseMaterial;

    // Rotate the base by 30 degrees in the plane
    baseMesh.rotation.y = Math.PI / 3;
    baseMesh.position.y += 0.51;

    baseMesh.actionManager = new ActionManager(scene);
    baseMesh.actionManager.registerAction(
        new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
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

    var finMaterial = new StandardMaterial("finMaterial", scene);
    finMaterial.diffuseColor = new Color3(0.8, 0.8, 0.8);


    var finShape = [
        new Vector3(0, 0, 0),
        new Vector3(finBaseLength, 0, 0),
        new Vector3(finBaseLength, 0, finHeight),
        new Vector3(0, 0, 0)
    ];

    var finOptions = {
        shape: finShape,
        depth: finThickness,
        sideOrientation: Mesh.DOUBLESIDE
    };

    var fin1 = MeshBuilder.ExtrudePolygon("fin1", finOptions, scene);
    fin1.material = baseMaterial;
    fin1.visibility = 1;
    fin1.rotation.x = -Math.PI / 2;
    fin1.rotation.y = Math.PI / 6;
    fin1.parent = baseMesh;
    // Calculate the translation vector in the rotated coordinate system
    var translationVector = new Vector3(0.15, 0, -0.22);
    var rotationMatrix = Matrix.RotationY(Math.PI / 3);
    var rotatedTranslationVector = Vector3.TransformCoordinates(translationVector, rotationMatrix);
    // Apply the translation to the fin
    fin1.position.addInPlace(rotatedTranslationVector);

    // Create the second fin
    var fin2 = MeshBuilder.ExtrudePolygon("fin2", finOptions, scene);
    fin2.material = baseMaterial;
    fin2.visibility = 1;
    fin2.rotation.x = -Math.PI / 2;
    fin2.rotation.y = Math.PI * 5 / 6;
    fin2.parent = baseMesh;
    // Calculate the translation vector in the rotated coordinate system
    var translationVector = new Vector3(-0.2, 0, 0);
    var rotationMatrix = Matrix.RotationY(Math.PI / 3);
    var rotatedTranslationVector = Vector3.TransformCoordinates(translationVector, rotationMatrix);
    // Apply the translation to the fin
    fin2.position.addInPlace(rotatedTranslationVector);


    // Create the third fin
    var fin3 = MeshBuilder.ExtrudePolygon("fin3", finOptions, scene);
    fin3.material = baseMaterial;
    fin3.visibility = 1;
    fin3.rotation.x = -Math.PI / 2;
    fin3.rotation.y = -Math.PI / 2;
    fin3.parent = baseMesh;
    // Calculate the translation vector in the rotated coordinate system
    var translationVector = new Vector3(0.1, 0, 0.26);
    var rotationMatrix = Matrix.RotationY(Math.PI / 3);
    var rotatedTranslationVector = Vector3.TransformCoordinates(translationVector, rotationMatrix);
    // Apply the translation to the fin
    fin3.position.addInPlace(rotatedTranslationVector);

})();
