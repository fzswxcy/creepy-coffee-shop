/**
 * 《微恐咖啡厅》材质工厂系统
 * 微信小游戏优化版 - 轻量级、高性能、无外部贴图依赖
 * 创建时间: 2026-03-05 00:45 GMT+8
 */

class MaterialFactory {
  constructor() {
    // 材质缓存池
    this.materialCache = new Map();
    
    // 恐怖进度追踪
    this.horrorLevel = 0; // 0-100, 0=最恐怖
    
    // 性能监控
    this.performanceStats = {
      totalMaterialsCreated: 0,
      cacheHits: 0,
      memoryEstimate: 0,
      lastRenderTime: 0
    };
    
    console.log('[MaterialFactory] 材质工厂初始化完成');
  }
  
  /**
   * 获取材质（带缓存）
   */
  getMaterial(type, options = {}) {
    const cacheKey = `${type}_${JSON.stringify(options)}_${this.horrorLevel}`;
    
    // 缓存命中
    if (this.materialCache.has(cacheKey)) {
      this.performanceStats.cacheHits++;
      return this.materialCache.get(cacheKey);
    }
    
    // 创建新材质
    let material;
    switch(type) {
      case 'wood':
        material = this._createWoodMaterial(options);
        break;
      case 'metal':
        material = this._createMetalMaterial(options);
        break;
      case 'fabric':
        material = this._createFabricMaterial(options);
        break;
      case 'ceramic':
        material = this._createCeramicMaterial(options);
        break;
      case 'ghost':
        material = this._createGhostMaterial(options);
        break;
      case 'blood':
        material = this._createBloodMaterial(options);
        break;
      case 'shadow':
        material = this._createShadowMaterial(options);
        break;
      default:
        material = this._createDefaultMaterial();
    }
    
    // 应用恐怖效果
    this._applyHorrorEffects(material, options);
    
    // 缓存材质
    this.materialCache.set(cacheKey, material);
    this.performanceStats.totalMaterialsCreated++;
    this.performanceStats.memoryEstimate += this._estimateMaterialMemory(material);
    
    // 清理过期的缓存（保持缓存大小合理）
    if (this.materialCache.size > 20) {
      this._cleanupCache();
    }
    
    return material;
  }
  
  /**
   * 创建木纹材质
   */
  _createWoodMaterial(options) {
    const woodTypes = {
      'dark_walnut': {
        baseColor: [0.25, 0.15, 0.1],      // 深色胡桃木
        roughness: 0.8,
        pattern: 'fine_grain',
        crackProbability: 0.3
      },
      'honey_oak': {
        baseColor: [0.8, 0.65, 0.4],       // 蜂蜜色橡木
        roughness: 0.7,
        pattern: 'medium_grain',
        crackProbability: 0.2
      },
      'bloody_floor': {
        baseColor: [0.3, 0.15, 0.1],       // 带血渍地板
        roughness: 0.9,
        pattern: 'large_grain',
        crackProbability: 0.5,
        hasBloodStains: true
      }
    };
    
    const config = woodTypes[options.woodType || 'dark_walnut'];
    
    return {
      type: 'wood',
      baseColor: config.baseColor,
      roughness: config.roughness,
      metallic: 0.1,
      // 程序化纹理参数
      grainPattern: config.pattern,
      grainScale: options.grainScale || 1.0,
      // 恐怖元素
      hasCracks: config.crackProbability > Math.random(),
      crackIntensity: 0.0, // 初始为0，恐怖进度增加
      hasBloodStains: config.hasBloodStains || false,
      bloodIntensity: 0.0,
      // 性能数据
      textureSize: 'none',
      shaderComplexity: 'low',
      memoryCategory: 'ultra_light'
    };
  }
  
