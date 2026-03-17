import { _decorator, Component, Node, Sprite, Label, ProgressBar, tween, Vec3, Color, SpriteFrame } from 'cc';
import { EventManager } from '../core/EventManager';

const { ccclass, property } = _decorator;

/**
 * 顾客组件
 * 负责顾客行为：到来、点单、等待、离开
 */
@ccclass('Customer')
export class Customer extends Component {
    
    @property(Sprite)
    customerSprite: Sprite = null;  // 顾客精灵
    
    @property(Label)
    orderLabel: Label = null;  // 订单显示
    
    @property(ProgressBar)
    patienceBar: ProgressBar = null;  // 耐心条
    
    @property(Node)
    thoughtBubble: Node = null;  // 思考气泡
    
    @property({ type: SpriteFrame })
    normalSprite: SpriteFrame = null;  // 正常状态
    
    @property({ type: SpriteFrame })
    happySprite: SpriteFrame = null;  // 满意状态
    
    @property({ type: SpriteFrame })
    angrySprite: SpriteFrame = null;  // 生气状态
    
    @property({ type: SpriteFrame })
    scaredSprite: SpriteFrame = null;  // 害怕状态（微恐元素）
    
    // 顾客属性
    @property
    customerType: string = 'normal';  // 顾客类型
    
    @property
    orderType: string = 'espresso';  // 订单类型
    
    @property
    patienceTime: number = 30;  // 总耐心时间（秒）
    
    @property
    waitMultiplier: number = 1.0;  // 等待时间乘数
    
    @property
    baseReward: number = 15;  // 基础奖励
    
    @property
    tipChance: number = 0.3;  // 小费概率（30%）
    
    @property
    scareThreshold: number = 0.3;  // 吓跑阈值（耐心低于30%时可能被吓跑）
    
    private _currentPatience: number = 0;
    private _isWaiting: boolean = false;
    private _isServed: boolean = false;
    private _isLeaving: boolean = false;
    private _isAngry: boolean = false;
    private _isScared: boolean = false;
    private _waitStartTime: number = 0;
    private _arrivalTime: number = 0;
    private _orderValue: number = 0;
    private _seatPosition: Vec3 = null;
    private _scareEffectActive: boolean = false;  // 微恐效果是否激活
    
    // 顾客类型配置
    private static CustomerTypes = {
        NORMAL: 'normal',
        VIP: 'vip',
        SCARY: 'scary',      // 微恐类型顾客
        GHOST: 'ghost',      // 幽灵顾客
        CREEPY: 'creepy'     // 怪异顾客
    };
    
    onLoad() {
        this.initCustomer();
    }
    
    /**
     * 初始化顾客
     */
    private initCustomer() {
        this._currentPatience = this.patienceTime;
        this._isWaiting = false;
        this._isServed = false;
        this._isLeaving = false;
        this._isAngry = false;
        this._isScared = false;
        
        this.updateVisual();
        
        // 隐藏思考气泡
        if (this.thoughtBubble) {
            this.thoughtBubble.active = false;
        }
        
        // 初始化耐心条
        if (this.patienceBar) {
            this.patienceBar.progress = 1;
        }
    }
    
    /**
     * 顾客到达
     * @param seatPos 座位位置
     */
    public arrive(seatPos: Vec3) {
        this._seatPosition = seatPos;
        this._arrivalTime = Date.now();
        
        // 移动到座位
        this.moveToSeat(seatPos, () => {
            this.startWaiting();
        });
        
        // 发送到达事件
        EventManager.instance.emit(EventManager.Events.CUSTOMER_ARRIVED, {
            customerId: this.node.uuid,
            type: this.customerType,
            position: seatPos
        });
        
        console.log(`顾客到达，类型: ${this.customerType}`);
    }
    
    /**
     * 移动到座位
     */
    private moveToSeat(targetPos: Vec3, callback: Function) {
        const moveTime = 1.0;  // 移动时间1秒
        
        tween(this.node)
            .to(moveTime, { position: targetPos }, {
                onComplete: () => {
                    if (callback) callback();
                }
            })
            .start();
    }
    
