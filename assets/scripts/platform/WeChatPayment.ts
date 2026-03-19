/**
 * 微信支付系统
 * 处理微信小游戏内购支付功能
 */

import { _decorator, Component } from 'cc';
import { economyManager } from '../managers/EconomyManager';
import { gameFeedbackSystem } from '../ui/GameFeedbackSystem';
import { errorHandler, ErrorType, ErrorLevel } from '../managers/ErrorHandler';
import { weChatAdapter } from './WeChatAdapter';
const { ccclass, property } = _decorator;

/**
 * 支付商品类型
 */
export enum PaymentProductType {
    GOLD_PACK_SMALL = 'gold_pack_small',      // 小金币包
    GOLD_PACK_MEDIUM = 'gold_pack_medium',    // 中金币包
    GOLD_PACK_LARGE = 'gold_pack_large',      // 大金币包
    ENERGY_PACK = 'energy_pack',              // 能量包
    VIP_SUBSCRIPTION = 'vip_subscription',    // VIP订阅
    SPECIAL_RECIPE = 'special_recipe',        // 特殊配方
    REMOVE_ADS = 'remove_ads',                // 去广告
    STARTER_PACK = 'starter_pack'             // 新手礼包
}

/**
 * 支付商品配置
 */
export interface PaymentProduct {
    id: string;
    type: PaymentProductType;
    name: string;
    description: string;
    price: number;          // 价格（分）
    currency: string;       // 货币类型
    icon: string;
    
    // 商品内容
    goldAmount?: number;    // 金币数量
    energyAmount?: number;  // 能量数量
    vipDays?: number;       // VIP天数
    specialItems?: string[]; // 特殊物品
    
    // 显示配置
    displayOrder: number;   // 显示顺序
    highlight: boolean;     // 是否高亮推荐
    discount?: number;      // 折扣（0-1）
    limitPerDay?: number;   // 每日限购
}

/**
 * 支付状态
 */
export enum PaymentStatus {
    NOT_STARTED = 'not_started',    // 未开始
    PROCESSING = 'processing',      // 处理中
    SUCCESS = 'success',            // 支付成功
    FAILED = 'failed',              // 支付失败
    CANCELLED = 'cancelled',        // 用户取消
    REFUNDED = 'refunded'           // 已退款
}

/**
 * 支付结果
 */
export interface PaymentResult {
    transactionId: string;
    productId: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    timestamp: number;
    errorMessage?: string;
    receipt?: string;
}

/**
 * 支付统计
 */
export interface PaymentStatistics {
    totalTransactions: number;
    totalRevenue: number;        // 总收入（分）
    successfulTransactions: number;
    failedTransactions: number;
    popularProducts: Map<string, number>;
    dailyRevenue: number;
    lastTransactionTime: number;
}

@ccclass('WeChatPayment')
export class WeChatPayment extends Component {
    // 商品配置
    private products: Map<string, PaymentProduct> = new Map();
    
    // 支付状态
    private paymentStatus: Map<string, PaymentStatus> = new Map();
    
    // 统计信息
    private statistics: PaymentStatistics = {
        totalTransactions: 0,
        totalRevenue: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        popularProducts: new Map(),
        dailyRevenue: 0,
        lastTransactionTime: 0
    };
    
    // 每日购买记录
    private dailyPurchases: Map<string, number> = new Map();
    
    // 配置
    private config = {
        enabled: true,
        testMode: false,
        currency: 'CNY',
        maxRetries: 3,
        retryDelay: 1000
    };
    
    onLoad() {
        this.initializePaymentSystem();
    }
    
    /**
     * 初始化支付系统
     */
    private initializePaymentSystem() {
        console.log('💳 初始化微信支付系统');
        
        // 初始化商品配置
        this.initializeProducts();
        
        // 加载统计数据
        this.loadStatistics();
        
        // 检查每日重置
        this.checkDailyReset();
        
        // 初始化微信支付API
        this.initializeWeChatPayment();
        
        console.log('✅ 支付系统初始化完成');
    }
    
