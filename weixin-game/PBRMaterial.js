/**
 * PBRMaterial.js - 《微恐咖啡厅》微信小游戏简化版PBR材质系统
 * 版本: 1.0
 * 创建时间: 2026年3月4日
 * 描述: 微信小游戏优化的简化版PBR（基于物理的渲染）材质系统
 * 特性: 金属度/粗糙度工作流，支持法线贴图，微信小游戏性能优化
 */

class PBRMaterial {
  constructor(options = {}) {
    // 基础材质属性
    this.name = options.name || 'unnamed_material';
    this.type = 'PBRMaterial';
    
    // PBR核心属性
    this.baseColor = options.baseColor || [1.0, 1.0, 1.0, 1.0];    // RGBA (0-1)
    this.metallic = options.metallic !== undefined ? options.metallic : 0.0;  // 0-1
    this.roughness = options.roughness !== undefined ? options.roughness : 0.5; // 0-1
    this.emissive = options.emissive || [0.0, 0.0, 0.0];          // RGB (0-1)
    this.emissiveIntensity = options.emissiveIntensity || 1.0;
    
    // 纹理贴图
    this.baseColorMap = options.baseColorMap || null;      // 基础颜色贴图
    this.normalMap = options.normalMap || null;            // 法线贴图
    this.metallicRoughnessMap = options.metallicRoughnessMap || null; // 金属度/粗糙度贴图
    this.occlusionMap = options.occlusionMap || null;      // 环境光遮蔽贴图
    this.emissiveMap = options.emissiveMap || null;        // 自发光贴图
    
    // 微信小游戏优化参数
    this.pbrQuality = options.pbrQuality || 'medium';      // 'low' | 'medium' | 'high'
    this.useCompressedTextures = options.useCompressedTextures !== false; // 使用压缩纹理
    this.dynamicQuality = options.dynamicQuality || true;  // 动态质量调整
    
    // 渲染状态
    this.needsUpdate = true;
    this.isCompiled = false;
    this.shaderProgram = null;
    
    // 性能监控
    this.performance = {
      compileTime: 0,
      drawCalls: 0,
      lastFrameTime: 0
    };
    
    // 材质分类（用于微信小游戏优化）
    this.category = options.category || 'standard';
    
    // 微信小游戏特定的优化标志
    this.wxOptimized = options.wxOptimized !== false;
    
    console.log(`🎨 PBR材质创建: ${this.name} (${this.category})`);
  }

  /**
   * 设置基础颜色
   * @param {number[]} color - RGBA数组 (0-1)
   */
  setBaseColor(color) {
    if (color.length >= 3) {
      this.baseColor[0] = color[0];
      this.baseColor[1] = color[1];
      this.baseColor[2] = color[2];
      this.baseColor[3] = color[3] !== undefined ? color[3] : 1.0;
      this.needsUpdate = true;
    }
  }

  /**
   * 设置金属度
   * @param {number} metallic - 金属度 (0-1)
   */
  setMetallic(metallic) {
    this.metallic = Math.max(0, Math.min(1, metallic));
    this.needsUpdate = true;
  }

  /**
   * 设置粗糙度
   * @param {number} roughness - 粗糙度 (0-1)
   */
  setRoughness(roughness) {
    this.roughness = Math.max(0, Math.min(1, roughness));
    this.needsUpdate = true;
  }

  /**
   * 设置自发光
   * @param {number[]} color - RGB数组 (0-1)
   * @param {number} intensity - 强度
   */
  setEmissive(color, intensity = 1.0) {
    if (color.length >= 3) {
      this.emissive[0] = color[0];
      this.emissive[1] = color[1];
      this.emissive[2] = color[2];
      this.emissiveIntensity = intensity;
      this.needsUpdate = true;
    }
  }

  /**
   * 设置纹理贴图
   * @param {string} type - 贴图类型 ('baseColor' | 'normal' | 'metallicRoughness' | 'occlusion' | 'emissive')
   * @param {ImageData|string} texture - 纹理数据或URL
   */
  setTexture(type, texture) {
    switch (type) {
      case 'baseColor':
        this.baseColorMap = texture;
        break;
      case 'normal':
        this.normalMap = texture;
        break;
      case 'metallicRoughness':
        this.metallicRoughnessMap = texture;
        break;
      case 'occlusion':
        this.occlusionMap = texture;
        break;
      case 'emissive':
        this.emissiveMap = texture;
        break;
      default:
        console.warn(`未知的贴图类型: ${type}`);
        return;
    }
    
    this.needsUpdate = true;
    console.log(`📋 ${this.name} 设置了${type}贴图`);
  }

