"""
agency_core.py - 硬核微型多智能体框架
类似 MetaGPT/CrewAI 的底层架构实现

架构原则：
1. 强制结构化输出 - 消灭废话和格式错误
2. 严格状态机控制 - 禁止自由聊天
3. 实时淘汰机制 - 代码化RLAIF
4. 内存窗口限制 - 防止token爆炸
"""

import json
import re
import time
import hashlib
import asyncio
import threading
import concurrent.futures
import multiprocessing
import queue
import psutil
import gc
from typing import List, Dict, Any, Optional, Callable, Union, Type
from datetime import datetime, timedelta
import os
import sys
import traceback
import logging
from logging.handlers import RotatingFileHandler
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from collections import defaultdict, deque
from functools import lru_cache, wraps
from enum import Enum
import inspect
import warnings

try:
    from pydantic import BaseModel, ValidationError
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False
    print("警告: 未安装pydantic，使用内置验证器")


# ==================== 性能优化基础工具 ====================
class PerformanceMetrics:
    """性能指标收集器"""
    
    def __init__(self):
        self.metrics = defaultdict(list)
        self.start_time = time.time()
        self.lock = threading.Lock()
    
    def record(self, metric_name: str, value: float):
        """记录性能指标"""
        with self.lock:
            self.metrics[metric_name].append((time.time(), value))
            
            # 保持最近1000个记录
            if len(self.metrics[metric_name]) > 1000:
                self.metrics[metric_name] = self.metrics[metric_name][-1000:]
    
    def get_stats(self, metric_name: str, window_seconds: int = 300) -> Dict[str, Any]:
        """获取指标统计"""
        with self.lock:
            now = time.time()
            window_start = now - window_seconds
            recent_values = [
                value for timestamp, value in self.metrics.get(metric_name, [])
                if timestamp >= window_start
            ]
            
            if not recent_values:
                return {
                    "count": 0,
                    "mean": 0,
                    "min": 0,
                    "max": 0,
                    "p95": 0,
                    "p99": 0
                }
            
            sorted_values = sorted(recent_values)
            n = len(sorted_values)
            
            return {
                "count": n,
                "mean": sum(sorted_values) / n,
                "min": min(sorted_values),
                "max": max(sorted_values),
                "p95": sorted_values[int(n * 0.95)] if n > 0 else 0,
                "p99": sorted_values[int(n * 0.99)] if n > 0 else 0
            }


class MemoryCache:
    """内存缓存管理器"""
    
    def __init__(self, max_size_mb: int = 100, ttl_seconds: int = 3600):
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.ttl_seconds = ttl_seconds
        self.cache = {}
        self.size_bytes = 0
        self.hits = 0
        self.misses = 0
        self.lock = threading.RLock()
        self.last_cleanup = time.time()
    
    def get(self, key: str):
        """获取缓存值"""
        with self.lock:
            if key not in self.cache:
                self.misses += 1
                return None
            
            entry = self.cache[key]
            if time.time() - entry["timestamp"] > self.ttl_seconds:
                # 已过期
                self.size_bytes -= entry["size"]
                del self.cache[key]
                self.misses += 1
                return None
            
            self.hits += 1
            return entry["value"]
    
    def set(self, key: str, value: Any, size_bytes: Optional[int] = None):
        """设置缓存值"""
        with self.lock:
            # 估算大小
            if size_bytes is None:
                try:
                    size_bytes = sys.getsizeof(value)
                except:
                    size_bytes = 1024  # 默认1KB
            
            # 清理过期条目
            self._cleanup_expired()
            
            # 检查是否超出限制
            if size_bytes > self.max_size_bytes:
                return  # 单个值太大，不缓存
            
            # 如果需要空间，移除最旧的条目
            while self.size_bytes + size_bytes > self.max_size_bytes and self.cache:
                oldest_key = None
                oldest_time = float('inf')
                
                for k, v in self.cache.items():
                    if v["timestamp"] < oldest_time:
                        oldest_key = k
                        oldest_time = v["timestamp"]
                
                if oldest_key:
                    self.size_bytes -= self.cache[oldest_key]["size"]
                    del self.cache[oldest_key]
            
            # 设置新条目
            self.cache[key] = {
                "value": value,
                "timestamp": time.time(),
                "size": size_bytes
            }
            self.size_bytes += size_bytes
    
    def _cleanup_expired(self):
        """清理过期条目"""
        current_time = time.time()
        if current_time - self.last_cleanup < 60:  # 每60秒清理一次
            return
        
        expired_keys = []
        for key, entry in self.cache.items():
            if current_time - entry["timestamp"] > self.ttl_seconds:
                expired_keys.append(key)
                self.size_bytes -= entry["size"]
        
        for key in expired_keys:
            del self.cache[key]
        
        self.last_cleanup = current_time
    
    def stats(self) -> Dict[str, Any]:
        """获取缓存统计"""
        with self.lock:
            self._cleanup_expired()
            return {
                "size_mb": self.size_bytes / (1024 * 1024),
                "max_size_mb": self.max_size_bytes / (1024 * 1024),
                "entries": len(self.cache),
                "hits": self.hits,
                "misses": self.misses,
                "hit_rate": self.hits / max(1, self.hits + self.misses),
                "avg_entry_size_kb": (self.size_bytes / max(1, len(self.cache))) / 1024
            }


class AsyncTaskPool:
    """异步任务池管理器"""
    
    def __init__(self, max_workers: int = None):
        self.max_workers = max_workers or min(32, os.cpu_count() * 2 + 4)
        self.executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=self.max_workers,
            thread_name_prefix="agent_worker"
        )
        self.tasks = {}
        self.task_counter = 0
        self.lock = threading.Lock()
        self.performance_metrics = PerformanceMetrics()
    
    def submit_task(self, func: Callable, *args, **kwargs) -> str:
        """提交任务到线程池"""
        with self.lock:
            task_id = f"task_{self.task_counter}"
            self.task_counter += 1
            
            start_time = time.time()
            future = self.executor.submit(self._wrapped_task, task_id, func, start_time, *args, **kwargs)
            self.tasks[task_id] = {
                "future": future,
                "start_time": start_time,
                "function": func.__name__ if hasattr(func, '__name__') else str(func),
                "status": "pending"
            }
            
            return task_id
    
    def _wrapped_task(self, task_id: str, func: Callable, start_time: float, *args, **kwargs):
        """包装任务以记录性能指标"""
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            with self.lock:
                if task_id in self.tasks:
                    self.tasks[task_id]["status"] = "completed"
                    self.tasks[task_id]["end_time"] = time.time()
                    self.tasks[task_id]["execution_time"] = execution_time
            
            self.performance_metrics.record("task_execution_time", execution_time)
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            
            with self.lock:
                if task_id in self.tasks:
                    self.tasks[task_id]["status"] = "failed"
                    self.tasks[task_id]["error"] = str(e)
                    self.tasks[task_id]["end_time"] = time.time()
                    self.tasks[task_id]["execution_time"] = execution_time
            
            self.performance_metrics.record("task_failure_time", execution_time)
            raise
    
    def get_task_result(self, task_id: str, timeout: Optional[float] = None):
        """获取任务结果"""
        if task_id not in self.tasks:
            raise ValueError(f"任务 {task_id} 不存在")
        
        future = self.tasks[task_id]["future"]
        try:
            result = future.result(timeout=timeout)
            return result
        except concurrent.futures.TimeoutError:
            raise TimeoutError(f"任务 {task_id} 执行超时")
        except Exception as e:
            raise RuntimeError(f"任务 {task_id} 执行失败: {str(e)}")
    
    def get_running_tasks(self) -> List[Dict[str, Any]]:
        """获取正在运行的任务"""
        with self.lock:
            running_tasks = []
            for task_id, task_info in self.tasks.items():
                if task_info["status"] in ["pending", "running"]:
                    running_tasks.append({
                        "task_id": task_id,
                        "function": task_info["function"],
                        "start_time": task_info["start_time"],
                        "duration": time.time() - task_info["start_time"],
                        "status": task_info["status"]
                    })
            return running_tasks
    
    def cleanup_completed_tasks(self, max_age_seconds: int = 3600):
        """清理已完成的任务"""
        with self.lock:
            current_time = time.time()
            completed_tasks = [
                task_id for task_id, task_info in self.tasks.items()
                if task_info["status"] in ["completed", "failed"] and 
                current_time - task_info.get("end_time", 0) > max_age_seconds
            ]
            
            for task_id in completed_tasks:
                del self.tasks[task_id]
    
    def shutdown(self, wait: bool = True):
        """关闭任务池"""
        self.executor.shutdown(wait=wait)
    
    def stats(self) -> Dict[str, Any]:
        """获取任务池统计"""
        with self.lock:
            self.cleanup_completed_tasks()
            
            status_counts = defaultdict(int)
            for task_info in self.tasks.values():
                status_counts[task_info["status"]] += 1
            
            task_metrics = self.performance_metrics.get_stats("task_execution_time")
            
            return {
                "total_tasks_submitted": self.task_counter,
                "current_tasks": len(self.tasks),
                "status_counts": dict(status_counts),
                "max_workers": self.max_workers,
                "task_execution_stats": task_metrics,
                "active_workers": self.executor._max_workers - self.executor._idle_semaphore._value
            }


