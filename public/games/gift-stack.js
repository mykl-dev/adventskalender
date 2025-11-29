// ========================================
// GESCHENKE STAPELN SPIEL
// ========================================
class GiftStackGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.score = 0;
        this.gameActive = false;
        this.gifts = [];
        this.currentGift = null;
        this.stackHeight = 0;
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="minigame-container">
                <div class="game-header">
                    <div class="game-score">🎁 Geschenke: <span id="stack-score">0</span></div>
                </div>
                <div class="stack-canvas" id="stack-canvas">
                    <div class="stack-target-zone"></div>
                    <div class="game-instructions">
                        Staple die Geschenke aufeinander!<br>
                        Klicke, um das Geschenk fallen zu lassen! 🎁<br>
                        <small style="opacity: 0.8;">Ziel: Treffe die grüne Zone!</small>
                    </div>
                    <div class="stack-ground"></div>
                </div>
                <button class="game-button" id="start-button">Spiel starten! 🎮</button>
            </div>
        `;
        
        document.getElementById('start-button').addEventListener('click', () => this.start());
        
        // Show start overlay
        this.showGameStartOverlay();
    }
    
    showGameStartOverlay() {
        const overlay = document.getElementById('overlay-container');
        overlay.innerHTML = `
            <div class="game-overlay active">
                <div class="overlay-content">
                    <h1>🎁 Geschenke Stapeln 🎁</h1>
                    <div class="game-info-container">
                        <div class="game-info-list">
                            <div class="info-item">
                                <span class="info-icon">➡️</span>
                                <span class="info-text">Das Geschenk bewegt sich horizontal hin und her</span>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">👆</span>
                                <span class="info-text">Klicke zur richtigen Zeit, um es fallen zu lassen</span>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">🎯</span>
                                <span class="info-text">Treffe die grüne Zielzone in der Mitte!</span>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">📦</span>
                                <span class="info-text">Staple so viele Geschenke wie möglich!</span>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">⚡</span>
                                <span class="info-text">Mit jedem Geschenk wird es schneller!</span>
                            </div>
                        </div>
                    </div>
                    <button class="game-button start-pulse" onclick="document.getElementById('overlay-container').innerHTML = ''; document.getElementById('start-button').click();">
                        Spiel starten! 🎮
                    </button>
                </div>
            </div>
        `;
    }
    
    start() {
        this.score = 0;
        this.stackHeight = 50;
        this.gameActive = true;
        this.gifts = [];
        this.currentGift = null;
        this.lastGiftPosition = 50; // Startposition in der Mitte (50%)
        this.isDropping = false; // Verhindert Doppel-Klicks
        
        const instructions = this.container.querySelector('.game-instructions');
        if (instructions) instructions.style.display = 'none';
        
        const canvas = document.getElementById('stack-canvas');
        const existingGifts = canvas.querySelectorAll('.falling-gift, .stacked-gift, .missed-gift, .game-over');
        existingGifts.forEach(g => g.remove());
        
        document.getElementById('start-button').style.display = 'none';
        document.getElementById('stack-score').textContent = '0';
        
        // Verwende benannte Funktion für Click-Listener, um doppelte zu vermeiden
        if (!this.clickHandler) {
            this.clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.dropGift();
            };
        }
        canvas.removeEventListener('click', this.clickHandler);
        canvas.removeEventListener('touchend', this.clickHandler);
        canvas.addEventListener('click', this.clickHandler, { passive: false });
        canvas.addEventListener('touchend', this.clickHandler, { passive: false });
        
        this.spawnGift();
    }
    
    spawnGift() {
        if (!this.gameActive) return;
        
        const canvas = document.getElementById('stack-canvas');
        const gift = document.createElement('div');
        gift.className = 'falling-gift';
        
        const gifts = ['🎁', '🎀', '📦', '🎉'];
        gift.textContent = gifts[Math.floor(Math.random() * gifts.length)];
        
        gift.style.left = '50%';
        gift.style.top = '20px';
        gift.style.transform = 'translateX(-50%)';
        
        canvas.appendChild(gift);
        this.currentGift = gift;
        
        this.moveGiftHorizontally(gift);
    }
    
    moveGiftHorizontally(gift) {
        let position = 50;
        let direction = 1;
        
        // Geschwindigkeit erhöht sich mit jedem gestapelten Geschenk (wird schwieriger!)
        const baseSpeed = 2;
        const speedIncrease = this.score * 0.3; // +0.3 pro Geschenk
        const speed = baseSpeed + speedIncrease;
        
        const move = setInterval(() => {
            if (!this.gameActive || !gift.parentNode || !gift.classList.contains('falling-gift')) {
                clearInterval(move);
                return;
            }
            
            position += direction * speed;
            
            if (position >= 90 || position <= 10) {
                direction *= -1;
            }
            
            gift.style.left = position + '%';
        }, 20);
        
        gift.dataset.moveInterval = move;
    }
    
    dropGift() {
        if (!this.currentGift || !this.gameActive) return;
        
        // Verhindere mehrfaches Ausführen
        if (this.isDropping) return;
        this.isDropping = true;
        
        clearInterval(parseInt(this.currentGift.dataset.moveInterval));
        
        const gift = this.currentGift;
        const canvas = document.getElementById('stack-canvas');
        const canvasRect = canvas.getBoundingClientRect();
        
        // Aktuelle Position des fallenden Geschenks in Prozent
        const currentPosition = parseFloat(gift.style.left);
        
        // Berechne Distanz zum letzten gestapelten Geschenk
        const distance = Math.abs(currentPosition - this.lastGiftPosition);
        
        // Treffer-Toleranz: 8% (entspricht der Geschenk-Breite)
        const tolerance = 8;
        
        const targetBottom = canvasRect.height - 50 - this.stackHeight;
        
        gift.style.transition = 'top 0.5s ease-in';
        gift.style.top = targetBottom + 'px';
        
        setTimeout(() => {
            if (distance < tolerance) {
                this.score++;
                this.stackHeight += 40;
                this.lastGiftPosition = currentPosition; // Merke Position für nächstes Geschenk
                gift.classList.remove('falling-gift');
                gift.classList.add('stacked-gift');
                gift.style.transition = 'none';
                document.getElementById('stack-score').textContent = this.score;
                
                // Speichere gestapeltes Geschenk
                this.gifts.push(gift);
                
                // Visuelles Feedback bei Difficulty-Steigerung (alle 5 Punkte)
                if (this.score > 0 && this.score % 5 === 0) {
                    this.showSpeedNotification();
                }
                
                // Scrolle Canvas nach oben, wenn Stapel zu hoch wird
                this.adjustCanvasView();
                
                this.currentGift = null;
                this.isDropping = false; // Erlaube nächsten Drop
                setTimeout(() => this.spawnGift(), 500);
            } else {
                // Geschenk ist daneben gefallen - zeige Fehler-Animation
                gift.classList.remove('falling-gift');
                gift.classList.add('missed-gift');
                
                // Pulsiere das verfehlte Geschenk
                gift.style.animation = 'missedPulse 0.8s ease-out';
                
                // Warte auf Animation, dann Game Over
                setTimeout(() => {
                    this.isDropping = false;
                    this.endGame();
                }, 1000);
            }
        }, 500);
    }
    
    adjustCanvasView() {
        const canvas = document.getElementById('stack-canvas');
        
        // Wenn Stapel höher als 300px (ca. 7-8 Geschenke), scrolle nach oben
        if (this.stackHeight > 300) {
            const scrollAmount = this.stackHeight - 300;
            
            // Bewege alle gestapelten Geschenke nach unten (visuell nach oben)
            const stackedGifts = canvas.querySelectorAll('.stacked-gift');
            stackedGifts.forEach(g => {
                const currentTop = parseInt(g.style.top) || 0;
                g.style.top = (currentTop + 40) + 'px';
            });
            
            // Setze stackHeight zurück, damit neue Geschenke an der richtigen Position spawnen
            this.stackHeight = 300;
        }
    }
    
    showSpeedNotification() {
        const canvas = document.getElementById('stack-canvas');
        const notification = document.createElement('div');
        notification.className = 'speed-notification';
        notification.innerHTML = '⚡ Schneller! ⚡';
        notification.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 215, 0, 0.95);
            color: #d32f2f;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            animation: speedPulse 0.8s ease-out;
            pointer-events: none;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.5);
        `;
        
        canvas.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 800);
    }
    
    async endGame() {
        this.gameActive = false;
        
        // Speichere Score in der Highscore-Liste
        if (typeof window.StatsManager !== 'undefined') {
            await window.StatsManager.saveScore('gift-stack', this.score, 0);
        }
        
        this.showGameOverOverlay();
    }
    
    async showGameOverOverlay() {
        // Lade Top 3 Highscores
        let top3HTML = '';
        if (typeof window.StatsManager !== 'undefined') {
            const top3 = await window.StatsManager.getTop3('gift-stack');
            if (top3 && top3.length > 0) {
                top3HTML = `
                    <div class="top3-container">
                        <h3>🏆 Top 3 Highscores 🏆</h3>
                        <div class="top3-list">
                            ${top3.map((entry, index) => `
                                <div class="highscore-row ${entry.username === window.StatsManager?.username ? 'current-player' : ''}">
                                    <span class="rank">${['🥇', '🥈', '🥉'][index]}</span>
                                    <span class="name">${entry.username}</span>
                                    <span class="score">${entry.highscore} 🎁</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        const overlay = document.getElementById('overlay-container');
        overlay.innerHTML = `
            <div class="game-overlay active">
                <div class="overlay-content">
                    <h1>🎁 Spiel vorbei! 🎁</h1>
                    <div class="stats-display">
                        <div class="stat-item">
                            <span class="stat-label">📦 Geschenke gestapelt</span>
                            <span class="stat-value">${this.score}</span>
                        </div>
                    </div>
                    <p style="font-size: 1.2rem; color: rgba(255, 255, 255, 0.9); margin: 20px 0;">
                        ${this.getScoreMessage()}
                    </p>
                    ${top3HTML}
                    <div class="button-group">
                        <button class="game-button" onclick="document.getElementById('overlay-container').innerHTML = ''; document.getElementById('start-button').click();">
                            🔄 Nochmal spielen
                        </button>
                        <button class="game-button secondary" onclick="history.back();">
                            🎄 Zurück zum Kalender
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getScoreMessage() {
        if (this.score >= 15) return '🌟 Unglaublich! Du bist ein Stapel-Meister!';
        if (this.score >= 10) return '⭐ Fantastisch! Sehr gut!';
        if (this.score >= 5) return '✨ Gut gemacht!';
        return '🎄 Nicht schlecht! Versuch es nochmal!';
    }
}
