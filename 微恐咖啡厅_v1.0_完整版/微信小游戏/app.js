// app.js - 微信小程序入口
App({
  onLaunch() {
    console.log('微恐咖啡厅 - 小程序启动');
    
    // 检查微信版本兼容性
    const systemInfo = wx.getSystemInfoSync();
    console.log('设备信息:', systemInfo);
    
    // 初始化游戏
    this.initGame();
  },
  
  initGame() {
    // 游戏全局状态
    this.gameData = {
      money: 100,           // 初始资金
      reputation: 0,        // 声誉值
      day: 1,               // 天数
      time: '09:00',        // 当前时间
      customersServed: 0,   // 服务顾客数
      coffeeMade: 0,        // 制作咖啡数
      isOpen: true,         // 是否营业
    };
    
    console.log('游戏初始化完成:', this.gameData);
  },
  
  // 全局方法
  addMoney(amount) {
    this.gameData.money += amount;
    this.triggerGameUpdate();
  },
  
  serveCustomer() {
    this.gameData.customersServed++;
    this.gameData.reputation += 1;
    this.addMoney(25); // 每服务一个顾客赚25元
    this.triggerGameUpdate();
  },
  
  makeCoffee() {
    this.gameData.coffeeMade++;
    this.triggerGameUpdate();
  },
  
  triggerGameUpdate() {
    // 触发游戏状态更新事件
    if (this.gameUpdateCallback) {
      this.gameUpdateCallback(this.gameData);
    }
  },
  
  // 设置更新回调
  onGameUpdate(callback) {
    this.gameUpdateCallback = callback;
  },
  
  // 获取游戏数据
  getGameData() {
    return this.gameData;
  }
});