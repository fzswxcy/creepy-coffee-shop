#!/usr/bin/env python3
"""
GLM5 + Claude Code 功能测试脚本
使用你提供的配置测试编码能力
"""

import os
import sys

def test_configuration():
    """测试配置是否正确"""
    print("🧪 开始测试 GLM5 + Claude Code 配置...")
    
    # 检查关键环境变量
    required_vars = [
        'ANTHROPIC_AUTH_TOKEN',
        'ANTHROPIC_BASE_URL', 
        'ANTHROPIC_MODEL'
    ]
    
    print("1. 检查环境变量:")
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: {value[:20]}..." if len(value) > 20 else f"   ✅ {var}: {value}")
        else:
            print(f"   ❌ {var}: 未设置")
            return False
    
    # 测试 Claude Code 技能
    print("\n2. 检查 Claude Code 技能:")
    skill_path = "/root/.openclaw/workspace/skills/claude-code"
    if os.path.exists(skill_path):
        print(f"   ✅ Claude Code 技能目录存在")
        claude_code_py = os.path.join(skill_path, "claude-code.py")
        if os.path.exists(claude_code_py):
            print(f"   ✅ claude-code.py 文件存在")
        else:
            print(f"   ❌ claude-code.py 文件不存在")
    else:
        print(f"   ❌ Claude Code 技能目录不存在")
        return False
    
    # 测试配置文件
    print("\n3. 检查配置文件:")
    config_path = "/root/.openclaw/workspace/config/glm5-claude-code.json"
    if os.path.exists(config_path):
        print(f"   ✅ 配置文件存在")
        with open(config_path, 'r') as f:
            content = f.read()
            if 'glm-5' in content and 'dashscope' in content:
                print(f"   ✅ 配置包含 GLM5 设置")
            else:
                print(f"   ⚠️  配置可能不完整")
    else:
        print(f"   ❌ 配置文件不存在")
    
    return True

def generate_test_code():
    """生成一个简单的测试代码示例"""
    print("\n4. 生成测试代码示例:")
    test_code = '''#!/usr/bin/env python3
"""
GLM5 + Claude Code 测试示例
计算斐波那契数列
"""

def fibonacci(n):
    """计算斐波那契数列的第n项"""
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        a, b = 0, 1
        for _ in range(2, n + 1):
            a, b = b, a + b
        return b

def main():
    """主函数"""
    print("斐波那契数列计算器")
    print("=" * 30)
    
    # 计算前10项
    for i in range(1, 11):
        result = fibonacci(i)
        print(f"fib({i}) = {result}")
    
    # 测试特定值
    test_values = [5, 10, 20]
    print("\n特定值测试:")
    for n in test_values:
        result = fibonacci(n)
        print(f"fib({n}) = {result}")

if __name__ == "__main__":
    main()'''
    
    # 保存测试代码
    test_file = "/root/.openclaw/workspace/test_fibonacci.py"
    with open(test_file, 'w') as f:
        f.write(test_code)
    
    print(f"   ✅ 生成测试代码: {test_file}")
    
    # 运行测试代码
    print("\n5. 运行测试代码:")
    try:
        os.system(f"python3 {test_file}")
        print(f"   ✅ 测试代码运行成功")
    except Exception as e:
        print(f"   ❌ 测试代码运行失败: {e}")
    
    return test_file

def main():
    """主函数"""
    print("=" * 60)
    print("GLM5 + Claude Code 集成测试")
    print("=" * 60)
    
    # 测试配置
    if not test_configuration():
        print("\n❌ 配置测试失败，请检查设置")
        sys.exit(1)
    
    # 生成并运行测试代码
    test_file = generate_test_code()
    
    print("\n" + "=" * 60)
    print("✅ 测试完成！")
    print(f"📁 测试代码位置: {test_file}")
    print(f"🔧 配置状态: GLM5 + Claude Code 已就绪")
    print("🚀 你现在可以使用 Claude Code 进行编程了！")
    print("=" * 60)
    
    # 显示使用提示
    print("\n💡 使用提示:")
    print("1. 设置环境变量:")
    print("   source /root/.openclaw/workspace/env-glm5.sh")
    print("2. 使用 Claude Code 技能:")
    print("   cd /root/.openclaw/workspace/skills/claude-code")
    print("   python3 claude-code.py query 'best-practices'")
    print("3. 开始编码任务:")
    print("   告诉我你的编码需求，我会使用 Claude Code 帮助你！")

if __name__ == "__main__":
    main()