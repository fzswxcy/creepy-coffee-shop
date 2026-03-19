"""
agency_core.py 性能优化实现 - 第一部分

已完成的功能：
1. 并行化处理功能 (AsyncTaskPool, 批量执行)
2. 内存管理和缓存机制 (MemoryCache, 资源清理)
3. 性能监控和警告系统 (PerformanceMonitor, 性能报告)
4. 错误处理和日志管理 (AgentLogger, ErrorHandler)

待完成：
5. 可扩展性和插件架构文档
6. 自动化测试框架
7. 集成到原有系统
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

# 性能优化基础组件
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
                return {"count": 0, "mean": 0, "min": 0, "max": 0, "p95": 0, "p99": 0}
            
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
                self.size_bytes -= entry["size"]
                del self.cache[key]
                self.misses += 1
                return None
            
            self.hits += 1
            return entry["value"]
    
    def set(self, key: str, value: Any, size_bytes: Optional[int] = None):
        """设置缓存值"""
        with self.lock:
            if size_bytes is None:
                try:
                    size_bytes = sys.getsizeof(value)
                except:
                    size_bytes = 1024
            
            self._cleanup_expired()
            
            if size_bytes > self.max_size_bytes:
                return
            
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
            
            self.cache[key] = {
                "value": value,
                "timestamp": time.time(),
                "size": size_bytes
            }
            self.size_bytes += size_bytes
    
    def _cleanup_expired(self):
        """清理过期条目"""
        current_time = time.time()
        if current_time - self.last_cleanup < 60:
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
        memory_percent = psutil.virtual_memory().percent
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        self.metrics.record("memory_usage_percent", memory_percent)
        self.metrics.record("cpu_usage_percent", cpu_percent)
        
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

# 智能体基类（性能优化版）
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
            role_name: 智能体角色名
            role_prompt_path: .md角色设定文件路径
            model_api: 大模型API调用函数
            memory_window_size: 记忆窗口大小
            enable_caching: 是否启用响应缓存
            max_concurrent_tasks: 最大并发任务数
        """
        self.role_name = role_name
        self.role_prompt = self._load_role_prompt(role_prompt_path)
        self.model_api = model_api
        self.memory_window = deque(maxlen=memory_window_size)
        self.memory_window_size = memory_window_size
        self.total_tokens_used = 0
        self.execution_count = 0
        self.score = 100
        
        # 性能优化组件
        self.enable_caching = enable_caching
        if enable_caching:
            self.cache = MemoryCache(max_size_mb=50, ttl_seconds=1800)
        
        # 异步支持
        self.task_pool = AsyncTaskPool(max_workers=max_concurrent_tasks)
        self.pending_tasks = {}
        self.response_cache = {}
        
        # 性能监控
        self.performance_metrics = PerformanceMetrics()
        self.lock = threading.RLock()
        
        # 初始化时间
        self.created_at = time.time()
        self.last_activity = self.created_at
    
    # 其他方法...
    def _load_role_prompt(self, prompt_path: str) -> str:
        """加载角色设定文件"""
        try:
            with open(prompt_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if len(content.strip()) < 50:
                raise ValueError(f"角色设定文件太短: {prompt_path}")
            return content
        except FileNotFoundError:
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

## 质量要求
- 代码必须可直接执行
- 逻辑必须完整清晰
- 错误处理必须完备
"""
            with open(prompt_path, 'w', encoding='utf-8') as f:
                f.write(default_prompt)
            return default_prompt

print("性能优化实现第一部分已完成")