/**
 * 《微恐咖啡厅》材质配置系统
 * 微信小游戏优化版 - 轻量级材质管理
 * 创建时间: 2026-03-05 10:30 GMT+8
 */

/**
 * 材质系统全局配置
 */
export const MATERIAL_CONFIG = {
  // === 材质类型定义 ===
  materialTypes: {
    // 木纹材质 (3种)
    WOOD_DARK_WALNUT: 'wood_dark_walnut',      // 深色胡桃木 - 吧台
    WOOD_HONEY_OAK: 'wood_honey_oak',          // 蜂蜜色橡木 - 桌椅
    WOOD_BLOODY_FLOOR: 'wood_bloody_floor',    // 带血渍地板
    
    // 金属材质 (2种)
    METAL_STAINLESS_STEEL: 'metal_stainless_steel',  // 不锈钢 - 咖啡机
    METAL_BRASS: 'metal_brass',                      // 黄铜 - 器具
    
    // 其他材质 (3种)
    FABRIC_VELVET_RED: 'fabric_velvet_red',    // 深红丝绒 - 椅子布料
    CERAMIC_WHITE: 'ceramic_white',            // 象牙白陶瓷 - 咖啡杯
    PAPER_AGED: 'paper_aged',                  // 泛黄纸张 - 配方单
    
    // 恐怖特效材质 (2种)
    GHOST_BLUE: 'ghost_blue',                  // 幽蓝幽灵
    BLOOD_DARK_RED: 'blood_dark_red',          // 暗红色血渍
    SHADOW_DEEP: 'shadow_deep'                 // 深色阴影
  },
  
  // === 场景材质映射 ===
  sceneMaterialMapping: {
    // 吧台区域
    bar: {
      counterTop: 'WOOD_DARK_WALNUT',     // 吧台面
      counterBase: 'WOOD_DARK_WALNUT',    // 吧台底座
      cabinets: 'WOOD_DARK_WALNUT',       // 橱柜
      coffeeMachine: 'METAL_STAINLESS_STEEL', // 咖啡机
      coffeeGrinder: 'METAL_BRASS',       // 磨豆机
      cups: 'CERAMIC_WHITE',              // 咖啡杯
      saucers: 'CERAMIC_WHITE',           // 杯托
    },
    
    // 顾客区域
    customerArea: {
      tables: 'WOOD_HONEY_OAK',           // 桌子
      chairs: 'WOOD_HONEY_OAK',           // 椅子框架
      chairFabric: 'FABRIC_VELVET_RED',   // 椅子布料
      floor: 'WOOD_BLOODY_FLOOR',         // 地板
      walls: 'WOOD_DARK_WALNUT',          // 墙壁
      ceiling: 'WOOD_DARK_WALNUT',        // 天花板
    },
    
    // 装饰区域
    decorations: {
      paintings: 'WOOD_DARK_WALNUT',      // 画框
      shelves: 'WOOD_HONEY_OAK',          // 架子
      books: 'PAPER_AGED',                // 书本
      recipeCards: 'PAPER_AGED',          // 配方卡片
      clock: 'METAL_BRASS',               // 时钟
      lamp: 'METAL_BRASS',                // 台灯
    },
    
    // 恐怖特效区域
    horrorEffects: {
      ghost: 'GHOST_BLUE',                // 幽灵
      bloodStains: 'BLOOD_DARK_RED',      // 血渍
      creepyShadows: 'SHADOW_DEEP',       // 阴影
      bloodDrips: 'BLOOD_DARK_RED',       // 血滴
      ectoplasm: 'GHOST_BLUE',            // 灵质
    }
  },
  
  // === 恐怖进展配置 ===
  horrorProgression: {
    // 理智值区间 -> 材质恐怖度
    sanityRanges: [
      { min: 80, max: 100, horrorLevel: 0.0,  description: '正常' },      // 正常材质
      { min: 60, max: 79,  horrorLevel: 0.2,  description: '细微裂纹' },  // 细微裂纹出现
      { min: 40, max: 59,  horrorLevel: 0.4,  description: '锈蚀显现' },  // 锈蚀/污渍显现
      { min: 20, max: 39,  horrorLevel: 0.7,  description: '血渍明显' },  // 血渍/渗色明显
      { min: 0,  max: 19,  horrorLevel: 1.0,  description: '恐怖全开' },  // 恐怖材质全开
    ],
    
    // 材质恐怖效果参数
    horrorEffects: {
      wood: {
        crackIntensity: [0.0, 0.3, 0.6, 0.9, 1.0],    // 裂纹强度
        bloodStainIntensity: [0.0, 0.1, 0.3, 0.7, 1.0], // 血渍强度
        colorDarkening: [0.0, 0.1, 0.3, 0.6, 0.9],    // 颜色变暗
      },
      metal: {
        rustIntensity: [0.0, 0.2, 0.5, 0.8, 1.0],     // 锈蚀强度
        patinaIntensity: [0.0, 0.1, 0.4, 0.7, 0.9],   // 铜绿强度
        shineReduction: [0.0, 0.1, 0.3, 0.6, 0.8],    // 光泽减少
      },
      fabric: {
        stainIntensity: [0.0, 0.2, 0.5, 0.8, 1.0],    // 污渍强度
        colorShift: [0.0, 0.1, 0.3, 0.6, 0.9],        // 颜色偏移
        textureRoughness: [0.0, 0.2, 0.4, 0.7, 1.0],  // 纹理粗糙度
      },
      ceramic: {
        bloodSeepage: [0.0, 0.1, 0.4, 0.8, 1.0],      // 血液渗入
        crackProbability: [0.0, 0.2, 0.5, 0.8, 1.0],  // 裂纹概率
        colorStaining: [0.0, 0.1, 0.3, 0.7, 1.0],     // 染色程度
      }
    },
    
    // 恐怖事件触发
    eventTriggers: {
      sanityThresholds: [80, 60, 40, 20, 0],          // 理智值阈值
      effectDuration: [5000, 7000, 10000, 15000, 20000], // 效果持续时间(ms)
      cooldownPeriod: [30000, 25000, 20000, 15000, 10000], // 冷却时间(ms)
    }
  },
  
  // === 性能优化配置 ===
  performanceSettings: {
    // 材质池设置
    materialPool: {
      maxSize: 12,                      // 最大材质数量
      autoCleanup: true,                // 自动清理未使用材质
      cleanupThreshold: 8,              // 清理阈值
      preloadMaterials: 6,              // 预加载材质数量
    },
    
    // 纹理优化
    textureSettings: {
      maxTextureSize: 256,              // 最大纹理尺寸
      compressionLevel: 'high',         // 压缩等级: low/medium/high
      useProceduralTextures: true,      // 使用程序化纹理
      textureQuality: 'mobile',         // 纹理质量: mobile/desktop
    },
    
    // 渲染优化
    renderingSettings: {
      enableLOD: true,                  // 启用LOD系统
      lodLevels: 3,                     // LOD层级
      batchSimilarMaterials: true,      // 批次相似材质
      maxDrawCalls: 20,                 // 最大绘制调用数
      targetFPS: 60,                    // 目标帧率
    },
    
    // 微信小游戏限制
    wechatLimits: {
      maxPackageSize: 20480,            // 最大包体积 20MB
      estimatedMaterialMemory: 32,      // 预计材质内存 32KB
      textureMemoryLimit: 16384,        // 纹理内存限制 16MB
      renderMemoryLimit: 32768,         // 渲染内存限制 32MB
    }
  },
  
  // === 调试与监控 ===
  debugSettings: {
    // 调试显示
    showMaterialInfo: false,            // 显示材质信息
    showPerformanceStats: true,         // 显示性能统计
    showHorrorLevel: true,              // 显示恐怖等级
    showMemoryUsage: true,              // 显示内存使用
    
    // 监控设置
    monitorInterval: 5000,              // 监控间隔(ms)
    logMaterialChanges: true,           // 记录材质变化
    logPerformanceWarnings: true,       // 记录性能警告
    autoSaveState: true,                // 自动保存状态
    
    // 性能警告阈值
    warningThresholds: {
      memoryUsageKB: 10240,             // 内存使用警告 10MB
      fpsDropBelow: 45,                 // FPS下降警告
      drawCallsExceed: 15,              // 绘制调用警告
      materialCountExceed: 10,          // 材质数量警告
    }
  }
};

