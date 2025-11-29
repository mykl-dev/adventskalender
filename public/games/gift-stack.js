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
        this.currentLevel = 1; // Level-System
        this.canvasScrollOffset = 0; // Für smooth scrolling
        
        // Speichere Canvas-Breite für Pixel-basierte Berechnungen
        const canvas = document.getElementById('stack-canvas');
        this.canvasWidth = canvas.getBoundingClientRect().width;
        this.lastGiftPosition = this.canvasWidth / 2; // Startposition in der Mitte (in Pixeln)
        
        // Setze Startlevel-Hintergrund
        this.updateBackground(1);
        
        this.isDropping = false; // Verhindert Doppel-Klicks
        
        const instructions = this.container.querySelector('.game-instructions');
        if (instructions) instructions.style.display = 'none';
        
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
        
        // Geschwindigkeit erhöht sich mit Level (alle 5 Geschenke = 1 Level)
        const baseSpeed = 1.0;  // Noch langsamerer Start
        const speedIncrease = this.currentLevel * 0.15; // +0.15 pro Level (langsame Steigerung)
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
        
        // Berechne aktuelle Position in Pixeln (von Prozent)
        const currentPositionPercent = parseFloat(gift.style.left);
        const currentPositionPx = (currentPositionPercent / 100) * canvasRect.width;
        
        // Geschenk-Breite (ca. 48px bei 3rem font-size)
        const giftWidth = 48;
        
        // Zielzone-Parameter (zentriert, 220px breit)
        const targetZoneWidth = 220;
        const targetZoneLeft = (canvasRect.width - targetZoneWidth) / 2;
        const targetZoneRight = targetZoneLeft + targetZoneWidth;
        
        let isValidPlacement = false;
        
        if (this.score === 0) {
            // Erstes Geschenk: Mindestens 50% des Geschenks muss in der grünen Zone sein
            const giftLeft = currentPositionPx - (giftWidth / 2);
            const giftRight = currentPositionPx + (giftWidth / 2);
            
            // Berechne Überlappung mit Zielzone
            const overlapLeft = Math.max(giftLeft, targetZoneLeft);
            const overlapRight = Math.min(giftRight, targetZoneRight);
            const overlapWidth = Math.max(0, overlapRight - overlapLeft);
            
            // Mindestens 50% des Geschenks muss in der Zone sein
            isValidPlacement = (overlapWidth >= giftWidth * 0.5);
        } else {
            // Weitere Geschenke: 40px Toleranz zum vorherigen Geschenk
            const distance = Math.abs(currentPositionPx - this.lastGiftPosition);
            const tolerance = 40;
            isValidPlacement = (distance < tolerance);
        }
        
        const targetBottom = canvasRect.height - 50 - this.stackHeight;
        
        gift.style.transition = 'top 0.5s ease-in';
        gift.style.top = targetBottom + 'px';
        
        setTimeout(() => {
            if (isValidPlacement) {
                this.score++;
                this.stackHeight += 40;
                this.lastGiftPosition = currentPositionPx; // Merke Position in Pixeln für nächstes Geschenk
                gift.classList.remove('falling-gift');
                gift.classList.add('stacked-gift');
                gift.style.transition = 'none';
                document.getElementById('stack-score').textContent = this.score;
                
                // Speichere gestapeltes Geschenk
                this.gifts.push(gift);
                
                // Level-Wechsel alle 5 Geschenke
                if (this.score > 0 && this.score % 5 === 0) {
                    this.currentLevel++;
                    this.showLevelNotification();
                    
                    // Hintergrund-Wechsel alle 2 Level
                    if (this.currentLevel % 2 === 1) {
                        this.updateBackground(this.currentLevel);
                    }
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
        const canvasHeight = canvas.getBoundingClientRect().height;
        
        // Wenn Stapel höher als 60% der Canvas-Höhe, scrolle smooth nach oben
        if (this.stackHeight > canvasHeight * 0.6) {
            this.canvasScrollOffset += 40;
            
            // Bewege alle gestapelten Geschenke smooth nach unten (visuell nach oben)
            const stackedGifts = canvas.querySelectorAll('.stacked-gift');
            stackedGifts.forEach(g => {
                const currentTop = parseInt(g.style.top) || 0;
                g.style.transition = 'top 0.5s ease-out';
                g.style.top = (currentTop + 40) + 'px';
            });
            
            // Bewege auch die Zielzone mit nach unten
            const targetZone = canvas.querySelector('.stack-target-zone');
            if (targetZone) {
                targetZone.style.transition = 'bottom 0.5s ease-out';
                targetZone.style.bottom = (50 + this.canvasScrollOffset) + 'px';
            }
            
            // Bewege Boden mit nach unten
            const ground = canvas.querySelector('.stack-ground');
            if (ground) {
                ground.style.transition = 'bottom 0.5s ease-out';
                ground.style.bottom = this.canvasScrollOffset + 'px';
            }
            
            // Setze stackHeight zurück
            this.stackHeight = canvasHeight * 0.6;
        }
    }
    
    updateBackground(level) {
        const canvas = document.getElementById('stack-canvas');
        
        // Background wechselt alle 2 Level
        const bgStage = Math.floor((level - 1) / 2);
        
        switch(bgStage) {
            case 0: // Level 1-2: Himmel mit Vögeln
                canvas.style.background = 'linear-gradient(180deg, #87ceeb 0%, #e0f6ff 30%, #e0f6ff 70%, #d4af37 100%)';
                canvas.style.animation = 'none';
                break;
            case 1: // Level 3-4: Höher mit Wolken
                canvas.style.background = 'linear-gradient(180deg, #4a90e2 0%, #87ceeb 40%, #b0d9f5 100%)';
                break;
            case 2: // Level 5-6: Noch höher mit Satelliten
                canvas.style.background = 'linear-gradient(180deg, #1a2a4e 0%, #2d4a7c 30%, #4a7ba7 100%)';
                break;
            default: // Level 7+: Weltall
                canvas.style.background = 'linear-gradient(180deg, #000000 0%, #0a0a2e 50%, #1a1a3e 100%)';
                canvas.classList.add('space-bg');
                break;
        }
    }
    
    showLevelNotification() {
        const canvas = document.getElementById('stack-canvas');
        const notification = document.createElement('div');
        notification.className = 'speed-notification';
        notification.innerHTML = `🎮 Level ${this.currentLevel}! 🎮`;
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
