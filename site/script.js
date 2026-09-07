const playlistId = "PLfbmOEKBzK4Q";
const canvas = document.querySelector("#monte-carlo");
const context = canvas.getContext("2d");
const rerunButton = document.querySelector("#rerun");
const volatilityInput = document.querySelector("#volatility");
const pathInput = document.querySelector("#paths");
const volOutput = document.querySelector("#vol-output");
const pathsOutput = document.querySelector("#paths-output");

let simulation = [];
let simulationStart = performance.now();
let isMusicPlaying = false;

function normalRandom() {
  const u = Math.max(Math.random(), Number.EPSILON);
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeSimulation() {
  const count = Number(pathInput.value);
  const sigma = Number(volatilityInput.value) / 100;
  const steps = window.innerWidth < 640 ? 90 : 150;
  simulation = Array.from({ length: count }, () => {
    const values = [1];
    for (let step = 1; step < steps; step += 1) {
      const dt = 1 / steps;
      const previous = values[step - 1];
      values.push(previous * Math.exp((-0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * normalRandom()));
    }
    return values;
  });
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
      const y = height * (.84 - normalized * .68);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    const isRed = pathIndex === simulation.length - 1;
    context.strokeStyle = isRed ? "rgba(225,6,0,.9)" : "rgba(244,243,239,.085)";
    context.lineWidth = isRed ? 1.4 : .7;
    context.stroke();
  });
  requestAnimationFrame(drawSimulation);
}

function refreshSimulation() {
  volOutput.value = `${volatilityInput.value}%`;
  pathsOutput.value = pathInput.value;
  makeSimulation();
}

rerunButton.addEventListener("click", makeSimulation);
volatilityInput.addEventListener("input", refreshSimulation);
pathInput.addEventListener("input", refreshSimulation);
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
        trackStatus.textContent = "Playlist ready";
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

function resetLights() {
  lights.forEach((light) => light.classList.remove("on"));
  reactionButton.classList.remove("go");
}

function startReaction() {
  window.clearInterval(lightTimer);
  window.clearTimeout(goTimer);
  resetLights();
  reactionState = "waiting";
  reactionButton.textContent = "Wait";
  reactionResult.textContent = "Wait for lights out.";
  let lit = 0;
  lightTimer = window.setInterval(() => {
    lights[lit]?.classList.add("on");
    lit += 1;
    if (lit === lights.length) {
      window.clearInterval(lightTimer);
      goTimer = window.setTimeout(() => {
        resetLights();
        reactionState = "go";
        goTime = performance.now();
        reactionButton.textContent = "GO";
        reactionButton.classList.add("go");
        reactionResult.textContent = "Tap now.";
      }, 900 + Math.random() * 2200);
    }
  }, 380);
}

reactionButton.addEventListener("click", () => {
  if (reactionState === "idle" || reactionState === "done") startReaction();
  else if (reactionState === "waiting") {
    window.clearInterval(lightTimer);
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
  }
});

const board = document.querySelector("#chessboard");
const queenCount = document.querySelector("#queen-count");
const resetBoard = document.querySelector("#reset-board");
const queens = new Set();

function hasConflict(position) {
  const [row, column] = position.split("-").map(Number);
  return [...queens].some((other) => {
    if (other === position) return false;
    const [otherRow, otherColumn] = other.split("-").map(Number);
    return row === otherRow || column === otherColumn || Math.abs(row - otherRow) === Math.abs(column - otherColumn);
  });
}

function renderQueens() {
  [...board.children].forEach((square) => {
    const occupied = queens.has(square.dataset.position);
    square.textContent = occupied ? "♛" : "";
    square.classList.toggle("conflict", occupied && hasConflict(square.dataset.position));
    square.setAttribute("aria-pressed", String(occupied));
  });
  const solved = queens.size === 8 && ![...queens].some(hasConflict);
  queenCount.textContent = solved ? "Solved" : `${queens.size} / 8`;
}

for (let row = 0; row < 8; row += 1) {
  for (let column = 0; column < 8; column += 1) {
    const square = document.createElement("button");
    square.type = "button";
    square.className = "square";
    square.dataset.position = `${row}-${column}`;
    square.setAttribute("role", "gridcell");
    square.setAttribute("aria-label", `Row ${row + 1}, column ${column + 1}`);
    square.addEventListener("click", () => {
      if (queens.has(square.dataset.position)) queens.delete(square.dataset.position);
      else if (queens.size < 8) queens.add(square.dataset.position);
      renderQueens();
    });
    board.appendChild(square);
  }
}

resetBoard.addEventListener("click", () => { queens.clear(); renderQueens(); });
document.querySelectorAll(".index-item").forEach((item) => item.addEventListener("toggle", () => {
  if (!item.open) return;
  document.querySelectorAll(".index-item").forEach((other) => { if (other !== item) other.open = false; });
}));
document.querySelector("#year").textContent = new Date().getFullYear();
