/**
 * 顾客服务系统
 * 处理顾客的完整服务流程，包括订单处理、满意度计算和微恐元素交互
 */

import { _decorator, Component, Node, Sprite, Label, ProgressBar, Button, Animation, tween, Vec3, Color } from 'cc';
import { economyManager, EconomyManager } from '../managers/EconomyManager';
import { coffeeProductionManager } from '../managers/CoffeeProductionManager';
import { CustomerState } from './CustomerLogic';
import { coffeeRecipeManager, CoffeeRecipe } from './CoffeeRecipeManager';
const { ccclass, property } = _decorator;

/**
 * 顾客类型
 */
export enum CustomerType {
    NORMAL = 'normal',       // 普通顾客
    VIP = 'vip',             // VIP顾客
    SPOOKY = 'spooky',       // 微恐顾客
    SPECIAL = 'special',     // 特殊顾客（限时活动）
    GHOST = 'ghost',         // 幽灵顾客
    VAMPIRE = 'vampire'      // 吸血鬼顾客
}

/**
 * 顾客订单
 */
export interface CustomerOrder {
    customerId: string;
    coffeeId: string;           // 咖啡配方ID
    specialRequests?: string[]; // 特殊要求
    expectedQuality: number;    // 期望质量（0-100）
    waitPatience: number;       // 等待耐心（秒）
    baseReward: number;         // 基础奖励
    tipPotential: number;       // 小费潜力（0-3倍）
    orderTime: number;          // 下单时间
}

/**
 * 服务结果
 */
export interface ServiceResult {
    success: boolean;
    servedCoffeeId: string;
    qualityScore: number;      // 质量评分（0-100）
    serviceTime: number;       // 服务耗时（秒）
    baseReward: number;
    tipAmount: number;
    totalReward: number;
    customerSatisfaction: number; // 顾客满意度（0-100）
    specialEvents?: string[];    // 触发的特殊事件
}

/**
 * 顾客满意度数据
 */
export interface CustomerSatisfaction {
    customerId: string;
    orderId: string;
    satisfaction: number;      // 0-100
    qualityFeedback: string;   // 质量反馈
    tipAmount: number;
    revisitChance: number;     // 再次光临概率（0-100）
    feedbackTime: number;
}

@ccclass('CustomerServiceSystem')
export class CustomerServiceSystem extends Component {
    // UI组件
    @property(Node)
    private serviceQueueUI: Node | null = null;
    
    @property(Label)
    private queueCountLabel: Label | null = null;
    
    @property(ProgressBar)
    private overallSatisfactionBar: ProgressBar | null = null;
    
    @property(Node)
    private activeCustomerCard: Node | null = null;
    
    // 数据
    private activeOrders: Map<string, CustomerOrder> = new Map();
    private serviceHistory: ServiceResult[] = [];
    private customerSatisfactionHistory: CustomerSatisfaction[] = [];
    
    // 实时指标
    private totalCustomersServed: number = 0;
    private totalRevenue: number = 0;
    private totalTips: number = 0;
    private averageSatisfaction: number = 0;
    private currentQueueLength: number = 0;
    private maxQueueLength: number = 5; // 最大排队人数
    
    // 服务统计
    private serviceStats = {
        normalCustomers: 0,
        vipCustomers: 0,
        spookyCustomers: 0,
        perfectServices: 0,
        failedServices: 0,
        averageServiceTime: 0
    };
    
    onLoad() {
        this.initServiceSystem();
        this.loadServiceHistory();
    }
    
    /**
     * 初始化服务系统
     */
    private initServiceSystem() {
        console.log('🎭 顾客服务系统初始化');
        
        // 设置UI更新定时器
        this.schedule(this.updateServiceUI, 1.0);
    }
    
    /**
     * 加载服务历史
     */
    private loadServiceHistory() {
        // TODO: 从本地存储加载服务历史
        console.log('📊 服务历史加载完成');
    }
    
    /**
     * 顾客到达并下单
     */
    public customerArrives(customerData: {
        customerId: string;
        customerType: CustomerType;
        hasSpookyTrait?: boolean;
        vipLevel?: number;
    }): CustomerOrder | null {
        // 检查队列是否已满
        if (this.currentQueueLength >= this.maxQueueLength) {
            console.log('🚫 顾客排队已满，顾客离开');
            return null;
        }
        
        // 生成顾客订单
        const order = this.generateCustomerOrder(customerData);
        
        if (order) {
            this.activeOrders.set(order.customerId, order);
            this.currentQueueLength++;
            this.updateServiceUI();
            
            console.log(`👤 顾客 ${customerData.customerId} 到达，下单: ${order.coffeeId}`);
            return order;
        }
        
        return null;
    }
    
