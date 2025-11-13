# Modulares Spiele- und Statistik-System

Dieses System ermöglicht es, Spiele und deren Statistiken modular zu verwalten. Neue Spiele können einfach hinzugefügt werden, ohne Code ändern zu müssen.

## Architektur

### 1. Data Layer (`/services/dataService.js`)
- **Zweck**: Abstraktionsschicht für Datenzugriff
- **Vorteil**: Kann später einfach durch Datenbankanbindung ersetzt werden
- **Methoden**:
  - `getAllGames()` - Alle Spiele laden
  - `getActiveGames()` - Nur aktive Spiele
  - `getGameById(id)` - Einzelnes Spiel
  - `addGame(data)` - Neues Spiel hinzufügen
  - `updateGame(id, updates)` - Spiel aktualisieren
  - `getGameStats(gameName)` - Stats eines Spiels
  - `getTopPlayers(gameName, limit)` - Top N Spieler
  - `getAllStats()` - Alle Stats
  - `savePlayerScore(...)` - Score speichern
  - `getGlobalLeaderboard()` - Globale Rangliste

### 2. Games Configuration (`/data/games.json`)
Zentrale Konfiguration aller Spiele:

```json
{
  "games": [
    {
      "id": "gift-catcher",
      "name": "Geschenke Fangen",
      "icon": "🎁",
      "description": "Fange so viele Geschenke wie möglich!",
      "category": "arcade",
      "difficulty": "easy",
      "scoreType": "points",
      "active": true
    }
  ]
}
```

**Felder**:
- `id` (required): Eindeutige ID, muss mit `gameName` in `saveStats()` übereinstimmen
- `name` (required): Anzeigename
- `icon`: Emoji-Icon für UI
- `description`: Kurzbeschreibung
- `category`: Kategorie (arcade, physics, puzzle, etc.)
- `difficulty`: Schwierigkeitsgrad (easy, medium, hard)
- `scoreType`: Art des Scores (points, distance, time)
- `scoreUnit`: Einheit (z.B. "m" für Meter)
- `active`: true/false - Ob Spiel aktiv ist

### 3. REST API Endpoints

#### Games API
```
GET  /api/games                  # Alle Spiele
GET  /api/games?active=true      # Nur aktive Spiele
GET  /api/games/:gameId          # Einzelnes Spiel
```

#### Stats API
```
GET  /api/stats/:gameName        # Top 3 eines Spiels
GET  /api/stats/:gameName/all    # Alle Scores eines Spiels
POST /api/stats                  # Score speichern
GET  /api/leaderboard/global     # Globale Rangliste
```

### 4. Dashboard (`/public/dashboard.js`)
- Lädt Spiele dynamisch von `/api/games`
- Lädt Rangliste von `/api/leaderboard/global`
- Automatisch aktualisiert bei neuen Spielen

## Neues Spiel hinzufügen

### Schritt 1: Spiel in `games.json` eintragen
```json
{
  "id": "mein-neues-spiel",
  "name": "Mein Neues Spiel",
  "icon": "🎮",
  "description": "Tolle Beschreibung",
  "category": "arcade",
  "difficulty": "medium",
  "scoreType": "points",
  "active": true
}
```

### Schritt 2: Im Spiel-Code Stats speichern
```javascript
// Bei Game Over
await statsManager.saveStats('mein-neues-spiel', score, playTime);

// Top 3 laden
const top3 = await statsManager.getTop3('mein-neues-spiel');
```

**Wichtig**: Die `gameName` muss exakt mit der `id` in `games.json` übereinstimmen!

### Schritt 3: Fertig!
Das Dashboard zeigt das Spiel automatisch an. Keine Code-Änderungen nötig!

## Migration zu Datenbank

Der `dataService` ist so gestaltet, dass er leicht durch eine Datenbank ersetzt werden kann:

### Beispiel: MongoDB Migration
```javascript
class MongoDataService {
  constructor() {
    this.db = connectToMongoDB();
  }

  async getAllGames() {
    return await this.db.collection('games').find().toArray();
  }

  async getGameStats(gameName) {
    return await this.db.collection('stats')
      .find({ gameName })
      .toArray();
  }

  // ... weitere Methoden
}

// Einfach ersetzen:
module.exports = new MongoDataService();
```

### Beispiel: MySQL Migration
```javascript
class MySQLDataService {
  constructor() {
    this.pool = mysql.createPool({...});
  }

  async getAllGames() {
    const [rows] = await this.pool.query('SELECT * FROM games WHERE active = 1');
    return rows;
  }

  // ... weitere Methoden
}
```

Die API-Endpoints bleiben unverändert!

## Vorteile

✅ **Modular**: Neue Spiele ohne Code-Änderungen
✅ **Skalierbar**: Service-Layer leicht durch DB ersetzbar
✅ **Wartbar**: Zentrale Konfiguration in `games.json`
✅ **Flexibel**: Verschiedene Score-Typen und Einheiten
✅ **Performant**: Globale Rangliste wird serverseitig berechnet
✅ **Erweiterbar**: Neue Felder können einfach hinzugefügt werden

## Bestehende Spiele

1. **Gift Catcher** (`gift-catcher`) - 🎁 Geschenke fangen
2. **Snowflake Catcher** (`snowflake-catcher`) - ❄️ Schneeflocken sammeln
3. **Santa Launcher** (`santa-launcher`) - 🎯 Santa schießen
4. **Flappy Santa** (`flappy-santa`) - 🛷 Mit Santa fliegen
