// 微恐咖啡厅 - 3D场景管理器
// Cocos Creator 3D场景管理
// 创建时间: 2026年3月4日

import { _decorator, Component, Node, director, Scene, Prefab, instantiate, MeshRenderer, Material, Color, Vec3, Quat, tween } from 'cc';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

// 场景物体类型
enum SceneObjectType {
    COUNTER = 'counter',
    COFFEE_MACHINE = 'coffee_machine',
    TABLE = 'table',
    CHAIR = 'chair',
    GHOST = 'ghost',
    LIGHT = 'light',
    DECORATION = 'decoration'
}

// 3D物体配置接口
interface SceneObjectConfig {
    type: SceneObjectType;
    position: Vec3;
    rotation?: Vec3;
    scale?: Vec3;
    prefabPath?: string;
    material?: string;
    interactive?: boolean;
}

// 灯光配置
interface LightConfig {
    type: 'point' | 'directional' | 'spot';
    position: Vec3;
    color: Color;
    intensity: number;
    range?: number;
    castShadow?: boolean;
}

@ccclass('SceneManager')
export class SceneManager extends Component {
    
    // 单例实例
    private static _instance: SceneManager = null;
    public static get instance(): SceneManager {
        return SceneManager._instance;
    }
    
    // 场景物体节点池
    private _sceneObjects: Map<string, Node> = new Map();
    private _ghosts: Node[] = [];
    
    // 灯光系统
    private _lights: Node[] = [];
    private _mainLight: Node = null;
    
    // 恐怖氛围特效
    private _horrorEffects: Node[] = [];
    private _isHorrorMode: boolean = false;
    
    // 预置资源
    @property(Prefab)
    private counterPrefab: Prefab = null;
    
    @property(Prefab)
    private coffeeMachinePrefab: Prefab = null;
    
    @property(Prefab)
    private tablePrefab: Prefab = null;
    
    @property(Prefab)
    private chairPrefab: Prefab = null;
    
    @property(Prefab)
    private ghostPrefab: Prefab = null;
    
    @property(Material)
    private defaultMaterial: Material = null;
    
    @property(Material)
    private horrorMaterial: Material = null;
    
    @property(Material)
    private ghostMaterial: Material = null;
    
    // 场景根节点
    @property(Node)
    private sceneRoot: Node = null;
    
    @property(Node)
    private objectsRoot: Node = null;
    
    @property(Node)
    private lightsRoot: Node = null;
    
    @property(Node)
    private effectsRoot: Node = null;
    
    onLoad() {
        // 设置单例
        if (SceneManager._instance === null) {
            SceneManager._instance = this;
        } else {
            this.node.destroy();
            return;
        }
        
        console.log('SceneManager初始化');
    }
    
    start() {
        // 初始化场景
        this.initializeScene();
        
        // 注册事件监听
        this.registerEvents();
    }
    
    // 初始化场景
    private initializeScene() {
        console.log('初始化微恐咖啡厅3D场景');
        
        // 创建基础场景结构
        this.createSceneStructure();
        
        // 创建咖啡厅物体
        this.createCoffeeShopObjects();
        
        // 设置灯光系统
        this.setupLighting();
        
        // 初始化恐怖氛围
        this.initializeHorrorAtmosphere();
        
        console.log('3D场景初始化完成');
    }
    
    // 创建场景结构
    private createSceneStructure() {
        if (!this.sceneRoot) {
            this.sceneRoot = new Node('SceneRoot');
            this.node.addChild(this.sceneRoot);
        }
        
        // 创建物体根节点
        if (!this.objectsRoot) {
            this.objectsRoot = new Node('ObjectsRoot');
            this.sceneRoot.addChild(this.objectsRoot);
        }
        
        // 创建灯光根节点
        if (!this.lightsRoot) {
            this.lightsRoot = new Node('LightsRoot');
            this.sceneRoot.addChild(this.lightsRoot);
        }
        
        // 创建特效根节点
        if (!this.effectsRoot) {
            this.effectsRoot = new Node('EffectsRoot');
            this.sceneRoot.addChild(this.effectsRoot);
        }
    }
    
