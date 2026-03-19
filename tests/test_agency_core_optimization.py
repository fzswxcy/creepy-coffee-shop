"""
自动化测试框架 - agency_core.py 性能优化版本

测试覆盖范围：
1. 基本功能测试
2. 性能优化功能测试
3. 并发处理测试
4. 内存管理测试
5. 错误处理测试
6. 插件架构测试
"""

import pytest
import json
import time
import threading
import psutil
import gc
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# 导入被测试的模块
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 测试配置文件
TEST_CONFIG = {
    "memory_window_size": 3,
    "enable_caching": True,
    "max_concurrent_tasks": 2,
    "cache_size_mb": 10,
    "cache_ttl_seconds": 60
}


# ==================== 测试工具类 ====================
class TestUtils:
    """测试工具类"""
    
    @staticmethod
    def create_mock_model_api(response_data=None):
        """创建模拟的模型API"""
        def mock_model_api(prompt):
            time.sleep(0.01)  # 模拟API延迟
            if response_data:
                return json.dumps(response_data)
            
            # 默认响应
            return json.dumps({
                "status": "success",
                "content": f"测试响应: {prompt[:50]}...",
                "code_blocks": ["print('Hello, World!')"],
                "validation_checks": ["格式检查: 通过", "内容检查: 通过"],
                "execution_time": "0.5秒"
            })
        
        return mock_model_api
    
    @staticmethod
    def assert_dict_structure(data, required_fields, optional_fields=None):
        """断言字典结构"""
        assert isinstance(data, dict)
        
        # 检查必需字段
        for field in required_fields:
            assert field in data, f"缺少必需字段: {field}"
            assert data[field] is not None, f"字段 {field} 不能为None"
        
        # 检查可选字段
        if optional_fields:
            for field in optional_fields:
                if field in data:
                    assert data[field] is not None, f"字段 {field} 不能为None"
    
    @staticmethod
    def measure_performance(func, *args, **kwargs):
        """测量函数性能"""
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss
        
        result = func(*args, **kwargs)
        
        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss
        
        return {
            "execution_time": end_time - start_time,
            "memory_used": end_memory - start_memory,
            "result": result
        }
    
    @staticmethod
    def create_test_agent(role_name="TestAgent", enable_caching=True):
        """创建测试用智能体"""
        from agency_core import BaseAgent
        
        # 创建临时角色提示文件
        prompt_file = f"/tmp/{role_name}_test_prompt.md"
        with open(prompt_file, "w", encoding="utf-8") as f:
            f.write(f"# {role_name} 测试角色\n这是一个测试角色。")
        
        # 创建模拟API
        mock_api = TestUtils.create_mock_model_api()
        
        # 创建智能体
        agent = BaseAgent(
            role_name=role_name,
            role_prompt_path=prompt_file,
            model_api=mock_api,
            memory_window_size=TEST_CONFIG["memory_window_size"],
            enable_caching=enable_caching,
            max_concurrent_tasks=TEST_CONFIG["max_concurrent_tasks"]
        )
        
        return agent


