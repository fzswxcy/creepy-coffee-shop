#!/usr/bin/env node
// check_token_status.js - 检查当前token使用状态
// 在对话开始时和每次重要操作后运行此脚本

const fs = require('fs');
const path = require('path');

// 导入token监控系统
const tokenMonitor = require('./token_monitor.js');

// 检查状态
function checkStatus() {
  const status = tokenMonitor.getCurrentStatus();
  
  console.log(`🔍 TOKEN状态检查 - ${new Date().toLocaleString()}`);
  console.log(`📊 当前token数: ${status.currentTokens.toLocaleString()}`);
  console.log(`🎯 阈值: ${status.threshold.toLocaleString()}`);
  console.log(`📈 使用率: ${status.percentage}%`);
  
  if (status.warning) {
    console.log(`🚨 警告: 接近token限制!`);
    console.log(`🔄 建议立即整理状态并准备断点恢复`);
    
    // 如果超过90%阈值，触发警告
    if (status.percentage >= 90) {
      console.log(`⚠️ 紧急: 已达到${status.percentage}%阈值!`);
      console.log(`⚡ 准备触发自动断点恢复...`);
      
      // 压缩当前状态
      const projectStatePath = path.join(__dirname, 'project_state.md');
      let projectState = '';
      
      try {
        if (fs.existsSync(projectStatePath)) {
          projectState = fs.readFileSync(projectStatePath, 'utf8');
        }
      } catch (error) {
        console.log(`❌ 读取project_state.md失败: ${error.message}`);
      }
      
      // 添加警告信息到状态文件
      const warningMessage = `\n\n## 🚨 TOKEN限制警告
- **警告时间**: ${new Date().toISOString()}
- **当前token**: ${status.currentTokens}
- **使用率**: ${status.percentage}%
- **状态**: 接近120k token限制，建议执行/reset`;
      
      try {
        fs.appendFileSync(projectStatePath, warningMessage);
        console.log(`✅ 警告信息已添加到project_state.md`);
      } catch (error) {
        console.log(`❌ 写入警告失败: ${error.message}`);
      }
    }
  } else if (status.percentage >= 80) {
    console.log(`⚠️ 注意: 已使用${status.percentage}%，接近警告阈值`);
  } else {
    console.log(`✅ 状态正常，可继续工作`);
  }
  
  return status;
}

// 手动触发断点恢复
function triggerBreakpointManually() {
  console.log(`⚡ 手动触发断点恢复...`);
  tokenMonitor.triggerBreakpoint();
  return { action: 'breakpoint_triggered', timestamp: new Date().toISOString() };
}

// 重置计数器（用于新会话开始）
function resetForNewSession() {
  console.log(`🔄 为新会话重置token计数器...`);
  tokenMonitor.resetCounters();
  return { action: 'counters_reset', timestamp: new Date().toISOString() };
}

// 添加当前对话到监控
function addCurrentConversation(userMessage = '', aiResponse = '') {
  console.log(`📝 添加对话到token监控...`);
  
  const results = {};
  
  if (userMessage && userMessage.trim().length > 0) {
    results.user = tokenMonitor.addMessage(userMessage, 'user');
  }
  
  if (aiResponse && aiResponse.trim().length > 0) {
    results.ai = tokenMonitor.addMessage(aiResponse, 'ai');
  }
  
  return results;
}

// 如果直接运行则检查状态
if (require.main === module) {
  console.log(`\n🔄 ${new Date().toLocaleString()} - 启动token状态检查`);
  const status = checkStatus();
  
  // 添加命令行参数支持
  const args = process.argv.slice(2);
  
  if (args.includes('--reset')) {
    resetForNewSession();
  }
  
  if (args.includes('--breakpoint')) {
    triggerBreakpointManually();
  }
  
  if (args.includes('--add-test')) {
    addCurrentConversation(
      '这是一个测试用户消息，用于验证token监控系统的工作状态。',
      '好的，我已经理解了你的要求。这是一个测试AI回复，验证系统能否正确计算token使用情况。'
    );
    checkStatus();
  }
}

module.exports = {
  checkStatus,
  triggerBreakpointManually,
  resetForNewSession,
  addCurrentConversation
};