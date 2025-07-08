// flightwayUtils.js - Clean flightway system utilities for Strix

/**
 * Convert square notation to flightway coordinates
 * @param {string} square - Square in format "b3-4"
 * @returns {string} - Flightway coordinates in format "b4g3"
 */
export function convertToFlightway(square) {
  if (!square || typeof square !== "string") return null;

  const face = square[0];
  const coords = square.substring(1).split("-");
  const row = parseInt(coords[0]);
  const col = parseInt(coords[1]);

  if (isNaN(row) || isNaN(col) || row < 1 || row > 7 || col < 1 || col > 7) {
    return null;
  }

  let flightways = [];

  if (face === "b") {
    // Brown face: intersection of b-flightway(col) and g-flightway(row)
    flightways = [`b${col}`, `g${row}`];
  } else if (face === "y") {
    // Yellow face: intersection of b-flightway(row) and y-flightway(col)
    flightways = [`b${row}`, `y${col}`];
  } else if (face === "g") {
    // Green face: intersection of y-flightway(row) and g-flightway(col)
    flightways = [`y${row}`, `g${col}`];
  } else {
    return null;
  }

  // Sort to maintain consistent order: b, y, g
  flightways.sort((a, b) => {
    const faceOrder = { b: 0, y: 1, g: 2 };
    return faceOrder[a[0]] - faceOrder[b[0]];
  });

  return `${flightways[0]}${flightways[1]}`;
}

/**
 * Convert flightway coordinates back to square notation
 * @param {string} flightwayCoord - Flightway coordinates in format "b4g3"
 * @returns {string} - Square in format "b3-4" or null if invalid
 */
export function convertFromFlightway(flightwayCoord) {
  if (!flightwayCoord || typeof flightwayCoord !== "string") return null;

  const match = flightwayCoord.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return null;

  const [, face1, num1, face2, num2] = match;

  // Determine which face this flightway intersection is on
  const targetFace = getFaceFromFlightway(flightwayCoord);
  if (!targetFace) return null;

  // Convert back to face coordinates based on target face
  if (targetFace === "brown") {
    if (face1 === "b" && face2 === "g") {
      return `b${num2}-${num1}`; // b[col]g[row] -> b[row]-[col]
    } else if (face1 === "g" && face2 === "b") {
      return `b${num1}-${num2}`; // g[row]b[col] -> b[row]-[col]
    }
  } else if (targetFace === "yellow") {
    if (face1 === "b" && face2 === "y") {
      return `y${num1}-${num2}`; // b[row]y[col] -> y[row]-[col]
    } else if (face1 === "y" && face2 === "b") {
      return `y${num2}-${num1}`; // y[col]b[row] -> y[row]-[col]
    }
  } else if (targetFace === "green") {
    if (face1 === "y" && face2 === "g") {
      return `g${num1}-${num2}`; // y[row]g[col] -> g[row]-[col]
    } else if (face1 === "g" && face2 === "y") {
      return `g${num2}-${num1}`; // g[col]y[row] -> g[row]-[col]
    }
  }

  return null;
}

/**
 * Generate complete flightway route starting from specified face and number
 * @param {string} face - Starting face ('b', 'y', or 'g')
 * @param {number} number - Flightway number (1-7)
 * @returns {string[]} - Array of squares in route order
 */
export function generateFlightwayRoute(face, number) {
  const route = [];

  if (face === "b") {
    // b-flightway: Brown face column, then Yellow face row (reversed)
    for (let row = 1; row <= 7; row++) {
      route.push(`b${row}-${number}`);
    }
    for (let col = 7; col >= 1; col--) {
      route.push(`y${number}-${col}`);
    }
  } else if (face === "y") {
    // y-flightway: Yellow face column, then Green face row (reversed)
    for (let row = 1; row <= 7; row++) {
      route.push(`y${row}-${number}`);
    }
    for (let col = 7; col >= 1; col--) {
      route.push(`g${number}-${col}`);
    }
  } else if (face === "g") {
    // g-flightway: Green face column, then Brown face row (reversed)
    for (let row = 1; row <= 7; row++) {
      route.push(`g${row}-${number}`);
    }
    for (let col = 7; col >= 1; col--) {
      route.push(`b${number}-${col}`);
    }
  }

  return route;
}

/**
 * Determine which face a piece is on using our finding list
 * @param {string} flightway - Flightway coordinates like "b4g3"
 * @returns {string} - Face ('brown', 'yellow', or 'green')
 */