  /**
   * 创建金属材质
   */
  _createMetalMaterial(options) {
    const metalTypes = {
      'stainless_steel': {
        baseColor: [0.75, 0.75, 0.75],     // 不锈钢
        roughness: 0.3,
        metallic: 0.95,
        rustEnabled: true
      },
      'brass': {
        baseColor: [0.8, 0.6, 0.2],        // 黄铜
        roughness: 0.6,
        metallic: 0.85,
        patinaEnabled: true
      },
      'rusty_iron': {
        baseColor: [0.5, 0.3, 0.2],        // 生锈铁
        roughness: 0.9,
        metallic: 0.4,
        rustEnabled: true
      }
    };
    
    const config = metalTypes[options.metalType || 'stainless_steel'];
    
    return {
      type: 'metal',
      baseColor: config.baseColor,
      roughness: config.roughness,
      metallic: config.metallic,
      // 腐蚀效果
      rustEnabled: config.rustEnabled,
      rustAmount: 0.0,
      patinaEnabled: config.patinaEnabled,
      patinaAmount: 0.0,
      // 反射效果
      reflectivity: 1.0 - config.roughness,
      // 性能数据
      textureSize: 'none',
      shaderComplexity: 'medium',
      memoryCategory: 'light'
    };
  }
  
  /**
   * 创建布料材质
   */
  _createFabricMaterial(options) {
    const fabricTypes = {
      'velvet_red': {
        baseColor: [0.5, 0.1, 0.1],        // 深红色丝绒
        roughness: 0.9,
        softness: 0.8,
        stainEnabled: true
      },
      'linen_beige': {
        baseColor: [0.9, 0.85, 0.7],       // 米色亚麻
        roughness: 0.8,
        softness: 0.6,
        stainEnabled: false
      }
    };
    
    const config = fabricTypes[options.fabricType || 'velvet_red'];
    
    return {
      type: 'fabric',
      baseColor: config.baseColor,
      roughness: config.roughness,
      metallic: 0.0,
      // 布料特性
      softness: config.softness,
      napDirection: options.napDirection || [0, 1, 0],
      // 污渍效果
      stainEnabled: config.stainEnabled,
      stainAmount: 0.0,
      stainColor: [0.3, 0.05, 0.05],
      // 性能数据
      textureSize: 'none',
      shaderComplexity: 'low',
      memoryCategory: 'ultra_light'
    };
  }
  
  /**
   * 创建陶瓷材质
   */
  _createCeramicMaterial(options) {
    return {
      type: 'ceramic',
      baseColor: options.color || [0.95, 0.93, 0.9], // 象牙白
      roughness: 0.4,
      metallic: 0.05,
      // 陶瓷特性
      glazeAmount: 0.7,
      // 恐怖渗色效果
      stainEnabled: true,
      stainIntensity: 0.0,
      stainColor: [0.6, 0.1, 0.1], // 暗红色
      // 裂纹效果
      crackEnabled: true,
      crackAmount: 0.0,
      // 性能数据
      textureSize: 'none',
      shaderComplexity: 'medium',
      memoryCategory: 'light'
    };
  }
  
  /**
   * 创建幽灵材质
   */
  _createGhostMaterial(options) {
    return {
      type: 'ghost',
      baseColor: [0.2, 0.5, 0.9, 0.3], // 半透明幽蓝
      roughness: 0.1,
      metallic: 0.0,
      // 幽灵特效
      transparency: 0.3,
      emissiveColor: [0.1, 0.3, 0.8],
      emissiveIntensity: 0.5,
      pulseEnabled: true,
      pulseSpeed: 2.0,
      pulseAmount: 0.2,
      // 扭曲效果
      distortionEnabled: true,
      distortionAmount: 0.05,
      // 性能数据
      textureSize: 'none',
      shaderComplexity: 'high',
      memoryCategory: 'medium'
    };
  }
  
  /**
   * 创建血渍材质
   */
  _createBloodMaterial(options) {
    return {
      type: 'blood',
      baseColor: [0.6, 0.1, 0.1],
      roughness: 0.9,
      metallic: 0.1,
      // 血渍特性
      wetness: options.wetness || 0.7,
      dripEnabled: true,
      dripAmount: 0.0,
      // 干涸效果
      dryingEnabled: true,
      dryingAmount: 0.0,
      driedColor: [0.4, 0.05, 0.05],
      // 性能数据
      textureSize: 'none',
      shaderComplexity: 'medium',
      memoryCategory: 'light'
    };
  }
  
