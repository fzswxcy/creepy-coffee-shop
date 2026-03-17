/**
 * 性能优化器
 * 监控和优化游戏性能，确保流畅的用户体验
 */

import { _decorator, Component, director, SystemEvent } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 性能指标
 */
export interface PerformanceMetrics {
    fps: number;
    frameTime: number; // 毫秒
    memoryUsage: number; // MB
    drawCalls: number;
    triangleCount: number;
    textureMemory: number; // MB
    scriptTime: number; // 毫秒
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
    targetFPS: number;
    maxFrameTime: number;
    maxMemoryUsage: number;
    maxDrawCalls: number;
    optimizationLevel: 'low' | 'medium' | 'high';
}

/**
 * 优化动作
 */
export interface OptimizationAction {
    type: 'reduce_textures' | 'reduce_particles' | 'pool_objects' | 'reduce_updates' | 'unload_assets';
    priority: number; // 1-10
    impact: number; // 性能提升百分比
    description: string;
    applied: boolean;
}

@ccclass('PerformanceOptimizer')
export class PerformanceOptimizer extends Component {
    // 性能监控配置
    private config: PerformanceConfig = {
        targetFPS: 30,
        maxFrameTime: 33, // 30fps对应33ms
        maxMemoryUsage: 100, // 100MB
        maxDrawCalls: 100,
        optimizationLevel: 'medium'
    };
    
    // 当前性能指标
    private currentMetrics: PerformanceMetrics = {
        fps: 60,
        frameTime: 16.67,
        memoryUsage: 0,
        drawCalls: 0,
        triangleCount: 0,
        textureMemory: 0,
        scriptTime: 0
    };
    
    // 性能历史
    private performanceHistory: PerformanceMetrics[] = [];
    private readonly MAX_HISTORY_SIZE = 100;
    
    // 优化动作
    private availableActions: OptimizationAction[] = [];
    private appliedActions: OptimizationAction[] = [];
    
    // 监控状态
    private isMonitoring: boolean = false;
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private fpsUpdateTime: number = 0;
    
    // 性能警告
    private performanceWarnings: string[] = [];
    private lastWarningTime: number = 0;
    
    onLoad() {
        this.initializeOptimizer();
    }
    
    /**
     * 初始化优化器
     */
    private initializeOptimizer() {
        console.log('⚡ 性能优化器初始化');
        
        // 初始化优化动作
        this.initializeOptimizationActions();
        
        // 开始性能监控
        this.startPerformanceMonitoring();
        
        // 开始优化检查
        this.schedule(this.checkAndOptimize, 5.0); // 每5秒检查一次
        
        console.log('✅ 性能优化器初始化完成');
    }
    
    /**
     * 初始化优化动作
     */
    private initializeOptimizationActions() {
        this.availableActions = [
            {
                type: 'reduce_textures',
                priority: 8,
                impact: 15,
                description: '降低纹理质量以节省内存',
                applied: false
            },
            {
                type: 'pool_objects',
                priority: 9,
                impact: 20,
                description: '启用对象池减少实例化开销',
                applied: false
            },
            {
                type: 'reduce_particles',
                priority: 6,
                impact: 10,
                description: '减少粒子效果数量',
                applied: false
            },
            {
                type: 'reduce_updates',
                priority: 7,
                impact: 12,
                description: '降低非关键组件的更新频率',
                applied: false
            },
            {
                type: 'unload_assets',
                priority: 5,
                impact: 25,
                description: '卸载未使用的资源',
                applied: false
            }
        ];
    }
    
    /**
     * 开始性能监控
     */
    private startPerformanceMonitoring() {
        this.isMonitoring = true;
        this.lastFrameTime = Date.now();
        this.fpsUpdateTime = this.lastFrameTime;
        
        // 注册帧更新回调
        director.on(SystemEvent.EventType.DIRECTOR_BEFORE_UPDATE, this.onBeforeUpdate, this);
        director.on(SystemEvent.EventType.DIRECTOR_AFTER_UPDATE, this.onAfterUpdate, this);
        
        console.log('📊 性能监控已启动');
    }
    
