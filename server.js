import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dataService from './services/dataService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Lade Konfiguration
const loadConfig = () => {
  try {
    const data = fs.readFileSync('./config.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Keine config.json gefunden, verwende Standard-Einstellungen');
    return { testMode: false };
  }
};

const config = loadConfig();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'christmas-advent-calendar-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));
app.use(express.static('public'));

// Lade Kalender-Inhalte
const loadCalendarContent = () => {
  try {
    const data = fs.readFileSync('./data/calendar-content.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Fehler beim Laden der Kalender-Inhalte:', error);
    return { doors: [] };
  }
};

// API Endpoints
app.get('/api/calendar', (req, res) => {
  const content = loadCalendarContent();
  res.json(content);
});

// Test-Modus Status abrufen
app.get('/api/config', (req, res) => {
  res.json({ testMode: config.testMode });
});

// === AVATAR API ===

// GET: Custom Avatar mit Parametern generieren (DiceBear)
app.get('/api/avatar-custom/:style', async (req, res) => {
  try {
    const style = req.params.style;
    const options = req.query;
    
    // Stelle sicher, dass mindestens ein seed vorhanden ist
    if (!options.seed) {
      options.seed = 'default-' + Date.now();
    }
    
    // DiceBear erwartet alle Optionen als Arrays
    // Konvertiere alle Parameter zu Arrays (außer seed bleibt String)
    for (const [key, value] of Object.entries(options)) {
      if (key !== 'seed' && !Array.isArray(value)) {
        options[key] = [value];
      }
    }
    
    // Setze Wahrscheinlichkeiten für optionale Accessoires auf 100%
    // wenn sie ausgewählt wurden (nicht leer)
    if (options.glasses && options.glasses[0] !== '') {
      options.glassesProbability = 100;
    }
    if (options.earrings && options.earrings[0] !== '') {
      options.earringsProbability = 100;
    }
    if (options.features && options.features[0] !== '') {
      options.featuresProbability = 100;
    }
    if (options.hair && options.hair[0] !== '') {
      options.hairProbability = 100;
    }
    
    console.log('Avatar options:', JSON.stringify(options, null, 2));
    
    // Dynamischer Import des gewünschten Styles
    const { createAvatar } = await import('@dicebear/core');
    let styleModule;
    
    switch(style) {
      case 'adventurer':
        styleModule = (await import('@dicebear/collection')).adventurer;
        break;
      case 'avataaars':
        styleModule = (await import('@dicebear/collection')).avataaars;
        break;
      case 'adventurer-neutral':
        styleModule = (await import('@dicebear/collection')).adventurerNeutral;
        break;
      case 'avataaars-neutral':
        styleModule = (await import('@dicebear/collection')).avataaarsNeutral;
        break;
      default:
        return res.status(400).json({ error: 'Unknown style' });
    }
    
    // Erstelle Avatar mit allen Optionen
    const avatar = createAvatar(styleModule, options);
    const svg = avatar.toString();
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1h Cache
    res.send(svg);
  } catch (error) {
    console.error('Avatar generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// === AUTHENTICATION MIDDLEWARE ===

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }
  next();
};

// === AUTHENTICATION API ===

// POST: Register new user
app.post('/api/auth/register', (req, res) => {
  console.log('Register request body:', req.body);
  console.log('Register request headers:', req.headers);
  const { displayName, password } = req.body;
  
  // Validation
  if (!displayName || !password) {
    console.log('Missing displayName or password:', { displayName, password });
    return res.status(400).json({ error: 'DisplayName und Passwort erforderlich' });
  }
  
  if (displayName.trim().length < 3) {
    return res.status(400).json({ error: 'DisplayName muss mindestens 3 Zeichen lang sein' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
  }
  
  // Register user
  const result = dataService.registerUser(displayName.trim(), password);
  
  // Check for validation errors
  if (result && result.error) {
    return res.status(400).json({ error: result.message });
  }
  
  if (!result) {
    return res.status(400).json({ error: 'Registrierung fehlgeschlagen' });
  }
  
  const user = result;
  
  // Create session
  req.session.userId = user.userId;
  req.session.displayName = user.displayName;
  
  res.json({ 
    success: true, 
    message: 'Registrierung erfolgreich',
    user: {
      userId: user.userId,
      displayName: user.displayName,
      stars: user.stars
    }
  });
});

// POST: Login
app.post('/api/auth/login', (req, res) => {
  console.log('Login request body:', req.body);
  console.log('Login request headers:', req.headers);
  const { displayName, password } = req.body;
  
  // Validation
  if (!displayName || !password) {
    console.log('Missing displayName or password:', { displayName, password });
    return res.status(400).json({ error: 'DisplayName und Passwort erforderlich' });
  }
  
  // Login user
  const user = dataService.loginUser(displayName.trim(), password);
  
  if (!user) {
    return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
  }
  
  // Create session
  req.session.userId = user.userId;
  req.session.displayName = user.displayName;
  
  res.json({ 
    success: true, 
    message: 'Anmeldung erfolgreich',
    user: {
      userId: user.userId,
      displayName: user.displayName,
      stars: user.stars,
      avatar: user.avatar
    }
  });
});

// POST: Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Fehler beim Abmelden' });
    }
    res.json({ success: true, message: 'Erfolgreich abgemeldet' });
  });
});

