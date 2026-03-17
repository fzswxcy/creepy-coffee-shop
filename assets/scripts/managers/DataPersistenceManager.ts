/**
 * 数据持久化管理器
 * 负责游戏数据的本地存储、云同步和恢复
 * 微信小游戏适配版
 */

import { _decorator, Component, JsonAsset } from 'cc';
import { EventManager } from '../core/EventManager';

const { ccclass, property } = _decorator;

/**
 * 游戏数据接口
 */
export interface GameData {
    // 游戏进度
    totalCoins: number;
    totalScore: number;
    currentDay: number;
    gameTime: number;
    
    // 游戏设置
    soundEnabled: boolean;
    musicEnabled: boolean;
    notificationEnabled: boolean;
    
    // 店铺状态
    unlockedMachines: string[];
    coffeeRecipesUnlocked: string[];
    customerTypesUnlocked: string[];
    
    // 玩家成就
    achievements: {
        firstCoffeeServed: boolean;
        firstScaryCustomer: boolean;
        firstHorrorEvent: boolean;
        firstAdWatched: boolean;
        firstPurchase: boolean;
        consecutiveDays: number;
    };
    
    // 统计信息
    statistics: {
        totalCoffeeServed: number;
        totalCustomersServed: number;
        totalScaryCustomers: number;
        totalHorrorEvents: number;
        totalAdsWatched: number;
        totalTimePlayed: number;
        totalRevenue: number;
    };
    
    // 版本控制
    version: string;
    lastSaveTime: number;
    backupCount: number;
}

@ccclass('DataPersistenceManager')
export class DataPersistenceManager extends Component {
    
    private static _instance: DataPersistenceManager | null = null;
    
    private _gameData: GameData | null = null;
    private _isInitialized: boolean = false;
    private _autoSaveInterval: any = null;
    private _saveQueue: Array<() => Promise<void>> = [];
    private _isSaving: boolean = false;
    
    // 默认游戏数据
    private readonly DEFAULT_GAME_DATA: GameData = {
        totalCoins: 100,
        totalScore: 0,
        currentDay: 1,
        gameTime: 0,
        
        soundEnabled: true,
        musicEnabled: true,
        notificationEnabled: true,
        
        unlockedMachines: ['basic_coffee_machine'],
        coffeeRecipesUnlocked: ['espresso', 'latte'],
        customerTypesUnlocked: ['normal'],
        
        achievements: {
            firstCoffeeServed: false,
            firstScaryCustomer: false,
            firstHorrorEvent: false,
            firstAdWatched: false,
            firstPurchase: false,
            consecutiveDays: 1
        },
        
        statistics: {
            totalCoffeeServed: 0,
            totalCustomersServed: 0,
            totalScaryCustomers: 0,
            totalHorrorEvents: 0,
            totalAdsWatched: 0,
            totalTimePlayed: 0,
            totalRevenue: 0
        },
        
        version: '1.0.0',
        lastSaveTime: Date.now(),
        backupCount: 0
    };
    
    /**
     * 获取单例实例
     */
    public static get instance(): DataPersistenceManager | null {
        return DataPersistenceManager._instance;
    }
    
    protected onLoad(): void {
        if (DataPersistenceManager._instance && DataPersistenceManager._instance !== this) {
            this.destroy();
            return;
        }
        
        DataPersistenceManager._instance = this;
        console.log('数据持久化管理器加载完成');
    }
    
    protected start(): void {
        this.initialize();
    }
    
    protected onDestroy(): void {
        if (this._autoSaveInterval) {
            clearInterval(this._autoSaveInterval);
        }
        
        // 最后一次保存
        this.forceSave();
        
        DataPersistenceManager._instance = null;
    }
    
    /**
     * 初始化数据管理器
     */
    public async initialize(): Promise<boolean> {
        try {
            console.log('数据持久化管理器初始化中...');
            
            // 1. 检查平台支持
            if (!this.checkPlatformSupport()) {
                console.warn('平台不支持数据持久化，使用内存存储');
                await this.loadDefaultData();
                return true;
            }
            
            // 2. 尝试加载现有数据
            await this.loadGameData();
            
            // 3. 设置自动保存
            this.setupAutoSave();
            
            // 4. 设置事件监听
            this.setupEventListeners();
            
            this._isInitialized = true;
            console.log('数据持久化管理器初始化完成');
            
            return true;
        } catch (error) {
            console.error('数据持久化管理器初始化失败:', error);
            await this.loadDefaultData();
            return false;
        }
    }
    
