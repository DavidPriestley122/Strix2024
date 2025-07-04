// EXPORT FUNCTIONALITY TEST
// Simple test to verify the export system works correctly

import { createGameExportManager } from "../managers/gameExportManager.js";

// Mock game state for testing
const mockGameState = {
  piecePositions: {
    brownOwl: "b7-7",
    brownKite: "b6-2", 
    brownRaven: "b5-3",
    yellowOwl: "y7-1",
    yellowKite: "g2-5",
    yellowRaven: "captured",
    greenOwl: "g7-1",
    greenKite: "captured", 
    greenRaven: "g5-3"
  },
  
  moveHistory: [
    {
      notation: "bO-b72",
      piece: "brownOwl",
      from: "b7-1",
      to: "b7-2",
      captured: null,
      moveNumber: 1
    },
    {
      notation: "yK-g25 x yR",
      piece: "yellowKite", 
      from: "y6-2",
      to: "g2-5",
      captured: "yellowRaven",
      moveNumber: 2
    },
    {
      notation: "gO-g71",
      piece: "greenOwl",
      from: "g7-1", 
      to: "g7-1",
      captured: null,
      moveNumber: 3
    },
    {
      notation: "bR-b53 x gK", 
      piece: "brownRaven",
      from: "b5-3",
      to: "b5-3",
      captured: "greenKite",
      moveNumber: 4
    },
    {
      notation: "yO-y74",
      piece: "yellowOwl",
      from: "y7-1",
      to: "y7-4", 
      captured: null,
      moveNumber: 5
    },
    {
      notation: "restore bR",
      type: "restore",
      moveNumber: 6
    },
    {
      notation: "bO-b77",
      piece: "brownOwl",
      from: "b7-2",
      to: "b7-7",
      captured: null,
      moveNumber: 7
    },
    "Brown wins"
  ],
  
  captureHistory: [
    {
      moveIndex: 1,
      text: "yR captured"
    },
    {
      moveIndex: 3, 
      text: "gK captured"
    }
  ],
  
  currentPlayerTurn: "brown",
  gameOver: true,
  knockedOutTeam: null,
  playerTypes: {
    brown: "human",
    yellow: "computer", 
    green: "human"
  },
  
  displayInfoMessage: function(message) {
    console.log("INFO:", message);
  }
};

// Test the export functionality
export function testExportFunctionality() {
  console.log("=== Testing Strix Game Export Functionality ===");
  
  // Create export manager
  const exportManager = createGameExportManager(mockGameState);
  
  // Initialize game
  exportManager.initializeGame();
  
  // Set some metadata
  exportManager.setMetadata("event", "Test Game");
  exportManager.setMetadata("round", "Test Round");
  
  // Finalize game
  exportManager.finalizeGame();
  
  console.log("\n1. Testing SGN Export:");
  const sgnExport = exportManager.exportToSGN();
  console.log(sgnExport);
  
  console.log("\n2. Testing Simple Text Export:");
  const textExport = exportManager.exportToSimpleText();
  console.log(textExport);
  
  console.log("\n3. Testing JSON Export:");
  const jsonExport = exportManager.exportToJSON();
  console.log(jsonExport);
  
  console.log("\n=== Export Test Complete ===");
  
  return {
    sgn: sgnExport,
    text: textExport,
    json: JSON.parse(jsonExport)
  };
}

// Example usage for integration testing
export function demonstrateExportFormats() {
  const exports = testExportFunctionality();
  
  // Show examples of each format
  console.log("\n=== Export Format Examples ===");
  
  console.log("\nSGN Format (recommended for sharing):");
  console.log("- Compact and readable");
  console.log("- Similar to chess PGN"); 
  console.log("- Contains all essential game data");
  
  console.log("\nText Format (for casual sharing):");
  console.log("- Simple and human-readable");
  console.log("- Good for emails or messaging");
  console.log("- No special formatting required");
  
  console.log("\nJSON Format (for analysis):");
  console.log("- Complete structured data");
  console.log("- Perfect for programmatic use");
  console.log("- Includes all game state information");
  
  return exports;
}

// Export the test functions for use in the browser console
if (typeof window !== 'undefined') {
  window.testStrixExport = testExportFunctionality;
  window.demonstrateStrixExportFormats = demonstrateExportFormats;
}