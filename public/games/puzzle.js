// Schiebe-Puzzle JavaScript
let currentDifficulty = 3;
let selectedImage = null;
let puzzleState = [];
let emptyPos = { row: 0, col: 0 };
let moves = 0;
let timeElapsed = 0;
let timerInterval = null;
let gameStarted = false;
let availableImages = [];

// Touch handling
let touchStartPos = null;

// Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
    // Start-Overlay mit Game-Infos laden
    if (typeof statsManager !== 'undefined') {
        await statsManager.showGameStartOverlay('puzzle');
        
        // Event-Listener nach Overlay-Erstellung hinzufügen
        const startBtn = document.getElementById('startButton');
        if (startBtn) {
            startBtn.addEventListener('click', startPuzzleGame);
        }
    }
});

async function startPuzzleGame() {
    // Username sicherstellen
    if (typeof statsManager !== 'undefined') {
        try {
            await statsManager.ensureUsername();
        } catch (error) {
            console.warn('Username prompt failed:', error);
        }
    }

    // Start-Overlay ausblenden
    const startOverlay = document.getElementById('startOverlay');
    if (startOverlay) {
        startOverlay.classList.remove('active');
    }
    
    // Spiel-Container anzeigen
    document.getElementById('mainGameContainer').style.display = 'block';
    
    // Spiel initialisieren
    await loadAvailableImages();
    initDifficultySelector();
    initControls();
    displayImages();
}

async function loadAvailableImages() {
    try {
        // Liste alle Bilder im puzzle-Ordner
        const response = await fetch('/api/puzzle/images');
        if (response.ok) {
            availableImages = await response.json();
        } else {
            console.error('Fehler beim Laden der Bilder');
            availableImages = [];
        }
    } catch (error) {
        console.error('Fehler:', error);
        availableImages = [];
    }
}

function displayImages() {
    const selector = document.getElementById('imageSelector');
    selector.innerHTML = '';
    
    if (availableImages.length === 0) {
        selector.innerHTML = '<p style="color: #999; padding: 20px;">Keine Bilder gefunden</p>';
        return;
    }
    
    availableImages.forEach(img => {
        const option = document.createElement('div');
        option.className = 'image-option';
        option.style.backgroundImage = `url('${img.url}')`;
        option.title = img.name;
        option.onclick = () => selectImage(img, option);
        selector.appendChild(option);
    });
}

function initDifficultySelector() {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = parseInt(btn.dataset.difficulty);
            if (selectedImage) {
                initPuzzle();
            }
        });
    });
}

function selectImage(img, element) {
    document.querySelectorAll('.image-option').forEach(e => e.classList.remove('active'));
    element.classList.add('active');
    
    // Lade Bild um Dimensionen zu bekommen
    const tempImg = new Image();
    tempImg.onload = () => {
        selectedImage = {
            ...img,
            width: tempImg.width,
            height: tempImg.height,
            size: Math.min(tempImg.width, tempImg.height) // Kleinere Dimension = quadratische Basis
        };
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';
        initPuzzle();
    };
    tempImg.src = img.url;
}

function initPuzzle() {
    moves = 0;
    timeElapsed = 0;
    gameStarted = false;
    updateStats();
    clearInterval(timerInterval);
    
    // Erstelle Puzzle-State
    puzzleState = [];
    for (let row = 0; row < currentDifficulty; row++) {
        puzzleState[row] = [];
        for (let col = 0; col < currentDifficulty; col++) {
            puzzleState[row][col] = {
                correctRow: row,
                correctCol: col,
                currentRow: row,
                currentCol: col
            };
        }
    }
    
    // Letzte Kachel ist leer
    emptyPos = { row: currentDifficulty - 1, col: currentDifficulty - 1 };
    puzzleState[emptyPos.row][emptyPos.col].isEmpty = true;
    
    // Puzzle mischen
    shufflePuzzle();
    renderPuzzle();
}

function shufflePuzzle() {
    // Mische mit gültigen Zügen für Lösbarkeit
    const shuffleMoves = currentDifficulty * currentDifficulty * 50;
    for (let i = 0; i < shuffleMoves; i++) {
        const moveable = getMoveableTiles();
        if (moveable.length > 0) {
            const randomTile = moveable[Math.floor(Math.random() * moveable.length)];
            moveTile(randomTile.row, randomTile.col, false);
        }
    }
    // Reset counters nach Shuffle
    moves = 0;
    updateStats();
}

