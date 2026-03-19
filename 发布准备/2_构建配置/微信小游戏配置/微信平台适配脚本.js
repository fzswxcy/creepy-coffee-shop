/**
 * 微信小游戏平台适配脚本
 * 处理微信平台特性和API兼容性
 */

// 微信小游戏API兼容层
const WeChatPlatformAdapter = {
    
    /**
     * 微信API初始化
     */
    initWeChatAPI() {
        console.log('🎮 初始化微信小游戏平台适配');
        
        // 检查是否在微信环境中
        if (typeof wx !== 'undefined') {
            console.log('✅ 检测到微信小游戏环境');
            return this.setupWeChatEnvironment();
        } else {
            console.log('⚠️ 非微信环境，启用模拟模式');
            return this.setupSimulatedEnvironment();
        }
    },
    
    /**
     * 设置微信环境
     */
    setupWeChatEnvironment() {
        // 微信API适配
        this.adaptWeChatAPIs();
        
        // 微信分享功能
        this.setupWeChatShare();
        
        // 微信登录功能
        this.setupWeChatLogin();
        
        // 微信支付功能
        this.setupWeChatPayment();
        
        // 微信广告功能
        this.setupWeChatAds();
        
        // 微信云数据库
        this.setupWeChatCloudDB();
        
        console.log('✅ 微信小游戏平台适配完成');
        return true;
    },
    
    /**
     * 适配微信API
     */
    adaptWeChatAPIs() {
        // 系统信息
        wx.getSystemInfo({
            success: (res) => {
                console.log('📱 微信系统信息:', {
                    platform: res.platform,
                    version: res.version,
                    system: res.system,
                    language: res.language,
                    screenWidth: res.screenWidth,
                    screenHeight: res.screenHeight,
                    pixelRatio: res.pixelRatio
                });
                
                // 根据设备信息调整游戏设置
                this.adjustGameSettings(res);
            }
        });
        
        // 性能监控
        wx.setEnableDebug && wx.setEnableDebug({
            enableDebug: process.env.NODE_ENV === 'development'
        });
    },
    
    /**
     * 调整游戏设置
     */
    adjustGameSettings(systemInfo) {
        const settings = {
            // 根据设备性能调整画质
            graphicsQuality: this.getGraphicsQuality(systemInfo),
            
            // 根据屏幕尺寸调整UI缩放
            uiScale: this.getUIScale(systemInfo),
            
            // 根据网络情况调整资源加载
            resourceQuality: this.getResourceQuality(systemInfo),
            
            // 根据内存情况调整缓存策略
            cacheStrategy: this.getCacheStrategy(systemInfo)
        };
        
        console.log('🎛️ 游戏设置调整:', settings);
        return settings;
    },
    
    /**
     * 获取图形质量设置
     */
    getGraphicsQuality(systemInfo) {
        const { platform, model } = systemInfo;
        
        if (platform === 'ios') {
            // iOS设备通常性能较好
            return 'high';
        } else if (platform === 'android') {
            // Android设备根据型号调整
            if (model.includes('Mate') || model.includes('P40') || model.includes('Mi 11')) {
                return 'high';
            } else {
                return 'medium';
            }
        } else {
            return 'low';
        }
    },
    
    /**
     * 获取UI缩放比例
     */
    getUIScale(systemInfo) {
        const { screenWidth, screenHeight, pixelRatio } = systemInfo;
        
        // 基础设计尺寸为750x1334
        const baseWidth = 750;
        const baseHeight = 1334;
        
        // 计算缩放比例
        const scaleX = screenWidth / baseWidth;
        const scaleY = screenHeight / baseHeight;
        
        // 取较小值确保UI不超出屏幕
        return Math.min(scaleX, scaleY) * pixelRatio;
    },
    
    /**
     * 获取资源质量
     */
    getResourceQuality(systemInfo) {
        // 检查网络状态
        wx.getNetworkType({
            success: (res) => {
                const networkType = res.networkType;
                
                if (networkType === 'wifi') {
                    return 'high'; // WiFi环境下载高画质资源
                } else if (networkType === '4g') {
                    return 'medium'; // 4G网络下载中等画质
                } else {
                    return 'low'; // 2G/3G或无网络使用低画质
                }
            },
            fail: () => {
                return 'low'; // 默认低画质
            }
        });
        
        return 'medium'; // 默认中等画质
    },
    
    /**
     * 获取缓存策略
     */
    getCacheStrategy(systemInfo) {
        // 检查设备内存
        if (systemInfo.system.toLowerCase().includes('ios') || 
            systemInfo.model.includes('Mate') || 
            systemInfo.model.includes('P40')) {
            return 'aggressive'; // 高性能设备使用积极缓存
        } else {
            return 'conservative'; // 普通设备使用保守缓存
        }
    },
    
    /**
     * 设置微信分享功能
     */
    setupWeChatShare() {
        // 分享到好友
        wx.shareAppMessage({
            title: '微恐咖啡厅 - 经营你的恐怖咖啡馆',
            imageUrl: '/images/share.jpg',
            query: 'from=share'
        });
        
        // 分享到朋友圈
        wx.onShareTimeline(() => {
            return {
                title: '快来玩微恐咖啡厅！超级好玩的经营游戏',
                imageUrl: '/images/timeline.jpg'
            };
        });
        
        console.log('📤 微信分享功能已设置');
    },
    
    /**
     * 设置微信登录功能
     */
    setupWeChatLogin() {
        // 登录按钮点击处理
        wx.login({
            success: (res) => {
                if (res.code) {
                    console.log('🔑 微信登录成功，code:', res.code);
                    
                    // 向服务器发送code获取session
                    this.requestServerLogin(res.code);
                } else {
                    console.error('❌ 微信登录失败:', res.errMsg);
                }
            },
            fail: (err) => {
                console.error('❌ 微信登录调用失败:', err);
            }
        });
    },
    
    /**
     * 向服务器请求登录
     */
    requestServerLogin(code) {
        // 这里需要替换为实际的服务器地址
        const serverUrl = 'https://api.coffeehorror.com/auth/wechat';
        
        wx.request({
            url: serverUrl,
            method: 'POST',
            data: {
                code: code,
                gameId: 'coffee_horror_v1'
            },
            success: (res) => {
                if (res.data.success) {
                    const session = res.data.session;
                    const userInfo = res.data.userInfo;
                    
                    console.log('✅ 服务器登录成功:', userInfo);
                    
                    // 保存用户会话
                    wx.setStorageSync('user_session', session);
                    wx.setStorageSync('user_info', userInfo);
                    
                    // 触发登录成功事件
                    this.onLoginSuccess(userInfo);
                } else {
                    console.error('❌ 服务器登录失败:', res.data.message);
                }
            },
            fail: (err) => {
                console.error('❌ 服务器请求失败:', err);
            }
        });
    },
    
    /**
     * 设置微信支付功能
     */
    setupWeChatPayment() {
        // 内购商品列表
        this.iapProducts = [
            { id: 'coffee_beans_100', name: '咖啡豆x100', price: 6 },
            { id: 'coffee_beans_500', name: '咖啡豆x500', price: 28 },
            { id: 'coffee_beans_1200', name: '咖啡豆x1200', price: 68 },
            { id: 'remove_ads', name: '去除广告', price: 30 },
            { id: 'premium_pass', name: '高级通行证', price: 88 }
        ];
        
        console.log('💰 微信支付功能已初始化');
    },
    
    /**
     * 设置微信广告功能
     */
    setupWeChatAds() {
        // Banner广告
        this.bannerAd = wx.createBannerAd({
            adUnitId: 'adunit-123456',
            style: {
                left: 0,
                top: 0,
                width: 300
            }
        });
        
        // 激励视频广告
        this.rewardedVideoAd = wx.createRewardedVideoAd({
            adUnitId: 'adunit-654321'
        });
        
        // 插屏广告
        this.interstitialAd = wx.createInterstitialAd({
            adUnitId: 'adunit-789012'
        });
        
        console.log('📢 微信广告功能已初始化');
    },
    
    /**
     * 设置微信云数据库
     */
    setupWeChatCloudDB() {
        // 初始化云开发
        wx.cloud.init({
            env: 'coffee-horror-env', // 云环境ID
            traceUser: true
        });
        
        // 云数据库引用
        this.cloudDB = wx.cloud.database();
        
        console.log('☁️ 微信云数据库已连接');
    },
    
    /**
     * 设置模拟环境（用于开发和测试）
     */
    setupSimulatedEnvironment() {
        console.log('🖥️ 启用模拟微信环境');
        
        // 模拟微信API
        global.wx = {
            // 模拟系统信息
            getSystemInfo: (options) => {
                const systemInfo = {
                    platform: 'dev',
                    version: '8.0.0',
                    system: 'Windows 10',
                    language: 'zh_CN',
                    screenWidth: 750,
                    screenHeight: 1334,
                    pixelRatio: 1
                };
                
                if (options.success) {
                    options.success(systemInfo);
                }
            },
            
            // 模拟登录
            login: (options) => {
                const res = {
                    code: 'simulated_code_123456',
                    errMsg: 'login:ok'
                };
                
                if (options.success) {
                    setTimeout(() => options.success(res), 500);
                }
            },
            
            // 模拟分享
            shareAppMessage: (options) => {
                console.log('📤 模拟分享:', options);
            },
            
            // 模拟请求
            request: (options) => {
                console.log('🌐 模拟请求:', options.url);
                
                if (options.success) {
                    const res = {
                        data: {
                            success: true,
                            session: 'simulated_session',
                            userInfo: {
                                nickname: '测试用户',
                                avatar: '/images/default_avatar.png'
                            }
                        }
                    };
                    
                    setTimeout(() => options.success(res), 800);
                }
            },
            
            // 模拟存储
            setStorageSync: (key, value) => {
                localStorage.setItem(key, JSON.stringify(value));
            },
            
            getStorageSync: (key) => {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : null;
            }
        };
        
        // 模拟云数据库
        global.wx.cloud = {
            init: () => console.log('☁️ 模拟云开发初始化'),
            database: () => ({
                collection: () => ({
                    add: () => console.log('📝 模拟添加数据'),
                    get: () => console.log('🔍 模拟查询数据')
                })
            })
        };
        
        return true;
    },
    
    /**
     * 登录成功回调
     */
    onLoginSuccess(userInfo) {
        console.log('🎉 用户登录成功:', userInfo);
        
        // 触发全局事件
        if (this.loginSuccessCallback) {
            this.loginSuccessCallback(userInfo);
        }
    },
    
    /**
     * 注册登录成功回调
     */
    onLogin(callback) {
        this.loginSuccessCallback = callback;
    },
    
    /**
     * 获取微信小游戏版本
     */
    getWeChatVersion() {
        return new Promise((resolve, reject) => {
            if (typeof wx !== 'undefined' && wx.getSystemInfo) {
                wx.getSystemInfo({
                    success: (res) => {
                        resolve(res.version || 'unknown');
                    },
                    fail: () => {
                        resolve('unknown');
                    }
                });
            } else {
                resolve('simulated');
            }
        });
    },
    
    /**
     * 检查微信平台特性支持
     */
    checkFeatureSupport() {
        const features = {
            // 核心特性
            wechatAPI: typeof wx !== 'undefined',
            cloudDB: typeof wx !== 'undefined' && wx.cloud,
            ads: typeof wx !== 'undefined' && wx.createBannerAd,
            payment: typeof wx !== 'undefined' && wx.requestPayment,
            
            // 可选特性
            shareTimeline: typeof wx !== 'undefined' && wx.onShareTimeline,
            userInfoButton: typeof wx !== 'undefined' && wx.createUserInfoButton,
            vibrate: typeof wx !== 'undefined' && wx.vibrateShort
        };
        
        return features;
    }
};

// 导出适配器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeChatPlatformAdapter;
} else if (typeof define === 'function' && define.amd) {
    define([], function() {
        return WeChatPlatformAdapter;
    });
} else {
    window.WeChatPlatformAdapter = WeChatPlatformAdapter;
}

// 自动初始化（如果环境合适）
if (typeof wx !== 'undefined' || process.env.NODE_ENV === 'development') {
    console.log('🚀 自动初始化微信平台适配器');
    WeChatPlatformAdapter.initWeChatAPI();
}