/**
 * 微恐咖啡厅 - 简化版3D场景控制器
 * 用于快速原型开发，避免复杂的Cocos依赖
 */

// 3D向量类
class Vec3 {
    constructor(public x: number, public y: number, public z: number) {}
    
    static zero(): Vec3 {
        return new Vec3(0, 0, 0);
    }
    
    clone(): Vec3 {
        return new Vec3(this.x, this.y, this.z);
    }
}

// 颜色类
class Color {
    constructor(public r: number, public g: number, public b: number, public a: number = 255) {}
    
    static lerp(a: Color, b: Color, t: number): Color {
        return new Color(
            a.r + (b.r - a.r) * t,
            a.g + (b.g - a.g) * t,
            a.b + (b.b - a.b) * t,
            a.a + (b.a - a.a) * t
        );
    }
}

// 3D节点类
class Node3D {
    name: string;
    position: Vec3;
    scale: Vec3;
    rotation: Vec3;
    children: Node3D[];
    parent: Node3D | null;
    material: string;
    geometry: string;
    visible: boolean;
    
    constructor(name: string) {
        this.name = name;
        this.position = Vec3.zero();
        this.scale = new Vec3(1, 1, 1);
        this.rotation = Vec3.zero();
        this.children = [];
        this.parent = null;
        this.material = 'default';
        this.geometry = 'cube';
        this.visible = true;
    }
    
    addChild(node: Node3D): void {
        node.parent = this;
        this.children.push(node);
    }
}

// 材质类
class Material3D {
    name: string;
    albedo: Color;
    metallic: number;
    roughness: number;
    emissive: Color;
    emissiveIntensity: number;
    transparent: boolean;
    
    constructor(name: string) {
        this.name = name;
        this.albedo = new Color(255, 255, 255);
        this.metallic = 0.1;
        this.roughness = 0.8;
        this.emissive = new Color(0, 0, 0);
        this.emissiveIntensity = 0;
        this.transparent = false;
    }
}

// 灯光类
class Light3D {
    type: 'point' | 'directional' | 'spot';
    position: Vec3;
    color: Color;
    intensity: number;
    range: number;
    enabled: boolean;
    
    constructor(type: 'point' | 'directional' | 'spot') {
        this.type = type;
        this.position = Vec3.zero();
        this.color = new Color(255, 255, 255);
        this.intensity = 1.0;
        this.range = 10;
        this.enabled = true;
    }
}

// 微恐咖啡厅3D场景
class MidnightCoffeeShop3D {
    private scene: Node3D;
    private materials: Map<string, Material3D>;
    private lights: Light3D[];
    private time: number;
    private horrorMode: boolean;
    private horrorTimer: number;
    private sanityLevel: number;
    
    constructor() {
        console.log('🎮 创建微恐咖啡厅3D场景...');
        
        this.scene = new Node3D('MidnightCoffeeShop');
        this.materials = new Map();
        this.lights = [];
        this.time = 0;
        this.horrorMode = false;
        this.horrorTimer = 0;
        this.sanityLevel = 100; // 初始理智值
        
        this.initialize();
    }
    
    /**
     * 初始化场景
     */
    private initialize(): void {
        console.log('🏗️ 初始化场景...');
        
        // 1. 创建材质系统
        this.createMaterials();
        
        // 2. 创建灯光系统
        this.createLights();
        
        // 3. 创建咖啡厅室内
        this.createCoffeeShop();
        
        // 4. 创建恐怖特效
        this.createHorrorEffects();
        
        console.log('✅ 3D场景初始化完成');
    }
    
