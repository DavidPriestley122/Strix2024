// COMPLETE OWL MOVEMENT VALIDATION (Regular + Ghosting)

import { 
  checkCrossAdjacency, 
  convertToFlightway,
  convertFromFlightway,
  generateFlightwayRoute 
} from './flightwayUtils.js';

export function validateOwlMove(fromSquare, toSquare, piecePositions = {}) {
  if (!fromSquare || !toSquare) return false;

  // Get all valid moves for this Owl
  const validMoves = getAllOwlMoves(fromSquare, piecePositions);

  return validMoves.includes(toSquare);
}

export function getAllOwlMoves(fromSquare, piecePositions = {}) {
  const validMoves = [];

  // 1. Regular adjacent moves (one square orthogonally)
  const adjacentMoves = getAdjacentSquares(fromSquare);
  validMoves.push(...adjacentMoves);

  // 2. Ghosting moves (flightway-based)
  const ghostMoves = findGhostingMovesFlightway(fromSquare, piecePositions);
  validMoves.push(...ghostMoves);

  return validMoves;
}

export function getAdjacentSquares(square) {
  const face = square[0];
  const coords = square.substring(1).split("-");
  const row = parseInt(coords[0]);
  const col = parseInt(coords[1]);

  const adjacent = [];

  // Four orthogonal directions
  const directions = [
    { row: row - 1, col: col }, // Up
    { row: row + 1, col: col }, // Down
    { row: row, col: col - 1 }, // Left
    { row: row, col: col + 1 }, // Right
  ];

  for (const dir of directions) {
    // Check if still on same face
    if (dir.row >= 1 && dir.row <= 7 && dir.col >= 1 && dir.col <= 7) {
      adjacent.push(`${face}${dir.row}-${dir.col}`);
    } else {
      // Handle cross-face moves (around corners)
      const crossFaceSquare = getCrossFaceSquare(face, row, col, dir);
      if (crossFaceSquare) {
        adjacent.push(crossFaceSquare);
      }
    }
  }

  return adjacent;
}

function getCrossFaceSquare(face, row, col, direction) {
  // Handle moves that go around corners between faces
  // This is complex 3D geometry - simplified version for now

  if (direction.row === 0) {
    // Moving left/right
    if (direction.col === 0) {
      // Moving left off face
      if (face === "b" && col === 1) return `g${row}-7`; // Brown left → Green right
      if (face === "y" && col === 1) return `b${row}-7`; // Yellow left → Brown right
      if (face === "g" && col === 1) return `y${row}-7`; // Green left → Yellow right
    } else if (direction.col === 8) {
      // Moving right off face
      if (face === "b" && col === 7) return `y${7}-${row}`; // Brown right → Yellow bottom
      if (face === "y" && col === 7) return `g${7}-${row}`; // Yellow right → Green bottom
      if (face === "g" && col === 7) return `b${7}-${row}`; // Green right → Brown bottom
    }
  } else {
    // Moving up/down
    if (direction.row === 0) {
      // Moving up off face
      if (face === "b" && row === 1) return `y${col}-1`; // Brown top → Yellow top
      if (face === "y" && row === 1) return `g${col}-1`; // Yellow top → Green top
      if (face === "g" && row === 1) return `b${col}-1`; // Green top → Brown top
    } else if (direction.row === 8) {
      // Moving down off face
      if (face === "b" && row === 7) return `g${8 - col}-1`; // Brown bottom → Green top (rotated)
      if (face === "y" && row === 7) return `b${8 - col}-1`; // Yellow bottom → Brown top (rotated)
      if (face === "g" && row === 7) return `y${8 - col}-1`; // Green bottom → Yellow top (rotated)
    }
  }

  return null;
}

// GHOSTING LOGIC - Corrected based on user's explanation

function findGhostingMovesFlightway(owlPosition, piecePositions) {
  const ghostMoves = [];

  // Convert owl position to flightway coordinates
  const owlFlightway = convertToFlightway(owlPosition);
  if (!owlFlightway) return ghostMoves;

  // Parse owl's flightways
  const owlMatch = owlFlightway.match(/([byg])(\d)([byg])(\d)/);
  if (!owlMatch) return ghostMoves;

  const [, owlFace1, owlNum1, owlFace2, owlNum2] = owlMatch;
  const owlFlightway1 = `${owlFace1}${owlNum1}`;
  const owlFlightway2 = `${owlFace2}${owlNum2}`;

  // Check each piece as potential crosspiece
  for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
    if (piecePos === owlPosition || piecePos === "captured") continue;

    const crossFlightway = convertToFlightway(piecePos);
    if (!crossFlightway) continue;

    // Parse crosspiece's flightways
    const crossMatch = crossFlightway.match(/([byg])(\d)([byg])(\d)/);
    if (!crossMatch) continue;

    const [, crossFace1, crossNum1, crossFace2, crossNum2] = crossMatch;
    const crossFlightway1 = `${crossFace1}${crossNum1}`;
    const crossFlightway2 = `${crossFace2}${crossNum2}`;

    // Check if owl is cross-adjacent via either crosspiece flightway
    const adjacency1 = checkCrossAdjacencyToFlightway(
      owlPosition,
      crossFlightway1,
      piecePos
    );
    const adjacency2 = checkCrossAdjacencyToFlightway(
      owlPosition,
      crossFlightway2,
      piecePos
    );

    if (adjacency1.isAdjacent) {
      // Owl is adjacent to crossFlightway1 shadows, so it ghosts along crossFlightway2
      const ghostDestination = calculateGhostDestination(
        owlFlightway1,
        owlFlightway2,
        crossFlightway1,
        crossFlightway2
      );
      if (ghostDestination) {
        console.log(
          `👻 GHOSTING: ${pieceName} enables ${owlPosition} → ${ghostDestination}`
        );
        ghostMoves.push(ghostDestination);
      }
    }

    if (adjacency2.isAdjacent) {
      // Owl is adjacent to crossFlightway2 shadows, so it ghosts along crossFlightway1
      const ghostDestination = calculateGhostDestination(
        owlFlightway1,
        owlFlightway2,
        crossFlightway2,
        crossFlightway1
      );
      if (ghostDestination) {
        console.log(
          `👻 GHOSTING: ${pieceName} enables ${owlPosition} → ${ghostDestination}`
        );
        ghostMoves.push(ghostDestination);
      }
    }
  }

  return ghostMoves;
}

