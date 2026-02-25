/* 
 * Cherenkov Liminal Background Elements
 * Implements: Floating Cityscape, Whales, Doves, Hands
 * Style: Nintendo Zone / Frutiger Aero / Wireframe
 */

import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

console.log("✦ Initializing Background Elements...");

// --- Configuration ---
const SCENE_CONFIG = {
    cityscapeColor: 0x88ccff, // Light blue
    whaleColor: 0xffffff,     // White
    doveColor: 0xffffff,
    handColor: 0xcccccc
};

class BackgroundWorld {
    constructor(containerId) {
        this.container = document.createElement('div');
        this.container.id = 'three-background';
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '-1'; // Behind everything
        this.container.style.pointerEvents = 'none';
        this.container.style.opacity = '0.6'; // Subtle
        document.body.prepend(this.container);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        // Fog for depth
        this.scene.fog = new THREE.FogExp2(0xf5f5f5, 0.015);

        this.elements = [];
        this.initElements();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    initElements() {
        // 1. Cityscape (Nintendo Zone Icon Style - Simple Cubes)
        this.createCityscape();

        // 2. Whales (Abstract Wireframe Shapes)
        this.createWhales();

        // 3. Doves (Paper-like Triangles)
        this.createDoves();

        // 4. Hands (Abstract geometry for now - placeholders)
        // this.createHands(); // Deferred for complexity

        // 5. Rain (Points)
        this.createRain();
    }

    createCityscape() {
        // A cluster of buildings floating in the distance
        const cityGroup = new THREE.Group();
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: SCENE_CONFIG.cityscapeColor,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });

        // Generate random buildings
        for (let i = 0; i < 20; i++) {
            const building = new THREE.Mesh(geometry, material);
            building.position.x = (Math.random() - 0.5) * 40;
            building.position.y = (Math.random() - 0.5) * 20 - 10; // Lower half
            building.position.z = (Math.random() - 0.5) * 20 - 20; // Further back

            building.scale.x = 2 + Math.random() * 3;
            building.scale.y = 5 + Math.random() * 10; // Tall
            building.scale.z = 2 + Math.random() * 3;

            cityGroup.add(building);
        }

        cityGroup.rotation.y = 0.2;
        this.scene.add(cityGroup);
        this.elements.push({ mesh: cityGroup, type: 'city', speed: 0.001 });
    }

    createWhales() {
        // Abstract floating shapes
        const whaleGroup = new THREE.Group();
        // Simple capsule for body
        const geometry = new THREE.CapsuleGeometry(2, 6, 4, 8);
        const material = new THREE.MeshStandardMaterial({
            color: SCENE_CONFIG.whaleColor,
            roughness: 0.2,
            metalness: 0.1,
            transparent: true,
            opacity: 0.4
        });

        for (let i = 0; i < 3; i++) {
            const whale = new THREE.Mesh(geometry, material);
            whale.position.set(
                (Math.random() - 0.5) * 60,
                15 + Math.random() * 10,
                (Math.random() - 0.5) * 30
            );
            whale.rotation.z = Math.PI / 2; // Horizontal
            whale.scale.set(1.5, 1.5, 1.5);

            whaleGroup.add(whale);
            // Store individual whale for animation
            this.elements.push({
                mesh: whale,
                type: 'whale',
                speed: 0.02 + Math.random() * 0.01,
                offset: Math.random() * 100
            });
        }
        this.scene.add(whaleGroup);
    }

    createDoves() {
        // Simple triangles for birds
        const doveGeometry = new THREE.ConeGeometry(0.5, 1.5, 3);
        const material = new THREE.MeshBasicMaterial({ color: SCENE_CONFIG.doveColor });

        for (let i = 0; i < 15; i++) {
            const dove = new THREE.Mesh(doveGeometry, material);
            dove.position.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20
            );
            dove.rotation.x = Math.PI / 2;

            this.scene.add(dove);
            this.elements.push({
                mesh: dove,
                type: 'dove',
                speed: 0.05 + Math.random() * 0.05,
                direction: new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.2, Math.random() - 0.5).normalize()
            });
        }
    }

    createRain() {
        const rainCount = 2000;
        const rainGeometry = new THREE.BufferGeometry();
        const rainPositions = new Float32Array(rainCount * 3);
        const rainVelocities = [];

        for (let i = 0; i < rainCount; i++) {
            rainPositions[i * 3] = (Math.random() - 0.5) * 200; // x
            rainPositions[i * 3 + 1] = Math.random() * 200 - 100; // y
            rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 100; // z
            rainVelocities.push(0);
        }

        rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
        const rainMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.15,
            transparent: true,
            opacity: 0.5
        });

        this.rainMesh = new THREE.Points(rainGeometry, rainMaterial);
        this.scene.add(this.rainMesh);
        this.rainVelocities = rainVelocities;
        this.elements.push({ type: 'rain' });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = Date.now();
        const dt = (now - (this.lastTime || now)) / 1000;
        this.lastTime = now;

        // Catch up on missed physics frames if tab was frozen/throttled
        // Cap at 120 frames (~2 seconds) to avoid freezing the tab completely
        const steps = Math.max(1, Math.min(Math.floor(dt * 60) || 1, 120));

        for (let s = 0; s < steps; s++) {
            const time = (now - (steps - 1 - s) * 16.666) * 0.001;

            this.elements.forEach(el => {
                if (el.type === 'city') {
                    el.mesh.rotation.y += el.speed;
                } else if (el.type === 'whale') {
                    // Gentle floating sine wave
                    el.mesh.position.y += Math.sin(time + el.offset) * 0.02;
                    el.mesh.position.x -= el.speed; // Move left
                    if (el.mesh.position.x < -40) el.mesh.position.x = 40; // Loop
                } else if (el.type === 'dove') {
                    // Fly straight-ish
                    el.mesh.position.add(el.direction.clone().multiplyScalar(0.1));
                    el.mesh.rotation.z += 0.05; // Spin/flap visual

                    // Wrap around
                    if (el.mesh.position.x > 50) el.mesh.position.x = -50;
                    if (el.mesh.position.x < -50) el.mesh.position.x = 50;
                    if (el.mesh.position.y > 30) el.mesh.position.y = -30;
                    if (el.mesh.position.y < -30) el.mesh.position.y = 30;
                } else if (el.type === 'rain') {
                    const positions = this.rainMesh.geometry.attributes.position.array;
                    for (let i = 0; i < positions.length / 3; i++) {
                        this.rainVelocities[i] -= 0.1 + Math.random() * 0.1;
                        positions[i * 3 + 1] += this.rainVelocities[i]; // falling down
                        positions[i * 3] -= 0.2; // wind left

                        if (positions[i * 3 + 1] < -60) {
                            positions[i * 3 + 1] = 60 + Math.random() * 40;
                            positions[i * 3] = (Math.random() - 0.5) * 200;
                            this.rainVelocities[i] = 0;
                        }
                    }
                    this.rainMesh.geometry.attributes.position.needsUpdate = true;
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize when imported
new BackgroundWorld();
