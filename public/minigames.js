// ========================================
// SPIEL 1: SCHNEEFLOCKEN FANGEN
// ========================================
class SnowflakeCatcherGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.score = 0;
        this.timeLeft = 30;
        this.gameActive = false;
        this.snowflakes = [];
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="minigame-container">
                <div class="game-header">
                    <div class="game-score">❄️ Punkte: <span id="score">0</span></div>
                    <div class="game-timer">⏰ Zeit: <span id="timer">30</span>s</div>
                </div>
                <div class="game-canvas" id="game-canvas">
                    <div class="game-instructions">
                        Fange so viele Schneeflocken wie möglich!<br>
                        Klicke auf die Schneeflocken! ❄️
                    </div>
                </div>
                <button class="game-button" id="start-button">Spiel starten! 🎮</button>
            </div>
        `;
        
        document.getElementById('start-button').addEventListener('click', () => this.start());
    }
    
    start() {
        this.score = 0;
        this.timeLeft = 30;
        this.gameActive = true;
        this.snowflakes = [];
        
        // Canvas leeren und Anleitung/Game Over entfernen
        const canvas = document.getElementById('game-canvas');
        const instructions = canvas.querySelector('.game-instructions');
        const gameOver = canvas.querySelector('.game-over');
        if (instructions) instructions.style.display = 'none';
        if (gameOver) gameOver.remove();
        
        document.getElementById('start-button').disabled = true;
        document.getElementById('start-button').textContent = 'Spiel läuft...';
        
        this.updateDisplay();
        this.startTimer();
        this.spawnSnowflakes();
    }
    
    startTimer() {
        const interval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('timer').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                clearInterval(interval);
                this.endGame();
            }
        }, 1000);
    }
    
    spawnSnowflakes() {
        if (!this.gameActive) return;
        
        const canvas = document.getElementById('game-canvas');
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake-catch';
        snowflake.innerHTML = '❄️';
        snowflake.style.left = Math.random() * (canvas.offsetWidth - 40) + 'px';
        snowflake.style.top = '0px';
        
        canvas.appendChild(snowflake);
        this.snowflakes.push(snowflake);
        
        snowflake.addEventListener('click', () => {
            if (this.gameActive) {
                this.score += 10;
                this.updateDisplay();
                snowflake.remove();
                this.playSound('catch');
            }
        });
        
        this.animateSnowflake(snowflake);
        
        if (this.gameActive) {
            setTimeout(() => this.spawnSnowflakes(), 800);
        }
    }
    
    animateSnowflake(snowflake) {
        let top = 0;
        const speed = 2 + Math.random() * 2;
        
        const fall = setInterval(() => {
            if (!this.gameActive || !snowflake.parentNode) {
                clearInterval(fall);
                return;
            }
            
            top += speed;
            snowflake.style.top = top + 'px';
            
            if (top > document.getElementById('game-canvas').offsetHeight) {
                clearInterval(fall);
                snowflake.remove();
            }
        }, 30);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
    }
    
    playSound(type) {
        // Einfacher Feedback-Effekt
        const btn = document.getElementById('start-button');
        btn.style.transform = 'scale(1.1)';
        setTimeout(() => btn.style.transform = 'scale(1)', 100);
    }
    
    endGame() {
        this.gameActive = false;
        
        const canvas = document.getElementById('game-canvas');
        const gameOver = document.createElement('div');
        gameOver.className = 'game-over';
        gameOver.innerHTML = `
            <div class="game-over-title">🎉 Geschafft! 🎉</div>
            <div class="game-over-score">Du hast <strong>${this.score}</strong> Punkte erreicht!</div>
            <div class="game-over-message">${this.getScoreMessage()}</div>
        `;
        canvas.innerHTML = '';
        canvas.appendChild(gameOver);
        
        document.getElementById('start-button').disabled = false;
        document.getElementById('start-button').textContent = 'Nochmal spielen! 🔄';
    }
    
    getScoreMessage() {
        if (this.score >= 200) return '🌟 Fantastisch! Du bist ein Schneeflocken-Meister!';
        if (this.score >= 150) return '⭐ Super! Sehr gut gemacht!';
        if (this.score >= 100) return '✨ Toll! Das war gut!';
        return '❄️ Nicht schlecht! Versuch es nochmal!';
    }
}

// ========================================
// SPIEL 2: WEIHNACHTS-MEMORY
// ========================================
class ChristmasMemoryGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cards = ['🎅', '🎄', '🎁', '⭐', '🔔', '🕯️', '🦌', '⛄'];
        this.gameCards = [...this.cards, ...this.cards];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="minigame-container">
                <div class="game-header">
                    <div class="game-score">🎯 Züge: <span id="moves">0</span></div>
                    <div class="game-timer">✨ Paare: <span id="pairs">0</span>/8</div>
                </div>
                <div class="memory-grid" id="memory-grid"></div>
                <button class="game-button" id="start-button">Spiel starten! 🎮</button>
            </div>
        `;
        
        document.getElementById('start-button').addEventListener('click', () => this.start());
    }
    
    start() {
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        
        document.getElementById('moves').textContent = '0';
        document.getElementById('pairs').textContent = '0';
        document.getElementById('start-button').style.display = 'none';
        
        // Entferne vorheriges Game Over falls vorhanden
        const grid = document.getElementById('memory-grid');
        const gameOver = grid.querySelector('.game-over');
        if (gameOver) gameOver.remove();
        
        this.shuffleCards();
        this.renderCards();
    }
    
    shuffleCards() {
        for (let i = this.gameCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.gameCards[i], this.gameCards[j]] = [this.gameCards[j], this.gameCards[i]];
        }
    }
    
    renderCards() {
        const grid = document.getElementById('memory-grid');
        grid.innerHTML = '';
        
        this.gameCards.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            card.dataset.symbol = symbol;
            card.innerHTML = '<div class="memory-card-inner"><div class="memory-card-front">?</div><div class="memory-card-back"></div></div>';
            
            card.addEventListener('click', () => this.flipCard(card, symbol));
            grid.appendChild(card);
        });
    }
    
    flipCard(card, symbol) {
        if (card.classList.contains('flipped') || card.classList.contains('matched') || this.flippedCards.length >= 2) {
            return;
        }
        
        card.classList.add('flipped');
        card.querySelector('.memory-card-back').textContent = symbol;
        this.flippedCards.push({ card, symbol });
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            document.getElementById('moves').textContent = this.moves;
            
            setTimeout(() => this.checkMatch(), 800);
        }
    }
    
    checkMatch() {
        const [first, second] = this.flippedCards;
        
        if (first.symbol === second.symbol) {
            first.card.classList.add('matched');
            second.card.classList.add('matched');
            this.matchedPairs++;
            document.getElementById('pairs').textContent = this.matchedPairs;
            
            if (this.matchedPairs === 8) {
                setTimeout(() => this.endGame(), 500);
            }
        } else {
            first.card.classList.remove('flipped');
            second.card.classList.remove('flipped');
        }
        
        this.flippedCards = [];
    }
    
    endGame() {
        const grid = document.getElementById('memory-grid');
        const gameOver = document.createElement('div');
        gameOver.className = 'game-over';
        gameOver.innerHTML = `
            <div class="game-over-title">🎉 Gewonnen! 🎉</div>
            <div class="game-over-score">Du hast alle Paare in <strong>${this.moves}</strong> Zügen gefunden!</div>
            <div class="game-over-message">${this.getScoreMessage()}</div>
        `;
        grid.innerHTML = '';
        grid.appendChild(gameOver);
        
        document.getElementById('start-button').style.display = 'block';
        document.getElementById('start-button').textContent = 'Nochmal spielen! 🔄';
    }
    
    getScoreMessage() {
        if (this.moves <= 12) return '🌟 Perfekt! Unglaubliches Gedächtnis!';
        if (this.moves <= 16) return '⭐ Sehr gut! Du hast ein tolles Gedächtnis!';
        if (this.moves <= 24) return '✨ Gut gemacht!';
        return '🎄 Geschafft! Versuch es nochmal für eine bessere Zeit!';
    }
}

