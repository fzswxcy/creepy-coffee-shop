/**
 * 微信小游戏排行榜系统
 * 集成微信好友排行榜和群排行榜功能
 */

import { _decorator, Component } from 'cc';
import { gameFeedbackSystem } from '../ui/GameFeedbackSystem';
import { errorHandler, ErrorType, ErrorLevel } from '../managers/ErrorHandler';
import { weChatAdapter } from './WeChatAdapter';
const { ccclass, property } = _decorator;

/**
 * 排行榜类型
 */
export enum LeaderboardType {
    FRIEND_RANK = 'friend_rank',      // 好友排行榜
    GROUP_RANK = 'group_rank',        // 群排行榜
    GLOBAL_RANK = 'global_rank'       // 全局排行榜
}

/**
 * 排行榜数据
 */
export interface LeaderboardData {
    rank: number;                     // 排名
    avatarUrl: string;                // 头像
    nickName: string;                 // 昵称
    score: number;                    // 分数
    extraData?: string;               // 额外数据
    timestamp?: number;               // 时间戳
}

/**
 * 排行榜配置
 */
export interface LeaderboardConfig {
    enabled: boolean;                 // 是否启用
    key: string;                      // 排行榜key
    period: 'day' | 'week' | 'month' | 'all'; // 排行榜周期
    maxRecords: number;               // 最大记录数
    updateInterval: number;           // 更新间隔（秒）
}

/**
 * 排行榜状态
 */
export interface LeaderboardStatus {
    isReady: boolean;
    lastUpdateTime: number;
    cachedData: Map<LeaderboardType, LeaderboardData[]>;
    userRank: Map<LeaderboardType, number>;
}

@ccclass('WeChatLeaderboard')
export class WeChatLeaderboard extends Component {
    // 排行榜配置
    private leaderboardConfigs: Map<LeaderboardType, LeaderboardConfig> = new Map();
    
    // 排行榜状态
    private status: LeaderboardStatus = {
        isReady: false,
        lastUpdateTime: 0,
        cachedData: new Map(),
        userRank: new Map()
    };
    
    // 排行榜数据缓存
    private dataCache = {
    friendRank: [] as LeaderboardData[],
    groupRank: [] as LeaderboardData[],
    globalRank: [] as LeaderboardData[],
    lastUpdate: {
        friendRank: 0,
        groupRank: 0,
        globalRank: 0
    }
    };
    
    // 当前用户数据
    private userData = {
    totalRevenue: 0,
    totalCustomers: 0,
    maxLevel: 1,
    bestSatisfaction: 0,
    lastPlayTime: 0
    };
    
    onLoad() {
    this.initializeLeaderboardSystem();
    }
    
    /**
     * 初始化排行榜系统
     */
    private initializeLeaderboardSystem() {
    console.log('🏆 初始化微信排行榜系统');
    
    // 初始化配置
    this.initializeConfigs();
    
    // 检查微信环境
    this.checkWeChatEnvironment();
    
    // 开始自动更新
    this.schedule(this.autoUpdateLeaderboards, 300); // 每5分钟更新一次
    
    this.status.isReady = true;
    console.log('✅ 排行榜系统初始化完成');
    }
    
    /**
     * 初始化配置
     */
    private initializeConfigs() {
    // 好友排行榜配置
    this.leaderboardConfigs.set(LeaderboardType.FRIEND_RANK, {
        enabled: true,
        key: 'spooky_coffee_friend_rank',
        period: 'week',
        maxRecords: 100,
        updateInterval: 300 // 5分钟
    });
    
    // 群排行榜配置
    this.leaderboardConfigs.set(LeaderboardType.GROUP_RANK, {
        enabled: true,
        key: 'spooky_coffee_group_rank',
        period: 'week',
        maxRecords: 50,
        updateInterval: 300
    });
    
    // 全局排行榜配置
    this.leaderboardConfigs.set(LeaderboardType.GLOBAL_RANK, {
        enabled: true,
        key: 'spooky_coffee_global_rank',
        period: 'month',
        maxRecords: 1000,
        updateInterval: 600 // 10分钟
    });
    
    console.log(`📊 初始化 ${this.leaderboardConfigs.size} 个排行榜配置`);
    }
    
