import { getAllOwlMoves } from "../game/rules/owlRules.js";
import { getAllKiteMoves } from "../game/rules/kiteRules.js";
import { getAllRavenMoves } from "../game/rules/ravenRules.js";
import { StrixPatterns } from "./strixPatterns.js";

export class MinimaxAI {
  constructor(playerColor, gameStateManager) {
    this.playerColor = playerColor;
    this.gameState = gameStateManager;
    this.maxDepth = 1;
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

    // STEP 2: Evaluate moves with pattern system
    const evaluatedMoves = [];
    for (const move of moves) {
      const patternScore = this.patterns.evaluateMovePatterns(
        move,
        this.playerColor
      );

      // Add pattern score to move evaluation
      move.evaluation = patternScore;
      evaluatedMoves.push(move);

      this.logStrategy(
        `📊 ${move.piece.name}→${move.targetSquare}: pattern score ${patternScore}`
      );
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

    for (const piece of pieces) {
      const possibleMoves = this.getPossibleMoves(piece, state);

      for (const targetSquare of possibleMoves) {
        if (this.isValidMove(piece.name, targetSquare, state)) {
          moves.push({
            piece: piece,
            targetSquare: targetSquare,
            evaluation: 0,
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
      return this.moveExecutor.isValidMove(targetSquare, pieceName);
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
}
