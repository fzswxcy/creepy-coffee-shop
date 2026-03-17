/**
 * 增强版经济管理器
 * 包含完整的经济系统、统计和变现集成
 */

import { EventTarget } from 'cc';

export enum CurrencyType {
    COINS = 'coins',      // 金币（游戏内货币）
    DIAMONDS = 'diamonds', // 钻石（高级货币）
    REPUTATION = 'reputation', // 声望
    ENERGY = 'energy'     // 能量
}

export interface Transaction {
    id: string;
    type: string;
    amount: number;
    currency: CurrencyType;
    timestamp: number;
    description?: string;
    source?: string; // 来源：coffee_sale, ad_reward, iap_purchase等
    data?: any;
}

export interface DailyStats {
    date: string; // YYYY-MM-DD格式
    income: number;
    expenses: number;
    netProfit: number;
    coffeeSold: number;
    customersServed: number;
    adViews: number;
    iapPurchases: number;
}

export class EconomyManagerEnhanced extends EventTarget {
    private static _instance: EconomyManagerEnhanced;
    
    // 货币数据
    private _coins: number = 200; // 初始金币（更多起步资金）
    private _diamonds: number = 10; // 初始钻石（少量高级货币）
    private _reputation: number = 0;
    private _energy: number = 100;
    
    // 统计信息
    private _totalEarned: number = 0;
    private _totalSpent: number = 0;
    private _totalCoffeeSold: number = 0;
    private _totalCustomersServed: number = 0;
    
    // 增强功能
    private _incomeMultiplier: number = 1.0;
    private _energyRechargeRate: number = 0.5; // 每秒恢复能量
    private _lastEnergyUpdate: number = Date.now();
    
    // 技能加成
    private _skills: Map<string, number> = new Map();
    private _upgrades: Map<string, number> = new Map();
    
    // 日统计
    private _dailyStats: DailyStats = this.createEmptyDailyStats();
    private _lastStatReset: number = Date.now();
    
    // 历史记录
    private _transactions: Transaction[] = [];
    private _dailyHistory: DailyStats[] = [];
    
    // 能量限制
    private readonly MAX_ENERGY: number = 100;
    private readonly ENERGY_RECHARGE_INTERVAL: number = 60000; // 1分钟恢复1点能量
    
    public static get instance(): EconomyManagerEnhanced {
        if (!EconomyManagerEnhanced._instance) {
            EconomyManagerEnhanced._instance = new EconomyManagerEnhanced();
        }
        return EconomyManagerEnhanced._instance;
    }
    
    private constructor() {
        super();
        this.loadFromStorage();
        this.initializeSkills();
        this.initializeUpgrades();
        this.startEnergyRecharge();
    }
    
    /**
     * 初始化技能系统
     */
    private initializeSkills(): void {
        // 咖啡制作技能
        this._skills.set('coffee_quality', 1.0); // 咖啡质量加成
        this._skills.set('brewing_speed', 1.0); // 冲泡速度加成
        this._skills.set('customer_service', 1.0); // 顾客服务加成
        this._skills.set('energy_efficiency', 1.0); // 能量效率加成
        
        // 微恐元素技能
        this._skills.set('spooky_brewing', 1.0); // 微恐冲泡加成
        this._skills.set('ghost_attraction', 1.0); // 幽灵吸引加成
    }
    
    /**
     * 初始化升级系统
     */
    private initializeUpgrades(): void {
        // 基础升级
        this._upgrades.set('coffee_machine_level', 1);
        this._upgrades.set('cash_register_level', 1);
        this._upgrades.set('shop_decor_level', 1);
        this._upgrades.set('energy_capacity_level', 1);
        
        // 微恐升级
        this._upgrades.set('spooky_decor_level', 0);
        this._upgrades.set('ghost_customer_attraction', 0);
    }
    
    /**
     * 创建空的日统计
     */
    private createEmptyDailyStats(): DailyStats {
        const today = new Date().toISOString().split('T')[0];
        
        return {
            date: today,
            income: 0,
            expenses: 0,
            netProfit: 0,
            coffeeSold: 0,
            customersServed: 0,
            adViews: 0,
            iapPurchases: 0
        };
    }
    
    /**
     * 开始能量恢复
     */
    private startEnergyRecharge(): void {
        // 每秒钟检查一次能量恢复
        setInterval(() => {
            this.updateEnergyRecharge();
        }, 1000);
    }
    
