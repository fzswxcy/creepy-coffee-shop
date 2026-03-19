/**
 * 顾客逻辑增强版
 * 包含微恐元素和完整的行为逻辑
 */

import { _decorator, Component, Node, Sprite, Label, ProgressBar, tween, Vec3, Color, SpriteFrame, director } from 'cc';
import { economyManager } from '../managers/EconomyManager';
import { EventManager } from '../core/EventManager';

const { ccclass, property } = _decorator;

/**
 * 顾客订单接口
 */
interface CustomerOrder {
    coffeeType: string;
    specialRequirement?: string; // 特殊要求（微恐元素相关）
    waitTime: number;
    reward: number;
    tipMultiplier: number; // 小费倍数
}

/**
 * 顾客状态枚举
 */
export enum CustomerState {
    ARRIVING = 'arriving',   // 到达中
    WAITING = 'waiting',     // 等待中
    ORDERING = 'ordering',   // 点单中
    BEING_SERVED = 'being_served', // 服务中
    LEAVING = 'leaving',     // 离开中
    ANGRY = 'angry',         // 生气离开
    HAPPY = 'happy',         // 满意离开
    SCARED = 'scared'        // 受惊吓（微恐元素）
}

@ccclass('CustomerLogic')
export class CustomerLogic extends Component {
    // 视觉组件
    @property(Sprite)
    private customerSprite: Sprite | null = null;
    
    @property(Label)
    private orderLabel: Label | null = null;
    
    @property(ProgressBar)
    private patienceBar: ProgressBar | null = null;
    
    @property(Node)
    private thoughtBubble: Node | null = null;
    
    @property(Node)
    private spookyEffect: Node | null = null;
    
    // 精灵帧（不同状态）
    @property({ type: SpriteFrame })
    private normalSprite: SpriteFrame | null = null;
    
    @property({ type: SpriteFrame })
    private happySprite: SpriteFrame | null = null;
    
    @property({ type: SpriteFrame })
    private angrySprite: SpriteFrame | null = null;
    
    @property({ type: SpriteFrame })
    private ghostSprite: SpriteFrame | null = null;
    
    @property({ type: SpriteFrame })
    private vampireSprite: SpriteFrame | null = null;
    
    @property({ type: SpriteFrame })
    private zombieSprite: SpriteFrame | null = null;
    
    // 顾客属性
    private currentState: CustomerState = CustomerState.ARRIVING;
    private customerType: string = 'normal';
    private customerOrder: CustomerOrder | null = null;
    private patience: number = 100; // 耐心值（0-100）
    private waitTimer: number = 0;
    private hasServed: boolean = false;
    private servedCoffeeType: string = '';
    
    // 微恐元素相关
    private isSpookyCustomer: boolean = false;
    private spookyLevel: number = 0; // 0-3，恐怖等级
    private spookyEffectActive: boolean = false;
    
    // 奖励相关
    private baseReward: number = 0;
    private tipAmount: number = 0;
    
    onLoad() {
        this.initializeCustomer();
        this.startCustomerBehavior();
    }
    
    /**
     * 初始化顾客
     */
    private initializeCustomer(): void {
        // 随机决定是否为微恐顾客（30%概率）
        this.isSpookyCustomer = Math.random() < 0.3;
        
        if (this.isSpookyCustomer) {
            // 设置恐怖等级
            this.spookyLevel = Math.floor(Math.random() * 3) + 1; // 1-3级
            this.customerType = this.getRandomSpookyType();
            this.applySpookyVisuals();
        } else {
            this.customerType = 'normal';
        }
        
        // 生成订单
        this.generateOrder();
        
        // 初始化耐心
        this.patience = 100;
        this.updatePatienceBar();
        
        // 设置状态
        this.currentState = CustomerState.ARRIVING;
        this.arriveAnimation();
    }
    
