import { getAllOwlMoves } from "../game/rules/owlRules.js";
import { getAllKiteMoves } from "../game/rules/kiteRules.js";
import { getAllRavenMoves } from "../game/rules/ravenRules.js";

export class AIPlayer {
  constructor(playerColor, gameStateManager, moveExecutor) {
    this.playerColor = playerColor;
    this.gameState = gameStateManager;
    this.moveExecutor = moveExecutor;
    this.strategy = 'greedy'; // Use greedy strategy to see strategic thinking
    
    // Logging controls
    this.strategicLogging = true;  // Strategic thinking logs
    this.mechanisticLogging = true; // Detailed move validation logs - temporarily enabled
  }

  // Strategic logging helper
  logStrategy(message, data = null) {
    if (this.strategicLogging) {
      const prefix = `🧠 AI-${this.playerColor.toUpperCase()}`;
      if (data) {
        console.log(`${prefix}: ${message}`, data);
      } else {
        console.log(`${prefix}: ${message}`);
      }
    }
  }

  // Mechanistic logging helper (quieter by default)
  logMechanic(message, data = null) {
    if (this.mechanisticLogging) {
      const prefix = `⚙️ AI-${this.playerColor}`;
      if (data) {
        console.log(`${prefix}: ${message}`, data);
      } else {
        console.log(`${prefix}: ${message}`);
      }
    }
  }

  // Main decision-making function
  selectMove() {
    this.logStrategy(`=== TURN START - Analyzing position ===`);
    
    // Get all pieces belonging to this player
    const playerPieces = this.getPlayerPieces();
    this.logStrategy(`Available pieces: ${playerPieces.map(p => p.name).join(", ")}`);
    
    if (playerPieces.length === 0) {
      this.logStrategy(`❌ No pieces available!`);
      return null;
    }

    // Evaluate all possible moves
    const allMoveOptions = this.evaluateAllMoves(playerPieces);
    
    if (allMoveOptions.length === 0) {
      this.logStrategy(`❌ No valid moves found!`);
      return null;
    }
    this.logStrategy(`Found ${allMoveOptions.length} possible moves`);

    // Show top candidate moves
    const sortedMoves = allMoveOptions.sort((a, b) => b.evaluation - a.evaluation);
    const topMoves = sortedMoves.slice(0, 3);
    
    this.logStrategy(`Top 3 candidates:`, topMoves.map(m => ({
      piece: m.piece.name,
      to: m.targetSquare,
      score: m.evaluation.toFixed(1)
    })));

    // Select best move based on current strategy
    const selectedMove = this.selectBestMove(allMoveOptions);
    
    this.logStrategy(`🎯 DECISION: ${selectedMove.piece.name} to ${selectedMove.targetSquare} (score: ${selectedMove.evaluation.toFixed(1)})`);
    return selectedMove;
  }

  // Get all pieces belonging to this player
  getPlayerPieces() {
    const pieces = [];
    
    for (const [pieceName, position] of Object.entries(this.gameState.piecePositions)) {
      if (pieceName.startsWith(this.playerColor) && position !== "captured") {
        pieces.push({
          name: pieceName,
          position: position,
          type: this.getPieceType(pieceName)
        });
      }
    }
    
    return pieces;
  }

  // Evaluate all possible moves for all pieces
  evaluateAllMoves(playerPieces) {
    const allMoveOptions = [];

    for (const piece of playerPieces) {
      const possibleMoves = this.getPossibleMoves(piece);
      
      for (const targetSquare of possibleMoves) {
        if (this.isValidMove(targetSquare, piece.name)) {
          const moveOption = {
            piece: piece,
            targetSquare: targetSquare,
            evaluation: this.evaluateMove(piece, targetSquare)
          };
          allMoveOptions.push(moveOption);
        } else {
          // Log moves that fail validation
          if (piece.type === 'Owl' && this.isNestSquare(targetSquare)) {
            this.logStrategy(`❌ WINNING MOVE BLOCKED: ${piece.name} → ${targetSquare} failed validation!`);
          }
        }
      }
    }

    return allMoveOptions;
  }

