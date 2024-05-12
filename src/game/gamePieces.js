import {
    Color3,
    Mesh,
    MeshBuilder,
    MultiMaterial,
    StandardMaterial,
    SubMesh,
} from "@babylonjs/core";

export var brownOwl, brownKite, brownRaven, yellowOwl, yellowKite, yellowRaven, greenOwl, greenKite, greenRaven;

(function (boardContainer) {
// MAKING THE PLAYING PIECES

// Create materials for the cylinder
var brownMaterial = new StandardMaterial("brownMaterial", scene);
brownMaterial.diffuseColor = Color3.FromInts(88, 54, 41); // Brown

var owlMat = new StandardMaterial("owlMat", scene);
owlMat.diffuseColor = Color3.FromInts(204, 153, 102); // Owl Color

var kiteMat = new StandardMaterial("kiteMat", scene);
kiteMat.diffuseColor = Color3.FromInts(139, 0, 0); // Kite Color

var ravenMat = new StandardMaterial("ravenMat", scene);
ravenMat.diffuseColor = Color3.FromInts(10, 10, 10); // Raven Color

var brownTeamMat = new StandardMaterial("brownTeamMat", scene);
brownTeamMat.diffuseColor = Color3.FromInts(88, 54, 41); // Brown Team Color

var yellowTeamMat = new StandardMaterial("yellowTeamMat", scene);
yellowTeamMat.diffuseColor = Color3.FromInts(255, 204, 0); // Yellow Team Color

var greenTeamMat = new StandardMaterial("greenTeamMat", scene);
greenTeamMat.diffuseColor = Color3.FromInts(8, 64, 0); // Green Team Color

// Create the multimeshes for the cylinders
function createMeshWithMultiMaterial(name, material, teamMaterial, scene) {
    var mesh = MeshBuilder.CreateCylinder(name, { height: 7, diameter: 0.5, subdivisions: 7 }, scene);
    var multiMaterial = new MultiMaterial("multiMaterial_" + name, scene);

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
        new SubMesh(j, 0, verticesCount, start, 144, mesh);
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

})(boardContainer);