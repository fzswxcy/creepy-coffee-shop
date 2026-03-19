/**
 * 主场景UI控制器
 * 连接游戏逻辑系统和UI界面，提供完整的用户交互体验
 */

import { _decorator, Component, Node, Label, ProgressBar, Button, Sprite, EditBox, Widget, Layout, Color, tween, Vec3, UIOpacity } from 'cc';
import { economyManager } from '../managers/EconomyManager';
import { mainGameLoop } from '../game/MainGameLoop';
import { coffeeRecipeManager } from '../game/CoffeeRecipeManager';
import { customerServiceSystem } from '../game/CustomerServiceSystem';
const { ccclass, property } = _decorator;

/**
 * UI状态
 */
enum UIState {
    MAIN = 'main',
    COFFEE_MAKING = 'coffee_making',
    CUSTOMER_SERVING = 'customer_serving',
    RECIPE_BOOK = 'recipe_book',
    UPGRADES = 'upgrades',
    SETTINGS = 'settings'
}

/**
 * 顾客卡片数据
 */
interface CustomerCardData {
    customerId: string;
    customerType: string;
    coffeeOrder: string;
    waitTime: number;
    specialRequests?: string[];
}

@ccclass('MainSceneUIController')
export class MainSceneUIController extends Component {
    // ==================== 主UI组件 ====================
    @property(Node)
    private mainUIRoot: Node | null = null;
    
    @property(Node)
    private coffeeMakingUI: Node | null = null;
    
    @property(Node)
    private customerServingUI: Node | null = null;
    
    @property(Node)
    private recipeBookUI: Node | null = null;
    
    @property(Node)
    private upgradesUI: Node | null = null;
    
    @property(Node)
    private settingsUI: Node | null = null;
    
    // ==================== 顶部状态栏 ====================
    @property(Label)
    private goldLabel: Label | null = null;
    
    @property(Label)
    private energyLabel: Label | null = null;
    
    @property(ProgressBar)
    private energyBar: ProgressBar | null = null;
    
    @property(Label)
    private satisfactionLabel: Label | null = null;
    
    @property(Label)
    private timeLabel: Label | null = null;
    
    @property(Label)
    private dayLabel: Label | null = null;
    
    @property(Label)
    private queueCountLabel: Label | null = null;
    
    // ==================== 功能按钮 ====================
    @property(Button)
    private makeCoffeeButton: Button | null = null;
    
    @property(Button)
    private serveCustomersButton: Button | null = null;
    
    @property(Button)
    private recipeBookButton: Button | null = null;
    
    @property(Button)
    private upgradesButton: Button | null = null;
    
    @property(Button)
    private settingsButton: Button | null = null;
    
    @property(Button)
    private pauseButton: Button | null = null;
    
    @property(Button)
    private speedButton: Button | null = null;
    
    // ==================== 顾客队列UI ====================
    @property(Node)
    private customerQueueContainer: Node | null = null;
    
    @property(Node)
    private customerCardTemplate: Node | null = null;
    
    @property(Label)
    private emptyQueueLabel: Label | null = null;
    
    // ==================== 配方选择UI ====================
    @property(Node)
    private recipeGridContainer: Node | null = null;
    
    @property(Node)
    private recipeCardTemplate: Node | null = null;
    
    // ==================== 制作进度UI ====================
    @property(Node)
    private makingProgressUI: Node | null = null;
    
    @property(ProgressBar)
    private makingProgressBar: ProgressBar | null = null;
    
    @property(Label)
    private makingRecipeLabel: Label | null = null;
    
    @property(Label)
    private makingTimeLabel: Label | null = null;
    
    // 当前UI状态
    private currentUIState: UIState = UIState.MAIN;
    
    // 顾客卡片池
    private customerCardPool: Node[] = [];
    private activeCustomerCards: Map<string, Node> = new Map();
    
    // 配方卡片池
    private recipeCardPool: Node[] = [];
    private activeRecipeCards: Map<string, Node> = new Map();
    
    // 当前制作的配方
    private currentMakingRecipe: string | null = null;
    private makingStartTime: number = 0;
    private makingTotalTime: number = 0;
    
