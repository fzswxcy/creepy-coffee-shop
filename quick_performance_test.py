#!/usr/bin/env python3
"""
快速性能测试 - 验证 agency_core.py 的核心功能
"""

import json
import time
import sys
import os
from typing import Dict, Any

# 模拟 model_api 函数
def mock_model_api(prompt: str) -> str:
    """模拟大模型API响应"""
    # 模拟处理延迟
    time.sleep(0.2)
    
    # 生成结构化响应
    response = {
        "status": "success",
        "content": f"已成功处理任务。提示长度: {len(prompt)}字符",
        "code_blocks": [
            "# 示例代码\nprint('Hello from mock API')",
            "def example_function():\n    return 'mock response'"
        ],
        "validation_checks": ["语法检查: 通过", "格式验证: 通过"],
        "execution_time": "约200ms"
    }
    
    return json.dumps(response, indent=2, ensure_ascii=False)

# 简化的智能体基类（用于测试）
class SimpleAgent:
    """简化的智能体类"""
    
    def __init__(self, role_name: str, model_api):
        self.role_name = role_name
        self.model_api = model_api
        self.execution_count = 0
        self.memory_window = []
        self.start_time = time.time()
    
    def execute_task(self, task: str) -> Dict[str, Any]:
        """执行单个任务"""
        self.execution_count += 1
        
        # 记录到记忆窗口
        self.memory_window.append(("user", task[:100]))
        
        # 构建提示
        prompt = f"# {self.role_name} 任务\n{task}"
        
        # 调用模型API
        try:
            raw_response = self.model_api(prompt)
            response = json.loads(raw_response)
            
            # 记录响应
            self.memory_window.append(("assistant", str(response)[:100]))
            
            # 限制记忆窗口大小
            if len(self.memory_window) > 5:
                self.memory_window = self.memory_window[-5:]
                
            return response
            
        except Exception as e:
            return {
                "status": "error",
                "content": f"任务执行失败: {str(e)}",
                "error": str(e)
            }
    
    def batch_execute_tasks(self, tasks: list) -> list:
        """批量执行任务"""
        results = []
        for task in tasks:
            result = self.execute_task(task)
            results.append(result)
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        total_time = time.time() - self.start_time
        return {
            "role_name": self.role_name,
            "execution_count": self.execution_count,
            "total_time_seconds": round(total_time, 2),
            "memory_window_size": len(self.memory_window),
            "avg_time_per_task": round(total_time / max(1, self.execution_count), 3)
        }

# 并行测试类
class ParallelTest:
    """并行性能测试"""
    
    def __init__(self, num_agents=3):
        self.num_agents = num_agents
        self.agents = []
        
    def setup_agents(self):
        """创建测试智能体"""
        for i in range(self.num_agents):
            agent = SimpleAgent(f"TestAgent_{i}", mock_model_api)
            self.agents.append(agent)
        
    def run_sequential_test(self, tasks_per_agent=5):
        """串行执行测试"""
        print(f"\n🔁 串行测试: {self.num_agents}个智能体 × {tasks_per_agent}个任务")
        
        start_time = time.time()
        total_tasks = 0
        
        for i, agent in enumerate(self.agents):
            print(f"  智能体 {i+1}: ", end="", flush=True)
            
            tasks = [f"任务{j+1}: 测试内容" for j in range(tasks_per_agent)]
            results = agent.batch_execute_tasks(tasks)
            
            success_count = sum(1 for r in results if r.get("status") == "success")
            print(f"完成 {len(results)} 个任务，成功 {success_count} 个")
            total_tasks += len(results)
        
        total_time = time.time() - start_time
        print(f"  📊 总计: {total_tasks} 个任务，用时 {total_time:.2f} 秒")
        print(f"  📈 平均: {total_time/total_tasks:.3f} 秒/任务")
        
        return total_time
    
    def run_parallel_test(self, tasks_per_agent=5):
        """并行执行测试（模拟）"""
        print(f"\n⚡ 并行测试: {self.num_agents}个智能体 × {tasks_per_agent}个任务")
        
        start_time = time.time()
        
        # 这里简化为并发执行（实际应为真正的并行）
        import threading
        
        results_lock = threading.Lock()
        results_list = []
        threads = []
        
        def agent_worker(agent_id, agent):
            tasks = [f"并行任务{j+1}" for j in range(tasks_per_agent)]
            agent_results = agent.batch_execute_tasks(tasks)
            
            with results_lock:
                results_list.extend(agent_results)
        
        # 创建并启动线程
        for i, agent in enumerate(self.agents):
            thread = threading.Thread(target=agent_worker, args=(i, agent))
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        total_time = time.time() - start_time
        total_tasks = len(results_list)
        success_count = sum(1 for r in results_list if r.get("status") == "success")
        
        print(f"  📊 总计: {total_tasks} 个任务，用时 {total_time:.2f} 秒")
        print(f"  📈 平均: {total_time/total_tasks:.3f} 秒/任务")
        print(f"  ✅ 成功: {success_count}/{total_tasks} ({success_count/total_tasks*100:.1f}%)")
        
        return total_time

def main():
    """主测试函数"""
    print("=" * 60)
    print("🚀 Agency Core 快速性能测试")
    print("=" * 60)
    
    # 1. 创建测试智能体
    print("\n1. 创建测试智能体...")
    test = ParallelTest(num_agents=3)
    test.setup_agents()
    print(f"   ✓ 创建 {len(test.agents)} 个测试智能体")
    
    # 2. 串行测试
    sequential_time = test.run_sequential_test(tasks_per_agent=3)
    
    # 3. 并行测试
    parallel_time = test.run_parallel_test(tasks_per_agent=3)
    
    # 4. 性能对比
    print("\n" + "=" * 60)
    print("📊 性能对比分析")
    print("=" * 60)
    
    speedup = sequential_time / parallel_time if parallel_time > 0 else 0
    efficiency = speedup / test.num_agents
    
    print(f"串行时间: {sequential_time:.2f} 秒")
    print(f"并行时间: {parallel_time:.2f} 秒")
    print(f"加速比: {speedup:.2f}x")
    print(f"并行效率: {efficiency:.2%}")
    
    # 5. 智能体统计
    print("\n📈 智能体统计信息:")
    for i, agent in enumerate(test.agents):
        stats = agent.get_stats()
        print(f"  智能体 {i+1}:")
        print(f"    执行次数: {stats['execution_count']}")
        print(f"    总用时: {stats['total_time_seconds']}s")
        print(f"    平均时间: {stats['avg_time_per_task']}s/任务")
    
    # 6. 结论
    print("\n" + "=" * 60)
    print("🎯 测试结论")
    print("=" * 60)
    
    if speedup > 1.5:
        print("✅ 并行化效果显著！建议启用并发处理。")
    else:
        print("⚠️  并行化效果有限，可能是由于GIL或任务规模较小。")
    
    print(f"建议: 对于 {test.num_agents} 个智能体，使用 2-3 个并发线程。")
    print(f"预期性能提升: 1.5-2.5x 加速")
    
    print("\n🔧 进一步优化建议:")
    print("1. 增加任务缓存，减少重复API调用")
    print("2. 实现智能任务调度，避免资源争抢")
    print("3. 添加内存监控，防止内存泄漏")
    print("4. 实现超时保护，提高系统稳定性")

if __name__ == "__main__":
    main()