#!/usr/bin/env python3
"""
Log Bridge - ChatDev 兼容的日志桥接器
用于将工作室的工作状态写入 ChatDev Visualizer
"""

import os
import json
import sys
from datetime import datetime
from pathlib import Path

# Visualizer 日志目录 (指向 ChatDev/online_log/static/logs)
LOG_DIR = os.path.expanduser("~/ChatDev/online_log/static/logs")
os.makedirs(LOG_DIR, exist_ok=True)

class ChatDevLogger:
    """ChatDev 风格的日志记录器"""
    
    def __init__(self, task_name="renovation"):
        self.task_name = task_name
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = os.path.join(LOG_DIR, f"{task_name}_{self.session_id}.json")
        self.messages = []
        
    def log_message(self, agent, role, content, phase="development"):
        """记录一条消息"""
        message = {
            "timestamp": datetime.now().isoformat(),
            "agent": agent,
            "role": role,
            "phase": phase,
            "content": content,
            "type": "chat"
        }
        self.messages.append(message)
        self._save()
        return message
    
    def log_action(self, agent, action, details, status="completed"):
        """记录一个动作"""
        message = {
            "timestamp": datetime.now().isoformat(),
            "agent": agent,
            "action": action,
            "details": details,
            "status": status,
            "type": "action"
        }
        self.messages.append(message)
        self._save()
        return message
    
    def log_code(self, agent, filename, code_summary, language="typescript"):
        """记录代码编写"""
        message = {
            "timestamp": datetime.now().isoformat(),
            "agent": agent,
            "type": "code",
            "filename": filename,
            "language": language,
            "summary": code_summary[:200] + "..." if len(code_summary) > 200 else code_summary
        }
        self.messages.append(message)
        self._save()
        return message
    
    def _save(self):
        """保存日志到文件"""
        log_data = {
            "task": self.task_name,
            "session_id": self.session_id,
            "start_time": self.messages[0]["timestamp"] if self.messages else datetime.now().isoformat(),
            "last_update": datetime.now().isoformat(),
            "message_count": len(self.messages),
            "messages": self.messages
        }
        
        with open(self.log_file, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
    
    def get_log_path(self):
        return self.log_file


# 全局日志实例
_logger = None

def get_logger(task_name="renovation"):
    """获取或创建日志记录器"""
    global _logger
    if _logger is None:
        _logger = ChatDevLogger(task_name)
    return _logger

def log_ai_turn(model_name, prompt_tokens, completion_tokens, action="code_generation"):
    """记录 AI 对话轮次 (兼容 Kimi API)"""
    logger = get_logger()
    
    # 记录 AI 代理活动
    agent_name = "Kimi"
    role = "Programmer"
    
    if "claude" in model_name.lower():
        agent_name = "Claude"
        role = "Architect"
    elif "gpt" in model_name.lower():
        agent_name = "GPT"
        role = "Developer"
    
    content = f"[{action}] 使用 {model_name} | Tokens: {prompt_tokens} → {completion_tokens}"
    
    return logger.log_message(agent_name, role, content, phase="implementation")

def log_code_change(filename, change_type="modify", lines_changed=0):
    """记录代码变更"""
    logger = get_logger()
    return logger.log_action(
        agent="CodeManager",
        action=f"{change_type.upper()}_FILE",
        details=f"{filename} ({lines_changed} lines)",
        status="committed"
    )

def log_system_event(event_type, message):
    """记录系统事件"""
    logger = get_logger()
    return logger.log_action(
        agent="System",
        action=event_type,
        details=message,
        status="info"
    )

# 测试代码
if __name__ == "__main__":
    print("Testing ChatDev Log Bridge...")
    
    # 模拟一些日志记录
    logger = get_logger("test_session")
    
    logger.log_message("CEO", "Project Manager", "开始新项目：微恐咖啡厅游戏开发", "planning")
    logger.log_message("CTO", "Technical Lead", "确定技术栈：Cocos Creator + TypeScript", "design")
    logger.log_code("Programmer", "GameScene.ts", "实现游戏主场景逻辑，包含角色移动和交互系统")
    logger.log_action("CodeManager", "COMMIT", "GameScene.ts (45 lines)", "completed")
    logger.log_message("Tester", "QA Engineer", "测试完成，未发现阻塞性问题", "testing")
    
    print(f"✓ 日志已保存到: {logger.get_log_path()}")
    print(f"✓ 共记录 {len(logger.messages)} 条消息")
