import { _decorator, Component, Node, director, Prefab, instantiate } from 'cc';
import { EventManager } from '../core/EventManager';

const { ccclass, property } = _decorator;

/**
 * UI管理器
 * 负责所有UI面板的显示、隐藏、管理
 */
@ccclass('UIManager')
export class UIManager extends Component {
    
    private static _instance: UIManager = null;
    
    /**
     * 获取UIManager单例
     */
    public static get instance(): UIManager {
        return this._instance;
    }
    
    // UI面板预制体
    @property(Prefab)
    mainUIPrefab: Prefab = null;  // 主UI面板
    
    @property(Prefab)
    gameOverUIPrefab: Prefab = null;  // 游戏结束面板
    
    @property(Prefab)
    pauseUIPrefab: Prefab = null;  // 暂停面板
    
    @property(Prefab)
    shopUIPrefab: Prefab = null;  // 商店面板
    
    @property(Prefab)
    settingUIPrefab: Prefab = null;  // 设置面板
    
    @property(Prefab)
    adRewardUIPrefab: Prefab = null;  // 广告奖励面板
    
    @property(Prefab)
    dailyRewardUIPrefab: Prefab = null;  // 每日奖励面板
    
    // UI容器
    @property(Node)
    uiContainer: Node = null;  // UI容器节点
    
    private _currentPanels: Map<string, Node> = new Map();
    private _uiStack: string[] = [];  // UI面板堆栈
    private _isInitialized: boolean = false;
    
    // UI面板类型
    public static PanelType = {
        MAIN: 'main',
        GAME_OVER: 'game_over',
        PAUSE: 'pause',
        SHOP: 'shop',
        SETTING: 'setting',
        AD_REWARD: 'ad_reward',
        DAILY_REWARD: 'daily_reward',
        LOADING: 'loading'
    };
    
    onLoad() {
        // 单例模式
        if (UIManager._instance && UIManager._instance !== this) {
            this.node.destroy();
            return;
        }
        UIManager._instance = this;
        
        // 保持节点常驻
        director.addPersistRootNode(this.node);
        
        this.initUI();
    }
    
    /**
     * 初始化UI管理器
     */
    private initUI() {
        this.setupEventListeners();
        this._isInitialized = true;
        console.log('UI管理器初始化完成');
    }
    
    /**
     * 设置事件监听
     */
    private setupEventListeners() {
        // 游戏事件
        EventManager.instance.on(EventManager.Events.GAME_START, this.onGameStart, this);
        EventManager.instance.on(EventManager.Events.GAME_END, this.onGameEnd, this);
        EventManager.instance.on(EventManager.Events.GAME_PAUSED, this.onGamePaused, this);
        EventManager.instance.on(EventManager.Events.GAME_RESUMED, this.onGameResumed, this);
        
        // UI事件
        EventManager.instance.on('show_panel', this.showPanel.bind(this));
        EventManager.instance.on('hide_panel', this.hidePanel.bind(this));
        EventManager.instance.on('show_ad_reward', this.showAdRewardPanel.bind(this));
    }
    
    /**
     * 显示UI面板
     * @param panelType 面板类型
     * @param data 面板数据
     */
    public showPanel(panelType: string, data?: any): Node {
        // 检查是否已显示
        if (this._currentPanels.has(panelType)) {
            const panel = this._currentPanels.get(panelType);
            panel.active = true;
            this.bringToFront(panel);
            
            // 发送面板打开事件
            EventManager.instance.emit(EventManager.Events.UI_PANEL_OPEN, {
                panelType,
                data
            });
            
            return panel;
        }
        
        // 创建新面板
        const prefab = this.getPrefabByType(panelType);
        if (!prefab) {
            console.error(`找不到面板预制体: ${panelType}`);
            return null;
        }
        
        const panelNode = instantiate(prefab);
        panelNode.parent = this.uiContainer;
        panelNode.active = true;
        
        // 存储面板引用
        this._currentPanels.set(panelType, panelNode);
        this._uiStack.push(panelType);
        
        // 发送面板打开事件
        EventManager.instance.emit(EventManager.Events.UI_PANEL_OPEN, {
            panelType,
            data,
            node: panelNode
        });
        
        console.log(`显示面板: ${panelType}`);
        return panelNode;
    }
    
    /**
     * 隐藏UI面板
     * @param panelType 面板类型
     */
    public hidePanel(panelType: string): void {
        if (this._currentPanels.has(panelType)) {
            const panel = this._currentPanels.get(panelType);
            panel.active = false;
            
            // 从堆栈中移除
            const index = this._uiStack.indexOf(panelType);
            if (index > -1) {
                this._uiStack.splice(index, 1);
            }
            
            // 发送面板关闭事件
            EventManager.instance.emit(EventManager.Events.UI_PANEL_CLOSE, {
                panelType
            });
            
            console.log(`隐藏面板: ${panelType}`);
        }
    }
    
    /**
     * 关闭当前面板
     */
    public closeCurrentPanel(): void {
        if (this._uiStack.length > 0) {
            const panelType = this._uiStack.pop();
            this.hidePanel(panelType);
        }
    }
    
    /**
     * 关闭所有面板
     */
    public closeAllPanels(): void {
        for (const panelType of this._currentPanels.keys()) {
            this.hidePanel(panelType);
        }
        this._uiStack = [];
    }
    
