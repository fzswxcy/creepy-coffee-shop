// 快速扩展 - 额外顾客
export const EXTRA_CUSTOMERS = [
  {
    id: 'insomniac_writer',
    name: '失眠作家',
    type: 'special',
    rarity: 'uncommon',
    story: { background: '总在深夜寻找灵感的小说家' },
    preferences: { favoriteDrinks: ['黑咖啡', '浓缩咖啡'], preferredTime: 'midnight' }
  },
  {
    id: 'tired_nurse',
    name: '夜班护士',
    type: 'special', 
    rarity: 'uncommon',
    story: { background: '刚下夜班的护士，需要咖啡提神' },
    preferences: { favoriteDrinks: ['美式咖啡', '拿铁'], preferredTime: 'morning' }
  },
  {
    id: 'nostalgic_elderly',
    name: '怀旧老人',
    type: 'special',
    rarity: 'rare',
    story: { background: '据说年轻时是这里的常客' },
    preferences: { favoriteDrinks: ['经典咖啡'], preferredTime: 'afternoon' }
  },
  {
    id: 'mysterious_businessman',
    name: '神秘商人',
    type: 'special',
    rarity: 'rare',
    story: { background: '总是穿着黑色西装，似乎在躲避什么' },
    preferences: { favoriteDrinks: ['特调咖啡'], preferredTime: 'evening' }
  },
  {
    id: 'lost_tourist',
    name: '迷路的游客',
    type: 'normal',
    rarity: 'common',
    story: { background: '被这家店的神秘氛围吸引进来' },
    preferences: { favoriteDrinks: ['卡布奇诺', '摩卡'] }
  }
];

// 快速扩展 - 额外配方
export const EXTRA_RECIPES = [
  {
    id: 'caramel_macchiato',
    name: '焦糖玛奇朵',
    ingredients: ['浓缩咖啡', '牛奶', '焦糖酱', '奶泡'],
    difficulty: 5,
    price: 32
  },
  {
    id: 'hazelnut_latte',
    name: '榛果拿铁',
    ingredients: ['浓缩咖啡', '牛奶', '榛果糖浆', '奶泡'],
    difficulty: 4,
    price: 30
  },
  {
    id: 'vanilla_frappuccino',
    name: '香草星冰乐',
    ingredients: ['浓缩咖啡', '牛奶', '香草糖浆', '冰块', '奶油'],
    difficulty: 6,
    price: 35
  },
  {
    id: 'matcha_latte',
    name: '抹茶拿铁',
    ingredients: ['抹茶粉', '牛奶', '糖浆'],
    difficulty: 5,
    price: 28
  },
  {
    id: 'thai_tea',
    name: '泰式奶茶',
    ingredients: ['泰式茶', '炼乳', '牛奶', '冰块'],
    difficulty: 4,
    price: 26
  }
];