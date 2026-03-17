/**
 * 微信广告变现系统
 * 集成微信小游戏广告组件，实现游戏内变现
 */

import { _decorator, Component } from 'cc';
import { economyManager } from '../managers/EconomyManager';
import { gameFeedbackSystem } from '../ui/GameFeedbackSystem';
import { errorHandler, ErrorType, ErrorLevel } from '../managers/ErrorHandler';
import { weChatAdapter } from './WeChatAdapter';
const { ccclass, property } = _decorator;

/**
 * 广告奖励类型
 */
export enum AdRewardType {
    DOUBLE_GOLD = 'double_gold',          // 双倍金币
    FREE_ENERGY = 'free_energy',          // 免费能量
    SPEED_BOOST = 'speed_boost',          // 制作加速
    SPECIAL_RECIPE = 'special_recipe',    // 特殊配方
    VIP_TEMPORARY = 'vip_temporary',      // 临时VIP
    BONUS_TIPS = 'bonus_tips'             // 小费加成
}

/**
 * 广告奖励配置
 */
export interface AdRewardConfig {
    type: AdRewardType;
    name: string;
    description: string;
    icon: string;
    baseValue: number;
    multiplier?: number;
    duration?: number; // 秒，0表示永久
    cooldown?: number; // 冷却时间（秒）
}

/**
 * 广告展示时机
 */
export enum AdShowTiming {
    GAME_START = 'game_start',           // 游戏开始
    LEVEL_UP = 'level_up',               // 等级提升
    ENERGY_EMPTY = 'energy_empty',       // 能量耗尽
    BIG_PURCHASE = 'big_purchase',       // 大额购买前
    DAILY_REWARD = 'daily_reward',       // 每日奖励
    ACHIEVEMENT = 'achievement',         // 成就解锁
    RETRY_LEVEL = 'retry_level',         // 重试关卡
    SPECIAL_EVENT = 'special_event'      // 特殊事件
}

/**
 * 广告统计
 */
export interface AdStatistics {
    totalImpressions: number;      // 总展示次数
    totalCompletions: number;      // 总完成次数
    totalRevenue: number;          // 总收入（估算）
    completionRate: number;        // 完成率
    todayImpressions: number;      // 今日展示
    todayCompletions: number;      // 今日完成
    lastAdTime: number;            // 上次广告时间
}

@ccclass('WeChatMonetization')
export class WeChatMonetization extends Component {
    // 广告配置
    private adConfig = {
        // 激励视频广告配置
        rewardedVideo: {
            enabled: true,
            showInterval: 120, // 展示间隔（秒）
            maxPerDay: 10,     // 每日最大展示次数
            rewardMultiplier: 2.0, // 奖励倍数
        },
        
        // 插屏广告配置
        interstitial: {
            enabled: true,
            showInterval: 180, // 展示间隔（秒）
            maxPerDay: 20,     // 每日最大展示次数
            showOnGameStart: true,
            showOnLevelUp: true,
            showOnEnergyEmpty: true,
        },
        
        // Banner广告配置（可选）
        banner: {
            enabled: false,
            showOnMainScreen: true,
            autoHideDelay: 30, // 自动隐藏延迟（秒）
        }
    };
    
    // 广告奖励配置
    private rewardConfigs: Map<AdRewardType, AdRewardConfig> = new Map();
    
    // 广告统计
    private statistics: AdStatistics = {
        totalImpressions: 0,
        totalCompletions: 0,
        totalRevenue: 0,
        completionRate: 0,
        todayImpressions: 0,
        todayCompletions: 0,
        lastAdTime: 0
    };
    
    // 冷却时间记录
    private cooldowns: Map<AdRewardType, number> = new Map();
    
    // 今日统计记录
    private dailyStats = {
        date: '',
        impressions: 0,
        completions: 0,
        revenue: 0
    };
    
    onLoad() {
        this.initializeMonetizationSystem();
    }
    
    /**
     * 初始化变现系统
     */
    private initializeMonetizationSystem() {
        console.log('💰 初始化微信广告变现系统');
        
        // 初始化奖励配置
        this.initializeRewardConfigs();
        
        // 加载统计数据
        this.loadStatistics();
        
        // 检查每日重置
        this.checkDailyReset();
        
        // 开始统计定时器
        this.schedule(this.updateStatistics, 60); // 每分钟更新一次
        
        console.log('✅ 变现系统初始化完成');
    }
    