    /**
     * 初始化商品配置
     */
    private initializeProducts() {
        // 小金币包
        this.products.set('gold_small', {
            id: 'gold_small',
            type: PaymentProductType.GOLD_PACK_SMALL,
            name: '小金币包',
            description: '立即获得1000金币',
            price: 300, // 3元
            currency: 'CNY',
            icon: '💰',
            goldAmount: 1000,
            displayOrder: 1,
            highlight: false,
            limitPerDay: 5
        });
        
        // 中金币包
        this.products.set('gold_medium', {
            id: 'gold_medium',
            type: PaymentProductType.GOLD_PACK_MEDIUM,
            name: '中金币包',
            description: '立即获得5000金币',
            price: 1200, // 12元
            currency: 'CNY',
            icon: '💰💰',
            goldAmount: 5000,
            displayOrder: 2,
            highlight: true,
            discount: 0.8,
            limitPerDay: 3
        });
        
        // 大金币包
        this.products.set('gold_large', {
            id: 'gold_large',
            type: PaymentProductType.GOLD_PACK_LARGE,
            name: '大金币包',
            description: '立即获得15000金币',
            price: 3000, // 30元
            currency: 'CNY',
            icon: '💰💰💰',
            goldAmount: 15000,
            displayOrder: 3,
            highlight: true,
            discount: 0.7,
            limitPerDay: 2
        });
        
        // 能量包
        this.products.set('energy_pack', {
            id: 'energy_pack',
            type: PaymentProductType.ENERGY_PACK,
            name: '能量包',
            description: '立即恢复100点能量',
            price: 200, // 2元
            currency: 'CNY',
            icon: '⚡',
            energyAmount: 100,
            displayOrder: 4,
            highlight: false,
            limitPerDay: 10
        });
        
        // VIP订阅
        this.products.set('vip_7days', {
            id: 'vip_7days',
            type: PaymentProductType.VIP_SUBSCRIPTION,
            name: 'VIP周卡',
            description: '7天VIP特权，享受专属服务',
            price: 1500, // 15元
            currency: 'CNY',
            icon: '👑',
            vipDays: 7,
            displayOrder: 5,
            highlight: true,
            limitPerDay: 1
        });
        
        // 去广告
        this.products.set('remove_ads', {
            id: 'remove_ads',
            type: PaymentProductType.REMOVE_ADS,
            name: '去广告',
            description: '永久移除所有广告',
            price: 2500, // 25元
            currency: 'CNY',
            icon: '🚫',
            displayOrder: 6,
            highlight: true,
            discount: 0.6
        });
        
        // 新手礼包
        this.products.set('starter_pack', {
            id: 'starter_pack',
            type: PaymentProductType.STARTER_PACK,
            name: '新手礼包',
            description: '超值新手组合包',
            price: 500, // 5元
            currency: 'CNY',
            icon: '🎁',
            goldAmount: 2000,
            energyAmount: 50,
            displayOrder: 0,
            highlight: true,
            discount: 0.5,
            limitPerDay: 1
        });
        
        console.log(`🛒 初始化 ${this.products.size} 个支付商品`);
    }
    
    /**
     * 加载统计数据
     */
    private loadStatistics() {
        // TODO: 从本地存储加载支付统计
        console.log('📊 加载支付统计数据');
        
        // 重置今日统计
        this.resetDailyStats();
    }
    
    /**
     * 重置每日统计
     */
    private resetDailyStats() {
        const today = new Date().toDateString();
        
        if (this.statistics.lastTransactionTime > 0) {
            const lastDate = new Date(this.statistics.lastTransactionTime).toDateString();
            if (lastDate !== today) {
                this.dailyPurchases.clear();
                this.statistics.dailyRevenue = 0;
                console.log('🔄 重置每日购买统计');
            }
        }
    }
    
    /**
     * 检查每日重置
     */
    private checkDailyReset() {
        const today = new Date().toDateString();
        
        if (this.statistics.lastTransactionTime > 0) {
            const lastDate = new Date(this.statistics.lastTransactionTime).toDateString();
            if (lastDate !== today) {
                this.resetDailyStats();
            }
        }
    }
    