    // 创建咖啡厅物体
    private createCoffeeShopObjects() {
        console.log('创建咖啡厅物体');
        
        // 吧台
        this.createCounter();
        
        // 咖啡机
        this.createCoffeeMachine();
        
        // 桌子
        this.createTables();
        
        // 椅子
        this.createChairs();
        
        // 装饰物
        this.createDecorations();
    }
    
    // 创建吧台
    private createCounter() {
        let counter: Node;
        
        if (this.counterPrefab) {
            counter = instantiate(this.counterPrefab);
        } else {
            counter = this.createPrimitiveObject('Counter', SceneObjectType.COUNTER);
        }
        
        counter.setPosition(new Vec3(0, 0, -3));
        counter.setScale(new Vec3(4, 1.5, 1));
        
        this.objectsRoot.addChild(counter);
        this._sceneObjects.set('counter', counter);
        
        // 设置材质
        this.applyMaterial(counter, 'wood_dark');
    }
    
    // 创建咖啡机
    private createCoffeeMachine() {
        let coffeeMachine: Node;
        
        if (this.coffeeMachinePrefab) {
            coffeeMachine = instantiate(this.coffeeMachinePrefab);
        } else {
            coffeeMachine = this.createPrimitiveObject('CoffeeMachine', SceneObjectType.COFFEE_MACHINE);
        }
        
        coffeeMachine.setPosition(new Vec3(1.5, 1, -2.5));
        coffeeMachine.setScale(new Vec3(0.8, 1.2, 0.8));
        
        this.objectsRoot.addChild(coffeeMachine);
        this._sceneObjects.set('coffee_machine', coffeeMachine);
        
        // 设置材质
        this.applyMaterial(coffeeMachine, 'metal');
        
        // 添加交互组件
        this.addInteractionComponent(coffeeMachine, 'coffee_machine');
    }
    
    // 创建桌子
    private createTables() {
        const tablePositions = [
            new Vec3(-3, 0, 1),
            new Vec3(0, 0, 1),
            new Vec3(3, 0, 1),
            new Vec3(-1.5, 0, 3),
            new Vec3(1.5, 0, 3)
        ];
        
        tablePositions.forEach((position, index) => {
            let table: Node;
            
            if (this.tablePrefab) {
                table = instantiate(this.tablePrefab);
            } else {
                table = this.createPrimitiveObject(`Table_${index}`, SceneObjectType.TABLE);
            }
            
            table.setPosition(position);
            table.setScale(new Vec3(0.8, 0.6, 0.8));
            
            this.objectsRoot.addChild(table);
            this._sceneObjects.set(`table_${index}`, table);
            
            // 设置材质
            this.applyMaterial(table, 'wood_light');
        });
    }
    
    // 创建椅子
    private createChairs() {
        const chairPositions = [
            new Vec3(-3.5, 0, 0.5),
            new Vec3(0.5, 0, 0.5),
            new Vec3(3.5, 0, 0.5),
            new Vec3(-2, 0, 2.5),
            new Vec3(2, 0, 2.5)
        ];
        
        chairPositions.forEach((position, index) => {
            let chair: Node;
            
            if (this.chairPrefab) {
                chair = instantiate(this.chairPrefab);
            } else {
                chair = this.createPrimitiveObject(`Chair_${index}`, SceneObjectType.CHAIR);
            }
            
            chair.setPosition(position);
            chair.setScale(new Vec3(0.4, 0.8, 0.4));
            
            this.objectsRoot.addChild(chair);
            this._sceneObjects.set(`chair_${index}`, chair);
            
            // 设置材质
            this.applyMaterial(chair, 'wood_dark');
        });
    }
    
