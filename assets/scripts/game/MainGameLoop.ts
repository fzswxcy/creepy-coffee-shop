/**
 * 主游戏循环控制器
 * 整合所有游戏系统，控制游戏状态和流程
 */

import { _decorator, Component, Node, Label, ProgressBar, Button, Sprite, tween, director } from 'cc';
import { economyManager, EconomyManager } from '../managers/EconomyManager';
import { customerManager } from '../managers/CustomerManager';
import { coffeeProductionManager } from '../managers/CoffeeProductionManager';
import { coffeeRecipeManager } from './CoffeeRecipeManager';
import { customerServiceSystem, CustomerType } from './CustomerServiceSystem';
const { ccclass, property } = _decorator;

/**
 * 游戏状态
 */
export enum GameState {
    INITIALIZING = 'initializing',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'game_over',
    UPGRADING = 'upgrading',
    ACHIEVEMENT_UNLOCKED = 'achievement_unlocked'
}

/**
 * 游戏时间
 */
export interface GameTime {
    currentDay: number;
    currentHour: number;
    currentMinute: number;
    totalPlayTime: number; // 总游戏时间（秒）
    gameSpeed: number; // 游戏速度倍数
}

/**
 * 游戏统计数据
 */
export interface GameStats {
    totalRevenue: number;
    totalCustomers: number;
    totalCoffeeMade: number;
    averageSatisfaction: number;
    maxQueueLength: number;
    currentStreak: number; // 连续成功次数
    bestStreak: number;
    failures: number;
}

@ccclass('MainGameLoop')
export class MainGameLoop extends Component {
    // UI组件
    @property(Label)
    private gameTimeLabel: Label | null = null;
    
    @property(Label)
    private goldLabel: Label | null = null;
    
    @property(Label)
    private energyLabel: Label | null = null;
    
    @property(ProgressBar)
    private energyBar: ProgressBar | null = null;
    
    @property(Label)
    private satisfactionLabel: Label | null = null;
    
    @property(Label)
    private queueLabel: Label | null = null;
    
    @property(Label)
    private dayLabel: Label | null = null;
    
    @property(Button)
    private pauseButton: Button | null = null;
    
    @property(Button)
    private speedButton: Button | null = null;
    
    @property(Node)
    private pauseMenu: Node | null = null;
    
    // 游戏状态
    private gameState: GameState = GameState.INITIALIZING;
    private gameTime: GameTime = {
        currentDay: 1,
        currentHour: 8,
        currentMinute: 0,
        totalPlayTime: 0,
        gameSpeed: 1
    };
    
    private gameStats: GameStats = {
        totalRevenue: 0,
        totalCustomers: 0,
        totalCoffeeMade: 0,
        averageSatisfaction: 0,
        maxQueueLength: 0,
        currentStreak: 0,
        bestStreak: 0,
        failures: 0
    };
    
    // 游戏参数
    private readonly MAX_ENERGY = 100;
    private readonly ENERGY_RECHARGE_RATE = 1; // 每分钟恢复1点
    private readonly DAY_DURATION_MINUTES = 480; // 8小时游戏时间
    private readonly CLOSING_HOUR = 20; // 晚上8点关门
    
    // 顾客生成参数
    private customerSpawnRate: number = 2; // 每分钟生成顾客数
    private customerSpawnTimer: number = 0;
    
    // 游戏计时器
    private gameTimer: number = 0;
    private lastUpdateTime: number = 0;
    
    onLoad() {
        this.initializeGame();
    }
    
    /**
     * 初始化游戏
     */
    private initializeGame() {
        console.log('🎮 主游戏循环初始化');
        
        // 初始化经济系统
        economyManager.initialize(1000); // 初始1000金币
        
        // 初始化咖啡生产管理器
        coffeeProductionManager.initialize();
        
        // 初始化UI
        this.updateGameUI();
        
        // 开始游戏循环
        this.startGameLoop();
        
        // 设置UI事件监听
        this.setupUIListeners();
        
        // 保存初始游戏状态
        this.saveGameState();
    }
    