    /**
     * 帧更新前回调
     */
    private onBeforeUpdate() {
        this.lastFrameTime = Date.now();
    }
    
    /**
     * 帧更新后回调
     */
    private onAfterUpdate() {
        this.frameCount++;
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.fpsUpdateTime;
        
        // 每秒更新一次FPS
        if (elapsedTime >= 1000) {
            this.currentMetrics.fps = Math.round((this.frameCount * 1000) / elapsedTime);
            this.currentMetrics.frameTime = elapsedTime / this.frameCount;
            
            // 更新其他性能指标
            this.updateOtherMetrics();
            
            // 保存到历史
            this.saveToHistory();
            
            // 重置计数
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
            
            // 检查性能状态
            this.checkPerformanceState();
        }
    }
    
    /**
     * 更新其他性能指标
     */
    private updateOtherMetrics() {
        // 这里可以添加更多的性能指标收集
        // 例如：drawCalls、内存使用等
        
        // 模拟一些指标（实际项目中应该从引擎获取）
        this.currentMetrics.drawCalls = Math.floor(Math.random() * 50) + 50;
        this.currentMetrics.triangleCount = Math.floor(Math.random() * 5000) + 10000;
        this.currentMetrics.textureMemory = Math.floor(Math.random() * 20) + 10;
        this.currentMetrics.scriptTime = this.currentMetrics.frameTime * 0.3;
        
        // 模拟内存使用（微信小游戏有内存限制）
        if (typeof wx !== 'undefined' && wx.getPerformance) {
            try {
                const perf = wx.getPerformance();
                // 微信小游戏性能API
            } catch (error) {
                // 模拟数据
                this.currentMetrics.memoryUsage = 30 + Math.random() * 20;
            }
        } else {
            this.currentMetrics.memoryUsage = 30 + Math.random() * 20;
        }
    }
    
    /**
     * 保存到历史
     */
    private saveToHistory() {
        this.performanceHistory.push({ ...this.currentMetrics });
        
        // 限制历史大小
        if (this.performanceHistory.length > this.MAX_HISTORY_SIZE) {
            this.performanceHistory.shift();
        }
    }
    
    /**
     * 检查性能状态
     */
    private checkPerformanceState() {
        const metrics = this.currentMetrics;
        const config = this.config;
        const warnings: string[] = [];
        
        // 检查FPS
        if (metrics.fps < config.targetFPS * 0.7) {
            warnings.push(`FPS过低: ${metrics.fps} (目标: ${config.targetFPS})`);
        }
        
        // 检查帧时间
        if (metrics.frameTime > config.maxFrameTime) {
            warnings.push(`帧时间过长: ${metrics.frameTime.toFixed(2)}ms`);
        }
        
        // 检查内存使用
        if (metrics.memoryUsage > config.maxMemoryUsage * 0.8) {
            warnings.push(`内存使用偏高: ${metrics.memoryUsage.toFixed(1)}MB`);
        }
        
        // 检查DrawCalls
        if (metrics.drawCalls > config.maxDrawCalls) {
            warnings.push(`DrawCalls过多: ${metrics.drawCalls}`);
        }
        
        // 更新警告
        this.performanceWarnings = warnings;
        
        // 如果有警告且距离上次警告超过10秒，记录日志
        if (warnings.length > 0 && Date.now() - this.lastWarningTime > 10000) {
            console.warn('⚠️ 性能警告:', warnings.join(', '));
            this.lastWarningTime = Date.now();
        }
    }
    
    /**
     * 检查和优化
     */
    private checkAndOptimize() {
        const needsOptimization = this.needsOptimization();
        
        if (needsOptimization) {
            console.log('🔄 检测到性能问题，开始优化...');
            this.applyOptimizations();
        }
    }
    
    /**
     * 检查是否需要优化
     */
    private needsOptimization(): boolean {
        const metrics = this.currentMetrics;
        const config = this.config;
        
        // 检查各种性能指标
        const conditions = [
            metrics.fps < config.targetFPS * 0.8,
            metrics.frameTime > config.maxFrameTime * 1.2,
            metrics.memoryUsage > config.maxMemoryUsage * 0.9,
            metrics.drawCalls > config.maxDrawCalls * 1.5,
            this.performanceWarnings.length >= 2
        ];
        
        // 如果有两个或以上条件满足，需要优化
        return conditions.filter(Boolean).length >= 2;
    }
    
