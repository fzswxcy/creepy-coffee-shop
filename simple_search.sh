#!/bin/bash

echo "开始搜索OpenClaw相关新闻..."
echo "================================================================"

# 创建结果文件
RESULT_FILE="search_results_$(date +%Y%m%d_%H%M%S).txt"
echo "OpenClaw与中国科技公司相关新闻搜索报告" > $RESULT_FILE
echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')" >> $RESULT_FILE
echo "================================================================" >> $RESULT_FILE

# 搜索函数
search_company() {
    local company=$1
    local query=$2
    local encoded_query=$(echo "$query" | sed 's/ /%20/g')
    
    echo "" >> $RESULT_FILE
    echo "================================================================" >> $RESULT_FILE
    echo "公司: $company" >> $RESULT_FILE
    echo "搜索词: $query" >> $RESULT_FILE
    echo "================================================================" >> $RESULT_FILE
    
    echo ""
    echo "搜索: $company ($query)"
    echo "------------------------------------------------"
    
    # 1. 搜索百度新闻
    echo "1. 百度新闻搜索..."
    echo "【百度新闻】" >> $RESULT_FILE
    BAIDU_RESULT=$(curl -s -H "User-Agent: Mozilla/5.0" "https://www.baidu.com/s?wd=$encoded_query&tn=news" 2>/dev/null)
    
    # 提取百度结果
    echo "$BAIDU_RESULT" | grep -i "news-title" | head -10 | while read line; do
        if [[ $line =~ href=\"([^\"]+)\"[^>]*>([^<]+) ]]; then
            url=${BASH_REMATCH[1]}
            title=${BASH_REMATCH[2]}
            echo "标题: $title" >> $RESULT_FILE
            echo "链接: $url" >> $RESULT_FILE
            echo "---" >> $RESULT_FILE
        fi
    done
    
    if [ -z "$(echo "$BAIDU_RESULT" | grep -i "news-title")" ]; then
        echo "未找到相关新闻" >> $RESULT_FILE
    fi
    
    sleep 2
    
    # 2. 搜索Google新闻（通过curl）
    echo "2. Google搜索..."
    echo "" >> $RESULT_FILE
    echo "【Google搜索】" >> $RESULT_FILE
    GOOGLE_RESULT=$(curl -s -H "User-Agent: Mozilla/5.0" "https://www.google.com/search?q=$encoded_query&tbm=nws" 2>/dev/null)
    
    # 提取Google结果
    echo "$GOOGLE_RESULT" | grep -o '<a[^>]*href="[^"]*"[^>]*>[^<]*</a>' | grep -i openclaw | head -5 | while read line; do
        if [[ $line =~ href=\"([^\"]+)\"[^>]*>([^<]+) ]]; then
            url=${BASH_REMATCH[1]}
            title=${BASH_REMATCH[2]}
            echo "标题: $title" >> $RESULT_FILE
            echo "链接: $url" >> $RESULT_FILE
            echo "---" >> $RESULT_FILE
        fi
    done
    
    if [ -z "$(echo "$GOOGLE_RESULT" | grep -i openclaw)" ]; then
        echo "未找到相关新闻" >> $RESULT_FILE
    fi
    
    sleep 2
    
    # 3. 搜索CSDN
    echo "3. CSDN搜索..."
    echo "" >> $RESULT_FILE
    echo "【CSDN技术论坛】" >> $RESULT_FILE
    CSDN_RESULT=$(curl -s -H "User-Agent: Mozilla/5.0" "https://so.csdn.net/so/search?q=$encoded_query" 2>/dev/null)
    
    # 提取CSDN结果
    echo "$CSDN_RESULT" | grep -o '<a[^>]*class="title"[^>]*>[^<]*</a>' | head -5 | while read line; do
        if [[ $line =~ \">([^<]+) ]]; then
            title=${BASH_REMATCH[1]}
            echo "标题: $title" >> $RESULT_FILE
            echo "链接: https://so.csdn.net/so/search?q=$encoded_query" >> $RESULT_FILE
            echo "---" >> $RESULT_FILE
        fi
    done
    
    if [ -z "$(echo "$CSDN_RESULT" | grep -o '<a[^>]*class="title"[^>]*>[^<]*</a>')" ]; then
        echo "未找到相关内容" >> $RESULT_FILE
    fi
    
    sleep 2
}

# 搜索各大公司
search_company "腾讯" "腾讯 openclaw"
search_company "阿里" "阿里 openclaw"
search_company "百度" "百度 openclaw" 
search_company "华为" "华为 openclaw"
search_company "字节跳动" "字节跳动 openclaw"

# 添加总结
echo "" >> $RESULT_FILE
echo "================================================================" >> $RESULT_FILE
echo "搜索总结" >> $RESULT_FILE
echo "================================================================" >> $RESULT_FILE
echo "搜索完成时间: $(date '+%Y-%m-%d %H:%M:%S')" >> $RESULT_FILE
echo "搜索平台: 百度新闻、Google新闻、CSDN技术论坛" >> $RESULT_FILE
echo "搜索方法: 真实网络请求(HTTP GET)" >> $RESULT_FILE
echo "搜索工具: curl命令" >> $RESULT_FILE

echo ""
echo "搜索结果已保存到: $RESULT_FILE"
echo "================================================================"