    /**
     * 检查平台支持
     */
    private checkPlatformSupport(): boolean {
        try {
            // 微信小游戏平台检查
            if (typeof wx !== 'undefined') {
                // 微信小游戏环境
                console.log('检测到微信小游戏平台，支持数据持久化');
                return true;
            } else if (typeof localStorage !== 'undefined') {
                // Web平台
                console.log('检测到Web平台，支持LocalStorage');
                return true;
            } else {
                // 其他平台
                console.log('当前平台可能不支持数据持久化');
                return false;
            }
        } catch (error) {
            console.warn('平台检测失败:', error);
            return false;
        }
    }
    
    /**
     * 加载游戏数据
     */
    private async loadGameData(): Promise<void> {
        try {
            let loadedData: GameData | null = null;
            
            // 平台特定加载逻辑
            if (typeof wx !== 'undefined') {
                // 微信小游戏 - 使用wx.setStorage/wx.getStorage
                loadedData = await this.loadFromWXStorage();
            } else if (typeof localStorage !== 'undefined') {
                // Web平台 - 使用localStorage
                loadedData = await this.loadFromLocalStorage();
            }
            
            if (loadedData) {
                // 验证和修复数据
                this._gameData = this.validateAndRepairData(loadedData);
                console.log('游戏数据加载成功');
                
                // 检查数据版本
                if (this._gameData.version !== '1.0.0') {
                    console.log('检测到旧版本数据，执行数据迁移...');
                    this._gameData = this.migrateData(this._gameData);
                }
            } else {
                // 没有现有数据，使用默认值
                console.log('没有找到现有游戏数据，使用默认值');
                await this.loadDefaultData();
            }
        } catch (error) {
            console.error('加载游戏数据失败:', error);
            await this.loadDefaultData();
        }
    }
    
    /**
     * 从微信存储加载
     */
    private loadFromWXStorage(): Promise<GameData | null> {
        return new Promise((resolve) => {
            try {
                wx.getStorage({
                    key: '微恐咖啡厅_game_data',
                    success: (res) => {
                        try {
                            const data = JSON.parse(res.data);
                            resolve(data);
                        } catch (parseError) {
                            console.error('解析存储数据失败:', parseError);
                            resolve(null);
                        }
                    },
                    fail: (err) => {
                        console.log('微信存储中没有找到游戏数据:', err);
                        resolve(null);
                    }
                });
            } catch (error) {
                console.error('微信存储API调用失败:', error);
                resolve(null);
            }
        });
    }
    
    /**
     * 从本地存储加载
     */
    private loadFromLocalStorage(): GameData | null {
        try {
            const savedData = localStorage.getItem('微恐咖啡厅_game_data');
            if (savedData) {
                return JSON.parse(savedData);
            }
            return null;
        } catch (error) {
            console.error('从LocalStorage加载失败:', error);
            return null;
        }
    }
    
    /**
     * 加载默认数据
     */
    private async loadDefaultData(): Promise<void> {
        this._gameData = { ...this.DEFAULT_GAME_DATA };
        
        // 如果是新游戏，立即保存初始数据
        await this.saveGameData();
    }
    
    /**
     * 验证和修复数据
     */
    private validateAndRepairData(data: any): GameData {
        // 基本验证
        if (!data || typeof data !== 'object') {
            console.warn('无效的游戏数据，使用默认值');
            return { ...this.DEFAULT_GAME_DATA };
        }
        
        const validated: GameData = { ...this.DEFAULT_GAME_DATA, ...data };
        
        // 强制类型转换和默认值
        validated.totalCoins = Math.max(0, Number(validated.totalCoins) || 0);
        validated.totalScore = Math.max(0, Number(validated.totalScore) || 0);
        validated.currentDay = Math.max(1, Number(validated.currentDay) || 1);
        validated.gameTime = Math.max(0, Number(validated.gameTime) || 0);
        
        // 确保数组存在
        validated.unlockedMachines = Array.isArray(validated.unlockedMachines) 
            ? validated.unlockedMachines 
            : ['basic_coffee_machine'];
        validated.coffeeRecipesUnlocked = Array.isArray(validated.coffeeRecipesUnlocked)
            ? validated.coffeeRecipesUnlocked
            : ['espresso', 'latte'];
        validated.customerTypesUnlocked = Array.isArray(validated.customerTypesUnlocked)
            ? validated.customerTypesUnlocked
            : ['normal'];
        
        // 确保对象存在
        validated.achievements = { 
            ...this.DEFAULT_GAME_DATA.achievements, 
            ...validated.achievements 
        };
        validated.statistics = { 
            ...this.DEFAULT_GAME_DATA.statistics, 
            ...validated.statistics 
        };
        
        // 更新版本和保存时间
        validated.version = '1.0.0';
        validated.lastSaveTime = Date.now();
        
        return validated;
    }
    