    /**
     * 应用优化
     */
    private applyOptimizations() {
        // 按优先级排序可用的优化动作
        const sortedActions = [...this.availableActions]
            .filter(action => !action.applied)
            .sort((a, b) => b.priority - a.priority);
        
        // 应用前2个最高优先级的动作
        const actionsToApply = sortedActions.slice(0, 2);
        
        actionsToApply.forEach(action => {
            this.applyOptimizationAction(action);
        });
    }
    
    /**
     * 应用优化动作
     */
    private applyOptimizationAction(action: OptimizationAction) {
        console.log(`⚙️ 应用优化: ${action.description}`);
        
        switch (action.type) {
            case 'reduce_textures':
                this.reduceTextureQuality();
                break;
                
            case 'pool_objects':
                this.enableObjectPooling();
                break;
                
            case 'reduce_particles':
                this.reduceParticleEffects();
                break;
                
            case 'reduce_updates':
                this.reduceUpdateFrequency();
                break;
                
            case 'unload_assets':
                this.unloadUnusedAssets();
                break;
        }
        
        action.applied = true;
        this.appliedActions.push(action);
        
        // 从可用列表中移除
        const index = this.availableActions.findIndex(a => a.type === action.type);
        if (index > -1) {
            this.availableActions.splice(index, 1);
        }
    }
    
    /**
     * 降低纹理质量
     */
    private reduceTextureQuality() {
        console.log('🖼️ 降低纹理质量以节省内存');
        
        // 实际项目中应该调整纹理的压缩级别或分辨率
        // 这里只是示例
        
        // 可以设置一个全局的纹理质量级别
        const qualityLevel = this.config.optimizationLevel === 'low' ? 0.5 : 0.75;
        
        // 通知所有纹理管理器降低质量
        // TODO: 实现具体的纹理质量调整
    }
    
    /**
     * 启用对象池
     */
    private enableObjectPooling() {
        console.log('🔄 启用对象池减少实例化开销');
        
        // 对于频繁创建和销毁的对象使用对象池
        // 例如：顾客卡片、UI元素等
        
        // 可以在这里初始化对象池
        // TODO: 实现对象池系统
    }
    
    /**
     * 减少粒子效果
     */
    private reduceParticleEffects() {
        console.log('✨ 减少粒子效果数量');
        
        // 减少或禁用非必要的粒子效果
        // 可以降低粒子数量、发射率等
        
        // TODO: 调整粒子系统设置
    }
    
    /**
     * 降低更新频率
     */
    private reduceUpdateFrequency() {
        console.log('⏱️ 降低非关键组件的更新频率');
        
        // 对于不重要的UI元素或背景效果，降低更新频率
        // 例如：从每帧更新改为每秒更新几次
        
        // 可以调整调度器的频率
        // TODO: 优化更新频率
    }
    
    /**
     * 卸载未使用资源
     */
    private unloadUnusedAssets() {
        console.log('🗑️ 卸载未使用的资源');
        
        // 释放长时间未使用的资源
        // 微信小游戏有严格的内存限制，需要主动管理
        
        // TODO: 实现资源卸载逻辑
    }
    
    /**
     * 恢复优化（当性能良好时）
     */
    private restoreOptimizations() {
        const metrics = this.currentMetrics;
        const config = this.config;
        
        // 检查性能是否已经良好
        const isPerformanceGood = 
            metrics.fps >= config.targetFPS * 0.9 &&
            metrics.frameTime <= config.maxFrameTime * 0.8 &&
            metrics.memoryUsage <= config.maxMemoryUsage * 0.7 &&
            this.performanceWarnings.length === 0;
        
        if (isPerformanceGood && this.appliedActions.length > 0) {
            console.log('✅ 性能良好，考虑恢复部分优化');
            
            // 可以在这里恢复一些对视觉影响较大的优化
            // 例如：恢复纹理质量
        }
    }
    
