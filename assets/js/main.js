/* ============================================================
   个人网站 · 交互脚本 v3
   1. 深空背景（三层视差星空 + 流星 + 极光 + 胶片颗粒，亮暗色自适应）
   2. 自定义鼠标（圆点 + 缓动光环）
   3. 卡片聚光灯与微倾斜
   4. 滚动浮现动画
   5. 导航栏 / 技能条 / 打印 / 年份
   6. 亮暗色主题切换（记忆偏好，同步 giscus 评论主题）
   7. GitHub 动态专区（部署时自动生成的数据）
   8. 作品页自动化（从 GitHub 数据渲染，精选文案合并）
   9. 访问统计（GoatCounter，填入站点代码即启用）
   ============================================================ */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Lucide 图标：动态插入内容后调用一次即可把 <i data-lucide> 渲染成 SVG */
function refreshIcons() { if (window.lucide) window.lucide.createIcons(); }
const FINE_POINTER = window.matchMedia('(pointer: fine)').matches;
const isLightMode = () => document.documentElement.classList.contains('light-mode');

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Java: '#b07219', Python: '#3572A5',
  Vue: '#41b883', C: '#555555', 'C++': '#f34b7d', 'C#': '#178600', HTML: '#e34c26',
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

/* ---------- 1. 深空背景 ---------- */
(function initBackground() {
  // 注入极光光斑与胶片颗粒
  const auroraWrap = document.createElement('div');
  auroraWrap.setAttribute('aria-hidden', 'true');
  ['aurora-1', 'aurora-2', 'aurora-3'].forEach((cls) => {
    const a = document.createElement('div');
    a.className = `aurora ${cls}`;
    auroraWrap.appendChild(a);
  });
  document.body.prepend(auroraWrap);
  const grain = document.createElement('div');
  grain.className = 'grain';
  grain.setAttribute('aria-hidden', 'true');
  document.body.prepend(grain);

  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let stars = [];
  let meteors = [];
  let W = 0, H = 0, dpr = 1;
  // 鼠标视差的缓动值
  let mouseX = 0, mouseY = 0, easeX = 0, easeY = 0;

  // 亮暗两套星色（暗色亮星，亮色深蓝暗星）
  const STAR_COLORS = {
    dark: ['#ffffff', '#cfe2ff', '#ffe3c4', '#d9d4ff', '#aee6ff'],
    light: ['#7d97c9', '#6a85bd', '#8f9ed0', '#5f7ab5', '#9db3dd'],
  };

  // 三层景深：越近的星星越大、视差越明显
  const LAYERS = [
    { ratio: 0.5,  rMax: 0.9,  parallax: 0.012, driftMax: 0.012 },
    { ratio: 0.32, rMax: 1.4,  parallax: 0.03,  driftMax: 0.03  },
    { ratio: 0.18, rMax: 2.1,  parallax: 0.06,  driftMax: 0.055 },
  ];

  function createStars() {
    const count = Math.min(260, Math.floor((W * H) / 7500));
    stars = [];
    for (const layer of LAYERS) {
      const n = Math.floor(count * layer.ratio);
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * layer.rMax + 0.25,
          base: Math.random() * 0.5 + 0.3,
          amp: Math.random() * 0.32,
          speed: Math.random() * 0.0016 + 0.0004,
          phase: Math.random() * Math.PI * 2,
          drift: Math.random() * layer.driftMax + 0.008,
          parallax: layer.parallax,
          ci: (Math.random() * STAR_COLORS.dark.length) | 0,
          sparkle: layer.rMax > 1.8 && Math.random() < 0.3,
        });
      }
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createStars();
    if (REDUCED_MOTION) drawStatic();
  }

  function spawnMeteor() {
    meteors.push({
      x: W * (0.3 + Math.random() * 0.7),
      y: H * Math.random() * 0.4,
      len: 110 + Math.random() * 130,
      speed: 7 + Math.random() * 6,
      life: 1,
    });
  }

  function drawStar(s, t, scroll, light) {
    // 鼠标 + 滚动双重视差
    const px = (easeX - W / 2) * s.parallax;
    const py = (easeY - H / 2) * s.parallax;
    let x = (s.x + px) % W;
    let y = (s.y + py - scroll * s.parallax * 4) % H;
    if (x < 0) x += W;
    if (y < 0) y += H;

    let alpha = Math.max(0.08, s.base + Math.sin(t * s.speed + s.phase) * s.amp);
    if (light) alpha *= 0.4;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = (light ? STAR_COLORS.light : STAR_COLORS.dark)[s.ci];
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fill();

    // 亮星画十字光芒
    if (s.sparkle) {
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.6;
      const len = s.r * 4.5;
      ctx.beginPath();
      ctx.moveTo(x - len, y); ctx.lineTo(x + len, y);
      ctx.moveTo(x, y - len); ctx.lineTo(x, y + len);
      ctx.stroke();
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const scroll = window.scrollY || 0;
    const light = isLightMode();
    easeX += (mouseX - easeX) * 0.05;
    easeY += (mouseY - easeY) * 0.05;

    for (const s of stars) {
      drawStar(s, t, scroll, light);
      s.y += s.drift;
      if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
    }

    // 流星：带渐隐尾迹
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      const head = light ? '70,110,220' : '255,255,255';
      const grad = ctx.createLinearGradient(m.x, m.y, m.x + m.len * 0.7, m.y - m.len * 0.7);
      grad.addColorStop(0, `rgba(${head},${0.9 * m.life})`);
      grad.addColorStop(1, `rgba(${head},0)`);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x + m.len * 0.7, m.y - m.len * 0.7);
      ctx.stroke();
      // 亮头
      ctx.globalAlpha = m.life;
      ctx.fillStyle = light ? 'rgb(70,110,220)' : '#fff';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
      ctx.fill();

      m.x -= m.speed;
      m.y += m.speed;
      m.life -= 0.014;
      if (m.life <= 0 || m.x < -m.len || m.y > H + m.len) meteors.splice(i, 1);
    }

    ctx.globalAlpha = 1;
    if (!document.hidden) requestAnimationFrame(draw);
  }

  // 减少动态效果时只画一帧静态星空
  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      ctx.globalAlpha = s.base;
      ctx.fillStyle = (isLightMode() ? STAR_COLORS.light : STAR_COLORS.dark)[s.ci];
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !REDUCED_MOTION) requestAnimationFrame(draw);
  });

  resize();
  if (!REDUCED_MOTION) {
    requestAnimationFrame(draw);
    // 同时最多两颗流星，避免画面过闹
    setInterval(() => {
      if (!document.hidden && meteors.length < 2 && Math.random() < 0.6) spawnMeteor();
    }, 6500);
    setTimeout(spawnMeteor, 1800);
  }
})();

