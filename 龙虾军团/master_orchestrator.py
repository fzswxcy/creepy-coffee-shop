#!/usr/bin/env python3
# 🦞 主控中枢 - 层级统治架构 v1.0
# 绝对控制权实现：Master → Workers，唯一物理通信总线

import os
import json
import time
import hashlib
from datetime import datetime
from typing import Dict, List, Any
import threading
import queue

class RulingArchitecture:
    """层级统治架构：Master拥有绝对控制权"""
    
    def __init__(self, work_dir: str):
        self.work_dir = work_dir
        self.tasks_file = os.path.join(work_dir, "tasks.json")
        self.commands_queue = queue.Queue()
        self.workers = {}  # 工人ID -> 工人状态
        self.task_counter = 0
        
        # 初始化物理通信总线
        self._init_tasks_bus()
        print(f"🦞 主控中枢启动 - 绝对控制权激活")
    
    def _init_tasks_bus(self):
        """初始化物理通信总线"""
        if not os.path.exists(self.tasks_file):
            initial_state = {
                "version": "1.0",
                "created_at": datetime.now().isoformat(),
                "master_control": True,
                "workers": {},
                "pending_tasks": [],
                "completed_tasks": [],
                "failed_tasks": [],
                "command_history": []
            }
            with open(self.tasks_file, 'w', encoding='utf-8') as f:
                json.dump(initial_state, f, ensure_ascii=False, indent=2)
    
    def add_worker(self, worker_id: str, worker_type: str, capabilities: List[str]):
        """注册工人（绝对控制权）"""
        worker_data = {
            "id": worker_id,
            "type": worker_type,
            "capabilities": capabilities,
            "status": "IDLE",
            "current_task": None,
            "performance_score": 0,
            "created_at": datetime.now().isoformat(),
            "last_command": None,
            "total_tasks_completed": 0,
            "total_errors": 0
        }
        
        # 加载当前状态
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        state["workers"][worker_id] = worker_data
        self.workers[worker_id] = worker_data
        
        # 写入物理总线
        with open(self.tasks_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        
        print(f"📝 工人 {worker_id} 已注册 - 类型: {worker_type}")
    
    def issue_command(self, worker_id: str, command_type: str, payload: Dict):
        """发布命令（不可协商）"""
        command_id = hashlib.md5(f"{worker_id}_{datetime.now().isoformat()}".encode()).hexdigest()[:8]
        
        command = {
            "id": command_id,
            "worker_id": worker_id,
            "type": command_type,  # EXECUTE, STOP, PAUSE, RESTART, EVALUATE
            "payload": payload,
            "issued_at": datetime.now().isoformat(),
            "status": "PENDING",
            "response": None,
            "execution_time": None,
            "result": None
        }
        
        # 物理写入命令总线
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        state["command_history"].append(command)
        
        # 更新工人状态
        state["workers"][worker_id]["status"] = "BUSY"
        state["workers"][worker_id]["last_command"] = command_id
        
        with open(self.tasks_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        
        # 放入命令队列
        self.commands_queue.put((worker_id, command))
        print(f"🎯 命令发布: {command_id} → {worker_id} ({command_type})")
        
        return command_id
    
    def create_task(self, name: str, description: str, requirements: List[str], 
                    assigned_worker: str, priority: int = 1):
        """创建任务（绝对分配）"""
        task_id = self.task_counter + 1
        self.task_counter += 1
        
        task = {
            "id": task_id,
            "name": name,
            "description": description,
            "requirements": requirements,
            "assigned_worker": assigned_worker,
            "status": "PENDING",
            "priority": priority,
            "created_at": datetime.now().isoformat(),
            "deadline": None,
            "result": None,
            "score": None
        }
        
        # 物理写入
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        state["pending_tasks"].append(task)
        
        with open(self.tasks_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        
        print(f"📋 任务创建: #{task_id} '{name}' → {assigned_worker}")
        
        return task_id
    
    def force_task_execution(self, task_id: int, worker_id: str):
        """强制任务执行（绝对控制）"""
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        # 找到任务
        task = None
        for t in state["pending_tasks"]:
            if t["id"] == task_id:
                task = t
                break
        
        if not task:
            print(f"❌ 任务 #{task_id} 不存在")
            return False
        
        # 强制重新分配
        task["assigned_worker"] = worker_id
        task["status"] = "FORCED_ASSIGNED"
        
        # 更新物理总线
        with open(self.tasks_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        
        print(f"⚡ 强制分配: 任务#{task_id} → {worker_id} (绝对控制)")
        return True
    
    def get_worker_performance(self, worker_id: str):
        """获取工人性能数据（监控权）"""
        if worker_id not in self.workers:
            return None
        
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        worker = state["workers"].get(worker_id, {})
        
        # 计算性能指标
        completed_tasks = [t for t in state.get("completed_tasks", []) 
                          if t.get("assigned_worker") == worker_id]
        
        failed_tasks = [t for t in state.get("failed_tasks", []) 
                       if t.get("assigned_worker") == worker_id]
        
        avg_score = 0
        if completed_tasks:
            scores = [t.get("score", 0) for t in completed_tasks if t.get("score")]
            avg_score = sum(scores) / len(scores) if scores else 0
        
        performance = {
            "worker_id": worker_id,
            "status": worker.get("status", "UNKNOWN"),
            "total_tasks": len(completed_tasks) + len(failed_tasks),
            "success_rate": len(completed_tasks) / max(1, len(completed_tasks) + len(failed_tasks)) * 100,
            "average_score": round(avg_score, 2),
            "current_task": worker.get("current_task"),
            "last_command": worker.get("last_command"),
            "errors": worker.get("total_errors", 0)
        }
        
        return performance
    
    def terminate_worker(self, worker_id: str, reason: str = "性能不足"):
        """终止工人（绝对权力）"""
        if worker_id not in self.workers:
            print(f"⚠️ 工人 {worker_id} 不存在")
            return False
        
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        # 标记为终止
        state["workers"][worker_id]["status"] = "TERMINATED"
        state["workers"][worker_id]["terminated_at"] = datetime.now().isoformat()
        state["workers"][worker_id]["termination_reason"] = reason
        
        # 重新分配其任务
        pending_tasks = [t for t in state["pending_tasks"] 
                        if t.get("assigned_worker") == worker_id]
        
        for task in pending_tasks:
            task["status"] = "REASSIGNING"
        
        with open(self.tasks_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
        
        del self.workers[worker_id]
        print(f"🛑 工人终止: {worker_id} - 理由: {reason}")
        return True
    
    def start_monitoring_loop(self, interval_seconds: int = 30):
        """启动监控循环（绝对监督）"""
        def monitoring_loop():
            while True:
                try:
                    self._perform_health_check()
                    self._enforce_discipline()
                    self._generate_performance_report()
                except Exception as e:
                    print(f"⚠️ 监控循环错误: {e}")
                
                time.sleep(interval_seconds)
        
        monitor_thread = threading.Thread(target=monitoring_loop, daemon=True)
        monitor_thread.start()
        print(f"📊 绝对监督系统启动 (间隔: {interval_seconds}秒)")
    
    def _perform_health_check(self):
        """执行健康检查（绝对诊断）"""
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        unhealthy_workers = []
        for worker_id, worker_data in state["workers"].items():
            if worker_data.get("status") == "BUSY":
                # 检查是否超时
                last_command_time = None
                for cmd in reversed(state.get("command_history", [])):
                    if cmd.get("worker_id") == worker_id:
                        last_command_time = datetime.fromisoformat(cmd.get("issued_at"))
                        break
                
                if last_command_time:
                    time_diff = (datetime.now() - last_command_time).total_seconds()
                    if time_diff > 300:  # 5分钟无响应
                        unhealthy_workers.append(worker_id)
                        print(f"⏰ 工人 {worker_id} 超时: {time_diff:.0f}秒无响应")
        
        return unhealthy_workers
    
    def _enforce_discipline(self):
        """执行纪律（绝对惩罚）"""
        with open(self.tasks_file, 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        for worker_id, worker_data in state["workers"].items():
            # 检查错误率
            total_tasks = worker_data.get("total_tasks_completed", 0)
            errors = worker_data.get("total_errors", 0)
            
            if total_tasks > 10 and errors / total_tasks > 0.3:  # 错误率超过30%
                print(f"⚠️ 纪律检查: 工人 {worker_id} 错误率过高 ({errors}/{total_tasks})")
                # 自动降级处理
                self.issue_command(worker_id, "RESTART", {
                    "reason": "错误率过高",
                    "action": "降级重启",
                    "strict_mode": True
                })

class MasterOrchestrator:
    """主控中枢 - 统一入口"""
    
    def __init__(self):
        self.work_dir = "/root/.openclaw/workspace/龙虾军团"
        self.arch = RulingArchitecture(self.work_dir)
        self.running = True
        
        # 立即启动监控
        self.arch.start_monitoring_loop()
    
    def run(self):
        """主控运行循环"""
        print("=" * 60)
        print("🦞 主控中枢 - 层级统治架构 v1.0")
        print("=" * 60)
        print("📂 物理通信总线: tasks.json")
        print("🎯 控制模式: 绝对层级控制")
        print("⚖️ 监督频率: 每30秒一次")
        print("=" * 60)
        
        try:
            while self.running:
                # 处理命令队列
                if not self.arch.commands_queue.empty():
                    worker_id, command = self.arch.commands_queue.get()
                    self._process_command(worker_id, command)
                
                # 生成状态报告
                if datetime.now().second % 30 == 0:
                    self._generate_status_report()
                
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n🛑 主控中枢停止")
        except Exception as e:
            print(f"❌ 主控错误: {e}")
    
    def _process_command(self, worker_id: str, command: Dict):
        """处理命令（绝对执行）"""
        print(f"🔄 处理命令: {command['id']} → {worker_id}")
        
        # 模拟命令处理
        command["status"] = "PROCESSING"
        
        # 更新物理总线
        with open(os.path.join(self.work_dir, "tasks.json"), 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        # 更新命令状态
        for cmd in state["command_history"]:
            if cmd["id"] == command["id"]:
                cmd.update(command)
                break
        
        with open(os.path.join(self.work_dir, "tasks.json"), 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
    
    def _generate_status_report(self):
        """生成状态报告（绝对知情权）"""
        with open(os.path.join(self.work_dir, "tasks.json"), 'r', encoding='utf-8') as f:
            state = json.load(f)
        
        active_workers = [w for w in state["workers"].values() 
                         if w.get("status") not in ["TERMINATED", "FAILED"]]
        
        pending_tasks = len(state.get("pending_tasks", []))
        completed_tasks = len(state.get("completed_tasks", []))
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "active_workers": len(active_workers),
            "pending_tasks": pending_tasks,
            "completed_tasks": completed_tasks,
            "total_commands": len(state.get("command_history", [])),
            "system_health": "OK" if active_workers else "DEGRADED"
        }
        
        # 写入报告文件
        report_file = os.path.join(self.work_dir, f"status_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"📈 状态报告生成: {report_file}")

def main():
    """主函数 - 启动主控中枢"""
    orchestrator = MasterOrchestrator()
    
    # 立即注册现有工人
    orchestrator.arch.add_worker("GameDevLobster-001", "游戏开发", 
                                ["TypeScript", "Cocos Creator", "微信API"])
    
    # 创建示例任务
    orchestrator.arch.create_task(
        name="完成微恐咖啡厅核心系统",
        description="实现GameManager和事件系统",
        requirements=["TypeScript", "设计模式", "性能优化"],
        assigned_worker="GameDevLobster-001",
        priority=1
    )
    
    # 启动主控循环
    orchestrator.run()

if __name__ == "__main__":
    main()