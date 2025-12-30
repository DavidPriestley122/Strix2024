# Glass Mode Implementation Notes

## Objective
Add a toggle button to switch between solid and glass/transparent appearance for the Strix game board, base, and fins while keeping game pieces solid.

## Design Goals
- **Solid mode**: Exactly as original - unchanged appearance
- **Glass mode**:
  - Base and fins: Clear transparent glass
  - Board squares: Sand-blasted grey/white frosted glass (dark squares) and clear transparent glass (light squares)
  - Eliminate "cellular flicker" from internal cube walls
  - No brown/yellow color in glass - should look like actual glass/perspex

## Technical Approach

### Multi-Material System
- Board cubes use MultiMaterial with 6 sub-materials (one per face)
- Face 4 (top/front surface): Shows checkerboard pattern
- Faces 0-3, 5 (sides/back/bottom): Glass material (invisible in glass mode)

### Material Strategy

#### StandardMaterial vs PBRMaterial
**StandardMaterial (Blinn-Phong lighting):**
- Properties: diffuseColor, specularColor, specularPower, emissiveColor, alpha
- Simple, predictable lighting model
- Good for solid, matte, or simple shiny surfaces
- Less realistic for complex materials like glass
- Lower computational cost

**PBRMaterial (Physically Based Rendering):**
- Properties: albedoColor, metallic, roughness, emissiveColor, alpha, indexOfRefraction
- Realistic light behavior including Fresnel effects
- Better for glass: supports refraction, proper reflections at angles
- Can link refraction with transparency for realistic glass
- Higher computational cost
- **Key issue**: Renders differently even in solid mode - couldn't match original appearance

**Solid Mode:**
- StandardMaterial with original properties
- Base/fins/board: Brown/dark/light colors as originally designed
- Must remain unchanged from pre-glass-mode implementation

**Glass Mode Evolution:**
1. **Attempt 1 - StandardMaterial only**: Used alpha transparency. Result: "smoky/dark" appearance, not clear glass
2. **Attempt 2 - Full PBR**: Converted all materials to PBRMaterial with IOR 1.5, roughness control. Result: Realistic glass but solid mode looked "washed out" - couldn't match original
3. **Attempt 3 - Hybrid**: StandardMaterial for base/board (preserves solid mode), PBRMaterial only for invisible cube sides. Current approach.

### Key Properties
**Glass Mode Current Settings:**
- Base/fins: alpha 0.05, slight blue tint, StandardMaterial
- Sand-blasted squares: grey (0.88, 0.88, 0.88), alpha 0.9, low specular power (5)
- Clear squares: white, alpha 0.05, standard specular (64)
- Internal cube walls: PBRMaterial, alpha 0.0 (completely invisible)

## Challenges Encountered

### 1. White/Glowing Appearance
- **Issue**: Base and board appeared white instead of transparent
- **Cause**: Emissive color and high alpha creating layered opacity
- **Solutions tried**: Reduced emissive to 0, lowered alpha, adjusted diffuse color tint

### 2. Cellular Flicker
- **Issue**: Internal cube walls visible when moving camera, creating shimmer/grid pattern
- **Cause**: Multiple overlapping transparent faces with slight visibility
- **Solution**: Set internal cube wall alpha to 0.0 (completely invisible)

### 3. Non-Glass Mode Changed
- **Issue**: PBRMaterial rendered differently than original StandardMaterial
- **Cause**: Different rendering properties (roughness, metallic vs specular)
- **Solution**: Reverted to StandardMaterial for all non-internal materials

### 4. Sand-Blasted Effect
- **Issue**: Dark squares remained brown instead of grey/frosted appearance
- **Solutions tried**:
  - StandardMaterial with low specular power
  - PBRMaterial with high roughness (0.95)
  - Grey diffuse color (0.88) with alpha 0.9

### 5. Color Retention Through Glass
- **Issue**: Original brown/yellow colors visible through glass sides
- **Solution**: Set glass side materials to pure clear/white in glass mode

## File Changes

### gameCheckerBoards.js
- Added multi-material setup for board cubes
- Face 4: StandardMaterial (checkerboard)
- Faces 0-3, 5: PBRMaterial (glass sides, invisible)

### gameBaseAndFins.js
- Reverted to StandardMaterial (original)
- Toggle modifies properties for glass mode

