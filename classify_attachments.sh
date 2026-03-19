#!/bin/bash

# 邮件附件智能分类脚本
# 作者：NIKO - 超级大大王的AI助手
# 创建时间：2026-03-02

# 设置附件下载根目录
ATTACHMENT_DIR="${1:-/home/computeruse/Downloads/Email_Attachments}"

echo "=== 邮件附件智能分类系统 ==="
echo "附件目录: $ATTACHMENT_DIR"
echo ""

# 检查目录是否存在
if [ ! -d "$ATTACHMENT_DIR" ]; then
    echo "❌ 错误：附件目录不存在"
    echo "正在创建目录结构..."
    mkdir -p "$ATTACHMENT_DIR"/{PDF文档,办公文档,图片资料,其他}
    echo "✓ 目录创建完成"
fi

# 确保分类子目录存在
for subdir in "PDF文档" "办公文档" "图片资料" "其他"; do
    if [ ! -d "$ATTACHMENT_DIR/$subdir" ]; then
        mkdir -p "$ATTACHMENT_DIR/$subdir"
    fi
done

echo "开始扫描附件文件..."
echo ""

# 统计初始文件数量
total_files=$(find "$ATTACHMENT_DIR" -maxdepth 1 -type f 2>/dev/null | wc -l)
echo "发现 $total_files 个待分类文件"
echo ""

if [ $total_files -eq 0 ]; then
    echo "📭 没有发现需要分类的附件"
    exit 0
fi

# 1. 分类PDF文件
pdf_count=$(find "$ATTACHMENT_DIR" -maxdepth 1 -type f -name "*.pdf" 2>/dev/null | wc -l)
if [ $pdf_count -gt 0 ]; then
    echo "📄 发现 $pdf_count 个PDF文件"
    find "$ATTACHMENT_DIR" -maxdepth 1 -type f -name "*.pdf" -exec mv -v {} "$ATTACHMENT_DIR/PDF文档/" \; 2>/dev/null
    echo "✓ PDF文件分类完成"
fi

# 2. 分类办公文档
office_extensions=("*.doc" "*.docx" "*.xls" "*.xlsx" "*.ppt" "*.pptx" "*.odt" "*.ods" "*.odp")
office_pattern=""
for ext in "${office_extensions[@]}"; do
    office_pattern="$office_pattern -o -name \"$ext\""
done
office_pattern=${office_pattern# -o }

office_count=0
if [ -n "$office_pattern" ]; then
    office_count=$(eval "find \"$ATTACHMENT_DIR\" -maxdepth 1 -type f \( $office_pattern \) 2>/dev/null | wc -l")
fi

if [ $office_count -gt 0 ]; then
    echo "📊 发现 $office_count 个办公文档"
    eval "find \"$ATTACHMENT_DIR\" -maxdepth 1 -type f \( $office_pattern \) -exec mv -v {} \"$ATTACHMENT_DIR/办公文档/\" \\; 2>/dev/null"
    echo "✓ 办公文档分类完成"
fi

# 3. 分类图片文件
image_extensions=("*.jpg" "*.jpeg" "*.png" "*.gif" "*.bmp" "*.svg" "*.webp" "*.tiff" "*.tif")
image_pattern=""
for ext in "${image_extensions[@]}"; do
    image_pattern="$image_pattern -o -name \"$ext\""
done
image_pattern=${image_pattern# -o }

image_count=0
if [ -n "$image_pattern" ]; then
    image_count=$(eval "find \"$ATTACHMENT_DIR\" -maxdepth 1 -type f \( $image_pattern \) 2>/dev/null | wc -l")
fi

if [ $image_count -gt 0 ]; then
    echo "🖼️  发现 $image_count 个图片文件"
    eval "find \"$ATTACHMENT_DIR\" -maxdepth 1 -type f \( $image_pattern \) -exec mv -v {} \"$ATTACHMENT_DIR/图片资料/\" \\; 2>/dev/null"
    echo "✓ 图片文件分类完成"
fi

# 4. 分类其他文件（排除脚本文件）
other_files=$(find "$ATTACHMENT_DIR" -maxdepth 1 -type f ! -name "classify_attachments.sh" ! -name "email_processing_guide.sh" ! -name "mail_summary_template.txt" 2>/dev/null | wc -l)

if [ $other_files -gt 0 ]; then
    echo "📦 发现 $other_files 个其他类型文件"
    find "$ATTACHMENT_DIR" -maxdepth 1 -type f ! -name "classify_attachments.sh" ! -name "email_processing_guide.sh" ! -name "mail_summary_template.txt" \
        -exec mv -v {} "$ATTACHMENT_DIR/其他/" \; 2>/dev/null
    echo "✓ 其他文件分类完成"
fi

echo ""
echo "=== 分类结果统计 ==="
echo "📁 目录结构："
ls -la "$ATTACHMENT_DIR"/

echo ""
echo "📊 分类统计："
echo "PDF文档: $(ls -1 "$ATTACHMENT_DIR/PDF文档/" 2>/dev/null | wc -l) 个文件"
echo "办公文档: $(ls -1 "$ATTACHMENT_DIR/办公文档/" 2>/dev/null | wc -l) 个文件"
echo "图片资料: $(ls -1 "$ATTACHMENT_DIR/图片资料/" 2>/dev/null | wc -l) 个文件"
echo "其他: $(ls -1 "$ATTACHMENT_DIR/其他/" 2>/dev/null | wc -l) 个文件"

echo ""
echo "✅ 附件分类完成！"
echo ""
echo "提示：运行 'ls -R $ATTACHMENT_DIR' 查看详细的文件列表"