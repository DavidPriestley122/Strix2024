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
  if (!crossAdjacency.isAdjacent) return null;

  // Get flightway coordinates
  const owlFlightway = convertToFlightway(owlPosition);
  const crossFlightway = convertToFlightway(crossPiecePosition);

  if (!owlFlightway || !crossFlightway) return null;

  // Get the faces they're on
  const owlFace = getFaceFromFlightway(owlFlightway);
  const crossFace = getFaceFromFlightway(crossFlightway);

  // Target face is the third face (not owl's, not crosspiece's)
  const allFaces = ["brown", "yellow", "green"];
  const targetFace = allFaces.find(
    (face) => face !== owlFace && face !== crossFace
  );

  // Parse owl's flightway coordinates
  const owlMatch = owlFlightway.match(/([byg])(\d)([byg])(\d)/);
  if (!owlMatch) return null;

  const [, owlFace1, owlNum1, owlFace2, owlNum2] = owlMatch;

  // Find which of owl's flightways goes to the target face
  let owlTargetFlightway;
  if (targetFace === "brown") {
    owlTargetFlightway =
      owlFace1 === "b" || owlFace1 === "g"
        ? `${owlFace1}${owlNum1}`
        : `${owlFace2}${owlNum2}`;
  } else if (targetFace === "yellow") {
    owlTargetFlightway =
      owlFace1 === "b" || owlFace1 === "y"
        ? `${owlFace1}${owlNum1}`
        : `${owlFace2}${owlNum2}`;
  } else if (targetFace === "green") {
    owlTargetFlightway =
      owlFace1 === "y" || owlFace1 === "g"
        ? `${owlFace1}${owlNum1}`
        : `${owlFace2}${owlNum2}`;
  }

  // Parse crosspiece's flightway coordinates
  const crossMatch = crossFlightway.match(/([byg])(\d)([byg])(\d)/);
  if (!crossMatch) return null;

  const [, crossFace1, crossNum1, crossFace2, crossNum2] = crossMatch;

  // Find which crosspiece flightway creates shadows on target face
  let crossShadowFlightway;
  if (targetFace === "green") {
    crossShadowFlightway =
      crossFace1 === "g" || crossFace1 === "y"
        ? `${crossFace1}${crossNum1}`
        : `${crossFace2}${crossNum2}`;
  } else if (targetFace === "yellow") {
    crossShadowFlightway =
      crossFace1 === "b" || crossFace1 === "y"
        ? `${crossFace1}${crossNum1}`
        : `${crossFace2}${crossNum2}`;
  } else if (targetFace === "brown") {
    crossShadowFlightway =
      crossFace1 === "b" || crossFace1 === "g"
        ? `${crossFace1}${crossNum1}`
        : `${crossFace2}${crossNum2}`;
  }

  // Generate the complete route for owl's target flightway
  const owlFlightwayFace = owlTargetFlightway[0];
  const owlFlightwayNum = parseInt(owlTargetFlightway[1]);
  const flightwayRoute = generateFlightwayRoute(
    owlFlightwayFace,
    owlFlightwayNum
  );

  // Find intersection square (where crosspiece shadows)
  const crossShadowNum = parseInt(crossShadowFlightway[1]);
  let intersectionSquare;

  if (targetFace === "brown") {
    intersectionSquare = `b${crossShadowNum}-${owlFlightwayNum}`;
  } else if (targetFace === "yellow") {
    intersectionSquare = `y${owlFlightwayNum}-${crossShadowNum}`;
  } else if (targetFace === "green") {
    intersectionSquare = `g${owlFlightwayNum}-${crossShadowNum}`;
  }

  // Find position of intersection in the route
  const intersectionIndex = flightwayRoute.indexOf(intersectionSquare);
  if (intersectionIndex === -1) return null;

  // KEY FIX: Determine if Owl is currently inside or outside the shadow pair
  const currentOwlIndex = flightwayRoute.indexOf(owlPosition);
  if (currentOwlIndex === -1) return null;

  // The crosspiece creates TWO shadows on this flightway - we need to find both
  // For now, let's assume the other shadow is at a different crosspiece flightway number
  // This is a simplification - we may need to get both shadow positions properly

  // Based on the ghostDirection from crossAdjacency:
  // "in" means Owl number < Cross number (Owl wants to move toward center/lower numbers)
  // "out" means Owl number > Cross number (Owl wants to move away from center/higher numbers)

  let destIndex;

  if (crossAdjacency.ghostDirection === "in") {
    // Owl wants to ghost "inward" (toward center)
    // This should move the Owl from "outside" to "inside" the shadow pair
    destIndex = intersectionIndex - 1; // One square before the intersection
  } else {
    // Owl wants to ghost "outward" (away from center)
    // This should move the Owl from "inside" to "outside" the shadow pair
    destIndex = intersectionIndex + 1; // One square after the intersection
  }

  // Check bounds
  if (destIndex < 0 || destIndex >= flightwayRoute.length) return null;

  const destinationSquare = flightwayRoute[destIndex];

  // ADDITIONAL VALIDATION: Check if this actually represents a valid inside/outside transition
  // For now, let's allow the move and see if it makes sense geometrically

  console.log(
    `🔄 Ghosting ${crossAdjacency.ghostDirection}: ${owlPosition} → ${destinationSquare} via ${intersectionSquare}`
  );

  return destinationSquare;
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