/* ---------- 2. 自定义鼠标 ---------- */
(function initCursor() {
  if (!FINE_POINTER || REDUCED_MOTION) return;
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);
  document.documentElement.classList.add('custom-cursor');

  let mx = -100, my = -100, rx = -100, ry = -100;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  }, { passive: true });

  (function follow() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(follow);
  })();

  const HOVERABLE = 'a, button, .card, input, textarea, [data-cursor]';
  document.addEventListener('mouseover', (e) => {
    ring.classList.toggle('hovering', !!(e.target.closest && e.target.closest(HOVERABLE)));
  });
  document.addEventListener('mousedown', () => ring.classList.add('pressed'));
  document.addEventListener('mouseup', () => ring.classList.remove('pressed'));
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
})();

/* ---------- 3. 卡片聚光灯 + 作品卡微倾斜 ---------- */
(function initCardGlow() {
  if (!FINE_POINTER) return;
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  });

  if (REDUCED_MOTION) return;
  document.querySelectorAll('.work-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-6px) perspective(900px) rotateX(${(-dy * 4).toFixed(2)}deg) rotateY(${(dx * 4).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ---------- 4. 滚动浮现动画 ---------- */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  els.forEach((el) => observeReveal(el));
})();

/* ---------- 5. 导航栏：滚动加深 + 移动端菜单 ---------- */
(function initNav() {
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  const toggle = document.querySelector('.nav-toggle');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('.nav-links a').forEach((a) =>
      a.addEventListener('click', () => nav.classList.remove('open'))
    );
  }
})();