    onLoad() {
        this.initializeUI();
        this.setupEventListeners();
        this.startUIUpdateLoop();
    }
    
    /**
     * 初始化UI
     */
    private initializeUI() {
        console.log('🎨 主场景UI控制器初始化');
        
        // 隐藏所有子UI，只显示主UI
        this.hideAllSubUIs();
        this.showMainUI();
        
        // 初始化顾客卡片池
        this.initializeCustomerCardPool();
        
        // 初始化配方卡片池
        this.initializeRecipeCardPool();
        
        // 更新初始UI状态
        this.updateTopStatusBar();
        this.updateCustomerQueueDisplay();
        this.updateRecipeGrid();
    }
    
    /**
     * 隐藏所有子UI
     */
    private hideAllSubUIs() {
        const subUIs = [
            this.coffeeMakingUI,
            this.customerServingUI,
            this.recipeBookUI,
            this.upgradesUI,
            this.settingsUI,
            this.makingProgressUI
        ];
        
        subUIs.forEach(ui => {
            if (ui) {
                ui.active = false;
            }
        });
    }
    
    /**
     * 显示主UI
     */
    private showMainUI() {
        if (this.mainUIRoot) {
            this.mainUIRoot.active = true;
        }
        
        this.currentUIState = UIState.MAIN;
    }
    
    /**
     * 初始化顾客卡片池
     */
    private initializeCustomerCardPool() {
        if (!this.customerCardTemplate) return;
        
        // 创建10个顾客卡片备用
        for (let i = 0; i < 10; i++) {
            const card = this.instantiateCustomerCard();
            if (card) {
                this.customerCardPool.push(card);
            }
        }
        
        console.log(`🎴 初始化顾客卡片池: ${this.customerCardPool.length} 张卡片`);
    }
    
    /**
     * 实例化顾客卡片
     */
    private instantiateCustomerCard(): Node | null {
        if (!this.customerCardTemplate || !this.customerQueueContainer) {
            return null;
        }
        
        const card = this.customerCardTemplate.clone();
        card.parent = this.customerQueueContainer;
        card.active = false;
        
        return card;
    }
    
    /**
     * 初始化配方卡片池
     */
    private initializeRecipeCardPool() {
        if (!this.recipeCardTemplate) return;
        
        // 获取所有解锁的配方
        const unlockedRecipes = coffeeRecipeManager.getUnlockedRecipes();
        
        // 为每个解锁的配方创建一个卡片
        unlockedRecipes.forEach(recipe => {
            const card = this.instantiateRecipeCard();
            if (card) {
                this.setupRecipeCard(card, recipe);
                this.recipeCardPool.push(card);
                this.activeRecipeCards.set(recipe.id, card);
            }
        });
        
        console.log(`📋 初始化配方卡片池: ${this.recipeCardPool.length} 张卡片`);
    }
    
    /**
     * 实例化配方卡片
     */
    private instantiateRecipeCard(): Node | null {
        if (!this.recipeCardTemplate || !this.recipeGridContainer) {
            return null;
        }
        
        const card = this.recipeCardTemplate.clone();
        card.parent = this.recipeGridContainer;
        card.active = true;
        
        return card;
    }
    
    /**
     * 设置配方卡片
     */
    private setupRecipeCard(card: Node, recipe: any) {
        // 获取卡片组件
        const nameLabel = card.getChildByName('RecipeName')?.getComponent(Label);
        const priceLabel = card.getChildByName('RecipePrice')?.getComponent(Label);
        const timeLabel = card.getChildByName('RecipeTime')?.getComponent(Label);
        const energyLabel = card.getChildByName('RecipeEnergy')?.getComponent(Label);
        const makeButton = card.getChildByName('MakeButton')?.getComponent(Button);
        const spookyIcon = card.getChildByName('SpookyIcon');
        
        if (nameLabel) {
            nameLabel.string = recipe.displayName || recipe.name;
        }
        
        if (priceLabel) {
            const price = coffeeRecipeManager.getRecipePrice(recipe.id);
            priceLabel.string = `💰 ${price}`;
        }
        
        if (timeLabel) {
            const time = coffeeRecipeManager.getRecipeTime(recipe.id);
            timeLabel.string = `⏱ ${time}s`;
        }
        
        if (energyLabel) {
            energyLabel.string = `⚡ ${recipe.energyCost}`;
        }
        
        if (spookyIcon) {
            spookyIcon.active = !!recipe.spookyConfig?.isSpooky;
        }
        
        // 设置制作按钮点击事件
        if (makeButton) {
            makeButton.node.on('click', () => {
                this.startMakingCoffee(recipe.id);
            });
        }
        
        // 添加点击查看详情
        card.on('click', () => {
            this.showRecipeDetails(recipe.id);
        });
    }
    
