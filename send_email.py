#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
发送邮件脚本 - 邮件自动化系统的发送模块
"""

import smtplib
import email
import os
import configparser
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from email.header import Header
from datetime import datetime

# 默认配置文件路径
CONFIG_FILE = "email_config.ini"

def load_smtp_config(config_file=CONFIG_FILE):
    """加载SMTP配置"""
    config = configparser.ConfigParser()
    
    if not os.path.exists(config_file):
        print(f"❌ 配置文件 {config_file} 不存在")
        print("请先运行 read_email_with_config.py 创建配置文件")
        return None
    
    try:
        config.read(config_file, encoding='utf-8')
        
        # 获取服务器配置
        smtp_host = config.get('SERVER', 'smtp_host', fallback='')
        if not smtp_host:
            # 默认使用与IMAP相同的服务器，但添加SMTP前缀或后缀
            imap_host = config.get('SERVER', 'imap_host', fallback='imap.qq.com')
            if 'imap.qq.com' in imap_host:
                smtp_host = 'smtp.qq.com'
            elif 'imap.163.com' in imap_host:
                smtp_host = 'smtp.163.com'
            elif 'imap.gmail.com' in imap_host:
                smtp_host = 'smtp.gmail.com'
            else:
                smtp_host = 'smtp.' + imap_host.replace('imap.', '')
        
        smtp_port = config.getint('SERVER', 'smtp_port', fallback=465)
        use_ssl = config.getboolean('SERVER', 'smtp_use_ssl', fallback=True)
        
        # 获取账户配置
        email_account = config.get('ACCOUNT', 'email_account', fallback='')
        email_password = config.get('ACCOUNT', 'email_password', fallback='')
        
        if not email_account or not email_password:
            print("❌ 配置文件中缺少邮箱账号或密码")
            return None
        
        # 获取发件人显示名称（可选）
        sender_name = config.get('SENDER', 'display_name', fallback='')
        
        return {
            'smtp_host': smtp_host,
            'smtp_port': smtp_port,
            'use_ssl': use_ssl,
            'email_account': email_account,
            'email_password': email_password,
            'sender_name': sender_name,
            'email_address': email_account
        }
        
    except Exception as e:
        print(f"❌ 加载配置文件失败: {e}")
        return None

def connect_to_smtp_server(config):
    """连接到SMTP服务器"""
    try:
        print(f"🔗 正在连接到 SMTP 服务器: {config['smtp_host']}:{config['smtp_port']}")
        
        if config['use_ssl']:
            server = smtplib.SMTP_SSL(config['smtp_host'], config['smtp_port'])
        else:
            server = smtplib.SMTP(config['smtp_host'], config['smtp_port'])
            # 如果使用非SSL但需要TLS
            server.starttls()
        
        server.timeout = 30
        print("✅ SMTP服务器连接成功")
        
        print(f"🔐 正在登录 {config['email_account']}...")
        server.login(config['email_account'], config['email_password'])
        print("✅ SMTP登录成功")
        
        return server
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP登录失败: {e}")
        print("\n💡 可能的原因：")
        print("   1. 密码或授权码错误")
        print("   2. 未开启SMTP服务")
        print("   3. 账户安全限制")
        return None
    except Exception as e:
        print(f"❌ 连接SMTP服务器失败: {e}")
        return None

def create_email_message(config, to_address, subject, body, 
                         cc=None, bcc=None, attachments=None, 
                         in_reply_to=None, references=None):
    """创建邮件消息"""
    try:
        # 确定发件人显示格式
        if config['sender_name']:
            from_address = f"{config['sender_name']} <{config['email_address']}>"
        else:
            from_address = config['email_address']
        
        # 创建邮件
        if attachments:
            msg = MIMEMultipart()
            # 添加正文
            text_part = MIMEText(body, 'plain', 'utf-8')
            msg.attach(text_part)
        else:
            msg = MIMEText(body, 'plain', 'utf-8')
        
        # 设置邮件头
        msg['From'] = from_address
        msg['To'] = to_address
        msg['Subject'] = Header(subject, 'utf-8')
        msg['Date'] = email.utils.formatdate(localtime=True)
        
        # 添加抄送和密送
        if cc:
            msg['Cc'] = cc
        if bcc:
            msg['Bcc'] = bcc
        
        # 添加回复相关的邮件头
        if in_reply_to:
            msg['In-Reply-To'] = in_reply_to
        if references:
            msg['References'] = references
        
        # 添加附件
        if attachments:
            for attachment_path in attachments:
                if os.path.exists(attachment_path):
                    filename = os.path.basename(attachment_path)
                    with open(attachment_path, 'rb') as f:
                        attachment_data = f.read()
                    
                    # 创建附件
                    attachment = MIMEApplication(attachment_data, Name=filename)
                    attachment['Content-Disposition'] = f'attachment; filename="{filename}"'
                    msg.attach(attachment)
                    print(f"✅ 添加附件: {filename}")
                else:
                    print(f"⚠️ 附件文件不存在: {attachment_path}")
        
        return msg
        
    except Exception as e:
        print(f"❌ 创建邮件消息失败: {e}")
        return None

def send_single_email(server, msg, to_address):
    """发送单封邮件"""
    try:
        # 获取收件人列表
        recipients = [to_address]
        
        # 如果有抄送和密送，也添加到收件人列表
        if 'Cc' in msg:
            recipients.extend([addr.strip() for addr in msg['Cc'].split(',')])
        if 'Bcc' in msg:
            recipients.extend([addr.strip() for addr in msg['Bcc'].split(',')])
        
        print(f"📤 正在发送邮件到: {to_address}")
        server.sendmail(msg['From'], recipients, msg.as_string())
        print("✅ 邮件发送成功")
        return True
        
    except Exception as e:
        print(f"❌ 发送邮件失败: {e}")
        return False

def send_test_email(config):
    """发送测试邮件"""
    try:
        # 连接到SMTP服务器
        server = connect_to_smtp_server(config)
        if not server:
            return False
        
        try:
            # 创建测试邮件
            test_subject = f"测试邮件 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            test_body = f"""
