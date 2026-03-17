/**
 * 快速游戏接口 - 最小可玩版本
 * 极速集成，今天上线目标
 */

import { _decorator, Component, Node, Label, Button, ProgressBar } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 最小游戏接口
 */
@ccclass('QuickGameInterface')
export class QuickGameInterface extends Component {
    // 基础UI组件
    @property(Label)
    private goldLabel: Label | null = null;
    
    @property(Label)
    private timerLabel: Label | null = null;
    
    @property(ProgressBar)
    private energyBar: ProgressBar | null = null;
    
    @property(Button)
    private makeCoffeeButton: Button | null = null;
    
    @property(Button)
    private serveButton: Button | null = null;
    
    // 游戏状态
    private gold: number = 100; // 初始金钱
    private energy: number = 100; // 初始能量
    private gameTime: number = 0; // 游戏时间（秒）
    private coffeeMade: number = 0; // 制作的咖啡数量
    private customersServed: number = 0; // 服务的顾客数量
    
    // 简单的游戏循环
    private isPlaying: boolean = false;
    private gameInterval: any = null;
    
    onLoad() {
        console.log('🚀 快速游戏接口加载');
        this.initializeGame();
    }
    
    start() {
        this.startGame();
    }
    
    /**
     * 初始化游戏
     */
    private initializeGame(): void {
        console.log('🎮 初始化最小可玩版本');
        
        // 设置UI按钮事件
        if (this.makeCoffeeButton) {
            this.makeCoffeeButton.node.on('click', this.onMakeCoffee, this);
        }
        
        if (this.serveButton) {
            this.serveButton.node.on('click', this.onServeCustomer, this);
        }
        
        // 更新初始UI
        this.updateUI();
    }
    
    /**
     * 开始游戏
     */
    public startGame(): void {
        if (this.isPlaying) return;
        
        console.log('▶️ 游戏开始');
        this.isPlaying = true;
        
        // 启动游戏循环（每帧更新）
        this.gameInterval = setInterval(() => {
            this.gameLoop();
        }, 1000 / 60); // 60 FPS
        
        // 开始计时器
        this.startTimer();
    }
    
    /**
     * 游戏主循环
     */
    private gameLoop(): void {
        if (!this.isPlaying) return;
        
        // 能量自然恢复
        this.energy = Math.min(100, this.energy + 0.1);
        
        // 更新UI
        this.updateUI();
    }
    
    /**
     * 开始计时器
     */
    private startTimer(): void {
        setInterval(() => {
            this.gameTime++;
            this.updateUI();
        }, 1000);
    }
    
    /**
     * 制作咖啡
     */
    private onMakeCoffee(): void {
        if (this.energy < 10) {
            console.log('😴 能量不足！');
            return;
        }
        
        // 消耗能量
        this.energy -= 10;
        
        // 制作咖啡
        this.coffeeMade++;
        
        // 获得金钱（基础收益）
        this.gold += 5;
        
        console.log(`☕ 制作了第${this.coffeeMade}杯咖啡，获得5金币`);
        
        // 更新UI
        this.updateUI();
        
        // 简单动画效果
        this.showCoffeeEffect();
    }
    
    /**
     * 服务顾客
     */
    private onServeCustomer(): void {
        if (this.coffeeMade === 0) {
            console.log('⚠️ 没有咖啡可以服务！');
            return;
        }
        
        // 消耗一杯咖啡
        this.coffeeMade--;
        
        // 服务顾客
        this.customersServed++;
        
        // 获得更多金钱（服务收益）
        this.gold += 15;
        
        console.log(`👥 服务了第${this.customersServed}位顾客，获得15金币`);
        
        // 更新UI
        this.updateUI();
        
        // 简单动画效果
        this.showCustomerEffect();
    }
    
    /**
     * 显示制作咖啡效果
     */
    private showCoffeeEffect(): void {
        // 简单的UI反馈
        if (this.goldLabel) {
            const originalScale = this.goldLabel.node.scale;
            this.goldLabel.node.scale = originalScale.multiplyScalar(1.2);
            
            setTimeout(() => {
                this.goldLabel.node.scale = originalScale;
            }, 200);
        }
    }
    
    /**
     * 显示服务顾客效果
     */
    private showCustomerEffect(): void {
        // 简单的UI反馈
        if (this.serveButton) {
            const originalScale = this.serveButton.node.scale;
            this.serveButton.node.scale = originalScale.multiplyScalar(0.9);
            
            setTimeout(() => {
                this.serveButton.node.scale = originalScale;
            }, 200);
        }
    }
    
