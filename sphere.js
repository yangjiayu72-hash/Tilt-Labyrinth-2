// Sphere class - Manages the reflective metal sphere
class Sphere {
    constructor(scene, startPosition) {
        this.scene = scene;
        this.radius = 0.9; // 18mm = 1.8cm, scaled to 0.9 units radius
        this.position = startPosition.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isMoving = false;
        this.isOrbiting = false;

        // Movement animation properties
        this.currentPath = [];
        this.pathIndex = 0;
        this.pathProgress = 0;
        this.movementSpeed = 0.02;

        // Orbit animation properties
        this.orbitAngle = 0;
        this.orbitRadius = 12; // 12% of maze size
        this.orbitLoops = 0;
        this.orbitTarget = 2; // 2 complete loops
        this.orbitHeight = 0;
        this.orbitCenterY = 0;

        this.createSphere();
    }

    createSphere() {
        // Create highly reflective metal sphere
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            metalness: 0.95,
            roughness: 0.05,
            envMapIntensity: 1.5
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Add subtle glow effect
        const glowGeometry = new THREE.SphereGeometry(this.radius * 1.1, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glow);

        this.scene.add(this.mesh);
    }

    // Move sphere along a path with increasing speed
    moveAlongPath(waypoints, speed = 1.0) {
        return new Promise((resolve) => {
            this.currentPath = waypoints;
            this.pathIndex = 0;
            this.pathProgress = 0;
            this.movementSpeed = 0.015 * speed; // Speed increases with each tilt
            this.isMoving = true;

            const checkComplete = () => {
                if (!this.isMoving) {
                    resolve();
                }
            };

            this.moveCheckInterval = setInterval(checkComplete, 100);
        });
    }

    updateMovement() {
        if (!this.isMoving || this.currentPath.length === 0) return;

        if (this.pathIndex >= this.currentPath.length - 1) {
            this.isMoving = false;
            if (this.moveCheckInterval) {
                clearInterval(this.moveCheckInterval);
            }
            return;
        }

        const start = this.currentPath[this.pathIndex];
        const end = this.currentPath[this.pathIndex + 1];

        this.pathProgress += this.movementSpeed;

        if (this.pathProgress >= 1.0) {
            this.pathProgress = 0;
            this.pathIndex++;

            if (this.pathIndex >= this.currentPath.length - 1) {
                this.mesh.position.copy(this.currentPath[this.currentPath.length - 1]);
                this.isMoving = false;
                if (this.moveCheckInterval) {
                    clearInterval(this.moveCheckInterval);
                }
                return;
            }
        } else {
            // Smooth interpolation with slight easing
            const eased = this.easeInOutCubic(this.pathProgress);
            this.mesh.position.lerpVectors(start, end, eased);

            // Add slight rotation as it rolls
            this.mesh.rotation.x += 0.1;
            this.mesh.rotation.z += 0.05;
        }
    }

    // Launch sphere upward (12%)
    async launchUp(heightPercent = 12) {
        return new Promise((resolve) => {
            const startY = this.mesh.position.y;
            const targetY = startY + heightPercent;
            const duration = 400;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out for upward motion
                const eased = 1 - Math.pow(1 - progress, 2);
                this.mesh.position.y = startY + (targetY - startY) * eased;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            animate();
        });
    }

    // Orbit around maze exterior (2 loops at 12% radius)
    async orbitMaze(loops = 2, radius = 12) {
        return new Promise((resolve) => {
            this.isOrbiting = true;
            this.orbitAngle = 0;
            this.orbitRadius = radius;
            this.orbitLoops = 0;
            this.orbitTarget = loops;
            this.orbitCenterY = this.mesh.position.y;
            this.orbitHeight = this.mesh.position.y;

            const checkComplete = () => {
                if (!this.isOrbiting) {
                    resolve();
                }
            };

            this.orbitCheckInterval = setInterval(checkComplete, 100);
        });
    }

    updateOrbit() {
        if (!this.isOrbiting) return;

        const orbitSpeed = 0.05; // Radians per frame
        this.orbitAngle += orbitSpeed;

        // Calculate position on circular orbit
        this.mesh.position.x = Math.cos(this.orbitAngle) * this.orbitRadius;
        this.mesh.position.z = Math.sin(this.orbitAngle) * this.orbitRadius;
        this.mesh.position.y = this.orbitHeight;

        // Add slight vertical oscillation
        this.mesh.position.y += Math.sin(this.orbitAngle * 2) * 0.5;

        // Rotation for visual effect
        this.mesh.rotation.y += 0.08;
        this.mesh.rotation.x += 0.05;

        // Check if completed required loops
        if (this.orbitAngle >= Math.PI * 2 * this.orbitTarget) {
            this.isOrbiting = false;
            if (this.orbitCheckInterval) {
                clearInterval(this.orbitCheckInterval);
            }
        }
    }

    // Settle sphere to center disk
    async settleToCenter(centerPosition) {
        return new Promise((resolve) => {
            const start = this.mesh.position.clone();
            const end = centerPosition.clone();
            const duration = 800;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease in-out for smooth landing
                const eased = this.easeInOutCubic(progress);
                this.mesh.position.lerpVectors(start, end, eased);

                // Slow down rotation
                this.mesh.rotation.x *= 0.95;
                this.mesh.rotation.y *= 0.95;
                this.mesh.rotation.z *= 0.95;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.mesh.position.copy(end);
                    this.mesh.rotation.set(0, 0, 0);
                    resolve();
                }
            };

            animate();
        });
    }

    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    update() {
        if (this.isMoving) {
            this.updateMovement();
        }

        if (this.isOrbiting) {
            this.updateOrbit();
        }

        // Update glow pulse
        if (this.glow) {
            this.glow.material.opacity = 0.15 + Math.sin(Date.now() * 0.003) * 0.05;
        }
    }

    getPosition() {
        return this.mesh.position.clone();
    }
}
