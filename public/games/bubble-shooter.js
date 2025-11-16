// Christmas Bubble Shooter Game
const GAME_NAME = 'bubble-shooter';

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Configuration
const CONFIG = {
    BUBBLE_RADIUS: 20,
    BUBBLE_SPACING: 5,
    ROWS: 8,
    COLS: 9, // Reduced from 11 to 9 for larger bubbles that fit
    GRID_OFFSET_X: 0,
    SHOOTER_Y_OFFSET: 80,
    AIM_LINE_LENGTH: 150,
    AIM_SPEED: 0.02,
    BUBBLE_SPEED: 12,
    GRAVITY: 0.5,
    TIME_LIMIT: 60,
    COLORS: [
        { name: 'red', color: '#ff4444', symbol: '●' },
        { name: 'blue', color: '#4444ff', symbol: '■' },
        { name: 'green', color: '#44ff44', symbol: '▲' },
        { name: 'yellow', color: '#ffff44', symbol: '★' }
    ]
};

// Game State
let gameState = {
    bubbles: [],
    shooter: { x: 0, y: 0, currentBubble: null },
    flyingBubble: null,
    aimAngle: -Math.PI / 2,
    aimDirection: 1,
    score: 0,
    level: 1,
    timeLeft: CONFIG.TIME_LIMIT,
    gameRunning: false,
    startTime: null,
    particles: [],
    animations: []
};

