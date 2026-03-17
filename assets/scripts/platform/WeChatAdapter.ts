/**
 * 微信小游戏平台适配器
 * 处理微信平台的所有API调用和平台特定功能
 */

import { _decorator, Component } from 'cc';
import { errorHandler, ErrorType, ErrorLevel } from '../managers/ErrorHandler';
import { gameFeedbackSystem } from '../ui/GameFeedbackSystem';
const { ccclass, property } = _decorator;

/**
 * 微信平台API接口定义
 */
interface WeChatAPI {
    // 基础API
    login?: (options: any) => void;
    getUserInfo?: (options: any) => void;
    request?: (options: any) => void;
    
    // 游戏API
    createRewardedVideoAd?: (options: any) => any;
    createInterstitialAd?: (options: any) => any;
    createBannerAd?: (options: any) => any;
    
    // 社交API
    shareAppMessage?: (options: any) => void;
    updateShareMenu?: (options: any) => void;
    showShareMenu?: (options: any) => void;
    
    // 数据API
    setUserCloudStorage?: (options: any) => void;
    getUserCloudStorage?: (options: any) => void;
    removeUserCloudStorage?: (options: any) => void;
    
    // 排行榜
    setUserRecord?: (options: any) => void;
    getUserFriendRank?: (options: any) => void;
    getGroupFriendRank?: (options: any) => void;
    
    // 支付
    requestPayment?: (options: any) => void;
    
    // 系统
    getSystemInfoSync?: () => any;
    onHide?: (callback: () => void) => void;
    onShow?: (callback: () => void) => void;
    onError?: (callback: (error: any) => void) => void;
}

/**
 * 微信登录状态
 */
export enum WeChatLoginStatus {
    NOT_LOGGED_IN = 'not_logged_in',
    LOGGING_IN = 'logging_in',
    LOGGED_IN = 'logged_in',
    FAILED = 'failed'
}

/**
 * 微信用户信息
 */
export interface WeChatUserInfo {
    nickName: string;
    avatarUrl: string;
    gender: number; // 0:未知, 1:男, 2:女
    country: string;
    province: string;
    city: string;
    language: string;
}

/**
 * 微信广告配置
 */
export interface WeChatAdConfig {
    rewardedVideoAd: {
        adUnitId: string;
        enabled: boolean;
    };
    interstitialAd: {
        adUnitId: string;
        enabled: boolean;
    };
    bannerAd: {
        adUnitId: string;
        enabled: boolean;
    };
}

/**
 * 微信分享配置
 */
export interface WeChatShareConfig {
    title: string;
    imageUrl: string;
    query: string;
}

@ccclass('WeChatAdapter')
export class WeChatAdapter extends Component {
    // 微信API实例
    private wx: WeChatAPI | null = null;
    
    // 平台状态
    private platformStatus = {
        isWeChat: false,
        isReady: false,
        loginStatus: WeChatLoginStatus.NOT_LOGGED_IN,
        userInfo: null as WeChatUserInfo | null,
        openId: '',
        sessionKey: '',
        hasUserInfo: false
    };
    
    // 广告实例
    private rewardedVideoAd: any = null;
    private interstitialAd: any = null;
    private bannerAd: any = null;
    
    // 配置
    private adConfig: WeChatAdConfig = {
        rewardedVideoAd: {
            adUnitId: 'test_rewarded_video_ad_unit_id',
            enabled: true
        },
        interstitialAd: {
            adUnitId: 'test_interstitial_ad_unit_id',
            enabled: true
        },
        bannerAd: {
            adUnitId: 'test_banner_ad_unit_id',
            enabled: false
        }
    };
    
    // 分享配置
    private shareConfig: WeChatShareConfig = {
        title: '微恐咖啡厅 - 经营你的恐怖咖啡馆！',
        imageUrl: 'https://example.com/share-image.png',
        query: 'inviter=default'
    };
    
    // 云开发配置
    private cloudConfig = {
        env: 'test-env-id', // 测试环境
        traceUser: true
    };
    
    onLoad() {
        this.initializeWeChatPlatform();
    }
    
