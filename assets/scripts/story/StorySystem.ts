/**
 * 剧情系统 v2.0
 * 主线剧情 + 支线任务 + 多结局
 */

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  scenes: StoryScene[];
  requirements?: ChapterRequirement[];
  rewards: ChapterReward;
}

export interface StoryScene {
  id: string;
  background: string;
  dialogues: Dialogue[];
  choices?: Choice[];
  effects?: SceneEffect[];
}

export interface Dialogue {
  speaker: string;
  text: string;
  emotion?: string;
  voice?: string;
}

export interface Choice {
  text: string;
  nextScene: string;
  effects?: ChoiceEffect[];
  condition?: string;
}

export interface ChapterRequirement {
  type: 'level' | 'item' | 'customer' | 'time';
  value: any;
}

export interface ChapterReward {
  items?: string[];
  recipes?: string[];
  customers?: string[];
  decorations?: string[];
}

// 第一章完整剧情
export const CHAPTER_1: StoryChapter = {
  id: 'chapter_1',
  title: '神秘的开业日',
  description: '你在一个雨夜继承了一家神秘的咖啡厅...',
  scenes: [
    {
      id: 'scene_1_1',
      background: 'rainy_night_street',
      dialogues: [
        {
          speaker: '旁白',
          text: '雨夜，你站在一栋老旧建筑前...',
          emotion: 'mysterious'
        },
        {
          speaker: '神秘老人',
          text: '年轻人，这家店选择了你。记住，午夜12点后，会有特别的客人...',
          emotion: 'whisper'
        }
      ],
      choices: [
        {
          text: '接过钥匙',
          nextScene: 'scene_1_2',
          effects: [{ type: 'unlock', target: 'shop' }]
        },
        {
          text: '犹豫片刻',
          nextScene: 'scene_1_2_alt'
        }
      ]
    },
    {
      id: 'scene_1_2',
      background: 'empty_shop',
      dialogues: [
        {
          speaker: '旁白',
          text: '你推开门，咖啡厅空无一人，但咖啡机还在冒着热气...',
          emotion: 'curious'
        },
        {
          speaker: '???',
          text: '欢迎...新主人...',
          emotion: 'ethereal'
        }
      ]
    }
  ],
  rewards: {
    items: ['mysterious_key', 'old_recipe_book'],
    recipes: ['basic_coffee', 'midnight_blend']
  }
};

// 第二章：第一位顾客
export const CHAPTER_2: StoryChapter = {
  id: 'chapter_2',
  title: '第一位顾客',
  description: '深夜，第一位顾客推开了门...',
  scenes: [
    {
      id: 'scene_2_1',
      background: 'shop_midnight',
      dialogues: [
        {
          speaker: '旁白',
          text: '午夜12点整，门铃响了...',
          emotion: 'tense'
        },
        {
          speaker: '神秘女子',
          text: '一杯"记忆"，谢谢。不要太甜，我已经忘记甜味很久了...',
          emotion: 'melancholy'
        }
      ],
      choices: [
        {
          text: '尝试制作"记忆"咖啡',
          nextScene: 'scene_2_success',
          effects: [{ type: 'unlock_recipe', target: 'memory_coffee' }]
        },
        {
          text: '询问什么是"记忆"',
          nextScene: 'scene_2_explain'
        }
      ]
    }
  ],
  requirements: [
    { type: 'level', value: 2 },
    { type: 'time', value: 'midnight' }
  ],
  rewards: {
    recipes: ['memory_coffee', 'nostalgia_latte'],
    customers: ['mysterious_woman'],
    decorations: ['vintage_clock', 'old_photo_frame']
  }
};

// 故事系统管理器
export class StorySystem {
  private unlockedChapters: Set<string> = new Set();
  private currentChapter: string | null = null;
  private completedScenes: Set<string> = new Set();
  private playerChoices: Map<string, string> = new Map();

  constructor() {
    this.unlockedChapters.add('chapter_1');
  }

  // 开始章节
  startChapter(chapterId: string): boolean {
    if (!this.unlockedChapters.has(chapterId)) {
      return false;
    }
    this.currentChapter = chapterId;
    return true;
  }

  // 完成场景
  completeScene(sceneId: string, choiceId?: string): void {
    this.completedScenes.add(sceneId);
    if (choiceId) {
      this.playerChoices.set(sceneId, choiceId);
    }
  }

  // 检查章节是否完成
  isChapterCompleted(chapterId: string): boolean {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return false;
    return chapter.scenes.every(scene => this.completedScenes.has(scene.id));
  }

  // 获取章节
  getChapter(id: string): StoryChapter | null {
    const chapters: Record<string, StoryChapter> = {
      'chapter_1': CHAPTER_1,
      'chapter_2': CHAPTER_2
    };
    return chapters[id] || null;
  }

  // 解锁下一章
  unlockNextChapter(): void {
    const nextId = `chapter_${this.unlockedChapters.size + 1}`;
    this.unlockedChapters.add(nextId);
  }

  // 获取玩家选择历史
  getChoiceHistory(): Record<string, string> {
    return Object.fromEntries(this.playerChoices);
  }

  // 计算剧情进度
  getProgress(): { total: number; completed: number } {
    const allScenes = [CHAPTER_1, CHAPTER_2].flatMap(c => c.scenes);
    return {
      total: allScenes.length,
      completed: allScenes.filter(s => this.completedScenes.has(s.id)).length
    };
  }
}

// 导出所有章节
export const ALL_CHAPTERS = [CHAPTER_1, CHAPTER_2];