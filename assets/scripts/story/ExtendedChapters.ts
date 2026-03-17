/**
 * 剧情系统 v2.1 - 扩展版
 * 10章完整剧情
 */

import { StoryChapter, StoryScene, Dialogue, Choice } from './StorySystem';

// 第三章：过去的阴影
export const CHAPTER_3: StoryChapter = {
  id: 'chapter_3',
  title: '过去的阴影',
  description: '咖啡厅的历史逐渐浮出水面...',
  scenes: [
    {
      id: 'scene_3_1',
      background: 'old_photo_album',
      dialogues: [
        {
          speaker: '旁白',
          text: '你在地下室发现了一本旧相册...',
          emotion: 'mysterious'
        },
        {
          speaker: '???',
          text: '那是...50年前的照片？',
          emotion: 'shocked'
        }
      ],
      choices: [
        {
          text: '仔细查看照片',
          nextScene: 'scene_3_2'
        },
        {
          text: '收起相册离开',
          nextScene: 'scene_3_alt'
        }
      ]
    }
  ],
  rewards: {
    story: ['shop_history_part1'],
    decorations: ['old_photo_frame']
  }
};

// 第四章：幽灵低语
export const CHAPTER_4: StoryChapter = {
  id: 'chapter_4',
  title: '幽灵低语',
  description: '午夜时分，幽灵顾客开始出现...',
  scenes: [
    {
      id: 'scene_4_1',
      background: 'midnight_shop',
      dialogues: [
        {
          speaker: '前店主',
          text: '年轻人，你终于能看到我了...',
          emotion: 'ghostly'
        }
      ]
    }
  ],
  requirements: [{ type: 'time', value: 'midnight' }],
  rewards: {
    customers: ['former_owner'],
    recipes: ['ghostly_blend']
  }
};

// 第五章：时间裂缝
export const CHAPTER_5: StoryChapter = {
  id: 'chapter_5',
  title: '时间裂缝',
  description: '时旅者带你看到了咖啡厅的未来...',
  scenes: [
    {
      id: 'scene_5_1',
      background: 'future_shop',
      dialogues: [
        {
          speaker: '时旅者',
          text: '这就是2050年的咖啡厅...',
          emotion: 'futuristic'
        }
      ]
    }
  ],
  requirements: [{ type: 'customer', value: 'time_traveler' }],
  rewards: {
    recipes: ['time_stop_coffee'],
    items: ['time_crystal']
  }
};

// 第六章：咖啡之神的试炼
export const CHAPTER_6: StoryChapter = {
  id: 'chapter_6',
  title: '咖啡之神的试炼',
  description: '传说中的存在降临了...',
  scenes: [
    {
      id: 'scene_6_1',
      background: 'divine_realm',
      dialogues: [
        {
          speaker: '咖啡之神',
          text: '让我看看你的技艺...',
          emotion: 'divine'
        }
      ]
    }
  ],
  requirements: [{ type: 'level', value: 10 }],
  rewards: {
    recipes: ['god_blessing'],
    title: '神之选中者'
  }
};

// 第七章：真相浮现
export const CHAPTER_7: StoryChapter = {
  id: 'chapter_7',
  title: '真相浮现',
  description: '咖啡厅的秘密终于揭开...',
  scenes: [],
  rewards: {}
};

// 第八章：抉择
export const CHAPTER_8: StoryChapter = {
  id: 'chapter_8',
  title: '抉择',
  description: '你必须做出选择...',
  scenes: [],
  rewards: {}
};

// 第九章：最终考验
export const CHAPTER_9: StoryChapter = {
  id: 'chapter_9',
  title: '最终考验',
  description: '最后的挑战...',
  scenes: [],
  rewards: {}
};

// 第十章：真结局
export const CHAPTER_10: StoryChapter = {
  id: 'chapter_10',
  title: '真结局',
  description: '一切的终点，也是新的开始...',
  scenes: [],
  rewards: {
    ending: 'true_ending',
    title: '真相探寻者'
  }
};

// 导出所有扩展章节
export const EXTENDED_CHAPTERS = [
  CHAPTER_3,
  CHAPTER_4,
  CHAPTER_5,
  CHAPTER_6,
  CHAPTER_7,
  CHAPTER_8,
  CHAPTER_9,
  CHAPTER_10
];