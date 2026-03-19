/**
 * 经济管理器 - 管理游戏内货币和经济系统
 * 与变现系统紧密集成
 */

import { EventTarget } from 'cc';

export enum CurrencyType {
    /** 金币 */
    COINS = 'coins',
    /** 钻石 */
    DIAMONDS = 'diamonds',
    /** 声望 */
    REPUTATION = 'reputation'
}

export interface Transaction {
    id: string;
    type: string;
    amount: number;
    currency: CurrencyType;
    timestamp: number;
    description?: string;
    data?: any;
}

export class EconomyManager extends EventTarget {
    private static _instance: EconomyManager;
    
    private _coins: number = 100; // 初始金币
    private _diamonds: number = 0;
    private _reputation: number = 0;
    private _transactions: Transaction[] = [];
    private _incomeMultiplier: number = 1.0;
    private _doubleEarningsActive: boolean = false;
    private _doubleEarningsEndTime: number = 0;

    public static get instance(): EconomyManager {
        if (!EconomyManager._instance) {
            EconomyManager._instance = new EconomyManager();
        }
        return EconomyManager._instance;
    }

    private constructor() {
        super();
        this.loadFromStorage();
    }

    /**
     * 初始化经济系统
     */
    public init(): void {
        console.log('经济系统初始化');
        this.loadFromStorage();
    }

    /**
     * 获取金币数量
     */
    public get coins(): number {
        return this._coins;
    }

    /**
     * 获取钻石数量
     */
    public get diamonds(): number {
        return this._diamonds;
    }

    /**
     * 获取声望
     */
    public get reputation(): number {
        return this._reputation;
    }

    /**
     * 获取收入倍数
     */
    public get incomeMultiplier(): number {
        let multiplier = this._incomeMultiplier;
        
        // 双倍收益加成
        if (this._doubleEarningsActive && Date.now() < this._doubleEarningsEndTime) {
            multiplier *= 2;
        }
        
        return multiplier;
    }

    /**
     * 添加金币
     */
    public addCoins(amount: number, source: string = 'unknown', data?: any): boolean {
        if (amount <= 0) return false;

        const finalAmount = Math.floor(amount * this.incomeMultiplier);
        this._coins += finalAmount;
        
        this.recordTransaction({
            id: `coin_${Date.now()}`,
            type: 'add_coins',
            amount: finalAmount,
            currency: CurrencyType.COINS,
            timestamp: Date.now(),
            description: `获得金币: ${source}`,
            data
        });

        this.saveToStorage();
        this.emit('coinsChanged', { coins: this._coins, amount: finalAmount, source });
        console.log(`获得金币: ${finalAmount} (来源: ${source})`);
        
        return true;
    }

    /**
     * 消耗金币
     */
    public spendCoins(amount: number, reason: string = 'unknown', data?: any): boolean {
        if (amount <= 0 || this._coins < amount) {
            return false;
        }

        this._coins -= amount;
        
        this.recordTransaction({
            id: `spend_${Date.now()}`,
            type: 'spend_coins',
            amount: -amount,
            currency: CurrencyType.COINS,
            timestamp: Date.now(),
            description: `消耗金币: ${reason}`,
            data
        });

        this.saveToStorage();
        this.emit('coinsChanged', { coins: this._coins, amount: -amount, reason });
        console.log(`消耗金币: ${amount} (原因: ${reason})`);
        
        return true;
    }

    /**
     * 添加钻石
     */
    public addDiamonds(amount: number, source: string = 'unknown', data?: any): boolean {
        if (amount <= 0) return false;

        this._diamonds += amount;
        
        this.recordTransaction({
            id: `diamond_${Date.now()}`,
            type: 'add_diamonds',
            amount,
            currency: CurrencyType.DIAMONDS,
            timestamp: Date.now(),
            description: `获得钻石: ${source}`,
            data
        });

        this.saveToStorage();
        this.emit('diamondsChanged', { diamonds: this._diamonds, amount, source });
        
        return true;
    }

    /**
     * 消耗钻石
     */
    public spendDiamonds(amount: number, reason: string = 'unknown', data?: any): boolean {
        if (amount <= 0 || this._diamonds < amount) {
            return false;
        }

        this._diamonds -= amount;
        
        this.recordTransaction({
            id: `spend_diamond_${Date.now()}`,
            type: 'spend_diamonds',
            amount: -amount,
            currency: CurrencyType.DIAMONDS,
            timestamp: Date.now(),
            description: `消耗钻石: ${reason}`,
            data
        });

        this.saveToStorage();
        this.emit('diamondsChanged', { diamonds: this._diamonds, amount: -amount, reason });
        
        return true;
    }

    /**
     * 添加声望
     */
    public addReputation(amount: number, source: string = 'unknown', data?: any): boolean {
        if (amount <= 0) return false;

        this._reputation += amount;
        
        this.recordTransaction({
            id: `rep_${Date.now()}`,
            type: 'add_reputation',
            amount,
            currency: CurrencyType.REPUTATION,
            timestamp: Date.now(),
            description: `获得声望: ${source}`,
            data
        });

        this.saveToStorage();
        this.emit('reputationChanged', { reputation: this._reputation, amount, source });
        
        return true;
    }

