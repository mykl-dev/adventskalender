// === Santa Launcher Game (Katapult) ===
class SantaLauncherGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = null;
        this.ctx = null;
        this.gameActive = false;
        
        // Spiel-Phasen
        this.phase = 'angle'; // 'angle', 'power', 'flying', 'landed'
        
        // Katapult-Werte
        this.angle = 45; // Start-Winkel
        this.angleDirection = 1; // Richtung des Pendelns
        this.angleSpeed = 1.2; // Geschwindigkeit des Pendelns (schneller)
        this.angleMin = 20;
        this.angleMax = 80;
        
        this.power = 0;
        this.powerSpeed = 1.2; // Wie schnell füllt sich der Balken (schneller)
        this.powerMax = 100;
        this.powerDanger = 85; // Ab hier rot/gefährlich
        
        // Santa-Physik
        this.santa = {
            x: 100,
            y: 500,
            vx: 0,
            vy: 0,
            size: 30,
            rotation: 0
        };
        
        this.gravity = 0.3;
        this.airResistance = 0.995; // Erhöht von 0.99 - weniger Bremsung
        
        // Kamera-Offset für scrollenden Hintergrund
        this.cameraX = 0;
        
        // Energie zum Hochhalten
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyDrain = 0.4; // Pro Frame beim Drücken (reduziert von 0.8)
        this.boost = -0.5; // Auftrieb beim Drücken
        
        // Sterne zum Einsammeln
        this.stars = [];
        this.starSpawnTimer = 0;
        
        // Score
        this.distance = 0;
        this.maxDistance = 0;
        this.startTime = 0;
        
        // 3D Effekte
        this.particles = []; // Trail hinter Santa
        this.clouds = []; // Wolken für Parallax
        this.mountains = []; // Berge für Parallax
        
        this.initParallax();
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="launcher-game">
                <div class="launcher-header">
                    <div class="launcher-info">
                        🎅 Santa Launcher 🚀
                    </div>
                    <div class="launcher-distance">
                        📏 Distanz: <span id="launcher-distance">0</span>m
                    </div>
                </div>
                <canvas id="launcher-canvas" width="800" height="600"></canvas>
                <div class="launcher-instructions">
                    <h3>🎯 Santa-Katapult! 🚀</h3>
                    <p>📐 <strong>Schritt 1:</strong> Wähle den Winkel (20°-80°)</p>
                    <p>⚡ <strong>Schritt 2:</strong> Wähle die Power (⚠️ Nicht zu viel!)</p>
                    <p>🌟 <strong>Im Flug:</strong> Drücke/Halte um Santa hochzuhalten</p>
                    <p>⭐ Sammle Sterne für mehr Energie!</p>
                    <p>🏠 Lande auf dem Dach für maximale Distanz!</p>
                </div>
                <button class="game-button" id="launcher-start-button">Spiel starten! 🎮</button>
            </div>
        `;
        
        this.canvas = document.getElementById('launcher-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Responsive Canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        document.getElementById('launcher-start-button').addEventListener('click', () => this.start());
    }
    
    initParallax() {
        // Generiere Wolken
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: Math.random() * 1600 - 800,
                y: 50 + Math.random() * 200,
                size: 40 + Math.random() * 60,
                speed: 0.3 + Math.random() * 0.2
            });
        }
        
        // Generiere Berge
        for (let i = 0; i < 12; i++) {
            this.mountains.push({
                x: i * 150 - 200,
                height: 100 + Math.random() * 150,
                width: 80 + Math.random() * 100,
                speed: 0.5
            });
        }
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(container.clientWidth - 40, 800);
        const scale = maxWidth / 800;
        
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = (600 * scale) + 'px';
    }
    
    async start() {
        // Spielername sicherstellen
        await statsManager.ensureUsername();
        
        this.gameActive = true;
        this.phase = 'angle';
        this.angle = 45;
        this.power = 0;
        this.distance = 0;
        this.maxDistance = 0;
        this.energy = 100;
        this.stars = [];
        this.startTime = Date.now();
        this.cameraX = 0;
        this.particles = [];
        
        // Regeneriere Parallax-Elemente
        this.initParallax();
        
        // Reset Santa
        this.santa = {
            x: 100,
            y: 500,
            vx: 0,
            vy: 0,
            size: 30,
            rotation: 0
        };
        
        const instructions = this.container.querySelector('.launcher-instructions');
        if (instructions) instructions.style.display = 'none';
        document.getElementById('launcher-start-button').style.display = 'none';
        
        // Zeige Highscores
        await this.showHighscores();
        
        // Setup Controls
        this.setupControls();
        
        // Start Game Loop
        this.gameLoop();
    }
    
    async showHighscores() {
        const existingHighscore = document.querySelector('.highscore-display');
        if (existingHighscore) existingHighscore.remove();
        
        const top3 = await statsManager.getTop3('santa-launcher');
        const highscoreHTML = statsManager.createHighscoreDisplay(top3);
        
        this.canvas.insertAdjacentHTML('beforebegin', highscoreHTML);
    }
    
    setupControls() {
        // Click für Angle/Power
        this.clickHandler = () => {
            if (this.phase === 'angle') {
                this.phase = 'power';
                this.power = 0;
            } else if (this.phase === 'power') {
                this.launch();
            }
        };
        
        this.canvas.addEventListener('click', this.clickHandler);
        this.canvas.addEventListener('touchstart', this.clickHandler);
        
        // Gedrückt halten für Boost im Flug
        this.boostActive = false;
        
        this.mouseDownHandler = () => {
            if (this.phase === 'flying') {
                this.boostActive = true;
            }
        };
        
        this.mouseUpHandler = () => {
            this.boostActive = false;
        };
        
        this.canvas.addEventListener('mousedown', this.mouseDownHandler);
        this.canvas.addEventListener('mouseup', this.mouseUpHandler);
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.phase === 'flying') {
                e.preventDefault();
                this.boostActive = true;
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => {
            this.boostActive = false;
        });
    }
    
    launch() {
        // Power über Limit = Katapult kaputt!
        if (this.power > this.powerDanger) {
            this.showMessage('💥 Katapult kaputt! Zu viel Power!', '#e74c3c');
            setTimeout(() => {
                this.endGame();
            }, 2000);
            return;
        }
        
        // Berechne Start-Geschwindigkeit
        const angleRad = (this.angle * Math.PI) / 180;
        const force = this.power * 0.3;
        
        this.santa.vx = Math.cos(angleRad) * force;
        this.santa.vy = -Math.sin(angleRad) * force;
        
        this.phase = 'flying';
        this.showMessage('🚀 Los geht\'s!', '#2ecc71');
    }
    
    gameLoop() {
        if (!this.gameActive) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.phase === 'angle') {
            // Winkel pendelt hin und her
            this.angle += this.angleDirection * this.angleSpeed;
            
            if (this.angle >= this.angleMax) {
                this.angle = this.angleMax;
                this.angleDirection = -1;
            } else if (this.angle <= this.angleMin) {
                this.angle = this.angleMin;
                this.angleDirection = 1;
            }
        }
        
        else if (this.phase === 'power') {
            // Power füllt sich
            this.power += this.powerSpeed;
            
            // Über Maximum = Reset zu 0 (Cycle)
            if (this.power > this.powerMax) {
                this.power = 0;
            }
        }
        
        else if (this.phase === 'flying') {
            // Physik
            this.santa.vy += this.gravity;
            
            // Boost wenn gedrückt und Energie vorhanden
            if (this.boostActive && this.energy > 0) {
                this.santa.vy += this.boost;
                this.energy -= this.energyDrain;
                if (this.energy < 0) this.energy = 0;
            }
            
            // Luftwiderstand
            this.santa.vx *= this.airResistance;
            this.santa.vy *= this.airResistance;
            
            // Position update
            this.santa.x += this.santa.vx;
            this.santa.y += this.santa.vy;
            
            // Kamera folgt Santa (sanft)
            const targetCameraX = this.santa.x - 200;
            this.cameraX += (targetCameraX - this.cameraX) * 0.1;
            
            // Rotation basierend auf Geschwindigkeit
            this.santa.rotation = Math.atan2(this.santa.vy, this.santa.vx);
            
            // Partikel-Trail hinter Santa
            if (Math.random() < 0.3) {
                this.particles.push({
                    x: this.santa.x - Math.cos(this.santa.rotation) * 20,
                    y: this.santa.y - Math.sin(this.santa.rotation) * 20,
                    vx: -this.santa.vx * 0.2 + (Math.random() - 0.5) * 2,
                    vy: -this.santa.vy * 0.2 + (Math.random() - 0.5) * 2,
                    size: 3 + Math.random() * 5,
                    life: 1.0,
                    color: this.boostActive ? '#3498db' : '#e74c3c'
                });
            }
            
            // Update Partikel
            this.particles = this.particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                p.size *= 0.95;
                return p.life > 0;
            });
            
            // Distanz berechnen
            this.distance = Math.floor((this.santa.x - 100) / 10);
            if (this.distance > this.maxDistance) {
                this.maxDistance = this.distance;
            }
            document.getElementById('launcher-distance').textContent = this.maxDistance;
            
            // Sterne spawnen
            this.starSpawnTimer++;
            if (this.starSpawnTimer > 80) {
                this.spawnStar();
                this.starSpawnTimer = 0;
            }
            
            // Stern-Kollision
            this.stars = this.stars.filter(star => {
                const dx = star.x - this.santa.x;
                const dy = star.y - this.santa.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 30) {
                    // Stern eingesammelt!
                    this.energy = Math.min(this.maxEnergy, this.energy + 20);
                    
                    // Geschwindigkeits-Boost! (vorwärts)
                    this.santa.vx += 2.5;
                    
                    // Etwas Auftrieb
                    this.santa.vy -= 1.5;
                    
                    this.showMessage('+20 Energie + Speed! ⭐🚀', '#f1c40f');
                    return false;
                }
                
                // Entferne Sterne die aus dem Kamera-Bereich sind
                return star.x > this.cameraX - 100;
            });
            
            // Landung (Boden oder zu weit unten)
            if (this.santa.y >= 550) {
                this.phase = 'landed';
                this.santa.y = 550;
                this.showMessage(`🏠 Gelandet! ${this.maxDistance}m`, '#3498db');
                setTimeout(() => {
                    this.endGame();
                }, 2000);
            }
            
            // Aus dem Bild nach links = Game Over
            if (this.santa.x < -50) {
                this.endGame();
            }
        }
    }
    
    spawnStar() {
        this.stars.push({
            x: this.santa.x + 400 + Math.random() * 200,
            y: 100 + Math.random() * 300,
            size: 15
        });
    }
    
    render() {
        const ctx = this.ctx;
        
        // Himmel mit Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#0f2847');
        gradient.addColorStop(0.5, '#1e3c72');
        gradient.addColorStop(1, '#2a5298');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        // Sterne im Hintergrund (statisch)
        this.drawBackgroundStars();
        
        // Parallax Berge (langsamer als Kamera)
        this.drawMountains();
        
        // Parallax Wolken (noch langsamer)
        this.drawClouds();
        
        // 3D Boden mit Perspektive
        this.draw3DGround();
        
        // Speichere Kontext für Kamera-Transform
        ctx.save();
        ctx.translate(-this.cameraX, 0);
        
        // Katapult (nur in Phase angle/power)
        if (this.phase === 'angle' || this.phase === 'power') {
            this.drawCatapult();
        }
        
        // Partikel-Trail
        this.particles.forEach(p => this.drawParticle(p));
        
        // Santa mit 3D-Effekt
        this.drawSanta();
        
        // Sterne mit Animation
        this.stars.forEach(star => this.drawStar(star));
        
        // Stelle Kontext wieder her
        ctx.restore();
        
        // UI (immer an gleicher Stelle, NACH ctx.restore damit über allem)
        this.drawUI();
    }
    
    drawCatapult() {
        const ctx = this.ctx;
        const baseX = 100;
        const baseY = 550;
        
        // Basis
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(baseX - 30, baseY - 20, 60, 20);
        
        // Arm
        ctx.save();
        ctx.translate(baseX, baseY - 20);
        ctx.rotate(-(this.angle * Math.PI / 180));
        
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(0, -5, 80, 10);
        
        // Löffel
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.arc(80, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawSanta() {
        const ctx = this.ctx;
        const s = this.santa;
        
        ctx.save();
        ctx.translate(s.x, s.y);
        
        if (this.phase === 'flying' || this.phase === 'landed') {
            ctx.rotate(s.rotation);
        }
        
        // 3D Schatten
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(5, s.size/2 + 10, s.size * 0.6, s.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Santa-Body mit 3D-Effekt (Gradient)
        const bodyGradient = ctx.createLinearGradient(-s.size/2, 0, s.size/2, 0);
        bodyGradient.addColorStop(0, '#c0392b');
        bodyGradient.addColorStop(0.5, '#e74c3c');
        bodyGradient.addColorStop(1, '#c0392b');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-s.size/2, -s.size/2, s.size, s.size);
        
        // Highlight für 3D-Effekt
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(-s.size/2, -s.size/2, s.size * 0.3, s.size);
        
        // Bart (weiß)
        ctx.fillStyle = 'white';
        ctx.fillRect(-s.size/2, s.size/4, s.size, s.size/4);
        
        // Gesicht mit Gradient
        const faceGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s.size/2);
        faceGradient.addColorStop(0, '#ffd9c4');
        faceGradient.addColorStop(1, '#f0d0b0');
        ctx.fillStyle = faceGradient;
        ctx.fillRect(-s.size/2, -s.size/4, s.size, s.size/2);
        
        // Augen
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-s.size/4, -s.size/8, 2, 0, Math.PI * 2);
        ctx.arc(s.size/4, -s.size/8, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Mütze mit Gradient
        const hatGradient = ctx.createLinearGradient(-s.size/2, -s.size/2, s.size/2, -s.size/2);
        hatGradient.addColorStop(0, '#a0301f');
        hatGradient.addColorStop(0.5, '#c0392b');
        hatGradient.addColorStop(1, '#a0301f');
        ctx.fillStyle = hatGradient;
        ctx.beginPath();
        ctx.moveTo(-s.size/2, -s.size/2);
        ctx.lineTo(s.size/2, -s.size/2);
        ctx.lineTo(0, -s.size);
        ctx.fill();
        
        // Bommel
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, -s.size, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Boost-Flammen wenn aktiv
        if (this.phase === 'flying' && this.boostActive && this.energy > 0) {
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = i === 0 ? '#3498db' : i === 1 ? '#5dade2' : '#85c1e9';
                ctx.beginPath();
                ctx.arc(-s.size/2 - 10 - i * 5, 0, 5 - i, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    drawStar(star) {
        const ctx = this.ctx;
        
        // Rotierender Stern
        const rotation = Date.now() / 500;
        
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(rotation);
        
        // Glühen
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 20;
        
        // Gradient für 3D-Effekt
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, star.size);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.5, '#f1c40f');
        gradient.addColorStop(1, '#f39c12');
        ctx.fillStyle = gradient;
        
        // Stern zeichnen
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * star.size;
            const y = Math.sin(angle) * star.size;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Zusätzliche Glitzer-Punkte
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2 + rotation;
            const x = Math.cos(angle) * star.size * 1.3;
            const y = Math.sin(angle) * star.size * 1.3;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    drawParticle(p) {
        const ctx = this.ctx;
        ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBackgroundStars() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % 800;
            const y = (i * 73.3) % 400;
            const size = 1 + (i % 3);
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawClouds() {
        const ctx = this.ctx;
        
        this.clouds.forEach(cloud => {
            const x = cloud.x - this.cameraX * cloud.speed;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(x, cloud.y, cloud.size, 0, Math.PI * 2);
            ctx.arc(x + cloud.size * 0.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            ctx.arc(x + cloud.size * 1.2, cloud.y, cloud.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            
            // Wrap around
            if (x < -200) cloud.x += 2000;
            if (x > 1000) cloud.x -= 2000;
        });
    }
    
    drawMountains() {
        const ctx = this.ctx;
        
        this.mountains.forEach(mountain => {
            const x = mountain.x - this.cameraX * mountain.speed;
            
            ctx.fillStyle = 'rgba(44, 62, 80, 0.4)';
            ctx.beginPath();
            ctx.moveTo(x, 550);
            ctx.lineTo(x + mountain.width / 2, 550 - mountain.height);
            ctx.lineTo(x + mountain.width, 550);
            ctx.closePath();
            ctx.fill();
            
            // Schnee auf Spitze
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x + mountain.width / 2 - 10, 550 - mountain.height + 20);
            ctx.lineTo(x + mountain.width / 2, 550 - mountain.height);
            ctx.lineTo(x + mountain.width / 2 + 10, 550 - mountain.height + 20);
            ctx.closePath();
            ctx.fill();
            
            // Wrap around
            if (x < -200) mountain.x += 1800;
            if (x > 1000) mountain.x -= 1800;
        });
    }
    
    draw3DGround() {
        const ctx = this.ctx;
        
        // Gradient für 3D-Boden
        const groundGradient = ctx.createLinearGradient(0, 550, 0, 600);
        groundGradient.addColorStop(0, '#34495e');
        groundGradient.addColorStop(1, '#2c3e50');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, 550, 800, 50);
        
        // Perspektive-Linien
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 10; i++) {
            const x = (i * 80 - this.cameraX * 0.8) % 800;
            ctx.beginPath();
            ctx.moveTo(x, 550);
            ctx.lineTo(x, 600);
            ctx.stroke();
        }
    }
    
    drawUI() {
        const ctx = this.ctx;
        
        // Winkel-Anzeige (deutlich sichtbar, über allem)
        if (this.phase === 'angle') {
            const baseX = 400; // Zentral oben
            const baseY = 80;
            
            const angleText = `${Math.round(this.angle)}°`;
            ctx.font = 'bold 36px Arial';
            const textWidth = ctx.measureText(angleText).width;
            
            // Hintergrund-Box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(baseX - textWidth/2 - 15, baseY - 30, textWidth + 30, 50);
            
            // Rahmen
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.strokeRect(baseX - textWidth/2 - 15, baseY - 30, textWidth + 30, 50);
            
            // Text mit Schatten
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#f1c40f';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(angleText, baseX, baseY);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
        
        if (this.phase === 'power') {
            // Power Bar
            const barWidth = 300;
            const barHeight = 30;
            const barX = 250;
            const barY = 50;
            
            // Hintergrund
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Gefahr-Zone (rot)
            const dangerStart = (this.powerDanger / this.powerMax) * barWidth;
            ctx.fillStyle = 'rgba(231, 76, 60, 0.7)';
            ctx.fillRect(barX + dangerStart, barY, barWidth - dangerStart, barHeight);
            
            // Aktueller Power-Level
            const powerWidth = (this.power / this.powerMax) * barWidth;
            const isInDanger = this.power > this.powerDanger;
            ctx.fillStyle = isInDanger ? '#e74c3c' : '#2ecc71';
            ctx.fillRect(barX, barY, powerWidth, barHeight);
            
            // Rahmen
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ POWER', 400, 40);
            
            if (isInDanger) {
                ctx.fillStyle = '#e74c3c';
                ctx.fillText('⚠️ GEFAHR!', 400, 100);
            }
        }
        
        if (this.phase === 'flying') {
            // Energie-Bar
            const barWidth = 200;
            const barHeight = 20;
            const barX = 20;
            const barY = 20;
            
            // Hintergrund
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Energie
            const energyWidth = (this.energy / this.maxEnergy) * barWidth;
            const energyColor = this.energy > 50 ? '#2ecc71' : this.energy > 20 ? '#f39c12' : '#e74c3c';
            ctx.fillStyle = energyColor;
            ctx.fillRect(barX, barY, energyWidth, barHeight);
            
            // Rahmen
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('🔋 Energie', barX, barY - 5);
            
            // Boost-Hinweis
            if (this.boostActive && this.energy > 0) {
                ctx.fillStyle = '#3498db';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🚀 BOOST!', 400, 100);
            }
        }
    }
    
    showMessage(text, color) {
        const msg = document.createElement('div');
        msg.className = 'launcher-message';
        msg.textContent = text;
        msg.style.color = color;
        this.canvas.parentElement.appendChild(msg);
        
        setTimeout(() => msg.remove(), 2000);
    }
    
    async endGame() {
        this.gameActive = false;
        
        // Cleanup
        this.canvas.removeEventListener('click', this.clickHandler);
        this.canvas.removeEventListener('touchstart', this.clickHandler);
        this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
        this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
        
        // Spielzeit
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Speichere Statistik
        await statsManager.saveStats('santa-launcher', this.maxDistance, playTime);
        
        // Lade Top 3
        const top3 = await statsManager.getTop3('santa-launcher');
        const highscoreHTML = statsManager.createHighscoreDisplay(top3, this.maxDistance);
        
        // Game Over Overlay
        const overlay = document.createElement('div');
        overlay.className = 'game-over';
        overlay.innerHTML = `
            <div class="game-over-title">🎅 Landung! 🏠</div>
            <div class="game-over-score">Du bist <strong>${this.maxDistance}m</strong> weit geflogen!</div>
            <div class="game-over-message">${this.getScoreMessage()}</div>
            ${highscoreHTML}
            <div class="game-over-buttons">
                <button class="game-restart-button" id="launcher-restart-button">🔄 Nochmal spielen</button>
                <button class="game-fullhighscore-button" id="launcher-fullhighscore-button">📊 Alle Highscores</button>
            </div>
        `;
        
        this.canvas.parentElement.appendChild(overlay);
        
        // Event Listeners
        document.getElementById('launcher-restart-button').addEventListener('click', () => {
            overlay.remove();
            const existingHighscore = document.querySelector('.highscore-display');
            if (existingHighscore) existingHighscore.remove();
            this.start();
        });
        
        document.getElementById('launcher-fullhighscore-button').addEventListener('click', async () => {
            await this.showFullHighscores();
        });
    }
    
    async showFullHighscores() {
        const allScores = await statsManager.getAllScores('santa-launcher');
        
        if (!allScores || allScores.length === 0) return;
        
        const modal = document.createElement('div');
        modal.className = 'highscore-modal';
        modal.innerHTML = `
            <div class="highscore-modal-content">
                <div class="highscore-modal-header">
                    <h2>🏆 Alle Highscores - Santa Launcher</h2>
                    <button class="highscore-modal-close" id="highscore-modal-close">&times;</button>
                </div>
                <div class="highscore-modal-body">
                    ${this.createFullHighscoreList(allScores)}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('highscore-modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    createFullHighscoreList(scores) {
        const medals = ['🥇', '🥈', '🥉'];
        
        const rows = scores.map((player, index) => {
            const rank = index + 1;
            const medal = medals[index] || `${rank}.`;
            const isCurrentPlayer = player.username === statsManager.username;
            const highlightClass = isCurrentPlayer ? 'current-player' : '';
            
            const minutes = Math.floor(player.totalPlayTime / 60);
            const seconds = player.totalPlayTime % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            return `
                <div class="highscore-full-row ${highlightClass}">
                    <span class="rank">${medal}</span>
                    <span class="player-name">${player.username}</span>
                    <span class="player-score">${player.highscore}m</span>
                    <span class="player-games">${player.gamesPlayed} Spiele</span>
                    <span class="player-time">${timeStr}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="highscore-full-list">
                <div class="highscore-full-header">
                    <span class="rank">Rang</span>
                    <span class="player-name">Spieler</span>
                    <span class="player-score">Distanz</span>
                    <span class="player-games">Gespielt</span>
                    <span class="player-time">Zeit</span>
                </div>
                ${rows}
            </div>
        `;
    }
    
    getScoreMessage() {
        if (this.maxDistance >= 1000) return '🌟 Unglaublich! Orbit erreicht!';
        if (this.maxDistance >= 500) return '⭐ Fantastisch! Super weit!';
        if (this.maxDistance >= 300) return '✨ Sehr gut! Tolle Flugkurve!';
        if (this.maxDistance >= 150) return '🎄 Gut gemacht! Weiter so!';
        return '🎅 Guter Versuch! Probier es nochmal!';
    }
}
