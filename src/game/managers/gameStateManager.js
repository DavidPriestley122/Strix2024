//IMPORT STATEMENTS

import {
  AdvancedDynamicTexture,
  TextBlock,
  Rectangle,
  Control,
  ScrollViewer,
  TextWrapping,
  Button,
  InputText,
  StackPanel,
} from "@babylonjs/gui";

import { moveNotation } from "../rules/moveNotation.js";
import { Vector3 } from "@babylonjs/core";
import { createCaptureManager } from "./captureManager.js";
import { createMoveHistoryManager } from "./moveHistoryManager.js";
import { createUIManager } from "./uiManager.js";
import { createInputManager } from "./inputManager.js";
import { createGameExportManager } from "./gameExportManager.js";
import { createGameImportManager } from "./gameImportManager.js";

//GUI CREATION FUNCTION
export function createGUI() {
  const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

  //INFO TEXT CREATION
  const infoText = new TextBlock();
  infoText.text = "";
  infoText.color = "white";
  infoText.fontSize = 24;
  infoText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  infoText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  infoText.top = "20px";
  infoText.left = "20px";
  infoText.isVisible = true;
  advancedTexture.addControl(infoText);

  //MESSAGE DISPLAY CREATION
  const messageRect = new Rectangle("messageRect");
  messageRect.width = "40%";
  messageRect.height = "20%";
  messageRect.cornerRadius = 20;
  messageRect.color = "white";
  messageRect.thickness = 4;
  messageRect.background = "rgba(0, 0, 0, 0.7)";
  messageRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
  messageRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  messageRect.top = "20px";
  messageRect.right = "20px";
  messageRect.isVisible = false;
  advancedTexture.addControl(messageRect);

  const messageText = new TextBlock("messageText");
  messageText.text = "";
  messageText.color = "white";
  messageText.fontSize = 24;
  messageText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  messageText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  messageText.resizeToFit = true;
  messageText.textWrapping = TextWrapping.WordWrap;
  messageText.paddingLeft = "5%";
  messageText.paddingRight = "5%";
  messageRect.addControl(messageText);

  //CAPTURE TIMER DISPLAY CREATION
  const captureTimerText = new TextBlock("captureTimerText");
  captureTimerText.text = "";
  captureTimerText.color = "orange";
  captureTimerText.fontSize = 28;
  captureTimerText.fontWeight = "bold";
  captureTimerText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  captureTimerText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  captureTimerText.top = "80px";
  captureTimerText.isVisible = false;
  advancedTexture.addControl(captureTimerText);

  //SIMPLE MOVE HISTORY DISPLAY (for compatibility)
  const moveHistoryContainer = new Rectangle("moveHistoryContainer");
  moveHistoryContainer.width = "1px";
  moveHistoryContainer.height = "1px";
  moveHistoryContainer.isVisible = false;
  advancedTexture.addControl(moveHistoryContainer);

  const moveHistoryViewer = new ScrollViewer("moveHistoryViewer");
  moveHistoryViewer.width = "1px";
  moveHistoryViewer.height = "1px";
  moveHistoryViewer.isVisible = false;
  moveHistoryContainer.addControl(moveHistoryViewer);

  const moveHistoryText = new TextBlock("moveHistoryText");
  moveHistoryText.text = "";
  moveHistoryText.isVisible = false;
  moveHistoryViewer.addControl(moveHistoryText);

  return {
    advancedTexture,
    infoText,
    messageRect,
    messageText,
    captureTimerText,
    moveHistoryContainer,
    moveHistoryViewer,
    moveHistoryText,
  };
}

