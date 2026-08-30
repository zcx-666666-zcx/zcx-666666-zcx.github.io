/* ============================================================
   个人网站 · 交互脚本
   1. 星空背景（闪烁星星 + 流星）  2. 滚动浮现动画
   3. 导航栏状态与移动端菜单       4. 技能条 / 打印 / 年份
   ============================================================ */

/* ---------- 1. 星空背景 ---------- */
(function initStars() {
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars = [];
  let meteors = [];
  let W = 0, H = 0, dpr = 1;

  // 按屏幕大小生成星星，带颜色与闪烁参数
  function createStars() {
    const count = Math.min(220, Math.floor((W * H) / 9000));
    const colors = ['#ffffff', '#cfe2ff', '#ffe3c4', '#d9d4ff'];
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.3 + 0.3,
      base: Math.random() * 0.55 + 0.25,          // 基础亮度
      amp: Math.random() * 0.3,                   // 闪烁幅度
      speed: Math.random() * 0.0016 + 0.0004,     // 闪烁速度
      phase: Math.random() * Math.PI * 2,
      drift: Math.random() * 0.045 + 0.01,        // 缓慢下坠，制造漂浮感
      color: colors[(Math.random() * colors.length) | 0],
    }));
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
    if (reduceMotion) drawStatic();
  }

  // 偶尔生成一颗流星（右上 → 左下）
  function spawnMeteor() {
    meteors.push({
      x: W * (0.35 + Math.random() * 0.65),
      y: H * Math.random() * 0.35,
      len: 90 + Math.random() * 110,
      speed: 7 + Math.random() * 5,
      life: 1,
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      const alpha = Math.max(0.08, s.base + Math.sin(t * s.speed + s.phase) * s.amp);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      s.y += s.drift;
      if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
    }

    // 流星：带渐隐尾迹
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      const grad = ctx.createLinearGradient(
        m.x, m.y, m.x + m.len * 0.7, m.y - m.len * 0.7
      );
      grad.addColorStop(0, `rgba(255,255,255,${0.85 * m.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x + m.len * 0.7, m.y - m.len * 0.7);
      ctx.stroke();

      m.x -= m.speed;
      m.y += m.speed;
      m.life -= 0.016;
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
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !reduceMotion) requestAnimationFrame(draw);
  });

  resize();
  if (!reduceMotion) {
    requestAnimationFrame(draw);
    setInterval(() => { if (!document.hidden && Math.random() < 0.55) spawnMeteor(); }, 7000);
  }
})();

/* ---------- 2. 滚动浮现动画 ---------- */
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

/* ---------- 3. 导航栏：滚动加深背景 + 移动端菜单 ---------- */
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

/* ---------- 4. 技能条：进入视口时填充 ---------- */
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

/* ---------- 5. 简历页“打印 / 导出 PDF”按钮 ---------- */
const printBtn = document.querySelector('.print-btn');
if (printBtn) printBtn.addEventListener('click', () => window.print());

/* ---------- 6. 页脚年份自动更新 ---------- */
const yearEl = document.querySelector('.js-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
