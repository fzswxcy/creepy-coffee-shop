import { _decorator, Component, Node, Sprite, ProgressBar, Button, tween, Vec3, color, Color, SpriteFrame } from 'cc';
import { EventManager } from '../core/EventManager';

const { ccclass, property } = _decorator;

/**
 * 咖啡机组件
 * 负责咖啡生产逻辑、点击交互、进度显示
 */
@ccclass('CoffeeMachine')
export class CoffeeMachine extends Component {
    
    @property(Sprite)
    machineSprite: Sprite = null;  // 咖啡机精灵
    
    @property(ProgressBar)
    progressBar: ProgressBar = null;  // 生产进度条
    
    @property(Button)
    produceButton: Button = null;  // 生产按钮
    
    @property(Node)
    coffeeOutput: Node = null;  // 咖啡产出位置
    
    @property(Sprite)
    statusLight: Sprite = null;  // 状态指示灯
    
    @property({ type: SpriteFrame })
    normalSprite: SpriteFrame = null;  // 正常状态精灵
    
    @property({ type: SpriteFrame })
    workingSprite: SpriteFrame = null;  // 工作中状态精灵
    
    @property({ type: SpriteFrame })
    brokenSprite: SpriteFrame = null;  // 损坏状态精灵
    
    @property({ type: SpriteFrame })
    idleLightSprite: SpriteFrame = null;  // 空闲指示灯
    
    @property({ type: SpriteFrame })
    workingLightSprite: SpriteFrame = null;  // 工作中指示灯
    
    @property({ type: SpriteFrame })
    brokenLightSprite: SpriteFrame = null;  // 损坏指示灯
    
    // 生产参数
    @property
    productionTime: number = 3.0;  // 生产时间（秒）
    
    @property
    coffeeType: string = 'espresso';  // 咖啡类型
    
    @property
    coffeeValue: number = 10;  // 咖啡价值（金币）
    
    @property
    machineLevel: number = 1;  // 机器等级
    
    @property
    maxLevel: number = 5;  // 最大等级
    
    @property
    upgradeCostBase: number = 100;  // 升级基础费用
    
    private _isProducing: boolean = false;
    private _currentProgress: number = 0;
    private _isBroken: boolean = false;
    private _breakChance: number = 0.05;  // 损坏概率（5%）
    private _breakCooldown: number = 30;  // 损坏冷却时间（秒）
    private _breakTimer: number = 0;
    private _repairCost: number = 50;  // 维修费用
    
    onLoad() {
        this.initMachine();
        this.setupButtonEvents();
    }
    
    /**
     * 初始化咖啡机
     */
    private initMachine() {
        this.updateMachineVisual();
        this.updateStatusLight();
        this.progressBar.progress = 0;
        
        // 重置状态
        this._isProducing = false;
        this._isBroken = false;
        this._breakTimer = 0;
    }
    
    /**
     * 设置按钮事件
     */
    private setupButtonEvents() {
        if (this.produceButton) {
            this.produceButton.node.on('click', this.onProduceClick, this);
        }
    }
    
    /**
     * 生产按钮点击事件
     */
    private onProduceClick() {
        if (this._isBroken) {
            this.showRepairPrompt();
            return;
        }
        
        if (!this._isProducing) {
            this.startProduction();
        }
    }
    
    /**
     * 开始生产咖啡
     */
    public startProduction() {
        if (this._isProducing || this._isBroken) return;
        
        this._isProducing = true;
        this._currentProgress = 0;
        this.updateMachineVisual();
        this.updateStatusLight();
        
        // 更新按钮状态
        if (this.produceButton) {
            this.produceButton.interactable = false;
        }
        
        // 生产动画
        this.animateProduction();
        
        // 发送生产开始事件
        EventManager.instance.emit(EventManager.Events.COFFEE_PRODUCED, {
            type: this.coffeeType,
            machineId: this.node.uuid,
            startTime: Date.now()
        });
        
        console.log(`开始生产 ${this.coffeeType} 咖啡`);
    }
    