    /**
     * 检查微信环境
     */
    private checkWeChatEnvironment() {
    const platformStatus = weChatAdapter.getPlatformStatus();
    
    if (!platformStatus.isWeChat) {
        console.log('⚠️ 非微信环境，使用模拟排行榜数据');
        this.initializeMockData();
    }
    }
    
    /**
     * 初始化模拟数据
     */
    private initializeMockData() {
    // 生成模拟好友排行榜数据
    this.dataCache.friendRank = this.generateMockLeaderboardData(20, 'friend');
    
    // 生成模拟群排行榜数据
    this.dataCache.groupRank = this.generateMockLeaderboardData(15, 'group');
    
    // 生成模拟全局排行榜数据
    this.dataCache.globalRank = this.generateMockLeaderboardData(100, 'global');
    
    // 设置当前用户排名
    this.setUserRank(LeaderboardType.FRIEND_RANK, 5);
    this.setUserRank(LeaderboardType.GROUP_RANK, 2);
    this.setUserRank(LeaderboardType.GLOBAL_RANK, 45);
    
    console.log('🎭 模拟排行榜数据初始化完成');
    }
    
    /**
     * 生成模拟排行榜数据
     */
    private generateMockLeaderboardData(count: number, type: string): LeaderboardData[] {
    const data: LeaderboardData[] = [];
    const now = Date.now();
    
    for (let i = 1; i <= count; i++) {
        const score = Math.floor(Math.random() * 10000) + 1000;
        
        data.push({
        rank: i,
        avatarUrl: `https://example.com/avatar${i % 10}.png`,
        nickName: `${type}用户${i}`,
        score: score,
        extraData: `等级: ${Math.floor(score / 1000)}`,
        timestamp: now - Math.random() * 7 * 24 * 60 * 60 * 1000 // 随机时间
        });
    }
    
    return data;
    }
    
    /**
     * 自动更新排行榜
     */
    private autoUpdateLeaderboards() {
    if (!this.status.isReady) return;
    
    const now = Date.now();
    
    // 检查是否需要更新好友排行榜
    const friendConfig = this.leaderboardConfigs.get(LeaderboardType.FRIEND_RANK);
    if (friendConfig?.enabled) {
        const timeSinceUpdate = now - this.dataCache.lastUpdate.friendRank;
        if (timeSinceUpdate > friendConfig.updateInterval * 1000) {
        this.updateFriendLeaderboard();
        }
    }
    
    // 检查是否需要更新群排行榜
    const groupConfig = this.leaderboardConfigs.get(LeaderboardType.GROUP_RANK);
    if (groupConfig?.enabled) {
        const timeSinceUpdate = now - this.dataCache.lastUpdate.groupRank;
        if (timeSinceUpdate > groupConfig.updateInterval * 1000) {
        this.updateGroupLeaderboard();
        }
    }
    
    // 检查是否需要更新全局排行榜
    const globalConfig = this.leaderboardConfigs.get(LeaderboardType.GLOBAL_RANK);
    if (globalConfig?.enabled) {
        const timeSinceUpdate = now - this.dataCache.lastUpdate.globalRank;
        if (timeSinceUpdate > globalConfig.updateInterval * 1000) {
        this.updateGlobalLeaderboard();
        }
    }
    }
    
    // ==================== 公共API ====================
    
    /**
     * 更新用户分数
     */
    public async updateUserScore(score: number, extraData?: string): Promise<boolean> {
    console.log(`📈 更新用户分数: ${score}`);
    
    // 更新本地数据
    this.userData.totalRevenue = Math.max(this.userData.totalRevenue, score);
    this.userData.lastPlayTime = Date.now();
    
    // 检查是否在微信环境中
    const platformStatus = weChatAdapter.getPlatformStatus();
    
    if (platformStatus.isWeChat && platformStatus.isReady) {
        try {
        // 调用微信API更新分数
        return await this.updateWeChatScore(score, extraData);
        } catch (error) {
        console.error('❌ 更新微信分数失败:', error);
        errorHandler.reportError(
            ErrorType.DATA,
            ErrorLevel.WARNING,
            '更新排行榜分数失败',
            error
        );
        return false;
        }
    } else {
        // 模拟模式，只更新本地数据
        console.log('🎭 模拟模式：更新本地分数');
        return true;
    }
    }
    