  /**
   * 编译材质（准备渲染）
   * @param {WebGLRenderingContext} gl - WebGL上下文
   * @returns {boolean} 是否编译成功
   */
  compile(gl) {
    if (!gl) {
      console.error('❌ 编译材质失败: 缺少WebGL上下文');
      return false;
    }
    
    const startTime = performance.now();
    console.log(`🔧 编译PBR材质: ${this.name}`);
    
    try {
      // 创建着色器程序
      this.shaderProgram = this.createShaderProgram(gl);
      
      if (!this.shaderProgram) {
        throw new Error('创建着色器程序失败');
      }
      
      // 设置统一变量位置
      this.setupUniformLocations(gl);
      
      // 创建纹理（如果有）
      this.createTextures(gl);
      
      this.isCompiled = true;
      this.needsUpdate = false;
      
      this.performance.compileTime = performance.now() - startTime;
      
      console.log(`✅ ${this.name} 编译成功，用时: ${this.performance.compileTime.toFixed(2)}ms`);
      
      return true;
      
    } catch (error) {
      console.error(`❌ ${this.name} 编译失败:`, error.message);
      this.isCompiled = false;
      return false;
    }
  }

  /**
   * 创建着色器程序
   * @param {WebGLRenderingContext} gl - WebGL上下文
   * @returns {WebGLProgram} 着色器程序
   */
  createShaderProgram(gl) {
    // 根据质量选择着色器
    const vertexShaderSource = this.getVertexShaderSource();
    const fragmentShaderSource = this.getFragmentShaderSource();
    
    // 编译顶点着色器
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('顶点着色器编译错误:', gl.getShaderInfoLog(vertexShader));
      return null;
    }
    
