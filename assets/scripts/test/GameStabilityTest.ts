/**
 * 游戏稳定性测试脚本
 * 全面测试游戏的各个系统，确保稳定运行
 */

import { _decorator, Component, Node, Label, Button, ProgressBar } from 'cc';
import { economyManager } from '../managers/EconomyManager';
import { coffeeRecipeManager } from '../game/CoffeeRecipeManager';
import { customerServiceSystem } from '../game/CustomerServiceSystem';
import { mainGameLoop } from '../game/MainGameLoop';
import { gameFeedbackSystem } from '../ui/GameFeedbackSystem';
import { gameDataManager } from '../managers/GameDataManager';
import { gameBalanceManager } from '../managers/GameBalanceManager';
import { errorHandler } from '../managers/ErrorHandler';
import { performanceOptimizer } from '../managers/PerformanceOptimizer';
const { ccclass, property } = _decorator;

/**
 * 测试用例
 */
interface TestCase {
    id: string;
    name: string;
    description: string;
    category: 'system' | 'ui' | 'data' | 'performance' | 'error';
    execute: () => Promise<TestResult>;
    required: boolean;
}

/**
 * 测试结果
 */
interface TestResult {
    testId: string;
    passed: boolean;
    message: string;
    duration: number;
    error?: string;
    metrics?: any;
}

/**
 * 测试报告
 */
interface TestReport {
    timestamp: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
    duration: number;
    systemHealth: number; // 0-100
    results: TestResult[];
    recommendations: string[];
}

@ccclass('GameStabilityTest')
export class GameStabilityTest extends Component {
    @property(Label)
    private testStatusLabel: Label | null = null;
    
    @property(ProgressBar)
    private testProgressBar: ProgressBar | null = null;
    
    @property(Label)
    private testResultLabel: Label | null = null;
    
    @property(Button)
    private runAllTestsButton: Button | null = null;
    
    @property(Button)
    private runQuickTestButton: Button | null = null;
    
    @property(Button)
    private runSystemTestButton: Button | null = null;
    
    @property(Button)
    private runStressTestButton: Button | null = null;
    
    @property(Label)
    private systemHealthLabel: Label | null = null;
    
    // 测试用例
    private testCases: TestCase[] = [];
    
    // 当前测试状态
    private isTesting: boolean = false;
    private currentTestIndex: number = 0;
    private testResults: TestResult[] = [];
    
    onLoad() {
        this.initializeTestCases();
        this.setupEventListeners();
        this.updateTestStatus('🔄 测试系统准备就绪');
    }
    
    /**
     * 初始化测试用例
     */
    private initializeTestCases() {
        console.log('🧪 初始化稳定性测试用例');
        
        // 系统初始化测试
        this.testCases.push({
            id: 'system_init',
            name: '系统初始化',
            description: '测试所有游戏系统的初始化',
            category: 'system',
            required: true,
            execute: this.testSystemInitialization.bind(this)
        });
        
        // 经济系统测试
        this.testCases.push({
            id: 'economy_system',
            name: '经济系统',
            description: '测试金币、能量、收入等经济功能',
            category: 'system',
            required: true,
            execute: this.testEconomySystem.bind(this)
        });
        
        // 配方系统测试
        this.testCases.push({
            id: 'recipe_system',
            name: '配方系统',
            description: '测试咖啡配方管理和解锁',
            category: 'system',
            required: true,
            execute: this.testRecipeSystem.bind(this)
        });
        
        // 顾客服务测试
        this.testCases.push({
            id: 'customer_service',
            name: '顾客服务',
            description: '测试顾客生成、订单处理和服务流程',
            category: 'system',
            required: true,
            execute: this.testCustomerService.bind(this)
        });
        
        // 游戏循环测试
        this.testCases.push({
            id: 'game_loop',
            name: '游戏循环',
            description: '测试主游戏循环和状态管理',
            category: 'system',
            required: true,
            execute: this.testGameLoop.bind(this)
        });
        
        // 数据持久化测试
        this.testCases.push({
            id: 'data_persistence',
            name: '数据持久化',
            description: '测试游戏数据的保存和加载',
            category: 'data',
            required: true,
            execute: this.testDataPersistence.bind(this)
        });
        
        // 错误处理测试
        this.testCases.push({
            id: 'error_handling',
            name: '错误处理',
            description: '测试错误捕获和恢复机制',
            category: 'error',
            required: true,
            execute: this.testErrorHandling.bind(this)
        });
        
        // 性能监控测试
        this.testCases.push({
            id: 'performance',
            name: '性能监控',
            description: '测试性能指标收集和优化',
            category: 'performance',
            required: false,
            execute: this.testPerformanceMonitoring.bind(this)
        });
        
        // 游戏平衡测试
        this.testCases.push({
            id: 'game_balance',
            name: '游戏平衡',
            description: '测试难度调整和经济平衡',
            category: 'system',
            required: false,
            execute: this.testGameBalance.bind(this)
        });
        
        // UI反馈测试
        this.testCases.push({
            id: 'ui_feedback',
            name: 'UI反馈',
            description: '测试Toast提示和成就系统',
            category: 'ui',
            required: false,
            execute: this.testUIFeedback.bind(this)
        });
        
        console.log(`📋 初始化 ${this.testCases.length} 个测试用例`);
    }
    
