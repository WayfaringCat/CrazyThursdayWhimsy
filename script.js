const API_KEY = 'sk-WUnaFKemy2rZL6IUNJvZWH4oGa3v089fgaaWjmZBAI1xsqb6';
const API_URL = 'https://api.moonshot.cn/v1/chat/completions';

const stylePrompts = {
    hot: (length) => `请联网搜索最近一周的热点话题，然后根据热点话题写3段不同的搞笑"疯狂星期四"文案。注意要在输出的内容前面标注上热点事件的内容和时间。

重要：必须先联网搜索确认是最新的热点，不要用旧新闻！

可用热点类型：传播广泛的热梗，科技，中国人普遍关注的热门事件比如春晚、国庆节、元旦假期等，电影、电视剧、游戏、网红视频、社会趣闻、科技等。严禁政治！

要求：
1. 搜索并选择3个不同的最近的真实热门话题
2. 每段${length}字左右，前面假装认真讨论热点，后面转折到"V我50吃KFC"等类似的点名疯狂星期四主题的文案上。
3. 语气像朋友聊天，搞笑不严肃
4. 直接输出3段文案，用"---"分隔
5. 显示当前的日期和时间

格式：
当前的日期是X年X月X日，时间是XXX。
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

async function makeRequest(messages, tools = null, stream = false) {
    const body = {
        model: 'kimi-k2-turbo-preview',
        messages: messages,
        temperature: 0.8,
        max_tokens: 4096,
        stream: stream
    };
    
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

        // 第一次调用，可能触发工具调用
        let messages = [
            {
                role: 'user',
                content: prompt
            }
        ];

        let data = await makeRequest(messages, [
            {
                type: 'builtin_function',
                function: {
                    name: '$web_search'
                }
            }
        ]);

        console.log('第一次响应:', data);

        // 处理工具调用 - Kimi 的 $web_search 是自动执行的
        let content = null;
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            // 如果有工具调用，需要继续对话获取最终结果
            if (data.choices[0].finish_reason === 'tool_calls' && data.choices[0].message.tool_calls) {
                console.log('检测到工具调用，Kimi 正在执行搜索...');
                
                // 将助手的消息（包含 tool_calls）添加到消息列表
                messages.push(data.choices[0].message);
                
                // 为每个工具调用添加执行结果
                // 对于 $web_search，我们传递搜索ID，让 Kimi 服务端获取结果
                for (const toolCall of data.choices[0].message.tool_calls) {
                    if (toolCall.function.name === '$web_search') {
                        // 解析工具调用的参数，获取 search_id
                        let toolArgs;
                        try {
                            toolArgs = JSON.parse(toolCall.function.arguments);
                        } catch (e) {
                            toolArgs = {};
                        }
                        
                        // 添加工具调用结果，包含 search_id
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: toolCall.function.arguments
                        });
                    }
                }
                
                // 第二次调用，获取最终生成的文案（不传递 tools，让模型基于搜索结果生成）
                console.log('发送第二次请求，获取最终文案...');
                data = await makeRequest(messages, null);
                
                console.log('第二次响应:', data);
            }
            
            // 提取最终内容
            if (data.choices && data.choices[0] && data.choices[0].message) {
                content = data.choices[0].message.content;
            }
        }

        console.log('提取的内容:', content);
        console.log('finish_reason:', data.choices ? data.choices[0].finish_reason : 'N/A');

        if (!content || content.trim() === '') {
            resultText.textContent = `⚠️ API返回内容为空\n\nfinish_reason: ${data.choices ? data.choices[0].finish_reason : 'N/A'}\n\n原始响应:\n${JSON.stringify(data, null, 2).substring(0, 1000)}\n\n请检查浏览器控制台(F12)查看完整信息`;
            resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
        }

        resultText.textContent = content;
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
