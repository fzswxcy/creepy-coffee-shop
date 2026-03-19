/**
 * 广告管理器 - 微信小游戏广告组件集成
 * 优先实现变现系统，确保第一天上线就能产生收入
 */

import { EventTarget } from 'cc';

export enum AdType {
    /** 激励视频广告 */
    REWARDED_VIDEO = 'rewardedVideo',
    /** 插屏广告 */
    INTERSTITIAL = 'interstitial',
    /** 横幅广告 */
    BANNER = 'banner'
}

export enum AdRewardType {
    /** 双倍收益 */
    DOUBLE_EARNINGS = 'double_earnings',
    /** 立即完成生产 */
    INSTANT_PRODUCTION = 'instant_production',
    /** 额外金币 */
    EXTRA_COINS = 'extra_coins',
    /** 免费升级 */
    FREE_UPGRADE = 'free_upgrade'
}

export interface AdConfig {
    adUnitId: string;
    type: AdType;
    enabled: boolean;
    maxLoadTime?: number;
}

export interface AdReward {
    type: AdRewardType;
    amount: number;
    data?: any;
}

export class AdManager extends EventTarget {
    private static _instance: AdManager;
    private _isInitialized = false;
    private _ads: Map<string, any> = new Map();
    private _rewardCallbacks: Map<string, Function> = new Map();

    // 微信广告配置（正式环境需要替换为真实ID）
    private readonly AD_CONFIGS = {
        [AdType.REWARDED_VIDEO]: {
            adUnitId: 'adunit-example-rewarded-video',
            enabled: true,
            maxLoadTime: 10000
        },
        [AdType.INTERSTITIAL]: {
            adUnitId: 'adunit-example-interstitial',
            enabled: true,
            maxLoadTime: 5000
        },
        [AdType.BANNER]: {
            adUnitId: 'adunit-example-banner',
            enabled: false,
            maxLoadTime: 3000
        }
    };

    public static get instance(): AdManager {
        if (!AdManager._instance) {
            AdManager._instance = new AdManager();
        }
        return AdManager._instance;
    }

    private constructor() {
        super();
    }

    /**
     * 初始化广告系统
     */
    public async init(): Promise<boolean> {
        if (this._isInitialized) return true;

        try {
            // 微信小游戏广告组件初始化
            if (typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
                console.log('微信广告组件初始化...');
                
                // 初始化激励视频广告
                const videoAd = wx.createRewardedVideoAd({
                    adUnitId: this.AD_CONFIGS[AdType.REWARDED_VIDEO].adUnitId
                });
                
                videoAd.onLoad(() => {
                    console.log('激励视频广告加载成功');
                    this._ads.set(AdType.REWARDED_VIDEO, videoAd);
                });
                
                videoAd.onError((err: any) => {
                    console.error('激励视频广告加载失败:', err);
                });
                
                videoAd.onClose((res: any) => {
                    const { isEnded } = res;
                    console.log('广告关闭，是否完整播放:', isEnded);
                    
                    if (isEnded) {
                        // 触发奖励回调
                        this.emit('adRewardComplete', { type: AdType.REWARDED_VIDEO, success: true });
                    } else {
                        this.emit('adRewardComplete', { type: AdType.REWARDED_VIDEO, success: false });
                    }
                });

                // 初始化插屏广告
                const interstitialAd = wx.createInterstitialAd?.({
                    adUnitId: this.AD_CONFIGS[AdType.INTERSTITIAL].adUnitId
                });
                
                if (interstitialAd) {
                    interstitialAd.onLoad(() => {
                        console.log('插屏广告加载成功');
                        this._ads.set(AdType.INTERSTITIAL, interstitialAd);
                    });
                    
                    interstitialAd.onError((err: any) => {
                        console.error('插屏广告加载失败:', err);
                    });
                }

                this._isInitialized = true;
                console.log('广告系统初始化完成');
                return true;
            } else {
                console.warn('非微信环境或广告组件不可用，使用模拟广告');
                this._isInitialized = true;
                return true;
            }
        } catch (error) {
            console.error('广告系统初始化失败:', error);
            return false;
        }
    }

