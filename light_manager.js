/**
 * 灯光管理器 - 微恐咖啡厅微信小游戏
 * 版本: 1.0.0
 * 创建时间: 2026-03-05 12:15 GMT+8
 * 作者: NIKO (CEO/主架构师)
 * 
 * 功能: 统一管理灯光系统的所有资源
 *      包括灯光创建、调度、销毁、恐怖氛围协调
 * 特点: 高性能、内存优化、恐怖氛围协调
 */

// 导入依赖
import { lightConfig } from './light_config.js';

// 模拟导入灯光工厂和动画控制器（实际项目中从文件导入）
// import { LightFactory } from './light_factory.js';
// import { LightAnimationController } from './light_animation.js';

class LightManager {
  constructor() {
    // 基础配置
    this.version = '1.0.0';
    this.initialized = false;
    
    // 平台检测
    this.platform = this.detectPlatform();
    
    // 加载平台配置
    this.platformConfig = lightConfig.getPlatformConfig(this.platform);
    this.performanceConfig = lightConfig.getPerformanceConfig();
    this.debugConfig = lightConfig.getDebugConfig();
    
    // 灯光资源池
    this.lightResources = {
      // 存储所有灯光实例
      lights: new Map(),           // Map<lightId, lightInstance>
      activeLights: new Set(),     // Set<lightId> 当前激活的灯光
      disabledLights: new Set(),   // Set<lightId> 被禁用的灯光
      
      // 灯光统计
      stats: {
        totalCreated: 0,
        currentActive: 0,
        maxActiveReached: 0,
        memoryUsageKB: 0,
        performanceScore: 0
      }
    };
    
    // 动画资源池
    this.animationResources = {
      // 存储所有动画实例
      animations: new Map(),       // Map<animationId, animationInstance>
      activeAnimations: new Set(), // Set<animationId> 当前激活的动画
      
      // 动画统计
      stats: {
        totalCreated: 0,
        currentActive: 0,
        maxActiveReached: 0,
        averageDurationMs: 0,
        performanceScore: 0
      }
    };
    
    // 恐怖氛围状态
    this.terrorState = {
      currentLevel: 1,            // 当前恐怖等级 (1-5)
      targetLevel: 1,             // 目标恐怖等级
      transitionProgress: 0,      // 过渡进度 (0-1)
      terrorEvents: new Map(),    // Map<eventId, eventData> 当前恐怖事件
      sanityValue: 100,           // 当前理智值 (0-100)
      lastSanityUpdate: Date.now(),
      
      // 恐怖等级配置缓存
      levelConfigs: new Map()     // Map<level, config>
    };
    
    // 材质系统连接
    this.materialConnections = {
      currentMaterial: 'wood_material',
      materialConfig: null,
      lightIntensityCache: new Map(), // Map<lightId, intensity>
      lastMaterialUpdate: 0
    };
    
    // 性能监控
    this.performanceMonitor = {
      fps: 60,
      lastFrameTime: Date.now(),
      frameTimes: [],
      averageFrameTime: 16.67, // 60 FPS
      memorySamples: [],
      performanceLevel: 'high',
      
      // 监控配置
      samplingInterval: 1000,   // 1秒采样一次
      lastSampleTime: 0,
      sampleCount: 0
    };
    
    // 事件系统
    this.eventSystem = {
      pendingEvents: [],         // 待处理事件队列
      processingEvents: [],      // 正在处理的事件
      eventHistory: [],          // 事件历史记录
      cooldownTimers: new Map(), // Map<eventName, cooldownEndTime>
      
      // 事件统计
      stats: {
        totalEvents: 0,
        processedEvents: 0,
        failedEvents: 0,
        averageProcessingTimeMs: 0
      }
    };
    
    // 资源调度器
    this.scheduler = {
      updateInterval: 16,        // 约60 FPS (16ms)
      lastUpdateTime: 0,
      updateQueue: [],           // 待更新任务
      scheduledTasks: new Map(), // Map<taskId, taskData>
      
      // 优先级管理
      priorities: {
        critical: 0,   // 恐怖事件、性能问题
        high: 1,       // 用户交互、动画
        medium: 2,     // 灯光更新、材质更新
        low: 3         // 统计收集、调试信息
      }
    };
    
    // 初始化标志
    console.log(`灯光管理器初始化，平台: ${this.platform}, 版本: ${this.version}`);
  }
  
