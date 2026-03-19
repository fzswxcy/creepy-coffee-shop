/**
 * 《微恐咖啡厅》- 集成版3D场景控制器
 * 集成材质工厂和配置系统
 * 微信小游戏优化版
 * 创建时间: 2026-03-05 10:40 GMT+8
 */

// 导入材质系统（假设在同一个工作目录）
// 在实际微信小游戏中，这些需要作为模块导入

/**
 * 3D向量类
 */
class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    static zero() {
        return new Vec3(0, 0, 0);
    }
    
    clone() {
        return new Vec3(this.x, this.y, this.z);
    }
}

/**
 * 颜色类
 */
class Color {
    constructor(r, g, b, a = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    
    static lerp(a, b, t) {
        return new Color(
            a.r + (b.r - a.r) * t,
            a.g + (b.g - a.g) * t,
            a.b + (b.b - a.b) * t,
            a.a + (b.a - a.a) * t
        );
    }
}

/**
 * 3D节点类
 */
class Node3D {
    constructor(name, geometry = 'cube', materialType = 'default') {
        this.name = name;
        this.position = Vec3.zero();
        this.scale = new Vec3(1, 1, 1);
        this.rotation = Vec3.zero();
        this.children = [];
        this.parent = null;
        this.geometry = geometry;
        this.materialType = materialType;
        this.materialConfig = null; // 材质配置
        this.visible = true;
        this.interactive = false;
        this.sanityEffect = 0; // 理智值影响度
    }
    
    addChild(node) {
        node.parent = this;
        this.children.push(node);
    }
    
    getWorldPosition() {
        let pos = this.position.clone();
        let node = this.parent;
        while (node) {
            pos.x += node.position.x;
            pos.y += node.position.y;
            pos.z += node.position.z;
            node = node.parent;
        }
        return pos;
    }
}

/**
 * 集成版微恐咖啡厅3D场景
 */
class WeiKongCoffeeShop3D {
    constructor(canvasId = 'gameCanvas', options = {}) {
        console.log('🎮 《微恐咖啡厅》集成版3D场景启动...');
        
        // 核心场景对象
        this.scene = new Node3D('CoffeeShopRoot');
        
        // 游戏状态
        this.time = 0;
        this.sanityLevel = 100; // 初始理智值 100-0
        this.horrorLevel = 0;   // 恐怖等级 0-1
        this.horrorMode = false;
        this.gameTime = 0;      // 游戏内时间
        
        // 材质系统
        this.materialFactory = null;
        this.materialConfigManager = null;
        this.materialCache = new Map();
        
        // 灯光系统
        this.lights = [];
        this.shadowsEnabled = true;
        
        // 恐怖事件系统
        this.horrorEvents = [];
        this.horrorCooldown = 0;
        this.lastHorrorEventTime = 0;
        
        // 性能监控
        this.performanceStats = {
            frameCount: 0,
            avgFPS: 0,
            lastFPS: 0,
            lastUpdateTime: 0,
            drawCalls: 0,
            nodeCount: 0,
            materialCount: 0,
            memoryEstimate: 0
        };
        
        // 渲染目标
        this.canvas = null;
        this.context = null;
        
        // 初始化
        this._initialize(options);
    }
    
    /**
     * 初始化场景
     */
    _initialize(options) {
        console.log('🏗️ 初始化集成版3D场景...');
        
        // 1. 初始化材质系统
        this._initMaterialSystem();
        
        // 2. 初始化灯光系统
        this._initLightSystem();
        
        // 3. 创建咖啡厅室内
        this._createCoffeeShopInterior();
        
        // 4. 初始化恐怖系统
        this._initHorrorSystem();
        
        // 5. 初始化性能监控
        this._initPerformanceMonitor();
        
        // 6. 初始化渲染系统（如果提供了canvas）
        if (options.canvasId) {
            this._initRenderSystem(options.canvasId);
        }
        
        console.log('✅ 集成版3D场景初始化完成');
        this._logSceneStats();
    }
    
