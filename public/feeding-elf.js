/**
 * Feeding Elf Game - Farb-Matching Geschicklichkeitsspiel
 * Schleudere die Kugel zu den farbigen Zielen
 */

class FeedingElfGame {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.score = 0;
        this.gameActive = false;
        this.lives = 3;
        
        // Canvas und Kontext
        this.canvas = null;
        this.ctx = null;
        
        // Bilder laden (von public/images/)
        this.wallImage = new Image();
        this.wallImage.src = '../images/mauer.jpg';
        this.wallImage.onload = () => console.log('Mauer-Bild geladen:', this.wallImage.width, 'x', this.wallImage.height);
        this.wallImage.onerror = () => console.error('Mauer-Bild konnte nicht geladen werden:', this.wallImage.src);
        
        // Lade Wichtel als einzelne WebP-Datei (mit Transparenz)
        this.elfImage = new Image();
        this.elfImage.src = '../images/elf1.webp';
        this.elfImage.onload = () => console.log('Wichtel-Bild geladen:', this.elfImage.width, 'x', this.elfImage.height);
        this.elfImage.onerror = () => console.error('Wichtel-Bild konnte nicht geladen werden:', this.elfImage.src);
        
        // 8 verschiedene Farben optimiert für Farbschwache mit Symbolen
        this.colors = [
            { color: '#FF0000', symbol: '●', name: 'Rot' },      // Rot - Kreis
            { color: '#0055FF', symbol: '■', name: 'Blau' },     // Blau - Quadrat (heller)
            { color: '#00DD00', symbol: '▲', name: 'Grün' },    // Grün - Dreieck (heller)
            { color: '#FFD700', symbol: '★', name: 'Gold' },     // Gold - Stern
            { color: '#FF7700', symbol: '◆', name: 'Orange' },   // Orange - Raute (kräftiger)
            { color: '#AA00FF', symbol: '✖', name: 'Lila' },     // Lila - Kreuz (heller)
            { color: '#00DDDD', symbol: '▼', name: 'Cyan' },     // Cyan - umgedrehtes Dreieck (heller)
            { color: '#FF1493', symbol: '•', name: 'Pink' }      // Pink - Punkt
        ];
        
        // Ziel-Kreise oben
        this.targets = [];
        this.targetRadius = 0; // Wird in resize gesetzt
        this.targetY = 0;
        
        // Kugel unten
        this.ball = {
            x: 0,
            y: 0,
            radius: 0,
            color: '',
            vx: 0,
            vy: 0,
            isDragging: false,
            dragStartY: 0,
            maxDragDistance: 0
        };
        
        // Touch/Drag System
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.isDragging = false;
        
        // Partikel-Effekte
        this.particles = [];
        
        // Hindernis-Lichterkette
        this.lightsObstacle = {
            visible: false,
            offsetX: 0,
            offsetY: 0,
            targetY: 0,
            width: 0,
            speed: 2,
            moveSpeed: 2,
            direction: 1
        };
        
        // Physik für Ziel-Bälle (ab Treffer 20)
        this.ballPhysicsActive = false;
        
        // Elfen-Hindernis (6 Elfen im SVG)
        this.elf = {
            visible: false,
            x: 0,
            y: 0,
            size: 60,
            vx: 0,
            vy: 0,
            targetX: 0,
            targetY: 0,
            currentElfIndex: 0  // Welcher Elf (0-5) aktuell verwendet wird
        };
        
        this.hitCounter = 0; // Zählt Treffer für Hindernis-System
        
        // Fehltreffer-Animation
        this.missAnimation = {
            active: false,
            startTime: 0,
            duration: 500,
            x: 0,
            y: 0
        };
        
        // Lichterkette
        this.lights = [];
        
        // Timing
        this.startTime = 0;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="feeding-elf-container">
                <div class="feeding-elf-header">
                    <div class="score-display">
                        <span>🎯</span>
                        <span id="elf-score">0</span>
                    </div>
                    <div class="score-display">
                        <span>❤️</span>
                        <span id="elf-lives">3</span>
                    </div>
                </div>
                
                <canvas id="feeding-elf-canvas" class="feeding-elf-canvas"></canvas>
                
                <!-- Instructions Overlay -->
                <div class="santa-instructions-overlay" id="elf-instructions-overlay">
                    <div class="instructions-content">
                        <h2>🎯 Feeding Elf! 🎄</h2>
                        <div class="instruction-items">
                            <div class="instruction-item">
                                <span class="item-icon">🔴</span>
                                <span>Triff die richtige Farbe!</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">👆</span>
                                <span>Ziehe die Kugel nach unten und lasse los</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">🎯</span>
                                <span>Lenke zur passenden Farbe</span>
                            </div>
                            <div class="instruction-item">
                                <span class="item-icon">❤️</span>
                                <span>3 Leben - Nicht verpassen!</span>
                            </div>
                        </div>
                        <p class="difficulty-info">💡 Je weiter ziehen = stärker!</p>
                        <button class="instruction-ok-button" id="elf-instruction-ok-button">
                            ✓ Okay, verstanden!
                        </button>
                    </div>
                </div>
                
