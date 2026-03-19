#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
带配置文件支持的邮件自动化脚本
支持多种邮箱服务商，使用配置文件管理敏感信息
"""

import imaplib
import email
import os
import json
import configparser
from email.header import decode_header
from datetime import datetime
import sys

# 默认配置文件路径
CONFIG_FILE = "email_config.ini"
# 默认附件保存目录
DEFAULT_ATTACHMENT_DIR = "/tmp/Email_Attachments/"

# 附件分类目录
ATTACHMENT_CATEGORIES = {
    'PDF文档': ['.pdf'],
    '办公文档': ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    '图片资料': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
    '压缩文件': ['.zip', '.rar', '.7z', '.tar', '.gz'],
    '其他': []  # 其他类型文件
}

def load_config(config_file=CONFIG_FILE):
    """加载配置文件"""
    config = configparser.ConfigParser()
    
    # 如果配置文件不存在，创建默认配置
    if not os.path.exists(config_file):
        print(f"⚠️ 配置文件 {config_file} 不存在，创建默认配置...")
        create_default_config(config_file)
    
    try:
        config.read(config_file, encoding='utf-8')
        
        # 验证必填配置项
        required_sections = ['SERVER', 'ACCOUNT']
        for section in required_sections:
            if section not in config:
                raise ValueError(f"配置文件中缺少必要的 [{section}] 部分")
        
        # 获取服务器配置
        imap_host = config.get('SERVER', 'imap_host', fallback='')
        imap_port = config.getint('SERVER', 'imap_port', fallback=993)
        use_ssl = config.getboolean('SERVER', 'use_ssl', fallback=True)
        
        # 获取账户配置
        email_account = config.get('ACCOUNT', 'email_account', fallback='')
        email_password = config.get('ACCOUNT', 'email_password', fallback='')
        
        # 获取保存配置
        attachment_dir = config.get('SAVE', 'attachment_dir', fallback=DEFAULT_ATTACHMENT_DIR)
        mark_as_read = config.getboolean('OPTIONS', 'mark_as_read', fallback=False)
        
        if not imap_host or not email_account or not email_password:
            print("⚠️ 警告：配置文件中缺少必要的信息")
            print(f"   IMAP主机: {'✅' if imap_host else '❌'}")
            print(f"   邮箱账号: {'✅' if email_account else '❌'}")
            print(f"   邮箱密码: {'✅' if email_password else '❌'}")
            print("\n请编辑 email_config.ini 文件填写完整信息")
            return None
        
        return {
            'imap_host': imap_host,
            'imap_port': imap_port,
            'use_ssl': use_ssl,
            'email_account': email_account,
            'email_password': email_password,
            'attachment_dir': attachment_dir,
            'mark_as_read': mark_as_read
        }
        
    except Exception as e:
        print(f"❌ 加载配置文件失败: {e}")
        return None

def create_default_config(config_file):
    """创建默认配置文件"""
    config = configparser.ConfigParser()
    
    # 服务器配置
    config['SERVER'] = {
        '# IMAP服务器地址': '',
        '# 常用邮箱服务器：',
        '# QQ邮箱：imap.qq.com',
        '# 163邮箱：imap.163.com',
        '# 企业微信：请咨询IT部门',
        '# Gmail：imap.gmail.com',
        'imap_host': 'imap.qq.com',
        '# IMAP端口（通常993为SSL，143为非SSL）': '',
        'imap_port': '993',
        '# 是否使用SSL连接': '',
        'use_ssl': 'true'
    }
    
    # 账户配置
    config['ACCOUNT'] = {
        '# 邮箱账号（完整邮箱地址）': '',
        'email_account': 'your_email@qq.com',
        '# 邮箱密码或授权码（QQ邮箱需要使用授权码）': '',
        '# 获取QQ邮箱授权码：',
        '# 1. 登录QQ邮箱网页版',
        '# 2. 设置 → 账户',
        '# 3. 开启POP3/IMAP/SMTP服务',
        '# 4. 获取16位授权码',
        'email_password': 'your_auth_code_or_password'
    }
    
    # 保存配置
    config['SAVE'] = {
        '# 附件保存目录（需要写权限）': '',
        'attachment_dir': DEFAULT_ATTACHMENT_DIR
    }
    
    # 选项配置
    config['OPTIONS'] = {
        '# 处理邮件后是否标记为已读': '',
        'mark_as_read': 'false',
        '# 正文预览长度（字符）': '',
        'preview_length': '200'
    }
    
    try:
        with open(config_file, 'w', encoding='utf-8') as f:
            config.write(f)
        print(f"✅ 已创建默认配置文件: {config_file}")
        print("请编辑该文件填写你的邮箱信息")
        return True
    except Exception as e:
        print(f"❌ 创建配置文件失败: {e}")
        return False

def decode_mime_words(s):
    """解码邮件标题中的编码"""
    if s is None:
        return ""
    try:
        decoded_words = decode_header(s)
        decoded_string = ""
        for word, encoding in decoded_words:
            if isinstance(word, bytes):
                if encoding:
                    decoded_string += word.decode(encoding, errors='ignore')
                else:
                    try:
                        decoded_string += word.decode('utf-8', errors='ignore')
                    except:
                        decoded_string += word.decode('gbk', errors='ignore')
            else:
                decoded_string += word
        return decoded_string.strip()
    except Exception as e:
        print(f"解码标题出错: {e}")
        return str(s) if s else ""

def create_directories(attachment_dir):
    """创建附件目录"""
    try:
        # 创建主目录
        if not os.path.exists(attachment_dir):
            os.makedirs(attachment_dir)
            print(f"📁 创建主目录: {attachment_dir}")
        
        # 创建分类子目录
        for category in ATTACHMENT_CATEGORIES.keys():
            category_dir = os.path.join(attachment_dir, category)
            if not os.path.exists(category_dir):
                os.makedirs(category_dir)
        
        return True
    except Exception as e:
        print(f"❌ 创建目录出错: {e}")
        return False

def get_file_category(filename):
    """根据文件扩展名确定分类"""
    _, ext = os.path.splitext(filename.lower())
    for category, extensions in ATTACHMENT_CATEGORIES.items():
        if ext in extensions:
            return category
    return "其他"

def save_attachment(part, msg_num, attachment_dir, email_info):
    """保存附件"""
    try:
        filename = part.get_filename()
        if not filename:
            # 如果没有文件名，生成一个
            content_type = part.get_content_type()
            extension = '.dat'
            if content_type == 'application/pdf':
                extension = '.pdf'
            elif 'image' in content_type:
                extension = '.jpg'
            filename = f"attachment_{msg_num}_{datetime.now().strftime('%H%M%S')}{extension}"
        
        # 解码文件名
        filename = decode_mime_words(filename)
        
        # 确定分类
        category = get_file_category(filename)
        save_dir = os.path.join(attachment_dir, category)
        
        # 确保目录存在
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)
        
        # 生成完整路径
        filepath = os.path.join(save_dir, filename)
        
        # 处理重复文件名
        counter = 1
        base_name, extension = os.path.splitext(filename)
        original_filepath = filepath
        while os.path.exists(filepath):
            new_filename = f"{base_name}_{counter}{extension}"
            filepath = os.path.join(save_dir, new_filename)
            counter += 1
        
        # 保存附件
        with open(filepath, 'wb') as f:
            payload = part.get_payload(decode=True)
            if payload:
                f.write(payload)
                file_size = len(payload)
            else:
                file_size = 0
        
        # 记录保存信息
        if filename != os.path.basename(filepath):
            print(f"   重命名: {filename} → {os.path.basename(filepath)}")
        
        return {
            'original_filename': filename,
            'saved_filename': os.path.basename(filepath),
            'category': category,
            'path': filepath,
            'size': file_size,
            'saved_time': datetime.now().strftime('%H:%M:%S')
        }
        
    except Exception as e:
        print(f"❌ 保存附件出错: {e}")
        return None

def extract_email_body(msg, preview_length=200):
    """提取邮件正文"""
    body = ""
    
    def extract_text(part):
        nonlocal body
        try:
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Dposition", ""))
            
            # 跳过附件
            if "attachment" in content_disposition.lower():
                return
            
            if part.is_multipart():
                for subpart in part.get_payload():
                    extract_text(subpart)
            else:
                if content_type == "text/plain":
                    charset = part.get_content_charset() or 'utf-8'
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body += payload.decode(charset, errors='ignore')
                    except:
                        pass
                elif content_type == "text/html":
                    charset = part.get_content_charset() or 'utf-8'
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            # 简单移除HTML标签
                            import re
                            html_text = payload.decode(charset, errors='ignore')
                            clean_text = re.sub('<[^<]+?>', ' ', html_text)
                            clean_text = re.sub(r'\s+', ' ', clean_text)
                            body += clean_text.strip()
                    except:
                        pass
        except Exception as e:
            print(f"提取正文出错: {e}")
    
    if msg.is_multipart():
        for part in msg.walk():
            extract_text(part)
    else:
        content_type = msg.get_content_type()
        charset = msg.get_content_charset() or 'utf-8'
        try:
            payload = msg.get_payload(decode=True)
            if payload:
                body = payload.decode(charset, errors='ignore')
        except:
            body = str(msg.get_payload())
    
    # 清理文本并限制长度
    if body:
        body = ' '.join(body.split())
        if len(body) > preview_length:
            body = body[:preview_length] + "..."
    
    return body if body else "（无正文内容）"

def connect_to_email_server(host, port, use_ssl, account, password):
    """连接到邮箱服务器"""
    try:
        print(f"🔗 正在连接到 {host}:{port}...")
        
        if use_ssl:
            mail = imaplib.IMAP4_SSL(host, port)
        else:
            mail = imaplib.IMAP4(host, port)
        
        mail.timeout = 30  # 30秒超时
        print("✅ 服务器连接成功")
        
        print(f"🔐 正在登录 {account}...")
        mail.login(account, password)
        print("✅ 登录成功")
        
        return mail
        
    except imaplib.IMAP4.error as e:
        error_msg = str(e)
        print(f"❌ 登录失败: {error_msg}")
        
        # 提供详细的错误提示
        if "LOGIN failed" in error_msg or "Authentication failed" in error_msg:
            print("\n💡 登录失败的可能原因：")
            print("   1. 密码错误 - 请确认密码或授权码是否正确")
            print("   2. 未开启IMAP服务 - 需要在邮箱设置中开启")
            print("   3. 账户被锁定 - 可能需要网页端登录解锁")
            print("\n📝 解决方案：")
            print("   对于QQ邮箱：")
            print("   1. 登录QQ邮箱网页版")
            print("   2. 设置 → 账户")
            print("   3. 开启『POP3/IMAP/SMTP服务』")
            print("   4. 获取16位授权码")
            print("   5. 使用授权码作为密码")
        
        return None
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        return None

def read_unread_emails(config):
    """读取未读邮件"""
    emails_summary = []
    
    try:
        # 创建目录
        if not create_directories(config['attachment_dir']):
            print("❌ 创建目录失败，退出程序")
            return emails_summary
        
        # 连接到邮箱服务器
        mail = connect_to_email_server(
            config['imap_host'],
            config['imap_port'],
            config['use_ssl'],
            config['email_account'],
            config['email_password']
        )
        
        if not mail:
            return emails_summary
        
        try:
            # 选择收件箱
            print("📨 正在访问收件箱...")
            status, data = mail.select('INBOX')
            if status != 'OK':
                print("❌ 访问收件箱失败")
                return emails_summary
            
            print("✅ 收件箱访问成功")
            
            # 搜索未读邮件
            print("🔍 搜索未读邮件...")
            status, messages = mail.search(None, 'UNSEEN')
            
            if status != 'OK' or not messages[0]:
                print("📭 没有未读邮件")
                return emails_summary
            
            email_ids = messages[0].split()
            print(f"✅ 找到 {len(email_ids)} 封未读邮件")
            
            # 处理每封邮件
            for i, msg_id in enumerate(email_ids, 1):
                try:
                    msg_id_str = msg_id.decode() if isinstance(msg_id, bytes) else str(msg_id)
                    print(f"\n📧 处理邮件 {i}/{len(email_ids)} (ID: {msg_id_str})...")
                    
                    # 获取邮件内容
                    status, msg_data = mail.fetch(msg_id, '(RFC822)')
                    if status != 'OK':
                        print(f"❌ 获取邮件内容失败")
                        continue
                    
                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    
                    # 提取邮件信息
                    from_header = decode_mime_words(msg.get('From'))
                    subject = decode_mime_words(msg.get('Subject'))
                    date = decode_mime_words(msg.get('Date'))
                    to_header = decode_mime_words(msg.get('To'))
                    message_id = msg.get('Message-ID', '')
                    in_reply_to = msg.get('In-Reply-To', '')
                    
                    # 提取正文预览
                    body_preview = extract_email_body(msg)
                    
                    # 处理附件
                    attachments = []
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_disposition = str(part.get("Content-Disposition", ""))
                            if "attachment" in content_disposition.lower():
                                attachment_info = save_attachment(part, msg_id_str, config['attachment_dir'], config)
                                if attachment_info:
                                    attachments.append(attachment_info)
                    
                    # 添加到摘要
                    email_info = {
                        'id': msg_id_str,
                        'index': i,
                        'from': from_header,
                        'to': to_header,
                        'subject': subject,
                        'date': date,
                        'body_preview': body_preview,
                        'message_id': message_id,
                        'in_reply_to': in_reply_to,
                        'attachments': attachments,
                        'has_attachments': len(attachments) > 0,
                        'attachment_count': len(attachments)
                    }
                    
                    emails_summary.append(email_info)
                    
                    print(f"✅ 处理完成: {subject}")
                    
                    # 如果配置了标记为已读
                    if config.get('mark_as_read', False):
                        mail.store(msg_id, '+FLAGS', '\\Seen')
                        print("   已标记为已读")
                    
                except Exception as e:
                    print(f"❌ 处理邮件时出错: {e}")
                    continue
            
            # 关闭连接
            print("\n🔒 关闭邮箱连接...")
            mail.close()
            mail.logout()
            print("✅ 连接已关闭")
            
        except Exception as e:
            print(f"❌ 处理过程中出错: {e}")
            try:
                mail.close()
                mail.logout()
            except:
                pass
        
    except Exception as e:
        print(f"❌ 程序执行出错: {e}")
        import traceback
        traceback.print_exc()
    
    return emails_summary

def generate_reply_draft(email_info):
    """生成回复草稿"""
    try:
        from_name = "用户"
        subject = email_info['subject']
        
        # 简单的回复模板
        if "Re:" not in subject:
            reply_subject = f"Re: {subject}"
        else:
            reply_subject = subject
        
        reply_body = f"""尊敬的 {email_info['from'].split('<')[0].strip()}，

