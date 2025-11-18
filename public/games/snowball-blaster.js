/* ========================================
   SNOWBALL BLASTER - BREAKOUT GAME
   ======================================== */

const GAME_NAME = 'snowball-blaster';

let gameState = {
    // Ball
    ball: {
        x: 0,
        y: 0,
        radius: 8,
        velocityX: 0,
        velocityY: 0,
        speed: 4,
        launched: false
    },
    
    // Paddle
    paddle: {
        x: 0,
        y: 0,
        width: 120,
        height: 15,
        speed: 8
    },
    
    // Game state
    bricks: [],
    lives: 3,
    score: 0,
    level: 1,
    totalBricksDestroyed: 0,
    timeLimit: 120,
    timeRemaining: 120,
    gameStartTime: null,
    
    // Power-ups
    powerUps: [],
    activePowerUps: [],
    balls: [], // Additional balls for multi-ball power-up
    timeBonusUsed: false, // Track if time bonus was already given this level
    
    // Canvas
    canvas: null,
    ctx: null,
    
    // Input
    keys: {},
    touchX: null,
    mouse: { x: 0, down: false },
    
    // Combo system
    combo: 0,
    comboMultiplier: 1
};

let timerInterval = null;
let particles = [];
let comboTexts = [];

// Power-Up Types
const POWER_UP_TYPES = [
    { id: 'multiball', icon: '🎁', name: 'Doppelball', color: '#FF6B6B', duration: 0 },
    { id: 'widepaddle', icon: '🎁', name: 'Breite Plattform', color: '#4ECDC4', duration: 10000 },
    { id: 'laser', icon: '🎁', name: 'Laser-Kanone', color: '#FFD93D', duration: 10000 },
    { id: 'slowmo', icon: '🎁', name: 'Zeitlupe', color: '#A8E6CF', duration: 10000 },
    { id: 'magnetball', icon: '🎁', name: 'Magnet-Ball', color: '#FF8B94', duration: 10000 },
    { id: 'fireball', icon: '🎁', name: 'Feuerball', color: '#FFA500', duration: 10000 },
    { id: 'timebonus', icon: '🎁', name: '+30 Sekunden', color: '#9B59B6', duration: 0 }
];

// Brick colors
const BRICK_COLORS = [
    { color: '#FF6B6B', dark: '#E05555' }, // Red
    { color: '#4ECDC4', dark: '#3CB7AF' }, // Cyan
    { color: '#FFE66D', dark: '#F0D754' }, // Yellow
    { color: '#95E1D3', dark: '#7FCEC0' }, // Mint
    { color: '#F38181', dark: '#E86A6A' }, // Pink
    { color: '#AA96DA', dark: '#9780C8' }, // Purple
    { color: '#FCBAD3', dark: '#F0A1C3' }, // Light Pink
    { color: '#A8D8EA', dark: '#90C6D8' }  // Light Blue
];

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', restartGame);
});

async function startGame() {
    // Username sicherstellen
    if (typeof statsManager !== 'undefined') {
        try {
            await statsManager.ensureUsername();
        } catch (error) {
            console.warn('Username prompt failed:', error);
        }
    }

    document.getElementById('startOverlay').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'flex';

    initGame();
}

function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    gameState.canvas = canvas;
    gameState.ctx = ctx;
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Reset game state
    gameState.lives = 3;
    gameState.score = 0;
    gameState.level = 1;
    gameState.totalBricksDestroyed = 0;
    gameState.timeLimit = 120;
    gameState.timeRemaining = 120;
    gameState.gameStartTime = Date.now();
    
    // Initialize paddle (mittig)
    gameState.paddle.x = canvas.width / 2;
    gameState.paddle.y = canvas.height - 100;
    
    // Initialize ball (auf Paddle mittig)
    gameState.ball.launched = false;
    gameState.ball.x = canvas.width / 2;
    gameState.ball.y = canvas.height - 100 - gameState.ball.radius - 5;
    gameState.ball.velocityX = 0;
    gameState.ball.velocityY = 0;
    
    // Generate first level
    generateLevel(1);
    
    // Setup controls
    setupControls();
    
    // Initialize mouse position to center
    gameState.mouse.x = canvas.width / 2;
    
    // Start game loop
    startTimer();
    updateHUD();
    gameLoop();
}

