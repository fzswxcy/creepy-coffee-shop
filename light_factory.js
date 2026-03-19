// 🌟 灯光工厂系统 - 《微恐咖啡厅》微信小游戏
// 版本: 1.0.0
// 创建时间: 2026年3月5日 11:00 GMT+8
// 作者: NIKO (CEO/主架构师)
// 内存目标: <4KB
// 性能目标: 手机端30FPS稳定，CPU占用<25%

/**
 * 🏭 灯光工厂系统
 * 负责创建和管理7种不同类型的灯光
 * 实现对象池管理，减少垃圾回收
 * 支持材质-灯光联动，恐怖等级切换
 */
class LightFactory {
  constructor(options = {}) {
    // 系统配置
    this.config = {
      maxLights: 4,                // 同时最大灯光数量 (微信小游戏限制)
      poolSize: 10,                // 对象池大小
      mobileOptimized: true,       // 手机端优化
      debugMode: false,            // 调试模式
      performanceMode: 'balanced', // 性能模式: balanced/performance/quality
      ...options
    };

    // 灯光对象池
    this.lightPool = {
      MainLight: [],          // 主环境灯池
      BarSpotlight: [],       // 吧台聚焦灯池  
      TerrorAlertLight: [],   // 恐怖警示灯池
      GhostBlueLight: [],     // 幽灵蓝光池
      TerrorAmbientLight: [], // 恐怖氛围灯池
      EventTriggerLight: [],  // 事件触发灯池
      UIFeedbackLight: []     // UI反馈灯池
    };

    // 活跃灯光列表
    this.activeLights = new Map(); // Map<lightId, lightObject>

    // 性能监控
    this.performanceStats = {
      totalCreated: 0,
      totalRecycled: 0,
      activeCount: 0,
      poolHits: 0,
      poolMisses: 0,
      memoryUsage: 0,
      lastUpdateTime: Date.now()
    };

    // 初始化对象池
    this.initializePools();
    
    console.log('🔦 灯光工厂系统初始化完成');
    console.log(`📊 配置: 最大灯光数=${this.config.maxLights}, 对象池大小=${this.config.poolSize}`);
  }

  /**
   * 🎯 初始化对象池
   * 预创建灯光对象，减少运行时GC压力
   */
  initializePools() {
    console.log('🔄 初始化灯光对象池...');
    
    for (const lightType in this.lightPool) {
      for (let i = 0; i < this.config.poolSize; i++) {
        const light = this.createLightObject(lightType);
        this.lightPool[lightType].push(light);
      }
    }
    
    console.log(`✅ 对象池初始化完成，总预创建对象: ${Object.keys(this.lightPool).length * this.config.poolSize}`);
  }

