import { getAllOwlMoves } from "../game/rules/owlRules.js";
import { getAllKiteMoves } from "../game/rules/kiteRules.js";
import { getAllRavenMoves } from "../game/rules/ravenRules.js";
import { StrixPatterns } from "./strixPatterns.js";
import { convertToFlightway, generateFlightwayRoute } from "../game/rules/flightwayUtils.js";
import { LocalAIStorage } from "./aiStorage.js";
import { AIMemory } from "./aiMemory.js";

export class MinimaxAI {
  constructor(playerColor, gameStateManager) {
    this.playerColor = playerColor;
    this.gameState = gameStateManager;
    this.maxDepth = 1; // Depth 1: Evaluate immediate moves only (basic competence)
    this.strategicLogging = true;
    this.tacticalLogging = true;

    // Player order for three-player game
    this.playerOrder = ["brown", "yellow", "green"];
    this.players = this.playerOrder;

    // Will be set by AIPlayer
    this.moveExecutor = null;

    // Initialize tactical pattern recognition
    this.patterns = new StrixPatterns(gameStateManager);

    // Initialize AI memory for learning (using LocalStorage for now)
    const storage = new LocalAIStorage();
    this.memory = new AIMemory(playerColor, storage);
    this.memory.initialize().catch(err => console.error('AI memory init error:', err));
  }

  // Check if move results in immediate win
  isImmediateWinningMove(move) {
    if (move.piece.type !== "Owl") return false;

    const nestSquares = ["b7-7", "y7-7", "g7-7"];
    return nestSquares.includes(move.targetSquare);
  }

