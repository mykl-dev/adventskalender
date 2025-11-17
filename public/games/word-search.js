/* ========================================
   WÖRTER-SUCHRÄTSEL GAME
   ======================================== */

const GAME_NAME = 'word-search';
let gameState = {
    grid: [],
    words: [],
    foundWords: new Set(),
    score: 0,
    startTime: null,
    isSelecting: false,
    selectedCells: [],
    gridSize: { rows: 10, cols: 10 }
};

// Pool von 50+ Weihnachtswörtern
const WORD_POOL = [
    'WEIHNACHTEN', 'GESCHENK', 'BAUM', 'STERN', 'ENGEL',
    'KRIPPE', 'KERZE', 'LICHT', 'ADVENT', 'NIKOLAUS',
    'RENTIER', 'SCHLITTEN', 'SCHNEE', 'WINTER', 'KUGEL',
    'LAMETTA', 'CHRISTKIND', 'TANNENBAUM', 'GLOCKE', 'STOLLEN',
    'LEBKUCHEN', 'PLAETZCHEN', 'ZIMT', 'NUSS', 'MANDEL',
    'APFEL', 'ORANGE', 'NELKE', 'WEIHRAUCH', 'MYRRHE',
    'GOLD', 'SILBER', 'GIRLANDE', 'MISTEL', 'EISZAPFEN',
    'SCHNEEMANN', 'FLOCKE', 'FROST', 'KALT', 'WARM',
    'FAMILIE', 'LIEBE', 'FRIEDEN', 'FREUDE', 'HOFFNUNG',
    'WUNSCH', 'ZAUBER', 'MAGIE', 'FEST', 'FEIER',
    'SINGEN', 'TANZEN', 'ESSEN', 'TRINKEN', 'GLANZ',
    'SCHMUCK', 'BAND', 'SCHLEIFE', 'PAKET', 'KARTE'
];

// ========================================
// INITIALISIERUNG
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', restartGame);
});

async function startGame() {
    // Username sicherstellen
    if (typeof statsManager !== 'undefined') {
        try {
            await statsManager.ensureUsername();
        } catch (error) {
            console.warn('Username prompt failed:', error);
        }
    }

    document.getElementById('startOverlay').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    // Responsive Grid Size
    const isMobile = window.innerWidth < 600;
    gameState.gridSize = isMobile ? { rows: 8, cols: 8 } : { rows: 10, cols: 10 };

    initGame();
}

function initGame() {
    gameState = {
        grid: [],
        words: [],
        foundWords: new Set(),
        score: 0,
        startTime: Date.now(),
        isSelecting: false,
        selectedCells: [],
        gridSize: gameState.gridSize
    };

    // Wähle 5 zufällige Wörter
    selectRandomWords(5);
    
    // Erstelle leeres Grid
    createEmptyGrid();
    
    // Platziere Wörter
    placeWords();
    
    // Fülle Rest mit zufälligen Buchstaben
    fillEmptySpaces();
    
    // Rendere Grid
    renderGrid();
    
    // Rendere Wörterliste
    renderWordsList();
    
    // Starte Timer
    startTimer();
    
    // Update HUD
    updateHUD();
}

function selectRandomWords(count) {
    const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
    const maxSize = Math.min(gameState.gridSize.rows, gameState.gridSize.cols);
    
    // Wähle Wörter die ins Grid passen
    gameState.words = [];
    for (let word of shuffled) {
        if (word.length <= maxSize && gameState.words.length < count) {
            gameState.words.push(word);
        }
        if (gameState.words.length === count) break;
    }
}

function createEmptyGrid() {
    gameState.grid = Array(gameState.gridSize.rows)
        .fill(null)
        .map(() => Array(gameState.gridSize.cols).fill(null));
}

function placeWords() {
    const directions = [
        { dr: 0, dc: 1 },   // horizontal →
        { dr: 0, dc: -1 },  // horizontal ←
        { dr: 1, dc: 0 },   // vertikal ↓
        { dr: -1, dc: 0 },  // vertikal ↑
        { dr: 1, dc: 1 },   // diagonal ↘
        { dr: -1, dc: -1 }, // diagonal ↖
        { dr: 1, dc: -1 },  // diagonal ↙
        { dr: -1, dc: 1 }   // diagonal ↗
    ];

    for (let word of gameState.words) {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            attempts++;
            
            // Zufällige Startposition
            const row = Math.floor(Math.random() * gameState.gridSize.rows);
            const col = Math.floor(Math.random() * gameState.gridSize.cols);
            
            // Zufällige Richtung
            const dir = directions[Math.floor(Math.random() * directions.length)];
            
            // Prüfe ob Wort passt
            if (canPlaceWord(word, row, col, dir)) {
                placeWord(word, row, col, dir);
                placed = true;
            }
        }
    }
}

