// 微恐咖啡厅 - Cocos Creator游戏管理器
// TypeScript实现，兼容微信小游戏
// 创建时间: 2026年3月4日

import { _decorator, Component, Node, director, game, sys } from 'cc';
import { WeChatAPI } from './WeChatAPI';

const { ccclass, property } = _decorator;

// 游戏状态接口
interface GameState {
    currentLoop: number;
    sanity: number;
    gold: number;
    currentHour: number;
    currentMinute: number;
    unlockedRecipes: number;
    currentRecipe: string;
    horrorEventsTriggered: number;
    lastEventTime: number;
    achievements: {
        firstBrew: boolean;
        scaryEventSurvived: boolean;
        tenLoops: boolean;
        perfectCoffee: boolean;
    };
}

// 恐怖事件类型
type HorrorEventType = 
    | 'ghostAppear'
    | 'lightFlicker'
    | 'whisperSound'
    | 'cupMove'
    | 'temperatureDrop';

// 咖啡配方接口
interface CoffeeRecipe {
    id: string;
    name: string;
    ingredients: string[];
    brewTime: number;
    sanityCost: number;
    goldReward: number;
    unlocked: boolean;
}

@ccclass('GameManager')
export class GameManager extends Component {
    
    // 单例实例
    private static _instance: GameManager = null;
    public static get instance(): GameManager {
        return GameManager._instance;
    }
    
    // 游戏状态
    private _gameState: GameState = {
        currentLoop: 1,
        sanity: 100,
        gold: 1250,
        currentHour: 2,
        currentMinute: 47,
        unlockedRecipes: 3,
        currentRecipe: 'espresso',
        horrorEventsTriggered: 0,
        lastEventTime: 0,
        achievements: {
            firstBrew: false,
            scaryEventSurvived: false,
            tenLoops: false,
            perfectCoffee: false
        }
    };
    
    // 咖啡配方列表
    private _recipes: CoffeeRecipe[] = [
        {
            id: 'espresso',
            name: '浓缩咖啡',
            ingredients: ['咖啡豆', '水'],
            brewTime: 3,
            sanityCost: 5,
            goldReward: 50,
            unlocked: true
        },
        {
            id: 'latte',
            name: '拿铁',
            ingredients: ['咖啡豆', '牛奶', '糖'],
            brewTime: 5,
            sanityCost: 8,
            goldReward: 80,
            unlocked: false
        },
        {
            id: 'cappuccino',
            name: '卡布奇诺',
            ingredients: ['咖啡豆', '牛奶', '奶泡'],
            brewTime: 6,
            sanityCost: 10,
            goldReward: 120,
            unlocked: false
        },
        {
            id: 'mocha',
            name: '摩卡',
            ingredients: ['咖啡豆', '巧克力', '牛奶'],
            brewTime: 7,
            sanityCost: 12,
            goldReward: 150,
            unlocked: false
        }
    ];
    
    // 恐怖事件配置
    private _horrorEvents: { type: HorrorEventType; name: string; sanityLoss: number }[] = [
        { type: 'ghostAppear', name: '幽灵闪现', sanityLoss: 10 },
        { type: 'lightFlicker', name: '灯光闪烁', sanityLoss: 8 },
        { type: 'whisperSound', name: '低语声', sanityLoss: 12 },
        { type: 'cupMove', name: '咖啡杯移动', sanityLoss: 7 },
        { type: 'temperatureDrop', name: '温度骤降', sanityLoss: 9 }
    ];
    
    // 计时器
    private _timeUpdateInterval: number = 0;
    private _sanityDecreaseInterval: number = 0;
    private _horrorCheckInterval: number = 0;
    
    // 微信API
    private _wechatAPI: WeChatAPI = null;
    
    // UI节点引用
    @property(Node)
    private sanityDisplay: Node = null;
    
    @property(Node)
    private goldDisplay: Node = null;
    
    @property(Node)
    private timeDisplay: Node = null;
    
    @property(Node)
    private loopDisplay: Node = null;
    
    @property(Node)
    private messageLog: Node = null;
    
    onLoad() {
        // 设置单例
        if (GameManager._instance === null) {
            GameManager._instance = this;
        } else {
            this.node.destroy();
            return;
        }
        
        // 初始化游戏
        this.initializeGame();
    }
    
    start() {
        // 启动游戏循环
        this.startGameLoop();
        
        // 初始化微信API
        this.initializeWeChatAPI();
        
        // 加载保存的游戏进度
        this.loadGameProgress();
    }
    
