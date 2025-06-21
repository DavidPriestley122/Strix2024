import {
  convertToFlightway,
  generateFlightwayRoute,
  isSquareOccupied,
  isPathClear,
} from "./flightwayUtils.js";

export function validateKiteMove(fromSquare, toSquare, piecePositions = {}) {
  if (!fromSquare || !toSquare) return false;

  // Get all valid moves for this Kite
  const validMoves = getAllKiteMoves(fromSquare, piecePositions);

  return validMoves.includes(toSquare);
}

export function getAllKiteMoves(fromSquare, piecePositions = {}, movingPieceName = null) {
  const validMoves = [];

  // Get the flightway coordinates for the Kite's current position
  const flightwayCoord = convertToFlightway(fromSquare);
  if (!flightwayCoord) return validMoves;

  // Parse the flightway coordinates to get the two flightways this square is on
  const match = flightwayCoord.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return validMoves;

  const [, face1, num1, face2, num2] = match;
  const flightway1 = `${face1}${num1}`;
  const flightway2 = `${face2}${num2}`;

  // Get regular moves along first flightway
  const moves1 = getMovesAlongFlightway(fromSquare, flightway1, piecePositions);
  validMoves.push(...moves1);

  // Get regular moves along second flightway
  const moves2 = getMovesAlongFlightway(fromSquare, flightway2, piecePositions);
  validMoves.push(...moves2);

  // Add capture moves (cross-face swooping captures)
  if (movingPieceName) {
    const captureMoves = getKiteCaptureMoves(fromSquare, piecePositions, movingPieceName, flightway1, flightway2);
    validMoves.push(...captureMoves);
  }

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

  // Kites can move to any square along the flightway (like Rooks)
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

// Kite capture moves: cross-face swooping captures  
function getKiteCaptureMoves(fromSquare, piecePositions, movingPieceName, flightway1, flightway2) {
  console.log(`🦅 getKiteCaptureMoves called for ${movingPieceName} at ${fromSquare}`);
  const captureMoves = [];
  
  // Get all possible landing squares along both flightways
  const landingSquares1 = getMovesAlongFlightway(fromSquare, flightway1, piecePositions);
  const landingSquares2 = getMovesAlongFlightway(fromSquare, flightway2, piecePositions);
  const allLandingSquares = [...landingSquares1, ...landingSquares2];
  
  // Get the face the Kite is currently on
  const currentFace = fromSquare[0];
  
  for (const landingSquare of allLandingSquares) {
    const landingFace = landingSquare[0];
    
    // Check if this move crosses faces (required for capture)
    if (landingFace !== currentFace) {
      console.log(`🦅 Cross-face move detected: ${fromSquare}(${currentFace}) → ${landingSquare}(${landingFace})`);
      
      // Check if landing square is adjacent to any opponent pieces
      const adjacentSquares = getAdjacentSquares(landingSquare);
      
      for (const adjSquare of adjacentSquares) {
        const occupyingPiece = findPieceAtSquare(adjSquare, piecePositions);
        
        if (occupyingPiece && movingPieceName) {
          // Check if it's an opponent piece
          const movingPieceColor = movingPieceName.split(/(?=[A-Z])/)[0];
          const occupyingPieceColor = occupyingPiece.split(/(?=[A-Z])/)[0];
          
          if (movingPieceColor !== occupyingPieceColor) {
            console.log(`🎯 KITE CAPTURE: ${movingPieceName} can swoop to ${landingSquare} and capture ${occupyingPiece} at ${adjSquare}`);
            // Add the landing square as a capture move (not the victim's square)
            if (!captureMoves.includes(landingSquare)) {
              captureMoves.push(landingSquare);
            }
          }
        }
      }
    }
  }
  
  console.log(`🦅 getKiteCaptureMoves returning:`, captureMoves);
  return captureMoves;
}

// Helper to get adjacent squares (orthogonal neighbors)
function getAdjacentSquares(square) {
  const face = square[0];
  const coords = square.substring(1).split("-");
  const row = parseInt(coords[0]);
  const col = parseInt(coords[1]);
  
  const adjacent = [];
  
  // Same face adjacents
  const directions = [
    [0, 1],   // right
    [0, -1],  // left  
    [1, 0],   // down
    [-1, 0]   // up
  ];
  
  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    
    if (newRow >= 1 && newRow <= 7 && newCol >= 1 && newCol <= 7) {
      adjacent.push(`${face}${newRow}-${newCol}`);
    }
  }
  
  // Cross-face adjacents (edge squares connect to other faces)
  // This is complex - for now, just return same-face adjacents
  // TODO: Add proper cross-face adjacency logic if needed
  
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
