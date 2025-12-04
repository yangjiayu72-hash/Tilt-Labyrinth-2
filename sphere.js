// Physics-based Sphere class
class Sphere {
    constructor(scene, startPosition, labyrinth) {
        this.scene = scene;
        this.labyrinth = labyrinth;
        this.radius = 0.9; // 18mm = 1.8cm diameter, 0.9cm radius
        this.position = startPosition.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.currentLayer = 0;
        this.isFalling = false;

        // Physics constants - tuned for stability
        this.gravity = 0.15; // Reduced for more control
        this.friction = 0.96; // Increased friction
        this.bounceDamping = 0.3; // More damping
        this.maxSpeed = 0.5; // Lower max speed

        this.createSphere();
    }

    createSphere() {
        // Create highly reflective metal sphere
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

        // Add subtle glow
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
        if (this.isFalling) {
            this.updateFalling();
            return;
        }

        // Calculate gravity force based on tilt angles (much gentler)
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

        // Use substeps for more accurate collision detection
        // This prevents tunneling through walls at high speeds
        const substeps = 3;
        const subVelocity = this.velocity.clone().multiplyScalar(1 / substeps);

        for (let i = 0; i < substeps; i++) {
            // Store old position for collision recovery
            const oldPosition = this.position.clone();

            // Calculate new position with substep
            const newPosition = this.position.clone().add(subVelocity);

            // Check collisions with walls - multi-iteration for robust collision
            const collidedPosition = this.checkWallCollisionsMultiPass(oldPosition, newPosition);

            // Update position
            this.position.copy(collidedPosition);
        }

        // Update mesh position
        this.mesh.position.copy(this.getWorldPosition());

        // Add rolling rotation
        const rotationSpeed = this.velocity.length() * 2;
        this.mesh.rotation.x += this.velocity.z * rotationSpeed;
        this.mesh.rotation.z -= this.velocity.x * rotationSpeed;

        // Note: Hole checking disabled - sphere stays on same plane
        // this.checkHoles();

        // Pulse glow effect
        if (this.glow) {
            this.glow.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
        }
    }

    checkWallCollisionsMultiPass(oldPosition, newPosition) {
        // Multi-pass collision resolution for robust wall collision
        // This handles corner cases and multiple simultaneous collisions
        const maxIterations = 4;
        let finalPosition = newPosition.clone();

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let hadCollision = false;
            const iterationResult = this.checkWallCollisions(oldPosition, finalPosition);

            if (iterationResult.hadCollision) {
                finalPosition = iterationResult.position;
                hadCollision = true;
            }

            // If no collision in this iteration, we're done
            if (!hadCollision) {
                break;
            }
        }

