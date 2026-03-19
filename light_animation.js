// 🎬 灯光动画控制器 - 《微恐咖啡厅》微信小游戏
// 版本: 1.0.0
// 创建时间: 2026年3月5日 11:40 GMT+8
// 作者: NIKO (CEO/主架构师)
// 内存目标: <3KB
// 性能目标: 支持10种动画模式，手机端30FPS稳定

/**
 * 🎞️ 灯光动画控制器
 * 负责管理10种灯光动画模式
 * 实现帧率自适应，性能优化
 * 支持恐怖等级动画切换
 */
class LightAnimationController {
  constructor(options = {}) {
    // 系统配置
    this.config = {
      maxAnimations: 3,                // 同时最大动画数量 (性能优化)
      animationPoolSize: 10,           // 动画对象池大小
      frameUpdateThreshold: 0.5,       // 帧更新阈值 (低于此值跳过更新)
      mobileFPS: 30,                   // 手机端目标FPS
      pcFPS: 60,                       // PC调试FPS
      tweenDuration: 1000,             // 动画过渡时间 (毫秒)
      easingFunction: 'easeOutQuad',   // 缓动函数
      performanceMode: 'balanced',     // 性能模式: balanced/performance/quality
      debugMode: false,                // 调试模式
      ...options
    };

    // 动画对象池
    this.animationPool = {
      smooth_flicker: [],      // 平滑闪烁
      warning_flicker: [],     // 警告闪烁
      terror_pulse: [],        // 恐怖脉冲
      ghost_follow: [],        // 幽灵跟随
      event_flash: [],         // 事件闪光
      random_dim: [],          // 随机变暗
      sanity_sync: [],         // 理智同步
      material_match: [],      // 材质匹配
      horror_progression: [],  // 恐怖进展
      user_interaction: []     // 用户交互
    };

    // 活跃动画列表
    this.activeAnimations = new Map(); // Map<animationId, animationObject>

    // 动画定义：10种动画模式
    this.animationDefinitions = this.createAnimationDefinitions();

    // 性能监控
    this.performanceStats = {
      totalAnimations: 0,
      activeAnimations: 0,
      frameSkipped: 0,
      frameUpdated: 0,
      poolHits: 0,
      poolMisses: 0,
      memoryUsage: 0,
      lastUpdateTime: 0,
      targetFPS: this.config.mobileFPS,
      actualFPS: 0
    };

    // 恐怖等级状态
    this.terrorState = {
      level: 0,               // 当前恐怖等级 (0-100)
      progressionSpeed: 0.01, // 恐怖进展速度
      lastUpdate: Date.now(),
      levelHistory: []
    };

    // 初始化对象池
    this.initializeAnimationPool();
    
    console.log('🎬 灯光动画控制器初始化完成');
    console.log(`📊 支持 ${Object.keys(this.animationDefinitions).length} 种动画模式`);
  }