### strixGameRefactored.js
- Added `toggleGlassMode()` function
- Iterates through all materials and adjusts properties
- Restores original properties when toggling off

### index.html
- Added glass mode toggle button
- Event listener calls `window.toggleGlassMode()`

## Current Status (After Opus 4 Implementation)

**New Approach - Material Swapping:**
- Consulted with Claude Opus 4 for architectural guidance
- Completely replaced property-modification approach with material swapping
- Original materials stored in Map and NEVER modified
- Glass materials created separately with PBR refraction
- Toggle switches entire material objects, not individual properties

**Implementation:**
- Environment texture added (required for glass reflections)
- PBR materials with subSurface.isRefractionEnabled = true
- Index of refraction: 1.5
- Refraction intensity: 0.8 (0.3 for frosted)
- Five glass material types: clear, frosted, tinted, tinted_green, invisible

**Material Mapping:**
- Base/fins: clear glass (IOR 1.5, roughness 0, alpha 0.15)
- Back panels: tinted glass (brown tint, roughness 0.1, alpha 0.25)
- Edge strips: tinted green glass (green tint, roughness 0.1, alpha 0.3)
- Dark board squares: frosted glass (grey, roughness 0.4, alpha 0.4)
- Light board squares: clear glass (roughness 0, alpha 0.15)
- Internal cube walls: invisible (alpha 0, no refraction)

**Advantages:**
- Non-glass mode guaranteed unchanged (original materials preserved)
- Realistic glass physics with proper refraction
- Environment reflections for depth
- No more property conflicts or "washed out" appearance
- Clean architecture - initialization separate from toggle

## Commits
- Initial multi-material implementation
- PBRMaterial conversion
- Multiple emissive/alpha adjustments
- StandardMaterial reversion
- Total: ~15 commits over glass mode feature

## Considerations for Next Steps

1. **Alternative approaches:**
   - Custom shaders for more control over glass appearance
   - Separate material instances that swap on toggle
   - Environment reflections/refraction textures

2. **Simplification options:**
   - Accept limitations of StandardMaterial transparency
   - Use simpler alpha-only approach without multi-material
   - Consider if glass mode is essential vs nice-to-have

3. **Visual refinement:**
   - May need artist/designer input on exact glass appearance desired
   - Could benefit from reference images of desired glass effect
   - User testing with different alpha/color values

---

# Click Detection Bug Fix (Owlhalla Pieces)

## Problem Discovered
**Date:** December 2025 (during AI development)

**Symptom:** Green Owl at g4-1 could move to g3-1 via clicking, but g4-1 → g5-1 didn't respond to clicks. Manual text entry worked fine for both moves.

**Initial hypothesis:** Glass mode changes (MultiMaterial, backFaceCulling) affected click detection on specific squares.

**User's insight:** "Sometimes there is an invisible Owlhalla piece in the way" - captured pieces in Owlhalla might be blocking clicks.

## Root Cause

When pieces are captured and moved to Owlhalla:
1. **visibility** is set to `false` (piece becomes invisible) ✓
2. **isPickable** remained `true` (piece still intercepts raycasts) ✗

In BabylonJS:
- `visibility = false` - mesh not rendered, but still pickable by default
- `isPickable = false` - mesh ignored by raycasting (clicks pass through)

**Result:** Invisible captured pieces were blocking clicks on board squares positioned behind them in 3D space.

## Why Only Certain Squares Affected

Owlhalla cube positions:
- Green face: g7--1 at (8.5, 0.5, -0.25), g6--1 at (8.5, 1.5, -0.25), g5--1 at (8.5, 2.5, -0.25)
- Board cubes: g5-1 at (6.5, 2.5, -0.25)

Same Y and Z coordinates! Depending on camera angle and captured piece positions, raycasts could hit invisible Owlhalla pieces before reaching board squares.

## Solution

**Files Changed:**
1. `src/game/rendering/animations.js` line 144
2. `src/game/controllers/eventController.js` line 662

**Changes:**
```javascript
// When capturing pieces
piece3D.visibility = owlHallaVisible;
piece3D.isPickable = owlHallaVisible;  // NEW: Match pickability to visibility

// When toggling Owlhalla visibility
piece.visibility = owlHallaVisible;
piece.isPickable = owlHallaVisible;  // NEW: Match pickability to visibility
```