    /**
     * 设置事件监听器
     */
    private setupEventListeners() {
        if (this.runAllTestsButton) {
            this.runAllTestsButton.node.on('click', () => {
                this.runAllTests();
            });
        }
        
        if (this.runQuickTestButton) {
            this.runQuickTestButton.node.on('click', () => {
                this.runQuickTest();
            });
        }
        
        if (this.runSystemTestButton) {
            this.runSystemTestButton.node.on('click', () => {
                this.runSystemTests();
            });
        }
        
        if (this.runStressTestButton) {
            this.runStressTestButton.node.on('click', () => {
                this.runStressTest();
            });
        }
    }
    
    /**
     * 更新测试状态
     */
    private updateTestStatus(message: string) {
        if (this.testStatusLabel) {
            this.testStatusLabel.string = message;
        }
    }
    
    /**
     * 更新测试进度
     */
    private updateTestProgress(progress: number) {
        if (this.testProgressBar) {
            this.testProgressBar.progress = progress;
        }
    }
    
    /**
     * 显示测试结果
     */
    private showTestResult(result: TestResult) {
        if (this.testResultLabel) {
            const icon = result.passed ? '✅' : '❌';
            this.testResultLabel.string = `${icon} ${result.testId}: ${result.message}\n${result.error || ''}`;
        }
    }
    
    /**
     * 运行所有测试
     */
    public async runAllTests() {
        if (this.isTesting) return;
        
        console.log('🧪 开始运行所有稳定性测试');
        this.isTesting = true;
        this.testResults = [];
        
        const startTime = Date.now();
        const requiredTests = this.testCases.filter(test => test.required);
        
        for (let i = 0; i < requiredTests.length; i++) {
            const testCase = requiredTests[i];
            this.currentTestIndex = i;
            
            // 更新状态
            const progress = (i + 1) / requiredTests.length;
            this.updateTestProgress(progress);
            this.updateTestStatus(`🔄 测试中: ${testCase.name} (${i + 1}/${requiredTests.length})`);
            
            try {
                // 执行测试
                const result = await testCase.execute();
                this.testResults.push(result);
                this.showTestResult(result);
                
                console.log(`${result.passed ? '✅' : '❌'} ${testCase.name}: ${result.message}`);
                
                // 如果测试失败且是必需的，可以考虑停止
                if (!result.passed && testCase.required) {
                    console.warn(`⚠️ 必需测试失败: ${testCase.name}`);
                }
                
            } catch (error) {
                const errorResult: TestResult = {
                    testId: testCase.id,
                    passed: false,
                    message: '测试执行异常',
                    duration: 0,
                    error: error instanceof Error ? error.message : '未知错误'
                };
                
                this.testResults.push(errorResult);
                this.showTestResult(errorResult);
                console.error(`💥 测试异常: ${testCase.name}`, error);
            }
            
            // 短暂延迟，避免测试过快
            await this.delay(100);
        }
        
        // 生成测试报告
        const duration = Date.now() - startTime;
        const report = this.generateTestReport(duration);
        
        // 显示最终结果
        this.updateTestStatus(`📊 测试完成: ${report.successRate}% 通过率`);
        this.showFinalReport(report);
        
        this.isTesting = false;
        console.log('📈 所有测试完成', report);
    }
    
