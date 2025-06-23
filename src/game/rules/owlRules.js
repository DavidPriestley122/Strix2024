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
  const isYellowOwl = fromSquare === "b4-7";
  
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
  const isYellowOwl = square === "b4-7";
  
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
  const isYellowOwl = currentSquare === "b4-7";
  
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
*/
import {
  convertToFlightway,
  generateFlightwayRoute,
  isSquareOccupied,
  checkCrossAdjacency,
  calculateSimpleGhostingDestination,
} from "./flightwayUtils.js";

// Logging control - set to false to hide mechanistic logging
const ENABLE_MECHANISTIC_LOGGING = false; // Disabled to reduce noise

export function validateOwlMove(fromSquare, toSquare, piecePositions = {}, movingPieceName = null) {
  if (!fromSquare || !toSquare) return false;

  // Check if this is a capture move first (to avoid circular dependency)
  const targetPiece = findPieceAtSquare(toSquare, piecePositions);
  if (targetPiece && movingPieceName) {
    const movingPieceColor = movingPieceName.split(/(?=[A-Z])/)[0];
    const targetPieceColor = targetPiece.split(/(?=[A-Z])/)[0];
    
    if (movingPieceColor !== targetPieceColor) {
      // This is a capture - check if it's adjacent
      const adjacentSquares = getAdjacentSquares(fromSquare);
      if (adjacentSquares.includes(toSquare)) {
        return true; // Valid capture move
      }
    }
  }

  // For non-capture moves, use the standard logic (but without capture moves to avoid recursion)
  const validMoves = getAllOwlMoves(fromSquare, piecePositions, null); // Don't include captures to avoid recursion

  return validMoves.includes(toSquare);
}

export function getAllOwlMoves(fromSquare, piecePositions = {}, movingPieceName = null) {
  const isYellowOwl = fromSquare === "b4-7";
  
  if (isYellowOwl) console.log(`🦉 ACTIVE getAllOwlMoves for ${fromSquare}`);
  
  const validMoves = [];

  // Get the flightway coordinates for the Owl's current position
  const flightwayCoord = convertToFlightway(fromSquare);
  if (isYellowOwl) console.log(`🦉 ACTIVE Flightway: ${flightwayCoord}`);
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
  if (isYellowOwl) console.log(`🦉 ACTIVE Regular moves on ${flightway1}: [${regularMoves1.join(', ')}]`);
  validMoves.push(...regularMoves1);

  const regularMoves2 = getAdjacentMovesAlongFlightway(
    fromSquare,
    flightway2,
    piecePositions
  );
  if (isYellowOwl) console.log(`🦉 ACTIVE Regular moves on ${flightway2}: [${regularMoves2.join(', ')}]`);
  validMoves.push(...regularMoves2);

  // 2. Ghosting moves (special Owl ability)
  const ghostMoves = getGhostingMoves(fromSquare, piecePositions);
  if (isYellowOwl) console.log(`🦉 ACTIVE Ghost moves: [${ghostMoves.join(', ')}]`);
  validMoves.push(...ghostMoves);

  // 3. NEW: Capture moves (adjacent squares with opponent pieces)
  if (movingPieceName) {
    const captureMoves = getOwlCaptureMoves(fromSquare, piecePositions, movingPieceName);
    if (isYellowOwl) console.log(`🦉 ACTIVE Capture moves: [${captureMoves.join(', ')}]`);
    validMoves.push(...captureMoves);
  }

  if (isYellowOwl) console.log(`🦉 ACTIVE Final moves: [${validMoves.join(', ')}]`);
  if (isYellowOwl && validMoves.includes('b7-7')) {
    console.log(`🚨 ACTIVE b7-7 FOUND! Checking source...`);
    console.log(`🚨 Regular1: ${regularMoves1.includes('b7-7')}, Regular2: ${regularMoves2.includes('b7-7')}, Ghost: ${ghostMoves.includes('b7-7')}`);
  }

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
  const isBrownOwl = owlPosition === "b7-6";
  const isYellowOwl = owlPosition === "b4-7";

  // Debug output for Brown Owl
  if (isBrownOwl) {
    console.log("🔍 Brown Owl ghosting check started");
  }

  // Debug output for Yellow Owl
  if (isYellowOwl) {
    console.log("👻 YELLOW OWL ghosting check started");
    console.log("👻 Available pieces to check:", Object.keys(piecePositions));
  }

  // Check each piece to see if it can serve as a ghosting pivot
  for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
    if (piecePos === owlPosition || piecePos === "captured") continue;

    if (isYellowOwl) {
      console.log(`👻 Checking ${pieceName} at ${piecePos}`);
    }

    // Check if this piece is cross-adjacent to the Owl
    const crossAdjacency = checkCrossAdjacency(owlPosition, piecePos);
    
    if (isYellowOwl) {
      console.log(`👻 Cross-adjacency with ${pieceName}: ${crossAdjacency.isAdjacent ? 'YES' : 'NO'}`);
      if (crossAdjacency.isAdjacent) {
        console.log(`👻 Details:`, crossAdjacency);
      }
    }
    
    if (crossAdjacency.isAdjacent) {
      // Calculate the ghosting destination
      const ghostDestination = calculateSimpleGhostingDestination(
        owlPosition,
        piecePos,
        crossAdjacency
      );

      if (isBrownOwl) console.log(`👻 ${pieceName}@${piecePos} → ${ghostDestination || 'NONE'}`);
      
      if (isYellowOwl) {
        console.log(`👻 YELLOW OWL ghosting around ${pieceName}@${piecePos} → ${ghostDestination || 'NONE'}`);
        if (ghostDestination === 'b7-7') {
          console.log(`🚨 FOUND THE BUG! Yellow Owl ghosting to b7-7 via ${pieceName}@${piecePos}`);
        }
      }

      if (ghostDestination) {
        // Verify the destination is not occupied
        const isOccupied = isSquareOccupied(ghostDestination, piecePositions);
        
        if (!isOccupied) {
          ghostMoves.push(ghostDestination);
        } else if (isBrownOwl) {
          console.log(`❌ ${ghostDestination} occupied`);
        } else if (isYellowOwl) {
          console.log(`👻 ${ghostDestination} occupied, not adding`);
        }
      }
    }
  }

  if (isBrownOwl) console.log(`🔍 Final ghosting moves: ${ghostMoves.join(', ') || 'NONE'}`);
  if (isYellowOwl) console.log(`👻 YELLOW OWL final ghosting moves: [${ghostMoves.join(', ') || 'NONE'}]`);
  
  return ghostMoves;
}

