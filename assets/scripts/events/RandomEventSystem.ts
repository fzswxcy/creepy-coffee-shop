/**
 * 随机事件系统 v1.0
 * 让游戏每天都有新鲜感
 */

export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  rarity: EventRarity;
  trigger: EventTrigger;
  choices: EventChoice[];
  effects: EventEffect[];
}

export type EventType = 
  | 'daily'       // 每日事件
  | 'special'     // 特殊事件
  | 'ghost'       // 幽灵事件
  | 'weather'     // 天气事件
  | 'customer'    // 顾客事件
  | 'mystery';    // 神秘事件

export type EventRarity = 
  | 'common'      // 常见 60%
  | 'uncommon'    // 少见 25%
  | 'rare'        // 稀有 10%
  | 'legendary';  // 传说 5%

export interface EventTrigger {
  time?: string[];
  weather?: string[];
  season?: string[];
  customer?: string[];
  probability: number;
}

export interface EventChoice {
  text: string;
  effects: EventEffect[];
  nextEvent?: string;
}

export interface EventEffect {
  type: 'money' | 'reputation' | 'item' | 'customer' | 'story';
  value: any;
  duration?: number;
}

// ===== 每日事件 =====
export const DAILY_EVENTS: RandomEvent[] = [
  {
    id: 'coffee_spill',
    name: '咖啡洒了',
    description: '你不小心打翻了一杯刚做好的咖啡',
    type: 'daily',
    rarity: 'common',
    trigger: { probability: 0.1 },
    choices: [
      {
        text: '重新制作',
        effects: [{ type: 'money', value: -10 }]
      },
      {
        text: '道歉并提供折扣',
        effects: [{ type: 'money', value: -5 }, { type: 'reputation', value: 5 }]
      }
    ],
    effects: []
  },
  {
    id: 'rush_hour',
    name: '高峰期',
    description: '突然来了很多顾客，你忙不过来',
    type: 'daily',
    rarity: 'common',
    trigger: { time: ['morning', 'afternoon'], probability: 0.2 },
    choices: [
      {
        text: '全力以赴',
        effects: [{ type: 'money', value: 50 }, { type: 'reputation', value: -5 }]
      },
      {
        text: '请顾客稍等',
        effects: [{ type: 'money', value: 30 }, { type: 'reputation', value: 5 }]
      }
    ],
    effects: []
  },
  {
    id: 'coffee_review',
    name: '美食博主',
    description: '一位美食博主来打卡了',
    type: 'daily',
    rarity: 'uncommon',
    trigger: { probability: 0.05 },
    choices: [
      {
        text: '推荐招牌咖啡',
        effects: [{ type: 'reputation', value: 20 }]
      },
      {
        text: '赠送特调',
        effects: [{ type: 'money', value: -20 }, { type: 'reputation', value: 30 }]
      }
    ],
    effects: []
  }
];

// ===== 幽灵事件 =====
export const GHOST_EVENTS: RandomEvent[] = [
  {
    id: 'midnight_visitor',
    name: '午夜访客',
    description: '午夜12点，门铃响了，但门口没有人...',
    type: 'ghost',
    rarity: 'rare',
    trigger: { time: ['midnight'], probability: 0.1 },
    choices: [
      {
        text: '查看门外',
        effects: [{ type: 'story', value: 'ghost_encounter_1' }],
        nextEvent: 'ghost_appears'
      },
      {
        text: '假装没听见',
        effects: [{ type: 'reputation', value: -10 }]
      }
    ],
    effects: []
  },
  {
    id: 'moving_objects',
    name: '移动的杯子',
    description: '你明明放在桌上的杯子，突然移动了位置...',
    type: 'ghost',
    rarity: 'uncommon',
    trigger: { time: ['night'], probability: 0.15 },
    choices: [
      {
        text: '调查原因',
        effects: [{ type: 'story', value: 'ghost_clue_1' }]
      },
      {
        text: '无视它',
        effects: []
      }
    ],
    effects: []
  },
  {
    id: 'whispers',
    name: '低语声',
    description: '你听到有人在耳边低语，但周围没有人...',
    type: 'ghost',
    rarity: 'rare',
    trigger: { time: ['midnight', 'night'], probability: 0.08 },
    choices: [
      {
        text: '回应它',
        effects: [{ type: 'customer', value: 'ghost_customer_1' }]
      },
      {
        text: '播放音乐掩盖',
        effects: [{ type: 'money', value: -5 }]
      }
    ],
    effects: []
  }
];

