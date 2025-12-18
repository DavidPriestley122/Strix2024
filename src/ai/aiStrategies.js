import { getAllOwlMoves } from "../game/rules/owlRules.js";
import { getAllKiteMoves } from "../game/rules/kiteRules.js";
import { getAllRavenMoves } from "../game/rules/ravenRules.js";
import { StrixPatterns } from "./strixPatterns.js";

export class MinimaxAI {
  constructor(playerColor, gameStateManager) {
    this.playerColor = playerColor;
    this.gameState = gameStateManager;
    this.maxDepth = 3; // Increased from 1 to see 3-move winning sequences
    this.strategicLogging = true;
    this.tacticalLogging = true;

    // Player order for three-player game
    this.playerOrder = ["brown", "yellow", "green"];
    this.players = this.playerOrder;

    // Will be set by AIPlayer
    this.moveExecutor = null;

    // Initialize tactical pattern recognition
    this.patterns = new StrixPatterns(gameStateManager);
  }

  // Check if move results in immediate win
  isImmediateWinningMove(move) {
    if (move.piece.type !== "Owl") return false;

    const nestSquares = ["b7-7", "y7-7", "g7-7"];
    return nestSquares.includes(move.targetSquare);
  }

  // Strategic logging helper
  logStrategy(message, data = null) {
    if (this.strategicLogging) {
      const prefix = `🧠 MINIMAX-${this.playerColor.toUpperCase()}`;
      if (data) {
        console.log(`${prefix}: ${message}`, data);
      } else {
        console.log(`${prefix}: ${message}`);
      }
    }
  }

  // Tactical logging helper
  logTactical(message, data = null) {
    if (this.tacticalLogging) {
      const prefix = `⚡ TACTICAL-${this.playerColor}`;
      if (data) {
        console.log(`${prefix}: ${message}`, data);
      } else {
        console.log(`${prefix}: ${message}`);
      }
    }
  }

  // Main decision function - now with pattern integration
  selectBestMove() {
    this.logStrategy(`=== AI SEARCH (${this.playerColor}) ===`);
    
    // Debug: Show current board state
    this.logBoardState();


    const moves = this.generateAllMoves(this.playerColor);
    this.logStrategy(`Generated ${moves.length} moves for evaluation`);

    if (moves.length === 0) {
      this.logStrategy(`❌ No valid moves found!`);
      return null;
    }

    // STEP 1: Check for immediate winning moves
    for (const move of moves) {
      if (this.isImmediateWinningMove(move)) {
        this.logStrategy(
          `🏆 IMMEDIATE WIN: ${move.piece.name} → ${move.targetSquare}`
        );
        return move;
      }
    }

    // STEP 2: Evaluate moves with unified offensive/defensive analysis
    const evaluatedMoves = [];
    this.logStrategy(`🔍 Evaluating ${moves.length} moves for captures and threats...`);
    
    let captureMovesFound = 0;
    for (const move of moves) {
      let totalScore = 0;
      
      // Unified offensive analysis (what can I capture?)
      const offensiveScore = this.evaluateMyCaptures(move);
      if (offensiveScore > 0) captureMovesFound++;
      
      // Unified defensive analysis (what threatens me?)
      const defensiveScore = this.evaluateThreatsToMe(move);
      
      // Pattern scoring (strategic positioning)
      const patternScore = this.patterns.evaluateMovePatterns(
        move,
        this.playerColor
      );
      
      // Base score to encourage all piece types to move
      const baseScore = this.getBasePieceScore(move.piece.type);
      
      // Positional advancement bonus
      const advancementBonus = this.evaluateAdvancement(move);
      
      // Combined scoring: base + advancement + offense - defense + patterns
      totalScore = baseScore + advancementBonus + offensiveScore - defensiveScore + patternScore;

      // Store the total evaluation
      move.evaluation = totalScore;
      evaluatedMoves.push(move);

      // Log all moves with non-zero scores OR first few moves for debugging
      if (offensiveScore > 0 || defensiveScore > 0 || patternScore !== 0 || advancementBonus > 0 || evaluatedMoves.length <= 10) {
        this.logStrategy(
          `📊 ${move.piece.name}→${move.targetSquare}: base=${baseScore}, adv=${advancementBonus}, off=${offensiveScore}, def=${defensiveScore}, pat=${patternScore}, total=${totalScore}`
        );
      }
    }
    
    this.logStrategy(`🎯 Found ${captureMovesFound} capture opportunities out of ${moves.length} moves`);
    
    // Show the top 3 moves for debugging
    const sortedMoves = [...evaluatedMoves].sort((a, b) => b.evaluation - a.evaluation);
    this.logStrategy(`🏆 Top 3 moves:`);
    for (let i = 0; i < Math.min(3, sortedMoves.length); i++) {
      const move = sortedMoves[i];
      this.logStrategy(`  ${i + 1}. ${move.piece.name}→${move.targetSquare} (score: ${move.evaluation})`);
    }

    // STEP 3: Select best move based on pattern scores
    const bestMove = evaluatedMoves.reduce((best, current) =>
      current.evaluation > best.evaluation ? current : best
    );

    this.logStrategy(
      `🎯 SELECTED: ${bestMove.piece.name} to ${bestMove.targetSquare} (score: ${bestMove.evaluation})`
    );
    return bestMove;
  }

