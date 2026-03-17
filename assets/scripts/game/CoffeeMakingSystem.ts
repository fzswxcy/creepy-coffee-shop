/**
 * 咖啡制作系统
 * 负责咖啡制作的完整流程，包含微恐元素和特殊配方
 */

import { _decorator, Component, Node, Sprite, Label, ProgressBar, Button, ParticleSystem2D, tween, Vec3, Color, SpriteFrame } from 'cc';
import { economyManager } from '../managers/EconomyManager';
import { coffeeProductionManager } from '../managers/CoffeeProductionManager';

const { ccclass, property } = _decorator;

/**
 * 咖啡类型配置
 */
interface CoffeeType {
    id: string;
    name: string;
    basePrice: number;
    energyCost: number;
    timeToMake: number; // 制作时间（秒）
    difficulty: number; // 制作难度（1-5）
    specialIngredients?: string[]; // 特殊配料（微恐元素相关）
    spookyMultiplier?: number; // 微恐加成倍数
}

/**
 * 制作步骤
 */
enum CoffeeMakingStep {
    IDLE = 'idle',
    SELECTING = 'selecting',
    GRINDING = 'grinding',
    BREWING = 'brewing',
    ADDING_MILK = 'adding_milk',
    ADDING_SPECIAL = 'adding_special',
    COMPLETE = 'complete',
    FAILED = 'failed'
}

@ccclass('CoffeeMakingSystem')
export class CoffeeMakingSystem extends Component {
    // UI组件
    @property(Node)
    private coffeeMachineUI: Node | null = null;
    
    @property(Sprite)
    private coffeeMachineSprite: Sprite | null = null;
    
    @property(ProgressBar)
    private progressBar: ProgressBar | null = null;
    
    @property(Label)
    private progressLabel: Label | null = null;
    
    @property(Label)
    private currentCoffeeLabel: Label | null = null;
    
    @property(Node)
    private coffeeSelectionPanel: Node | null = null;
    
    @property(Node)
    private specialIngredientsPanel: Node | null = null;
    
    // 粒子效果
    @property(ParticleSystem2D)
    private steamParticles: ParticleSystem2D | null = null;
    
    @property(ParticleSystem2D)
    private spookyParticles: ParticleSystem2D | null = null;
    
    @property(ParticleSystem2D)
    private successParticles: ParticleSystem2D | null = null;
    
    // 按钮
    @property(Button)
    private startButton: Button | null = null;
    
    @property(Button)
    private cancelButton: Button | null = null;
    
    @property(Button)
    private specialButton: Button | null = null;
    
    // 咖啡类型配置
    private coffeeTypes: CoffeeType[] = [
        {
            id: 'espresso',
            name: '意式浓缩',
            basePrice: 20,
            energyCost: 8,
            timeToMake: 10,
            difficulty: 2
        },
        {
            id: 'latte',
            name: '拿铁咖啡',
            basePrice: 30,
            energyCost: 12,
            timeToMake: 15,
            difficulty: 3
        },
        {
            id: 'cappuccino',
            name: '卡布奇诺',
            basePrice: 35,
            energyCost: 15,
            timeToMake: 18,
            difficulty: 4
        },
        {
            id: 'americano',
            name: '美式咖啡',
            basePrice: 25,
            energyCost: 10,
            timeToMake: 12,
            difficulty: 2
        },
        {
            id: 'mocha',
            name: '摩卡咖啡',
            basePrice: 40,
            energyCost: 18,
            timeToMake: 20,
            difficulty: 5
        },
        {
            id: 'ghost_espresso',
            name: '幽灵浓缩',
            basePrice: 60,
            energyCost: 25,
            timeToMake: 25,
            difficulty: 4,
            specialIngredients: ['幽灵粉末', '午夜露水'],
            spookyMultiplier: 1.5
        },
        {
            id: 'vampire_latte',
            name: '吸血鬼拿铁',
            basePrice: 80,
            energyCost: 30,
            timeToMake: 30,
            difficulty: 5,
            specialIngredients: ['吸血鬼之血', '墓地土咖啡豆'],
            spookyMultiplier: 2.0
        },
        {
            id: 'zombie_mocha',
            name: '僵尸摩卡',
            basePrice: 100,
            energyCost: 35,
            timeToMake: 35,
            difficulty: 5,
            specialIngredients: ['腐化可可', '女巫特调'],
            spookyMultiplier: 2.5
        }
    ];
    
