import { _decorator, Component, Node, MeshRenderer, Material, Color, Vec3, Quat, director, math, geometry, physics, BoxCollider, RigidBody, SphereCollider, CapsuleCollider, Mesh, Box, Sphere, Capsule, Cylinder, Light, DirectionalLight, PointLight, SpotLight, Ambient, Fog, Skybox, renderer, game, sys, find } from 'cc';
import { GameManager } from '../GameManager';
import { SceneManager } from '../SceneManager';

const { ccclass, property } = _decorator;

/**
 * 午夜咖啡厅3D场景 - 主场景控制器
 * 负责所有3D模型的创建、材质管理、灯光系统和恐怖氛围特效
 */
@ccclass('ThreeDScene')
export class ThreeDScene extends Component {

    // 场景管理器引用
    private sceneManager: SceneManager = null!;
    
    // 游戏管理器引用
    private gameManager: GameManager = null!;
    
    // 所有3D模型的节点数组
    private sceneModels: Map<string, Node> = new Map();
    
    // 灯光系统
    private lights: Map<string, Light> = new Map();
    
    // 材质系统
    private materials: Map<string, Material> = new Map();
    
    // 恐怖模式状态
    private isHorrorMode: boolean = false;
    private horrorTimer: number = 0;
    private horrorIntensity: number = 0;
    
    // 场景尺寸（单位：米）
    private readonly SCENE_SIZE = {
        width: 12,
        height: 6,
        depth: 12
    };
    
    onLoad() {
        // 获取场景管理器
        this.sceneManager = find('SceneManager')?.getComponent(SceneManager) as SceneManager;
        if (!this.sceneManager) {
            console.error('SceneManager not found!');
            return;
        }
        
        // 获取游戏管理器
        this.gameManager = GameManager.getInstance();
        
        // 初始化场景
        this.initializeScene();
        
        // 开始游戏循环
        this.schedule(this.updateScene, 0.016); // ~60 FPS
    }
    
    /**
     * 初始化3D场景
     */
    private initializeScene() {
        console.log('初始化午夜咖啡厅3D场景...');
        
        // 1. 创建场景环境
        this.createEnvironment();
        
        // 2. 创建咖啡厅室内
        this.createCoffeeShopInterior();
        
        // 3. 创建灯光系统
        this.createLightingSystem();
        
        // 4. 创建恐怖氛围特效
        this.createHorrorEffects();
        
        // 5. 初始化材质系统
        this.initializeMaterials();
        
        console.log('3D场景初始化完成');
    }
    
    /**
     * 创建场景环境（地板、墙壁、天花板）
     */
    private createEnvironment() {
        // 创建地板
        const floor = this.createBox({
            name: 'Floor',
            position: new Vec3(0, -0.5, 0),
            size: new Vec3(this.SCENE_SIZE.width, 1, this.SCENE_SIZE.depth),
            color: new Color(60, 45, 30) // 深色木地板
        });
        
        // 创建墙壁
        const wallFront = this.createBox({
            name: 'Wall_Front',
            position: new Vec3(0, 2, this.SCENE_SIZE.depth/2 - 0.5),
            size: new Vec3(this.SCENE_SIZE.width, this.SCENE_SIZE.height, 1),
            color: new Color(120, 90, 60) // 浅色木板墙
        });
        
        const wallBack = this.createBox({
            name: 'Wall_Back',
            position: new Vec3(0, 2, -this.SCENE_SIZE.depth/2 + 0.5),
            size: new Vec3(this.SCENE_SIZE.width, this.SCENE_SIZE.height, 1),
            color: new Color(120, 90, 60)
        });
        
        const wallLeft = this.createBox({
            name: 'Wall_Left',
            position: new Vec3(-this.SCENE_SIZE.width/2 + 0.5, 2, 0),
            size: new Vec3(1, this.SCENE_SIZE.height, this.SCENE_SIZE.depth),
            color: new Color(120, 90, 60)
        });
        
        const wallRight = this.createBox({
            name: 'Wall_Right',
            position: new Vec3(this.SCENE_SIZE.width/2 - 0.5, 2, 0),
            size: new Vec3(1, this.SCENE_SIZE.height, this.SCENE_SIZE.depth),
            color: new Color(120, 90, 60)
        });
        
        // 创建天花板
        const ceiling = this.createBox({
            name: 'Ceiling',
            position: new Vec3(0, this.SCENE_SIZE.height - 0.5, 0),
            size: new Vec3(this.SCENE_SIZE.width, 1, this.SCENE_SIZE.depth),
            color: new Color(80, 60, 40) // 深色木质天花板
        });
        
        // 保存环境模型
        this.sceneModels.set('floor', floor);
        this.sceneModels.set('wallFront', wallFront);
        this.sceneModels.set('wallBack', wallBack);
        this.sceneModels.set('wallLeft', wallLeft);
        this.sceneModels.set('wallRight', wallRight);
        this.sceneModels.set('ceiling', ceiling);
    }
    