    /**
     * 生产动画
     */
    private animateProduction() {
        // 进度条动画
        tween(this.progressBar)
            .to(this.productionTime, { progress: 1 }, {
                onUpdate: (target, ratio) => {
                    this._currentProgress = ratio;
                    this.updateProgressBar();
                },
                onComplete: () => {
                    this.finishProduction();
                }
            })
            .start();
        
        // 机器震动动画
        this.playMachineShake();
    }
    
    /**
     * 机器震动动画
     */
    private playMachineShake() {
        const originalPos = this.node.position.clone();
        
        tween(this.node)
            .by(0.1, { position: new Vec3(5, 0, 0) })
            .by(0.1, { position: new Vec3(-5, 0, 0) })
            .by(0.1, { position: new Vec3(-5, 0, 0) })
            .by(0.1, { position: new Vec3(5, 0, 0) })
            .union()
            .repeat(Math.floor(this.productionTime / 0.4))
            .start();
    }
    
    /**
     * 更新进度条显示
     */
    private updateProgressBar() {
        if (this.progressBar) {
            this.progressBar.progress = this._currentProgress;
        }
    }
    
    /**
     * 完成生产
     */
    private finishProduction() {
        this._isProducing = false;
        
        // 生成咖啡
        this.spawnCoffee();
        
        // 更新视觉状态
        this.updateMachineVisual();
        this.updateStatusLight();
        
        // 恢复按钮状态
        if (this.produceButton) {
            this.produceButton.interactable = true;
        }
        
        // 检查是否损坏
        this.checkForBreakdown();
        
        // 发送生产完成事件
        EventManager.instance.emit(EventManager.Events.COFFEE_SOLD, {
            type: this.coffeeType,
            value: this.coffeeValue,
            machineId: this.node.uuid
        });
        
        console.log(`${this.coffeeType} 咖啡生产完成，价值 ${this.coffeeValue} 金币`);
    }
    
    /**
     * 生成咖啡物品
     */
    private spawnCoffee() {
        if (!this.coffeeOutput) return;
        
        // 这里可以创建一个咖啡预制体
        // 暂时先播放一个简单的动画
        this.playCoffeeSpawnAnimation();
    }
    
