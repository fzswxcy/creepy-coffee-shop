import { _decorator, Component, Node } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 事件管理器 - 全局事件系统
 * 实现发布-订阅模式，用于组件间通信
 */
@ccclass('EventManager')
export class EventManager extends Component {
    
    private static _instance: EventManager = null;
    
    /**
     * 获取EventManager单例
     */
    public static get instance(): EventManager {
        if (!this._instance) {
            const node = new Node('EventManager');
            this._instance = node.addComponent(EventManager);
            // 保持常驻
            node.setParent(null);
        }
        return this._instance;
    }
    
    private _eventListeners: Map<string, Array<Function>> = new Map();
    private _onceListeners: Map<string, Array<Function>> = new Map();
    
    /**
     * 初始化事件管理器
     */
    public init() {
        console.log('事件管理器初始化');
    }
    
    /**
     * 订阅事件
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    public on(eventName: string, callback: Function): void {
        if (!this._eventListeners.has(eventName)) {
            this._eventListeners.set(eventName, []);
        }
        this._eventListeners.get(eventName)!.push(callback);
    }
    
    /**
     * 订阅一次事件（触发后自动取消）
     * @param eventName 事件名称
     * @param callback 回调函数
     */
    public once(eventName: string, callback: Function): void {
        if (!this._onceListeners.has(eventName)) {
            this._onceListeners.set(eventName, []);
        }
        this._onceListeners.get(eventName)!.push(callback);
    }
    
    /**
     * 取消订阅事件
     * @param eventName 事件名称
     * @param callback 回调函数（可选，不传则取消所有）
     */
    public off(eventName: string, callback?: Function): void {
        // 取消常规监听
        if (this._eventListeners.has(eventName)) {
            if (callback) {
                const listeners = this._eventListeners.get(eventName)!;
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            } else {
                this._eventListeners.delete(eventName);
            }
        }
        
        // 取消一次性监听
        if (this._onceListeners.has(eventName)) {
            if (callback) {
                const listeners = this._onceListeners.get(eventName)!;
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            } else {
                this._onceListeners.delete(eventName);
            }
        }
    }
    
    /**
     * 触发事件
     * @param eventName 事件名称
     * @param data 事件数据
     */
    public emit(eventName: string, data?: any): void {
        // 触发常规监听
        if (this._eventListeners.has(eventName)) {
            const listeners = this._eventListeners.get(eventName)!;
            for (const callback of listeners) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件 ${eventName} 回调执行错误:`, error);
                }
            }
        }
        
        // 触发一次性监听
        if (this._onceListeners.has(eventName)) {
            const listeners = this._onceListeners.get(eventName)!;
            while (listeners.length > 0) {
                const callback = listeners.shift();
                try {
                    callback!(data);
                } catch (error) {
                    console.error(`事件 ${eventName} 一次性回调执行错误:`, error);
                }
            }
            this._onceListeners.delete(eventName);
        }
    }
    
    /**
     * 检查是否有监听器
     * @param eventName 事件名称
     */
    public hasListener(eventName: string): boolean {
        return (this._eventListeners.has(eventName) && this._eventListeners.get(eventName)!.length > 0) ||
               (this._onceListeners.has(eventName) && this._onceListeners.get(eventName)!.length > 0);
    }
    
    /**
     * 获取监听器数量
     * @param eventName 事件名称
     */
    public getListenerCount(eventName: string): number {
        let count = 0;
        if (this._eventListeners.has(eventName)) {
            count += this._eventListeners.get(eventName)!.length;
        }
        if (this._onceListeners.has(eventName)) {
            count += this._onceListeners.get(eventName)!.length;
        }
        return count;
    }
    
    /**
     * 清除所有事件监听
     */
    public clear(): void {
        this._eventListeners.clear();
        this._onceListeners.clear();
        console.log('事件管理器已清空所有监听器');
    }
    
    /**
     * 获取所有事件名称
     */
    public getAllEventNames(): string[] {
        const eventNames = new Set<string>();
        
        for (const eventName of this._eventListeners.keys()) {
            eventNames.add(eventName);
        }
        
        for (const eventName of this._onceListeners.keys()) {
            eventNames.add(eventName);
        }
        
        return Array.from(eventNames);
    }
    
    /**
     * 预定义的事件类型
     */
    public static Events = {
        // 游戏事件
        GAME_START: 'game_start',
        GAME_PAUSED: 'game_paused',
        GAME_RESUMED: 'game_resumed',
        GAME_END: 'game_end',
        GAME_RESTART: 'game_restart',
        GAME_STATE_CHANGE: 'game_state_change',
        
        // 资源事件
        RESOURCE_LOADED: 'resource_loaded',
        RESOURCE_LOAD_FAILED: 'resource_load_failed',
        LOADING_PROGRESS: 'loading_progress',
        
        // 咖啡事件
        COFFEE_PRODUCED: 'coffee_produced',
        COFFEE_SOLD: 'coffee_sold',
        COFFEE_BURNED: 'coffee_burned',
        COFFEE_RECIPE_UNLOCKED: 'coffee_recipe_unlocked',
        
        // 顾客事件
        CUSTOMER_ARRIVED: 'customer_arrived',
        CUSTOMER_ORDERED: 'customer_ordered',
        CUSTOMER_SERVED: 'customer_served',
        CUSTOMER_LEFT: 'customer_left',
        CUSTOMER_ANGRY: 'customer_angry',
        
        // UI事件
        UI_BUTTON_CLICK: 'ui_button_click',
        UI_PANEL_OPEN: 'ui_panel_open',
        UI_PANEL_CLOSE: 'ui_panel_close',
        UI_TOGGLE_CHANGED: 'ui_toggle_changed',
        
        // 音频事件
        SOUND_PLAY: 'sound_play',
        SOUND_STOP: 'sound_stop',
        MUSIC_CHANGE: 'music_change',
        
        // 数据事件
        DATA_CHANGED: 'data_changed',
        COINS_CHANGED: 'coins_changed',
        SCORE_CHANGED: 'score_changed',
        LEVEL_UP: 'level_up',
        
        // 广告事件
        AD_LOADED: 'ad_loaded',
        AD_SHOW: 'ad_show',
        AD_CLOSE: 'ad_close',
        AD_ERROR: 'ad_error',
        AD_REWARD: 'ad_reward',
        
        // 系统事件
        NETWORK_CHANGE: 'network_change',
        MEMORY_WARNING: 'memory_warning',
        APP_PAUSE: 'app_pause',
        APP_RESUME: 'app_resume'
    };
    
    onDestroy() {
        this.clear();
        if (EventManager._instance === this) {
            EventManager._instance = null;
        }
    }
}