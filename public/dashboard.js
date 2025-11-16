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
        const currentUser = localStorage.getItem('username') || '';
        
        // Filtere nur Spiele die gespielt wurden (haben Scores)
        const playedGames = this.games.filter(game => {
            const scores = this.allScores[game.id] || [];
            return scores.length > 0;
        });
        
        if (playedGames.length === 0) {
            container.innerHTML = '<div class="no-games">Noch keine Spiele gespielt</div>';
            return;
        }
        
        container.innerHTML = playedGames.map(game => {
            const scores = this.allScores[game.id] || [];
            // Sortiere nach highscore
            const sortedScores = [...scores].sort((a, b) => (b.highscore || 0) - (a.highscore || 0));
            const top3 = sortedScores.slice(0, 3);
            
            return `
                <div class="game-card-compact">
                    <div class="game-card-header">
                        <span class="game-card-icon">${game.icon}</span>
                        <span class="game-card-title">${game.name}</span>
                    </div>
                    <div class="game-top3-row">
                        ${this.renderTop3Players(top3, game, currentUser)}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderTop3Players(top3, game, currentUser) {
        const medals = ['🥇', '🥈', '🥉'];
        
        if (top3.length === 0) {
            return '<div class="no-players">Keine Spieler</div>';
        }
        
        return top3.map((player, index) => {
            const avatar = this.getAvatarIcon(player.username);
            const score = player.highscore || 0;
            const scoreUnit = game.scoreUnit || '';
            const isCurrentUser = player.username === currentUser;
            
            return `
                <div class="top3-player ${isCurrentUser ? 'current-user' : ''}">
                    <div class="player-medal">${medals[index]}</div>
                    <div class="player-avatar-circle">${avatar}</div>
                    <div class="player-score-info">
                        <div class="player-username">${this.escapeHtml(player.username)}</div>
                        <div class="player-score-value">${score.toLocaleString()}${scoreUnit}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderGameStats(userEntry, firstPlace, userRank, game) {
        const userScore = userEntry ? (userEntry.highscore || 0) : 0;
        const firstScore = firstPlace ? (firstPlace.highscore || 0) : 0;
        const scoreUnit = game.scoreUnit || '';
        
        // Wenn User das Spiel nicht gespielt hat, zeige andere Spieler
        if (!userEntry && firstPlace) {
            const firstAvatar = this.getAvatarIcon(firstPlace.username);
            return `
                <span class="other-player">🥇 ${firstAvatar} ${firstScore.toLocaleString()}${scoreUnit}</span>
            `;
        }
        
        const rankMedal = userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : `${userRank}.`;
        
        let html = `
            <span class="rank-badge">${rankMedal}</span>
            <span class="user-score">${userScore.toLocaleString()}${scoreUnit}</span>
        `;
        
        // Zeige Platz 1 Punkte nur wenn man nicht selbst Platz 1 ist
        if (userRank > 1 && firstPlace) {
            const diff = firstScore - userScore;
            const firstAvatar = this.getAvatarIcon(firstPlace.username);
            html += ` <span class="first-score">(🥇 ${firstAvatar} ${firstScore.toLocaleString()}${scoreUnit} · -${diff.toLocaleString()})</span>`;
        }
        
        return html;
    }
    
    getAvatarIcon(username) {
        // Avatar-Icons basierend auf dem ersten Buchstaben
        const avatars = {
            'A': '🧑', 'B': '👨', 'C': '👩', 'D': '🧒', 'E': '👶',
            'F': '👴', 'G': '👵', 'H': '👨‍💼', 'I': '👩‍💼', 'J': '👨‍🔬',
            'K': '👩‍🔬', 'L': '👨‍🎓', 'M': '👩‍🎓', 'N': '👨‍🏫', 'O': '👩‍🏫',
            'P': '👨‍⚕️', 'Q': '👩‍⚕️', 'R': '👨‍🌾', 'S': '👩‍🌾', 'T': '👨‍🍳',
            'U': '👩‍🍳', 'V': '👨‍🎤', 'W': '👩‍🎤', 'X': '👨‍🎨', 'Y': '👩‍🎨',
            'Z': '🧙'
        };
        
        const firstLetter = (username || 'X')[0].toUpperCase();
        return avatars[firstLetter] || '👤';
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