  /**
   * 创建阴影材质
   */
  _createShadowMaterial(options) {
    return {
      type: 'shadow',
      baseColor: [0.05, 0.05, 0.1, 0.7], // 深蓝色半透明
      roughness: 1.0,
      metallic: 0.0,
      // 阴影特性
      transparency: 0.7,
      edgeSoftness: 0.3,
      movementEnabled: true,
      movementSpeed: 0.5,
      // 扭曲效果
      warpEnabled: true,
      warpAmount: 0.1,
      // 性能数据
      textureSize: 'none',
      shaderComplexity: 'medium',
      memoryCategory: 'light'
    };
  }
  
  /**
   * 创建默认材质（后备）
   */
  _createDefaultMaterial() {
    return {
      type: 'default',
      baseColor: [0.5, 0.5, 0.5],
      roughness: 0.5,
      metallic: 0.5,
      textureSize: 'none',
      shaderComplexity: 'low',
      memoryCategory: 'ultra_light'
    };
  }
  
  /**
   * 应用恐怖效果到材质
   */
  _applyHorrorEffects(material, options) {
    if (!material) return;
    
    // 计算当前恐怖级别影响（0-1，0=正常，1=最恐怖）
    const horrorFactor = 1.0 - (this.horrorLevel / 100);
    
    // 根据材质类型应用不同恐怖效果
    switch(material.type) {
      case 'wood':
        if (material.hasCracks) {
          material.crackIntensity = horrorFactor * 0.8;
        }
        if (material.hasBloodStains) {
          material.bloodIntensity = horrorFactor * 0.6;
        }
        // 木材颜色变暗
        material.baseColor = material.baseColor.map(c => c * (1.0 - horrorFactor * 0.3));
        break;
        
      case 'metal':
        if (material.rustEnabled) {
          material.rustAmount = horrorFactor * 0.7;
          // 锈蚀效果：颜色变暗变红
          material.baseColor[0] *= (1.0 - horrorFactor * 0.4); // R减少
          material.baseColor[1] *= (1.0 - horrorFactor * 0.6); // G大幅减少
          material.baseColor[2] *= (1.0 - horrorFactor * 0.5); // B减少
        }
        if (material.patinaEnabled) {
          material.patinaAmount = horrorFactor * 0.5;
        }
        break;
        
      case 'fabric':
        if (material.stainEnabled) {
          material.stainAmount = horrorFactor * 0.9;
        }
        // 布料变脏变暗
        material.baseColor = material.baseColor.map(c => c * (1.0 - horrorFactor * 0.4));
        break;
        
      case 'ceramic':
        if (material.stainEnabled) {
          material.stainIntensity = horrorFactor * 0.8;
        }
        if (material.crackEnabled) {
          material.crackAmount = horrorFactor * 0.6;
        }
        // 陶瓷失去光泽
        material.glazeAmount *= (1.0 - horrorFactor * 0.5);
        break;
        
      case 'blood':
        material.dripAmount = horrorFactor * 0.9;
        material.dryingAmount = horrorFactor * 0.4;
        break;
        
      case 'ghost':
        material.emissiveIntensity = 0.5 + horrorFactor * 0.5;
        material.distortionAmount = 0.05 + horrorFactor * 0.15;
        break;
        
      case 'shadow':
        material.transparency = 0.7 - horrorFactor * 0.3;
        material.warpAmount = 0.1 + horrorFactor * 0.2;
        break;
    }
    
    // 全局恐怖效果：增加粗糙度（物体看起来更破旧）
    material.roughness += horrorFactor * 0.3;
    material.roughness = Math.min(material.roughness, 1.0);
  }
  
  /**
   * 更新恐怖级别（0-100，0=最恐怖）
   */
  updateHorrorLevel(level) {
    this.horrorLevel = Math.max(0, Math.min(100, level));
    
    // 清空缓存，重新生成带恐怖效果的材质
    this.materialCache.clear();
    this.performanceStats.cacheHits = 0;
    
    console.log(`[MaterialFactory] 恐怖级别更新: ${level}/100`);
  }
  