export function getFaceFromFlightway(flightway) {
  const match = flightway.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return null;

  const [, face1, num1, face2, num2] = match;

  // Using our finding list:
  // Brown face: g[num]b7-g[num]b1, b[num]g1-b[num]g7
  if (
    (face1 === "g" &&
      face2 === "b" &&
      parseInt(num2) >= 1 &&
      parseInt(num2) <= 7) ||
    (face1 === "b" &&
      face2 === "g" &&
      parseInt(num2) >= 1 &&
      parseInt(num2) <= 7)
  ) {
    return "brown";
  }

  // Yellow face: b[num]y7-b[num]y1, y[num]b1-y[num]b7
  if (
    (face1 === "b" &&
      face2 === "y" &&
      parseInt(num2) >= 1 &&
      parseInt(num2) <= 7) ||
    (face1 === "y" &&
      face2 === "b" &&
      parseInt(num2) >= 1 &&
      parseInt(num2) <= 7)
  ) {
    return "yellow";
  }

  // Green face: y[num]g7-y[num]g1, g[num]y1-g[num]y7
  if (
    (face1 === "y" &&
      face2 === "g" &&
      parseInt(num2) >= 1 &&
      parseInt(num2) <= 7) ||
    (face1 === "g" &&
      face2 === "y" &&
      parseInt(num2) >= 1 &&
      parseInt(num2) <= 7)
  ) {
    return "green";
  }

  return null;
}

/**
 * Check if an owl and crosspiece are cross-adjacent (for ghosting)
 * @param {string} owlPosition - Owl's square position
 * @param {string} crossPiecePosition - Crosspiece's square position
 * @returns {object} - {isAdjacent: boolean, owlNumber?: number, crossNumber?: number, ghostDirection?: 'in'|'out'}
 */
export function checkCrossAdjacency(owlPosition, crossPiecePosition) {
  const owlFlightway = convertToFlightway(owlPosition);
  const crossFlightway = convertToFlightway(crossPiecePosition);

  if (!owlFlightway || !crossFlightway) return { isAdjacent: false };

  // Parse flightway coordinates
  const owlMatch = owlFlightway.match(/([byg])(\d)([byg])(\d)/);
  const crossMatch = crossFlightway.match(/([byg])(\d)([byg])(\d)/);

  if (!owlMatch || !crossMatch) return { isAdjacent: false };

  const [, owlFace1, owlNum1, owlFace2, owlNum2] = owlMatch;
  const [, crossFace1, crossNum1, crossFace2, crossNum2] = crossMatch;

  // Get faces they're on
  const owlFace = getFaceFromFlightway(owlFlightway);
  const crossFace = getFaceFromFlightway(crossFlightway);

  // Must be on different faces
  if (owlFace === crossFace) return { isAdjacent: false };

  // Check for adjacent flightways
  const owlFlightways = [`${owlFace1}${owlNum1}`, `${owlFace2}${owlNum2}`];
  const crossFlightways = [
    `${crossFace1}${crossNum1}`,
    `${crossFace2}${crossNum2}`,
  ];

  for (const owlFw of owlFlightways) {
    for (const crossFw of crossFlightways) {
      if (owlFw[0] === crossFw[0]) {
        // Same flightway type (b, y, or g)
        const owlNum = parseInt(owlFw[1]);
        const crossNum = parseInt(crossFw[1]);

        if (Math.abs(owlNum - crossNum) === 1) {
          return {
            isAdjacent: true,
            owlNumber: owlNum,
            crossNumber: crossNum,
            ghostDirection: owlNum < crossNum ? "in" : "out",
          };
        }
      }
    }
  }

  return { isAdjacent: false };
}

/**
 * Calculate simple ghosting destination using our understanding
 * @param {string} owlPosition - Owl's current position (e.g., "y2-5")
 * @param {string} crossPiecePosition - Crosspiece position (e.g., "b5-3")
 * @param {object} crossAdjacency - Result from checkCrossAdjacency()
 * @returns {string|null} - Destination square or null if invalid
 */
