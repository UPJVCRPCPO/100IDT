import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

const canvas = document.getElementById('game-canvas');
const levelEl = document.getElementById('level');
const livesEl = document.getElementById('lives');
const scoreEl = document.getElementById('score');

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x060915, 24, 52);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 13, 14);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const world = {
    width: 14,
    depth: 20,
    paddleSpeed: 13,
    level: 1,
    lives: 3,
    score: 0,
    maxRooms: 6
};

const keyState = {};
window.addEventListener('keydown', (event) => (keyState[event.key.toLowerCase()] = true));
window.addEventListener('keyup', (event) => (keyState[event.key.toLowerCase()] = false));

const ambient = new THREE.AmbientLight(0x5970c0, 0.32);
scene.add(ambient);

const moon = new THREE.DirectionalLight(0xa9c8ff, 0.4);
moon.position.set(-5, 14, -6);
scene.add(moon);

const trackerLight = new THREE.PointLight(0xff88aa, 2.2, 18, 1.2);
trackerLight.castShadow = true;
trackerLight.shadow.mapSize.width = 1024;
trackerLight.shadow.mapSize.height = 1024;
scene.add(trackerLight);

const table = new THREE.Mesh(
    new THREE.BoxGeometry(world.width, 1, world.depth),
    new THREE.MeshStandardMaterial({ color: 0x0c1230, roughness: 0.85, metalness: 0.15 })
);
table.position.y = -0.5;
table.receiveShadow = true;
scene.add(table);

const boundaryMaterial = new THREE.MeshStandardMaterial({ color: 0x5a6ec9, roughness: 0.45 });
const wallGeoX = new THREE.BoxGeometry(0.4, 1.2, world.depth);
const wallGeoZ = new THREE.BoxGeometry(world.width, 1.2, 0.4);

const leftWall = new THREE.Mesh(wallGeoX, boundaryMaterial);
leftWall.position.set(-world.width / 2, 0.1, 0);
scene.add(leftWall);
const rightWall = leftWall.clone();
rightWall.position.x = world.width / 2;
scene.add(rightWall);
const topWall = new THREE.Mesh(wallGeoZ, boundaryMaterial);
topWall.position.set(0, 0.1, -world.depth / 2);
scene.add(topWall);

const paddle = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.8, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x74ffdb, roughness: 0.55 })
);
paddle.position.set(0, 0.3, world.depth / 2 - 2);
paddle.castShadow = true;
scene.add(paddle);

function createFlipper(color) {
    const flipper = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.5, 0.7),
        new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.25 })
    );
    flipper.castShadow = true;
    flipper.receiveShadow = true;
    return flipper;
}

const leftFlipper = createFlipper(0xffb85f);
leftFlipper.position.set(-2.15, 0.2, world.depth / 2 - 4.3);
scene.add(leftFlipper);

const rightFlipper = createFlipper(0xff7f9d);
rightFlipper.position.set(2.15, 0.2, world.depth / 2 - 4.3);
scene.add(rightFlipper);

const ball = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 0),
    new THREE.MeshStandardMaterial({ color: 0xfef2ba, emissive: 0x573930, emissiveIntensity: 0.35 })
);
ball.castShadow = true;
ball.position.set(0, 0.7, 2);
scene.add(ball);

let velocity = new THREE.Vector3(4.7, 0, -7.1);
const roomBricks = [];

function clearRoom() {
    while (roomBricks.length > 0) {
        scene.remove(roomBricks.pop());
    }
}

function spawnRoom() {
    clearRoom();
    const rows = Math.min(2 + world.level, 6);
    const cols = 5;
    const startZ = -6.2;
    const palette = [0x8fd0ff, 0x8fffbb, 0xf8a7ff, 0xffd68f];

    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            if (Math.random() < 0.1 + world.level * 0.04) {
                continue;
            }

            const brick = new THREE.Mesh(
                new THREE.BoxGeometry(2.1, 0.9, 0.9),
                new THREE.MeshStandardMaterial({
                    color: palette[(row + col) % palette.length],
                    roughness: 0.55,
                    metalness: 0.2
                })
            );

            brick.position.set(-4.4 + col * 2.2, 0.45, startZ - row * 1.2);
            brick.userData.hp = 1 + Math.floor(world.level / 2);
            brick.castShadow = true;
            brick.receiveShadow = true;
            roomBricks.push(brick);
            scene.add(brick);
        }
    }
}

function resetBall() {
    ball.position.set((Math.random() - 0.5) * 4, 0.7, 1.5);
    const dirX = (Math.random() * 2 - 1) * (4 + world.level * 0.3);
    const dirZ = -(6 + world.level * 0.35);
    velocity.set(dirX, 0, dirZ);
}

function updateHUD() {
    levelEl.textContent = String(world.level);
    livesEl.textContent = String(world.lives);
    scoreEl.textContent = String(world.score);
}

