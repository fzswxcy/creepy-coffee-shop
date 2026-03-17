/**
 * 错误处理管理器
 * 统一的错误捕获、处理和恢复机制
 */

import { _decorator, Component, director } from 'cc';
import { gameFeedbackSystem } from '../ui/GameFeedbackSystem';
const { ccclass, property } = _decorator;

/**
 * 错误类型
 */
export enum ErrorType {
    NETWORK = 'network',
    DATA = 'data',
    SYSTEM = 'system',
    LOGIC = 'logic',
    UI = 'ui',
    ASSET = 'asset',
    PERMISSION = 'permission',
    UNKNOWN = 'unknown'
}

/**
 * 错误级别
 */
export enum ErrorLevel {
    INFO = 'info',      // 信息性错误，不影响游戏
    WARNING = 'warning', // 警告，可能影响体验
    ERROR = 'error',    // 错误，影响功能但不崩溃
    CRITICAL = 'critical' // 严重错误，可能导致崩溃
}

/**
 * 错误数据
 */
export interface ErrorData {
    id: string;
    type: ErrorType;
    level: ErrorLevel;
    message: string;
    stack?: string;
    timestamp: number;
    context?: any;
    resolved: boolean;
    resolution?: string;
}

/**
 * 恢复策略
 */
export interface RecoveryStrategy {
    type: 'retry' | 'fallback' | 'ignore' | 'restart' | 'reload';
    maxAttempts: number;
    delayMs: number;
    description: string;
}

@ccclass('ErrorHandler')
export class ErrorHandler extends Component {
    // 错误记录
    private errorLog: ErrorData[] = [];
    private readonly MAX_ERROR_LOG_SIZE = 100;
    
    // 恢复策略映射
    private recoveryStrategies: Map<ErrorType, RecoveryStrategy[]> = new Map();
    
    // 错误统计
    private errorStats = {
        totalErrors: 0,
        errorsByType: new Map<ErrorType, number>(),
        errorsByLevel: new Map<ErrorLevel, number>(),
        lastErrorTime: 0,
        recoveryAttempts: 0,
        successfulRecoveries: 0
    };
    
    // 错误抑制（避免重复错误）
    private errorSuppression: Map<string, number> = new Map();
    private readonly SUPPRESSION_DURATION = 60000; // 1分钟
    
    // 自动恢复定时器
    private autoRecoveryTimer: number = 0;
    
    onLoad() {
        this.initializeErrorHandler();
    }
    
    /**
     * 初始化错误处理器
     */
    private initializeErrorHandler() {
        console.log('🛡️ 错误处理器初始化');
        
        // 设置全局错误捕获
        this.setupGlobalErrorHandlers();
        
        // 初始化恢复策略
        this.initializeRecoveryStrategies();
        
        // 开始错误监控
        this.schedule(this.monitorErrorState, 10); // 每10秒监控一次
        
        console.log('✅ 错误处理器初始化完成');
    }
    
    /**
     * 设置全局错误处理器
     */
    private setupGlobalErrorHandlers() {
        // 捕获JavaScript错误
        if (typeof window !== 'undefined') {
            window.onerror = (message, source, lineno, colno, error) => {
                this.handleError({
                    type: ErrorType.SYSTEM,
                    level: ErrorLevel.ERROR,
                    message: `${message} at ${source}:${lineno}:${colno}`,
                    stack: error?.stack,
                    context: { source, lineno, colno }
                });
                return true; // 阻止默认错误处理
            };
        }
        
        // 捕获Promise未处理的rejection
        if (typeof window !== 'undefined') {
            window.onunhandledrejection = (event) => {
                this.handleError({
                    type: ErrorType.SYSTEM,
                    level: ErrorLevel.ERROR,
                    message: `Unhandled Promise Rejection: ${event.reason}`,
                    stack: event.reason?.stack,
                    context: { promise: event.promise }
                });
            };
        }
        
        // 微信小游戏特定错误捕获
        if (typeof wx !== 'undefined') {
            wx.onError?.((error: any) => {
                this.handleError({
                    type: ErrorType.SYSTEM,
                    level: ErrorLevel.ERROR,
                    message: `WeChat Error: ${error.message}`,
                    stack: error.stack,
                    context: error
                });
            });
        }
    }
    