    // 创建装饰物
    private createDecorations() {
        // 咖啡杯
        this.createCoffeeCup(new Vec3(1.7, 1.2, -2.3));
        
        // 咖啡豆袋
        this.createCoffeeBeanBag(new Vec3(-1, 1, -2.5));
        
        // 时钟
        this.createClock(new Vec3(-2, 2.5, -4));
        
        // 海报
        this.createPoster(new Vec3(0, 2, -4.9));
    }
    
    // 创建咖啡杯
    private createCoffeeCup(position: Vec3) {
        const cup = new Node('CoffeeCup');
        cup.setPosition(position);
        cup.setScale(new Vec3(0.2, 0.3, 0.2));
        
        this.objectsRoot.addChild(cup);
        this._sceneObjects.set('coffee_cup', cup);
        
        // 设置材质
        this.applyMaterial(cup, 'porcelain');
    }
    
    // 创建咖啡豆袋
    private createCoffeeBeanBag(position: Vec3) {
        const bag = new Node('CoffeeBeanBag');
        bag.setPosition(position);
        bag.setScale(new Vec3(0.4, 0.5, 0.3));
        
        this.objectsRoot.addChild(bag);
        this._sceneObjects.set('coffee_bean_bag', bag);
        
        // 设置材质
        this.applyMaterial(bag, 'fabric');
    }
    
    // 创建时钟
    private createClock(position: Vec3) {
        const clock = new Node('Clock');
        clock.setPosition(position);
        clock.setScale(new Vec3(0.5, 0.5, 0.1));
        
        this.objectsRoot.addChild(clock);
        this._sceneObjects.set('clock', clock);
        
        // 设置材质
        this.applyMaterial(clock, 'metal');
    }
    
    // 创建海报
    private createPoster(position: Vec3) {
        const poster = new Node('Poster');
        poster.setPosition(position);
        poster.setScale(new Vec3(1.2, 1.6, 0.05));
        
        this.objectsRoot.addChild(poster);
        this._sceneObjects.set('poster', poster);
        
        // 设置材质
        this.applyMaterial(poster, 'paper');
    }
    
    // 创建原始物体（在没有预置资源时使用）
    private createPrimitiveObject(name: string, type: SceneObjectType): Node {
        const node = new Node(name);
        
        // 这里可以根据类型创建不同的几何体
        // 实际项目中应该使用导入的模型
        
        return node;
    }
    
    // 应用材质
    private applyMaterial(node: Node, materialType: string) {
        const renderer = node.getComponent(MeshRenderer);
        if (!renderer) return;
        
        let material: Material = null;
        
        switch (materialType) {
            case 'wood_dark':
                material = this.createMaterial(new Color(74, 44, 42)); // #4a2c2a
                break;
            case 'wood_light':
                material = this.createMaterial(new Color(139, 90, 43)); // #8b5a2b
                break;
            case 'metal':
                material = this.createMaterial(new Color(150, 150, 150)); // #969696
                break;
            case 'porcelain':
                material = this.createMaterial(new Color(255, 255, 255)); // #ffffff
                break;
            case 'fabric':
                material = this.createMaterial(new Color(160, 120, 80)); // #a07850
                break;
            case 'paper':
                material = this.createMaterial(new Color(240, 230, 210)); // #f0e6d2
                break;
            default:
                material = this.defaultMaterial;
        }
        
        if (material) {
            renderer.material = material;
        }
    }
    
    // 创建材质
    private createMaterial(color: Color): Material {
        // 这里应该创建实际的材质实例
        // 简化实现，返回默认材质
        return this.defaultMaterial;
    }
    
    // 添加交互组件
    private addInteractionComponent(node: Node, interactionType: string) {
        // 这里可以添加触摸交互组件
        console.log(`为${node.name}添加${interactionType}交互组件`);
    }
    
    // ==================== 灯光系统 ====================
    
    // 设置灯光
    private setupLighting() {
        console.log('设置场景灯光');
        
        // 主灯光（午夜昏暗灯光）
        this.createMainLight();
        
        // 吧台灯光
        this.createCounterLight();
        
        // 环境光
        this.createAmbientLight();
        
        // 恐怖氛围灯光
        this.createHorrorLights();
    }
    