    /**
     * 咖啡生成动画
     */
    private playCoffeeSpawnAnimation() {
        // 简单的缩放动画
        tween(this.coffeeOutput)
            .to(0.2, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start();
    }
    
    /**
     * 检查是否损坏
     */
    private checkForBreakdown() {
        if (this._isBroken || this._breakTimer > 0) return;
        
        // 根据等级计算损坏概率
        const breakChance = this._breakChance * (1 / this.machineLevel);
        
        if (Math.random() < breakChance) {
            this.breakdown();
        }
    }
    
    /**
     * 机器损坏
     */
    private breakdown() {
        this._isBroken = true;
        this._breakTimer = this._breakCooldown;
        
        // 更新视觉状态
        this.updateMachineVisual();
        this.updateStatusLight();
        
        // 禁用按钮
        if (this.produceButton) {
            this.produceButton.interactable = false;
        }
        
        // 播放损坏音效和动画
        this.playBreakdownAnimation();
        
        // 发送损坏事件
        EventManager.instance.emit('coffee_machine_broken', {
            machineId: this.node.uuid,
            repairCost: this._repairCost
        });
        
        console.log(`咖啡机损坏，维修费用: ${this._repairCost} 金币`);
    }
    
    /**
     * 播放损坏动画
     */
    private playBreakdownAnimation() {
        // 闪烁红色
        if (this.machineSprite) {
            tween(this.machineSprite)
                .to(0.5, { color: Color.RED })
                .to(0.5, { color: Color.WHITE })
                .repeat(3)
                .start();
        }
    }
    
    /**
     * 显示维修提示
     */
    private showRepairPrompt() {
        // 这里可以弹出一个UI面板询问是否维修
        EventManager.instance.emit('show_repair_prompt', {
            machineId: this.node.uuid,
            cost: this._repairCost
        });
    }
    
    /**
     * 维修机器
     */
    public repair() {
        if (!this._isBroken) return;
        
        this._isBroken = false;
        this._breakTimer = this._breakCooldown;
        
        // 更新视觉状态
        this.updateMachineVisual();
        this.updateStatusLight();
        
        // 启用按钮
        if (this.produceButton) {
            this.produceButton.interactable = true;
        }
        
        // 发送维修事件
        EventManager.instance.emit('coffee_machine_repaired', {
            machineId: this.node.uuid,
            cost: this._repairCost
        });
        
        console.log(`咖啡机已维修，花费 ${this._repairCost} 金币`);
    }
    
    /**
     * 升级机器
     */
    public upgrade() {
        if (this.machineLevel >= this.maxLevel) {
            console.log('已达到最大等级');
            return;
        }
        
        const upgradeCost = this.calculateUpgradeCost();
        
        // 检查是否有足够金币
        // 这里需要接入游戏的经济系统
        const canUpgrade = true; // 临时
        
        if (canUpgrade) {
            this.machineLevel++;
            this.productionTime *= 0.9;  // 减少10%生产时间
            this.coffeeValue *= 1.2;    // 增加20%价值
            this._breakChance *= 0.8;   // 减少20%损坏概率
            
            this.updateMachineVisual();
            
            // 发送升级事件
            EventManager.instance.emit('coffee_machine_upgraded', {
                machineId: this.node.uuid,
                level: this.machineLevel,
                cost: upgradeCost
            });
            
            console.log(`咖啡机升级到 ${this.machineLevel} 级`);
        }
    }
    
    /**
     * 计算升级费用
     */
    private calculateUpgradeCost(): number {
        return this.upgradeCostBase * Math.pow(1.5, this.machineLevel - 1);
    }
    
    /**
     * 更新机器视觉状态
     */
    private updateMachineVisual() {
        if (!this.machineSprite) return;
        
        if (this._isBroken) {
            if (this.brokenSprite) {
                this.machineSprite.spriteFrame = this.brokenSprite;
            }
        } else if (this._isProducing) {
            if (this.workingSprite) {
                this.machineSprite.spriteFrame = this.workingSprite;
            }
        } else {
            if (this.normalSprite) {
                this.machineSprite.spriteFrame = this.normalSprite;
            }
        }
    }
    
    /**
     * 更新状态指示灯
     */
    private updateStatusLight() {
        if (!this.statusLight) return;
        
        if (this._isBroken) {
            if (this.brokenLightSprite) {
                this.statusLight.spriteFrame = this.brokenLightSprite;
            }
        } else if (this._isProducing) {
            if (this.workingLightSprite) {
                this.statusLight.spriteFrame = this.workingLightSprite;
            }
        } else {
            if (this.idleLightSprite) {
                this.statusLight.spriteFrame = this.idleLightSprite;
            }
        }
    }
    
    /**
     * 获取生产时间（考虑等级加成）
     */
    public getProductionTime(): number {
        return this.productionTime;
    }
    
    /**
     * 获取咖啡价值（考虑等级加成）
     */
    public getCoffeeValue(): number {
        return this.coffeeValue;
    }
    
    /**
     * 获取机器等级
     */
    public getMachineLevel(): number {
        return this.machineLevel;
    }
    
    /**
     * 是否正在生产
     */
    public isProducing(): boolean {
        return this._isProducing;
    }
    
    /**
     * 是否损坏
     */
    public isBroken(): boolean {
        return this._isBroken;
    }
    
    /**
     * 获取维修费用
     */
    public getRepairCost(): number {
        return this._repairCost;
    }
    
    /**
     * 获取升级费用
     */
    public getUpgradeCost(): number {
        return this.calculateUpgradeCost();
    }
    
    update(deltaTime: number) {
        // 更新损坏计时器
        if (this._breakTimer > 0) {
            this._breakTimer -= deltaTime;
        }
    }
    
    onDestroy() {
        // 清理事件监听
        if (this.produceButton) {
            this.produceButton.node.off('click', this.onProduceClick, this);
        }
    }
}