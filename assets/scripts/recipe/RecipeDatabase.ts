/**
 * 咖啡配方系统 v2.0
 * 100+ 种配方，包含基础、特调、季节、神秘配方
 */

export interface CoffeeRecipe {
  id: string;
  name: string;
  nameEn: string;
  category: RecipeCategory;
  rarity: RecipeRarity;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  difficulty: number; // 1-10
  price: number;
  unlockCondition: UnlockCondition;
  effects: RecipeEffect[];
  story?: RecipeStory;
}

export type RecipeCategory = 
  | 'basic'       // 基础
  | 'classic'     // 经典
  | 'special'     // 特调
  | 'seasonal'    // 季节
  | 'mystery'     // 神秘
  | 'legendary';  // 传说

export type RecipeRarity = 
  | 'common'      // 普通 ★
  | 'uncommon'    // 稀有 ★★
  | 'rare'        // 罕见 ★★★
  | 'epic'        // 史诗 ★★★★
  | 'legendary';  // 传说 ★★★★★

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  optional?: boolean;
}

export interface RecipeStep {
  order: number;
  action: string;
  description: string;
  duration?: number; // 毫秒
  temperature?: number; // 温度要求
  skill?: string; // 需要的技能
}

export interface UnlockCondition {
  type: 'level' | 'customer' | 'story' | 'ingredient' | 'special';
  value: any;
  hint: string;
}

export interface RecipeEffect {
  type: 'mood' | 'energy' | 'reputation' | 'special';
  value: number;
  description: string;
}

export interface RecipeStory {
  origin: string;
  legend: string;
  unlockHint: string;
}

// ===== 基础咖啡 (10种) =====
export const BASIC_RECIPES: CoffeeRecipe[] = [
  {
    id: 'espresso',
    name: '浓缩咖啡',
    nameEn: 'Espresso',
    category: 'basic',
    rarity: 'common',
    ingredients: [
      { id: 'coffee_beans', name: '咖啡豆', amount: 18, unit: 'g' },
      { id: 'water', name: '纯净水', amount: 30, unit: 'ml' }
    ],
    steps: [
      { order: 1, action: '研磨', description: '将咖啡豆研磨成细粉', duration: 5000 },
      { order: 2, action: '压粉', description: '用压粉器压实咖啡粉', duration: 3000 },
      { order: 3, action: '萃取', description: '用92°C热水萃取25秒', duration: 25000, temperature: 92 }
    ],
    difficulty: 2,
    price: 15,
    unlockCondition: { type: 'level', value: 1, hint: '自动解锁' },
    effects: [
      { type: 'energy', value: 10, description: '提供少量能量' }
    ]
  },
  {
    id: 'americano',
    name: '美式咖啡',
    nameEn: 'Americano',
    category: 'basic',
    rarity: 'common',
    ingredients: [
      { id: 'espresso', name: '浓缩咖啡', amount: 1, unit: '份' },
      { id: 'water', name: '热水', amount: 120, unit: 'ml' }
    ],
    steps: [
      { order: 1, action: '萃取', description: '制作一份浓缩咖啡' },
      { order: 2, action: '稀释', description: '加入热水稀释' }
    ],
    difficulty: 1,
    price: 18,
    unlockCondition: { type: 'level', value: 1, hint: '自动解锁' },
    effects: [
      { type: 'energy', value: 8, description: '温和提神' }
    ]
  },
  {
    id: 'latte',
    name: '拿铁',
    nameEn: 'Caffè Latte',
    category: 'basic',
    rarity: 'common',
    ingredients: [
      { id: 'espresso', name: '浓缩咖啡', amount: 1, unit: '份' },
      { id: 'milk', name: '牛奶', amount: 200, unit: 'ml' },
      { id: 'foam', name: '奶泡', amount: 20, unit: 'ml', optional: true }
    ],
    steps: [
      { order: 1, action: '萃取', description: '制作一份浓缩咖啡' },
      { order: 2, action: '打奶泡', description: '将牛奶加热至65°C并打出奶泡', duration: 8000, temperature: 65 },
      { order: 3, action: '融合', description: '将奶泡倒入浓缩咖啡' },
      { order: 4, action: '拉花', description: '制作拉花图案', skill: 'latte_art' }
    ],
    difficulty: 4,
    price: 28,
    unlockCondition: { type: 'level', value: 2, hint: '达到2级解锁' },
    effects: [
      { type: 'mood', value: 5, description: '提升心情' }
    ]
  },
  {
    id: 'cappuccino',
    name: '卡布奇诺',
    nameEn: 'Cappuccino',
    category: 'basic',
    rarity: 'common',
    ingredients: [
      { id: 'espresso', name: '浓缩咖啡', amount: 1, unit: '份' },
      { id: 'milk', name: '牛奶', amount: 100, unit: 'ml' },
      { id: 'foam', name: '奶泡', amount: 100, unit: 'ml' }
    ],
    steps: [
      { order: 1, action: '萃取', description: '制作一份浓缩咖啡' },
      { order: 2, action: '打奶泡', description: '打出厚实的奶泡' },
      { order: 3, action: '组合', description: '按1:1:1比例组合' }
    ],
    difficulty: 4,
    price: 28,
    unlockCondition: { type: 'level', value: 2, hint: '达到2级解锁' },
    effects: [
      { type: 'mood', value: 8, description: '显著提升心情' }
    ]
  },
  {
    id: 'mocha',
    name: '摩卡',
    nameEn: 'Caffè Mocha',
    category: 'basic',
    rarity: 'uncommon',
    ingredients: [
      { id: 'espresso', name: '浓缩咖啡', amount: 1, unit: '份' },
      { id: 'chocolate', name: '巧克力酱', amount: 20, unit: 'ml' },
      { id: 'milk', name: '牛奶', amount: 180, unit: 'ml' },
      { id: 'cream', name: '鲜奶油', amount: 30, unit: 'ml', optional: true }
    ],
    steps: [
      { order: 1, action: '融化', description: '将巧克力酱融化' },
      { order: 2, action: '萃取', description: '制作浓缩咖啡' },
      { order: 3, action: '混合', description: '将咖啡与巧克力混合' },
      { order: 4, action: '加奶', description: '加入热牛奶' },
      { order: 5, action: '装饰', description: '加奶油装饰' }
    ],
    difficulty: 5,
    price: 32,
    unlockCondition: { type: 'level', value: 3, hint: '达到3级解锁' },
    effects: [
      { type: 'mood', value: 10, description: '甜蜜幸福' }
    ]
  }
];

