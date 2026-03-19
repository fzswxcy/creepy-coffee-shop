const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function htmlToImage(htmlPath, outputPath) {
    console.log('🚀 开始真正的HTML转图片...');
    console.log(`📄 输入HTML: ${htmlPath}`);
    console.log(`📸 输出图片: ${outputPath}`);
    
    let browser = null;
    
    try {
        // 检查HTML文件是否存在
        if (!fs.existsSync(htmlPath)) {
            throw new Error(`HTML文件不存在: ${htmlPath}`);
        }
        
        // 启动浏览器
        console.log('🌐 启动浏览器...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--window-size=1200,800'
            ]
        });
        
        const page = await browser.newPage();
        
        // 设置视口
        await page.setViewport({ width: 1200, height: 800 });
        
        // 加载HTML文件
        console.log('📖 加载HTML内容...');
        
        // 转换为文件URL
        const fileUrl = 'file://' + htmlPath;
        await page.goto(fileUrl, { waitUntil: 'networkidle0' });
        
        // 等待页面完全渲染
        console.log('⏳ 等待页面渲染...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 获取页面完整高度
        const fullHeight = await page.evaluate(() => {
            return Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            );
        });
        
        console.log(`📏 页面高度: ${fullHeight}px`);
        
        // 重新设置视口高度
        const viewportHeight = Math.min(fullHeight, 8000); // 限制最大高度
        await page.setViewport({ width: 1200, height: viewportHeight });
        
        // 截图
        console.log('📸 开始截图...');
        await page.screenshot({
            path: outputPath,
            type: 'jpeg',
            quality: 90,
            fullPage: true
        });
        
        console.log(`✅ HTML转图片成功！`);
        console.log(`📁 文件: ${outputPath}`);
        console.log(`📏 尺寸: 1200x${viewportHeight}`);
        
        return outputPath;
        
    } catch (error) {
        console.error('❌ HTML转图片失败:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 主函数
async function main() {
    const htmlPath = path.join(__dirname, 'detailed_news_report.html');
    const outputPath = path.join(__dirname, 'html_original_screenshot.jpg');
    
    console.log('='.repeat(50));
    console.log('🎯 为超级大大王生成HTML原样图片');
    console.log('='.repeat(50));
    
    try {
        const result = await htmlToImage(htmlPath, outputPath);
        
        // 检查文件是否生成
        if (fs.existsSync(result)) {
            const stats = fs.statSync(result);
            console.log(`✅ 任务完成！`);
            console.log(`📁 输出文件: ${result}`);
            console.log(`📦 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
            
            console.log('='.repeat(50));
            console.log('🎉 HTML原样图片生成成功！');
            console.log('特点：');
            console.log('1. 保持HTML原样排版');
            console.log('2. 不进行任何"自作聪明"的处理');
            console.log('3. 完整显示HTML所有内容');
            console.log('4. 高清晰度JPEG格式');
            
        } else {
            console.log('❌ 图片文件未生成');
        }
        
    } catch (error) {
        console.error('❌ 主函数出错:', error.message);
        
        // 备用方案：使用简单的ImageMagick
        console.log('🔄 尝试备用方案...');
        
        const simpleOutput = path.join(__dirname, 'html_backup_screenshot.jpg');
        const cmd = `convert -size 1200x1600 xc:white \
          -font helvetica \
          -pointsize 36 -fill "#2c3e50" -draw "text 100,100 '⚠️ HTML转图片工具配置中'" \
          -pointsize 24 -fill "#7f8c8d" -draw "text 100,160 '为超级大大王生成原样HTML图片'" \
          -pointsize 20 -fill "#555" -draw "text 100,220 'HTML文件: detailed_news_report.html'" \
          -pointsize 20 -fill "#555" -draw "text 100,260 '包含8条详细新闻，每条都有完整描述'" \
          -pointsize 18 -fill "#3498db" -draw "text 100,320 '🤖 NIKO正在配置真正的HTML转图片工具'" \
          -pointsize 16 -fill "#95a5a6" -draw "text 100,380 '📅 2026-02-27 10:36 · 安装真正的转换工具中'" \
          ${simpleOutput}`;
        
        const { execSync } = require('child_process');
        try {
            execSync(cmd, { stdio: 'pipe' });
            console.log(`✅ 备用图片生成: ${simpleOutput}`);
        } catch (e) {
            console.log('❌ 备用方案也失败了');
        }
        
        process.exit(1);
    }
}

// 如果直接运行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { htmlToImage };