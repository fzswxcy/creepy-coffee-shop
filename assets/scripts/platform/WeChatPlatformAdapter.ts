/**
 * 微信小游戏平台适配器
 * 处理所有微信小游戏平台的API调用和适配
 */

import { _decorator, Component } from 'cc';
import { EventManager } from '../core/EventManager';

const { ccclass } = _decorator;

/**
 * 微信API接口定义
 */
declare global {
    interface Window {
        wx?: any;
    }
}

/**
 * 平台环境类型
 */
export enum PlatformType {
    WECHAT = 'wechat',
    WEB = 'web',
    UNKNOWN = 'unknown'
}

/**
 * 平台能力检测结果
 */
export interface PlatformCapabilities {
    // 基础能力
    hasStorage: boolean;
    hasNetwork: boolean;
    hasAudio: boolean;
    hasTouch: boolean;
    
    // 变现能力
    hasRewardedVideo: boolean;
    hasInterstitialAd: boolean;
    hasBannerAd: boolean;
    hasIAP: boolean;
    
    // 社交能力
    hasUserInfo: boolean;
    hasOpenData: boolean;
    hasShare: boolean;
    hasLeaderboard: boolean;
    
    // 硬件能力
    hasAccelerometer: boolean;
    hasGyroscope: boolean;
    hasVibrate: boolean;
}

@ccclass('WeChatPlatformAdapter')
export class WeChatPlatformAdapter extends Component {
    
    private static _instance: WeChatPlatformAdapter | null = null;
    
    private _platformType: PlatformType = PlatformType.UNKNOWN;
    private _isInitialized: boolean = false;
    private _capabilities: PlatformCapabilities | null = null;
    private _userInfo: any = null;
    private _systemInfo: any = null;
    private _launchOptions: any = null;
    
    // 广告相关
    private _rewardedVideoAd: any = null;
    private _interstitialAd: any = null;
    private _bannerAd: any = null;
    private _adUnits: {
        rewardedVideo: string;
        interstitial: string;
        banner: string;
    } = {
        rewardedVideo: 'adunit-rewarded-video-id', // 需要替换为实际ID
        interstitial: 'adunit-interstitial-id',
        banner: 'adunit-banner-id'
    };
    
    /**
     * 获取单例实例
     */
    public static get instance(): WeChatPlatformAdapter | null {
        return WeChatPlatformAdapter._instance;
    }
    
    protected onLoad(): void {
        if (WeChatPlatformAdapter._instance && WeChatPlatformAdapter._instance !== this) {
            this.destroy();
            return;
        }
        
        WeChatPlatformAdapter._instance = this;
        console.log('微信平台适配器加载完成');
    }
    
    protected start(): void {
        this.initialize();
    }
    
    protected onDestroy(): void {
        this.cleanupAds();
        WeChatPlatformAdapter._instance = null;
    }
    
