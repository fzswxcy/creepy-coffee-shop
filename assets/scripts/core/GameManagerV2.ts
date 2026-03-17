/**
 * 游戏管理器 v2.0 - 重构版
 * 使用状态机模式，优化架构设计
 * 
 * 改进点：
 * 1. 使用 State Pattern 管理游戏状态
 * 2. 依赖注入替代全局单例
 * 3. 事件驱动架构
 * 4. 更好的错误处理
 * 5. 性能优化
 */

import { _decorator, Component, director, game, Game } from 'cc';
import { GameState, GameStateMachine } from './GameStateMachine';
import { EventBus } from './EventBus';
import { ServiceLocator } from './ServiceLocator';

const { ccclass } = _decorator;

/**
 * 游戏管理器配置接口
 */
interface GameManagerConfig {
    enablePerformanceMonitor: boolean;
    performanceCheckInterval: number;
    autoSaveInterval: number;
    debugMode: boolean;
}

/**
 * 游戏初始化上下文
 */
interface InitContext {
    startTime: number;
    isFirstLaunch: boolean;
    userData?: any;
}

@ccclass('GameManager')
export class GameManager extends Component {
    private _stateMachine: GameStateMachine;
    private _eventBus: EventBus;
    private _serviceLocator: ServiceLocator;
    private _config: GameManagerConfig;
    private _initContext: InitContext;
    
    // 性能监控
    private _perfMonitor: PerformanceMonitor;
    private _autoSaveTimer: number | null = null;

    protected onLoad(): void {
        this._initializeComponents();
        this._setupEventHandlers();
        this._configureServices();
    }

    protected async start(): Promise<void> {
        await this._initializeGame();
    }

    protected onDestroy(): void {
        this._cleanup();
    }

    /**
     * 初始化组件
     */
    private _initializeComponents(): void {
        // 配置
        this._config = {
            enablePerformanceMonitor: true,
            performanceCheckInterval: 5000, // 5秒
            autoSaveInterval: 60000, // 1分钟
            debugMode: false
        };

        // 初始化上下文
        this._initContext = {
            startTime: Date.now(),
            isFirstLaunch: !this._hasUserData()
        };

        // 创建状态机
        this._stateMachine = new GameStateMachine();
        
        // 创建事件总线
        this._eventBus = new EventBus();
        
        // 创建服务定位器
        this._serviceLocator = new ServiceLocator();

        // 性能监控
        if (this._config.enablePerformanceMonitor) {
            this._perfMonitor = new PerformanceMonitor({
                interval: this._config.performanceCheckInterval,
                onReport: (stats) => this._onPerformanceReport(stats)
            });
        }
    }

    /**
     * 设置事件处理器
     */
    private _setupEventHandlers(): void {
        // 游戏状态变化
        this._stateMachine.onStateChange = (from, to) => {
            console.log(`[GameManager] 状态变化: ${from} -> ${to}`);
            this._eventBus.emit('game:stateChange', { from, to });
        };

        // 游戏暂停/恢复
        game.on(Game.EVENT_HIDE, () => this._onGamePause());
        game.on(Game.EVENT_SHOW, () => this._onGameResume());

        // 应用退出
        game.on(Game.EVENT_CLOSE, () => this._onGameClose());
    }

    /**
     * 配置服务
     */
    private _configureServices(): void {
        // 注册核心服务
        this._serviceLocator.register('eventBus', this._eventBus);
        this._serviceLocator.register('stateMachine', this._stateMachine);
        
        // 设置全局访问点（向后兼容）
        (window as any).gameManager = this;
        (window as any).eventBus = this._eventBus;
    }

