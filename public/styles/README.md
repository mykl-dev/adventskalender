# 🎮 Modulares Game CSS System

## Übersicht

Alle Spiele im Adventskalender verwenden jetzt ein gemeinsames, modulares CSS-System für konsistentes Design und einfachere Wartung.

## 📁 Dateistruktur

```
public/
├── styles/
│   ├── game-base.css       # Layout (Container, Header, Stats Banner)
│   ├── game-overlays.css   # Overlays (Start, Game Over, Instructions)
│   ├── game-buttons.css    # Buttons (Back, Game Button, Pause)
│   └── game-animations.css # Animationen (Pulse, Bounce, Fade, etc.)
└── games/
    └── [spiel-name]/
        ├── [spiel-name].html
        ├── [spiel-name].js
        └── [spiel-name].css   # Nur spiel-spezifische Styles!
```

## 🎨 Module

### 1. game-base.css
Gemeinsames Layout für alle Spiele:
- **Container**: `.game-container` mit Shimmer-Effekt
- **Header**: `.game-header` mit Score-Display
- **Stats Banner**: `.stats-banner` mit `.stat-box`
- **Responsive Design**: Breakpoints bei 768px und 480px
- **CSS Variables**: Einfache Anpassung der Farben und Größen

**Hauptklassen:**
- `.game-container`
- `.game-header`
- `.stats-banner`
- `.stat-box`
- `.stat-icon`, `.stat-value`, `.stat-label`
- `.score-display`, `.score-value`

### 2. game-overlays.css
Alle Overlay-Typen:
- **Base Overlay**: `.overlay` mit Backdrop-Blur
- **Content**: `.overlay-content` mit Animation
- **Game Over**: `.overlay-title`, `.final-score`, `.score-message`
- **Highscore Table**: `.highscore-table` mit Top 3
- **Instructions**: `.instructions-content` mit Items
- **Ready Message**: `.ready-message` (für Flappy Santa)

**Hauptklassen:**
- `.overlay`, `.overlay-content`
- `.overlay-title`, `.score-message`, `.final-score`
- `.highscore-table`, `.highscore-entry`
- `.instructions-content`, `.instruction-item`
- `.ready-message`

### 3. game-buttons.css
Alle Button-Styles:
- **Back Button**: `.back-button` (Top Left, Home-Icon)
- **Game Button**: `.game-button` (Primary Action)
- **Pause Button**: `.pause-button` (Top Right)
- **Icon Buttons**: `.icon-button` (Allgemein)
- **Button Group**: `.button-group` (Mehrere Buttons)

**Varianten:**
- `.game-button.secondary` (Blau)
- `.game-button.danger` (Rot)
- `.back-button.arrow` (Pfeil statt Home)
- `.back-button.close` (X statt Home)

### 4. game-animations.css
Wiederverwendbare Animationen:
- **Pulse**: `pulse`, `pulse-warning`, `pulse-critical`
- **Bounce**: `bounce`, `bounceIn`
- **Fade**: `fadeIn`, `fadeOut`, `fadeInUp`, `fadeInDown`
- **Slide**: `slideUp`, `slideDown`, `slideLeft`, `slideRight`
- **Scale**: `scaleUp`, `scaleDown`
- **Glow**: `glow`, `glowText`
- **Special**: `shake`, `wiggle`, `float`, `shimmer`

**Utility Classes:**
- `.animate-pulse`, `.animate-bounce`, `.animate-shake`
- `.animate-glow`, `.animate-float`, `.animate-wiggle`
- `.animate-fade-in`, `.animate-slide-up`

## 🚀 Verwendung

### HTML Setup
```html
<!DOCTYPE html>
<html lang="de">
<head>
    <!-- Modulares CSS System -->
    <link rel="stylesheet" href="../styles/game-base.css">
    <link rel="stylesheet" href="../styles/game-overlays.css">
    <link rel="stylesheet" href="../styles/game-buttons.css">
    <link rel="stylesheet" href="../styles/game-animations.css">
    <link rel="stylesheet" href="dein-spiel.css">
</head>
<body>
    <!-- Back Button -->
    <a href="#" class="back-button" onclick="window.location.href = '..'; return false;"></a>
    
    <div id="game-root"></div>
</body>
</html>
```