    /**
     * 创建材质系统
     */
    private createMaterials(): void {
        console.log('🎨 创建材质系统...');
        
        // 深色木质材质（吧台、椅子）
        const woodDark = new Material3D('wood_dark');
        woodDark.albedo = new Color(70, 50, 35);
        woodDark.metallic = 0.2;
        woodDark.roughness = 0.8;
        this.materials.set('wood_dark', woodDark);
        
        // 浅色木质材质（桌子）
        const woodLight = new Material3D('wood_light');
        woodLight.albedo = new Color(180, 150, 120);
        woodLight.metallic = 0.1;
        woodLight.roughness = 0.7;
        this.materials.set('wood_light', woodLight);
        
        // 金属材质（咖啡机、时钟）
        const metal = new Material3D('metal');
        metal.albedo = new Color(180, 180, 190);
        metal.metallic = 0.9;
        metal.roughness = 0.3;
        this.materials.set('metal', metal);
        
        // 陶瓷材质（咖啡杯）
        const porcelain = new Material3D('porcelain');
        porcelain.albedo = new Color(240, 240, 245);
        porcelain.metallic = 0.05;
        porcelain.roughness = 0.2;
        this.materials.set('porcelain', porcelain);
        
        // 布料材质（咖啡豆袋）
        const fabric = new Material3D('fabric');
        fabric.albedo = new Color(150, 100, 50);
        fabric.metallic = 0.0;
        fabric.roughness = 0.9;
        this.materials.set('fabric', fabric);
        
        // 纸张材质（海报）
        const paper = new Material3D('paper');
        paper.albedo = new Color(220, 200, 160);
        paper.metallic = 0.0;
        paper.roughness = 0.8;
        this.materials.set('paper', paper);
        
        // 幽灵材质（半透明）
        const ghost = new Material3D('ghost');
        ghost.albedo = new Color(150, 200, 255, 100);
        ghost.metallic = 0.1;
        ghost.roughness = 0.6;
        ghost.emissive = new Color(100, 150, 255);
        ghost.emissiveIntensity = 0.3;
        ghost.transparent = true;
        this.materials.set('ghost', ghost);
        
        // 恐怖材质（红色发光）
        const horror = new Material3D('horror');
        horror.albedo = new Color(100, 30, 30);
        horror.metallic = 0.5;
        horror.roughness = 0.5;
        horror.emissive = new Color(255, 50, 50);
        horror.emissiveIntensity = 0.8;
        this.materials.set('horror', horror);
        
        console.log(`✅ 创建了 ${this.materials.size} 种材质`);
    }
    
    /**
     * 创建灯光系统
     */
    private createLights(): void {
        console.log('💡 创建灯光系统...');
        
        // 主灯光（点光源，昏暗黄色）
        const mainLight = new Light3D('point');
        mainLight.position = new Vec3(0, 3, -1);
        mainLight.color = new Color(255, 220, 180);
        mainLight.intensity = 0.6;
        mainLight.range = 15;
        this.lights.push(mainLight);
        
        // 吧台灯光（聚光灯，暖白色）
        const counterLight = new Light3D('spot');
        counterLight.position = new Vec3(0, 2.5, -2.8);
        counterLight.color = new Color(255, 240, 220);
        counterLight.intensity = 0.8;
        counterLight.range = 8;
        this.lights.push(counterLight);
        
        // 红色警示灯（恐怖模式用）
        const redAlertLight = new Light3D('point');
        redAlertLight.position = new Vec3(2, 2, -4);
        redAlertLight.color = new Color(255, 50, 50);
        redAlertLight.intensity = 0.3;
        redAlertLight.range = 12;
        redAlertLight.enabled = false; // 默认关闭
        this.lights.push(redAlertLight);
        
        // 蓝色幽灵光
        const blueGhostLight = new Light3D('point');
        blueGhostLight.position = new Vec3(-2, 1.5, -4);
        blueGhostLight.color = new Color(100, 150, 255);
        blueGhostLight.intensity = 0.2;
        blueGhostLight.range = 10;
        blueGhostLight.enabled = false; // 默认关闭
        this.lights.push(blueGhostLight);
        
        console.log(`✅ 创建了 ${this.lights.length} 个灯光`);
    }
    
