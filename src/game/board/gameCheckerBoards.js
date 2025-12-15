import { MeshBuilder, StandardMaterial, PBRMaterial, Color3, Vector3, MultiMaterial, SubMesh } from '@babylonjs/core';


export function createCheckerBoards(scene, boardContainer) {

const cubesOnTheThreeFaces = [];
  let instanceNames = "";

  // Helper function to setup multi-material for board cubes
  function setupCubeMultiMaterial(cube, scene, isDark) {
    // Create the checkerboard material (Face 4 - the visible top/front)
    const checkerboardMat = new StandardMaterial(`material_${cube.name}_checker`, scene);
    checkerboardMat.diffuseColor = isDark
      ? Color3.FromInts(50, 25, 15)
      : Color3.FromInts(240, 230, 140);
    checkerboardMat.alpha = 1.0;
    checkerboardMat.backFaceCulling = true;

    // Create the glass material (Faces 0-3, 5 - the sides/back/bottom) using PBR for realism
    const glassMat = new PBRMaterial(`material_${cube.name}_glass`, scene);
    // Glass material is always pure clear - stores whether it's from dark or light square
    glassMat.metadata = { isDark: isDark };
    // In solid mode, glass material matches checkerboard color
    glassMat.albedoColor = checkerboardMat.diffuseColor.clone();
    glassMat.metallic = 0.0; // Glass is not metallic
    glassMat.roughness = 0.0; // Glass is very smooth
    glassMat.alpha = 1.0;
    glassMat.backFaceCulling = true;

    // Create MultiMaterial
    const multiMat = new MultiMaterial(`multiMat_${cube.name}`, scene);
    multiMat.subMaterials.push(checkerboardMat); // Index 0
    multiMat.subMaterials.push(glassMat);        // Index 1

    // Apply MultiMaterial to cube
    cube.material = multiMat;

    // Create SubMeshes (6 faces, each face uses 6 indices)
    cube.subMeshes = [];
    const verticesCount = 24; // Standard box has 24 vertices

    // Faces 0-3 and 5 use glass material (materialIndex 1)
    new SubMesh(1, 0, verticesCount, 0, 6, cube);   // Face 0: indices 0-5
    new SubMesh(1, 0, verticesCount, 6, 6, cube);   // Face 1: indices 6-11
    new SubMesh(1, 0, verticesCount, 12, 6, cube);  // Face 2: indices 12-17
    new SubMesh(1, 0, verticesCount, 18, 6, cube);  // Face 3: indices 18-23

    // Face 4 uses checkerboard material (materialIndex 0)
    new SubMesh(0, 0, verticesCount, 24, 6, cube);  // Face 4: indices 24-29

    // Face 5 uses glass material (materialIndex 1)
    new SubMesh(1, 0, verticesCount, 30, 6, cube);  // Face 5: indices 30-35
  }

  for (let i = 1; i < 8; i++) {
    for (let j = 1; j < 8; j++) {
      let cubeNameOnBrownFace = `b${i}-${j}`;
      const cubeOnBrownFace = MeshBuilder.CreateBox(
        cubeNameOnBrownFace,
        { size: 1 },
        scene
      );

      const isDark = (i + j) % 2 === 0;
      setupCubeMultiMaterial(cubeOnBrownFace, scene, isDark);

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

      const isDarkYellow = (i + j) % 2 === 0;
      setupCubeMultiMaterial(cubeOnYellowFace, scene, isDarkYellow);

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

      const isDarkGreen = (i + j) % 2 === 0;
      setupCubeMultiMaterial(cubeOnGreenFace, scene, isDarkGreen);

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
  backPanelMaterial.alpha = 1.0; // Default solid, will be glassy in glass mode
  backPanelMaterial.backFaceCulling = true;

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
  edgeStripMaterial.diffuseColor = Color3.FromInts(8, 64, 0); // Green Team Colour
  edgeStripMaterial.alpha = 1.0; // Default solid, will be translucent in glass mode
  edgeStripMaterial.backFaceCulling = true;

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