# ==================== 基础功能测试 ====================
class TestBasicFunctionality:
    """基础功能测试"""
    
    def test_agent_creation(self):
        """测试智能体创建"""
        agent = TestUtils.create_test_agent("TestAgent1")
        
        assert agent.role_name == "TestAgent1"
        assert agent.memory_window_size == TEST_CONFIG["memory_window_size"]
        assert agent.enable_caching == True
        assert agent.score == 100
        assert agent.execution_count == 0
        
        # 清理
        agent.cleanup_resources()
    
    def test_role_prompt_loading(self):
        """测试角色提示加载"""
        # 测试文件不存在时的默认创建
        from agency_core import BaseAgent
        
        non_existent_file = "/tmp/non_existent_prompt.md"
        mock_api = TestUtils.create_mock_model_api()
        
        agent = BaseAgent(
            role_name="TestAgent",
            role_prompt_path=non_existent_file,
            model_api=mock_api
        )
        
        assert agent.role_prompt is not None
        assert "TestAgent" in agent.role_prompt
        assert os.path.exists(non_existent_file)
        
        # 清理
        os.remove(non_existent_file)
        agent.cleanup_resources()
    
    def test_task_execution(self):
        """测试任务执行"""
        agent = TestUtils.create_test_agent("TestAgent2")
        
        # 执行任务
        task_description = "测试任务：生成一个简单的Python函数"
        result = agent.execute_task(task_description)
        
        # 验证结果结构
        TestUtils.assert_dict_structure(
            result,
            required_fields=["status", "content", "metadata"],
            optional_fields=["code_blocks", "validation_checks"]
        )
        
        assert result["status"] == "success"
        assert "测试响应" in result["content"]
        
        # 验证元数据
        metadata = result["metadata"]
        assert metadata["agent"] == "TestAgent2"
        assert metadata["execution_count"] == 1
        assert metadata["estimated_tokens"] > 0
        
        # 验证智能体状态更新
        assert agent.execution_count == 1
        assert agent.total_tokens_used > 0
        
        # 清理
        agent.cleanup_resources()


# ==================== 性能优化功能测试 ====================
class TestPerformanceOptimization:
    """性能优化功能测试"""
    
    def test_caching_mechanism(self):
        """测试缓存机制"""
        agent = TestUtils.create_test_agent("CachingTestAgent", enable_caching=True)
        
        # 第一次执行（应该缓存未命中）
        task = "测试缓存任务"
        result1 = agent.execute_task(task)
        assert result1["metadata"]["cache_hit"] == False
        
        # 第二次执行相同任务（应该缓存命中）
        result2 = agent.execute_task(task)
        assert result2["metadata"]["cache_hit"] == True
        
        # 验证缓存统计
        cache_stats = agent.cache.stats()
        assert cache_stats["hits"] >= 1
        assert cache_stats["entries"] >= 1
        
        # 清理
        agent.cleanup_resources()
    
    def test_cache_expiration(self):
        """测试缓存过期"""
        agent = TestUtils.create_test_agent("CacheExpiryTestAgent", enable_caching=True)
        
        # 设置较短的TTL
        agent.cache.ttl_seconds = 1
        
        # 第一次执行
        task = "测试缓存过期"
        result1 = agent.execute_task(task)
        assert result1["metadata"]["cache_hit"] == False
        
        # 立即执行（应该命中缓存）
        result2 = agent.execute_task(task)
        assert result2["metadata"]["cache_hit"] == True
        
        # 等待缓存过期
        time.sleep(2)
        
        # 再次执行（应该缓存未命中）
        result3 = agent.execute_task(task)
        assert result3["metadata"]["cache_hit"] == False
        
        # 清理
        agent.cleanup_resources()
    
    def test_async_task_execution(self):
        """测试异步任务执行"""
        agent = TestUtils.create_test_agent("AsyncTestAgent")
        
        # 提交异步任务
        task_hash = agent.execute_task_async("异步测试任务")
        assert task_hash is not None
        
        # 获取结果
        result = agent.get_async_result(task_hash, timeout=5)
        assert result is not None
        assert result["status"] == "success"
        
        # 验证任务状态
        task_stats = agent.task_pool.stats()
        assert task_stats["current_tasks"] >= 0
        
        # 清理
        agent.cleanup_resources()
    
    def test_batch_task_execution(self):
        """测试批量任务执行"""
        agent = TestUtils.create_test_agent("BatchTestAgent")
        
        # 创建一批任务
        tasks = [
            "批量任务1：生成一个函数",
            "批量任务2：创建一个类",
            "批量任务3：编写测试用例",
            "批量任务4：优化代码",
            "批量任务5：文档生成"
        ]
        
        # 执行批量任务
        results = agent.batch_execute_tasks(tasks)
        
        # 验证结果
        assert len(results) == len(tasks)
        for result in results:
            assert result["status"] == "success"
        
        # 验证并发执行（应该有多个任务同时执行）
        task_stats = agent.task_pool.stats()
        assert task_stats["max_workers"] == TEST_CONFIG["max_concurrent_tasks"]
        
        # 清理
        agent.cleanup_resources()
    
    def test_performance_monitoring(self):
        """测试性能监控"""
        from agency_core import PerformanceMonitor
        
        monitor = PerformanceMonitor()
        
        # 启动监控
        monitor.start_monitoring(interval_seconds=1)
        time.sleep(2)  # 等待监控线程执行
        
        # 检查性能指标
        stats = monitor.stats()
        assert stats["is_monitoring"] == True
        assert "memory" in stats
        assert "cpu" in stats
        
        # 停止监控
        monitor.stop_monitoring()
        assert monitor.should_monitor == False
        
        # 检查警告系统
        monitor._add_warning("test", "测试警告")
        warnings = monitor.get_warnings(since_seconds=10)
        assert len(warnings) >= 1
        assert warnings[0]["message"] == "测试警告"
        
        # 清理
        monitor.clear_warnings()


