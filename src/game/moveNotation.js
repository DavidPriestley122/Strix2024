// Move Notation Parser for Strix
// Handles text input like "bO-b72", "yK-g25 x yR", "bR-g25 x yO x yK"

export class MoveNotationParser {
  constructor() {
    this.validColors = ['b', 'y', 'g'];
    this.validPieces = ['O', 'K', 'R']; // Owl, Kite, Raven
    this.validSquarePattern = /^[byg][1-7][1-7]$/;
  }

  /**
   * Parse a move notation string into a structured move object
   * @param {string} notation - e.g., "bO-b72", "yK-g25 x yR", "x yR", "restore yR"
   * @returns {Object|null} Parsed move object or null if invalid
   */
  parseMove(notation) {
    if (!notation || typeof notation !== 'string') return null;
    
    const trimmed = notation.trim();
    
    // Handle special commands
    if (trimmed.startsWith('restore ')) {
      return this.parseRestore(trimmed);
    }
    
    if (trimmed.startsWith('x ')) {
      return this.parseDirectCapture(trimmed);
    }
    
    // Handle regular moves with optional captures
    return this.parseRegularMove(trimmed);
  }

  /**
   * Parse restore command: "restore yR"
   */
  parseRestore(notation) {
    const match = notation.match(/^restore\s+([byg][OR])$/);
    if (!match) return null;
    
    const [, piece] = match;
    return {
      type: 'restore',
      piece: piece,
      valid: true
    };
  }

  /**
   * Parse direct capture: "x yR"
   */
  parseDirectCapture(notation) {
    const match = notation.match(/^x\s+([byg][OR])$/);
    if (!match) return null;
    
    const [, victim] = match;
    return {
      type: 'capture',
      victims: [victim],
      valid: true
    };
  }

  /**
   * Parse regular move: "bO-b72" or "yK-g25 x yR x yK"
   */
  parseRegularMove(notation) {
    // Split by 'x' to separate move from captures
    const parts = notation.split(/\s+x\s+/);
    const movePart = parts[0].trim();
    const captureParts = parts.slice(1);

    // Parse the move part: "bO-b72"
    const moveMatch = movePart.match(/^([byg][ORK])-([byg][1-7][1-7])$/);
    if (!moveMatch) return null;

    const [, piece, destination] = moveMatch;
    
    // Validate piece notation
    if (!this.isValidPiece(piece)) return null;
    
    // Validate destination square
    if (!this.isValidSquare(destination)) return null;

    // Parse captures if any
    const victims = [];
    for (const capturePart of captureParts) {
      const victim = capturePart.trim();
      if (!this.isValidPiece(victim)) return null;
      victims.push(victim);
    }

    return {
      type: 'move',
      piece: piece,
      destination: destination,
      victims: victims,
      valid: true
    };
  }

  /**
   * Validate piece notation (e.g., "bO", "yK", "gR")
   */
  isValidPiece(piece) {
    if (!piece || piece.length !== 2) return false;
    const color = piece[0];
    const type = piece[1];
    return this.validColors.includes(color) && this.validPieces.includes(type);
  }

  /**
   * Validate square notation (e.g., "b72", "y34", "g11")
   */
  isValidSquare(square) {
    if (!square || square.length !== 3) return false;
    return this.validSquarePattern.test(square);
  }

  /**
   * Convert parsed move back to notation string
   */
  moveToNotation(moveObj) {
    if (!moveObj || !moveObj.valid) return '';
    
    switch (moveObj.type) {
      case 'restore':
        return `restore ${moveObj.piece}`;
      
      case 'capture':
        return `x ${moveObj.victims.join(' x ')}`;
      
      case 'move':
        let notation = `${moveObj.piece}-${moveObj.destination}`;
        if (moveObj.victims && moveObj.victims.length > 0) {
          notation += ' x ' + moveObj.victims.join(' x ');
        }
        return notation;
      
      default:
        return '';
    }
  }

  /**
   * Get piece name from notation (e.g., "bO" -> "brownOwl")
   */
  getPieceName(pieceNotation) {
    if (!this.isValidPiece(pieceNotation)) return null;
    
    const colorMap = { 'b': 'brown', 'y': 'yellow', 'g': 'green' };
    const typeMap = { 'O': 'Owl', 'K': 'Kite', 'R': 'Raven' };
    
    const color = colorMap[pieceNotation[0]];
    const type = typeMap[pieceNotation[1]];
    
    return `${color}${type}`;
  }

  /**
   * Get notation from piece name (e.g., "brownOwl" -> "bO")
   */
  getNotationFromPieceName(pieceName) {
    if (!pieceName) return null;
    
    const colorMap = { 'brown': 'b', 'yellow': 'y', 'green': 'g' };
    const typeMap = { 'Owl': 'O', 'Kite': 'K', 'Raven': 'R' };
    
    // Extract color and type from piece name
    let color = null;
    let type = null;
    
    for (const [fullColor, shortColor] of Object.entries(colorMap)) {
      if (pieceName.toLowerCase().startsWith(fullColor)) {
        color = shortColor;
        break;
      }
    }
    
    for (const [fullType, shortType] of Object.entries(typeMap)) {
      if (pieceName.endsWith(fullType)) {
        type = shortType;
        break;
      }
    }
    
    return (color && type) ? `${color}${type}` : null;
  }
}

// Create a singleton instance for use throughout the application
export const moveNotation = new MoveNotationParser();