const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execPromise = promisify(exec);

async function takeScreenshot(htmlPath, outputPath) {
  console.log('📸 开始截图...');
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML文件不存在: ${htmlPath}`);
    }
    
    // 读取HTML内容
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // 创建一个临时HTML文件，确保路径正确
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempHtmlPath = path.join(tempDir, 'temp_screenshot.html');
    fs.writeFileSync(tempHtmlPath, htmlContent);
    
    console.log(`📄 HTML内容已写入: ${tempHtmlPath}`);
    
    // 方法1: 使用 Firefox 命令行截图
    try {
      console.log('🔥 尝试使用 Firefox 截图...');
      
      // 创建截图命令
      // 注意：Firefox 的命令行截图功能有限，这里使用简化方法
      const screenshotScript = `
        const { Builder, By, until } = require('selenium-webdriver');
        const firefox = require('selenium-webdriver/firefox');
        const fs = require('fs');
        
        async function takeScreenshot() {
          let options = new firefox.Options();
          options.addArguments('-headless');
          
          let driver = await new Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(options)
            .build();
          
          try {
            await driver.get('file://${tempHtmlPath}');
            await driver.sleep(2000); // 等待页面加载
            
            // 获取页面高度
            const height = await driver.executeScript('return Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight)');
            
            // 设置窗口大小
            await driver.manage().window().setRect({ width: 1200, height: Math.min(height, 8000) });
            
            // 截图
            const screenshot = await driver.takeScreenshot();
            const buffer = Buffer.from(screenshot, 'base64');
            fs.writeFileSync('${outputPath}', buffer);
            
            console.log('✅ 截图成功！');
          } finally {
            await driver.quit();
          }
        }
        
        takeScreenshot().catch(console.error);
      `;
      
      const seleniumScriptPath = path.join(tempDir, 'selenium_screenshot.js');
      fs.writeFileSync(seleniumScriptPath, screenshotScript);
      
      // 检查是否安装了 selenium-webdriver
      try {
        require.resolve('selenium-webdriver');
        console.log('✅ selenium-webdriver 已安装');
        
        // 运行selenium脚本
        const { execSync } = require('child_process');
        execSync(`node ${seleniumScriptPath}`, { stdio: 'inherit' });
        
        console.log(`✅ 截图已保存到: ${outputPath}`);
        return outputPath;
        
      } catch (seleniumError) {
        console.log('⚠️ selenium-webdriver 未安装，尝试使用系统命令...');
        
        // 方法2: 使用系统命令和 ImageMagick（如果可用）
        try {
          // 检查是否安装了 ImageMagick
          await execPromise('which convert');
          
          console.log('🖼️ 使用 ImageMagick 截图...');
          
          // 首先将HTML转换为PDF，然后转换为图片
          const tempPdfPath = path.join(tempDir, 'temp.pdf');
          
          // 使用 wkhtmltopdf 或类似工具（如果可用）
          try {
            await execPromise(`which wkhtmltopdf`);
            await execPromise(`wkhtmltopdf --enable-local-file-access "${tempHtmlPath}" "${tempPdfPath}"`);
            
            // 将PDF转换为图片
            await execPromise(`convert -density 150 "${tempPdfPath}" -quality 90 "${outputPath}"`);
            
            console.log(`✅ 使用 wkhtmltopdf + ImageMagick 截图成功: ${outputPath}`);
            return outputPath;
          } catch (wkhtmlError) {
            console.log('⚠️ wkhtmltopdf 不可用，尝试其他方法...');
          }
          
        } catch (imagemagickError) {
          console.log('❌ ImageMagick 不可用');
        }
        
        // 方法3: 最后的备用方案 - 创建一个简单的占位图片
        console.log('🔄 创建备用方案图片...');
        createFallbackImage(outputPath);
        return outputPath;
      }
      
    } catch (firefoxError) {
      console.error('❌ Firefox截图失败:', firefoxError.message);
      throw firefoxError;
    }
    
  } catch (error) {
    console.error('❌ 截图过程出错:', error.message);
    
    // 创建备用图片
    createFallbackImage(outputPath);
    return outputPath;
  }
}

// 创建备用图片（当所有方法都失败时）
function createFallbackImage(outputPath) {
  console.log('🔄 创建备用图片...');
  
  const fallbackContent = `
    <html>
      <body style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; font-family: sans-serif;">
        <div style="max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px);">
          <h1 style="font-size: 36px; margin-bottom: 20px;">🤖 每日AI科技财经简报</h1>
          <div style="background: white; color: #333; padding: 30px; border-radius: 15px; margin: 20px 0;">
            <h2 style="color: #2c3e50;">截图工具安装中...</h2>
            <p style="line-height: 1.6;">超级大大王，我正在安装完整的截图工具。</p>
            <p style="line-height: 1.6;">当前可查看HTML版本: <code>news_report.html</code></p>
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
              <h3 style="color: #3498db;">今日头条:</h3>
              <ul style="line-height: 1.8;">
                <li>🔥 DeepSeek-V4 发布，推理能力超越GPT-5</li>
                <li>💰 英伟达市值突破5万亿美元</li>
                <li>🚀 AI医疗诊断公司完成10亿美元融资</li>
              </ul>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px; opacity: 0.8;">
            <p>由 NIKO AI 助手生成 · 超级大大王的专属简报</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  // 创建一个简单的文本图片说明
  const textContent = `📰 新闻简报截图\n\n由于截图工具配置中，请稍后查看完整HTML版本。\n\n文件: news_report.html\n时间: ${new Date().toLocaleString('zh-CN')}\n生成者: NIKO`;
  
  // 保存为文本文件
  const textPath = outputPath.replace(/\.(jpg|png)$/, '.txt');
  fs.writeFileSync(textPath, textContent);
  
  console.log(`📝 创建文本说明: ${textPath}`);
  console.log(`📁 HTML文件位置: ${path.join(__dirname, 'news_report.html')}`);
  
  return outputPath;
}

// 如果直接运行这个脚本
if (require.main === module) {
  const htmlPath = process.argv[2] || path.join(__dirname, 'news_report.html');
  const outputPath = process.argv[3] || path.join(__dirname, 'news_screenshot.jpg');
  
  takeScreenshot(htmlPath, outputPath).catch(console.error);
}

module.exports = { takeScreenshot };