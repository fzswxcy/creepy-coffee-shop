// 微恐咖啡厅 - 材质配置
// 定义所有材质参数和效果
// 创建时间: 2026年3月4日

import { _decorator, Component, Material, Color, Vec3, Texture2D } from 'cc';
const { ccclass, property } = _decorator;

// 材质类型
enum MaterialType {
    WOOD_DARK = 'wood_dark',
    WOOD_LIGHT = 'wood_light',
    METAL = 'metal',
    PORCELAIN = 'porcelain',
    FABRIC = 'fabric',
    PAPER = 'paper',
    GHOST = 'ghost',
    HORROR = 'horror',
    GLOW = 'glow',
    BLOOD = 'blood'
}

// 材质配置接口
interface MaterialConfig {
    type: MaterialType;
    baseColor: Color;
    metallic: number;      // 0-1
    roughness: number;     // 0-1
    emissive?: Color;      // 自发光颜色
    emissiveIntensity?: number; // 自发光强度
    normalMap?: boolean;   // 是否需要法线贴图
    aoMap?: boolean;       // 是否需要AO贴图
    transparency?: number; // 透明度 0-1
    blendMode?: 'opaque' | 'transparent' | 'additive';
    shader?: string;       // 自定义shader
}

@ccclass('MaterialConfig')
export class MaterialConfigManager extends Component {
    
    // 单例实例
    private static _instance: MaterialConfigManager = null;
    public static get instance(): MaterialConfigManager {
        return MaterialConfigManager._instance;
    }
    
    // 材质配置映射
    private _materialConfigs: Map<MaterialType, MaterialConfig> = new Map();
    
    // 材质实例缓存
    private _materialInstances: Map<MaterialType, Material[]> = new Map();
    
    onLoad() {
        // 设置单例
        if (MaterialConfigManager._instance === null) {
            MaterialConfigManager._instance = this;
        } else {
            this.node.destroy();
            return;
        }
        
        // 初始化材质配置
        this.initializeMaterialConfigs();
        
        console.log('MaterialConfigManager初始化完成');
    }
    
