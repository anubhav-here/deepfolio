const playlistId = "PLfbmOEKBzK4Q";
const canvas = document.querySelector("#monte-carlo");
const context = canvas.getContext("2d");
const simulationSettings = { count: 56, drift: .18, volatility: .28 };

let simulation = [];
let simulationStart = performance.now();
let isMusicPlaying = false;

function runPreloader() {
  const loader = document.querySelector('.preloader');
  const number = document.querySelector('#load-number');
  const started = performance.now();
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1050;
  function tick(now) {
    const progress = Math.min(1, (now - started) / duration);
    number.textContent = String(Math.round(progress * 100)).padStart(3, '0');
    if (progress < 1) requestAnimationFrame(tick);
    else setTimeout(() => loader.classList.add('done'), 120);
  }
  requestAnimationFrame(tick);
}

function normalRandom() {
  const u = Math.max(Math.random(), Number.EPSILON);
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeSimulation() {
  const { count, drift, volatility: sigma } = simulationSettings;
  const steps = window.innerWidth < 640 ? 90 : 150;
  simulation = Array.from({ length: count }, () => {
    const values = [1];
    for (let step = 1; step < steps; step += 1) {
      const dt = 1 / steps;
      const previous = values[step - 1];
      values.push(previous * Math.exp((drift - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * normalRandom()));
    }
    return values;
  });
  simulation.sort((left, right) => left.at(-1) - right.at(-1));
  const upwardCandidates = simulation.filter((path) => path.at(-1) > 1.08);
  const highlighted = upwardCandidates[Math.floor(upwardCandidates.length * .68)] || simulation.at(-1);
  simulation.splice(simulation.indexOf(highlighted), 1);
  simulation.push(highlighted);
  simulationStart = performance.now();
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const bounds = canvas.getBoundingClientRect();
  canvas.width = Math.round(bounds.width * ratio);
  canvas.height = Math.round(bounds.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  makeSimulation();
}

function drawSimulation(now) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  context.clearRect(0, 0, width, height);
  const progress = Math.min(1, (now - simulationStart) / (isMusicPlaying ? 4200 : 2600));
  const eased = 1 - Math.pow(1 - progress, 3);
  const visibleSteps = Math.max(2, Math.floor((simulation[0]?.length || 2) * eased));
  const allValues = simulation.flat();
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  simulation.forEach((path, pathIndex) => {
    context.beginPath();
    path.slice(0, visibleSteps).forEach((value, index) => {
      const x = (index / (path.length - 1)) * width;
      const normalized = (value - min) / range;
      const y = height * (.9 - normalized * .8);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    const isRed = pathIndex === simulation.length - 1;
    context.strokeStyle = isRed ? "rgba(225,6,0,.94)" : "rgba(244,243,239,.27)";
    context.lineWidth = isRed ? 1.6 : .85;
    context.stroke();
  });
  requestAnimationFrame(drawSimulation);
}

window.addEventListener("resize", resizeCanvas, { passive: true });
resizeCanvas();
requestAnimationFrame(drawSimulation);

let youtubePlayer;
const playToggle = document.querySelector("#play-toggle");
const nextTrack = document.querySelector("#next-track");
const listeningTitle = document.querySelector("#listening-title");
const trackStatus = document.querySelector("#track-status");

function updateTrack() {
  if (!youtubePlayer?.getVideoData) return;
  const data = youtubePlayer.getVideoData();
  if (data?.title) listeningTitle.textContent = data.title;
  if (data?.author) trackStatus.textContent = data.author;
}

function createYouTubePlayer() {
  if (!window.YT?.Player || youtubePlayer) return;
  youtubePlayer = new YT.Player("youtube-player", {
    width: "640",
    height: "360",
    playerVars: { listType: "playlist", list: playlistId, playsinline: 1, rel: 0, modestbranding: 1 },
    events: {
      onReady: () => {
        youtubePlayer.setShuffle?.(true);
        trackStatus.textContent = "Shuffle on";
        window.setTimeout(updateTrack, 400);
      },
      onStateChange: (event) => {
        isMusicPlaying = event.data === YT.PlayerState.PLAYING;
        playToggle.textContent = isMusicPlaying ? "Pause" : "Play";
        playToggle.setAttribute("aria-label", isMusicPlaying ? "Pause playlist" : "Play playlist");
        updateTrack();
      },
      onError: () => { trackStatus.textContent = "Open the playlist in YouTube Music"; }
    }
  });
}

window.onYouTubeIframeAPIReady = createYouTubePlayer;
if (window.YT?.Player) createYouTubePlayer();

playToggle.addEventListener("click", () => {
  if (!youtubePlayer) return;
  const state = youtubePlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) youtubePlayer.pauseVideo();
  else youtubePlayer.playVideo();
});
nextTrack.addEventListener("click", () => youtubePlayer?.nextVideo());

const lights = [...document.querySelectorAll(".lights i")];
const reactionButton = document.querySelector("#reaction-button");
const reactionResult = document.querySelector("#reaction-result");
let reactionState = "idle";
let lightTimer;
let goTimer;
let goTime = 0;
const leaderboard = document.querySelector("#reaction-leaderboard");
const leaderboardKey = "deepfolio-reaction-board";

function resetLights() {
  lights.forEach((light) => light.classList.remove("on"));
  reactionButton.classList.remove("go");
}

function readScores() {
  try { return JSON.parse(window.localStorage.getItem(leaderboardKey) || "[]"); }
  catch { return []; }
}

function renderScores() {
  const scores = readScores().filter(Number.isFinite).sort((left, right) => left - right).slice(0, 5);
  leaderboard.innerHTML = scores.length
    ? scores.map((score, index) => `<li><span>${index + 1}</span><strong>${score} ms</strong></li>`).join("")
    : "<li><span>—</span><strong>Set a time</strong></li>";
}

function saveScore(score) {
  const scores = [...readScores(), score].filter(Number.isFinite).sort((left, right) => left - right).slice(0, 5);
  try { window.localStorage.setItem(leaderboardKey, JSON.stringify(scores)); } catch { /* local storage unavailable */ }
  renderScores();
}

function startReaction() {
  window.clearTimeout(lightTimer);
  window.clearTimeout(goTimer);
  resetLights();
  reactionState = "waiting";
  reactionButton.textContent = "Wait";
  reactionResult.textContent = "Wait for lights out.";
  let lit = 0;
  function lightNext() {
    lights[lit]?.classList.add("on");
    lit += 1;
    if (lit === lights.length) {
      goTimer = window.setTimeout(() => {
        resetLights();
        reactionState = "go";
        goTime = performance.now();
        reactionButton.textContent = "GO";
        reactionButton.classList.add("go");
        reactionResult.textContent = "Tap now.";
      }, 1100 + Math.random() * 3100);
      return;
    }
    lightTimer = window.setTimeout(lightNext, 430 + Math.random() * 470);
  }
  lightTimer = window.setTimeout(lightNext, 380 + Math.random() * 420);
}

reactionButton.addEventListener("click", () => {
  if (reactionState === "idle" || reactionState === "done") startReaction();
  else if (reactionState === "waiting") {
    window.clearTimeout(lightTimer);
    window.clearTimeout(goTimer);
    reactionState = "done";
    reactionButton.textContent = "Again";
    reactionResult.textContent = "Jump start.";
    resetLights();
  } else if (reactionState === "go") {
    const elapsed = Math.round(performance.now() - goTime);
    reactionState = "done";
    reactionButton.textContent = "Again";
    reactionButton.classList.remove("go");
    reactionResult.textContent = `${elapsed} ms`;
    saveScore(elapsed);
  }
});
renderScores();

document.querySelectorAll(".index-item").forEach((item) => item.addEventListener("toggle", () => {
  if (!item.open) return;
  document.querySelectorAll(".index-item").forEach((other) => { if (other !== item) other.open = false; });
}));
document.querySelector("#year").textContent = new Date().getFullYear();
runPreloader();
