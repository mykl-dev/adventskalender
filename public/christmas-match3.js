// === Christmas Match-3 Game (Candy Crush Style) ===
class ChristmasMatch3Game {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.gridSize = 8; // 8x8 Grid
        this.tileSize = 50;
        this.grid = [];
        this.selectedTile = null;
        this.score = 0;
        this.isAnimating = false;
        this.gameActive = false;
        
        // === KOMBINIERTES SYSTEM: ZÜGE + ZEIT (wie Candy Crush) ===
        this.movesLeft = 30; // Start mit 30 Zügen
        this.timeLeft = 20; // Start mit 20 Sekunden
        this.maxTime = 60; // Maximale Zeit: 60 Sekunden
        this.timerInterval = null;
        this.totalTilesCleared = 0; // Für Schwierigkeits-Scaling
        this.comboCounter = 0; // Für Kettenreaktionen
        this.touchControlsSetup = false; // Flag um doppelte Event-Listener zu vermeiden
        this.difficultyLevel = 1; // Startet bei Level 1
        
        // Christbaumkugel Farben/Typen
        this.ornamentTypes = [
            { id: 0, emoji: '🔴', color: '#e74c3c' }, // Rot
            { id: 1, emoji: '🔵', color: '#3498db' }, // Blau
            { id: 2, emoji: '🟡', color: '#f1c40f' }, // Gelb
            { id: 3, emoji: '🟢', color: '#2ecc71' }, // Grün
            { id: 4, emoji: '🟣', color: '#9b59b6' }, // Lila
            { id: 5, emoji: '🟠', color: '#e67e22' }  // Orange
        ];
        
        // Zusätzliche Farben für höhere Schwierigkeit
        this.extraOrnamentTypes = [
            { id: 6, emoji: '🟤', color: '#8b4513' }, // Braun
            { id: 7, emoji: '⚪', color: '#ecf0f1' }  // Weiß
        ];
        
        // Bonus Geschenk (gibt Extrapunkte x2, KEINE Zeit!)
        this.giftType = { id: 99, emoji: '🎁', color: '#FFD700' };
        this.giftSpawnChance = 0.03; // Noch weniger: 3% (selten!)
        
        // 3D Effekte
        this.particles = []; // Für Explosions-Partikel
        this.shakeAmount = 0; // Für Screen-Shake
        this.floatingTexts = []; // Für Score-Popups
        