export function calculateSimpleGhostingDestination(
  owlPosition,
  crossPiecePosition,
  crossAdjacency
) {
  const isBrownOwl = owlPosition === "b7-6";
  const isYellowOwl = owlPosition === "b4-7" || owlPosition === "b5-7";
  
  if (isBrownOwl) {
    console.log(`🔧 GHOSTING CALC: ${owlPosition} around ${crossPiecePosition}`);
    console.log(`🔧 Cross adjacency:`, crossAdjacency);
  }
  
  if (!crossAdjacency.isAdjacent) {
    if (isBrownOwl) console.log(`🔧 NOT ADJACENT - returning null`);
    return null;
  }

  // Get flightway coordinates
  const owlFlightway = convertToFlightway(owlPosition);
  const crossFlightway = convertToFlightway(crossPiecePosition);
  
  if (isBrownOwl) {
    console.log(`🔧 Owl flightway: ${owlFlightway}`);
    console.log(`🔧 Cross flightway: ${crossFlightway}`);
  }

  if (!owlFlightway || !crossFlightway) {
    if (isBrownOwl) console.log(`🔧 NULL FLIGHTWAY - returning null`);
    return null;
  }

  // Get the faces they're on
  const owlFace = getFaceFromFlightway(owlFlightway);
  const crossFace = getFaceFromFlightway(crossFlightway);
  
  if (isBrownOwl) {
    console.log(`🔧 Owl face: ${owlFace}`);
    console.log(`🔧 Cross face: ${crossFace}`);
  }

  // Target face is the third face (not owl's, not crosspiece's)
  const allFaces = ["brown", "yellow", "green"];
  const targetFace = allFaces.find(
    (face) => face !== owlFace && face !== crossFace
  );
  
  if (isBrownOwl) {
    console.log(`🔧 Target face: ${targetFace}`);
  }

  // Use simplified flightway method to find intersection square
  const owlMatch = owlFlightway.match(/([byg])(\d)([byg])(\d)/);
  const crossMatch = crossFlightway.match(/([byg])(\d)([byg])(\d)/);
  
  if (!owlMatch || !crossMatch) {
    if (isBrownOwl) console.log(`🔧 FLIGHTWAY PARSING FAILED`);
    return null;
  }
  
  const [, owlFace1, owlNum1, owlFace2, owlNum2] = owlMatch;
  const [, crossFace1, crossNum1, crossFace2, crossNum2] = crossMatch;
  
  // Create flightway arrays
  const owlFlightways = [`${owlFace1}${owlNum1}`, `${owlFace2}${owlNum2}`];
  const crossFlightways = [`${crossFace1}${crossNum1}`, `${crossFace2}${crossNum2}`];
  
  // Find the adjacent pair and remaining pair
  let remainingPair = [];
  
  for (const owlFw of owlFlightways) {
    for (const crossFw of crossFlightways) {
      if (owlFw[0] === crossFw[0]) { // Same flightway type
        const owlNum = parseInt(owlFw[1]);
        const crossNum = parseInt(crossFw[1]);
        if (Math.abs(owlNum - crossNum) === 1) {
          // Found adjacent pair - get remaining flightways
          const remainingOwl = owlFlightways.find(fw => fw !== owlFw);
          const remainingCross = crossFlightways.find(fw => fw !== crossFw);
          remainingPair = [remainingOwl, remainingCross];
          break;
        }
      }
    }
    if (remainingPair.length > 0) break;
  }
  
  if (remainingPair.length !== 2) {
    if (isBrownOwl) console.log(`🔧 REMAINING PAIR NOT FOUND`);
    return null;
  }
  
  // Create intersection flightway from remaining pair
  const [fw1, fw2] = remainingPair.sort((a, b) => {
    const faceOrder = { b: 0, y: 1, g: 2 };
    return faceOrder[a[0]] - faceOrder[b[0]];
  });
  
  const intersectionFlightway = `${fw1}${fw2}`;
  const intersectionSquare = convertFromFlightway(intersectionFlightway);
  
  if (isBrownOwl) {
    console.log(`🔧 Remaining pair: ${remainingPair.join(', ')}`);
    console.log(`🔧 Intersection flightway: ${intersectionFlightway}`);
    console.log(`🔧 Intersection square: ${intersectionSquare}`);
  }

  if (!intersectionSquare) {
    if (isBrownOwl) console.log(`🔧 INTERSECTION SQUARE CONVERSION FAILED`);
    return null;
  }

  // Edge case validation: Check if crosspiece is at position 8 of its flightway (face transition)
  if (crossAdjacency.ghostDirection === "in") {
    // Find which flightway the crosspiece and owl share
    const crossMatch = crossFlightway.match(/([byg])(\d)([byg])(\d)/);
    const owlMatch = owlFlightway.match(/([byg])(\d)([byg])(\d)/);
    
    if (crossMatch && owlMatch) {
      const crossFlightways = [`${crossMatch[1]}${crossMatch[2]}`, `${crossMatch[3]}${crossMatch[4]}`];
      const owlFlightways = [`${owlMatch[1]}${owlMatch[2]}`, `${owlMatch[3]}${owlMatch[4]}`];
      
      // Find the shared adjacent flightway
      for (const crossFw of crossFlightways) {
        for (const owlFw of owlFlightways) {
          if (crossFw[0] === owlFw[0]) { // Same flightway type
            const crossNum = parseInt(crossFw[1]);
            const owlNum = parseInt(owlFw[1]);
            if (Math.abs(crossNum - owlNum) === 1) {
              // Found the adjacent flightway - check crosspiece position
              const crossFlightwayFace = crossFw[0];
              const crossFlightwayNum = crossNum;
              const crossFlightwayRoute = generateFlightwayRoute(crossFlightwayFace, crossFlightwayNum);
              const crossPositionIndex = crossFlightwayRoute.indexOf(crossPiecePosition);
              
              if (crossPositionIndex === 7) { // Position 8 (0-indexed = 7) - face transition point
                if (isBrownOwl || isYellowOwl) {
                  console.log(`🚫 EDGE CASE: Cannot ghost "in" - crosspiece at position 8 (face transition) of ${crossFw}. Cross position: ${crossPiecePosition}`);
                }
                return null;
              }
              break;
            }
          }
        }
      }
    }
  }

  // Find which of owl's flightways goes to the target face
  let owlTargetFlightway;
  if (targetFace === "brown") {
    owlTargetFlightway = owlFlightways.find(fw => fw[0] === "b" || fw[0] === "g");
  } else if (targetFace === "yellow") {
    owlTargetFlightway = owlFlightways.find(fw => fw[0] === "b" || fw[0] === "y");
  } else if (targetFace === "green") {
    owlTargetFlightway = owlFlightways.find(fw => fw[0] === "y" || fw[0] === "g");
  }

  if (!owlTargetFlightway) {
    if (isBrownOwl) console.log(`🔧 OWL TARGET FLIGHTWAY NOT FOUND`);
    return null;
  }

  // Generate the complete route for owl's target flightway
  const owlFlightwayFace = owlTargetFlightway[0];
  const owlFlightwayNum = parseInt(owlTargetFlightway[1]);
  const flightwayRoute = generateFlightwayRoute(owlFlightwayFace, owlFlightwayNum);
  
  if (isBrownOwl) {
    console.log(`🔧 Owl target flightway: ${owlTargetFlightway}`);
    console.log(`🔧 Flightway route: [${flightwayRoute.slice(0,3).join(', ')}...${flightwayRoute.slice(-3).join(', ')}] (${flightwayRoute.length} squares)`);
  }

  // Find position of intersection in the route
  const intersectionIndex = flightwayRoute.indexOf(intersectionSquare);
  if (intersectionIndex === -1) {
    if (isBrownOwl) console.log(`🔧 INTERSECTION NOT FOUND in route - returning null`);
    return null;
  }
  
  // Find owl's current position in the route
  const currentOwlIndex = flightwayRoute.indexOf(owlPosition);
  if (currentOwlIndex === -1) return null;

  if (isBrownOwl) {
    console.log(`🔧 Owl at index: ${currentOwlIndex}, Intersection at index: ${intersectionIndex}`);
  }
  
  if (isYellowOwl) {
    console.log(`🟡 Owl at index: ${currentOwlIndex}, Intersection at index: ${intersectionIndex}`);
    console.log(`🟡 Owl position: ${owlPosition}, Intersection: ${intersectionSquare}`);
  }

  // Implement local coordinate system: Owl → Intersection defines positive direction
  let destIndex;
  
  if (currentOwlIndex < intersectionIndex) {
    // Intersection is ahead of owl in route (local positive direction)
    if (crossAdjacency.ghostDirection === "in") {
      destIndex = intersectionIndex - 1; // Back toward owl
    } else {
      destIndex = intersectionIndex + 1; // Further ahead past intersection
    }
  } else {
    // Intersection is behind owl in route (local negative direction) 
    if (crossAdjacency.ghostDirection === "in") {
      destIndex = intersectionIndex + 1; // Back toward owl (forward in route)
    } else {
      destIndex = intersectionIndex - 1; // Further away from owl (backward in route)
    }
  }

  // Check bounds
  if (destIndex < 0 || destIndex >= flightwayRoute.length) return null;

  const destinationSquare = flightwayRoute[destIndex];
  
  if (isBrownOwl) {
    console.log(`🔧 Intersection square: ${intersectionSquare}`);
    console.log(`🔧 Intersection index: ${intersectionIndex}`);
    console.log(`🔧 Dest index: ${destIndex}`);
    console.log(`🔧 Flightway route length: ${flightwayRoute.length}`);
    console.log(`🔧 Final destination: ${destinationSquare}`);
  }
  
  if (isYellowOwl) {
    console.log(`🟡 Direction: ${crossAdjacency.ghostDirection}, Dest index: ${destIndex}`);
    console.log(`🟡 Final destination: ${destinationSquare}`);
  }

  // ADDITIONAL VALIDATION: Check if this actually represents a valid inside/outside transition
  // For now, let's allow the move and see if it makes sense geometrically

  // console.log(
  //   `🔄 Ghosting ${crossAdjacency.ghostDirection}: ${owlPosition} → ${destinationSquare} via ${intersectionSquare}`
  // ); // Mechanistic logging - disabled

  return destinationSquare;
}