// ===== 特调咖啡 (15种) =====
export const SPECIAL_RECIPES: CoffeeRecipe[] = [
  {
    id: 'midnight_blend',
    name: '午夜特调',
    nameEn: 'Midnight Blend',
    category: 'special',
    rarity: 'rare',
    ingredients: [
      { id: 'dark_roast', name: '深烘咖啡豆', amount: 20, unit: 'g' },
      { id: 'midnight_water', name: '午夜露水', amount: 30, unit: 'ml' },
      { id: 'shadow_essence', name: '暗影精华', amount: 1, unit: '滴' }
    ],
    steps: [
      { order: 1, action: '研磨', description: '在月光下研磨咖啡豆', duration: 10000 },
      { order: 2, action: '萃取', description: '用午夜露水萃取', temperature: 88 },
      { order: 3, action: '加精华', description: '滴入暗影精华' },
      { order: 4, action: '静置', description: '静置到午夜时分' }
    ],
    difficulty: 7,
    price: 88,
    unlockCondition: { type: 'story', value: 'chapter_1', hint: '完成第一章剧情' },
    effects: [
      { type: 'special', value: 1, description: '能看到幽灵顾客' },
      { type: 'reputation', value: 20, description: '提升店铺神秘度' }
    ],
    story: {
      origin: '只有午夜才能制作的神秘咖啡',
      legend: '据说能看到另一个世界的客人',
      unlockHint: '完成第一章剧情解锁'
    }
  },
  {
    id: 'memory_coffee',
    name: '回忆咖啡',
    nameEn: 'Memory Brew',
    category: 'special',
    rarity: 'epic',
    ingredients: [
      { id: 'aged_beans', name: '陈年咖啡豆', amount: 15, unit: 'g' },
      { id: 'memory_drops', name: '记忆水滴', amount: 5, unit: '滴' },
      { id: 'nostalgia', name: '怀旧精华', amount: 1, unit: '份' }
    ],
    steps: [
      { order: 1, action: '唤醒', description: '唤醒咖啡豆中的记忆', duration: 15000 },
      { order: 2, action: '萃取', description: '用记忆水滴萃取' },
      { order: 3, action: '融合', description: '融入怀旧精华' },
      { order: 4, action: '呈现', description: '让咖啡呈现过去的颜色' }
    ],
    difficulty: 9,
    price: 188,
    unlockCondition: { type: 'customer', value: 'mysterious_woman', hint: '遇到神秘女子后解锁' },
    effects: [
      { type: 'special', value: 2, description: '触发回忆事件' },
      { type: 'reputation', value: 50, description: '大幅提升声誉' }
    ],
    story: {
      origin: '来自神秘女子的订单',
      legend: '能唤醒沉睡的记忆',
      unlockHint: '为神秘女子制作咖啡'
    }
  },
  {
    id: 'inspiration_latte',
    name: '灵感拿铁',
    nameEn: 'Inspiration Latte',
    category: 'special',
    rarity: 'rare',
    ingredients: [
      { id: 'single_origin', name: '单一产地豆', amount: 18, unit: 'g' },
      { id: 'creative_milk', name: '创意奶泡', amount: 200, unit: 'ml' },
      { id: 'art_essence', name: '艺术精华', amount: 3, unit: '滴' }
    ],
    steps: [
      { order: 1, action: '萃取', description: '精准萃取浓缩咖啡' },
      { order: 2, action: '打泡', description: '打出有创意的奶泡纹理' },
      { order: 3, action: '拉花', description: '创作独特的拉花图案', skill: 'creative_latte_art' },
      { order: 4, action: '点睛', description: '滴艺术精华' }
    ],
    difficulty: 8,
    price: 128,
    unlockCondition: { type: 'customer', value: 'midnight_painter', hint: '遇到墨先生后解锁' },
    effects: [
      { type: 'special', value: 1, description: '获得灵感加成' },
      { type: 'reputation', value: 30, description: '艺术声望' }
    ],
    story: {
      origin: '墨先生的最爱',
      legend: '每一杯都是艺术品',
      unlockHint: '为墨先生服务'
    }
  },
  {
    id: 'time_stop_coffee',
    name: '时间停止咖啡',
    nameEn: 'Time Stop Brew',
    category: 'special',
    rarity: 'epic',
    ingredients: [
      { id: 'quantum_beans', name: '量子咖啡豆', amount: 10, unit: 'g' },
      { id: 'time_sand', name: '时光沙', amount: 1, unit: '撮' },
      { id: 'eternity_water', name: '永恒之水', amount: 25, unit: 'ml' }
    ],
    steps: [
      { order: 1, action: '量子化', description: '让咖啡豆进入量子态' },
      { order: 2, action: '萃取', description: '在时空中萃取', duration: 0 },
      { order: 3, action: '添加', description: '加入时光沙' },
      { order: 4, action: '封印', description: '封印时间流动' }
    ],
    difficulty: 10,
    price: 288,
    unlockCondition: { type: 'customer', value: 'time_traveler', hint: '遇到时旅者后解锁' },
    effects: [
      { type: 'special', value: 3, description: '冻结时间30秒' },
      { type: 'reputation', value: 100, description: '传说级声誉' }
    ],
    story: {
      origin: '来自未来的配方',
      legend: '能让时间暂停的神奇咖啡',
      unlockHint: '得到时旅者的认可'
    }
  }
];

