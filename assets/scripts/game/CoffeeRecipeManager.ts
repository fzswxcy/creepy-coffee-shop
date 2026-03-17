/**
 * 咖啡配方管理器
 * 管理所有咖啡配方，包括基础配方和特殊微恐配方
 */

import { _decorator, Component, JsonAsset, resources } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 咖啡配方接口
 */
export interface CoffeeRecipe {
    id: string;
    name: string;
    displayName: string;
    description: string;
    basePrice: number;
    energyCost: number;
    timeToMake: number; // 制作时间（秒）
    difficulty: number; // 制作难度（1-5）
    
    // 原料配置
    ingredients: {
        coffeeBeans: number;    // 咖啡豆数量
        milk: number;           // 牛奶数量（0-100%）
        sugar: number;          // 糖数量（0-5颗）
        ice: number;            // 冰量（0-100%）
    };
    
    // 微恐元素配置
    spookyConfig?: {
        isSpooky: boolean;
        spookyLevel: number;    // 恐怖等级（1-5）
        specialIngredient: string;
        spookyEffect: string;
        priceMultiplier: number; // 价格加成倍数
    };
    
    // 解锁条件
    unlockConditions: {
        levelRequired: number;
        goldRequired?: number;
        specialItemRequired?: string;
    };
    
    // 制作步骤
    steps: Array<{
        stepName: string;
        timeRequired: number;
        uiHint: string;
        successChance: number;
    }>;
    
    // 特殊效果
    specialEffects?: Array<{
        type: string; // 'boost_energy' | 'increase_tips' | 'special_customer' | 'reduce_time'
        value: number;
        duration?: number;
    }>;
}

/**
 * 玩家配方进度
 */
export interface PlayerRecipeProgress {
    recipeId: string;
    unlocked: boolean;
    timesMade: number;
    successRate: number;
    lastMadeTime?: number;
    masteryLevel: number; // 1-5
    specialUnlocked: boolean; // 是否解锁特殊版本
}

@ccclass('CoffeeRecipeManager')
export class CoffeeRecipeManager extends Component {
    // 配置文件
    @property(JsonAsset)
    private recipeConfig: JsonAsset | null = null;
    
    // 配方数据
    private allRecipes: Map<string, CoffeeRecipe> = new Map();
    private unlockedRecipes: Set<string> = new Set();
    private playerProgress: Map<string, PlayerRecipeProgress> = new Map();
    