function resizeCanvas() {
    const canvas = gameState.canvas;
    const hud = document.querySelector('.hud');
    const hudHeight = hud ? hud.offsetHeight : 60;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - hudHeight - 10;
    
    // Reposition paddle and ball wenn canvas sich ändert
    if (gameState.paddle.y > 0) {
        gameState.paddle.x = canvas.width / 2;
        gameState.paddle.y = canvas.height - 100;
        if (!gameState.ball.launched) {
            gameState.ball.x = gameState.paddle.x;
            gameState.ball.y = gameState.paddle.y - gameState.ball.radius - 5;
        }
    }
}

function resetBall() {
    gameState.ball.launched = false;
    gameState.ball.x = gameState.paddle.x;
    gameState.ball.y = gameState.paddle.y - gameState.ball.radius - 5;
    gameState.ball.velocityX = 0;
    gameState.ball.velocityY = 0;
}

// ========================================
// LEVEL GENERATION
// ========================================
function generateLevel(level) {
    const canvas = gameState.canvas;
    const bricks = [];
    
    const rows = Math.min(5 + level, 10);
    const cols = 8;
    const brickWidth = (canvas.width - 40) / cols;
    const brickHeight = 25;
    const padding = 5;
    const offsetTop = 60;
    const offsetLeft = 20;
    
    // Different patterns based on level
    const patterns = [
        // Level 1: Full grid
        (r, c) => true,
        
        // Level 2: Checkerboard
        (r, c) => (r + c) % 2 === 0,
        
        // Level 3: Diamond
        (r, c) => {
            const centerR = rows / 2;
            const centerC = cols / 2;
            return Math.abs(r - centerR) + Math.abs(c - centerC) < rows / 2 + 2;
        },
        
        // Level 4: Pyramid
        (r, c) => {
            const leftBound = Math.floor(r / 2);
            const rightBound = cols - Math.floor(r / 2) - 1;
            return c >= leftBound && c <= rightBound;
        },
        
        // Level 5: Cross
        (r, c) => r === Math.floor(rows / 2) || c === Math.floor(cols / 2),
        
        // Level 6+: Random complex patterns
        (r, c) => {
            const val = (r * cols + c + level) % 3;
            return val !== 0;
        }
    ];
    
    const patternIndex = Math.min(level - 1, patterns.length - 1);
    const pattern = patterns[patternIndex];
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (pattern(r, c)) {
                const colorSet = BRICK_COLORS[(r + c) % BRICK_COLORS.length];
                bricks.push({
                    x: offsetLeft + c * brickWidth,
                    y: offsetTop + r * (brickHeight + padding),
                    width: brickWidth - padding,
                    height: brickHeight,
                    color: colorSet.color,
                    darkColor: colorSet.dark,
                    visible: true
                });
            }
        }
    }
    
    gameState.bricks = bricks;
}