export function isSquareOccupied(square, piecePositions) {
  return Object.values(piecePositions || {}).includes(square);
}

export function isPathClear(fromSquare, toSquare, piecePositions) {
  // For now, let's implement basic same-face path checking
  // This can be enhanced later for cross-face moves

  const parseSquare = (squareName) => {
    const face = squareName[0];
    const coords = squareName.substring(1).split("-");
    return { face, row: parseInt(coords[0]), col: parseInt(coords[1]) };
  };

  const from = parseSquare(fromSquare);
  const to = parseSquare(toSquare);

  // If different faces, assume path is clear (complex cross-face logic)
  if (from.face !== to.face) return true;

  // Same face - check orthogonal path
  const path = [];

  if (from.row === to.row) {
    // Moving along columns
    const minCol = Math.min(from.col, to.col);
    const maxCol = Math.max(from.col, to.col);
    for (let col = minCol + 1; col < maxCol; col++) {
      path.push(`${from.face}${from.row}-${col}`);
    }
  } else if (from.col === to.col) {
    // Moving along rows
    const minRow = Math.min(from.row, to.row);
    const maxRow = Math.max(from.row, to.row);
    for (let row = minRow + 1; row < maxRow; row++) {
      path.push(`${from.face}${row}-${from.col}`);
    }
  }

  // Check if any piece blocks the path
  return !path.some((square) => isSquareOccupied(square, piecePositions));
}