    /**
     * 创建咖啡厅室内
     */
    private createCoffeeShop(): void {
        console.log('🏪 创建咖啡厅室内...');
        
        // 场景尺寸
        const sceneSize = {
            width: 12,
            height: 6,
            depth: 12
        };
        
        // 创建地板
        const floor = this.createBox('Floor', {
            position: new Vec3(0, -0.5, 0),
            size: new Vec3(sceneSize.width, 1, sceneSize.depth)
        });
        floor.material = 'wood_dark';
        this.scene.addChild(floor);
        
        // 创建墙壁
        const wallFront = this.createBox('Wall_Front', {
            position: new Vec3(0, 2, sceneSize.depth/2 - 0.5),
            size: new Vec3(sceneSize.width, sceneSize.height, 1)
        });
        wallFront.material = 'wood_light';
        this.scene.addChild(wallFront);
        
        const wallBack = this.createBox('Wall_Back', {
            position: new Vec3(0, 2, -sceneSize.depth/2 + 0.5),
            size: new Vec3(sceneSize.width, sceneSize.height, 1)
        });
        wallBack.material = 'wood_light';
        this.scene.addChild(wallBack);
        
        const wallLeft = this.createBox('Wall_Left', {
            position: new Vec3(-sceneSize.width/2 + 0.5, 2, 0),
            size: new Vec3(1, sceneSize.height, sceneSize.depth)
        });
        wallLeft.material = 'wood_light';
        this.scene.addChild(wallLeft);
        
        const wallRight = this.createBox('Wall_Right', {
            position: new Vec3(sceneSize.width/2 - 0.5, 2, 0),
            size: new Vec3(1, sceneSize.height, sceneSize.depth)
        });
        wallRight.material = 'wood_light';
        this.scene.addChild(wallRight);
        
        // 创建天花板
        const ceiling = this.createBox('Ceiling', {
            position: new Vec3(0, sceneSize.height - 0.5, 0),
            size: new Vec3(sceneSize.width, 1, sceneSize.depth)
        });
        ceiling.material = 'wood_dark';
        this.scene.addChild(ceiling);
        
        // 创建吧台
        const counter = this.createBox('Counter', {
            position: new Vec3(0, 0.75, -2),
            size: new Vec3(4, 1.5, 1)
        });
        counter.material = 'wood_dark';
        this.scene.addChild(counter);
        
        // 创建咖啡机
        const coffeeMachine = this.createBox('CoffeeMachine', {
            position: new Vec3(0, 1.4, -2.2),
            size: new Vec3(0.8, 1.2, 0.8)
        });
        coffeeMachine.material = 'metal';
        this.scene.addChild(coffeeMachine);
        
        // 创建咖啡杯
        const coffeeCup = this.createCylinder('CoffeeCup', {
            position: new Vec3(1, 1.2, -2),
            radius: 0.1,
            height: 0.3
        });
        coffeeCup.material = 'porcelain';
        this.scene.addChild(coffeeCup);
        
        // 创建5张桌子
        const tablePositions = [
            new Vec3(-3, 0.3, 1),
            new Vec3(0, 0.3, 2),
            new Vec3(3, 0.3, 1),
            new Vec3(-2, 0.3, -1),
            new Vec3(2, 0.3, -1)
        ];
        
        for (let i = 0; i < tablePositions.length; i++) {
            const table = this.createBox(`Table_${i + 1}`, {
                position: tablePositions[i],
                size: new Vec3(0.8, 0.6, 0.8)
            });
            table.material = 'wood_light';
            this.scene.addChild(table);
        }
        
        // 创建10把椅子
        const chairPositions = [
            new Vec3(-3.8, 0.4, 1),
            new Vec3(-2.2, 0.4, 1),
            new Vec3(0.8, 0.4, 2.8),
            new Vec3(-0.8, 0.4, 2.8),
            new Vec3(3.8, 0.4, 1),
            new Vec3(2.2, 0.4, 1),
            new Vec3(-3, 0.4, -1.8),
            new Vec3(-1, 0.4, -1.8),
            new Vec3(3, 0.4, -1.8),
            new Vec3(1, 0.4, -1.8)
        ];
        
        for (let i = 0; i < chairPositions.length; i++) {
            const chair = this.createBox(`Chair_${i + 1}`, {
                position: chairPositions[i],
                size: new Vec3(0.4, 0.8, 0.4)
            });
            chair.material = 'wood_dark';
            this.scene.addChild(chair);
        }
        
        // 创建时钟
        const clock = this.createCylinder('Clock', {
            position: new Vec3(-4, 2.5, -4),
            radius: 0.25,
            height: 0.1
        });
        clock.material = 'metal';
        this.scene.addChild(clock);
        
        // 创建咖啡豆袋
        const coffeeBeanBag = this.createBox('CoffeeBeanBag', {
            position: new Vec3(3.5, 0.5, -3),
            size: new Vec3(0.4, 0.5, 0.3)
        });
        coffeeBeanBag.material = 'fabric';
        this.scene.addChild(coffeeBeanBag);
        
        // 创建海报
        const poster = this.createBox('Poster', {
            position: new Vec3(-4, 2, 3),
            size: new Vec3(1.2, 1.6, 0.05)
        });
        poster.material = 'paper';
        this.scene.addChild(poster);
        
        console.log('✅ 咖啡厅室内创建完成');
    }
    
