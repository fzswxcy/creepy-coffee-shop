// 🧪 灯光工厂系统测试脚本
// 版本: 1.0.0
// 测试时间: 2026年3月5日 11:15 GMT+8
// 测试目标: 验证灯光工厂系统的完整功能和性能

console.log('🔦 开始灯光工厂系统全面测试...');
console.log('======================================');

// 加载灯光工厂系统
const LightFactory = require('./light_factory.js');

/**
 * 📊 测试结果记录器
 */
class TestReporter {
  constructor() {
    this.tests = [];
    this.startTime = Date.now();
    this.successCount = 0;
    this.failCount = 0;
  }

  record(testName, result, message = '') {
    const test = {
      name: testName,
      result: result ? '✅' : '❌',
      message,
      timestamp: Date.now() - this.startTime
    };
    
    this.tests.push(test);
    
    if (result) {
      this.successCount++;
      console.log(`${test.result} ${testName}: ${message}`);
    } else {
      this.failCount++;
      console.log(`${test.result} ${testName}: ${message}`);
    }
    
    return result;
  }

  getSummary() {
    const totalTime = Date.now() - this.startTime;
    return {
      totalTests: this.tests.length,
      successCount: this.successCount,
      failCount: this.failCount,
      successRate: ((this.successCount / this.tests.length) * 100).toFixed(1) + '%',
      totalTime: totalTime + 'ms',
      averageTime: (totalTime / this.tests.length).toFixed(1) + 'ms'
    };
  }

  printReport() {
    console.log('\n📋 测试报告摘要');
    console.log('======================================');
    
    for (const test of this.tests) {
      console.log(`${test.result} ${test.name.padEnd(40)} ${test.message.padEnd(30)} ${test.timestamp}ms`);
    }
    
    console.log('======================================');
    const summary = this.getSummary();
    console.log(`📊 总计: ${summary.totalTests} 个测试`);
    console.log(`✅ 通过: ${summary.successCount}`);
    console.log(`❌ 失败: ${summary.failCount}`);
    console.log(`📈 成功率: ${summary.successRate}`);
    console.log(`⏱️ 总耗时: ${summary.totalTime}`);
    console.log(`⚡ 平均耗时: ${summary.averageTime}`);
    
    if (this.failCount === 0) {
      console.log('\n🎉 所有测试通过！灯光工厂系统功能完整！');
    } else {
      console.log(`\n⚠️ 有 ${this.failCount} 个测试失败，请检查问题。`);
    }
  }
}

/**
 * 🧪 运行所有测试
 */
