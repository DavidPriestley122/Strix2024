import { MeshBuilder, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';


export function createCheckerBoards(scene, boardContainer) {

const cubesOnTheThreeFaces = [];
  let instanceNames = "";

  for (let i = 1; i < 8; i++) {
    for (let j = 1; j < 8; j++) {
      let cubeNameOnBrownFace = `b${i}-${j}`;
      const cubeOnBrownFace = MeshBuilder.CreateBox(
        cubeNameOnBrownFace,
        { size: 1 },
        scene
      );
      // Create a single material for the cube
      const cubeMaterialOnBrownFace = new StandardMaterial(
        `material_${i}-${j}`,
        scene
      );
      cubeMaterialOnBrownFace.diffuseColor =
        (i + j) % 2 === 0
          ? Color3.FromInts(50, 25, 15)
          : Color3.FromInts(240, 230, 140);
      // Apply the single material to the cube
      cubeOnBrownFace.material = cubeMaterialOnBrownFace;
      // Position and scale the cube
      cubeOnBrownFace.position.x = 6 - (i - 1) + 0.5; // Adjust the x position
      cubeOnBrownFace.position.z = 6 - (j - 1) + 0.5; // Adjust the z position
      cubeOnBrownFace.position.y = -0.25; // Adjust the y position
      cubeOnBrownFace.scaling.y = 0.5; // Scale the cubes by 0.5 in the y-direction
      cubesOnTheThreeFaces.push(cubeOnBrownFace);
      cubeOnBrownFace.parent = boardContainer;
      instanceNames += cubeNameOnBrownFace + " ";
      // Add a line break after every 3 instances
      if ((j + 1) % 3 === 0) {
        instanceNames += "\n";
      }
    }
  }

  // Create the second checkerboard at right angles to the first one
  for (let i = 1; i < 8; i++) {
    for (let j = 1; j < 8; j++) {
      let cubeNameOnYellowFace = `y${i}-${j}`;
      const cubeOnYellowFace = MeshBuilder.CreateBox(
        cubeNameOnYellowFace,
        { size: 1 },
        scene
      );
      // Create a single material for the cube
      const cubeMaterialOnYellowFace = new StandardMaterial(
        `material_${i}-${j}`,
        scene
      );
      cubeMaterialOnYellowFace.diffuseColor =
        (i + j) % 2 === 0
          ? Color3.FromInts(50, 25, 15)
          : Color3.FromInts(240, 230, 140);
      // Apply the single material to the cube
      cubeOnYellowFace.material = cubeMaterialOnYellowFace;
      // Position and scale the cube
      cubeOnYellowFace.position.x = -0.25; // Set the x position to align with the back row of the first checkerboard
      cubeOnYellowFace.position.z = 6 - (i - 1) + 0.5; // Adjust the z position
      cubeOnYellowFace.position.y = 6 - (j - 1) + 0.5; // Adjust the y position
      cubeOnYellowFace.scaling.y = 0.5; // Scale the cubes by 0.5 in the x-direction
      cubeOnYellowFace.rotation.z = -Math.PI / 2; // Rotate the cubes by 90 degrees around the z-axis
      cubesOnTheThreeFaces.push(cubeOnYellowFace);
      cubeOnYellowFace.parent = boardContainer;
      instanceNames += cubeNameOnYellowFace + " ";

      // Add a line break after every 3 instances
      if ((j + 1) % 3 === 0) {
        instanceNames += "\n";
      }
    }
  }

  // Create the third checkerboard at right angles to both existing ones
  for (let i = 1; i < 8; i++) {
    for (let j = 1; j < 8; j++) {
      let cubeNameOnGreenFace = `g${8 - i}-${8 - j}`;
      const cubeOnGreenFace = MeshBuilder.CreateBox(
        cubeNameOnGreenFace,
        { size: 1 },
        scene
      );
      // Create a single material for the cube
      const cubeMaterialOnGreenFace = new StandardMaterial(
        `material_${i}-${j}`,
        scene
      );
      cubeMaterialOnGreenFace.diffuseColor =
        (i + j) % 2 === 0
          ? Color3.FromInts(50, 25, 15)
          : Color3.FromInts(240, 230, 140);
      // Apply the single material to the cube
      cubeOnGreenFace.material = cubeMaterialOnGreenFace;
      // Position and scale the cube
      cubeOnGreenFace.position.x = j; // Adjust the x position
      cubeOnGreenFace.position.z = -0.25; // Set the z position to align with the left side of the "b" board
      cubeOnGreenFace.position.y = i; // Adjust the y position
      cubeOnGreenFace.scaling.y = 0.5; // Scale the cubes by 0.5 in the z-direction
      cubeOnGreenFace.rotation.x = Math.PI / 2; // Rotate the cubes by 90 degrees around the y-axis
      cubeOnGreenFace.position.y -= 0.5;
      cubeOnGreenFace.position.x -= 0.5;

      cubesOnTheThreeFaces.push(cubeOnGreenFace);
      cubeOnGreenFace.parent = boardContainer;
      instanceNames += cubeNameOnGreenFace + " ";

      // Add a line break after every 3 instances
      if ((j + 1) % 3 === 0) {
        instanceNames += "\n";
      }
    }
  }

  const mainBoardCubes = {};
  for (let i = 0; i < cubesOnTheThreeFaces.length; i++) {
    const boardCube = cubesOnTheThreeFaces[i];
    mainBoardCubes[boardCube.name] = boardCube;
  }

  //OTHER BOARD STRUCTURE
  // Create the back panels
  const backPanelWidth = 7.55;
  const backPanelHeight = 7.55;
  const backPanelThickness = 0.05;
  const backPanelMaterial = new StandardMaterial("backPanelMaterial", scene);
  backPanelMaterial.diffuseColor = Color3.FromInts(88, 54, 41);

  function createBackPanel(position, rotation) {
    const backPanel = MeshBuilder.CreateBox(
      "backPanel",
      {
        width: backPanelWidth,
        height: backPanelHeight,
        depth: backPanelThickness,
      },
      scene
    );
    backPanel.material = backPanelMaterial;
    backPanel.position = position;
    backPanel.rotation = rotation;
    backPanel.parent = boardContainer;
  }

  createBackPanel(
    new Vector3(3.22, -0.525, 3.22),
    new Vector3(Math.PI / 2, 0, 0)
  );
  createBackPanel(
    new Vector3(-0.525, 3.22, 3.22),
    new Vector3(0, Math.PI / 2, 0)
  );
  createBackPanel(
    new Vector3(3.22, 3.22, -0.525),
    new Vector3(0, 0, Math.PI / 2)
  );

  // Create the edge strips
  const edgeStripWidth = 0.55;
  const edgeStripHeight = 7.6;
  const edgeStripThickness = 0.05;
  const edgeStripMaterial = new StandardMaterial("edgeStripMaterial", scene);
  edgeStripMaterial.diffuseColor = Color3.FromInts(8, 64, 0); // Green Team Colour;

  function createEdgeStrip(position, rotation) {
    const edgeStrip = MeshBuilder.CreateBox(
      "edgeStrip",
      {
        width: edgeStripWidth,
        height: edgeStripHeight,
        depth: edgeStripThickness,
      },
      scene
    );
    edgeStrip.material = edgeStripMaterial;
    edgeStrip.position = position;
    edgeStrip.rotation = rotation;
    edgeStrip.parent = boardContainer;
  }
  createEdgeStrip(
    new Vector3(7.025, -0.275, 3.25),
    new Vector3(0, Math.PI / 2, Math.PI / 2)
  );
  createEdgeStrip(
    new Vector3(3.25, -0.275, 7.025),
    new Vector3(0, 0, Math.PI / 2)
  );
  createEdgeStrip(new Vector3(-0.275, 3.25, 7.025), new Vector3(0, 0, 0));
  createEdgeStrip(
    new Vector3(-0.275, 7.025, 3.25),
    new Vector3(Math.PI / 2, 0, 0)
  );
  createEdgeStrip(
    new Vector3(3.25, 7.025, -0.275),
    new Vector3(Math.PI / 2, 0, Math.PI / 2)
  );
  createEdgeStrip(
    new Vector3(7.025, 3.25, -0.275),
    new Vector3(0, Math.PI / 2, 0)
  );

  return { cubesOnTheThreeFaces, mainBoardCubes };
}

export function createOwlSquareToruses(scene, boardContainer, cubesOnTheThreeFaces) {

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
}