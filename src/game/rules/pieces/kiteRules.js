// Kite movement and behavior rules
// Rule 6: Kites move orthogonally any number of squares

import { isCrossFaceMove, validateCrossFaceMove } from '../crossFaceMovement.js';

function parseSquare(squareName) {
  const face = squareName[0];
  const coords = squareName.substring(1).split('-');
  
  return {
    face,
    row: parseInt(coords[0]),
    col: parseInt(coords[1])
  };
}

function isOrthogonalMove(from, to) {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  
  // Must move in straight line (either same row OR same column, not diagonal)
  return (rowDiff === 0 && colDiff > 0) || (rowDiff > 0 && colDiff === 0);
}

export function validateKiteMove(fromSquare, toSquare) {
  const from = parseSquare(fromSquare);
  const to = parseSquare(toSquare);
  
  if (!from || !to) return false;
  
  // Check for cross-face movement
  if (isCrossFaceMove(fromSquare, toSquare)) {
    return validateCrossFaceMove(fromSquare, toSquare);
  }
  
  // Same face movement
  return isOrthogonalMove(from, to);
}

// TODO: Add Kite swooping capture mechanics
// TODO: Add cross-face movement validation
// TODO: Add path blocking validation (cannot pass through occupied squares)