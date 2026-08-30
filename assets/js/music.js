/* ============================================================
   个人网站 · 碟片音乐播放器（全站右下角）

   ✏️ 怎么换成自己喜欢的歌：
   1. 把 mp3 / wav / ogg 文件放进 assets/music/ 文件夹
   2. 修改下面的 playlist：标题、歌手、文件名一一对应
   3. 保存刷新即可，播放器会自动按列表顺序循环播放

   想在某一页关掉播放器：删掉那一页里的 music.js 引用即可
   ============================================================ */

const MUSIC_CONFIG = {
  // autoplay: 打开面板时是否自动开始播放
  autoplay: true,
  playlist: [
    { title: '星尘咏叹', artist: '内置示例曲', src: 'assets/music/stardust-aria.wav' },
    { title: '月面漫步', artist: '内置示例曲', src: 'assets/music/moonwalk.wav' },
    { title: '轨道漫游', artist: '内置示例曲', src: 'assets/music/orbit-drift.wav' },
  ],
};

(function initMusicPlayer() {
  if (!MUSIC_CONFIG.playlist.length) return;

  // 相对路径统一解析到站点根目录，保证在 posts/ 等子目录页面也能播放
  const MUSIC_ROOT = (document.currentScript && document.currentScript.src)
    ? new URL('../../', document.currentScript.src)
    : new URL('./', location.href);
  const resolveSrc = (src) =>
    (/^(https?:|data:|\/)/.test(src) ? src : new URL(src, MUSIC_ROOT).href);

  const player = document.createElement('div');
  player.className = 'music-player';
  player.setAttribute('aria-label', '背景音乐播放器');

  const panel = document.createElement('div');
  panel.className = 'music-panel';

  const disc = document.createElement('button');
  disc.className = 'music-disc';
  disc.type = 'button';
  disc.setAttribute('aria-label', '播放音乐');
  disc.innerHTML = '<span class="music-vinyl"></span>';

  // 播放时飘出的音符与悬停提示
  const note1 = document.createElement('span');
  note1.className = 'music-note';
  note1.textContent = '♪';
  note1.setAttribute('aria-hidden', 'true');
  const note2 = document.createElement('span');
  note2.className = 'music-note';
  note2.textContent = '♫';
  note2.setAttribute('aria-hidden', 'true');
  const hint = document.createElement('span');
  hint.className = 'music-hint';
  hint.textContent = '♪ 听点音乐';

  player.append(panel, note1, note2, hint, disc);
  document.body.appendChild(player);

  /* ---------- 面板结构 ---------- */
  panel.innerHTML = `
    <div class="music-panel-head">
      <h4>♪ 随手听的</h4>
      <button class="music-close" type="button" aria-label="收起播放器">✕</button>
    </div>
    <div class="music-now">
      <span class="music-eq" aria-hidden="true"><i></i><i></i><i></i></span>
      <div class="music-now-info">
        <strong class="js-music-title">—</strong>
        <span class="js-music-artist"></span>
      </div>
    </div>
    <div class="music-progress"><i class="js-music-fill"></i></div>
    <div class="music-time">
      <span class="js-music-cur">0:00</span>
      <span class="js-music-total">0:00</span>
    </div>
    <div class="music-controls">
      <button class="music-ctrl js-music-prev" type="button" aria-label="上一首">⏮</button>
      <button class="music-ctrl main js-music-toggle" type="button" aria-label="播放 / 暂停">▶</button>
      <button class="music-ctrl js-music-next" type="button" aria-label="下一首">⏭</button>
    </div>
    <div class="music-list js-music-list"></div>
    <p class="music-tip">✏️ 想换成自己喜欢的歌？把音乐文件放进 <b>assets/music/</b>，再编辑 <b>assets/js/music.js</b> 顶部的播放列表。</p>
  `;

  const $ = (sel) => player.querySelector(sel);
  const titleEl = $('.js-music-title');
  const artistEl = $('.js-music-artist');
  const fillEl = $('.js-music-fill');
  const curEl = $('.js-music-cur');
  const totalEl = $('.js-music-total');
  const toggleBtn = $('.js-music-toggle');
  const listEl = $('.js-music-list');

  /* ---------- 播放列表 ---------- */
  const list = MUSIC_CONFIG.playlist.map((t, i) => ({ ...t, index: i }));
  list.forEach((track) => {
    const btn = document.createElement('button');
    btn.className = 'music-track';
    btn.type = 'button';
    btn.innerHTML = `<span class="no">${track.index + 1}</span><span class="t">${track.title}<small style="opacity:.55"> · ${track.artist}</small></span>`;
    btn.addEventListener('click', () => {
      play(track.index);
      if (!player.classList.contains('playing')) toggle();
    });
    track.el = btn;
    listEl.appendChild(btn);
  });

  /* ---------- 播放逻辑 ---------- */
  const audio = new Audio();
  audio.preload = 'none';
  let current = 0;

  function fmt(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function reflectTrack() {
    const t = list[current];
    titleEl.textContent = t.title;
    artistEl.textContent = t.artist;
    list.forEach((item) => item.el.classList.toggle('active', item.index === current));
  }

  function play(index) {
    current = (index + list.length) % list.length;
    const t = list[current];
    audio.src = resolveSrc(t.src);
    audio.play().catch(() => {
      // 文件缺失或格式不支持时给出提示
      titleEl.textContent = `${t.title}（加载失败）`;
      artistEl.textContent = '检查 assets/music/ 里的文件名是否对应';
    });
    reflectTrack();
  }

  function toggle() {
    if (!audio.src) {
      play(0);
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  audio.addEventListener('play', () => {
    player.classList.add('playing');
    toggleBtn.textContent = '⏸';
  });
  audio.addEventListener('pause', () => {
    player.classList.remove('playing');
    toggleBtn.textContent = '▶';
  });
  audio.addEventListener('ended', () => play(current + 1));
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) fillEl.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    curEl.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('loadedmetadata', () => { totalEl.textContent = fmt(audio.duration); });

  /* ---------- 交互 ---------- */
  function openPanel() {
    player.classList.add('open');
    if (MUSIC_CONFIG.autoplay && !audio.src) play(0);
  }
  disc.addEventListener('click', () => {
    if (!player.classList.contains('open')) {
      openPanel();
      if (MUSIC_CONFIG.autoplay && audio.paused) toggle();
    } else {
      toggle();
    }
  });
  $('.music-close').addEventListener('click', () => player.classList.remove('open'));
  toggleBtn.addEventListener('click', toggle);
  $('.js-music-prev').addEventListener('click', () => play(current - 1));
  $('.js-music-next').addEventListener('click', () => play(current + 1));

  // 点击面板与碟片以外的区域收起
  document.addEventListener('click', (e) => {
    if (player.classList.contains('open') && !player.contains(e.target)) {
      player.classList.remove('open');
    }
  });

  reflectTrack();
})();
