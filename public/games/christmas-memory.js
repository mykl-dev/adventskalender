// ========================================
// Christmas Memory Game
// ========================================

class ChristmasMemoryGame {
    constructor() {
        this.cards = ['🎅', '🎄', '🎁', '⭐', '🔔', '🕯️', '🦌', '⛄'];
        this.gameCards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.gameActive = false;
        this.grid = null;
        this.canFlip = true;
        this.gameName = 'christmas-memory';
        this.startTime = null;
        
        this.init();
    }

    init() {
        const root = document.getElementById('game-root');
        
        root.innerHTML = `
            <div class="game-stats">
                <div class="stat-box">
                    <div class="stat-label">🎯 Züge</div>
                    <div class="stat-value" id="memory-moves">0</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">✨ Paare</div>
                    <div class="stat-value" id="memory-pairs">0/8</div>
                </div>
            </div>

            <div class="memory-container">
                <div class="memory-instructions" id="memory-instructions">
                    <h3>🎅 Christmas Memory 🎄</h3>
                    <p>Finde alle passenden Weihnachts-Paare!</p>
                    <p>🎯 Je weniger Züge, desto besser!</p>
                </div>
                
                <div class="memory-grid" id="memory-grid"></div>
                
                <button class="game-button" id="memory-start-button">Spiel starten! 🎮</button>
            </div>
        `;

        this.grid = document.getElementById('memory-grid');
        document.getElementById('memory-start-button').addEventListener('click', () => this.start());
        this.loadHighscore();
        this.showStartOverlay();
    }

    async loadHighscore() {
        if (typeof statsManager === 'undefined') return;
        
        const stats = await statsManager.getGameStats(this.gameName);
        if (stats && stats.highscore) {
            document.getElementById('header-highscore').textContent = stats.highscore;
        }
    }

    showStartOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'game-instructions-overlay';
        overlay.id = 'game-instructions-overlay';
        overlay.innerHTML = `
            <div class="instructions-content">
                <h2>🎄 Christmas Memory 🎁</h2>
                <div class="instruction-items">
                    <div class="instruction-item">
                        <span class="item-icon">🎯</span>
                        <span>Finde alle passenden Weihnachts-Paare!</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">🃏</span>
                        <span>Klicke auf Karten um sie umzudrehen</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">✨</span>
                        <span>Merke dir die Positionen der Symbole</span>
                    </div>
                    <div class="instruction-item">
                        <span class="item-icon">⭐</span>
                        <span>Je weniger Züge, desto besser!</span>
                    </div>
                </div>
                <p class="difficulty-info">🎅 8 Paare warten auf dich!</p>
                <button class="instruction-ok-button" id="instruction-ok-button">
                    ✓ Los geht's!
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Button Event Listener
        document.getElementById('instruction-ok-button').addEventListener('click', () => {
            overlay.remove();
            // Show start button pulsing
            const startBtn = document.getElementById('memory-start-button');
            if (startBtn) {
                startBtn.classList.add('pulse');
            }
        });
    }

    start() {
        this.gameActive = true;
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.canFlip = true;
        this.startTime = Date.now();

        // Reset Stats
        document.getElementById('memory-moves').textContent = '0';
        document.getElementById('memory-pairs').textContent = '0/8';

        // Hide button and instructions
        document.getElementById('memory-start-button').style.display = 'none';
        const instructions = document.getElementById('memory-instructions');
        if (instructions) instructions.style.display = 'none';

        // Create shuffled cards
        this.gameCards = [...this.cards, ...this.cards];
        this.shuffleCards();
        this.renderCards();
    }

    shuffleCards() {
        for (let i = this.gameCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.gameCards[i], this.gameCards[j]] = [this.gameCards[j], this.gameCards[i]];
        }
    }

    renderCards() {
        this.grid.innerHTML = '';

        this.gameCards.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            card.dataset.symbol = symbol;
            card.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-front">?</div>
                    <div class="memory-card-back">${symbol}</div>
                </div>
            `;

