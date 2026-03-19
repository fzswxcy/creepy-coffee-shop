/**
 * TextureManager.js - 《微恐咖啡厅》微信小游戏纹理管理系统
 * 版本: 1.0
 * 创建时间: 2026年3月4日
 * 描述: 纹理加载、缓存和内存管理系统
 * 优化: 微信小游戏性能优化，支持动态卸载和内存监控
 */

class TextureManager {
  constructor(options = {}) {
    // 配置参数
    this.config = {
      maxCacheSize: options.maxCacheSize || 8,       // 最大缓存纹理数量
      maxMemoryMB: options.maxMemoryMB || 10,        // 最大内存使用 (MB)
      compressionQuality: options.compressionQuality || 0.8, // JPEG压缩质量
      autoCleanup: options.autoCleanup !== false,    // 自动清理
      debugMode: options.debugMode || false          // 调试模式
    };

    // 纹理缓存
    this.textureCache = new Map();                   // Map<name, textureData>
    
    // 纹理状态
    this.textureStats = new Map();                   // Map<name, stats>
    
    // 内存使用统计
    this.memoryUsage = {
      total: 0,               // 总内存使用 (bytes)
      compressed: 0,          // 压缩后内存
      uncompressed: 0,        // 未压缩内存
      peak: 0,                // 峰值内存
      textureCount: 0         // 纹理数量
    };

    // 加载队列
    this.loadQueue = [];
    this.isLoading = false;

    // 微信小游戏性能监控
    this.performance = {
      loadStartTime: 0,
      loadEndTime: 0,
      framesSinceLastCleanup: 0
    };

    // 纹理生成器实例
    this.textureGenerator = null;

    console.log('🔧 TextureManager 初始化完成');
    console.log(`   配置: 最大缓存 ${this.config.maxCacheSize}个纹理，最大内存 ${this.config.maxMemoryMB}MB`);
  }

  /**
   * 设置纹理生成器
   * @param {TextureGenerator} generator - 纹理生成器实例
   */
  setTextureGenerator(generator) {
    this.textureGenerator = generator;
    console.log('🔗 纹理生成器已连接');
  }

  /**
   * 加载纹理（支持多种来源）
   * @param {string} name - 纹理名称
   * @param {string|Function|ImageData} source - 纹理来源
   * @returns {Promise<ImageData>} 纹理数据
   */
  async loadTexture(name, source) {
    console.log(`📥 加载纹理: ${name}`);
    
    // 检查缓存
    if (this.textureCache.has(name)) {
      console.log(`✅ ${name} 已在缓存中，直接返回`);
      this.updateTextureStats(name, 'hit');
      return this.textureCache.get(name);
    }

    // 检查内存限制
    if (this.isMemoryFull()) {
      console.warn('⚠️ 内存接近上限，尝试清理...');
      this.cleanupLRU();
    }

    this.performance.loadStartTime = performance.now();
    
    let textureData;
    
    try {
      // 根据来源类型处理
      if (typeof source === 'string') {
        // URL或DataURL
        textureData = await this.loadFromUrl(name, source);
      } else if (typeof source === 'function') {
        // 生成函数
        textureData = await this.loadFromGenerator(name, source);
      } else if (source instanceof ImageData) {
        // 直接ImageData
        textureData = source;
        this.calculateMemoryUsage(name, textureData);
      } else {
        throw new Error(`不支持的纹理来源类型: ${typeof source}`);
      }

      // 压缩纹理（微信小游戏优化）
      if (this.config.compressionQuality < 1.0) {
        textureData = await this.compressTexture(name, textureData);
      }

      // 添加到缓存
      this.addToCache(name, textureData);
      
      this.performance.loadEndTime = performance.now();
      const loadTime = this.performance.loadEndTime - this.performance.loadStartTime;
      
      console.log(`✅ ${name} 加载完成，用时: ${loadTime.toFixed(2)}ms`);
      console.log(`   内存使用: ${(this.memoryUsage.total / 1024 / 1024).toFixed(2)}MB / ${this.config.maxMemoryMB}MB`);
      
      return textureData;
      
    } catch (error) {
      console.error(`❌ 加载纹理失败: ${name}`, error);
      throw error;
    }
  }

