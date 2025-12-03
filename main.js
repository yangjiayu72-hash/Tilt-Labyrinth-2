// Main application setup
let scene, camera, renderer, labyrinth, sphere, interactionHandler;
let animationId;

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 50, 200);

    // Create camera with 25° top-tilt angle
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);

    // Position camera for 25° top-tilt view
    const distance = 80;
    const angle = 25 * Math.PI / 180; // 25 degrees in radians
    camera.position.set(0, distance * Math.sin(angle), distance * Math.cos(angle));
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

    // Create labyrinth
    labyrinth = new Labyrinth(scene);

    // Create sphere at entrance
    sphere = new Sphere(scene, labyrinth.getEntrancePosition());

    // Setup interaction handler
    interactionHandler = new InteractionHandler(labyrinth, sphere, camera, scene);

    // Add orbit controls (locked at 25° tilt)
    setupOrbitControls();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
}

function setupLights() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Main directional light from top
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 50, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    // Fill light from the side
    const fillLight = new THREE.DirectionalLight(0x6677ee, 0.3);
    fillLight.position.set(-30, 20, -20);
    scene.add(fillLight);

    // Rim light for depth
    const rimLight = new THREE.DirectionalLight(0xaa88ff, 0.2);
    rimLight.position.set(0, -20, -40);
    scene.add(rimLight);

    // Point light for sphere highlight
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(0, 30, 0);
    scene.add(pointLight);
}

function setupOrbitControls() {
    // Note: OrbitControls requires separate import, but we'll use a simple manual control
    // that maintains the 25° tilt angle

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraAngle = 0;
    const cameraDistance = 80;
    const cameraTilt = 25 * Math.PI / 180; // Locked at 25°

    renderer.domElement.addEventListener('mousedown', (e) => {
        if (e.target === renderer.domElement) {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            cameraAngle += deltaX * 0.005;

            // Update camera position maintaining 25° tilt
            camera.position.x = cameraDistance * Math.sin(cameraAngle) * Math.cos(cameraTilt);
            camera.position.y = cameraDistance * Math.sin(cameraTilt);
            camera.position.z = cameraDistance * Math.cos(cameraAngle) * Math.cos(cameraTilt);
            camera.lookAt(0, 0, 0);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        isDragging = false;
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    animationId = requestAnimationFrame(animate);

    // Update sphere animation
    if (sphere) {
        sphere.update();
    }

    // Update labyrinth animation
    if (labyrinth) {
        labyrinth.update();
    }

    // Update interaction handler
    if (interactionHandler) {
        interactionHandler.update();
    }

    renderer.render(scene, camera);
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', init);
