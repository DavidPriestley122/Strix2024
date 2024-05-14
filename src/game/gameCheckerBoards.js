import { Color3, Mesh, MeshBuilder, MultiMaterial, StandardMaterial, SubMesh, Vector3 } from "@babylonjs/core";

export function gameCheckerBoards(boardContainer,scene) {
  // Define colors for each face of the bright cube
  var brightFaceColors = [
    new Color3(1, 0, 0), // Red
    new Color3(0, 1, 0), // Green
    new Color3(0, 0, 1), // Blue
    new Color3(1, 1, 0), // Yellow
    Color3.FromInts(50, 20, 15), // Dark Magenta
    new Color3(0, 1, 1), // Cyan
  ];

  // Define paler colors for each face of the pale cube
  var paleFaceColors = [
    new Color3(1, 0.8, 0.8), // Pale Red
    new Color3(0.8, 1, 0.8), // Pale Green
    new Color3(0.8, 0.8, 1), // Pale Blue
    new Color3(1, 1, 0.8), // Pale Yellow
    Color3.FromInts(240, 230, 140), // Pale Magenta
    new Color3(0.8, 1, 1), // Pale Cyan
  ];

  // Create the first checkerboard with a 7x7 pattern
  var cubes = [];
  for (var i = 1; i < 8; i++) {
    for (var j = 1; j < 8; j++) {
      var cubeName = `b${i}-${j}`;
      var cube = MeshBuilder.CreateBox(cubeName, { size: 1 }, scene);
      // ... rest of the code ...
      cube.parent = boardContainer;
      cubes.push(cube);
    }
  }

  // Create the second checkerboard at right angles to the first one
  for (var i = 1; i < 8; i++) {
    for (var j = 1; j < 8; j++) {
      var cube;
      var cubeName;
      if ((i + j) % 2 === 0) {
        cubeName = `y${i}-${j}`;
        cube = MeshBuilder.CreateBox(cubeName, { size: 1 }, scene);
        // ... rest of the code ...
      } else {
        cubeName = `y${i}-${j}`;
        cube = MeshBuilder.CreateBox(cubeName, { size: 1 }, scene);
        // ... rest of the code ...
      }
      cube.parent = boardContainer;
      cubes.push(cube);
    }
  }

  // Create the third checkerboard at right angles to both existing ones
  for (var i = 1; i < 8; i++) {
    for (var j = 1; j < 8; j++) {
      var cube;
      var cubeName;
      if ((i + j) % 2 === 0) {
        cubeName = `g${8 - i}-${8 - j}`;
        cube = MeshBuilder.CreateBox(cubeName, { size: 1 }, scene);
        // ... rest of the code ...
      } else {
        cubeName = `g${8 - i}-${8 - j}`;
        cube = MeshBuilder.CreateBox(cubeName, { size: 1 }, scene);
        // ... rest of the code ...
      }
      cube.parent = boardContainer;
      cubes.push(cube);
    }
  }

  var mainBoardCubes = {};
  for (var i = 0; i < cubes.length; i++) {
    var cube = cubes[i];
    mainBoardCubes[cube.name] = cube;
  }

  // OTHER BOARD STRUCTURE
  // Create the back panels
  var backPanelWidth = 7.55;
  var backPanelHeight = 7.55;
  var backPanelThickness = 0.05;
  var backPanelMaterial = new StandardMaterial("backPanelMaterial", scene);
  backPanelMaterial.diffuseColor = Color3.FromInts(88, 54, 41);

  function createBackPanel(position, rotation) {
    var backPanel = MeshBuilder.CreateBox(
      "backPanel",
      { width: backPanelWidth, height: backPanelHeight, depth: backPanelThickness },
      scene
    );
    backPanel.material = backPanelMaterial;
    backPanel.position = position;
    backPanel.rotation = rotation;
    backPanel.parent = boardContainer;
  }

  createBackPanel(new Vector3(3.22, -0.525, 3.22), new Vector3(Math.PI / 2, 0, 0));
  createBackPanel(new Vector3(-0.525, 3.22, 3.22), new Vector3(0, Math.PI / 2, 0));
  createBackPanel(new Vector3(3.22, 3.22, -0.525), new Vector3(0, 0, Math.PI / 2));

  // Create the edge strips
  var edgeStripWidth = 0.55;
  var edgeStripHeight = 7.6;
  var edgeStripThickness = 0.05;
  var edgeStripMaterial = new StandardMaterial("edgeStripMaterial", scene);
  edgeStripMaterial.diffuseColor = Color3.FromInts(8, 64, 0); // Green Team Colour;

  function createEdgeStrip(position, rotation) {
    var edgeStrip = MeshBuilder.CreateBox(
      "edgeStrip",
      { width: edgeStripWidth, height: edgeStripHeight, depth: edgeStripThickness },
      scene
    );
    edgeStrip.material = edgeStripMaterial;
    edgeStrip.position = position;
    edgeStrip.rotation = rotation;
    edgeStrip.parent = boardContainer;
  }

  createEdgeStrip(new Vector3(7.025, -0.275, 3.25), new Vector3(0, Math.PI / 2, Math.PI / 2));
  createEdgeStrip(new Vector3(3.25, -0.275, 7.025), new Vector3(0, 0, Math.PI / 2));
  createEdgeStrip(new Vector3(-0.275, 3.25, 7.025), new Vector3(0, 0, 0));
  createEdgeStrip(new Vector3(-0.275, 7.025, 3.25), new Vector3(Math.PI / 2, 0, 0));
  createEdgeStrip(new Vector3(3.25, 7.025, -0.275), new Vector3(Math.PI / 2, 0, Math.PI / 2));
  createEdgeStrip(new Vector3(7.025, 3.25, -0.275), new Vector3(0, Math.PI / 2, 0));

  // THE OWL SQUARES - MARKED BY TORUSES
  // Place a flattened torus on top of the cube named "b7-1"
  var targetCube1 = cubes.find((cube) => cube.name === "b7-1");
  if (targetCube1) {
    var torus1 = MeshBuilder.CreateTorus(
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
    torus1.material = brownTeamMat; // Use the same material as the brown owlHalla cubes
    torus1.parent = boardContainer;
  }

  // Place a flattened torus on top of the cube named "y7-1"
  var targetCube2 = cubes.find((cube) => cube.name === "y7-1");
  if (targetCube2) {
    var torus2 = MeshBuilder.CreateTorus(
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
    torus2.material = yellowTeamMat; // Use the same material as the yellow owlHalla cubes
    torus2.parent = boardContainer;
  }

  // Place a flattened torus on top of the cube named "g7-1"
  var targetCube3 = cubes.find((cube) => cube.name === "g7-1");
  if (targetCube3) {
    var torus3 = MeshBuilder.CreateTorus(
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
    torus3.material = greenTeamMat; // Use the same material as the green owlHalla cubes
    torus3.parent = boardContainer;
  }
}