    /**
     * 开始游戏循环
     */
    private startGameLoop() {
        this.gameState = GameState.PLAYING;
        this.lastUpdateTime = Date.now();
        
        // 启动游戏循环定时器
        this.schedule(this.gameLoop, 0.1); // 每0.1秒更新一次
        
        // 启动游戏时间更新
        this.schedule(this.updateGameTime, 1.0); // 每秒更新游戏时间
        
        console.log('▶️ 游戏循环开始');
    }
    
    /**
     * 主游戏循环
     */
    private gameLoop() {
        if (this.gameState !== GameState.PLAYING) return;
        
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // 转换为秒
        this.lastUpdateTime = currentTime;
        
        // 更新游戏时间
        this.updateGameClock(deltaTime);
        
        // 生成顾客
        this.updateCustomerGeneration(deltaTime);
        
        // 更新顾客等待时间
        this.updateCustomerWaitTimes();
        
        // 更新能量恢复
        this.updateEnergyRecharge(deltaTime);
        
        // 更新游戏状态检查
        this.checkGameState();
        
        // 定期保存游戏状态
        this.gameTimer += deltaTime;
        if (this.gameTimer >= 30) { // 每30秒保存一次
            this.saveGameState();
            this.gameTimer = 0;
        }
    }
    
    /**
     * 更新游戏时钟
     */
    private updateGameClock(deltaTime: number) {
        // 增加游戏时间（根据游戏速度）
        const gameMinutesPassed = deltaTime * this.gameTime.gameSpeed;
        
        this.gameTime.totalPlayTime += deltaTime;
        this.gameTime.currentMinute += gameMinutesPassed;
        
        // 处理分钟进位
        if (this.gameTime.currentMinute >= 60) {
            this.gameTime.currentHour += Math.floor(this.gameTime.currentMinute / 60);
            this.gameTime.currentMinute %= 60;
            
            // 处理小时进位
            if (this.gameTime.currentHour >= 24) {
                this.gameTime.currentDay++;
                this.gameTime.currentHour %= 24;
                
                // 新的一天开始
                this.onNewDay();
            }
            
            // 检查是否营业时间结束
            if (this.gameTime.currentHour >= this.CLOSING_HOUR) {
                this.endBusinessDay();
            }
        }
        
        // 更新游戏时间显示
        this.updateTimeDisplay();
    }
    