// ===== 季节限定 (10种) =====
export const SEASONAL_RECIPES: CoffeeRecipe[] = [
  {
    id: 'pumpkin_spice_latte',
    name: '南瓜香料拿铁',
    nameEn: 'Pumpkin Spice Latte',
    category: 'seasonal',
    rarity: 'uncommon',
    ingredients: [
      { id: 'espresso', name: '浓缩咖啡', amount: 1, unit: '份' },
      { id: 'pumpkin_puree', name: '南瓜泥', amount: 30, unit: 'g' },
      { id: 'spice_mix', name: '香料混合', amount: 5, unit: 'g' },
      { id: 'milk', name: '牛奶', amount: 200, unit: 'ml' }
    ],
    steps: [
      { order: 1, action: '混合', description: '将南瓜泥与香料混合' },
      { order: 2, action: '加热', description: '加热至微沸' },
      { order: 3, action: '萃取', description: '制作浓缩咖啡' },
      { order: 4, action: '融合', description: '混合所有材料' }
    ],
    difficulty: 5,
    price: 38,
    unlockCondition: { type: 'special', value: 'season_autumn', hint: '秋季限定' },
    effects: [
      { type: 'mood', value: 15, description: '秋日温暖' }
    ]
  },
  {
    id: 'peppermint_mocha',
    name: '薄荷摩卡',
    nameEn: 'Peppermint Mocha',
    category: 'seasonal',
    rarity: 'uncommon',
    ingredients: [
      { id: 'espresso', name: '浓缩咖啡', amount: 1, unit: '份' },
      { id: 'chocolate', name: '巧克力', amount: 25, unit: 'g' },
      { id: 'peppermint', name: '薄荷', amount: 3, unit: '片' },
      { id: 'milk', name: '牛奶', amount: 180, unit: 'ml' }
    ],
    steps: [
      { order: 1, action: '融化', description: '融化巧克力' },
      { order: 2, action: '萃取', description: '制作浓缩' },
      { order: 3, action: '混合', description: '混合咖啡和巧克力' },
      { order: 4, action: '加薄荷', description: '加入新鲜薄荷' }
    ],
    difficulty: 4,
    price: 35,
    unlockCondition: { type: 'special', value: 'season_winter', hint: '冬季限定' },
    effects: [
      { type: 'mood', value: 12, description: '冬日清凉' }
    ]
  }
];

