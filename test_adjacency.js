// Test adjacency for Green Owl at b67
import { getAllOwlMoves } from './src/game/rules/owlRules.js';
import { generateFlightwayRoute, convertToFlightway } from './src/game/rules/flightwayUtils.js';

const owlPosition = "b6-7";

console.log(`\n=== Testing Owl at ${owlPosition} ===\n`);

// Get flightway coordinates
const flightway = convertToFlightway(owlPosition);
console.log(`Flightway coordinates: ${flightway}`);

// Get flightways for b6-7 (which is b67 in the game notation)
console.log(`\nFlightways for b67 (b6-7):`);
console.log(`- b7 flightway`);
console.log(`- g6 flightway`);

// Generate b7 flightway route
console.log(`\n=== B7 Flightway Route ===`);
const b7Route = generateFlightwayRoute('b', 7);
console.log(b7Route.join(' → '));
const b67IndexOnB7 = b7Route.indexOf('b6-7');
console.log(`\nb6-7 is at index ${b67IndexOnB7}`);
if (b67IndexOnB7 > 0) {
  console.log(`Previous on b7: ${b7Route[b67IndexOnB7 - 1]}`);
}
if (b67IndexOnB7 < b7Route.length - 1) {
  console.log(`Next on b7: ${b7Route[b67IndexOnB7 + 1]} *** NEST SQUARE ***`);
}

// Generate g6 flightway route
console.log(`\n=== G6 Flightway Route ===`);
const g6Route = generateFlightwayRoute('g', 6);
console.log(g6Route.join(' → '));
const b67IndexOnG6 = g6Route.indexOf('b6-7');
console.log(`\nb6-7 is at index ${b67IndexOnG6}`);
if (b67IndexOnG6 > 0) {
  console.log(`Previous on g6: ${g6Route[b67IndexOnG6 - 1]}`);
}
if (b67IndexOnG6 < g6Route.length - 1) {
  console.log(`Next on g6: ${g6Route[b67IndexOnG6 + 1]}`);
}

// Get all possible moves (using empty piecePositions since we just want adjacent squares)
console.log(`\n=== All Possible Owl Moves from ${owlPosition} ===`);
const moves = getAllOwlMoves(owlPosition, {});
console.log(`Total moves: ${moves.length}`);
console.log(`Moves: ${moves.join(', ')}`);
console.log(`\n*** NEST SQUARES: b7-7, y7-7, g7-7 ***`);
const nestMoves = moves.filter(m => m === 'b7-7' || m === 'y7-7' || m === 'g7-7');
if (nestMoves.length > 0) {
  console.log(`\n🏆 WINNING MOVES AVAILABLE: ${nestMoves.join(', ')}`);
} else {
  console.log(`\n❌ NO WINNING MOVES FOUND`);
}
