# 3D Multi-Layer Tilt Labyrinth

An interactive 3D floating labyrinth with physics-based ball rolling, real-time tilt controls, and multi-layer navigation.

## Features

### Core Mechanics
- **Mouse-Controlled Tilting**: Drag your mouse to tilt the entire maze in real-time
- **Physics-Based Ball Movement**: 18mm reflective metal sphere that rolls naturally based on gravity and maze angle
- **Multi-Layer System**: Navigate through 5 distinct colored layers, each with unique maze patterns
- **Hole Mechanics**: Fall through holes to reach lower layers
- **Wall Collision Detection**: Realistic bouncing and collision response

### Visual Features
- **5 Colored Layers**:
  - Layer 1: Purple-blue with spiral pattern
  - Layer 2: Teal with zigzag pattern
  - Layer 3: Red with cross pattern
  - Layer 4: Orange with circular pattern
  - Layer 5: Purple final layer
- **Transparent Platforms**: See all layers simultaneously with semi-transparent floors
- **6-Wall Construction**: Complete boundary walls on all sides (open top/bottom)
- **Glowing Holes**: Cyan-lit holes mark fall-through points
- **Reflective Sphere**: Highly metallic 18mm ball with realistic materials
- **Dynamic Lighting**: Shadows and point light that follows the ball

### Interaction
- **Drag to Tilt**: Click and drag anywhere to control maze angle
- **Touch Support**: Full mobile/tablet touch controls
- **Reset Button**: Instantly return to start position
- **Real-Time UI**: Current layer indicator updates as you progress

## How to Use

1. **Open** `index.html` in a modern web browser
2. **Drag** your mouse to tilt the maze
3. **Guide** the ball toward holes to reach lower layers
4. **Navigate** through all 5 layers
5. **Reset** anytime with the reset button

## Controls

### Mouse Controls
- **Click + Drag**: Tilt the maze in any direction
- **Horizontal Drag**: Tilt left/right
- **Vertical Drag**: Tilt forward/backward

### Touch Controls
- **Touch + Drag**: Same as mouse, works on mobile devices

### Reset
- **Reset Button**: Returns ball to starting position on Layer 1

## Physics System

### Ball Mechanics
- **Gravity**: Rolls naturally based on maze tilt angle
- **Friction**: Realistic deceleration on flat surfaces
- **Maximum Speed**: Capped to prevent unrealistic velocity
- **Bounce**: Realistic collision response with walls
- **Fall Through**: Automatically detects holes and triggers falling animation

### Collision Detection
- **Wall Collision**: Box-based collision with reflection physics
- **Boundary Walls**: Prevents ball from leaving maze area
- **Hole Detection**: Radius-based detection for fall triggers

## Technical Details

### Technologies
- **Three.js (r128)** - 3D rendering engine
- **Vanilla JavaScript** - Game logic and physics
- **CSS3** - UI styling

### File Structure
```
Tilt-Labyrinth-2/
├── index.html       - Main HTML structure
├── styles.css       - UI styling
├── main.js          - Scene setup and tilt controls
├── labyrinth.js     - Multi-layer maze generation
├── sphere.js        - Physics-based ball simulation
└── README.md        - Documentation
```

### Architecture

#### Labyrinth Class (`labyrinth.js`)
- Creates 5 distinct layers with different colors and patterns
- Generates walls using parametric definitions
- Places holes strategically in each layer
- Manages 6-wall boundary system
- Handles real-time rotation based on tilt input

#### Sphere Class (`sphere.js`)
- Physics simulation with gravity and friction
- Velocity-based movement with damping
- Wall collision detection using bounding boxes
- Hole detection using distance calculations
- Smooth falling animations between layers
- Rolling rotation effects

#### Main Controller (`main.js`)
- Scene, camera, and renderer initialization
- Mouse/touch event handling
- Tilt angle calculations with clamping
- Animation loop orchestration
- Dynamic lighting that follows the ball

## Layer Designs

### Layer 1 (Purple-Blue)
- **Pattern**: Simple spiral
- **Holes**: 2 holes at strategic positions
- **Difficulty**: Beginner

### Layer 2 (Teal)
- **Pattern**: Zigzag corridors
- **Holes**: 2 holes requiring navigation
- **Difficulty**: Easy

### Layer 3 (Red)
- **Pattern**: Cross intersection
- **Holes**: 2 holes in tricky spots
- **Difficulty**: Medium

### Layer 4 (Orange)
- **Pattern**: Circular maze
- **Holes**: 1 central hole
- **Difficulty**: Hard

### Layer 5 (Purple)
- **Pattern**: Final challenge
- **Holes**: None (final layer)
- **Difficulty**: Expert

## Physics Constants

```javascript
gravity: 0.3          // Acceleration from tilt
friction: 0.98        // Velocity decay per frame
bounceDamping: 0.5    // Velocity reduction on collision
maxSpeed: 0.8         // Maximum ball velocity
maxTilt: π/6          // Maximum maze angle (30°)
```

## Browser Compatibility

**Recommended Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements:**
- WebGL support
- ES6 JavaScript support
- Hardware acceleration enabled

## Performance

- **Target FPS**: 60
- **Shadow Quality**: 2048×2048 shadow maps
- **Polygon Count**: Optimized for real-time rendering
- **Physics Updates**: Every frame (60 Hz)

## Tips for Players

1. **Start Gentle**: Small tilts are easier to control
2. **Plan Ahead**: Look for holes before committing to a direction
3. **Use Momentum**: Sometimes you need speed to reach distant holes
4. **Watch Layers**: Semi-transparent floors let you see upcoming challenges
5. **Practice**: Each layer has a unique feel and strategy

## Development Notes

### Collision System
The collision detection uses AABB (Axis-Aligned Bounding Box) intersection tests combined with reflection physics. When a collision is detected, the ball's velocity is reflected off the collision normal with damping applied.

### Layer Coordinate System
Each layer maintains its own local coordinate space. The ball's position is tracked in local coordinates and converted to world space for rendering, accounting for the layer's vertical offset.

### Tilt Implementation
Maze tilt is implemented as rotation around X (pitch) and Z (roll) axes. The rotation is clamped to ±30° to prevent excessive angles. Ball physics calculate gravity force as `sin(tilt) * gravity`.

---

**Enjoy navigating the multi-layer labyrinth!** 🎮✨

Created with Three.js and physics simulation
