#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

# 创建144×144图像
img = Image.new('RGB', (144, 144), color=(74, 44, 42))  # 深咖啡色背景
draw = ImageDraw.Draw(img)

# 咖啡杯主体
draw.ellipse([(37, 60), (107, 110)], fill=(139, 69, 19), outline=None)  # 咖啡色杯子

# 咖啡液体
draw.ellipse([(42, 65), (102, 95)], fill=(101, 67, 33), outline=None)  # 深咖啡色

# 咖啡杯把手
draw.arc([(90, 60), (120, 90)], 90, 270, fill=(139, 69, 19), width=8)

# 咖啡热气
for i in range(3):
    draw.arc([(57 + (i-1)*15, 40 - i*5), (87 + (i-1)*15, 70 - i*5)], 
            180, 360, fill=(169, 169, 169), width=2)

# 幽灵咖啡豆
draw.ellipse([(22, 22), (38, 38)], fill=(240, 240, 240), outline=None)  # 幽灵头
draw.ellipse([(32, 22), (48, 34)], fill=(240, 240, 240), outline=None)  # 幽灵身体

# 眼睛
draw.rectangle([(27, 27), (29, 31)], fill=(51, 51, 51))
draw.rectangle([(35, 27), (37, 31)], fill=(51, 51, 51))

# 文字：微恐咖啡厅
# 使用默认字体
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 12)
except:
    font = ImageFont.load_default()

# 绘制文字
draw.text((72, 110), "微恐", fill=(255, 255, 255), font=font, anchor="mm")
draw.text((72, 125), "咖啡厅", fill=(255, 255, 255), font=font, anchor="mm")

# 保存图片
output_path = "/root/.openclaw/workspace/game_icon.png"
img.save(output_path, "PNG")
print(f"头像已生成: {output_path}")
print(f"尺寸: {img.size}")
print(f"文件大小: {os.path.getsize(output_path)} 字节")