  // Generate all valid moves for a player
  generateAllMoves(playerColor, gameState = null) {
    const state = gameState || this.gameState;
    const moves = [];

    const pieces = this.getPlayerPieces(playerColor, state);
    this.logStrategy(`🔍 Found ${pieces.length} pieces for ${playerColor}:`);
    
    for (const piece of pieces) {
      this.logStrategy(`  - ${piece.name} (${piece.type}) at ${piece.position}`);
    }

    for (const piece of pieces) {
      const possibleMoves = this.getPossibleMoves(piece, state);
      this.logStrategy(`${piece.name} has ${possibleMoves.length} possible moves: ${possibleMoves.slice(0,5).join(', ')}${possibleMoves.length > 5 ? '...' : ''}`);

      let validMovesForPiece = 0;
      let crossFaceValidMoves = 0;
      let sameFaceValidMoves = 0;
      
      for (const targetSquare of possibleMoves) {
        const isValid = this.isValidMove(piece.name, targetSquare, state);
        
        if (isValid) {
          moves.push({
            piece: piece,
            targetSquare: targetSquare,
            evaluation: 0,
          });
          validMovesForPiece++;
          
          // Track cross-face vs same-face moves
          const currentFace = piece.position[0];
          const targetFace = targetSquare[0];
          if (currentFace !== targetFace) {
            crossFaceValidMoves++;
          } else {
            sameFaceValidMoves++;
          }
        } else {
          // Log why invalid moves are being rejected (especially for Kites and cross-face moves)
          const currentFace = piece.position[0];
          const targetFace = targetSquare[0];
          const isCrossFace = currentFace !== targetFace;
          
          if (piece.type === 'Kite' || isCrossFace) {
            this.logStrategy(`❌ REJECTED: ${piece.name} → ${targetSquare} (${isCrossFace ? 'cross-face' : 'same-face'})`);
          }
        }
      }
      
      this.logStrategy(`${piece.name}: ${validMovesForPiece} valid (${crossFaceValidMoves} cross-face, ${sameFaceValidMoves} same-face)`);
    }

    this.logStrategy(`🎯 Total valid moves generated: ${moves.length}`);
    return moves;
  }

  // Get all pieces for a player
  getPlayerPieces(playerColor, gameState = null) {
    const state = gameState || this.gameState;
    const pieces = [];

    for (const [pieceName, position] of Object.entries(state.piecePositions)) {
      if (pieceName.startsWith(playerColor) && position !== "captured") {
        pieces.push({
          name: pieceName,
          position: position,
          type: this.getPieceType(pieceName),
        });
      }
    }

    return pieces;
  }

