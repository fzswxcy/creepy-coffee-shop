#!/bin/bash

# 微信小游戏美术资源精灵图制作脚本
# 使用方法: ./精灵图制作脚本.sh [选项]

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo -e "${GREEN}检查依赖...${NC}"
    
    if ! command -v convert &> /dev/null; then
        echo -e "${RED}错误: ImageMagick 未安装${NC}"
        echo "安装命令: sudo apt install imagemagick"
        exit 1
    fi
    
    if ! command -v pngquant &> /dev/null; then
        echo -e "${YELLOW}警告: pngquant 未安装，将跳过PNG优化${NC}"
    fi
    
    if ! command -v cwebp &> /dev/null; then
        echo -e "${YELLOW}警告: WebP 工具未安装，将跳过WebP转换${NC}"
    fi
    
    echo -e "${GREEN}依赖检查完成${NC}"
}

# 创建精灵图目录结构
create_structure() {
    echo -e "${GREEN}创建目录结构...${NC}"
    
    mkdir -p spritesheets/raw
    mkdir -p spritesheets/processed
    mkdir -p spritesheets/output
    
    mkdir -p spritesheets/raw/ui
    mkdir -p spritesheets/raw/characters
    mkdir -p spritesheets/raw/items
    mkdir -p spritesheets/raw/effects
    
    echo -e "${GREEN}目录结构创建完成${NC}"
}

# 图片预处理
preprocess_images() {
    echo -e "${GREEN}预处理图片...${NC}"
    
    # 遍历所有图片文件
    find spritesheets/raw -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read file; do
        filename=$(basename "$file")
        dir=$(dirname "$file")
        subdir=$(basename "$dir")
        
        # 创建对应的processed目录
        mkdir -p "spritesheets/processed/$subdir"
        
        # 标准化图片
        echo "处理: $filename"
        
        # 转换格式为PNG（如果支持透明通道）
        if [[ "$file" == *.png ]]; then
            # 保持PNG格式
            convert "$file" -resize 2048x2048\> -quality 100 "spritesheets/processed/$subdir/${filename%.*}.png"
        else
            # 转换JPG/JPEG为PNG
            convert "$file" -resize 2048x2048\> -quality 100 "spritesheets/processed/$subdir/${filename%.*}.png"
        fi
        
        # 优化PNG（如果有pngquant）
        if command -v pngquant &> /dev/null; then
            pngquant --force --output "spritesheets/processed/$subdir/${filename%.*}.png" --quality 60-80 "spritesheets/processed/$subdir/${filename%.*}.png"
        fi
        
        # 转换为WebP（如果有cwebp）
        if command -v cwebp &> /dev/null; then
            cwebp -q 80 "spritesheets/processed/$subdir/${filename%.*}.png" -o "spritesheets/processed/$subdir/${filename%.*}.webp"
        fi
    done
    
    echo -e "${GREEN}图片预处理完成${NC}"
}

