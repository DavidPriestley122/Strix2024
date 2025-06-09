export function validateOwlMove(fromSquare, toSquare, piecePositions = {}) {
  if (!fromSquare || !toSquare) return false;
  
  // Parse square coordinates
  const parseSquare = (squareName) => {
    const face = squareName[0];
    const coords = squareName.substring(1).split("-");
    return { face, row: parseInt(coords[0]), col: parseInt(coords[1]) };
  };

  const from = parseSquare(fromSquare);
  const to = parseSquare(toSquare);
  
  // Generate the two orthogonal routes from current position
  const route1 = generateRoute(from.face, from.row, 'row');
  const route2 = generateRoute(from.face, from.col, 'column');
  
  // Owls can only move to the first adjacent square on each flightway
  const validMoves = [];
  
  // Find current position in each route and get adjacent squares
  const currentIndex1 = route1.indexOf(fromSquare);
  const currentIndex2 = route2.indexOf(fromSquare);
  
  // Add adjacent squares from row route (if they exist)
  if (currentIndex1 > 0) validMoves.push(route1[currentIndex1 - 1]);
  if (currentIndex1 < route1.length - 1) validMoves.push(route1[currentIndex1 + 1]);
  
  // Add adjacent squares from column route (if they exist)
  if (currentIndex2 > 0) validMoves.push(route2[currentIndex2 - 1]);
  if (currentIndex2 < route2.length - 1) validMoves.push(route2[currentIndex2 + 1]);
  
  // Check for ghosting moves
  const ghostingMoves = findGhostingMoves(fromSquare, piecePositions);
  validMoves.push(...ghostingMoves);
  
  return validMoves.includes(toSquare);
}

// Find all possible ghosting moves for an Owl
function findGhostingMoves(owlPosition, piecePositions) {
  const ghostMoves = [];
  
  // Parse Owl's current position
  const owlFace = owlPosition[0];
  const owlCoords = owlPosition.substring(1).split('-');
  const owlRow = parseInt(owlCoords[0]);
  const owlCol = parseInt(owlCoords[1]);
  
  // Check each crosspiece on the board
  for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
    if (piecePos === owlPosition) continue; // Skip the Owl itself
    
    // Parse crosspiece position
    const crossFace = piecePos[0];
    const crossCoords = piecePos.substring(1).split('-');
    const crossRow = parseInt(crossCoords[0]);
    const crossCol = parseInt(crossCoords[1]);
    
    // Check if Owl is cross-adjacent to this crosspiece
    console.log(`Checking cross-adjacency: Owl ${owlPosition} vs ${pieceName} at ${piecePos}`);
    if (isCrossAdjacent(owlFace, owlRow, owlCol, crossFace, crossRow, crossCol)) {
      console.log(`CROSS-ADJACENT FOUND: ${owlPosition} can ghost around ${pieceName} at ${piecePos}`);
      // Calculate ghosting destinations around this crosspiece
      const ghostDestinations = calculateGhostingDestinations(owlPosition, piecePos);
      console.log(`Calculated ghosting destinations:`, ghostDestinations);
      ghostMoves.push(...ghostDestinations);
    } else {
      console.log(`NOT cross-adjacent: ${owlPosition} vs ${pieceName} at ${piecePos}`);
    }
  }
  
  return ghostMoves;
}

// Check if Owl is cross-adjacent to a crosspiece
function isCrossAdjacent(owlFace, owlRow, owlCol, crossFace, crossRow, crossCol) {
  // Calculate what squares the crosspiece shadows
  const shadowedSquares = calculateShadowedSquares(crossFace, crossRow, crossCol);
  
  // Group shadowed squares by face to find shadowed lines
  const shadowedByFace = {};
  for (const square of shadowedSquares) {
    const face = square[0];
    if (!shadowedByFace[face]) shadowedByFace[face] = [];
    shadowedByFace[face].push(square);
  }
  
  // Check if Owl is on a line adjacent to any shadowed line
  const owlFaceShadowed = shadowedByFace[owlFace];
  if (!owlFaceShadowed) return false;
  
  // Check each shadowed line on the Owl's face
  for (const shadowedSquare of owlFaceShadowed) {
    const shadowCoords = shadowedSquare.substring(1).split('-');
    const shadowRow = parseInt(shadowCoords[0]);
    const shadowCol = parseInt(shadowCoords[1]);
    
    // Check if Owl is on a line adjacent to this shadowed line
    // Adjacent rows (same column) or adjacent columns (same row)
    const isAdjacentRow = (Math.abs(owlRow - shadowRow) === 1) && (owlCol === shadowCol);
    const isAdjacentCol = (Math.abs(owlCol - shadowCol) === 1) && (owlRow === shadowRow);
    
    if (isAdjacentRow || isAdjacentCol) {
      return true;
    }
  }
  
  return false;
}

