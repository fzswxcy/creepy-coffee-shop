/**
 * 新手引导系统 v1.0
 * 渐进式教学，不坐牢
 */

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlight: string;
  action: string;
  reward?: TutorialReward;
  skippable: boolean;
}

export interface TutorialReward {
  coins?: number;
  items?: string[];
  recipes?: string[];
}

export interface TutorialDay {
  day: number;
  steps: TutorialStep[];
  theme: string;
}

// 第一天：基础操作
export const TUTORIAL_DAY_1: TutorialDay = {
  day: 1,
  theme: '欢迎来到微恐咖啡厅',
  steps: [
    {
      id: 'tutorial_welcome',
      title: '欢迎',
      description: '欢迎来到微恐咖啡厅！我是你的向导。',
      highlight: 'ui_welcome',
      action: '点击继续',
      skippable: false
    },
    {
      id: 'tutorial_espresso',
      title: '制作第一杯咖啡',
      description: '点击咖啡机，选择"浓缩咖啡"，然后点击"制作"。',
      highlight: 'coffee_machine',
      action: 'make_espresso',
      reward: { coins: 50, recipes: ['espresso'] },
      skippable: false
    },
    {
      id: 'tutorial_customer',
      title: '接待顾客',
      description: '点击进门的顾客，看看他们想要什么。',
      highlight: 'customer_area',
      action: 'serve_customer',
      reward: { coins: 50 },
      skippable: false
    },
    {
      id: 'tutorial_earning',
      title: '获得收益',
      description: '完成订单后会获得金币，用来升级店铺。',
      highlight: 'money_display',
      action: 'click_continue',
      reward: { coins: 100 },
      skippable: true
    }
  ]
};

// 第二天：进阶操作
export const TUTORIAL_DAY_2: TutorialDay = {
  day: 2,
  theme: '学习新配方',
  steps: [
    {
      id: 'tutorial_latte',
      title: '制作拿铁',
      description: '现在学习制作拿铁。需要浓缩咖啡+牛奶+奶泡。',
      highlight: 'recipe_book',
      action: 'make_latte',
      reward: { coins: 100, recipes: ['latte'] },
      skippable: true
    },
    {
      id: 'tutorial_upgrade',
      title: '升级设备',
      description: '用赚到的钱升级咖啡机，可以更快制作咖啡。',
      highlight: 'upgrade_menu',
      action: 'upgrade_machine',
      reward: { coins: 200 },
      skippable: true
    }
  ]
};

// 第三天：特殊玩法
export const TUTORIAL_DAY_3: TutorialDay = {
  day: 3,
  theme: '神秘顾客',
  steps: [
    {
      id: 'tutorial_special_customer',
      title: '特殊顾客',
      description: '有些顾客只在特定时间出现，他们会带来特殊订单。',
      highlight: 'customer_info',
      action: 'serve_special',
      reward: { coins: 150 },
      skippable: true
    },
    {
      id: 'tutorial_story',
      title: '剧情系统',
      description: '点击菜单栏的"故事"，查看主线剧情。',
      highlight: 'story_menu',
      action: 'open_story',
      reward: { items: ['story_unlocked'] },
      skippable: true
    }
  ]
};

// 第四天：经营策略
export const TUTORIAL_DAY_4: TutorialDay = {
  day: 4,
  theme: '经营之道',
  steps: [
    {
      id: 'tutorial_decoration',
      title: '店铺装修',
      description: '购买装饰品可以吸引更多顾客，还能解锁隐藏剧情。',
      highlight: 'shop_menu',
      action: 'buy_decoration',
      reward: { items: ['welcome_plant'] },
      skippable: true
    },
    {
      id: 'tutorial_marketing',
      title: '营销活动',
      description: '举办活动可以快速提升人气和收入。',
      highlight: 'marketing_menu',
      action: 'start_event',
      reward: { coins: 300 },
      skippable: true
    }
  ]
};

