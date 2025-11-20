// === Santa Launcher Game (Katapult) ===
class SantaLauncherGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = null;
        this.ctx = null;
        this.gameActive = false;
        
        // Toggle für Raketen-Bild vs. Canvas-Santa
        this.useRocketImage = false; // Auf true setzen um Rakete zu testen
        this.rocketImage = null;
        this.loadRocketImage();
        
        // Spiel-Phasen
        this.phase = 'angle'; // 'angle', 'power', 'flying', 'landed'
        
        // Katapult-Werte
        this.angle = 30; // Start-Winkel
        this.angleDirection = 1; // Richtung des Pendelns
        this.angleSpeed = 0.5; // Geschwindigkeit des Pendelns (reduziert für bessere Kontrolle)
        this.angleMin = 10; // Sehr flacher Minimum-Winkel
        this.angleMax = 50; // Moderater Maximum-Winkel
        
        this.power = 0;
        this.powerSpeed = 0.6; // Wie schnell füllt sich der Balken (reduziert für bessere Kontrolle)
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
        
        this.gravity = 0.1; // Noch langsamerer Fall (war 0.12)
        this.airResistance = 0.9992; // Weniger Luftwiderstand = Geschwindigkeit bleibt länger (war 0.998)
        
        // Kamera-Offset für scrollenden Hintergrund
        this.cameraX = 0;
        this.cameraOffset = 250; // Start: Santa weiter rechts (größerer Offset)
        this.targetCameraOffset = 100; // Ziel: Santa weit links (kleiner Offset)
        
        // Energie zum Hochhalten
        this.energy = 150; // Mehr Start-Energie (war 100)
        this.maxEnergy = 150; // Höheres Maximum (war 100)
        this.energyDrain = 0.15; // Weniger Verbrauch für längeres Fliegen (war 0.18)
        this.boost = -0.16; // Schwächerer Boost = weniger Übersteuerung (war -0.22)
        this.boostSmoothing = 0.10; // Langsamere Reaktion = sanftere Steuerung (war 0.14)
        
        // Sterne zum Einsammeln
        this.stars = [];
        this.starSpawnTimer = 0;
        
        // Hindernisse
        this.trees = []; // Weihnachtsbäume am Boden
        this.tornados = []; // Windhosen in der Luft
        this.treeSpawnTimer = 0;
        this.tornadoSpawnTimer = 0;
        this.obstaclesHit = 0; // Gesamt-Treffer
        
        // Schwierigkeitsstufen (alle 2000m)
        this.difficultyStage = 1;
        // Stage 1 (0-2000m): Nur Bäume
        // Stage 2 (2000-4000m): Bäume + Sterne rotieren
        // Stage 3 (4000-6000m): Bäume + rotierende Sterne + Windhosen
        // Stage 4 (6000m+): Alles + Hindernisse bewegen sich
        
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
    
    loadRocketImage() {
        this.rocketImage = new Image();
        this.rocketImage.src = '/images/santaslid.svg';
        this.rocketImage.onload = () => {
            console.log('Santaslid-Bild geladen!');
        };
        this.rocketImage.onerror = () => {
            console.error('Santaslid-Bild konnte nicht geladen werden');
            this.useRocketImage = false; // Fallback zu Canvas-Santa
        };
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
                        <div class="stat-icon">🚧</div>
                        <div class="stat-info">
                            <div class="stat-value" id="banner-obstacles">0</div>
                            <div class="stat-label">Hindernisse</div>
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
                                <span class="item-icon">🎄</span>
                                <span>Vermeide Bäume am Boden!</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">🌪️</span>
                                <span>Vermeide Windhosen in der Luft!</span>
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
        
        // Hindernisse
        document.getElementById('banner-obstacles').textContent = this.obstaclesHit;
        
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
        const force = this.power * 0.20; // Reduzierte Kraft für langsameres Spiel (war 0.24)
        
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
            
            // Schwierigkeitsstufe aktualisieren
            const newStage = Math.floor(this.distance / 2000) + 1;
            if (newStage > this.difficultyStage) {
                this.difficultyStage = newStage;
                let stageMessage = '';
                if (newStage === 2) stageMessage = '⚠️ Sterne rotieren jetzt! 🌟';
                else if (newStage === 3) stageMessage = '⚠️ Windhosen erscheinen! 🌪️';
                else if (newStage === 4) stageMessage = '⚠️ Alles bewegt sich! 💀';
                if (stageMessage) this.showMessage(stageMessage, '#ff6600');
            }
            
            // Sterne spawnen
            this.starSpawnTimer++;
            if (this.starSpawnTimer > 80) {
                this.spawnStar();
                this.starSpawnTimer = 0;
            }
            
            // Sterne aktualisieren (Orbit-Animation)
            this.stars.forEach(star => {
                if (star.orbitEnabled) {
                    star.orbitAngle += star.orbitSpeed;
                    star.x = star.orbitCenterX + Math.cos(star.orbitAngle) * star.orbitRadiusX;
                    star.y = star.orbitCenterY + Math.sin(star.orbitAngle) * star.orbitRadiusY;
                }
            });
            
            // Windhosen aktualisieren (Bewegung)
            this.tornados.forEach(tornado => {
                if (tornado.moveEnabled && !tornado.hit) {
                    tornado.moveOffset += tornado.moveSpeed;
                    tornado.y = tornado.initialY + Math.sin(tornado.moveOffset) * tornado.moveRange;
                }
            });
            
            // Bäume spawnen (am Boden)
            this.treeSpawnTimer++;
            const treeSpawnRate = Math.max(80, 140 - Math.floor(this.distance / 80));
            if (this.treeSpawnTimer > treeSpawnRate) {
                this.spawnTree();
                this.treeSpawnTimer = 0;
            }
            
            // Windhosen spawnen (in der Luft)
            this.tornadoSpawnTimer++;
            const tornadoSpawnRate = Math.max(70, 130 - Math.floor(this.distance / 100));
            if (this.tornadoSpawnTimer > tornadoSpawnRate) {
                this.spawnTornado();
                this.tornadoSpawnTimer = 0;
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
            
            // Baum-Kollision (Boden-Hindernisse!)
            for (let i = this.trees.length - 1; i >= 0; i--) {
                const tree = this.trees[i];
                
                if (!tree.hit) {
                    // Rechteck-Kollision (Baum hat Breite und Höhe)
                    const santaLeft = this.santa.x - this.santa.size / 2;
                    const santaRight = this.santa.x + this.santa.size / 2;
                    const santaTop = this.santa.y - this.santa.size / 2;
                    const santaBottom = this.santa.y + this.santa.size / 2;
                    
                    const treeLeft = tree.x - tree.width / 2;
                    const treeRight = tree.x + tree.width / 2;
                    const treeTop = tree.y - tree.height;
                    const treeBottom = tree.y;
                    
                    if (santaRight > treeLeft && santaLeft < treeRight &&
                        santaBottom > treeTop && santaTop < treeBottom) {
                        tree.hit = true;
                        this.obstaclesHit++;
                        
                        // BESTRAFUNG: Energie-Verlust und Verlangsamung!
                        this.energy = Math.max(0, this.energy - 35);
                        this.santa.vx *= 0.65;
                        this.santa.vy += 1.5;
                        
                        // Crash-Effekt (grüne Blätter)
                        for (let j = 0; j < 15; j++) {
                            this.particles.push({
                                x: tree.x + (Math.random() - 0.5) * tree.width,
                                y: tree.y - tree.height / 2 + (Math.random() - 0.5) * tree.height,
                                vx: (Math.random() - 0.5) * 6,
                                vy: (Math.random() - 0.5) * 6,
                                life: 25,
                                color: `hsl(${120 + Math.random() * 40}, 70%, 40%)`,
                                size: 3 + Math.random() * 4
                            });
                        }
                        
                        this.showMessage('-35 Energie! Baum getroffen! 🎄💥', '#228B22');
                        this.updateBanner();
                    }
                }
                
                // Entferne Bäume die weit hinter Santa sind
                if (tree.x < this.cameraX - 200) {
                    this.trees.splice(i, 1);
                }
            }
            
            // Windhosen-Kollision (Luft-Hindernisse!)
            for (let i = this.tornados.length - 1; i >= 0; i--) {
                const tornado = this.tornados[i];
                
                if (!tornado.hit) {
                    // Ellipsen-Kollision für Windhose
                    const dx = this.santa.x - tornado.x;
                    const dy = this.santa.y - tornado.y;
                    const distX = Math.abs(dx) / (tornado.width / 2);
                    const distY = Math.abs(dy) / (tornado.height / 2);
                    const dist = Math.sqrt(distX * distX + distY * distY);
                    
                    if (dist < 1) {
                        tornado.hit = true;
                        this.obstaclesHit++;
                        
                        // BESTRAFUNG: Energie-Verlust und Wirbel-Effekt!
                        this.energy = Math.max(0, this.energy - 45);
                        this.santa.vx *= 0.55; // Stärkere Verlangsamung
                        this.santa.vy += 2.5; // Wird nach unten gezogen
                        
                        // Wirbel-Effekt (graue Partikel)
                        for (let j = 0; j < 20; j++) {
                            const angle = (j / 20) * Math.PI * 2;
                            this.particles.push({
                                x: tornado.x + Math.cos(angle) * tornado.width,
                                y: tornado.y + Math.sin(angle) * tornado.height / 2,
                                vx: Math.cos(angle) * 4,
                                vy: Math.sin(angle) * 4,
                                life: 30,
                                color: `hsl(${200 + Math.random() * 40}, 50%, 50%)`,
                                size: 3 + Math.random() * 4
                            });
                        }
                        
                        this.showMessage('-45 Energie! Windhose! 🌪️💥', '#778899');
                        this.updateBanner();
                    }
                }
                
                // Entferne Windhosen die weit hinter Santa sind
                if (tornado.x < this.cameraX - 200) {
                    this.tornados.splice(i, 1);
                }
            }
            
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
        let starX, starY, tooClose;
        let attempts = 0;
        const maxAttempts = 10;
        
        // Versuche Stern weit genug von Hindernissen zu spawnen
        do {
            starX = this.santa.x + 400 + Math.random() * 200;
            starY = 100 + Math.random() * 300;
            tooClose = false;
            attempts++;
            
            // Prüfe Abstand zu Bäumen
            for (const tree of this.trees) {
                const dx = starX - tree.x;
                const dy = starY - (tree.y - tree.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) { // Mindestabstand 100px
                    tooClose = true;
                    break;
                }
            }
            
            // Prüfe Abstand zu Windhosen
            if (!tooClose) {
                for (const tornado of this.tornados) {
                    const dx = starX - tornado.x;
                    const dy = starY - tornado.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) { // Mindestabstand 120px
                        tooClose = true;
                        break;
                    }
                }
            }
        } while (tooClose && attempts < maxAttempts);
        
        // Ab Stage 2 (2000m): Sterne rotieren in Ovalen
        const orbitEnabled = this.distance >= 2000;
        
        this.stars.push({
            x: starX,
            y: starY,
            size: 15,
            // Orbit-Parameter für Rotation
            orbitEnabled: orbitEnabled,
            orbitCenterX: starX,
            orbitCenterY: starY,
            orbitRadiusX: orbitEnabled ? 40 + Math.random() * 30 : 0,
            orbitRadiusY: orbitEnabled ? 25 + Math.random() * 20 : 0,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitSpeed: orbitEnabled ? 0.02 + Math.random() * 0.02 : 0
        });
    }
    
    spawnTree() {
        // Weihnachtsbäume am Boden - variable Größen
        const treeX = this.santa.x + 500 + Math.random() * 400;
        const treeHeight = 40 + Math.random() * 60; // 40-100px hoch
        const treeWidth = treeHeight * 0.6; // Breite proportional zur Höhe
        
        this.trees.push({
            x: treeX,
            y: 550, // Am Boden (Boden = 550)
            width: treeWidth,
            height: treeHeight,
            hit: false
        });
    }
    
    spawnTornado() {
        // Windhosen erst ab Stage 3 (4000m)
        if (this.distance < 4000) return;
        
        // Windhosen in der Luft - rotierende Hindernisse
        const tornadoX = this.santa.x + 500 + Math.random() * 350;
        const tornadoY = 150 + Math.random() * 250; // In der Luft (150-400)
        
        // Ab Stage 4 (6000m): Windhosen bewegen sich
        const moveEnabled = this.distance >= 6000;
        
        this.tornados.push({
            x: tornadoX,
            y: tornadoY,
            initialY: tornadoY,
            width: 40,
            height: 80,
            hit: false,
            rotation: 0,
            rotationSpeed: 0.1 + Math.random() * 0.1,
            // Bewegungs-Parameter
            moveEnabled: moveEnabled,
            moveOffset: 0,
            moveSpeed: moveEnabled ? 0.03 + Math.random() * 0.02 : 0,
            moveRange: moveEnabled ? 60 + Math.random() * 40 : 0
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
        
        // Bäume am Boden (vor Santa)
        this.trees.forEach(tree => this.drawTree(tree));
        
        // Windhosen in der Luft (vor Santa)
        this.tornados.forEach(tornado => this.drawTornado(tornado));
        
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
        
        // Raketen-Bild verwenden wenn aktiviert und geladen
        if (this.useRocketImage && this.rocketImage && this.rocketImage.complete) {
            this.drawRocket(ctx, s);
            ctx.restore();
            return;
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
    
    drawRocket(ctx, s) {
        // Raketen-Größe (etwas größer als Santa)
        const rocketWidth = s.size * 2.5;
        const rocketHeight = s.size * 2.5;
        
        // Schatten unter der Rakete
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(5, s.size/2 + 15, s.size * 0.8, s.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Rakete zeichnen (zentriert)
        ctx.drawImage(
            this.rocketImage,
            -rocketWidth / 2,
            -rocketHeight / 2,
            rocketWidth,
            rocketHeight
        );
        
        // Boost-Flammen wenn aktiv (hinter der Rakete)
        if (this.phase === 'flying' && this.boostActive && this.energy > 0) {
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = i === 0 ? '#ff6b35' : i === 1 ? '#f7931e' : '#fdc830';
                ctx.beginPath();
                ctx.arc(-rocketWidth/2 - 10 - i * 5, 0, 8 - i * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
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
    
    drawTree(tree) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.globalAlpha = tree.hit ? 0.4 : 1;
        
        // Baumstamm (braun)
        const trunkWidth = tree.width * 0.25;
        const trunkHeight = tree.height * 0.3;
        ctx.fillStyle = tree.hit ? '#555555' : '#654321';
        ctx.fillRect(
            tree.x - trunkWidth / 2,
            tree.y - trunkHeight,
            trunkWidth,
            trunkHeight
        );
        
        // Baumkrone (3 Dreiecke übereinander - klassischer Weihnachtsbaum)
        ctx.fillStyle = tree.hit ? '#666666' : '#228B22';
        
        // Unteres Dreieck (größte Schicht)
        const bottomSize = tree.width;
        ctx.beginPath();
        ctx.moveTo(tree.x, tree.y - trunkHeight - tree.height * 0.6);
        ctx.lineTo(tree.x - bottomSize / 2, tree.y - trunkHeight);
        ctx.lineTo(tree.x + bottomSize / 2, tree.y - trunkHeight);
        ctx.closePath();
        ctx.fill();
        
        // Mittleres Dreieck
        const middleSize = tree.width * 0.75;
        ctx.beginPath();
        ctx.moveTo(tree.x, tree.y - trunkHeight - tree.height * 0.8);
        ctx.lineTo(tree.x - middleSize / 2, tree.y - trunkHeight - tree.height * 0.4);
        ctx.lineTo(tree.x + middleSize / 2, tree.y - trunkHeight - tree.height * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Oberes Dreieck (Spitze)
        const topSize = tree.width * 0.5;
        ctx.beginPath();
        ctx.moveTo(tree.x, tree.y - tree.height);
        ctx.lineTo(tree.x - topSize / 2, tree.y - trunkHeight - tree.height * 0.6);
        ctx.lineTo(tree.x + topSize / 2, tree.y - trunkHeight - tree.height * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Stern oben drauf (wenn nicht getroffen)
        if (!tree.hit) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(tree.x, tree.y - tree.height, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    
    drawTornado(tornado) {
        const ctx = this.ctx;
        
        // Rotation für Animation
        tornado.rotation += tornado.rotationSpeed;
        
        ctx.save();
        ctx.translate(tornado.x, tornado.y);
        ctx.globalAlpha = tornado.hit ? 0.3 : 0.8;
        
        // Wirbel-Effekt mit mehreren Spiralen
        for (let spiral = 0; spiral < 3; spiral++) {
            ctx.strokeStyle = tornado.hit ? '#999999' : `hsl(200, 60%, ${50 + spiral * 10}%)`;
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            const points = 20;
            for (let i = 0; i <= points; i++) {
                const t = i / points;
                const angle = tornado.rotation + t * Math.PI * 4 + spiral * Math.PI * 0.66;
                const radius = tornado.width / 2 * (1 - t * 0.5);
                const y = -tornado.height / 2 + t * tornado.height;
                const x = Math.cos(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // Wirbel-Partikel um die Windhose
        if (!tornado.hit) {
            ctx.fillStyle = '#B0C4DE';
            for (let i = 0; i < 8; i++) {
                const angle = tornado.rotation * 2 + (i / 8) * Math.PI * 2;
                const radius = tornado.width / 2 + Math.sin(tornado.rotation * 3 + i) * 10;
                const x = Math.cos(angle) * radius;
                const y = -tornado.height / 4 + Math.sin(angle + tornado.rotation) * tornado.height / 3;
                
                ctx.beginPath();
                ctx.arc(x, y, 2 + Math.sin(tornado.rotation * 2 + i) * 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.globalAlpha = 1;
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