                <!-- Start Button -->
                <div class="start-button-overlay" id="elf-start-button-overlay" style="display: none;">
                    <button class="santa-start-button pulse" id="elf-start-button">
                        <span class="button-icon">🎮</span>
                        <span>Spiel starten!</span>
                    </button>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('feeding-elf-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        // Anti-Aliasing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Responsive Canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // OK Button
        document.getElementById('elf-instruction-ok-button').addEventListener('click', () => {
            document.getElementById('elf-instructions-overlay').style.display = 'none';
            document.getElementById('elf-start-button-overlay').style.display = 'flex';
        });
        
        // Start Button
        document.getElementById('elf-start-button').addEventListener('click', () => this.start());
        
        // Controls
        this.setupControls();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const header = document.querySelector('.feeding-elf-header');
        const headerHeight = header ? header.offsetHeight : 50;
        
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight - headerHeight;
        
        // Lichterkette initialisieren (nach Canvas-Größe bekannt ist)
        if (this.lights.length === 0) {
            this.initLights();
        }
        
        // Ziel-Positionen und Größen
        const targetCount = 4;
        const spacing = this.canvas.width / (targetCount + 1);
        this.targetRadius = Math.min(this.canvas.width / 12, 50);
        this.targetY = this.targetRadius + 20;
        
        // Ball-Eigenschaften
        this.ball.radius = Math.min(this.canvas.width / 15, 35);
        this.ball.y = this.canvas.height - this.ball.radius - 350;
        this.ball.x = this.canvas.width / 2;
        this.ball.maxDragDistance = this.canvas.height * 0.5;
        this.ball.initialY = this.ball.y; // Speichere Startposition
    }
    
