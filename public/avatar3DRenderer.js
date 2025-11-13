/**
 * Avatar 3D Renderer - Canvas-basiertes 3D-Rendering
 */

class Avatar3DRenderer {
    constructor(canvasId, avatar, size = 200) {
        this.canvas = document.getElementById(canvasId) || this.createCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.avatar = avatar;
        this.size = size;
        this.rotation = { x: 0, y: 0 };
        this.animationFrame = null;
        this.isAnimating = false;
        
        this.setupCanvas();
    }
    
    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.className = 'avatar-3d-canvas';
        return canvas;
    }
    
    setupCanvas() {
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.width = this.size + 'px';
        this.canvas.style.height = this.size + 'px';
    }
    
    /**
     * Render Avatar mit 3D-Effekt
     */
    render() {
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        // Speichere Context-State
        this.ctx.save();
        
        // Zentriere Transformation
        this.ctx.translate(this.size / 2, this.size / 2);
        
        // 3D-Rotation simulieren
        const scaleX = Math.cos(this.rotation.y);
        const scaleY = Math.cos(this.rotation.x);
        
        this.ctx.scale(scaleX, scaleY);
        this.ctx.translate(-this.size / 2, -this.size / 2);
        
        // Render Avatar-Layers von hinten nach vorne
        this.renderShadow();
        this.renderFeet();
        this.renderBody();
        this.renderFace();
        this.renderHead();
        this.renderHighlights();
        
        this.ctx.restore();
    }
    
    /**
     * Schatten rendern
     */
    renderShadow() {
        const gradient = this.ctx.createRadialGradient(
            this.size / 2, this.size * 0.9,
            0,
            this.size / 2, this.size * 0.9,
            this.size * 0.3
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(this.size / 2, this.size * 0.9, this.size * 0.25, this.size * 0.08, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * Füße rendern (vereinfacht für 3D)
     */
    renderFeet() {
        const feetY = this.size * 0.85;
        const leftX = this.size * 0.38;
        const rightX = this.size * 0.62;
        
        // Bestimme Schuh-Farbe basierend auf Avatar
        const colors = this.getFootwearColors(this.avatar.feet);
        
        // Linker Schuh mit 3D-Effekt
        this.draw3DShoe(leftX, feetY, colors, -5);
        
        // Rechter Schuh mit 3D-Effekt
        this.draw3DShoe(rightX, feetY, colors, 5);
    }
    
    draw3DShoe(x, y, colors, angle) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle * Math.PI / 180);
        
        // Schatten
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 5, 18, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Schuh-Hauptform
        this.ctx.fillStyle = colors.main;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Highlight
        const gradient = this.ctx.createLinearGradient(-10, -5, 10, 5);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(-3, -2, 8, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Details
        this.ctx.strokeStyle = colors.detail;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(-12, 0);
        this.ctx.lineTo(12, 0);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * Körper rendern mit 3D-Shading
     */
    renderBody() {
        const colors = this.getBodyColors(this.avatar.body);
        const centerX = this.size / 2;
        const bodyTop = this.size * 0.52;
        const bodyBottom = this.size * 0.82;
        const bodyWidth = this.size * 0.35;
        
        // Körper-Form (Torso)
        this.ctx.fillStyle = colors.main;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - bodyWidth / 2, bodyTop);
        this.ctx.bezierCurveTo(
            centerX - bodyWidth / 2 - 10, bodyTop + 20,
            centerX - bodyWidth / 2 - 5, bodyBottom - 10,
            centerX - bodyWidth / 3, bodyBottom
        );
        this.ctx.lineTo(centerX + bodyWidth / 3, bodyBottom);
        this.ctx.bezierCurveTo(
            centerX + bodyWidth / 2 + 5, bodyBottom - 10,
            centerX + bodyWidth / 2 + 10, bodyTop + 20,
            centerX + bodyWidth / 2, bodyTop
        );
        this.ctx.closePath();
        this.ctx.fill();
        
        // 3D-Shading (links dunkel, rechts hell)
        const shadingGradient = this.ctx.createLinearGradient(
            centerX - bodyWidth / 2, bodyTop,
            centerX + bodyWidth / 2, bodyTop
        );
        shadingGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        shadingGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
        shadingGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
        shadingGradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        
        this.ctx.fillStyle = shadingGradient;
        this.ctx.fill();
        
        // Arme
        this.renderArm(centerX - bodyWidth / 2 - 5, bodyTop + 15, 'left', colors.main);
        this.renderArm(centerX + bodyWidth / 2 + 5, bodyTop + 15, 'right', colors.main);
        
        // Details/Muster
        this.renderBodyDetails(centerX, bodyTop, bodyWidth, colors);
    }
    
    renderArm(x, y, side, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        
        if (side === 'left') {
            this.ctx.beginPath();
            this.ctx.ellipse(x - 5, y + 20, 8, 25, -0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Schatten
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(x - 7, y + 25, 6, 20, -0.3, 0, Math.PI);
            this.ctx.fill();
        } else {
            this.ctx.beginPath();
            this.ctx.ellipse(x + 5, y + 20, 8, 25, 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight
            const gradient = this.ctx.createLinearGradient(x, y, x + 10, y + 40);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.ellipse(x + 7, y + 20, 5, 20, 0.3, 0, Math.PI);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderBodyDetails(centerX, bodyTop, bodyWidth, colors) {
        if (colors.pattern === 'stripes') {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                const y = bodyTop + 20 + (i * 15);
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - bodyWidth / 3, y);
                this.ctx.lineTo(centerX + bodyWidth / 3, y);
                this.ctx.stroke();
            }
        } else if (colors.pattern === 'logo') {
            this.ctx.fillStyle = colors.detail;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(colors.logoText || '★', centerX, bodyTop + 35);
        }
    }
    
    /**
     * Gesicht rendern mit 3D-Features
     */
    renderFace() {
        const centerX = this.size / 2;
        const centerY = this.size * 0.4;
        const faceRadius = this.size * 0.2;
        
        const colors = this.getFaceColors(this.avatar.face);
        
        // Gesichts-Kreis mit Gradient für 3D-Effekt
        const faceGradient = this.ctx.createRadialGradient(
            centerX - 10, centerY - 10, 0,
            centerX, centerY, faceRadius
        );
        faceGradient.addColorStop(0, colors.highlight);
        faceGradient.addColorStop(0.7, colors.skin);
        faceGradient.addColorStop(1, colors.shadow);
        
        this.ctx.fillStyle = faceGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, faceRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wangen-Highlights
        if (colors.hasBlush) {
            this.ctx.fillStyle = 'rgba(255, 182, 193, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(centerX - faceRadius * 0.6, centerY + 10, 12, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(centerX + faceRadius * 0.6, centerY + 10, 12, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Gesichtszüge basierend auf Type
        this.renderFacialFeatures(centerX, centerY, faceRadius, this.avatar.face);
    }
    
    renderFacialFeatures(centerX, centerY, faceRadius, faceType) {
        if (faceType.includes('cool') || faceType.includes('tough')) {
            // Sonnenbrille
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            this.ctx.beginPath();
            this.ctx.rect(centerX - 30, centerY - 10, 25, 15);
            this.ctx.rect(centerX + 5, centerY - 10, 25, 15);
            this.ctx.fill();
            
            // Brillengestell
            this.ctx.strokeStyle = '#1a1a1a';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 5, centerY - 3);
            this.ctx.lineTo(centerX + 5, centerY - 3);
            this.ctx.stroke();
            
            // Reflexion
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.beginPath();
            this.ctx.rect(centerX - 25, centerY - 8, 8, 4);
            this.ctx.rect(centerX + 10, centerY - 8, 8, 4);
            this.ctx.fill();
        } else {
            // Normale Augen
            const eyeY = centerY - 5;
            const eyeSize = faceType.includes('kawaii') ? 7 : 5;
            
            // Linkes Auge
            this.ctx.fillStyle = '#2c1810';
            this.ctx.beginPath();
            this.ctx.arc(centerX - 15, eyeY, eyeSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Rechtes Auge (oder Zwinkern)
            if (faceType.includes('wink')) {
                this.ctx.strokeStyle = '#2c1810';
                this.ctx.lineWidth = 2;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(centerX + 15, eyeY, eyeSize, 0.2, Math.PI - 0.2);
                this.ctx.stroke();
            } else {
                this.ctx.beginPath();
                this.ctx.arc(centerX + 15, eyeY, eyeSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Augen-Highlights
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(centerX - 17, eyeY - 2, 2, 0, Math.PI * 2);
            this.ctx.fill();
            if (!faceType.includes('wink')) {
                this.ctx.beginPath();
                this.ctx.arc(centerX + 13, eyeY - 2, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Mund
        this.renderMouth(centerX, centerY + 15, faceType);
    }
    
    renderMouth(centerX, mouthY, faceType) {
        this.ctx.strokeStyle = faceType.includes('cutie') || faceType.includes('kawaii') ? '#ff69b4' : '#2c1810';
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        if (faceType.includes('smirk')) {
            this.ctx.moveTo(centerX - 15, mouthY);
            this.ctx.quadraticCurveTo(centerX, mouthY + 5, centerX + 10, mouthY - 2);
        } else if (faceType.includes('tough')) {
            this.ctx.moveTo(centerX - 15, mouthY);
            this.ctx.lineTo(centerX + 15, mouthY);
        } else {
            // Lächeln
            this.ctx.moveTo(centerX - 15, mouthY);
            this.ctx.quadraticCurveTo(centerX, mouthY + 10, centerX + 15, mouthY);
        }
        this.ctx.stroke();
    }
    
    /**
     * Kopfbedeckung rendern
     */
    renderHead() {
        const colors = this.getHeadColors(this.avatar.head);
        const centerX = this.size / 2;
        const hatY = this.size * 0.23;
        
        if (this.avatar.head === 'snapback' || this.avatar.head === 'cap-cool') {
            this.renderCap(centerX, hatY, colors);
        } else if (this.avatar.head === 'hoodie') {
            this.renderHoodie(centerX, hatY, colors);
        } else if (this.avatar.head.includes('bow')) {
            this.renderBow(centerX, hatY, colors);
        } else if (this.avatar.head === 'tiara') {
            this.renderTiara(centerX, hatY, colors);
        } else if (this.avatar.head.includes('bunny')) {
            this.renderBunnyEars(centerX, hatY, colors);
        } else {
            this.renderGenericHat(centerX, hatY, colors);
        }
    }
    
    renderCap(centerX, hatY, colors) {
        // Schirm
        this.ctx.fillStyle = colors.main;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 20, hatY + 15, 35, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Schirm-Schatten
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 25, hatY + 17, 30, 6, 0, 0, Math.PI);
        this.ctx.fill();
        
        // Cap-Hauptteil
        const capGradient = this.ctx.createLinearGradient(
            centerX - 40, hatY,
            centerX + 40, hatY
        );
        capGradient.addColorStop(0, colors.shadow);
        capGradient.addColorStop(0.5, colors.main);
        capGradient.addColorStop(1, colors.highlight);
        
        this.ctx.fillStyle = capGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, hatY + 10, 40, 15, 0, Math.PI, Math.PI * 2);
        this.ctx.quadraticCurveTo(centerX, hatY - 10, centerX, hatY + 10);
        this.ctx.fill();
        
        // Logo/Detail
        this.ctx.fillStyle = colors.detail;
        this.ctx.fillRect(centerX - 8, hatY + 5, 16, 8);
    }
    
    renderBow(centerX, hatY, colors) {
        // Linke Schleife
        this.ctx.fillStyle = colors.main;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - 20, hatY, 18, 12, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rechte Schleife
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 20, hatY, 18, 12, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Mitte
        this.ctx.fillStyle = colors.detail;
        this.ctx.beginPath();
        this.ctx.arc(centerX, hatY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Highlights
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - 23, hatY - 3, 8, 5, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 23, hatY - 3, 8, 5, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderTiara(centerX, hatY, colors) {
        this.ctx.strokeStyle = colors.main;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 35, hatY + 10);
        this.ctx.lineTo(centerX - 25, hatY - 5);
        this.ctx.lineTo(centerX - 15, hatY + 5);
        this.ctx.lineTo(centerX, hatY - 15);
        this.ctx.lineTo(centerX + 15, hatY + 5);
        this.ctx.lineTo(centerX + 25, hatY - 5);
        this.ctx.lineTo(centerX + 35, hatY + 10);
        this.ctx.stroke();
        
        // Juwelen
        this.ctx.fillStyle = colors.detail;
        [[-25, hatY - 5], [0, hatY - 15], [25, hatY - 5]].forEach(([x, y]) => {
            this.ctx.beginPath();
            this.ctx.arc(centerX + x, y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Glanz
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(centerX + x - 2, y - 2, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = colors.detail;
        });
    }
    
    renderBunnyEars(centerX, hatY, colors) {
        // Linkes Ohr
        this.ctx.fillStyle = colors.main;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - 20, hatY - 20, 8, 25, -0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Innenohr links
        this.ctx.fillStyle = colors.detail;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - 20, hatY - 20, 4, 18, -0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rechtes Ohr
        this.ctx.fillStyle = colors.main;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 20, hatY - 20, 8, 25, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Innenohr rechts
        this.ctx.fillStyle = colors.detail;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 20, hatY - 20, 4, 18, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderGenericHat(centerX, hatY, colors) {
        // Santa Hat als Fallback
        const hatGradient = this.ctx.createLinearGradient(
            centerX - 35, hatY,
            centerX + 35, hatY + 20
        );
        hatGradient.addColorStop(0, colors.shadow);
        hatGradient.addColorStop(0.5, colors.main);
        hatGradient.addColorStop(1, colors.highlight);
        
        this.ctx.fillStyle = hatGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 35, hatY + 15);
        this.ctx.quadraticCurveTo(centerX, hatY - 20, centerX + 30, hatY + 15);
        this.ctx.fill();
        
        // Bommel
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(centerX + 30, hatY + 5, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rand
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, hatY + 15, 35, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderHoodie(centerX, hatY, colors) {
        this.ctx.fillStyle = colors.main;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, hatY + 12, 42, 15, 0, Math.PI, Math.PI * 2);
        this.ctx.quadraticCurveTo(centerX, hatY - 15, centerX, hatY + 12);
        this.ctx.fill();
        
        // Hoodie-Schatten
        const hoodieGradient = this.ctx.createRadialGradient(
            centerX, hatY, 0,
            centerX, hatY + 12, 42
        );
        hoodieGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        hoodieGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = hoodieGradient;
        this.ctx.fill();
        
        // Kordel
        this.ctx.strokeStyle = colors.detail;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 10, hatY + 5);
        this.ctx.lineTo(centerX - 10, hatY + 15);
        this.ctx.moveTo(centerX + 10, hatY + 5);
        this.ctx.lineTo(centerX + 10, hatY + 15);
        this.ctx.stroke();
    }
    
    /**
     * Highlights und Glanzeffekte
     */
    renderHighlights() {
        // Generelle Licht-Highlights für 3D-Effekt
        const centerX = this.size / 2;
        const centerY = this.size * 0.4;
        
        const highlightGradient = this.ctx.createRadialGradient(
            centerX - 30, centerY - 40, 0,
            centerX, centerY, this.size * 0.6
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fillRect(0, 0, this.size, this.size);
    }
    
    /**
     * Farb-Helper-Funktionen
     */
    getFootwearColors(type) {
        const colors = {
            'sneakers-white': { main: '#ffffff', detail: '#1a1a1a' },
            'sneakers-black': { main: '#1a1a1a', detail: '#ffffff' },
            'boots-cool': { main: '#2c2c2c', detail: '#444' },
            'jordans': { main: '#c41e3a', detail: '#1a1a1a' },
            'ballet-shoes': { main: '#ffb6c1', detail: '#ff1493' },
            'cute-boots': { main: '#ff69b4', detail: '#fff' },
            'sparkle-sneakers': { main: '#da70d6', detail: '#ff69b4' },
            'bunny-slippers': { main: '#ffb6c1', detail: '#ff69b4' }
        };
        return colors[type] || { main: '#1a1a1a', detail: '#fff' };
    }
    
    getBodyColors(type) {
        const colors = {
            'hoodie-black': { main: '#1a1a1a', detail: '#3a3a3a', pattern: 'none' },
            'leather-jacket': { main: '#2c2c2c', detail: '#888', pattern: 'none' },
            'sporty-shirt': { main: '#ffffff', detail: '#c41e3a', pattern: 'logo', logoText: '✓' },
            'street-style': { main: '#ffd700', detail: '#1a1a1a', pattern: 'logo', logoText: 'KING' },
            'dress-pink': { main: '#ff69b4', detail: '#fff', pattern: 'dots' },
            'cute-sweater': { main: '#ffb6c1', detail: '#ff69b4', pattern: 'none' },
            'unicorn-shirt': { main: '#ffffff', detail: '#da70d6', pattern: 'logo', logoText: '🦄' },
            'heart-top': { main: '#ff69b4', detail: '#fff', pattern: 'heart' }
        };
        return colors[type] || { main: '#c41e3a', detail: '#fff', pattern: 'stripes' };
    }
    
    getFaceColors(type) {
        const isCutie = type.includes('kawaii') || type.includes('sweet') || type.includes('sparkle') || type.includes('cute');
        
        return {
            skin: isCutie ? '#ffe6f0' : '#ffdbac',
            highlight: isCutie ? '#fff0f5' : '#ffe8c5',
            shadow: isCutie ? '#ffd1dc' : '#e8c4a0',
            hasBlush: isCutie
        };
    }
    
    getHeadColors(type) {
        const colorMap = {
            'snapback': { main: '#1a1a1a', detail: '#ffd700', shadow: '#000', highlight: '#2c2c2c' },
            'hoodie': { main: '#2c2c2c', detail: '#666', shadow: '#1a1a1a', highlight: '#3a3a3a' },
            'cap-cool': { main: '#000', detail: '#fff', shadow: '#000', highlight: '#1a1a1a' },
            'bow-pink': { main: '#ff69b4', detail: '#ff1493', shadow: '#ff1493', highlight: '#ffb6c1' },
            'tiara': { main: '#ffd700', detail: '#ff69b4', shadow: '#daa520', highlight: '#ffed4e' },
            'bunny-ears': { main: '#ffb6c1', detail: '#ff69b4', shadow: '#ff69b4', highlight: '#ffc0cb' }
        };
        return colorMap[type] || { main: '#c41e3a', detail: '#fff', shadow: '#8b0000', highlight: '#ff6347' };
    }
    
    /**
     * Idle Animation
     */
    startIdleAnimation() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const animate = () => {
            this.rotation.y = Math.sin(Date.now() / 2000) * 0.1;
            this.rotation.x = Math.sin(Date.now() / 3000) * 0.05;
            this.render();
            
            if (this.isAnimating) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    /**
     * Exportiere Canvas als Image
     */
    toDataURL() {
        return this.canvas.toDataURL('image/png');
    }
    
    getCanvas() {
        return this.canvas;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Avatar3DRenderer;
}
