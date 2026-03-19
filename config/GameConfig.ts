/**
 * 游戏配置文件
 * 包含所有游戏参数、数值平衡、配置项
 */

/**
 * 游戏全局配置
 */
export const GameConfig = {
    // 游戏版本
    VERSION: '1.0.0',
    
    // 平台配置
    PLATFORM: {
        WECHAT: 'wechatgame',
        WEB: 'web-mobile',
        NATIVE: 'native'
    },
    
    // 设计分辨率
    DESIGN_RESOLUTION: {
        WIDTH: 750,
        HEIGHT: 1334,
        FIT_WIDTH: true,
        FIT_HEIGHT: false
    },
    
    // 性能配置
    PERFORMANCE: {
        MAX_FPS: 60,
        TARGET_FPS: 30,
        MEMORY_WARNING_THRESHOLD: 100,  // MB
        GC_INTERVAL: 30  // 垃圾回收间隔（秒）
    },
    
    // 包体限制
    PACKAGE_SIZE: {
        MAX_TOTAL: 10 * 1024 * 1024,  // 10MB
        MAX_FIRST_LOAD: 2 * 1024 * 1024,  // 2MB首包
        MAX_RESOURCE_PER_CATEGORY: 2 * 1024 * 1024  // 每类资源2MB
    },
    
    // 加载时间限制
    LOADING_TIME: {
        MAX_FIRST_LOAD: 3000,  // 3秒
        MAX_SCENE_LOAD: 1000,  // 1秒
        MAX_RESOURCE_LOAD: 500  // 500ms
    }
};

/**
 * 咖啡配置
 */
export const CoffeeConfig = {
    // 咖啡类型
    TYPES: {
        ESPRESSO: 'espresso',
        LATTE: 'latte',
        CAPPUCCINO: 'cappuccino',
        MOCHA: 'mocha',
        AMERICANO: 'americano'
    },
    
    // 咖啡属性
    PROPERTIES: {
        ESPRESSO: {
            name: '浓缩咖啡',
            baseValue: 10,
            productionTime: 3.0,
            unlockLevel: 1,
            sprite: 'espresso-sprite'
        },
        LATTE: {
            name: '拿铁',
            baseValue: 15,
            productionTime: 4.0,
            unlockLevel: 2,
            sprite: 'latte-sprite'
        },
        CAPPUCCINO: {
            name: '卡布奇诺',
            baseValue: 20,
            productionTime: 5.0,
            unlockLevel: 3,
            sprite: 'cappuccino-sprite'
        },
        MOCHA: {
            name: '摩卡',
            baseValue: 25,
            productionTime: 6.0,
            unlockLevel: 4,
            sprite: 'mocha-sprite'
        },
        AMERICANO: {
            name: '美式咖啡',
            baseValue: 8,
            productionTime: 2.5,
            unlockLevel: 1,
            sprite: 'americano-sprite'
        }
    },
    
    // 特殊咖啡（微恐元素）
    SPECIAL_TYPES: {
        BLOOD_LATTE: 'blood_latte',
        SHADOW_ESPRESSO: 'shadow_espresso',
        GHOST_MOCHA: 'ghost_mocha',
        CURSED_CAPPUCCINO: 'cursed_cappuccino'
    },
    
    // 特殊咖啡属性
    SPECIAL_PROPERTIES: {
        BLOOD_LATTE: {
            name: '血拿铁',
            baseValue: 50,
            productionTime: 8.0,
            unlockRequirement: 'serve_10_ghosts',
            effect: 'scare_customers',
            sprite: 'blood-latte-sprite'
        },
        SHADOW_ESPRESSO: {
            name: '暗影浓缩',
            baseValue: 40,
            productionTime: 7.0,
            unlockRequirement: 'night_time',
            effect: 'increase_tips',
            sprite: 'shadow-espresso-sprite'
        },
        GHOST_MOCHA: {
            name: '幽灵摩卡',
            baseValue: 60,
            productionTime: 10.0,
            unlockRequirement: 'repair_5_machines',
            effect: 'attract_ghosts',
            sprite: 'ghost-mocha-sprite'
        }
    }
};

/**
 * 顾客配置
 */