/* ---------- 6. 技能条 ---------- */
(function initSkills() {
  const skills = document.querySelectorAll('.skill');
  if (!skills.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  skills.forEach((el) => io.observe(el));
})();

/* ---------- 7. 简历页「打印 / 导出 PDF」 ---------- */
const printBtn = document.querySelector('.print-btn');
if (printBtn) printBtn.addEventListener('click', () => window.print());

/* ---------- 8. 页脚年份 ---------- */
const yearEl = document.querySelector('.js-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- 9. 亮暗色主题切换 ---------- */
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
    syncGiscus(light);
  }

  const light = localStorage.getItem('site-theme') === 'light';
  if (btn) {
    btn.addEventListener('click', () => {
      const next = !root.classList.contains('light-mode');
      try { localStorage.setItem('site-theme', next ? 'light' : 'dark'); } catch (e) {}
      apply(next);
    });
  }
})();

/* ---------- 10. GitHub 动态专区 ---------- */
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

  function renderRepos(container, repos) {
    const sorted = [...repos]
      .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)))
      .slice(0, 6);
    container.innerHTML = '';
    sorted.forEach((repo, i) => {
      const a = document.createElement('a');
      a.className = 'card work-card reveal';
      a.href = repo.html_url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.style.transitionDelay = `${i * 0.07}s`;
      a.innerHTML = `
        <div class="work-body" style="padding-top:24px">
          <h3>${repo.name}</h3>
          <p>${repo.description || '这个仓库还没有简介。'}</p>
          <div class="work-meta">
            ${repo.language ? `<span><i class="lang-dot" style="background:${langColor(repo.language)}"></i> ${repo.language}</span>` : ''}
            <span>⭐ ${repo.stargazers_count}</span>
          </div>
        </div>`;
      container.appendChild(a);
    });
  }

  load().then(({ profile, repos, contributions }) => {
    const hasAny = profile || repos || contributions;
    if (!hasAny) {
      section.querySelectorAll('.gh-loading').forEach((el) => { el.textContent = '暂时无法加载 GitHub 数据。'; });
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
      if (cal) renderCalendar(cal, contributions);
      if (totalEl) totalEl.textContent = `${contributions.totalContributions.toLocaleString()} 次贡献 · 过去一年`;
    } else {
      section.querySelectorAll('.gh-heatmap').forEach((el) => el.remove());
    }

    // 仓库卡片
    if (repos && repos.length) {
      const grid = section.querySelector('.js-gh-repos-grid');
      if (grid) {
        renderRepos(grid, repos);
        grid.querySelectorAll('.reveal').forEach((el) => observeReveal(el));
        refreshIcons();
      }
    }
    section.querySelectorAll('.gh-loading').forEach((el) => el.remove());
  });
})();

