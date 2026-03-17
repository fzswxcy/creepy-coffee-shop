/**
 * 游戏数据管理器
 * 负责游戏数据的保存、加载和云同步功能
 */

import { _decorator, Component, sys, director } from 'cc';
import { economyManager } from './EconomyManager';
import { coffeeRecipeManager } from '../game/CoffeeRecipeManager';
import { customerServiceSystem } from '../game/CustomerServiceSystem';
import { mainGameLoop } from '../game/MainGameLoop';
const { ccclass, property } = _decorator;

/**
 * 游戏保存数据结构
 */
export interface GameSaveData {
    version: string;
    saveTime: number;
    
    // 玩家基础数据
    playerData: {
        playerId: string;
        playerName?: string;
        level: number;
        experience: number;
        totalPlayTime: number;
        lastLoginTime: number;
    };
    
    // 经济数据
    economyData: {
        gold: number;
        energy: number;
        maxEnergy: number;
        totalRevenue: number;
        totalTips: number;
        dailyRevenue: number;
        lastEnergyUpdateTime: number;
    };
    
    // 配方数据
    recipeData: {
        unlockedRecipes: string[];
        recipeProgress: Array<{
            recipeId: string;
            timesMade: number;
            successRate: number;
            masteryLevel: number;
            lastMadeTime?: number;
            specialUnlocked: boolean;
        }>;
    };
    
    // 顾客服务数据
    serviceData: {
        totalCustomersServed: number;
        totalCoffeeMade: number;
        averageSatisfaction: number;
        serviceHistory: any[];
        customerSatisfactionHistory: any[];
    };
    
    // 游戏时间数据
    gameTimeData: {
        currentDay: number;
        currentHour: number;
        currentMinute: number;
        totalPlayTime: number;
        gameSpeed: number;
    };
    
    // 游戏统计
    gameStats: {
        totalRevenue: number;
        totalCustomers: number;
        totalCoffeeMade: number;
        averageSatisfaction: number;
        maxQueueLength: number;
        currentStreak: number;
        bestStreak: number;
        failures: number;
    };
    
    // 系统设置
    settings: {
        soundVolume: number;
        musicVolume: number;
        vibrationEnabled: boolean;
        notificationsEnabled: boolean;
        language: string;
    };
}

/**
 * 云端同步状态
 */
export interface CloudSyncStatus {
    lastSyncTime: number;
    syncStatus: 'idle' | 'syncing' | 'success' | 'failed';
    lastError?: string;
    cloudDataVersion?: number;
}

@ccclass('GameDataManager')
export class GameDataManager extends Component {
    // 游戏版本
    private readonly GAME_VERSION = '1.0.0';
    private readonly SAVE_KEY = 'wechat_spooky_coffee_save';
    private readonly CLOUD_SAVE_KEY = 'cloud_spooky_coffee_save';
    
    // 自动保存间隔（秒）
    private readonly AUTO_SAVE_INTERVAL = 180; // 3分钟
    
    // 当前保存数据
    private currentSaveData: GameSaveData | null = null;
    
    // 云端同步状态
    private cloudSyncStatus: CloudSyncStatus = {
        lastSyncTime: 0,
        syncStatus: 'idle'
    };
    
    // 自动保存计时器
    private autoSaveTimer: number = 0;
    
    onLoad() {
        this.initializeDataManager();
    }
    
    /**
     * 初始化数据管理器
     */
    private initializeDataManager() {
        console.log('💾 游戏数据管理器初始化');
        
        // 检查云开发环境
        this.checkCloudEnvironment();
        
        // 开始自动保存定时器
        this.schedule(this.autoSave, this.AUTO_SAVE_INTERVAL);
        
        console.log('✅ 数据管理器初始化完成');
    }
    
    /**
     * 检查云开发环境
     */
    private checkCloudEnvironment() {
        // 微信小游戏云开发环境检测
        if (typeof wx !== 'undefined' && wx.cloud) {
            console.log('☁️ 微信云开发环境可用');
            this.cloudSyncStatus.syncStatus = 'idle';
        } else {
            console.log('📱 本地存储模式');
            this.cloudSyncStatus.syncStatus = 'idle';
        }
    }
    
