/**
 * 游戏核心接口
 * 连接UI系统和游戏逻辑系统的桥梁
 */

import { MainSceneUIController } from '../ui/MainSceneUIController';
import { mainGameLoop, GameState, GameTime, GameStats } from '../game/MainGameLoop';
import { economyManager, EconomyManager } from '../managers/EconomyManager';
import { customerManager, CustomerManager } from '../managers/CustomerManager';
import { coffeeProductionManager, CoffeeProductionManager } from '../managers/CoffeeProductionManager';
import { coffeeRecipeManager, CoffeeRecipeManager } from '../game/CoffeeRecipeManager';
import { customerServiceSystem, CustomerServiceSystem } from '../game/CustomerServiceSystem';

/**
 * 游戏接口类 - 单例模式
 */
export class GameInterface {
    private static instance: GameInterface;
    private uiController: MainSceneUIController | null = null;
    private isInitialized: boolean = false;

    private constructor() {
        // 私有构造函数
    }

    /**
     * 获取实例
     */
    public static getInstance(): GameInterface {
        if (!GameInterface.instance) {
            GameInterface.instance = new GameInterface();
        }
        return GameInterface.instance;
    }

    /**
     * 初始化接口系统
     */
    public initialize(uiController: MainSceneUIController): void {
        if (this.isInitialized) {
            console.warn('⚠️ GameInterface 已经初始化');
            return;
        }

        console.log('🔗 游戏接口系统初始化');
        
        this.uiController = uiController;
        this.isInitialized = true;

        // 设置回调函数
        this.setupCallbacks();
        
        // 设置游戏循环事件监听
        this.setupGameLoopListeners();
        
        console.log('✅ 游戏接口系统初始化完成');
    }

    /**
     * 设置回调函数
     */
    private setupCallbacks(): void {
        // 设置UI控制器回调到游戏逻辑
        if (this.uiController) {
            this.uiController.onMakeCoffeeRequest = (recipeId: string) => {
                return coffeeProductionManager.startCoffeeProduction(recipeId);
            };
            
            this.uiController.onServeCustomerRequest = (customerId: string) => {
                return customerServiceSystem.serveCustomer(customerId);
            };
            
            this.uiController.onRecipeSelect = (recipeId: string) => {
                coffeeRecipeManager.selectRecipe(recipeId);
                return true;
            };
            
            this.uiController.onUpgradePurchase = (upgradeId: string) => {
                return economyManager.purchaseUpgrade(upgradeId);
            };
            
            this.uiController.onGamePause = (paused: boolean) => {
                if (paused) {
                    mainGameLoop.pauseGame();
                } else {
                    mainGameLoop.resumeGame();
                }
            };
            
            this.uiController.onGameSpeedChange = (speed: number) => {
                mainGameLoop.setGameSpeed(speed);
            };
        }
    }

    /**
     * 设置游戏循环事件监听
     */
    private setupGameLoopListeners(): void {
        // 监听游戏状态变化
        mainGameLoop.onGameStateChange((state: GameState) => {
            if (this.uiController) {
                this.uiController.updateGameState(state);
            }
        });
        
        // 监听游戏时间变化
        mainGameLoop.onGameTimeUpdate((time: GameTime) => {
            if (this.uiController) {
                this.uiController.updateGameTime(time);
            }
        });
        
        // 监听游戏统计数据变化
        mainGameLoop.onGameStatsUpdate((stats: GameStats) => {
            if (this.uiController) {
                this.uiController.updateGameStats(stats);
            }
        });
        
        // 监听经济系统变化
        economyManager.onMoneyChanged((newAmount: number) => {
            if (this.uiController) {
                this.uiController.updateMoneyDisplay(newAmount);
            }
        });
        
        // 监听顾客队列变化
        customerManager.onQueueChanged((queue: any[]) => {
            if (this.uiController) {
                this.uiController.updateCustomerQueue(queue);
            }
        });
        
        // 监听咖啡生产进度
        coffeeProductionManager.onProductionProgress((recipeId: string, progress: number) => {
            if (this.uiController) {
                this.uiController.updateCoffeeMakingProgress(recipeId, progress);
            }
        });
        
        // 监听顾客服务状态
        customerServiceSystem.onCustomerServed((customerId: string, satisfaction: number) => {
            if (this.uiController) {
                this.uiController.updateCustomerServed(customerId, satisfaction);
            }
        });
    }

    /**
     * 获取UI控制器
     */
    public getUIController(): MainSceneUIController | null {
        return this.uiController;
    }

    /**
     * 检查是否已初始化
     */
    public isReady(): boolean {
        return this.isInitialized && this.uiController !== null;
    }

    /**
     * 获取游戏状态摘要
     */
    public getGameStatusSummary(): {
        state: GameState;
        money: number;
        customers: number;
        coffeeMade: number;
        satisfaction: number;
    } {
        return {
            state: mainGameLoop.getCurrentState(),
            money: economyManager.getMoney(),
            customers: mainGameLoop.getStats().totalCustomers,
            coffeeMade: mainGameLoop.getStats().totalCoffeeMade,
            satisfaction: mainGameLoop.getStats().averageSatisfaction
        };
    }

    /**
     * 启动游戏
     */
    public startGame(): void {
        if (!this.isReady()) {
            console.error('❌ 游戏接口未就绪，无法启动游戏');
            return;
        }
        
        console.log('🎮 游戏接口启动游戏');
        mainGameLoop.startGame();
    }

    /**
     * 暂停游戏
     */
    public pauseGame(): void {
        mainGameLoop.pauseGame();
    }

    /**
     * 恢复游戏
     */
    public resumeGame(): void {
        mainGameLoop.resumeGame();
    }

    /**
     * 重新开始游戏
     */
    public restartGame(): void {
        mainGameLoop.restartGame();
    }

    /**
     * 获取游戏配置
     */
    public getGameConfig(): any {
        // 这里可以整合所有管理器配置
        return {
            economy: economyManager.getConfig(),
            customers: customerManager.getConfig(),
            production: coffeeProductionManager.getConfig(),
            recipes: coffeeRecipeManager.getConfig()
        };
    }
}

/**
 * 全局游戏接口实例
 */
export const gameInterface = GameInterface.getInstance();