**Behavior:**
- **Owlhalla invisible:** Captured pieces are invisible AND unpickable (clicks pass through to board)
- **Owlhalla visible:** Captured pieces are visible AND pickable (can double-click to restore)

## Double-Click Dependency

**Important:** BabylonJS `ActionManager.OnDoublePickTrigger` requires `isPickable = true`.

If pieces remained unpickable when Owlhalla is shown, you couldn't double-click them to restore. This is why both files needed updating:
- animations.js: Makes pieces unpickable when captured
- eventController.js: Makes pieces pickable again when Owlhalla is shown

## Revert Instructions (If Needed)

**To revert this fix:**
1. Remove `piece3D.isPickable = owlHallaVisible;` from animations.js line 144
2. Remove `piece.isPickable = owlHallaVisible;` from eventController.js line 662

**Note:** Reverting will restore the bug where invisible pieces block clicks on certain board squares.

## Commit
- Commit: ad991ad "Fix click detection bug caused by invisible Owlhalla pieces"

---

# Double-Click Trackpad Support Enhancement

## Problem Discovered
**Date:** December 2025 (during UI modernization)

**Symptom:** Double-clicking pieces to send them to Owlhalla (for capture/restore) worked reliably with an external mouse on a large monitor, but was extremely erratic on laptop trackpads. Users had to multi-click rapidly (7+ times) to get it to work, and even then a "shadowed square" error message would briefly appear.

**Initial hypothesis:** Double-click timing was too tight (600ms window).

**User's insight:** "When I multi-click rapidly it eventually works, but I'm still clicking, so the click is then applying to the square underneath" - the issue wasn't just timing, but also click penetration and position drift on trackpads.

## Root Causes

### 1. BabylonJS Double-Click Position Requirement
BabylonJS's built-in `OnDoublePickTrigger` appears to require both clicks to hit nearly the exact same position. On trackpads:
- Natural hand movement causes cursor drift between clicks
- Even small movements (a few pixels) can prevent double-click detection
- Mice have more stable cursor positioning

### 2. Multi-Click Side Effect
When users had to multi-click rapidly to compensate:
1. First click would select the piece (single click)
2. Subsequent clicks would hit squares underneath while piece was selected
3. If those squares were shadowed, error messages appeared
4. Eventually one pair of clicks would register as double-click
5. But user was still clicking, hitting the now-empty square

### 3. Insufficient Time Window
The 600ms double-click delay (increased from default 300ms) was still marginal for trackpad users who double-click more slowly.

## Solution: Custom Double-Click Detection

**File Changed:** `src/game/controllers/eventController.js`

### Implementation Details

**Replaced BabylonJS's OnDoublePickTrigger with custom logic:**

```javascript
// Custom double-click detection with position tolerance
const lastClicks = new Map(); // pieceName -> { time, screenX, screenY }
const DOUBLE_CLICK_TIME_MS = 900; // Time window for double-click
const DOUBLE_CLICK_DISTANCE_PX = 50; // Position tolerance in pixels

function isDoubleClick(pieceName, event) {
  const now = Date.now();
  const lastClick = lastClicks.get(pieceName);

  if (!lastClick) {
    // First click - store time and position
    lastClicks.set(pieceName, {
      time: now,
      screenX: event.screenX || scene.pointerX,
      screenY: event.screenY || scene.pointerY
    });
    return false;
  }

  // Calculate time and distance from last click
  const timeDiff = now - lastClick.time;
  const distance = Math.sqrt(
    Math.pow(currentX - lastClick.screenX, 2) +
    Math.pow(currentY - lastClick.screenY, 2)
  );

  // Update last click
  lastClicks.set(pieceName, { time: now, screenX: currentX, screenY: currentY });

  // Check tolerances
  if (timeDiff < DOUBLE_CLICK_TIME_MS && distance < DOUBLE_CLICK_DISTANCE_PX) {
    lastClicks.delete(pieceName); // Clear to prevent triple-click
    return true;
  }
  return false;
}
```

### Key Features

1. **Time Tolerance: 900ms**
   - Increased from 600ms
   - Accommodates slower, more deliberate trackpad double-clicks

2. **Position Tolerance: 50 pixels**
   - Allows natural cursor drift between clicks
   - Typical trackpad movement is 10-30 pixels between double-clicks
   - 50px buffer provides comfortable margin