    /**
     * 初始化微信支付API
     */
    private initializeWeChatPayment() {
        // 检查是否在微信环境中
        const platformStatus = weChatAdapter.getPlatformStatus();
        
        if (!platformStatus.isWeChat) {
            console.log('⚠️ 非微信环境，支付功能使用模拟模式');
            this.config.testMode = true;
        }
        
        // 检查微信支付API是否可用
        if (typeof wx !== 'undefined' && wx.requestPayment) {
            console.log('✅ 微信支付API可用');
        } else {
            console.log('⚠️ 微信支付API不可用，使用模拟模式');
            this.config.testMode = true;
        }
    }
    
    // ==================== 公共API ====================
    
    /**
     * 发起支付
     */
    public async requestPayment(
        productId: string,
        quantity: number = 1
    ): Promise<PaymentResult> {
        console.log(`💳 发起支付请求: ${productId} x${quantity}`);
        
        // 检查支付功能是否启用
        if (!this.config.enabled) {
            const errorResult: PaymentResult = {
                transactionId: this.generateTransactionId(),
                productId,
                status: PaymentStatus.FAILED,
                amount: 0,
                currency: this.config.currency,
                timestamp: Date.now(),
                errorMessage: '支付功能已禁用'
            };
            
            return errorResult;
        }
        
        // 检查商品是否存在
        const product = this.products.get(productId);
        if (!product) {
            const errorResult: PaymentResult = {
                transactionId: this.generateTransactionId(),
                productId,
                status: PaymentStatus.FAILED,
                amount: 0,
                currency: this.config.currency,
                timestamp: Date.now(),
                errorMessage: '商品不存在'
            };
            
            return errorResult;
        }
        
        // 检查每日购买限制
        if (product.limitPerDay) {
            const todayPurchases = this.dailyPurchases.get(productId) || 0;
            if (todayPurchases + quantity > product.limitPerDay) {
                const errorResult: PaymentResult = {
                    transactionId: this.generateTransactionId(),
                    productId,
                    status: PaymentStatus.FAILED,
                    amount: 0,
                    currency: this.config.currency,
                    timestamp: Date.now(),
                    errorMessage: '今日购买已达上限'
                };
                
                return errorResult;
            }
        }
        
        // 生成交易ID
        const transactionId = this.generateTransactionId();
        
        // 记录支付开始
        this.paymentStatus.set(transactionId, PaymentStatus.PROCESSING);
        
        try {
            let paymentResult: PaymentResult;
            
            if (this.config.testMode) {
                // 模拟支付
                paymentResult = await this.simulatePayment(transactionId, product, quantity);
            } else {
                // 真实微信支付
                paymentResult = await this.weChatPayment(transactionId, product, quantity);
            }
            
            // 处理支付结果
            await this.processPaymentResult(paymentResult);
            
            return paymentResult;
            
        } catch (error) {
            console.error('❌ 支付过程异常:', error);
            
            const errorResult: PaymentResult = {
                transactionId,
                productId,
                status: PaymentStatus.FAILED,
                amount: product.price * quantity,
                currency: product.currency,
                timestamp: Date.now(),
                errorMessage: error instanceof Error ? error.message : '支付异常'
            };
            
            // 记录失败
            this.recordPaymentFailure(errorResult);
            
            return errorResult;
        }
    }
    
    /**
     * 模拟支付
     */
    private async simulatePayment(
        transactionId: string,
        product: PaymentProduct,
        quantity: number
    ): Promise<PaymentResult> {
        console.log('🎭 模拟支付模式');
        
        // 模拟支付处理时间
        await this.delay(1500);
        
        // 模拟80%成功率
        const success = Math.random() < 0.8;
        
        if (success) {
            const result: PaymentResult = {
                transactionId,
                productId: product.id,
                status: PaymentStatus.SUCCESS,
                amount: product.price * quantity,
                currency: product.currency,
                timestamp: Date.now(),
                receipt: `simulated_receipt_${transactionId}`
            };
            
            return result;
        } else {
            const result: PaymentResult = {
                transactionId,
                productId: product.id,
                status: PaymentStatus.FAILED,
                amount: product.price * quantity,
                currency: product.currency,
                timestamp: Date.now(),
                errorMessage: '模拟支付失败'
            };
            
            return result;
        }
    }
    