        this.init();
    }
    
    init() {
        this.touchControlsSetup = false; // Reset für neues Spiel
        this.container.innerHTML = `
            <div class="match3-game">
                <div class="game-header">
                    <div class="score-display">
                        🎯 Punkte: <span id="match3-score">0</span>
                    </div>
                    <div class="moves-display">
                        🎲 Züge: <span id="match3-moves">30</span>
                    </div>
                    <div class="time-display">
                        ⏱️ Zeit: <span id="match3-time">20</span>s
                    </div>
                </div>
                <div class="match3-board" id="match3-board"></div>
                <!-- Combo-Display als Overlay -->
                <div class="combo-display" id="combo-display" style="display: none;">
                    🔥 Combo x<span id="match3-combo">0</span>
                </div>
                <button class="game-button" id="match3-start-button">Spiel starten! 🎮</button>
            </div>
        `;
        
        document.getElementById('match3-start-button').addEventListener('click', () => this.start());
        
        // Zeige Start-Overlay nach kurzer Verzögerung
        setTimeout(() => this.showStartOverlay(), 100);
    }
    
    showStartOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'game-instructions-overlay';
        overlay.innerHTML = `
            <div class="instructions-content">
                <h2>🎄 Christmas Match-3 ⏱️</h2>
                <div class="instruction-items">
                    <div class="instruction-item">
                        <span class="item-icon">📱</span>
                        <span>Handy: Wische Kugel in gewünschte Richtung!</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">🖱️</span>
                        <span>PC: Klicke 2 benachbarte Kugeln zum Tauschen!</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">🎲</span>
                        <span>Du hast 30 Züge!</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">⏱️</span>
                        <span>Startzeit: 20s (Maximum: 60s)</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">🔴</span>
                        <span>+0.8 Sekunden pro eliminierte Kugel</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">🔥</span>
                        <span>Kettenreaktionen: +2.5 Sekunden Bonus!</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">🎲</span>
                        <span>5+ Kugeln: +1 Zug | 7+: +2 Züge | 9+: +3 Züge</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">🎁</span>
                        <span>Geschenke verdoppeln deine Punkte!</span>
                    </div>
                </div>
                <p class="difficulty-info">🎯 Wie lange kannst du überleben?</p>
                <button class="instruction-ok-button" id="instruction-ok-button">
                    ✓ Los geht's!
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('instruction-ok-button').addEventListener('click', () => {
            overlay.remove();
            const startBtn = document.getElementById('match3-start-button');
            if (startBtn) startBtn.classList.add('pulse');
        });
    }

    async start() {
        // Spielername sicherstellen (wird ggf. abgefragt)
        await window.statsManager.ensureUsername();
        
        this.score = 0;
        this.movesLeft = 30;
        this.timeLeft = 20;
        this.gameActive = true;
        this.selectedTile = null;
        this.startTime = Date.now(); // Spielzeit-Tracking
        this.totalTilesCleared = 0;
        this.comboCounter = 0;
        this.particles = [];
        this.shakeAmount = 0;
        this.floatingTexts = [];
        
        document.getElementById('match3-start-button').style.display = 'none';
        document.getElementById('match3-score').textContent = '0';
        document.getElementById('match3-moves').textContent = '30';
        document.getElementById('match3-time').textContent = '20';
        document.getElementById('combo-display').style.display = 'none';
        
        // Zeige Highscores beim Start
        await this.showHighscores();
        
        this.initializeGrid();
        this.renderBoard();
        
        // Starte Timer
        this.startTimer();
    }
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (!this.gameActive) {
                clearInterval(this.timerInterval);
                return;
            }
            
            this.timeLeft -= 0.1; // Update alle 100ms für smooth countdown
            
            // Game Over wenn Zeit oder Züge auf 0
            if (this.timeLeft <= 0 || this.movesLeft <= 0) {
                this.timeLeft = Math.max(0, this.timeLeft);
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                this.endGame();
                return;
            }
            
            // Update Display
            const timeDisplay = document.getElementById('match3-time');
            if (timeDisplay) {
                timeDisplay.textContent = Math.ceil(this.timeLeft);
                
                // Warnung bei wenig Zeit
                if (this.timeLeft <= 10) {
                    timeDisplay.parentElement.classList.add('time-warning');
                } else if (this.timeLeft <= 5) {
                    timeDisplay.parentElement.classList.add('time-critical');
                }
            }
        }, 100);
    }
    
    addTime(seconds) {
        // Runde auf ganze Sekunden
        const roundedSeconds = Math.round(seconds);
        this.timeLeft = Math.min(this.maxTime, this.timeLeft + roundedSeconds); // Maximal 60 Sekunden
        
        // Zeige Floating Text ohne Kommastellen
        this.showFloatingText(`+${roundedSeconds}s`, '#2ecc71');
    }
    
    async showHighscores() {
        const board = document.getElementById('match3-board');
        const existing = board.querySelector('.highscore-display');
        if (existing) existing.remove();
        
        const top3 = await statsManager.getTop3('christmas-match3');
        const highscoreHTML = statsManager.createHighscoreDisplay(top3);
        
        board.insertAdjacentHTML('beforebegin', highscoreHTML);
    }
    
    initializeGrid() {
        // Grid erstellen ohne initiale Matches (KEINE Geschenke am Start!)
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                let type;
                let attempts = 0;
                do {
                    // Nur normale Kugeln am Start (keine Geschenke = einfacher)
                    type = this.getRandomOrnamentType();
                    attempts++;
                } while (this.wouldCreateMatch(row, col, type) && attempts < 100);
                
                this.grid[row][col] = type;
            }
        }
        
        // Sicherstellen, dass mindestens ein Move möglich ist
        if (!this.hasValidMoves()) {
            this.shuffleGrid();
        }
    }
    
    getRandomOrnamentType() {
        // Wähle aus verfügbaren Farben basierend auf Score
        const types = this.getActiveOrnamentTypes();
        const selected = types[Math.floor(Math.random() * types.length)];
        // Kopie zurückgeben um Referenz-Probleme zu vermeiden
        return { ...selected };
    }
    
    getActiveOrnamentTypes() {
        // Ab 500 Punkten: 7 Farben statt 6 (schwieriger!)
        // Ab 1500 Punkten: Alle 8 Farben (sehr schwer!)
        if (this.score >= 1500) {
            return [...this.ornamentTypes, ...this.extraOrnamentTypes];
        } else if (this.score >= 500) {
            return [...this.ornamentTypes, this.extraOrnamentTypes[0]];
        }
        return this.ornamentTypes;
    }
    
    updateDifficulty() {
        // Update Schwierigkeits-Level basierend auf Score
        const oldLevel = this.difficultyLevel;
        
        if (this.score >= 2000) this.difficultyLevel = 5;
        else if (this.score >= 1500) this.difficultyLevel = 4;
        else if (this.score >= 1000) this.difficultyLevel = 3;
        else if (this.score >= 500) this.difficultyLevel = 2;
        else this.difficultyLevel = 1;
        
        // Bei Level-Up Benachrichtigung anzeigen
        if (this.difficultyLevel > oldLevel) {
            this.showFloatingText(`🔥 Level ${this.difficultyLevel}!`, '#e74c3c');
        }
        
        // Geschenk-Chance sinkt mit Schwierigkeit
        this.giftSpawnChance = Math.max(0.01, 0.05 - (this.difficultyLevel * 0.008));
    }
    
    wouldCreateMatch(row, col, type) {
        // Geschenke (Wild) nicht am Start spawnen lassen - zu komplex
        if (type.id === 99) return true; // Verhindert Geschenke am Start
        
        // Simuliere das Platzieren und prüfe mit Flood-Fill
        this.grid[row][col] = type;
        
        // Temporäres Cluster-Check
        const checked = new Set();
        const toCheck = [[row, col]];
        const visited = new Set();
        let clusterSize = 0;
        
        while (toCheck.length > 0 && clusterSize < 3) {
            const [r, c] = toCheck.pop();
            const key = `${r},${c}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            // Bounds-Check VOR dem Zugriff!
            if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) continue;
            if (!this.grid[r] || !this.grid[r][c]) continue;
            
            const tile = this.grid[r][c];
            if (tile.id !== type.id && tile.id !== 99) continue;
            
            clusterSize++;
            
            // Nachbarn checken
            const neighbors = [
                [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
            ];
            
            for (const [nR, nC] of neighbors) {
                if (nR >= 0 && nR < this.gridSize && 
                    nC >= 0 && nC < this.gridSize &&
                    (nR !== row || nC !== col)) { // Nicht die neue Position nochmal
                    toCheck.push([nR, nC]);
                }
            }
        }
        
        // Zurücksetzen
        this.grid[row][col] = null;
        
        return clusterSize >= 3;
    }
    
    renderBoard() {
        const board = document.getElementById('match3-board');
        if (!board) return;
        
        // Nur beim ersten Render Board initialisieren
        const isFirstRender = board.children.length === 0;
        
        if (isFirstRender) {
            board.innerHTML = '';
            board.style.width = (this.gridSize * this.tileSize) + 'px';
            board.style.height = (this.gridSize * this.tileSize) + 'px';
        }
        
        // Screen Shake Effekt - nur auf tiles anwenden, nicht auf board-container
        let shakeTransform = '';
        if (this.shakeAmount > 0) {
            const offsetX = (Math.random() - 0.5) * this.shakeAmount;
            const offsetY = (Math.random() - 0.5) * this.shakeAmount;
            shakeTransform = `translate(${offsetX}px, ${offsetY}px)`;
            this.shakeAmount *= 0.9; // Reduziere Shake
            if (this.shakeAmount < 0.1) this.shakeAmount = 0;
        }
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const index = row * this.gridSize + col;
                const tileData = this.grid[row][col];
                
                // Hole existierendes Tile oder erstelle neues
                let tile = board.children[index];
                
                if (!tile || isFirstRender) {
                    tile = document.createElement('div');
                    tile.dataset.row = row;
                    tile.dataset.col = col;
                    tile.addEventListener('click', () => this.handleTileClick(row, col));
                    if (isFirstRender) {
                        board.appendChild(tile);
                    }
                }
                
                // Skip null Felder (noch nicht nachgefüllt)
                if (!tileData) {
                    tile.className = 'match3-tile match3-empty';
                    tile.innerHTML = '';
                    tile.style.transform = '';
                    tile.style.removeProperty('--tile-color');
                    continue;
                }
                
                tile.className = 'match3-tile';
                
                // Shake-Effekt auf Tile anwenden
                if (shakeTransform) {
                    tile.style.transform = shakeTransform;
                } else {
                    tile.style.transform = '';
                }
                
                // Nur innerHTML aktualisieren wenn sich Typ ändert
                const currentEmoji = tile.querySelector('.tile-emoji')?.textContent;
                if (currentEmoji !== tileData.emoji) {
                    tile.innerHTML = `
                        <div class="tile-inner">
                            <div class="tile-shine"></div>
                            <span class="tile-emoji">${tileData.emoji}</span>
                            <div class="tile-shadow"></div>
                        </div>
                    `;
                }
                
                // Gradient basierend auf Farbe
                tile.style.setProperty('--tile-color', tileData.color);
                
                // Aufleuchten wenn markiert (vor Explosion)
                if (tileData.glowing) {
                    tile.setAttribute('data-glowing', 'true');
                } else {
                    tile.removeAttribute('data-glowing');
                }
                
                // Explosion-Animation hinzufügen wenn markiert
                if (tileData.exploding) {
                    tile.classList.add('matched');
                } else {
                    tile.classList.remove('matched');
                }
                
                // Neu erscheinende Tiles bekommen Bounce-Animation
                if (tileData.isNew) {
                    tile.classList.add('tile-bounce');
                    delete tileData.isNew;
                }
            }
        }
        
        // Touch-Gesten Setup - nur einmal beim ersten Render
        if (!this.touchControlsSetup) {
            this.setupTouchControls(board);
            this.touchControlsSetup = true;
        }
        
        // Render Partikel
        this.renderParticles();
        
        // Render Floating Texts
        this.renderFloatingTexts();
        
        // Continue Animation
        if (this.gameActive && (this.particles.length > 0 || this.floatingTexts.length > 0 || this.shakeAmount > 0)) {
            requestAnimationFrame(() => this.renderBoard());
        }
    }
    
    setupTouchControls(board) {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartRow = -1;
        let touchStartCol = -1;
        let hasMoved = false;
        
        const handleStart = (clientX, clientY, e) => {
            if (!this.gameActive || this.isAnimating) return;
            
            hasMoved = false;
            touchStartX = clientX;
            touchStartY = clientY;
            
            // Finde die Tile unter dem Touch/Click - suche auch in Eltern-Elementen
            let element = document.elementFromPoint(clientX, clientY);
            
            // Falls inneres Element getroffen, finde das parent tile
            while (element && !element.classList.contains('match3-tile') && element !== board) {
                element = element.parentElement;
            }
            
            if (element && element.classList.contains('match3-tile') && element.dataset.row) {
                touchStartRow = parseInt(element.dataset.row);
                touchStartCol = parseInt(element.dataset.col);
                
                console.log(`Touch Start: Row ${touchStartRow}, Col ${touchStartCol}`);
                
                // Visuelles Feedback
                element.classList.add('selected');
                
                // Verhindere Standard-Verhalten
                if (e && e.cancelable) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        };
        
        const handleMove = (e) => {
            if (touchStartRow === -1) return;
            
            hasMoved = true;
            // Verhindere Scrollen während Swipe
            if (e && e.cancelable) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        const handleEnd = (clientX, clientY) => {
            if (!this.gameActive || this.isAnimating || touchStartRow === -1) {
                touchStartRow = -1;
                touchStartCol = -1;
                // Entferne Selection
                document.querySelectorAll('.match3-tile.selected').forEach(t => t.classList.remove('selected'));
                return;
            }
            
            const deltaX = clientX - touchStartX;
            const deltaY = clientY - touchStartY;
            
            // Entferne Selection
            document.querySelectorAll('.match3-tile.selected').forEach(t => t.classList.remove('selected'));
            
            // Minimale Swipe-Distanz
            const minSwipeDistance = 30;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            
            if (absDeltaX > minSwipeDistance || absDeltaY > minSwipeDistance) {
                let targetRow = touchStartRow;
                let targetCol = touchStartCol;
                
                // Bestimme Swipe-Richtung
                if (absDeltaX > absDeltaY) {
                    // Horizontal Swipe
                    if (deltaX > 0 && touchStartCol < this.gridSize - 1) {
                        targetCol++; // Nach rechts
                        console.log(`Swipe RECHTS: (${touchStartRow},${touchStartCol}) -> (${targetRow},${targetCol})`);
                    } else if (deltaX < 0 && touchStartCol > 0) {
                        targetCol--; // Nach links
                        console.log(`Swipe LINKS: (${touchStartRow},${touchStartCol}) -> (${targetRow},${targetCol})`);
                    }
                } else {
                    // Vertikal Swipe
                    if (deltaY > 0 && touchStartRow < this.gridSize - 1) {
                        targetRow++; // Nach unten
                        console.log(`Swipe UNTEN: (${touchStartRow},${touchStartCol}) -> (${targetRow},${targetCol})`);
                    } else if (deltaY < 0 && touchStartRow > 0) {
                        targetRow--; // Nach oben
                        console.log(`Swipe OBEN: (${touchStartRow},${touchStartCol}) -> (${targetRow},${targetCol})`);
                    }
                }
                
                // Tausch durchführen
                if (targetRow !== touchStartRow || targetCol !== touchStartCol) {
                    this.swapTiles(touchStartRow, touchStartCol, targetRow, targetCol);
                }
            } else if (!hasMoved) {
                // Kein Swipe erkannt - behandle als Click
                this.handleTileClick(touchStartRow, touchStartCol);
            }
            
            touchStartRow = -1;
            touchStartCol = -1;
        };
        
        // Touch Events
        board.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY, e);
        }, { passive: false });
        
        board.addEventListener('touchmove', handleMove, { passive: false });
        
        board.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            handleEnd(touch.clientX, touch.clientY);
        }, { passive: false });
        
        // Mouse Events für Desktop/Browser-Emulation
        let isMouseDown = false;
        
        board.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            handleStart(e.clientX, e.clientY, e);
        });
        
        board.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                handleMove(e);
            }
        });
        
        board.addEventListener('mouseup', (e) => {
            if (isMouseDown) {
                isMouseDown = false;
                handleEnd(e.clientX, e.clientY);
            }
        });
        
        board.addEventListener('mouseleave', () => {
            if (isMouseDown) {
                isMouseDown = false;
                touchStartRow = -1;
                touchStartCol = -1;
                document.querySelectorAll('.match3-tile.selected').forEach(t => t.classList.remove('selected'));
            }
        });
    }
    
    handleTileClick(row, col) {
        if (!this.gameActive || this.isAnimating) return;
        
        const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (!this.selectedTile) {
            // Erste Kugel auswählen
            this.selectedTile = { row, col };
            tile.classList.add('selected');
        } else {
            // Wenn gleiche Kugel nochmal geklickt - Abwählen
            if (this.selectedTile.row === row && this.selectedTile.col === col) {
                tile.classList.remove('selected');
                this.selectedTile = null;
                return;
            }
            
            // Zweite Kugel auswählen und versuchen zu tauschen
            const prevTile = document.querySelector(`[data-row="${this.selectedTile.row}"][data-col="${this.selectedTile.col}"]`);
            prevTile.classList.remove('selected');
            
            // Prüfen ob benachbart
            if (this.areAdjacent(this.selectedTile.row, this.selectedTile.col, row, col)) {
                this.swapTiles(this.selectedTile.row, this.selectedTile.col, row, col);
            } else {
                // Nicht benachbart - neue Auswahl starten
                this.selectedTile = { row, col };
                tile.classList.add('selected');
                return;
            }
            
            this.selectedTile = null;
        }
    }
    
    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    async swapTiles(row1, col1, row2, col2) {
        this.isAnimating = true;
        
        // Reduziere Züge
        this.movesLeft--;
        document.getElementById('match3-moves').textContent = this.movesLeft;
        
        // Prüfe Game Over bei 0 Zügen
        if (this.movesLeft <= 0) {
            this.isAnimating = false;
            this.endGame();
            return;
        }
        
        // Tauschen (bleibt IMMER getauscht!)
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;
        
        this.renderBoard();
        await this.sleep(400); // Länger für flüssigere Animation
        
        // Prüfen ob Match entsteht
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            // Match gefunden - Kugeln explodieren und verarbeiten
            console.log(`✨ Match gefunden! ${matches.length} Kugeln`);
            await this.processMatches(matches);
        } else {
            // Kein Match - Tausch bleibt trotzdem!
            console.log('❌ Kein Match - aber Tausch bleibt');
        }
        
        // Prüfen ob keine gültigen Züge mehr möglich
        if (!this.hasValidMoves()) {
            // Keine Züge mehr möglich - Shuffle
            this.showFloatingText('🔄 Keine Züge möglich - Neu gemischt!', '#3498db');
            await this.sleep(500);
            this.shuffleGrid();
            this.renderBoard();
        }
        
        this.isAnimating = false;
    }
    
    findMatches() {
        const checked = new Set();
        const allMatches = [];
        
        console.log('🔍 Suche nach zusammenhängenden Matches (Flood-Fill)...');
        
        // Flood-Fill: Findet ALLE zusammenhängenden Tiles der gleichen Farbe
        const floodFill = (startRow, startCol) => {
            const startTile = this.grid[startRow][startCol];
            if (!startTile) return [];
            
            const cluster = [];
            const toCheck = [[startRow, startCol]];
            const visited = new Set();
            
            // Bestimme Basis-Farbe (erste nicht-Gift Farbe im Cluster)
            let baseColor = startTile.id === 99 ? null : startTile.id;
            
            while (toCheck.length > 0) {
                const [row, col] = toCheck.pop();
                const key = `${row},${col}`;
                
                if (visited.has(key)) continue;
                visited.add(key);
                
                const tile = this.grid[row][col];
                if (!tile) continue;
                
                // Wenn baseColor noch null (nur Gifts bisher), nehme erste echte Farbe
                if (baseColor === null && tile.id !== 99) {
                    baseColor = tile.id;
                }
                
                // Prüfe ob Tile zur Gruppe gehört
                const matches = (tile.id === 99) || (baseColor !== null && tile.id === baseColor);
                
                if (!matches) continue;
                
                // Zur Gruppe hinzufügen
                cluster.push({ row, col, type: tile });
                
                // Nachbarn prüfen (oben, unten, links, rechts)
                const neighbors = [
                    [row - 1, col], // oben
                    [row + 1, col], // unten
                    [row, col - 1], // links
                    [row, col + 1]  // rechts
                ];
                
                for (const [nRow, nCol] of neighbors) {
                    if (nRow >= 0 && nRow < this.gridSize && 
                        nCol >= 0 && nCol < this.gridSize) {
                        const nKey = `${nRow},${nCol}`;
                        if (!visited.has(nKey)) {
                            toCheck.push([nRow, nCol]);
                        }
                    }
                }
            }
            
            return cluster;
        };
        
        // Durchsuche Grid nach Clustern
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const key = `${row},${col}`;
                
                if (checked.has(key)) continue;
                if (!this.grid[row][col]) continue;
                
                // Finde Cluster ab dieser Position
                const cluster = floodFill(row, col);
                
                // Markiere alle als gecheckt
                cluster.forEach(tile => {
                    checked.add(`${tile.row},${tile.col}`);
                });
                
                // Nur Cluster mit 3+ Tiles sind gültig
                if (cluster.length >= 3) {
                    const firstReal = cluster.find(t => t.type.id !== 99);
                    const colorEmoji = firstReal ? firstReal.type.emoji : '🎁';
                    const giftCount = cluster.filter(t => t.type.id === 99).length;
                    
                    console.log(`🎯 Cluster gefunden: ${cluster.length} Tiles, Farbe: ${colorEmoji}${giftCount > 0 ? ` (+${giftCount} 🎁)` : ''}`);
                    console.log(`   Positionen: ${cluster.map(t => `[${t.row},${t.col}]`).join(', ')}`);
                    
                    allMatches.push(...cluster);
                }
            }
        }
        
        console.log(`📊 Gesamt gefundene Matches: ${allMatches.length} Tiles in Clustern`);
        return allMatches;
    }
    
    async processMatches(matches, isCombo = false) {
        console.log(`🎯 processMatches aufgerufen mit ${matches.length} Matches (Combo: ${isCombo})`);
        
        // === ZEIT-BONUS berechnen (Score-basiertes Scaling!) ===
        const normalTiles = matches.filter(m => m.type.id !== 99).length;
        const giftCount = matches.filter(m => m.type.id === 99).length;
        
        // Progressive Schwierigkeit basierend auf Score:
        // 0-200 Punkte: 100% Zeit-Bonus
        // 200-500 Punkte: 80% Zeit-Bonus
        // 500-1000 Punkte: 60% Zeit-Bonus
        // 1000-2000 Punkte: 40% Zeit-Bonus
        // 2000+ Punkte: 25% Zeit-Bonus (Maximum)
        const scalingFactor = Math.max(0.25, 1 - (this.score / 800)); // Min 25% ab 600 Punkten
        const baseTimePerTile = 0.8; // 0.8 Sekunden pro Kugel
        const timePerTile = baseTimePerTile * scalingFactor;
        const comboTimeBonus = isCombo ? 2.5 : 0; // 2.5 Sekunden Combo-Bonus
        
        const totalTimeBonus = (normalTiles * timePerTile) + comboTimeBonus;
        
        if (totalTimeBonus > 0) {
            this.addTime(totalTimeBonus);
            console.log(`⏱️ Zeit-Bonus: +${totalTimeBonus.toFixed(2)}s (${normalTiles} Kugeln × ${timePerTile.toFixed(3)}s${isCombo ? ' + 1.5s Combo' : ''}) [Scaling: ${(scalingFactor * 100).toFixed(0)}%]`);
        }
        
        // === ZÜGE-BONUS für große Kombos ===
        let movesBonus = 0;
        if (matches.length >= 9) movesBonus = 3;
        else if (matches.length >= 7) movesBonus = 2;
        else if (matches.length >= 5) movesBonus = 1;
        
        if (movesBonus > 0) {
            this.movesLeft += movesBonus;
            document.getElementById('match3-moves').textContent = this.movesLeft;
            this.addFloatingText(matches[0].row, matches[0].col, `+${movesBonus} 🎲`, '#f39c12', 28);
            console.log(`🎲 Züge-Bonus: +${movesBonus} (${matches.length} Kugeln Kombo!)`);
        }
        
        this.totalTilesCleared += normalTiles;
        
        // === PUNKTE berechnen ===
        const basePoints = matches.length * 10;
        let bonusPoints = 0;
        if (matches.length >= 4) bonusPoints = 20;
        if (matches.length >= 5) bonusPoints = 50;
        if (matches.length >= 6) bonusPoints = 100;
        
        // Geschenke = Punkte-Multiplikator (x2)
        const pointsMultiplier = giftCount > 0 ? 2 : 1;
        const totalPoints = (basePoints + bonusPoints) * pointsMultiplier;
        
        this.score += totalPoints;
        document.getElementById('match3-score').textContent = this.score;
        this.updateDifficulty();
        
        // Floating Score Text am ersten Match
        if (matches.length > 0) {
            const firstMatch = matches[0];
            if (giftCount > 0) {
                this.addFloatingText(firstMatch.row, firstMatch.col, `🎁 +${totalPoints}`, '#FFD700', 32);
            } else if (bonusPoints > 0) {
                this.addFloatingText(firstMatch.row, firstMatch.col, `+${totalPoints} 🌟`, '#f39c12', 28);
            } else {
                this.addFloatingText(firstMatch.row, firstMatch.col, `+${totalPoints}`, '#2ecc71', 24);
            }
        }
        
        if (giftCount > 0) {
            console.log(`� ${giftCount} Geschenke! Punkte x2 Multiplikator`);
        }
        
        console.log(`💰 Punkte vergeben: ${totalPoints} (${matches.length} Kugeln${pointsMultiplier > 1 ? ' × 2' : ''})`);
        
        // PHASE 1: Matches als "glowing" markieren (Aufleuchten!)
        matches.forEach(match => {
            if (this.grid[match.row][match.col]) {
                this.grid[match.row][match.col].glowing = true;
            }
        });
        
        this.renderBoard();
        await this.sleep(400); // Aufleuchten lassen
        
        // PHASE 2: Zu "exploding" ändern (Knall!)
        matches.forEach(match => {
            if (this.grid[match.row][match.col]) {
                delete this.grid[match.row][match.col].glowing;
                this.grid[match.row][match.col].exploding = true;
            }
        });
        
        this.renderBoard();
        
        // PHASE 3: Krasse Partikel-Explosionen!
        matches.forEach((match, index) => {
            const type = this.grid[match.row][match.col];
            if (type) {
                // Gestaffelt explodieren für Kettenreaktions-Effekt
                setTimeout(() => {
                    this.createExplosionParticles(match.row, match.col, type.color);
                    this.createShockwave(match.row, match.col);
                }, index * 30); // 30ms zwischen Explosionen
            }
        });
        
        // Warte für Explosion-Animation
        await this.sleep(350);
        
        // PHASE 4: Matches aus Grid entfernen
        console.log('🗑️ Entferne Matches aus Grid...');
        matches.forEach(match => {
            const type = this.grid[match.row][match.col];
            if (type) {
                console.log(`💥 Explosion bei [${match.row},${match.col}] - ${type.emoji}`);
            }
            this.grid[match.row][match.col] = null;
        });
        
        this.renderBoard();
        await this.sleep(150); // Etwas länger um neue Tiles zu sehen
        
        // PHASE 5: Kugeln fallen lassen
        console.log('⬇️ Kugeln fallen lassen...');
        await this.dropTiles();
        
        // PHASE 6: Neue Kugeln nachfüllen
        console.log('➕ Neue Kugeln nachfüllen...');
        this.fillGrid();
        this.renderBoard();
        
        // PHASE 7: Warten bis Bounce-Animation fertig ist
        await this.sleep(500); // Optimiert für smooth cascade
        
        // PHASE 8: JETZT erst neue Matches suchen
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            this.comboCounter++;
            console.log(`🔥 COMBO ${this.comboCounter}! Weitere ${newMatches.length} Matches gefunden`);
            
            // Zeige Combo-Counter
            const comboDisplay = document.getElementById('combo-display');
            const comboValue = document.getElementById('match3-combo');
            if (comboDisplay && comboValue) {
                comboDisplay.style.display = 'flex';
                comboValue.textContent = this.comboCounter;
            }
            
            // Kurze Pause damit man die neuen Matches sehen kann
            await this.sleep(300);
            
            await this.processMatches(newMatches, true); // isCombo = true
        } else {
            console.log('✅ Keine weiteren Matches - fertig!');
            this.comboCounter = 0;
            
            // Verstecke Combo-Display
            const comboDisplay = document.getElementById('combo-display');
            if (comboDisplay) {
                comboDisplay.style.display = 'none';
            }
        }
    }
    
    async dropTiles() {
        // Alle Kugeln auf einmal fallen lassen (gleichzeitig pro Spalte)
        let hasEmptySpaces = true;
        
        while (hasEmptySpaces) {
            hasEmptySpaces = false;
            
            for (let col = 0; col < this.gridSize; col++) {
                for (let row = this.gridSize - 1; row > 0; row--) {
                    if (this.grid[row][col] === null && this.grid[row - 1][col] !== null) {
                        this.grid[row][col] = this.grid[row - 1][col];
                        this.grid[row - 1][col] = null;
                        hasEmptySpaces = true;
                    }
                }
            }
            
            if (hasEmptySpaces) {
                this.renderBoard();
                await this.sleep(50); // Schneller für smooth falling
            }
        }
    }
    
    fillGrid() {
        let filled = 0;
        let gifts = 0;
        
        console.log('🔄 fillGrid() aufgerufen, suche nach null Feldern...');
        
        for (let col = 0; col < this.gridSize; col++) {
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col] === null) {
                    // 15% Chance für Geschenk
                    if (Math.random() < this.giftSpawnChance) {
                        this.grid[row][col] = { ...this.giftType, isNew: true };
                        gifts++;
                        console.log(`  🎁 Geschenk spawnt bei [${row},${col}]`);
                    } else {
                        const newType = this.getRandomOrnamentType();
                        this.grid[row][col] = { ...newType, isNew: true };
                        console.log(`  ${newType.emoji} spawnt bei [${row},${col}]`);
                    }
                    filled++;
                }
            }
        }
        
        if (filled > 0) {
            console.log(`✅ ${filled} neue Kugeln nachgefüllt (davon ${gifts} Geschenke 🎁)`);
        } else {
            console.log('⚠️ Keine null Felder gefunden - nichts nachzufüllen!');
        }
    }
    
    hasValidMoves() {
        // Prüft ob noch ein gültiger Zug möglich ist
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // Horizontal Tausch
                if (col < this.gridSize - 1) {
                    this.swapGridPositions(row, col, row, col + 1);
                    if (this.findMatches().length > 0) {
                        this.swapGridPositions(row, col, row, col + 1);
                        return true;
                    }
                    this.swapGridPositions(row, col, row, col + 1);
                }
                
                // Vertikal Tausch
                if (row < this.gridSize - 1) {
                    this.swapGridPositions(row, col, row + 1, col);
                    if (this.findMatches().length > 0) {
                        this.swapGridPositions(row, col, row + 1, col);
                        return true;
                    }
                    this.swapGridPositions(row, col, row + 1, col);
                }
            }
        }
        return false;
    }
    
    swapGridPositions(row1, col1, row2, col2) {
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;
    }
    
    shuffleGrid() {
        // Grid neu mischen
        const tiles = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                tiles.push(this.grid[row][col]);
            }
        }
        
        // Fisher-Yates Shuffle
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }
        
        // Zurück ins Grid
        let idx = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = tiles[idx++];
            }
        }
        
        this.showFloatingText('🔄 Feld neu gemischt!', '#3498db');
    }
    
    showFloatingText(text, color) {
        const board = document.getElementById('match3-board');
        if (!board) return;
        
        const floater = document.createElement('div');
        floater.className = 'match3-floater';
        floater.textContent = text;
        floater.style.color = color;
        
        // Zufällige Position für bessere Sichtbarkeit bei mehreren Texten
        const randomOffset = Math.random() * 100 - 50;
        floater.style.setProperty('--random-offset', `${randomOffset}px`);
        
        board.appendChild(floater);
        
        setTimeout(() => {
            if (floater.parentNode) {
                floater.remove();
            }
        }, 2000);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    createExplosionParticles(row, col, color) {
        const board = document.getElementById('match3-board');
        if (!board) return;
        
        const centerX = col * this.tileSize + this.tileSize / 2;
        const centerY = row * this.tileSize + this.tileSize / 2;
        
        // EXPLOSION RING 1: Schnelle kleine Partikel (Schrapnell)
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const velocity = 6 + Math.random() * 4;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: 3 + Math.random() * 3,
                life: 1.0,
                color: color,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 40,
                type: 'sharp'
            });
        }
        
        // EXPLOSION RING 2: Größere langsamere Partikel (Haupt-Explosion)
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.4;
            const velocity = 3 + Math.random() * 3;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: 6 + Math.random() * 6,
                life: 1.0,
                color: color,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 30,
                type: 'chunk'
            });
        }
        
        // EXPLOSION RING 3: Funken (hell und schnell)
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.6;
            const velocity = 8 + Math.random() * 5;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: 2 + Math.random() * 2,
                life: 0.7,
                color: '#fff',
                rotation: 0,
                rotationSpeed: 0,
                type: 'spark'
            });
        }
        
        // Screen Shake (minimal für kein Scrollen)
        this.shakeAmount += 2;
    }
    
    createShockwave(row, col) {
        const board = document.getElementById('match3-board');
        if (!board) return;
        
        const centerX = col * this.tileSize + this.tileSize / 2;
        const centerY = row * this.tileSize + this.tileSize / 2;
        
        // Erstelle Shockwave-Element
        const shockwave = document.createElement('div');
        shockwave.className = 'shockwave';
        shockwave.style.left = centerX + 'px';
        shockwave.style.top = centerY + 'px';
        board.appendChild(shockwave);
        
        setTimeout(() => shockwave.remove(), 600);
    }
    
    renderParticles() {
        const board = document.getElementById('match3-board');
        if (!board) return;
        
        // Entferne alte Partikel-Elemente
        board.querySelectorAll('.match3-particle').forEach(p => p.remove());
        
        // Update und render Partikel
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravität
            p.vx *= 0.98; // Luftwiderstand
            p.vy *= 0.98;
            p.life -= 0.02;
            p.rotation += p.rotationSpeed;
            p.size *= 0.97;
            
            if (p.life > 0) {
                const particle = document.createElement('div');
                particle.className = 'match3-particle';
                particle.style.left = p.x + 'px';
                particle.style.top = p.y + 'px';
                particle.style.width = p.size + 'px';
                particle.style.height = p.size + 'px';
                particle.style.backgroundColor = p.color;
                particle.style.opacity = p.life;
                particle.style.transform = `rotate(${p.rotation}deg)`;
                particle.style.boxShadow = `0 0 ${p.size}px ${p.color}`;
                board.appendChild(particle);
                return true;
            }
            return false;
        });
    }
    
    renderFloatingTexts() {
        const board = document.getElementById('match3-board');
        if (!board) return;
        
        // Entferne alte Text-Elemente
        board.querySelectorAll('.floating-score').forEach(t => t.remove());
        
        // Update und render Texte
        this.floatingTexts = this.floatingTexts.filter(t => {
            t.y -= 1;
            t.life -= 0.015;
            
            if (t.life > 0) {
                const text = document.createElement('div');
                text.className = 'floating-score';
                text.style.left = t.x + 'px';
                text.style.top = t.y + 'px';
                text.style.opacity = t.life;
                text.style.color = t.color;
                text.style.fontSize = t.size + 'px';
                text.style.fontWeight = 'bold';
                text.style.textShadow = `0 0 10px ${t.color}`;
                text.textContent = t.text;
                board.appendChild(text);
                return true;
            }
            return false;
        });
    }
    
    addFloatingText(row, col, text, color = '#FFD700', size = 24) {
        const x = col * this.tileSize + this.tileSize / 2;
        const y = row * this.tileSize + this.tileSize / 2;
        
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            size: size,
            life: 1.0
        });
    }
    
    async endGame() {
        this.gameActive = false;
        
        // Stoppe Timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Berechne Spielzeit
        const playTime = Math.floor((Date.now() - this.startTime) / 1000); // in Sekunden
        
        // Speichere Statistik
        await window.statsManager.saveStats('christmas-match3', this.score, playTime);
        
        // Lade Highscores
        const highscores = await window.statsManager.getHighscores('christmas-match3', 10);
        let highscoresHTML = '<div class="no-highscores">Noch keine Highscores vorhanden</div>';
        
        if (highscores && highscores.length > 0) {
            highscoresHTML = highscores.map((entry, index) => `
                <li class="highscore-item">
                    <span class="highscore-rank">${index + 1}.</span>
                    <span class="highscore-name">${entry.username}</span>
                    <span class="highscore-score">${entry.highscore} Punkte</span>
                </li>
            `).join('');
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-content">
                <h2>${this.movesLeft <= 0 ? '🎲 Keine Züge mehr!' : '⏱️ Zeit abgelaufen!'} 🎄</h2>
                <div class="game-over-stats">
                    <div class="game-over-stat-item">
                        <div class="game-over-stat-label">Punkte</div>
                        <div class="game-over-stat-value">${this.score}</div>
                    </div>
                    <div class="game-over-stat-item">
                        <div class="game-over-stat-label">Züge verwendet</div>
                        <div class="game-over-stat-value">${30 - this.movesLeft}/30</div>
                    </div>
                    <div class="game-over-stat-item">
                        <div class="game-over-stat-label">Kugeln eliminiert</div>
                        <div class="game-over-stat-value">${this.totalTilesCleared}</div>
                    </div>
                    <div class="game-over-message">${this.getScoreMessage()}</div>
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
    
    async showFullHighscores() {
        // Lade ALLE Scores (nicht nur Top 3)
        const allScores = await statsManager.getAllScores('christmas-match3');
        
        if (!allScores || allScores.length === 0) {
            return;
        }
        
        // Erstelle Modal
        const modal = document.createElement('div');
        modal.className = 'highscore-modal';
        modal.innerHTML = `
            <div class="highscore-modal-content">
                <div class="highscore-modal-header">
                    <h2>🏆 Alle Highscores - Christmas Match-3</h2>
                    <button class="highscore-modal-close" id="highscore-modal-close">&times;</button>
                </div>
                <div class="highscore-modal-body">
                    ${this.createFullHighscoreList(allScores)}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close Button
        document.getElementById('highscore-modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        // Click außerhalb schließt Modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    createFullHighscoreList(scores) {
        const medals = ['🥇', '🥈', '🥉'];
        
        const rows = scores.map((player, index) => {
            const rank = index + 1;
            const medal = medals[index] || `${rank}.`;
            const isCurrentPlayer = player.username === statsManager.username;
            const highlightClass = isCurrentPlayer ? 'current-player' : '';
            
            // Format Spielzeit
            const minutes = Math.floor(player.totalPlayTime / 60);
            const seconds = player.totalPlayTime % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            return `
                <div class="highscore-full-row ${highlightClass}">
                    <span class="rank">${medal}</span>
                    <span class="player-name">${player.username}</span>
                    <span class="player-score">${player.highscore}</span>
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
                    <span class="player-score">Highscore</span>
                    <span class="player-games">Gespielt</span>
                    <span class="player-time">Zeit</span>
                </div>
                ${rows}
            </div>
        `;
    }
    
    getScoreMessage() {
        if (this.score >= 500) return '🌟 Unglaublich! Match-3 Meister!';
        if (this.score >= 300) return '⭐ Fantastisch! Sehr gut gespielt!';
        if (this.score >= 200) return '✨ Super! Tolle Kombinationen!';
        if (this.score >= 100) return '🎄 Gut gemacht! Weiter so!';
        return '🎅 Guter Versuch! Probier es nochmal!';
    }
}