    // 初始化游戏
    private initializeGame() {
        console.log('微恐咖啡厅游戏初始化');
        
        // 设置屏幕适配
        this.setupScreenAdaptation();
        
        // 初始化触摸事件
        this.setupTouchEvents();
        
        // 初始化UI
        this.initializeUI();
        
        console.log('游戏初始化完成');
    }
    
    // 设置屏幕适配
    private setupScreenAdaptation() {
        // Cocos Creator会自动处理屏幕适配
        // 确保使用竖屏模式
        game.frameRate = 60;
        game.resume();
    }
    
    // 初始化触摸事件
    private setupTouchEvents() {
        // Cocos Creator有内置的触摸系统
        // 这里可以在具体节点上添加触摸监听
        console.log('触摸事件系统已准备');
    }
    
    // 初始化UI
    private initializeUI() {
        console.log('初始化游戏UI');
        
        // 更新UI显示
        this.updateUI();
    }
    
    // 初始化微信API
    private initializeWeChatAPI() {
        this._wechatAPI = new WeChatAPI();
        
        // 检查微信环境
        if (this._wechatAPI.isWeChatEnvironment()) {
            console.log('运行在微信小游戏环境中');
            
            // 初始化微信登录
            this._wechatAPI.initializeLogin();
            
            // 初始化广告系统
            this._wechatAPI.initializeAds();
            
            // 初始化分享功能
            this._wechatAPI.initializeShare();
        } else {
            console.log('运行在调试环境中');
        }
    }
    
    // 启动游戏循环
    private startGameLoop() {
        console.log('启动游戏主循环');
        
        // 开始计时器
        this.startTimers();
    }
    
    // 开始计时器
    private startTimers() {
        // 时间更新（每5秒）
        this._timeUpdateInterval = setInterval(() => {
            this.updateTime();
        }, 5000);
        
        // 理智值减少（每10秒）
        this._sanityDecreaseInterval = setInterval(() => {
            this.decreaseSanity();
        }, 10000);
        
        // 恐怖事件检查（每30秒）
        this._horrorCheckInterval = setInterval(() => {
            this.checkHorrorEvent();
        }, 30000);
    }
    
    // ==================== 游戏核心逻辑 ====================
    
    // 更新游戏时间
    private updateTime() {
        this._gameState.currentMinute++;
        
        if (this._gameState.currentMinute >= 60) {
            this._gameState.currentMinute = 0;
            this._gameState.currentHour = (this._gameState.currentHour + 1) % 24;
            
            // 如果到了早晨6点，触发时间循环
            if (this._gameState.currentHour === 6 && this._gameState.currentMinute === 0) {
                this.triggerTimeLoop();
            }
        }
        
        this.updateTimeDisplay();
    }
    
    // 时间循环触发
    private triggerTimeLoop() {
        console.log('时间循环触发');
        
        this._gameState.currentLoop++;
        this._gameState.currentHour = 2;
        this._gameState.currentMinute = 47;
        
        // 理智值部分恢复
        this._gameState.sanity = Math.min(100, this._gameState.sanity + 30);
        
        // 检查成就
        if (this._gameState.currentLoop >= 10 && !this._gameState.achievements.tenLoops) {
            this._gameState.achievements.tenLoops = true;
            this.addMessage('成就解锁：完成10次时间循环！');
        }
        
        this.updateUI();
        this.addMessage('时间重置到午夜...新的一天开始了');
    }
    
    // 减少理智值
    private decreaseSanity() {
        if (this._gameState.sanity > 0) {
            this._gameState.sanity -= 1;
            this.updateSanityDisplay();
            
            // 理智值过低警告
            if (this._gameState.sanity < 30) {
                console.log('理智值过低警告');
            }
        }
    }
    
    // 检查恐怖事件
    private checkHorrorEvent() {
        // 基础触发概率：5%
        let baseProbability = 0.05;
        
        // 理智值越低，触发概率越高
        let sanityFactor = (100 - this._gameState.sanity) / 100;
        let finalProbability = baseProbability + (sanityFactor * 0.15);
        
        if (Math.random() < finalProbability) {
            this.triggerRandomHorrorEvent();
        }
    }
    
    // 触发随机恐怖事件
    private triggerRandomHorrorEvent() {
        if (this._gameState.sanity <= 0) return;
        
        this._gameState.horrorEventsTriggered++;
        this._gameState.lastEventTime = Date.now();
        
        const event = this._horrorEvents[Math.floor(Math.random() * this._horrorEvents.length)];
        
        console.log(`触发恐怖事件: ${event.name}`);
        this.addMessage(`⚠️ ${event.name}`);
        
        // 减少理智值
        this._gameState.sanity = Math.max(0, this._gameState.sanity - event.sanityLoss);
        this.updateSanityDisplay();
        
        // 播放特效
        this.playHorrorEffect(event.type);
        
        // 检查成就
        if (!this._gameState.achievements.scaryEventSurvived) {
            this._gameState.achievements.scaryEventSurvived = true;
            this.addMessage('成就解锁：第一次恐怖事件生存！');
        }
    }
    
