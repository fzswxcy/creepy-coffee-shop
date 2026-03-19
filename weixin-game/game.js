/**
 * 微恐咖啡厅 - 微信小游戏入口文件
 * 超轻量版本，今日即可上线体验
 */

// 游戏配置
const CONFIG = {
  gameTitle: "微恐咖啡厅",
  version: "1.0.0-mini",
  fps: 60,
  debug: true
};

// 游戏核心数据
let gameData = {
  coins: 100,  // 初始金币
  coffeeCount: 0,  // 已制作咖啡数量
  machineLevel: 1,
  productionTime: 3.0,
  isProducing: false,
  progress: 0,
  broken: false
};

// 微信小游戏Canvas
let canvas = null;
let ctx = null;

// 初始化游戏
function initGame() {
  console.log(`🎮 初始化《${CONFIG.gameTitle}》v${CONFIG.version}`);
  
  canvas = wx.createCanvas();
  ctx = canvas.getContext('2d');
  
  // 设置Canvas大小
  canvas.width = 375;
  canvas.height = 667;
  
  // 监听点击事件
  canvas.addEventListener('touchstart', handleTouch);
  
  // 游戏循环
  requestAnimationFrame(gameLoop);
  
  // 显示初始状态
  updateUI();
}

// 游戏主循环
function gameLoop(timestamp) {
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制游戏背景
  drawBackground();
  
  // 绘制咖啡机
  drawCoffeeMachine();
  
  // 绘制进度条
  if (gameData.isProducing) {
    drawProgressBar();
  }
  
  // 绘制UI
  drawUI();
  
  // 继续循环
  requestAnimationFrame(gameLoop);
}

// 绘制游戏背景
function drawBackground() {
  // 咖啡厅背景
  ctx.fillStyle = '#8B4513';  // 棕色地板
  ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
  
  // 墙壁
  ctx.fillStyle = '#F5DEB3';  // 米色墙壁
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
  
  // 窗户
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(canvas.width * 0.7, canvas.height * 0.1, 80, 80);
  
  // 标题
  ctx.fillStyle = '#8B0000';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(CONFIG.gameTitle, canvas.width / 2, 40);
}

// 绘制咖啡机
function drawCoffeeMachine() {
  const x = canvas.width / 2;
  const y = canvas.height * 0.4;
  const size = 120;
  
  // 咖啡机主体
  ctx.fillStyle = gameData.broken ? '#8B0000' : '#A9A9A9';
  ctx.fillRect(x - size/2, y - size/2, size, size);
  
  // 咖啡机细节
  ctx.fillStyle = gameData.broken ? '#FF4500' : '#4CAF50';
  ctx.beginPath();
  ctx.arc(x, y - 20, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // 咖啡机状态文字
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  
  if (gameData.broken) {
    ctx.fillText('💀 已损坏', x, y + 50);
  } else if (gameData.isProducing) {
    ctx.fillText('⚙️ 制作中', x, y + 50);
  } else {
    ctx.fillText('☕ 点击制作', x, y + 50);
  }
}

// 绘制进度条
function drawProgressBar() {
  const x = canvas.width / 2 - 100;
  const y = canvas.height * 0.7;
  const width = 200;
  const height = 20;
  
  // 进度条背景
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, width, height);
  
  // 进度条前景
  const progressWidth = width * gameData.progress;
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(x, y, progressWidth, height);
  
  // 进度文字
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`进度: ${Math.round(gameData.progress * 100)}%`, canvas.width / 2, y + 35);
}

// 绘制UI界面
function drawUI() {
  const padding = 20;
  
  // 金币显示
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`💰 ${gameData.coins} 金币`, padding, 70);
  
  // 咖啡数量
  ctx.fillStyle = '#8B4513';
  ctx.font = 'bold 18px Arial';
  ctx.fillText(`☕ ${gameData.coffeeCount} 杯咖啡`, padding, 100);
  
  // 机器等级
  ctx.fillStyle = '#4169E1';
  ctx.font = '18px Arial';
  ctx.fillText(`⚙️ 等级 ${gameData.machineLevel}`, padding, 130);
  
  // 操作按钮
  drawButtons();
}

// 绘制操作按钮
function drawButtons() {
  const buttonY = canvas.height * 0.85;
  
  // 制作咖啡按钮
  drawButton('制作咖啡', canvas.width * 0.25 - 60, buttonY, 120, 40, 
             gameData.broken || gameData.isProducing ? '#CCCCCC' : '#4CAF50');
  
  // 升级机器按钮
  const upgradeCost = calculateUpgradeCost();
  const canUpgrade = gameData.coins >= upgradeCost;
  drawButton(`升级 (${upgradeCost})`, canvas.width * 0.75 - 60, buttonY, 120, 40,
             canUpgrade ? '#4169E1' : '#CCCCCC');
  
  // 维修按钮（如果损坏）
  if (gameData.broken) {
    const repairCost = 50;
    drawButton(`维修 (${repairCost})`, canvas.width / 2 - 60, buttonY - 60, 120, 40,
               gameData.coins >= repairCost ? '#FF4500' : '#CCCCCC');
  }
}

