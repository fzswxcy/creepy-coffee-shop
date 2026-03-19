/**
 * 微信小游戏美术资源压缩优化脚本
 * 用于批量处理和优化美术资源
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ArtOptimizer {
    constructor() {
        this.stats = {
            totalFiles: 0,
            totalSizeBefore: 0,
            totalSizeAfter: 0,
            optimizedFiles: 0,
            failedFiles: 0
        };
        
        this.supportedFormats = ['.png', '.jpg', '.jpeg', '.webp'];
        
        // 压缩配置
        this.config = {
            png: {
                quality: 80,        // PNG质量 (0-100)
                colors: 256,        // 颜色数量
                speed: 1            // 压缩速度 (1-11, 1最慢但质量最好)
            },
            jpg: {
                quality: 85,        // JPEG质量
                progressive: true   // 渐进式JPEG
            },
            webp: {
                quality: 80,        // WebP质量
                method: 6           // 压缩方法 (0-6)
            },
            maxWidth: 2048,         // 最大宽度
            maxHeight: 2048,        // 最大高度
            outputDir: 'optimized'  // 输出目录
        };
    }
    
    /**
     * 检查依赖工具
     */
    checkDependencies() {
        const tools = ['convert', 'pngquant', 'cwebp', 'jpegoptim'];
        
        console.log('🔍 检查依赖工具...');
        
        for (const tool of tools) {
            try {
                execSync(`which ${tool}`);
                console.log(`  ✓ ${tool}`);
            } catch (error) {
                console.log(`  ✗ ${tool} 未安装`);
                
                // 显示安装建议
                if (tool === 'convert') {
                    console.log('    安装: sudo apt install imagemagick');
                } else if (tool === 'pngquant') {
                    console.log('    安装: sudo apt install pngquant');
                } else if (tool === 'cwebp') {
                    console.log('    安装: sudo apt install webp');
                } else if (tool === 'jpegoptim') {
                    console.log('    安装: sudo apt install jpegoptim');
                }
            }
        }
        
        console.log('');
    }
    
    /**
     * 扫描目录获取所有图片文件
     */
    scanDirectory(dir) {
        const files = [];
        
        const scan = (currentDir) => {
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // 递归扫描子目录
                    scan(fullPath);
                } else if (this.isImageFile(fullPath)) {
                    files.push(fullPath);
                    this.stats.totalFiles++;
                    this.stats.totalSizeBefore += stat.size;
                }
            }
        };
        
        scan(dir);
        return files;
    }
    
    /**
     * 检查是否为支持的图片文件
     */
    isImageFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return this.supportedFormats.includes(ext);
    }
    
    /**
     * 获取文件信息
     */
    getFileInfo(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const basename = path.basename(filePath);
        const dir = path.dirname(filePath);
        const size = fs.statSync(filePath).size;
        
        return {
            path: filePath,
            basename,
            dir,
            ext,
            size,
            relativePath: path.relative(process.cwd(), filePath)
        };
    }
    
    /**
     * 创建输出目录
     */
    createOutputDir(fileInfo) {
        const relativeDir = path.relative(process.cwd(), fileInfo.dir);
        const outputPath = path.join(this.config.outputDir, relativeDir);
        
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        
        return path.join(outputPath, fileInfo.basename);
    }
    
    /**
     * 优化PNG图片
     */
    optimizePNG(inputPath, outputPath) {
        try {
            console.log(`  📦 优化PNG: ${path.basename(inputPath)}`);
            
            // 步骤1: 使用pngquant压缩
            const tempPath = outputPath.replace('.png', '_temp.png');
            const pngquantCmd = `pngquant --force --output "${tempPath}" --quality ${this.config.png.quality} --speed ${this.config.png.speed} "${inputPath}"`;
            
            try {
                execSync(pngquantCmd, { stdio: 'pipe' });
            } catch (error) {
                // 如果pngquant失败，复制原始文件
                fs.copyFileSync(inputPath, tempPath);
            }
            
            // 步骤2: 检查尺寸，如果太大则缩放
            const identifyCmd = `identify -format "%wx%h" "${tempPath}"`;
            const dimensions = execSync(identifyCmd, { stdio: 'pipe' }).toString().trim();
            const [width, height] = dimensions.split('x').map(Number);
            
            let convertCmd = `convert "${tempPath}"`;
            
            // 如果图片太大，进行缩放
            if (width > this.config.maxWidth || height > this.config.maxHeight) {
                convertCmd += ` -resize ${this.config.maxWidth}x${this.config.maxHeight}>`;
            }
            
            // 转换为PNG格式
            convertCmd += ` -quality ${this.config.png.quality} "${outputPath}"`;
            
            execSync(convertCmd, { stdio: 'pipe' });
            
            // 删除临时文件
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            
            // 步骤3: 转换为WebP格式（可选）
            const webpPath = outputPath.replace('.png', '.webp');
            const webpCmd = `cwebp -q ${this.config.webp.quality} -m ${this.config.webp.method} "${outputPath}" -o "${webpPath}"`;
            
            try {
                execSync(webpCmd, { stdio: 'pipe' });
                console.log(`    ✓ 生成WebP: ${path.basename(webpPath)}`);
            } catch (error) {
                console.log(`    ⚠️  WebP转换失败`);
            }
            
            this.stats.optimizedFiles++;
            return true;
            
        } catch (error) {
            console.error(`    ✗ PNG优化失败: ${error.message}`);
            this.stats.failedFiles++;
            return false;
        }
    }
    
    /**
     * 优化JPEG图片
     */
    optimizeJPEG(inputPath, outputPath) {
        try {
            console.log(`  📦 优化JPEG: ${path.basename(inputPath)}`);
            
            // 步骤1: 使用jpegoptim优化
            const jpegoptimCmd = `jpegoptim --max=${this.config.jpg.quality} --strip-all --all-progressive "${inputPath}" --dest="${path.dirname(outputPath)}"`;
            
            try {
                execSync(jpegoptimCmd, { stdio: 'pipe' });
                
                // 移动文件到输出位置
                const tempOutput = path.join(path.dirname(outputPath), path.basename(inputPath));
                if (tempOutput !== outputPath) {
                    fs.renameSync(tempOutput, outputPath);
                }
            } catch (error) {
                // 如果jpegoptim失败，使用convert
                const convertCmd = `convert "${inputPath}" -quality ${this.config.jpg.quality} -strip "${outputPath}"`;
                execSync(convertCmd, { stdio: 'pipe' });
            }
            
            // 步骤2: 检查尺寸，如果太大则缩放
            const identifyCmd = `identify -format "%wx%h" "${outputPath}"`;
            const dimensions = execSync(identifyCmd, { stdio: 'pipe' }).toString().trim();
            const [width, height] = dimensions.split('x').map(Number);
            
            if (width > this.config.maxWidth || height > this.config.maxHeight) {
                const resizeCmd = `convert "${outputPath}" -resize ${this.config.maxWidth}x${this.config.maxHeight}> "${outputPath}"`;
                execSync(resizeCmd, { stdio: 'pipe' });
            }
            
            // 步骤3: 转换为WebP格式
            const webpPath = outputPath.replace(/\.[^/.]+$/, '.webp');
            const webpCmd = `cwebp -q ${this.config.webp.quality} -m ${this.config.webp.method} "${outputPath}" -o "${webpPath}"`;
            
            try {
                execSync(webpCmd, { stdio: 'pipe' });
                console.log(`    ✓ 生成WebP: ${path.basename(webpPath)}`);
            } catch (error) {
                console.log(`    ⚠️  WebP转换失败`);
            }
            
            this.stats.optimizedFiles++;
            return true;
            
        } catch (error) {
            console.error(`    ✗ JPEG优化失败: ${error.message}`);
            this.stats.failedFiles++;
            return false;
        }
    }
    
    /**
     * 优化WebP图片
     */
    optimizeWebP(inputPath, outputPath) {
        try {
            console.log(`  📦 优化WebP: ${path.basename(inputPath)}`);
            
            // WebP文件直接复制（假设已经优化过）
            fs.copyFileSync(inputPath, outputPath);
            
            this.stats.optimizedFiles++;
            return true;
            
        } catch (error) {
            console.error(`    ✗ WebP优化失败: ${error.message}`);
            this.stats.failedFiles++;
            return false;
        }
    }
    
    /**
     * 优化单个图片文件
     */
    optimizeFile(filePath) {
        const fileInfo = this.getFileInfo(filePath);
        const outputPath = this.createOutputDir(fileInfo);
        
        console.log(`\n📁 处理: ${fileInfo.relativePath}`);
        console.log(`  尺寸: ${this.formatFileSize(fileInfo.size)}`);
        
        let success = false;
        
        switch (fileInfo.ext) {
            case '.png':
                success = this.optimizePNG(filePath, outputPath);
                break;
                
            case '.jpg':
            case '.jpeg':
                success = this.optimizeJPEG(filePath, outputPath);
                break;
                
            case '.webp':
                success = this.optimizeWebP(filePath, outputPath);
                break;
                
            default:
                console.log(`  ⚠️  不支持的文件格式: ${fileInfo.ext}`);
                success = false;
        }
        
        if (success) {
            const outputSize = fs.statSync(outputPath).size;
            this.stats.totalSizeAfter += outputSize;
            
            const compressionRate = Math.round((1 - outputSize / fileInfo.size) * 100);
            console.log(`  优化后: ${this.formatFileSize(outputSize)} (${compressionRate > 0 ? '-' : '+'}${Math.abs(compressionRate)}%)`);
        }
        
        return success;
    }
    
    /**
     * 批量优化目录中的所有图片
     */
    optimizeDirectory(dir) {
        console.log('🚀 开始优化美术资源...\n');
        
        // 创建输出目录
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }
        
        // 扫描图片文件
        const files = this.scanDirectory(dir);
        
        if (files.length === 0) {
            console.log('📭 未找到图片文件');
            return;
        }
        
        console.log(`🔍 找到 ${files.length} 个图片文件\n`);
        
        // 处理每个文件
        for (const file of files) {
            this.optimizeFile(file);
        }
        
        // 生成报告
        this.generateReport();
    }
    
    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
    
    /**
     * 生成优化报告
     */
    generateReport() {
        console.log('\n📊 === 优化报告 ===');
        console.log(`总文件数: ${this.stats.totalFiles}`);
        console.log(`优化成功: ${this.stats.optimizedFiles}`);
        console.log(`优化失败: ${this.stats.failedFiles}`);
        
        if (this.stats.totalSizeBefore > 0) {
            const totalSaved = this.stats.totalSizeBefore - this.stats.totalSizeAfter;
            const compressionRate = Math.round((totalSaved / this.stats.totalSizeBefore) * 100);
            
            console.log(`\n📈 压缩效果:`);
            console.log(`原始大小: ${this.formatFileSize(this.stats.totalSizeBefore)}`);
            console.log(`优化后大小: ${this.formatFileSize(this.stats.totalSizeAfter)}`);
            console.log(`节省空间: ${this.formatFileSize(totalSaved)} (${compressionRate}%)`);
            
            // 检查是否满足微信小游戏要求
            const totalMB = this.stats.totalSizeAfter / (1024 * 1024);
            console.log(`\n🎯 微信小游戏包体限制 (<8MB):`);
            console.log(`当前包体大小: ${totalMB.toFixed(2)} MB`);
            
            if (totalMB < 8) {
                console.log(`✅ 满足要求! 还有 ${(8 - totalMB).toFixed(2)} MB 空间`);
            } else {
                console.log(`❌ 超出限制! 超出 ${(totalMB - 8).toFixed(2)} MB`);
                console.log('建议:');
                console.log('  1. 进一步压缩图片质量');
                console.log('  2. 移除不必要的大图');
                console.log('  3. 使用精灵图合并小图');
                console.log('  4. 将大图转为WebP格式');
            }
        }
        
        // 保存报告到文件
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            config: this.config
        };
        
        const reportPath = path.join(this.config.outputDir, 'optimization-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 详细报告已保存: ${reportPath}`);
    }
    
    /**
     * 快速优化当前目录
     */
    quickOptimize() {
        console.log('⚡ 快速优化模式\n');
        this.optimizeDirectory('.');
    }
}

// 使用方法示例
if (require.main === module) {
    const optimizer = new ArtOptimizer();
    
    // 检查命令行参数
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('🎨 微信小游戏美术资源优化工具\n');
        console.log('使用方法:');
        console.log('  node 压缩优化脚本.js check        检查依赖工具');
        console.log('  node 压缩优化脚本.js optimize     优化当前目录');
        console.log('  node 压缩优化脚本.js path/to/dir  优化指定目录');
        console.log('');
        
        // 默认检查依赖
        optimizer.checkDependencies();
    } else if (args[0] === 'check') {
        optimizer.checkDependencies();
    } else if (args[0] === 'optimize') {
        optimizer.quickOptimize();
    } else {
        // 优化指定目录
        const targetDir = args[0];
        
        if (fs.existsSync(targetDir)) {
            optimizer.checkDependencies();
            optimizer.optimizeDirectory(targetDir);
        } else {
            console.error(`❌ 目录不存在: ${targetDir}`);
        }
    }
}

module.exports = ArtOptimizer;