  // Get possible moves for a specific piece
  getPossibleMoves(piece) {
    const currentPos = piece.position;
    let possibleMoves = [];
    
    switch (piece.type) {
      case 'Owl':
        possibleMoves = getAllOwlMoves(currentPos, this.gameState.piecePositions, piece.name);
        break;
      case 'Kite':
        possibleMoves = getAllKiteMoves(currentPos, this.gameState.piecePositions, piece.name);
        break;
      case 'Raven':
        possibleMoves = getAllRavenMoves(currentPos, this.gameState.piecePositions, piece.name);
        break;
      default:
        return [];
    }
    
    // Debug logging for Owl moves
    if (piece.type === 'Owl') {
      this.logStrategy(`${piece.name} at ${currentPos} found ${possibleMoves.length} possible moves: ${possibleMoves.join(', ')}`);
      // Check each move for winning potential
      for (const move of possibleMoves) {
        if (this.isNestSquare(move)) {
          this.logStrategy(`🔍 NEST SQUARE DETECTED: ${piece.name} → ${move} - checking win condition...`);
          const winCheck = this.gameState.checkWinningConditions(piece.name, move);
          this.logStrategy(`🔍 Win check result for ${piece.name} → ${move}: ${winCheck}`);
        }
      }
    }
    
    return possibleMoves;
  }

  // Evaluate a specific move and assign a score
  evaluateMove(piece, targetSquare) {
    let score = 0;

    // Base score for any valid move
    score += 1;
    
    this.logMechanic(`Evaluating ${piece.name} → ${targetSquare}`);

    // 1. WINNING MOVES - Highest priority (Owl to Nest)
    const winningValue = this.evaluateWinning(piece, targetSquare);
    score += winningValue;

    // 2. CAPTURE OPPORTUNITIES - High priority
    const captureValue = this.evaluateCapture(piece, targetSquare);
    score += captureValue;

    // 3. THREAT AVOIDANCE - High priority defensive
    const defensiveValue = this.evaluateDefense(piece, targetSquare);
    score += defensiveValue;

    // 4. POSITIONAL ADVANCEMENT - Lower priority
    const positionalValue = this.evaluatePosition(piece, targetSquare);
    score += positionalValue;

    this.logMechanic(`${piece.name} → ${targetSquare} final score: ${score.toFixed(1)}`);
    return score;
  }

  // Evaluate capture opportunities (extensible for tactical combinations)
  evaluateCapture(piece, targetSquare, depth = 0) {
    let score = 0;

    // IMMEDIATE CAPTURES (depth 0)
    const immediateCaptures = this.findImmediateCaptures(piece, targetSquare);
    for (const capture of immediateCaptures) {
      const value = this.getPieceCaptureValue(capture.targetPiece);
      this.logStrategy(`🎯 CAPTURE: ${piece.name} → ${targetSquare} can capture ${capture.targetPiece} (+${value})`);
      score += value;
    }

    // FUTURE EXTENSION POINT: Tactical combinations
    if (depth > 0 && this.strategy === 'strategic') {
      // TODO: Analyze capture sequences, sacrifices, and tactical patterns
      // score += this.evaluateTacticalCombinations(piece, targetSquare, depth - 1);
    }

    return score;
  }

  // Find all immediate capture opportunities for this move
  findImmediateCaptures(piece, targetSquare) {
    const captures = [];

    if (piece.type === 'Owl') {
      // Direct owl capture at destination
      const targetPiece = this.findPieceAtSquare(targetSquare);
      if (targetPiece && !this.isSameTeam(piece.name, targetPiece)) {
        captures.push({ targetPiece, captureType: 'direct' });
      }
    } else if (piece.type === 'Kite') {
      // Kite swooping capture (cross-face moves only)
      const currentFace = piece.position[0];
      const targetFace = targetSquare[0];
      
      if (currentFace !== targetFace) {
        const adjacentSquares = this.getAdjacentSquares(targetSquare);
        for (const adjSquare of adjacentSquares) {
          const targetPiece = this.findPieceAtSquare(adjSquare);
          if (targetPiece && !this.isSameTeam(piece.name, targetPiece)) {
            captures.push({ targetPiece, captureType: 'swoop' });
          }
        }
      }
    } else if (piece.type === 'Raven') {
      // Raven mobbing (requires cross-face move and passive raven)
      const mobbingCaptures = this.findRavenMobbingCaptures(piece, targetSquare);
      captures.push(...mobbingCaptures);
    }

    return captures;
  }

  // Evaluate positional advantages
  evaluatePosition(piece, targetSquare) {
    let score = 0;

    // Center control bonus
    if (this.isNearCenter(targetSquare)) {
      score += 2;
    }

    // Advancement bonus (moving toward opponent territory)
    if (this.isAdvancement(piece, targetSquare)) {
      score += 1;
    }

    // Piece-specific positional bonuses
    if (piece.type === 'Owl') {
      // Owls benefit from being near the center for ghosting opportunities
      if (this.hasGhostingOpportunities(targetSquare)) {
        score += 3;
      }
    }

    return score;
  }

