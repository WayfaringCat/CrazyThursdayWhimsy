const API_KEY = '3f062c1a4a3e40049fb2949105685ad0.J4NmXPfhrMVMTyok';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const WEB_SEARCH_URL = 'https://open.bigmodel.cn/api/paas/v4/web_search';

const stylePrompts = {
    hot: (length, searchResults) => `你是一个疯狂星期四文案撰写专家。我已经为你搜索了微博热搜的相关信息，请根据这些真实的搜索结果来撰写文案。

以下是搜索到的微博热搜信息：
${searchResults}

请根据以上真实的搜索结果，完成以下任务：

步骤1：从搜索结果中挑选3个最热门、最有趣的话题（排除政治敏感话题）。

步骤2：根据这些真实的热点信息，写3段不同的搞笑"疯狂星期四"文案。

要求：
1. 必须基于上面提供的真实搜索结果，严禁编造虚假内容！
2. 每段${length}字左右，前面假装认真讨论热点，后面幽默丝滑地转折到"V我50吃KFC"等类似的疯狂星期四主题文案上。
3. 语气像朋友聊天，搞笑不严肃
4. 直接输出3段文案，用"---"分隔
5. 显示当前的日期和时间（采用北京时间）

格式：
当前的日期是X年X月X日，时间是北京时间XXX。
---
热点事件1：[一句话总结热点事件]
文案1：
[第一段文案内容]
---
热点事件2：[一句话总结热点事件]
文案2：
[第二段文案内容]
---
热点事件3：[一句话总结热点事件]
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

async function webSearch(query) {
    const response = await fetch(WEB_SEARCH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            search_query: query,
            search_engine: 'search_pro',
            search_intent: false,
            count: 10,
            search_recency_filter: 'oneDay',
            content_size: 'high'
        })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
        throw new Error(`搜索失败: HTTP ${response.status}: ${responseText}`);
    }

    return JSON.parse(responseText);
}

async function chatCompletion(messages) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'GLM-4.5-Air',
            messages: messages,
            temperature: 0.8,
            max_tokens: 4096
        })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    return JSON.parse(responseText);
}

function formatSearchResults(searchData) {
    if (!searchData.search_result || searchData.search_result.length === 0) {
        return '未找到相关搜索结果';
    }
    
    let result = '';
    searchData.search_result.forEach((item, index) => {
        result += `\n【结果${index + 1}】\n`;
        result += `标题: ${item.title || '无标题'}\n`;
        result += `内容: ${item.content || '无内容'}\n`;
        result += `来源: ${item.media || '未知'}\n`;
        result += `链接: ${item.link || '无链接'}\n`;
        if (item.publish_date) {
            result += `发布时间: ${item.publish_date}\n`;
        }
        result += '---\n';
    });
    return result;
}

async function generateContent() {
    const style = document.querySelector('input[name="style"]:checked').value;
    const length = document.querySelector('input[name="length"]:checked').value;

    setLoading(true);
    resultPanel.classList.remove('hidden');
    resultText.textContent = '正在生成中，请稍候...';

    try {
        let prompt;
        
        if (style === 'hot') {
            // 先进行网络搜索
            resultText.textContent = '正在搜索微博热搜...';
            console.log('开始搜索微博热搜...');
            
            const searchData = await webSearch('微博热搜榜 今日');
            console.log('搜索结果:', searchData);
            
            const searchResults = formatSearchResults(searchData);
            console.log('格式化的搜索结果:', searchResults);
            
            resultText.textContent = '搜索完成，正在生成文案...';
            prompt = stylePrompts[style](length, searchResults);
        } else {
            prompt = stylePrompts[style](length);
        }

        console.log('发送请求:', API_URL);
        console.log('请求模型: GLM-4.5-Air');

        let messages = [
            {
                role: 'user',
                content: prompt
            }
        ];

        const data = await chatCompletion(messages);

        console.log('响应:', data);

        let content = null;
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            content = data.choices[0].message.content;
        }

        console.log('提取的内容:', content);

        if (!content || content.trim() === '') {
            resultText.textContent = `⚠️ API返回内容为空\n\nfinish_reason: ${data.choices ? data.choices[0].finish_reason : 'N/A'}\n\n原始响应:\n${JSON.stringify(data, null, 2).substring(0, 2000)}\n\n请检查浏览器控制台(F12)查看完整信息`;
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