  // Get possible moves for a piece
  getPossibleMoves(piece, gameState = null) {
    const state = gameState || this.gameState;
    const currentPos = piece.position;

    switch (piece.type) {
      case "Owl":
        return getAllOwlMoves(currentPos, state.piecePositions, piece.name);
      case "Kite":
        return getAllKiteMoves(currentPos, state.piecePositions, piece.name);
      case "Raven":
        return getAllRavenMoves(currentPos, state.piecePositions, piece.name);
      default:
        return [];
    }
  }

  // Utility functions
  getPieceType(pieceName) {
    if (pieceName.includes("Owl")) return "Owl";
    if (pieceName.includes("Kite")) return "Kite";
    if (pieceName.includes("Raven")) return "Raven";
    return "Unknown";
  }

  isValidMove(pieceName, targetSquare, gameState = null) {
    // Try using moveExecutor first
    if (this.moveExecutor) {
      const result = this.moveExecutor.isValidMove(targetSquare, pieceName);
      
      // Debug rejected cross-face moves and Kite moves
      const currentPos = this.gameState.piecePositions[pieceName];
      const currentFace = currentPos ? currentPos[0] : '?';
      const targetFace = targetSquare[0];
      const isCrossFace = currentFace !== targetFace;
      const isKite = pieceName.includes('Kite');
      
      if (!result && (isKite || isCrossFace)) {
        this.logStrategy(`🔍 VALIDATION FAILED: ${pieceName} from ${currentPos} to ${targetSquare} (${isCrossFace ? 'cross-face' : 'same-face'})`);
      }
      
      return result;
    }

    // Fallback: basic validation
    const state = gameState || this.gameState;

    // Check if piece exists and isn't captured
    if (
      !state.piecePositions[pieceName] ||
      state.piecePositions[pieceName] === "captured"
    ) {
      return false;
    }

    // Check if target square is on the board
    const coords = targetSquare.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    if (row < 1 || row > 7 || col < 1 || col > 7) {
      return false;
    }

    return true;
  }

  // Evaluate capture opportunities for a move
  evaluateCapture(move) {
    let captureScore = 0;
    const piece = move.piece;
    const targetSquare = move.targetSquare;

    // Check capture type based on piece
    if (piece.type === 'Owl') {
      // Owl captures: direct capture by moving to occupied square
      const targetPiece = this.findPieceAtSquare(targetSquare);
      if (targetPiece) {
        if (!this.isSameTeam(piece.name, targetPiece)) {
          captureScore = this.getCaptureValue(targetPiece);
          this.logStrategy(`🎯 OWL CAPTURE: ${piece.name} can capture ${targetPiece} (+${captureScore})`);
        } else {
          this.logTactical(`❌ ${piece.name}→${targetSquare}: own piece ${targetPiece} in the way`);
        }
      }
    } 
    else if (piece.type === 'Kite') {
      // Kite captures: cross-face swooping (must move to different face)
      const currentFace = piece.position[0];
      const targetFace = targetSquare[0];
      
      if (currentFace !== targetFace) {
        // Check adjacent squares for capturable pieces
        const adjacentSquares = this.getAdjacentSquares(targetSquare);
        for (const adjSquare of adjacentSquares) {
          const targetPiece = this.findPieceAtSquare(adjSquare);
          if (targetPiece && !this.isSameTeam(piece.name, targetPiece)) {
            const pieceValue = this.getCaptureValue(targetPiece);
            captureScore += pieceValue;
            this.logStrategy(`🦅 KITE CAPTURE: ${piece.name} can swoop ${targetPiece} at ${adjSquare} (+${pieceValue})`);
          }
        }
      }
    }
    else if (piece.type === 'Raven') {
      // Raven captures: mobbing (cross-face move + passive raven)
      const currentFace = piece.position[0];
      const targetFace = targetSquare[0];
      
      if (currentFace !== targetFace) {
        // Find potential mobbing victims
        const mobbingCaptures = this.findRavenMobbingCaptures(piece, targetSquare);
        for (const capture of mobbingCaptures) {
          const pieceValue = this.getCaptureValue(capture.targetPiece);
          captureScore += pieceValue;
          this.logStrategy(`🐦 RAVEN MOBBING: ${piece.name} can mob ${capture.targetPiece} (+${pieceValue})`);
        }
      }
    }

    return captureScore;
  }