export const CustomerConfig = {
    // 顾客类型
    TYPES: {
        NORMAL: 'normal',
        VIP: 'vip',
        SCARY: 'scary',
        GHOST: 'ghost',
        CREEPY: 'creepy'
    },
    
    // 顾客属性
    PROPERTIES: {
        NORMAL: {
            name: '普通顾客',
            spawnChance: 0.6,
            patience: 30,
            baseReward: 15,
            tipChance: 0.3,
            scareResistance: 0.2,
            sprite: 'customer-normal'
        },
        VIP: {
            name: 'VIP顾客',
            spawnChance: 0.1,
            patience: 40,
            baseReward: 30,
            tipChance: 0.5,
            scareResistance: 0.5,
            sprite: 'customer-vip'
        },
        SCARY: {
            name: '恐怖顾客',
            spawnChance: 0.15,
            patience: 20,
            baseReward: 25,
            tipChance: 0.4,
            scareResistance: 0.8,
            canScareOthers: true,
            sprite: 'customer-scary'
        },
        GHOST: {
            name: '幽灵顾客',
            spawnChance: 0.1,
            patience: 15,
            baseReward: 40,
            tipChance: 0.2,
            scareResistance: 1.0,
            canScareOthers: true,
            sprite: 'customer-ghost'
        },
        CREEPY: {
            name: '怪异顾客',
            spawnChance: 0.05,
            patience: 25,
            baseReward: 35,
            tipChance: 0.6,
            scareResistance: 0.3,
            canScareOthers: false,
            sprite: 'customer-creepy'
        }
    },
    
    // 时间影响
    TIME_INFLUENCE: {
        DAY: {
            NORMAL: 1.0,
            VIP: 1.0,
            SCARY: 0.5,  // 白天恐怖顾客减少
            GHOST: 0.2,  // 白天幽灵大幅减少
            CREEPY: 0.8
        },
        NIGHT: {
            NORMAL: 0.7,
            VIP: 0.5,
            SCARY: 1.5,  // 夜晚恐怖顾客增加
            GHOST: 2.0,  // 夜晚幽灵大幅增加
            CREEPY: 1.2
        }
    },
    
    // 行为配置
    BEHAVIOR: {
        MAX_CUSTOMERS: 5,
        SPAWN_INTERVAL: 10,  // 秒
        MIN_SPAWN_INTERVAL: 5,
        MAX_SPAWN_INTERVAL: 20,
        LEAVE_TIME_AFTER_SERVED: 2,  // 秒
        ANGRY_LEAVE_DELAY: 2,
        SCARE_PROPAGATION_DISTANCE: 150,  // 像素
        SCARE_PROPAGATION_CHANCE: 0.3
    }
};

/**
 * 咖啡机配置
 */
export const MachineConfig = {
    // 基础属性
    BASE: {
        PRODUCTION_TIME: 3.0,
        BREAK_CHANCE: 0.05,
        REPAIR_COST: 50,
        UPGRADE_COST_BASE: 100,
        MAX_LEVEL: 5,
        MAX_MACHINES: 5
    },
    
    // 等级加成
    LEVEL_BONUS: {
        PRODUCTION_TIME_REDUCTION: 0.1,  // 每级减少10%
        VALUE_INCREASE: 0.2,  // 每级增加20%
        BREAK_CHANCE_REDUCTION: 0.2,  // 每级减少20%
        REPAIR_COST_REDUCTION: 0.1  // 每级减少10%
    },
    
    // 特殊机器
    SPECIAL_MACHINES: {
        HAUNTED_MACHINE: {
            name: '闹鬼咖啡机',
            unlockRequirement: 'day_3',
            specialEffect: 'night_production_boost',
            breakChanceMultiplier: 1.5,
            valueMultiplier: 1.3
        },
        CURSED_MACHINE: {
            name: '诅咒咖啡机',
            unlockRequirement: 'serve_50_scary_customers',
            specialEffect: 'scare_nearby_customers',
            breakChanceMultiplier: 2.0,
            valueMultiplier: 1.5
        }
    }
};

/**
 * 经济配置
 */
