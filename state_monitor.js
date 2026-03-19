// state_monitor.js - NIKO智能上下文监控系统
// 功能：实时监控对话token使用，接近120k阈值时自动执行断点恢复

/**
 * 上下文监控系统
 * 
 * 主要职责：
 * 1. 估算当前对话的token使用量
 * 2. 监控是否接近120,000 tokens限制
 * 3. 达到阈值时自动整理状态并触发/reset
 * 4. 无缝恢复工作流
 */

class StateMonitor {
  constructor() {
    this.tokenThreshold = 120000; // 总限制
    this.warningThreshold = 115000; // 警告阈值
    this.estimatedTokenCount = 0;
    this.stateFilePath = '/root/.openclaw/workspace/project_state.md';
  }

  /**
   * 估算文本的token数量
   * OpenAI标准：1 token ≈ 4个英文字符，1个中文字符 ≈ 2-3 tokens
   * 这里使用保守估算：1个字符 ≈ 0.5 token
   */
  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length * 0.5);
  }

  /**
   * 更新当前会话的token计数
   */
  updateTokenCount(userMessage, assistantResponse) {
    const userTokens = this.estimateTokens(userMessage);
    const assistantTokens = this.estimateTokens(assistantResponse);
    this.estimatedTokenCount += userTokens + assistantTokens;
    
    console.log(`Token更新: +${userTokens + assistantTokens} tokens`);
    console.log(`当前估算总量: ${this.estimatedTokenCount}/${this.tokenThreshold}`);
    
    return this.checkThreshold();
  }

  /**
   * 检查是否达到阈值
   */
  checkThreshold() {
    if (this.estimatedTokenCount >= this.tokenThreshold) {
      console.log('⚠️ 达到token限制，即将触发断点恢复');
      return 'limit_reached';
    } else if (this.estimatedTokenCount >= this.warningThreshold) {
      console.log('⚠️ 接近token限制，准备断点恢复');
      return 'warning';
    }
    return 'safe';
  }

  /**
   * 整理和压缩项目状态
   */
  async compressState(currentState) {
    const now = new Date().toISOString();
    
    // 压缩策略：只保留关键信息
    const compressedState = {
      timestamp: now,
      lastActivity: currentState.lastActivity || '状态压缩',
      criticalDecisions: currentState.criticalDecisions || [],
      activeProjects: currentState.activeProjects || [],
      nextSteps: currentState.nextSteps || [],
      // 移除历史对话记录以减少token
      compressed: true,
      compressionDate: now
    };

    return compressedState;
  }

  /**
   * 执行断点恢复流程
   */
  async executeBreakpointRecovery(currentContext) {
    console.log('🚀 开始断点恢复流程...');
    
    // 1. 压缩当前状态
    const compressedState = await this.compressState(currentContext);
    
    // 2. 保存到状态文件
    const fs = require('fs');
    const stateContent = `# 智能断点 - ${new Date().toISOString()}

## 🔄 断点恢复信息
**触发原因**: 达到token使用阈值 (${this.estimatedTokenCount}/${this.tokenThreshold})
**恢复时间**: ${new Date().toISOString()}
**压缩状态**: 已优化以减少token占用

## 📋 保存的关键信息
${JSON.stringify(compressedState, null, 2)}

## 🎯 恢复后继续任务
1. 读取此文件恢复上下文
2. 继续之前的工作流
3. 重新开始监控token使用

---
*此断点由NIKO智能监控系统自动创建*`;
    
    fs.writeFileSync(this.stateFilePath, stateContent);
    console.log('✅ 状态已保存到 project_state.md');
    
    // 3. 提示执行 /reset 命令
    console.log('🔄 请执行 /reset 命令继续工作');
    
    return {
      success: true,
      message: '断点准备完成，请执行 /reset 继续',
      compressedSize: stateContent.length
    };
  }

  /**
   * 从状态文件恢复工作
   */
  async recoverFromBreakpoint() {
    const fs = require('fs');
    
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const stateContent = fs.readFileSync(this.stateFilePath, 'utf8');
        console.log('✅ 从断点恢复工作状态');
        this.estimatedTokenCount = 0; // 重置计数
        
        return {
          recovered: true,
          content: stateContent,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          recovered: false,
          message: '无断点状态文件，开始新会话'
        };
      }
    } catch (error) {
      return {
        recovered: false,
        error: error.message,
        message: '恢复失败，开始新会话'
      };
    }
  }
}

// 导出单例实例
const stateMonitor = new StateMonitor();

// 测试示例
if (require.main === module) {
  console.log('🧪 测试状态监控系统...');
  
  // 模拟对话
  const testUserMsg = '这是一个测试消息，用于验证token估算功能';
  const testAssistantMsg = '我理解你的测试请求，正在处理中...';
  
  const result = stateMonitor.updateTokenCount(testUserMsg, testAssistantMsg);
  console.log(`测试结果: ${result}`);
  
  // 测试恢复功能
  stateMonitor.recoverFromBreakpoint().then(console.log);
}

module.exports = stateMonitor;