    /**
     * 设置事件监听器
     */
    private setupEventListeners() {
        // 功能按钮事件
        if (this.makeCoffeeButton) {
            this.makeCoffeeButton.node.on('click', () => {
                this.switchToCoffeeMakingUI();
            });
        }
        
        if (this.serveCustomersButton) {
            this.serveCustomersButton.node.on('click', () => {
                this.switchToCustomerServingUI();
            });
        }
        
        if (this.recipeBookButton) {
            this.recipeBookButton.node.on('click', () => {
                this.switchToRecipeBookUI();
            });
        }
        
        if (this.upgradesButton) {
            this.upgradesButton.node.on('click', () => {
                this.switchToUpgradesUI();
            });
        }
        
        if (this.settingsButton) {
            this.settingsButton.node.on('click', () => {
                this.switchToSettingsUI();
            });
        }
        
        if (this.pauseButton) {
            this.pauseButton.node.on('click', () => {
                mainGameLoop.togglePause();
                this.updatePauseButtonState();
            });
        }
        
        if (this.speedButton) {
            this.speedButton.node.on('click', () => {
                mainGameLoop.toggleGameSpeed();
                this.updateSpeedButtonState();
            });
        }
    }
    
    /**
     * 开始UI更新循环
     */
    private startUIUpdateLoop() {
        // 每秒更新一次UI
        this.schedule(this.updateUI, 1.0);
    }
    
    /**
     * 更新UI
     */
    private updateUI() {
        this.updateTopStatusBar();
        this.updateCustomerQueueDisplay();
        this.updateMakingProgress();
    }
    
    /**
     * 更新顶部状态栏
     */
    private updateTopStatusBar() {
        // 更新金币
        if (this.goldLabel) {
            this.goldLabel.string = `💰 ${economyManager.getGold()}`;
        }
        
        // 更新能量
        if (this.energyLabel) {
            this.energyLabel.string = `⚡ ${Math.floor(economyManager.getEnergy())}`;
        }
        
        if (this.energyBar) {
            this.energyBar.progress = economyManager.getEnergy() / 100;
        }
        
        // 更新满意度
        if (this.satisfactionLabel) {
            const stats = customerServiceSystem.getServiceStats();
            this.satisfactionLabel.string = `😊 ${stats.averageSatisfaction}%`;
        }
        
        // 更新排队人数
        if (this.queueCountLabel) {
            const activeOrders = customerServiceSystem.getActiveOrders();
            this.queueCountLabel.string = `👥 ${activeOrders.length}`;
        }
    }
    
    /**
     * 更新顾客队列显示
     */
    private updateCustomerQueueDisplay() {
        const activeOrders = customerServiceSystem.getActiveOrders();
        
        // 显示/隐藏空队列提示
        if (this.emptyQueueLabel) {
            this.emptyQueueLabel.active = activeOrders.length === 0;
        }
        
        // 更新现有卡片或创建新卡片
        activeOrders.forEach(order => {
            if (!this.activeCustomerCards.has(order.customerId)) {
                this.createCustomerCard(order);
            } else {
                this.updateCustomerCard(order);
            }
        });
        
        // 移除已离开的顾客卡片
        const activeCustomerIds = new Set(activeOrders.map(o => o.customerId));
        const cardsToRemove: string[] = [];
        
        this.activeCustomerCards.forEach((card, customerId) => {
            if (!activeCustomerIds.has(customerId)) {
                this.recycleCustomerCard(card, customerId);
                cardsToRemove.push(customerId);
            }
        });
        
        cardsToRemove.forEach(customerId => {
            this.activeCustomerCards.delete(customerId);
        });
        
        // 更新卡片位置
        this.layoutCustomerCards();
    }
    