3. **Per-Piece Tracking**
   - Each piece tracks its own click history
   - Prevents cross-piece interference

4. **Debug Logging**
   - Console logs show timing (ms) and distance (px) between clicks
   - Helps users understand why clicks fail/succeed
   - Useful for tuning tolerance values

5. **Triple-Click Prevention**
   - Clears click history after successful double-click
   - Prevents third click from triggering another double-click

### Action Manager Changes

**Before:**
```javascript
actionManager.registerAction(
  new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
    this.handlePieceSingleClick(piece);
  })
);
actionManager.registerAction(
  new ExecuteCodeAction(ActionManager.OnDoublePickTrigger, () => {
    this.handlePieceDoubleClick(piece);
  })
);
```

**After:**
```javascript
actionManager.registerAction(
  new ExecuteCodeAction(ActionManager.OnPickTrigger, (evt) => {
    if (isDoubleClick(piece.name, evt.sourceEvent || {})) {
      this.handlePieceDoubleClick(piece);
    } else {
      this.handlePieceSingleClick(piece);
    }
  })
);
```

## Results

- **Trackpad reliability:** Double-click now works consistently on laptop trackpads
- **Mouse compatibility:** Still works perfectly with external mice
- **No multi-click needed:** Users can double-click normally
- **No false positives:** 50px tolerance is tight enough to prevent accidental double-clicks
- **Tunable:** Tolerances can be easily adjusted if needed (75px or 100px for more forgiving behavior)

## Related Improvements

### Glass Mode Background Enhancement
**Issue:** Dark blue-grey background didn't provide enough contrast for glass transparency effects.

**Solution:** Toggle background to pale warm grey (RGB: 0.92, 0.92, 0.88) in glass mode.

**File:** `src/game/strixGameRefactored.js`
```javascript
const backgroundPlane = scene.getMeshByName("backgroundPlane");
if (isGlassMode) {
  backgroundPlane.material.diffuseColor = new Color3(0.92, 0.92, 0.88);
} else {
  backgroundPlane.material.diffuseColor = new Color3(
    GAME_CONFIG.BACKGROUND.COLOR_RGB.R,
    GAME_CONFIG.BACKGROUND.COLOR_RGB.G,
    GAME_CONFIG.BACKGROUND.COLOR_RGB.B
  );
}
```

**Commit:** 6589a15 "Add pale background color for glass mode to improve contrast"

### Glass Mode Lighting Adjustment
**Issue:** Pieces appeared too dark in glass mode (70% lighting reduction).

**Solution:** Removed lighting dimming entirely to maintain piece visibility.

**File:** `src/game/strixGameRefactored.js` - removed light intensity reduction code

**Commit:** 896ca0a "Remove lighting dimming in glass mode to keep pieces bright"

## Commits

1. ac2ec20 "Increase double-click delay to 900ms for better trackpad support" - Initial timing adjustment
2. a440918 "Implement custom double-click detection with position tolerance for trackpads" - Main fix

## Tuning Options

If 50 pixels proves insufficient:
- Increase `DOUBLE_CLICK_DISTANCE_PX` to 75 or 100
- Increase `DOUBLE_CLICK_TIME_MS` to 1000 or 1200
- Both values are constants at the top of the function for easy adjustment

Console logging can be removed in production by commenting out the `console.log()` statements in the `isDoubleClick()` function.

---

# AI Player Implementation - Max^n Refactoring

## Date
December 25, 2025

## Project Goal Shift
**Discovery**: This is not a production AI for casual play - it's a **research tool** for game theory analysis.

### Research Questions to Answer
1. **Opening theory**: Does Brown have forced losses after certain opening moves?
2. **Game balance**: Are there forced wins/draws from the starting position?
3. **Third Bird Rule impact**: Does it make the game unwinnable or always drawn?
4. **Tourney dynamics**: Can one strong player beat two weak players consistently?

**Implication**: Speed is not critical (AI can think for hours per move). Depth and accuracy matter most.

## Architecture: Paranoid Minimax → Max^n

### The Problem with Paranoid Minimax

**Original approach**: Treated all opponents as allied against the AI
```javascript
if (currentPlayer === this.playerColor) {
  maximize(score);  // My turn
} else {
  minimize(score);  // Opponent turn (Yellow AND Green minimize my score)
}
```

