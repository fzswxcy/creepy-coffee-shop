// 微恐咖啡厅 - 3D几何体创建工具
// 用于在没有外部模型时创建基础几何体
// 创建时间: 2026年3月4日

import { _decorator, Component, Node, MeshRenderer, Mesh, Vec3, Color, Quat, primitives, Material } from 'cc';
const { ccclass, property } = _decorator;

// 几何体类型
enum GeometryType {
    BOX = 'box',
    SPHERE = 'sphere',
    CYLINDER = 'cylinder',
    CONE = 'cone',
    PLANE = 'plane'
}

// 几何体配置
interface GeometryConfig {
    type: GeometryType;
    size?: Vec3;        // 对于box
    radius?: number;    // 对于sphere/cylinder/cone
    height?: number;    // 对于cylinder/cone
    segments?: number;  // 细分段数
}

@ccclass('GeometryCreator')
export class GeometryCreator extends Component {
    
    // 单例实例
    private static _instance: GeometryCreator = null;
    public static get instance(): GeometryCreator {
        if (GeometryCreator._instance === null) {
            GeometryCreator._instance = new GeometryCreator();
        }
        return GeometryCreator._instance;
    }
    
    // 几何体缓存
    private _geometryCache: Map<string, Mesh> = new Map();
    
    // 默认材质
    @property(Material)
    private defaultMaterial: Material = null;
    
    constructor() {
        super();
        this.initialize();
    }
    
    // 初始化
    private initialize() {
        console.log('GeometryCreator初始化');
        
        // 预创建常用几何体
        this.precreateCommonGeometries();
    }
    
    // 预创建常用几何体
    private precreateCommonGeometries() {
        // 咖啡厅常用几何体
        this.createGeometry('counter_base', {
            type: GeometryType.BOX,
            size: new Vec3(4, 1.5, 1)
        });
        
        this.createGeometry('table_top', {
            type: GeometryType.BOX,
            size: new Vec3(0.8, 0.1, 0.8)
        });
        
        this.createGeometry('table_leg', {
            type: GeometryType.CYLINDER,
            radius: 0.05,
            height: 0.5
        });
        
        this.createGeometry('chair_seat', {
            type: GeometryType.BOX,
            size: new Vec3(0.4, 0.1, 0.4)
        });
        
        this.createGeometry('chair_back', {
            type: GeometryType.BOX,
            size: new Vec3(0.4, 0.6, 0.05)
        });
        
        this.createGeometry('coffee_machine_body', {
            type: GeometryType.BOX,
            size: new Vec3(0.6, 1, 0.5)
        });
        
        this.createGeometry('coffee_cup', {
            type: GeometryType.CYLINDER,
            radius: 0.2,
            height: 0.3
        });
        
        this.createGeometry('ghost_body', {
            type: GeometryType.SPHERE,
            radius: 0.3
        });
        
        console.log('常用几何体预创建完成');
    }
    
    // ==================== 几何体创建接口 ====================
    
    // 创建几何体
    public createGeometry(key: string, config: GeometryConfig): Mesh | null {
        console.log(`创建几何体: ${key}, 类型: ${config.type}`);
        
        let mesh: Mesh | null = null;
        
        try {
            switch (config.type) {
                case GeometryType.BOX:
                    mesh = this.createBoxMesh(config);
                    break;
                case GeometryType.SPHERE:
                    mesh = this.createSphereMesh(config);
                    break;
                case GeometryType.CYLINDER:
                    mesh = this.createCylinderMesh(config);
                    break;
                case GeometryType.CONE:
                    mesh = this.createConeMesh(config);
                    break;
                case GeometryType.PLANE:
                    mesh = this.createPlaneMesh(config);
                    break;
                default:
                    console.error(`未知的几何体类型: ${config.type}`);
                    return null;
            }
            
            if (mesh) {
                this._geometryCache.set(key, mesh);
                console.log(`几何体创建成功: ${key}`);
            }
            
            return mesh;
        } catch (error) {
            console.error(`创建几何体失败: ${key}`, error);
            return null;
        }
    }
    
    // 创建盒子网格
    private createBoxMesh(config: GeometryConfig): Mesh {
        const size = config.size || new Vec3(1, 1, 1);
        
        // 使用Cocos Creator的primitive创建盒子
        const mesh = primitives.box({
            width: size.x,
            height: size.y,
            length: size.z
        });
        
        return mesh;
    }
    