    /**
     * 创建顾客卡片
     */
    private createCustomerCard(order: any) {
        let card: Node;
        
        // 从池中获取或创建新卡片
        if (this.customerCardPool.length > 0) {
            card = this.customerCardPool.pop()!;
        } else {
            card = this.instantiateCustomerCard()!;
        }
        
        if (!card) return;
        
        // 设置卡片数据
        this.setupCustomerCard(card, order);
        
        // 添加到活跃卡片
        card.active = true;
        this.activeCustomerCards.set(order.customerId, card);
    }
    
    /**
     * 设置顾客卡片
     */
    private setupCustomerCard(card: Node, order: any) {
        // 获取UI组件
        const customerTypeLabel = card.getChildByName('CustomerType')?.getComponent(Label);
        const coffeeOrderLabel = card.getChildByName('CoffeeOrder')?.getComponent(Label);
        const waitTimeLabel = card.getChildByName('WaitTime')?.getComponent(Label);
        const specialRequestLabel = card.getChildByName('SpecialRequest')?.getComponent(Label);
        const patienceBar = card.getChildByName('PatienceBar')?.getComponent(ProgressBar);
        const serveButton = card.getChildByName('ServeButton')?.getComponent(Button);
        const customerIcon = card.getChildByName('CustomerIcon')?.getComponent(Sprite);
        
        // 获取配方信息
        const recipe = coffeeRecipeManager.getRecipeById(order.coffeeId);
        
        // 设置顾客类型图标和文本
        if (customerTypeLabel) {
            let typeIcon = '👤';
            if (order.customerType === 'vip') typeIcon = '👑';
            if (order.customerType === 'spooky') typeIcon = '👻';
            if (order.customerType === 'ghost') typeIcon = '👻';
            if (order.customerType === 'vampire') typeIcon = '🧛';
            if (order.customerType === 'special') typeIcon = '🎁';
            
            customerTypeLabel.string = typeIcon;
        }
        
        // 设置咖啡订单
        if (coffeeOrderLabel && recipe) {
            coffeeOrderLabel.string = recipe.displayName || recipe.name;
        }
        
        // 设置特殊要求
        if (specialRequestLabel && order.specialRequests && order.specialRequests.length > 0) {
            specialRequestLabel.string = `💬 ${order.specialRequests[0]}`;
            specialRequestLabel.node.active = true;
        } else if (specialRequestLabel) {
            specialRequestLabel.node.active = false;
        }
        
        // 设置服务按钮
        if (serveButton) {
            serveButton.node.on('click', () => {
                this.serveCustomer(order.customerId);
            });
        }
        
        // 设置耐心条
        if (patienceBar) {
            const remainingTime = customerServiceSystem.getOrderRemainingTime(order.customerId);
            const patienceRatio = remainingTime / order.waitPatience;
            patienceBar.progress = patienceRatio;
            
            // 根据耐心设置颜色
            if (patienceRatio < 0.3) {
                patienceBar.barSprite.color = Color.RED;
            } else if (patienceRatio < 0.6) {
                patienceBar.barSprite.color = Color.YELLOW;
            } else {
                patienceBar.barSprite.color = Color.GREEN;
            }
        }
        
        // 更新等待时间
        this.updateCustomerWaitTime(card, order.customerId);
    }
    
    /**
     * 更新顾客卡片
     */
    private updateCustomerCard(order: any) {
        const card = this.activeCustomerCards.get(order.customerId);
        if (!card) return;
        
        this.updateCustomerWaitTime(card, order.customerId);
    }
    