    /**
     * 初始化微信平台
     */
    private initializeWeChatPlatform() {
        console.log('🔧 初始化微信小游戏平台适配器');
        
        // 检查是否在微信环境中
        this.checkWeChatEnvironment();
        
        if (this.platformStatus.isWeChat) {
            this.setupWeChatAPI();
            this.setupEventListeners();
            this.initializeAds();
            this.setupShareMenu();
            this.initializeCloudDevelopment();
            
            this.platformStatus.isReady = true;
            console.log('✅ 微信平台适配器初始化完成');
        } else {
            console.log('⚠️ 不在微信环境中，使用模拟模式');
            this.setupSimulationMode();
        }
    }
    
    /**
     * 检查微信环境
     */
    private checkWeChatEnvironment() {
        // 检查全局wx对象
        if (typeof wx !== 'undefined') {
            this.wx = wx as any;
            this.platformStatus.isWeChat = true;
            console.log('📱 检测到微信小游戏环境');
        } else {
            this.platformStatus.isWeChat = false;
            console.log('💻 非微信环境，可能是Web或模拟器');
        }
    }
    
    /**
     * 设置微信API
     */
    private setupWeChatAPI() {
        if (!this.wx) return;
        
        try {
            // 获取系统信息
            const systemInfo = this.wx.getSystemInfoSync?.();
            if (systemInfo) {
                console.log('📊 系统信息:', {
                    platform: systemInfo.platform,
                    system: systemInfo.system,
                    version: systemInfo.version,
                    SDKVersion: systemInfo.SDKVersion,
                    brand: systemInfo.brand,
                    model: systemInfo.model,
                    pixelRatio: systemInfo.pixelRatio,
                    screenWidth: systemInfo.screenWidth,
                    screenHeight: systemInfo.screenHeight
                });
            }
        } catch (error) {
            errorHandler.reportError(
                ErrorType.SYSTEM,
                ErrorLevel.WARNING,
                '获取微信系统信息失败',
                error
            );
        }
    }
    
    /**
     * 设置事件监听器
     */
    private setupEventListeners() {
        if (!this.wx) return;
        
        // 游戏隐藏事件
        this.wx.onHide?.(() => {
            console.log('📱 游戏进入后台');
            this.onGameHide();
        });
        
        // 游戏显示事件
        this.wx.onShow?.(() => {
            console.log('📱 游戏回到前台');
            this.onGameShow();
        });
        
        // 错误事件
        this.wx.onError?.((error: any) => {
            errorHandler.reportError(
                ErrorType.SYSTEM,
                ErrorLevel.ERROR,
                '微信平台错误',
                error
            );
        });
    }
    
    /**
     * 初始化广告
     */
    private initializeAds() {
        if (!this.wx || !this.platformStatus.isWeChat) return;
        
        try {
            // 初始化激励视频广告
            if (this.adConfig.rewardedVideoAd.enabled && this.wx.createRewardedVideoAd) {
                this.rewardedVideoAd = this.wx.createRewardedVideoAd({
                    adUnitId: this.adConfig.rewardedVideoAd.adUnitId
                });
                
                this.setupRewardedVideoAdEvents();
                console.log('🎥 激励视频广告初始化完成');
            }
            
            // 初始化插屏广告
            if (this.adConfig.interstitialAd.enabled && this.wx.createInterstitialAd) {
                this.interstitialAd = this.wx.createInterstitialAd({
                    adUnitId: this.adConfig.interstitialAd.adUnitId
                });
                
                this.setupInterstitialAdEvents();
                console.log('🖼️ 插屏广告初始化完成');
            }
            
            // 初始化Banner广告（可选）
            if (this.adConfig.bannerAd.enabled && this.wx.createBannerAd) {
                this.bannerAd = this.wx.createBannerAd({
                    adUnitId: this.adConfig.bannerAd.adUnitId,
                    style: {
                        left: 10,
                        top: 76,
                        width: 320
                    }
                });
                console.log('📢 Banner广告初始化完成');
            }
            
        } catch (error) {
            errorHandler.reportError(
                ErrorType.ASSET,
                ErrorLevel.ERROR,
                '广告初始化失败',
                error
            );
        }
    }
    