### JavaScript Setup
```javascript
class DeinSpiel {
    init() {
        const root = document.getElementById('game-root');
        
        root.innerHTML = `
            <canvas id="game-canvas"></canvas>
            
            <div class="stats-banner">
                <div class="stat-box">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-info">
                        <div class="stat-value" id="score-value">0</div>
                        <div class="stat-label">Punkte</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    showStartOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="overlay-content">
                <div class="overlay-title">🎮 Titel</div>
                <p>Beschreibung...</p>
                <button class="game-button" onclick="game.start()">Start 🎮</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    async showGameOver() {
        let top3 = await statsManager.getTop3(this.gameName);
        
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="overlay-content">
                <div class="overlay-title">🎅 Game Over! 🎄</div>
                <div class="score-message">${this.getScoreMessage()}</div>
                <div class="final-score">${this.score}</div>
                ${top3.length > 0 ? `
                    <div class="highscore-table">
                        <div class="highscore-title">🏆 Top 3</div>
                        ${top3.map((entry, index) => `
                            <div class="highscore-entry">
                                <span class="highscore-rank">${['🥇', '🥈', '🥉'][index]}</span>
                                <span class="highscore-name">${entry.username}</span>
                                <span class="highscore-score">${entry.score}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <button class="game-button" onclick="game.start()">Nochmal spielen! 🔄</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }
}
```

### CSS Anpassungen (dein-spiel.css)
```css
/* Nur spiel-spezifische Styles! */

/* Eigener Background */
body {
    background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
}

/* Eigene Canvas-Styles */
#game-canvas {
    background: transparent;
    cursor: grab;
}

#game-canvas:active {
    cursor: grabbing;
}

/* Eigene Notifications */
.difficulty-notification {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 215, 0, 0.95);
    padding: 20px 40px;
    border-radius: 15px;
    font-size: 1.5rem;
    font-weight: bold;
    z-index: 1500;
}
```

## 🎨 CSS Variables

In `game-base.css` definiert:

```css
:root {
    /* Farben */
    --game-primary: #1a237e;
    --game-secondary: #283593;
    --game-accent-gold: #FFD700;
    --game-accent-orange: #FF9800;
    --game-text-primary: #ffffff;
    
    /* Sizes */
    --stat-icon-size: 1.5rem;
    --stat-value-size: 1.1rem;
    --score-size: 1.8rem;
    
    /* Effects */
    --blur-amount: 10px;
    --transition-speed: 0.3s;
}
```

Anpassen in deinem CSS:
```css
:root {
    --game-primary: #d32f2f;  /* Rot für dein Spiel */
    --game-secondary: #c62828;
}
```

## ✅ Vorteile

1. **Konsistenz**: Alle Spiele sehen gleich aus
2. **Wartbarkeit**: Änderungen an einem Ort
3. **Modularität**: Nur laden, was gebraucht wird
4. **Schneller**: Wiederverwendung von Styles
5. **Einfacher**: Neue Spiele schnell erstellen

## 🔄 Migration bestehender Spiele

1. **HTML anpassen**: CSS-Links hinzufügen
2. **CSS bereinigen**: Gemeinsame Styles entfernen
3. **Klassen angleichen**: `.overlay`, `.game-button` etc. verwenden
4. **Testen**: Alle Features prüfen

## 📝 Nächste Spiele

Diese Spiele müssen noch migriert werden:
- [ ] Santa Run (Tag 18)
- [ ] Santa Snake (Tag 12)
- [ ] Christmas Memory (Tag 14)
- [ ] Christmas Match-3 (Tag 15)
- [ ] Gift Stack (Tag 21)

## 🎯 Bereits migriert

- [x] Gift-Catcher (Tag 7)
- [x] Snowflake-Catcher (Tag 8)
- [x] Santa-Launcher (Tag 11)
- [x] Flappy-Santa (Tag 16)