您好！

我已收到您的邮件「{subject}」。

邮件内容已阅，相关信息正在处理中。

如有进一步需要，请随时联系。

此致
敬礼

{from_name}
{datetime.now().strftime('%Y年%m月%d日 %H:%M')}
"""
        
        return {
            'subject': reply_subject,
            'body': reply_body,
            'to': email_info['from'],
            'in_reply_to': email_info.get('message_id', ''),
            'references': email_info.get('in_reply_to', '')
        }
    except Exception as e:
        print(f"生成回复草稿出错: {e}")
        return None

def display_summary(emails, config):
    """显示邮件摘要"""
    if not emails:
        print("\n" + "="*60)
        print("📭 未读邮件统计")
        print("="*60)
        print("今日没有未读邮件")
        return []
    
    print("\n" + "="*60)
    print(f"📊 未读邮件摘要 - {datetime.now().strftime('%Y年%m月%d日 %H:%M')}")
    print("="*60)
    
    reply_drafts = []
    
    for i, email_info in enumerate(emails, 1):
        print(f"\n📧 邮件 #{i}")
        print(f"   发件人: {email_info['from']}")
        print(f"   收件人: {email_info.get('to', '未指定')}")
        print(f"   主  题: {email_info['subject']}")
        print(f"   时  间: {email_info['date']}")
        print(f"   正  文: {email_info['body_preview']}")
        
        if email_info['has_attachments']:
            print(f"   附  件: {email_info['attachment_count']}个")
            for att in email_info['attachments']:
                print(f"      - {att['saved_filename']} ({att['category']}) - {att['size']}字节")
        else:
            print("   附  件: 无")
        
        # 生成回复草稿
        draft = generate_reply_draft(email_info)
        if draft:
            reply_drafts.append({
                'email_index': i,
                'original_subject': email_info['subject'],
                'draft': draft
            })
            
            print(f"\n   回复草稿:")
            print(f"       主题: {draft['subject']}")
            print(f"       收件人: {draft['to']}")
            print(f"       正文预览: {draft['body'][:100]}...")
    
    # 输出JSON格式（机器可读）
    print("\n" + "="*60)
    print("📋 JSON格式摘要（用于程序处理）")
    print("="*60)
    
    json_output = []
    for email_info in emails:
        json_email = {
            'id': email_info['id'],
            'from': email_info['from'],
            'subject': email_info['subject'],
            'date': email_info['date'],
            'body_preview': email_info['body_preview'],
            'has_attachments': email_info['has_attachments'],
            'attachments': [
                {
                    'filename': att['saved_filename'],
                    'category': att['category'],
                    'size': att['size']
                }
                for att in email_info['attachments']
            ]
        }
        json_output.append(json_email)
    
    print(json.dumps(json_output, ensure_ascii=False, indent=2))
    
    # 统计信息
    total_attachments = sum(email['attachment_count'] for email in emails)
    print("\n" + "="*60)
    print("📈 统计信息")
    print("="*60)
    print(f"未读邮件总数: {len(emails)}")
    print(f"附件总数: {total_attachments}")
    print(f"附件保存位置: {config['attachment_dir']}")
    print(f"处理时间: {datetime.now().strftime('%H:%M:%S')}")
    print("="*60)
    
    return reply_drafts

def main():
    """主函数"""
    print("="*60)
    print("📧 智能邮件自动化助手")
    print("="*60)
    
    # 加载配置
    print("📄 正在加载配置文件...")
    config = load_config()
    
    if not config:
        print("\n❌ 配置加载失败，请检查 email_config.ini 文件")
        print("如需重新创建配置文件，请删除现有的 email_config.ini 文件")
        return
    
    print("✅ 配置加载成功")
    print(f"   邮箱账号: {config['email_account']}")
    print(f"   服务器: {config['imap_host']}:{config['imap_port']}")
    print(f"   附件目录: {config['attachment_dir']}")
    
    # 读取未读邮件
    print("\n" + "="*60)
    print("开始读取未读邮件...")
    print("="*60)
    
    emails = read_unread_emails(config)
    
    # 显示摘要
    reply_drafts = display_summary(emails, config)
    
    # 如果有未读邮件，询问是否回复
    if emails:
        print("\n" + "="*60)
        print("📝 回复选项")
        print("="*60)
        
        print("今天有 {} 封未读邮件".format(len(emails)))
        print("\n已为您生成回复草稿，您可以选择：")
        
        # 显示回复选项
        for draft_info in reply_drafts:
            draft = draft_info['draft']
            print(f"\n邮件 #{draft_info['email_index']}: {draft_info['original_subject']}")
            print(f"   收件人: {draft['to']}")
            print(f"   主题: {draft['subject']}")
            print(f"   正文预览: {draft['body'][:80]}...")
        
        print("\n\n是否需要回复这些邮件？")
        print("输入邮件编号确认发送（例如: 1,2,3）")
        print("输入 'N' 结束")
        print("输入 'M' 修改回复内容")
        print("输入 'A' 回复所有邮件")
        
        print("\n请等待人工指令进行下一步操作...")
    
    else:
        print("\n🎉 今日邮件处理完成！")
    
    print("\n" + "="*60)
    print("📂 系统信息")
    print("="*60)
    print("下次使用时，只需运行: python3 read_email_with_config.py")
    print("配置文件: email_config.ini")
    print("脚本会自动读取配置并处理邮件")
    print("="*60)

if __name__ == "__main__":
    main()