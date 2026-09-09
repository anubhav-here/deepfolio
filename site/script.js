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
  const worldUrl = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let features = [];
  let width = 0;
  let height = 0;
  fetch(worldUrl).then((response) => response.ok ? response.json() : null).then((world) => { features = world?.features || []; }).catch(() => { features = []; });
  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function project([longitude, latitude], cx, cy, radius, centerLongitude) {
    const lon = longitude * Math.PI / 180 - centerLongitude;
    const lat = latitude * Math.PI / 180;
    const visible = Math.cos(lat) * Math.cos(lon);
    if (visible <= 0) return null;
    return { x: cx + radius * Math.cos(lat) * Math.sin(lon), y: cy - radius * Math.sin(lat), visible };
  }
  function traceRing(ring, cx, cy, radius, centerLongitude) {
    let drawing = false;
    const stride = Math.max(1, Math.floor(ring.length / 220));
    for (let index = 0; index < ring.length; index += stride) {
      const point = project(ring[index], cx, cy, radius, centerLongitude);
      if (!point) { drawing = false; continue; }
      if (!drawing) { ctx.moveTo(point.x, point.y); drawing = true; } else ctx.lineTo(point.x, point.y);
    }
  }
  function traceFeature(feature, cx, cy, radius, centerLongitude) {
    const polygons = feature.geometry?.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry?.coordinates || [];
    ctx.beginPath();
    polygons.forEach((polygon) => polygon.forEach((ring) => traceRing(ring, cx, cy, radius, centerLongitude)));
  }
  function draw(time = 0) {
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width, height) * .285;
    const cx = width / 2;
    const cy = height * .47;
    const centerLongitude = Math.sin(time * .00017) * .18;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(241,240,235,.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, radius - .5, 0, Math.PI * 2); ctx.clip();
    features.forEach((feature) => {
      const highlighted = feature.id === 'IND' || feature.id === 'USA';
      traceFeature(feature, cx, cy, radius, centerLongitude);
      if (highlighted) { ctx.fillStyle = feature.id === 'IND' ? 'rgba(219,30,25,.62)' : 'rgba(241,240,235,.28)'; ctx.fill(); }
      ctx.strokeStyle = highlighted ? '#db1e19' : 'rgba(241,240,235,.2)'; ctx.lineWidth = highlighted ? 1.15 : .45; ctx.stroke();
    });
    ctx.restore();
    const india = project([78.9629, 20.5937], cx, cy, radius, centerLongitude);
    const ny = project([-74.006, 40.7128], cx, cy, radius, centerLongitude);
    if (india && ny) {
      ctx.beginPath(); ctx.setLineDash([5, 8]); ctx.lineDashOffset = -time * .016; ctx.moveTo(india.x, india.y); ctx.quadraticCurveTo(cx, cy - radius * .86, ny.x, ny.y); ctx.strokeStyle = '#db1e19'; ctx.lineWidth = 1.25; ctx.stroke(); ctx.setLineDash([]);
      [[india, 'INDIA'], [ny, 'UNITED STATES']].forEach(([point, label], index) => { const pulse = 1 + Math.sin(time * .003 + index) * .2; ctx.beginPath(); ctx.arc(point.x, point.y, 3.4 * pulse, 0, Math.PI * 2); ctx.fillStyle = '#db1e19'; ctx.fill(); ctx.fillStyle = '#f1f0eb'; ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif'; ctx.fillText(label, point.x + 8, point.y - 8); });
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  resize(); addEventListener('resize', resize, { passive: true }); requestAnimationFrame(draw);
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
  const opening = { g8: { glyph: '♚', side: 'black' }, g7: { glyph: '♟', side: 'black' }, h7: { glyph: '♟', side: 'black' }, h5: { glyph: '♕', side: 'white' }, g2: { glyph: '♙', side: 'white' }, h2: { glyph: '♙', side: 'white' }, g1: { glyph: '♔', side: 'white' } };
  const legalMoves = ['h6', 'h7', 'g5', 'f5', 'e5', 'd5', 'c5', 'b5', 'a5', 'g6', 'f7', 'e8', 'g4', 'f3', 'e2', 'd1'];
  let pieces = { ...opening };
  let selected = null;
  let solved = false;
  let invalid = null;
  let movedTo = null;
  function render() {
    board.innerHTML = '';
    for (let rank = 8; rank >= 1; rank -= 1) {
      for (let file = 0; file < 8; file += 1) {
        const square = `${'abcdefgh'[file]}${rank}`;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `chess-square ${(rank + file) % 2 ? 'light' : ''}`;
        if (selected === square) button.classList.add('selected');
        if (selected === 'h5' && legalMoves.includes(square)) button.classList.add(pieces[square]?.side === 'black' ? 'capture' : 'legal');
        if (solved && square === 'e8') button.classList.add('answer');
        if (invalid === square) button.classList.add('invalid');
        if (movedTo === square) button.classList.add('last-move');
        button.dataset.square = square;
        button.setAttribute('aria-label', square);
        if (pieces[square]) { button.textContent = pieces[square].glyph; button.classList.add(`piece-${pieces[square].side}`); }
        board.append(button);
      }
    }
  }
  board.addEventListener('click', (event) => {
    const square = event.target.closest('[data-square]')?.dataset.square;
    if (!square || solved) return;
    if (!selected && square === 'h5') { selected = square; status.textContent = 'Queen selected · choose a legal square.'; }
    else if (!selected) { invalid = square; status.textContent = 'Select the white queen first.'; setTimeout(() => { invalid = null; render(); }, 480); }
    else if (selected === 'h5' && legalMoves.includes(square)) {
      pieces = { ...pieces }; delete pieces.h5; pieces[square] = { glyph: '♕', side: 'white' }; selected = null; movedTo = square;
      if (square === 'e8') { solved = true; status.textContent = 'Qe8# · checkmate.'; }
      else { status.textContent = 'Not mate. Resetting the position.'; setTimeout(() => { pieces = { ...opening }; movedTo = null; status.textContent = 'White to move · mate in one.'; render(); }, 850); }
    } else { invalid = square; selected = null; status.textContent = 'That square is not available.'; setTimeout(() => { invalid = null; render(); }, 480); }
    render();
  });
  reset.addEventListener('click', () => { pieces = { ...opening }; selected = null; solved = false; invalid = null; movedTo = null; status.textContent = 'White to move · mate in one.'; render(); });
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
