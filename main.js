// Main application setup
let scene, camera, renderer, labyrinth, sphere;
let animationId;
let mouseDown = false;
let previousMousePosition = { x: 0, y: 0 };

// Maze tilt angles (in radians)
let tiltX = 0; // Rotation around X axis (forward/backward tilt)
let tiltZ = 0; // Rotation around Z axis (left/right tilt)
const maxTilt = Math.PI / 6; // Maximum 30 degrees tilt

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 100, 300);

    // Create camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 80, 80);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);

    // Add lights
    setupLights();

    // Create multi-layer labyrinth
    labyrinth = new Labyrinth(scene);

    // Create sphere at entrance of first layer
    sphere = new Sphere(scene, labyrinth.getStartPosition(), labyrinth);

    // Setup mouse controls for tilting
    setupTiltControls();

    // Setup reset button
    document.getElementById('reset-btn').addEventListener('click', resetGame);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
}

function setupLights() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Main directional light from top
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(30, 80, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    scene.add(directionalLight);

    // Fill light from the side
    const fillLight = new THREE.DirectionalLight(0x6677ee, 0.4);
    fillLight.position.set(-40, 30, -30);
    scene.add(fillLight);

    // Point light following the ball
    const pointLight = new THREE.PointLight(0xffffff, 0.6, 50);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    // Store reference for ball tracking
    window.ballLight = pointLight;
}

function setupTiltControls() {
    renderer.domElement.addEventListener('mousedown', (e) => {
        mouseDown = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (mouseDown) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            // Update tilt angles based on mouse movement
            // X movement tilts around Z axis (left/right)
            // Y movement tilts around X axis (forward/backward)
            tiltZ -= deltaX * 0.003;
            tiltX += deltaY * 0.003;

            // Clamp tilt angles
            tiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX));
            tiltZ = Math.max(-maxTilt, Math.min(maxTilt, tiltZ));

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        mouseDown = false;
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        mouseDown = false;
    });

    // Touch support for mobile
    renderer.domElement.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            mouseDown = true;
            previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    });

    renderer.domElement.addEventListener('touchmove', (e) => {
        if (mouseDown && e.touches.length > 0) {
            const deltaX = e.touches[0].clientX - previousMousePosition.x;
            const deltaY = e.touches[0].clientY - previousMousePosition.y;

            tiltZ -= deltaX * 0.003;
            tiltX += deltaY * 0.003;

            tiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX));
            tiltZ = Math.max(-maxTilt, Math.min(maxTilt, tiltZ));

            previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    });

    renderer.domElement.addEventListener('touchend', () => {
        mouseDown = false;
    });
}

function resetGame() {
    // Reset tilt angles
    tiltX = 0;
    tiltZ = 0;

    // Reset sphere position
    sphere.reset(labyrinth.getStartPosition());

    // Reset labyrinth rotation
    labyrinth.resetRotation();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    animationId = requestAnimationFrame(animate);

    // Apply tilt to the entire labyrinth
    if (labyrinth) {
        labyrinth.setTilt(tiltX, tiltZ);
    }

    // Update sphere physics
    if (sphere && labyrinth) {
        sphere.update(tiltX, tiltZ);

        // Update ball light position
        if (window.ballLight) {
            const ballPos = sphere.getPosition();
            window.ballLight.position.set(ballPos.x, ballPos.y + 10, ballPos.z);
        }

        // Update UI
        updateUI();
    }

    renderer.render(scene, camera);
}

function updateUI() {
    const currentLayer = sphere.getCurrentLayer();
    document.getElementById('level-counter').textContent =
        `Current Layer: ${currentLayer} / ${labyrinth.getLayerCount()}`;
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', init);
