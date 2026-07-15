# AI Strategies Audit - Game Mechanisms

**Last updated: July 15, 2026** (previous version predated shadow-filtering integration and was stale)

## Game Mechanisms — Current Status

### 1. **Shadowing** ✅ INTEGRATED
- `calculateShadowedSquares()` in `src/ai/aiStrategies.js` mirrors `gameStateManager.updateShadowedRows()`
- `getPossibleMoves()` filters shadowed destinations (Rule 5); pass-through of crosspieces (Rule 6) is handled by the rule generators
- Win-threat detection (Part 5 of `evaluatePosition`) checks nest squares for shadowing, excluding the moving Owl itself

### 2. **Ghosting** ✅ INTEGRATED
- Move generation includes ghosting via `getAllOwlMoves()`
- `StrixPatterns.detectCompleteGhostThreats()` detects ghost threats; crosspieces from **any team** are considered (Rule 8), excluding only the Owl itself (fixed July 2026)
- Ghost-opportunity bonus (Part 2b) rewards setting up pivots a move ahead

### 3. **Mobbing** ✅ INTEGRATED
- `simulateMove()` and threat detection use `isValidMobbingConfiguration()` from `ravenRules.js` (real geometry, not heuristics)
- Passive Raven may be from any team, including paralysed teams (Rule 12/16)

### 4. **Capture Rules** ✅ INTEGRATED
- Owl: direct capture by displacement (Rule 9)
- Kite: cross-face swoop, captures exactly **one** adjacent victim — most valuable chosen (Rule 10/11, fixed July 2026)
- Raven: mobbing may capture all sandwiched victims (Rule 13)
- Rule 15 (Owl on black square immune to Kites/Ravens) enforced in both threat detection **and** `simulateMove` (fixed July 2026)

### 5. **Move Validation** ✅ CONSISTENT
- Live board: `moveExecutor.isValidMove()` (the game's own validator)
- Hypothetical positions (search / Third Bird checks): `legalMovesInState()` — rule-based generation + Rule 4 (non-Owls can't stop on nest) + Owl own-team occupancy. `moveExecutor` is deliberately **not** consulted for simulated states (fixed July 2026 — it validates the live board only)

## Known Remaining Gaps

1. **No exchange evaluation** — en-prise penalties (Part 4) ignore whether the threatened piece is defended, so the AI plays materially timid
2. **Rule 13 "or none"** — `simulateMove` always executes available captures; declining a capture (e.g. to avoid a Third Bird foul) cannot be expressed
3. **Kite swoop adjacency is same-face only** — if around-the-corner adjacency counts for swoop victims, the AI won't see those threats (verify against `kiteRules.js`)
4. **Thicket 1/2 not implemented** — Third Bird checking is Thicket 0 (Types 1 & 2) only
5. **Class naming** — `MinimaxAI` actually implements max^n with threat-extension search
