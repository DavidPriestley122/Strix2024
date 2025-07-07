// strixPatterns.js - Complete flightway-based tactical pattern recognition

import {
  convertToFlightway,
  checkCrossAdjacency,
  calculateSimpleGhostingDestination,
  generateFlightwayRoute,
  getFaceFromFlightway,
  isSquareOccupied,
} from "../game/rules/flightwayUtils.js";

export class StrixPatterns {
  constructor(gameStateManager) {
    this.gameState = gameStateManager;
    this.debugLogging = true;
  }

  log(message, data = null) {
    if (this.debugLogging) {
      const prefix = "🎯 FLIGHTWAY-PATTERNS";
      if (data) {
        console.log(`${prefix}: ${message}`, data);
      } else {
        console.log(`${prefix}: ${message}`);
      }
    }
  }

  // MAIN EVALUATION FUNCTION
  evaluateMovePatterns(move, playerColor, gameState = null) {
    const state = gameState || this.gameState;

    // Extract piece type from name
    const pieceType = this.getPieceType(move.piece.name);
    const piecePosition = state.piecePositions[move.piece.name];

    // Create enhanced move object
    const enhancedMove = {
      ...move,
      piece: {
        ...move.piece,
        type: pieceType,
        position: piecePosition,
      },
    };

    // Pattern 1: Block complete ghost threats using flightway analysis
    const blockingBonus = this.evaluateCompleteGhostThreatBlocking(
      enhancedMove,
      playerColor,
      state
    );

    if (blockingBonus !== 0) {
      this.log(
        `${move.piece.name}→${move.targetSquare} pattern bonus: ${blockingBonus}`
      );
    }

    return blockingBonus;
  }

  // CORE PATTERN: Complete ghost threat detection and blocking
  evaluateCompleteGhostThreatBlocking(move, playerColor, gameState) {
    const opponents = ["brown", "yellow", "green"].filter(
      (p) => p !== playerColor
    );

    for (const opponentColor of opponents) {
      const threats = this.detectCompleteGhostThreats(opponentColor, gameState);

      for (const threat of threats) {
        const blockingBonus = this.moveBlocksCompleteGhostThreat(move, threat);
        if (blockingBonus > 0) {
          return blockingBonus;
        }

        // Check if our move captures the threatening piece (let capture scoring handle this)
        if (this.moveCapturesThreateningPiece(move, threat, gameState)) {
          this.log(
            `🎯 CAPTURING THREAT: ${move.piece.name}→${move.targetSquare} captures ${threat.owlName}`
          );
          return 0; // Let capture scoring handle this
        }
      }
    }

    return 0;
  }

  // Detect complete ghost threats with all blocking options
  detectCompleteGhostThreats(opponentColor, gameState) {
    const threats = [];
    const owlName = `${opponentColor}Owl`;
    const owlPosition = gameState.piecePositions[owlName];

    if (!owlPosition || owlPosition === "captured") {
      return threats;
    }

    // Find all potential crosspieces for ghosting
    const potentialCrosspieces = [];
    for (const [pieceName, position] of Object.entries(
      gameState.piecePositions
    )) {
      if (position !== "captured" && !pieceName.startsWith(opponentColor)) {
        potentialCrosspieces.push({ name: pieceName, position: position });
      }
    }

    // Check each crosspiece for valid ghosting to nest
    const nestSquares = ["b7-7", "y7-7", "g7-7"];

    for (const crosspiece of potentialCrosspieces) {
      const crossAdjacency = checkCrossAdjacency(
        owlPosition,
        crosspiece.position
      );

      if (crossAdjacency.isAdjacent) {
        const ghostDestination = calculateSimpleGhostingDestination(
          owlPosition,
          crosspiece.position,
          crossAdjacency
        );

        if (ghostDestination && nestSquares.includes(ghostDestination)) {
          // Calculate all possible blocking squares for this threat
          const blockingSquares = this.calculateAllBlockingSquares(
            owlPosition,
            ghostDestination,
            crosspiece.position,
            gameState
          );

          this.log(
            `⚠️ COMPLETE NEST THREAT: ${owlName} at ${owlPosition} can ghost to ${ghostDestination} via ${crosspiece.name} (${blockingSquares.length} blocking options)`
          );

          threats.push({
            owlName: owlName,
            owlPosition: owlPosition,
            destination: ghostDestination,
            crosspiece: crosspiece.name,
            crosspiecePosition: crosspiece.position,
            blockingSquares: blockingSquares,
            isNestThreat: true,
          });
        }
      }
    }

    return threats;
  }

