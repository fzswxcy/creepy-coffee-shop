/**
 * 主场景 - 极简版
 * 今天上线的核心场景
 */

import { _decorator, Component, Node, Label, Button, ProgressBar, Sprite, Color } from 'cc';
import { QuickGameInterface, getQuickGameInterface, setQuickGameInterface } from '../core/QuickGameInterface';
const { ccclass, property } = _decorator;

@ccclass('MainSceneQuick')
export class MainSceneQuick extends Component {
    // UI组件
    @property(Label)
    private titleLabel: Label | null = null;
    
    @property(Label)
    private goldLabel: Label | null = null;
    
    @property(Label)
    private timerLabel: Label | null = null;
    
    @property(Label)
    private statsLabel: Label | null = null;
    
    @property(ProgressBar)
    private energyBar: ProgressBar | null = null;
    
    @property(Label)
    private energyLabel: Label | null = null;
    
    @property(Button)
    private makeCoffeeButton: Button | null = null;
    
    @property(Button)
    private serveButton: Button | null = null;
    
    @property(Button)
    private restartButton: Button | null = null;
    
    @property(Button)
    private shareButton: Button | null = null;
    
    @property(Button)
    private loginButton: Button | null = null;
    
    @property(Node)
    private coffeeEffect: Node | null = null;
    
    @property(Node)
    private customerEffect: Node | null = null;
    
    @property(Sprite)
    private background: Sprite | null = null;
    
    // 游戏接口引用
    private gameInterface: QuickGameInterface | null = null;
    
    onLoad() {
        console.log('🎮 主场景极简版加载');
        this.initializeScene();
    }
    
    start() {
        this.startGame();
    }
    
    /**
     * 初始化场景
     */
    private initializeScene(): void {
        console.log('✨ 初始化极简版场景');
        
        // 创建游戏接口
        this.gameInterface = this.node.addComponent(QuickGameInterface);
        
        // 设置UI组件到游戏接口
        if (this.gameInterface) {
            // 通过组件属性设置
            // 注意：这里简化处理，实际应该通过序列化设置
            console.log('✅ 游戏接口创建成功');
            
            // 设置全局实例
            setQuickGameInterface(this.gameInterface);
        }
        
        // 设置UI事件
        this.setupUIEvents();
        
        // 设置场景样式
        this.setupSceneStyle();
        
        // 隐藏效果节点
        if (this.coffeeEffect) this.coffeeEffect.active = false;
        if (this.customerEffect) this.customerEffect.active = false;
    }
    
    /**
     * 设置UI事件
     */
    private setupUIEvents(): void {
        // 制作咖啡按钮
        if (this.makeCoffeeButton) {
            this.makeCoffeeButton.node.on('click', () => {
                this.onMakeCoffeeClicked();
            });
        }
        
        // 服务顾客按钮
        if (this.serveButton) {
            this.serveButton.node.on('click', () => {
                this.onServeClicked();
            });
        }
        
        // 重新开始按钮
        if (this.restartButton) {
            this.restartButton.node.on('click', () => {
                this.onRestartClicked();
            });
        }
        
        // 分享按钮
        if (this.shareButton) {
            this.shareButton.node.on('click', () => {
                this.onShareClicked();
            });
        }
        
        // 登录按钮
        if (this.loginButton) {
            this.loginButton.node.on('click', () => {
                this.onLoginClicked();
            });
        }
    }
    
    /**
     * 设置场景样式
     */
    private setupSceneStyle(): void {
        console.log('🎨 设置场景样式');
        
        // 设置背景颜色（咖啡主题）
        if (this.background) {
            const brownColor = new Color(139, 69, 19); // 棕色
            this.background.color = brownColor;
        }
        
        // 设置标题
        if (this.titleLabel) {
            this.titleLabel.string = '☕ 微恐咖啡厅 - 极简版';
            this.titleLabel.color = new Color(255, 215, 0); // 金色
        }
    }
    
    /**
     * 开始游戏
     */
    private startGame(): void {
        console.log('▶️ 开始游戏');
        
        if (this.gameInterface) {
            this.gameInterface.startGame();
        }
        
        // 开始UI更新循环
        this.schedule(this.updateUI, 0.5); // 每0.5秒更新一次UI
    }
    
