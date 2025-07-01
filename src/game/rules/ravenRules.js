import {
  convertToFlightway,
  generateFlightwayRoute,
  isSquareOccupied,
  isPathClear,
} from "./flightwayUtils.js";

// Logging control - set to false to hide mechanistic logging
const ENABLE_MECHANISTIC_LOGGING = false;

export function validateRavenMove(fromSquare, toSquare, piecePositions = {}) {
  if (!fromSquare || !toSquare) return false;

  // Get all valid moves for this Raven
  const validMoves = getAllRavenMoves(fromSquare, piecePositions);

  return validMoves.includes(toSquare);
}

export function getAllRavenMoves(fromSquare, piecePositions = {}, movingPieceName = null) {
  const validMoves = [];

  // Get the flightway coordinates for the Raven's current position
  const flightwayCoord = convertToFlightway(fromSquare);
  if (!flightwayCoord) return validMoves;

  // Parse the flightway coordinates to get the two flightways this square is on
  const match = flightwayCoord.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return validMoves;

  const [, face1, num1, face2, num2] = match;
  const flightway1 = `${face1}${num1}`;
  const flightway2 = `${face2}${num2}`;

  // Get regular moves along first flightway
  const moves1 = getMovesAlongFlightway(fromSquare, flightway1, piecePositions);
  validMoves.push(...moves1);

  // Get regular moves along second flightway
  const moves2 = getMovesAlongFlightway(fromSquare, flightway2, piecePositions);
  validMoves.push(...moves2);

  // Add mobbing moves if piece name is provided
  if (movingPieceName) {
    const mobbingMoves = getRavenMobbingMoves(fromSquare, piecePositions, movingPieceName, flightway1, flightway2);
    validMoves.push(...mobbingMoves);
  }

  return validMoves;
}

function getMovesAlongFlightway(currentSquare, flightwayName, piecePositions) {
  const validMoves = [];

  // Generate the complete 14-square flightway sequence
  const face = flightwayName[0];
  const num = parseInt(flightwayName[1]);
  const flightwayRoute = generateFlightwayRoute(face, num);

  // Find current position in the route
  const currentIndex = flightwayRoute.indexOf(currentSquare);
  if (currentIndex === -1) return validMoves;

  // Ravens can move to any square along the flightway (like Rooks)
  for (let i = 0; i < flightwayRoute.length; i++) {
    if (i === currentIndex) continue; // Skip current position

    const targetSquare = flightwayRoute[i];

    // Check if destination is occupied
    if (isSquareOccupied(targetSquare, piecePositions)) {
      // Can't move to occupied square, but also can't jump over it
      // So if we're going in this direction, stop here
      if (i > currentIndex) {
        // Moving forward in route - stop here
        break;
      } else {
        // Moving backward in route - continue checking but don't add this square
        continue;
      }
    }

    // Check if path is clear (no pieces between current and target)
    if (!isPathClear(currentSquare, targetSquare, piecePositions)) {
      // Path blocked - if going in this direction, stop
      if (i > currentIndex) {
        break;
      } else {
        continue;
      }
    }

    // Valid move
    validMoves.push(targetSquare);
  }

  return validMoves;
}