    /**
     * 生成顾客订单
     */
    private generateCustomerOrder(customerData: {
        customerId: string;
        customerType: CustomerType;
        hasSpookyTrait?: boolean;
        vipLevel?: number;
    }): CustomerOrder | null {
        const customerId = customerData.customerId;
        const customerType = customerData.customerType;
        
        // 获取可用的咖啡配方
        const unlockedRecipes = coffeeRecipeManager.getUnlockedRecipes();
        if (unlockedRecipes.length === 0) {
            console.warn('❌ 没有可用的咖啡配方');
            return null;
        }
        
        // 根据顾客类型选择咖啡
        let selectedRecipe: CoffeeRecipe;
        
        switch (customerType) {
            case CustomerType.VIP:
                // VIP顾客选择价格最高的配方
                selectedRecipe = unlockedRecipes.reduce((prev, current) => {
                    const prevPrice = coffeeRecipeManager.getRecipePrice(prev.id);
                    const currentPrice = coffeeRecipeManager.getRecipePrice(current.id);
                    return currentPrice > prevPrice ? current : prev;
                });
                break;
                
            case CustomerType.SPOOKY:
                // 微恐顾客选择微恐配方
                const spookyRecipes = coffeeRecipeManager.getSpookyRecipes();
                if (spookyRecipes.length > 0) {
                    selectedRecipe = spookyRecipes[Math.floor(Math.random() * spookyRecipes.length)];
                } else {
                    selectedRecipe = unlockedRecipes[Math.floor(Math.random() * unlockedRecipes.length)];
                }
                break;
                
            case CustomerType.GHOST:
                // 幽灵顾客只点微恐配方
                const ghostRecipes = coffeeRecipeManager.getSpookyRecipes().filter(r => 
                    r.spookyConfig?.spookyLevel === 1 || r.spookyConfig?.spookyLevel === 2
                );
                if (ghostRecipes.length > 0) {
                    selectedRecipe = ghostRecipes[Math.floor(Math.random() * ghostRecipes.length)];
                } else {
                    return null; // 没有幽灵配方，幽灵不点单
                }
                break;
                
            case CustomerType.VAMPIRE:
                // 吸血鬼顾客只点高级微恐配方
                const vampireRecipes = coffeeRecipeManager.getSpookyRecipes().filter(r => 
                    r.spookyConfig?.spookyLevel === 3 || r.spookyConfig?.spookyLevel === 4
                );
                if (vampireRecipes.length > 0) {
                    selectedRecipe = vampireRecipes[Math.floor(Math.random() * vampireRecipes.length)];
                } else {
                    return null;
                }
                break;
                
            default:
                // 普通顾客随机选择
                selectedRecipe = unlockedRecipes[Math.floor(Math.random() * unlockedRecipes.length)];
        }
        
        // 计算订单参数
        const baseReward = coffeeRecipeManager.getRecipePrice(selectedRecipe.id);
        const waitPatience = this.calculateWaitPatience(customerType, selectedRecipe.difficulty);
        const expectedQuality = this.calculateExpectedQuality(customerType);
        const tipPotential = this.calculateTipPotential(customerType, customerData.vipLevel);
        
        const order: CustomerOrder = {
            customerId,
            coffeeId: selectedRecipe.id,
            expectedQuality,
            waitPatience,
            baseReward,
            tipPotential,
            orderTime: Date.now()
        };
        
        // 添加特殊要求（30%概率）
        if (Math.random() < 0.3) {
            order.specialRequests = this.generateSpecialRequests(selectedRecipe, customerType);
        }
        
        return order;
    }
    
    /**
     * 计算等待耐心
     */
    private calculateWaitPatience(customerType: CustomerType, coffeeDifficulty: number): number {
        let basePatience = 180; // 3分钟基础耐心
        
        // 根据顾客类型调整
        switch (customerType) {
            case CustomerType.VIP:
                basePatience *= 0.7; // VIP更没耐心
                break;
            case CustomerType.SPECIAL:
                basePatience *= 1.2; // 特殊顾客更有耐心
                break;
            case CustomerType.GHOST:
                basePatience *= 2.0; // 幽灵很有耐心
                break;
        }
        
        // 根据咖啡难度调整
        basePatience *= (1 + coffeeDifficulty * 0.1);
        
        return Math.round(basePatience);
    }
    