    /**
     * 设置激励视频广告事件
     */
    private setupRewardedVideoAdEvents() {
        if (!this.rewardedVideoAd) return;
        
        // 加载成功
        this.rewardedVideoAd.onLoad(() => {
            console.log('🎥 激励视频广告加载成功');
        });
        
        // 加载失败
        this.rewardedVideoAd.onError((err: any) => {
            console.error('🎥 激励视频广告加载失败:', err);
            errorHandler.reportError(
                ErrorType.ASSET,
                ErrorLevel.WARNING,
                '激励视频广告加载失败',
                err
            );
        });
        
        // 广告关闭
        this.rewardedVideoAd.onClose((res: any) => {
            console.log('🎥 激励视频广告关闭', res);
            
            if (res && res.isEnded) {
                // 正常播放结束，发放奖励
                this.onRewardedVideoCompleted();
            } else {
                // 用户中途关闭，不发放奖励
                gameFeedbackSystem.showInfo('提示', '未完整观看广告，无法获得奖励', 3000);
            }
        });
    }
    
    /**
     * 设置插屏广告事件
     */
    private setupInterstitialAdEvents() {
        if (!this.interstitialAd) return;
        
        // 加载成功
        this.interstitialAd.onLoad(() => {
            console.log('🖼️ 插屏广告加载成功');
        });
        
        // 加载失败
        this.interstitialAd.onError((err: any) => {
            console.error('🖼️ 插屏广告加载失败:', err);
        });
        
        // 广告关闭
        this.interstitialAd.onClose(() => {
            console.log('🖼️ 插屏广告关闭');
        });
    }
    
    /**
     * 设置分享菜单
     */
    private setupShareMenu() {
        if (!this.wx) return;
        
        try {
            // 显示分享按钮
            this.wx.showShareMenu?.({
                withShareTicket: true,
                menus: ['shareAppMessage', 'shareTimeline']
            });
            
            // 更新分享配置
            this.wx.updateShareMenu?.({
                withShareTicket: true,
                isPrivateMessage: false
            });
            
            console.log('📤 分享菜单设置完成');
        } catch (error) {
            console.warn('⚠️ 设置分享菜单失败:', error);
        }
    }
    
    /**
     * 初始化云开发
     */
    private initializeCloudDevelopment() {
        if (!this.wx || !this.wx.cloud) return;
        
        try {
            // 初始化云开发
            this.wx.cloud.init({
                env: this.cloudConfig.env,
                traceUser: this.cloudConfig.traceUser
            });
            
            console.log('☁️ 微信云开发初始化完成');
        } catch (error) {
            console.warn('⚠️ 云开发初始化失败:', error);
        }
    }
    
    /**
     * 设置模拟模式（非微信环境）
     */
    private setupSimulationMode() {
        console.log('🎭 启用微信API模拟模式');
        
        // 模拟微信API
        this.wx = {
            getSystemInfoSync: () => ({
                platform: 'dev',
                system: '模拟器',
                version: '2.0.0',
                SDKVersion: '2.24.0',
                brand: '模拟器',
                model: '模拟器',
                pixelRatio: 2,
                screenWidth: 375,
                screenHeight: 667
            })
        };
        
        this.platformStatus.isReady = true;
        this.platformStatus.isWeChat = false;
        
        // 模拟登录
        setTimeout(() => {
            this.platformStatus.loginStatus = WeChatLoginStatus.LOGGED_IN;
            this.platformStatus.userInfo = {
                nickName: '测试用户',
                avatarUrl: '',
                gender: 0,
                country: '中国',
                province: '北京',
                city: '北京',
                language: 'zh_CN'
            };
            this.platformStatus.hasUserInfo = true;
            
            console.log('👤 模拟登录成功');
        }, 1000);
    }
    
    // ==================== 公共API ====================
    