function canPlaceWord(word, startRow, startCol, dir) {
    const { rows, cols } = gameState.gridSize;
    
    for (let i = 0; i < word.length; i++) {
        const r = startRow + i * dir.dr;
        const c = startCol + i * dir.dc;
        
        // Außerhalb des Grids?
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
            return false;
        }
        
        // Zelle schon belegt mit anderem Buchstaben?
        if (gameState.grid[r][c] !== null && gameState.grid[r][c] !== word[i]) {
            return false;
        }
    }
    
    return true;
}

function placeWord(word, startRow, startCol, dir) {
    const positions = [];
    
    for (let i = 0; i < word.length; i++) {
        const r = startRow + i * dir.dr;
        const c = startCol + i * dir.dc;
        gameState.grid[r][c] = word[i];
        positions.push({ row: r, col: c });
    }
    
    // Speichere Positionen für Validierung
    const wordIndex = gameState.words.indexOf(word);
    gameState.words[wordIndex] = { text: word, positions };
}

function fillEmptySpaces() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let r = 0; r < gameState.gridSize.rows; r++) {
        for (let c = 0; c < gameState.gridSize.cols; c++) {
            if (gameState.grid[r][c] === null) {
                gameState.grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
}

// ========================================
// RENDERING
// ========================================
function renderGrid() {
    const container = document.getElementById('gridContainer');
    container.innerHTML = '';
    
    const gridElement = document.createElement('div');
    gridElement.className = 'grid';
    gridElement.style.gridTemplateColumns = `repeat(${gameState.gridSize.cols}, 1fr)`;
    
    for (let r = 0; r < gameState.gridSize.rows; r++) {
        for (let c = 0; c < gameState.gridSize.cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = gameState.grid[r][c];
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            gridElement.appendChild(cell);
        }
    }
    
    container.appendChild(gridElement);
    
    // Event Listeners für Drag Selection
    setupDragSelection(gridElement);
}

function setupDragSelection(gridElement) {
    const cells = gridElement.querySelectorAll('.cell');
    
    // Mouse Events
    gridElement.addEventListener('mousedown', handleSelectionStart);
    gridElement.addEventListener('mousemove', handleSelectionMove);
    gridElement.addEventListener('mouseup', handleSelectionEnd);
    gridElement.addEventListener('mouseleave', handleSelectionEnd);
    
    // Touch Events
    gridElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    gridElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gridElement.addEventListener('touchend', handleSelectionEnd);
}

function handleSelectionStart(e) {
    if (e.target.classList.contains('cell')) {
        gameState.isSelecting = true;
        gameState.selectedCells = [];
        addCellToSelection(e.target);
    }
}

function handleSelectionMove(e) {
    if (!gameState.isSelecting) return;
    
    const cell = document.elementFromPoint(e.clientX, e.clientY);
    if (cell && cell.classList.contains('cell')) {
        addCellToSelection(cell);
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (cell && cell.classList.contains('cell')) {
        gameState.isSelecting = true;
        gameState.selectedCells = [];
        addCellToSelection(cell);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!gameState.isSelecting) return;
    
    const touch = e.touches[0];
    const cell = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (cell && cell.classList.contains('cell')) {
        addCellToSelection(cell);
    }
}

function handleSelectionEnd() {
    if (!gameState.isSelecting) return;
    
    gameState.isSelecting = false;
    validateSelection();
}

function addCellToSelection(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    // Verhindere Duplikate
    const alreadySelected = gameState.selectedCells.some(
        c => c.row === row && c.col === col
    );
    
    if (!alreadySelected) {
        gameState.selectedCells.push({ row, col, element: cell });
        cell.classList.add('selected');
    }
}

function validateSelection() {
    const selectedWord = gameState.selectedCells
        .map(c => gameState.grid[c.row][c.col])
        .join('');
    
    // Prüfe ob Wort gefunden
    let found = false;
    
    for (let wordObj of gameState.words) {
        if (typeof wordObj === 'string') continue;
        
        const { text, positions } = wordObj;
        
        // Bereits gefunden?
        if (gameState.foundWords.has(text)) continue;
        
        // Prüfe vorwärts und rückwärts
        if (selectedWord === text || selectedWord === text.split('').reverse().join('')) {
            // Prüfe ob Positionen übereinstimmen
            if (positionsMatch(gameState.selectedCells, positions)) {
                found = true;
                handleCorrectWord(text, positions);
                break;
            }
        }
    }
    
    if (!found) {
        handleIncorrectSelection();
    }
}

function positionsMatch(selected, wordPositions) {
    if (selected.length !== wordPositions.length) return false;
    
    // Vorwärts prüfen
    let forwardMatch = true;
    for (let i = 0; i < selected.length; i++) {
        if (selected[i].row !== wordPositions[i].row || 
            selected[i].col !== wordPositions[i].col) {
            forwardMatch = false;
            break;
        }
    }
    
    if (forwardMatch) return true;
    
    // Rückwärts prüfen
    let backwardMatch = true;
    for (let i = 0; i < selected.length; i++) {
        const reverseIndex = selected.length - 1 - i;
        if (selected[i].row !== wordPositions[reverseIndex].row || 
            selected[i].col !== wordPositions[reverseIndex].col) {
            backwardMatch = false;
            break;
        }
    }
    
    return backwardMatch;
}

function handleCorrectWord(word, positions) {
    gameState.foundWords.add(word);
    gameState.score += word.length * 10;
    
    // Markiere Zellen als gefunden
    positions.forEach(pos => {
        const cell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            cell.classList.remove('selected');
            cell.classList.add('found', 'correct-animation');
        }
    });
    
    // Markiere Wort in Liste
    const wordElement = document.querySelector(`[data-word="${word}"]`);
    if (wordElement) {
        wordElement.classList.add('found');
    }
    
    updateHUD();
    
    // Prüfe ob alle Wörter gefunden
    if (gameState.foundWords.size === gameState.words.length) {
        setTimeout(() => endGame(), 1000);
    }
    
    // Entferne Selection
    setTimeout(() => {
        gameState.selectedCells.forEach(c => {
            if (c.element) c.element.classList.remove('selected');
        });
        gameState.selectedCells = [];
    }, 500);
}

function handleIncorrectSelection() {
    // Negative Animation
    gameState.selectedCells.forEach(c => {
        if (c.element) {
            c.element.classList.add('incorrect-animation');
            setTimeout(() => {
                c.element.classList.remove('selected', 'incorrect-animation');
            }, 500);
        }
    });
    
    gameState.selectedCells = [];
}

function renderWordsList() {
    const container = document.getElementById('wordsToFind');
    container.innerHTML = '';
    
    gameState.words.forEach(wordObj => {
        const word = typeof wordObj === 'string' ? wordObj : wordObj.text;
        const div = document.createElement('div');
        div.className = 'word-item';
        div.textContent = word;
        div.dataset.word = word;
        container.appendChild(div);
    });
}

// ========================================
// HUD & TIMER
// ========================================
let timerInterval = null;

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        updateTimer();
    }, 1000);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('timer').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateHUD() {
    document.getElementById('wordsCounter').textContent = 
        `${gameState.foundWords.size}/${gameState.words.length}`;
    document.getElementById('score').textContent = gameState.score;
}