    /**
     * 初始化奖励配置
     */
    private initializeRewardConfigs() {
        this.rewardConfigs.set(AdRewardType.DOUBLE_GOLD, {
            type: AdRewardType.DOUBLE_GOLD,
            name: '双倍金币',
            description: '下一杯咖啡获得双倍金币',
            icon: '💰',
            baseValue: 2.0,
            multiplier: 2.0,
            duration: 300, // 5分钟
            cooldown: 600  // 10分钟冷却
        });
        
        this.rewardConfigs.set(AdRewardType.FREE_ENERGY, {
            type: AdRewardType.FREE_ENERGY,
            name: '免费能量',
            description: '立即恢复50点能量',
            icon: '⚡',
            baseValue: 50,
            cooldown: 900  // 15分钟冷却
        });
        
        this.rewardConfigs.set(AdRewardType.SPEED_BOOST, {
            type: AdRewardType.SPEED_BOOST,
            name: '制作加速',
            description: '咖啡制作速度提升50%',
            icon: '⚡',
            baseValue: 0.5,
            multiplier: 0.5,
            duration: 600, // 10分钟
            cooldown: 1200 // 20分钟冷却
        });
        
        this.rewardConfigs.set(AdRewardType.SPECIAL_RECIPE, {
            type: AdRewardType.SPECIAL_RECIPE,
            name: '特殊配方',
            description: '解锁一个随机特殊配方',
            icon: '📜',
            baseValue: 1,
            cooldown: 1800 // 30分钟冷却
        });
        
        this.rewardConfigs.set(AdRewardType.VIP_TEMPORARY, {
            type: AdRewardType.VIP_TEMPORARY,
            name: '临时VIP',
            description: '获得15分钟VIP特权',
            icon: '👑',
            baseValue: 1,
            duration: 900, // 15分钟
            cooldown: 3600 // 1小时冷却
        });
        
        this.rewardConfigs.set(AdRewardType.BONUS_TIPS, {
            type: AdRewardType.BONUS_TIPS,
            name: '小费加成',
            description: '顾客小费增加100%',
            icon: '💸',
            baseValue: 1.0,
            multiplier: 1.0,
            duration: 450, // 7.5分钟
            cooldown: 900  // 15分钟冷却
        });
        
        console.log(`🎁 初始化 ${this.rewardConfigs.size} 种广告奖励`);
    }
    
    /**
     * 加载统计数据
     */
    private loadStatistics() {
        // TODO: 从本地存储加载统计数据
        console.log('📊 加载广告统计数据');
        
        // 重置今日统计
        this.resetDailyStats();
    }
    
    /**
     * 重置每日统计
     */
    private resetDailyStats() {
        const today = new Date().toDateString();
        
        if (this.dailyStats.date !== today) {
            this.dailyStats = {
                date: today,
                impressions: 0,
                completions: 0,
                revenue: 0
            };
            
            console.log('🔄 重置每日广告统计');
        }
    }
    
    /**
     * 检查每日重置
     */
    private checkDailyReset() {
        const today = new Date().toDateString();
        
        if (this.dailyStats.date !== today) {
            this.resetDailyStats();
        }
    }
    
    /**
     * 更新统计
     */
    private updateStatistics() {
        // 更新完成率
        if (this.statistics.totalImpressions > 0) {
            this.statistics.completionRate = 
                this.statistics.totalCompletions / this.statistics.totalImpressions;
        }
        
        // 检查冷却时间更新
        this.updateCooldowns();
        
        // 检查每日重置
        this.checkDailyReset();
    }
    
    /**
     * 更新冷却时间
     */
    private updateCooldowns() {
        const now = Date.now();
        const toRemove: AdRewardType[] = [];
        
        this.cooldowns.forEach((endTime, rewardType) => {
            if (now >= endTime) {
                toRemove.push(rewardType);
            }
        });
        
        toRemove.forEach(rewardType => {
            this.cooldowns.delete(rewardType);
        });
    }
    
    // ==================== 公共API ====================
    
