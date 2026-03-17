/**
 * 主游戏循环系统 - 增强版
 * 负责游戏的核心循环：状态管理、时间控制、输入处理、性能优化
 * 专门为微信小游戏《微恐咖啡厅》设计
 */

import { _decorator, Component, Node, director, game } from 'cc';
import { GameManager } from '../core/GameManager';
import { EventManager, EventManagerEvents } from '../core/EventManager';
import { MainSceneController } from './MainSceneController';
import { WeChatPlatformAdapter } from '../platform/WeChatPlatformAdapter';

const { ccclass, property } = _decorator;

/**
 * 游戏循环状态
 */
export enum GameLoopState {
    IDLE = 'idle',          // 空闲状态
    INITIALIZING = 'initializing', // 初始化中
    RUNNING = 'running',    // 正常运行
    PAUSED = 'paused',      // 暂停状态
    SLOW_MOTION = 'slow_motion', // 慢动作模式（用于微恐效果）
    FAST_FORWARD = 'fast_forward', // 快进模式（用于加速）
    GAME_OVER = 'game_over' // 游戏结束
}

/**
 * 游戏循环性能配置
 */
interface GameLoopConfig {
    targetFPS: number;           // 目标帧率
    timeScale: number;           // 时间缩放
    fixedDeltaTime: number;      // 固定时间步长
    maxFrameSkip: number;        // 最大跳帧数
    enableAdaptiveFPS: boolean;  // 启用自适应FPS
    enableVSync: boolean;        // 启用垂直同步
}

@ccclass('MainGameLoopEnhanced')
export class MainGameLoopEnhanced extends Component {
    
    private static _instance: MainGameLoopEnhanced | null = null;
    
    // 游戏循环状态
    private _currentState: GameLoopState = GameLoopState.IDLE;
    private _previousState: GameLoopState = GameLoopState.IDLE;
    
    // 游戏时间
    private _gameTime: number = 0;           // 游戏内时间（秒）
    private _realTime: number = 0;           // 真实时间（秒）
    private _timeScale: number = 1.0;        // 时间缩放
    private _dayProgress: number = 0;        // 当天进度（0-1）
    private _currentDay: number = 1;         // 当前天数
    
    // 游戏循环配置
    private _config: GameLoopConfig = {
        targetFPS: 60,
        timeScale: 1.0,
        fixedDeltaTime: 1 / 60,  // 60Hz固定时间步长
        maxFrameSkip: 5,
        enableAdaptiveFPS: true,
        enableVSync: true
    };
    
    // 性能统计
    private _performance: {
        fps: number;
        frameTime: number;
        updateTime: number;
        fixedUpdateTime: number;
        drawCalls: number;
        memoryUsage: number;
    } = {
        fps: 0,
        frameTime: 0,
        updateTime: 0,
        fixedUpdateTime: 0,
        drawCalls: 0,
        memoryUsage: 0
    };
    
    // 固定时间步长系统
    private _fixedTimeAccumulator: number = 0;
    private _lastFrameTime: number = 0;
    private _frameCount: number = 0;
    private _lastFPSCheckTime: number = 0;
    
    // 微恐系统相关
    private _horrorIntensity: number = 0;          // 恐怖强度（0-1）
    private _scareCooldown: number = 0;            // 惊吓冷却时间
    private _horrorEventsQueue: Array<{type: string, intensity: number}> = []; // 恐怖事件队列
    
    // 游戏逻辑组件引用
    private _mainSceneController: MainSceneController | null = null;
    private _platformAdapter: WeChatPlatformAdapter | null = null;
    
    // 输入状态
    private _inputState: {
        touchPositions: Map<number, {x: number, y: number}>;  // 触摸位置
        isTouching: boolean;
        lastTouchTime: number;
    } = {
        touchPositions: new Map(),
        isTouching: false,
        lastTouchTime: 0
    };
    
    /**
     * 获取单例实例
     */
    public static get instance(): MainGameLoopEnhanced | null {
        return MainGameLoopEnhanced._instance;
    }
    