/* ---------- 11. 作品页自动化：从 GitHub 数据渲染 ---------- */
(function initWorksPage() {
  const grid = document.querySelector('.js-works-grid');
  if (!grid) return;

  // 精选文案：仓库名 → 封面与描述（新仓库没匹配到时自动生成兜底文案）
  const CURATED = {
    'WALL-E': { icon: 'bot', cover: 'cover-1', desc: '智能适老陪伴机器人的项目代码：AI 语音交互、视频通话与环境监测，获中国大学生计算机设计大赛河南省级赛二等奖。' },
    'learning_helper': { icon: 'book-open', cover: 'cover-5', desc: '智能学习助手的后端服务，从接口设计到业务逻辑的完整实现，探索 AI 辅助学习。' },
    'chuanzhibei': { icon: 'trophy', cover: 'cover-3', desc: '第八届传智杯全国总决赛二等奖作品，从 idea 到提交的完整实战经历。' },
    'videodna_demo': { icon: 'clapperboard', cover: 'cover-4', desc: '基于阿里云能力的视频 DNA 检测与智能标签示例，感受云端 AI 服务的调用流程。' },
    'ZZULI.dev': { icon: 'graduation-cap', cover: 'cover-6', desc: '收集 ZZULI 开发者校友信息的开源计划，看看大家都在做什么。我参与其中。' },
    'social-auto-upload': { icon: 'satellite-dish', cover: 'cover-2', desc: '一键把视频图文分发到抖音、小红书、B 站、YouTube 等平台的自动化工具。' },
  };
  const COVERS = ['cover-1', 'cover-2', 'cover-3', 'cover-4', 'cover-5', 'cover-6'];
  const FALLBACK_ICONS = ['sparkles', 'wrench', 'package', 'globe', 'terminal', 'flask-conical'];

  fetch('assets/data/github-repos.json')
    .then((r) => r.json())
    .then((repos) => {
      if (!Array.isArray(repos) || !repos.length) return;
      const sorted = [...repos]
        .filter((r) => r.name !== 'zcx-666666-zcx.github.io')   // 本站自己的部署仓库不上作品集
        .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)));
      if (!sorted.length) return;

      grid.innerHTML = '';
      sorted.forEach((repo, i) => {
        const cur = CURATED[repo.name] || {};
        const a = document.createElement('a');
        a.className = 'card work-card reveal';
        a.href = repo.html_url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.style.transitionDelay = `${(i % 6) * 0.06}s`;
        const icon = cur.icon || FALLBACK_ICONS[i % FALLBACK_ICONS.length];
        const cover = cur.cover || COVERS[i % COVERS.length];
        const desc = cur.desc || repo.description || '这个仓库还没有简介，欢迎去 GitHub 看看代码。';
        a.innerHTML = `
          <div class="work-cover ${cover}"><i data-lucide="${icon}" aria-hidden="true"></i></div>
          <div class="work-body">
            <h3>${repo.name}${repo.fork ? ' <span class="fork-badge">开源共建</span>' : ''}</h3>
            <p>${desc}</p>
            <div class="work-meta">
              ${repo.language ? `<span><i class="lang-dot" style="background:${langColor(repo.language)}"></i> ${repo.language}</span>` : ''}
              ${repo.stargazers_count ? `<span class="work-star">⭐ ${repo.stargazers_count}</span>` : ''}
            </div>
          </div>`;
        grid.appendChild(a);
      });
      grid.querySelectorAll('.reveal').forEach((el) => observeReveal(el));
      refreshIcons();
    })
    .catch(() => { /* 拉取失败时保留页面里的静态卡片 */ });
})();

/* ---------- 12. 访问统计（GoatCounter） ----------
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

/* ---------- 13. 博客统计：运行天数 / 字数 / 阅读时长 / 标签筛选 ---------- */
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

/* ---------- 14. 不蒜子访问量（浏览量 / 访客数） ----------
   与 vow0328 等博客同款的免费计数服务；加载失败时自动隐藏数字，不影响页面。 */
(function initBusuanzi() {
  if (!document.querySelector('.busuanzi-need')) return;
  const bz = document.createElement('script');
  bz.async = true;
  bz.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
  bz.addEventListener('error', hideBusuanzi);
  document.body.appendChild(bz);
  function hideBusuanzi() {
    document.querySelectorAll('.busuanzi-need').forEach((el) => { el.style.display = 'none'; });
  }
  // 8 秒后仍无数据则优雅隐藏
  setTimeout(() => {
    const pv = document.getElementById('busuanzi_value_site_pv');
    const ppv = document.getElementById('busuanzi_value_page_pv');
    const target = pv || ppv;
    if (target && !/\d/.test(target.textContent)) hideBusuanzi();
  }, 8000);
})();

/* 首次渲染图标 */
refreshIcons();
