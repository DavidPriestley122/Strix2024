// strixPatterns.js - Tactical Pattern Recognition for Strix AI
// This module focuses on detecting the key tactical patterns that cause AI blunders

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

  // MAIN EVALUATION FUNCTION
  // Returns a penalty score (negative = bad, 0 = neutral, positive = good)
  evaluateMovePatterns(move, playerColor, gameState = null) {
    const state = gameState || this.gameState;
    let totalScore = 0;
    
    // Pattern 1a: REWARD moves that create crosspieces for OWN ghosting (check first!)
    const crosspieceBonus = this.evaluateOwnCrosspieceOpportunity(move, playerColor, state);
    totalScore += crosspieceBonus;
    
    // Pattern 1b: PENALIZE moves that become crosspieces for ENEMY ghosting
    const crosspiecePenalty = this.evaluateCrosspieceRisk(move, playerColor, state);
    totalScore += crosspiecePenalty;
    
    // Pattern 2: Don't abandon edge protection too early  
    const edgePenalty = this.evaluateEdgeAbandonmentRisk(move, playerColor, state);
    totalScore += edgePenalty;
    
    // Pattern 3: Don't cluster pieces where Kites can fork them
    const clusteringPenalty = this.evaluateClusteringRisk(move, playerColor, state);
    totalScore += clusteringPenalty;
    
    // Pattern 4: Don't eliminate players when facing human opposition
    const eliminationPenalty = this.evaluateEliminationRisk(move, playerColor, state);
    totalScore += eliminationPenalty;
    
    // Pattern 5: BLOCK IMMEDIATE GHOSTING THREATS (highest priority!)
    const blockingBonus = this.evaluateGhostingBlockingOpportunity(move, playerColor, state);
    totalScore += blockingBonus;
    
    if (totalScore !== 0) {
      this.log(`${move.piece.name}→${move.targetSquare} pattern score: ${totalScore}`);
    }
    
    return totalScore;
  }

  // PATTERN 1A: OWN CROSSPIECE OPPORTUNITIES
  // "Reward moves that create crosspieces for MY Owl to ghost into the nest"
  evaluateOwnCrosspieceOpportunity(move, playerColor, gameState) {
    const destinationSquare = move.targetSquare;
    let bonus = 0;
    
    const myOwl = `${playerColor}Owl`;
    const myOwlPosition = gameState.piecePositions[myOwl];
    
    if (!myOwlPosition || myOwlPosition === "captured") return 0;
    
    // Check if moving to destination would enable MY Owl to ghost to any nest
    const nestSquares = ['b7-7', 'y7-7', 'g7-7'];
    
    for (const nestSquare of nestSquares) {
      if (this.wouldEnableGhostingToNest(myOwlPosition, destinationSquare, nestSquare)) {
        bonus += 6000; // Large bonus for enabling own ghosting opportunities
        this.log(`✅ OWN CROSSPIECE: ${move.piece.name}→${destinationSquare} enables ${playerColor} Owl to ghost ${myOwlPosition}→${nestSquare}`);
      }
    }
    
    return bonus;
  }

  // PATTERN 1B: CROSSPIECE RISKS  
  // "Don't become a crosspiece that allows enemy Owls to ghost into the nest"
  evaluateCrosspieceRisk(move, playerColor, gameState) {
    const destinationSquare = move.targetSquare;
    let penalty = 0;
    
    // Check each opponent's Owl
    const opponents = ['brown', 'yellow', 'green'].filter(p => p !== playerColor);
    
    for (const opponentColor of opponents) {
      const opponentOwl = `${opponentColor}Owl`;
      const owlPosition = gameState.piecePositions[opponentOwl];
      
      if (!owlPosition || owlPosition === "captured") continue;
      
      // Check if moving to destination would enable opponent Owl to ghost to any nest
      const nestSquares = ['b7-7', 'y7-7', 'g7-7'];
      
      for (const nestSquare of nestSquares) {
        if (this.wouldEnableGhostingToNest(owlPosition, destinationSquare, nestSquare)) {
          // Different penalties based on how immediate the threat is
          const isStartingPosition = ['b7-1', 'y7-1', 'g7-1'].includes(owlPosition);
          const threatLevel = isStartingPosition ? 9000 : 7000; // More severe if Owl is in starting position
          
          penalty -= threatLevel;
          this.log(`⚠️ CROSSPIECE RISK: ${move.piece.name}→${destinationSquare} enables ${opponentColor} Owl to ghost ${owlPosition}→${nestSquare} (penalty: -${threatLevel})`);
        }
      }
    }
    
    return penalty;
  }

  // Check if placing a piece at crosspiecePos enables ghosting from owlPos to nestPos
  wouldEnableGhostingToNest(owlPos, crosspiecePos, nestPos) {
    // SPECIFIC KNOWN PATTERNS (expand based on actual game analysis)
    
    // Pattern: Brown Owl at starting edge + piece on Y face = ghost to G nest
    if (owlPos === 'b7-1' && nestPos === 'g7-7' && crosspiecePos[0] === 'y') {
      return true;
    }
    
    // Pattern: Yellow Owl at starting edge + piece on G face = ghost to B nest  
    if (owlPos === 'y7-1' && nestPos === 'b7-7' && crosspiecePos[0] === 'g') {
      return true;
    }
    
    // Pattern: Green Owl at starting edge + piece on B face = ghost to Y nest
    if (owlPos === 'g7-1' && nestPos === 'y7-7' && crosspiecePos[0] === 'b') {
      return true;
    }
    
    // GENERAL PATTERN: Cross-adjacency enabling ghosting
    // If owl and nest are on different faces, and crosspiece creates the bridge
    const owlFace = owlPos[0];
    const nestFace = nestPos[0];
    const crosspieceFace = crosspiecePos[0];
    
    if (owlFace !== nestFace && crosspieceFace !== owlFace && crosspieceFace !== nestFace) {
      // Check if crosspiece position enables cross-adjacency
      return this.enablesCrossAdjacency(owlPos, crosspiecePos, nestPos);
    }
    
    return false;
  }

  // PATTERN 2: EDGE PROTECTION  
  // "Don't abandon starting edge squares without compelling reason"
  evaluateEdgeAbandonmentRisk(move, playerColor, gameState) {
    const piece = move.piece;
    const fromSquare = piece.position;
    const toSquare = move.targetSquare;
    
    // Only applies to Owls moving from their starting squares
    if (!piece.name.includes('Owl')) return 0;
    
    const startingSquares = {
      'brown': 'b7-1',
      'yellow': 'y7-1', 
      'green': 'g7-1'
    };
    
    if (fromSquare !== startingSquares[playerColor]) return 0;
    
    // Abandoning edge protection - check if it opens attack vectors
    const newAttackVectors = this.getNewAttackVectors(fromSquare, toSquare, gameState);
    
    if (newAttackVectors.length > 0) {
      const penalty = -500 * newAttackVectors.length;
      this.log(`🏰 EDGE ABANDONMENT: ${piece.name} leaving ${fromSquare} opens ${newAttackVectors.length} attack vectors`);
      return penalty;
    }
    
    return 0;
  }

  // PATTERN 3: CLUSTERING VULNERABILITY
  // "Don't bunch pieces where enemy Kites can fork them"  
  evaluateClusteringRisk(move, playerColor, gameState) {
    const destinationSquare = move.targetSquare;
    const destinationFace = destinationSquare[0];
    
    // Find other friendly pieces on the same face
    const friendlyPiecesOnSameFace = [];
    
    for (const [pieceName, position] of Object.entries(gameState.piecePositions)) {
      if (position === "captured") continue;
      if (!pieceName.startsWith(playerColor)) continue;
      if (pieceName === move.piece.name) continue;
      if (position[0] === destinationFace) {
        friendlyPiecesOnSameFace.push({name: pieceName, position: position});
      }
    }
    
    if (friendlyPiecesOnSameFace.length === 0) return 0;
    
    // Check if enemy Kites could reach cross-adjacent positions to fork us
    const opponents = ['brown', 'yellow', 'green'].filter(p => p !== playerColor);
    
    for (const opponentColor of opponents) {
      const opponentKite = `${opponentColor}Kite`;
      const kitePosition = gameState.piecePositions[opponentKite];
      
      if (!kitePosition || kitePosition === "captured") continue;
      
      // Check if Kite could reach positions that threaten multiple pieces
      const threatenedPieces = this.countPiecesKiteCouldFork(
        kitePosition, 
        [move.targetSquare, ...friendlyPiecesOnSameFace.map(p => p.position)], 
        gameState
      );
      
      if (threatenedPieces >= 2) {
        this.log(`🍴 FORK RISK: ${move.piece.name}→${destinationSquare} allows ${opponentColor} Kite to fork ${threatenedPieces} pieces`);
        return -400 * threatenedPieces;
      }
    }
    
    return 0;
  }

  // PATTERN 4: ELIMINATION TIMING
  // "Don't eliminate other players when facing stronger human opposition"
  evaluateEliminationRisk(move, playerColor, gameState) {
    // Check if this move would eliminate another player (capture their last Owl)
    if (!this.wouldEliminatePlayer(move, gameState)) return 0;
    
    // Count remaining human players vs AI players
    const playerTypes = this.getPlayerTypes(); // You'll need to expose this from your game
    const remainingPlayers = ['brown', 'yellow', 'green'].filter(color => {
      const owl = `${color}Owl`;
      return gameState.piecePositions[owl] !== "captured";
    });
    
    const humanPlayers = remainingPlayers.filter(p => playerTypes[p] === 'human');
    const aiPlayers = remainingPlayers.filter(p => playerTypes[p] === 'computer');
    
    // Bad to eliminate another AI when humans are still active
    if (humanPlayers.length > 0 && aiPlayers.length > 1) {
      this.log(`🚫 ELIMINATION RISK: Don't eliminate AI player while ${humanPlayers.length} humans remain`);
      return -3000; // Heavy penalty for bad elimination timing
    }
    
    return 0;
  }

  // UTILITY FUNCTIONS

  enablesCrossAdjacency(owlPos, crosspiecePos, nestPos) {
    // Simplified cross-adjacency check
    // In real implementation, this would check exact Strix ghosting geometry
    const owlCoords = this.parsePosition(owlPos);
    const crossCoords = this.parsePosition(crosspiecePos);
    const nestCoords = this.parsePosition(nestPos);
    
    // Cross-adjacency requires specific geometric relationships
    // This is a simplified heuristic - you'd need exact Strix rules
    
    // Check if crosspiece is positioned to bridge owl and nest
    const owlToCrossDistance = this.calculateDistance(owlPos, crosspiecePos);
    const crossToNestDistance = this.calculateDistance(crosspiecePos, nestPos);
    
    return owlToCrossDistance <= 2 && crossToNestDistance <= 2;
  }

  getNewAttackVectors(fromSquare, toSquare, gameState) {
    // Simplified - detect when moving opens new attack angles
    const fromFace = fromSquare[0];
    const toFace = toSquare[0];
    
    const vectors = [];
    
    // Moving off starting edge opens attack vectors
    if (this.isStartingEdge(fromSquare) && !this.isStartingEdge(toSquare)) {
      vectors.push('edge_abandonment');
    }
    
    // Moving to different face opens cross-face attacks  
    if (fromFace !== toFace) {
      vectors.push('cross_face_exposure');
    }
    
    return vectors;
  }

  countPiecesKiteCouldFork(kitePos, targetPieces, gameState) {
    // Simplified Kite fork detection
    // Real implementation would check exact Kite movement rules
    
    let forkablePieces = 0;
    
    for (const piecePos of targetPieces) {
      if (this.kiteCanReachToFork(kitePos, piecePos)) {
        forkablePieces++;
      }
    }
    
    return forkablePieces;
  }

  wouldEliminatePlayer(move, gameState) {
    // Check if this move captures the last Owl of any opponent
    if (!move.piece.name.includes('Owl')) return false;
    
    const targetPiece = this.findPieceAtSquare(move.targetSquare, gameState);
    if (!targetPiece || !targetPiece.includes('Owl')) return false;
    
    const targetColor = targetPiece.split(/(?=[A-Z])/)[0];
    
    // Check if this is their last Owl
    const remainingOwls = Object.entries(gameState.piecePositions)
      .filter(([name, pos]) => name.startsWith(targetColor) && name.includes('Owl') && pos !== "captured")
      .length;
    
    return remainingOwls === 1; // This would be the last one
  }

  // Helper functions (simplified versions)
  
  isStartingEdge(square) {
    return ['b7-1', 'y7-1', 'g7-1'].includes(square);
  }

  kiteCanReachToFork(kitePos, targetPos) {
    // Simplified - check if Kite could potentially reach cross-adjacent to target
    const kiteFace = kitePos[0];
    const targetFace = targetPos[0];
    return kiteFace !== targetFace; // Cross-face moves enable swooping
  }

  calculateDistance(pos1, pos2) {
    const coords1 = this.parsePosition(pos1);
    const coords2 = this.parsePosition(pos2);
    return Math.abs(coords1.row - coords2.row) + Math.abs(coords1.col - coords2.col);
  }

  parsePosition(position) {
    const coords = position.substring(1).split("-");
    return {
      face: position[0],
      row: parseInt(coords[0]),
      col: parseInt(coords[1])
    };
  }

  findPieceAtSquare(square, gameState) {
    for (const [pieceName, position] of Object.entries(gameState.piecePositions)) {
      if (position === square && position !== "captured") {
        return pieceName;
      }
    }
    return null;
  }

  getPlayerTypes() {
    // Access player types from the game state manager
    if (this.gameState && this.gameState.playerTypes) {
      return this.gameState.playerTypes;
    }
    
    // Fallback default that assumes we're dealing with mixed players
    return {
      brown: 'human',
      yellow: 'computer', 
      green: 'computer'
    };
  }

  // PATTERN 5: BLOCK IMMEDIATE GHOSTING THREATS
  // "Give massive bonus to moves that block opponent's ready-to-execute ghosting wins"
  evaluateGhostingBlockingOpportunity(move, playerColor, gameState) {
    let bonus = 0;
    
    // Check each opponent for immediate ghosting threats
    const opponents = ['brown', 'yellow', 'green'].filter(p => p !== playerColor);
    
    for (const opponentColor of opponents) {
      const opponentOwl = `${opponentColor}Owl`;
      const owlPosition = gameState.piecePositions[opponentOwl];
      
      if (!owlPosition || owlPosition === "captured") continue;
      
      // Check each nest square to see if opponent can ghost there RIGHT NOW
      const nestSquares = ['b7-7', 'y7-7', 'g7-7'];
      
      for (const nestSquare of nestSquares) {
        if (this.canGhostRightNow(owlPosition, nestSquare, gameState)) {
          // This opponent has an immediate ghosting threat!
          this.log(`⚠️ IMMEDIATE GHOSTING THREAT: ${opponentColor} Owl at ${owlPosition} can ghost to ${nestSquare}`);
          
          // Check if MY move blocks this threat
          const blockingBonus = this.evaluateBlockingMove(move, owlPosition, nestSquare, gameState);
          if (blockingBonus > 0) {
            bonus += blockingBonus;
            this.log(`🛡️ BLOCKING MOVE: ${move.piece.name}→${move.targetSquare} blocks ${opponentColor} ghosting to ${nestSquare} (+${blockingBonus})`);
          }
        }
      }
    }
    
    return bonus;
  }

  // Check if an owl can ghost to nest square RIGHT NOW (with current pieces)
  canGhostRightNow(owlPos, nestSquare, gameState) {
    const owlFace = owlPos[0];
    const nestFace = nestSquare[0];
    
    // Same face - direct move (not ghosting)
    if (owlFace === nestFace) {
      return false; // We're only looking for ghosting threats here
    }
    
    // Cross-face - check if crosspiece exists NOW
    for (const [pieceName, piecePos] of Object.entries(gameState.piecePositions)) {
      if (piecePos === "captured") continue;
      if (pieceName.includes('Owl') && pieceName.startsWith(owlPos[0])) continue; // Skip the owl itself
      
      if (this.enablesCrossAdjacency(owlPos, piecePos, nestSquare)) {
        this.log(`  Found enabling crosspiece: ${pieceName} at ${piecePos}`);
        return true;
      }
    }
    
    return false;
  }

  // Evaluate how well a move blocks a specific ghosting threat
  evaluateBlockingMove(move, threatOwlPos, threatNestSquare, gameState) {
    let blockingValue = 0;
    
    // Strategy 1: DIRECTLY BLOCK THE NEST SQUARE (highest priority)
    if (move.targetSquare === threatNestSquare) {
      blockingValue += 15000; // Massive bonus for direct blocking
      this.log(`    Direct nest blocking: ${move.targetSquare}`);
    }
    
    // Strategy 2: CAPTURE THE CROSSPIECE
    const enablingCrosspieces = this.findEnablingCrosspieces(threatOwlPos, threatNestSquare, gameState);
    for (const crosspiece of enablingCrosspieces) {
      if (this.moveCaptures(move, crosspiece.position, gameState)) {
        blockingValue += 12000; // Very high bonus for capturing crosspiece
        this.log(`    Crosspiece capture: ${crosspiece.name} at ${crosspiece.position}`);
      }
    }
    
    // Strategy 3: DISRUPT THE GHOSTING PATH
    // (More complex - for now focus on direct blocking and crosspiece capture)
    
    return blockingValue;
  }

  // Find all pieces that enable ghosting from owl to nest
  findEnablingCrosspieces(owlPos, nestSquare, gameState) {
    const crosspieces = [];
    
    for (const [pieceName, piecePos] of Object.entries(gameState.piecePositions)) {
      if (piecePos === "captured") continue;
      if (pieceName.includes('Owl') && pieceName.startsWith(owlPos[0])) continue;
      
      if (this.enablesCrossAdjacency(owlPos, piecePos, nestSquare)) {
        crosspieces.push({name: pieceName, position: piecePos});
      }
    }
    
    return crosspieces;
  }

  // Check if a move captures a piece at target position
  moveCaptures(move, targetPosition, gameState) {
    // Direct capture (Owl moving to occupied square)
    if (move.targetSquare === targetPosition && move.piece.name.includes('Owl')) {
      const targetPiece = this.findPieceAtSquare(targetPosition, gameState);
      if (targetPiece && !this.isSameColor(move.piece.name, targetPiece)) {
        return true;
      }
    }
    
    // Kite swooping capture (cross-face move to adjacent square)
    if (move.piece.name.includes('Kite')) {
      const moveFace = move.piece.position[0];
      const targetFace = move.targetSquare[0];
      
      if (moveFace !== targetFace) { // Cross-face move
        const adjacentSquares = this.getAdjacentSquares(targetPosition);
        if (adjacentSquares.includes(move.targetSquare)) {
          const targetPiece = this.findPieceAtSquare(targetPosition, gameState);
          if (targetPiece && !this.isSameColor(move.piece.name, targetPiece)) {
            return true;
          }
        }
      }
    }
    
    // TODO: Raven mobbing capture
    
    return false;
  }

  // Helper function to check if pieces are same color
  isSameColor(piece1, piece2) {
    const color1 = piece1.split(/(?=[A-Z])/)[0];
    const color2 = piece2.split(/(?=[A-Z])/)[0];
    return color1 === color2;
  }

  // Helper function to get adjacent squares
  getAdjacentSquares(square) {
    const face = square[0];
    const coords = square.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    
    const adjacent = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 1 && newRow <= 7 && newCol >= 1 && newCol <= 7) {
        adjacent.push(`${face}${newRow}-${newCol}`);
      }
    }
    
    return adjacent;
  }
}