    /**
     * 更新能量恢复
     */
    private updateEnergyRecharge(): void {
        const now = Date.now();
        const timePassed = (now - this._lastEnergyUpdate) / 1000; // 转换为秒
        
        if (timePassed >= 1) {
            const energyGained = timePassed * this._energyRechargeRate;
            this.addEnergy(energyGained);
            this._lastEnergyUpdate = now;
        }
    }
    
    /**
     * 从存储加载数据
     */
    private loadFromStorage(): void {
        try {
            // TODO: 实现实际的存储加载
            // 暂时使用硬编码的初始值
        } catch (error) {
            console.warn('Failed to load economy data:', error);
        }
    }
    
    /**
     * 保存数据到存储
     */
    private saveToStorage(): void {
        try {
            // TODO: 实现实际的存储保存
            const data = {
                coins: this._coins,
                diamonds: this._diamonds,
                reputation: this._reputation,
                energy: this._energy,
                skills: Object.fromEntries(this._skills),
                upgrades: Object.fromEntries(this._upgrades),
                dailyStats: this._dailyStats,
                lastStatReset: this._lastStatReset
            };
            
            // 实际存储代码
            console.log('Saving economy data:', data);
        } catch (error) {
            console.warn('Failed to save economy data:', error);
        }
    }
    
    /**
     * 添加金币
     */
    public addCoins(amount: number, source: string = 'unknown', description?: string): number {
        if (amount <= 0) return this._coins;
        
        const multipliedAmount = Math.floor(amount * this._incomeMultiplier);
        const oldAmount = this._coins;
        this._coins += multipliedAmount;
        
        // 更新统计
        this._totalEarned += multipliedAmount;
        this._dailyStats.income += multipliedAmount;
        this._dailyStats.netProfit += multipliedAmount;
        
        // 记录交易
        this.recordTransaction({
            type: 'income',
            amount: multipliedAmount,
            currency: CurrencyType.COINS,
            source,
            description
        });
        
        // 触发事件
        this.emit('coins_changed', {
            oldAmount,
            newAmount: this._coins,
            difference: multipliedAmount,
            source,
            description
        });
        
        this.saveToStorage();
        return this._coins;
    }
    
    /**
     * 花费金币
     */
    public spendCoins(amount: number, source: string = 'unknown', description?: string): boolean {
        if (amount <= 0 || this._coins < amount) return false;
        
        const oldAmount = this._coins;
        this._coins -= amount;
        
        // 更新统计
        this._totalSpent += amount;
        this._dailyStats.expenses += amount;
        this._dailyStats.netProfit -= amount;
        
        // 记录交易
        this.recordTransaction({
            type: 'expense',
            amount: amount,
            currency: CurrencyType.COINS,
            source,
            description
        });
        
        // 触发事件
        this.emit('coins_changed', {
            oldAmount,
            newAmount: this._coins,
            difference: -amount,
            source,
            description
        });
        
        this.saveToStorage();
        return true;
    }
    
    /**
     * 添加钻石
     */
    public addDiamonds(amount: number, source: string = 'unknown', description?: string): number {
        if (amount <= 0) return this._diamonds;
        
        const oldAmount = this._diamonds;
        this._diamonds += amount;
        
        // 记录交易
        this.recordTransaction({
            type: 'income',
            amount: amount,
            currency: CurrencyType.DIAMONDS,
            source,
            description
        });
        
        // 触发事件
        this.emit('diamonds_changed', {
            oldAmount,
            newAmount: this._diamonds,
            difference: amount,
            source,
            description
        });
        
        this.saveToStorage();
        return this._diamonds;
    }
    
    /**
     * 花费钻石
     */
    public spendDiamonds(amount: number, source: string = 'unknown', description?: string): boolean {
        if (amount <= 0 || this._diamonds < amount) return false;
        
        const oldAmount = this._diamonds;
        this._diamonds -= amount;
        
        // 记录交易
        this.recordTransaction({
            type: 'expense',
            amount: amount,
            currency: CurrencyType.DIAMONDS,
            source,
            description
        });
        
        // 触发事件
        this.emit('diamonds_changed', {
            oldAmount,
            newAmount: this._diamonds,
            difference: -amount,
            source,
            description
        });
        
        this.saveToStorage();
        return true;
    }
    
    /**
     * 添加声望
     */
    public addReputation(amount: number, source: string = 'unknown', description?: string): number {
        if (amount <= 0) return this._reputation;
        
        const oldAmount = this._reputation;
        this._reputation += amount;
        
        // 记录交易
        this.recordTransaction({
            type: 'income',
            amount: amount,
            currency: CurrencyType.REPUTATION,
            source,
            description
        });
        
        // 触发事件
        this.emit('reputation_changed', {
            oldAmount,
            newAmount: this._reputation,
            difference: amount,
            source,
            description
        });
        
        this.saveToStorage();
        return this._reputation;
    }
    