    /**
     * 创建恐怖特效
     */
    private createHorrorEffects(): void {
        console.log('👻 创建恐怖特效...');
        
        // 创建幽灵模型
        const ghost = new Node3D('Ghost');
        ghost.position = new Vec3(-3, 1.5, 3);
        ghost.geometry = 'sphere';
        ghost.material = 'ghost';
        this.scene.addChild(ghost);
        
        // 创建血滴效果节点
        const bloodDrops = new Node3D('BloodDrops');
        bloodDrops.visible = false;
        this.scene.addChild(bloodDrops);
        
        // 创建雾气效果节点
        const fog = new Node3D('Fog');
        fog.visible = false;
        this.scene.addChild(fog);
        
        console.log('✅ 恐怖特效创建完成');
    }
    
    /**
     * 创建立方体节点
     */
    private createBox(name: string, options: {
        position: Vec3,
        size: Vec3
    }): Node3D {
        const node = new Node3D(name);
        node.position = options.position;
        node.scale = options.size;
        node.geometry = 'cube';
        return node;
    }
    
    /**
     * 创建圆柱体节点
     */
    private createCylinder(name: string, options: {
        position: Vec3,
        radius: number,
        height: number
    }): Node3D {
        const node = new Node3D(name);
        node.position = options.position;
        node.scale = new Vec3(options.radius * 2, options.height, options.radius * 2);
        node.geometry = 'cylinder';
        return node;
    }
    
    /**
     * 更新场景
     */
    public update(deltaTime: number): void {
        this.time += deltaTime;
        
        // 更新灯光效果
        this.updateLights(deltaTime);
        
        // 更新恐怖模式
        this.updateHorrorMode(deltaTime);
        
        // 更新幽灵移动
        this.updateGhostMovement(deltaTime);
        
        // 更新随机恐怖事件
        this.updateRandomEvents(deltaTime);
    }
    
    /**
     * 更新灯光效果
     */
    private updateLights(deltaTime: number): void {
        const horrorIntensity = (100 - this.sanityLevel) / 100;
        
        // 主灯光闪烁
        const mainLight = this.lights[0];
        if (mainLight) {
            const flicker = Math.sin(this.time * 5) * 0.1 * horrorIntensity;
            mainLight.intensity = 0.6 - flicker;
            
            // 恐怖模式下灯光变红
            if (this.horrorMode) {
                const redMix = Math.min(this.horrorTimer / 5, 1);
                mainLight.color = Color.lerp(
                    new Color(255, 220, 180),
                    new Color(255, 100, 100),
                    redMix
                );
            }
        }
        
        // 吧台灯光闪烁
        const counterLight = this.lights[1];
        if (counterLight) {
            const flicker = Math.random() * 0.1 * horrorIntensity;
            counterLight.intensity = 0.8 - flicker;
        }
        
        // 控制恐怖灯光
        const redLight = this.lights[2];
        const blueLight = this.lights[3];
        
        if (this.horrorMode) {
            if (redLight) redLight.enabled = true;
            if (blueLight) blueLight.enabled = true;
            
            // 红色灯光闪烁
            if (redLight) {
                redLight.intensity = 0.3 + Math.sin(this.time * 8) * 0.15;
            }
            
            // 蓝色灯光闪烁
            if (blueLight) {
                blueLight.intensity = 0.2 + Math.sin(this.time * 6 + 1) * 0.1;
            }
        } else {
            if (redLight) redLight.enabled = false;
            if (blueLight) blueLight.enabled = false;
        }
    }
    
    /**
     * 更新恐怖模式
     */
    private updateHorrorMode(deltaTime: number): void {
        // 当理智值低于40时，随机进入恐怖模式
        if (this.sanityLevel < 40 && !this.horrorMode && Math.random() < 0.01) {
            this.enterHorrorMode();
        }
        
        if (this.horrorMode) {
            this.horrorTimer += deltaTime;
            
            // 恐怖模式持续10-20秒
            if (this.horrorTimer > 10 + Math.random() * 10) {
                this.exitHorrorMode();
            }
        }
    }
    
    /**
     * 进入恐怖模式
     */
    private enterHorrorMode(): void {
        console.log('👻 进入恐怖模式！');
        this.horrorMode = true;
        this.horrorTimer = 0;
        
        // 播放恐怖音效
        this.playSound('horror_enter');
        
        // 触发恐怖事件
        this.triggerHorrorEvent('scene_horror_enter');
    }
    