export const EconomyConfig = {
    // 初始资源
    INITIAL: {
        COINS: 100,
        GEMS: 0,
        MACHINES: 2,
        UNLOCKED_COFFEE: ['espresso', 'americano']
    },
    
    // 价格配置
    PRICES: {
        NEW_MACHINE: 500,
        MACHINE_UPGRADE_MULTIPLIER: 1.5,
        COFFEE_RECIPE_UNLOCK: 1000,
        DECORATION_BASE: 200,
        SPECIAL_SKIN: 5000
    },
    
    // 收益配置
    INCOME: {
        BASE_COFFEE_VALUE: 10,
        TIP_MULTIPLIER: 0.3,
        VIP_MULTIPLIER: 2.0,
        SPECIAL_COFFEE_MULTIPLIER: 3.0,
        COMBO_BONUS: 1.1  // 连续正确服务奖励
    },
    
    // 成本配置
    COSTS: {
        MACHINE_REPAIR: 50,
        INGREDIENT_PER_COFFEE: 1,
        STAFF_SALARY: 100,  // 每小时（如果添加员工系统）
        RENT: 500  // 每天（如果添加租金系统）
    }
};

/**
 * 微恐元素配置
 */
export const HorrorConfig = {
    // 恐怖等级
    HORROR_LEVELS: {
        LIGHT: 1,  // 轻度恐怖
        MEDIUM: 2,  // 中度恐怖
        STRONG: 3   // 较强恐怖
    },
    
    // 恐怖事件
    EVENTS: {
        LIGHTS_FLICKER: {
            name: '灯光闪烁',
            level: 1,
            chance: 0.05,
            duration: 5,
            effect: 'reduce_customer_patience'
        },
        STRANGE_NOISE: {
            name: '奇怪声响',
            level: 2,
            chance: 0.03,
            duration: 3,
            effect: 'scare_random_customer'
        },
        UNEXPECTED_VISITOR: {
            name: '意外访客',
            level: 2,
            chance: 0.02,
            duration: 10,
            effect: 'spawn_special_customer'
        },
        MYSTERY_DISCOUNT: {
            name: '神秘折扣',
            level: 1,
            chance: 0.04,
            duration: 30,
            effect: 'increase_customer_spawn'
        },
        GHOSTLY_APPEARANCE: {
            name: '幽灵现身',
            level: 3,
            chance: 0.01,
            duration: 15,
            effect: 'scare_all_customers'
        }
    },
    
    // 视觉效果
    VISUAL_EFFECTS: {
        BLOOD_DRIP: 'blood_drip',
        SHADOW_MOVEMENT: 'shadow_movement',
        GHOSTLY_GLOW: 'ghostly_glow',
        SCREEN_DISTORTION: 'screen_distortion'
    },
    
    // 音频效果
    AUDIO_EFFECTS: {
        CREAKY_DOOR: 'creaky_door',
        WHISPER: 'whisper',
        SCREAM: 'scream',
        HEARTBEAT: 'heartbeat'
    },
    
    // 触发条件
    TRIGGERS: {
        TIME_BASED: {
            NIGHT_TIME: true,
            HOUR_CHANGE: true
        },
        ACTION_BASED: {
            SERVE_GHOST: true,
            MACHINE_BREAK: true,
            CUSTOMER_ANGRY: true
        },
        RANDOM_BASED: {
            BASE_CHANCE: 0.01,
            COOLDOWN: 60  // 秒
        }
    }
};

/**
 * 广告配置
 */