    /**
     * 显示激励视频广告
     */
    public async showRewardedVideoAd(
        rewardType: AdRewardType,
        context?: string
    ): Promise<boolean> {
        console.log(`🎥 请求激励视频广告，奖励类型: ${rewardType}`);
        
        // 检查广告是否启用
        if (!this.adConfig.rewardedVideo.enabled) {
            console.warn('⚠️ 激励视频广告已禁用');
            gameFeedbackSystem.showWarning('广告暂不可用', '请稍后重试', 3000);
            return false;
        }
        
        // 检查冷却时间
        if (this.isRewardOnCooldown(rewardType)) {
            const cooldown = this.getRewardCooldownRemaining(rewardType);
            const minutes = Math.ceil(cooldown / 60);
            gameFeedbackSystem.showWarning(
                '冷却中',
                `请等待 ${minutes} 分钟后再使用`,
                4000
            );
            return false;
        }
        
        // 检查每日限制
        if (this.dailyStats.impressions >= this.adConfig.rewardedVideo.maxPerDay) {
            gameFeedbackSystem.showInfo(
                '今日已达上限',
                '明日再来获取更多奖励',
                4000
            );
            return false;
        }
        
        // 检查展示间隔
        const timeSinceLastAd = Date.now() - this.statistics.lastAdTime;
        const minInterval = this.adConfig.rewardedVideo.showInterval * 1000;
        
        if (timeSinceLastAd < minInterval && this.statistics.lastAdTime > 0) {
            const remaining = Math.ceil((minInterval - timeSinceLastAd) / 1000);
            gameFeedbackSystem.showInfo(
                '请稍候',
                `${remaining}秒后可观看广告`,
                3000
            );
            return false;
        }
        
        // 记录广告展示
        this.recordAdImpression();
        
        // 显示广告
        try {
            const success = await weChatAdapter.showRewardedVideoAd();
            
            if (success) {
                // 广告展示成功，等待用户完成
                console.log('🎥 激励视频广告展示成功，等待用户完成');
                return true;
            } else {
                // 广告展示失败
                this.recordAdFailure();
                return false;
            }
        } catch (error) {
            console.error('🎥 激励视频广告异常:', error);
            errorHandler.reportError(
                ErrorType.ASSET,
                ErrorLevel.ERROR,
                '激励视频广告异常',
                error
            );
            return false;
        }
    }
    
    /**
     * 处理广告完成
     */
    public onAdCompleted(rewardType: AdRewardType, context?: string): void {
        console.log(`🎁 广告完成，发放奖励: ${rewardType}`);
        
        // 记录广告完成
        this.recordAdCompletion();
        
        // 发放奖励
        this.giveReward(rewardType, context);
        
        // 设置冷却时间
        this.setRewardCooldown(rewardType);
        
        // 显示奖励提示
        this.showRewardNotification(rewardType);
    }
    
    /**
     * 显示插屏广告
     */
    public async showInterstitialAd(timing: AdShowTiming): Promise<boolean> {
        // 检查广告是否启用
        if (!this.adConfig.interstitial.enabled) {
            return false;
        }
        
        // 检查时机配置
        if (!this.shouldShowInterstitial(timing)) {
            return false;
        }
        
        // 检查展示间隔
        const timeSinceLastAd = Date.now() - this.statistics.lastAdTime;
        const minInterval = this.adConfig.interstitial.showInterval * 1000;
        
        if (timeSinceLastAd < minInterval && this.statistics.lastAdTime > 0) {
            return false;
        }
        
        // 检查每日限制
        if (this.dailyStats.impressions >= this.adConfig.interstitial.maxPerDay) {
            return false;
        }
        
        console.log(`🖼️ 显示插屏广告，时机: ${timing}`);
        
        try {
            const success = await weChatAdapter.showInterstitialAd();
            
            if (success) {
                // 记录展示
                this.recordAdImpression();
                this.statistics.lastAdTime = Date.now();
                return true;
            }
        } catch (error) {
            console.error('🖼️ 插屏广告异常:', error);
        }
        
        return false;
    }
    
    /**
     * 检查是否应该显示插屏广告
     */
    private shouldShowInterstitial(timing: AdShowTiming): boolean {
        switch (timing) {
            case AdShowTiming.GAME_START:
                return this.adConfig.interstitial.showOnGameStart;
            case AdShowTiming.LEVEL_UP:
                return this.adConfig.interstitial.showOnLevelUp;
            case AdShowTiming.ENERGY_EMPTY:
                return this.adConfig.interstitial.showOnEnergyEmpty;
            default:
                return true;
        }
    }
    
    /**
     * 发放奖励
     */
    private giveReward(rewardType: AdRewardType, context?: string) {
        const config = this.rewardConfigs.get(rewardType);
        if (!config) {
            console.error(`❌ 未知的奖励类型: ${rewardType}`);
            return;
        }
        
        console.log(`🎁 发放奖励: ${config.name}`);
        
        switch (rewardType) {
            case AdRewardType.DOUBLE_GOLD:
                this.giveDoubleGoldReward(config);
                break;
                
            case AdRewardType.FREE_ENERGY:
                this.giveFreeEnergyReward(config);
                break;
                
            case AdRewardType.SPEED_BOOST:
                this.giveSpeedBoostReward(config);
                break;
                
            case AdRewardType.SPECIAL_RECIPE:
                this.giveSpecialRecipeReward(config);
                break;
                
            case AdRewardType.VIP_TEMPORARY:
                this.giveVIPTemporaryReward(config);
                break;
                
            case AdRewardType.BONUS_TIPS:
                this.giveBonusTipsReward(config);
                break;
        }
        
        // 记录收入（估算）
        this.recordRevenue(config);
    }
    