    /**
     * 初始化材质系统
     */
    _initMaterialSystem() {
        console.log('🎨 初始化材质系统...');
        
        try {
            // 尝试加载材质工厂（如果可用）
            if (typeof MaterialFactory !== 'undefined') {
                this.materialFactory = new MaterialFactory();
                console.log('✅ 使用外部材质工厂');
            } else {
                // 创建简化版材质工厂
                this._createSimpleMaterialFactory();
                console.log('✅ 使用简化版材质工厂');
            }
            
            // 尝试加载材质配置管理器（如果可用）
            if (typeof MaterialConfigManager !== 'undefined') {
                this.materialConfigManager = new MaterialConfigManager();
                console.log('✅ 使用外部材质配置管理器');
            } else {
                // 创建简化版配置管理器
                this._createSimpleConfigManager();
                console.log('✅ 使用简化版配置管理器');
            }
        } catch (error) {
            console.warn('⚠️ 材质系统初始化失败，使用默认系统:', error.message);
            this._createSimpleMaterialFactory();
            this._createSimpleConfigManager();
        }
    }
    
    /**
     * 创建简化版材质工厂
     */
    _createSimpleMaterialFactory() {
        this.materialFactory = {
            getMaterial: (type, options = {}) => {
                const baseConfig = {
                    wood: { baseColor: [0.5, 0.4, 0.3], roughness: 0.8, metallic: 0.1 },
                    metal: { baseColor: [0.7, 0.7, 0.7], roughness: 0.3, metallic: 0.9 },
                    fabric: { baseColor: [0.6, 0.2, 0.2], roughness: 0.9, metallic: 0.0 },
                    ceramic: { baseColor: [0.9, 0.9, 0.95], roughness: 0.2, metallic: 0.05 },
                    ghost: { baseColor: [0.2, 0.5, 0.9, 0.3], emissive: [0.1, 0.3, 0.8], transparency: 0.3 },
                    blood: { baseColor: [0.6, 0.1, 0.1], roughness: 0.9, metallic: 0.1 },
                    default: { baseColor: [0.5, 0.5, 0.5], roughness: 0.5, metallic: 0.5 }
                };
                
                const config = baseConfig[type] || baseConfig.default;
                return {
                    type: type,
                    ...config,
                    ...options,
                    horrorEffects: this._calculateHorrorEffects(type, this.horrorLevel)
                };
            }
        };
    }
    
    /**
     * 创建简化版配置管理器
     */
    _createSimpleConfigManager() {
        this.materialConfigManager = {
            updateHorrorLevel: (sanityValue) => {
                // 简单映射：100-80=0, 79-60=0.2, 59-40=0.4, 39-20=0.7, 19-0=1.0
                let horrorLevel = 0;
                if (sanityValue >= 80) horrorLevel = 0.0;
                else if (sanityValue >= 60) horrorLevel = 0.2;
                else if (sanityValue >= 40) horrorLevel = 0.4;
                else if (sanityValue >= 20) horrorLevel = 0.7;
                else horrorLevel = 1.0;
                
                this.horrorLevel = horrorLevel;
                return { horrorLevel, description: this._getHorrorDescription(horrorLevel) };
            },
            
            getMaterialConfig: (objectType) => {
                // 简单映射
                const mapping = {
                    'counter': 'wood',
                    'table': 'wood', 
                    'chair': 'wood',
                    'coffeeMachine': 'metal',
                    'cup': 'ceramic',
                    'ghost': 'ghost',
                    'blood': 'blood'
                };
                
                return {
                    type: mapping[objectType] || 'default',
                    horrorLevel: this.horrorLevel,
                    objectType: objectType
                };
            }
        };
    }
    
