const API_KEY = 'sk-WUnaFKemy2rZL6IUNJvZWH4oGa3v089fgaaWjmZBAI1xsqb6';
// 修正：去除 URL 末尾的空格
const API_URL = 'https://api.moonshot.cn/v1/chat/completions';

const stylePrompts = {
    hot: (length) => `请联网搜索最近一周的热点话题，然后根据热点话题写3段不同的搞笑"疯狂星期四"文案。注意要在输出的内容前面标注上热点事件的内容和时间。

重要：必须先联网搜索确认是最新的热点，不要用旧新闻！

考虑的热点类型：传播广泛的热梗，科技，中国人普遍关注的热门事件比如春晚、国庆节、元旦假期等，电影、电视剧、游戏、社会趣闻、科技、大学生校园生活等。严禁政治！


要求：
1. 搜索并选择3个不同的最近的真实热门话题
2. 每段${length}字左右，前面假装认真讨论热点，后面幽默丝滑地转折到"V我50吃KFC"等类似的点名疯狂星期四主题的文案上。
3. 语气像朋友聊天，搞笑不严肃
4. 直接输出3段文案，用"---"分隔
5. 显示当前的日期和时间（采用北京时间）
6. 严禁产生虚假内容！！！

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

// 工具定义：使用 Kimi 内置的联网搜索功能
const tools = [
    {
        type: 'builtin_function',
        function: {
            name: '$web_search'
        }
    }
];

async function makeRequest(messages, toolsParam = null) {
    const body = {
        model: 'kimi-k2-turbo-preview',
        messages: messages,
        temperature: 0.8,
        max_tokens: 4096
    };
    
    if (toolsParam) {
        body.tools = toolsParam;
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

async function generateContent() {
    const style = document.querySelector('input[name="style"]:checked').value;
    const length = document.querySelector('input[name="length"]:checked').value;

    setLoading(true);
    resultPanel.classList.remove('hidden');
    resultText.textContent = '正在生成中，请稍候...';

    try {
        const prompt = stylePrompts[style](length);

        console.log('开始生成，模型: kimi-k2-turbo-preview');

        // 初始化消息列表，添加 system message（官方文档标准做法）
        let messages = [
            {
                role: 'system',
                content: '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        let finishReason = null;
        let content = null;
        let attempts = 0;
        const maxAttempts = 5; // 防止无限循环

        // 使用 while 循环处理工具调用（官方文档标准流程）
        while ((finishReason === null || finishReason === 'tool_calls') && attempts < maxAttempts) {
            attempts++;
            console.log(`第 ${attempts} 次请求...`);

            const data = await makeRequest(messages, tools);
            
            if (!data.choices || !data.choices[0]) {
                throw new Error('API 返回数据格式错误');
            }

            const choice = data.choices[0];
            finishReason = choice.finish_reason;

            console.log('finish_reason:', finishReason);

            if (finishReason === 'tool_calls') {
                // 将 assistant 的 tool_calls 消息加入上下文
                messages.push(choice.message);
                console.log('检测到工具调用:', JSON.stringify(choice.message.tool_calls, null, 2));

                // 为每个 tool_call 添加执行结果
                // 注意：对于 $web_search 这个 builtin_function，Kimi 服务端会自动执行搜索
                // 但按照 API 规范，我们仍需要添加 role=tool 的消息来表示工具已执行
                for (const toolCall of choice.message.tool_calls) {
                    const toolCallName = toolCall.function.name;
                    
                    // 构建工具执行结果
                    // 对于内置搜索工具，我们传递一个占位结果，实际搜索结果由服务端自动注入上下文
                    const toolResult = {
                        status: 'completed',
                        tool_name: toolCallName,
                        note: 'Search completed by server-side builtin function'
                    };

                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolCallName,
                        content: JSON.stringify(toolResult)
                    });
                }
            } else {
                // 获取最终生成的内容
                content = choice.message.content;
            }
        }

        if (attempts >= maxAttempts) {
            throw new Error('工具调用次数过多，可能陷入循环');
        }

        console.log('生成完成，内容长度:', content ? content.length : 0);

        if (!content || content.trim() === '') {
            resultText.textContent = `⚠️ API返回内容为空\n\n请检查模型是否正确调用了搜索工具，或稍后重试。`;
            resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
        }

        resultText.textContent = content;
        resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('生成失败:', error);
        resultText.textContent = `❌ 生成失败\n\n错误类型: ${error.name}\n错误信息: ${error.message}\n\n请检查:\n1. API Key 是否正确且未过期\n2. 网络连接是否正常\n3. 是否触发了内容安全策略\n\n技术细节请查看浏览器控制台(F12)`;
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