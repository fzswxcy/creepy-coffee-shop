# HTML转图片默认方案配置

## 生效日期
2026-02-27

## 默认方案：Python PIL渲染脚本
由于wkhtmltoimage在OpenCloudOS 9.4上的依赖问题无法解决，使用Python替代方案。

## 核心组件
1. **主脚本**: `/root/.openclaw/workspace/render_news.py`
2. **依赖库**: 
   - Pillow (PIL Fork): 图片处理
   - html2text: HTML转纯文本
3. **字体**: DejaVu Sans (系统默认)

## 执行命令
```bash
cd /root/.openclaw/workspace
python3 render_news.py
```

## 输出文件
- 输入: `/root/.openclaw/workspace/global_news_YYYYMMDD.html`
- 输出: `/root/.openclaw/workspace/global_news_YYYYMMDD.png`

## 验证标准
1. 图片文件大小 > 0
2. 图片格式为PNG
3. 图片尺寸符合要求（约800x1200像素）

## 使用示例
```python
# 在任务中调用
import subprocess
result = subprocess.run([
    "python3", "/root/.openclaw/workspace/render_news.py"
], capture_output=True, text=True)
```

## 备用方案
如果Python方案失败，提供以下备用选项：
1. 返回HTML文件路径
2. 提供纯文本摘要
3. 使用ImageMagick基础文本转图片

## 历史记录
- 2026-02-27: 首次创建，成功生成新闻日报图片
- 问题解决: wkhtmltoimage依赖libssl.so.1.1和libcrypto.so.1.1
- 替代方案: Python PIL渲染方案

## 性能指标
- 渲染时间: < 5秒
- 图片质量: 中等（文本清晰，布局简单）
- 中文字体支持: 有限（依赖系统字体）

---
配置生成：NIKO AI助手
最后更新时间：2026-02-27 18:59 CST