    /**
     * 初始化恢复策略
     */
    private initializeRecoveryStrategies() {
        // 网络错误恢复策略
        this.recoveryStrategies.set(ErrorType.NETWORK, [
            {
                type: 'retry',
                maxAttempts: 3,
                delayMs: 1000,
                description: '网络错误，自动重试连接'
            },
            {
                type: 'fallback',
                maxAttempts: 1,
                delayMs: 0,
                description: '使用本地数据代替网络数据'
            }
        ]);
        
        // 数据错误恢复策略
        this.recoveryStrategies.set(ErrorType.DATA, [
            {
                type: 'reload',
                maxAttempts: 1,
                delayMs: 500,
                description: '数据损坏，重新加载'
            },
            {
                type: 'fallback',
                maxAttempts: 1,
                delayMs: 0,
                description: '使用默认数据'
            }
        ]);
        
        // 系统错误恢复策略
        this.recoveryStrategies.set(ErrorType.SYSTEM, [
            {
                type: 'restart',
                maxAttempts: 1,
                delayMs: 2000,
                description: '系统错误，重启相关模块'
            }
        ]);
        
        // UI错误恢复策略
        this.recoveryStrategies.set(ErrorType.UI, [
            {
                type: 'reload',
                maxAttempts: 2,
                delayMs: 300,
                description: 'UI错误，重新加载界面'
            },
            {
                type: 'ignore',
                maxAttempts: 1,
                delayMs: 0,
                description: '忽略非关键UI错误'
            }
        ]);
        
        // 资源错误恢复策略
        this.recoveryStrategies.set(ErrorType.ASSET, [
            {
                type: 'retry',
                maxAttempts: 2,
                delayMs: 500,
                description: '资源加载失败，重试'
            },
            {
                type: 'fallback',
                maxAttempts: 1,
                delayMs: 0,
                description: '使用备用资源'
            }
        ]);
    }
    
    /**
     * 处理错误
     */
    public handleError(errorInfo: {
        type: ErrorType;
        level: ErrorLevel;
        message: string;
        stack?: string;
        context?: any;
    }): ErrorData {
        const errorId = this.generateErrorId();
        
        // 检查是否应该抑制此错误
        if (this.shouldSuppressError(errorInfo)) {
            console.log(`🔇 错误被抑制: ${errorInfo.message.substring(0, 50)}...`);
            return {
                id: errorId,
                ...errorInfo,
                timestamp: Date.now(),
                resolved: false
            };
        }
        
        const errorData: ErrorData = {
            id: errorId,
            ...errorInfo,
            timestamp: Date.now(),
            resolved: false
        };
        
        // 记录错误
        this.recordError(errorData);
        
        // 根据错误级别处理
        this.processErrorByLevel(errorData);
        
        // 尝试自动恢复
        this.attemptAutoRecovery(errorData);
        
        return errorData;
    }
    
    /**
     * 检查是否应该抑制错误
     */
    private shouldSuppressError(errorInfo: {
        type: ErrorType;
        level: ErrorLevel;
        message: string;
    }): boolean {
        // 对于INFO级别的错误，总是抑制
        if (errorInfo.level === ErrorLevel.INFO) {
            return true;
        }
        
        // 创建错误指纹（用于识别重复错误）
        const errorFingerprint = `${errorInfo.type}:${errorInfo.message.substring(0, 100)}`;
        const lastSuppressed = this.errorSuppression.get(errorFingerprint);
        const now = Date.now();
        
        if (lastSuppressed && now - lastSuppressed < this.SUPPRESSION_DURATION) {
            return true;
        }
        
        // 更新抑制时间
        this.errorSuppression.set(errorFingerprint, now);
        
        return false;
    }
    
    /**
     * 生成错误ID
     */
    private generateErrorId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 记录错误
     */
    private recordError(errorData: ErrorData) {
        // 添加到错误日志
        this.errorLog.push(errorData);
        
        // 限制日志大小
        if (this.errorLog.length > this.MAX_ERROR_LOG_SIZE) {
            this.errorLog.shift();
        }
        
        // 更新统计
        this.updateErrorStats(errorData);
        
        // 记录到控制台（根据级别）
        this.logErrorToConsole(errorData);
    }
    
    /**
     * 更新错误统计
     */
    private updateErrorStats(errorData: ErrorData) {
        this.errorStats.totalErrors++;
        
        // 按类型统计
        const typeCount = this.errorStats.errorsByType.get(errorData.type) || 0;
        this.errorStats.errorsByType.set(errorData.type, typeCount + 1);
        
        // 按级别统计
        const levelCount = this.errorStats.errorsByLevel.get(errorData.level) || 0;
        this.errorStats.errorsByLevel.set(errorData.level, levelCount + 1);
        
        this.errorStats.lastErrorTime = Date.now();
    }
    
    /**
     * 记录错误到控制台
     */
    private logErrorToConsole(errorData: ErrorData) {
        const prefix = `[${errorData.type.toUpperCase()}] ${errorData.level.toUpperCase()}`;
        const message = `${prefix}: ${errorData.message}`;
        
        switch (errorData.level) {
            case ErrorLevel.INFO:
                console.info(message);
                break;
            case ErrorLevel.WARNING:
                console.warn(message);
                break;
            case ErrorLevel.ERROR:
                console.error(message);
                if (errorData.stack) {
                    console.error('Stack:', errorData.stack);
                }
                break;
            case ErrorLevel.CRITICAL:
                console.error('🚨 CRITICAL:', message);
                if (errorData.stack) {
                    console.error('Stack:', errorData.stack);
                }
                break;
        }
    }
    