    /**
     * 数据迁移（兼容旧版本）
     */
    private migrateData(oldData: GameData): GameData {
        const migrated = { ...oldData };
        
        // 如果有旧版本号，执行相应的迁移
        if (oldData.version === '0.9.0') {
            // 从0.9.0迁移到1.0.0
            console.log('执行数据迁移: 0.9.0 → 1.0.0');
            
            // 添加新字段
            if (!migrated.customerTypesUnlocked) {
                migrated.customerTypesUnlocked = ['normal'];
            }
            
            // 更新统计字段
            if (!migrated.statistics.totalHorrorEvents) {
                migrated.statistics.totalHorrorEvents = 0;
            }
        }
        
        migrated.version = '1.0.0';
        return migrated;
    }
    
    /**
     * 设置自动保存
     */
    private setupAutoSave(): void {
        // 每60秒自动保存一次
        this._autoSaveInterval = setInterval(() => {
            this.queueSave();
        }, 60000);
        
        console.log('自动保存已启用 (60秒间隔)');
    }
    
    /**
     * 设置事件监听
     */
    private setupEventListeners(): void {
        // 游戏事件
        EventManager.instance.on(EventManager.Events.COINS_CHANGED, (data) => {
            if (this._gameData && data) {
                this._gameData.totalCoins = data.total || this._gameData.totalCoins;
                this.queueSave();
            }
        });
        
        EventManager.instance.on(EventManager.Events.SCORE_CHANGED, (data) => {
            if (this._gameData && data) {
                this._gameData.totalScore = data.total || this._gameData.totalScore;
                this.queueSave();
            }
        });
        
        EventManager.instance.on(EventManager.Events.GAME_START, () => {
            this.updateStatistics('totalTimePlayed', Date.now());
        });
        
        EventManager.instance.on(EventManager.Events.CUSTOMER_SERVED, (data) => {
            if (data && data.isCorrect) {
                this.updateStatistics('totalCustomersServed', 1);
                this.updateStatistics('totalCoffeeServed', 1);
                
                if (!this._gameData!.achievements.firstCoffeeServed) {
                    this._gameData!.achievements.firstCoffeeServed = true;
                    EventManager.instance.emit('achievement_unlocked', {
                        achievement: 'firstCoffeeServed',
                        title: '第一杯咖啡',
                        description: '成功服务第一位顾客'
                    });
                }
            }
        });
        
        // 监听退出事件
        if (typeof wx !== 'undefined') {
            // 微信小游戏退出事件
            wx.onShow(() => {
                console.log('游戏进入前台');
            });
            
            wx.onHide(() => {
                console.log('游戏进入后台，执行保存');
                this.forceSave();
            });
        }
    }
    
    /**
     * 排队保存
     */
    private queueSave(): void {
        if (this._saveQueue.length === 0) {
            this._saveQueue.push(async () => {
                await this.saveGameData();
            });
            
            this.processSaveQueue();
        }
    }
    
    /**
     * 处理保存队列
     */
    private async processSaveQueue(): Promise<void> {
        if (this._isSaving || this._saveQueue.length === 0) {
            return;
        }
        
        this._isSaving = true;
        
        try {
            const saveTask = this._saveQueue.shift();
            if (saveTask) {
                await saveTask();
            }
        } catch (error) {
            console.error('保存队列处理失败:', error);
        } finally {
            this._isSaving = false;
            
            // 如果还有任务，继续处理
            if (this._saveQueue.length > 0) {
                setTimeout(() => this.processSaveQueue(), 100);
            }
        }
    }
    
    /**
     * 保存游戏数据
     */
    public async saveGameData(): Promise<boolean> {
        if (!this._gameData) {
            console.error('没有游戏数据可保存');
            return false;
        }
        
        try {
            // 更新保存时间
            this._gameData.lastSaveTime = Date.now();
            this._gameData.backupCount++;
            
            const dataString = JSON.stringify(this._gameData);
            
            // 平台特定保存逻辑
            if (typeof wx !== 'undefined') {
                await this.saveToWXStorage(dataString);
            } else if (typeof localStorage !== 'undefined') {
                this.saveToLocalStorage(dataString);
            }
            
            console.log('游戏数据保存成功');
            
            // 触发保存完成事件
            EventManager.instance.emit('data_saved', {
                timestamp: Date.now(),
                backupCount: this._gameData.backupCount
            });
            
            return true;
        } catch (error) {
            console.error('保存游戏数据失败:', error);
            return false;
        }
    }
    
