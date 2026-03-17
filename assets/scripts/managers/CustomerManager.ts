/**
 * 顾客管理器 - 管理微恐风格顾客的生成、点单和服务
 */

import { EventTarget } from 'cc';
import { CoffeeType, coffeeProductionManager } from './CoffeeProductionManager';
import { economyManager } from './EconomyManager';
import { adManager } from './AdManager';

export enum CustomerType {
    /** 普通顾客 */
    NORMAL = 'normal',
    /** 恐怖顾客 */
    HORROR = 'horror',
    /** VIP顾客 */
    VIP = 'vip',
    /** 特殊事件顾客 */
    SPECIAL = 'special'
}

export enum CustomerMood {
    /** 满意 */
    HAPPY = 'happy',
    /** 一般 */
    NEUTRAL = 'neutral',
    /** 不耐烦 */
    IMPATIENT = 'impatient',
    /** 生气 */
    ANGRY = 'angry',
    /** 惊吓 */
    SCARED = 'scared'
}

export interface Customer {
    id: string;
    type: CustomerType;
    name: string;
    mood: CustomerMood;
    patience: number; // 耐心值（0-100）
    maxPatience: number;
    order: CustomerOrder | null;
    arrivalTime: number;
    waitStartTime: number;
    tableId?: string;
    appearance: {
        sprite: string;
        scale: number;
        tint?: string;
        specialEffect?: string;
    };
    specialTraits?: string[];
}

export interface CustomerOrder {
    coffeeType: CoffeeType;
    quantity: number;
    specialRequests?: string[];
    tipMultiplier: number; // 小费倍数
    horrorEffect?: boolean; // 是否需要恐怖效果
}

export interface ServiceResult {
    success: boolean;
    tip: number;
    reputationChange: number;
    specialEffect?: string;
}

export class CustomerManager extends EventTarget {
    private static _instance: CustomerManager;
    
    private _customers: Customer[] = [];
    private _maxCustomers: number = 5;
    private _spawnTimer: number = 0;
    private _spawnInterval: number = 30000; // 30秒生成一个顾客
    private _customerTemplates: Partial<Customer>[] = [];
    private _tables: Map<string, boolean> = new Map();
    private _totalServed: number = 0;
    private _horrorServed: number = 0;

    // 顾客模板（微恐风格）
    private readonly CUSTOMER_TEMPLATES: Partial<Customer>[] = [
        // 普通顾客
        {
            type: CustomerType.NORMAL,
            name: '上班族',
            maxPatience: 100,
            appearance: {
                sprite: 'customer_normal_1',
                scale: 1.0
            }
        },
        {
            type: CustomerType.NORMAL,
            name: '学生',
            maxPatience: 120,
            appearance: {
                sprite: 'customer_normal_2',
                scale: 0.9
            }
        },
        {
            type: CustomerType.NORMAL,
            name: '老人',
            maxPatience: 150,
            appearance: {
                sprite: 'customer_normal_3',
                scale: 1.1
            }
        },
        
        // 恐怖顾客
        {
            type: CustomerType.HORROR,
            name: '幽灵顾客',
            maxPatience: 80,
            appearance: {
                sprite: 'customer_horror_1',
                scale: 1.0,
                tint: '#8B0000',
                specialEffect: 'ghost'
            },
            specialTraits: ['喜欢恐怖咖啡', '会被惊吓']
        },
        {
            type: CustomerType.HORROR,
            name: '僵尸咖啡师',
            maxPatience: 60,
            appearance: {
                sprite: 'customer_horror_2',
                scale: 1.2,
                tint: '#228B22',
                specialEffect: 'zombie'
            },
            specialTraits: ['行动缓慢', '喜欢热咖啡']
        },
        {
            type: CustomerType.HORROR,
            name: '吸血鬼贵族',
            maxPatience: 200,
            appearance: {
                sprite: 'customer_horror_3',
                scale: 1.0,
                tint: '#4B0082',
                specialEffect: 'vampire'
            },
            specialTraits: ['只在夜晚出现', '给小费大方']
        },
        
        // VIP顾客
        {
            type: CustomerType.VIP,
            name: '咖啡评论家',
            maxPatience: 50,
            appearance: {
                sprite: 'customer_vip_1',
                scale: 1.0,
                tint: '#FFD700'
            },
            specialTraits: ['要求严格', '小费丰厚']
        },
        {
            type: CustomerType.VIP,
            name: '神秘富豪',
            maxPatience: 180,
            appearance: {
                sprite: 'customer_vip_2',
                scale: 1.1,
                tint: '#C0C0C0'
            },
            specialTraits: ['订单量大', '会额外奖励']
        }
    ];