    /**
     * 显示激励视频广告
     * @param rewardType 奖励类型
     * @param rewardData 奖励数据
     * @returns Promise<boolean> 是否成功播放并获得奖励
     */
    public async showRewardedVideo(
        rewardType: AdRewardType, 
        rewardData?: any
    ): Promise<boolean> {
        const key = `${rewardType}_${Date.now()}`;
        
        return new Promise((resolve) => {
            // 监听奖励完成事件
            const onRewardComplete = (event: any) => {
                const { success } = event;
                this.off('adRewardComplete', onRewardComplete);
                
                if (success) {
                    // 发放奖励
                    this.giveReward(rewardType, rewardData);
                    this.emit('rewardGiven', { type: rewardType, data: rewardData });
                }
                
                resolve(success);
            };

            this.once('adRewardComplete', onRewardComplete);

            try {
                if (typeof wx !== 'undefined') {
                    const videoAd = this._ads.get(AdType.REWARDED_VIDEO);
                    if (videoAd) {
                        videoAd.show().catch(() => {
                            // 如果失败，回退到模拟广告
                            this.showMockAd(rewardType, rewardData).then(resolve);
                        });
                    } else {
                        // 广告未加载，使用模拟广告
                        this.showMockAd(rewardType, rewardData).then(resolve);
                    }
                } else {
                    // 非微信环境，使用模拟广告
                    this.showMockAd(rewardType, rewardData).then(resolve);
                }
            } catch (error) {
                console.error('显示激励视频广告失败:', error);
                this.showMockAd(rewardType, rewardData).then(resolve);
            }
        });
    }

    /**
     * 显示双倍收益广告
     */
    public async showDoubleEarningsAd(amount: number): Promise<boolean> {
        return this.showRewardedVideo(AdRewardType.DOUBLE_EARNINGS, { amount });
    }

    /**
     * 显示立即完成广告
     */
    public async showInstantProductionAd(productionId: string): Promise<boolean> {
        return this.showRewardedVideo(AdRewardType.INSTANT_PRODUCTION, { productionId });
    }

    /**
     * 显示插屏广告
     */
    public async showInterstitialAd(): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                if (typeof wx !== 'undefined') {
                    const interstitialAd = this._ads.get(AdType.INTERSTITIAL);
                    if (interstitialAd) {
                        interstitialAd.show().then(() => {
                            resolve(true);
                        }).catch(() => {
                            resolve(false);
                        });
                    } else {
                        resolve(false);
                    }
                } else {
                    resolve(false);
                }
            } catch (error) {
                console.error('显示插屏广告失败:', error);
                resolve(false);
            }
        });
    }

    /**
     * 发放奖励
     */
    private giveReward(rewardType: AdRewardType, rewardData?: any): void {
        // 这里应该调用游戏的经济系统发放奖励
        console.log(`发放奖励: ${rewardType}`, rewardData);
        
        // 触发奖励发放事件，由游戏逻辑处理
        this.emit('rewardGiven', { type: rewardType, data: rewardData });
    }

    /**
     * 显示模拟广告（开发/测试环境）
     */
    private async showMockAd(rewardType: AdRewardType, rewardData?: any): Promise<boolean> {
        console.log('显示模拟广告，奖励类型:', rewardType);
        
        return new Promise((resolve) => {
            // 模拟广告加载和播放
            setTimeout(() => {
                // 模拟90%的成功率
                const success = Math.random() > 0.1;
                
                if (success) {
                    // 延迟模拟广告观看时间
                    setTimeout(() => {
                        this.giveReward(rewardType, rewardData);
                        resolve(true);
                    }, 1500);
                } else {
                    resolve(false);
                }
            }, 500);
        });
    }

    /**
     * 检查广告是否可用
     */
    public isAdAvailable(type: AdType = AdType.REWARDED_VIDEO): boolean {
        if (!this._isInitialized) return false;
        
        if (typeof wx !== 'undefined') {
            const ad = this._ads.get(type);
            return ad != null;
        }
        
        // 非微信环境，模拟广告始终可用
        return true;
    }

    /**
     * 预加载广告
     */
    public preloadAds(): void {
        if (!this._isInitialized) return;
        
        // 尝试加载激励视频广告
        try {
            const videoAd = this._ads.get(AdType.REWARDED_VIDEO);
            if (videoAd) {
                videoAd.load();
            }
            
            const interstitialAd = this._ads.get(AdType.INTERSTITIAL);
            if (interstitialAd) {
                interstitialAd.load();
            }
        } catch (error) {
            console.warn('预加载广告失败:', error);
        }
    }
}

// 全局访问
export const adManager = AdManager.instance;