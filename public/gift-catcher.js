class GiftCatcherGame3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.score = 0;
        this.gameActive = false;
        this.catcherX = 0; // Wird in resizeCanvas gesetzt
        this.fallingItems = [];
        this.gameSpeed = 2.5;
        this.spawnDistance = 0; // Distanz zum nächsten Item
        this.spawnSpacing = 0; // Wird basierend auf Bildschirmhöhe berechnet
        this.particles = [];
        this.touchActive = false;
        this.touchStartX = 0;
        this.lastTime = Date.now();
        this.level = 1;
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="gift-game-container">
                <div class="gift-game-header">
                    <div class="gift-score-display">
                        <span class="score-label">🎁</span>
                        <span id="gift-score" class="score-value">0</span>
                    </div>
                    <div class="gift-warning">⚠️ Kohle = Game Over!</div>
                </div>
                
                <!-- Stats Banner -->
                <div class="gift-stats-banner">
                    <div class="stat-box">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-info">
                            <div class="stat-value" id="banner-score">0</div>
                            <div class="stat-label">Punkte</div>
                        </div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <div class="stat-value" id="banner-level">1</div>
                            <div class="stat-label">Level</div>
                        </div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-icon">🚀</div>
                        <div class="stat-info">
                            <div class="stat-value" id="banner-speed">1.0x</div>
                            <div class="stat-label">Speed</div>
                        </div>
                    </div>
                </div>
                
                <canvas id="gift-canvas" class="gift-canvas"></canvas>
                
                <!-- Instructions Overlay -->
                <div class="gift-instructions-overlay" id="gift-instructions-overlay">
                    <div class="instructions-content">
                        <h2>🎅 Geschenke fangen! 🎁</h2>
                        <div class="instruction-items">
                            <div class="instruction-item">
                                <span class="item-icon">🎁</span>
                                <span>Geschenke fangen = +10 Punkte</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">🪨</span>
                                <span>Kohle = Sofort Game Over!</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">📱</span>
                                <span>Finger auf 🎅 halten & bewegen</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">🖱️</span>
                                <span>Maus oder ←→ Tasten</span>
                            </div>
                        </div>
                        <p class="difficulty-info">⚡ Je mehr Geschenke, desto schneller!</p>
                        <button class="instruction-ok-button" id="instruction-ok-button">
                            ✓ Okay, verstanden!
                        </button>
                    </div>
                </div>
                
                <!-- Start Button (erscheint nach OK) -->
                <div class="start-button-overlay" id="start-button-overlay" style="display: none;">
                    <button class="gift-start-button pulse" id="gift-start-button">
                        <span class="button-icon">🎮</span>
                        <span>Spiel starten!</span>
                    </button>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('gift-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        // Anti-Aliasing und smoothes Rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Responsive Canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // OK Button für Instructions
        document.getElementById('instruction-ok-button').addEventListener('click', () => {
            document.getElementById('gift-instructions-overlay').style.display = 'none';
            document.getElementById('start-button-overlay').style.display = 'flex';
        });
        
        // Start Button
        document.getElementById('gift-start-button').addEventListener('click', () => this.start());
        
        // Touch-Events für Canvas
        this.setupTouchControls();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const header = document.querySelector('.gift-game-header');
        const banner = document.querySelector('.gift-stats-banner');
        
        const headerHeight = header ? header.offsetHeight : 50;
        const bannerHeight = banner ? banner.offsetHeight : 60;
        
        // Canvas nimmt gesamte verfügbare Höhe minus Header und Banner
        const availableWidth = container.offsetWidth;
        const availableHeight = container.offsetHeight - headerHeight - bannerHeight;
        
        this.canvas.width = availableWidth;
        this.canvas.height = availableHeight;
        
        // Catcher höher positionieren für bessere Erreichbarkeit auf Mobile
        this.catcherX = this.canvas.width / 2;
        this.catcherY = this.canvas.height - 120; // Weiter oben (war 80)
        this.catcherWidth = Math.min(80, this.canvas.width / 8);
        this.catcherHeight = Math.min(80, this.canvas.width / 8);
        
        // Spawn-Spacing basierend auf Canvas-Höhe (30% der Höhe zwischen Items)
        this.spawnSpacing = Math.max(150, this.canvas.height * 0.3);
    }
    
    setupTouchControls() {
        // Touch Start - Prüfe ob auf Catcher geklickt
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.gameActive) return;
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // Prüfe ob Touch auf Catcher ist
            if (touchX >= this.catcherX - this.catcherWidth / 2 &&
                touchX <= this.catcherX + this.catcherWidth / 2 &&
                touchY >= this.catcherY - this.catcherHeight / 2 &&
                touchY <= this.catcherY + this.catcherHeight / 2) {
                
                this.touchActive = true;
                this.touchStartX = touchX - this.catcherX;
            }
        }, { passive: false });
        
        // Touch Move - Bewege Catcher mit Finger
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.gameActive || !this.touchActive) return;
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            
            // Bewege Catcher relativ zur Touch-Position
            this.catcherX = touchX - this.touchStartX;
            
            // Begrenze auf Canvas
            this.catcherX = Math.max(this.catcherWidth / 2, 
                                     Math.min(this.catcherX, this.canvas.width - this.catcherWidth / 2));
        }, { passive: false });
        
        // Touch End
        this.canvas.addEventListener('touchend', (e) => {
            if (!this.gameActive) return;
            e.preventDefault();
            this.touchActive = false;
        }, { passive: false });
        
        // Maus-Steuerung für Desktop - Direkte Bewegung
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.gameActive) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            
            this.catcherX = mouseX;
            this.catcherX = Math.max(this.catcherWidth / 2, 
                                     Math.min(this.catcherX, this.canvas.width - this.catcherWidth / 2));
        });
        
        // Tastatur-Steuerung
        this.keys = {};
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    async start() {
        // Spielername sicherstellen
        await window.statsManager.ensureUsername();
        
        this.score = 0;
        this.level = 1;
        this.gameActive = true;
        this.fallingItems = [];
        this.particles = [];
        this.gameSpeed = 2.5;
        this.spawnDistance = 0;
        this.spawnSpacing = Math.max(150, this.canvas.height * 0.3); // 30% der Höhe zwischen Items
        this.catcherX = this.canvas.width / 2;
        this.startTime = Date.now();
        
        // Verstecke Start-Button Overlay
        document.getElementById('start-button-overlay').style.display = 'none';
        document.getElementById('gift-score').textContent = '0';
        document.getElementById('banner-score').textContent = '0';
        document.getElementById('banner-level').textContent = '1';
        document.getElementById('banner-speed').textContent = '1.0x';
        
        this.startSpawning();
        this.gameLoop();
    }
    
    startSpawning() {
        // Nichts mehr zu tun - Spawning erfolgt jetzt im update loop
    }
    
    spawnItem() {
        // 60% Geschenke, 40% Kohle (war 30/70 - jetzt viel mehr Geschenke!)
        const isGift = Math.random() < 0.6;
        
        // Wenn Kohle, 35% Chance auf 2 Steine gleichzeitig
        const coalCount = !isGift && Math.random() < 0.35 ? 2 : 1;
        
        for (let i = 0; i < coalCount; i++) {
            const item = {
                x: Math.random() * (this.canvas.width - 80) + 40,
                y: -60 - (i * 50), // Leicht versetzt spawnen
                vx: (Math.random() - 0.5) * 0.5, // Leichte Horizontalbewegung
                vy: this.gameSpeed,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                size: 50 + Math.random() * 20,
                type: isGift ? 'gift' : 'coal',
                scale: 0.5, // Start klein für Spawn-Animation
                opacity: 1
            };
            
            this.fallingItems.push(item);
        }
    }
    
    gameLoop() {
        if (!this.gameActive) return;
        
        const now = Date.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Spawning basierend auf Distanz
        this.spawnDistance += this.gameSpeed;
        if (this.spawnDistance >= this.spawnSpacing) {
            this.spawnItem();
            this.spawnDistance = 0;
            
            // Schwierigkeitssteigerung und Level-Update
            if (this.score > 0 && this.score % 100 === 0) {
                if (this.gameSpeed < 5) {
                    this.gameSpeed += 0.3;
                    // Spawn-Spacing etwas reduzieren bei höheren Levels
                    if (this.spawnSpacing > this.canvas.height * 0.35) {
                        this.spawnSpacing *= 0.95;
                    }
                    this.level = Math.floor(this.score / 100) + 1;
                    this.updateBanner();
                }
            }
        }
        
        // Tastatur-Steuerung
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.catcherX -= 8;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.catcherX += 8;
        }
        
        // Begrenze Position
        this.catcherX = Math.max(this.catcherWidth / 2, 
                                 Math.min(this.catcherX, this.canvas.width - this.catcherWidth / 2));
        
        // Items aktualisieren
        this.fallingItems = this.fallingItems.filter(item => {
            item.y += item.vy;
            item.x += item.vx;
            item.rotation += item.rotationSpeed;
            
            // Spawn-Animation
            if (item.scale < 1) {
                item.scale += 0.05;
            }
            
            // An Wänden abprallen
            if (item.x < item.size / 2 || item.x > this.canvas.width - item.size / 2) {
                item.vx *= -1;
            }
            
            // Kollision mit Catcher prüfen
            const dx = item.x - this.catcherX;
            const dy = item.y - this.catcherY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (item.size / 2 + this.catcherWidth / 2)) {
                if (item.type === 'gift') {
                    // Geschenk gefangen!
                    this.score += 10;
                    document.getElementById('gift-score').textContent = this.score;
                    this.updateBanner();
                    this.createExplosion(item, '#4CAF50');
                    this.showFloatingText('+10 🎁', item.x, item.y, '#4CAF50');
                } else {
                    // Kohle gefangen = Game Over
                    this.createExplosion(item, '#f44336');
                    this.showFloatingText('💥 GAME OVER!', item.x, item.y, '#f44336');
                    this.endGame();
                }
                return false;
            }
            
            // Item unten raus = entfernen
            if (item.y > this.canvas.height + 100) {
                return false;
            }
            
            return true;
        });
        
        // Partikel aktualisieren
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // Gravität
            p.life -= deltaTime;
            p.opacity = Math.max(0, p.life);
            return p.life > 0;
        });
    }
    
    updateBanner() {
        document.getElementById('banner-score').textContent = this.score;
        document.getElementById('banner-level').textContent = this.level;
        const speedMultiplier = (this.gameSpeed / 2.5).toFixed(1);
        document.getElementById('banner-speed').textContent = speedMultiplier + 'x';
        
        // Level-Up Animation
        const levelBox = document.querySelector('.stat-box:nth-child(2)');
        if (levelBox) {
            levelBox.classList.add('level-up');
            setTimeout(() => levelBox.classList.remove('level-up'), 500);
        }
    }
    
    draw() {
        // Canvas leeren
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Hintergrund-Gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a237e');
        gradient.addColorStop(1, '#0d47a1');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Partikel zeichnen
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Fallende Items zeichnen
        this.fallingItems.forEach(item => {
            this.ctx.save();
            this.ctx.translate(item.x, item.y);
            this.ctx.rotate(item.rotation);
            this.ctx.scale(item.scale, item.scale);
            
            if (item.type === 'gift') {
                this.drawGift3D(0, 0, item.size);
            } else {
                this.drawCoal3D(0, 0, item.size);
            }
            
            this.ctx.restore();
        });
        
        // Catcher (Weihnachtsmann) zeichnen
        this.drawSanta3D(this.catcherX, this.catcherY, this.catcherWidth);
        
        // Floating Texts zeichnen
        if (this.floatingTexts) {
            this.floatingTexts.forEach(text => {
                this.ctx.save();
                this.ctx.globalAlpha = text.opacity;
                this.ctx.font = 'bold 24px Arial';
                this.ctx.fillStyle = text.color;
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 3;
                this.ctx.textAlign = 'center';
                this.ctx.strokeText(text.text, text.x, text.y);
                this.ctx.fillText(text.text, text.x, text.y);
                this.ctx.restore();
            });
        }
    }
    
    drawGift3D(x, y, size) {
        const ctx = this.ctx;
        
        ctx.save();
        
        // Schatten unter dem Geschenk
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y + size / 2 + 5, size / 2, size / 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Box-Körper mit radialem 3D-Effekt
        const boxGradient = ctx.createRadialGradient(x - size / 4, y - size / 4, 0, x, y, size);
        boxGradient.addColorStop(0, '#ff6b6b');
        boxGradient.addColorStop(0.5, '#ee5a6f');
        boxGradient.addColorStop(1, '#c92a2a');
        
        ctx.fillStyle = boxGradient;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Goldenes Band (vertikal)
        const bandGradient = ctx.createLinearGradient(x - 10, y, x + 10, y);
        bandGradient.addColorStop(0, '#FFB700');
        bandGradient.addColorStop(0.5, '#FFD740');
        bandGradient.addColorStop(1, '#FFA000');
        
        ctx.fillStyle = bandGradient;
        ctx.fillRect(x - 10, y - size / 2, 20, size);
        
        // Goldenes Band (horizontal)
        ctx.fillRect(x - size / 2, y - 10, size, 20);
        
        // Schleife oben mit Glow
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 15;
        
        const bowGradient = ctx.createRadialGradient(x, y - size / 2, 0, x, y - size / 2, 15);
        bowGradient.addColorStop(0, '#FFD740');
        bowGradient.addColorStop(1, '#FFB700');
        
        ctx.fillStyle = bowGradient;
        ctx.beginPath();
        ctx.arc(x - 15, y - size / 2 + 5, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 15, y - size / 2 + 5, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Schleifen-Mitte
        ctx.beginPath();
        ctx.arc(x, y - size / 2 + 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Glanz-Effekt
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x - size / 3, y - size / 3, size / 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawCoal3D(x, y, size) {
        const ctx = this.ctx;
        
        ctx.save();
        
        // Einfach das Kohle-Emoji verwenden (sieht viel besser aus!)
        ctx.font = `${size * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Schatten
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.fillText('🪨', x, y);
        
        ctx.restore();
    }
    
    drawSanta3D(x, y, size) {
        const ctx = this.ctx;
        
        ctx.save();
        
        // Einfach das Santa-Emoji verwenden (sieht viel professioneller aus!)
        ctx.font = `${size * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Schatten
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.fillText('🎅', x, y);
        
        ctx.restore();
    }
    
    createExplosion(item, color) {
        const numParticles = 15;
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 / numParticles) * i;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: item.x,
                y: item.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: color,
                life: 1,
                opacity: 1
            });
        }
    }
    
    showFloatingText(text, x, y, color) {
        if (!this.floatingTexts) this.floatingTexts = [];
        
        const floatingText = {
            text: text,
            x: x,
            y: y,
            vy: -2,
            opacity: 1,
            life: 1.5
        };
        
        this.floatingTexts.push(floatingText);
        
        const animateText = () => {
            floatingText.y += floatingText.vy;
            floatingText.life -= 0.02;
            floatingText.opacity = Math.max(0, floatingText.life);
            
            if (floatingText.life > 0) {
                requestAnimationFrame(animateText);
            } else {
                const index = this.floatingTexts.indexOf(floatingText);
                if (index > -1) this.floatingTexts.splice(index, 1);
            }
        };
        
        animateText();
    }
    
    async endGame() {
        this.gameActive = false;
        clearTimeout(this.spawnTimeout);
        
        // Stats speichern
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        try {
            await window.statsManager.saveStats('gift-catcher', this.score, playTime);
        } catch (error) {
            console.error('Fehler beim Speichern der Stats:', error);
        }
        
        // Game Over nach kurzer Verzögerung
        setTimeout(() => {
            this.showGameOver();
        }, 1000);
    }
    
    async showGameOver() {
        const giftsCount = Math.floor(this.score / 10);
        
        // Bestenliste laden
        const highscores = await window.statsManager.getHighscores('gift-catcher', 10);
        
        const highscoresHTML = highscores.map((entry, index) => `
            <li class="highscore-item">
                <span class="highscore-rank">${index + 1}.</span>
                <span class="highscore-name">${entry.username}</span>
                <span class="highscore-score">${entry.highscore} 🎁</span>
            </li>
        `).join('');
        
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-content">
                <h2>🎅 Spiel vorbei! 🎁</h2>
                <div class="game-over-stats">
                    <div class="game-over-stat-label">Deine Punkte</div>
                    <div class="game-over-stat-value">${this.score}</div>
                    <div style="margin-top: 10px; font-size: 1.2rem;">🎁 ${giftsCount} Geschenke gefangen</div>
                </div>
                <div class="game-over-highscores">
                    <h3>🏆 Top 10 Highscores</h3>
                    <ul class="highscore-list">${highscoresHTML}</ul>
                </div>
                <div class="game-over-buttons">
                    <button class="game-over-button button-primary" onclick="location.reload()">🔄 Nochmal spielen</button>
                    <button class="game-over-button button-secondary" onclick="window.location.href='/'">🏠 Zurück zum Kalender</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
}

// Game wird von gift-catcher.html initialisiert