  /**
   * 从URL加载纹理
   * @param {string} name - 纹理名称
   * @param {string} url - 纹理URL
   * @returns {Promise<ImageData>} 纹理数据
   */
  async loadFromUrl(name, url) {
    console.log(`🌐 从URL加载: ${url.substring(0, 50)}...`);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // 创建Canvas处理图像
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 微信小游戏优化：限制尺寸
        if (canvas.width > 512 || canvas.height > 512) {
          console.warn(`⚠️ ${name} 尺寸过大 (${canvas.width}x${canvas.height})，将缩放至256x256`);
          canvas.width = 256;
          canvas.height = 256;
          
          // 高质量缩放
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.calculateMemoryUsage(name, imageData);
        
        resolve(imageData);
      };
      
      img.onerror = (error) => {
        reject(new Error(`加载图像失败: ${url} - ${error.message}`));
      };
      
      // 开始加载
      img.src = url;
      
      // 设置超时
      setTimeout(() => {
        if (!img.complete) {
          reject(new Error(`加载超时: ${url}`));
        }
      }, 10000); // 10秒超时
    });
  }

  /**
   * 从生成器加载纹理
   * @param {string} name - 纹理名称
   * @param {Function} generator - 生成函数
   * @returns {Promise<ImageData>} 纹理数据
   */
  async loadFromGenerator(name, generator) {
    console.log(`🎨 从生成器加载: ${name}`);
    
    if (!this.textureGenerator) {
      throw new Error('纹理生成器未设置');
    }
    
    // 根据名称调用对应的生成方法
    let textureData;
    
    switch (name) {
      case 'woodDark':
        textureData = this.textureGenerator.generateWoodDark();
        break;
      case 'woodLight':
        textureData = this.textureGenerator.generateWoodLight();
        break;
      case 'metalBrushed':
        textureData = this.textureGenerator.generateMetalBrushed();
        break;
      case 'ceramicPorcelain':
        textureData = this.textureGenerator.generateCeramic('porcelain');
        break;
      case 'fabricLinen':
        textureData = this.textureGenerator.generateFabric('linen');
        break;
      case 'paperParchment':
        textureData = this.textureGenerator.generatePaper('parchment');
        break;
      case 'ghostEthereal':
        textureData = this.textureGenerator.generateGhost(0.5);
        break;
      case 'horrorBlood':
        textureData = this.textureGenerator.generateHorror('blood');
        break;
      default:
        // 尝试直接调用生成函数
        if (typeof generator === 'function') {
          textureData = generator();
        } else {
          throw new Error(`未知纹理类型: ${name}`);
        }
    }
    
    this.calculateMemoryUsage(name, textureData);
    return textureData;
  }

  /**
   * 压缩纹理
   * @param {string} name - 纹理名称
   * @param {ImageData} textureData - 原始纹理数据
   * @returns {Promise<ImageData>} 压缩后的纹理数据
   */
  async compressTexture(name, textureData) {
    console.log(`📦 压缩纹理: ${name}`);
    
    if (this.config.compressionQuality >= 1.0) {
      console.log(`⏭️ ${name} 跳过压缩 (quality=1.0)`);
      return textureData;
    }
    
    // 使用纹理生成器进行压缩
    if (this.textureGenerator && this.textureGenerator.compressTexture) {
      try {
        const compressedDataUrl = this.textureGenerator.compressTexture(
          textureData, 
          this.config.compressionQuality
        );
        
        // 从DataURL重新加载为ImageData
        return await this.loadFromUrl(`${name}_compressed`, compressedDataUrl);
      } catch (error) {
        console.warn(`⚠️ ${name} 压缩失败，使用原始数据:`, error.message);
        return textureData;
      }
    }
    
    return textureData;
  }

  /**
   * 添加到缓存
   * @param {string} name - 纹理名称
   * @param {ImageData} textureData - 纹理数据
   */
  addToCache(name, textureData) {
    // 检查是否需要清理
    if (this.textureCache.size >= this.config.maxCacheSize) {
      console.warn(`⚠️ 缓存已满 (${this.textureCache.size}/${this.config.maxCacheSize})，清理LRU...`);
      this.cleanupLRU();
    }
    
    // 添加到缓存
    this.textureCache.set(name, textureData);
    
    // 更新统计
    this.updateTextureStats(name, 'loaded');
    
    // 更新内存统计
    const textureSize = textureData.data.length;
    this.memoryUsage.total += textureSize;
    this.memoryUsage.uncompressed += textureSize;
    this.memoryUsage.textureCount = this.textureCache.size;
    
    // 更新峰值内存
    if (this.memoryUsage.total > this.memoryUsage.peak) {
      this.memoryUsage.peak = this.memoryUsage.total;
    }
    
    console.log(`💾 ${name} 已添加到缓存，当前缓存: ${this.textureCache.size}/${this.config.maxCacheSize}`);
  }

  /**
   * 获取纹理
   * @param {string} name - 纹理名称
   * @returns {ImageData|null} 纹理数据
   */
  getTexture(name) {
    if (!this.textureCache.has(name)) {
      console.warn(`⚠️ 纹理未找到: ${name}`);
      this.updateTextureStats(name, 'miss');
      return null;
    }
    
    // 更新使用统计
    this.updateTextureStats(name, 'access');
    
    return this.textureCache.get(name);
  }

  /**
   * 批量加载纹理
   * @param {Object} textureMap - 纹理映射 {name: source, ...}
   * @returns {Promise<Object>} 所有纹理数据
   */
  async loadTextures(textureMap) {
    console.log(`📦 批量加载 ${Object.keys(textureMap).length} 个纹理...`);
    
    const promises = [];
    const results = {};
    
    for (const [name, source] of Object.entries(textureMap)) {
      promises.push(
        this.loadTexture(name, source)
          .then(texture => {
            results[name] = texture;
            console.log(`✅ ${name} 加载完成`);
          })
          .catch(error => {
            console.error(`❌ ${name} 加载失败:`, error.message);
            results[name] = null;
          })
      );
    }
    
    await Promise.all(promises);
    
    console.log(`🎉 批量加载完成，成功: ${Object.values(results).filter(r => r !== null).length}/${promises.length}`);
    
    return results;
  }

  /**
   * 卸载纹理
   * @param {string} name - 纹理名称
   * @returns {boolean} 是否成功
   */
  unloadTexture(name) {
    if (!this.textureCache.has(name)) {
      console.warn(`⚠️ 尝试卸载不存在的纹理: ${name}`);
      return false;
    }
    
    const textureData = this.textureCache.get(name);
    const textureSize = textureData.data.length;
    
    // 从缓存移除
    this.textureCache.delete(name);
    
    // 更新内存统计
    this.memoryUsage.total -= textureSize;
    this.memoryUsage.textureCount = this.textureCache.size;
    
    // 从统计移除
    this.textureStats.delete(name);
    
    console.log(`🗑️ ${name} 已卸载，释放内存: ${(textureSize / 1024).toFixed(1)}KB`);
    
    return true;
  }

  /**
   * 清理最少使用的纹理 (LRU算法)
   * @param {number} count - 清理数量
   */
  cleanupLRU(count = 1) {
    console.log(`🧹 清理LRU纹理 (${count}个)...`);
    
    // 获取使用统计并按最后访问时间排序
    const textures = Array.from(this.textureStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => a.lastAccess - b.lastAccess); // 升序，最早访问的在前
    
    // 清理指定数量的纹理
    let cleaned = 0;
    for (const texture of textures) {
      if (cleaned >= count) break;
      
      if (this.unloadTexture(texture.name)) {
        cleaned++;
      }
    }
    
    console.log(`✅ LRU清理完成，清理了 ${cleaned} 个纹理`);
  }

  /**
   * 检查内存是否已满
   * @returns {boolean} 是否内存已满
   */
  isMemoryFull() {
    const memoryMB = this.memoryUsage.total / 1024 / 1024;
    const isFull = memoryMB >= this.config.maxMemoryMB * 0.9; // 90%阈值
    
    if (isFull && this.config.debugMode) {
      console.warn(`⚠️ 内存使用 ${memoryMB.toFixed(2)}MB ≥ ${this.config.maxMemoryMB * 0.9}MB (90%阈值)`);
    }
    
    return isFull;
  }

  /**
   * 计算内存使用
   * @param {string} name - 纹理名称
   * @param {ImageData} textureData - 纹理数据
   */
  calculateMemoryUsage(name, textureData) {
    const size = textureData.data.length; // bytes
    
    if (this.config.debugMode) {
      console.log(`📊 ${name} 内存计算: ${(size / 1024).toFixed(1)}KB (${textureData.width}x${textureData.height})`);
    }
  }

  /**
   * 更新纹理统计
   * @param {string} name - 纹理名称
   * @param {string} action - 操作类型 ('load', 'access', 'hit', 'miss')
   */
  updateTextureStats(name, action) {
    const now = Date.now();
    
    if (!this.textureStats.has(name)) {
      this.textureStats.set(name, {
        loadCount: 0,
        accessCount: 0,
        hitCount: 0,
        missCount: 0,
        lastAccess: now,
        firstLoad: now
      });
    }
    
    const stats = this.textureStats.get(name);
    stats.lastAccess = now;
    
    switch (action) {
      case 'loaded':
        stats.loadCount++;
        break;
      case 'access':
        stats.accessCount++;
        break;
      case 'hit':
        stats.hitCount++;
        stats.accessCount++;
        break;
      case 'miss':
        stats.missCount++;
        break;
    }
    
    this.textureStats.set(name, stats);
  }

  /**
   * 获取纹理统计
   * @param {string} name - 纹理名称 (可选)
   * @returns {Object} 统计信息
   */
  getStats(name = null) {
    if (name) {
      return this.textureStats.get(name) || null;
    }
    
    // 全局统计
    let totalLoads = 0;
    let totalAccesses = 0;
    let totalHits = 0;
    let totalMisses = 0;
    
    for (const stats of this.textureStats.values()) {
      totalLoads += stats.loadCount;
      totalAccesses += stats.accessCount;
      totalHits += stats.hitCount;
      totalMisses += stats.missCount;
    }
    
    const hitRate = totalAccesses > 0 ? (totalHits / totalAccesses * 100).toFixed(1) : 0;
    
    return {
      cacheSize: this.textureCache.size,
      maxCacheSize: this.config.maxCacheSize,
      memoryUsage: {
        total: this.memoryUsage.total,
        totalMB: (this.memoryUsage.total / 1024 / 1024).toFixed(2),
        peakMB: (this.memoryUsage.peak / 1024 / 1024).toFixed(2),
        uncompressed: this.memoryUsage.uncompressed,
        compressed: this.memoryUsage.compressed
      },
      performance: {
        hitRate: `${hitRate}%`,
        totalLoads,
        totalAccesses,
        totalHits,
        totalMisses
      },
      textures: Array.from(this.textureCache.keys())
    };
  }

  /**
   * 获取内存使用报告
   * @returns {Object} 内存报告
   */
  getMemoryReport() {
    const memoryMB = this.memoryUsage.total / 1024 / 1024;
    const peakMB = this.memoryUsage.peak / 1024 / 1024;
    const usagePercent = (memoryMB / this.config.maxMemoryMB * 100).toFixed(1);
    
    return {
      current: `${memoryMB.toFixed(2)}MB`,
      peak: `${peakMB.toFixed(2)}MB`,
      limit: `${this.config.maxMemoryMB}MB`,
      usage: `${usagePercent}%`,
      textureCount: this.memoryUsage.textureCount,
      status: memoryMB >= this.config.maxMemoryMB * 0.9 ? 'warning' : 
              memoryMB >= this.config.maxMemoryMB * 0.7 ? 'caution' : 'normal'
    };
  }

  /**
   * 清理所有纹理
   */
  clearAll() {
    console.log('🧹 清理所有纹理...');
    
    const count = this.textureCache.size;
    
    // 清空缓存
    this.textureCache.clear();
    this.textureStats.clear();
    
    // 重置内存统计
    this.memoryUsage = {
      total: 0,
      compressed: 0,
      uncompressed: 0,
      peak: this.memoryUsage.peak, // 保留峰值
      textureCount: 0
    };
    
    console.log(`✅ 清理完成，移除了 ${count} 个纹理`);
  }

  /**
   * 每帧更新（在游戏循环中调用）
   */
  update() {
    this.performance.framesSinceLastCleanup++;
    
    // 每60帧检查一次内存
    if (this.performance.framesSinceLastCleanup >= 60) {
      this.performance.framesSinceLastCleanup = 0;
      
      if (this.config.autoCleanup && this.isMemoryFull()) {
        this.cleanupLRU(1);
      }
    }
  }

  /**
   * 导出纹理数据（用于保存）
   * @returns {Object} 可序列化的纹理数据
   */
  exportTextures() {
    const exportData = {};
    
    for (const [name, textureData] of this.textureCache.entries()) {
      // 创建Canvas来获取DataURL
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = textureData.width;
      canvas.height = textureData.height;
      
      ctx.putImageData(textureData, 0, 0);
      
      // 获取压缩的DataURL
      const dataUrl = canvas.toDataURL('image/jpeg', this.config.compressionQuality);
      
      exportData[name] = {
        dataUrl,
        width: textureData.width,
        height: textureData.height,
        size: textureData.data.length
      };
    }
    
    return exportData;
  }

  /**
   * 导入纹理数据
   * @param {Object} importData - 导入的数据
   */
  async importTextures(importData) {
    console.log(`📤 导入 ${Object.keys(importData).length} 个纹理...`);
    
    for (const [name, data] of Object.entries(importData)) {
      await this.loadTexture(name, data.dataUrl);
    }
    
    console.log('✅ 纹理导入完成');
  }
}

// 微信小游戏适配
if (typeof wx !== 'undefined') {
  // 微信小游戏环境
  console.log('🌐 检测到微信小游戏环境，适配中...');
  
  // 重写URL加载方法以使用微信API
  TextureManager.prototype.loadFromUrl = async function(name, url) {
    console.log(`🌐 微信环境加载: ${name}`);
    
    return new Promise((resolve, reject) => {
      wx.createImage({
        success: (res) => {
          const img = res;
          
          img.onload = () => {
            const canvas = wx.createCanvas();
            const ctx = canvas.getContext('2d');
            
            canvas.width = Math.min(img.width, 256);
            canvas.height = Math.min(img.height, 256);
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            this.calculateMemoryUsage(name, imageData);
            
            resolve(imageData);
          };
          
          img.onerror = (error) => {
            reject(new Error(`微信加载失败: ${error.errMsg}`));
          };
          
          img.src = url;
        },
        fail: (error) => {
          reject(new Error(`创建图像失败: ${error.errMsg}`));
        }
      });
    });
  };
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextureManager;
}

console.log('🎨 TextureManager 模块加载完成！');