    protected onLoad(): void {
        if (MainGameLoopEnhanced._instance && MainGameLoopEnhanced._instance !== this) {
            this.destroy();
            return;
        }
        
        MainGameLoopEnhanced._instance = this;
        
        // 保持节点常驻
        director.addPersistRootNode(this.node);
        
        console.log('主游戏循环增强版加载完成');
    }
    
    protected start(): void {
        this.initialize();
    }
    
    protected onDestroy(): void {
        // 清理事件监听
        this.removeEventListeners();
        
        MainGameLoopEnhanced._instance = null;
    }
    
    /**
     * 初始化游戏循环
     */
    private initialize(): void {
        console.log('主游戏循环增强版初始化...');
        
        try {
            // 1. 设置初始状态
            this._currentState = GameLoopState.INITIALIZING;
            
            // 2. 获取组件引用
            this.getComponentReferences();
            
            // 3. 设置游戏循环配置
            this.setupGameLoopConfig();
            
            // 4. 设置输入监听
            this.setupInputListeners();
            
            // 5. 设置事件监听
            this.setupEventListeners();
            
            // 6. 初始化时间系统
            this._lastFrameTime = performance.now();
            this._lastFPSCheckTime = this._lastFrameTime;
            
            // 7. 启动游戏循环
            this._currentState = GameLoopState.RUNNING;
            
            console.log('主游戏循环增强版初始化完成，状态:', this._currentState);
            
            // 触发游戏循环就绪事件
            EventManager.instance.emit('game_loop_ready');
            
        } catch (error) {
            console.error('主游戏循环增强版初始化失败:', error);
            this._currentState = GameLoopState.GAME_OVER;
        }
    }
    
    /**
     * 获取组件引用
     */
    private getComponentReferences(): void {
        // 查找主场景控制器
        const mainScene = director.getScene();
        if (mainScene) {
            this._mainSceneController = mainScene.getComponentInChildren(MainSceneController);
        }
        
        // 查找平台适配器
        this._platformAdapter = WeChatPlatformAdapter.instance;
        
        console.log('组件引用获取完成:', {
            hasMainSceneController: !!this._mainSceneController,
            hasPlatformAdapter: !!this._platformAdapter
        });
    }
    
    /**
     * 设置游戏循环配置
     */
    private setupGameLoopConfig(): void {
        // 根据平台调整配置
        if (this._platformAdapter) {
            const platformInfo = this._platformAdapter.getPlatformInfo();
            
            // 微信小游戏性能适配
            if (platformInfo.isWeChat) {
                const systemInfo = platformInfo.systemInfo;
                
                // 根据设备性能调整目标FPS
                if (systemInfo && systemInfo.benchmarkLevel >= 0) {
                    if (systemInfo.benchmarkLevel >= 2) {
                        // 高性能设备
                        this._config.targetFPS = 60;
                        this._config.enableAdaptiveFPS = false;
                    } else if (systemInfo.benchmarkLevel >= 1) {
                        // 中性能设备
                        this._config.targetFPS = 45;
                        this._config.enableAdaptiveFPS = true;
                    } else {
                        // 低性能设备
                        this._config.targetFPS = 30;
                        this._config.enableAdaptiveFPS = true;
                    }
                }
            }
        }
        
        // 设置游戏帧率
        game.setFrameRate(this._config.targetFPS);
        
        console.log('游戏循环配置完成:', this._config);
    }
    
