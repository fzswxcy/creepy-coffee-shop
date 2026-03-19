/**
 * 微恐咖啡厅3D场景测试脚本
 */

// 导入3D场景类
const { MidnightCoffeeShop3D, Vec3, Color } = require('./Simple3DScene.js');

console.log('🧪 开始测试微恐咖啡厅3D场景...');

// 创建场景实例
const coffeeShop = new MidnightCoffeeShop3D();

// 测试1: 获取场景状态
console.log('\n=== 测试1: 场景状态 ===');
const sceneState = coffeeShop.getSceneState();
console.log('场景节点数量:', sceneState.nodeCount);
console.log('材质数量:', sceneState.materialCount);
console.log('灯光数量:', sceneState.lightCount);
console.log('恐怖模式:', sceneState.horrorMode);
console.log('理智值:', sceneState.sanityLevel);

// 测试2: 输出场景JSON（部分）
console.log('\n=== 测试2: 场景结构（简化） ===');
const sceneJson = coffeeShop.toJSON();
console.log('场景根节点:', sceneJson.scene.name);
console.log('子节点数量:', sceneJson.scene.children.length);
console.log('灯光类型:', sceneJson.lights.map(l => l.type).join(', '));

// 测试3: 模拟游戏循环
console.log('\n=== 测试3: 模拟游戏循环 ===');
console.log('开始模拟10秒游戏时间...');

let simulatedTime = 0;
const updateInterval = 100; // 100ms更新一次

const simulation = setInterval(() => {
    simulatedTime += updateInterval / 1000; // 转换为秒
    
    // 更新场景
    coffeeShop.update(updateInterval / 1000);
    
    // 逐渐降低理智值
    if (simulatedTime > 2) {
        const newSanity = Math.max(30, 100 - simulatedTime * 10);
        coffeeShop.setSanityLevel(newSanity);
    }
    
    // 每2秒输出一次状态
    if (Math.floor(simulatedTime * 10) % 20 === 0) {
        const state = coffeeShop.getSceneState();
        console.log(`[${simulatedTime.toFixed(1)}s] 理智值: ${state.sanityLevel}, 恐怖模式: ${state.horrorMode}`);
    }
    
    // 10秒后停止
    if (simulatedTime >= 10) {
        clearInterval(simulation);
        console.log('\n✅ 模拟完成');
        
        // 最终状态
        const finalState = coffeeShop.getSceneState();
        console.log('\n=== 最终状态 ===');
        console.log('总游戏时间:', finalState.time.toFixed(1), '秒');
        console.log('最终理智值:', finalState.sanityLevel);
        console.log('恐怖模式触发次数:', Math.floor(finalState.time / 15)); // 大约每15秒一次
        
        // 输出性能数据
        console.log('\n=== 性能统计 ===');
        console.log('场景总节点数:', finalState.nodeCount);
        console.log('材质总数:', finalState.materialCount);
        console.log('灯光总数:', finalState.lightCount);
        console.log('场景内存估算:', Math.round(finalState.nodeCount * 0.1 + finalState.materialCount * 0.5 + finalState.lightCount * 0.2), 'KB');
        
        console.log('\n🎮 3D场景测试完成！');
    }
}, updateInterval);

// 处理Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n⚠️ 测试被中断');
    clearInterval(simulation);
    process.exit(0);
});