    /**
     * 发放双倍金币奖励
     */
    private giveDoubleGoldReward(config: AdRewardConfig) {
        // 激活双倍金币buff
        const duration = config.duration || 300;
        const multiplier = config.multiplier || 2.0;
        
        console.log(`💰 激活双倍金币: ${multiplier}倍, 持续${duration}秒`);
        
        // TODO: 实际激活游戏内的双倍金币buff
        gameFeedbackSystem.showSuccess(
            '双倍金币激活',
            `接下来${Math.floor(duration/60)}分钟获得双倍金币`,
            5000
        );
    }
    
    /**
     * 发放免费能量奖励
     */
    private giveFreeEnergyReward(config: AdRewardConfig) {
        const energyAmount = config.baseValue;
        
        console.log(`⚡ 获得免费能量: ${energyAmount}`);
        
        // 添加能量
        economyManager.addEnergy(energyAmount);
        
        gameFeedbackSystem.showSuccess(
            '能量恢复',
            `获得${energyAmount}点能量`,
            4000
        );
    }
    
    /**
     * 发放制作加速奖励
     */
    private giveSpeedBoostReward(config: AdRewardConfig) {
        const speedBoost = config.multiplier || 0.5;
        const duration = config.duration || 600;
        
        console.log(`⚡ 激活制作加速: 提升${speedBoost*100}%, 持续${duration}秒`);
        
        // TODO: 实际激活制作加速buff
        gameFeedbackSystem.showSuccess(
            '制作加速',
            `咖啡制作速度提升${Math.floor(speedBoost*100)}%`,
            5000
        );
    }
    
    /**
     * 发放特殊配方奖励
     */
    private giveSpecialRecipeReward(config: AdRewardConfig) {
        console.log('📜 解锁特殊配方');
        
        // TODO: 实际解锁一个随机特殊配方
        gameFeedbackSystem.showUnlock('新配方解锁', '特殊咖啡配方');
    }
    
    /**
     * 发放临时VIP奖励
     */
    private giveVIPTemporaryReward(config: AdRewardConfig) {
        const duration = config.duration || 900;
        
        console.log(`👑 激活临时VIP特权, 持续${duration}秒`);
        
        // TODO: 实际激活VIP特权
        gameFeedbackSystem.showSuccess(
            'VIP特权激活',
            '享受VIP专属服务',
            5000
        );
    }
    
    /**
     * 发放小费加成奖励
     */
    private giveBonusTipsReward(config: AdRewardConfig) {
        const bonusMultiplier = config.multiplier || 1.0;
        const duration = config.duration || 450;
        
        console.log(`💸 激活小费加成: ${bonusMultiplier*100}%, 持续${duration}秒`);
        
        // TODO: 实际激活小费加成buff
        gameFeedbackSystem.showSuccess(
            '小费加成',
            `顾客小费增加${Math.floor(bonusMultiplier*100)}%`,
            5000
        );
    }
    
    /**
     * 显示奖励通知
     */
    private showRewardNotification(rewardType: AdRewardType) {
        const config = this.rewardConfigs.get(rewardType);
        if (!config) return;
        
        gameFeedbackSystem.showSuccess(
            config.name,
            config.description,
            5000
        );
    }
    
    /**
     * 记录广告展示
     */
    private recordAdImpression() {
        this.statistics.totalImpressions++;
        this.dailyStats.impressions++;
        this.statistics.lastAdTime = Date.now();
        
        console.log(`📊 广告展示记录: 总${this.statistics.totalImpressions}, 今日${this.dailyStats.impressions}`);
    }
    
    /**
     * 记录广告完成
     */
    private recordAdCompletion() {
        this.statistics.totalCompletions++;
        this.dailyStats.completions++;
        
        console.log(`📊 广告完成记录: 总${this.statistics.totalCompletions}, 今日${this.dailyStats.completions}`);
    }
    
    /**
     * 记录广告失败
     */
    private recordAdFailure() {
        console.log('📊 广告展示失败记录');
        // 可以在这里记录失败统计
    }
    
