# 3D Tilt Labyrinth

An interactive 3D floating labyrinth with physics-based sphere navigation and spectacular visual effects.

## Features

- **3D Floating Maze**: 6-walled labyrinth structure with open top/bottom for visible depth layers
- **Reflective Metal Sphere**: 18mm highly reflective sphere with realistic materials
- **4-Step Tilt Interaction**: Progressive journey from entrance to center
  - Each tilt moves the sphere 1-2 corners
  - Speed increases progressively: 1.0x → 1.3x → 1.6x → 2.0x
  - Sphere only reaches center on the 4th tilt
- **Spectacular 4th Tilt Effects**:
  - Maze drops 8% with smooth 0.2s buffer easing
  - Sphere launches upward 12%
  - 2 complete orbital loops around maze exterior (12% radius)
  - Graceful settle to center black disk
- **Camera System**: Locked at 25° top-tilt angle with orbit controls
- **Real-time Shadows**: Dynamic lighting and shadow system
- **Smooth Animations**: Eased transitions for all movements

## How to Use

1. Open `index.html` in a modern web browser
2. Click the **TILT** button or press **Spacebar** to execute each tilt
3. Watch the sphere navigate through the maze
4. On the 4th tilt, enjoy the spectacular finale sequence!

## Technical Details

### Technologies
- Three.js (r128) for 3D rendering
- Vanilla JavaScript for interactions
- CSS3 for UI styling

### Files Structure
- `index.html` - Main HTML structure
- `styles.css` - UI styling and animations
- `main.js` - Scene setup, camera, and renderer initialization
- `labyrinth.js` - 3D maze geometry and wall construction
- `sphere.js` - Sphere physics, movement, and orbital mechanics
- `interactions.js` - 4-step tilt sequence orchestration

### Key Components

#### Labyrinth
- Spiral path design with 4 distinct sections
- Decorative pillars at key corners
- Transparent outer frame showing floating structure
- Central black target disk

#### Sphere
- Highly reflective material (metalness: 0.95, roughness: 0.05)
- Smooth path interpolation with easing
- Rolling rotation animation
- Orbital mechanics for finale

#### Interactions
- Progressive speed increase: base speed × (1 + step × 0.3)
- 4th tilt special sequence with choreographed effects
- UI updates with completion message

## Camera Controls

- **Drag** to orbit around the maze (maintains 25° tilt)
- Camera automatically positioned for optimal viewing angle
- Locked vertical angle ensures consistent perspective

## Final State

After completing all 4 tilts:
- ✅ 3D maze intact (dropped 8% lower)
- ✅ Camera at 25° top-tilt angle
- ✅ Orbit controls active
- ✅ Sphere static at center black disk
- ✅ No overlaps or collisions

## Browser Compatibility

Works best in modern browsers with WebGL support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Optimized shadow maps (2048×2048)
- Efficient geometry with appropriate polygon counts
- Smooth 60 FPS animations on modern hardware

---

**Enjoy navigating the 3D Tilt Labyrinth!** 🎮✨
