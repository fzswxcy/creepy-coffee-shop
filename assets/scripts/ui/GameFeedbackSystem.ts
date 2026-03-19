/**
 * 游戏反馈系统
 * 提供丰富的用户反馈，包括提示、成就、特效等
 */

import { _decorator, Component, Node, Label, Sprite, tween, Vec3, Color, UIOpacity, Animation } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 反馈类型
 */
export enum FeedbackType {
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
    INFO = 'info',
    ACHIEVEMENT = 'achievement',
    LEVEL_UP = 'level_up',
    UNLOCK = 'unlock',
    TIP = 'tip'
}

/**
 * 反馈消息配置
 */
interface FeedbackConfig {
    type: FeedbackType;
    title: string;
    message: string;
    duration: number; // 显示时长（毫秒）
    icon?: string;
    sound?: string;
    vibration?: boolean;
}

/**
 * 成就数据
 */
interface AchievementData {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockTime?: number;
    progress?: number;
    target?: number;
}

@ccclass('GameFeedbackSystem')
export class GameFeedbackSystem extends Component {
    // ==================== 反馈UI组件 ====================
    @property(Node)
    private toastContainer: Node | null = null;
    
    @property(Node)
    private toastTemplate: Node | null = null;
    
    @property(Node)
    private achievementPopup: Node | null = null;
    
    @property(Node)
    private levelUpPopup: Node | null = null;
    
    @property(Node)
    private unlockPopup: Node | null = null;
    
    @property(Node)
    private tipPanel: Node | null = null;
    
    // ==================== 音效组件 ====================
    @property(Node)
    private audioManager: Node | null = null;
    
    // ==================== 数据 ====================
    private activeToasts: Node[] = [];
    private toastQueue: FeedbackConfig[] = [];
    private isShowingToast: boolean = false;
    
    // 成就数据
    private achievements: Map<string, AchievementData> = new Map();
    
    // 提示系统
    private shownTips: Set<string> = new Set();
    private tipCooldown: Map<string, number> = new Map();
    
    onLoad() {
        this.initializeFeedbackSystem();
        this.loadAchievements();
    }
    
    /**
     * 初始化反馈系统
     */
    private initializeFeedbackSystem() {
        console.log('🎭 游戏反馈系统初始化');
        
        // 隐藏所有弹出窗口
        this.hideAllPopups();
        
        // 初始化提示系统
        this.initializeTipSystem();
        
        // 开始反馈循环
        this.schedule(this.processFeedbackQueue, 0.5);
        
        console.log('✅ 反馈系统初始化完成');
    }
    
    /**
     * 隐藏所有弹出窗口
     */
    private hideAllPopups() {
        const popups = [
            this.achievementPopup,
            this.levelUpPopup,
            this.unlockPopup,
            this.tipPanel
        ];
        
        popups.forEach(popup => {
            if (popup) {
                popup.active = false;
            }
        });
    }
    
    /**
     * 初始化提示系统
     */
    private initializeTipSystem() {
        // 预加载常用提示
        this.tipCooldown.set('energy_low', 300); // 5分钟冷却
        this.tipCooldown.set('customer_waiting', 180); // 3分钟冷却
        this.tipCooldown.set('new_recipe', 600); // 10分钟冷却
        this.tipCooldown.set('vip_customer', 900); // 15分钟冷却
    }
    
    /**
     * 加载成就数据
     */
    private loadAchievements() {
        const defaultAchievements: AchievementData[] = [
            {
                id: 'first_coffee',
                name: '第一杯咖啡',
                description: '成功制作第一杯咖啡',
                icon: '☕️',
                unlocked: false
            },
            {
                id: 'served_10_customers',
                name: '忙碌的咖啡师',
                description: '服务10位顾客',
                icon: '👥',
                unlocked: false,
                progress: 0,
                target: 10
            },
            {
                id: 'perfect_service',
                name: '完美服务',
                description: '获得一次100分满意度',
                icon: '💯',
                unlocked: false
            },
            {
                id: 'spooky_master',
                name: '微恐大师',
                description: '制作所有微恐配方',
                icon: '👻',
                unlocked: false,
                progress: 0,
                target: 5
            },
            {
                id: 'vip_regular',
                name: 'VIP常客',
                description: '服务10位VIP顾客',
                icon: '👑',
                unlocked: false,
                progress: 0,
                target: 10
            },
            {
                id: 'gold_millionaire',
                name: '金币大亨',
                description: '累计赚取10000金币',
                icon: '💰',
                unlocked: false,
                progress: 0,
                target: 10000
            },
            {
                id: 'fast_barista',
                name: '快手咖啡师',
                description: '连续10次快速服务',
                icon: '⚡',
                unlocked: false,
                progress: 0,
                target: 10
            },
            {
                id: 'coffee_connoisseur',
                name: '咖啡鉴赏家',
                description: '解锁所有咖啡配方',
                icon: '📚',
                unlocked: false,
                progress: 0,
                target: 15
            }
        ];
        
        defaultAchievements.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
        
        console.log(`🏆 加载 ${this.achievements.size} 个成就`);
    }
    
