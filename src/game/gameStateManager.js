




export var gameStateManager = {

    

    piecePositions: {
        brownOwl: "b7-1",
        brownKite: "b6-2",
        brownRaven: "b5-3",
        yellowOwl: "y7-1",
        yellowKite: "y6-2",
        yellowRaven: "y5-3",
        greenOwl: "g7-1",
        greenKite: "g6-2",
        greenRaven: "g5-3"
    },



    updateShadowedRows: function (excludedPiece) {
        // Reset shadowed rows
        this.shadowedRows = {
            b: [],
            y: [],
            g: []
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
            if (boardColor === 'b') {
                // Generate shadowed rows for yellow board
                for (let i = 1; i <= 7; i++) {
                    this.shadowedRows.y.push(`y${column}-${i}`);
                }
                // Generate shadowed columns for green board
                for (let i = 1; i <= 7; i++) {
                    this.shadowedRows.g.push(`g${i}-${row}`);
                }
            } else if (boardColor === 'y') {
                // Generate shadowed rows for brown board
                for (let i = 1; i <= 7; i++) {
                    this.shadowedRows.b.push(`b${i}-${row}`);
                }
                // Generate shadowed columns for green board
                for (let i = 1; i <= 7; i++) {
                    this.shadowedRows.g.push(`g${column}-${i}`);
                }
            } else if (boardColor === 'g') {
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

    addMoveToHistory: function (piece, sourceSquare, destinationSquare) {
        var abbreviatedPiece = "";
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

        var formattedDestination = destinationSquare.replace("-", "");

        this.moveHistory.push(`${abbreviatedPiece} - ${formattedDestination}`);

        this.updateMoveHistoryDisplay();
    },

    updateMoveHistoryDisplay: function () {
        var moveHistoryText = moveHistoryViewer.getChildByName("moveHistoryText");
        moveHistoryText.text = this.moveHistory.join("\n");
    },

  // Add a method to set the moveHistoryText
  setMoveHistoryText: function(moveHistoryText) {
    this.moveHistoryText = moveHistoryText;
  }


}