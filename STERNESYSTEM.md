# ⭐ Sternesystem - Dokumentation

## Übersicht

Das Sternesystem bewertet Spieler basierend auf verschiedenen Metriken und vergibt Sterne in 8 Kategorien.

**Maximale Sterne: 3000** ⭐

---

## Sternkategorien

### 1. 🎮 Game Score Stars (max 1000)
- **Berechnung:** 1 Stern pro 10 Punkte Gesamtscore
- **Quelle:** `stats.totalScore`
- **Beispiel:** 5000 Punkte = 500 Sterne

### 2. 🏆 Mastery Stars (max 500)
- **Berechnung:** 
  - 50 Sterne pro 1. Platz
  - 20 Sterne pro Top-3-Platz (ohne 1. Plätze)
- **Quelle:** `stats.top1Count`, `stats.top3Count`
- **Beispiel:** 3x 1. Platz + 5x 2./3. Platz = 150 + 100 = 250 Sterne

### 3. 🔥 Consistency Stars (max 300)
- **Berechnung:** 10 Sterne pro Tag im längsten Streak
- **Quelle:** `stats.longestStreak`
- **Beispiel:** 15 Tage Streak = 150 Sterne

### 4. 📈 Improvement Stars (max 200)
- **Berechnung:** 2 Sterne pro 1% Verbesserungsrate
- **Quelle:** `stats.improvementRate`
- **Beispiel:** 70% Verbesserung = 140 Sterne

### 5. 🎄 Engagement Stars (max 400)
- **Berechnung:** 
  - 2 Sterne pro Daily Login
  - 5 Sterne pro geöffnetes Türchen
- **Quelle:** `stats.dailyLoginCount`, `stats.doorsOpened`
- **Beispiel:** 20 Logins + 15 Türchen = 40 + 75 = 115 Sterne

### 6. 🌈 Variety Stars (max 150)
- **Berechnung:** 15 Sterne pro einzigartig gespieltes Spiel
- **Quelle:** `stats.uniqueGamesPlayed`
- **Beispiel:** 8 verschiedene Spiele = 120 Sterne

### 7. ⏰ Dedication Stars (max 250)
- **Berechnung:** 1 Stern pro 2 Minuten Spielzeit
- **Quelle:** `stats.totalPlayTime` (in Sekunden)
- **Beispiel:** 300 Minuten = 150 Sterne

### 8. 🎁 Achievement Stars (max 200)
- **Berechnung:** 10 Sterne pro freigeschaltetem Achievement
- **Quelle:** `achievements.length`
- **Beispiel:** 12 Achievements = 120 Sterne

---

## User-Datenstruktur

```json
{
  "username": "BenutzerName",
  "createdAt": "2024-12-01T10:00:00.000Z",
  "lastActive": "2024-12-15T14:30:00.000Z",
  
  "avatar": {
    "style": "adventurer",
    "options": { "hair": "short", "eyes": "happy" },
    "lastChanged": "2024-12-10T12:00:00.000Z"
  },
  "avatarChanges": 3,
  "usernameChanges": 1,
  "usernameHistory": [
    {
      "oldName": "AlterName",
      "newName": "NeuerName",
      "changedAt": "2024-12-05T10:00:00.000Z"
    }
  ],
  
  "stats": {
    "totalGamesPlayed": 42,
    "totalPlayTime": 3600,
    "totalScore": 5420,
    "averageScore": 129,
    "bestGame": { "gameName": "santa-snake", "score": 450 },
    "worstGame": { "gameName": "flappy-santa", "score": 12 },
    "favoriteGame": "snowflake-catcher",
    
    "perfectGames": 3,
    "comebacks": 5,
    "consistency": 85,
    
    "longestPlaySession": 600,
    "shortestPlaySession": 45,
    "averagePlayTime": 86,
    "totalDaysPlayed": 15,
    "lastPlayedDate": "2024-12-15",
    "playStreak": 8,
    "longestStreak": 12,
    
    "winRate": 42.5,
    "top1Count": 5,
    "top3Count": 18,
    "improvementRate": 67.3,
    
    "gamesPerDay": 2.8,
    "uniqueGamesPlayed": 8,
    "completionRate": 95.2,
    
    "christmasSpiritScore": 842,
    "dailyLoginCount": 20,
    "doorsOpened": 15
  },
  
  "stars": {
    "total": 1547,
    "breakdown": {
      "gameScore": 542,
      "mastery": 350,
      "consistency": 120,
      "improvement": 134,
      "engagement": 115,
      "variety": 120,
      "dedication": 150,
      "achievements": 16
    },
    "lastCalculated": "2024-12-15T14:30:00.000Z"
  },
  
  "achievements": [
    "first_win",
    "perfect_score",
    "streak_master"
  ],
  
  "unlockedItems": {
    "avatarStyles": ["adventurer", "lorelei", "pixel-art"],
    "avatarOptions": {
      "hair": ["short", "long", "curly"],
      "eyes": ["happy", "wink", "closed"]
    },
    "badges": ["early_bird", "night_owl"],
    "titles": ["Santa's Helper", "Snowflake Master"]
  },
  
  "preferences": {
    "notifications": true,
    "soundEnabled": true,
    "theme": "christmas"
  }
}
```

---

## Tracked Statistics