    /**
     * 初始化平台适配器
     */
    public async initialize(): Promise<boolean> {
        try {
            console.log('微信平台适配器初始化中...');
            
            // 1. 检测平台类型
            this.detectPlatform();
            
            // 2. 检测平台能力
            await this.detectCapabilities();
            
            // 3. 获取系统信息
            await this.getSystemInfo();
            
            // 4. 获取启动参数
            this.parseLaunchOptions();
            
            // 5. 设置事件监听
            this.setupEventListeners();
            
            // 6. 初始化广告系统
            if (this._capabilities?.hasRewardedVideo || this._capabilities?.hasInterstitialAd) {
                this.initAds();
            }
            
            // 7. 登录获取用户信息（可选）
            if (this._capabilities?.hasUserInfo) {
                this.tryGetUserInfo();
            }
            
            this._isInitialized = true;
            console.log(`微信平台适配器初始化完成 - 平台: ${this._platformType}`);
            
            // 发送平台就绪事件
            EventManager.instance.emit('platform_ready', {
                platform: this._platformType,
                capabilities: this._capabilities
            });
            
            return true;
        } catch (error) {
            console.error('微信平台适配器初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 检测平台类型
     */
    private detectPlatform(): void {
        try {
            if (typeof wx !== 'undefined') {
                this._platformType = PlatformType.WECHAT;
                console.log('检测到微信小游戏平台');
            } else if (typeof window !== 'undefined') {
                this._platformType = PlatformType.WEB;
                console.log('检测到Web平台');
            } else {
                this._platformType = PlatformType.UNKNOWN;
                console.log('检测到未知平台');
            }
        } catch (error) {
            console.warn('平台检测失败:', error);
            this._platformType = PlatformType.UNKNOWN;
        }
    }
    
    /**
     * 检测平台能力
     */
    private async detectCapabilities(): Promise<void> {
        const capabilities: PlatformCapabilities = {
            // 基础能力
            hasStorage: this.checkCapability('getStorage', 'setStorage'),
            hasNetwork: this.checkCapability('request'),
            hasAudio: this.checkCapability('createInnerAudioContext'),
            hasTouch: true, // 假设支持触摸
            
            // 变现能力
            hasRewardedVideo: this.checkCapability('createRewardedVideoAd'),
            hasInterstitialAd: this.checkCapability('createInterstitialAd'),
            hasBannerAd: this.checkCapability('createBannerAd'),
            hasIAP: this.checkCapability('requestPayment'),
            
            // 社交能力
            hasUserInfo: this.checkCapability('getUserProfile'),
            hasOpenData: this.checkCapability('getOpenDataContext'),
            hasShare: this.checkCapability('shareAppMessage'),
            hasLeaderboard: this.checkCapability('getFriendCloudStorage'),
            
            // 硬件能力
            hasAccelerometer: this.checkCapability('onAccelerometerChange'),
            hasGyroscope: this.checkCapability('onGyroscopeChange'),
            hasVibrate: this.checkCapability('vibrateShort')
        };
        
        this._capabilities = capabilities;
        
        console.log('平台能力检测结果:', capabilities);
    }
    
    /**
     * 检查特定能力
     */
    private checkCapability(...methods: string[]): boolean {
        try {
            if (this._platformType === PlatformType.WECHAT && wx) {
                let current = wx;
                for (const method of methods) {
                    if (!current[method]) {
                        return false;
                    }
                    current = current[method];
                }
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 获取系统信息
     */
    private async getSystemInfo(): Promise<void> {
        if (this._platformType === PlatformType.WECHAT && wx) {
            try {
                this._systemInfo = await new Promise((resolve, reject) => {
                    wx.getSystemInfo({
                        success: (res: any) => resolve(res),
                        fail: (err: any) => reject(err)
                    });
                });
                
                console.log('系统信息:', {
                    platform: this._systemInfo.platform,
                    system: this._systemInfo.system,
                    version: this._systemInfo.version,
                    screenWidth: this._systemInfo.screenWidth,
                    screenHeight: this._systemInfo.screenHeight,
                    pixelRatio: this._systemInfo.pixelRatio,
                    language: this._systemInfo.language,
                    benchmarkLevel: this._systemInfo.benchmarkLevel
                });
            } catch (error) {
                console.warn('获取系统信息失败:', error);
                this._systemInfo = null;
            }
        } else {
            this._systemInfo = {
                platform: 'web',
                system: 'unknown',
                version: '1.0.0',
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                pixelRatio: window.devicePixelRatio || 1,
                language: navigator.language,
                benchmarkLevel: -1
            };
        }
    }
    
    /**
     * 解析启动参数
     */
    private parseLaunchOptions(): void {
        if (this._platformType === PlatformType.WECHAT && wx) {
            try {
                this._launchOptions = wx.getLaunchOptionsSync();
                
                console.log('启动参数:', this._launchOptions);
                
                // 如果有分享参数
                if (this._launchOptions.query && Object.keys(this._launchOptions.query).length > 0) {
                    this.handleShareQuery(this._launchOptions.query);
                }
                
                // 如果有场景值
                if (this._launchOptions.scene) {
                    this.handleScene(this._launchOptions.scene);
                }
            } catch (error) {
                console.warn('解析启动参数失败:', error);
            }
        } else {
            this._launchOptions = {
                scene: 1001, // 默认场景
                query: {},
                path: '',
                shareTicket: ''
            };
        }
    }
    
    /**
     * 处理分享参数
     */
    private handleShareQuery(query: any): void {
        console.log('处理分享参数:', query);
        
        // 例如：分享邀请码
        if (query.inviteCode) {
            EventManager.instance.emit('share_invite_received', {
                inviteCode: query.inviteCode
            });
        }
        
        // 例如：分享奖励
        if (query.shareReward) {
            EventManager.instance.emit('share_reward_received', {
                rewardType: query.shareReward
            });
        }
    }
    
    /**
     * 处理场景值
     */
    private handleScene(scene: number): void {
        console.log('场景值:', scene);
        
        const sceneMap: { [key: number]: string } = {
            1001: '主界面',
            1011: '群聊会话',
            1012: '单聊会话',
            1020: '公众号菜单',
            1035: '公众号文章',
            1036: 'App分享',
            1037: '小程序打开小程序',
            1043: '公众号模板消息',
            1089: '其他小程序返回'
        };
        
        const sceneName = sceneMap[scene] || '未知场景';
        console.log(`进入场景: ${sceneName}(${scene})`);
        
        EventManager.instance.emit('scene_entered', {
            scene,
            sceneName
        });
    }
    
    /**
     * 设置事件监听
     */
    private setupEventListeners(): void {
        if (this._platformType === PlatformType.WECHAT && wx) {
            // 生命周期事件
            wx.onShow((res: any) => {
                console.log('游戏进入前台');
                EventManager.instance.emit('app_show', res);
            });
            
            wx.onHide(() => {
                console.log('游戏进入后台');
                EventManager.instance.emit('app_hide');
                
                // 自动暂停游戏
                EventManager.instance.emit(EventManager.Events.GAME_PAUSED);
            });
            
            wx.onAudioInterruptionEnd(() => {
                console.log('音频中断结束');
                EventManager.instance.emit('audio_resume');
            });
            
            // 网络状态变化
            wx.onNetworkStatusChange((res: any) => {
                console.log('网络状态变化:', res);
                EventManager.instance.emit('network_status_change', res);
            });
            
            // 微信小游戏错误
            wx.onError((error: any) => {
                console.error('微信小游戏错误:', error);
                EventManager.instance.emit('platform_error', error);
            });
        }
    }
    
    /**
     * 尝试获取用户信息
     */
    private async tryGetUserInfo(): Promise<void> {
        if (this._platformType !== PlatformType.WECHAT || !wx) {
            return;
        }
        
        try {
            // 先检查登录状态
            const loginResult = await new Promise((resolve, reject) => {
                wx.login({
                    success: resolve,
                    fail: reject
                });
            });
            
            if (!loginResult) return;
            
            // 然后获取用户信息
            const userInfo = await new Promise((resolve, reject) => {
                wx.getUserProfile({
                    desc: '用于展示用户头像和昵称',
                    success: resolve,
                    fail: reject
                });
            });
            
            if (userInfo) {
                this._userInfo = userInfo;
                console.log('获取用户信息成功:', {
                    nickName: userInfo.nickName,
                    avatarUrl: userInfo.avatarUrl
                });
                
                EventManager.instance.emit('user_info_updated', userInfo);
            }
        } catch (error) {
            console.warn('获取用户信息失败:', error);
            // 继续游戏，用户信息不是必须的
        }
    }
    
    /**
     * 初始化广告系统
     */
    private initAds(): void {
        if (this._platformType !== PlatformType.WECHAT || !wx) {
            return;
        }
        
        try {
            // 激励视频广告
            if (this._capabilities?.hasRewardedVideo) {
                this._rewardedVideoAd = wx.createRewardedVideoAd({
                    adUnitId: this._adUnits.rewardedVideo
                });
                
                this._rewardedVideoAd.onLoad(() => {
                    console.log('激励视频广告加载成功');
                    EventManager.instance.emit('ad_loaded', { type: 'rewarded_video' });
                });
                
                this._rewardedVideoAd.onError((err: any) => {
                    console.error('激励视频广告错误:', err);
                    EventManager.instance.emit('ad_error', { type: 'rewarded_video', error: err });
                });
                
                this._rewardedVideoAd.onClose((res: any) => {
                    console.log('激励视频广告关闭:', res);
                    EventManager.instance.emit('ad_closed', { 
                        type: 'rewarded_video',
                        result: res 
                    });
                });
                
                // 预加载
                this._rewardedVideoAd.load();
            }
            
            // 插屏广告
            if (this._capabilities?.hasInterstitialAd) {
                this._interstitialAd = wx.createInterstitialAd({
                    adUnitId: this._adUnits.interstitial
                });
                
                this._interstitialAd.onLoad(() => {
                    console.log('插屏广告加载成功');
                });
                
                this._interstitialAd.onError((err: any) => {
                    console.error('插屏广告错误:', err);
                });
                
                this._interstitialAd.onClose(() => {
                    console.log('插屏广告关闭');
                    EventManager.instance.emit('ad_closed', { type: 'interstitial' });
                });
                
                // 预加载
                this._interstitialAd.load();
            }
            
            console.log('广告系统初始化完成');
        } catch (error) {
            console.error('广告系统初始化失败:', error);
        }
    }
    
    /**
     * 清理广告资源
     */
    private cleanupAds(): void {
        if (this._rewardedVideoAd) {
            this._rewardedVideoAd.destroy();
            this._rewardedVideoAd = null;
        }
        
        if (this._interstitialAd) {
            this._interstitialAd.destroy();
            this._interstitialAd = null;
        }
        
        if (this._bannerAd) {
            this._bannerAd.destroy();
            this._bannerAd = null;
        }
    }
    
    /******************************
     * 公共API方法
     ******************************/
    
    /**
     * 显示激励视频广告
     */
    public async showRewardedVideoAd(): Promise<boolean> {
        if (!this._rewardedVideoAd || this._platformType !== PlatformType.WECHAT) {
            console.warn('激励视频广告不可用');
            return false;
        }
        
        try {
            // 检查广告是否已加载
            await this._rewardedVideoAd.load();
            
            // 显示广告
            await this._rewardedVideoAd.show();
            
            return true;
        } catch (error) {
            console.error('显示激励视频广告失败:', error);
            return false;
        }
    }
    
    /**
     * 显示插屏广告
     */
    public async showInterstitialAd(): Promise<boolean> {
        if (!this._interstitialAd || this._platformType !== PlatformType.WECHAT) {
            console.warn('插屏广告不可用');
            return false;
        }
        
        try {
            // 检查广告是否已加载
            await this._interstitialAd.load();
            
            // 显示广告
            await this._interstitialAd.show();
            
            return true;
        } catch (error) {
            console.error('显示插屏广告失败:', error);
            return false;
        }
    }
    
    /**
     * 分享到聊天
     */
    public shareToChat(title: string, imageUrl?: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (this._platformType !== PlatformType.WECHAT || !wx || !this._capabilities?.hasShare) {
                console.warn('分享功能不可用');
                resolve(false);
                return;
            }
            
            try {
                wx.shareAppMessage({
                    title: title,
                    imageUrl: imageUrl || '',
                    success: () => {
                        console.log('分享成功');
                        EventManager.instance.emit('share_success');
                        resolve(true);
                    },
                    fail: (err: any) => {
                        console.warn('分享失败:', err);
                        resolve(false);
                    }
                });
            } catch (error) {
                console.error('分享调用失败:', error);
                resolve(false);
            }
        });
    }
    
    /**
     * 振动反馈
     */
    public vibrate(type: 'short' | 'long' = 'short'): boolean {
        if (this._platformType !== PlatformType.WECHAT || !wx || !this._capabilities?.hasVibrate) {
            return false;
        }
        
        try {
            if (type === 'short') {
                wx.vibrateShort();
            } else {
                wx.vibrateLong();
            }
            return true;
        } catch (error) {
            console.warn('振动失败:', error);
            return false;
        }
    }
    
    /**
     * 创建横幅广告
     */
    public createBannerAd(style: any): boolean {
        if (this._platformType !== PlatformType.WECHAT || !wx || !this._capabilities?.hasBannerAd) {
            return false;
        }
        
        try {
            this._bannerAd = wx.createBannerAd({
                adUnitId: this._adUnits.banner,
                style: {
                    left: style.left || 0,
                    top: style.top || 0,
                    width: style.width || 300
                }
            });
            
            this._bannerAd.show();
            return true;
        } catch (error) {
            console.error('创建横幅广告失败:', error);
            return false;
        }
    }
    
    /**
     * 隐藏横幅广告
     */
    public hideBannerAd(): void {
        if (this._bannerAd) {
            this._bannerAd.hide();
        }
    }
    
    /**
     * 显示Toast消息
     */
    public showToast(title: string, icon: 'success' | 'loading' | 'none' = 'none', duration: number = 2000): void {
        if (this._platformType === PlatformType.WECHAT && wx) {
            try {
                wx.showToast({
                    title: title,
                    icon: icon,
                    duration: duration
                });
            } catch (error) {
                console.warn('显示Toast失败:', error);
            }
        } else {
            // Web平台模拟
            console.log(`Toast: ${title}`);
        }
    }
    
    /**
     * 显示模态对话框
     */
    public showModal(title: string, content: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (this._platformType === PlatformType.WECHAT && wx) {
                wx.showModal({
                    title: title,
                    content: content,
                    success: (res: any) => {
                        resolve(res.confirm);
                    }
                });
            } else {
                // Web平台模拟
                const confirmed = confirm(`${title}\n${content}`);
                resolve(confirmed);
            }
        });
    }
    
    /**
     * 获取平台信息
     */
    public getPlatformInfo(): {
        type: PlatformType;
        isWeChat: boolean;
        isWeb: boolean;
        systemInfo: any;
        capabilities: PlatformCapabilities | null;
    } {
        return {
            type: this._platformType,
            isWeChat: this._platformType === PlatformType.WECHAT,
            isWeb: this._platformType === PlatformType.WEB,
            systemInfo: this._systemInfo,
            capabilities: this._capabilities
        };
    }
    
    /**
     * 获取用户信息
     */
    public getUserInfo(): any {
        return this._userInfo;
    }
    
    /**
     * 获取启动参数
     */
    public getLaunchOptions(): any {
        return this._launchOptions;
    }
    
    /**
     * 检查初始化状态
     */
    public get isInitialized(): boolean {
        return this._isInitialized;
    }
}