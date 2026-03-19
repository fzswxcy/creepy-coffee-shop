/**
 * 主场景UI控制器
 * 负责主场景的界面交互逻辑
 */

import { _decorator, Component, Node, Label, Sprite, Button, ProgressBar, tween, Vec3, Color } from 'cc';
import { economyManager } from '../managers/EconomyManager';
import { customerManager } from '../managers/CustomerManager';
import { coffeeProductionManager } from '../managers/CoffeeProductionManager';
import { adManager } from '../managers/AdManager';

const { ccclass, property } = _decorator;

@ccclass('MainSceneUI')
export class MainSceneUI extends Component {
    // 顶部状态栏
    @property(Label)
    private goldLabel: Label | null = null;
    
    @property(Label)
    private levelLabel: Label | null = null;
    
    @property(Label)
    private energyLabel: Label | null = null;
    
    @property(Label)
    private timeLabel: Label | null = null;
    
    // 咖啡厅经营区域
    @property(Node)
    private coffeeShopArea: Node | null = null;
    
    @property(Sprite)
    private coffeeMachineSprite: Sprite | null = null;
    
    @property(Node)
    private cashRegisterNode: Node | null = null;
    
    // 顾客等待区
    @property(Node)
    private customerWaitingArea: Node | null = null;
    
    @property(Node)
    private customerSpawnPoint: Node | null = null;
    
    // 底部功能栏
    @property(Button)
    private menuButton: Button | null = null;
    
    @property(Button)
    private makeCoffeeButton: Button | null = null;
    
    @property(Button)
    private customerButton: Button | null = null;
    
    @property(Button)
    private upgradeButton: Button | null = null;
    
    @property(Button)
    private storeButton: Button | null = null;
    
    // 变现区域
    @property(Button)
    private watchAdButton: Button | null = null;
    
    @property(Button)
    private buyPremiumButton: Button | null = null;
    
    @property(Node)
    private adRewardPopup: Node | null = null;
    
    // 微恐元素
    @property(Node)
    private spookyDecorations: Node[] = [];
    
    @property(Node)
    private ghostCustomerPrefab: Node | null = null;
    
    // 私有变量
    private currentEnergy: number = 100;
    private maxEnergy: number = 100;
    private energyRechargeRate: number = 0.1; // 每帧恢复的能量
    private gameTime: number = 0;
    private isCoffeeMaking: boolean = false;
    private coffeeMakeProgress: number = 0;
    private activeCustomers: Node[] = [];
    
    onLoad() {
        this.initializeUI();
        this.setupEventListeners();
        this.startGameLoop();
    }
    
    /**
     * 初始化UI界面
     */
    private initializeUI(): void {
        this.updateGoldDisplay();
        this.updateEnergyDisplay();
        this.updateTimeDisplay();
        
        // 设置等级显示
        if (this.levelLabel) {
            this.levelLabel.string = 'Lv.1';
        }
        
        // 初始隐藏一些元素
        if (this.adRewardPopup) {
            this.adRewardPopup.active = false;
        }
    }
    
    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        if (this.menuButton) {
            this.menuButton.node.on('click', this.onMenuButtonClick, this);
        }
        
        if (this.makeCoffeeButton) {
            this.makeCoffeeButton.node.on('click', this.onMakeCoffeeButtonClick, this);
        }
        
        if (this.customerButton) {
            this.customerButton.node.on('click', this.onCustomerButtonClick, this);
        }
        
        if (this.upgradeButton) {
            this.upgradeButton.node.on('click', this.onUpgradeButtonClick, this);
        }
        
        if (this.storeButton) {
            this.storeButton.node.on('click', this.onStoreButtonClick, this);
        }
        
        if (this.watchAdButton) {
            this.watchAdButton.node.on('click', this.onWatchAdButtonClick, this);
        }
        
