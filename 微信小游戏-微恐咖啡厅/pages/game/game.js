// game.js - 游戏主页面
const app = getApp();

Page({
  data: {
    gameData: {},
    coffeeOrders: [
      { id: 1, name: '美式咖啡', price: 15, time: 60 },
      { id: 2, name: '拿铁', price: 20, time: 80 },
      { id: 3, name: '卡布奇诺', price: 22, time: 90 }
    ],
    makingCoffee: false,
    coffeeProgress: 0,
    customerWaiting: false,
    customerTimer: 0
  },

  onLoad() {
    console.log('游戏页面加载');
    // 获取游戏数据
    this.setData({
      gameData: app.getGameData()
    });
    
    // 设置游戏更新监听
    app.onGameUpdate((gameData) => {
      this.setData({ gameData });
    });
    
    // 开始游戏循环
    this.startGameLoop();
  },
  
  startGameLoop() {
    // 游戏主循环
    this.gameLoop = setInterval(() => {
      this.updateGameTime();
      this.generateCustomer();
    }, 1000);
  },
  
  updateGameTime() {
    const gameData = this.data.gameData;
    let [hours, minutes] = gameData.time.split(':').map(Number);
    
    // 时间流逝（模拟时间加速）
    minutes += 5;
    if (minutes >= 60) {
      minutes = 0;
      hours += 1;
    }
    
    // 如果到21:00，结束营业
    if (hours >= 21) {
      this.endBusiness();
    }
    
    const newTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    app.gameData.time = newTime;
    app.triggerGameUpdate();
  },
  
  generateCustomer() {
    // 每30秒有一定概率生成顾客
    if (Math.random() < 0.2 && !this.data.customerWaiting) {
      this.setData({
        customerWaiting: true,
        customerTimer: 30 // 30秒等待时间
      });
      
      // 顾客等待倒计时
      this.customerCountdown = setInterval(() => {
        let timer = this.data.customerTimer - 1;
        this.setData({ customerTimer: timer });
        
        if (timer <= 0) {
          clearInterval(this.customerCountdown);
          this.customerLeave(); // 顾客离开
        }
      }, 1000);
    }
  },
  
  // 制作咖啡
  makeCoffee(order) {
    if (this.data.makingCoffee) return;
    
    this.setData({ makingCoffee: true, coffeeProgress: 0 });
    
    // 咖啡制作进度条
    const coffeeInterval = setInterval(() => {
      let progress = this.data.coffeeProgress + 2;
      this.setData({ coffeeProgress: progress });
      
      if (progress >= 100) {
        clearInterval(coffeeInterval);
        this.setData({ makingCoffee: false });
        
        // 咖啡制作完成
        app.makeCoffee();
        wx.showToast({
          title: `${order.name}制作完成！`,
          icon: 'success',
          duration: 1000
        });
      }
    }, order.time);
  },
  
  // 服务顾客
  serveCustomer() {
    if (!this.data.customerWaiting) return;
    
    clearInterval(this.customerCountdown);
    app.serveCustomer();
    
    this.setData({
      customerWaiting: false,
      customerTimer: 0
    });
    
    wx.vibrateShort(); // 震动反馈
  },
  
  // 顾客离开
  customerLeave() {
    this.setData({
      customerWaiting: false,
      customerTimer: 0
    });
    
    // 声誉降低
    app.gameData.reputation = Math.max(0, app.gameData.reputation - 2);
    app.triggerGameUpdate();
  },
  
  // 结束营业
  endBusiness() {
    clearInterval(this.gameLoop);
    clearInterval(this.customerCountdown);
    
    wx.showModal({
      title: '营业结束',
      content: `今日收入：${app.gameData.money - 100}元\n服务顾客：${app.gameData.customersServed}位`,
      showCancel: false,
      success: () => {
        // 进入第二天
        app.gameData.day++;
        app.gameData.money -= 50; // 每日成本
        app.gameData.time = '09:00';
        app.triggerGameUpdate();
        
        // 重新开始游戏循环
        this.startGameLoop();
      }
    });
  },
  
  onUnload() {
    // 清理定时器
    clearInterval(this.gameLoop);
    clearInterval(this.customerCountdown);
  }
});