# ==================== 并发处理测试 ====================
class TestConcurrency:
    """并发处理测试"""
    
    def test_thread_safety(self):
        """测试线程安全性"""
        agent = TestUtils.create_test_agent("ThreadSafeTestAgent")
        
        # 创建多个线程同时执行任务
        results = []
        errors = []
        
        def worker(task_id):
            try:
                task = f"线程安全测试任务 {task_id}"
                result = agent.execute_task(task)
                results.append(result)
            except Exception as e:
                errors.append(str(e))
        
        # 启动多个线程
        threads = []
        for i in range(10):
            thread = threading.Thread(target=worker, args=(i,))
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join(timeout=5)
        
        # 验证结果
        assert len(errors) == 0, f"发生错误: {errors}"
        assert len(results) == 10
        
        # 验证智能体状态
        assert agent.execution_count == 10
        
        # 清理
        agent.cleanup_resources()
    
    def test_concurrent_limit(self):
        """测试并发限制"""
        agent = TestUtils.create_test_agent("ConcurrentLimitTestAgent")
        
        # 创建长时间运行的任务
        def slow_model_api(prompt):
            time.sleep(1)  # 模拟长时间运行的API
            return json.dumps({
                "status": "success",
                "content": "慢速任务完成",
                "code_blocks": [],
                "validation_checks": []
            })
        
        # 替换智能体的API
        agent.model_api = slow_model_api
        
        # 提交多个并发任务
        task_hashes = []
        for i in range(5):
            task_hash = agent.execute_task_async(f"并发限制测试任务 {i}")
            task_hashes.append(task_hash)
        
        # 检查运行中的任务数量
        running_tasks = agent.task_pool.get_running_tasks()
        assert len(running_tasks) <= TEST_CONFIG["max_concurrent_tasks"]
        
        # 等待任务完成
        for task_hash in task_hashes:
            result = agent.get_async_result(task_hash, timeout=10)
            assert result is not None
        
        # 清理
        agent.cleanup_resources()
    
    def test_task_cancellation(self):
        """测试任务取消"""
        agent = TestUtils.create_test_agent("TaskCancellationTestAgent")
        
        # 创建会超时的任务
        def timeout_model_api(prompt):
            time.sleep(10)  # 长时间运行
            return json.dumps({"status": "success", "content": "完成"})
        
        agent.model_api = timeout_model_api
        
        # 提交异步任务
        task_hash = agent.execute_task_async("超时测试任务")
        
        # 尝试获取结果（应该超时）
        result = agent.get_async_result(task_hash, timeout=1)
        assert result is None
        
        # 验证任务状态
        task_stats = agent.task_pool.stats()
        # 注意：这里任务可能仍在运行
        
        # 清理
        agent.cleanup_resources()


