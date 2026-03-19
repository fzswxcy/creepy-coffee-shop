const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const PUBLIC_DIR = __dirname;

// 定义MIME类型
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.wxml': 'text/plain; charset=utf-8',
  '.wxss': 'text/css; charset=utf-8'
};

// 创建服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let filePath = path.join(PUBLIC_DIR, parsedUrl.pathname);
  
  // 默认首页
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
    filePath = path.join(PUBLIC_DIR, 'download_微恐咖啡厅.html');
  }
  
  // 下载文件路由
  if (parsedUrl.pathname === '/download/微恐咖啡厅_v1.0.zip') {
    filePath = path.join(PUBLIC_DIR, '微恐咖啡厅_v1.0.zip');
  }
  
  console.log(`[${new Date().toISOString()}] ${req.socket.remoteAddress} - ${req.method} ${req.url}`);
  
  // 确保文件存在
  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>404 - 文件未找到</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #f44336; }
              .links { margin-top: 30px; }
              a { display: inline-block; margin: 10px; padding: 10px 20px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>404 - 文件未找到</h1>
            <p>请求的文件: ${parsedUrl.pathname}</p>
            <p>服务器目录: ${PUBLIC_DIR}</p>
            <div class="links">
              <a href="/">返回主页</a>
              <a href="/download/微恐咖啡厅_v1.0.zip">下载完整项目</a>
              <a href="/微恐咖啡厅_在线测试版.html">在线测试游戏</a>
            </div>
          </body>
          </html>
        `);
      } else {
        // 其他错误
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`服务器错误: ${err.message}`);
      }
      return;
    }
    
    // 如果是目录，列出文件
    if (stats.isDirectory()) {
      fs.readdir(filePath, (err, files) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`读取目录错误: ${err.message}`);
          return;
        }
        
        const fileList = files.map(file => {
          const fileUrl = path.join(parsedUrl.pathname, file);
          const fileStat = fs.statSync(path.join(filePath, file));
          const isDir = fileStat.isDirectory();
          const size = isDir ? '目录' : `${(fileStat.size / 1024).toFixed(2)}KB`;
          return `<li><a href="${fileUrl}">${isDir ? '📁' : '📄'} ${file}</a> <span style="color: #666; font-size: 12px;">(${size})</span></li>`;
        }).join('');
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>文件列表 - ${parsedUrl.pathname}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; }
              h1 { color: #333; }
              ul { list-style: none; padding: 0; }
              li { padding: 8px 0; border-bottom: 1px solid #eee; }
              a { color: #2196F3; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .server-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <h1>📁 目录: ${parsedUrl.pathname}</h1>
            <ul>${fileList}</ul>
            <div class="server-info">
              <h3>🌐 服务器信息</h3>
              <p><strong>IP地址:</strong> 10.2.0.4</p>
              <p><strong>端口:</strong> ${PORT}</p>
              <p><strong>完整项目下载:</strong> <a href="/download/微恐咖啡厅_v1.0.zip">微恐咖啡厅_v1.0.zip</a></p>
              <p><strong>在线测试游戏:</strong> <a href="/微恐咖啡厅_在线测试版.html">点击这里</a></p>
            </div>
          </body>
          </html>
        `);
      });
      return;
    }
    
    // 读取文件
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`读取文件错误: ${err.message}`);
        return;
      }
      
      // 获取文件扩展名并设置Content-Type
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      // 设置响应头
      const headers = {
        'Content-Type': contentType,
        'Content-Length': content.length,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*', // 允许跨域
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      };
      
      // 如果是ZIP文件，设置下载头
      if (ext === '.zip') {
        headers['Content-Disposition'] = `attachment; filename="${path.basename(filePath)}"`;
      }
      
      res.writeHead(200, headers);
      res.end(content);
    });
  });
});

// 处理OPTIONS请求（CORS预检）
server.on('request', (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
  }
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Web服务器已启动！`);
  console.log(`📡 监听地址: http://0.0.0.0:${PORT}`);
  console.log(`🌐 外部访问: http://10.2.0.4:${PORT}`);
  console.log(`📁 服务目录: ${PUBLIC_DIR}`);
  console.log('\n📦 可用下载链接:');
  console.log(`  1. 完整项目ZIP: http://10.2.0.4:${PORT}/download/微恐咖啡厅_v1.0.zip`);
  console.log(`  2. 在线测试版: http://10.2.0.4:${PORT}/微恐咖啡厅_在线测试版.html`);
  console.log(`  3. 下载主页: http://10.2.0.4:${PORT}/`);
  console.log('\n🔧 重要提示:');
  console.log('  请检查防火墙设置，确保端口8080对外开放');
  console.log('  如果无法访问，请确保服务器安全组规则允许8080端口入站');
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

// 错误处理
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口${PORT}已被占用，请使用其他端口`);
  } else {
    console.error(`❌ 服务器错误: ${err.message}`);
  }
  process.exit(1);
});