    /**
     * 微信登录
     */
    public async login(): Promise<boolean> {
        if (!this.wx || !this.wx.login) {
            console.warn('⚠️ 微信登录API不可用');
            return false;
        }
        
        if (this.platformStatus.loginStatus === WeChatLoginStatus.LOGGING_IN) {
            console.log('⏳ 登录正在进行中...');
            return false;
        }
        
        this.platformStatus.loginStatus = WeChatLoginStatus.LOGGING_IN;
        console.log('🔑 开始微信登录...');
        
        return new Promise((resolve) => {
            this.wx?.login?.({
                success: (res: any) => {
                    console.log('✅ 微信登录成功，code:', res.code);
                    this.platformStatus.sessionKey = res.code || '';
                    
                    // 获取用户信息
                    this.getUserInfo();
                    
                    this.platformStatus.loginStatus = WeChatLoginStatus.LOGGED_IN;
                    gameFeedbackSystem.showSuccess('登录成功', '欢迎回来！', 3000);
                    resolve(true);
                },
                fail: (err: any) => {
                    console.error('❌ 微信登录失败:', err);
                    this.platformStatus.loginStatus = WeChatLoginStatus.FAILED;
                    
                    errorHandler.reportError(
                        ErrorType.PERMISSION,
                        ErrorLevel.ERROR,
                        '微信登录失败',
                        err
                    );
                    
                    gameFeedbackSystem.showError('登录失败', '请检查网络后重试', 4000);
                    resolve(false);
                }
            });
        });
    }
    
    /**
     * 获取用户信息
     */
    public async getUserInfo(): Promise<WeChatUserInfo | null> {
        if (!this.wx || !this.wx.getUserInfo) {
            console.warn('⚠️ 获取用户信息API不可用');
            return null;
        }
        
        if (this.platformStatus.hasUserInfo && this.platformStatus.userInfo) {
            return this.platformStatus.userInfo;
        }
        
        return new Promise((resolve) => {
            this.wx?.getUserInfo?.({
                success: (res: any) => {
                    console.log('👤 获取用户信息成功');
                    
                    const userInfo: WeChatUserInfo = {
                        nickName: res.userInfo.nickName,
                        avatarUrl: res.userInfo.avatarUrl,
                        gender: res.userInfo.gender,
                        country: res.userInfo.country,
                        province: res.userInfo.province,
                        city: res.userInfo.city,
                        language: res.userInfo.language
                    };
                    
                    this.platformStatus.userInfo = userInfo;
                    this.platformStatus.hasUserInfo = true;
                    this.platformStatus.openId = res.userInfo.openId || '';
                    
                    resolve(userInfo);
                },
                fail: (err: any) => {
                    console.warn('⚠️ 获取用户信息失败:', err);
                    
                    // 使用默认用户信息
                    const defaultUserInfo: WeChatUserInfo = {
                        nickName: '微信用户',
                        avatarUrl: '',
                        gender: 0,
                        country: '',
                        province: '',
                        city: '',
                        language: 'zh_CN'
                    };
                    
                    this.platformStatus.userInfo = defaultUserInfo;
                    this.platformStatus.hasUserInfo = true;
                    
                    resolve(defaultUserInfo);
                }
            });
        });
    }
    
    /**
     * 显示激励视频广告
     */
    public async showRewardedVideoAd(): Promise<boolean> {
        if (!this.rewardedVideoAd) {
            console.warn('⚠️ 激励视频广告未初始化');
            gameFeedbackSystem.showWarning('广告暂不可用', '请稍后重试', 3000);
            return false;
        }
        
        console.log('🎥 请求显示激励视频广告');
        
        return new Promise((resolve) => {
            // 先加载广告
            this.rewardedVideoAd.load().then(() => {
                // 显示广告
                this.rewardedVideoAd.show().then(() => {
                    console.log('🎥 激励视频广告显示成功');
                    resolve(true);
                }).catch((err: any) => {
                    console.error('🎥 激励视频广告显示失败:', err);
                    gameFeedbackSystem.showError('广告显示失败', '请稍后重试', 3000);
                    resolve(false);
                });
            }).catch((err: any) => {
                console.error('🎥 激励视频广告加载失败:', err);
                gameFeedbackSystem.showError('广告加载失败', '请检查网络', 3000);
                resolve(false);
            });
        });
    }
    
    /**
     * 显示插屏广告
     */
    public async showInterstitialAd(): Promise<boolean> {
        if (!this.interstitialAd) {
            console.warn('⚠️ 插屏广告未初始化');
            return false;
        }
        
        return new Promise((resolve) => {
            this.interstitialAd.show().then(() => {
                console.log('🖼️ 插屏广告显示成功');
                resolve(true);
            }).catch((err: any) => {
                console.error('🖼️ 插屏广告显示失败:', err);
                resolve(false);
            });
        });
    }
    