    /**
     * 计算恐怖效果
     */
    _calculateHorrorEffects(materialType, horrorLevel) {
        const effects = {};
        
        if (materialType === 'wood') {
            effects.crackIntensity = horrorLevel;
            effects.bloodStainIntensity = horrorLevel * 0.8;
            effects.colorDarkening = horrorLevel * 0.6;
        } else if (materialType === 'metal') {
            effects.rustIntensity = horrorLevel;
            effects.patinaIntensity = horrorLevel * 0.7;
            effects.shineReduction = horrorLevel * 0.5;
        } else if (materialType === 'fabric') {
            effects.stainIntensity = horrorLevel;
            effects.colorShift = horrorLevel * 0.6;
            effects.textureRoughness = horrorLevel * 0.8;
        } else if (materialType === 'ceramic') {
            effects.bloodSeepage = horrorLevel;
            effects.crackProbability = horrorLevel * 0.8;
            effects.colorStaining = horrorLevel * 0.7;
        }
        
        return effects;
    }
    
    /**
     * 获取恐怖等级描述
     */
    _getHorrorDescription(level) {
        if (level <= 0.1) return '正常';
        if (level <= 0.3) return '细微裂纹';
        if (level <= 0.5) return '锈蚀显现'; 
        if (level <= 0.8) return '血渍明显';
        return '恐怖全开';
    }
    
    /**
     * 初始化灯光系统
     */
    _initLightSystem() {
        console.log('💡 初始化灯光系统...');
        
        this.lights = [
            {
                type: 'ambient',
                color: new Color(180, 180, 200),
                intensity: 0.3,
                position: new Vec3(0, 5, 0)
            },
            {
                type: 'directional',
                color: new Color(255, 240, 220),
                intensity: 0.7,
                position: new Vec3(2, 4, 3),
                target: new Vec3(0, 0, 0)
            },
            {
                type: 'point',
                color: new Color(255, 200, 150),
                intensity: 0.5,
                position: new Vec3(0, 2.5, -2),
                range: 4
            }
        ];
        
        console.log(`✅ 创建了 ${this.lights.length} 个灯光`);
    }
    
    /**
     * 创建咖啡厅室内
     */
    _createCoffeeShopInterior() {
        console.log('🏠 创建咖啡厅室内场景...');
        
        // 房间基础
        const room = new Node3D('Room', 'cube', 'wall');
        room.scale = new Vec3(10, 5, 8);
        this.scene.addChild(room);
        
        // 地板
        const floor = new Node3D('Floor', 'plane', 'wood_bloody_floor');
        floor.position = new Vec3(0, -2.4, 0);
        floor.scale = new Vec3(9.8, 1, 7.8);
        this.scene.addChild(floor);
        
        // 吧台
        const bar = new Node3D('Bar', 'cube', 'wood_dark_walnut');
        bar.position = new Vec3(0, -1.5, -3);
        bar.scale = new Vec3(5, 1.5, 1);
        this.scene.addChild(bar);
        
        // 吧台台面
        const barTop = new Node3D('BarTop', 'cube', 'wood_dark_walnut');
        barTop.position = new Vec3(0, 0.2, 0);
        barTop.scale = new Vec3(5.1, 0.1, 1.1);
        bar.addChild(barTop);
        
        // 咖啡机
        const coffeeMachine = new Node3D('CoffeeMachine', 'cube', 'metal_stainless_steel');
        coffeeMachine.position = new Vec3(-1, 0.8, 0.1);
        coffeeMachine.scale = new Vec3(0.8, 0.8, 0.8);
        bar.addChild(coffeeMachine);
        
        // 咖啡杯
        const cup1 = new Node3D('CoffeeCup1', 'cylinder', 'ceramic_white');
        cup1.position = new Vec3(0.5, 0.9, 0.1);
        cup1.scale = new Vec3(0.2, 0.3, 0.2);
        cup1.interactive = true;
        cup1.sanityEffect = 5; // 使用减少5点理智
        bar.addChild(cup1);
        
        const cup2 = new Node3D('CoffeeCup2', 'cylinder', 'ceramic_white');
        cup2.position = new Vec3(1.5, 0.9, 0.1);
        cup2.scale = new Vec3(0.2, 0.3, 0.2);
        cup2.interactive = true;
        bar.addChild(cup2);
        
        // 顾客桌1
        const table1 = new Node3D('Table1', 'cube', 'wood_honey_oak');
        table1.position = new Vec3(-2, -1.5, 1);
        table1.scale = new Vec3(1.5, 1, 1.5);
        this.scene.addChild(table1);
        
        // 顾客桌2
        const table2 = new Node3D('Table2', 'cube', 'wood_honey_oak');
        table2.position = new Vec3(2, -1.5, 1);
        table2.scale = new Vec3(1.5, 1, 1.5);
        this.scene.addChild(table2);
        
        // 椅子1
        const chair1 = new Node3D('Chair1', 'cube', 'wood_honey_oak');
        chair1.position = new Vec3(-2, -1.8, 2);
        chair1.scale = new Vec3(0.8, 1.2, 0.8);
        chair1.interactive = true;
        chair1.sanityEffect = 3;
        this.scene.addChild(chair1);
        
        // 椅子1布料
        const chair1Fabric = new Node3D('Chair1Fabric', 'cube', 'fabric_velvet_red');
        chair1Fabric.position = new Vec3(0, 0.3, 0);
        chair1Fabric.scale = new Vec3(0.7, 0.2, 0.7);
        chair1.addChild(chair1Fabric);
        
        // 椅子2
        const chair2 = new Node3D('Chair2', 'cube', 'wood_honey_oak');
        chair2.position = new Vec3(2, -1.8, 2);
        chair2.scale = new Vec3(0.8, 1.2, 0.8);
        this.scene.addChild(chair2);
        
        // 时钟
        const clock = new Node3D('Clock', 'cylinder', 'metal_brass');
        clock.position = new Vec3(0, 2, -3);
        clock.scale = new Vec3(0.5, 0.05, 0.5);
        this.scene.addChild(clock);
        
        // 幽灵生成点
        const ghostSpawn = new Node3D('GhostSpawn', 'sphere', 'ghost_blue');
        ghostSpawn.position = new Vec3(4, 1, 0);
        ghostSpawn.scale = new Vec3(0.5, 0.5, 0.5);
        ghostSpawn.visible = false; // 隐藏生成点
        this.scene.addChild(ghostSpawn);
        
        console.log('✅ 咖啡厅室内创建完成');
    }
    