// ========================================
// CONTROLS
// ========================================
function setupControls() {
    const canvas = gameState.canvas;
    
    // Touch controls
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Mouse controls
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    // Keyboard
    document.addEventListener('keydown', (e) => gameState.keys[e.key] = true);
    document.addEventListener('keyup', (e) => gameState.keys[e.key] = false);
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = gameState.canvas.getBoundingClientRect();
    gameState.touchX = touch.clientX - rect.left;
    
    // Launch ball
    if (!gameState.ball.launched) {
        launchBall();
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (gameState.touchX !== null) {
        const touch = e.touches[0];
        const rect = gameState.canvas.getBoundingClientRect();
        gameState.touchX = touch.clientX - rect.left;
    }
}

function handleTouchEnd(e) {
    gameState.touchX = null;
}

function handleMouseMove(e) {
    const rect = gameState.canvas.getBoundingClientRect();
    gameState.mouse.x = e.clientX - rect.left;
}

function handleMouseDown(e) {
    gameState.mouse.down = true;
    if (!gameState.ball.launched) {
        launchBall();
    }
}

function handleMouseUp(e) {
    gameState.mouse.down = false;
}

function launchBall() {
    gameState.ball.launched = true;
    
    // Random angle zwischen -60 und 60 Grad
    const angle = (Math.random() * 120 - 60) * Math.PI / 180;
    gameState.ball.velocityX = gameState.ball.speed * Math.sin(angle);
    gameState.ball.velocityY = -gameState.ball.speed * Math.cos(angle);
}

// ========================================
// GAME LOOP
// ========================================
function gameLoop() {
    if (gameState.timeRemaining <= 0 || gameState.lives <= 0) {
        endGame();
        return;
    }
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update paddle
    updatePaddle();
    
    // Update ball
    if (gameState.ball.launched) {
        updateBall();
    } else {
        // Ball follows paddle
        gameState.ball.x = gameState.paddle.x;
        gameState.ball.y = gameState.paddle.y - gameState.ball.radius - 5;
    }
    
    // Update particles
    updateParticles();
    updateComboTexts();
    updatePowerUps();
    
    // Laser shooting
    const laserPowerUp = gameState.activePowerUps.find(p => p.type === 'laser');
    if (laserPowerUp && Date.now() - laserPowerUp.lastShot > 500) {
        shootLaser();
        laserPowerUp.lastShot = Date.now();
    }
    
    // Update extra balls
    gameState.balls = gameState.balls.filter((ball, index) => {
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;
        
        // Wall collisions
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= gameState.canvas.width) {
            ball.velocityX = -ball.velocityX;
        }
        if (ball.y - ball.radius <= 0) {
            ball.velocityY = Math.abs(ball.velocityY);
        }
        
        // Paddle collision
        checkExtraBallPaddleCollision(ball);
        
        // Brick collisions
        checkBallBrickCollisions(ball);
        
        // Remove if falls off screen (no life loss for extra balls)
        return ball.y < gameState.canvas.height;
    });
    
    // Check for level complete
    const visibleBricks = gameState.bricks.filter(b => b.visible).length;
    if (visibleBricks === 0) {
        nextLevel();
    }
}

function updatePaddle() {
    const canvas = gameState.canvas;
    
    // Touch control
    if (gameState.touchX !== null) {
        gameState.paddle.x = gameState.touchX;
    }
    // Mouse control
    else {
        gameState.paddle.x = gameState.mouse.x;
    }
    
    // Keyboard control
    if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
        gameState.paddle.x -= gameState.paddle.speed;
    }
    if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
        gameState.paddle.x += gameState.paddle.speed;
    }
    
    // Bounds
    gameState.paddle.x = Math.max(gameState.paddle.width / 2, 
                                   Math.min(canvas.width - gameState.paddle.width / 2, gameState.paddle.x));
}

function updateBall() {
    const ball = gameState.ball;
    const canvas = gameState.canvas;
    
    // Update position
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    // Wall collision (left/right)
    if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.velocityX = Math.abs(ball.velocityX);
    }
    if (ball.x + ball.radius >= canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.velocityX = -Math.abs(ball.velocityX);
    }
    
    // Ceiling collision
    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.velocityY = Math.abs(ball.velocityY);
    }
    
    // Paddle collision
    checkPaddleCollision();
    
    // Brick collisions
    checkBrickCollisions();
    
    // Ball falls below paddle - lose life
    if (ball.y - ball.radius > canvas.height) {
        loseLife();
    }
}

function checkPaddleCollision() {
    const ball = gameState.ball;
    const paddle = gameState.paddle;
    
    // Simple AABB collision with circle
    if (ball.y + ball.radius >= paddle.y - paddle.height / 2 &&
        ball.y - ball.radius <= paddle.y + paddle.height / 2 &&
        ball.x >= paddle.x - paddle.width / 2 &&
        ball.x <= paddle.x + paddle.width / 2) {
        
        // Reflect ball
        ball.y = paddle.y - paddle.height / 2 - ball.radius;
        
        // Add spin based on hit position
        const hitPos = (ball.x - paddle.x) / (paddle.width / 2);
        ball.velocityX = hitPos * ball.speed * 0.8;
        ball.velocityY = -Math.abs(ball.velocityY);
        
        // Ensure minimum vertical speed
        if (Math.abs(ball.velocityY) < ball.speed * 0.5) {
            ball.velocityY = -ball.speed * 0.7;
        }
        
        // Reset combo on paddle hit (new flight phase)
        gameState.combo = 0;
        gameState.comboMultiplier = 1;
        updateHUD();
    }
}

