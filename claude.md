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

## Current Status

**Working:**
- Toggle button functional
- Non-glass mode preserves original appearance
- Cellular flicker eliminated (alpha 0 on internal walls)
- Sand-blasted squares show grey instead of brown

**Issues Remaining:**
- Base may still appear white/not fully transparent in glass mode
- Overall glass appearance "not quite right" per user feedback
- Balance between transparency and visibility challenging

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