    /**
     * 初始化恐怖系统
     */
    _initHorrorSystem() {
        console.log('👻 初始化恐怖系统...');
        
        this.horrorEvents = [
            { 
                name: '幽灵出现', 
                sanityThreshold: 70,
                cooldown: 30000,
                probability: 0.1,
                effect: 'ghost_appear'
            },
            { 
                name: '灯光闪烁', 
                sanityThreshold: 50,
                cooldown: 20000,
                probability: 0.15,
                effect: 'light_flicker'
            },
            { 
                name: '血滴出现', 
                sanityThreshold: 30,
                cooldown: 15000,
                probability: 0.2,
                effect: 'blood_drip'
            },
            { 
                name: '影子移动', 
                sanityThreshold: 20,
                cooldown: 10000,
                probability: 0.25,
                effect: 'shadow_move'
            }
        ];
        
        this.horrorCooldown = 0;
        this.lastHorrorEventTime = 0;
        
        console.log(`✅ 初始化了 ${this.horrorEvents.length} 种恐怖事件`);
    }
    
    /**
     * 初始化性能监控
     */
    _initPerformanceMonitor() {
        console.log('📊 初始化性能监控...');
        
        this.performanceStats = {
            frameCount: 0,
            avgFPS: 0,
            lastFPS: 0,
            lastUpdateTime: Date.now(),
            drawCalls: 0,
            nodeCount: 0,
            materialCount: 0,
            memoryEstimate: 0,
            horrorLevel: this.horrorLevel,
            sanityLevel: this.sanityLevel
        };
    }
    
    /**
     * 初始化渲染系统
     */
    _initRenderSystem(canvasId) {
        console.log('🎨 初始化渲染系统...');
        
        try {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                console.warn(`⚠️ 找不到canvas元素: #${canvasId}`);
                return;
            }
            
            this.context = this.canvas.getContext('2d');
            if (!this.context) {
                console.warn('⚠️ 无法获取2D上下文');
                return;
            }
            
            console.log(`✅ 渲染系统初始化完成，canvas尺寸: ${this.canvas.width}x${this.canvas.height}`);
        } catch (error) {
            console.warn('⚠️ 渲染系统初始化失败:', error.message);
        }
    }
    