class PerformanceMonitor:
    """性能监控器"""
    
    def __init__(self, warning_thresholds: Optional[Dict[str, float]] = None):
        self.metrics = PerformanceMetrics()
        self.warnings = []
        self.warning_thresholds = warning_thresholds or {
            "memory_usage_percent": 85.0,
            "cpu_usage_percent": 80.0,
            "task_execution_time_seconds": 30.0,
            "task_queue_size": 100,
            "response_time_seconds": 10.0
        }
        self.last_check = time.time()
        self.monitoring_thread = None
        self.should_monitor = False
    
    def start_monitoring(self, interval_seconds: int = 10):
        """启动监控线程"""
        self.should_monitor = True
        self.monitoring_thread = threading.Thread(
            target=self._monitoring_loop,
            args=(interval_seconds,),
            daemon=True,
            name="performance_monitor"
        )
        self.monitoring_thread.start()
        print("[性能监控] 监控线程已启动")
    
    def stop_monitoring(self):
        """停止监控线程"""
        self.should_monitor = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)
            print("[性能监控] 监控线程已停止")
    
    def _monitoring_loop(self, interval_seconds: int):
        """监控循环"""
        while self.should_monitor:
            try:
                self.check_performance()
                time.sleep(interval_seconds)
            except Exception as e:
                print(f"[性能监控] 监控循环出错: {str(e)}")
                time.sleep(interval_seconds)
    
    def check_performance(self):
        """检查性能指标"""
        current_time = time.time()
        
        # 收集系统指标
        memory_percent = psutil.virtual_memory().percent
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        self.metrics.record("memory_usage_percent", memory_percent)
        self.metrics.record("cpu_usage_percent", cpu_percent)
        
        # 检查阈值
        if memory_percent > self.warning_thresholds["memory_usage_percent"]:
            self._add_warning("memory_usage", f"内存使用率过高: {memory_percent:.1f}%")
        
        if cpu_percent > self.warning_thresholds["cpu_usage_percent"]:
            self._add_warning("cpu_usage", f"CPU使用率过高: {cpu_percent:.1f}%")
        
        self.last_check = current_time
    
    def _add_warning(self, warning_type: str, message: str):
        """添加警告"""
        warning = {
            "type": warning_type,
            "message": message,
            "timestamp": time.time(),
            "level": "warning"
        }
        self.warnings.append(warning)
        
        # 保持最近100个警告
        if len(self.warnings) > 100:
            self.warnings = self.warnings[-100:]
        
        print(f"[性能警告] {message}")
    
    def get_warnings(self, since_seconds: int = 3600) -> List[Dict[str, Any]]:
        """获取指定时间内的警告"""
        cutoff_time = time.time() - since_seconds
        return [w for w in self.warnings if w["timestamp"] >= cutoff_time]
    
    def clear_warnings(self):
        """清除警告"""
        self.warnings = []
    
    def stats(self) -> Dict[str, Any]:
        """获取监控统计"""
        memory_stats = self.metrics.get_stats("memory_usage_percent")
        cpu_stats = self.metrics.get_stats("cpu_usage_percent")
        
        return {
            "memory": memory_stats,
            "cpu": cpu_stats,
            "warning_thresholds": self.warning_thresholds,
            "recent_warnings": len(self.get_warnings(since_seconds=300)),
            "last_check": self.last_check,
            "is_monitoring": self.should_monitor
        }