    /**
     * 更新游戏时间显示
     */
    private updateTimeDisplay() {
        if (!this.gameTimeLabel) return;
        
        const hour = Math.floor(this.gameTime.currentHour);
        const minute = Math.floor(this.gameTime.currentMinute);
        
        this.gameTimeLabel.string = `营业时间: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        if (this.dayLabel) {
            this.dayLabel.string = `第 ${this.gameTime.currentDay} 天`;
        }
    }
    
    /**
     * 新的一天开始
     */
    private onNewDay() {
        console.log(`🌅 第 ${this.gameTime.currentDay} 天开始`);
        
        // 重置能量
        economyManager.setEnergy(this.MAX_ENERGY);
        
        // 更新顾客生成率（随天数增加）
        this.customerSpawnRate = 2 + (this.gameTime.currentDay - 1) * 0.5;
        this.customerSpawnRate = Math.min(this.customerSpawnRate, 10);
        
        // 生成每日任务
        this.generateDailyTasks();
        
        // 保存游戏进度
        this.saveGameState();
        
        // 触发新一天事件
        this.triggerNewDayEvents();
    }
    
    /**
     * 营业结束
     */
    private endBusinessDay() {
        console.log(`🏪 第 ${this.gameTime.currentDay} 天营业结束`);
        
        // 计算当日收益
        const dailyRevenue = economyManager.getDailyRevenue();
        console.log(`💰 当日收益: ${dailyRevenue} 金币`);
        
        // 保存当日统计数据
        this.saveDailyStats();
        
        // 显示收益总结
        this.showDailySummary();
        
        // 暂停游戏，等待玩家继续
        this.pauseGame();
    }
    
    /**
     * 生成每日任务
     */
    private generateDailyTasks() {
        // 生成3个每日任务
        const dailyTasks = [
            {
                id: `day${this.gameTime.currentDay}_task1`,
                description: `服务 ${Math.min(10 + this.gameTime.currentDay * 2, 30)} 位顾客`,
                target: 10 + this.gameTime.currentDay * 2,
                current: 0,
                reward: 100 * this.gameTime.currentDay,
                type: 'serve_customers'
            },
            {
                id: `day${this.gameTime.currentDay}_task2`,
                description: `赚取 ${500 + this.gameTime.currentDay * 200} 金币`,
                target: 500 + this.gameTime.currentDay * 200,
                current: 0,
                reward: 150 * this.gameTime.currentDay,
                type: 'earn_gold'
            },
            {
                id: `day${this.gameTime.currentDay}_task3`,
                description: `制作 ${3 + this.gameTime.currentDay} 杯微恐咖啡`,
                target: 3 + this.gameTime.currentDay,
                current: 0,
                reward: 200 * this.gameTime.currentDay,
                type: 'make_spooky_coffee'
            }
        ];
        
        // TODO: 保存每日任务到任务管理器
        console.log(`📝 生成 ${dailyTasks.length} 个每日任务`);
    }
    
    /**
     * 触发新一天事件
     */
    private triggerNewDayEvents() {
        // 随机事件（30%概率）
        if (Math.random() < 0.3) {
            const events = [
                'special_customer_day',
                'discount_day',
                'spooky_day',
                'vip_day'
            ];
            
            const event = events[Math.floor(Math.random() * events.length)];
            console.log(`🎉 特殊事件: ${event}`);
            
            // 根据事件类型调整游戏参数
            switch (event) {
                case 'special_customer_day':
                    this.customerSpawnRate *= 1.5;
                    break;
                case 'discount_day':
                    // 咖啡价格打折，但顾客更多
                    this.customerSpawnRate *= 1.8;
                    break;
                case 'spooky_day':
                    // 微恐顾客概率增加
                    break;
                case 'vip_day':
                    // VIP顾客概率增加
                    break;
            }
        }
    }
    
    /**
     * 更新顾客生成
     */
    private updateCustomerGeneration(deltaTime: number) {
        // 只在营业时间生成顾客
        if (this.gameTime.currentHour < 8 || this.gameTime.currentHour >= this.CLOSING_HOUR) {
            return;
        }
        
        this.customerSpawnTimer += deltaTime * this.gameTime.gameSpeed;
        const spawnInterval = 60 / this.customerSpawnRate; // 平均生成间隔（秒）
        
        while (this.customerSpawnTimer >= spawnInterval) {
            this.spawnRandomCustomer();
            this.customerSpawnTimer -= spawnInterval;
        }
    }
    
    /**
     * 生成随机顾客
     */
    private spawnRandomCustomer() {
        // 决定顾客类型
        let customerType = CustomerType.NORMAL;
        const rand = Math.random();
        
        if (rand < 0.05) { // 5%概率VIP
            customerType = CustomerType.VIP;
        } else if (rand < 0.15) { // 10%概率微恐顾客
            customerType = CustomerType.SPOOKY;
        } else if (rand < 0.18) { // 3%概率幽灵顾客
            customerType = CustomerType.GHOST;
        } else if (rand < 0.19) { // 1%概率吸血鬼顾客
            customerType = CustomerType.VAMPIRE;
        } else if (rand < 0.22) { // 3%概率特殊顾客
            customerType = CustomerType.SPECIAL;
        }
        
        // 生成顾客ID
        const customerId = `customer_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        
        // 顾客到达并下单
        const order = customerServiceSystem.customerArrives({
            customerId,
            customerType,
            vipLevel: customerType === CustomerType.VIP ? Math.floor(Math.random() * 3) + 1 : undefined,
            hasSpookyTrait: customerType === CustomerType.SPOOKY || customerType === CustomerType.GHOST || customerType === CustomerType.VAMPIRE
        });
        
        if (order) {
            this.gameStats.totalCustomers++;
            
            // 更新最大排队人数
            const activeOrders = customerServiceSystem.getActiveOrders();
            if (activeOrders.length > this.gameStats.maxQueueLength) {
                this.gameStats.maxQueueLength = activeOrders.length;
            }
            
            console.log(`👤 生成 ${customerType} 顾客: ${customerId}`);
        }
    }
    