/**
 * Test ghosting calculation - call from console
 * Example: testGhosting("b7-6", "y7-6")
 */
export function testGhosting(owlPos, crossPos) {
  console.log(`=== TESTING GHOSTING: ${owlPos} around ${crossPos} ===`);
  
  const crossAdjacency = checkCrossAdjacency(owlPos, crossPos);
  console.log(`Cross adjacency:`, crossAdjacency);
  
  if (crossAdjacency.isAdjacent) {
    const destination = calculateSimpleGhostingDestination(owlPos, crossPos, crossAdjacency);
    console.log(`Ghosting destination: ${destination || 'NONE'}`);
  } else {
    console.log(`Not cross-adjacent - no ghosting possible`);
  }
  
  return crossAdjacency.isAdjacent ? calculateSimpleGhostingDestination(owlPos, crossPos, crossAdjacency) : null;
}

/**
 * Test function to verify flightway coordinate conversions
 */
export function testFlightwayConversions() {
  console.log("=== TESTING FLIGHTWAY CONVERSIONS ===");

  const testCases = [
    { square: "b3-4", expected: "b4g3" },
    { square: "y5-2", expected: "b5y2" },
    { square: "g6-2", expected: "y6g2" },
    { square: "y6-1", expected: "b6y1" },
    { square: "b1-7", expected: "b7g1" },
  ];

  testCases.forEach(({ square, expected }) => {
    const result = convertToFlightway(square);
    const backConverted = convertFromFlightway(result);
    console.log(
      `${square} → ${result} (expected: ${expected}) → ${backConverted}`
    );
    console.log(`✓ Conversion: ${result === expected ? "PASS" : "FAIL"}`);
    console.log(`✓ Round-trip: ${backConverted === square ? "PASS" : "FAIL"}`);
    console.log("---");
  });
}
