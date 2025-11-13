import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dataService from './services/dataService.js';
import * as avatarGenerator from './avatarGenerator.js';

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
app.use(cors());
app.use(express.json());
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

// GET: Avatar SVG für einen bestimmten Charakter
app.get('/api/avatar/:characterId', (req, res) => {
  try {
    const svg = avatarGenerator.generateAvatar(req.params.characterId);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h Cache
    res.send(svg);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// GET: Alle verfügbaren Avatar-IDs
app.get('/api/avatars/list', (req, res) => {
  const avatarIds = Object.keys(avatarGenerator.avatarConfigs);
  res.json({ avatars: avatarIds });
});

// GET: Custom Avatar mit Parametern generieren
app.get('/api/avatar-custom/:style', async (req, res) => {
  try {
    const style = req.params.style;
    const options = req.query;
    
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
    
    const avatar = createAvatar(styleModule, options);
    const svg = avatar.toString();
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1h Cache
    res.send(svg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
  
  // Validierung
  if (!gameName || !username || score === undefined) {
    return res.status(400).json({ error: 'Fehlende Daten (gameName, username, score erforderlich)' });
  }
  
  // Use data service to save score
  const success = dataService.savePlayerScore(gameName, username, score, playTime);
  
  if (success) {
    res.json({ success: true, message: 'Statistik gespeichert' });
  } else {
    res.status(500).json({ error: 'Fehler beim Speichern' });
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
