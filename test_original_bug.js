// Test original bug case (should be blocked)
import { getAllOwlMoves } from './src/game/rules/owlRules.js';
import { checkCrossAdjacency, calculateSimpleGhostingDestination, convertToFlightway } from './src/game/rules/flightwayUtils.js';

console.log(`\n=== Testing Original Bug: Green Owl at b5-7 around Brown Owl at g7-6 ===\n`);

const owlPos = 'b5-7';
const crossPos = 'g7-6';

console.log(`Green Owl: ${owlPos}`);
console.log(`  Flightways: ${convertToFlightway(owlPos)}`);
console.log(`Brown Owl: ${crossPos}`);
console.log(`  Flightways: ${convertToFlightway(crossPos)}`);

const crossAdj = checkCrossAdjacency(owlPos, crossPos);
console.log(`\nCross-adjacent:`, crossAdj);

if (crossAdj.isAdjacent) {
  const destination = calculateSimpleGhostingDestination(owlPos, crossPos, crossAdj);
  console.log(`\nGhosting destination: ${destination || 'null (BLOCKED)'}`);

  if (destination === null) {
    console.log(`✓ CORRECT: Original bug is still blocked (cannot jump into Nest at b7-7)`);
  } else {
    console.log(`❌ BUG REINTRODUCED: Should be blocked but got destination ${destination}`);
  }
}

// Also test with getAllOwlMoves
const piecePositions = {
  'greenOwl': owlPos,
  'brownOwl': crossPos
};

console.log(`\n=== All moves for Green Owl ===`);
const allMoves = getAllOwlMoves(owlPos, piecePositions);
console.log(`Total moves: ${allMoves.length}`);
console.log(`Moves: ${allMoves.join(', ')}`);

const nestMoves = allMoves.filter(m => m === 'b7-7' || m === 'y7-7' || m === 'g7-7');
if (nestMoves.length > 0) {
  console.log(`\n⚠️ NEST MOVES FOUND: ${nestMoves.join(', ')} - this might be the bug!`);
} else {
  console.log(`\n✓ NO NEST MOVES: Ghosting into Nest correctly blocked`);
}
