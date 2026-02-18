const API_KEY = '3f062c1a4a3e40049fb2949105685ad0.J4NmXPfhrMVMTyok';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const stylePrompts = {
    hot: (length) => `写一段搞笑"疯狂星期四"文案，直接输出文案，不要分析过程。

要求：
1. 用最近一周最火的娱乐/生活话题开头（明星八卦、综艺、电影、游戏、网红梗）
2. 前面假装认真讨论，后面突然转折到"V我50吃KFC"
3. 语气要像朋友聊天，搞笑不严肃
4. 严禁AI、科技、政治话题！只聊娱乐生活！
5. ${length}字左右

示例：
"刚看完XX电影，特效太炸裂了！主角最后那个反转我直接跪了...但比反转更炸裂的是，今天疯狂星期四，V我50吃KFC！"

请直接写文案：`,

    simp: (length) => `你是一个专业的文案创作者，擅长写"疯狂星期四"文案。请创作一个"舔狗型"的疯狂星期四文案。

要求：
1. 以舔狗的卑微视角开头，表达对某人的思念、等待或付出
2. 语气要卑微、可怜、充满委屈但又深情
3. 在文案中或结尾转折到"疯狂星期四，V我50吃KFC"的核心诉求
4. 要把"舔而不得"的委屈和"想吃炸鸡"的渴望结合起来，形成反差萌
5. 文案长度控制在${length}字左右
6. 要有舔狗文学那种"我为你付出这么多，你连50都不给我"的哀怨感
7. 不要出现"以下是"、"文案如下"等提示性文字，直接输出文案内容

请直接输出文案，不要添加任何解释。`,

    abstract: (length) => `你是一个专业的文案创作者，擅长写"疯狂星期四"文案。请创作一个"抽象型"的疯狂星期四文案。

要求：
1. 风格要极度抽象，符合当下年轻人的抽象文化
2. 可以使用无厘头的比喻、跳跃的思维、荒诞的逻辑
3. 可以融入网络热梗、emoji、颜文字等元素
4. 在文案中自然融入"疯狂星期四，V我50吃KFC"的核心诉求
5. 文案长度控制在${length}字左右
6. 要有那种"看似胡说八道但细想又有点道理"的荒诞感
7. 可以打破常规语法和逻辑，追求极致的抽象效果
8. 不要出现"以下是"、"文案如下"等提示性文字，直接输出文案内容

请直接输出文案，不要添加任何解释。`
};

const generateBtn = document.getElementById('generateBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const copyBtn = document.getElementById('copyBtn');
const resultPanel = document.querySelector('.result-panel');
const resultText = document.getElementById('resultText');
const toast = document.getElementById('toast');
const btnText = generateBtn.querySelector('.btn-text');
const loadingText = generateBtn.querySelector('.loading');

async function generateContent() {
    const style = document.querySelector('input[name="style"]:checked').value;
    const length = document.querySelector('input[name="length"]:checked').value;

    setLoading(true);
    resultPanel.classList.remove('hidden');
    resultText.textContent = '正在生成中，请稍候...';

    try {
        const prompt = stylePrompts[style](length);

        console.log('发送请求:', API_URL);
        console.log('请求模型: glm-4.7-flashx');

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'glm-4.7-flashx',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                tools: [
                    {
                        type: 'web_search',
                        web_search: {
                            enable: true
                        }
                    }
                ],
                temperature: 0.8,
                max_tokens: 2048
            })
        });

        console.log('响应状态:', response.status);

        const responseText = await response.text();
        console.log('原始响应:', responseText);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${responseText}`);
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`JSON解析失败: ${e.message}\n原始响应: ${responseText.substring(0, 500)}`);
        }

        console.log('解析后的数据:', data);
        console.log('data.choices:', data.choices);
        console.log('data.choices[0]:', data.choices ? data.choices[0] : 'undefined');

        // 检查各种可能的响应格式
        let content = null;
        
        if (data.choices && data.choices[0]) {
            if (data.choices[0].message && data.choices[0].message.content) {
                content = data.choices[0].message.content;
            }
            // GLM-4.7-FlashX 可能有 reasoning_content
            if (!content && data.choices[0].message && data.choices[0].message.reasoning_content) {
                content = data.choices[0].message.reasoning_content;
            }
        }

        console.log('提取的内容:', content);
        console.log('finish_reason:', data.choices ? data.choices[0].finish_reason : 'N/A');

        if (!content || content.trim() === '') {
            // 显示原始响应用于调试
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
