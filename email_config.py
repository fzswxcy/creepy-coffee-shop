#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
邮箱配置文件
请修改以下配置为你的实际邮箱信息
"""

# 邮箱配置
IMAP_HOST = "mail.sinosig.com"  # 根据实际情况修改，腾讯企业邮通常为 imap.exmail.qq.com
IMAP_PORT = 993  # 使用SSL连接，端口993
SMTP_HOST = "mail.sinosig.com"
SMTP_PORT = 465  # SSL端口

# 邮箱账号信息 - 请替换为实际信息
EMAIL_ACCOUNT = "your_email@sinosig.com"  # 请替换为实际邮箱账号
EMAIL_PASSWORD = "your_password"  # 请替换为实际密码或客户端专用授权码

# 附件保存目录
ATTACHMENT_DIR = "/tmp/Email_Attachments/"  # 临时目录用于测试

# 邮件处理选项
MARK_AS_READ = False  # 是否将处理的邮件标记为已读