    /**
     * 更新顾客等待时间
     */
    private updateCustomerWaitTimes() {
        const activeOrders = customerServiceSystem.getActiveOrders();
        
        activeOrders.forEach(order => {
            const remainingTime = customerServiceSystem.getOrderRemainingTime(order.customerId);
            
            // 检查是否超时
            if (remainingTime <= 0) {
                customerServiceSystem.customerLeaves(order.customerId);
                this.gameStats.failures++;
                this.gameStats.currentStreak = 0;
            }
        });
    }
    
    /**
     * 更新能量恢复
     */
    private updateEnergyRecharge(deltaTime: number) {
        const currentEnergy = economyManager.getEnergy();
        
        if (currentEnergy < this.MAX_ENERGY) {
            // 每分钟恢复 ENERGY_RECHARGE_RATE 点能量
            const energyGain = this.ENERGY_RECHARGE_RATE * deltaTime / 60;
            economyManager.addEnergy(energyGain);
        }
    }
    
    /**
     * 检查游戏状态
     */
    private checkGameState() {
        // 检查能量是否耗尽
        if (economyManager.getEnergy() <= 0) {
            console.log('⚠️ 能量耗尽，无法制作咖啡');
        }
        
        // 检查满意度是否过低
        const stats = customerServiceSystem.getServiceStats();
        if (stats.averageSatisfaction < 30 && this.gameStats.totalCustomers >= 20) {
            console.log('⚠️ 顾客满意度过低，请改进服务质量');
        }
    }
    
    /**
     * 更新游戏UI
     */
    private updateGameUI() {
        // 更新金币显示
        if (this.goldLabel) {
            this.goldLabel.string = `金币: ${economyManager.getGold()}`;
        }
        
        // 更新能量显示
        if (this.energyLabel) {
            this.energyLabel.string = `能量: ${Math.floor(economyManager.getEnergy())}/${this.MAX_ENERGY}`;
        }
        
        if (this.energyBar) {
            this.energyBar.progress = economyManager.getEnergy() / this.MAX_ENERGY;
        }
        
        // 更新满意度显示
        if (this.satisfactionLabel) {
            const stats = customerServiceSystem.getServiceStats();
            this.satisfactionLabel.string = `满意度: ${stats.averageSatisfaction}%`;
        }
        
        // 更新排队显示
        if (this.queueLabel) {
            const activeOrders = customerServiceSystem.getActiveOrders();
            this.queueLabel.string = `排队: ${activeOrders.length}`;
        }
    }
    
    /**
     * 设置UI监听器
     */
    private setupUIListeners() {
        if (this.pauseButton) {
            this.pauseButton.node.on('click', () => {
                this.togglePause();
            });
        }
        
        if (this.speedButton) {
            this.speedButton.node.on('click', () => {
                this.toggleGameSpeed();
            });
        }
    }
    
    /**
     * 切换暂停状态
     */
    public togglePause() {
        if (this.gameState === GameState.PLAYING) {
            this.pauseGame();
        } else if (this.gameState === GameState.PAUSED) {
            this.resumeGame();
        }
    }
    