    // 初始化材质配置
    private initializeMaterialConfigs() {
        console.log('初始化材质配置');
        
        // 深色木质（吧台、椅子）
        this._materialConfigs.set(MaterialType.WOOD_DARK, {
            type: MaterialType.WOOD_DARK,
            baseColor: new Color(74, 44, 42),     // #4a2c2a
            metallic: 0.1,
            roughness: 0.8,
            normalMap: true,
            aoMap: true
        });
        
        // 浅色木质（桌子）
        this._materialConfigs.set(MaterialType.WOOD_LIGHT, {
            type: MaterialType.WOOD_LIGHT,
            baseColor: new Color(139, 90, 43),    // #8b5a2b
            metallic: 0.05,
            roughness: 0.7,
            normalMap: true,
            aoMap: true
        });
        
        // 金属（咖啡机、时钟）
        this._materialConfigs.set(MaterialType.METAL, {
            type: MaterialType.METAL,
            baseColor: new Color(150, 150, 150),  // #969696
            metallic: 0.8,
            roughness: 0.3,
            normalMap: true,
            aoMap: true
        });
        
        // 陶瓷（咖啡杯）
        this._materialConfigs.set(MaterialType.PORCELAIN, {
            type: MaterialType.PORCELAIN,
            baseColor: new Color(255, 255, 255),  // #ffffff
            metallic: 0.1,
            roughness: 0.2,
            normalMap: false,
            aoMap: false
        });
        
        // 布料（咖啡豆袋）
        this._materialConfigs.set(MaterialType.FABRIC, {
            type: MaterialType.FABRIC,
            baseColor: new Color(160, 120, 80),   // #a07850
            metallic: 0.0,
            roughness: 0.9,
            normalMap: true,
            aoMap: true
        });
        
        // 纸张（海报）
        this._materialConfigs.set(MaterialType.PAPER, {
            type: MaterialType.PAPER,
            baseColor: new Color(240, 230, 210),  // #f0e6d2
            metallic: 0.0,
            roughness: 0.6,
            normalMap: false,
            aoMap: false
        });
        
        // 幽灵材质（半透明、发光）
        this._materialConfigs.set(MaterialType.GHOST, {
            type: MaterialType.GHOST,
            baseColor: new Color(200, 230, 255, 150), // 淡蓝色半透明
            metallic: 0.0,
            roughness: 0.3,
            emissive: new Color(100, 150, 255),    // 蓝色自发光
            emissiveIntensity: 0.5,
            transparency: 0.4,
            blendMode: 'transparent'
        });
        
        // 恐怖特效材质（血红色）
        this._materialConfigs.set(MaterialType.HORROR, {
            type: MaterialType.HORROR,
            baseColor: new Color(255, 50, 50),     // #ff3232
            metallic: 0.3,
            roughness: 0.5,
            emissive: new Color(255, 50, 50),      // 红色自发光
            emissiveIntensity: 0.8,
            transparency: 0.3,
            blendMode: 'additive'
        });
        
        // 发光材质（灯光效果）
        this._materialConfigs.set(MaterialType.GLOW, {
            type: MaterialType.GLOW,
            baseColor: new Color(255, 200, 100),   // #ffc864
            metallic: 0.0,
            roughness: 0.1,
            emissive: new Color(255, 200, 100),    // 暖黄色自发光
            emissiveIntensity: 1.0,
            transparency: 0.8,
            blendMode: 'additive'
        });
        
        // 血液材质
        this._materialConfigs.set(MaterialType.BLOOD, {
            type: MaterialType.BLOOD,
            baseColor: new Color(102, 0, 0, 200),  // #660000 半透明
            metallic: 0.4,
            roughness: 0.7,
            transparency: 0.8,
            blendMode: 'transparent'
        });
        
        console.log(`材质配置初始化完成，共 ${this._materialConfigs.size} 种材质`);
    }
    
    // ==================== 材质获取接口 ====================
    
    // 获取材质配置
    public getMaterialConfig(type: MaterialType): MaterialConfig | null {
        return this._materialConfigs.get(type) || null;
    }
    
    // 获取所有材质类型
    public getAllMaterialTypes(): MaterialType[] {
        return Array.from(this._materialConfigs.keys());
    }
    
    // 获取材质配置列表
    public getMaterialConfigList(): { type: MaterialType; config: MaterialConfig }[] {
        const list: { type: MaterialType; config: MaterialConfig }[] = [];
        
        this._materialConfigs.forEach((config, type) => {
            list.push({ type, config });
        });
        
        return list;
    }
    
    // ==================== 材质创建接口 ====================
    
    // 创建材质实例
    public createMaterialInstance(type: MaterialType): Material | null {
        const config = this.getMaterialConfig(type);
        if (!config) {
            console.error(`找不到材质配置: ${type}`);
            return null;
        }
        
        console.log(`创建材质实例: ${type}`);
        
        // 这里应该实际创建材质实例
        // 简化版本：返回一个占位材质
        
        const material = new Material();
        this.setMaterialProperties(material, config);
        
        // 缓存材质实例
        if (!this._materialInstances.has(type)) {
            this._materialInstances.set(type, []);
        }
        this._materialInstances.get(type)!.push(material);
        
        return material;
    }
    
    // 批量创建材质实例
    public createMaterialInstances(types: MaterialType[]): Material[] {
        const materials: Material[] = [];
        
        types.forEach(type => {
            const material = this.createMaterialInstance(type);
            if (material) {
                materials.push(material);
            }
        });
        
        return materials;
    }
    
    // 设置材质属性
    private setMaterialProperties(material: Material, config: MaterialConfig) {
        // 这里应该设置材质的实际属性
        // 包括颜色、金属度、粗糙度等
        
        console.log(`设置材质属性: ${config.type}`, {
            baseColor: config.baseColor.toHEX(),
            metallic: config.metallic,
            roughness: config.roughness,
            transparency: config.transparency || 1
        });
    }
    
