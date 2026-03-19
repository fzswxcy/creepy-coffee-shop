const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const exec = promisify(require('child_process').exec);
const writeFile = promisify(fs.writeFile);

async function takeScreenshotWithXvfb(htmlPath, outputPath) {
  console.log('🎯 使用 Xvfb 为超级大大王生成新闻图片...');
  
  // 创建一个临时脚本，在 Xvfb 环境中运行
  const screenshotScript = `
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 在 Xvfb 环境中启动浏览器...');
  
  try {
    // 查找浏览器
    const browserPaths = [
      '/usr/bin/firefox',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    
    let browserPath = null;
    for (const p of browserPaths) {
      if (fs.existsSync(p)) {
        browserPath = p;
        console.log(\`✅ 使用浏览器: \${p}\`);
        break;
      }
    }
    
    if (!browserPath) {
      throw new Error('未找到可用的浏览器');
    }
    
    // 启动浏览器（headless 模式）
    const browser = await puppeteer.launch({
      executablePath: browserPath,
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
    
    // 读取 HTML 文件
    const htmlContent = fs.readFileSync('${htmlPath}', 'utf8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // 等待内容渲染
    await page.waitForTimeout(3000);
    
    // 获取完整页面高度
    const fullHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
    });
    
    console.log(\`📏 页面高度: \${fullHeight}px\`);
    
    // 重新设置视口高度（限制最大高度）
    const viewportHeight = Math.min(fullHeight, 8000);
    await page.setViewport({ width: 1200, height: viewportHeight });
    
    // 截图
    console.log('📸 开始截图...');
    await page.screenshot({
      path: '${outputPath}',
      type: 'jpeg',
      quality: 90,
      fullPage: true
    });
    
    await browser.close();
    
    console.log(\`✅ 截图成功保存到: ${outputPath}\`);
    console.log(\`📊 图片尺寸: 1200x\${viewportHeight}\`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 截图失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
`;
  
  // 保存临时脚本
  const tempScriptPath = path.join(__dirname, 'xvfb_screenshot_temp.js');
  await writeFile(tempScriptPath, screenshotScript);
  
  // 在 Xvfb 环境中运行脚本
  console.log('🖥️  启动 Xvfb 虚拟显示...');
  
  try {
    // 启动 Xvfb
    const xvfbProcess = spawn('Xvfb', [':99', '-screen', '0', '1280x1024x24']);
    
    // 设置 DISPLAY 环境变量
    process.env.DISPLAY = ':99';
    
    // 等待 Xvfb 启动
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 在 Xvfb 环境中运行截图脚本
    console.log('🚀 在虚拟显示中运行截图脚本...');
    const { stdout, stderr } = await exec(`DISPLAY=:99 node ${tempScriptPath}`);
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    // 停止 Xvfb
    xvfbProcess.kill('SIGTERM');
    
    // 检查输出文件
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`✅ 图片生成成功！`);
      console.log(`📁 文件: ${outputPath}`);
      console.log(`📏 大小: ${(stats.size / 1024).toFixed(2)} KB`);
      return outputPath;
    } else {
      throw new Error('截图文件未生成');
    }
    
  } catch (error) {
    console.error('❌ Xvfb 截图失败:', error.message);
    
    // 尝试不使用 Xvfb，直接使用 headless
    console.log('🔄 尝试直接使用 headless 模式...');
    return await takeScreenshotHeadless(htmlPath, outputPath);
  }
}

async function takeScreenshotHeadless(htmlPath, outputPath) {
  console.log('🔧 尝试 headless 截图...');
  
  try {
    const simpleScript = `
const puppeteer = require('puppeteer-core');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  const fs = require('fs');
  const html = fs.readFileSync('${htmlPath}', 'utf8');
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);
  
  await page.screenshot({
    path: '${outputPath}',
    type: 'jpeg',
    quality: 85
  });
  
  await browser.close();
  console.log('✅ Headless 截图完成');
}

main().catch(console.error);
`;
    
    const tempScript = path.join(__dirname, 'headless_temp.js');
    await writeFile(tempScript, simpleScript);
    
    const { stdout, stderr } = await exec(`node ${tempScript}`);
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    if (fs.existsSync(outputPath)) {
      return outputPath;
    } else {
      throw new Error('Headless 截图也失败了');
    }
    
  } catch (error) {
    console.error('❌ Headless 截图失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  const htmlPath = path.join(__dirname, 'news_report.html');
  const outputPath = path.join(__dirname, 'news_screenshot_final.jpg');
  
  console.log('='.repeat(50));
  console.log('🎬 为超级大大王生成新闻简报图片');
  console.log('='.repeat(50));
  console.log(`📄 HTML 文件: ${htmlPath}`);
  console.log(`📸 输出图片: ${outputPath}`);
  console.log('='.repeat(50));
  
  try {
    const result = await takeScreenshotWithXvfb(htmlPath, outputPath);
    console.log('='.repeat(50));
    console.log('🎉 新闻图片生成完成！');
    console.log(`📁 文件位置: ${result}`);
    return result;
  } catch (error) {
    console.error('❌ 所有截图方法都失败了');
    console.log('💡 建议方案:');
    console.log('1. 使用在线HTML转图片服务');
    console.log('2. 发送HTML文件内容');
    console.log('3. 发送文本摘要');
    
    // 创建文本摘要
    const textPath = outputPath.replace(/\.jpg$/, '.txt');
    const textContent = `📰 新闻简报 (文本版)

由于服务器环境限制，无法生成图片。
完整HTML文件: ${htmlPath}

🔧 需要安装:
1. 图形界面环境
2. 完整的浏览器配置
3. 或者使用在线转换工具

🤖 NIKO 已尽力尝试多种方法！`;
    
    await writeFile(textPath, textContent);
    console.log(`📝 已创建说明文件: ${textPath}`);
    
    return textPath;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { takeScreenshotWithXvfb };