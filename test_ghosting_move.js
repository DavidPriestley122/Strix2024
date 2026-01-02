// Test ghosting move for Green Owl at b6-7 with Brown Owl at g6-7
import { getAllOwlMoves } from './src/game/rules/owlRules.js';
import { checkCrossAdjacency, calculateSimpleGhostingDestination, convertToFlightway } from './src/game/rules/flightwayUtils.js';

console.log(`\n=== Testing Ghosting: Green Owl at b6-7 around Brown Owl at g6-7 ===\n`);

const greenOwlPos = 'b6-7';
const brownOwlPos = 'g6-7';

// Check cross-adjacency
console.log(`Green Owl: ${greenOwlPos}`);
console.log(`  Flightways: ${convertToFlightway(greenOwlPos)}`);
console.log(`Brown Owl: ${brownOwlPos}`);
console.log(`  Flightways: ${convertToFlightway(brownOwlPos)}`);

const crossAdj = checkCrossAdjacency(greenOwlPos, brownOwlPos);
console.log(`\nCross-adjacent:`, crossAdj);

if (crossAdj.isAdjacent) {
  const destination = calculateSimpleGhostingDestination(greenOwlPos, brownOwlPos, crossAdj);
  console.log(`\nGhosting destination: ${destination}`);
  console.log(`Is this the Nest (y7-7)? ${destination === 'y7-7' ? 'YES ✓' : 'NO ✗'}`);
}

// Get all Owl moves with the position
const piecePositions = {
  'greenOwl': 'b6-7',
  'brownOwl': 'g6-7',
  'brownRaven': 'y3-5',
  'yellowKite': 'y7-1',
  'yellowRaven': 'y1-7',
  'greenKite': 'b2-6',
  'greenRaven': 'y5-5'
};

console.log(`\n=== All moves for Green Owl ===`);
const allMoves = getAllOwlMoves('b6-7', piecePositions);
console.log(`Total moves: ${allMoves.length}`);
console.log(`Moves: ${allMoves.join(', ')}`);

const nestMoves = allMoves.filter(m => m === 'b7-7' || m === 'y7-7' || m === 'g7-7');
if (nestMoves.length > 0) {
  console.log(`\n🏆 WINNING NEST MOVES: ${nestMoves.join(', ')}`);
} else {
  console.log(`\n❌ NO NEST MOVES FOUND`);
}