    // 创建主灯光
    private createMainLight() {
        // 创建点光源作为主灯
        const mainLight = new Node('MainLight');
        mainLight.setPosition(new Vec3(0, 3, -1));
        
        this.lightsRoot.addChild(mainLight);
        this._mainLight = mainLight;
        this._lights.push(mainLight);
        
        // 这里应该添加Light组件并设置参数
        console.log('创建主灯光');
    }
    
    // 创建吧台灯光
    private createCounterLight() {
        const counterLight = new Node('CounterLight');
        counterLight.setPosition(new Vec3(0, 2.5, -2.8));
        
        this.lightsRoot.addChild(counterLight);
        this._lights.push(counterLight);
        
        console.log('创建吧台灯光');
    }
    
    // 创建环境光
    private createAmbientLight() {
        const ambientLight = new Node('AmbientLight');
        
        this.lightsRoot.addChild(ambientLight);
        this._lights.push(ambientLight);
        
        console.log('创建环境光');
    }
    
    // 创建恐怖氛围灯光
    private createHorrorLights() {
        // 红色警示灯
        const warningLight = new Node('WarningLight');
        warningLight.setPosition(new Vec3(2, 2, -4));
        
        this.lightsRoot.addChild(warningLight);
        this._lights.push(warningLight);
        
        // 蓝色幽灵光
        const ghostLight = new Node('GhostLight');
        ghostLight.setPosition(new Vec3(-2, 1.5, -4));
        
        this.lightsRoot.addChild(ghostLight);
        this._lights.push(ghostLight);
        
        console.log('创建恐怖氛围灯光');
    }
    
    // 切换灯光模式
    public toggleLights() {
        console.log('切换灯光模式');
        
        // 发送灯光切换事件
        director.emit('lights-toggled');
        
        // 这里可以实现具体的灯光切换逻辑
    }
    
    // 闪烁灯光（恐怖效果）
    public flickerLights(duration: number = 1000) {
        console.log('灯光闪烁效果');
        
        // 实现灯光闪烁动画
        // 这里可以使用tween或动画系统
        
        director.emit('lights-flicker', duration);
    }
    
    // ==================== 恐怖氛围系统 ====================
    
    // 初始化恐怖氛围
    private initializeHorrorAtmosphere() {
        console.log('初始化恐怖氛围');
        
        // 创建初始幽灵
        this.spawnGhosts(2);
        
        // 设置恐怖特效
        this.setupHorrorEffects();
    }
    
    // 生成幽灵
    public spawnGhosts(count: number = 1) {
        for (let i = 0; i < count; i++) {
            let ghost: Node;
            
            if (this.ghostPrefab) {
                ghost = instantiate(this.ghostPrefab);
            } else {
                ghost = new Node(`Ghost_${this._ghosts.length}`);
                ghost.setScale(new Vec3(0.5, 0.5, 0.5));
            }
            
            // 随机位置
            const x = -4 + Math.random() * 8;
            const y = 1 + Math.random() * 2;
            const z = -3 + Math.random() * 6;
            ghost.setPosition(new Vec3(x, y, z));
            
            this.objectsRoot.addChild(ghost);
            this._ghosts.push(ghost);
            
            // 设置幽灵材质
            this.applyGhostMaterial(ghost);
            
            // 添加幽灵移动行为
            this.addGhostBehavior(ghost);
        }
        
        console.log(`生成${count}个幽灵`);
    }
    
    // 应用幽灵材质
    private applyGhostMaterial(ghost: Node) {
        const renderer = ghost.getComponent(MeshRenderer);
        if (renderer && this.ghostMaterial) {
            renderer.material = this.ghostMaterial;
        }
    }
    
