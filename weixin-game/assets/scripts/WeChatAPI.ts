// 微信小游戏API集成类
// Cocos Creator兼容实现
// 创建时间: 2026年3月4日

import { sys } from 'cc';

// 微信API接口定义
interface WeChatSDK {
    login: (options: any) => void;
    getUserInfo: (options: any) => void;
    createRewardedVideoAd: (options: any) => any;
    createInterstitialAd: (options: any) => any;
    createBannerAd: (options: any) => any;
    setStorage: (options: any) => void;
    getStorage: (options: any) => any;
    getStorageSync: (key: string) => any;
    setStorageSync: (key: string, data: any) => void;
    showShareMenu: (options: any) => void;
    shareAppMessage: (options: any) => void;
    onShareAppMessage: (callback: () => any) => void;
    updateShareMenu: (options: any) => void;
    getSystemInfoSync: () => any;
    vibrateShort: (options: any) => void;
    vibrateLong: (options: any) => void;
}

// 全局微信变量声明
declare global {
    interface Window {
        wx: WeChatSDK;
    }
}

export class WeChatAPI {
    
    // 单例实例
    private static _instance: WeChatAPI = null;
    public static get instance(): WeChatAPI {
        if (WeChatAPI._instance === null) {
            WeChatAPI._instance = new WeChatAPI();
        }
        return WeChatAPI._instance;
    }
    
    // 广告实例
    private rewardedVideoAd: any = null;
    private interstitialAd: any = null;
    private bannerAd: any = null;
    
    // 用户信息
    private userInfo: {
        openId: string;
        nickName: string;
        avatarUrl: string;
    } = null;
    
    // 系统信息
    private systemInfo: any = null;
    
    constructor() {
        this.initialize();
    }
    
    // 初始化
    private initialize() {
        console.log('WeChatAPI初始化');
        
        if (this.isWeChatEnvironment()) {
            this.loadSystemInfo();
            this.setupGlobalErrorHandler();
        }
    }
    
    // 检查是否在微信环境中
    public isWeChatEnvironment(): boolean {
        // 检查全局wx对象是否存在
        const isWeChat = typeof wx !== 'undefined' && wx !== null;
        
        // 同时检查Cocos Creator的环境判断
        const platform = sys.platform;
        const isWeChatGame = platform === sys.Platform.WECHAT_GAME;
        
        return isWeChat || isWeChatGame;
    }
    
    // 加载系统信息
    private loadSystemInfo() {
        if (!this.isWeChatEnvironment()) return;
        
        try {
            this.systemInfo = wx.getSystemInfoSync();
            console.log('微信系统信息:', this.systemInfo);
        } catch (error) {
            console.error('获取系统信息失败:', error);
        }
    }
    
    // 设置全局错误处理器
    private setupGlobalErrorHandler() {
        if (!this.isWeChatEnvironment()) return;
        
        // 微信小游戏错误监听
        wx.onError && wx.onError((error: any) => {
            console.error('微信小游戏错误:', error);
            
            // 可以在这里上报错误到服务器
            this.reportError(error);
        });
        
        // 内存警告监听
        wx.onMemoryWarning && wx.onMemoryWarning((res: any) => {
            console.warn('内存警告:', res);
            
            // 触发内存清理
            this.handleMemoryWarning();
        });
    }
    
    // ==================== 登录系统 ====================
    
    // 初始化登录
    public initializeLogin(callback?: (userInfo: any) => void) {
        if (!this.isWeChatEnvironment()) {
            console.log('非微信环境，使用模拟登录');
            this.mockLogin(callback);
            return;
        }
        
        // 微信登录
        wx.login({
            success: (res) => {
                console.log('微信登录成功，code:', res.code);
                
                // 这里应该发送code到服务器换取session
                // this.exchangeCodeForSession(res.code);
                
                // 获取用户信息
                this.getUserProfile(callback);
            },
            fail: (err) => {
                console.error('微信登录失败:', err);
                this.mockLogin(callback);
            }
        });
    }
    
    // 获取用户信息
    private getUserProfile(callback?: (userInfo: any) => void) {
        if (!this.isWeChatEnvironment()) return;
        
        wx.getUserInfo({
            success: (res) => {
                console.log('获取用户信息成功:', res.userInfo);
                
                this.userInfo = {
                    openId: 'simulated_' + Date.now(),
                    nickName: res.userInfo.nickName || '神秘咖啡师',
                    avatarUrl: res.userInfo.avatarUrl || ''
                };
                
                if (callback) {
                    callback(this.userInfo);
                }
            },
            fail: (err) => {
                console.error('获取用户信息失败:', err);
                this.mockLogin(callback);
            }
        });
    }
    
