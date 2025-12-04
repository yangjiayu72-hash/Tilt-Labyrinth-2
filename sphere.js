// Physics-based Sphere class for Cube Maze
class Sphere {
    constructor(scene, startPosition, labyrinth) {
        this.scene = scene;
        this.labyrinth = labyrinth;
        this.radius = 0.9;
        this.position = startPosition.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.currentFace = labyrinth.getStartFace();

        // Physics constants
        this.gravity = 0.15;
        this.friction = 0.96;
        this.bounceDamping = 0.3;
        this.maxSpeed = 0.5;

        this.createSphere();
    }

    createSphere() {
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            metalness: 0.95,
            roughness: 0.08,
            envMapIntensity: 1.5
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;

        // Add glow
        const glowGeometry = new THREE.SphereGeometry(this.radius * 1.15, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glow);

        this.scene.add(this.mesh);
    }

    update(tiltX, tiltZ) {
        // Calculate gravity force based on tilt and current face orientation
        const gravityForce = new THREE.Vector3(
            Math.sin(tiltZ) * this.gravity,
            0,
            Math.sin(tiltX) * this.gravity
        );

        // Apply gravity to velocity
        this.velocity.add(gravityForce);

        // Apply friction
        this.velocity.multiplyScalar(this.friction);

        // Limit maximum speed
        const speed = this.velocity.length();
        if (speed > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }

        // Use substeps for accurate collision detection
        const substeps = 3;
        const subVelocity = this.velocity.clone().multiplyScalar(1 / substeps);

        for (let i = 0; i < substeps; i++) {
            const oldPosition = this.position.clone();
            const newPosition = this.position.clone().add(subVelocity);

            // Check collisions and edge transitions
            const result = this.checkWallCollisionsMultiPass(oldPosition, newPosition);
            this.position.copy(result.position);

            // Check if we crossed to a different face
            if (result.newFace) {
                this.currentFace = result.newFace;
            }
        }

        // Update mesh position
        this.mesh.position.copy(this.getWorldPosition());

        // Add rolling rotation
        const rotationSpeed = this.velocity.length() * 2;
        this.mesh.rotation.x += this.velocity.z * rotationSpeed;
        this.mesh.rotation.z -= this.velocity.x * rotationSpeed;

        // Pulse glow effect
        if (this.glow) {
            this.glow.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
        }
    }

    checkWallCollisionsMultiPass(oldPosition, newPosition) {
        const maxIterations = 4;
        let finalPosition = newPosition.clone();
        let newFace = null;

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let hadCollision = false;
            const iterationResult = this.checkWallCollisions(oldPosition, finalPosition);

            if (iterationResult.hadCollision) {
                finalPosition = iterationResult.position;
                hadCollision = true;
            }

            if (iterationResult.newFace) {
                newFace = iterationResult.newFace;
            }

            if (!hadCollision) {
                break;
            }
        }