### Spielstatistiken
- **totalGamesPlayed** - Anzahl aller gespielten Spiele
- **totalPlayTime** - Gesamtspielzeit in Sekunden
- **totalScore** - Summe aller erzielten Punkte
- **averageScore** - Durchschnittliche Punktzahl pro Spiel
- **bestGame** - Bestes Spiel mit höchster Punktzahl
- **worstGame** - Schlechtestes Spiel
- **favoriteGame** - Am meisten gespieltes Spiel

### Leistungsstatistiken
- **perfectGames** - Spiele mit > 90% der Bestleistung
- **comebacks** - Verbesserungen nach schlechter Runde
- **consistency** - Geringe Varianz in Scores (0-100)
- **winRate** - Prozentsatz Top-3-Platzierungen
- **top1Count** - Anzahl 1. Plätze
- **top3Count** - Anzahl Top-3-Platzierungen
- **improvementRate** - Prozentsatz verbesserter Spiele

### Zeitstatistiken
- **longestPlaySession** - Längste Spielsession (Sekunden)
- **shortestPlaySession** - Kürzeste Spielsession
- **averagePlayTime** - Durchschnittliche Spielzeit
- **totalDaysPlayed** - Anzahl gespielter Tage
- **lastPlayedDate** - Letztes Spieldatum (YYYY-MM-DD)
- **playStreak** - Aktuelle Streak (Tage)
- **longestStreak** - Längste Streak

### Engagementstatistiken
- **gamesPerDay** - Durchschnittliche Spiele pro Tag
- **uniqueGamesPlayed** - Anzahl verschiedener Spiele
- **completionRate** - Prozentsatz vollständig gespielter Spiele
- **christmasSpiritScore** - Custom Weihnachts-Metrik
- **dailyLoginCount** - Anzahl täglicher Logins
- **doorsOpened** - Anzahl geöffneter Türchen

---

## API Endpoints

### User Profile
```
GET /api/user/:username
Response: { user profile object }
```

### User Stars
```
GET /api/user/:username/stars
Response: { 
  total: 1547,
  breakdown: { ... },
  lastCalculated: "..."
}
```

### Update Avatar
```
POST /api/user/avatar
Body: { username, style, options }
Response: { success: true }
```

### Update Username
```
POST /api/user/update-username
Body: { oldUsername, newUsername }
Response: { success: true }
```

### Users Leaderboard (by Stars)
```
GET /api/users/leaderboard
Response: { users: [ ...sorted by stars... ] }
```

---

## Automatische Updates

Das System aktualisiert automatisch:

1. **Nach jedem Spiel:**
   - User Stats werden aktualisiert
   - Sterne werden neu berechnet
   - Play Streak wird geprüft

2. **Bei Avatar-Änderung:**
   - `avatarChanges` wird erhöht
   - `avatar.lastChanged` wird gesetzt

3. **Bei Username-Änderung:**
   - Alle Stats werden migriert
   - `usernameChanges` wird erhöht
   - History wird aktualisiert
   - Einträge in `stats.json` werden aktualisiert

---

## Unlock-System

Sterne können verwendet werden um Items freizuschalten:

```javascript
// Beispiel: Avatar-Style Unlock-Requirements
{
  "adventurer": { unlockScore: 0 },
  "lorelei": { unlockScore: 100 },
  "pixel-art": { unlockScore: 250 },
  "bottts": { unlockScore: 500 },
  "avataaars": { unlockScore: 1000 }
}
```

---

## Integration

### Im Avatar Editor:
```javascript
// Sterne laden
const response = await fetch(`/api/user/${username}/stars`);
const stars = await response.json();
userScore = stars.total;

// Avatar speichern
await fetch('/api/user/avatar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, style, options })
});
```

### Nach Spiel-Ende:
```javascript
// Stats werden automatisch durch POST /api/stats aktualisiert
await statsManager.saveStats(gameName, score, playTime);
// -> updateUserStats() wird im Backend automatisch aufgerufen
```

---

## Beispiel-Berechnung

**Spieler:** "FröhlicherElf"

- **Spiele:** 50 gespielt, Ø 120 Punkte = 6000 Punkte gesamt
  - → Game Score: **600 Sterne**
  
- **Platzierungen:** 5× 1. Platz, 12× Top-3
  - → Mastery: **250 + 140 = 390 Sterne**
  
- **Streak:** 18 Tage längster Streak
  - → Consistency: **180 Sterne**
  
- **Verbesserung:** 72% der Spiele verbessert
  - → Improvement: **144 Sterne**
  
- **Engagement:** 22 Logins, 20 Türchen
  - → Engagement: **44 + 100 = 144 Sterne**
  
- **Vielfalt:** 10 verschiedene Spiele
  - → Variety: **150 Sterne** (capped)
  
- **Dedication:** 420 Minuten Spielzeit
  - → Dedication: **210 Sterne**
  
- **Achievements:** 8 freigeschaltet
  - → Achievements: **80 Sterne**

**Gesamt: 2148 Sterne** ⭐ (von max. 3000)

---

## Zukünftige Erweiterungen

- Achievements-System implementieren
- Badges für besondere Leistungen
- Titel freischalten
- Seasonal Events tracken
- Challenges & Quests
- Social Features (Freunde, Vergleiche)