    /**
     * 初始化游戏
     */
    private async _initializeGame(): Promise<void> {
        console.log('🎮 游戏初始化开始...');
        
        this._stateMachine.transition(GameState.INITIALIZING);

        const initSteps = [
            { name: '配置加载', fn: () => this._loadConfig() },
            { name: '服务初始化', fn: () => this._initServices() },
            { name: '数据加载', fn: () => this._loadGameData() },
            { name: '资源预加载', fn: () => this._preloadResources() },
            { name: '系统就绪', fn: () => this._finalizeInit() }
        ];

        try {
            for (const step of initSteps) {
                console.log(`  📦 ${step.name}...`);
                await step.fn();
            }

            this._stateMachine.transition(GameState.READY);
            this._onGameReady();
            
        } catch (error) {
            console.error('❌ 游戏初始化失败:', error);
            this._stateMachine.transition(GameState.ERROR);
            this._onInitError(error);
        }
    }

    /**
     * 加载配置
     */
    private async _loadConfig(): Promise<void> {
        // 从本地存储或云端加载配置
        // 可以扩展为动态配置
        return Promise.resolve();
    }

    /**
     * 初始化服务
     */
    private async _initServices(): Promise<void> {
        // 按优先级顺序初始化服务
        const services = [
            { name: 'cloudDB', priority: 1 },
            { name: 'adManager', priority: 2 },
            { name: 'iapManager', priority: 2 },
            { name: 'economyManager', priority: 3 },
            { name: 'coffeeProductionManager', priority: 3 },
            { name: 'customerManager', priority: 3 }
        ];

        // 按优先级分组并行初始化
        const priorityGroups = this._groupByPriority(services);
        
        for (const priority of Object.keys(priorityGroups).sort()) {
            const group = priorityGroups[priority];
            await Promise.all(group.map(s => this._initService(s.name)));
        }
    }

    /**
     * 初始化单个服务
     */
    private async _initService(serviceName: string): Promise<void> {
        const service = this._serviceLocator.get(serviceName);
        if (service && typeof service.init === 'function') {
            await service.init();
        }
    }

    /**
     * 按优先级分组
     */
    private _groupByPriority(services: any[]): { [key: string]: any[] } {
        return services.reduce((groups, service) => {
            const key = service.priority.toString();
            if (!groups[key]) groups[key] = [];
            groups[key].push(service);
            return groups;
        }, {});
    }

    /**
     * 加载游戏数据
     */
    private async _loadGameData(): Promise<void> {
        // 加载用户存档
        // 加载游戏配置
        // 加载本地化数据
        return Promise.resolve();
    }

    /**
     * 预加载资源
     */
    private async _preloadResources(): Promise<void> {
        // 预加载关键资源
        // 可以显示加载进度
        return Promise.resolve();
    }

    /**
     * 完成初始化
     */
    private async _finalizeInit(): Promise<void> {
        // 启动自动保存
        this._startAutoSave();
        
        // 启动性能监控
        if (this._perfMonitor) {
            this._perfMonitor.start();
        }
    }

    /**
     * 游戏就绪回调
     */
    private _onGameReady(): void {
        console.log('✅ 游戏初始化完成！');
        
        this._eventBus.emit('game:ready', {
            startTime: this._initContext.startTime,
            isFirstLaunch: this._initContext.isFirstLaunch
        });

        // 显示欢迎消息（如果是首次启动）
        if (this._initContext.isFirstLaunch) {
            this._eventBus.emit('game:firstLaunch');
        }
    }

    /**
     * 初始化错误处理
     */
    private _onInitError(error: any): void {
        this._eventBus.emit('game:error', { error });
        // 可以显示错误界面
    }

    /**
     * 游戏暂停
     */
    private _onGamePause(): void {
        this._stateMachine.transition(GameState.PAUSED);
        this._eventBus.emit('game:pause');
        
        // 暂停时保存
        this._saveGame();
    }

    /**
     * 游戏恢复
     */
    private _onGameResume(): void {
        this._stateMachine.transition(GameState.PLAYING);
        this._eventBus.emit('game:resume');
    }

    /**
     * 游戏关闭
     */
    private _onGameClose(): void {
        this._saveGame();
        this._cleanup();
    }