**Why this fails for 3-player games**:
- Assumes opponents cooperate against you
- Doesn't model Yellow vs Green competition
- **Incompatible with Third Bird Foul** (requires understanding opponent-vs-opponent dynamics)

### Max^n Solution

**New approach**: Each player independently maximizes their own score
```javascript
// Each player picks move that maximizes THEIR score
const scores = {
  brown: evaluateForBrown(position),
  yellow: evaluateForYellow(position),
  green: evaluateForGreen(position)
};

if (currentPlayer === 'brown') {
  pickMoveThatMaximizes(scores.brown);
} else if (currentPlayer === 'yellow') {
  pickMoveThatMaximizes(scores.yellow);
}
// etc.
```

**Benefits**:
- ✅ Models realistic 3-player competition
- ✅ Compatible with Third Bird Foul detection (can check "does my move help Yellow beat Green?")
- ✅ Backend-ready architecture (storage abstraction added)
- ✅ Foundation for AI learning (AIMemory class added)

## Files Created

### 1. `src/ai/aiStorage.js`
**Storage abstraction layer** - allows swapping between LocalStorage and Railway backend without changing AI logic.

**Classes**:
- `AIStorage` (abstract base)
- `LocalAIStorage` (browser localStorage implementation)
- `BackendAIStorage` (Railway API implementation - future)

**Data format** (works for both local and remote):
```json
{
  "playerColor": "brown",
  "version": "1.0",
  "statistics": {
    "gamesPlayed": 100,
    "wins": 35,
    "losses": 40,
    "draws": 25
  },
  "patterns": [...],
  "evaluationWeights": {...}
}
```

### 2. `src/ai/aiMemory.js`
**AI learning and pattern management** - tracks game outcomes, stores learned patterns.

**Current features**:
- Game statistics tracking (wins/losses/draws)
- Win rate calculation
- Evaluation weight storage

**Future features** (Phase 2):
- Pattern-based learning ("avoid positions that led to losses")
- Position hashing for pattern matching
- Automatic weight tuning based on outcomes

## Files Modified

### `src/ai/aiStrategies.js`

**Major changes**:

1. **Imports**:
   - Added `LocalAIStorage`, `AIMemory`
   - Reduced depth from 3 → 2 → 1

2. **evaluatePosition()** - Returns scores for all 3 players:
```javascript
// Before (single score from AI's perspective)
evaluatePosition(piecePositions) {
  let score = 0;
  // Add to score for our pieces
  // Subtract from score for opponent pieces
  return score;
}

// After (Max^n - scores for each player)
evaluatePosition(piecePositions) {
  const scores = {
    brown: 0,
    yellow: 0,
    green: 0
  };

  // Part 1: Each player's Owl distance to nest affects THEIR score
  scores[color] += positionalValue;

  // Part 2: Ghosting threats benefit the threatening player
  scores[color] += ghostingBonus;

  // Part 3: Being under attack hurts that player's score
  scores[color] -= threatPenalty;

  // Part 4: Ability to win benefits that player, hurts others
  if (canWin) {
    scores[color] += 100000;
    for (otherColor of opponents) {
      scores[otherColor] -= 100000;
    }
  }

  return scores;
}
```

3. **minimax() → maxn()** - Each player maximizes their own score:
```javascript
// Before (paranoid)
minimax(position, depth, currentPlayer) {
  if (currentPlayer === this.playerColor) {
    return Math.max(childScores);  // Maximize
  } else {
    return Math.min(childScores);  // Minimize (opponent)
  }
}

// After (Max^n)
maxn(position, depth, currentPlayer) {
  const childScores = evaluateChildren();  // Returns {brown: X, yellow: Y, green: Z}

  // Current player picks move with best score FOR THEM
  return bestScores where childScores[currentPlayer] is highest;
}
```

4. **Shadow filtering** - Added to prevent illegal moves:
   - AI calculates shadowed squares during evaluation
   - Filters out shadowed destinations in `getPossibleMoves()`
   - Fixes bug where AI didn't recognize defensive moves blocked opponent wins

## Performance Investigation

### The Slowness Problem
- **Depth 2**: 15-20 seconds per move (expected: <2 seconds)
- **Depth 1**: Should be <1 second (30 positions vs 900)

### Root Cause Analysis

