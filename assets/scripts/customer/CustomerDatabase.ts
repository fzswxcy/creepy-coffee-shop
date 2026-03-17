/**
 * 顾客系统 v2.0
 * 丰富的顾客类型、性格、故事线
 */

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  rarity: CustomerRarity;
  appearance: CustomerAppearance;
  personality: CustomerPersonality;
  story: CustomerStory;
  preferences: CustomerPreferences;
  unlockCondition: UnlockCondition;
}

export type CustomerType = 
  | 'normal'      // 普通顾客
  | 'special'     // 特殊顾客
  | 'rare'        // 稀有顾客
  | 'legendary'   // 传说顾客
  | 'ghost'       // 幽灵顾客
  | 'time_limited'; // 限时顾客

export type CustomerRarity = 
  | 'common'      // 普通 ★
  | 'uncommon'    // 稀有 ★★
  | 'rare'        // 罕见 ★★★
  | 'epic'        // 史诗 ★★★★
  | 'legendary';  // 传说 ★★★★★

export interface CustomerAppearance {
  avatar: string;
  model: string;
  animations: string[];
  specialEffects?: string[];
}

export interface CustomerPersonality {
  traits: string[];        // 性格特点
  mood: number;           // 心情值 0-100
  patience: number;       // 耐心值
  tipRate: number;        // 给小费概率
  specialBehavior?: string[]; // 特殊行为
}

export interface CustomerStory {
  background: string;     // 背景故事
  secret: string;        // 隐藏秘密
  connectionToShop?: string; // 与店铺的联系
  unlockHints: string[];  // 解锁提示
}

export interface CustomerPreferences {
  favoriteDrinks: string[];   // 最爱饮品
  hatedDrinks: string[];      // 讨厌饮品
  preferredTime?: string;     // 喜欢来的时间
  specialOrders?: SpecialOrder[]; // 特殊订单
}

export interface SpecialOrder {
  name: string;
  description: string;
  requiredIngredients: string[];
  reward: OrderReward;
}

export interface OrderReward {
  money: number;
  reputation: number;
  items?: string[];
  storyUnlock?: string;
}

export interface UnlockCondition {
  type: 'level' | 'story' | 'time' | 'item' | 'random' | 'special';
  value: any;
  hint: string;
}

// ===== 顾客数据库 =====

// 普通顾客 (Common)
export const CUSTOMERS_COMMON: Customer[] = [
  {
    id: 'office_worker_1',
    name: '张经理',
    type: 'normal',
    rarity: 'common',
    appearance: {
      avatar: 'avatar_suit_man',
      model: 'model_office_worker',
      animations: ['idle', 'drink', 'phone']
    },
    personality: {
      traits: ['忙碌', '效率至上', '压力大'],
      mood: 60,
      patience: 40,
      tipRate: 0.1
    },
    story: {
      background: '一家科技公司的项目经理，每天靠咖啡续命',
      secret: '其实梦想是开一家猫咪咖啡厅',
      unlockHints: ['早晨7-9点最容易遇到']
    },
    preferences: {
      favoriteDrinks: ['美式咖啡', '浓缩咖啡'],
      hatedDrinks: ['甜奶茶'],
      preferredTime: 'morning'
    },
    unlockCondition: {
      type: 'level',
      value: 1,
      hint: '自动解锁'
    }
  },
  {
    id: 'student_girl',
    name: '小雨',
    type: 'normal',
    rarity: 'common',
    appearance: {
      avatar: 'avatar_student',
      model: 'model_student',
      animations: ['study', 'sip', 'smile']
    },
    personality: {
      traits: ['可爱', '爱学习', '预算有限'],
      mood: 80,
      patience: 70,
      tipRate: 0.05
    },
    story: {
      background: '大学生，喜欢在这里自习和写作业',
      secret: '在写一本关于神秘咖啡厅的小说',
      unlockHints: ['下午和晚上常来']
    },
    preferences: {
      favoriteDrinks: ['拿铁', '卡布奇诺', '热可可'],
      hatedDrinks: ['苦咖啡'],
      preferredTime: 'afternoon'
    },
    unlockCondition: {
      type: 'level',
      value: 1,
      hint: '自动解锁'
    }
  }
];

