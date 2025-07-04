// EXPORT CONTROLLER MODULE
// Handles UI interactions for game export functionality

export function createExportController(gameStateManager) {
  let selectedFormat = 'sgn'; // Default export format
  
  return {
    // Initialize export controls
    initializeExportControls: function() {
      console.log("Initializing export controls...");
      
      // Get export control elements
      const exportSgnBtn = document.getElementById('export-sgn-btn');
      const exportTxtBtn = document.getElementById('export-txt-btn');
      const exportJsonBtn = document.getElementById('export-json-btn');
      const copyGameBtn = document.getElementById('copy-game-btn');
      const saveGameBtn = document.getElementById('save-game-btn');
      
      if (!exportSgnBtn || !exportTxtBtn || !exportJsonBtn || !copyGameBtn || !saveGameBtn) {
        console.log("Export control elements not found - skipping initialization");
        return;
      }
      
      // Set initial active format
      exportSgnBtn.classList.add('active');
      
      // Format selection handlers
      exportSgnBtn.addEventListener('click', () => this.selectFormat('sgn'));
      exportTxtBtn.addEventListener('click', () => this.selectFormat('txt'));
      exportJsonBtn.addEventListener('click', () => this.selectFormat('json'));
      
      // Action handlers
      copyGameBtn.addEventListener('click', () => this.copyGame());
      saveGameBtn.addEventListener('click', () => this.saveGame());
      
      console.log("Export controls initialized successfully");
    },
    
    // Select export format
    selectFormat: function(format) {
      console.log(`Selecting export format: ${format}`);
      selectedFormat = format;
      
      // Update button states
      const buttons = document.querySelectorAll('.export-buttons .small-button');
      buttons.forEach(btn => btn.classList.remove('active'));
      
      const activeButton = document.getElementById(`export-${format}-btn`);
      if (activeButton) {
        activeButton.classList.add('active');
      }
    },
    
    // Copy game in selected format
    copyGame: function() {
      console.log(`Copying game in ${selectedFormat} format...`);
      
      if (!gameStateManager || !gameStateManager.copyGameToClipboard) {
        console.error("Game state manager or copy function not available");
        this.showMessage("Export functionality not available", "error");
        return;
      }
      
      // Check if there are moves to export
      if (!gameStateManager.moveHistory || gameStateManager.moveHistory.length === 0) {
        this.showMessage("No moves to export yet", "warning");
        return;
      }
      
      try {
        gameStateManager.copyGameToClipboard(selectedFormat);
        this.showMessage(`Game copied to clipboard as ${selectedFormat.toUpperCase()}!`, "success");
      } catch (error) {
        console.error("Error copying game:", error);
        this.showMessage("Failed to copy game to clipboard", "error");
      }
    },
    
    // Save game in selected format
    saveGame: function() {
      console.log(`Saving game in ${selectedFormat} format...`);
      
      if (!gameStateManager || !gameStateManager.saveGameToFile) {
        console.error("Game state manager or save function not available");
        this.showMessage("Export functionality not available", "error");
        return;
      }
      
      // Check if there are moves to export
      if (!gameStateManager.moveHistory || gameStateManager.moveHistory.length === 0) {
        this.showMessage("No moves to save yet", "warning");
        return;
      }
      
      try {
        gameStateManager.saveGameToFile(selectedFormat);
        this.showMessage(`Game saved as ${selectedFormat.toUpperCase()} file!`, "success");
      } catch (error) {
        console.error("Error saving game:", error);
        this.showMessage("Failed to save game file", "error");
      }
    },
    
    // Show message to user
    showMessage: function(message, type = "info") {
      console.log(`${type.toUpperCase()}: ${message}`);
      
      // Try to use the game's info message system
      if (gameStateManager && gameStateManager.displayInfoMessage) {
        gameStateManager.displayInfoMessage(message);
      } else {
        // Fallback to simple alert or console
        if (type === "error") {
          alert(`Error: ${message}`);
        } else {
          console.log(message);
        }
      }
    },
    
    // Generate preview of export format
    previewExport: function(format = selectedFormat) {
      console.log(`Generating preview for ${format} format...`);
      
      if (!gameStateManager) {
        console.error("Game state manager not available");
        return "Export functionality not available";
      }
      
      try {
        switch (format) {
          case 'sgn':
            return gameStateManager.exportToSGN ? gameStateManager.exportToSGN() : "SGN export not available";
          case 'txt':
            return gameStateManager.exportToSimpleText ? gameStateManager.exportToSimpleText() : "Text export not available";
          case 'json':
            return gameStateManager.exportToJSON ? gameStateManager.exportToJSON() : "JSON export not available";
          default:
            return "Unknown format";
        }
      } catch (error) {
        console.error("Error generating export preview:", error);
        return `Error generating ${format} preview: ${error.message}`;
      }
    },
    
    // Enable/disable export controls based on game state
    updateExportState: function() {
      const copyBtn = document.getElementById('copy-game-btn');
      const saveBtn = document.getElementById('save-game-btn');
      
      if (!copyBtn || !saveBtn) return;
      
      const hasMovesToExport = gameStateManager && 
                              gameStateManager.moveHistory && 
                              gameStateManager.moveHistory.length > 0;
      
      copyBtn.disabled = !hasMovesToExport;
      saveBtn.disabled = !hasMovesToExport;
      
      // Update button appearance
      if (hasMovesToExport) {
        copyBtn.classList.remove('disabled');
        saveBtn.classList.remove('disabled');
      } else {
        copyBtn.classList.add('disabled');
        saveBtn.classList.add('disabled');
      }
    },
    
    // Get current selected format
    getSelectedFormat: function() {
      return selectedFormat;
    }
  };
}