    /**
     * 微信支付
     */
    private async weChatPayment(
        transactionId: string,
        product: PaymentProduct,
        quantity: number
    ): Promise<PaymentResult> {
        const wx = (window as any).wx;
        if (!wx || !wx.requestPayment) {
            throw new Error('微信支付API不可用');
        }
        
        return new Promise((resolve, reject) => {
            // 这里需要从服务器获取支付参数
            // 实际项目中应该调用自己的服务器接口
            const paymentParams = {
                timeStamp: Date.now().toString(),
                nonceStr: this.generateNonceStr(),
                package: `prepay_id=test_prepay_id_${transactionId}`,
                signType: 'MD5' as const,
                paySign: 'test_sign'
            };
            
            wx.requestPayment({
                ...paymentParams,
                success: () => {
                    console.log('✅ 微信支付成功');
                    
                    const result: PaymentResult = {
                        transactionId,
                        productId: product.id,
                        status: PaymentStatus.SUCCESS,
                        amount: product.price * quantity,
                        currency: product.currency,
                        timestamp: Date.now(),
                        receipt: `wechat_receipt_${transactionId}`
                    };
                    
                    resolve(result);
                },
                fail: (err: any) => {
                    console.error('❌ 微信支付失败:', err);
                    
                    let status = PaymentStatus.FAILED;
                    if (err && err.errMsg === 'requestPayment:fail cancel') {
                        status = PaymentStatus.CANCELLED;
                    }
                    
                    const result: PaymentResult = {
                        transactionId,
                        productId: product.id,
                        status,
                        amount: product.price * quantity,
                        currency: product.currency,
                        timestamp: Date.now(),
                        errorMessage: err?.errMsg || '支付失败'
                    };
                    
                    resolve(result);
                }
            });
        });
    }
    
    /**
     * 处理支付结果
     */
    private async processPaymentResult(result: PaymentResult): Promise<void> {
        console.log(`🔄 处理支付结果: ${result.status}`);
        
        // 更新支付状态
        this.paymentStatus.set(result.transactionId, result.status);
        
        switch (result.status) {
            case PaymentStatus.SUCCESS:
                await this.processSuccessfulPayment(result);
                break;
                
            case PaymentStatus.FAILED:
                this.processFailedPayment(result);
                break;
                
            case PaymentStatus.CANCELLED:
                this.processCancelledPayment(result);
                break;
        }
        
        // 记录统计
        this.recordPaymentStatistics(result);
        
        // 保存统计数据
        this.saveStatistics();
    }
    
    /**
     * 处理成功支付
     */
    private async processSuccessfulPayment(result: PaymentResult): Promise<void> {
        console.log(`🎉 支付成功: ${result.transactionId}`);
        
        // 获取商品信息
        const product = this.products.get(result.productId);
        if (!product) {
            console.error(`❌ 商品不存在: ${result.productId}`);
            return;
        }
        
        // 发放商品
        await this.deliverProduct(product);
        
        // 显示成功提示
        gameFeedbackSystem.showSuccess(
            '支付成功',
            `感谢购买${product.name}`,
            5000
        );
        
        // 记录成功交易
        this.statistics.successfulTransactions++;
        this.statistics.totalRevenue += result.amount;
        this.statistics.dailyRevenue += result.amount;
        
        // 更新热门商品统计
        const currentCount = this.statistics.popularProducts.get(result.productId) || 0;
        this.statistics.popularProducts.set(result.productId, currentCount + 1);
        
        // 更新每日购买记录
        const todayPurchases = this.dailyPurchases.get(result.productId) || 0;
        this.dailyPurchases.set(result.productId, todayPurchases + 1);
        
        console.log(`📦 商品发放完成: ${product.name}`);
    }
    
