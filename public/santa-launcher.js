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
        this.angle = 30; // Start-Winkel
        this.angleDirection = 1; // Richtung des Pendelns
        this.angleSpeed = 0.8; // Geschwindigkeit des Pendelns (langsamer für Mobile)
        this.angleMin = 10; // Sehr flacher Minimum-Winkel
        this.angleMax = 50; // Moderater Maximum-Winkel
        
        this.power = 0;
        this.powerSpeed = 0.9; // Wie schnell füllt sich der Balken (langsamer für Mobile)
        this.powerMax = 100;
        this.powerDanger = 85; // Ab hier rot/gefährlich
        
        // Santa-Physik (Y-Achse: größere Werte = tiefer/näher am Boden)
        this.santa = {
            x: 100,
            y: 510, // Näher am Boden (Boden=550, war 500)
            vx: 0,
            vy: 0,
            size: 30,
            rotation: 0
        };
        
        this.gravity = 0.15; // Noch flacher fallen (war 0.18)
        this.airResistance = 0.998; // Minimal Luftwiderstand = Santa behält Geschwindigkeit länger (war 0.996)
        
        // Kamera-Offset für scrollenden Hintergrund
        this.cameraX = 0;
        this.cameraOffset = 250; // Start: Santa weiter rechts (größerer Offset)
        this.targetCameraOffset = 100; // Ziel: Santa weit links (kleiner Offset)
        
        // Energie zum Hochhalten
        this.energy = 150; // Mehr Start-Energie (war 100)
        this.maxEnergy = 150; // Höheres Maximum (war 100)
        this.energyDrain = 0.18; // Noch weniger Verbrauch (war 0.22)
        this.boost = -0.22; // Goldener Mittelweg zwischen -0.18 und -0.25
        this.boostSmoothing = 0.14; // Gute Balance zwischen Smoothness und Reaktion
        
        // Sterne zum Einsammeln
        this.stars = [];
        this.starSpawnTimer = 0;
        
        // Score
        this.distance = 0;
        this.maxDistance = 0;
        this.starsCollected = 0;
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
            <div class="launcher-game-container">
                <div class="launcher-game-header">
                    <div class="launcher-score-display">
                        <span class="score-label">🚀</span>
                        <span id="launcher-distance" class="score-value">0</span>
                        <span class="score-unit">m</span>
                    </div>
                    <div class="launcher-info">
                        🎅 Santa Launcher
                    </div>
                </div>
                
                <!-- Stats Banner -->
                <div class="launcher-stats-banner">
                    <div class="stat-box">
                        <div class="stat-icon">📏</div>
                        <div class="stat-info">
                            <div class="stat-value" id="banner-distance">0</div>
                            <div class="stat-label">Distanz (m)</div>
                        </div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-info">
                            <div class="stat-value" id="banner-stars">0</div>
                            <div class="stat-label">Sterne</div>
                        </div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-info">
                            <div class="stat-value" id="banner-energy">100%</div>
                            <div class="stat-label">Energie</div>
                        </div>
                    </div>
                </div>
                
                <canvas id="launcher-canvas" class="launcher-canvas"></canvas>
                
                <!-- Instructions Overlay -->
                <div class="launcher-instructions-overlay" id="launcher-instructions-overlay">
                    <div class="instructions-content">
                        <h2>� Santa-Katapult! 🚀</h2>
                        <div class="instruction-items">
                            <div class="instruction-item">
                                <span class="item-icon">📐</span>
                                <span>Schritt 1: Wähle den Winkel (20°-80°)</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">⚡</span>
                                <span>Schritt 2: Wähle die Power (⚠️ Nicht zu viel!)</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">🌟</span>
                                <span>Im Flug: Drücke/Halte um hochzuhalten</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">⭐</span>
                                <span>Sammle Sterne für mehr Energie!</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">🏠</span>
                                <span>Lande auf dem Dach für Bonus!</span>
                            </div>
                        </div>
                        <p class="difficulty-info">🎯 Ziel: Fliege so weit wie möglich!</p>
                        <button class="instruction-ok-button" id="instruction-ok-button">
                            ✓ Okay, verstanden!
                        </button>
                    </div>
                </div>
                
                <!-- Start Button (erscheint nach OK) -->
                <div class="start-button-overlay" id="start-button-overlay" style="display: none;">
                    <button class="launcher-start-button pulse" id="launcher-start-button">
                        <span class="button-icon">🎮</span>
                        <span>Spiel starten!</span>
                    </button>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('launcher-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        // Anti-Aliasing und smoothes Rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Responsive Canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Show start overlay and attach event listener
        console.log('🔄 Showing start overlay...');
        statsManager.showGameStartOverlay('santa-launcher').then(() => {
            console.log('✅ Start overlay shown');
            const startBtn = document.getElementById('startButton');
            console.log('🔍 Looking for start button:', startBtn);
            if (startBtn) {
                console.log('✅ Start button found, attaching click listener');
                startBtn.addEventListener('click', async () => {
                    console.log('🖱️ Start button clicked!');
                    try {
                        await this.start();
                    } catch (error) {
                        console.error('❌ Error starting game:', error);
                    }
                });
            } else {
                console.error('❌ Start button not found!');
            }
        }).catch(error => {
            console.error('❌ Error showing start overlay:', error);
        });
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
        const header = document.querySelector('.launcher-game-header');
        const banner = document.querySelector('.launcher-stats-banner');
        
        // Dynamische Höhenberechnung
        const headerHeight = header ? header.offsetHeight : 0;
        const bannerHeight = banner ? banner.offsetHeight : 0;
        const containerHeight = container.offsetHeight;
        
        // Canvas nimmt verfügbaren Platz (100% - Header - Banner)
        const availableHeight = containerHeight - headerHeight - bannerHeight;
        
        // Desktop: Max 1200px breit, Mobile: 100%
        const maxWidth = window.innerWidth > 768 ? Math.min(1200, container.offsetWidth) : container.offsetWidth;
        
        this.canvas.width = maxWidth;
        this.canvas.height = Math.max(400, availableHeight);
    }
    
    async start() {
        // Spielername sicherstellen
        await window.statsManager.ensureUsername();
        
        this.gameActive = true;
        this.phase = 'angle';
        this.angle = 45;
        this.power = 0;
        this.distance = 0;
        this.maxDistance = 0;
        this.starsCollected = 0;
        this.energy = 100;
        this.stars = [];
        this.startTime = Date.now();
        this.cameraX = 0;
        this.particles = [];
        
        // Segelphase für initialen Momentum
        this.glideTime = 0;
        this.glidePhase = false;
        
        // Kamera-Offset zurücksetzen (Start: Santa rechts)
        this.cameraOffset = 250;
        
        // Verstecke Start Overlay
        const startOverlay = document.getElementById('startOverlay');
        if (startOverlay) {
            startOverlay.classList.remove('active');
        }
        
        // Regeneriere Parallax-Elemente
        this.initParallax();
        
        // Reset Santa (Y-Achse: größere Werte = tiefer/näher am Boden)
        this.santa = {
            x: 100,
            y: 510, // Näher am Boden (Boden=550, war 500)
            vx: 0,
            vy: 0,
            size: 30,
            rotation: 0
        };
        
        // Aktualisiere Banner
        this.updateBanner();
        
        // Setup Controls
        this.setupControls();
        
        // Start Game Loop
        this.gameLoop();
    }
    
    updateBanner() {
        // Distanz
        document.getElementById('banner-distance').textContent = Math.floor(this.maxDistance);
        document.getElementById('launcher-distance').textContent = Math.floor(this.maxDistance);
        
        // Sterne
        document.getElementById('banner-stars').textContent = this.starsCollected;
        
        // Energie
        const energyPercent = Math.max(0, Math.floor((this.energy / this.maxEnergy) * 100));
        document.getElementById('banner-energy').textContent = energyPercent + '%';
        
        // Energie-Warnung
        const energyBox = document.getElementById('banner-energy').closest('.stat-box');
        if (energyPercent <= 20) {
            energyBox.classList.add('energy-critical');
        } else if (energyPercent <= 50) {
            energyBox.classList.add('energy-warning');
        } else {
            energyBox.classList.remove('energy-warning', 'energy-critical');
        }
    }
    
    setupControls() {
        // Separate Touch/Click Handling mit Debounce
        this.boostActive = false;
        this.lastTouchTime = 0;
        const TOUCH_DEBOUNCE = 300; // 300ms Verzögerung zwischen Touch-Events
        
        // Click Handler für Desktop
        this.clickHandler = (e) => {
            if (this.phase === 'angle') {
                this.phase = 'power';
                this.power = 0;
            } else if (this.phase === 'power') {
                this.launch();
            }
        };
        
        // Touch Handler für Mobile mit Debounce
        this.touchHandler = (e) => {
            e.preventDefault();
            const now = Date.now();
            
            // Wenn im Flug, aktiviere Boost
            if (this.phase === 'flying') {
                this.boostActive = true;
                return;
            }
            
            // Debounce für Angle/Power Phasen
            if (now - this.lastTouchTime < TOUCH_DEBOUNCE) {
                return; // Ignoriere zu schnelle Touches
            }
            this.lastTouchTime = now;
            
            if (this.phase === 'angle') {
                this.phase = 'power';
                this.power = 0;
            } else if (this.phase === 'power') {
                this.launch();
            }
        };
        
        // Desktop: Click Events
        this.canvas.addEventListener('click', this.clickHandler);
        
        // Mobile: Touch Events (mit passive: false für preventDefault)
        this.canvas.addEventListener('touchstart', this.touchHandler, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.boostActive = false;
        }, { passive: false });
        
        // Desktop: Mouse Events für Boost
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
        
        // Berechne Start-Geschwindigkeit (moderate Power für kontrollierte Flüge)
        const angleRad = (this.angle * Math.PI) / 180;
        const force = this.power * 0.24; // Moderater Wert zwischen alt (0.22) und zu stark (0.28)
        
        this.santa.vx = Math.cos(angleRad) * force;
        this.santa.vy = -Math.sin(angleRad) * force;
        
        // Aktiviere Segelphase basierend auf Power (mehr Power = länger segeln)
        this.glidePhase = true;
        this.glideTime = 0;
        // Längere Segelphase: 60-145 Frames (~1.0-2.4 Sekunden)
        this.maxGlideTime = 60 + (this.power * 1.0);
        
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
            // Segelphase - Santa "schwebt" erstmal mit Katapult-Momentum
            if (this.glidePhase) {
                this.glideTime++;
                
                // Während Segelphase: Reduzierte Schwerkraft (moderater als vorher)
                const glideProgress = this.glideTime / this.maxGlideTime;
                
                // Erste 40% der Segelphase: Minimale Schwerkraft (20%)
                // Mittlere 30%: Steigt auf 50%
                // Letzte 30%: Steigt auf 70%
                let gravityMultiplier;
                if (glideProgress < 0.4) {
                    gravityMultiplier = 0.2; // Leichtes Segeln
                } else if (glideProgress < 0.7) {
                    const progress = (glideProgress - 0.4) / 0.3;
                    gravityMultiplier = 0.2 + (progress * 0.3); // 20% → 50%
                } else {
                    const progress = (glideProgress - 0.7) / 0.3;
                    gravityMultiplier = 0.5 + (progress * 0.2); // 50% → 70%
                }
                
                const glideGravity = this.gravity * gravityMultiplier;
                this.santa.vy += glideGravity;
                
                // Segelphase endet nach maxGlideTime
                if (this.glideTime >= this.maxGlideTime) {
                    this.glidePhase = false;
                }
            } else {
                // Normale Physik nach Segelphase
                this.santa.vy += this.gravity;
            }
            
            // Smooth Boost - nur sanfter vertikaler Auftrieb
            if (!this.currentBoost) this.currentBoost = 0;
            
            if (this.boostActive && this.energy > 0) {
                // Sanft zum Ziel-Boost interpolieren (nur vertikal, kein horizontaler Schub)
                this.currentBoost += (this.boost - this.currentBoost) * this.boostSmoothing;
                this.santa.vy += this.currentBoost;
                
                this.energy -= this.energyDrain;
                if (this.energy < 0) this.energy = 0;
            } else {
                // Sanft zurück zu 0 wenn nicht mehr geboostet
                this.currentBoost *= 0.85;
                if (Math.abs(this.currentBoost) < 0.01) this.currentBoost = 0;
            }
            
            // Luftwiderstand (sehr minimal für langsamen Geschwindigkeitsverlust)
            this.santa.vx *= this.airResistance;
            this.santa.vy *= this.airResistance;
            
            // Position update
            this.santa.x += this.santa.vx;
            this.santa.y += this.santa.vy;
            
            // Sanfte Y-Begrenzung: Lasse Santa teilweise aus dem Bild (nur Füße sichtbar)
            const softLimit = -10; // Kann 10px über Bildschirmrand (Füße noch sichtbar)
            const hardLimit = -30; // Absolute Obergrenze
            
            // Sanfte progressive Dämpfung statt hartem Stop
            if (this.santa.y < softLimit) {
                // Je höher Santa fliegt, desto stärker die Dämpfung
                const overDistance = softLimit - this.santa.y; // Wie weit über der Grenze
                const dampingFactor = 0.92 - (overDistance * 0.002); // 0.92 bis 0.88 (sanft)
                
                // Nur vertikale Geschwindigkeit dämpfen, horizontal bleibt
                if (this.santa.vy < 0) {
                    this.santa.vy *= Math.max(dampingFactor, 0.85); // Mindestens 0.85
                }
                
                // Harter Stop nur bei extremer Höhe
                if (this.santa.y < hardLimit) {
                    this.santa.y = hardLimit;
                    this.santa.vy = Math.max(this.santa.vy, -0.5); // Sanft zurückdrücken
                }
            }
            
            // Dynamisches Kamera-System: Start rechts, dann langsam nach links
            // Offset verringert sich über Zeit (unabhängig von Geschwindigkeit)
            if (this.cameraOffset > this.targetCameraOffset) {
                this.cameraOffset -= 0.3; // Langsames Gleiten nach links
                if (this.cameraOffset < this.targetCameraOffset) {
                    this.cameraOffset = this.targetCameraOffset;
                }
            }
            
            // Kamera folgt Santa mit dynamischem Offset
            const targetCameraX = this.santa.x - this.cameraOffset;
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
                this.updateBanner();
            }
            
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
                    this.starsCollected++;
                    this.energy = Math.min(this.maxEnergy, this.energy + 30); // Mehr Energie (war 20)
                    
                    // Moderater Geschwindigkeits-Boost (beschleunigt, aber nicht zu viel)
                    this.santa.vx += 1.5; // Gibt Speed, aber weniger als vorher (war 2.5)
                    
                    // Sanfter Auftrieb ähnlich wie manueller Boost
                    this.santa.vy -= 0.4;
                    
                    // Mini-Segelphase aktivieren (längeres Segeln nach Stern)
                    this.glidePhase = true;
                    this.glideTime = 0;
                    this.maxGlideTime = 30; // ~0.5 Sekunden
                    
                    this.showMessage('+30 Energie + Speed! ⭐🚀', '#f1c40f');
                    this.updateBanner();
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
        const centerX = this.canvas.width / 2;
        
        // Winkel-Anzeige (responsive, immer zentriert)
        if (this.phase === 'angle') {
            const baseY = 80;
            
            const angleText = `${Math.round(this.angle)}°`;
            ctx.font = 'bold 36px Arial';
            const textWidth = ctx.measureText(angleText).width;
            const boxWidth = textWidth + 30;
            const boxX = centerX - boxWidth / 2;
            
            // Hintergrund-Box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(boxX, baseY - 30, boxWidth, 50);
            
            // Rahmen
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.strokeRect(boxX, baseY - 30, boxWidth, 50);
            
            // Text mit Schatten
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#f1c40f';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(angleText, centerX, baseY);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
        
        if (this.phase === 'power') {
            // Power Bar - responsive Breite
            const maxBarWidth = 300;
            const padding = 40;
            const barWidth = Math.min(maxBarWidth, this.canvas.width - padding * 2);
            const barHeight = 30;
            const barX = centerX - barWidth / 2;
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
            ctx.fillText('⚡ POWER', centerX, barY - 10);
            
            if (isInDanger) {
                ctx.fillStyle = '#e74c3c';
                ctx.fillText('⚠️ GEFAHR!', centerX, barY + barHeight + 30);
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
        if (this.clickHandler) {
            this.canvas.removeEventListener('click', this.clickHandler);
            this.canvas.removeEventListener('touchstart', this.clickHandler);
        }
        if (this.mouseDownHandler) {
            this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
            this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
        }
        
        // Spielzeit
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Speichere Statistik
        try {
            await window.statsManager.saveStats('santa-launcher', this.maxDistance, playTime);
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
        const highscores = await window.statsManager.getHighscores('santa-launcher', 3);
        
        const highscoresHTML = highscores.map((entry, index) => `
            <li class="highscore-item">
                <span class="highscore-rank">${index + 1}.</span>
                <span class="highscore-name">${entry.username}</span>
                <span class="highscore-score">${entry.highscore}m 🚀</span>
            </li>
        `).join('');
        
        // Zeige Game Over Overlay mit globalem System
        await statsManager.showGameOverOverlay('santa-launcher', [
            {label: 'Distanz', value: `${this.maxDistance}m`},
            {label: 'Sterne gesammelt', value: this.starsCollected}
        ]);
    }
    
    getScoreMessage() {
        if (this.maxDistance >= 1000) return '🌟 Unglaublich! Orbit erreicht!';
        if (this.maxDistance >= 500) return '⭐ Fantastisch! Super weit!';
        if (this.maxDistance >= 300) return '✨ Sehr gut! Tolle Flugkurve!';
        if (this.maxDistance >= 150) return '🎄 Gut gemacht! Weiter so!';
        return '🎅 Guter Versuch! Probier es nochmal!';
    }
}
