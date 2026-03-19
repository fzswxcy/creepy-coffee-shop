// 微恐咖啡厅 - 午夜咖啡厅场景游戏
// 主架构师: NIKO
// 创建时间: 2026年3月4日

// ==================== 全局变量 ====================
let scene, camera, renderer, clock;
let mixer = null;
let animationId = null;
let lastFrameTime = 0;
let fps = 60;
let sanity = 100;
let gold = 1250;
let currentHour = 2;
let currentMinute = 47;
let isScaryEventActive = false;
let scaryEventTimer = null;

// ==================== 3D场景对象 ====================
let coffeeShop = null;
let coffeeMachine = null;
let character = null;
let ghostlyFigures = [];

// ==================== 初始化函数 ====================
function init() {
    console.log("微恐咖啡厅 - Three.js场景初始化");
    
    // 创建场景
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a14, 10, 50);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);
    
    // 创建渲染器
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 初始化时钟
    clock = new THREE.Clock();
    
    // 设置光源
    setupLights();
    
    // 创建咖啡厅场景
    createCoffeeShop();
    
    // 创建咖啡机和角色
    createCoffeeMachine();
    createCharacter();
    
    // 创建幽灵特效
    createGhostlyFigures();
    
    // 添加事件监听器
    setupEventListeners();
    
    // 开始动画循环
    animate();
    
    // 开始恐怖事件定时器
    startScaryEventTimer();
    
    // 开始理智值下降机制
    startSanityDecrease();
    
    console.log("场景初始化完成，恐怖咖啡厅已准备就绪");
}

// ==================== 光源设置 ====================
function setupLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x202030, 0.3);
    scene.add(ambientLight);
    
    // 主灯光（午夜昏暗灯光）
    const mainLight = new THREE.PointLight(0xff6600, 0.8, 30);
    mainLight.position.set(0, 8, 0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);
    
    // 闪烁灯光效果
    setInterval(() => {
        mainLight.intensity = 0.7 + Math.random() * 0.3;
    }, 300);
    
    // 蓝色恐怖氛围灯
    const scaryLight = new THREE.PointLight(0x0066ff, 0.5, 25);
    scaryLight.position.set(-10, 5, -10);
    scene.add(scaryLight);
    
    // 红色警示灯
    const warningLight = new THREE.PointLight(0xff0000, 0.3, 15);
    warningLight.position.set(10, 3, -10);
    warningLight.intensity = 0;
    scene.add(warningLight);
}

// ==================== 创建咖啡厅场景 ====================
function createCoffeeShop() {
    coffeeShop = new THREE.Group();
    
    // 地板
    const floorGeometry = new THREE.PlaneGeometry(40, 30);
    const floorTexture = createWoodTexture();
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: floorTexture,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    coffeeShop.add(floor);
    
    // 墙壁
    const wallGeometry = new THREE.BoxGeometry(40, 10, 0.5);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a3a,
        roughness: 0.9
    });
    
    // 后墙
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 5, -15);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    coffeeShop.add(backWall);
    
    // 左墙
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-20, 5, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    coffeeShop.add(leftWall);
    
    // 右墙
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(20, 5, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    coffeeShop.add(rightWall);
    
    // 吧台
    const counterGeometry = new THREE.BoxGeometry(15, 2, 4);
    const counterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4a2c2a,
        roughness: 0.7,
        metalness: 0.3
    });
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(0, 1, -8);
    counter.castShadow = true;
    counter.receiveShadow = true;
    coffeeShop.add(counter);
    
    // 桌子
    for (let i = 0; i < 4; i++) {
        const tableGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
        const tableMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a2a2a,
            roughness: 0.8
        });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(
            -8 + i * 5,
            0.5,
            -3 + Math.sin(i) * 2
        );
        table.castShadow = true;
        table.receiveShadow = true;
        coffeeShop.add(table);
        
        // 椅子
        const chairGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
        const chairMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.9
        });
        const chair = new THREE.Mesh(chairGeometry, chairMaterial);
        chair.position.set(
            -8 + i * 5,
            0.75,
            -1.5 + Math.sin(i) * 2
        );
        chair.castShadow = true;
        coffeeShop.add(chair);
    }
    
    scene.add(coffeeShop);
    
    console.log("咖啡厅场景创建完成");
}

