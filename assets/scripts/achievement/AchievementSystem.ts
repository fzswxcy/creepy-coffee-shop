/**
 * 成就系统 v2.0
 * 丰富的成就、徽章、收集要素
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  requirements: AchievementRequirement[];
  rewards: AchievementReward;
  secret: boolean;
  hint?: string;
}

export type AchievementCategory =
  | 'beginner'      // 新手
  | 'coffee'        // 咖啡制作
  | 'customer'      // 顾客服务
  | 'business'      // 经营
  | 'story'         // 剧情
  | 'collection'    // 收集
  | 'challenge'     // 挑战
  | 'secret';       // 隐藏

export type AchievementRarity =
  | 'bronze'        // 铜 ★
  | 'silver'        // 银 ★★
  | 'gold'          // 金 ★★★
  | 'platinum'      // 白金 ★★★★
  | 'diamond';      // 钻石 ★★★★★

export interface AchievementRequirement {
  type: 'count' | 'specific' | 'time' | 'streak' | 'special';
  target: string;
  value: number;
}

export interface AchievementReward {
  coins?: number;
  gems?: number;
  items?: string[];
  recipes?: string[];
  customers?: string[];
  decorations?: string[];
  title?: string;
}

// ===== 新手成就 =====
export const BEGINNER_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_coffee',
    name: '第一杯咖啡',
    description: '成功制作第一杯咖啡',
    category: 'beginner',
    rarity: 'bronze',
    requirements: [{ type: 'count', target: 'coffee_made', value: 1 }],
    rewards: { coins: 100, title: '新手咖啡师' },
    secret: false
  },
  {
    id: 'first_customer',
    name: '第一位顾客',
    description: '接待第一位顾客',
    category: 'beginner',
    rarity: 'bronze',
    requirements: [{ type: 'count', target: 'customer_served', value: 1 }],
    rewards: { coins: 100 },
    secret: false
  },
  {
    id: 'coffee_apprentice',
    name: '咖啡学徒',
    description: '累计制作100杯咖啡',
    category: 'beginner',
    rarity: 'silver',
    requirements: [{ type: 'count', target: 'coffee_made', value: 100 }],
    rewards: { coins: 500, items: ['apprentice_apron'] },
    secret: false
  }
];

// ===== 咖啡大师成就 =====
export const COFFEE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'perfect_espresso',
    name: '完美浓缩',
    description: '制作一杯完美的浓缩咖啡',
    category: 'coffee',
    rarity: 'silver',
    requirements: [{ type: 'specific', target: 'perfect_espresso', value: 1 }],
    rewards: { coins: 300, recipes: ['double_espresso'] },
    secret: false
  },
  {
    id: 'latte_art_master',
    name: '拉花大师',
    description: '成功制作100杯带拉花的咖啡',
    category: 'coffee',
    rarity: 'gold',
    requirements: [{ type: 'count', target: 'latte_art_made', value: 100 }],
    rewards: { coins: 1000, items: ['golden_milk_pitcher'] },
    secret: false
  },
  {
    id: 'recipe_collector',
    name: '配方收藏家',
    description: '解锁所有基础配方',
    category: 'coffee',
    rarity: 'platinum',
    requirements: [{ type: 'count', target: 'recipes_unlocked', value: 10 }],
    rewards: { coins: 2000, recipes: ['secret_house_blend'] },
    secret: false
  },
  {
    id: 'legendary_barista',
    name: '传说咖啡师',
    description: '制作神之祝福咖啡',
    category: 'coffee',
    rarity: 'diamond',
    requirements: [{ type: 'specific', target: 'god_blessing_made', value: 1 }],
    rewards: { coins: 10000, title: '传说咖啡师', items: ['legendary_apron'] },
    secret: true,
    hint: '只有最顶尖的咖啡师才能解锁'
  }
];

// ===== 顾客服务成就 =====
export const CUSTOMER_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'satisfaction_guaranteed',
    name: '满意度保证',
    description: '连续服务10位顾客不失误',
    category: 'customer',
    rarity: 'silver',
    requirements: [{ type: 'streak', target: 'perfect_service', value: 10 }],
    rewards: { coins: 500 },
    secret: false
  },
  {
    id: 'regular_master',
    name: '回头客大师',
    description: '让同一位顾客光顾50次',
    category: 'customer',
    rarity: 'gold',
    requirements: [{ type: 'count', target: 'customer_visits_single', value: 50 }],
    rewards: { coins: 2000, items: ['vip_member_card'] },
    secret: false
  },
  {
    id: 'ghost_whisperer',
    name: '幽灵低语者',
    description: '服务所有幽灵顾客',
    category: 'customer',
    rarity: 'platinum',
    requirements: [{ type: 'count', target: 'ghost_customers_served', value: 5 }],
    rewards: { coins: 3000, decorations: ['ghost_lantern'] },
    secret: true,
    hint: '午夜时分，会有特别的客人'
  },
  {
    id: 'coffee_god_approved',
    name: '神的认可',
    description: '通过咖啡之神的试炼',
    category: 'customer',
    rarity: 'diamond',
    requirements: [{ type: 'specific', target: 'coffee_god_satisfied', value: 1 }],
    rewards: { coins: 5000, title: '神之选中者' },
    secret: true,
    hint: '达到巅峰后，神会来考验你'
  }
];

// ===== 经营成就 =====
export const BUSINESS_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_profit',
    name: '第一桶金',
    description: '单日盈利超过1000',
    category: 'business',
    rarity: 'bronze',
    requirements: [{ type: 'count', target: 'daily_profit', value: 1000 }],
    rewards: { coins: 200 },
    secret: false
  },
  {
    id: 'coffee_empire',
    name: '咖啡帝国',
    description: '累计盈利100万',
    category: 'business',
    rarity: 'platinum',
    requirements: [{ type: 'count', target: 'total_profit', value: 1000000 }],
    rewards: { coins: 10000, decorations: ['golden_sign'] },
    secret: false
  },
  {
    id: 'five_star_shop',
    name: '五星店铺',
    description: '店铺达到最高等级',
    category: 'business',
    rarity: 'gold',
    requirements: [{ type: 'count', target: 'shop_level', value: 10 }],
    rewards: { coins: 5000, items: ['five_star_plaque'] },
    secret: false
  }
];

// ===== 剧情成就 =====
export const STORY_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'story_beginner',
    name: '故事开始',
    description: '完成第一章剧情',
    category: 'story',
    rarity: 'bronze',
    requirements: [{ type: 'specific', target: 'chapter_1_complete', value: 1 }],
    rewards: { coins: 300, recipes: ['midnight_blend'] },
    secret: false
  },
  {
    id: 'story_master',
    name: '剧情大师',
    description: '完成所有主线剧情',
    category: 'story',
    rarity: 'gold',
    requirements: [{ type: 'count', target: 'chapters_completed', value: 10 }],
    rewards: { coins: 5000, title: '故事讲述者' },
    secret: false
  },
  {
    id: 'true_ending',
    name: '真结局',
    description: '解锁游戏的真结局',
    category: 'story',
    rarity: 'diamond',
    requirements: [{ type: 'specific', target: 'true_ending_unlocked', value: 1 }],
    rewards: { coins: 10000, title: '真相探寻者', items: ['truth_scroll'] },
    secret: true,
    hint: '需要满足所有条件才能看到真相'
  }
];

// ===== 收集成就 =====
export const COLLECTION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'recipe_hunter',
    name: '配方猎人',
    description: '收集30种配方',
    category: 'collection',
    rarity: 'silver',
    requirements: [{ type: 'count', target: 'recipes_collected', value: 30 }],
    rewards: { coins: 1000 },
    secret: false
  },
  {
    id: 'customer_collector',
    name: '顾客收藏家',
    description: '解锁20位顾客',
    category: 'collection',
    rarity: 'gold',
    requirements: [{ type: 'count', target: 'customers_unlocked', value: 20 }],
    rewards: { coins: 3000, decorations: ['customer_wall_of_fame'] },
    secret: false
  },
  {
    id: 'completionist',
    name: '完美收藏家',
    description: '收集游戏中所有可收集内容',
    category: 'collection',
    rarity: 'diamond',
    requirements: [
      { type: 'count', target: 'all_recipes', value: 50 },
      { type: 'count', target: 'all_customers', value: 50 },
      { type: 'count', target: 'all_decorations', value: 30 }
    ],
    rewards: { coins: 20000, title: '完美收藏家', items: ['platinum_trophy'] },
    secret: false
  }
];

// ===== 挑战成就 =====
export const CHALLENGE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'speed_demon',
    name: '速度恶魔',
    description: '10秒内完成一杯咖啡',
    category: 'challenge',
    rarity: 'silver',
    requirements: [{ type: 'time', target: 'coffee_make_time', value: 10 }],
    rewards: { coins: 500 },
    secret: false
  },
  {
    id: 'midnight_madness',
    name: '午夜疯狂',
    description: '连续经营24小时不休息',
    category: 'challenge',
    rarity: 'gold',
    requirements: [{ type: 'streak', target: 'hours_open', value: 24 }],
    rewards: { coins: 2000, items: ['night_owl_badge'] },
    secret: false
  },
  {
    id: 'perfect_day',
    name: '完美的一天',
    description: '单日服务50位顾客且全部满意',
    category: 'challenge',
    rarity: 'platinum',
    requirements: [
      { type: 'count', target: 'daily_customers', value: 50 },
      { type: 'count', target: 'daily_perfect_service', value: 50 }
    ],
    rewards: { coins: 5000, title: '完美主义者' },
    secret: false
  }
];

// 成就管理器
export class AchievementManager {
  private unlockedAchievements: Set<string> = new Set();
  private achievementProgress: Map<string, number> = new Map();

  // 检查成就解锁
  checkAchievement(achievementId: string): boolean {
    if (this.unlockedAchievements.has(achievementId)) return false;
    
    const achievement = this.getAchievement(achievementId);
    if (!achievement) return false;

    // 检查所有要求
    const allMet = achievement.requirements.every(req => {
      const progress = this.achievementProgress.get(req.target) || 0;
      return progress >= req.value;
    });

    if (allMet) {
      this.unlockAchievement(achievementId);
      return true;
    }
    return false;
  }

  // 解锁成就
  unlockAchievement(achievementId: string): void {
    this.unlockedAchievements.add(achievementId);
    // 触发奖励...
  }

  // 更新进度
  updateProgress(target: string, value: number): void {
    this.achievementProgress.set(target, value);
    // 检查相关成就...
  }

  // 获取成就
  getAchievement(id: string): Achievement | null {
    return ALL_ACHIEVEMENTS.find(a => a.id === id) || null;
  }

  // 获取所有已解锁成就
  getUnlockedAchievements(): Achievement[] {
    return ALL_ACHIEVEMENTS.filter(a => this.unlockedAchievements.has(a.id));
  }

  // 获取完成度
  getCompletionRate(): { unlocked: number; total: number } {
    return {
      unlocked: this.unlockedAchievements.size,
      total: ALL_ACHIEVEMENTS.length
    };
  }
}

// 导出所有成就
export const ALL_ACHIEVEMENTS = [
  ...BEGINNER_ACHIEVEMENTS,
  ...COFFEE_ACHIEVEMENTS,
  ...CUSTOMER_ACHIEVEMENTS,
  ...BUSINESS_ACHIEVEMENTS,
  ...STORY_ACHIEVEMENTS,
  ...COLLECTION_ACHIEVEMENTS,
  ...CHALLENGE_ACHIEVEMENTS
];