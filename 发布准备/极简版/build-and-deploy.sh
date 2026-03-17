#!/bin/bash

# 微恐咖啡厅极简版构建部署脚本
# 今天上线版本一键部署

set -e  # 遇到错误退出

echo "🚀 微恐咖啡厅极简版 - 今日上线部署脚本"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要工具
check_prerequisites() {
    print_info "检查构建环境..."
    
    # 检查Cocos Creator
    if ! command -v cocos &> /dev/null; then
        print_error "Cocos Creator CLI未找到"
        print_info "请安装Cocos Creator并配置环境变量"
        exit 1
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js未找到"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        print_error "npm未找到"
        exit 1
    fi
    
    print_success "构建环境检查通过"
}

# 清理构建目录
clean_build_directory() {
    print_info "清理旧的构建文件..."
    
    if [ -d "./build-quick" ]; then
        rm -rf ./build-quick
        print_success "旧构建目录已清理"
    else
        print_info "无旧构建目录"
    fi
}

# 安装依赖
install_dependencies() {
    print_info "安装项目依赖..."
    
    if [ -f "package.json" ]; then
        npm install
        print_success "依赖安装完成"
    else
        print_warning "未找到package.json，跳过依赖安装"
    fi
}

# 构建微信小游戏
build_wechat_game() {
    print_info "开始构建微信小游戏..."
    
    # 使用极简版构建配置
    cocos build --platform wechatgame --config ./发布准备/极简版/quick-build.json --debug
    
    if [ $? -eq 0 ]; then
        print_success "构建成功！"
    else
        print_error "构建失败"
        exit 1
    fi
}

# 检查构建结果
check_build_result() {
    print_info "检查构建结果..."
    
    local build_dir="./build-quick/wechatgame-quick"
    
    if [ ! -d "$build_dir" ]; then
        print_error "构建目录不存在: $build_dir"
        exit 1
    fi
    
    # 检查关键文件
    local required_files=(
        "game.js"
        "game.json"
        "project.config.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$build_dir/$file" ]; then
            print_warning "缺少文件: $file"
        else
            print_info "✓ $file"
        fi
    done
    
    # 计算构建大小
    local total_size=$(du -sh "$build_dir" | cut -f1)
    print_info "构建大小: $total_size"
    
    # 检查是否超过微信限制（4MB）
    local size_kb=$(du -sk "$build_dir" | cut -f1)
    local max_size_kb=4096  # 4MB
    
    if [ $size_kb -gt $max_size_kb ]; then
        print_warning "构建大小超过微信限制（4MB）"
        print_info "实际大小: ${size_kb}KB, 限制: ${max_size_kb}KB"
    else
        print_success "构建大小符合微信限制"
    fi
}

# 创建部署包
create_deployment_package() {
    print_info "创建部署包..."
    
    local build_dir="./build-quick/wechatgame-quick"
    local package_name="微恐咖啡厅-极简版-$(date +%Y%m%d-%H%M%S).zip"
    
    if [ ! -d "$build_dir" ]; then
        print_error "构建目录不存在"
        return 1
    fi
    
    # 创建ZIP包
    cd "$build_dir"
    zip -r "../../$package_name" .
    cd - > /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "部署包创建成功: $package_name"
        print_info "包大小: $(du -h "$package_name" | cut -f1)"
    else
        print_error "创建部署包失败"
    fi
}

# 生成部署说明
generate_deployment_guide() {
    print_info "生成部署说明..."
    
    local guide_file="./DEPLOYMENT_GUIDE.md"
    
    cat > "$guide_file" << EOF
# 🚀 微恐咖啡厅极简版部署指南

## 📦 构建信息
- **构建时间**: $(date)
- **构建版本**: 1.0.0-quick
- **目标平台**: 微信小游戏
- **构建目录**: ./build-quick/wechatgame-quick

## 📱 微信小游戏部署步骤

### 1. 准备微信开发者工具
1. 下载并安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册微信小程序开发者账号
3. 获取小游戏AppID

### 2. 导入项目
1. 打开微信开发者工具
2. 点击"导入项目"
3. 选择构建目录: \`./build-quick/wechatgame-quick\`
4. 输入你的AppID
5. 点击"导入"

### 3. 测试运行
1. 在开发者工具中点击"编译"
2. 在模拟器中测试游戏功能
3. 点击"预览"生成二维码
4. 用微信扫描二维码在真机上测试

### 4. 提交审核
1. 点击"上传"
2. 填写版本信息
3. 上传到微信平台
4. 等待审核（通常1-3个工作日）

## 🔧 测试清单

### 核心功能测试
- [ ] 游戏启动正常
- [ ] 制作咖啡功能正常
- [ ] 服务顾客功能正常
- [ ] 游戏计分正常
- [ ] 重新开始功能正常

### 微信功能测试
- [ ] 微信登录正常（可选）
- [ ] 微信分享正常
- [ ] 微信支付正常（可选）
- [ ] 广告展示正常（可选）

### 性能测试
- [ ] 加载时间 < 3秒
- [ ] 内存占用 < 200MB
- [ ] 帧率稳定 > 30FPS
- [ ] 无崩溃情况

## 📊 技术规格
- **引擎**: Cocos Creator 3.x
- **脚本语言**: TypeScript
- **目标大小**: < 4MB
- **支持设备**: iOS 10+, Android 8+
- **网络要求**: 可离线运行

## 🐛 常见问题

### Q1: 构建失败
**解决方案**:
- 检查Cocos Creator版本（需要3.8+）
- 检查Node.js版本（需要14+）
- 清理构建目录后重试

### Q2: 导入微信开发者工具失败
**解决方案**:
- 检查AppID是否正确
- 检查构建目录是否完整
- 确保项目名称不包含特殊字符

### Q3: 游戏运行卡顿
**解决方案**:
- 降低游戏画质设置
- 优化资源加载
- 减少同时显示的UI元素

### Q4: 审核被拒
**解决方案**:
- 检查内容是否符合微信规范
- 确保无侵权内容
- 完善游戏说明和截图

## 📞 技术支持
如有问题，请联系：
- 开发者: 微恐咖啡厅团队
- 创建时间: $(date)

---

**祝您部署顺利！☕**
EOF
    
    print_success "部署指南已生成: $guide_file"
}

# 主函数
main() {
    echo -e "${BLUE}=======================================${NC}"
    echo -e "${BLUE}   微恐咖啡厅极简版 - 今日上线部署   ${NC}"
    echo -e "${BLUE}=======================================${NC}"
    echo ""
    
    # 执行步骤
    check_prerequisites
    clean_build_directory
    install_dependencies
    build_wechat_game
    check_build_result
    create_deployment_package
    generate_deployment_guide
    
    echo ""
    echo -e "${GREEN}=======================================${NC}"
    echo -e "${GREEN}           部署完成！                 ${NC}"
    echo -e "${GREEN}=======================================${NC}"
    echo ""
    echo "🎮 下一步操作："
    echo "1. 使用微信开发者工具导入构建目录"
    echo "2. 测试游戏功能"
    echo "3. 提交微信审核"
    echo ""
    echo "📁 构建目录: ./build-quick/wechatgame-quick"
    echo "📄 部署指南: ./DEPLOYMENT_GUIDE.md"
    echo ""
    
    # 检查token状态（与智能断点恢复系统集成）
    print_info "检查智能断点恢复系统状态..."
    if [ -f "check_token_status.js" ]; then
        node check_token_status.js
    fi
}

# 执行主函数
main "$@"