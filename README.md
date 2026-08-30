# 🚀 个人网站（作品集 + 博客 + 简历）

苹果极简风格 × 太空主题的纯静态个人网站。**零依赖、零构建**——不需要安装任何东西，改完文件就是成品。

## 📁 文件结构

```
personal-website/
├── index.html          首页（英雄区 / 关于我 / GitHub 动态 / 精选作品 / 最新文章）
├── works.html          作品集（GitHub 真实项目）
├── blog.html           博客列表
├── resume.html         简历（支持「打印 / 导出 PDF」）
├── 404.html            走丢页面（飘到外太空了）
├── make_og_image.py    重新生成社交分享封面图的脚本
├── make_site_stats.py  本地统计博客字数（部署时工作流自动执行同款逻辑）
├── posts/              博客文章
│   ├── _template.html  ✏️ 新文章模板（复制它来写新文章）
│   ├── why-space.html
│   ├── learn-from-musk.html
│   └── apple-design.html
├── assets/
│   ├── css/style.css   全部样式（液态玻璃设计系统，带中文注释）
│   ├── js/main.js      星空背景、自定义鼠标、GitHub 数据渲染
│   ├── js/music.js     ✏️ 碟片音乐播放器（全站右下角，顶部播放列表可换歌）
│   ├── music/          音乐文件（目前是 3 首内置示例曲，可直接替换）
│   └── data/           GitHub 动态数据（本地为示例，部署时自动生成真实数据）
└── generate_assets.py  重新生成示例音轨与示例数据的脚本
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

## 🎵 换成自己喜欢的音乐

每一页右下角都有一台「小唱机」：点碟片开始播放，再点一下暂停，悬停有提示，面板里可以切歌；播放时碟片会转、有音符飘出。

想换成自己的歌：

1. 把 `mp3` / `wav` / `ogg` 文件放进 `assets/music/`；
2. 打开 `assets/js/music.js`，把顶部 `playlist` 里的标题和文件名改成你的（也支持填外链）；
3. 刷新页面即可。

> 播放器在全部页面启用。想在某一页关掉：删掉那一页里引用 `music.js` 的 `<script>` 行即可。碟片大小在 `style.css` 里搜 `--disc` 调整。

## 📊 博客统计与标签

博客页顶部有统计条：**文章数 / 总字数 / 站点运行天数 / 访问量 / 访客数**。

- 文章数与总字数：每次部署时自动统计 `posts/` 里所有文章的真实字数（`make_site_stats.py` 同款逻辑），无需手动维护；
- 运行天数：从 `assets/js/main.js` 里的 `SITE_LAUNCH`（上线日期）起算；
- 访问量 / 访客数：由「不蒜子」免费计数服务提供，每篇文章页还会显示本页浏览量；服务偶尔不稳定，加载失败会自动隐藏数字。

每篇文章可以打多个标签（在文章页 `post-meta` 和博客列表行里都能看到），博客页顶部的标签栏可以筛选；点击文章行里的小标签也能筛选。新文章记得在 `blog.html` 的行上加 `data-tags="标签1,标签2"` 和 `<div class="row-tags">`。

文章页顶部的「X 字 · 约 Y 分钟」按 400 字 / 分钟自动估算，想调速度改 `main.js` 里的 `READ_SPEED`。

## 🎨 图标（Lucide）

全站图标来自开源的 [Lucide](https://lucide.dev)（ISC 许可，可免费商用），通过 jsDelivr CDN 引入，无构建步骤。

- 想换 / 加图标：写 `<i data-lucide="图标名"></i>`，图标名在 [lucide.dev/icons](https://lucide.dev/icons) 查；
- 动态插入的内容（播放器、作品卡等）渲染后调用一次 `refreshIcons()`（定义在 `main.js`）；
- CDN 加载失败时图标不显示，但功能按钮都带文字标签，不影响使用。

## 💬 文章评论（giscus）

文章页底部有基于 GitHub Discussions 的评论区（giscus）。读者用 GitHub 账号即可留言。

> 首次启用前需要安装一次 giscus 应用：打开 <https://github.com/apps/giscus>，点 Install，选择 `zcx-666666-zcx.github.io` 这个仓库即可。装完评论立即生效，无需改代码。

评论主题会跟随站点的亮 / 暗色模式自动切换。

## 📊 访问统计（GoatCounter，可选）

1. 到 <https://www.goatcounter.com> 免费注册（非商用免费），会得到一个站点代码，如 `zcx.goatcounter.com` 里的 `zcx`；
2. 打开 `assets/js/main.js`，把最底部 `GOATCOUNTER_SITE = ''` 填成你的代码；
3. 提交推送后，在 goatcounter 后台即可看到访问数据。

## 🌗 亮 / 暗色模式

导航栏右侧的 ☀️ / 🌙 按钮切换，偏好会记在浏览器里（localStorage），下次访问自动保持。星空、热力图、评论区的配色都会跟着切换。

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
