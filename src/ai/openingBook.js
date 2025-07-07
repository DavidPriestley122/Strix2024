// openingBook.js
export class OpeningBook {
  constructor() {
    this.flightwayPatterns = new Map();
    this.currentPattern = null;
    this.patternProgress = 0;
    
    this.initializeFlightwayPatterns();
  }

  initializeFlightwayPatterns() {
    
    // Pattern 1: Lock down the center intersection
    this.addPattern("Center Lock", {
      description: "Control the critical b4-4, y4-4, g4-4 intersection zone",
      sequence: [
        {
          player: "any",
          piece: "Owl", 
          targetArea: "center-approach",
          flightwayEffect: {
            opens: ["center-to-nest direct routes"],
            blocks: ["opponent center access"],
            creates: ["ghosting pivot opportunities"]
          }
        },
        {
          player: "any", 
          piece: "Raven",
          targetArea: "center-support", 
          flightwayEffect: {
            opens: ["mobbing cross-lanes"],
            secures: ["owl protection"],
            threatens: ["opponent center pieces"]
          }
        }
      ]
    });

    // Pattern 2: Edge sweep and contain
    this.addPattern("Edge Sweep", {
      description: "Control perimeter flightways to limit opponent mobility",
      sequence: [
        {
          player: "any",
          piece: "Kite",
          targetArea: "edge-aggressive",
          flightwayEffect: {
            opens: ["cross-face swooping lanes"],
            blocks: ["opponent edge escape routes"],
            threatens: ["multiple capture angles"]
          }
        },
        {
          player: "any",
          piece: "Raven", 
          targetArea: "edge-support",
          flightwayEffect: {
            opens: ["secondary mobbing positions"],
            creates: ["kite protection"],
            controls: ["corner access points"]
          }
        }
      ]
    });

    // Pattern 3: Rapid ghosting setup
    this.addPattern("Ghost Strike", {
      description: "Create immediate cross-adjacent ghosting threats",
      sequence: [
        {
          player: "any",
          piece: "Raven",
          targetArea: "cross-adjacent-setup",
          flightwayEffect: {
            creates: ["owl ghosting pivot"],
            opens: ["surprise nest approach"],
            forces: ["opponent defensive response"]
          }
        }
      ]
    });
  }

  getOpeningMove(playerColor, gameState, moveNumber) {
    // Only provide opening moves for first move of each player
    if (moveNumber > 3) return null;
    
    // Simple, guaranteed valid opening moves to kickstart gameplay
    const pieces = this.getPlayerPieces(playerColor, gameState);
    
    // For first move only, each player advances their Owl one square
    if (moveNumber <= 3) {
      const owl = pieces.find(p => p.type === 'Owl');
      if (!owl) return null;
      
      // Simple advancement moves that should always be valid
      const currentPos = owl.position;
      const face = currentPos[0];
      const coords = currentPos.substring(1).split("-");
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);
      
      // Move Owl toward center (simple advancement)
      let targetSquare;
      if (row > 4) {
        targetSquare = `${face}${row-1}-${col}`;
      } else if (row < 4) {
        targetSquare = `${face}${row+1}-${col}`;
      } else if (col > 4) {
        targetSquare = `${face}${row}-${col-1}`;
      } else if (col < 4) {
        targetSquare = `${face}${row}-${col+1}`;
      } else {
        // Already at center, move toward nest
        targetSquare = `${face}${row+1}-${col}`;
      }
      
      return {
        piece: owl,
        targetSquare: targetSquare,
        flightwayReasoning: { creates: ["initial board activity"] }
      };
    }
    