// Calculate possible ghosting destinations around a crosspiece
function calculateGhostingDestinations(owlPosition, crossPiecePosition) {
  const ghostMoves = [];
  
  // Parse positions
  const owlFace = owlPosition[0];
  const owlCoords = owlPosition.substring(1).split('-');
  const owlRow = parseInt(owlCoords[0]);
  const owlCol = parseInt(owlCoords[1]);
  
  const crossFace = crossPiecePosition[0];
  const crossCoords = crossPiecePosition.substring(1).split('-');
  const crossRow = parseInt(crossCoords[0]);
  const crossCol = parseInt(crossCoords[1]);
  
  console.log(`Calculating ghosting: Owl ${owlPosition} around crosspiece ${crossPiecePosition}`);
  
  // Get tramlines to determine inside/outside for rotation direction
  const shadowedSquares = calculateShadowedSquares(crossFace, crossRow, crossCol);
  const tramlinesByFace = {};
  for (const square of shadowedSquares) {
    const face = square[0];
    if (!tramlinesByFace[face]) tramlinesByFace[face] = [];
    tramlinesByFace[face].push(square);
  }
  
  console.log(`Tramlines:`, tramlinesByFace);
  
  // Determine the cross-adjacent relationship (which tramline the Owl is adjacent to)
  const owlFaceTramline = tramlinesByFace[owlFace];
  if (!owlFaceTramline) return ghostMoves;
  
  // Find which specific tramline square the Owl is adjacent to
  let adjacentTramlineSquare = null;
  for (const tramlineSquare of owlFaceTramline) {
    if (isAdjacentToSquare(owlPosition, tramlineSquare)) {
      adjacentTramlineSquare = tramlineSquare;
      break;
    }
  }
  
  if (!adjacentTramlineSquare) return ghostMoves;
  
  console.log(`Owl is adjacent to tramline square: ${adjacentTramlineSquare}`);
  
  // Find the "other" tramline (on different face) for ghosting
  const otherFaces = Object.keys(tramlinesByFace).filter(f => f !== owlFace);
  if (otherFaces.length === 0) return ghostMoves;
  
  const targetFace = otherFaces[0];
  const targetTramline = tramlinesByFace[targetFace];
  
  console.log(`Target face: ${targetFace}, target tramline:`, targetTramline);
  
  // Calculate ghosting destination: Owl's foot should be adjacent to the target tramline
  // maintaining the same relative relationship as it had to the original tramline
  
  // Determine the type of adjacency (row-adjacent or column-adjacent)
  const owlTramlineSquare = adjacentTramlineSquare;
  const owlTramlineCoords = owlTramlineSquare.substring(1).split('-');
  const owlTramlineRow = parseInt(owlTramlineCoords[0]);
  const owlTramlineCol = parseInt(owlTramlineCoords[1]);
  
  // Calculate the relative position: how the Owl relates to its tramline
  const rowOffset = owlRow - owlTramlineRow;
  const colOffset = owlCol - owlTramlineCol;
  
  console.log(`Owl's offset from its tramline: row=${rowOffset}, col=${colOffset}`);
  
  // Apply the same relative positioning to the target tramline
  // Find a square from the target tramline to use as reference
  const targetTramlineSquare = targetTramline[0];
  const targetTramlineCoords = targetTramlineSquare.substring(1).split('-');
  const targetTramlineRow = parseInt(targetTramlineCoords[0]);
  const targetTramlineCol = parseInt(targetTramlineCoords[1]);
  
  // Determine if target tramline is a row or column
  const isTargetRowTramline = targetTramline.every(sq => {
    const coords = sq.substring(1).split('-');
    return parseInt(coords[0]) === targetTramlineRow;
  });
  
  let ghostDestination;
  
  if (isTargetRowTramline) {
    // Target tramline is a row - Owl should be adjacent to this row
    // Match the column from the original relationship but adjust row to be adjacent
    ghostDestination = `${targetFace}${targetTramlineRow + rowOffset}-${targetTramlineCol + colOffset}`;
  } else {
    // Target tramline is a column - Owl should be adjacent to this column  
    // Match the row from the original relationship but adjust column to be adjacent
    ghostDestination = `${targetFace}${targetTramlineRow + rowOffset}-${targetTramlineCol + colOffset}`;
  }
  
  console.log(`Calculated ghosting destination: ${ghostDestination}`);
  
  // Validate destination
  if (ghostDestination) {
    const destCoords = ghostDestination.substring(1).split('-');
    const destRow = parseInt(destCoords[0]);
    const destCol = parseInt(destCoords[1]);
    
    if (destRow >= 1 && destRow <= 7 && destCol >= 1 && destCol <= 7) {
      console.log(`Valid ghosting destination: ${ghostDestination}`);
      ghostMoves.push(ghostDestination);
    } else {
      console.log(`Invalid destination (out of bounds): ${ghostDestination}`);
    }
  }
  
  return ghostMoves;
}