    // ==================== 材质管理 ====================
    
    // 获取材质实例
    public getMaterialInstance(type: MaterialType, index: number = 0): Material | null {
        const instances = this._materialInstances.get(type);
        if (!instances || instances.length === 0) {
            return null;
        }
        
        if (index < 0 || index >= instances.length) {
            return instances[0];
        }
        
        return instances[index];
    }
    
    // 获取所有材质实例
    public getAllMaterialInstances(): { type: MaterialType; instances: Material[] }[] {
        const list: { type: MaterialType; instances: Material[] }[] = [];
        
        this._materialInstances.forEach((instances, type) => {
            list.push({ type, instances });
        });
        
        return list;
    }
    
    // 释放材质实例
    public releaseMaterialInstance(type: MaterialType, index: number = 0): boolean {
        const instances = this._materialInstances.get(type);
        if (!instances || instances.length === 0) {
            return false;
        }
        
        if (index < 0 || index >= instances.length) {
            return false;
        }
        
        // 这里应该实际释放材质资源
        instances.splice(index, 1);
        
        console.log(`释放材质实例: ${type}[${index}]`);
        
        return true;
    }
    
    // 释放所有材质实例
    public releaseAllMaterialInstances(): number {
        let releasedCount = 0;
        
        this._materialInstances.forEach((instances, type) => {
            releasedCount += instances.length;
            instances.length = 0; // 清空数组
        });
        
        this._materialInstances.clear();
        
        console.log(`释放了 ${releasedCount} 个材质实例`);
        return releasedCount;
    }
    
    // ==================== 材质工具 ====================
    
    // 复制材质配置
    public duplicateMaterialConfig(type: MaterialType, newType: string): MaterialConfig | null {
        const original = this.getMaterialConfig(type);
        if (!original) {
            return null;
        }
        
        const duplicate: MaterialConfig = {
            ...original,
            type: newType as MaterialType
        };
        
        this._materialConfigs.set(newType as MaterialType, duplicate);
        
        console.log(`复制材质配置: ${type} -> ${newType}`);
        return duplicate;
    }
    
    // 修改材质配置
    public modifyMaterialConfig(type: MaterialType, modifications: Partial<MaterialConfig>): boolean {
        const config = this.getMaterialConfig(type);
        if (!config) {
            return false;
        }
        
        Object.assign(config, modifications);
        
        console.log(`修改材质配置: ${type}`, modifications);
        return true;
    }
    
    // 创建自定义材质
    public createCustomMaterial(
        type: string,
        baseColor: Color,
        metallic: number,
        roughness: number,
        options?: Partial<MaterialConfig>
    ): MaterialConfig {
        const config: MaterialConfig = {
            type: type as MaterialType,
            baseColor,
            metallic,
            roughness,
            ...options
        };
        
        this._materialConfigs.set(type as MaterialType, config);
        
        console.log(`创建自定义材质: ${type}`, config);
        return config;
    }
    
    // ==================== 恐怖特效材质 ====================
    
    // 创建恐怖模式材质变体
    public createHorrorVariant(originalType: MaterialType): MaterialConfig | null {
        const original = this.getMaterialConfig(originalType);
        if (!original) {
            return null;
        }
        
        const horrorType = `${originalType}_horror` as MaterialType;
        
        // 创建恐怖版本：更暗、更红、增加自发光
        const horrorConfig: MaterialConfig = {
            ...original,
            type: horrorType,
            baseColor: this.darkenColor(original.baseColor, 0.5), // 变暗50%
            emissive: new Color(255, 50, 50), // 红色自发光
            emissiveIntensity: 0.3,
            roughness: Math.min(original.roughness + 0.2, 1.0) // 增加粗糙度
        };
        
        this._materialConfigs.set(horrorType, horrorConfig);
        
        console.log(`创建恐怖变体: ${originalType} -> ${horrorType}`);
        return horrorConfig;
    }
    
