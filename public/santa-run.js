/**
 * Santa Run Game - Chrome Dino Style Endless Runner
 * 3D Canvas Rendering mit realistischen Animationen
 */

class SantaRunGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.distance = 0;
        this.gameActive = false;
        this.obstacles = [];
        this.particles = [];
        this.gameSpeed = 6;
        this.baseSpeed = 6;
        this.maxSpeed = 13;
        this.acceleration = 0.001; // Langsame Beschleunigung wie Chrome Dino
        
        // Santa Eigenschaften
        this.santaX = 0; // Wird in resizeCanvas gesetzt
        this.santaY = 0; // Höhe über dem Boden
        this.santaWidth = 60;
        this.santaHeight = 80;
        this.groundY = 0; // Wird in resizeCanvas gesetzt
        
        // Sprung-Physik
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.jumpPower = 10;
        this.gravity = 0.6;
        this.jumpPressed = false; // Für variable Sprunghöhe
        this.minJumpHeight = false;
        
        // Animation
        this.animationFrame = 0;
        this.animationSpeed = 0.15;
        this.runCycle = 0;
        
        // Spawn-System (wie Chrome Dino)
        this.nextObstacleDistance = 0;
        this.minObstacleGap = 200;
        this.maxObstacleGap = 400;
        
        this.startTime = 0;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="santa-run-container">
                <div class="score-display" id="santa-distance">00000</div>
                <canvas id="santa-run-canvas" class="santa-run-canvas"></canvas>
                
                <!-- Instructions Overlay -->
                <div class="santa-instructions-overlay" id="santa-instructions-overlay">
                    <div class="instructions-content">
                        <h2>🎅 Santa Run! 🏃</h2>
                        <div class="instruction-items">
                            <div class="instruction-item">
                                <span class="item-icon">⬆️</span>
                                <span>Springe über Hindernisse!</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">📱</span>
                                <span>Tippe auf den Bildschirm</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">⌨️</span>
                                <span>oder drücke LEERTASTE</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">🚀</span>
                                <span>Je weiter du läufst, desto schneller!</span>
                            </div>
                        </div>
                        <p class="difficulty-info">⚠️ Berühre kein Hindernis!</p>
                        <button class="instruction-ok-button" id="instruction-ok-button">
                            ✓ Okay, verstanden!
                        </button>
                    </div>
                </div>
                
                <!-- Start Button (erscheint nach OK) -->
                <div class="start-button-overlay" id="start-button-overlay" style="display: none;">
                    <button class="santa-start-button pulse" id="santa-start-button">
                        <span class="button-icon">🎮</span>
                        <span>Spiel starten!</span>
                    </button>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('santa-run-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        // Anti-Aliasing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Responsive Canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // OK Button
        document.getElementById('instruction-ok-button').addEventListener('click', () => {
            document.getElementById('santa-instructions-overlay').style.display = 'none';
            document.getElementById('start-button-overlay').style.display = 'flex';
        });
        
        // Start Button
        document.getElementById('santa-start-button').addEventListener('click', () => this.start());
        
        // Controls
        this.setupControls();
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Boden-Position (wie Chrome Dino: ~75% der Höhe)
        this.groundY = this.canvas.height * 0.75;
        
        // Feste Größen wie Chrome Dino
        this.santaWidth = 44;
        this.santaHeight = 47;
        this.santaX = 25; // Feste Position links
        
        // Sprungphysik wie Chrome Dino
        this.jumpPower = 10;
        this.gravity = 0.6;
    }
    
    setupControls() {
        // Leertaste oder Pfeiltaste nach oben - DRÜCKEN
        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.code === 'ArrowUp') && this.gameActive) {
                e.preventDefault();
                if (!this.isJumping && this.santaY === 0) {
                    this.jump();
                    this.jumpPressed = true;
                }
            }
        });
        
        // Leertaste oder Pfeiltaste nach oben - LOSLASSEN
        document.addEventListener('keyup', (e) => {
            if ((e.code === 'Space' || e.code === 'ArrowUp') && this.gameActive) {
                this.jumpPressed = false;
            }
        });
        
        // Touch/Click auf gesamten Bildschirm - START
        document.addEventListener('touchstart', (e) => {
            if (this.gameActive) {
                e.preventDefault();
                if (!this.isJumping && this.santaY === 0) {
                    this.jump();
                    this.jumpPressed = true;
                }
            }
        }, { passive: false });
        
        // Touch/Click auf gesamten Bildschirm - ENDE
        document.addEventListener('touchend', (e) => {
            if (this.gameActive) {
                this.jumpPressed = false;
            }
        });
        
        // Mouse Click
        document.addEventListener('mousedown', (e) => {
            if (this.gameActive) {
                if (!this.isJumping && this.santaY === 0) {
                    this.jump();
                    this.jumpPressed = true;
                }
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.gameActive) {
                this.jumpPressed = false;
            }
        });
    }
    
    async start() {
        // Spielername sicherstellen
        await window.statsManager.ensureUsername();
        
        this.distance = 0;
        this.gameActive = true;
        this.obstacles = [];
        this.particles = [];
        this.gameSpeed = this.baseSpeed;
        this.santaY = 0;
        this.jumpVelocity = 0;
        this.isJumping = false;
        this.jumpPressed = false;
        this.nextObstacleDistance = 200;
        this.startTime = Date.now();
        this.lastFrameTime = 0;
        this.deltaTime = 16.67;
        
        // Verstecke Start-Button
        document.getElementById('start-button-overlay').style.display = 'none';
        
        // Update Distance Display
        document.getElementById('santa-distance').textContent = '00000';
        
        this.gameLoop();
    }
    
    jump() {
        if (!this.isJumping && this.santaY === 0) {
            this.isJumping = true;
            this.jumpVelocity = this.jumpPower;
            
            // Jump particles
            this.createJumpParticles();
        }
    }
    
    createJumpParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.santaX + this.santaWidth / 2,
                y: this.groundY,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 3,
                size: Math.random() * 4 + 2,
                life: 1,
                color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
            });
        }
    }
    
    createLandingParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.santaX + this.santaWidth / 2 + (Math.random() - 0.5) * 40,
                y: this.groundY,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 5 - 2,
                size: Math.random() * 5 + 3,
                life: 1,
                color: Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(200, 230, 255, 0.8)'
            });
        }
    }
    
    createCollisionParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * (Math.random() * 4 + 2),
                vy: Math.sin(angle) * (Math.random() * 4 + 2) - 3,
                size: Math.random() * 6 + 4,
                life: 1,
                color: Math.random() > 0.5 ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 255, 0, 0.8)'
            });
        }
    }
    
    update() {
        if (!this.gameActive) return;
        
        // Normalisiere deltaTime auf 60 FPS (1/60 = 0.0167)
        const dtMultiplier = this.deltaTime / 16.67;
        
        // Distanz erhöhen (wie Chrome Dino: 0.1 Meter pro Frame bei 60 FPS)
        this.distance += this.gameSpeed * 0.1 * dtMultiplier;
        
        // Geschwindigkeit erhöhen kontinuierlich (wie Chrome Dino)
        if (this.gameSpeed < this.maxSpeed) {
            this.gameSpeed += this.acceleration * dtMultiplier;
        }
        
        // Update Display (5-stellig mit führenden Nullen)
        const scoreText = Math.floor(this.distance).toString().padStart(5, '0');
        document.getElementById('santa-distance').textContent = scoreText;
        
        // Sprung-Physik mit variabler Höhe
        if (this.isJumping || this.santaY > 0) {
            this.santaY += this.jumpVelocity * dtMultiplier;
            
            // Variable Sprunghöhe: Wenn Taste losgelassen und nach oben, reduziere Velocity
            if (!this.jumpPressed && this.jumpVelocity > 0 && this.santaY > 15) {
                this.jumpVelocity *= 0.5; // Schneller Stopp für kurze Sprünge
            }
            
            // Dynamische Schwerkraft basierend auf Geschwindigkeit
            // Je schneller das Spiel, desto höher die Schwerkraft
            const speedFactor = 1 + (this.gameSpeed - this.baseSpeed) / this.baseSpeed * 0.5;
            const dynamicGravity = this.gravity * speedFactor;
            
            this.jumpVelocity -= dynamicGravity * dtMultiplier;
            
            // Landung
            if (this.santaY <= 0) {
                this.santaY = 0;
                this.jumpVelocity = 0;
                if (this.isJumping) {
                    this.isJumping = false;
                    this.createLandingParticles();
                }
            }
        }
        
        // Animation
        if (this.santaY === 0) {
            this.animationFrame += this.animationSpeed * (this.gameSpeed / this.baseSpeed) * dtMultiplier;
        }
        
        // Obstacle Spawning (wie Chrome Dino: zufälliger Abstand)
        if (this.nextObstacleDistance <= 0) {
            this.spawnObstacle();
            // Abstand verringert sich mit höherer Geschwindigkeit
            const minGap = this.minObstacleGap + (this.gameSpeed - this.baseSpeed) * 10;
            const maxGap = this.maxObstacleGap + (this.gameSpeed - this.baseSpeed) * 10;
            this.nextObstacleDistance = minGap + Math.random() * (maxGap - minGap);
        }
        this.nextObstacleDistance -= this.gameSpeed * dtMultiplier;
        
        // Update Obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed * dtMultiplier;
            
            // Entferne Hindernisse außerhalb des Bildschirms
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Kollisionserkennung
            if (this.checkCollision(obstacle)) {
                this.createCollisionParticles(
                    this.santaX + this.santaWidth / 2,
                    this.groundY - this.santaY - this.santaHeight / 2
                );
                this.gameOver();
                return;
            }
        }
        
        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dtMultiplier;
            p.y += p.vy * dtMultiplier;
            p.vy += 0.3 * dtMultiplier; // Gravity
            p.life -= 0.02 * dtMultiplier;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    spawnObstacle() {
        // Verschiedene Hindernistypen
        const types = ['cactus-small', 'cactus-large', 'cactus-double'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        if (type === 'cactus-double') {
            // Doppel-Kaktus: Spawne 2 kleine Kakteen nebeneinander
            this.obstacles.push({
                x: this.canvas.width,
                y: 0,
                width: 17,
                height: 35,
                type: 'cactus-small'
            });
            this.obstacles.push({
                x: this.canvas.width + 22, // 22px Abstand
                y: 0,
                width: 17,
                height: 35,
                type: 'cactus-small'
            });
        } else {
            let width, height;
            if (type === 'cactus-small') {
                width = 17;
                height = 35;
            } else {
                width = 25;
                height = 50;
            }
            
            this.obstacles.push({
                x: this.canvas.width,
                y: 0,
                width: width,
                height: height,
                type: type
            });
        }
    }
    
    checkCollision(obstacle) {
        const santaBottom = this.groundY - this.santaY;
        const santaTop = santaBottom - this.santaHeight;
        const santaLeft = this.santaX;
        const santaRight = this.santaX + this.santaWidth;
        
        const obstacleBottom = this.groundY;
        const obstacleTop = this.groundY - obstacle.height;
        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + obstacle.width;
        
        // Hitbox mit etwas Toleranz
        const tolerance = 5;
        
        return (
            santaRight - tolerance > obstacleLeft &&
            santaLeft + tolerance < obstacleRight &&
            santaBottom > obstacleTop &&
            santaTop < obstacleBottom
        );
    }
    
    render() {
        // Hintergrund (weiß/hellgrau)
        this.ctx.fillStyle = '#f7f7f7';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Boden-Linie (schwarz, einfach)
        this.ctx.strokeStyle = '#535353';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();
        
        // Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
        
        // Santa
        this.drawSanta();
        
        // Obstacles
        this.obstacles.forEach(obstacle => {
            this.drawObstacle(obstacle);
        });
    }
    
    drawClouds() {
        const cloudOffset = (this.distance * 0.3) % 400;
        
        for (let i = 0; i < 5; i++) {
            const x = i * 400 - cloudOffset;
            const y = 50 + Math.sin(i * 2) * 30;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 30, 0, Math.PI * 2);
            this.ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
            this.ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawGround() {
        // Schnee-Boden
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // Boden-Linie
        this.ctx.strokeStyle = '#B0E0E6';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();
        
        // Schnee-Textur (bewegende Punkte)
        const snowOffset = (this.distance * 2) % 50;
        this.ctx.fillStyle = 'rgba(176, 224, 230, 0.3)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 50 - snowOffset) % this.canvas.width;
            const y = this.groundY + 10 + Math.sin(i) * 5;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawSanta() {
        const santaBottom = this.groundY - this.santaY;
        const santaTop = santaBottom - this.santaHeight;
        
        this.ctx.fillStyle = '#535353';
        
        // Einfache Santa-Silhouette (wie Dino)
        // Körper
        this.ctx.fillRect(this.santaX + 10, santaTop + 15, 24, 24);
        
        // Kopf mit Mütze
        this.ctx.fillRect(this.santaX + 14, santaTop + 5, 16, 16);
        
        // Mützen-Spitze
        this.ctx.fillRect(this.santaX + 16, santaTop, 8, 8);
        
        // Beine (animiert beim Laufen)
        if (this.santaY === 0) {
            const legSwing = Math.floor(this.animationFrame) % 2;
            if (legSwing === 0) {
                this.ctx.fillRect(this.santaX + 12, santaTop + 39, 8, 8);
                this.ctx.fillRect(this.santaX + 24, santaTop + 39, 8, 8);
            } else {
                this.ctx.fillRect(this.santaX + 12, santaTop + 41, 8, 6);
                this.ctx.fillRect(this.santaX + 24, santaTop + 37, 8, 10);
            }
        } else {
            // Beide Beine zusammen beim Springen
            this.ctx.fillRect(this.santaX + 12, santaTop + 39, 20, 8);
        }
        
        // Arme
        this.ctx.fillRect(this.santaX + 6, santaTop + 20, 6, 12);
        this.ctx.fillRect(this.santaX + 32, santaTop + 20, 6, 12);
    }
    
    drawObstacle(obstacle) {
        const obstacleBottom = this.groundY;
        const obstacleTop = obstacleBottom - obstacle.height;
        
        this.ctx.fillStyle = '#535353';
        
        // Einfache Kaktus-Silhouetten
        if (obstacle.type === 'cactus-small') {
            // Kleiner Kaktus
            this.ctx.fillRect(obstacle.x + 4, obstacleTop, 9, 35);
            this.ctx.fillRect(obstacle.x, obstacleTop + 8, 4, 12);
            this.ctx.fillRect(obstacle.x + 13, obstacleTop + 12, 4, 10);
        } else {
            // Großer Kaktus
            this.ctx.fillRect(obstacle.x + 6, obstacleTop, 13, 50);
            this.ctx.fillRect(obstacle.x, obstacleTop + 12, 6, 20);
            this.ctx.fillRect(obstacle.x + 19, obstacleTop + 15, 6, 18);
        }
    }
    
    drawObstacleOLD(obstacle) {
        const obstacleBottom = this.groundY;
        const obstacleTop = obstacleBottom - obstacle.height;
        
        this.ctx.save();
        
        switch (obstacle.type) {
            case 'tree':
                // Stamm
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(obstacle.x + 15, obstacleTop + 50, 10, 30);
                
                // Baum (Dreieck)
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + 20, obstacleTop);
                this.ctx.lineTo(obstacle.x, obstacleTop + 50);
                this.ctx.lineTo(obstacle.x + 40, obstacleTop + 50);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Stern
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + 20, obstacleTop + 5, 4, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'rock':
                // Stein
                this.ctx.fillStyle = '#808080';
                this.ctx.beginPath();
                this.ctx.ellipse(obstacle.x + 25, obstacleTop + 20, 25, 20, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Schatten
                this.ctx.fillStyle = '#696969';
                this.ctx.beginPath();
                this.ctx.ellipse(obstacle.x + 25, obstacleTop + 25, 20, 15, 0, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'snowman':
                // Unterer Ball
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + 22, obstacleTop + 50, 22, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Mittlerer Ball
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + 22, obstacleTop + 30, 16, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Kopf
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + 22, obstacleTop + 12, 12, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Augen
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + 18, obstacleTop + 10, 2, 0, Math.PI * 2);
                this.ctx.arc(obstacle.x + 26, obstacleTop + 10, 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Nase (Karotte)
                this.ctx.fillStyle = '#FF8C00';
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + 22, obstacleTop + 13);
                this.ctx.lineTo(obstacle.x + 30, obstacleTop + 14);
                this.ctx.lineTo(obstacle.x + 22, obstacleTop + 15);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'gift':
                // Geschenk
                this.ctx.fillStyle = '#FF1744';
                this.ctx.fillRect(obstacle.x, obstacleTop, 35, 35);
                
                // Band
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(obstacle.x, obstacleTop + 15, 35, 5);
                this.ctx.fillRect(obstacle.x + 15, obstacleTop, 5, 35);
                
                // Schleife
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + 17, obstacleTop - 3, 5, 0, Math.PI * 2);
                this.ctx.fill();
                break;
        }
        
        this.ctx.restore();
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameActive) return;
        
        // Berechne deltaTime in Millisekunden
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = currentTime;
        }
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Begrenze deltaTime um Spikes zu vermeiden (max 100ms = 10 FPS minimum)
        if (this.deltaTime > 100) {
            this.deltaTime = 16.67; // Reset to ~60 FPS
        }
        
        this.update();
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    async gameOver() {
        this.gameActive = false;
        
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        const finalDistance = Math.floor(this.distance);
        
        // Stats speichern
        await window.statsManager.saveStats('santa-run', finalDistance, playTime);
        
        // Game Over Overlay
        setTimeout(() => {
            this.showGameOverScreen(finalDistance, playTime);
        }, 500);
    }
    
    async showGameOverScreen(distance, playTime) {
        const overlay = document.createElement('div');
        overlay.className = 'username-overlay';
        overlay.innerHTML = `
            <div class="username-dialog" style="max-width: 500px;">
                <h2>🎅 Game Over! 🏃</h2>
                <div style="margin: 30px 0; font-size: 24px;">
                    <p style="margin: 10px 0;">
                        <span style="font-size: 32px;">🏃</span>
                        <strong>${distance}m</strong> gelaufen
                    </p>
                    <p style="margin: 10px 0;">
                        <span style="font-size: 32px;">⏱️</span>
                        <strong>${playTime}s</strong> gespielt
                    </p>
                </div>
                
                <div id="highscore-list-container" style="margin: 20px 0;"></div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="restart-button" style="flex: 1; padding: 15px; font-size: 18px; background: #4CAF50; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
                        🔄 Nochmal
                    </button>
                    <button id="menu-button" style="flex: 1; padding: 15px; font-size: 18px; background: #2196F3; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
                        🏠 Menü
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Highscores laden
        const highscores = await window.statsManager.getHighscores('santa-run', 3);
        const container = document.getElementById('highscore-list-container');
        
        if (highscores && highscores.length > 0) {
            container.innerHTML = `
                <h3 style="margin-bottom: 15px;">🏆 Top 3 Highscores</h3>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.1); border-radius: 10px; padding: 10px;">
                    ${highscores.map((entry, index) => `
                        <div style="display: flex; justify-content: space-between; padding: 8px; margin: 5px 0; background: ${entry.username === window.statsManager.username ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.1)'}; border-radius: 5px;">
                            <span><strong>${index + 1}.</strong> ${entry.username}</span>
                            <span><strong>${entry.highscore}m</strong></span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Event Listeners
        document.getElementById('restart-button').addEventListener('click', () => {
            overlay.remove();
            this.start();
        });
        
        document.getElementById('menu-button').addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
}

// Polyfill für roundRect (falls nicht vorhanden)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
    };
}