    /**
     * 暂停游戏
     */
    public pauseGame() {
        this.gameState = GameState.PAUSED;
        console.log('⏸️ 游戏暂停');
        
        if (this.pauseMenu) {
            this.pauseMenu.active = true;
        }
    }
    
    /**
     * 恢复游戏
     */
    public resumeGame() {
        this.gameState = GameState.PLAYING;
        this.lastUpdateTime = Date.now();
        console.log('▶️ 游戏恢复');
        
        if (this.pauseMenu) {
            this.pauseMenu.active = false;
        }
    }
    
    /**
     * 切换游戏速度
     */
    public toggleGameSpeed() {
        const speeds = [1, 2, 3, 5];
        const currentIndex = speeds.indexOf(this.gameTime.gameSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        
        this.gameTime.gameSpeed = speeds[nextIndex];
        console.log(`⚡ 游戏速度切换为 ${this.gameTime.gameSpeed}x`);
        
        if (this.speedButton?.node.getComponent(Label)) {
            const label = this.speedButton.node.getComponent(Label)!;
            label.string = `${this.gameTime.gameSpeed}x`;
        }
    }
    
    /**
     * 处理咖啡制作完成
     */
    public onCoffeeMade(coffeeId: string, qualityScore: number) {
        this.gameStats.totalCoffeeMade++;
        
        // 检查是否有等待的顾客
        const activeOrders = customerServiceSystem.getActiveOrders();
        if (activeOrders.length > 0) {
            // 自动分配给等待最久的顾客
            const longestWaitingOrder = activeOrders.reduce((prev, current) => {
                const prevTime = customerServiceSystem.getOrderRemainingTime(prev.customerId);
                const currentTime = customerServiceSystem.getOrderRemainingTime(current.customerId);
                return prevTime < currentTime ? prev : current;
            });
            
            // 提供服务
            const result = customerServiceSystem.serveCoffee(
                longestWaitingOrder.customerId,
                coffeeId,
                qualityScore
            );
            
            // 更新游戏统计
            if (result.success) {
                this.gameStats.currentStreak++;
                if (this.gameStats.currentStreak > this.gameStats.bestStreak) {
                    this.gameStats.bestStreak = this.gameStats.currentStreak;
                }
                
                this.gameStats.totalRevenue += result.totalReward;
            }
        }
        
        // 消耗能量
        const recipe = coffeeRecipeManager.getRecipeById(coffeeId);
        if (recipe) {
            economyManager.useEnergy(recipe.energyCost);
        }
        
        // 更新UI
        this.updateGameUI();
    }
    
    /**
     * 获取游戏统计
     */
    public getGameStats(): GameStats {
        const serviceStats = customerServiceSystem.getServiceStats();
        
        return {
            ...this.gameStats,
            averageSatisfaction: serviceStats.averageSatisfaction
        };
    }
    
    /**
     * 显示当日总结
     */
    private showDailySummary() {
        // TODO: 实现当日总结UI
        console.log('📊 当日总结显示');
    }
    
    /**
     * 保存游戏状态
     */
    private saveGameState() {
        const gameState = {
            gameTime: this.gameTime,
            gameStats: this.gameStats,
            saveTime: Date.now()
        };
        
        // TODO: 保存到本地存储
        console.log('💾 游戏状态已保存');
    }
    
    /**
     * 保存当日统计数据
     */
    private saveDailyStats() {
        const dailyStats = {
            day: this.gameTime.currentDay,
            revenue: economyManager.getDailyRevenue(),
            customers: this.gameStats.totalCustomers,
            satisfaction: this.gameStats.averageSatisfaction,
            date: Date.now()
        };
        
        // TODO: 保存到本地存储
        console.log('📈 当日统计数据已保存');
    }
    
    /**
     * 更新游戏时间（用于UI刷新）
     */
    private updateGameTime() {
        if (this.gameState === GameState.PLAYING) {
            this.updateGameUI();
        }
    }
}

export const mainGameLoop = new MainGameLoop();