    /**
     * 退出恐怖模式
     */
    private exitHorrorMode(): void {
        console.log('👻 退出恐怖模式');
        this.horrorMode = false;
        
        // 播放恢复音效
        this.playSound('horror_exit');
        
        // 触发恢复事件
        this.triggerHorrorEvent('scene_horror_exit');
    }
    
    /**
     * 更新幽灵移动
     */
    private updateGhostMovement(deltaTime: number): void {
        if (!this.horrorMode) return;
        
        // 查找幽灵节点
        const ghost = this.findNodeByName('Ghost');
        if (!ghost) return;
        
        // 幽灵在场景中随机漂浮
        const t = this.horrorTimer;
        const x = Math.sin(t * 0.5) * 4;
        const y = 1.5 + Math.sin(t * 1.2) * 0.5;
        const z = Math.cos(t * 0.3) * 3;
        
        ghost.position = new Vec3(x, y, z);
        
        // 幽灵闪烁效果
        const alpha = 100 + Math.sin(t * 2) * 50;
        ghost.visible = alpha > 50;
    }
    
    /**
     * 更新随机恐怖事件
     */
    private updateRandomEvents(deltaTime: number): void {
        // 随机触发恐怖事件（根据理智值）
        const eventChance = (100 - this.sanityLevel) * 0.001 * deltaTime;
        
        if (Math.random() < eventChance) {
            this.triggerRandomEvent();
        }
    }
    