  /**
   * 估计材质内存使用
   */
  _estimateMaterialMemory(material) {
    const categorySizes = {
      'ultra_light': 0.5,  // ~0.5KB
      'light': 1,          // ~1KB
      'medium': 2,         // ~2KB
      'high': 4            // ~4KB
    };
    
    return categorySizes[material.memoryCategory] || 1;
  }
  
  /**
   * 清理缓存（LRU策略）
   */
  _cleanupCache() {
    const maxCacheSize = 15;
    if (this.materialCache.size <= maxCacheSize) return;
    
    // 简单实现：删除一半最旧的（实际应该用LRU）
    const keys = Array.from(this.materialCache.keys());
    const keysToRemove = keys.slice(0, Math.floor(keys.length / 2));
    
    for (const key of keysToRemove) {
      this.materialCache.delete(key);
    }
    
    console.log(`[MaterialFactory] 缓存清理完成，删除 ${keysToRemove.length} 个材质`);
  }
  
  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    return {
      cacheSize: this.materialCache.size,
      totalCreated: this.performanceStats.totalMaterialsCreated,
      cacheHits: this.performanceStats.cacheHits,
      cacheHitRate: this.performanceStats.totalMaterialsCreated > 0 ? 
        (this.performanceStats.cacheHits / this.performanceStats.totalMaterialsCreated).toFixed(2) : 0,
      estimatedMemory: `${this.performanceStats.memoryEstimate}KB`,
      horrorLevel: this.horrorLevel,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 预加载常用材质
   */
  preloadCommonMaterials() {
    const commonMaterials = [
      { type: 'wood', options: { woodType: 'dark_walnut' } },
      { type: 'wood', options: { woodType: 'honey_oak' } },
      { type: 'wood', options: { woodType: 'bloody_floor' } },
      { type: 'metal', options: { metalType: 'stainless_steel' } },
      { type: 'metal', options: { metalType: 'brass' } },
      { type: 'fabric', options: { fabricType: 'velvet_red' } },
      { type: 'ceramic', options: {} },
      { type: 'ghost', options: {} },
      { type: 'blood', options: {} },
      { type: 'shadow', options: {} }
    ];
    
    console.log('[MaterialFactory] 开始预加载常用材质...');
    
    for (const matDef of commonMaterials) {
      this.getMaterial(matDef.type, matDef.options);
    }
    
    const report = this.getPerformanceReport();
    console.log('[MaterialFactory] 预加载完成:', report);
  }
  
  /**
   * 生成材质可视化调试信息
   */
  getDebugVisualization() {
    const materials = Array.from(this.materialCache.values());
    const byType = {};
    
    for (const mat of materials) {
      if (!byType[mat.type]) byType[mat.type] = [];
      byType[mat.type].push({
        baseColor: mat.baseColor,
        roughness: mat.roughness,
        metallic: mat.metallic,
        memory: this._estimateMaterialMemory(mat)
      });
    }
    
    return {
      materialTypes: Object.keys(byType),
      materialCounts: Object.fromEntries(
        Object.entries(byType).map(([type, mats]) => [type, mats.length])
      ),
      memoryByType: Object.fromEntries(
        Object.entries(byType).map(([type, mats]) => [
          type, 
          mats.reduce((sum, mat) => sum + mat.memory, 0)
        ])
      ),
      horrorEffects: {
        currentLevel: this.horrorLevel,
        factor: 1.0 - (this.horrorLevel / 100),
        description: this._getHorrorDescription()
      }
    };
  }
  
  /**
   * 获取恐怖级别描述
   */
  _getHorrorDescription() {
    if (this.horrorLevel >= 80) return "安全 - 咖啡厅温馨舒适";
    if (this.horrorLevel >= 60) return "轻微异常 - 有些地方不对劲";
    if (this.horrorLevel >= 40) return "明显恐怖 - 恐怖元素显现";
    if (this.horrorLevel >= 20) return "高度恐怖 - 环境恶化";
    return "极度恐怖 - 咖啡厅变成噩梦";
  }
}

// 导出工厂类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaterialFactory;
}

// 全局可用
if (typeof window !== 'undefined') {
  window.MaterialFactory = MaterialFactory;
}

console.log('[MaterialFactory] 材质工厂系统加载完成，准备投入使用');