function bounceFromFlipper(flipper, left) {
    const dx = ball.position.x - flipper.position.x;
    const dz = Math.abs(ball.position.z - flipper.position.z);
    if (Math.abs(dx) < 1.35 && dz < 0.65) {
        const force = keyState[left ? 'q' : 'e'] ? 1.45 : 1;
        velocity.z = -Math.abs(velocity.z) * 1.02;
        velocity.x += dx * 2.1 * force;
        velocity.multiplyScalar(1.01);
    }
}

function roomCleared() {
    return roomBricks.every((brick) => brick.userData.hp <= 0);
}

function checkBrickCollision() {
    for (const brick of roomBricks) {
        if (brick.userData.hp <= 0) {
            continue;
        }

        const dx = Math.abs(ball.position.x - brick.position.x);
        const dz = Math.abs(ball.position.z - brick.position.z);
        if (dx < 1.25 && dz < 0.65) {
            brick.userData.hp -= 1;
            velocity.z *= -1;
            world.score += 10;

            if (brick.userData.hp <= 0) {
                brick.visible = false;
            }
            return;
        }
    }
}

function nextRoom() {
    world.level += 1;
    world.score += 60;
    if (world.level > world.maxRooms) {
        alert(`Victoire ! Score final: ${world.score}`);
        world.level = 1;
        world.lives = 3;
        world.score = 0;
    }
    spawnRoom();
    resetBall();
    updateHUD();
}

function updateFlippers(dt) {
    const leftUp = keyState.q;
    const rightUp = keyState.e;

    const leftTarget = leftUp ? Math.PI / 7 : -Math.PI / 14;
    const rightTarget = rightUp ? -Math.PI / 7 : Math.PI / 14;

    leftFlipper.rotation.y += (leftTarget - leftFlipper.rotation.y) * Math.min(1, dt * 20);
    rightFlipper.rotation.y += (rightTarget - rightFlipper.rotation.y) * Math.min(1, dt * 20);
}

function updatePaddle(dt) {
    const moveLeft = keyState.a || keyState.arrowleft;
    const moveRight = keyState.d || keyState.arrowright;

    if (moveLeft) {
        paddle.position.x -= world.paddleSpeed * dt;
    }
    if (moveRight) {
        paddle.position.x += world.paddleSpeed * dt;
    }

    paddle.position.x = THREE.MathUtils.clamp(paddle.position.x, -world.width / 2 + 1.8, world.width / 2 - 1.8);
}

function physicsStep(dt) {
    ball.position.addScaledVector(velocity, dt);

    if (ball.position.x < -world.width / 2 + 0.45 || ball.position.x > world.width / 2 - 0.45) {
        velocity.x *= -1;
        ball.position.x = THREE.MathUtils.clamp(ball.position.x, -world.width / 2 + 0.45, world.width / 2 - 0.45);
    }

    if (ball.position.z < -world.depth / 2 + 0.5) {
        velocity.z *= -1;
    }

    if (
        Math.abs(ball.position.x - paddle.position.x) < 1.9 &&
        Math.abs(ball.position.z - paddle.position.z) < 0.8 &&
        velocity.z > 0
    ) {
        velocity.z = -Math.abs(velocity.z) * 1.02;
        velocity.x += (ball.position.x - paddle.position.x) * 1.4;
    }

    bounceFromFlipper(leftFlipper, true);
    bounceFromFlipper(rightFlipper, false);

    checkBrickCollision();

    if (ball.position.z > world.depth / 2 + 1) {
        world.lives -= 1;
        if (world.lives <= 0) {
            alert(`Game Over ! Score: ${world.score}`);
            world.level = 1;
            world.lives = 3;
            world.score = 0;
            spawnRoom();
        }
        resetBall();
        updateHUD();
    }

    if (roomCleared()) {
        nextRoom();
    }

    const speedLimit = 17 + world.level;
    velocity.x = THREE.MathUtils.clamp(velocity.x, -speedLimit, speedLimit);
    velocity.z = THREE.MathUtils.clamp(velocity.z, -speedLimit, speedLimit);
}

function updateDynamicCam(dt) {
    const targetPos = new THREE.Vector3(
        ball.position.x * 0.3,
        12 + Math.abs(ball.position.z) * 0.15,
        13 + ball.position.z * 0.18
    );
    camera.position.lerp(targetPos, Math.min(1, dt * 2.2));
    camera.lookAt(ball.position.x * 0.35, 0.3, -3.5);

    trackerLight.position.set(ball.position.x, 4.6, ball.position.z + 1.2);
}

const clock = new THREE.Clock();

function animate() {
    const dt = Math.min(clock.getDelta(), 0.033);
    updatePaddle(dt);
    updateFlippers(dt);
    physicsStep(dt);
    updateDynamicCam(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

spawnRoom();
resetBall();
updateHUD();
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
