/**
 * 游戏管理器 - 总控制中心
 * 集成所有子系统，协调游戏运行
 */

import { _decorator, Component, director, game } from 'cc';
import { adManager } from '../managers/AdManager';
import { iapManager } from '../managers/IAPManager';
import { economyManager } from '../managers/EconomyManager';
import { coffeeProductionManager } from '../managers/CoffeeProductionManager';
import { customerManager } from '../managers/CustomerManager';
import { cloudDBManager } from '../managers/CloudDBManager';

const { ccclass, property } = _decorator;

export enum GameState {
    INITIALIZING = 'initializing',
    LOADING = 'loading',
    READY = 'ready',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'game_over'
}

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;
    
    private _gameState: GameState = GameState.INITIALIZING;
    private _startTime: number = 0;
    private _playTime: number = 0;
    private _isFirstLaunch: boolean = true;
    private _performanceStats: {
        fps: number;
        memory: number;
        drawCalls: number;
    } = {
        fps: 60,
        memory: 0,
        drawCalls: 0
    };

    // 性能监控
    private _perfMonitorInterval: any = null;
    private _frameCount: number = 0;
    private _lastPerfCheck: number = 0;

    public static get instance(): GameManager | null {
        return GameManager._instance;
    }

    protected onLoad(): void {
        if (GameManager._instance && GameManager._instance !== this) {
            this.destroy();
            return;
        }
        
        GameManager._instance = this;
        
        // 保持单例
        director.addPersistRootNode(this.node);
        
        console.log('游戏管理器加载完成');
    }

    protected start(): void {
        this.initializeGame();
    }

    protected onDestroy(): void {
        if (this._perfMonitorInterval) {
            clearInterval(this._perfMonitorInterval);
        }
        
        GameManager._instance = null;
    }

    /**
     * 初始化游戏
     */
    private async initializeGame(): Promise<void> {
        console.log('=== 游戏初始化开始 ===');
        this._gameState = GameState.INITIALIZING;
        
        try {
            // 1. 初始化云数据库
            console.log('步骤1: 初始化云数据库...');
            await cloudDBManager.init();
            
            // 2. 初始化变现系统（优先！）
            console.log('步骤2: 初始化变现系统...');
            await this.initializeMonetization();
            
            // 3. 初始化经济系统
            console.log('步骤3: 初始化经济系统...');
            economyManager.init();
            
            // 4. 初始化生产系统
            console.log('步骤4: 初始化咖啡生产系统...');
            coffeeProductionManager.init();
            
            // 5. 初始化顾客系统
            console.log('步骤5: 初始化顾客系统...');
            customerManager.init();
            
            // 6. 开始性能监控
            console.log('步骤6: 启动性能监控...');
            this.startPerformanceMonitoring();
            
            // 7. 加载完成
            console.log('步骤7: 游戏加载完成...');
            this._startTime = Date.now();
            this._gameState = GameState.READY;
            
            console.log('=== 游戏初始化完成 ===');
            
            // 触发游戏就绪事件
            this.node.emit('gameReady');
            
            // 显示欢迎消息
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            this._gameState = GameState.GAME_OVER;
            
            // 显示错误信息
            this.showError('游戏初始化失败，请重启游戏');
        }
    }

    /**
     * 初始化变现系统（最高优先级）
     */
    private async initializeMonetization(): Promise<void> {
        try {
            // 1. 初始化广告系统
            console.log('初始化广告系统...');
            await adManager.init();
            
            // 预加载广告
            adManager.preloadAds();
            
            // 2. 初始化内购系统
            console.log('初始化内购系统...');
            await iapManager.init();
            
            // 3. 检查去广告包
            if (iapManager.hasNoAds()) {
                console.log('已购买去广告包，禁用广告');
                // 这里可以设置广告为禁用状态
            } else {
                console.log('未购买去广告包，广告系统正常');
            }
            
            // 4. 监听内购事件
            this.setupIAPListeners();
            
            console.log('变现系统初始化完成，随时可以产生收入');
            
        } catch (error) {
            console.error('变现系统初始化失败:', error);
            // 即使变现系统失败，游戏仍然可以继续（使用模拟广告）
        }
    }

    /**
     * 设置内购事件监听
     */
    private setupIAPListeners(): void {
        // 监听去广告包购买
        iapManager.on('noAdsPurchased', () => {
            console.log('去广告包购买成功，移除广告');
            this.showMessage('恭喜！已成功去除所有广告');
            
            // 这里可以禁用广告显示
            // adManager.disableAds();
        });
        
        // 监听金币购买
        iapManager.on('coinsPurchased', (event: any) => {
            const { amount } = event;
            economyManager.addCoins(amount, 'iap_purchase');
            this.showMessage(`获得 ${amount} 金币！`);
        });
        
        // 监听月卡购买
        iapManager.on('monthlyCardPurchased', () => {
            economyManager.setIncomeMultiplier(1.2); // 增加20%收入
            this.showMessage('月度特权卡激活，所有收益提升20%！');
        });
    }

    /**
     * 开始性能监控
     */
    private startPerformanceMonitoring(): void {
        // 监控FPS
        this._perfMonitorInterval = setInterval(() => {
            this.updatePerformanceStats();
        }, 1000);
    }

    /**
     * 更新性能统计
     */
    private updatePerformanceStats(): void {
        const now = Date.now();
        
        // 计算FPS
        if (this._lastPerfCheck > 0) {
            const delta = (now - this._lastPerfCheck) / 1000;
            this._performanceStats.fps = Math.round(this._frameCount / delta);
            this._frameCount = 0;
        }
        
        this._lastPerfCheck = now;
        
        // 检查性能警告
        this.checkPerformanceWarnings();
    }

    /**
     * 检查性能警告
     */
    private checkPerformanceWarnings(): void {
        const { fps, memory, drawCalls } = this._performanceStats;
        
        // FPS警告
        if (fps < 30) {
            console.warn(`性能警告: FPS过低 (${fps})`);
            
            // 可以在这里触发性能优化
            if (fps < 20) {
                this.triggerPerformanceOptimization();
            }
        }
        
        // 内存警告（模拟）
        if (memory > 80) {
            console.warn(`性能警告: 内存使用过高 (${memory}MB)`);
        }
        
        // DrawCall警告（模拟）
        if (drawCalls > 50) {
            console.warn(`性能警告: DrawCall过高 (${drawCalls})`);
        }
    }

    /**
     * 触发性能优化
     */
    private triggerPerformanceOptimization(): void {
        console.log('触发性能优化...');
        
        // 可以执行的操作：
        // 1. 降低特效质量
        // 2. 减少粒子数量
        // 3. 合并绘制批次
        // 4. 卸载不必要资源
        
        this.showMessage('正在优化游戏性能...');
    }

    /**
     * 显示欢迎消息
     */
    private showWelcomeMessage(): void {
        if (this._isFirstLaunch) {
            this.showMessage('欢迎来到微恐咖啡厅！');
            this._isFirstLaunch = false;
            
            // 首次启动奖励
            setTimeout(() => {
                economyManager.addCoins(50, 'first_launch_bonus');
                this.showMessage('首次登录奖励：50金币！');
            }, 1000);
        }
    }

    /**
     * 显示消息（临时）
     */
    private showMessage(text: string): void {
        console.log(`显示消息: ${text}`);
        // 这里应该显示UI消息
        this.node.emit('showToast', { text, duration: 3000 });
    }

    /**
     * 显示错误
     */
    private showError(text: string): void {
        console.error(`显示错误: ${text}`);
        // 这里应该显示错误UI
        this.node.emit('showError', { text });
    }

    /**
     * 开始游戏
     */
    public startGame(): void {
        if (this._gameState !== GameState.READY) {
            console.warn('游戏未就绪，无法开始');
            return;
        }
        
        this._gameState = GameState.PLAYING;
        this._playTime = 0;
        
        console.log('游戏开始！');
        this.node.emit('gameStarted');
    }

    /**
     * 暂停游戏
     */
    public pauseGame(): void {
        if (this._gameState !== GameState.PLAYING) {
            return;
        }
        
        this._gameState = GameState.PAUSED;
        game.pause();
        
        console.log('游戏暂停');
        this.node.emit('gamePaused');
    }

    /**
     * 恢复游戏
     */
    public resumeGame(): void {
        if (this._gameState !== GameState.PAUSED) {
            return;
        }
        
        this._gameState = GameState.PLAYING;
        game.resume();
        
        console.log('游戏恢复');
        this.node.emit('gameResumed');
    }

    /**
     * 游戏结束
     */
    public gameOver(reason: string = 'unknown'): void {
        this._gameState = GameState.GAME_OVER;
        
        console.log(`游戏结束: ${reason}`);
        this.node.emit('gameOver', { reason });
        
        // 显示插屏广告
        setTimeout(() => {
            adManager.showInterstitialAd();
        }, 1000);
    }

    /**
     * 重启游戏
     */
    public restartGame(): void {
        console.log('重启游戏...');
        
        // 重置游戏状态
        this._gameState = GameState.INITIALIZING;
        this._playTime = 0;
        
        // 重置各个系统（根据需要）
        // economyManager.reset();
        // coffeeProductionManager.reset();
        // customerManager.reset();
        
        // 重新初始化
        this.initializeGame();
    }

    /**
     * 保存游戏
     */
    public saveGame(): void {
        console.log('保存游戏数据...');
        
        // 同步到云端
        cloudDBManager.syncToCloud();
        
        // 备份本地
        cloudDBManager.backupLocalData();
        
        this.showMessage('游戏已保存');
    }

    /**
     * 获取游戏状态
     */
    public getGameState(): GameState {
        return this._gameState;
    }

    /**
     * 获取游戏时间（秒）
     */
    public getPlayTime(): number {
        if (this._gameState === GameState.PLAYING) {
            return (Date.now() - this._startTime) / 1000;
        }
        return this._playTime;
    }

    /**
     * 获取性能统计
     */
    public getPerformanceStats(): typeof this._performanceStats {
        return { ...this._performanceStats };
    }

    /**
     * 请求双倍收益广告
     */
    public async requestDoubleEarningsAd(): Promise<boolean> {
        console.log('请求双倍收益广告...');
        
        const success = await adManager.showDoubleEarningsAd(100);
        
        if (success) {
            economyManager.activateDoubleEarnings(30); // 30分钟双倍收益
            this.showMessage('双倍收益激活！持续30分钟');
        }
        
        return success;
    }

    /**
     * 请求立即完成广告
     */
    public async requestInstantProductionAd(productionId: string): Promise<boolean> {
        console.log('请求立即完成广告...');
        
        const success = await adManager.showInstantProductionAd(productionId);
        
        if (success) {
            this.showMessage('生产立即完成！');
        }
        
        return success;
    }

    /**
     * 购买去广告包
     */
    public async purchaseNoAds(): Promise<boolean> {
        console.log('购买去广告包...');
        
        const result = await iapManager.purchaseProduct('no_ads_forever');
        
        if (result.success) {
            this.showMessage('感谢购买！已移除所有广告');
            return true;
        } else {
            this.showMessage(`购买失败: ${result.error}`);
            return false;
        }
    }

    /**
     * 检查是否可以显示广告
     */
    public canShowAd(): boolean {
        // 检查是否已购买去广告包
        if (iapManager.hasNoAds()) {
            return false;
        }
        
        // 检查广告是否可用
        return adManager.isAdAvailable();
    }

    /**
     * 帧更新（用于FPS计数）
     */
    protected update(): void {
        if (this._gameState === GameState.PLAYING) {
            this._frameCount++;
        }
    }
}

// 导出全局访问函数
export function getGameManager(): GameManager | null {
    return GameManager.instance;
}