    /**
     * 设置输入监听
     */
    private setupInputListeners(): void {
        // 触摸开始
        this.node.on(Node.EventType.TOUCH_START, (event: any) => {
            const touch = event.getTouches()[0];
            if (touch) {
                const touchId = touch.getID();
                const location = touch.getLocation();
                
                this._inputState.touchPositions.set(touchId, {
                    x: location.x,
                    y: location.y
                });
                this._inputState.isTouching = true;
                this._inputState.lastTouchTime = Date.now();
                
                // 发送触摸开始事件
                EventManager.instance.emit('touch_start', {
                    touchId,
                    x: location.x,
                    y: location.y,
                    timestamp: this._inputState.lastTouchTime
                });
                
                // 微恐效果：触摸可能触发恐怖事件
                if (this._horrorIntensity > 0.5 && Math.random() < 0.1) {
                    this.triggerHorrorEvent('touch_scare', this._horrorIntensity * 0.8);
                }
            }
        }, this);
        
        // 触摸移动
        this.node.on(Node.EventType.TOUCH_MOVE, (event: any) => {
            const touches = event.getTouches();
            for (const touch of touches) {
                const touchId = touch.getID();
                const location = touch.getLocation();
                
                if (this._inputState.touchPositions.has(touchId)) {
                    this._inputState.touchPositions.set(touchId, {
                        x: location.x,
                        y: location.y
                    });
                    
                    // 发送触摸移动事件
                    EventManager.instance.emit('touch_move', {
                        touchId,
                        x: location.x,
                        y: location.y,
                        timestamp: Date.now()
                    });
                }
            }
        }, this);
        
        // 触摸结束
        this.node.on(Node.EventType.TOUCH_END, (event: any) => {
            const touch = event.getTouches()[0];
            if (touch) {
                const touchId = touch.getID();
                const location = touch.getLocation();
                
                this._inputState.touchPositions.delete(touchId);
                if (this._inputState.touchPositions.size === 0) {
                    this._inputState.isTouching = false;
                }
                
                // 发送触摸结束事件
                EventManager.instance.emit('touch_end', {
                    touchId,
                    x: location.x,
                    y: location.y,
                    timestamp: Date.now()
                });
            }
        }, this);
        
        console.log('输入监听设置完成');
    }
    
    /**
     * 设置事件监听
     */
    private setupEventListeners(): void {
        // 游戏状态事件
        EventManager.instance.on(EventManagerEvents.GAME_START, this.onGameStart, this);
        EventManager.instance.on(EventManagerEvents.GAME_PAUSED, this.onGamePaused, this);
        EventManager.instance.on(EventManagerEvents.GAME_RESUMED, this.onGameResumed, this);
        EventManager.instance.on(EventManagerEvents.GAME_END, this.onGameEnd, this);
        
        // 微恐事件
        EventManager.instance.on('horror_event', this.onHorrorEvent, this);
        EventManager.instance.on('scare_triggered', this.onScareTriggered, this);
        EventManager.instance.on('customer_scared', this.onCustomerScared, this);
        
        // 时间控制事件
        EventManager.instance.on('time_scale_change', this.onTimeScaleChange, this);
        EventManager.instance.on('slow_motion_request', this.onSlowMotionRequest, this);
        EventManager.instance.on('fast_forward_request', this.onFastForwardRequest, this);
        
        // 性能事件
        EventManager.instance.on('performance_warning', this.onPerformanceWarning, this);
        
        console.log('事件监听设置完成');
    }
    
    /**
     * 移除事件监听
     */
    private removeEventListeners(): void {
        // 游戏状态事件
        EventManager.instance.off(EventManagerEvents.GAME_START, this.onGameStart, this);
        EventManager.instance.off(EventManagerEvents.GAME_PAUSED, this.onGamePaused, this);
        EventManager.instance.off(EventManagerEvents.GAME_RESUMED, this.onGameResumed, this);
        EventManager.instance.off(EventManagerEvents.GAME_END, this.onGameEnd, this);
        
        // 微恐事件
        EventManager.instance.off('horror_event', this.onHorrorEvent, this);
        EventManager.instance.off('scare_triggered', this.onScareTriggered, this);
        EventManager.instance.off('customer_scared', this.onCustomerScared, this);
        
        // 时间控制事件
        EventManager.instance.off('time_scale_change', this.onTimeScaleChange, this);
        EventManager.instance.off('slow_motion_request', this.onSlowMotionRequest, this);
        EventManager.instance.off('fast_forward_request', this.onFastForwardRequest, this);
        
        // 性能事件
        EventManager.instance.off('performance_warning', this.onPerformanceWarning, this);
    }
    