    /**
     * 添加能量
     */
    public addEnergy(amount: number): number {
        if (amount <= 0) return this._energy;
        
        const oldAmount = this._energy;
        this._energy = Math.min(this._energy + amount, this.MAX_ENERGY);
        
        // 触发事件
        if (oldAmount !== this._energy) {
            this.emit('energy_changed', {
                oldAmount,
                newAmount: this._energy,
                difference: this._energy - oldAmount
            });
            
            this.saveToStorage();
        }
        
        return this._energy;
    }
    
    /**
     * 使用能量
     */
    public useEnergy(amount: number): boolean {
        if (amount <= 0 || this._energy < amount) return false;
        
        const oldAmount = this._energy;
        this._energy -= amount;
        
        // 触发事件
        this.emit('energy_changed', {
            oldAmount,
            newAmount: this._energy,
            difference: -amount
        });
        
        this.saveToStorage();
        return true;
    }
    
    /**
     * 记录咖啡销售
     */
    public recordCoffeeSale(amount: number, coffeeType: string, quality: number = 1.0): void {
        this._totalCoffeeSold++;
        this._dailyStats.coffeeSold++;
        
        // 应用质量加成
        const finalAmount = Math.floor(amount * quality);
        this.addCoins(finalAmount, 'coffee_sale', `${coffeeType} 销售`);
        
        // 应用技能加成
        const skillBonus = this._skills.get('coffee_quality') || 1.0;
        if (skillBonus > 1.0) {
            const bonusAmount = Math.floor(finalAmount * (skillBonus - 1.0));
            this.addCoins(bonusAmount, 'skill_bonus', '咖啡质量技能加成');
        }
    }
    
    /**
     * 记录顾客服务
     */
    public recordCustomerService(tipAmount: number, customerType: string): void {
        this._totalCustomersServed++;
        this._dailyStats.customersServed++;
        
        this.addCoins(tipAmount, 'customer_tip', `${customerType} 顾客小费`);
        
        // 如果是微恐顾客，增加额外奖励
        if (customerType.includes('ghost') || customerType.includes('vampire') || customerType.includes('zombie')) {
            const spookyBonus = Math.floor(tipAmount * 0.5);
            this.addCoins(spookyBonus, 'spooky_bonus', '微恐顾客额外奖励');
            
            // 增加声望
            this.addReputation(1, 'spooky_customer', '服务微恐顾客');
        }
    }
    
    /**
     * 记录广告观看
     */
    public recordAdView(rewardAmount: number, adType: string): void {
        this._dailyStats.adViews++;
        this.addCoins(rewardAmount, 'ad_reward', `${adType} 广告奖励`);
        
        // 广告后给予能量恢复
        this.addEnergy(30);
    }
    
    /**
     * 记录内购
     */
    public recordIAPPurchase(amount: number, productId: string): void {
        this._dailyStats.iapPurchases++;
        this.addCoins(amount, 'iap_purchase', `购买 ${productId}`);
    }
    
