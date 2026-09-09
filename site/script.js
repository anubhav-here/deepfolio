const $ = (selector) => document.querySelector(selector);

function runPreloader() {
  const loader = $('.preloader');
  const number = $('#load-number');
  if (!loader || !number) return;
  const started = performance.now();
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1050;
  const tick = (now) => {
    const progress = Math.min(1, (now - started) / duration);
    number.textContent = String(Math.round(progress * 100)).padStart(3, '0');
    if (progress < 1) requestAnimationFrame(tick);
    else setTimeout(() => loader.classList.add('done'), 120);
  };
  requestAnimationFrame(tick);
}

function runGlobe() {
  const canvas = $('#globe');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let ratio = 1;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize() {
    ratio = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function draw(time = 0) {
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width, height) * .265;
    const x = width / 2;
    const y = height * .48;
    ctx.save();
    ctx.strokeStyle = 'rgba(241,240,235,.26)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, radius * .73, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(241,240,235,.09)';
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius - .5, 0, Math.PI * 2);
    ctx.clip();
    const turn = time * .00018;
    [-.66, -.33, 0, .33, .66].forEach((offset) => {
      ctx.beginPath();
      ctx.ellipse(x, y + offset * radius, radius * Math.sqrt(1 - offset * offset), radius * .16, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(241,240,235,.1)';
      ctx.stroke();
    });
    for (let index = 0; index < 7; index += 1) {
      const phase = turn + index * Math.PI / 7;
      ctx.beginPath();
      for (let step = 0; step <= 80; step += 1) {
        const latitude = -Math.PI / 2 + step / 80 * Math.PI;
        const gx = x + Math.sin(phase) * Math.cos(latitude) * radius;
        const gy = y + Math.sin(latitude) * radius;
        if (step === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
      }
      ctx.strokeStyle = 'rgba(241,240,235,.1)';
      ctx.stroke();
    }
    ctx.restore();
    const ny = { x: x - radius * .43, y: y - radius * .2 };
    const india = { x: x + radius * .5, y: y + radius * .22 };
    ctx.beginPath();
    ctx.setLineDash([5, 8]);
    ctx.lineDashOffset = -time * .016;
    ctx.moveTo(ny.x, ny.y);
    ctx.quadraticCurveTo(x, y - radius * .8, india.x, india.y);
    ctx.strokeStyle = 'rgba(219,30,25,.88)';
    ctx.stroke();
    ctx.setLineDash([]);
    [ny, india].forEach((point, index) => {
      const pulse = 1 + Math.sin(time * .003 + index) * .22;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3.2 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#db1e19';
      ctx.fill();
    });
    ctx.restore();
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  resize();
  addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(draw);
}

function normalRandom() {
  const u = Math.max(Math.random(), Number.EPSILON);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

function runSimulation() {
  const canvas = $('#monte-carlo');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let paths = [];
  let started = performance.now();
  let width = 0;
  let height = 0;
  function makePaths() {
    const steps = width < 640 ? 88 : 150;
    paths = Array.from({ length: 42 }, () => {
      const values = [1];
      for (let step = 1; step < steps; step += 1) {
        const previous = values[step - 1];
        values.push(previous * Math.exp((.18 - .5 * .28 * .28) / steps + .28 / Math.sqrt(steps) * normalRandom()));
      }
      return values;
    }).sort((left, right) => left.at(-1) - right.at(-1));
    const highlight = paths.findLast((path) => path.at(-1) > 1.1) || paths.at(-1);
    paths = paths.filter((path) => path !== highlight);
    paths.push(highlight);
    started = performance.now();
  }
  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    makePaths();
  }
  function draw(now) {
    ctx.clearRect(0, 0, width, height);
    const amount = Math.min(1, (now - started) / 2600);
    const visible = Math.max(2, Math.floor((paths[0]?.length || 2) * (1 - Math.pow(1 - amount, 3))));
    const values = paths.flat();
    const low = Math.min(...values);
    const high = Math.max(...values);
    paths.forEach((path, pathIndex) => {
      ctx.beginPath();
      path.slice(0, visible).forEach((value, index) => {
        const px = index / (path.length - 1) * width;
        const py = height * (.91 - (value - low) / (high - low || 1) * .8);
        if (index === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      const highlighted = pathIndex === paths.length - 1;
      ctx.strokeStyle = highlighted ? 'rgba(219,30,25,.93)' : 'rgba(241,240,235,.19)';
      ctx.lineWidth = highlighted ? 1.6 : .8;
      ctx.stroke();
    });
    requestAnimationFrame(draw);
  }
  resize();
  addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(draw);
}

function runChess() {
  const board = $('#chess-board');
  const status = $('#chess-status');
  const reset = $('#chess-reset');
  if (!board || !status || !reset) return;
  const pieces = { g8: '♚', g7: '♟', h7: '♟', h5: '♕', g2: '♙', h2: '♙', g1: '♔' };
  let selected = null;
  let solved = false;
  function render() {
    board.innerHTML = '';
    for (let rank = 8; rank >= 1; rank -= 1) {
      for (let file = 0; file < 8; file += 1) {
        const square = `${'abcdefgh'[file]}${rank}`;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `chess-square ${(rank + file) % 2 ? 'light' : ''}`;
        if (selected === square) button.classList.add('selected');
        if (solved && square === 'e8') button.classList.add('answer');
        button.dataset.square = square;
        button.setAttribute('aria-label', square);
        button.textContent = pieces[square] || '';
        board.append(button);
      }
    }
  }
  board.addEventListener('click', (event) => {
    const square = event.target.closest('[data-square]')?.dataset.square;
    if (!square || solved) return;
    if (!selected && square === 'h5') { selected = square; status.textContent = 'Queen selected.'; }
    else if (selected === 'h5' && square === 'e8') { solved = true; selected = null; status.textContent = 'Qe8# · clean.'; }
    else { selected = null; status.textContent = 'Try again.'; }
    render();
  });
  reset.addEventListener('click', () => { selected = null; solved = false; status.textContent = 'White to move · mate in one.'; render(); });
  render();
}

function runLightsOut() {
  const lights = [...document.querySelectorAll('.lights i')];
  const button = $('#reaction-button');
  const result = $('#reaction-result');
  const board = $('#reaction-leaderboard');
  if (!lights.length || !button || !result || !board) return;
  const storageKey = 'deepfolio-reaction-board';
  let state = 'idle';
  let lightTimer;
  let goTimer;
  let goTime = 0;
  const resetLights = () => { lights.forEach((light) => light.classList.remove('on')); button.classList.remove('go'); };
  const readScores = () => { try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; } };
  const renderScores = () => {
    const scores = readScores().filter(Number.isFinite).sort((a, b) => a - b).slice(0, 5);
    board.innerHTML = scores.length ? scores.map((score, index) => `<li><span>${index + 1}</span><strong>${score} ms</strong></li>`).join('') : '<li><span>—</span><strong>Set a time</strong></li>';
  };
  const saveScore = (score) => { try { localStorage.setItem(storageKey, JSON.stringify([...readScores(), score].filter(Number.isFinite).sort((a, b) => a - b).slice(0, 5))); } catch { /* storage unavailable */ } renderScores(); };
  function start() {
    clearTimeout(lightTimer); clearTimeout(goTimer); resetLights(); state = 'waiting'; button.textContent = 'Wait'; result.textContent = 'Wait for lights out.';
    let lit = 0;
    const next = () => {
      lights[lit]?.classList.add('on'); lit += 1;
      if (lit === lights.length) { goTimer = setTimeout(() => { resetLights(); state = 'go'; goTime = performance.now(); button.textContent = 'GO'; button.classList.add('go'); result.textContent = 'Tap now.'; }, 1100 + Math.random() * 3100); return; }
      lightTimer = setTimeout(next, 430 + Math.random() * 470);
    };
    lightTimer = setTimeout(next, 380 + Math.random() * 420);
  }
  button.addEventListener('click', () => {
    if (state === 'idle' || state === 'done') start();
    else if (state === 'waiting') { clearTimeout(lightTimer); clearTimeout(goTimer); state = 'done'; button.textContent = 'Again'; result.textContent = 'Jump start.'; resetLights(); }
    else if (state === 'go') { const elapsed = Math.round(performance.now() - goTime); state = 'done'; button.textContent = 'Again'; button.classList.remove('go'); result.textContent = `${elapsed} ms`; saveScore(elapsed); }
  });
  renderScores();
}

const playlistId = 'PLfbmOEKBzK4Q';
let youtubePlayer;
function runListening() {
  const play = $('#play-toggle');
  const next = $('#next-track');
  const title = $('#listening-title');
  const status = $('#track-status');
  if (!play || !next || !title || !status) return;
  const updateTrack = () => { const data = youtubePlayer?.getVideoData?.(); if (data?.title) title.textContent = data.title; if (data?.author) status.textContent = data.author; };
  window.onYouTubeIframeAPIReady = () => {
    youtubePlayer = new YT.Player('youtube-player', { width: '640', height: '360', playerVars: { listType: 'playlist', list: playlistId, playsinline: 1, rel: 0, modestbranding: 1 }, events: { onReady: () => { youtubePlayer.setShuffle?.(true); setTimeout(updateTrack, 400); }, onStateChange: (event) => { const playing = event.data === YT.PlayerState.PLAYING; play.textContent = playing ? 'Pause' : 'Play'; updateTrack(); }, onError: () => { status.textContent = 'Open the playlist in YouTube Music'; } } });
  };
  if (window.YT?.Player) window.onYouTubeIframeAPIReady();
  play.addEventListener('click', () => { if (!youtubePlayer) return; youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING ? youtubePlayer.pauseVideo() : youtubePlayer.playVideo(); });
  next.addEventListener('click', () => youtubePlayer?.nextVideo());
}

runPreloader();
runGlobe();
runSimulation();
runChess();
runLightsOut();
runListening();
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();
