
import { Mesh, Vector3, Color3, StandardMaterial, ActionManager, ExecuteCodeAction, Matrix, VertexData } from "@babylonjs/core";

export function createBaseAndFins(scene) {
    // THE BASE

    // Create the hexagonal base
    var baseSideLength = 3.91;
    var baseRadius = baseSideLength;
    var baseThickness = 0.5;

    var baseVertices = [];
    var baseIndices = [];

    for (var i = 0; i < 6; i++) {
        var angle = i * Math.PI / 3;
        var x = baseRadius * Math.cos(angle);
        var z = baseRadius * Math.sin(angle);
        baseVertices.push(x, 0, z);
    }

    // Add vertices for the side faces
    for (var i = 0; i < 6; i++) {
        var angle = i * Math.PI / 3;
        var x = baseRadius * Math.cos(angle);
        var z = baseRadius * Math.sin(angle);
        baseVertices.push(x, -baseThickness, z);
        baseVertices.push(x, 0, z);
    }

    // Create triangles for the top face
    for (var i = 0; i < 4; i++) {
        baseIndices.push(0, i + 1, i + 2);
    }
    baseIndices.push(0, 5, 1);

    // Create triangles for the side faces
    baseIndices.push(6, 8, 7);
    baseIndices.push(7, 8, 9);

    baseIndices.push(8, 10, 9);
    baseIndices.push(9, 10, 11);

    baseIndices.push(10, 12, 11);
    baseIndices.push(11, 12, 13);

    baseIndices.push(12, 14, 13);
    baseIndices.push(13, 14, 15);

    baseIndices.push(14, 16, 15);
    baseIndices.push(15, 16, 17);

    baseIndices.push(16, 6, 17);
    baseIndices.push(17, 6, 7);

    // Create triangles for the base (bottom face)
    for (var i = 0; i < 5; i++) {
        baseIndices.push(6, 8 + (i * 2 + 2) % 12, 8 + i * 2);
    }
    baseIndices.push(6, 8, 16);

    var baseMesh = new Mesh("base", scene);
    var baseVertexData = new VertexData();
    baseVertexData.positions = baseVertices;
    baseVertexData.indices = baseIndices;
    baseVertexData.applyToMesh(baseMesh);

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


// THE FINS FOR THE BASE

var finHeight = 4.79;
var finBaseLength = 3.386;
var finThickness = 0.5;

var finMaterial = new StandardMaterial("finMaterial", scene);
finMaterial.diffuseColor = Color3.FromInts(88, 54, 41);

function createFin(name, rotation, translation) {
    var finVertices = [
        0, 0, 0,                            // Vertex 0: obtuse angle, on plane
        finBaseLength, 0, 0,                // Vertex 1: right angle, on plane
        finBaseLength, 0, finHeight,        // Vertex 2: acute angle, on plane
        0, -finThickness, 0,                // Vertex 3: obtuse angle, below plane
        finBaseLength, -finThickness, 0,               // Vertex 4: right angle, below plane
        finBaseLength, -finThickness, finHeight,     // Vertex 5: acute angle, below plane
    ];

    var finIndices = [
        0, 1, 2,    // Triangle 1: Front face
        3, 4, 0,    // Triangle 2: Front side, lower
        4, 1, 0,    // Triangle 3: Front side, upper
        4, 5, 2,    // Triangle 4: Right side, lower
        4, 2, 1,    // Triangle 5: Right side, upper
        5, 3, 2,    // Triangle 6: Left side, lower
        2, 3, 0,    // Triangle 7: Left side, upper
        3, 5, 4,    // Triangle 8: Bottom face 
    ];

    var fin = new Mesh(name, scene);
    var finVertexData = new VertexData();
    finVertexData.positions = finVertices;
    finVertexData.indices = finIndices;
    finVertexData.applyToMesh(fin);
    fin.material = finMaterial;
    fin.visibility = 1;


    fin.rotation.x = -Math.PI / 2;
    fin.rotation.y = rotation;
    fin.parent = baseMesh;
    fin.position.addInPlace(translation);
    return fin;
}

/*var fin1 = createFin("fin1", Math.PI / 6, new Vector3(0.15, 0, -0.22));

var fin2 = createFin("fin2", Math.PI * 5 / 6, new Vector3(-0.2, 0, 0));

var fin3 = createFin("fin3", -Math.PI / 2, new Vector3(0.1, 0, 0.26));
*/

/*var finOffset = finThickness / 2;
var finApothem = (Math.sqrt(3) / 4) * finThickness;

var fin1 = createFin("fin1", Math.PI / 6, new Vector3(0, 0, -finOffset));
*/
var finOffset = finThickness / 2;
//var fin1 = createFin("fin1", Math.PI / 6, new Vector3(finOffset * Math.cos(Math.PI / 6), 0.51, -finOffset * Math.sin(Math.PI / 6)));



var fin1 = createFin("fin1", Math.PI / 6, new Vector3(finOffset * Math.cos(Math.PI / 6), 0, -finOffset * Math.sin(Math.PI / 6)));
var fin2 = createFin("fin2", Math.PI * 5 / 6, new Vector3(finOffset * Math.cos(Math.PI * 5 / 6), 0, -finOffset * Math.sin(Math.PI * 5 / 6)));
var fin3 = createFin("fin3", -Math.PI / 2, new Vector3(finOffset * Math.cos(-Math.PI / 2), 0, -finOffset * Math.sin(-Math.PI / 2)));














/*
var fin1 = createFin("fin1", Math.PI / 6, new Vector3(0.15, 0, -0.22));
fin1.rotation.y = Math.PI / 6;
var translationVector = new Vector3(0, 0, 0);
var rotationMatrix = Matrix.RotationY(Math.PI / 3);
var rotatedTranslationVector = Vector3.TransformCoordinates(translationVector, rotationMatrix);
fin1.position.addInPlace(rotatedTranslationVector);


var fin2 = createFin("fin2", Math.PI * 5 / 6, new Vector3(-0.2, 0, 0));
fin2.rotation.y = Math.PI * 5 / 6;
translationVector = new Vector3(0, 0, 0);
rotationMatrix = Matrix.RotationY(Math.PI / 3);
rotatedTranslationVector = Vector3.TransformCoordinates(translationVector, rotationMatrix);
fin2.position.addInPlace(rotatedTranslationVector);

var fin3 = createFin("fin3", -Math.PI / 2, new Vector3(0.1, 0, 0.26));
fin3.rotation.y = -Math.PI / 2;
translationVector = new Vector3(0, 0, 0);
rotationMatrix = Matrix.RotationY(Math.PI / 3);
rotatedTranslationVector = Vector3.TransformCoordinates(translationVector, rotationMatrix);
fin3.position.addInPlace(rotatedTranslationVector);
*/

};





























































































/*import { MeshBuilder, Vector3, Color3, StandardMaterial, ActionManager, ExecuteCodeAction, Matrix, Mesh } from "@babylonjs/core";
import * as earcut from "earcut";

export function createBaseAndFins(scene, boardContainer) {
 
 
 
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

    var baseMesh = MeshBuilder.ExtrudePolygon("base", baseOptions, scene, earcut);
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
}
*/