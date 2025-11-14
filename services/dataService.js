import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Data Service Layer - Abstraction for data access
 * This layer can be easily replaced with a database implementation
 */

class DataService {
  constructor() {
    this.gamesFilePath = path.join(__dirname, '../data/games.json');
    this.statsFilePath = path.join(__dirname, '../data/stats.json');
    this.usersFilePath = path.join(__dirname, '../data/users.json');
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
    const gameStats = stats.games[gameName] || [];
    // Sortiere nach Highscore absteigend
    return gameStats.sort((a, b) => b.highscore - a.highscore);
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

  // =====================
  // USER MANAGEMENT METHODS
  // =====================

  /**
   * Load all users
   * @returns {Object} Users object
   */
  loadUsers() {
    try {
      const data = fs.readFileSync(this.usersFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { users: {} };
    }
  }

  /**
   * Save users
   * @param {Object} users - Users object
   * @returns {boolean} Success status
   */
  saveUsers(users) {
    try {
      fs.writeFileSync(this.usersFilePath, JSON.stringify(users, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving users:', error);
      return false;
    }
  }

  /**
   * Get or create user profile
   * @param {string} username - Username
   * @returns {Object} User profile
   */
  getUserProfile(username) {
    const users = this.loadUsers();
    
    if (!users.users[username]) {
      // Create new user profile
      users.users[username] = {
        username: username,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        
        // Avatar Data
        avatar: {
          style: 'adventurer',
          options: {},
          lastChanged: new Date().toISOString()
        },
        avatarChanges: 0,
        usernameChanges: 0,
        usernameHistory: [],
        
        // Game Statistics
        stats: {
          totalGamesPlayed: 0,
          totalPlayTime: 0, // in seconds
          totalScore: 0,
          averageScore: 0,
          bestGame: null, // { gameName, score }
          worstGame: null,
          favoriteGame: null, // most played game
          
          // Achievement-relevant stats
          perfectGames: 0, // games where score > 90% of best possible
          comebacks: 0, // games where improved after bad round
          consistency: 0, // low variance in scores
          
          // Time-based stats
          longestPlaySession: 0,
          shortestPlaySession: 0,
          averagePlayTime: 0,
          totalDaysPlayed: 0,
          lastPlayedDate: null,
          playStreak: 0, // consecutive days played
          longestStreak: 0,
          
          // Performance stats
          winRate: 0, // percentage of games in top 3
          top1Count: 0,
          top3Count: 0,
          improvementRate: 0, // % of games where score improved
          
          // Engagement stats
          gamesPerDay: 0,
          uniqueGamesPlayed: 0,
          completionRate: 0, // % of games where played to end
          
          // Seasonal stats
          christmasSpiritScore: 0, // custom metric based on activity during advent
          dailyLoginCount: 0,
          doorsOpened: 0
        },
        
        // Stars/Points System
        stars: {
          total: 0,
          breakdown: {
            gameScore: 0,      // from total game scores
            achievements: 0,    // from unlocked achievements
            consistency: 0,     // from regular play
            improvement: 0,     // from improving scores
            engagement: 0,      // from daily logins, doors opened
            variety: 0,         // from playing different games
            mastery: 0,         // from being top 3 in games
            dedication: 0       // from long play sessions, streaks
          }
        },
        
        // Achievements
        achievements: [],
        
        // Unlocked Items
        unlockedItems: {
          avatarStyles: ['adventurer'],
          avatarOptions: {},
          badges: [],
          titles: []
        },
        
        // Preferences
        preferences: {
          notifications: true,
          soundEnabled: true,
          theme: 'christmas'
        }
      };
      
      this.saveUsers(users);
    } else {
      // Update lastActive
      users.users[username].lastActive = new Date().toISOString();
      this.saveUsers(users);
    }
    
    return users.users[username];
  }

  /**
   * Update user profile
   * @param {string} username - Username
   * @param {Object} updates - Profile updates
   * @returns {boolean} Success status
   */
  updateUserProfile(username, updates) {
    try {
      const users = this.loadUsers();
      
      if (!users.users[username]) {
        // Create if doesn't exist
        this.getUserProfile(username);
      }
      
      users.users[username] = {
        ...users.users[username],
        ...updates,
        lastActive: new Date().toISOString()
      };
      
      return this.saveUsers(users);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  /**
   * Calculate and update user stars based on stats
   * @param {string} username - Username
   * @returns {Object} Updated stars object
   */
  calculateUserStars(username) {
    const user = this.getUserProfile(username);
    const stats = user.stats;
    const breakdown = {};
    
    // 1. Game Score Stars (max 1000 stars)
    // 1 star per 10 points, capped at 1000
    breakdown.gameScore = Math.min(Math.floor(stats.totalScore / 10), 1000);
    
    // 2. Mastery Stars (max 500 stars)
    // 50 stars per #1 place, 30 per #2, 20 per #3
    breakdown.mastery = (stats.top1Count * 50) + ((stats.top3Count - stats.top1Count) * 20);
    breakdown.mastery = Math.min(breakdown.mastery, 500);
    
    // 3. Consistency Stars (max 300 stars)
    // Based on play streak
    breakdown.consistency = Math.min(stats.longestStreak * 10, 300);
    
    // 4. Improvement Stars (max 200 stars)
    // Based on improvement rate
    breakdown.improvement = Math.floor(stats.improvementRate * 2);
    breakdown.improvement = Math.min(breakdown.improvement, 200);
    
    // 5. Engagement Stars (max 400 stars)
    // Daily logins (2 stars each) + doors opened (5 stars each)
    breakdown.engagement = (stats.dailyLoginCount * 2) + (stats.doorsOpened * 5);
    breakdown.engagement = Math.min(breakdown.engagement, 400);
    
    // 6. Variety Stars (max 150 stars)
    // 15 stars per unique game played
    breakdown.variety = stats.uniqueGamesPlayed * 15;
    breakdown.variety = Math.min(breakdown.variety, 150);
    
    // 7. Dedication Stars (max 250 stars)
    // Based on total play time (1 star per 2 minutes)
    breakdown.dedication = Math.floor(stats.totalPlayTime / 120);
    breakdown.dedication = Math.min(breakdown.dedication, 250);
    
    // 8. Achievement Stars (max 200 stars)
    // 10 stars per achievement
    breakdown.achievements = user.achievements.length * 10;
    breakdown.achievements = Math.min(breakdown.achievements, 200);
    
    // Calculate total
    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    
    // Update user profile
    user.stars = {
      total: total,
      breakdown: breakdown,
      lastCalculated: new Date().toISOString()
    };
    
    const users = this.loadUsers();
    users.users[username] = user;
    this.saveUsers(users);
    
    return user.stars;
  }

  /**
   * Update user stats after game completion
   * @param {string} username - Username
   * @param {string} gameName - Game name
   * @param {number} score - Game score
   * @param {number} playTime - Play time in seconds
   * @returns {boolean} Success status
   */
  updateUserStats(username, gameName, score, playTime) {
    try {
      const user = this.getUserProfile(username);
      const stats = user.stats;
      
      // Update basic stats
      stats.totalGamesPlayed++;
      stats.totalPlayTime += playTime;
      stats.totalScore += score;
      stats.averageScore = Math.floor(stats.totalScore / stats.totalGamesPlayed);
      
      // Update time-based stats
      if (playTime > stats.longestPlaySession) {
        stats.longestPlaySession = playTime;
      }
      if (stats.shortestPlaySession === 0 || playTime < stats.shortestPlaySession) {
        stats.shortestPlaySession = playTime;
      }
      stats.averagePlayTime = Math.floor(stats.totalPlayTime / stats.totalGamesPlayed);
      
      // Update best/worst game
      if (!stats.bestGame || score > stats.bestGame.score) {
        stats.bestGame = { gameName, score };
      }
      if (!stats.worstGame || score < stats.worstGame.score) {
        stats.worstGame = { gameName, score };
      }
      
      // Update play streak
      const today = new Date().toISOString().split('T')[0];
      if (stats.lastPlayedDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (stats.lastPlayedDate === yesterdayStr) {
          stats.playStreak++;
        } else {
          stats.playStreak = 1;
        }
        
        if (stats.playStreak > stats.longestStreak) {
          stats.longestStreak = stats.playStreak;
        }
        
        stats.lastPlayedDate = today;
        stats.totalDaysPlayed++;
      }
      
      // Update unique games played
      const gameStats = this.getGameStats(gameName);
      const userGameStats = gameStats.find(g => g.username === username);
      if (userGameStats && userGameStats.gamesPlayed === 1) {
        stats.uniqueGamesPlayed++;
      }
      
      // Calculate favorite game (most played)
      const allGameStats = this.getAllStats();
      let maxGamesPlayed = 0;
      let favoriteGame = null;
      for (const [game, players] of Object.entries(allGameStats)) {
        const playerStats = players.find(p => p.username === username);
        if (playerStats && playerStats.gamesPlayed > maxGamesPlayed) {
          maxGamesPlayed = playerStats.gamesPlayed;
          favoriteGame = game;
        }
      }
      stats.favoriteGame = favoriteGame;
      
      // Update user profile
      this.updateUserProfile(username, { stats });
      
      // Recalculate stars
      this.calculateUserStars(username);
      
      return true;
    } catch (error) {
      console.error('Error updating user stats:', error);
      return false;
    }
  }

  /**
   * Update avatar change count
   * @param {string} username - Username
   * @param {Object} avatarData - Avatar data { style, options }
   * @returns {boolean} Success status
   */
  updateUserAvatar(username, avatarData) {
    try {
      const user = this.getUserProfile(username);
      
      user.avatar = {
        ...avatarData,
        lastChanged: new Date().toISOString()
      };
      user.avatarChanges++;
      
      const users = this.loadUsers();
      users.users[username] = user;
      return this.saveUsers(users);
    } catch (error) {
      console.error('Error updating user avatar:', error);
      return false;
    }
  }

  /**
   * Update username
   * @param {string} oldUsername - Old username
   * @param {string} newUsername - New username
   * @returns {boolean} Success status
   */
  updateUsername(oldUsername, newUsername) {
    try {
      const users = this.loadUsers();
      
      if (!users.users[oldUsername]) {
        return false;
      }
      
      // Check if new username already exists
      if (users.users[newUsername] && newUsername !== oldUsername) {
        return false;
      }
      
      // Move user data to new username
      const userData = users.users[oldUsername];
      userData.username = newUsername;
      userData.usernameChanges++;
      userData.usernameHistory.push({
        oldName: oldUsername,
        newName: newUsername,
        changedAt: new Date().toISOString()
      });
      
      users.users[newUsername] = userData;
      
      // Delete old username entry if different
      if (oldUsername !== newUsername) {
        delete users.users[oldUsername];
      }
      
      // Update username in stats.json
      const stats = this.loadStats();
      for (const gameName in stats.games) {
        const players = stats.games[gameName];
        const playerIndex = players.findIndex(p => p.username === oldUsername);
        if (playerIndex !== -1) {
          players[playerIndex].username = newUsername;
        }
      }
      this.saveStats(stats);
      
      return this.saveUsers(users);
    } catch (error) {
      console.error('Error updating username:', error);
      return false;
    }
  }

  /**
   * Get all users sorted by stars
   * @returns {Array} Array of user profiles sorted by stars
   */
  getAllUsersSortedByStars() {
    const users = this.loadUsers();
    return Object.values(users.users).sort((a, b) => {
      return (b.stars?.total || 0) - (a.stars?.total || 0);
    });
  }
}

// Export singleton instance
export default new DataService();
