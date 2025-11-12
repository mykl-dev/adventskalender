// Dashboard Logic
class DashboardManager {
    constructor() {
        this.games = [
            { id: 'gift-catcher', name: 'Geschenke Fangen', icon: '🎁', key: 'giftCatcher' },
            { id: 'snowflake-catcher', name: 'Schneeflocken Fangen', icon: '❄️', key: 'snowflakeCatcher' },
            { id: 'santa-launcher', name: 'Santa Launcher', icon: '🎯', key: 'santaLauncher' },
            { id: 'flappy-santa', name: 'Flappy Santa', icon: '🛷', key: 'flappySanta' },
            // Weitere Spiele können hier hinzugefügt werden
        ];
        this.init();
    }

    init() {
        this.loadAllScores();
        this.renderOverallLeaderboard();
        this.renderGamesOverview();
        this.checkWinnerDate();
        this.updateLastUpdateTime();
    }

    loadAllScores() {
        this.allScores = {};
        this.games.forEach(game => {
            const scores = this.loadGameScores(game.key);
            this.allScores[game.key] = scores;
        });
    }

    loadGameScores(gameKey) {
        try {
            const scores = localStorage.getItem(`${gameKey}Scores`);
            return scores ? JSON.parse(scores) : [];
        } catch (error) {
            console.warn(`Could not load scores for ${gameKey}:`, error);
            return [];
        }
    }

    calculatePlayerStats() {
        const playerStats = {};

        // Durchlaufe alle Spiele und sammle Statistiken
        this.games.forEach(game => {
            const scores = this.allScores[game.key] || [];
            
            // Top 3 pro Spiel
            const sortedScores = [...scores].sort((a, b) => b.score - a.score);
            
            sortedScores.forEach((entry, index) => {
                if (!playerStats[entry.name]) {
                    playerStats[entry.name] = {
                        name: entry.name,
                        firstPlaces: 0,
                        secondPlaces: 0,
                        thirdPlaces: 0,
                        totalScore: 0,
                        gamesPlayed: 0,
                        gameDetails: {}
                    };
                }

                // Zähle Platzierungen (nur die beste Platzierung pro Spiel)
                if (index === 0) playerStats[entry.name].firstPlaces++;
                else if (index === 1) playerStats[entry.name].secondPlaces++;
                else if (index === 2) playerStats[entry.name].thirdPlaces++;

                playerStats[entry.name].totalScore += entry.score;
                playerStats[entry.name].gamesPlayed++;
                
                // Speichere beste Platzierung für dieses Spiel
                if (!playerStats[entry.name].gameDetails[game.key] || 
                    entry.score > playerStats[entry.name].gameDetails[game.key].score) {
                    playerStats[entry.name].gameDetails[game.key] = {
                        score: entry.score,
                        rank: index + 1,
                        game: game.name
                    };
                }
            });
        });

        return Object.values(playerStats);
    }

    renderOverallLeaderboard() {
        const container = document.getElementById('overall-leaderboard');
        const playerStats = this.calculatePlayerStats();

        // Sortiere nach: 1. Plätze > 2. Plätze > 3. Plätze > Gesamtpunkte
        playerStats.sort((a, b) => {
            if (b.firstPlaces !== a.firstPlaces) return b.firstPlaces - a.firstPlaces;
            if (b.secondPlaces !== a.secondPlaces) return b.secondPlaces - a.secondPlaces;
            if (b.thirdPlaces !== a.thirdPlaces) return b.thirdPlaces - a.thirdPlaces;
            return b.totalScore - a.totalScore;
        });

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
                        <div class="player-name">${this.escapeHtml(player.name)}</div>
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
            const scores = this.allScores[game.key] || [];
            const sortedScores = [...scores]
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

            return `
                <div class="game-card">
                    <div class="game-header">
                        <div class="game-icon">${game.icon}</div>
                        <div class="game-title">${game.name}</div>
                    </div>
                    <div class="game-top3">
                        ${sortedScores.length > 0 ? this.renderTop3(sortedScores) : 
                          '<div class="no-scores">Noch keine Highscores vorhanden</div>'}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderTop3(scores) {
        const medals = ['🥇', '🥈', '🥉'];
        return scores.map((entry, index) => `
            <div class="top-player">
                <div class="top-player-left">
                    <span class="top-medal">${medals[index]}</span>
                    <span class="top-player-name">${this.escapeHtml(entry.name)}</span>
                </div>
                <span class="top-player-score">${entry.score.toLocaleString()}</span>
            </div>
        `).join('');
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
        const playerStats = this.calculatePlayerStats();
        
        if (playerStats.length === 0) return;

        // Sortiere wie in der Gesamtrangliste
        playerStats.sort((a, b) => {
            if (b.firstPlaces !== a.firstPlaces) return b.firstPlaces - a.firstPlaces;
            if (b.secondPlaces !== a.secondPlaces) return b.secondPlaces - a.secondPlaces;
            if (b.thirdPlaces !== a.thirdPlaces) return b.thirdPlaces - a.thirdPlaces;
            return b.totalScore - a.totalScore;
        });

        const winner = playerStats[0];
        const winnerSection = document.getElementById('winner-section');
        const winnerName = document.getElementById('winner-name');
        const winnerStats = document.getElementById('winner-stats');

        winnerName.textContent = winner.name;
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