  // Calculate shadowed squares based on piece positions
  // Based on gameStateManager.updateShadowedRows logic
  calculateShadowedSquares(piecePositions, excludedPiece = null) {
    const shadowedSquares = {
      b: [],
      y: [],
      g: []
    };

    for (let pieceName in piecePositions) {
      let piecePosition = piecePositions[pieceName];

      // Skip excluded piece, owlHalla squares, and captured pieces
      if (pieceName === excludedPiece || piecePosition.includes("--") || piecePosition === "captured") {
        continue;
      }

      let boardColor = piecePosition.charAt(0);
      let row = parseInt(piecePosition.charAt(1));
      let column = parseInt(piecePosition.charAt(3));

      // Update shadowed squares based on piece position
      if (boardColor === "b") {
        // Brown piece shadows Yellow board (column) and Green board (row)
        for (let i = 1; i <= 7; i++) {
          shadowedSquares.y.push(`y${column}-${i}`);
          shadowedSquares.g.push(`g${i}-${row}`);
        }
      } else if (boardColor === "y") {
        // Yellow piece shadows Brown board (row) and Green board (column)
        for (let i = 1; i <= 7; i++) {
          shadowedSquares.b.push(`b${i}-${row}`);
          shadowedSquares.g.push(`g${column}-${i}`);
        }
      } else if (boardColor === "g") {
        // Green piece shadows Brown board (column) and Yellow board (row)
        for (let i = 1; i <= 7; i++) {
          shadowedSquares.b.push(`b${column}-${i}`);
          shadowedSquares.y.push(`y${i}-${row}`);
        }
      }
    }

    return shadowedSquares;
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

  // Main decision function - now with recursive minimax lookahead
  selectBestMove() {
    this.logStrategy(`=== AI SEARCH (${this.playerColor}) WITH DEPTH-${this.maxDepth} MINIMAX ===`);

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

    // STEP 2: Use recursive Max^n to evaluate each root move
    this.logStrategy(`🔍 Evaluating ${moves.length} moves with depth-${this.maxDepth} Max^n search...`);

    const evaluatedMoves = [];
    const nextPlayer = this.getNextPlayer(this.playerColor);

    for (const move of moves) {
      // Simulate this move
      const newPositions = this.simulateMove(
        this.gameState.piecePositions,
        move.piece.name,
        move.targetSquare
      );

      // Recursively evaluate with Max^n (each player maximizes their own score)
      const scores = this.maxn(newPositions, this.maxDepth - 1, nextPlayer);

      // Extract OUR score from the multi-player scores
      move.evaluation = scores[this.playerColor];
      move.allScores = scores; // Keep all scores for debugging
      evaluatedMoves.push(move);

      this.logStrategy(`📊 ${move.piece.name}→${move.targetSquare}: our score = ${scores[this.playerColor].toFixed(0)}`);
    }

    // Show the top 5 moves for debugging
    const sortedMoves = [...evaluatedMoves].sort((a, b) => b.evaluation - a.evaluation);
    this.logStrategy(`🏆 Top 5 moves after Max^n search:`);
    for (let i = 0; i < Math.min(5, sortedMoves.length); i++) {
      const move = sortedMoves[i];
      this.logStrategy(`  ${i + 1}. ${move.piece.name}→${move.targetSquare} (our score: ${move.evaluation.toFixed(0)})`);
    }

    // Check if any moves occupy nest squares (defensive)
    const nestSquares = ["b7-7", "y7-7", "g7-7"];
    const nestMoves = evaluatedMoves.filter(m => nestSquares.includes(m.targetSquare));
    if (nestMoves.length > 0) {
      console.log(`🛡️ DEFENSIVE NEST MOVES AVAILABLE (${nestMoves.length}):`);
      for (const move of nestMoves) {
        console.log(`  ${move.piece.name}→${move.targetSquare} (our score: ${move.evaluation.toFixed(0)})`);
      }
    }

    // STEP 3: Select best move based on Max^n scores (maximize OUR score)
    const bestMove = evaluatedMoves.reduce((best, current) =>
      current.evaluation > best.evaluation ? current : best
    );

    this.logStrategy(
      `🎯 SELECTED: ${bestMove.piece.name} to ${bestMove.targetSquare} (Max^n score: ${bestMove.evaluation.toFixed(0)})`
    );
    return bestMove;
  }

  // ========== RECURSIVE MAX^N IMPLEMENTATION ==========

  // Simulate a move on a cloned game state
  simulateMove(piecePositions, pieceName, targetSquare) {
    const newState = JSON.parse(JSON.stringify(piecePositions));
    newState[pieceName] = targetSquare;
    return newState;
  }

  // Get next player in turn order
  getNextPlayer(currentPlayer) {
    const currentIndex = this.playerOrder.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % this.playerOrder.length;
    return this.playerOrder[nextIndex];
  }

  // Recursive Max^n search (each player maximizes their own score)
  maxn(piecePositions, depth, currentPlayer) {
    // Terminal conditions
    if (depth === 0) {
      return this.evaluatePosition(piecePositions); // Returns {brown: X, yellow: Y, green: Z}
    }

    // Check for wins (terminal state)
    const winner = this.checkWinner(piecePositions);
    if (winner) {
      // Winner gets huge score, losers get terrible score
      const terminalScores = {
        brown: winner === 'brown' ? 1000000 : -1000000,
        yellow: winner === 'yellow' ? 1000000 : -1000000,
        green: winner === 'green' ? 1000000 : -1000000
      };
      return terminalScores;
    }

    // DISABLE LOGGING during recursive calls to avoid exponential log spam
    const savedLogging = this.strategicLogging;
    this.strategicLogging = false;

    // Generate moves for current player
    const gameState = { piecePositions: piecePositions };
    const moves = this.generateAllMoves(currentPlayer, gameState);

    // Restore logging
    this.strategicLogging = savedLogging;

    if (moves.length === 0) {
      // No moves available - return neutral scores
      return { brown: 0, yellow: 0, green: 0 };
    }

    const nextPlayer = this.getNextPlayer(currentPlayer);

    // Max^n: Current player picks move that maximizes THEIR score
    let bestScores = null;

    for (const move of moves) {
      const newPositions = this.simulateMove(piecePositions, move.piece.name, move.targetSquare);
      const childScores = this.maxn(newPositions, depth - 1, nextPlayer);

      // Current player picks the move with the best score FOR THEM
      if (!bestScores || childScores[currentPlayer] > bestScores[currentPlayer]) {
        bestScores = childScores;
      }
    }

    return bestScores;
  }

  // Check if any player has won
  checkWinner(piecePositions) {
    const nestSquares = ["b7-7", "y7-7", "g7-7"];
    for (const [pieceName, position] of Object.entries(piecePositions)) {
      if (pieceName.includes("Owl") && nestSquares.includes(position)) {
        // Extract player color from piece name
        if (pieceName.startsWith("brown")) return "brown";
        if (pieceName.startsWith("yellow")) return "yellow";
        if (pieceName.startsWith("green")) return "green";
      }
    }
    return null;
  }

  // Evaluate a position using Max^n (returns scores for ALL players)
  evaluatePosition(piecePositions) {
    // Max^n: Each player gets their own score
    const scores = {
      brown: 0,
      yellow: 0,
      green: 0
    };
    const nestSquares = ["b7-7", "y7-7", "g7-7"];
    const tempGameState = { piecePositions: piecePositions };

    // PART 1: Positional evaluation (flightway distances)
    // Each player's Owl distance to nest affects THEIR score
    for (const color of this.playerOrder) {
      const owlPiece = `${color}Owl`;
      const owlPosition = piecePositions[owlPiece];

      if (!owlPosition || owlPosition === "captured") continue;

      // Calculate flightway distance to nearest nest
      const distanceToNest = this.calculateDistanceToNearestNest(owlPosition);

      // Closer to nest = better for THIS player
      const positionalValue = Math.max(0, 120 - (distanceToNest * 10));
      scores[color] += positionalValue;
    }

    // PART 2: Strategic pattern evaluation (ghosting threats)
    // Having a ghosting threat benefits the player with the threat
    for (const color of this.playerOrder) {
      const threats = this.patterns.detectCompleteGhostThreats(color, tempGameState);
      if (threats.length > 0) {
        scores[color] += 3000 * threats.length; // Good for this player
      }
    }

    // PART 3: Capture threat evaluation
    // Being under threat hurts that player's score
    for (const color of this.playerOrder) {
      const playerPieces = this.getPlayerPieces(color, tempGameState);

      for (const piece of playerPieces) {
        if (piece.position === 'captured') continue;

        // Check if any opponent can capture this piece
        for (const opponentColor of this.playerOrder) {
          if (opponentColor === color) continue;

          const opponentPieces = this.getPlayerPieces(opponentColor, tempGameState);
          for (const oppPiece of opponentPieces) {
            if (oppPiece.position === 'captured') continue;

            if (this.canPieceCaptureAtSquare(oppPiece.name, oppPiece.position, piece.position)) {
              // This player's piece is under threat - bad for them
              const threatPenalty = this.getCaptureValue(piece.name) * 0.8;
              scores[color] -= threatPenalty;
            }
          }
        }
      }
    }

    // PART 4: Immediate win threat detection
    // If a player can win next move, that's GREAT for them, BAD for others
    const shadowedSquares = this.calculateShadowedSquares(tempGameState.piecePositions);

    for (const color of this.playerOrder) {
      const owl = this.getPlayerPieces(color, tempGameState).find(p => p.type === 'Owl');
      if (!owl || owl.position === 'captured') continue;

      const owlMoves = this.getPossibleMoves(owl, tempGameState);

      for (const move of owlMoves) {
        if (nestSquares.includes(move)) {
          const nestFace = move.charAt(0);
          const isShadowed = shadowedSquares[nestFace].includes(move);

          if (!isShadowed) {
            // This player can win! Great for them, terrible for others
            scores[color] += 100000; // Massive bonus for potential win

            // Penalize OTHER players (they would lose)
            for (const otherColor of this.playerOrder) {
              if (otherColor !== color) {
                scores[otherColor] -= 100000;
              }
            }
            break;
          }
        }
      }
    }

    // PART 5: Nest blocking bonus
    // Occupying nest is good for that player (defensive position)
    for (const color of this.playerOrder) {
      const playerPieces = this.getPlayerPieces(color, tempGameState);
      for (const piece of playerPieces) {
        if (nestSquares.includes(piece.position)) {
          scores[color] += 1000; // Bonus for blocking the nest
        }
      }
    }

    return scores;
  }

  // ========== END MAX^N IMPLEMENTATION ==========

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

        // Debug defensive move validation
        if ((piece.name === 'yellowKite' || piece.name === 'greenKite') &&
            (targetSquare === 'b7-6' || targetSquare === 'b7-4')) {
          console.log(`🔍 VALIDATION: ${piece.name} → ${targetSquare}: ${isValid ? 'VALID' : 'REJECTED'}`);
        }

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

    let moves = [];
    switch (piece.type) {
      case "Owl":
        moves = getAllOwlMoves(currentPos, state.piecePositions, piece.name);
        break;
      case "Kite":
        moves = getAllKiteMoves(currentPos, state.piecePositions, piece.name);
        // Debug Kite moves for defensive positions
        if ((currentPos === 'y6-2' || currentPos === 'y4-6') && (piece.name === 'yellowKite' || piece.name === 'greenKite')) {
          console.log(`🎯 KITE MOVES DEBUG: ${piece.name} at ${currentPos}`);
          console.log(`   Total moves generated: ${moves.length}`);
          console.log(`   All moves:`, moves);
          console.log(`   Contains b7-6: ${moves.includes('b7-6')}`);
          console.log(`   Contains b7-4: ${moves.includes('b7-4')}`);
          console.log(`   Contains b1-4: ${moves.includes('b1-4')}`);
        }
        break;
      case "Raven":
        moves = getAllRavenMoves(currentPos, state.piecePositions, piece.name);
        break;
      default:
        return [];
    }

    // AI-ONLY: Filter out shadowed squares
    // This doesn't affect the game rules, only how the AI evaluates moves
    const shadows = this.calculateShadowedSquares(state.piecePositions, piece.name);
    const unshadowedMoves = moves.filter(move => {
      const moveFace = move.charAt(0);
      const isShadowed = shadows[moveFace] && shadows[moveFace].includes(move);

      // Debug shadow filtering for critical moves
      if (isShadowed && (move === 'g7-7' || move === 'b7-7' || move === 'y7-7')) {
        console.log(`🛡️ AI SHADOW FILTER: ${piece.name} cannot move to ${move} (shadowed)`);
      }

      return !isShadowed;
    });

    // Debug if we filtered out any moves
    if (moves.length !== unshadowedMoves.length) {
      console.log(`🛡️ Shadow filtering: ${piece.name} - ${moves.length} total moves, ${unshadowedMoves.length} unshadowed`);
    }

    return unshadowedMoves;
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

  // Calculate flightway distance between two squares
  calculateFlightwayDistance(fromSquare, toSquare) {
    // Convert both squares to flightway coordinates
    const fromFw = convertToFlightway(fromSquare);
    const toFw = convertToFlightway(toSquare);

    if (!fromFw || !toFw) return null;

    // Parse flightway coordinates
    const fromMatch = fromFw.match(/([byg])(\d)([byg])(\d)/);
    const toMatch = toFw.match(/([byg])(\d)([byg])(\d)/);

    if (!fromMatch || !toMatch) return null;

    const fromFlightways = [`${fromMatch[1]}${fromMatch[2]}`, `${fromMatch[3]}${fromMatch[4]}`];
    const toFlightways = [`${toMatch[1]}${toMatch[2]}`, `${toMatch[3]}${toMatch[4]}`];

    // Check if they share a flightway
    for (const fromFlight of fromFlightways) {
      for (const toFlight of toFlightways) {
        if (fromFlight === toFlight) {
          // Same flightway - calculate distance along route
          const face = fromFlight[0];
          const number = parseInt(fromFlight[1]);
          const route = generateFlightwayRoute(face, number);

          const fromIndex = route.indexOf(fromSquare);
          const toIndex = route.indexOf(toSquare);

          if (fromIndex !== -1 && toIndex !== -1) {
            return Math.abs(toIndex - fromIndex);
          }
        }
      }
    }

    // Not on same flightway - use Manhattan distance as fallback
    const parseSquare = (square) => {
      const coords = square.substring(1).split("-");
      return { row: parseInt(coords[0]), col: parseInt(coords[1]) };
    };

    const from = parseSquare(fromSquare);
    const to = parseSquare(toSquare);
    return Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
  }

  // Calculate minimum flightway distance to any nest square
  calculateDistanceToNearestNest(owlPosition) {
    const nestSquares = ['b7-7', 'y7-7', 'g7-7'];
    let minDistance = Infinity;

    for (const nestSquare of nestSquares) {
      const distance = this.calculateFlightwayDistance(owlPosition, nestSquare);
      if (distance !== null && distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance === Infinity ? 12 : minDistance; // Default to max if no route found
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
        // Calculate FLIGHTWAY distance to nearest nest (actual move count!)
        const nestDistance = this.calculateDistanceToNearestNest(targetSquare);

        // Progressive bonus based on actual move count (closer = better)
        // Max distance is ~12 moves, so we create a strong gradient
        const distanceBonus = Math.max(0, 120 - (nestDistance * 10));
        bonus += distanceBonus;

        if (distanceBonus > 0) {
          this.logStrategy(`📏 Distance to nest: ${nestDistance} moves → +${distanceBonus} points`);
        }
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
