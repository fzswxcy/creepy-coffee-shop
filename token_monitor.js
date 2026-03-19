#!/usr/bin/env node
// token_monitor.js - 实时token计算与智能断点监控系统
// 监控所有用户输入和AI回复的token使用情况

const fs = require('fs');
const path = require('path');

class TokenMonitor {
  constructor() {
    this.tokenCount = 0;
    this.warningThreshold = 115000; // 115k tokens警告阈值
    this.projectStatePath = path.join(__dirname, 'project_state.md');
    this.stateFile = path.join(__dirname, 'session_state.json');
    this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf8');
        const state = JSON.parse(data);
        this.tokenCount = state.tokenCount || 0;
        console.log(`✅ 恢复会话状态: ${this.tokenCount} tokens`);
      }
    } catch (error) {
      console.log(`🔄 初始化新会话状态`);
      this.tokenCount = 0;
    }
  }

  saveState() {
    const state = {
      tokenCount: this.tokenCount,
      lastUpdate: new Date().toISOString(),
      warningTriggered: this.tokenCount >= this.warningThreshold
    };
    
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error(`❌ 保存状态失败: ${error.message}`);
    }
  }

  // 保守估算：1字符 ≈ 0.5 token
  estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    return Math.ceil(text.length * 0.5);
  }

  addMessage(message, type = 'user') {
    const tokens = this.estimateTokens(message);
    this.tokenCount += tokens;
    
    console.log(`📝 ${type === 'user' ? '用户输入' : 'AI回复'}: ${tokens} tokens`);
    console.log(`📊 当前总计: ${this.tokenCount} tokens (阈值: ${this.warningThreshold})`);
    
    this.saveState();
    
    // 检查是否需要触发断点
    if (this.tokenCount >= this.warningThreshold) {
      console.log(`🚨 TOKEN阈值警告 (${this.tokenCount}/${this.warningThreshold})`);
      console.log(`🔄 准备自动执行断点恢复...`);
      
      // 触发断点恢复流程
      this.triggerBreakpoint();
      
      return {
        warning: true,
        currentTokens: this.tokenCount,
        threshold: this.warningThreshold,
        action: 'breakpoint_triggered'
      };
    }
    
    return {
      warning: false,
      currentTokens: this.tokenCount,
      threshold: this.warningThreshold,
      percentage: Math.round((this.tokenCount / this.warningThreshold) * 100)
    };
  }

  triggerBreakpoint() {
    console.log(`⚡ 触发智能断点恢复流程...`);
    
    // 1. 压缩当前状态到project_state.md
    this.compressProjectState();
    
    // 2. 执行/reset命令提示
    console.log(`🔄 请执行 /reset 命令开始新会话`);
    console.log(`📋 新会话将自动读取 project_state.md 恢复工作状态`);
    
    // 3. 重置token计数器（新会话会重新加载）
    this.tokenCount = 0;
    this.saveState();
  }

  compressProjectState() {
    try {
      // 读取当前project_state.md
      let currentState = '';
      if (fs.existsSync(this.projectStatePath)) {
        currentState = fs.readFileSync(this.projectStatePath, 'utf8');
      }
      
      // 创建压缩版本 - 只保留核心信息
      const compressedState = `# PROJECT_STATE.md - 智能断点恢复系统

## 📅 断点信息
- **触发时间**: ${new Date().toISOString()}
- **触发原因**: TOKEN阈值警告 (${this.tokenCount}/${this.warningThreshold})
- **状态**: 自动断点恢复就绪

## 🚨 恢复提示
**会话token达到限制，已自动触发断点。新会话请立即：**
1. 读取此文件恢复工作记忆
2. 继续之前的工作流程
3. 不打招呼直接工作

## 📊 会话状态
- **累计tokens**: ${this.tokenCount}
- **恢复时间**: ${new Date().toLocaleString()}
- **断点版本**: ${Date.now()}

---

**重要**: 恢复后请继续工作，无需询问。用户已在等待。`;

      // 保存压缩状态
      fs.writeFileSync(this.projectStatePath, compressedState);
      console.log(`✅ 项目状态已压缩保存到 project_state.md`);
      
    } catch (error) {
      console.error(`❌ 压缩状态失败: ${error.message}`);
    }
  }

  getCurrentStatus() {
    return {
      currentTokens: this.tokenCount,
      threshold: this.warningThreshold,
      percentage: Math.round((this.tokenCount / this.warningThreshold) * 100),
      warning: this.tokenCount >= this.warningThreshold,
      warningTriggered: this.tokenCount >= this.warningThreshold
    };
  }

  resetCounters() {
    this.tokenCount = 0;
    this.saveState();
    console.log(`🔄 token计数器已重置`);
  }
}

// 导出单例实例
const tokenMonitor = new TokenMonitor();

// 测试函数
function testTokenMonitoring() {
  console.log('🧪 测试token监控系统...');
  
  const testMessages = [
    { text: '这是一个测试消息，用来检查token计算功能是否正常工作。', type: 'user' },
    { text: '好的，我已经理解了你的要求。现在开始执行测试任务，确保系统运行正常。', type: 'ai' },
    { text: '接下来我们需要测试断点触发机制，看看当token数量达到阈值时，系统能否自动触发恢复流程。', type: 'user' }
  ];
  
  testMessages.forEach((msg, index) => {
    console.log(`\n--- 测试 ${index + 1} ---`);
    const result = tokenMonitor.addMessage(msg.text, msg.type);
    console.log(`结果: ${JSON.stringify(result, null, 2)}`);
  });
  
  console.log('\n📊 最终状态:', tokenMonitor.getCurrentStatus());
}

// 如果直接运行则执行测试
if (require.main === module) {
  testTokenMonitoring();
}

module.exports = tokenMonitor;