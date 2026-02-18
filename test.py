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

# API 配置 (Kimi)
API_KEY = 'sk-WUnaFKemy2rZL6IUNJvZWH4oGa3v089fgaaWjmZBAI1xsqb6'
API_URL = 'https://api.moonshot.cn/v1/chat/completions'

# Prompt 模板
STYLE_PROMPTS = {
    'hot': lambda length: f"""请联网搜索2026年2月11日-18日最热门的3个娱乐/生活话题，然后写3段不同的搞笑"疯狂星期四"文案。

重要：必须先联网搜索确认2026年2月真实热点，不要用旧新闻！

可用热点类型：明星八卦、综艺、电影、电视剧、游戏、网红视频、社会趣闻等。严禁政治！

要求：
1. 搜索并选择3个不同的2026年2月真实热门话题
2. 每段{length}字左右，前面假装认真讨论热点，后面转折到"V我50吃KFC"
3. 语气像朋友聊天，搞笑不严肃
4. 直接输出3段文案，用"---"分隔

格式：
文案1：
[第一段文案内容]
---
文案2：
[第二段文案内容]
---
文案3：
[第三段文案内容]

请直接写：""",

    'simp': lambda length: f"""写3段不同的"舔狗型"疯狂星期四文案，每段都要以舔狗的卑微视角开头，表达对某人的思念/等待/付出，然后转折到"V我50吃KFC"。

要求：
1. 3段文案要有不同的舔狗场景和角度
2. 每段{length}字左右
3. 语气卑微、可怜、深情又带点哀怨
4. 直接输出3段文案，用"---"分隔

格式：
文案1：
[第一段内容]
---
文案2：
[第二段内容]
---
文案3：
[第三段内容]

请直接写：""",

    'abstract': lambda length: f"""写3段不同的"抽象型"疯狂星期四文案，每段都要极度抽象，符合年轻人抽象文化，融入网络热梗、emoji、无厘头比喻。

要求：
1. 3段文案要有不同的抽象角度和梗
2. 每段{length}字左右
3. 打破常规逻辑，追求极致荒诞感
4. 直接输出3段文案，用"---"分隔

格式：
文案1：
[第一段内容]
---
文案2：
[第二段内容]
---
文案3：
[第三段内容]

请直接写："""
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
        'model': 'kimi-k2-turbo-preview',
        'messages': [{'role': 'user', 'content': '你好，请回复"API连接正常"'}],
        'max_tokens': 100
    }
    
    print(f"请求 URL: {API_URL}")
    print(f"请求模型: kimi-k2-turbo-preview")
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
        'model': 'kimi-k2-turbo-preview',
        'messages': [{'role': 'user', 'content': '今天有什么热点新闻？简要回答'}],
        'tools': [{'type': 'builtin_function', 'function': {'name': '$web_search'}}],
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
        'model': 'kimi-k2-turbo-preview',
        'messages': [{'role': 'user', 'content': prompt}],
        'tools': [{'type': 'builtin_function', 'function': {'name': '$web_search'}}],
        'temperature': 0.8,
        'max_tokens': 4096
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
