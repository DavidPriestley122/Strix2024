import {
  checkCrossAdjacency,
  calculateSimpleGhostingDestination,
} from "./rules/flightwayUtils.js";

import { Vector3 } from "@babylonjs/core";

// Make them globally available for console testing
window.checkCrossAdjacency = checkCrossAdjacency;
window.calculateSimpleGhostingDestination = calculateSimpleGhostingDestination;

import {
  validateOwlMove,
  getAllOwlMoves,
  getAdjacentSquares,
} from "./rules/owlRules.js";
import { validateKiteMove, getAllKiteMoves } from "./rules/kiteRules.js";
import { validateRavenMove, getAllRavenMoves } from "./rules/ravenRules.js";

export function createAI(scene, gameStateManager, gameFunctions) {
  // Helper functions for owlHalla management
  function getOwlHallaCubeName(pieceName) {
    const owlHallaCubeNames = {
      brownOwl: "b7--1",
      brownKite: "b6--1",
      brownRaven: "b5--1",
      yellowOwl: "y7--1",
      yellowKite: "y6--1",
      yellowRaven: "y5--1",
      greenOwl: "g7--1",
      greenKite: "g6--1",
      greenRaven: "g5--1",
    };
    return owlHallaCubeNames[pieceName];
  }

  function getPositionFromOwlHallaCubeName(cubeName) {
    const cube = scene.getMeshByName(cubeName);
    if (cube) {
      return cube.position.clone();
    }
    return new Vector3(0, 0, 0);
  }

  // Helper functions for Kite captures
  function getAdjacentSquaresForCapture(square) {
    const face = square[0];
    const coords = square.substring(1).split("-");
    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);
    
    const adjacent = [];
    const directions = [
      [0, 1], [0, -1], [1, 0], [-1, 0]  // right, left, down, up
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

  function findPieceAtSquareForCapture(square, piecePositions) {
    for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
      if (piecePos === square && piecePos !== "captured") {
        return pieceName;
      }
    }
    return null;
  }

  return {
    gameState: gameStateManager,

    makeMove: function (playerColor) {
      setTimeout(() => {
        if (!this.gameState.aiGameRunning || this.gameState.aiGamePaused) {
          return;
        }
        
        // Check if game is over before making a move
        if (this.gameState.gameOver) {
          console.log(`🏁 Game is over - AI stopping`);
          return;
        }
        
        this.executeSimpleMove(playerColor);
      }, 2000);
    },

    executeSimpleMove: function (playerColor) {
      // Find all pieces belonging to this player
      const playerPieces = scene.meshes.filter(
        (mesh) =>
          mesh.name.startsWith(playerColor) &&
          (mesh.name.endsWith("Owl") ||
            mesh.name.endsWith("Kite") ||
            mesh.name.endsWith("Raven"))
      );

      if (playerPieces.length === 0) {
        return;
      }

      // Collect all pieces with valid moves, then pick randomly
      const piecesWithMoves = [];
      let pieceToMove = null;
      let targetSquare = null;

      // Check all pieces for valid moves
      const shuffledPieces = [...playerPieces].sort(() => Math.random() - 0.5);
      
      for (let piece of shuffledPieces) {
        const currentPos = this.gameState.piecePositions[piece.name];
        let allPossibleMoves = [];
        
        // Get moves based on piece type
        if (piece.name.includes('Owl')) {
          allPossibleMoves = getAllOwlMoves(currentPos, this.gameState.piecePositions, piece.name);
          console.log(`📋 ${piece.name} at ${currentPos} - getAllOwlMoves returned:`, allPossibleMoves);
        } else if (piece.name.includes('Kite')) {
          allPossibleMoves = getAllKiteMoves(currentPos, this.gameState.piecePositions, piece.name);
        } else if (piece.name.includes('Raven')) {
          allPossibleMoves = getAllRavenMoves(currentPos, this.gameState.piecePositions, piece.name);
        }
        
        // Filter through validation
        const allValidMoves = allPossibleMoves.filter((move) =>
          this.isValidMove(move, piece.name)
        );
        
        console.log(`✅ ${piece.name} valid moves:`, allValidMoves);
        
        // Check if any valid moves include nest squares (debugging)
        const nestMoves = allValidMoves.filter(move => move.endsWith('7-7'));
        if (nestMoves.length > 0 && !piece.name.includes('Owl')) {
          console.log(`🚨 BUG: Non-Owl ${piece.name} has nest moves that passed validation:`, nestMoves);
        }
        
        if (allValidMoves.length > 0) {
          // Add this piece and its moves to the collection
          piecesWithMoves.push({
            piece: piece,
            moves: allValidMoves
          });
        }
      }

      // Pick a random piece from those that have moves
      if (piecesWithMoves.length > 0) {
        const randomChoice = piecesWithMoves[Math.floor(Math.random() * piecesWithMoves.length)];
        pieceToMove = randomChoice.piece;
        const validMoves = randomChoice.moves;
        
        // Pick a random move for the chosen piece
        const chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        targetSquare = scene.meshes.find((mesh) => mesh.name === chosenMove);
        
        console.log(`🎲 Randomly selected ${pieceToMove.name} with move to ${chosenMove}`);
      }

      if (!pieceToMove || !targetSquare) {
        console.log(`No valid moves found for ${playerColor}`);
        return;
      }

      console.log(`AI moving ${pieceToMove.name} to ${targetSquare.name}`);
      this.executeMoveDirectly(pieceToMove, targetSquare);
    },

    executeMoveDirectly: function (piece, targetSquare) {
      const oldPosition = this.gameState.piecePositions[piece.name];
      
      // Check for capture BEFORE moving the piece (for Owls only)
      let capturedPiece = null;
      if (piece.name.includes('Owl')) {
        // Find if there's a piece at the destination square
        for (const [pieceName, piecePos] of Object.entries(this.gameState.piecePositions)) {
          if (piecePos === targetSquare.name && pieceName !== piece.name) {
            capturedPiece = pieceName;
            break;
          }
        }
        
        // If we found a captured piece, remove it from the board immediately
        if (capturedPiece) {
          console.log(`🦉 CAPTURE: ${piece.name} captures ${capturedPiece} at ${targetSquare.name}`);
          this.gameState.piecePositions[capturedPiece] = "captured";
          
          // Move the captured piece to owlHalla visually (immediately)
          const capturedMesh = scene.getMeshByName(capturedPiece);
          if (capturedMesh) {
            // Get the owlHalla position for this piece
            const owlHallaCubeName = getOwlHallaCubeName(capturedPiece);
            const owlHallaPosition = getPositionFromOwlHallaCubeName(owlHallaCubeName);
            
            // Apply offset based on piece color
            if (capturedPiece.startsWith("brown")) {
              owlHallaPosition.y += 3.5;
            } else if (capturedPiece.startsWith("yellow")) {
              owlHallaPosition.x += 3.5;
            } else if (capturedPiece.startsWith("green")) {
              owlHallaPosition.z += 3.5;
            }
            
            capturedMesh.position = owlHallaPosition;
            
            // Set proper rotation to match owlHalla cube
            const owlHallaCube = scene.getMeshByName(owlHallaCubeName);
            if (owlHallaCube) {
              capturedMesh.rotation = owlHallaCube.rotation.clone();
            }
            
            capturedMesh.visibility = false; // owlHalla pieces are initially invisible
            
            // Register piece in owlHalla tracking system
            gameFunctions.updatePiecesArrivingOnOwlHalla(capturedPiece);
            
            // Record the capture
            this.gameState.recordCapture(capturedPiece, targetSquare.name);
          }
        }
      }

      // Now move the piece to the target square
      this.gameState.piecePositions[piece.name] = targetSquare.name;

      // Calculate position and rotation from the target square
      const targetPosition = targetSquare.position.clone();
      const targetRotation = targetSquare.rotation.clone();

      // Add the offset based on which board the square is on
      if (targetSquare.name.startsWith("b")) {
        targetPosition.y += 3.75;
      } else if (targetSquare.name.startsWith("y")) {
        targetPosition.x += 3.75;
      } else if (targetSquare.name.startsWith("g")) {
        targetPosition.z += 3.75;
      }

      // Execute the move animation
      gameFunctions.animatePieceMovement(
        piece,
        targetPosition,
        targetRotation,
        30,
        function () {
          // Handle Kite captures AFTER the move (different from Owl captures)
          let capturedByKite = null;
          if (piece.name.includes('Kite')) {
            // First verify this was a cross-face move (required for Kite captures)
            const startFace = oldPosition[0];
            const endFace = targetSquare.name[0];
            
            if (startFace !== endFace) {
              console.log(`🦅 Cross-face Kite move confirmed: ${oldPosition}(${startFace}) → ${targetSquare.name}(${endFace})`);
              // Check if this Kite move can capture adjacent pieces
              const adjacentSquares = getAdjacentSquaresForCapture(targetSquare.name);
              
              for (const adjSquare of adjacentSquares) {
                const occupyingPiece = findPieceAtSquareForCapture(adjSquare, gameStateManager.piecePositions);
                
                if (occupyingPiece) {
                  // Check if it's an opponent piece
                  const kitePieceColor = piece.name.split(/(?=[A-Z])/)[0];
                  const occupyingPieceColor = occupyingPiece.split(/(?=[A-Z])/)[0];
                  
                  if (kitePieceColor !== occupyingPieceColor) {
                    console.log(`🦅 KITE CAPTURE AFTER LANDING: ${piece.name} at ${targetSquare.name} captures ${occupyingPiece} at ${adjSquare}`);
                    capturedByKite = occupyingPiece;
                    
                    // Move captured piece to OwlHalla
                    gameStateManager.piecePositions[capturedByKite] = "captured";
                    
                    const capturedMesh = scene.getMeshByName(capturedByKite);
                    if (capturedMesh) {
                      const owlHallaCubeName = getOwlHallaCubeName(capturedByKite);
                      const owlHallaPosition = getPositionFromOwlHallaCubeName(owlHallaCubeName);
                      
                      if (capturedByKite.startsWith("brown")) {
                        owlHallaPosition.y += 3.5;
                      } else if (capturedByKite.startsWith("yellow")) {
                        owlHallaPosition.x += 3.5;
                      } else if (capturedByKite.startsWith("green")) {
                        owlHallaPosition.z += 3.5;
                      }
                      
                      capturedMesh.position = owlHallaPosition;
                      
                      // Set proper rotation to match owlHalla cube
                      const owlHallaCube = scene.getMeshByName(owlHallaCubeName);
                      if (owlHallaCube) {
                        capturedMesh.rotation = owlHallaCube.rotation.clone();
                      }
                      
                      capturedMesh.visibility = false;
                      
                      // Register piece in owlHalla tracking system
                      gameFunctions.updatePiecesArrivingOnOwlHalla(capturedByKite);
                      
                      gameStateManager.recordCapture(capturedByKite, adjSquare);
                    }
                    break; // Only capture one piece per move
                  }
                }
              }
            } else {
              console.log(`🦅 Same-face Kite move: ${oldPosition}(${startFace}) → ${targetSquare.name}(${endFace}) - no capture allowed`);
            }
          }
          
          // Add move to history after animation completes (this will check winning conditions)
          gameStateManager.addMoveToHistory(
            piece.name,
            oldPosition,
            targetSquare.name,
            capturedPiece || capturedByKite
          );
          
          // Debug: Log remaining Owls after move
          const remainingOwls = Object.keys(gameStateManager.piecePositions).filter(
            (p) => p.endsWith("Owl") && gameStateManager.piecePositions[p] !== "captured"
          );
          console.log(`🦉 After move: ${remainingOwls.length} Owls remaining:`, remainingOwls);
        }
      );
    },

    // Find moves along the 2 orthogonal routes from current position
    findOrthogonalMoves: function (currentPos, pieceName) {
      if (!currentPos) return [];

      const face = currentPos[0];
      const coords = currentPos.substring(1).split("-");
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);

      const possibleMoves = [];

      // Route 1: Fixed row, varying column (crosses faces via row edges)
      const route1 = this.generateRoute(face, row, "row");

      // Route 2: Fixed column, varying row (crosses faces via column edges)
      const route2 = this.generateRoute(face, col, "column");

      // Combine both routes, excluding current position
      const allRouteSquares = [...route1, ...route2].filter(
        (square) => square !== currentPos
      );

      // Filter for valid moves
      for (const square of allRouteSquares) {
        if (this.isValidMove(square, pieceName)) {
          possibleMoves.push(square);
        }
      }

      return possibleMoves;
    },

    // Generate a complete 14-square route
    generateRoute: function (startFace, lineNumber, lineType) {
      const route = [];

      if (lineType === "row") {
        // Fixed row route: crosses via row=7 edges
        // Generate squares on starting face
        for (let col = 1; col <= 7; col++) {
          route.push(`${startFace}${lineNumber}-${col}`);
        }

        // Cross to next face: Brown row→Green, Yellow row→Brown, Green row→Yellow
        const nextFace = this.getRowCrossFace(startFace);
        for (let col = 7; col >= 1; col--) {
          route.push(`${nextFace}${col}-${lineNumber}`);
        }
      } else {
        // Fixed column route: crosses via col=7 edges
        // Generate squares on starting face
        for (let row = 1; row <= 7; row++) {
          route.push(`${startFace}${row}-${lineNumber}`);
        }

        // Cross to next face: Brown col→Yellow, Yellow col→Green, Green col→Brown
        const nextFace = this.getColCrossFace(startFace);
        for (let col = 7; col >= 1; col--) {
          route.push(`${nextFace}${lineNumber}-${col}`);
        }
      }

      return route;
    },

    getRowCrossFace: function (face) {
      // Row flightways: Brown→Green, Yellow→Brown, Green→Yellow
      const rowCrossing = { b: "g", y: "b", g: "y" };
      return rowCrossing[face];
    },

    getColCrossFace: function (face) {
      // Column flightways: Brown→Yellow, Yellow→Green, Green→Brown
      const colCrossing = { b: "y", y: "g", g: "b" };
      return colCrossing[face];
    },

    // Check if a move is valid
    isValidMove: function (targetSquare, pieceName) {
      console.log(`🎯 Validating move: ${pieceName} to ${targetSquare}`);
      const currentPos = this.gameState.piecePositions[pieceName];

      const moveCoords = targetSquare.substring(1).split("-");
      const moveRow = parseInt(moveCoords[0]);
      const moveCol = parseInt(moveCoords[1]);

      // Check bounds
      if (moveRow < 1 || moveRow > 7 || moveCol < 1 || moveCol > 7) {
        return false;
      }

      // Check not occupied (unless it's an Owl capturing an opponent piece)
      const isOccupied = Object.values(
        this.gameState.piecePositions || {}
      ).includes(targetSquare);
      console.log(`🔍 Checking ${targetSquare} - occupied: ${isOccupied}`);
      
      if (isOccupied) {
        // For Owls, allow moves to occupied squares if they contain opponent pieces
        if (pieceName.includes('Owl')) {
          const occupyingPiece = Object.entries(this.gameState.piecePositions).find(
            ([pieceNameEntry, piecePos]) => piecePos === targetSquare && pieceNameEntry !== pieceName
          );
          if (occupyingPiece) {
            const [occupyingPieceName] = occupyingPiece;
            const movingPieceColor = pieceName.split(/(?=[A-Z])/)[0];
            const occupyingPieceColor = occupyingPieceName.split(/(?=[A-Z])/)[0];
            
            if (movingPieceColor !== occupyingPieceColor) {
              console.log(`✅ Owl capture allowed - ${pieceName} can capture ${occupyingPieceName} at ${targetSquare}`);
              // This is a valid capture - skip the normal occupation check
            } else {
              console.log(`❌ Move blocked - ${targetSquare} occupied by own piece ${occupyingPieceName}`);
              return false;
            }
          } else {
            console.log(`❌ Move blocked - ${targetSquare} is occupied`);
            return false;
          }
        } else {
          console.log(`❌ Move blocked - ${targetSquare} is occupied`);
          return false;
        }
      }

      // Check not nest (except for owls)
      if (targetSquare.endsWith("7-7") && !pieceName.includes("Owl")) {
        console.log(`❌ NEST BLOCK: ${pieceName} attempted to enter nest square ${targetSquare}`);
        return false;
      }

      // Check not shadowed
      this.gameState.updateShadowedRows(pieceName);
      for (const color in this.gameState.shadowedRows) {
        const shadowedCubes = this.gameState.shadowedRows[color];
        if (shadowedCubes.includes(targetSquare)) {
          console.log(`❌ Move blocked - ${targetSquare} is shadowed by ${color}`);
          return false;
        }
      }
      console.log(`✅ Shadow check passed for ${targetSquare}`);

      // Validate piece-specific rules
      if (pieceName.includes("Owl")) {
        const owlResult = validateOwlMove(
          currentPos,
          targetSquare,
          this.gameState.piecePositions,
          pieceName
        );
        console.log(`✅ Owl rule validation for ${targetSquare}: ${owlResult}`);
        return owlResult;
      } else if (pieceName.includes("Kite")) {
        return validateKiteMove(
          currentPos,
          targetSquare,
          this.gameState.piecePositions
        );
      } else if (pieceName.includes("Raven")) {
        return validateRavenMove(
          currentPos,
          targetSquare,
          this.gameState.piecePositions
        );
      }

      return false;
    },
  };
}
