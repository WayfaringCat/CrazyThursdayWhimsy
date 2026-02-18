#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
疯狂星期四文案生成器 - 测试脚本
用于测试 GLM-4.7-Flash API 的各种功能
"""

import urllib.request
import urllib.error
import json
import ssl
import sys

# API 配置 (智谱 AI)
API_KEY = '3f062c1a4a3e40049fb2949105685ad0.J4NmXPfhrMVMTyok'
API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

# Prompt 模板
STYLE_PROMPTS = {
    'hot': lambda length: f"""写一段搞笑"疯狂星期四"文案，直接输出文案，不要分析过程。

要求：
1. 用最近一周最火的娱乐/生活话题开头（明星八卦、综艺、电影、游戏、网红梗）
2. 前面假装认真讨论，后面突然转折到"V我50吃KFC"
3. 语气要像朋友聊天，搞笑不严肃
4. 严禁AI、科技、政治话题！只聊娱乐生活！
5. {length}字左右

示例：
"刚看完XX电影，特效太炸裂了！主角最后那个反转我直接跪了...但比反转更炸裂的是，今天疯狂星期四，V我50吃KFC！"

请直接写文案：""",

    'simp': lambda length: f"""你是一个专业的文案创作者，擅长写"疯狂星期四"文案。请创作一个"舔狗型"的疯狂星期四文案。

要求：
1. 以舔狗的卑微视角开头，表达对某人的思念、等待或付出
2. 语气要卑微、可怜、充满委屈但又深情
3. 在文案中或结尾转折到"疯狂星期四，V我50吃KFC"的核心诉求
4. 要把"舔而不得"的委屈和"想吃炸鸡"的渴望结合起来，形成反差萌
5. 文案长度控制在{length}字左右
6. 要有舔狗文学那种"我为你付出这么多，你连50都不给我"的哀怨感
7. 不要出现"以下是"、"文案如下"等提示性文字，直接输出文案内容

请直接输出文案，不要添加任何解释。""",

    'abstract': lambda length: f"""你是一个专业的文案创作者，擅长写"疯狂星期四"文案。请创作一个"抽象型"的疯狂星期四文案。

要求：
1. 风格要极度抽象，符合当下年轻人的抽象文化
2. 可以使用无厘头的比喻、跳跃的思维、荒诞的逻辑
3. 可以融入网络热梗、emoji、颜文字等元素
4. 在文案中自然融入"疯狂星期四，V我50吃KFC"的核心诉求
5. 文案长度控制在{length}字左右
6. 要有那种"看似胡说八道但细想又有点道理"的荒诞感
7. 可以打破常规语法和逻辑，追求极致的抽象效果
8. 不要出现"以下是"、"文案如下"等提示性文字，直接输出文案内容