  // Calculate all possible blocking squares (ahead, behind, corner crosspieces)
  calculateAllBlockingSquares(
    owlPosition,
    nestDestination,
    crosspiecePosition,
    gameState
  ) {
    const blockingSquares = [];

    // Determine the flightway the owl travels on to reach the nest
    const travelFlightway = this.determineGhostFlightway(
      owlPosition,
      nestDestination
    );

    if (!travelFlightway) return blockingSquares;

    // Method 1: Direct flightway blocking (ahead and behind)
    const directBlocks = this.calculateDirectFlightwayBlocks(
      owlPosition,
      nestDestination,
      travelFlightway,
      crosspiecePosition,
      gameState
    );
    blockingSquares.push(...directBlocks);

    // Method 2: Corner crosspiece blocking (ahead and behind)
    const crosspieceBlocks = this.calculateCornerCrosspieceBlocks(
      owlPosition,
      travelFlightway,
      crosspiecePosition,
      gameState
    );
    blockingSquares.push(...crosspieceBlocks);

    return blockingSquares;
  }

  // Calculate direct blocking on the ghost flightway
  calculateDirectFlightwayBlocks(
    owlPosition,
    nestDestination,
    travelFlightway,
    crosspiecePosition,
    gameState
  ) {
    const blocks = [];

    // Generate the complete route for the travel flightway
    const fullRoute = generateFlightwayRoute(
      travelFlightway.face,
      travelFlightway.number
    );

    const owlIndex = fullRoute.indexOf(owlPosition);
    const nestIndex = fullRoute.indexOf(nestDestination);

    if (owlIndex === -1 || nestIndex === -1) return blocks;

    // Squares ahead of owl (between owl and nest)
    const start = Math.min(owlIndex, nestIndex);
    const end = Math.max(owlIndex, nestIndex);

    for (let i = start + 1; i < end; i++) {
      const square = fullRoute[i];
      if (this.canPlacePiece(square, crosspiecePosition, gameState)) {
        blocks.push({
          square: square,
          type: "direct_ahead",
          safety: this.evaluateBlockingSafety(square, owlPosition),
        });
      }
    }

    // Squares behind owl (on same flightway, behind current position)
    for (let i = 0; i < start; i++) {
      const square = fullRoute[i];
      if (this.canPlacePiece(square, crosspiecePosition, gameState)) {
        blocks.push({
          square: square,
          type: "direct_behind",
          safety: "safe", // Behind moves are generally safer
        });
      }
    }

    return blocks;
  }

  // Calculate corner crosspiece blocking (y7 flightway type blocks)
  calculateCornerCrosspieceBlocks(
    owlPosition,
    travelFlightway,
    crosspiecePosition,
    gameState
  ) {
    const blocks = [];

    // Get the intersecting flightways that create corner blocking opportunities
    const intersectingFlightways = this.getIntersectingFlightways(
      owlPosition,
      travelFlightway
    );

    for (const flightway of intersectingFlightways) {
      const flightwayRoute = generateFlightwayRoute(
        flightway.face,
        flightway.number
      );

      if (flightwayRoute.length >= 8) {
        const eighthSquare = flightwayRoute[7]; // 8th square (0-indexed)

        // Check if this square is ahead or behind the owl's current position
        const blockType = this.isSquareAheadOfOwl(
          eighthSquare,
          owlPosition,
          travelFlightway
        )
          ? "corner_ahead"
          : "corner_behind";

        if (this.canPlacePiece(eighthSquare, crosspiecePosition, gameState)) {
          blocks.push({
            square: eighthSquare,
            type: blockType,
            safety: "safe", // Corner crosspieces are generally safe
          });
        }
      }
    }

    return blocks;
  }

