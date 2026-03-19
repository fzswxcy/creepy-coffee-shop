#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import imaplib
import socket
import ssl
import sys

# QQ邮箱配置
IMAP_HOST = "imap.qq.com"
IMAP_PORT_SSL = 993
EMAIL_ACCOUNT = "731073066@qq.com"
EMAIL_PASSWORD = "slb390592996"

def test_qq_email():
    print("=" * 60)
    print("开始测试QQ邮箱连接...")
    print("=" * 60)
    
    try:
        # 测试网络连接
        print(f"1. 测试网络连接到 {IMAP_HOST}:{IMAP_PORT_SSL}...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(15)  # 15秒超时
        
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
            print("   可能的原因：")
            print("   1. 防火墙阻止了连接")
            print("   2. 网络延迟过高")
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
        
        # 测试IMAP连接
        print(f"\n2. 测试QQ邮箱IMAP连接...")
        try:
            mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT_SSL)
            mail.timeout = 20
            print("✓ IMAP服务器连接成功")
            
            # 测试登录
            print(f"\n3. 测试登录 {EMAIL_ACCOUNT}...")
            try:
                mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
                print("✓ 登录成功！")
                
                # 列出邮箱
                print(f"\n4. 获取邮箱列表...")
                status, mailbox_list = mail.list()
                if status == 'OK':
                    print(f"✓ 邮箱列表获取成功")
                    print(f"   找到 {len(mailbox_list)} 个邮箱/文件夹:")
                    
                    # 显示主要的邮箱
                    important_folders = ['INBOX', 'Sent', 'Drafts', 'Trash', 'Junk', 'Spam']
                    for box in mailbox_list:
                        box_str = box.decode('utf-8', errors='ignore')
                        for folder in important_folders:
                            if folder in box_str.upper():
                                print(f"   - {box_str}")
                                break
                else:
                    print("✗ 获取邮箱列表失败")
                
                # 检查收件箱状态
                print(f"\n5. 检查收件箱状态...")
                status, data = mail.select('INBOX')
                if status == 'OK':
                    print("✓ 收件箱访问成功")
                    
                    # 获取未读邮件数量
                    status, data = mail.search(None, 'UNSEEN')
                    if status == 'OK':
                        email_ids = data[0].split()
                        unread_count = len(email_ids)
                        print(f"   未读邮件数量: {unread_count}")
                        
                        # 获取总邮件数量
                        status, data = mail.status('INBOX', '(MESSAGES)')
                        if status == 'OK':
                            messages_info = data[0].decode()
                            total_match = re.search(r'MESSAGES\s+(\d+)', messages_info)
                            if total_match:
                                total_count = int(total_match.group(1))
                                print(f"   总邮件数量: {total_count}")
                                print(f"   未读率: {unread_count}/{total_count} ({unread_count/total_count*100:.1f}%)")
                else:
                    print("✗ 收件箱访问失败")
                
                mail.logout()
                print("\n✓ QQ邮箱测试完全成功！")
                return True
                
            except imaplib.IMAP4.error as e:
                error_msg = str(e)
                print(f"✗ 登录失败: {error_msg}")
                
                # 提供具体的错误处理建议
                if "Authentication failed" in error_msg or "LOGIN failed" in error_msg:
                    print("\n💡 登录失败的可能原因：")
                    print("   1. 密码错误 - 请确认密码是否正确")
                    print("   2. 需要授权码 - QQ邮箱可能需要使用授权码而非密码")
                    print("   3. 账户被锁定 - 多次失败登录可能导致临时锁定")
                    print("\n🔧 解决方案：")
                    print("   1. 登录QQ邮箱网页版")
                    print("   2. 进入设置 → 账户")
                    print("   3. 开启POP3/SMTP/IMAP服务")
                    print("   4. 生成授权码（16位）")
                    print("   5. 使用授权码作为密码")
                elif "Too many login failures" in error_msg:
                    print("💡 登录尝试次数过多，请稍后再试")
                elif "Web login required" in error_msg:
                    print("💡 需要在网页版先登录一次")
                
                return False
                
        except Exception as e:
            print(f"✗ IMAP连接失败: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    except KeyboardInterrupt:
        print("\n测试被用户中断")
        return False
    except Exception as e:
        print(f"✗ 测试过程中出错: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import re
    success = test_qq_email()
    
    if success:
        print("\n" + "=" * 60)
        print("🎉 QQ邮箱连接测试成功！")
        print("可以立即运行邮件自动化脚本")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("🔧 测试总结与建议：")
        print("1. 确保QQ邮箱已开启IMAP服务")
        print("2. 可能需要使用授权码而非密码")
        print("3. 检查网络连接是否正常")
        print("4. 确认防火墙未阻止连接")
        print("=" * 60)
        print("\n📝 开启IMAP服务的步骤：")
        print("1. 登录QQ邮箱网页版")
        print("2. 点击设置 → 账户")
        print("3. 找到『POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务』")
        print("4. 开启『IMAP/SMTP服务』")
        print("5. 按照提示发送短信验证")
        print("6. 获取16位授权码")
        print("=" * 60)
        sys.exit(1)