    /******************************
     * 游戏循环核心方法
     ******************************/
    
    update(deltaTime: number): void {
        // 只在运行状态下更新
        if (this._currentState !== GameLoopState.RUNNING && 
            this._currentState !== GameLoopState.SLOW_MOTION && 
            this._currentState !== GameLoopState.FAST_FORWARD) {
            return;
        }
        
        const startTime = performance.now();
        
        try {
            // 1. 更新真实时间
            this._realTime += deltaTime;
            
            // 2. 应用时间缩放
            const scaledDeltaTime = deltaTime * this._timeScale;
            
            // 3. 更新游戏内时间
            this._gameTime += scaledDeltaTime;
            
            // 4. 更新固定时间步长系统
            this.updateFixedTimeStep(scaledDeltaTime);
            
            // 5. 更新微恐系统
            this.updateHorrorSystem(scaledDeltaTime);
            
            // 6. 更新游戏内天数
            this.updateDayCycle(scaledDeltaTime);
            
            // 7. 处理输入
            this.processInput();
            
            // 8. 处理恐怖事件队列
            this.processHorrorEventsQueue();
            
            // 9. 更新性能统计
            this.updatePerformanceStats(startTime, deltaTime);
            
            // 10. 检查性能警告
            this.checkPerformance();
            
            // 11. 发送游戏时间更新事件
            EventManager.instance.emit('game_time_update', {
                gameTime: this._gameTime,
                realTime: this._realTime,
                dayProgress: this._dayProgress,
                currentDay: this._currentDay,
                timeScale: this._timeScale
            });
            
        } catch (error) {
            console.error('游戏循环更新出错:', error);
        }
    }
    
    /**
     * 更新固定时间步长系统
     */
    private updateFixedTimeStep(deltaTime: number): void {
        // 累积时间
        this._fixedTimeAccumulator += deltaTime;
        
        // 执行固定更新，防止螺旋死亡
        let iterations = 0;
        while (this._fixedTimeAccumulator >= this._config.fixedDeltaTime && 
               iterations < this._config.maxFrameSkip) {
            
            this.fixedUpdate(this._config.fixedDeltaTime);
            this._fixedTimeAccumulator -= this._config.fixedDeltaTime;
            iterations++;
        }
        
        // 如果累积时间过多，重置以避免累积错误
        if (this._fixedTimeAccumulator > this._config.fixedDeltaTime * this._config.maxFrameSkip) {
            this._fixedTimeAccumulator = this._config.fixedDeltaTime;
        }
    }
    
    /**
     * 固定更新（物理、碰撞等）
     */
    private fixedUpdate(fixedDeltaTime: number): void {
        const startTime = performance.now();
        
        // 在这里处理物理逻辑、精确碰撞检测等
        // 微恐效果：固定更新时可能随机触发恐怖事件
        if (this._horrorIntensity > 0 && Math.random() < 0.001) {
            this.triggerRandomHorrorEvent();
        }
        
        this._performance.fixedUpdateTime = performance.now() - startTime;
    }
    
    /**
     * 更新微恐系统
     */
    private updateHorrorSystem(deltaTime: number): void {
        // 更新恐怖强度衰减
        if (this._horrorIntensity > 0) {
            this._horrorIntensity = Math.max(0, this._horrorIntensity - deltaTime * 0.1);
        }
        
        // 更新惊吓冷却
        if (this._scareCooldown > 0) {
            this._scareCooldown = Math.max(0, this._scareCooldown - deltaTime);
        }
        
        // 夜晚增加恐怖强度
        const isNight = this._dayProgress > 0.5;  // 后半天为夜晚
        if (isNight) {
            const nightIntensity = (this._dayProgress - 0.5) * 2;  // 0-1的夜晚强度
            this._horrorIntensity = Math.min(1, this._horrorIntensity + nightIntensity * deltaTime * 0.05);
        }
        
        // 触发恐怖事件（基于强度）
        if (this._horrorIntensity > 0.3 && Math.random() < this._horrorIntensity * deltaTime * 0.5) {
            this.triggerRandomHorrorEvent();
        }
    }
    