// ========================================
// SPIEL 3: GESCHENKE STAPELN
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
    }
    
    start() {
        this.score = 0;
        this.stackHeight = 50;
        this.gameActive = true;
        this.gifts = [];
        this.currentGift = null;
        
        const instructions = this.container.querySelector('.game-instructions');
        if (instructions) instructions.style.display = 'none';
        
        const canvas = document.getElementById('stack-canvas');
        const existingGifts = canvas.querySelectorAll('.falling-gift, .stacked-gift, .game-over');
        existingGifts.forEach(g => g.remove());
        
        document.getElementById('start-button').style.display = 'none';
        document.getElementById('stack-score').textContent = '0';
        
        // Verwende benannte Funktion für Click-Listener, um doppelte zu vermeiden
        if (!this.clickHandler) {
            this.clickHandler = () => this.dropGift();
        }
        canvas.removeEventListener('click', this.clickHandler);
        canvas.addEventListener('click', this.clickHandler);
        
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
        
        clearInterval(parseInt(this.currentGift.dataset.moveInterval));
        
        const gift = this.currentGift;
        const canvas = document.getElementById('stack-canvas');
        const canvasRect = canvas.getBoundingClientRect();
        const giftRect = gift.getBoundingClientRect();
        
        const giftCenterX = giftRect.left + giftRect.width / 2 - canvasRect.left;
        const canvasCenterX = canvasRect.width / 2;
        const distance = Math.abs(giftCenterX - canvasCenterX);
        
        const targetBottom = canvasRect.height - 50 - this.stackHeight;
        
        gift.style.transition = 'top 0.5s ease-in';
        gift.style.top = targetBottom + 'px';
        
        setTimeout(() => {
            if (distance < 80) {
                this.score++;
                this.stackHeight += 40;
                gift.classList.remove('falling-gift');
                gift.classList.add('stacked-gift');
                gift.style.transition = 'none';
                document.getElementById('stack-score').textContent = this.score;
                
                // Visuelles Feedback bei Difficulty-Steigerung (alle 5 Punkte)
                if (this.score > 0 && this.score % 5 === 0) {
                    this.showSpeedNotification();
                }
                
                // Scrolle Canvas nach oben, wenn Stapel zu hoch wird
                this.adjustCanvasView();
                
                this.currentGift = null;
                setTimeout(() => this.spawnGift(), 500);
            } else {
                this.endGame();
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
    
    endGame() {
        this.gameActive = false;
        
        const canvas = document.getElementById('stack-canvas');
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.innerHTML = `
            <div class="game-over-title">🎁 Spiel vorbei! 🎁</div>
            <div class="game-over-score">Du hast <strong>${this.score}</strong> Geschenke gestapelt!</div>
            <div class="game-over-message">${this.getScoreMessage()}</div>
        `;
        
        canvas.appendChild(overlay);
        
        document.getElementById('start-button').style.display = 'block';
        document.getElementById('start-button').textContent = 'Nochmal spielen! 🔄';
    }
    
    getScoreMessage() {
        if (this.score >= 15) return '🌟 Unglaublich! Du bist ein Stapel-Meister!';
        if (this.score >= 10) return '⭐ Fantastisch! Sehr gut!';
        if (this.score >= 5) return '✨ Gut gemacht!';
        return '🎄 Nicht schlecht! Versuch es nochmal!';
    }
}

// ========================================
// SPIEL 4: FLAPPY SANTA (Flappy Bird Clone)
// ========================================
class FlappySantaGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.score = 0;
        this.gameActive = false;
        this.santa = null;
        this.obstacles = [];
        this.velocity = 0;
        this.gravity = 0.35;
        this.jumpStrength = -6;
        this.gameLoop = null;
        this.baseObstacleSpeed = 2;
        this.obstacleSpeed = 2;
        this.obstacleInterval = null;
        this.obstacleSpawnTime = 2500;
        this.currentGap = 280;
        this.gameStarted = false;
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="minigame-container">
                <div class="game-header">
                    <div class="game-score">🎅 Punkte: <span id="flappy-score">0</span></div>
                    <div class="game-info">Leertaste oder Klick zum Fliegen!</div>
                </div>
                <div class="flappy-canvas" id="flappy-canvas">
                    <div class="flappy-instructions">
                        <h3>🎅 Flappy Santa! 🎄</h3>
                        <p>Fliege mit dem Weihnachtsmann durch die Stadt!</p>
                        <p>Weiche den Schornsteinen und Gewitterwolken aus!</p>
                        <p><strong>Drücke LEERTASTE oder klicke zum Fliegen!</strong></p>
                    </div>
                </div>
                <button class="game-button" id="flappy-start-button">Spiel starten! 🎮</button>
            </div>
        `;
        
        document.getElementById('flappy-start-button').addEventListener('click', () => this.start());
    }
    
    start() {
        this.score = 0;
        this.velocity = 0;
        this.gameActive = true;
        this.gameStarted = false;
        this.obstacles = [];
        this.obstacleSpeed = this.baseObstacleSpeed;
        this.obstacleSpawnTime = 2500;
        this.currentGap = 280;
        
        const instructions = this.container.querySelector('.flappy-instructions');
        if (instructions) instructions.style.display = 'none';
        
        const canvas = document.getElementById('flappy-canvas');
        const existingElements = canvas.querySelectorAll('.santa, .obstacle, .game-over, .ready-message');
        existingElements.forEach(el => el.remove());
        
        document.getElementById('flappy-start-button').style.display = 'none';
        document.getElementById('flappy-score').textContent = '0';
        
        this.createSanta();
        this.showReadyMessage();
        this.setupControls();
        this.gameLoop = setInterval(() => this.update(), 20);
    }
    
    createSanta() {
        const canvas = document.getElementById('flappy-canvas');
        this.santa = document.createElement('div');
        this.santa.className = 'santa';
        this.santa.innerHTML = '🛷';
        this.santa.style.left = '100px';
        this.santa.style.top = '220px'; // Mehr in der Mitte
        canvas.appendChild(this.santa);
    }
    
    setupControls() {
        this.jumpHandler = (e) => {
            if (e.code === 'Space' || e.type === 'click') {
                e.preventDefault();
                this.jump();
            }
        };
        
        document.addEventListener('keydown', this.jumpHandler);
        document.getElementById('flappy-canvas').addEventListener('click', this.jumpHandler);
    }
    
    showReadyMessage() {
        const canvas = document.getElementById('flappy-canvas');
        const message = document.createElement('div');
        message.className = 'ready-message';
        message.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 1rem;">🛷</div>
            <div style="font-size: 1.5rem; font-weight: bold;">Bereit?</div>
            <div style="font-size: 1rem; margin-top: 0.5rem;">Klicke oder drücke Leertaste zum Starten!</div>
        `;
        canvas.appendChild(message);
    }
    
    jump() {
        if (!this.gameActive) return;
        
        // Beim ersten Klick: Spiel starten
        if (!this.gameStarted) {
            this.gameStarted = true;
            const readyMessage = document.querySelector('.ready-message');
            if (readyMessage) readyMessage.remove();
            this.startObstacles();
        }
        
        this.velocity = this.jumpStrength;
        
        // Animations-Feedback
        if (this.santa) {
            this.santa.style.transform = 'rotate(-15deg)';
            setTimeout(() => {
                if (this.santa) this.santa.style.transform = 'rotate(0deg)';
            }, 100);
        }
    }
    
    startObstacles() {
        const spawnObstacle = () => {
            if (!this.gameActive) return;
            this.createObstacle();
            // Nächstes Hindernis mit aktueller Spawn-Zeit planen
            this.obstacleInterval = setTimeout(spawnObstacle, this.obstacleSpawnTime);
        };
        
        // Erstes Hindernis spawnen
        this.obstacleInterval = setTimeout(spawnObstacle, this.obstacleSpawnTime);
    }
    
    increaseDifficulty() {
        let showNotification = false;
        
        // Stufe 1: Ab 3 Punkten - Geschwindigkeit erhöhen
        if (this.score === 3) {
            this.obstacleSpeed += 0.4;
            showNotification = true;
        }
        
        // Stufe 2: Ab 6 Punkten - Geschwindigkeit + Spawn-Zeit verkürzen
        if (this.score === 6) {
            this.obstacleSpeed += 0.4;
            this.obstacleSpawnTime = 2200;
            showNotification = true;
        }
        
        // Stufe 3: Ab 10 Punkten - Geschwindigkeit + Lücke verkleinern
        if (this.score === 10) {
            this.obstacleSpeed += 0.5;
            this.currentGap = 260;
            showNotification = true;
        }
        
        // Stufe 4: Ab 15 Punkten - Spawn-Zeit + Lücke
        if (this.score === 15) {
            this.obstacleSpawnTime = 1900;
            this.currentGap = 245;
            showNotification = true;
        }
        
        // Stufe 5: Ab 20 Punkten - Geschwindigkeit + Lücke
        if (this.score === 20) {
            this.obstacleSpeed += 0.5;
            this.currentGap = 230;
            showNotification = true;
        }
        
        // Stufe 6: Ab 25 Punkten - Alles etwas schwerer
        if (this.score === 25) {
            this.obstacleSpeed += 0.4;
            this.obstacleSpawnTime = 1700;
            this.currentGap = 220;
            showNotification = true;
        }
        
        if (showNotification) {
            this.showSpeedNotification();
        }
    }
    
    createObstacle() {
        const canvas = document.getElementById('flappy-canvas');
        const canvasHeight = 500;
        const gap = this.currentGap; // Dynamische Lücke
        const minHeight = 40;
        const maxHeight = canvasHeight - gap - minHeight;
        
        // Zufällige Höhe für unteres Hindernis
        const bottomHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        const topHeight = canvasHeight - bottomHeight - gap;
        
        // Zufälliger Typ: Schornstein oder Gewitterwolke
        const types = [
            { top: '⛈️', bottom: '🏠', class: 'chimney' },
            { top: '⛈️⚡', bottom: '🏘️', class: 'storm' },
            { top: '☁️⚡', bottom: '🏢', class: 'cloud' }
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Oberes Hindernis
        const topObstacle = document.createElement('div');
        topObstacle.className = `obstacle obstacle-top ${type.class}`;
        topObstacle.style.height = topHeight + 'px';
        topObstacle.innerHTML = `<div class="obstacle-content">${type.top}</div>`;
        topObstacle.style.right = '-80px';
        
        // Unteres Hindernis
        const bottomObstacle = document.createElement('div');
        bottomObstacle.className = `obstacle obstacle-bottom ${type.class}`;
        bottomObstacle.style.height = bottomHeight + 'px';
        bottomObstacle.innerHTML = `<div class="obstacle-content">${type.bottom}</div>`;
        bottomObstacle.style.right = '-80px';
        
        canvas.appendChild(topObstacle);
        canvas.appendChild(bottomObstacle);
        
        this.obstacles.push({ top: topObstacle, bottom: bottomObstacle, scored: false });
    }
    
    update() {
        if (!this.gameActive) return;
        
        // Warte auf ersten Klick
        if (!this.gameStarted) {
            return;
        }
        
        // Santa Physik
        this.velocity += this.gravity;
        const currentTop = parseInt(this.santa.style.top);
        const newTop = currentTop + this.velocity;
        
        // Rotation basierend auf Geschwindigkeit
        const rotation = Math.min(Math.max(this.velocity * 3, -30), 60);
        this.santa.style.transform = `rotate(${rotation}deg)`;
        
        // Boden und Decke Kollision
        if (newTop <= 0 || newTop >= 450) {
            this.endGame();
            return;
        }
        
        this.santa.style.top = newTop + 'px';
        
        // Hindernisse bewegen und prüfen
        const santaRect = this.santa.getBoundingClientRect();
        
        this.obstacles = this.obstacles.filter(obstacle => {
            const topRect = obstacle.top.getBoundingClientRect();
            const bottomRect = obstacle.bottom.getBoundingClientRect();
            
            const currentRight = parseInt(obstacle.top.style.right);
            const newRight = currentRight + this.obstacleSpeed;
            
            obstacle.top.style.right = newRight + 'px';
            obstacle.bottom.style.right = newRight + 'px';
            
            // Punktevergabe
            if (!obstacle.scored && topRect.right < santaRect.left) {
                obstacle.scored = true;
                this.score++;
                document.getElementById('flappy-score').textContent = this.score;
                
                // Progressive Schwierigkeitssteigerung
                this.increaseDifficulty();
            }
            
            // Kollisionserkennung
            if (this.checkCollision(santaRect, topRect) || this.checkCollision(santaRect, bottomRect)) {
                this.endGame();
                return false;
            }
            
            // Entfernen wenn außerhalb
            if (newRight > 900) {
                obstacle.top.remove();
                obstacle.bottom.remove();
                return false;
            }
            
            return true;
        });
    }
    
    checkCollision(rect1, rect2) {
        // Toleranz: Verkleinere die Hitbox um 15px auf jeder Seite
        const tolerance = 15;
        
        const santa = {
            left: rect1.left + tolerance,
            right: rect1.right - tolerance,
            top: rect1.top + tolerance,
            bottom: rect1.bottom - tolerance
        };
        
        return !(santa.right < rect2.left || 
                 santa.left > rect2.right || 
                 santa.bottom < rect2.top || 
                 santa.top > rect2.bottom);
    }
    
    showSpeedNotification() {
        const canvas = document.getElementById('flappy-canvas');
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
    
    endGame() {
        this.gameActive = false;
        clearInterval(this.gameLoop);
        clearTimeout(this.obstacleInterval);
        
        document.removeEventListener('keydown', this.jumpHandler);
        document.getElementById('flappy-canvas').removeEventListener('click', this.jumpHandler);
        
        const canvas = document.getElementById('flappy-canvas');
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.innerHTML = `
            <div class="game-over-title">🎅 Ho Ho Ho! 🎄</div>
            <div class="game-over-score">Du hast <strong>${this.score}</strong> Hindernisse gemeistert!</div>
            <div class="game-over-message">${this.getScoreMessage()}</div>
        `;
        
        canvas.appendChild(overlay);
        
        document.getElementById('flappy-start-button').style.display = 'block';
        document.getElementById('flappy-start-button').textContent = 'Nochmal fliegen! 🔄';
    }
    
    getScoreMessage() {
        if (this.score >= 20) return '🌟 Legendär! Du bist der beste Weihnachtsmann-Pilot!';
        if (this.score >= 15) return '⭐ Fantastisch! Santa wäre stolz!';
        if (this.score >= 10) return '✨ Super! Gute Flugkünste!';
        if (this.score >= 5) return '🎄 Gut! Weiter so!';
        return '🎅 Übung macht den Meister! Versuch es nochmal!';
    }
}

// ========================================
// SPIEL 5: SANTA RUN - Moved to separate page (santa-run.html)
// ========================================

// ========================================
// SPIEL 6: GESCHENKE FANGEN (Catch Game)
// ========================================
class GiftCatcherGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.score = 0;
        this.gameActive = false;
        this.catcher = null;
        this.catcherX = 250;
        this.fallingItems = [];
        this.gameSpeed = 3;
        this.gameLoop = null;
        this.spawnInterval = null;
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="minigame-container">
                <div class="game-header">
                    <div class="game-score">🎁 Geschenke: <span id="catch-score">0</span></div>
                    <div class="game-info">⚠️ Eine Kohle = Game Over!</div>
                </div>
                <div class="catch-canvas" id="catch-canvas">
                    <div class="catch-instructions">
                        <h3>🎅 Geschenke fangen! 🎁</h3>
                        <p>Bewege den Weihnachtsmann mit der Maus oder deinem Finger!</p>
                        <p>🎁 Fange die Geschenke (+10 Punkte)</p>
                        <p>🪨 Weiche der Kohle aus! (Sofort Game Over!)</p>
                        <p><strong>Bereit zum Fangen?</strong></p>
                    </div>
                </div>
                <button class="game-button" id="catch-start-button">Spiel starten! 🎮</button>
            </div>
        `;
        
        document.getElementById('catch-start-button').addEventListener('click', () => this.start());
    }
    
    start() {
        this.score = 0;
        this.gameActive = true;
        this.catcherX = 250;
        this.fallingItems = [];
        this.gameSpeed = 2.5; // Langsamer Start
        this.spawnDelay = 1200; // Längeres Start-Intervall
        
        const instructions = this.container.querySelector('.catch-instructions');
        if (instructions) instructions.style.display = 'none';
        
        const canvas = document.getElementById('catch-canvas');
        const existingElements = canvas.querySelectorAll('.catcher, .falling-item, .game-over');
        existingElements.forEach(el => el.remove());
        
        document.getElementById('catch-start-button').style.display = 'none';
        document.getElementById('catch-score').textContent = '0';
        
        this.createCatcher();
        this.setupControls();
        this.startSpawning();
        this.gameLoop = setInterval(() => this.update(), 20);
    }
    
    createCatcher() {
        const canvas = document.getElementById('catch-canvas');
        this.catcher = document.createElement('div');
        this.catcher.className = 'catcher';
        this.catcher.innerHTML = '🎅';
        this.catcher.style.left = this.catcherX + 'px';
        this.catcher.style.bottom = '20px';
        canvas.appendChild(this.catcher);
    }
    
    setupControls() {
        const canvas = document.getElementById('catch-canvas');
        
        // Maus-Bewegung
        this.moveHandler = (e) => {
            if (!this.gameActive) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            this.catcherX = Math.max(40, Math.min(x, rect.width - 40));
            this.catcher.style.left = this.catcherX + 'px';
        };
        
        // Touch-Bewegung
        this.touchMoveHandler = (e) => {
            if (!this.gameActive) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            this.catcherX = Math.max(40, Math.min(x, rect.width - 40));
            this.catcher.style.left = this.catcherX + 'px';
        };
        
        canvas.addEventListener('mousemove', this.moveHandler);
        canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    }
    
    startSpawning() {
        const spawnLoop = () => {
            if (!this.gameActive) return;
            this.spawnItem();
            this.spawnTimeout = setTimeout(spawnLoop, this.spawnDelay);
        };
        spawnLoop();
    }
    
    spawnItem() {
        const canvas = document.getElementById('catch-canvas');
        const canvasRect = canvas.getBoundingClientRect();
        
        const item = document.createElement('div');
        item.className = 'falling-item';
        
        // 25% Geschenke, 75% Kohle (SCHWER!)
        const isGift = Math.random() < 0.25;
        item.innerHTML = isGift ? '🎁' : '🪨';
        item.dataset.type = isGift ? 'gift' : 'coal';
        
        // Zufällige X-Position
        const x = Math.random() * (canvasRect.width - 60) + 30;
        item.style.left = x + 'px';
        item.style.top = '-60px';
        
        canvas.appendChild(item);
        this.fallingItems.push({
            element: item,
            x: x,
            y: -60,
            type: isGift ? 'gift' : 'coal'
        });
    }
    
    update() {
        if (!this.gameActive) return;
        
        // Sanftere Schwierigkeitssteigerung alle 15 Geschenke (150 Punkte)
        if (this.score > 0 && this.score % 150 === 0) {
            if (this.gameSpeed < 5) {
                this.gameSpeed += 0.3; // Kleinere Geschwindigkeitserhöhung
                // Spawn-Intervall nur leicht verringern
                if (this.spawnDelay > 600) {
                    this.spawnDelay -= 80; // Von 1200ms bis minimal 600ms
                }
            }
        }
        
        const catcherRect = this.catcher.getBoundingClientRect();
        const canvasRect = document.getElementById('catch-canvas').getBoundingClientRect();
        
        // Items bewegen
        this.fallingItems = this.fallingItems.filter(item => {
            item.y += this.gameSpeed;
            item.element.style.top = item.y + 'px';
            
            const itemRect = item.element.getBoundingClientRect();
            
            // Kollision mit Fänger prüfen
            if (this.checkCollision(catcherRect, itemRect)) {
                if (item.type === 'gift') {
                    // Geschenk gefangen!
                    this.score += 10;
                    document.getElementById('catch-score').textContent = this.score;
                    this.showCatchEffect('🎁 +10', '#4CAF50');
                } else {
                    // Kohle gefangen = SOFORT GAME OVER!
                    this.showCatchEffect('💥 GAME OVER!', '#f44336');
                    item.element.remove();
                    this.endGame();
                    return false;
                }
                item.element.remove();
                return false;
            }
            
            // Item am Boden angekommen
            if (item.y > canvasRect.height) {
                // Verpasste Items werden einfach entfernt (keine Strafe)
                item.element.remove();
                return false;
            }
            
            return true;
        });
    }
    
    checkCollision(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }
    
    showCatchEffect(text, color) {
        const canvas = document.getElementById('catch-canvas');
        const effect = document.createElement('div');
        effect.className = 'catch-effect';
        effect.textContent = text;
        effect.style.cssText = `
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${color};
            font-size: 2rem;
            font-weight: bold;
            z-index: 1000;
            animation: floatUp 0.8s ease-out;
            pointer-events: none;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;
        
        canvas.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 800);
    }
    
    endGame() {
        this.gameActive = false;
        clearInterval(this.gameLoop);
        clearTimeout(this.spawnTimeout);
        
        const canvas = document.getElementById('catch-canvas');
        canvas.removeEventListener('mousemove', this.moveHandler);
        canvas.removeEventListener('touchmove', this.touchMoveHandler);
        
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.innerHTML = `
            <div class="game-over-title">🎅 Spiel vorbei! 🎁</div>
            <div class="game-over-score">Du hast <strong>${this.score}</strong> Punkte erreicht!</div>
            <div class="game-over-score">Geschenke gefangen: <strong>${Math.floor(this.score / 10)}</strong> 🎁</div>
            <div class="game-over-message">${this.getScoreMessage()}</div>
        `;
        
        canvas.appendChild(overlay);
        
        document.getElementById('catch-start-button').style.display = 'block';
        document.getElementById('catch-start-button').textContent = 'Nochmal spielen! 🔄';
    }
    
    getScoreMessage() {
        const gifts = Math.floor(this.score / 10);
        if (gifts >= 50) return '🌟 Unglaublich! Du bist ein Geschenke-Meister!';
        if (gifts >= 30) return '⭐ Fantastisch! Tolle Reaktion!';
        if (gifts >= 20) return '✨ Super! Sehr geschickt!';
        if (gifts >= 10) return '🎄 Gut gemacht! Weiter üben!';
        return '🎅 Nicht schlecht! Versuch es nochmal!';
    }
}