// Raven mobbing moves: cross-adjacent sandwiching captures
function getRavenMobbingMoves(fromSquare, piecePositions, movingRavenName, flightway1, flightway2) {
  if (ENABLE_MECHANISTIC_LOGGING) console.log(`🐦 getRavenMobbingMoves called for ${movingRavenName} at ${fromSquare}`);
  const mobbingMoves = [];
  
  // Get all possible landing squares along both flightways
  const landingSquares1 = getMovesAlongFlightway(fromSquare, flightway1, piecePositions);
  const landingSquares2 = getMovesAlongFlightway(fromSquare, flightway2, piecePositions);
  const allLandingSquares = [...landingSquares1, ...landingSquares2];
  
  // Get the face the attacking Raven is currently on
  const ravenFace = fromSquare[0];
  
  for (const landingSquare of allLandingSquares) {
    const landingFace = landingSquare[0];
    
    // Check if this move crosses faces (required for mobbing)
    if (landingFace !== ravenFace) {
      if (ENABLE_MECHANISTIC_LOGGING) console.log(`🐦 Cross-face Raven move: ${fromSquare}(${ravenFace}) → ${landingSquare}(${landingFace})`);
      
      // Check if this landing position can complete a mob
      const mobbingOpportunities = findMobbingOpportunities(landingSquare, piecePositions, movingRavenName);
      
      if (mobbingOpportunities.length > 0) {
        if (ENABLE_MECHANISTIC_LOGGING) console.log(`🎯 MOBBING OPPORTUNITY: ${movingRavenName} can mob from ${landingSquare}:`, mobbingOpportunities);
        if (!mobbingMoves.includes(landingSquare)) {
          mobbingMoves.push(landingSquare);
        }
      }
    }
  }
  
  if (ENABLE_MECHANISTIC_LOGGING) console.log(`🐦 getRavenMobbingMoves returning:`, mobbingMoves);
  return mobbingMoves;
}

// Find which pieces can be mobbed from a given Raven position
function findMobbingOpportunities(ravenPosition, piecePositions, movingRavenName) {
  const opportunities = [];
  
  // For each piece on the board, check if it can be mobbed
  for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
    if (piecePos === "captured" || pieceName === movingRavenName) continue;
    
    // Check if victim is on a different face than the attacking Raven
    const victimFace = piecePos[0];
    const ravenFace = ravenPosition[0];
    
    if (victimFace === ravenFace) continue; // Ravens can't mob on same face
    
    // Check if there's a passive Raven already in position to mob this victim
    const passiveRaven = findPassiveRavenForMobbing(ravenPosition, piecePos, piecePositions, movingRavenName);
    
    if (passiveRaven) {
      if (ENABLE_MECHANISTIC_LOGGING) console.log(`🎯 Found mobbing opportunity: ${movingRavenName} at ${ravenPosition} can mob ${pieceName} at ${piecePos} with help from ${passiveRaven}`);
      opportunities.push({
        victim: pieceName,
        victimPosition: piecePos,
        passiveRaven: passiveRaven
      });
    }
  }
  
  return opportunities;
}

// Check if there's a passive Raven in position to help mob a victim
function findPassiveRavenForMobbing(attackingRavenPos, victimPos, piecePositions, movingRavenName) {
  // Find all Ravens that could serve as passive partners
  const allRavens = Object.entries(piecePositions).filter(([name, pos]) => 
    name.endsWith('Raven') && 
    pos !== "captured" && 
    name !== movingRavenName
  );
  
  for (const [ravenName, ravenPos] of allRavens) {
    // Check if this Raven is in the correct position to mob the victim
    // with the attacking Raven on the opposite side
    if (isValidMobbingConfiguration(attackingRavenPos, ravenPos, victimPos)) {
      return ravenName;
    }
  }
  
  return null;
}

// Check if attacking Raven, passive Raven, and victim form valid mobbing configuration
export function isValidMobbingConfiguration(attackingRavenPos, passiveRavenPos, victimPos) {
  if (ENABLE_MECHANISTIC_LOGGING) console.log(`🔍 Checking mobbing config: Attacking(${attackingRavenPos}) vs Passive(${passiveRavenPos}) around Victim(${victimPos})`);
  
  // Get flightway coordinates for all three pieces
  const attackingFlightway = convertToFlightway(attackingRavenPos);
  const passiveFlightway = convertToFlightway(passiveRavenPos);
  const victimFlightway = convertToFlightway(victimPos);
  
  if (!attackingFlightway || !passiveFlightway || !victimFlightway) {
    return false;
  }
  
  // Parse flightway coordinates (e.g., "b4g3" -> ["b4", "g3"])
  const attackingFWs = parseFlightwayCoord(attackingFlightway);
  const passiveFWs = parseFlightwayCoord(passiveFlightway);
  const victimFWs = parseFlightwayCoord(victimFlightway);
  
  // Check all possible flightway combinations for valid mobbing
  for (const attackingFW of attackingFWs) {
    for (const passiveFW of passiveFWs) {
      for (const victimFW of victimFWs) {
        if (isValidMobbingFlightwayPattern(attackingFW, passiveFW, victimFW, attackingRavenPos, passiveRavenPos, victimPos)) {
          if (ENABLE_MECHANISTIC_LOGGING) console.log(`✅ Valid mobbing pattern found: ${attackingFW} + ${passiveFW} → ${victimFW}`);
          return true;
        }
      }
    }
  }
  
  return false;
}