# ==================== 1. 智能体基类（性能优化版） ====================
class BaseAgent:
    """智能体基类 - 硬核工程实现（带性能优化）"""
    
    def __init__(self, 
                 role_name: str,
                 role_prompt_path: str,
                 model_api: Callable,
                 memory_window_size: int = 5,
                 enable_caching: bool = True,
                 max_concurrent_tasks: int = 3):
        """
        参数:
            role_name: 智能体角色名 (PM_Agent, Arch_Agent, Dev_Agent等)
            role_prompt_path: .md角色设定文件路径
            model_api: 大模型API调用函数 (需要返回文本)
            memory_window_size: 记忆窗口大小，严格限制token
            enable_caching: 是否启用响应缓存
            max_concurrent_tasks: 最大并发任务数
        """
        self.role_name = role_name
        self.role_prompt = self._load_role_prompt(role_prompt_path)
        self.model_api = model_api
        self.memory_window = deque(maxlen=memory_window_size)  # 使用deque优化
        self.memory_window_size = memory_window_size
        self.total_tokens_used = 0
        self.execution_count = 0
        self.score = 100  # 初始评分100分
        
        # 性能优化组件
        self.enable_caching = enable_caching
        if enable_caching:
            self.cache = MemoryCache(max_size_mb=50, ttl_seconds=1800)  # 50MB缓存，30分钟过期
        
        # 异步支持
        self.task_pool = AsyncTaskPool(max_workers=max_concurrent_tasks)
        self.pending_tasks = {}
        self.response_cache = {}  # 短期响应缓存
        
        # 性能监控
        self.performance_metrics = PerformanceMetrics()
        self.lock = threading.RLock()  # 可重入锁，支持嵌套调用
        
        # 初始化时间
        self.created_at = time.time()
        self.last_activity = self.created_at
        
    def _load_role_prompt(self, prompt_path: str) -> str:
        """加载角色设定文件，支持.markdown和.md"""
        try:
            with open(prompt_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 验证文件内容不是空的
            if len(content.strip()) < 50:
                raise ValueError(f"角色设定文件太短: {prompt_path}，至少需要50字符")
            
            return content
        except FileNotFoundError:
            # 如果文件不存在，创建默认模板
            default_prompt = f"""# {self.role_name} 角色设定

## 核心职责
- 严格遵循JSON输出格式
- 只输出纯粹的代码/技术内容
- 禁止任何形式的闲聊和废话
- 确保输出的可执行性和正确性

## 输出格式要求
所有响应必须是严格的JSON格式：
```json
{{
    "status": "success|error",
    "content": "具体的输出内容",
    "code_blocks": ["代码块1", "代码块2"],
    "validation_checks": ["检查项1: 通过", "检查项2: 通过"]
}}
```

## 质量要求
- 代码必须可直接执行
- 逻辑必须完整清晰
- 错误处理必须完备
"""
            with open(prompt_path, 'w', encoding='utf-8') as f:
                f.write(default_prompt)
            return default_prompt
    
    def _truncate_memory(self):
        """严格限制记忆窗口，防止token爆炸"""
        # deque自动处理，无需额外操作
        pass
    
    def _build_prompt(self, task_description: str) -> str:
        """构建包含角色、记忆和任务的全提示"""
        memory_context = ""
        if self.memory_window:
            memory_context = "\n## 相关历史对话（最近5轮）\n"
            for i, (role, msg) in enumerate(self.memory_window[-3:], 1):  # 只取最近3条
                memory_context += f"{i}. {role}: {msg[:200]}...\n" if len(msg) > 200 else f"{i}. {role}: {msg}\n"
        
        prompt = f"""# {self.role_name} 任务执行

## 角色设定
{self.role_prompt}

## 当前任务
{task_description}

{memory_context}

## 严格输出要求
1. 必须返回JSON格式
2. 必须包含status字段（success或error）
3. 代码必须放在code_blocks数组中
4. 禁止任何非技术性描述
5. 禁止markdown格式（除了代码块）

请严格按照以下JSON格式返回：
```json
{{
    "status": "success",
    "content": "任务执行结果说明",
    "code_blocks": ["代码1", "代码2"],
    "validation_checks": ["检查1", "检查2"],
    "execution_time": "预估执行时间"
}}
```

开始执行："""
        
        return prompt
    
    def execute_task(self, task_description: str, max_retries: int = 3) -> Dict[str, Any]:
        """
        执行任务 - 硬核工程实现（性能优化版）
        强制要求JSON格式，自动重试直到格式正确
        """
        with self.lock:
            self.execution_count += 1
            self.last_activity = time.time()
        
        # 生成任务ID用于缓存
        task_hash = hashlib.md5(f"{self.role_name}:{task_description}".encode()).hexdigest()
        
        # 检查缓存
        if self.enable_caching:
            cached_result = self.cache.get(task_hash)
            if cached_result:
                print(f"[{self.role_name}] 缓存命中，使用缓存结果")
                with self.lock:
                    self.memory_window.append(("user", task_description))
                    self.memory_window.append(("assistant", cached_result.get("content", "")[:500]))
                return cached_result
        
        # 如果没有缓存或缓存未命中，执行任务
        for retry in range(max_retries):
            try:
                # 构建提示
                prompt = self._build_prompt(task_description)
                
                # 记录到记忆窗口
                with self.lock:
                    self.memory_window.append(("user", task_description))
                
                # 调用大模型API（记录性能）
                start_time = time.time()
                
                # 检查是否已有相同任务的异步执行
                if task_hash in self.pending_tasks:
                    # 等待已有的异步任务完成
                    return self._wait_for_async_task(task_hash, timeout=60)
                
                # 同步执行
                raw_response = self.model_api(prompt)
                execution_time = time.time() - start_time
                
                # 记录性能指标
                self.performance_metrics.record("api_call_time", execution_time)
                self.performance_metrics.record("api_response_size", len(raw_response))
                
                # 记录token使用（估算）
                estimated_tokens = len(prompt) // 4 + len(raw_response) // 4
                with self.lock:
                    self.total_tokens_used += estimated_tokens
                
                # 记录响应到记忆窗口
                with self.lock:
                    self.memory_window.append(("assistant", raw_response[:500]))  # 只存前500字符
                
                # 验证输出格式
                validation_result = self._validate_output(raw_response)
                
                if validation_result["valid"]:
                    # 解析JSON响应
                    try:
                        json_response = json.loads(validation_result["cleaned_json"])
                        
                        # 添加执行元数据
                        json_response["metadata"] = {
                            "agent": self.role_name,
                            "execution_count": self.execution_count,
                            "retry_count": retry,
                            "execution_time_seconds": round(execution_time, 2),
                            "estimated_tokens": estimated_tokens,
                            "timestamp": datetime.now().isoformat(),
                            "cache_hit": False,
                            "task_hash": task_hash
                        }
                        
                        # 更新智能体评分（基于执行质量）
                        quality_score = self._calculate_quality_score(json_response, execution_time)
                        with self.lock:
                            self.score = (self.score * 0.7) + (quality_score * 0.3)  # 加权更新
                        
                        # 添加到缓存
                        if self.enable_caching:
                            self.cache.set(task_hash, json_response)
                        
                        print(f"[{self.role_name}] 任务执行成功 - 重试次数: {retry}, 评分: {self.score:.1f}, 执行时间: {execution_time:.2f}s")
                        
                        # 记录性能指标
                        self.performance_metrics.record("task_execution_time", execution_time)
                        self.performance_metrics.record("agent_score", self.score)
                        
                        return json_response
                        
                    except json.JSONDecodeError as e:
                        error_msg = f"JSON解析失败: {str(e)}"
                else:
                    error_msg = validation_result["error"]
                
                # 如果验证失败，准备重试提示
                if retry < max_retries - 1:
                    print(f"[{self.role_name}] 输出格式验证失败，第{retry+1}次重试: {error_msg}")
                    
                    # 构建错误修复提示
                    retry_prompt = f"""之前的响应格式错误:
错误: {error_msg}

原始响应: {raw_response[:500]}...

请重新执行任务，确保返回严格的JSON格式。必须只包含JSON，没有其他任何内容。"""
                    
                    task_description = retry_prompt
                    time.sleep(1)  # 避免频繁调用
                else:
                    raise ValueError(f"达到最大重试次数({max_retries})，验证失败: {error_msg}")
                    
            except Exception as e:
                # 记录错误指标
                self.performance_metrics.record("task_failure", 1)
                
                if retry == max_retries - 1:
                    error_msg = f"智能体{self.role_name}执行失败: {str(e)}"
                    print(f"[{self.role_name}] {error_msg}")
                    raise RuntimeError(error_msg)
                time.sleep(2)
        
        # 不应该到达这里
        return {"status": "error", "content": "未知错误"}
    
    def execute_task_async(self, task_description: str, max_retries: int = 3) -> str:
        """
        异步执行任务
        返回任务ID，可以通过get_async_result获取结果
        """
        task_hash = hashlib.md5(f"{self.role_name}:{task_description}".encode()).hexdigest()
        
        # 如果已有相同任务在执行，返回现有任务ID
        if task_hash in self.pending_tasks:
            return task_hash
        
        # 提交异步任务
        task_id = self.task_pool.submit_task(self.execute_task, task_description, max_retries)
        self.pending_tasks[task_hash] = task_id
        
        # 设置清理回调
        def cleanup_callback(future):
            try:
                future.result()
            finally:
                if task_hash in self.pending_tasks:
                    del self.pending_tasks[task_hash]
        
        future = self.task_pool.tasks[task_id]["future"]
        future.add_done_callback(cleanup_callback)
        
        return task_hash
    
    def _wait_for_async_task(self, task_hash: str, timeout: float = 60) -> Dict[str, Any]:
        """等待异步任务完成并获取结果"""
        if task_hash not in self.pending_tasks:
            raise ValueError(f"任务 {task_hash} 不存在")
        
        task_id = self.pending_tasks[task_hash]
        try:
            result = self.task_pool.get_task_result(task_id, timeout=timeout)
            return result
        except (TimeoutError, RuntimeError) as e:
            # 任务失败或超时，从pending tasks中移除
            if task_hash in self.pending_tasks:
                del self.pending_tasks[task_hash]
            raise
    
    def get_async_result(self, task_hash: str, timeout: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """获取异步任务结果"""
        try:
            return self._wait_for_async_task(task_hash, timeout)
        except (ValueError, TimeoutError, RuntimeError):
            return None
    
    def batch_execute_tasks(self, tasks: List[str], max_concurrent: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        批量执行任务
        并行处理多个任务，提高吞吐量
        """
        if not tasks:
            return []
        
        # 创建任务哈希列表
        task_hashes = []
        task_descriptions = []
        
        for task in tasks:
            task_hash = hashlib.md5(f"{self.role_name}:{task}".encode()).hexdigest()
            task_hashes.append(task_hash)
            task_descriptions.append(task)
        
        # 检查缓存
        cached_results = {}
        uncached_indices = []
        
        for i, task_hash in enumerate(task_hashes):
            if self.enable_caching:
                cached_result = self.cache.get(task_hash)
                if cached_result:
                    cached_results[i] = cached_result
                else:
                    uncached_indices.append(i)
            else:
                uncached_indices.append(i)
        
        # 执行未缓存的任务
        results = [None] * len(tasks)
        
        # 设置缓存结果
        for i, result in cached_results.items():
            results[i] = result
        
        if uncached_indices:
            # 提交异步任务
            async_tasks = []
            for i in uncached_indices:
                task_hash = self.execute_task_async(task_descriptions[i])
                async_tasks.append((i, task_hash))
            
            # 等待所有任务完成
            for i, task_hash in async_tasks:
                try:
                    result = self.get_async_result(task_hash, timeout=120)
                    if result:
                        results[i] = result
                    else:
                        results[i] = {"status": "error", "content": "任务执行超时或失败"}
                except Exception as e:
                    results[i] = {"status": "error", "content": f"任务执行异常: {str(e)}"}
        
        return results
    
    def _validate_output(self, raw_response: str) -> Dict[str, Any]:
        """
        强制结构化校验 - 硬核实现
        如果返回的不是纯粹代码块或包含废话，直接捕获错误
        """
        # 1. 检查是否包含JSON
        json_patterns = [
            r'\{[\s\S]*\}',  # 标准JSON
            r'```json\s*([\s\S]*?)\s*```',  # 带json标记的代码块
            r'```\s*([\s\S]*?)\s*```',  # 任何代码块
        ]
        
        json_content = None
        for pattern in json_patterns:
            matches = re.findall(pattern, raw_response, re.DOTALL)
            if matches:
                json_content = matches[0].strip()
                break
        
        if not json_content:
            return {
                "valid": False,
                "error": "响应中未找到有效的JSON内容",
                "cleaned_json": None
            }
        
        # 2. 清理JSON内容
        # 移除可能的markdown标记
        cleaned = json_content
        cleaned = re.sub(r'^```json\s*|\s*```$', '', cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r'^```\s*|\s*```$', '', cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()
        
        # 3. 验证是否是有效的JSON
        try:
            parsed = json.loads(cleaned)
            
            # 4. 硬核格式检查
            required_fields = ["status", "content"]
            for field in required_fields:
                if field not in parsed:
                    return {
                        "valid": False,
                        "error": f"缺少必需字段: {field}",
                        "cleaned_json": None
                    }
            
            # 5. 检查是否包含废话（非技术性内容）
            if "code_blocks" not in parsed:
                # 如果没有代码块，检查content是否技术性
                content = str(parsed.get("content", "")).lower()
                non_tech_keywords = ["hello", "hi ", "thank", "welcome", "glad", "happy", "excited"]
                if any(keyword in content for keyword in non_tech_keywords):
                    return {
                        "valid": False,
                        "error": "响应包含非技术性废话内容",
                        "cleaned_json": None
                    }
            
            return {
                "valid": True,
                "error": None,
                "cleaned_json": cleaned
            }
            
        except json.JSONDecodeError as e:
            return {
                "valid": False,
                "error": f"JSON格式无效: {str(e)}",
                "cleaned_json": None
            }
    
    def _calculate_quality_score(self, response: Dict[str, Any], execution_time: float) -> float:
        """计算执行质量评分"""
        score = 100.0
        
        # 1. 检查状态
        if response.get("status") != "success":
            score -= 30
        
        # 2. 检查代码块
        code_blocks = response.get("code_blocks", [])
        if not code_blocks:
            score -= 20
        else:
            # 检查代码块质量
            for code in code_blocks:
                if len(code.strip()) < 10:
                    score -= 5
                # 检查是否有明显的语法错误模式
                if "TODO" in code or "FIXME" in code or "# placeholder" in code.lower():
                    score -= 10
        
        # 3. 检查执行时间（惩罚过慢）
        if execution_time > 30.0:  # 超过30秒
            score -= 10
        elif execution_time > 60.0:  # 超过60秒
            score -= 25
        
        # 4. 检查内容完整性
        content = response.get("content", "")
        if len(content.strip()) < 20:
            score -= 15
        
        # 确保分数在合理范围内
        return max(0.0, min(100.0, score))
    
    def reset_memory(self):
        """重置记忆窗口"""
        with self.lock:
            self.memory_window.clear()
        print(f"[{self.role_name}] 记忆已重置")
    
    def cleanup_resources(self, force_gc: bool = True):
        """
        清理资源
        包括：缓存清理、任务清理、内存释放
        """
        print(f"[{self.role_name}] 开始清理资源...")
        
        # 清理缓存
        if self.enable_caching:
            cache_stats_before = self.cache.stats()
            self.cache._cleanup_expired()
            cache_stats_after = self.cache.stats()
            print(f"  缓存清理: {cache_stats_before['entries']} → {cache_stats_after['entries']} 条目")
        
        # 清理任务池
        self.task_pool.cleanup_completed_tasks(max_age_seconds=300)
        task_stats = self.task_pool.stats()
        print(f"  任务池清理: {task_stats['current_tasks']} 个活跃任务")
        
        # 清理pending tasks
        current_time = time.time()
        expired_tasks = []
        for task_hash in list(self.pending_tasks.keys()):
            if task_hash in self.task_pool.tasks:
                task_info = self.task_pool.tasks[self.pending_tasks[task_hash]]
                if current_time - task_info.get("start_time", 0) > 300:  # 5分钟超时
                    expired_tasks.append(task_hash)
        
        for task_hash in expired_tasks:
            del self.pending_tasks[task_hash]
        
        print(f"  清理过期任务: {len(expired_tasks)} 个")
        
        # 清理响应缓存
        expired_keys = []
        current_time = time.time()
        for key, (timestamp, _) in list(self.response_cache.items()):
            if current_time - timestamp > 600:  # 10分钟过期
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.response_cache[key]
        
        print(f"  清理响应缓存: {len(expired_keys)} 个")
        
        # 强制垃圾回收
        if force_gc:
            gc.collect()
            memory_info = psutil.virtual_memory()
            print(f"  内存使用: {memory_info.percent:.1f}% ({memory_info.used / (1024**3):.1f}GB/{memory_info.total / (1024**3):.1f}GB)")
        
        print(f"[{self.role_name}] 资源清理完成")
    
    def memory_usage(self) -> Dict[str, Any]:
        """获取内存使用情况"""
        import sys
        
        result = {
            "agent": self.role_name,
            "memory_window_size": len(self.memory_window),
            "total_tokens_used": self.total_tokens_used,
            "execution_count": self.execution_count,
            "cache_stats": self.cache.stats() if self.enable_caching else None,
            "task_pool_stats": self.task_pool.stats(),
            "pending_tasks": len(self.pending_tasks),
            "response_cache_size": len(self.response_cache),
            "uptime_seconds": time.time() - self.created_at,
            "idle_seconds": time.time() - self.last_activity
        }
        
        # 估算Python对象内存
        try:
            result["estimated_memory_bytes"] = sys.getsizeof(self)
        except:
            result["estimated_memory_bytes"] = None
        
        return result
    
    def get_stats(self) -> Dict[str, Any]:
        """获取智能体统计信息"""
        with self.lock:
            return {
                "role_name": self.role_name,
                "execution_count": self.execution_count,
                "total_tokens_used": self.total_tokens_used,
                "current_score": self.score,
                "memory_window_size": len(self.memory_window),
                "average_tokens_per_task": self.total_tokens_used / max(1, self.execution_count),
                "performance_metrics": self.performance_metrics.get_stats("task_execution_time"),
                "cache_enabled": self.enable_caching,
                "concurrent_tasks": self.task_pool.max_workers,
                "last_activity": self.last_activity
            }
    
    def performance_report(self) -> Dict[str, Any]:
        """获取详细的性能报告"""
        # 收集各种性能指标
        metrics = {}
        
        # 任务执行指标
        metrics["task_execution"] = self.performance_metrics.get_stats("task_execution_time", window_seconds=600)
        metrics["api_call_time"] = self.performance_metrics.get_stats("api_call_time", window_seconds=600)
        metrics["agent_score_history"] = self.performance_metrics.get_stats("agent_score", window_seconds=3600)
        
        # 系统指标
        memory_info = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        
        metrics["system"] = {
            "memory_percent": memory_info.percent,
            "memory_used_gb": memory_info.used / (1024**3),
            "memory_total_gb": memory_info.total / (1024**3),
            "cpu_percent": cpu_percent,
            "cpu_count": psutil.cpu_count(),
            "load_average": os.getloadavg() if hasattr(os, 'getloadavg') else None
        }
        
        # 缓存指标
        if self.enable_caching:
            metrics["cache"] = self.cache.stats()
        
        # 任务池指标
        metrics["task_pool"] = self.task_pool.stats()
        
        # 健康检查
        metrics["health"] = {
            "is_healthy": self.score >= 60,
            "idle_time_seconds": time.time() - self.last_activity,
            "memory_window_utilization": len(self.memory_window) / self.memory_window.maxlen if hasattr(self.memory_window, 'maxlen') else 0,
            "execution_success_rate": self._calculate_success_rate()
        }
        
        # 警告检查
        warnings = []
        
        # 检查评分
        if self.score < 60:
            warnings.append({
                "level": "critical",
                "type": "low_score",
                "message": f"智能体评分过低: {self.score:.1f}/100",
                "suggestion": "考虑优化角色提示或检查模型API"
            })
        
        # 检查内存使用
        if memory_info.percent > 85:
            warnings.append({
                "level": "warning",
                "type": "high_memory",
                "message": f"内存使用率过高: {memory_info.percent:.1f}%",
                "suggestion": "考虑清理缓存或减少并发任务"
            })
        
        # 检查CPU使用
        if cpu_percent > 80:
            warnings.append({
                "level": "warning",
                "type": "high_cpu",
                "message": f"CPU使用率过高: {cpu_percent:.1f}%",
                "suggestion": "减少并发任务或优化任务复杂度"
            })
        
        # 检查任务执行时间
        task_exec_stats = metrics["task_execution"]
        if task_exec_stats["p95"] > 30:  # P95执行时间超过30秒
            warnings.append({
                "level": "warning",
                "type": "slow_tasks",
                "message": f"任务执行时间过长(P95): {task_exec_stats['p95']:.2f}秒",
                "suggestion": "优化任务复杂度或增加超时时间"
            })
        
        metrics["warnings"] = warnings
        
        return metrics
    
    def _calculate_success_rate(self) -> float:
        """计算任务成功率"""
        # 这是一个简化的实现，实际应该记录成功/失败次数
        # 这里假设评分高的智能体成功率也高
        return self.score / 100.0


    def _calculate_success_rate(self) -> float:
        """计算任务成功率"""
        # 这是一个简化的实现，实际应该记录成功/失败次数
        # 这里假设评分高的智能体成功率也高
        return self.score / 100


# ==================== 错误处理和日志管理系统 ====================
class AgentLogger:
    """智能体日志管理器"""
    
    def __init__(self, log_dir: str = "agent_logs", max_log_size_mb: int = 100, max_log_files: int = 10):
        self.log_dir = log_dir
        self.max_log_size_mb = max_log_size_mb
        self.max_log_files = max_log_files
        
        # 创建日志目录
        os.makedirs(log_dir, exist_ok=True)
        
        # 配置日志
        self._setup_logging()
    
    def _setup_logging(self):
        """配置日志系统"""
        # 创建logger
        self.logger = logging.getLogger("agent_system")
        self.logger.setLevel(logging.INFO)
        self.logger.handlers = []  # 清除已有handler
        
        # 控制台handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_format = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_format)
        self.logger.addHandler(console_handler)
        
        # 文件handler（轮转）
        log_file = os.path.join(self.log_dir, "agent_system.log")
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=self.max_log_size_mb * 1024 * 1024,
            backupCount=self.max_log_files
        )
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s - %(message)s'
        )
        file_handler.setFormatter(file_format)
        self.logger.addHandler(file_handler)
    
    def log_agent_event(self, agent_name: str, event_type: str, data: Dict[str, Any], level: str = "info"):
        """记录智能体事件"""
        log_data = {
            "agent": agent_name,
            "event_type": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        
        log_message = f"[{agent_name}] {event_type}: {json.dumps(data, ensure_ascii=False)}"
        
        if level == "debug":
            self.logger.debug(log_message)
        elif level == "warning":
            self.logger.warning(log_message)
        elif level == "error":
            self.logger.error(log_message)
        elif level == "critical":
            self.logger.critical(log_message)
        else:
            self.logger.info(log_message)
        
        # 同时保存到JSON日志文件
        self._save_to_json_log(agent_name, event_type, log_data)
    
    def _save_to_json_log(self, agent_name: str, event_type: str, data: Dict[str, Any]):
        """保存到JSON格式日志文件"""
        log_file = os.path.join(self.log_dir, f"{agent_name}_{event_type}.jsonl")
        
        try:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(data, ensure_ascii=False) + "\n")
        except Exception as e:
            self.logger.error(f"保存JSON日志失败: {str(e)}")
    
    def get_recent_logs(self, agent_name: Optional[str] = None, 
                       event_type: Optional[str] = None,
                       limit: int = 100) -> List[Dict[str, Any]]:
        """获取最近的日志"""
        logs = []
        
        # 查找相关日志文件
        log_files = []
        for filename in os.listdir(self.log_dir):
            if filename.endswith(".jsonl"):
                if agent_name and agent_name not in filename:
                    continue
                if event_type and event_type not in filename:
                    continue
                log_files.append(os.path.join(self.log_dir, filename))
        
        # 读取日志
        for log_file in sorted(log_files, reverse=True):
            try:
                with open(log_file, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                    for line in reversed(lines):
                        try:
                            log_entry = json.loads(line.strip())
                            logs.append(log_entry)
                            if len(logs) >= limit:
                                return logs
                        except json.JSONDecodeError:
                            continue
            except FileNotFoundError:
                continue
        
        return logs
    
    def cleanup_old_logs(self, days_to_keep: int = 30):
        """清理旧日志"""
        cutoff_time = time.time() - (days_to_keep * 24 * 3600)
        
        for filename in os.listdir(self.log_dir):
            filepath = os.path.join(self.log_dir, filename)
            
            # 检查文件修改时间
            try:
                if os.path.getmtime(filepath) < cutoff_time:
                    os.remove(filepath)
                    self.logger.info(f"删除旧日志文件: {filename}")
            except (OSError, FileNotFoundError):
                continue


class ErrorHandler:
    """统一错误处理器"""
    
    def __init__(self, logger: AgentLogger):
        self.logger = logger
        self.error_counts = defaultdict(int)
        self.last_error_time = {}
        self.error_patterns = {}
    
    def handle_error(self, agent_name: str, error: Exception, context: Dict[str, Any] = None):
        """处理错误"""
        error_type = type(error).__name__
        error_message = str(error)
        
        # 记录错误
        error_id = f"{error_type}_{hashlib.md5(error_message.encode()).hexdigest()[:8]}"
        
        # 更新错误计数
        self.error_counts[error_id] += 1
        
        # 记录最后错误时间
        self.last_error_time[error_id] = time.time()
        
        # 构建错误上下文
        error_context = {
            "agent": agent_name,
            "error_type": error_type,
            "error_message": error_message,
            "error_id": error_id,
            "error_count": self.error_counts[error_id],
            "context": context or {},
            "traceback": traceback.format_exc(),
            "timestamp": datetime.now().isoformat()
        }
        
        # 记录日志
        self.logger.log_agent_event(agent_name, "error", error_context, level="error")
        
        # 错误模式分析
        self._analyze_error_pattern(error_id, error_context)
        
        # 返回处理后的错误信息
        return {
            "status": "error",
            "error_type": error_type,
            "error_message": error_message,
            "error_id": error_id,
            "suggestion": self._get_error_suggestion(error_type, error_message)
        }
    
    def _analyze_error_pattern(self, error_id: str, error_context: Dict[str, Any]):
        """分析错误模式"""
        if error_id not in self.error_patterns:
            self.error_patterns[error_id] = {
                "first_occurrence": error_context["timestamp"],
                "last_occurrence": error_context["timestamp"],
                "count": 1,
                "agents": {error_context["agent"]},
                "contexts": [error_context["context"]]
            }
        else:
            pattern = self.error_patterns[error_id]
            pattern["last_occurrence"] = error_context["timestamp"]
            pattern["count"] += 1
            pattern["agents"].add(error_context["agent"])
            pattern["contexts"].append(error_context["context"])
    
    def _get_error_suggestion(self, error_type: str, error_message: str) -> str:
        """获取错误修复建议"""
        suggestions = {
            "JSONDecodeError": "检查API响应格式，确保返回有效的JSON",
            "ValidationError": "验证输出格式，确保包含必需字段",
            "TimeoutError": "增加超时时间或优化任务复杂度",
            "ConnectionError": "检查网络连接或API服务状态",
            "ValueError": "检查输入参数的有效性",
            "RuntimeError": "检查智能体执行逻辑或资源限制"
        }
        
        # 特定错误消息匹配
        if "timeout" in error_message.lower():
            return "任务执行超时，考虑增加超时时间或减少任务复杂度"
        elif "memory" in error_message.lower():
            return "内存不足，考虑清理缓存或减少并发任务"
        elif "connection" in error_message.lower():
            return "连接失败，检查网络连接和API端点"
        elif "format" in error_message.lower():
            return "格式错误，检查API响应是否符合JSON格式要求"
        
        # 默认建议
        return suggestions.get(error_type, "请检查错误日志获取详细信息")
    
    def get_error_stats(self) -> Dict[str, Any]:
        """获取错误统计"""
        total_errors = sum(self.error_counts.values())
        
        # 最近24小时错误
        cutoff_time = time.time() - 24 * 3600
        recent_errors = {
            error_id: count for error_id, count in self.error_counts.items()
            if self.last_error_time.get(error_id, 0) >= cutoff_time
        }
        
        # 最常见的错误
        most_common = sorted(
            self.error_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        return {
            "total_errors": total_errors,
            "unique_error_types": len(self.error_counts),
            "recent_errors_24h": sum(recent_errors.values()),
            "most_common_errors": [
                {"error_id": error_id, "count": count}
                for error_id, count in most_common
            ],
            "error_patterns_summary": [
                {
                    "error_id": error_id,
                    "first_occurrence": pattern["first_occurrence"],
                    "last_occurrence": pattern["last_occurrence"],
                    "count": pattern["count"],
                    "affected_agents": list(pattern["agents"])
                }
                for error_id, pattern in self.error_patterns.items()
            ]
        }
    
    def should_retry(self, error_id: str, max_retries: int = 3) -> bool:
        """判断是否应该重试"""
        error_count = self.error_counts.get(error_id, 0)
        return error_count <= max_retries
    
    def clear_old_errors(self, days_to_keep: int = 7):
        """清理旧的错误记录"""
        cutoff_time = time.time() - (days_to_keep * 24 * 3600)
        
        # 清理旧错误
        old_error_ids = [
            error_id for error_id, last_time in self.last_error_time.items()
            if last_time < cutoff_time
        ]
        
        for error_id in old_error_ids:
            if error_id in self.error_counts:
                del self.error_counts[error_id]
            if error_id in self.last_error_time:
                del self.last_error_time[error_id]
            if error_id in self.error_patterns:
                del self.error_patterns[error_id]


# ==================== 2. 强制结构化校验层（增强版） ====================
class OutputValidator:
    """Pydantic/Parser层 - 强制结构化校验"""
    
    def __init__(self, strict_mode: bool = True):
        self.strict_mode = strict_mode
        self.validation_history = []
        
    def validate(self, agent_output: Dict[str, Any], expected_schema: Optional[str] = None) -> Dict[str, Any]:
        """
        验证智能体输出
        
        参数:
            agent_output: 智能体返回的字典
            expected_schema: 期望的JSON Schema（可选）
        
        返回:
            验证结果字典
        """
        validation_id = hashlib.md5(str(agent_output).encode()).hexdigest()[:8]
        timestamp = datetime.now().isoformat()
        
        # 基础验证
        checks = []
        
        # 1. 必需字段检查
        required_fields = ["status", "content"]
        for field in required_fields:
            if field in agent_output:
                checks.append(f"必需字段 '{field}': ✓")
            else:
                checks.append(f"必需字段 '{field}': ✗ 缺失")
        
        # 2. 状态值检查
        status = agent_output.get("status", "").lower()
        if status in ["success", "error"]:
            checks.append(f"状态值 '{status}': ✓")
        else:
            checks.append(f"状态值 '{status}': ✗ 无效")
        
        # 3. 内容非空检查
        content = agent_output.get("content", "")
        if content and len(str(content).strip()) > 10:
            checks.append("内容非空: ✓")
        else:
            checks.append("内容非空: ✗ 太短或为空")
        
        # 4. 代码块检查（如果有）
        code_blocks = agent_output.get("code_blocks", [])
        if code_blocks:
            valid_blocks = 0
            for i, code in enumerate(code_blocks):
                if isinstance(code, str) and len(code.strip()) > 20:
                    valid_blocks += 1
            checks.append(f"代码块有效性: {valid_blocks}/{len(code_blocks)} ✓")
        else:
            checks.append("代码块: ⚠️ 无代码块")
        
        # 5. 如果使用Pydantic，进行模式验证
        if HAS_PYDANTIC and expected_schema:
            try:
                # 这里可以扩展为动态Pydantic模型验证
                checks.append("Pydantic模式验证: ✓ (占位)")
            except ValidationError as e:
                checks.append(f"Pydantic模式验证: ✗ {str(e)[:100]}")
        
        # 计算验证分数
        total_checks = len(checks)
        passed_checks = sum(1 for check in checks if "✓" in check or "⚠️" in check)
        validation_score = (passed_checks / total_checks) * 100 if total_checks > 0 else 0
        
        # 构建验证结果
        result = {
            "validation_id": validation_id,
            "timestamp": timestamp,
            "passed": validation_score >= 80.0,  # 80分及格
            "score": round(validation_score, 1),
            "checks": checks,
            "agent_output_keys": list(agent_output.keys()),
            "content_preview": str(content)[:200] + ("..." if len(str(content)) > 200 else "")
        }
        
        # 记录验证历史
        self.validation_history.append(result)
        
        # 如果验证失败且严格模式，抛出异常
        if self.strict_mode and not result["passed"]:
            error_msg = f"输出验证失败 (分数: {result['score']})"
            for check in checks:
                if "✗" in check:
                    error_msg += f"\n  - {check}"
            raise ValueError(error_msg)
        
        return result
    
    def get_validation_stats(self) -> Dict[str, Any]:
        """获取验证统计信息"""
        if not self.validation_history:
            return {"total_validations": 0, "average_score": 0.0}
        
        total = len(self.validation_history)
        avg_score = sum(r["score"] for r in self.validation_history) / total
        passed_count = sum(1 for r in self.validation_history if r["passed"])
        
        return {
            "total_validations": total,
            "passed_count": passed_count,
            "failed_count": total - passed_count,
            "average_score": round(avg_score, 1),
            "pass_rate": round((passed_count / total) * 100, 1) if total > 0 else 0
        }


# ==================== 3. 状态机流转控制 ====================
class WorkflowStateMachine:
    """工作流状态机 - 绝对禁止智能体之间自由聊天！"""
    
    # 定义状态
    STATES = {
        "IDLE": "空闲",
        "PM_ANALYSIS": "产品经理分析需求",
        "ARCH_DESIGN": "架构师设计架构", 
        "DEV_IMPLEMENTATION": "开发实施",
        "QA_TESTING": "测试验证",
        "COMPLETED": "完成",
        "FAILED": "失败"
    }
    
    # 状态转移矩阵
    TRANSITIONS = {
        "IDLE": ["PM_ANALYSIS"],
        "PM_ANALYSIS": ["ARCH_DESIGN", "FAILED"],
        "ARCH_DESIGN": ["DEV_IMPLEMENTATION", "FAILED"],
        "DEV_IMPLEMENTATION": ["QA_TESTING", "FAILED"],
        "QA_TESTING": ["COMPLETED", "DEV_IMPLEMENTATION", "FAILED"],
        "COMPLETED": ["IDLE"],
        "FAILED": ["IDLE"]
    }
    
    def __init__(self, agents: Dict[str, BaseAgent]):
        """
        参数:
            agents: 智能体字典 {角色名: 智能体实例}
        """
        self.agents = agents
        self.current_state = "IDLE"
        self.state_history = []
        self.workflow_data = {}
        self.start_time = time.time()
        
        # 验证必需智能体
        required_agents = ["PM_Agent", "Arch_Agent", "Dev_Agent", "QA_Agent"]
        missing = [agent for agent in required_agents if agent not in agents]
        if missing:
            raise ValueError(f"缺少必需智能体: {missing}")
    
    def transition_to(self, new_state: str):
        """状态转移"""
        if new_state not in self.TRANSITIONS.get(self.current_state, []):
            raise ValueError(
                f"无效状态转移: {self.current_state} -> {new_state}\n"
                f"允许的转移: {self.TRANSITIONS.get(self.current_state, [])}"
            )
        
        # 记录状态转移
        transition_record = {
            "from": self.current_state,
            "to": new_state,
            "timestamp": datetime.now().isoformat(),
            "duration_seconds": time.time() - (self.state_history[-1]["timestamp"] if self.state_history else self.start_time)
        }
        
        print(f"[状态机] {self.STATES[self.current_state]} → {self.STATES[new_state]}")
        
        # 执行状态退出清理
        self._cleanup_state(self.current_state)
        
        # 更新状态
        self.current_state = new_state
        self.state_history.append(transition_record)
        
        # 执行状态进入初始化
        self._initialize_state(new_state)
    
    def _cleanup_state(self, state: str):
        """状态退出清理 - 显式清理显存/上下文缓存"""
        print(f"[状态机] 清理 {self.STATES[state]} 状态资源...")
        
        if state == "PM_ANALYSIS":
            # 清理PM Agent的记忆
            if "PM_Agent" in self.agents:
                self.agents["PM_Agent"].reset_memory()
                
        elif state == "ARCH_DESIGN":
            # 清理Arch Agent的记忆
            if "Arch_Agent" in self.agents:
                self.agents["Arch_Agent"].reset_memory()
                
        elif state == "DEV_IMPLEMENTATION":
            # 清理Dev Agent的记忆
            if "Dev_Agent" in self.agents:
                self.agents["Dev_Agent"].reset_memory()
                
        elif state == "QA_TESTING":
            # 清理QA Agent的记忆
            if "QA_Agent" in self.agents:
                self.agents["QA_Agent"].reset_memory()
        
        # 强制垃圾回收
        import gc
        gc.collect()
        print(f"[状态机] 垃圾回收完成，释放内存")
    
    def _initialize_state(self, state: str):
        """状态进入初始化"""
        print(f"[状态机] 初始化 {self.STATES[state]} 状态...")
        
        if state == "PM_ANALYSIS":
            # 准备PM分析
            if not os.path.exists("user_requirements.txt"):
                print("警告: user_requirements.txt 不存在，创建示例文件")
                with open("user_requirements.txt", "w", encoding='utf-8') as f:
                    f.write("# 用户需求\n开发一个微型多智能体框架，要求硬核工程实现")
            
        elif state == "ARCH_DESIGN":
            # 确保prd.md存在
            if not os.path.exists("prd.md"):
                raise FileNotFoundError("prd.md 不存在，无法进行架构设计")
                
        elif state == "DEV_IMPLEMENTATION":
            # 确保architecture.json存在
            if not os.path.exists("architecture.json"):
                raise FileNotFoundError("architecture.json 不存在，无法进行开发")
    
    def main_loop(self):
        """主循环 - 硬核状态机执行"""
        print("=" * 60)
        print("开始多智能体工作流执行")
        print("=" * 60)
        
        try:
            # 状态 1：PM_Agent分析需求
            self.transition_to("PM_ANALYSIS")
            pm_agent = self.agents["PM_Agent"]
            
            print(f"\n[阶段1] PM_Agent 读取需求...")
            with open("user_requirements.txt", "r", encoding='utf-8') as f:
                requirements = f.read()
            
            task = f"分析以下用户需求并生成产品需求文档(PRD):\n\n{requirements}"
            pm_result = pm_agent.execute_task(task)
            
            # 保存PRD
            prd_content = pm_result.get("content", "")
            with open("prd.md", "w", encoding='utf-8') as f:
                f.write(prd_content)
            
            if "code_blocks" in pm_result:
                for i, code in enumerate(pm_result["code_blocks"], 1):
                    with open(f"prd_code_block_{i}.py", "w", encoding='utf-8') as f:
                        f.write(code)
            
            print(f"[PM_Agent] PRD生成完成，保存到 prd.md")
            self.workflow_data["prd"] = prd_content[:500] + "..." if len(prd_content) > 500 else prd_content
            
            # 状态 2：Arch_Agent设计架构
            self.transition_to("ARCH_DESIGN")
            arch_agent = self.agents["Arch_Agent"]
            
            print(f"\n[阶段2] Arch_Agent 设计架构...")
            with open("prd.md", "r", encoding='utf-8') as f:
                prd_content = f.read()
            
            task = f"基于以下PRD设计系统架构:\n\n{prd_content[:2000]}..."
            arch_result = arch_agent.execute_task(task)
            
            # 保存架构设计
            arch_content = arch_result.get("content", "")
            arch_json = {
                "architecture": arch_content,
                "components": arch_result.get("code_blocks", []),
                "design_decisions": arch_result.get("validation_checks", []),
                "generated_by": "Arch_Agent",
                "timestamp": datetime.now().isoformat()
            }
            
            with open("architecture.json", "w", encoding='utf-8') as f:
                json.dump(arch_json, f, indent=2, ensure_ascii=False)
            
            print(f"[Arch_Agent] 架构设计完成，保存到 architecture.json")
            self.workflow_data["architecture"] = arch_content[:500] + "..." if len(arch_content) > 500 else arch_content
            
            # 状态 3：Dev_Agent实施开发
            self.transition_to("DEV_IMPLEMENTATION")
            dev_agent = self.agents["Dev_Agent"]
            
            print(f"\n[阶段3] Dev_Agent 实施开发...")
            with open("architecture.json", "r", encoding='utf-8') as f:
                arch_data = json.load(f)
            
            task = f"基于以下架构设计实施代码开发:\n\n{json.dumps(arch_data, indent=2)[:3000]}..."
            dev_result = dev_agent.execute_task(task)
            
            # 保存开发成果
            dev_content = dev_result.get("content", "")
            dev_code_blocks = dev_result.get("code_blocks", [])
            
            # 保存所有代码块
            for i, code in enumerate(dev_code_blocks, 1):
                filename = f"implemented_module_{i}.py"
                with open(filename, "w", encoding='utf-8') as f:
                    f.write(code)
                print(f"[Dev_Agent] 代码块保存到 {filename}")
            
            # 保存开发报告
            dev_report = {
                "implementation_summary": dev_content,
                "generated_files": [f"implemented_module_{i}.py" for i in range(1, len(dev_code_blocks)+1)],
                "code_blocks_count": len(dev_code_blocks),
                "total_loc": sum(len(code.split('\n')) for code in dev_code_blocks),
                "timestamp": datetime.now().isoformat()
            }
            
            with open("implementation_report.json", "w", encoding='utf-8') as f:
                json.dump(dev_report, f, indent=2, ensure_ascii=False)
            
            self.workflow_data["implementation"] = {
                "summary": dev_content[:300] + "..." if len(dev_content) > 300 else dev_content,
                "files_count": len(dev_code_blocks),
                "dev_agent_score": dev_agent.score
            }
            
            # 状态 4：QA_Agent测试验证
            self.transition_to("QA_TESTING")
            qa_agent = self.agents["QA_Agent"]
            
            print(f"\n[阶段4] QA_Agent 测试验证...")
            task = f"""
测试以下开发成果:
1. 架构设计: {self.workflow_data.get('architecture', 'N/A')}
2. 实现总结: {self.workflow_data['implementation']['summary']}
3. 生成文件数: {self.workflow_data['implementation']['files_count']}

请进行全面的质量测试，包括：
- 代码语法检查
- 功能完整性验证
- 架构一致性检查
- 潜在问题识别
"""
            qa_result = qa_agent.execute_task(task)
            
            # 分析测试结果
            qa_content = qa_result.get("content", "")
            
            # 提取Bug数量（简单统计）
            bug_keywords = ["bug", "error", "issue", "problem", "defect", "fault", "flaw"]
            bug_count = 0
            for keyword in bug_keywords:
                bug_count += qa_content.lower().count(keyword)
            
            self.workflow_data["qa_testing"] = {
                "test_summary": qa_content[:400] + "..." if len(qa_content) > 400 else qa_content,
                "estimated_bugs": bug_count,
                "qa_agent_score": qa_agent.score
            }
            
            print(f"[QA_Agent] 测试完成，发现约 {bug_count} 个潜在问题")
            
            # 根据测试结果决定下一步
            if bug_count <= 3:
                self.transition_to("COMPLETED")
                print(f"\n✅ 工作流完成！质量良好 (Bug数: {bug_count})")
            else:
                print(f"\n⚠️ 发现较多问题 (Bug数: {bug_count})，需要重新开发")
                
                # 触发淘汰机制
                from agency_core import evaluate_and_evolve
                evaluate_and_evolve(self.agents, bug_count, qa_content)
                
                # 返回开发阶段
                self.transition_to("DEV_IMPLEMENTATION")
                print("重新进入开发阶段...")
                # 这里可以递归调用或进入新的循环
            
        except Exception as e:
            print(f"\n❌ 工作流执行失败: {str(e)}")
            self.transition_to("FAILED")
            raise
    
    def get_workflow_stats(self) -> Dict[str, Any]:
        """获取工作流统计信息"""
        total_time = time.time() - self.start_time
        
        agent_stats = {}
        for name, agent in self.agents.items():
            agent_stats[name] = agent.get_stats()
        
        return {
            "current_state": self.current_state,
            "state_description": self.STATES[self.current_state],
            "total_states_visited": len(self.state_history),
            "total_execution_time_seconds": round(total_time, 2),
            "agent_statistics": agent_stats,
            "workflow_data_summary": {
                "prd_generated": "prd.md" in self.workflow_data,
                "architecture_designed": "architecture" in self.workflow_data,
                "implementation_done": "implementation" in self.workflow_data,
                "qa_testing_completed": "qa_testing" in self.workflow_data
            }
        }


# ==================== 4. 评分与淘汰代码化 ====================
def evaluate_and_evolve(agents: Dict[str, BaseAgent], bug_count: int, qa_report: str):
    """
    评分与淘汰代码化 - RLAIF via Code
    
    硬核规则：
    当QA_Agent返回的Bug数量 > 3时，触发score < 60条件
    直接从内存中del dev_agent（淘汰进程）
    并重新实例化Dev_Agent(prompt=new_prompt)
    """
    print(f"\n{'='*60}")
    print("执行智能体淘汰与进化机制")
    print(f"{'='*60}")
    
    # 获取Dev Agent
    if "Dev_Agent" not in agents:
        print("⚠️ Dev_Agent 不存在，跳过淘汰机制")
        return
    
    dev_agent = agents["Dev_Agent"]
    current_score = dev_agent.score
    
    print(f"[淘汰机制] Dev_Agent 当前评分: {current_score:.1f}, Bug数量: {bug_count}")
    
    # 触发条件：Bug数量 > 3 且 评分 < 60
    should_eliminate = bug_count > 3 and current_score < 60
    
    if should_eliminate:
        print(f"🚨 触发淘汰条件: Bug数({bug_count}) > 3 且 评分({current_score:.1f}) < 60")
        
        # 1. 记录被淘汰智能体的信息
        eliminated_stats = dev_agent.get_stats()
        elimination_record = {
            "agent_name": "Dev_Agent",
            "elimination_reason": f"低质量输出 (评分: {current_score}, Bug数: {bug_count})",
            "final_stats": eliminated_stats,
            "qa_report_snippet": qa_report[:500] + "..." if len(qa_report) > 500 else qa_report,
            "elimination_timestamp": datetime.now().isoformat()
        }
        
        # 保存淘汰记录
        with open("agent_elimination_log.json", "a", encoding='utf-8') as f:
            json.dump(elimination_record, f, indent=2, ensure_ascii=False)
            f.write("\n")
        
        print(f"[淘汰机制] 已记录淘汰日志到 agent_elimination_log.json")
        
        # 2. 从内存中删除Dev Agent
        del agents["Dev_Agent"]
        print("[淘汰机制] Dev_Agent 已从内存中移除")
        
        # 3. 强制垃圾回收
        import gc
        gc.collect()
        print("[淘汰机制] 内存垃圾回收完成")
        
        # 4. 分析失败原因，生成改进后的提示
        failure_analysis = f"""
原Dev_Agent因以下原因被淘汰:
1. 代码质量评分: {current_score}/100
2. 发现的Bug数量: {bug_count}
3. QA报告摘要: {qa_report[:300]}...

失败原因分析:
- 代码规范不符合要求
- 功能实现不完整
- 错误处理不充分
- 架构一致性差

改进要求:
1. 严格遵守代码规范
2. 实现完整的功能逻辑
3. 添加充分的错误处理
4. 确保与架构设计一致
5. 提高代码可读性和可维护性
"""
        
        # 5. 创建改进后的角色提示
        improved_prompt = f"""# Dev_Agent 改进版角色设定

## 核心教训（从上一次淘汰中学习）
{failure_analysis}

## 严格改进要求
1. **代码质量第一**：每次提交的代码必须通过基础语法检查
2. **功能完整性**：实现必须100%覆盖需求
3. **错误处理**：每个函数都必须有异常处理
4. **可维护性**：代码必须清晰、有注释、模块化
5. **性能意识**：避免不必要的计算和内存使用

## 输出格式（更加严格）
```json
{{
    "status": "success",
    "content": "实现总结（必须包含技术细节）",
    "code_blocks": ["完整可执行的代码"],
    "validation_checks": ["语法检查: 通过", "功能测试: 通过", "性能评估: 通过"],
    "quality_metrics": {{
        "code_coverage": ">90%",
        "error_handling": "完备",
        "performance_score": ">85/100"
    }},
    "lessons_applied": ["从上次淘汰中学到的教训1", "教训2"]
}}
```

## 淘汰警告
注意：如果再次出现评分<60且Bug>3的情况，将被永久淘汰！
"""
        
        # 保存改进后的提示
        improved_prompt_path = "dev_agent_improved_prompt.md"
        with open(improved_prompt_path, "w", encoding='utf-8') as f:
            f.write(improved_prompt)
        
        print(f"[淘汰机制] 已生成改进版角色提示: {improved_prompt_path}")
        
        # 6. 重新实例化Dev Agent（需要外部提供model_api）
        print("[淘汰机制] 等待重新实例化 Dev_Agent...")
        print("提示: 需要传入 model_api 参数来创建新的 Dev_Agent 实例")
        
        # 这里不实际创建，因为需要model_api参数
        # new_dev_agent = BaseAgent("Dev_Agent", improved_prompt_path, model_api)
        # agents["Dev_Agent"] = new_dev_agent
        
        print("[淘汰机制] 淘汰与进化流程完成")
        
    else:
        print(f"[淘汰机制] 未触发淘汰条件，当前评分: {current_score:.1f}, Bug数: {bug_count}")
        
        # 提供改进建议
        if bug_count > 0:
            suggestions = []
            if bug_count > 5:
                suggestions.append("Bug数量较多，建议加强单元测试")
            if current_score < 70:
                suggestions.append("评分较低，建议改进代码质量")
            
            if suggestions:
                print(f"[淘汰机制] 改进建议: {'; '.join(suggestions)}")


# ==================== 使用示例 ====================
def example_model_api(prompt: str) -> str:
    """
    示例模型API函数 - 实际使用时需要替换为真实的大模型API
    
    这里模拟一个返回结构化JSON的模型
    """
    # 模拟处理时间
    time.sleep(0.5)
    
    # 根据提示内容生成模拟响应
    if "PM_Agent" in prompt:
        response = {
            "status": "success",
            "content": "已成功分析用户需求，生成产品需求文档。文档包含需求分析、功能列表、技术约束和验收标准。",
            "code_blocks": ["# PRD内容示例\n需求优先级排序算法..."],
            "validation_checks": ["需求完整性: 通过", "可行性分析: 通过"],
            "execution_time": "约45秒"
        }
    elif "Arch_Agent" in prompt:
        response = {
            "status": "success", 
            "content": "系统架构设计完成。采用微服务架构，包含API网关、智能体服务、任务队列、状态管理和监控系统。",
            "code_blocks": ["# 架构图代码\nclass ArchitectureDiagram:", "# 组件定义\nclass Components:"],
            "validation_checks": ["可扩展性: 通过", "性能评估: 通过", "安全性: 通过"],
            "execution_time": "约60秒"
        }
    elif "Dev_Agent" in prompt:
        response = {
            "status": "success",
            "content": "代码实现完成。实现了智能体基类、状态机、验证器和淘汰机制。所有模块通过单元测试。",
            "code_blocks": [
                "class BaseAgent:\n    def execute_task(self):\n        # 实现代码\n        pass",
                "class WorkflowStateMachine:\n    def main_loop(self):\n        # 主循环代码\n        pass"
            ],
            "validation_checks": ["语法检查: 通过", "功能测试: 通过", "性能测试: 通过"],
            "execution_time": "约120秒"
        }
    elif "QA_Agent" in prompt:
        response = {
            "status": "success",
            "content": "质量测试完成。发现2个潜在问题：1) 内存泄漏风险，2) 异常处理不完整。已提供修复建议。",
            "code_blocks": ["# 测试报告\ndef run_tests():\n    # 测试代码\n    pass"],
            "validation_checks": ["代码覆盖率: 92%", "性能基准: 通过", "安全扫描: 通过"],
            "execution_time": "约90秒"
        }
    else:
        response = {
            "status": "error",
            "content": "未知任务类型",
            "code_blocks": [],
            "validation_checks": ["任务识别: 失败"],
            "execution_time": "约5秒"
        }
    
    return json.dumps(response, indent=2, ensure_ascii=False)


def main():
    """主函数 - 演示框架使用"""
    print("=" * 60)
    print("微型多智能体框架 - 硬核工程实现")
    print("=" * 60)
    
    # 1. 创建智能体
    print("\n1. 创建智能体实例...")
    
    # 创建角色提示文件
    roles = ["PM_Agent", "Arch_Agent", "Dev_Agent", "QA_Agent"]
    for role in roles:
        prompt_file = f"{role.lower()}_prompt.md"
        if not os.path.exists(prompt_file):
            with open(prompt_file, "w", encoding='utf-8') as f:
                f.write(f"# {role} 角色设定\n\n这是{role}的默认角色提示，请根据实际需求修改。")
    
    # 创建智能体实例
    agents = {}
    for role in roles:
        prompt_file = f"{role.lower()}_prompt.md"
        agents[role] = BaseAgent(role, prompt_file, example_model_api)
        print(f"  ✓ 创建 {role}")
    
    # 2. 创建验证器
    print("\n2. 创建输出验证器...")
    validator = OutputValidator(strict_mode=True)
    print(f"  ✓ 创建验证器 (严格模式: {validator.strict_mode})")
    
    # 3. 创建状态机
    print("\n3. 创建工作流状态机...")
    workflow = WorkflowStateMachine(agents)
    print(f"  ✓ 创建状态机，初始状态: {workflow.STATES[workflow.current_state]}")
    
    # 4. 创建示例需求文件
    print("\n4. 准备示例需求文件...")
    with open("user_requirements.txt", "w", encoding='utf-8') as f:
        f.write("""# 用户需求

开发一个微型多智能体协作系统，要求：

## 功能需求
1. 支持至少4种角色智能体（产品经理、架构师、开发者、测试员）
2. 实现严格的状态机工作流控制
3. 智能体输出必须为结构化JSON格式
4. 包含智能体质量评估和淘汰机制

## 技术需求
1. 使用Python 3.9+开发
2. 模块化设计，易于扩展
3. 包含完整的错误处理
4. 提供API接口供外部调用

## 质量要求
1. 代码注释率 > 30%
2. 单元测试覆盖率 > 80%
3. 最大响应时间 < 5秒
4. 内存使用 < 500MB
""")
    print("  ✓ 创建 user_requirements.txt")
    
    # 5. 执行工作流
    print("\n5. 开始执行工作流...")
    try:
        workflow.main_loop()
        
        # 获取最终统计
        stats = workflow.get_workflow_stats()
        print(f"\n{'='*60}")
        print("工作流执行统计:")
        print(f"{'='*60}")
        print(f"最终状态: {stats['current_state']} ({stats['state_description']})")
        print(f"总执行时间: {stats['total_execution_time_seconds']}秒")
        print(f"访问状态数: {stats['total_states_visited']}")
        
        # 显示智能体统计
        print(f"\n智能体统计:")
        for agent_name, agent_stats in stats['agent_statistics'].items():
            print(f"  {agent_name}:")
            print(f"    执行次数: {agent_stats['execution_count']}")
            print(f"    Token使用: {agent_stats['total_tokens_used']}")
            print(f"    当前评分: {agent_stats['current_score']:.1f}/100")
        
    except Exception as e:
        print(f"\n❌ 工作流执行异常: {str(e)}")
    
    print(f"\n{'='*60}")
    print("框架演示完成")
    print("=" * 60)


if __name__ == "__main__":
    main()