        return finalPosition;
    }

    checkWallCollisions(oldPosition, newPosition) {
        const walls = this.labyrinth.getWalls(this.currentLayer);
        let finalPosition = newPosition.clone();
        let hasCollision = false;

        // Check each wall for collision
        walls.forEach(wall => {
            const collision = this.checkWallCollision(finalPosition, wall);
            if (collision.hasCollision) {
                hasCollision = true;
                finalPosition.copy(collision.position);
                this.velocity.copy(collision.velocity);
            }
        });

        // Check boundary walls more strictly
        const mazeSize = 25;
        const padding = this.radius + 0.3;

        if (Math.abs(finalPosition.x) > mazeSize - padding) {
            finalPosition.x = Math.sign(finalPosition.x) * (mazeSize - padding);
            this.velocity.x *= -this.bounceDamping;
            hasCollision = true;
        }

        if (Math.abs(finalPosition.z) > mazeSize - padding) {
            finalPosition.z = Math.sign(finalPosition.z) * (mazeSize - padding);
            this.velocity.z *= -this.bounceDamping;
            hasCollision = true;
        }

        return {
            position: finalPosition,
            hadCollision: hasCollision
        };
    }

    checkWallCollision(spherePos, wall) {
        // Get wall properties
        const wallPos = wall.position;
        const wallRot = wall.rotation;

        // Get wall dimensions
        const wallGeometry = wall.geometry;
        const wallWidth = wallGeometry.parameters.width;
        const wallHeight = wallGeometry.parameters.height;
        const wallDepth = wallGeometry.parameters.depth;

        // Transform sphere position to wall's local space
        const localSpherePos = new THREE.Vector3()
            .subVectors(spherePos, wallPos)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), -wallRot.y);

        // Calculate closest point on the wall (box) to the sphere
        const closestX = Math.max(-wallWidth / 2, Math.min(wallWidth / 2, localSpherePos.x));
        const closestY = Math.max(-wallHeight / 2, Math.min(wallHeight / 2, localSpherePos.y));
        const closestZ = Math.max(-wallDepth / 2, Math.min(wallDepth / 2, localSpherePos.z));

        const closestPoint = new THREE.Vector3(closestX, closestY, closestZ);

        // Distance from sphere to closest point
        const distance = localSpherePos.distanceTo(closestPoint);

        // Add a small safety margin to collision radius
        const collisionRadius = this.radius + 0.05;

        // Check if there's a collision
        if (distance < collisionRadius) {
            // Calculate collision normal in local space
            let normal = new THREE.Vector3();

            // If distance is very small, ball is deep inside wall
            if (distance < 0.01) {
                // Ball is inside wall, push it out based on which face is closest
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
                // Normal collision - calculate proper normal
                normal.subVectors(localSpherePos, closestPoint).normalize();
            }

            // Transform normal back to world space
            const worldNormal = normal.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), wallRot.y);

            // Calculate penetration depth with safety margin
            const penetration = collisionRadius - distance;

            // Push sphere out of wall with extra safety margin
            const pushDistance = penetration + 0.1;
            const correctedPos = spherePos.clone().add(
                worldNormal.clone().multiplyScalar(pushDistance)
            );

            // Reflect velocity
            const velocityDotNormal = this.velocity.dot(worldNormal);

            // Only reflect if moving towards the wall
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
                // Moving away from wall, just correct position and reduce velocity
                return {
                    hasCollision: true,
                    position: correctedPos,
                    velocity: this.velocity.clone().multiplyScalar(0.8)
                };
            }
        }

        return { hasCollision: false };
    }

    checkHoles() {
        if (this.isFalling || this.currentLayer >= this.labyrinth.getLayerCount() - 1) {
            return;
        }

        const holes = this.labyrinth.getHoles(this.currentLayer);

        holes.forEach(holePos => {
            const distance = Math.sqrt(
                Math.pow(this.position.x - holePos.x, 2) +
                Math.pow(this.position.z - holePos.z, 2)
            );

            // If ball center is over hole (with some tolerance)
            if (distance < 1.0) { // Tighter tolerance
                this.startFalling();
            }
        });
    }

    startFalling() {
        if (this.isFalling) return;

        this.isFalling = true;
        this.fallingStartY = this.mesh.position.y;
        this.fallingTargetY = this.fallingStartY - this.labyrinth.layerSpacing;
        this.fallingProgress = 0;
        this.currentLayer++;

        console.log(`Ball falling to layer ${this.currentLayer + 1}`);
    }

    updateFalling() {
        this.fallingProgress += 0.05;

        if (this.fallingProgress >= 1) {
            // Landing
            this.isFalling = false;
            this.fallingProgress = 0;

            // Reduce velocity on landing
            this.velocity.multiplyScalar(0.4);

            // Update Y position
            this.position.y = this.radius + (this.currentLayer * -this.labyrinth.layerSpacing);
            this.mesh.position.y = this.getWorldPosition().y;

            console.log(`Ball landed on layer ${this.currentLayer + 1}`);
        } else {
            // Smooth falling animation with easing
            const eased = 1 - Math.pow(1 - this.fallingProgress, 2);
            this.mesh.position.y = this.fallingStartY + (this.fallingTargetY - this.fallingStartY) * eased;

            // Add rotation during fall
            this.mesh.rotation.x += 0.1;
            this.mesh.rotation.y += 0.08;
        }
    }

    getWorldPosition() {
        // Convert local position to world position accounting for layer
        const layerY = -this.currentLayer * this.labyrinth.layerSpacing;
        return new THREE.Vector3(
            this.position.x,
            layerY + this.radius,
            this.position.z
        );
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    getCurrentLayer() {
        return this.currentLayer + 1; // Return 1-indexed for display
    }

    reset(startPosition) {
        this.position = startPosition.clone();
        this.velocity.set(0, 0, 0);
        this.currentLayer = 0;
        this.isFalling = false;
        this.mesh.position.copy(this.getWorldPosition());
        this.mesh.rotation.set(0, 0, 0);

        console.log('Ball reset to start position');
    }
}