    /**
     * 性能报告
     */
    private _onPerformanceReport(stats: any): void {
        this._eventBus.emit('game:performance', stats);
        
        // 如果性能问题严重，可以进行优化
        if (stats.fps < 30) {
            console.warn('⚠️ 帧率过低，建议降低画质');
        }
    }

    /**
     * 启动自动保存
     */
    private _startAutoSave(): void {
        this._autoSaveTimer = window.setInterval(() => {
            this._saveGame();
        }, this._config.autoSaveInterval);
    }

    /**
     * 保存游戏
     */
    private _saveGame(): void {
        // 异步保存，不阻塞主线程
        Promise.resolve().then(() => {
            this._eventBus.emit('game:save');
        });
    }

    /**
     * 检查是否有用户数据
     */
    private _hasUserData(): boolean {
        // 检查本地存储或云端
        return false; // 简化实现
    }

    /**
     * 清理资源
     */
    private _cleanup(): void {
        if (this._autoSaveTimer) {
            clearInterval(this._autoSaveTimer);
        }
        
        if (this._perfMonitor) {
            this._perfMonitor.stop();
        }

        this._eventBus?.clear();
        this._stateMachine?.cleanup();
    }

    // ========== 公共 API ==========

    /**
     * 获取当前游戏状态
     */
    public get currentState(): GameState {
        return this._stateMachine.currentState;
    }

    /**
     * 获取事件总线
     */
    public get eventBus(): EventBus {
        return this._eventBus;
    }

    /**
     * 获取服务
     */
    public getService<T>(name: string): T | null {
        return this._serviceLocator.get<T>(name);
    }

    /**
     * 开始游戏
     */
    public startGame(): void {
        if (this._stateMachine.canTransition(GameState.PLAYING)) {
            this._stateMachine.transition(GameState.PLAYING);
            this._eventBus.emit('game:start');
        }
    }

    /**
     * 暂停游戏
     */
    public pauseGame(): void {
        this._stateMachine.transition(GameState.PAUSED);
        this._eventBus.emit('game:pause');
    }

    /**
     * 恢复游戏
     */
    public resumeGame(): void {
        this._stateMachine.transition(GameState.PLAYING);
        this._eventBus.emit('game:resume');
    }

    /**
     * 结束游戏
     */
    public endGame(reason: string): void {
        this._stateMachine.transition(GameState.GAME_OVER);
        this._eventBus.emit('game:end', { reason });
    }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
    private _config: any;
    private _timer: number | null = null;
    private _frameCount: number = 0;
    private _lastCheck: number = 0;

    constructor(config: any) {
        this._config = config;
    }

    start(): void {
        this._lastCheck = Date.now();
        this._timer = window.setInterval(() => this._check(), this._config.interval);
    }

    stop(): void {
        if (this._timer) {
            clearInterval(this._timer);
        }
    }

    private _check(): void {
        const now = Date.now();
        const delta = now - this._lastCheck;
        
        // 计算 FPS
        const fps = Math.round((this._frameCount * 1000) / delta);
        
        // 简化的性能统计
        const stats = {
            fps,
            timestamp: now,
            memory: (performance as any).memory?.usedJSHeapSize || 0
        };

        this._config.onReport?.(stats);
        
        this._frameCount = 0;
        this._lastCheck = now;
    }
}

/**
 * 简化版事件总线
 */
class EventBus {
    private _listeners: Map<string, Array<Function>> = new Map();

    on(event: string, callback: Function): void {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)!.push(callback);
    }

    off(event: string, callback: Function): void {
        const listeners = this._listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event: string, data?: any): void {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('事件处理错误:', error);
                }
            });
        }
    }

    clear(): void {
        this._listeners.clear();
    }
}

/**
 * 服务定位器
 */
class ServiceLocator {
    private _services: Map<string, any> = new Map();

    register<T>(name: string, service: T): void {
        this._services.set(name, service);
    }

    get<T>(name: string): T | null {
        return this._services.get(name) as T || null;
    }

    unregister(name: string): void {
        this._services.delete(name);
    }
}