// GET: Check session / get current user
app.get('/api/auth/session', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ authenticated: false });
  }
  
  const user = dataService.getUserProfileById(req.session.userId);
  
  if (!user) {
    return res.status(401).json({ authenticated: false });
  }
  
  // Track daily login
  dataService.trackDailyLogin(req.session.userId);
  
  res.json({ 
    authenticated: true,
    user: {
      userId: user.userId,
      displayName: user.displayName,
      stars: user.stars,
      avatar: user.avatar
    }
  });
});

// === GAMES API ===

// GET: Alle Spiele abrufen
app.get('/api/games', (req, res) => {
  const activeOnly = req.query.active === 'true';
  const games = activeOnly ? dataService.getActiveGames() : dataService.getAllGames();
  res.json({ games });
});

// GET: Ein spezifisches Spiel abrufen
app.get('/api/games/:gameId', (req, res) => {
  const game = dataService.getGameById(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json({ game });
});

// === STATS API ===

// GET: Top 3 für ein bestimmtes Spiel abrufen
app.get('/api/stats/:gameName', (req, res) => {
  const gameName = req.params.gameName;
  const top3 = dataService.getTopPlayers(gameName, 3);
  res.json({ top3 });
});

// GET: ALLE Scores für ein Spiel abrufen
app.get('/api/stats/:gameName/all', (req, res) => {
  const gameName = req.params.gameName;
  const allScores = dataService.getGameStats(gameName);
  res.json({ allScores });
});

// GET: Globale Rangliste über alle Spiele
app.get('/api/leaderboard/global', (req, res) => {
  const leaderboard = dataService.getGlobalLeaderboard();
  res.json({ leaderboard });
});

// POST: Statistik speichern/aktualisieren
app.post('/api/stats', (req, res) => {
  const { gameName, username, score, playTime } = req.body;
  
  // Get userId from session if available, otherwise use username from body
  let userId = req.session?.userId;
  let displayName = username;
  
  // If user is logged in, use their userId
  if (userId) {
    const user = dataService.getUserProfileById(userId);
    if (user) {
      displayName = user.displayName;
    }
  }
  
  // Validierung
  if (!gameName || !displayName || score === undefined) {
    return res.status(400).json({ error: 'Fehlende Daten (gameName, username, score erforderlich)' });
  }
  
  // Save game score (still using displayName for stats.json compatibility)
  const success = dataService.savePlayerScore(gameName, displayName, score, playTime || 0);
  
  // Update user stats only if logged in
  if (success && userId) {
    dataService.updateUserStats(userId, gameName, score, playTime || 0);
  }
  
  res.json({ success: true, message: 'Statistik gespeichert' });
});

// API Endpoint zum Aktualisieren des Benutzernamens (Legacy - nutzt jetzt dataService)
app.post('/api/update-username', (req, res) => {
  const { oldUsername, newUsername } = req.body;
  
  if (!oldUsername || !newUsername) {
    return res.status(400).json({ error: 'Fehlende Daten (oldUsername, newUsername erforderlich)' });
  }
  
  const success = dataService.updateUsername(oldUsername, newUsername);
  
  if (success) {
    res.json({ success: true, message: 'Benutzername aktualisiert' });
  } else {
    res.status(400).json({ error: 'Username bereits vergeben oder Benutzer nicht gefunden' });
  }
});

app.get('/api/door/:day', (req, res) => {
  const day = parseInt(req.params.day);
  const content = loadCalendarContent();
  
  // Validierung: Ist das Türchen gültig?
  if (day < 1 || day > 24) {
    return res.status(400).json({ error: 'Ungültiger Tag' });
  }
  
  // Finde das entsprechende Türchen
  const door = content.doors.find(d => d.day === day);
  
  if (!door) {
    return res.status(404).json({ error: 'Türchen nicht gefunden' });
  }
  
  // Prüfe, ob das Türchen geöffnet werden darf
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1; // 0-11, daher +1
  
  // Türchen darf nur im Dezember und nur am oder nach dem entsprechenden Tag geöffnet werden
  const canOpen = currentMonth === 12 && currentDay >= day;
  
  res.json({
    ...door,
    canOpen,
    currentDate: {
      day: currentDay,
      month: currentMonth,
      year: today.getFullYear()
    }
  });
});

// POST: Track door opening
app.post('/api/door/:day/open', (req, res) => {
  const day = parseInt(req.params.day);
  
  // Validierung
  if (day < 1 || day > 24) {
    return res.status(400).json({ error: 'Ungültiger Tag' });
  }
  
  // Track door opening if user is logged in
  if (req.session?.userId) {
    dataService.trackDoorOpened(req.session.userId, day);
  }
  
  res.json({ success: true });
});

// =====================
// USER API ENDPOINTS
// =====================

// GET: Current User Profile (Protected)
app.get('/api/user/profile', requireAuth, (req, res) => {
  const profile = dataService.getUserProfileById(req.session.userId);
  if (!profile) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  }
  res.json(profile);
});