    // 编译片段着色器
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('片段着色器编译错误:', gl.getShaderInfoLog(fragmentShader));
      return null;
    }
    
    // 创建程序
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('程序链接错误:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }

  /**
   * 获取顶点着色器源码
   * @returns {string} 顶点着色器源码
   */
  getVertexShaderSource() {
    // 简化版顶点着色器，适合微信小游戏
    return `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      attribute vec2 aTexCoord;
      
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform mat3 uNormalMatrix;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vTexCoord;
      
      void main() {
        vPosition = vec3(uModelViewMatrix * vec4(aPosition, 1.0));
        vNormal = normalize(uNormalMatrix * aNormal);
        vTexCoord = aTexCoord;
        
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
      }
    `;
  }

  /**
   * 获取片段着色器源码
   * @returns {string} 片段着色器源码
   */
  getFragmentShaderSource() {
    // 根据质量选择不同的着色器
    if (this.pbrQuality === 'low') {
      return this.getLowQualityFragmentShader();
    } else if (this.pbrQuality === 'medium') {
      return this.getMediumQualityFragmentShader();
    } else {
      return this.getHighQualityFragmentShader();
    }
  }

  /**
   * 低质量片段着色器（微信小游戏优化）
   * @returns {string} 片段着色器源码
   */
  getLowQualityFragmentShader() {
    return `
      precision mediump float;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vTexCoord;
      
      uniform vec4 uBaseColor;
      uniform float uMetallic;
      uniform float uRoughness;
      uniform vec3 uEmissive;
      uniform float uEmissiveIntensity;
      
      // 简化版PBR光照（仅漫反射）
      void main() {
        // 基础颜色
        vec4 baseColor = uBaseColor;
        
        // 简化版光照计算
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float diff = max(dot(vNormal, lightDir), 0.0);
        
        // 环境光
        float ambient = 0.3;
        
        // 最终颜色
        vec3 color = baseColor.rgb * (ambient + diff * 0.7);
        
        // 金属度影响
        color = mix(color, baseColor.rgb * 0.5, uMetallic * 0.3);
        
        // 粗糙度影响（简化）
        color *= (1.0 - uRoughness * 0.2);
        
        // 自发光
        color += uEmissive * uEmissiveIntensity;
        
        gl_FragColor = vec4(color, baseColor.a);
      }
    `;
  }

  /**
   * 中等质量片段着色器（平衡性能和质量）
   * @returns {string} 片段着色器源码
   */
  getMediumQualityFragmentShader() {
    return `
      precision mediump float;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vTexCoord;
      
      uniform vec4 uBaseColor;
      uniform float uMetallic;
      uniform float uRoughness;
      uniform vec3 uEmissive;
      uniform float uEmissiveIntensity;
      
      // 简化版Cook-Torrance BRDF
      float DistributionGGX(vec3 N, vec3 H, float roughness) {
        float a = roughness * roughness;
        float a2 = a * a;
        float NdotH = max(dot(N, H), 0.0);
        float NdotH2 = NdotH * NdotH;
        
        float denom = (NdotH2 * (a2 - 1.0) + 1.0);
        denom = 3.14159265359 * denom * denom;
        
        return a2 / max(denom, 0.0000001);
      }
      
      // 几何函数
      float GeometrySchlickGGX(float NdotV, float roughness) {
        float r = roughness + 1.0;
        float k = (r * r) / 8.0;
        
        return NdotV / (NdotV * (1.0 - k) + k);
      }
      
      float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        
        return GeometrySchlickGGX(NdotV, roughness) * GeometrySchlickGGX(NdotL, roughness);
      }
      
      // Fresnel方程
      vec3 fresnelSchlick(float cosTheta, vec3 F0) {
        return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
      }
      
      void main() {
        // 材质属性
        vec3 albedo = uBaseColor.rgb;
        float metallic = uMetallic;
        float roughness = uRoughness;
        
        // 输入数据
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);
        
        // 计算反射率
        vec3 F0 = vec3(0.04);
        F0 = mix(F0, albedo, metallic);
        
        // 光照计算（简化：单个主光源）
        vec3 L = normalize(vec3(1.0, 1.0, 1.0));
        vec3 H = normalize(V + L);
        
        float NdotL = max(dot(N, L), 0.0);
        float NdotV = max(dot(N, V), 0.0);
        
        // BRDF计算
        float NDF = DistributionGGX(N, H, roughness);
        float G = GeometrySmith(N, V, L, roughness);
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
        
        // 镜面反射
        vec3 numerator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular = numerator / denominator;
        
        // 漫反射
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;
        
        vec3 diffuse = kD * albedo / 3.14159265359;
        
        // 最终光照
        vec3 Lo = (diffuse + specular) * NdotL;
        
        // 环境光
        vec3 ambient = vec3(0.03) * albedo;
        
        // 自发光
        vec3 emissive = uEmissive * uEmissiveIntensity;
        
        // 最终颜色
        vec3 color = ambient + Lo + emissive;
        
        // 色调映射
        color = color / (color + vec3(1.0));
        
        gl_FragColor = vec4(color, uBaseColor.a);
      }
    `;
  }

  /**
   * 高质量片段着色器（完整PBR）
   * @returns {string} 片段着色器源码
   */
  getHighQualityFragmentShader() {
    // 注：微信小游戏可能性能不足，这里使用中等质量
    console.warn('⚠️ 微信小游戏不建议使用高质量PBR，已降级为中等质量');
    return this.getMediumQualityFragmentShader();
  }

  /**
   * 设置统一变量位置
   * @param {WebGLRenderingContext} gl - WebGL上下文
   */
  setupUniformLocations(gl) {
    if (!this.shaderProgram) return;
    
    gl.useProgram(this.shaderProgram);
    
    // 获取统一变量位置
    this.uniformLocations = {
      // 变换矩阵
      uModelViewMatrix: gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
      uProjectionMatrix: gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
      uNormalMatrix: gl.getUniformLocation(this.shaderProgram, 'uNormalMatrix'),
      
      // 材质属性
      uBaseColor: gl.getUniformLocation(this.shaderProgram, 'uBaseColor'),
      uMetallic: gl.getUniformLocation(this.shaderProgram, 'uMetallic'),
      uRoughness: gl.getUniformLocation(this.shaderProgram, 'uRoughness'),
      uEmissive: gl.getUniformLocation(this.shaderProgram, 'uEmissive'),
      uEmissiveIntensity: gl.getUniformLocation(this.shaderProgram, 'uEmissiveIntensity'),
      
      // 纹理采样器
      uBaseColorMap: gl.getUniformLocation(this.shaderProgram, 'uBaseColorMap'),
      uNormalMap: gl.getUniformLocation(this.shaderProgram, 'uNormalMap'),
      uMetallicRoughnessMap: gl.getUniformLocation(this.shaderProgram, 'uMetallicRoughnessMap'),
      uOcclusionMap: gl.getUniformLocation(this.shaderProgram, 'uOcclusionMap'),
      uEmissiveMap: gl.getUniformLocation(this.shaderProgram, 'uEmissiveMap')
    };
    
    console.log(`📍 ${this.name} 统一变量位置设置完成`);
  }

  /**
   * 创建纹理
   * @param {WebGLRenderingContext} gl - WebGL上下文
   */
  createTextures(gl) {
    if (!this.shaderProgram) return;
    
    gl.useProgram(this.shaderProgram);
    
    // 纹理单元计数器
    let textureUnit = 0;
    
    // 创建基础颜色纹理
    if (this.baseColorMap) {
      this.baseColorTexture = this.createTexture(gl, this.baseColorMap, textureUnit);
      gl.uniform1i(this.uniformLocations.uBaseColorMap, textureUnit);
      textureUnit++;
    }
    
    // 创建法线纹理
    if (this.normalMap) {
      this.normalTexture = this.createTexture(gl, this.normalMap, textureUnit);
      gl.uniform1i(this.uniformLocations.uNormalMap, textureUnit);
      textureUnit++;
    }
    
    // 创建金属度/粗糙度纹理
    if (this.metallicRoughnessMap) {
      this.metallicRoughnessTexture = this.createTexture(gl, this.metallicRoughnessMap, textureUnit);
      gl.uniform1i(this.uniformLocations.uMetallicRoughnessMap, textureUnit);
      textureUnit++;
    }
    
    // 创建环境光遮蔽纹理
    if (this.occlusionMap) {
      this.occlusionTexture = this.createTexture(gl, this.occlusionMap, textureUnit);
      gl.uniform1i(this.uniformLocations.uOcclusionMap, textureUnit);
      textureUnit++;
    }
    
    // 创建自发光纹理
    if (this.emissiveMap) {
      this.emissiveTexture = this.createTexture(gl, this.emissiveMap, textureUnit);
      gl.uniform1i(this.uniformLocations.uEmissiveMap, textureUnit);
      textureUnit++;
    }
    
    console.log(`🖼️ ${this.name} 创建了 ${textureUnit} 个纹理`);
  }

  /**
   * 创建WebGL纹理
   * @param {WebGLRenderingContext} gl - WebGL上下文
   * @param {ImageData|string} source - 纹理数据
   * @param {number} unit - 纹理单元
   * @returns {WebGLTexture} WebGL纹理
   */
  createTexture(gl, source, unit) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // 设置纹理参数（微信小游戏优化）
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    
    // 如果是ImageData，直接上传
    if (source instanceof ImageData) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } 
    // 如果是DataURL，需要先加载
    else if (typeof source === 'string' && source.startsWith('data:')) {
      // 这里应该异步加载，简化处理
      console.warn('⚠️ DataURL纹理加载需要异步处理，这里简化处理');
      // 实际项目中应该异步加载
    }
    
    return texture;
  }

  /**
   * 更新材质统一变量
   * @param {WebGLRenderingContext} gl - WebGL上下文
   * @param {Object} uniforms - 统一变量值
   */
  updateUniforms(gl, uniforms = {}) {
    if (!this.shaderProgram || !this.isCompiled) {
      console.warn(`⚠️ ${this.name} 未编译，无法更新统一变量`);
      return;
    }
    
    gl.useProgram(this.shaderProgram);
    
    // 更新变换矩阵
    if (uniforms.modelViewMatrix && this.uniformLocations.uModelViewMatrix) {
      gl.uniformMatrix4fv(this.uniformLocations.uModelViewMatrix, false, uniforms.modelViewMatrix);
    }
    
    if (uniforms.projectionMatrix && this.uniformLocations.uProjectionMatrix) {
      gl.uniformMatrix4fv(this.uniformLocations.uProjectionMatrix, false, uniforms.projectionMatrix);
    }
    
    if (uniforms.normalMatrix && this.uniformLocations.uNormalMatrix) {
      gl.uniformMatrix3fv(this.uniformLocations.uNormalMatrix, false, uniforms.normalMatrix);
    }
    
    // 更新材质属性
    if (this.uniformLocations.uBaseColor) {
      gl.uniform4fv(this.uniformLocations.uBaseColor, this.baseColor);
    }
    
    if (this.uniformLocations.uMetallic) {
      gl.uniform1f(this.uniformLocations.uMetallic, this.metallic);
    }
    
    if (this.uniformLocations.uRoughness) {
      gl.uniform1f(this.uniformLocations.uRoughness, this.roughness);
    }
    
    if (this.uniformLocations.uEmissive) {
      gl.uniform3fv(this.uniformLocations.uEmissive, this.emissive);
    }
    
    if (this.uniformLocations.uEmissiveIntensity) {
      gl.uniform1f(this.uniformLocations.uEmissiveIntensity, this.emissiveIntensity);
    }
    
    this.needsUpdate = false;
  }

  /**
   * 绑定纹理
   * @param {WebGLRenderingContext} gl - WebGL上下文
   */
  bindTextures(gl) {
    if (!this.isCompiled) return;
    
    // 绑定基础颜色纹理
    if (this.baseColorTexture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.baseColorTexture);
    }
    
    // 绑定法线纹理
    if (this.normalTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
    }
    
    // 绑定金属度/粗糙度纹理
    if (this.metallicRoughnessTexture) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.metallicRoughnessTexture);
    }
    
    // 绑定环境光遮蔽纹理
    if (this.occlusionTexture) {
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.occlusionTexture);
    }
    
    // 绑定自发光纹理
    if (this.emissiveTexture) {
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, this.emissiveTexture);
    }
  }

  /**
   * 使用材质（在渲染前调用）
   * @param {WebGLRenderingContext} gl - WebGL上下文
   */
  use(gl) {
    if (!this.isCompiled) {
      console.warn(`⚠️ ${this.name} 未编译，尝试编译...`);
      if (!this.compile(gl)) {
        return;
      }
    }
    
    gl.useProgram(this.shaderProgram);
    this.bindTextures(gl);
    
    // 更新性能统计
    this.performance.drawCalls++;
    this.performance.lastFrameTime = performance.now();
  }

  /**
   * 根据性能动态调整质量
   * @param {number} frameTime - 帧时间 (ms)
   */
  adjustQuality(frameTime) {
    if (!this.dynamicQuality) return;
    
    // 如果帧时间过长，降低质量
    if (frameTime > 33) { // 低于30fps
      if (this.pbrQuality !== 'low') {
        console.log(`🔄 ${this.name} 帧时间 ${frameTime.toFixed(1)}ms，降低质量为low`);
        this.pbrQuality = 'low';
        this.needsUpdate = true;
        this.isCompiled = false;
      }
    } 
    // 如果帧时间良好，尝试提高质量
    else if (frameTime < 16) { // 高于60fps
      if (this.pbrQuality === 'low') {
        console.log(`🔄 ${this.name} 帧时间 ${frameTime.toFixed(1)}ms，提高质量为medium`);
        this.pbrQuality = 'medium';
        this.needsUpdate = true;
        this.isCompiled = false;
      }
    }
  }

  /**
   * 复制材质
   * @returns {PBRMaterial} 复制的新材质
   */
  clone() {
    const clone = new PBRMaterial({
      name: `${this.name}_clone`,
      baseColor: [...this.baseColor],
      metallic: this.metallic,
      roughness: this.roughness,
      emissive: [...this.emissive],
      emissiveIntensity: this.emissiveIntensity,
      pbrQuality: this.pbrQuality,
      category: this.category
    });
    
    // 复制纹理引用（注意：不是深拷贝纹理数据）
    clone.baseColorMap = this.baseColorMap;
    clone.normalMap = this.normalMap;
    clone.metallicRoughnessMap = this.metallicRoughnessMap;
    clone.occlusionMap = this.occlusionMap;
    clone.emissiveMap = this.emissiveMap;
    
    return clone;
  }

  /**
   * 序列化材质
   * @returns {Object} 可序列化的材质数据
   */
  serialize() {
    return {
      name: this.name,
      type: this.type,
      baseColor: this.baseColor,
      metallic: this.metallic,
      roughness: this.roughness,
      emissive: this.emissive,
      emissiveIntensity: this.emissiveIntensity,
      pbrQuality: this.pbrQuality,
      category: this.category,
      // 注意：纹理数据需要单独处理
      hasBaseColorMap: !!this.baseColorMap,
      hasNormalMap: !!this.normalMap,
      hasMetallicRoughnessMap: !!this.metallicRoughnessMap,
      hasOcclusionMap: !!this.occlusionMap,
      hasEmissiveMap: !!this.emissiveMap
    };
  }

  /**
   * 从序列化数据恢复材质
   * @param {Object} data - 序列化的材质数据
   * @returns {PBRMaterial} 恢复的材质
   */
  static deserialize(data) {
    const material = new PBRMaterial({
      name: data.name,
      baseColor: data.baseColor,
      metallic: data.metallic,
      roughness: data.roughness,
      emissive: data.emissive,
      emissiveIntensity: data.emissiveIntensity,
      pbrQuality: data.pbrQuality,
      category: data.category
    });
    
    // 注意：纹理数据需要单独加载
    return material;
  }

  /**
   * 创建预设材质
   * @param {string} preset - 预设名称
   * @returns {PBRMaterial} 预设材质
   */
  static createPreset(preset) {
    switch (preset) {
      case 'wood_dark':
        return new PBRMaterial({
          name: 'wood_dark',
          baseColor: [0.36, 0.25, 0.22, 1.0],
          metallic: 0.0,
          roughness: 0.7,
          category: 'wood'
        });
        
      case 'wood_light':
        return new PBRMaterial({
          name: 'wood_light',
          baseColor: [0.85, 0.80, 0.75, 1.0],
          metallic: 0.0,
          roughness: 0.6,
          category: 'wood'
        });
        
      case 'metal_brushed':
        return new PBRMaterial({
          name: 'metal_brushed',
          baseColor: [0.69, 0.74, 0.77, 1.0],
          metallic: 0.8,
          roughness: 0.3,
          category: 'metal'
        });
        
      case 'ceramic_porcelain':
        return new PBRMaterial({
          name: 'ceramic_porcelain',
          baseColor: [0.98, 0.98, 0.98, 1.0],
          metallic: 0.0,
          roughness: 0.1,
          category: 'ceramic'
        });
        
      case 'fabric_linen':
        return new PBRMaterial({
          name: 'fabric_linen',
          baseColor: [0.94, 0.92, 0.91, 1.0],
          metallic: 0.0,
          roughness: 0.8,
          category: 'fabric'
        });
        
      case 'ghost_ethereal':
        return new PBRMaterial({
          name: 'ghost_ethereal',
          baseColor: [0.88, 0.96, 0.99, 0.7],
          metallic: 0.0,
          roughness: 0.2,
          emissive: [0.5, 0.7, 0.9],
          emissiveIntensity: 0.5,
          category: 'ghost'
        });
        
      case 'horror_blood':
        return new PBRMaterial({
          name: 'horror_blood',
          baseColor: [0.55, 0.0, 0.0, 1.0],
          metallic: 0.1,
          roughness: 0.9,
          category: 'horror'
        });
        
      default:
        console.warn(`未知的预设材质: ${preset}，返回默认材质`);
        return new PBRMaterial({ name: preset });
    }
  }

  /**
   * 获取性能统计
   * @returns {Object} 性能数据
   */
  getPerformanceStats() {
    return {
      name: this.name,
      compiled: this.isCompiled,
      compileTime: this.performance.compileTime,
      drawCalls: this.performance.drawCalls,
      quality: this.pbrQuality,
      textures: {
        baseColor: !!this.baseColorMap,
        normal: !!this.normalMap,
        metallicRoughness: !!this.metallicRoughnessMap,
        occlusion: !!this.occlusionMap,
        emissive: !!this.emissiveMap
      }
    };
  }

  /**
   * 清理资源
   * @param {WebGLRenderingContext} gl - WebGL上下文
   */
  dispose(gl) {
    if (this.shaderProgram && gl) {
      gl.deleteProgram(this.shaderProgram);
      this.shaderProgram = null;
    }
    
    // 删除纹理
    const textures = [
      this.baseColorTexture,
      this.normalTexture,
      this.metallicRoughnessTexture,
      this.occlusionTexture,
      this.emissiveTexture
    ];
    
    textures.forEach(texture => {
      if (texture && gl) {
        gl.deleteTexture(texture);
      }
    });
    
    console.log(`🗑️ ${this.name} 资源已清理`);
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PBRMaterial;
}

console.log('🎨 PBRMaterial 模块加载完成！');