  /**
   * 📝 创建动画定义
   * 定义10种动画模式的属性和行为
   */
  createAnimationDefinitions() {
    return {
      // 1. 平滑闪烁 - 正常状态的随机微调
      smooth_flicker: {
        name: '平滑闪烁',
        description: '正常状态下的随机微调亮度',
        baseSpeed: 1000,         // 基础速度 (毫秒)
        intensityRange: [0.7, 0.9], // 强度范围
        colorVariation: 0.1,     // 颜色变化幅度
        terrorMultiplier: 1.0,   // 恐怖等级乘数
        performanceCost: 1,      // 性能消耗 (1-10)
        memoryFootprint: 50      // 内存占用 (bytes)
      },

      // 2. 警告闪烁 - 恐怖预警的规律性闪烁
      warning_flicker: {
        name: '警告闪烁',
        description: '恐怖预警状态下的规律性闪烁',
        baseSpeed: 500,
        intensityRange: [0.5, 1.0],
        colorVariation: 0.3,
        terrorMultiplier: 1.5,
        performanceCost: 2,
        memoryFootprint: 60
      },

      // 3. 恐怖脉冲 - 危险状态的快速脉冲变化
      terror_pulse: {
        name: '恐怖脉冲',
        description: '危险状态下的快速脉冲式变化',
        baseSpeed: 250,
        intensityRange: [0.3, 0.8],
        colorVariation: 0.5,
        terrorMultiplier: 2.0,
        performanceCost: 3,
        memoryFootprint: 70
      },

      // 4. 幽灵跟随 - 幽灵出现时的灯光跟随
      ghost_follow: {
        name: '幽灵跟随',
        description: '幽灵出现时的灯光位置跟随',
        baseSpeed: 100,
        intensityRange: [0.4, 0.7],
        colorVariation: 0.2,
        terrorMultiplier: 1.8,
        performanceCost: 4,
        memoryFootprint: 80,
        requiresTarget: true     // 需要跟随目标
      },

      // 5. 事件闪光 - 恐怖事件的强闪光效果
      event_flash: {
        name: '事件闪光',
        description: '恐怖事件触发时的强闪光',
        baseSpeed: 100,
        intensityRange: [0.8, 1.2], // 可以超过1.0实现过曝
        colorVariation: 0.8,
        terrorMultiplier: 2.5,
        performanceCost: 5,
        memoryFootprint: 85,
        isOneShot: true           // 一次性效果
      },

      // 6. 随机变暗 - 恐怖氛围的随机区域变暗
      random_dim: {
        name: '随机变暗',
        description: '恐怖氛围下的随机区域变暗',
        baseSpeed: 800,
        intensityRange: [0.2, 0.6],
        colorVariation: 0.4,
        terrorMultiplier: 1.7,
        performanceCost: 2,
        memoryFootprint: 55,
        affectsArea: true         // 影响区域而非单个灯光
      },

      // 7. 理智同步 - 灯光与理智值同步变化
      sanity_sync: {
        name: '理智同步',
        description: '灯光强度与玩家理智值同步',
        baseSpeed: 200,
        intensityRange: [0.1, 0.9],
        colorVariation: 0.6,
        terrorMultiplier: 1.0,    // 直接使用恐怖等级
        performanceCost: 3,
        memoryFootprint: 75,
        syncWithSanity: true      // 与理智值同步
      },

      // 8. 材质匹配 - 灯光颜色与材质匹配
      material_match: {
        name: '材质匹配',
        description: '灯光颜色与关联材质颜色匹配',
        baseSpeed: 300,
        intensityRange: [0.5, 0.8],
        colorVariation: 0.1,
        terrorMultiplier: 1.3,
        performanceCost: 3,
        memoryFootprint: 65,
        requiresMaterial: true    // 需要关联材质
      },

      // 9. 恐怖进展 - 灯光随恐怖等级演变
      horror_progression: {
        name: '恐怖进展',
        description: '灯光效果随恐怖等级逐渐演变',
        baseSpeed: 1500,
        intensityRange: [0.3, 1.0],
        colorVariation: 0.7,
        terrorMultiplier: 1.0,    // 直接映射恐怖等级
        performanceCost: 4,
        memoryFootprint: 90,
        progressionBased: true    // 基于恐怖进展
      },

      // 10. 用户交互 - 用户操作的灯光反馈
      user_interaction: {
        name: '用户交互',
        description: '用户触摸操作时的灯光反馈',
        baseSpeed: 50,
        intensityRange: [0.6, 1.0],
        colorVariation: 0.2,
        terrorMultiplier: 1.2,
        performanceCost: 2,
        memoryFootprint: 60,
        isInteractive: true       // 交互式动画
      }
    };
  }

  /**
   * 🏗️ 初始化动画对象池
   */
  initializeAnimationPool() {
    console.log('🔄 初始化动画对象池...');
    
    let totalCreated = 0;
    for (const animationType in this.animationPool) {
      const definition = this.animationDefinitions[animationType];
      const poolSize = Math.min(this.config.animationPoolSize, 5); // 每种最多5个
      
      for (let i = 0; i < poolSize; i++) {
        const animation = this.createAnimationObject(animationType);
        this.animationPool[animationType].push(animation);
        totalCreated++;
      }
    }
    
    console.log(`✅ 动画对象池初始化完成，预创建 ${totalCreated} 个动画对象`);
  }