    /**
     * 自动保存
     */
    private autoSave() {
        console.log('🔄 执行自动保存');
        this.saveGameData();
    }
    
    /**
     * 保存游戏数据
     */
    public saveGameData(): boolean {
        try {
            // 收集所有游戏数据
            const saveData = this.collectAllGameData();
            
            // 保存到本地存储
            this.saveToLocalStorage(saveData);
            
            // 尝试云同步（如果可用）
            this.tryCloudSync(saveData);
            
            console.log('✅ 游戏数据保存成功');
            return true;
        } catch (error) {
            console.error('❌ 游戏数据保存失败:', error);
            return false;
        }
    }
    
    /**
     * 收集所有游戏数据
     */
    private collectAllGameData(): GameSaveData {
        const now = Date.now();
        
        // 收集配方进度
        const recipeProgress: any[] = [];
        const unlockedRecipes = coffeeRecipeManager.getUnlockedRecipes();
        
        unlockedRecipes.forEach(recipe => {
            const progress = coffeeRecipeManager.getRecipeProgress(recipe.id);
            if (progress) {
                recipeProgress.push({
                    recipeId: recipe.id,
                    timesMade: progress.timesMade,
                    successRate: progress.successRate,
                    masteryLevel: progress.masteryLevel,
                    lastMadeTime: progress.lastMadeTime,
                    specialUnlocked: progress.specialUnlocked
                });
            }
        });
        
        // 收集服务数据
        const serviceStats = customerServiceSystem.getServiceStats();
        
        // 收集游戏统计
        const gameStats = mainGameLoop.getGameStats();
        
        const saveData: GameSaveData = {
            version: this.GAME_VERSION,
            saveTime: now,
            
            playerData: {
                playerId: this.generatePlayerId(),
                level: 1, // TODO: 从等级系统获取
                experience: 0, // TODO: 从经验系统获取
                totalPlayTime: 0, // TODO: 从游戏循环获取
                lastLoginTime: now
            },
            
            economyData: {
                gold: economyManager.getGold(),
                energy: economyManager.getEnergy(),
                maxEnergy: 100,
                totalRevenue: economyManager.getTotalRevenue(),
                totalTips: serviceStats.totalTips,
                dailyRevenue: economyManager.getDailyRevenue(),
                lastEnergyUpdateTime: now
            },
            
            recipeData: {
                unlockedRecipes: unlockedRecipes.map(r => r.id),
                recipeProgress
            },
            
            serviceData: {
                totalCustomersServed: serviceStats.totalCustomersServed,
                totalCoffeeMade: serviceStats.totalCustomersServed, // TODO: 从咖啡制作系统获取
                averageSatisfaction: serviceStats.averageSatisfaction,
                serviceHistory: [], // TODO: 从服务系统获取
                customerSatisfactionHistory: [] // TODO: 从服务系统获取
            },
            
            gameTimeData: {
                currentDay: 1, // TODO: 从游戏循环获取
                currentHour: 8, // TODO: 从游戏循环获取
                currentMinute: 0, // TODO: 从游戏循环获取
                totalPlayTime: 0, // TODO: 从游戏循环获取
                gameSpeed: 1 // TODO: 从游戏循环获取
            },
            
            gameStats: {
                totalRevenue: gameStats.totalRevenue,
                totalCustomers: gameStats.totalCustomers,
                totalCoffeeMade: gameStats.totalCoffeeMade,
                averageSatisfaction: gameStats.averageSatisfaction,
                maxQueueLength: gameStats.maxQueueLength,
                currentStreak: gameStats.currentStreak,
                bestStreak: gameStats.bestStreak,
                failures: gameStats.failures
            },
            
            settings: {
                soundVolume: 0.8,
                musicVolume: 0.6,
                vibrationEnabled: true,
                notificationsEnabled: true,
                language: 'zh-CN'
            }
        };
        
        return saveData;
    }
    
