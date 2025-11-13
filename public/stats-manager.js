// === Cookie-Management für Spielernamen ===

class StatsManager {
    constructor() {
        this.username = null;
        this.init();
    }
    
    // Initialisierung beim Laden
    init() {
        this.username = this.getCookie('playerName');
        
        // Wenn kein Name vorhanden, frage beim ersten Spielstart
        if (!this.username) {
            // Wird später beim Spielstart abgefragt
            console.log('Kein Spielername gefunden - wird beim ersten Spiel abgefragt');
        }
    }
    
    // Cookie setzen
    setCookie(name, value, days = 365) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }
    
    // Cookie lesen
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
    
    // Spielername abfragen (falls noch nicht vorhanden)
    async ensureUsername() {
        // Prüfe zuerst ob Avatar-System einen Namen hat
        if (typeof avatarManager !== 'undefined') {
            const profile = avatarManager.getProfile();
            if (profile && profile.username) {
                this.username = profile.username;
                this.setCookie('playerName', this.username);
                return this.username;
            }
        }
        
        if (this.username) {
            return this.username;
        }
        
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'username-overlay';
            overlay.innerHTML = `
                <div class="username-dialog">
                    <h2>🎄 Willkommen! 🎅</h2>
                    <p>Bitte gib deinen Namen ein, um deine Highscores zu speichern:</p>
                    <input type="text" id="username-input" placeholder="Dein Name" maxlength="20" />
                    <button id="username-submit">Weiter</button>
                    <p class="username-hint">Dein Name wird in einem Cookie gespeichert.</p>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            const input = document.getElementById('username-input');
            const submit = document.getElementById('username-submit');
            
            const submitName = () => {
                const name = input.value.trim();
                if (name && name.length >= 2) {
                    this.username = name;
                    this.setCookie('playerName', name);
                    overlay.remove();
                    resolve(name);
                } else {
                    input.classList.add('error');
                    setTimeout(() => input.classList.remove('error'), 500);
                }
            };
            
            submit.addEventListener('click', submitName);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submitName();
            });
            
            // Fokus auf Input
            setTimeout(() => input.focus(), 100);
        });
    }
    
    // Statistik an Server senden
    async saveStats(gameName, score, playTime) {
        await this.ensureUsername();
        
        try {
            const response = await fetch('/api/stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameName,
                    username: this.username,
                    score,
                    playTime
                })
            });
            
            if (!response.ok) {
                console.error('Fehler beim Speichern der Statistik');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern der Statistik:', error);
            return false;
        }
    }
    
    // Alias für saveStats (manche Spiele verwenden saveScore)
    async saveScore(gameName, score, playTime) {
        return await this.saveStats(gameName, score, playTime);
    }
    
    // Top 3 für ein Spiel abrufen
    async getTop3(gameName) {
        try {
            const response = await fetch(`/api/stats/${gameName}`);
            if (!response.ok) {
                console.error('Fehler beim Laden der Top 3');
                return [];
            }
            
            const data = await response.json();
            return data.top3 || [];
        } catch (error) {
            console.error('Fehler beim Laden der Top 3:', error);
            return [];
        }
    }
    
    // ALLE Scores für ein Spiel abrufen
    async getAllScores(gameName) {
        try {
            const response = await fetch(`/api/stats/${gameName}/all`);
            if (!response.ok) {
                console.error('Fehler beim Laden aller Scores');
                return [];
            }
            
            const data = await response.json();
            return data.allScores || [];
        } catch (error) {
            console.error('Fehler beim Laden aller Scores:', error);
            return [];
        }
    }
    
    // Stats für ein bestimmtes Spiel abrufen (für aktuellen Spieler)
    async getGameStats(gameName) {
        try {
            const response = await fetch(`/api/stats/${gameName}`);
            if (!response.ok) {
                return { highscore: 0, gamesPlayed: 0 };
            }
            
            const data = await response.json();
            const playerStats = data.top3?.find(p => p.username === this.username);
            return playerStats || { highscore: 0, gamesPlayed: 0 };
        } catch (error) {
            console.error('Fehler beim Laden der Game Stats:', error);
            return { highscore: 0, gamesPlayed: 0 };
        }
    }
    
    // Top X Highscores für ein Spiel abrufen
    async getHighscores(gameName, limit = 10) {
        try {
            const response = await fetch(`/api/stats/${gameName}/all`);
            if (!response.ok) {
                return [];
            }
            
            const data = await response.json();
            return (data.allScores || []).slice(0, limit);
        } catch (error) {
            console.error('Fehler beim Laden der Highscores:', error);
            return [];
        }
    }
    
    // Highscore-Anzeige erstellen
    createHighscoreDisplay(top3, currentScore = null) {
        if (!top3 || top3.length === 0) {
            return `
                <div class="highscore-display">
                    <h3>🏆 Highscores</h3>
                    <p class="no-scores">Noch keine Scores vorhanden.<br>Sei der Erste!</p>
                </div>
            `;
        }
        
        const medals = ['🥇', '🥈', '🥉'];
        const rows = top3.map((player, index) => {
            const isCurrentPlayer = player.username === this.username;
            const isNewHighscore = currentScore !== null && currentScore >= player.highscore && isCurrentPlayer;
            const highlightClass = isNewHighscore ? 'new-highscore' : (isCurrentPlayer ? 'current-player' : '');
            
            return `
                <div class="highscore-row ${highlightClass}">
                    <span class="rank">${medals[index] || (index + 1)}</span>
                    <span class="player-name">${player.username}</span>
                    <span class="player-score">${player.highscore}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="highscore-display">
                <h3>🏆 Top 3 Highscores</h3>
                <div class="highscore-list">
                    ${rows}
                </div>
            </div>
        `;
    }
}

// Globale Instanz erstellen
const statsManager = new StatsManager();
