#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import imaplib
import socket
import sys

# 邮箱配置
IMAP_HOST = "mail.sinosig.com"
IMAP_PORT = 143
EMAIL_ACCOUNT = "liubowen-phq@sinosig.com"
EMAIL_PASSWORD = "HHi#2b!G#$N1"

def test_connection():
    print("=" * 60)
    print("开始测试邮箱连接...")
    print("=" * 60)
    
    try:
        # 测试网络连接
        print(f"1. 测试网络连接到 {IMAP_HOST}:{IMAP_PORT}...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)  # 10秒超时
        
        try:
            sock.connect((IMAP_HOST, IMAP_PORT))
            print("✓ 网络连接成功")
        except socket.timeout:
            print("✗ 网络连接超时")
            return False
        except ConnectionRefusedError:
            print("✗ 连接被拒绝，端口可能未开放")
            return False
        except Exception as e:
            print(f"✗ 网络连接失败: {e}")
            return False
        finally:
            sock.close()
        
        # 测试IMAP连接
        print(f"\n2. 测试IMAP连接...")
        try:
            mail = imaplib.IMAP4(IMAP_HOST, IMAP_PORT)
            mail.timeout = 15
            print("✓ IMAP服务器连接成功")
            
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
                    for i, box in enumerate(mailbox_list[:5]):  # 显示前5个
                        print(f"   {i+1}. {box.decode()}")
                    if len(mailbox_list) > 5:
                        print(f"   ... 还有 {len(mailbox_list)-5} 个")
                else:
                    print("✗ 获取邮箱列表失败")
                
                # 检查收件箱
                print(f"\n5. 检查收件箱...")
                status, messages = mail.select('INBOX')
                if status == 'OK':
                    print("✓ 收件箱访问成功")
                    # 获取邮件数量
                    status, count_data = mail.status('INBOX', '(MESSAGES UNSEEN RECENT)')
                    if status == 'OK':
                        print(f"   状态: {count_data[0].decode()}")
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
            print(f"✗ IMAP连接失败: {e}")
            return False
            
    except KeyboardInterrupt:
        print("\n测试被用户中断")
        return False
    except Exception as e:
        print(f"✗ 测试过程中出错: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    if success:
        print("\n" + "=" * 60)
        print("连接测试成功！可以继续运行 read_email.py")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("连接测试失败，请检查：")
        print("1. 网络连接")
        print("2. 邮箱服务器地址和端口")
        print("3. 用户名和密码")
        print("4. 防火墙设置")
        print("=" * 60)
        sys.exit(1)