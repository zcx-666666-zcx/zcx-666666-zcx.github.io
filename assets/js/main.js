/* ============================================================
   个人网站 · 交互脚本 v4
   1. 滚动浮现动画
   2. 导航栏 / 打印 / 年份
   3. 亮暗色主题切换（记忆偏好，同步 giscus 评论主题）
   4. GitHub 动态专区（部署时自动生成的数据）
   5. 访问统计（GoatCounter，填入站点代码即启用）
   6. 博客统计：运行天数 / 字数 / 阅读时长 / 标签筛选
   ============================================================ */

/* Lucide 图标：动态插入内容后调用一次即可把 <i data-lucide> 渲染成 SVG */
function refreshIcons() { if (window.lucide) window.lucide.createIcons(); }
const isLightMode = () => document.documentElement.classList.contains('light-mode');

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Java: '#b07219', Python: '#3572A5',
  Vue: '#41b883', C: '#8b949e', 'C++': '#f34b7d', 'C#': '#178600', HTML: '#e34c26',
  CSS: '#563d7c', Svelte: '#ff3e00', Swift: '#F05138', Go: '#00ADD8', Shell: '#89e051',
};
const langColor = (lang) => LANG_COLORS[lang] || '#8b949e';

/* 滚动浮现动画（全局共用一个观察器，动态插入的元素也能复用） */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
function observeReveal(el) { revealObserver.observe(el); }

/* ---------- 1. 滚动浮现动画 ---------- */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  els.forEach((el) => observeReveal(el));
})();

/* ---------- 2. 导航栏：滚动加深 + 移动端菜单 ---------- */
(function initNav() {
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  const toggle = document.querySelector('.nav-toggle');
  if (toggle && nav) {
    const close = (focusToggle = false) => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '打开菜单');
      if (focusToggle) toggle.focus();
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });
    nav.querySelectorAll('.nav-links a').forEach((a) =>
      a.addEventListener('click', () => close())
    );
    // 移动端菜单：ESC 或点空白处收起，避免只能靠再点一次汉堡按钮
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) close(true);
    });
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('open') && !nav.contains(e.target)) close();
    });
  }
})();

/* ---------- 3. 简历页「打印 / 导出 PDF」 ---------- */
const printBtn = document.querySelector('.print-btn');
if (printBtn) printBtn.addEventListener('click', () => window.print());

