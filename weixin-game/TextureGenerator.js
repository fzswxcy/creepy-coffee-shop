/**
 * TextureGenerator.js - 《微恐咖啡厅》微信小游戏纹理生成工具
 * 版本: 1.0
 * 创建时间: 2026年3月4日
 * 描述: 程序化纹理生成器，为8种材质生成基础纹理
 * 优化: 微信小游戏性能友好，支持动态纹理生成和压缩
 */

class TextureGenerator {
  constructor() {
    // 创建离屏Canvas用于纹理生成
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 256;  // 微信小游戏优化：256x256足够
    this.canvas.height = 256;
    
    // 纹理缓存
    this.textureCache = new Map();
    
    // 微信小游戏性能监控
    this.performance = {
      startTime: 0,
      endTime: 0,
      memoryUsed: 0
    };
    
    console.log('🔧 TextureGenerator 初始化完成，Canvas尺寸: 256x256');
  }

  /**
   * 生成深色木质纹理
   * @param {number} grainCount - 木纹数量
   * @returns {ImageData} 纹理数据
   */
  generateWoodDark(grainCount = 40) {
    console.log('🪵 生成深色木质纹理...');
    this.performance.startTime = performance.now();
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 清空Canvas
    ctx.clearRect(0, 0, width, height);
    
    // 基础棕色背景
    ctx.fillStyle = '#5D4037'; // 深棕色
    ctx.fillRect(0, 0, width, height);
    
    // 添加木纹
    ctx.strokeStyle = '#3E2723'; // 更深的木纹颜色
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // 生成木纹
    for (let i = 0; i < grainCount; i++) {
      ctx.beginPath();
      
      // 木纹起始位置
      const startX = Math.random() * width;
      const startY = Math.random() * height * 0.2;
      
      // 木纹路径
      ctx.moveTo(startX, startY);
      
      // 创建木纹曲线
      for (let j = 0; j < 5; j++) {
        const x = startX + (Math.random() - 0.5) * 30;
        const y = startY + (j + 1) * (height / 5) + (Math.random() - 0.5) * 20;
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    }
    
    // 添加木材质感（噪点）
    this.addWoodGrainNoise();
    
    const textureData = ctx.getImageData(0, 0, width, height);
    this.performance.endTime = performance.now();
    this.performance.memoryUsed = textureData.data.length;
    
    console.log(`✅ 深色木质纹理生成完成，用时: ${(this.performance.endTime - this.performance.startTime).toFixed(2)}ms`);
    
    return textureData;
  }

  /**
   * 生成浅色木质纹理
   * @param {number} grainCount - 木纹数量
   * @returns {ImageData} 纹理数据
   */
  generateWoodLight(grainCount = 35) {
    console.log('🪵 生成浅色木质纹理...');
    this.performance.startTime = performance.now();
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // 浅色木纹背景
    ctx.fillStyle = '#D7CCC8'; // 浅米色
    ctx.fillRect(0, 0, width, height);
    
    // 添加木纹
    ctx.strokeStyle = '#A1887F'; // 中棕色木纹
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    
    // 生成木纹
    for (let i = 0; i < grainCount; i++) {
      ctx.beginPath();
      
      const startX = Math.random() * width;
      const startY = Math.random() * height * 0.2;
      
      ctx.moveTo(startX, startY);
      
      for (let j = 0; j < 5; j++) {
        const x = startX + (Math.random() - 0.5) * 25;
        const y = startY + (j + 1) * (height / 5) + (Math.random() - 0.5) * 15;
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    }
    
    // 添加浅色木材质感
    this.addWoodGrainNoise(0.3); // 降低噪点强度
    
    const textureData = ctx.getImageData(0, 0, width, height);
    this.performance.endTime = performance.now();
    
    console.log(`✅ 浅色木质纹理生成完成，用时: ${(this.performance.endTime - this.performance.startTime).toFixed(2)}ms`);
    
    return textureData;
  }

  /**
   * 生成金属纹理
   * @param {number} roughness - 粗糙度 (0.1-0.9)
   * @returns {ImageData} 纹理数据
   */
  generateMetalBrushed(roughness = 0.3) {
    console.log('🔩 生成金属纹理...');
    this.performance.startTime = performance.now();
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // 金属基础颜色（不锈钢）
    const baseColor = this.hexToRgb('#B0BEC5'); // 蓝灰色
    
    // 创建金属渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 1)`);
    gradient.addColorStop(0.5, `rgba(${baseColor.r + 20}, ${baseColor.g + 20}, ${baseColor.b + 20}, 1)`);
    gradient.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 1)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 添加刷痕效果（金属拉丝）
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + roughness * 0.2})`;
    ctx.lineWidth = 1;
    
    // 水平刷痕
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      const y = Math.random() * height;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // 垂直刷痕（较少）
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      const x = Math.random() * width;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 添加金属高光
    this.addMetalHighlights();
    
    const textureData = ctx.getImageData(0, 0, width, height);
    this.performance.endTime = performance.now();
    
    console.log(`✅ 金属纹理生成完成，用时: ${(this.performance.endTime - this.performance.startTime).toFixed(2)}ms`);
    
    return textureData;
  }

  /**
   * 生成陶瓷纹理
   * @param {string} type - 陶瓷类型 ('porcelain' | 'stoneware')
   * @returns {ImageData} 纹理数据
   */
  generateCeramic(type = 'porcelain') {
    console.log('🍶 生成陶瓷纹理...');
    this.performance.startTime = performance.now();
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // 陶瓷基础颜色
    let baseColor;
    if (type === 'porcelain') {
      baseColor = this.hexToRgb('#FAFAFA'); // 瓷白色
    } else {
      baseColor = this.hexToRgb('#BCAAA4'); // 陶土色
    }
    
    // 平滑的陶瓷背景
    ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
    ctx.fillRect(0, 0, width, height);
    
    // 添加陶瓷光泽（径向渐变）
    const radialGradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width / 2
    );
    
    radialGradient.addColorStop(0, `rgba(255, 255, 255, 0.3)`);
    radialGradient.addColorStop(0.7, `rgba(255, 255, 255, 0.1)`);
    radialGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, width, height);
    
    // 添加微妙的纹理颗粒（陶瓷质感）
    this.addCeramicGrain(baseColor);
    
    const textureData = ctx.getImageData(0, 0, width, height);
    this.performance.endTime = performance.now();
    
    console.log(`✅ ${type}陶瓷纹理生成完成，用时: ${(this.performance.endTime - this.performance.startTime).toFixed(2)}ms`);
    
    return textureData;
  }

  /**
   * 生成布料纹理
   * @param {string} pattern - 布料图案 ('linen' | 'cotton' | 'wool')
   * @returns {ImageData} 纹理数据
   */
  generateFabric(pattern = 'linen') {
    console.log('🧵 生成布料纹理...');
    this.performance.startTime = performance.now();
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // 布料基础颜色
    let baseColor;
    switch (pattern) {
      case 'linen':
        baseColor = this.hexToRgb('#EFEBE9'); // 亚麻色
        break;
      case 'cotton':
        baseColor = this.hexToRgb('#FFFFFF'); // 棉白色
        break;
      case 'wool':
        baseColor = this.hexToRgb('#795548'); // 羊毛棕色
        break;
      default:
        baseColor = this.hexToRgb('#EFEBE9');
    }
    
    // 布料背景
    ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
    ctx.fillRect(0, 0, width, height);
    
    // 添加布料纹理
    if (pattern === 'linen') {
      this.addLinenWeave(baseColor);
    } else if (pattern === 'cotton') {
      this.addCottonWeave(baseColor);
    } else if (pattern === 'wool') {
      this.addWoolTexture(baseColor);
    }
    
    const textureData = ctx.getImageData(0, 0, width, height);
    this.performance.endTime = performance.now();
    
    console.log(`✅ ${pattern}布料纹理生成完成，用时: ${(this.performance.endTime - this.performance.startTime).toFixed(2)}ms`);
    
    return textureData;
  }

  /**
   * 生成纸张纹理
   * @param {string} type - 纸张类型 ('parchment' | 'newspaper' | 'menu')
   * @returns {ImageData} 纹理数据
   */
  generatePaper(type = 'parchment') {
    console.log('📄 生成纸张纹理...');
    this.performance.startTime = performance.now();
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // 纸张基础颜色
    let baseColor;
    if (type === 'parchment') {
      baseColor = this.hexToRgb('#FFF8E1'); // 羊皮纸色
    } else if (type === 'newspaper') {
      baseColor = this.hexToRgb('#F5F5F5'); // 新闻纸色
    } else {
      baseColor = this.hexToRgb('#FFFFFF'); // 菜单白色
    }
    
    // 纸张背景
    ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
    ctx.fillRect(0, 0, width, height);
    
    // 添加纸张质感
    this.addPaperTexture(type, baseColor);
    
    const textureData = ctx.getImageData(0, 0, width, height);
    this.performance.endTime = performance.now();
    
    console.log(`✅ ${type}纸张纹理生成完成，用时: ${(this.performance.endTime - this.performance.startTime).toFixed(2)}ms`);
    
    return textureData;
  }

  /**
   * 生成幽灵纹理（半透明）
   * @param {number} transparency - 透明度 (0.1-0.7)
   * @returns {ImageData} 纹理数据
   */
  generateGhost(transparency = 0.5) {
    console.log('👻 生成幽灵纹理...');
    this.performance.startTime = performance.now();
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // 幽灵基础颜色（淡蓝白色）
    const baseColor = this.hexToRgb('#E1F5FE');
    
    // 创建幽灵般的渐变
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width * 0.7
    );
    
    gradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${transparency})`);
    gradient.addColorStop(0.5, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${transparency * 0.7})`);
    gradient.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 添加幽灵般的扭曲效果
    this.addGhostDistortion();
    
    // 添加微弱的发光效果
    this.addGhostGlow();
    
    const textureData = ctx.getImageData(0, 0, width, height);
    this.performance.endTime = performance.now();
    
    console.log(`✅ 幽灵纹理生成完成，用时: ${(this.performance.endTime - this.performance.startTime).toFixed(2)}ms`);
    
    return textureData;
  }

  /**
   * 生成恐怖纹理（血迹、阴影）
   * @param {string} type - 恐怖类型 ('blood' | 'shadow' | 'crack')
   * @returns {ImageData} 纹理数据
   */
  generateHorror(type = 'blood') {
    console.log('🩸 生成恐怖纹理...');
    this.performance.startTime = performance.now();
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (type === 'blood') {
      // 血迹纹理
      this.generateBloodTexture();
    } else if (type === 'shadow') {
      // 阴影纹理
      this.generateShadowTexture();
    } else {
      // 裂痕纹理
      this.generateCrackTexture();
    }
    
    const textureData = ctx.getImageData(0, 0, width, height);
    this.performance.endTime = performance.now();
    
    console.log(`✅ ${type}恐怖纹理生成完成，用时: ${(this.performance.endTime - this.performance.startTime).toFixed(2)}ms`);
    
    return textureData;
  }

  /**
   * 压缩纹理（微信小游戏优化）
   * @param {ImageData} imageData - 原始纹理数据
   * @param {number} quality - 压缩质量 (0.1-1.0)
   * @returns {string} 压缩后的DataURL
   */
  compressTexture(imageData, quality = 0.8) {
    console.log('📦 压缩纹理...');
    
    // 将ImageData放回Canvas
    this.ctx.putImageData(imageData, 0, 0);
    
    // 转换为DataURL（JPEG格式以减小大小）
    const dataUrl = this.canvas.toDataURL('image/jpeg', quality);
    
    // 计算压缩率
    const originalSize = imageData.data.length;
    const compressedSize = Math.floor(dataUrl.length * 0.75); // Base64近似大小
    
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ 纹理压缩完成: ${compressionRatio}% 压缩率`);
    console.log(`   原始大小: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`   压缩后: ${(compressedSize / 1024).toFixed(1)}KB`);
    
    return dataUrl;
  }

  /**
   * 批量生成所有材质纹理
   * @returns {Object} 所有纹理的映射
   */
  generateAllTextures() {
    console.log('🎨 开始批量生成所有材质纹理...');
    
    const textures = {
      woodDark: this.generateWoodDark(),
      woodLight: this.generateWoodLight(),
      metalBrushed: this.generateMetalBrushed(),
      ceramicPorcelain: this.generateCeramic('porcelain'),
      fabricLinen: this.generateFabric('linen'),
      paperParchment: this.generatePaper('parchment'),
      ghostEthereal: this.generateGhost(0.5),
      horrorBlood: this.generateHorror('blood')
    };
    
    console.log('✅ 所有材质纹理生成完成！');
    
    return textures;
  }

  // ==================== 辅助方法 ====================

  /**
   * 添加木材质感噪点
   * @param {number} intensity - 噪点强度 (0-1)
   */
  addWoodGrainNoise(intensity = 0.5) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 添加微妙的噪点
    for (let i = 0; i < data.length; i += 4) {
      // 只轻微修改RGB值
      const noise = (Math.random() - 0.5) * 10 * intensity;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 添加金属高光
   */
  addMetalHighlights() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 随机高光点
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3 + 1;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 添加陶瓷颗粒
   * @param {Object} baseColor - 基础颜色 {r, g, b}
   */
  addCeramicGrain(baseColor) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 添加极细微的颗粒
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < 0.05) { // 5%的像素添加颗粒
        const grain = Math.random() * 10 - 5;
        data[i] = Math.max(0, Math.min(255, data[i] + grain));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 添加亚麻编织纹理
   * @param {Object} baseColor - 基础颜色
   */
  addLinenWeave(baseColor) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 水平编织线
    ctx.strokeStyle = `rgba(${baseColor.r - 10}, ${baseColor.g - 10}, ${baseColor.b - 10}, 0.2)`;
    ctx.lineWidth = 1;
    
    const weaveSize = 8; // 编织间距
    
    for (let y = 0; y < height; y += weaveSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      
      // 创建波浪线效果
      for (let x = 0; x < width; x += 5) {
        const wave = Math.sin(x * 0.1) * 2;
        ctx.lineTo(x, y + wave);
      }
      
      ctx.stroke();
    }
    
    // 垂直编织线（较少）
    ctx.strokeStyle = `rgba(${baseColor.r - 15}, ${baseColor.g - 15}, ${baseColor.b - 15}, 0.15)`;
    
    for (let x = 0; x < width; x += weaveSize * 1.5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      
      for (let y = 0; y < height; y += 5) {
        const wave = Math.sin(y * 0.1) * 2;
        ctx.lineTo(x + wave, y);
      }
      
      ctx.stroke();
    }
  }

  /**
   * 添加纸张纹理
   * @param {string} type - 纸张类型
   * @param {Object} baseColor - 基础颜色
   */
  addPaperTexture(type, baseColor) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 纸张纤维效果
    for (let i = 0; i < data.length; i += 4) {
      // 添加微妙的黄色调（老纸效果）
      if (type === 'parchment') {
        const ageEffect = Math.random() * 5;
        data[i] = Math.max(0, Math.min(255, data[i] + ageEffect)); // 增加红色
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + ageEffect * 0.8)); // 增加绿色
      }
      
      // 添加纤维噪点
      if (Math.random() < 0.03) {
        const fiber = Math.random() * 20 - 10;
        data[i] = Math.max(0, Math.min(255, data[i] + fiber));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + fiber));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + fiber));
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // 如果是羊皮纸，添加边缘变暗效果
    if (type === 'parchment') {
      const edgeGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width / 2
      );
      
      edgeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      edgeGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
      edgeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
      
      ctx.fillStyle = edgeGradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  /**
   * 添加幽灵扭曲效果
   */
  addGhostDistortion() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 创建扭曲效果（波浪状）
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        
        // 计算扭曲偏移
        const waveX = Math.sin(y * 0.05 + x * 0.03) * 3;
        const waveY = Math.cos(x * 0.04 + y * 0.02) * 3;
        
        const sourceX = Math.max(0, Math.min(width - 1, x + waveX));
        const sourceY = Math.max(0, Math.min(height - 1, y + waveY));
        const sourceIndex = (Math.floor(sourceY) * width + Math.floor(sourceX)) * 4;
        
        // 混合像素创建扭曲效果
        if (sourceIndex < data.length - 3) {
          data[index] = data[sourceIndex];
          data[index + 1] = data[sourceIndex + 1];
          data[index + 2] = data[sourceIndex + 2];
          data[index + 3] = data[sourceIndex + 3] * 0.9; // 轻微透明化
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 添加幽灵发光效果
   */
  addGhostGlow() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 外发光
    ctx.shadowColor = 'rgba(225, 245, 254, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 绘制发光源
    ctx.fillStyle = 'rgba(225, 245, 254, 0.1)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  /**
   * 生成血迹纹理
   */
  generateBloodTexture() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 血迹基础颜色（深红色）
    ctx.fillStyle = '#8B0000'; // 深红色
    ctx.fillRect(0, 0, width, height);
    
    // 添加血迹飞溅效果
    ctx.fillStyle = '#B71C1C'; // 亮红色
    
    // 主血迹
    this.drawBloodSplat(ctx, width * 0.3, height * 0.4, 40);
    this.drawBloodSplat(ctx, width * 0.6, height * 0.6, 30);
    this.drawBloodSplat(ctx, width * 0.4, height * 0.7, 25);
    
    // 血迹滴落效果
    ctx.strokeStyle = '#D32F2F';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      const startX = Math.random() * width;
      const startY = Math.random() * height * 0.3;
      
      ctx.moveTo(startX, startY);
      
      // 血迹滴落路径
      let x = startX;
      let y = startY;
      
      for (let j = 0; j < 5; j++) {
        x += (Math.random() - 0.5) * 10;
        y += Math.random() * 20 + 5;
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
      
      // 血迹末端
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 3 + 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 绘制血迹飞溅
   */
  drawBloodSplat(ctx, centerX, centerY, size) {
    ctx.beginPath();
    
    // 血迹形状（不规则圆形）
    const points = 12;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radius = size + Math.random() * size * 0.3;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fill();
    
    // 血迹内部细节
    ctx.fillStyle = 'rgba(183, 28, 28, 0.7)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 生成阴影纹理
   */
  generateShadowTexture() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 渐变阴影
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width / 2
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 添加噪点增强恐怖感
    this.addShadowNoise();
  }

  /**
   * 生成裂痕纹理
   */
  generateCrackTexture() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 裂痕基础（深色背景）
    ctx.fillStyle = '#212121';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制裂痕
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 主裂痕
    this.drawCrack(ctx, width * 0.2, height * 0.2, width * 0.8, height * 0.8, 3);
    this.drawCrack(ctx, width * 0.7, height * 0.3, width * 0.3, height * 0.7, 2);
    
    // 小裂痕
    for (let i = 0; i < 15; i++) {
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      const length = Math.random() * 50 + 20;
      const angle = Math.random() * Math.PI * 2;
      
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
      
      this.drawCrack(ctx, startX, startY, endX, endY, 1);
    }
  }

  /**
   * 绘制裂痕
   */
  drawCrack(ctx, startX, startY, endX, endY, thickness) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    const steps = 8;
    const dx = (endX - startX) / steps;
    const dy = (endY - startY) / steps;
    
    let x = startX;
    let y = startY;
    
    for (let i = 1; i <= steps; i++) {
      x += dx + (Math.random() - 0.5) * 10;
      y += dy + (Math.random() - 0.5) * 10;
      ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    
    // 裂痕末端加粗
    ctx.beginPath();
    ctx.arc(endX, endY, thickness * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 添加阴影噪点
   */
  addShadowNoise() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 添加随机暗点增强恐怖氛围
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < 0.02) { // 2%的像素
        const darkness = Math.random() * 50;
        data[i] = Math.max(0, data[i] - darkness);     // R
        data[i + 1] = Math.max(0, data[i + 1] - darkness); // G
        data[i + 2] = Math.max(0, data[i + 2] - darkness); // B
      }
      
      // 添加微弱的彩色噪点（恐怖氛围）
      if (Math.random() < 0.01) { // 1%的像素
        data[i] = Math.max(0, Math.min(255, data[i] + (Math.random() * 30 - 15))); // R
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] - (Math.random() * 20))); // G（减少绿色）
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] - (Math.random() * 20))); // B（减少蓝色）
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 添加棉布编织
   */
  addCottonWeave(baseColor) {
    // 棉布更平滑，编织纹理更细
    this.addLinenWeave(baseColor);
    
    // 减少线条宽度和对比度
    const ctx = this.ctx;
    const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    // 柔化整体效果
    for (let i = 0; i < data.length; i += 4) {
      // 轻微增加亮度
      data[i] = Math.min(255, data[i] + 5);
      data[i + 1] = Math.min(255, data[i + 1] + 5);
      data[i + 2] = Math.min(255, data[i + 2] + 5);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 添加羊毛纹理
   */
  addWoolTexture(baseColor) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 添加羊毛的毛茸茸质感
    for (let i = 0; i < data.length; i += 4) {
      // 更强的噪点模拟羊毛纤维
      const fiberNoise = (Math.random() - 0.5) * 30;
      data[i] = Math.max(0, Math.min(255, data[i] + fiberNoise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + fiberNoise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + fiberNoise));
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // 添加微弱的编织暗示
    ctx.strokeStyle = `rgba(${baseColor.r - 20}, ${baseColor.g - 20}, ${baseColor.b - 20}, 0.1)`;
    ctx.lineWidth = 1;
    
    const weaveSize = 12;
    for (let y = 0; y < height; y += weaveSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    for (let x = 0; x < width; x += weaveSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  /**
   * 十六进制颜色转RGB
   * @param {string} hex - 十六进制颜色值
   * @returns {Object} RGB对象
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * 获取性能统计
   * @returns {Object} 性能数据
   */
  getPerformanceStats() {
    return {
      generationTime: this.performance.endTime - this.performance.startTime,
      memoryUsage: this.performance.memoryUsed,
      canvasSize: `${this.canvas.width}x${this.canvas.height}`,
      cacheSize: this.textureCache.size
    };
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.textureCache.clear();
    console.log('🧹 纹理缓存已清理');
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextureGenerator;
}

console.log('🎨 TextureGenerator 模块加载完成！');