# ==================== 内存管理测试 ====================
class TestMemoryManagement:
    """内存管理测试"""
    
    def test_memory_cleanup(self):
        """测试内存清理"""
        agent = TestUtils.create_test_agent("MemoryCleanupTestAgent")
        
        # 执行一些任务
        for i in range(5):
            agent.execute_task(f"内存测试任务 {i}")
        
        # 获取清理前的内存使用
        memory_before = agent.memory_usage()
        
        # 执行清理
        agent.cleanup_resources()
        
        # 获取清理后的内存使用
        memory_after = agent.memory_usage()
        
        # 验证清理效果
        assert memory_after["pending_tasks"] <= memory_before["pending_tasks"]
        assert memory_after["response_cache_size"] <= memory_before["response_cache_size"]
        
        # 验证缓存统计
        if agent.enable_caching:
            cache_stats = agent.cache.stats()
            assert cache_stats["entries"] >= 0
        
        # 清理
        agent.cleanup_resources()
    
    def test_memory_window_limit(self):
        """测试记忆窗口限制"""
        agent = TestUtils.create_test_agent("MemoryWindowTestAgent")
        
        # 执行超过记忆窗口大小的任务
        for i in range(10):
            agent.execute_task(f"记忆窗口测试任务 {i}")
        
        # 验证记忆窗口大小不超过限制
        memory_stats = agent.memory_usage()
        assert memory_stats["memory_window_size"] <= TEST_CONFIG["memory_window_size"]
        
        # 清理
        agent.cleanup_resources()
    
    def test_large_object_handling(self):
        """测试大对象处理"""
        agent = TestUtils.create_test_agent("LargeObjectTestAgent")
        
        # 创建大响应
        large_response = {
            "status": "success",
            "content": "X" * 10000,  # 10KB内容
            "code_blocks": ["#" * 5000],
            "validation_checks": ["测试"]
        }
        
        # 模拟返回大响应的API
        def large_response_api(prompt):
            return json.dumps(large_response)
        
        agent.model_api = large_response_api
        
        # 执行任务
        result = agent.execute_task("大对象测试任务")
        
        # 验证响应被正确处理
        assert result["status"] == "success"
        assert len(result["content"]) > 0
        
        # 检查内存使用
        memory_stats = agent.memory_usage()
        assert memory_stats is not None
        
        # 清理
        agent.cleanup_resources()


# ==================== 错误处理测试 ====================
class TestErrorHandling:
    """错误处理测试"""
    
    def test_api_error_handling(self):
        """测试API错误处理"""
        agent = TestUtils.create_test_agent("APIErrorTestAgent")
        
        # 模拟抛出异常的API
        def error_model_api(prompt):
            raise ConnectionError("模拟API连接错误")
        
        agent.model_api = error_model_api
        
        # 执行任务（应该抛出异常）
        with pytest.raises(RuntimeError) as exc_info:
            agent.execute_task("API错误测试任务")
        
        assert "执行失败" in str(exc_info.value)
        
        # 验证错误计数
        assert agent.execution_count == 1  # 即使失败也会计数
        
        # 清理
        agent.cleanup_resources()
    
    def test_retry_mechanism(self):
        """测试重试机制"""
        agent = TestUtils.create_test_agent("RetryTestAgent")
        
        # 模拟前两次失败，第三次成功的API
        call_count = 0
        
        def flaky_model_api(prompt):
            nonlocal call_count
            call_count += 1
            
            if call_count <= 2:
                return "无效的JSON响应"  # 格式错误，会触发重试
            else:
                return json.dumps({
                    "status": "success",
                    "content": "最终成功",
                    "code_blocks": [],
                    "validation_checks": []
                })
        
        agent.model_api = flaky_model_api
        
        # 执行任务（应该重试并最终成功）
        result = agent.execute_task("重试测试任务", max_retries=3)
        
        assert result["status"] == "success"
        assert result["metadata"]["retry_count"] >= 2  # 至少重试2次
        
        # 验证调用次数
        assert call_count == 3
        
        # 清理
        agent.cleanup_resources()
    
    def test_invalid_json_handling(self):
        """测试无效JSON处理"""
        agent = TestUtils.create_test_agent("InvalidJSONTestAgent")
        
        # 模拟返回无效JSON的API
        def invalid_json_api(prompt):
            return "这不是有效的JSON { invalid: format }"
        
        agent.model_api = invalid_json_api
        
        # 执行任务（应该抛出异常或返回错误）
        with pytest.raises(ValueError) as exc_info:
            agent.execute_task("无效JSON测试任务", max_retries=1)
        
        assert "格式错误" in str(exc_info.value) or "JSON" in str(exc_info.value)
        
        # 清理
        agent.cleanup_resources()
    
    def test_memory_error_recovery(self):
        """测试内存错误恢复"""
        agent = TestUtils.create_test_agent("MemoryErrorTestAgent")
        
        # 执行正常任务
        result1 = agent.execute_task("正常任务1")
        assert result1["status"] == "success"
        
        # 模拟内存错误
        with patch.object(agent.cache, 'set', side_effect=MemoryError("模拟内存错误")):
            # 这个任务应该能够处理内存错误
            result2 = agent.execute_task("内存错误测试任务")
            assert result2["status"] == "success"
        
        # 验证智能体仍然可用
        result3 = agent.execute_task("正常任务2")
        assert result3["status"] == "success"
        
        # 清理
        agent.cleanup_resources()