    /**
     * 计算期望质量
     */
    private calculateExpectedQuality(customerType: CustomerType): number {
        switch (customerType) {
            case CustomerType.VIP:
                return 90; // VIP期望高质量
            case CustomerType.SPECIAL:
                return 85;
            case CustomerType.SPOOKY:
                return 80;
            case CustomerType.GHOST:
                return 70;
            case CustomerType.VAMPIRE:
                return 95; // 吸血鬼非常挑剔
            default:
                return 75;
        }
    }
    
    /**
     * 计算小费潜力
     */
    private calculateTipPotential(customerType: CustomerType, vipLevel?: number): number {
        let baseTip = 1.0;
        
        switch (customerType) {
            case CustomerType.VIP:
                baseTip = 2.0 + (vipLevel || 0) * 0.2;
                break;
            case CustomerType.SPECIAL:
                baseTip = 2.5;
                break;
            case CustomerType.SPOOKY:
                baseTip = 1.5;
                break;
            case CustomerType.GHOST:
                baseTip = 1.8;
                break;
            case CustomerType.VAMPIRE:
                baseTip = 3.0;
                break;
        }
        
        return Math.min(baseTip, 3.0); // 最大3倍
    }
    
    /**
     * 生成特殊要求
     */
    private generateSpecialRequests(recipe: CoffeeRecipe, customerType: CustomerType): string[] {
        const requests: string[] = [];
        
        // 通用特殊要求
        const generalRequests = [
            '多加点糖',
            '少加点冰',
            '奶泡多一点',
            '咖啡浓一点',
            '温度高一点'
        ];
        
        // 微恐特殊要求
        const spookyRequests = [
            '加一点幽灵粉末',
            '要能看到咒语',
            '血红色效果明显些',
            '要有神秘烟雾',
            '杯子要诡异一点'
        ];
        
        // 添加通用要求
        if (Math.random() < 0.5) {
            requests.push(generalRequests[Math.floor(Math.random() * generalRequests.length)]);
        }
        
        // 如果是微恐顾客或微恐配方，添加微恐要求
        if (recipe.spookyConfig?.isSpooky || customerType === CustomerType.SPOOKY) {
            if (Math.random() < 0.6) {
                requests.push(spookyRequests[Math.floor(Math.random() * spookyRequests.length)]);
            }
        }
        
        return requests;
    }
    
    /**
     * 提供咖啡服务
     */
    public serveCoffee(customerId: string, servedCoffeeId: string, qualityScore: number): ServiceResult {
        const order = this.activeOrders.get(customerId);
        if (!order) {
            console.error(`❌ 找不到顾客订单: ${customerId}`);
            return {
                success: false,
                servedCoffeeId,
                qualityScore,
                serviceTime: 0,
                baseReward: 0,
                tipAmount: 0,
                totalReward: 0,
                customerSatisfaction: 0
            };
        }
        
        // 检查是否是正确的咖啡
        const isCorrectCoffee = servedCoffeeId === order.coffeeId;
        if (!isCorrectCoffee) {
            console.log(`❌ 错误的咖啡: 期望 ${order.coffeeId}, 提供 ${servedCoffeeId}`);
            qualityScore *= 0.5; // 错误咖啡质量减半
        }
        
        // 计算服务时间
        const serviceTime = (Date.now() - order.orderTime) / 1000; // 转换为秒
        
        // 计算质量差异
        const qualityDifference = qualityScore - order.expectedQuality;
        
        // 计算小费（基于质量差异和服务时间）
        const tipMultiplier = this.calculateTipMultiplier(qualityDifference, serviceTime, order.waitPatience);
        const tipAmount = Math.round(order.baseReward * tipMultiplier * order.tipPotential);
        
        // 计算总奖励
        const totalReward = order.baseReward + tipAmount;
        
        // 计算顾客满意度
        const satisfaction = this.calculateSatisfaction(
            qualityScore,
            order.expectedQuality,
            serviceTime,
            order.waitPatience,
            tipMultiplier
        );
        
        // 记录服务结果
        const result: ServiceResult = {
            success: true,
            servedCoffeeId,
            qualityScore,
            serviceTime,
            baseReward: order.baseReward,
            tipAmount,
            totalReward,
            customerSatisfaction: satisfaction
        };
        
        // 检查特殊事件
        result.specialEvents = this.checkSpecialEvents(order, qualityScore, satisfaction);
        
        // 更新统计数据
        this.updateServiceStats(result, order, customerId);
        
        // 移除活跃订单
        this.activeOrders.delete(customerId);
        this.currentQueueLength--;
        
        // 添加到服务历史
        this.serviceHistory.push(result);
        
        // 更新经济系统
        economyManager.addGold(totalReward, `顾客服务 - ${customerId}`);
        this.totalRevenue += totalReward;
        this.totalTips += tipAmount;
        
        // 更新满意度历史
        const satisfactionData: CustomerSatisfaction = {
            customerId,
            orderId: order.coffeeId,
            satisfaction,
            qualityFeedback: this.getQualityFeedback(qualityScore),
            tipAmount,
            revisitChance: this.calculateRevisitChance(satisfaction),
            feedbackTime: Date.now()
        };
        
        this.customerSatisfactionHistory.push(satisfactionData);
        this.updateAverageSatisfaction();
        
        console.log(`✅ 服务完成: ${customerId}, 满意度: ${satisfaction}%, 收入: ${totalReward} (+${tipAmount}小费)`);
        
        // 保存历史
        this.saveServiceHistory();
        
        return result;
    }
    
