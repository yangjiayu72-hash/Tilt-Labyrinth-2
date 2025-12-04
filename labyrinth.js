// Cube Maze Labyrinth class - 6 faces forming a cube
class Labyrinth {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.faces = {};
        this.faceSize = 30; // Size of each cube face

        this.createCubeFaces();
        scene.add(this.group);
    }

    createCubeFaces() {
        const colors = {
            top: 0x667eea,    // Purple-blue
            bottom: 0x9b59b6, // Purple
            front: 0x22aa88,  // Teal
            back: 0xff6b6b,   // Red
            left: 0xffa502,   // Orange
            right: 0x3498db   // Blue
        };

        // Create each face of the cube
        this.faces.top = this.createFace('top', colors.top,
            new THREE.Vector3(0, this.faceSize / 2, 0),
            new THREE.Euler(0, 0, 0));

        this.faces.bottom = this.createFace('bottom', colors.bottom,
            new THREE.Vector3(0, -this.faceSize / 2, 0),
            new THREE.Euler(Math.PI, 0, 0));

        this.faces.front = this.createFace('front', colors.front,
            new THREE.Vector3(0, 0, this.faceSize / 2),
            new THREE.Euler(-Math.PI / 2, 0, 0));

        this.faces.back = this.createFace('back', colors.back,
            new THREE.Vector3(0, 0, -this.faceSize / 2),
            new THREE.Euler(Math.PI / 2, 0, 0));

        this.faces.left = this.createFace('left', colors.left,
            new THREE.Vector3(-this.faceSize / 2, 0, 0),
            new THREE.Euler(0, 0, Math.PI / 2));

        this.faces.right = this.createFace('right', colors.right,
            new THREE.Vector3(this.faceSize / 2, 0, 0),
            new THREE.Euler(0, 0, -Math.PI / 2));
    }

    createFace(faceName, color, position, rotation) {
        const faceGroup = new THREE.Group();
        faceGroup.userData.faceName = faceName;
        faceGroup.position.copy(position);
        faceGroup.rotation.copy(rotation);

        // Create base platform
        const baseGeometry = new THREE.BoxGeometry(this.faceSize, 0.5, this.faceSize);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.6,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.receiveShadow = true;
        base.castShadow = true;
        faceGroup.add(base);

        // Create walls for this face
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: this.lightenColor(color, 0.3),
            metalness: 0.4,
            roughness: 0.5
        });

        const walls = this.getWallsForFace(faceName);
        walls.forEach(wallData => {
            const wall = this.createWall(wallData, wallMaterial);
            faceGroup.add(wall);
        });

        this.group.add(faceGroup);
        return faceGroup;
    }

    createWall(wallData, material) {
        const { start, end, height = 2 } = wallData;
        const length = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
        );

        const geometry = new THREE.BoxGeometry(length, height, 0.4);
        const wall = new THREE.Mesh(geometry, material);

        wall.position.x = (start.x + end.x) / 2;
        wall.position.y = height / 2 + 0.25; // Offset from base
        wall.position.z = (start.z + end.z) / 2;

        const angle = Math.atan2(end.z - start.z, end.x - start.x);
        wall.rotation.y = -angle;

        wall.castShadow = true;
        wall.receiveShadow = true;

        return wall;
    }

    getWallsForFace(faceName) {
        const half = this.faceSize / 2;

        switch (faceName) {
            case 'top': // Top face - simple cross pattern
                return [
                    { start: { x: -10, z: -10 }, end: { x: 10, z: -10 } },
                    { start: { x: -10, z: 10 }, end: { x: 10, z: 10 } },
                    { start: { x: 0, z: -half + 5 }, end: { x: 0, z: -5 } },
                    { start: { x: 0, z: 5 }, end: { x: 0, z: half - 5 } },
                ];

            case 'front': // Front face - zigzag
                return [
                    { start: { x: -12, z: -10 }, end: { x: 0, z: -10 } },
                    { start: { x: 0, z: -10 }, end: { x: 0, z: 0 } },
                    { start: { x: 0, z: 0 }, end: { x: 12, z: 0 } },
                    { start: { x: 12, z: 0 }, end: { x: 12, z: 10 } },
                ];

            case 'right': // Right face - spiral
                return [
                    { start: { x: -12, z: -12 }, end: { x: 8, z: -12 } },
                    { start: { x: -12, z: -12 }, end: { x: -12, z: 8 } },
                    { start: { x: -8, z: -6 }, end: { x: 6, z: -6 } },
                    { start: { x: -8, z: -6 }, end: { x: -8, z: 6 } },
                ];

            case 'back': // Back face - rooms
                return [
                    { start: { x: -10, z: -2 }, end: { x: -3, z: -2 } },
                    { start: { x: 3, z: -2 }, end: { x: 10, z: -2 } },
                    { start: { x: -2, z: -12 }, end: { x: -2, z: -4 } },
                    { start: { x: -2, z: 4 }, end: { x: -2, z: 12 } },
                ];

            case 'left': // Left face - maze
                return [
                    { start: { x: -10, z: -10 }, end: { x: 10, z: -10 } },
                    { start: { x: 10, z: -10 }, end: { x: 10, z: 0 } },
                    { start: { x: -10, z: 0 }, end: { x: 5, z: 0 } },
                    { start: { x: -5, z: 5 }, end: { x: 10, z: 5 } },
                ];

            case 'bottom': // Bottom face - circular
                return [
                    { start: { x: -8, z: -8 }, end: { x: 8, z: -8 } },
                    { start: { x: 8, z: -8 }, end: { x: 8, z: 8 } },
                    { start: { x: 8, z: 8 }, end: { x: -8, z: 8 } },
                    { start: { x: -8, z: 8 }, end: { x: -8, z: -8 } },
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
        // Start position on top face
        return new THREE.Vector3(-12, 0.9, -12);
    }

    getStartFace() {
        return 'top';
    }

    getFace(faceName) {
        return this.faces[faceName];
    }

    getWalls(faceName) {
        const face = this.faces[faceName];
        if (!face) return [];

        const walls = [];
        face.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'BoxGeometry' &&
                child.geometry.parameters.depth === 0.4) { // Wall thickness
                walls.push(child);
            }
        });
        return walls;
    }

    // Get the adjacent face when crossing an edge
    getAdjacentFace(currentFace, edge) {
        const adjacency = {
            top: { north: 'back', south: 'front', east: 'right', west: 'left' },
            bottom: { north: 'front', south: 'back', east: 'right', west: 'left' },
            front: { north: 'top', south: 'bottom', east: 'right', west: 'left' },
            back: { north: 'bottom', south: 'top', east: 'right', west: 'left' },
            left: { north: 'top', south: 'bottom', east: 'front', west: 'back' },
            right: { north: 'top', south: 'bottom', east: 'back', west: 'front' }
        };

        return adjacency[currentFace]?.[edge] || currentFace;
    }

    // Get gravity direction for a face (in world coordinates)
    getGravityDirection(faceName) {
        const directions = {
            top: new THREE.Vector3(0, -1, 0),
            bottom: new THREE.Vector3(0, 1, 0),
            front: new THREE.Vector3(0, 0, -1),
            back: new THREE.Vector3(0, 0, 1),
            left: new THREE.Vector3(1, 0, 0),
            right: new THREE.Vector3(-1, 0, 0)
        };
        return directions[faceName] || new THREE.Vector3(0, -1, 0);
    }

    setTilt(tiltX, tiltZ) {
        this.group.rotation.x = tiltX;
        this.group.rotation.z = tiltZ;
    }

    resetRotation() {
        this.group.rotation.set(0, 0, 0);
    }
}