    // ==================== 公共API ====================
    
    /**
     * 获取当前性能指标
     */
    public getCurrentMetrics(): PerformanceMetrics {
        return { ...this.currentMetrics };
    }
    
    /**
     * 获取性能历史
     */
    public getPerformanceHistory(): PerformanceMetrics[] {
        return [...this.performanceHistory];
    }
    
    /**
     * 获取平均FPS
     */
    public getAverageFPS(count: number = 10): number {
        const history = this.performanceHistory.slice(-count);
        if (history.length === 0) return this.currentMetrics.fps;
        
        const totalFPS = history.reduce((sum, metrics) => sum + metrics.fps, 0);
        return Math.round(totalFPS / history.length);
    }
    
    /**
     * 获取性能报告
     */
    public getPerformanceReport(): {
        currentFPS: number;
        averageFPS: number;
        frameTime: number;
        memoryUsage: number;
        drawCalls: number;
        warnings: string[];
        optimizationsApplied: number;
    } {
        return {
            currentFPS: this.currentMetrics.fps,
            averageFPS: this.getAverageFPS(30),
            frameTime: this.currentMetrics.frameTime,
            memoryUsage: this.currentMetrics.memoryUsage,
            drawCalls: this.currentMetrics.drawCalls,
            warnings: [...this.performanceWarnings],
            optimizationsApplied: this.appliedActions.length
        };
    }
    
    /**
     * 设置优化级别
     */
    public setOptimizationLevel(level: 'low' | 'medium' | 'high') {
        this.config.optimizationLevel = level;
        
        // 根据级别调整配置
        switch (level) {
            case 'low':
                this.config.targetFPS = 30;
                this.config.maxDrawCalls = 80;
                break;
            case 'medium':
                this.config.targetFPS = 40;
                this.config.maxDrawCalls = 120;
                break;
            case 'high':
                this.config.targetFPS = 60;
                this.config.maxDrawCalls = 200;
                break;
        }
        
        console.log(`🎚️ 优化级别设置为: ${level}`);
    }
    
    /**
     * 手动触发优化
     */
    public triggerOptimization() {
        console.log('🔄 手动触发性能优化');
        this.applyOptimizations();
    }
    
    /**
     * 重置优化器
     */
    public resetOptimizer() {
        console.log('🔄 重置性能优化器');
        
        // 恢复所有优化动作
        this.appliedActions.forEach(action => {
            action.applied = false;
        });
        
        // 合并回可用列表
        this.availableActions = [...this.availableActions, ...this.appliedActions]
            .filter((action, index, self) => 
                self.findIndex(a => a.type === action.type) === index
            );
        
        // 清空已应用列表
        this.appliedActions = [];
        
        // 清空历史
        this.performanceHistory = [];
        
        console.log('✅ 优化器已重置');
    }
    
    /**
     * 获取优化建议
     */
    public getOptimizationSuggestions(): string[] {
        const suggestions: string[] = [];
        const metrics = this.currentMetrics;
        
        if (metrics.fps < 30) {
            suggestions.push('FPS过低，建议降低画质或减少屏幕上的元素数量');
        }
        
        if (metrics.memoryUsage > 80) {
            suggestions.push('内存使用较高，建议关闭不需要的界面或重启游戏');
        }
        
        if (metrics.drawCalls > 150) {
            suggestions.push('DrawCalls过多，建议合并UI元素或使用更少的特效');
        }
        
        return suggestions;
    }
    
    /**
     * 检查是否适合当前设备
     */
    public isSuitableForDevice(): boolean {
        const metrics = this.currentMetrics;
        
        // 简单设备适配检查
        if (metrics.fps < 20) {
            console.warn('⚠️ 设备性能不足，建议降低画质');
            return false;
        }
        
        if (metrics.memoryUsage > 90) {
            console.warn('⚠️ 内存使用过高，可能影响游戏稳定性');
            return false;
        }
        
        return true;
    }
}

export const performanceOptimizer = new PerformanceOptimizer();