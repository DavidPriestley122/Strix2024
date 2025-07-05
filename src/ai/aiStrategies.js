import { getAllOwlMoves } from "../game/rules/owlRules.js";
import { getAllKiteMoves } from "../game/rules/kiteRules.js";
import { getAllRavenMoves } from "../game/rules/ravenRules.js";
import { StrixPatterns } from "./strixPatterns.js";

export class MinimaxAI {
  constructor(playerColor, gameStateManager) {
    this.playerColor = playerColor;
    this.gameState = gameStateManager;
    this.maxDepth = 1; // Start with 1-ply for performance
    this.strategicLogging = true;
    this.tacticalLogging = true; // Enable for threat detection debugging
    
    // Player order for three-player game
    this.playerOrder = ['brown', 'yellow', 'green'];
    this.players = this.playerOrder; // Don't filter here - check in method
    
    // Will be set by AIPlayer
    this.moveExecutor = null;
    
    // Initialize tactical pattern recognition
    this.patterns = new StrixPatterns(gameStateManager);
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

  // Round-based lookahead decision function
  selectBestMove() {
    this.logStrategy(`=== ROUND-BASED AI SEARCH (${this.playerColor}) ===`);
    
    const moves = this.generateAllMoves(this.playerColor);
    this.logStrategy(`Generated ${moves.length} moves for evaluation`);
    
    if (moves.length === 0) {
      this.logStrategy(`❌ No valid moves found!`);
      return null;
    }

    // PRIORITY 1: Immediate winning moves (no need to look ahead)
    for (const move of moves) {
      if (this.isImmediateWinningMove(move)) {
        this.logStrategy(`🏆 IMMEDIATE WIN: ${move.piece.name} → ${move.targetSquare}`);
        return move;
      }
    }

    // PRIORITY 2: Use round-based lookahead for tactical evaluation
    let bestMove = null;
    let bestScore = -Infinity;
    
    this.logStrategy(`🔄 Evaluating moves with round-based lookahead...`);
    
    for (const move of moves.slice(0, 15)) { // Limit to first 15 moves for performance
      const score = this.evaluateRoundAhead(move);
      this.logTactical(`${move.piece.name} → ${move.targetSquare}: score ${score.toFixed(1)}`);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    this.logStrategy(`🎯 BEST MOVE: ${bestMove.piece.name} → ${bestMove.targetSquare} (score: ${bestScore.toFixed(1)})`);
    return bestMove;
  }

  // Evaluate move by simulating one full round ahead
  evaluateRoundAhead(myMove) {
    // Create a deep copy of current game state
    const originalState = this.copyGameState();
    
    try {
      // 1. Apply my move
      this.applyMoveToState(originalState, myMove);
      const stateAfterMyMove = this.copyGameState(originalState);
      
      // 2. Simulate next player's response
      const nextPlayer = this.getNextPlayer(this.playerColor);
      const nextPlayerMoves = this.generateAllMoves(nextPlayer, stateAfterMyMove);
      
      if (nextPlayerMoves.length === 0) {
        return this.evaluatePositionForPlayer(stateAfterMyMove, this.playerColor);
      }
      
      // Check for immediate wins by next player
      for (const oppMove of nextPlayerMoves) {
        if (this.isImmediateWinningMove(oppMove)) {
          this.logTactical(`${myMove.piece.name}→${myMove.targetSquare} allows ${nextPlayer} to win!`);
          return -10000; // Terrible for us
        }
      }
      
      // TACTICAL PATTERN ANALYSIS: Check for dangerous patterns AND positive opportunities
      const patternScore = this.patterns.evaluateMovePatterns(myMove, this.playerColor, stateAfterMyMove);
      if (patternScore < -1000) {
        this.logStrategy(`🚨 PATTERN RISK: ${myMove.piece.name}→${myMove.targetSquare} triggers dangerous pattern (${patternScore})`);
        return patternScore;
      }
      
      // If we have a huge positive pattern bonus (like blocking threats), use it!
      if (patternScore > 10000) {
        this.logStrategy(`🛡️ CRITICAL PATTERN: ${myMove.piece.name}→${myMove.targetSquare} scores massive bonus (${patternScore})`);
        return patternScore; // Return the big bonus immediately
      }
      
      // Also check general crosspiece threats in current position
      const allOpponents = this.players.filter(p => p !== this.playerColor);
      for (const opponent of allOpponents) {
        this.logTactical(`🔍 Checking crosspiece threats for ${opponent} after ${myMove.piece.name}→${myMove.targetSquare}`);
        const crosspieceThreats = this.detectCrosspieceThreats(stateAfterMyMove, opponent);
        this.logTactical(`Found ${crosspieceThreats.length} crosspiece threats for ${opponent}`);
        if (crosspieceThreats.length > 0) {
          this.logStrategy(`🚨 CROSSPIECE THREAT: ${myMove.piece.name}→${myMove.targetSquare} enables ${opponent} to ghost to nest!`);
          return -8000; // Very dangerous
        }
      }
      
      const nextPlayerBestMove = this.selectBestMoveFromList(nextPlayerMoves, nextPlayer, stateAfterMyMove);
      this.applyMoveToState(stateAfterMyMove, nextPlayerBestMove);
      
      // 3. Simulate third player's response
      const thirdPlayer = this.getNextPlayer(nextPlayer);
      const thirdPlayerMoves = this.generateAllMoves(thirdPlayer, stateAfterMyMove);
      
      if (thirdPlayerMoves.length === 0) {
        return this.evaluatePositionForPlayer(stateAfterMyMove, this.playerColor);
      }
      
      // Check for immediate wins by third player
      for (const oppMove of thirdPlayerMoves) {
        if (this.isImmediateWinningMove(oppMove)) {
          this.logTactical(`${myMove.piece.name}→${myMove.targetSquare} sequence allows ${thirdPlayer} to win!`);
          return -9000; // Very bad for us
        }
      }
      
      const thirdPlayerBestMove = this.selectBestMoveFromList(thirdPlayerMoves, thirdPlayer, stateAfterMyMove);
      this.applyMoveToState(stateAfterMyMove, thirdPlayerBestMove);
      
      // 4. Evaluate final position when it's my turn again  
      const baseScore = this.evaluatePositionForPlayer(stateAfterMyMove, this.playerColor);
      
      // Add the pattern score to the final evaluation (for smaller bonuses that weren't immediately returned)
      const finalScore = baseScore + patternScore;
      this.logTactical(`${myMove.piece.name}→${myMove.targetSquare} final: base=${baseScore}, pattern=${patternScore}, total=${finalScore}`);
      
      return finalScore;
      
    } catch (error) {
      this.logTactical(`Error in round simulation: ${error.message}`);
      return this.evaluateMoveSimple(myMove); // Fallback to simple evaluation
    }
  }

  // Get the next player in turn order
  getNextPlayer(currentPlayer) {
    const order = ['brown', 'yellow', 'green'];
    const currentIndex = order.indexOf(currentPlayer);
    return order[(currentIndex + 1) % 3];
  }

  // Select best move for a specific player from a list
  selectBestMoveFromList(moves, playerColor, gameState) {
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves.slice(0, 10)) { // Limit for performance
      const score = this.evaluateMoveForPlayer(move, playerColor, gameState);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  // Evaluate a move from a specific player's perspective
  evaluateMoveForPlayer(move, playerColor, gameState) {
    let score = 0;
    
    // Winning move bonus
    if (this.isImmediateWinningMove(move)) {
      score += 10000;
    }
    
    // Capture bonus
    if (this.hasImmediateCapture(move)) {
      score += 500;
    }
    
    // Advancement bonus for Owls toward nest
    if (move.piece.type === 'Owl') {
      score -= this.distanceToNest(move.targetSquare) * 10;
    }
    
    return score;
  }

  // Evaluate position from a specific player's perspective
  evaluatePositionForPlayer(gameState, playerColor) {
    let score = 0;
    
    // Check if we won
    const ourOwl = `${playerColor}Owl`;
    const ourOwlPos = gameState.piecePositions[ourOwl];
    if (ourOwlPos && ['b7-7', 'y7-7', 'g7-7'].includes(ourOwlPos)) {
      return 10000; // We won!
    }
    
    // Check if opponents won
    const opponents = this.players.filter(p => p !== playerColor);
    for (const opp of opponents) {
      const oppOwl = `${opp}Owl`;
      const oppOwlPos = gameState.piecePositions[oppOwl];
      if (oppOwlPos && ['b7-7', 'y7-7', 'g7-7'].includes(oppOwlPos)) {
        return -10000; // Opponent won
      }
    }
    
    // Material evaluation
    for (const [pieceName, position] of Object.entries(gameState.piecePositions)) {
      if (position === "captured") continue;
      
      const pieceType = this.getPieceType(pieceName);
      const pieceColor = pieceName.split(/(?=[A-Z])/)[0];
      const value = { 'Owl': 1000, 'Kite': 100, 'Raven': 100 }[pieceType];
      
      if (pieceColor === playerColor) {
        score += value;
      } else {
        score -= value * 0.5; // Opponent pieces hurt us less
      }
    }
    
    // Our owl distance to nest
    if (ourOwlPos && ourOwlPos !== "captured") {
      score -= this.distanceToNest(ourOwlPos) * 5;
    }
    
    return score;
  }

  // Apply move to a game state copy
  applyMoveToState(gameState, move) {
    // Simple move application - just update piece position
    gameState.piecePositions[move.piece.name] = move.targetSquare;
    
    // Handle basic captures (simplified)
    if (move.piece.type === 'Owl') {
      const targetPiece = this.findPieceAtSquare(move.targetSquare, gameState);
      if (targetPiece && !this.isSameTeam(move.piece.name, targetPiece)) {
        gameState.piecePositions[targetPiece] = "captured";
      }
    }
  }

  // Check if move results in immediate win (including ghosting wins)
  isImmediateWinningMove(move) {
    if (move.piece.type !== 'Owl') return false;
    
    const nestSquares = ['b7-7', 'y7-7', 'g7-7'];
    if (!nestSquares.includes(move.targetSquare)) return false;
    
    // This is a potential winning move to a nest square
    // Check if it's a valid move (considering ghosting)
    const owlPosition = move.piece.position;
    const nestSquare = move.targetSquare;
    
    // If it's a direct move on the same face, it's straightforward
    if (owlPosition[0] === nestSquare[0]) {
      return true; // Direct move to nest on same face
    }
    
    // Cross-face move - check if ghosting is enabled by crosspieces
    return this.canOwlGhostToNest(owlPosition, nestSquare);
  }
  
  // Check if an Owl can ghost from current position to nest (using existing crosspieces)
  canOwlGhostToNest(owlPos, nestSquare) {
    const owlFace = owlPos[0];
    const nestFace = nestSquare[0];
    
    if (owlFace === nestFace) {
      // Same face - check direct orthogonal movement
      return this.isOrthogonalMove(owlPos, nestSquare);
    }
    
    // Cross-face ghosting - look for existing crosspieces
    for (const [pieceName, piecePos] of Object.entries(this.gameState.piecePositions)) {
      if (piecePos === "captured") continue;
      if (pieceName.includes('Owl') && pieceName === `${owlPos.substring(0,1)}${owlPos.charAt(1)}Owl`) continue; // Skip the moving owl itself
      
      // Check if this piece enables ghosting from owlPos to nestSquare
      if (this.enablesGhosting(owlPos, piecePos, nestSquare)) {
        this.logTactical(`🔍 GHOSTING ENABLED: ${pieceName} at ${piecePos} enables ${owlPos} → ${nestSquare}`);
        return true;
      }
    }
    
    return false;
  }

  // Find moves that block opponent wins
  findBlockingMoves(ourMoves) {
    const blockingMoves = [];
    const opponents = this.players.filter(p => p !== this.playerColor);
    
    this.logStrategy(`🔍 Checking for opponent winning threats...`);
    
    for (const opponent of opponents) {
      if (!this.hasActiveOwl(opponent)) {
        this.logTactical(`Opponent ${opponent} has no active owl - skipping`);
        continue;
      }
      
      this.logTactical(`Checking ${opponent} for winning threats...`);
      
      // Special debugging for Brown Owl
      if (opponent === 'brown') {
        const brownOwl = this.findPiece('brownOwl');
        this.logStrategy(`🦉 Brown Owl current position: ${brownOwl}`);
        
        // Check if Brown Owl can reach any nest squares
        const nestSquares = ['b7-7', 'y7-7', 'g7-7'];
        for (const nest of nestSquares) {
          const canReach = this.isValidMove('brownOwl', nest);
          this.logStrategy(`Can Brown Owl reach ${nest}? ${canReach}`);
        }
      }
      
      const opponentMoves = this.generateAllMoves(opponent);
      this.logTactical(`${opponent} has ${opponentMoves.length} possible moves`);
      
      // Log first few moves for debugging
      const sampleMoves = opponentMoves.slice(0, 5);
      for (const move of sampleMoves) {
        this.logTactical(`  ${move.piece.name} → ${move.targetSquare}`);
      }
      
      for (const oppMove of opponentMoves) {
        if (this.isImmediateWinningMove(oppMove)) {
          const isGhostingWin = oppMove.piece.position[0] !== oppMove.targetSquare[0];
          this.logStrategy(`⚠️ THREAT: ${opponent} ${oppMove.piece.name} can win via ${oppMove.targetSquare}${isGhostingWin ? ' (GHOSTING)' : ' (DIRECT)'}`);
          
          // For ghosting wins, also try to find moves that disrupt the crosspiece setup
          if (isGhostingWin) {
            const disruptiveMoves = this.findCrosspieceDisruptiveMoves(ourMoves, oppMove);
            if (disruptiveMoves.length > 0) {
              this.logStrategy(`🔧 Found ${disruptiveMoves.length} crosspiece-disrupting moves:`);
              disruptiveMoves.forEach(move => {
                this.logStrategy(`  - ${move.piece.name} → ${move.targetSquare} (disrupts crosspiece)`);
              });
            }
          }
          
          // Find our moves that block this winning move
          const blocks = ourMoves.filter(ourMove => 
            this.blocksMove(ourMove, oppMove)
          );
          
          if (blocks.length > 0) {
            this.logStrategy(`🛡️ Found ${blocks.length} blocking moves for ${opponent} threat:`);
            blocks.forEach(block => {
              this.logStrategy(`  - ${block.piece.name} → ${block.targetSquare}`);
            });
            blockingMoves.push(...blocks);
          } else {
            this.logStrategy(`❌ No blocking moves found for ${opponent} threat!`);
            // Debug: Show what moves we have available
            this.logStrategy(`Available moves: ${ourMoves.slice(0, 3).map(m => `${m.piece.name}→${m.targetSquare}`).join(', ')}...`);
          }
        } else {
          // Debug: log if opponent owl moves to nest area
          if (oppMove.piece.type === 'Owl' && oppMove.targetSquare.includes('7-7')) {
            this.logTactical(`${opponent} owl move ${oppMove.targetSquare} not detected as winning move`);
          }
        }
      }
    }
    
    return blockingMoves;
  }

  // Check if our move blocks opponent's move
  blocksMove(ourMove, opponentMove) {
    // Method 1: Direct blocking - occupy the target square
    if (ourMove.targetSquare === opponentMove.targetSquare) {
      this.logTactical(`Direct block: occupying ${opponentMove.targetSquare}`);
      return true;
    }
    
    // Method 2: For Owl moves to nest squares, try to block critical pathways
    if (opponentMove.piece.type === 'Owl' && this.isImmediateWinningMove(opponentMove)) {
      const nestSquare = opponentMove.targetSquare;
      const nestFace = nestSquare[0];
      
      // Generate critical blocking squares for this nest
      const criticalBlockingSquares = [
        nestSquare, // Direct occupation (already checked above)
        // Block the entire 7th row and 7th column on the nest face
        `${nestFace}7-1`, `${nestFace}7-2`, `${nestFace}7-3`, `${nestFace}7-4`, `${nestFace}7-5`, `${nestFace}7-6`,
        `${nestFace}1-7`, `${nestFace}2-7`, `${nestFace}3-7`, `${nestFace}4-7`, `${nestFace}5-7`, `${nestFace}6-7`
      ];
      
      if (criticalBlockingSquares.includes(ourMove.targetSquare)) {
        this.logTactical(`Pathway block: ${ourMove.targetSquare} blocks ${nestSquare} access`);
        return true;
      }
      
      // Also check adjacent squares around the nest for additional blocking
      const adjacentToNest = this.getAdjacentSquares(nestSquare);
      if (adjacentToNest.includes(ourMove.targetSquare)) {
        this.logTactical(`Adjacent block: ${ourMove.targetSquare} near ${nestSquare}`);
        return true;
      }
      
      // Emergency blocking: ANY move to the same face as the nest
      const ourTargetFace = ourMove.targetSquare[0];
      if (ourTargetFace === nestFace) {
        this.logTactical(`Emergency face block: ${ourMove.targetSquare} on same face as ${nestSquare}`);
        return true;
      }
    }
    
    return false;
  }
  
  // Check if our move breaks opponent's ghosting
  breaksGhosting(ourMove, opponentMove) {
    // Simplified ghosting block detection
    // A more sophisticated version would check exact ghosting rules
    
    // If we're moving to a position near the opponent's current position,
    // we might break their ghosting crosspiece
    const oppCurrentPos = opponentMove.piece.position;
    const ourTarget = ourMove.targetSquare;
    
    // Check if we're moving adjacent to opponent's current position
    const distance = this.calculateDistance(oppCurrentPos, ourTarget);
    return distance <= 2; // Simplified distance check
  }

  // Check for immediate captures
  hasImmediateCapture(move) {
    if (move.piece.type === 'Owl') {
      const targetPiece = this.findPieceAtSquare(move.targetSquare);
      return targetPiece && !this.isSameTeam(move.piece.name, targetPiece);
    }
    
    if (move.piece.type === 'Kite') {
      const currentFace = move.piece.position[0];
      const targetFace = move.targetSquare[0];
      if (currentFace !== targetFace) {
        const adjacentSquares = this.getAdjacentSquares(move.targetSquare);
        return adjacentSquares.some(adj => {
          const piece = this.findPieceAtSquare(adj);
          return piece && !this.isSameTeam(move.piece.name, piece);
        });
      }
    }
    
    // Simplified Raven capture check
    if (move.piece.type === 'Raven') {
      // TODO: Implement proper mobbing detection
      return false;
    }
    
    return false;
  }

  // Select best move from a list using simple evaluation
  selectBestFromMoves(moves) {
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
      const score = this.evaluateMoveSimple(move);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }

  // Simple move evaluation
  evaluateMoveSimple(move) {
    let score = 0;
    
    // Winning move bonus
    if (this.isImmediateWinningMove(move)) {
      score += 10000;
    }
    
    // Capture bonus
    if (this.hasImmediateCapture(move)) {
      score += 500;
    }
    
    // Advancement bonus for Owls
    if (move.piece.type === 'Owl') {
      score -= this.distanceToNest(move.targetSquare) * 10;
    }
    
    // Center control bonus
    if (this.isNearCenter(move.targetSquare)) {
      score += 20;
    }
    
    return score;
  }

  // Generate all valid moves for a player
  generateAllMoves(playerColor, gameState = null) {
    const state = gameState || this.gameState;
    const moves = [];
    
    const pieces = this.getPlayerPieces(playerColor, state);
    
    for (const piece of pieces) {
      const possibleMoves = this.getPossibleMoves(piece, state);
      
      for (const targetSquare of possibleMoves) {
        if (this.isValidMove(piece.name, targetSquare, state)) {
          moves.push({
            piece: piece,
            targetSquare: targetSquare,
            evaluation: 0
          });
        }
      }
    }
    
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
          type: this.getPieceType(pieceName)
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
      case 'Owl':
        return getAllOwlMoves(currentPos, state.piecePositions, piece.name);
      case 'Kite':
        return getAllKiteMoves(currentPos, state.piecePositions, piece.name);
      case 'Raven':
        return getAllRavenMoves(currentPos, state.piecePositions, piece.name);
      default:
        return [];
    }
  }

  // Utility functions
  getPieceType(pieceName) {
    if (pieceName.includes('Owl')) return 'Owl';
    if (pieceName.includes('Kite')) return 'Kite';
    if (pieceName.includes('Raven')) return 'Raven';
    return 'Unknown';
  }

  hasActiveOwl(playerColor, gameState = null) {
    const state = gameState || this.gameState;
    const owlName = `${playerColor}Owl`;
    return state.piecePositions[owlName] !== "captured";
  }

  findPiece(pieceName, gameState = null) {
    const state = gameState || this.gameState;
    return state.piecePositions[pieceName];
  }

  findPieceAtSquare(square, gameState = null) {
    const state = gameState || this.gameState;
    for (const [pieceName, position] of Object.entries(state.piecePositions)) {
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

  isValidMove(pieceName, targetSquare, gameState = null) {
    // Try using moveExecutor first
    if (this.moveExecutor) {
      return this.moveExecutor.isValidMove(targetSquare, pieceName);
    }
    
    // Fallback: basic validation for threat detection
    const state = gameState || this.gameState;
    
    // Check if piece exists and isn't captured
    if (!state.piecePositions[pieceName] || state.piecePositions[pieceName] === "captured") {
      return false;
    }
    
    // Check if target square is on the board
    const coords = targetSquare.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    if (row < 1 || row > 7 || col < 1 || col > 7) {
      return false;
    }
    
    // Check if target square is occupied (simplified)
    const occupyingPiece = this.findPieceAtSquare(targetSquare, state);
    if (occupyingPiece && pieceName.includes('Owl')) {
      // Owls can capture, so this is potentially valid
      const pieceColor = pieceName.split(/(?=[A-Z])/)[0];
      const occupyingColor = occupyingPiece.split(/(?=[A-Z])/)[0];
      return pieceColor !== occupyingColor; // Can capture opponent pieces
    } else if (occupyingPiece) {
      return false; // Square occupied and piece can't capture
    }
    
    return true; // Basic validation passed
  }

  distanceToNest(position) {
    const nestSquares = ['b7-7', 'y7-7', 'g7-7'];
    let minDistance = Infinity;
    
    for (const nest of nestSquares) {
      const distance = this.calculateDistance(position, nest);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
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

  isNearCenter(square) {
    const coords = square.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    return row >= 6 && col >= 6;
  }

  getAdjacentSquares(square) {
    const face = square[0];
    const coords = square.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    
    const adjacent = [];
    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0]
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

  // Detect if game state allows opponent to ghost to nest using crosspieces
  detectCrosspieceThreats(gameState, opponentColor) {
    const threats = [];
    const opponentOwl = `${opponentColor}Owl`;
    const owlPosition = gameState.piecePositions[opponentOwl];
    
    this.logTactical(`🦉 Checking ${opponentColor} owl at ${owlPosition}`);
    
    if (!owlPosition || owlPosition === "captured") {
      this.logTactical(`❌ ${opponentColor} owl not available (${owlPosition})`);
      return threats;
    }
    
    // Check each nest square to see if opponent owl can ghost there
    const nestSquares = ['b7-7', 'y7-7', 'g7-7'];
    
    for (const nestSquare of nestSquares) {
      this.logTactical(`🔍 Checking if ${opponentColor} owl can ghost ${owlPosition} → ${nestSquare}`);
      if (this.canGhostToNest(owlPosition, nestSquare, gameState)) {
        threats.push({
          owlPosition: owlPosition,
          targetNest: nestSquare,
          player: opponentColor
        });
        this.logTactical(`⚠️ CROSSPIECE THREAT FOUND: ${opponentColor} owl at ${owlPosition} can ghost to ${nestSquare}`);
      } else {
        this.logTactical(`✅ No threat: ${opponentColor} owl cannot ghost ${owlPosition} → ${nestSquare}`);
      }
    }
    
    this.logTactical(`Total threats found for ${opponentColor}: ${threats.length}`);
    return threats;
  }
  
  // Check if an owl can ghost from current position to nest square
  canGhostToNest(owlPos, nestSquare, gameState) {
    const owlFace = owlPos[0];
    const nestFace = nestSquare[0];
    
    this.logTactical(`  Analyzing ghost route: ${owlPos}(${owlFace}) → ${nestSquare}(${nestFace})`);
    
    // If owl is already on the nest face, check direct movement
    if (owlFace === nestFace) {
      this.logTactical(`  Same face movement - checking direct path`);
      // This would be a direct move, not ghosting
      // Check if it's a valid orthogonal move
      const result = this.isOrthogonalMove(owlPos, nestSquare) && this.isPathClear(owlPos, nestSquare, gameState);
      this.logTactical(`  Direct move result: ${result}`);
      return result;
    }
    
    // Cross-face ghosting - look for potential crosspieces
    this.logTactical(`  Cross-face ghosting needed - searching for crosspieces...`);
    
    // Find all pieces that could serve as crosspieces
    let crosspieces = 0;
    for (const [pieceName, piecePos] of Object.entries(gameState.piecePositions)) {
      if (piecePos === "captured") continue;
      if (pieceName.includes('Owl') && pieceName === `${owlPos.substring(0,1)}${owlPos.charAt(1)}Owl`) continue; // Skip the moving owl itself
      
      this.logTactical(`    Checking piece ${pieceName} at ${piecePos}`);
      crosspieces++;
      
      // Check if this piece enables ghosting from owlPos to nestSquare
      if (this.enablesGhosting(owlPos, piecePos, nestSquare)) {
        this.logTactical(`    ✅ CROSSPIECE FOUND: ${pieceName} at ${piecePos} enables ghosting ${owlPos} → ${nestSquare}`);
        return true;
      }
    }
    
    this.logTactical(`  No valid crosspieces found (checked ${crosspieces} pieces)`);
    return false;
  }
  
  // Check if a crosspiece enables ghosting between two positions
  enablesGhosting(owlPos, crosspiecePos, nestSquare) {
    const owlCoords = this.parsePosition(owlPos);
    const crossCoords = this.parsePosition(crosspiecePos);
    const nestCoords = this.parsePosition(nestSquare);
    
    this.logTactical(`      Testing crosspiece: owl(${owlCoords.face}${owlCoords.row}-${owlCoords.col}) + cross(${crossCoords.face}${crossCoords.row}-${crossCoords.col}) → nest(${nestCoords.face}${nestCoords.row}-${nestCoords.col})`);
    
    // Specific pattern: Brown Owl at b7-1 + crosspiece on y-face → can ghost to g7-7
    if (owlPos === 'b7-1' && nestSquare === 'g7-7' && crossCoords.face === 'y') {
      this.logTactical(`      ✅ SPECIFIC THREAT MATCH: Brown b7-1 + y-face crosspiece at ${crosspiecePos} enables g7-7 ghost`);
      return true;
    }
    
    // More general ghosting patterns
    // Cross-face ghosting requires a crosspiece on the intermediate face
    if (owlCoords.face !== nestCoords.face) {
      this.logTactical(`      Cross-face case: owl on ${owlCoords.face}, nest on ${nestCoords.face}, crosspiece on ${crossCoords.face}`);
      
      // The crosspiece should be on a face different from both start and end
      if (crossCoords.face !== owlCoords.face && crossCoords.face !== nestCoords.face) {
        this.logTactical(`      ✅ Crosspiece on intermediate face - general ghosting enabled`);
        // Additional check: crosspiece should be positioned to enable cross-adjacency
        // This is a simplified heuristic
        return true;
      }
      
      // Also check if crosspiece is on the target face in a position that could help
      if (crossCoords.face === nestCoords.face) {
        // Check if positioned near the nest or on key squares
        const distanceToNest = this.calculateDistance(crosspiecePos, nestSquare);
        this.logTactical(`      Crosspiece on target face, distance to nest: ${distanceToNest}`);
        if (distanceToNest <= 2) {
          this.logTactical(`      ✅ Crosspiece ${crosspiecePos} near nest ${nestSquare} enables ghosting`);
          return true;
        }
      }
    }
    
    this.logTactical(`      ❌ No ghosting pattern matched`);
    return false;
  }
  
  // Check if movement between two squares is orthogonal
  isOrthogonalMove(pos1, pos2) {
    const coords1 = this.parsePosition(pos1);
    const coords2 = this.parsePosition(pos2);
    
    // Same face, different row or column (but not both)
    if (coords1.face === coords2.face) {
      return (coords1.row === coords2.row) !== (coords1.col === coords2.col);
    }
    
    return false; // Cross-face moves need special handling
  }
  
  // Check if path between two squares is clear
  isPathClear(pos1, pos2, gameState) {
    // Simplified path checking - would need more sophisticated logic for real Strix
    return true; // For now, assume paths are clear
  }

  // Create a deep copy of game state
  copyGameState(gameState = null) {
    const state = gameState || this.gameState;
    return {
      piecePositions: JSON.parse(JSON.stringify(state.piecePositions)),
      currentPlayerTurn: state.currentPlayerTurn,
      shadowedRows: JSON.parse(JSON.stringify(state.shadowedRows || {})),
      gameOver: state.gameOver || false
    };
  }

  // Check if moving a piece leaves other friendly pieces vulnerable to capture
  checkPieceVulnerability(myMove, gameStateAfterMove) {
    const originalPos = myMove.piece.position;
    const newPos = myMove.targetSquare;
    
    // Get all my pieces (excluding the one that just moved)
    const myPieces = this.getPlayerPieces(this.playerColor, gameStateAfterMove)
      .filter(p => p.name !== myMove.piece.name);
    
    this.logTactical(`🔍 Checking if ${myMove.piece.name} move from ${originalPos}→${newPos} exposes other pieces`);
    
    let totalPenalty = 0;
    
    for (const myPiece of myPieces) {
      // Check if this piece was previously protected by the piece I'm moving
      const wasProtected = this.isPieceProtected(myPiece.position, originalPos);
      const stillProtected = this.isPieceProtected(myPiece.position, newPos);
      
      if (wasProtected && !stillProtected) {
        // This piece has lost protection - check if enemies can now capture it
        const threateningEnemies = this.findThreateningEnemies(myPiece.position, gameStateAfterMove);
        
        if (threateningEnemies.length > 0) {
          const pieceValue = this.getPieceValue(myPiece.name);
          const penalty = -pieceValue * 2; // Double penalty for exposing pieces
          
          this.logStrategy(`⚠️ EXPOSED: ${myPiece.name} at ${myPiece.position} now vulnerable to ${threateningEnemies.map(e => e.name).join(', ')} (penalty: ${penalty})`);
          totalPenalty += penalty;
        }
      }
    }
    
    return totalPenalty;
  }

  // Check if a piece at targetPos is protected by a piece at protectorPos
  isPieceProtected(targetPos, protectorPos) {
    // Simple protection model: pieces on adjacent squares provide protection
    const distance = this.calculateDistance(targetPos, protectorPos);
    
    // Protection only works if protector is very close (adjacent or near-adjacent)
    return distance <= 2;
  }

  // Find enemy pieces that can capture a piece at the given position
  findThreateningEnemies(targetPos, gameState) {
    const threats = [];
    const allOpponents = this.players.filter(p => p !== this.playerColor);
    
    for (const opponentColor of allOpponents) {
      const opponentPieces = this.getPlayerPieces(opponentColor, gameState);
      
      for (const enemyPiece of opponentPieces) {
        if (this.canPieceCaptureAt(enemyPiece, targetPos, gameState)) {
          threats.push(enemyPiece);
        }
      }
    }
    
    return threats;
  }

  // Check if a piece can capture at a specific position
  canPieceCaptureAt(attackerPiece, targetPos, gameState) {
    // Get possible moves for the attacking piece
    const possibleMoves = this.getPossibleMoves(attackerPiece, gameState);
    
    // For Owls: direct capture by moving to the square
    if (attackerPiece.type === 'Owl') {
      return possibleMoves.includes(targetPos);
    }
    
    // For Kites: swooping capture (cross-face move + adjacent)
    if (attackerPiece.type === 'Kite') {
      const currentFace = attackerPiece.position[0];
      const targetFace = targetPos[0];
      
      // Need cross-face move to capture
      if (currentFace === targetFace) return false;
      
      // Check if Kite can move to a position adjacent to target
      const adjacentSquares = this.getAdjacentSquares(targetPos);
      return possibleMoves.some(move => adjacentSquares.includes(move));
    }
    
    // For Ravens: mobbing (more complex, simplified for now)
    if (attackerPiece.type === 'Raven') {
      // TODO: Implement proper mobbing detection
      return false;
    }
    
    return false;
  }

  // Get piece value for penalty calculation
  getPieceValue(pieceName) {
    if (pieceName.includes('Owl')) return 1000;
    if (pieceName.includes('Kite')) return 300;
    if (pieceName.includes('Raven')) return 300;
    return 100;
  }

  // Find moves that disrupt opponent's crosspiece ghosting setup
  findCrosspieceDisruptiveMoves(ourMoves, opponentWinningMove) {
    const disruptiveMoves = [];
    const owlPos = opponentWinningMove.piece.position;
    const nestSquare = opponentWinningMove.targetSquare;
    
    this.logTactical(`🔍 Looking for ways to disrupt ${owlPos} → ${nestSquare} ghosting`);
    
    // Find what crosspieces enable this ghosting
    const enablingCrosspieces = [];
    for (const [pieceName, piecePos] of Object.entries(this.gameState.piecePositions)) {
      if (piecePos === "captured") continue;
      if (pieceName.includes('Owl') && pieceName === opponentWinningMove.piece.name) continue;
      
      if (this.enablesGhosting(owlPos, piecePos, nestSquare)) {
        enablingCrosspieces.push({name: pieceName, position: piecePos});
        this.logTactical(`  Found crosspiece: ${pieceName} at ${piecePos}`);
      }
    }
    
    // Strategy 1: Capture the crosspiece pieces
    for (const crosspiece of enablingCrosspieces) {
      for (const ourMove of ourMoves) {
        if (this.moveCanCapture(ourMove, crosspiece.position)) {
          disruptiveMoves.push(ourMove);
          this.logTactical(`  Can capture crosspiece ${crosspiece.name} with ${ourMove.piece.name}→${ourMove.targetSquare}`);
        }
      }
    }
    
    // Strategy 2: Block the nest square directly
    for (const ourMove of ourMoves) {
      if (ourMove.targetSquare === nestSquare) {
        disruptiveMoves.push(ourMove);
        this.logTactical(`  Can block nest ${nestSquare} with ${ourMove.piece.name}→${ourMove.targetSquare}`);
      }
    }
    
    // Strategy 3: Create threats that force opponent to respond defensively
    // (This would be more complex - for now, focus on direct blocking)
    
    return disruptiveMoves;
  }

  // Check if a move can capture a piece at the target position
  moveCanCapture(move, targetPosition) {
    // For Owls: direct capture by moving to the square
    if (move.piece.type === 'Owl' && move.targetSquare === targetPosition) {
      const targetPiece = this.findPieceAtSquare(targetPosition);
      return targetPiece && !this.isSameTeam(move.piece.name, targetPiece);
    }
    
    // For Kites: swooping capture (cross-face move + adjacent)
    if (move.piece.type === 'Kite') {
      const currentFace = move.piece.position[0];
      const targetFace = move.targetSquare[0];
      
      if (currentFace !== targetFace) { // Cross-face move required
        const adjacentSquares = this.getAdjacentSquares(targetPosition);
        if (adjacentSquares.includes(move.targetSquare)) {
          const targetPiece = this.findPieceAtSquare(targetPosition);
          return targetPiece && !this.isSameTeam(move.piece.name, targetPiece);
        }
      }
    }
    
    // For Ravens: mobbing (more complex - simplified for now)
    // TODO: Implement proper Raven mobbing detection
    
    return false;
  }
}