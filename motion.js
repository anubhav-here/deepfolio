
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import {gsap} from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm';
const root=document.getElementById('motion-portfolio');
const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
const world=await fetch('world.json').then(response=>{if(!response.ok)throw new Error('Globe data unavailable');return response.json();});
const reduce=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduce.matches;
const canvas=q('.mp-globe'),ctx=canvas.getContext('2d');let w=1,h=1,clock=0,last=0,visible=true;
const state={turn:0,scale:1,route:1,tilt:0};
const projection=d3.geoOrthographic().clipAngle(90).precision(.45),path=d3.geoPath(projection,ctx);
const ny=[-74.006,40.7128],india=[78.9629,20.5937],interpolate=d3.geoInterpolate(india,ny);
const route={type:'LineString',coordinates:Array.from({length:101},(_,i)=>interpolate(i/100))};
function resize(){w=canvas.clientWidth;h=canvas.clientHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
function draw(){if(!w||!h)return;ctx.clearRect(0,0,w,h);const r=Math.min(w*.40,h*.42)*state.scale,cx=w*.53,cy=h*.49;projection.translate([cx,cy]).scale(r).rotate([state.turn,-17+state.tilt]);
const shade=ctx.createRadialGradient(cx-r*.4,cy-r*.5,r*.1,cx+r*.35,cy+r*.2,r*1.3);shade.addColorStop(0,'#29292e');shade.addColorStop(.6,'#141417');shade.addColorStop(1,'#050506');ctx.beginPath();path({type:'Sphere'});ctx.fillStyle=shade;ctx.fill();ctx.strokeStyle='#55555a';ctx.lineWidth=.8;ctx.stroke();
ctx.beginPath();path(d3.geoGraticule10());ctx.strokeStyle='#ffffff0b';ctx.lineWidth=.6;ctx.stroke();
for(const f of world.features){ctx.beginPath();path(f);const active=f.id==='IND'||f.id==='USA';ctx.fillStyle=active?'#ad302b':'#bcbcc015';ctx.fill();ctx.strokeStyle=active?'#ee665b':'#96969f70';ctx.lineWidth=active?.9:.55;ctx.stroke();}
const part={type:'LineString',coordinates:route.coordinates.slice(0,Math.max(2,Math.round(101*state.route)))};ctx.beginPath();path(part);ctx.setLineDash([4,5]);ctx.lineDashOffset=-clock*.012;ctx.strokeStyle='#f15449';ctx.lineWidth=1.7;ctx.stroke();ctx.setLineDash([]);
for(const [point,label] of [[ny,'NEW YORK'],[india,'INDIA']]){if(d3.geoDistance(point,projection.invert([cx,cy]))>Math.PI/2)continue;const p=projection(point);ctx.beginPath();ctx.arc(p[0],p[1],3.2,0,Math.PI*2);ctx.fillStyle='#ff6558';ctx.fill();ctx.beginPath();ctx.arc(p[0],p[1],8,0,Math.PI*2);ctx.strokeStyle='#ee443b70';ctx.stroke();ctx.font='10px Arial';ctx.fillStyle='#efefeb';ctx.textAlign=point===ny?'right':'left';ctx.fillText(label,p[0]+(point===ny?-12:12),p[1]-9);}
if(state.route>.95){const point=interpolate((clock*.000065)%1);if(d3.geoDistance(point,projection.invert([cx,cy]))<Math.PI/2){const p=projection(point);ctx.beginPath();ctx.arc(p[0],p[1],3,0,Math.PI*2);ctx.fillStyle='#fff2ee';ctx.fill();}}
}
let intro,spin;
function entrance(){intro?.kill();if(paused){Object.assign(state,{turn:0,scale:1,route:1});gsap.set([q('.mp-copy'),q('.mp-route'),q('.mp-nav')],{clearProps:'all'});draw();return;}intro=gsap.timeline();intro.fromTo(state,{turn:-82,scale:.77,route:0},{turn:0,scale:1,duration:2.2,ease:'power3.out',onUpdate:draw},0).fromTo(q('.mp-nav'),{y:-15,opacity:0},{y:0,opacity:1,duration:.65},.1).fromTo(qa('h1 span'),{y:48,opacity:0},{y:0,opacity:1,stagger:.1,duration:.85,ease:'power3.out'},.45).fromTo(q('.mp-copy p'),{y:18,opacity:0},{y:0,opacity:1,duration:.7},.8).fromTo(q('.mp-route'),{opacity:0,x:-12},{opacity:1,x:0,duration:.7},1).to(state,{route:1,duration:1.4,ease:'power2.inOut',onUpdate:draw},.9);}
function tick(t){const delta=last?Math.min(t-last,50):0;last=t;if(!paused&&visible&&!document.hidden){clock+=delta;if(!intro?.isActive()&&!spin?.isActive())state.turn=12*Math.sin(clock*.00013);draw();}if(root.isConnected)requestAnimationFrame(tick);}
new ResizeObserver(resize).observe(canvas);new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(canvas);
canvas.addEventListener('pointermove',e=>{if(paused||e.pointerType==='touch')return;const b=canvas.getBoundingClientRect();gsap.to(state,{tilt:((e.clientY-b.top)/b.height-.5)*10,duration:1,overwrite:'auto',onUpdate:draw});});canvas.addEventListener('pointerleave',()=>gsap.to(state,{tilt:0,duration:1,onUpdate:draw}));

q('.mp-globe-hit').addEventListener('click',()=>{if(spin?.isActive())return;if(intro?.isActive())intro.progress(1);if(reduce.matches){state.turn+=35;draw();return;}const finish=12*Math.sin(clock*.00013);spin=gsap.to(state,{turn:finish+360,duration:2.2,ease:'power2.inOut',onUpdate:draw,onComplete:()=>{state.turn=finish;draw();}});});
reduce.addEventListener('change',()=>{paused=reduce.matches;spin?.kill();entrance();});
const mc=q('.mp-paths'),mcctx=mc.getContext('2d'),reveal={amount:paused?1:0};let seed=31;function rand(){seed=seed*16807%2147483647;return seed/2147483647;}const paths=Array.from({length:32},()=>{let v=0;return Array.from({length:110},()=>v+=.024+(rand()-.5)*.13);});const low=Math.min(...paths.flat()),high=Math.max(...paths.flat());
function drawPaths(){const mw=mc.clientWidth,mh=mc.clientHeight;mc.width=mw*2;mc.height=mh*2;mcctx.setTransform(2,0,0,2,0,0);paths.forEach((p,j)=>{mcctx.beginPath();p.slice(0,Math.max(2,Math.round(p.length*reveal.amount))).forEach((v,i)=>{const x=mw*(.15+.82*i/109),y=mh*(.93-.80*(v-low)/(high-low));i?mcctx.lineTo(x,y):mcctx.moveTo(x,y)});mcctx.strokeStyle=j===20?'#ee443b99':'#d9d9de20';mcctx.lineWidth=j===20?1.6:.7;mcctx.stroke();});}new ResizeObserver(drawPaths).observe(mc);
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;if(e.target===q('.mp-background')){gsap.to(reveal,{amount:1,duration:paused?0:2.4,ease:'power2.out',onUpdate:drawPaths});gsap.fromTo(qa('.mp-event'),{x:paused?0:25,opacity:paused?1:.15},{x:0,opacity:1,stagger:paused?0:.14,duration:paused?0:.8,ease:'power3.out'});}else if(!paused)gsap.fromTo(e.target,{y:24,opacity:.3},{y:0,opacity:1,duration:.8,ease:'power3.out'});obs.unobserve(e.target);}),{threshold:.12});[q('.mp-background'),...qa('.mp-section')].forEach(el=>obs.observe(el));
const wrap=q('.mp-board-wrap');let open=false;
q('[data-chess]').addEventListener('click',()=>{open=!open;q('[data-chess]').setAttribute('aria-expanded',String(open));q('[data-chess]').textContent=open?'Close puzzle':'Open puzzle';q('.mp-chess-teaser').hidden=open;if(open){wrap.hidden=false;gsap.fromTo(wrap,{height:0,opacity:0},{height:'auto',opacity:1,duration:paused?0:.5,ease:'power3.inOut'});}else gsap.to(wrap,{height:0,opacity:0,duration:paused?0:.4,onComplete:()=>wrap.hidden=true});});
resize();drawPaths();entrance();requestAnimationFrame(tick);

