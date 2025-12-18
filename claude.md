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
