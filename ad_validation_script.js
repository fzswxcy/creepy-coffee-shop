/**
 * 广告系统验证脚本
 * 用于自动分析和验证微信小游戏广告变现系统
 */

const fs = require('fs');
const path = require('path');

class AdValidation {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.issues = [];
        this.warnings = [];
        this.successes = [];
    }

    /**
     * 运行完整验证
     */
    async runFullValidation() {
        console.log('🔍 开始微信小游戏广告变现系统验证...\n');
        
        await this.validateAdConfig();
        await this.validateAdCodeStructure();
        await this.validateIntegrationPoints();
        await this.validateErrorHandling();
        await this.validatePerformance();
        
        this.generateReport();
    }

    /**
     * 验证广告配置
     */
    async validateAdConfig() {
        console.log('📋 验证广告配置...');
        
        // 检查广告单元ID
        const filesToCheck = [
            'assets/scripts/platform/WeChatPlatformAdapter.ts',
            'assets/scripts/managers/AdManager.ts'
        ];
        
        for (const file of filesToCheck) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 检查是否使用示例广告单元ID
                if (content.includes('adunit-example') || content.includes('adunit-rewarded-video-id')) {
                    this.issues.push({
                        type: '配置问题',
                        severity: '高',
                        location: file,
                        description: '使用示例广告单元ID，需要替换为真实ID',
                        suggestion: '从微信广告平台获取真实广告单元ID'
                    });
                }
                
                // 检查广告配置结构
                if (content.includes('AD_CONFIGS') || content.includes('adConfig')) {
                    this.successes.push({
                        category: '配置',
                        description: '广告配置结构存在'
                    });
                }
            }
        }
        
        // 检查配置文件
        const configFiles = fs.readdirSync(path.join(this.projectRoot, 'config'));
        const hasGameConfig = configFiles.some(file => file.includes('GameConfig'));
        
        if (hasGameConfig) {
            this.successes.push({
                category: '配置',
                description: '游戏配置文件存在'
            });
        } else {
            this.warnings.push({
                type: '配置问题',
                severity: '中',
                description: '缺少独立的游戏配置文件',
                suggestion: '创建GameConfig.ts集中管理所有游戏配置'
            });
        }
    }

    /**
     * 验证广告代码结构
     */
    async validateAdCodeStructure() {
        console.log('🏗️ 验证广告代码结构...');
        
        const requiredModules = [
            // 平台适配层
            { 
                file: 'assets/scripts/platform/WeChatPlatformAdapter.ts',
                description: '微信平台适配器',
                requiredMethods: ['showRewardedVideoAd', 'showInterstitialAd', 'createBannerAd']
            },
            // 广告管理层
            {
                file: 'assets/scripts/managers/AdManager.ts',
                description: '广告管理器',
                requiredMethods: ['init', 'showRewardedVideo', 'showInterstitialAd', 'preloadAds']
            },
            // 变现业务层
            {
                file: 'assets/scripts/platform/WeChatMonetization.ts',
                description: '微信变现系统',
                requiredMethods: ['showRewardedVideoAd', 'showInterstitialAd', 'onAdCompleted']
            },
            // 游戏集成层
            {
                file: 'assets/scripts/core/GameManager.ts',
                description: '游戏管理器',
                requiredMethods: ['initializeMonetization']
            }
        ];
        
        for (const module of requiredModules) {
            const filePath = path.join(this.projectRoot, module.file);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 检查模块完整性
                let missingMethods = [];
                for (const method of module.requiredMethods) {
                    if (!content.includes(method)) {
                        missingMethods.push(method);
                    }
                }
                
                if (missingMethods.length === 0) {
                    this.successes.push({
                        category: '代码结构',
                        description: `${module.description} 结构完整`
                    });
                } else {
                    this.warnings.push({
                        type: '代码结构问题',
                        severity: '中',
                        location: module.file,
                        description: `${module.description} 缺少方法: ${missingMethods.join(', ')}`,
                        suggestion: '补全缺失的广告相关方法'
                    });
                }
            } else {
                this.issues.push({
                    type: '文件缺失',
                    severity: '高',
                    location: module.file,
                    description: `${module.description} 文件不存在`,
                    suggestion: '创建对应的广告模块文件'
                });
            }
        }
        
        // 检查广告类型定义
        const adManagerPath = path.join(this.projectRoot, 'assets/scripts/managers/AdManager.ts');
        if (fs.existsSync(adManagerPath)) {
            const content = fs.readFileSync(adManagerPath, 'utf8');
            
            // 检查是否定义了广告类型枚举
            if (content.includes('enum AdType')) {
                this.successes.push({
                    category: '代码结构',
                    description: '广告类型枚举定义完整'
                });
            }
            
            // 检查是否定义了奖励类型枚举
            if (content.includes('enum AdRewardType')) {
                this.successes.push({
                    category: '代码结构',
                    description: '广告奖励类型枚举定义完整'
                });
            }
        }
    }

    /**
     * 验证集成点
     */
    async validateIntegrationPoints() {
        console.log('🔗 验证系统集成点...');
        
        // 检查与经济系统的集成
        const gameManagerPath = path.join(this.projectRoot, 'assets/scripts/core/GameManager.ts');
        if (fs.existsSync(gameManagerPath)) {
            const content = fs.readFileSync(gameManagerPath, 'utf8');
            
            // 检查是否集成了经济系统
            if (content.includes('economyManager')) {
                this.successes.push({
                    category: '集成',
                    description: '广告系统与经济系统集成'
                });
            }
            
            // 检查是否集成了内购系统
            if (content.includes('iapManager')) {
                this.successes.push({
                    category: '集成',
                    description: '广告系统与内购系统集成'
                });
            } else {
                this.warnings.push({
                    type: '集成问题',
                    severity: '中',
                    description: '广告系统未集成内购系统',
                    suggestion: '集成内购系统以实现去广告包等功能'
                });
            }
        }
        
        // 检查事件系统集成
        const wechatMonetizationPath = path.join(this.projectRoot, 'assets/scripts/platform/WeChatMonetization.ts');
        if (fs.existsSync(wechatMonetizationPath)) {
            const content = fs.readFileSync(wechatMonetizationPath, 'utf8');
            
            // 检查是否使用了事件系统
            if (content.includes('EventTarget') || content.includes('emit') || content.includes('on')) {
                this.successes.push({
                    category: '集成',
                    description: '广告系统使用事件驱动架构'
                });
            }
            
            // 检查奖励配置
            if (content.includes('rewardConfigs') && content.includes('AdRewardType')) {
                this.successes.push({
                    category: '集成',
                    description: '广告奖励配置完整'
                });
            }
        }
        
        // 检查UI集成
        const uiFiles = fs.readdirSync(path.join(this.projectRoot, 'assets/scripts/ui'));
        const hasAdButtons = uiFiles.some(file => {
            const content = fs.readFileSync(path.join(this.projectRoot, 'assets/scripts/ui', file), 'utf8');
            return content.includes('showRewardedVideo') || content.includes('AdManager');
        });
        
        if (hasAdButtons) {
            this.successes.push({
                category: '集成',
                description: '广告功能已集成到UI界面'
            });
        } else {
            this.warnings.push({
                type: '集成问题',
                severity: '中',
                description: '广告功能未在UI界面体现',
                suggestion: '在游戏UI中添加广告相关按钮和提示'
            });
        }
    }

    /**
     * 验证错误处理
     */
    async validateErrorHandling() {
        console.log('🛡️ 验证错误处理...');
        
        const adFiles = [
            'assets/scripts/platform/WeChatPlatformAdapter.ts',
            'assets/scripts/managers/AdManager.ts',
            'assets/scripts/platform/WeChatMonetization.ts'
        ];
        
        let hasErrorHandling = false;
        let hasFallback = false;
        
        for (const file of adFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 检查错误处理
                if (content.includes('catch') || content.includes('onError') || content.includes('try')) {
                    hasErrorHandling = true;
                }
                
                // 检查降级处理
                if (content.includes('showMockAd') || content.includes('模拟广告') || content.includes('fallback')) {
                    hasFallback = true;
                }
            }
        }
        
        if (hasErrorHandling) {
            this.successes.push({
                category: '错误处理',
                description: '广告系统包含错误处理机制'
            });
        } else {
            this.issues.push({
                type: '错误处理问题',
                severity: '高',
                description: '广告系统缺少错误处理机制',
                suggestion: '添加try-catch块和错误回调处理'
            });
        }
        
        if (hasFallback) {
            this.successes.push({
                category: '错误处理',
                description: '广告系统包含降级处理机制'
            });
        } else {
            this.warnings.push({
                type: '错误处理问题',
                severity: '中',
                description: '广告系统缺少降级处理机制',
                suggestion: '添加模拟广告作为失败降级方案'
            });
        }
        
        // 检查网络异常处理
        const wechatMonetizationPath = path.join(this.projectRoot, 'assets/scripts/platform/WeChatMonetization.ts');
        if (fs.existsSync(wechatMonetizationPath)) {
            const content = fs.readFileSync(wechatMonetizationPath, 'utf8');
            
            if (content.includes('网络异常') || content.includes('offline') || content.includes('network')) {
                this.successes.push({
                    category: '错误处理',
                    description: '考虑了网络异常情况'
                });
            }
        }
    }

    /**
     * 验证性能考虑
     */
    async validatePerformance() {
        console.log('⚡ 验证性能考虑...');
        
        const adManagerPath = path.join(this.projectRoot, 'assets/scripts/managers/AdManager.ts');
        if (fs.existsSync(adManagerPath)) {
            const content = fs.readFileSync(adManagerPath, 'utf8');
            
            // 检查预加载机制
            if (content.includes('preloadAds')) {
                this.successes.push({
                    category: '性能',
                    description: '广告系统支持预加载'
                });
            } else {
                this.warnings.push({
                    type: '性能问题',
                    severity: '低',
                    description: '广告系统缺少预加载机制',
                    suggestion: '添加广告预加载以减少用户等待时间'
                });
            }
            
            // 检查内存管理
            if (content.includes('destroy') || content.includes('cleanup')) {
                this.successes.push({
                    category: '性能',
                    description: '广告系统包含资源清理机制'
                });
            }
        }
        
        // 检查广告频率控制
        const wechatMonetizationPath = path.join(this.projectRoot, 'assets/scripts/platform/WeChatMonetization.ts');
        if (fs.existsSync(wechatMonetizationPath)) {
            const content = fs.readFileSync(wechatMonetizationPath, 'utf8');
            
            if (content.includes('showInterval') && content.includes('maxPerDay')) {
                this.successes.push({
                    category: '性能',
                    description: '广告系统包含频率控制机制'
                });
            }
            
            // 检查冷却时间管理
            if (content.includes('cooldown') || content.includes('冷却时间')) {
                this.successes.push({
                    category: '性能',
                    description: '广告系统包含冷却时间管理'
                });
            }
        }
    }

    /**
     * 生成验证报告
     */
    generateReport() {
        console.log('\n📊 验证报告生成...');
        console.log('='.repeat(50));
        
        // 统计信息
        console.log('\n📈 验证统计:');
        console.log(`✅ 成功项: ${this.successes.length}`);
        console.log(`⚠️ 警告项: ${this.warnings.length}`);
        console.log(`❌ 问题项: ${this.issues.length}`);
        
        // 成功项
        if (this.successes.length > 0) {
            console.log('\n✅ 成功项:');
            const groupedSuccesses = this.groupByCategory(this.successes);
            Object.keys(groupedSuccesses).forEach(category => {
                console.log(`  ${category}:`);
                groupedSuccesses[category].forEach(success => {
                    console.log(`    • ${success.description}`);
                });
            });
        }
        
        // 警告项
        if (this.warnings.length > 0) {
            console.log('\n⚠️ 警告项:');
            this.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. [${warning.severity}] ${warning.type}`);
                console.log(`     位置: ${warning.location || 'N/A'}`);
                console.log(`     描述: ${warning.description}`);
                console.log(`     建议: ${warning.suggestion}`);
                console.log('');
            });
        }
        
        // 问题项
        if (this.issues.length > 0) {
            console.log('\n❌ 问题项:');
            this.issues.forEach((issue, index) => {
                console.log(`  ${index + 1}. [${issue.severity}] ${issue.type}`);
                console.log(`     位置: ${issue.location || 'N/A'}`);
                console.log(`     描述: ${issue.description}`);
                console.log(`     建议: ${issue.suggestion}`);
                console.log('');
            });
        }
        
        // 总体评估
        console.log('='.repeat(50));
        console.log('\n🎯 总体评估:');
        
        if (this.issues.length === 0 && this.warnings.length === 0) {
            console.log('✅ 广告系统验证通过，可以上线');
        } else if (this.issues.length === 0 && this.warnings.length > 0) {
            console.log('🟡 广告系统基本可用，建议优化警告项后上线');
        } else if (this.issues.length > 0) {
            console.log('🔴 广告系统存在关键问题，需要修复后才能上线');
        }
        
        // 关键行动项
        console.log('\n🔧 关键行动项:');
        
        // 高优先级问题
        const highPriorityIssues = this.issues.filter(i => i.severity === '高');
        if (highPriorityIssues.length > 0) {
            console.log('  高优先级（立即解决）:');
            highPriorityIssues.forEach((issue, index) => {
                console.log(`    ${index + 1}. ${issue.description}`);
            });
        }
        
        // 中优先级警告
        const mediumPriorityWarnings = this.warnings.filter(w => w.severity === '中');
        if (mediumPriorityWarnings.length > 0) {
            console.log('\n  中优先级（建议优化）:');
            mediumPriorityWarnings.forEach((warning, index) => {
                console.log(`    ${index + 1}. ${warning.description}`);
            });
        }
        
        console.log('\n' + '='.repeat(50));
        
        // 保存报告到文件
        this.saveReportToFile();
    }

    /**
     * 按类别分组
     */
    groupByCategory(items) {
        return items.reduce((groups, item) => {
            const category = item.category;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
            return groups;
        }, {});
    }

    /**
     * 保存报告到文件
     */
    saveReportToFile() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                successes: this.successes.length,
                warnings: this.warnings.length,
                issues: this.issues.length
            },
            successes: this.successes,
            warnings: this.warnings,
            issues: this.issues,
            overallAssessment: this.getOverallAssessment()
        };
        
        const reportPath = path.join(this.projectRoot, 'ad_validation_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📄 详细报告已保存至: ${reportPath}`);
    }

    /**
     * 获取总体评估
     */
    getOverallAssessment() {
        if (this.issues.length === 0 && this.warnings.length === 0) {
            return {
                status: '通过',
                description: '广告系统验证通过，可以上线',
                color: 'green'
            };
        } else if (this.issues.length === 0 && this.warnings.length > 0) {
            return {
                status: '有条件通过',
                description: '广告系统基本可用，建议优化警告项后上线',
                color: 'yellow'
            };
        } else {
            return {
                status: '不通过',
                description: '广告系统存在关键问题，需要修复后才能上线',
                color: 'red'
            };
        }
    }
}

// 执行验证
const projectRoot = '/root/.openclaw/workspace/微恐咖啡厅';
const validator = new AdValidation(projectRoot);

validator.runFullValidation().catch(console.error);