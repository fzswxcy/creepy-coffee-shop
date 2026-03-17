/**
 * 微信云开发数据库管理器
 * 负责用户数据存储、同步和云备份
 */

import { EventTarget } from 'cc';

export interface UserData {
    userId: string;
    nickName: string;
    avatarUrl: string;
    level: number;
    experience: number;
    coins: number;
    diamonds: number;
    reputation: number;
    lastLogin: number;
    createdAt: number;
    updatedAt: number;
    dataVersion: number;
}

export interface GameData {
    recipes: any[];
    productionSlots: any[];
    unlockedDecorations: string[];
    purchasedItems: string[];
    settings: any;
    statistics: any;
}

export enum SyncStatus {
    IDLE = 'idle',
    SYNCING = 'syncing',
    SUCCESS = 'success',
    ERROR = 'error'
}

export class CloudDBManager extends EventTarget {
    private static _instance: CloudDBManager;
    
    private _userData: UserData | null = null;
    private _gameData: GameData | null = null;
    private _syncStatus: SyncStatus = SyncStatus.IDLE;
    private _lastSyncTime: number = 0;
    private _useCloud: boolean = false;
    private _syncInterval: number = 300000; // 5分钟同步一次
    private _syncTimer: any = null;

    public static get instance(): CloudDBManager {
        if (!CloudDBManager._instance) {
            CloudDBManager._instance = new CloudDBManager();
        }
        return CloudDBManager._instance;
    }

    private constructor() {
        super();
    }

    /**
     * 初始化云数据库
     */
    public async init(): Promise<boolean> {
        try {
            // 检查是否在微信环境
            if (typeof wx !== 'undefined' && wx.cloud) {
                console.log('微信云开发环境检测到，尝试初始化...');
                
                // 初始化微信云开发
                wx.cloud.init({
                    env: 'production', // 生产环境
                    traceUser: true
                });
                
                // 尝试登录获取用户信息
                await this.login();
                
                this._useCloud = true;
                console.log('微信云开发初始化成功');
                
                // 开始定期同步
                this.startAutoSync();
                
                return true;
            } else {
                console.warn('非微信环境或云开发不可用，使用本地存储');
                this._useCloud = false;
                return true;
            }
        } catch (error) {
            console.error('云数据库初始化失败:', error);
            this._useCloud = false;
            return false;
        }
    }

    /**
     * 微信登录
     */
    private async login(): Promise<boolean> {
        return new Promise((resolve) => {
            if (typeof wx === 'undefined' || !wx.login) {
                resolve(false);
                return;
            }

            wx.login({
                success: (res) => {
                    if (res.code) {
                        console.log('微信登录成功，code:', res.code);
                        this.createUserData();
                        resolve(true);
                    } else {
                        console.error('微信登录失败:', res.errMsg);
                        resolve(false);
                    }
                },
                fail: (err) => {
                    console.error('微信登录请求失败:', err);
                    resolve(false);
                }
            });
        });
    }

    /**
     * 创建用户数据
     */
    private createUserData(): void {
        if (!this._userData) {
            this._userData = {
                userId: this.generateUserId(),
                nickName: '咖啡师',
                avatarUrl: '',
                level: 1,
                experience: 0,
                coins: 100,
                diamonds: 0,
                reputation: 0,
                lastLogin: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                dataVersion: 1
            };
        }
    }

