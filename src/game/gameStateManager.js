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
  moveHistoryContainer.width = "100px";
  moveHistoryContainer.height = "200px";
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

    currentPlayerTurn: "brown",



  
    addMoveToHistory: function (piece, sourceSquare, destinationSquare) {
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

      const formattedDestination = destinationSquare.replace("-", "");

      this.moveHistory.push(`${abbreviatedPiece} - ${formattedDestination}`);

      // Extract the color of the piece from the recorded move
      const moveColor = this.moveHistory[this.moveHistory.length - 1].charAt(0);

      // Determine the next player's turn based on the color of the current move
      if (moveColor === "b") {
        this.currentPlayerTurn = "yellow";
      } else if (moveColor === "y") {
        this.currentPlayerTurn = "green";
      } else if (moveColor === "g") {
        this.currentPlayerTurn = "brown";
      }

      this.updateMoveHistoryDisplay();
      this.updateNextPlayerDisplay(); // Add this line to update the next player display
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

  nextPlayerText = new TextBlock("nextPlayerText");
  nextPlayerText.text = `${this.currentPlayerTurn.charAt(0).toUpperCase() + this.currentPlayerTurn.slice(1)} to play`;
  nextPlayerText.color = "white";
  nextPlayerText.fontSize = 16;
  nextPlayerText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  nextPlayerText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
  nextPlayerRect.addControl(nextPlayerText);
},
    displayInfoMessage: displayInfoMessage,
  };
}