    // 顾客订单配置
    private readonly ORDER_CONFIGS = {
        [CustomerType.NORMAL]: {
            coffeeTypes: [CoffeeType.AMERICANO, CoffeeType.LATTE],
            quantityRange: [1, 2],
            tipMultiplierRange: [1.0, 1.5],
            horrorEffectChance: 0
        },
        [CustomerType.HORROR]: {
            coffeeTypes: [CoffeeType.HORROR_COFFEE, CoffeeType.MOCHA, CoffeeType.CAPPUCCINO],
            quantityRange: [1, 1],
            tipMultiplierRange: [1.5, 3.0],
            horrorEffectChance: 0.8
        },
        [CustomerType.VIP]: {
            coffeeTypes: [CoffeeType.LATTE, CoffeeType.CAPPUCCINO, CoffeeType.MOCHA],
            quantityRange: [2, 3],
            tipMultiplierRange: [2.0, 4.0],
            horrorEffectChance: 0.3
        }
    };

    public static get instance(): CustomerManager {
        if (!CustomerManager._instance) {
            CustomerManager._instance = new CustomerManager();
        }
        return CustomerManager._instance;
    }

    private constructor() {
        super();
        this.loadFromStorage();
    }

    /**
     * 初始化顾客系统
     */
    public init(): void {
        console.log('顾客系统初始化');
        
        // 初始化桌子
        this.initTables();
        
        // 设置顾客模板
        this._customerTemplates = [...this.CUSTOMER_TEMPLATES];
        
        // 开始生成顾客
        this.startSpawning();
        
        // 开始更新循环
        this.startUpdateLoop();
    }

    /**
     * 初始化桌子
     */
    private initTables(): void {
        // 初始化5张桌子
        for (let i = 0; i < this._maxCustomers; i++) {
            this._tables.set(`table_${i}`, false); // false表示空闲
        }
    }

    /**
     * 开始生成顾客
     */
    private startSpawning(): void {
        this._spawnTimer = setInterval(() => {
            this.spawnCustomer();
        }, this._spawnInterval);
    }

    /**
     * 生成顾客
     */
    private spawnCustomer(): void {
        if (this._customers.length >= this._maxCustomers) {
            console.log('顾客已满，等待空位');
            return;
        }

        // 随机选择顾客模板
        const templateIndex = Math.floor(Math.random() * this._customerTemplates.length);
        const template = this._customerTemplates[templateIndex];
        
        // 找到空闲桌子
        const tableId = this.findAvailableTable();
        if (!tableId) {
            console.log('没有空闲桌子');
            return;
        }

        // 创建顾客
        const customer: Customer = {
            id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: template.type || CustomerType.NORMAL,
            name: template.name || '神秘顾客',
            mood: CustomerMood.HAPPY,
            patience: template.maxPatience || 100,
            maxPatience: template.maxPatience || 100,
            order: null,
            arrivalTime: Date.now(),
            waitStartTime: Date.now(),
            tableId,
            appearance: template.appearance || {
                sprite: 'customer_default',
                scale: 1.0
            },
            specialTraits: template.specialTraits || []
        };

        // 生成订单
        customer.order = this.generateOrder(customer.type);

        // 占用桌子
        this._tables.set(tableId, true);

        // 添加顾客
        this._customers.push(customer);

        console.log(`新顾客到达: ${customer.name} (${customer.type}), 订单: ${customer.order?.coffeeType} x${customer.order?.quantity}`);
        
        this.saveToStorage();
        this.emit('customerArrived', { customer });
    }

    /**
     * 生成订单
     */
    private generateOrder(customerType: CustomerType): CustomerOrder {
        const config = this.ORDER_CONFIGS[customerType];
        
        // 随机选择咖啡类型
        const coffeeTypes = config.coffeeTypes;
        const coffeeType = coffeeTypes[Math.floor(Math.random() * coffeeTypes.length)];
        
        // 随机数量
        const [minQty, maxQty] = config.quantityRange;
        const quantity = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
        
        // 随机小费倍数
        const [minTip, maxTip] = config.tipMultiplierRange;
        const tipMultiplier = minTip + Math.random() * (maxTip - minTip);
        
        // 是否需要恐怖效果
        const horrorEffect = Math.random() < config.horrorEffectChance;
        
        // 特殊要求
        const specialRequests: string[] = [];
        if (Math.random() < 0.3) {
            specialRequests.push('extra_sugar');
        }
        if (Math.random() < 0.2) {
            specialRequests.push('extra_hot');
        }
        
        return {
            coffeeType,
            quantity,
            specialRequests,
            tipMultiplier,
            horrorEffect
        };
    }