// Check if owl is adjacent to shadows created by a specific crosspiece flightway
function checkCrossAdjacencyToFlightway(
  owlPosition,
  crossFlightway,
  crossPiecePosition
) {
  // Get the face the crosspiece is actually on
  const crossFace = crossPiecePosition[0];

  // Get shadows created by this flightway (squares NOT on crosspiece's face)
  const shadowSquares = getFlightwayShadows(crossFlightway, crossFace);

  // Check if owl is orthogonally adjacent to any shadow square
  for (const shadowSquare of shadowSquares) {
    if (isOrthogonallyAdjacent(owlPosition, shadowSquare)) {
      return { isAdjacent: true, shadowSquare };
    }
  }

  return { isAdjacent: false };
}

// Get shadow squares created by a flightway (excluding the crosspiece's actual face)
function getFlightwayShadows(flightwayName, crossFace) {
  const face = flightwayName[0];
  const num = parseInt(flightwayName[1]);
  const fullRoute = generateFlightwayRoute(face, num);

  // Return only squares that are NOT on the crosspiece's face (i.e., the shadows)
  return fullRoute.filter((square) => square[0] !== crossFace);
}

// Calculate ghosting destination
function calculateGhostDestination(
  owlFlightway1,
  owlFlightway2,
  shadowedFlightway,
  otherFlightway
) {
  // Determine which owl flightway to keep (the one not involved in the adjacency)
  let keepFlightway;
  if (owlFlightway1 === shadowedFlightway) {
    keepFlightway = owlFlightway2;
  } else if (owlFlightway2 === shadowedFlightway) {
    keepFlightway = owlFlightway1;
  } else {
    // Owl flightway doesn't match shadowed flightway - this shouldn't happen
    return null;
  }

  // Calculate new flightway number for the other crosspiece flightway
  // For now, just use +1 (we can refine the inside/outside logic later)
  const otherFace = otherFlightway[0];
  const otherNum = parseInt(otherFlightway[1]);
  const newNum = otherNum + 1;

  // Check bounds
  if (newNum < 1 || newNum > 7) return null;

  const newFlightway = `${otherFace}${newNum}`;

  // Create destination flightway coordinate (maintain b,y,g order)
  const flightways = [keepFlightway, newFlightway].sort((a, b) => {
    const faceOrder = { b: 0, y: 1, g: 2 };
    return faceOrder[a[0]] - faceOrder[b[0]];
  });

  const ghostFlightway = `${flightways[0]}${flightways[1]}`;
  return convertFromFlightway(ghostFlightway);
}

// Check if two squares are orthogonally adjacent
function isOrthogonallyAdjacent(square1, square2) {
  if (!square1 || !square2 || square1 === square2) return false;

  const parse = (sq) => {
    const face = sq[0];
    const coords = sq.substring(1).split("-");
    return { face, row: parseInt(coords[0]), col: parseInt(coords[1]) };
  };

  const sq1 = parse(square1);
  const sq2 = parse(square2);

  // Must be on same face
  if (sq1.face !== sq2.face) return false;

  // Must be exactly one square apart orthogonally
  const rowDiff = Math.abs(sq1.row - sq2.row);
  const colDiff = Math.abs(sq1.col - sq2.col);

  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// FLIGHTWAY COORDINATE CONVERSION FUNCTIONS




// TEST FUNCTIONS

export function testFlightwaySystem() {
  console.log("=== TESTING COMPLETE OWL MOVEMENT SYSTEM ===");

  // Test coordinate conversion
  const testSquare = "b5-3";
  const flightway = convertToFlightway(testSquare);
  console.log(`${testSquare} → ${flightway} (expected: b3g5)`);

  const backConverted = convertFromFlightway(flightway);
  console.log(`${flightway} → ${backConverted} (should be: ${testSquare})`);

  // Test Yellow Kite example
  const kiteSquare = "g5-4";
  const kiteFlightway = convertToFlightway(kiteSquare);
  console.log(`${kiteSquare} → ${kiteFlightway} (expected: y5g4)`);
}

export function testCorrectedGhosting() {
  console.log("=== TESTING CORRECTED GHOSTING LOGIC ===");

  // Test your example: Brown Owl at b3-3, Yellow Kite at g5-4
  const owlPos = "b3-3";
  const kitePos = "g5-4";

  const piecePositions = {
    yellowKite: kitePos,
  };

  console.log(`Owl at ${owlPos} = ${convertToFlightway(owlPos)}`);
  console.log(`Kite at ${kitePos} = ${convertToFlightway(kitePos)}`);

  const ghostMoves = findGhostingMovesFlightway(owlPos, piecePositions);
  console.log(`Expected ghost destination: y3-6`);
  console.log(`Actual ghost moves found:`, ghostMoves);
}
