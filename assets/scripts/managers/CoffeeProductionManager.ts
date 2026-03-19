/**
 * 咖啡生产管理器 - 管理咖啡制作和配方系统
 */

import { EventTarget } from 'cc';
import { economyManager } from './EconomyManager';
import { adManager, AdRewardType } from './AdManager';

export enum CoffeeType {
    /** 美式咖啡 */
    AMERICANO = 'americano',
    /** 拿铁 */
    LATTE = 'latte',
    /** 卡布奇诺 */
    CAPPUCCINO = 'cappuccino',
    /** 摩卡 */
    MOCHA = 'mocha',
    /** 浓缩咖啡 */
    ESPRESSO = 'espresso',
    /** 特殊恐怖咖啡 */
    HORROR_COFFEE = 'horror_coffee'
}

export interface CoffeeRecipe {
    id: string;
    type: CoffeeType;
    name: string;
    description: string;
    price: number; // 售卖价格
    cost: number; // 制作成本
    productionTime: number; // 生产时间（秒）
    ingredients: {
        coffeeBeans: number;
        milk?: number;
        sugar?: number;
        chocolate?: number;
        special?: number;
    };
    unlocked: boolean;
    level: number;
    maxLevel: number;
    upgradeCost: number[];
    experience: number;
    requiredLevel: number; // 解锁所需等级
}

export interface ProductionSlot {
    id: string;
    recipeId: string;
    startTime: number;
    endTime: number;
    quantity: number;
    status: 'idle' | 'producing' | 'ready' | 'claimed';
    progress: number;
}

export class CoffeeProductionManager extends EventTarget {
    private static _instance: CoffeeProductionManager;
    
    private _recipes: Map<string, CoffeeRecipe> = new Map();
    private _productionSlots: ProductionSlot[] = [];
    private _maxSlots: number = 3;
    private _playerLevel: number = 1;
    private _experience: number = 0;
    private _upgradePoints: number = 0;