    // 播放恐怖特效
    private playHorrorEffect(eventType: HorrorEventType) {
        // 这里可以通过事件系统触发对应的特效播放
        console.log(`播放恐怖特效: ${eventType}`);
        
        // 发送事件给特效管理器
        director.emit('horror-event', eventType);
    }
    
    // ==================== 游戏操作 ====================
    
    // 制作咖啡
    public brewCoffee() {
        if (this._gameState.sanity < 20) {
            this.addMessage('理智值过低，无法集中精神制作咖啡');
            return;
        }
        
        const recipe = this.getCurrentRecipe();
        if (!recipe) {
            this.addMessage('没有找到配方');
            return;
        }
        
        console.log(`开始制作咖啡: ${recipe.name}`);
        this.addMessage(`正在冲泡${recipe.name}...`);
        
        // 消耗理智值，获得金币
        this._gameState.sanity = Math.max(0, this._gameState.sanity - recipe.sanityCost);
        this._gameState.gold += recipe.goldReward;
        
        // 更新UI
        this.updateSanityDisplay();
        this.updateGoldDisplay();
        
        // 检查成就
        if (!this._gameState.achievements.firstBrew) {
            this._gameState.achievements.firstBrew = true;
            this.addMessage('成就解锁：第一杯咖啡！');
        }
        
        // 随机触发恐怖事件
        if (Math.random() < 0.3) {
            setTimeout(() => {
                this.triggerRandomHorrorEvent();
            }, 1000);
        }
        
        // 发送咖啡制作事件
        director.emit('coffee-brewing', recipe.id);
    }
    
    // 清洁吧台
    public cleanCounter() {
        console.log('清洁吧台');
        this.addMessage('清洁中，理智值恢复...');
        
        // 恢复理智值
        this._gameState.sanity = Math.min(100, this._gameState.sanity + 15);
        
        // 更新UI
        this.updateSanityDisplay();
        
        // 发送清洁事件
        director.emit('counter-cleaning');
    }
    
    // 切换灯光
    public toggleLights() {
        console.log('切换灯光');
        
        // 发送灯光切换事件
        director.emit('lights-toggle');
        
        // 这里可以添加关灯时增加恐怖事件概率的逻辑
    }
    
    // 解锁新配方
    public unlockRecipe(recipeId: string) {
        const recipe = this._recipes.find(r => r.id === recipeId);
        if (recipe && !recipe.unlocked) {
            recipe.unlocked = true;
            this._gameState.unlockedRecipes++;
            
            this.addMessage(`解锁了新配方: ${recipe.name}`);
            
            // 发送配方解锁事件
            director.emit('recipe-unlocked', recipeId);
            
            return true;
        }
        return false;
    }
    
    // 选择配方
    public selectRecipe(recipeId: string) {
        const recipe = this._recipes.find(r => r.id === recipeId && r.unlocked);
        if (recipe) {
            this._gameState.currentRecipe = recipeId;
            this.addMessage(`选择了配方: ${recipe.name}`);
            return true;
        }
        return false;
    }
    
    // ==================== UI更新 ====================
    
    // 更新UI
    private updateUI() {
        this.updateSanityDisplay();
        this.updateGoldDisplay();
        this.updateTimeDisplay();
        this.updateLoopDisplay();
    }
    
    // 更新理智值显示
    private updateSanityDisplay() {
        if (this.sanityDisplay) {
            // 这里需要根据Cocos Creator的UI系统来更新显示
            // 例如: this.sanityDisplay.getComponent(Label).string = this._gameState.sanity.toString();
        }
    }
    
    // 更新金币显示
    private updateGoldDisplay() {
        if (this.goldDisplay) {
            // 更新金币显示
        }
    }
    
    // 更新时间显示
    private updateTimeDisplay() {
        if (this.timeDisplay) {
            // 更新时间显示
        }
    }
    
    // 更新循环次数显示
    private updateLoopDisplay() {
        if (this.loopDisplay) {
            // 更新循环次数显示
        }
    }
    