    /**
     * 创建咖啡厅室内装饰
     */
    private createCoffeeShopInterior() {
        // 创建吧台
        const counter = this.createBox({
            name: 'Counter',
            position: new Vec3(0, 0.75, -2),
            size: new Vec3(4, 1.5, 1),
            color: new Color(70, 50, 35) // 深色木质吧台
        });
        
        // 创建咖啡机
        const coffeeMachine = this.createBox({
            name: 'CoffeeMachine',
            position: new Vec3(0, 1.4, -2.2),
            size: new Vec3(0.8, 1.2, 0.8),
            color: new Color(180, 180, 190) // 金属色
        });
        
        // 创建咖啡杯
        const coffeeCup = this.createCylinder({
            name: 'CoffeeCup',
            position: new Vec3(1, 1.2, -2),
            radius: 0.1,
            height: 0.3,
            color: new Color(240, 240, 245) // 白色陶瓷
        });
        
        // 创建桌子
        const tables: Node[] = [];
        const tablePositions = [
            new Vec3(-3, 0.3, 1),
            new Vec3(0, 0.3, 2),
            new Vec3(3, 0.3, 1),
            new Vec3(-2, 0.3, -1),
            new Vec3(2, 0.3, -1)
        ];
        
        for (let i = 0; i < tablePositions.length; i++) {
            const table = this.createBox({
                name: `Table_${i + 1}`,
                position: tablePositions[i],
                size: new Vec3(0.8, 0.6, 0.8),
                color: new Color(180, 150, 120) // 浅色木质桌子
            });
            tables.push(table);
        }
        
        // 创建椅子
        const chairs: Node[] = [];
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
            const chair = this.createBox({
                name: `Chair_${i + 1}`,
                position: chairPositions[i],
                size: new Vec3(0.4, 0.8, 0.4),
                color: new Color(70, 50, 35) // 深色木质椅子
            });
            chairs.push(chair);
        }
        
        // 创建时钟
        const clock = this.createCylinder({
            name: 'Clock',
            position: new Vec3(-4, 2.5, -4),
            radius: 0.25,
            height: 0.1,
            color: new Color(200, 180, 100) // 金属边框
        });
        
        // 创建咖啡豆袋
        const coffeeBeanBag = this.createBox({
            name: 'CoffeeBeanBag',
            position: new Vec3(3.5, 0.5, -3),
            size: new Vec3(0.4, 0.5, 0.3),
            color: new Color(150, 100, 50) // 棕色布袋
        });
        
        // 创建海报
        const poster = this.createBox({
            name: 'Poster',
            position: new Vec3(-4, 2, 3),
            size: new Vec3(1.2, 1.6, 0.05),
            color: new Color(220, 200, 160) // 老旧纸张色
        });
        
        // 保存家具模型
        this.sceneModels.set('counter', counter);
        this.sceneModels.set('coffeeMachine', coffeeMachine);
        this.sceneModels.set('coffeeCup', coffeeCup);
        this.sceneModels.set('clock', clock);
        this.sceneModels.set('coffeeBeanBag', coffeeBeanBag);
        this.sceneModels.set('poster', poster);
        