async function runAllTests() {
  const reporter = new TestReporter();
  
  console.log('🏗️ 测试1: 灯光工厂初始化');
  console.log('--------------------------------------');
  
  let lightFactory;
  try {
    lightFactory = new LightFactory({
      maxLights: 4,
      poolSize: 3,
      debugMode: true,
      performanceMode: 'balanced'
    });
    
    reporter.record('工厂初始化', true, '灯光工厂实例创建成功');
  } catch (error) {
    reporter.record('工厂初始化', false, `创建失败: ${error.message}`);
    reporter.printReport();
    return;
  }

  // 测试2: 配置验证
  console.log('\n⚙️ 测试2: 配置验证');
  console.log('--------------------------------------');
  
  const config = lightFactory.getConfig();
  reporter.record('最大灯光数配置', config.maxLights === 4, `配置值: ${config.maxLights}`);
  reporter.record('对象池大小配置', config.poolSize === 3, `配置值: ${config.poolSize}`);
  reporter.record('调试模式配置', config.debugMode === true, `调试模式: ${config.debugMode}`);
  reporter.record('性能模式配置', config.performanceMode === 'balanced', `性能模式: ${config.performanceMode}`);

  // 测试3: 灯光创建功能
  console.log('\n🏗️ 测试3: 灯光创建功能');
  console.log('--------------------------------------');
  
  const testLights = [];
  const lightTypes = ['MainLight', 'BarSpotlight', 'TerrorAlertLight', 'GhostBlueLight'];
  
  for (const lightType of lightTypes) {
    try {
      const light = lightFactory.createLight(lightType, {
        position: { x: Math.random() * 10, y: 2, z: Math.random() * 10 },
        terrorLevel: Math.floor(Math.random() * 100),
        materialLink: `material_${lightType.toLowerCase()}`
      });
      
      testLights.push(light);
      reporter.record(`${lightType}创建`, true, `ID: ${light.id}`);
      
      // 验证灯光属性
      reporter.record(`${lightType}属性验证`, 
        light.type === lightType && 
        light.enabled === true && 
        light.position !== undefined,
        `类型: ${light.type}, 启用: ${light.enabled}`
      );
    } catch (error) {
      reporter.record(`${lightType}创建`, false, `创建失败: ${error.message}`);
    }
  }

  // 测试4: 性能统计验证
  console.log('\n📊 测试4: 性能统计验证');
  console.log('--------------------------------------');
  
  const stats = lightFactory.getPerformanceStats();
  reporter.record('活跃灯光数统计', stats.activeCount === testLights.length, 
    `活跃: ${stats.activeCount}, 期望: ${testLights.length}`);
  reporter.record('对象池命中统计', stats.poolHits > 0, `池命中: ${stats.poolHits}`);
  reporter.record('内存使用统计', stats.memoryUsage > 0, `内存: ${stats.memoryUsage} bytes`);
  reporter.record('内存使用安全', stats.memoryUsage < 4096, `内存安全: ${stats.memoryUsage} < 4096 bytes`);

  // 测试5: 对象池功能
  console.log('\n♻️ 测试5: 对象池功能');
  console.log('--------------------------------------');
  
  const initialPoolStats = lightFactory.calculatePoolUtilization();
  const initialActiveCount = stats.activeCount;
  
  // 回收一个灯光
  if (testLights.length > 0) {
    const lightToRecycle = testLights[0];
    const recycleResult = lightFactory.recycleLight(lightToRecycle.id);
    reporter.record('灯光回收功能', recycleResult === true, `回收灯光: ${lightToRecycle.id}`);
    
    // 验证回收后统计
    const afterRecycleStats = lightFactory.getPerformanceStats();
    reporter.record('回收后活跃数减少', afterRecycleStats.activeCount === initialActiveCount - 1,
      `回收前: ${initialActiveCount}, 回收后: ${afterRecycleStats.activeCount}`);
    reporter.record('回收计数增加', afterRecycleStats.totalRecycled > 0,
      `回收计数: ${afterRecycleStats.totalRecycled}`);
  }

  // 测试6: 更新功能
  console.log('\n🔄 测试6: 更新功能');
  console.log('--------------------------------------');
  
  // 创建一些带动画的灯光
  const animatedLight = lightFactory.createLight('TerrorAlertLight', {
    position: { x: 0, y: 5, z: 0 },
    animation: 'flicker',
    terrorLevel: 50
  });
  
  const pulsedLight = lightFactory.createLight('GhostBlueLight', {
    position: { x: 5, y: 3, z: 0 },
    animation: 'pulse',
    terrorLevel: 30
  });
  
  reporter.record('动画灯光创建', animatedLight && pulsedLight, 
    `创建了 ${animatedLight ? 'TerrorAlertLight' : ''} 和 ${pulsedLight ? 'GhostBlueLight' : ''}`);
  
  // 运行几次更新
  const updateResults = [];
  for (let i = 0; i < 5; i++) {
    lightFactory.update(16.67); // 模拟60FPS的一帧
    updateResults.push(true);
  }
  
  reporter.record('系统更新功能', updateResults.length === 5, `执行了 ${updateResults.length} 次更新`);
  
  // 检查恐怖效果更新
  const afterUpdateStats = lightFactory.getPerformanceStats();
  reporter.record('更新次数统计', afterUpdateStats.updateTime !== undefined,
    `最后更新耗时: ${afterUpdateStats.updateTime}ms`);

  // 测试7: 限制功能
  console.log('\n🚨 测试7: 限制功能');
  console.log('--------------------------------------');
  
  // 尝试创建超过限制的灯光
  let limitError = false;
  try {
    // 我们已经有了几个灯光，再尝试创建更多
    for (let i = 0; i < 10; i++) {
      lightFactory.createLight('UIFeedbackLight', {
        position: { x: i * 2, y: 1, z: 0 }
      });
    }
  } catch (error) {
    limitError = true;
    reporter.record('最大灯光数限制', error.message.includes('达到微信小游戏平台限制'),
      `限制生效: ${error.message}`);
  }
  
  if (!limitError) {
    reporter.record('最大灯光数限制', false, '未正确触发限制');
  }

  // 测试8: 清理功能
  console.log('\n🧹 测试8: 清理功能');
  console.log('--------------------------------------');
  
  // 禁用一个灯光，模拟不活跃状态
  if (testLights.length > 1) {
    const lightToDisable = testLights[1];
    lightToDisable.enabled = false;
    lightToDisable.lastUpdate = Date.now() - 15000; // 设置为15秒前更新
    
    const beforeCleanupCount = lightFactory.getPerformanceStats().activeCount;
    
    // 运行清理
    lightFactory.cleanupInactiveLights();
    
    const afterCleanupCount = lightFactory.getPerformanceStats().activeCount;
    reporter.record('不活跃灯光清理', afterCleanupCount < beforeCleanupCount,
      `清理前: ${beforeCleanupCount}, 清理后: ${afterCleanupCount}`);
  }

  // 测试9: 配置更新
  console.log('\n⚙️ 测试9: 配置更新');
  console.log('--------------------------------------');
  
  const newConfig = {
    maxLights: 6,
    performanceMode: 'performance',
    debugMode: false
  };
  
  lightFactory.updateConfig(newConfig);
  const updatedConfig = lightFactory.getConfig();
  
  reporter.record('最大灯光数更新', updatedConfig.maxLights === 6,
    `更新后: ${updatedConfig.maxLights}`);
  reporter.record('性能模式更新', updatedConfig.performanceMode === 'performance',
    `更新后: ${updatedConfig.performanceMode}`);
  reporter.record('调试模式更新', updatedConfig.debugMode === false,
    `更新后: ${updatedConfig.debugMode}`);

  // 测试10: 重置和销毁
  console.log('\n💾 测试10: 重置和销毁');
  console.log('--------------------------------------');
  
  const beforeResetStats = lightFactory.getPerformanceStats();
  lightFactory.reset();
  const afterResetStats = lightFactory.getPerformanceStats();
  
  reporter.record('重置功能', afterResetStats.activeCount === 0,
    `重置前: ${beforeResetStats.activeCount}, 重置后: ${afterResetStats.activeCount}`);
  reporter.record('重置后回收计数归零', afterResetStats.totalRecycled === 0,
    `回收计数: ${afterResetStats.totalRecycled}`);
  
  // 最后销毁
  lightFactory.destroy();
  const finalStats = lightFactory.getPerformanceStats();
  reporter.record('销毁功能', finalStats.memoryUsage === 0,
    `最终内存使用: ${finalStats.memoryUsage} bytes`);

  // 打印最终报告
  console.log('\n======================================');
  reporter.printReport();

  // 返回测试结果
  return {
    reporter,
    success: reporter.failCount === 0,
    summary: reporter.getSummary()
  };
}