// GET: Current User Stars (Protected)
app.get('/api/user/stars', requireAuth, (req, res) => {
  const stars = dataService.calculateUserStars(req.session.userId);
  if (!stars) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden' });
  }
  res.json(stars);
});

// POST: Update Avatar (Protected)
app.post('/api/user/avatar', requireAuth, (req, res) => {
  const { style, options } = req.body;
  
  if (!style) {
    return res.status(400).json({ error: 'Style required' });
  }
  
  const success = dataService.updateUserAvatar(req.session.userId, { style, options });
  
  if (success) {
    res.json({ success: true, message: 'Avatar aktualisiert' });
  } else {
    res.status(500).json({ error: 'Fehler beim Aktualisieren' });
  }
});

// POST: Update Display Name (Protected)
app.post('/api/user/displayname', requireAuth, (req, res) => {
  const { newDisplayName } = req.body;
  
  if (!newDisplayName) {
    return res.status(400).json({ error: 'Neuer DisplayName erforderlich' });
  }
  
  if (newDisplayName.trim().length < 3) {
    return res.status(400).json({ error: 'DisplayName muss mindestens 3 Zeichen lang sein' });
  }
  
  // Validate display name format
  if (!dataService.isValidDisplayName(newDisplayName.trim())) {
    return res.status(400).json({ error: 'Nutzername enthält ungültige Zeichen. Erlaubt sind nur Buchstaben, Zahlen und . - _ @ #' });
  }
  
  const success = dataService.updateDisplayName(req.session.userId, newDisplayName.trim());
  
  if (success) {
    req.session.displayName = newDisplayName.trim();
    res.json({ success: true, message: 'DisplayName aktualisiert' });
  } else {
    res.status(400).json({ error: 'DisplayName bereits vergeben oder Benutzer nicht gefunden' });
  }
});

// POST: Update Password (Protected)
app.post('/api/user/password', requireAuth, (req, res) => {
  console.log('Password change request:', { userId: req.session.userId, body: req.body });
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    console.log('Missing fields');
    return res.status(400).json({ error: 'Aktuelles und neues Passwort erforderlich' });
  }
  
  if (newPassword.length < 6) {
    console.log('Password too short');
    return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
  }
  
  const success = dataService.updatePassword(req.session.userId, currentPassword, newPassword);
  console.log('Update password result:', success);
  
  if (success) {
    res.json({ success: true, message: 'Passwort erfolgreich geändert' });
  } else {
    res.status(400).json({ error: 'Aktuelles Passwort falsch oder Benutzer nicht gefunden' });
  }
});

// GET: All users sorted by stars
app.get('/api/users/leaderboard', (req, res) => {
  const users = dataService.getAllUsersSortedByStars();
  res.json({ users });
});

