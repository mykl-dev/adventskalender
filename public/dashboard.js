// Dashboard Logic
class DashboardManager {
    constructor() {
        this.games = [];
        this.allScores = {};
        this.init();
    }

    async init() {
        try {
            // Lade Spieleliste dynamisch von der API
            await this.loadGames();
            
            // Lade Rangliste von der API (effizienter als alle Einzelscores)
            await this.loadGlobalLeaderboard();
            
            // Lade Scores für alle Spiele
            await this.loadAllScores();
            
            // Rendere alles
            this.renderOverallLeaderboard();
            this.renderGamesOverview();
            this.checkWinnerDate();
            this.updateLastUpdateTime();
            
            // Verstecke Loading, zeige Content
            document.getElementById('loading-state').style.display = 'none';
            document.getElementById('leaderboard-section').style.display = 'block';
            document.getElementById('games-section').style.display = 'block';
        } catch (error) {
            console.error('Fehler beim Laden des Dashboards:', error);
            document.getElementById('loading-state').innerHTML = `
                <div class="loading-spinner">❌</div>
                <p style="color: #e74c3c;">Fehler beim Laden der Daten. Bitte Server überprüfen.</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">${error.message}</p>
            `;
        }
    }

    async loadGames() {
        try {
            console.log('Lade Spieleliste von API...');
            const response = await fetch('/api/games?active=true');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.games = data.games || [];
            console.log('Geladene Spiele:', this.games);
        } catch (error) {
            console.error('Fehler beim Laden der Spiele:', error);
            throw new Error('Konnte Spieleliste nicht laden');
        }
    }

    async loadGlobalLeaderboard() {
        try {
            console.log('Lade globale Rangliste von API...');
            const response = await fetch('/api/leaderboard/global');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.globalLeaderboard = data.leaderboard || [];
            console.log('Globale Rangliste:', this.globalLeaderboard);
        } catch (error) {
            console.error('Fehler beim Laden der Rangliste:', error);
            this.globalLeaderboard = [];
        }
    }

    async loadAllScores() {
        // Lade Scores von der API für jedes Spiel
        const promises = this.games.map(game => this.loadGameScores(game.id));
        const results = await Promise.all(promises);
        
        this.games.forEach((game, index) => {
            this.allScores[game.id] = results[index];
        });
    }

    async loadGameScores(gameKey) {
        try {
            console.log(`Lade Scores für ${gameKey}...`);
            const response = await fetch(`/api/stats/${gameKey}/all`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`${gameKey} API Response:`, data);
            
            // Konvertiere API-Format zu unserem Format
            const scores = (data.allScores || []).map(entry => ({
                username: entry.username,
                highscore: entry.highscore || entry.score || 0,
                score: entry.highscore || entry.score || 0,
                playTime: entry.playTime || 0,
                timestamp: entry.timestamp || Date.now()
            }));
            
            console.log(`${gameKey} verarbeitete Scores:`, scores);
            return scores;
        } catch (error) {
            console.warn(`Could not load scores for ${gameKey} from API:`, error);
            return [];
        }
    }

    renderOverallLeaderboard() {
        const container = document.getElementById('overall-leaderboard');
        
        // Verwende globale Rangliste von API (bereits sortiert)
        const playerStats = this.globalLeaderboard;

        if (playerStats.length === 0) {
            container.innerHTML = `
                <div class="no-scores">
                    <p>Noch keine Spieler vorhanden. Spiele ein paar Runden! 🎮</p>
                </div>
            `;
            return;
        }

        container.innerHTML = playerStats.map((player, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            return `
                <div class="player-card ${rankClass}">
                    <div class="player-rank">${index + 1}</div>
                    <div class="player-info">
                        <div class="player-name">${this.escapeHtml(player.username || player.name)}</div>
                        <div class="player-achievements">
                            <div class="achievement">
                                <span class="achievement-icon">🥇</span>
                                <span>${player.firstPlaces}x 1. Platz</span>
                            </div>
                            <div class="achievement">
                                <span class="achievement-icon">🥈</span>
                                <span>${player.secondPlaces}x 2. Platz</span>
                            </div>
                            <div class="achievement">
                                <span class="achievement-icon">🥉</span>
                                <span>${player.thirdPlaces}x 3. Platz</span>
                            </div>
                            <div class="achievement">
                                <span class="achievement-icon">⭐</span>
                                <span>${player.totalScore.toLocaleString()} Punkte</span>
                            </div>
                            <div class="achievement">
                                <span class="achievement-icon">🎮</span>
                                <span>${player.gamesPlayed} Spiele</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderGamesOverview() {
        const container = document.getElementById('games-overview');
        
        container.innerHTML = this.games.map(game => {
            const scores = this.allScores[game.id] || [];
            // Sortiere nach highscore (bereits von API sortiert, aber sicherheitshalber nochmal)
            const sortedScores = [...scores]
                .sort((a, b) => (b.highscore || 0) - (a.highscore || 0))
                .slice(0, 3);

            return `
                <div class="game-card">
                    <div class="game-header">
                        <div class="game-icon">${game.icon}</div>
                        <div class="game-title">${game.name}</div>
                    </div>
                    <div class="game-top3">
                        ${sortedScores.length > 0 ? this.renderTop3(sortedScores, game) : 
                          '<div class="no-scores">Noch keine Highscores vorhanden</div>'}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderTop3(scores, game) {
        const medals = ['🥇', '🥈', '🥉'];
        return scores.map((entry, index) => {
            const score = entry.highscore || 0;
            const scoreDisplay = game.scoreUnit ? `${score.toLocaleString()}${game.scoreUnit}` : score.toLocaleString();
            
            return `
                <div class="top-player">
                    <div class="top-player-left">
                        <span class="top-medal">${medals[index]}</span>
                        <span class="top-player-name">${this.escapeHtml(entry.username)}</span>
                    </div>
                    <span class="top-player-score">${scoreDisplay}</span>
                </div>
            `;
        }).join('');
    }

    checkWinnerDate() {
        const now = new Date();
        const christmasEve = new Date(now.getFullYear(), 11, 24); // 24. Dezember
        
        // Zeige Gewinner ab 24.12.
        if (now >= christmasEve) {
            this.showWinner();
        }
    }

    showWinner() {
        if (!this.globalLeaderboard || this.globalLeaderboard.length === 0) return;

        const winner = this.globalLeaderboard[0];
        const winnerSection = document.getElementById('winner-section');
        const winnerName = document.getElementById('winner-name');
        const winnerStats = document.getElementById('winner-stats');

        winnerName.textContent = winner.username;
        winnerStats.innerHTML = `
            ${winner.firstPlaces} 🥇 | ${winner.secondPlaces} 🥈 | ${winner.thirdPlaces} 🥉
            <br>
            ${winner.totalScore.toLocaleString()} Gesamtpunkte
        `;

        winnerSection.style.display = 'block';
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('last-update').textContent = timeString;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});