  // === NEW: Unified offensive capture analysis ===
  evaluateMyCaptures(move) {
    let score = 0;
    const piece = move.piece;
    const targetSquare = move.targetSquare;
    
    if (piece.type === 'Owl') {
      const directCapture = this.findOwlDirectCapture(targetSquare);
      if (directCapture) {
        score += this.getCaptureValue(directCapture);
        this.logStrategy(`🎯 OWL CAPTURE: ${piece.name} can capture ${directCapture} (+${this.getCaptureValue(directCapture)})`);
      }
    }
    else if (piece.type === 'Kite') {
      const swoopCaptures = this.findKiteSwoopCaptures(piece.position, targetSquare);
      for (const capture of swoopCaptures) {
        const value = this.getCaptureValue(capture);
        score += value;
        this.logStrategy(`🦅 KITE CAPTURE: ${piece.name} can swoop ${capture} (+${value})`);
      }
    }
    else if (piece.type === 'Raven') {
      const mobbingCaptures = this.findRavenMobbingCaptures(piece, targetSquare);
      for (const capture of mobbingCaptures) {
        const value = this.getCaptureValue(capture.targetPiece);
        score += value;
        this.logStrategy(`🐦 RAVEN MOBBING: ${piece.name} can mob ${capture.targetPiece} (+${value})`);
      }
    }
    
    return score;
  }

  // === NEW: Unified defensive threat analysis ===
  evaluateThreatsToMe(move) {
    let penalty = 0;
    const myPiece = move.piece.name;
    const myTargetSquare = move.targetSquare;
    
    // Check what opponent pieces could capture me at target square
    for (const [opponentPiece, position] of Object.entries(this.gameState.piecePositions)) {
      if (position === "captured" || this.isSameTeam(myPiece, opponentPiece)) continue;
      
      if (this.canPieceCaptureAtSquare(opponentPiece, position, myTargetSquare)) {
        const threatValue = this.getCaptureValue(myPiece) * 0.3; // 30% threat penalty
        penalty += threatValue;
        this.logStrategy(`⚠️ THREAT: ${opponentPiece} can capture ${myPiece} at ${myTargetSquare} (-${threatValue})`);
      }
    }
    
    return penalty;
  }

  // Get capture value based on piece type
  getCaptureValue(pieceName) {
    if (pieceName.includes('Owl')) return 1000;
    if (pieceName.includes('Kite')) return 500;
    if (pieceName.includes('Raven')) return 300;
    return 0;
  }

  // Find piece at a specific square
  findPieceAtSquare(square, gameState = null) {
    const state = gameState || this.gameState;
    for (const [pieceName, position] of Object.entries(state.piecePositions)) {
      if (position === square && position !== "captured") {
        return pieceName;
      }
    }
    return null;
  }

  // Check if two pieces are on the same team
  isSameTeam(piece1, piece2) {
    const color1 = piece1.split(/(?=[A-Z])/)[0];
    const color2 = piece2.split(/(?=[A-Z])/)[0];
    return color1 === color2;
  }

