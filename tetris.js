const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const COLORS = [
  "#EF4444", // 红色
  "#10B981", // 绿色
  "#3B82F6", // 蓝色
  "#F59E0B", // 黄色
  "#8B5CF6", // 紫色
  "#06B6D4", // 青色
  "#EC4899", // 粉色
];

// 定义方块形状
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [1, 1, 1],
    [0, 1, 0],
  ], // T
  [
    [1, 1, 1],
    [1, 0, 0],
  ], // L
  [
    [1, 1, 1],
    [0, 0, 1],
  ], // J
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // S
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // Z
];

let canvas, ctx;
let board = [];
let currentPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop;
let gameSpeed = 1000;

// 添加速度相关常量
const SPEED_CONFIG = {
  BASE_SPEED: 1000, // 基础速度 (ms)
  MIN_SPEED: 100, // 最快速度 (ms)
  SOFT_DROP_SPEED: 50, // 软降速度 (ms)
  SPEED_INCREASE: 50, // 每级增加的速度
};

// 添加新的游戏状态变量
let isSoftDropping = false;
let currentSpeed = SPEED_CONFIG.BASE_SPEED;

class Piece {
  constructor(shape, color) {
    this.shape = shape;
    this.color = color;
    this.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2);
    this.y = 0;
  }
}

function initGame() {
  canvas = document.getElementById("gameBoard");
  ctx = canvas.getContext("2d");
  canvas.width = BLOCK_SIZE * BOARD_WIDTH;
  canvas.height = BLOCK_SIZE * BOARD_HEIGHT;

  // 初始化游戏板
  for (let i = 0; i < BOARD_HEIGHT; i++) {
    board[i] = new Array(BOARD_WIDTH).fill(null);
  }
}

function startGame() {
  // 重置游戏状态
  board = [];
  score = 0;
  level = 1;
  lines = 0;
  currentSpeed = SPEED_CONFIG.BASE_SPEED;
  isSoftDropping = false;
  document.getElementById("gameOver").style.display = "none";
  updateScore();
  initGame();
  spawnPiece();
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameStep, currentSpeed);
}

function spawnPiece() {
  const shapeIndex = Math.floor(Math.random() * SHAPES.length);
  currentPiece = new Piece(SHAPES[shapeIndex], COLORS[shapeIndex]);
  if (checkCollision(currentPiece)) {
    gameOver();
  }
}

function gameStep() {
  if (movePiece(0, 1)) return;
  placePiece();
  clearLines();
  spawnPiece();
}

function movePiece(dx, dy) {
  currentPiece.x += dx;
  currentPiece.y += dy;

  if (checkCollision(currentPiece)) {
    currentPiece.x -= dx;
    currentPiece.y -= dy;
    return false;
  }
  draw();
  return true;
}

function rotatePiece() {
  const newShape = currentPiece.shape[0].map((_, i) =>
    currentPiece.shape.map((row) => row[i]).reverse()
  );
  const oldShape = currentPiece.shape;
  currentPiece.shape = newShape;

  if (checkCollision(currentPiece)) {
    currentPiece.shape = oldShape;
  } else {
    draw();
  }
}

function checkCollision(piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;

        if (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY >= BOARD_HEIGHT ||
          (boardY >= 0 && board[boardY][boardX] !== null)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function placePiece() {
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (currentPiece.shape[y][x]) {
        const boardY = currentPiece.y + y;
        if (boardY >= 0) {
          board[boardY][currentPiece.x + x] = currentPiece.color;
        }
      }
    }
  }
}

function clearLines() {
  let linesCleared = 0;
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (board[y].every((cell) => cell !== null)) {
      board.splice(y, 1);
      board.unshift(new Array(BOARD_WIDTH).fill(null));
      linesCleared++;
      y++;
    }
  }

  if (linesCleared > 0) {
    lines += linesCleared;
    // 更新分数计算逻辑
    const linePoints = [40, 100, 300, 1200]; // 1、2、3、4行的分数
    score += (linePoints[linesCleared - 1] || 0) * level;

    // 更新等级和速度
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      level = newLevel;
      currentSpeed = Math.max(
        SPEED_CONFIG.MIN_SPEED,
        SPEED_CONFIG.BASE_SPEED - (level - 1) * SPEED_CONFIG.SPEED_INCREASE
      );
      updateGameSpeed();
    }
    updateScore();
  }
}

function updateScore() {
  document.getElementById("score").textContent = score
    .toString()
    .padStart(6, "0");
  document.getElementById("level").textContent = level;
  document.getElementById("lines").textContent = lines;
}

function gameOver() {
  clearInterval(gameLoop);
  document.getElementById("finalScore").textContent = score;
  document.getElementById("gameOver").style.display = "block";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制已放置的方块
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (board[y][x]) {
        drawBlock(x, y, board[y][x]);
      }
    }
  }

  // 绘制当前方块
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (currentPiece.shape[y][x]) {
        drawBlock(currentPiece.x + x, currentPiece.y + y, currentPiece.color);
      }
    }
  }
}

function drawBlock(x, y, color) {
  const gradient = ctx.createLinearGradient(
    x * BLOCK_SIZE,
    y * BLOCK_SIZE,
    (x + 1) * BLOCK_SIZE,
    (y + 1) * BLOCK_SIZE
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, adjustColor(color, -20)); // 暗化颜色

  ctx.fillStyle = gradient;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

  // 添加高光效果
  ctx.strokeStyle = adjustColor(color, 30);
  ctx.lineWidth = 1;
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// 辅助函数：调整颜色明度
function adjustColor(color, amount) {
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// 键盘控制
document.addEventListener("keydown", (e) => {
  if (e.repeat) return; // 防止按键重复触发

  switch (e.key) {
    case "ArrowLeft":
      movePiece(-1, 0);
      break;
    case "ArrowRight":
      movePiece(1, 0);
      break;
    case "ArrowDown":
      isSoftDropping = true;
      updateGameSpeed();
      break;
    case "ArrowUp":
      rotatePiece();
      break;
    case " ":
      // 硬降落
      let dropDistance = 0;
      while (movePiece(0, 1)) {
        dropDistance++;
      }
      // 额外奖励分数
      score += dropDistance * 2;
      updateScore();
      break;
  }
});

// 添加按键释放事件
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowDown") {
    isSoftDropping = false;
    updateGameSpeed();
  }
});

// 添加更新游戏速度的函数
function updateGameSpeed() {
  if (gameLoop) clearInterval(gameLoop);
  const speed = isSoftDropping ? SPEED_CONFIG.SOFT_DROP_SPEED : currentSpeed;
  gameLoop = setInterval(gameStep, speed);
}

// 初始化游戏
initGame();