    // 基础配方配置
    private readonly BASE_RECIPES: CoffeeRecipe[] = [
        {
            id: 'americano',
            type: CoffeeType.AMERICANO,
            name: '美式咖啡',
            description: '经典美式，提神醒脑',
            price: 10,
            cost: 2,
            productionTime: 30,
            ingredients: {
                coffeeBeans: 1,
                sugar: 0
            },
            unlocked: true,
            level: 1,
            maxLevel: 10,
            upgradeCost: [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600],
            experience: 5,
            requiredLevel: 1
        },
        {
            id: 'latte',
            type: CoffeeType.LATTE,
            name: '拿铁咖啡',
            description: '香浓牛奶与咖啡的完美结合',
            price: 15,
            cost: 3,
            productionTime: 45,
            ingredients: {
                coffeeBeans: 1,
                milk: 1,
                sugar: 0
            },
            unlocked: false,
            level: 1,
            maxLevel: 10,
            upgradeCost: [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
            experience: 8,
            requiredLevel: 3
        },
        {
            id: 'cappuccino',
            type: CoffeeType.CAPPUCCINO,
            name: '卡布奇诺',
            description: '丰富的奶泡，浓郁口感',
            price: 20,
            cost: 4,
            productionTime: 60,
            ingredients: {
                coffeeBeans: 2,
                milk: 1,
                sugar: 0
            },
            unlocked: false,
            level: 1,
            maxLevel: 10,
            upgradeCost: [200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200, 102400],
            experience: 12,
            requiredLevel: 5
        },
        {
            id: 'mocha',
            type: CoffeeType.MOCHA,
            name: '摩卡咖啡',
            description: '巧克力与咖啡的甜蜜邂逅',
            price: 25,
            cost: 5,
            productionTime: 75,
            ingredients: {
                coffeeBeans: 2,
                milk: 1,
                chocolate: 1,
                sugar: 1
            },
            unlocked: false,
            level: 1,
            maxLevel: 10,
            upgradeCost: [500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000],
            experience: 15,
            requiredLevel: 8
        },
        {
            id: 'horror_coffee',
            type: CoffeeType.HORROR_COFFEE,
            name: '恐怖特调',
            description: '微恐特色，惊吓顾客获得额外收益',
            price: 50,
            cost: 10,
            productionTime: 120,
            ingredients: {
                coffeeBeans: 3,
                milk: 2,
                sugar: 1,
                special: 1 // 恐怖元素
            },
            unlocked: false,
            level: 1,
            maxLevel: 5,
            upgradeCost: [1000, 5000, 25000, 125000, 625000],
            experience: 50,
            requiredLevel: 10
        }
    ];

    public static get instance(): CoffeeProductionManager {
        if (!CoffeeProductionManager._instance) {
            CoffeeProductionManager._instance = new CoffeeProductionManager();
        }
        return CoffeeProductionManager._instance;
    }

    private constructor() {
        super();
        this.loadFromStorage();
    }

    /**
     * 初始化生产系统
     */
    public init(): void {
        console.log('咖啡生产系统初始化');
        
        // 初始化配方
        this.BASE_RECIPES.forEach(recipe => {
            this._recipes.set(recipe.id, recipe);
        });

        // 检查配方解锁状态
        this.updateUnlockedRecipes();
        
        // 初始化生产槽位
        this.initProductionSlots();
        
        // 开始更新循环
        this.startUpdateLoop();
    }

    /**
     * 初始化生产槽位
     */
    private initProductionSlots(): void {
        this._productionSlots = [];
        for (let i = 0; i < this._maxSlots; i++) {
            this._productionSlots.push({
                id: `slot_${i}`,
                recipeId: '',
                startTime: 0,
                endTime: 0,
                quantity: 0,
                status: 'idle',
                progress: 0
            });
        }
    }

    /**
     * 开始生产咖啡
     */
    public startProduction(recipeId: string, quantity: number = 1): boolean {
        const recipe = this._recipes.get(recipeId);
        if (!recipe || !recipe.unlocked) {
            console.warn('配方未解锁或不存在:', recipeId);
            return false;
        }

        // 检查是否有空闲槽位
        const slot = this._productionSlots.find(s => s.status === 'idle');
        if (!slot) {
            console.warn('没有空闲的生产槽位');
            return false;
        }

        // 检查是否有足够的材料
        if (!this.hasEnoughIngredients(recipe, quantity)) {
            console.warn('材料不足');
            return false;
        }

        // 扣除材料成本
        if (!this.deductIngredients(recipe, quantity)) {
            return false;
        }

        // 扣除金币成本
        const totalCost = recipe.cost * quantity;
        if (!economyManager.spendCoins(totalCost, 'coffee_production')) {
            console.warn('金币不足');
            // 退回材料
            this.refundIngredients(recipe, quantity);
            return false;
        }

        // 开始生产
        const now = Date.now();
        const productionTime = recipe.productionTime * 1000 * quantity;
        
        slot.recipeId = recipeId;
        slot.startTime = now;
        slot.endTime = now + productionTime;
        slot.quantity = quantity;
        slot.status = 'producing';
        slot.progress = 0;

        console.log(`开始生产: ${recipe.name} x${quantity}, 预计完成时间: ${new Date(slot.endTime).toLocaleTimeString()}`);
        
        this.saveToStorage();
        this.emit('productionStarted', { slot, recipe, quantity });
        
        return true;
    }

    /**
     * 立即完成生产（使用广告）
     */
    public async instantCompleteProduction(slotId: string): Promise<boolean> {
        const slot = this._productionSlots.find(s => s.id === slotId);
        if (!slot || slot.status !== 'producing') {
            return false;
        }

        // 显示激励视频广告
        const success = await adManager.showInstantProductionAd(slot.id);
        
        if (success) {
            // 立即完成
            slot.status = 'ready';
            slot.progress = 100;
            
            this.saveToStorage();
            this.emit('productionInstantlyCompleted', { slot });
            
            return true;
        }
        
        return false;
    }

    /**
     * 领取完成的咖啡
     */
    public claimProduction(slotId: string): boolean {
        const slot = this._productionSlots.find(s => s.id === slotId);
        if (!slot || slot.status !== 'ready') {
            return false;
        }

        const recipe = this._recipes.get(slot.recipeId);
        if (!recipe) {
            return false;
        }

        // 计算收益
        const totalEarnings = recipe.price * slot.quantity;
        economyManager.addCoins(totalEarnings, 'coffee_sale', {
            recipeId: recipe.id,
            quantity: slot.quantity
        });

        // 获得经验
        this.gainExperience(recipe.experience * slot.quantity);

        // 重置槽位
        slot.recipeId = '';
        slot.startTime = 0;
        slot.endTime = 0;
        slot.quantity = 0;
        slot.status = 'idle';
        slot.progress = 0;

        console.log(`领取完成: ${recipe.name} x${slot.quantity}, 获得金币: ${totalEarnings}`);
        
        this.saveToStorage();
        this.emit('productionClaimed', { slot, recipe, earnings: totalEarnings });
        
        return true;
    }

    /**
     * 升级配方
     */
    public upgradeRecipe(recipeId: string): boolean {
        const recipe = this._recipes.get(recipeId);
        if (!recipe || !recipe.unlocked) {
            return false;
        }

        if (recipe.level >= recipe.maxLevel) {
            console.warn('配方已达到最大等级');
            return false;
        }

        const upgradeCost = recipe.upgradeCost[recipe.level - 1];
        if (!economyManager.spendCoins(upgradeCost, 'recipe_upgrade')) {
            console.warn('金币不足，无法升级');
            return false;
        }

        // 升级配方
        recipe.level++;
        
        // 提升配方属性
        recipe.price = Math.floor(recipe.price * 1.2); // 价格上涨20%
        recipe.cost = Math.floor(recipe.cost * 0.9); // 成本降低10%
        recipe.productionTime = Math.floor(recipe.productionTime * 0.9); // 生产时间减少10%
        recipe.experience = Math.floor(recipe.experience * 1.1); // 经验增加10%

        console.log(`配方升级: ${recipe.name} → Lv.${recipe.level}`);
        
        this.saveToStorage();
        this.emit('recipeUpgraded', { recipe });
        
        return true;
    }

    /**
     * 解锁配方
     */
    public unlockRecipe(recipeId: string): boolean {
        const recipe = this._recipes.get(recipeId);
        if (!recipe || recipe.unlocked) {
            return false;
        }

        if (this._playerLevel < recipe.requiredLevel) {
            console.warn(`等级不足，需要等级 ${recipe.requiredLevel}`);
            return false;
        }

        const unlockCost = recipe.upgradeCost[0] * 2; // 解锁费用为第一次升级的两倍
        if (!economyManager.spendCoins(unlockCost, 'recipe_unlock')) {
            console.warn('金币不足，无法解锁');
            return false;
        }

        recipe.unlocked = true;
        
        console.log(`配方解锁: ${recipe.name}`);
        
        this.saveToStorage();
        this.emit('recipeUnlocked', { recipe });
        
        return true;
    }

    /**
     * 检查是否有足够的材料
     */
    private hasEnoughIngredients(recipe: CoffeeRecipe, quantity: number): boolean {
        // 这里应该检查库存系统中的材料
        // 暂时假设材料充足
        return true;
    }

    /**
     * 扣除材料
     */
    private deductIngredients(recipe: CoffeeRecipe, quantity: number): boolean {
        // 这里应该从库存中扣除材料
        // 暂时返回true
        return true;
    }

    /**
     * 退回材料
     */
    private refundIngredients(recipe: CoffeeRecipe, quantity: number): void {
        // 这里应该退回材料到库存
    }

    /**
     * 获得经验
     */
    private gainExperience(amount: number): void {
        this._experience += amount;
        
        // 检查是否升级
        const expForNextLevel = this.getExpForNextLevel();
        if (this._experience >= expForNextLevel) {
            this.levelUp();
        }
        
        this.saveToStorage();
        this.emit('experienceGained', { amount, total: this._experience });
    }

    /**
     * 升级
     */
    private levelUp(): void {
        this._playerLevel++;
        this._upgradePoints++;
        
        // 更新解锁的配方
        this.updateUnlockedRecipes();
        
        console.log(`玩家升级: Lv.${this._playerLevel}`);
        
        this.saveToStorage();
        this.emit('levelUp', { 
            level: this._playerLevel, 
            upgradePoints: this._upgradePoints 
        });
    }

    /**
     * 获取升级所需经验
     */
    private getExpForNextLevel(): number {
        // 简单经验公式
        return 100 * Math.pow(1.5, this._playerLevel - 1);
    }

    /**
     * 更新解锁的配方
     */
    private updateUnlockedRecipes(): void {
        this._recipes.forEach(recipe => {
            if (!recipe.unlocked && this._playerLevel >= recipe.requiredLevel) {
                // 自动解锁基础配方
                if (recipe.requiredLevel <= 5) {
                    recipe.unlocked = true;
                }
            }
        });
    }

    /**
     * 开始更新循环
     */
    private startUpdateLoop(): void {
        setInterval(() => {
            this.updateProductions();
        }, 1000); // 每秒更新一次
    }

    /**
     * 更新生产状态
     */
    private updateProductions(): void {
        const now = Date.now();
        let hasChanges = false;

        this._productionSlots.forEach(slot => {
            if (slot.status === 'producing' && slot.endTime > 0) {
                const elapsed = now - slot.startTime;
                const totalTime = slot.endTime - slot.startTime;
                
                slot.progress = Math.min(100, (elapsed / totalTime) * 100);
                
                // 检查是否完成
                if (now >= slot.endTime) {
                    slot.status = 'ready';
                    slot.progress = 100;
                    hasChanges = true;
                    
                    const recipe = this._recipes.get(slot.recipeId);
                    if (recipe) {
                        console.log(`生产完成: ${recipe.name} x${slot.quantity}`);
                        this.emit('productionCompleted', { slot, recipe });
                    }
                }
            }
        });

        if (hasChanges) {
            this.saveToStorage();
        }
    }

    /**
     * 获取所有配方
     */
    public getRecipes(): CoffeeRecipe[] {
        return Array.from(this._recipes.values());
    }

    /**
     * 获取已解锁的配方
     */
    public getUnlockedRecipes(): CoffeeRecipe[] {
        return this.getRecipes().filter(recipe => recipe.unlocked);
    }

    /**
     * 获取生产槽位
     */
    public getProductionSlots(): ProductionSlot[] {
        return [...this._productionSlots];
    }

    /**
     * 获取玩家等级
     */
    public get playerLevel(): number {
        return this._playerLevel;
    }

    /**
     * 获取经验值
     */
    public get experience(): number {
        return this._experience;
    }

    /**
     * 获取升级点数
     */
    public get upgradePoints(): number {
        return this._upgradePoints;
    }

    /**
     * 从本地存储加载数据
     */
    private loadFromStorage(): void {
        try {
            const saved = localStorage.getItem('coffee_production_data');
            if (saved) {
                const data = JSON.parse(saved);
                this._playerLevel = data.playerLevel || 1;
                this._experience = data.experience || 0;
                this._upgradePoints = data.upgradePoints || 0;
                this._maxSlots = data.maxSlots || 3;
                this._productionSlots = data.productionSlots || [];
                
                // 加载配方状态
                const savedRecipes = data.recipes || {};
                this.BASE_RECIPES.forEach(baseRecipe => {
                    const savedRecipe = savedRecipes[baseRecipe.id];
                    if (savedRecipe) {
                        Object.assign(baseRecipe, savedRecipe);
                    }
                    this._recipes.set(baseRecipe.id, baseRecipe);
                });
                
                console.log('咖啡生产数据加载完成');
            }
        } catch (error) {
            console.warn('加载咖啡生产数据失败:', error);
        }
    }

    /**
     * 保存到本地存储
     */
    private saveToStorage(): void {
        try {
            const recipesData: { [key: string]: any } = {};
            this._recipes.forEach((recipe, id) => {
                recipesData[id] = {
                    unlocked: recipe.unlocked,
                    level: recipe.level,
                    price: recipe.price,
                    cost: recipe.cost,
                    productionTime: recipe.productionTime,
                    experience: recipe.experience
                };
            });
            
            const data = {
                playerLevel: this._playerLevel,
                experience: this._experience,
                upgradePoints: this._upgradePoints,
                maxSlots: this._maxSlots,
                productionSlots: this._productionSlots,
                recipes: recipesData
            };
            
            localStorage.setItem('coffee_production_data', JSON.stringify(data));
        } catch (error) {
            console.warn('保存咖啡生产数据失败:', error);
        }
    }
}

// 全局访问
export const coffeeProductionManager = CoffeeProductionManager.instance;