    /**
     * 开始等待
     */
    private startWaiting() {
        this._isWaiting = true;
        this._waitStartTime = Date.now();
        
        // 显示订单
        this.showOrder();
        
        // 开始耐心倒计时
        this.startPatienceCountdown();
        
        // 发送点单事件
        EventManager.instance.emit(EventManager.Events.CUSTOMER_ORDERED, {
            customerId: this.node.uuid,
            orderType: this.orderType,
            value: this._orderValue
        });
        
        console.log(`顾客点单: ${this.orderType}`);
    }
    
    /**
     * 显示订单
     */
    private showOrder() {
        if (this.orderLabel) {
            this.orderLabel.string = this.orderType;
        }
        
        if (this.thoughtBubble) {
            this.thoughtBubble.active = true;
            
            // 气泡动画
            tween(this.thoughtBubble)
                .to(0.3, { scale: new Vec3(1.2, 1.2, 1) })
                .to(0.2, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }
    
    /**
     * 开始耐心倒计时
     */
    private startPatienceCountdown() {
        // 根据顾客类型调整耐心速度
        let patienceSpeed = 1.0;
        
        switch (this.customerType) {
            case Customer.CustomerTypes.VIP:
                patienceSpeed = 0.7;  // VIP更有耐心
                break;
            case Customer.CustomerTypes.SCARY:
                patienceSpeed = 1.5;  // 恐怖顾客更急躁
                break;
            case Customer.CustomerTypes.GHOST:
                patienceSpeed = 2.0;  // 幽灵最没耐心
                break;
        }
        
        // 耐心条减少动画
        const totalTime = this.patienceTime * patienceSpeed;
        
        tween(this)
            .to(totalTime, { _currentPatience: 0 }, {
                onUpdate: (target, ratio) => {
                    this.updatePatienceBar();
                    
                    // 检查耐心阈值
                    this.checkPatienceThresholds();
                },
                onComplete: () => {
                    if (this._isWaiting && !this._isServed) {
                        this.becomeAngry();
                    }
                }
            })
            .start();
    }
    
    /**
     * 更新耐心条
     */
    private updatePatienceBar() {
        if (this.patienceBar) {
            const progress = this._currentPatience / this.patienceTime;
            this.patienceBar.progress = progress;
            
            // 根据耐心值改变颜色
            if (progress > 0.6) {
                this.patienceBar.barSprite.color = Color.GREEN;
            } else if (progress > 0.3) {
                this.patienceBar.barSprite.color = Color.YELLOW;
            } else {
                this.patienceBar.barSprite.color = Color.RED;
            }
        }
    }
    
    /**
     * 检查耐心阈值
     */
    private checkPatienceThresholds() {
        const progress = this._currentPatience / this.patienceTime;
        
        // 低于阈值时可能触发微恐效果
        if (progress < this.scareThreshold && !this._scareEffectActive) {
            this.tryScareCustomer();
        }
        
        // 低于50%时变得不耐烦
        if (progress < 0.5 && !this._isAngry) {
            this.showImpatience();
        }
    }
    
    /**
     * 尝试吓唬顾客（微恐效果）
     */
    private tryScareCustomer() {
        // 只有特定类型的顾客会被吓到
        if (this.customerType === Customer.CustomerTypes.GHOST || 
            this.customerType === Customer.CustomerTypes.SCARY) {
            // 这些顾客不会被吓到，反而可能吓到玩家
            return;
        }
        
        // 随机决定是否触发微恐效果
        if (Math.random() < 0.1) {  // 10%概率
            this.triggerScareEffect();
        }
    }
    
    /**
     * 触发微恐效果
     */
    private triggerScareEffect() {
        this._scareEffectActive = true;
        this._isScared = true;
        
        // 改变外观
        if (this.customerSprite && this.scaredSprite) {
            this.customerSprite.spriteFrame = this.scaredSprite;
        }
        
        // 颤抖动画
        this.playScareAnimation();
        
        // 可能提前离开
        if (Math.random() < 0.3) {  // 30%概率被吓跑
            setTimeout(() => {
                if (this._isWaiting) {
                    this.leaveEarly();
                }
            }, 1000);
        }
        
        // 发送微恐事件
        EventManager.instance.emit('customer_scared', {
            customerId: this.node.uuid,
            type: this.customerType
        });
    }
    
    /**
     * 播放害怕动画
     */
    private playScareAnimation() {
        tween(this.node)
            .by(0.1, { position: new Vec3(5, 0, 0) })
            .by(0.1, { position: new Vec3(-10, 0, 0) })
            .by(0.1, { position: new Vec3(5, 0, 0) })
            .union()
            .repeat(3)
            .start();
    }
    
    /**
     * 显示不耐烦
     */
    private showImpatience() {
        // 抖动动画
        tween(this.node)
            .by(0.05, { position: new Vec3(3, 0, 0) })
            .by(0.05, { position: new Vec3(-3, 0, 0) })
            .repeat(3)
            .start();
        
        // 气泡变化
        if (this.thoughtBubble) {
            tween(this.thoughtBubble)
                .to(0.2, { scale: new Vec3(1.1, 1.1, 1) })
                .to(0.2, { scale: new Vec3(1, 1, 1) })
                .repeat(2)
                .start();
        }
    }
    
    /**
     * 顾客变得生气
     */
    private becomeAngry() {
        if (this._isAngry || this._isServed || this._isLeaving) return;
        
        this._isAngry = true;
        
        // 更新外观
        if (this.customerSprite && this.angrySprite) {
            this.customerSprite.spriteFrame = this.angrySprite;
        }
        
        // 生气动画
        this.playAngryAnimation();
        
        // 发送生气事件
        EventManager.instance.emit(EventManager.Events.CUSTOMER_ANGRY, {
            customerId: this.node.uuid,
            waitTime: (Date.now() - this._waitStartTime) / 1000
        });
        
        console.log('顾客生气了！');
        
        // 延迟离开
        setTimeout(() => {
            this.leave();
        }, 2000);
    }
    
    /**
     * 播放生气动画
     */
    private playAngryAnimation() {
        // 放大缩小动画
        tween(this.node)
            .to(0.2, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .repeat(2)
            .start();
    }
    
    /**
     * 提前离开（被吓跑）
     */
    private leaveEarly() {
        this._isLeaving = true;
        this._isWaiting = false;
        
        // 发送被吓跑事件
        EventManager.instance.emit('customer_scared_away', {
            customerId: this.node.uuid,
            type: this.customerType
        });
        
        this.leave();
    }
    
    /**
     * 服务顾客
     * @param coffeeType 提供的咖啡类型
     */
    public serve(coffeeType: string) {
        if (this._isServed || this._isLeaving || !this._isWaiting) return;
        
        this._isServed = true;
        this._isWaiting = false;
        
        // 检查是否给对了咖啡
        const isCorrect = coffeeType === this.orderType;
        
        if (isCorrect) {
            this.becomeHappy();
            this.calculateReward();
        } else {
            this.becomeAngry();  // 给错了咖啡，顾客生气
        }
        
        // 隐藏订单
        if (this.thoughtBubble) {
            this.thoughtBubble.active = false;
        }
        
        // 发送服务事件
        EventManager.instance.emit(EventManager.Events.CUSTOMER_SERVED, {
            customerId: this.node.uuid,
            orderType: this.orderType,
            servedType: coffeeType,
            isCorrect: isCorrect,
            reward: isCorrect ? this._orderValue : 0
        });
        
        console.log(`服务顾客，${isCorrect ? '正确' : '错误'}，订单: ${this.orderType}，提供: ${coffeeType}`);
        
        // 延迟离开
        setTimeout(() => {
            this.leave();
        }, isCorrect ? 2000 : 1000);
    }
    
    /**
     * 顾客变得开心
     */
    private becomeHappy() {
        // 更新外观
        if (this.customerSprite && this.happySprite) {
            this.customerSprite.spriteFrame = this.happySprite;
        }
        
        // 开心动画
        this.playHappyAnimation();
    }
    
    /**
     * 播放开心动画
     */
    private playHappyAnimation() {
        // 跳跃动画
        tween(this.node)
            .by(0.2, { position: new Vec3(0, 20, 0) })
            .by(0.2, { position: new Vec3(0, -20, 0) })
            .start();
        
        // 显示金币动画
        this.showCoinAnimation();
    }
    
    /**
     * 显示金币动画
     */
    private showCoinAnimation() {
        // 这里可以创建一个金币飞出的动画
        // 暂时用简单的缩放代替
        if (this.thoughtBubble) {
            this.thoughtBubble.active = true;
            this.orderLabel.string = `+${this._orderValue}金币`;
            
            tween(this.thoughtBubble)
                .to(0.5, { scale: new Vec3(1.3, 1.3, 1) })
                .to(0.5, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }
    
    /**
     * 计算奖励
     */
    private calculateReward() {
        // 基础奖励
        this._orderValue = this.baseReward;
        
        // 根据等待时间调整（等待时间越短，奖励越高）
        const waitTime = (Date.now() - this._waitStartTime) / 1000;
        const waitRatio = Math.max(0, 1 - (waitTime / this.patienceTime));
        
        this._orderValue = Math.floor(this._orderValue * (0.8 + waitRatio * 0.4));
        
        // 小费
        if (Math.random() < this.tipChance) {
            const tip = Math.floor(this._orderValue * 0.3);
            this._orderValue += tip;
            console.log(`获得小费: ${tip}金币`);
        }
        
        // VIP顾客额外奖励
        if (this.customerType === Customer.CustomerTypes.VIP) {
            this._orderValue *= 2;
        }
    }
    
    /**
     * 顾客离开
     */
    public leave() {
        if (this._isLeaving) return;
        
        this._isLeaving = true;
        this._isWaiting = false;
        
        // 离开动画
        this.playLeaveAnimation();
        
        // 发送离开事件
        EventManager.instance.emit(EventManager.Events.CUSTOMER_LEFT, {
            customerId: this.node.uuid,
            type: this.customerType,
            served: this._isServed,
            angry: this._isAngry
        });
        
        console.log('顾客离开');
    }
    
    /**
     * 播放离开动画
     */
    private playLeaveAnimation() {
        const exitPos = new Vec3(-200, this.node.position.y, 0);
        
        tween(this.node)
            .to(1.0, { position: exitPos }, {
                onComplete: () => {
                    this.destroyCustomer();
                }
            })
            .start();
    }
    
    /**
     * 销毁顾客
     */
    private destroyCustomer() {
        EventManager.instance.emit('customer_destroyed', {
            customerId: this.node.uuid
        });
        
        this.node.destroy();
    }
    
    /**
     * 更新视觉状态
     */
    private updateVisual() {
        if (!this.customerSprite) return;
        
        if (this._isAngry && this.angrySprite) {
            this.customerSprite.spriteFrame = this.angrySprite;
        } else if (this._isScared && this.scaredSprite) {
            this.customerSprite.spriteFrame = this.scaredSprite;
        } else if (this.normalSprite) {
            this.customerSprite.spriteFrame = this.normalSprite;
        }
    }
    
    /**
     * 获取订单类型
     */
    public getOrderType(): string {
        return this.orderType;
    }
    
    /**
     * 是否正在等待
     */
    public isWaiting(): boolean {
        return this._isWaiting;
    }
    
    /**
     * 是否已被服务
     */
    public isServed(): boolean {
        return this._isServed;
    }
    
    /**
     * 是否生气
     */
    public isAngry(): boolean {
        return this._isAngry;
    }
    
    /**
     * 获取订单价值
     */
    public getOrderValue(): number {
        return this._orderValue;
    }
    
    /**
     * 获取剩余耐心百分比
     */
    public getPatiencePercent(): number {
        return this._currentPatience / this.patienceTime;
    }
    
    /**
     * 静态方法：创建随机顾客
     */
    public static createRandomCustomer(): any {
        const types = Object.values(Customer.CustomerTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        const orders = ['espresso', 'latte', 'cappuccino', 'mocha', 'americano'];
        const randomOrder = orders[Math.floor(Math.random() * orders.length)];
        
        return {
            type: randomType,
            order: randomOrder,
            patience: 20 + Math.random() * 20,  // 20-40秒耐心
            reward: 10 + Math.floor(Math.random() * 20)  // 10-30金币
        };
    }
    
    onDestroy() {
        // 清理所有动画
        tween(this.node).stop();
        if (this.thoughtBubble) {
            tween(this.thoughtBubble).stop();
        }
    }
}