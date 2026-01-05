import { getAllOwlMoves } from "../game/rules/owlRules.js";
import { getAllKiteMoves } from "../game/rules/kiteRules.js";
import { getAllRavenMoves } from "../game/rules/ravenRules.js";
import { MinimaxAI } from "./aiStrategies.js";
import { OpeningBook } from "./openingBook.js";

export class AIPlayer {
  constructor(playerColor, gameStateManager, moveExecutor) {
    console.log(`🔥🔥🔥 CONSOLE FRESH TEST 1 - RAVEN BUGFIX VERSION 20251230-1435 🔥🔥🔥`);
    this.playerColor = playerColor;
    this.gameState = gameStateManager;
    this.moveExecutor = moveExecutor;
    this.strategy = 'minimax'; // Enhanced tactical AI
    
    // Logging controls
    this.strategicLogging = true;  // Strategic thinking logs - TEMPORARILY ENABLED FOR DEBUGGING
    this.mechanisticLogging = false; // Detailed move validation logs - disabled for cleaner output
    
    // Initialize minimax AI
    this.minimaxAI = new MinimaxAI(playerColor, gameStateManager);
    
    // Initialize opening book (each player gets their own instance)
    this.openingBook = new OpeningBook();
    
    // moveExecutor will be set later in gameAI.js
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
    this.logStrategy(`=== TURN START - Strategy: ${this.strategy} ===`);
    
    // Check opening book first (for both strategies)
    const moveNumber = this.getCurrentMoveNumber();
    if (false && moveNumber <= 6) { // TEMPORARILY DISABLED - Use opening book for first few moves
      this.logStrategy(`📚 Checking opening book for move ${moveNumber}...`);
      const openingMove = this.openingBook.getOpeningMove(this.playerColor, this.gameState, moveNumber);
      
      if (openingMove && this.isValidMove(openingMove.targetSquare, openingMove.piece.name)) {
        this.logStrategy(`📚 OPENING BOOK MOVE: ${openingMove.piece.name} → ${openingMove.targetSquare}`);
        return openingMove;
      } else if (openingMove) {
        this.logStrategy(`❌ Opening book move invalid: ${openingMove.piece.name} → ${openingMove.targetSquare}`);
      } else {
        this.logStrategy(`📚 No opening book move available for move ${moveNumber}`);
      }
    }
    
    // Use minimax AI for enhanced tactical play
    if (this.strategy === 'minimax') {
      return this.minimaxAI.selectBestMove();
    }
    
    // Fallback to original greedy strategy
    return this.selectMoveGreedy();
  }

  // Simplified greedy move selection (fallback only)
  selectMoveGreedy() {
    this.logStrategy(`=== SIMPLE GREEDY FALLBACK ===`);
    
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

    // Select best move for greedy fallback
    const selectedMove = sortedMoves[0];
    
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

  // Evaluate a specific move and assign a score (SIMPLIFIED for greedy fallback)
  evaluateMove(piece, targetSquare) {
    return this.evaluateMoveSimple(piece, targetSquare);
  }

  // === SIMPLIFIED EVALUATION METHODS ===
  
  // Simplified evaluation (no detailed capture analysis)
  evaluateMoveSimple(piece, targetSquare) {
    let score = 1; // Base score
    
    // Only check for obvious immediate wins
    if (piece.type === 'Owl' && this.isNestSquare(targetSquare)) {
      score += 1000;
    }
    
    // Simple advancement bonus
    if (this.isAdvancement(piece, targetSquare)) {
      score += 2;
    }
    
    return score;
  }

  // Check if square is a nest (winning square for Owls)
  isNestSquare(targetSquare) {
    const nestSquares = ["b7-7", "y7-7", "g7-7"];
    return nestSquares.includes(targetSquare);
  }

  // Simple advancement check
  isAdvancement(piece, targetSquare) {
    // Simple advancement check - moving toward center generally
    const coords = targetSquare.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    
    // Consider moves toward center (row 4, col 4) as advancement
    const centerDistance = Math.abs(row - 4) + Math.abs(col - 4);
    return centerDistance <= 3; // Within reasonable distance of center
  }

  // === CORE HELPER METHODS ===
  
  // Get piece type from name
  getPieceType(pieceName) {
    if (pieceName.includes('Owl')) return 'Owl';
    if (pieceName.includes('Kite')) return 'Kite';
    if (pieceName.includes('Raven')) return 'Raven';
    return 'Unknown';
  }

  // === PLAYER MANAGEMENT METHODS ===
  
  // Move validation (delegates to the move executor)
  isValidMove(targetSquare, pieceName) {
    return this.moveExecutor.isValidMove(targetSquare, pieceName);
  }

  // Strategy management
  setStrategy(strategy) {
    this.strategy = strategy;
    console.log(`> AI Player ${this.playerColor} strategy set to: ${strategy}`);
  }

  getStrategy() {
    return this.strategy;
  }

  // Set minimax search depth
  setSearchDepth(depth) {
    if (this.minimaxAI) {
      this.minimaxAI.maxDepth = depth;
      this.logStrategy(`Minimax search depth set to: ${depth}`);
    }
  }

  // Get current move number for opening book
  getCurrentMoveNumber() {
    // Count total moves made so far
    if (this.gameState.moveHistory) {
      return this.gameState.moveHistory.length + 1;
    }
    return 1;
  }
}