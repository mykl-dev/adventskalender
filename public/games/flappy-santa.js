/* ========================================
   FLAPPY SANTA - Modern 3D Version
   Canvas 2D mit 3D-Effekten für Hindernisse
   ======================================== */

class FlappySanta {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.score = 0;
        this.gameActive = false;
        this.gameStarted = false;
        
        // Santa Properties
        this.santa = {
            x: 100,
            y: 250,
            width: 50,
            height: 50,
            velocity: 0,
            rotation: 0
        };
        
        // Physics (weiter verlangsamt für bessere Kontrolle)
        this.gravity = 0.15;
        this.jumpStrength = -4.5;
        this.maxVelocity = 6;
        
        // Obstacles
        this.obstacles = [];
        this.obstacleSpeed = 2;
        this.baseObstacleSpeed = 2;
        this.obstacleGap = 200;
        this.obstacleSpawnTime = 2500;
        this.lastObstacleTime = 0;
        
        // Background 3D elements
        this.buildings = [];
        this.clouds = [];
        
        // Game Loop
        this.animationId = null;
        this.lastTime = 0;
        
        // Game name for stats
        this.gameName = 'flappy-santa';
        this.startTime = 0;
        
        this.init();
    }
    
    init() {
        const root = document.getElementById('game-root');
        
        root.innerHTML = `
            <canvas id="game-canvas"></canvas>
            
            <div class="stats-banner">
                <div class="stat-box">
                    <div class="stat-label">Punkte</div>
                    <div class="stat-value" id="score-value">0</div>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.setupControls();
        this.initBackground();
        this.showStartOverlay();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Adjust santa position for responsive
        this.santa.y = this.canvas.height / 2;
    }
    
    initBackground() {
        // Generate 3D buildings for background parallax
        this.buildings = [];
        for (let i = 0; i < 8; i++) {
            this.buildings.push({
                x: i * 200,
                height: Math.random() * 150 + 100,
                layer: Math.random() > 0.5 ? 1 : 2 // Parallax layers
            });
        }
        
        // Generate clouds
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height * 0.4),
                speed: Math.random() * 0.5 + 0.3,
                scale: Math.random() * 0.5 + 0.8
            });
        }
    }
    
    setupControls() {
        // Remove old listeners first
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
        if (this.clickHandler) {
            this.canvas.removeEventListener('click', this.clickHandler);
            this.canvas.removeEventListener('touchstart', this.clickHandler);
        }
        
        // Keyboard
        this.keyHandler = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.jump();
            }
        };
        document.addEventListener('keydown', this.keyHandler);
        
        // Mouse/Touch
        this.clickHandler = (e) => {
            e.preventDefault();
            this.jump();
        };
        this.canvas.addEventListener('click', this.clickHandler);
        this.canvas.addEventListener('touchstart', this.clickHandler, { passive: false });
    }
    
    showStartOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = 'start-overlay';
        overlay.innerHTML = `
            <div class="overlay-content">
                <div class="overlay-title">🎅🛷</div>
                <div class="overlay-subtitle">Flappy Santa</div>
                <div class="overlay-text">
                    Fliege mit dem Weihnachtsmann durch die Stadt und weiche den Hindernissen aus!
                </div>
                <div class="overlay-instructions">
                    <p><strong>🖱️ Klicken</strong> oder <strong>⌨️ Leertaste</strong></p>
                    <p>zum Fliegen!</p>
                </div>
                <button class="game-button" onclick="game.start()">Start 🎮</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    async start() {
        // Ensure username
        if (typeof statsManager !== 'undefined') {
            try {
                await statsManager.ensureUsername();
            } catch (error) {
                console.warn('Username prompt failed:', error);
            }
        }
        
        // Remove overlays
        const startOverlay = document.getElementById('start-overlay');
        if (startOverlay) startOverlay.remove();
        const gameOverOverlay = document.querySelector('.overlay');
        if (gameOverOverlay) gameOverOverlay.remove();
        
        // Reset game state
        this.score = 0;
        this.gameActive = true;
        this.gameStarted = false;
        this.santa.y = this.canvas.height / 2;
        this.santa.velocity = 0;
        this.obstacles = [];
        this.obstacleSpeed = this.baseObstacleSpeed;
        this.obstacleGap = 200;
        this.obstacleSpawnTime = 2500;
        this.lastObstacleTime = 0;
        this.startTime = Date.now();
        
        document.getElementById('score-value').textContent = '0';
        document.body.classList.add('playing');
        
        // Setup controls
        this.setupControls();
        
        this.showReadyMessage();
        
        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    showReadyMessage() {
        const ready = document.createElement('div');
        ready.className = 'ready-message';
        ready.innerHTML = `
            <div class="ready-icon">🛷</div>
            <div class="ready-title">Bereit?</div>
            <div class="ready-hint">Klicken zum Starten!</div>
        `;
        document.body.appendChild(ready);
        
        // Remove after first jump
        setTimeout(() => {
            if (!this.gameStarted && this.gameActive) {
                ready.remove();
            }
        }, 5000);
    }
    
    jump() {
        if (!this.gameActive) return;
        
        // Start game on first jump
        if (!this.gameStarted) {
            this.gameStarted = true;
            const ready = document.querySelector('.ready-message');
            if (ready) ready.remove();
        }
        
        this.santa.velocity = this.jumpStrength;
        
        // Visual feedback
        this.santa.rotation = -25;
    }
    
    gameLoop() {
        if (!this.gameActive) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(currentTime, deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update(currentTime, deltaTime) {
        // Always update background
        this.updateBackground();
        
        if (!this.gameStarted) {
            // Draw even when not started
            return;
        }
        
        // Update santa physics
        this.santa.velocity += this.gravity;
        this.santa.velocity = Math.min(this.santa.velocity, this.maxVelocity);
        this.santa.y += this.santa.velocity;
        
        // Rotation based on velocity (invertiert - nach oben = negativ, nach unten = positiv)
        this.santa.rotation = Math.min(Math.max(this.santa.velocity * 5, -25), 45);
        
        // Check boundaries
        if (this.santa.y < 0 || this.santa.y + this.santa.height > this.canvas.height) {
            this.endGame();
            return;
        }
        
        // Spawn obstacles
        if (currentTime - this.lastObstacleTime > this.obstacleSpawnTime) {
            this.spawnObstacle();
            this.lastObstacleTime = currentTime;
        }
        
        // Update obstacles
        this.updateObstacles();
    }
    
    updateBackground() {
        // Update buildings (parallax)
        this.buildings.forEach(building => {
            building.x -= this.obstacleSpeed * (building.layer === 1 ? 0.3 : 0.5);
            if (building.x < -200) {
                building.x = this.canvas.width + 200;
                building.height = Math.random() * 150 + 100;
            }
        });
        
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x < -100) {
                cloud.x = this.canvas.width + 100;
                cloud.y = Math.random() * (this.canvas.height * 0.4);
            }
        });
    }
    
    spawnObstacle() {
        const minHeight = 80;
        const maxHeight = this.canvas.height - this.obstacleGap - minHeight - 50; // Mehr Abstand zum Boden
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        // Himmel-Hindernisse mit 3D styling
        const types = [
            { color: '#E3F2FD', color2: '#90CAF9', name: 'cloud-tower' }, // Wolkenturm
            { color: '#FFE082', color2: '#FFB300', name: 'balloon' },      // Heißluftballon
            { color: '#B39DDB', color2: '#7E57C2', name: 'zeppelin' },     // Zeppelin
            { color: '#80DEEA', color2: '#00ACC1', name: 'ice-pillar' }    // Eis-Säule
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.obstacles.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.obstacleGap,
            width: 70,
            type: type,
            scored: false,
            depth: Math.random() * 15 + 10 // 3D depth effect
        });
    }
    
    updateObstacles() {
        const santaRect = {
            x: this.santa.x,
            y: this.santa.y,
            width: this.santa.width,
            height: this.santa.height
        };
        
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= this.obstacleSpeed;
            
            // Score point
            if (!obstacle.scored && obstacle.x + obstacle.width < this.santa.x) {
                obstacle.scored = true;
                this.score++;
                document.getElementById('score-value').textContent = this.score;
                this.increaseDifficulty();
            }
            
            // Collision detection with tolerance
            const tolerance = 8;
            const topCollision = this.checkCollision(
                santaRect,
                { x: obstacle.x, y: 0, width: obstacle.width, height: obstacle.topHeight },
                tolerance
            );
            const bottomCollision = this.checkCollision(
                santaRect,
                { x: obstacle.x, y: obstacle.bottomY, width: obstacle.width, height: this.canvas.height - obstacle.bottomY },
                tolerance
            );
            
            if (topCollision || bottomCollision) {
                this.endGame();
                return false;
            }
            
            // Remove off-screen obstacles
            return obstacle.x > -obstacle.width;
        });
    }
    
    checkCollision(rect1, rect2, tolerance = 0) {
        const r1 = {
            left: rect1.x + tolerance,
            right: rect1.x + rect1.width - tolerance,
            top: rect1.y + tolerance,
            bottom: rect1.y + rect1.height - tolerance
        };
        
        return !(r1.right < rect2.x || 
                 r1.left > rect2.x + rect2.width || 
                 r1.bottom < rect2.y || 
                 r1.top > rect2.y + rect2.height);
    }
    
    increaseDifficulty() {
        if (this.score === 5) {
            this.obstacleSpeed += 0.3;
            this.showDifficultyNotification();
        } else if (this.score === 10) {
            this.obstacleSpeed += 0.3;
            this.obstacleGap = 190;
            this.showDifficultyNotification();
        } else if (this.score === 15) {
            this.obstacleSpeed += 0.4;
            this.obstacleSpawnTime = 2200;
            this.showDifficultyNotification();
        } else if (this.score === 20) {
            this.obstacleGap = 180;
            this.showDifficultyNotification();
        } else if (this.score === 25) {
            this.obstacleSpeed += 0.3;
            this.showDifficultyNotification();
        }
    }
    
    showDifficultyNotification() {
        const notification = document.createElement('div');
        notification.className = 'difficulty-notification';
        notification.textContent = '⚡ Schneller! ⚡';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 800);
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'linear-gradient(to bottom, #87CEEB, #E0F6FF)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw gradient sky
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#E0F6FF');
        gradient.addColorStop(1, '#FFE6F0');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds
        this.drawClouds();
        
        // Draw buildings (background layer 2)
        this.drawBuildings(2);
        
        // Draw obstacles with 3D effect
        this.drawObstacles();
        
        // Draw buildings (foreground layer 1)
        this.drawBuildings(1);
        
        // Draw santa
        this.drawSanta();
    }
    
    drawClouds() {
        this.ctx.font = '48px Arial';
        this.clouds.forEach(cloud => {
            this.ctx.globalAlpha = 0.6;
            this.ctx.save();
            this.ctx.translate(cloud.x, cloud.y);
            this.ctx.scale(cloud.scale, cloud.scale);
            this.ctx.fillText('☁️', 0, 0);
            this.ctx.restore();
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawBuildings(layer) {
        this.buildings.filter(b => b.layer === layer).forEach(building => {
            const alpha = layer === 1 ? 0.4 : 0.2;
            const y = this.canvas.height - building.height;
            
            this.ctx.globalAlpha = alpha;
            
            // 3D Building effect
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(building.x, y, 100, building.height);
            
            // Lighter side for 3D effect
            this.ctx.fillStyle = '#555';
            this.ctx.beginPath();
            this.ctx.moveTo(building.x + 100, y);
            this.ctx.lineTo(building.x + 120, y + 20);
            this.ctx.lineTo(building.x + 120, this.canvas.height + 20);
            this.ctx.lineTo(building.x + 100, this.canvas.height);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            // 3D Obstacle effect
            const { x, topHeight, bottomY, width, type, depth } = obstacle;
            
            // Top obstacle
            this.drawObstacle3D(x, 0, width, topHeight, type.color, type.color2, depth, true);
            
            // Bottom obstacle
            const bottomHeight = this.canvas.height - bottomY;
            this.drawObstacle3D(x, bottomY, width, bottomHeight, type.color, type.color2, depth, false);
        });
    }
    
    drawObstacle3D(x, y, width, height, color, color2, depth, isTop) {
        const ctx = this.ctx;
        
        // Front face with gradient
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        
        // 3D depth - right side
        ctx.fillStyle = this.darkenColor(color2, 20);
        ctx.beginPath();
        ctx.moveTo(x + width, y);
        ctx.lineTo(x + width + depth, y + depth);
        ctx.lineTo(x + width + depth, y + height + depth);
        ctx.lineTo(x + width, y + height);
        ctx.fill();
        
        // 3D depth - top/bottom
        if (isTop) {
            ctx.fillStyle = this.darkenColor(color, 15);
            ctx.beginPath();
            ctx.moveTo(x, y + height);
            ctx.lineTo(x + depth, y + height + depth);
            ctx.lineTo(x + width + depth, y + height + depth);
            ctx.lineTo(x + width, y + height);
            ctx.fill();
        } else {
            ctx.fillStyle = this.lightenColor(color, 10);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + depth, y + depth);
            ctx.lineTo(x + width + depth, y + depth);
            ctx.lineTo(x + width, y);
            ctx.fill();
        }
    }
    
    drawSanta() {
        const { x, y, width, height, rotation } = this.santa;
        
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        // Negierte Rotation für korrekte Richtung (nach oben = nach oben geneigt)
        this.ctx.rotate(-rotation * Math.PI / 180);
        
        // Santa emoji
        this.ctx.font = '50px Arial';
        this.ctx.fillText('🛷', -25, 15);
        
        this.ctx.restore();
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    async endGame() {
        if (!this.gameActive) return; // Prevent multiple calls
        
        this.gameActive = false;
        this.gameStarted = false;
        document.body.classList.remove('playing');
        
        // WICHTIG: Zeichne einen letzten Frame, damit die Grafiken sichtbar bleiben
        this.draw();
        
        // Dann stoppe die Animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Remove controls
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
        if (this.clickHandler) {
            this.canvas.removeEventListener('click', this.clickHandler);
            this.canvas.removeEventListener('touchstart', this.clickHandler);
        }
        
        // Calculate play time
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Save stats
        if (typeof statsManager !== 'undefined') {
            try {
                await statsManager.saveStats(this.gameName, this.score, playTime);
            } catch (error) {
                console.error('Fehler beim Speichern der Stats:', error);
            }
        }
        
        // Show game over after short delay
        setTimeout(() => {
            this.showGameOver();
        }, 500);
    }
    
    async showGameOver() {
        // Load top 3
        let top3 = [];
        if (typeof statsManager !== 'undefined') {
            try {
                top3 = await statsManager.getTop3(this.gameName);
            } catch (error) {
                console.error('Fehler beim Laden der Bestenliste:', error);
            }
        }
        
        // Remove any existing overlays first
        const existingOverlays = document.querySelectorAll('.overlay');
        existingOverlays.forEach(el => el.remove());
        
        // Create game over overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="overlay-content">
                <div class="overlay-title">🎅 Game Over! 🎄</div>
                <div class="score-message">${this.getScoreMessage()}</div>
                <div class="final-score">${this.score}</div>
                ${top3.length > 0 ? `
                    <div class="highscore-table">
                        <div class="highscore-title">🏆 Top 3</div>
                        ${top3.map((entry, index) => `
                            <div class="highscore-entry">
                                <span class="highscore-rank">${['🥇', '🥈', '🥉'][index]}</span>
                                <span class="highscore-name">${entry.username}</span>
                                <span class="highscore-score">${entry.score || entry.highscore || 0}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <button class="game-button" onclick="game.start()">Nochmal spielen! 🔄</button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Force reflow to ensure animation plays
        overlay.offsetHeight;
    }
    
    getScoreMessage() {
        if (this.score >= 30) return '🌟 Legendär! Du bist der beste Pilot!';
        if (this.score >= 20) return '⭐ Fantastisch! Santa wäre stolz!';
        if (this.score >= 15) return '✨ Super! Gute Flugkünste!';
        if (this.score >= 10) return '🎄 Gut! Weiter so!';
        if (this.score >= 5) return '🎅 Nicht schlecht! Versuch es nochmal!';
        return '🛷 Übung macht den Meister!';
    }
}

// Initialize game
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new FlappySanta();
});
