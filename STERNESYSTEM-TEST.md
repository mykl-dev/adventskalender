# 🧪 Sternesystem - Test-Anleitung

## Quick Start Test

### 1. Server starten
```bash
cd F:\Projekte\Test\GitHub\Adventskalender\adventskalender
npm start
```

### 2. User Profile erstellen (automatisch)
Spiele ein beliebiges Spiel mit einem Benutzernamen:
- Öffne z.B. Santa Snake
- Spiele das Spiel
- Score wird automatisch gespeichert
- User-Profil wird automatisch in `data/users.json` erstellt

### 3. API-Tests

#### User Profile abrufen
```bash
# Browser oder curl
http://localhost:3000/api/user/DeinUsername
```

#### Sterne abrufen
```bash
http://localhost:3000/api/user/DeinUsername/stars
```

#### Alle User nach Sternen sortiert
```bash
http://localhost:3000/api/users/leaderboard
```

### 4. Avatar Editor Test

1. Öffne den Avatar Editor: `http://localhost:3000/avatar-editor.html`
2. Erstelle einen Avatar und speichere ihn
3. Die Sterne sollten jetzt oben angezeigt werden (aus Backend geladen)
4. Öffne `data/users.json` und prüfe:
   - User wurde erstellt
   - `avatarChanges` wurde erhöht
   - `avatar.lastChanged` wurde gesetzt

### 5. Spiel spielen Test

1. Spiele ein Spiel (z.B. Santa Snake)
2. Erreiche einen Score
3. Prüfe in `data/users.json`:
   - `stats.totalGamesPlayed` erhöht
   - `stats.totalScore` erhöht
   - `stats.totalPlayTime` erhöht
   - `stars.total` wurde neu berechnet

### 6. Sterne-Berechnung manuell testen

```javascript
// Im Browser Console (nach Laden einer Seite)
fetch('/api/user/DeinUsername/stars')
  .then(r => r.json())
  .then(console.log);

// Erwartetes Ergebnis:
{
  "total": 150,
  "breakdown": {
    "gameScore": 50,
    "mastery": 0,
    "consistency": 0,
    "improvement": 0,
    "engagement": 0,
    "variety": 15,
    "dedication": 5,
    "achievements": 0
  },
  "lastCalculated": "2024-12-15T14:30:00.000Z"
}
```

## Test-Szenarien

### Szenario 1: Neuer Spieler
1. Nutzer spielt erstes Spiel mit Score 100, 120s Spielzeit
2. **Erwartete Sterne:**
   - gameScore: 10 (100/10)
   - variety: 15 (1 Spiel * 15)
   - dedication: 1 (120s / 120)
   - **Total: 26 Sterne**

### Szenario 2: Aktiver Spieler
1. Nutzer spielt 5 verschiedene Spiele
2. Erzielt 2× 1. Platz, 1× 3. Platz
3. Gesamtscore: 2500 Punkte
4. Spielzeit: 600 Sekunden (10 Minuten)
5. **Erwartete Sterne:**
   - gameScore: 250 (2500/10)
   - mastery: 120 (2×50 + 1×20)
   - variety: 75 (5×15)
   - dedication: 5 (600/120)
   - **Total: ~450 Sterne**

### Szenario 3: Meister-Spieler
1. 10 verschiedene Spiele gespielt
2. 10× 1. Platz, 5× weitere Top-3
3. Gesamtscore: 10000 Punkte
4. 7-Tage-Streak
5. Spielzeit: 3600 Sekunden (1 Stunde)
6. **Erwartete Sterne:**
   - gameScore: 1000 (capped)
   - mastery: 500 (capped)
   - consistency: 70 (7×10)
   - variety: 150 (capped)
   - dedication: 30 (3600/120)
   - **Total: ~1750 Sterne**

## Datenbank-Prüfung

### users.json Struktur prüfen
```bash
cat data/users.json
# oder im Editor öffnen
```

Erwartete Struktur:
```json
{
  "users": {
    "BenutzerName": {
      "username": "BenutzerName",
      "createdAt": "...",
      "lastActive": "...",
      "avatar": { ... },
      "stats": { ... },
      "stars": {
        "total": 150,
        "breakdown": { ... }
      }
    }
  }
}
```

## Fehlerbehandlung testen

### Test 1: Username ändern
```bash
# POST to /api/user/update-username
curl -X POST http://localhost:3000/api/user/update-username \
  -H "Content-Type: application/json" \
  -d '{"oldUsername":"AlterName","newUsername":"NeuerName"}'

# Prüfen:
# - users.json: User unter neuem Namen
# - stats.json: Alle Einträge aktualisiert
# - usernameHistory wurde erweitert
```

### Test 2: Avatar aktualisieren ohne Backend
```bash
# Netzwerk trennen
# Avatar Editor öffnen
# Avatar ändern und speichern
# Sollte: localStorage funktioniert, Backend-Call schlägt fehl (Console Warning)
# Sterne bleiben bei 0 oder letztem Wert
```

### Test 3: Neuer User ohne Spiele
```bash
# Avatar Editor öffnen
# Neuen Namen eingeben
# Speichern
# Erwartung: 0 Sterne, User in users.json erstellt
```

## Performance-Test

### Viele Spiele schnell hintereinander
```javascript
// Simuliere 10 Spiele
for (let i = 0; i < 10; i++) {
  await fetch('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameName: 'test-game',
      username: 'TestUser',
      score: Math.floor(Math.random() * 1000),
      playTime: Math.floor(Math.random() * 300)
    })
  });
}

// Prüfe users.json:
// - totalGamesPlayed sollte 10 sein
// - Sterne sollten korrekt berechnet sein
// - Keine Datei-Korruption
```

## Debug-Tipps

### Sterne werden nicht berechnet
1. Console prüfen: `fetch('/api/user/Username/stars')`
2. Server-Logs prüfen
3. users.json öffnen und `stars` Objekt prüfen
4. `calculateUserStars()` Methode im DataService prüfen

### User wird nicht erstellt
1. Prüfe ob POST /api/stats erfolgreich war
2. Prüfe server.js: `dataService.updateUserStats()` wird aufgerufen
3. Console-Logs in dataService.js aktivieren

### Sterne bleiben bei 0
1. Prüfe ob username korrekt übergeben wird
2. Prüfe ob stats.json Einträge hat
3. Sterne manuell neu berechnen lassen:
   ```javascript
   fetch('/api/user/Username/stars')
   ```

## Bekannte Limitationen

1. **Erste Spiel:** Neuer User hat 0 Sterne bis erstes Spiel gespielt
2. **Streak-Berechnung:** Basiert auf Datum, funktioniert nur mit echten Datumsänderungen
3. **Achievement-Sterne:** Noch nicht implementiert (immer 0)
4. **Improvement-Rate:** Braucht mehrere Spiele um akkurat zu sein

## Next Steps

1. ✅ Avatar Editor lädt Sterne aus Backend
2. ✅ Spiele updaten User-Stats automatisch
3. ✅ Username-Änderung migriert alle Daten
4. ⏳ Achievement-System implementieren
5. ⏳ Daily Login Tracking hinzufügen
6. ⏳ Doors Opened Tracking integrieren
7. ⏳ Frontend Dashboard für User-Stats erstellen