这是一封测试邮件，用于验证邮件发送功能是否正常。

发送时间: {datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}
发件人: {config['email_account']}
SMTP服务器: {config['smtp_host']}:{config['smtp_port']}

邮件自动化系统测试
"""
            msg = create_email_message(config, config['email_account'], test_subject, test_body)
            if not msg:
                return False
            
            # 发送测试邮件给自己
            success = send_single_email(server, msg, config['email_account'])
            
            if success:
                print(f"\n🎉 测试邮件已发送到 {config['email_account']}")
                print("请检查收件箱确认邮件是否收到")
            
            return success
            
        finally:
            server.quit()
            print("🔒 SMTP连接已关闭")
            
    except Exception as e:
        print(f"❌ 发送测试邮件失败: {e}")
        return False

def send_email_interactive(config):
    """交互式发送邮件"""
    try:
        print("\n" + "="*60)
        print("📧 交互式邮件发送")
        print("="*60)
        
        # 输入收件人
        to_address = input("收件人邮箱地址: ").strip()
        if not to_address:
            print("❌ 必须输入收件人地址")
            return False
        
        # 输入邮件主题
        subject = input("邮件主题: ").strip()
        if not subject:
            subject = "无主题"
        
        # 输入邮件正文
        print("\n请输入邮件正文 (输入空行结束):")
        body_lines = []
        while True:
            line = input()
            if line == "":
                break
            body_lines.append(line)
        
        body = "\n".join(body_lines)
        if not body:
            body = "（无正文）"
        
        # 询问是否添加抄送/密送
        cc = input("抄送地址 (多个用逗号分隔，直接回车跳过): ").strip() or None
        bcc = input("密送地址 (多个用逗号分隔，直接回车跳过): ").strip() or None
        
        # 询问是否添加附件
        attachments = []
        while True:
            attachment_path = input("附件文件路径 (直接回车结束添加): ").strip()
            if not attachment_path:
                break
            if os.path.exists(attachment_path):
                attachments.append(attachment_path)
            else:
                print(f"⚠️ 文件不存在: {attachment_path}")
        
        # 确认发送
        print("\n" + "="*60)
        print("📋 邮件内容预览:")
        print(f"收件人: {to_address}")
        print(f"主题: {subject}")
        print(f"正文长度: {len(body)} 字符")
        print(f"附件数量: {len(attachments)}")
        
        confirm = input("\n确认发送这封邮件吗？(y/N): ").strip().lower()
        if confirm != 'y':
            print("❌ 邮件发送已取消")
            return False
        
        # 连接到SMTP服务器并发送
        server = connect_to_smtp_server(config)
        if not server:
            return False
        
        try:
            msg = create_email_message(config, to_address, subject, body, cc, bcc, attachments)
            if not msg:
                return False
            
            success = send_single_email(server, msg, to_address)
            
            if success:
                print(f"\n✅ 邮件已成功发送到 {to_address}")
                
                # 询问是否保存邮件内容
                save = input("\n是否保存邮件内容到文件？(y/N): ").strip().lower()
                if save == 'y':
                    save_email_content(to_address, subject, body, attachments)
            
            return success
            
        finally:
            server.quit()
            print("🔒 SMTP连接已关闭")
            
    except KeyboardInterrupt:
        print("\n\n❌ 邮件发送被用户中断")
        return False
    except Exception as e:
        print(f"❌ 发送邮件失败: {e}")
        return False

def save_email_content(to_address, subject, body, attachments):
    """保存邮件内容到文件"""
    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"sent_email_{timestamp}.txt"
        
        content = f"""邮件发送记录
================
发送时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
收件人: {to_address}
主题: {subject}
附件数量: {len(attachments)}