// Owl capture moves: adjacent squares with opponent pieces
function getOwlCaptureMoves(fromSquare, piecePositions, movingPieceName) {
  if (ENABLE_MECHANISTIC_LOGGING) console.log(`🔍 getOwlCaptureMoves called for ${movingPieceName} at ${fromSquare}`);
  const captureMoves = [];
  
  // Get all adjacent squares (same logic as regular moves but ignore occupation)
  const flightwayCoord = convertToFlightway(fromSquare);
  if (!flightwayCoord) return captureMoves;

  const match = flightwayCoord.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return captureMoves;

  const [, face1, num1, face2, num2] = match;
  const flightway1 = `${face1}${num1}`;
  const flightway2 = `${face2}${num2}`;

  // Get adjacent squares along each flightway (ignoring occupation for now)
  const adjacentSquares1 = getAdjacentSquaresIgnoringOccupation(fromSquare, flightway1);
  const adjacentSquares2 = getAdjacentSquaresIgnoringOccupation(fromSquare, flightway2);
  
  const allAdjacentSquares = [...adjacentSquares1, ...adjacentSquares2];

  // Filter for squares that contain opponent pieces
  if (ENABLE_MECHANISTIC_LOGGING) console.log(`🔍 Adjacent squares to check:`, allAdjacentSquares);
  for (const square of allAdjacentSquares) {
    const occupyingPiece = findPieceAtSquare(square, piecePositions);
    if (ENABLE_MECHANISTIC_LOGGING) console.log(`🔍 Square ${square} occupied by:`, occupyingPiece);
    if (occupyingPiece && movingPieceName) {
      // Check if it's an opponent piece
      const movingPieceColor = movingPieceName.split(/(?=[A-Z])/)[0];
      const occupyingPieceColor = occupyingPiece.split(/(?=[A-Z])/)[0];
      
      if (ENABLE_MECHANISTIC_LOGGING) console.log(`🔍 Colors: ${movingPieceName}(${movingPieceColor}) vs ${occupyingPiece}(${occupyingPieceColor})`);
      
      if (movingPieceColor !== occupyingPieceColor) {
        if (ENABLE_MECHANISTIC_LOGGING) console.log(`🎯 CAPTURE MOVE FOUND: ${movingPieceName} can capture ${occupyingPiece} at ${square}`);
        captureMoves.push(square);
      }
    }
  }

  if (ENABLE_MECHANISTIC_LOGGING) console.log(`🔍 getOwlCaptureMoves returning:`, captureMoves);
  return captureMoves;
}

// Helper to get adjacent squares without checking occupation
function getAdjacentSquaresIgnoringOccupation(currentSquare, flightwayName) {
  const adjacent = [];
  
  const face = flightwayName[0];
  const num = parseInt(flightwayName[1]);
  const flightwayRoute = generateFlightwayRoute(face, num);
  
  const currentIndex = flightwayRoute.indexOf(currentSquare);
  if (currentIndex === -1) return adjacent;
  
  // Check adjacent squares only (one step forward, one step backward)
  const adjacentIndices = [currentIndex - 1, currentIndex + 1];
  
  for (const index of adjacentIndices) {
    if (index < 0 || index >= flightwayRoute.length) continue;
    adjacent.push(flightwayRoute[index]);
  }
  
  return adjacent;
}

// Helper function to find which piece is at a given square
function findPieceAtSquare(square, piecePositions) {
  for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
    if (piecePos === square && piecePos !== "captured") {
      return pieceName;
    }
  }
  return null;
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