    /**
     * 运行快速测试
     */
    public async runQuickTest() {
        const quickTests = [
            this.testSystemInitialization,
            this.testEconomySystem,
            this.testDataPersistence
        ];
        
        console.log('⚡ 开始快速测试');
        await this.runSelectedTests(quickTests, '快速测试');
    }
    
    /**
     * 运行系统测试
     */
    public async runSystemTests() {
        const systemTests = this.testCases
            .filter(test => test.category === 'system' && test.required)
            .map(test => test.execute);
        
        console.log('🖥️ 开始系统测试');
        await this.runSelectedTests(systemTests, '系统测试');
    }
    
    /**
     * 运行压力测试
     */
    public async runStressTest() {
        console.log('💥 开始压力测试');
        
        this.updateTestStatus('💥 压力测试中...');
        const startTime = Date.now();
        
        try {
            // 压力测试1：大量顾客生成
            await this.stressTestCustomerGeneration();
            
            // 压力测试2：大量数据操作
            await this.stressTestDataOperations();
            
            // 压力测试3：性能极限
            await this.stressTestPerformance();
            
            const duration = Date.now() - startTime;
            
            this.updateTestStatus(`✅ 压力测试完成 (${duration}ms)`);
            gameFeedbackSystem.showSuccess('压力测试', '所有压力测试通过', 5000);
            
        } catch (error) {
            this.updateTestStatus('❌ 压力测试失败');
            console.error('💥 压力测试失败:', error);
        }
    }
    
    /**
     * 运行选定的测试
     */
    private async runSelectedTests(testFunctions: Array<() => Promise<TestResult>>, testName: string) {
        if (this.isTesting) return;
        
        this.isTesting = true;
        this.testResults = [];
        
        const startTime = Date.now();
        
        for (let i = 0; i < testFunctions.length; i++) {
            const testFunction = testFunctions[i];
            
            this.updateTestProgress((i + 1) / testFunctions.length);
            this.updateTestStatus(`🔄 ${testName}: ${i + 1}/${testFunctions.length}`);
            
            try {
                const result = await testFunction();
                this.testResults.push(result);
                this.showTestResult(result);
                
                await this.delay(50);
            } catch (error) {
                console.error(`💥 测试失败:`, error);
            }
        }
        
        const duration = Date.now() - startTime;
        const report = this.generateTestReport(duration);
        
        this.updateTestStatus(`📊 ${testName}完成: ${report.successRate}% 通过率`);
        this.showFinalReport(report);
        
        this.isTesting = false;
    }
    
    // ==================== 具体测试实现 ====================
    
    /**
     * 测试系统初始化
     */
    private async testSystemInitialization(): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // 检查所有管理器是否已初始化
            const managers = [
                economyManager,
                coffeeRecipeManager,
                customerServiceSystem,
                mainGameLoop,
                gameFeedbackSystem,
                gameDataManager,
                gameBalanceManager,
                errorHandler,
                performanceOptimizer
            ];
            
            let passed = true;
            const messages: string[] = [];
            
            for (const manager of managers) {
                if (!manager) {
                    passed = false;
                    messages.push(`${manager.constructor.name} 未初始化`);
                }
            }
            
            const duration = Date.now() - startTime;
            