// 特殊顾客 (Special)
export const CUSTOMERS_SPECIAL: Customer[] = [
  {
    id: 'midnight_painter',
    name: '墨先生',
    type: 'special',
    rarity: 'uncommon',
    appearance: {
      avatar: 'avatar_artist',
      model: 'model_painter',
      animations: ['paint', 'think', 'admire'],
      specialEffects: ['paint_drops', 'creative_aura']
    },
    personality: {
      traits: ['艺术家', '神秘', '夜猫子'],
      mood: 75,
      patience: 90,
      tipRate: 0.3,
      specialBehavior: ['有时会赠送画作', '只在深夜出现']
    },
    story: {
      background: '一位神秘的画家，据说他的画能预见未来',
      secret: '他画的正是这家咖啡厅的故事',
      connectionToShop: '能看到普通人看不到的东西',
      unlockHints: ['午夜时分，准备好画布...']
    },
    preferences: {
      favoriteDrinks: ['黑咖啡', '特调墨水咖啡'],
      specialOrders: [{
        name: '灵感之源',
        description: '一杯能激发灵感的神秘咖啡',
        requiredIngredients: ['黑咖啡', '月光精华', '创意粉末'],
        reward: {
          money: 100,
          reputation: 20,
          items: ['mysterious_painting'],
          storyUnlock: 'painter_story_1'
        }
      }]
    },
    unlockCondition: {
      type: 'time',
      value: 'midnight',
      hint: '在午夜12点后营业'
    }
  },
  {
    id: 'time_traveler',
    name: '时旅者',
    type: 'special',
    rarity: 'rare',
    appearance: {
      avatar: 'avatar_time_traveler',
      model: 'model_time_traveler',
      animations: ['appear', 'disappear', 'check_watch'],
      specialEffects: ['time_warp', 'clock_particles']
    },
    personality: {
      traits: ['来自未来', '匆忙', '知晓一切'],
      mood: 50,
      patience: 30,
      tipRate: 0.5,
      specialBehavior: ['突然出现又消失', '知道即将发生的事']
    },
    story: {
      background: '来自未来的时间旅行者，专门来品尝这家店的咖啡',
      secret: '他说这家咖啡厅在未来是个传说',
      connectionToShop: '知道店铺的所有秘密',
      unlockHints: ['当钟表全部指向12点时...']
    },
    preferences: {
      favoriteDrinks: ['时间停止咖啡', '未来拿铁'],
      specialOrders: [{
        name: '时光回溯',
        description: '能尝到过去味道的咖啡',
        requiredIngredients: ['陈年老豆', '时光沙', '记忆水'],
        reward: {
          money: 500,
          reputation: 50,
          items: ['time_crystal'],
          storyUnlock: 'time_travel_story'
        }
      }]
    },
    unlockCondition: {
      type: 'special',
      value: 'all_clocks_12',
      hint: '店铺里所有时钟指向12点时'
    }
  }
];

// 幽灵顾客 (Ghost)
export const CUSTOMERS_GHOST: Customer[] = [
  {
    id: 'former_owner',
    name: '前店主',
    type: 'ghost',
    rarity: 'epic',
    appearance: {
      avatar: 'avatar_ghost_owner',
      model: 'model_ghost',
      animations: ['float', 'fade', 'whisper'],
      specialEffects: ['ghost_glow', 'ectoplasm', 'transparency']
    },
    personality: {
      traits: ['慈祥', '守护', '知晓历史'],
      mood: 90,
      patience: 100,
      tipRate: 0,
      specialBehavior: ['只在特定日期出现', '给予智慧的建议', '不能收取金钱']
    },
    story: {
      background: '咖啡厅的第一任店主，已经去世50年，但依然守护着这里',
      secret: '知道咖啡厅建立的所有秘密，包括神秘配方的来源',
      connectionToShop: '店铺的守护灵',
      unlockHints: ['店铺周年纪念日', '完成特定任务后']
    },
    preferences: {
      favoriteDrinks: ['回忆咖啡', '经典配方'],
      specialOrders: [{
        name: '传承之味',
        description: '最初的配方，最纯粹的味道',
        requiredIngredients: ['祖传咖啡豆', '时光精华', '回忆之泪'],
        reward: {
          money: 0,
          reputation: 100,
          items: ['secret_recipe_book', 'shop_history'],
          storyUnlock: 'founder_story'
        }
      }]
    },
    unlockCondition: {
      type: 'special',
      value: 'shop_anniversary',
      hint: '店铺开业周年纪念日'
    }
  }
];