function renderPuzzle() {
    const grid = document.getElementById('puzzleGrid');
    const tileSize = Math.min(400, window.innerWidth - 80) / currentDifficulty;
    
    grid.style.gridTemplateColumns = `repeat(${currentDifficulty}, ${tileSize}px)`;
    grid.style.gridTemplateRows = `repeat(${currentDifficulty}, ${tileSize}px)`;
    grid.innerHTML = '';
    
    for (let row = 0; row < currentDifficulty; row++) {
        for (let col = 0; col < currentDifficulty; col++) {
            const tile = puzzleState[row][col];
            const div = document.createElement('div');
            div.className = 'puzzle-tile';
            div.dataset.row = row;
            div.dataset.col = col;
            
            if (tile.isEmpty) {
                div.classList.add('empty');
            } else {
                // Berechne quadratischen Ausschnitt (zentriert auf Bild)
                const imgSize = selectedImage.size || Math.min(selectedImage.width, selectedImage.height);
                const offsetX = (selectedImage.width - imgSize) / 2;
                const offsetY = (selectedImage.height - imgSize) / 2;
                
                // Skalierungsfaktor vom Original-Bild zu unserem Grid
                const scale = (currentDifficulty * tileSize) / imgSize;
                
                // Position dieses Tiles im Original-Bild
                const bgPosX = -(tile.correctCol * tileSize / scale + offsetX) * scale;
                const bgPosY = -(tile.correctRow * tileSize / scale + offsetY) * scale;
                
                div.style.backgroundImage = `url('${selectedImage.url}')`;
                div.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
                div.style.backgroundSize = `${selectedImage.width * scale}px ${selectedImage.height * scale}px`;
                
                // Click handler - nur für bewegbare Tiles
                if (isTileMoveable(row, col)) {
                    div.addEventListener('click', () => handleTileClick(row, col));
                }
                
                // Touch handlers
                div.addEventListener('touchstart', handleTouchStart, { passive: false });
                div.addEventListener('touchmove', handleTouchMove, { passive: false });
                div.addEventListener('touchend', handleTouchEnd, { passive: false });
            }
            
            // Highlight bewegbare Kacheln
            if (isTileMoveable(row, col)) {
                div.classList.add('moveable');
            }
            
            grid.appendChild(div);
        }
    }
}

