const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始安装截图工具...');

// 方法1: 尝试安装 puppeteer
function installPuppeteer() {
  return new Promise((resolve, reject) => {
    console.log('📦 正在安装 puppeteer...');
    const installProcess = exec('npm install puppeteer', {
      cwd: __dirname,
      stdio: 'pipe'
    });
    
    installProcess.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });
    
    installProcess.stderr.on('data', (data) => {
      console.error(data.toString().trim());
    });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ puppeteer 安装成功');
        resolve();
      } else {
        console.log('❌ puppeteer 安装失败，尝试其他方法');
        reject(new Error('puppeteer安装失败'));
      }
    });
  });
}

// 方法2: 尝试安装更轻量的 playwright-core
function installPlaywrightCore() {
  return new Promise((resolve, reject) => {
    console.log('📦 正在安装 playwright-core...');
    const installProcess = exec('npm install playwright-core', {
      cwd: __dirname,
      stdio: 'pipe'
    });
    
    installProcess.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });
    
    installProcess.stderr.on('data', (data) => {
      console.error(data.toString().trim());
    });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ playwright-core 安装成功');
        resolve();
      } else {
        console.log('❌ playwright-core 安装失败');
        reject(new Error('playwright-core安装失败'));
      }
    });
  });
}

// 方法3: 使用系统现有的工具
function checkSystemTools() {
  return new Promise((resolve, reject) => {
    console.log('🔍 检查系统已有工具...');
    
    const tools = [
      { name: 'chromium-browser', cmd: 'which chromium-browser' },
      { name: 'google-chrome', cmd: 'which google-chrome' },
      { name: 'firefox', cmd: 'which firefox' },
      { name: 'cutycapt', cmd: 'which cutycapt' }, // 轻量级截图工具
      { name: 'wkhtmltoimage', cmd: 'which wkhtmltoimage' }
    ];
    
    let found = false;
    let toolCount = 0;
    
    tools.forEach(tool => {
      exec(tool.cmd, (error, stdout) => {
        toolCount++;
        if (!error && stdout.trim()) {
          console.log(`✅ 找到 ${tool.name}: ${stdout.trim()}`);
          found = true;
        }
        
        if (toolCount === tools.length) {
          if (found) {
            resolve(true);
          } else {
            console.log('❌ 未找到任何截图工具');
            resolve(false);
          }
        }
      });
    });
  });
}

// 创建HTML转图片的脚本
function createScreenshotScript() {
  const scriptContent = `
const fs = require('fs');
const { chromium } = require('playwright');

async function takeScreenshot(htmlPath, outputPath) {
  console.log('📸 开始截图...');
  
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1200, height: 1600 }
    });
    const page = await context.newPage();
    
    // 读取HTML内容
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // 设置页面内容
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    
    // 截图
    await page.screenshot({
      path: outputPath,
      fullPage: true,
      type: 'jpeg',
      quality: 90
    });
    
    await browser.close();
    console.log(\`✅ 截图成功保存到: \${outputPath}\`);
    return outputPath;
  } catch (error) {
    console.error('❌ 截图失败:', error.message);
    throw error;
  }
}

// 如果直接运行这个脚本
if (require.main === module) {
  const htmlPath = process.argv[2] || '${path.join(__dirname, 'news_report.html')}';
  const outputPath = process.argv[3] || '${path.join(__dirname, 'news_screenshot.jpg')}';
  
  takeScreenshot(htmlPath, outputPath).catch(console.error);
}

module.exports = { takeScreenshot };
`;
  
  const scriptPath = path.join(__dirname, 'html_to_image.js');
  fs.writeFileSync(scriptPath, scriptContent);
  console.log(`📝 创建截图脚本: ${scriptPath}`);
  
  return scriptPath;
}

// 主函数
async function main() {
  console.log('🔧 为超级大大王安装截图工具...');
  
  try {
    // 先检查系统工具
    const hasSystemTools = await checkSystemTools();
    
    if (!hasSystemTools) {
      console.log('⚠️ 系统没有截图工具，尝试安装...');
      
      try {
        // 尝试安装 playwright-core（更轻量）
        await installPlaywrightCore();
      } catch (err1) {
        console.log('⚠️ playwright-core安装失败，尝试puppeteer...');
        
        try {
          await installPuppeteer();
        } catch (err2) {
          console.log('❌ 所有安装方法都失败了');
          console.log('💡 建议方案:');
          console.log('1. 手动安装系统包: yum install chromium');
          console.log('2. 使用在线转换服务');
          console.log('3. 使用现有的HTML格式');
          return;
        }
      }
    }
    
    // 创建截图脚本
    const scriptPath = createScreenshotScript();
    console.log('🎉 截图工具准备完成！');
    console.log('');
    console.log('📋 使用方法:');
    console.log(`node ${scriptPath} [html文件路径] [输出图片路径]`);
    console.log('');
    console.log('📁 示例:');
    console.log(`node ${scriptPath} news_report.html news_screenshot.jpg`);
    
  } catch (error) {
    console.error('❌ 安装过程出错:', error.message);
  }
}

main();