    /**
     * 更新微信分数
     */
    private async updateWeChatScore(score: number, extraData?: string): Promise<boolean> {
    // 获取微信API实例
    const wx = (window as any).wx;
    if (!wx || !wx.setUserRecord) {
        console.warn('⚠️ 微信排行榜API不可用');
        return false;
    }
    
    return new Promise((resolve) => {
        wx.setUserRecord({
        key: 'spooky_coffee_score',
        value: score,
        extraData: extraData || '',
        success: () => {
            console.log('✅ 微信分数更新成功');
            
            // 显示排行榜更新提示
            gameFeedbackSystem.showSuccess(
            '分数已记录',
            '已更新到排行榜',
            3000
            );
            
            resolve(true);
        },
        fail: (err: any) => {
            console.error('❌ 微信分数更新失败:', err);
            resolve(false);
        }
        });
    });
    }
    
    /**
     * 获取好友排行榜
     */
    public async getFriendLeaderboard(): Promise<LeaderboardData[]> {
    console.log('👥 获取好友排行榜');
    
    const platformStatus = weChatAdapter.getPlatformStatus();
    
    if (platformStatus.isWeChat && platformStatus.isReady) {
        try {
        return await this.fetchWeChatFriendLeaderboard();
        } catch (error) {
        console.error('❌ 获取微信好友排行榜失败:', error);
        return this.dataCache.friendRank;
        }
    } else {
        return this.dataCache.friendRank;
    }
    }
    
    /**
     * 获取微信好友排行榜
     */
    private async fetchWeChatFriendLeaderboard(): Promise<LeaderboardData[]> {
    const wx = (window as any).wx;
    if (!wx || !wx.getFriendRank) {
        throw new Error('微信好友排行榜API不可用');
    }
    
    return new Promise((resolve, reject) => {
        wx.getFriendRank({
        key: 'spooky_coffee_score',
        success: (res: any) => {
            console.log('✅ 获取微信好友排行榜成功');
            
            const leaderboardData = this.parseWeChatLeaderboardData(res.data);
            this.dataCache.friendRank = leaderboardData;
            this.dataCache.lastUpdate.friendRank = Date.now();
            
            resolve(leaderboardData);
        },
        fail: (err: any) => {
            reject(new Error(`获取好友排行榜失败: ${err}`));
        }
        });
    });
    }
    
    /**
     * 获取群排行榜
     */
    public async getGroupLeaderboard(): Promise<LeaderboardData[]> {
    console.log('👥 获取群排行榜');
    
    const platformStatus = weChatAdapter.getPlatformStatus();
    
    if (platformStatus.isWeChat && platformStatus.isReady) {
        try {
        return await this.fetchWeChatGroupLeaderboard();
        } catch (error) {
        console.error('❌ 获取微信群排行榜失败:', error);
        return this.dataCache.groupRank;
        }
    } else {
        return this.dataCache.groupRank;
    }
    }
    
    /**
     * 获取微信群排行榜
     */
    private async fetchWeChatGroupLeaderboard(): Promise<LeaderboardData[]> {
    const wx = (window as any).wx;
    if (!wx || !wx.getGroupFriendRank) {
        throw new Error('微信群排行榜API不可用');
    }
    
    return new Promise((resolve, reject) => {
        wx.getGroupFriendRank({
        key: 'spooky_coffee_score',
        success: (res: any) => {
            console.log('✅ 获取微信群排行榜成功');
            
            const leaderboardData = this.parseWeChatLeaderboardData(res.data);
            this.dataCache.groupRank = leaderboardData;
            this.dataCache.lastUpdate.groupRank = Date.now();
            
            resolve(leaderboardData);
        },
        fail: (err: any) => {
            reject(new Error(`获取群排行榜失败: ${err}`));
        }
        });
    });
    }
    
    /**
     * 解析微信排行榜数据
     */
    private parseWeChatLeaderboardData(wechatData: any[]): LeaderboardData[] {
    if (!Array.isArray(wechatData)) {
        return [];
    }
    
    return wechatData.map((item, index) => ({
        rank: index + 1,
        avatarUrl: item.avatarUrl || '',
        nickName: item.nickname || '微信用户',
        score: item.score || 0,
        extraData: item.extraData || '',
        timestamp: item.timestamp || Date.now()
    }));
    }
    
