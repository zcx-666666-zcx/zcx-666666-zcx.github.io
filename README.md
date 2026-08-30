# 🚀 个人网站（作品集 + 博客 + 简历）

苹果极简风格 × 太空主题的纯静态个人网站。**零依赖、零构建**——不需要安装任何东西，改完文件就是成品。

## 📁 文件结构

```
personal-website/
├── index.html          首页（英雄区 / 关于我 / 马斯克语录 / 精选作品 / 最新文章）
├── works.html          作品集
├── blog.html           博客列表
├── resume.html         简历（支持「打印 / 导出 PDF」）
├── posts/              博客文章
│   ├── _template.html  ✏️ 新文章模板（复制它来写新文章）
│   ├── why-space.html
│   ├── learn-from-musk.html
│   └── apple-design.html
└── assets/
    ├── css/style.css   全部样式（设计系统，带中文注释）
    └── js/main.js      星空背景、滚动动画、移动端菜单
```

## 👀 本地预览

直接双击 `index.html` 用浏览器打开即可。

想用本地服务器（更像线上环境）：

```bash
# 方式一：有 Node.js
npx serve personal-website

# 方式二：有 Python
cd personal-website && python -m http.server 8000
```

然后访问 http://localhost:8000（方式二）或终端提示的地址（方式一）。

## ✏️ 改成你自己的内容

所有页面里带 `✏️` 注释的地方都是占位内容，逐一替换即可：

| 想改什么 | 去哪里改 |
|---|---|
| 名字 / 个人标语 | `index.html` 英雄区、导航栏 logo、各页页脚 |
| 头像 | `index.html` 「关于我」区块，把 emoji 换成 `<img>` |
| 邮箱 / GitHub 链接 | 每页导航栏、页脚、简历页 |
| 作品项目 | `works.html`（6 张卡片）和 `index.html`（精选 3 张） |
| 简历内容 | `resume.html`（经历/项目/技能/教育全部是示例） |
| 技能条长度 | `resume.html` 里每个 `.skill` 的 `--w: 92%` |

## 📝 写新博客文章

1. 复制 `posts/_template.html`，改名如 `my-new-post.html`（用英文和短横线）；
2. 替换标题、日期、正文（模板里有可用的标签说明）；
3. 打开 `blog.html`，把列表里的 `post-row` 复制一行放到最上面，链接指向新文章；
4. 首页 `index.html` 的「最新文章」里也加一行。

## 🌍 部署到 GitHub Pages（已自动上线）

- **源码仓库（私有）**：`zcx-666666-zcx/personal-website`
- **发布仓库（公开）**：`zcx-666666-zcx/zcx-666666-zcx.github.io`
- **线上地址**：<https://zcx-666666-zcx.github.io>

只要 `git push` 到 `main` 分支，GitHub Actions（见 `.github/workflows/deploy.yml`）就会自动把站点文件（`index.html`、`works.html`、`blog.html`、`resume.html`、`posts/`、`assets/`、`README.md`）同步到公开仓库，Pages 随之自动构建上线，无需手动上传。

> 部署机制：私有仓库免费版不能直接开 Pages，所以由公开仓库提供 Pages 服务；同步用的 SSH 私钥存在私有仓库的 Actions secret `PAGES_DEPLOY_KEY` 里，公钥是公开仓库的 deploy key。

> 常用命令方式（可选）：装了 Git 的话，`git init` → `git add .` → `git commit -m "init"` → 关联远程仓库 → `git push`，以后一条 `git push` 就能更新。

## 🌐 绑定自己的域名（可选）

1. 买个域名（`.top`/`.xyz` 首年几块钱，`.me`/`.dev` 约 ¥60–100/年）；
2. 在域名解析里加一条 CNAME 记录：主机记录 `www`（或 `@`），指向 `你的用户名.github.io`；
3. 网站根目录新建一个名为 `CNAME` 的文件（无后缀），内容只写你的域名，如 `www.example.com`，上传；
4. 回到 Settings → Pages，勾选 **Enforce HTTPS**。

## ⚡ 后续可做的优化

- **国内加速**：域名接入 Cloudflare（免费，境外 CDN，不用备案），弥补 GitHub Pages 在大陆的速度；
- **评论系统**：在文章模板里加 [Giscus](https://giscus.app)（基于 GitHub Discussions，免费）；
- **访问统计**：接入 [GoatCounter](https://www.goatcounter.com)（免费无追踪）或 Google Analytics；
- **自动部署**：学一点 Git 后用命令行推送，或用 GitHub Actions。

祝你发射顺利。🛰️
