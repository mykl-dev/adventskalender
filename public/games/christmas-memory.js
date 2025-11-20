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

    async init() {
        this.grid = document.getElementById('memory-grid');
        this.loadHighscore();
        await this.showStartOverlay();
    }

    async loadHighscore() {
        if (typeof statsManager === 'undefined') return;
        
        const stats = await statsManager.getGameStats(this.gameName);
        if (stats && stats.highscore) {
            document.getElementById('header-highscore').textContent = stats.highscore;
        }
    }

    async showStartOverlay() {
        // Globales Start-Overlay anzeigen
        await window.statsManager.showGameStartOverlay('christmas-memory');
        
        // Warten auf Start-Button-Klick
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.onclick = () => {
                // Overlay entfernen und Spiel starten
                const overlay = document.getElementById('startOverlay');
                if (overlay) overlay.remove();
                this.start();
            };
        }
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
                await window.statsManager.saveStats(this.gameName, result.score, result.playTime);
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
        // Badges für zusätzliche Info
        let bonusInfo = [];
        if (result.perfectMoves) {
            bonusInfo.push('🌟 Perfekte Züge!');
        }
        if (result.speedBonus > 0) {
            bonusInfo.push(`⚡ Speed-Bonus: +${result.speedBonus}`);
        }
        
        // Globales Game-Over-Overlay anzeigen
        await window.statsManager.showGameOverOverlay('christmas-memory', [
            {label: 'Punkte', value: result.score},
            {label: 'Züge', value: result.moves},
            {label: 'Zeit', value: `${result.playTime}s`},
            ...(bonusInfo.length > 0 ? [{label: bonusInfo.join(' '), value: ''}] : [])
        ]);
        
        // Restart-Button Event
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.onclick = () => {
                const overlay = document.getElementById('gameoverOverlay');
                if (overlay) overlay.remove();
                location.reload();
            };
        }
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