附件列表:
"""
        for i, attachment in enumerate(attachments, 1):
            content += f"  {i}. {os.path.basename(attachment)}\n"
        
        content += f"\n正文内容:\n{body}\n"
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ 邮件内容已保存到: {filename}")
        
    except Exception as e:
        print(f"⚠️ 保存邮件内容失败: {e}")

def send_bulk_emails(config, recipients_file):
    """批量发送邮件"""
    try:
        if not os.path.exists(recipients_file):
            print(f"❌ 收件人文件不存在: {recipients_file}")
            return False
        
        # 读取收件人列表
        with open(recipients_file, 'r', encoding='utf-8') as f:
            recipients = [line.strip() for line in f if line.strip()]
        
        if not recipients:
            print("❌ 收件人列表为空")
            return False
        
        print(f"📋 找到 {len(recipients)} 个收件人")
        
        # 输入邮件内容
        subject = input("批量邮件主题: ").strip()
        if not subject:
            subject = "批量通知"
        
        print("\n请输入邮件正文 (输入空行结束):")
        body_lines = []
        while True:
            line = input()
            if line == "":
                break
            body_lines.append(line)
        
        body = "\n".join(body_lines)
        if not body:
            body = "（无正文）"
        
        # 确认批量发送
        print(f"\n⚠️ 即将向 {len(recipients)} 个收件人发送邮件")
        confirm = input("确认批量发送吗？(y/N): ").strip().lower()
        if confirm != 'y':
            print("❌ 批量发送已取消")
            return False
        
        # 连接到SMTP服务器
        server = connect_to_smtp_server(config)
        if not server:
            return False
        
        try:
            success_count = 0
            fail_count = 0
            
            for i, recipient in enumerate(recipients, 1):
                print(f"\n[{i}/{len(recipients)}] 发送给: {recipient}")
                
                msg = create_email_message(config, recipient, subject, body)
                if not msg:
                    fail_count += 1
                    continue
                
                if send_single_email(server, msg, recipient):
                    success_count += 1
                else:
                    fail_count += 1
            
            print("\n" + "="*60)
            print("📊 批量发送结果:")
            print(f"成功: {success_count}")
            print(f"失败: {fail_count}")
            print(f"成功率: {success_count/len(recipients)*100:.1f}%")
            
            # 保存发送记录
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            record_file = f"bulk_send_record_{timestamp}.txt"
            
            with open(record_file, 'w', encoding='utf-8') as f:
                f.write(f"""批量邮件发送记录
===================
发送时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
总收件人: {len(recipients)}
成功: {success_count}
失败: {fail_count}
主题: {subject}

失败列表:
""")
                for i in range(len(recipients)):
                    if i >= success_count:
                        f.write(f"{recipients[i]}\n")
            
            print(f"✅ 发送记录已保存到: {record_file}")
            
            return success_count > 0
            
        finally:
            server.quit()
            print("🔒 SMTP连接已关闭")
            
    except KeyboardInterrupt:
        print("\n\n❌ 批量发送被用户中断")
        return False
    except Exception as e:
        print(f"❌ 批量发送失败: {e}")
        return False

def main_menu():
    """主菜单"""
    print("="*60)
    print("📧 邮件自动化系统 - 发送模块")
    print("="*60)
    
    # 加载配置
    config = load_smtp_config()
    if not config:
        return
    
    print(f"✅ 配置加载成功")
    print(f"   邮箱账号: {config['email_account']}")
    print(f"   SMTP服务器: {config['smtp_host']}:{config['smtp_port']}")
    
    while True:
        print("\n" + "="*60)
        print("请选择操作:")
        print("  1. 发送测试邮件（给自己）")
        print("  2. 发送单封邮件")
        print("  3. 批量发送邮件")
        print("  4. 检查SMTP连接")
        print("  5. 显示当前配置")
        print("  0. 退出")
        
        choice = input("\n请输入选项编号: ").strip()
        
        if choice == '1':
            print("\n" + "="*60)
            print("📧 发送测试邮件")
            print("="*60)
            send_test_email(config)
            
        elif choice == '2':
            send_email_interactive(config)
            
        elif choice == '3':
            print("\n" + "="*60)
            print("📧 批量发送邮件")
            print("="*60)
            recipients_file = input("收件人列表文件路径: ").strip()
            if recipients_file:
                send_bulk_emails(config, recipients_file)
            else:
                print("❌ 必须指定收件人列表文件")
            
        elif choice == '4':
            print("\n" + "="*60)
            print("🔗 检查SMTP连接")
            print("="*60)
            server = connect_to_smtp_server(config)
            if server:
                server.quit()
                print("✅ SMTP连接正常")
            else:
                print("❌ SMTP连接失败")
            
        elif choice == '5':
            print("\n" + "="*60)
            print("⚙️ 当前配置")
            print("="*60)
            for key, value in config.items():
                if key == 'email_password':
                    value = '*' * 8  # 隐藏密码
                print(f"  {key:15}: {value}")
            
        elif choice == '0':
            print("\n👋 退出邮件发送系统")
            break
            
        else:
            print("❌ 无效选项，请重新选择")

if __name__ == "__main__":
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\n\n👋 用户中断，退出程序")
    except Exception as e:
        print(f"\n❌ 程序异常: {e}")
        import traceback
        traceback.print_exc()