    /**
     * 更新UI
     */
    private updateUI(): void {
        // 更新金钱显示
        if (this.goldLabel) {
            this.goldLabel.string = `💰 ${this.gold}`;
        }
        
        // 更新时间显示
        if (this.timerLabel) {
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            this.timerLabel.string = `⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 更新能量条
        if (this.energyBar) {
            this.energyBar.progress = this.energy / 100;
        }
    }
    
    /**
     * 暂停游戏
     */
    public pauseGame(): void {
        if (!this.isPlaying) return;
        
        console.log('⏸️ 游戏暂停');
        this.isPlaying = false;
        
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
    }
    
    /**
     * 恢复游戏
     */
    public resumeGame(): void {
        if (this.isPlaying) return;
        
        console.log('▶️ 游戏恢复');
        this.startGame();
    }
    
    /**
     * 重新开始游戏
     */
    public restartGame(): void {
        console.log('🔄 重新开始游戏');
        
        // 重置游戏状态
        this.gold = 100;
        this.energy = 100;
        this.gameTime = 0;
        this.coffeeMade = 0;
        this.customersServed = 0;
        
        // 停止当前游戏
        this.pauseGame();
        
        // 重新开始
        this.startGame();
    }
    
    /**
     * 获取游戏状态
     */
    public getGameStatus(): {
        gold: number;
        time: number;
        coffeeMade: number;
        customersServed: number;
        energy: number;
    } {
        return {
            gold: this.gold,
            time: this.gameTime,
            coffeeMade: this.coffeeMade,
            customersServed: this.customersServed,
            energy: this.energy
        };
    }
    
    /**
     * 微信分享功能（简化版）
     */
    public shareToWeChat(): void {
        console.log('📤 分享到微信');
        
        // 如果在微信环境中
        if (typeof wx !== 'undefined') {
            wx.shareAppMessage({
                title: `我在微恐咖啡厅制作了${this.coffeeMade}杯咖啡！`,
                imageUrl: '/images/share.jpg'
            });
        }
    }
    
    /**
     * 微信登录（简化版）
     */
    public loginWithWeChat(): void {
        console.log('🔑 微信登录');
        
        // 如果在微信环境中
        if (typeof wx !== 'undefined') {
            wx.login({
                success: (res) => {
                    console.log('登录成功，code:', res.code);
                    // 这里可以发送到服务器获取用户信息
                }
            });
        }
    }
    
    /**
     * 微信广告展示（简化版）
     */
    public showWeChatAd(): void {
        console.log('📢 显示微信广告');
        
        // 如果在微信环境中且需要显示广告
        if (typeof wx !== 'undefined' && this.gold < 50) {
            // 可以显示激励视频广告
            console.log('可以显示激励视频广告获得更多金币');
        }
    }
    
    onDestroy() {
        // 清理资源
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }
        
        // 移除事件监听
        if (this.makeCoffeeButton) {
            this.makeCoffeeButton.node.off('click', this.onMakeCoffee, this);
        }
        
        if (this.serveButton) {
            this.serveButton.node.off('click', this.onServeCustomer, this);
        }
    }
}

/**
 * 全局快速游戏接口实例（简化单例模式）
 */
let quickGameInstance: QuickGameInterface | null = null;

export function getQuickGameInterface(): QuickGameInterface | null {
    return quickGameInstance;
}

export function setQuickGameInterface(instance: QuickGameInterface): void {
    quickGameInstance = instance;
    console.log('✅ 快速游戏接口实例已设置');
}

/**
 * 微信平台快速适配
 */
export class WeChatQuickAdapter {
    /**
     * 检查是否在微信环境
     */
    static isWeChatEnvironment(): boolean {
        return typeof wx !== 'undefined';
    }
    
    /**
     * 快速初始化微信功能
     */
    static quickInit(): void {
        if (!this.isWeChatEnvironment()) {
            console.log('🖥️ 非微信环境，启用模拟模式');
            this.setupMockEnvironment();
            return;
        }
        
        console.log('📱 微信环境检测到，初始化微信功能');
        
        // 微信系统信息
        wx.getSystemInfo({
            success: (res) => {
                console.log('设备信息:', {
                    platform: res.platform,
                    screenWidth: res.screenWidth,
                    screenHeight: res.screenHeight
                });
            }
        });
        
        // 微信登录（可选）
        wx.login({
            success: (res) => {
                if (res.code) {
                    console.log('微信登录code:', res.code);
                    // 保存到本地存储
                    wx.setStorageSync('wx_code', res.code);
                }
            }
        });
        
        // 微信分享配置
        wx.showShareMenu({
            withShareTicket: true
        });
        
        wx.onShareAppMessage(() => {
            return {
                title: '微恐咖啡厅 - 极简版',
                imageUrl: '/images/coffee_share.jpg'
            };
        });
    }
    
    /**
     * 设置模拟环境
     */
    private static setupMockEnvironment(): void {
        // 模拟wx对象用于开发
        global.wx = {
            getSystemInfo: (options: any) => {
                const systemInfo = {
                    platform: 'dev',
                    screenWidth: 750,
                    screenHeight: 1334,
                    pixelRatio: 1,
                    version: '8.0.0'
                };
                
                if (options.success) {
                    options.success(systemInfo);
                }
            },
            
            login: (options: any) => {
                const res = {
                    code: 'mock_code_123456',
                    errMsg: 'login:ok'
                };
                
                if (options.success) {
                    setTimeout(() => options.success(res), 500);
                }
            },
            
            showShareMenu: () => {
                console.log('模拟：显示分享菜单');
            },
            
            onShareAppMessage: (callback: any) => {
                console.log('模拟：分享回调注册');
            },
            
            setStorageSync: (key: string, value: any) => {
                localStorage.setItem(key, JSON.stringify(value));
            },
            
            getStorageSync: (key: string) => {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : null;
            }
        } as any;
    }
}

// 自动初始化微信适配
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        console.log('🚀 微信快速适配初始化');
        WeChatQuickAdapter.quickInit();
    });
}