    /**
     * 计算小费倍数
     */
    private calculateTipMultiplier(qualityDifference: number, serviceTime: number, waitPatience: number): number {
        let multiplier = 1.0;
        
        // 质量差异影响
        if (qualityDifference > 20) {
            multiplier += 0.5; // 远超期望
        } else if (qualityDifference > 10) {
            multiplier += 0.3;
        } else if (qualityDifference > 0) {
            multiplier += 0.1;
        } else if (qualityDifference < -20) {
            multiplier *= 0.5; // 远低于期望
        } else if (qualityDifference < -10) {
            multiplier *= 0.7;
        }
        
        // 服务时间影响
        const patienceRatio = serviceTime / waitPatience;
        if (patienceRatio < 0.3) {
            multiplier += 0.3; // 非常快
        } else if (patienceRatio < 0.7) {
            multiplier += 0.1; // 正常速度
        } else if (patienceRatio > 1.0) {
            multiplier *= 0.5; // 超时了
        }
        
        return Math.max(0.1, Math.min(multiplier, 2.0));
    }
    
    /**
     * 计算顾客满意度
     */
    private calculateSatisfaction(
        qualityScore: number,
        expectedQuality: number,
        serviceTime: number,
        waitPatience: number,
        tipMultiplier: number
    ): number {
        let satisfaction = 50; // 基础满意度
        
        // 质量影响（60%权重）
        const qualityRatio = qualityScore / expectedQuality;
        satisfaction += (qualityRatio - 1) * 60;
        
        // 时间影响（30%权重）
        const timeRatio = 1 - (serviceTime / waitPatience);
        satisfaction += timeRatio * 30;
        
        // 小费影响（10%权重）
        satisfaction += (tipMultiplier - 1) * 10;
        
        return Math.max(0, Math.min(satisfaction, 100));
    }
    
    /**
     * 计算再次光临概率
     */
    private calculateRevisitChance(satisfaction: number): number {
        let revisitChance = 30; // 基础概率
        
        if (satisfaction >= 90) {
            revisitChance = 80;
        } else if (satisfaction >= 80) {
            revisitChance = 65;
        } else if (satisfaction >= 70) {
            revisitChance = 50;
        } else if (satisfaction >= 60) {
            revisitChance = 40;
        } else if (satisfaction < 50) {
            revisitChance = 20;
        } else if (satisfaction < 30) {
            revisitChance = 10;
        }
        
        return revisitChance;
    }
    
    /**
     * 检查特殊事件
     */
    private checkSpecialEvents(order: CustomerOrder, qualityScore: number, satisfaction: number): string[] {
        const events: string[] = [];
        
        // 完美服务事件
        if (qualityScore >= 95 && satisfaction >= 95) {
            events.push('perfect_service');
        }
        
        // 微恐特殊事件
        const recipe = coffeeRecipeManager.getRecipeById(order.coffeeId);
        if (recipe?.spookyConfig?.isSpooky) {
            if (qualityScore >= 85) {
                events.push('spooky_magic_activated');
            }
            
            if (Math.random() < 0.2) {
                events.push('ghost_appeared');
            }
        }
        
        // VIP特殊事件
        if (order.tipPotential >= 2.5 && satisfaction >= 85) {
            events.push('vip_impressed');
        }
        
        return events;
    }
    