    /**
     * 查找空闲桌子
     */
    private findAvailableTable(): string | null {
        for (const [tableId, occupied] of this._tables) {
            if (!occupied) {
                return tableId;
            }
        }
        return null;
    }

    /**
     * 服务顾客
     */
    public serveCustomer(customerId: string, coffeeType: CoffeeType, quantity: number): ServiceResult {
        const customer = this._customers.find(c => c.id === customerId);
        if (!customer) {
            return {
                success: false,
                tip: 0,
                reputationChange: 0
            };
        }

        // 检查订单是否匹配
        if (!customer.order || 
            customer.order.coffeeType !== coffeeType || 
            customer.order.quantity !== quantity) {
            
            console.log('订单不匹配');
            customer.mood = CustomerMood.ANGRY;
            
            this.saveToStorage();
            this.emit('customerAngry', { customer });
            
            return {
                success: false,
                tip: 0,
                reputationChange: -5
            };
        }

        // 计算等待时间
        const waitTime = Date.now() - customer.waitStartTime;
        const patiencePercentage = customer.patience / customer.maxPatience;
        
        // 计算小费
        let tipMultiplier = customer.order.tipMultiplier;
        let reputationChange = 10;
        
        // 根据心情调整
        switch (customer.mood) {
            case CustomerMood.HAPPY:
                tipMultiplier *= 1.2;
                reputationChange += 5;
                break;
            case CustomerMood.IMPATIENT:
                tipMultiplier *= 0.8;
                reputationChange -= 3;
                break;
            case CustomerMood.ANGRY:
                tipMultiplier *= 0.5;
                reputationChange -= 10;
                break;
        }

        // 根据等待时间调整
        if (patiencePercentage < 0.3) {
            tipMultiplier *= 0.7;
        } else if (patiencePercentage > 0.8) {
            tipMultiplier *= 1.3;
        }

        // 计算基础价格
        const recipe = coffeeProductionManager.getRecipes().find(r => r.type === coffeeType);
        const basePrice = recipe ? recipe.price : 10;
        
        // 计算总金额和小费
        const totalAmount = basePrice * quantity;
        const tip = Math.floor(totalAmount * (tipMultiplier - 1));
        const totalEarnings = totalAmount + tip;

        // 发放金币
        economyManager.addCoins(totalEarnings, 'customer_service', {
            customerId,
            coffeeType,
            quantity,
            tip
        });

        // 发放声望
        economyManager.addReputation(reportceptionChange, 'good_service');

        // 更新统计
        this._totalServed++;
        if (customer.type === CustomerType.HORROR) {
            this._horrorServed++;
        }

        // 特殊效果
        let specialEffect: string | undefined;
        if (customer.order.horrorEffect) {
            specialEffect = this.applyHorrorEffect(customer);
        }

        // 顾客离开
        this.customerLeave(customerId);

        console.log(`服务顾客成功: ${customer.name}, 获得: ${totalEarnings}金币 (小费: ${tip}), 声望: +${reputationChange}`);
        
        this.saveToStorage();
        this.emit('customerServed', { 
            customer, 
            earnings: totalEarnings,
            tip,
            reputationChange,
            specialEffect
        });
        
        return {
            success: true,
            tip,
            reputationChange,
            specialEffect
        };
    }

    /**
     * 应用恐怖效果
     */
    private applyHorrorEffect(customer: Customer): string {
        const effects = [
            '顾客被惊吓，额外获得金币',
            '恐怖气氛蔓延，所有顾客小费增加',
            '获得恐怖纪念品',
            '解锁恐怖故事'
        ];
        
        const effect = effects[Math.floor(Math.random() * effects.length)];
        
        // 根据效果发放额外奖励
        switch (effect) {
            case '顾客被惊吓，额外获得金币':
                const extraCoins = Math.floor(50 + Math.random() * 100);
                economyManager.addCoins(extraCoins, 'horror_effect');
                break;
                
            case '恐怖气氛蔓延，所有顾客小费增加':
                // 暂时增加所有顾客的小费倍数
                this.emit('globalTipBonus', { multiplier: 1.5, duration: 300000 }); // 5分钟
                break;
        }
        
        return effect;
    }