  /**
   * 🏗️ 创建灯光对象
   * @param {string} lightType - 灯光类型
   * @returns {Object} 灯光对象
   */
  createLightObject(lightType) {
    const baseLight = {
      id: `light_${lightType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: lightType,
      position: { x: 0, y: 0, z: 0 },
      color: this.getDefaultColor(lightType),
      intensity: this.getDefaultIntensity(lightType),
      range: this.getDefaultRange(lightType),
      enabled: false,
      terrorLevel: 0,          // 恐怖等级 (0-100)
      materialLink: null,      // 关联的材质ID
      animation: null,         // 当前动画
      lastUpdate: Date.now(),
      performance: {
        updateCount: 0,
        lastRenderTime: 0,
        memoryFootprint: this.getMemoryFootprint(lightType)
      }
    };

    // 根据灯光类型添加特殊属性
    switch (lightType) {
      case 'MainLight':
        Object.assign(baseLight, {
          isAmbient: true,
          castShadows: false,
          shadowQuality: 'low'
        });
        break;

      case 'BarSpotlight':
        Object.assign(baseLight, {
          isSpotlight: true,
          angle: Math.PI / 6,  // 30度
          penumbra: 0.2,
          target: { x: 0, y: -1, z: 0 }
        });
        break;

      case 'TerrorAlertLight':
        Object.assign(baseLight, {
          isFlashing: true,
          flashSpeed: 500,     // 闪烁速度 (ms)
          flashIntensity: 0.8,
          warningColor: 'rgba(255, 50, 50, 1.0)'
        });
        break;

      case 'GhostBlueLight':
        Object.assign(baseLight, {
          isFollowing: false,
          followTarget: null,
          followSpeed: 0.05,
          ghostId: null,
          pulseSpeed: 1000
        });
        break;

      case 'TerrorAmbientLight':
        Object.assign(baseLight, {
          isGlobal: true,
          affectMaterials: true,
          terrorSync: true,
          progressionSpeed: 0.01
        });
        break;

      case 'EventTriggerLight':
        Object.assign(baseLight, {
          isEvent: true,
          eventType: null,
          duration: 3000,
          intensityCurve: 'easeOutQuad',
          soundSync: false
        });
        break;

      case 'UIFeedbackLight':
        Object.assign(baseLight, {
          isUI: true,
          feedbackType: 'tap',
          responseTime: 100,
          fadeSpeed: 300,
          touchPosition: null
        });
        break;
    }

    this.performanceStats.totalCreated++;
    return baseLight;
  }

  /**
   * 🎨 获取默认颜色
   * @param {string} lightType - 灯光类型
   * @returns {string} 颜色值
   */
  getDefaultColor(lightType) {
    const colorMap = {
      MainLight: 'rgba(255, 255, 220, 0.8)',      // 温暖黄色
      BarSpotlight: 'rgba(255, 240, 200, 0.9)',   // 吧台暖光
      TerrorAlertLight: 'rgba(255, 50, 50, 0.7)', // 警报红色
      GhostBlueLight: 'rgba(100, 150, 255, 0.6)', // 幽灵蓝色
      TerrorAmbientLight: 'rgba(150, 100, 200, 0.5)', // 恐怖紫色
      EventTriggerLight: 'rgba(255, 100, 50, 0.8)', // 事件橙色
      UIFeedbackLight: 'rgba(100, 200, 255, 0.7)' // UI反馈蓝色
    };
    return colorMap[lightType] || 'rgba(255, 255, 255, 1.0)';
  }

  /**
   * 💡 获取默认强度
   * @param {string} lightType - 灯光类型
   * @returns {number} 强度值 (0-1)
   */
  getDefaultIntensity(lightType) {
    const intensityMap = {
      MainLight: 0.8,
      BarSpotlight: 0.9,
      TerrorAlertLight: 0.7,
      GhostBlueLight: 0.6,
      TerrorAmbientLight: 0.5,
      EventTriggerLight: 0.8,
      UIFeedbackLight: 0.7
    };
    return intensityMap[lightType] || 0.5;
  }

  /**
   * 📏 获取默认范围
   * @param {string} lightType - 灯光类型
   * @returns {number} 灯光范围
   */
  getDefaultRange(lightType) {
    const rangeMap = {
      MainLight: 100,        // 全局照明
      BarSpotlight: 15,      // 吧台区域
      TerrorAlertLight: 20,  // 警示区域
      GhostBlueLight: 10,    // 幽灵跟随
      TerrorAmbientLight: 50, // 恐怖氛围
      EventTriggerLight: 25, // 事件区域
      UIFeedbackLight: 5     // UI反馈区域
    };
    return rangeMap[lightType] || 10;
  }

  /**
   * 🧠 获取内存占用估算
   * @param {string} lightType - 灯光类型
   * @returns {number} 内存占用量 (bytes)
   */
  getMemoryFootprint(lightType) {
    // 基于灯光类型的复杂程度估算内存
    const footprintMap = {
      MainLight: 120,
      BarSpotlight: 180,
      TerrorAlertLight: 200,
      GhostBlueLight: 220,
      TerrorAmbientLight: 150,
      EventTriggerLight: 190,
      UIFeedbackLight: 130
    };
    return footprintMap[lightType] || 150;
  }

  /**
   * 🆕 创建新灯光
   * @param {string} lightType - 灯光类型
   * @param {Object} options - 配置选项
   * @returns {Object} 灯光对象
   */
  createLight(lightType, options = {}) {
    // 检查是否超过最大灯光数限制
    if (this.performanceStats.activeCount >= this.config.maxLights) {
      console.warn(`⚠️ 已达到最大灯光数限制 (${this.config.maxLights})，尝试回收未使用的灯光`);
      this.cleanupInactiveLights();
      
      if (this.performanceStats.activeCount >= this.config.maxLights) {
        throw new Error(`🚨 无法创建新灯光: 已达到微信小游戏平台限制 (${this.config.maxLights}个同时激活灯光)`);
      }
    }

    let light;
    
    // 尝试从对象池获取
    if (this.lightPool[lightType] && this.lightPool[lightType].length > 0) {
      light = this.lightPool[lightType].pop();
      this.performanceStats.poolHits++;
      console.log(`♻️ 从对象池复用 ${lightType} (剩余: ${this.lightPool[lightType].length})`);
    } else {
      // 对象池为空，创建新对象
      light = this.createLightObject(lightType);
      this.performanceStats.poolMisses++;
      console.log(`🆕 创建新的 ${lightType} 对象`);
    }

    // 应用配置选项
    Object.assign(light, {
      position: options.position || light.position,
      color: options.color || light.color,
      intensity: options.intensity || light.intensity,
      range: options.range || light.range,
      enabled: true,
      terrorLevel: options.terrorLevel || 0,
      materialLink: options.materialLink || null,
      animation: options.animation || null,
      lastUpdate: Date.now()
    });

    // 添加到活跃列表
    this.activeLights.set(light.id, light);
    this.performanceStats.activeCount++;
    
    // 更新内存使用统计
    this.updateMemoryUsage();
    
    console.log(`✅ 创建 ${lightType} 成功 (ID: ${light.id})`);
    console.log(`📊 活跃灯光数: ${this.performanceStats.activeCount}/${this.config.maxLights}`);
    
    return light;
  }

  /**
   * 🗑️ 回收灯光到对象池
   * @param {string} lightId - 灯光ID
   */
  recycleLight(lightId) {
    const light = this.activeLights.get(lightId);
    if (!light) {
      console.warn(`⚠️ 灯光 ${lightId} 未找到，无法回收`);
      return false;
    }

    // 重置灯光状态
    light.enabled = false;
    light.animation = null;
    light.materialLink = null;
    light.lastUpdate = Date.now();

    // 放回对象池
    if (this.lightPool[light.type]) {
      this.lightPool[light.type].push(light);
      this.activeLights.delete(lightId);
      
      this.performanceStats.activeCount--;
      this.performanceStats.totalRecycled++;
      
      console.log(`♻️ 回收灯光 ${lightId} 到 ${light.type} 池`);
      console.log(`📊 活跃灯光数: ${this.performanceStats.activeCount}/${this.config.maxLights}`);
      
      return true;
    }
    
    console.error(`❌ 无法回收灯光 ${lightId}: 类型 ${light.type} 的对象池不存在`);
    return false;
  }

  /**
   * 🧹 清理未使用的灯光
   * 自动回收长时间未更新的灯光
   */
  cleanupInactiveLights() {
    const now = Date.now();
    const inactiveThreshold = 10000; // 10秒未更新视为不活跃
    
    let recycledCount = 0;
    
    for (const [lightId, light] of this.activeLights.entries()) {
      if (!light.enabled && (now - light.lastUpdate) > inactiveThreshold) {
        if (this.recycleLight(lightId)) {
          recycledCount++;
        }
      }
    }
    
    if (recycledCount > 0) {
      console.log(`🧹 清理完成，回收了 ${recycledCount} 个不活跃灯光`);
    }
    
    return recycledCount;
  }

  /**
   * 🔄 更新灯光系统
   * 每帧调用，更新所有活跃灯光
   * @param {number} deltaTime - 时间增量 (毫秒)
   */
  update(deltaTime = 16.67) { // 默认60FPS的时间增量
    const updateStart = Date.now();
    
    for (const [lightId, light] of this.activeLights.entries()) {
      if (!light.enabled) continue;
      
      // 更新灯光状态
      light.lastUpdate = Date.now();
      light.performance.updateCount++;
      
      // 处理灯光动画
      if (light.animation) {
        this.updateLightAnimation(light, deltaTime);
      }
      
      // 更新恐怖等级影响
      if (light.terrorLevel > 0) {
        this.updateTerrorEffects(light, deltaTime);
      }
      
      // 更新材质联动
      if (light.materialLink) {
        this.updateMaterialLink(light, deltaTime);
      }
    }
    
    // 性能监控更新
    this.performanceStats.lastUpdateTime = Date.now() - updateStart;
    
    // 定期清理
    if (Date.now() % 5000 < deltaTime) { // 每5秒清理一次
      this.cleanupInactiveLights();
    }
  }

  /**
   * 🎞️ 更新灯光动画
   * @param {Object} light - 灯光对象
   * @param {number} deltaTime - 时间增量
   */
  updateLightAnimation(light, deltaTime) {
    // 简化的动画更新逻辑
    // 实际实现中会根据动画类型进行不同的更新
    switch (light.animation) {
      case 'flicker':
        // 随机闪烁效果
        if (Math.random() < 0.1) {
          light.intensity = Math.random() * 0.5 + 0.5;
        }
        break;
        
      case 'pulse':
        // 脉冲效果
        const pulseTime = Date.now() % 2000 / 2000; // 2秒周期
        light.intensity = 0.5 + 0.5 * Math.sin(pulseTime * Math.PI * 2);
        break;
        
      case 'fade':
        // 淡入淡出效果
        const fadeTime = Date.now() % 3000 / 3000; // 3秒周期
        light.intensity = 0.3 + 0.7 * Math.abs(Math.sin(fadeTime * Math.PI));
        break;
    }
  }

  /**
   * 😱 更新恐怖效果
   * @param {Object} light - 灯光对象
   * @param {number} deltaTime - 时间增量
   */
  updateTerrorEffects(light, deltaTime) {
    const terrorFactor = light.terrorLevel / 100;
    
    switch (light.type) {
      case 'TerrorAlertLight':
        // 恐怖等级越高，闪烁越快
        const flashSpeed = Math.max(100, 1000 - terrorFactor * 900);
        if (Date.now() % flashSpeed < 50) {
          light.intensity = 0.2 + terrorFactor * 0.8;
        }
        break;
        
      case 'GhostBlueLight':
        // 幽灵光随着恐怖等级变亮
        light.intensity = 0.3 + terrorFactor * 0.5;
        light.color = `rgba(100, 150, 255, ${0.3 + terrorFactor * 0.5})`;
        break;
        
      case 'TerrorAmbientLight':
        // 恐怖氛围光整体变暗
        light.intensity = 0.7 - terrorFactor * 0.4;
        light.color = `rgba(150, 100, 200, ${0.5 - terrorFactor * 0.3})`;
        break;
    }
  }

  /**
   * 🎨 更新材质联动
   * @param {Object} light - 灯光对象
   * @param {number} deltaTime - 时间增量
   */
  updateMaterialLink(light, deltaTime) {
    // 简化版本：灯光强度影响材质亮度
    // 实际实现中会通过事件系统与材质系统通信
    if (light.materialLink && light.intensity) {
      // 这里应该调用材质系统的更新方法
      // materialSystem.updateMaterialBrightness(light.materialLink, light.intensity);
    }
  }

  /**
   * 📊 更新内存使用统计
   */
  updateMemoryUsage() {
    let totalMemory = 0;
    
    // 计算活跃灯光内存
    for (const light of this.activeLights.values()) {
      totalMemory += light.performance.memoryFootprint;
    }
    
    // 计算对象池内存 (简化估算)
    for (const lightType in this.lightPool) {
      totalMemory += this.lightPool[lightType].length * this.getMemoryFootprint(lightType);
    }
    
    this.performanceStats.memoryUsage = totalMemory;
  }

  /**
   * 📈 获取性能统计
   * @returns {Object} 性能统计信息
   */
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      poolUtilization: this.calculatePoolUtilization(),
      memoryUsageKB: (this.performanceStats.memoryUsage / 1024).toFixed(2),
      activeTypes: this.getActiveLightTypes(),
      updateTime: this.performanceStats.lastUpdateTime
    };
  }

  /**
   * 📊 计算对象池利用率
   * @returns {Object} 各类型对象池利用率
   */
  calculatePoolUtilization() {
    const utilization = {};
    for (const lightType in this.lightPool) {
      const total = this.config.poolSize;
      const available = this.lightPool[lightType].length;
      const used = total - available;
      utilization[lightType] = {
        total,
        available,
        used,
        utilization: ((used / total) * 100).toFixed(1) + '%'
      };
    }
    return utilization;
  }

  /**
   * 📋 获取活跃灯光类型统计
   * @returns {Object} 各类型活跃灯光数量
   */
  getActiveLightTypes() {
    const types = {};
    for (const light of this.activeLights.values()) {
      types[light.type] = (types[light.type] || 0) + 1;
    }
    return types;
  }

  /**
   * 🎯 获取灯光配置
   * @returns {Object} 当前配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * ⚙️ 更新配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    console.log('⚙️ 灯光工厂配置已更新:', this.config);
  }

  /**
   * 🧪 测试灯光创建
   * 用于快速验证灯光工厂功能
   */
  testCreation() {
    console.log('🧪 开始灯光创建测试...');
    
    const testLights = [];
    
    try {
      // 测试创建所有类型的灯光
      const lightTypes = Object.keys(this.lightPool);
      for (const lightType of lightTypes) {
        console.log(`🧪 测试创建 ${lightType}...`);
        const light = this.createLight(lightType, {
          position: { x: Math.random() * 20 - 10, y: 2, z: Math.random() * 20 - 10 },
          terrorLevel: Math.random() * 100
        });
        testLights.push(light);
      }
      
      console.log('✅ 所有灯光类型创建测试通过');
      console.log(`📊 测试结果: 创建了 ${testLights.length} 个灯光`);
      
      // 显示性能统计
      console.log('📈 性能统计:', this.getPerformanceStats());
      
    } catch (error) {
      console.error('❌ 灯光创建测试失败:', error.message);
    }
    
    return testLights;
  }

  /**
   * 🔄 重置灯光工厂
   * 回收所有灯光，重置统计信息
   */
  reset() {
    console.log('🔄 重置灯光工厂...');
    
    // 回收所有活跃灯光
    const lightIds = Array.from(this.activeLights.keys());
    for (const lightId of lightIds) {
      this.recycleLight(lightId);
    }
    
    // 重置性能统计
    this.performanceStats = {
      totalCreated: 0,
      totalRecycled: 0,
      activeCount: 0,
      poolHits: 0,
      poolMisses: 0,
      memoryUsage: 0,
      lastUpdateTime: Date.now()
    };
    
    console.log('✅ 灯光工厂已重置');
  }

  /**
   * 💾 销毁灯光工厂
   * 清理所有资源
   */
  destroy() {
    console.log('💾 销毁灯光工厂...');
    
    this.reset();
    
    // 清空对象池
    for (const lightType in this.lightPool) {
      this.lightPool[lightType] = [];
    }
    
    this.activeLights.clear();
    
    console.log('✅ 灯光工厂已销毁，所有资源已释放');
  }
}

// 📦 导出灯光工厂
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LightFactory;
}

// 🎮 简单的自测试代码
if (typeof window !== 'undefined' && window.testLightFactory) {
  console.log('🔧 灯光工厂系统加载完成，开始自测试...');
  
  // 创建灯光工厂实例
  const lightFactory = new LightFactory({
    maxLights: 4,
    poolSize: 5,
    debugMode: true
  });
  
  // 运行测试
  lightFactory.testCreation();
  
  // 模拟几帧更新
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      lightFactory.update();
      console.log(`📈 第${i+1}帧性能统计:`, lightFactory.getPerformanceStats());
    }, i * 1000);
  }
  
  // 最后显示总结
  setTimeout(() => {
    console.log('🎯 灯光工厂系统测试完成');
    console.log('📊 最终统计:', lightFactory.getPerformanceStats());
    lightFactory.destroy();
  }, 4000);
}