# ==================== 插件架构测试 ====================
class TestPluginArchitecture:
    """插件架构测试"""
    
    def test_plugin_interface(self):
        """测试插件接口"""
        from agency_core import PluginInterface
        
        class TestPlugin(PluginInterface):
            def initialize(self, config):
                self.config = config
                return True
            
            def process(self, data):
                return {"processed": True, "data": data}
            
            def shutdown(self):
                return True
            
            def get_metadata(self):
                return {"name": "TestPlugin", "version": "1.0.0"}
        
        # 创建插件实例
        plugin = TestPlugin()
        
        # 测试初始化
        assert plugin.initialize({"param": "value"}) == True
        
        # 测试处理
        result = plugin.process("test data")
        assert result["processed"] == True
        assert result["data"] == "test data"
        
        # 测试元数据
        metadata = plugin.get_metadata()
        assert metadata["name"] == "TestPlugin"
        
        # 测试关闭
        assert plugin.shutdown() == True
    
    def test_plugin_manager(self):
        """测试插件管理器"""
        from agency_core import PluginManager, PluginInterface
        
        class SimplePlugin(PluginInterface):
            def initialize(self, config):
                self.initialized = True
                return True
            
            def process(self, data):
                return f"processed: {data}"
            
            def shutdown(self):
                self.initialized = False
                return True
            
            def get_metadata(self):
                return {"name": "SimplePlugin"}
        
        # 创建插件管理器
        manager = PluginManager()
        
        # 注册插件
        manager.register_plugin("simple", SimplePlugin, {"config": "test"})
        
        # 加载插件
        plugin = manager.load_plugin("simple")
        assert plugin is not None
        assert plugin.initialized == True
        
        # 测试插件处理
        result = plugin.process("data")
        assert result == "processed: data"
        
        # 列出插件
        plugins = manager.list_plugins()
        assert len(plugins) == 1
        assert plugins[0]["name"] == "simple"
        
        # 获取插件
        retrieved = manager.get_plugin("simple")
        assert retrieved == plugin
        
        # 卸载插件
        assert manager.unload_plugin("simple") == True
        assert manager.get_plugin("simple") is None
    
    def test_hook_system(self):
        """测试钩子系统"""
        from agency_core import ExtensibleBaseAgent
        
        # 创建可扩展的智能体
        agent = ExtensibleBaseAgent(
            role_name="HookTestAgent",
            role_prompt_path="/tmp/test_prompt.md",
            model_api=TestUtils.create_mock_model_api()
        )
        
        # 创建钩子
        pre_hook_called = []
        post_hook_called = []
        
        def pre_hook(task):
            pre_hook_called.append(task)
            return f"修改后的: {task}"
        
        def post_hook(result):
            post_hook_called.append(result)
            result["hooked"] = True
            return result
        
        # 添加钩子
        agent.add_pre_execute_hook(pre_hook)
        agent.add_post_execute_hook(post_hook)
        
        # 执行任务
        result = agent.execute_task("原始任务")
        
        # 验证钩子被调用
        assert len(pre_hook_called) == 1
        assert "修改后的" in pre_hook_called[0]
        
        assert len(post_hook_called) == 1
        assert post_hook_called[0]["hooked"] == True
        assert result["hooked"] == True
        
        # 清理
        agent.cleanup_resources()


