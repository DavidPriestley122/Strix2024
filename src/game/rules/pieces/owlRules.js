// Owl movement and behavior rules
// Rule 7: Owls move one square at a time orthogonally

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

function isOneSquareOrthogonal(from, to) {
  const rowDiff = Math.abs(from.row - to.row);
  const colDiff = Math.abs(from.col - to.col);
  
  // Exactly one square orthogonally
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function validateOwlMove(fromSquare, toSquare) {
  const from = parseSquare(fromSquare);
  const to = parseSquare(toSquare);
  
  if (!from || !to) return false;
  
  // Check for cross-face movement (Owls can move one square across faces)
  if (isCrossFaceMove(fromSquare, toSquare)) {
    return validateCrossFaceMove(fromSquare, toSquare);
  }
  
  // Same face movement (one square orthogonally)
  return isOneSquareOrthogonal(from, to);
}

// TODO: Add Owl ghosting mechanics
// TODO: Add Owl capture rules
// TODO: Add cross-face movement validation