    // 模拟登录（调试环境）
    private mockLogin(callback?: (userInfo: any) => void) {
        this.userInfo = {
            openId: 'debug_' + Math.random().toString(36).substr(2, 9),
            nickName: '调试用户',
            avatarUrl: ''
        };
        
        console.log('模拟登录成功:', this.userInfo);
        
        if (callback) {
            callback(this.userInfo);
        }
    }
    
    // 获取用户信息
    public getUserInfo() {
        return this.userInfo;
    }
    
    // ==================== 广告系统 ====================
    
    // 初始化广告
    public initializeAds() {
        if (!this.isWeChatEnvironment()) {
            console.log('非微信环境，广告系统初始化跳过');
            return;
        }
        
        // 初始化激励视频广告
        this.initializeRewardedVideoAd();
        
        // 初始化插屏广告
        this.initializeInterstitialAd();
        
        // 初始化Banner广告（可选）
        // this.initializeBannerAd();
    }
    
    // 初始化激励视频广告
    private initializeRewardedVideoAd() {
        if (!wx.createRewardedVideoAd) {
            console.warn('当前微信版本不支持激励视频广告');
            return;
        }
        
        try {
            this.rewardedVideoAd = wx.createRewardedVideoAd({
                adUnitId: 'your-rewarded-video-ad-unit-id'
            });
            
            // 监听广告加载错误
            this.rewardedVideoAd.onError((err: any) => {
                console.error('激励视频广告加载错误:', err);
            });
            
            // 监听广告关闭
            this.rewardedVideoAd.onClose((res: any) => {
                console.log('激励视频广告关闭:', res);
                
                // 这里可以通过事件系统通知游戏逻辑
                // director.emit('ad-closed', res);
            });
            
            console.log('激励视频广告初始化成功');
        } catch (error) {
            console.error('激励视频广告初始化失败:', error);
        }
    }
    
    // 初始化插屏广告
    private initializeInterstitialAd() {
        if (!wx.createInterstitialAd) {
            console.warn('当前微信版本不支持插屏广告');
            return;
        }
        
        try {
            this.interstitialAd = wx.createInterstitialAd({
                adUnitId: 'your-interstitial-ad-unit-id'
            });
            
            // 监听广告加载错误
            this.interstitialAd.onError((err: any) => {
                console.error('插屏广告加载错误:', err);
            });
            
            console.log('插屏广告初始化成功');
        } catch (error) {
            console.error('插屏广告初始化失败:', error);
        }
    }
    
    // 初始化Banner广告
    private initializeBannerAd() {
        if (!wx.createBannerAd) {
            console.warn('当前微信版本不支持Banner广告');
            return;
        }
        
        try {
            this.bannerAd = wx.createBannerAd({
                adUnitId: 'your-banner-ad-unit-id',
                style: {
                    left: 0,
                    top: this.systemInfo?.screenHeight - 100 || 300,
                    width: 320
                }
            });
            
            console.log('Banner广告初始化成功');
        } catch (error) {
            console.error('Banner广告初始化失败:', error);
        }
    }
    
    // 显示激励视频广告
    public showRewardedAd(onSuccess?: () => void, onFail?: (error: any) => void) {
        if (!this.rewardedVideoAd) {
            console.warn('激励视频广告未初始化');
            if (onFail) onFail({ errMsg: '广告未初始化' });
            return;
        }
        
        // 显示广告
        this.rewardedVideoAd.show().catch(() => {
            // 广告加载失败，尝试重新加载
            this.rewardedVideoAd.load().then(() => {
                this.rewardedVideoAd.show();
            }).catch((err: any) => {
                console.error('广告加载失败:', err);
                if (onFail) onFail(err);
            });
        });
        
        // 监听广告关闭
        const onCloseHandler = (res: any) => {
            if (res && res.isEnded) {
                // 正常播放结束
                console.log('激励视频广告播放完成');
                if (onSuccess) onSuccess();
            } else {
                // 播放中途退出
                console.log('用户提前关闭了激励视频');
                if (onFail) onFail({ errMsg: '用户提前关闭' });
            }
            
            // 移除监听器
            this.rewardedVideoAd.offClose(onCloseHandler);
        };
        
        this.rewardedVideoAd.onClose(onCloseHandler);
    }
    
    // 显示插屏广告
    public showInterstitialAd() {
        if (!this.interstitialAd) {
            console.warn('插屏广告未初始化');
            return;
        }
        
        this.interstitialAd.show().catch((err: any) => {
            console.error('插屏广告显示失败:', err);
        });
    }
    
    // 显示Banner广告
    public showBannerAd() {
        if (!this.bannerAd) {
            console.warn('Banner广告未初始化');
            return;
        }
        
        this.bannerAd.show();
    }
    
    // 隐藏Banner广告
    public hideBannerAd() {
        if (!this.bannerAd) return;
        
        this.bannerAd.hide();
    }
    
    // ==================== 数据存储 ====================
    