// ========================================
// GAME END
// ========================================
async function endGame() {
    if (timerInterval) clearInterval(timerInterval);
    
    const playTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    
    // Stats anzeigen
    document.getElementById('finalWordsFound').textContent = gameState.foundWords.size;
    document.getElementById('finalTime').textContent = `${playTime}s`;
    document.getElementById('finalScore').textContent = gameState.score;
    
    // Speichern
    if (typeof statsManager !== 'undefined') {
        try {
            console.log('Saving score:', GAME_NAME, gameState.score, playTime);
            const saved = await statsManager.saveStats(
                GAME_NAME,
                gameState.score,
                playTime
            );
            console.log('Score saved:', saved);
            
            // Top 3 laden
            await loadTop3();
        } catch (error) {
            console.error('Error saving score:', error);
        }
    } else {
        console.error('StatsManager not available');
    }
    
    // Overlay anzeigen
    document.getElementById('gameoverOverlay').style.display = 'flex';
}

async function loadTop3() {
    const top3List = document.getElementById('top3List');
    
    try {
        console.log('Loading top 3 for:', GAME_NAME);
        const top3 = await statsManager.getTop3(GAME_NAME);
        console.log('Top 3 loaded:', top3);
        
        if (!top3 || top3.length === 0) {
            top3List.innerHTML = '<div class="no-scores">Noch keine Highscores</div>';
            return;
        }
        
        const medals = ['🥇', '🥈', '🥉'];
        top3List.innerHTML = top3.map((entry, index) => `
            <div class="top3-item ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}">
                <span class="top3-rank">${medals[index]}</span>
                <span class="top3-name">${entry.username || 'Anonym'}</span>
                <span class="top3-score">${entry.highscore || entry.score || 0}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading top 3:', error);
        top3List.innerHTML = '<div class="no-scores">Fehler beim Laden</div>';
    }
}

function restartGame() {
    document.getElementById('gameoverOverlay').style.display = 'none';
    initGame();
}