    /**
     * 更新场景（游戏循环）
     */
    update(deltaTime = 16.67) { // 默认60FPS
        // 更新时间
        this.time += deltaTime;
        this.gameTime += deltaTime / 1000; // 转换为秒
        
        // 更新理智值和恐怖等级
        this._updateSanity(deltaTime);
        
        // 更新恐怖事件
        this._updateHorrorEvents(deltaTime);
        
        // 更新材质（根据恐怖等级）
        this._updateMaterials();
        
        // 更新灯光
        this._updateLights(deltaTime);
        
        // 更新性能统计
        this._updatePerformanceStats(deltaTime);
        
        // 渲染（如果有渲染系统）
        if (this.canvas && this.context) {
            this._render();
        }
        
        return this.getGameState();
    }
    
    /**
     * 更新理智值
     */
    _updateSanity(deltaTime) {
        // 基础理智值下降：每秒下降0.5点
        const sanityDecay = deltaTime / 1000 * 0.5;
        
        // 恐怖模式加速下降
        const horrorMultiplier = this.horrorMode ? 2.0 : 1.0;
        
        // 更新理智值
        this.sanityLevel = Math.max(0, this.sanityLevel - sanityDecay * horrorMultiplier);
        
        // 更新恐怖等级
        const horrorUpdate = this.materialConfigManager.updateHorrorLevel(this.sanityLevel);
        if (horrorUpdate) {
            this.horrorLevel = horrorUpdate.horrorLevel;
        }
        
        // 触发恐怖模式
        if (this.sanityLevel < 40 && !this.horrorMode) {
            this.horrorMode = true;
            console.log('👻 恐怖模式激活！');
        } else if (this.sanityLevel >= 40 && this.horrorMode) {
            this.horrorMode = false;
            console.log('😌 恐怖模式解除');
        }
    }
    
    /**
     * 更新恐怖事件
     */
    _updateHorrorEvents(deltaTime) {
        // 更新冷却时间
        if (this.horrorCooldown > 0) {
            this.horrorCooldown -= deltaTime;
        }
        
        // 检查是否触发新事件
        if (this.horrorCooldown <= 0) {
            const now = Date.now();
            const timeSinceLastEvent = now - this.lastHorrorEventTime;
            
            // 遍历所有恐怖事件
            for (const event of this.horrorEvents) {
                // 检查理智值阈值
                if (this.sanityLevel <= event.sanityThreshold) {
                    // 检查概率
                    const probability = event.probability * (1 - this.sanityLevel / 100);
                    if (Math.random() < probability) {
                        // 触发事件
                        this._triggerHorrorEvent(event);
                        this.horrorCooldown = event.cooldown;
                        this.lastHorrorEventTime = now;
                        break;
                    }
                }
            }
        }
    }
    
    /**
     * 触发恐怖事件
     */
    _triggerHorrorEvent(event) {
        console.log(`👻 恐怖事件触发: ${event.name}`);
        
        // 这里可以添加具体的视觉效果和音效
        switch(event.effect) {
            case 'ghost_appear':
                this._spawnGhost();
                break;
            case 'light_flicker':
                this._flickerLights();
                break;
            case 'blood_drip':
                this._spawnBloodDrip();
                break;
            case 'shadow_move':
                this._moveShadows();
                break;
        }
        
        // 事件触发会额外减少理智值
        this.sanityLevel = Math.max(0, this.sanityLevel - 5);
    }
    
    /**
     * 生成幽灵
     */
    _spawnGhost() {
        console.log('👻 幽灵出现！');
        // 在实际实现中，这里会创建一个幽灵节点
    }
    
    /**
     * 灯光闪烁
     */
    _flickerLights() {
        console.log('💡 灯光闪烁！');
        // 在实际实现中，这里会控制灯光强度变化
    }
    
    /**
     * 生成血滴
     */
    _spawnBloodDrip() {
        console.log('🩸 血滴出现！');
        // 在实际实现中，这里会创建血滴效果
    }
    
