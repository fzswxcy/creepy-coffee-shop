#!/bin/bash

# 邮件处理自动化指南
# 作者：NIKO - 超级大大王的AI助手
# 创建时间：2026-03-02

echo "=== 邮件处理自动化指南 ==="
echo ""
echo "由于当前是服务器环境，无法启动浏览器，请按照以下步骤操作："
echo ""

echo "步骤1：在您的桌面电脑上安装必要的工具"
echo "------------------------------------------------"
echo "1. 安装 Chrome/Chromium 或 Firefox 浏览器"
echo "2. 确保您有图形界面环境"
echo ""

echo "步骤2：登录腾讯企业邮"
echo "------------------------------------------------"
echo "1. 打开终端，运行以下命令启动浏览器："
echo "   google-chrome --no-sandbox https://exmail.qq.com"
echo "   或"
echo "   firefox https://exmail.qq.com"
echo "2. 登录您的企业邮箱账户"
echo ""

echo "步骤3：创建附件目录结构"
echo "------------------------------------------------"
echo "在终端中运行以下命令："
echo ""
echo "# 创建附件下载根目录"
echo "mkdir -p ~/Downloads/Email_Attachments"
echo ""
echo "# 创建分类子目录"
echo "mkdir -p ~/Downloads/Email_Attachments/PDF文档"
echo "mkdir -p ~/Downloads/Email_Attachments/办公文档"
echo "mkdir -p ~/Downloads/Email_Attachments/图片资料"
echo "mkdir -p ~/Downloads/Email_Attachments/其他"
echo ""
echo "# 设置权限"
echo "chmod 755 ~/Downloads/Email_Attachments"
echo ""

echo "步骤4：邮件处理流程"
echo "------------------------------------------------"
echo "1. 手动登录邮箱，检查未读邮件"
echo "2. 下载所有附件到 ~/Downloads/Email_Attachments/"
echo "3. 运行附件分类脚本（见下文）"
echo ""

echo "步骤5：附件分类自动化脚本"
echo "------------------------------------------------"
echo "将以下脚本保存为 classify_attachments.sh："
echo ""
cat << 'EOF'
#!/bin/bash

# 附件分类脚本
ATTACHMENT_DIR="$HOME/Downloads/Email_Attachments"

echo "开始分类附件..."

# 移动PDF文件
find "$ATTACHMENT_DIR" -maxdepth 1 -type f -name "*.pdf" -exec mv {} "$ATTACHMENT_DIR/PDF文档/" \; 2>/dev/null
echo "✓ 已移动PDF文件"

# 移动办公文档
find "$ATTACHMENT_DIR" -maxdepth 1 -type f \( -name "*.doc" -o -name "*.docx" -o -name "*.xls" -o -name "*.xlsx" -o -name "*.ppt" -o -name "*.pptx" \) \
  -exec mv {} "$ATTACHMENT_DIR/办公文档/" \; 2>/dev/null
echo "✓ 已移动办公文档"

# 移动图片文件
find "$ATTACHMENT_DIR" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.bmp" -o -name "*.svg" \) \
  -exec mv {} "$ATTACHMENT_DIR/图片资料/" \; 2>/dev/null
echo "✓ 已移动图片文件"

# 移动其他文件（排除已分类的）
find "$ATTACHMENT_DIR" -maxdepth 1 -type f ! -path "$ATTACHMENT_DIR/PDF文档/*" ! -path "$ATTACHMENT_DIR/办公文档/*" ! -path "$ATTACHMENT_DIR/图片资料/*" \
  ! -name "classify_attachments.sh" ! -name "email_processing_guide.sh" \
  -exec mv {} "$ATTACHMENT_DIR/其他/" \; 2>/dev/null
echo "✓ 已移动其他文件"

echo ""
echo "附件分类完成！"
echo "PDF文档: $(ls -1 "$ATTACHMENT_DIR/PDF文档/" 2>/dev/null | wc -l) 个文件"
echo "办公文档: $(ls -1 "$ATTACHMENT_DIR/办公文档/" 2>/dev/null | wc -l) 个文件"
echo "图片资料: $(ls -1 "$ATTACHMENT_DIR/图片资料/" 2>/dev/null | wc -l) 个文件"
echo "其他: $(ls -1 "$ATTACHMENT_DIR/其他/" 2>/dev/null | wc -l) 个文件"
EOF
echo ""
echo "步骤6：邮件摘要报告模板"
echo "------------------------------------------------"
echo "手动查看邮件后，使用以下格式记录摘要："
echo ""
echo "# 邮件摘要报告"
echo "日期: $(date '+%Y-%m-%d %H:%M:%S')"
echo "未读邮件数量: [填写数量]"
echo ""
echo "## 邮件列表"
echo "1. [重要程度] 发件人：邮件主题"
echo "   - 关键内容摘要"
echo "   - 附件：有/无"
echo "   - 需要回复：是/否"
echo ""
echo "## 需要回复的邮件"
echo "1. 发件人：主题"
echo "   草稿：[在此处填写回复内容]"
echo ""
echo "=== 脚本结束 ==="
echo ""
echo "注意事项："
echo "1. 请确保在执行前备份重要附件"
echo "2. 分类脚本会移动文件，不会删除"
echo "3. 建议定期清理附件目录"