    /**
     * 记录收入
     */
    private recordRevenue(config: AdRewardConfig) {
        // 简单估算收入（实际应该从微信广告后台获取）
        const estimatedRevenue = 0.1; // 假设每次完成收入0.1元
        
        this.statistics.totalRevenue += estimatedRevenue;
        this.dailyStats.revenue += estimatedRevenue;
        
        console.log(`💰 收入记录: +¥${estimatedRevenue.toFixed(2)}, 累计¥${this.statistics.totalRevenue.toFixed(2)}`);
    }
    
    /**
     * 检查奖励冷却状态
     */
    public isRewardOnCooldown(rewardType: AdRewardType): boolean {
        const endTime = this.cooldowns.get(rewardType);
        if (!endTime) return false;
        
        return Date.now() < endTime;
    }
    
    /**
     * 获取奖励剩余冷却时间（秒）
     */
    public getRewardCooldownRemaining(rewardType: AdRewardType): number {
        const endTime = this.cooldowns.get(rewardType);
        if (!endTime) return 0;
        
        const remaining = endTime - Date.now();
        return Math.max(0, Math.floor(remaining / 1000));
    }
    
    /**
     * 设置奖励冷却时间
     */
    private setRewardCooldown(rewardType: AdRewardType) {
        const config = this.rewardConfigs.get(rewardType);
        if (!config || !config.cooldown) return;
        
        const endTime = Date.now() + (config.cooldown * 1000);
        this.cooldowns.set(rewardType, endTime);
        
        console.log(`⏳ 设置冷却时间: ${rewardType}, ${config.cooldown}秒`);
    }
    
    /**
     * 获取广告统计
     */
    public getAdStatistics(): AdStatistics {
        return { ...this.statistics };
    }
    
    /**
     * 获取每日统计
     */
    public getDailyStats() {
        return { ...this.dailyStats };
    }
    
    /**
     * 获取所有奖励配置
     */
    public getAllRewardConfigs(): AdRewardConfig[] {
        return Array.from(this.rewardConfigs.values());
    }
    
    /**
     * 获取可用的奖励类型
     */
    public getAvailableRewards(): AdRewardType[] {
        const available: AdRewardType[] = [];
        
        this.rewardConfigs.forEach((config, rewardType) => {
            if (!this.isRewardOnCooldown(rewardType)) {
                available.push(rewardType);
            }
        });
        
        return available;
    }
    
    /**
     * 手动触发广告展示时机
     */
    public triggerAdTiming(timing: AdShowTiming, context?: any): boolean {
        console.log(`🎯 触发广告时机: ${timing}`);
        
        switch (timing) {
            case AdShowTiming.GAME_START:
                // 游戏开始时显示插屏广告
                return this.shouldShowInterstitial(timing);
                
            case AdShowTiming.LEVEL_UP:
                // 等级提升时显示插屏广告
                gameFeedbackSystem.showInfo(
                    '等级提升',
                    '恭喜升级！继续努力',
                    3000
                );
                return this.shouldShowInterstitial(timing);
                
            case AdShowTiming.ENERGY_EMPTY:
                // 能量耗尽时提供激励视频广告
                if (this.adConfig.rewardedVideo.enabled) {
                    gameFeedbackSystem.showWarning(
                        '能量耗尽',
                        '观看广告立即恢复能量',
                        5000
                    );
                    return true;
                }
                break;
                
            case AdShowTiming.DAILY_REWARD:
                // 每日奖励时提供激励视频广告
                gameFeedbackSystem.showInfo(
                    '每日奖励',
                    '观看广告获得双倍奖励',
                    4000
                );
                return true;
        }
        
        return false;
    }
    
    /**
     * 测试变现系统
     */
    public async testMonetization(): Promise<void> {
        console.log('🧪 测试微信广告变现系统');
        
        // 测试奖励配置
        console.log('🎁 奖励配置:', this.getAllRewardConfigs().map(c => c.name));
        
        // 测试可用奖励
        console.log('✅ 可用奖励:', this.getAvailableRewards());
        
        // 测试统计
        console.log('📊 广告统计:', this.getAdStatistics());
        
        // 测试冷却时间
        console.log('⏳ 冷却状态:', 
            Array.from(this.cooldowns.entries()).map(([type, time]) => ({
                type,
                remaining: Math.floor((time - Date.now()) / 1000)
            }))
        );
        
        console.log('✅ 变现系统测试完成');
    }
    
    /**
     * 保存统计数据
     */
    public saveStatistics(): void {
        // TODO: 保存统计数据到本地存储
        console.log('💾 保存广告统计数据');
    }
}

export const weChatMonetization = new WeChatMonetization();