        if (this.buyPremiumButton) {
            this.buyPremiumButton.node.on('click', this.onBuyPremiumButtonClick, this);
        }
    }
    
    /**
     * 开始游戏主循环
     */
    private startGameLoop(): void {
        // 定时更新UI
        this.schedule(this.updateGameLoop, 0.1);
    }
    
    /**
     * 游戏主循环更新
     */
    private updateGameLoop(dt: number): void {
        this.gameTime += dt;
        this.updateTimeDisplay();
        
        // 能量恢复
        this.recoverEnergy(dt);
        
        // 顾客生成逻辑
        this.customerGenerationLogic(dt);
        
        // 咖啡制作进度更新
        if (this.isCoffeeMaking) {
            this.updateCoffeeMakingProgress(dt);
        }
    }
    
    /**
     * 更新金币显示
     */
    private updateGoldDisplay(): void {
        if (this.goldLabel && economyManager) {
            const gold = economyManager.getGold();
            this.goldLabel.string = `💰 ${gold}`;
        }
    }
    
    /**
     * 更新能量显示
     */
    private updateEnergyDisplay(): void {
        if (this.energyLabel) {
            this.energyLabel.string = `⚡ ${Math.floor(this.currentEnergy)}/${this.maxEnergy}`;
        }
    }
    
    /**
     * 更新时间显示
     */
    private updateTimeDisplay(): void {
        if (this.timeLabel) {
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = Math.floor(this.gameTime % 60);
            this.timeLabel.string = `🕐 ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * 能量恢复
     */
    private recoverEnergy(dt: number): void {
        if (this.currentEnergy < this.maxEnergy) {
            this.currentEnergy += this.energyRechargeRate * dt * 60; // 转换为每秒恢复
            if (this.currentEnergy > this.maxEnergy) {
                this.currentEnergy = this.maxEnergy;
            }
            this.updateEnergyDisplay();
        }
    }
    
    /**
     * 顾客生成逻辑
     */
    private customerGenerationLogic(dt: number): void {
        // 每10秒生成一个顾客的概率
        if (Math.random() < dt * 0.1 && this.customerWaitingArea && this.customerSpawnPoint) {
            this.spawnCustomer();
        }
        
        // 更新现有顾客的状态
        this.updateActiveCustomers(dt);
    }
    
    /**
     * 生成顾客
     */
    private spawnCustomer(): void {
        if (!this.ghostCustomerPrefab || !this.customerSpawnPoint) return;
        
        // 检查能量是否足够
        if (this.currentEnergy < 5) return;
        
        const customer = this.customerSpawnPoint.instantiate(this.ghostCustomerPrefab);
        if (customer && this.customerWaitingArea) {
            this.customerWaitingArea.addChild(customer);
            
            // 设置顾客属性
            const customerScript = customer.getComponent('Customer');
            if (customerScript) {
                customerScript.setOrder({
                    coffeeType: this.getRandomCoffeeType(),
                    waitTime: 30, // 30秒等待时间
                    reward: 50 // 50金币奖励
                });
            }
            
            this.activeCustomers.push(customer);
            
            // 消耗能量
            this.currentEnergy -= 5;
            this.updateEnergyDisplay();
            
            // 微恐效果：随机闪烁
            this.applySpookyEffect(customer);
        }
    }
    
    /**
     * 更新活跃顾客
     */
    private updateActiveCustomers(dt: number): void {
        for (let i = this.activeCustomers.length - 1; i >= 0; i--) {
            const customer = this.activeCustomers[i];
            const customerScript = customer.getComponent('Customer');
            
            if (customerScript) {
                customerScript.updateWaitTime(dt);
                
                // 检查顾客是否离开
                if (customerScript.shouldLeave()) {
                    this.removeCustomer(i);
                }
            }
        }
    }
    
    /**
     * 移除顾客
     */
    private removeCustomer(index: number): void {
        if (index >= 0 && index < this.activeCustomers.length) {
            const customer = this.activeCustomers[index];
            customer.removeFromParent();
            this.activeCustomers.splice(index, 1);
        }
    }
    
    /**
     * 获取随机咖啡类型
     */
    private getRandomCoffeeType(): string {
        const coffeeTypes = ['Espresso', 'Latte', 'Cappuccino', 'Americano', 'Mocha'];
        return coffeeTypes[Math.floor(Math.random() * coffeeTypes.length)];
    }
    
    /**
     * 应用微恐效果
     */
    private applySpookyEffect(node: Node): void {
        tween(node)
            .to(0.2, { opacity: 100 })
            .to(0.2, { opacity: 255 })
            .repeat(2)
            .start();
    }
    
    /**
     * 更新咖啡制作进度
     */
    private updateCoffeeMakingProgress(dt: number): void {
        this.coffeeMakeProgress += dt * 0.5; // 制作速度
        
        if (this.coffeeMakeProgress >= 1) {
            this.coffeeMakeProgress = 1;
            this.completeCoffeeMaking();
        }
    }
    
    /**
     * 完成咖啡制作
     */
    private completeCoffeeMaking(): void {
        this.isCoffeeMaking = false;
        this.coffeeMakeProgress = 0;
        
        // 奖励金币
        if (economyManager) {
            economyManager.addGold(25);
            this.updateGoldDisplay();
        }
        
        console.log('咖啡制作完成！获得25金币');
    }
    
    // ============== 按钮点击事件 ==============
    
    private onMenuButtonClick(): void {
        console.log('菜单按钮点击');
        // TODO: 打开菜单界面
    }
    
    private onMakeCoffeeButtonClick(): void {
        if (!this.isCoffeeMaking && this.currentEnergy >= 10) {
            this.isCoffeeMaking = true;
            this.currentEnergy -= 10;
            this.updateEnergyDisplay();
            console.log('开始制作咖啡...');
        } else if (this.currentEnergy < 10) {
            console.log('能量不足，无法制作咖啡');
        }
    }
    
    private onCustomerButtonClick(): void {
        console.log('顾客按钮点击');
        // 快速生成一个顾客
        this.spawnCustomer();
    }
    
    private onUpgradeButtonClick(): void {
        console.log('升级按钮点击');
        // TODO: 打开升级界面
    }
    
    private onStoreButtonClick(): void {
        console.log('商城按钮点击');
        // TODO: 打开商城界面
    }
    
    private onWatchAdButtonClick(): void {
        console.log('观看广告按钮点击');
        
        if (adManager) {
            adManager.showRewardedVideoAd((success: boolean) => {
                if (success && this.adRewardPopup) {
                    // 显示奖励弹窗
                    this.adRewardPopup.active = true;
                    
                    // 奖励能量
                    this.currentEnergy = Math.min(this.currentEnergy + 30, this.maxEnergy);
                    this.updateEnergyDisplay();
                    
                    // 3秒后隐藏弹窗
                    this.scheduleOnce(() => {
                        if (this.adRewardPopup) {
                            this.adRewardPopup.active = false;
                        }
                    }, 3);
                }
            });
        }
    }
    
    private onBuyPremiumButtonClick(): void {
        console.log('购买会员按钮点击');
        // TODO: 打开内购界面
    }
    
    /**
     * 服务顾客
     */
    public serveCustomer(customerNode: Node): boolean {
        const customerScript = customerNode.getComponent('Customer');
        if (!customerScript) return false;
        
        // 检查是否有制作好的咖啡
        if (!this.isCoffeeMaking && this.currentEnergy >= 10) {
            // 开始制作顾客需要的咖啡
            this.isCoffeeMaking = true;
            this.currentEnergy -= 10;
            this.updateEnergyDisplay();
            
            // 设置快速制作（因为顾客在等待）
            this.coffeeMakeProgress = 0.5; // 从50%开始
            
            console.log(`为顾客制作 ${customerScript.getOrder().coffeeType}...`);
            return true;
        }
        
        return false;
    }
}