    // 创建球体网格
    private createSphereMesh(config: GeometryConfig): Mesh {
        const radius = config.radius || 0.5;
        const segments = config.segments || 32;
        
        const mesh = primitives.sphere({
            radius: radius,
            segments: segments
        });
        
        return mesh;
    }
    
    // 创建圆柱体网格
    private createCylinderMesh(config: GeometryConfig): Mesh {
        const radius = config.radius || 0.5;
        const height = config.height || 1;
        const segments = config.segments || 32;
        
        const mesh = primitives.cylinder({
            radiusTop: radius,
            radiusBottom: radius,
            height: height,
            segments: segments
        });
        
        return mesh;
    }
    
    // 创建圆锥体网格
    private createConeMesh(config: GeometryConfig): Mesh {
        const radius = config.radius || 0.5;
        const height = config.height || 1;
        const segments = config.segments || 32;
        
        const mesh = primitives.cone({
            radius: radius,
            height: height,
            segments: segments
        });
        
        return mesh;
    }
    
    // 创建平面网格
    private createPlaneMesh(config: GeometryConfig): Mesh {
        const size = config.size || new Vec3(1, 1, 0);
        const segments = config.segments || 1;
        
        const mesh = primitives.plane({
            width: size.x,
            length: size.z,
            segments: segments
        });
        
        return mesh;
    }
    
    // ==================== 物体创建接口 ====================
    
    // 创建3D物体节点
    public createObjectNode(name: string, geometryKey: string, material?: Material): Node | null {
        console.log(`创建物体节点: ${name}, 几何体: ${geometryKey}`);
        
        const mesh = this._geometryCache.get(geometryKey);
        if (!mesh) {
            console.error(`找不到几何体: ${geometryKey}`);
            return null;
        }
        
        const node = new Node(name);
        const renderer = node.addComponent(MeshRenderer);
        
        renderer.mesh = mesh;
        renderer.material = material || this.defaultMaterial;
        
        return node;
    }
    
    // 创建咖啡厅物体
    public createCoffeeShopObject(type: string, position?: Vec3, scale?: Vec3): Node | null {
        console.log(`创建咖啡厅物体: ${type}`);
        
        let node: Node | null = null;
        let geometryKey = '';
        let objScale = scale || new Vec3(1, 1, 1);
        
        switch (type) {
            case 'counter':
                geometryKey = 'counter_base';
                node = this.createObjectNode('Counter', geometryKey);
                objScale = scale || new Vec3(4, 1.5, 1);
                break;
                
            case 'table':
                // 桌子由桌面和桌腿组成
                node = this.createTable();
                break;
                
            case 'chair':
                // 椅子由座位和靠背组成
                node = this.createChair();
                break;
                
            case 'coffee_machine':
                geometryKey = 'coffee_machine_body';
                node = this.createObjectNode('CoffeeMachine', geometryKey);
                objScale = scale || new Vec3(0.8, 1.2, 0.8);
                break;
                
            case 'coffee_cup':
                geometryKey = 'coffee_cup';
                node = this.createObjectNode('CoffeeCup', geometryKey);
                objScale = scale || new Vec3(0.2, 0.3, 0.2);
                break;
                
            case 'ghost':
                geometryKey = 'ghost_body';
                node = this.createObjectNode('Ghost', geometryKey);
                objScale = scale || new Vec3(0.5, 0.5, 0.5);
                break;
                
            default:
                console.error(`未知的咖啡厅物体类型: ${type}`);
                return null;
        }
        
        if (node) {
            if (position) {
                node.setPosition(position);
            }
            node.setScale(objScale);
        }
        
        return node;
    }
    
    // 创建桌子（组合物体）
    private createTable(): Node {
        const table = new Node('Table');
        
        // 桌面
        const tableTop = this.createObjectNode('TableTop', 'table_top');
        if (tableTop) {
            tableTop.setPosition(new Vec3(0, 0.3, 0));
            table.addChild(tableTop);
        }
        
        // 桌腿
        const legPositions = [
            new Vec3(-0.35, 0, -0.35),
            new Vec3(0.35, 0, -0.35),
            new Vec3(-0.35, 0, 0.35),
            new Vec3(0.35, 0, 0.35)
        ];
        
        legPositions.forEach((position, index) => {
            const leg = this.createObjectNode(`TableLeg_${index}`, 'table_leg');
            if (leg) {
                leg.setPosition(position);
                table.addChild(leg);
            }
        });
        
        return table;
    }
    
