# Type 2 Third Bird Foul Implementation

**Implementation Date:** January 28, 2026
**Version:** Thicket 0 (immediate next turn only)
**File Modified:** `src/ai/aiStrategies.js`

## Overview

This implementation adds **Type 2: Passive Kingmaking** detection to complement the existing Type 1 (Active Kingmaking) checking. The AI now enforces both types of Third Bird Fouls at Thicket 0 depth.

## What is Type 2?

**Type 2: Giving Nest Sight to Skip-One Player** occurs when:
1. You make a move
2. This gives nest sight to the **skip-one player** (player two positions ahead in turn order)
3. The **intervening next player** cannot prevent the skip-one player from winning
4. You had an alternative move that wouldn't have given nest sight to skip-one

**Key Difference from Type 1:**
- **Type 1**: Your move gives nest sight to the **immediate next player**
- **Type 2**: Your move gives nest sight to the **skip-one player** (two positions ahead), AND the intervening player is helpless

### Example Scenario

```
Turn Order: Yellow → Green → Brown

Yellow's Move:
- Yellow moves yK-b25
- This creates a ghosting pivot for Brown's Owl
- Brown now has nest sight (can reach nest on Brown's turn)

Green's Turn:
- Green has no move that can block Brown's path to nest
- Green is helpless to prevent Brown from winning

Result: Type 2 Third Bird Foul!
- Yellow gave nest sight to Brown (skip-one player)
- Green (intervening player) cannot block
- Brown can call the foul on Yellow
```

## Important Clarification: "Preventing" vs "Blocking"

Throughout this implementation, we use terms like "prevent," "block," and "neutralize the threat." These all refer to **any move that removes an opponent's nest sight**, including:

1. **Positional Blocking**: Moving a piece into the Owl's path to the nest
   - Example: `gR-y73` blocks Yellow's Owl from reaching y7-7

2. **Capturing the Owl**: Eliminating the threat entirely
   - Example: `gK-b66xyO` captures Yellow's Owl (swoop capture)
   - Result: Yellow has no Owl → `hasNestSight('yellow')` returns false

3. **Removing a Ghosting Pivot**: Capturing or moving the piece the Owl needs to ghost through
   - Example: Yellow's Owl needs Brown's Kite at b45 to ghost to nest
   - Green captures: `gK-b45xbK`
   - Result: Yellow's Owl can't ghost anymore → no nest sight

The `canPlayerBlockNestSight()` function detects **all three cases** because it simply checks: "After this move, does the opponent still have nest sight?" Any move that removes nest sight qualifies, regardless of mechanism.

## Implementation Details

### New Functions Added

#### 1. `canPlayerBlockNestSight(playerColor, opponentColor, gameState)`
```javascript
// Returns true if player has ANY move that blocks opponent's nest sight
// Used to check if third player can handle the threat
```

**Logic:**
- Generate all possible moves for the player
- For each move, simulate it
- Check if opponent loses nest sight
- Returns `true` if any blocking move exists

#### 2. `isType2ThirdBirdViolation(move, nextPlayer, skipOnePlayer)`
```javascript
// Main Type 2 detection logic
// Returns true if move gives nest sight to skip-one player when intervening player is helpless
```

**Five-Step Detection:**

1. **Check if skip-one player has nest sight BEFORE my move**
   - Store this state for comparison

2. **Simulate my move** to get post-move state

3. **Check if skip-one player has nest sight AFTER my move**
   - If skip-one already had it before → return `false` (not my fault)
   - If skip-one doesn't have it after → return `false` (I didn't give it to them)

4. **I gave nest sight to skip-one player. Now check if intervening player can prevent them.**
   - Call `canPlayerBlockNestSight(nextPlayer, skipOnePlayer, positionsAfterMyMove)`
   - This checks if intervening player has ANY move that removes skip-one's nest sight
   - Includes: blocking path, capturing Owl, removing ghosting pivot
   - If intervening player CAN prevent → return `false` (they can handle it)

5. **Type 2 violation confirmed:**
   - I gave nest sight to skip-one player
   - Intervening next player is helpless to prevent skip-one from winning
   - Return `true`

### Integration with Move Selection

Modified `selectBestMove()` to check both types:

```javascript
// THIRD BIRD RULE (Thicket 0, Type 1 & Type 2)
const nextPlayer = this.getNextPlayer(this.playerColor);
const skipOnePlayer = this.getNextPlayer(nextPlayer); // Player two positions ahead
const legalMoves = [];
const type1Violations = [];
const type2Violations = [];

for (const move of moves) {
  // Check Type 1: Giving nest sight to immediate next player
  if (this.isType1ThirdBirdViolation(move, nextPlayer)) {
    type1Violations.push(move);
    console.log(`🚫 TYPE 1 THIRD BIRD: ${this.playerColor} gives nest sight to ${nextPlayer}`);
    continue;
  }

  // Check Type 2: Giving nest sight to skip-one player when next player cannot block
  if (this.isType2ThirdBirdViolation(move, nextPlayer, skipOnePlayer)) {
    type2Violations.push(move);
    console.log(`🚫 TYPE 2 THIRD BIRD: ${this.playerColor} gives nest sight to ${skipOnePlayer}, ${nextPlayer} cannot block`);
    continue;
  }

  legalMoves.push(move);
}
```

## Console Output

### Type 1 Violation Detected
```
🚫 TYPE 1 THIRD BIRD: YELLOW yK-b45 would give nest sight to green
```

### Type 2 Violation Detected
```
🚫 TYPE 2 THIRD BIRD: YELLOW yK-b25 gives nest sight to brown, green cannot prevent
```

Note: "Cannot prevent" means Green has no move that blocks the path, captures Brown's Owl, or removes a ghosting pivot.

### All Moves Are Fouls (Unavoidable Foul)
```
⚠️ BROWN: ALL 12 moves violate Third Bird Rule!
   Type 1 violations: 3, Type 2 violations: 9
   Choosing least bad option (unavoidable foul - Rule 17(xi))...
```

## What's Still NOT Implemented

### Thicket 1 and Thicket 2
- Current: Only checks immediate next turn (Thicket 0)
- Thicket 1: Would need multi-round lookahead (5 moves ahead)
- Thicket 2: Would need deeper lookahead (8 moves ahead)

### Human Player Enforcement
- No UI warnings for human moves
- No takeback system
- No move confirmation workflow
- Type 2 checking only applies to AI self-evaluation

### Edge Cases
- **Multi-path blocking**: If there are multiple ways to block, which is required?
- **Capturing vs blocking**: Does capturing the threatening Owl count as blocking?
- **Self-preservation trade-offs**: Rule 17(vi) - sometimes must accept own Owl capture to avoid foul

## Testing

The implementation compiles successfully with webpack 5.91.0.

To test Type 2 detection:
1. Set up a position where next player has nest sight
2. Give current player a blocking move option
3. Ensure third player cannot block
4. AI should reject non-blocking moves and choose the blocking move

## Performance Considerations

Type 2 checking is more expensive than Type 1 because it requires:
- Generating all moves for the current player (to find blocking alternatives)
- Generating all moves for the third player (to check if they can block)
- Multiple simulations per candidate move

For MCTS implementation, this cost is multiplied across thousands of playouts. Consider:
- Caching blocking move checks
- Only enforcing Type 2 at root node (actual move selection)
- Using fast approximate checking during playouts

## Related Rules

This implementation supports:
- **Rule 17(xi)**: Unavoidable Foul - when all moves violate Third Bird
- **Rule 17(vi)**: Self-preservation not sufficient justification (foundation laid)

## Next Steps for Full Compliance

1. ✅ Type 1: Active Kingmaking (implemented Jan 5, 2026)
2. ✅ Type 2: Passive Kingmaking (implemented Jan 28, 2026)
3. ⬜ Thicket 1: Multi-round lookahead (5 moves)
4. ⬜ Thicket 2: Deep lookahead (8 moves)
5. ⬜ Human player UI integration
6. ⬜ Takeback system (Rule 17(iv))
7. ⬜ False foul penalties (Rule 17(ix))

## Files Modified

- `src/ai/aiStrategies.js` (~80 lines)
  - Added `canPlayerBlockNestSight()`
  - Added `isType2ThirdBirdViolation()`
  - Modified `selectBestMove()` to filter both Type 1 and Type 2
  - Updated console logging to distinguish Type 1 vs Type 2 violations

## Commit Message

```
Implement Type 2 Third Bird Foul detection (skip-one kingmaking)

Add Type 2 violation detection to AI move filtering. Type 2 violations
occur when a move gives nest sight to the skip-one player (two positions
ahead in turn order) and the intervening next player is helpless to
prevent the skip-one player from winning.

Key difference from Type 1:
- Type 1: Giving nest sight to immediate next player
- Type 2: Giving nest sight to skip-one player when intervening player cannot block

New helper functions:
- canPlayerBlockNestSight(): Check if player can block opponent's nest sight
- isType2ThirdBirdViolation(): Main Type 2 detection logic

AI now filters both Type 1 and Type 2 kingmaking violations at Thicket 0
depth. Violation types logged separately for debugging.

Prepares foundation for MCTS implementation with complete Third Bird
Rule enforcement.
```