    /**
     * 移动阴影
     */
    _moveShadows() {
        console.log('🌑 影子移动！');
        // 在实际实现中，这里会更新阴影位置
    }
    
    /**
     * 更新材质
     */
    _updateMaterials() {
        // 遍历场景节点，更新材质
        this._traverseNodes(this.scene, (node) => {
            if (node.materialType && node.materialType !== 'default') {
                // 获取材质配置
                const config = this.materialConfigManager.getMaterialConfig(node.name.toLowerCase());
                
                // 获取材质
                const material = this.materialFactory.getMaterial(config.type, {
                    horrorLevel: this.horrorLevel,
                    ...config
                });
                
                // 缓存材质
                if (!node.materialConfig || JSON.stringify(node.materialConfig) !== JSON.stringify(config)) {
                    node.materialConfig = config;
                    // 在实际渲染中，这里会更新材质属性
                }
            }
        });
    }
    
    /**
     * 更新灯光
     */
    _updateLights(deltaTime) {
        // 恐怖模式下灯光会有变化
        if (this.horrorMode) {
            for (const light of this.lights) {
                // 轻微随机闪烁
                if (Math.random() < 0.1) {
                    light.intensity *= (0.8 + Math.random() * 0.4);
                }
                
                // 恐怖模式下灯光变暗变红
                if (light.type !== 'ambient') {
                    light.color.r = Math.min(255, light.color.r + this.horrorLevel * 50);
                    light.color.g = Math.max(100, light.color.g - this.horrorLevel * 50);
                    light.intensity = Math.max(0.3, light.intensity - this.horrorLevel * 0.2);
                }
            }
        }
    }
    
    /**
     * 更新性能统计
     */
    _updatePerformanceStats(deltaTime) {
        const now = Date.now();
        const timeSinceLast = now - this.performanceStats.lastUpdateTime;
        
        this.performanceStats.frameCount++;
        
        // 计算FPS
        if (timeSinceLast >= 1000) {
            this.performanceStats.lastFPS = this.performanceStats.frameCount;
            this.performanceStats.avgFPS = this.performanceStats.avgFPS * 0.9 + this.performanceStats.lastFPS * 0.1;
            this.performanceStats.frameCount = 0;
            this.performanceStats.lastUpdateTime = now;
            
            // 计算节点和材质数量
            this.performanceStats.nodeCount = this._countNodes(this.scene);
            this.performanceStats.materialCount = this.materialCache.size;
            this.performanceStats.horrorLevel = this.horrorLevel;
            this.performanceStats.sanityLevel = this.sanityLevel;
            
            // 估算内存使用
            this.performanceStats.memoryEstimate = this._estimateMemoryUsage();
        }
    }
    
    /**
     * 遍历场景节点
     */
    _traverseNodes(node, callback) {
        callback(node);
        for (const child of node.children) {
            this._traverseNodes(child, callback);
        }
    }
    
    /**
     * 统计节点数量
     */
    _countNodes(node) {
        let count = 1; // 当前节点
        for (const child of node.children) {
            count += this._countNodes(child);
        }
        return count;
    }
    
    /**
     * 估算内存使用
     */
    _estimateMemoryUsage() {
        // 简化估算：每个节点约0.5KB，每个材质约2KB
        const nodeMemory = this.performanceStats.nodeCount * 0.5;
        const materialMemory = this.performanceStats.materialCount * 2;
        const textureMemory = 0; // 程序化纹理，无外部贴图
        
        return Math.round(nodeMemory + materialMemory + textureMemory);
    }
    
    /**
     * 渲染场景
     */
    _render() {
        // 清空canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.context.fillStyle = this.horrorMode ? '#1a0a0a' : '#2a1a1a';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制游戏状态信息
        this._renderGameInfo();
        
        // 绘制性能统计（如果启用）
        if (this.performanceStats.lastUpdateTime > 0) {
            this._renderPerformanceStats();
        }
    }
    
