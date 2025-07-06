/// strixPatterns.js - Starting with ONE tactical pattern

export class StrixPatterns {
  constructor(gameStateManager) {
    this.gameState = gameStateManager;
    this.debugLogging = true;
  }

  log(message, data = null) {
    if (this.debugLogging) {
      const prefix = "🎯 PATTERNS";
      if (data) {
        console.log(`${prefix}: ${message}`, data);
      } else {
        console.log(`${prefix}: ${message}`);
      }
    }
  }

  // MAIN EVALUATION FUNCTION - detect opponent threats
  evaluateMovePatterns(move, playerColor, gameState = null) {
    const state = gameState || this.gameState;

    // Check if this move blocks an opponent's winning ghost threat
    const blockingBonus = this.evaluateGhostThreatBlocking(
      move,
      playerColor,
      state
    );

    if (blockingBonus !== 0) {
      this.log(
        `${move.piece.name}→${move.targetSquare} threat blocking bonus: ${blockingBonus}`
      );
    }

    return blockingBonus;
  }

  // PATTERN 1: GHOST THREAT DETECTION AND BLOCKING
  // "Detect when opponent can ghost to victory and prioritize blocking moves"
  evaluateGhostThreatBlocking(move, playerColor, gameState) {
    // Debug: Always log what we're checking
    this.log(
      `🔍 Checking ${playerColor} move ${move.piece.name}→${move.targetSquare} for threat blocking`
    );

    // Check each opponent for potential winning ghost setups
    const opponents = ["brown", "yellow", "green"].filter(
      (p) => p !== playerColor
    );

    for (const opponentColor of opponents) {
      const opponentOwl = `${opponentColor}Owl`;
      const owlPosition = gameState.piecePositions[opponentOwl];

      this.log(`🔍 Checking ${opponentColor} owl at ${owlPosition}`);

      if (!owlPosition || owlPosition === "captured") {
        this.log(`❌ ${opponentColor} owl not active`);
        continue;
      }

      // Check if opponent has winning ghost opportunities
      const ghostThreats = this.detectOpponentGhostThreats(
        opponentColor,
        gameState
      );
      this.log(
        `🔍 Found ${ghostThreats.length} ghost threats for ${opponentColor}`
      );

      for (const threat of ghostThreats) {
        this.log(
          `⚠️ THREAT DETECTED: ${threat.opponentColor} can ghost ${threat.owlPos}→${threat.nestSquare} using crosspiece`
        );

        // Check if our move blocks this specific ghost threat
        if (this.moveBlocksGhostThreat(move, threat)) {
          this.log(
            `🛡️ BLOCKING GHOST: ${move.piece.name}→${move.targetSquare} blocks ${opponentColor} ghost ${threat.owlPos}→${threat.nestSquare}`
          );
          return 5000; // High bonus for blocking winning moves
        } else {
          this.log(
            `➡️ Move ${move.piece.name}→${move.targetSquare} does not block threat ${threat.owlPos}→${threat.nestSquare}`
          );
        }
      }
    }

    return 0; // No blocking value
  }

  // Detect all ghost threats for a specific opponent
  detectOpponentGhostThreats(opponentColor, gameState) {
    const threats = [];
    const opponentOwl = `${opponentColor}Owl`;
    const owlPosition = gameState.piecePositions[opponentOwl];

    if (!owlPosition || owlPosition === "captured") return threats;

    const nestSquares = ["b7-7", "y7-7", "g7-7"];

    for (const nestSquare of nestSquares) {
      if (
        this.canOpponentGhostToNest(
          opponentColor,
          owlPosition,
          nestSquare,
          gameState
        )
      ) {
        threats.push({
          opponentColor: opponentColor,
          owlPos: owlPosition,
          nestSquare: nestSquare,
          crosspiece: this.findCrosspiece(owlPosition, nestSquare, gameState),
        });
      }
    }

    return threats;
  }

  // Check if opponent can ghost to a specific nest square
  canOpponentGhostToNest(opponentColor, owlPos, nestSquare, gameState) {
    // SPECIFIC PATTERNS from your game analysis:

    // Brown Owl + piece on Y face = can ghost to G nest
    if (opponentColor === "brown" && nestSquare === "g7-7") {
      return this.existsPieceOnFace("y", gameState);
    }

    // Yellow Owl + piece on G face = can ghost to B nest
    if (opponentColor === "yellow" && nestSquare === "b7-7") {
      return this.existsPieceOnFace("g", gameState);
    }

    // Green Owl + piece on B face = can ghost to Y nest
    if (opponentColor === "green" && nestSquare === "y7-7") {
      return this.existsPieceOnFace("b", gameState);
    }

    return false;
  }

  // Check if there's any piece on a specific face that could serve as crosspiece
  existsPieceOnFace(face, gameState) {
    for (const [pieceName, position] of Object.entries(
      gameState.piecePositions
    )) {
      if (position !== "captured" && position[0] === face) {
        return true;
      }
    }
    return false;
  }

  // Find what piece is serving as the crosspiece (for logging)
  findCrosspiece(owlPos, nestSquare, gameState) {
    const requiredFace = this.getRequiredCrosspieceFace(owlPos, nestSquare);

    for (const [pieceName, position] of Object.entries(
      gameState.piecePositions
    )) {
      if (position !== "captured" && position[0] === requiredFace) {
        return pieceName; // Return first piece found on that face
      }
    }
    return null;
  }

  // Get which face needs a crosspiece for the ghost
  getRequiredCrosspieceFace(owlPos, nestSquare) {
    const owlFace = owlPos[0];
    const nestFace = nestSquare[0];

    // For Brown Owl (b) to reach G nest (g), needs Y face crosspiece
    if (owlFace === "b" && nestFace === "g") return "y";
    // For Yellow Owl (y) to reach B nest (b), needs G face crosspiece
    if (owlFace === "y" && nestFace === "b") return "g";
    // For Green Owl (g) to reach Y nest (y), needs B face crosspiece
    if (owlFace === "g" && nestFace === "y") return "b";

    return null;
  }

  // Check if our move blocks a specific ghost threat
  moveBlocksGhostThreat(move, threat) {
    // Method 1: Occupy the target nest square directly
    if (move.targetSquare === threat.nestSquare) {
      return true;
    }

    // Method 2: Remove/attack the crosspiece (simplified check)
    // TODO: This needs more sophisticated capture detection

    // Method 3: Block critical squares near the nest (simplified)
    if (this.isNearNest(move.targetSquare, threat.nestSquare)) {
      return true;
    }

    return false;
  }

  // Check if move is near a nest square (simple blocking heuristic)
  isNearNest(moveSquare, nestSquare) {
    const moveCoords = this.parsePosition(moveSquare);
    const nestCoords = this.parsePosition(nestSquare);

    // Same face and close to nest
    return (
      moveCoords.face === nestCoords.face &&
      this.calculateDistance(moveSquare, nestSquare) <= 2
    );
  }

  // Helper functions
  calculateDistance(pos1, pos2) {
    const coords1 = this.parsePosition(pos1);
    const coords2 = this.parsePosition(pos2);
    return (
      Math.abs(coords1.row - coords2.row) + Math.abs(coords1.col - coords2.col)
    );
  }

  parsePosition(position) {
    const coords = position.substring(1).split("-");
    return {
      face: position[0],
      row: parseInt(coords[0]),
      col: parseInt(coords[1]),
    };
  }
}
