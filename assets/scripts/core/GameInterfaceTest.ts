/**
 * 游戏接口测试
 * 测试GameInterface的连接功能
 */

import { gameInterface } from './GameInterface';
import { mainGameLoop, GameState } from '../game/MainGameLoop';
import { economyManager } from '../managers/EconomyManager';

/**
 * 游戏接口测试类
 */
export class GameInterfaceTest {
    private testResults: Map<string, boolean> = new Map();
    
    constructor() {
        console.log('🧪 游戏接口测试初始化');
    }
    
    /**
     * 运行所有测试
     */
    public runAllTests(): void {
        console.log('🔧 开始运行游戏接口测试');
        
        // 运行核心接口测试
        this.testSingletonPattern();
        this.testInterfaceInitialization();
        this.testGameStateConnection();
        this.testEconomySystemConnection();
        this.testCustomerSystemConnection();
        this.testCoffeeProductionConnection();
        
        // 显示测试结果
        this.displayTestResults();
    }
    
    /**
     * 测试单例模式
     */
    private testSingletonPattern(): void {
        console.log('🔍 测试单例模式...');
        
        const instance1 = gameInterface;
        const instance2 = gameInterface;
        
        const isSingleton = instance1 === instance2;
        this.testResults.set('单例模式', isSingleton);
        
        console.log(isSingleton ? '✅ 单例模式正确' : '❌ 单例模式错误');
    }
    
    /**
     * 测试接口初始化
     */
    private testInterfaceInitialization(): void {
        console.log('🔍 测试接口初始化...');
        
        // 模拟UI控制器
        const mockUIController = {
            updateGameState: () => {},
            updateGameTime: () => {},
            updateGameStats: () => {},
            updateMoneyDisplay: () => {},
            updateCustomerQueue: () => {},
            updateCoffeeMakingProgress: () => {},
            updateCustomerServed: () => {}
        };
        
        // 初始化接口
        gameInterface.initialize(mockUIController as any);
        
        const isReady = gameInterface.isReady();
        this.testResults.set('接口初始化', isReady);
        
        console.log(isReady ? '✅ 接口初始化正确' : '❌ 接口初始化错误');
    }
    
    /**
     * 测试游戏状态连接
     */
    private testGameStateConnection(): void {
        console.log('🔍 测试游戏状态连接...');
        
        let stateChangeDetected = false;
        
        // 模拟状态变化监听
        const originalOnGameStateChange = mainGameLoop.onGameStateChange;
        mainGameLoop.onGameStateChange = (callback: any) => {
            // 模拟状态变化回调
            setTimeout(() => {
                callback(GameState.PLAYING);
                stateChangeDetected = true;
            }, 10);
        };
        
        // 检查游戏状态摘要
        const statusSummary = gameInterface.getGameStatusSummary();
        const hasValidState = statusSummary.state !== undefined;
        
        // 恢复原始函数
        mainGameLoop.onGameStateChange = originalOnGameStateChange;
        
        this.testResults.set('游戏状态连接', stateChangeDetected && hasValidState);
        
        console.log(stateChangeDetected && hasValidState ? '✅ 游戏状态连接正确' : '❌ 游戏状态连接错误');
    }
    
    /**
     * 测试经济系统连接
     */
    private testEconomySystemConnection(): void {
        console.log('🔍 测试经济系统连接...');
        
        let moneyChangeDetected = false;
        
        // 模拟金钱变化监听
        const originalOnMoneyChanged = economyManager.onMoneyChanged;
        economyManager.onMoneyChanged = (callback: any) => {
            // 模拟金钱变化回调
            setTimeout(() => {
                callback(1000);
                moneyChangeDetected = true;
            }, 10);
        };
        
        // 检查经济数据
        const statusSummary = gameInterface.getGameStatusSummary();
        const hasMoneyData = typeof statusSummary.money === 'number';
        
        // 恢复原始函数
        economyManager.onMoneyChanged = originalOnMoneyChanged;
        
        this.testResults.set('经济系统连接', moneyChangeDetected && hasMoneyData);
        
        console.log(moneyChangeDetected && hasMoneyData ? '✅ 经济系统连接正确' : '❌ 经济系统连接错误');
    }
    