    /**
     * 发放商品
     */
    private async deliverProduct(product: PaymentProduct): Promise<void> {
        console.log(`📦 发放商品: ${product.name}`);
        
        // 根据商品类型发放
        switch (product.type) {
            case PaymentProductType.GOLD_PACK_SMALL:
            case PaymentProductType.GOLD_PACK_MEDIUM:
            case PaymentProductType.GOLD_PACK_LARGE:
                if (product.goldAmount) {
                    economyManager.addGold(product.goldAmount, `购买${product.name}`);
                    console.log(`💰 发放金币: ${product.goldAmount}`);
                }
                break;
                
            case PaymentProductType.ENERGY_PACK:
                if (product.energyAmount) {
                    economyManager.addEnergy(product.energyAmount);
                    console.log(`⚡ 发放能量: ${product.energyAmount}`);
                }
                break;
                
            case PaymentProductType.VIP_SUBSCRIPTION:
                if (product.vipDays) {
                    this.activateVIPSubscription(product.vipDays);
                    console.log(`👑 激活VIP: ${product.vipDays}天`);
                }
                break;
                
            case PaymentProductType.REMOVE_ADS:
                this.removeAds();
                console.log('🚫 移除广告');
                break;
                
            case PaymentProductType.STARTER_PACK:
                if (product.goldAmount) {
                    economyManager.addGold(product.goldAmount, '新手礼包金币');
                }
                if (product.energyAmount) {
                    economyManager.addEnergy(product.energyAmount);
                }
                console.log('🎁 发放新手礼包');
                break;
        }
        
        // 显示商品发放提示
        gameFeedbackSystem.showSuccess(
            '商品已发放',
            product.description,
            4000
        );
    }
    
    /**
     * 激活VIP订阅
     */
    private activateVIPSubscription(days: number): void {
        console.log(`👑 激活VIP订阅 ${days}天`);
        
        // TODO: 实际激活VIP功能
        // 例如：设置VIP过期时间、激活VIP特权等
        
        gameFeedbackSystem.showSuccess(
            'VIP激活',
            `VIP特权已激活${days}天`,
            5000
        );
    }
    
    /**
     * 移除广告
     */
    private removeAds(): void {
        console.log('🚫 永久移除广告');
        
        // TODO: 实际移除广告功能
        // 例如：设置用户配置、关闭广告展示等
        
        gameFeedbackSystem.showSuccess(
            '广告已移除',
            '永久享受无广告体验',
            5000
        );
    }
    
    /**
     * 处理失败支付
     */
    private processFailedPayment(result: PaymentResult): void {
        console.log(`❌ 支付失败: ${result.errorMessage}`);
        
        // 显示失败提示
        gameFeedbackSystem.showError(
            '支付失败',
            result.errorMessage || '请稍后重试',
            5000
        );
        
        // 记录失败交易
        this.statistics.failedTransactions++;
    }
    
    /**
     * 处理取消支付
     */
    private processCancelledPayment(result: PaymentResult): void {
        console.log('⏹️ 用户取消支付');
        
        // 显示取消提示
        gameFeedbackSystem.showInfo(
            '支付取消',
            '支付已取消',
            3000
        );
    }
    
    /**
     * 记录支付统计
     */
    private recordPaymentStatistics(result: PaymentResult): void {
        this.statistics.totalTransactions++;
        this.statistics.lastTransactionTime = Date.now();
        
        console.log(`📊 支付统计更新: 总交易${this.statistics.totalTransactions}`);
    }
    
    /**
     * 记录支付失败
     */
    private recordPaymentFailure(result: PaymentResult): void {
        console.log(`📊 记录支付失败: ${result.errorMessage}`);
        this.statistics.failedTransactions++;
    }
    
    /**
     * 保存统计数据
     */
    private saveStatistics(): void {
        // TODO: 保存统计数据到本地存储
        console.log('💾 保存支付统计数据');
    }
    