    // 保存数据
    public saveData(key: string, data: any) {
        if (!this.isWeChatEnvironment()) {
            // 本地存储
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('本地存储失败:', error);
                return false;
            }
        }
        
        try {
            wx.setStorageSync(key, data);
            return true;
        } catch (error) {
            console.error('微信存储失败:', error);
            return false;
        }
    }
    
    // 加载数据
    public loadData(key: string): any {
        if (!this.isWeChatEnvironment()) {
            // 本地存储
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.error('本地加载失败:', error);
                return null;
            }
        }
        
        try {
            return wx.getStorageSync(key);
        } catch (error) {
            console.error('微信加载失败:', error);
            return null;
        }
    }
    
    // 删除数据
    public removeData(key: string): boolean {
        if (!this.isWeChatEnvironment()) {
            // 本地存储
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('本地删除失败:', error);
                return false;
            }
        }
        
        try {
            wx.removeStorageSync(key);
            return true;
        } catch (error) {
            console.error('微信删除失败:', error);
            return false;
        }
    }
    
    // ==================== 分享系统 ====================
    
    // 初始化分享
    public initializeShare() {
        if (!this.isWeChatEnvironment()) return;
        
        // 显示分享菜单
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        });
        
        // 设置分享消息
        this.updateShareConfig();
    }
    
    // 更新分享配置
    private updateShareConfig() {
        if (!this.isWeChatEnvironment()) return;
        
        wx.updateShareMenu({
            withShareTicket: true,
            success: () => {
                console.log('分享配置更新成功');
            },
            fail: (err: any) => {
                console.error('分享配置更新失败:', err);
            }
        });
    }
    
    // 分享游戏
    public shareGame(title?: string, imageUrl?: string) {
        if (!this.isWeChatEnvironment()) {
            console.log('非微信环境，分享功能不可用');
            return;
        }
        
        const shareTitle = title || '微恐咖啡厅 - 午夜咖啡店的恐怖秘密';
        const shareImage = imageUrl || 'https://your-domain.com/share-image.jpg';
        
        wx.shareAppMessage({
            title: shareTitle,
            imageUrl: shareImage,
            query: 'from=share_' + Date.now()
        });
    }
    
    // 设置自定义分享
    public setCustomShare(callback: () => any) {
        if (!this.isWeChatEnvironment()) return;
        
        wx.onShareAppMessage(callback);
    }
    
    // ==================== 设备功能 ====================
    
    // 短震动
    public vibrateShort() {
        if (!this.isWeChatEnvironment()) return;
        
        if (wx.vibrateShort) {
            wx.vibrateShort();
        }
    }
    
    // 长震动
    public vibrateLong() {
        if (!this.isWeChatEnvironment()) return;
        
        if (wx.vibrateLong) {
            wx.vibrateLong();
        }
    }
    
    // 获取系统信息
    public getSystemInfo() {
        return this.systemInfo;
    }
    
    // 获取屏幕尺寸
    public getScreenSize() {
        if (this.systemInfo) {
            return {
                width: this.systemInfo.screenWidth,
                height: this.systemInfo.screenHeight
            };
        }
        
        return {
            width: 375,
            height: 667
        };
    }
    
    // 获取设备像素比
    public getPixelRatio() {
        if (this.systemInfo) {
            return this.systemInfo.pixelRatio || 1;
        }
        return 1;
    }
    
    // ==================== 性能监控 ====================
    
    // 上报错误
    private reportError(error: any) {
        // 这里可以实现错误上报逻辑
        console.log('错误上报:', error);
        
        // 可以上报到自己的服务器或第三方监控平台
        // this.sendToServer('error', error);
    }
    
    // 处理内存警告
    private handleMemoryWarning() {
        console.log('处理内存警告，清理资源...');
        
        // 触发游戏内存清理
        // director.emit('memory-warning');
        
        // 可以在这里清理缓存、释放资源
        this.cleanCache();
    }
    
    // 清理缓存
    private cleanCache() {
        // 清理临时数据
        console.log('清理缓存...');
        
        // 可以在这里实现具体的缓存清理逻辑
    }
    
    // ==================== 调试工具 ====================
    
    // 调试模式检查
    public isDebugMode(): boolean {
        if (!this.isWeChatEnvironment()) return true;
        
        // 可以通过版本号或特定条件判断是否为调试版本
        return this.systemInfo?.version?.includes('debug') || false;
    }
    
    // 获取版本信息
    public getVersionInfo() {
        if (!this.isWeChatEnvironment()) {
            return {
                platform: 'debug',
                version: '1.0.0',
                env: 'development'
            };
        }
        
        return {
            platform: 'wechat',
            version: this.systemInfo?.version || 'unknown',
            SDKVersion: this.systemInfo?.SDKVersion || 'unknown',
            env: this.systemInfo?.environment || 'production'
        };
    }
}

console.log('WeChatAPI类定义完成');