# 创建精灵图
create_spritesheet() {
    local category=$1
    local padding=10
    
    echo -e "${GREEN}创建精灵图: $category${NC}"
    
    # 检查是否有该类型的图片
    if [ -d "spritesheets/processed/$category" ] && [ "$(ls -A spritesheets/processed/$category/*.png 2>/dev/null)" ]; then
        # 获取所有PNG文件
        files=(spritesheets/processed/$category/*.png)
        
        if [ ${#files[@]} -eq 0 ]; then
            echo -e "${YELLOW}警告: $category 目录没有PNG文件${NC}"
            return
        fi
        
        # 估算精灵图大小（简单的平方根估算）
        num_files=${#files[@]}
        grid_size=$(echo "sqrt($num_files)" | bc)
        grid_size=$((grid_size + 1))
        
        # 假设每个图片最大256x256
        sprite_size=$((grid_size * 256 + padding * (grid_size + 1)))
        
        # 创建精灵图
        montage "spritesheets/processed/$category/*.png" \
                -geometry 256x256+${padding}+${padding} \
                -tile ${grid_size}x${grid_size} \
                -background none \
                "spritesheets/output/${category}_spritesheet.png"
        
        echo -e "${GREEN}精灵图创建完成: spritesheets/output/${category}_spritesheet.png${NC}"
        
        # 生成对应的JSON配置文件
        generate_config "$category" "${grid_size}" "${padding}"
    else
        echo -e "${YELLOW}跳过: $category 目录不存在或为空${NC}"
    fi
}

# 生成精灵图配置文件
generate_config() {
    local category=$1
    local grid_size=$2
    local padding=$3
    
    local output_file="spritesheets/output/${category}_config.json"
    
    echo -e "${GREEN}生成配置文件: $output_file${NC}"
    
    cat > "$output_file" << EOF
{
  "meta": {
    "image": "${category}_spritesheet.png",
    "format": "RGBA8888",
    "size": { "w": $(($grid_size * 256 + padding * ($grid_size + 1))), "h": $(($grid_size * 256 + padding * ($grid_size + 1))) },
    "scale": 1
  },
  "frames": {
EOF
    
    # 遍历所有图片文件，生成帧配置
    local index=0
    for file in spritesheets/processed/$category/*.png; do
        if [ -f "$file" ]; then
            filename=$(basename "$file" .png)
            local row=$((index / grid_size))
            local col=$((index % grid_size))
            local x=$((col * (256 + padding) + padding))
            local y=$((row * (256 + padding) + padding))
            
            if [ $index -ne 0 ]; then
                echo "    ," >> "$output_file"
            fi
            
            cat >> "$output_file" << EOF
    "${filename}": {
      "frame": { "x": $x, "y": $y, "w": 256, "h": 256 },
      "rotated": false,
      "trimmed": false,
      "spriteSourceSize": { "x": 0, "y": 0, "w": 256, "h": 256 },
      "sourceSize": { "w": 256, "h": 256 }
    }
EOF
            index=$((index + 1))
        fi
    done
    
    cat >> "$output_file" << EOF
  }
}
EOF
    
    echo -e "${GREEN}配置文件生成完成${NC}"
}

# 优化精灵图
optimize_spritesheets() {
    echo -e "${GREEN}优化精灵图...${NC}"
    
    # 优化所有精灵图
    for spritesheet in spritesheets/output/*.png; do
        if [ -f "$spritesheet" ]; then
            echo "优化: $(basename "$spritesheet")"
            
            # 使用pngquant压缩
            if command -v pngquant &> /dev/null; then
                pngquant --force --output "$spritesheet" --quality 60-80 "$spritesheet"
            fi
            
            # 转换为WebP
            if command -v cwebp &> /dev/null; then
                webp_file="${spritesheet%.*}.webp"
                cwebp -q 80 "$spritesheet" -o "$webp_file"
            fi
        fi
    done
    
    echo -e "${GREEN}精灵图优化完成${NC}"
}

# 生成报告
generate_report() {
    echo -e "${GREEN}生成资源报告...${NC}"
    
    local report_file="spritesheets/资源优化报告_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 美术资源优化报告

## 生成时间
$(date)

## 资源统计

### 原始资源
EOF
    
    # 统计原始资源
    echo "```" >> "$report_file"
    find spritesheets/raw -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -exec ls -lh {} \; | \
        awk '{total += $5} END {print "文件数量:", NR, "\n总大小:", total/1024/1024" MB"}' >> "$report_file"
    echo "```" >> "$report_file"
    
    cat >> "$report_file" << EOF

### 处理后资源
EOF
    
    # 统计处理后资源
    echo "```" >> "$report_file"
    find spritesheets/processed -type f \( -name "*.png" -o -name "*.webp" \) -exec ls -lh {} \; | \
        awk '{total += $5} END {print "文件数量:", NR, "\n总大小:", total/1024/1024" MB"}' >> "$report_file"
    echo "```" >> "$report_file"
    
    cat >> "$report_file" << EOF

### 精灵图资源
EOF
    
    # 统计精灵图资源
    echo "```" >> "$report_file"
    find spritesheets/output -type f \( -name "*.png" -o -name "*.webp" \) -exec ls -lh {} \; | \
        awk '{total += $5} END {print "文件数量:", NR, "\n总大小:", total/1024/1024" MB"}' >> "$report_file"
    echo "```" >> "$report_file"
    
    cat >> "$report_file" << EOF

## 优化效果

### 压缩率对比
EOF
    
    # 计算压缩率
    original_size=$(find spritesheets/raw -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -exec stat -f%z {} \; | awk '{sum+=$1} END {print sum}')
    processed_size=$(find spritesheets/processed -type f \( -name "*.png" -o -name "*.webp" \) -exec stat -f%z {} \; | awk '{sum+=$1} END {print sum}')
    spritesheet_size=$(find spritesheets/output -type f \( -name "*.png" -o -name "*.webp" \) -exec stat -f%z {} \; | awk '{sum+=$1} END {print sum}')
    
    if [ "$original_size" -gt 0 ]; then
        compression_rate=$((100 - spritesheet_size * 100 / original_size))
        echo "原始大小: $((original_size/1024/1024)) MB" >> "$report_file"
        echo "精灵图大小: $((spritesheet_size/1024/1024)) MB" >> "$report_file"
        echo "压缩率: ${compression_rate}%" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

## 性能建议

1. **HTTP请求减少**: 精灵图合并将减少 \$(find spritesheets/raw -name "*.png" | wc -l) 个图片请求

2. **内存使用优化**: 
   - 使用精灵图可减少GPU纹理切换
   - WebP格式可进一步减少内存占用

3. **加载时间优化**:
   - 精灵图预加载可加快游戏启动
   - 按需加载未合并的大资源

## 文件清单

### 生成的精灵图
EOF
    
    # 列出所有精灵图
    for spritesheet in spritesheets/output/*.png; do
        if [ -f "$spritesheet" ]; then
            size=$(stat -f%z "$spritesheet")
            echo "- $(basename "$spritesheet") ($((size/1024)) KB)" >> "$report_file"
            
            # WebP版本
            webp_file="${spritesheet%.*}.webp"
            if [ -f "$webp_file" ]; then
                webp_size=$(stat -f%z "$webp_file")
                echo "  - WebP版本: $(basename "$webp_file") ($((webp_size/1024)) KB)" >> "$report_file"
            fi
            
            # JSON配置文件
            json_file="${spritesheet%.*}_config.json"
            if [ -f "$json_file" ]; then
                echo "  - 配置文件: $(basename "$json_file")" >> "$report_file"
            fi
        fi
    done
    
    echo -e "${GREEN}报告生成完成: $report_file${NC}"
}

# 主函数
main() {
    echo -e "${YELLOW}=== 微信小游戏美术资源精灵图制作工具 ===${NC}"
    echo
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check)
                check_dependencies
                exit 0
                ;;
            --create-structure)
                create_structure
                exit 0
                ;;
            --preprocess)
                preprocess_images
                exit 0
                ;;
            --generate-all)
                create_structure
                preprocess_images
                create_spritesheet "ui"
                create_spritesheet "characters"
                create_spritesheet "items"
                create_spritesheet "effects"
                optimize_spritesheets
                generate_report
                exit 0
                ;;
            --help)
                echo "使用方法: $0 [选项]"
                echo
                echo "选项:"
                echo "  --check             检查依赖"
                echo "  --create-structure  创建目录结构"
                echo "  --preprocess        预处理图片"
                echo "  --generate-all      执行完整流程"
                echo "  --help              显示帮助信息"
                exit 0
                ;;
            *)
                echo -e "${RED}未知选项: $1${NC}"
                echo "使用 --help 查看帮助"
                exit 1
                ;;
        esac
    done
    
    # 默认执行完整流程
    check_dependencies
    create_structure
    preprocess_images
    create_spritesheet "ui"
    create_spritesheet "characters"
    create_spritesheet "items"
    create_spritesheet "effects"
    optimize_spritesheets
    generate_report
    
    echo -e "${GREEN}=== 所有任务完成 ===${NC}"
    echo "生成的精灵图保存在: spritesheets/output/"
    echo "报告文件: spritesheets/资源优化报告_*.md"
}

# 执行主函数
main "$@"