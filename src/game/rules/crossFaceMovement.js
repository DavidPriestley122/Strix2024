// Cross-face movement logic for the 3D Strix board
// Follows anti-clockwise edge sequence: Brown → Yellow → Green → Brown

/**
 * Parses a square name into face and coordinates
 * @param {string} squareName - Square name (e.g., "b2-7")
 * @returns {object} {face, row, col}
 */
function parseSquare(squareName) {
  const face = squareName[0];
  const coords = squareName.substring(1).split('-');
  return {
    face,
    row: parseInt(coords[0]),
    col: parseInt(coords[1])
  };
}

/**
 * Determines if a move crosses from one face to another
 */
export function isCrossFaceMove(fromSquare, toSquare) {
  const fromFace = fromSquare[0];
  const toFace = toSquare[0];
  return fromFace !== toFace;
}

/**
 * Validates cross-face transitions following the coordinate flip rule:
 * - Brown ↔ Yellow: coordinates flip (row,col) ↔ (col,row)
 * - Yellow ↔ Green: coordinates flip (row,col) ↔ (col,row)
 * - Green ↔ Brown: coordinates flip (row,col) ↔ (col,row)
 * 
 * Examples:
 * - b2-7 → y7-2 (Brown row=2,col=7 becomes Yellow row=7,col=2)
 * - y7-3 → g3-7 (Yellow row=7,col=3 becomes Green row=3,col=7)
 * - g3-1 → b1-3 (Green row=3,col=1 becomes Brown row=1,col=3)
 */
export function validateCrossFaceMove(fromSquare, toSquare) {
  const from = parseSquare(fromSquare);
  const to = parseSquare(toSquare);
  
  if (!from || !to) return false;
  
  // Brown ↔ Yellow transitions (coordinates flip)
  if (from.face === 'b' && to.face === 'y') {
    return from.row === to.col && from.col === to.row;
  }
  if (from.face === 'y' && to.face === 'b') {
    return from.row === to.col && from.col === to.row;
  }
  
  // Yellow ↔ Green transitions (coordinates flip)
  if (from.face === 'y' && to.face === 'g') {
    return from.row === to.col && from.col === to.row;
  }
  if (from.face === 'g' && to.face === 'y') {
    return from.row === to.col && from.col === to.row;
  }
  
  // Green ↔ Brown transitions (coordinates flip)
  if (from.face === 'g' && to.face === 'b') {
    return from.row === to.col && from.col === to.row;
  }
  if (from.face === 'b' && to.face === 'g') {
    return from.row === to.col && from.col === to.row;
  }
  
  return false;
}

/**
 * Checks if two faces are adjacent in the anti-clockwise sequence
 */
export function areAdjacentFaces(face1, face2) {
  const adjacentPairs = new Set([
    'by', 'yb', // Brown ↔ Yellow
    'yg', 'gy', // Yellow ↔ Green  
    'gb', 'bg'  // Green ↔ Brown
  ]);
  return adjacentPairs.has(face1 + face2);
}

/**
 * Validates a multi-square cross-face move (for Kites and Ravens)
 * For now, only allows single-step cross-face moves
 * TODO: Implement multi-segment cross-face path validation for longer moves
 */
export function validateMultiSquareCrossFaceMove(fromSquare, toSquare, piecePositions) {
  // For now, only allow direct cross-face moves (single step)
  return validateCrossFaceMove(fromSquare, toSquare);
}