/**
 * 游戏状态机 v2.0
 * 使用 State Pattern 实现清晰的状态管理
 */

/**
 * 游戏状态枚举
 */
export enum GameState {
    // 初始状态
    NONE = 'none',
    INITIALIZING = 'initializing',
    LOADING = 'loading',
    
    // 就绪状态
    READY = 'ready',
    
    // 游戏状态
    PLAYING = 'playing',
    PAUSED = 'paused',
    
    // 结束状态
    GAME_OVER = 'game_over',
    ERROR = 'error'
}

/**
 * 状态转换规则
 */
const STATE_TRANSITIONS: { [key: string]: GameState[] } = {
    [GameState.NONE]: [GameState.INITIALIZING],
    [GameState.INITIALIZING]: [GameState.LOADING, GameState.ERROR],
    [GameState.LOADING]: [GameState.READY, GameState.ERROR],
    [GameState.READY]: [GameState.PLAYING, GameState.ERROR],
    [GameState.PLAYING]: [GameState.PAUSED, GameState.GAME_OVER, GameState.ERROR],
    [GameState.PAUSED]: [GameState.PLAYING, GameState.GAME_OVER],
    [GameState.GAME_OVER]: [GameState.READY],
    [GameState.ERROR]: [GameState.INITIALIZING, GameState.NONE]
};

/**
 * 状态机配置
 */
interface StateMachineConfig {
    onStateEnter?: (state: GameState) => void;
    onStateExit?: (state: GameState) => void;
    onStateChange?: (from: GameState, to: GameState) => void;
}

/**
 * 游戏状态机
 */
export class GameStateMachine {
    private _currentState: GameState = GameState.NONE;
    private _previousState: GameState = GameState.NONE;
    private _stateHistory: GameState[] = [];
    private _maxHistorySize: number = 10;
    private _config: StateMachineConfig;

    constructor(config: StateMachineConfig = {}) {
        this._config = config;
    }

    /**
     * 获取当前状态
     */
    get currentState(): GameState {
        return this._currentState;
    }

    /**
     * 获取上一个状态
     */
    get previousState(): GameState {
        return this._previousState;
    }

    /**
     * 获取状态历史
     */
    get stateHistory(): GameState[] {
        return [...this._stateHistory];
    }

    /**
     * 检查是否可以转换到目标状态
     */
    canTransition(toState: GameState): boolean {
        if (toState === this._currentState) {
            return true; // 允许同状态转换（刷新）
        }

        const allowedTransitions = STATE_TRANSITIONS[this._currentState];
        return allowedTransitions?.includes(toState) ?? false;
    }

    /**
     * 执行状态转换
     */
    transition(toState: GameState, data?: any): boolean {
        // 检查转换是否允许
        if (!this.canTransition(toState)) {
            console.warn(`[StateMachine] 非法状态转换: ${this._currentState} -> ${toState}`);
            return false;
        }

        const fromState = this._currentState;

        // 记录历史
        this._stateHistory.push(fromState);
        if (this._stateHistory.length > this._maxHistorySize) {
            this._stateHistory.shift();
        }

        // 执行退出回调
        this._config.onStateExit?.(fromState);

        // 执行状态转换
        this._previousState = fromState;
        this._currentState = toState;

        // 执行进入回调
        this._config.onStateEnter?.(toState);

        // 执行变化回调
        this._config.onStateChange?.(fromState, toState);

        console.log(`[StateMachine] 状态转换: ${fromState} -> ${toState}`);

        return true;
    }

    /**
     * 返回上一个状态
     */
    revert(): boolean {
        if (this._previousState !== GameState.NONE) {
            return this.transition(this._previousState);
        }
        return false;
    }

    /**
     * 检查当前状态
     */
    isInState(state: GameState): boolean {
        return this._currentState === state;
    }

    /**
     * 检查是否处于游戏状态
     */
    get isPlaying(): boolean {
        return this._currentState === GameState.PLAYING;
    }

    /**
     * 检查是否处于暂停状态
     */
    get isPaused(): boolean {
        return this._currentState === GameState.PAUSED;
    }

    /**
     * 清理
     */
    cleanup(): void {
        this._stateHistory = [];
        this._currentState = GameState.NONE;
        this._previousState = GameState.NONE;
    }
}

/**
 * 状态管理器 - 全局访问点
 */
export class StateManager {
    private static _instance: GameStateMachine | null = null;

    static get instance(): GameStateMachine {
        if (!StateManager._instance) {
            StateManager._instance = new GameStateMachine();
        }
        return StateManager._instance;
    }

    static set instance(machine: GameStateMachine) {
        StateManager._instance = machine;
    }

    static cleanup(): void {
        StateManager._instance?.cleanup();
        StateManager._instance = null;
    }
}