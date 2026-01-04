// 游戏配置
const CANVAS_SIZE = 400;
const GRID_SIZE = 20; // 网格大小
const TILE_COUNT = CANVAS_SIZE / GRID_SIZE; // 20x20 的网格
const INITIAL_SPEED = 250; // 初始移动间隔 (ms) - 已调慢
const MIN_SPEED = 80; // 最快速度
const SPEED_DECREMENT = 2; // 每次吃到食物减少的间隔时间

// DOM 元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// 游戏状态
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoopId = null;
let isGameRunning = false;
let isPaused = false;
let currentSpeed = INITIAL_SPEED;
let lastRenderTime = 0;

// 初始化最高分显示
highScoreElement.textContent = highScore;

// 音效 (可选，暂不实现)

// 游戏初始化
function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    // 初始向上移动
    dx = 0;
    dy = -1;
    score = 0;
    currentSpeed = INITIAL_SPEED;
    scoreElement.textContent = score;
    
    generateFood();
    isGameRunning = true;
    isPaused = false;
    
    // 隐藏所有遮罩层
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    
    // 开始游戏循环
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    window.requestAnimationFrame(gameLoop);
}

// 游戏主循环
function gameLoop(currentTime) {
    if (!isGameRunning) return;

    window.requestAnimationFrame(gameLoop);
    
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < currentSpeed / 1000) return;
    
    if (!isPaused) {
        lastRenderTime = currentTime;
        update();
        draw();
    }
}

// 更新游戏逻辑
function update() {
    // 移动蛇头
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // 检查死亡条件
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 将新头加入蛇身
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        // 增加难度 (速度加快)
        if (currentSpeed > MIN_SPEED) {
            currentSpeed -= SPEED_DECREMENT;
        }
        
        generateFood();
        // 吃到食物不移除蛇尾，实现增长
    } else {
        // 没吃到食物，移除蛇尾，维持长度不变
        snake.pop();
    }
}

// 碰撞检测
function checkCollision(head) {
    // 撞墙检测
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        return true;
    }
    
    // 撞自身检测 (从索引 1 开始，因为索引 0 是新的蛇头)
    // 注意：如果是刚刚生成的头，它还没有真正渲染，但逻辑上已经存在
    // 这里我们要检查的是：新头的位置是否与当前蛇身（不包括尾巴，因为尾巴会移走）重叠
    // 但在 update 中我们先 unshift 了 head，再 pop tail。
    // 如果没有吃到食物，tail 会被 pop，所以如果 head 撞到了 tail 的位置其实是安全的。
    // 简单起见，我们遍历除头以外的所有身体部分
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 生成食物
function generateFood() {
    let validPosition = false;
    while (!validPosition) {
        food.x = Math.floor(Math.random() * TILE_COUNT);
        food.y = Math.floor(Math.random() * TILE_COUNT);
        
        // 确保食物不生成在蛇身上
        validPosition = true;
        for (let part of snake) {
            if (part.x === food.x && part.y === food.y) {
                validPosition = false;
                break;
            }
        }
    }
}

// 绘制游戏画面
function draw() {
    // 清空画布
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制食物
    ctx.fillStyle = '#ff5252';
    ctx.beginPath();
    // 稍微画小一点，留出间隙
    const padding = 2;
    ctx.fillRect(
        food.x * GRID_SIZE + padding, 
        food.y * GRID_SIZE + padding, 
        GRID_SIZE - 2 * padding, 
        GRID_SIZE - 2 * padding
    );
    
    // 绘制蛇
    snake.forEach((part, index) => {
        // 蛇头颜色不同
        ctx.fillStyle = index === 0 ? '#81c784' : '#4caf50';
        ctx.fillRect(
            part.x * GRID_SIZE + 1, 
            part.y * GRID_SIZE + 1, 
            GRID_SIZE - 2, 
            GRID_SIZE - 2
        );
        
        // 可选：给蛇头画眼睛
        if (index === 0) {
            ctx.fillStyle = '#000';
            // 根据方向画眼睛会更生动，这里简化处理
            const eyeSize = 4;
            const eyeOffset = 5;
            // 简单画两个点
            ctx.fillRect(part.x * GRID_SIZE + eyeOffset, part.y * GRID_SIZE + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(part.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize, part.y * GRID_SIZE + eyeOffset, eyeSize, eyeSize);
        }
    });
}

// 游戏结束
function gameOver() {
    isGameRunning = false;
    finalScoreElement.textContent = score;
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    gameOverScreen.classList.remove('hidden');
}

// 键盘控制
function handleInput(e) {
    if (startScreen.classList.contains('hidden') === false && e.code === 'Enter') {
        initGame();
        return;
    }
    
    if (!isGameRunning) return;
    
    // 暂停功能
    if (e.code === 'Space') {
        isPaused = !isPaused;
        if (isPaused) {
            pauseScreen.classList.remove('hidden');
        } else {
            pauseScreen.classList.add('hidden');
        }
        return;
    }
    
    if (isPaused) return;

    // 防止反向移动
    // 注意：这里需要防止在一个 tick 内连续快速按键导致的自杀
    // 例如：当前向右，快速按上再按左，如果逻辑更新不够快，就会在向上的状态下判定向左合法，结果撞到自己
    // 简单的解决方案是记录"上一次移动的方向"而不是"当前想要移动的方向"
    // 但为了响应性，我们通常允许覆盖输入，或者简单处理
    // 严谨做法：在每一帧 update 之后才允许下一次改变方向。
    // 这里简单实现：
    
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingLeft = dx === -1;
    const goingRight = dx === 1;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (!goingDown) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (!goingUp) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (!goingRight) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (!goingLeft) { dx = 1; dy = 0; }
            break;
    }
}

// 事件监听
window.addEventListener('keydown', handleInput);
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// 移动端按钮控制
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

function handleMobileInput(direction) {
    if (!isGameRunning) return;
    if (isPaused) return;

    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingLeft = dx === -1;
    const goingRight = dx === 1;

    switch (direction) {
        case 'up':
            if (!goingDown) { dx = 0; dy = -1; }
            break;
        case 'down':
            if (!goingUp) { dx = 0; dy = 1; }
            break;
        case 'left':
            if (!goingRight) { dx = -1; dy = 0; }
            break;
        case 'right':
            if (!goingLeft) { dx = 1; dy = 0; }
            break;
    }
}

// 绑定触摸事件 (使用 touchstart 以获得更快的响应)
if (btnUp) {
    btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); handleMobileInput('up'); });
    btnUp.addEventListener('click', () => handleMobileInput('up')); // 兼容非触摸设备点击
}
if (btnDown) {
    btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); handleMobileInput('down'); });
    btnDown.addEventListener('click', () => handleMobileInput('down'));
}
if (btnLeft) {
    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); handleMobileInput('left'); });
    btnLeft.addEventListener('click', () => handleMobileInput('left'));
}
if (btnRight) {
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); handleMobileInput('right'); });
    btnRight.addEventListener('click', () => handleMobileInput('right'));
}

// 初始渲染一次背景
draw();