    /**
     * 保存到微信存储
     */
    private saveToWXStorage(dataString: string): Promise<void> {
        return new Promise((resolve, reject) => {
            wx.setStorage({
                key: '微恐咖啡厅_game_data',
                data: dataString,
                success: () => {
                    resolve();
                },
                fail: (err) => {
                    reject(err);
                }
            });
        });
    }
    
    /**
     * 保存到本地存储
     */
    private saveToLocalStorage(dataString: string): void {
        localStorage.setItem('微恐咖啡厅_game_data', dataString);
    }
    
    /**
     * 强制保存（立即）
     */
    public async forceSave(): Promise<boolean> {
        console.log('强制保存游戏数据');
        return await this.saveGameData();
    }
    
    /**
     * 更新统计数据
     */
    private updateStatistics(statName: keyof GameData['statistics'], value: number): void {
        if (this._gameData && this._gameData.statistics[statName] !== undefined) {
            const currentValue = this._gameData.statistics[statName];
            
            if (typeof currentValue === 'number') {
                this._gameData.statistics[statName] = currentValue + value;
                this.queueSave();
            }
        }
    }
    
    /**
     * 获取游戏数据
     */
    public getGameData(): GameData | null {
        return this._gameData ? { ...this._gameData } : null;
    }
    
    /**
     * 获取游戏设置
     */
    public getGameSettings(): { soundEnabled: boolean; musicEnabled: boolean; notificationEnabled: boolean } {
        if (!this._gameData) {
            return {
                soundEnabled: true,
                musicEnabled: true,
                notificationEnabled: true
            };
        }
        
        return {
            soundEnabled: this._gameData.soundEnabled,
            musicEnabled: this._gameData.musicEnabled,
            notificationEnabled: this._gameData.notificationEnabled
        };
    }
    
    /**
     * 更新游戏设置
     */
    public updateGameSettings(settings: Partial<{ soundEnabled: boolean; musicEnabled: boolean; notificationEnabled: boolean }>): void {
        if (!this._gameData) return;
        
        if (settings.soundEnabled !== undefined) {
            this._gameData.soundEnabled = settings.soundEnabled;
        }
        if (settings.musicEnabled !== undefined) {
            this._gameData.musicEnabled = settings.musicEnabled;
        }
        if (settings.notificationEnabled !== undefined) {
            this._gameData.notificationEnabled = settings.notificationEnabled;
        }
        
        this.queueSave();
    }
    
    /**
     * 重置游戏数据（谨慎使用！）
     */
    public async resetGameData(): Promise<boolean> {
        if (confirm('确定要重置所有游戏数据吗？此操作不可撤销！')) {
            console.log('重置游戏数据...');
            
            // 备份旧数据
            if (typeof wx !== 'undefined') {
                try {
                    wx.setStorage({
                        key: '微恐咖啡厅_game_data_backup_' + Date.now(),
                        data: JSON.stringify(this._gameData)
                    });
                } catch (error) {
                    console.error('备份数据失败:', error);
                }
            }
            
            // 加载默认数据
            await this.loadDefaultData();
            
            console.log('游戏数据已重置');
            return true;
        }
        
        return false;
    }
    
    /**
     * 导出游戏数据
     */
    public exportGameData(): string | null {
        if (!this._gameData) return null;
        
        try {
            const exportData = {
                ...this._gameData,
                exportTime: Date.now(),
                exportVersion: '1.0.0'
            };
            
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('导出游戏数据失败:', error);
            return null;
        }
    }
    
    /**
     * 导入游戏数据
     */
    public async importGameData(dataString: string): Promise<boolean> {
        try {
            const importedData = JSON.parse(dataString);
            
            // 验证导入数据
            if (!importedData || !importedData.totalCoins || !importedData.version) {
                console.error('导入的游戏数据格式无效');
                return false;
            }
            
            // 验证版本
            if (importedData.version !== '1.0.0') {
                console.error('不支持的导入数据版本:', importedData.version);
                return false;
            }
            
            // 替换当前数据
            this._gameData = this.validateAndRepairData(importedData);
            
            // 保存到存储
            await this.saveGameData();
            
            console.log('游戏数据导入成功');
            return true;
        } catch (error) {
            console.error('导入游戏数据失败:', error);
            return false;
        }
    }
    
    /**
     * 获取初始化状态
     */
    public get isInitialized(): boolean {
        return this._isInitialized;
    }
}