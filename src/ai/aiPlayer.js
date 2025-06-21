import {
  validateOwlMove,
  getAllOwlMoves,
} from "../game/rules/owlRules.js";
import { validateKiteMove, getAllKiteMoves } from "../game/rules/kiteRules.js";
import { validateRavenMove, getAllRavenMoves } from "../game/rules/ravenRules.js";

export class AIPlayer {
  constructor(playerColor, gameStateManager, moveExecutor) {
    this.playerColor = playerColor;
    this.gameState = gameStateManager;
    this.moveExecutor = moveExecutor;
    this.strategy = 'random'; // Default strategy, can be upgraded
  }

  // Main decision-making function
  selectMove() {
    console.log(`> AI Player ${this.playerColor} selecting move...`);
    
    // Get all pieces belonging to this player
    const playerPieces = this.getPlayerPieces();
    
    if (playerPieces.length === 0) {
      console.log(`L No pieces found for ${this.playerColor}`);
      return null;
    }

    // Evaluate all possible moves
    const allMoveOptions = this.evaluateAllMoves(playerPieces);
    
    if (allMoveOptions.length === 0) {
      console.log(`L No valid moves found for ${this.playerColor}`);
      return null;
    }

    // Select best move based on current strategy
    const selectedMove = this.selectBestMove(allMoveOptions);
    
    console.log(`<¯ AI selected: ${selectedMove.piece.name} to ${selectedMove.targetSquare}`);
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
        }
      }
    }

    return allMoveOptions;
  }

  // Get possible moves for a specific piece
  getPossibleMoves(piece) {
    const currentPos = piece.position;
    
    switch (piece.type) {
      case 'Owl':
        return getAllOwlMoves(currentPos, this.gameState.piecePositions, piece.name);
      case 'Kite':
        return getAllKiteMoves(currentPos, this.gameState.piecePositions, piece.name);
      case 'Raven':
        return getAllRavenMoves(currentPos, this.gameState.piecePositions, piece.name);
      default:
        return [];
    }
  }

  // Evaluate a specific move and assign a score
  evaluateMove(piece, targetSquare) {
    let score = 0;

    // Base score for any valid move
    score += 1;

    // Check for captures
    const captureValue = this.evaluateCapture(piece, targetSquare);
    score += captureValue;

    // Check for positional advantages
    const positionalValue = this.evaluatePosition(piece, targetSquare);
    score += positionalValue;

    // Check for defensive considerations
    const defensiveValue = this.evaluateDefense(piece, targetSquare);
    score += defensiveValue;

    // Check for winning moves
    const winningValue = this.evaluateWinning(piece, targetSquare);
    score += winningValue;

    return score;
  }

  // Evaluate capture opportunities
  evaluateCapture(piece, targetSquare) {
    let score = 0;

    if (piece.type === 'Owl') {
      // Check for direct owl capture
      const targetPiece = this.findPieceAtSquare(targetSquare);
      if (targetPiece && !this.isSameTeam(piece.name, targetPiece)) {
        score += this.getPieceCaptureValue(targetPiece);
      }
    } else if (piece.type === 'Kite') {
      // Check for kite swooping capture
      const currentFace = piece.position[0];
      const targetFace = targetSquare[0];
      
      if (currentFace !== targetFace) {
        // Cross-face move - check for adjacent captures
        const adjacentSquares = this.getAdjacentSquares(targetSquare);
        for (const adjSquare of adjacentSquares) {
          const targetPiece = this.findPieceAtSquare(adjSquare);
          if (targetPiece && !this.isSameTeam(piece.name, targetPiece)) {
            score += this.getPieceCaptureValue(targetPiece);
          }
        }
      }
    } else if (piece.type === 'Raven') {
      // Check for raven mobbing opportunities
      // This would need more complex logic to find mobbing partners
      score += this.evaluateRavenMobbing(piece, targetSquare);
    }

    return score;
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

  // Evaluate defensive considerations
  evaluateDefense(piece, targetSquare) {
    let score = 0;

    // Penalty for moving into danger
    if (this.isUnderThreat(targetSquare, piece.name)) {
      score -= 5;
    }

    // Bonus for protecting important pieces
    if (this.protectsImportantPiece(piece, targetSquare)) {
      score += 2;
    }

    return score;
  }

  // Evaluate winning potential
  evaluateWinning(piece, targetSquare) {
    let score = 0;

    // Massive bonus for owl reaching center
    if (piece.type === 'Owl' && this.isCenter(targetSquare)) {
      score += 1000;
    }

    // Bonus for moves that set up winning combinations
    if (this.setsUpWin(piece, targetSquare)) {
      score += 50;
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

  isCenter(square) {
    return ['b7-7', 'y7-7', 'g7-7'].includes(square);
  }

  isNearCenter(square) {
    const coords = square.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    return row >= 6 && col >= 6;
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

  evaluateRavenMobbing(piece, targetSquare) {
    // Evaluate raven mobbing opportunities
    // This would need complex logic to find mobbing partners and victims
    return 0; // Placeholder
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