    /**
     * 激活双倍收益
     * @param durationMinutes 持续时间（分钟）
     */
    public activateDoubleEarnings(durationMinutes: number = 30): void {
        this._doubleEarningsActive = true;
        this._doubleEarningsEndTime = Date.now() + durationMinutes * 60 * 1000;
        
        console.log(`双倍收益激活，持续 ${durationMinutes} 分钟`);
        this.emit('doubleEarningsActivated', { 
            durationMinutes, 
            endTime: this._doubleEarningsEndTime 
        });

        // 设置定时器取消双倍收益
        setTimeout(() => {
            this._doubleEarningsActive = false;
            console.log('双倍收益结束');
            this.emit('doubleEarningsEnded');
        }, durationMinutes * 60 * 1000);
    }

    /**
     * 检查是否有双倍收益
     */
    public hasDoubleEarnings(): boolean {
        if (!this._doubleEarningsActive) return false;
        
        if (Date.now() >= this._doubleEarningsEndTime) {
            this._doubleEarningsActive = false;
            return false;
        }
        
        return true;
    }

    /**
     * 获取双倍收益剩余时间（秒）
     */
    public getDoubleEarningsRemaining(): number {
        if (!this.hasDoubleEarnings()) return 0;
        return Math.max(0, Math.floor((this._doubleEarningsEndTime - Date.now()) / 1000));
    }

    /**
     * 设置收入倍数（用于VIP、月卡等）
     */
    public setIncomeMultiplier(multiplier: number): void {
        this._incomeMultiplier = Math.max(0.1, multiplier);
        console.log(`收入倍数设置为: ${this._incomeMultiplier}`);
        this.emit('incomeMultiplierChanged', { multiplier: this._incomeMultiplier });
    }

    /**
     * 获取交易记录
     */
    public getTransactions(limit: number = 50): Transaction[] {
        return this._transactions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * 获取总收入统计
     */
    public getIncomeStats(): { today: number, week: number, total: number } {
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        
        let today = 0;
        let week = 0;
        let total = 0;
        
        this._transactions.forEach(tx => {
            if (tx.amount > 0 && tx.currency === CurrencyType.COINS) {
                total += tx.amount;
                
                if (tx.timestamp >= dayAgo) {
                    today += tx.amount;
                }
                
                if (tx.timestamp >= weekAgo) {
                    week += tx.amount;
                }
            }
        });
        
        return { today, week, total };
    }

    /**
     * 记录交易
     */
    private recordTransaction(transaction: Transaction): void {
        this._transactions.push(transaction);
        
        // 限制交易记录数量
        if (this._transactions.length > 1000) {
            this._transactions = this._transactions.slice(-500);
        }
    }

    /**
     * 从本地存储加载数据
     */
    private loadFromStorage(): void {
        try {
            const saved = localStorage.getItem('economy_data');
            if (saved) {
                const data = JSON.parse(saved);
                this._coins = data.coins || 100;
                this._diamonds = data.diamonds || 0;
                this._reputation = data.reputation || 0;
                this._incomeMultiplier = data.incomeMultiplier || 1.0;
                this._doubleEarningsActive = data.doubleEarningsActive || false;
                this._doubleEarningsEndTime = data.doubleEarningsEndTime || 0;
                this._transactions = data.transactions || [];
                
                // 检查双倍收益是否已过期
                if (this._doubleEarningsActive && Date.now() >= this._doubleEarningsEndTime) {
                    this._doubleEarningsActive = false;
                }
                
                console.log('经济数据加载完成');
            }
        } catch (error) {
            console.warn('加载经济数据失败:', error);
            this._coins = 100;
        }
    }

    /**
     * 保存到本地存储
     */
    private saveToStorage(): void {
        try {
            const data = {
                coins: this._coins,
                diamonds: this._diamonds,
                reputation: this._reputation,
                incomeMultiplier: this._incomeMultiplier,
                doubleEarningsActive: this._doubleEarningsActive,
                doubleEarningsEndTime: this._doubleEarningsEndTime,
                transactions: this._transactions.slice(-100) // 只保存最近的100条
            };
            
            localStorage.setItem('economy_data', JSON.stringify(data));
        } catch (error) {
            console.warn('保存经济数据失败:', error);
        }
    }

    /**
     * 重置经济数据（仅用于测试）
     */
    public reset(): void {
        this._coins = 100;
        this._diamonds = 0;
        this._reputation = 0;
        this._incomeMultiplier = 1.0;
        this._doubleEarningsActive = false;
        this._doubleEarningsEndTime = 0;
        this._transactions = [];
        
        localStorage.removeItem('economy_data');
        console.log('经济数据已重置');
    }
}

// 全局访问
export const economyManager = EconomyManager.instance;