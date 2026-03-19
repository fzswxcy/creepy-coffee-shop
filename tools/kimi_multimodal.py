#!/usr/bin/env python3
"""
Kimi K2.5 多模态能力工具
支持：图像生成、图像转视频、特效处理
"""

import os
import json
import requests
import base64
from pathlib import Path

class KimiMultimodal:
    def __init__(self):
        self.api_key = os.getenv('DASHSCOPE_API_KEY', 'sk-6f6a9c7f8c0649b89a712bc4651207f3')
        self.base_url = os.getenv('DASHSCOPE_BASE_URL', 'https://dashscope.aliyuncs.com')
        
    def generate_image(self, prompt, style="cinematic", size="1024x1024", output_path=None):
        """
        文本生成图像
        使用通义万相模型
        """
        url = f"{self.base_url}/api/v1/services/aigc/text2image/image-synthesis"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "wanx2.1-t2i-plus",
            "input": {
                "prompt": prompt,
                "negative_prompt": "low quality, blurry, distorted",
                "style": style
            },
            "parameters": {
                "size": size,
                "n": 1
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            result = response.json()
            
            if output_path and 'output' in result:
                # 保存图像
                image_data = result['output']['results'][0]['url']
                img_response = requests.get(image_data)
                with open(output_path, 'wb') as f:
                    f.write(img_response.content)
                return {"success": True, "path": output_path, "url": image_data}
            
            return result
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def image_to_video(self, image_path, prompt="make it animated", duration=5, output_path=None):
        """
        图像生成视频/动画
        """
        url = f"{self.base_url}/api/v1/services/aigc/image2video/video-synthesis"
        
        # 读取图像
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "wanx2.1-i2v-plus",
            "input": {
                "image": image_data,
                "prompt": prompt
            },
            "parameters": {
                "duration": duration,
                "fps": 24
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=180)
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def apply_effects(self, image_path, effect_type="enhance", intensity=0.5):
        """
        图像特效处理
        """
        effects = {
            "enhance": "图像增强",
            "cartoon": "卡通风格",
            "sketch": "素描风格", 
            "cyberpunk": "赛博朋克",
            "cinematic": "电影风格",
            "vintage": "复古风格"
        }
        
        # 使用图像风格迁移 API
        url = f"{self.base_url}/api/v1/services/aigc/image-generation/image-style-transfer"
        
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "wanx-style-transfer",
            "input": {
                "image": image_data,
                "style": effect_type,
                "intensity": intensity
            }
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def multimodal_chat(self, text, image_path=None):
        """
        多模态对话（图文理解）
        """
        url = f"{self.base_url}/compatible-mode/v1/chat/completions"
        
        messages = [{"role": "user", "content": []}]
        
        # 添加文本
        messages[0]["content"].append({
            "type": "text",
            "text": text
        })
        
        # 如果有图像，添加图像
        if image_path and os.path.exists(image_path):
            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            messages[0]["content"].append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
            })
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "kimi-k2.5",
            "messages": messages,
            "max_tokens": 4096
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            return response.json()
        except Exception as e:
            return {"error": str(e)}

def main():
    """命令行入口"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Kimi K2.5 多模态工具')
    parser.add_argument('action', choices=['image', 'video', 'effect', 'chat'])
    parser.add_argument('--prompt', '-p', help='提示词')
    parser.add_argument('--input', '-i', help='输入图像路径')
    parser.add_argument('--output', '-o', help='输出路径')
    parser.add_argument('--style', '-s', default='cinematic', help='风格')
    parser.add_argument('--effect', '-e', default='enhance', help='特效类型')
    
    args = parser.parse_args()
    
    tool = KimiMultimodal()
    
    if args.action == 'image':
        result = tool.generate_image(args.prompt, args.style, output_path=args.output)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    elif args.action == 'video':
        result = tool.image_to_video(args.input, args.prompt, output_path=args.output)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    elif args.action == 'effect':
        result = tool.apply_effects(args.input, args.effect)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    elif args.action == 'chat':
        result = tool.multimodal_chat(args.prompt, args.input)
        print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()