    // 添加幽灵行为
    private addGhostBehavior(ghost: Node) {
        // 随机移动
        this.startGhostMovement(ghost);
        
        // 透明度变化（呼吸效果）
        this.startGhostBreathing(ghost);
    }
    
    // 幽灵移动
    private startGhostMovement(ghost: Node) {
        const speed = 0.5 + Math.random() * 1;
        const direction = new Vec3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        
        // 使用tween实现移动
        // 这里简化处理
    }
    
    // 幽灵呼吸效果
    private startGhostBreathing(ghost: Node) {
        // 实现透明度变化
        // 这里简化处理
    }
    
    // 设置恐怖特效
    private setupHorrorEffects() {
        // 创建血滴效果
        this.createBloodDripEffect();
        
        // 创建雾气效果
        this.createFogEffect();
        
        // 创建闪烁特效
        this.createFlickerEffect();
    }
    
    // 创建血滴效果
    private createBloodDripEffect() {
        const bloodDrip = new Node('BloodDrip');
        this.effectsRoot.addChild(bloodDrip);
        this._horrorEffects.push(bloodDrip);
    }
    
    // 创建雾气效果
    private createFogEffect() {
        const fog = new Node('Fog');
        this.effectsRoot.addChild(fog);
        this._horrorEffects.push(fog);
    }
    
    // 创建闪烁特效
    private createFlickerEffect() {
        const flicker = new Node('FlickerEffect');
        this.effectsRoot.addChild(flicker);
        this._horrorEffects.push(flicker);
    }
    
    // 触发恐怖事件
    public triggerHorrorEvent(eventType: string) {
        console.log(`触发恐怖事件: ${eventType}`);
        
        switch (eventType) {
            case 'ghostAppear':
                this.playGhostAppearEffect();
                break;
            case 'lightFlicker':
                this.flickerLights(500);
                break;
            case 'cupMove':
                this.playCupMoveEffect();
                break;
            case 'temperatureDrop':
                this.playTemperatureDropEffect();
                break;
            case 'whisperSound':
                this.playWhisperEffect();
                break;
        }
        
        // 进入恐怖模式
        this.enterHorrorMode();
        
        // 发送事件
        director.emit('horror-event-triggered', eventType);
    }
    
    // 播放幽灵出现特效
    private playGhostAppearEffect() {
        // 生成新幽灵
        this.spawnGhosts(1);
        
        // 幽灵闪现动画
        console.log('幽灵闪现特效');
    }
    
    // 播放咖啡杯移动特效
    private playCupMoveEffect() {
        const cup = this._sceneObjects.get('coffee_cup');
        if (cup) {
            // 移动动画
            console.log('咖啡杯移动特效');
        }
    }
    
    // 播放温度下降特效
    private playTemperatureDropEffect() {
        // 屏幕变蓝/雾气效果
        console.log('温度下降特效');
    }
    
    // 播放低语特效
    private playWhisperEffect() {
        // 屏幕震动/模糊效果
        console.log('低语特效');
    }
    
    // 进入恐怖模式
    private enterHorrorMode() {
        this._isHorrorMode = true;
        
        // 切换材质到恐怖版本
        this.switchToHorrorMaterials();
        
        // 增加更多幽灵
        this.spawnGhosts(1);
        
        // 10秒后退出恐怖模式
        setTimeout(() => {
            this.exitHorrorMode();
        }, 10000);
    }
    
    // 退出恐怖模式
    private exitHorrorMode() {
        this._isHorrorMode = false;
        
        // 恢复普通材质
        this.switchToNormalMaterials();
        
        console.log('退出恐怖模式');
    }
    
    // 切换到恐怖材质
    private switchToHorrorMaterials() {
        // 这里应该将场景材质切换到恐怖版本
        console.log('切换到恐怖材质');
    }
    
    // 切换到普通材质
    private switchToNormalMaterials() {
        // 恢复普通材质
        console.log('恢复普通材质');
    }
    
    // ==================== 交互系统 ====================
    
