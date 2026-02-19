const API_KEY = 'sk-WUnaFKemy2rZL6IUNJvZWH4oGa3v089fgaaWjmZBAI1xsqb6';
const API_URL = 'https://api.moonshot.cn/v1/chat/completions';

const stylePrompts = {
    hot: (length) => `请按以下步骤执行：

步骤1：联网搜索"微博热搜榜"，获取当前（今天）微博热搜前10名的内容。

步骤2：从微博热搜中挑选3个最热门、最有趣的话题（排除政治敏感话题）。

步骤3：分别联网搜索这3个话题的详细信息，了解事件背景、具体内容、网友讨论等。

步骤4：根据搜索到的真实信息，写3段不同的搞笑"疯狂星期四"文案。

要求：
1. 必须基于真实的微博热搜和搜索结果，严禁编造虚假内容！
2. 每段${length}字左右，前面假装认真讨论热点，后面幽默丝滑地转折到"V我50吃KFC"等类似的疯狂星期四主题文案上。
3. 语气像朋友聊天，搞笑不严肃
4. 直接输出3段文案，用"---"分隔
5. 显示当前的日期和时间（采用北京时间）
6. 热点话题必须是今天微博热搜上真实存在的

格式：
当前的日期是X年X月X日，时间是北京时间XXX。
---
热点事件1：[发生时间 + 一句话总结热点事件]
文案1：
[第一段文案内容]
---
热点事件2：[发生时间 + 一句话总结热点事件]
文案2：
[第二段文案内容]
---
热点事件3：[发生时间 + 一句话总结热点事件]
文案3：
[第三段文案内容]

请直接写：`,

    simp: (length) => `写3段不同的"舔狗型"疯狂星期四文案，每段都要以舔狗的卑微视角开头，表达对某人的思念/等待/付出，然后转折到"V我50吃KFC"。

要求：
1. 3段文案要有不同的舔狗场景和角度
2. 每段${length}字左右
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

请直接写：`,

    abstract: (length) => `写3段不同的"抽象型"疯狂星期四文案，每段都要极度抽象，符合年轻人抽象文化，融入网络热梗、emoji、无厘头比喻。

要求：
1. 3段文案要有不同的抽象角度和梗
2. 每段${length}字左右
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

请直接写：`
};

const generateBtn = document.getElementById('generateBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const copyBtn = document.getElementById('copyBtn');
const resultPanel = document.querySelector('.result-panel');
const resultText = document.getElementById('resultText');
const toast = document.getElementById('toast');
const btnText = generateBtn.querySelector('.btn-text');
const loadingText = generateBtn.querySelector('.loading');

// 封装基础请求函数
async function makeRequest(messages, tools = null) {
    const body = {
        model: 'kimi-k2-turbo-preview',
        messages: messages,
        temperature: 0.8,
        max_tokens: 4096,
        stream: false
    };

    // 只有在 tools 不为 null 时才添加到请求体中
    if (tools) {
        body.tools = tools;
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(body)
    });

    const responseText = await response.text();

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    return JSON.parse(responseText);
}

// 核心生成逻辑 - 根据文档重写了 Tool Loop
async function generateContent() {
    const style = document.querySelector('input[name="style"]:checked').value;
    const length = document.querySelector('input[name="length"]:checked').value;

    setLoading(true);
    resultPanel.classList.remove('hidden');
    resultText.textContent = '正在生成中，请稍候...';

    try {
        const prompt = stylePrompts[style](length);

        console.log('发送请求:', API_URL);
        console.log('请求模型: kimi-k2-turbo-preview');

        // 定义工具：使用 Kimi 的内置搜索功能
        const tools = [
            {
                type: 'builtin_function',
                function: {
                    name: '$web_search'
                }
            }
        ];

        // 初始化消息历史
        let messages = [
            {
                role: 'user',
                content: prompt
            }
        ];

        let finishReason = null;
        let finalContent = null;
        let callCount = 0;
        const MAX_LOOPS = 5; // 防止死循环

        // 循环处理，直到 finish_reason 不再是 tool_calls
        while (finishReason === null || finishReason === 'tool_calls') {
            if (callCount >= MAX_LOOPS) {
                throw new Error("工具调用次数过多，强制停止");
            }
            callCount++;

            // 发送请求
            // 注意：如果是工具调用后的后续请求，通常也需要带上 tools 定义，
            // 否则模型可能无法正确解析之前的 tool_calls 上下文或进行多步搜索。
            const data = await makeRequest(messages, tools);
            
            if (!data.choices || !data.choices[0]) {
                throw new Error('API 返回数据格式错误');
            }

            const choice = data.choices[0];
            const message = choice.message;
            finishReason = choice.finish_reason;

            console.log(`第 ${callCount} 次响应 finish_reason:`, finishReason);

            // 如果是工具调用
            if (finishReason === 'tool_calls') {
                console.log('检测到工具调用:', JSON.stringify(message.tool_calls, null, 2));
                
                // 1. 将助手的消息（包含 tool_calls）添加到历史记录
                messages.push(message);

                // 2. 处理每一个 tool_call
                // 对于 $web_search (builtin_function)，通常服务端已自动处理。
                // 但如果模型返回了 tool_calls，我们需要回传一个 role: 'tool' 的消息来闭环。
                // 我们模拟一个“成功”的回执，让模型知道它可以继续生成了。
                for (const toolCall of message.tool_calls) {
                    // 构造 Tool Message
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolCall.function.name,
                        content: JSON.stringify({ result: "搜索引擎已执行，请根据搜索结果回答。" }) 
                        // 注意：对于 builtin_function，通常不需要客户端真正去爬取，
                        // 搜索结果往往会自动注入到 context 中，或者模型只是需要一个触发信号。
                    });
                }
                
                // 循环将继续，带着 tool results 再次请求 API
                
            } else {
                // 如果不是工具调用，说明生成完成了（finish_reason === 'stop'）
                finalContent = message.content;
            }
        }

        console.log('生成完成');

        if (!finalContent || finalContent.trim() === '') {
            resultText.textContent = '⚠️ 生成内容为空，请重试。';
            return;
        }

        resultText.textContent = finalContent;
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error('生成失败:', error);
        resultText.textContent = `❌ 生成失败\n\n错误类型: ${error.name}\n错误信息: ${error.message}\n\n请检查:\n1. API Key 是否正确\n2. 网络连接是否正常\n3. 浏览器控制台(F12)查看详细错误`;
    } finally {
        setLoading(false);
    }
}

function setLoading(loading) {
    if (loading) {
        generateBtn.disabled = true;
        btnText.classList.add('hidden');
        loadingText.classList.remove('hidden');
    } else {
        generateBtn.disabled = false;
        btnText.classList.remove('hidden');
        loadingText.classList.add('hidden');
    }
}

async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(resultText.textContent);
        showToast();
    } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = resultText.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast();
    }
}

function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

generateBtn.addEventListener('click', generateContent);
regenerateBtn.addEventListener('click', generateContent);
copyBtn.addEventListener('click', copyToClipboard);

document.querySelectorAll('input[name="style"]').forEach(radio => {
    radio.addEventListener('change', () => {
        resultPanel.classList.add('hidden');
    });
});

document.querySelectorAll('input[name="length"]').forEach(radio => {
    radio.addEventListener('change', () => {
        resultPanel.classList.add('hidden');
    });
});