function checkBrickCollisions() {
    const ball = gameState.ball;
    
    for (let brick of gameState.bricks) {
        if (!brick.visible) continue;
        
        // AABB collision
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        if (distance < ball.radius) {
            brick.visible = false;
            
            // Combo system
            gameState.combo++;
            gameState.comboMultiplier = Math.floor(gameState.combo / 3) + 1;
            
            const points = 10 * gameState.comboMultiplier;
            gameState.score += points;
            gameState.totalBricksDestroyed++;
            
            createBrickParticles(brick);
            showComboText(brick.x + brick.width / 2, brick.y + brick.height / 2, points, gameState.comboMultiplier);
            
            // 20% chance to drop power-up
            if (Math.random() < 0.2) {
                dropPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
            }
            
            updateHUD();
            
            // Determine bounce direction
            const brickCenterX = brick.x + brick.width / 2;
            const brickCenterY = brick.y + brick.height / 2;
            
            const deltaX = ball.x - brickCenterX;
            const deltaY = ball.y - brickCenterY;
            
            // Bounce based on which side was hit
            if (Math.abs(deltaX / brick.width) > Math.abs(deltaY / brick.height)) {
                // Hit from side
                ball.velocityX = -ball.velocityX;
            } else {
                // Hit from top/bottom
                ball.velocityY = -ball.velocityY;
            }
            
            break; // Only one brick per frame
        }
    }
}

function loseLife() {
    gameState.lives--;
    gameState.combo = 0;
    gameState.comboMultiplier = 1;
    updateHUD();
    
    if (gameState.lives > 0) {
        resetBall();
    } else {
        endGame();
    }
}

function nextLevel() {
    gameState.level++;
    gameState.timeLimit = gameState.timeLimit + 60; // +60 Sekunden pro Level
    gameState.timeRemaining = gameState.timeLimit;
    gameState.combo = 0;
    gameState.comboMultiplier = 1;
    
    generateLevel(gameState.level);
    resetBall();
    updateHUD();
}   updateHUD();
}

// ========================================
// PARTICLE SYSTEM
// ========================================
function createBrickParticles(brick) {
    const particleCount = 8;
    const centerX = brick.x + brick.width / 2;
    const centerY = brick.y + brick.height / 2;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            life: 1.0,
            color: brick.color,
            size: 4
        });
    }
}

function showComboText(x, y, points, multiplier) {
    comboTexts.push({
        x: x,
        y: y,
        text: multiplier > 1 ? `+${points} (x${multiplier})` : `+${points}`,
        life: 1.0,
        multiplier: multiplier
    });
}

function dropPowerUp(x, y) {
    let availableTypes = POWER_UP_TYPES.filter(t => t.id !== 'timebonus');
    
    // 15% chance for time bonus if not yet used this level
    if (!gameState.timeBonusUsed && Math.random() < 0.15) {
        const timeBonus = POWER_UP_TYPES.find(t => t.id === 'timebonus');
        availableTypes = [timeBonus];
    }
    
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    gameState.powerUps.push({
        x: x,
        y: y,
        width: 40,
        height: 40,
        velocity: 2,
        type: type
    });
}

function activatePowerUp(type) {
    showPowerUpText(type.name);
    
    switch(type.id) {
        case 'multiball':
            // Create additional ball
            const angle = (Math.random() * 60 - 30) * Math.PI / 180;
            gameState.balls.push({
                x: gameState.ball.x,
                y: gameState.ball.y,
                radius: gameState.ball.radius,
                velocityX: gameState.ball.speed * Math.sin(angle),
                velocityY: -gameState.ball.speed * Math.cos(angle),
                speed: gameState.ball.speed
            });
            break;
            
        case 'widepaddle':
            gameState.activePowerUps.push({
                type: 'widepaddle',
                duration: type.duration,
                remaining: type.duration,
                originalWidth: gameState.paddle.width
            });
            gameState.paddle.width = gameState.canvas.width;
            break;
            
        case 'laser':
            gameState.activePowerUps.push({
                type: 'laser',
                duration: type.duration,
                remaining: type.duration,
                lastShot: Date.now()
            });
            break;
            
        case 'slowmo':
            gameState.activePowerUps.push({
                type: 'slowmo',
                duration: type.duration,
                remaining: type.duration,
                originalSpeed: gameState.ball.speed
            });
            gameState.ball.speed *= 0.5;
            gameState.balls.forEach(b => b.speed *= 0.5);
            break;
            
        case 'magnetball':
            gameState.activePowerUps.push({
                type: 'magnetball',
                duration: type.duration,
                remaining: type.duration
            });
            break;
            
        case 'fireball':
            gameState.activePowerUps.push({
                type: 'fireball',
                duration: type.duration,
                remaining: type.duration
            });
            break;
            
        case 'timebonus':
            gameState.timeRemaining += 30;
            gameState.timeBonusUsed = true;
            updateHUD();
            break;
    }
}