  // Evaluate defensive considerations (extensible for threat analysis)
  evaluateDefense(piece, targetSquare, depth = 0) {
    let score = 0;

    // IMMEDIATE THREATS (depth 0) - Can this piece be captured next turn?
    const immediateThreats = this.findImmediateThreats(piece.name, targetSquare);
    for (const threat of immediateThreats) {
      const penalty = this.getPieceCaptureValue(piece.name);
      this.logStrategy(`⚠️ THREAT: ${piece.name} → ${targetSquare} vulnerable to ${threat.attacker} (-${penalty})`);
      score -= penalty;
    }

    // PROTECTING IMPORTANT PIECES
    const protectionValue = this.evaluateProtection(piece, targetSquare);
    score += protectionValue;

    // FUTURE EXTENSION POINT: Multi-move threat analysis
    if (depth > 0 && this.strategy === 'strategic') {
      // TODO: Analyze threat sequences, sacrificial defenses, positional threats
      // score += this.evaluateStrategicThreats(piece, targetSquare, depth - 1);
    }

    return score;
  }

  // Find all immediate threats to this piece at the target square
  findImmediateThreats(pieceName, targetSquare) {
    const threats = [];
    
    // Check what opponent pieces could capture this piece next turn
    for (const [opponentPiece, position] of Object.entries(this.gameState.piecePositions)) {
      if (position === "captured" || this.isSameTeam(pieceName, opponentPiece)) {
        continue;
      }

      // Check if this opponent piece can reach our target square
      if (this.canPieceReachSquare(opponentPiece, position, targetSquare)) {
        threats.push({ 
          attacker: opponentPiece, 
          attackerPosition: position,
          threatType: this.getThreatType(opponentPiece, targetSquare)
        });
      }
    }

    return threats;
  }

  // Evaluate winning potential (extensible for multi-move lookahead)
  evaluateWinning(piece, targetSquare, depth = 0) {
    let score = 0;

    // IMMEDIATE WIN (depth 0) - Use existing game win-checking logic
    if (piece.type === 'Owl') {
      const winCondition = this.gameState.checkWinningConditions(piece.name, targetSquare);
      if (winCondition) {
        this.logStrategy(`🏆 WINNING MOVE FOUND: ${piece.name} → ${targetSquare}! (${winCondition}) (+1000)`);
        score += 1000;
      } else {
        // Check if this is a center square (nest) for logging
        if (this.isNestSquare(targetSquare)) {
          this.logStrategy(`🤔 ${piece.name} → ${targetSquare} is a nest square, but win condition returned: ${winCondition}`);
        }
        
        // ADVANCEMENT TOWARD WIN - Owls getting closer to center
        const advancement = this.getOwlAdvancement(piece.position, targetSquare);
        if (advancement > 0) {
          this.logStrategy(`📍 ADVANCEMENT: ${piece.name} → ${targetSquare} moves ${advancement} steps closer to nest (+${advancement * 5})`);
        }
        score += advancement * 5;
      }
    }

    // FUTURE EXTENSION POINT: Multi-move lookahead
    if (depth > 0 && this.strategy === 'strategic') {
      // TODO: Analyze opponent's likely responses and counter-strategies
      // score += this.evaluateFutureWinningChances(piece, targetSquare, depth - 1);
    }

    return score;
  }

  // Select the best move from evaluated options
  selectBestMove(moveOptions) {
    switch (this.strategy) {
      case 'random':
        return this.selectRandomMove(moveOptions);
      case 'greedy':
        return this.selectGreedyMove(moveOptions);
      case 'strategic':
        return this.selectStrategicMove(moveOptions);
      default:
        return this.selectRandomMove(moveOptions);
    }
  }

  // Random move selection
  selectRandomMove(moveOptions) {
    return moveOptions[Math.floor(Math.random() * moveOptions.length)];
  }

  // Greedy move selection (highest immediate score)
  selectGreedyMove(moveOptions) {
    return moveOptions.reduce((best, current) => 
      current.evaluation > best.evaluation ? current : best
    );
  }

  // Strategic move selection (could include lookahead, patterns, etc.)
  selectStrategicMove(moveOptions) {
    // For now, same as greedy but could be enhanced with:
    // - Multi-move lookahead
    // - Pattern recognition
    // - Opening/endgame strategies
    return this.selectGreedyMove(moveOptions);
  }

  // Helper functions
  getPieceType(pieceName) {
    if (pieceName.includes('Owl')) return 'Owl';
    if (pieceName.includes('Kite')) return 'Kite';
    if (pieceName.includes('Raven')) return 'Raven';
    return 'Unknown';
  }

