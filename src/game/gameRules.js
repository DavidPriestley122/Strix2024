// Basic movement validation for all piece types
// Rule 6: Kites and Ravens move orthogonally any number of squares
// Rule 7: Owls move one square at a time orthogonally

export function validateOwlMove(fromSquare, toSquare) {
  const from = parseSquare(fromSquare);
  const to = parseSquare(toSquare);
  
  if (!from || !to) return false;
  
  // Same face movement only for now
  if (from.face !== to.face) return false;
  
  return isOneSquareOrthogonal(from, to);
}

export function validateKiteMove(fromSquare, toSquare) {
  const from = parseSquare(fromSquare);
  const to = parseSquare(toSquare);
  
  if (!from || !to) return false;
  
  // Same face movement only for now (cross-face moves can be added later)
  if (from.face !== to.face) return false;
  
  return isOrthogonalMove(from, to);
}

export function validateRavenMove(fromSquare, toSquare) {
  const from = parseSquare(fromSquare);
  const to = parseSquare(toSquare);
  
  if (!from || !to) return false;
  
  // Same face movement only for now (cross-face moves can be added later)
  if (from.face !== to.face) return false;
  
  return isOrthogonalMove(from, to);
}

function parseSquare(squareName) {
  const face = squareName[0];
  const coords = squareName.substring(1).split('-');
  
  return {
    face,
    row: parseInt(coords[0]),
    col: parseInt(coords[1])
  };
}

function isOneSquareOrthogonal(from, to) {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  
  // Exactly one square orthogonally
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function isOrthogonalMove(from, to) {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  
  // Must move in straight line (either same row OR same column, not diagonal)
  return (rowDiff === 0 && colDiff > 0) || (rowDiff > 0 && colDiff === 0);
}