// ==================== 创建咖啡机 ====================
function createCoffeeMachine() {
    coffeeMachine = new THREE.Group();
    
    // 咖啡机主体
    const bodyGeometry = new THREE.BoxGeometry(3, 4, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a3a3a,
        metalness: 0.8,
        roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 2, -7);
    body.castShadow = true;
    body.receiveShadow = true;
    coffeeMachine.add(body);
    
    // 咖啡出口
    const spoutGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const spoutMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        metalness: 0.9
    });
    const spout = new THREE.Mesh(spoutGeometry, spoutMaterial);
    spout.position.set(0.5, 3, -7);
    spout.rotation.z = Math.PI / 2;
    coffeeMachine.add(spout);
    
    // 咖啡杯
    const cupGeometry = new THREE.CylinderGeometry(0.8, 0.6, 1.2, 16);
    const cupMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.5
    });
    const cup = new THREE.Mesh(cupGeometry, cupMaterial);
    cup.position.set(1.5, 1.5, -7);
    cup.castShadow = true;
    coffeeMachine.add(cup);
    
    scene.add(coffeeMachine);
    
    console.log("咖啡机创建完成");
}

// ==================== 创建角色 ====================
function createCharacter() {
    character = new THREE.Group();
    
    // 角色身体
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a5a8a,
        roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 1, 0);
    body.castShadow = true;
    character.add(body);
    
    // 角色头部
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffccaa,
        roughness: 0.9
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 2.5, 0);
    head.castShadow = true;
    character.add(head);
    
    character.position.set(0, 0, -5);
    scene.add(character);
    
    console.log("角色创建完成");
}

// ==================== 创建幽灵特效 ====================
function createGhostlyFigures() {
    for (let i = 0; i < 3; i++) {
        const ghostGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const ghostMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3
        });
        const ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
        
        // 随机位置
        ghost.position.set(
            -15 + Math.random() * 30,
            3 + Math.random() * 5,
            -15 + Math.random() * 10
        );
        
        ghostlyFigures.push({
            mesh: ghost,
            speed: 0.2 + Math.random() * 0.3,
            direction: new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize()
        });
        
        scene.add(ghost);
    }
    
    console.log("幽灵特效创建完成");
}

// ==================== 纹理创建工具 ====================
function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // 创建木质纹理
    ctx.fillStyle = '#3a2a2a';
    ctx.fillRect(0, 0, 256, 256);
    
    for (let i = 0; i < 50; i++) {
        ctx.strokeStyle = `rgba(90, 60, 40, ${0.1 + Math.random() * 0.3})`;
        ctx.lineWidth = 1 + Math.random() * 3;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 256, 0);
        ctx.bezierCurveTo(
            Math.random() * 256, Math.random() * 256,
            Math.random() * 256, Math.random() * 256,
            Math.random() * 256, 256
        );
        ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 3);
    
    return texture;
}

// ==================== 动画循环 ====================
function animate() {
    animationId = requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    const currentTime = performance.now();
    
    // 计算FPS
    if (currentTime - lastFrameTime >= 1000) {
        fps = Math.round(1000 / (currentTime - lastFrameTime));
        document.getElementById('fps-counter').textContent = `FPS: ${fps}`;
        lastFrameTime = currentTime;
    }
    
    // 更新幽灵位置
    updateGhostlyFigures(deltaTime);
    
    // 更新灯光闪烁
    updateLightEffects();
    
    // 更新角色呼吸动画
    if (character) {
        character.position.y = -5 + Math.sin(Date.now() * 0.002) * 0.1;
    }
    
    // 更新咖啡杯旋转
    if (coffeeMachine && coffeeMachine.children[2]) {
        coffeeMachine.children[2].rotation.y += deltaTime * 0.5;
    }
    
    // 渲染场景
    renderer.render(scene, camera);
}

