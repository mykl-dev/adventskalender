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
  const user = dataService.registerUser(displayName.trim(), password);
  
  if (!user) {
    return res.status(400).json({ error: 'DisplayName bereits vergeben' });
  }
  
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