请直接输出文案，不要添加任何解释。"""
}

STYLE_NAMES = {
    'hot': '实时热点欺诈型',
    'simp': '舔狗型',
    'abstract': '抽象型'
}


def make_request(data, timeout=60):
    """发送 HTTP POST 请求"""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}'
    }
    
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(data).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))
    except Exception as e:
        return -1, str(e)


def test_api_connection():
    """测试 API 连接是否正常"""
    print("=" * 60)
    print("🔍 测试 1: API 连接测试")
    print("=" * 60)
    
    data = {
        'model': 'glm-4.7-flashx',
        'messages': [{'role': 'user', 'content': '你好，请回复"API连接正常"'}],
        'max_tokens': 100
    }
    
    print(f"请求 URL: {API_URL}")
    print(f"请求模型: glm-4.7-flashx")
    print("\n发送请求中...")
    
    status, result = make_request(data, timeout=30)
    
    print(f"状态码: {status}")
    
    if status == 200:
        content = result['choices'][0]['message']['content']
        print(f"✅ API 连接成功!")
        print(f"响应内容: {content}")
        return True
    else:
        print(f"❌ API 连接失败!")
        print(f"错误信息: {result}")
        return False


def test_web_search():
    """测试联网搜索功能"""
    print("\n" + "=" * 60)
    print("🔍 测试 2: 联网搜索功能测试")
    print("=" * 60)
    
    data = {
        'model': 'glm-4.7-flashx',
        'messages': [{'role': 'user', 'content': '今天有什么热点新闻？简要回答'}],
        'tools': [{'type': 'web_search', 'web_search': {'enable': True}}],
        'max_tokens': 300
    }
    
    print("发送带联网搜索的请求...")
    status, result = make_request(data, timeout=60)
    
    if status == 200:
        content = result['choices'][0]['message']['content']
        print(f"✅ 联网搜索功能正常!")
        print(f"搜索结果预览: {content[:200]}...")
        return True
    else:
        print(f"❌ 联网搜索失败!")
        print(f"错误信息: {result}")
        return False


def generate_crazy_thursday_text(style, length):
    """生成疯狂星期四文案"""
    prompt = STYLE_PROMPTS[style](length)
    
    data = {
        'model': 'glm-4.7-flashx',
        'messages': [{'role': 'user', 'content': prompt}],
        'tools': [{'type': 'web_search', 'web_search': {'enable': True}}],
        'temperature': 0.8,
        'max_tokens': 2048
    }
    
    status, result = make_request(data, timeout=60)
    
    if status == 200:
        return result['choices'][0]['message']['content']
    else:
        return f"生成失败: HTTP {status} - {result}"


def test_all_styles():
    """测试所有文案风格"""
    print("\n" + "=" * 60)
    print("🔍 测试 3: 所有文案风格生成测试")
    print("=" * 60)
    
    styles = ['hot', 'simp', 'abstract']
    lengths = [100, 200, 300]
    
    for style in styles:
        print(f"\n{'─' * 60}")
        print(f"📝 风格: {STYLE_NAMES[style]}")
        print('─' * 60)
        
        for length in lengths:
            print(f"\n  📏 字数: {length}字左右")
            print(f"  {'─' * 50}")
            
            content = generate_crazy_thursday_text(style, length)
            
            print(f"  生成结果:")
            print(f"  {content}")
            print(f"  实际字数: {len(content)} 字")
            print()


def interactive_mode():
    """交互模式 - 让用户选择风格并生成"""
    print("\n" + "=" * 60)
    print("🎮 交互模式 - 选择风格生成文案")
    print("=" * 60)
    
    print("\n可选风格:")
    print("  1. 时政热点欺诈型 (hot)")
    print("  2. 舔狗型 (simp)")
    print("  3. 抽象型 (abstract)")
    print("  q. 退出")
    
    while True:
        choice = input("\n请选择风格 (1/2/3/q): ").strip().lower()
        
        if choice == 'q':
            print("再见!")
            break
        
        style_map = {'1': 'hot', '2': 'simp', '3': 'abstract'}
        
        if choice not in style_map:
            print("无效选择，请重新输入")
            continue
        
        style = style_map[choice]
        
        print("\n可选字数:")
        print("  1. 100字左右")
        print("  2. 200字左右")
        print("  3. 300字左右")
        
        length_choice = input("请选择字数 (1/2/3): ").strip()
        length_map = {'1': 100, '2': 200, '3': 300}
        
        if length_choice not in length_map:
            print("无效选择，使用默认 100字")
            length = 100
        else:
            length = length_map[length_choice]
        
        print(f"\n正在生成 {STYLE_NAMES[style]} 风格的文案 ({length}字)...")
        print("=" * 60)
        
        content = generate_crazy_thursday_text(style, length)
        
        print(f"\n✅ 生成结果:")
        print("-" * 60)
        print(content)
        print("-" * 60)
        print(f"实际字数: {len(content)} 字")


def main():
    """主函数"""
    print("\n" + "=" * 60)
    print("🍗 疯狂星期四文案生成器 - 测试脚本")
    print("=" * 60)
    
    print("\n请选择测试模式:")
    print("  1. 完整测试 (API连接 + 联网搜索 + 所有风格)")
    print("  2. 仅测试 API 连接")
    print("  3. 仅测试文案生成")
    print("  4. 交互模式")
    print("  q. 退出")
    
    choice = input("\n请输入选项 (1/2/3/4/q): ").strip().lower()
    
    if choice == 'q':
        print("再见!")
        sys.exit(0)
    
    if choice == '1':
        api_ok = test_api_connection()
        if api_ok:
            test_web_search()
            test_all_styles()
        else:
            print("\n❌ API 连接失败，跳过后续测试")
    
    elif choice == '2':
        test_api_connection()
    
    elif choice == '3':
        test_all_styles()
    
    elif choice == '4':
        interactive_mode()
    
    else:
        print("无效选项")
    
    print("\n" + "=" * 60)
    print("测试完成!")
    print("=" * 60)


if __name__ == '__main__':
    main()