// ==================== 幽灵移动逻辑 ====================
function updateGhostlyFigures(deltaTime) {
    ghostlyFigures.forEach((ghost, index) => {
        ghost.mesh.position.x += ghost.direction.x * ghost.speed * deltaTime * 10;
        ghost.mesh.position.y += ghost.direction.y * ghost.speed * deltaTime * 10;
        ghost.mesh.position.z += ghost.direction.z * ghost.speed * deltaTime * 10;
        
        // 边界检查
        if (ghost.mesh.position.x < -18 || ghost.mesh.position.x > 18) {
            ghost.direction.x *= -1;
        }
        if (ghost.mesh.position.y < 2 || ghost.mesh.position.y > 8) {
            ghost.direction.y *= -1;
        }
        if (ghost.mesh.position.z < -18 || ghost.mesh.position.z > 2) {
            ghost.direction.z *= -1;
        }
        
        // 透明度变化
        ghost.mesh.material.opacity = 0.2 + Math.sin(Date.now() * 0.001 + index) * 0.2;
    });
}

// ==================== 灯光特效 ====================
function updateLightEffects() {
    // 每帧更新灯光效果
    const time = Date.now() * 0.001;
    
    // 获取场景中的红色警告灯
    const warningLight = scene.children.find(child => 
        child instanceof THREE.PointLight && child.color.getHex() === 0xff0000
    );
    
    if (warningLight && isScaryEventActive) {
        warningLight.intensity = 0.5 + Math.sin(time * 5) * 0.3;
    }
}

// ==================== 游戏机制函数 ====================
function brewCoffee() {
    if (sanity > 20) {
        gold += 50;
        sanity -= 5;
        
        updateStatusDisplay();
        addLogEntry("制作了一杯咖啡，获得 50 金币");
        
        // 咖啡制作动画
        if (coffeeMachine && coffeeMachine.children[2]) {
            const cup = coffeeMachine.children[2];
            cup.scale.set(1.2, 1.2, 1.2);
            setTimeout(() => {
                cup.scale.set(1, 1, 1);
            }, 300);
        }
        
        // 触发随机事件
        if (Math.random() < 0.3) {
            triggerRandomScaryEvent();
        }
    } else {
        addLogEntry("理智值过低，无法制作咖啡");
    }
}

function cleanCounter() {
    sanity += 10;
    if (sanity > 100) sanity = 100;
    
    updateStatusDisplay();
    addLogEntry("清洁了吧台，理智值恢复 10 点");
}

function toggleLights() {
    const mainLight = scene.children.find(child => 
        child instanceof THREE.PointLight && child.color.getHex() === 0xff6600
    );
    
    if (mainLight) {
        mainLight.intensity = mainLight.intensity > 0.5 ? 0.2 : 0.8;
        addLogEntry(mainLight.intensity > 0.5 ? "灯光调亮" : "灯光调暗");
    }
}

function testScaryEvent() {
    triggerFullScaryEvent();
}

