/**
 * 游戏平衡管理器
 * 动态调整游戏难度和经济平衡，确保良好的玩家体验
 */

import { _decorator, Component, JsonAsset } from 'cc';
import { economyManager } from './EconomyManager';
import { coffeeRecipeManager } from '../game/CoffeeRecipeManager';
import { customerServiceSystem } from '../game/CustomerServiceSystem';
import { mainGameLoop } from '../game/MainGameLoop';
import { gameFeedbackSystem } from '../ui/GameFeedbackSystem';
const { ccclass, property } = _decorator;

/**
 * 游戏平衡配置
 */
export interface BalanceConfig {
    // 难度调整
    difficulty: {
        baseDifficulty: number; // 基础难度（1-10）
        difficultyIncreasePerDay: number; // 每天难度增加
        maxDifficulty: number; // 最大难度
        customerSpawnRate: {
            base: number; // 基础生成率（顾客/分钟）
            increasePerDay: number; // 每天增加
            max: number; // 最大生成率
        };
        customerPatience: {
            base: number; // 基础耐心（秒）
            decreasePerDay: number; // 每天减少
            min: number; // 最小耐心
        };
    };
    
    // 经济平衡
    economy: {
        baseCoffeePrices: {
            multiplier: number; // 基础价格倍数
            increasePerLevel: number; // 每级增加
        };
        tipRates: {
            base: number; // 基础小费率
            qualityBonus: number; // 质量加成
            speedBonus: number; // 速度加成
            vipBonus: number; // VIP加成
        };
        energyCosts: {
            base: number; // 基础能量消耗
            difficultyMultiplier: number; // 难度加成
        };
        unlockCosts: {
            recipeUnlockGold: number; // 配方解锁金币
            recipeUnlockIncrease: number; // 每次解锁增加
            upgradeCostMultiplier: number; // 升级成本倍数
        };
    };
    
    // 进度系统
    progression: {
        experience: {
            basePerCustomer: number; // 每个顾客基础经验
            qualityBonus: number; // 质量经验加成
            vipBonus: number; // VIP经验加成
            levelUpRequirements: number[]; // 每级所需经验
        };
        unlockRequirements: {
            recipeLevels: number[]; // 配方解锁所需等级
            recipeGoldCosts: number[]; // 配方解锁金币成本
            upgradeLevels: number[]; // 升级解锁所需等级
        };
    };
    
    // 微恐元素
    spookyElements: {
        spookyCustomerChance: number; // 微恐顾客概率
        spookyEffectMultiplier: number; // 微恐效果倍数
        specialIngredientChance: number; // 特殊配料出现概率
    };
}

/**
 * 动态平衡数据
 */
export interface DynamicBalanceData {
    currentDifficulty: number;
    currentDay: number;
    playerLevel: number;
    averageSatisfaction: number;
    successRate: number;
    playTimeHours: number;
    lastAdjustmentTime: number;
    adjustmentsMade: number;
}

/**
 * 平衡调整建议
 */
export interface BalanceAdjustment {
    type: 'difficulty' | 'economy' | 'progression' | 'spooky';
    adjustment: number;
    reason: string;
    timestamp: number;
}

@ccclass('GameBalanceManager')
export class GameBalanceManager extends Component {
    // 配置文件
    @property(JsonAsset)
    private balanceConfigAsset: JsonAsset | null = null;
    
    // 当前配置
    private config: BalanceConfig;
    
    // 动态数据
    private dynamicData: DynamicBalanceData = {
        currentDifficulty: 1,
        currentDay: 1,
        playerLevel: 1,
        averageSatisfaction: 70,
        successRate: 80,
        playTimeHours: 0,
        lastAdjustmentTime: Date.now(),
        adjustmentsMade: 0
    };
    
    // 调整历史
    private adjustmentHistory: BalanceAdjustment[] = [];
    
    // 性能监控
    private performanceMetrics = {
        sessionsPlayed: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        retentionRate: 0,
        difficultyFeedback: 0 // 玩家反馈（-5到+5）
    };
    
    onLoad() {
        this.loadBalanceConfig();
        this.initializeBalanceSystem();
    }
    
    /**
     * 加载平衡配置
     */
    private loadBalanceConfig() {
        if (this.balanceConfigAsset && this.balanceConfigAsset.json) {
            this.config = this.balanceConfigAsset.json as BalanceConfig;
            console.log('⚖️ 从配置文件加载平衡配置');
        } else {
            this.config = this.getDefaultConfig();
            console.log('⚖️ 使用默认平衡配置');
        }
    }
    