// 绘制按钮函数
function drawButton(text, x, y, width, height, color) {
  // 按钮背景
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  
  // 按钮边框
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  
  // 按钮文字
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width/2, y + height/2);
}

// 触摸事件处理
function handleTouch(e) {
  const touch = e.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;
  
  const buttonY = canvas.height * 0.85;
  const buttonHeight = 40;
  
  // 检查点击制作咖啡按钮
  if (x >= canvas.width * 0.25 - 60 && x <= canvas.width * 0.25 + 60 &&
      y >= buttonY && y <= buttonY + buttonHeight) {
    produceCoffee();
  }
  
  // 检查点击升级按钮
  if (x >= canvas.width * 0.75 - 60 && x <= canvas.width * 0.75 + 60 &&
      y >= buttonY && y <= buttonY + buttonHeight) {
    upgradeMachine();
  }
  
  // 检查点击维修按钮
  if (gameData.broken && 
      x >= canvas.width / 2 - 60 && x <= canvas.width / 2 + 60 &&
      y >= buttonY - 60 && y <= buttonY - 60 + buttonHeight) {
    repairMachine();
  }
}

// 制作咖啡
function produceCoffee() {
  if (gameData.broken) {
    wx.showToast({
      title: '机器已损坏，请先维修！',
      icon: 'error'
    });
    return;
  }
  
  if (gameData.isProducing) {
    wx.showToast({
      title: '正在制作中，请稍候...',
      icon: 'none'
    });
    return;
  }
  
  console.log('开始制作咖啡...');
  
  gameData.isProducing = true;
  gameData.progress = 0;
  
  // 生产动画
  const interval = setInterval(() => {
    gameData.progress += 0.05;  // 每帧增加5%
    
    if (gameData.progress >= 1) {
      clearInterval(interval);
      finishProduction();
    }
  }, gameData.productionTime * 1000 / 20);  // 20帧完成
  
  // 震动效果
  playShakeAnimation();
}

// 完成生产
function finishProduction() {
  gameData.isProducing = false;
  gameData.progress = 0;
  
  // 获得金币和咖啡
  const value = calculateCoffeeValue();
  gameData.coins += value;
  gameData.coffeeCount++;
  
  // 检查是否损坏（5%概率）
  if (Math.random() < 0.05 / gameData.machineLevel) {
    gameData.broken = true;
    wx.showModal({
      title: '💀 机器损坏！',
      content: '咖啡机出现故障，需要花费50金币维修',
      showCancel: true
    });
  }
  
  // 显示获得奖励
  wx.showToast({
    title: `制作完成！获得${value}金币`,
    icon: 'success'
  });
  
  console.log(`咖啡制作完成，获得${value}金币，总计${gameData.coins}金币`);
  
  // 更新UI
  updateUI();
}

// 升级机器
function upgradeMachine() {
  const upgradeCost = calculateUpgradeCost();
  
  if (gameData.coins < upgradeCost) {
    wx.showToast({
      title: '金币不足！',
      icon: 'error'
    });
    return;
  }
  
  gameData.coins -= upgradeCost;
  gameData.machineLevel++;
  gameData.productionTime *= 0.9;  // 减少10%生产时间
  
  wx.showToast({
    title: `升级成功！当前等级${gameData.machineLevel}`,
    icon: 'success'
  });
  
  console.log(`机器升级到${gameData.machineLevel}级，生产时间${gameData.productionTime.toFixed(1)}秒`);
  
  updateUI();
}

// 维修机器
function repairMachine() {
  const repairCost = 50;
  
  if (gameData.coins < repairCost) {
    wx.showToast({
      title: '金币不足！',
      icon: 'error'
    });
    return;
  }
  
  gameData.coins -= repairCost;
  gameData.broken = false;
  
  wx.showToast({
    title: '维修完成！',
    icon: 'success'
  });
  
  console.log('机器维修完成');
  
  updateUI();
}

// 计算升级费用
function calculateUpgradeCost() {
  return 100 * Math.pow(1.5, gameData.machineLevel - 1);
}

// 计算咖啡价值
function calculateCoffeeValue() {
  return 10 * gameData.machineLevel;
}

// 播放震动动画
function playShakeAnimation() {
  // 简单的Canvas震动效果
  let shakeCount = 0;
  const shakeInterval = setInterval(() => {
    canvas.style.transform = `translateX(${Math.random() * 10 - 5}px)`;
    shakeCount++;
    
    if (shakeCount >= 10) {
      clearInterval(shakeInterval);
      canvas.style.transform = 'translateX(0)';
    }
  }, 100);
}

// 更新UI显示
function updateUI() {
  console.log(`💰 金币: ${gameData.coins} | ☕ 咖啡: ${gameData.coffeeCount} | ⚙️ 等级: ${gameData.machineLevel}`);
}

// 游戏入口
wx.onShow(() => {
  console.log('微信小游戏已显示');
  initGame();
});

// 导出模块
module.exports = {
  initGame,
  gameData,
  produceCoffee,
  upgradeMachine,
  repairMachine
};