    /**
     * 生成交易ID
     */
    private generateTransactionId(): string {
        return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 生成随机字符串
     */
    private generateNonceStr(): string {
        return Math.random().toString(36).substr(2, 15);
    }
    
    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ==================== 查询功能 ====================
    
    /**
     * 获取所有商品
     */
    public getAllProducts(): PaymentProduct[] {
        return Array.from(this.products.values())
            .sort((a, b) => a.displayOrder - b.displayOrder);
    }
    
    /**
     * 获取推荐商品
     */
    public getRecommendedProducts(): PaymentProduct[] {
        return this.getAllProducts()
            .filter(product => product.highlight)
            .slice(0, 3);
    }
    
    /**
     * 获取商品信息
     */
    public getProduct(productId: string): PaymentProduct | null {
        return this.products.get(productId) || null;
    }
    
    /**
     * 获取支付状态
     */
    public getPaymentStatus(transactionId: string): PaymentStatus {
        return this.paymentStatus.get(transactionId) || PaymentStatus.NOT_STARTED;
    }
    
    /**
     * 获取支付统计
     */
    public getPaymentStatistics(): PaymentStatistics {
        return { ...this.statistics };
    }
    
    /**
     * 获取每日购买记录
     */
    public getDailyPurchases(): Map<string, number> {
        return new Map(this.dailyPurchases);
    }
    
    /**
     * 检查商品是否可购买
     */
    public isProductAvailable(productId: string): boolean {
        const product = this.products.get(productId);
        if (!product) return false;
        
        // 检查每日限制
        if (product.limitPerDay) {
            const todayPurchases = this.dailyPurchases.get(productId) || 0;
            if (todayPurchases >= product.limitPerDay) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 获取商品剩余购买次数
     */
    public getProductRemainingPurchases(productId: string): number {
        const product = this.products.get(productId);
        if (!product || !product.limitPerDay) return Infinity;
        
        const todayPurchases = this.dailyPurchases.get(productId) || 0;
        return Math.max(0, product.limitPerDay - todayPurchases);
    }
    
    /**
     * 获取价格显示文本
     */
    public getPriceDisplay(price: number, currency: string = 'CNY'): string {
        // 转换为元显示
        const yuan = price / 100;
        
        switch (currency) {
            case 'CNY':
                return `¥${yuan.toFixed(2)}`;
            default:
                return `${yuan.toFixed(2)} ${currency}`;
        }
    }
    
    /**
     * 获取折扣价格
     */
    public getDiscountedPrice(product: PaymentProduct): number {
        if (product.discount && product.discount > 0 && product.discount < 1) {
            return Math.floor(product.price * product.discount);
        }
        return product.price;
    }
    
    /**
     * 测试支付系统
     */
    public async testPaymentSystem(): Promise<void> {
        console.log('🧪 测试微信支付系统');
        
        // 测试商品配置
        console.log('🛒 商品列表:', this.getAllProducts().map(p => p.name));
        
        // 测试推荐商品
        console.log('⭐ 推荐商品:', this.getRecommendedProducts().map(p => p.name));
        
        // 测试模拟支付
        console.log('💳 测试模拟支付...');
        const testProduct = this.products.get('gold_small');
        if (testProduct) {
            const result = await this.requestPayment(testProduct.id);
            console.log('📊 支付结果:', result);
        }
        
        // 测试统计
        console.log('📈 支付统计:', this.getPaymentStatistics());
        
        console.log('✅ 支付系统测试完成');
    }
    
    /**
     * 恢复购买（用于去广告等永久商品）
     */
    public async restorePurchases(): Promise<boolean> {
        console.log('🔄 恢复购买');
        
        // TODO: 实现恢复购买逻辑
        // 实际项目中应该从服务器验证用户的购买记录
        
        gameFeedbackSystem.showInfo('恢复购买', '正在验证购买记录...', 3000);
        
        // 模拟恢复过程
        await this.delay(2000);
        
        // 检查是否有永久商品（如去广告）
        // 这里简单模拟恢复一个商品
        const hasRemoveAds = Math.random() < 0.3; // 30%概率有去广告
        
        if (hasRemoveAds) {
            this.removeAds();
            gameFeedbackSystem.showSuccess('恢复成功', '已恢复去广告功能', 4000);
            return true;
        } else {
            gameFeedbackSystem.showInfo('无购买记录', '未找到可恢复的购买', 3000);
            return false;
        }
    }
}

export const weChatPayment = new WeChatPayment();