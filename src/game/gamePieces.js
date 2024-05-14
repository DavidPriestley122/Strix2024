import { Mesh, MeshBuilder, Vector3, Color3, StandardMaterial } from "@babylonjs/core";

export function gamePieces(boardContainer,scene) {
    // Create the game pieces
    var brownOwl = MeshBuilder.CreateBox("brownOwl", { size: 1 }, scene);
    var brownKite = MeshBuilder.CreateBox("brownKite", { size: 1 }, scene);
    var brownRaven = MeshBuilder.CreateBox("brownRaven", { size: 1 }, scene);
    var yellowOwl = MeshBuilder.CreateBox("yellowOwl", { size: 1 }, scene);
    var yellowKite = MeshBuilder.CreateBox("yellowKite", { size: 1 }, scene);
    var yellowRaven = MeshBuilder.CreateBox("yellowRaven", { size: 1 }, scene);
    var greenOwl = MeshBuilder.CreateBox("greenOwl", { size: 1 }, scene);
    var greenKite = MeshBuilder.CreateBox("greenKite", { size: 1 }, scene);
    var greenRaven = MeshBuilder.CreateBox("greenRaven", { size: 1 }, scene);

    // Create the materials for the game pieces
    var brownOwlMaterial = new StandardMaterial("brownOwlMaterial", scene);
    brownOwlMaterial.diffuseColor = new Color3(0.8, 0.4, 0.1);
    var brownKiteMaterial = new StandardMaterial("brownKiteMaterial", scene);
    brownKiteMaterial.diffuseColor = new Color3(0.6, 0.3, 0.1);
    var brownRavenMaterial = new StandardMaterial("brownRavenMaterial", scene);
    brownRavenMaterial.diffuseColor = new Color3(0.4, 0.2, 0.1);
    var yellowOwlMaterial = new StandardMaterial("yellowOwlMaterial", scene);
    yellowOwlMaterial.diffuseColor = new Color3(1, 1, 0);
    var yellowKiteMaterial = new StandardMaterial("yellowKiteMaterial", scene);
    yellowKiteMaterial.diffuseColor = new Color3(0.8, 0.8, 0);
    var yellowRavenMaterial = new StandardMaterial("yellowRavenMaterial", scene);
    yellowRavenMaterial.diffuseColor = new Color3(0.6, 0.6, 0);
    var greenOwlMaterial = new StandardMaterial("greenOwlMaterial", scene);
    greenOwlMaterial.diffuseColor = new Color3(0, 0.8, 0);
    var greenKiteMaterial = new StandardMaterial("greenKiteMaterial", scene);
    greenKiteMaterial.diffuseColor = new Color3(0, 0.6, 0);
    var greenRavenMaterial = new StandardMaterial("greenRavenMaterial", scene);
    greenRavenMaterial.diffuseColor = new Color3(0, 0.4, 0);

    // Apply the materials to the game pieces
    brownOwl.material = brownOwlMaterial;
    brownKite.material = brownKiteMaterial;
    brownRaven.material = brownRavenMaterial;
    yellowOwl.material = yellowOwlMaterial;
    yellowKite.material = yellowKiteMaterial;
    yellowRaven.material = yellowRavenMaterial;
    greenOwl.material = greenOwlMaterial;
    greenKite.material = greenKiteMaterial;
    greenRaven.material = greenRavenMaterial;

    // Set the parent of the game pieces to the board container
    brownOwl.parent = boardContainer;
    brownKite.parent = boardContainer;
    brownRaven.parent = boardContainer;
    yellowOwl.parent = boardContainer;
    yellowKite.parent = boardContainer;
    yellowRaven.parent = boardContainer;
    greenOwl.parent = boardContainer;
    greenKite.parent = boardContainer;
    greenRaven.parent = boardContainer;
}