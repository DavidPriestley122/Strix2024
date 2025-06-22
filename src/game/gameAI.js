import { Vector3 } from "@babylonjs/core";
import { AIPlayer } from "../ai/aiPlayer.js";
import { validateOwlMove } from "./rules/owlRules.js";
import { validateKiteMove } from "./rules/kiteRules.js";
import { validateRavenMove, isValidMobbingConfiguration } from "./rules/ravenRules.js";

// Make them globally available for console testing
import {
  checkCrossAdjacency,
  calculateSimpleGhostingDestination,
  testGhosting,
} from "./rules/flightwayUtils.js";
window.checkCrossAdjacency = checkCrossAdjacency;
window.calculateSimpleGhostingDestination = calculateSimpleGhostingDestination;
window.testGhosting = testGhosting;

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

  // Helper function for Raven mobbing opportunities
  function findRavenMobbingOpportunities(ravenPosition, piecePositions, movingRavenName) {
    const opportunities = [];
    
    // Find all Ravens that could serve as passive partners
    const allRavens = Object.entries(piecePositions).filter(([name, pos]) => 
      name.endsWith('Raven') && 
      pos !== "captured" && 
      name !== movingRavenName
    );
    
    // For each potential passive Raven, find what can be mobbed
    for (const [passiveRavenName, passiveRavenPos] of allRavens) {
      // Find all pieces that could be mobbed by this Raven pair
      const mobbableVictims = findMobbableVictims(ravenPosition, passiveRavenPos, piecePositions, movingRavenName);
      
      if (mobbableVictims.length > 0) {
        // Group all victims for this passive Raven
        opportunities.push({
          passiveRaven: passiveRavenName,
          victims: mobbableVictims
        });
      }
    }
    
    return opportunities;
  }

  function findMobbableVictims(attackingRavenPos, passiveRavenPos, piecePositions, movingRavenName) {
    const victims = [];
    
    // Check each piece to see if it can be mobbed by this Raven pair
    for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
      if (piecePos === "captured" || pieceName === movingRavenName) continue;
      
      // Don't mob teammates (same color)
      const attackingColor = movingRavenName.split(/(?=[A-Z])/)[0];
      const victimColor = pieceName.split(/(?=[A-Z])/)[0];
      
      if (attackingColor === victimColor) continue;
      
      // Check if this piece can be mobbed by the Raven pair
      if (isValidMobbingConfiguration(attackingRavenPos, passiveRavenPos, piecePos)) {
        victims.push({
          name: pieceName,
          position: piecePos
        });
      }
    }
    
    return victims;
  }


  // Create AI players for each color
  const aiPlayers = {
    brown: new AIPlayer('brown', gameStateManager, null), // Will set moveExecutor after creation
    yellow: new AIPlayer('yellow', gameStateManager, null),
    green: new AIPlayer('green', gameStateManager, null)
  };

  const aiSystem = {
    gameState: gameStateManager,
    aiPlayers: aiPlayers,

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
        
        this.executeAIMove(playerColor);
      }, 2000);
    },

    executeAIMove: function (playerColor) {
      const aiPlayer = this.aiPlayers[playerColor];
      if (!aiPlayer) {
        console.log(`❌ No AI player found for color: ${playerColor}`);
        return;
      }

      // Let the AI player decide on a move
      const selectedMove = aiPlayer.selectMove();
      
      if (!selectedMove) {
        console.log(`❌ AI could not select a move for ${playerColor}`);
        return;
      }

      // Execute the move using our mechanics
      const piece = scene.getMeshByName(selectedMove.piece.name);
      const targetSquare = scene.getMeshByName(selectedMove.targetSquare);
      
      if (piece && targetSquare) {
        // console.log(`🤖 AI executing: ${piece.name} to ${targetSquare.name}`); // Mechanistic logging - disabled
        this.executeMoveDirectly(piece, targetSquare);
      } else {
        console.log(`❌ Could not find piece or target square for AI move`);
      }
    },

    // Set strategy for a specific AI player
    setAIStrategy: function (playerColor, strategy) {
      const aiPlayer = this.aiPlayers[playerColor];
      if (aiPlayer) {
        aiPlayer.setStrategy(strategy);
      }
    },

    // Set strategy for all AI players
    setAllAIStrategies: function (strategy) {
      for (const playerColor in this.aiPlayers) {
        this.aiPlayers[playerColor].setStrategy(strategy);
      }
    },

    // Get AI player for external access
    getAIPlayer: function (playerColor) {
      return this.aiPlayers[playerColor];
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
          // console.log(`🦉 CAPTURE: ${piece.name} captures ${capturedPiece} at ${targetSquare.name}`); // Mechanistic logging - disabled
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
              // console.log(`🦅 Cross-face Kite move confirmed: ${oldPosition}(${startFace}) → ${targetSquare.name}(${endFace})`); // Mechanistic logging - disabled
              // Check if this Kite move can capture adjacent pieces
              const adjacentSquares = getAdjacentSquaresForCapture(targetSquare.name);
              
              for (const adjSquare of adjacentSquares) {
                const occupyingPiece = findPieceAtSquareForCapture(adjSquare, gameStateManager.piecePositions);
                
                if (occupyingPiece) {
                  // Check if it's an opponent piece
                  const kitePieceColor = piece.name.split(/(?=[A-Z])/)[0];
                  const occupyingPieceColor = occupyingPiece.split(/(?=[A-Z])/)[0];
                  
                  if (kitePieceColor !== occupyingPieceColor) {
                    // console.log(`🦅 KITE CAPTURE AFTER LANDING: ${piece.name} at ${targetSquare.name} captures ${occupyingPiece} at ${adjSquare}`); // Mechanistic logging - disabled
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
              // console.log(`🦅 Same-face Kite move: ${oldPosition}(${startFace}) → ${targetSquare.name}(${endFace}) - no capture allowed`); // Mechanistic logging - disabled
            }
          }
          
          // Handle Raven mobbing AFTER the move (different from Owl captures)
          let capturedByRaven = [];
          if (piece.name.includes('Raven')) {
            // First verify this was a cross-face move (required for Raven mobbing)
            const startFace = oldPosition[0];
            const endFace = targetSquare.name[0];
            
            if (startFace !== endFace) {
              // console.log(`🐦 Cross-face Raven move confirmed: ${oldPosition}(${startFace}) → ${targetSquare.name}(${endFace})`); // Mechanistic logging - disabled
              
              // Check if this Raven can now mob any pieces
              const mobbingOpportunities = findRavenMobbingOpportunities(targetSquare.name, gameStateManager.piecePositions, piece.name);
              
              for (const opportunity of mobbingOpportunities) {
                // Handle multiple victims per opportunity
                for (const victim of opportunity.victims) {
                  // console.log(`🐦 RAVEN MOBBING: ${piece.name} at ${targetSquare.name} mobs ${victim.name} with help from ${opportunity.passiveRaven}`); // Mechanistic logging - disabled
                  capturedByRaven.push(victim.name);
                  
                  // Move captured piece to OwlHalla
                  gameStateManager.piecePositions[victim.name] = "captured";
                
                  const capturedMesh = scene.getMeshByName(victim.name);
                  if (capturedMesh) {
                    const owlHallaCubeName = getOwlHallaCubeName(victim.name);
                    const owlHallaPosition = getPositionFromOwlHallaCubeName(owlHallaCubeName);
                    
                    if (victim.name.startsWith("brown")) {
                      owlHallaPosition.y += 3.5;
                    } else if (victim.name.startsWith("yellow")) {
                      owlHallaPosition.x += 3.5;
                    } else if (victim.name.startsWith("green")) {
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
                    gameFunctions.updatePiecesArrivingOnOwlHalla(victim.name);
                    
                    gameStateManager.recordCapture(victim.name, victim.position);
                  }
                }
              }
            } else {
              // console.log(`🐦 Same-face Raven move: ${oldPosition}(${startFace}) → ${targetSquare.name}(${endFace}) - no mobbing allowed`); // Mechanistic logging - disabled
            }
          }
          
          // Add move to history after animation completes (this will check winning conditions)
          const allCapturedPieces = [capturedPiece, capturedByKite, ...capturedByRaven].filter(Boolean);
          const capturedPieceForHistory = allCapturedPieces.length > 0 ? allCapturedPieces[0] : null;
          
          gameStateManager.addMoveToHistory(
            piece.name,
            oldPosition,
            targetSquare.name,
            capturedPieceForHistory
          );
          
          // Debug: Log remaining Owls after move
          const remainingOwls = Object.keys(gameStateManager.piecePositions).filter(
            (p) => p.endsWith("Owl") && gameStateManager.piecePositions[p] !== "captured"
          );
          // console.log(`🦉 After move: ${remainingOwls.length} Owls remaining:`, remainingOwls); // Mechanistic logging - disabled
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
      // Enable logging for critical winning moves
      const isWinningMove = pieceName.includes('Owl') && ['b7-7', 'y7-7', 'g7-7'].includes(targetSquare);
      // if (isWinningMove) console.log(`🔍 VALIDATING WINNING MOVE: ${pieceName} to ${targetSquare}`); // Disabled to reduce noise
      // console.log(`🎯 Validating move: ${pieceName} to ${targetSquare}`); // Mechanistic logging - disabled
      const currentPos = this.gameState.piecePositions[pieceName];

      const moveCoords = targetSquare.substring(1).split("-");
      const moveRow = parseInt(moveCoords[0]);
      const moveCol = parseInt(moveCoords[1]);

      // Check bounds
      if (moveRow < 1 || moveRow > 7 || moveCol < 1 || moveCol > 7) {
        if (isWinningMove) console.log(`❌ BOUNDS CHECK FAILED: ${targetSquare} out of bounds`);
        return false;
      }

      // Check not occupied (unless it's an Owl capturing an opponent piece)
      const isOccupied = Object.values(
        this.gameState.piecePositions || {}
      ).includes(targetSquare);
      // console.log(`🔍 Checking ${targetSquare} - occupied: ${isOccupied}`); // Mechanistic logging - disabled
      
      if (isOccupied) {
        if (isWinningMove) console.log(`🔍 OCCUPATION CHECK: ${targetSquare} is occupied`);
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
              if (isWinningMove) console.log(`✅ CAPTURE ALLOWED: ${pieceName} can capture ${occupyingPieceName} at ${targetSquare}`);
              // This is a valid capture - skip the normal occupation check
            } else {
              if (isWinningMove) console.log(`❌ OCCUPATION BLOCKED: ${targetSquare} occupied by own piece ${occupyingPieceName}`);
              return false;
            }
          } else {
            if (isWinningMove) console.log(`❌ OCCUPATION BLOCKED: ${targetSquare} is occupied (unknown piece)`);
            return false;
          }
        } else {
          if (isWinningMove) console.log(`❌ OCCUPATION BLOCKED: Non-owl piece can't move to occupied square`);
          return false;
        }
      }

      // Check not nest (except for owls)
      if (targetSquare.endsWith("7-7") && !pieceName.includes("Owl")) {
        // console.log(`❌ NEST BLOCK: ${pieceName} attempted to enter nest square ${targetSquare}`); // Mechanistic logging - disabled
        return false;
      }

      // Check not shadowed
      if (isWinningMove) console.log(`🔍 SHADOW CHECK: Updating shadows excluding ${pieceName}`);
      this.gameState.updateShadowedRows(pieceName);
      for (const color in this.gameState.shadowedRows) {
        const shadowedCubes = this.gameState.shadowedRows[color];
        if (shadowedCubes.includes(targetSquare)) {
          if (isWinningMove) console.log(`❌ SHADOW BLOCKED: ${targetSquare} is shadowed by ${color} - shadows: ${shadowedCubes.slice(0,3).join(', ')}...`);
          return false;
        }
      }
      // console.log(`✅ Shadow check passed for ${targetSquare}`); // Mechanistic logging - disabled

      // Validate piece-specific rules
      if (pieceName.includes("Owl")) {
        const owlResult = validateOwlMove(
          currentPos,
          targetSquare,
          this.gameState.piecePositions,
          pieceName
        );
        if (isWinningMove) console.log(`🔍 OWL RULE VALIDATION: ${pieceName} → ${targetSquare} result: ${owlResult}`);
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

  // Set the moveExecutor reference for all AI players
  for (const playerColor in aiPlayers) {
    aiPlayers[playerColor].moveExecutor = aiSystem;
  }

  return aiSystem;
}