**Not the branching factor**:
- Strix: 9 pieces, ~30 moves per position
- Chess: 32 pieces, ~30-40 moves per position
- Strix should be easier!

**The real bottleneck**:
1. **JSON cloning** (for each position simulation):
   ```javascript
   const newState = JSON.parse(JSON.stringify(piecePositions));
   // Called ~900 times at depth 2
   // JSON.parse/stringify is VERY slow: 10-20ms per call
   // 900 × 20ms = 18 seconds just for cloning!
   ```

2. **Expensive evaluation**:
   - Shadow calculation: 9 pieces × 7 shadow squares = loops at every position
   - Ghosting detection: 3 players × 9 pieces × cross-adjacency checks = ~27 complex operations
   - Pattern detection: Called at every position

3. **Position evaluation complexity**:
   - Chess: Count material, check king safety (~100-200 operations)
   - Strix: Shadow calc + ghosting + captures + move generation (~250+ operations)
   - 10-50x more work per position!

### Solution Path (Research Mode)

**Not focusing on speed** (user can wait hours):
- Keep depth 1 for now (basic competence)
- Later add depth 4-6 with:
  - **Transposition tables** (cache evaluated positions)
  - **Iterative deepening** (search deeper over time)
  - **Opening book** (pre-compute opening sequences)

**Future optimization** (if needed for production):
- WebAssembly (C++ compiled to run in browser at 10-50x speed)
- Or Railway backend (C++ on server)

## Depth Levels Explained

**Depth 0**: No search, just evaluate current position

**Depth 1** (current):
- Try each of my moves
- Evaluate resulting positions
- Pick best one
- **Can see**: Immediate wins, captures, positional gains
- **Cannot see**: Opponent responses, 2-move combinations

**Depth 2**:
- Try each of my moves
- For each, simulate next player's responses
- Evaluate positions after their response
- **Can see**: "If I move here, opponent can respond with X"
- **Positions evaluated**: ~900 (30 my moves × 30 their responses)

**Depth 3**:
- One full round (my move + next player + third player)
- **Positions evaluated**: ~27,000 (30 × 30 × 30)

**For research**:
- Depth 4-6 needed to find forced sequences
- With transposition tables: Many positions cached, so actual evaluations much lower

## Research Roadmap

### Phase 1: Basic Competence (Current)
- ✅ Max^n refactoring complete
- ✅ Shadow filtering integrated
- ✅ Depth reduced to 1
- ⏳ Testing basic tactics (win/capture/defend)

### Phase 2: Deep Search Infrastructure
- Add transposition tables (position caching)
- Add iterative deepening (search deeper over time)
- Increase depth to 4-6
- Let AI think for minutes/hours per move

### Phase 3: Opening Analysis
- AI vs AI games from all possible first moves
- Database all games with outcomes
- Statistical analysis: "Brown's first move X leads to Y% win rate"

### Phase 4: Third Bird Foul Integration
- Implement Third Bird Foul detection in Max^n
- Re-run all opening analysis with rule enabled
- Compare: Does it balance the game?

### Phase 5: Tourney Simulation
- AI at different depths = different skill levels
- Simulate: Depth 2 (weak) + Depth 2 (weak) vs Depth 6 (strong)
- Run 100s of games
- Analyze: "Can strong player beat two weak players?"

## Commits

1. **239f094** - "Add shadow filtering to AI move generation for defensive play"
   - Added calculateShadows() to flightwayUtils.js
   - Modified AI's getPossibleMoves() to filter shadowed squares
   - Bug fix: AI now recognizes defensive moves block opponent wins

2. **d8c9f6d** - "Refactor AI from paranoid minimax to Max^n for proper 3-player modeling"
   - Created aiStorage.js, aiMemory.js
   - Converted evaluatePosition() to return 3-player scores
   - Replaced minimax with maxn algorithm
   - Reduced depth to 2 for performance

3. **5574518** - "Reduce AI search depth to 1 for basic competence testing"
   - Changed depth 2 → 1
   - Fast response for initial testing
   - Foundation for research phase

## Current Status

**Working**:
- Max^n correctly models 3-player competition
- Shadow filtering prevents illegal moves
- Backend-ready architecture
- Depth 1 should be fast (<1 second)

**Testing needed**:
- Does AI win when Owl can reach nest?
- Does AI capture pieces when possible?
- Does AI defend against immediate threats?
- Does AI make sensible positional moves?