    // 变暗颜色
    private darkenColor(color: Color, factor: number): Color {
        return new Color(
            Math.floor(color.r * factor),
            Math.floor(color.g * factor),
            Math.floor(color.b * factor),
            color.a
        );
    }
    
    // 创建闪烁材质（用于灯光效果）
    public createFlickeringMaterial(type: MaterialType, flickerSpeed: number = 1.0): MaterialConfig | null {
        const original = this.getMaterialConfig(type);
        if (!original) {
            return null;
        }
        
        const flickerType = `${type}_flicker` as MaterialType;
        
        const flickerConfig: MaterialConfig = {
            ...original,
            type: flickerType,
            emissiveIntensity: (original.emissiveIntensity || 0) * 1.5, // 增加发光强度
            shader: 'flicker' // 使用自定义闪烁shader
        };
        
        this._materialConfigs.set(flickerType, flickerConfig);
        
        console.log(`创建闪烁材质: ${type}, 闪烁速度: ${flickerSpeed}`);
        return flickerConfig;
    }
    
    // ==================== 材质导出 ====================
    
    // 导出材质配置
    public exportMaterialConfigs(): any {
        const exportData: any = {
            materials: [],
            timestamp: Date.now()
        };
        
        this._materialConfigs.forEach((config, type) => {
            exportData.materials.push({
                type,
                config: {
                    baseColor: config.baseColor.toHEX(),
                    metallic: config.metallic,
                    roughness: config.roughness,
                    transparency: config.transparency,
                    emissive: config.emissive?.toHEX(),
                    emissiveIntensity: config.emissiveIntensity,
                    blendMode: config.blendMode
                }
            });
        });
        
        return exportData;
    }
    
    // 导入材质配置
    public importMaterialConfigs(data: any): number {
        if (!data.materials || !Array.isArray(data.materials)) {
            console.error('无效的材质配置数据');
            return 0;
        }
        
        let importedCount = 0;
        
        data.materials.forEach((item: any) => {
            if (item.type && item.config) {
                const config: MaterialConfig = {
                    type: item.type as MaterialType,
                    baseColor: Color.fromHEX(item.config.baseColor),
                    metallic: item.config.metallic || 0,
                    roughness: item.config.roughness || 0.5,
                    transparency: item.config.transparency,
                    emissive: item.config.emissive ? Color.fromHEX(item.config.emissive) : undefined,
                    emissiveIntensity: item.config.emissiveIntensity,
                    blendMode: item.config.blendMode || 'opaque',
                    normalMap: item.config.normalMap,
                    aoMap: item.config.aoMap,
                    shader: item.config.shader
                };
                
                this._materialConfigs.set(item.type as MaterialType, config);
                importedCount++;
            }
        });
        
        console.log(`导入 ${importedCount} 个材质配置`);
        return importedCount;
    }
    
    // ==================== 调试工具 ====================
    
    // 打印材质信息
    public printMaterialInfo(): void {
        console.log('=== 材质信息 ===');
        
        this._materialConfigs.forEach((config, type) => {
            console.log(`${type}:`, {
                基础颜色: config.baseColor.toHEX(),
                金属度: config.metallic,
                粗糙度: config.roughness,
                透明度: config.transparency || 1,
                自发光: config.emissive?.toHEX(),
                自发光强度: config.emissiveIntensity
            });
        });
        
        const instanceCount = Array.from(this._materialInstances.values())
            .reduce((total, instances) => total + instances.length, 0);
        
        console.log(`总计: ${this._materialConfigs.size} 种材质配置, ${instanceCount} 个材质实例`);
    }
    
    // ==================== 清理 ====================
    
    onDestroy() {
        // 释放所有材质实例
        this.releaseAllMaterialInstances();
        
        console.log('MaterialConfigManager销毁');
    }
}

console.log('MaterialConfigManager类定义完成');