// GET: All users with avatars (for dashboard)
app.get('/api/users/avatars', (req, res) => {
  const allUsers = dataService.loadUsers();
  const userAvatars = {};
  
  for (const userId in allUsers.users) {
    const user = allUsers.users[userId];
    userAvatars[user.displayName] = {
      style: user.avatar?.style || 'adventurer',
      options: user.avatar?.options || {}
    };
  }
  
  res.json({ avatars: userAvatars });
});

// GET: Player stats for a specific user
app.get('/api/users/:username/stats', (req, res) => {
  const username = req.params.username;
  const stats = dataService.loadStats();
  
  let totalGamesPlayed = 0;
  let totalPlayTime = 0;
  const gameCounts = {};
  
  // Aggregiere Stats über alle Spiele
  for (const gameName in stats.games) {
    const players = stats.games[gameName];
    const playerData = players.find(p => p.username === username);
    
    if (playerData) {
      totalGamesPlayed += playerData.gamesPlayed || 0;
      totalPlayTime += playerData.totalPlayTime || playerData.playTime || 0;
      gameCounts[gameName] = playerData.gamesPlayed || 1;
    }
  }
  
  // Finde Lieblingsspiel (am meisten gespielt)
  let favoriteGame = null;
  let maxCount = 0;
  for (const [game, count] of Object.entries(gameCounts)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteGame = game;
    }
  }
  
  res.json({
    username,
    totalGamesPlayed,
    totalPlayTime,
    favoriteGame,
    gamesWithScores: Object.keys(gameCounts).length
  });
});

// =====================
// WISHLIST API ENDPOINTS
// =====================

