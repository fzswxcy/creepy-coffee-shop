#!/usr/bin/env python3
"""
游戏批判智能体
模拟 Z 世代玩家体验游戏并给出犀利评价
"""

import json
from pathlib import Path

class GameCritiqueAgent:
    def __init__(self):
        self.name = " critique_ze"
        self.personality = {
            "age": 22,
            "style": "直接犀利",
            "vocabulary": ["蚌埠住了", "绝绝子", "这波在大气层", "坐牢", "退退退", "yyds", "绝绝子", "真的栓Q"]
        }
        
    def analyze_game(self, game_data: dict) -> dict:
        """分析游戏并给出评价"""
        
        critique = {
            "overall_score": 0,
            "aspects": {},
            "pros": [],
            "cons": [],
            "suggestions": [],
            "player_voice": ""
        }
        
        # 1. 内容量分析
        content_score = self._analyze_content(game_data)
        critique["aspects"]["content"] = content_score
        
        # 2. 游戏性分析
        gameplay_score = self._analyze_gameplay(game_data)
        critique["aspects"]["gameplay"] = gameplay_score
        
        # 3. 创新性分析
        innovation_score = self._analyze_innovation(game_data)
        critique["aspects"]["innovation"] = innovation_score
        
        # 4. 可玩性分析
        replay_score = self._analyze_replayability(game_data)
        critique["aspects"]["replayability"] = replay_score
        
        # 计算总分
        critique["overall_score"] = round(
            (content_score + gameplay_score + innovation_score + replay_score) / 4, 1
        )
        
        # 生成优缺点
        self._generate_pros_cons(critique, game_data)
        
        # 生成建议
        self._generate_suggestions(critique)
        
        # 生成玩家口吻评价
        critique["player_voice"] = self._generate_player_voice(critique)
        
        return critique
    
    def _analyze_content(self, game_data: dict) -> float:
        """分析内容量"""
        score = 5.0
        
        # 剧情章节
        chapters = len(game_data.get("chapters", []))
        if chapters >= 10:
            score += 2
        elif chapters >= 5:
            score += 1
        elif chapters < 3:
            score -= 1
            
        # 顾客数量
        customers = len(game_data.get("customers", []))
        if customers >= 30:
            score += 2
        elif customers >= 15:
            score += 1
        elif customers < 10:
            score -= 1
            
        # 配方数量
        recipes = len(game_data.get("recipes", []))
        if recipes >= 50:
            score += 2
        elif recipes >= 30:
            score += 1
        elif recipes < 20:
            score -= 1
            
        return min(10, max(1, score))
    
    def _analyze_gameplay(self, game_data: dict) -> float:
        """分析游戏性"""
        score = 6.0
        
        # 系统复杂度
        systems = game_data.get("systems", [])
        if len(systems) >= 5:
            score += 1.5
        elif len(systems) >= 3:
            score += 0.5
            
        # 机制深度
        if "crafting_depth" in game_data and game_data["crafting_depth"] > 7:
            score += 1.5
        elif "crafting_depth" in game_data and game_data["crafting_depth"] > 5:
            score += 0.5
            
        # 是否有逼氪元素
        if game_data.get("pay_to_win", False):
            score -= 3
            
        return min(10, max(1, score))
    
    def _analyze_innovation(self, game_data: dict) -> float:
        """分析创新性"""
        score = 5.0
        
        # 独特元素
        unique_features = game_data.get("unique_features", [])
        score += len(unique_features) * 0.5
        
        # 是否换皮
        if game_data.get("is_reskin", False):
            score -= 4
            
        # 微恐主题契合度
        if game_data.get("theme_integration", 0) > 7:
            score += 2
        elif game_data.get("theme_integration", 0) > 5:
            score += 1
            
        return min(10, max(1, score))
    
    def _analyze_replayability(self, game_data: dict) -> float:
        """分析可玩性/重玩性"""
        score = 5.0
        
        # 多结局
        if game_data.get("multiple_endings", False):
            score += 1.5
            
        # 收集要素
        collectibles = game_data.get("collectibles", 0)
        if collectibles >= 50:
            score += 1.5
        elif collectibles >= 30:
            score += 0.5
            
        # 成就系统
        achievements = len(game_data.get("achievements", []))
        if achievements >= 50:
            score += 1
        elif achievements >= 30:
            score += 0.5
            
        # 随机元素
        if game_data.get("random_events", False):
            score += 1
            
        return min(10, max(1, score))
    
    def _generate_pros_cons(self, critique: dict, game_data: dict):
        """生成优缺点"""
        pros = []
        cons = []
        
        # 根据评分生成
        if critique["aspects"]["content"] >= 7:
            pros.append({"point": "内容量很足", "detail": "剧情、顾客、配方都很丰富", "severity": None})
        elif critique["aspects"]["content"] < 5:
            cons.append({"point": "内容太少了", "detail": "玩不了多久就没东西了", "severity": "🔴高"})
            
        if critique["aspects"]["gameplay"] >= 7:
            pros.append({"point": "游戏性在线", "detail": "机制有深度，不无聊", "severity": None})
        elif critique["aspects"]["gameplay"] < 5:
            cons.append({"point": "游戏性一般", "detail": "操作重复，缺乏新意", "severity": "🟡中"})
            
        if critique["aspects"]["innovation"] >= 7:
            pros.append({"point": "微恐主题很戳", "detail": "氛围营造得不错", "severity": None})
        elif critique["aspects"]["innovation"] < 5:
            cons.append({"point": "换皮感严重", "detail": "换个皮就是另一个游戏", "severity": "🔴高"})
            
        if critique["aspects"]["replayability"] >= 7:
            pros.append({"point": "值得重复玩", "detail": "多结局+收集，有动力", "severity": None})
        elif critique["aspects"]["replayability"] < 5:
            cons.append({"point": "一次性游戏", "detail": "通关就不想玩了", "severity": "🟡中"})
        
        critique["pros"] = pros
        critique["cons"] = cons
    
    def _generate_suggestions(self, critique: dict):
        """生成改进建议"""
        suggestions = []
        
        # 根据缺点生成建议
        for con in critique["cons"]:
            if "内容太少" in con["point"]:
                suggestions.append({
                    "priority": "高",
                    "suggestion": "大幅增加内容量",
                    "actions": [
                        "增加10+剧情章节",
                        "增加20+特殊顾客",
                        "增加30+咖啡配方",
                        "添加随机事件系统"
                    ]
                })
            elif "游戏性一般" in con["point"]:
                suggestions.append({
                    "priority": "高",
                    "suggestion": "深化核心玩法",
                    "actions": [
                        "咖啡制作加入更多操作细节",
                        "顾客互动更丰富的对话选项",
                        "添加店铺装修DIY系统"
                    ]
                })
            elif "换皮" in con["point"]:
                suggestions.append({
                    "priority": "高",
                    "suggestion": "强化微恐特色",
                    "actions": [
                        "增加恐怖事件系统",
                        "幽灵顾客有更多互动",
                        "深夜模式特殊玩法"
                    ]
                })
        
        # 通用建议
        suggestions.append({
            "priority": "中",
            "suggestion": "优化新手引导",
            "actions": [
                "第一天教学更详细",
                "渐进式解锁内容",
                "增加操作提示"
            ]
        })
        
        suggestions.append({
            "priority": "中",
            "suggestion": "增加社交元素",
            "actions": [
                "好友互访系统",
                "咖啡配方分享",
                "排行榜竞赛"
            ]
        })
        
        critique["suggestions"] = suggestions
    
    def _generate_player_voice(self, critique: dict) -> str:
        """生成玩家口吻评价"""
        score = critique["overall_score"]
        
        if score >= 8:
            return f"""
家人们，这个游戏 {self._random_vocab('绝绝子')} 啊！
微恐咖啡厅这个设定 {self._random_vocab('这波在大气层')} ，
不是那种吓死人的恐怖，是那种细思极恐的感觉 {self._random_vocab('蚌埠住了')} 。
内容真的丰富，我已经玩了30个小时了，
还有隐藏剧情没解锁，{self._random_vocab('yyds')} ！
强烈推荐给喜欢经营+剧情的朋友！
"""
        elif score >= 6:
            return f"""
还行吧，{score}分水平。
微恐主题挺有意思的，但感觉还能深挖。
内容量够玩一段时间，但后期有点重复 {self._random_vocab('坐牢')} 。
要是能增加点随机事件就好了。
总的来说 {self._random_vocab('可以冲')} ，但别指望能玩几百小时。
"""
        else:
            return f"""
{self._random_vocab('退退退')} ，这游戏 {score}分真的不冤。
说是微恐咖啡厅，结果就是个换皮经营游戏，
微恐元素 {self._random_vocab('真的栓Q')} 。
内容少，玩几个小时就没事干了。
制作组能不能用点心啊，别浪费这个好题材。
{self._random_vocab('蚌埠住了')} ，等更新吧。
"""
    
    def _random_vocab(self, word: str = None) -> str:
        """随机网络用语"""
        if word and word in self.personality["vocabulary"]:
            return word
        import random
        return random.choice(self.personality["vocabulary"])
    
    def generate_report(self, critique: dict) -> str:
        """生成完整的评价报告"""
        report = f"""
🎮 游戏体验报告 - 微恐咖啡厅

总体评分: {critique['overall_score']}/10

📊 分项评分:
"""
        for aspect, score in critique['aspects'].items():
            report += f"  • {aspect}: {score}/10\n"
        
        report += "\n✅ 优点:\n"
        for i, pro in enumerate(critique['pros'], 1):
            report += f"{i}. {pro['point']}\n   {pro['detail']}\n"
        
        report += "\n❌ 缺点:\n"
        for i, con in enumerate(critique['cons'], 1):
            severity = con.get('severity', '')
            report += f"{i}. {con['point']} {severity}\n   {con['detail']}\n"
        
        report += "\n💡 改进建议:\n"
        for i, suggestion in enumerate(critique['suggestions'], 1):
            report += f"{i}. [{suggestion['priority']}] {suggestion['suggestion']}\n"
            for action in suggestion['actions']:
                report += f"   - {action}\n"
        
        report += f"\n🗣️ 真实玩家感受:\n{critique['player_voice']}\n"
        
        return report


