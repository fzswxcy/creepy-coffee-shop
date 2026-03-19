/**
 * 灯光配置系统 - 微恐咖啡厅微信小游戏
 * 版本: 1.0.0
 * 创建时间: 2026-03-05 12:00 GMT+8
 * 作者: NIKO (CEO/主架构师)
 * 
 * 功能: 管理灯光系统的所有配置参数
 *      包括恐怖等级灯光映射、事件触发、性能参数等
 * 特点: 轻量级设计，适合微信小游戏平台
 */

class LightConfig {
  constructor() {
    // 基础配置版本
    this.configVersion = '1.0.0';
    
    // 性能配置
    this.performanceConfig = {
      // 内存优化参数
      maxActiveLights: 4,          // 微信小游戏限制：最多同时4个灯光
      lightPoolSize: 8,            // 灯光对象池大小
      animationPoolSize: 6,        // 动画对象池大小
      
      // 性能自适应参数
      performanceLevels: {
        high: { targetFPS: 60, animationQuality: 'high' },      // 高性能设备
        medium: { targetFPS: 45, animationQuality: 'medium' },   // 中等性能设备
        low: { targetFPS: 30, animationQuality: 'low' }          // 低性能设备
      },
      
      // 帧率监控阈值
      fpsThresholds: {
        critical: 20,   // 低于此值，触发性能优化
        warning: 35,    // 低于此值，警告状态
        target: 45      // 目标帧率
      },
      
      // 内存使用限制
      memoryLimits: {
        lightsKB: 5,     // 灯光系统最大内存(KB)
        animationsKB: 3, // 动画系统最大内存(KB)
        configKB: 2      // 配置系统最大内存(KB)
      }
    };
    
    // 恐怖等级灯光映射配置
    this.terrorLevelLightMapping = {
      // 恐怖等级 1: 平静 (理智值 100-81)
      level1: {
        intensity: {
          MainLight: 0.8,
          BarSpotlight: 0.9,
          TerrorAlertLight: 0.1,
          GhostBlueLight: 0.0,
          TerrorAmbientLight: 0.2,
          EventTriggerLight: 0.0,
          UIFeedbackLight: 0.3
        },
        color: {
          MainLight: '#F5F5DC',      // 米白色，温暖平静
          BarSpotlight: '#FFD700',    // 金黄色，温馨吧台
          TerrorAmbientLight: '#4A4A4A', // 暗灰色，微弱恐怖氛围
          UIFeedbackLight: '#FFFFFF'  // 白色，正常UI
        },
        animation: {
          MainLight: 'stable',       // 稳定
          BarSpotlight: 'stable',     // 稳定
          TerrorAmbientLight: 'slow_pulse' // 缓慢脉动
        },
        enabledLights: ['MainLight', 'BarSpotlight', 'TerrorAmbientLight', 'UIFeedbackLight']
      },
      
      // 恐怖等级 2: 警惕 (理智值 80-61)
      level2: {
        intensity: {
          MainLight: 0.6,
          BarSpotlight: 0.8,
          TerrorAlertLight: 0.2,
          GhostBlueLight: 0.1,
          TerrorAmbientLight: 0.3,
          EventTriggerLight: 0.1,
          UIFeedbackLight: 0.5
        },
        color: {
          MainLight: '#D3D3D3',      // 浅灰色，开始紧张
          BarSpotlight: '#FFA500',    // 橙色，警报氛围
          TerrorAlertLight: '#FF4500', // 红色，轻微警报
          GhostBlueLight: '#4169E1',  // 皇家蓝，幽灵出现
          TerrorAmbientLight: '#2F4F4F', // 深青灰色，增强恐怖
          EventTriggerLight: '#FF6347', // 番茄红，事件触发
          UIFeedbackLight: '#FFB6C1'  // 浅粉色，UI反馈
        },
        animation: {
          MainLight: 'stable',           // 稳定
          BarSpotlight: 'smooth_blink',  // 平滑闪烁
          TerrorAlertLight: 'warning_blink', // 警告闪烁
          GhostBlueLight: 'ghost_follow', // 幽灵跟随
          TerrorAmbientLight: 'slow_pulse', // 缓慢脉动
          EventTriggerLight: 'event_flash'  // 事件闪光
        },
        enabledLights: ['MainLight', 'BarSpotlight', 'TerrorAlertLight', 'GhostBlueLight', 
                       'TerrorAmbientLight', 'EventTriggerLight', 'UIFeedbackLight']
      },
      
      // 恐怖等级 3: 紧张 (理智值 60-41)
      level3: {
        intensity: {
          MainLight: 0.4,
          BarSpotlight: 0.6,
          TerrorAlertLight: 0.5,
          GhostBlueLight: 0.3,
          TerrorAmbientLight: 0.5,
          EventTriggerLight: 0.3,
          UIFeedbackLight: 0.7
        },
        color: {
          MainLight: '#A9A9A9',      // 深灰色，明显紧张
          BarSpotlight: '#FF8C00',    // 暗橙色，高度警报
          TerrorAlertLight: '#DC143C', // 深红，强烈警报
          GhostBlueLight: '#1E90FF',  // 道奇蓝，幽灵活跃
          TerrorAmbientLight: '#2C3E50', // 海军蓝灰，强烈恐怖
          EventTriggerLight: '#FF0000', // 纯红，事件触发
          UIFeedbackLight: '#FF69B4'  // 热粉色，UI突出
        },
        animation: {
          MainLight: 'stable',           // 稳定
          BarSpotlight: 'warning_blink',  // 警告闪烁
          TerrorAlertLight: 'terror_pulse', // 恐怖脉动
          GhostBlueLight: 'ghost_follow', // 幽灵跟随
          TerrorAmbientLight: 'medium_pulse', // 中等脉动
          EventTriggerLight: 'event_flash'  // 事件闪光
        },
        enabledLights: ['MainLight', 'BarSpotlight', 'TerrorAlertLight', 'GhostBlueLight', 
                       'TerrorAmbientLight', 'EventTriggerLight', 'UIFeedbackLight']
      },
      
      // 恐怖等级 4: 恐惧 (理智值 40-21)
      level4: {
        intensity: {
          MainLight: 0.2,
          BarSpotlight: 0.4,
          TerrorAlertLight: 0.8,
          GhostBlueLight: 0.5,
          TerrorAmbientLight: 0.8,
          EventTriggerLight: 0.5,
          UIFeedbackLight: 0.9
        },
        color: {
          MainLight: '#696969',      // 昏暗中灰
          BarSpotlight: '#FF4500',    // 橙红色，极度危险
          TerrorAlertLight: '#B22222', // 砖红色，致命警报
          GhostBlueLight: '#00BFFF',  // 深天蓝，幽灵疯狂
          TerrorAmbientLight: '#191970', // 深蓝灰，极度恐怖
          EventTriggerLight: '#8B0000', // 暗红，危险事件
          UIFeedbackLight: '#FF1493'  // 深粉色，UI紧急
        },
        animation: {
          MainLight: 'random_dim',        // 随机变暗
          BarSpotlight: 'terror_pulse',   // 恐怖脉动
          TerrorAlertLight: 'warning_blink', // 警告闪烁
          GhostBlueLight: 'ghost_follow',   // 幽灵跟随
          TerrorAmbientLight: 'fast_pulse',  // 快速脉动
          EventTriggerLight: 'event_flash'   // 事件闪光
        },
        enabledLights: ['MainLight', 'BarSpotlight', 'TerrorAlertLight', 'GhostBlueLight', 
                       'TerrorAmbientLight', 'EventTriggerLight', 'UIFeedbackLight']
      },
      
      // 恐怖等级 5: 疯狂 (理智值 20-0)
      level5: {
        intensity: {
          MainLight: 0.1,
          BarSpotlight: 0.2,
          TerrorAlertLight: 1.0,
          GhostBlueLight: 0.8,
          TerrorAmbientLight: 1.0,
          EventTriggerLight: 0.8,
          UIFeedbackLight: 1.0
        },
        color: {
          MainLight: '#404040',      // 近乎黑色
          BarSpotlight: '#FF0000',    // 纯红色，疯狂危险
          TerrorAlertLight: '#8B0000', // 深红色，地狱警报
          GhostBlueLight: '#0000FF',  // 纯蓝色，幽灵地狱
          TerrorAmbientLight: '#000080', // 海军蓝，地狱恐怖
          EventTriggerLight: '#800000', // 栗色，致命事件
          UIFeedbackLight: '#FF00FF'  // 洋红色，UI疯狂
        },
        animation: {
          MainLight: 'terror_progression', // 恐怖进展
          BarSpotlight: 'warning_blink',   // 警告闪烁
          TerrorAlertLight: 'terror_pulse',  // 恐怖脉动
          GhostBlueLight: 'ghost_follow',    // 幽灵跟随
          TerrorAmbientLight: 'terror_progression', // 恐怖进展
          EventTriggerLight: 'event_flash'   // 事件闪光
        },
        enabledLights: ['MainLight', 'BarSpotlight', 'TerrorAlertLight', 'GhostBlueLight', 
                       'TerrorAmbientLight', 'EventTriggerLight', 'UIFeedbackLight']
      }
    };
    
    // 事件触发灯光配置
    this.eventLightMapping = {
      // 血滴事件 (恐怖事件1)
      blood_drop_event: {
        trigger: 'EventTriggerLight',
        intensity: 1.0,
        color: '#8B0000', // 暗红色
        animation: 'event_flash',
        duration: 1500,   // 1.5秒
        cooldown: 10000,  // 10秒冷却
        priority: 'high'  // 高优先级
      },
      
      // 幽灵出现事件 (恐怖事件2)
      ghost_appear_event: {
        trigger: 'GhostBlueLight',
        intensity: 0.9,
        color: '#4169E1', // 皇家蓝
        animation: 'ghost_follow',
        duration: 3000,   // 3秒
        cooldown: 15000,  // 15秒冷却
        priority: 'medium' // 中等优先级
      },
      
      // 突然黑暗事件 (恐怖事件3)
      sudden_dark_event: {
        triggers: ['MainLight', 'BarSpotlight'],
        intensity: 0.1,   // 大幅降低亮度
        animation: 'sudden_dim',
        duration: 5000,   // 5秒
        cooldown: 20000,  // 20秒冷却
        priority: 'high'  // 高优先级
      },
      
      // 理智下降事件 (恐怖事件4)
      sanity_drop_event: {
        triggers: ['TerrorAlertLight', 'TerrorAmbientLight'],
        intensity: 0.8,
        animation: 'sanity_sync',
        duration: 4000,   // 4秒
        cooldown: 12000,  // 12秒冷却
        priority: 'low'   // 低优先级
      },
      
      // 咖啡制作成功 (游戏事件1)
      coffee_made_event: {
        trigger: 'UIFeedbackLight',
        intensity: 0.7,
        color: '#00FF00', // 绿色
        animation: 'user_interaction',
        duration: 2000,   // 2秒
        cooldown: 3000,   // 3秒冷却
        priority: 'medium' // 中等优先级
      },
      
      // 幽灵攻击失败 (游戏事件2)
      ghost_attack_avoided_event: {
        triggers: ['UIFeedbackLight', 'EventTriggerLight'],
        intensity: 0.6,
        color: '#FFFF00', // 黄色
        animation: 'event_flash',
        duration: 2500,   // 2.5秒
        cooldown: 8000,   // 8秒冷却
        priority: 'medium' // 中等优先级
      },
      
      // 恐怖等级提升 (游戏事件3)
      terror_level_up_event: {
        triggers: ['TerrorAlertLight', 'GhostBlueLight', 'TerrorAmbientLight'],
        intensity: 0.9,
        animation: 'terror_progression',
        duration: 3000,   // 3秒
        cooldown: 10000,  // 10秒冷却
        priority: 'high'  // 高优先级
      }
    };
    
    // 材质系统灯光联动配置
    this.materialLightMapping = {
      // 木质材质
      wood_material: {
        recommendedLights: ['MainLight', 'BarSpotlight'],
        intensityMultiplier: 1.0,
        colorEnhancement: true,
        updateFrequency: 'medium' // 中等更新频率
      },
      
      // 金属材质
      metal_material: {
        recommendedLights: ['MainLight', 'BarSpotlight'],
        intensityMultiplier: 1.2,
        colorEnhancement: true,
        updateFrequency: 'high' // 高更新频率
      },
      
      // 布料材质
      fabric_material: {
        recommendedLights: ['MainLight', 'TerrorAmbientLight'],
        intensityMultiplier: 0.9,
        colorEnhancement: false,
        updateFrequency: 'low' // 低更新频率
      },
      
      // 陶瓷材质
      ceramic_material: {
        recommendedLights: ['BarSpotlight', 'UIFeedbackLight'],
        intensityMultiplier: 1.1,
        colorEnhancement: true,
        updateFrequency: 'medium' // 中等更新频率
      },
      
      // 幽灵材质
      ghost_material: {
        recommendedLights: ['GhostBlueLight', 'TerrorAmbientLight'],
        intensityMultiplier: 1.3,
        colorEnhancement: true,
        updateFrequency: 'high' // 高更新频率
      },
      
      // 血滴材质
      blood_material: {
        recommendedLights: ['EventTriggerLight', 'TerrorAlertLight'],
        intensityMultiplier: 1.4,
        colorEnhancement: true,
        updateFrequency: 'high' // 高更新频率
      },
      
      // 阴影材质
      shadow_material: {
        recommendedLights: ['TerrorAmbientLight'],
        intensityMultiplier: 0.7,
        colorEnhancement: false,
        updateFrequency: 'low' // 低更新频率
      },
      
      // 恐怖材质
      terror_material: {
        recommendedLights: ['TerrorAlertLight', 'GhostBlueLight', 'TerrorAmbientLight'],
        intensityMultiplier: 1.5,
        colorEnhancement: true,
        updateFrequency: 'high' // 高更新频率
      }
    };
    
    // 平台适配配置
    this.platformConfig = {
      // 微信小游戏平台限制
      weixin_game: {
        maxActiveLights: 4,
        maxAnimations: 3,
        maxMemoryKB: 32,
        fpsTarget: 45,
        textureCompression: true,
        lightQuality: 'medium'
      },
      
      // Web平台 (PC浏览器)
      web_browser: {
        maxActiveLights: 8,
        maxAnimations: 10,
        maxMemoryKB: 64,
        fpsTarget: 60,
        textureCompression: false,
        lightQuality: 'high'
      },
      
      // 移动浏览器
      mobile_browser: {
        maxActiveLights: 6,
        maxAnimations: 5,
        maxMemoryKB: 48,
        fpsTarget: 30,
        textureCompression: true,
        lightQuality: 'medium'
      }
    };
    
    // 调试配置
    this.debugConfig = {
      // 性能监控
      performanceMonitoring: {
        enabled: true,
        logInterval: 5000, // 5秒记录一次
        metrics: ['fps', 'memory', 'activeLights', 'animations'],
        thresholdWarnings: true
      },
      
      // 灯光调试
      lightDebug: {
        enabled: false, // 正式版本关闭
        showLightNames: false,
        showLightInfo: false,
        highlightActiveLights: false
      },
      
      // 动画调试
      animationDebug: {
        enabled: false, // 正式版本关闭
        showAnimationNames: false,
        showAnimationStats: false,
        logAnimationEvents: false
      },
      
      // 恐怖事件调试
      terrorDebug: {
        enabled: false, // 正式版本关闭
        logTerrorEvents: false,
        showTerrorLevel: false,
        simulateTerrorEvents: false
      }
    };
    
    // 热更新配置
    this.hotUpdateConfig = {
      // 配置版本管理
      versionManagement: true,
      configSchemaVersion: '1.0',
      
      // 远程配置更新
      remoteConfig: {
        enabled: false, // 正式版本开启
        url: '',
        updateInterval: 3600000, // 1小时
        fallbackToLocal: true
      },
      
      // 配置验证
      validation: {
        validateOnLoad: true,
        validateOnUpdate: true,
        fallbackToDefault: true
      }
    };
    
    // 初始化完成标志
    this.initialized = true;
    console.log('灯光配置系统初始化完成，版本:', this.configVersion);
  }
  
