import {
  AdvancedDynamicTexture,
  TextBlock,
  Rectangle,
  Control,
  ScrollViewer,
  TextWrapping,
} from "@babylonjs/gui";

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

    // Here is the function for add moves to the move history window

    addMoveToHistory: function (
      piece,
      sourceSquare,
      destinationSquare,
      capturedPiece
    ) {
      let abbreviatedPiece = "";
      switch (piece) {
        case "brownOwl":
          abbreviatedPiece = "bO";
          break;
        case "brownKite":
          abbreviatedPiece = "bK";
          break;
        case "brownRaven":
          abbreviatedPiece = "bR";
          break;
        case "yellowOwl":
          abbreviatedPiece = "yO";
          break;
        case "yellowKite":
          abbreviatedPiece = "yK";
          break;
        case "yellowRaven":
          abbreviatedPiece = "yR";
          break;
        case "greenOwl":
          abbreviatedPiece = "gO";
          break;
        case "greenKite":
          abbreviatedPiece = "gK";
          break;
        case "greenRaven":
          abbreviatedPiece = "gR";
          break;
      }

      let moveText = `${abbreviatedPiece}`;

      if (destinationSquare) {
        const formattedDestination = destinationSquare.replace("-", "");
        moveText += `-${formattedDestination}`;
        this.moveHistory.push(moveText);

        // Advance to the next player's turn
        this.updateNextPlayer();
      }


      if (capturedPiece) {
        let abbreviatedCapturedPiece = "";
        switch (capturedPiece) {
          case "brownOwl":
            abbreviatedCapturedPiece = "bO";
            break;
          case "brownKite":
            abbreviatedCapturedPiece = "bK";
            break;
          case "brownRaven":
            abbreviatedCapturedPiece = "bR";
            break;
          case "yellowOwl":
            abbreviatedCapturedPiece = "yO";
            break;
          case "yellowKite":
            abbreviatedCapturedPiece = "yK";
            break;
          case "yellowRaven":
            abbreviatedCapturedPiece = "yR";
            break;
          case "greenOwl":
            abbreviatedCapturedPiece = "gO";
            break;
          case "greenKite":
            abbreviatedCapturedPiece = "gK";
            break;
          case "greenRaven":
            abbreviatedCapturedPiece = "gR";
            break;
        }

        const captureText = `${abbreviatedCapturedPiece} captured`;
        this.moveHistory.push(captureText);

        // Check if the captured piece is an Owl
        if (capturedPiece.includes("Owl")) {
          // Remove the knocked-out team from the sequence of moves
          this.knockedOutTeam = capturedPiece.split("Owl")[0];
        }
      }
      // Update the next player's turn
     // this.updateNextPlayer();

      this.updateMoveHistoryDisplay();
    },

    updateNextPlayer: function () {
      const teams = ["brown", "yellow", "green"];
      let currentTeamIndex = teams.indexOf(this.currentPlayerTurn);
      let nextTeamIndex = (currentTeamIndex + 1) % teams.length;

      // Skip the knocked-out team
      while (teams[nextTeamIndex] === this.knockedOutTeam) {
        nextTeamIndex = (nextTeamIndex + 1) % teams.length;
      }

      this.currentPlayerTurn = teams[nextTeamIndex];
      this.updateNextPlayerDisplay();
    },

    updateMoveHistoryDisplay: function () {
      const moveHistoryText =
        moveHistoryViewer.getChildByName("moveHistoryText");
      moveHistoryText.text = this.moveHistory.join("\n");
    },

    updateNextPlayerDisplay: function () {
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

      const nextPlayerColor = this.currentPlayerTurn;

      nextPlayerText = new TextBlock("nextPlayerText");
      nextPlayerText.text = `${
        nextPlayerColor.charAt(0).toUpperCase() + nextPlayerColor.slice(1)
      } to play`;
      nextPlayerText.color = "white";
      nextPlayerText.fontSize = 16;
      nextPlayerText.textHorizontalAlignment =
        Control.HORIZONTAL_ALIGNMENT_CENTER;
      nextPlayerText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      nextPlayerRect.addControl(nextPlayerText);
    },

    displayInfoMessage: displayInfoMessage,
  };
}
