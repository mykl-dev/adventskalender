const fs = require('fs');
const path = require('path');

/**
 * Data Service Layer - Abstraction for data access
 * This layer can be easily replaced with a database implementation
 */

class DataService {
  constructor() {
    this.gamesFilePath = path.join(__dirname, '../data/games.json');
    this.statsFilePath = path.join(__dirname, '../data/stats.json');
  }

  // =====================
  // GAMES METHODS
  // =====================

  /**
   * Get all games
   * @returns {Array} Array of game objects
   */
  getAllGames() {
    try {
      const data = fs.readFileSync(this.gamesFilePath, 'utf8');
      const gamesData = JSON.parse(data);
      return gamesData.games || [];
    } catch (error) {
      console.error('Error loading games:', error);
      return [];
    }
  }

  /**
   * Get active games only
   * @returns {Array} Array of active game objects
   */
  getActiveGames() {
    const allGames = this.getAllGames();
    return allGames.filter(game => game.active !== false);
  }

  /**
   * Get game by ID
   * @param {string} gameId - The game ID
   * @returns {Object|null} Game object or null if not found
   */
  getGameById(gameId) {
    const games = this.getAllGames();
    return games.find(game => game.id === gameId) || null;
  }

  /**
   * Add a new game
   * @param {Object} gameData - Game data object
   * @returns {boolean} Success status
   */
  addGame(gameData) {
    try {
      const data = fs.readFileSync(this.gamesFilePath, 'utf8');
      const gamesData = JSON.parse(data);
      
      // Validate required fields
      if (!gameData.id || !gameData.name) {
        throw new Error('Game ID and name are required');
      }

      // Check if game already exists
      if (gamesData.games.some(g => g.id === gameData.id)) {
        throw new Error('Game with this ID already exists');
      }

      gamesData.games.push({
        id: gameData.id,
        name: gameData.name,
        icon: gameData.icon || '🎮',
        description: gameData.description || '',
        category: gameData.category || 'other',
        difficulty: gameData.difficulty || 'medium',
        scoreType: gameData.scoreType || 'points',
        scoreUnit: gameData.scoreUnit || '',
        active: gameData.active !== false
      });

      fs.writeFileSync(this.gamesFilePath, JSON.stringify(gamesData, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error adding game:', error);
      return false;
    }
  }

  /**
   * Update game
   * @param {string} gameId - Game ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  updateGame(gameId, updates) {
    try {
      const data = fs.readFileSync(this.gamesFilePath, 'utf8');
      const gamesData = JSON.parse(data);
      
      const gameIndex = gamesData.games.findIndex(g => g.id === gameId);
      if (gameIndex === -1) {
        throw new Error('Game not found');
      }

      gamesData.games[gameIndex] = {
        ...gamesData.games[gameIndex],
        ...updates,
        id: gameId // ID should never be changed
      };

      fs.writeFileSync(this.gamesFilePath, JSON.stringify(gamesData, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error updating game:', error);
      return false;
    }
  }

  // =====================
  // STATS METHODS
  // =====================

  /**
   * Load all stats
   * @returns {Object} Stats object with games property
   */
  loadStats() {
    try {
      const data = fs.readFileSync(this.statsFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { games: {} };
    }
  }

  /**
   * Save stats
   * @param {Object} stats - Stats object
   * @returns {boolean} Success status
   */
  saveStats(stats) {
    try {
      fs.writeFileSync(this.statsFilePath, JSON.stringify(stats, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving stats:', error);
      return false;
    }
  }

  /**
   * Get stats for a specific game
   * @param {string} gameName - Game name/ID
   * @returns {Array} Array of player stats for the game
   */
  getGameStats(gameName) {
    const stats = this.loadStats();
    return stats.games[gameName] || [];
  }

  /**
   * Get top N players for a game
   * @param {string} gameName - Game name/ID
   * @param {number} limit - Number of top players to return
   * @returns {Array} Array of top player stats
   */
  getTopPlayers(gameName, limit = 3) {
    const gameStats = this.getGameStats(gameName);
    return gameStats
      .sort((a, b) => b.highscore - a.highscore)
      .slice(0, limit);
  }

  /**
   * Get all stats for all games
   * @returns {Object} Object with game names as keys and stats arrays as values
   */
  getAllStats() {
    const stats = this.loadStats();
    return stats.games || {};
  }

  /**
   * Save player score
   * @param {string} gameName - Game name/ID
   * @param {string} username - Player username
   * @param {number} score - Player score
   * @param {number} playTime - Play time in seconds
   * @returns {boolean} Success status
   */
  savePlayerScore(gameName, username, score, playTime) {
    try {
      const stats = this.loadStats();
      
      if (!stats.games[gameName]) {
        stats.games[gameName] = [];
      }

      const existingPlayer = stats.games[gameName].find(
        p => p.username.toLowerCase() === username.toLowerCase()
      );

      if (existingPlayer) {
        if (score > existingPlayer.highscore) {
          existingPlayer.highscore = score;
          existingPlayer.lastScore = score;
          existingPlayer.playTime = playTime;
          existingPlayer.lastPlayed = new Date().toISOString();
          existingPlayer.gamesPlayed = (existingPlayer.gamesPlayed || 0) + 1;
        } else {
          existingPlayer.lastScore = score;
          existingPlayer.gamesPlayed = (existingPlayer.gamesPlayed || 0) + 1;
        }
      } else {
        stats.games[gameName].push({
          username: username,
          highscore: score,
          lastScore: score,
          playTime: playTime,
          firstPlayed: new Date().toISOString(),
          lastPlayed: new Date().toISOString(),
          gamesPlayed: 1
        });
      }

      return this.saveStats(stats);
    } catch (error) {
      console.error('Error saving player score:', error);
      return false;
    }
  }

  /**
   * Get global leaderboard across all games
   * @returns {Array} Array of player objects with aggregated stats
   */
  getGlobalLeaderboard() {
    const allStats = this.getAllStats();
    const games = this.getActiveGames();
    const playerStats = {};

    // Aggregate stats for all players across all games
    games.forEach(game => {
      const gameStats = allStats[game.id] || [];
      
      // Get best score per player for this game
      const playerBestScores = {};
      gameStats.forEach(entry => {
        if (!playerBestScores[entry.username] || entry.highscore > playerBestScores[entry.username].highscore) {
          playerBestScores[entry.username] = entry;
        }
      });

      // Rank players for this game
      const rankedPlayers = Object.values(playerBestScores)
        .sort((a, b) => b.highscore - a.highscore);

      // Count placements
      rankedPlayers.forEach((entry, index) => {
        if (!playerStats[entry.username]) {
          playerStats[entry.username] = {
            username: entry.username,
            firstPlaces: 0,
            secondPlaces: 0,
            thirdPlaces: 0,
            totalScore: 0,
            gamesPlayed: 0,
            gameDetails: {}
          };
        }

        if (index === 0) playerStats[entry.username].firstPlaces++;
        else if (index === 1) playerStats[entry.username].secondPlaces++;
        else if (index === 2) playerStats[entry.username].thirdPlaces++;

        playerStats[entry.username].totalScore += entry.highscore;
        playerStats[entry.username].gamesPlayed++;
        playerStats[entry.username].gameDetails[game.id] = {
          score: entry.highscore,
          rank: index + 1,
          gameName: game.name
        };
      });
    });

    // Sort by first places, then second, then third, then total score
    return Object.values(playerStats).sort((a, b) => {
      if (b.firstPlaces !== a.firstPlaces) return b.firstPlaces - a.firstPlaces;
      if (b.secondPlaces !== a.secondPlaces) return b.secondPlaces - a.secondPlaces;
      if (b.thirdPlaces !== a.thirdPlaces) return b.thirdPlaces - a.thirdPlaces;
      return b.totalScore - a.totalScore;
    });
  }
}

// Export singleton instance
module.exports = new DataService();