# 测试数据
def get_game_data() -> dict:
    """获取当前游戏数据"""
    return {
        "name": "微恐咖啡厅",
        "chapters": 2,  # 已完成章节
        "customers": 20,  # 顾客数量
        "recipes": 50,  # 配方数量
        "achievements": 50,  # 成就数量
        "systems": ["剧情", "顾客", "配方", "成就", "经营"],  # 系统数量
        "crafting_depth": 7,  # 制作深度
        "pay_to_win": False,  # 是否有逼氪
        "unique_features": ["微恐氛围", "幽灵顾客", "神秘配方", "多结局"],
        "is_reskin": False,
        "theme_integration": 8,  # 主题契合度
        "multiple_endings": True,
        "collectibles": 100,  # 收集要素
        "random_events": False  # 是否有随机事件
    }


if __name__ == '__main__':
    # 创建智能体
    agent = GameCritiqueAgent()
    
    # 获取游戏数据
    game_data = get_game_data()
    
    # 分析游戏
    critique = agent.analyze_game(game_data)
    
    # 生成报告
    report = agent.generate_report(critique)
    
    print(report)
    
    # 保存报告
    output_path = Path('/root/.openclaw/workspace/微恐咖啡厅/critique_report.md')
    output_path.write_text(report, encoding='utf-8')
    print(f"\n✅ 报告已保存到: {output_path}")