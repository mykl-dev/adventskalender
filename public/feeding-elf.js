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
        
        // Bilder laden
        this.wallImage = new Image();
        this.wallImage.src = '../data/img/mauer.jpg';
        this.ghostImage = new Image();
        this.ghostImage.src = '../data/img/suesser-geist.jpg';
        
        // 8 verschiedene Farben optimiert für Farbschwache mit Symbolen
        this.colors = [
            { color: '#FF0000', symbol: '●', name: 'Rot' },      // Rot - Kreis
            { color: '#0066FF', symbol: '■', name: 'Blau' },     // Blau - Quadrat
            { color: '#00CC00', symbol: '▲', name: 'Grün' },    // Grün - Dreieck
            { color: '#FFD700', symbol: '★', name: 'Gold' },     // Gold - Stern
            { color: '#FF6600', symbol: '◆', name: 'Orange' },   // Orange - Raute
            { color: '#9900FF', symbol: '✖', name: 'Lila' },     // Lila - Kreuz
            { color: '#00CCCC', symbol: '▼', name: 'Cyan' },     // Cyan - umgedrehtes Dreieck
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
        
        // Hindernis-Mauer
        this.wall = {
            visible: false,
            x: 0,
            y: 0,
            width: 0,
            height: 30,
            speed: 2,
            direction: 1
        };
        
        // Geist-Hindernis
        this.ghost = {
            visible: false,
            x: 0,
            y: 0,
            size: 40,
            vx: 0,
            vy: 0,
            targetX: 0,
            targetY: 0
        };
        
        this.hitCounter = 0; // Zählt Treffer für Hindernis-System
        
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
        this.wall.visible = false;
        this.wall.width = this.canvas.width * 0.4;
        this.wall.y = this.canvas.height * 0.3; // Höher positioniert
        this.wall.x = this.canvas.width / 2 - this.wall.width / 2;
        
        this.ghost.visible = false;
        this.ghost.x = this.canvas.width / 2;
        this.ghost.y = this.canvas.height * 0.3;
        this.setGhostTarget();
        
        this.gameLoop();
    }
    
    setGhostTarget() {
        // Wähle zufälligen Punkt im oberen Bereich
        const margin = this.ghost.size;
        this.ghost.targetX = margin + Math.random() * (this.canvas.width - margin * 2);
        this.ghost.targetY = this.canvas.height * 0.15 + Math.random() * this.canvas.height * 0.3;
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
                        const cycle = this.hitCounter % 15; // 15er Zyklus
                        
                        // Treffer 5: Mauer erscheint (1. Mal)
                        if (cycle === 5) {
                            this.wall.visible = true;
                            this.wall.x = Math.random() * (this.canvas.width - this.wall.width);
                            this.ghost.visible = false;
                        }
                        // Treffer 6: Mauer verschwindet
                        else if (cycle === 6) {
                            this.wall.visible = false;
                        }
                        // Treffer 10: Mauer erscheint (2. Mal)
                        else if (cycle === 10) {
                            this.wall.visible = true;
                            this.wall.x = Math.random() * (this.canvas.width - this.wall.width);
                            this.ghost.visible = false;
                        }
                        // Treffer 11: Mauer verschwindet
                        else if (cycle === 11) {
                            this.wall.visible = false;
                        }
                        // Treffer 15 (oder 0): Geist erscheint (3. Mal) und bleibt 5 Treffer
                        else if (cycle === 0) {
                            this.ghost.visible = true;
                            this.ghost.x = Math.random() * (this.canvas.width - this.ghost.size * 2) + this.ghost.size;
                            this.ghost.y = this.canvas.height * 0.25 + Math.random() * this.canvas.height * 0.2;
                            this.setGhostTarget();
                            this.wall.visible = false;
                        }
                        // Treffer 6 (= Treffer 21, 36, 51...): Geist verschwindet nach 5 Treffern
                        else if (cycle === 6 && this.hitCounter > 15) {
                            this.ghost.visible = false;
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
                        // Falsche Farbe!
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
            
            // Kollision mit Mauer
            if (this.wall.visible) {
                if (this.ball.x + this.ball.radius > this.wall.x && 
                    this.ball.x - this.ball.radius < this.wall.x + this.wall.width &&
                    this.ball.y + this.ball.radius > this.wall.y && 
                    this.ball.y - this.ball.radius < this.wall.y + this.wall.height) {
                    // Ball prallt von Mauer ab
                    if (this.ball.vy > 0) {
                        this.ball.y = this.wall.y - this.ball.radius;
                        this.ball.vy *= -0.7;
                    } else {
                        this.ball.y = this.wall.y + this.wall.height + this.ball.radius;
                        this.ball.vy *= -0.7;
                    }
                }
            }
            
            // Ball fällt aus dem Bildschirm
            if (this.ball.y - this.ball.radius > this.canvas.height) {
                this.lives--;
                document.getElementById('elf-lives').textContent = this.lives;
                
                if (this.lives <= 0) {
                    this.gameOver();
                    return;
                }
                
                this.resetBall();
            }
        }
        
        // Mauer bewegen
        if (this.wall.visible) {
            this.wall.x += this.wall.speed * this.wall.direction * dtMultiplier;
            
            // Richtung umkehren an den Rändern
            if (this.wall.x <= 0) {
                this.wall.x = 0;
                this.wall.direction = 1;
            }
            if (this.wall.x + this.wall.width >= this.canvas.width) {
                this.wall.x = this.canvas.width - this.wall.width;
                this.wall.direction = -1;
            }
        }
        
        // Geist bewegen
        if (this.ghost.visible) {
            // Bewegung zum Zielpunkt
            const dx = this.ghost.targetX - this.ghost.x;
            const dy = this.ghost.targetY - this.ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                // Neues Ziel erreicht, wähle neues
                this.setGhostTarget();
            } else {
                // Bewege zum Ziel
                this.ghost.vx = (dx / distance) * 1.5;
                this.ghost.vy = (dy / distance) * 1.5;
                this.ghost.x += this.ghost.vx * dtMultiplier;
                this.ghost.y += this.ghost.vy * dtMultiplier;
            }
            
            // Kollision mit Ball
            const ballDx = this.ball.x - this.ghost.x;
            const ballDy = this.ball.y - this.ghost.y;
            const ballDist = Math.sqrt(ballDx * ballDx + ballDy * ballDy);
            
            if (ballDist < this.ball.radius + this.ghost.size / 2) {
                // Ball prallt vom Geist ab
                const angle = Math.atan2(ballDy, ballDx);
                this.ball.vx = Math.cos(angle) * 8;
                this.ball.vy = Math.sin(angle) * 8;
            }
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
        
        // Ziel-Kreise
        this.targets.forEach(target => {
            // Schatten
            this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 5;
            
            this.ctx.fillStyle = target.colorData.color;
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Outline
            this.ctx.shadowColor = 'transparent';
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Symbol in der Mitte
            this.ctx.fillStyle = 'white';
            this.ctx.font = `bold ${target.radius * 0.8}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(target.colorData.symbol, target.x, target.y);
        });
        
        // Reset Shadow
        this.ctx.shadowColor = 'transparent';
        
        // Hindernis-Mauer
        if (this.wall.visible) {
            // Schatten
            this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 5;
            
            // Zeichne Mauer-Bild
            if (this.wallImage.complete) {
                this.ctx.drawImage(this.wallImage, this.wall.x, this.wall.y, this.wall.width, this.wall.height);
            } else {
                // Fallback falls Bild noch nicht geladen
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(this.wall.x, this.wall.y, this.wall.width, this.wall.height);
            }
            
            this.ctx.shadowColor = 'transparent';
        }
        
        // Geist
        if (this.ghost.visible) {
            const size = this.ghost.size;
            
            // Schatten
            this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 5;
            
            // Zeichne Geist-Bild
            if (this.ghostImage.complete) {
                // Leichtes Schweben (Sinus-Bewegung)
                const hover = Math.sin(Date.now() / 500) * 5;
                this.ctx.drawImage(
                    this.ghostImage, 
                    this.ghost.x - size, 
                    this.ghost.y - size + hover, 
                    size * 2, 
                    size * 2
                );
            } else {
                // Fallback falls Bild noch nicht geladen
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.beginPath();
                this.ctx.arc(this.ghost.x, this.ghost.y, size * 0.5, 0, Math.PI * 2);
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
        
        // Schatten
        this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 8;
        
        this.ctx.fillStyle = this.ball.colorData.color;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Outline
        this.ctx.shadowColor = 'transparent';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Symbol im Ball
        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${this.ball.radius * 0.7}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.ball.colorData.symbol, this.ball.x, this.ball.y);
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
        const highscores = await window.statsManager.getHighscores('feeding-elf', 10);
        const container = document.getElementById('highscore-list-container');
        
        if (highscores && highscores.length > 0) {
            container.innerHTML = `
                <h3 style="margin-bottom: 15px;">🏆 Top 10 Highscores</h3>
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
