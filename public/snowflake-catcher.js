// ========================================
// 3D SCHNEEFLOCKEN FANGEN SPIEL
// Mit Canvas Rendering, Split-Effekt und negativen Items
// ========================================
class SnowflakeCatcherGame3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.score = 0;
        this.timeLeft = 30;
        this.gameActive = false;
        this.snowflakes = [];
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.spawnInterval = null;
        this.startTime = null;
        
        // Schwierigkeitsgrad steigt mit der Zeit
        this.difficulty = 1;
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="snowflake-game-container">
                <div class="snowflake-game-header">
                    <div class="snowflake-score-display">
                        <span class="score-label">❄️</span>
                        <span id="snowflake-score" class="score-value">0</span>
                    </div>
                    <div class="snowflake-time-display">
                        <span class="time-label">⏰</span>
                        <span id="snowflake-time" class="time-value">30</span>s
                    </div>
                </div>
                
                <!-- Stats Banner -->
                <div class="snowflake-stats-banner">
                    <div class="stat-box">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-info">
                            <div class="stat-value" id="banner-score">0</div>
                            <div class="stat-label">Punkte</div>
                        </div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-info">
                            <div class="stat-value" id="banner-time">30</div>
                            <div class="stat-label">Zeit</div>
                        </div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-icon">🚀</div>
                        <div class="stat-info">
                            <div class="stat-value" id="banner-difficulty">1</div>
                            <div class="stat-label">Difficulty</div>
                        </div>
                    </div>
                </div>
                
                <canvas id="snowflake-canvas" class="snowflake-canvas"></canvas>
                
                <!-- Overlays werden dynamisch von stats-manager.js erstellt -->
            </div>
        `;
        
        this.canvas = document.getElementById('snowflake-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        // Anti-Aliasing und smoothes Rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Responsive Canvas-Größe
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Show start overlay and attach event listener
        statsManager.showGameStartOverlay('snowflake-catcher').then(() => {
            const startBtn = document.getElementById('startButton');
            if (startBtn) {
                startBtn.addEventListener('click', () => this.start());
            }
        });
        
        // Touch- und Click-Events für Canvas
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Verhindert verzögerte Click-Events
            this.handleTouch(e);
        }, { passive: false });
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const header = document.querySelector('.snowflake-game-header');
        const banner = document.querySelector('.snowflake-stats-banner');
        
        // Dynamische Höhenberechnung
        const headerHeight = header ? header.offsetHeight : 0;
        const bannerHeight = banner ? banner.offsetHeight : 0;
        const containerHeight = container.offsetHeight;
        
        // Canvas nimmt verfügbaren Platz (100% - Header - Banner)
        const availableHeight = containerHeight - headerHeight - bannerHeight;
        
        this.canvas.width = container.offsetWidth;
        this.canvas.height = Math.max(400, availableHeight);
    }
    
    async start() {
        // Spielername sicherstellen
        await window.statsManager.ensureUsername();
        
        this.score = 0;
        this.timeLeft = 30;
        this.gameActive = true;
        this.snowflakes = [];
        this.particles = [];
        this.difficulty = 1;
        this.startTime = Date.now();
        
        // Verstecke Start Overlay
        const startOverlay = document.getElementById('gamestartOverlay');
        if (startOverlay) {
            startOverlay.classList.remove('active');
        }
        
        // Aktualisiere alle Anzeigen
        document.getElementById('snowflake-score').textContent = '0';
        document.getElementById('snowflake-time').textContent = '30';
        document.getElementById('banner-score').textContent = '0';
        document.getElementById('banner-time').textContent = '30';
        document.getElementById('banner-difficulty').textContent = '1';
        
        this.startTimer();
        this.startSpawning();
        this.gameLoop();
    }
    
    startTimer() {
        const interval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('snowflake-time').textContent = this.timeLeft;
            
            // Schwierigkeit erhöhen
            this.difficulty = 1 + (30 - this.timeLeft) / 20;
            
            // Banner aktualisieren
            this.updateBanner();
            
            if (this.timeLeft <= 0) {
                clearInterval(interval);
                this.endGame();
            }
        }, 1000);
    }
    
    updateBanner() {
        // Score
        document.getElementById('banner-score').textContent = this.score;
        
        // Zeit
        const timeElem = document.getElementById('banner-time');
        timeElem.textContent = this.timeLeft;
        
        // Zeit-Warnung
        const timeBox = timeElem.closest('.stat-box');
        if (this.timeLeft <= 5) {
            timeBox.classList.add('time-critical');
        } else if (this.timeLeft <= 10) {
            timeBox.classList.add('time-warning');
        } else {
            timeBox.classList.remove('time-warning', 'time-critical');
        }
        
        // Difficulty
        document.getElementById('banner-difficulty').textContent = this.difficulty.toFixed(1);
    }
    
    startSpawning() {
        const spawn = () => {
            if (!this.gameActive) {
                clearTimeout(this.spawnInterval);
                return;
            }
            
            this.spawnSnowflake();
            
            // Spawn-Rate erhöht sich mit Schwierigkeit
            const spawnDelay = Math.max(600, 1200 - (this.difficulty * 200)); // Langsamer für bessere Performance
            this.spawnInterval = setTimeout(spawn, spawnDelay);
        };
        spawn();
    }
    
    spawnSnowflake() {
        // Zufällige Typen mit unterschiedlichen Wahrscheinlichkeiten
        const rand = Math.random();
        let type, points, color, glow, size;
        
        if (rand < 0.1) {
            // Bonus-Zeit Flocke (10%)
            type = 'timebonus';
            points = 0;
            color = '#00BCD4';
            glow = '#00E5FF';
            size = 25 + Math.random() * 10;
        } else if (rand < 0.3) {
            // Große Flocke (20%) - Langsam, wenig Punkte
            type = 'large';
            points = 5;
            color = '#4FC3F7';
            glow = '#81D4FA';
            size = 35 + Math.random() * 10;
        } else if (rand < 0.65) {
            // Mittlere Flocke (35%) - Normal
            type = 'medium';
            points = 10;
            color = '#2196F3';
            glow = '#64B5F6';
            size = 25 + Math.random() * 8;
        } else if (rand < 0.85) {
            // Kleine Flocke (20%) - Schnell, viele Punkte
            type = 'small';
            points = 25;
            color = '#1976D2';
            glow = '#42A5F5';
            size = 15 + Math.random() * 8;
        } else if (rand < 0.95) {
            // Rote Feuerflocke - NEGATIV (10%)
            type = 'fire';
            points = -15;
            color = '#FF5722';
            glow = '#FF8A65';
            size = 25 + Math.random() * 10;
        } else {
            // Goldene Kristall-Flocke (5%) - Sehr selten!
            type = 'golden';
            points = 50;
            color = '#FFD700';
            glow = '#FFF176';
            size = 30 + Math.random() * 10;
        }
        
        // Geschwindigkeit basierend auf Größe (größer = langsamer, kleiner = schneller)
        let baseSpeed;
        if (type === 'large') {
            baseSpeed = 1.5; // Langsam
        } else if (type === 'small') {
            baseSpeed = 3.5; // Schnell
        } else if (type === 'timebonus') {
            baseSpeed = 2.0; // Mittel-langsam
        } else {
            baseSpeed = 2.5; // Normal
        }
        
        const snowflake = {
            x: Math.random() * (this.canvas.width - 60) + 30,
            y: -50,
            vx: (Math.random() - 0.5) * 1.5, // Reduziert horizontale Bewegung
            vy: baseSpeed + Math.random() * 0.8, // Weniger Variation
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.08, // Langsamere Rotation
            size: size,
            type: type,
            points: points,
            color: color,
            glow: glow,
            opacity: 1,
            scale: 1,
            pulse: Math.random() * Math.PI * 2
        };
        
        this.snowflakes.push(snowflake);
    }
    
    handleClick(e) {
        if (!this.gameActive) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        this.checkFlakeHit(clickX, clickY);
    }
    
    handleTouch(e) {
        if (!this.gameActive) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        this.checkFlakeHit(touchX, touchY);
    }
    
    checkFlakeHit(x, y) {
        // Prüfe alle Schneeflocken (von vorne nach hinten)
        for (let i = this.snowflakes.length - 1; i >= 0; i--) {
            const flake = this.snowflakes[i];
            
            // Vergrößerte Hit-Box für bessere Touch-Erkennung (besonders bei kleinen Flocken)
            const hitboxMultiplier = flake.type === 'small' ? 1.5 : 1.2;
            const hitRadius = flake.size * hitboxMultiplier;
            
            const distance = Math.sqrt(
                Math.pow(x - flake.x, 2) + 
                Math.pow(y - flake.y, 2)
            );
            
            if (distance < hitRadius) {
                // Treffer!
                this.catchSnowflake(flake, i);
                break; // Nur eine Flocke pro Klick/Touch
            }
        }
    }
    
    catchSnowflake(flake, index) {
        // Bonus-Zeit Flocke
        if (flake.type === 'timebonus') {
            this.timeLeft += 5;
            document.getElementById('snowflake-time').textContent = this.timeLeft;
            
            // Spezielle Effekte für Bonus-Zeit
            this.createExplosion(flake);
            this.createFloatingText(flake.x, flake.y, '+5 SEK ⏰', flake.color);
            
            // Kurzer Flash-Effekt im Zeit-Display
            const timeDisplay = this.container.querySelector('.time-display');
            if (timeDisplay) {
                timeDisplay.style.transform = 'scale(1.2)';
                timeDisplay.style.background = 'linear-gradient(135deg, #00BCD4 0%, #00E5FF 100%)';
                setTimeout(() => {
                    timeDisplay.style.transform = 'scale(1)';
                    timeDisplay.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
                }, 300);
            }
            
            // Entferne Flocke
            this.snowflakes.splice(index, 1);
            return;
        }
        
        // Punkte hinzufügen/abziehen
        this.score += flake.points;
        if (this.score < 0) this.score = 0; // Keine negativen Punkte
        
        document.getElementById('snowflake-score').textContent = this.score;
        this.updateBanner();
        
        // Partikel-Explosion erstellen
        this.createExplosion(flake);
        
        // Floating Text für Feedback
        let textContent = flake.points > 0 ? `+${flake.points}` : `${flake.points}`;
        if (flake.type === 'golden') textContent = `+${flake.points} 💎`;
        this.createFloatingText(flake.x, flake.y, textContent, flake.color);
        
        // SPLIT-EFFEKT: Nur bei mittleren und großen Flocken
        if ((flake.type === 'medium' || flake.type === 'large') && this.snowflakes.length < 18) {
            const numSplits = 2; // Fixiert auf 2 für bessere Performance
            
            for (let i = 0; i < numSplits; i++) {
                const angle = (Math.PI * 2 / numSplits) * i + Math.random() * 0.5;
                const speed = 2 + Math.random() * 1.5; // Langsamer
                
                // Splits werden zu kleineren Flocken mit entsprechenden Punkten
                const splitType = flake.type === 'large' ? 'medium' : 'small';
                const splitPoints = flake.type === 'large' ? 10 : 25;
                const splitSize = flake.type === 'large' ? 25 : 15;
                
                const splitFlake = {
                    x: flake.x,
                    y: flake.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed + 1.5,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.1,
                    size: splitSize,
                    type: splitType,
                    points: splitPoints,
                    color: flake.color,
                    glow: flake.glow,
                    opacity: 1,
                    scale: 0.3, // Startet klein
                    pulse: Math.random() * Math.PI * 2,
                    isSplit: true // Markierung
                };
                
                this.snowflakes.push(splitFlake);
            }
        }
        
        // Entferne original Schneeflocke
        this.snowflakes.splice(index, 1);
    }
    
    createExplosion(flake) {
        // Reduziere Partikel für bessere Performance
        const numParticles = 8; // Von 15 auf 8 reduziert
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 / numParticles) * i;
            const speed = 2 + Math.random() * 4;
            
            this.particles.push({
                x: flake.x,
                y: flake.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.03 + Math.random() * 0.02, // Schnellerer Decay
                size: 3 + Math.random() * 5,
                color: flake.color,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }
    
    createFloatingText(x, y, text, color) {
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: -2,
            life: 1,
            decay: 0.015,
            text: text,
            color: color,
            isText: true
        });
    }
    
    gameLoop() {
        if (!this.gameActive) return;
        
        this.update();
        this.render();
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Limitiere maximale Anzahl an Schneeflocken für Performance
        const MAX_SNOWFLAKES = 20;
        while (this.snowflakes.length > MAX_SNOWFLAKES) {
            this.snowflakes.shift(); // Entferne älteste
        }
        
        // Update Schneeflocken
        for (let i = this.snowflakes.length - 1; i >= 0; i--) {
            const flake = this.snowflakes[i];
            
            // Position update
            flake.x += flake.vx;
            flake.y += flake.vy;
            flake.rotation += flake.rotationSpeed;
            flake.pulse += 0.05;
            
            // Splits wachsen
            if (flake.isSplit && flake.scale < 1) {
                flake.scale += 0.05;
            }
            
            // Bounce an Wänden
            if (flake.x < flake.size || flake.x > this.canvas.width - flake.size) {
                flake.vx *= -1;
            }
            
            // Entfernen wenn außerhalb
            if (flake.y > this.canvas.height + 50) {
                this.snowflakes.splice(i, 1);
            }
        }
        
        // Update Partikel
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            
            if (!particle.isText) {
                particle.vy += 0.1; // Gravity
            }
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render() {
        // Clear mit Gradient-Hintergrund
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0D47A1');
        gradient.addColorStop(1, '#1976D2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render Schneeflocken mit 3D-Effekt
        this.snowflakes.forEach(flake => {
            this.ctx.save();
            this.ctx.translate(flake.x, flake.y);
            this.ctx.rotate(flake.rotation);
            
            const scale = flake.scale * (1 + Math.sin(flake.pulse) * 0.08);
            this.ctx.scale(scale, scale);
            
            // Reduzierter Glow-Effekt für bessere Performance
            this.ctx.shadowBlur = 12; // Von 20 auf 12
            this.ctx.shadowColor = flake.glow;
            
            // 3D Schneeflocke zeichnen
            this.drawSnowflake3D(flake);
            
            this.ctx.restore();
        });
        
        // Render Partikel
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            
            if (particle.isText) {
                // Floating Text
                this.ctx.font = 'bold 24px Arial';
                this.ctx.fillStyle = particle.color;
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 3;
                this.ctx.strokeText(particle.text, particle.x, particle.y);
                this.ctx.fillText(particle.text, particle.x, particle.y);
            } else {
                // Partikel
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation);
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            }
            
            this.ctx.restore();
        });
    }
    
    drawSnowflake3D(flake) {
        // Vereinfachte 3D-Schneeflocke für bessere Performance
        const arms = 6;
        const armLength = flake.size;
        
        // Hauptlinien (ohne Gradient für bessere Performance)
        this.ctx.strokeStyle = flake.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        
        for (let i = 0; i < arms; i++) {
            const angle = (Math.PI * 2 / arms) * i;
            
            this.ctx.save();
            this.ctx.rotate(angle);
            
            // Hauptarm
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, armLength);
            this.ctx.stroke();
            
            // Nur 2 Verzweigungen (statt 3) für Performance
            const branchY1 = armLength * 0.4;
            const branchY2 = armLength * 0.75;
            const branchLength = armLength * 0.25;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, branchY1);
            this.ctx.lineTo(-branchLength, branchY1 + branchLength);
            this.ctx.moveTo(0, branchY1);
            this.ctx.lineTo(branchLength, branchY1 + branchLength);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, branchY2);
            this.ctx.lineTo(-branchLength, branchY2 + branchLength);
            this.ctx.moveTo(0, branchY2);
            this.ctx.lineTo(branchLength, branchY2 + branchLength);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
        
        // Zentrum-Kristall
        this.ctx.fillStyle = flake.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Icon für Typ (größer und klarer)
        this.ctx.font = `${flake.size * 0.7}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        if (flake.type === 'crystal') {
            this.ctx.fillText('💎', 0, 0);
        } else if (flake.type === 'fire') {
            this.ctx.fillText('🔥', 0, 0);
        } else {
            this.ctx.fillText('❄️', 0, 0);
        }
    }
    
    async endGame() {
        this.gameActive = false;
        
        if (this.spawnInterval) {
            clearTimeout(this.spawnInterval);
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Clear Arrays für bessere Performance
        this.snowflakes = [];
        this.particles = [];
        
        // Berechne Spielzeit
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Stats speichern
        try {
            await window.statsManager.saveStats('snowflake-catcher', this.score, playTime);
        } catch (error) {
            console.error('Fehler beim Speichern der Stats:', error);
        }
        
        // Game Over nach kurzer Verzögerung
        setTimeout(() => {
            this.showGameOver();
        }, 1000);
    }
    
    async showGameOver() {
        // Bestenliste laden
        const highscores = await window.statsManager.getHighscores('snowflake-catcher', 3);
        
        const highscoresHTML = highscores.map((entry, index) => `
            <li class="highscore-item">
                <span class="highscore-rank">${index + 1}.</span>
                <span class="highscore-name">${entry.username}</span>
                <span class="highscore-score">${entry.highscore} ❄️</span>
            </li>
        `).join('');
        
        // Zeige Game Over Overlay mit globalem System
        await statsManager.showGameOverOverlay('snowflake-catcher', [
            {label: 'Punkte', value: this.score},
            {label: 'Zeit gespielt', value: '30s'}
        ]);
    }
    
    getScoreMessage() {
        if (this.score >= 500) return '🌟 UNGLAUBLICH! Du bist ein Schneeflocken-Gott! 🌟';
        if (this.score >= 400) return '💎 Fantastisch! Kristallklare Leistung!';
        if (this.score >= 300) return '⭐ Super! Du beherrschst den Schnee!';
        if (this.score >= 200) return '✨ Sehr gut! Das war toll!';
        if (this.score >= 100) return '❄️ Gut gemacht! Weiter so!';
        return '☃️ Nicht schlecht! Versuch es nochmal!';
    }
}
