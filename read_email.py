#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
读取未读邮件并下载附件的Python脚本
"""

import imaplib
import email
import os
import json
from email.header import decode_header
from datetime import datetime

# 邮箱配置 - 根据用户提供的信息
IMAP_HOST = "mail.sinosig.com"
IMAP_PORT = 143  # 无SSL连接，端口143
SMTP_HOST = "mail.sinosig.com"
EMAIL_ACCOUNT = "liubowen-phq@sinosig.com"  # 用户邮箱账号
EMAIL_PASSWORD = "HHi#2b!G#$N1"  # 用户邮箱密码
ATTACHMENT_DIR = "/tmp/Email_Attachments/"  # 临时目录，确保可访问

# 附件分类目录
ATTACHMENT_CATEGORIES = {
    'PDF文档': ['.pdf'],
    '办公文档': ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    '图片资料': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
    '其他': []  # 其他类型文件
}

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
                    decoded_string += word.decode(encoding)
                else:
                    try:
                        decoded_string += word.decode('utf-8')
                    except:
                        decoded_string += word.decode('gbk', errors='ignore')
            else:
                decoded_string += word
        return decoded_string
    except Exception as e:
        print(f"解码标题出错: {e}")
        return str(s) if s else ""

def create_directories():
    """创建附件目录"""
    try:
        # 创建主目录
        if not os.path.exists(ATTACHMENT_DIR):
            os.makedirs(ATTACHMENT_DIR)
            print(f"创建主目录: {ATTACHMENT_DIR}")
        
        # 创建分类子目录
        for category in ATTACHMENT_CATEGORIES.keys():
            category_dir = os.path.join(ATTACHMENT_DIR, category)
            if not os.path.exists(category_dir):
                os.makedirs(category_dir)
                print(f"创建分类目录: {category_dir}")
        
        return True
    except Exception as e:
        print(f"创建目录出错: {e}")
        return False

def get_file_category(filename):
    """根据文件扩展名确定分类"""
    _, ext = os.path.splitext(filename.lower())
    for category, extensions in ATTACHMENT_CATEGORIES.items():
        if ext in extensions:
            return category
    return "其他"

def save_attachment(part, msg_num):
    """保存附件"""
    try:
        filename = part.get_filename()
        if filename:
            # 解码文件名
            filename = decode_mime_words(filename)
            if not filename:
                filename = f"attachment_{msg_num}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # 确定分类
            category = get_file_category(filename)
            save_dir = os.path.join(ATTACHMENT_DIR, category)
            
            # 确保目录存在
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)
            
            # 生成完整路径
            filepath = os.path.join(save_dir, filename)
            
            # 处理重复文件名
            counter = 1
            base_name, extension = os.path.splitext(filename)
            while os.path.exists(filepath):
                new_filename = f"{base_name}_{counter}{extension}"
                filepath = os.path.join(save_dir, new_filename)
                counter += 1
            
            # 保存附件
            with open(filepath, 'wb') as f:
                f.write(part.get_payload(decode=True))
            
            return {
                'filename': os.path.basename(filepath),
                'category': category,
                'path': filepath,
                'size': os.path.getsize(filepath) if os.path.exists(filepath) else 0
            }
    except Exception as e:
        print(f"保存附件出错: {e}")
        return None

def extract_email_body(msg):
    """提取邮件正文"""
    body = ""
    
    def extract_text(part):
        """递归提取文本内容"""
        nonlocal body
        try:
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition"))
            
            if "attachment" not in content_disposition:
                if content_type == "text/plain":
                    charset = part.get_content_charset() or 'utf-8'
                    try:
                        payload = part.get_payload(decode=True).decode(charset, errors='replace')
                        body += payload + "\n"
                    except:
                        pass
                elif content_type == "text/html":
                    charset = part.get_content_charset() or 'utf-8'
                    try:
                        # 简单提取HTML文本
                        payload = part.get_payload(decode=True).decode(charset, errors='replace')
                        # 移除HTML标签（简单处理）
                        import re
                        clean_text = re.sub('<[^<]+?>', '', payload)
                        clean_text = re.sub('\s+', ' ', clean_text)
                        body += clean_text + "\n"
                    except:
                        pass
                elif part.is_multipart():
                    for subpart in part.get_payload():
                        extract_text(subpart)
        except Exception as e:
            print(f"提取正文出错: {e}")
    
    if msg.is_multipart():
        for part in msg.walk():
            extract_text(part)
    else:
        content_type = msg.get_content_type()
        if content_type == "text/plain" or content_type == "text/html":
            charset = msg.get_content_charset() or 'utf-8'
            try:
                payload = msg.get_payload(decode=True).decode(charset, errors='replace')
                body = payload
            except:
                body = str(msg.get_payload())
    
    # 清理文本并限制长度
    if body:
        body = ' '.join(body.split())
        if len(body) > 200:
            body = body[:200] + "..."
    
    return body if body else "（无正文内容）"

def read_unread_emails():
    """读取未读邮件"""
    emails_summary = []
    
    try:
        # 创建目录
        if not create_directories():
            print("创建目录失败，退出程序")
            return emails_summary
        
        print(f"连接到 IMAP 服务器: {IMAP_HOST}:{IMAP_PORT}")
        
        # 连接到IMAP服务器 - 使用普通连接（端口143无SSL）
        mail = imaplib.IMAP4(IMAP_HOST, IMAP_PORT)
        mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
        print("登录成功")
        
        # 选择收件箱
        mail.select('INBOX')
        
        # 搜索未读邮件
        status, messages = mail.search(None, 'UNSEEN')
        
        if status != 'OK' or not messages[0]:
            print("No_Unread")
            return emails_summary
        
        email_ids = messages[0].split()
        print(f"找到 {len(email_ids)} 封未读邮件")
        
        # 处理每封邮件
        for i, msg_id in enumerate(email_ids, 1):
            try:
                print(f"\n处理第 {i}/{len(email_ids)} 封邮件...")
                
                # 获取邮件
                status, msg_data = mail.fetch(msg_id, '(RFC822)')
                
                if status != 'OK':
                    print(f"获取邮件 {msg_id} 失败")
                    continue
                
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                # 提取邮件信息
                from_header = decode_mime_words(msg.get('From'))
                subject = decode_mime_words(msg.get('Subject'))
                date = msg.get('Date')
                message_id = msg.get('Message-ID', '')
                in_reply_to = msg.get('In-Reply-To', '')
                
                # 提取正文
                body_preview = extract_email_body(msg)
                
                # 处理附件
                attachments = []
                if msg.is_multipart():
                    for part in msg.walk():
                        content_disposition = str(part.get("Content-Disposition"))
                        if "attachment" in content_disposition:
                            attachment_info = save_attachment(part, msg_id)
                            if attachment_info:
                                attachments.append(attachment_info)
                
                # 添加到摘要
                email_info = {
                    'id': msg_id.decode() if isinstance(msg_id, bytes) else str(msg_id),
                    'from': from_header,
                    'subject': subject,
                    'date': date,
                    'body_preview': body_preview,
                    'message_id': message_id,
                    'in_reply_to': in_reply_to,
                    'attachments': attachments,
                    'has_attachments': len(attachments) > 0
                }
                
                emails_summary.append(email_info)
                
                # 标记为已读（可选，根据需求启用）
                # mail.store(msg_id, '+FLAGS', '\\Seen')
                
                print(f"✓ 处理完成: {subject}")
                
            except Exception as e:
                print(f"处理邮件 {msg_id} 时出错: {e}")
                continue
        
        # 关闭连接
        mail.close()
        mail.logout()
        print("\nIMAP连接已关闭")
        
    except imaplib.IMAP4.error as e:
        print(f"IMAP错误: {e}")
        print("请检查邮箱配置、用户名和密码是否正确")
    except Exception as e:
        print(f"程序错误: {e}")
        import traceback
        traceback.print_exc()
    
    return emails_summary

def main():
    """主函数"""
    print("=" * 60)
    print("开始读取未读邮件...")
    print("=" * 60)
    
    # 读取未读邮件
    emails = read_unread_emails()
    
    # 输出摘要
    print("\n" + "=" * 60)
    print("邮件处理摘要:")
    print("=" * 60)
    
    if not emails:
        print("没有未读邮件")
        # 输出JSON格式
        print(json.dumps([], ensure_ascii=False, indent=2))
        return
    
    # 输出详细摘要
    for i, email_info in enumerate(emails, 1):
        print(f"\n--- 邮件 {i} ---")
        print(f"发件人: {email_info['from']}")
        print(f"主题: {email_info['subject']}")
        print(f"日期: {email_info['date']}")
        print(f"正文预览: {email_info['body_preview']}")
        
        if email_info['has_attachments']:
            print(f"附件 ({len(email_info['attachments'])}个):")
            for att in email_info['attachments']:
                print(f"  - {att['filename']} ({att['category']}) - {att['size']} bytes")
        else:
            print("附件: 无")
        
        print(f"邮件ID: {email_info['message_id']}")
    
    # 输出JSON格式
    print("\n" + "=" * 60)
    print("JSON格式摘要:")
    print("=" * 60)
    print(json.dumps(emails, ensure_ascii=False, indent=2))
    
    # 统计信息
    total_attachments = sum(len(email['attachments']) for email in emails)
    print("\n" + "=" * 60)
    print("统计信息:")
    print(f"未读邮件总数: {len(emails)}")
    print(f"附件总数: {total_attachments}")
    print(f"附件保存位置: {ATTACHMENT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()