function showPowerUpText(text) {
    comboTexts.push({
        x: gameState.canvas.width / 2,
        y: gameState.canvas.height / 2,
        text: text,
        life: 1.5,
        multiplier: 999 // Special marker for power-up text
    });
}

function updateParticles() {
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (!p.isLaser) {
            p.vy += 0.2; // Gravity for normal particles
        }
        
        p.life -= 0.02;
        
        // Laser collision with bricks
        if (p.isLaser) {
            for (let brick of gameState.bricks) {
                if (!brick.visible) continue;
                
                if (p.x >= brick.x && p.x <= brick.x + brick.width &&
                    p.y >= brick.y && p.y <= brick.y + brick.height) {
                    brick.visible = false;
                    gameState.score += 10;
                    gameState.totalBricksDestroyed++;
                    createBrickParticles(brick);
                    p.life = 0; // Destroy laser
                    break;
                }
            }
        }
    });
    
    particles = particles.filter(p => p.life > 0);
}

function updateComboTexts() {
    comboTexts.forEach(t => {
        t.y -= 1;
        t.life -= 0.015;
    });
    
    comboTexts = comboTexts.filter(t => t.life > 0);
}

function updatePowerUps() {
    const canvas = gameState.canvas;
    const ball = gameState.ball;
    
    // Move power-ups down
    gameState.powerUps.forEach(p => {
        p.y += p.velocity;
    });
    
    // Check collision with ball
    gameState.powerUps = gameState.powerUps.filter(p => {
        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < ball.radius + p.width / 2) {
            activatePowerUp(p.type);
            return false; // Remove power-up
        }
        
        // Remove if off screen
        return p.y < canvas.height;
    });
    
    // Update active power-ups
    gameState.activePowerUps = gameState.activePowerUps.filter(p => {
        if (p.duration > 0) {
            p.remaining -= 16; // ~60fps
            
            // Deactivate when time runs out
            if (p.remaining <= 0) {
                deactivatePowerUp(p);
                return false;
            }
        }
        return true;
    });
}

function deactivatePowerUp(powerUp) {
    switch(powerUp.type) {
        case 'widepaddle':
            gameState.paddle.width = powerUp.originalWidth;
            break;
        case 'slowmo':
            gameState.ball.speed = powerUp.originalSpeed;
            gameState.balls.forEach(b => b.speed = powerUp.originalSpeed);
            break;
    }
}

function drawParticles() {
    const ctx = gameState.ctx;
    
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawComboTexts() {
    const ctx = gameState.ctx;
    
    comboTexts.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.life;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Glow effect
        if (t.multiplier === 999) {
            // Power-up text
            ctx.shadowColor = '#00FF00';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 28px Arial';
        } else if (t.multiplier > 1) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#FFD700';
        } else {
            ctx.fillStyle = '#FFFFFF';
        }
        
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    });
}

function shootLaser() {
    const paddle = gameState.paddle;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 4;
    
    particles.push({
        x: paddle.x,
        y: paddle.y - paddle.height,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        life: 2.0,
        color: '#FFD93D',
        size: 3,
        isLaser: true
    });
}