    /**
     * 显示主UI
     */
    public showMainUI(): void {
        this.showPanel(UIManager.PanelType.MAIN);
    }
    
    /**
     * 显示游戏结束UI
     */
    public showGameOverUI(score: number): void {
        const panel = this.showPanel(UIManager.PanelType.GAME_OVER, { score });
        // 可以在这里更新分数显示
    }
    
    /**
     * 显示暂停UI
     */
    public showPauseUI(): void {
        this.showPanel(UIManager.PanelType.PAUSE);
    }
    
    /**
     * 显示商店UI
     */
    public showShopUI(): void {
        this.showPanel(UIManager.PanelType.SHOP);
    }
    
    /**
     * 显示设置UI
     */
    public showSettingUI(): void {
        this.showPanel(UIManager.PanelType.SETTING);
    }
    
    /**
     * 显示广告奖励UI
     */
    public showAdRewardPanel(rewardType: string, rewardAmount: number): void {
        const panel = this.showPanel(UIManager.PanelType.AD_REWARD, {
            type: rewardType,
            amount: rewardAmount
        });
    }
    
    /**
     * 显示每日奖励UI
     */
    public showDailyRewardUI(): void {
        const panel = this.showPanel(UIManager.PanelType.DAILY_REWARD);
    }
    
    /**
     * 将面板提到最前
     */
    private bringToFront(panelNode: Node): void {
        const siblingIndex = panelNode.parent.children.length - 1;
        panelNode.setSiblingIndex(siblingIndex);
    }
    
    /**
     * 根据类型获取预制体
     */
    private getPrefabByType(panelType: string): Prefab {
        switch (panelType) {
            case UIManager.PanelType.MAIN:
                return this.mainUIPrefab;
            case UIManager.PanelType.GAME_OVER:
                return this.gameOverUIPrefab;
            case UIManager.PanelType.PAUSE:
                return this.pauseUIPrefab;
            case UIManager.PanelType.SHOP:
                return this.shopUIPrefab;
            case UIManager.PanelType.SETTING:
                return this.settingUIPrefab;
            case UIManager.PanelType.AD_REWARD:
                return this.adRewardUIPrefab;
            case UIManager.PanelType.DAILY_REWARD:
                return this.dailyRewardUIPrefab;
            default:
                return null;
        }
    }
    
    /**
     * 游戏开始事件处理
     */
    private onGameStart(data: any): void {
        this.showMainUI();
        this.closeAllPanels();
    }
    
    /**
     * 游戏结束事件处理
     */
    private onGameEnd(data: any): void {
        this.showGameOverUI(data.score || 0);
    }
    
    /**
     * 游戏暂停事件处理
     */
    private onGamePaused(): void {
        this.showPauseUI();
    }
    
    /**
     * 游戏恢复事件处理
     */
    private onGameResumed(): void {
        this.hidePanel(UIManager.PanelType.PAUSE);
    }
    
    /**
     * 获取当前显示的面板类型
     */
    public getCurrentPanelType(): string {
        if (this._uiStack.length > 0) {
            return this._uiStack[this._uiStack.length - 1];
        }
        return '';
    }
    
    /**
     * 检查面板是否显示
     */
    public isPanelShowing(panelType: string): boolean {
        return this._currentPanels.has(panelType) && 
               this._currentPanels.get(panelType).active;
    }
    
    /**
     * 获取面板节点
     */
    public getPanelNode(panelType: string): Node {
        return this._currentPanels.get(panelType) || null;
    }
    
    /**
     * 更新UI数据
     */
    public updateUIData(panelType: string, data: any): void {
        const panel = this.getPanelNode(panelType);
        if (panel) {
            // 这里可以调用面板上的更新方法
            EventManager.instance.emit('update_panel_data', {
                panelType,
                data,
                node: panel
            });
        }
    }
    
    /**
     * 显示Toast提示
     */
    public showToast(message: string, duration: number = 2): void {
        // 这里可以实现一个Toast提示系统
        EventManager.instance.emit('show_toast', {
            message,
            duration
        });
        
        console.log(`Toast: ${message}`);
    }
    
    /**
     * 显示确认对话框
     */
    public showConfirm(message: string, callback: (confirmed: boolean) => void): void {
        EventManager.instance.emit('show_confirm', {
            message,
            callback
        });
    }
    
    /**
     * 显示加载动画
     */
    public showLoading(message?: string): void {
        EventManager.instance.emit('show_loading', { message });
    }
    
    /**
     * 隐藏加载动画
     */
    public hideLoading(): void {
        EventManager.instance.emit('hide_loading');
    }
    
    /**
     * 清理UI资源
     */
    public cleanup(): void {
        this.closeAllPanels();
        
        // 销毁所有面板
        for (const panel of this._currentPanels.values()) {
            panel.destroy();
        }
        this._currentPanels.clear();
        this._uiStack = [];
        
        console.log('UI管理器清理完成');
    }
    
    onDestroy() {
        if (UIManager._instance === this) {
            this.cleanup();
            UIManager._instance = null;
        }
        
        // 移除事件监听
        EventManager.instance.off(EventManager.Events.GAME_START, this.onGameStart, this);
        EventManager.instance.off(EventManager.Events.GAME_END, this.onGameEnd, this);
        EventManager.instance.off(EventManager.Events.GAME_PAUSED, this.onGamePaused, this);
        EventManager.instance.off(EventManager.Events.GAME_RESUMED, this.onGameResumed, this);
    }
}