  findPieceAtSquare(square) {
    for (const [pieceName, position] of Object.entries(this.gameState.piecePositions)) {
      if (position === square && position !== "captured") {
        return pieceName;
      }
    }
    return null;
  }

  isSameTeam(piece1, piece2) {
    const color1 = piece1.split(/(?=[A-Z])/)[0];
    const color2 = piece2.split(/(?=[A-Z])/)[0];
    return color1 === color2;
  }

  getPieceCaptureValue(pieceName) {
    if (pieceName.includes('Owl')) return 10;
    if (pieceName.includes('Kite')) return 5;
    if (pieceName.includes('Raven')) return 5;
    return 1;
  }

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


  isNearCenter(square) {
    const coords = square.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    return row >= 6 && col >= 6;
  }

  isNestSquare(square) {
    return ['b7-7', 'y7-7', 'g7-7'].includes(square);
  }

  isAdvancement(piece, targetSquare) {
    // Simple advancement check - could be more sophisticated
    const currentCoords = piece.position.substring(1).split("-");
    const targetCoords = targetSquare.substring(1).split("-");
    const currentRow = parseInt(currentCoords[0]);
    const targetRow = parseInt(targetCoords[0]);
    
    return targetRow > currentRow;
  }

  hasGhostingOpportunities(targetSquare) {
    // Check if position allows for ghosting moves
    // This is a simplified check - could be more detailed
    return true; // Placeholder
  }

  isUnderThreat(targetSquare, pieceName) {
    // Check if moving to this square puts piece in danger
    // This would require analyzing opponent pieces' attack ranges
    return false; // Placeholder
  }

  protectsImportantPiece(piece, targetSquare) {
    // Check if this move protects an important piece
    return false; // Placeholder
  }

  setsUpWin(piece, targetSquare) {
    // Check if this move sets up a winning combination
    return false; // Placeholder
  }

  // === EXTENSIBLE HELPER METHODS ===

  // Owl advancement toward nest
  getOwlAdvancement(currentPosition, targetSquare) {
    const currentCoords = currentPosition.substring(1).split("-");
    const targetCoords = targetSquare.substring(1).split("-");
    const currentRow = parseInt(currentCoords[0]);
    const currentCol = parseInt(currentCoords[1]);
    const targetRow = parseInt(targetCoords[0]);
    const targetCol = parseInt(targetCoords[1]);
    
    // Distance to nest (7,7) - negative means getting closer
    const currentDistance = Math.abs(7 - currentRow) + Math.abs(7 - currentCol);
    const targetDistance = Math.abs(7 - targetRow) + Math.abs(7 - targetCol);
    
    return currentDistance - targetDistance; // Positive = advancement
  }

  // Check if a piece can reach a specific square (for threat analysis)
  canPieceReachSquare(pieceName, fromPosition, targetSquare) {
    const pieceType = this.getPieceType(pieceName);
    const possibleMoves = this.getPossibleMovesForPiece(pieceType, fromPosition, pieceName);
    return possibleMoves.includes(targetSquare);
  }

  // Get possible moves for any piece (used for threat analysis)
  getPossibleMovesForPiece(pieceType, position, pieceName) {
    switch (pieceType) {
      case 'Owl':
        return getAllOwlMoves(position, this.gameState.piecePositions, pieceName);
      case 'Kite':
        return getAllKiteMoves(position, this.gameState.piecePositions, pieceName);
      case 'Raven':
        return getAllRavenMoves(position, this.gameState.piecePositions, pieceName);
      default:
        return [];
    }
  }

  // Determine threat type for logging/analysis
  getThreatType(attackerPiece) {
    if (attackerPiece.includes('Owl')) return 'direct';
    if (attackerPiece.includes('Kite')) return 'swoop';
    if (attackerPiece.includes('Raven')) return 'mobbing';
    return 'unknown';
  }

  // Find raven mobbing capture opportunities
  findRavenMobbingCaptures() {
    // Placeholder for now - this requires complex mobbing logic
    // TODO: Implement raven mobbing detection using piece and targetSquare
    return [];
  }

  // Evaluate protection value of a move
  evaluateProtection() {
    // Placeholder for protecting important pieces
    // TODO: Implement protection analysis using piece and targetSquare
    return 0;
  }

  // Move validation (delegates to the move executor)
  isValidMove(targetSquare, pieceName) {
    return this.moveExecutor.isValidMove(targetSquare, pieceName);
  }

  // Strategy management
  setStrategy(strategy) {
    this.strategy = strategy;
    console.log(`> AI Player ${this.playerColor} strategy set to: ${strategy}`);
  }

  getStrategy() {
    return this.strategy;
  }
}