**Next**: After verifying basic competence, build deep search for game analysis.

---

# Mobile Responsiveness Attempts - December 28, 2025

## Problem Statement

Game is optimized for desktop with fixed dimensions (1840x1380px). On mobile and smaller screens:
- Right sidebar (AI controls) overlays the game, making it unplayable
- Left sidebar also overlays when window is narrow
- Game needs full screen width on mobile
- Sidebars should be accessible but not block the game

## User Requirements

From user feedback:
- Desktop: Works very well in full screen, pieces big enough to click
- Both sidebars rarely needed during active play (occasional use)
- Left sidebar: Game info, how to play (occasional access)
- Right sidebar: AI controls (set once per game)
- **Core insight**: Don't try to make game responsive - make sidebars collapsible to give game more space

## Attempts Made (December 28, 2025)

### Attempt 1: Hamburger Menus with Slide-in Sidebars
**Commits**: b8e23c2, f17a77f (experimental branch: mobile-fix-experiment)

**Approach**:
- Hide sidebars on mobile (< 768px)
- Add hamburger buttons (☰) to toggle sidebars
- Sidebars slide in from off-screen with `transform: translateX()`
- Auto-collapse at < 1400px (later changed to < 2340px)

**Problems encountered**:
- Game appeared tiny in top right corner on mobile
- Existing media query `(max-width: 1024px)` set `width: 100%; height: auto;` - conflicted with fixed 1840px width
- `transform: scale(0.95)` made already-small game even smaller
- Game not centering properly

**Commits reverted**: Experimental branch deleted

### Attempt 2: Collapsible Sidebars for Desktop and Mobile
**Commits**: 56aeb62 through cb3c397

**Approach**:
- Make right sidebar solid (not translucent) to match left
- Add toggle buttons (◀ ▶) for both sidebars
- Sidebars collapse with `transform: translateX()`
- Auto-collapse when window < 2340px (game width + both sidebars)
- Game wrapper adjusts with margins/padding to avoid sidebars

**Problems encountered**:
1. **Sidebar asymmetry**: Right sidebar encroached on game space when resizing, left didn't
   - Tried: `margin-left` and `margin-right` on game wrapper
   - Issue: Game has `left: 250px` offset for left sidebar but no corresponding right offset

2. **Centering issues**: Game not centered when sidebars collapsed
   - Tried: `margin: auto` when collapsed
   - Issue: Flexbox on `<main>` interfered with margin-based centering

3. **Flexbox conflicts**: Added `justify-content: center` to `<main>`
   - Issue: Flexbox + margins don't play well together
   - Game not centered in full screen vs normal window modes

4. **Padding approach**: Switched to padding instead of margins
   - Issue: Still not centering properly, asymmetric resize behavior

**Root cause identified**:
- `<main>` has `display: flex` (line 40 of main.css)
- Game wrapper is a flex item
- Mixing flexbox layout + margin/padding centering causes conflicts
- Fixed width game (1840px) + viewport constraints + sidebar space = complex layout math

**Final state**: Reverted all changes (commit 55fc199)

## Lessons Learned

### What Doesn't Work:
1. **Simple CSS transforms alone** - Need proper layout adjustments for game wrapper
2. **Mixing centering approaches** - Flexbox + margin-based centering conflict
3. **Fixed width game + flexible sidebars** - Math becomes complex:
   - Game: 1840px
   - Left sidebar: 250px
   - Right sidebar: 250px
   - Total needed: 2340px
   - When viewport < 2340px, something must give

### Key Technical Issues:
1. **Flexbox on main** - Makes game wrapper a flex item, interfering with traditional centering
2. **Existing media query** - `@media (max-width: 1024px)` sets `width: 100%; height: auto;` but doesn't handle aspect ratio properly
3. **Sidebar positioning** - Both are `position: fixed`, game wrapper is `position: relative`
4. **No consistent layout model** - Mixing fixed positioning, flexbox, and block layout

## Recommended Approach for Future Attempts

### Option A: Simplified Overlay (Easiest)
- Keep sidebars as `position: fixed` overlays
- Add simple hide/show toggle buttons
- Don't try to adjust game wrapper at all
- On mobile: sidebars start hidden, show on tap
- Accept that open sidebars will overlay game (user closes them to play)