function handleTileClick(row, col) {
    if (!gameStarted) startGame();
    if (isTileMoveable(row, col)) {
        moveTile(row, col, true);
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    touchStartPos = {
        row: parseInt(e.target.dataset.row),
        col: parseInt(e.target.dataset.col),
        time: Date.now()
    };
}

function handleTouchMove(e) {
    e.preventDefault();
}

function handleTouchEnd(e) {
    if (!touchStartPos) return;
    
    e.preventDefault();
    
    const row = touchStartPos.row;
    const col = touchStartPos.col;
    const touchDuration = Date.now() - touchStartPos.time;
    
    // Nur bei kurzem Tap (< 300ms) = Klick
    if (touchDuration < 300) {
        handleTileClick(row, col);
    }
    
    touchStartPos = null;
}

function isTileMoveable(row, col) {
    if (puzzleState[row][col].isEmpty) return false;
    
    // Prüfe ob angrenzend zu leerem Feld
    if (row > 0 && puzzleState[row - 1][col].isEmpty) return true;
    if (row < currentDifficulty - 1 && puzzleState[row + 1][col].isEmpty) return true;
    if (col > 0 && puzzleState[row][col - 1].isEmpty) return true;
    if (col < currentDifficulty - 1 && puzzleState[row][col + 1].isEmpty) return true;
    
    return false;
}

function getMoveableTiles() {
    const moveable = [];
    for (let row = 0; row < currentDifficulty; row++) {
        for (let col = 0; col < currentDifficulty; col++) {
            if (isTileMoveable(row, col)) {
                moveable.push({ row, col });
            }
        }
    }
    return moveable;
}

function moveTile(row, col, countMove) {
    // Finde leeres Feld
    let newRow = emptyPos.row;
    let newCol = emptyPos.col;
    
    // Tausche Kachel mit leerem Feld
    const temp = puzzleState[row][col];
    puzzleState[row][col] = puzzleState[newRow][newCol];
    puzzleState[newRow][newCol] = temp;
    
    // Update current positions
    puzzleState[row][col].currentRow = row;
    puzzleState[row][col].currentCol = col;
    puzzleState[newRow][newCol].currentRow = newRow;
    puzzleState[newRow][newCol].currentCol = newCol;
    
    emptyPos = { row, col };
    
    if (countMove) {
        moves++;
        updateStats();
        checkWin();
    }
    
    renderPuzzle();
}

function startGame() {
    gameStarted = true;
    timerInterval = setInterval(() => {
        timeElapsed++;
        updateStats();
    }, 1000);
}

function updateStats() {
    document.getElementById('movesDisplay').textContent = moves;
    
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    document.getElementById('timeDisplay').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function checkWin() {
    // Prüfe ob alle Kacheln an richtiger Position
    for (let row = 0; row < currentDifficulty; row++) {
        for (let col = 0; col < currentDifficulty; col++) {
            const tile = puzzleState[row][col];
            if (tile.correctRow !== row || tile.correctCol !== col) {
                return false;
            }
        }
    }
    
    // Gewonnen!
    clearInterval(timerInterval);
    showSuccessModal();
    return true;
}

async function showSuccessModal() {
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Punkteberechnung: Basis + Zeit-Bonus + Züge-Bonus
    const basePoints = currentDifficulty * currentDifficulty * 100; // 3x3=900, 4x4=1600, 5x5=2500
    const timeBonus = Math.max(0, Math.floor((300 - timeElapsed) / 2)); // Bis zu 150 Bonus für schnelle Zeit
    const optimalMoves = (currentDifficulty * currentDifficulty - 1) * 5; // Geschätzte optimale Züge
    const moveBonus = Math.max(0, Math.floor((optimalMoves - moves) * 5)); // Bonus für wenige Züge
    const score = basePoints + timeBonus + moveBonus;
    
    // Stats speichern
    await window.statsManager.saveStats('puzzle', score, timeElapsed);
    
    // Globales Game-Over-Overlay anzeigen
    await window.statsManager.showGameOverOverlay('puzzle', [
        {label: 'Schwierigkeit', value: `${currentDifficulty}x${currentDifficulty}`},
        {label: 'Zeit', value: timeString},
        {label: 'Züge', value: moves},
        {label: 'Punkte', value: score}
    ]);
    
    // Restart-Button Event
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.onclick = () => {
            const overlay = document.getElementById('gameoverOverlay');
            if (overlay) overlay.remove();
            if (selectedImage) initPuzzle();
        };
    }
}

function initControls() {
    document.getElementById('previewBtn').addEventListener('click', () => {
        if (selectedImage) {
            document.getElementById('previewImage').src = selectedImage.url;
            document.getElementById('previewModal').classList.add('active');
        }
    });
    
    document.getElementById('shuffleBtn').addEventListener('click', () => {
        showConfirmOverlay();
    });
}

function closePreview() {
    document.getElementById('previewModal').classList.remove('active');
}

function showConfirmOverlay() {
    // Overlay erstellen wenn nicht vorhanden
    let overlay = document.getElementById('confirmOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirmOverlay';
        overlay.className = 'game-overlay dark-theme';
        overlay.innerHTML = `
            <div class="overlay-content">
                <h2 style="margin-bottom: 20px;">🔄 Puzzle neu mischen?</h2>
                <p style="font-size: 1.1rem; margin-bottom: 30px; opacity: 0.9;">Dein aktueller Fortschritt geht verloren!</p>
                <div class="button-group">
                    <button onclick="confirmShuffle()" class="game-button">✅ Ja, neu mischen</button>
                    <button onclick="closeConfirmOverlay()" class="game-button secondary">❌ Abbrechen</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
}

function closeConfirmOverlay() {
    const overlay = document.getElementById('confirmOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function confirmShuffle() {
    closeConfirmOverlay();
    initPuzzle();
}

function playAgain() {
    document.getElementById('successModal').classList.remove('active');
    initPuzzle();
}