const $=selector=>root.querySelector(selector);
function runChessV2() {
  const board = $('#chess-board');
  const status = $('#chess-status');
  const next = $('#chess-next');
  const shuffle = $('#chess-shuffle');
  const count = $('#chess-count');
  if (!board || !status || !next || !shuffle || !count) return;
  const files = 'abcdefgh';
  const piece = (kind, side) => ({ kind, side });
  // A fixed, authored sequence: no random placements or disguised rotations.
  const seeds = [
    ['e8', 'f6', 'a3', 'e7'], ['e8', 'f6', 'd6', 'e7'], ['c8', 'd6', 'b6', 'c7'], ['c8', 'd6', 'c1', 'c7'],
    ['f8', 'g6', 'b3', 'f7'], ['f8', 'g6', 'e6', 'f7'], ['a8', 'c6', 'b1', 'b7'], ['a8', 'c6', 'd7', 'b7'],
    ['h8', 'f6', 'a7', 'g7'], ['h8', 'f6', 'g1', 'g7'], ['e1', 'f3', 'a2', 'e2'], ['e1', 'f3', 'd3', 'e2'],
    ['c1', 'd3', 'b3', 'c2'], ['c1', 'd3', 'c8', 'c2'], ['f1', 'g3', 'a7', 'f2'], ['f1', 'g3', 'e3', 'f2'],
    ['a1', 'c3', 'b8', 'b2'], ['a1', 'c3', 'd2', 'b2'], ['h1', 'f3', 'a2', 'g2'], ['h1', 'f3', 'g8', 'g2'],
    ['a4', 'c5', 'b7', 'b4'], ['h4', 'f5', 'g7', 'g4'], ['a5', 'c4', 'b2', 'b5'], ['h5', 'f4', 'g2', 'g5'],
    ['a4', 'c3', 'a3', 'b4'], ['h4', 'f3', 'c8', 'g4'], ['a5', 'c6', 'e2', 'b5'], ['h5', 'f6', 'c1', 'g5']
  ];
  const puzzles = seeds.map(([blackKing, whiteKing, queen, target]) => ({
    queen, target,
    pieces: { [blackKing]: piece('k', 'black'), [whiteKing]: piece('k', 'white'), [queen]: piece('q', 'white') }
  }));
  let index = 0;
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
      if (invalid === square) button.classList.add('incorrect');
      if (movedTo === square) button.classList.add(solved ? 'correct' : 'last-move');
      if (piece) { const image = document.createElement('img'); image.className = 'chess-piece'; image.src = `https://unpkg.com/chessboard-element@1.2.0/chesspieces/wikipedia/${piece.side === 'white' ? 'w' : 'b'}${piece.kind.toUpperCase()}.png`; image.alt = `${piece.side} ${piece.kind === 'k' ? 'king' : 'queen'}`; button.append(image); button.classList.add(`piece-${piece.side}`); }
      board.append(button);
    }
  }
  function load(nextIndex) { index = nextIndex; pieces = { ...puzzles[index].pieces }; selected = null; legal = []; invalid = null; movedTo = null; solved = false; count.textContent = `${String(index + 1).padStart(2, '0')} / ${puzzles.length}`; status.textContent = 'White to move · mate in one.'; render(); }
  board.addEventListener('click', (event) => {
    const square = event.target.closest('[data-square]')?.dataset.square; if (!square || solved) return;
    const piece = pieces[square];
    if (piece?.side === 'white' && piece.kind === 'q') { selected = square; legal = queenMoves(square); status.textContent = 'Your move.'; render(); return; }
    if (!selected) { invalid = square; status.textContent = 'Choose the queen.'; render(); setTimeout(() => { invalid = null; render(); }, 450); return; }
    if (!legal.includes(square)) { invalid = square; status.textContent = 'Try again.'; render(); setTimeout(() => { invalid = null; render(); }, 450); return; }
    const from = selected; pieces = { ...pieces }; delete pieces[from]; pieces[square] = { kind: 'q', side: 'white' }; selected = null; legal = []; movedTo = square;
    if (square === puzzles[index].target) { solved = true; status.textContent = `Q${square}# · checkmate.`; render(); }
    else { invalid = square; status.textContent = 'Not mate.'; render(); setTimeout(() => load(index), 900); }
  });
  next.addEventListener('click', () => load((index + 1) % puzzles.length));
  shuffle.addEventListener('click', () => load((index + 1 + Math.floor(Math.random() * (puzzles.length - 1))) % puzzles.length));
  load(index);
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

runChessV2();runLightsOut();