    /**
     * 更新好友排行榜
     */
    private async updateFriendLeaderboard() {
    console.log('🔄 更新好友排行榜');
    
    try {
        const data = await this.getFriendLeaderboard();
        this.status.cachedData.set(LeaderboardType.FRIEND_RANK, data);
        this.dataCache.lastUpdate.friendRank = Date.now();
        
        console.log(`✅ 好友排行榜更新完成，共 ${data.length} 条记录`);
    } catch (error) {
        console.error('❌ 更新好友排行榜失败:', error);
    }
    }
    
    /**
     * 更新群排行榜
     */
    private async updateGroupLeaderboard() {
    console.log('🔄 更新群排行榜');
    
    try {
        const data = await this.getGroupLeaderboard();
        this.status.cachedData.set(LeaderboardType.GROUP_RANK, data);
        this.dataCache.lastUpdate.groupRank = Date.now();
        
        console.log(`✅ 群排行榜更新完成，共 ${data.length} 条记录`);
    } catch (error) {
        console.error('❌ 更新群排行榜失败:', error);
    }
    }
    
    /**
     * 更新全局排行榜
     */
    private async updateGlobalLeaderboard() {
    console.log('🔄 更新全局排行榜');
    
    // 全局排行榜通常需要服务器支持
    // 这里先使用模拟数据
    
    if (this.dataCache.globalRank.length === 0) {
        this.dataCache.globalRank = this.generateMockLeaderboardData(100, 'global');
    }
    
    this.status.cachedData.set(LeaderboardType.GLOBAL_RANK, this.dataCache.globalRank);
    this.dataCache.lastUpdate.globalRank = Date.now();
    
    console.log(`✅ 全局排行榜更新完成，共 ${this.dataCache.globalRank.length} 条记录`);
    }
    
    /**
     * 设置用户排名
     */
    public setUserRank(type: LeaderboardType, rank: number) {
    this.status.userRank.set(type, rank);
    console.log(`📊 设置用户排名: ${type} = 第${rank}名`);
    }
    
    /**
     * 获取用户排名
     */
    public getUserRank(type: LeaderboardType): number {
    return this.status.userRank.get(type) || 0;
    }
    
    /**
     * 显示排行榜
     */
    public async showLeaderboard(type: LeaderboardType = LeaderboardType.FRIEND_RANK) {
    console.log(`🏆 显示排行榜: ${type}`);
    
    // 获取排行榜数据
    let leaderboardData: LeaderboardData[] = [];
    
    switch (type) {
        case LeaderboardType.FRIEND_RANK:
        leaderboardData = await this.getFriendLeaderboard();
        break;
        case LeaderboardType.GROUP_RANK:
        leaderboardData = await this.getGroupLeaderboard();
        break;
        case LeaderboardType.GLOBAL_RANK:
        leaderboardData = this.dataCache.globalRank;
        break;
    }
    
    // 获取用户排名
    const userRank = this.getUserRank(type);
    
    // 显示排行榜信息
    this.displayLeaderboardInfo(type, leaderboardData, userRank);
    }
    
    /**
     * 显示排行榜信息
     */
    private displayLeaderboardInfo(
    type: LeaderboardType,
    data: LeaderboardData[],
    userRank: number
    ) {
    if (data.length === 0) {
        gameFeedbackSystem.showInfo('排行榜', '暂无排行榜数据', 3000);
        return;
    }
    
    // 取前10名显示
    const top10 = data.slice(0, 10);
    
    // 构建显示信息
    let message = `🏆 ${this.getLeaderboardName(type)}\n\n`;
    
    // 添加前三名
    top10.slice(0, 3).forEach(item => {
        let medal = '';
        if (item.rank === 1) medal = '🥇';
        else if (item.rank === 2) medal = '🥈';
        else if (item.rank === 3) medal = '🥉';
        
        message += `${medal} ${item.rank}. ${item.nickName}: ${item.score.toLocaleString()}\n`;
    });
    
    // 添加用户排名（如果不在前10）
    if (userRank > 0 && userRank > 10) {
        message += `\n📊 你的排名: 第${userRank}名`;
    } else if (userRank > 0) {
        const userData = data.find(item => item.rank === userRank);
        if (userData) {
        message += `\n🎯 你的排名: 第${userRank}名 (${userData.score.toLocaleString()})`;
        }
    }
    
    // 显示提示
    gameFeedbackSystem.showInfo('排行榜', message, 8000);
    }
    