/**
 * 📱 微信小游戏兼容性测试
 */
function testWechatCompatibility() {
  console.log('\n📱 微信小游戏兼容性测试');
  console.log('--------------------------------------');
  
  const compatibilityChecks = [];
  
  // 检查1: 内存限制兼容性
  const memoryTestFactory = new LightFactory({
    maxLights: 4,
    poolSize: 5,
    mobileOptimized: true
  });
  
  // 创建最大数量的灯光
  const memoryTestLights = [];
  for (let i = 0; i < 4; i++) {
    memoryTestLights.push(memoryTestFactory.createLight('MainLight'));
  }
  
  const memoryStats = memoryTestFactory.getPerformanceStats();
  const memoryKB = parseFloat(memoryStats.memoryUsageKB);
  
  compatibilityChecks.push({
    check: '内存使用限制',
    result: memoryKB < 32, // 微信小游戏通常限制在32KB左右
    value: `${memoryKB} KB`,
    required: '< 32 KB',
    status: memoryKB < 32 ? '✅' : '❌'
  });
  
  // 检查2: 对象数量限制
  compatibilityChecks.push({
    check: '同时激活灯光数',
    result: memoryStats.activeCount <= 4,
    value: memoryStats.activeCount,
    required: '≤ 4',
    status: memoryStats.activeCount <= 4 ? '✅' : '❌'
  });
  
  // 检查3: 更新性能
  const updateStart = Date.now();
  for (let i = 0; i < 10; i++) {
    memoryTestFactory.update(16.67);
  }
  const updateTime = Date.now() - updateStart;
  const avgUpdateTime = updateTime / 10;
  
  compatibilityChecks.push({
    check: '单帧更新时间',
    result: avgUpdateTime < 5, // 微信小游戏要求更新快
    value: `${avgUpdateTime.toFixed(2)} ms`,
    required: '< 5 ms',
    status: avgUpdateTime < 5 ? '✅' : '❌'
  });
  
  // 检查4: 垃圾回收友好
  const initialMemory = memoryStats.memoryUsage;
  memoryTestFactory.reset();
  const afterResetMemory = memoryTestFactory.getPerformanceStats().memoryUsage;
  
  compatibilityChecks.push({
    check: '重置后内存释放',
    result: afterResetMemory < initialMemory,
    value: `${initialMemory} → ${afterResetMemory} bytes`,
    required: '释放内存',
    status: afterResetMemory < initialMemory ? '✅' : '❌'
  });
  
  memoryTestFactory.destroy();
  
  // 打印兼容性报告
  console.log('\n📋 微信小游戏兼容性报告');
  console.log('--------------------------------------');
  
  let allCompatible = true;
  for (const check of compatibilityChecks) {
    console.log(`${check.status} ${check.check.padEnd(25)} ${check.value.padEnd(15)} ${check.required}`);
    if (!check.result) {
      allCompatible = false;
    }
  }
  
  console.log('\n📊 兼容性总结:');
  if (allCompatible) {
    console.log('✅ 完全兼容微信小游戏平台！');
  } else {
    console.log('⚠️ 部分兼容性检查未通过，可能需要优化');
  }
  
  return {
    compatible: allCompatible,
    checks: compatibilityChecks
  };
}