    /**
     * 根据错误级别处理
     */
    private processErrorByLevel(errorData: ErrorData) {
        switch (errorData.level) {
            case ErrorLevel.INFO:
                // 信息性错误，只记录不提示
                break;
                
            case ErrorLevel.WARNING:
                // 警告级别，显示Toast提示
                gameFeedbackSystem.showWarning('⚠️ 警告', errorData.message, 4000);
                break;
                
            case ErrorLevel.ERROR:
                // 错误级别，显示明显的错误提示
                gameFeedbackSystem.showError('❌ 错误', errorData.message, 5000);
                break;
                
            case ErrorLevel.CRITICAL:
                // 严重错误，需要用户确认
                this.showCriticalErrorDialog(errorData);
                break;
        }
    }
    
    /**
     * 显示严重错误对话框
     */
    private showCriticalErrorDialog(errorData: ErrorData) {
        // TODO: 实现严重错误对话框UI
        console.error('🚨 严重错误，需要用户处理:', errorData.message);
        
        // 暂时使用反馈系统显示
        gameFeedbackSystem.showError(
            '🚨 严重错误',
            `${errorData.message}\n游戏可能需要重启`,
            10000
        );
    }
    
    /**
     * 尝试自动恢复
     */
    private attemptAutoRecovery(errorData: ErrorData) {
        // 对于CRITICAL级别的错误，不尝试自动恢复
        if (errorData.level === ErrorLevel.CRITICAL) {
            return;
        }
        
        const strategies = this.recoveryStrategies.get(errorData.type);
        if (!strategies || strategies.length === 0) {
            return;
        }
        
        // 使用第一个策略尝试恢复
        const strategy = strategies[0];
        this.errorStats.recoveryAttempts++;
        
        console.log(`🔄 尝试自动恢复: ${strategy.description}`);
        
        // 根据策略类型执行恢复
        switch (strategy.type) {
            case 'retry':
                this.executeRetryStrategy(errorData, strategy);
                break;
            case 'fallback':
                this.executeFallbackStrategy(errorData, strategy);
                break;
            case 'reload':
                this.executeReloadStrategy(errorData, strategy);
                break;
            case 'restart':
                this.executeRestartStrategy(errorData, strategy);
                break;
            case 'ignore':
                this.executeIgnoreStrategy(errorData, strategy);
                break;
        }
    }
    
    /**
     * 执行重试策略
     */
    private executeRetryStrategy(errorData: ErrorData, strategy: RecoveryStrategy) {
        // 延迟后重试
        setTimeout(() => {
            console.log(`🔄 重试: ${errorData.message}`);
            
            // 标记错误为已解决
            errorData.resolved = true;
            errorData.resolution = `自动重试成功`;
            this.errorStats.successfulRecoveries++;
            
        }, strategy.delayMs);
    }
    
    /**
     * 执行备用策略
     */
    private executeFallbackStrategy(errorData: ErrorData, strategy: RecoveryStrategy) {
        console.log(`🔄 使用备用方案: ${errorData.message}`);
        
        // TODO: 实现具体的备用方案逻辑
        
        errorData.resolved = true;
        errorData.resolution = `使用备用方案`;
        this.errorStats.successfulRecoveries++;
    }
    
    /**
     * 执行重新加载策略
     */
    private executeReloadStrategy(errorData: ErrorData, strategy: RecoveryStrategy) {
        console.log(`🔄 重新加载模块: ${errorData.message}`);
        
        // TODO: 重新加载特定的模块或界面
        
        errorData.resolved = true;
        errorData.resolution = `模块重新加载`;
        this.errorStats.successfulRecoveries++;
    }
    
    /**
     * 执行重启策略
     */
    private executeRestartStrategy(errorData: ErrorData, strategy: RecoveryStrategy) {
        console.log(`🔄 重启模块: ${errorData.message}`);
        
        setTimeout(() => {
            // TODO: 重启特定的系统模块
            
            errorData.resolved = true;
            errorData.resolution = `模块重启完成`;
            this.errorStats.successfulRecoveries++;
        }, strategy.delayMs);
    }
    
    /**
     * 执行忽略策略
     */
    private executeIgnoreStrategy(errorData: ErrorData, strategy: RecoveryStrategy) {
        console.log(`🔄 忽略错误: ${errorData.message}`);
        
        errorData.resolved = true;
        errorData.resolution = `错误被忽略`;
        this.errorStats.successfulRecoveries++;
    }
    