    /**
     * 生成用户ID
     */
    private generateUserId(): string {
        if (typeof wx !== 'undefined' && wx.getStorageSync) {
            let userId = wx.getStorageSync('user_id');
            if (!userId) {
                userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                wx.setStorageSync('user_id', userId);
            }
            return userId;
        }
        
        // 本地环境
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('user_id', userId);
        }
        return userId;
    }

    /**
     * 同步数据到云端
     */
    public async syncToCloud(): Promise<boolean> {
        if (!this._useCloud || !this._userData) {
            console.log('云同步已禁用或无用户数据');
            return false;
        }

        if (this._syncStatus === SyncStatus.SYNCING) {
            console.log('正在同步中，跳过');
            return false;
        }

        this._syncStatus = SyncStatus.SYNCING;
        this.emit('syncStatusChanged', { status: this._syncStatus });

        try {
            // 收集游戏数据
            const gameData = this.collectGameData();
            
            // 更新用户数据
            this._userData.updatedAt = Date.now();
            this._userData.dataVersion++;

            // 上传到云端
            await this.uploadToCloud(gameData);
            
            this._lastSyncTime = Date.now();
            this._syncStatus = SyncStatus.SUCCESS;
            
            console.log('数据同步到云端成功');
            this.emit('syncStatusChanged', { 
                status: this._syncStatus,
                lastSyncTime: this._lastSyncTime
            });
            
            return true;
        } catch (error) {
            console.error('同步到云端失败:', error);
            this._syncStatus = SyncStatus.ERROR;
            this.emit('syncStatusChanged', { 
                status: this._syncStatus,
                error: error instanceof Error ? error.message : '同步失败'
            });
            
            return false;
        }
    }

    /**
     * 从云端拉取数据
     */
    public async pullFromCloud(): Promise<boolean> {
        if (!this._useCloud || !this._userData) {
            console.log('云同步已禁用或无用户数据');
            return false;
        }

        this._syncStatus = SyncStatus.SYNCING;
        this.emit('syncStatusChanged', { status: this._syncStatus });

        try {
            // 从云端下载数据
            const cloudData = await this.downloadFromCloud();
            
            if (cloudData) {
                // 合并数据（云端优先）
                this.mergeGameData(cloudData);
                console.log('从云端拉取数据成功');
            }
            
            this._syncStatus = SyncStatus.SUCCESS;
            this.emit('syncStatusChanged', { 
                status: this._syncStatus,
                fromCloud: true
            });
            
            return true;
        } catch (error) {
            console.error('从云端拉取数据失败:', error);
            this._syncStatus = SyncStatus.ERROR;
            this.emit('syncStatusChanged', { 
                status: this._syncStatus,
                error: error instanceof Error ? error.message : '拉取失败'
            });
            
            return false;
        }
    }

    /**
     * 收集游戏数据
     */
    private collectGameData(): GameData {
        // 这里应该从各个管理器中收集数据
        // 暂时返回示例数据
        
        return {
            recipes: [],
            productionSlots: [],
            unlockedDecorations: [],
            purchasedItems: [],
            settings: {},
            statistics: {}
        };
    }

    /**
     * 合并游戏数据
     */
    private mergeGameData(cloudData: GameData): void {
        // 这里应该将云端数据合并到本地
        console.log('合并云端数据:', cloudData);
    }

    /**
     * 上传到云端
     */
    private async uploadToCloud(gameData: GameData): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof wx === 'undefined' || !wx.cloud) {
                reject(new Error('微信云开发不可用'));
                return;
            }

            // 使用微信云数据库
            const db = wx.cloud.database();
            const userCollection = db.collection('users');
            const gameDataCollection = db.collection('game_data');
            
            const now = Date.now();
            
            // 更新用户数据
            if (this._userData) {
                this._userData.lastLogin = now;
                this._userData.updatedAt = now;
                
                userCollection.where({
                    userId: this._userData.userId
                }).get({
                    success: (res) => {
                        if (res.data.length > 0) {
                            // 更新现有用户
                            userCollection.doc(res.data[0]._id).update({
                                data: this._userData
                            });
                        } else {
                            // 创建新用户
                            userCollection.add({
                                data: this._userData
                            });
                        }
                        
                        // 保存游戏数据
                        gameDataCollection.where({
                            userId: this._userData!.userId
                        }).get({
                            success: (res2) => {
                                const gameDataDoc = {
                                    userId: this._userData!.userId,
                                    data: gameData,
                                    updatedAt: now
                                };
                                
                                if (res2.data.length > 0) {
                                    gameDataCollection.doc(res2.data[0]._id).update({
                                        data: gameDataDoc
                                    });
                                } else {
                                    gameDataCollection.add({
                                        data: gameDataDoc
                                    });
                                }
                                
                                resolve();
                            },
                            fail: (err) => {
                                reject(err);
                            }
                        });
                    },
                    fail: (err) => {
                        reject(err);
                    }
                });
            } else {
                reject(new Error('用户数据为空'));
            }
        });
    }

    /**
     * 从云端下载
     */
    private async downloadFromCloud(): Promise<GameData | null> {
        return new Promise((resolve, reject) => {
            if (typeof wx === 'undefined' || !wx.cloud || !this._userData) {
                resolve(null);
                return;
            }

            const db = wx.cloud.database();
            const gameDataCollection = db.collection('game_data');
            
            gameDataCollection.where({
                userId: this._userData.userId
            }).get({
                success: (res) => {
                    if (res.data.length > 0) {
                        const cloudData = res.data[0].data;
                        resolve(cloudData);
                    } else {
                        resolve(null);
                    }
                },
                fail: (err) => {
                    reject(err);
                }
            });
        });
    }

    /**
     * 开始自动同步
     */
    private startAutoSync(): void {
        if (this._syncTimer) {
            clearInterval(this._syncTimer);
        }
        
        this._syncTimer = setInterval(() => {
            this.syncToCloud();
        }, this._syncInterval);
        
        console.log('自动同步已启动，间隔:', this._syncInterval / 1000, '秒');
    }

    /**
     * 停止自动同步
     */
    public stopAutoSync(): void {
        if (this._syncTimer) {
            clearInterval(this._syncTimer);
            this._syncTimer = null;
            console.log('自动同步已停止');
        }
    }

    /**
     * 手动同步
     */
    public async manualSync(): Promise<boolean> {
        console.log('开始手动同步...');
        const result = await this.syncToCloud();
        
        if (result) {
            console.log('手动同步成功');
            return true;
        } else {
            console.log('手动同步失败');
            return false;
        }
    }

    /**
     * 获取用户数据
     */
    public getUserData(): UserData | null {
        return this._userData;
    }

    /**
     * 更新用户数据
     */
    public updateUserData(updates: Partial<UserData>): void {
        if (!this._userData) return;
        
        Object.assign(this._userData, updates);
        this._userData.updatedAt = Date.now();
        
        // 触发自动同步
        setTimeout(() => {
            this.syncToCloud();
        }, 1000);
    }

    /**
     * 获取同步状态
     */
    public getSyncStatus(): SyncStatus {
        return this._syncStatus;
    }

    /**
     * 获取上次同步时间
     */
    public getLastSyncTime(): number {
        return this._lastSyncTime;
    }

    /**
     * 是否使用云端
     */
    public isUsingCloud(): boolean {
        return this._useCloud;
    }

    /**
     * 备份本地数据
     */
    public backupLocalData(): string {
        try {
            const backupData = {
                userData: this._userData,
                gameData: this._gameData,
                timestamp: Date.now()
            };
            
            const backupString = JSON.stringify(backupData);
            localStorage.setItem('game_backup', backupString);
            
            console.log('本地数据备份完成');
            return backupString;
        } catch (error) {
            console.error('备份本地数据失败:', error);
            return '';
        }
    }

    /**
     * 恢复本地数据
     */
    public restoreLocalData(backupString: string): boolean {
        try {
            const backupData = JSON.parse(backupString);
            
            if (backupData.userData) {
                this._userData = backupData.userData;
            }
            
            if (backupData.gameData) {
                this._gameData = backupData.gameData;
            }
            
            console.log('本地数据恢复完成');
            return true;
        } catch (error) {
            console.error('恢复本地数据失败:', error);
            return false;
        }
    }
}

// 全局访问
export const cloudDBManager = CloudDBManager.instance;