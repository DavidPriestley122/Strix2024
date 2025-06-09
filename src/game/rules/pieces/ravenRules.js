export function validateRavenMove(fromSquare, toSquare) {
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
  
  // Ravens can move to any square on either route (except current position)
  const allRouteSquares = [...route1, ...route2].filter(square => square !== fromSquare);
  
  return allRouteSquares.includes(toSquare);
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