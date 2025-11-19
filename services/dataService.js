import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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
        // Immer gamesPlayed und playTime aktualisieren
        existingPlayer.gamesPlayed = (existingPlayer.gamesPlayed || 0) + 1;
        existingPlayer.playTime = (existingPlayer.playTime || 0) + playTime;
        existingPlayer.lastScore = score;
        existingPlayer.lastPlayed = new Date().toISOString();
        
        // Nur Highscore aktualisieren wenn besser
        if (score > existingPlayer.highscore) {
          existingPlayer.highscore = score;
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
   * Generate unique user ID
   * @returns {string} Unique user ID
   */
  generateUserId() {
    return 'user_' + crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash password (simple hash for this project)
   * @param {string} password - Password to hash
   * @returns {string} Hashed password
   */
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Verify password
   * @param {string} password - Plain password
   * @param {string} hashedPassword - Hashed password
   * @returns {boolean} Password matches
   */
  verifyPassword(password, hashedPassword) {
    return this.hashPassword(password) === hashedPassword;
  }

  /**
   * Validate display name format
   * Only allows: letters, numbers, spaces, and basic punctuation (.-_@#)
   * Blocks: emojis and special Unicode characters
   * @param {string} displayName - Display name to check
   * @returns {boolean} True if valid
   */
  isValidDisplayName(displayName) {
    if (!displayName || typeof displayName !== 'string') {
      return false;
    }
    
    const trimmed = displayName.trim();
    
    // Check length (3-30 characters)
    if (trimmed.length < 3 || trimmed.length > 30) {
      return false;
    }
    
    // Allow only: letters (any language), numbers, spaces, and basic punctuation: . - _ @ #
    // This regex blocks emojis and special Unicode symbols
    const validPattern = /^[\p{L}\p{N}\s.\-_@#]+$/u;
    
    if (!validPattern.test(trimmed)) {
      return false;
    }
    
    // Additional check: detect emojis explicitly
    const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/u;
    
    if (emojiPattern.test(trimmed)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if display name is available
   * @param {string} displayName - Display name to check
   * @param {string} excludeUserId - User ID to exclude from check (for updates)
   * @returns {boolean} True if available
   */
  isDisplayNameAvailable(displayName, excludeUserId = null) {
    const users = this.loadUsers();
    const normalizedName = displayName.toLowerCase().trim();
    
    for (const [userId, user] of Object.entries(users.users)) {
      if (userId === excludeUserId) continue;
      if (user.displayName.toLowerCase().trim() === normalizedName) {
        return false;
      }
    }
    return true;
  }

  /**
   * Register new user
   * @param {string} displayName - Display name
   * @param {string} password - Password
   * @returns {Object|null} User object or null if failed
   */
  registerUser(displayName, password) {
    const users = this.loadUsers();
    
    // Validate display name format
    if (!this.isValidDisplayName(displayName)) {
      return { error: 'invalid_format', message: 'Nutzername enthält ungültige Zeichen. Erlaubt sind nur Buchstaben, Zahlen und . - _ @ #' };
    }
    
    // Check if display name is taken
    if (!this.isDisplayNameAvailable(displayName)) {
      return { error: 'name_taken', message: 'Dieser Nutzername ist bereits vergeben.' };
    }
    
    const userId = this.generateUserId();
    const hashedPassword = this.hashPassword(password);
    
    users.users[userId] = {
      userId: userId,
      displayName: displayName,
      password: hashedPassword,
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
        totalPlayTime: 0,
        totalScore: 0,
        averageScore: 0,
        bestGame: null,
        worstGame: null,
        favoriteGame: null,
        perfectGames: 0,
        comebacks: 0,
        consistency: 0,
        longestPlaySession: 0,
        shortestPlaySession: 0,
        averagePlayTime: 0,
        totalDaysPlayed: 0,
        lastPlayedDate: null,
        playStreak: 0,
        longestStreak: 0,
        winRate: 0,
        top1Count: 0,
        top3Count: 0,
        improvementRate: 0,
        gamesPerDay: 0,
        uniqueGamesPlayed: 0,
        completionRate: 0,
        christmasSpiritScore: 0,
        dailyLoginCount: 0,
        doorsOpened: 0
      },
      
      // Stars/Points System
      stars: {
        total: 0,
        breakdown: {
          gameScore: 0,
          achievements: 0,
          consistency: 0,
          improvement: 0,
          engagement: 0,
          variety: 0,
          mastery: 0,
          dedication: 0
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
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = users.users[userId];
      return userWithoutPassword;
  }

  /**
   * Login user
   * @param {string} displayName - Display name
   * @param {string} password - Password
   * @returns {Object|null} User object (without password) or null if failed
   */
  loginUser(displayName, password) {
    if (!displayName || !password) {
      return null;
    }
    const users = this.loadUsers();
    const normalizedName = displayName.toLowerCase().trim();
    
    for (const [userId, user] of Object.entries(users.users)) {
      if (user.displayName.toLowerCase().trim() === normalizedName) {
        if (this.verifyPassword(password, user.password)) {
          // Update last active
          user.lastActive = new Date().toISOString();
          this.saveUsers(users);
          
          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }
        return null; // Wrong password
      }
    }
    return null; // User not found
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Object|null} User profile or null
   */
  getUserProfileById(userId) {
    const users = this.loadUsers();
    
    if (users.users[userId]) {
      // Update lastActive
      users.users[userId].lastActive = new Date().toISOString();
      this.saveUsers(users);
      
      // Return without password
      const { password: _, ...userWithoutPassword } = users.users[userId];
      return userWithoutPassword;
    }
    
    return null;
  }

  /**
   * Get user profile by display name
   * @param {string} displayName - Display name
   * @returns {Object|null} User profile or null
   */
  getUserProfileByDisplayName(displayName) {
    const users = this.loadUsers();
    const normalizedName = displayName.toLowerCase().trim();
    
    for (const [userId, user] of Object.entries(users.users)) {
      if (user.displayName.toLowerCase().trim() === normalizedName) {
        // Return without password
        const { password: _, ...userWithoutPassword} = user;
        return userWithoutPassword;
      }
    }
    
    return null;
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {boolean} Success status
   */
  updateUserProfile(userId, updates) {
    try {
      const users = this.loadUsers();
      
      if (!users.users[userId]) {
        return false;
      }
      
      users.users[userId] = {
        ...users.users[userId],
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
   * @param {string} userId - User ID
   * @returns {Object} Updated stars object
   */
  calculateUserStars(userId) {
    const user = this.getUserProfileById(userId);
    if (!user) {
      return null;
    }
    
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
    const updatedStars = {
      total: total,
      breakdown: breakdown,
      lastCalculated: new Date().toISOString()
    };
    
    const users = this.loadUsers();
    users.users[userId].stars = updatedStars;
    this.saveUsers(users);
    
    return updatedStars;
  }

  /**
   * Update user stats after game completion
   * @param {string} userId - User ID
   * @param {string} gameName - Game name
   * @param {number} score - Game score
   * @param {number} playTime - Play time in seconds
   * @returns {boolean} Success status
   */
  updateUserStats(userId, gameName, score, playTime) {
    try {
      const user = this.getUserProfileById(userId);
      if (!user) {
        return false;
      }
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
      const userGameStats = gameStats.find(g => g.username === user.displayName);
      if (userGameStats && userGameStats.gamesPlayed === 1) {
        stats.uniqueGamesPlayed++;
      }
      
      // Calculate favorite game (most played)
      const allGameStats = this.getAllStats();
      let maxGamesPlayed = 0;
      let favoriteGame = null;
      for (const [game, players] of Object.entries(allGameStats)) {
        const playerStats = players.find(p => p.username === user.displayName);
        if (playerStats && playerStats.gamesPlayed > maxGamesPlayed) {
          maxGamesPlayed = playerStats.gamesPlayed;
          favoriteGame = game;
        }
      }
      stats.favoriteGame = favoriteGame;
      
      // Update user profile
      this.updateUserProfile(userId, { stats });
      
      // Recalculate stars
      this.calculateUserStars(userId);
      
      return true;
    } catch (error) {
      console.error('Error updating user stats:', error);
      return false;
    }
  }

  /**
   * Update avatar
   * @param {string} userId - User ID
   * @param {Object} avatarData - Avatar data { style, options }
   * @returns {boolean} Success status
   */
  updateUserAvatar(userId, avatarData) {
    try {
      const users = this.loadUsers();
      
      if (!users.users[userId]) {
        return false;
      }
      
      users.users[userId].avatar = {
        ...avatarData,
        lastChanged: new Date().toISOString()
      };
      users.users[userId].avatarChanges++;
      
      return this.saveUsers(users);
    } catch (error) {
      console.error('Error updating user avatar:', error);
      return false;
    }
  }

  /**
   * Update display name
   * @param {string} userId - User ID
   * @param {string} newDisplayName - New display name
   * @returns {boolean} Success status
   */
  updateDisplayName(userId, newDisplayName) {
    try {
      const users = this.loadUsers();
      
      if (!users.users[userId]) {
        return false;
      }
      
      // Validate display name format
      if (!this.isValidDisplayName(newDisplayName)) {
        return false;
      }
      
      // Check if new display name is already taken
      if (!this.isDisplayNameAvailable(newDisplayName, userId)) {
        return false;
      }
      
      // Store old display name
      const oldDisplayName = users.users[userId].displayName;
      
      // Update display name
      users.users[userId].displayName = newDisplayName;
      users.users[userId].usernameChanges++;
      users.users[userId].usernameHistory.push({
        oldName: oldDisplayName,
        newName: newDisplayName,
        changedAt: new Date().toISOString()
      });
      
      // Update display name in stats.json (using displayName as username field)
      const stats = this.loadStats();
      for (const gameName in stats.games) {
        const players = stats.games[gameName];
        const playerIndex = players.findIndex(p => p.username === oldDisplayName);
        if (playerIndex !== -1) {
          players[playerIndex].username = newDisplayName;
        }
      }
      this.saveStats(stats);
      
      return this.saveUsers(users);
    } catch (error) {
      console.error('Error updating display name:', error);
      return false;
    }
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  updatePassword(userId, currentPassword, newPassword) {
    try {
      const users = this.loadUsers();
      
      if (!users.users[userId]) {
        return false;
      }
      
      // Verify current password
      if (!this.verifyPassword(currentPassword, users.users[userId].password)) {
        return false;
      }
      
      // Update password
      users.users[userId].password = this.hashPassword(newPassword);
      
      return this.saveUsers(users);
    } catch (error) {
      console.error('Error updating password:', error);
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