    /**
     * 获取排行榜名称
     */
    private getLeaderboardName(type: LeaderboardType): string {
    switch (type) {
        case LeaderboardType.FRIEND_RANK:
        return '好友排行榜';
        case LeaderboardType.GROUP_RANK:
        return '群排行榜';
        case LeaderboardType.GLOBAL_RANK:
        return '全球排行榜';
        default:
        return '排行榜';
    }
    }
    
    /**
     * 更新用户游戏数据
     */
    public updateUserGameData(data: {
    totalRevenue?: number;
    totalCustomers?: number;
    maxLevel?: number;
    bestSatisfaction?: number;
    }) {
    if (data.totalRevenue !== undefined) {
        this.userData.totalRevenue = Math.max(this.userData.totalRevenue, data.totalRevenue);
    }
    
    if (data.totalCustomers !== undefined) {
        this.userData.totalCustomers = Math.max(this.userData.totalCustomers, data.totalCustomers);
    }
    
    if (data.maxLevel !== undefined) {
        this.userData.maxLevel = Math.max(this.userData.maxLevel, data.maxLevel);
    }
    
    if (data.bestSatisfaction !== undefined) {
        this.userData.bestSatisfaction = Math.max(this.userData.bestSatisfaction, data.bestSatisfaction);
    }
    
    this.userData.lastPlayTime = Date.now();
    
    console.log('📈 更新用户游戏数据:', this.userData);
    }
    
    /**
     * 获取用户游戏数据
     */
    public getUserGameData() {
    return { ...this.userData };
    }
    
    /**
     * 计算排行榜分数
     */
    public calculateLeaderboardScore(): number {
    // 综合分数计算算法
    const revenueScore = this.userData.totalRevenue * 1;
    const customerScore = this.userData.totalCustomers * 10;
    const levelScore = this.userData.maxLevel * 100;
    const satisfactionScore = this.userData.bestSatisfaction * 50;
    
    const totalScore = revenueScore + customerScore + levelScore + satisfactionScore;
    
    console.log(`📊 计算排行榜分数: ${totalScore.toLocaleString()}`);
    return totalScore;
    }
    
    /**
     * 定期更新排行榜分数
     */
    public async updateLeaderboardScore(): Promise<boolean> {
    const score = this.calculateLeaderboardScore();
    const extraData = JSON.stringify({
        level: this.userData.maxLevel,
        customers: this.userData.totalCustomers,
        satisfaction: this.userData.bestSatisfaction
    });
    
    return await this.updateUserScore(score, extraData);
    }
    
    /**
     * 测试排行榜系统
     */
    public async testLeaderboardSystem(): Promise<void> {
    console.log('🧪 测试微信排行榜系统');
    
    // 测试配置
    console.log('⚙️ 排行榜配置:', Array.from(this.leaderboardConfigs.entries()));
    
    // 测试用户数据
    console.log('👤 用户游戏数据:', this.getUserGameData());
    
    // 测试分数计算
    const score = this.calculateLeaderboardScore();
    console.log(`📈 计算分数: ${score.toLocaleString()}`);
    
    // 测试获取排行榜数据
    try {
        const friendRank = await this.getFriendLeaderboard();
        console.log(`👥 好友排行榜: ${friendRank.length} 条记录`);
        
        const groupRank = await this.getGroupLeaderboard();
        console.log(`👥 群排行榜: ${groupRank.length} 条记录`);
        
    } catch (error) {
        console.error('❌ 获取排行榜数据失败:', error);
    }
    
    // 测试显示排行榜
    await this.showLeaderboard(LeaderboardType.FRIEND_RANK);
    
    console.log('✅ 排行榜系统测试完成');
    }
    
    /**
     * 获取排行榜状态
     */
    public getLeaderboardStatus() {
    return { ...this.status };
    }
    
    /**
     * 重置排行榜数据（开发用）
     */
    public resetLeaderboardData() {
    console.log('🔄 重置排行榜数据');
    
    this.dataCache = {
        friendRank: [],
        groupRank: [],
        globalRank: [],
        lastUpdate: {
        friendRank: 0,
        groupRank: 0,
        globalRank: 0
        }
    };
    
    this.userData = {
        totalRevenue: 0,
        totalCustomers: 0,
        maxLevel: 1,
        bestSatisfaction: 0,
        lastPlayTime: 0
    };
    
    this.initializeMockData();
    
    console.log('✅ 排行榜数据已重置');
    }
}

export const weChatLeaderboard = new WeChatLeaderboard();