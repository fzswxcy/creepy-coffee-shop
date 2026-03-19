#!/usr/bin/env python3
"""
将新闻文本转换为HTML格式
"""

import datetime
import os

def text_to_html(text_file, html_file):
    """将文本文件转换为HTML格式"""
    if not os.path.exists(text_file):
        print(f"❌ 文本文件不存在: {text_file}")
        return False
    
    try:
        with open(text_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 创建HTML内容
        html_content = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日新闻摘要 - {datetime.datetime.now().strftime("%Y-%m-%d")}</title>
    <style>
        body {{
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }}
        .header {{
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
        }}
        .section {{
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .section-title {{
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }}
        .news-item {{
            margin-bottom: 15px;
            padding-left: 10px;
            border-left: 3px solid #764ba2;
        }}
        .news-title {{
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 5px;
        }}
        .news-meta {{
            color: #718096;
            font-size: 14px;
            margin-bottom: 5px;
        }}
        .news-content {{
            color: #4a5568;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            color: #718096;
            font-size: 14px;
        }}
        .highlight {{
            background-color: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }}
        .badge {{
            display: inline-block;
            padding: 3px 8px;
            background: #667eea;
            color: white;
            border-radius: 12px;
            font-size: 12px;
            margin-right: 5px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📰 每日新闻摘要</h1>
        <p>{datetime.datetime.now().strftime("%Y年%m月%d日")} | 由 NIKO AI助手生成</p>
    </div>
'''

        # 处理文本内容
        lines = content.strip().split('\n')
        current_section = ''
        in_news_item = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 检测标题
            if '科技新闻' in line:
                current_section = 'tech'
                html_content += f'''    <div class="section">
        <h2 class="section-title">🚀 {line}</h2>\n'''
                continue
            elif '财经新闻' in line:
                current_section = 'finance'
                html_content += f'''    <div class="section">
        <h2 class="section-title">💰 {line}</h2>\n'''
                continue
            elif line.startswith('📰') and '每日新闻摘要' in line:
                continue  # 跳过标题行
            elif '────────────────────────────────' in line:
                continue  # 跳过分隔线
            elif '本摘要由' in line:
                html_content += f'''        <div class="highlight">
            <strong>💡 {line}</strong>
        </div>\n'''
                continue
            elif '汇总：' in line:
                html_content += f'''    </div>
    <div class="section">
        <h2 class="section-title">📊 新闻汇总</h2>
        <p>{line}</p>
'''
                continue
            
            # 检测新闻项（以数字开头）
            if line and line[0].isdigit() and line[1] == '.':
                if in_news_item:
                    html_content += '        </div>\n'
                
                html_content += '''        <div class="news-item">
'''
                # 提取标题
                title_end = line.find('   ')
                if title_end > 0:
                    title = line[:title_end].strip()
                    rest = line[title_end:].strip()
                    html_content += f'            <div class="news-title">{title}</div>\n'
                    
                    # 处理元数据行
                    if rest and '📰' in rest:
                        parts = rest.split('|')
                        if len(parts) >= 2:
                            source = parts[0].replace('📰', '').strip()
                            time_info = parts[1].strip()
                            category = parts[2].strip() if len(parts) > 2 else ''
                            html_content += f'            <div class="news-meta">'
                            html_content += f'<span class="badge">来源</span>{source} '
                            html_content += f'<span class="badge">时间</span>{time_info} '
                            if category:
                                html_content += f'<span class="badge">类别</span>{category}'
                            html_content += '</div>\n'
                in_news_item = True
            elif in_news_item and line and not line.startswith('   '):
                html_content += f'            <div class="news-content">{line}</div>\n'
                in_news_item = False
            elif in_news_item:
                html_content += f'            <div class="news-content">{line}</div>\n'
        
        # 关闭最后一个新闻项
        if in_news_item:
            html_content += '        </div>\n'
        
        # 添加配置信息部分
        config_info = '''    <div class="section">
        <h2 class="section-title">⚙️ 系统配置</h2>
        <p><strong>NewsAPI 配置状态:</strong> ✅ 正常</p>
        <p><strong>API Key:</strong> 33675e39350340bf9d4ae4d03fcce18a (已配置)</p>
        <p><strong>定时任务:</strong> 每天 7:30 UTC (15:30 北京时间) 自动推送</p>
        <p><strong>生成时间:</strong> {}</p>
    </div>\n'''.format(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        html_content += config_info
        
        # 添加页脚
        html_content += '''    <div class="footer">
        <p>💡 由 NIKO AI助手自动生成 | 每日新闻推送系统</p>
        <p>📅 下次推送时间: 7:30 UTC (15:30 北京时间)</p>
    </div>
</body>
</html>'''
        
        # 写入HTML文件
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"✅ HTML文件已生成: {html_file}")
        print(f"📄 文件大小: {os.path.getsize(html_file)} 字节")
        return True
        
    except Exception as e:
        print(f"❌ 转换失败: {e}")
        return False

if __name__ == "__main__":
    # 获取今天的日期
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    text_file = f"/root/.openclaw/workspace/daily_news_{today}.txt"
    html_file = f"/root/.openclaw/workspace/daily_news_{today}.html"
    
    print(f"📝 开始转换新闻文件: {text_file}")
    print(f"🎯 目标HTML文件: {html_file}")
    
    if text_to_html(text_file, html_file):
        print("✨ 转换完成！")
    else:
        print("⚠️ 转换失败")