// Load wishlists
const loadWishlists = () => {
  try {
    const data = fs.readFileSync('./data/wishlists.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

// Save wishlists
const saveWishlists = (wishlists) => {
  try {
    fs.writeFileSync('./data/wishlists.json', JSON.stringify(wishlists, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving wishlists:', error);
    return false;
  }
};

// GET: Load user's wishlist
app.get('/api/wishlist', (req, res) => {
  const userId = req.session?.userId || 'guest';
  const wishlists = loadWishlists();
  
  const wishlist = wishlists[userId] || {
    wishes: [],
    sent: false,
    sentAt: null
  };
  
  res.json(wishlist);
});

// POST: Save user's wishlist
app.post('/api/wishlist', (req, res) => {
  const userId = req.session?.userId || 'guest';
  const { wishes } = req.body;
  
  if (!Array.isArray(wishes)) {
    return res.status(400).json({ error: 'Invalid wishes format' });
  }
  
  const wishlists = loadWishlists();
  
  // Check if already sent
  if (wishlists[userId]?.sent) {
    return res.status(403).json({ error: 'Wunschzettel bereits gesendet' });
  }
  
  wishlists[userId] = {
    wishes: wishes.slice(0, 20), // Max 20 wishes
    sent: false,
    sentAt: null,
    lastUpdated: new Date().toISOString()
  };
  
  if (saveWishlists(wishlists)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Fehler beim Speichern' });
  }
});

// POST: Send wishlist to Santa
app.post('/api/wishlist/send', (req, res) => {
  const userId = req.session?.userId || 'guest';
  const wishlists = loadWishlists();
  
  if (!wishlists[userId] || wishlists[userId].wishes.length === 0) {
    return res.status(400).json({ error: 'Keine Wünsche vorhanden' });
  }
  
  if (wishlists[userId].sent) {
    return res.status(403).json({ error: 'Wunschzettel bereits gesendet' });
  }
  
  wishlists[userId].sent = true;
  wishlists[userId].sentAt = new Date().toISOString();
  
  if (saveWishlists(wishlists)) {
    res.json({ success: true, message: 'Wunschzettel gesendet!' });
  } else {
    res.status(500).json({ error: 'Fehler beim Senden' });
  }
});

// =====================
// MESSAGES API ENDPOINTS
// =====================

// Load messages
const loadMessages = () => {
  try {
    const data = fs.readFileSync('./data/messages.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

// Save messages
const saveMessages = (messages) => {
  try {
    fs.writeFileSync('./data/messages.json', JSON.stringify(messages, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving messages:', error);
    return false;
  }
};

// GET: Load all users (for message recipients)
app.get('/api/users/all', (req, res) => {
  try {
    const users = dataService.getAllUsers();
    console.log('getAllUsers returned:', users.length, 'users');
    if (!Array.isArray(users)) {
      console.error('getAllUsers did not return an array:', users);
      return res.json([]);
    }
    const userList = users.map(u => {
      console.log('Processing user:', { userId: u.userId, username: u.username, displayName: u.displayName });
      return {
        userId: u.userId,
        username: u.username || u.displayName || 'Unbekannt'
      };
    });
    console.log('Returning userList:', userList);
    res.json(userList);
  } catch (error) {
    console.error('Error in /api/users/all:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Benutzer' });
  }
});

// GET: Load user's messages and unread counts
app.get('/api/messages', (req, res) => {
  const userId = req.session?.userId || 'guest';
  const allMessages = loadMessages();
  
  console.log('GET /api/messages - userId:', userId);
  console.log('All messages:', Object.keys(allMessages));
  
  // Filter conversations involving current user
  const userMessages = {};
  const unreadCounts = {};
  
  Object.keys(allMessages).forEach(conversationKey => {
    // ConversationKey format: "user_xxxxx_user_yyyyy"
    // We need to find where the second "user_" starts
    const parts = conversationKey.split('_');
    // Find index where second userId starts (when we see "user" again after first userId)
    let splitIndex = -1;
    for (let i = 2; i < parts.length; i++) {
      if (parts[i] === 'user') {
        splitIndex = i;
        break;
      }
    }
    
    let user1, user2;
    if (splitIndex > 0) {
      user1 = parts.slice(0, splitIndex).join('_');
      user2 = parts.slice(splitIndex).join('_');
    } else {
      // Fallback: assume each userId is "user_" + hash
      const firstUserEnd = conversationKey.indexOf('_user_', 5);
      if (firstUserEnd > 0) {
        user1 = conversationKey.substring(0, firstUserEnd);
        user2 = conversationKey.substring(firstUserEnd + 1);
      } else {
        console.error('Invalid conversation key format:', conversationKey);
        return;
      }
    }
    
    console.log('Checking conversation:', conversationKey, 'user1:', user1, 'user2:', user2);
    
    if (user1 === userId || user2 === userId) {
      console.log('Match found for userId:', userId);
      userMessages[conversationKey] = allMessages[conversationKey];
      
      // Count unread messages
      const unread = allMessages[conversationKey].filter(msg => 
        msg.recipientId === userId && !msg.read
      );
      
      if (unread.length > 0) {
        const senderId = user1 === userId ? user2 : user1;
        unreadCounts[senderId] = unread.length;
      }
    }
  });
  
  console.log('Returning userMessages:', Object.keys(userMessages));
  console.log('Returning unreadCounts:', unreadCounts);
  
  res.json({ 
    messages: userMessages,
    unreadCounts: unreadCounts
  });
});

// GET: Get total unread message count
app.get('/api/messages/unread-count', (req, res) => {
  const userId = req.session?.userId || 'guest';
  const allMessages = loadMessages();
  
  let totalUnread = 0;
  
  Object.values(allMessages).forEach(conversation => {
    const unread = conversation.filter(msg => 
      msg.recipientId === userId && !msg.read
    );
    totalUnread += unread.length;
  });
  
  res.json({ count: totalUnread });
});

// POST: Send message
app.post('/api/messages/send', (req, res) => {
  const senderId = req.session?.userId || 'guest';
  const { recipientId, content } = req.body;
  
  if (!recipientId || !content) {
    return res.status(400).json({ error: 'Empfänger und Nachricht erforderlich' });
  }
  
  if (content.length > 500) {
    return res.status(400).json({ error: 'Nachricht zu lang (max 500 Zeichen)' });
  }
  
  const allMessages = loadMessages();
  const conversationKey = [senderId, recipientId].sort().join('_');
  
  if (!allMessages[conversationKey]) {
    allMessages[conversationKey] = [];
  }
  
  // Check daily limit (1 message per day per recipient)
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().split('T')[0];
  
  const sentToday = allMessages[conversationKey].filter(msg => {
    if (msg.senderId !== senderId) return false;
    const msgDate = new Date(msg.timestamp);
    const msgDateUTC = new Date(Date.UTC(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate())).toISOString().split('T')[0];
    return msgDateUTC === todayUTC;
  });
  
  if (sentToday.length >= 1) {
    return res.status(403).json({ error: 'Du hast heute bereits eine Nachricht an diesen Benutzer gesendet' });
  }
  
  // Add message
  allMessages[conversationKey].push({
    senderId: senderId,
    recipientId: recipientId,
    content: content,
    timestamp: new Date().toISOString(),
    read: false
  });
  
  if (saveMessages(allMessages)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Fehler beim Senden' });
  }
});

// POST: Mark messages as read
app.post('/api/messages/mark-read', (req, res) => {
  const userId = req.session?.userId || 'guest';
  const { senderId } = req.body;
  
  if (!senderId) {
    return res.status(400).json({ error: 'Sender ID erforderlich' });
  }
  
  const allMessages = loadMessages();
  const conversationKey = [userId, senderId].sort().join('_');
  
  if (allMessages[conversationKey]) {
    allMessages[conversationKey].forEach(msg => {
      if (msg.recipientId === userId && msg.senderId === senderId) {
        msg.read = true;
      }
    });
    
    saveMessages(allMessages);
  }
  
  res.json({ success: true });
});

// ============================
// Puzzle API
// ============================

// Liste verfügbare Puzzle-Bilder
app.get('/api/puzzle/images', (req, res) => {
  const puzzleDir = path.join(__dirname, 'public', 'images', 'puzzle');
  
  try {
    if (!fs.existsSync(puzzleDir)) {
      fs.mkdirSync(puzzleDir, { recursive: true });
      return res.json([]);
    }
    
    const files = fs.readdirSync(puzzleDir);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => ({
        name: file,
        url: `/images/puzzle/${file}`
      }));
    
    res.json(images);
  } catch (error) {
    console.error('Fehler beim Laden der Bilder:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Bilder' });
  }
});

// Puzzle-Galerie laden
const PUZZLE_GALLERY_FILE = path.join(__dirname, 'data', 'puzzle-gallery.json');

const loadPuzzleGallery = () => {
  try {
    if (fs.existsSync(PUZZLE_GALLERY_FILE)) {
      const data = fs.readFileSync(PUZZLE_GALLERY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Fehler beim Laden der Galerie:', error);
  }
  return { completions: [] };
};

const savePuzzleGallery = (data) => {
  try {
    const dir = path.dirname(PUZZLE_GALLERY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PUZZLE_GALLERY_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fehler beim Speichern der Galerie:', error);
    throw error;
  }
};

// Puzzle speichern
app.post('/api/puzzle-gallery/save', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Nicht angemeldet' });
  }
  
  const { imageName, imageUrl, difficulty, moves, time, timeSeconds } = req.body;
  
  if (!imageName || !imageUrl || !difficulty || !moves || !time) {
    return res.status(400).json({ error: 'Fehlende Daten' });
  }
  
  const gallery = loadPuzzleGallery();
  const user = loadUser(req.session.userId);
  
  const completion = {
    id: Date.now().toString(),
    userId: req.session.userId,
    userName: user.name,
    imageName,
    imageUrl,
    difficulty,
    moves,
    time,
    timeSeconds,
    timestamp: new Date().toISOString()
  };
  
  gallery.completions.push(completion);
  savePuzzleGallery(gallery);
  
  res.json({ success: true, completion });
});

// Galerie laden
app.get('/api/puzzle-gallery', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Nicht angemeldet' });
  }
  
  const gallery = loadPuzzleGallery();
  res.json(gallery);
});

// Puzzle löschen
app.delete('/api/puzzle-gallery/:id', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Nicht angemeldet' });
  }
  
  const gallery = loadPuzzleGallery();
  const completion = gallery.completions.find(c => c.id === req.params.id);
  
  if (!completion) {
    return res.status(404).json({ error: 'Puzzle nicht gefunden' });
  }
  
  if (completion.userId !== req.session.userId) {
    return res.status(403).json({ error: 'Nicht berechtigt' });
  }
  
  gallery.completions = gallery.completions.filter(c => c.id !== req.params.id);
  savePuzzleGallery(gallery);
  
  res.json({ success: true });
});

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server starten
app.listen(PORT, () => {
  console.log(`🎄 Adventskalender läuft auf http://localhost:${PORT}`);
  console.log(`🎅 Frohe Weihnachten!`);
  
  if (config.testMode) {
    console.log(`\n⚠️  TEST-MODUS AKTIVIERT ⚠️`);
    console.log(`🔓 Alle Türchen können ohne Datumsrestriktion geöffnet werden!`);
    console.log(`💡 Zum Deaktivieren: Setze "testMode": false in config.json\n`);
  } else {
    console.log(`✅ Produktionsmodus: Türchen nur am jeweiligen Tag verfügbar`);
  }
});