  // Check if our move blocks the complete ghost threat
  moveBlocksCompleteGhostThreat(move, threat) {
    const targetSquare = move.targetSquare;

    // Check if our move lands on any of the calculated blocking squares
    for (const blockInfo of threat.blockingSquares) {
      if (blockInfo.square === targetSquare) {
        this.log(
          `🛡️ ${blockInfo.type.toUpperCase()} BLOCK: ${
            move.piece.name
          }→${targetSquare} (${blockInfo.safety})`
        );

        // Return bonus based on block type and safety
        if (blockInfo.type.includes("behind")) return 4000; // Safer blocks
        if (blockInfo.safety === "safe") return 5000; // Safe direct blocks
        if (blockInfo.safety === "risky") return 3000; // Risky but valuable
        if (blockInfo.safety === "dangerous") return 2000; // Last resort
      }
    }

    return 0;
  }

  // Check if our move captures the threatening piece
  moveCapturesThreateningPiece(move, threat, gameState) {
    const pieceType = move.piece.type;
    const piecePosition = move.piece.position;
    const targetSquare = move.targetSquare;

    // Direct capture: moving to the threatening owl's square
    if (targetSquare === threat.owlPosition) {
      return true;
    }

    // Kite swooping capture
    if (pieceType === "Kite") {
      const currentFace = piecePosition[0];
      const targetFace = targetSquare[0];

      if (currentFace !== targetFace) {
        const adjacentSquares = this.getAdjacentSquares(targetSquare);
        if (adjacentSquares.includes(threat.owlPosition)) {
          return true;
        }
      }
    }

    // Raven mobbing capture (simplified check)
    if (pieceType === "Raven") {
      const currentFace = piecePosition[0];
      const targetFace = targetSquare[0];

      if (currentFace !== targetFace) {
        const distance = this.calculateSimpleDistance(
          targetSquare,
          threat.owlPosition
        );
        if (distance <= 2) {
          return true;
        }
      }
    }

    return false;
  }

  // Helper functions
  determineGhostFlightway(owlPosition, nestDestination) {
    if (nestDestination === "g7-7") return { face: "g", number: 7 };
    if (nestDestination === "b7-7") return { face: "b", number: 7 };
    if (nestDestination === "y7-7") return { face: "y", number: 7 };
    return null;
  }

  getIntersectingFlightways(owlPosition, travelFlightway) {
    const intersecting = [];

    // For Brown Owl ghosting on g7 flightway, intersects with b1-b6 flightways
    if (travelFlightway.face === "g" && travelFlightway.number === 7) {
      for (let i = 1; i <= 6; i++) {
        intersecting.push({ face: "b", number: i });
      }
    }
    // For Yellow Owl ghosting on b7 flightway, intersects with y1-y6 flightways
    else if (travelFlightway.face === "b" && travelFlightway.number === 7) {
      for (let i = 1; i <= 6; i++) {
        intersecting.push({ face: "y", number: i });
      }
    }
    // For Green Owl ghosting on y7 flightway, intersects with g1-g6 flightways
    else if (travelFlightway.face === "y" && travelFlightway.number === 7) {
      for (let i = 1; i <= 6; i++) {
        intersecting.push({ face: "g", number: i });
      }
    }

    return intersecting;
  }

  canPlacePiece(square, crosspiecePosition, gameState) {
    // Check if square is not occupied
    if (isSquareOccupied(square, gameState.piecePositions)) return false;

    // Check if shadowed by crosspiece
    if (this.isSquareShadowedBy(square, crosspiecePosition)) return false;

    // Check if shadowed by other pieces (simplified check)
    return !this.isSquareShadowed(square, gameState);
  }