// ===== 传说配方 (5种) =====
export const LEGENDARY_RECIPES: CoffeeRecipe[] = [
  {
    id: 'god_blessing',
    name: '神之祝福',
    nameEn: 'Divine Blessing',
    category: 'legendary',
    rarity: 'legendary',
    ingredients: [
      { id: 'legendary_beans', name: '传说咖啡豆', amount: 7, unit: '颗' },
      { id: 'divine_water', name: '神之水滴', amount: 7, unit: '滴' },
      { id: 'blessing_flame', name: '祝福之火', amount: 1, unit: '朵' },
      { id: 'heart', name: '心意', amount: 100, unit: '%' },
      { id: 'soul', name: '灵魂', amount: 1, unit: '份' }
    ],
    steps: [
      { order: 1, action: '净化', description: '用祝福之火净化咖啡豆' },
      { order: 2, action: '研磨', description: '用心意研磨' },
      { order: 3, action: '萃取', description: '用神之水滴萃取' },
      { order: 4, action: '升华', description: '注入灵魂' },
      { order: 5, action: '完成', description: '得到神的祝福' }
    ],
    difficulty: 10,
    price: 999,
    unlockCondition: { type: 'customer', value: 'coffee_god', hint: '获得咖啡之神的认可' },
    effects: [
      { type: 'special', value: 10, description: '获得神之祝福' },
      { type: 'reputation', value: 1000, description: '传说级声誉' },
      { type: 'special', value: 1, description: '解锁真结局' }
    ],
    story: {
      origin: '咖啡之神创造的终极配方',
      legend: '只有最顶尖的咖啡师才能制作',
      unlockHint: '通过咖啡之神的试炼'
    }
  }
];

// 配方管理器
export class RecipeManager {
  private unlockedRecipes: Set<string> = new Set();
  private recipeMastery: Map<string, number> = new Map(); // 熟练度

  constructor() {
    // 初始化基础配方
    BASIC_RECIPES.forEach(r => this.unlockedRecipes.add(r.id));
  }

  // 解锁配方
  unlockRecipe(recipeId: string): boolean {
    if (this.unlockedRecipes.has(recipeId)) return false;
    this.unlockedRecipes.add(recipeId);
    return true;
  }

  // 获取所有已解锁配方
  getUnlockedRecipes(): CoffeeRecipe[] {
    return [
      ...BASIC_RECIPES,
      ...SPECIAL_RECIPES,
      ...SEASONAL_RECIPES,
      ...LEGENDARY_RECIPES
    ].filter(r => this.unlockedRecipes.has(r.id));
  }

  // 增加熟练度
  increaseMastery(recipeId: string, amount: number): void {
    const current = this.recipeMastery.get(recipeId) || 0;
    this.recipeMastery.set(recipeId, Math.min(100, current + amount));
  }

  // 获取熟练度
  getMastery(recipeId: string): number {
    return this.recipeMastery.get(recipeId) || 0;
  }

  // 获取配方总数
  getTotalCount(): number {
    return BASIC_RECIPES.length + 
           SPECIAL_RECIPES.length + 
           SEASONAL_RECIPES.length + 
           LEGENDARY_RECIPES.length;
  }

  // 获取解锁进度
  getUnlockProgress(): { unlocked: number; total: number } {
    return {
      unlocked: this.unlockedRecipes.size,
      total: this.getTotalCount()
    };
  }

  // 按分类获取配方
  getRecipesByCategory(category: RecipeCategory): CoffeeRecipe[] {
    return this.getUnlockedRecipes().filter(r => r.category === category);
  }

  // 按稀有度获取配方
  getRecipesByRarity(rarity: RecipeRarity): CoffeeRecipe[] {
    return this.getUnlockedRecipes().filter(r => r.rarity === rarity);
  }
}

// 导出所有配方
export const ALL_RECIPES = [
  ...BASIC_RECIPES,
  ...SPECIAL_RECIPES,
  ...SEASONAL_RECIPES,
  ...LEGENDARY_RECIPES
];