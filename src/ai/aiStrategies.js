import { getAllOwlMoves } from "../game/rules/owlRules.js";
import { getAllKiteMoves } from "../game/rules/kiteRules.js";
import { getAllRavenMoves, isValidMobbingConfiguration } from "../game/rules/ravenRules.js";
import { StrixPatterns } from "./strixPatterns.js";
import { convertToFlightway, generateFlightwayRoute } from "../game/rules/flightwayUtils.js";
import { BackendAIStorage, LocalAIStorage } from "./aiStorage.js";
import { AIMemory } from "./aiMemory.js";

export class MinimaxAI {
  constructor(playerColor, gameStateManager) {
    this.playerColor = playerColor;
    this.gameState = gameStateManager;
    this.maxDepth = 1; // Depth 1: Evaluate immediate moves only (basic competence)
    this.strategicLogging = true; // TEMPORARILY ENABLED FOR DEBUGGING
    this.tacticalLogging = true;  // TEMPORARILY ENABLED FOR DEBUGGING
    this.evalLogging = false;     // Per-leaf evaluation logs (off by default — noisy & perf-critical)

    // Threat-extension (forcing-line) search: looks deep ONLY along tactically
    // forcing moves (wins, Owl-captures, threat blocks, threat creations) so it
    // can read forced sequences — e.g. a setup move that ends in your own Owl
    // being captured several plies later — without a full-width deep search.
    this.tacticalDepth = 5;          // plies to read along forcing lines
    this.tacticalNodeBudget = 4000;  // hard cap per candidate; static fallback if exceeded
    this._tacticalNodes = 0;         // per-decision node counter

    // Player order for three-player game
    this.playerOrder = ["brown", "yellow", "green"];
    this.players = this.playerOrder;

    // Will be set by AIPlayer
    this.moveExecutor = null;

    // Initialize tactical pattern recognition
    this.patterns = new StrixPatterns(gameStateManager);

    // Initialize AI memory for learning (using Railway backend for persistence)
    const apiUrl = window.STRIX_API_URL || 'http://localhost:3001';
    const storage = new BackendAIStorage(apiUrl);
    this.memory = new AIMemory(playerColor, storage);
    this.memory.initialize().catch(err => console.error('AI memory init error:', err));
  }

  // Is the given position a win for `color`? Either its Owl is on a nest
  // square (Rule 1) or it is the last Owl standing (Rule 22).
  isWinFor(color, positions) {
    const nestSquares = ["b7-7", "y7-7", "g7-7"];
    const owl = positions[`${color}Owl`];
    if (owl && owl !== "captured" && nestSquares.includes(owl)) return true;

    const aliveOwls = this.playerOrder.filter(c => {
      const p = positions[`${c}Owl`];
      return p && p !== "captured";
    });
    return aliveOwls.length === 1 && aliveOwls[0] === color;
  }

  // Check if a move wins immediately — reaching the nest OR capturing the last
  // opposing Owl (any piece can do the latter, e.g. a Kite swoop on the final
  // enemy Owl ends the game by Rule 22).
  isImmediateWinningMove(move) {
    const after = this.simulateMove(
      this.gameState.piecePositions,
      move.piece.name,
      move.targetSquare
    );
    return this.isWinFor(this.playerColor, after);
  }

  // Detect if we're in the opening phase of the game
  isOpeningPhase(piecePositions) {
    // Opening phase = first few moves when pieces haven't moved much
    // Count how many pieces are still close to starting positions
    let piecesInStartingArea = 0;
    let totalActivePieces = 0;

    const startingRows = { b: 1, y: 1, g: 1 }; // Starting rows for each color

    for (const [pieceName, position] of Object.entries(piecePositions)) {
      if (position === 'captured') continue;
      totalActivePieces++;

      const face = position[0];
      const coords = position.substring(1).split("-");
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);

      // Check if piece is in starting area (rows 1-3)
      if (row <= 3) {
        piecesInStartingArea++;
      }
    }