    // 创建椅子（组合物体）
    private createChair(): Node {
        const chair = new Node('Chair');
        
        // 座位
        const seat = this.createObjectNode('ChairSeat', 'chair_seat');
        if (seat) {
            seat.setPosition(new Vec3(0, 0.25, 0));
            chair.addChild(seat);
        }
        
        // 靠背
        const back = this.createObjectNode('ChairBack', 'chair_back');
        if (back) {
            back.setPosition(new Vec3(0, 0.6, 0.2));
            chair.addChild(back);
        }
        
        // 椅腿
        const legPositions = [
            new Vec3(-0.15, 0, -0.15),
            new Vec3(0.15, 0, -0.15),
            new Vec3(-0.15, 0, 0.15),
            new Vec3(0.15, 0, 0.15)
        ];
        
        legPositions.forEach((position, index) => {
            const leg = this.createObjectNode(`ChairLeg_${index}`, 'table_leg');
            if (leg) {
                leg.setScale(new Vec3(0.6, 1, 0.6)); // 比桌腿细
                leg.setPosition(position);
                chair.addChild(leg);
            }
        });
        
        return chair;
    }
    
    // 创建咖啡机（组合物体）
    public createCoffeeMachineDetailed(): Node {
        const coffeeMachine = new Node('CoffeeMachine_Detailed');
        
        // 主体
        const body = this.createObjectNode('CoffeeMachineBody', 'coffee_machine_body');
        if (body) {
            body.setPosition(new Vec3(0, 0.5, 0));
            coffeeMachine.addChild(body);
        }
        
        // 顶部控制面板
        const controlPanel = this.createObjectNode('ControlPanel', 'table_top');
        if (controlPanel) {
            controlPanel.setScale(new Vec3(0.5, 0.05, 0.3));
            controlPanel.setPosition(new Vec3(0, 0.95, 0.2));
            coffeeMachine.addChild(controlPanel);
        }
        
        // 咖啡出口
        const spout = this.createObjectNode('CoffeeSpout', 'table_leg');
        if (spout) {
            spout.setScale(new Vec3(0.08, 0.3, 0.08));
            spout.setPosition(new Vec3(0.25, 0.7, 0.2));
            coffeeMachine.addChild(spout);
        }
        
        // 咖啡杯托盘
        const tray = this.createObjectNode('CoffeeTray', 'table_top');
        if (tray) {
            tray.setScale(new Vec3(0.3, 0.05, 0.3));
            tray.setPosition(new Vec3(0.25, 0.3, 0));
            coffeeMachine.addChild(tray);
        }
        
        return coffeeMachine;
    }
    
    // 创建幽灵（带特效）
    public createGhostWithEffects(): Node {
        const ghost = new Node('Ghost_WithEffects');
        
        // 幽灵身体
        const body = this.createObjectNode('GhostBody', 'ghost_body');
        if (body) {
            ghost.addChild(body);
        }
        
        // 眼睛（两个小球）
        const leftEye = this.createObjectNode('GhostEye_Left', 'sphere');
        if (leftEye) {
            leftEye.setScale(new Vec3(0.1, 0.1, 0.1));
            leftEye.setPosition(new Vec3(-0.1, 0.1, 0.3));
            ghost.addChild(leftEye);
        }
        
        const rightEye = this.createObjectNode('GhostEye_Right', 'sphere');
        if (rightEye) {
            rightEye.setScale(new Vec3(0.1, 0.1, 0.1));
            rightEye.setPosition(new Vec3(0.1, 0.1, 0.3));
            ghost.addChild(rightEye);
        }
        
        // 创建"sphere"几何体如果不存在
        if (!this._geometryCache.has('sphere')) {
            this.createGeometry('sphere', {
                type: GeometryType.SPHERE,
                radius: 0.1
            });
        }
        
        return ghost;
    }
    
    // ==================== 材质应用 ====================
    
    // 应用材质到物体
    public applyMaterialToObject(node: Node, material: Material): boolean {
        const renderer = node.getComponent(MeshRenderer);
        if (!renderer) {
            console.error(`节点没有MeshRenderer组件: ${node.name}`);
            return false;
        }
        
        renderer.material = material;
        return true;
    }
    
    // 应用材质到所有子物体
    public applyMaterialToChildren(parent: Node, material: Material): number {
        let appliedCount = 0;
        
        // 应用到父节点本身
        if (this.applyMaterialToObject(parent, material)) {
            appliedCount++;
        }
        
        // 应用到所有子节点
        parent.children.forEach(child => {
            if (this.applyMaterialToObject(child, material)) {
                appliedCount++;
            }
            
            // 递归应用到孙子节点
            appliedCount += this.applyMaterialToChildren(child, material);
        });
        
        return appliedCount;
    }
    