    /**
     * 更新天数循环
     */
    private updateDayCycle(deltaTime: number): void {
        // 游戏内一天为120秒（2分钟）
        const dayDuration = 120; // 秒
        
        // 更新当天进度
        const totalGameSeconds = this._gameTime % dayDuration;
        this._dayProgress = totalGameSeconds / dayDuration;
        
        // 检查是否进入新的一天
        const previousDay = this._currentDay;
        this._currentDay = Math.floor(this._gameTime / dayDuration) + 1;
        
        if (this._currentDay > previousDay) {
            // 新的一天开始
            EventManager.instance.emit('new_day_started', {
                day: this._currentDay,
                totalDays: this._currentDay,
                gameTime: this._gameTime
            });
            
            // 新的一天增加恐怖强度基础值
            this._horrorIntensity = Math.min(1, this._horrorIntensity + 0.05);
        }
    }
    
    /**
     * 处理输入
     */
    private processInput(): void {
        // 这里可以处理全局输入逻辑
        // 例如：长按检测、手势识别等
        
        // 检查是否有长时间触摸（可能触发微恐效果）
        if (this._inputState.isTouching && Date.now() - this._inputState.lastTouchTime > 5000) {
            // 触摸超过5秒，可能触发恐怖事件
            if (Math.random() < 0.3) {
                this.triggerHorrorEvent('long_touch_scare', 0.7);
                this._inputState.lastTouchTime = Date.now(); // 重置计时
            }
        }
    }
    
    /**
     * 处理恐怖事件队列
     */
    private processHorrorEventsQueue(): void {
        if (this._horrorEventsQueue.length === 0) return;
        
        const currentTime = Date.now();
        const maxEventsPerFrame = 1; // 每帧最多处理1个恐怖事件
        
        for (let i = 0; i < Math.min(maxEventsPerFrame, this._horrorEventsQueue.length); i++) {
            const event = this._horrorEventsQueue.shift();
            if (event) {
                this.executeHorrorEvent(event);
            }
        }
    }
    
    /**
     * 更新性能统计
     */
    private updatePerformanceStats(startTime: number, deltaTime: number): void {
        // 计算帧时间
        const frameTime = performance.now() - startTime;
        this._performance.frameTime = frameTime;
        this._performance.updateTime = frameTime;
        
        // 更新FPS统计
        this._frameCount++;
        const currentTime = performance.now();
        const timeSinceLastCheck = (currentTime - this._lastFPSCheckTime) / 1000;
        
        if (timeSinceLastCheck >= 1.0) {
            this._performance.fps = Math.round(this._frameCount / timeSinceLastCheck);
            this._frameCount = 0;
            this._lastFPSCheckTime = currentTime;
            
            // 每秒钟发送一次性能统计
            EventManager.instance.emit('performance_stats', this._performance);
        }
        
        this._lastFrameTime = currentTime;
    }
    
    /**
     * 检查性能并调整
     */
    private checkPerformance(): void {
        if (!this._config.enableAdaptiveFPS) return;
        
        const { fps, frameTime } = this._performance;
        
        // FPS过低警告
        if (fps < 30 && fps > 0) {
            console.warn(`性能警告: FPS过低 (${fps})`);
            
            // 触发性能优化
            EventManager.instance.emit('performance_warning', {
                type: 'low_fps',
                fps: fps,
                frameTime: frameTime
            });
            
            // 自动调整时间缩放
            if (fps < 20) {
                this._timeScale = Math.max(0.5, this._timeScale * 0.9);
                console.log(`自动降低时间缩放至: ${this._timeScale}`);
            }
        }
        
        // FPS过高，可以增加时间缩放
        if (fps > 55 && this._timeScale < 2.0) {
            this._timeScale = Math.min(2.0, this._timeScale * 1.05);
            console.log(`自动增加时间缩放至: ${this._timeScale}`);
        }
    }
    
