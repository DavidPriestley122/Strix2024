// flightwayUtils.js - Core flightway system utilities for Strix

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

  // Parse "b3g5" format
  const match = flightwayCoord.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return null;

  const [, face1, num1, face2, num2] = match;

  // Generate both flightway routes and find intersection
  const route1 = generateFlightwayRoute(face1, parseInt(num1));
  const route2 = generateFlightwayRoute(face2, parseInt(num2));

  // Find common square
  for (const square of route1) {
    if (route2.includes(square)) {
      return square;
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
 * Determine which face a piece is on based on its flightway components
 * @param {string} face1 - First flightway face ('b', 'y', or 'g')
 * @param {string} face2 - Second flightway face ('b', 'y', or 'g')
 * @returns {string} - Face where the piece is located
 */
export function getCrossPieceFace(face1, face2) {
  // Based on anti-clockwise flightway routing: b→y, y→g, g→b
  const intersections = {
    by: "y",
    yb: "y", // b and y flightways intersect on y face
    yg: "g",
    gy: "g", // y and g flightways intersect on g face
    gb: "b",
    bg: "b", // g and b flightways intersect on b face
  };
  return intersections[face1 + face2] || intersections[face2 + face1];
}

/**
 * Check if two flightway coordinates are consecutive on a shared flightway
 * @param {string} flightway1 - First flightway coordinate
 * @param {string} flightway2 - Second flightway coordinate
 * @returns {boolean} - True if consecutive on shared flightway
 */
export function areConsecutiveOnSharedFlightway(flightway1, flightway2) {
  if (!flightway1 || !flightway2) return false;

  // Parse both flightway coordinates
  const match1 = flightway1.match(/([byg])(\d)([byg])(\d)/);
  const match2 = flightway2.match(/([byg])(\d)([byg])(\d)/);

  if (!match1 || !match2) return false;

  const [, f1a, n1a, f1b, n1b] = match1;
  const [, f2a, n2a, f2b, n2b] = match2;

  const flightways1 = [`${f1a}${n1a}`, `${f1b}${n1b}`];
  const flightways2 = [`${f2a}${n2a}`, `${f2b}${n2b}`];

  // Find shared flightway
  const sharedFlightway = flightways1.find((fw) => flightways2.includes(fw));
  if (!sharedFlightway) return false;

  // Generate complete route for shared flightway
  const face = sharedFlightway[0];
  const num = parseInt(sharedFlightway[1]);
  const route = generateFlightwayRoute(face, num);

  // Convert route to flightway coordinates
  const flightwayRoute = route
    .map((square) => convertToFlightway(square))
    .filter(Boolean);

  const pos1 = flightwayRoute.indexOf(flightway1);
  const pos2 = flightwayRoute.indexOf(flightway2);

  return pos1 !== -1 && pos2 !== -1 && Math.abs(pos1 - pos2) === 1;
}

/**
 * Check if an owl and crosspiece are cross-adjacent (for ghosting)
 * @param {string} owlPosition - Owl's square position
 * @param {string} crossPiecePosition - Crosspiece's square position
 * @returns {object} - {isAdjacent: boolean, shadowSquare?: string, crossPiece?: string}
 */
export function checkCrossAdjacency(owlPosition, crossPiecePosition) {
  // Get flightway coordinates for both pieces
  const owlFlightway = convertToFlightway(owlPosition);
  const crossFlightway = convertToFlightway(crossPiecePosition);

  if (!owlFlightway || !crossFlightway) return { isAdjacent: false };

  // Parse crosspiece's flightways
  const crossMatch = crossFlightway.match(/([byg])(\d)([byg])(\d)/);
  if (!crossMatch) return { isAdjacent: false };

  const [, face1, num1, face2, num2] = crossMatch;
  const crossFlightway1 = `${face1}${num1}`;
  const crossFlightway2 = `${face2}${num2}`;

  // Determine crosspiece's actual face
  const crossPieceFace = getCrossPieceFace(face1, face2);

  // Get ALL squares on both flightway routes
  const route1 = generateFlightwayRoute(face1, parseInt(num1));
  const route2 = generateFlightwayRoute(face2, parseInt(num2));

  // Convert to flightway coordinates and exclude crosspiece's face
  const shadows1 = route1
    .filter((square) => square[0] !== crossPieceFace)
    .map((square) => convertToFlightway(square))
    .filter(Boolean);

  const shadows2 = route2
    .filter((square) => square[0] !== crossPieceFace)
    .map((square) => convertToFlightway(square))
    .filter(Boolean);

  const allShadows = [...shadows1, ...shadows2];

  // Check if owl is adjacent to any shadowed square
  for (const shadowFlightway of allShadows) {
    if (areConsecutiveOnSharedFlightway(owlFlightway, shadowFlightway)) {
      return {
        isAdjacent: true,
        shadowSquare: shadowFlightway,
        crossPiece: crossPiecePosition,
      };
    }
  }

  return { isAdjacent: false };
}

/**
 * Test function to verify flightway coordinate conversions
 */
export function testFlightwayConversions() {
  console.log("=== TESTING FLIGHTWAY CONVERSIONS ===");

  // Test cases
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

/**
 * Test function to verify cross-adjacency detection
 */
export function testCrossAdjacency() {
  console.log("=== TESTING CROSS-ADJACENCY ===");

  const testCases = [
    {
      name: "Yellow Kite g6-2, Brown Owl b1-7",
      crossPiece: "g6-2",
      owl: "b1-7",
      expected: true,
    },
    {
      name: "Yellow Kite y5-5, Brown Owl y5-2",
      crossPiece: "y5-5",
      owl: "y5-2",
      expected: false,
    },
  ];

  testCases.forEach(({ name, crossPiece, owl, expected }) => {
    console.log(`\nTesting: ${name}`);
    const result = checkCrossAdjacency(owl, crossPiece);
    console.log(`Result: ${JSON.stringify(result)}`);
    console.log(`Expected adjacent: ${expected}`);
    console.log(`✓ ${result.isAdjacent === expected ? "PASS" : "FAIL"}`);
  });
}