export const AdConfig = {
    // 广告类型
    TYPES: {
        REWARDED_VIDEO: 'rewardedVideo',
        INTERSTITIAL: 'interstitial',
        BANNER: 'banner'
    },
    
    // 激励视频广告
    REWARDED_VIDEO: {
        PLACEMENTS: {
            DOUBLE_COINS: 'double_coins',
            FREE_MACHINE: 'free_machine',
            INSTANT_REPAIR: 'instant_repair',
            SPEED_UP: 'speed_up',
            EXTRA_LIFE: 'extra_life'
        },
        
        REWARDS: {
            DOUBLE_COINS: {
                name: '双倍金币',
                duration: 1800,  // 30分钟
                multiplier: 2.0
            },
            FREE_MACHINE: {
                name: '免费咖啡机',
                value: 500
            },
            INSTANT_REPAIR: {
                name: '立即维修',
                value: 50
            },
            SPEED_UP: {
                name: '加速生产',
                duration: 300,  // 5分钟
                multiplier: 0.5  // 生产时间减半
            }
        },
        
        // 展示频率控制
        FREQUENCY: {
            MIN_INTERVAL: 60,  // 最小间隔（秒）
            MAX_PER_HOUR: 10,  // 每小时最大展示次数
            DAILY_LIMIT: 30    // 每日最大展示次数
        }
    },
    
    // 插屏广告
    INTERSTITIAL: {
        TRIGGERS: {
            SCENE_CHANGE: true,
            GAME_OVER: true,
            LEVEL_UP: true,
            TIME_BASED: 300  // 每5分钟
        },
        
        FREQUENCY: {
            MIN_INTERVAL: 120,  // 最小间隔（秒）
            MAX_PER_HOUR: 6,    // 每小时最大展示次数
            DAILY_LIMIT: 20     // 每日最大展示次数
        }
    },
    
    // 横幅广告
    BANNER: {
        POSITIONS: {
            TOP: 'top',
            BOTTOM: 'bottom'
        },
        
        SIZES: {
            BANNER: 'banner',
            LARGE_BANNER: 'largeBanner',
            RECTANGLE: 'rectangle'
        }
    },
    
    // 收益预估（人民币）
    REVENUE_ESTIMATION: {
        REWARDED_VIDEO_ECPM: 80,  // 每千次展示收益（元）
        INTERSTITIAL_ECPM: 50,
        BANNER_ECPM: 20,
        
        // 预估每日收益（基于1000DAU）
        DAILY_ESTIMATION: {
            LOW: 50,    // 保守估计
            MEDIUM: 150, // 中等估计
            HIGH: 300    // 乐观估计
        }
    }
};

/**
 * 性能优化配置
 */
export const PerformanceConfig = {
    // 资源加载策略
    LOADING_STRATEGY: {
        LAZY_LOADING: true,
        PRELOAD_CRITICAL: true,
        DYNAMIC_LOADING: true,
        CACHE_SIZE: 20 * 1024 * 1024  // 20MB缓存
    },
    
    // 渲染优化
    RENDERING: {
        BATCHING_ENABLED: true,
        CULLING_ENABLED: true,
        INSTANCING_ENABLED: false,  // 微信小游戏可能不支持
        MAX_DRAWCALLS: 50,
        MAX_VERTICES: 65535
    },
    
    // 内存管理
    MEMORY_MANAGEMENT: {
        AUTO_UNLOAD: true,
        UNLOAD_THRESHOLD: 50 * 1024 * 1024,  // 50MB
        TEXTURE_COMPRESSION: true,
        AUDIO_COMPRESSION: true
    },
    
    // 微信小游戏特定优化
    WECHAT_OPTIMIZATIONS: {
        USE_WASM: false,  // 微信小游戏对WASM支持有限
        MINIFY_CODE: true,
        COMPRESS_TEXTURES: true,
        SPRITE_ATLAS_SIZE: 1024,  // 图集大小
        MAX_CONCURRENT_LOADS: 6
    }
};

/**
 * 本地化配置
 */
export const LocalizationConfig = {
    SUPPORTED_LANGUAGES: ['zh', 'en'],
    DEFAULT_LANGUAGE: 'zh',
    
    // 文本映射
    TEXTS: {
        zh: {
            game_title: '微恐咖啡厅',
            play_button: '开始游戏',
            settings: '设置',
            shop: '商店',
            coins: '金币',
            score: '分数',
            day: '第{0}天',
            time: '时间: {0}'
        },
        en: {
            game_title: 'Horror Cafe',
            play_button: 'Play',
            settings: 'Settings',
            shop: 'Shop',
            coins: 'Coins',
            score: 'Score',
            day: 'Day {0}',
            time: 'Time: {0}'
        }
    }
};

/**
 * 调试配置
 */
export const DebugConfig = {
    ENABLED: true,
    
    FEATURES: {
        SHOW_FPS: true,
        SHOW_MEMORY: true,
        SHOW_DRAWCALLS: true,
        SKIP_TUTORIAL: true,
        UNLOCK_ALL: false,
        INFINITE_COINS: false
    },
    
    LOGGING: {
        LEVEL: 'info',  // debug, info, warn, error
        MAX_LOG_SIZE: 1000,
        CONSOLE_ENABLED: true,
        FILE_LOGGING: false
    }
};

// 导出所有配置
export default {
    GameConfig,
    CoffeeConfig,
    CustomerConfig,
    MachineConfig,
    EconomyConfig,
    HorrorConfig,
    AdConfig,
    PerformanceConfig,
    LocalizationConfig,
    DebugConfig
};