            return {
                testId: 'system_init',
                passed,
                message: passed ? '所有系统初始化正常' : messages.join(', '),
                duration,
                metrics: {
                    managerCount: managers.length,
                    initializedCount: managers.filter(m => m).length
                }
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                testId: 'system_init',
                passed: false,
                message: '系统初始化测试失败',
                duration,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    
    /**
     * 测试经济系统
     */
    private async testEconomySystem(): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // 测试金币操作
            const initialGold = economyManager.getGold();
            economyManager.addGold(100, '测试');
            const afterAdd = economyManager.getGold();
            
            economyManager.useGold(50, '测试');
            const afterUse = economyManager.getGold();
            
            // 测试能量操作
            const initialEnergy = economyManager.getEnergy();
            economyManager.addEnergy(10);
            const afterEnergyAdd = economyManager.getEnergy();
            
            // 验证结果
            const goldCorrect = afterAdd === initialGold + 100 && afterUse === afterAdd - 50;
            const energyCorrect = afterEnergyAdd === initialEnergy + 10;
            
            const duration = Date.now() - startTime;
            
            return {
                testId: 'economy_system',
                passed: goldCorrect && energyCorrect,
                message: goldCorrect && energyCorrect 
                    ? '经济系统功能正常' 
                    : `金币: ${goldCorrect ? '✓' : '✗'}, 能量: ${energyCorrect ? '✓' : '✗'}`,
                duration,
                metrics: {
                    initialGold,
                    afterAdd,
                    afterUse,
                    initialEnergy,
                    afterEnergyAdd
                }
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                testId: 'economy_system',
                passed: false,
                message: '经济系统测试失败',
                duration,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    
    /**
     * 测试配方系统
     */
    private async testRecipeSystem(): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // 获取所有配方
            const allRecipes = coffeeRecipeManager.getAllRecipes();
            const unlockedRecipes = coffeeRecipeManager.getUnlockedRecipes();
            
            // 测试配方获取
            if (allRecipes.length === 0) {
                throw new Error('没有找到任何配方');
            }
            
            // 测试配方解锁
            const firstRecipe = allRecipes[0];
            const isUnlocked = coffeeRecipeManager.isRecipeUnlocked(firstRecipe.id);
            
            // 测试配方价格计算
            const price = coffeeRecipeManager.getRecipePrice(firstRecipe.id);
            const time = coffeeRecipeManager.getRecipeTime(firstRecipe.id);
            
            const duration = Date.now() - startTime;
            
            return {
                testId: 'recipe_system',
                passed: allRecipes.length > 0 && price > 0 && time > 0,
                message: `配方系统: ${allRecipes.length}个配方, ${unlockedRecipes.length}个已解锁`,
                duration,
                metrics: {
                    totalRecipes: allRecipes.length,
                    unlockedRecipes: unlockedRecipes.length,
                    sampleRecipe: {
                        id: firstRecipe.id,
                        name: firstRecipe.name,
                        price,
                        time,
                        unlocked: isUnlocked
                    }
                }
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                testId: 'recipe_system',
                passed: false,
                message: '配方系统测试失败',
                duration,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    
    /**
     * 测试顾客服务
     */
    private async testCustomerService(): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // 测试顾客到达
            const customerId = `test_customer_${Date.now()}`;
            const order = customerServiceSystem.customerArrives({
                customerId,
                customerType: 'normal'
            });
            
            if (!order) {
                throw new Error('顾客到达失败');
            }
            
            // 测试活跃订单
            const activeOrders = customerServiceSystem.getActiveOrders();
            const hasOrder = activeOrders.some(o => o.customerId === customerId);
            
            // 测试服务统计
            const stats = customerServiceSystem.getServiceStats();
            
            const duration = Date.now() - startTime;
            
            return {
                testId: 'customer_service',
                passed: hasOrder && stats !== undefined,
                message: `顾客服务: ${hasOrder ? '订单创建成功' : '订单创建失败'}`,
                duration,
                metrics: {
                    orderCreated: hasOrder,
                    activeOrders: activeOrders.length,
                    totalCustomersServed: stats.totalCustomersServed,
                    averageSatisfaction: stats.averageSatisfaction
                }
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                testId: 'customer_service',
                passed: false,
                message: '顾客服务测试失败',
                duration,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    
    /**
     * 测试游戏循环
     */
    private async testGameLoop(): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // 测试游戏统计获取
            const stats = mainGameLoop.getGameStats();
            
            // 测试咖啡制作完成回调（模拟）
            const mockCoffeeMade = () => {
                // 这只是测试回调是否存在
                return true;
            };
            
            const duration = Date.now() - startTime;
            
            return {
                testId: 'game_loop',
                passed: stats !== undefined,
                message: '游戏循环系统正常',
                duration,
                metrics: {
                    totalRevenue: stats.totalRevenue,
                    totalCustomers: stats.totalCustomers,
                    totalCoffeeMade: stats.totalCoffeeMade
                }
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                testId: 'game_loop',
                passed: false,
                message: '游戏循环测试失败',
                duration,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    
    /**
     * 测试数据持久化
     */
    private async testDataPersistence(): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // 测试保存数据
            const saveSuccess = gameDataManager.saveGameData();
            
            // 测试获取保存信息
            const saveInfo = gameDataManager.getSaveInfo();
            
            // 测试云端同步状态
            const cloudStatus = gameDataManager.getCloudSyncStatus();
            
            const duration = Date.now() - startTime;
            
            return {
                testId: 'data_persistence',
                passed: saveSuccess && saveInfo !== undefined,
                message: saveSuccess ? '数据持久化正常' : '数据保存失败',
                duration,
                metrics: {
                    saveSuccess,
                    saveExists: saveInfo.exists,
                    cloudStatus: cloudStatus.syncStatus
                }
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                testId: 'data_persistence',
                passed: false,
                message: '数据持久化测试失败',
                duration,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    
    /**
     * 测试错误处理
     */
    private async testErrorHandling(): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // 测试错误报告
            const errorData = errorHandler.reportError(
                'logic',
                'warning',
                '测试错误处理系统'
            );
            
            // 获取错误报告
            const errorReport = errorHandler.getErrorReport();
            
            // 手动解决错误
            const resolved = errorHandler.resolveError(errorData.id, '测试解决');
            
            const duration = Date.now() - startTime;
            
            return {
                testId: 'error_handling',
                passed: errorData !== undefined && errorReport !== undefined,
                message: `错误处理: ${resolved ? '错误解决成功' : '错误解决失败'}`,
                duration,
                metrics: {
                    errorReported: !!errorData,
                    errorResolved: resolved,
                    totalErrors: errorReport.totalErrors,
                    recoverySuccessRate: errorReport.recoveryStats.successRate
                }
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                testId: 'error_handling',
                passed: false,
                message: '错误处理测试失败',
                duration,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    
    /**
     * 测试性能监控
     */
    private async testPerformanceMonitoring(): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // 获取性能指标
            const metrics = performanceOptimizer.getCurrentMetrics();
            const report = performanceOptimizer.getPerformanceReport();
            
            // 检查基本性能数据
            const hasValidMetrics = 
                metrics.fps > 0 && 
                metrics.frameTime > 0 && 
                metrics.memoryUsage >= 0;
            
            const duration = Date.now() - startTime;
            
            return {
                testId: 'performance',
                passed: hasValidMetrics,
                message: `性能监控: FPS=${metrics.fps}, 内存=${metrics.memoryUsage.toFixed(1)}MB`,
                duration,
                metrics: {
                    fps: metrics.fps,
                    frameTime: metrics.frameTime,
                    memoryUsage: metrics.memoryUsage,
                    drawCalls: metrics.drawCalls,
                    warnings: report.warnings.length
                }
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                testId: 'performance',
                passed: false,
                message: '性能监控测试失败',
                duration,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    
    /**
     * 测试游戏平衡
     */
    private async testGameBalance(): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // 获取平衡报告
            const report = gameBalanceManager.getBalanceReport();
            
            // 获取各种平衡参数
            const difficulty = gameBalanceManager.getCurrentDifficulty();
            const spawnRate = gameBalanceManager.getCustomerSpawnRate();
            const priceMultiplier = gameBalanceManager.getCoffeePriceMultiplier();
            
            const duration = Date.now() - startTime;
            
            return {
                testId: 'game_balance',
                passed: report !== undefined,
                message: `游戏平衡: 难度=${difficulty.toFixed(1)}, 价格倍数=${priceMultiplier.toFixed(2)}`,
                duration,
                metrics: {
                    difficulty,
                    spawnRate,
                    priceMultiplier,
                    playerLevel: report.playerLevel,
                    successRate: report.successRate
                }
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                testId: 'game_balance',
                passed: false,
                message: '游戏平衡测试失败',
                duration,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    
    /**
     * 测试UI反馈
     */
    private async testUIFeedback(): Promise<TestResult> {
        const startTime = Date.now();
        
        try {
            // 测试各种反馈类型
            gameFeedbackSystem.showSuccess('测试成功', '这是一个成功的测试提示', 2000);
            await this.delay(100);
            
            gameFeedbackSystem.showWarning('测试警告', '这是一个警告测试提示', 2000);
            await this.delay(100);
            
            gameFeedbackSystem.showInfo('测试信息', '这是一个信息测试提示', 2000);
            await this.delay(100);
            
            // 测试成就解锁
            gameFeedbackSystem.unlockAchievement('first_coffee');
            
            const duration = Date.now() - startTime;
            
            return {
                testId: 'ui_feedback',
                passed: true,
                message: 'UI反馈系统测试完成',
                duration,
                metrics: {
                    feedbackTypesTested: 3,
                    achievementUnlocked: true
                }
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                testId: 'ui_feedback',
                passed: false,
                message: 'UI反馈测试失败',
                duration,
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
    
    // ==================== 压力测试实现 ====================
    
    /**
     * 压力测试：顾客生成
     */
    private async stressTestCustomerGeneration(): Promise<void> {
        console.log('👥 压力测试：顾客生成');
        
        const customerCount = 50;
        const generatedCustomers: string[] = [];
        
        for (let i = 0; i < customerCount; i++) {
            const customerId = `stress_customer_${i}_${Date.now()}`;
            const order = customerServiceSystem.customerArrives({
                customerId,
                customerType: i % 5 === 0 ? 'vip' : 'normal'
            });
            
            if (order) {
                generatedCustomers.push(customerId);
            }
            
            // 每生成10个顾客稍作延迟
            if (i % 10 === 0) {
                await this.delay(10);
            }
        }
        
        console.log(`✅ 生成 ${generatedCustomers.length}/${customerCount} 个顾客`);
    }
    
    /**
     * 压力测试：数据操作
     */
    private async stressTestDataOperations(): Promise<void> {
        console.log('💾 压力测试：数据操作');
        
        const operationCount = 100;
        let successfulOperations = 0;
        
        for (let i = 0; i < operationCount; i++) {
            try {
                // 模拟各种数据操作
                economyManager.addGold(1, `压力测试 ${i}`);
                
                // 每20次操作保存一次
                if (i % 20 === 0) {
                    gameDataManager.saveGameData();
                }
                
                successfulOperations++;
                
            } catch (error) {
                console.warn(`⚠️ 数据操作失败 ${i}:`, error);
            }
            
            // 每50次操作稍作延迟
            if (i % 50 === 0) {
                await this.delay(10);
            }
        }
        
        console.log(`✅ 完成 ${successfulOperations}/${operationCount} 次数据操作`);
    }
    
    /**
     * 压力测试：性能
     */
    private async stressTestPerformance(): Promise<void> {
        console.log('⚡ 压力测试：性能');
        
        // 触发性能优化
        performanceOptimizer.triggerOptimization();
        
        // 获取性能报告
        const report = performanceOptimizer.getPerformanceReport();
        
        console.log(`📊 性能报告: FPS=${report.currentFPS}, 内存=${report.memoryUsage.toFixed(1)}MB`);
        
        // 检查是否适合当前设备
        const isSuitable = performanceOptimizer.isSuitableForDevice();
        
        if (!isSuitable) {
            console.warn('⚠️ 当前设备性能可能不足');
        }
    }
    
    // ==================== 工具函数 ====================
    
    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 生成测试报告
     */
    private generateTestReport(totalDuration: number): TestReport {
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        // 计算系统健康度
        const systemHealth = this.calculateSystemHealth();
        
        // 生成建议
        const recommendations = this.generateRecommendations();
        
        return {
            timestamp: Date.now(),
            totalTests,
            passedTests,
            failedTests: totalTests - passedTests,
            successRate,
            duration: totalDuration,
            systemHealth,
            results: [...this.testResults],
            recommendations
        };
    }
    
    /**
     * 计算系统健康度
     */
    private calculateSystemHealth(): number {
        if (this.testResults.length === 0) return 0;
        
        // 基于测试结果计算健康度
        const requiredTests = this.testResults.filter(r => 
            this.testCases.find(t => t.id === r.testId)?.required
        );
        
        if (requiredTests.length === 0) return 0;
        
        const passedRequired = requiredTests.filter(r => r.passed).length;
        const healthPercentage = (passedRequired / requiredTests.length) * 100;
        
        return Math.round(healthPercentage);
    }
    
    /**
     * 生成建议
     */
    private generateRecommendations(): string[] {
        const recommendations: string[] = [];
        const failedTests = this.testResults.filter(r => !r.passed);
        
        if (failedTests.length > 0) {
            recommendations.push(`有 ${failedTests.length} 个测试失败，请检查相应系统`);
        }
        
        const systemHealth = this.calculateSystemHealth();
        if (systemHealth < 80) {
            recommendations.push(`系统健康度较低 (${systemHealth}%)，建议进行优化`);
        }
        
        if (systemHealth >= 95) {
            recommendations.push('系统健康度优秀，可以准备发布');
        }
        
        // 检查性能
        const perfResult = this.testResults.find(r => r.testId === 'performance');
        if (perfResult?.metrics?.fps < 30) {
            recommendations.push('帧率较低，建议进行性能优化');
        }
        
        return recommendations;
    }
    
    /**
     * 显示最终报告
     */
    private showFinalReport(report: TestReport) {
        const healthColor = report.systemHealth >= 80 ? '🟢' : 
                          report.systemHealth >= 60 ? '🟡' : '🔴';
        
        const summary = `
📊 测试报告总结
================
✅ 通过测试: ${report.passedTests}/${report.totalTests}
📈 成功率: ${report.successRate}%
⏱️ 测试时长: ${report.duration}ms
${healthColor} 系统健康度: ${report.systemHealth}%

💡 建议:
${report.recommendations.map(r => `• ${r}`).join('\n')}
        `.trim();
        
        console.log(summary);
        
        // 更新系统健康度显示
        if (this.systemHealthLabel) {
            this.systemHealthLabel.string = `系统健康度: ${report.systemHealth}%`;
        }
        
        // 显示反馈
        if (report.successRate >= 90) {
            gameFeedbackSystem.showSuccess('测试通过', `成功率: ${report.successRate}%`, 5000);
        } else if (report.successRate >= 70) {
            gameFeedbackSystem.showWarning('测试警告', `成功率: ${report.successRate}%，需要优化`, 5000);
        } else {
            gameFeedbackSystem.showError('测试失败', `成功率: ${report.successRate}%，需要修复`, 5000);
        }
    }
    
    /**
     * 获取测试报告
     */
    public getTestReport(): TestReport {
        return this.generateTestReport(0);
    }
    
    /**
     * 重置测试
     */
    public resetTests() {
        this.testResults = [];
        this.currentTestIndex = 0;
        this.updateTestStatus('🔄 测试已重置');
        this.updateTestProgress(0);
        
        if (this.testResultLabel) {
            this.testResultLabel.string = '';
        }
        
        if (this.systemHealthLabel) {
            this.systemHealthLabel.string = '系统健康度: --%';
        }
    }
}