const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function htmlToImage(htmlPath, outputPath) {
    console.log('🚀 开始真正的HTML转图片...');
    console.log(`📄 输入HTML: ${htmlPath}`);
    console.log(`📸 输出图片: ${outputPath}`);
    
    try {
        // 检查HTML文件是否存在
        if (!fs.existsSync(htmlPath)) {
            throw new Error(`HTML文件不存在: ${htmlPath}`);
        }
        
        // 启动浏览器
        console.log('🌐 启动浏览器...');
        const browser = await puppeteer.launch({
            headless: 'new',
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
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // 设置页面内容
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // 等待页面完全渲染
        console.log('⏳ 等待页面渲染...');
        await page.waitForTimeout(3000);
        
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
        
        // 关闭浏览器
        await browser.close();
        
        console.log(`✅ HTML转图片成功！`);
        console.log(`📁 文件: ${outputPath}`);
        console.log(`📏 尺寸: 1200x${viewportHeight}`);
        
        return outputPath;
        
    } catch (error) {
        console.error('❌ HTML转图片失败:', error.message);
        console.error(error.stack);
        throw error;
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
            
            // 同时生成一个PDF版本
            console.log('📄 同时生成PDF版本...');
            const pdfPath = outputPath.replace('.jpg', '.pdf');
            
            const browser2 = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page2 = await browser2.newPage();
            
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            await page2.setContent(htmlContent, { waitUntil: 'networkidle0' });
            await page2.waitForTimeout(2000);
            
            await page2.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true
            });
            
            await browser2.close();
            
            console.log(`✅ PDF版本生成完成: ${pdfPath}`);
            
        } else {
            console.log('❌ 图片文件未生成');
        }
        
    } catch (error) {
        console.error('❌ 主函数出错:', error.message);
        process.exit(1);
    }
}

// 如果直接运行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { htmlToImage };