// Parse flightway coordinate into individual flightways
function parseFlightwayCoord(flightwayCoord) {
  const match = flightwayCoord.match(/([byg])(\d)([byg])(\d)/);
  if (!match) return [];
  
  const [, face1, num1, face2, num2] = match;
  return [`${face1}${num1}`, `${face2}${num2}`];
}

// Check if three flightways form valid mobbing pattern
function isValidMobbingFlightwayPattern(attackingFW, passiveFW, victimFW, attackingPos, passivePos, victimPos) {
  // Parse flightway components
  const atkFace = attackingFW[0];
  const atkNum = parseInt(attackingFW[1]);
  const pasFace = passiveFW[0];
  const pasNum = parseInt(passiveFW[1]);
  const vicFace = victimFW[0];
  const vicNum = parseInt(victimFW[1]);
  
  // Ravens must be on same flightway type with a gap of 2
  if (atkFace === pasFace && Math.abs(atkNum - pasNum) === 2) {
    // Victim must be on the middle flightway
    const middleNum = (atkNum + pasNum) / 2;
    if (vicFace === atkFace && vicNum === middleNum) {
      // Check if victim is on perpendicular section (different face than Ravens)
      const attackingRavenFace = attackingPos[0];  // Face the attacking Raven is actually on
      const passiveRavenFace = passivePos[0];      // Face the passive Raven is actually on
      const victimFace = victimPos[0];             // Face the victim is actually on
      
      // Both Ravens must be on the same face for chopsticks pattern
      if (attackingRavenFace === passiveRavenFace && attackingRavenFace !== victimFace) {
        // Ravens must be at the same position along their respective flightways (chopsticks alignment)
        // Generate the flightway routes to find their positions
        const attackingRoute = generateFlightwayRoute(atkFace, atkNum);
        const passiveRoute = generateFlightwayRoute(pasFace, pasNum);
        
        const attackingIndex = attackingRoute.indexOf(attackingPos);
        const passiveIndex = passiveRoute.indexOf(passivePos);
        
        if (attackingIndex !== -1 && passiveIndex !== -1 && attackingIndex === passiveIndex) {
          if (ENABLE_MECHANISTIC_LOGGING) console.log(`🎯 Mobbing pattern: Ravens on ${attackingFW}+${passiveFW} (both on face ${attackingRavenFace}, same position ${attackingIndex}) → victim on ${victimFW} (face ${victimFace})`);
          return true;
        }
      }
    }
  }
  
  return false;
}

// Helper function to find which piece is at a given square
export function findPieceAtSquare(square, piecePositions) {
  for (const [pieceName, piecePos] of Object.entries(piecePositions)) {
    if (piecePos === square && piecePos !== "captured") {
      return pieceName;
    }
  }
  return null;
}

// Check if a Raven at a specific position has any actual capture opportunities
export function checkRavenCaptureOpportunities(ravenPosition, piecePositions, ravenName) {
  if (ENABLE_MECHANISTIC_LOGGING) console.log(`🔍 Checking capture opportunities for ${ravenName} at ${ravenPosition}`);
  
  // Use existing mobbing detection logic
  const mobbingOpportunities = findMobbingOpportunities(ravenPosition, piecePositions, ravenName);
  
  const hasCaptures = mobbingOpportunities.length > 0;
  
  if (ENABLE_MECHANISTIC_LOGGING) {
    if (hasCaptures) {
      console.log(`✅ ${ravenName} has ${mobbingOpportunities.length} capture opportunities:`, mobbingOpportunities);
    } else {
      console.log(`❌ No capture opportunities found for ${ravenName} at ${ravenPosition}`);
    }
  }
  
  return hasCaptures;
}
