#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import imaplib
import socket
import ssl
import sys

# 邮箱配置
IMAP_HOST = "mail.sinosig.com"
IMAP_PORT_SSL = 993
EMAIL_ACCOUNT = "liubowen-phq@sinosig.com"
EMAIL_PASSWORD = "HHi#2b!G#$N1"

def test_ssl_connection():
    print("=" * 60)
    print("开始测试SSL邮箱连接（端口993）...")
    print("=" * 60)
    
    try:
        # 测试网络连接（SSL端口）
        print(f"1. 测试网络连接到 {IMAP_HOST}:{IMAP_PORT_SSL}...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)  # 10秒超时
        
        try:
            sock.connect((IMAP_HOST, IMAP_PORT_SSL))
            print("✓ 网络连接成功")
            
            # 升级为SSL连接
            context = ssl.create_default_context()
            ssl_sock = context.wrap_socket(sock, server_hostname=IMAP_HOST)
            print("✓ SSL握手成功")
            ssl_sock.close()
            
        except socket.timeout:
            print("✗ 网络连接超时")
            return False
        except ConnectionRefusedError:
            print("✗ 连接被拒绝，端口可能未开放")
            return False
        except ssl.SSLError as e:
            print(f"✗ SSL错误: {e}")
            return False
        except Exception as e:
            print(f"✗ 连接失败: {e}")
            return False
        
        # 测试IMAP SSL连接
        print(f"\n2. 测试IMAP SSL连接...")
        try:
            mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT_SSL)
            mail.timeout = 15
            print("✓ IMAP SSL服务器连接成功")
            
            # 测试登录
            print(f"\n3. 测试登录 {EMAIL_ACCOUNT}...")
            try:
                mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
                print("✓ 登录成功")
                
                # 列出邮箱
                print(f"\n4. 获取邮箱列表...")
                status, mailbox_list = mail.list()
                if status == 'OK':
                    print("✓ 邮箱列表获取成功")
                    print(f"   找到 {len(mailbox_list)} 个邮箱:")
                    for i, box in enumerate(mailbox_list[:3]):  # 显示前3个
                        try:
                            print(f"   {i+1}. {box.decode('utf-8', errors='ignore')}")
                        except:
                            print(f"   {i+1}. [无法解码]")
                    if len(mailbox_list) > 3:
                        print(f"   ... 还有 {len(mailbox_list)-3} 个")
                else:
                    print("✗ 获取邮箱列表失败")
                
                # 检查收件箱
                print(f"\n5. 检查收件箱...")
                status, messages = mail.select('INBOX')
                if status == 'OK':
                    print("✓ 收件箱访问成功")
                    # 获取未读邮件数量
                    status, data = mail.search(None, 'UNSEEN')
                    if status == 'OK':
                        email_ids = data[0].split()
                        print(f"   未读邮件数量: {len(email_ids)}")
                else:
                    print("✗ 收件箱访问失败")
                
                mail.logout()
                print("\n✓ 所有测试通过！")
                return True
                
            except imaplib.IMAP4.error as e:
                print(f"✗ 登录失败: {e}")
                print("  请检查用户名和密码是否正确")
                return False
                
        except Exception as e:
            print(f"✗ IMAP SSL连接失败: {e}")
            return False
            
    except KeyboardInterrupt:
        print("\n测试被用户中断")
        return False
    except Exception as e:
        print(f"✗ 测试过程中出错: {e}")
        return False

if __name__ == "__main__":
    success = test_ssl_connection()
    if success:
        print("\n" + "=" * 60)
        print("SSL连接测试成功！请修改 read_email.py 使用端口993和SSL")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("SSL连接测试也失败，可能的原因：")
        print("1. 邮箱服务器只能在公司内网访问")
        print("2. 需要VPN连接")
        print("3. 企业邮箱有额外的安全限制")
        print("4. 密码可能已过期或被锁定")
        print("=" * 60)
        sys.exit(1)