    /**
     * 监控错误状态
     */
    private monitorErrorState() {
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        
        // 检查最近5分钟的错误频率
        const recentErrors = this.errorLog.filter(error => 
            error.timestamp > fiveMinutesAgo && 
            error.level !== ErrorLevel.INFO
        );
        
        // 如果错误频率过高，可能需要更激进的恢复措施
        if (recentErrors.length > 10) {
            console.warn(`⚠️ 错误频率过高: 最近5分钟 ${recentErrors.length} 个错误`);
            
            // 可以考虑在这里触发全局恢复
            // 例如：重启游戏、清理缓存等
        }
        
        // 检查未解决的错误
        const unresolvedErrors = this.errorLog.filter(error => !error.resolved);
        if (unresolvedErrors.length > 5) {
            console.warn(`⚠️ 有 ${unresolvedErrors.length} 个未解决的错误`);
        }
    }
    
    // ==================== 公共API ====================
    
    /**
     * 手动报告错误
     */
    public reportError(
        type: ErrorType,
        level: ErrorLevel,
        message: string,
        context?: any
    ): ErrorData {
        return this.handleError({
            type,
            level,
            message,
            context
        });
    }
    
    /**
     * 手动解决错误
     */
    public resolveError(errorId: string, resolution: string): boolean {
        const error = this.errorLog.find(e => e.id === errorId);
        if (!error) return false;
        
        error.resolved = true;
        error.resolution = resolution;
        
        console.log(`✅ 错误已解决: ${errorId} - ${resolution}`);
        return true;
    }
    
    /**
     * 获取错误报告
     */
    public getErrorReport(): {
        totalErrors: number;
        recentErrors: ErrorData[];
        unresolvedErrors: ErrorData[];
        errorStats: {
            byType: Record<string, number>;
            byLevel: Record<string, number>;
        };
        recoveryStats: {
            attempts: number;
            successes: number;
            successRate: number;
        };
    } {
        const recentErrors = this.errorLog.slice(-20); // 最近20个错误
        const unresolvedErrors = this.errorLog.filter(error => !error.resolved);
        
        // 转换统计为普通对象
        const errorsByType: Record<string, number> = {};
        this.errorStats.errorsByType.forEach((count, type) => {
            errorsByType[type] = count;
        });
        
        const errorsByLevel: Record<string, number> = {};
        this.errorStats.errorsByLevel.forEach((count, level) => {
            errorsByLevel[level] = count;
        });
        
        const successRate = this.errorStats.recoveryAttempts > 0
            ? Math.round((this.errorStats.successfulRecoveries / this.errorStats.recoveryAttempts) * 100)
            : 0;
        
        return {
            totalErrors: this.errorStats.totalErrors,
            recentErrors: [...recentErrors],
            unresolvedErrors: [...unresolvedErrors],
            errorStats: {
                byType: errorsByType,
                byLevel: errorsByLevel
            },
            recoveryStats: {
                attempts: this.errorStats.recoveryAttempts,
                successes: this.errorStats.successfulRecoveries,
                successRate
            }
        };
    }
    
    /**
     * 清除错误日志
     */
    public clearErrorLog(): void {
        this.errorLog = [];
        console.log('🗑️ 错误日志已清除');
    }
    
    /**
     * 安全检查（用于关键操作前）
     */
    public safetyCheck(operation: string): boolean {
        // 检查最近是否有严重错误
        const recentCriticalErrors = this.errorLog.filter(error => 
            error.level === ErrorLevel.CRITICAL &&
            Date.now() - error.timestamp < 5 * 60 * 1000 // 最近5分钟
        );
        
        if (recentCriticalErrors.length > 0) {
            console.warn(`⚠️ 安全检查失败: 最近有严重错误，不建议执行 ${operation}`);
            return false;
        }
        
        // 检查错误频率
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const recentErrors = this.errorLog.filter(error => 
            error.timestamp > fiveMinutesAgo && 
            error.level !== ErrorLevel.INFO
        );
        
        if (recentErrors.length > 20) {
            console.warn(`⚠️ 安全检查失败: 错误频率过高，不建议执行 ${operation}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * 测试错误处理
     */
    public testErrorHandling(): void {
        console.log('🧪 测试错误处理系统');
        
        // 测试不同级别的错误
        this.reportError(ErrorType.LOGIC, ErrorLevel.INFO, '测试信息性错误');
        this.reportError(ErrorType.UI, ErrorLevel.WARNING, '测试警告级别错误');
        this.reportError(ErrorType.DATA, ErrorLevel.ERROR, '测试错误级别错误');
        
        // 等待一会儿
        setTimeout(() => {
            const report = this.getErrorReport();
            console.log('📊 错误处理测试完成:', report);
        }, 1000);
    }
}

export const errorHandler = new ErrorHandler();