// Labyrinth class - Creates the 3D maze structure
class Labyrinth {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.walls = [];
        this.baseY = 0;
        this.targetY = 0;
        this.isAnimating = false;
        this.animationProgress = 0;

        this.createLabyrinth();
        scene.add(this.group);
    }

    createLabyrinth() {
        // Create base platform
        this.createBasePlatform();

        // Create center target disk
        this.createCenterDisk();

        // Create maze walls with 6 sides and open top/bottom
        this.createMazeWalls();

        // Create outer transparent container to show it's floating
        this.createOuterFrame();
    }

    createBasePlatform() {
        const baseGeometry = new THREE.CylinderGeometry(25, 25, 1, 32);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.3,
            roughness: 0.7,
            transparent: true,
            opacity: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.5;
        base.receiveShadow = true;
        this.group.add(base);
    }

    createCenterDisk() {
        const diskGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 32);
        const diskMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x111111
        });
        this.centerDisk = new THREE.Mesh(diskGeometry, diskMaterial);
        this.centerDisk.position.set(0, 0.25, 0);
        this.centerDisk.receiveShadow = true;
        this.group.add(this.centerDisk);
    }

    createMazeWalls() {
        const wallHeight = 2;
        const wallThickness = 0.5;
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x667eea,
            metalness: 0.4,
            roughness: 0.6,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });

        // Define wall segments for a spiral path with 4 distinct sections
        // Each section has 1-2 corners
        const wallSegments = [
            // Outer ring - Section 1
            { start: { x: -20, z: -20 }, end: { x: 20, z: -20 } }, // Bottom wall
            { start: { x: 20, z: -20 }, end: { x: 20, z: -15 } },  // Right wall segment

            // Section 2 - first turn area
            { start: { x: -20, z: -20 }, end: { x: -20, z: 20 } }, // Left wall
            { start: { x: -20, z: 20 }, end: { x: -15, z: 20 } },  // Top wall segment

            // Middle ring - Section 3
            { start: { x: -15, z: -15 }, end: { x: 15, z: -15 } }, // Middle bottom
            { start: { x: 15, z: -15 }, end: { x: 15, z: 15 } },   // Middle right

            // Inner ring - Section 4 (leads to center)
            { start: { x: -10, z: -10 }, end: { x: 10, z: -10 } }, // Inner bottom
            { start: { x: 10, z: -10 }, end: { x: 10, z: 10 } },   // Inner right
            { start: { x: -10, z: 10 }, end: { x: 10, z: 10 } },   // Inner top

            // Connecting passages
            { start: { x: -15, z: 15 }, end: { x: -15, z: -15 } }, // Left connector
            { start: { x: 15, z: 15 }, end: { x: 10, z: 15 } },    // Top right connector
            { start: { x: -10, z: -10 }, end: { x: -10, z: 10 } }, // Inner left
        ];

        wallSegments.forEach((segment, index) => {
            const wall = this.createWallSegment(
                segment.start,
                segment.end,
                wallHeight,
                wallThickness,
                wallMaterial
            );
            this.walls.push(wall);
            this.group.add(wall);
        });

        // Add some decorative vertical pillars at key corners
        this.addCornerPillars(wallHeight);
    }

    createWallSegment(start, end, height, thickness, material) {
        const length = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
        );

        const geometry = new THREE.BoxGeometry(length, height, thickness);
        const wall = new THREE.Mesh(geometry, material);

        // Position and rotate wall
        wall.position.x = (start.x + end.x) / 2;
        wall.position.y = height / 2;
        wall.position.z = (start.z + end.z) / 2;

        const angle = Math.atan2(end.z - start.z, end.x - start.x);
        wall.rotation.y = -angle;

        wall.castShadow = true;
        wall.receiveShadow = true;

        return wall;
    }

    addCornerPillars(height) {
        const pillarGeometry = new THREE.CylinderGeometry(0.8, 0.8, height, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0x764ba2,
            metalness: 0.6,
            roughness: 0.4,
            emissive: 0x221133
        });

        const pillarPositions = [
            { x: -20, z: -20 }, // Entrance corner
            { x: 20, z: -20 },  // Bottom right
            { x: -20, z: 20 },  // Top left
            { x: 15, z: 15 },   // Middle
            { x: -10, z: -10 }, // Inner corner
        ];

        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(pos.x, height / 2, pos.z);
            pillar.castShadow = true;
            this.group.add(pillar);
        });
    }

    createOuterFrame() {
        // Create transparent bounding box to show it's a floating 3D structure
        const frameGeometry = new THREE.BoxGeometry(52, 8, 52);
        const edgesGeometry = new THREE.EdgesGeometry(frameGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: 0x4455aa,
            transparent: true,
            opacity: 0.3,
            linewidth: 2
        });

        const frame = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        frame.position.y = 2;
        this.group.add(frame);
    }

    getEntrancePosition() {
        // Entrance is at the outer bottom-left area
        return new THREE.Vector3(-18, 1, -18);
    }

    getCenterPosition() {
        return new THREE.Vector3(0, 1, 0);
    }

    // Define the path waypoints for the 4-step journey
    getPathWaypoints() {
        return [
            // Step 1: From entrance to first corner (bottom area)
            [
                new THREE.Vector3(-18, 1, -18),
                new THREE.Vector3(0, 1, -18),
                new THREE.Vector3(18, 1, -17)
            ],
            // Step 2: Around to left side
            [
                new THREE.Vector3(18, 1, -17),
                new THREE.Vector3(18, 1, 0),
                new THREE.Vector3(-18, 1, 0)
            ],
            // Step 3: Through middle section
            [
                new THREE.Vector3(-18, 1, 0),
                new THREE.Vector3(-13, 1, -13),
                new THREE.Vector3(0, 1, -13),
                new THREE.Vector3(13, 1, 0)
            ],
            // Step 4: Final approach to center
            [
                new THREE.Vector3(13, 1, 0),
                new THREE.Vector3(8, 1, -8),
                new THREE.Vector3(0, 1, -8),
                new THREE.Vector3(0, 1, 0)
            ]
        ];
    }

    // Animate maze drop (8% down)
    dropMaze(duration = 800, delay = 200) {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.isAnimating = true;
                this.animationProgress = 0;
                this.targetY = -this.group.position.y - 8; // 8% of approximate height
                const startY = this.group.position.y;
                const startTime = Date.now();

                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Easing function (ease-out)
                    const eased = 1 - Math.pow(1 - progress, 3);

                    this.group.position.y = startY + (this.targetY * eased);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        this.isAnimating = false;
                        resolve();
                    }
                };

                animate();
            }, delay);
        });
    }

    update() {
        // Animation updates handled in dropMaze
    }
}