        // 保存桌椅组
        for (let i = 0; i < tables.length; i++) {
            this.sceneModels.set(`table_${i}`, tables[i]);
        }
        for (let i = 0; i < chairs.length; i++) {
            this.sceneModels.set(`chair_${i}`, chairs[i]);
        }
    }
    
    /**
     * 创建灯光系统
     */
    private createLightingSystem() {
        // 创建主灯光（点光源，昏暗黄色）
        const mainLightNode = new Node('MainLight');
        const mainLight = mainLightNode.addComponent(PointLight);
        mainLight.color = new Color(255, 220, 180); // 暖黄色
        mainLight.intensity = 0.6;
        mainLight.range = 15;
        mainLightNode.setPosition(0, 3, -1);
        this.node.addChild(mainLightNode);
        this.lights.set('mainLight', mainLight);
        
        // 创建吧台灯光（聚光灯，暖白色）
        const counterLightNode = new Node('CounterLight');
        const counterLight = counterLightNode.addComponent(SpotLight);
        counterLight.color = new Color(255, 240, 220); // 暖白色
        counterLight.intensity = 0.8;
        counterLight.range = 8;
        counterLight.spotAngle = 60;
        counterLightNode.setPosition(0, 2.5, -2.8);
        counterLightNode.setRotationFromEuler(new Vec3(-30, 0, 0));
        this.node.addChild(counterLightNode);
        this.lights.set('counterLight', counterLight);
        
        // 创建环境光（低强度全局光照）
        const ambientLightNode = new Node('AmbientLight');
        const ambientLight = ambientLightNode.addComponent(Ambient);
        ambientLight.color = new Color(30, 25, 20);
        ambientLight.skyLightColor = new Color(20, 15, 10);
        ambientLight.skyLightIntensity = 0.1;
        this.node.addChild(ambientLightNode);
        
        // 创建红色警示灯（恐怖模式用）
        const redAlertLightNode = new Node('RedAlertLight');
        const redAlertLight = redAlertLightNode.addComponent(PointLight);
        redAlertLight.color = new Color(255, 50, 50); // 红色
        redAlertLight.intensity = 0.3;
        redAlertLight.range = 12;
        redAlertLightNode.setPosition(2, 2, -4);
        redAlertLight.enabled = false; // 默认关闭
        this.node.addChild(redAlertLightNode);
        this.lights.set('redAlertLight', redAlertLight);
        
        // 创建蓝色幽灵光
        const blueGhostLightNode = new Node('BlueGhostLight');
        const blueGhostLight = blueGhostLightNode.addComponent(PointLight);
        blueGhostLight.color = new Color(100, 150, 255); // 蓝色
        blueGhostLight.intensity = 0.2;
        blueGhostLight.range = 10;
        blueGhostLightNode.setPosition(-2, 1.5, -4);
        blueGhostLight.enabled = false; // 默认关闭
        this.node.addChild(blueGhostLightNode);
        this.lights.set('blueGhostLight', blueGhostLight);
        
        console.log('灯光系统创建完成');
    }
    
    /**
     * 创建恐怖氛围特效
     */
    private createHorrorEffects() {
        // 创建幽灵模型（使用球体作为基础）
        const ghostNode = new Node('Ghost');
        ghostNode.setPosition(-3, 1.5, 3);
        
        // 幽灵材质（需要在initializeMaterials中创建）
        const ghostRenderer = ghostNode.addComponent(MeshRenderer);
        ghostRenderer.mesh = this.createSphereMesh(0.4); // 半径0.4米
        ghostRenderer.enabled = false; // 默认隐藏
        
        this.node.addChild(ghostNode);
        this.sceneModels.set('ghost', ghostNode);
        
        // 创建屏幕特效节点（用于全局特效）
        const screenEffectsNode = new Node('ScreenEffects');
        this.node.addChild(screenEffectsNode);
        this.sceneModels.set('screenEffects', screenEffectsNode);
        
        console.log('恐怖氛围特效基础创建完成');
    }
    
    /**
     * 初始化材质系统
     */
    private initializeMaterials() {
        // 创建深色木质材质
        const woodDarkMat = new Material();
        woodDarkMat.initialize({
            effectName: 'builtin-standard',
            technique: 0,
            defines: {}
        });
        woodDarkMat.setProperty('albedo', new Color(70, 50, 35));
        woodDarkMat.setProperty('metallic', 0.2);
        woodDarkMat.setProperty('roughness', 0.8);
        this.materials.set('wood_dark', woodDarkMat);
        
        // 创建浅色木质材质
        const woodLightMat = new Material();
        woodLightMat.initialize({
            effectName: 'builtin-standard',
            technique: 0,
            defines: {}
        });
        woodLightMat.setProperty('albedo', new Color(180, 150, 120));
        woodLightMat.setProperty('metallic', 0.1);
        woodLightMat.setProperty('roughness', 0.7);
        this.materials.set('wood_light', woodLightMat);
        
        // 创建金属材质
        const metalMat = new Material();
        metalMat.initialize({
            effectName: 'builtin-standard',
            technique: 0,
            defines: {}
        });
        metalMat.setProperty('albedo', new Color(180, 180, 190));
        metalMat.setProperty('metallic', 0.9);
        metalMat.setProperty('roughness', 0.3);
        this.materials.set('metal', metalMat);
        
        // 创建陶瓷材质
        const porcelainMat = new Material();
        porcelainMat.initialize({
            effectName: 'builtin-standard',
            technique: 0,
            defines: {}
        });
        porcelainMat.setProperty('albedo', new Color(240, 240, 245));
        porcelainMat.setProperty('metallic', 0.05);
        porcelainMat.setProperty('roughness', 0.2);
        this.materials.set('porcelain', porcelainMat);
        
        // 创建布料材质
        const fabricMat = new Material();
        fabricMat.initialize({
            effectName: 'builtin-standard',
            technique: 0,
            defines: {}
        });
        fabricMat.setProperty('albedo', new Color(150, 100, 50));
        fabricMat.setProperty('metallic', 0.0);
        fabricMat.setProperty('roughness', 0.9);
        this.materials.set('fabric', fabricMat);
        
        // 创建纸张材质
        const paperMat = new Material();
        paperMat.initialize({
            effectName: 'builtin-standard',
            technique: 0,
            defines: {}
        });
        paperMat.setProperty('albedo', new Color(220, 200, 160));
        paperMat.setProperty('metallic', 0.0);
        paperMat.setProperty('roughness', 0.8);
        this.materials.set('paper', paperMat);
        
        // 创建幽灵材质（半透明）
        const ghostMat = new Material();
        ghostMat.initialize({
            effectName: 'builtin-standard',
            technique: 0,
            defines: {}
        });
        ghostMat.setProperty('albedo', new Color(150, 200, 255, 100)); // 带透明度的蓝色
        ghostMat.setProperty('metallic', 0.1);
        ghostMat.setProperty('roughness', 0.6);
        ghostMat.setProperty('alphaThreshold', 0.1);
        this.materials.set('ghost', ghostMat);
        
        // 应用材质到模型
        this.applyMaterialsToModels();
        
        console.log('材质系统初始化完成');
    }
    
    /**
     * 将材质应用到模型
     */
    private applyMaterialsToModels() {
        // 吧台、椅子使用深色木质
        this.applyMaterialToModel('counter', 'wood_dark');
        this.applyMaterialToModel('coffeeBeanBag', 'fabric');
        this.applyMaterialToModel('coffeeCup', 'porcelain');
        this.applyMaterialToModel('coffeeMachine', 'metal');
        this.applyMaterialToModel('clock', 'metal');
        this.applyMaterialToModel('poster', 'paper');
        
        // 幽灵使用半透明材质
        const ghost = this.sceneModels.get('ghost');
        if (ghost) {
            const renderer = ghost.getComponent(MeshRenderer);
            if (renderer) {
                renderer.material = this.materials.get('ghost');
            }
        }
        
        // 桌子使用浅色木质
        for (let i = 0; i < 5; i++) {
            const table = this.sceneModels.get(`table_${i}`);
            if (table) {
                const renderer = table.getComponent(MeshRenderer);
                if (renderer) {
                    renderer.material = this.materials.get('wood_light');
                }
            }
        }
        
        // 椅子使用深色木质
        for (let i = 0; i < 10; i++) {
            const chair = this.sceneModels.get(`chair_${i}`);
            if (chair) {
                const renderer = chair.getComponent(MeshRenderer);
                if (renderer) {
                    renderer.material = this.materials.get('wood_dark');
                }
            }
        }
    }
    
    /**
     * 创建方盒模型
     */
    private createBox(options: {
        name: string;
        position: Vec3;
        size: Vec3;
        color: Color;
    }): Node {
        const node = new Node(options.name);
        node.setPosition(options.position);
        
        const renderer = node.addComponent(MeshRenderer);
        renderer.mesh = this.createBoxMesh(options.size);
        
        // 添加碰撞器
        const collider = node.addComponent(BoxCollider);
        collider.size = options.size;
        collider.isTrigger = true;
        
        this.node.addChild(node);
        return node;
    }
    
    /**
     * 创建圆柱体模型
     */
    private createCylinder(options: {
        name: string;
        position: Vec3;
        radius: number;
        height: number;
        color: Color;
    }): Node {
        const node = new Node(options.name);
        node.setPosition(options.position);
        
        const renderer = node.addComponent(MeshRenderer);
        renderer.mesh = this.createCylinderMesh(options.radius, options.height);
        
        // 添加碰撞器
        const collider = node.addComponent(CylinderCollider);
        collider.radius = options.radius;
        collider.height = options.height;
        collider.isTrigger = true;
        
        this.node.addChild(node);
        return node;
    }
    
    /**
     * 创建球体网格
     */
    private createSphereMesh(radius: number): Mesh {
        const mesh = new Mesh();
        // 这里简化处理，实际应该使用Cocos内置的SpherePrimitive
        // 临时使用简单的球体表示
        return mesh;
    }
    
    /**
     * 创建立方体网格
     */
    private createBoxMesh(size: Vec3): Mesh {
        const mesh = new Mesh();
        // 这里简化处理，实际应该使用Cocos内置的BoxPrimitive
        // 临时使用简单的立方体表示
        return mesh;
    }
    
    /**
     * 创建圆柱体网格
     */
    private createCylinderMesh(radius: number, height: number): Mesh {
        const mesh = new Mesh();
        // 这里简化处理，实际应该使用Cocos内置的CylinderPrimitive
        // 临时使用简单的圆柱体表示
        return mesh;
    }
    
    /**
     * 应用材质到指定模型
     */
    private applyMaterialToModel(modelKey: string, materialKey: string): void {
        const model = this.sceneModels.get(modelKey);
        const material = this.materials.get(materialKey);
        
        if (model && material) {
            const renderer = model.getComponent(MeshRenderer);
            if (renderer) {
                renderer.material = material;
            }
        }
    }
    
    /**
     * 更新场景逻辑
     */
    private updateScene(dt: number) {
        // 根据理智值调整恐怖强度
        const sanity = this.gameManager.getSanity();
        this.horrorIntensity = math.clamp01((100 - sanity) / 100);
        
        // 更新恐怖模式状态
        this.updateHorrorMode(dt);
        
        // 更新灯光效果
        this.updateLightingEffects(dt);
        
        // 更新幽灵移动
        this.updateGhostMovement(dt);
        
        // 更新恐怖事件
        this.updateHorrorEvents(dt);
    }
    
    /**
     * 更新恐怖模式
     */
    private updateHorrorMode(dt: number) {
        // 当理智值低于40时，随机进入恐怖模式
        const sanity = this.gameManager.getSanity();
        if (sanity < 40 && !this.isHorrorMode && Math.random() < 0.01) {
            this.enterHorrorMode();
        }
        
        if (this.isHorrorMode) {
            this.horrorTimer += dt;
            
            // 恐怖模式持续10-20秒
            if (this.horrorTimer > 10 + Math.random() * 10) {
                this.exitHorrorMode();
            }
        }
    }
    
    /**
     * 进入恐怖模式
     */
    private enterHorrorMode() {
        console.log('进入恐怖模式！');
        this.isHorrorMode = true;
        this.horrorTimer = 0;
        
        // 启用恐怖灯光
        const redLight = this.lights.get('redAlertLight');
        const blueLight = this.lights.get('blueGhostLight');
        if (redLight) redLight.enabled = true;
        if (blueLight) blueLight.enabled = true;
        
        // 显示幽灵
        const ghost = this.sceneModels.get('ghost');
        if (ghost) {
            const renderer = ghost.getComponent(MeshRenderer);
            if (renderer) {
                renderer.enabled = true;
            }
        }
        
        // 通知游戏管理器
        this.gameManager.triggerHorrorEvent('scene_horror_enter');
    }
    
    /**
     * 退出恐怖模式
     */
    private exitHorrorMode() {
        console.log('退出恐怖模式');
        this.isHorrorMode = false;
        
        // 禁用恐怖灯光
        const redLight = this.lights.get('redAlertLight');
        const blueLight = this.lights.get('blueGhostLight');
        if (redLight) redLight.enabled = false;
        if (blueLight) blueLight.enabled = false;
        
        // 隐藏幽灵
        const ghost = this.sceneModels.get('ghost');
        if (ghost) {
            const renderer = ghost.getComponent(MeshRenderer);
            if (renderer) {
                renderer.enabled = false;
            }
        }
        
        // 通知游戏管理器
        this.gameManager.triggerHorrorEvent('scene_horror_exit');
    }
    
    /**
     * 更新灯光效果
     */
    private updateLightingEffects(dt: number) {
        // 主灯光根据恐怖强度闪烁
        const mainLight = this.lights.get('mainLight');
        if (mainLight) {
            const baseIntensity = 0.6;
            const horrorEffect = Math.sin(this.horrorTimer * 10) * this.horrorIntensity * 0.3;
            mainLight.intensity = baseIntensity - horrorEffect;
            
            // 恐怖模式下灯光变红
            if (this.isHorrorMode) {
                const redMix = math.clamp01(this.horrorTimer / 5);
                mainLight.color = Color.lerp(
                    new Color(255, 220, 180),
                    new Color(255, 100, 100),
                    redMix
                );
            }
        }
        
        // 吧台灯光闪烁
        const counterLight = this.lights.get('counterLight');
        if (counterLight) {
            const flicker = Math.random() * 0.1 * this.horrorIntensity;
            counterLight.intensity = 0.8 - flicker;
        }
    }
    
    /**
     * 更新幽灵移动
     */
    private updateGhostMovement(dt: number) {
        if (!this.isHorrorMode) return;
        
        const ghost = this.sceneModels.get('ghost');
        if (!ghost) return;
        
        // 幽灵在场景中随机漂浮
        const time = this.horrorTimer;
        const x = Math.sin(time * 0.5) * 4;
        const y = 1.5 + Math.sin(time * 1.2) * 0.5;
        const z = Math.cos(time * 0.3) * 3;
        
        ghost.setPosition(new Vec3(x, y, z));
        
        // 幽灵透明度变化
        const ghostRenderer = ghost.getComponent(MeshRenderer);
        if (ghostRenderer && ghostRenderer.material) {
            const alpha = 100 + Math.sin(time * 2) * 50;
            const color = new Color(150, 200, 255, alpha);
            ghostRenderer.material.setProperty('albedo', color);
        }
    }
    
    /**
     * 更新恐怖事件
     */
    private updateHorrorEvents(dt: number) {
        // 随机触发恐怖事件（根据理智值）
        const sanity = this.gameManager.getSanity();
        const eventChance = (100 - sanity) * 0.001 * dt;
        
        if (Math.random() < eventChance) {
            this.triggerRandomHorrorEvent();
        }
    }
    
    /**
     * 触发随机恐怖事件
     */
    private triggerRandomHorrorEvent() {
        const events = [
            'light_flicker',
            'object_move',
            'sound_whisper',
            'screen_shake'
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        console.log(`触发恐怖事件: ${randomEvent}`);
        
        // 通知游戏管理器
        this.gameManager.triggerHorrorEvent(randomEvent);
    }
    
    /**
     * 获取场景中所有可交互物体
     */
    public getInteractableObjects(): Node[] {
        const interactables: Node[] = [];
        
        // 咖啡机是可交互的
        const coffeeMachine = this.sceneModels.get('coffeeMachine');
        if (coffeeMachine) interactables.push(coffeeMachine);
        
        // 咖啡杯是可交互的
        const coffeeCup = this.sceneModels.get('coffeeCup');
        if (coffeeCup) interactables.push(coffeeCup);
        
        // 咖啡豆袋是可交互的
        const coffeeBeanBag = this.sceneModels.get('coffeeBeanBag');
        if (coffeeBeanBag) interactables.push(coffeeBeanBag);
        
        return interactables;
    }
    
    /**
     * 销毁场景
     */
    onDestroy() {
        // 清理所有模型
        this.sceneModels.clear();
        this.lights.clear();
        this.materials.clear();
        
        console.log('3D场景已销毁');
    }
}

// 临时定义缺少的类型
class CylinderCollider extends Component {
    radius: number = 0;
    height: number = 0;
    isTrigger: boolean = false;
}