// Resize canvas
function resizeCanvas() {
    // Fullscreen canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Dynamische Spaltenanzahl basierend auf der Bildschirmbreite
    const minBubbleRadius = 28;
    const maxBubbleRadius = 40;
    const margin = 30;
    const availableWidth = canvas.width - (margin * 2);
    
    // Berechne optimale Spaltenanzahl (6-10 Spalten je nach Breite)
    let optimalCols = Math.floor(availableWidth / ((maxBubbleRadius * 2) + CONFIG.BUBBLE_SPACING));
    optimalCols = Math.max(6, Math.min(10, optimalCols));
    CONFIG.COLS = optimalCols;
    
    // Bubble-Radius zwischen 28px und 40px
    const bubbleWidth = availableWidth / CONFIG.COLS;
    CONFIG.BUBBLE_RADIUS = Math.max(minBubbleRadius, Math.min(maxBubbleRadius, Math.floor((bubbleWidth - CONFIG.BUBBLE_SPACING) / 2)));
    
    // Calculate total grid width
    const gridWidth = CONFIG.COLS * (CONFIG.BUBBLE_RADIUS * 2 + CONFIG.BUBBLE_SPACING);
    
    // Center the grid horizontally
    CONFIG.GRID_OFFSET_X = (canvas.width - gridWidth) / 2;
    
    // Update shooter position
    gameState.shooter.x = canvas.width / 2;
    gameState.shooter.y = canvas.height - CONFIG.SHOOTER_Y_OFFSET;
    
    // Recalculate all bubble positions if game is running
    if (gameState.bubbles && gameState.bubbles.length > 0) {
        for (let bubble of gameState.bubbles) {
            bubble.radius = CONFIG.BUBBLE_RADIUS;
            bubble.x = bubble.calculateX();
            bubble.y = bubble.calculateY();
        }
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.life = 1;
        this.size = Math.random() * 8 + 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3; // gravity
        this.life -= 0.02;
        this.size *= 0.97;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Bubble Class
class Bubble {
    constructor(row, col, colorIndex) {
        this.row = row;
        this.col = col;
        this.colorIndex = colorIndex;
        this.x = this.calculateX();
        this.y = this.calculateY();
        this.radius = CONFIG.BUBBLE_RADIUS;
        this.falling = false;
        this.vy = 0;
        this.marked = false;
    }

    calculateX() {
        const offset = (this.row % 2) * (CONFIG.BUBBLE_RADIUS + CONFIG.BUBBLE_SPACING / 2);
        return CONFIG.GRID_OFFSET_X + offset + CONFIG.BUBBLE_RADIUS + this.col * (CONFIG.BUBBLE_RADIUS * 2 + CONFIG.BUBBLE_SPACING);
    }

    calculateY() {
        return CONFIG.BUBBLE_RADIUS + this.row * (CONFIG.BUBBLE_RADIUS * 2 + CONFIG.BUBBLE_SPACING);
    }

    draw(ctx) {
        const color = CONFIG.COLORS[this.colorIndex];
        
        // Bubble shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bubble gradient
        const gradient = ctx.createRadialGradient(
            this.x - this.radius / 3,
            this.y - this.radius / 3,
            0,
            this.x,
            this.y,
            this.radius
        );
        gradient.addColorStop(0, this.lightenColor(color.color, 40));
        gradient.addColorStop(0.7, color.color);
        gradient.addColorStop(1, this.darkenColor(color.color, 20));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = this.darkenColor(color.color, 30);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius / 3, this.y - this.radius / 3, this.radius / 3, 0, Math.PI * 2);
        ctx.fill();

        // Symbol
        ctx.font = `${this.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Symbol Shadow for contrast
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(color.symbol, this.x, this.y);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    update() {
        if (this.falling) {
            this.vy += CONFIG.GRAVITY;
            this.y += this.vy;
        }
    }
}

// Flying Bubble
class FlyingBubble extends Bubble {
    constructor(x, y, colorIndex, vx, vy) {
        super(0, 0, colorIndex);
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wall collision
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = -this.vx;
        }
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.vx = -this.vx;
        }

        // Check collision with existing bubbles
        return this.checkCollision();
    }

    checkCollision() {
        // Check ceiling
        if (this.y - this.radius <= 0) {
            return this.snapToGrid();
        }

        // Check collision with other bubbles
        for (let bubble of gameState.bubbles) {
            const dx = this.x - bubble.x;
            const dy = this.y - bubble.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.radius * 2) {
                return this.snapToGrid();
            }
        }

        return null;
    }

    snapToGrid() {
        // Find nearest grid position
        let bestRow = -1;
        let bestCol = -1;
        let minDist = Infinity;

        for (let row = 0; row < CONFIG.ROWS; row++) {
            for (let col = 0; col < CONFIG.COLS; col++) {
                // Check if position is occupied
                if (gameState.bubbles.some(b => b.row === row && b.col === col)) {
                    continue;
                }

                const testBubble = new Bubble(row, col, 0);
                const dx = this.x - testBubble.x;
                const dy = this.y - testBubble.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < minDist) {
                    minDist = dist;
                    bestRow = row;
                    bestCol = col;
                }
            }
        }

        // No free position found - Grid is full - Game Over!
        if (bestRow === -1) {
            endGame();
            return { gameOver: true };
        }

        // Check if bubble would land in last row (bottom row) - Game Over!
        if (bestRow >= CONFIG.ROWS - 1) {
            endGame();
            return { gameOver: true };
        }
        
        const newBubble = new Bubble(bestRow, bestCol, this.colorIndex);
        return newBubble;
    }
}

// Initialize Game
function initGame() {
    gameState.bubbles = [];
    gameState.score = 0;
    gameState.level = 1;
    gameState.timeLeft = CONFIG.TIME_LIMIT;
    gameState.particles = [];
    
    loadNextBubble();
    createLevel();
}

// Create Level
function createLevel() {
    gameState.bubbles = [];
    const rows = Math.min(4 + gameState.level, CONFIG.ROWS);

    for (let row = 0; row < rows; row++) {
        const cols = (row % 2 === 0) ? CONFIG.COLS : CONFIG.COLS - 1;
        for (let col = 0; col < cols; col++) {
            const colorIndex = Math.floor(Math.random() * CONFIG.COLORS.length);
            gameState.bubbles.push(new Bubble(row, col, colorIndex));
        }
    }
}

// Load Next Bubble
function loadNextBubble() {
    const colorIndex = Math.floor(Math.random() * CONFIG.COLORS.length);
    gameState.shooter.currentBubble = new Bubble(0, 0, colorIndex);
    gameState.shooter.currentBubble.x = gameState.shooter.x;
    gameState.shooter.currentBubble.y = gameState.shooter.y;
}

// Shoot Bubble
function shootBubble() {
    if (!gameState.shooter.currentBubble || gameState.flyingBubble) return;

    const angle = gameState.aimAngle;
    const speed = CONFIG.BUBBLE_SPEED;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    gameState.flyingBubble = new FlyingBubble(
        gameState.shooter.x,
        gameState.shooter.y,
        gameState.shooter.currentBubble.colorIndex,
        vx,
        vy
    );

    gameState.shooter.currentBubble = null;
}

// Find Matches
function findMatches(bubble) {
    const matches = [];
    const visited = new Set();
    const queue = [bubble];

    while (queue.length > 0) {
        const current = queue.shift();
        const key = `${current.row},${current.col}`;

        if (visited.has(key)) continue;
        visited.add(key);

        matches.push(current);

        // Check neighbors
        const neighbors = getNeighbors(current);
        for (let neighbor of neighbors) {
            if (neighbor.colorIndex === bubble.colorIndex) {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (!visited.has(neighborKey)) {
                    queue.push(neighbor);
                }
            }
        }
    }

    return matches;
}

// Get Neighbors
function getNeighbors(bubble) {
    const neighbors = [];
    const evenRow = bubble.row % 2 === 0;
    
    const offsets = evenRow ? [
        [-1, -1], [-1, 0],  // top-left, top-right
        [0, -1], [0, 1],    // left, right
        [1, -1], [1, 0]     // bottom-left, bottom-right
    ] : [
        [-1, 0], [-1, 1],   // top-left, top-right
        [0, -1], [0, 1],    // left, right
        [1, 0], [1, 1]      // bottom-left, bottom-right
    ];

    for (let [dr, dc] of offsets) {
        const newRow = bubble.row + dr;
        const newCol = bubble.col + dc;

        const neighbor = gameState.bubbles.find(b => b.row === newRow && b.col === newCol);
        if (neighbor) {
            neighbors.push(neighbor);
        }
    }

    return neighbors;
}

// Find Floating Bubbles
function findFloatingBubbles() {
    const connected = new Set();
    const queue = [];

    // Start from top row
    for (let bubble of gameState.bubbles) {
        if (bubble.row === 0) {
            queue.push(bubble);
            connected.add(bubble);
        }
    }

    // BFS to find all connected
    while (queue.length > 0) {
        const current = queue.shift();
        const neighbors = getNeighbors(current);

        for (let neighbor of neighbors) {
            if (!connected.has(neighbor)) {
                connected.add(neighbor);
                queue.push(neighbor);
            }
        }
    }

    // Return floating bubbles
    return gameState.bubbles.filter(b => !connected.has(b));
}

// Remove Bubbles
function removeBubbles(bubbles) {
    for (let bubble of bubbles) {
        // Create particles
        createExplosion(bubble.x, bubble.y, CONFIG.COLORS[bubble.colorIndex].color);
        
        // Remove from array
        const index = gameState.bubbles.indexOf(bubble);
        if (index > -1) {
            gameState.bubbles.splice(index, 1);
        }
    }

    // Update score
    const points = bubbles.length * 10 * gameState.level;
    gameState.score += points;
    
    // Bonus for combos
    if (bubbles.length > 4) {
        gameState.score += (bubbles.length - 4) * 50;
    }
}

// Create Explosion
function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

// Drop Floating Bubbles
function dropFloatingBubbles() {
    const floating = findFloatingBubbles();
    
    for (let bubble of floating) {
        bubble.falling = true;
    }

    if (floating.length > 0) {
        gameState.score += floating.length * 20 * gameState.level;
        
        setTimeout(() => {
            gameState.bubbles = gameState.bubbles.filter(b => !b.falling);
        }, 1000);
    }
}

// Check Win Condition
function checkWinCondition() {
    // Check if any bubble reached the bottom
    for (let bubble of gameState.bubbles) {
        if (bubble.y + CONFIG.BUBBLE_RADIUS >= canvas.height - CONFIG.SHOOTER_Y_OFFSET) {
            endGame();
            return;
        }
    }
    
    // Check if all bubbles cleared
    if (gameState.bubbles.length === 0) {
        gameState.score += 100;
        gameState.level++;
        gameState.timeLeft = CONFIG.TIME_LIMIT;
        createLevel();
        
        // Show level up animation
        showLevelUpAnimation();
    }
}

// Show Level Up Animation
function showLevelUpAnimation() {
    const animation = {
        text: `Level ${gameState.level}!`,
        x: canvas.width / 2,
        y: canvas.height / 2,
        alpha: 1,
        scale: 0.5,
        duration: 0
    };
    gameState.animations.push(animation);
}

// Update Aim Line
function updateAimLine() {
    gameState.aimAngle += CONFIG.AIM_SPEED * gameState.aimDirection;

    // Limit angle
    const minAngle = -Math.PI * 0.85;
    const maxAngle = -Math.PI * 0.15;

    if (gameState.aimAngle <= minAngle || gameState.aimAngle >= maxAngle) {
        gameState.aimDirection *= -1;
        gameState.aimAngle = Math.max(minAngle, Math.min(maxAngle, gameState.aimAngle));
    }
}

// Draw Aim Line
function drawAimLine() {
    const startX = gameState.shooter.x;
    const startY = gameState.shooter.y;
    const endX = startX + Math.cos(gameState.aimAngle) * CONFIG.AIM_LINE_LENGTH;
    const endY = startY + Math.sin(gameState.aimAngle) * CONFIG.AIM_LINE_LENGTH;

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow head
    const arrowSize = 15;
    const angle = gameState.aimAngle;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

// Draw Preview Queue
function drawPreviewQueue() {
    const startX = canvas.width - 70;
    const startY = canvas.height - 300;
    const spacing = 50;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(startX - 35, startY - 35, 70, 250);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX - 35, startY - 35, 70, 250);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', startX, startY - 45);

    for (let i = 0; i < gameState.previewQueue.length; i++) {
        const colorIndex = gameState.previewQueue[i];
        const color = CONFIG.COLORS[colorIndex];
        const y = startY + i * spacing;

        // Mini bubble
        const radius = 18;
        
        const gradient = ctx.createRadialGradient(
            startX - radius / 3,
            y - radius / 3,
            0,
            startX,
            y,
            radius
        );
        gradient.addColorStop(0, lightenColor(color.color, 40));
        gradient.addColorStop(0.7, color.color);
        gradient.addColorStop(1, darkenColor(color.color, 20));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(startX, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = darkenColor(color.color, 30);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Symbol
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(color.symbol, startX, y);
    }
}

// Helper color functions
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Update Timer
function updateTimer() {
    if (!gameState.startTime) return;

    const elapsed = (Date.now() - gameState.startTime) / 1000;
    gameState.timeLeft = Math.max(0, CONFIG.TIME_LIMIT - elapsed);

    if (gameState.timeLeft <= 0) {
        endGame();
    }
}

// Game Loop
function gameLoop() {
    if (!gameState.gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background pattern
    drawBackground();

    // Update and draw particles
    gameState.particles = gameState.particles.filter(p => {
        p.update();
        p.draw(ctx);
        return p.life > 0;
    });

    // Draw bubbles
    for (let bubble of gameState.bubbles) {
        bubble.update();
        bubble.draw(ctx);
    }

    // Update aim line
    if (!gameState.flyingBubble && gameState.shooter.currentBubble) {
        updateAimLine();
        drawAimLine();
    }

    // Draw current bubble
    if (gameState.shooter.currentBubble && !gameState.flyingBubble) {
        gameState.shooter.currentBubble.x = gameState.shooter.x;
        gameState.shooter.currentBubble.y = gameState.shooter.y;
        gameState.shooter.currentBubble.draw(ctx);
    }

    // Update flying bubble
    if (gameState.flyingBubble) {
        const result = gameState.flyingBubble.update();
        
        if (result) {
            // Check if game over
            if (result.gameOver) {
                return;
            }
            
            gameState.bubbles.push(result);
            gameState.flyingBubble = null;

            // Check for matches
            const matches = findMatches(result);
            if (matches.length >= 4) {
                removeBubbles(matches);
                dropFloatingBubbles();
                checkWinCondition();
            }

            // Load next bubble
            loadNextBubble();
        } else {
            gameState.flyingBubble.draw(ctx);
        }
    }

    // Update timer
    updateTimer();
    updateHUD();

    // Draw animations
    gameState.animations = gameState.animations.filter(anim => {
        anim.duration += 16;
        anim.alpha -= 0.02;
        anim.scale += 0.02;

        if (anim.alpha > 0) {
            ctx.globalAlpha = anim.alpha;
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${40 * anim.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(anim.text, anim.x, anim.y);
            ctx.globalAlpha = 1;
            return true;
        }
        return false;
    });

    requestAnimationFrame(gameLoop);
}

// Draw Background
function drawBackground() {
    // Snowflakes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const time = Date.now() / 1000;
    for (let i = 0; i < 30; i++) {
        const x = (i * 137.5 + time * 20) % canvas.width;
        const y = (i * 97.3 + time * 30) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Update HUD
function updateHUD() {
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('timerDisplay').textContent = Math.ceil(gameState.timeLeft);
    
    // Timer color warning
    const timerEl = document.getElementById('timerDisplay');
    if (gameState.timeLeft <= 10) {
        timerEl.style.color = '#ff4444';
    } else {
        timerEl.style.color = '#FFD700';
    }
}

// Start Game
function startGame() {
    document.getElementById('startOverlay').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('fullscreenBtn').style.display = 'flex';
    
    initGame();
    gameState.gameRunning = true;
    gameState.startTime = Date.now();
    
    gameLoop();
}

// End Game
async function endGame() {
    gameState.gameRunning = false;
    
    // Save score
    await saveScore(gameState.score, gameState.level);
    
    // Show game over
    document.getElementById('gameoverTitle').textContent = '🎮 Spiel Beendet!';
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalLevel').textContent = gameState.level;
    document.getElementById('gameoverOverlay').style.display = 'flex';
}

// Restart Game
function restartGame() {
    document.getElementById('gameoverOverlay').style.display = 'none';
    initGame();
    gameState.gameRunning = true;
    gameState.startTime = Date.now();
    gameLoop();
}

// Go to Dashboard
function goToDashboard() {
    window.location.href = '/dashboard.html';
}

// Input Handling
canvas.addEventListener('click', () => {
    if (gameState.gameRunning && !gameState.flyingBubble) {
        shootBubble();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.gameRunning && !gameState.flyingBubble) {
        shootBubble();
    }
});

// Fullscreen
document.getElementById('fullscreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

// Cookie Helper
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Save Score
async function saveScore(score, level) {
    const playerName = getCookie('playerName');
    if (!playerName) {
        console.log('No player name found');
        return;
    }

    const playTime = CONFIG.TIME_LIMIT - gameState.timeLeft;

    try {
        const response = await fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameName: GAME_NAME,
                username: playerName,
                score: score,
                playTime: Math.round(playTime),
                level: level
            })
        });

        if (!response.ok) {
            console.error('Failed to save score');
        }
    } catch (error) {
        console.error('Error saving score:', error);
    }
}

// Load Highscores
async function loadHighscores() {
    try {
        const scores = await getHighscores(GAME_NAME, 3);
        displayHighscores(scores);
    } catch (error) {
        console.error('Error loading highscores:', error);
        document.getElementById('highscoresList').innerHTML = '<p>Fehler beim Laden der Highscores</p>';
    }
}

// Get Highscores
async function getHighscores(gameName, limit = 3) {
    try {
        const response = await fetch(`/api/stats/${gameName}/top?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch highscores');
        return await response.json();
    } catch (error) {
        console.error('Error fetching highscores:', error);
        return [];
    }
}

// Display Highscores
function displayHighscores(scores) {
    const container = document.getElementById('highscoresList');
    
    if (!scores || scores.length === 0) {
        container.innerHTML = '<p style="color: #999;">Noch keine Highscores vorhanden</p>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    
    container.innerHTML = scores.map((score, index) => `
        <div class="highscore-item">
            <span class="highscore-rank">${medals[index] || (index + 1)}</span>
            <span class="highscore-name">${escapeHtml(score.username)}</span>
            <span class="highscore-score">${score.highScore || score.score}</span>
        </div>
    `).join('');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