// ===== 神秘事件 =====
export const MYSTERY_EVENTS: RandomEvent[] = [
  {
    id: 'strange_order',
    name: '神秘订单',
    description: '你收到一张纸条，上面写着一种从未见过的咖啡配方...',
    type: 'mystery',
    rarity: 'rare',
    trigger: { probability: 0.05 },
    choices: [
      {
        text: '尝试制作',
        effects: [{ type: 'item', value: 'mystery_recipe' }, { type: 'reputation', value: 10 }]
      },
      {
        text: '烧掉纸条',
        effects: []
      }
    ],
    effects: []
  },
  {
    id: 'hidden_room',
    name: '密室',
    description: '你发现墙上有一块松动的砖，后面似乎有空间...',
    type: 'mystery',
    rarity: 'legendary',
    trigger: { probability: 0.02 },
    choices: [
      {
        text: '探索密室',
        effects: [
          { type: 'item', value: 'ancient_recipe_book' },
          { type: 'story', value: 'secret_room_discovered' }
        ]
      },
      {
        text: '装作没看见',
        effects: []
      }
    ],
    effects: []
  }
];

// ===== 天气事件 =====
export const WEATHER_EVENTS: RandomEvent[] = [
  {
    id: 'rainy_day',
    name: '暴雨天',
    description: '外面下着大雨，店里来了躲雨的人...',
    type: 'weather',
    rarity: 'common',
    trigger: { weather: ['rain'], probability: 0.3 },
    choices: [
      {
        text: '提供免费热饮',
        effects: [{ type: 'reputation', value: 15 }, { type: 'money', value: -10 }]
      },
      {
        text: '正常营业',
        effects: [{ type: 'money', value: 20 }]
      }
    ],
    effects: []
  },
  {
    id: 'foggy_night',
    name: '大雾夜',
    description: '浓雾笼罩街道，能见度很低...',
    type: 'weather',
    rarity: 'uncommon',
    trigger: { weather: ['fog'], time: ['night'], probability: 0.2 },
    choices: [
      {
        text: '提前关门',
        effects: [{ type: 'money', value: -30 }]
      },
      {
        text: '继续营业',
        effects: [{ type: 'story', value: 'foggy_night_event' }]
      }
    ],
    effects: []
  }
];

// 事件管理器
export class RandomEventManager {
  private eventHistory: string[] = [];
  private activeEffects: EventEffect[] = [];

  // 检查并触发事件
  checkAndTriggerEvent(time: string, weather: string): RandomEvent | null {
    const allEvents = [
      ...DAILY_EVENTS,
      ...GHOST_EVENTS,
      ...MYSTERY_EVENTS,
      ...WEATHER_EVENTS
    ];

    // 筛选可触发的事件
    const possibleEvents = allEvents.filter(event => {
      // 检查触发条件
      if (event.trigger.time && !event.trigger.time.includes(time)) return false;
      if (event.trigger.weather && !event.trigger.weather.includes(weather)) return false;
      
      // 检查概率
      const rand = Math.random();
      const rarityMultiplier = this._getRarityMultiplier(event.rarity);
      return rand < event.trigger.probability * rarityMultiplier;
    });

    if (possibleEvents.length === 0) return null;

    // 随机选择一个事件
    const selectedEvent = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
    this.eventHistory.push(selectedEvent.id);
    
    return selectedEvent;
  }

  private _getRarityMultiplier(rarity: EventRarity): number {
    const multipliers = {
      common: 1.0,
      uncommon: 0.8,
      rare: 0.5,
      legendary: 0.2
    };
    return multipliers[rarity];
  }

  // 执行选择
  executeChoice(event: RandomEvent, choiceIndex: number): EventEffect[] {
    const choice = event.choices[choiceIndex];
    if (!choice) return [];

    this.activeEffects.push(...choice.effects);
    return choice.effects;
  }

  // 获取今日事件
  getTodayEvents(): RandomEvent[] {
    const events: RandomEvent[] = [];
    
    // 触发1-3个事件
    const numEvents = Math.floor(Math.random() * 3) + 1;
    const times = ['morning', 'afternoon', 'evening', 'night'];
    const weathers = ['sunny', 'cloudy', 'rain', 'fog'];
    
    for (let i = 0; i < numEvents; i++) {
      const time = times[Math.floor(Math.random() * times.length)];
      const weather = weathers[Math.floor(Math.random() * weathers.length)];
      const event = this.checkAndTriggerEvent(time, weather);
      if (event) events.push(event);
    }
    
    return events;
  }
}

// 导出所有事件
export const ALL_EVENTS = [
  ...DAILY_EVENTS,
  ...GHOST_EVENTS,
  ...MYSTERY_EVENTS,
  ...WEATHER_EVENTS
];