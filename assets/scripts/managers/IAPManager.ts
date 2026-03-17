/**
 * 内购管理器 - 微信小游戏内购系统
 * 包括去广告包、装饰购买等变现功能
 */

import { EventTarget } from 'cc';

export enum IAPProductType {
    /** 去广告包 */
    NO_ADS = 'no_ads',
    /** 金币包 */
    COIN_PACK = 'coin_pack',
    /** 装饰物品 */
    DECORATION = 'decoration',
    /** 特殊配方 */
    SPECIAL_RECIPE = 'special_recipe',
    /** 月卡 */
    MONTHLY_CARD = 'monthly_card',
    /** 成长基金 */
    GROWTH_FUND = 'growth_fund'
}

export interface IAPProduct {
    id: string;
    type: IAPProductType;
    price: number; // 单位：分
    title: string;
    description: string;
    currency: string; // CNY, USD等
    consumable: boolean; // 是否可重复购买
    data?: any; // 附加数据
}

export interface PurchaseResult {
    success: boolean;
    productId: string;
    transactionId?: string;
    receipt?: string;
    error?: string;
}

export class IAPManager extends EventTarget {
    private static _instance: IAPManager;
    private _isInitialized = false;
    private _products: Map<string, IAPProduct> = new Map();
    private _purchasedProducts: Set<string> = new Set();
    private _noAdsPurchased = false;

    // 内购商品配置
    private readonly PRODUCTS_CONFIG: IAPProduct[] = [
        {
            id: 'no_ads_forever',
            type: IAPProductType.NO_ADS,
            price: 600, // 6元
            title: '永久去广告',
            description: '永久移除所有广告，获得更好的游戏体验',
            currency: 'CNY',
            consumable: false
        },
        {
            id: 'coin_pack_small',
            type: IAPProductType.COIN_PACK,
            price: 300, // 3元
            title: '小金币包',
            description: '获得500金币',
            currency: 'CNY',
            consumable: true
        },
        {
            id: 'coin_pack_medium',
            type: IAPProductType.COIN_PACK,
            price: 600, // 6元
            title: '中金币包',
            description: '获得1200金币',
            currency: 'CNY',
            consumable: true
        },
        {
            id: 'coin_pack_large',
            type: IAPProductType.COIN_PACK,
            price: 1200, // 12元
            title: '大金币包',
            description: '获得3000金币',
            currency: 'CNY',
            consumable: true
        },
        {
            id: 'decoration_coffee_machine_gold',
            type: IAPProductType.DECORATION,
            price: 1200, // 12元
            title: '金色咖啡机',
            description: '解锁金色咖啡机皮肤，提高10%生产效率',
            currency: 'CNY',
            consumable: false
        },
        {
            id: 'monthly_card',
            type: IAPProductType.MONTHLY_CARD,
            price: 2500, // 25元
            title: '月度特权卡',
            description: '30天内每日领取200金币，所有收益提升20%',
            currency: 'CNY',
            consumable: false
        },
        {
            id: 'growth_fund',
            type: IAPProductType.GROWTH_FUND,
            price: 3000, // 30元
            title: '成长基金',
            description: '根据等级提升获得丰厚金币回报',
            currency: 'CNY',
            consumable: false
        }
    ];

    public static get instance(): IAPManager {
        if (!IAPManager._instance) {
            IAPManager._instance = new IAPManager();
        }
        return IAPManager._instance;
    }

    private constructor() {
        super();
        this.loadPurchasedProducts();
    }

    /**
     * 初始化内购系统
     */
    public async init(): Promise<boolean> {
        if (this._isInitialized) return true;

        try {
            // 微信小游戏内购初始化
            if (typeof wx !== 'undefined' && wx.requestPayment) {
                console.log('微信支付组件初始化...');
                
                // 初始化商品信息
                this.PRODUCTS_CONFIG.forEach(product => {
                    this._products.set(product.id, product);
                });

                // 检查已购买的商品
                this.checkPurchases();

                this._isInitialized = true;
                console.log('内购系统初始化完成');
                return true;
            } else {
                console.warn('非微信环境或支付组件不可用，使用模拟内购');
                this._isInitialized = true;
                return true;
            }
        } catch (error) {
            console.error('内购系统初始化失败:', error);
            return false;
        }
    }

    /**
     * 获取所有商品
     */
    public getProducts(): IAPProduct[] {
        return Array.from(this._products.values());
    }

    /**
     * 获取商品信息
     */
    public getProduct(productId: string): IAPProduct | undefined {
        return this._products.get(productId);
    }