    /**
     * 获取质量反馈
     */
    private getQualityFeedback(qualityScore: number): string {
        if (qualityScore >= 95) return '完美！太棒了！';
        if (qualityScore >= 90) return '非常美味！';
        if (qualityScore >= 85) return '很好喝！';
        if (qualityScore >= 80) return '不错！';
        if (qualityScore >= 70) return '还可以。';
        if (qualityScore >= 60) return '一般般。';
        if (qualityScore >= 50) return '勉强可以接受。';
        return '这...不太好喝。';
    }
    
    /**
     * 更新服务统计
     */
    private updateServiceStats(result: ServiceResult, order: CustomerOrder, customerId: string) {
        this.totalCustomersServed++;
        
        // 统计服务时间
        const totalTime = this.serviceStats.averageServiceTime * (this.totalCustomersServed - 1) + result.serviceTime;
        this.serviceStats.averageServiceTime = totalTime / this.totalCustomersServed;
        
        // 统计服务质量
        if (result.qualityScore >= 95) {
            this.serviceStats.perfectServices++;
        } else if (result.qualityScore < 60) {
            this.serviceStats.failedServices++;
        }
    }
    
    /**
     * 更新平均满意度
     */
    private updateAverageSatisfaction() {
        if (this.customerSatisfactionHistory.length === 0) {
            this.averageSatisfaction = 0;
            return;
        }
        
        const totalSatisfaction = this.customerSatisfactionHistory.reduce(
            (sum, data) => sum + data.satisfaction, 0
        );
        
        this.averageSatisfaction = totalSatisfaction / this.customerSatisfactionHistory.length;
    }
    
    /**
     * 更新服务UI
     */
    private updateServiceUI() {
        if (!this.queueCountLabel || !this.overallSatisfactionBar) return;
        
        // 更新排队人数
        this.queueCountLabel.string = `排队: ${this.currentQueueLength}/${this.maxQueueLength}`;
        
        // 更新满意度条
        this.overallSatisfactionBar.progress = this.averageSatisfaction / 100;
        
        // 更新活跃顾客卡片
        this.updateActiveCustomerCard();
    }
    
    /**
     * 更新活跃顾客卡片
     */
    private updateActiveCustomerCard() {
        if (!this.activeCustomerCard || this.activeOrders.size === 0) {
            return;
        }
        
        // TODO: 实现活跃顾客卡片UI更新
    }
    
    /**
     * 获取服务统计
     */
    public getServiceStats() {
        return {
            totalCustomersServed: this.totalCustomersServed,
            totalRevenue: this.totalRevenue,
            totalTips: this.totalTips,
            averageSatisfaction: Math.round(this.averageSatisfaction),
            averageServiceTime: Math.round(this.serviceStats.averageServiceTime),
            perfectServices: this.serviceStats.perfectServices,
            failedServices: this.serviceStats.failedServices,
            successRate: this.totalCustomersServed > 0 
                ? Math.round((1 - this.serviceStats.failedServices / this.totalCustomersServed) * 100)
                : 0
        };
    }
    
    /**
     * 获取活跃订单
     */
    public getActiveOrders(): CustomerOrder[] {
        return Array.from(this.activeOrders.values());
    }
    
    /**
     * 获取订单剩余等待时间
     */
    public getOrderRemainingTime(customerId: string): number {
        const order = this.activeOrders.get(customerId);
        if (!order) return 0;
        
        const elapsedTime = (Date.now() - order.orderTime) / 1000;
        return Math.max(0, order.waitPatience - elapsedTime);
    }
    
    /**
     * 保存服务历史
     */
    private saveServiceHistory() {
        // TODO: 保存到本地存储
        console.log('💾 服务历史已保存');
    }
    
    /**
     * 顾客放弃等待（超时）
     */
    public customerLeaves(customerId: string): void {
        const order = this.activeOrders.get(customerId);
        if (order) {
            console.log(`😠 顾客 ${customerId} 放弃等待离开`);
            
            // 记录失败服务
            this.serviceStats.failedServices++;
            
            // 移除订单
            this.activeOrders.delete(customerId);
            this.currentQueueLength--;
            
            this.updateServiceUI();
        }
    }
}

export const customerServiceSystem = new CustomerServiceSystem();