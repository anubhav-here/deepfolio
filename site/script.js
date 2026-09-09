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
    const centerLongitude = Math.sin(time * .00065) * .18;
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
    youtubePlayer = new YT.Player('youtube-player', { width: '640', height: '360', playerVars: { listType: 'playlist', list: playlistId, playsinline: 1, rel: 0, modestbranding: 1 }, events: { onReady: () => { youtubePlayer.setShuffle?.(true); setTimeout(() => { youtubePlayer.nextVideo?.(); updateTrack(); }, 120); }, onStateChange: (event) => { const playing = event.data === YT.PlayerState.PLAYING; play.textContent = playing ? 'Pause' : 'Play'; updateTrack(); }, onError: () => { status.textContent = 'Open the playlist in YouTube Music'; } } });
  };
  if (window.YT?.Player) window.onYouTubeIframeAPIReady();
  play.addEventListener('click', () => { if (!youtubePlayer) return; youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING ? youtubePlayer.pauseVideo() : youtubePlayer.playVideo(); });
  next.addEventListener('click', () => youtubePlayer?.nextVideo());
}

function runChessV2() {
  const board = $('#chess-board');
  const status = $('#chess-status');
  const shuffle = $('#chess-shuffle');
  const count = $('#chess-count');
  if (!board || !status || !shuffle || !count) return;
  const files = 'abcdefgh';
  const sources = [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 7], [3, 7]];
  const variants = [[false, false], [true, false], [false, true], [true, true]];
  const toSquare = ([file, rank], flipFile, flipRank) => `${files[flipFile ? 7 - file : file]}${flipRank ? 9 - rank : rank}`;
  const puzzles = variants.flatMap(([flipFile, flipRank]) => sources.map((source) => ({
    queen: toSquare(source, flipFile, flipRank), target: toSquare([1, 7], flipFile, flipRank),
    pieces: {
      [toSquare([0, 8], flipFile, flipRank)]: { glyph: '♚', side: 'black' },
      [toSquare([2, 6], flipFile, flipRank)]: { glyph: '♔', side: 'white' },
      [toSquare(source, flipFile, flipRank)]: { glyph: '♕', side: 'white' }
    }
  })));
  let index = Math.floor(Math.random() * puzzles.length);
  let pieces = {};
  let selected = null;
  let legal = [];
  let invalid = null;
  let movedTo = null;
  let solved = false;
  const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  function queenMoves(square) {
    const file = files.indexOf(square[0]); const rank = Number(square[1]); const moves = [];
    directions.forEach(([dx, dy]) => { let x = file + dx; let y = rank + dy; while (x >= 0 && x < 8 && y >= 1 && y <= 8) { const target = `${files[x]}${y}`; if (pieces[target]?.side === 'white') break; moves.push(target); if (pieces[target]) break; x += dx; y += dy; } });
    return moves;
  }
  function render() {
    board.innerHTML = '';
    for (let rank = 8; rank >= 1; rank -= 1) for (let file = 0; file < 8; file += 1) {
      const square = `${files[file]}${rank}`; const piece = pieces[square]; const button = document.createElement('button');
      button.type = 'button'; button.dataset.square = square; button.setAttribute('aria-label', square); button.className = `chess-square ${(rank + file) % 2 ? 'light' : ''}`;
      if (selected === square) button.classList.add('selected');
      if (legal.includes(square)) button.classList.add(piece?.side === 'black' ? 'capture' : 'legal');
      if (invalid === square) button.classList.add('invalid');
      if (movedTo === square) button.classList.add(solved ? 'answer' : 'last-move');
      if (piece) { button.textContent = piece.glyph; button.classList.add(`piece-${piece.side}`); }
      board.append(button);
    }
  }
  function load(nextIndex) { index = nextIndex; pieces = { ...puzzles[index].pieces }; selected = null; legal = []; invalid = null; movedTo = null; solved = false; count.textContent = `${String(index + 1).padStart(2, '0')} / ${puzzles.length}`; status.textContent = 'White to move · mate in one.'; render(); }
  board.addEventListener('click', (event) => {
    const square = event.target.closest('[data-square]')?.dataset.square; if (!square || solved) return;
    const piece = pieces[square];
    if (piece?.side === 'white' && piece.glyph === '♕') { selected = square; legal = queenMoves(square); status.textContent = 'Queen selected · choose a legal square.'; render(); return; }
    if (!selected) { invalid = square; status.textContent = 'Select the white queen first.'; render(); setTimeout(() => { invalid = null; render(); }, 450); return; }
    if (!legal.includes(square)) { invalid = square; selected = null; legal = []; status.textContent = 'That square is not available.'; render(); setTimeout(() => { invalid = null; render(); }, 450); return; }
    const from = selected; pieces = { ...pieces }; delete pieces[from]; pieces[square] = { glyph: '♕', side: 'white' }; selected = null; legal = []; movedTo = square;
    if (square === puzzles[index].target) { solved = true; status.textContent = `Q${square}# · checkmate.`; render(); }
    else { status.textContent = 'Not mate. Resetting the position.'; render(); setTimeout(() => load(index), 850); }
  });
  shuffle.addEventListener('click', () => load((index + 1 + Math.floor(Math.random() * (puzzles.length - 1))) % puzzles.length));
  load(index);
}

runPreloader();
runGlobe();
runSimulation();
runChessV2();
runLightsOut();
runListening();
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();