// 传说顾客 (Legendary)
export const CUSTOMERS_LEGENDARY: Customer[] = [
  {
    id: 'coffee_god',
    name: '咖啡之神',
    type: 'legendary',
    rarity: 'legendary',
    appearance: {
      avatar: 'avatar_coffee_god',
      model: 'model_deity',
      animations: ['divine', 'bless', 'taste', 'approve'],
      specialEffects: ['divine_light', 'coffee_aura', 'heavenly_particles', 'rainbow_beans']
    },
    personality: {
      traits: ['神明', '完美主义', '慈悲', '挑剔'],
      mood: 100,
      patience: 100,
      tipRate: 1.0,
      specialBehavior: ['每季度只来一次', '考验咖啡师的技艺', '赐予祝福']
    },
    story: {
      background: '咖啡的守护神，传说中的存在，只有最顶尖的咖啡师才能见到',
      secret: '他创造了所有咖啡的配方',
      connectionToShop: '店铺的终极考验',
      unlockHints: ['制作出完美的咖啡', '获得所有顾客的认可', '店铺达到最高等级']
    },
    preferences: {
      favoriteDrinks: ['神之咖啡', '完美浓缩', '天堂拿铁'],
      specialOrders: [{
        name: '神之试炼',
        description: '咖啡之神的终极考验，需要完美的技艺',
        requiredIngredients: ['传说咖啡豆', '神之水滴', '完美温度', '心意', '灵魂'],
        reward: {
          money: 10000,
          reputation: 1000,
          items: ['god_blessing', 'legendary_recipe_book', 'immortal_beans'],
          storyUnlock: 'true_ending'
        }
      }]
    },
    unlockCondition: {
      type: 'special',
      value: 'max_level_perfect_reputation',
      hint: '店铺满级且获得所有顾客认可'
    }
  }
];

// 顾客管理器
export class CustomerManager {
  private unlockedCustomers: Set<string> = new Set();
  private customerStories: Map<string, number> = new Map(); // 顾客好感度
  private encounteredGhosts: Set<string> = new Set();

  constructor() {
    // 初始化普通顾客
    CUSTOMERS_COMMON.forEach(c => this.unlockedCustomers.add(c.id));
  }

  // 检查顾客是否解锁
  isUnlocked(customerId: string): boolean {
    return this.unlockedCustomers.has(customerId);
  }

  // 解锁顾客
  unlockCustomer(customerId: string): boolean {
    if (this.unlockedCustomers.has(customerId)) return false;
    this.unlockedCustomers.add(customerId);
    return true;
  }

  // 获取所有已解锁顾客
  getUnlockedCustomers(): Customer[] {
    return [
      ...CUSTOMERS_COMMON,
      ...CUSTOMERS_SPECIAL,
      ...CUSTOMERS_GHOST,
      ...CUSTOMERS_LEGENDARY
    ].filter(c => this.unlockedCustomers.has(c.id));
  }

  // 根据时间获取可能出现的顾客
  getAvailableCustomers(time: string): Customer[] {
    return this.getUnlockedCustomers().filter(c => {
      if (!c.preferences.preferredTime) return true;
      return c.preferences.preferredTime === time;
    });
  }

  // 增加顾客好感度
  increaseAffection(customerId: string, amount: number): void {
    const current = this.customerStories.get(customerId) || 0;
    this.customerStories.set(customerId, Math.min(100, current + amount));
  }

  // 获取顾客好感度
  getAffection(customerId: string): number {
    return this.customerStories.get(customerId) || 0;
  }

  // 获取顾客总数
  getTotalCount(): number {
    return CUSTOMERS_COMMON.length + 
           CUSTOMERS_SPECIAL.length + 
           CUSTOMERS_GHOST.length + 
           CUSTOMERS_LEGENDARY.length;
  }

  // 获取解锁进度
  getUnlockProgress(): { unlocked: number; total: number } {
    return {
      unlocked: this.unlockedCustomers.size,
      total: this.getTotalCount()
    };
  }
}

// 导出所有顾客
export const ALL_CUSTOMERS = [
  ...CUSTOMERS_COMMON,
  ...CUSTOMERS_SPECIAL,
  ...CUSTOMERS_GHOST,
  ...CUSTOMERS_LEGENDARY
];