    // Opening phase if more than 70% of pieces are still in starting area
    return totalActivePieces > 0 && (piecesInStartingArea / totalActivePieces) > 0.7;
  }

  // Check if a piece has friendly support nearby (for piece coordination)
  hasFriendlySupport(pieceName, position, piecePositions) {
    if (!position || position === 'captured') return false;

    const pieceColor = pieceName.startsWith('brown') ? 'brown' :
                      pieceName.startsWith('yellow') ? 'yellow' : 'green';

    // Get adjacent and nearby squares (within 2 squares)
    const face = position[0];
    const coords = position.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);

    // Check all squares within Manhattan distance of 2
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (Math.abs(dr) + Math.abs(dc) > 2) continue; // Manhattan distance limit

        const checkRow = row + dr;
        const checkCol = col + dc;
        if (checkRow < 1 || checkRow > 7 || checkCol < 1 || checkCol > 7) continue;

        const checkSquare = `${face}${checkRow}-${checkCol}`;

        // Look for friendly pieces at this square
        for (const [otherPieceName, otherPosition] of Object.entries(piecePositions)) {
          if (otherPosition === checkSquare &&
              otherPieceName.startsWith(pieceColor) &&
              otherPieceName !== pieceName) {
            return true; // Found a friendly piece nearby
          }
        }
      }
    }

    return false; // No friendly support nearby
  }

  // Check if a player has "nest sight" - their Owl can reach a nest square on next turn
  // This is the foundation for Third Bird Rule checking (Thicket 0)
  hasNestSight(playerColor, positions) {
    // Get the player's Owl
    const owlPiece = this.getPlayerPieces(playerColor, { piecePositions: positions })
      .find(p => p.type === 'Owl');

    if (!owlPiece || owlPiece.position === 'captured') {
      return false;
    }

    // Get all possible moves for the Owl
    const owlMoves = this.getPossibleMoves(owlPiece, { piecePositions: positions });

    // Check if any move reaches a nest square
    const nestSquares = ['b7-7', 'y7-7', 'g7-7'];
    return owlMoves.some(move => nestSquares.includes(move));
  }

  // Check if a move violates the Third Bird Rule (Type 1, Thicket 0)
  // Type 1: Active Kingmaking - move gives nest sight to next player who didn't have it
  isType1ThirdBirdViolation(move, nextPlayer) {
    const currentPositions = this.gameState.piecePositions;

    // Check if next player has nest sight BEFORE this move
    const hadNestSightBefore = this.hasNestSight(nextPlayer, currentPositions);

    // Simulate the move to get new positions
    const newPositions = this.simulateMove(
      currentPositions,
      move.piece.name,
      move.targetSquare
    );

    // Check if next player has nest sight AFTER this move
    const hasNestSightAfter = this.hasNestSight(nextPlayer, newPositions);

    // Type 1 violation: Next player gains nest sight from this move
    // (Active kingmaking - giving them a winning opportunity they didn't have)
    if (!hadNestSightBefore && hasNestSightAfter) {
      return true;
    }

    return false;
  }

  // Check if a player can prevent an opponent from winning
  // "Preventing" includes: positional blocking, capturing the Owl, removing ghosting pivots
  canPlayerBlockNestSight(playerColor, opponentColor, gameState) {
    // Generate all possible moves for the player
    const playerMoves = this.generateAllMoves(playerColor, { piecePositions: gameState });

    // Check if any move would remove the opponent's nest sight
    for (const move of playerMoves) {
      // Simulate this move
      const newPositions = this.simulateMove(
        gameState,
        move.piece.name,
        move.targetSquare
      );

      // Check if opponent has nest sight after this move
      const oppHasNestSight = this.hasNestSight(opponentColor, newPositions);

      if (!oppHasNestSight) {
        // This move prevents the opponent from winning
        // (could be blocking path, capturing Owl, removing ghosting pivot, etc.)
        return true;
      }
    }

    return false; // No way to prevent opponent's win
  }

  // Check if a move violates the Third Bird Rule (Type 2, Thicket 0)
  // Type 2: Giving nest sight to skip-one player when intervening player cannot prevent them
  // "Cannot prevent" = no move that blocks path, captures Owl, or removes ghosting pivot
  // Example: Yellow moves → Brown (skip-one) gets nest sight → Green (next) cannot prevent Brown
  isType2ThirdBirdViolation(move, nextPlayer, skipOnePlayer) {
    const currentPositions = this.gameState.piecePositions;

    // Step 1: Check if skip-one player has nest sight BEFORE my move
    const skipOneHadNestSightBefore = this.hasNestSight(skipOnePlayer, currentPositions);

    // Step 2: Simulate my move to get the state after my turn
    const positionsAfterMyMove = this.simulateMove(
      currentPositions,
      move.piece.name,
      move.targetSquare
    );

    // Step 3: Check if skip-one player has nest sight AFTER my move
    const skipOneHasNestSightAfter = this.hasNestSight(skipOnePlayer, positionsAfterMyMove);

    // Step 4: Type 2 only applies if I GAVE nest sight to skip-one player
    if (skipOneHadNestSightBefore || !skipOneHasNestSightAfter) {
      return false; // Skip-one already had it, or doesn't have it now
    }

    // Step 5: I gave nest sight to skip-one player. Now check if intervening player can prevent them.
    // "Prevent" includes blocking path, capturing Owl, or removing ghosting pivot
    const nextPlayerCanPrevent = this.canPlayerBlockNestSight(
      nextPlayer,
      skipOnePlayer,
      positionsAfterMyMove
    );

    if (nextPlayerCanPrevent) {
      return false; // Intervening player can handle it, no violation
    }

    // Type 2 violation: I gave nest sight to skip-one player AND intervening player is helpless
    return true;
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
    console.log(`🚀🚀🚀 RAVEN-BUGFIX-DEPLOYED-VERSION-20251230 🚀🚀🚀`);

    // PHASE 2: Check learned opening book FIRST (before generating all moves)
    if (this.memory && this.gameState.moveHistory) {
      const moveHistory = this.gameState.moveHistory || [];

      // Extract actual moves from history (filter out metadata like "// Brown wins")
      const actualMoves = moveHistory.filter(m => m && typeof m === 'string' && !m.startsWith('//') && !m.startsWith('['));

      const learnedMove = this.memory.getBestOpeningMove(actualMoves);

      if (learnedMove) {
        // Parse learned move format: "yO-y72" or "bR-g75"
        const match = learnedMove.match(/^([bygBYG][ORK])-([bygBYG]\d-\d)$/);
        if (match) {
          const pieceName = match[1];
          const targetSquare = match[2];

          // Verify this piece still exists and move is valid
          const piecePosition = this.gameState.piecePositions[pieceName];
          if (piecePosition && piecePosition !== 'captured') {
            const piece = {
              name: pieceName,
              position: piecePosition,
              type: this.getPieceType(pieceName)
            };

            // Validate the move is actually legal
            if (this.isValidMove(pieceName, targetSquare, this.gameState)) {
              console.log(`📚 USING LEARNED OPENING: ${pieceName} → ${targetSquare}`);
              return { piece, targetSquare };
            } else {
              console.log(`⚠️ Learned move ${learnedMove} is no longer valid, falling back to evaluation`);
            }
          }
        }
      }
    }

    const moves = this.generateAllMoves(this.playerColor);

    if (moves.length === 0) {
      return null;
    }

    // Check for immediate winning moves
    for (const move of moves) {
      if (this.isImmediateWinningMove(move)) {
        console.log(`🏆 ${this.playerColor.toUpperCase()} WINS: ${move.piece.name} → ${move.targetSquare}`);
        return move;
      }
    }

    // THIRD BIRD RULE (Thicket 0, Type 1 & Type 2): Filter out Third Bird violations
    const nextPlayer = this.getNextPlayer(this.playerColor);
    const skipOnePlayer = this.getNextPlayer(nextPlayer); // Player two positions ahead
    const legalMoves = [];
    const type1Violations = [];
    const type2Violations = [];

    for (const move of moves) {
      // Check Type 1: Active Kingmaking (giving nest sight to immediate next player)
      if (this.isType1ThirdBirdViolation(move, nextPlayer)) {
        type1Violations.push(move);
        console.log(`🚫 TYPE 1 THIRD BIRD: ${this.playerColor.toUpperCase()} ${move.piece.name}→${move.targetSquare} would give nest sight to ${nextPlayer}`);
        continue; // Skip to next move
      }

      // Check Type 2: Giving nest sight to skip-one player when next player cannot prevent
      // Example: Yellow moves → Brown (skip-one) gets nest sight → Green (next) helpless
      if (this.isType2ThirdBirdViolation(move, nextPlayer, skipOnePlayer)) {
        type2Violations.push(move);
        console.log(`🚫 TYPE 2 THIRD BIRD: ${this.playerColor.toUpperCase()} ${move.piece.name}→${move.targetSquare} gives nest sight to ${skipOnePlayer}, ${nextPlayer} cannot prevent`);
        continue; // Skip to next move
      }

      // Move is legal
      legalMoves.push(move);
    }

    // If all moves violate Third Bird, we must choose the least bad option
    // (This shouldn't happen in well-played games, but we need a fallback)
    const movesToEvaluate = legalMoves.length > 0 ? legalMoves : moves;

    if (legalMoves.length === 0) {
      const totalViolations = type1Violations.length + type2Violations.length;
      console.log(`⚠️ ${this.playerColor.toUpperCase()}: ALL ${totalViolations} moves violate Third Bird Rule!`);
      console.log(`   Type 1 violations: ${type1Violations.length}, Type 2 violations: ${type2Violations.length}`);
      console.log(`   Choosing least bad option (unavoidable foul - Rule 17(xi))...`);
    }

    const evaluatedMoves = [];

    for (const move of movesToEvaluate) {
      // Simulate this move
      const newPositions = this.simulateMove(
        this.gameState.piecePositions,
        move.piece.name,
        move.targetSquare
      );

      // DEBUG: Show opponent's predicted response for capture moves
      const capturedPieces = Object.entries(newPositions).filter(([name, pos]) =>
        pos === 'captured' && this.gameState.piecePositions[name] !== 'captured'
      );
      const isCapture = capturedPieces.length > 0;

      // Evaluate with the threat-extension search: reads deep along forcing
      // lines (wins / Owl-captures / blocks / threat-creations) and falls back
      // to the static eval where the position is quiet. This is what lets the
      // AI see that a move ignites a forced sequence losing its own Owl.
      this._tacticalNodes = 0;
      const scores = this.tacticalMaxn(newPositions, this.tacticalDepth, nextPlayer, this.playerColor);

      // Extract OUR score from the multi-player scores
      move.evaluation = scores[this.playerColor];
      move.allScores = scores; // Keep all scores for debugging
      evaluatedMoves.push(move);

      // Show only capture moves with their scores
      const capturedVictims = Object.entries(newPositions).filter(([name, pos]) =>
        pos === 'captured' && this.gameState.piecePositions[name] !== 'captured'
      ).map(([name]) => name);

      if (capturedVictims.length > 0) {
        // Get detailed breakdown for captures to understand why AI rejects them
        const evaluation = this.evaluatePosition(newPositions);
        const breakdown = evaluation.breakdown;

        console.log(`💥 ${this.playerColor.toUpperCase()} CAPTURE: ${move.piece.name}→${move.targetSquare} captures ${capturedVictims.join(', ')}`);
        console.log(`   Total scores: B=${scores.brown.toFixed(0)} Y=${scores.yellow.toFixed(0)} G=${scores.green.toFixed(0)} | ${this.playerColor}=${scores[this.playerColor].toFixed(0)}`);
        console.log(`   Material:     B=${breakdown.material.brown.toFixed(0)} Y=${breakdown.material.yellow.toFixed(0)} G=${breakdown.material.green.toFixed(0)}`);
        console.log(`   Positional:   B=${breakdown.positional.brown.toFixed(0)} Y=${breakdown.positional.yellow.toFixed(0)} G=${breakdown.positional.green.toFixed(0)}`);
        console.log(`   EnPrise pen:  B=-${breakdown.enPrise.brown.toFixed(0)} Y=-${breakdown.enPrise.yellow.toFixed(0)} G=-${breakdown.enPrise.green.toFixed(0)}`);
      }
    }

    // Sort moves by evaluation score and show top candidates
    const sortedMoves = evaluatedMoves.sort((a, b) => b.evaluation - a.evaluation);

    console.log(`\n📊 ${this.playerColor.toUpperCase()} - All ${sortedMoves.length} moves evaluated (showing all):`);
    sortedMoves.forEach((move, index) => {
      const nextPlayer = this.getNextPlayer(this.playerColor);
      const newPositions = this.simulateMove(
        this.gameState.piecePositions,
        move.piece.name,
        move.targetSquare
      );
      const givesNestSight = this.hasNestSight(nextPlayer, newPositions);
      const iHaveNestSight = this.hasNestSight(this.playerColor, newPositions);
      const nestSightMarker = givesNestSight ? ' 🚫ThirdBird' : '';
      const myNestSightMarker = iHaveNestSight ? ' ⭐NESTSIGHT' : '';
      console.log(`  ${index + 1}. ${move.piece.name} → ${move.targetSquare}: ${move.evaluation.toFixed(0)}${myNestSightMarker}${nestSightMarker}`);
    });

    // Select best move
    const bestMove = sortedMoves[0];

    console.log(`🎯 ${this.playerColor.toUpperCase()} plays: ${bestMove.piece.name} → ${bestMove.targetSquare} (score: ${bestMove.evaluation.toFixed(0)})\n`);
    return bestMove;
  }

  // ========== RECURSIVE MAX^N IMPLEMENTATION ==========

  // Simulate a move on a cloned game state
  // CRITICAL: Must execute captures so material evaluation works correctly!
  simulateMove(piecePositions, pieceName, targetSquare) {
    const newState = JSON.parse(JSON.stringify(piecePositions));
    const pieceType = this.getPieceType(pieceName);
    const fromSquare = piecePositions[pieceName];

    // Move the piece
    newState[pieceName] = targetSquare;

    // Execute captures based on piece type
    if (pieceType === 'Owl') {
      // Owl direct capture: if target square is occupied by opponent, capture it
      const victim = this.findPieceAtSquare(targetSquare, { piecePositions });
      if (victim && !this.isSameTeam(pieceName, victim)) {
        newState[victim] = 'captured';
      }
    }
    else if (pieceType === 'Kite') {
      // Kite swoop capture: cross-face move captures adjacent opponents
      const fromFace = fromSquare[0];
      const toFace = targetSquare[0];

      if (fromFace !== toFace) { // Must be cross-face swoop
        const adjacentSquares = this.getAdjacentSquares(targetSquare);
        for (const adjSquare of adjacentSquares) {
          const victim = this.findPieceAtSquare(adjSquare, { piecePositions });
          if (victim && !this.isSameTeam(pieceName, victim)) {
            newState[victim] = 'captured';
          }
        }
      }
    }
    else if (pieceType === 'Raven') {
      // Raven mobbing capture: cross-face move + passive Raven forms sandwich
      const fromFace = fromSquare[0];
      const toFace = targetSquare[0];

      if (fromFace !== toFace) { // Must be cross-face move
        // DEBUG: Show all Ravens available for mobbing (once per cross-face move)
        // Ravens available debug - disabled to reduce spam

        // Check all potential victims
        for (const [victimName, victimPos] of Object.entries(piecePositions)) {
          if (victimPos === 'captured' || victimName === pieceName) continue;
          if (this.isSameTeam(pieceName, victimName)) continue;

          // Look for a passive Raven that creates valid mobbing configuration
          for (const [passiveName, passivePos] of Object.entries(piecePositions)) {
            if (!passiveName.endsWith('Raven')) continue;
            if (passiveName === pieceName || passivePos === 'captured') continue;

            // Check if attacking Raven (at targetSquare), passive Raven, and victim form valid mob
            // console.log(`  🔍 Checking mobbing: attacking=${targetSquare}, passive=${passivePos}, victim=${victimPos}`);
            if (isValidMobbingConfiguration(targetSquare, passivePos, victimPos)) {
              // Mobbing capture detected (logging disabled)
              newState[victimName] = 'captured';
              break; // Each victim can only be captured once
            }
          }
        }
      }
    }

    return newState;
  }

  // Get next player in turn order
  getNextPlayer(currentPlayer) {
    const currentIndex = this.playerOrder.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % this.playerOrder.length;
    return this.playerOrder[nextIndex];
  }

  // Recursive Max^n search (each player maximizes their own score)
  maxn(piecePositions, depth, currentPlayer, debugCapture = null) {
    // Terminal conditions
    if (depth === 0) {
      const evaluation = this.evaluatePosition(piecePositions);
      return evaluation.scores; // Returns {brown: X, yellow: Y, green: Z}
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
    let bestMove = null;

    for (const move of moves) {
      const newPositions = this.simulateMove(piecePositions, move.piece.name, move.targetSquare);
      const childScores = this.maxn(newPositions, depth - 1, nextPlayer, debugCapture);

      // Current player picks the move with the best score FOR THEM
      if (!bestScores || childScores[currentPlayer] > bestScores[currentPlayer]) {
        bestScores = childScores;
        bestMove = move;
      }
    }

    return bestScores;
  }

  // Check if any player has won — by reaching the nest (Rule 1) or by being the
  // last Owl standing (Rule 22).
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

    // Last Owl standing: if only one team still has an Owl, that team has won.
    const aliveOwls = this.playerOrder.filter(c => {
      const p = piecePositions[`${c}Owl`];
      return p && p !== "captured";
    });
    if (aliveOwls.length === 1) return aliveOwls[0];

    return null;
  }

  // ========== THREAT-EXTENSION (FORCING-LINE) SEARCH ==========

  // Legal moves for a piece in a HYPOTHETICAL position (not the live board).
  // getPossibleMoves already generates rule-correct moves against the passed
  // state (Kite/Raven occupancy + path, Owl adjacency/ghosts) and shadow-filters
  // them. We add the two checks the generators don't: non-Owls may not stop on a
  // nest square (Rule 4), and an Owl may not land on a same-team piece.
  legalMovesInState(piece, gameState) {
    const nestSquares = ["b7-7", "y7-7", "g7-7"];
    const moves = this.getPossibleMoves(piece, gameState);
    return moves.filter(target => {
      if (piece.type !== "Owl" && nestSquares.includes(target)) return false;
      if (piece.type === "Owl") {
        const occupant = this.findPieceAtSquare(target, gameState);
        if (occupant && this.isSameTeam(piece.name, occupant)) return false;
      }
      return true;
    });
  }

  // Build the set of TACTICALLY RELEVANT moves for a player in a position:
  // moves that win, capture an opponent Owl, neutralise an opponent's existing
  // win-threat (block path / take the Owl / take the ghost pivot), or create a
  // new win-threat for the mover. Returns [] when the position is "quiet" — the
  // caller then stops extending and scores statically.
  generateRelevantMoves(playerColor, gameState) {
    const positions = gameState.piecePositions;
    const opponents = this.playerOrder.filter(c => c !== playerColor);

    // Threats present BEFORE this player moves, used to detect blocks/creations.
    const oppThreatBefore = {};
    for (const opp of opponents) oppThreatBefore[opp] = this.hasNestSight(opp, positions);
    const moverThreatBefore = this.hasNestSight(playerColor, positions);

    const relevant = [];
    const pieces = this.getPlayerPieces(playerColor, gameState);

    for (const piece of pieces) {
      for (const targetSquare of this.legalMovesInState(piece, gameState)) {
        const after = this.simulateMove(positions, piece.name, targetSquare);

        let tag = null;
        if (this.checkWinner(after) === playerColor) {
          tag = "win";
        } else if (opponents.some(opp => {
          const oppOwl = `${opp}Owl`;
          return positions[oppOwl] && positions[oppOwl] !== "captured" && after[oppOwl] === "captured";
        })) {
          tag = "owlCapture";
        } else if (opponents.some(opp => oppThreatBefore[opp] && !this.hasNestSight(opp, after))) {
          tag = "block";
        } else if (!moverThreatBefore && this.hasNestSight(playerColor, after)) {
          tag = "createThreat";
        }

        if (tag) relevant.push({ piece, targetSquare, tacticalTag: tag });
      }
    }

    return relevant;
  }

  // Recursive Max^n restricted to forcing moves. Each player maximises its own
  // score; quiet positions and the depth/budget limits fall back to the static
  // evaluation (whose elimination terms already score a lost Owl at ~ -1,000,000).
  tacticalMaxn(positions, depth, player, rootPlayer) {
    // Terminal: someone has won (nest or last Owl standing). Add the remaining
    // depth so a win reached sooner scores higher than the same win reached
    // later — the AI takes the quickest path to victory.
    const winner = this.checkWinner(positions);
    if (winner) {
      const terminal = { brown: -1000000, yellow: -1000000, green: -1000000 };
      terminal[winner] = 1000000 + depth;
      return terminal;
    }

    if (depth <= 0 || this._tacticalNodes >= this.tacticalNodeBudget) {
      return this.evaluatePosition(positions).scores;
    }
    this._tacticalNodes++;

    // Skip eliminated players (Rule 16: no Owl ⇒ no moves). If fewer than two
    // Owls remain there is no tactical contest left — score statically.
    let mover = player;
    let hops = 0;
    while (this.isEliminated(mover, positions) && hops < this.playerOrder.length) {
      mover = this.getNextPlayer(mover);
      hops++;
    }
    if (hops >= this.playerOrder.length) {
      return this.evaluatePosition(positions).scores;
    }

    // Quiet move generation must not spam the strategic logs.
    const savedStrategic = this.strategicLogging;
    this.strategicLogging = false;
    const moves = this.generateRelevantMoves(mover, { piecePositions: positions });
    this.strategicLogging = savedStrategic;

    if (moves.length === 0) {
      return this.evaluatePosition(positions).scores; // quiet — stop extending
    }

    const nextPlayer = this.getNextPlayer(mover);
    let bestScores = null;
    for (const move of moves) {
      const child = this.simulateMove(positions, move.piece.name, move.targetSquare);
      const childScores = this.tacticalMaxn(child, depth - 1, nextPlayer, rootPlayer);
      if (!bestScores || childScores[mover] > bestScores[mover]) {
        bestScores = childScores;
      }
    }
    return bestScores;
  }

  // A player is eliminated once its Owl has been captured (Rule 16).
  isEliminated(playerColor, positions) {
    const owl = positions[`${playerColor}Owl`];
    return !owl || owl === "captured";
  }

  // ========== END THREAT-EXTENSION SEARCH ==========

  // Evaluate a position using Max^n (returns scores for ALL players)
  evaluatePosition(piecePositions) {
    const elog = (...args) => { if (this.evalLogging) console.log(...args); };

    // Max^n: Each player gets their own score
    const scores = {
      brown: 0,
      yellow: 0,
      green: 0
    };
    const nestSquares = ["b7-7", "y7-7", "g7-7"];
    const tempGameState = { piecePositions: piecePositions };

    // PART 0: Survival / elimination (Rule 16 & Rule 22)
    // Losing your Owl ends your game; the last Owl standing wins outright.
    // This term dominates the evaluation, so the AI treats protecting its own
    // Owl and removing opponents' Owls as near-decisive — exactly as the rules
    // dictate. Scaled to match the terminal win/loss values used by checkWinner.
    const ELIMINATION = 1000000;
    const aliveOwlColors = this.playerOrder.filter(color => {
      const p = piecePositions[`${color}Owl`];
      return p && p !== "captured";
    });
    for (const color of this.playerOrder) {
      const owlPos = piecePositions[`${color}Owl`];
      if (!owlPos || owlPos === "captured") {
        scores[color] -= ELIMINATION; // eliminated — cannot win (Rule 16)
      }
    }
    if (aliveOwlColors.length === 1) {
      scores[aliveOwlColors[0]] += ELIMINATION; // last Owl standing wins (Rule 22)
    }

    // PART 1: Material evaluation (piece count and value)
    const materialScores = { brown: 0, yellow: 0, green: 0 };

    for (const [pieceName, position] of Object.entries(piecePositions)) {
      if (position === 'captured') continue;

      // Determine which player owns this piece
      let pieceOwner = null;
      for (const color of this.playerOrder) {
        if (pieceName.startsWith(color)) {
          pieceOwner = color;
          break;
        }
      }

      if (!pieceOwner) continue;

      // Get piece value
      const pieceValue = this.getCaptureValue(pieceName);

      // Add value to owner's score
      materialScores[pieceOwner] += pieceValue;

      // Subtract value from opponents' scores (relative material advantage)
      for (const color of this.playerOrder) {
        if (color !== pieceOwner) {
          materialScores[color] -= pieceValue * 0.5;
        }
      }
    }

    // Add material scores to total
    for (const color of this.playerOrder) {
      scores[color] += materialScores[color];
    }

    // PART 2: Positional evaluation (flightway distances)
    // Each player's Owl distance to nest affects THEIR score
    const positionalScores = { brown: 0, yellow: 0, green: 0 };
    for (const color of this.playerOrder) {
      const owlPiece = `${color}Owl`;
      const owlPosition = piecePositions[owlPiece];

      if (!owlPosition || owlPosition === "captured") continue;

      // Calculate flightway distance to nearest nest
      const distanceToNest = this.calculateDistanceToNearestNest(owlPosition);

      // Closer to nest = better for THIS player
      const positionalValue = Math.max(0, 120 - (distanceToNest * 10));
      positionalScores[color] += positionalValue;
      scores[color] += positionalValue;

      // PART 2b: Ghost-opportunity bonus.
      // Reward having a crosspiece in place that lets this Owl GHOST closer to
      // the nest than a normal one-square step could manage. This is what makes
      // the AI proactively set up ghosting plays — e.g. moving a Kite or Raven
      // cross-adjacent to its own Owl so the Owl can pivot inward next turn.
      // (Ghosts that reach the nest outright are already valued via nest sight.)
      const ghostShortcut = this.bestGhostAdvancement(owlPiece, owlPosition, distanceToNest, tempGameState);
      if (ghostShortcut > 0) {
        const ghostBonus = ghostShortcut * 12; // per square of flightway distance saved
        positionalScores[color] += ghostBonus;
        scores[color] += ghostBonus;
      }
    }

    // PART 3: Strategic pattern evaluation (ghosting threats)
    // Having a ghosting threat benefits the player with the threat
    for (const color of this.playerOrder) {
      const threats = this.patterns.detectCompleteGhostThreats(color, tempGameState);
      if (threats.length > 0) {
        scores[color] += 3000 * threats.length; // Good for this player
      }
    }

    // PART 4: Capture threat evaluation (EN PRISE DETECTION)
    // Being under threat hurts that player's score. Owls are scored at
    // elimination scale (losing one ends the game, Rule 16), so the AI stops
    // hanging its Owl and pounces on exposed enemy Owls. Rule 15 (Owls on black
    // squares are immune to Kites and Ravens) is enforced inside the threat
    // helpers, so safe Owls are neither feared nor falsely targeted.
    const enPrisePenalties = { brown: 0, yellow: 0, green: 0 };
    elog(`🔍 THREAT DETECTION: Checking all pieces for threats...`);
    for (const color of this.playerOrder) {
      const playerPieces = this.getPlayerPieces(color, tempGameState);

      for (const piece of playerPieces) {
        if (piece.position === 'captured') continue;

        const isOwl = piece.type === 'Owl';
        // An Owl in danger risks elimination, so weight it far above ordinary
        // material. Non-Owls use their capture value scaled by threat certainty.
        const immediateWeight = isOwl ? 150000 : this.getCaptureValue(piece.name) * 0.8;
        const enPriseWeight   = isOwl ?  80000 : this.getCaptureValue(piece.name) * 0.6;

        // Check if any opponent can capture this piece
        for (const opponentColor of this.playerOrder) {
          if (opponentColor === color) continue;

          const opponentPieces = this.getPlayerPieces(opponentColor, tempGameState);
          for (const oppPiece of opponentPieces) {
            if (oppPiece.position === 'captured') continue;

            // CHECK 1: IMMEDIATE THREAT - Can opponent capture from current position?
            if (this.canPieceCaptureAtSquare(oppPiece.name, oppPiece.position, piece.position, tempGameState)) {
              enPrisePenalties[color] += immediateWeight;
              scores[color] -= immediateWeight;
              elog(`   ⚠️ IMMEDIATE THREAT: ${oppPiece.name} at ${oppPiece.position} can capture ${piece.name} (-${immediateWeight})`);
            }
            // CHECK 2: EN PRISE - Can opponent MOVE to threaten this piece next turn?
            // Critical for depth-1 AI to avoid moving into capture range. Only counted
            // when there is no immediate threat from this attacker (avoid double-penalty).
            else if (this.canPieceMoveToThreaten(oppPiece, piece, tempGameState)) {
              enPrisePenalties[color] += enPriseWeight;
              scores[color] -= enPriseWeight;
              elog(`   ⚠️ EN PRISE: ${oppPiece.name} can move to threaten ${piece.name} (-${enPriseWeight})`);
            }
          }
        }
      }
    }

    // PART 5: Immediate win threat detection
    // If a player can win next move, that's GREAT for them, BAD for others

    for (const color of this.playerOrder) {
      const owl = this.getPlayerPieces(color, tempGameState).find(p => p.type === 'Owl');
      if (!owl || owl.position === 'captured') continue;

      // Calculate shadows EXCLUDING the owl being checked (avoid self-shadowing!)
      const shadowedSquares = this.calculateShadowedSquares(tempGameState.piecePositions, owl.name);

      const owlMoves = this.getPossibleMoves(owl, tempGameState);

      // DEBUG: Log nest sight checking
      const hasNestMove = owlMoves.some(m => nestSquares.includes(m));
      if (hasNestMove) {
        elog(`🎯 NEST SIGHT CHECK: ${color} Owl at ${owl.position}`);
        elog(`   Owl moves: ${owlMoves.join(', ')}`);
      }

      for (const move of owlMoves) {
        if (nestSquares.includes(move)) {
          const nestFace = move.charAt(0);
          const isShadowed = shadowedSquares[nestFace].includes(move);

          elog(`   ✓ Can reach nest ${move}: shadowed=${isShadowed}`);

          if (!isShadowed) {
            // This player can win! Great for them, terrible for others
            elog(`   🏆 GIVING +100000 to ${color}!`);
            scores[color] += 100000; // Massive bonus for potential win

            // Penalize OTHER players (they would lose)
            for (const otherColor of this.playerOrder) {
              if (otherColor !== color) {
                scores[otherColor] -= 100000;
              }
            }
            break;
          } else {
            elog(`   ❌ Nest ${move} is shadowed, no bonus`);
          }
        }
      }
    }

    // PART 6: Nest blocking bonus
    // Occupying nest is good for that player (defensive position)
    for (const color of this.playerOrder) {
      const playerPieces = this.getPlayerPieces(color, tempGameState);
      for (const piece of playerPieces) {
        if (nestSquares.includes(piece.position)) {
          scores[color] += 1000; // Bonus for blocking the nest
        }
      }
    }

    return {
      scores,
      breakdown: {
        material: materialScores,
        positional: positionalScores,
        enPrise: enPrisePenalties
      }
    };
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
          // Kite moves debug - disabled to reduce spam
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

      // Shadow filtering applied to critical moves (logging disabled)

      return !isShadowed;
    });

    // Shadow filtering applied (logging disabled to reduce spam)

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

  // Rule 15 helper: dark/black squares are those where (row + col) is even.
  // This holds uniformly across all three faces (e.g. the nest squares
  // b7-7 / y7-7 / g7-7 are all black). An Owl on a black square is immune to
  // Kites and Ravens, though still vulnerable to other Owls.
  isBlackSquare(square) {
    if (!square || square === 'captured' || square.length < 4) return false;
    const row = parseInt(square.charAt(1), 10);
    const col = parseInt(square.charAt(3), 10);
    return (row + col) % 2 === 0;
  }

  canPieceCaptureAtSquare(attackerPiece, attackerPosition, victimSquare, gameState = null) {
    const state = gameState || this.gameState;
    const piecePositions = state.piecePositions || state;
    const pieceType = this.getPieceType(attackerPiece);

    // Rule 15: an Owl standing on a black square cannot be taken by a Kite or
    // mobbed by Ravens (only another Owl can capture it).
    if (pieceType === 'Kite' || pieceType === 'Raven') {
      const victimName = this.findPieceAtSquare(victimSquare, state);
      if (victimName && victimName.includes('Owl') && this.isBlackSquare(victimSquare)) {
        return false;
      }
    }

    if (pieceType === 'Owl') {
      return this.getPossibleMoves({name: attackerPiece, position: attackerPosition, type: 'Owl'}, state)
               .includes(victimSquare);
    }
    else if (pieceType === 'Kite') {
      // Kite captures require cross-face swooping
      // Must move to a square on DIFFERENT face than origin AND adjacent to victim
      const attackerFace = attackerPosition[0];
      const victimFace = victimSquare[0];
      if (attackerFace === victimFace) return false; // Same face = no swoop

      const kitePossibleMoves = this.getPossibleMoves({name: attackerPiece, position: attackerPosition, type: 'Kite'}, state);
      const adjacentToVictim = this.getAdjacentSquares(victimSquare);

      // CRITICAL FIX: Only cross-face moves can capture
      // Filter to moves on different face than attacker's current position
      const crossFaceMoves = kitePossibleMoves.filter(move => move[0] !== attackerFace);
      const canThreaten = crossFaceMoves.some(move => adjacentToVictim.includes(move));

      return canThreaten;
    }
    else if (pieceType === 'Raven') {
      // Ravens capture via MOBBING: active Raven moves cross-face + passive Raven = sandwich
      // Check if Raven can move to create a mobbing configuration with victim

      const attackerFace = attackerPosition[0];

      // Get all possible Raven moves
      const ravenMoves = getAllRavenMoves(attackerPosition, piecePositions, attackerPiece);

      // Filter to cross-face moves only (mobbing requires cross-face)
      const crossFaceMoves = ravenMoves.filter(move => move[0] !== attackerFace);

      // For each cross-face move, check if there's a passive Raven that creates valid mob
      for (const ravenMove of crossFaceMoves) {
        // Look for passive Ravens (any Raven that's not the attacker, INCLUDING OTHER TEAMS!)
        for (const [passiveName, passivePos] of Object.entries(piecePositions)) {
          if (!passiveName.endsWith('Raven')) continue;
          if (passiveName === attackerPiece || passivePos === 'captured') continue;

          // Check if active Raven at ravenMove + passive Raven + victim = valid mob
          if (isValidMobbingConfiguration(ravenMove, passivePos, victimSquare)) {
            if (this.evalLogging) console.log(`   ✅ MOBBING THREAT: ${attackerPiece} → ${ravenMove} + passive ${passiveName} at ${passivePos} can mob ${victimSquare}`);
            return true; // Raven can mob the victim from this position
          }
        }
      }

      return false; // No mobbing configuration found
    }

    return false;
  }

  // EN PRISE DETECTION: Check if opponent piece can MOVE to threaten my piece
  // This is essential for depth-1 AI to avoid moving into positions where piece can be captured
  canPieceMoveToThreaten(oppPiece, myPiece, gameState = null) {
    const state = gameState || this.gameState;

    // Rule 15: an Owl on a black square is immune to Kites and Ravens, so they
    // can never move to threaten it (the generic path below also routes through
    // canPieceCaptureAtSquare, but the Kite fast-path needs this guard too).
    if ((oppPiece.type === 'Kite' || oppPiece.type === 'Raven') &&
        myPiece.type === 'Owl' && this.isBlackSquare(myPiece.position)) {
      return false;
    }

    // SPECIAL CASE FOR KITES: They capture DURING their move, not after
    // Check if Kite can move to a cross-face square adjacent to victim (1-move capture)
    if (oppPiece.type === 'Kite') {
      const oppFace = oppPiece.position[0];
      const victimFace = myPiece.position[0];

      // Can't swoop capture on same face
      if (oppFace === victimFace) return false;

      const possibleMoves = this.getPossibleMoves(oppPiece, state);
      const adjacentToVictim = this.getAdjacentSquares(myPiece.position);

      // Check if Kite can move to a cross-face square adjacent to victim
      const crossFaceMoves = possibleMoves.filter(move => move[0] !== oppFace);
      return crossFaceMoves.some(move => adjacentToVictim.includes(move));
    }

    // For other pieces: Check if they can move somewhere and THEN threaten
    const possibleMoves = this.getPossibleMoves(oppPiece, state);

    for (const targetSquare of possibleMoves) {
      // Simulate opponent moving to this square
      const hypotheticalState = this.simulateMove(
        state.piecePositions || state,
        oppPiece.name,
        targetSquare
      );

      // Check if opponent can capture my piece from this new position
      const canCaptureFromHere = this.canPieceCaptureAtSquare(
        oppPiece.name,
        targetSquare,
        myPiece.position,
        { piecePositions: hypotheticalState }
      );

      if (canCaptureFromHere) {
        // En prise detected (logging disabled)
        return true;
      }
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

  // Ghost-opportunity heuristic.
  // Looks at every legal move the Owl currently has (orthogonal steps AND ghost
  // pivots, already shadow-filtered by getPossibleMoves) and finds the closest
  // it can get to the nest in a single move. A normal orthogonal step can only
  // close the gap by one square, so any extra progress is a "ghost shortcut" —
  // the payoff of a crosspiece being cross-adjacent to the Owl. Returning that
  // shortcut (in saved flightway-distance squares) lets the evaluation reward
  // setting up ghosting plays a move before the Owl actually pivots.
  bestGhostAdvancement(owlName, owlPosition, baseDistance, gameState) {
    if (baseDistance <= 1) return 0; // already at/next to the nest — nothing to set up

    const owlMoves = this.getPossibleMoves(
      { name: owlName, position: owlPosition, type: 'Owl' },
      gameState
    );
    if (!owlMoves || owlMoves.length === 0) return 0;

    let bestNextDistance = baseDistance;
    for (const move of owlMoves) {
      const d = this.calculateDistanceToNearestNest(move);
      if (d < bestNextDistance) bestNextDistance = d;
    }

    // A single orthogonal step can reach at best (baseDistance - 1); anything
    // beyond that is only possible by ghosting.
    return Math.max(0, (baseDistance - 1) - bestNextDistance);
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