    return null;
  }

  translateFlightwayMove(template, playerColor, gameState) {
    const pieces = this.getPlayerPieces(playerColor, gameState);
    const piece = pieces.find(p => p.type === template.piece);
    
    if (!piece) return null;

    // Convert flightway target to actual board square
    const targetSquare = this.getFlightwayTarget(
      piece, 
      template.targetArea, 
      gameState
    );

    if (!targetSquare) return null;

    return {
      piece: piece,
      targetSquare: targetSquare,
      flightwayReasoning: template.flightwayEffect
    };
  }

  getFlightwayTarget(piece, targetArea, gameState) {
    switch(targetArea) {
      case "center-approach":
        return this.findCenterApproachSquare(piece, gameState);
      
      case "center-support": 
        return this.findCenterSupportSquare(piece, gameState);
        
      case "edge-aggressive":
        return this.findEdgeAggressiveSquare(piece, gameState);
        
      case "cross-adjacent-setup":
        return this.findCrossAdjacentSquare(piece, gameState);
        
      default:
        return this.findSafeAdvanceSquare(piece, gameState);
    }
  }

  // Flightway analysis methods
  findCenterApproachSquare(piece, gameState) {
    // Find squares that open routes toward b4-4, y4-4, g4-4
    const centerSquares = ["b4-4", "y4-4", "g4-4"];
    const currentPos = piece.position;
    const face = currentPos[0];
    
    // Target the center square of the current face
    const targetCenter = `${face}4-4`;
    
    // If already at center, move toward nest
    if (currentPos === targetCenter) {
      return `${face}6-4`; // Move toward nest
    }
    
    // Move toward center square
    return this.findPathToTarget(piece, targetCenter, gameState);
  }

  findCenterSupportSquare(piece, gameState) {
    // Find squares that support center control
    const currentPos = piece.position;
    const face = currentPos[0];
    
    // Target squares adjacent to center
    const supportSquares = [
      `${face}3-4`, `${face}5-4`, `${face}4-3`, `${face}4-5`
    ];
    
    for (const square of supportSquares) {
      if (this.isSquareAvailable(square, gameState)) {
        return square;
      }
    }
    
    return this.findSafeAdvanceSquare(piece, gameState);
  }

  findEdgeAggressiveSquare(piece, gameState) {
    // Find squares along board edges for cross-face attacks
    const currentPos = piece.position;
    const face = currentPos[0];
    
    // Target edge squares that enable cross-face moves
    const edgeSquares = [
      `${face}1-7`, `${face}7-1`, `${face}7-7`, `${face}1-1`
    ];
    
    for (const square of edgeSquares) {
      if (this.isSquareAvailable(square, gameState)) {
        return square;
      }
    }
    
    return this.findSafeAdvanceSquare(piece, gameState);
  }

  findCrossAdjacentSquare(piece, gameState) {
    // Find squares that create cross-adjacent ghosting opportunities
    const currentPos = piece.position;
    const coords = currentPos.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    const face = currentPos[0];
    
    // Look for squares that would be cross-adjacent to potential targets
    const candidateSquares = [
      `${face}${row+1}-${col}`, `${face}${row-1}-${col}`,
      `${face}${row}-${col+1}`, `${face}${row}-${col-1}`
    ];
    
    for (const square of candidateSquares) {
      if (this.isValidSquare(square) && this.isSquareAvailable(square, gameState)) {
        return square;
      }
    }
    
    return this.findSafeAdvanceSquare(piece, gameState);
  }

  findSafeAdvanceSquare(piece, gameState) {
    // Find a safe square that advances the piece toward center
    const currentPos = piece.position;
    const coords = currentPos.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    const face = currentPos[0];
    
    // Try to move toward center (4,4)
    const targetRow = row < 4 ? row + 1 : row > 4 ? row - 1 : row;
    const targetCol = col < 4 ? col + 1 : col > 4 ? col - 1 : col;
    
    const targetSquare = `${face}${targetRow}-${targetCol}`;
    
    if (this.isSquareAvailable(targetSquare, gameState)) {
      return targetSquare;
    }
    
    // Fallback: find any available adjacent square
    const adjacentSquares = [
      `${face}${row+1}-${col}`, `${face}${row-1}-${col}`,
      `${face}${row}-${col+1}`, `${face}${row}-${col-1}`
    ];
    
    for (const square of adjacentSquares) {
      if (this.isValidSquare(square) && this.isSquareAvailable(square, gameState)) {
        return square;
      }
    }
    
    return null;
  }

  findPathToTarget(piece, targetSquare, gameState) {
    // Simple pathfinding toward target
    const currentPos = piece.position;
    const currentCoords = currentPos.substring(1).split("-");
    const targetCoords = targetSquare.substring(1).split("-");
    
    const currentRow = parseInt(currentCoords[0]);
    const currentCol = parseInt(currentCoords[1]);
    const targetRow = parseInt(targetCoords[0]);
    const targetCol = parseInt(targetCoords[1]);
    
    const face = currentPos[0];
    
    // Move one step toward target
    let nextRow = currentRow;
    let nextCol = currentCol;
    
    if (currentRow < targetRow) nextRow++;
    else if (currentRow > targetRow) nextRow--;
    else if (currentCol < targetCol) nextCol++;
    else if (currentCol > targetCol) nextCol--;
    
    const nextSquare = `${face}${nextRow}-${nextCol}`;
    
    if (this.isSquareAvailable(nextSquare, gameState)) {
      return nextSquare;
    }
    
    return this.findSafeAdvanceSquare(piece, gameState);
  }

  // Utility methods
  getPlayerPieces(playerColor, gameState) {
    const pieces = [];
    for (const [pieceName, position] of Object.entries(gameState.piecePositions)) {
      if (pieceName.startsWith(playerColor) && position !== "captured") {
        pieces.push({
          name: pieceName,
          position: position,
          type: this.getPieceType(pieceName)
        });
      }
    }
    return pieces;
  }

  getPieceType(pieceName) {
    if (pieceName.includes("Owl")) return "Owl";
    if (pieceName.includes("Kite")) return "Kite";
    if (pieceName.includes("Raven")) return "Raven";
    return "Unknown";
  }

  isSquareAvailable(square, gameState) {
    if (!this.isValidSquare(square)) return false;
    
    // Check if square is occupied
    for (const position of Object.values(gameState.piecePositions)) {
      if (position === square) return false;
    }
    
    return true;
  }

  isValidSquare(square) {
    const coords = square.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    
    return row >= 1 && row <= 7 && col >= 1 && col <= 7;
  }

  // Pattern selection
  selectPatternForGame() {
    const patterns = Array.from(this.flightwayPatterns.values());
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  addPattern(name, pattern) {
    this.flightwayPatterns.set(name, pattern);
  }
}