    // 游戏状态
    private currentStep: CoffeeMakingStep = CoffeeMakingStep.IDLE;
    private currentCoffeeType: CoffeeType | null = null;
    private currentProgress: number = 0;
    private currentTimer: number = 0;
    private isMakingCoffee: boolean = false;
    private successChance: number = 1.0; // 成功概率（0-1）
    private qualityMultiplier: number = 1.0; // 质量倍数
    private specialIngredientsAdded: string[] = [];
    
    // 能量相关
    private energyConsumed: number = 0;
    private maxEnergy: number = 100;
    
    onLoad() {
        this.initializeUI();
        this.setupEventListeners();
    }
    
    /**
     * 初始化UI
     */
    private initializeUI(): void {
        // 初始隐藏面板
        if (this.coffeeSelectionPanel) {
            this.coffeeSelectionPanel.active = false;
        }
        
        if (this.specialIngredientsPanel) {
            this.specialIngredientsPanel.active = false;
        }
        
        // 更新UI状态
        this.updateUIState();
    }
    
    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        if (this.startButton) {
            this.startButton.node.on('click', this.onStartButtonClick, this);
        }
        
        if (this.cancelButton) {
            this.cancelButton.node.on('click', this.onCancelButtonClick, this);
        }
        
        if (this.specialButton) {
            this.specialButton.node.on('click', this.onSpecialButtonClick, this);
        }
    }
    
    /**
     * 更新UI状态
     */
    private updateUIState(): void {
        if (!this.coffeeMachineUI) return;
        
        // 根据当前步骤更新UI
        switch (this.currentStep) {
            case CoffeeMakingStep.IDLE:
                this.setIdleState();
                break;
            case CoffeeMakingStep.SELECTING:
                this.setSelectingState();
                break;
            case CoffeeMakingStep.GRINDING:
                this.setGrindingState();
                break;
            case CoffeeMakingStep.BREWING:
                this.setBrewingState();
                break;
            case CoffeeMakingStep.ADDING_MILK:
                this.setAddingMilkState();
                break;
            case CoffeeMakingStep.ADDING_SPECIAL:
                this.setAddingSpecialState();
                break;
            case CoffeeMakingStep.COMPLETE:
                this.setCompleteState();
                break;
            case CoffeeMakingStep.FAILED:
                this.setFailedState();
                break;
        }
        
        // 更新进度条
        this.updateProgressBar();
        
        // 更新咖啡信息
        this.updateCoffeeInfo();
    }
    
    /**
     * 设置空闲状态
     */
    private setIdleState(): void {
        if (this.startButton) {
            this.startButton.node.active = true;
            this.startButton.interactable = true;
        }
        
        if (this.cancelButton) {
            this.cancelButton.node.active = false;
        }
        
        if (this.specialButton) {
            this.specialButton.node.active = false;
        }
        
        // 停止粒子效果
        this.stopAllParticles();
    }
    
    /**
     * 设置选择状态
     */
    private setSelectingState(): void {
        // 显示咖啡选择面板
        if (this.coffeeSelectionPanel) {
            this.coffeeSelectionPanel.active = true;
        }
        
        // 隐藏其他面板
        if (this.specialIngredientsPanel) {
            this.specialIngredientsPanel.active = false;
        }
    }
    
    /**
     * 设置研磨状态
     */
    private setGrindingState(): void {
        if (this.progressLabel) {
            this.progressLabel.string = '研磨咖啡豆中...';
        }
        
        // 播放研磨音效（待实现）
        this.playGrindingAnimation();
    }
    
    /**
     * 设置冲泡状态
     */
    private setBrewingState(): void {
        if (this.progressLabel) {
            this.progressLabel.string = '冲泡咖啡中...';
        }
        
        // 开始蒸汽粒子效果
        if (this.steamParticles) {
            this.steamParticles.resetSystem();
        }
    }
    
    /**
     * 设置加奶状态
     */
    private setAddingMilkState(): void {
        if (this.progressLabel) {
            this.progressLabel.string = '添加牛奶和糖...';
        }
    }
    
    /**
     * 设置添加特殊配料状态
     */
    private setAddingSpecialState(): void {
        if (this.progressLabel) {
            this.progressLabel.string = '添加特殊配料...';
        }
        
        // 显示特殊配料面板
        if (this.specialIngredientsPanel) {
            this.specialIngredientsPanel.active = true;
        }
        
        // 播放微恐粒子效果
        if (this.spookyParticles) {
            this.spookyParticles.resetSystem();
        }
    }
    
    /**
     * 设置完成状态
     */
    private setCompleteState(): void {
        if (this.progressLabel) {
            this.progressLabel.string = '咖啡制作完成！';
        }
        
        // 播放成功粒子效果
        if (this.successParticles) {
            this.successParticles.resetSystem();
        }
        
        // 停止其他粒子效果
        if (this.steamParticles) {
            this.steamParticles.stopSystem();
        }
        
        if (this.spookyParticles) {
            this.spookyParticles.stopSystem();
        }
        
        // 2秒后重置
        this.scheduleOnce(() => {
            this.resetToIdle();
        }, 2);
    }
    
    /**
     * 设置失败状态
     */
    private setFailedState(): void {
        if (this.progressLabel) {
            this.progressLabel.string = '制作失败...';
        }
        
        // 咖啡机闪烁红色
        if (this.coffeeMachineSprite) {
            tween(this.coffeeMachineSprite.node)
                .to(0.2, { color: Color.RED })
                .to(0.2, { color: Color.WHITE })
                .to(0.2, { color: Color.RED })
                .to(0.2, { color: Color.WHITE })
                .start();
        }
        
        // 3秒后重置
        this.scheduleOnce(() => {
            this.resetToIdle();
        }, 3);
    }
    
    /**
     * 更新进度条
     */
    private updateProgressBar(): void {
        if (!this.progressBar) return;
        
        this.progressBar.progress = this.currentProgress;
        
        // 根据进度改变颜色
        if (this.currentProgress < 0.3) {
            this.progressBar.barSprite.color = Color.RED;
        } else if (this.currentProgress < 0.7) {
            this.progressBar.barSprite.color = Color.YELLOW;
        } else {
            this.progressBar.barSprite.color = Color.GREEN;
        }
    }
    
    /**
     * 更新咖啡信息
     */
    private updateCoffeeInfo(): void {
        if (!this.currentCoffeeLabel) return;
        
        if (this.currentCoffeeType) {
            let infoText = `当前制作: ${this.currentCoffeeType.name}\n`;
            infoText += `价格: ${this.currentCoffeeType.basePrice}金币\n`;
            infoText += `耗时: ${this.currentCoffeeType.timeToMake}秒\n`;
            infoText += `难度: ${'★'.repeat(this.currentCoffeeType.difficulty)}\n`;
            
            if (this.currentCoffeeType.specialIngredients) {
                infoText += `特殊配料: ${this.currentCoffeeType.specialIngredients.join(', ')}\n`;
            }
            
            this.currentCoffeeLabel.string = infoText;
        } else {
            this.currentCoffeeLabel.string = '请选择要制作的咖啡';
        }
    }
    
    /**
     * 播放研磨动画
     */
    private playGrindingAnimation(): void {
        if (!this.coffeeMachineSprite) return;
        
        tween(this.coffeeMachineSprite.node)
            .by(0.1, { rotation: 45 })
            .by(0.1, { rotation: -45 })
            .by(0.1, { rotation: 45 })
            .by(0.1, { rotation: -45 })
            .start();
    }
    
    /**
     * 停止所有粒子效果
     */
    private stopAllParticles(): void {
        if (this.steamParticles) {
            this.steamParticles.stopSystem();
        }
        
        if (this.spookyParticles) {
            this.spookyParticles.stopSystem();
        }
        
        if (this.successParticles) {
            this.successParticles.stopSystem();
        }
    }
    
    /**
     * 开始制作咖啡
     */
    public startMakingCoffee(coffeeTypeId: string): boolean {
        // 查找咖啡类型
        const coffeeType = this.coffeeTypes.find(type => type.id === coffeeTypeId);
        if (!coffeeType) {
            console.error(`未知的咖啡类型: ${coffeeTypeId}`);
            return false;
        }
        
        // 检查能量是否足够
        if (this.energyConsumed + coffeeType.energyCost > this.maxEnergy) {
            console.log('能量不足，无法制作咖啡');
            return false;
        }
        
        // 设置当前咖啡类型
        this.currentCoffeeType = coffeeType;
        this.currentStep = CoffeeMakingStep.SELECTING;
        this.currentProgress = 0;
        this.currentTimer = 0;
        this.isMakingCoffee = true;
        this.specialIngredientsAdded = [];
        
        // 消耗能量
        this.energyConsumed += coffeeType.energyCost;
        
        // 更新UI
        this.updateUIState();
        
        // 开始制作流程
        this.startMakingProcess();
        
        return true;
    }
    
    /**
     * 开始制作流程
     */
    private startMakingProcess(): void {
        // 切换到研磨步骤
        this.scheduleOnce(() => {
            this.currentStep = CoffeeMakingStep.GRINDING;
            this.updateUIState();
            
            // 研磨时间
            this.scheduleOnce(() => {
                this.currentProgress = 0.2;
                this.currentStep = CoffeeMakingStep.BREWING;
                this.updateUIState();
                
                // 冲泡时间
                const brewTime = this.currentCoffeeType!.timeToMake * 0.4;
                this.schedule(() => {
                    this.currentProgress += 0.01 / brewTime;
                    this.updateProgressBar();
                }, 0.1, Math.floor(brewTime / 0.1));
                
                this.scheduleOnce(() => {
                    this.currentProgress = 0.6;
                    this.currentStep = CoffeeMakingStep.ADDING_MILK;
                    this.updateUIState();
                    
                    // 加奶时间
                    this.scheduleOnce(() => {
                        this.currentProgress = 0.8;
                        
                        // 检查是否需要特殊配料
                        if (this.currentCoffeeType!.specialIngredients && 
                            this.currentCoffeeType!.specialIngredients.length > 0) {
                            this.currentStep = CoffeeMakingStep.ADDING_SPECIAL;
                            this.updateUIState();
                        } else {
                            this.finishMakingProcess();
                        }
                    }, 2);
                }, brewTime);
            }, 2);
        }, 1);
    }
    
    /**
     * 添加特殊配料
     */
    public addSpecialIngredient(ingredient: string): boolean {
        if (!this.currentCoffeeType || 
            this.currentStep !== CoffeeMakingStep.ADDING_SPECIAL) {
            return false;
        }
        
        // 检查是否为有效的特殊配料
        if (!this.currentCoffeeType.specialIngredients?.includes(ingredient)) {
            console.log(`无效的特殊配料: ${ingredient}`);
            return false;
        }
        
        // 添加配料
        if (!this.specialIngredientsAdded.includes(ingredient)) {
            this.specialIngredientsAdded.push(ingredient);
            
            // 增加质量倍数
            this.qualityMultiplier += 0.2;
            
            console.log(`添加特殊配料: ${ingredient}`);
            
            // 检查是否添加了所有配料
            if (this.specialIngredientsAdded.length === 
                this.currentCoffeeType.specialIngredients!.length) {
                this.finishMakingProcess();
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 完成制作流程
     */
    private finishMakingProcess(): void {
        // 计算成功概率
        this.calculateSuccessChance();
        
        // 随机决定是否成功
        const isSuccess = Math.random() < this.successChance;
        
        if (isSuccess) {
            this.currentStep = CoffeeMakingStep.COMPLETE;
            this.currentProgress = 1.0;
            this.deliverCoffee();
        } else {
            this.currentStep = CoffeeMakingStep.FAILED;
            this.currentProgress = 0;
        }
        
        this.updateUIState();
        this.isMakingCoffee = false;
    }
    
    /**
     * 计算成功概率
     */
    private calculateSuccessChance(): void {
        if (!this.currentCoffeeType) return;
        
        // 基础成功率（基于难度）
        let baseChance = 1.0 - (this.currentCoffeeType.difficulty * 0.1);
        
        // 特殊配料加成
        if (this.specialIngredientsAdded.length > 0) {
            baseChance += this.specialIngredientsAdded.length * 0.05;
        }
        
        // 能量充足加成
        const energyRatio = 1.0 - (this.energyConsumed / this.maxEnergy);
        baseChance += energyRatio * 0.1;
        
        // 确保在0-1范围内
        this.successChance = Math.max(0.1, Math.min(1.0, baseChance));
    }
    
    /**
     * 交付咖啡
     */
    private deliverCoffee(): void {
        if (!this.currentCoffeeType) return;
        
        // 计算最终价格
        let finalPrice = this.currentCoffeeType.basePrice;
        
        // 质量加成
        finalPrice *= this.qualityMultiplier;
        
        // 微恐加成
        if (this.currentCoffeeType.spookyMultiplier) {
            finalPrice *= this.currentCoffeeType.spookyMultiplier;
        }
        
        // 特殊配料加成
        finalPrice += this.specialIngredientsAdded.length * 10;
        
        // 四舍五入到整数
        finalPrice = Math.floor(finalPrice);
        
        // 添加到经济系统
        if (economyManager) {
            economyManager.addGold(finalPrice);
        }
        
        // 添加到生产管理器
        if (coffeeProductionManager) {
            coffeeProductionManager.recordCoffeeMade(
                this.currentCoffeeType.id,
                finalPrice,
                this.qualityMultiplier,
                this.specialIngredientsAdded
            );
        }
        
        console.log(`咖啡制作成功！获得${finalPrice}金币，质量倍数: ${this.qualityMultiplier.toFixed(2)}`);
    }
    
    /**
     * 重置到空闲状态
     */
    private resetToIdle(): void {
        this.currentStep = CoffeeMakingStep.IDLE;
        this.currentCoffeeType = null;
        this.currentProgress = 0;
        this.currentTimer = 0;
        this.isMakingCoffee = false;
        this.successChance = 1.0;
        this.qualityMultiplier = 1.0;
        this.specialIngredientsAdded = [];
        
        // 能量恢复
        this.energyConsumed = Math.max(0, this.energyConsumed - 20);
        
        // 更新UI
        this.updateUIState();
    }
    
    // ============== 按钮点击事件 ==============
    
    private onStartButtonClick(): void {
        if (this.currentStep === CoffeeMakingStep.IDLE) {
            this.currentStep = CoffeeMakingStep.SELECTING;
            this.updateUIState();
        }
    }
    
    private onCancelButtonClick(): void {
        if (this.isMakingCoffee) {
            console.log('取消制作咖啡');
            this.resetToIdle();
        }
    }
    
    private onSpecialButtonClick(): void {
        if (this.currentStep === CoffeeMakingStep.ADDING_SPECIAL && 
            this.currentCoffeeType?.specialIngredients) {
            
            // 随机添加一个特殊配料（演示用）
            const availableIngredients = this.currentCoffeeType.specialIngredients
                .filter(ingredient => !this.specialIngredientsAdded.includes(ingredient));
            
            if (availableIngredients.length > 0) {
                const randomIngredient = availableIngredients[
                    Math.floor(Math.random() * availableIngredients.length)
                ];
                this.addSpecialIngredient(randomIngredient);
            }
        }
    }
    
    // ============== 公开方法 ==============
    
    /**
     * 获取可制作的咖啡类型列表
     */
    public getAvailableCoffeeTypes(): CoffeeType[] {
        return this.coffeeTypes.filter(type => 
            type.energyCost <= this.maxEnergy - this.energyConsumed
        );
    }
    
    /**
     * 获取当前制作状态
     */
    public getMakingState(): {
        isMaking: boolean;
        currentStep: CoffeeMakingStep;
        progress: number;
        coffeeType: CoffeeType | null;
    } {
        return {
            isMaking: this.isMakingCoffee,
            currentStep: this.currentStep,
            progress: this.currentProgress,
            coffeeType: this.currentCoffeeType
        };
    }
    
    /**
     * 获取能量状态
     */
    public getEnergyStatus(): {
        consumed: number;
        max: number;
        remaining: number;
    } {
        return {
            consumed: this.energyConsumed,
            max: this.maxEnergy,
            remaining: this.maxEnergy - this.energyConsumed
        };
    }
    
    /**
     * 恢复能量
     */
    public restoreEnergy(amount: number): void {
        this.energyConsumed = Math.max(0, this.energyConsumed - amount);
    }
}