  /**
   * 获取恐怖等级灯光配置
   * @param {number} terrorLevel 恐怖等级 (1-5)
   * @returns {Object} 对应等级的灯光配置
   */
  getTerrorLevelConfig(terrorLevel) {
    if (terrorLevel < 1 || terrorLevel > 5) {
      console.warn(`无效的恐怖等级: ${terrorLevel}，使用默认等级 1`);
      terrorLevel = 1;
    }
    
    const levelKey = `level${terrorLevel}`;
    return this.terrorLevelLightMapping[levelKey];
  }
  
  /**
   * 获取事件灯光配置
   * @param {string} eventName 事件名称
   * @returns {Object} 事件灯光配置，如果不存在则返回null
   */
  getEventConfig(eventName) {
    return this.eventLightMapping[eventName] || null;
  }
  
  /**
   * 获取材质系统灯光配置
   * @param {string} materialType 材质类型
   * @returns {Object} 材质灯光配置
   */
  getMaterialConfig(materialType) {
    const config = this.materialLightMapping[materialType];
    if (!config) {
      console.warn(`未找到材质类型 "${materialType}" 的灯光配置，使用默认配置`);
      return this.materialLightMapping['wood_material'];
    }
    return config;
  }
  
  /**
   * 获取平台配置
   * @param {string} platform 平台名称 (weixin_game, web_browser, mobile_browser)
   * @returns {Object} 平台配置
   */
  getPlatformConfig(platform = 'weixin_game') {
    return this.platformConfig[platform] || this.platformConfig.weixin_game;
  }
  