            card.addEventListener('click', () => this.flipCard(card));
            this.grid.appendChild(card);
        });
    }

    flipCard(card) {
        if (!this.gameActive || !this.canFlip) return;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
        if (this.flippedCards.length >= 2) return;

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            document.getElementById('memory-moves').textContent = this.moves;
            this.canFlip = false;

            setTimeout(() => this.checkMatch(), 1000);
        }
    }

    checkMatch() {
        const [first, second] = this.flippedCards;
        const firstSymbol = first.dataset.symbol;
        const secondSymbol = second.dataset.symbol;

        if (firstSymbol === secondSymbol) {
            // Match gefunden
            first.classList.add('matched');
            second.classList.add('matched');
            this.matchedPairs++;
            document.getElementById('memory-pairs').textContent = `${this.matchedPairs}/8`;

            if (this.matchedPairs === 8) {
                setTimeout(() => this.endGame(), 800);
            }
        } else {
            // Kein Match
            first.classList.remove('flipped');
            second.classList.remove('flipped');
        }

        this.flippedCards = [];
        this.canFlip = true;
    }

    calculateScore() {
        // Basis-Punkte: 1000
        let score = 1000;
        
        // Züge-Abzug: Perfekt = 16 Züge (8 Paare * 2), jeder zusätzliche Zug kostet Punkte
        const perfectMoves = 16;
        const extraMoves = Math.max(0, this.moves - perfectMoves);
        const movePenalty = extraMoves * 20; // 20 Punkte pro extra Zug
        score -= movePenalty;
        
        // Zeit-Bonus/Malus: Schneller = mehr Punkte
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        if (playTime <= 30) {
            score += 200; // Bonus für sehr schnell
        } else if (playTime <= 60) {
            score += 100; // Bonus für schnell
        } else if (playTime > 120) {
            score -= Math.floor((playTime - 120) * 2); // Abzug für langsam
        }
        
        // Mindestpunktzahl
        score = Math.max(100, score);
        
        return {
            score: score,
            playTime: playTime,
            moves: this.moves,
            perfectMoves: this.moves === perfectMoves,
            speedBonus: playTime <= 30 ? 200 : playTime <= 60 ? 100 : 0
        };
    }

    async endGame() {
        this.gameActive = false;

        const result = this.calculateScore();
        
        // Save stats
        if (typeof statsManager !== 'undefined') {
            try {
                await statsManager.saveStats(this.gameName, result.score, result.playTime);
                await this.loadHighscore();
            } catch (error) {
                console.error('Fehler beim Speichern der Stats:', error);
            }
        }

        // Show game over after short delay
        setTimeout(() => {
            this.showGameOver(result);
        }, 500);
    }

    async showGameOver(result) {
        // Load highscores
        let highscoresHTML = '<div class="no-highscores">Noch keine Highscores vorhanden</div>';
        
        if (typeof statsManager !== 'undefined') {
            const highscores = await statsManager.getHighscores(this.gameName, 10);
            if (highscores && highscores.length > 0) {
                highscoresHTML = highscores.map((entry, index) => `
                    <li class="highscore-item">
                        <span class="highscore-rank">${index + 1}.</span>
                        <span class="highscore-name">${entry.username}</span>
                        <span class="highscore-score">${entry.highscore} Punkte</span>
                    </li>
                `).join('');
            }
        }

        // Bonus-Badges
        let badges = '';
        if (result.perfectMoves) {
            badges += '<div class="bonus-badge">🌟 Perfekte Züge!</div>';
        }
        if (result.speedBonus > 0) {
            badges += `<div class="bonus-badge">⚡ Speed-Bonus: +${result.speedBonus}</div>`;
        }

        // Show game over overlay
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-content">
                <h2>🎉 Alle Paare gefunden! 🎄</h2>
                <div class="game-over-stats">
                    <div class="game-over-stat-item">
                        <div class="game-over-stat-label">Punkte</div>
                        <div class="game-over-stat-value">${result.score}</div>
                    </div>
                    <div class="score-breakdown">
                        <div class="breakdown-item">
                            <span>🎯 Züge: ${result.moves}</span>
                        </div>
                        <div class="breakdown-item">
                            <span>⏱️ Zeit: ${result.playTime}s</span>
                        </div>
                    </div>
                    ${badges ? `<div class="bonus-badges">${badges}</div>` : ''}
                    <div class="game-over-message">${this.getScoreMessage(result)}</div>
                </div>
                <div class="game-over-highscores">
                    <h3>🏆 Top 10 Highscores</h3>
                    <ul class="highscore-list">
                        ${highscoresHTML}
                    </ul>
                </div>
                <div class="game-over-buttons">
                    <button class="game-over-button button-primary" onclick="game.restart()">🔄 Nochmal spielen</button>
                    <button class="game-over-button button-secondary" onclick="window.location.href='/'">🏠 Zurück zum Kalender</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    restart() {
        // Remove overlay
        const overlay = document.querySelector('.game-over-overlay');
        if (overlay) overlay.remove();

        // Show button again
        document.getElementById('memory-start-button').style.display = 'block';
        document.getElementById('memory-start-button').textContent = 'Nochmal spielen! 🔄';
        
        const instructions = document.getElementById('memory-instructions');
        if (instructions) instructions.style.display = 'block';
    }

    getScoreMessage(result) {
        if (result.perfectMoves && result.speedBonus === 200) {
            return '🌟 PERFEKT! Unglaublich - 16 Züge in unter 30 Sekunden!';
        }
        if (result.perfectMoves) {
            return '⭐ Perfekt gespielt! Keine zusätzlichen Züge!';
        }
        if (result.speedBonus === 200) {
            return '⚡ Blitzschnell! Unter 30 Sekunden!';
        }
        if (result.score >= 900) {
            return '✨ Ausgezeichnet! Sehr effizient!';
        }
        if (result.score >= 700) {
            return '🎄 Gut gemacht! Mit etwas Übung wird es noch besser!';
        }
        return '🎁 Geschafft! Versuch es nochmal für mehr Punkte!';
    }
}

// Initialize game when DOM is ready
let game;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        game = new ChristmasMemoryGame();
    });
} else {
    game = new ChristmasMemoryGame();
}