    /**
     * 测试顾客系统连接
     */
    private testCustomerSystemConnection(): void {
        console.log('🔍 测试顾客系统连接...');
        
        // 检查顾客数据
        const statusSummary = gameInterface.getGameStatusSummary();
        const hasCustomerData = typeof statusSummary.customers === 'number';
        
        this.testResults.set('顾客系统连接', hasCustomerData);
        
        console.log(hasCustomerData ? '✅ 顾客系统连接正确' : '❌ 顾客系统连接错误');
    }
    
    /**
     * 测试咖啡生产连接
     */
    private testCoffeeProductionConnection(): void {
        console.log('🔍 测试咖啡生产连接...');
        
        // 检查咖啡生产数据
        const statusSummary = gameInterface.getGameStatusSummary();
        const hasCoffeeData = typeof statusSummary.coffeeMade === 'number';
        
        this.testResults.set('咖啡生产连接', hasCoffeeData);
        
        console.log(hasCoffeeData ? '✅ 咖啡生产连接正确' : '❌ 咖啡生产连接错误');
    }
    
    /**
     * 显示测试结果
     */
    private displayTestResults(): void {
        console.log('\n📊 游戏接口测试结果:');
        console.log('='.repeat(50));
        
        let passed = 0;
        let failed = 0;
        
        this.testResults.forEach((result, testName) => {
            if (result) {
                console.log(`✅ ${testName}`);
                passed++;
            } else {
                console.log(`❌ ${testName}`);
                failed++;
            }
        });
        
        console.log('='.repeat(50));
        console.log(`📈 总计: ${passed} 通过, ${failed} 失败`);
        
        if (failed === 0) {
            console.log('🎉 所有测试通过！游戏接口系统正常工作');
        } else {
            console.log('⚠️ 有测试失败，需要检查游戏接口系统');
        }
    }
    
    /**
     * 测试游戏控制功能
     */
    public testGameControls(): void {
        console.log('🎮 测试游戏控制功能...');
        
        try {
            // 测试启动游戏
            gameInterface.startGame();
            console.log('✅ 游戏启动功能正常');
            
            // 测试暂停游戏
            gameInterface.pauseGame();
            console.log('✅ 游戏暂停功能正常');
            
            // 测试恢复游戏
            gameInterface.resumeGame();
            console.log('✅ 游戏恢复功能正常');
            
            // 测试重新开始游戏
            gameInterface.restartGame();
            console.log('✅ 游戏重启功能正常');
            
            console.log('🎉 所有游戏控制功能正常');
        } catch (error) {
            console.error('❌ 游戏控制功能测试失败:', error);
        }
    }
    
    /**
     * 测试游戏配置获取
     */
    public testGameConfig(): void {
        console.log('🔧 测试游戏配置获取...');
        
        try {
            const config = gameInterface.getGameConfig();
            
            if (config && typeof config === 'object') {
                console.log('✅ 游戏配置获取成功');
                console.log('📋 配置结构:');
                
                // 显示配置结构
                Object.keys(config).forEach(key => {
                    console.log(`   - ${key}: ${config[key] ? '已配置' : '未配置'}`);
                });
            } else {
                console.warn('⚠️ 游戏配置获取但结构异常');
            }
        } catch (error) {
            console.error('❌ 游戏配置获取失败:', error);
        }
    }
}

/**
 * 快速测试函数
 */
export function quickTestGameInterface(): void {
    console.log('🚀 快速测试游戏接口系统');
    
    const tester = new GameInterfaceTest();
    
    // 运行核心测试
    tester.runAllTests();
    
    // 运行附加测试
    tester.testGameControls();
    tester.testGameConfig();
    
    console.log('🎯 游戏接口快速测试完成');
}

// 如果是直接运行测试
if (typeof process !== 'undefined' && process.argv.includes('--test')) {
    quickTestGameInterface();
}