# ==================== 集成测试 ====================
class TestIntegration:
    """集成测试"""
    
    def test_full_workflow(self):
        """测试完整工作流"""
        from agency_core import BaseAgent, WorkflowStateMachine
        
        # 创建多个智能体
        agents = {}
        roles = ["PM_Agent", "Arch_Agent", "Dev_Agent", "QA_Agent"]
        
        for role in roles:
            agent = TestUtils.create_test_agent(role)
            agents[role] = agent
        
        # 创建状态机
        workflow = WorkflowStateMachine(agents)
        
        # 验证状态机初始状态
        assert workflow.current_state == "IDLE"
        
        # 创建需求文件
        with open("test_requirements.txt", "w", encoding="utf-8") as f:
            f.write("测试需求：创建一个简单的计算器程序")
        
        # 启动工作流（简化版本，不实际运行完整循环）
        try:
            workflow.transition_to("PM_ANALYSIS")
            assert workflow.current_state == "PM_ANALYSIS"
            
            # 这里可以添加更多状态转移测试
            
        finally:
            # 清理
            for agent in agents.values():
                agent.cleanup_resources()
            
            # 删除测试文件
            if os.path.exists("test_requirements.txt"):
                os.remove("test_requirements.txt")
    
    def test_performance_under_load(self):
        """测试负载下的性能"""
        agent = TestUtils.create_test_agent("LoadTestAgent")
        
        # 创建大量任务
        num_tasks = 20
        tasks = [f"负载测试任务 {i}" for i in range(num_tasks)]
        
        # 测量批量执行性能
        performance = TestUtils.measure_performance(
            agent.batch_execute_tasks, tasks
        )
        
        print(f"\n负载测试结果:")
        print(f"  任务数量: {num_tasks}")
        print(f"  执行时间: {performance['execution_time']:.2f}秒")
        print(f"  内存使用: {performance['memory_used'] / 1024 / 1024:.2f}MB")
        
        # 验证所有任务完成
        results = performance["result"]
        assert len(results) == num_tasks
        
        success_count = sum(1 for r in results if r["status"] == "success")
        print(f"  成功任务: {success_count}/{num_tasks}")
        
        # 性能断言（可根据实际情况调整）
        assert performance['execution_time'] < 30  # 应该在30秒内完成
        assert success_count >= num_tasks * 0.8  # 至少80%成功
        
        # 清理
        agent.cleanup_resources()