// 第五天：微恐元素
export const TUTORIAL_DAY_5: TutorialDay = {
  day: 5,
  theme: '午夜的秘密',
  steps: [
    {
      id: 'tutorial_midnight',
      title: '午夜模式',
      description: '经营到午夜后，会有一些...特别的客人。',
      highlight: 'time_display',
      action: 'stay_until_midnight',
      reward: { recipes: ['midnight_blend'] },
      skippable: false
    },
    {
      id: 'tutorial_ghost',
      title: '第一位幽灵顾客',
      description: '不要慌张，友好地为他们服务。',
      highlight: 'ghost_customer',
      action: 'serve_ghost',
      reward: { coins: 500, items: ['ghost_friend_badge'] },
      skippable: false
    }
  ]
};

// 新手引导管理器
export class TutorialManager {
  private completedSteps: Set<string> = new Set();
  private currentDay: number = 1;
  private currentStep: number = 0;
  private isActive: boolean = true;

  constructor() {
    // 从存档加载进度
    this.loadProgress();
  }

  // 加载进度
  private loadProgress(): void {
    // 从本地存储读取
    // 简化实现
  }

  // 获取当前步骤
  getCurrentStep(): TutorialStep | null {
    const day = this.getCurrentDay();
    if (!day) return null;
    
    if (this.currentStep >= day.steps.length) {
      // 今日教程完成
      return null;
    }
    
    return day.steps[this.currentStep];
  }

  // 获取当前天数配置
  private getCurrentDay(): TutorialDay | null {
    const days = [
      TUTORIAL_DAY_1,
      TUTORIAL_DAY_2,
      TUTORIAL_DAY_3,
      TUTORIAL_DAY_4,
      TUTORIAL_DAY_5
    ];
    return days[this.currentDay - 1] || null;
  }

  // 完成当前步骤
  completeCurrentStep(): void {
    const step = this.getCurrentStep();
    if (!step) return;

    this.completedSteps.add(step.id);
    this.currentStep++;
    
    // 检查是否完成当天所有步骤
    const day = this.getCurrentDay();
    if (day && this.currentStep >= day.steps.length) {
      this._completeDay();
    }
    
    // 发放奖励
    if (step.reward) {
      this._giveReward(step.reward);
    }
    
    this.saveProgress();
  }

  // 跳过当前步骤
  skipCurrentStep(): boolean {
    const step = this.getCurrentStep();
    if (!step || !step.skippable) return false;
    
    this.currentStep++;
    this.saveProgress();
    return true;
  }

  // 完成当天
  private _completeDay(): void {
    this.currentDay++;
    this.currentStep = 0;
    
    if (this.currentDay > 5) {
      // 新手教程全部完成
      this.isActive = false;
      this._onTutorialComplete();
    }
  }

  // 发放奖励
  private _giveReward(reward: TutorialReward): void {
    if (reward.coins) {
      // 增加金币
      console.log(`获得 ${reward.coins} 金币`);
    }
    if (reward.items) {
      console.log(`获得物品: ${reward.items.join(', ')}`);
    }
    if (reward.recipes) {
      console.log(`获得配方: ${reward.recipes.join(', ')}`);
    }
  }

  // 教程完成
  private _onTutorialComplete(): void {
    console.log('🎉 恭喜完成新手引导！');
    // 发放毕业奖励
    this._giveReward({
      coins: 1000,
      items: ['graduate_badge', 'starter_pack'],
      recipes: ['house_special']
    });
  }

  // 保存进度
  private saveProgress(): void {
    // 保存到本地存储
  }

  // 检查步骤是否完成
  isStepCompleted(stepId: string): boolean {
    return this.completedSteps.has(stepId);
  }

  // 获取完成度
  getProgress(): { completed: number; total: number } {
    const totalSteps = 5 * 4; // 5天，每天约4步
    return {
      completed: this.completedSteps.size,
      total: totalSteps
    };
  }

  // 是否在新手期
  isInTutorial(): boolean {
    return this.isActive;
  }
}

// 导出所有教程天数
export const ALL_TUTORIAL_DAYS = [
  TUTORIAL_DAY_1,
  TUTORIAL_DAY_2,
  TUTORIAL_DAY_3,
  TUTORIAL_DAY_4,
  TUTORIAL_DAY_5
];