/* ---------- 4. 页脚年份 ---------- */
const yearEl = document.querySelector('.js-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- 5. 亮暗色主题切换 ---------- */
(function initTheme() {
  const root = document.documentElement;
  const btn = document.querySelector('.theme-toggle');

  // giscus 评论主题跟随站点切换
  function syncGiscus(light) {
    const frame = document.querySelector('iframe.giscus-frame');
    if (!frame) return;
    frame.contentWindow.postMessage(
      { giscus: { type: 'set-theme', theme: light ? 'light' : 'dark' } },
      'https://giscus.app'
    );
  }

  function apply(light) {
    root.classList.toggle('light-mode', light);
    if (btn) btn.setAttribute('aria-label', light ? '切换至暗色模式' : '切换至亮色模式');
    syncGiscus(light);
  }

  let light = false;
  try { light = localStorage.getItem('site-theme') === 'light'; } catch (e) {}
  if (btn) {
    btn.addEventListener('click', () => {
      const next = !root.classList.contains('light-mode');
      try { localStorage.setItem('site-theme', next ? 'light' : 'dark'); } catch (e) {}
      apply(next);
    });
  }
})();

/* ---------- 6. GitHub 动态专区 ---------- */
(function initGitHub() {
  const section = document.getElementById('github');
  if (!section) return;

  async function load() {
    const results = await Promise.allSettled([
      fetch('assets/data/github-profile.json').then((r) => r.json()),
      fetch('assets/data/github-repos.json').then((r) => r.json()),
      fetch('assets/data/github-contributions.json').then((r) => r.json()),
    ]);
    return {
      profile: results[0].status === 'fulfilled' ? results[0].value : null,
      repos: results[1].status === 'fulfilled' ? results[1].value : null,
      contributions: results[2].status === 'fulfilled' ? results[2].value : null,
    };
  }

  let thresholds = [1, 3, 6, 10];
  function levelClass(count) {
    if (count <= thresholds[0]) return ' lv1';
    if (count <= thresholds[1]) return ' lv2';
    if (count <= thresholds[2]) return ' lv3';
    return ' lv4';
  }
  function computeThresholds(collection) {
    const counts = [];
    collection.contributionCalendar.weeks.forEach((w) =>
      w.contributionDays.forEach((d) => { if (d.contributionCount > 0) counts.push(d.contributionCount); })
    );
    if (!counts.length) return;
    counts.sort((a, b) => a - b);
    const q = (p) => counts[Math.min(counts.length - 1, Math.floor(counts.length * p))];
    thresholds = [q(0.25), q(0.5), q(0.75), Infinity];
  }

  // 把贡献日历渲染成热力图（GitHub 同款 7 行列式网格）
  function renderCalendar(container, collection) {
    const weeks = collection.contributionCalendar.weeks;
    const frag = document.createDocumentFragment();
    weeks.forEach((week) => {
      const byWeekday = {};
      week.contributionDays.forEach((d) => { if (d.date) byWeekday[d.weekday] = d; });
      for (let wd = 0; wd < 7; wd++) {
        const cell = document.createElement('i');
        const day = byWeekday[wd];
        if (day) {
          const count = day.contributionCount;
          cell.className = 'gh-cell' + (count > 0 ? levelClass(count) : '');
          cell.title = `${day.date}：${count} 次贡献`;
        }
        frag.appendChild(cell);
      }
    });
    container.innerHTML = '';
    container.appendChild(frag);
  }

  // 仓库渲染成列表行：一行一个，靠排版分栏，不是一格一格的卡片
  function renderRepos(container, repos) {
    const sorted = [...repos]
      .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)))
      .slice(0, 5);
    container.innerHTML = '';
    sorted.forEach((repo) => {
      const a = document.createElement('a');
      a.className = 'repo-row reveal';
      a.href = repo.html_url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `
        <h3>${repo.name}</h3>
        <p>${repo.description || '这个仓库还没有简介。'}</p>
        <div class="repo-meta">
          ${repo.language ? `<span><span class="lang-dot" style="background:${langColor(repo.language)}"></span>${repo.language}</span>` : ''}
          <span class="repo-stars">${repo.stargazers_count} 星标</span>
        </div>`;
      container.appendChild(a);
    });
  }

  load().then(({ profile, repos, contributions }) => {
    const hasAny = profile || repos || contributions;
    const list = section.querySelector('.js-gh-repos-grid');
    if (!hasAny) {
      // 错误状态：说明发生了什么，并留一条能走的路
      if (list) {
        list.innerHTML = '<p class="gh-loading">暂时无法加载 GitHub 数据，可以直接去 <a href="https://github.com/zcx-666666-zcx" target="_blank" rel="noopener">GitHub 主页</a>看看。</p>';
      }
      section.querySelectorAll('.gh-heatmap').forEach((el) => el.remove());
      return;
    }

    // 统计数字
    const set = (sel, val) => { const el = section.querySelector(sel); if (el) el.textContent = val; };
    if (contributions) set('.js-gh-contrib', contributions.totalContributions.toLocaleString());
    if (profile) set('.js-gh-repos', profile.public_repos);
    if (profile) set('.js-gh-followers', profile.followers);
    if (repos) set('.js-gh-stars', repos.reduce((s, r) => s + r.stargazers_count, 0));

    // 热力图
    if (contributions) {
      computeThresholds(contributions);
      const cal = section.querySelector('.js-gh-calendar');
      const totalEl = section.querySelector('.js-gh-total');
      if (cal) { renderCalendar(cal, contributions); cal.classList.remove('is-loading'); }
      if (totalEl) totalEl.textContent = `${contributions.totalContributions.toLocaleString()} 次贡献 · 过去一年`;
    } else {
      section.querySelectorAll('.gh-heatmap').forEach((el) => el.remove());
    }

    // 开源区：给每一行补上 star 数与最近更新时间（介绍文案是手写的，这两个数字跟着数据走）
    if (repos) {
      document.querySelectorAll('.oss-row[data-repo]').forEach((row) => {
        const slot = row.querySelector('.js-oss-stat');
        if (!slot) return;
        const name = row.dataset.repo.toLowerCase();
        const repo = repos.find((r) => r.name.toLowerCase() === name);
        if (!repo) { slot.textContent = ''; return; }
        const parts = [];
        if (repo.stargazers_count > 0) parts.push(`${repo.stargazers_count} star`);
        if (repo.pushed_at) parts.push(`${repo.pushed_at.slice(0, 7).replace('-', '.')} 更新`);
        slot.textContent = parts.join(' · ');
      });
    }

    // 仓库列表
    if (repos && repos.length) {
      if (list) {
        renderRepos(list, repos);
        list.querySelectorAll('.reveal').forEach((el) => observeReveal(el));
        refreshIcons();
      }
    } else if (list) {
      // 空状态：说清楚这里为什么是空的
      list.innerHTML = '<p class="gh-loading">这个账号下还没有公开仓库。</p>';
    }
    section.querySelectorAll('.gh-loading').forEach((el) => el.remove());
  });
})();

