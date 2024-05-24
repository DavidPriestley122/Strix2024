import {
  Mesh,
  Vector3,
  Color3,
  StandardMaterial,
  ActionManager,
  ExecuteCodeAction,
  Matrix,
  VertexData,
} from "@babylonjs/core";

export function createBaseAndFins(scene) {
  // THE BASE

  // Create the hexagonal base
  const baseSideLength = 3.91;
  const baseRadius = baseSideLength;
  const baseThickness = 0.5;

  const baseVertices = [];
  const baseIndices = [];

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = baseRadius * Math.cos(angle);
    const z = baseRadius * Math.sin(angle);
    baseVertices.push(x, 0, z);
  }

  // Add vertices for the side faces
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = baseRadius * Math.cos(angle);
    const z = baseRadius * Math.sin(angle);
    baseVertices.push(x, -baseThickness, z);
    baseVertices.push(x, 0, z);
  }

  // Create triangles for the top face
  for (let i = 0; i < 4; i++) {
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
  for (let i = 0; i < 5; i++) {
    baseIndices.push(6, 8 + ((i * 2 + 2) % 12), 8 + i * 2);
  }
  baseIndices.push(6, 8, 16);

  const baseMesh = new Mesh("base", scene);
  const baseVertexData = new VertexData();
  baseVertexData.positions = baseVertices;
  baseVertexData.indices = baseIndices;
  baseVertexData.applyToMesh(baseMesh);

  // Create a material for the base
  const baseMaterial = new StandardMaterial("baseMaterial", scene);
  baseMaterial.diffuseColor = Color3.FromInts(88, 54, 41);
  baseMesh.material = baseMaterial;

  // Rotate the base by 30 degrees in the plane
  //baseMesh.rotation.y = Math.PI / 3;
  baseMesh.position.y += 0.51;

  baseMesh.actionManager = new ActionManager(scene);
  baseMesh.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPickTrigger, function () {
      const isVisible = baseMesh.visibility === 1;
      baseMesh.visibility = isVisible ? 0 : 1;
      fin1.visibility = isVisible ? 0 : 1;
      fin2.visibility = isVisible ? 0 : 1;
      fin3.visibility = isVisible ? 0 : 1;
    })
  );

  // THE FINS FOR THE BASE

  const finHeight = 4.79;
  const finBaseLength = 3.386;
  const finThickness = 0.5;

  const finMaterial = new StandardMaterial("finMaterial", scene);
  finMaterial.diffuseColor = Color3.FromInts(88, 54, 41);

  function createFin(name, rotation, translation) {
    const finVertices = [
      0,
      0,
      0, // Vertex 0: obtuse angle, on plane
      finBaseLength,
      0,
      0, // Vertex 1: right angle, on plane
      finBaseLength,
      0,
      finHeight, // Vertex 2: acute angle, on plane
      0,
      -finThickness,
      0, // Vertex 3: obtuse angle, below plane
      finBaseLength,
      -finThickness,
      0, // Vertex 4: right angle, below plane
      finBaseLength,
      -finThickness,
      finHeight, // Vertex 5: acute angle, below plane
    ];

    const finIndices = [
      0,
      1,
      2, // Triangle 1: Front face
      3,
      4,
      0, // Triangle 2: Front side, lower
      4,
      1,
      0, // Triangle 3: Front side, upper
      4,
      5,
      2, // Triangle 4: Right side, lower
      4,
      2,
      1, // Triangle 5: Right side, upper
      5,
      3,
      2, // Triangle 6: Left side, lower
      2,
      3,
      0, // Triangle 7: Left side, upper
      3,
      5,
      4, // Triangle 8: Bottom face
    ];

    const fin = new Mesh(name, scene);
    const finVertexData = new VertexData();
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

  const finOffset = finThickness / 2;
  const fin1 = createFin("fin1", Math.PI / 2, new Vector3(-finOffset, 0, 0));
  const fin2 = createFin(
    "fin2",
    -Math.PI / 6,
    new Vector3(
      finOffset * Math.cos(Math.PI / 3),
      0,
      -finOffset * Math.sin(Math.PI / 3)
    )
  );
  const fin3 = createFin(
    "fin3",
    (-5 * Math.PI) / 6,
    new Vector3(
      finOffset * Math.cos(Math.PI / 3),
      0,
      finOffset * Math.sin(Math.PI / 3)
    )
  );
}