    /**
     * 触发随机恐怖事件
     */
    private triggerRandomEvent(): void {
        const events = [
            'light_flicker',      // 灯光闪烁
            'object_move',        // 物体移动
            'sound_whisper',      // 耳语声
            'screen_shake',       // 屏幕震动
            'blood_drip',         // 血滴效果
            'fog_appear',         // 雾气出现
            'clock_strike',       // 钟声响起
            'shadow_pass'         // 影子经过
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        console.log(`👻 触发恐怖事件: ${randomEvent}`);
        
        // 根据不同事件执行不同效果
        switch (randomEvent) {
            case 'light_flicker':
                this.triggerLightFlicker();
                break;
            case 'object_move':
                this.triggerObjectMovement();
                break;
            case 'sound_whisper':
                this.playSound('whisper');
                break;
            case 'screen_shake':
                this.triggerScreenShake();
                break;
            case 'blood_drip':
                this.showBloodDrip();
                break;
            case 'fog_appear':
                this.showFog();
                break;
            case 'clock_strike':
                this.playSound('clock_strike');
                break;
            case 'shadow_pass':
                this.showShadow();
                break;
        }
    }
    
    /**
     * 触发灯光闪烁事件
     */
    private triggerLightFlicker(): void {
        // 快速闪烁3次
        let flickerCount = 0;
        const flickerInterval = setInterval(() => {
            this.lights.forEach(light => {
                light.intensity = Math.random() > 0.5 ? light.intensity : 0;
            });
            
            flickerCount++;
            if (flickerCount >= 6) { // 3次闪烁
                clearInterval(flickerInterval);
                // 恢复原强度
                this.lights[0].intensity = 0.6;
                this.lights[1].intensity = 0.8;
            }
        }, 100);
    }
    
    /**
     * 触发物体移动事件
     */
    private triggerObjectMovement(): void {
        // 随机移动一个物体
        const objects = ['CoffeeCup', 'CoffeeBeanBag', 'Clock', 'Poster'];
        const randomObject = objects[Math.floor(Math.random() * objects.length)];
        const obj = this.findNodeByName(randomObject);
        
        if (obj) {
            const originalPos = obj.position.clone();
            
            // 随机偏移
            obj.position = new Vec3(
                originalPos.x + (Math.random() - 0.5) * 0.5,
                originalPos.y,
                originalPos.z + (Math.random() - 0.5) * 0.5
            );
            
            // 2秒后恢复
            setTimeout(() => {
                obj.position = originalPos;
            }, 2000);
        }
    }
    
    /**
     * 触发屏幕震动
     */
    private triggerScreenShake(): void {
        console.log('📱 屏幕震动！');
        // 这里应该调用游戏引擎的屏幕震动API
        // 对于微信小游戏，可以使用 wx.vibrateShort()
    }
    
    /**
     * 显示血滴效果
     */
    private showBloodDrip(): void {
        console.log('🩸 血滴效果');
        const bloodDrops = this.findNodeByName('BloodDrops');
        if (bloodDrops) {
            bloodDrops.visible = true;
            
            // 5秒后消失
            setTimeout(() => {
                bloodDrops.visible = false;
            }, 5000);
        }
    }
    
    /**
     * 显示雾气效果
     */
    private showFog(): void {
        console.log('🌫️ 雾气效果');
        const fog = this.findNodeByName('Fog');
        if (fog) {
            fog.visible = true;
            
            // 8秒后消失
            setTimeout(() => {
                fog.visible = false;
            }, 8000);
        }
    }
    
    /**
     * 显示影子效果
     */
    private showShadow(): void {
        console.log('👤 影子经过');
        // 创建临时影子节点
        const shadow = new Node3D('TemporaryShadow');
        shadow.position = new Vec3(5, 0, 0);
        shadow.material = 'horror';
        this.scene.addChild(shadow);
        
        // 让影子穿过场景
        const startTime = this.time;
        const shadowInterval = setInterval(() => {
            const elapsed = this.time - startTime;
            if (elapsed > 3) {
                clearInterval(shadowInterval);
                this.scene.children = this.scene.children.filter(child => child !== shadow);
                return;
            }
            
            // 影子从右向左移动
            shadow.position.x = 5 - (elapsed / 3) * 10;
        }, 16); // ~60 FPS
    }
    
    /**
     * 播放音效
     */
    private playSound(soundName: string): void {
        console.log(`🔊 播放音效: ${soundName}`);
        // 这里应该调用音频播放API
        // 对于微信小游戏，可以使用 wx.createInnerAudioContext()
    }
    
    /**
     * 触发恐怖事件
     */
    private triggerHorrorEvent(eventType: string): void {
        console.log(`🎭 触发恐怖事件: ${eventType}`);
        // 这里可以通知游戏管理器
    }
    
    /**
     * 设置理智值
     */
    public setSanityLevel(sanity: number): void {
        this.sanityLevel = Math.max(0, Math.min(100, sanity));
    }
    
    /**
     * 获取当前场景状态
     */
    public getSceneState(): {
        nodeCount: number;
        materialCount: number;
        lightCount: number;
        horrorMode: boolean;
        sanityLevel: number;
        time: number;
    } {
        return {
            nodeCount: this.countNodes(this.scene),
            materialCount: this.materials.size,
            lightCount: this.lights.length,
            horrorMode: this.horrorMode,
            sanityLevel: this.sanityLevel,
            time: this.time
        };
    }
    
    /**
     * 统计节点数量
     */
    private countNodes(node: Node3D): number {
        let count = 1; // 当前节点
        for (const child of node.children) {
            count += this.countNodes(child);
        }
        return count;
    }
    
    /**
     * 按名称查找节点
     */
    private findNodeByName(name: string, startNode: Node3D = this.scene): Node3D | null {
        if (startNode.name === name) {
            return startNode;
        }
        
        for (const child of startNode.children) {
            const found = this.findNodeByName(name, child);
            if (found) {
                return found;
            }
        }
        
        return null;
    }
    
    /**
     * 获取场景JSON表示（用于调试）
     */
    public toJSON(): any {
        return {
            scene: this.nodeToJSON(this.scene),
            materials: Array.from(this.materials.entries()).map(([name, mat]) => ({
                name: name,
                albedo: { r: mat.albedo.r, g: mat.albedo.g, b: mat.albedo.b, a: mat.albedo.a },
                metallic: mat.metallic,
                roughness: mat.roughness
            })),
            lights: this.lights.map(light => ({
                type: light.type,
                position: { x: light.position.x, y: light.position.y, z: light.position.z },
                color: { r: light.color.r, g: light.color.g, b: light.color.b },
                intensity: light.intensity,
                enabled: light.enabled
            })),
            state: this.getSceneState()
        };
    }
    
    /**
     * 节点转换为JSON
     */
    private nodeToJSON(node: Node3D): any {
        return {
            name: node.name,
            position: { x: node.position.x, y: node.position.y, z: node.position.z },
            scale: { x: node.scale.x, y: node.scale.y, z: node.scale.z },
            geometry: node.geometry,
            material: node.material,
            visible: node.visible,
            children: node.children.map(child => this.nodeToJSON(child))
        };
    }
}

// 导出场景类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MidnightCoffeeShop3D, Vec3, Color };
} else if (typeof window !== 'undefined') {
    // 浏览器环境
    (window as any).MidnightCoffeeShop3D = MidnightCoffeeShop3D;
    (window as any).Vec3 = Vec3;
    (window as any).Color = Color;
}

console.log('🎮 微恐咖啡厅3D场景类已准备好！');