    // 默认配方（如果配置文件不存在）
    private defaultRecipes: CoffeeRecipe[] = [
        {
            id: 'espresso',
            name: '浓缩咖啡',
            displayName: '☕️ 经典浓缩',
            description: '经典的浓缩咖啡，香气浓郁，适合喜欢纯粹咖啡的顾客。',
            basePrice: 15,
            energyCost: 2,
            timeToMake: 30,
            difficulty: 1,
            ingredients: {
                coffeeBeans: 3,
                milk: 0,
                sugar: 0,
                ice: 0
            },
            unlockConditions: {
                levelRequired: 1
            },
            steps: [
                { stepName: '磨豆', timeRequired: 10, uiHint: '点击磨豆机', successChance: 0.95 },
                { stepName: '压粉', timeRequired: 5, uiHint: '均匀压粉', successChance: 0.9 },
                { stepName: '萃取', timeRequired: 15, uiHint: '保持压力', successChance: 0.85 }
            ]
        },
        {
            id: 'latte',
            name: '拿铁咖啡',
            displayName: '🥛 温暖拿铁',
            description: '咖啡与牛奶的完美融合，奶泡细腻，口感顺滑。',
            basePrice: 25,
            energyCost: 3,
            timeToMake: 45,
            difficulty: 2,
            ingredients: {
                coffeeBeans: 3,
                milk: 60,
                sugar: 2,
                ice: 0
            },
            unlockConditions: {
                levelRequired: 2,
                goldRequired: 500
            },
            steps: [
                { stepName: '磨豆', timeRequired: 10, uiHint: '点击磨豆机', successChance: 0.95 },
                { stepName: '萃取', timeRequired: 15, uiHint: '保持压力', successChance: 0.85 },
                { stepName: '蒸汽牛奶', timeRequired: 15, uiHint: '控制温度', successChance: 0.8 },
                { stepName: '融合', timeRequired: 5, uiHint: '均匀混合', successChance: 0.9 }
            ]
        },
        {
            id: 'spooky_espresso',
            name: '幽灵浓缩',
            displayName: '👻 幽灵浓缩',
            description: '加入了幽灵气息的特殊浓缩，喝完后顾客会短暂看到幽灵。',
            basePrice: 35,
            energyCost: 4,
            timeToMake: 40,
            difficulty: 3,
            ingredients: {
                coffeeBeans: 4,
                milk: 0,
                sugar: 1,
                ice: 0
            },
            spookyConfig: {
                isSpooky: true,
                spookyLevel: 2,
                specialIngredient: '幽灵气息',
                spookyEffect: '顾客看到短暂幽灵幻影',
                priceMultiplier: 2.3
            },
            unlockConditions: {
                levelRequired: 3,
                goldRequired: 1000,
                specialItemRequired: 'ghost_essence'
            },
            steps: [
                { stepName: '磨豆', timeRequired: 10, uiHint: '点击磨豆机', successChance: 0.9 },
                { stepName: '加入幽灵气息', timeRequired: 10, uiHint: '小心添加', successChance: 0.75 },
                { stepName: '压粉', timeRequired: 5, uiHint: '均匀压粉', successChance: 0.85 },
                { stepName: '幽灵萃取', timeRequired: 15, uiHint: '幽灵能量', successChance: 0.7 }
            ],
            specialEffects: [
                { type: 'increase_tips', value: 1.5, duration: 300 },
                { type: 'special_customer', value: 1 }
            ]
        },
        {
            id: 'vampire_cold_brew',
            name: '吸血鬼冷萃',
            displayName: '🧛 吸血鬼冷萃',
            description: '血红色的冷萃咖啡，据说喝完后会有吸血鬼般的力量。',
            basePrice: 50,
            energyCost: 5,
            timeToMake: 90,
            difficulty: 4,
            ingredients: {
                coffeeBeans: 5,
                milk: 0,
                sugar: 3,
                ice: 80
            },
            spookyConfig: {
                isSpooky: true,
                spookyLevel: 3,
                specialIngredient: '吸血鬼之血',
                spookyEffect: '夜间能力增强',
                priceMultiplier: 3.0
            },
            unlockConditions: {
                levelRequired: 5,
                goldRequired: 2500,
                specialItemRequired: 'vampire_blood'
            },
            steps: [
                { stepName: '混合咖啡豆', timeRequired: 15, uiHint: '精心混合', successChance: 0.85 },
                { stepName: '加入吸血鬼之血', timeRequired: 20, uiHint: '一滴一滴', successChance: 0.7 },
                { stepName: '冷萃开始', timeRequired: 40, uiHint: '等待萃取', successChance: 0.9 },
                { stepName: '加冰完成', timeRequired: 15, uiHint: '冰镇完成', successChance: 0.8 }
            ],
            specialEffects: [
                { type: 'boost_energy', value: 2.0, duration: 600 },
                { type: 'increase_tips', value: 2.0, duration: 600 }
            ]
        }
    ];
    
    // 初始化
    onLoad() {
        this.loadRecipeConfig();
        this.loadPlayerProgress();
        this.unlockBasicRecipes();
    }
    
    /**
     * 加载配方配置
     */
    private loadRecipeConfig() {
        if (this.recipeConfig && this.recipeConfig.json) {
            // 从配置文件加载
            const configData = this.recipeConfig.json;
            if (configData.recipes && Array.isArray(configData.recipes)) {
                configData.recipes.forEach((recipe: CoffeeRecipe) => {
                    this.allRecipes.set(recipe.id, recipe);
                });
            }
        } else {
            // 使用默认配方
            this.defaultRecipes.forEach(recipe => {
                this.allRecipes.set(recipe.id, recipe);
            });
        }
        
        console.log(`✅ 咖啡配方管理器初始化完成，共加载 ${this.allRecipes.size} 个配方`);
    }
    
    /**
     * 加载玩家进度
     */
    private loadPlayerProgress() {
        // TODO: 从本地存储或云数据库加载玩家进度
        // 这里暂时使用默认进度
        this.allRecipes.forEach(recipe => {
            this.playerProgress.set(recipe.id, {
                recipeId: recipe.id,
                unlocked: recipe.unlockConditions.levelRequired === 1,
                timesMade: 0,
                successRate: 0,
                masteryLevel: 1,
                specialUnlocked: false
            });
        });
        
        console.log(`📊 玩家配方进度加载完成`);
    }
    
    /**
     * 解锁基础配方
     */
    private unlockBasicRecipes() {
        this.allRecipes.forEach(recipe => {
            if (recipe.unlockConditions.levelRequired === 1) {
                this.unlockedRecipes.add(recipe.id);
                const progress = this.playerProgress.get(recipe.id);
                if (progress) {
                    progress.unlocked = true;
                }
            }
        });
        
        console.log(`🔓 已解锁 ${this.unlockedRecipes.size} 个基础配方`);
    }
    
    /**
     * 获取所有配方
     */
    public getAllRecipes(): CoffeeRecipe[] {
        return Array.from(this.allRecipes.values());
    }
    