/**
 * 材质配置管理器
 */
export class MaterialConfigManager {
  constructor() {
    this.config = MATERIAL_CONFIG;
    this.currentHorrorLevel = 0;  // 当前恐怖等级 0-1
    this.materialCache = new Map();
    this.debugLog = [];
    
    console.log('[MaterialConfigManager] 材质配置管理器初始化完成');
  }
  
  /**
   * 根据物体类型获取材质配置
   */
  getMaterialConfig(objectType, horrorLevel = null) {
    // 使用指定的恐怖等级或当前等级
    const level = horrorLevel !== null ? horrorLevel : this.currentHorrorLevel;
    
    // 查找场景材质映射
    for (const [scene, mapping] of Object.entries(this.config.sceneMaterialMapping)) {
      if (mapping[objectType]) {
        const materialType = mapping[objectType];
        
        // 构建材质配置
        return {
          type: materialType,
          horrorLevel: level,
          scene: scene,
          objectType: objectType,
          // 根据恐怖等级获取效果参数
          ...this._getHorrorEffects(materialType, level)
        };
      }
    }
    
    // 未找到，返回默认配置
    console.warn(`[MaterialConfigManager] 未找到 ${objectType} 的材质配置，使用默认配置`);
    return {
      type: 'default',
      horrorLevel: level,
      objectType: objectType,
      baseColor: [0.5, 0.5, 0.5],
      roughness: 0.5,
      metallic: 0.1
    };
  }
  
