/*// COMPLETE OWL MOVEMENT VALIDATION (Regular + Ghosting)

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
*/
import {
  convertToFlightway,
  generateFlightwayRoute,
  isSquareOccupied,
  checkCrossAdjacency,
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

  // Get the flightway coordinates for the Owl's current position
  const flightwayCoord = convertToFlightway(fromSquare);
  if (!flightwayCoord) return validMoves;

  // Parse the flightway coordinates to get the two flightways this square is on
  const match = flightwayCoord.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return validMoves;

  const [, face1, num1, face2, num2] = match;
  const flightway1 = `${face1}${num1}`;
  const flightway2 = `${face2}${num2}`;

  // 1. Regular moves along flightways (limited to adjacent squares only)
  const regularMoves1 = getAdjacentMovesAlongFlightway(
    fromSquare,
    flightway1,
    piecePositions
  );
  validMoves.push(...regularMoves1);

  const regularMoves2 = getAdjacentMovesAlongFlightway(
    fromSquare,
    flightway2,
    piecePositions
  );
  validMoves.push(...regularMoves2);

  // 2. Ghosting moves (special Owl ability)
  const ghostMoves = getGhostingMoves(fromSquare, piecePositions);
  validMoves.push(...ghostMoves);

  return validMoves;
}

// Owl-specific: only adjacent squares (unlike Kites/Ravens who can move any distance)
function getAdjacentMovesAlongFlightway(
  currentSquare,
  flightwayName,
  piecePositions
) {
  const validMoves = [];

  // Generate the complete 14-square flightway sequence
  const face = flightwayName[0];
  const num = parseInt(flightwayName[1]);
  const flightwayRoute = generateFlightwayRoute(face, num);

  // Find current position in the route
  const currentIndex = flightwayRoute.indexOf(currentSquare);
  if (currentIndex === -1) return validMoves;

  // Check adjacent squares only (one step forward, one step backward)
  const adjacentIndices = [currentIndex - 1, currentIndex + 1];

  for (const index of adjacentIndices) {
    if (index < 0 || index >= flightwayRoute.length) continue;

    const targetSquare = flightwayRoute[index];

    // Check if destination is occupied
    if (isSquareOccupied(targetSquare, piecePositions)) continue;

    // For adjacent moves, path is always clear (only one step)
    validMoves.push(targetSquare);
  }

  return validMoves;
}

// Owl-specific: ghosting functionality
function getGhostingMoves(owlPosition, piecePositions) {
  const ghostMoves = [];

  // Check each piece to see if it can serve as a ghosting pivot
  for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
    if (piecePos === owlPosition || piecePos === "captured") continue;

    // Check if this piece is cross-adjacent to the Owl
    const crossAdjacency = checkCrossAdjacency(owlPosition, piecePos);
    if (crossAdjacency.isAdjacent) {
      // Calculate the ghosting destination
      const ghostDestination = calculateSimpleGhostingDestination(
        owlPosition,
        piecePos,
        crossAdjacency
      );

      if (ghostDestination) {
        // Verify the destination is not occupied
        if (!isSquareOccupied(ghostDestination, piecePositions)) {
          console.log(
            `👻 GHOSTING: ${pieceName} enables ${owlPosition} → ${ghostDestination} (${crossAdjacency.ghostDirection})`
          );
          ghostMoves.push(ghostDestination);
        }
      }
    }
  }

  return ghostMoves;
}

// Helper function for backward compatibility
export function getAdjacentSquares(square) {
  // This function is used by the existing AI, so keep it for now
  const adjacent = [];

  const flightwayCoord = convertToFlightway(square);
  if (!flightwayCoord) return adjacent;

  const match = flightwayCoord.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return adjacent;

  const [, face1, num1, face2, num2] = match;
  const flightway1 = `${face1}${num1}`;
  const flightway2 = `${face2}${num2}`;

  // Get adjacent squares along each flightway
  const adjacentOnFlightway1 = getAdjacentMovesAlongFlightway(
    square,
    flightway1,
    {}
  );
  const adjacentOnFlightway2 = getAdjacentMovesAlongFlightway(
    square,
    flightway2,
    {}
  );

  adjacent.push(...adjacentOnFlightway1);
  adjacent.push(...adjacentOnFlightway2);

  return adjacent;
}
