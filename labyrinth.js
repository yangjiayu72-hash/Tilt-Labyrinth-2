// Multi-layer Labyrinth class
class Labyrinth {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.layers = [];
        this.layerCount = 5;
        this.layerSpacing = 8; // Vertical spacing between layers

        this.createLayers();
        scene.add(this.group);
    }

    createLayers() {
        const colors = [
            0x667eea, // Purple-blue (Layer 1)
            0x22aa88, // Teal (Layer 2)
            0xff6b6b, // Red (Layer 3)
            0xffa502, // Orange (Layer 4)
            0x9b59b6  // Purple (Layer 5)
        ];

        // Create 5 layers, each with different maze layout and holes
        for (let i = 0; i < this.layerCount; i++) {
            const layer = this.createLayer(i, colors[i]);
            layer.position.y = -i * this.layerSpacing;
            this.layers.push(layer);
            this.group.add(layer);
        }
    }

    createLayer(layerIndex, color) {
        const layerGroup = new THREE.Group();
        layerGroup.userData.layerIndex = layerIndex;
        layerGroup.userData.holes = [];

        // Create base platform with transparency
        const baseGeometry = new THREE.BoxGeometry(50, 1, 50);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.6,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.receiveShadow = true;
        base.castShadow = true;
        layerGroup.add(base);

        // Create walls based on layer index
        const walls = this.getWallsForLayer(layerIndex);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: this.lightenColor(color, 0.3),
            metalness: 0.4,
            roughness: 0.5
        });

        walls.forEach(wallData => {
            const wall = this.createWall(wallData, wallMaterial);
            layerGroup.add(wall);
        });

        // Create holes (except for the last layer)
        if (layerIndex < this.layerCount - 1) {
            const holes = this.getHolesForLayer(layerIndex);
            holes.forEach(holePos => {
                const hole = this.createHole(holePos);
                layerGroup.add(hole);
                layerGroup.userData.holes.push(holePos);
            });
        }

        // Add outer boundary walls (6 sides)
        this.createBoundaryWalls(layerGroup, wallMaterial);

        return layerGroup;
    }

    createWall(wallData, material) {
        const { start, end, height = 2 } = wallData;
        const length = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
        );

        const geometry = new THREE.BoxGeometry(length, height, 0.6);
        const wall = new THREE.Mesh(geometry, material);

        wall.position.x = (start.x + end.x) / 2;
        wall.position.y = height / 2;
        wall.position.z = (start.z + end.z) / 2;

        const angle = Math.atan2(end.z - start.z, end.x - start.x);
        wall.rotation.y = -angle;

        wall.castShadow = true;
        wall.receiveShadow = true;

        return wall;
    }

    createBoundaryWalls(layerGroup, material) {
        const size = 50;
        const half = size / 2;
        const height = 3;

        const boundaries = [
            { start: { x: -half, z: -half }, end: { x: half, z: -half } }, // Front
            { start: { x: half, z: -half }, end: { x: half, z: half } },   // Right
            { start: { x: half, z: half }, end: { x: -half, z: half } },   // Back
            { start: { x: -half, z: half }, end: { x: -half, z: -half } }  // Left
        ];

        boundaries.forEach(boundary => {
            const wall = this.createWall({ ...boundary, height }, material);
            layerGroup.add(wall);
        });
    }

    createHole(position) {
        const holeRadius = 1.5;
        const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, 1.2, 16);
        const holeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x111111
        });

        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.position.set(position.x, 0, position.z);
        hole.userData.isHole = true;
        hole.userData.radius = holeRadius;

        // Add a glowing ring around the hole
        const ringGeometry = new THREE.TorusGeometry(holeRadius + 0.2, 0.1, 8, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.6;
        hole.add(ring);

        return hole;
    }

    getWallsForLayer(layerIndex) {
        // Different maze patterns for each layer
        switch (layerIndex) {
            case 0: // Layer 1 - Simple spiral
                return [
                    { start: { x: -20, z: -20 }, end: { x: 15, z: -20 } },
                    { start: { x: -20, z: -20 }, end: { x: -20, z: 15 } },
                    { start: { x: -15, z: -10 }, end: { x: 10, z: -10 } },
                    { start: { x: -15, z: -10 }, end: { x: -15, z: 10 } },
                    { start: { x: -5, z: 0 }, end: { x: 15, z: 0 } },
                ];
            case 1: // Layer 2 - Zigzag pattern
                return [
                    { start: { x: -18, z: -15 }, end: { x: 0, z: -15 } },
                    { start: { x: 0, z: -15 }, end: { x: 0, z: 0 } },
                    { start: { x: 0, z: 0 }, end: { x: 18, z: 0 } },
                    { start: { x: 18, z: 0 }, end: { x: 18, z: 15 } },
                    { start: { x: -10, z: 10 }, end: { x: 10, z: 10 } },
                ];
            case 2: // Layer 3 - Cross pattern
                return [
                    { start: { x: -20, z: -2 }, end: { x: -5, z: -2 } },
                    { start: { x: 5, z: -2 }, end: { x: 20, z: -2 } },
                    { start: { x: -2, z: -20 }, end: { x: -2, z: -5 } },
                    { start: { x: -2, z: 5 }, end: { x: -2, z: 20 } },
                    { start: { x: -15, z: -15 }, end: { x: -15, z: -8 } },
                    { start: { x: 15, z: 15 }, end: { x: 15, z: 8 } },
                ];
            case 3: // Layer 4 - Circular pattern
                return [
                    { start: { x: -12, z: -12 }, end: { x: 12, z: -12 } },
                    { start: { x: 12, z: -12 }, end: { x: 12, z: 12 } },
                    { start: { x: 12, z: 12 }, end: { x: -12, z: 12 } },
                    { start: { x: -12, z: 12 }, end: { x: -12, z: -12 } },
                    { start: { x: -6, z: -6 }, end: { x: 6, z: -6 } },
                ];
            case 4: // Layer 5 - Final maze (no holes)
                return [
                    { start: { x: -15, z: 0 }, end: { x: -5, z: 0 } },
                    { start: { x: 5, z: 0 }, end: { x: 15, z: 0 } },
                    { start: { x: 0, z: -15 }, end: { x: 0, z: -5 } },
                    { start: { x: 0, z: 5 }, end: { x: 0, z: 15 } },
                ];
            default:
                return [];
        }
    }

    getHolesForLayer(layerIndex) {
        // Position holes strategically in each layer
        switch (layerIndex) {
            case 0: // Layer 1
                return [
                    new THREE.Vector3(10, 0, 10),
                    new THREE.Vector3(-10, 0, -15)
                ];
            case 1: // Layer 2
                return [
                    new THREE.Vector3(15, 0, 12),
                    new THREE.Vector3(-15, 0, 5)
                ];
            case 2: // Layer 3
                return [
                    new THREE.Vector3(8, 0, -8),
                    new THREE.Vector3(-8, 0, 15)
                ];
            case 3: // Layer 4
                return [
                    new THREE.Vector3(0, 0, 0)
                ];
            default:
                return [];
        }
    }

    lightenColor(color, amount) {
        const c = new THREE.Color(color);
        c.r = Math.min(1, c.r + amount);
        c.g = Math.min(1, c.g + amount);
        c.b = Math.min(1, c.b + amount);
        return c.getHex();
    }

    getStartPosition() {
        // Start position on the first layer
        return new THREE.Vector3(-22, 1, -22);
    }

    getLayerCount() {
        return this.layerCount;
    }

    getLayer(index) {
        return this.layers[index];
    }

    getWalls(layerIndex) {
        const layer = this.layers[layerIndex];
        if (!layer) return [];

        const walls = [];
        layer.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'BoxGeometry') {
                walls.push(child);
            }
        });
        return walls;
    }

    getHoles(layerIndex) {
        const layer = this.layers[layerIndex];
        return layer ? layer.userData.holes : [];
    }

    setTilt(tiltX, tiltZ) {
        this.group.rotation.x = tiltX;
        this.group.rotation.z = tiltZ;
    }

    resetRotation() {
        this.group.rotation.set(0, 0, 0);
    }
}