  /**
   * 根据理智值更新恐怖等级
   */
  updateHorrorLevel(sanityValue) {
    // 找到对应的理智值区间
    const range = this.config.horrorProgression.sanityRanges.find(
      r => sanityValue >= r.min && sanityValue <= r.max
    );
    
    if (range) {
      const oldLevel = this.currentHorrorLevel;
      this.currentHorrorLevel = range.horrorLevel;
      
      if (oldLevel !== this.currentHorrorLevel) {
        console.log(`[MaterialConfigManager] 恐怖等级更新: ${oldLevel.toFixed(2)} -> ${this.currentHorrorLevel.toFixed(2)} (${range.description})`);
        
        // 记录调试信息
        if (this.config.debugSettings.logMaterialChanges) {
          this.debugLog.push({
            timestamp: Date.now(),
            sanity: sanityValue,
            horrorLevel: this.currentHorrorLevel,
            description: range.description
          });
        }
      }
      
      return {
        horrorLevel: this.currentHorrorLevel,
        description: range.description,
        sanityRange: { min: range.min, max: range.max }
      };
    }
    
    console.error(`[MaterialConfigManager] 无效的理智值: ${sanityValue}`);
    return null;
  }
  
  /**
   * 获取当前恐怖等级下的材质效果
   */
  _getHorrorEffects(materialType, horrorLevel) {
    const effects = {};
    const materialCategory = this._getMaterialCategory(materialType);
    
    // 获取材质类别的恐怖效果参数
    const categoryEffects = this.config.horrorProgression.horrorEffects[materialCategory];
    if (categoryEffects) {
      // 计算每个效果的插值
      for (const [effectName, levels] of Object.entries(categoryEffects)) {
        if (Array.isArray(levels) && levels.length === 5) {
          // 在5个等级之间插值
          const index = Math.floor(horrorLevel * 4);  // 0-4对应5个等级
          const t = horrorLevel * 4 - index;          // 插值系数 0-1
          
          if (index < 4) {
            effects[effectName] = levels[index] * (1 - t) + levels[index + 1] * t;
          } else {
            effects[effectName] = levels[4];
          }
        }
      }
    }
    
    return effects;
  }
  
  /**
   * 根据材质类型获取材质类别
   */
  _getMaterialCategory(materialType) {
    const typeStr = materialType.toLowerCase();
    
    if (typeStr.includes('wood')) return 'wood';
    if (typeStr.includes('metal')) return 'metal';
    if (typeStr.includes('fabric')) return 'fabric';
    if (typeStr.includes('ceramic')) return 'ceramic';
    if (typeStr.includes('ghost') || typeStr.includes('blood') || typeStr.includes('shadow')) 
      return 'horror';
    
    return 'default';
  }
  
  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const stats = {
      totalConfigs: Object.keys(this.config.sceneMaterialMapping).reduce(
        (sum, scene) => sum + Object.keys(this.config.sceneMaterialMapping[scene]).length, 0
      ),
      horrorLevel: this.currentHorrorLevel,
      materialCacheSize: this.materialCache.size,
      debugLogEntries: this.debugLog.length,
      
      // 性能警告检查
      warnings: []
    };
    
    // 检查性能警告
    if (this.materialCache.size > this.config.performanceSettings.materialPool.maxSize) {
      stats.warnings.push(`材质缓存超出限制: ${this.materialCache.size} > ${this.config.performanceSettings.materialPool.maxSize}`);
    }
    
    if (this.debugLog.length > 1000) {
      stats.warnings.push(`调试日志过多: ${this.debugLog.length} 条`);
    }
    
    return stats;
  }
  
  /**
   * 清理缓存
   */
  cleanupCache() {
    const beforeSize = this.materialCache.size;
    this.materialCache.clear();
    console.log(`[MaterialConfigManager] 清理缓存: ${beforeSize} -> 0`);
    return beforeSize;
  }
  
  /**
   * 导出配置用于调试
   */
  exportConfig() {
    return {
      timestamp: Date.now(),
      config: this.config,
      currentState: {
        horrorLevel: this.currentHorrorLevel,
        materialCacheSize: this.materialCache.size,
        debugLogLength: this.debugLog.length
      },
      performance: this.getPerformanceReport()
    };
  }
}

/**
 * 默认导出配置管理器
 */
export default new MaterialConfigManager();