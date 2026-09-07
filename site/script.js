const playlistId = "PLfbmOEKBzK4Q";
const canvas = document.querySelector("#monte-carlo");
const context = canvas.getContext("2d");
const rerunButton = document.querySelector("#rerun");
const driftInput = document.querySelector("#drift");
const volatilityInput = document.querySelector("#volatility");
const pathInput = document.querySelector("#paths");
const driftOutput = document.querySelector("#drift-output");
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
  const drift = Number(driftInput.value) / 100;
  const sigma = Number(volatilityInput.value) / 100;
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
  driftOutput.value = `+${driftInput.value}%`;
  volOutput.value = `${volatilityInput.value}%`;
  pathsOutput.value = pathInput.value;
  makeSimulation();
}

rerunButton.addEventListener("click", makeSimulation);
driftInput.addEventListener("input", refreshSimulation);
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
const resetBoard = document.querySelector("#reset-board");
const puzzleName = document.querySelector("#puzzle-name");
const puzzleInstruction = document.querySelector("#puzzle-instruction");
const puzzleCount = document.querySelector("#puzzle-count");
const puzzleStatus = document.querySelector("#puzzle-status");
const previousPuzzle = document.querySelector("#previous-puzzle");
const nextPuzzle = document.querySelector("#next-puzzle");
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const puzzles = [
  {
    name: "Scholar's mate", instruction: "White to move. Find mate in one.", move: ["h5", "f7"], answer: "Qxf7#",
    pieces: { a1:"♖",b1:"♘",c1:"♗",d1:"♕",e1:"♔",g1:"♘",h1:"♖",a2:"♙",b2:"♙",c2:"♙",d2:"♙",f2:"♙",g2:"♙",h2:"♙",e4:"♙",c4:"♗",h5:"♕",a8:"♜",c8:"♝",d8:"♛",e8:"♚",f8:"♝",h8:"♜",a7:"♟",b7:"♟",c7:"♟",d7:"♟",f7:"♟",g7:"♟",h7:"♟",e5:"♟",c6:"♞",f6:"♞" }
  },
  {
    name: "Fool's mate", instruction: "Black to move. Find mate in one.", move: ["d8", "h4"], answer: "Qh4#",
    pieces: { a1:"♖",b1:"♘",c1:"♗",d1:"♕",e1:"♔",f1:"♗",g1:"♘",h1:"♖",a2:"♙",b2:"♙",c2:"♙",d2:"♙",e2:"♙",h2:"♙",f3:"♙",g4:"♙",a8:"♜",b8:"♞",c8:"♝",d8:"♛",e8:"♚",f8:"♝",g8:"♞",h8:"♜",a7:"♟",b7:"♟",c7:"♟",d7:"♟",f7:"♟",g7:"♟",h7:"♟",e5:"♟" }
  },
  {
    name: "Back rank", instruction: "White to move. Find mate in one.", move: ["e1", "e8"], answer: "Re8#",
    pieces: { g1:"♔",e1:"♖",f2:"♙",g2:"♙",h2:"♙",g8:"♚",f7:"♟",g7:"♟",h7:"♟" }
  }
];
let puzzleIndex = 0;
let selectedSquare = null;
let solvedMove = null;
let currentPieces = {};

function renderPuzzle() {
  const puzzle = puzzles[puzzleIndex];
  currentPieces = { ...puzzle.pieces };
  selectedSquare = null;
  solvedMove = null;
  puzzleName.textContent = puzzle.name;
  puzzleInstruction.textContent = puzzle.instruction;
  puzzleCount.textContent = `${puzzleIndex + 1} / ${puzzles.length}`;
  puzzleStatus.textContent = "Select a piece.";
  renderBoard();
}

function renderBoard() {
  [...board.children].forEach((square) => {
    const position = square.dataset.position;
    square.textContent = currentPieces[position] || "";
    square.classList.toggle("selected", selectedSquare === position);
    square.classList.toggle("last-move", solvedMove?.includes(position));
    square.setAttribute("aria-label", `${position}${currentPieces[position] ? `, ${currentPieces[position]}` : ""}`);
  });
}

function playMove(position) {
  const puzzle = puzzles[puzzleIndex];
  if (!selectedSquare) {
    if (!currentPieces[position]) return;
    selectedSquare = position;
    puzzleStatus.textContent = `${position} selected.`;
    renderBoard();
    return;
  }
  if (selectedSquare === position) {
    selectedSquare = null;
    puzzleStatus.textContent = "Select a piece.";
    renderBoard();
    return;
  }
  const attemptedMove = [selectedSquare, position];
  if (attemptedMove[0] === puzzle.move[0] && attemptedMove[1] === puzzle.move[1]) {
    currentPieces[position] = currentPieces[selectedSquare];
    delete currentPieces[selectedSquare];
    solvedMove = attemptedMove;
    selectedSquare = null;
    puzzleStatus.textContent = `Solved · ${puzzle.answer}`;
  } else {
    selectedSquare = null;
    puzzleStatus.textContent = "Not quite. Try again.";
  }
  renderBoard();
}

for (let rank = 8; rank >= 1; rank -= 1) {
  files.forEach((file) => {
    const square = document.createElement("button");
    square.type = "button";
    square.className = "square";
    square.dataset.position = `${file}${rank}`;
    square.setAttribute("role", "gridcell");
    square.addEventListener("click", () => playMove(square.dataset.position));
    board.appendChild(square);
  });
}

function changePuzzle(direction) {
  puzzleIndex = (puzzleIndex + direction + puzzles.length) % puzzles.length;
  renderPuzzle();
}

previousPuzzle.addEventListener("click", () => changePuzzle(-1));
nextPuzzle.addEventListener("click", () => changePuzzle(1));
resetBoard.addEventListener("click", renderPuzzle);
renderPuzzle();
document.querySelectorAll(".index-item").forEach((item) => item.addEventListener("toggle", () => {
  if (!item.open) return;
  document.querySelectorAll(".index-item").forEach((other) => { if (other !== item) other.open = false; });
}));
document.querySelector("#year").textContent = new Date().getFullYear();