function checkExtraBallPaddleCollision(ball) {
    const paddle = gameState.paddle;
    
    if (ball.y + ball.radius >= paddle.y - paddle.height / 2 &&
        ball.y - ball.radius <= paddle.y + paddle.height / 2 &&
        ball.x >= paddle.x - paddle.width / 2 &&
        ball.x <= paddle.x + paddle.width / 2) {
        
        ball.y = paddle.y - paddle.height / 2 - ball.radius;
        const hitPos = (ball.x - paddle.x) / (paddle.width / 2);
        ball.velocityX = hitPos * ball.speed * 0.8;
        ball.velocityY = -Math.abs(ball.velocityY);
    }
}

function checkBallBrickCollisions(ball) {
    for (let brick of gameState.bricks) {
        if (!brick.visible) continue;
        
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        if (distance < ball.radius) {
            brick.visible = false;
            gameState.score += 10 * gameState.comboMultiplier;
            gameState.totalBricksDestroyed++;
            createBrickParticles(brick);
            
            const deltaX = ball.x - (brick.x + brick.width / 2);
            const deltaY = ball.y - (brick.y + brick.height / 2);
            
            if (Math.abs(deltaX / brick.width) > Math.abs(deltaY / brick.height)) {
                ball.velocityX = -ball.velocityX;
            } else {
                ball.velocityY = -ball.velocityY;
            }
            
            break;
        }
    }
}

// ========================================
// DRAWING
// ========================================
function draw() {
    const ctx = gameState.ctx;
    const canvas = gameState.canvas;
    
    // Clear with dark background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw bricks
    gameState.bricks.forEach(brick => {
        if (brick.visible) {
            drawBrick(brick);
        }
    });
    
    // Draw particles
    drawParticles();
    drawComboTexts();
    
    // Draw power-ups
    drawPowerUps();
    
    // Draw paddle
    drawPaddle();
    
    // Draw ball
    drawBall();
    
    // Draw extra balls
    gameState.balls.forEach(ball => {
        drawExtraBall(ball);
    });
}

function drawPowerUps() {
    const ctx = gameState.ctx;
    
    gameState.powerUps.forEach(p => {
        ctx.save();
        
        // Shadow/glow
        ctx.shadowColor = p.type.color;
        ctx.shadowBlur = 15;
        
        // Gift box body
        const gradient = ctx.createLinearGradient(
            p.x - p.width/2, p.y - p.height/2,
            p.x + p.width/2, p.y + p.height/2
        );
        gradient.addColorStop(0, p.type.color);
        gradient.addColorStop(1, adjustBrightness(p.type.color, -20));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(p.x - p.width/2, p.y - p.height/2, p.width, p.height);
        
        // Ribbon (horizontal)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(p.x - p.width/2, p.y - 3, p.width, 6);
        
        // Ribbon (vertical)
        ctx.fillRect(p.x - 3, p.y - p.height/2, 6, p.height);
        
        // Bow on top
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(p.x - 8, p.y - p.height/2 - 5, 5, 0, Math.PI * 2);
        ctx.arc(p.x + 8, p.y - p.height/2 - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Bow center
        ctx.fillRect(p.x - 3, p.y - p.height/2 - 8, 6, 6);
        
        ctx.restore();
    });
}

function adjustBrightness(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

function drawExtraBall(ball) {
    const ctx = gameState.ctx;
    
    // Same as main ball
    const gradient = ctx.createRadialGradient(
        ball.x - ball.radius / 3, ball.y - ball.radius / 3, 0,
        ball.x, ball.y, ball.radius
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.7, '#E8F4F8');
    gradient.addColorStop(1, '#B0D4E3');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius / 3, ball.y - ball.radius / 3, ball.radius / 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawBrick(brick) {
    const ctx = gameState.ctx;
    
    // Main brick with gradient for glass effect
    const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
    gradient.addColorStop(0, brick.color);
    gradient.addColorStop(0.5, brick.darkColor);
    gradient.addColorStop(1, brick.color);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    
    // Ice/Glass shine effect (top highlight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height * 0.3);
    
    // Ice crystals effect (diagonal lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(brick.x, brick.y + brick.height * 0.3);
    ctx.lineTo(brick.x + brick.width * 0.3, brick.y);
    ctx.moveTo(brick.x + brick.width * 0.5, brick.y + brick.height);
    ctx.lineTo(brick.x + brick.width, brick.y + brick.height * 0.5);
    ctx.stroke();
    
    // Frozen border
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    
    // Inner glow
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = 8;
    ctx.strokeRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4);
    ctx.shadowBlur = 0;
}

function drawPaddle() {
    const ctx = gameState.ctx;
    const paddle = gameState.paddle;
    
    // Gradient paddle
    const gradient = ctx.createLinearGradient(
        paddle.x - paddle.width / 2, 0,
        paddle.x + paddle.width / 2, 0
    );
    gradient.addColorStop(0, '#4ECDC4');
    gradient.addColorStop(0.5, '#44A1A0');
    gradient.addColorStop(1, '#4ECDC4');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
        paddle.x - paddle.width / 2,
        paddle.y - paddle.height / 2,
        paddle.width,
        paddle.height
    );
    
    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        paddle.x - paddle.width / 2,
        paddle.y - paddle.height / 2,
        paddle.width,
        paddle.height
    );
}