    /**
     * 生成玩家ID
     */
    private generatePlayerId(): string {
        // 尝试从本地存储获取现有ID
        const existingId = sys.localStorage.getItem('player_id');
        if (existingId) {
            return existingId;
        }
        
        // 生成新ID
        const newId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sys.localStorage.setItem('player_id', newId);
        
        return newId;
    }
    
    /**
     * 保存到本地存储
     */
    private saveToLocalStorage(data: GameSaveData): void {
        try {
            const jsonData = JSON.stringify(data);
            sys.localStorage.setItem(this.SAVE_KEY, jsonData);
            console.log(`💾 本地保存成功，数据大小: ${jsonData.length} 字节`);
        } catch (error) {
            console.error('❌ 本地存储保存失败:', error);
            throw error;
        }
    }
    
    /**
     * 从本地存储加载
     */
    private loadFromLocalStorage(): GameSaveData | null {
        try {
            const jsonData = sys.localStorage.getItem(this.SAVE_KEY);
            if (!jsonData) {
                console.log('📭 无本地保存数据');
                return null;
            }
            
            const data = JSON.parse(jsonData) as GameSaveData;
            
            // 检查版本兼容性
            if (data.version !== this.GAME_VERSION) {
                console.warn(`⚠️ 版本不匹配: 保存版本 ${data.version}, 当前版本 ${this.GAME_VERSION}`);
                // TODO: 版本迁移处理
            }
            
            console.log(`📂 本地加载成功，保存时间: ${new Date(data.saveTime).toLocaleString()}`);
            return data;
        } catch (error) {
            console.error('❌ 本地存储加载失败:', error);
            return null;
        }
    }
    
    /**
     * 尝试云同步
     */
    private tryCloudSync(data: GameSaveData): void {
        // 检查微信云开发环境
        if (typeof wx === 'undefined' || !wx.cloud) {
            return;
        }
        
        this.cloudSyncStatus.syncStatus = 'syncing';
        this.cloudSyncStatus.lastSyncTime = Date.now();
        
        // 模拟云同步（实际需要调用微信云函数）
        setTimeout(() => {
            this.cloudSyncStatus.syncStatus = 'success';
            this.cloudSyncStatus.cloudDataVersion = Date.now();
            console.log('☁️ 云同步成功');
        }, 1000);
    }
    