//GAME STATE MANAGER CREATION
export function createGameStateManager(guiElements, gameResetFunctions) {
  const { 
    moveHistoryViewer, 
    messageText, 
    messageRect, 
    advancedTexture, 
    captureTimerText 
  } = guiElements;

  // Store the reset functions for later use
  const resetFunctions = gameResetFunctions;
  const { scene, animatePieceMovement } = resetFunctions;

  let nextPlayerText = null; // Variable to store the reference to nextPlayerText control

  // Helper functions for 3D animation
  function findPieceInScene(pieceName) {
    console.log(`Looking for piece: ${pieceName}`);
    const piece = scene.meshes.find(mesh => mesh.name === pieceName);
    console.log(`Found piece:`, piece ? piece.name : 'NOT FOUND');
    return piece;
  }

  function findCubeInScene(squareNotation) {
    // Handle both formats: "b72" and "b7-2"
    let cubeName;
    if (squareNotation.includes('-')) {
      // Already in correct format
      cubeName = squareNotation;
    } else {
      // Convert notation from "b72" to "b7-2" format used in scene
      cubeName = squareNotation.slice(0, -1) + '-' + squareNotation.slice(-1);
    }
    console.log(`Looking for cube: ${squareNotation} -> ${cubeName}`);
    const cube = scene.meshes.find(mesh => mesh.name === cubeName);
    console.log(`Found cube:`, cube ? cube.name : 'NOT FOUND');
    return cube;
  }

  function calculateTargetPosition(cube) {
    let offsetVector;
    if (cube.name.startsWith("b")) {
      offsetVector = new Vector3(0, 3.75, 0);
    } else if (cube.name.startsWith("y")) {
      offsetVector = new Vector3(3.75, 0, 0);
    } else if (cube.name.startsWith("g")) {
      offsetVector = new Vector3(0, 0, 3.75);
    }
    
    return cube.position.clone().addInPlace(offsetVector);
  }

  function displayInfoMessage(message) {
    messageText.text = message;
    messageRect.isVisible = true;

    setTimeout(function () {
      messageRect.isVisible = false;
    }, 2000);
  }


  //GAME STATE OBJECT

  const gameStateManager = {
    piecePositions: {
      brownOwl: "b7-1",
      brownKite: "b6-2",
      brownRaven: "b5-3",
      yellowOwl: "y7-1",
      yellowKite: "y6-2",
      yellowRaven: "y5-3",
      greenOwl: "g7-1",
      greenKite: "g6-2",
      greenRaven: "g5-3",
    },

    // Note: Capture-related properties now managed by captureManager

    //GAME STATE UPDATE FUNCTIONS

    updateShadowedRows: function (excludedPiece) {
      // Reset shadowed rows
      this.shadowedRows = {
        b: [],
        y: [],
        g: [],
      };

      // Iterate through each piece
      for (let pieceName in this.piecePositions) {
        let piecePosition = this.piecePositions[pieceName];

        // Skip the excluded piece, pieces on owlHalla squares, and captured pieces
        if (pieceName === excludedPiece || piecePosition.includes("--") || piecePosition === "captured") {
          continue;
        }

        let boardColor = piecePosition.charAt(0);
        let row = parseInt(piecePosition.charAt(1));
        let column = parseInt(piecePosition.charAt(3));

        // Update shadowed rows and columns based on the current piece's position
        if (boardColor === "b") {
          // Generate shadowed rows for yellow board
          for (let i = 1; i <= 7; i++) {
            this.shadowedRows.y.push(`y${column}-${i}`);
          }
          // Generate shadowed columns for green board
          for (let i = 1; i <= 7; i++) {
            this.shadowedRows.g.push(`g${i}-${row}`);
          }
        } else if (boardColor === "y") {
          // Generate shadowed rows for brown board
          for (let i = 1; i <= 7; i++) {
            this.shadowedRows.b.push(`b${i}-${row}`);
          }
          // Generate shadowed columns for green board
          for (let i = 1; i <= 7; i++) {
            this.shadowedRows.g.push(`g${column}-${i}`);
          }
        } else if (boardColor === "g") {
          // Generate shadowed rows for brown board
          for (let i = 1; i <= 7; i++) {
            this.shadowedRows.b.push(`b${column}-${i}`);
          }
          // Generate shadowed rows for yellow board
          for (let i = 1; i <= 7; i++) {
            this.shadowedRows.y.push(`y${i}-${row}`);
          }
        }
      }
    },

    updatePiecePosition: function (pieceName, position) {
      this.piecePositions[pieceName] = position;
    },

    //MOVE HISTORY MANAGEMENT

    moveHistory: [],
    captureHistory: [],
    retractionHistory: [],
    lastMove: null,
    lastMovePiece: null,
    lastMoveDestination: null,
    gameOver: false,
    playerTypes: {
      brown: "human",
      yellow: "human",
      green: "human",
    },

    // addMoveToHistory - Moved to moveHistoryManager.js

    proceedToNextTurn: function() {
      // Don't proceed if game is over
      if (this.gameOver) {
        console.log("Game is over - not proceeding to next turn");
        return;
      }
      
      console.log("🔄 PROCEED TO NEXT TURN: Before advancing - knockedOutTeam =", this.knockedOutTeam);
      
      // Check for winning conditions using the last move data FIRST
      console.log("🏆 WIN CHECK: piece =", this.lastMovePiece, "destination =", this.lastMoveDestination);
      const winningMessage = this.checkWinningConditions(this.lastMovePiece, this.lastMoveDestination);
      console.log("🏆 WIN CHECK RESULT:", winningMessage);
      
      // Clear the stored move data after use
      this.lastMovePiece = null;
      this.lastMoveDestination = null;
      
      if (winningMessage) {
        this.moveHistory.push(winningMessage);
        this.gameOver = true;
        console.log("Game over detected in proceedToNextTurn:", winningMessage);
        
        // Finalize export manager
        if (this.gameExportManager && typeof this.gameExportManager.finalizeGame === 'function') {
          this.gameExportManager.finalizeGame();
        }
        
        this.updateGameOverDisplay(winningMessage);
        return;
      }
      
      // Only advance turn and update UI if game is not over
      this.updateNextPlayer();
      this.updateNextPlayerDisplay();
      
      // Save the complete post-move state for takeback (after all captures and turn advancement)
      this.savePostMoveState();
      
      // Trigger AI move with proper state validation
      this.triggerAIMoveIfNeeded();
    },

    // Save the complete post-move state for takeback functionality
    savePostMoveState: function() {
      // Update the last move in history with the complete post-move state
      if (this.moveHistory.length > 0) {
        const lastMove = this.moveHistory[this.moveHistory.length - 1];
        if (lastMove && typeof lastMove === 'object') {
          // Save the complete state AFTER the move is finished
          lastMove.postMoveState = {
            piecePositions: JSON.parse(JSON.stringify(this.piecePositions)),
            currentPlayer: this.currentPlayerTurn, // This is now the NEXT player to move
            captureHistory: JSON.parse(JSON.stringify(this.captureHistory)),
            knockedOutTeam: this.knockedOutTeam,
            isPlayAgainState: this.isPlayAgainState,
            gameOver: this.gameOver
          };
          console.log(`💾 POST-MOVE STATE: Saved complete state for move ${lastMove.moveNumber}`, lastMove.postMoveState);
        }
      }
    },

    // Note: Capture timer functions moved to captureManager.js

    // recordCapture - Moved to captureManager.js

    getNextPlayerColor: function (currentColor) {
      const colors = ["brown", "yellow", "green"];
      const currentIndex = colors.indexOf(currentColor);
      return colors[(currentIndex + 1) % 3];
    },

    revertToPreviousPlayer: function () {
      const teams = ["brown", "yellow", "green"];
      let currentIndex = teams.indexOf(this.currentPlayerTurn);
      let previousIndex;
      do {
        previousIndex = (currentIndex - 1 + teams.length) % teams.length;
        currentIndex = previousIndex;
      } while (teams[previousIndex] === this.knockedOutTeam);

      this.currentPlayerTurn = teams[previousIndex];
    },

    //PLAYER TURN MANAGEMENT

    knockedOutTeam: null,
    currentPlayerTurn: "brown",
    aiGameRunning: false,
    aiGamePaused: false,

    updateNextPlayer: function () {
      const teams = ["brown", "yellow", "green"];
      let currentIndex = teams.indexOf(this.currentPlayerTurn);
      let nextIndex = (currentIndex + 1) % teams.length;
      
      console.log("🔄 TURN ADVANCE DEBUG: Current player:", this.currentPlayerTurn, "knockedOutTeam:", this.knockedOutTeam);
      console.log("🔄 TURN ADVANCE: Next would be:", teams[nextIndex]);

      // Skip the knocked-out team if there is one
      if (teams[nextIndex] === this.knockedOutTeam) {
        console.log("🚫 SKIPPING knocked out team:", this.knockedOutTeam);
        nextIndex = (nextIndex + 1) % teams.length;
        console.log("🔄 AFTER SKIP: New next player:", teams[nextIndex]);
      }

      this.currentPlayerTurn = teams[nextIndex];
      console.log("🔄 TURN ADVANCE FINAL: New current player:", this.currentPlayerTurn);
    },

    reinstateTeam: function (piece) {
      if (
        piece.includes("Owl") &&
        this.knockedOutTeam === piece.split("Owl")[0]
      ) {
        this.knockedOutTeam = null;
      }
    },

    // Function to check if a player is AI
    isAIPlayer: function (playerColor) {
      return this.playerTypes[playerColor] === "computer";
    },

    // Functions to control AI game
    /*startAIGame: function () {
      this.aiGameRunning = true;
      this.aiGamePaused = false;
      console.log("AI game started");

      // Update button states
      document.getElementById("start-ai-game").disabled = true;
      document.getElementById("pause-game").disabled = false;
      document.getElementById("resume-game").disabled = true;

      // Trigger first AI move if it's an AI player's turn
      if (this.isAIPlayer(this.currentPlayerTurn)) {
        this.aiModule.makeMove(this.currentPlayerTurn);
      }
    },
*/
    startAIGame: function () {
      this.aiGameRunning = true;
      this.aiGamePaused = false;
      console.log("AI game started");

      // Debug: Check what player types are read
      this.updatePlayerTypes();
      console.log("Current player types:", JSON.stringify(this.playerTypes));
      console.log("Current player turn:", this.currentPlayerTurn);
      console.log(
        "Is current player AI?",
        this.isAIPlayer(this.currentPlayerTurn)
      );

      // Update button states
      document.getElementById("start-ai-game").disabled = true;
      document.getElementById("pause-game").disabled = false;
      document.getElementById("resume-game").disabled = true;

      // Start with first move if current player is AI
      this.triggerAIMoveIfNeeded();
    },

    pauseAIGame: function () {
      this.aiGamePaused = true;
      console.log("AI game paused");

      // Update button states
      document.getElementById("pause-game").disabled = true;
      document.getElementById("resume-game").disabled = false;
    },

    resumeAIGame: function () {
      this.aiGamePaused = false;
      console.log("AI game resumed");

      // Update button states
      document.getElementById("pause-game").disabled = false;
      document.getElementById("resume-game").disabled = true;

      // Continue with current player if AI
      if (this.isAIPlayer(this.currentPlayerTurn)) {
        this.aiModule.makeMove(this.currentPlayerTurn);
      }
    },

    resetGame: function () {
      this.aiGameRunning = false;
      this.aiGamePaused = false;
      console.log("Game reset");

      // Update button states
      document.getElementById("start-ai-game").disabled = false;
      document.getElementById("pause-game").disabled = true;
      document.getElementById("resume-game").disabled = true;

      //Reset pieces to starting positions

      this.currentPlayerTurn = "brown";
      this.moveHistory = [];
      this.captureHistory = [];
      this.knockedOutTeam = null;
      this.lastMovePiece = null;
      this.lastMoveDestination = null;
      this.gameOver = false;
      
      // Reset piece positions to starting positions
      this.piecePositions = {
        brownOwl: "b7-1",
        brownKite: "b6-2",
        brownRaven: "b5-3",
        yellowOwl: "y7-1",
        yellowKite: "y6-2",
        yellowRaven: "y5-3",
        greenOwl: "g7-1",
        greenKite: "g6-2",
        greenRaven: "g5-3",
      };

      // Move all pieces back to their starting positions visually
      this.resetPiecesVisually();

      // Update displays
      this.updateNextPlayerDisplay();
      this.updateMoveHistoryDisplay();
      this.updateOwlHallaDisplay();
    },

    // Add this new function to handle visual piece reset
    resetPiecesVisually: function () {
      console.log("Resetting pieces to starting positions");

      if (!resetFunctions) {
        console.log("Game reset functions not available");
        return;
      }

      const { scene, setPiecePosition, cubesOnTheThreeFaces } =
        resetFunctions;

      // Find and reset each piece
      const startingPositions = {
        brownOwl: { cube: "b7-1", offset: { x: 0, y: 3.75, z: 0 } },
        brownKite: { cube: "b6-2", offset: { x: 0, y: 3.75, z: 0 } },
        brownRaven: { cube: "b5-3", offset: { x: 0, y: 3.75, z: 0 } },
        yellowOwl: { cube: "y7-1", offset: { x: 3.75, y: 0, z: 0 } },
        yellowKite: { cube: "y6-2", offset: { x: 3.75, y: 0, z: 0 } },
        yellowRaven: { cube: "y5-3", offset: { x: 3.75, y: 0, z: 0 } },
        greenOwl: { cube: "g7-1", offset: { x: 0, y: 0, z: 3.75 } },
        greenKite: { cube: "g6-2", offset: { x: 0, y: 0, z: 3.75 } },
        greenRaven: { cube: "g5-3", offset: { x: 0, y: 0, z: 3.75 } },
      };

      for (let [pieceName, position] of Object.entries(startingPositions)) {
        setPiecePosition(
          scene.getMeshByName(pieceName),
          cubesOnTheThreeFaces,
          position.cube,
          position.offset.x,
          position.offset.y,
          position.offset.z
        );
      }
    },

    // updatePlayerTypes - Moved to uiManager.js

    setAI: function (aiModule) {
      this.aiModule = aiModule;
    },

    checkWinningConditions: function (piece, destinationSquare) {
      console.log("🔍 checkWinningConditions called with:", piece, destinationSquare);

      // Check if an Owl has reached the center (only if piece is specified)
      if (piece && piece.endsWith("Owl")) {
        console.log("🦉 Owl piece detected:", piece);
        console.log("🎯 Checking if", destinationSquare, "is a nest square");
        console.log("🎯 Nest squares are:", ["b7-7", "y7-7", "g7-7"]);
        console.log("🎯 Is nest square?", ["b7-7", "y7-7", "g7-7"].includes(destinationSquare));
        
        if (["b7-7", "y7-7", "g7-7"].includes(destinationSquare)) {
          console.log("🏆 WIN CONDITION MET: Owl reached center!");
          const team =
            piece.split("Owl")[0].charAt(0).toUpperCase() +
            piece.split("Owl")[0].slice(1);
          console.log("🏆 Winning team:", team);
          return `${team} wins`;
        } else {
          console.log("❌ Owl move but not to nest square");
        }
      } else {
        console.log("❌ Not an Owl piece or piece is null");
      }

      // Check for last Owl standing
      const remainingOwls = Object.keys(this.piecePositions).filter(
        (p) => p.endsWith("Owl") && this.piecePositions[p] !== "captured"
      );
      console.log("Remaining Owls:", remainingOwls);

      if (remainingOwls.length === 1) {
        const lastOwlTeam =
          remainingOwls[0].split("Owl")[0].charAt(0).toUpperCase() +
          remainingOwls[0].split("Owl")[0].slice(1);
        console.log("Win condition met: Last Owl standing");
        return `${lastOwlTeam} wins`;
      }

      return null;
    },

    //OWLHALLA MANAGEMENT

    owlHallaHistory: [],

    addOwlHallaMove: function (piece, isGoingToOwlHalla) {
      const abbreviatedPiece = this.abbreviatePiece(piece);
      const owlHallaText = isGoingToOwlHalla
        ? `${abbreviatedPiece} to owlHalla`
        : `${abbreviatedPiece} from owlHalla`;

      // Only add to owlHallaHistory, not to moveHistory
      this.owlHallaHistory.push(owlHallaText);

      if (isGoingToOwlHalla && piece.includes("Owl")) {
        this.knockedOutTeam = piece.split("Owl")[0];
      } else if (!isGoingToOwlHalla) {
        this.reinstateTeam(piece);
      }

      this.updateMoveHistoryDisplay();
      this.updateNextPlayerDisplay();
    },

    //MOVE RETRACTION MANAGEMENT

    lastMove: null,
    justCancelledRetraction: false,
    isPlayAgainState: false,

    isPotentialRetraction: function (pieceName) {
      const isPotential =
        this.lastMove &&
        this.lastMove.piece === pieceName &&
        !this.justCancelledRetraction;

      return isPotential;
    },

    showRetractionConfirmation: function (piece, onRetract) {
      const confirmationRect = new Rectangle("confirmationRect");
      confirmationRect.width = "400px";
      confirmationRect.height = "200px";
      confirmationRect.cornerRadius = 20;
      confirmationRect.color = "White";
      confirmationRect.thickness = 4;
      confirmationRect.background = "rgba(0, 0, 0, 0.7)";
      advancedTexture.addControl(confirmationRect);

      const confirmationText = new TextBlock();
      confirmationText.text = "Do you want to retract your last move?";
      confirmationText.color = "white";
      confirmationText.fontSize = 20;
      confirmationText.textHorizontalAlignment =
        Control.HORIZONTAL_ALIGNMENT_CENTER;
      confirmationText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      confirmationText.top = "20px";
      confirmationRect.addControl(confirmationText);

      const retractButton = Button.CreateSimpleButton(
        "retractButton",
        "Retract Move"
      );
      retractButton.width = "150px";
      retractButton.height = "40px";
      retractButton.color = "white";
      retractButton.cornerRadius = 20;
      retractButton.background = "green";
      retractButton.top = "80px";
      retractButton.left = "-80px";
      retractButton.onPointerUpObservable.add(() => {
        advancedTexture.removeControl(confirmationRect);
        onRetract();
      });
      confirmationRect.addControl(retractButton);

      const cancelButton = Button.CreateSimpleButton("cancelButton", "Cancel");
      cancelButton.width = "150px";
      cancelButton.height = "40px";
      cancelButton.color = "white";
      cancelButton.cornerRadius = 20;
      cancelButton.background = "red";
      cancelButton.top = "80px";
      cancelButton.left = "80px";
      cancelButton.onPointerUpObservable.add(() => {
        advancedTexture.removeControl(confirmationRect);
        this.justCancelledRetraction = true; // Set the flag

        // Do nothing else, just close the window
      });
      confirmationRect.addControl(cancelButton);
    },

    retractMove: function () {
      if (this.lastMove) {
        // Find the last regular move (non-owlHalla move)
        let lastRegularMoveIndex = this.moveHistory.length - 1;
        while (lastRegularMoveIndex >= 0) {
          const moveEntry = this.moveHistory[lastRegularMoveIndex];
          let isOwlHallaMove = false;
          
          if (typeof moveEntry === 'string') {
            isOwlHallaMove = moveEntry.includes("owlHalla");
          } else if (typeof moveEntry === 'object' && moveEntry.notation) {
            isOwlHallaMove = moveEntry.notation.includes("owlHalla");
          }
          
          if (!isOwlHallaMove) break;
          lastRegularMoveIndex--;
        }

        if (lastRegularMoveIndex >= 0) {
          const retractedMove = this.moveHistory[lastRegularMoveIndex];
          const moveText = typeof retractedMove === 'string' ? retractedMove : retractedMove.notation;
          const retractionText = `[${moveText} retracted]`;

          // Remove all moves after and including the retracted move
          this.moveHistory = this.moveHistory.slice(0, lastRegularMoveIndex);

          // Add the retraction to the move history instead of a separate retractionHistory
          this.moveHistory.push(retractionText);

          // Remove any associated captures
          this.captureHistory = this.captureHistory.filter(
            (capture) => capture.moveIndex < lastRegularMoveIndex
          );

          // Remove any related owlHalla moves
          this.owlHallaHistory = this.owlHallaHistory.filter((move) => {
            const pieceAbbr = this.abbreviatePiece(this.lastMove.piece);
            return !move.includes(pieceAbbr);
          });

          // Restore the piece position
          this.piecePositions[this.lastMove.piece] = this.lastMove.sourceSquare;

          // If the captured piece was moved to owlHalla, restore its position
          /* if (this.lastMove.capturedPiece) {
            this.piecePositions[this.lastMove.capturedPiece] =
              this.lastMove.destinationSquare;
          }

          */

          this.revertToPreviousPlayer();

          this.isPlayAgainState = true;
          this.lastMove = null;
          this.updateMoveHistoryDisplay();
          this.updateNextPlayerDisplay();
        }
      }
    },
    //DISPLAY UPDATE FUNCTIONS
    updateMoveHistoryDisplay: function () {
      let displayText = "";
      let captureIndex = 0;

      for (let i = 0; i < this.moveHistory.length; i++) {
        displayText += this.moveHistory[i] + "\n";

        // Add captures associated with this move
        while (
          captureIndex < this.captureHistory.length &&
          this.captureHistory[captureIndex].moveIndex === i
        ) {
          displayText += this.captureHistory[captureIndex].text + "\n";
          captureIndex++;
        }
      }

      const moveHistoryText =
        moveHistoryViewer.getChildByName("moveHistoryText");
      moveHistoryText.text = displayText;
    },

    // updateNextPlayerDisplay - Moved to uiManager.js
    //UTILITY FUNCTIONS

    abbreviatePiece: function (piece) {
      switch (piece) {
        case "brownOwl":
          return "bO";
        case "brownKite":
          return "bK";
        case "brownRaven":
          return "bR";
        case "yellowOwl":
          return "yO";
        case "yellowKite":
          return "yK";
        case "yellowRaven":
          return "yR";
        case "greenOwl":
          return "gO";
        case "greenKite":
          return "gK";
        case "greenRaven":
          return "gR";
        default:
          return "??";
      }
    },

    getColorFromPieceName: function (pieceName) {
      if (pieceName.startsWith("brown")) return "brown";
      if (pieceName.startsWith("yellow")) return "yellow";
      if (pieceName.startsWith("green")) return "green";

      return "unknown";
    },

    // initializeMoveInput - Moved to inputManager.js

    // executeParsedMove - Moved to inputManager.js

    // executeRegularMove - Moved to inputManager.js

    // checkPotentialCaptures - Moved to captureManager.js

    // executeMovementThenCaptures - Moved to inputManager.js

    // All hybrid capture functions moved to captureManager.js and inputManager.js:
    // startHybridCaptureMode, startHybridCaptureTimer, enableHybridPieceClicking
    // getPotentialVictims, addHybridCaptureVictim, finishHybridCapture
    // disableHybridPieceClicking, executeMovementAndCaptures

    // getAdjacentSquares - Moved to captureManager.js
    // findPieceAtSquare - Moved to captureManager.js
    // executeDirectCapture - Moved to inputManager.js
    // executeRestore - Moved to inputManager.js
    // updateOwlHallaDisplay - Moved to uiManager.js

    // updateMoveHistoryDisplay - Moved to moveHistoryManager.js
    // formatMoveForDisplay - Moved to moveHistoryManager.js
    // takebackToMove - Moved to moveHistoryManager.js
    // animatePiecesToRestoredPositions - Moved to moveHistoryManager.js
    // animatePieceToBoard - Moved to moveHistoryManager.js
    // getRecentCaptures - Moved to moveHistoryManager.js

    displayInfoMessage: displayInfoMessage,

    // BULLET-PROOF AI TRIGGERING SYSTEM
    triggerAIMoveIfNeeded: function() {
      // Comprehensive state validation
      if (this.gameOver) {
        console.log("⚠️ Game over - no AI trigger");
        return;
      }

      if (!this.aiGameRunning) {
        console.log("⚠️ AI game not running - no AI trigger");
        return;
      }

      if (this.aiGamePaused) {
        console.log("⚠️ AI game paused - no AI trigger");
        return;
      }

      if (!this.currentPlayerTurn) {
        console.log("⚠️ No current player set - no AI trigger");
        return;
      }

      if (!this.isAIPlayer(this.currentPlayerTurn)) {
        console.log(`👤 ${this.currentPlayerTurn} is human - waiting for input`);
        return;
      }

      if (!this.aiModule) {
        console.log("⚠️ AI module not available - no AI trigger");
        return;
      }

      // All checks passed - trigger AI move
      console.log(`🤖 Triggering AI move for ${this.currentPlayerTurn}`);
      
      // Add small delay to ensure UI state is stable
      setTimeout(() => {
        if (this.isAIPlayer(this.currentPlayerTurn) && this.aiGameRunning && !this.aiGamePaused) {
          this.aiModule.makeMove(this.currentPlayerTurn);
        } else {
          console.log("⚠️ AI trigger cancelled - state changed during delay");
        }
      }, 100);
    },
  };

  // Initialize captureManager with reference to gameStateManager
  const captureManager = createCaptureManager(gameStateManager, { captureTimerText });
  
  // Initialize moveHistoryManager with reference to gameStateManager
  const moveHistoryManager = createMoveHistoryManager(gameStateManager, resetFunctions);
  
  // Initialize uiManager with reference to gameStateManager
  const uiManager = createUIManager(gameStateManager, { advancedTexture });
  
  // Initialize inputManager with reference to gameStateManager
  const inputManager = createInputManager(gameStateManager, resetFunctions);
  
  // Initialize gameExportManager with reference to gameStateManager
  const gameExportManager = createGameExportManager(gameStateManager);
  
  // Initialize gameImportManager with reference to gameStateManager
  const gameImportManager = createGameImportManager(gameStateManager);
  
  // Integrate captureManager methods into gameStateManager
  gameStateManager.captureManager = captureManager;
  gameStateManager.recordCapture = captureManager.recordCapture.bind(captureManager);
  gameStateManager.cancelCaptureDecisionTimer = captureManager.cancelCaptureDecisionTimer.bind(captureManager);
  gameStateManager.startCaptureTimerDisplay = captureManager.startCaptureTimerDisplay.bind(captureManager);
  gameStateManager.updateCaptureTimerDisplay = captureManager.updateCaptureTimerDisplay.bind(captureManager);
  gameStateManager.stopCaptureTimerDisplay = captureManager.stopCaptureTimerDisplay.bind(captureManager);
  gameStateManager.checkPotentialCaptures = captureManager.checkPotentialCaptures.bind(captureManager);
  gameStateManager.startHybridCaptureMode = captureManager.startHybridCaptureMode.bind(captureManager);
  gameStateManager.finishHybridCapture = captureManager.finishHybridCapture.bind(captureManager);
  gameStateManager.executeDirectCapture = captureManager.executeDirectCapture.bind(captureManager);
  gameStateManager.getAdjacentSquares = captureManager.getAdjacentSquares.bind(captureManager);
  gameStateManager.findPieceAtSquare = captureManager.findPieceAtSquare.bind(captureManager);
  
  // Integrate moveHistoryManager methods into gameStateManager
  gameStateManager.moveHistoryManager = moveHistoryManager;
  gameStateManager.addMoveToHistory = moveHistoryManager.addMoveToHistory.bind(moveHistoryManager);
  gameStateManager.updateMoveHistoryDisplay = moveHistoryManager.updateMoveHistoryDisplay.bind(moveHistoryManager);
  gameStateManager.formatMoveForDisplay = moveHistoryManager.formatMoveForDisplay.bind(moveHistoryManager);
  gameStateManager.takebackToMove = moveHistoryManager.takebackToMove.bind(moveHistoryManager);
  gameStateManager.animatePiecesToRestoredPositions = moveHistoryManager.animatePiecesToRestoredPositions.bind(moveHistoryManager);
  gameStateManager.animatePieceToBoard = moveHistoryManager.animatePieceToBoard.bind(moveHistoryManager);
  gameStateManager.getRecentCaptures = moveHistoryManager.getRecentCaptures.bind(moveHistoryManager);
  
  // Integrate uiManager methods into gameStateManager
  gameStateManager.uiManager = uiManager;
  gameStateManager.updatePlayerTypes = uiManager.updatePlayerTypes.bind(uiManager);
  gameStateManager.updateNextPlayerDisplay = uiManager.updateNextPlayerDisplay.bind(uiManager);
  gameStateManager.updateOwlHallaDisplay = uiManager.updateOwlHallaDisplay.bind(uiManager);
  gameStateManager.updateAllDisplays = uiManager.updateAllDisplays.bind(uiManager);
  gameStateManager.updateGameOverDisplay = uiManager.updateGameOverDisplay.bind(uiManager);
  
  // Integrate inputManager methods into gameStateManager
  gameStateManager.inputManager = inputManager;
  gameStateManager.initializeMoveInput = inputManager.initializeMoveInput.bind(inputManager);
  gameStateManager.executeParsedMove = inputManager.executeParsedMove.bind(inputManager);
  gameStateManager.executeRegularMove = inputManager.executeRegularMove.bind(inputManager);
  gameStateManager.executeMovementThenCaptures = inputManager.executeMovementThenCaptures.bind(inputManager);
  gameStateManager.executeMovementAndCaptures = inputManager.executeMovementAndCaptures.bind(inputManager);
  gameStateManager.executeMoveSequence = inputManager.executeMoveSequence.bind(inputManager);
  
  // Integrate gameExportManager methods into gameStateManager
  gameStateManager.gameExportManager = gameExportManager;
  gameStateManager.exportToSGN = gameExportManager.exportToSGN.bind(gameExportManager);
  gameStateManager.exportToSimpleText = gameExportManager.exportToSimpleText.bind(gameExportManager);
  gameStateManager.exportToJSON = gameExportManager.exportToJSON.bind(gameExportManager);
  gameStateManager.exportGame = gameExportManager.exportGame.bind(gameExportManager);

  // Integrate gameImportManager methods into gameStateManager  
  gameStateManager.gameImportManager = gameImportManager;
  gameStateManager.importFromSGN = gameImportManager.importFromSGN.bind(gameImportManager);
  gameStateManager.importFromText = gameImportManager.importFromText.bind(gameImportManager);
  gameStateManager.importFromJSON = gameImportManager.importFromJSON.bind(gameImportManager);
  gameStateManager.replayGame = gameImportManager.replayGame.bind(gameImportManager);
  gameStateManager.handleFileUpload = gameImportManager.handleFileUpload.bind(gameImportManager);
  gameStateManager.loadGameFromClipboard = gameImportManager.loadGameFromClipboard.bind(gameImportManager);

  // Create property references that sync with captureManager
  Object.defineProperty(gameStateManager, 'captureDecisionTimer', {
    get: () => captureManager.captureDecisionTimer,
    set: (value) => { captureManager.captureDecisionTimer = value; }
  });
  Object.defineProperty(gameStateManager, 'captureCountdownTimer', {
    get: () => captureManager.captureCountdownTimer,
    set: (value) => { captureManager.captureCountdownTimer = value; }
  });
  Object.defineProperty(gameStateManager, 'isRavenCaptureInProgress', {
    get: () => captureManager.isRavenCaptureInProgress,
    set: (value) => { captureManager.isRavenCaptureInProgress = value; }
  });
  Object.defineProperty(gameStateManager, 'captureTimeRemaining', {
    get: () => captureManager.captureTimeRemaining,
    set: (value) => { captureManager.captureTimeRemaining = value; }
  });
  Object.defineProperty(gameStateManager, 'capturingPlayer', {
    get: () => captureManager.capturingPlayer,
    set: (value) => { captureManager.capturingPlayer = value; }
  });
  Object.defineProperty(gameStateManager, 'hybridCaptureMode', {
    get: () => captureManager.hybridCaptureMode,
    set: (value) => { captureManager.hybridCaptureMode = value; }
  });
  Object.defineProperty(gameStateManager, 'pendingHybridMove', {
    get: () => captureManager.pendingHybridMove,
    set: (value) => { captureManager.pendingHybridMove = value; }
  });
  Object.defineProperty(gameStateManager, 'hybridCaptureVictims', {
    get: () => captureManager.hybridCaptureVictims,
    set: (value) => { captureManager.hybridCaptureVictims = value; }
  });
  Object.defineProperty(gameStateManager, 'hybridClickHandlers', {
    get: () => captureManager.hybridClickHandlers,
    set: (value) => { captureManager.hybridClickHandlers = value; }
  });

  return gameStateManager;
}