# ==================== 性能基准测试 ====================
class TestPerformanceBenchmarks:
    """性能基准测试"""
    
    def benchmark_single_task(self):
        """基准测试：单任务执行"""
        agent = TestUtils.create_test_agent("BenchmarkAgent")
        
        # 预热
        for _ in range(3):
            agent.execute_task("预热任务")
        
        # 基准测试
        times = []
        for i in range(10):
            start_time = time.time()
            agent.execute_task(f"基准测试任务 {i}")
            end_time = time.time()
            times.append(end_time - start_time)
        
        avg_time = sum(times) / len(times)
        print(f"\n单任务执行基准测试:")
        print(f"  平均执行时间: {avg_time:.3f}秒")
        print(f"  最快: {min(times):.3f}秒")
        print(f"  最慢: {max(times):.3f}秒")
        
        # 清理
        agent.cleanup_resources()
        return avg_time
    
    def benchmark_concurrent_tasks(self):
        """基准测试：并发任务"""
        agent = TestUtils.create_test_agent("ConcurrentBenchmarkAgent")
        
        # 创建并发任务
        num_tasks = agent.task_pool.max_workers * 2
        tasks = [f"并发基准测试任务 {i}" for i in range(num_tasks)]
        
        # 测量批量执行时间
        start_time = time.time()
        results = agent.batch_execute_tasks(tasks)
        end_time = time.time()
        
        total_time = end_time - start_time
        success_count = sum(1 for r in results if r["status"] == "success")
        
        print(f"\n并发任务基准测试:")
        print(f"  任务数量: {num_tasks}")
        print(f"  并发数: {agent.task_pool.max_workers}")
        print(f"  总执行时间: {total_time:.3f}秒")
        print(f"  成功率: {success_count}/{num_tasks}")
        print(f"  吞吐量: {num_tasks / total_time:.2f} 任务/秒")
        
        # 清理
        agent.cleanup_resources()
        return total_time
    
    def benchmark_memory_usage(self):
        """基准测试：内存使用"""
        agent = TestUtils.create_test_agent("MemoryBenchmarkAgent")
        
        # 测量初始内存
        initial_memory = psutil.Process().memory_info().rss
        
        # 执行多个任务
        for i in range(50):
            agent.execute_task(f"内存测试任务 {i}")
        
        # 测量峰值内存
        peak_memory = psutil.Process().memory_info().rss
        memory_increase = peak_memory - initial_memory
        
        # 清理后内存
        agent.cleanup_resources()
        gc.collect()
        final_memory = psutil.Process().memory_info().rss
        
        print(f"\n内存使用基准测试:")
        print(f"  初始内存: {initial_memory / 1024 / 1024:.2f}MB")
        print(f"  峰值内存: {peak_memory / 1024 / 1024:.2f}MB")
        print(f"  内存增长: {memory_increase / 1024 / 1024:.2f}MB")
        print(f"  清理后内存: {final_memory / 1024 / 1024:.2f}MB")
        
        # 清理
        agent.cleanup_resources()
        return memory_increase


# ==================== 主测试运行器 ====================
def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("开始 agency_core.py 性能优化版本自动化测试")
    print("=" * 60)
    
    test_classes = [
        TestBasicFunctionality(),
        TestPerformanceOptimization(),
        TestConcurrency(),
        TestMemoryManagement(),
        TestErrorHandling(),
        TestPluginArchitecture(),
        TestIntegration()
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    for test_class in test_classes:
        class_name = test_class.__class__.__name__
        print(f"\n测试类: {class_name}")
        
        # 获取所有测试方法
        test_methods = [
            method for method in dir(test_class)
            if method.startswith('test_') and callable(getattr(test_class, method))
        ]
        
        for method_name in test_methods:
            total_tests += 1
            method = getattr(test_class, method_name)
            
            try:
                # 运行测试
                method()
                print(f"  ✓ {method_name}")
                passed_tests += 1
            except Exception as e:
                print(f"  ✗ {method_name}: {str(e)}")
                failed_tests.append(f"{class_name}.{method_name}: {str(e)}")
    
    # 运行基准测试
    print(f"\n{'='*60}")
    print("运行性能基准测试")
    print(f"{'='*60}")
    
    benchmark = TestPerformanceBenchmarks()
    
    try:
        benchmark.benchmark_single_task()
    except Exception as e:
        print(f"单任务基准测试失败: {str(e)}")
    
    try:
        benchmark.benchmark_concurrent_tasks()
    except Exception as e:
        print(f"并发任务基准测试失败: {str(e)}")
    
    try:
        benchmark.benchmark_memory_usage()
    except Exception as e:
        print(f"内存使用基准测试失败: {str(e)}")
    
    # 输出测试结果
    print(f"\n{'='*60}")
    print("测试结果汇总")
    print(f"{'='*60}")
    print(f"总测试数: {total_tests}")
    print(f"通过数: {passed_tests}")
    print(f"失败数: {total_tests - passed_tests}")
    
    if failed_tests:
        print(f"\n失败测试:")
        for failure in failed_tests:
            print(f"  - {failure}")
    
    print(f"\n测试完成!")
    return passed_tests == total_tests


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)