    /**
     * 从云端加载
     */
    private async loadFromCloud(): Promise<GameSaveData | null> {
        // 检查微信云开发环境
        if (typeof wx === 'undefined' || !wx.cloud) {
            return null;
        }
        
        try {
            this.cloudSyncStatus.syncStatus = 'syncing';
            
            // 模拟云加载
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.cloudSyncStatus.syncStatus = 'success';
                    console.log('☁️ 云加载成功');
                    resolve(null); // 实际应从云端获取数据
                }, 1500);
            });
        } catch (error) {
            this.cloudSyncStatus.syncStatus = 'failed';
            this.cloudSyncStatus.lastError = error instanceof Error ? error.message : '未知错误';
            console.error('❌ 云加载失败:', error);
            return null;
        }
    }
    
    /**
     * 加载游戏数据
     */
    public async loadGameData(): Promise<boolean> {
        console.log('🔄 加载游戏数据');
        
        try {
            // 先尝试从云端加载
            let saveData = await this.loadFromCloud();
            
            // 如果云端没有，从本地加载
            if (!saveData) {
                saveData = this.loadFromLocalStorage();
            }
            
            // 如果都没有，创建新游戏
            if (!saveData) {
                console.log('🎮 创建新游戏');
                return this.createNewGame();
            }
            
            // 恢复游戏数据
            this.currentSaveData = saveData;
            this.restoreGameData(saveData);
            
            console.log('✅ 游戏数据加载成功');
            return true;
        } catch (error) {
            console.error('❌ 游戏数据加载失败:', error);
            return false;
        }
    }
    
    /**
     * 创建新游戏
     */
    private createNewGame(): boolean {
        try {
            // 初始化所有系统
            economyManager.initialize(1000); // 初始1000金币
            coffeeRecipeManager.onLoad(); // 初始化配方管理器
            // 其他系统初始化...
            
            // 创建初始保存数据
            const saveData = this.collectAllGameData();
            this.currentSaveData = saveData;
            this.saveToLocalStorage(saveData);
            
            console.log('🎮 新游戏创建成功');
            return true;
        } catch (error) {
            console.error('❌ 新游戏创建失败:', error);
            return false;
        }
    }
    
    /**
     * 恢复游戏数据
     */
    private restoreGameData(saveData: GameSaveData): void {
        // 恢复经济数据
        economyManager.setGold(saveData.economyData.gold);
        economyManager.setEnergy(saveData.economyData.energy);
        
        // 恢复配方进度
        saveData.recipeData.recipeProgress.forEach(progress => {
            // TODO: 恢复配方进度到coffeeRecipeManager
        });
        
        // 恢复游戏统计
        // TODO: 恢复游戏统计到各个系统
        
        console.log('🔄 游戏数据恢复完成');
    }
    
    /**
     * 获取当前保存数据
     */
    public getCurrentSaveData(): GameSaveData | null {
        return this.currentSaveData;
    }
    
    /**
     * 获取云端同步状态
     */
    public getCloudSyncStatus(): CloudSyncStatus {
        return { ...this.cloudSyncStatus };
    }
    
    /**
     * 手动触发云同步
     */
    public async triggerCloudSync(): Promise<boolean> {
        if (this.cloudSyncStatus.syncStatus === 'syncing') {
            console.log('⚠️ 已经在同步中');
            return false;
        }
        
        console.log('☁️ 手动触发云同步');
        
        if (!this.currentSaveData) {
            await this.loadGameData();
        }
        
        if (this.currentSaveData) {
            this.tryCloudSync(this.currentSaveData);
            return true;
        }
        
        return false;
    }
    
    /**
     * 导出游戏数据（用于备份）
     */
    public exportGameData(): string {
        if (!this.currentSaveData) {
            return '';
        }
        
        return JSON.stringify(this.currentSaveData, null, 2);
    }
    
    /**
     * 导入游戏数据（用于恢复）
     */
    public importGameData(jsonData: string): boolean {
        try {
            const data = JSON.parse(jsonData) as GameSaveData;
            
            // 验证数据结构
            if (!data.version || !data.saveTime) {
                throw new Error('无效的游戏数据格式');
            }
            
            // 保存并应用数据
            this.saveToLocalStorage(data);
            this.restoreGameData(data);
            this.currentSaveData = data;
            
            console.log('✅ 游戏数据导入成功');
            return true;
        } catch (error) {
            console.error('❌ 游戏数据导入失败:', error);
            return false;
        }
    }
    
    /**
     * 清除所有游戏数据
     */
    public clearAllGameData(): boolean {
        try {
            // 清除本地存储
            sys.localStorage.removeItem(this.SAVE_KEY);
            sys.localStorage.removeItem('player_id');
            
            // 重置当前数据
            this.currentSaveData = null;
            this.cloudSyncStatus = {
                lastSyncTime: 0,
                syncStatus: 'idle'
            };
            
            console.log('🗑️ 所有游戏数据已清除');
            return true;
        } catch (error) {
            console.error('❌ 清除游戏数据失败:', error);
            return false;
        }
    }
    
    /**
     * 获取保存文件信息
     */
    public getSaveInfo(): {
        exists: boolean;
        saveTime?: number;
        version?: string;
        playerId?: string;
        level?: number;
        gold?: number;
    } {
        if (!this.currentSaveData) {
            const savedData = this.loadFromLocalStorage();
            if (savedData) {
                this.currentSaveData = savedData;
            }
        }
        
        if (!this.currentSaveData) {
            return { exists: false };
        }
        
        return {
            exists: true,
            saveTime: this.currentSaveData.saveTime,
            version: this.currentSaveData.version,
            playerId: this.currentSaveData.playerData.playerId,
            level: this.currentSaveData.playerData.level,
            gold: this.currentSaveData.economyData.gold
        };
    }
}

export const gameDataManager = new GameDataManager();