    // 添加消息到日志
    private addMessage(message: string) {
        console.log(`游戏消息: ${message}`);
        
        if (this.messageLog) {
            // 这里需要根据Cocos Creator的UI系统来添加消息
            // 例如滚动列表添加新消息
        }
        
        // 同时发送事件，让UI组件更新
        director.emit('game-message', {
            text: message,
            time: `${this._gameState.currentHour.toString().padStart(2, '0')}:${this._gameState.currentMinute.toString().padStart(2, '0')}`
        });
    }
    
    // ==================== 数据管理 ====================
    
    // 获取当前配方
    private getCurrentRecipe(): CoffeeRecipe | undefined {
        return this._recipes.find(r => r.id === this._gameState.currentRecipe);
    }
    
    // 获取所有配方
    public getAllRecipes(): CoffeeRecipe[] {
        return [...this._recipes];
    }
    
    // 获取游戏状态
    public getGameState(): GameState {
        return { ...this._gameState };
    }
    
    // 获取成就状态
    public getAchievements() {
        return { ...this._gameState.achievements };
    }
    
    // ==================== 保存/加载 ====================
    
    // 保存游戏进度
    public saveGameProgress() {
        const gameData = JSON.stringify(this._gameState);
        
        if (this._wechatAPI?.isWeChatEnvironment()) {
            this._wechatAPI.saveData('coffeeShopGameData', gameData);
        } else {
            // 本地存储
            try {
                localStorage.setItem('coffeeShopGameData', gameData);
                console.log('游戏进度保存成功');
            } catch (e) {
                console.error('保存失败:', e);
            }
        }
        
        this.addMessage('游戏进度已保存');
    }
    
    // 加载游戏进度
    public loadGameProgress() {
        let savedData = null;
        
        if (this._wechatAPI?.isWeChatEnvironment()) {
            savedData = this._wechatAPI.loadData('coffeeShopGameData');
        } else {
            savedData = localStorage.getItem('coffeeShopGameData');
        }
        
        if (savedData) {
            try {
                const loadedData = JSON.parse(savedData);
                Object.assign(this._gameState, loadedData);
                console.log('游戏进度加载成功');
                this.addMessage('游戏进度已加载');
                
                // 更新UI
                this.updateUI();
            } catch (e) {
                console.error('解析游戏数据失败:', e);
                this.addMessage('加载失败，数据损坏');
            }
        } else {
            console.log('没有找到保存的游戏进度');
        }
    }
    
    // ==================== 微信相关 ====================
    
    // 观看激励广告
    public watchRewardedAd() {
        if (this._wechatAPI?.isWeChatEnvironment()) {
            this._wechatAPI.showRewardedAd(() => {
                // 广告观看完成回调
                this.addMessage('观看完成！获得200金币');
                this._gameState.gold += 200;
                this.updateGoldDisplay();
            });
        } else {
            // 调试环境模拟
            this.addMessage('观看广告获得200金币');
            this._gameState.gold += 200;
            this.updateGoldDisplay();
        }
    }
    
    // 分享游戏
    public shareGame() {
        if (this._wechatAPI?.isWeChatEnvironment()) {
            this._wechatAPI.shareGame('微恐咖啡厅 - 午夜咖啡店的恐怖秘密');
        }
    }
    
    // ==================== 清理 ====================
    
    onDestroy() {
        // 清理计时器
        if (this._timeUpdateInterval) {
            clearInterval(this._timeUpdateInterval);
        }
        if (this._sanityDecreaseInterval) {
            clearInterval(this._sanityDecreaseInterval);
        }
        if (this._horrorCheckInterval) {
            clearInterval(this._horrorCheckInterval);
        }
        
        // 保存游戏进度
        this.saveGameProgress();
        
        console.log('GameManager销毁');
    }
    
    // ==================== 调试工具 ====================
    
    // 调试：重置游戏
    public debugResetGame() {
        this._gameState = {
            currentLoop: 1,
            sanity: 100,
            gold: 1250,
            currentHour: 2,
            currentMinute: 47,
            unlockedRecipes: 3,
            currentRecipe: 'espresso',
            horrorEventsTriggered: 0,
            lastEventTime: 0,
            achievements: {
                firstBrew: false,
                scaryEventSurvived: false,
                tenLoops: false,
                perfectCoffee: false
            }
        };
        
        this.updateUI();
        this.addMessage('游戏已重置为初始状态');
    }
    
    // 调试：增加金币
    public debugAddGold(amount: number = 1000) {
        this._gameState.gold += amount;
        this.updateGoldDisplay();
        this.addMessage(`调试：获得${amount}金币`);
    }
    
    // 调试：触发恐怖事件
    public debugTriggerHorror() {
        this.triggerRandomHorrorEvent();
    }
}

console.log('GameManager类定义完成');