// Calculate what squares a piece shadows on other faces
function calculateShadowedSquares(face, row, col) {
  const shadowedSquares = [];
  
  // Use the existing flightway logic: shadowed squares are the cross-face portions of the piece's routes
  
  // Generate the piece's row flightway
  const rowRoute = generateRoute(face, row, 'row');
  
  // Generate the piece's column flightway  
  const colRoute = generateRoute(face, col, 'column');
  
  // Extract cross-face squares from both routes
  for (const square of rowRoute) {
    if (square[0] !== face) { // Different face = shadowed square
      shadowedSquares.push(square);
    }
  }
  
  for (const square of colRoute) {
    if (square[0] !== face) { // Different face = shadowed square
      shadowedSquares.push(square);
    }
  }
  
  return shadowedSquares;
}

// Check if two squares are adjacent (orthogonally)
function isAdjacentToSquare(square1, square2) {
  if (square1 === square2) return false;
  
  const parse = (sq) => {
    const face = sq[0];
    const coords = sq.substring(1).split('-');
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

// Helper function to generate routes (copied from gameAI_simple.js)
function generateRoute(startFace, lineNumber, lineType) {
  const route = [];
  
  if (lineType === 'row') {
    // Fixed row route
    for (let col = 1; col <= 7; col++) {
      route.push(`${startFace}${lineNumber}-${col}`);
    }
    
    // Cross to next face: Brown row→Green, Yellow row→Brown, Green row→Yellow
    const nextFace = getRowCrossFace(startFace);
    for (let col = 7; col >= 1; col--) {
      route.push(`${nextFace}${col}-${lineNumber}`);
    }
  } else {
    // Fixed column route
    for (let row = 1; row <= 7; row++) {
      route.push(`${startFace}${row}-${lineNumber}`);
    }
    
    // Cross to next face: Brown col→Yellow, Yellow col→Green, Green col→Brown
    const nextFace = getColCrossFace(startFace);
    for (let col = 7; col >= 1; col--) {
      route.push(`${nextFace}${lineNumber}-${col}`);
    }
  }
  
  return route;
}

function getRowCrossFace(face) {
  // Row flightways: Brown→Green, Yellow→Brown, Green→Yellow
  const rowCrossing = { 'b': 'g', 'y': 'b', 'g': 'y' };
  return rowCrossing[face];
}

function getColCrossFace(face) {
  // Column flightways: Brown→Yellow, Yellow→Green, Green→Brown
  const colCrossing = { 'b': 'y', 'y': 'g', 'g': 'b' };
  return colCrossing[face];
}