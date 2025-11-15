// === Santa Run Game - Standalone Version ===
console.log('✅ santa-run.js wird geladen...');

class SantaRunGame {
    constructor(containerId) {
        console.log('✅ SantaRunGame Constructor aufgerufen mit:', containerId);
        this.container = document.getElementById(containerId);
        this.score = 0;
        this.gifts = 0;
        this.gameActive = false;
        this.santa = null;
        this.currentLane = 1; // 0 = links, 1 = mitte, 2 = rechts
        this.lanes = [120, 250, 380]; // X-Positionen der 3 Bahnen
        this.obstacles = [];
        this.presents = [];
        this.gameSpeed = 4;
        this.gameLoop = null;
        this.spawnInterval = null;
        this.distance = 0;
        this.gameName = 'santa-run';
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="santa-run-game">
                <div class="game-header">
                    <div class="score-display">
                        🎅 Meter: <span id="run-distance">0</span>m
                    </div>
                    <div class="score-display">
                        🎁 Geschenke: <span id="run-gifts">0</span>
                    </div>
                    <button class="fullscreen-button" id="run-fullscreen-button" title="Vollbild">⛶</button>
                </div>
                <div class="run-canvas" id="run-canvas">
                    <div class="run-lane" style="left: 120px;"></div>
                    <div class="run-lane" style="left: 250px;"></div>
                    <div class="run-lane" style="left: 380px;"></div>
                </div>
                <div class="run-controls">
                    <button class="run-control-btn" id="run-left-btn">⬅️</button>
                    <button class="game-button" id="run-start-button">Spiel starten! 🎮</button>
                    <button class="run-control-btn" id="run-right-btn">➡️</button>
                </div>
            </div>
        `;
        
        document.getElementById('run-start-button').addEventListener('click', () => this.showStartOverlay());
        document.getElementById('run-fullscreen-button').addEventListener('click', () => this.toggleFullscreen());
        
        // Start-Overlay automatisch nach kurzer Verzögerung anzeigen
        setTimeout(() => this.showStartOverlay(), 100);
    }
    
    showStartOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'game-instructions-overlay';
        overlay.innerHTML = `
            <div class="instructions-content">
                <h2>🎅 Santa Run! 🎄</h2>
                <div class="instruction-items">
                    <div class="instruction-item">
                        <span class="item-icon">🏃</span>
                        <span>Laufe durch die verschneite Stadt!</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">⬅️➡️</span>
                        <span>Pfeiltasten oder Wischen zum Bewegen</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">🎁</span>
                        <span>Sammle Geschenke: +10 Punkte</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">🌲⛄</span>
                        <span>Weiche Hindernissen aus!</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">⚡</span>
                        <span>Das Spiel wird schneller mit der Zeit!</span>
                    </div>
                </div>
                <p class="difficulty-info">🎯 Wie weit schaffst du es?</p>
                <button class="instruction-ok-button" id="instruction-ok-button">
                    ✓ Los geht's!
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('instruction-ok-button').addEventListener('click', () => {
            overlay.remove();
            this.start();
        });
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen nicht verfügbar:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    start() {
        this.score = 0;
        this.gifts = 0;
        this.distance = 0;
        this.gameActive = true;
        this.currentLane = 1;
        this.obstacles = [];
        this.presents = [];
        this.gameSpeed = 4;
        
        const canvas = document.getElementById('run-canvas');
        const existingElements = canvas.querySelectorAll('.santa-runner, .obstacle-runner, .present-runner, .game-over');
        existingElements.forEach(el => el.remove());
        
        document.getElementById('run-start-button').style.display = 'none';
        document.getElementById('run-distance').textContent = '0';
        document.getElementById('run-gifts').textContent = '0';
        
        this.createSanta();
        this.setupControls();
        this.startSpawning();
        this.gameLoop = setInterval(() => this.update(), 20);
    }
    
    createSanta() {
        const canvas = document.getElementById('run-canvas');
        this.santa = document.createElement('div');
        this.santa.className = 'santa-runner';
        this.santa.innerHTML = '🎅';
        this.santa.style.left = this.lanes[this.currentLane] + 'px';
        this.santa.style.bottom = '50px';
        canvas.appendChild(this.santa);
    }
    
    setupControls() {
        // Tastatur
        this.keyHandler = (e) => {
            if (!this.gameActive) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.moveLeft();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.moveRight();
            }
        };
        document.addEventListener('keydown', this.keyHandler);
        
        // Touch-Buttons für Mobile
        document.getElementById('run-left-btn').addEventListener('click', () => this.moveLeft());
        document.getElementById('run-right-btn').addEventListener('click', () => this.moveRight());
        
        // Touch/Swipe Unterstützung
        const canvas = document.getElementById('run-canvas');
        let touchStartX = 0;
        
        canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        canvas.addEventListener('touchend', (e) => {
            if (!this.gameActive) return;
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;
            
            if (Math.abs(diff) > 30) {
                if (diff > 0) {
                    this.moveRight();
                } else {
                    this.moveLeft();
                }
            }
        });
    }
    
    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.santa.style.left = this.lanes[this.currentLane] + 'px';
            this.santa.style.transition = 'left 0.2s ease';
        }
    }
    
    moveRight() {
        if (this.currentLane < 2) {
            this.currentLane++;
            this.santa.style.left = this.lanes[this.currentLane] + 'px';
            this.santa.style.transition = 'left 0.2s ease';
        }
    }
    
    startSpawning() {
        const spawn = () => {
            if (!this.gameActive) return;
            
            const spawnTwo = Math.random() < 0.3;
            
            if (spawnTwo) {
                const lane1 = Math.floor(Math.random() * 3);
                let lane2;
                do {
                    lane2 = Math.floor(Math.random() * 3);
                } while (lane2 === lane1);
                
                const bothPresents = Math.random() < 0.3;
                
                if (bothPresents) {
                    this.spawnPresentInLane(lane1);
                    this.spawnPresentInLane(lane2);
                } else {
                    if (Math.random() < 0.5) {
                        this.spawnObstacleInLane(lane1);
                        this.spawnPresentInLane(lane2);
                    } else {
                        this.spawnPresentInLane(lane1);
                        this.spawnObstacleInLane(lane2);
                    }
                }
            } else {
                const lane = Math.floor(Math.random() * 3);
                if (Math.random() < 0.7) {
                    this.spawnObstacleInLane(lane);
                } else {
                    this.spawnPresentInLane(lane);
                }
            }
            
            const baseInterval = 1000;
            const speedFactor = this.gameSpeed / 4;
            const dynamicInterval = Math.max(500, baseInterval / speedFactor);
            
            this.spawnTimeout = setTimeout(spawn, dynamicInterval);
        };
        
        this.spawnTimeout = setTimeout(spawn, 800);
    }
    
    spawnObstacleInLane(lane) {
        const canvas = document.getElementById('run-canvas');
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle-runner';
        const types = ['🌲', '⛄', '🏠', '🚧'];
        obstacle.innerHTML = types[Math.floor(Math.random() * types.length)];
        obstacle.style.left = this.lanes[lane] + 'px';
        obstacle.style.top = '-80px';
        canvas.appendChild(obstacle);
        this.obstacles.push({ element: obstacle, lane: lane });
    }
    
    spawnPresentInLane(lane) {
        const canvas = document.getElementById('run-canvas');
        const present = document.createElement('div');
        present.className = 'present-runner';
        present.innerHTML = '🎁';
        present.style.left = this.lanes[lane] + 'px';
        present.style.top = '-80px';
        canvas.appendChild(present);
        this.presents.push({ element: present, lane: lane });
    }
    
    update() {
        if (!this.gameActive) return;
        
        this.distance += 0.1;
        const currentMeter = Math.floor(this.distance);
        document.getElementById('run-distance').textContent = currentMeter;
        
        if (currentMeter > 0 && currentMeter % 20 === 0) {
            if (this.distance % 1 < 0.1) {
                const oldSpeed = this.gameSpeed;
                this.gameSpeed = Math.min(4 + (currentMeter / 20) * 0.5, 10);
                if (this.gameSpeed > oldSpeed) {
                    this.showSpeedIncrease();
                }
            }
        }
        
        const santaRect = this.santa.getBoundingClientRect();
        
        this.obstacles = this.obstacles.filter(obstacle => {
            const currentTop = parseInt(obstacle.element.style.top);
            const newTop = currentTop + this.gameSpeed;
            obstacle.element.style.top = newTop + 'px';
            const obstacleRect = obstacle.element.getBoundingClientRect();
            
            if (obstacle.lane === this.currentLane && this.checkCollision(santaRect, obstacleRect)) {
                this.endGame();
                return false;
            }
            
            if (newTop > 600) {
                obstacle.element.remove();
                return false;
            }
            return true;
        });
        
        this.presents = this.presents.filter(present => {
            const currentTop = parseInt(present.element.style.top);
            const newTop = currentTop + this.gameSpeed;
            present.element.style.top = newTop + 'px';
            const presentRect = present.element.getBoundingClientRect();
            
            if (present.lane === this.currentLane && this.checkCollision(santaRect, presentRect)) {
                this.gifts++;
                this.score += 10;
                document.getElementById('run-gifts').textContent = this.gifts;
                present.element.remove();
                this.showGiftCollected();
                return false;
            }
            
            if (newTop > 600) {
                present.element.remove();
                return false;
            }
            return true;
        });
    }
    
    checkCollision(rect1, rect2) {
        const tolerance = 10;
        return !(rect1.right - tolerance < rect2.left + tolerance || 
                 rect1.left + tolerance > rect2.right - tolerance || 
                 rect1.bottom - tolerance < rect2.top + tolerance || 
                 rect1.top + tolerance > rect2.bottom - tolerance);
    }
    
    showSpeedIncrease() {
        const canvas = document.getElementById('run-canvas');
        const notification = document.createElement('div');
        notification.className = 'speed-notification';
        notification.innerHTML = '⚡ Schneller! ⚡';
        notification.style.cssText = `
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 215, 0, 0.95);
            color: #d32f2f;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 1000;
            animation: speedPulse 0.8s ease-out;
            pointer-events: none;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.5);
        `;
        canvas.appendChild(notification);
        setTimeout(() => notification.remove(), 800);
    }
    
    showGiftCollected() {
        const canvas = document.getElementById('run-canvas');
        const notification = document.createElement('div');
        notification.className = 'gift-collected';
        notification.innerHTML = '+10 🎁';
        notification.style.cssText = `
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #FFD700;
            font-size: 2rem;
            font-weight: bold;
            z-index: 1000;
            animation: floatUp 0.8s ease-out;
            pointer-events: none;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        `;
        canvas.appendChild(notification);
        setTimeout(() => notification.remove(), 800);
    }
    
    async endGame() {
        this.gameActive = false;
        clearInterval(this.gameLoop);
        clearTimeout(this.spawnTimeout);
        document.removeEventListener('keydown', this.keyHandler);
        
        const finalDistance = Math.floor(this.distance);
        
        // Stats speichern
        if (typeof statsManager !== 'undefined') {
            await statsManager.saveStats(this.gameName, finalDistance, {
                gifts: this.gifts,
                distance: finalDistance
            });
        }
        
        this.showGameOver(finalDistance);
    }
    
    async showGameOver(finalDistance) {
        // Lade Highscores
        let highscores = [];
        if (typeof statsManager !== 'undefined') {
            highscores = await statsManager.getHighscores(this.gameName, 5);
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-content">
                <h2>🎅 Santa ist müde! 🎄</h2>
                <div class="game-over-stats">
                    <div class="game-over-stat-item">
                        <div class="game-over-stat-label">Gelaufene Meter</div>
                        <div class="game-over-stat-value">${finalDistance}m</div>
                    </div>
                    <div class="game-over-stat-item">
                        <div class="game-over-stat-label">Geschenke</div>
                        <div class="game-over-stat-value">${this.gifts} 🎁</div>
                    </div>
                </div>
                <div class="game-over-message">${this.getScoreMessage(finalDistance)}</div>
                
                ${highscores.length > 0 ? `
                    <div class="highscore-section">
                        <h3>🏆 Top 5 Läufer</h3>
                        <div class="highscore-list">
                            ${highscores.map((score, index) => `
                                <div class="highscore-item ${score.isCurrentUser ? 'current-user' : ''}">
                                    <span class="highscore-rank">#${index + 1}</span>
                                    <span class="highscore-name">${score.username || 'Anonym'}</span>
                                    <span class="highscore-value">${score.score}m</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="game-over-buttons">
                    <button class="game-button game-button-primary" id="play-again-button">
                        🔄 Nochmal laufen
                    </button>
                    <button class="game-button game-button-secondary" id="back-to-calendar-button">
                        🎄 Zurück zum Kalender
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        document.getElementById('play-again-button').addEventListener('click', () => {
            overlay.remove();
            this.start();
        });
        
        document.getElementById('back-to-calendar-button').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    getScoreMessage(distance) {
        if (distance >= 200) return '🌟 Unglaublich! Du bist ein Marathon-Santa!';
        if (distance >= 150) return '⭐ Fantastisch! Tolle Ausdauer!';
        if (distance >= 100) return '✨ Super! Sehr gute Leistung!';
        if (distance >= 50) return '🎄 Gut gemacht! Weiter so!';
        return '🎅 Nicht schlecht! Versuch es nochmal!';
    }
}

// CSS Animations hinzufügen
const style = document.createElement('style');
style.textContent = `
    @keyframes speedPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
    }
    
    @keyframes floatUp {
        0% { transform: translate(-50%, -50%) translateY(0); opacity: 1; }
        100% { transform: translate(-50%, -50%) translateY(-50px); opacity: 0; }
    }
`;
document.head.appendChild(style);