    /**
     * 获取解锁的配方
     */
    public getUnlockedRecipes(): CoffeeRecipe[] {
        return Array.from(this.unlockedRecipes).map(id => this.allRecipes.get(id)!);
    }
    
    /**
     * 根据ID获取配方
     */
    public getRecipeById(id: string): CoffeeRecipe | null {
        return this.allRecipes.get(id) || null;
    }
    
    /**
     * 获取玩家配方进度
     */
    public getRecipeProgress(id: string): PlayerRecipeProgress | null {
        return this.playerProgress.get(id) || null;
    }
    
    /**
     * 检查配方是否解锁
     */
    public isRecipeUnlocked(id: string): boolean {
        return this.unlockedRecipes.has(id);
    }
    
    /**
     * 解锁配方
     */
    public unlockRecipe(id: string): boolean {
        const recipe = this.allRecipes.get(id);
        if (!recipe) {
            console.warn(`❌ 配方不存在: ${id}`);
            return false;
        }
        
        // 检查解锁条件
        const progress = this.playerProgress.get(id);
        if (progress && !progress.unlocked) {
            // TODO: 检查金币、等级等条件
            progress.unlocked = true;
            this.unlockedRecipes.add(id);
            
            console.log(`🎉 解锁新配方: ${recipe.displayName}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * 记录配方制作
     */
    public recordRecipeMade(id: string, success: boolean): void {
        const progress = this.playerProgress.get(id);
        if (!progress) return;
        
        progress.timesMade++;
        
        // 更新成功率
        if (success) {
            const currentRate = progress.successRate || 0;
            const totalMade = progress.timesMade;
            progress.successRate = ((currentRate * (totalMade - 1)) + 1) / totalMade;
        } else {
            const currentRate = progress.successRate || 0;
            const totalMade = progress.timesMade;
            progress.successRate = (currentRate * (totalMade - 1)) / totalMade;
        }
        
        // 更新熟练度等级
        progress.masteryLevel = this.calculateMasteryLevel(progress);
        
        progress.lastMadeTime = Date.now();
        
        // TODO: 保存到本地存储
    }
    
    /**
     * 计算熟练度等级
     */
    private calculateMasteryLevel(progress: PlayerRecipeProgress): number {
        const timesMade = progress.timesMade;
        const successRate = progress.successRate;
        
        if (timesMade >= 100 && successRate >= 0.9) return 5;
        if (timesMade >= 50 && successRate >= 0.8) return 4;
        if (timesMade >= 20 && successRate >= 0.7) return 3;
        if (timesMade >= 10 && successRate >= 0.6) return 2;
        return 1;
    }
    
    /**
     * 获取推荐配方
     */
    public getRecommendedRecipes(): CoffeeRecipe[] {
        // 基于玩家进度推荐配方
        const unlockedRecipes = this.getUnlockedRecipes();
        
        // 按价格排序（价格高的优先推荐）
        return unlockedRecipes.sort((a, b) => {
            const priceA = a.basePrice * (a.spookyConfig?.priceMultiplier || 1);
            const priceB = b.basePrice * (b.spookyConfig?.priceMultiplier || 1);
            return priceB - priceA;
        }).slice(0, 3);
    }
    
    /**
     * 获取微恐配方
     */
    public getSpookyRecipes(): CoffeeRecipe[] {
        return this.getUnlockedRecipes().filter(recipe => 
            recipe.spookyConfig?.isSpooky === true
        );
    }
    
    /**
     * 获取配方价格（包含微恐加成）
     */
    public getRecipePrice(id: string): number {
        const recipe = this.getRecipeById(id);
        if (!recipe) return 0;
        
        let price = recipe.basePrice;
        
        // 微恐配方价格加成
        if (recipe.spookyConfig) {
            price *= recipe.spookyConfig.priceMultiplier || 1;
        }
        
        // 熟练度加成（高级熟练度可以卖出更高价格）
        const progress = this.getRecipeProgress(id);
        if (progress && progress.masteryLevel >= 4) {
            price *= 1.2;
        }
        
        return Math.round(price);
    }
    
    /**
     * 获取配方制作时间（考虑熟练度）
     */
    public getRecipeTime(id: string): number {
        const recipe = this.getRecipeById(id);
        if (!recipe) return 0;
        
        let time = recipe.timeToMake;
        
        // 熟练度减少制作时间
        const progress = this.getRecipeProgress(id);
        if (progress) {
            const timeReduction = (progress.masteryLevel - 1) * 0.1; // 每级减少10%
            time *= (1 - timeReduction);
        }
        
        return Math.round(time);
    }
    
    /**
     * 保存玩家进度
     */
    public savePlayerProgress(): void {
        // TODO: 保存到本地存储或云数据库
        console.log('💾 配方进度已保存');
    }
}

export const coffeeRecipeManager = new CoffeeRecipeManager();