        return { position: finalPosition, newFace };
    }

    checkWallCollisions(oldPosition, newPosition) {
        const walls = this.labyrinth.getWalls(this.currentFace);
        let finalPosition = newPosition.clone();
        let hasCollision = false;
        let newFace = null;

        // Check wall collisions
        walls.forEach(wall => {
            const collision = this.checkWallCollision(finalPosition, wall);
            if (collision.hasCollision) {
                hasCollision = true;
                finalPosition.copy(collision.position);
                this.velocity.copy(collision.velocity);
            }
        });

        // Check cube face boundaries and transitions
        const faceHalf = this.labyrinth.faceSize / 2;
        const edgeMargin = this.radius + 0.5;

        // Check boundaries (edges of current face)
        if (Math.abs(finalPosition.x) > faceHalf - edgeMargin) {
            // Hit east or west edge - for now, just constrain
            finalPosition.x = Math.sign(finalPosition.x) * (faceHalf - edgeMargin);
            this.velocity.x *= -this.bounceDamping;
            hasCollision = true;
        }

        if (Math.abs(finalPosition.z) > faceHalf - edgeMargin) {
            // Hit north or south edge - for now, just constrain
            finalPosition.z = Math.sign(finalPosition.z) * (faceHalf - edgeMargin);
            this.velocity.z *= -this.bounceDamping;
            hasCollision = true;
        }

        return {
            position: finalPosition,
            hadCollision: hasCollision,
            newFace
        };
    }

    checkWallCollision(spherePos, wall) {
        const wallPos = wall.position;
        const wallRot = wall.rotation;
        const wallGeometry = wall.geometry;
        const wallWidth = wallGeometry.parameters.width;
        const wallHeight = wallGeometry.parameters.height;
        const wallDepth = wallGeometry.parameters.depth;

        // Transform sphere position to wall's local space
        const localSpherePos = new THREE.Vector3()
            .subVectors(spherePos, wallPos)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), -wallRot.y);

        // Calculate closest point on the wall
        const closestX = Math.max(-wallWidth / 2, Math.min(wallWidth / 2, localSpherePos.x));
        const closestY = Math.max(-wallHeight / 2, Math.min(wallHeight / 2, localSpherePos.y));
        const closestZ = Math.max(-wallDepth / 2, Math.min(wallDepth / 2, localSpherePos.z));
        const closestPoint = new THREE.Vector3(closestX, closestY, closestZ);

        const distance = localSpherePos.distanceTo(closestPoint);
        const collisionRadius = this.radius + 0.05;

        if (distance < collisionRadius) {
            let normal = new THREE.Vector3();

            if (distance < 0.01) {
                // Deep penetration - find nearest face
                const distances = [
                    Math.abs(localSpherePos.x - wallWidth / 2),
                    Math.abs(localSpherePos.x + wallWidth / 2),
                    Math.abs(localSpherePos.z - wallDepth / 2),
                    Math.abs(localSpherePos.z + wallDepth / 2)
                ];
                const minIndex = distances.indexOf(Math.min(...distances));

                if (minIndex === 0) normal.set(1, 0, 0);
                else if (minIndex === 1) normal.set(-1, 0, 0);
                else if (minIndex === 2) normal.set(0, 0, 1);
                else normal.set(0, 0, -1);
            } else {
                normal.subVectors(localSpherePos, closestPoint).normalize();
            }

            const worldNormal = normal.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), wallRot.y);
            const penetration = collisionRadius - distance;
            const pushDistance = penetration + 0.1;
            const correctedPos = spherePos.clone().add(worldNormal.clone().multiplyScalar(pushDistance));

            const velocityDotNormal = this.velocity.dot(worldNormal);

            if (velocityDotNormal < 0) {
                const reflection = worldNormal.clone().multiplyScalar(velocityDotNormal * 2);
                const newVelocity = this.velocity.clone().sub(reflection);
                newVelocity.multiplyScalar(this.bounceDamping);

                return {
                    hasCollision: true,
                    position: correctedPos,
                    velocity: newVelocity
                };
            } else {
                return {
                    hasCollision: true,
                    position: correctedPos,
                    velocity: this.velocity.clone().multiplyScalar(0.8)
                };
            }
        }

        return { hasCollision: false };
    }

    getWorldPosition() {
        // For cube maze, position is relative to the face
        // In local face coordinates, y should be just above the surface
        return new THREE.Vector3(
            this.position.x,
            this.position.y,
            this.position.z
        );
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    getCurrentFace() {
        return this.currentFace;
    }

    reset(startPosition) {
        this.position = startPosition.clone();
        this.velocity.set(0, 0, 0);
        this.currentFace = this.labyrinth.getStartFace();
        this.mesh.position.copy(this.getWorldPosition());
        this.mesh.rotation.set(0, 0, 0);

        console.log('Ball reset to start position on face:', this.currentFace);
    }
}