    /**
     * 购买商品
     */
    public async purchaseProduct(productId: string): Promise<PurchaseResult> {
        const product = this.getProduct(productId);
        if (!product) {
            return {
                success: false,
                productId,
                error: '商品不存在'
            };
        }

        // 检查是否已购买非消耗品
        if (!product.consumable && this._purchasedProducts.has(productId)) {
            return {
                success: false,
                productId,
                error: '已购买此商品'
            };
        }

        try {
            let result: PurchaseResult;
            
            if (typeof wx !== 'undefined') {
                // 微信支付
                result = await this.requestWXPayment(product);
            } else {
                // 模拟支付
                result = await this.mockPayment(product);
            }

            if (result.success) {
                // 处理购买成功
                await this.handlePurchaseSuccess(product, result);
            }

            return result;
        } catch (error) {
            console.error('购买商品失败:', error);
            return {
                success: false,
                productId,
                error: error instanceof Error ? error.message : '购买失败'
            };
        }
    }

    /**
     * 请求微信支付
     */
    private async requestWXPayment(product: IAPProduct): Promise<PurchaseResult> {
        return new Promise((resolve) => {
            // 这里需要后端生成预支付订单
            // 模拟实现
            setTimeout(() => {
                const success = Math.random() > 0.2; // 80%成功率
                
                if (success) {
                    resolve({
                        success: true,
                        productId: product.id,
                        transactionId: `WX${Date.now()}`,
                        receipt: '模拟收据'
                    });
                } else {
                    resolve({
                        success: false,
                        productId: product.id,
                        error: '支付失败'
                    });
                }
            }, 1000);
        });
    }

    /**
     * 模拟支付
     */
    private async mockPayment(product: IAPProduct): Promise<PurchaseResult> {
        console.log('模拟支付:', product.title, `${product.price / 100}元`);
        
        return new Promise((resolve) => {
            // 模拟支付流程
            setTimeout(() => {
                const success = Math.random() > 0.1; // 90%成功率
                
                if (success) {
                    resolve({
                        success: true,
                        productId: product.id,
                        transactionId: `MOCK${Date.now()}`,
                        receipt: '模拟收据'
                    });
                } else {
                    resolve({
                        success: false,
                        productId: product.id,
                        error: '模拟支付失败'
                    });
                }
            }, 800);
        });
    }

    /**
     * 处理购买成功
     */
    private async handlePurchaseSuccess(product: IAPProduct, result: PurchaseResult): Promise<void> {
        // 添加到已购买列表
        this._purchasedProducts.add(product.id);
        this.savePurchasedProducts();

        // 根据商品类型处理
        switch (product.type) {
            case IAPProductType.NO_ADS:
                this._noAdsPurchased = true;
                this.emit('noAdsPurchased', { productId: product.id });
                break;
                
            case IAPProductType.COIN_PACK:
                // 发放金币
                const coins = this.getCoinAmount(product.id);
                this.emit('coinsPurchased', { productId: product.id, amount: coins });
                break;
                
            case IAPProductType.DECORATION:
                this.emit('decorationPurchased', { productId: product.id, data: product.data });
                break;
                
            case IAPProductType.MONTHLY_CARD:
                this.emit('monthlyCardPurchased', { productId: product.id, days: 30 });
                break;
        }

        console.log(`购买成功: ${product.title}`);
        this.emit('purchaseSuccess', { product, result });
    }

    /**
     * 获取金币包的金币数量
     */
    private getCoinAmount(productId: string): number {
        switch (productId) {
            case 'coin_pack_small': return 500;
            case 'coin_pack_medium': return 1200;
            case 'coin_pack_large': return 3000;
            default: return 0;
        }
    }

    /**
     * 检查是否已购买去广告
     */
    public hasNoAds(): boolean {
        return this._noAdsPurchased || this._purchasedProducts.has('no_ads_forever');
    }

    /**
     * 检查是否已购买商品
     */
    public hasPurchased(productId: string): boolean {
        return this._purchasedProducts.has(productId);
    }

    /**
     * 恢复购买（主要用于非消耗品）
     */
    public async restorePurchases(): Promise<void> {
        try {
            // 从本地存储恢复已购买商品
            this.loadPurchasedProducts();
            
            // 这里可以调用微信接口验证购买状态
            console.log('恢复购买完成');
        } catch (error) {
            console.error('恢复购买失败:', error);
        }
    }

    /**
     * 加载已购买商品
     */
    private loadPurchasedProducts(): void {
        try {
            // 从本地存储加载
            const saved = localStorage.getItem('iap_purchased_products');
            if (saved) {
                const products = JSON.parse(saved);
                products.forEach((id: string) => {
                    this._purchasedProducts.add(id);
                    
                    // 检查去广告包
                    if (id === 'no_ads_forever') {
                        this._noAdsPurchased = true;
                    }
                });
            }
        } catch (error) {
            console.warn('加载已购买商品失败:', error);
        }
    }

    /**
     * 保存已购买商品
     */
    private savePurchasedProducts(): void {
        try {
            const products = Array.from(this._purchasedProducts);
            localStorage.setItem('iap_purchased_products', JSON.stringify(products));
        } catch (error) {
            console.warn('保存已购买商品失败:', error);
        }
    }

    /**
     * 检查购买状态（验证收据）
     */
    private async checkPurchases(): Promise<void> {
        // 这里可以调用后端API验证购买状态
        console.log('检查购买状态...');
    }
}

// 全局访问
export const iapManager = IAPManager.instance;