    /**
     * 获取默认配置
     */
    private getDefaultConfig(): BalanceConfig {
        return {
            difficulty: {
                baseDifficulty: 3,
                difficultyIncreasePerDay: 0.2,
                maxDifficulty: 10,
                customerSpawnRate: {
                    base: 2,
                    increasePerDay: 0.3,
                    max: 8
                },
                customerPatience: {
                    base: 180,
                    decreasePerDay: 5,
                    min: 60
                }
            },
            
            economy: {
                baseCoffeePrices: {
                    multiplier: 1.0,
                    increasePerLevel: 0.05
                },
                tipRates: {
                    base: 0.5,
                    qualityBonus: 0.2,
                    speedBonus: 0.1,
                    vipBonus: 0.3
                },
                energyCosts: {
                    base: 1.0,
                    difficultyMultiplier: 0.05
                },
                unlockCosts: {
                    recipeUnlockGold: 500,
                    recipeUnlockIncrease: 200,
                    upgradeCostMultiplier: 1.5
                }
            },
            
            progression: {
                experience: {
                    basePerCustomer: 10,
                    qualityBonus: 5,
                    vipBonus: 15,
                    levelUpRequirements: [100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000]
                },
                unlockRequirements: {
                    recipeLevels: [1, 2, 3, 5, 7, 10, 13, 16, 20, 25],
                    recipeGoldCosts: [0, 500, 1000, 2000, 3500, 5000, 8000, 12000, 18000, 25000],
                    upgradeLevels: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30]
                }
            },
            
            spookyElements: {
                spookyCustomerChance: 0.15,
                spookyEffectMultiplier: 2.5,
                specialIngredientChance: 0.3
            }
        };
    }
    
    /**
     * 初始化平衡系统
     */
    private initializeBalanceSystem() {
        console.log('🔄 初始化游戏平衡系统');
        
        // 开始平衡监控
        this.schedule(this.monitorGameBalance, 30); // 每30秒监控一次
        
        // 开始动态调整
        this.schedule(this.applyDynamicAdjustments, 300); // 每5分钟调整一次
        
        console.log('✅ 平衡系统初始化完成');
    }
    
    /**
     * 监控游戏平衡
     */
    private monitorGameBalance() {
        // 收集游戏数据
        this.collectGameData();
        
        // 分析平衡状态
        this.analyzeBalanceState();
        
        // 检查是否需要调整
        this.checkForAdjustments();
    }
    
    /**
     * 收集游戏数据
     */
    private collectGameData() {
        // 从游戏系统收集数据
        const gameStats = mainGameLoop.getGameStats();
        const serviceStats = customerServiceSystem.getServiceStats();
        
        this.dynamicData.currentDay = this.dynamicData.currentDay; // TODO: 从游戏循环获取
        this.dynamicData.averageSatisfaction = serviceStats.averageSatisfaction;
        this.dynamicData.successRate = serviceStats.successRate;
        
        // 更新性能指标
        this.performanceMetrics.totalRevenue = gameStats.totalRevenue;
        this.performanceMetrics.totalCustomers = gameStats.totalCustomers;
        
        // 计算玩家等级
        this.calculatePlayerLevel();
    }
    
    /**
     * 计算玩家等级
     */
    private calculatePlayerLevel() {
        // 基于经验和成功率的简单等级计算
        const baseLevel = Math.floor(this.dynamicData.currentDay / 3) + 1;
        const successBonus = Math.floor(this.dynamicData.successRate / 20);
        
        this.dynamicData.playerLevel = Math.max(1, Math.min(baseLevel + successBonus, 30));
    }
    
    /**
     * 分析平衡状态
     */
    private analyzeBalanceState() {
        const analysis = {
            isTooEasy: false,
            isTooHard: false,
            economyBalanced: true,
            progressionGood: true,
            playerEngagement: 'good'
        };
        
        // 分析难度
        if (this.dynamicData.successRate > 90) {
            analysis.isTooEasy = true;
            console.log('📈 游戏可能太简单，成功率过高');
        } else if (this.dynamicData.successRate < 50) {
            analysis.isTooHard = true;
            console.log('📉 游戏可能太难，成功率过低');
        }
        
        // 分析经济平衡
        const revenuePerCustomer = this.performanceMetrics.totalCustomers > 0 
            ? this.performanceMetrics.totalRevenue / this.performanceMetrics.totalCustomers
            : 0;
        
        if (revenuePerCustomer > 100) {
            analysis.economyBalanced = false;
            console.log('💰 经济收益过高，需要调整');
        } else if (revenuePerCustomer < 20) {
            analysis.economyBalanced = false;
            console.log('💸 经济收益过低，需要调整');
        }
        
        // 分析玩家进度
        const expectedLevel = Math.floor(this.dynamicData.currentDay * 0.7) + 1;
        if (this.dynamicData.playerLevel < expectedLevel - 2) {
            analysis.progressionGood = false;
            console.log('🐌 玩家进度过慢');
        } else if (this.dynamicData.playerLevel > expectedLevel + 2) {
            analysis.progressionGood = false;
            console.log('🚀 玩家进度过快');
        }
        
        return analysis;
    }
    
    /**
     * 检查是否需要调整
     */
    private checkForAdjustments() {
        const analysis = this.analyzeBalanceState();
        const now = Date.now();
        const timeSinceLastAdjustment = (now - this.dynamicData.lastAdjustmentTime) / 1000 / 60; // 分钟
        
        // 如果距离上次调整超过10分钟，才考虑新的调整
        if (timeSinceLastAdjustment < 10) {
            return;
        }
        
        let adjustments: BalanceAdjustment[] = [];
        
        // 难度调整
        if (analysis.isTooEasy) {
            adjustments.push({
                type: 'difficulty',
                adjustment: 0.1,
                reason: '游戏太简单，增加难度',
                timestamp: now
            });
        } else if (analysis.isTooHard) {
            adjustments.push({
                type: 'difficulty',
                adjustment: -0.1,
                reason: '游戏太难，降低难度',
                timestamp: now
            });
        }
        
        // 经济调整
        if (!analysis.economyBalanced) {
            const revenuePerCustomer = this.performanceMetrics.totalCustomers > 0 
                ? this.performanceMetrics.totalRevenue / this.performanceMetrics.totalCustomers
                : 0;
            
            if (revenuePerCustomer > 100) {
                adjustments.push({
                    type: 'economy',
                    adjustment: -0.05,
                    reason: '经济收益过高，降低价格',
                    timestamp: now
                });
            } else if (revenuePerCustomer < 20) {
                adjustments.push({
                    type: 'economy',
                    adjustment: 0.05,
                    reason: '经济收益过低，提高价格',
                    timestamp: now
                });
            }
        }
        
        // 进度调整
        if (!analysis.progressionGood) {
            const expectedLevel = Math.floor(this.dynamicData.currentDay * 0.7) + 1;
            
            if (this.dynamicData.playerLevel < expectedLevel - 2) {
                adjustments.push({
                    type: 'progression',
                    adjustment: 0.1,
                    reason: '玩家进度过慢，增加经验获取',
                    timestamp: now
                });
            } else if (this.dynamicData.playerLevel > expectedLevel + 2) {
                adjustments.push({
                    type: 'progression',
                    adjustment: -0.1,
                    reason: '玩家进度过快，减少经验获取',
                    timestamp: now
                });
            }
        }
        
        // 应用调整
        if (adjustments.length > 0) {
            this.applyAdjustments(adjustments);
        }
    }
    
    /**
     * 应用动态调整
     */
    private applyDynamicAdjustments() {
        // 基于游戏天数的基础调整
        const dayBasedAdjustments: BalanceAdjustment[] = [];
        const now = Date.now();
        
        // 每天增加难度
        dayBasedAdjustments.push({
            type: 'difficulty',
            adjustment: this.config.difficulty.difficultyIncreasePerDay,
            reason: `游戏天数增加，适当提升难度`,
            timestamp: now
        });
        
        // 每5天增加微恐元素概率
        if (this.dynamicData.currentDay % 5 === 0) {
            dayBasedAdjustments.push({
                type: 'spooky',
                adjustment: 0.02,
                reason: '游戏进展，增加微恐元素',
                timestamp: now
            });
        }
        
        // 应用基础调整
        this.applyAdjustments(dayBasedAdjustments);
    }
    
    /**
     * 应用调整
     */
    private applyAdjustments(adjustments: BalanceAdjustment[]) {
        adjustments.forEach(adjustment => {
            this.applySingleAdjustment(adjustment);
            this.adjustmentHistory.push(adjustment);
        });
        
        this.dynamicData.adjustmentsMade += adjustments.length;
        this.dynamicData.lastAdjustmentTime = Date.now();
        
        console.log(`⚙️ 应用 ${adjustments.length} 个平衡调整`);
    }
    
    /**
     * 应用单个调整
     */
    private applySingleAdjustment(adjustment: BalanceAdjustment) {
        switch (adjustment.type) {
            case 'difficulty':
                this.adjustDifficulty(adjustment.adjustment);
                break;
            case 'economy':
                this.adjustEconomy(adjustment.adjustment);
                break;
            case 'progression':
                this.adjustProgression(adjustment.adjustment);
                break;
            case 'spooky':
                this.adjustSpookyElements(adjustment.adjustment);
                break;
        }
        
        // 显示调整反馈
        gameFeedbackSystem.showInfo('⚖️ 游戏平衡调整', adjustment.reason, 4000);
    }
    
    /**
     * 调整难度
     */
    private adjustDifficulty(adjustment: number) {
        this.dynamicData.currentDifficulty = Math.max(1, Math.min(
            this.dynamicData.currentDifficulty + adjustment,
            this.config.difficulty.maxDifficulty
        ));
        
        console.log(`📊 难度调整为: ${this.dynamicData.currentDifficulty.toFixed(2)}`);
    }
    
    /**
     * 调整经济
     */
    private adjustEconomy(adjustment: number) {
        this.config.economy.baseCoffeePrices.multiplier = Math.max(0.5, Math.min(
            this.config.economy.baseCoffeePrices.multiplier + adjustment,
            2.0
        ));
        
        console.log(`💰 经济调整，价格倍数: ${this.config.economy.baseCoffeePrices.multiplier.toFixed(2)}`);
    }
    
    /**
     * 调整进度
     */
    private adjustProgression(adjustment: number) {
        this.config.progression.experience.basePerCustomer = Math.max(5, Math.min(
            this.config.progression.experience.basePerCustomer * (1 + adjustment),
            30
        ));
        
        console.log(`📈 进度调整，基础经验: ${this.config.progression.experience.basePerCustomer}`);
    }
    
    /**
     * 调整微恐元素
     */
    private adjustSpookyElements(adjustment: number) {
        this.config.spookyElements.spookyCustomerChance = Math.max(0.05, Math.min(
            this.config.spookyElements.spookyCustomerChance + adjustment,
            0.5
        ));
        
        console.log(`👻 微恐调整，概率: ${(this.config.spookyElements.spookyCustomerChance * 100).toFixed(1)}%`);
    }
    
    // ==================== 公共API ====================
    
    /**
     * 获取当前难度
     */
    public getCurrentDifficulty(): number {
        return this.dynamicData.currentDifficulty;
    }
    
    /**
     * 获取顾客生成率
     */
    public getCustomerSpawnRate(): number {
        const base = this.config.difficulty.customerSpawnRate.base;
        const increase = this.config.difficulty.customerSpawnRate.increasePerDay * this.dynamicData.currentDay;
        const difficultyMultiplier = 1 + (this.dynamicData.currentDifficulty - 3) * 0.1;
        
        return Math.min(
            (base + increase) * difficultyMultiplier,
            this.config.difficulty.customerSpawnRate.max
        );
    }
    
    /**
     * 获取顾客耐心
     */
    public getCustomerPatience(): number {
        const base = this.config.difficulty.customerPatience.base;
        const decrease = this.config.difficulty.customerPatience.decreasePerDay * this.dynamicData.currentDay;
        const difficultyMultiplier = 1 - (this.dynamicData.currentDifficulty - 3) * 0.05;
        
        return Math.max(
            (base - decrease) * difficultyMultiplier,
            this.config.difficulty.customerPatience.min
        );
    }
    
    /**
     * 获取咖啡价格倍数
     */
    public getCoffeePriceMultiplier(): number {
        const base = this.config.economy.baseCoffeePrices.multiplier;
        const levelBonus = this.config.economy.baseCoffeePrices.increasePerLevel * (this.dynamicData.playerLevel - 1);
        
        return base + levelBonus;
    }
    
    /**
     * 获取小费率
     */
    public getTipRate(qualityScore: number, serviceTime: number, isVip: boolean = false): number {
        let rate = this.config.economy.tipRates.base;
        
        // 质量加成
        const qualityBonus = (qualityScore - 70) / 100 * this.config.economy.tipRates.qualityBonus;
        rate += qualityBonus;
        
        // 速度加成（服务时间越短加成越多）
        const speedBonus = Math.max(0, (60 - serviceTime) / 60 * this.config.economy.tipRates.speedBonus);
        rate += speedBonus;
        
        // VIP加成
        if (isVip) {
            rate += this.config.economy.tipRates.vipBonus;
        }
        
        return Math.max(0.1, Math.min(rate, 3.0));
    }
    
    /**
     * 获取能量消耗
     */
    public getEnergyCost(baseCost: number): number {
        const difficultyMultiplier = 1 + (this.dynamicData.currentDifficulty - 3) * this.config.economy.energyCosts.difficultyMultiplier;
        return Math.round(baseCost * difficultyMultiplier);
    }
    
    /**
     * 获取配方解锁成本
     */
    public getRecipeUnlockCost(unlockCount: number): number {
        const base = this.config.economy.unlockCosts.recipeUnlockGold;
        const increase = this.config.economy.unlockCosts.recipeUnlockIncrease * unlockCount;
        return base + increase;
    }
    
    /**
     * 获取升级成本
     */
    public getUpgradeCost(baseCost: number, upgradeLevel: number): number {
        const multiplier = Math.pow(this.config.economy.unlockCosts.upgradeCostMultiplier, upgradeLevel - 1);
        return Math.round(baseCost * multiplier);
    }
    
    /**
     * 获取经验值
     */
    public getExperienceForService(qualityScore: number, isVip: boolean = false): number {
        let exp = this.config.progression.experience.basePerCustomer;
        
        // 质量加成
        const qualityBonus = (qualityScore - 70) / 100 * this.config.progression.experience.qualityBonus;
        exp += qualityBonus;
        
        // VIP加成
        if (isVip) {
            exp += this.config.progression.experience.vipBonus;
        }
        
        return Math.round(exp);
    }
    
    /**
     * 获取等级所需经验
     */
    public getExperienceForLevel(level: number): number {
        if (level <= 1) return 0;
        if (level - 2 < this.config.progression.experience.levelUpRequirements.length) {
            return this.config.progression.experience.levelUpRequirements[level - 2];
        }
        
        // 如果超出配置，使用指数增长
        const lastIndex = this.config.progression.experience.levelUpRequirements.length - 1;
        const lastValue = this.config.progression.experience.levelUpRequirements[lastIndex];
        const extraLevels = level - (lastIndex + 2);
        return lastValue * Math.pow(1.5, extraLevels);
    }
    
    /**
     * 获取配方解锁所需等级
     */
    public getRecipeUnlockLevel(recipeIndex: number): number {
        if (recipeIndex < this.config.progression.unlockRequirements.recipeLevels.length) {
            return this.config.progression.unlockRequirements.recipeLevels[recipeIndex];
        }
        return 30; // 默认最高等级
    }
    
    /**
     * 获取微恐顾客概率
     */
    public getSpookyCustomerChance(): number {
        return this.config.spookyElements.spookyCustomerChance;
    }
    
    /**
     * 获取微恐效果倍数
     */
    public getSpookyEffectMultiplier(): number {
        return this.config.spookyElements.spookyEffectMultiplier;
    }
    
    /**
     * 获取特殊配料概率
     */
    public getSpecialIngredientChance(): number {
        return this.config.spookyElements.specialIngredientChance;
    }
    
    /**
     * 更新游戏天数
     */
    public updateGameDay(day: number) {
        this.dynamicData.currentDay = day;
    }
    
    /**
     * 获取平衡报告
     */
    public getBalanceReport(): {
        difficulty: number;
        economy: number;
        progression: number;
        playerLevel: number;
        successRate: number;
        satisfaction: number;
        adjustmentsMade: number;
    } {
        return {
            difficulty: this.dynamicData.currentDifficulty,
            economy: this.config.economy.baseCoffeePrices.multiplier,
            progression: this.config.progression.experience.basePerCustomer,
            playerLevel: this.dynamicData.playerLevel,
            successRate: this.dynamicData.successRate,
            satisfaction: this.dynamicData.averageSatisfaction,
            adjustmentsMade: this.dynamicData.adjustmentsMade
        };
    }
    
    /**
     * 手动调整平衡（开发调试用）
     */
    public manualAdjust(type: 'difficulty' | 'economy' | 'progression' | 'spooky', adjustment: number, reason: string) {
        const manualAdjustment: BalanceAdjustment = {
            type,
            adjustment,
            reason: `手动调整: ${reason}`,
            timestamp: Date.now()
        };
        
        this.applySingleAdjustment(manualAdjustment);
        this.adjustmentHistory.push(manualAdjustment);
    }
}

export const gameBalanceManager = new GameBalanceManager();