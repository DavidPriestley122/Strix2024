// COMPLETE OWL MOVEMENT VALIDATION (Regular + Ghosting)

import {
  checkCrossAdjacency,
  convertToFlightway,
  convertFromFlightway,
  generateFlightwayRoute,
  calculateSimpleGhostingDestination,
} from "./flightwayUtils.js";

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

  // 2. Ghosting moves (using our corrected flightway logic)
  const ghostMoves = findGhostingMoves(fromSquare, piecePositions);
  validMoves.push(...ghostMoves);

  return validMoves;
}

export function getAdjacentSquares(square) {
  const adjacent = [];

  // Get the owl's flightway coordinates
  const flightway = convertToFlightway(square);
  if (!flightway) return adjacent;

  // Parse the flightway coordinates to get the two flightways
  const match = flightway.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return adjacent;

  const [, face1, num1, face2, num2] = match;
  const flightway1 = `${face1}${num1}`;
  const flightway2 = `${face2}${num2}`;

  // Get adjacent squares along each flightway
  const adjacentOnFlightway1 = getAdjacentOnFlightway(square, flightway1);
  const adjacentOnFlightway2 = getAdjacentOnFlightway(square, flightway2);

  adjacent.push(...adjacentOnFlightway1);
  adjacent.push(...adjacentOnFlightway2);

  return adjacent;
}

function getAdjacentOnFlightway(currentSquare, flightwayName) {
  const face = flightwayName[0];
  const num = parseInt(flightwayName[1]);

  // Generate the complete route for this flightway
  const route = generateFlightwayRoute(face, num);

  // Find current position in the route
  const currentIndex = route.indexOf(currentSquare);
  if (currentIndex === -1) return [];

  const adjacent = [];

  // Add previous square in route (if exists)
  if (currentIndex > 0) {
    adjacent.push(route[currentIndex - 1]);
  }

  // Add next square in route (if exists)
  if (currentIndex < route.length - 1) {
    adjacent.push(route[currentIndex + 1]);
  }

  return adjacent;
}

// GHOSTING LOGIC - Using our corrected flightway utils
function findGhostingMoves(owlPosition, piecePositions) {
  const ghostMoves = [];

  for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
    if (piecePos === owlPosition || piecePos === "captured") continue;

    // Use our corrected cross-adjacency check
    const crossAdjacency = checkCrossAdjacency(owlPosition, piecePos);
    if (crossAdjacency.isAdjacent) {
      // Use our corrected ghosting destination calculation
      const ghostDestination = calculateSimpleGhostingDestination(
        owlPosition,
        piecePos,
        crossAdjacency
      );

      if (ghostDestination) {
        console.log(
          `👻 GHOSTING: ${pieceName} enables ${owlPosition} → ${ghostDestination} (${crossAdjacency.ghostDirection})`
        );
        ghostMoves.push(ghostDestination);
      }
    }
  }

  return ghostMoves;
}

// Check if two squares are orthogonally adjacent (for regular moves)
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

// TEST FUNCTIONS
export function testOwlMovement() {
  console.log("=== TESTING OWL MOVEMENT SYSTEM ===");

  // Test coordinate conversion
  const testSquare = "b5-3";
  const flightway = convertToFlightway(testSquare);
  console.log(`${testSquare} → ${flightway} (expected: b3g5)`);

  const backConverted = convertFromFlightway(flightway);
  console.log(`${flightway} → ${backConverted} (should be: ${testSquare})`);
}

export function testGhosting() {
  console.log("=== TESTING GHOSTING LOGIC ===");

  // Test example: Owl at y2-5, Kite at b5-3
  const owlPos = "y2-5";
  const kitePos = "b5-3";

  const piecePositions = {
    brownKite: kitePos,
  };

  console.log(`Owl at ${owlPos} = ${convertToFlightway(owlPos)}`);
  console.log(`Kite at ${kitePos} = ${convertToFlightway(kitePos)}`);

  const ghostMoves = findGhostingMoves(owlPos, piecePositions);
  console.log(`Expected ghost destination: g5-6`);
  console.log(`Actual ghost moves found:`, ghostMoves);
}