  evaluateBlockingSafety(blockingSquare, owlPosition) {
    const distance = this.calculateSimpleDistance(blockingSquare, owlPosition);

    if (distance <= 1) return "dangerous"; // Adjacent to threatening owl
    if (distance === 2) return "risky"; // Close to threatening owl
    return "safe"; // Far from threatening owl
  }

  isSquareAheadOfOwl(square, owlPosition, travelFlightway) {
    const flightwayRoute = generateFlightwayRoute(
      travelFlightway.face,
      travelFlightway.number
    );
    const owlIndex = flightwayRoute.indexOf(owlPosition);
    const squareIndex = flightwayRoute.indexOf(square);

    if (owlIndex === -1 || squareIndex === -1) return false;

    // For ghost moves toward nest, ahead means higher index toward nest
    return squareIndex > owlIndex;
  }

  isSquareShadowedBy(square, piecePosition) {
    // Simplified shadowing check - piece shadows along its flightways
    const pieceFlightway = convertToFlightway(piecePosition);
    const squareFlightway = convertToFlightway(square);

    if (!pieceFlightway || !squareFlightway) return false;

    // Check if they share a flightway (indicating potential shadowing)
    const pieceMatch = pieceFlightway.match(/([byg])(\d)([byg])(\d)/);
    const squareMatch = squareFlightway.match(/([byg])(\d)([byg])(\d)/);

    if (!pieceMatch || !squareMatch) return false;

    const pieceFlightways = [
      `${pieceMatch[1]}${pieceMatch[2]}`,
      `${pieceMatch[3]}${pieceMatch[4]}`,
    ];
    const squareFlightways = [
      `${squareMatch[1]}${squareMatch[2]}`,
      `${squareMatch[3]}${squareMatch[4]}`,
    ];

    // If they share a flightway, there's potential shadowing
    return pieceFlightways.some((pf) => squareFlightways.includes(pf));
  }

  isSquareShadowed(square, gameState) {
    // Use existing game shadowing logic if available
    // For now, simplified check
    return false;
  }

  getPieceType(pieceName) {
    if (pieceName.endsWith("Owl")) return "Owl";
    if (pieceName.endsWith("Kite")) return "Kite";
    if (pieceName.endsWith("Raven")) return "Raven";
    return "Unknown";
  }

  getAdjacentSquares(square) {
    const face = square[0];
    const coords = square.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);

    const adjacent = [];
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 1 && newRow <= 7 && newCol >= 1 && newCol <= 7) {
        adjacent.push(`${face}${newRow}-${newCol}`);
      }
    }

    return adjacent;
  }

  calculateSimpleDistance(pos1, pos2) {
    const coords1 = this.parsePosition(pos1);
    const coords2 = this.parsePosition(pos2);

    // If different faces, return approximate distance
    if (coords1.face !== coords2.face) {
      return 5;
    }

    return (
      Math.abs(coords1.row - coords2.row) + Math.abs(coords1.col - coords2.col)
    );
  }

  parsePosition(position) {
    const face = position[0];
    const coords = position.substring(1).split("-");
    return {
      face: face,
      row: parseInt(coords[0]),
      col: parseInt(coords[1]),
    };
  }
}

// Export for testing
export function testCompletePatternDetection(gameStateManager) {
  const patterns = new StrixPatterns(gameStateManager);

  console.log("=== TESTING COMPLETE FLIGHTWAY PATTERN DETECTION ===");

  const opponents = ["brown", "yellow", "green"];
  for (const color of opponents) {
    const threats = patterns.detectCompleteGhostThreats(
      color,
      gameStateManager
    );
    console.log(`\n${color.toUpperCase()} COMPLETE THREATS:`);
    threats.forEach((threat, i) => {
      console.log(
        `  ${i + 1}. ${threat.owlName} → ${threat.destination} via ${
          threat.crosspiece
        }`
      );
      console.log(`     Blocking options: ${threat.blockingSquares.length}`);
      threat.blockingSquares.forEach((block) => {
        console.log(`       ${block.square} (${block.type}, ${block.safety})`);
      });
    });
  }
}