  // Get adjacent squares (for Kite captures)
  getAdjacentSquares(square) {
    const face = square[0];
    const coords = square.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    
    const adjacent = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // right, left, down, up
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 1 && newRow <= 7 && newCol >= 1 && newCol <= 7) {
        adjacent.push(`${face}${newRow}-${newCol}`);
      }
    }
    
    return adjacent;
  }

  // Find Raven mobbing capture opportunities
  findRavenMobbingCaptures(piece, targetSquare) {
    // Disable overly aggressive mobbing detection for now
    // The current implementation is too permissive and creates inflated scores
    return [];
    
    /* ORIGINAL CODE - DISABLED
    const captures = [];
    
    // Get current piece positions
    const piecePositions = this.gameState.piecePositions;
    if (!piecePositions) return captures;
    
    // Find all pieces that could be mobbed from the target position
    for (const [victimName, victimPos] of Object.entries(piecePositions)) {
      if (victimPos === "captured" || victimName === piece.name) continue;
      
      // Don't mob teammates
      const ravenColor = piece.name.split(/(?=[A-Z])/)[0];
      const victimColor = victimName.split(/(?=[A-Z])/)[0];
      if (ravenColor === victimColor) continue;
      
      // Find a passive Raven that could help mob this victim
      for (const [passiveRavenName, passiveRavenPos] of Object.entries(piecePositions)) {
        if (!passiveRavenName.endsWith('Raven') || 
            passiveRavenPos === "captured" || 
            passiveRavenName === piece.name) continue;
        
        // Check if this forms a valid mobbing configuration
        // This is a simplified check - you might want to use the actual isValidMobbingConfiguration
        if (this.wouldFormValidMobbing(targetSquare, passiveRavenPos, victimPos)) {
          captures.push({
            targetPiece: victimName,
            victimPosition: victimPos,
            passiveRaven: passiveRavenName
          });
          break; // Only count each victim once
        }
      }
    }
    
    return captures;
    */
  }

  // Simplified mobbing check (you might want to use the real mobbing rules)
  wouldFormValidMobbing(attackingRavenPos, passiveRavenPos, victimPos) {
    // This is a simplified heuristic - real implementation would use exact mobbing geometry
    // For now, just check if all three pieces are reasonably close
    const dist1 = this.calculateDistance(attackingRavenPos, passiveRavenPos);
    const dist2 = this.calculateDistance(attackingRavenPos, victimPos);
    const dist3 = this.calculateDistance(passiveRavenPos, victimPos);
    
    // Ravens should be within reasonable mobbing distance
    return dist1 <= 3 && dist2 <= 3 && dist3 <= 3;
  }

  // Calculate simple distance between two squares
  calculateDistance(pos1, pos2) {
    const coords1 = this.parsePosition(pos1);
    const coords2 = this.parsePosition(pos2);
    return Math.abs(coords1.row - coords2.row) + Math.abs(coords1.col - coords2.col);
  }

  // Parse position string into components
  parsePosition(position) {
    const coords = position.substring(1).split("-");
    return {
      face: position[0],
      row: parseInt(coords[0]),
      col: parseInt(coords[1])
    };
  }

  // Debug: Log current board state
  logBoardState() {
    this.logStrategy(`📋 BOARD STATE:`);
    const opponents = this.players.filter(p => p !== this.playerColor);
    
    // Show my pieces
    const myPieces = this.getPlayerPieces(this.playerColor);
    this.logStrategy(`  🔵 MY PIECES (${this.playerColor}):`);
    for (const piece of myPieces) {
      this.logStrategy(`    ${piece.name}: ${piece.position}`);
    }
    
    // Show opponent pieces
    for (const opponent of opponents) {
      const oppPieces = this.getPlayerPieces(opponent);
      this.logStrategy(`  🔴 ${opponent.toUpperCase()} PIECES:`);
      for (const piece of oppPieces) {
        this.logStrategy(`    ${piece.name}: ${piece.position}`);
      }
    }
  }

  // === CONSOLIDATED: Capture detection helpers ===
  findOwlDirectCapture(targetSquare) {
    const occupyingPiece = this.findPieceAtSquare(targetSquare);
    if (occupyingPiece && !this.isSameTeam(`${this.playerColor}Piece`, occupyingPiece)) {
      return occupyingPiece;
    }
    return null;
  }

  findKiteSwoopCaptures(kitePosition, targetSquare) {
    const captures = [];
    const currentFace = kitePosition[0];
    const targetFace = targetSquare[0];
    
    if (currentFace !== targetFace) { // Cross-face move required
      const adjacentSquares = this.getAdjacentSquares(targetSquare);
      for (const adjSquare of adjacentSquares) {
        const victim = this.findPieceAtSquare(adjSquare);
        if (victim && !this.isSameTeam(`${this.playerColor}Piece`, victim)) {
          captures.push(victim);
        }
      }
    }
    return captures;
  }

  canPieceCaptureAtSquare(attackerPiece, attackerPosition, victimSquare) {
    const pieceType = this.getPieceType(attackerPiece);
    
    if (pieceType === 'Owl') {
      return this.getPossibleMoves({name: attackerPiece, position: attackerPosition, type: 'Owl'})
               .includes(victimSquare);
    }
    else if (pieceType === 'Kite') {
      // Check if Kite can swoop to adjacent square
      const attackerFace = attackerPosition[0];
      const victimFace = victimSquare[0];
      if (attackerFace === victimFace) return false; // Same face = no swoop
      
      const kitePossibleMoves = this.getPossibleMoves({name: attackerPiece, position: attackerPosition, type: 'Kite'});
      const adjacentToVictim = this.getAdjacentSquares(victimSquare);
      return kitePossibleMoves.some(move => adjacentToVictim.includes(move));
    }
    else if (pieceType === 'Raven') {
      // Check if Raven can mob (simplified - requires another Raven)
      return false; // Complex mobbing logic - simplified for threat analysis
    }
    
    return false;
  }


  // Base score for different piece types to encourage variety
  getBasePieceScore(pieceType) {
    switch(pieceType) {
      case 'Owl': return 20;    // Reduced from 100 - still important but not overwhelming
      case 'Kite': return 50;   // Medium base - good for captures
      case 'Raven': return 10;  // Lower base - prevent Ravens-only play
      default: return 1;
    }
  }

  // Evaluate positional advancement
  evaluateAdvancement(move) {
    const piece = move.piece;
    const targetSquare = move.targetSquare;

    // Parse target coordinates
    const coords = targetSquare.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    const face = targetSquare[0];

    let bonus = 0;

    // Owls get bonus for moving toward center and nest
    if (piece.type === 'Owl') {
      // ANY of the three nest squares wins!
      const nestSquares = ['b7-7', 'y7-7', 'g7-7'];

      // MASSIVE bonus for landing on ANY WINNING SQUARE
      if (nestSquares.includes(targetSquare)) {
        bonus += 10000; // This is the win! Highest priority!
        this.logStrategy(`🏆 WINNING SQUARE DETECTED: ${targetSquare} (+10000)`);
      }
      else {
        // Calculate distance to nest and award bonus
        const nestDistance = Math.abs(row - 7) + Math.abs(col - 7);

        // Distance-based bonuses (closer = better)
        if (nestDistance === 1) bonus += 150;      // 1 square away
        else if (nestDistance === 2) bonus += 80;  // 2 squares away
        else if (nestDistance === 3) bonus += 40;  // 3 squares away
        else if (nestDistance === 4) bonus += 20;  // 4 squares away

        // Small bonus for approaching center (4,4) - helps early game
        const centerDistance = Math.abs(row - 4) + Math.abs(col - 4);
        if (centerDistance <= 2) bonus += 10;
      }
    }
    
    // Kites get bonus for edge positions (better for swooping)
    if (piece.type === 'Kite') {
      if (row === 1 || row === 7 || col === 1 || col === 7) {
        bonus += 15;
      }
    }
    
    // Ravens get small bonus for center positions (mobbing opportunities)
    if (piece.type === 'Raven') {
      const centerDistance = Math.abs(row - 4) + Math.abs(col - 4);
      if (centerDistance <= 2) bonus += 5;
    }
    
    return bonus;
  }
}