    /**
     * 处理反馈队列
     */
    private processFeedbackQueue() {
        if (this.toastQueue.length > 0 && !this.isShowingToast) {
            const feedback = this.toastQueue.shift()!;
            this.showToast(feedback);
        }
    }
    
    /**
     * 显示Toast提示
     */
    private showToast(config: FeedbackConfig) {
        if (!this.toastTemplate || !this.toastContainer) return;
        
        this.isShowingToast = true;
        
        // 创建Toast
        const toast = this.toastTemplate.clone();
        toast.parent = this.toastContainer;
        toast.active = true;
        
        // 设置Toast内容
        this.setupToast(toast, config);
        
        // 添加到活跃列表
        this.activeToasts.push(toast);
        
        // 播放入场动画
        this.playToastAnimation(toast, true);
        
        // 播放音效
        this.playFeedbackSound(config.type);
        
        // 振动（如果支持）
        if (config.vibration) {
            this.vibrate();
        }
        
        // 设置自动隐藏
        setTimeout(() => {
            this.hideToast(toast);
        }, config.duration);
    }
    
    /**
     * 设置Toast内容
     */
    private setupToast(toast: Node, config: FeedbackConfig) {
        // 获取UI组件
        const iconLabel = toast.getChildByName('Icon')?.getComponent(Label);
        const titleLabel = toast.getChildByName('Title')?.getComponent(Label);
        const messageLabel = toast.getChildByName('Message')?.getComponent(Label);
        const background = toast.getChildByName('Background')?.getComponent(Sprite);
        
        // 设置图标
        if (iconLabel) {
            iconLabel.string = this.getIconForType(config.type);
        }
        
        // 设置标题
        if (titleLabel) {
            titleLabel.string = config.title;
            titleLabel.color = this.getColorForType(config.type);
        }
        
        // 设置消息
        if (messageLabel) {
            messageLabel.string = config.message;
        }
        
        // 设置背景颜色
        if (background) {
            const color = this.getBackgroundColorForType(config.type);
            background.color = color;
        }
    }
    
    /**
     * 播放Toast动画
     */
    private playToastAnimation(toast: Node, isEntering: boolean) {
        const startY = isEntering ? 100 : 0;
        const endY = isEntering ? 0 : 100;
        const startOpacity = isEntering ? 0 : 255;
        const endOpacity = isEntering ? 255 : 0;
        
        // 设置初始状态
        toast.setPosition(new Vec3(0, startY, 0));
        
        const opacity = toast.getComponent(UIOpacity) || toast.addComponent(UIOpacity);
        opacity.opacity = startOpacity;
        
        // 执行动画
        tween(toast)
            .to(0.3, { position: new Vec3(0, endY, 0) }, { easing: 'sineOut' })
            .call(() => {
                tween(opacity)
                    .to(0.2, { opacity: endOpacity })
                    .start();
            })
            .start();
    }
    
    /**
     * 隐藏Toast
     */
    private hideToast(toast: Node) {
        this.playToastAnimation(toast, false);
        
        setTimeout(() => {
            const index = this.activeToasts.indexOf(toast);
            if (index > -1) {
                this.activeToasts.splice(index, 1);
            }
            
            toast.destroy();
            this.isShowingToast = false;
        }, 500);
    }
    