// === Santa Snake Game ===
class SantaSnakeGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.gridSize = 18; // 18x18 Grid
        this.tileSize = 20;
        this.offsetX = 6; // Dünnerer Rand (war 16px)
        this.offsetY = 6;
        this.snake = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gift = null;
        this.score = 0;
        this.gameActive = false;
        this.gameLoop = null;
        this.speed = 200; // Langsamer Start
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.canvas = null; // Canvas-Element cachen
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="snake-game">
                <div class="game-header">
                    <div class="score-display">
                        🎁 Geschenke: <span id="snake-score">0</span>
                    </div>
                    <div class="speed-display">
                        ⚡ Tempo: <span id="snake-speed">1</span>
                    </div>
                </div>
                <div class="snake-canvas" id="snake-canvas">
                    <div class="snake-instructions">
                        <h3>🎅 Santa Snake 🎁</h3>
                        <p>Steuere Santa mit den Pfeiltasten oder Wisch-Gesten!</p>
                        <p>🎁 Sammle Geschenke und werde länger</p>
                        <p>⚠️ Berühre nicht die Wände oder dich selbst!</p>
                        <p><strong>Viel Erfolg!</strong></p>
                    </div>
                </div>
                <button class="game-button" id="snake-start-button">Spiel starten! 🎮</button>
            </div>
        `;
        
        document.getElementById('snake-start-button').addEventListener('click', () => this.start());
        this.container.style.display = 'block';
    }
    
    start() {
        this.score = 0;
        this.gameActive = true;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.speed = 200; // Langsamer Start
        
        // Canvas-Größe checken und Grid/Offset anpassen
        this.canvas = document.getElementById('snake-canvas');
        const canvasWidth = this.canvas.offsetWidth;
        const borderSize = 8; // 4px links + 4px rechts
        
        if (canvasWidth <= 300) {
            // Mobile klein (300px)
            // Innen: 300 - 8 = 292px
            this.gridSize = 14;
            this.tileSize = 20;
            const playfield = 14 * 20; // 280px
            this.offsetX = Math.floor((292 - playfield) / 2); // (292-280)/2 = 6px
            this.offsetY = Math.floor((292 - playfield) / 2);
        } else if (canvasWidth <= 350) {
            // Tablet (350px)
            // Innen: 350 - 8 = 342px
            this.gridSize = 16;
            this.tileSize = 20;
            const playfield = 16 * 20; // 320px
            this.offsetX = Math.floor((342 - playfield) / 2); // (342-320)/2 = 11px
            this.offsetY = Math.floor((342 - playfield) / 2);
        } else {
            // Desktop (400px)
            // Innen: 400 - 8 = 392px
            this.gridSize = 19;
            this.tileSize = 20;
            const playfield = 19 * 20; // 380px
            this.offsetX = Math.floor((392 - playfield) / 2); // (392-380)/2 = 6px
            this.offsetY = Math.floor((392 - playfield) / 2);
        }
        
        // Snake weiter links starten (1/4 vom linken Rand)
        const startX = Math.floor(this.gridSize / 4);
        const centerY = Math.floor(this.gridSize / 2);
        this.snake = [
            { x: startX, y: centerY },
            { x: startX - 1, y: centerY },
            { x: startX - 2, y: centerY }
        ];
        
        const instructions = this.container.querySelector('.snake-instructions');
        if (instructions) instructions.style.display = 'none';
        
        // Canvas wurde bereits oben zugewiesen
        const existingElements = this.canvas.querySelectorAll('.snake-segment, .snake-gift, .game-over');
        existingElements.forEach(el => el.remove());
        
        document.getElementById('snake-start-button').style.display = 'none';
        document.getElementById('snake-score').textContent = '0';
        document.getElementById('snake-speed').textContent = '1';
        
        this.setupControls();
        this.spawnGift();
        this.renderSnake();
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }
    
    setupControls() {
        // Tastatur-Steuerung
        this.keyHandler = (e) => {
            if (!this.gameActive) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    e.preventDefault();
                    break;
            }
        };
        
        // Touch-Steuerung für Mobile
        const canvas = document.getElementById('snake-canvas');
        
        this.touchStartHandler = (e) => {
            if (!this.gameActive) return;
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        };
        
        this.touchEndHandler = (e) => {
            if (!this.gameActive) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;
            
            // Mindestens 30px Bewegung
            if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal
                if (deltaX > 0 && this.direction !== 'left') {
                    this.nextDirection = 'right';
                } else if (deltaX < 0 && this.direction !== 'right') {
                    this.nextDirection = 'left';
                }
            } else {
                // Vertikal
                if (deltaY > 0 && this.direction !== 'up') {
                    this.nextDirection = 'down';
                } else if (deltaY < 0 && this.direction !== 'down') {
                    this.nextDirection = 'up';
                }
            }
        };
        
        document.addEventListener('keydown', this.keyHandler);
        this.canvas.addEventListener('touchstart', this.touchStartHandler);
        this.canvas.addEventListener('touchend', this.touchEndHandler);
    }
    
    spawnGift() {
        let validPosition = false;
        let newGift;
        
        while (!validPosition) {
            newGift = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            
            // Prüfen, ob Position nicht auf Snake ist
            validPosition = !this.snake.some(segment => 
                segment.x === newGift.x && segment.y === newGift.y
            );
        }
        
        this.gift = newGift;
        this.renderGift();
    }
    
    update() {
        if (!this.gameActive) return;
        
        this.direction = this.nextDirection;
        
        // Neuer Kopf basierend auf Richtung
        const head = { ...this.snake[0] };
        
        switch(this.direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // Wand-Kollision prüfen - Grid geht von 0 bis gridSize-1
        // Bei gridSize=18 sind nur 0-17 gültig
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            this.endGame('wall');
            return;
        }
        
        // Selbst-Kollision prüfen
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.endGame('self');
            return;
        }
        
        // Neuen Kopf hinzufügen
        this.snake.unshift(head);
        
        // Geschenk einsammeln?
        if (head.x === this.gift.x && head.y === this.gift.y) {
            this.score++;
            document.getElementById('snake-score').textContent = this.score;
            
            // Geschwindigkeit erhöhen alle 3 Geschenke (sanfter)
            if (this.score % 3 === 0 && this.speed > 60) {
                this.speed -= 8; // Von 200ms runter bis 60ms
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.speed);
                console.log(`Speed erhöht! Geschenke: ${this.score}, Neue Speed: ${this.speed}ms`);
            }
            
            // Geschwindigkeit Level IMMER aktualisieren (basierend auf aktueller Speed)
            const speedLevel = Math.max(1, Math.floor((200 - this.speed) / 8) + 1);
            document.getElementById('snake-speed').textContent = speedLevel;
            
            // WICHTIG: Immer neues Geschenk spawnen UND rendern!
            this.spawnGift();
            // Snake bleibt länger (Schwanz nicht entfernen)
        } else {
            // Schwanz entfernen (wenn kein Geschenk gesammelt)
            this.snake.pop();
        }
        
        this.renderSnake();
    }
    
    renderSnake() {
        const existingSegments = this.canvas.querySelectorAll('.snake-segment');
        existingSegments.forEach(el => el.remove());
        
        this.snake.forEach((segment, index) => {
            const segmentEl = document.createElement('div');
            segmentEl.className = 'snake-segment';
            if (index === 0) {
                segmentEl.classList.add('snake-head');
                segmentEl.innerHTML = '🎅';
            } else {
                segmentEl.innerHTML = '🎁';
            }
            segmentEl.style.left = (segment.x * this.tileSize + this.offsetX) + 'px';
            segmentEl.style.top = (segment.y * this.tileSize + this.offsetY) + 'px';
            this.canvas.appendChild(segmentEl);
        });
    }
    
    renderGift() {
        if (!this.gift || !this.canvas) return; // Sicherheitscheck
        
        const existingGift = this.canvas.querySelector('.snake-gift');
        if (existingGift) existingGift.remove();
        
        const giftEl = document.createElement('div');
        giftEl.className = 'snake-gift';
        giftEl.innerHTML = '✨';
        giftEl.style.left = (this.gift.x * this.tileSize + this.offsetX) + 'px';
        giftEl.style.top = (this.gift.y * this.tileSize + this.offsetY) + 'px';
        this.canvas.appendChild(giftEl);
    }
    
    endGame(reason) {
        this.gameActive = false;
        clearInterval(this.gameLoop);
        
        document.removeEventListener('keydown', this.keyHandler);
        this.canvas.removeEventListener('touchstart', this.touchStartHandler);
        this.canvas.removeEventListener('touchend', this.touchEndHandler);
        
        const reasonText = reason === 'wall' 
            ? '💥 Du bist gegen die Wand gefahren!' 
            : '💥 Du hast dich selbst gebissen!';
        
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.innerHTML = `
            <div class="game-over-title">🎅 Spiel vorbei! 🎁</div>
            <div class="game-over-score">${reasonText}</div>
            <div class="game-over-score">Du hast <strong>${this.score}</strong> Geschenke gesammelt!</div>
            <div class="game-over-message">${this.getScoreMessage()}</div>
        `;
        
        this.canvas.appendChild(overlay);
        document.getElementById('snake-start-button').style.display = 'block';
    }
    
    getScoreMessage() {
        if (this.score >= 50) return '🌟 Unglaublich! Snake-Meister!';
        if (this.score >= 30) return '⭐ Fantastisch! Sehr geschickt!';
        if (this.score >= 20) return '✨ Super! Tolle Leistung!';
        if (this.score >= 10) return '🎄 Gut gemacht! Weiter so!';
        return '🎅 Guter Versuch!';
    }
}
