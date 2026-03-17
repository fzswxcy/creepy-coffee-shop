/**
 * 数据持久化测试脚本
 * 验证游戏数据的保存和加载功能
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { economyManager } from '../managers/EconomyManager';
import { gameDataManager } from '../managers/GameDataManager';
const { ccclass, property } = _decorator;

@ccclass('DataPersistenceTest')
export class DataPersistenceTest extends Component {
    @property(Label)
    private testResultLabel: Label | null = null;
    
    @property(Label)
    private saveInfoLabel: Label | null = null;
    
    @property(Button)
    private saveButton: Button | null = null;
    
    @property(Button)
    private loadButton: Button | null = null;
    
    @property(Button)
    private clearButton: Button | null = null;
    
    @property(Button)
    private testButton: Button | null = null;
    
    @property(Label)
    private goldLabel: Label | null = null;
    
    private testCount: number = 0;
    private successfulTests: number = 0;
    
    onLoad() {
        this.setupEventListeners();
        this.updateSaveInfo();
        this.updateGoldDisplay();
    }
    
    /**
     * 设置事件监听器
     */
    private setupEventListeners() {
        if (this.saveButton) {
            this.saveButton.node.on('click', () => {
                this.testSaveGame();
            });
        }
        
        if (this.loadButton) {
            this.loadButton.node.on('click', () => {
                this.testLoadGame();
            });
        }
        
        if (this.clearButton) {
            this.clearButton.node.on('click', () => {
                this.testClearData();
            });
        }
        
        if (this.testButton) {
            this.testButton.node.on('click', () => {
                this.runCompleteTest();
            });
        }
    }
    
    /**
     * 更新保存信息显示
     */
    private updateSaveInfo() {
        if (!this.saveInfoLabel) return;
        
        const saveInfo = gameDataManager.getSaveInfo();
        
        if (saveInfo.exists) {
            const saveTime = new Date(saveInfo.saveTime || 0).toLocaleString();
            this.saveInfoLabel.string = `💾 保存数据存在\n` +
                `版本: ${saveInfo.version}\n` +
                `保存时间: ${saveTime}\n` +
                `玩家ID: ${saveInfo.playerId?.substring(0, 8)}...\n` +
                `等级: ${saveInfo.level} | 金币: ${saveInfo.gold}`;
        } else {
            this.saveInfoLabel.string = '📭 无保存数据\n点击"保存游戏"开始';
        }
    }
    
    /**
     * 更新金币显示
     */
    private updateGoldDisplay() {
        if (this.goldLabel) {
            this.goldLabel.string = `当前金币: ${economyManager.getGold()}`;
        }
    }
    
    /**
     * 测试保存游戏
     */
    private async testSaveGame() {
        this.testCount++;
        this.updateTestResult('🔄 正在保存游戏数据...');
        
        // 修改一些游戏数据用于测试
        const currentGold = economyManager.getGold();
        const newGold = currentGold + 100;
        economyManager.setGold(newGold);
        
        // 执行保存
        const success = gameDataManager.saveGameData();
        
        if (success) {
            this.successfulTests++;
            this.updateTestResult('✅ 游戏保存成功!\n' +
                `金币变化: ${currentGold} → ${newGold}\n` +
                `将在3分钟后自动保存`);
            
            this.updateGoldDisplay();
            this.updateSaveInfo();
        } else {
            this.updateTestResult('❌ 游戏保存失败!\n请检查控制台错误信息');
        }
    }
    
    /**
     * 测试加载游戏
     */
    private async testLoadGame() {
        this.testCount++;
        this.updateTestResult('🔄 正在加载游戏数据...');
        
        // 先修改当前数据以验证加载是否生效
        const currentGold = economyManager.getGold();
        economyManager.setGold(currentGold + 500); // 临时修改
        
        // 执行加载
        const success = await gameDataManager.loadGameData();
        
        if (success) {
            this.successfulTests++;
            this.updateTestResult('✅ 游戏加载成功!\n' +
                `临时修改的金币已恢复`);
            
            this.updateGoldDisplay();
            this.updateSaveInfo();
        } else {
            this.updateTestResult('❌ 游戏加载失败!\n可能是第一次运行或数据损坏');
        }
    }
    
    /**
     * 测试清除数据
     */
    private testClearData() {
        this.testCount++;
        this.updateTestResult('⚠️ 正在清除所有游戏数据...');
        
        // 保存当前状态用于确认清除
        const beforeGold = economyManager.getGold();
        
        const success = gameDataManager.clearAllGameData();
        
        if (success) {
            this.successfulTests++;
            
            // 重新初始化经济系统
            economyManager.initialize(1000);
            
            this.updateTestResult('🗑️ 所有游戏数据已清除!\n' +
                `金币已重置: ${beforeGold} → 1000\n` +
                `请重新开始游戏`);
            
            this.updateGoldDisplay();
            this.updateSaveInfo();
        } else {
            this.updateTestResult('❌ 清除数据失败!\n请检查控制台错误信息');
        }
    }
    
    /**
     * 运行完整测试
     */
    private async runCompleteTest() {
        this.testCount = 0;
        this.successfulTests = 0;
        
        this.updateTestResult('🧪 开始完整数据持久化测试...\n' +
            '================================');
        
        // 测试1: 清除现有数据
        await this.delay(1000);
        this.updateTestResult(this.getTestResult() + '\n1. 清除现有数据...');
        gameDataManager.clearAllGameData();
        await this.delay(500);
        
        // 测试2: 创建新游戏
        this.updateTestResult(this.getTestResult() + '\n2. 创建新游戏...');
        const loadSuccess = await gameDataManager.loadGameData();
        if (loadSuccess) {
            this.successfulTests++;
        }
        await this.delay(500);
        
        // 测试3: 修改并保存数据
        this.updateTestResult(this.getTestResult() + '\n3. 修改并保存数据...');
        const originalGold = economyManager.getGold();
        economyManager.addGold(250, '测试奖励');
        const saveSuccess = gameDataManager.saveGameData();
        if (saveSuccess) {
            this.successfulTests++;
        }
        await this.delay(500);
        
        // 测试4: 再次修改数据
        this.updateTestResult(this.getTestResult() + '\n4. 再次修改数据...');
        economyManager.addGold(250, '第二次测试奖励');
        const midTestGold = economyManager.getGold();
        await this.delay(500);
        
        // 测试5: 加载数据验证恢复
        this.updateTestResult(this.getTestResult() + '\n5. 加载数据验证恢复...');
        const reloadSuccess = await gameDataManager.loadGameData();
        const finalGold = economyManager.getGold();
        
        if (reloadSuccess) {
            this.successfulTests++;
            
            // 验证金币是否正确恢复（应该是original+250，而不是midTestGold）
            if (finalGold === originalGold + 250) {
                this.successfulTests++;
                this.updateTestResult(this.getTestResult() + '\n✅ 数据恢复验证通过!');
            } else {
                this.updateTestResult(this.getTestResult() + 
                    `\n❌ 数据恢复验证失败!\n` +
                    `期望: ${originalGold + 250}, 实际: ${finalGold}`);
            }
        }
        
        // 测试6: 获取保存信息
        await this.delay(500);
        this.updateTestResult(this.getTestResult() + '\n6. 获取保存信息...');
        const saveInfo = gameDataManager.getSaveInfo();
        if (saveInfo.exists) {
            this.successfulTests++;
            this.updateTestResult(this.getTestResult() + 
                `\n✅ 保存信息获取成功\n` +
                `玩家: ${saveInfo.playerId?.substring(0, 8)}...`);
        }
        
        // 最终结果
        await this.delay(1000);
        const successRate = Math.round((this.successfulTests / this.testCount) * 100);
        
        this.updateTestResult('================================\n' +
            `📊 测试完成!\n` +
            `测试总数: ${this.testCount}\n` +
            `成功数: ${this.successfulTests}\n` +
            `成功率: ${successRate}%\n` +
            `================================\n` +
            (successRate >= 80 ? '🎉 数据持久化系统测试通过!' : 
             successRate >= 50 ? '⚠️ 数据持久化系统基本可用，建议优化' :
             '❌ 数据持久化系统需要修复'));
        
        this.updateGoldDisplay();
        this.updateSaveInfo();
    }
    
    /**
     * 更新测试结果
     */
    private updateTestResult(message: string) {
        if (this.testResultLabel) {
            this.testResultLabel.string = message;
        }
    }
    
    /**
     * 获取当前测试结果
     */
    private getTestResult(): string {
        return `测试进度: ${this.successfulTests}/${this.testCount}`;
    }
    
    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 导出测试数据
     */
    public exportTestData(): string {
        return gameDataManager.exportGameData();
    }
    
    /**
     * 导入测试数据
     */
    public importTestData(jsonData: string): boolean {
        return gameDataManager.importGameData(jsonData);
    }
}