// ==================== 恐怖事件系统 ====================
function triggerRandomScaryEvent() {
    const events = [
        "幽灵在角落闪过",
        "咖啡杯突然移动",
        "灯光剧烈闪烁",
        "听见低语声",
        "温度突然下降"
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    sanity -= Math.floor(Math.random() * 10) + 5;
    
    addLogEntry(`恐怖事件: ${event}`);
    updateStatusDisplay();
    
    // 视觉特效
    triggerScaryVisualEffect();
}

function triggerFullScaryEvent() {
    isScaryEventActive = true;
    
    addLogEntry("警告: 强烈恐怖事件发生！");
    sanity -= 20;
    updateStatusDisplay();
    
    // 视觉特效
    const effectsDiv = document.getElementById('scary-effects');
    effectsDiv.className = 'scary-flash scary-flicker';
    effectsDiv.style.opacity = '0.7';
    
    // 声音效果（模拟）
    playScarySound();
    
    // 30秒后结束
    setTimeout(() => {
        effectsDiv.style.opacity = '0';
        isScaryEventActive = false;
        addLogEntry("恐怖事件结束，恢复正常");
    }, 30000);
}

function triggerScaryVisualEffect() {
    const effectsDiv = document.getElementById('scary-effects');
    effectsDiv.className = 'scary-flash';
    effectsDiv.style.opacity = '0.3';
    
    setTimeout(() => {
        effectsDiv.style.opacity = '0';
    }, 1000);
}

function playScarySound() {
    // 这里可以添加实际的声音播放
    console.log("播放恐怖音效");
}

// ==================== 定时器系统 ====================
function startScaryEventTimer() {
    scaryEventTimer = setInterval(() => {
        if (Math.random() < 0.1 && sanity < 80) {
            triggerRandomScaryEvent();
        }
    }, 30000); // 每30秒检查一次
}

function startSanityDecrease() {
    setInterval(() => {
        if (sanity > 0) {
            sanity -= 0.5;
            if (sanity < 0) sanity = 0;
            updateStatusDisplay();
            
            if (sanity < 30 && Math.random() < 0.05) {
                addLogEntry("理智值过低，出现幻觉...");
                triggerScaryVisualEffect();
            }
        }
    }, 10000); // 每10秒减少0.5理智
}

// ==================== 状态更新 ====================
function updateStatusDisplay() {
    document.getElementById('sanity-value').textContent = Math.floor(sanity);
    document.getElementById('gold-value').textContent = gold.toLocaleString();
    
    // 更新理智值颜色
    const sanityEl = document.getElementById('sanity-value');
    if (sanity > 70) {
        sanityEl.style.color = '#4cd137';
    } else if (sanity > 30) {
        sanityEl.style.color = '#ffa502';
    } else {
        sanityEl.style.color = '#ff4757';
    }
}

function updateTime() {
    currentMinute++;
    if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour = (currentHour + 1) % 24;
    }
    
    const hourStr = currentHour.toString().padStart(2, '0');
    const minuteStr = currentMinute.toString().padStart(2, '0');
    document.getElementById('time-value').textContent = `${hourStr}:${minuteStr}`;
}

setInterval(updateTime, 60000); // 游戏时间每分钟更新一次

function addLogEntry(message) {
    const logDiv = document.getElementById('message-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
    
    // 保持最多10条日志
    while (logDiv.children.length > 10) {
        logDiv.removeChild(logDiv.firstChild);
    }
}

// ==================== 事件监听器 ====================
function setupEventListeners() {
    // 按钮事件
    document.getElementById('btn-brew').addEventListener('click', brewCoffee);
    document.getElementById('btn-clean').addEventListener('click', cleanCounter);
    document.getElementById('btn-lights').addEventListener('click', toggleLights);
    document.getElementById('btn-scary').addEventListener('click', testScaryEvent);
    
    // 窗口大小调整
    window.addEventListener('resize', onWindowResize);
    
    // 键盘控制
    document.addEventListener('keydown', onKeyDown);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    switch(event.key) {
        case ' ':
        case 'Enter':
            brewCoffee();
            break;
        case 'c':
        case 'C':
            cleanCounter();
            break;
        case 'l':
        case 'L':
            toggleLights();
            break;
        case 's':
        case 'S':
            testScaryEvent();
            break;
    }
}

// ==================== 初始化调用 ====================
// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 导出全局函数供HTML调用
window.brewCoffee = brewCoffee;
window.cleanCounter = cleanCounter;
window.toggleLights = toggleLights;
window.testScaryEvent = testScaryEvent;