  /**
   * 获取性能配置
   * @returns {Object} 性能配置
   */
  getPerformanceConfig() {
    return this.performanceConfig;
  }
  
  /**
   * 获取调试配置
   * @returns {Object} 调试配置
   */
  getDebugConfig() {
    return this.debugConfig;
  }
  
  /**
   * 验证配置完整性
   * @returns {boolean} 配置是否完整
   */
  validateConfig() {
    const requiredSections = [
      'performanceConfig',
      'terrorLevelLightMapping',
      'eventLightMapping',
      'materialLightMapping',
      'platformConfig',
      'debugConfig'
    ];
    
    for (const section of requiredSections) {
      if (!this[section]) {
        console.error(`配置缺失: ${section}`);
        return false;
      }
    }
    
    // 验证恐怖等级配置
    for (let i = 1; i <= 5; i++) {
      const levelKey = `level${i}`;
      if (!this.terrorLevelLightMapping[levelKey]) {
        console.error(`恐怖等级配置缺失: ${levelKey}`);
        return false;
      }
    }
    
    // 验证事件配置
    const requiredEvents = [
      'blood_drop_event',
      'ghost_appear_event',
      'sudden_dark_event',
      'sanity_drop_event'
    ];
    
    for (const event of requiredEvents) {
      if (!this.eventLightMapping[event]) {
        console.warn(`事件配置缺失: ${event}`);
      }
    }
    
    console.log('灯光配置验证通过');
    return true;
  }
  
