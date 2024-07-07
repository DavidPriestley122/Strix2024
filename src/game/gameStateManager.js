import {
  AdvancedDynamicTexture,
  TextBlock,
  Rectangle,
  Control,
  ScrollViewer,
  TextWrapping,
  Button,
} from "@babylonjs/gui";

import { ActionManager, ExecuteCodeAction } from "@babylonjs/core";


export function createGUI(scene) {
  const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

  // Create dynamic text object to display information
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

  // Create a container for the move history
  const moveHistoryContainer = new Rectangle("moveHistoryContainer");
  moveHistoryContainer.width = "120px";
  moveHistoryContainer.height = "220px";
  moveHistoryContainer.background = "rgba(0, 0, 0, 0.7)";
  moveHistoryContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  moveHistoryContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  moveHistoryContainer.top = "80px";
  moveHistoryContainer.left = "20px";
  advancedTexture.addControl(moveHistoryContainer);

  // Create a scroll viewer for the move history
  const moveHistoryViewer = new ScrollViewer("moveHistoryViewer");
  moveHistoryViewer.width = "100%";
  moveHistoryViewer.height = "100%";
  moveHistoryContainer.addControl(moveHistoryViewer);

  // Create a text block to display the move history
  const moveHistoryText = new TextBlock("moveHistoryText");
  moveHistoryText.text = "";
  moveHistoryText.color = "white";
  moveHistoryText.fontSize = 16;
  moveHistoryText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  moveHistoryText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  moveHistoryText.resizeToFit = true;
  moveHistoryText.textWrapping = TextWrapping.WordWrap;
  moveHistoryViewer.addControl(moveHistoryText);

  return {
    advancedTexture,
    infoText,
    messageRect,
    messageText,
    moveHistoryContainer,
    moveHistoryViewer,
    moveHistoryText,
  };
}

export function createGameStateManager(guiElements) {
  const {
    moveHistoryViewer,
    moveHistoryText,
    messageText,
    messageRect,
    advancedTexture,
  } = guiElements;

  let nextPlayerText = null; // Variable to store the reference to nextPlayerText control

  function displayInfoMessage(message) {
    messageText.text = message;
    messageRect.isVisible = true;

    setTimeout(function () {
      messageRect.isVisible = false;
    }, 2000);
  }

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

        // Skip the excluded piece and pieces on owlHalla squares
        if (pieceName === excludedPiece || piecePosition.includes("--")) {
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

    moveHistory: [],

    knockedOutTeam: null,

    currentPlayerTurn: "brown",

    owlHallaHistory: [],

    lastMove: null,

    justCancelledRetraction:false,

    isPlayAgainState: false,

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

    reinstateTeam: function (piece) {
      if (
        piece.includes("Owl") &&
        this.knockedOutTeam === piece.split("Owl")[0]
      ) {
        this.knockedOutTeam = null;
        console.log(
          `${piece.split("Owl")[0]} team reinstated in turn sequence`
        );
      }
    },

    addMoveToHistory: function (piece, sourceSquare, destinationSquare) {
      const abbreviatedPiece = this.abbreviatePiece(piece);
      const moveText = `${abbreviatedPiece}-${destinationSquare.replace(
        "-",
        ""
      )}`;
      this.moveHistory.push(moveText);
      this.lastMove = { piece, sourceSquare, destinationSquare };
      this.isPlayAgainState = false; // Reset the flag
      this.updateNextPlayer();
      this.updateMoveHistoryDisplay();
      this.updateNextPlayerDisplay(); // Add this line to ensure the display is updated
      console.log("Move added to history, next player updated to:", this.currentPlayerTurn);
    },

    addOwlHallaMove: function (piece, isGoingToOwlHalla) {
      const abbreviatedPiece = this.abbreviatePiece(piece);
      const moveText = isGoingToOwlHalla
        ? `${abbreviatedPiece} to owlHalla`
        : `${abbreviatedPiece} from owlHalla`;
      this.owlHallaHistory.push(moveText);

      if (isGoingToOwlHalla && piece.includes("Owl")) {
        // Remove the knocked-out team from the sequence of moves
        this.knockedOutTeam = piece.split("Owl")[0];
        console.log(`${this.knockedOutTeam} team knocked out of turn sequence`);
      } else if (!isGoingToOwlHalla) {
        // Potentially reinstate the team when a piece returns from owlHalla
        this.reinstateTeam(piece);
      }

      this.updateMoveHistoryDisplay();
    },

    updateNextPlayer: function () {
      const teams = ["brown", "yellow", "green"];
      let currentTeamIndex = teams.indexOf(this.currentPlayerTurn);
      let nextTeamIndex;

      do {
        nextTeamIndex = (currentTeamIndex + 1) % teams.length;
        currentTeamIndex = nextTeamIndex;
      } while (teams[nextTeamIndex] === this.knockedOutTeam);

      this.currentPlayerTurn = teams[nextTeamIndex];
      console.log("Updated to next player:", this.currentPlayerTurn);
      this.updateNextPlayerDisplay();
    },

    isPotentialRetraction: function(pieceName) {
      const isPotential = this.lastMove && this.lastMove.piece === pieceName && !this.justCancelledRetraction;
      console.log("isPotentialRetraction check for", pieceName, ":", isPotential);
      console.log("Current justCancelledRetraction value:", this.justCancelledRetraction);
      return isPotential;
  },

  showRetractionConfirmation: function(piece, onRetract) {
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
    confirmationText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    confirmationText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    confirmationText.top = "20px";
    confirmationRect.addControl(confirmationText);

    const retractButton = Button.CreateSimpleButton("retractButton", "Retract Move");
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
        this.justCancelledRetraction = true;  // Set the flag
        console.log("Retraction cancelled. justCancelledRetraction set to:", this.justCancelledRetraction);
        // Do nothing else, just close the window
    });
    confirmationRect.addControl(cancelButton);
},