    /**
     * 记录交易
     */
    private recordTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): void {
        const fullTransaction: Transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...transaction
        };
        
        this._transactions.push(fullTransaction);
        
        // 保持最近1000条交易记录
        if (this._transactions.length > 1000) {
            this._transactions = this._transactions.slice(-1000);
        }
        
        // 触发事件
        this.emit('transaction_recorded', fullTransaction);
    }
    
    /**
     * 升级技能
     */
    public upgradeSkill(skillName: string, cost: number): boolean {
        if (!this._skills.has(skillName) || this._diamonds < cost) {
            return false;
        }
        
        if (!this.spendDiamonds(cost, 'skill_upgrade', `升级 ${skillName}`)) {
            return false;
        }
        
        const currentLevel = this._skills.get(skillName) || 1.0;
        const newLevel = currentLevel + 0.1; // 每次升级增加10%
        this._skills.set(skillName, newLevel);
        
        this.emit('skill_upgraded', {
            skillName,
            oldLevel: currentLevel,
            newLevel,
            cost
        });
        
        this.saveToStorage();
        return true;
    }
    
    /**
     * 购买升级
     */
    public purchaseUpgrade(upgradeName: string, cost: number): boolean {
        if (!this._upgrades.has(upgradeName) || this._coins < cost) {
            return false;
        }
        
        if (!this.spendCoins(cost, 'upgrade_purchase', `购买 ${upgradeName} 升级`)) {
            return false;
        }
        
        const currentLevel = this._upgrades.get(upgradeName) || 0;
        const newLevel = currentLevel + 1;
        this._upgrades.set(upgradeName, newLevel);
        
        // 应用升级效果
        this.applyUpgradeEffect(upgradeName, newLevel);
        
        this.emit('upgrade_purchased', {
            upgradeName,
            oldLevel: currentLevel,
            newLevel,
            cost
        });
        
        this.saveToStorage();
        return true;
    }
    
    /**
     * 应用升级效果
     */
    private applyUpgradeEffect(upgradeName: string, level: number): void {
        switch (upgradeName) {
            case 'coffee_machine_level':
                this._incomeMultiplier += 0.05 * level;
                break;
            case 'energy_capacity_level':
                this.MAX_ENERGY = 100 + (level * 20);
                break;
            case 'spooky_decor_level':
                // 增加微恐顾客出现概率
                const spookySkill = this._skills.get('ghost_attraction') || 1.0;
                this._skills.set('ghost_attraction', spookySkill + 0.1);
                break;
        }
    }
    
    /**
     * 重置日统计（每天调用）
     */
    public resetDailyStats(): void {
        // 保存前一天的数据
        if (this._dailyStats.income > 0 || this._dailyStats.expenses > 0) {
            this._dailyHistory.push({...this._dailyStats});
            
            // 保持最近30天的记录
            if (this._dailyHistory.length > 30) {
                this._dailyHistory = this._dailyHistory.slice(-30);
            }
        }
        
        // 创建新的日统计
        this._dailyStats = this.createEmptyDailyStats();
        this._lastStatReset = Date.now();
        
        this.emit('daily_stats_reset', this._dailyStats);
        this.saveToStorage();
    }
    
    // ============== 获取器方法 ==============
    
    public getCoins(): number {
        return this._coins;
    }
    
    public getDiamonds(): number {
        return this._diamonds;
    }
    
    public getReputation(): number {
        return this._reputation;
    }
    
    public getEnergy(): number {
        return this._energy;
    }
    
    public getMaxEnergy(): number {
        return this.MAX_ENERGY;
    }
    
    public getEnergyPercentage(): number {
        return (this._energy / this.MAX_ENERGY) * 100;
    }
    
    public getIncomeMultiplier(): number {
        return this._incomeMultiplier;
    }
    
    public getTotalEarned(): number {
        return this._totalEarned;
    }
    
    public getTotalSpent(): number {
        return this._totalSpent;
    }
    
    public getNetWorth(): number {
        return this._totalEarned - this._totalSpent;
    }
    
    public getTotalCoffeeSold(): number {
        return this._totalCoffeeSold;
    }
    
    public getTotalCustomersServed(): number {
        return this._totalCustomersServed;
    }
    
    public getDailyStats(): DailyStats {
        return {...this._dailyStats};
    }
    
    public getDailyHistory(): DailyStats[] {
        return [...this._dailyHistory];
    }
    
    public getRecentTransactions(limit: number = 10): Transaction[] {
        return this._transactions.slice(-limit).reverse();
    }
    
    public getSkillLevel(skillName: string): number {
        return this._skills.get(skillName) || 1.0;
    }
    
    public getUpgradeLevel(upgradeName: string): number {
        return this._upgrades.get(upgradeName) || 0;
    }
    
    public getAllSkills(): Map<string, number> {
        return new Map(this._skills);
    }
    
    public getAllUpgrades(): Map<string, number> {
        return new Map(this._upgrades);
    }
    
    /**
     * 获取经济状况摘要
     */
    public getEconomySummary(): {
        coins: number;
        diamonds: number;
        reputation: number;
        energy: number;
        maxEnergy: number;
        dailyIncome: number;
        dailyExpenses: number;
        netWorth: number;
        coffeeSoldToday: number;
        customersServedToday: number;
    } {
        return {
            coins: this._coins,
            diamonds: this._diamonds,
            reputation: this._reputation,
            energy: this._energy,
            maxEnergy: this.MAX_ENERGY,
            dailyIncome: this._dailyStats.income,
            dailyExpenses: this._dailyStats.expenses,
            netWorth: this.getNetWorth(),
            coffeeSoldToday: this._dailyStats.coffeeSold,
            customersServedToday: this._dailyStats.customersServed
        };
    }
}