  /**
   * 导出配置到JSON
   * @returns {Object} JSON格式的配置
   */
  toJSON() {
    return {
      configVersion: this.configVersion,
      performanceConfig: this.performanceConfig,
      terrorLevelLightMapping: this.terrorLevelLightMapping,
      eventLightMapping: this.eventLightMapping,
      materialLightMapping: this.materialLightMapping,
      platformConfig: this.platformConfig,
      debugConfig: this.debugConfig,
      hotUpdateConfig: this.hotUpdateConfig,
      initialized: this.initialized
    };
  }
  
  /**
   * 从JSON导入配置
   * @param {Object} jsonData JSON配置数据
   */
  fromJSON(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
      console.error('无效的JSON配置数据');
      return false;
    }
    
    // 更新配置
    this.configVersion = jsonData.configVersion || this.configVersion;
    this.performanceConfig = jsonData.performanceConfig || this.performanceConfig;
    this.terrorLevelLightMapping = jsonData.terrorLevelLightMapping || this.terrorLevelLightMapping;
    this.eventLightMapping = jsonData.eventLightMapping || this.eventLightMapping;
    this.materialLightMapping = jsonData.materialLightMapping || this.materialLightMapping;
    this.platformConfig = jsonData.platformConfig || this.platformConfig;
    this.debugConfig = jsonData.debugConfig || this.debugConfig;
    this.hotUpdateConfig = jsonData.hotUpdateConfig || this.hotUpdateConfig;
    
    // 验证配置
    return this.validateConfig();
  }
  
  /**
   * 获取内存使用估算
   * @returns {Object} 内存使用情况
   */
  getMemoryEstimate() {
    const configSize = JSON.stringify(this.toJSON()).length;
    
    return {
      configKB: Math.round(configSize / 1024 * 100) / 100,
      estimateTotalKB: Math.round((configSize / 1024 + 1.5) * 100) / 100, // 包含运行时开销
      status: configSize / 1024 < 2 ? 'safe' : configSize / 1024 < 5 ? 'warning' : 'danger'
    };
  }
}

// 创建全局配置实例
const lightConfig = new LightConfig();

// 导出配置
export { LightConfig, lightConfig };

// 在非ES6环境中提供兼容性支持
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LightConfig, lightConfig };
}

console.log(`灯光配置系统加载完成，版本 ${lightConfig.configVersion}`);
console.log(`配置内存估算: ${lightConfig.getMemoryEstimate().configKB} KB`);