  /**
   * 🎯 创建动画对象
   * @param {string} animationType - 动画类型
   * @returns {Object} 动画对象
   */
  createAnimationObject(animationType) {
    const definition = this.animationDefinitions[animationType];
    
    const animation = {
      id: `anim_${animationType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: animationType,
      definition: { ...definition },
      
      // 动画状态
      isActive: false,
      progress: 0,           // 动画进度 0-1
      speed: definition.baseSpeed,
      intensity: 0.5,
      color: 'rgba(255, 255, 255, 1.0)',
      
      // 目标关联
      targetLight: null,     // 关联的灯光对象
      targetPosition: null,  // 目标位置 (用于跟随动画)
      targetMaterial: null,  // 目标材质 (用于材质匹配)
      
      // 性能跟踪
      startTime: 0,
      lastUpdate: 0,
      frameCount: 0,
      totalTime: 0,
      
      // 配置参数
      params: {
        terrorLevel: 0,
        userInput: null,
        eventData: null,
        customParams: {}
      }
    };

    this.performanceStats.totalAnimations++;
    return animation;
  }

  /**
   * 🚀 启动动画
   * @param {string} animationType - 动画类型
   * @param {Object} options - 配置选项
   * @returns {Object} 动画对象
   */
  startAnimation(animationType, options = {}) {
    // 检查是否超过最大动画数限制
    if (this.performanceStats.activeAnimations >= this.config.maxAnimations) {
      console.warn(`⚠️ 已达到最大动画数限制 (${this.config.maxAnimations})`);
      
      // 尝试停止最旧的动画
      this.stopOldestAnimation();
      
      if (this.performanceStats.activeAnimations >= this.config.maxAnimations) {
        throw new Error(`🚨 无法启动新动画: 已达到性能限制 (${this.config.maxAnimations}个同时动画)`);
      }
    }

    // 验证动画类型
    if (!this.animationDefinitions[animationType]) {
      throw new Error(`❌ 未知的动画类型: ${animationType}`);
    }

    let animation;
    
    // 尝试从对象池获取
    if (this.animationPool[animationType] && this.animationPool[animationType].length > 0) {
      animation = this.animationPool[animationType].pop();
      this.performanceStats.poolHits++;
      console.log(`♻️ 从对象池复用 ${animationType} 动画`);
    } else {
      // 对象池为空，创建新对象
      animation = this.createAnimationObject(animationType);
      this.performanceStats.poolMisses++;
      console.log(`🆕 创建新的 ${animationType} 动画对象`);
    }

    // 配置动画参数
    Object.assign(animation, {
      isActive: true,
      progress: 0,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      frameCount: 0,
      totalTime: 0,
      
      targetLight: options.targetLight || null,
      targetPosition: options.targetPosition || null,
      targetMaterial: options.targetMaterial || null,
      
      params: {
        terrorLevel: options.terrorLevel || this.terrorState.level,
        userInput: options.userInput || null,
        eventData: options.eventData || null,
        customParams: options.customParams || {}
      }
    });

    // 根据恐怖等级调整速度
    const terrorFactor = animation.params.terrorLevel / 100;
    const definition = this.animationDefinitions[animationType];
    animation.speed = Math.max(50, definition.baseSpeed * (1 - terrorFactor * 0.7));

    // 添加到活跃列表
    this.activeAnimations.set(animation.id, animation);
    this.performanceStats.activeAnimations++;
    
    console.log(`✅ 启动 ${animationType} 动画 (ID: ${animation.id})`);
    console.log(`📊 活跃动画数: ${this.performanceStats.activeAnimations}/${this.config.maxAnimations}`);
    
    return animation;
  }

  /**
   * 🛑 停止动画
   * @param {string} animationId - 动画ID
   * @returns {boolean} 是否成功停止
   */
  stopAnimation(animationId) {
    const animation = this.activeAnimations.get(animationId);
    if (!animation) {
      console.warn(`⚠️ 动画 ${animationId} 未找到，无法停止`);
      return false;
    }

    // 重置动画状态
    animation.isActive = false;
    animation.progress = 0;
    animation.totalTime = Date.now() - animation.startTime;

    // 放回对象池
    if (this.animationPool[animation.type]) {
      this.animationPool[animation.type].push(animation);
      this.activeAnimations.delete(animationId);
      
      this.performanceStats.activeAnimations--;
      
      console.log(`🛑 停止动画 ${animationId}，放回 ${animation.type} 池`);
      console.log(`📊 活跃动画数: ${this.performanceStats.activeAnimations}/${this.config.maxAnimations}`);
      
      return true;
    }
    
    console.error(`❌ 无法停止动画 ${animationId}: 类型 ${animation.type} 的对象池不存在`);
    return false;
  }

  /**
   * 🛑 停止最旧的动画 (性能优化)
   */
  stopOldestAnimation() {
    if (this.activeAnimations.size === 0) return false;
    
    // 找到最旧的动画
    let oldestId = null;
    let oldestTime = Infinity;
    
    for (const [id, animation] of this.activeAnimations.entries()) {
      if (animation.startTime < oldestTime) {
        oldestTime = animation.startTime;
        oldestId = id;
      }
    }
    
    if (oldestId) {
      console.log(`⏳ 停止最旧的动画 ${oldestId} (运行了 ${Date.now() - oldestTime}ms)`);
      return this.stopAnimation(oldestId);
    }
    
    return false;
  }

  /**
   * 🔄 更新所有动画
   * @param {number} deltaTime - 时间增量 (毫秒)
   */
  update(deltaTime = 16.67) {
    const updateStart = Date.now();
    const frameStart = Date.now();
    
    // 更新恐怖状态
    this.updateTerrorState(deltaTime);
    
    // 计算是否跳过此帧 (性能优化)
    const shouldSkipFrame = Math.random() < (1 - this.config.frameUpdateThreshold);
    if (shouldSkipFrame && this.performanceStats.activeAnimations > 2) {
      this.performanceStats.frameSkipped++;
      this.performanceStats.lastUpdateTime = Date.now() - updateStart;
      return;
    }
    
    this.performanceStats.frameUpdated++;
    
    // 更新所有活跃动画
    for (const [animationId, animation] of this.activeAnimations.entries()) {
      if (!animation.isActive) continue;
      
      // 更新动画进度
      this.updateAnimationProgress(animation, deltaTime);
      
      // 应用动画效果到目标灯光
      if (animation.targetLight) {
        this.applyAnimationToLight(animation);
      }
      
      // 检查动画是否完成
      if (this.checkAnimationComplete(animation)) {
        this.stopAnimation(animationId);
      }
      
      animation.frameCount++;
      animation.lastUpdate = Date.now();
    }
    
    // 更新性能统计
    const frameTime = Date.now() - frameStart;
    this.performanceStats.lastUpdateTime = Date.now() - updateStart;
    
    // 计算实际FPS
    if (frameTime > 0) {
      this.performanceStats.actualFPS = Math.min(1000 / frameTime, this.config.mobileFPS);
    }
    
    // 性能模式自适应调整
    this.adaptivePerformanceAdjustment();
  }

  /**
   * 📈 更新动画进度
   * @param {Object} animation - 动画对象
   * @param {number} deltaTime - 时间增量
   */
  updateAnimationProgress(animation, deltaTime) {
    const definition = this.animationDefinitions[animation.type];
    
    // 计算进度增量
    const progressIncrement = deltaTime / animation.speed;
    animation.progress += progressIncrement;
    
    // 处理循环动画
    if (!definition.isOneShot && animation.progress >= 1.0) {
      animation.progress = animation.progress % 1.0;
    }
    
    // 更新强度
    const [minIntensity, maxIntensity] = definition.intensityRange;
    const terrorFactor = animation.params.terrorLevel / 100;
    
    // 根据动画类型计算强度
    switch (animation.type) {
      case 'smooth_flicker':
        // 随机微调
        animation.intensity = minIntensity + Math.random() * (maxIntensity - minIntensity);
        break;
        
      case 'warning_flicker':
        // 规律闪烁
        const flashPhase = Math.sin(animation.progress * Math.PI * 4);
        animation.intensity = minIntensity + (maxIntensity - minIntensity) * (flashPhase > 0 ? 1 : 0);
        break;
        
      case 'terror_pulse':
        // 快速脉冲
        const pulseValue = Math.sin(animation.progress * Math.PI * 8);
        animation.intensity = minIntensity + (maxIntensity - minIntensity) * (pulseValue + 1) / 2;
        break;
        
      case 'ghost_follow':
        // 幽灵跟随 - 平滑变化
        const followValue = Math.sin(animation.progress * Math.PI * 2);
        animation.intensity = minIntensity + (maxIntensity - minIntensity) * (followValue + 1) / 2;
        break;
        
      case 'event_flash':
        // 事件闪光 - 一次性强闪光
        if (animation.progress < 0.2) {
          // 快速上升
          animation.intensity = maxIntensity * (animation.progress / 0.2);
        } else if (animation.progress < 0.5) {
          // 保持高峰
          animation.intensity = maxIntensity;
        } else {
          // 缓慢下降
          animation.intensity = maxIntensity * (1 - (animation.progress - 0.5) / 0.5);
        }
        break;
        
      case 'random_dim':
        // 随机变暗
        if (Math.random() < 0.1) {
          animation.intensity = minIntensity + Math.random() * (maxIntensity - minIntensity) * 0.5;
        }
        break;
        
      case 'sanity_sync':
        // 理智同步 - 直接映射恐怖等级
        animation.intensity = minIntensity + (maxIntensity - minIntensity) * (animation.params.terrorLevel / 100);
        break;
        
      case 'material_match':
        // 材质匹配 - 保持稳定
        animation.intensity = (minIntensity + maxIntensity) / 2;
        break;
        
      case 'horror_progression':
        // 恐怖进展 - 缓慢变化
        const progressionValue = Math.sin(animation.progress * Math.PI * 0.5);
        animation.intensity = minIntensity + (maxIntensity - minIntensity) * (progressionValue + 1) / 2;
        break;
        
      case 'user_interaction':
        // 用户交互 - 快速响应
        const interactionValue = Math.sin(animation.progress * Math.PI * 10);
        animation.intensity = minIntensity + (maxIntensity - minIntensity) * (interactionValue + 1) / 2;
        break;
        
      default:
        animation.intensity = (minIntensity + maxIntensity) / 2;
    }
    
    // 应用恐怖等级影响
    animation.intensity *= (1 + terrorFactor * (definition.terrorMultiplier - 1));
    
    // 限制强度范围
    animation.intensity = Math.max(0.1, Math.min(1.2, animation.intensity));
  }

  /**
   * 💡 应用动画效果到灯光
   * @param {Object} animation - 动画对象
   */
  applyAnimationToLight(animation) {
    if (!animation.targetLight) return;
    
    const light = animation.targetLight;
    const definition = this.animationDefinitions[animation.type];
    
    // 更新灯光强度
    light.intensity = animation.intensity;
    
    // 根据动画类型更新其他属性
    switch (animation.type) {
      case 'ghost_follow':
        // 幽灵跟随：更新灯光位置
        if (animation.targetPosition) {
          // 平滑移动
          const speed = 0.05;
          light.position.x += (animation.targetPosition.x - light.position.x) * speed;
          light.position.y += (animation.targetPosition.y - light.position.y) * speed;
          light.position.z += (animation.targetPosition.z - light.position.z) * speed;
        }
        break;
        
      case 'material_match':
        // 材质匹配：更新灯光颜色以匹配材质
        if (animation.targetMaterial && animation.targetMaterial.color) {
          // 平滑过渡到材质颜色
          const blendFactor = 0.1;
          // 这里需要实现颜色混合逻辑
        }
        break;
        
      case 'event_flash':
        // 事件闪光：快速变化颜色
        const flashColor = this.calculateFlashColor(animation);
        light.color = flashColor;
        break;
    }
    
    // 更新灯光最后更新时间
    light.lastUpdate = Date.now();
  }

  /**
   * 🎨 计算闪光颜色
   * @param {Object} animation - 动画对象
   * @returns {string} 颜色值
   */
  calculateFlashColor(animation) {
    const terrorFactor = animation.params.terrorLevel / 100;
    
    if (animation.params.eventData && animation.params.eventData.type) {
      // 根据事件类型返回不同颜色
      switch (animation.params.eventData.type) {
        case 'blood_drip':
          return `rgba(200, 0, 0, ${0.7 + terrorFactor * 0.3})`; // 血红色
        case 'ghost_appearance':
          return `rgba(100, 150, 255, ${0.6 + terrorFactor * 0.2})`; // 幽灵蓝
        case 'sudden_darkness':
          return `rgba(30, 30, 30, ${0.8 + terrorFactor * 0.2})`; // 深灰色
        default:
          return `rgba(255, 100, 50, ${0.8 + terrorFactor * 0.2})`; // 默认橙色
      }
    }
    
    // 默认闪光颜色
    const r = 255;
    const g = 150 - terrorFactor * 100;
    const b = 100 - terrorFactor * 80;
    const a = 0.7 + terrorFactor * 0.3;
    
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * ✅ 检查动画是否完成
   * @param {Object} animation - 动画对象
   * @returns {boolean} 是否完成
   */
  checkAnimationComplete(animation) {
    const definition = this.animationDefinitions[animation.type];
    
    if (definition.isOneShot) {
      // 一次性动画：进度达到1.0时完成
      return animation.progress >= 1.0;
    }
    
    // 持续动画：根据运行时间或条件判断
    if (definition.requiresTarget && !animation.targetLight) {
      return true; // 目标丢失，停止动画
    }
    
    if (definition.requiresMaterial && !animation.targetMaterial) {
      return true; // 材质丢失，停止动画
    }
    
    // 默认：持续运行
    return false;
  }

  /**
   * 😱 更新恐怖状态
   * @param {number} deltaTime - 时间增量
   */
  updateTerrorState(deltaTime) {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.terrorState.lastUpdate;
    
    // 记录恐怖等级历史
    if (timeSinceLastUpdate > 1000) { // 每1秒记录一次
      this.terrorState.levelHistory.push({
        time: now,
        level: this.terrorState.level
      });
      
      // 保持历史记录不超过100个
      if (this.terrorState.levelHistory.length > 100) {
        this.terrorState.levelHistory.shift();
      }
      
      this.terrorState.lastUpdate = now;
    }
    
    // 恐怖等级自动变化（模拟游戏进程）
    if (Math.random() < 0.01) { // 1%概率变化
      const change = (Math.random() - 0.5) * 10; // -5到+5的变化
      this.terrorState.level = Math.max(0, Math.min(100, this.terrorState.level + change));
    }
  }

  /**
   * ⚡ 自适应性能调整
   * 根据实际性能动态调整配置
   */
  adaptivePerformanceAdjustment() {
    const stats = this.performanceStats;
    
    // FPS过低时降低质量
    if (stats.actualFPS < this.config.mobileFPS * 0.7) {
      console.log(`⚠️ FPS过低 (${stats.actualFPS.toFixed(1)}), 降低动画质量`);
      
      // 减少最大动画数
      this.config.maxAnimations = Math.max(1, this.config.maxAnimations - 1);
      
      // 降低帧更新阈值
      this.config.frameUpdateThreshold = Math.max(0.2, this.config.frameUpdateThreshold - 0.1);
      
      // 切换到性能模式
      this.config.performanceMode = 'performance';
    }
    
    // FPS良好时恢复质量
    if (stats.actualFPS > this.config.mobileFPS * 0.9 && stats.activeAnimations < 2) {
      // 逐渐恢复设置
      this.config.maxAnimations = Math.min(3, this.config.maxAnimations + 1);
      this.config.frameUpdateThreshold = Math.min(0.8, this.config.frameUpdateThreshold + 0.05);
      
      if (this.config.maxAnimations >= 3 && this.config.frameUpdateThreshold >= 0.6) {
        this.config.performanceMode = 'balanced';
      }
    }
  }

  /**
   * ⚡ 触发恐怖事件动画
   * @param {string} eventType - 事件类型
   * @param {Object} options - 事件选项
   */
  triggerTerrorEvent(eventType, options = {}) {
    console.log(`🎭 触发恐怖事件: ${eventType}`);
    
    const eventAnimations = {
      blood_drip: {
        type: 'event_flash',
        params: {
          eventData: { type: 'blood_drip', intensity: options.intensity || 0.8 },
          terrorLevel: Math.min(100, this.terrorState.level + 20)
        }
      },
      
      ghost_appearance: {
        type: 'ghost_follow',
        params: {
          eventData: { type: 'ghost_appearance', ghostId: options.ghostId },
          terrorLevel: Math.min(100, this.terrorState.level + 15)
        }
      },
      
      sudden_darkness: {
        type: 'random_dim',
        params: {
          eventData: { type: 'sudden_darkness', duration: options.duration || 2000 },
          terrorLevel: Math.min(100, this.terrorState.level + 10)
        }
      },
      
      sanity_drop: {
        type: 'sanity_sync',
        params: {
          eventData: { type: 'sanity_drop', amount: options.amount || 30 },
          terrorLevel: Math.min(100, this.terrorState.level + options.amount || 30)
        }
      }
    };
    
    const eventConfig = eventAnimations[eventType];
    if (!eventConfig) {
      console.warn(`⚠️ 未知的恐怖事件类型: ${eventType}`);
      return null;
    }
    
    // 更新恐怖等级
    if (options.increaseTerror !== false) {
      this.terrorState.level = Math.min(100, this.terrorState.level + (options.terrorIncrease || 10));
    }
    
    // 启动事件动画
    try {
      return this.startAnimation(eventConfig.type, {
        ...eventConfig.params,
        ...options
      });
    } catch (error) {
      console.error(`❌ 触发恐怖事件失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 🖐️ 处理用户交互
   * @param {Object} interaction - 交互数据
   */
  handleUserInteraction(interaction) {
    console.log(`🖐️ 用户交互: ${interaction.type}`);
    
    // 启动用户交互动画
    try {
      return this.startAnimation('user_interaction', {
        userInput: interaction,
        terrorLevel: this.terrorState.level,
        targetLight: interaction.targetLight,
        targetPosition: interaction.position
      });
    } catch (error) {
      console.warn(`⚠️ 用户交互动画启动失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 📊 获取性能统计
   * @returns {Object} 性能统计信息
   */
  getPerformanceStats() {
    const memoryUsage = this.calculateMemoryUsage();
    
    return {
      ...this.performanceStats,
      memoryUsageKB: (memoryUsage / 1024).toFixed(2),
      terrorLevel: this.terrorState.level,
      activeAnimationTypes: this.getActiveAnimationTypes(),
      poolUtilization: this.calculatePoolUtilization(),
      performanceMode: this.config.performanceMode,
      frameSkipRate: ((this.performanceStats.frameSkipped / 
        (this.performanceStats.frameSkipped + this.performanceStats.frameUpdated)) * 100).toFixed(1) + '%'
    };
  }

  /**
   * 🧮 计算内存使用
   * @returns {number} 内存占用量 (bytes)
   */
  calculateMemoryUsage() {
    let total = 0;
    
    // 活跃动画内存
    for (const animation of this.activeAnimations.values()) {
      const definition = this.animationDefinitions[animation.type];
      total += definition.memoryFootprint;
    }
    
    // 对象池内存
    for (const animationType in this.animationPool) {
      const definition = this.animationDefinitions[animationType];
      total += this.animationPool[animationType].length * definition.memoryFootprint;
    }
    
    return total;
  }

  /**
   * 📋 获取活跃动画类型统计
   * @returns {Object} 各类型活跃动画数量
   */
  getActiveAnimationTypes() {
    const types = {};
    for (const animation of this.activeAnimations.values()) {
      types[animation.type] = (types[animation.type] || 0) + 1;
    }
    return types;
  }

  /**
   * 📊 计算对象池利用率
   * @returns {Object} 各类型对象池利用率
   */
  calculatePoolUtilization() {
    const utilization = {};
    for (const animationType in this.animationPool) {
      const total = 5; // 每种最多5个
      const available = this.animationPool[animationType].length;
      const used = total - available;
      utilization[animationType] = {
        total,
        available,
        used,
        utilization: ((used / total) * 100).toFixed(1) + '%'
      };
    }
    return utilization;
  }

  /**
   * 🧪 运行演示测试
   */
  runDemoTest() {
    console.log('🎬 开始灯光动画控制器演示测试...');
    
    const demoResults = [];
    
    try {
      // 测试1: 启动各种动画
      console.log('\n1. 测试启动各种动画类型:');
      const animationTypes = Object.keys(this.animationDefinitions).slice(0, 5);
      
      for (const type of animationTypes) {
        const animation = this.startAnimation(type, {
          terrorLevel: Math.floor(Math.random() * 100)
        });
        
        if (animation) {
          demoResults.push({ type, success: true, id: animation.id });
          console.log(`   ✅ 启动 ${type}: ${animation.id}`);
        } else {
          demoResults.push({ type, success: false });
          console.log(`   ❌ 启动 ${type} 失败`);
        }
      }
      
      // 测试2: 运行几帧更新
      console.log('\n2. 测试动画更新:');
      for (let i = 0; i < 3; i++) {
        this.update(16.67);
        console.log(`   第${i+1}帧: 活跃动画=${this.performanceStats.activeAnimations}, ` +
                   `FPS=${this.performanceStats.actualFPS.toFixed(1)}`);
      }
      
      // 测试3: 触发恐怖事件
      console.log('\n3. 测试恐怖事件触发:');
      const eventResult = this.triggerTerrorEvent('blood_drip', { intensity: 0.9 });
      if (eventResult) {
        demoResults.push({ event: 'blood_drip', success: true });
        console.log(`   ✅ 触发 blood_drip 事件: ${eventResult.id}`);
      }
      
      // 测试4: 显示性能统计
      console.log('\n4. 性能统计:');
      const stats = this.getPerformanceStats();
      for (const [key, value] of Object.entries(stats)) {
        if (typeof value !== 'object') {
          console.log(`   ${key}: ${value}`);
        }
      }
      
      // 测试5: 清理
      console.log('\n5. 测试清理功能:');
      const activeCount = this.performanceStats.activeAnimations;
      for (const [id] of this.activeAnimations.entries()) {
        this.stopAnimation(id);
      }
      console.log(`   清理了 ${activeCount} 个活跃动画`);
      
      console.log('\n🎉 演示测试完成！');
      
    } catch (error) {
      console.error('❌ 演示测试失败:', error);
      demoResults.push({ error: error.message });
    }
    
    return demoResults;
  }

  /**
   * 🔄 重置控制器
   */
  reset() {
    console.log('🔄 重置灯光动画控制器...');
    
    // 停止所有活跃动画
    const animationIds = Array.from(this.activeAnimations.keys());
    for (const id of animationIds) {
      this.stopAnimation(id);
    }
    
    // 重置恐怖状态
    this.terrorState = {
      level: 0,
      progressionSpeed: 0.01,
      lastUpdate: Date.now(),
      levelHistory: []
    };
    
    // 重置性能统计
    this.performanceStats = {
      totalAnimations: 0,
      activeAnimations: 0,
      frameSkipped: 0,
      frameUpdated: 0,
      poolHits: 0,
      poolMisses: 0,
      memoryUsage: 0,
      lastUpdateTime: 0,
      targetFPS: this.config.mobileFPS,
      actualFPS: 0
    };
    
    console.log('✅ 灯光动画控制器已重置');
  }

  /**
   * 💾 销毁控制器
   */
  destroy() {
    console.log('💾 销毁灯光动画控制器...');
    
    this.reset();
    
    // 清空对象池
    for (const animationType in this.animationPool) {
      this.animationPool[animationType] = [];
    }
    
    this.activeAnimations.clear();
    
    console.log('✅ 灯光动画控制器已销毁，所有资源已释放');
  }
}

// 📦 导出控制器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LightAnimationController;
}

// 🎮 简单的自测试代码
if (typeof window !== 'undefined' && window.testLightAnimation) {
  console.log('🎬 灯光动画控制器加载完成，开始自测试...');
  
  const animationController = new LightAnimationController({
    maxAnimations: 3,
    animationPoolSize: 5,
    debugMode: true
  });
  
  // 运行演示测试
  animationController.runDemoTest();
  
  // 最后销毁
  setTimeout(() => {
    animationController.destroy();
    console.log('🎯 灯光动画控制器测试完成');
  }, 5000);
}