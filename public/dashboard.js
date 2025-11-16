// Dashboard Logic
class DashboardManager {
    constructor() {
        this.games = [];
        this.allScores = {};
        this.userAvatars = {};
        this.init();
    }

    async init() {
        try {
            // Zeige aktuellen User an
            this.showCurrentUser();
            
            // Lade Spieleliste dynamisch von der API
            await this.loadGames();
            
            // Lade User-Avatare
            await this.loadUserAvatars();
            
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

    async loadUserAvatars() {
        try {
            console.log('Lade User-Avatare...');
            const response = await fetch('/api/users/avatars');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.userAvatars = data.avatars || {};
            console.log('User-Avatare geladen:', Object.keys(this.userAvatars).length, 'Avatare');
        } catch (error) {
            console.error('Fehler beim Laden der Avatare:', error);
            this.userAvatars = {};
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

    renderPodium() {
        const podiumContainer = document.getElementById('podium-container');
        const playerStats = this.globalLeaderboard;

        if (playerStats.length === 0) {
            podiumContainer.innerHTML = '';
            return;
        }

        // Top 3 Spieler (in Anzeige-Reihenfolge: 2, 1, 3)
        const first = playerStats[0] || null;
        const second = playerStats[1] || null;
        const third = playerStats[2] || null;

        const renderPlace = (player, rank) => {
            if (!player) {
                return `
                    <div class="podium-place rank-${rank} podium-empty">
                        <div class="podium-avatar">❓</div>
                        <div class="podium-name">---</div>
                        <div class="podium-stats">Noch kein Spieler</div>
                        <div class="podium-step">
                            <div class="podium-rank-number">${rank}</div>
                        </div>
                    </div>
                `;
            }

            const avatar = this.getAvatarIcon(player.username || player.name);
            const medals = ['🥇', '🥈', '🥉'];
            
            return `
                <div class="podium-place rank-${rank}">
                    <div class="podium-avatar">${avatar}</div>
                    <div class="podium-name">${this.escapeHtml(player.username || player.name)}</div>
                    <div class="podium-stats">
                        ${player.firstPlaces} ${medals[0]} | ${player.totalScore.toLocaleString()} Punkte
                    </div>
                    <div class="podium-step">
                        <div class="podium-rank-number">${rank}</div>
                        ${medals[rank - 1]}
                    </div>
                </div>
            `;
        };

        // Reihenfolge: 2. Platz, 1. Platz, 3. Platz (für visuelle Treppe)
        podiumContainer.innerHTML = `
            ${renderPlace(second, 2)}
            ${renderPlace(first, 1)}
            ${renderPlace(third, 3)}
        `;
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
            this.renderPodium();
            return;
        }

        // Rendere Siegertreppe
        this.renderPodium();

        // Zeige nur Spieler ab Platz 4 (Top 3 sind auf Podium)
        const remainingPlayers = playerStats.slice(3);
        
        if (remainingPlayers.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #7f8c8d;">Nur Top 3 Spieler verfügbar</div>';
            return;
        }

        container.innerHTML = remainingPlayers.map((player, index) => {
            const actualRank = index + 4; // Beginne bei 4
            return `
                <div class="player-card">
                    <div class="player-rank">${actualRank}</div>
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

    // Cookie lesen (wie StatsManager)
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    showCurrentUser() {
        const userInfo = document.getElementById('user-info');
        if (!userInfo) return;
        const username = this.getCookie('playerName');
        if (username) {
            userInfo.innerHTML = `Angemeldet als: <strong>${username}</strong> <button onclick="dashboard.changeUsername()" style="margin-left: 10px; padding: 5px 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; color: white; cursor: pointer; font-size: 0.9rem;">Name ändern</button>`;
        } else {
            userInfo.innerHTML = `<button onclick="dashboard.changeUsername()" style="padding: 5px 15px; background: rgba(52,211,153,0.3); border: 1px solid rgba(34,197,94,0.5); border-radius: 5px; color: white; cursor: pointer; font-size: 0.9rem;">Jetzt anmelden</button>`;
        }
    }

    changeUsername() {
        const currentName = this.getCookie('playerName');
        const newName = prompt('Gib deinen Spielernamen ein:', currentName || '');
        if (newName && newName.trim()) {
            const expires = new Date();
            expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
            document.cookie = `playerName=${newName.trim()};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
            location.reload();
        }
    }

    renderGamesOverview() {
        const container = document.getElementById('games-overview');
        const currentUser = this.getCookie('playerName') || '';
        
        console.log('🔍 Current User aus Cookie:', currentUser);
        
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
            
            console.log(`📊 ${game.name} Top 3:`, top3.map(p => p.username));
            
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
            
            console.log(`  👤 ${player.username} === ${currentUser}? ${isCurrentUser}`);
            
            return `
                <div class="top3-player ${isCurrentUser ? 'current-user' : ''}" data-username="${this.escapeHtml(player.username)}" data-is-current="${isCurrentUser}">
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
        // Versuche echten Avatar zu laden
        const avatarData = this.userAvatars[username];
        
        if (avatarData && avatarData.style) {
            const style = avatarData.style;
            const options = avatarData.options || {};
            
            // Baue DiceBear URL
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(options)) {
                if (Array.isArray(value)) {
                    params.append(key, value.join(','));
                } else {
                    params.append(key, value);
                }
            }
            
            const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`;
            return `<img src="${avatarUrl}" alt="${username}" style="width: 100%; height: 100%; border-radius: 50%;">`;
        }
        
        // Fallback: Emoji basierend auf erstem Buchstaben
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