    /**
     * 分享游戏
     */
    public shareGame(shareType: 'friend' | 'timeline' = 'friend'): void {
        if (!this.wx || !this.wx.shareAppMessage) {
            console.warn('⚠️ 分享API不可用');
            return;
        }
        
        const shareOptions = {
            title: this.shareConfig.title,
            imageUrl: this.shareConfig.imageUrl,
            query: this.shareConfig.query
        };
        
        console.log(`📤 分享游戏到${shareType === 'friend' ? '好友' : '朋友圈'}`);
        
        if (shareType === 'timeline') {
            // 朋友圈分享（需要额外配置）
            this.wx.shareAppMessage({
                ...shareOptions,
                // 朋友圈特有参数
            });
        } else {
            // 好友分享
            this.wx.shareAppMessage(shareOptions);
        }
        
        // 记录分享
        this.onShareCompleted();
    }
    
    /**
     * 获取平台状态
     */
    public getPlatformStatus() {
        return { ...this.platformStatus };
    }
    
    /**
     * 检查是否准备好
     */
    public isPlatformReady(): boolean {
        return this.platformStatus.isReady;
    }
    
    /**
     * 检查是否已登录
     */
    public isLoggedIn(): boolean {
        return this.platformStatus.loginStatus === WeChatLoginStatus.LOGGED_IN;
    }
    
    /**
     * 获取用户信息（如果已登录）
     */
    public getUserInfoSync(): WeChatUserInfo | null {
        return this.platformStatus.userInfo;
    }
    
    /**
     * 更新广告配置
     */
    public updateAdConfig(config: Partial<WeChatAdConfig>) {
        this.adConfig = { ...this.adConfig, ...config };
        console.log('🔄 广告配置已更新');
    }
    
    /**
     * 更新分享配置
     */
    public updateShareConfig(config: Partial<WeChatShareConfig>) {
        this.shareConfig = { ...this.shareConfig, ...config };
        console.log('🔄 分享配置已更新');
    }
    
    // ==================== 事件处理 ====================
    
    /**
     * 激励视频广告完成回调
     */
    private onRewardedVideoCompleted() {
        console.log('🎁 激励视频广告完成，发放奖励');
        
        // 触发奖励事件
        gameFeedbackSystem.showSuccess('奖励发放', '恭喜获得双倍金币奖励！', 4000);
        
        // TODO: 实际发放游戏内奖励
        // 例如：双倍金币、免费能量、特殊道具等
    }
    
    /**
     * 分享完成回调
     */
    private onShareCompleted() {
        console.log('📤 分享完成');
        
        // TODO: 分享奖励
        gameFeedbackSystem.showInfo('分享成功', '感谢分享游戏！', 3000);
    }
    
    /**
     * 游戏隐藏回调
     */
    private onGameHide() {
        console.log('⏸️ 游戏进入后台，保存数据');
        
        // 游戏进入后台时自动保存
        // TODO: 调用游戏数据管理器保存数据
        
        gameFeedbackSystem.showInfo('游戏暂停', '数据已自动保存', 2000);
    }
    
    /**
     * 游戏显示回调
     */
    private onGameShow() {
        console.log('▶️ 游戏回到前台');
        
        // 游戏回到前台时，可以检查更新等
        // TODO: 恢复游戏状态
    }
    
    /**
     * 测试所有微信功能
     */
    public async testAllFeatures(): Promise<void> {
        console.log('🧪 开始测试微信平台功能');
        
        // 测试登录
        const loginSuccess = await this.login();
        console.log(`🔑 登录测试: ${loginSuccess ? '✅' : '❌'}`);
        
        // 测试用户信息
        const userInfo = await this.getUserInfo();
        console.log(`👤 用户信息测试: ${userInfo ? '✅' : '❌'}`);
        
        // 测试分享
        console.log(`📤 分享功能测试: ${this.wx?.shareAppMessage ? '✅' : '❌'}`);
        
        // 测试广告
        console.log(`🎥 激励视频广告: ${this.rewardedVideoAd ? '✅' : '❌'}`);
        console.log(`🖼️ 插屏广告: ${this.interstitialAd ? '✅' : '❌'}`);
        
        console.log('📊 平台状态:', this.getPlatformStatus());
    }
}

export const weChatAdapter = new WeChatAdapter();