    /**
     * 获取随机微恐类型
     */
    private getRandomSpookyType(): string {
        const types = ['ghost', 'vampire', 'zombie'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    /**
     * 应用微恐视觉效果
     */
    private applySpookyVisuals(): void {
        if (!this.customerSprite) return;
        
        switch (this.customerType) {
            case 'ghost':
                if (this.ghostSprite) {
                    this.customerSprite.spriteFrame = this.ghostSprite;
                }
                break;
            case 'vampire':
                if (this.vampireSprite) {
                    this.customerSprite.spriteFrame = this.vampireSprite;
                }
                break;
            case 'zombie':
                if (this.zombieSprite) {
                    this.customerSprite.spriteFrame = this.zombieSprite;
                }
                break;
        }
        
        // 显示微恐特效
        if (this.spookyEffect) {
            this.spookyEffect.active = true;
        }
    }
    
    /**
     * 生成订单
     */
    private generateOrder(): void {
        const coffeeTypes = [
            'Espresso', 'Latte', 'Cappuccino', 'Americano', 'Mocha',
            'Macchiato', 'Flat White', 'Turkish Coffee'
        ];
        
        const specialRequirements = [
            '加一点吸血鬼之血',
            '用午夜露水调制',
            '加入幽灵粉末',
            '用墓地土种植的咖啡豆',
            '在满月下烘焙',
            '女巫特调配方'
        ];
        
        const coffeeType = coffeeTypes[Math.floor(Math.random() * coffeeTypes.length)];
        
        this.customerOrder = {
            coffeeType: coffeeType,
            waitTime: 25 + Math.random() * 20, // 25-45秒等待时间
            reward: 30 + Math.floor(Math.random() * 70), // 30-100金币
            tipMultiplier: 1.0 + Math.random() * 0.5 // 1.0-1.5倍小费
        };
        
        // 微恐顾客有特殊要求
        if (this.isSpookyCustomer && Math.random() < 0.5) {
            this.customerOrder.specialRequirement = specialRequirements[
                Math.floor(Math.random() * specialRequirements.length)
            ];
        }
        
        this.baseReward = this.customerOrder.reward;
        this.updateOrderDisplay();
    }
    
    /**
     * 更新订单显示
     */
    private updateOrderDisplay(): void {
        if (!this.orderLabel || !this.customerOrder) return;
        
        let orderText = `☕ ${this.customerOrder.coffeeType}`;
        
        if (this.customerOrder.specialRequirement) {
            orderText += `\n✨ ${this.customerOrder.specialRequirement}`;
        }
        
        orderText += `\n⏰ ${Math.floor(this.customerOrder.waitTime - this.waitTimer)}s`;
        orderText += `\n💰 ${this.baseReward}金币`;
        
        this.orderLabel.string = orderText;
    }
    
    /**
     * 开始顾客行为
     */
    private startCustomerBehavior(): void {
        // 定时更新
        this.schedule(this.updateCustomerBehavior, 0.5);
    }
    
    /**
     * 更新顾客行为
     */
    private updateCustomerBehavior(dt: number): void {
        if (this.currentState === CustomerState.WAITING || 
            this.currentState === CustomerState.BEING_SERVED) {
            
            // 更新等待时间
            this.waitTimer += dt;
            
            // 更新耐心
            this.updatePatience(dt);
            
            // 检查是否应该离开
            if (this.shouldLeave()) {
                this.leave();
            }
            
            // 更新显示
            this.updateOrderDisplay();
        }
    }
    
    /**
     * 更新耐心值
     */
    private updatePatience(dt: number): void {
        if (!this.customerOrder) return;
        
        // 计算耐心消耗率（基于等待时间）
        const patienceDecayRate = 100 / this.customerOrder.waitTime;
        this.patience -= patienceDecayRate * dt;
        
        if (this.patience < 0) {
            this.patience = 0;
        }
        
        this.updatePatienceBar();
        
        // 根据耐心值更新状态
        if (this.patience < 30 && this.currentState !== CustomerState.ANGRY) {
            this.becomeImpatient();
        }
    }
    
    /**
     * 更新耐心条显示
     */
    private updatePatienceBar(): void {
        if (!this.patienceBar) return;
        
        this.patienceBar.progress = this.patience / 100;
        
        // 根据耐心值改变颜色
        if (this.patience > 70) {
            this.patienceBar.barSprite.color = Color.GREEN;
        } else if (this.patience > 30) {
            this.patienceBar.barSprite.color = Color.YELLOW;
        } else {
            this.patienceBar.barSprite.color = Color.RED;
        }
    }
    
    /**
     * 到达动画
     */
    private arriveAnimation(): void {
        this.node.setScale(new Vec3(0.1, 0.1, 1));
        
        tween(this.node)
            .to(0.5, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                this.currentState = CustomerState.WAITING;
                this.showThoughtBubble();
            })
            .start();
    }
    
    /**
     * 显示思考气泡
     */
    private showThoughtBubble(): void {
        if (this.thoughtBubble) {
            this.thoughtBubble.active = true;
            this.thoughtBubble.setScale(new Vec3(0, 0, 1));
            
            tween(this.thoughtBubble)
                .to(0.3, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }
    
    /**
     * 隐藏思考气泡
     */
    private hideThoughtBubble(): void {
        if (this.thoughtBubble) {
            tween(this.thoughtBubble)
                .to(0.3, { scale: new Vec3(0, 0, 1) })
                .call(() => {
                    if (this.thoughtBubble) {
                        this.thoughtBubble.active = false;
                    }
                })
                .start();
        }
    }
    
    /**
     * 变得不耐烦
     */
    private becomeImpatient(): void {
        this.currentState = CustomerState.ANGRY;
        
        // 更新精灵
        if (this.customerSprite && this.angrySprite) {
            this.customerSprite.spriteFrame = this.angrySprite;
        }
        
        // 抖动效果
        tween(this.node)
            .by(0.1, { position: new Vec3(5, 0, 0) })
            .by(0.1, { position: new Vec3(-5, 0, 0) })
            .by(0.1, { position: new Vec3(5, 0, 0) })
            .by(0.1, { position: new Vec3(-5, 0, 0) })
            .start();
        
        // 触发微恐特效（如果是微恐顾客）
        if (this.isSpookyCustomer) {
            this.triggerSpookyEffect();
        }
    }
    
    /**
     * 触发微恐特效
     */
    private triggerSpookyEffect(): void {
        if (!this.spookyEffect || this.spookyEffectActive) return;
        
        this.spookyEffectActive = true;
        
        // 闪烁效果
        tween(this.node)
            .to(0.1, { opacity: 100 })
            .to(0.1, { opacity: 255 })
            .to(0.1, { opacity: 100 })
            .to(0.1, { opacity: 255 })
            .call(() => {
                this.spookyEffectActive = false;
            })
            .start();
    }
    
    /**
     * 接受服务
     * @param coffeeType 提供的咖啡类型
     * @param hasSpecialRequirement 是否满足特殊要求
     */
    public serve(coffeeType: string, hasSpecialRequirement: boolean = false): boolean {
        if (!this.customerOrder || this.hasServed) return false;
        
        this.currentState = CustomerState.BEING_SERVED;
        this.hasServed = true;
        this.servedCoffeeType = coffeeType;
        
        // 检查咖啡类型是否匹配
        const isCorrectCoffee = coffeeType === this.customerOrder.coffeeType;
        
        // 计算小费
        this.calculateTip(isCorrectCoffee, hasSpecialRequirement);
        
        // 根据结果更新状态
        if (isCorrectCoffee && hasSpecialRequirement) {
            this.currentState = CustomerState.HAPPY;
            this.tipAmount *= 1.5; // 额外奖励
        } else if (isCorrectCoffee) {
            this.currentState = CustomerState.HAPPY;
        } else {
            this.currentState = CustomerState.ANGRY;
            this.tipAmount = 0;
        }
        
        // 更新视觉
        this.updateVisualState();
        
        // 隐藏思考气泡
        this.hideThoughtBubble();
        
        // 2秒后离开
        this.scheduleOnce(() => {
            this.leave();
        }, 2);
        
        return true;
    }
    
    /**
     * 计算小费
     */
    private calculateTip(isCorrectCoffee: boolean, hasSpecialRequirement: boolean): void {
        if (!isCorrectCoffee) {
            this.tipAmount = 0;
            return;
        }
        
        // 基础小费
        let tipMultiplier = this.customerOrder?.tipMultiplier || 1.0;
        
        // 耐心奖励
        const patienceBonus = this.patience / 100; // 0-1倍
        tipMultiplier += patienceBonus * 0.5;
        
        // 特殊要求奖励
        if (hasSpecialRequirement) {
            tipMultiplier += 0.5;
        }
        
        // 微恐顾客额外奖励
        if (this.isSpookyCustomer) {
            tipMultiplier += this.spookyLevel * 0.2;
        }
        
        this.tipAmount = Math.floor(this.baseReward * tipMultiplier) - this.baseReward;
    }
    
    /**
     * 更新视觉状态
     */
    private updateVisualState(): void {
        if (!this.customerSprite) return;
        
        switch (this.currentState) {
            case CustomerState.HAPPY:
                if (this.happySprite) {
                    this.customerSprite.spriteFrame = this.happySprite;
                }
                break;
            case CustomerState.ANGRY:
                if (this.angrySprite) {
                    this.customerSprite.spriteFrame = this.angrySprite;
                }
                break;
        }
    }
    
    /**
     * 检查是否应该离开
     */
    private shouldLeave(): boolean {
        if (!this.customerOrder) return false;
        
        // 超时离开
        if (this.waitTimer >= this.customerOrder.waitTime) {
            return true;
        }
        
        // 耐心耗尽离开
        if (this.patience <= 0 && !this.hasServed) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 离开
     */
    private leave(): void {
        if (this.currentState === CustomerState.LEAVING) return;
        
        this.currentState = CustomerState.LEAVING;
        
        // 如果已经被服务过，给予奖励
        if (this.hasServed && this.currentState === CustomerState.HAPPY) {
            this.giveReward();
        }
        
        // 离开动画
        tween(this.node)
            .to(0.5, { position: new Vec3(800, this.node.position.y, 0) })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }
    
    /**
     * 给予奖励
     */
    private giveReward(): void {
        const totalReward = this.baseReward + this.tipAmount;
        
        if (economyManager) {
            economyManager.addGold(totalReward);
        }
        
        // 触发事件
        EventManager.instance?.emit('customer_served', {
            customerType: this.customerType,
            coffeeType: this.servedCoffeeType,
            reward: totalReward,
            baseReward: this.baseReward,
            tip: this.tipAmount,
            hasSpecial: !!this.customerOrder?.specialRequirement
        });
        
        console.log(`顾客满意离开！获得${totalReward}金币（基础${this.baseReward}+小费${this.tipAmount}）`);
    }
    
    /**
     * 获取订单信息
     */
    public getOrder(): CustomerOrder | null {
        return this.customerOrder;
    }
    
    /**
     * 获取顾客状态
     */
    public getState(): CustomerState {
        return this.currentState;
    }
    
    /**
     * 是否为微恐顾客
     */
    public isSpooky(): boolean {
        return this.isSpookyCustomer;
    }
    
    /**
     * 获取恐怖等级
     */
    public getSpookyLevel(): number {
        return this.spookyLevel;
    }
}