// InteractionHandler - Manages the 4-step tilt interaction sequence
class InteractionHandler {
    constructor(labyrinth, sphere, camera, scene) {
        this.labyrinth = labyrinth;
        this.sphere = sphere;
        this.camera = camera;
        this.scene = scene;

        this.currentTilt = 0;
        this.maxTilts = 4;
        this.isAnimating = false;
        this.pathWaypoints = labyrinth.getPathWaypoints();

        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        const tiltButton = document.getElementById('tilt-btn');

        tiltButton.addEventListener('click', () => {
            if (!this.isAnimating && this.currentTilt < this.maxTilts) {
                this.performTilt();
            }
        });

        // Optional: Also allow spacebar to tilt
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isAnimating && this.currentTilt < this.maxTilts) {
                e.preventDefault();
                this.performTilt();
            }
        });
    }

    async performTilt() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.currentTilt++;

        // Disable button during animation
        const tiltButton = document.getElementById('tilt-btn');
        tiltButton.disabled = true;

        this.updateUI();

        // Get the path for this tilt step
        const stepIndex = this.currentTilt - 1;
        const waypoints = this.pathWaypoints[stepIndex];

        // Speed increases with each tilt: 1.0, 1.3, 1.6, 2.0
        const speed = 1.0 + (stepIndex * 0.3);

        if (this.currentTilt < 4) {
            // Regular tilt: just move the sphere
            await this.sphere.moveAlongPath(waypoints, speed);
        } else {
            // 4th tilt: Special effects sequence
            await this.performFourthTiltSequence(waypoints, speed);
        }

        this.isAnimating = false;

        // Re-enable button if not at max tilts
        if (this.currentTilt < this.maxTilts) {
            tiltButton.disabled = false;
        }

        this.updateUI();
    }

    async performFourthTiltSequence(waypoints, speed) {
        // 4th tilt special effects:
        // 1. Move sphere along final path
        // 2. Drop maze 8% down with 0.2s delay
        // 3. Launch sphere up 12%
        // 4. Orbit 2 loops around maze at 12% radius
        // 5. Settle back to center disk

        console.log('🎯 Executing 4th tilt special sequence...');

        // Step 1: Move along final path to center (slightly)
        await this.sphere.moveAlongPath(waypoints, speed);

        // Step 2: Drop the maze (8% down, 0.2s delay)
        console.log('📉 Dropping maze...');
        await this.labyrinth.dropMaze(800, 200);

        // Step 3: Launch sphere upward (12%)
        console.log('🚀 Launching sphere...');
        await this.sphere.launchUp(12);

        // Step 4: Orbit 2 loops around maze exterior (12% radius)
        console.log('🌀 Orbiting maze...');
        await this.sphere.orbitMaze(2, 12);

        // Step 5: Settle sphere back to center disk
        console.log('🎯 Settling to center...');
        const centerPos = this.labyrinth.getCenterPosition();
        await this.sphere.settleToCenter(centerPos);

        console.log('✅ 4th tilt sequence complete!');

        // Add completion message
        this.showCompletionMessage();
    }

    showCompletionMessage() {
        const instructions = document.getElementById('instructions');
        const completionMsg = document.createElement('div');
        completionMsg.id = 'completion-message';
        completionMsg.style.cssText = `
            margin-top: 15px;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
            animation: pulse 2s infinite;
        `;
        completionMsg.innerHTML = '🎉 Sphere reached the center!<br>✨ Mission Complete ✨';

        // Add CSS animation
        if (!document.getElementById('completion-animation-style')) {
            const style = document.createElement('style');
            style.id = 'completion-animation-style';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
            `;
            document.head.appendChild(style);
        }

        instructions.appendChild(completionMsg);
    }

    updateUI() {
        const counter = document.getElementById('tilt-counter');
        const tiltButton = document.getElementById('tilt-btn');

        counter.textContent = `Tilts: ${this.currentTilt} / ${this.maxTilts}`;

        if (this.currentTilt >= this.maxTilts) {
            tiltButton.textContent = 'COMPLETE';
            tiltButton.disabled = true;
            tiltButton.style.background = 'linear-gradient(135deg, #22cc88 0%, #11aa66 100%)';
        } else {
            const remainingTilts = this.maxTilts - this.currentTilt;
            tiltButton.textContent = `TILT (${remainingTilts} remaining)`;
        }
    }

    update() {
        // Animation updates handled in sphere and labyrinth classes
    }
}
