// 微恐咖啡厅 - 资源管理器
// 负责加载和管理3D资源
// 创建时间: 2026年3月4日

import { _decorator, Component, Node, resources, Prefab, Material, Texture2D, SpriteFrame, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

// 资源类型枚举
enum ResourceType {
    PREFAB = 'prefab',
    MATERIAL = 'material',
    TEXTURE = 'texture',
    AUDIO = 'audio',
    SPRITE = 'sprite'
}

// 资源加载配置
interface ResourceConfig {
    key: string;
    type: ResourceType;
    path: string;
    priority: number; // 1-10，越高越先加载
    required: boolean; // 是否必须加载
}

@ccclass('ResourceManager')
export class ResourceManager extends Component {
    
    // 单例实例
    private static _instance: ResourceManager = null;
    public static get instance(): ResourceManager {
        return ResourceManager._instance;
    }
    
    // 资源缓存
    private _resourceCache: Map<string, any> = new Map();
    
    // 加载进度
    private _loadingProgress: number = 0;
    private _totalResources: number = 0;
    private _loadedResources: number = 0;
    
    // 资源加载配置
    private _resourceConfigs: ResourceConfig[] = [
        // 3D模型预置
        {
            key: 'counter_prefab',
            type: ResourceType.PREFAB,
            path: 'prefabs/counter',
            priority: 10,
            required: true
        },
        {
            key: 'coffee_machine_prefab',
            type: ResourceType.PREFAB,
            path: 'prefabs/coffee_machine',
            priority: 10,
            required: true
        },
        {
            key: 'table_prefab',
            type: ResourceType.PREFAB,
            path: 'prefabs/table',
            priority: 9,
            required: true
        },
        {
            key: 'chair_prefab',
            type: ResourceType.PREFAB,
            path: 'prefabs/chair',
            priority: 9,
            required: true
        },
        {
            key: 'ghost_prefab',
            type: ResourceType.PREFAB,
            path: 'prefabs/ghost',
            priority: 8,
            required: true
        },
        
        // 材质资源
        {
            key: 'material_wood_dark',
            type: ResourceType.MATERIAL,
            path: 'materials/wood_dark',
            priority: 7,
            required: true
        },
        {
            key: 'material_wood_light',
            type: ResourceType.MATERIAL,
            path: 'materials/wood_light',
            priority: 7,
            required: true
        },
        {
            key: 'material_metal',
            type: ResourceType.MATERIAL,
            path: 'materials/metal',
            priority: 7,
            required: true
        },
        {
            key: 'material_porcelain',
            type: ResourceType.MATERIAL,
            path: 'materials/porcelain',
            priority: 6,
            required: true
        },
        {
            key: 'material_ghost',
            type: ResourceType.MATERIAL,
            path: 'materials/ghost',
            priority: 6,
            required: true
        },
        {
            key: 'material_horror',
            type: ResourceType.MATERIAL,
            path: 'materials/horror',
            priority: 5,
            required: false
        },
        
        // 纹理贴图
        {
            key: 'texture_wood_grain',
            type: ResourceType.TEXTURE,
            path: 'textures/wood_grain',
            priority: 6,
            required: true
        },
        {
            key: 'texture_metal_brushed',
            type: ResourceType.TEXTURE,
            path: 'textures/metal_brushed',
            priority: 6,
            required: true
        },
        {
            key: 'texture_ghost_noise',
            type: ResourceType.TEXTURE,
            path: 'textures/ghost_noise',
            priority: 5,
            required: true
        },
        {
            key: 'texture_blood_splatter',
            type: ResourceType.TEXTURE,
            path: 'textures/blood_splatter',
            priority: 4,
            required: false
        },
        
        // 音效资源
        {
            key: 'audio_background',
            type: ResourceType.AUDIO,
            path: 'audio/background',
            priority: 8,
            required: true
        },
        {
            key: 'audio_coffee_brew',
            type: ResourceType.AUDIO,
            path: 'audio/coffee_brew',
            priority: 7,
            required: true
        },
        {
            key: 'audio_ghost_appear',
            type: ResourceType.AUDIO,
            path: 'audio/ghost_appear',
            priority: 6,
            required: true
        },
        {
            key: 'audio_light_flicker',
            type: ResourceType.AUDIO,
            path: 'audio/light_flicker',
            priority: 6,
            required: true
        },
        {
            key: 'audio_whisper',
            type: ResourceType.AUDIO,
            path: 'audio/whisper',
            priority: 5,
            required: false
        },
        
        // UI精灵
        {
            key: 'sprite_button_normal',
            type: ResourceType.SPRITE,
            path: 'sprites/button_normal',
            priority: 5,
            required: true
        },
        {
            key: 'sprite_button_pressed',
            type: ResourceType.SPRITE,
            path: 'sprites/button_pressed',
            priority: 5,
            required: true
        },
        {
            key: 'sprite_icon_coffee',
            type: ResourceType.SPRITE,
            path: 'sprites/icon_coffee',
            priority: 4,
            required: true
        },
        {
            key: 'sprite_icon_ghost',
            type: ResourceType.SPRITE,
            path: 'sprites/icon_ghost',
            priority: 4,
            required: true
        }
    ];
    
    // 加载事件回调
    private _onProgressCallback: (progress: number) => void = null;
    private _onCompleteCallback: () => void = null;
    private _onErrorCallback: (error: Error) => void = null;
    
    onLoad() {
        // 设置单例
        if (ResourceManager._instance === null) {
            ResourceManager._instance = this;
        } else {
            this.node.destroy();
            return;
        }
        
        console.log('ResourceManager初始化');
    }
    
    // ==================== 资源加载接口 ====================
    
    // 预加载所有资源
    public preloadAllResources(
        onProgress?: (progress: number) => void,
        onComplete?: () => void,
        onError?: (error: Error) => void
    ) {
        console.log('开始预加载所有资源');
        
        this._onProgressCallback = onProgress || null;
        this._onCompleteCallback = onComplete || null;
        this._onErrorCallback = onError || null;
        
        // 计算必须加载的资源数量
        this._totalResources = this._resourceConfigs.filter(config => config.required).length;
        this._loadedResources = 0;
        this._loadingProgress = 0;
        
        // 按优先级排序
        const sortedConfigs = [...this._resourceConfigs]
            .filter(config => config.required)
            .sort((a, b) => b.priority - a.priority);
        
        // 开始加载
        this.loadResourcesSequentially(sortedConfigs);
    }
    
    // 顺序加载资源
    private loadResourcesSequentially(configs: ResourceConfig[]) {
        if (configs.length === 0) {
            this.onAllResourcesLoaded();
            return;
        }
        
        const config = configs[0];
        const remainingConfigs = configs.slice(1);
        
        this.loadResource(config).then(() => {
            // 资源加载成功
            this._loadedResources++;
            this._loadingProgress = this._loadedResources / this._totalResources;
            
            // 更新进度
            if (this._onProgressCallback) {
                this._onProgressCallback(this._loadingProgress);
            }
            
            console.log(`资源加载进度: ${Math.round(this._loadingProgress * 100)}%`);
            
            // 加载下一个资源
            this.loadResourcesSequentially(remainingConfigs);
        }).catch((error) => {
            console.error(`资源加载失败: ${config.key}`, error);
            
            if (this._onErrorCallback) {
                this._onErrorCallback(error);
            }
            
            // 如果资源是必须的，停止加载
            if (config.required) {
                console.error(`必须资源加载失败: ${config.key}，停止加载`);
                return;
            }
            
            // 如果资源不是必须的，继续加载下一个
            this.loadResourcesSequentially(remainingConfigs);
        });
    }
    
    // 加载单个资源
    private loadResource(config: ResourceConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`加载资源: ${config.key} (${config.path})`);
            
            switch (config.type) {
                case ResourceType.PREFAB:
                    this.loadPrefab(config.path, config.key, resolve, reject);
                    break;
                case ResourceType.MATERIAL:
                    this.loadMaterial(config.path, config.key, resolve, reject);
                    break;
                case ResourceType.TEXTURE:
                    this.loadTexture(config.path, config.key, resolve, reject);
                    break;
                case ResourceType.AUDIO:
                    this.loadAudio(config.path, config.key, resolve, reject);
                    break;
                case ResourceType.SPRITE:
                    this.loadSprite(config.path, config.key, resolve, reject);
                    break;
                default:
                    reject(new Error(`未知的资源类型: ${config.type}`));
            }
        });
    }
    
    // 加载预置体
    private loadPrefab(path: string, key: string, resolve: () => void, reject: (error: Error) => void) {
        resources.load(path, Prefab, (err, prefab) => {
            if (err) {
                reject(new Error(`加载预置体失败: ${path}, ${err.message}`));
                return;
            }
            
            this._resourceCache.set(key, prefab);
            console.log(`预置体加载成功: ${key}`);
            resolve();
        });
    }
    
    // 加载材质
    private loadMaterial(path: string, key: string, resolve: () => void, reject: (error: Error) => void) {
        resources.load(path, Material, (err, material) => {
            if (err) {
                reject(new Error(`加载材质失败: ${path}, ${err.message}`));
                return;
            }
            
            this._resourceCache.set(key, material);
            console.log(`材质加载成功: ${key}`);
            resolve();
        });
    }
    
    // 加载纹理
    private loadTexture(path: string, key: string, resolve: () => void, reject: (error: Error) => void) {
        resources.load(path, Texture2D, (err, texture) => {
            if (err) {
                reject(new Error(`加载纹理失败: ${path}, ${err.message}`));
                return;
            }
            
            this._resourceCache.set(key, texture);
            console.log(`纹理加载成功: ${key}`);
            resolve();
        });
    }
    
    // 加载音效
    private loadAudio(path: string, key: string, resolve: () => void, reject: (error: Error) => void) {
        resources.load(path, AudioClip, (err, audio) => {
            if (err) {
                reject(new Error(`加载音效失败: ${path}, ${err.message}`));
                return;
            }
            
            this._resourceCache.set(key, audio);
            console.log(`音效加载成功: ${key}`);
            resolve();
        });
    }
    
    // 加载精灵
    private loadSprite(path: string, key: string, resolve: () => void, reject: (error: Error) => void) {
        resources.load(path, SpriteFrame, (err, sprite) => {
            if (err) {
                reject(new Error(`加载精灵失败: ${path}, ${err.message}`));
                return;
            }
            
            this._resourceCache.set(key, sprite);
            console.log(`精灵加载成功: ${key}`);
            resolve();
        });
    }
    
    // 所有资源加载完成
    private onAllResourcesLoaded() {
        console.log('所有资源加载完成');
        
        this._loadingProgress = 1;
        
        if (this._onCompleteCallback) {
            this._onCompleteCallback();
        }
    }
    
    // ==================== 资源获取接口 ====================
    
    // 获取预置体
    public getPrefab(key: string): Prefab | null {
        const prefab = this._resourceCache.get(key);
        return prefab instanceof Prefab ? prefab : null;
    }
    
    // 获取材质
    public getMaterial(key: string): Material | null {
        const material = this._resourceCache.get(key);
        return material instanceof Material ? material : null;
    }
    
    // 获取纹理
    public getTexture(key: string): Texture2D | null {
        const texture = this._resourceCache.get(key);
        return texture instanceof Texture2D ? texture : null;
    }
    
    // 获取音效
    public getAudio(key: string): AudioClip | null {
        const audio = this._resourceCache.get(key);
        return audio instanceof AudioClip ? audio : null;
    }
    
    // 获取精灵
    public getSprite(key: string): SpriteFrame | null {
        const sprite = this._resourceCache.get(key);
        return sprite instanceof SpriteFrame ? sprite : null;
    }
    
    // 获取资源（通用）
    public getResource<T>(key: string): T | null {
        return this._resourceCache.get(key) as T || null;
    }
    
    // 检查资源是否存在
    public hasResource(key: string): boolean {
        return this._resourceCache.has(key);
    }
    
    // ==================== 动态加载接口 ====================
    
    // 动态加载资源
    public loadResourceAsync<T>(path: string, type: new () => T, key?: string): Promise<T> {
        return new Promise((resolve, reject) => {
            resources.load(path, type as any, (err, resource) => {
                if (err) {
                    reject(new Error(`动态加载资源失败: ${path}, ${err.message}`));
                    return;
                }
                
                if (key) {
                    this._resourceCache.set(key, resource);
                }
                
                resolve(resource as T);
            });
        });
    }
    
    // 批量动态加载
    public loadResourcesAsync<T>(paths: string[], type: new () => T): Promise<T[]> {
        const promises = paths.map(path => this.loadResourceAsync<T>(path, type));
        return Promise.all(promises);
    }
    
    // ==================== 资源管理 ====================
    
    // 释放资源
    public releaseResource(key: string): boolean {
        if (!this._resourceCache.has(key)) {
            return false;
        }
        
        const resource = this._resourceCache.get(key);
        
        // 根据资源类型调用相应的释放方法
        // Cocos Creator会自动管理资源释放
        
        this._resourceCache.delete(key);
        console.log(`资源已释放: ${key}`);
        
        return true;
    }
    
    // 释放多个资源
    public releaseResources(keys: string[]): number {
        let releasedCount = 0;
        
        keys.forEach(key => {
            if (this.releaseResource(key)) {
                releasedCount++;
            }
        });
        
        return releasedCount;
    }
    
    // 释放所有资源
    public releaseAllResources(): number {
        const keys = Array.from(this._resourceCache.keys());
        const releasedCount = this.releaseResources(keys);
        
        console.log(`释放了 ${releasedCount} 个资源`);
        return releasedCount;
    }
    
    // 清理缓存（强制释放）
    public clearCache(): void {
        this._resourceCache.clear();
        console.log('资源缓存已清理');
        
        // 触发垃圾回收建议
        this.suggestGarbageCollection();
    }
    
    // 建议垃圾回收
    private suggestGarbageCollection() {
        // 在微信小游戏环境中可以调用GC
        if (typeof wx !== 'undefined' && wx.triggerGC) {
            wx.triggerGC();
            console.log('触发垃圾回收');
        }
    }
    
    // ==================== 内存监控 ====================
    
    // 获取内存使用情况
    public getMemoryUsage(): {
        cacheSize: number;
        estimatedMemory: number;
    } {
        const cacheSize = this._resourceCache.size;
        
        // 估算内存使用（简化版本）
        let estimatedMemory = 0;
        
        for (const [key, resource] of this._resourceCache) {
            // 根据资源类型估算内存
            if (resource instanceof Prefab) {
                estimatedMemory += 100 * 1024; // 估算100KB
            } else if (resource instanceof Texture2D) {
                const texture = resource as Texture2D;
                estimatedMemory += texture.width * texture.height * 4; // RGBA 4字节
            } else if (resource instanceof AudioClip) {
                estimatedMemory += 500 * 1024; // 估算500KB
            } else {
                estimatedMemory += 10 * 1024; // 其他资源估算10KB
            }
        }
        
        return {
            cacheSize,
            estimatedMemory: Math.round(estimatedMemory / 1024) // 转换为KB
        };
    }
    
    // 检查内存警告
    public checkMemoryWarning(): boolean {
        const usage = this.getMemoryUsage();
        const memoryKB = usage.estimatedMemory;
        
        // 微信小游戏内存限制警告（假设限制为512MB）
        const warningThreshold = 400 * 1024; // 400MB警告
        
        if (memoryKB > warningThreshold) {
            console.warn(`内存使用过高: ${Math.round(memoryKB / 1024)}MB`);
            return true;
        }
        
        return false;
    }
    
    // 内存优化建议
    public suggestMemoryOptimization(): string[] {
        const suggestions: string[] = [];
        const usage = this.getMemoryUsage();
        
        if (usage.cacheSize > 50) {
            suggestions.push('资源缓存数量过多，考虑释放不常用资源');
        }
        
        if (usage.estimatedMemory > 200 * 1024) { // 200MB
            suggestions.push('内存使用较高，建议压缩纹理和音频资源');
        }
        
        // 检查大纹理
        const largeTextures = this.findLargeTextures(1024); // 大于1MB的纹理
        if (largeTextures.length > 0) {
            suggestions.push(`发现${largeTextures.length}个大纹理，建议压缩`);
        }
        
        return suggestions;
    }
    
    // 查找大纹理
    private findLargeTextures(minSizeKB: number): string[] {
        const largeTextures: string[] = [];
        
        for (const [key, resource] of this._resourceCache) {
            if (resource instanceof Texture2D) {
                const texture = resource as Texture2D;
                const sizeKB = (texture.width * texture.height * 4) / 1024;
                
                if (sizeKB > minSizeKB) {
                    largeTextures.push(`${key}: ${texture.width}x${texture.height} (${Math.round(sizeKB)}KB)`);
                }
            }
        }
        
        return largeTextures;
    }
    
    // ==================== 调试工具 ====================
    
    // 列出所有资源
    public listAllResources(): { key: string; type: string }[] {
        const list: { key: string; type: string }[] = [];
        
        for (const [key, resource] of this._resourceCache) {
            let type = 'unknown';
            
            if (resource instanceof Prefab) type = 'Prefab';
            else if (resource instanceof Material) type = 'Material';
            else if (resource instanceof Texture2D) type = 'Texture2D';
            else if (resource instanceof AudioClip) type = 'AudioClip';
            else if (resource instanceof SpriteFrame) type = 'SpriteFrame';
            
            list.push({ key, type });
        }
        
        return list;
    }
    
    // 获取加载进度
    public getLoadingProgress(): number {
        return this._loadingProgress;
    }
    
    // 获取已加载资源数量
    public getLoadedResourceCount(): number {
        return this._loadedResources;
    }
    
    // 获取总资源数量
    public getTotalResourceCount(): number {
        return this._totalResources;
    }
    
    // ==================== 清理 ====================
    
    onDestroy() {
        // 释放所有资源
        this.releaseAllResources();
        
        console.log('ResourceManager销毁');
    }
}

console.log('ResourceManager类定义完成');