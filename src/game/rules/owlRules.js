// COMPLETE OWL MOVEMENT VALIDATION (Regular + Ghosting)

// DISABLE ALL OWL DEBUG LOGGING TO REDUCE CONSOLE SPAM
const ENABLE_OWL_LOGGING = false;

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
  const isYellowOwl = ENABLE_OWL_LOGGING && fromSquare === "b4-7";
  
  if (isYellowOwl) console.log(`🦉 DETAILED: getAllOwlMoves for ${fromSquare}`);
  
  const validMoves = [];

  // 1. Regular adjacent moves (one square orthogonally)
  const adjacentMoves = getAdjacentSquares(fromSquare);
  if (isYellowOwl) console.log(`🦉 Adjacent moves: [${adjacentMoves.join(', ')}]`);
  validMoves.push(...adjacentMoves);

  // 2. Ghosting moves (using our corrected flightway logic)
  const ghostMoves = findGhostingMoves(fromSquare, piecePositions);
  if (isYellowOwl) console.log(`🦉 Ghost moves: [${ghostMoves.join(', ')}]`);
  validMoves.push(...ghostMoves);

  if (isYellowOwl) console.log(`🦉 Final valid moves: [${validMoves.join(', ')}]`);
  if (isYellowOwl && validMoves.includes('b7-7')) {
    console.log(`🚨 b7-7 FOUND! Source: ${adjacentMoves.includes('b7-7') ? 'ADJACENT' : 'GHOST'}`);
  }

  return validMoves;
}

export function getAdjacentSquares(square) {
  const isYellowOwl = ENABLE_OWL_LOGGING && square === "b4-7";
  
  if (isYellowOwl) console.log(`🦉 getAdjacentSquares for ${square}`);
  
  const adjacent = [];

  // Get the owl's flightway coordinates
  const flightway = convertToFlightway(square);
  if (isYellowOwl) console.log(`🦉 Flightway: ${flightway}`);
  if (!flightway) return adjacent;

  // Parse the flightway coordinates to get the two flightways
  const match = flightway.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return adjacent;

  const [, face1, num1, face2, num2] = match;
  const flightway1 = `${face1}${num1}`;
  const flightway2 = `${face2}${num2}`;
  
  if (isYellowOwl) console.log(`🦉 Flightways: ${flightway1}, ${flightway2}`);

  // Get adjacent squares along each flightway
  const adjacentOnFlightway1 = getAdjacentOnFlightway(square, flightway1);
  const adjacentOnFlightway2 = getAdjacentOnFlightway(square, flightway2);
  
  if (isYellowOwl) console.log(`🦉 Adjacent on ${flightway1}: [${adjacentOnFlightway1.join(', ')}]`);
  if (isYellowOwl) console.log(`🦉 Adjacent on ${flightway2}: [${adjacentOnFlightway2.join(', ')}]`);

  adjacent.push(...adjacentOnFlightway1);
  adjacent.push(...adjacentOnFlightway2);

  if (isYellowOwl) console.log(`🦉 Total adjacent: [${adjacent.join(', ')}]`);

  return adjacent;
}

function getAdjacentOnFlightway(currentSquare, flightwayName) {
  const isYellowOwl = ENABLE_OWL_LOGGING && currentSquare === "b4-7";
  
  const face = flightwayName[0];
  const num = parseInt(flightwayName[1]);

  // Generate the complete route for this flightway
  const route = generateFlightwayRoute(face, num);
  
  if (isYellowOwl) {
    console.log(`🦉 Route for ${flightwayName}: [${route.slice(0,10).join(', ')}${route.length > 10 ? '...' : ''}] (${route.length} squares)`);
  }

  // Find current position in the route
  const currentIndex = route.indexOf(currentSquare);
  if (isYellowOwl) console.log(`🦉 ${currentSquare} found at index ${currentIndex} in ${flightwayName} route`);
  
  if (currentIndex === -1) return [];

  const adjacent = [];

  // Add previous square in route (if exists)
  if (currentIndex > 0) {
    adjacent.push(route[currentIndex - 1]);
    if (isYellowOwl) console.log(`🦉 Previous square: ${route[currentIndex - 1]}`);
  }

  // Add next square in route (if exists)
  if (currentIndex < route.length - 1) {
    adjacent.push(route[currentIndex + 1]);
    if (isYellowOwl) console.log(`🦉 Next square: ${route[currentIndex + 1]}`);
  }

  if (isYellowOwl) console.log(`🦉 Adjacent on ${flightwayName}: [${adjacent.join(', ')}]`);

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
        if (ENABLE_MECHANISTIC_LOGGING) console.log(
          `👻 GHOSTING: ${pieceName} enables ${owlPosition} → ${ghostDestination} (${crossAdjacency.ghostDirection})`
        );
        ghostMoves.push(ghostDestination);
      }
    }
  }

  return ghostMoves;
}