    setupControls() {
        // Touch Start
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.gameActive || this.ball.vy !== 0) return;
            
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Prüfe ob Ball getroffen
            const dx = x - this.ball.x;
            const dy = y - this.ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.ball.radius + 20) {
                this.isDragging = true;
                this.touchStartX = x;
                this.touchStartY = y;
                this.ball.dragStartY = this.ball.y;
            }
        });
        
        // Touch Move
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touchCurrentX = touch.clientX - rect.left;
            this.touchCurrentY = touch.clientY - rect.top;
            
            // Ball mitbewegen beim Ziehen
            const dragY = Math.max(0, Math.min(this.touchCurrentY - this.touchStartY, this.ball.maxDragDistance));
            this.ball.y = this.ball.initialY + dragY;
        });
        
        // Touch End
        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            this.shoot();
            this.isDragging = false;
        });
        
        // Mouse Events (Desktop)
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.gameActive || this.ball.vy !== 0) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const dx = x - this.ball.x;
            const dy = y - this.ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.ball.radius + 20) {
                this.isDragging = true;
                this.touchStartX = x;
                this.touchStartY = y;
                this.ball.dragStartY = this.ball.y;
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const rect = this.canvas.getBoundingClientRect();
            this.touchCurrentX = e.clientX - rect.left;
            this.touchCurrentY = e.clientY - rect.top;
            
            // Ball mitbewegen beim Ziehen
            const dragY = Math.max(0, Math.min(this.touchCurrentY - this.touchStartY, this.ball.maxDragDistance));
            this.ball.y = this.ball.initialY + dragY;
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (!this.isDragging) return;
            
            this.shoot();
            this.isDragging = false;
        });
    }
    
    shoot() {
        // Berechne Schuss-Vektor
        const dragX = this.touchCurrentX - this.touchStartX;
        const dragY = Math.max(0, this.touchCurrentY - this.touchStartY); // Nur nach unten ziehen zählt
        
        // Begrenze Drag-Distanz
        const limitedDragY = Math.min(dragY, this.ball.maxDragDistance);
        
        // Schuss-Kraft basierend auf Drag-Distanz
        const power = limitedDragY / this.ball.maxDragDistance;
        const maxSpeed = 50;
        
        // Richtung spiegeln: nach links ziehen = Ball fliegt rechts
        this.ball.vx = -(dragX / 60) * maxSpeed * power;
        this.ball.vy = -maxSpeed * power;
    }
    
    async start() {
        // Spielername sicherstellen
        await window.statsManager.ensureUsername();
        
        this.score = 0;
        this.lives = 3;
        this.gameActive = true;
        this.particles = [];
        this.startTime = Date.now();
        this.lastFrameTime = 0;
        this.deltaTime = 16.67;
        
        // Verstecke Start-Button
        document.getElementById('elf-start-button-overlay').style.display = 'none';
        
        // Update Display
        document.getElementById('elf-score').textContent = '0';
        document.getElementById('elf-lives').textContent = '3';
        
        // Initialisiere Ziele
        this.initTargets();
        
        // Initialisiere Ball
        this.resetBall();
        
        // Initialisiere Hindernisse
        this.hitCounter = 0;
        this.lightsObstacle.visible = false;
        this.lightsObstacle.offsetY = 0;
        this.lightsObstacle.width = this.canvas.width * 0.4;
        this.lightsObstacle.offsetX = this.canvas.width / 2 - this.lightsObstacle.width / 2;
        
        this.elf.visible = false;
        this.elf.x = this.canvas.width / 2;
        this.elf.y = this.canvas.height * 0.3;
        this.setElfTarget();
        
        this.gameLoop();
    }
    
    setElfTarget() {
        // Wähle zufälligen Punkt im oberen Bereich
        const margin = this.elf.size;
        this.elf.targetX = margin + Math.random() * (this.canvas.width - margin * 2);
        this.elf.targetY = this.canvas.height * 0.15 + Math.random() * this.canvas.height * 0.3;
    }
    
    activateBallPhysics() {
        // Aktiviere Physik für alle vorhandenen Ziel-Bälle
        this.ballPhysicsActive = true;
        
        // Füge Geschwindigkeit und Masse zu jedem Target hinzu
        this.targets.forEach(target => {
            target.vx = (Math.random() - 0.5) * 4; // Geschwindigkeit -2 bis +2 (moderat)
            target.vy = (Math.random() - 0.5) * 4;
            target.mass = target.radius; // Masse proportional zu Radius
        });
    }
    
    updateTargetPhysics(deltaTime) {
        if (!this.ballPhysicsActive) return;
        
        const dt = deltaTime / 16.67; // Normalisiere auf 60fps
        
        this.targets.forEach(target => {
            // Bewegung
            target.x += target.vx * dt;
            target.y += target.vy * dt;
            
            // KEINE Dämpfung - Bälle bleiben in Bewegung!
            
            // Wand-Kollision (fast perfekt elastisch)
            if (target.x - target.radius < 0) {
                target.x = target.radius;
                target.vx = Math.abs(target.vx); // Kehre um ohne Energieverlust
            }
            if (target.x + target.radius > this.canvas.width) {
                target.x = this.canvas.width - target.radius;
                target.vx = -Math.abs(target.vx); // Kehre um ohne Energieverlust
            }
            
            // Obere und untere Grenze (Ziel-Bereich bleibt oben)
            const minY = target.radius;
            const maxY = this.canvas.height * 0.35;
            
            if (target.y - target.radius < minY) {
                target.y = minY + target.radius;
                target.vy = Math.abs(target.vy); // Kehre um ohne Energieverlust
            }
            if (target.y + target.radius > maxY) {
                target.y = maxY - target.radius;
                target.vy = -Math.abs(target.vy); // Kehre um ohne Energieverlust
            }
            
            // Minimale Geschwindigkeit sicherstellen (falls doch zu langsam)
            const speed = Math.sqrt(target.vx * target.vx + target.vy * target.vy);
            if (speed < 1.5) {
                const angle = Math.random() * Math.PI * 2;
                target.vx = Math.cos(angle) * 2;
                target.vy = Math.sin(angle) * 2;
            }
        });
        
        // Ball-zu-Ball Kollision zwischen Targets
        for (let i = 0; i < this.targets.length; i++) {
            for (let j = i + 1; j < this.targets.length; j++) {
                const b1 = this.targets[i];
                const b2 = this.targets[j];
                
                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = b1.radius + b2.radius;
                
                if (distance < minDist && distance > 0) {
                    // Kollision! Elastischer Stoß
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);
                    
                    // Rotiere Geschwindigkeiten
                    const vx1 = b1.vx * cos + b1.vy * sin;
                    const vy1 = b1.vy * cos - b1.vx * sin;
                    const vx2 = b2.vx * cos + b2.vy * sin;
                    const vy2 = b2.vy * cos - b2.vx * sin;
                    
                    // Elastischer Stoß (vereinfacht - gleiche Masse)
                    const m1 = b1.mass || b1.radius;
                    const m2 = b2.mass || b2.radius;
                    const vx1Final = ((m1 - m2) * vx1 + 2 * m2 * vx2) / (m1 + m2);
                    const vx2Final = ((m2 - m1) * vx2 + 2 * m1 * vx1) / (m1 + m2);
                    
                    // Rotiere zurück
                    b1.vx = vx1Final * cos - vy1 * sin;
                    b1.vy = vy1 * cos + vx1Final * sin;
                    b2.vx = vx2Final * cos - vy2 * sin;
                    b2.vy = vy2 * cos + vx2Final * sin;
                    
                    // Trenne Bälle (verhindere Überlappung)
                    const overlap = minDist - distance;
                    const separationX = (dx / distance) * overlap * 0.5;
                    const separationY = (dy / distance) * overlap * 0.5;
                    
                    b1.x -= separationX;
                    b1.y -= separationY;
                    b2.x += separationX;
                    b2.y += separationY;
                }
            }
        }
    }
    
    initTargets() {
        this.targets = [];
        const targetCount = 4;
        const spacing = this.canvas.width / (targetCount + 1);
        
        // Wähle 4 verschiedene Farben aus
        const availableColors = [...this.colors];
        const selectedColors = [];
        
        for (let i = 0; i < targetCount; i++) {
            const randomIndex = Math.floor(Math.random() * availableColors.length);
            selectedColors.push(availableColors[randomIndex]);
            availableColors.splice(randomIndex, 1); // Entferne verwendete Farbe
        }
        
        for (let i = 0; i < targetCount; i++) {
            this.targets.push({
                x: spacing * (i + 1),
                y: this.targetY,
                radius: this.targetRadius,
                colorData: selectedColors[i]
            });
        }
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - this.ball.radius - 350;
        this.ball.initialY = this.ball.y;
        this.ball.vx = 0;
        this.ball.vy = 0;
        
        // Wähle eine der Ziel-Farben
        const randomTarget = this.targets[Math.floor(Math.random() * this.targets.length)];
        this.ball.colorData = randomTarget.colorData;
    }
    
    update() {
        if (!this.gameActive) return;
        
        const dtMultiplier = this.deltaTime / 16.67;
        
        // Update Lichterkette
        this.updateLights();
        
        // Ball-Physik
        if (this.ball.vy !== 0 || this.ball.vx !== 0) {
            this.ball.x += this.ball.vx * dtMultiplier;
            this.ball.y += this.ball.vy * dtMultiplier;
            
            // Schwerkraft
            this.ball.vy += 0.5 * dtMultiplier;
            
            // Seitenwände
            if (this.ball.x - this.ball.radius < 0) {
                this.ball.x = this.ball.radius;
                this.ball.vx *= -0.8;
            }
            if (this.ball.x + this.ball.radius > this.canvas.width) {
                this.ball.x = this.canvas.width - this.ball.radius;
                this.ball.vx *= -0.8;
            }
            
            // Kollision mit Zielen
            for (let i = 0; i < this.targets.length; i++) {
                const target = this.targets[i];
                const dx = this.ball.x - target.x;
                const dy = this.ball.y - target.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.ball.radius + target.radius) {
                    // Treffer!
                    if (this.ball.colorData.color === target.colorData.color) {
                        // Richtige Farbe!
                        this.score += 10;
                        document.getElementById('elf-score').textContent = this.score;
                        this.createHitParticles(target.x, target.y, target.colorData.color, true);
                        
                        // Hindernis-System: Treffer zählen
                        this.hitCounter++;
                        
                        // Treffer 5: Lichterkette erscheint (HÖHER)
                        if (this.hitCounter === 5) {
                            this.lightsObstacle.visible = true;
                            this.lightsObstacle.targetY = this.canvas.height * 0.3; // Höher
                            this.lightsObstacle.offsetX = Math.random() * (this.canvas.width - this.lightsObstacle.width);
                        }
                        // Treffer 8: Lichterkette verschwindet
                        else if (this.hitCounter === 8) {
                            this.lightsObstacle.visible = false;
                            this.lightsObstacle.offsetY = 0;
                        }
                        // Treffer 10: Wichtel erscheint
                        else if (this.hitCounter === 10) {
                            this.elf.visible = true;
                            this.elf.currentElfIndex = 0; // Nur ein Wichtel
                            this.elf.x = Math.random() * (this.canvas.width - this.elf.size * 2) + this.elf.size;
                            this.elf.y = this.canvas.height * 0.25 + Math.random() * this.canvas.height * 0.2;
                            this.setElfTarget();
                        }
                        // Treffer 15: Wichtel verschwindet
                        else if (this.hitCounter === 15) {
                            this.elf.visible = false;
                        }
                        // Treffer 20: Ziel-Bälle beginnen sich zu bewegen
                        else if (this.hitCounter === 20) {
                            this.activateBallPhysics();
                        }
                        
                        // Neues Ziel mit anderer Farbe (nicht bei anderen Zielen vorhanden)
                        const usedColors = this.targets.map(t => t.colorData.color);
                        const availableColors = this.colors.filter(c => !usedColors.includes(c.color));
                        
                        let newColorData;
                        if (availableColors.length > 0) {
                            newColorData = availableColors[Math.floor(Math.random() * availableColors.length)];
                        } else {
                            // Falls alle Farben verwendet, wähle eine die nicht die aktuelle ist
                            do {
                                newColorData = this.colors[Math.floor(Math.random() * this.colors.length)];
                            } while (newColorData.color === target.colorData.color && this.colors.length > 1);
                        }
                        
                        target.colorData = newColorData;
                    } else {
                        // Falsche Farbe! - Starte Fehltreffer-Animation
                        this.missAnimation.active = true;
                        this.missAnimation.startTime = Date.now();
                        this.missAnimation.x = target.x;
                        this.missAnimation.y = target.y;
                        
                        this.lives--;
                        document.getElementById('elf-lives').textContent = this.lives;
                        this.createHitParticles(target.x, target.y, this.ball.colorData.color, false);
                        
                        if (this.lives <= 0) {
                            this.gameOver();
                            return;
                        }
                    }
                    
                    // Reset Ball
                    this.resetBall();
                    return;
                }
            }
            
            // Kollision mit Lichterkette
            if (this.lightsObstacle.visible) {
                // Berechne welche Lichter im sichtbaren Bereich sind
                const startX = this.lightsObstacle.offsetX;
                const endX = startX + this.lightsObstacle.width;
                
                this.lights.forEach(light => {
                    // Nur Lichter im sichtbaren Bereich prüfen
                    if (light.x >= startX && light.x <= endX) {
                        const adjustedY = light.y + this.lightsObstacle.offsetY;
                        const dx = this.ball.x - light.x;
                        const dy = this.ball.y - adjustedY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const collisionDist = this.ball.radius + light.size * 2;
                        
                        if (distance < collisionDist) {
                            // Ball prallt von Licht ab
                            const angle = Math.atan2(dy, dx);
                            this.ball.vx = Math.cos(angle) * 8;
                            this.ball.vy = Math.sin(angle) * 8;
                        }
                    }
                });
            }
            
            // Ball fällt aus dem Bildschirm
            if (this.ball.y - this.ball.radius > this.canvas.height) {
                // Starte Fehltreffer-Animation unten am Bildschirm
                this.missAnimation.active = true;
                this.missAnimation.startTime = Date.now();
                this.missAnimation.x = this.ball.x;
                this.missAnimation.y = this.canvas.height - 80;
                
                this.lives--;
                document.getElementById('elf-lives').textContent = this.lives;
                
                if (this.lives <= 0) {
                    this.gameOver();
                    return;
                }
                
                this.resetBall();
            }
        }
        
        // Lichterkette als Hindernis bewegen
        if (this.lightsObstacle.visible) {
            // Bewege Lichterkette nach unten zur Zielposition
            const diffY = this.lightsObstacle.targetY - this.lightsObstacle.offsetY;
            if (Math.abs(diffY) > 2) {
                this.lightsObstacle.offsetY += Math.sign(diffY) * this.lightsObstacle.speed * dtMultiplier;
            } else {
                this.lightsObstacle.offsetY = this.lightsObstacle.targetY;
            }
            
            // Bewege Lichterkette horizontal (wie Mauer)
            this.lightsObstacle.offsetX += this.lightsObstacle.moveSpeed * this.lightsObstacle.direction * dtMultiplier;
            
            // Richtung umkehren an den Rändern
            if (this.lightsObstacle.offsetX <= 0) {
                this.lightsObstacle.offsetX = 0;
                this.lightsObstacle.direction = 1;
            }
            if (this.lightsObstacle.offsetX + this.lightsObstacle.width >= this.canvas.width) {
                this.lightsObstacle.offsetX = this.canvas.width - this.lightsObstacle.width;
                this.lightsObstacle.direction = -1;
            }
        }
        
        // Elf bewegen
        if (this.elf.visible) {
            // Bewegung zum Zielpunkt
            const dx = this.elf.targetX - this.elf.x;
            const dy = this.elf.targetY - this.elf.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                // Neues Ziel erreicht, wähle neues
                this.setElfTarget();
            } else {
                // Bewege zum Ziel
                this.elf.vx = (dx / distance) * 1.5;
                this.elf.vy = (dy / distance) * 1.5;
                this.elf.x += this.elf.vx * dtMultiplier;
                this.elf.y += this.elf.vy * dtMultiplier;
            }
            
            // Kollision mit Ball (nur auf sichtbaren Elf-Bereich - 60% der Größe)
            const ballDx = this.ball.x - this.elf.x;
            const ballDy = this.ball.y - this.elf.y;
            const ballDist = Math.sqrt(ballDx * ballDx + ballDy * ballDy);
            const elfHitboxRadius = this.elf.size * 0.6; // Kleinere Hitbox
            
            if (ballDist < this.ball.radius + elfHitboxRadius) {
                // Ball prallt vom Elf ab
                const angle = Math.atan2(ballDy, ballDx);
                this.ball.vx = Math.cos(angle) * 8;
                this.ball.vy = Math.sin(angle) * 8;
            }
        }
        
        // Ziel-Bälle mit Physik aktualisieren (ab Treffer 20)
        if (this.ballPhysicsActive) {
            this.updateTargetPhysics(this.deltaTime);
        }
        
        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dtMultiplier;
            p.y += p.vy * dtMultiplier;
            p.vy += 0.3 * dtMultiplier;
            p.life -= 0.02 * dtMultiplier;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    drawGlassBall(x, y, radius, color) {
        this.ctx.save();
        
        // Farbiger Schweif (Orbit-Ring)
        const time = Date.now() / 1000;
        const orbitRadius = radius * 1.4;
        
        // Leuchtender Schweif mit mehreren Ringen
        for (let i = 0; i < 3; i++) {
            const offset = i * 0.2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, orbitRadius - i * 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = this.hexToRgba(color, 0.15 - i * 0.05);
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        // Rotierende Partikel im Orbit
        for (let i = 0; i < 5; i++) {
            const angle = (time + i * 0.4) * 2;
            const px = x + Math.cos(angle) * orbitRadius;
            const py = y + Math.sin(angle) * orbitRadius;
            
            const particleGradient = this.ctx.createRadialGradient(px, py, 0, px, py, 6);
            particleGradient.addColorStop(0, this.hexToRgba(color, 0.8));
            particleGradient.addColorStop(1, this.hexToRgba(color, 0));
            
            this.ctx.fillStyle = particleGradient;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Schatten der Kugel
        this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 10;
        
        // Basis-Kreis (Glaskugel Hintergrund) - KRÄFTIGERE FARBE
        const baseGradient = this.ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, radius * 0.1,
            x, y, radius
        );
        baseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        baseGradient.addColorStop(0.5, this.hexToRgba(color, 0.6));  // Stärker
        baseGradient.addColorStop(1, this.hexToRgba(color, 0.8));    // Viel stärker
        
        this.ctx.fillStyle = baseGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowColor = 'transparent';
        
        // Glanz-Highlight (oben links)
        const highlightGradient = this.ctx.createRadialGradient(
            x - radius * 0.4, y - radius * 0.4, 0,
            x - radius * 0.4, y - radius * 0.4, radius * 0.6
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = highlightGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Frostiger Rand-Effekt
        const frostGradient = this.ctx.createRadialGradient(x, y, radius * 0.7, x, y, radius);
        frostGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        frostGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
        frostGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        
        this.ctx.fillStyle = frostGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // DICKER farbiger Rand (besser sichtbar)
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.hexToRgba(color, 0.95);  // Fast undurchsichtig
        this.ctx.lineWidth = 4;  // Dicker
        this.ctx.stroke();
        
        // Innerer Glow
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    initLights() {
        // Erstelle Lichterkette entlang einer Wellenform
        const lightCount = 25;
        const lightColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFA07A', '#98D8C8'];
        
        for (let i = 0; i < lightCount; i++) {
            this.lights.push({
                x: (i / (lightCount - 1)) * this.canvas.width,
                baseY: 50,
                amplitude: 30,
                frequency: 0.5,
                phase: (i / lightCount) * Math.PI * 2,
                color: lightColors[i % lightColors.length],
                brightness: Math.random(),
                pulseSpeed: 0.02 + Math.random() * 0.03,
                size: 6 + Math.random() * 4
            });
        }
    }
    
    updateLights() {
        const time = Date.now() / 1000;
        this.lights.forEach(light => {
            // Wellenförmige Bewegung
            light.y = light.baseY + Math.sin(time * light.frequency + light.phase) * light.amplitude;
            
            // Pulsierendes Leuchten
            light.brightness = 0.5 + Math.sin(time * light.pulseSpeed * Math.PI * 2) * 0.5;
        });
    }
    
    drawLights() {
        this.ctx.save();
        
        // Zeichne nur den sichtbaren Teil der Lichterkette
        const yOffset = this.lightsObstacle.offsetY;
        const xOffset = this.lightsObstacle.offsetX;
        const startX = xOffset;
        const endX = xOffset + this.lightsObstacle.width;
        
        // Zeichne Verbindungskabel nur für sichtbaren Bereich
        this.ctx.beginPath();
        let firstPoint = true;
        
        this.lights.forEach(light => {
            if (light.x >= startX && light.x <= endX) {
                if (firstPoint) {
                    this.ctx.moveTo(light.x, light.y + yOffset);
                    firstPoint = false;
                } else {
                    this.ctx.lineTo(light.x, light.y + yOffset);
                }
            }
        });
        
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Zeichne nur Lichter im sichtbaren Bereich
        this.lights.forEach(light => {
            if (light.x < startX || light.x > endX) return;
            
            const adjustedY = light.y + yOffset;
            // Glow-Effekt
            const glowSize = light.size * (2 + light.brightness);
            const glowGradient = this.ctx.createRadialGradient(
                light.x, adjustedY, 0,
                light.x, adjustedY, glowSize
            );
            glowGradient.addColorStop(0, this.hexToRgba(light.color, light.brightness * 0.8));
            glowGradient.addColorStop(0.5, this.hexToRgba(light.color, light.brightness * 0.4));
            glowGradient.addColorStop(1, this.hexToRgba(light.color, 0));
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(light.x, adjustedY, glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Lichtkern
            const coreGradient = this.ctx.createRadialGradient(
                light.x - light.size * 0.3, adjustedY - light.size * 0.3, 0,
                light.x, adjustedY, light.size
            );
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            coreGradient.addColorStop(0.3, this.hexToRgba(light.color, 1));
            coreGradient.addColorStop(1, this.hexToRgba(light.color, 0.8));
            
            this.ctx.fillStyle = coreGradient;
            this.ctx.beginPath();
            this.ctx.arc(light.x, adjustedY, light.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Glanz-Highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(light.x - light.size * 0.3, adjustedY - light.size * 0.3, light.size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    drawMissAnimation() {
        if (!this.missAnimation.active) return;
        
        const elapsed = Date.now() - this.missAnimation.startTime;
        const progress = elapsed / this.missAnimation.duration;
        
        if (progress >= 1) {
            this.missAnimation.active = false;
            return;
        }
        
        // Roter Blitz-Effekt mit Fade-out
        const alpha = 1 - progress;
        const size = 60 + progress * 40;
        
        this.ctx.save();
        this.ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        
        // Rotes X (erste Linie)
        this.ctx.beginPath();
        this.ctx.moveTo(this.missAnimation.x - size/2, this.missAnimation.y - size/2);
        this.ctx.lineTo(this.missAnimation.x + size/2, this.missAnimation.y + size/2);
        this.ctx.stroke();
        
        // Rotes X (zweite Linie)
        this.ctx.beginPath();
        this.ctx.moveTo(this.missAnimation.x + size/2, this.missAnimation.y - size/2);
        this.ctx.lineTo(this.missAnimation.x - size/2, this.missAnimation.y + size/2);
        this.ctx.stroke();
        
        // Roter Kreis drumherum
        this.ctx.beginPath();
        this.ctx.arc(this.missAnimation.x, this.missAnimation.y, size/2, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(255, 50, 50, ${alpha * 0.6})`;
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    createHitParticles(x, y, color, isSuccess) {
        const count = isSuccess ? 20 : 10;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 5 + 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: Math.random() * 4 + 2,
                life: 1,
                color: isSuccess ? color : '#FFFFFF'
            });
        }
    }
    
    render() {
        // Hintergrund
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a237e');
        gradient.addColorStop(0.5, '#283593');
        gradient.addColorStop(1, '#3949ab');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Ziel-Kreise mit Glassmorphismus
        this.targets.forEach(target => {
            this.drawGlassBall(target.x, target.y, target.radius, target.colorData.color);
            
            // Zeichne Symbol in der Mitte (GROSS und KONTRASTREICH)
            this.ctx.save();
            this.ctx.font = `bold ${target.radius * 1.2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Weißer Schatten für Kontrast
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
            this.ctx.shadowBlur = 8;
            this.ctx.fillStyle = '#000';
            this.ctx.fillText(target.colorData.symbol, target.x, target.y);
            
            // Zweite Schicht weiß
            this.ctx.shadowBlur = 4;
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillText(target.colorData.symbol, target.x, target.y);
            this.ctx.restore();
        });
        
        // Reset Shadow
        this.ctx.shadowColor = 'transparent';
        
        // Zeichne Fehltreffer-Animation
        this.drawMissAnimation();
        
        // Lichterkette als Hindernis
        if (this.lightsObstacle.visible) {
            this.drawLights();
        }
        
        // Elf-Hindernis
        if (this.elf.visible) {
            const size = this.elf.size;
            
            // Schatten
            this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 5;
            
            // Zeichne Wichtel aus WebP-Datei (mit Transparenz)
            const imageLoaded = this.elfImage.complete && this.elfImage.naturalWidth > 0;
            
            if (imageLoaded) {
                // Leichtes Schweben (Sinus-Bewegung)
                const hover = Math.sin(Date.now() / 500) * 5;
                
                // Zeichne Wichtel direkt (WebP hat bereits Transparenz)
                this.ctx.drawImage(
                    this.elfImage,
                    this.elf.x - size,
                    this.elf.y - size + hover,
                    size * 2,
                    size * 2
                );
            } else {
                // Fallback: einfacher Elf
                this.ctx.fillStyle = '#FF4444';
                this.ctx.beginPath();
                this.ctx.arc(this.elf.x, this.elf.y, size * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Mütze
                this.ctx.fillStyle = '#44FF44';
                this.ctx.beginPath();
                this.ctx.moveTo(this.elf.x - size * 0.4, this.elf.y - size * 0.3);
                this.ctx.lineTo(this.elf.x, this.elf.y - size * 0.8);
                this.ctx.lineTo(this.elf.x + size * 0.4, this.elf.y - size * 0.3);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            this.ctx.shadowColor = 'transparent';
        }
        
        // Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Ball
        if (this.isDragging) {
            // Zeige Drag-Linie von Startpunkt zum Ball
            const dragY = Math.max(0, Math.min(this.touchCurrentY - this.touchStartY, this.ball.maxDragDistance));
            
            // Linie vom Startpunkt (initialY) zum aktuellen Ball
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.ball.x, this.ball.initialY);
            this.ctx.lineTo(this.ball.x, this.ball.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Pfeil/Richtungslinie für seitliche Bewegung - exakt wie Schuss berechnet
            const dragX = this.touchCurrentX - this.touchStartX;
            const limitedDragY = Math.min(dragY, this.ball.maxDragDistance);
            const shootPower = limitedDragY / this.ball.maxDragDistance;
            const maxSpeed = 50;
            
            // Berechne tatsächliche Geschwindigkeiten (wie in shoot())
            const vx = -(dragX / 60) * maxSpeed * shootPower;
            const vy = -maxSpeed * shootPower;
            
            if (Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5) {
                this.ctx.strokeStyle = 'rgba(255, 200, 50, 0.8)';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([10, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(this.ball.x, this.ball.y);
                // Zeige Flugbahn (multipliziert für bessere Sichtbarkeit)
                this.ctx.lineTo(this.ball.x + vx * 8, this.ball.y + vy * 8);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            
            // Kraftanzeige
            const power = dragY / this.ball.maxDragDistance;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${power * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius + 10 + power * 20, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Zeichne Ball mit Glassmorphismus
        this.drawGlassBall(this.ball.x, this.ball.y, this.ball.radius, this.ball.colorData.color);
        
        // Zeichne Symbol auf dem Ball (GROSS und KONTRASTREICH)
        this.ctx.save();
        this.ctx.font = `bold ${this.ball.radius * 1.2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Weißer Schatten für Kontrast
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(this.ball.colorData.symbol, this.ball.x, this.ball.y);
        
        // Zweite Schicht weiß
        this.ctx.shadowBlur = 4;
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillText(this.ball.colorData.symbol, this.ball.x, this.ball.y);
        this.ctx.restore();
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameActive) return;
        
        // Delta Time berechnen
        if (this.lastFrameTime === 0) {
            this.lastFrameTime = currentTime;
        }
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        if (this.deltaTime > 100) {
            this.deltaTime = 16.67;
        }
        
        this.update();
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    async gameOver() {
        this.gameActive = false;
        
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Stats speichern
        await window.statsManager.saveStats('feeding-elf', this.score, playTime);
        
        // Game Over Overlay
        setTimeout(() => {
            this.showGameOverScreen(this.score, playTime);
        }, 500);
    }
    
    async showGameOverScreen(score, playTime) {
        const overlay = document.createElement('div');
        overlay.className = 'username-overlay';
        overlay.innerHTML = `
            <div class="username-dialog" style="max-width: 500px;">
                <h2>🎯 Game Over! 🎄</h2>
                <div style="margin: 30px 0; font-size: 24px;">
                    <p style="margin: 10px 0;">
                        <span style="font-size: 32px;">🎯</span>
                        <strong>${score}</strong> Punkte
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
        const highscores = await window.statsManager.getHighscores('feeding-elf', 3);
        const container = document.getElementById('highscore-list-container');
        
        if (highscores && highscores.length > 0) {
            container.innerHTML = `
                <h3 style="margin-bottom: 15px;">🏆 Top 3 Highscores</h3>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.1); border-radius: 10px; padding: 10px;">
                    ${highscores.map((entry, index) => `
                        <div style="display: flex; justify-content: space-between; padding: 8px; margin: 5px 0; background: ${entry.username === window.statsManager.username ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.1)'}; border-radius: 5px;">
                            <span><strong>${index + 1}.</strong> ${entry.username}</span>
                            <span><strong>${entry.highscore}</strong> 🎯</span>
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