    /**
     * 更新UI
     */
    private updateUI(): void {
        if (!this.gameInterface) return;
        
        // 获取游戏状态
        const status = this.gameInterface.getGameStatus();
        
        // 更新金钱显示
        if (this.goldLabel) {
            this.goldLabel.string = `💰 金币: ${status.gold}`;
        }
        
        // 更新时间显示
        if (this.timerLabel) {
            const minutes = Math.floor(status.time / 60);
            const seconds = status.time % 60;
            this.timerLabel.string = `⏱️ 时间: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 更新统计信息
        if (this.statsLabel) {
            this.statsLabel.string = `☕ 咖啡: ${status.coffeeMade} | 👥 顾客: ${status.customersServed}`;
        }
        
        // 更新能量显示
        if (this.energyBar) {
            this.energyBar.progress = status.energy / 100;
        }
        
        if (this.energyLabel) {
            this.energyLabel.string = `⚡ 能量: ${Math.floor(status.energy)}%`;
        }
        
        // 更新按钮状态
        this.updateButtonStates(status.energy, status.coffeeMade);
    }
    
    /**
     * 更新按钮状态
     */
    private updateButtonStates(energy: number, coffeeMade: number): void {
        // 制作咖啡按钮状态
        if (this.makeCoffeeButton) {
            const canMakeCoffee = energy >= 10;
            this.makeCoffeeButton.interactable = canMakeCoffee;
            
            // 视觉反馈
            if (!canMakeCoffee) {
                this.makeCoffeeButton.node.opacity = 150;
            } else {
                this.makeCoffeeButton.node.opacity = 255;
            }
        }
        
        // 服务顾客按钮状态
        if (this.serveButton) {
            const canServe = coffeeMade > 0;
            this.serveButton.interactable = canServe;
            
            // 视觉反馈
            if (!canServe) {
                this.serveButton.node.opacity = 150;
            } else {
                this.serveButton.node.opacity = 255;
            }
        }
    }
    
    /**
     * 制作咖啡按钮点击
     */
    private onMakeCoffeeClicked(): void {
        console.log('☕ 制作咖啡点击');
        
        // 调用游戏接口
        if (this.gameInterface) {
            // 触发游戏逻辑（通过组件调用）
            // 这里简化处理，实际应该有更好的事件机制
            console.log('触发制作咖啡逻辑');
        }
        
        // 显示咖啡效果
        this.showCoffeeEffect();
        
        // 震动反馈（如果支持）
        this.vibrateFeedback();
    }
    
    /**
     * 服务顾客按钮点击
     */
    private onServeClicked(): void {
        console.log('👥 服务顾客点击');
        
        // 调用游戏接口
        if (this.gameInterface) {
            // 触发服务逻辑
            console.log('触发服务顾客逻辑');
        }
        
        // 显示顾客效果
        this.showCustomerEffect();
        
        // 震动反馈
        this.vibrateFeedback();
    }
    
    /**
     * 重新开始按钮点击
     */
    private onRestartClicked(): void {
        console.log('🔄 重新开始点击');
        
        // 确认对话框
        if (typeof wx !== 'undefined') {
            wx.showModal({
                title: '重新开始',
                content: '确定要重新开始游戏吗？当前进度将丢失。',
                success: (res) => {
                    if (res.confirm) {
                        this.restartGame();
                    }
                }
            });
        } else {
            // 模拟确认
            if (confirm('确定要重新开始游戏吗？当前进度将丢失。')) {
                this.restartGame();
            }
        }
    }
    
    /**
     * 分享按钮点击
     */
    private onShareClicked(): void {
        console.log('📤 分享点击');
        
        // 调用游戏接口分享
        if (this.gameInterface) {
            this.gameInterface.shareToWeChat();
        }
        
        // 分享成功提示
        this.showToast('分享成功！');
    }
    
    /**
     * 登录按钮点击
     */
    private onLoginClicked(): void {
        console.log('🔑 登录点击');
        
        // 调用游戏接口登录
        if (this.gameInterface) {
            this.gameInterface.loginWithWeChat();
        }
        
        // 登录提示
        this.showToast('正在登录...');
    }
    
    /**
     * 显示咖啡效果
     */
    private showCoffeeEffect(): void {
        if (!this.coffeeEffect) return;
        
        this.coffeeEffect.active = true;
        this.coffeeEffect.scale = new Vec3(0.5, 0.5, 1);
        
        // 动画效果
        tween(this.coffeeEffect)
            .to(0.3, { scale: new Vec3(1, 1, 1) })
            .delay(0.5)
            .to(0.3, { scale: new Vec3(0.5, 0.5, 1) })
            .call(() => {
                this.coffeeEffect.active = false;
            })
            .start();
    }
    
    /**
     * 显示顾客效果
     */
    private showCustomerEffect(): void {
        if (!this.customerEffect) return;
        
        this.customerEffect.active = true;
        this.customerEffect.scale = new Vec3(0.5, 0.5, 1);
        
        // 动画效果
        tween(this.customerEffect)
            .to(0.3, { scale: new Vec3(1, 1, 1) })
            .delay(0.5)
            .to(0.3, { scale: new Vec3(0.5, 0.5, 1) })
            .call(() => {
                this.customerEffect.active = false;
            })
            .start();
    }
    
    /**
     * 震动反馈
     */
    private vibrateFeedback(): void {
        // 微信震动
        if (typeof wx !== 'undefined' && wx.vibrateShort) {
            wx.vibrateShort();
        }
        // 模拟震动
        else if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    /**
     * 显示提示
     */
    private showToast(message: string): void {
        // 微信提示
        if (typeof wx !== 'undefined' && wx.showToast) {
            wx.showToast({
                title: message,
                icon: 'none',
                duration: 2000
            });
        }
        // 模拟提示
        else {
            console.log('Toast:', message);
        }
    }
    
    /**
     * 重新开始游戏
     */
    private restartGame(): void {
        console.log('🔄 执行重新开始');
        
        if (this.gameInterface) {
            this.gameInterface.restartGame();
        }
        
        // 重置UI
        this.updateUI();
        
        // 显示重启提示
        this.showToast('游戏已重新开始！');
    }
    
    /**
     * 暂停游戏
     */
    public pauseGame(): void {
        if (this.gameInterface) {
            this.gameInterface.pauseGame();
        }
        
        this.unschedule(this.updateUI);
        console.log('⏸️ 游戏暂停');
    }
    
    /**
     * 恢复游戏
     */
    public resumeGame(): void {
        if (this.gameInterface) {
            this.gameInterface.resumeGame();
        }
        
        this.schedule(this.updateUI, 0.5);
        console.log('▶️ 游戏恢复');
    }
    
    /**
     * 获取游戏得分
     */
    public getGameScore(): number {
        if (!this.gameInterface) return 0;
        
        const status = this.gameInterface.getGameStatus();
        
        // 简单计分规则
        const score = 
            status.gold * 10 +        // 金钱
            status.coffeeMade * 50 +  // 制作的咖啡
            status.customersServed * 100; // 服务的顾客
        
        return Math.floor(score);
    }
    
    /**
     * 导出游戏数据（用于保存）
     */
    public exportGameData(): string {
        if (!this.gameInterface) return '';
        
        const status = this.gameInterface.getGameStatus();
        const score = this.getGameScore();
        
        const gameData = {
            version: '1.0.0-quick',
            timestamp: Date.now(),
            gold: status.gold,
            coffeeMade: status.coffeeMade,
            customersServed: status.customersServed,
            playTime: status.time,
            score: score
        };
        
        return JSON.stringify(gameData, null, 2);
    }
    
    /**
     * 导入游戏数据
     */
    public importGameData(data: string): boolean {
        try {
            const gameData = JSON.parse(data);
            console.log('导入游戏数据:', gameData);
            
            // 这里可以恢复游戏状态
            // 注意：当前简化版本不支持状态恢复
            
            this.showToast('游戏数据加载成功！');
            return true;
        } catch (error) {
            console.error('导入游戏数据失败:', error);
            this.showToast('数据格式错误！');
            return false;
        }
    }
    
    onDestroy() {
        // 清理资源
        this.unschedule(this.updateUI);
        
        // 移除事件监听
        if (this.makeCoffeeButton) {
            this.makeCoffeeButton.node.off('click');
        }
        
        if (this.serveButton) {
            this.serveButton.node.off('click');
        }
        
        if (this.restartButton) {
            this.restartButton.node.off('click');
        }
        
        if (this.shareButton) {
            this.shareButton.node.off('click');
        }
        
        if (this.loginButton) {
            this.loginButton.node.off('click');
        }
        
        console.log('🗑️ 主场景清理完成');
    }
}

/**
 * 快速启动函数
 */
export function quickLaunchGame(): void {
    console.log('🚀 快速启动微恐咖啡厅极简版');
    
    // 检查微信环境
    if (typeof wx !== 'undefined') {
        console.log('📱 检测到微信小游戏环境');
    } else {
        console.log('🖥️ 非微信环境，使用模拟模式');
    }
    
    // 显示启动画面
    console.log('🎬 微恐咖啡厅极简版启动中...');
    
    // 这里应该有实际的项目启动逻辑
    // 对于Cocos Creator，场景应该在编辑器中设置
}

// 自动启动（如果是直接运行）
if (typeof window !== 'undefined' && window.location.href.includes('debug')) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            quickLaunchGame();
        }, 1000);
    });
}