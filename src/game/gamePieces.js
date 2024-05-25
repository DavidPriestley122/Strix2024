import { StandardMaterial, Color3, MeshBuilder, MultiMaterial, SubMesh } from '@babylonjs/core';

  
export function createPlayingPieces(scene, boardContainer) {

// Create materials for the cylinder
  const brownMaterial = new StandardMaterial("brownMaterial", scene);
  brownMaterial.diffuseColor = Color3.FromInts(88, 54, 41); // Brown

  const owlMat = new StandardMaterial("owlMat", scene);
  owlMat.diffuseColor = Color3.FromInts(204, 153, 102); // Owl Color

  const kiteMat = new StandardMaterial("kiteMat", scene);
  kiteMat.diffuseColor = Color3.FromInts(139, 0, 0); // Kite Color

  const ravenMat = new StandardMaterial("ravenMat", scene);
  ravenMat.diffuseColor = Color3.FromInts(10, 10, 10); // Raven Color

  const brownTeamMat = new StandardMaterial("brownTeamMat", scene);
  brownTeamMat.diffuseColor = Color3.FromInts(88, 54, 41); // Brown Team Color

  const yellowTeamMat = new StandardMaterial("yellowTeamMat", scene);
  yellowTeamMat.diffuseColor = Color3.FromInts(255, 204, 0); // Yellow Team Color

  const greenTeamMat = new StandardMaterial("greenTeamMat", scene);
  greenTeamMat.diffuseColor = Color3.FromInts(8, 64, 0); // Green Team Color

  // Create the multimeshes for the cylinders
  function createMeshWithMultiMaterial(name, material, teamMaterial, scene) {
    const mesh = MeshBuilder.CreateCylinder(
      name,
      { height: 7, diameter: 0.5, subdivisions: 7 },
      scene
    );
    const multiMaterial = new MultiMaterial("multiMaterial_" + name, scene);

    // Create sub-materials
    for (let i = 0; i < 6; i++) {
      multiMaterial.subMaterials.push(material);
    }
    multiMaterial.subMaterials.push(teamMaterial); // Bottom section
    multiMaterial.subMaterials.push(teamMaterial); // Top section

    // Apply multi-material to mesh
    mesh.material = multiMaterial;

    // Define sub-meshes
    mesh.subMeshes = [];
    const verticesCount = mesh.getTotalVertices();
    for (let j = 0; j < 8; j++) {
      let start = j * 144;
      new SubMesh(j, 0, verticesCount, start, 144, mesh);
    }

    mesh.parent = boardContainer;
    return mesh;
  }
  const brownOwl = createMeshWithMultiMaterial(
    "brownOwl",
    owlMat,
    brownTeamMat,
    scene
  );
  brownOwl.parent = boardContainer;
  const brownKite = createMeshWithMultiMaterial(
    "brownKite",
    kiteMat,
    brownTeamMat,
    scene
  );
  brownKite.parent = boardContainer;
  const brownRaven = createMeshWithMultiMaterial(
    "brownRaven",
    ravenMat,
    brownTeamMat,
    scene
  );
  brownRaven.parent = boardContainer;
  const yellowOwl = createMeshWithMultiMaterial(
    "yellowOwl",
    owlMat,
    yellowTeamMat,
    scene
  );
  yellowOwl.parent = boardContainer;
  const yellowKite = createMeshWithMultiMaterial(
    "yellowKite",
    kiteMat,
    yellowTeamMat,
    scene
  );
  yellowKite.parent = boardContainer;
  const yellowRaven = createMeshWithMultiMaterial(
    "yellowRaven",
    ravenMat,
    yellowTeamMat,
    scene
  );
  yellowRaven.parent = boardContainer;
  const greenOwl = createMeshWithMultiMaterial(
    "greenOwl",
    owlMat,
    greenTeamMat,
    scene
  );
  greenOwl.parent = boardContainer;
  const greenKite = createMeshWithMultiMaterial(
    "greenKite",
    kiteMat,
    greenTeamMat,
    scene
  );
  greenKite.parent = boardContainer;
  const greenRaven = createMeshWithMultiMaterial(
    "greenRaven",
    ravenMat,
    greenTeamMat,
    scene
  );
  greenRaven.parent = boardContainer;

  return {
    brownOwl,
    brownKite,
    brownRaven,
    yellowOwl,
    yellowKite,
    yellowRaven,
    greenOwl,
    greenKite,
    greenRaven,
  };




}