/* ---------- 7. 访问统计（GoatCounter） ----------
   ✏️ 到 https://www.goatcounter.com 免费注册后，
   把分配的站点代码填到下面（例如 'zcx' 代表 zcx.goatcounter.com），保存即生效。 */
const GOATCOUNTER_SITE = '';
if (GOATCOUNTER_SITE) {
  const gc = document.createElement('script');
  gc.async = true;
  gc.setAttribute('data-goatcounter', `https://${GOATCOUNTER_SITE}.goatcounter.com/count`);
  gc.src = 'https://gc.zgo.at/count.js';
  document.body.appendChild(gc);
}

/* ---------- 8. 博客统计：运行天数 / 字数 / 阅读时长 / 标签筛选 ---------- */
const SITE_LAUNCH = '2026-08-30';   // 🚀 网站上线日期（运行天数从这天起算）
const READ_SPEED = 400;             // 阅读速度（中文字 / 分钟）

function daysSinceLaunch() {
  const launch = new Date(SITE_LAUNCH + 'T00:00:00');
  return Math.max(1, Math.floor((Date.now() - launch.getTime()) / 86400000) + 1);
}

// 页脚运行天数（全站）
(function initRunDays() {
  document.querySelectorAll('.js-run-days').forEach((el) => { el.textContent = daysSinceLaunch(); });
})();

// 文章页：本页字数 + 预计阅读时长
(function initPostMeta() {
  const content = document.querySelector('.post-content');
  if (!content) return;
  const chars = content.textContent.replace(/\s/g, '').length;
  const minutes = Math.max(1, Math.round(chars / READ_SPEED));
  document.querySelectorAll('.js-post-chars').forEach((el) => { el.textContent = `${chars.toLocaleString()} 字`; });
  document.querySelectorAll('.js-reading-time').forEach((el) => { el.textContent = `约 ${minutes} 分钟`; });
})();