    /**
     * 顾客离开
     */
    private customerLeave(customerId: string): void {
        const customer = this._customers.find(c => c.id === customerId);
        if (!customer) return;

        // 释放桌子
        if (customer.tableId) {
            this._tables.set(customer.tableId, false);
        }

        // 移除顾客
        this._customers = this._customers.filter(c => c.id !== customerId);
        
        this.saveToStorage();
        this.emit('customerLeft', { customer });
    }

    /**
     * 使用广告加速顾客服务
     */
    public async useAdToSatisfyCustomer(customerId: string): Promise<boolean> {
        const customer = this._customers.find(c => c.id === customerId);
        if (!customer) return false;

        // 显示激励视频广告
        const success = await adManager.showRewardedVideo(
            adManager.showRewardedVideo,
            { customerId }
        );
        
        if (success) {
            // 立即满足顾客
            customer.mood = CustomerMood.HAPPY;
            customer.patience = customer.maxPatience;
            
            console.log(`使用广告满足顾客: ${customer.name}`);
            
            this.saveToStorage();
            this.emit('customerSatisfiedByAd', { customer });
            
            return true;
        }
        
        return false;
    }

    /**
     * 开始更新循环
     */
    private startUpdateLoop(): void {
        setInterval(() => {
            this.updateCustomers();
        }, 1000); // 每秒更新一次
    }

    /**
     * 更新顾客状态
     */
    private updateCustomers(): void {
        const now = Date.now();
        let hasChanges = false;

        this._customers.forEach(customer => {
            if (customer.mood !== CustomerMood.ANGRY) {
                // 减少耐心值
                const waitTime = now - customer.waitStartTime;
                const patienceDecrease = waitTime / 1000; // 每秒减少1点耐心
                
                customer.patience = Math.max(0, customer.maxPatience - patienceDecrease);
                
                // 更新心情
                const patiencePercentage = customer.patience / customer.maxPatience;
                let newMood = CustomerMood.HAPPY;
                
                if (patiencePercentage < 0.3) {
                    newMood = CustomerMood.ANGRY;
                } else if (patiencePercentage < 0.6) {
                    newMood = CustomerMood.IMPATIENT;
                } else if (patiencePercentage < 0.8) {
                    newMood = CustomerMood.NEUTRAL;
                }
                
                if (customer.mood !== newMood) {
                    customer.mood = newMood;
                    hasChanges = true;
                    
                    this.emit('customerMoodChanged', { customer, oldMood: customer.mood, newMood });
                }
                
                // 检查是否生气离开
                if (customer.patience <= 0) {
                    this.customerLeave(customer.id);
                    hasChanges = true;
                    
                    console.log(`顾客生气离开: ${customer.name}`);
                    this.emit('customerAngryLeft', { customer });
                }
            }
        });

        if (hasChanges) {
            this.saveToStorage();
        }
    }

    /**
     * 获取所有顾客
     */
    public getCustomers(): Customer[] {
        return [...this._customers];
    }

    /**
     * 获取桌子状态
     */
    public getTableStatus(): { [key: string]: boolean } {
        const status: { [key: string]: boolean } = {};
        this._tables.forEach((occupied, tableId) => {
            status[tableId] = occupied;
        });
        return status;
    }

    /**
     * 获取服务统计
     */
    public getStats(): { totalServed: number, horrorServed: number, totalTips: number } {
        // 这里应该从经济管理器获取总小费
        // 暂时返回基本统计
        return {
            totalServed: this._totalServed,
            horrorServed: this._horrorServed,
            totalTips: 0 // TODO: 实现小费统计
        };
    }

    /**
     * 从本地存储加载数据
     */
    private loadFromStorage(): void {
        try {
            const saved = localStorage.getItem('customer_data');
            if (saved) {
                const data = JSON.parse(saved);
                this._totalServed = data.totalServed || 0;
                this._horrorServed = data.horrorServed || 0;
                console.log('顾客数据加载完成');
            }
        } catch (error) {
            console.warn('加载顾客数据失败:', error);
        }
    }

    /**
     * 保存到本地存储
     */
    private saveToStorage(): void {
        try {
            const data = {
                totalServed: this._totalServed,
                horrorServed: this._horrorServed
            };
            
            localStorage.setItem('customer_data', JSON.stringify(data));
        } catch (error) {
            console.warn('保存顾客数据失败:', error);
        }
    }
}

// 全局访问
export const customerManager = CustomerManager.instance;