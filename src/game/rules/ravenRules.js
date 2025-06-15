import {
  convertToFlightway,
  generateFlightwayRoute,
  isSquareOccupied,
  isPathClear,
} from "./flightwayUtils.js";

export function validateRavenMove(fromSquare, toSquare, piecePositions = {}) {
  if (!fromSquare || !toSquare) return false;

  // Get all valid moves for this Raven
  const validMoves = getAllRavenMoves(fromSquare, piecePositions);

  return validMoves.includes(toSquare);
}

export function getAllRavenMoves(fromSquare, piecePositions = {}) {
  const validMoves = [];

  // Get the flightway coordinates for the Raven's current position
  const flightwayCoord = convertToFlightway(fromSquare);
  if (!flightwayCoord) return validMoves;

  // Parse the flightway coordinates to get the two flightways this square is on
  const match = flightwayCoord.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return validMoves;

  const [, face1, num1, face2, num2] = match;
  const flightway1 = `${face1}${num1}`;
  const flightway2 = `${face2}${num2}`;

  // Get moves along first flightway
  const moves1 = getMovesAlongFlightway(fromSquare, flightway1, piecePositions);
  validMoves.push(...moves1);

  // Get moves along second flightway
  const moves2 = getMovesAlongFlightway(fromSquare, flightway2, piecePositions);
  validMoves.push(...moves2);

  return validMoves;
}

function getMovesAlongFlightway(currentSquare, flightwayName, piecePositions) {
  const validMoves = [];

  // Generate the complete 14-square flightway sequence
  const face = flightwayName[0];
  const num = parseInt(flightwayName[1]);
  const flightwayRoute = generateFlightwayRoute(face, num);

  // Find current position in the route
  const currentIndex = flightwayRoute.indexOf(currentSquare);
  if (currentIndex === -1) return validMoves;

  // Ravens can move to any square along the flightway (like Rooks)
  for (let i = 0; i < flightwayRoute.length; i++) {
    if (i === currentIndex) continue; // Skip current position

    const targetSquare = flightwayRoute[i];

    // Check if destination is occupied
    if (isSquareOccupied(targetSquare, piecePositions)) {
      // Can't move to occupied square, but also can't jump over it
      // So if we're going in this direction, stop here
      if (i > currentIndex) {
        // Moving forward in route - stop here
        break;
      } else {
        // Moving backward in route - continue checking but don't add this square
        continue;
      }
    }

    // Check if path is clear (no pieces between current and target)
    if (!isPathClear(currentSquare, targetSquare, piecePositions)) {
      // Path blocked - if going in this direction, stop
      if (i > currentIndex) {
        break;
      } else {
        continue;
      }
    }

    // Valid move
    validMoves.push(targetSquare);
  }

  return validMoves;
}
