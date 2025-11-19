// === Cookie-Management für Spielernamen ===

class StatsManager {
    constructor() {
        this.username = null;
        this.init();
    }
    
    // Initialisierung beim Laden
    init() {
        this.username = this.getCookie('playerName');
        // Benutzername wird bei Bedarf beim Spielstart abgefragt
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
        // 1. Prüfe Backend-Session (höchste Priorität)
        try {
            const response = await fetch('/api/auth/session');
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user && data.user.username) {
                    this.username = data.user.username;
                    this.setCookie('playerName', this.username);
                    return this.username;
                }
            }
        } catch (error) {
            console.warn('Session check failed:', error);
        }
        
        // 2. Prüfe Avatar-System
        if (typeof window.avatarManager !== 'undefined' && window.avatarManager) {
            const profile = window.avatarManager.getProfile();
            if (profile && profile.username) {
                this.username = profile.username;
                this.setCookie('playerName', this.username);
                return this.username;
            }
        }
        
        // 3. Falls kein Avatar-Name, verwende bestehenden Username aus Cookie
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
    
    // Globale Game-Over Overlay Funktion
    async showGameOverOverlay(gameName, stats) {
        // Game-Daten laden für Theme
        const response = await fetch('/api/games');
        const data = await response.json();
        const gameData = data.games.find(g => g.id === gameName);
        const theme = gameData?.theme || 'dark-theme';
        
        // Prüfen ob Overlay bereits existiert, sonst erstellen
        let overlay = document.getElementById('gameoverOverlay');
        if (!overlay) {
            overlay = this.createGameOverOverlay(theme);
            document.body.appendChild(overlay);
        } else {
            // Theme aktualisieren
            overlay.className = `game-overlay ${theme}`;
        }
        
        // Titel aktualisieren
        const titleElement = document.getElementById('gameoverTitle');
        if (titleElement) {
            titleElement.textContent = '🎉 Spiel Vorbei! 🎉';
        }
        
        // Stats dynamisch anzeigen
        const statsDisplay = document.getElementById('statsDisplay');
        if (statsDisplay && stats && stats.length > 0) {
            statsDisplay.innerHTML = stats.map(stat => `
                <div class="stat-item">
                    <span class="stat-label">${stat.label}</span>
                    <span class="stat-value">${stat.value}</span>
                </div>
            `).join('');
        }
        
        // Top 3 laden und anzeigen
        const top3Container = document.getElementById('top3Container');
        const top3List = document.getElementById('top3List');
        
        if (top3List) {
            top3List.innerHTML = '<div class="loading">Lade Highscores...</div>';
            
            try {
                const top3 = await this.getTop3(gameName);
                
                if (top3.length === 0) {
                    top3List.innerHTML = '<p class="no-scores">Noch keine Highscores vorhanden.<br>Sei der Erste!</p>';
                } else {
                    const medals = ['🥇', '🥈', '🥉'];
                    top3List.innerHTML = top3.map((player, index) => {
                        const isCurrentPlayer = player.username === this.username;
                        const highlightClass = isCurrentPlayer ? 'current-player' : '';
                        
                        return `
                            <div class="highscore-row ${highlightClass}" onclick="window.location.href='../dashboard.html?player=${encodeURIComponent(player.username)}'">
                                <span class="rank">${medals[index] || (index + 1)}</span>
                                <span class="player-name">${player.username}</span>
                                <span class="player-score">${player.highscore.toLocaleString()}</span>
                            </div>
                        `;
                    }).join('');
                }
            } catch (error) {
                console.error('Fehler beim Laden der Top 3:', error);
                top3List.innerHTML = '<p class="error">Fehler beim Laden der Highscores.</p>';
            }
        }
        
        // Overlay anzeigen
        overlay.classList.add('active');
    }
    
    createGameOverOverlay(theme = 'dark-theme') {
        const overlay = document.createElement('div');
        overlay.id = 'gameoverOverlay';
        overlay.className = `game-overlay ${theme}`;
        overlay.innerHTML = `
            <div class="overlay-content">
                <h1 id="gameoverTitle">🎉 Spiel Vorbei! 🎉</h1>
                <div class="stats-display" id="statsDisplay">
                    <!-- Stats werden dynamisch hinzugefügt -->
                </div>
                <div id="top3Container" class="top3-container">
                    <h3>🏆 Top 3 Highscores</h3>
                    <div id="top3List" class="top3-list">
                        <div class="loading">Lade Highscores...</div>
                    </div>
                </div>
                <div class="button-group">
                    <button id="restartButton" class="game-button">Nochmal spielen</button>
                    <a href="../index.html" class="game-button secondary">Kalender</a>
                </div>
            </div>
        `;
        
        // Restart Button Event
        overlay.querySelector('#restartButton').addEventListener('click', () => {
            location.reload();
        });
        
        return overlay;
    }
    
    // Globale Game-Start Overlay Funktion
    async showGameStartOverlay(gameId) {
        try {
            // Game-Daten laden
            const response = await fetch('/api/games');
            const data = await response.json();
            const gameData = data.games.find(g => g.id === gameId);
            
            if (!gameData) {
                console.error('Game nicht gefunden:', gameId);
                return;
            }
            
            const theme = gameData.theme || 'dark-theme';
            
            // Overlay erstellen wenn nicht vorhanden, sonst aktualisieren
            let overlay = document.getElementById('startOverlay');
            if (!overlay) {
                overlay = this.createGameStartOverlay(gameData, theme);
                document.body.appendChild(overlay);
            } else {
                // Theme und Inhalt aktualisieren
                overlay.className = `game-overlay ${theme}`;
                const titleElement = overlay.querySelector('#startTitle');
                if (titleElement) {
                    titleElement.textContent = `${gameData.icon} ${gameData.name} ${gameData.icon}`;
                }
                
                // Info-Liste aktualisieren
                const infoList = overlay.querySelector('#gameInfoList');
                if (infoList && gameData.info && gameData.info.length > 0) {
                    const maxEntries = Math.min(gameData.info.length, 5);
                    infoList.innerHTML = '';
                    
                    for (let i = 0; i < maxEntries; i++) {
                        const infoItem = document.createElement('div');
                        infoItem.className = 'info-item';
                        infoItem.innerHTML = `
                            <span class="info-icon">▸</span>
                            <span class="info-text">${gameData.info[i]}</span>
                        `;
                        infoList.appendChild(infoItem);
                    }
                }
            }
            
            // Overlay anzeigen
            overlay.classList.add('active');
        } catch (error) {
            console.error('Fehler beim Laden der Game-Daten:', error);
        }
    }
    
    createGameStartOverlay(gameData, theme = 'dark-theme') {
        const overlay = document.createElement('div');
        overlay.id = 'startOverlay';
        overlay.className = `game-overlay ${theme} active`;
        
        const maxEntries = Math.min(gameData.info?.length || 0, 5);
        let infoHTML = '';
        
        if (gameData.info && gameData.info.length > 0) {
            for (let i = 0; i < maxEntries; i++) {
                infoHTML += `
                    <div class="info-item">
                        <span class="info-icon">▸</span>
                        <span class="info-text">${gameData.info[i]}</span>
                    </div>
                `;
            }
        }
        
        overlay.innerHTML = `
            <div class="overlay-content">
                <h1 id="startTitle">${gameData.icon} ${gameData.name} ${gameData.icon}</h1>
                <div class="game-info-container">
                    <div id="gameInfoList" class="game-info-list">
                        ${infoHTML}
                    </div>
                </div>
                <div class="button-group">
                    <button id="startButton" class="game-button start-pulse">Spiel Starten</button>
                    <a href="../index.html" class="game-button secondary">Kalender</a>
                </div>
            </div>
        `;
        
        return overlay;
    }
}

// Globale Instanz erstellen
const statsManager = new StatsManager();