    /******************************
     * 微恐系统方法
     ******************************/
    
    /**
     * 触发随机恐怖事件
     */
    private triggerRandomHorrorEvent(): void {
        if (this._scareCooldown > 0) return;
        
        const events = [
            { type: 'lights_flicker', intensity: 0.3 },
            { type: 'strange_noise', intensity: 0.5 },
            { type: 'shadow_movement', intensity: 0.7 },
            { type: 'unexpected_visitor', intensity: 0.9 },
            { type: 'coffee_machine_malfunction', intensity: 0.6 }
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        this.triggerHorrorEvent(randomEvent.type, randomEvent.intensity * this._horrorIntensity);
        
        // 设置冷却时间
        this._scareCooldown = 10 + Math.random() * 20; // 10-30秒冷却
    }
    
    /**
     * 触发恐怖事件
     */
    private triggerHorrorEvent(type: string, intensity: number): void {
        // 将事件加入队列
        this._horrorEventsQueue.push({ type, intensity });
        
        console.log(`恐怖事件触发: ${type}, 强度: ${intensity}`);
    }
    
    /**
     * 执行恐怖事件
     */
    private executeHorrorEvent(event: {type: string, intensity: number}): void {
        const { type, intensity } = event;
        
        // 增加恐怖强度
        this._horrorIntensity = Math.min(1, this._horrorIntensity + intensity * 0.1);
        
        // 发送恐怖事件
        EventManager.instance.emit('horror_event_executed', {
            type,
            intensity,
            horrorIntensity: this._horrorIntensity,
            timestamp: Date.now()
        });
        
        // 平台特定效果
        if (this._platformAdapter && intensity > 0.5) {
            // 高强度恐怖事件触发振动
            this._platformAdapter.vibrate('short');
        }
    }
    
    /******************************
     * 事件处理方法
     ******************************/
    
    private onGameStart(data: any): void {
        console.log('游戏循环: 游戏开始');
        this._currentState = GameLoopState.RUNNING;
        
        // 重置游戏时间
        this._gameTime = 0;
        this._realTime = 0;
        this._currentDay = 1;
        this._dayProgress = 0;
        
        // 重置微恐系统
        this._horrorIntensity = 0.1; // 初始恐怖强度
        this._scareCooldown = 0;
        this._horrorEventsQueue = [];
    }
    
    private onGamePaused(): void {
        console.log('游戏循环: 游戏暂停');
        this._previousState = this._currentState;
        this._currentState = GameLoopState.PAUSED;
        
        // 暂停时时间缩放为0
        this._timeScale = 0;
    }
    
    private onGameResumed(): void {
        console.log('游戏循环: 游戏恢复');
        this._currentState = this._previousState;
        this._timeScale = 1.0;
    }
    
    private onGameEnd(data: any): void {
        console.log('游戏循环: 游戏结束');
        this._currentState = GameLoopState.GAME_OVER;
        
        // 停止所有恐怖事件
        this._horrorEventsQueue = [];
        
        // 发送游戏循环结束事件
        EventManager.instance.emit('game_loop_end', {
            totalGameTime: this._gameTime,
            totalRealTime: this._realTime,
            totalDays: this._currentDay
        });
    }
    
    private onHorrorEvent(data: any): void {
        // 外部触发的恐怖事件
        if (data && data.event && data.intensity) {
            this.triggerHorrorEvent(data.event, data.intensity);
        }
    }
    
    private onScareTriggered(data: any): void {
        // 惊吓被触发，增加恐怖强度
        if (data && data.intensity) {
            this._horrorIntensity = Math.min(1, this._horrorIntensity + data.intensity);
        }
    }
    
    private onCustomerScared(data: any): void {
        // 顾客被吓到，轻微增加恐怖强度
        this._horrorIntensity = Math.min(1, this._horrorIntensity + 0.05);
    }
    
    private onTimeScaleChange(data: any): void {
        if (data && typeof data.scale === 'number') {
            this._timeScale = Math.max(0, Math.min(5, data.scale));
            console.log(`时间缩放已调整为: ${this._timeScale}`);
        }
    }
    
    private onSlowMotionRequest(data: any): void {
        console.log('游戏循环: 慢动作模式');
        this._currentState = GameLoopState.SLOW_MOTION;
        this._timeScale = data?.scale || 0.5;
        
        // 自动恢复
        setTimeout(() => {
            if (this._currentState === GameLoopState.SLOW_MOTION) {
                this._currentState = GameLoopState.RUNNING;
                this._timeScale = 1.0;
                console.log('慢动作模式结束');
            }
        }, data?.duration || 3000);
    }
    
    private onFastForwardRequest(data: any): void {
        console.log('游戏循环: 快进模式');
        this._currentState = GameLoopState.FAST_FORWARD;
        this._timeScale = data?.scale || 2.0;
        
        // 自动恢复
        setTimeout(() => {
            if (this._currentState === GameLoopState.FAST_FORWARD) {
                this._currentState = GameLoopState.RUNNING;
                this._timeScale = 1.0;
                console.log('快进模式结束');
            }
        }, data?.duration || 5000);
    }
    
    private onPerformanceWarning(data: any): void {
        // 处理性能警告
        if (data.type === 'low_fps') {
            // 降低特效质量
            EventManager.instance.emit('reduce_effects_quality');
        }
    }
    
    /******************************
     * 公共API方法
     ******************************/
    
    /**
     * 获取当前游戏循环状态
     */
    public getState(): GameLoopState {
        return this._currentState;
    }
    
    /**
     * 获取游戏时间信息
     */
    public getGameTime(): {
        gameTime: number;
        realTime: number;
        dayProgress: number;
        currentDay: number;
        timeScale: number;
    } {
        return {
            gameTime: this._gameTime,
            realTime: this._realTime,
            dayProgress: this._dayProgress,
            currentDay: this._currentDay,
            timeScale: this._timeScale
        };
    }
    
    /**
     * 获取恐怖强度
     */
    public getHorrorIntensity(): number {
        return this._horrorIntensity;
    }
    
    /**
     * 设置恐怖强度
     */
    public setHorrorIntensity(intensity: number): void {
        this._horrorIntensity = Math.max(0, Math.min(1, intensity));
    }
    
    /**
     * 获取性能统计
     */
    public getPerformanceStats(): any {
        return { ...this._performance };
    }
    
    /**
     * 设置时间缩放
     */
    public setTimeScale(scale: number): void {
        this._timeScale = Math.max(0, Math.min(5, scale));
    }
    
    /**
     * 暂停游戏循环
     */
    public pause(): void {
        if (this._currentState !== GameLoopState.PAUSED && 
            this._currentState !== GameLoopState.GAME_OVER) {
            this._previousState = this._currentState;
            this._currentState = GameLoopState.PAUSED;
            this._timeScale = 0;
            
            EventManager.instance.emit(EventManagerEvents.GAME_PAUSED);
        }
    }
    
    /**
     * 恢复游戏循环
     */
    public resume(): void {
        if (this._currentState === GameLoopState.PAUSED) {
            this._currentState = this._previousState;
            this._timeScale = 1.0;
            
            EventManager.instance.emit(EventManagerEvents.GAME_RESUMED);
        }
    }
    
    /**
     * 检查游戏循环是否正在运行
     */
    public isRunning(): boolean {
        return this._currentState === GameLoopState.RUNNING || 
               this._currentState === GameLoopState.SLOW_MOTION || 
               this._currentState === GameLoopState.FAST_FORWARD;
    }
    
    /**
     * 检查游戏循环是否已初始化
     */
    public isInitialized(): boolean {
        return this._currentState !== GameLoopState.IDLE && 
               this._currentState !== GameLoopState.INITIALIZING;
    }
}