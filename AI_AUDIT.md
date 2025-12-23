# AI Strategies Audit - Game Mechanisms

## Game Mechanisms to Verify

### 1. **Shadowing** ❌ NOT INTEGRATED
- **Location**: `src/game/managers/gameStateManager.js` - `updateShadowedRows()`
- **How it works**: Pieces cast shadows on other faces; shadowed squares cannot be occupied
- **Current AI status**:
  - ❌ Move generation (`getAllOwlMoves`, etc.) doesn't check shadows
  - ❌ Position evaluation doesn't account for shadows
  - ❌ Win threat detection doesn't filter shadowed nest squares
- **Fix needed**:
  - Import/implement shadow calculation in AI
  - Filter shadowed squares from possible moves
  - Check shadows when evaluating win threats

### 2. **Ghosting** ⚠️ PARTIALLY INTEGRATED
- **Location**: `src/game/rules/owlRules.js` - `getGhostingMoves()`
- **How it works**: Owls jump through cross-adjacent pieces to other faces
- **Current AI status**:
  - ✅ Move generation includes ghosting moves
  - ✅ Position evaluation detects ghosting threats (via StrixPatterns)
  - ⚠️ Win threat detection uses `getPossibleMoves` but doesn't verify moves are actually valid
- **Fix needed**:
  - Verify ghosting moves account for path blocking
  - Ensure ghosting calculation respects all constraints

### 3. **Mobbing** ❓ UNKNOWN
- **Location**: Likely in Raven rules
- **How it works**: Ravens can gang up on Owls
- **Current AI status**: Unknown - needs investigation
- **Fix needed**: Verify mobbing is properly evaluated

### 4. **Capture Rules** ⚠️ PARTIALLY INTEGRATED
- **Location**: Various rule files
- **Current AI status**:
  - ✅ Position evaluator checks capture threats (Part 3)
  - ⚠️ May not account for all piece-specific capture rules
- **Fix needed**: Verify all capture mechanisms are evaluated

### 5. **Move Validation** ❌ INCONSISTENT
- **Current AI status**:
  - Move generation uses rule files (`getAllOwlMoves`, etc.)
  - Position evaluation uses `getPossibleMoves` which may not match actual validation
  - Win threat detection doesn't use proper validation
- **Fix needed**: Use consistent validation that matches game controller

## Priority Fixes

### HIGH PRIORITY
1. **Add shadow checking to win threat detection**
   - Implement `calculateShadowedSquares(piecePositions)` in AI
   - Filter nest squares by shadow status
   - This will fix the immediate bug where defensive moves aren't recognized

2. **Add shadow checking to move generation**
   - Ensure `getPossibleMoves` filters out shadowed destinations
   - Or add shadow filtering layer in AI

### MEDIUM PRIORITY
3. **Audit mobbing mechanics**
   - Understand how it works
   - Verify AI accounts for it

4. **Verify capture rules are complete**
   - Check all piece types
   - Ensure AI evaluates all capture scenarios

### LOW PRIORITY
5. **Optimize evaluation function**
   - After mechanisms are correct, tune weights
   - Add more strategic patterns

## Implementation Plan

1. Create `calculateShadowedSquares(piecePositions)` helper function
2. Modify Part 4 of `evaluatePosition()` to check shadows
3. Test with the failing game scenario
4. If successful, continue with medium priority items
5. Create comprehensive test suite for AI play