    /**
     * 渲染游戏信息
     */
    _renderGameInfo() {
        const ctx = this.context;
        
        // 绘制理智值条
        const sanityBarWidth = 200;
        const sanityBarHeight = 20;
        const sanityBarX = 20;
        const sanityBarY = 20;
        
        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(sanityBarX, sanityBarY, sanityBarWidth, sanityBarHeight);
        
        // 前景（根据理智值颜色渐变）
        const sanityPercent = this.sanityLevel / 100;
        let barColor;
        if (sanityPercent > 0.6) barColor = '#4CAF50'; // 绿色
        else if (sanityPercent > 0.3) barColor = '#FFC107'; // 黄色
        else barColor = '#F44336'; // 红色
        
        ctx.fillStyle = barColor;
        ctx.fillRect(sanityBarX, sanityBarY, sanityBarWidth * sanityPercent, sanityBarHeight);
        
        // 边框
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(sanityBarX, sanityBarY, sanityBarWidth, sanityBarHeight);
        
        // 文本
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `理智值: ${Math.round(this.sanityLevel)}`,
            sanityBarX + sanityBarWidth / 2,
            sanityBarY + sanityBarHeight / 2 + 5
        );
        
        // 恐怖等级
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`恐怖等级: ${(this.horrorLevel * 100).toFixed(0)}%`, 20, 60);
        
        // 游戏时间
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        ctx.fillText(`游戏时间: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 80);
        
        // 恐怖模式指示器
        if (this.horrorMode) {
            ctx.fillStyle = '#F44336';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('👻 恐怖模式激活', 20, 110);
        }
    }
    
    /**
     * 渲染性能统计
     */
    _renderPerformanceStats() {
        const ctx = this.context;
        const stats = this.performanceStats;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, this.canvas.height - 150, 300, 140);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        
        let y = this.canvas.height - 135;
        const lineHeight = 18;
        
        ctx.fillText(`FPS: ${stats.lastFPS} (平均: ${stats.avgFPS.toFixed(1)})`, 20, y); y += lineHeight;
        ctx.fillText(`节点: ${stats.nodeCount}`, 20, y); y += lineHeight;
        ctx.fillText(`材质: ${stats.materialCount}`, 20, y); y += lineHeight;
        ctx.fillText(`估算内存: ${stats.memoryEstimate}KB`, 20, y); y += lineHeight;
        ctx.fillText(`理智值: ${Math.round(stats.sanityLevel)}`, 20, y); y += lineHeight;
        ctx.fillText(`恐怖等级: ${(stats.horrorLevel * 100).toFixed(0)}%`, 20, y); y += lineHeight;
        ctx.fillText(`恐怖模式: ${this.horrorMode ? '开启' : '关闭'}`, 20, y);
    }
    
    /**
     * 获取游戏状态
     */
    getGameState() {
        return {
            time: this.time,
            gameTime: this.gameTime,
            sanityLevel: this.sanityLevel,
            horrorLevel: this.horrorLevel,
            horrorMode: this.horrorMode,
            performance: {
                fps: this.performanceStats.lastFPS,
                avgFPS: this.performanceStats.avgFPS,
                nodes: this.performanceStats.nodeCount,
                materials: this.performanceStats.materialCount,
                memoryKB: this.performanceStats.memoryEstimate
            },
            sceneInfo: {
                totalNodes: this._countNodes(this.scene),
                totalLights: this.lights.length,
                horrorEvents: this.horrorEvents.length
            }
        };
    }
    
    /**
     * 交互处理（点击物体）
     */
    handleInteraction(x, y) {
        console.log(`🖱️ 交互点击: (${x}, ${y})`);
        
        // 这里应该实现点击检测逻辑
        // 在实际实现中，会根据2D坐标反算3D坐标并检测碰撞
        
        return {
            success: false,
            message: '交互系统待实现',
            sanityChange: 0
        };
    }
    
    /**
     * 重置游戏状态
     */
    resetGame() {
        console.log('🔄 重置游戏状态');
        
        this.time = 0;
        this.gameTime = 0;
        this.sanityLevel = 100;
        this.horrorLevel = 0;
        this.horrorMode = false;
        
        // 更新材质配置
        this.materialConfigManager.updateHorrorLevel(100);
        
        return this.getGameState();
    }
    
    /**
     * 获取场景统计
     */
    getSceneStats() {
        const stats = {
            totalNodes: this._countNodes(this.scene),
            totalLights: this.lights.length,
            totalMaterials: this.performanceStats.materialCount,
            memoryEstimateKB: this.performanceStats.memoryEstimate,
            horrorSystem: {
                horrorLevel: this.horrorLevel,
                horrorMode: this.horrorMode,
                eventCount: this.horrorEvents.length,
                cooldownRemaining: this.horrorCooldown
            },
            performance: {
                fps: this.performanceStats.lastFPS,
                avgFPS: this.performanceStats.avgFPS
            }
        };
        
        return stats;
    }
    
    /**
     * 记录场景统计
     */
    _logSceneStats() {
        const stats = this.getSceneStats();
        console.log('📊 场景统计:');
        console.log(`  - 总节点数: ${stats.totalNodes}`);
        console.log(`  - 灯光数量: ${stats.totalLights}`);
        console.log(`  - 材质数量: ${stats.totalMaterials}`);
        console.log(`  - 估算内存: ${stats.memoryEstimateKB}KB`);
        console.log(`  - 恐怖等级: ${(stats.horrorSystem.horrorLevel * 100).toFixed(0)}%`);
        console.log(`  - 恐怖事件: ${stats.horrorSystem.eventCount}种`);
    }
}

/**
 * 测试函数
 */
function testIntegratedScene() {
    console.log('🧪 测试集成版场景...');
    
    try {
        const scene = new WeiKongCoffeeShop3D();
        
        // 模拟游戏循环
        const testDuration = 30; // 30秒测试
        let testTime = 0;
        
        console.log('🎮 开始模拟游戏循环...');
        
        const interval = setInterval(() => {
            testTime++;
            const gameState = scene.update(16.67); // 60FPS
            
            if (testTime % 10 === 0) {
                console.log(`⏱️ 测试时间: ${testTime}s`);
                console.log(`  🧠 理智值: ${gameState.sanityLevel.toFixed(1)}`);
                console.log(`  👻 恐怖等级: ${(gameState.horrorLevel * 100).toFixed(0)}%`);
                console.log(`  🖥️ FPS: ${gameState.performance.fps}`);
            }
            
            if (testTime >= testDuration) {
                clearInterval(interval);
                console.log('✅ 集成版场景测试完成');
                
                const finalStats = scene.getSceneStats();
                console.log('📊 最终统计:');
                console.log(JSON.stringify(finalStats, null, 2));
            }
        }, 1000 / 60); // 60FPS
        
    } catch (error) {
        console.error('❌ 集成版场景测试失败:', error);
    }
}

// 如果是Node.js环境，导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeiKongCoffeeShop3D;
}

// 如果是浏览器环境，挂载到全局
if (typeof window !== 'undefined') {
    window.WeiKongCoffeeShop3D = WeiKongCoffeeShop3D;
    window.testIntegratedScene = testIntegratedScene;
    
    // 自动测试
    if (window.location.search.includes('test=integrated')) {
        setTimeout(testIntegratedScene, 1000);
    }
}

console.log('✅ 《微恐咖啡厅》集成版3D场景系统加载完成');
console.log('📋 使用说明:');
console.log('  1. 创建场景: new WeiKongCoffeeShop3D("gameCanvas")');
console.log('  2. 游戏循环: scene.update(deltaTime)');
console.log('  3. 获取状态: scene.getGameState()');
console.log('  4. 交互处理: scene.handleInteraction(x, y)');
console.log('  5. 重置游戏: scene.resetGame()');
console.log('');
console.log('🎮 集成特性:');
console.log('  ✅ 材质工厂系统集成');
console.log('  ✅ 材质配置管理器集成');
console.log('  ✅ 恐怖进度联动系统');
console.log('  ✅ 性能监控和优化');
console.log('  ✅ 微信小游戏兼容设计');