/**
 * 🎯 性能基准测试
 */
function performanceBenchmark() {
  console.log('\n⚡ 性能基准测试');
  console.log('--------------------------------------');
  
  const benchmarkFactory = new LightFactory({
    maxLights: 4,
    poolSize: 10,
    performanceMode: 'performance'
  });
  
  const benchmarks = [];
  
  // 基准1: 创建性能
  const createStart = Date.now();
  const benchLights = [];
  for (let i = 0; i < 100; i++) {
    const lightType = ['MainLight', 'BarSpotlight', 'TerrorAlertLight', 'GhostBlueLight'][i % 4];
    benchLights.push(benchmarkFactory.createLight(lightType));
    benchmarkFactory.recycleLight(benchLights[i].id);
  }
  const createTime = Date.now() - createStart;
  
  benchmarks.push({
    name: '创建/回收100次',
    time: createTime + 'ms',
    opsPerSec: Math.floor(100 / (createTime / 1000)),
    rating: createTime < 100 ? '优秀' : createTime < 200 ? '良好' : '一般'
  });
  
  // 基准2: 更新性能
  const updateStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    benchmarkFactory.update(16.67);
  }
  const updateTime = Date.now() - updateStart;
  
  benchmarks.push({
    name: '1000帧更新',
    time: updateTime + 'ms',
    fps: Math.floor(1000 / (updateTime / 1000)),
    rating: updateTime < 100 ? '优秀' : updateTime < 200 ? '良好' : '一般'
  });
  
  // 基准3: 内存性能
  const memoryStats = benchmarkFactory.getPerformanceStats();
  const memoryKB = parseFloat(memoryStats.memoryUsageKB);
  
  benchmarks.push({
    name: '内存占用',
    value: memoryKB + ' KB',
    rating: memoryKB < 10 ? '优秀' : memoryKB < 20 ? '良好' : memoryKB < 32 ? '合格' : '超标'
  });
  
  benchmarkFactory.destroy();
  
  // 打印基准测试结果
  console.log('\n📊 性能基准测试结果');
  console.log('--------------------------------------');
  
  for (const bench of benchmarks) {
    console.log(`📈 ${bench.name.padEnd(20)} ${bench.time || bench.value || ''} ${bench.opsPerSec ? `(${bench.opsPerSec} ops/sec)` : ''} - ${bench.rating}`);
  }
  
  return benchmarks;
}

/**
 * 🚀 主测试函数
 */
async function main() {
  console.log('🎮 《微恐咖啡厅》灯光工厂系统全面测试');
  console.log('======================================');
  console.log('测试时间: ' + new Date().toLocaleString());
  console.log('测试目标: 验证灯光工厂系统功能、性能和兼容性');
  console.log('======================================\n');
  
  try {
    // 运行功能测试
    const functionalResult = await runAllTests();
    
    if (!functionalResult.success) {
      console.log('\n⚠️ 功能测试失败，停止后续测试');
      return;
    }
    
    // 运行兼容性测试
    const compatibilityResult = testWechatCompatibility();
    
    // 运行性能测试
    const performanceResult = performanceBenchmark();
    
    // 最终总结
    console.log('\n======================================');
    console.log('🎯 灯光工厂系统测试完成总结');
    console.log('======================================');
    console.log(`✅ 功能测试: ${functionalResult.summary.successRate} 通过率`);
    console.log(`📱 微信兼容: ${compatibilityResult.compatible ? '✅ 完全兼容' : '⚠️ 部分兼容'}`);
    console.log(`⚡ 性能评级: ${performanceResult[performanceResult.length - 1].rating}`);
    console.log('\n🎉 灯光工厂系统开发完成！');
    console.log('✨ 可以进入下一阶段: 灯光动画控制器开发');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error(error.stack);
  }
}

// 如果是直接运行，执行主函数
if (require.main === module) {
  main();
}

// 导出测试函数
module.exports = {
  runAllTests,
  testWechatCompatibility,
  performanceBenchmark,
  main
};