    /**
     * 获取类型对应的图标
     */
    private getIconForType(type: FeedbackType): string {
        switch (type) {
            case FeedbackType.SUCCESS: return '✅';
            case FeedbackType.WARNING: return '⚠️';
            case FeedbackType.ERROR: return '❌';
            case FeedbackType.INFO: return 'ℹ️';
            case FeedbackType.ACHIEVEMENT: return '🏆';
            case FeedbackType.LEVEL_UP: return '🎉';
            case FeedbackType.UNLOCK: return '🔓';
            case FeedbackType.TIP: return '💡';
            default: return 'ℹ️';
        }
    }
    
    /**
     * 获取类型对应的颜色
     */
    private getColorForType(type: FeedbackType): Color {
        switch (type) {
            case FeedbackType.SUCCESS: return new Color(76, 175, 80); // 绿色
            case FeedbackType.WARNING: return new Color(255, 152, 0); // 橙色
            case FeedbackType.ERROR: return new Color(244, 67, 54); // 红色
            case FeedbackType.INFO: return new Color(33, 150, 243); // 蓝色
            case FeedbackType.ACHIEVEMENT: return new Color(255, 193, 7); // 黄色
            case FeedbackType.LEVEL_UP: return new Color(156, 39, 176); // 紫色
            case FeedbackType.UNLOCK: return new Color(0, 150, 136); // 青色
            case FeedbackType.TIP: return new Color(96, 125, 139); // 灰色
            default: return Color.WHITE;
        }
    }
    
    /**
     * 获取背景颜色
     */
    private getBackgroundColorForType(type: FeedbackType): Color {
        const baseColor = this.getColorForType(type);
        // 稍微调暗作为背景色
        return new Color(
            Math.max(0, baseColor.r - 50),
            Math.max(0, baseColor.g - 50),
            Math.max(0, baseColor.b - 50),
            200
        );
    }
    
    /**
     * 播放反馈音效
     */
    private playFeedbackSound(type: FeedbackType) {
        // TODO: 集成音频系统
        console.log(`🔊 播放反馈音效: ${type}`);
    }
    
    /**
     * 振动
     */
    private vibrate() {
        // TODO: 集成振动API
        console.log('📳 振动反馈');
    }
    
    // ==================== 公共API ====================
    
    /**
     * 显示成功提示
     */
    public showSuccess(title: string, message: string, duration: number = 3000) {
        this.addToQueue({
            type: FeedbackType.SUCCESS,
            title,
            message,
            duration
        });
    }
    
    /**
     * 显示警告提示
     */
    public showWarning(title: string, message: string, duration: number = 4000) {
        this.addToQueue({
            type: FeedbackType.WARNING,
            title,
            message,
            duration
        });
    }
    
    /**
     * 显示错误提示
     */
    public showError(title: string, message: string, duration: number = 5000) {
        this.addToQueue({
            type: FeedbackType.ERROR,
            title,
            message,
            duration
        });
    }
    
    /**
     * 显示信息提示
     */
    public showInfo(title: string, message: string, duration: number = 3000) {
        this.addToQueue({
            type: FeedbackType.INFO,
            title,
            message,
            duration
        });
    }
    
