/* ============================================================
   个人网站 · 交互脚本 v2
   1. 深空背景（三层视差星空 + 流星 + 极光 + 胶片颗粒）
   2. 自定义鼠标（圆点 + 缓动光环）
   3. 卡片聚光灯与微倾斜
   4. 滚动浮现动画
   5. 导航栏 / 技能条 / 打印 / 年份
   6. GitHub 动态专区（读取部署时生成的 JSON 数据）
   ============================================================ */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(pointer: fine)').matches;

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

  // 三层景深：越近的星星越大、视差越明显
  const LAYERS = [
    { ratio: 0.5,  rMax: 0.9,  parallax: 0.012, driftMax: 0.012 },
    { ratio: 0.32, rMax: 1.4,  parallax: 0.03,  driftMax: 0.03  },
    { ratio: 0.18, rMax: 2.1,  parallax: 0.06,  driftMax: 0.055 },
  ];
  const COLORS = ['#ffffff', '#cfe2ff', '#ffe3c4', '#d9d4ff', '#aee6ff'];

  function createStars() {
    const count = Math.min(260, Math.floor((W * H) / 7500));
    stars = [];
    let start = 0;
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
          color: COLORS[(Math.random() * COLORS.length) | 0],
          sparkle: layer.rMax > 1.8 && Math.random() < 0.3,
        });
      }
      start += n;
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

  function drawStar(s, t, scroll) {
    // 鼠标 + 滚动双重视差
    const px = (easeX - W / 2) * s.parallax;
    const py = (easeY - H / 2) * s.parallax;
    let x = (s.x + px) % W;
    let y = (s.y + py - scroll * s.parallax * 4) % H;
    if (x < 0) x += W;
    if (y < 0) y += H;

    const alpha = Math.max(0.08, s.base + Math.sin(t * s.speed + s.phase) * s.amp);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fill();

    // 亮星画十字光芒
    if (s.sparkle) {
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = s.color;
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
    easeX += (mouseX - easeX) * 0.05;
    easeY += (mouseY - easeY) * 0.05;

    for (const s of stars) {
      drawStar(s, t, scroll);
      s.y += s.drift;
      if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
    }

    // 流星：带渐隐尾迹
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      const grad = ctx.createLinearGradient(m.x, m.y, m.x + m.len * 0.7, m.y - m.len * 0.7);
      grad.addColorStop(0, `rgba(255,255,255,${0.9 * m.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
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
      ctx.fillStyle = '#fff';
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
      ctx.fillStyle = s.color;
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
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));
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

/* ---------- 9. GitHub 动态专区 ---------- */
(function initGitHub() {
  const section = document.getElementById('github');
  if (!section) return;

  const LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Java: '#b07219', Python: '#3572A5',
    Vue: '#41b883', C: '#555555', 'C++': '#f34b7d', 'C#': '#178600', HTML: '#e34c26',
    CSS: '#563d7c', Svelte: '#ff3e00', Swift: '#F05138', Go: '#00ADD8', Shell: '#89e051',
  };
  const langColor = (lang) => LANG_COLORS[lang] || '#8b949e';

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
          cell.className = 'gh-cell' + (count > 0 ? levelClass(count, collection) : '');
          cell.title = `${day.date}：${count} 次贡献`;
        }
        frag.appendChild(cell);
      }
    });
    container.innerHTML = '';
    container.appendChild(frag);
  }

  let thresholds = [1, 3, 6, 10];
  function levelClass(count, collection) {
    const t = thresholds;
    if (count <= t[0]) return ' lv1';
    if (count <= t[1]) return ' lv2';
    if (count <= t[2]) return ' lv3';
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

  function renderRepos(container, repos) {
    const sorted = [...repos]
      .filter((r) => !r.fork || true) // fork 也展示，但排后面
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
    if (profile) {
      const set = (sel, val) => { const el = section.querySelector(sel); if (el) el.textContent = val; };
      if (contributions) set('.js-gh-contrib', contributions.totalContributions.toLocaleString());
      set('.js-gh-repos', profile.public_repos);
      set('.js-gh-followers', profile.followers);
      if (repos) set('.js-gh-stars', repos.reduce((s, r) => s + r.stargazers_count, 0));
    }

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
        grid.querySelectorAll('.reveal').forEach((el) => io2.observe(el));
      }
    }
    section.querySelectorAll('.gh-loading').forEach((el) => el.remove());
  });

  // 复用滚动浮现动画观察动态插入的仓库卡片
  const io2 = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io2.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
})();
