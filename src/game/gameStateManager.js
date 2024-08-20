//IMPORT STATEMENTS

import {
  AdvancedDynamicTexture,
  TextBlock,
  Rectangle,
  Control,
  ScrollViewer,
  TextWrapping,
  Button,
} from "@babylonjs/gui";

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

  //MOVE HISTORY DISPLAY CREATION
  const moveHistoryContainer = new Rectangle("moveHistoryContainer");
  moveHistoryContainer.width = "120px";
  moveHistoryContainer.height = "220px";
  moveHistoryContainer.background = "rgba(0, 0, 0, 0.7)";
  moveHistoryContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  moveHistoryContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  moveHistoryContainer.top = "80px";
  moveHistoryContainer.left = "20px";
  advancedTexture.addControl(moveHistoryContainer);

  const moveHistoryViewer = new ScrollViewer("moveHistoryViewer");
  moveHistoryViewer.width = "100%";
  moveHistoryViewer.height = "100%";
  moveHistoryContainer.addControl(moveHistoryViewer);

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

//GAME STATE MANAGER CREATION
export function createGameStateManager(guiElements) {
  const { moveHistoryViewer, messageText, messageRect, advancedTexture } =
    guiElements;

  let nextPlayerText = null; // Variable to store the reference to nextPlayerText control

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

    //MOVE HISTORY MANAGEMENT

    moveHistory: [],
    captureHistory: [],
    retractionHistory: [],
    lastMove: null,
    gameOver: false,

    addMoveToHistory: function (piece, sourceSquare, destinationSquare) {
      const pieceNotation = this.abbreviatePiece(piece);
      const moveText = `${pieceNotation}-${destinationSquare.replace("-", "")}`;
      this.moveHistory.push(moveText);

      // Check for winning conditions
      const winningMessage = this.checkWinningConditions(
        piece,
        destinationSquare
      );
      if (winningMessage) {
        this.moveHistory.push(winningMessage);
        this.gameOver = true;
      }

      // Update game state
      this.lastMove = { piece, sourceSquare, destinationSquare, moveText };
      this.isPlayAgainState = false;
      this.updateNextPlayer();
      this.updateMoveHistoryDisplay();
      this.updateNextPlayerDisplay();
    },

    recordCapture: function (capturedPiece) {
      const abbreviatedCaptured = this.abbreviatePiece(capturedPiece);
      const captureText = `(${abbreviatedCaptured} captured)`;

      // Add to captureHistory
      this.captureHistory.push({
        moveIndex: this.moveHistory.length - 1, // Associate with the last move
        text: captureText,
      });

      // Update the piece positions
      this.piecePositions[capturedPiece] = "captured";

      // Check if the captured piece is an Owl
      if (capturedPiece.includes("Owl")) {
        // Set the knocked out team
        this.knockedOutTeam = this.getColorFromPieceName(capturedPiece);

        // Update the next player, skipping the knocked-out team
        this.updateNextPlayer();
      }

      // Check for winning condition after capture
      const winningMessage = this.checkWinningConditions(
        capturedPiece,
        "captured"
      );
      if (winningMessage) {
        this.moveHistory.push(winningMessage);
        this.gameOver = true;
      }

      // Update the last move to include the capture information
      if (this.lastMove) {
        this.lastMove.capturedPiece = capturedPiece;
      }

      this.updateMoveHistoryDisplay();
      this.updateNextPlayerDisplay();
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

    updateNextPlayer: function () {
      const teams = ["brown", "yellow", "green"];
      let currentTeamIndex = teams.indexOf(this.currentPlayerTurn);
      let nextTeamIndex;

      do {
        nextTeamIndex = (currentTeamIndex + 1) % teams.length;
        currentTeamIndex = nextTeamIndex;
      } while (teams[nextTeamIndex] === this.knockedOutTeam);

      this.currentPlayerTurn = teams[nextTeamIndex];

      this.updateNextPlayerDisplay();
    },

    reinstateTeam: function (piece) {
      if (
        piece.includes("Owl") &&
        this.knockedOutTeam === piece.split("Owl")[0]
      ) {
        this.knockedOutTeam = null;
      }
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
      if (nextPlayerText) {
        advancedTexture.removeControl(nextPlayerText);
      }

      const nextPlayerRect = new Rectangle("nextPlayerRect");
      nextPlayerRect.width = "150px";
      nextPlayerRect.height = "40px";
      nextPlayerRect.cornerRadius = 1;
      nextPlayerRect.color = "white";
      nextPlayerRect.thickness = 2;
      nextPlayerRect.background = "rgba(0, 0, 0, 0.7)";
      nextPlayerRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      nextPlayerRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      nextPlayerRect.left = "20px";
      nextPlayerRect.top = "-20px";
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

    displayInfoMessage: displayInfoMessage,
  };
}