function drawBall() {
    const ctx = gameState.ctx;
    const ball = gameState.ball;
    
    // Snowball with gradient
    const gradient = ctx.createRadialGradient(
        ball.x - ball.radius / 3, ball.y - ball.radius / 3, 0,
        ball.x, ball.y, ball.radius
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.7, '#E8F4F8');
    gradient.addColorStop(1, '#B0D4E3');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius / 3, ball.y - ball.radius / 3, ball.radius / 3, 0, Math.PI * 2);
    ctx.fill();
}

// ========================================
// HUD & TIMER
// ========================================
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        updateTimer();
    }, 1000);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
    gameState.timeRemaining = gameState.timeLimit - elapsed;
    
    if (gameState.timeRemaining <= 0) {
        gameState.timeRemaining = 0;
        endGame();
        return;
    }
    
    updateHUD();
}

function updateHUD() {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    document.getElementById('timer').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('score').textContent = gameState.score;
    
    // Combo display (always visible)
    const comboDisplay = document.getElementById('comboDisplay');
    const comboText = document.getElementById('combo');
    comboDisplay.style.display = 'flex';
    comboText.textContent = `x${gameState.comboMultiplier}`;
    
    if (gameState.comboMultiplier > 1) {
        comboText.style.color = '#FFD700';
        comboText.style.textShadow = '0 0 10px #FFD700';
    } else {
        comboText.style.color = '#FFFFFF';
        comboText.style.textShadow = 'none';
    }
}

// ========================================
// GAME END
// ========================================
async function endGame() {
    if (timerInterval) clearInterval(timerInterval);
    
    const totalTime = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
    
    // Stats anzeigen
    document.getElementById('finalLevel').textContent = gameState.level;
    document.getElementById('finalBricks').textContent = gameState.totalBricksDestroyed;
    document.getElementById('finalTime').textContent = `${totalTime}s`;
    document.getElementById('finalScore').textContent = gameState.score;
    
    // Speichern
    if (typeof statsManager !== 'undefined') {
        try {
            await statsManager.saveStats(GAME_NAME, gameState.score, totalTime);
            await loadTop3();
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }
    
    // Overlay anzeigen
    document.getElementById('gameoverOverlay').style.display = 'flex';
}

async function loadTop3() {
    const top3List = document.getElementById('top3List');
    
    try {
        const top3 = await statsManager.getTop3(GAME_NAME);
        
        if (top3 && top3.length > 0) {
            const medals = ['🥇', '🥈', '🥉'];
            const classes = ['gold', 'silver', 'bronze'];
            
            top3List.innerHTML = top3.map((entry, index) => `
                <div class="top3-item ${classes[index] || ''}">
                    <span class="top3-medal">${medals[index] || '🏅'}</span>
                    <span class="top3-name">${entry.username}</span>
                    <span class="top3-score">${entry.highscore || entry.score || 0} Pkt</span>
                </div>
            `).join('');
        } else {
            top3List.innerHTML = '<div class="no-scores">Noch keine Highscores vorhanden.</div>';
        }
    } catch (error) {
        console.error('Error loading top 3:', error);
        top3List.innerHTML = '<div class="no-scores">Fehler beim Laden der Highscores.</div>';
    }
}

function restartGame() {
    document.getElementById('gameoverOverlay').style.display = 'none';
    initGame();
}