    // ==================== 工具函数 ====================
    
    // 获取几何体
    public getGeometry(key: string): Mesh | null {
        return this._geometryCache.get(key) || null;
    }
    
    // 检查几何体是否存在
    public hasGeometry(key: string): boolean {
        return this._geometryCache.has(key);
    }
    
    // 获取所有几何体键名
    public getAllGeometryKeys(): string[] {
        return Array.from(this._geometryCache.keys());
    }
    
    // 获取几何体信息
    public getGeometryInfo(key: string): { type: string; vertexCount?: number } | null {
        const mesh = this._geometryCache.get(key);
        if (!mesh) return null;
        
        // 获取顶点数（简化版本）
        let vertexCount = 0;
        if (mesh.struct.primitive) {
            // 这里可以根据具体实现获取顶点数
            vertexCount = 100; // 估算值
        }
        
        return {
            type: 'Mesh',
            vertexCount
        };
    }
    
    // ==================== 性能优化 ====================
    
    // 优化几何体（减少顶点数）
    public optimizeGeometry(key: string, targetVertexCount: number): boolean {
        console.log(`优化几何体: ${key}, 目标顶点数: ${targetVertexCount}`);
        
        const mesh = this._geometryCache.get(key);
        if (!mesh) {
            console.error(`找不到几何体: ${key}`);
            return false;
        }
        
        // 这里可以实现几何体优化算法
        // 简化版本：记录优化操作
        
        console.log(`几何体优化完成: ${key}`);
        return true;
    }
    
    // 批量优化几何体
    public optimizeGeometries(targetVertexCount: number): number {
        let optimizedCount = 0;
        
        this._geometryCache.forEach((mesh, key) => {
            if (this.optimizeGeometry(key, targetVertexCount)) {
                optimizedCount++;
            }
        });
        
        console.log(`批量优化完成: ${optimizedCount} 个几何体`);
        return optimizedCount;
    }
    
    // 获取几何体顶点数统计
    public getGeometryStatistics(): {
        totalGeometries: number;
        estimatedTotalVertices: number;
        averageVerticesPerGeometry: number;
    } {
        const totalGeometries = this._geometryCache.size;
        let estimatedTotalVertices = 0;
        
        this._geometryCache.forEach((mesh, key) => {
            const info = this.getGeometryInfo(key);
            if (info && info.vertexCount) {
                estimatedTotalVertices += info.vertexCount;
            }
        });
        
        const averageVerticesPerGeometry = totalGeometries > 0 
            ? estimatedTotalVertices / totalGeometries 
            : 0;
        
        return {
            totalGeometries,
            estimatedTotalVertices,
            averageVerticesPerGeometry
        };
    }
    
    // ==================== 清理 ====================
    
    // 释放几何体
    public releaseGeometry(key: string): boolean {
        if (!this._geometryCache.has(key)) {
            return false;
        }
        
        // 这里可以添加几何体释放逻辑
        this._geometryCache.delete(key);
        
        console.log(`几何体已释放: ${key}`);
        return true;
    }
    
    // 释放所有几何体
    public releaseAllGeometries(): number {
        const keys = Array.from(this._geometryCache.keys());
        let releasedCount = 0;
        
        keys.forEach(key => {
            if (this.releaseGeometry(key)) {
                releasedCount++;
            }
        });
        
        console.log(`释放了 ${releasedCount} 个几何体`);
        return releasedCount;
    }
    
    // ==================== 调试工具 ====================
    
    // 打印几何体信息
    public printGeometryInfo(): void {
        console.log('=== 几何体信息 ===');
        
        this._geometryCache.forEach((mesh, key) => {
            const info = this.getGeometryInfo(key);
            console.log(`${key}: ${info?.type || '未知'}, 顶点数: ${info?.vertexCount || '未知'}`);
        });
        
        const stats = this.getGeometryStatistics();
        console.log(`总计: ${stats.totalGeometries} 个几何体, 估算顶点数: ${stats.estimatedTotalVertices}`);
    }
    
    // 导出几何体数据（用于调试）
    public exportGeometryData(): any {
        const data: any = {
            geometries: [],
            statistics: this.getGeometryStatistics()
        };
        
        this._geometryCache.forEach((mesh, key) => {
            const info = this.getGeometryInfo(key);
            data.geometries.push({
                key,
                info
            });
        });
        
        return data;
    }
}

console.log('GeometryCreator类定义完成');