    /**
     * 解锁成就
     */
    public unlockAchievement(achievementId: string) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) return;
        
        // 更新成就状态
        achievement.unlocked = true;
        achievement.unlockTime = Date.now();
        
        // 显示成就解锁提示
        this.addToQueue({
            type: FeedbackType.ACHIEVEMENT,
            title: '🏆 成就解锁!',
            message: achievement.name,
            duration: 5000,
            vibration: true
        });
        
        // 显示成就弹窗
        this.showAchievementPopup(achievement);
        
        console.log(`🏆 解锁成就: ${achievement.name}`);
    }
    
    /**
     * 更新成就进度
     */
    public updateAchievementProgress(achievementId: string, progress: number) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked || !achievement.target) return;
        
        achievement.progress = progress;
        
        // 检查是否完成
        if (progress >= achievement.target) {
            this.unlockAchievement(achievementId);
        }
    }
    
    /**
     * 显示等级提升
     */
    public showLevelUp(newLevel: number) {
        this.addToQueue({
            type: FeedbackType.LEVEL_UP,
            title: '🎉 等级提升!',
            message: `恭喜升到 ${newLevel} 级`,
            duration: 5000,
            vibration: true
        });
        
        this.showLevelUpPopup(newLevel);
    }
    
    /**
     * 显示解锁提示
     */
    public showUnlock(itemName: string, itemType: string) {
        this.addToQueue({
            type: FeedbackType.UNLOCK,
            title: '🔓 新内容解锁!',
            message: `${itemType}: ${itemName}`,
            duration: 4000
        });
        
        this.showUnlockPopup(itemName, itemType);
    }
    
    /**
     * 显示游戏提示
     */
    public showTip(tipId: string, title: string, message: string) {
        // 检查冷却时间
        const lastShown = this.tipCooldown.get(tipId);
        if (lastShown && Date.now() - lastShown < 60000) {
            return; // 还在冷却中
        }
        
        // 检查是否已经显示过
        if (this.shownTips.has(tipId)) {
            return;
        }
        
        this.addToQueue({
            type: FeedbackType.TIP,
            title,
            message,
            duration: 6000
        });
        
        // 记录已显示
        this.shownTips.add(tipId);
        this.tipCooldown.set(tipId, Date.now());
        
        // 显示详细提示面板
        this.showTipPanel(title, message);
    }
    
    /**
     * 显示常用提示
     */
    public showCommonTip(tipType: 'energy_low' | 'customer_waiting' | 'new_recipe' | 'vip_customer') {
        const tips = {
            energy_low: {
                title: '⚡ 能量不足',
                message: '能量快用完了，休息一下或观看广告恢复能量'
            },
            customer_waiting: {
                title: '👥 顾客等待中',
                message: '有顾客正在等待，快点为他们服务吧！'
            },
            new_recipe: {
                title: '📚 新配方可用',
                message: '你已解锁新咖啡配方，快去试试吧！'
            },
            vip_customer: {
                title: '👑 VIP顾客到访',
                message: 'VIP顾客来了，提供优质服务可以获得更多小费！'
            }
        };
        
        const tip = tips[tipType];
        if (tip) {
            this.showTip(tipType, tip.title, tip.message);
        }
    }
    
    /**
     * 添加反馈到队列
     */
    private addToQueue(config: FeedbackConfig) {
        this.toastQueue.push(config);
    }
    
    /**
     * 显示成就弹窗
     */
    private showAchievementPopup(achievement: AchievementData) {
        if (!this.achievementPopup) return;
        
        this.achievementPopup.active = true;
        
        // TODO: 设置弹窗内容
        
        // 3秒后自动关闭
        setTimeout(() => {
            this.achievementPopup!.active = false;
        }, 3000);
    }
    
    /**
     * 显示等级提升弹窗
     */
    private showLevelUpPopup(level: number) {
        if (!this.levelUpPopup) return;
        
        this.levelUpPopup.active = true;
        
        // TODO: 设置弹窗内容
        
        setTimeout(() => {
            this.levelUpPopup!.active = false;
        }, 3000);
    }
    
    /**
     * 显示解锁弹窗
     */
    private showUnlockPopup(itemName: string, itemType: string) {
        if (!this.unlockPopup) return;
        
        this.unlockPopup.active = true;
        
        // TODO: 设置弹窗内容
        
        setTimeout(() => {
            this.unlockPopup!.active = false;
        }, 3000);
    }
    
    /**
     * 显示提示面板
     */
    private showTipPanel(title: string, message: string) {
        if (!this.tipPanel) return;
        
        this.tipPanel.active = true;
        
        // TODO: 设置面板内容
        
        setTimeout(() => {
            this.tipPanel!.active = false;
        }, 5000);
    }
    
    /**
     * 获取所有成就
     */
    public getAllAchievements(): AchievementData[] {
        return Array.from(this.achievements.values());
    }
    
    /**
     * 获取已解锁成就
     */
    public getUnlockedAchievements(): AchievementData[] {
        return this.getAllAchievements().filter(a => a.unlocked);
    }
    
    /**
     * 获取成就进度
     */
    public getAchievementProgress(achievementId: string): { progress: number; target: number } | null {
        const achievement = this.achievements.get(achievementId);
        if (!achievement) return null;
        
        return {
            progress: achievement.progress || 0,
            target: achievement.target || 1
        };
    }
}

export const gameFeedbackSystem = new GameFeedbackSystem();