    // 咖啡制作动画
    public playBrewingAnimation() {
        console.log('播放咖啡制作动画');
        
        const coffeeMachine = this._sceneObjects.get('coffee_machine');
        if (coffeeMachine) {
            // 缩放动画
            tween(coffeeMachine)
                .to(0.2, { scale: new Vec3(0.9, 1.1, 0.9) })
                .to(0.2, { scale: new Vec3(0.8, 1.2, 0.8) })
                .to(0.2, { scale: new Vec3(0.85, 1.15, 0.85) })
                .to(0.2, { scale: new Vec3(0.8, 1.2, 0.8) })
                .to(0.2, { scale: new Vec3(1, 1, 1) })
                .start();
        }
        
        // 咖啡杯出现
        this.showCoffeeCup();
        
        director.emit('brewing-animation-started');
    }
    
    // 显示咖啡杯
    private showCoffeeCup() {
        const cup = this._sceneObjects.get('coffee_cup');
        if (cup) {
            cup.active = true;
            
            // 漂浮动画
            tween(cup)
                .to(0.5, { position: new Vec3(1.7, 1.5, -2.3) })
                .to(0.5, { position: new Vec3(1.7, 1.2, -2.3) })
                .start();
        }
    }
    
    // 清洁吧台动画
    public playCleaningAnimation() {
        console.log('播放清洁动画');
        
        // 这里可以实现清洁动画
        director.emit('cleaning-animation-started');
    }
    
    // ==================== 事件系统 ====================
    
    // 注册事件监听
    private registerEvents() {
        // 监听游戏事件
        director.on('game-sanity-changed', this.onSanityChanged, this);
        director.on('game-horror-event', this.onHorrorEvent, this);
        director.on('game-brew-coffee', this.onBrewCoffee, this);
        director.on('game-clean-counter', this.onCleanCounter, this);
        
        // 监听场景事件
        director.on('scene-toggle-lights', this.onToggleLights, this);
        director.on('scene-spawn-ghost', this.onSpawnGhost, this);
    }
    
    // 理智值变化处理
    private onSanityChanged(sanity: number) {
        console.log(`理智值变化: ${sanity}`);
        
        // 根据理智值调整场景氛围
        this.adjustAtmosphereBySanity(sanity);
    }
    
    // 恐怖事件处理
    private onHorrorEvent(eventType: string) {
        this.triggerHorrorEvent(eventType);
    }
    
    // 制作咖啡处理
    private onBrewCoffee() {
        this.playBrewingAnimation();
    }
    
    // 清洁吧台处理
    private onCleanCounter() {
        this.playCleaningAnimation();
    }
    
    // 切换灯光处理
    private onToggleLights() {
        this.toggleLights();
    }
    
    // 生成幽灵处理
    private onSpawnGhost() {
        this.spawnGhosts(1);
    }
    
    // 根据理智值调整氛围
    private adjustAtmosphereBySanity(sanity: number) {
        // 理智值越低，恐怖氛围越强
        if (sanity < 30 && !this._isHorrorMode) {
            this.enterHorrorMode();
        } else if (sanity > 70 && this._isHorrorMode) {
            this.exitHorrorMode();
        }
    }
    
    // ==================== 清理 ====================
    
    onDestroy() {
        // 移除事件监听
        director.off('game-sanity-changed', this.onSanityChanged, this);
        director.off('game-horror-event', this.onHorrorEvent, this);
        director.off('game-brew-coffee', this.onBrewCoffee, this);
        director.off('game-clean-counter', this.onCleanCounter, this);
        director.off('scene-toggle-lights', this.onToggleLights, this);
        director.off('scene-spawn-ghost', this.onSpawnGhost, this);
        
        // 清理场景物体
        this.cleanupScene();
        
        console.log('SceneManager销毁');
    }
    
    // 清理场景
    private cleanupScene() {
        this._sceneObjects.clear();
        this._ghosts = [];
        this._lights = [];
        this._horrorEffects = [];
    }
}

console.log('SceneManager类定义完成');