  /**
   * 检测当前运行平台
   * @returns {string} 平台名称
   */
  detectPlatform() {
    // 检查是否在微信小游戏环境
    if (typeof wx !== 'undefined' && wx.createGame && wx.getSystemInfoSync) {
      return 'weixin_game';
    }
    
    // 检查移动设备
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod/.test(userAgent)) {
      return 'mobile_browser';
    }
    
    // 默认为Web浏览器
    return 'web_browser';
  }
  
  /**
   * 初始化灯光系统
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize() {
    console.log('开始初始化灯光管理器...');
    
    try {
      // 1. 验证配置
      if (!lightConfig.validateConfig()) {
        throw new Error('灯光配置验证失败');
      }
      
      // 2. 预加载恐怖等级配置
      for (let level = 1; level <= 5; level++) {
        const config = lightConfig.getTerrorLevelConfig(level);
        this.terrorState.levelConfigs.set(level, config);
      }
      
      // 3. 设置材质连接
      this.updateMaterialConnection('wood_material');
      
      // 4. 设置初始恐怖等级
      await this.setTerrorLevel(1, true);
      
      // 5. 启动性能监控
      this.startPerformanceMonitoring();
      
      // 6. 初始化完成
      this.initialized = true;
      console.log('灯光管理器初始化成功');
      
      // 打印初始化统计
      this.printInitializationStats();
      
      return true;
    } catch (error) {
      console.error('灯光管理器初始化失败:', error);
      this.initialized = false;
      return false;
    }
  }
  
  /**
   * 设置恐怖等级
   * @param {number} level 恐怖等级 (1-5)
   * @param {boolean} immediate 是否立即切换
   * @returns {Promise<boolean>} 设置是否成功
   */
  async setTerrorLevel(level, immediate = false) {
    if (level < 1 || level > 5) {
      console.warn(`无效的恐怖等级: ${level}，使用最近的有效值`);
      level = Math.max(1, Math.min(5, level));
    }
    
    console.log(`设置恐怖等级: ${level} (${immediate ? '立即' : '渐变'})`);
    
    // 更新目标等级
    this.terrorState.targetLevel = level;
    
    if (immediate) {
      // 立即切换
      this.terrorState.currentLevel = level;
      this.terrorState.transitionProgress = 1;
      await this.applyTerrorLevelConfig(level);
    } else {
      // 开始渐变过渡
      this.terrorState.transitionProgress = 0;
      this.scheduleTerrorTransition(level);
    }
    
    return true;
  }
  
  /**
   * 应用恐怖等级配置
   * @param {number} level 恐怖等级
   * @returns {Promise<boolean>} 应用是否成功
   */
  async applyTerrorLevelConfig(level) {
    const config = this.terrorState.levelConfigs.get(level);
    if (!config) {
      console.error(`未找到恐怖等级 ${level} 的配置`);
      return false;
    }
    
    console.log(`应用恐怖等级 ${level} 配置...`);
    
    try {
      // 1. 禁用不需要的灯光
      await this.disableUnusedLights(config.enabledLights);
      
      // 2. 更新灯光强度和颜色
      for (const [lightType, intensity] of Object.entries(config.intensity)) {
        const color = config.color[lightType];
        await this.updateLightIntensity(lightType, intensity, color);
      }
      
      // 3. 更新灯光动画
      for (const [lightType, animationType] of Object.entries(config.animation)) {
        await this.updateLightAnimation(lightType, animationType);
      }
      
      // 4. 记录统计
      this.lightResources.stats.currentActive = config.enabledLights.length;
      this.lightResources.stats.maxActiveReached = Math.max(
        this.lightResources.stats.maxActiveReached,
        config.enabledLights.length
      );
      
      console.log(`恐怖等级 ${level} 配置应用完成`);
      return true;
    } catch (error) {
      console.error(`应用恐怖等级 ${level} 配置失败:`, error);
      return false;
    }
  }
  
  /**
   * 调度恐怖等级过渡
   * @param {number} targetLevel 目标等级
   */
  scheduleTerrorTransition(targetLevel) {
    const transitionId = `terror_transition_${Date.now()}`;
    const startLevel = this.terrorState.currentLevel;
    const totalSteps = 60; // 约1秒 (60 FPS)
    
    console.log(`开始恐怖等级过渡: ${startLevel} → ${targetLevel}, 共 ${totalSteps} 步`);
    
    this.scheduler.scheduledTasks.set(transitionId, {
      id: transitionId,
      type: 'terror_transition',
      startLevel,
      targetLevel,
      currentStep: 0,
      totalSteps,
      interval: 16, // 约60 FPS
      callback: () => {
        this.updateTerrorTransition(transitionId);
      }
    });
  }
  
  /**
   * 更新恐怖等级过渡
   * @param {string} transitionId 过渡任务ID
   */
  updateTerrorTransition(transitionId) {
    const task = this.scheduler.scheduledTasks.get(transitionId);
    if (!task) return;
    
    task.currentStep++;
    
    // 计算当前过渡进度
    const progress = task.currentStep / task.totalSteps;
    this.terrorState.transitionProgress = progress;
    
    // 计算中间等级
    const currentLevel = task.startLevel + (task.targetLevel - task.startLevel) * progress;
    
    // 应用混合配置
    this.applyMixedTerrorConfig(currentLevel, progress);
    
    // 检查是否完成
    if (task.currentStep >= task.totalSteps) {
      this.terrorState.currentLevel = task.targetLevel;
      this.terrorState.transitionProgress = 1;
      this.scheduler.scheduledTasks.delete(transitionId);
      console.log(`恐怖等级过渡完成: ${task.startLevel} → ${task.targetLevel}`);
    }
  }
  
  /**
   * 应用混合恐怖配置
   * @param {number} mixedLevel 混合等级 (可能为小数)
   * @param {number} progress 过渡进度
   */
  applyMixedTerrorConfig(mixedLevel, progress) {
    const floorLevel = Math.floor(mixedLevel);
    const ceilLevel = Math.ceil(mixedLevel);
    const weight = mixedLevel - floorLevel;
    
    // 获取两个等级的配置
    const floorConfig = this.terrorState.levelConfigs.get(floorLevel);
    const ceilConfig = this.terrorState.levelConfigs.get(ceilLevel);
    
    if (!floorConfig || !ceilConfig) return;
    
    // 混合配置
    const mixedConfig = {
      enabledLights: [...new Set([...floorConfig.enabledLights, ...ceilConfig.enabledLights])],
      intensity: {},
      color: {},
      animation: {}
    };
    
    // 混合强度和颜色
    const allLightTypes = new Set([
      ...Object.keys(floorConfig.intensity),
      ...Object.keys(ceilConfig.intensity)
    ]);
    
    for (const lightType of allLightTypes) {
      const floorIntensity = floorConfig.intensity[lightType] || 0;
      const ceilIntensity = ceilConfig.intensity[lightType] || 0;
      mixedConfig.intensity[lightType] = floorIntensity + (ceilIntensity - floorIntensity) * weight;
      
      // 混合颜色
      if (floorConfig.color[lightType] && ceilConfig.color[lightType]) {
        mixedConfig.color[lightType] = this.mixColors(
          floorConfig.color[lightType],
          ceilConfig.color[lightType],
          weight
        );
      } else if (floorConfig.color[lightType]) {
        mixedConfig.color[lightType] = floorConfig.color[lightType];
      } else if (ceilConfig.color[lightType]) {
        mixedConfig.color[lightType] = ceilConfig.color[lightType];
      }
      
      // 动画：使用目标等级动画
      mixedConfig.animation[lightType] = progress > 0.5 ? 
        ceilConfig.animation[lightType] : 
        floorConfig.animation[lightType];
    }
    
    // 应用混合配置
    this.applyMixedConfigToLights(mixedConfig);
  }
  
  /**
   * 混合两个颜色
   * @param {string} color1 颜色1
   * @param {string} color2 颜色2
   * @param {number} weight 权重 (0-1)
   * @returns {string} 混合后的颜色
   */
  mixColors(color1, color2, weight) {
    // 简化实现：在实际项目中应使用颜色混合算法
    return weight > 0.5 ? color2 : color1;
  }
  
  /**
   * 应用混合配置到灯光
   * @param {Object} mixedConfig 混合配置
   */
  applyMixedConfigToLights(mixedConfig) {
    // 在实际项目中，这里会调用灯光工厂更新每个灯光
    console.log('应用混合灯光配置:', {
      enabledLights: mixedConfig.enabledLights.length,
      intensities: Object.keys(mixedConfig.intensity).length,
      colors: Object.keys(mixedConfig.color).length
    });
  }
  
  /**
   * 禁用不需要的灯光
   * @param {Array<string>} enabledLights 需要启用的灯光列表
   * @returns {Promise<void>}
   */
  async disableUnusedLights(enabledLights) {
    const enabledSet = new Set(enabledLights);
    
    // 在实际项目中，这里会禁用不在enabledSet中的灯光
    console.log(`灯光调度: 启用 ${enabledLights.length} 个灯光`);
  }
  
  /**
   * 更新灯光强度
   * @param {string} lightType 灯光类型
   * @param {number} intensity 强度 (0-1)
   * @param {string} color 颜色
   * @returns {Promise<void>}
   */
  async updateLightIntensity(lightType, intensity, color) {
    // 在实际项目中，这里会调用灯光工厂更新指定灯光
    console.log(`更新灯光 ${lightType}: 强度=${intensity}, 颜色=${color}`);
  }
  
  /**
   * 更新灯光动画
   * @param {string} lightType 灯光类型
   * @param {string} animationType 动画类型
   * @returns {Promise<void>}
   */
  async updateLightAnimation(lightType, animationType) {
    // 在实际项目中，这里会调用动画控制器更新指定灯光动画
    console.log(`更新灯光动画 ${lightType}: ${animationType}`);
  }
  
  /**
   * 更新材质连接
   * @param {string} materialType 材质类型
   * @returns {boolean} 更新是否成功
   */
  updateMaterialConnection(materialType) {
    const config = lightConfig.getMaterialConfig(materialType);
    if (!config) {
      console.warn(`无法更新材质连接: 未找到材质类型 ${materialType}`);
      return false;
    }
    
    this.materialConnections.currentMaterial = materialType;
    this.materialConnections.materialConfig = config;
    this.materialConnections.lastMaterialUpdate = Date.now();
    
    console.log(`材质连接更新: ${materialType}`);
    
    // 根据材质配置调整灯光
    this.adjustLightsForMaterial(config);
    
    return true;
  }
  
  /**
   * 根据材质配置调整灯光
   * @param {Object} materialConfig 材质配置
   */
  adjustLightsForMaterial(materialConfig) {
    console.log(`根据材质调整灯光: ${materialConfig.recommendedLights.length} 个推荐灯光`);
    
    // 在实际项目中，这里会根据材质配置调整灯光参数
    // 例如：更新推荐灯光的强度、颜色、动画频率等
  }
  
  /**
   * 触发恐怖事件
   * @param {string} eventName 事件名称
   * @param {Object} eventData 事件数据
   * @returns {Promise<boolean>} 触发是否成功
   */
  async triggerTerrorEvent(eventName, eventData = {}) {
    // 检查冷却时间
    if (this.isEventOnCooldown(eventName)) {
      console.log(`事件 ${eventName} 处于冷却中，跳过触发`);
      return false;
    }
    
    const eventConfig = lightConfig.getEventConfig(eventName);
    if (!eventConfig) {
      console.warn(`无法触发事件: 未找到事件配置 ${eventName}`);
      return false;
    }
    
    console.log(`触发恐怖事件: ${eventName}`);
    
    // 创建事件对象
    const eventId = `event_${eventName}_${Date.now()}`;
    const terrorEvent = {
      id: eventId,
      name: eventName,
      config: eventConfig,
      data: eventData,
      startTime: Date.now(),
      status: 'pending'
    };
    
    // 添加到事件系统
    this.terrorState.terrorEvents.set(eventId, terrorEvent);
    this.eventSystem.pendingEvents.push(terrorEvent);
    
    // 事件统计
    this.eventSystem.stats.totalEvents++;
    
    // 处理事件
    await this.processEvents();
    
    return true;
  }
  
  /**
   * 检查事件是否处于冷却状态
   * @param {string} eventName 事件名称
   * @returns {boolean} 是否处于冷却状态
   */
  isEventOnCooldown(eventName) {
    const cooldownEnd = this.eventSystem.cooldownTimers.get(eventName);
    if (!cooldownEnd) return false;
    
    return Date.now() < cooldownEnd;
  }
  
  /**
   * 处理待处理事件
   */
  async processEvents() {
    const maxConcurrentEvents = 2; // 最大同时处理事件数
    
    while (this.eventSystem.pendingEvents.length > 0 && 
           this.eventSystem.processingEvents.length < maxConcurrentEvents) {
      const event = this.eventSystem.pendingEvents.shift();
      
      if (!event) continue;
      
      // 开始处理事件
      event.status = 'processing';
      this.eventSystem.processingEvents.push(event);
      
      try {
        await this.executeEvent(event);
        event.status = 'completed';
        this.eventSystem.stats.processedEvents++;
      } catch (error) {
        console.error(`处理事件失败: ${event.name}`, error);
        event.status = 'failed';
        event.error = error.message;
        this.eventSystem.stats.failedEvents++;
      } finally {
        // 从处理中移除
        const index = this.eventSystem.processingEvents.indexOf(event);
        if (index > -1) {
          this.eventSystem.processingEvents.splice(index, 1);
        }
        
        // 添加到历史记录
        this.eventSystem.eventHistory.push(event);
        
        // 设置冷却时间
        if (event.config && event.config.cooldown) {
          const cooldownEnd = Date.now() + event.config.cooldown;
          this.eventSystem.cooldownTimers.set(event.name, cooldownEnd);
        }
      }
    }
  }
  
  /**
   * 执行事件
   * @param {Object} event 事件对象
   */
  async executeEvent(event) {
    console.log(`执行事件: ${event.name}`);
    
    // 在实际项目中，这里会根据事件配置执行具体的灯光操作
    // 例如：触发闪光灯、启动特定动画、改变灯光颜色等
    
    // 模拟执行时间
    await new Promise(resolve => setTimeout(resolve, event.config.duration || 1000));
    
    console.log(`事件执行完成: ${event.name}`);
  }
  
  /**
   * 开始性能监控
   */
  startPerformanceMonitoring() {
    console.log('启动性能监控...');
    
    // 设置性能采样定时器
    setInterval(() => {
      this.samplePerformance();
    }, this.performanceMonitor.samplingInterval);
    
    // 初始采样
    this.samplePerformance();
  }
  
  /**
   * 性能采样
   */
  samplePerformance() {
    const now = Date.now();
    
    // 计算FPS
    if (this.performanceMonitor.lastFrameTime > 0) {
      const frameTime = now - this.performanceMonitor.lastFrameTime;
      this.performanceMonitor.frameTimes.push(frameTime);
      
      // 保持最近的60帧数据
      if (this.performanceMonitor.frameTimes.length > 60) {
        this.performanceMonitor.frameTimes.shift();
      }
      
      // 计算平均帧时间
      const totalFrameTime = this.performanceMonitor.frameTimes.reduce((sum, time) => sum + time, 0);
      this.performanceMonitor.averageFrameTime = totalFrameTime / this.performanceMonitor.frameTimes.length;
      this.performanceMonitor.fps = 1000 / this.performanceMonitor.averageFrameTime;
      
      // 更新性能等级
      this.updatePerformanceLevel();
    }
    
    // 估算内存使用
    this.estimateMemoryUsage();
    
    // 更新统计
    this.performanceMonitor.lastSampleTime = now;
    this.performanceMonitor.sampleCount++;
    
    // 记录性能日志
    if (this.debugConfig.performanceMonitoring.enabled && 
        this.performanceMonitor.sampleCount % 10 === 0) {
      this.logPerformanceMetrics();
    }
  }
  
  /**
   * 更新性能等级
   */
  updatePerformanceLevel() {
    const fps = this.performanceMonitor.fps;
    
    if (fps >= this.performanceConfig.performanceLevels.high.targetFPS) {
      this.performanceMonitor.performanceLevel = 'high';
    } else if (fps >= this.performanceConfig.performanceLevels.medium.targetFPS) {
      this.performanceMonitor.performanceLevel = 'medium';
    } else {
      this.performanceMonitor.performanceLevel = 'low';
      
      // 低性能时触发优化
      if (fps < this.performanceConfig.fpsThresholds.critical) {
        this.triggerPerformanceOptimization();
      }
    }
  }
  
  /**
   * 触发性能优化
   */
  triggerPerformanceOptimization() {
    console.warn('性能优化触发: 帧率过低');
    
    // 降低灯光质量
    this.reduceLightQuality();
    
    // 减少活动灯光数量
    this.reduceActiveLights();
    
    // 降低动画质量
    this.reduceAnimationQuality();
  }
  
  /**
   * 降低灯光质量
   */
  reduceLightQuality() {
    console.log('降低灯光质量以提升性能');
    // 在实际项目中，这里会降低灯光渲染质量
  }
  
  /**
   * 减少活动灯光数量
   */
  reduceActiveLights() {
    console.log('减少活动灯光数量以提升性能');
    // 在实际项目中，这里会禁用部分非关键灯光
  }
  
  /**
   * 降低动画质量
   */
  reduceAnimationQuality() {
    console.log('降低动画质量以提升性能');
    // 在实际项目中，这里会简化动画效果
  }
  
  /**
   * 估算内存使用
   */
  estimateMemoryUsage() {
    // 计算灯光系统内存
    let lightsMemory = 0;
    let animationsMemory = 0;
    let configMemory = 0;
    
    // 灯光实例内存估算
    lightsMemory = this.lightResources.stats.currentActive * 0.5; // 每个灯光约0.5KB
    
    // 动画实例内存估算
    animationsMemory = this.animationResources.stats.currentActive * 0.3; // 每个动画约0.3KB
    
    // 配置内存
    const configEstimate = lightConfig.getMemoryEstimate();
    configMemory = configEstimate.estimateTotalKB;
    
    // 更新统计
    this.lightResources.stats.memoryUsageKB = Math.round((lightsMemory + animationsMemory + configMemory) * 100) / 100;
    
    // 计算性能评分
    this.calculatePerformanceScore();
  }
  
  /**
   * 计算性能评分
   */
  calculatePerformanceScore() {
    const fps = this.performanceMonitor.fps;
    const memory = this.lightResources.stats.memoryUsageKB;
    const activeLights = this.lightResources.stats.currentActive;
    
    // 评分算法（简化）
    let fpsScore = Math.min(100, (fps / 60) * 100);
    let memoryScore = Math.max(0, 100 - (memory / 32) * 100); // 32KB为上限
    let lightsScore = Math.max(0, 100 - (activeLights / 8) * 100); // 8个灯光为上限
    
    // 加权平均
    const performanceScore = (fpsScore * 0.5 + memoryScore * 0.3 + lightsScore * 0.2);
    
    this.lightResources.stats.performanceScore = Math.round(performanceScore);
    this.animationResources.stats.performanceScore = Math.round(performanceScore * 0.9); // 动画稍低
  }
  
  /**
   * 记录性能指标
   */
  logPerformanceMetrics() {
    console.log('性能指标:', {
      fps: Math.round(this.performanceMonitor.fps),
      memoryKB: this.lightResources.stats.memoryUsageKB,
      performanceLevel: this.performanceMonitor.performanceLevel,
      activeLights: this.lightResources.stats.currentActive,
      activeAnimations: this.animationResources.stats.currentActive,
      performanceScore: this.lightResources.stats.performanceScore
    });
  }
  
  /**
   * 打印初始化统计
   */
  printInitializationStats() {
    console.log('灯光管理器初始化统计:', {
      platform: this.platform,
      version: this.version,
      maxActiveLights: this.platformConfig.maxActiveLights,
      maxAnimations: this.platformConfig.maxAnimations,
      memoryLimitKB: this.platformConfig.maxMemoryKB,
      terrorLevels: this.terrorState.levelConfigs.size,
      eventTypes: Object.keys(lightConfig.eventLightMapping).length,
      materialTypes: Object.keys(lightConfig.materialLightMapping).length,
      performanceLevel: this.performanceMonitor.performanceLevel
    });
  }
  
  /**
   * 获取管理器状态
   * @returns {Object} 管理器状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      version: this.version,
      platform: this.platform,
      
      terrorState: {
        currentLevel: this.terrorState.currentLevel,
        targetLevel: this.terrorState.targetLevel,
        transitionProgress: this.terrorState.transitionProgress,
        sanityValue: this.terrorState.sanityValue,
        activeEvents: this.terrorState.terrorEvents.size
      },
      
      resources: {
        lights: this.lightResources.stats,
        animations: this.animationResources.stats
      },
      
      performance: {
        fps: Math.round(this.performanceMonitor.fps),
        memoryKB: this.lightResources.stats.memoryUsageKB,
        performanceLevel: this.performanceMonitor.performanceLevel,
        score: this.lightResources.stats.performanceScore
      },
      
      events: this.eventSystem.stats,
      
      materialConnection: {
        currentMaterial: this.materialConnections.currentMaterial,
        lastUpdate: this.materialConnections.lastMaterialUpdate
      }
    };
  }
  
  /**
   * 更新管理器
   * @param {number} deltaTime 时间增量 (毫秒)
   */
  update(deltaTime = 16) {
    if (!this.initialized) return;
    
    // 更新时间戳
    this.performanceMonitor.lastFrameTime = Date.now();
    
    // 更新恐怖状态
    this.updateTerrorState(deltaTime);
    
    // 处理事件
    this.processEvents();
    
    // 更新调度任务
    this.updateScheduledTasks(deltaTime);
    
    // 更新材质连接
    this.updateMaterialConnectionIfNeeded();
    
    // 更新性能监控
    this.performanceMonitor.frameTimes.push(deltaTime);
    if (this.performanceMonitor.frameTimes.length > 60) {
      this.performanceMonitor.frameTimes.shift();
    }
  }
  
  /**
   * 更新恐怖状态
   * @param {number} deltaTime 时间增量
   */
  updateTerrorState(deltaTime) {
    // 更新理智值
    const now = Date.now();
    const timeSinceLastUpdate = now - this.terrorState.lastSanityUpdate;
    
    if (timeSinceLastUpdate > 1000) { // 每秒更新一次
      const sanityDropRate = this.calculateSanityDropRate();
      this.terrorState.sanityValue = Math.max(0, this.terrorState.sanityValue - sanityDropRate);
      this.terrorState.lastSanityUpdate = now;
      
      // 根据理智值更新恐怖等级
      this.updateTerrorLevelFromSanity();
    }
  }
  
  /**
   * 计算理智值下降速率
   * @returns {number} 下降速率
   */
  calculateSanityDropRate() {
    // 基础下降速率
    let dropRate = 0.1;
    
    // 恐怖等级越高，下降越快
    dropRate += (this.terrorState.currentLevel - 1) * 0.05;
    
    // 有恐怖事件时下降更快
    if (this.terrorState.terrorEvents.size > 0) {
      dropRate += 0.1 * this.terrorState.terrorEvents.size;
    }
    
    return dropRate;
  }
  
  /**
   * 根据理智值更新恐怖等级
   */
  updateTerrorLevelFromSanity() {
    const sanity = this.terrorState.sanityValue;
    let targetLevel = 1;
    
    if (sanity >= 81) targetLevel = 1;
    else if (sanity >= 61) targetLevel = 2;
    else if (sanity >= 41) targetLevel = 3;
    else if (sanity >= 21) targetLevel = 4;
    else targetLevel = 5;
    
    // 如果目标等级不同，开始过渡
    if (targetLevel !== this.terrorState.targetLevel) {
      this.setTerrorLevel(targetLevel, false);
    }
  }
  
  /**
   * 更新调度任务
   * @param {number} deltaTime 时间增量
   */
  updateScheduledTasks(deltaTime) {
    for (const [taskId, task] of this.scheduler.scheduledTasks) {
      // 检查是否需要执行
      if (Date.now() - task.lastRunTime >= task.interval) {
        task.lastRunTime = Date.now();
        
        // 执行任务回调
        if (typeof task.callback === 'function') {
          try {
            task.callback();
          } catch (error) {
            console.error(`调度任务执行失败: ${taskId}`, error);
          }
        }
      }
    }
  }
  
  /**
   * 如果需要，更新材质连接
   */
  updateMaterialConnectionIfNeeded() {
    // 在实际项目中，这里会根据场景变化更新材质连接
    // 例如：玩家移动到不同区域、交互不同物体等
  }
  
  /**
   * 销毁管理器
   */
  destroy() {
    console.log('销毁灯光管理器...');
    
    // 清理资源
    this.lightResources.lights.clear();
    this.lightResources.activeLights.clear();
    this.lightResources.disabledLights.clear();
    
    this.animationResources.animations.clear();
    this.animationResources.activeAnimations.clear();
    
    this.terrorState.terrorEvents.clear();
    this.terrorState.levelConfigs.clear();
    
    this.eventSystem.cooldownTimers.clear();
    this.scheduler.scheduledTasks.clear();
    
    // 重置状态
    this.initialized = false;
    
    console.log('灯光管理器已销毁');
  }
}

// 创建全局管理器实例
const lightManager = new LightManager();

// 导出管理器
export { LightManager, lightManager };

// 在非ES6环境中提供兼容性支持
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LightManager, lightManager };
}

console.log(`灯光管理器创建完成，等待初始化`);
console.log(`配置内存估算: ${lightConfig.getMemoryEstimate().configKB} KB`);