# 🍗 疯狂星期四文案生成器

一个基于 AI 的疯狂星期四文案生成网页，使用 GLM-4.7-Flash 大模型，支持多种风格文案生成。

## ✨ 功能特点

- 🎯 **三种文案风格**
  - **时政热点欺诈型**：以热点事件开头，吸引读者，然后图穷匕见
  - **舔狗型**：卑微舔狗文学，让人心疼又无奈
  - **抽象型**：年轻人的抽象文化，极致的荒诞与幽默

- 📏 **多种字数选择**：支持 100字/200字/300字 三种长度

- 🤖 **AI 驱动**：使用 GLM-4.7-Flash 大模型，支持联网搜索获取最新热点

- 📱 **响应式设计**：完美适配手机、平板、电脑等各种设备

## 🚀 在线访问

访问 [https://你的项目名.vercel.app](https://你的项目名.vercel.app) 即可使用

## 🛠️ 本地开发

```bash
# 克隆项目
git clone https://github.com/你的用户名/疯狂星期四文案生成器.git

# 进入项目目录
cd 疯狂星期四文案生成器

# 直接在浏览器中打开 index.html
# 或使用本地服务器
npx serve .
```

## 📦 部署到 Vercel

### 方式一：通过 GitHub 部署（推荐）

1. 在 GitHub 上创建一个新仓库
2. 将代码推送到仓库：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```
3. 登录 [Vercel](https://vercel.com)
4. 点击 "Add New Project"
5. 选择你的 GitHub 仓库
6. 点击 "Deploy"，等待部署完成

### 方式二：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel

# 生产环境部署
vercel --prod
```

## 🔧 技术栈

- HTML5 + CSS3 + JavaScript (原生)
- GLM-4.7-Flash API（智谱 AI）
- 支持联网搜索获取最新热点

## 📝 API 说明

本项目使用智谱 AI 的 GLM-4.7-Flash 模型，API 配置如下：

```javascript
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL = 'glm-4.7-flash';
```

## 📄 文件结构

```
.
├── index.html      # 主页面
├── styles.css      # 样式文件
├── script.js       # JavaScript 逻辑
├── README.md       # 项目说明
└── vercel.json     # Vercel 配置文件
```

## ⚠️ 注意事项

1. API Key 已内置在代码中，如需更换请修改 `script.js` 中的 `API_KEY`
2. 由于浏览器 CORS 限制，如果在本地直接打开 HTML 文件可能会遇到跨域问题，建议使用本地服务器运行
3. Vercel 部署后可直接正常使用，无需额外配置

## 📜 开源协议

MIT License

---

Made with ❤️ for Crazy Thursday