// 博客页：统计条 + 标签筛选 + 列表行内字数
(function initBlogPage() {
  const statsBar = document.querySelector('.js-site-stats');
  if (statsBar) {
    const fill = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };
    fill('.js-stat-days', daysSinceLaunch());
    fetch('assets/data/site-stats.json')
      .then((r) => r.json())
      .then((s) => {
        fill('.js-stat-posts', s.posts);
        fill('.js-stat-words', s.totalChars.toLocaleString());
        // 一篇文章都还没有时，「篇文章 / 总字数」只是两个零，留着反而显得站点空荡
        if (!s.posts) {
          document.querySelectorAll('.js-stat-posts, .js-stat-words').forEach((el) => {
            const item = el.closest('.stat-item');
            if (item) item.hidden = true;
          });
        }
        // 每篇文章的字数与阅读时长（数据键为站点绝对路径）
        document.querySelectorAll('.blog-list .post-row[href]').forEach((row) => {
          const path = new URL(row.getAttribute('href'), location.href).pathname;
          const chars = s.perPost && s.perPost[path];
          const el = row.querySelector('.js-row-chars');
          if (el && chars) el.textContent = `${chars} 字 · 约 ${Math.max(1, Math.round(chars / READ_SPEED))} 分钟`;
        });
      })
      .catch(() => { /* 数据缺失时保持占位 */ });
  }

  // 标签筛选：根据行的 data-tags 生成筛选按钮
  const filterBar = document.querySelector('.js-tag-filter');
  const rows = document.querySelectorAll('.blog-list .post-row');
  if (!filterBar || !rows.length) return;
  const countBy = {};
  rows.forEach((row) => {
    (row.dataset.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
      .forEach((t) => { countBy[t] = (countBy[t] || 0) + 1; });
  });
  const tags = Object.keys(countBy);
  if (!tags.length) return;

  function makePill(label, tag, count) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tag-pill' + (tag ? '' : ' active');
    b.dataset.tag = tag;
    b.textContent = tag ? `${label} · ${count}` : `全部 · ${rows.length}`;
    b.addEventListener('click', () => {
      filterBar.querySelectorAll('.tag-pill').forEach((p) => p.classList.remove('active'));
      b.classList.add('active');
      rows.forEach((row) => {
        const rowTags = (row.dataset.tags || '').split(',').map((t) => t.trim());
        row.style.display = (!tag || rowTags.includes(tag)) ? '' : 'none';
      });
    });
    return b;
  }

  filterBar.appendChild(makePill('全部', '', rows.length));
  tags.sort().forEach((t) => filterBar.appendChild(makePill(t, t, countBy[t])));

  // 点击文章行内的标签小胶囊 = 按该标签筛选
  document.querySelectorAll('.blog-list .row-tags span').forEach((span) => {
    span.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const pill = [...filterBar.querySelectorAll('.tag-pill')].find((p) => p.dataset.tag === span.textContent);
      if (pill) pill.click();
      filterBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();

/* ---------- 9. 不蒜子访问量（浏览量 / 访客数） ----------
   该服务经常不稳定，所以先隐藏这两个数字，确认服务真的写回了数字再显示；
   拿不到就整项移除，避免页面长期挂着「…」占位。 */
(function initBusuanzi() {
  const items = document.querySelectorAll('.busuanzi-need');
  if (!items.length) return;

  // 先用 display: none 移出渲染树，拿到数字再放回来。
  // 用 visibility: hidden 会让这些文字「存在但不可见」，读屏与审计工具都会当成隐藏内容。
  items.forEach((el) => { el.style.display = 'none'; });
  const hideAll = () => items.forEach((el) => { el.style.display = 'none'; });
  const reveal = () => {
    const pv = document.getElementById('busuanzi_value_site_pv');
    const uv = document.getElementById('busuanzi_value_site_uv');
    const ok = (pv && /\d/.test(pv.textContent)) || (uv && /\d/.test(uv.textContent));
    if (ok) items.forEach((el) => { el.style.display = ''; });
    return ok;
  };

  const bz = document.createElement('script');
  bz.async = true;
  bz.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
  bz.addEventListener('error', hideAll);
  document.body.appendChild(bz);

  // 服务脚本加载成功不代表取数成功，轮询 6 秒仍无数字就撤掉
  let tries = 0;
  const timer = setInterval(() => {
    if (reveal()) { clearInterval(timer); return; }
    if (++tries > 15) { clearInterval(timer); hideAll(); }
  }, 400);
})();

/* 首次渲染图标；若 lucide 脚本晚到，在窗口加载完成后再补刷一次 */
refreshIcons();
window.addEventListener('load', refreshIcons);