### Option B: Proper Responsive Layout (More work)
1. **Remove flexbox from main** - Use block or grid layout
2. **Make game truly responsive**:
   - Use viewport units: `width: min(1840px, 100vw - 500px)`
   - Use aspect-ratio CSS or padding-bottom hack: `aspect-ratio: 1840 / 1380`
   - Let game scale down naturally while maintaining proportions
3. **Sidebars**:
   - Desktop: visible by default
   - < 2340px: auto-collapse
   - Provide toggle to show when needed
4. **Center game with grid or flexbox** - Pick ONE layout model and stick with it

### Option C: Mobile-first Redesign (Best UX)
- Separate mobile and desktop layouts entirely
- Mobile: Stack vertically (header, game, controls below)
- Desktop: Current three-column layout
- Use proper responsive breakpoints

## Current State (After Revert)

**Working**:
- Desktop layout perfectly centered and functional
- Game at natural size on large screens
- No mobile optimization but also not broken

**Not working**:
- Mobile: Sidebars overlay game
- Smaller desktop windows: Sidebars encroach on game space

**Files at good state**:
- Commit: 55fc199 (after revert)
- All CSS back to pre-mobile-attempt state
- Only addition: netlify.toml for Node 20

## Next Steps (When Revisiting)

1. **Decide on layout model**: Flexbox OR grid OR block (not mixed)
2. **Test incrementally**: Make ONE change at a time, test on multiple screen sizes
3. **Use browser DevTools device emulation**: Test before deploying
4. **Consider CSS frameworks**: Or study how responsive game sites handle this (chess.com, etc.)
5. **Accept tradeoffs**: Perfect mobile experience might require compromises on desktop or vice versa

## Related Commits

- b8e23c2: Initial mobile responsiveness attempt (reverted)
- 56aeb62: Collapsible sidebars attempt (reverted)
- 55fc199: Revert to working desktop state
- Branch: mobile-fix-experiment (deleted locally and remotely)

---

# AI Kite En Prise Bug Fix (Dec 30, 2024)

## Problem
Yellow AI refused to capture Brown Kite with Yellow Raven (mobbing move at g3-3). Yellow scored the capture as -580 (should be positive), so rejected it in favor of worse moves.

## Root Cause Analysis
After systematic debugging (disabling threat types one by one), identified that Kite threat detection was generating -900 in false en prise penalties.

**The Bug**: In `canPieceMoveToThreaten()` (src/ai/aiStrategies.js:1002), Kite threat detection was doing a **2-move lookahead**:
1. Simulate Kite moving from position A to position B
2. From B, check if Kite can move AGAIN to position C (cross-face, adjacent to victim)

This is wrong because **Kites capture DURING their swooping move**, not after. They land on a cross-face square and capture adjacent opponents as part of that single move.

The 2-move lookahead created hundreds of false threats because every simulated Kite position could theoretically make another capture move.

## The Fix
**Commit**: f228619 (2024-12-30)
**File**: src/ai/aiStrategies.js

Added special-case handling for Kites in `canPieceMoveToThreaten()`:
- Check if Kite can move directly (1 move) to a cross-face square adjacent to victim
- Don't simulate moving there and then check for another move
- Other piece types (Owls, Ravens) still use the 2-step simulation since they threaten from static positions

```javascript
// SPECIAL CASE FOR KITES: They capture DURING their move, not after
if (oppPiece.type === 'Kite') {
  const oppFace = oppPiece.position[0];
  const victimFace = myPiece.position[0];

  if (oppFace === victimFace) return false; // Can't swoop on same face

  const possibleMoves = this.getPossibleMoves(oppPiece, state);
  const adjacentToVictim = this.getAdjacentSquares(myPiece.position);

  // Check if Kite can move to a cross-face square adjacent to victim (1-move capture)
  const crossFaceMoves = possibleMoves.filter(move => move[0] !== oppFace);
  return crossFaceMoves.some(move => adjacentToVictim.includes(move));
}
```

## Result
- Eliminated -900 in false en prise penalties
- Yellow now correctly evaluates capturing Brown Kite as positive and executes it
- No more console spam from hundreds of Kite threat logs

## Related Commits
- d2b486c: Initial attempt (wrong - added cross-face filter in wrong function)
- f96e6ad: Rebuild bundle.js
- f228619: Actual fix - special-case Kites in canPieceMoveToThreaten