getColorFromPieceName: function(pieceName) {
  if (pieceName.startsWith('brown')) return 'brown';
  if (pieceName.startsWith('yellow')) return 'yellow';
  if (pieceName.startsWith('green')) return 'green';
  console.error('Unknown piece color:', pieceName);
  return 'unknown';
},

retractMove: function() {
  if (this.lastMove) {
      this.piecePositions[this.lastMove.piece] = this.lastMove.sourceSquare;
      this.moveHistory.pop();
      this.currentPlayerTurn = this.getColorFromPieceName(this.lastMove.piece);
      this.isPlayAgainState = true;
      this.lastMove = null;
      this.updateMoveHistoryDisplay();
      this.updateNextPlayerDisplay();
      console.log("Move retracted, player turn reverted to:", this.currentPlayerTurn);
  }
},


    // Add this new function
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

    updateMoveHistoryDisplay: function () {
      const moveHistoryText =
        moveHistoryViewer.getChildByName("moveHistoryText");

      // Combine main moves and owlHalla moves
      const combinedHistory = [];
      let mainIndex = 0;
      let owlHallaIndex = 0;

      while (
        mainIndex < this.moveHistory.length ||
        owlHallaIndex < this.owlHallaHistory.length
      ) {
        if (mainIndex < this.moveHistory.length) {
          combinedHistory.push(this.moveHistory[mainIndex]);
          mainIndex++;
        }
        if (owlHallaIndex < this.owlHallaHistory.length) {
          combinedHistory.push(this.owlHallaHistory[owlHallaIndex]);
          owlHallaIndex++;
        }
      }

      moveHistoryText.text = combinedHistory.join("\n");
    },

    updateNextPlayerDisplay: function() {
      if (nextPlayerText) {
          advancedTexture.removeControl(nextPlayerText);
      }
  
      const nextPlayerRect = new Rectangle("nextPlayerRect");
      nextPlayerRect.width = "150px";
      nextPlayerRect.height = "40px";
      nextPlayerRect.cornerRadius = 10;
      nextPlayerRect.color = "white";
      nextPlayerRect.thickness = 2;
      nextPlayerRect.background = "rgba(0, 0, 0, 0.7)";
      nextPlayerRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      nextPlayerRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      nextPlayerRect.left = "20px";
      nextPlayerRect.top = "-20px";
      advancedTexture.addControl(nextPlayerRect);
  
      const playerColor = this.currentPlayerTurn;
  
      nextPlayerText = new TextBlock("nextPlayerText");
      nextPlayerText.text = this.isPlayAgainState
          ? `${playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} to play again`
          : `${playerColor.charAt(0).toUpperCase() + playerColor.slice(1)} to play`;
      nextPlayerText.color = "white";
      nextPlayerText.fontSize = 16;
      nextPlayerText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      nextPlayerText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      nextPlayerRect.addControl(nextPlayerText);
  
      console.log("Updated player turn display:", nextPlayerText.text);
  },

    displayInfoMessage: displayInfoMessage,
  };
}
