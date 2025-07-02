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

import { moveNotation } from "./moveNotation.js";
import { Vector3 } from "@babylonjs/core";

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
  messageRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  messageRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
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
    
    return cube.position.clone().add(offsetVector);
  }

  function displayInfoMessage(message) {
    messageText.text = message;
    messageRect.isVisible = true;

    setTimeout(function () {
      messageRect.isVisible = false;
    }, 2000);
  }


  //GAME STATE OBJECT

  return {
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

    // Capture decision timer
    captureDecisionTimer: null,
    captureCountdownTimer: null,
    isRavenCaptureInProgress: false,
    captureTimeRemaining: 0,

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
    gameOver: false,
    playerTypes: {
      brown: "human",
      yellow: "human",
      green: "human",
    },

    addMoveToHistory: function (piece, sourceSquare, destinationSquare, capturedPiece, gameStateBeforeMove = null) {
      console.log(
        `=== addMoveToHistory called: ${piece} from ${sourceSquare} to ${destinationSquare} ===`
      );

      const pieceNotation = this.abbreviatePiece(piece);
      let moveText = `${pieceNotation}-${destinationSquare.replace("-", "")}`;
      
      // Add capture notation if there was a capture
      if (capturedPiece && capturedPiece.name !== "text_input_capture") {
        // Try to find what was captured by looking at recent captures
        const recentCaptures = this.getRecentCaptures();
        if (recentCaptures.length > 0) {
          const captureNotation = recentCaptures.map(cap => moveNotation.getNotationFromPieceName(cap)).filter(Boolean).join(' x ');
          if (captureNotation) {
            moveText += ` x ${captureNotation}`;
          }
        }
      }
      
      // Create move record with game state snapshot for takeback
      const moveRecord = {
        notation: moveText,
        piece: piece,
        from: sourceSquare,
        to: destinationSquare,
        captured: capturedPiece,
        moveNumber: this.moveHistory.length + 1,
        
        // Store complete game state BEFORE this move for restoration
        gameState: gameStateBeforeMove || {
          piecePositions: JSON.parse(JSON.stringify(this.piecePositions)),
          currentPlayer: this.currentPlayerTurn,
          captureHistory: JSON.parse(JSON.stringify(this.captureHistory)),
          knockedOutTeam: this.knockedOutTeam,
          isPlayAgainState: this.isPlayAgainState,
          gameOver: this.gameOver
        }
      };
      
      console.log(`💾 Saving move record for takeback:`, moveRecord);
      console.log(`💾 Game state snapshot:`, moveRecord.gameState);
      
      this.moveHistory.push(moveRecord);

      // Check for winning conditions
      const winningMessage = this.checkWinningConditions(
        piece,
        destinationSquare
      );

      if (winningMessage) {
        this.moveHistory.push(winningMessage);
        this.gameOver = true;
      }

      // Check if this is a hybrid capture in progress FIRST
      const isHybridInProgress = capturedPiece && capturedPiece.name === "hybrid_in_progress";
      
      // Update game state
      this.lastMove = { piece, sourceSquare, destinationSquare, moveText };
      this.isPlayAgainState = false;
      
      // Don't advance turn if this is a hybrid capture in progress
      if (isHybridInProgress) {
        console.log(`🔄 Hybrid capture in progress - NOT advancing turn or updating displays yet`);
        this.updateMoveHistoryDisplay();
        return; // Exit early, don't advance turn or call proceedToNextTurn()
      }
      
      // Normal flow for non-hybrid moves
      this.updateNextPlayer();
      this.updateMoveHistoryDisplay();
      this.updateOwlHallaDisplay(); // Update captured pieces display
      this.updateNextPlayerDisplay();

      this.updatePlayerTypes(); // Read the radio buttons first

      // Check if this was a human move with potential captures
      const isHumanMove = !this.isAIPlayer(piece.split(/(?=[A-Z])/)[0]); // Extract color from piece name
      const hasPotentialCapture = capturedPiece !== null && capturedPiece !== undefined;
      const isTextInputCapture = capturedPiece && capturedPiece.name === "text_input_capture";
      const isRavenMove = piece.includes('Raven');
      
      // Don't start timer for text input captures (they're already completed)
      if (isHumanMove && hasPotentialCapture && !isTextInputCapture) {
        console.log(`🕒 Starting 7-second capture decision timer for ${piece}`);
        this.isRavenCaptureInProgress = isRavenMove;
        
        // Start visual countdown
        this.startCaptureTimerDisplay();
        
        // Start 7-second timer for capture decisions
        this.captureDecisionTimer = setTimeout(() => {
          console.log(`⏰ Capture decision timer expired - proceeding to next turn`);
          this.captureDecisionTimer = null;
          this.isRavenCaptureInProgress = false;
          this.stopCaptureTimerDisplay();
          this.proceedToNextTurn();
        }, 7000);
      } else {
        // No capture timer needed - proceed immediately
        this.proceedToNextTurn();
      }
    },

    proceedToNextTurn: function() {
      // Check if the new current player is AI and game is running (not paused)
      if (this.isAIPlayer(this.currentPlayerTurn) && this.aiGameRunning && !this.aiGamePaused) {
        console.log(this.currentPlayerTurn + " is AI - will make move");
        // Call the AI module
        if (this.aiModule) {
          this.aiModule.makeMove(this.currentPlayerTurn);
        }
      } else {
        console.log(this.currentPlayerTurn + " is human or game is paused");
      }
    },

    cancelCaptureDecisionTimer: function() {
      if (this.captureDecisionTimer) {
        clearTimeout(this.captureDecisionTimer);
        this.captureDecisionTimer = null;
        this.isRavenCaptureInProgress = false;
        this.stopCaptureTimerDisplay();
        console.log("🚫 Capture decision timer cancelled - proceeding to next turn");
        this.proceedToNextTurn();
      }
    },

    startCaptureTimerDisplay: function() {
      this.captureTimeRemaining = 7;
      captureTimerText.isVisible = true;
      this.updateCaptureTimerDisplay();
      
      // Update countdown every second
      this.captureCountdownTimer = setInterval(() => {
        this.captureTimeRemaining--;
        this.updateCaptureTimerDisplay();
        
        if (this.captureTimeRemaining <= 0) {
          this.stopCaptureTimerDisplay();
        }
      }, 1000);
    },

    updateCaptureTimerDisplay: function() {
      if (this.captureTimeRemaining > 0) {
        captureTimerText.text = `Capture Decision: ${this.captureTimeRemaining}s`;
      }
    },

    stopCaptureTimerDisplay: function() {
      if (this.captureCountdownTimer) {
        clearInterval(this.captureCountdownTimer);
        this.captureCountdownTimer = null;
      }
      captureTimerText.isVisible = false;
      captureTimerText.text = "";
    },

    recordCapture: function (capturedPiece) {
      console.log("Capturing piece:", capturedPiece);
      console.log("Current player before capture:", this.currentPlayerTurn);

      // For Raven captures, let the timer run to completion (multiple victims possible)
      // For Owl/Kite captures, cancel timer immediately (single victim only)
      if (this.captureDecisionTimer && !this.isRavenCaptureInProgress) {
        console.log("🚫 Single-victim capture complete - cancelling timer");
        this.cancelCaptureDecisionTimer();
      } else if (this.captureDecisionTimer) {
        console.log("🐦 Raven capture - timer continues running for additional victims");
      }

      const abbreviatedCaptured = this.abbreviatePiece(capturedPiece);
      const captureText = `(${abbreviatedCaptured} captured)`;

      // Add to captureHistory
      this.captureHistory.push({
        moveIndex: this.moveHistory.length - 1,
        text: captureText,
      });

      // Update the piece positions
      this.piecePositions[capturedPiece] = "captured";

      // Check if the captured piece is an Owl
      if (capturedPiece.includes("Owl")) {
        const capturedTeam = this.getColorFromPieceName(capturedPiece);
        this.knockedOutTeam = capturedTeam;
        console.log("Owl captured. Knocked out team:", capturedTeam);

        const teams = ["brown", "yellow", "green"];
        const capturingTeam =
          teams[(teams.indexOf(this.currentPlayerTurn) - 1 + 3) % 3];

        // Explicitly handle Owl capture scenarios
        if (capturingTeam === "yellow" && capturedTeam === "green") {
          console.log(
            "Yellow captured Green Owl. Setting next player to Brown."
          );
          this.currentPlayerTurn = "brown";
        } else if (capturingTeam === "brown" && capturedTeam === "yellow") {
          console.log(
            "Brown captured Yellow Owl. Setting next player to Green."
          );
          this.currentPlayerTurn = "green";
        } else if (capturingTeam === "green" && capturedTeam === "brown") {
          console.log(
            "Green captured Brown Owl. Setting next player to Yellow."
          );
          this.currentPlayerTurn = "yellow";
        } else {
          console.log("Owl capture did not result in player change.");
        }

        console.log(
          "Current player after Owl capture logic:",
          this.currentPlayerTurn
        );
        this.updateNextPlayerDisplay();
      }

      // Check for winning condition after capture
      const winningMessage = this.checkWinningConditions(
        capturedPiece,
        "captured"
      );
      if (winningMessage) {
        this.moveHistory.push(winningMessage);
        this.gameOver = true;
        console.log("Game over:", winningMessage);
      }

      // Update the last move to include the capture information
      if (this.lastMove) {
        this.lastMove.capturedPiece = capturedPiece;
      }

      // Update the move history to include capture notation
      if (this.moveHistory.length > 0) {
        const lastMoveIndex = this.moveHistory.length - 1;
        const lastMove = this.moveHistory[lastMoveIndex];
        
        // If it's a simple move string and doesn't already include capture notation
        if (typeof lastMove === 'string' && !lastMove.includes(' x ')) {
          const captureNotation = moveNotation.getNotationFromPieceName(capturedPiece);
          if (captureNotation) {
            this.moveHistory[lastMoveIndex] = `${lastMove} x ${captureNotation}`;
          }
        }
      }

      this.updateMoveHistoryDisplay();
      this.updateOwlHallaDisplay(); // Update captured pieces display
      console.log(
        "recordCapture completed. Current player:",
        this.currentPlayerTurn
      );
    },

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

      // Skip the knocked-out team if there is one
      if (teams[nextIndex] === this.knockedOutTeam) {
        nextIndex = (nextIndex + 1) % teams.length;
      }

      this.currentPlayerTurn = teams[nextIndex];
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
      if (this.isAIPlayer(this.currentPlayerTurn)) {
        console.log("Triggering AI move for", this.currentPlayerTurn);
        if (this.aiModule) {
          this.aiModule.makeMove(this.currentPlayerTurn); // Remove setTimeout from here too
        }
      } else {
        console.log("Current player is not AI, waiting for manual move");
      }
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

    // Function to read radio button values and update player types
    updatePlayerTypes: function () {
      this.playerTypes.brown = document.querySelector(
        'input[name="brown-player"]:checked'
      ).value;
      this.playerTypes.yellow = document.querySelector(
        'input[name="yellow-player"]:checked'
      ).value;
      this.playerTypes.green = document.querySelector(
        'input[name="green-player"]:checked'
      ).value;

      console.log("Player types updated:", this.playerTypes);
    },

    setAI: function (aiModule) {
      this.aiModule = aiModule;
    },

    checkWinningConditions: function (piece, destinationSquare) {
      console.log("Checking win condition:", piece, destinationSquare);

      // Check if an Owl has reached the center
      if (
        piece.endsWith("Owl") &&
        ["b7-7", "y7-7", "g7-7"].includes(destinationSquare)
      ) {
        console.log("Win condition met: Owl reached center");
        const team =
          piece.split("Owl")[0].charAt(0).toUpperCase() +
          piece.split("Owl")[0].slice(1);
        return `${team} wins`;
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
        while (
          lastRegularMoveIndex >= 0 &&
          this.moveHistory[lastRegularMoveIndex].includes("owlHalla")
        ) {
          lastRegularMoveIndex--;
        }

        if (lastRegularMoveIndex >= 0) {
          const retractedMove = this.moveHistory[lastRegularMoveIndex];
          const retractionText = `[${retractedMove} retracted]`;

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

    updateNextPlayerDisplay: function () {
      console.log(
        "Updating next player display. Current player:",
        this.currentPlayerTurn
      );
      if (nextPlayerText) {
        advancedTexture.removeControl(nextPlayerText);
      }

      const nextPlayerRect = new Rectangle("nextPlayerRect");
      nextPlayerRect.width = "150px";
      nextPlayerRect.height = "60px";
      nextPlayerRect.cornerRadius = 1;
      nextPlayerRect.color = "white";
      nextPlayerRect.thickness = 2;
      nextPlayerRect.background = "rgba(0, 0, 0, 0.7)";
      nextPlayerRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      nextPlayerRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      nextPlayerRect.left = "0px";
      nextPlayerRect.top = "0px";
      nextPlayerRect.paddingLeft = "20px";
      nextPlayerRect.paddingBottom = "20px";
      advancedTexture.addControl(nextPlayerRect);

      nextPlayerText = new TextBlock("nextPlayerText");
      if (this.gameOver) {
        nextPlayerText.text = this.moveHistory[this.moveHistory.length - 1]; // Display winning message
      } else {
        const playerColor = this.currentPlayerTurn;
        nextPlayerText.text = this.isPlayAgainState
          ? `${
              playerColor.charAt(0).toUpperCase() + playerColor.slice(1)
            } to play again`
          : `${
              playerColor.charAt(0).toUpperCase() + playerColor.slice(1)
            } to play`;
      }
      nextPlayerText.color = "white";
      nextPlayerText.fontSize = 16;

      nextPlayerText.textHorizontalAlignment =
        Control.HORIZONTAL_ALIGNMENT_CENTER;
      nextPlayerText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      nextPlayerRect.addControl(nextPlayerText);

      console.log("New next player text:", nextPlayerText.text);
      console.log("Next player display updated.");
    },
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

    // HTML-based move input functionality  
    initializeMoveInput: function() {
      // Get HTML elements
      const moveInput = document.getElementById('move-input');
      const executeBtn = document.getElementById('execute-move-btn');
      const clearBtn = document.getElementById('clear-input-btn');
      const validateBtn = document.getElementById('validate-move-btn');
      const capturedPiecesEl = document.getElementById('captured-pieces');
      const moveHistoryEl = document.getElementById('move-history-display');
      
      if (!moveInput || !executeBtn || !clearBtn || !validateBtn) {
        console.warn('Move input elements not found in DOM');
        return;
      }

      // Clear button handler
      clearBtn.addEventListener('click', () => {
        moveInput.value = '';
        moveInput.classList.remove('valid', 'invalid');
      });

      // Real-time validation on input
      moveInput.addEventListener('input', () => {
        const input = moveInput.value.trim();
        if (!input) {
          moveInput.classList.remove('valid', 'invalid');
          return;
        }

        const parsedMove = moveNotation.parseMove(input);
        if (parsedMove && parsedMove.valid) {
          // Check notation validity first
          if (parsedMove.type === 'move') {
            // For regular moves, also validate game rules
            const pieceName = moveNotation.getPieceName(parsedMove.piece);
            const currentPosition = this.piecePositions[pieceName];
            
            if (pieceName && currentPosition && currentPosition !== "captured") {
              // Only validate if we have the validation function available
              if (typeof window.validateMove === 'function') {
                const validation = window.validateMove(pieceName, currentPosition, parsedMove.destination);
                if (validation.valid) {
                  moveInput.classList.remove('invalid');
                  moveInput.classList.add('valid');
                } else {
                  moveInput.classList.remove('valid');
                  moveInput.classList.add('invalid');
                  moveInput.title = validation.reason; // Show reason on hover
                }
              } else {
                // Fallback to notation-only validation
                moveInput.classList.remove('invalid');
                moveInput.classList.add('valid');
              }
            } else {
              moveInput.classList.remove('valid');
              moveInput.classList.add('invalid');
              moveInput.title = 'Piece not found or captured';
            }
          } else {
            // For non-move commands (captures, restore), just check notation
            moveInput.classList.remove('invalid');
            moveInput.classList.add('valid');
          }
        } else {
          moveInput.classList.remove('valid');
          moveInput.classList.add('invalid');
          moveInput.title = 'Invalid notation format';
        }
      });

      // Validate button handler
      validateBtn.addEventListener('click', () => {
        const input = moveInput.value.trim();
        if (!input) {
          displayInfoMessage("Enter a move to validate");
          return;
        }

        const parsedMove = moveNotation.parseMove(input);
        if (parsedMove && parsedMove.valid) {
          if (parsedMove.type === 'move') {
            // For regular moves, validate both notation and game rules
            const pieceName = moveNotation.getPieceName(parsedMove.piece);
            const currentPosition = this.piecePositions[pieceName];
            
            if (!pieceName || !currentPosition || currentPosition === "captured") {
              displayInfoMessage("✗ Piece not found or captured");
              return;
            }
            
            if (typeof window.validateMove === 'function') {
              const validation = window.validateMove(pieceName, currentPosition, parsedMove.destination);
              if (validation.valid) {
                displayInfoMessage(`✓ Valid move: ${moveNotation.moveToNotation(parsedMove)} - ${validation.reason}`);
              } else {
                displayInfoMessage(`✗ Invalid move: ${validation.reason}`);
              }
            } else {
              displayInfoMessage(`✓ Valid notation: ${moveNotation.moveToNotation(parsedMove)} (rule validation unavailable)`);
            }
          } else {
            displayInfoMessage(`✓ Valid notation: ${moveNotation.moveToNotation(parsedMove)}`);
          }
        } else {
          displayInfoMessage("✗ Invalid move notation");
        }
      });

      // Execute button handler
      executeBtn.addEventListener('click', () => {
        const input = moveInput.value.trim();
        if (!input) {
          displayInfoMessage("Enter a move to execute");
          return;
        }

        const parsedMove = moveNotation.parseMove(input);
        if (!parsedMove || !parsedMove.valid) {
          displayInfoMessage("✗ Invalid move notation");
          return;
        }

        // Execute the move
        this.executeParsedMove(parsedMove);
        moveInput.value = ''; // Clear input after execution
        moveInput.classList.remove('valid', 'invalid');
      });

      // Enter key handler for move input
      moveInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          executeBtn.click();
        }
      });

      // Initialize display
      this.updateOwlHallaDisplay();
      this.updateMoveHistoryDisplay();
    },

    executeParsedMove: function(parsedMove) {
      try {
        switch (parsedMove.type) {
          case 'move':
            this.executeRegularMove(parsedMove);
            break;
          case 'capture':
            this.executeDirectCapture(parsedMove);
            break;
          case 'restore':
            this.executeRestore(parsedMove);
            break;
          default:
            displayInfoMessage("Unknown move type");
        }
      } catch (error) {
        console.error("Move execution error:", error);
        displayInfoMessage("Move execution failed: " + error.message);
      }
    },

    executeRegularMove: function(parsedMove) {
      console.log(`🎯 executeRegularMove called with:`, parsedMove);
      
      const pieceName = moveNotation.getPieceName(parsedMove.piece);
      const currentPosition = this.piecePositions[pieceName];
      
      console.log(`📍 Piece: ${parsedMove.piece} -> ${pieceName}, Current position: ${currentPosition}`);
      
      if (!pieceName || currentPosition === "captured") {
        displayInfoMessage(`Piece ${parsedMove.piece} not found or captured`);
        return;
      }

      // VALIDATE THE MOVE using existing rule systems
      if (typeof window.validateMove === 'function') {
        const validation = window.validateMove(pieceName, currentPosition, parsedMove.destination);
        if (!validation.valid) {
          console.log(`❌ Move validation failed: ${validation.reason}`);
          displayInfoMessage(`Invalid move: ${validation.reason}`);
          return;
        }
        console.log(`✅ Move validation passed: ${validation.reason}`);
      } else {
        console.log(`⚠️ Move validation function not available - proceeding without validation`);
      }

      // Check if this move has potential captures but no capture notation specified
      const hasPotentialCaptures = this.checkPotentialCaptures(pieceName, parsedMove.destination);
      const hasSpecifiedCaptures = parsedMove.victims && parsedMove.victims.length > 0;
      
      console.log(`🔍 Capture analysis: hasPotentialCaptures=${hasPotentialCaptures}, hasSpecifiedCaptures=${hasSpecifiedCaptures}`);
      console.log(`📋 Parsed move victims:`, parsedMove.victims);
      
      if (hasPotentialCaptures && !hasSpecifiedCaptures) {
        console.log(`🚀 Move first, then start hybrid capture mode!`);
        // Execute the move first, then start capture mode
        this.executeMovementThenCaptures(parsedMove);
        return;
      }

      console.log(`⚡ Executing move immediately (no hybrid mode needed)`);
      // Execute the move immediately (either no captures possible or captures already specified)
      this.executeMovementAndCaptures(parsedMove);
    },

    checkPotentialCaptures: function(pieceName, destination) {
      console.log(`🔍 Checking potential captures for ${pieceName} moving to ${destination}`);
      
      // Use existing capture detection logic from strixGame.js
      const piece3D = findPieceInScene(pieceName);
      if (!piece3D) {
        console.log(`❌ Piece ${pieceName} not found in 3D scene`);
        return false;
      }

      if (pieceName.includes('Owl')) {
        // Owl captures: direct occupation - check if destination has enemy piece
        console.log(`🦉 Checking Owl captures for ${pieceName}`);
        const targetPieces = [];
        for (const [otherPieceName, position] of Object.entries(this.piecePositions)) {
          if (position === destination && otherPieceName !== pieceName) {
            const pieceColor = this.getColorFromPieceName(pieceName);
            const otherColor = this.getColorFromPieceName(otherPieceName);
            if (pieceColor !== otherColor) {
              targetPieces.push(otherPieceName);
              console.log(`🎯 Owl can capture ${otherPieceName} at ${destination}`);
            }
          }
        }
        return targetPieces.length > 0;
      } else if (pieceName.includes('Kite')) {
        // Kite captures: cross-face moves with adjacent victims
        console.log(`🪁 Checking Kite captures for ${pieceName}`);
        const currentPosition = this.piecePositions[pieceName];
        const startFace = currentPosition[0];
        const endFace = destination[0];
        
        console.log(`📍 Kite move: ${currentPosition} -> ${destination} (${startFace} to ${endFace})`);
        
        if (startFace !== endFace) {
          console.log(`🔄 Cross-face move detected - checking for adjacent victims`);
          // Cross-face move - check for adjacent victims
          const adjacentSquares = this.getAdjacentSquares(destination);
          console.log(`📋 Adjacent squares to ${destination}:`, adjacentSquares);
          
          const hasVictims = adjacentSquares.some(square => {
            const occupyingPiece = this.findPieceAtSquare(square);
            console.log(`🔍 Square ${square}: ${occupyingPiece || 'empty'}`);
            console.log(`🔍 Checking positions for square ${square}:`);
            
            // Debug: show all piece positions to see the format mismatch
            for (const [piece, pos] of Object.entries(this.piecePositions)) {
              if (pos.startsWith(square[0])) { // Same face
                console.log(`  ${piece}: ${pos}`);
              }
            }
            
            if (occupyingPiece) {
              const kiteColor = this.getColorFromPieceName(pieceName);
              const victimColor = this.getColorFromPieceName(occupyingPiece);
              console.log(`🎨 Colors: ${pieceName}(${kiteColor}) vs ${occupyingPiece}(${victimColor})`);
              if (kiteColor !== victimColor) {
                console.log(`🎯 Kite can capture ${occupyingPiece} at ${square}`);
                return true;
              }
            }
            return false;
          });
          
          console.log(`✅ Kite has potential victims: ${hasVictims}`);
          return hasVictims;
        }
        console.log(`❌ Same-face move - no Kite captures possible`);
        return false;
      } else if (pieceName.includes('Raven')) {
        // Use existing Raven capture detection from imported modules
        console.log(`🐦 Checking Raven captures for ${pieceName}`);
        // Note: checkRavenCaptureOpportunities should be available in global scope
        if (typeof checkRavenCaptureOpportunities === 'function') {
          const hasCaptures = checkRavenCaptureOpportunities(destination, this.piecePositions, pieceName);
          console.log(`✅ Raven has potential captures: ${hasCaptures}`);
          return hasCaptures;
        }
        console.log(`❌ checkRavenCaptureOpportunities function not available`);
        return false;
      }
      
      console.log(`❌ No potential captures found for ${pieceName}`);
      return false;
    },

    executeMovementThenCaptures: function(parsedMove) {
      console.log(`🎯 executeMovementThenCaptures: Moving piece first, then starting capture mode`);
      
      const pieceName = moveNotation.getPieceName(parsedMove.piece);
      const currentPosition = this.piecePositions[pieceName];

      // Find the piece in the 3D scene
      const piece3D = findPieceInScene(pieceName);
      if (!piece3D) {
        displayInfoMessage(`3D piece ${pieceName} not found in scene`);
        return;
      }

      // Find the target cube/square in the 3D scene
      const targetCube = findCubeInScene(parsedMove.destination);
      if (!targetCube) {
        displayInfoMessage(`Target square ${parsedMove.destination} not found in scene`);
        return;
      }

      // Calculate target position and rotation
      const targetPosition = calculateTargetPosition(targetCube);
      const targetRotation = targetCube.rotation.clone();

      // Store the parsed move for after animation
      this.pendingHybridMove = parsedMove;

      // Animate the piece movement FIRST
      animatePieceMovement(
        piece3D,
        targetPosition,
        targetRotation,
        30, // duration
        () => {
          console.log(`✅ Movement animation complete - now starting hybrid capture mode`);
          
          // Capture game state BEFORE updating positions for takeback
          const gameStateBeforeMove = {
            piecePositions: JSON.parse(JSON.stringify(this.piecePositions)),
            currentPlayer: this.currentPlayerTurn,
            captureHistory: JSON.parse(JSON.stringify(this.captureHistory)),
            knockedOutTeam: this.knockedOutTeam,
            isPlayAgainState: this.isPlayAgainState,
            gameOver: this.gameOver
          };
          
          // Update game state after movement
          this.piecePositions[pieceName] = parsedMove.destination;
          
          // Add basic move to history (captures will be added later)
          // Note: We pass a special flag to indicate this is a hybrid move in progress
          this.addMoveToHistory(pieceName, currentPosition, parsedMove.destination, { name: "hybrid_in_progress" }, gameStateBeforeMove);
          
          // NOW start the hybrid capture mode
          this.startHybridCaptureMode(parsedMove);
        }
      );
    },

    startHybridCaptureMode: function(parsedMove) {
      console.log('🔄 Starting hybrid capture mode for move:', parsedMove);
      
      // Store the pending move
      this.pendingHybridMove = parsedMove;
      this.hybridCaptureMode = true;
      this.hybridCaptureVictims = [];
      
      // Update text input to show move is being processed
      const moveInput = document.getElementById('move-input');
      if (moveInput) {
        moveInput.value = moveNotation.moveToNotation(parsedMove);
        moveInput.classList.add('hybrid-capture');
      }
      
      // Start capture timer with visual feedback
      this.startHybridCaptureTimer();
      
      // Display instructions
      displayInfoMessage('Piece moved! Click pieces to capture them, or wait 7s to proceed without capturing');
      
      // Enable piece clicking for captures
      this.enableHybridPieceClicking();
    },

    startHybridCaptureTimer: function() {
      this.hybridCaptureTimeRemaining = 7;
      
      // Update capture timer display
      captureTimerText.text = `Hybrid Capture: ${this.hybridCaptureTimeRemaining}s (click pieces to capture)`;
      captureTimerText.isVisible = true;
      
      // Start countdown
      this.hybridCaptureTimer = setInterval(() => {
        this.hybridCaptureTimeRemaining--;
        captureTimerText.text = `Hybrid Capture: ${this.hybridCaptureTimeRemaining}s (click pieces to capture)`;
        
        if (this.hybridCaptureTimeRemaining <= 0) {
          this.finishHybridCapture();
        }
      }, 1000);
    },

    enableHybridPieceClicking: function() {
      // Add temporary click handlers to all pieces for capture selection
      this.hybridClickHandlers = new Map();
      
      const potentialVictims = this.getPotentialVictims(this.pendingHybridMove);
      
      // Store reference to gameStateManager for use in click handlers
      const gameStateManager = this;
      
      potentialVictims.forEach(victimPieceName => {
        const piece3D = findPieceInScene(victimPieceName);
        if (piece3D && piece3D.actionManager) {
          // Create a unique action for hybrid capture clicking
          // Use the same ExecuteCodeAction that's already imported in the file
          const clickAction = {
            trigger: 1, // OnPickTrigger
            _actionCallback: function() {
              gameStateManager.addHybridCaptureVictim(victimPieceName);
            }
          };
          
          // Store action for later removal
          this.hybridClickHandlers.set(victimPieceName, clickAction);
          
          // Add custom event listener as fallback
          piece3D._hybridCaptureHandler = () => {
            console.log(`🎯 Hybrid capture handler called for ${victimPieceName}`);
            gameStateManager.addHybridCaptureVictim(victimPieceName);
          };
        }
      });
    },

    getPotentialVictims: function(parsedMove) {
      const pieceName = moveNotation.getPieceName(parsedMove.piece);
      const destination = parsedMove.destination;
      const victims = [];
      
      if (pieceName.includes('Owl')) {
        // Check for direct occupation victims
        for (const [otherPieceName, position] of Object.entries(this.piecePositions)) {
          if (position === destination && otherPieceName !== pieceName) {
            const pieceColor = this.getColorFromPieceName(pieceName);
            const otherColor = this.getColorFromPieceName(otherPieceName);
            if (pieceColor !== otherColor) {
              victims.push(otherPieceName);
            }
          }
        }
      } else if (pieceName.includes('Kite')) {
        // Check for adjacent victims on cross-face moves
        const currentPosition = this.piecePositions[pieceName];
        const startFace = currentPosition[0];
        const endFace = destination[0];
        
        if (startFace !== endFace) {
          const adjacentSquares = this.getAdjacentSquares(destination);
          adjacentSquares.forEach(square => {
            const occupyingPiece = this.findPieceAtSquare(square);
            if (occupyingPiece) {
              const kiteColor = this.getColorFromPieceName(pieceName);
              const victimColor = this.getColorFromPieceName(occupyingPiece);
              if (kiteColor !== victimColor) {
                victims.push(occupyingPiece);
              }
            }
          });
        }
      } else if (pieceName.includes('Raven')) {
        // Get all possible mobbing victims using existing functions
        // Note: findMobbingOpportunities should be available from ravenRules.js import
        if (typeof findMobbingOpportunities === 'function') {
          const mobbingOps = findMobbingOpportunities(destination, this.piecePositions, pieceName);
          mobbingOps.forEach(op => {
            if (op.victim) victims.push(op.victim);
          });
        }
      }
      
      return victims;
    },

    addHybridCaptureVictim: function(victimPieceName) {
      console.log(`🎯 addHybridCaptureVictim called for ${victimPieceName}`);
      
      // Add victim to capture list if not already included
      if (!this.hybridCaptureVictims.includes(victimPieceName)) {
        this.hybridCaptureVictims.push(victimPieceName);
        console.log(`📋 Added ${victimPieceName} to hybrid capture victims list:`, this.hybridCaptureVictims);
        
        // Update text input to show capture notation
        const victimNotation = moveNotation.getNotationFromPieceName(victimPieceName);
        if (victimNotation) {
          const moveInput = document.getElementById('move-input');
          if (moveInput) {
            const baseMove = moveNotation.moveToNotation(this.pendingHybridMove);
            const captureNotation = this.hybridCaptureVictims.map(v => 
              moveNotation.getNotationFromPieceName(v)).join(' ');
            moveInput.value = `${baseMove} x ${captureNotation}`;
            console.log(`📝 Updated text input to: ${moveInput.value}`);
          }
        }
        
        // Visual feedback
        const piece3D = findPieceInScene(victimPieceName);
        if (piece3D) {
          // Add visual indicator that piece is selected for capture
          piece3D.scaling = piece3D.scaling.clone().scale(1.1);
        }
        
        displayInfoMessage(`Added ${victimNotation} to capture list`);
      } else {
        console.log(`⚠️ ${victimPieceName} already in capture list`);
      }
    },

    finishHybridCapture: function() {
      console.log('🏁 Finishing hybrid capture mode');
      
      // Stop timer
      if (this.hybridCaptureTimer) {
        clearInterval(this.hybridCaptureTimer);
        this.hybridCaptureTimer = null;
      }
      
      // Hide timer display
      captureTimerText.isVisible = false;
      
      // Remove temporary click handlers
      this.disableHybridPieceClicking();
      
      // Check if any captures were made (either through hybrid list or traditional double-click)
      const recentCapturedPieces = [];
      for (const [pieceName, position] of Object.entries(this.piecePositions)) {
        if (position === "captured") {
          recentCapturedPieces.push(pieceName);
        }
      }
      
      console.log(`🔍 Checking captures - Hybrid victims: ${this.hybridCaptureVictims.length}, Recent captured pieces: ${recentCapturedPieces.length}`);
      
      // Process any selected captures (piece has already moved)
      if (this.hybridCaptureVictims.length > 0) {
        console.log(`🎯 Processing ${this.hybridCaptureVictims.length} hybrid captures:`, this.hybridCaptureVictims);
        
        for (const victimPieceName of this.hybridCaptureVictims) {
          console.log(`📥 HYBRID: Capturing: ${victimPieceName}`);
          
          if (this.piecePositions[victimPieceName] !== "captured") {
            this.piecePositions[victimPieceName] = "captured";
            
            // Call the same recordCapture function used by click-based captures
            this.recordCapture(victimPieceName);
            
            // Animate the 3D piece to Owl Halla
            console.log(`📥 HYBRID: Animating piece to Owl Halla: ${victimPieceName}`);
            if (typeof window.animateCapturedPieceToOwlHalla === 'function') {
              window.animateCapturedPieceToOwlHalla(victimPieceName);
            } else {
              console.log(`📥 HYBRID: WARNING: animateCapturedPieceToOwlHalla function not available`);
            }
          }
        }
        
        // Update move history to include capture notation
        if (this.moveHistory.length > 0) {
          const lastMoveIndex = this.moveHistory.length - 1;
          const lastMove = this.moveHistory[lastMoveIndex];
          
          if (typeof lastMove === 'string' && !lastMove.includes(' x ')) {
            const captureNotations = this.hybridCaptureVictims.map(pieceName => 
              moveNotation.getNotationFromPieceName(pieceName)).filter(Boolean);
            if (captureNotations.length > 0) {
              this.moveHistory[lastMoveIndex] = `${lastMove} x ${captureNotations.join(' ')}`;
              this.updateMoveHistoryDisplay();
            }
          }
        }
        
        displayInfoMessage(`Captured: ${this.hybridCaptureVictims.map(p => moveNotation.getNotationFromPieceName(p)).join(', ')}`);
      } else if (recentCapturedPieces.length > 0) {
        // Captures were made through traditional double-click during hybrid mode
        console.log(`🎯 Traditional captures detected during hybrid mode:`, recentCapturedPieces);
        const captureNotations = recentCapturedPieces.map(pieceName => 
          moveNotation.getNotationFromPieceName(pieceName)).filter(Boolean);
        displayInfoMessage(`Captured: ${captureNotations.join(', ')}`);
        
        // Update move history to include capture notation
        if (this.moveHistory.length > 0) {
          const lastMoveIndex = this.moveHistory.length - 1;
          const lastMove = this.moveHistory[lastMoveIndex];
          
          if (typeof lastMove === 'string' && !lastMove.includes(' x ')) {
            if (captureNotations.length > 0) {
              this.moveHistory[lastMoveIndex] = `${lastMove} x ${captureNotations.join(' ')}`;
              this.updateMoveHistoryDisplay();
            }
          }
        }
      } else {
        displayInfoMessage('Move completed without captures');
      }
      
      // Clean up
      this.hybridCaptureMode = false;
      this.pendingHybridMove = null;
      this.hybridCaptureVictims = [];
      
      // Reset text input styling
      const moveInput = document.getElementById('move-input');
      if (moveInput) {
        moveInput.value = '';
        moveInput.classList.remove('valid', 'invalid', 'hybrid-capture');
      }
      
      // NOW update displays and advance the turn (this was delayed during hybrid capture)
      console.log(`🔄 Hybrid capture complete - now updating displays and advancing turn`);
      this.updateNextPlayer();
      this.updateOwlHallaDisplay();
      this.updateNextPlayerDisplay();
      this.updatePlayerTypes();
      this.proceedToNextTurn();
    },

    disableHybridPieceClicking: function() {
      // Remove temporary click handlers and reset piece scaling
      if (this.hybridClickHandlers) {
        this.hybridClickHandlers.forEach((_, pieceName) => {
          const piece3D = findPieceInScene(pieceName);
          if (piece3D) {
            // Reset scaling using Vector3 import that should be available
            piece3D.scaling = new Vector3(1, 1, 1);
            
            // Remove custom hybrid capture handler
            if (piece3D._hybridCaptureHandler) {
              delete piece3D._hybridCaptureHandler;
            }
          }
        });
        this.hybridClickHandlers.clear();
      }
    },

    executeMovementAndCaptures: function(parsedMove) {
      const pieceName = moveNotation.getPieceName(parsedMove.piece);
      const currentPosition = this.piecePositions[pieceName];

      // Find the piece in the 3D scene
      const piece3D = findPieceInScene(pieceName);
      if (!piece3D) {
        displayInfoMessage(`3D piece ${pieceName} not found in scene`);
        return;
      }

      // Find the target cube/square in the 3D scene
      const targetCube = findCubeInScene(parsedMove.destination);
      if (!targetCube) {
        displayInfoMessage(`Target square ${parsedMove.destination} not found in scene`);
        return;
      }

      // Calculate target position and rotation
      const targetPosition = calculateTargetPosition(targetCube);
      const targetRotation = targetCube.rotation.clone();

      // Animate the piece movement
      animatePieceMovement(
        piece3D,
        targetPosition,
        targetRotation,
        30, // duration
        () => {
          // Capture game state BEFORE updating positions for takeback
          const gameStateBeforeMove = {
            piecePositions: JSON.parse(JSON.stringify(this.piecePositions)),
            currentPlayer: this.currentPlayerTurn,
            captureHistory: JSON.parse(JSON.stringify(this.captureHistory)),
            knockedOutTeam: this.knockedOutTeam,
            isPlayAgainState: this.isPlayAgainState,
            gameOver: this.gameOver
          };
          
          // Animation complete callback - update game state
          this.piecePositions[pieceName] = parsedMove.destination;
          
          // Handle captures after animation
          if (parsedMove.victims && parsedMove.victims.length > 0) {
            console.log(`📥 TEXT INPUT: Processing ${parsedMove.victims.length} captures:`, parsedMove.victims);
            for (const victim of parsedMove.victims) {
              const victimPieceName = moveNotation.getPieceName(victim);
              console.log(`📥 TEXT INPUT: Capturing: ${victim} -> ${victimPieceName}`);
              
              if (victimPieceName && this.piecePositions[victimPieceName] !== "captured") {
                this.piecePositions[victimPieceName] = "captured";
                
                // Call the same recordCapture function used by click-based captures
                this.recordCapture(victimPieceName);
                
                // Animate the 3D piece to Owl Halla
                console.log(`📥 TEXT INPUT: Animating piece to Owl Halla: ${victimPieceName}`);
                if (typeof window.animateCapturedPieceToOwlHalla === 'function') {
                  window.animateCapturedPieceToOwlHalla(victimPieceName);
                } else {
                  console.log(`📥 TEXT INPUT: WARNING: animateCapturedPieceToOwlHalla function not available`);
                }
              }
            }
          }

          // Add to move history
          this.addMoveToHistory(pieceName, currentPosition, parsedMove.destination, 
                               parsedMove.victims && parsedMove.victims.length > 0 ? { name: "text_input_capture" } : null,
                               gameStateBeforeMove);
          
          displayInfoMessage(`Executed: ${moveNotation.moveToNotation(parsedMove)}`);
        }
      );
    },

    getAdjacentSquares: function(square) {
      // Helper function - implement based on existing logic in strixGame.js
      console.log(`🔍 getAdjacentSquares called with: ${square}`);
      
      const face = square[0];
      let coords;
      
      // Handle both formats: "g61" and "g6-1"
      if (square.includes('-')) {
        coords = square.substring(1).split("-");
      } else {
        // Parse format like "g61" -> row=6, col=1
        const numberPart = square.substring(1);
        if (numberPart.length >= 2) {
          coords = [numberPart.substring(0, numberPart.length - 1), numberPart.substring(numberPart.length - 1)];
        } else {
          console.log(`❌ Invalid square format: ${square}`);
          return [];
        }
      }
      
      const row = parseInt(coords[0]);
      const col = parseInt(coords[1]);
      
      console.log(`📍 Parsed ${square} -> face: ${face}, row: ${row}, col: ${col}`);
      
      const adjacent = [];
      const directions = [
        [0, 1], [0, -1], [1, 0], [-1, 0]  // right, left, down, up
      ];
      
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 1 && newRow <= 7 && newCol >= 1 && newCol <= 7) {
          // Use the same format as the input square
          const adjacentSquare = square.includes('-') ? 
            `${face}${newRow}-${newCol}` : 
            `${face}${newRow}${newCol}`;
          adjacent.push(adjacentSquare);
        }
      }
      
      console.log(`📋 Adjacent squares to ${square}:`, adjacent);
      return adjacent;
    },

    findPieceAtSquare: function(square) {
      // Convert square format to match stored positions
      // Input: "g62" -> Output: "g6-2" to match stored format
      let normalizedSquare = square;
      if (!square.includes('-') && square.length >= 3) {
        const face = square[0];
        const numbers = square.substring(1);
        if (numbers.length >= 2) {
          const row = numbers.substring(0, numbers.length - 1);
          const col = numbers.substring(numbers.length - 1);
          normalizedSquare = `${face}${row}-${col}`;
        }
      }
      
      console.log(`🔍 findPieceAtSquare: ${square} -> ${normalizedSquare}`);
      
      for (const [pieceName, position] of Object.entries(this.piecePositions)) {
        if (position === normalizedSquare && position !== "captured") {
          console.log(`🎯 Found piece ${pieceName} at ${position}`);
          return pieceName;
        }
      }
      return null;
    },

    executeDirectCapture: function(parsedMove) {
      for (const victim of parsedMove.victims) {
        const victimPieceName = moveNotation.getPieceName(victim);
        if (victimPieceName && this.piecePositions[victimPieceName] !== "captured") {
          this.piecePositions[victimPieceName] = "captured";
          
          // Animate the 3D piece to Owl Halla
          console.log(`📥 DIRECT CAPTURE: Animating piece to Owl Halla: ${victimPieceName}`);
          if (typeof window.animateCapturedPieceToOwlHalla === 'function') {
            window.animateCapturedPieceToOwlHalla(victimPieceName);
          } else {
            console.log(`📥 DIRECT CAPTURE: WARNING: animateCapturedPieceToOwlHalla function not available`);
          }
          
          displayInfoMessage(`Captured: ${victim}`);
        } else {
          displayInfoMessage(`Piece ${victim} not found or already captured`);
        }
      }
      this.updateOwlHallaDisplay();
    },

    executeRestore: function(parsedMove) {
      const pieceName = moveNotation.getPieceName(parsedMove.piece);
      if (pieceName && this.piecePositions[pieceName] === "captured") {
        // TODO: Restore to original position or allow position selection
        displayInfoMessage(`Restore functionality not yet implemented for ${parsedMove.piece}`);
      } else {
        displayInfoMessage(`Piece ${parsedMove.piece} is not in Owl Halla`);
      }
    },

    updateOwlHallaDisplay: function() {
      const capturedPiecesEl = document.getElementById('captured-pieces');
      if (!capturedPiecesEl) return;

      console.log('=== Updating Owl Halla Display ===');
      console.log('Current piece positions:', this.piecePositions);

      const capturedPieces = [];
      for (const [pieceName, position] of Object.entries(this.piecePositions)) {
        if (position === "captured") {
          const notation = moveNotation.getNotationFromPieceName(pieceName);
          console.log(`Found captured piece: ${pieceName} -> ${notation}`);
          if (notation) {
            capturedPieces.push(notation);
          }
        }
      }

      console.log('Captured pieces for display:', capturedPieces);

      // Clear existing content
      capturedPiecesEl.innerHTML = '';
      
      if (capturedPieces.length === 0) {
        capturedPiecesEl.innerHTML = '<span class="empty-message">none</span>';
      } else {
        capturedPieces.forEach(piece => {
          const pieceEl = document.createElement('span');
          pieceEl.className = 'captured-piece';
          pieceEl.textContent = piece;
          pieceEl.title = 'Click to restore (not yet implemented)';
          capturedPiecesEl.appendChild(pieceEl);
        });
      }
    },

    updateMoveHistoryDisplay: function() {
      const moveHistoryEl = document.getElementById('move-history-display');
      if (!moveHistoryEl) return;

      // Clear existing content except for template
      moveHistoryEl.innerHTML = '';

      // Add moves from history
      if (this.moveHistory && this.moveHistory.length > 0) {
        this.moveHistory.forEach((move, index) => {
          const moveEl = document.createElement('div');
          moveEl.className = 'move-entry';
          if (index === this.moveHistory.length - 1) {
            moveEl.classList.add('new-move');
          }

          // Handle both string moves (legacy) and object moves (new format)
          const moveText = typeof move === 'string' ? move : (move.notation || this.formatMoveForDisplay(move));

          moveEl.innerHTML = `
            <span class="move-number">${index + 1}.</span>
            <span class="move-notation">${moveText}</span>
            <button class="takeback-btn" data-move-index="${index}" title="Restore game to this position">↺</button>
          `;

          moveHistoryEl.appendChild(moveEl);
        });

        // Add takeback listeners
        moveHistoryEl.querySelectorAll('.takeback-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            const moveIndex = parseInt(e.target.dataset.moveIndex);
            console.log(`🖱️ Takeback button clicked for move index: ${moveIndex}`);
            this.takebackToMove(moveIndex);
          });
        });
      }
    },

    formatMoveForDisplay: function(move) {
      // Format move for display - convert internal move to notation
      const piece = moveNotation.getNotationFromPieceName(move.piece);
      const destination = move.destination;
      const captures = move.capturedPiece ? ' x ??' : '';
      return `${piece}-${destination}${captures}`;
    },

    takebackToMove: function(moveIndex) {
      console.log(`🔄 Taking back to move ${moveIndex + 1}`);
      console.log(`📊 Current move history length: ${this.moveHistory.length}`);
      console.log(`📊 Current moveHistory:`, this.moveHistory);
      
      if (moveIndex < 0 || moveIndex >= this.moveHistory.length) {
        console.log(`❌ Invalid move index: ${moveIndex} (length: ${this.moveHistory.length})`);
        displayInfoMessage(`Invalid move index: ${moveIndex + 1}`);
        return;
      }
      
      const targetMove = this.moveHistory[moveIndex];
      console.log(`🎯 Target move:`, targetMove);
      
      // Handle legacy string format moves
      if (typeof targetMove === 'string') {
        console.log(`❌ Legacy string format move: ${targetMove}`);
        displayInfoMessage('Cannot takeback to legacy move format');
        return;
      }
      
      if (!targetMove.gameState) {
        console.log(`❌ No game state in target move:`, targetMove);
        displayInfoMessage('No game state saved for this move');
        return;
      }
      
      console.log(`📍 Restoring game state to move ${moveIndex + 1}: ${targetMove.notation}`);
      console.log(`📊 Target game state:`, targetMove.gameState);
      
      // Store current positions for animation
      const currentPositions = JSON.parse(JSON.stringify(this.piecePositions));
      console.log(`📊 Current positions before restore:`, currentPositions);
      console.log(`📊 Target positions after restore:`, targetMove.gameState.piecePositions);
      
      // Restore the game state
      this.piecePositions = JSON.parse(JSON.stringify(targetMove.gameState.piecePositions));
      this.currentPlayerTurn = targetMove.gameState.currentPlayer;
      this.captureHistory = JSON.parse(JSON.stringify(targetMove.gameState.captureHistory));
      this.knockedOutTeam = targetMove.gameState.knockedOutTeam;
      this.isPlayAgainState = targetMove.gameState.isPlayAgainState;
      this.gameOver = targetMove.gameState.gameOver;
      
      // Pause AI game temporarily to prevent immediate AI move after takeback
      const wasAIGameRunning = this.aiGameRunning;
      if (this.aiGameRunning) {
        console.log('🔄 Temporarily pausing AI game during takeback');
        this.aiGamePaused = true;
      }
      
      console.log(`✅ Game state restored. New current player: ${this.currentPlayerTurn}`);
      
      // Truncate move history to the target move
      const oldHistoryLength = this.moveHistory.length;
      this.moveHistory = this.moveHistory.slice(0, moveIndex + 1);
      console.log(`✂️ Truncated move history from ${oldHistoryLength} to ${this.moveHistory.length} moves`);
      
      // Animate all pieces to their restored positions
      this.animatePiecesToRestoredPositions(currentPositions, this.piecePositions);
      
      // Update all displays
      this.updateMoveHistoryDisplay();
      this.updateOwlHallaDisplay();
      this.updateNextPlayerDisplay();
      
      // Resume AI game after a short delay to allow animation to complete
      if (wasAIGameRunning) {
        setTimeout(() => {
          console.log('🔄 Resuming AI game after takeback animation');
          this.aiGamePaused = false;
          
          // Only trigger AI move if current player is AI
          if (this.isAIPlayer(this.currentPlayerTurn)) {
            console.log(`🤖 Current player ${this.currentPlayerTurn} is AI - triggering move`);
            this.proceedToNextTurn();
          } else {
            console.log(`👤 Current player ${this.currentPlayerTurn} is human - waiting for input`);
          }
        }, 1000); // Wait 1 second for animation to complete
      }
      
      displayInfoMessage(`Restored to move ${moveIndex + 1}: ${targetMove.notation}`);
    },

    animatePiecesToRestoredPositions: function(fromPositions, toPositions) {
      console.log('🎬 Animating pieces to restored positions');
      console.log('📊 From positions:', fromPositions);
      console.log('📊 To positions:', toPositions);
      
      let changesFound = 0;
      
      // Animate each piece that has changed position
      for (const [pieceName, toPosition] of Object.entries(toPositions)) {
        const fromPosition = fromPositions[pieceName];
        
        if (fromPosition !== toPosition) {
          changesFound++;
          console.log(`📍 Change #${changesFound}: ${pieceName}: ${fromPosition} → ${toPosition}`);
          
          const piece3D = findPieceInScene(pieceName);
          if (!piece3D) {
            console.log(`❌ Could not find 3D piece: ${pieceName}`);
            continue;
          }
          
          if (toPosition === "captured") {
            console.log(`🎯 ${pieceName} should go to Owl Halla`);
            // Piece should be in Owl Halla - animate to Owl Halla
            if (typeof window.animateCapturedPieceToOwlHalla === 'function') {
              window.animateCapturedPieceToOwlHalla(pieceName);
            } else {
              console.log(`❌ animateCapturedPieceToOwlHalla function not available for ${pieceName}`);
              piece3D.setEnabled(false);
            }
          } else if (fromPosition === "captured") {
            console.log(`🎯 ${pieceName} should come back from Owl Halla to ${toPosition}`);
            // Piece is coming back from Owl Halla - make visible and animate to board
            piece3D.setEnabled(true);
            piece3D.visibility = true;
            this.animatePieceToBoard(pieceName, toPosition);
          } else {
            console.log(`🎯 ${pieceName} should move from ${fromPosition} to ${toPosition}`);
            // Regular board-to-board move
            this.animatePieceToBoard(pieceName, toPosition);
          }
        } else {
          console.log(`⏸️ ${pieceName} stays at ${toPosition} (no change)`);
        }
      }
      
      console.log(`📊 Total position changes found: ${changesFound}`);
    },

    animatePieceToBoard: function(pieceName, targetSquare) {
      console.log(`🎬 animatePieceToBoard called: ${pieceName} → ${targetSquare}`);
      
      const piece3D = findPieceInScene(pieceName);
      if (!piece3D) {
        console.log(`❌ Could not find 3D piece for animation: ${pieceName}`);
        return;
      }
      console.log(`✅ Found 3D piece: ${pieceName}`);
      
      // Find target cube and calculate position
      const targetCube = findCubeInScene(targetSquare);
      if (!targetCube) {
        console.log(`❌ Could not find target cube: ${targetSquare}`);
        return;
      }
      console.log(`✅ Found target cube: ${targetSquare}`);
      
      const targetPosition = calculateTargetPosition(targetCube);
      const targetRotation = targetCube.rotation.clone();
      
      console.log(`🎬 Starting animation for ${pieceName} to board position: ${targetSquare}`);
      console.log(`📍 Target position:`, targetPosition);
      
      if (typeof animatePieceMovement === 'function') {
        animatePieceMovement(
          piece3D,
          targetPosition,
          targetRotation,
          20, // Faster animation for takeback
          () => {
            console.log(`✅ ${pieceName} animation to ${targetSquare} complete`);
          }
        );
      } else {
        console.log(`❌ animatePieceMovement function not available`);
        // Fallback: instant position change
        piece3D.position = targetPosition;
        piece3D.rotation = targetRotation;
      }
    },

    getRecentCaptures: function() {
      const captured = [];
      for (const [pieceName, position] of Object.entries(this.piecePositions)) {
        if (position === "captured") {
          captured.push(pieceName);
        }
      }
      return captured;
    },

    displayInfoMessage: displayInfoMessage,
  };
}
