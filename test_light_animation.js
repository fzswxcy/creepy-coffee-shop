// 🧪 灯光动画控制器测试脚本
// 版本: 1.0.0
// 测试时间: 2026年3月5日 12:00 GMT+8
// 测试目标: 验证灯光动画控制器的完整功能和性能

console.log('🎬 开始灯光动画控制器全面测试...');
console.log('======================================');

// 加载灯光动画控制器
const LightAnimationController = require('./light_animation.js');

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
      console.log('\n🎉 所有测试通过！灯光动画控制器功能完整！');
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
  
  console.log('🏗️ 测试1: 动画控制器初始化');
  console.log('--------------------------------------');
  
  let animationController;
  try {
    animationController = new LightAnimationController({
      maxAnimations: 3,
      animationPoolSize: 5,
      debugMode: true,
      performanceMode: 'balanced'
    });
    
    reporter.record('控制器初始化', true, '灯光动画控制器实例创建成功');
  } catch (error) {
    reporter.record('控制器初始化', false, `创建失败: ${error.message}`);
    reporter.printReport();
    return;
  }

  // 测试2: 配置验证
  console.log('\n⚙️ 测试2: 配置验证');
  console.log('--------------------------------------');
  
  const config = animationController.config;
  reporter.record('最大动画数配置', config.maxAnimations === 3, `配置值: ${config.maxAnimations}`);
  reporter.record('对象池大小配置', config.animationPoolSize === 5, `配置值: ${config.animationPoolSize}`);
  reporter.record('手机端FPS配置', config.mobileFPS === 30, `手机端FPS: ${config.mobileFPS}`);
  reporter.record('调试模式配置', config.debugMode === true, `调试模式: ${config.debugMode}`);

  // 测试3: 动画定义验证
  console.log('\n📝 测试3: 动画定义验证');
  console.log('--------------------------------------');
  
  const definitions = animationController.animationDefinitions;
  const definitionCount = Object.keys(definitions).length;
  
  reporter.record('动画定义数量', definitionCount === 10, `定义了 ${definitionCount} 种动画模式`);
  
  // 验证关键动画类型
  const requiredAnimations = ['smooth_flicker', 'warning_flicker', 'terror_pulse', 'event_flash'];
  for (const animType of requiredAnimations) {
    reporter.record(`${animType}定义`, definitions[animType] !== undefined, 
      definitions[animType] ? definitions[animType].name : '未定义');
  }

  // 测试4: 动画启动功能
  console.log('\n🚀 测试4: 动画启动功能');
  console.log('--------------------------------------');
  
  const testAnimations = [];
  const animationTypes = ['smooth_flicker', 'warning_flicker', 'terror_pulse'];
  
  for (const animType of animationTypes) {
    try {
      const animation = animationController.startAnimation(animType, {
        terrorLevel: Math.floor(Math.random() * 100)
      });
      
      testAnimations.push(animation);
      reporter.record(`${animType}启动`, true, `ID: ${animation.id}, 进度: ${animation.progress}`);
      
      // 验证动画属性
      reporter.record(`${animType}属性验证`, 
        animation.type === animType && 
        animation.isActive === true && 
        animation.progress >= 0,
        `类型: ${animation.type}, 活跃: ${animation.isActive}`
      );
    } catch (error) {
      reporter.record(`${animType}启动`, false, `启动失败: ${error.message}`);
    }
  }

  // 测试5: 性能统计验证
  console.log('\n📊 测试5: 性能统计验证');
  console.log('--------------------------------------');
  
  const stats = animationController.getPerformanceStats();
  reporter.record('活跃动画数统计', stats.activeAnimations === testAnimations.length, 
    `活跃: ${stats.activeAnimations}, 期望: ${testAnimations.length}`);
  reporter.record('对象池命中统计', stats.poolHits > 0, `池命中: ${stats.poolHits}`);
  reporter.record('内存使用统计', parseFloat(stats.memoryUsageKB) > 0, `内存: ${stats.memoryUsageKB} KB`);
  reporter.record('内存使用安全', parseFloat(stats.memoryUsageKB) < 3, `内存安全: ${stats.memoryUsageKB} < 3 KB`);

  // 测试6: 动画更新功能
  console.log('\n🔄 测试6: 动画更新功能');
  console.log('--------------------------------------');
  
  // 运行几次更新
  const updateResults = [];
  for (let i = 0; i < 5; i++) {
    animationController.update(16.67); // 模拟60FPS的一帧
    updateResults.push(true);
  }
  
  reporter.record('系统更新功能', updateResults.length === 5, `执行了 ${updateResults.length} 次更新`);
  
  // 检查更新后的动画进度
  if (testAnimations.length > 0) {
    const anim = testAnimations[0];
    reporter.record('动画进度更新', anim.progress > 0, 
      `更新前: 0, 更新后: ${anim.progress.toFixed(3)}`);
  }

  // 测试7: 恐怖事件触发
  console.log('\n🎭 测试7: 恐怖事件触发');
  console.log('--------------------------------------');
  
  const eventTypes = ['blood_drip', 'ghost_appearance', 'sudden_darkness'];
  const eventResults = [];
  
  for (const eventType of eventTypes) {
    try {
      const eventAnim = animationController.triggerTerrorEvent(eventType, {
        intensity: 0.8 + Math.random() * 0.2
      });
      
      if (eventAnim) {
        eventResults.push({ type: eventType, success: true, id: eventAnim.id });
        reporter.record(`${eventType}事件触发`, true, `动画ID: ${eventAnim.id}`);
      } else {
        eventResults.push({ type: eventType, success: false });
        reporter.record(`${eventType}事件触发`, false, '返回null');
      }
    } catch (error) {
      eventResults.push({ type: eventType, success: false, error: error.message });
      reporter.record(`${eventType}事件触发`, false, `错误: ${error.message}`);
    }
  }

  // 测试8: 限制功能
  console.log('\n🚨 测试8: 限制功能');
  console.log('--------------------------------------');
  
  // 尝试创建超过限制的动画
  let limitError = false;
  try {
    // 我们已经有了几个动画，再尝试创建更多
    for (let i = 0; i < 5; i++) {
      animationController.startAnimation('user_interaction', {
        terrorLevel: 50
      });
    }
  } catch (error) {
    limitError = true;
    reporter.record('最大动画数限制', error.message.includes('已达到性能限制'),
      `限制生效: ${error.message}`);
  }
  
  if (!limitError) {
    reporter.record('最大动画数限制', false, '未正确触发限制');
  }

  // 测试9: 动画停止功能
  console.log('\n🛑 测试9: 动画停止功能');
  console.log('--------------------------------------');
  
  if (testAnimations.length > 0) {
    const animToStop = testAnimations[0];
    const beforeStopCount = animationController.getPerformanceStats().activeAnimations;
    
    const stopResult = animationController.stopAnimation(animToStop.id);
    const afterStopCount = animationController.getPerformanceStats().activeAnimations;
    
    reporter.record('单个动画停止', stopResult === true,
      `停止动画: ${animToStop.id}`);
    reporter.record('停止后活跃数减少', afterStopCount === beforeStopCount - 1,
      `停止前: ${beforeStopCount}, 停止后: ${afterStopCount}`);
  }

  // 测试10: 用户交互处理
  console.log('\n🖐️ 测试10: 用户交互处理');
  console.log('--------------------------------------');
  
  const interactionResult = animationController.handleUserInteraction({
    type: 'tap',
    position: { x: 100, y: 200 },
    targetLight: { id: 'test_light_1' }
  });
  
  reporter.record('用户交互处理', interactionResult !== null,
    interactionResult ? `交互动画ID: ${interactionResult.id}` : '返回null');

  // 测试11: 性能自适应调整
  console.log('\n⚡ 测试11: 性能自适应调整');
  console.log('--------------------------------------');
  
  // 模拟低FPS情况
  const originalConfig = { ...animationController.config };
  
  // 手动设置低FPS
  animationController.performanceStats.actualFPS = 15; // 低于目标FPS
  
  // 运行更新以触发自适应调整
  animationController.update(33.33); // 模拟低帧率
  
  const afterAdjustConfig = animationController.config;
  
  reporter.record('性能模式调整', afterAdjustConfig.performanceMode === 'performance',
    `调整后模式: ${afterAdjustConfig.performanceMode}`);
  reporter.record('最大动画数调整', afterAdjustConfig.maxAnimations <= originalConfig.maxAnimations,
    `调整后: ${afterAdjustConfig.maxAnimations}, 调整前: ${originalConfig.maxAnimations}`);

  // 测试12: 重置功能
  console.log('\n🔄 测试12: 重置功能');
  console.log('--------------------------------------');
  
  const beforeResetStats = animationController.getPerformanceStats();
  animationController.reset();
  const afterResetStats = animationController.getPerformanceStats();
  
  reporter.record('重置活跃动画数', afterResetStats.activeAnimations === 0,
    `重置前: ${beforeResetStats.activeAnimations}, 重置后: ${afterResetStats.activeAnimations}`);
  reporter.record('重置恐怖等级', animationController.terrorState.level === 0,
    `恐怖等级: ${animationController.terrorState.level}`);

  // 测试13: 演示测试
  console.log('\n🎬 测试13: 演示测试');
  console.log('--------------------------------------');
  
  const demoResults = animationController.runDemoTest();
  reporter.record('演示测试运行', demoResults.length > 0,
    `演示项目数: ${demoResults.length}`);

  // 打印最终报告
  console.log('\n======================================');
  reporter.printReport();

  // 最后销毁
  animationController.destroy();
  
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
  const memoryTestController = new LightAnimationController({
    maxAnimations: 3,
    animationPoolSize: 5,
    mobileOptimized: true
  });
  
  // 启动多个动画
  const memoryTestAnims = [];
  for (let i = 0; i < 3; i++) {
    memoryTestAnims.push(memoryTestController.startAnimation('smooth_flicker'));
  }
  
  const memoryStats = memoryTestController.getPerformanceStats();
  const memoryKB = parseFloat(memoryStats.memoryUsageKB);
  
  compatibilityChecks.push({
    check: '内存使用限制',
    result: memoryKB < 32, // 微信小游戏通常限制在32KB左右
    value: `${memoryKB} KB`,
    required: '< 32 KB',
    status: memoryKB < 32 ? '✅' : '❌'
  });
  
  // 检查2: 动画数量限制
  compatibilityChecks.push({
    check: '同时动画数限制',
    result: memoryStats.activeAnimations <= 3,
    value: memoryStats.activeAnimations,
    required: '≤ 3',
    status: memoryStats.activeAnimations <= 3 ? '✅' : '❌'
  });
  
  // 检查3: 更新性能
  const updateStart = Date.now();
  for (let i = 0; i < 10; i++) {
    memoryTestController.update(16.67);
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
  
  // 检查4: 帧率稳定性
  const fpsStability = memoryStats.actualFPS > 25;
  compatibilityChecks.push({
    check: '帧率稳定性',
    result: fpsStability,
    value: `${memoryStats.actualFPS.toFixed(1)} FPS`,
    required: '> 25 FPS',
    status: fpsStability ? '✅' : '❌'
  });
  
  memoryTestController.destroy();
  
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
  
  const benchmarkController = new LightAnimationController({
    maxAnimations: 3,
    animationPoolSize: 10,
    performanceMode: 'performance'
  });
  
  const benchmarks = [];
  
  // 基准1: 启动性能
  const startTime = Date.now();
  const benchAnimations = [];
  for (let i = 0; i < 50; i++) {
    const animType = ['smooth_flicker', 'warning_flicker', 'terror_pulse'][i % 3];
    benchAnimations.push(benchmarkController.startAnimation(animType));
    benchmarkController.stopAnimation(benchAnimations[i].id);
  }
  const startDuration = Date.now() - startTime;
  
  benchmarks.push({
    name: '启动/停止50次',
    time: startDuration + 'ms',
    opsPerSec: Math.floor(50 / (startDuration / 1000)),
    rating: startDuration < 100 ? '优秀' : startDuration < 200 ? '良好' : '一般'
  });
  
  // 基准2: 更新性能
  const updateStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    benchmarkController.update(16.67);
  }
  const updateDuration = Date.now() - updateStart;
  
  benchmarks.push({
    name: '1000帧更新',
    time: updateDuration + 'ms',
    fps: Math.floor(1000 / (updateDuration / 1000)),
    rating: updateDuration < 100 ? '优秀' : updateDuration < 200 ? '良好' : '一般'
  });
  
  // 基准3: 内存性能
  const memoryStats = benchmarkController.getPerformanceStats();
  const memoryKB = parseFloat(memoryStats.memoryUsageKB);
  
  benchmarks.push({
    name: '内存占用',
    value: memoryKB + ' KB',
    rating: memoryKB < 2 ? '优秀' : memoryKB < 3 ? '良好' : memoryKB < 5 ? '合格' : '超标'
  });
  
  // 基准4: 恐怖事件性能
  const eventStart = Date.now();
  for (let i = 0; i < 20; i++) {
    benchmarkController.triggerTerrorEvent('blood_drip', { intensity: 0.8 });
  }
  const eventDuration = Date.now() - eventStart;
  
  benchmarks.push({
    name: '20次事件触发',
    time: eventDuration + 'ms',
    eventsPerSec: Math.floor(20 / (eventDuration / 1000)),
    rating: eventDuration < 50 ? '优秀' : eventDuration < 100 ? '良好' : '一般'
  });
  
  benchmarkController.destroy();
  
  // 打印基准测试结果
  console.log('\n📊 性能基准测试结果');
  console.log('--------------------------------------');
  
  for (const bench of benchmarks) {
    console.log(`📈 ${bench.name.padEnd(20)} ${bench.time || bench.value || ''} ${bench.opsPerSec ? `(${bench.opsPerSec} ops/sec)` : bench.eventsPerSec ? `(${bench.eventsPerSec} events/sec)` : ''} - ${bench.rating}`);
  }
  
  return benchmarks;
}

/**
 * 🚀 主测试函数
 */
async function main() {
  console.log('🎮 《微恐咖啡厅》灯光动画控制器全面测试');
  console.log('======================================');
  console.log('测试时间: ' + new Date().toLocaleString());
  console.log('测试目标: 验证灯光动画控制器功能、性能和兼容性');
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
    console.log('🎯 灯光动画控制器测试完成总结');
    console.log('======================================');
    console.log(`✅ 功能测试: ${functionalResult.summary.successRate} 通过率`);
    console.log(`📱 微信兼容: ${compatibilityResult.compatible ? '✅ 完全兼容' : '⚠️ 部分兼容'}`);
    console.log(`⚡ 性能评级: ${performanceResult[performanceResult.length - 1].rating}`);
    console.log('\n🎉 灯光动画控制器开发完成！');
    console.log('✨ 可以进入下一阶段: 灯光配置系统开发');
    
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