    /**
     * 更新顾客等待时间
     */
    private updateCustomerWaitTime(card: Node, customerId: string) {
        const waitTimeLabel = card.getChildByName('WaitTime')?.getComponent(Label);
        const patienceBar = card.getChildByName('PatienceBar')?.getComponent(ProgressBar);
        
        if (waitTimeLabel) {
            const remainingTime = customerServiceSystem.getOrderRemainingTime(customerId);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = Math.floor(remainingTime % 60);
            waitTimeLabel.string = `⏱ ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (patienceBar) {
            const order = customerServiceSystem.getActiveOrders().find(o => o.customerId === customerId);
            if (order) {
                const remainingTime = customerServiceSystem.getOrderRemainingTime(customerId);
                const patienceRatio = remainingTime / order.waitPatience;
                patienceBar.progress = patienceRatio;
            }
        }
    }
    
    /**
     * 回收顾客卡片
     */
    private recycleCustomerCard(card: Node, customerId: string) {
        card.active = false;
        
        // 移除所有事件监听器
        card.removeAllChildren();
        
        // 放回池中
        this.customerCardPool.push(card);
    }
    
    /**
     * 布局顾客卡片
     */
    private layoutCustomerCards() {
        if (!this.customerQueueContainer) return;
        
        const cards = Array.from(this.activeCustomerCards.values());
        const cardHeight = 120;
        const spacing = 10;
        
        cards.forEach((card, index) => {
            const yPos = -index * (cardHeight + spacing);
            
            tween(card)
                .to(0.3, { position: new Vec3(0, yPos, 0) })
                .start();
        });
    }
    
    /**
     * 更新配方网格
     */
    private updateRecipeGrid() {
        // 获取所有解锁的配方
        const unlockedRecipes = coffeeRecipeManager.getUnlockedRecipes();
        
        // 更新或创建配方卡片
        unlockedRecipes.forEach(recipe => {
            if (!this.activeRecipeCards.has(recipe.id)) {
                const card = this.instantiateRecipeCard();
                if (card) {
                    this.setupRecipeCard(card, recipe);
                    this.activeRecipeCards.set(recipe.id, card);
                }
            }
        });
    }
    
    /**
     * 切换至咖啡制作UI
     */
    private switchToCoffeeMakingUI() {
        this.hideAllSubUIs();
        
        if (this.coffeeMakingUI) {
            this.coffeeMakingUI.active = true;
        }
        
        this.currentUIState = UIState.COFFEE_MAKING;
        this.updateRecipeGrid();
    }
    
    /**
     * 切换至顾客服务UI
     */
    private switchToCustomerServingUI() {
        this.hideAllSubUIs();
        
        if (this.customerServingUI) {
            this.customerServingUI.active = true;
        }
        
        this.currentUIState = UIState.CUSTOMER_SERVING;
        this.updateCustomerQueueDisplay();
    }
    
    /**
     * 切换至配方书UI
     */
    private switchToRecipeBookUI() {
        this.hideAllSubUIs();
        
        if (this.recipeBookUI) {
            this.recipeBookUI.active = true;
        }
        
        this.currentUIState = UIState.RECIPE_BOOK;
        this.updateRecipeGrid();
    }
    
    /**
     * 切换至升级UI
     */
    private switchToUpgradesUI() {
        this.hideAllSubUIs();
        
        if (this.upgradesUI) {
            this.upgradesUI.active = true;
        }
        
        this.currentUIState = UIState.UPGRADES;
    }
    
    /**
     * 切换至设置UI
     */
    private switchToSettingsUI() {
        this.hideAllSubUIs();
        
        if (this.settingsUI) {
            this.settingsUI.active = true;
        }
        
        this.currentUIState = UIState.SETTINGS;
    }
    
    /**
     * 开始制作咖啡
     */
    private startMakingCoffee(recipeId: string) {
        const recipe = coffeeRecipeManager.getRecipeById(recipeId);
        if (!recipe) {
            console.error(`❌ 配方不存在: ${recipeId}`);
            return;
        }
        
        // 检查能量
        if (economyManager.getEnergy() < recipe.energyCost) {
            console.log('⚠️ 能量不足，无法制作咖啡');
            // TODO: 显示能量不足提示
            return;
        }
        
        // 设置当前制作的配方
        this.currentMakingRecipe = recipeId;
        this.makingStartTime = Date.now();
        this.makingTotalTime = coffeeRecipeManager.getRecipeTime(recipeId) * 1000; // 转换为毫秒
        
        // 显示制作进度UI
        if (this.makingProgressUI) {
            this.makingProgressUI.active = true;
        }
        
        // 更新制作进度UI
        if (this.makingRecipeLabel) {
            this.makingRecipeLabel.string = recipe.displayName || recipe.name;
        }
        
        // 开始制作进度更新
        this.schedule(this.updateMakingProgress, 0.1);
        
        console.log(`☕ 开始制作: ${recipe.displayName}`);
    }
    
    /**
     * 更新制作进度
     */
    private updateMakingProgress() {
        if (!this.currentMakingRecipe || !this.makingProgressUI || !this.makingProgressUI.active) {
            return;
        }
        
        const elapsedTime = Date.now() - this.makingStartTime;
        const progress = Math.min(elapsedTime / this.makingTotalTime, 1);
        
        // 更新进度条
        if (this.makingProgressBar) {
            this.makingProgressBar.progress = progress;
        }
        
        // 更新剩余时间
        if (this.makingTimeLabel) {
            const remainingTime = Math.max(0, this.makingTotalTime - elapsedTime);
            const seconds = Math.ceil(remainingTime / 1000);
            this.makingTimeLabel.string = `${seconds}s`;
        }
        
        // 检查是否完成
        if (progress >= 1) {
            this.finishMakingCoffee();
        }
    }
    
    /**
     * 完成制作咖啡
     */
    private finishMakingCoffee() {
        if (!this.currentMakingRecipe) return;
        
        // 计算质量分数（这里简化处理，实际应该有更复杂的质量计算）
        const qualityScore = 70 + Math.random() * 30; // 70-100分
        
        // 通知游戏循环
        mainGameLoop.onCoffeeMade(this.currentMakingRecipe, qualityScore);
        
        // 隐藏制作进度UI
        if (this.makingProgressUI) {
            this.makingProgressUI.active = false;
        }
        
        // 重置制作状态
        this.currentMakingRecipe = null;
        this.unschedule(this.updateMakingProgress);
        
        // 显示制作完成提示
        this.showCoffeeMadeNotification(qualityScore);
        
        console.log(`✅ 咖啡制作完成，质量: ${qualityScore.toFixed(1)}`);
    }
    
    /**
     * 显示咖啡制作完成通知
     */
    private showCoffeeMadeNotification(qualityScore: number) {
        // TODO: 实现制作完成提示动画
        console.log(`🎉 制作完成！质量评分: ${qualityScore.toFixed(1)}/100`);
    }
    
    /**
     * 服务顾客
     */
    private serveCustomer(customerId: string) {
        // 检查是否有制作好的咖啡
        if (!this.currentMakingRecipe) {
            console.log('⚠️ 请先制作咖啡');
            // TODO: 显示提示消息
            return;
        }
        
        // 获取咖啡质量（这里简化，实际应该保存制作时的质量）
        const qualityScore = 80 + Math.random() * 20; // 80-100分
        
        // 通知游戏循环提供服务
        mainGameLoop.onCoffeeMade(this.currentMakingRecipe, qualityScore);
        
        // 重置当前制作的咖啡
        this.currentMakingRecipe = null;
        
        console.log(`👤 服务顾客: ${customerId}`);
    }
    
    /**
     * 显示配方详情
     */
    private showRecipeDetails(recipeId: string) {
        const recipe = coffeeRecipeManager.getRecipeById(recipeId);
        if (!recipe) return;
        
        // TODO: 实现配方详情弹窗
        console.log(`📖 查看配方详情: ${recipe.name}`);
    }
    
    /**
     * 更新暂停按钮状态
     */
    private updatePauseButtonState() {
        // TODO: 根据游戏状态更新按钮文本和样式
    }
    
    /**
     * 更新速度按钮状态
     */
    private updateSpeedButtonState() {
        // TODO: 根据游戏速度更新按钮文本
    }
    
    /**
     * 返回主UI
     */
    public backToMainUI() {
        this.hideAllSubUIs();
        this.showMainUI();
    }
}

export const mainSceneUIController = new MainSceneUIController();