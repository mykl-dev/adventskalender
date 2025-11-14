# Authentifizierungssystem - Dokumentation

## Übersicht

Das Adventskalender-Projekt verwendet jetzt ein vollständiges Authentifizierungssystem mit:
- **User IDs** (Format: `user_abc123...`) für eindeutige Identifikation
- **Display Names** für öffentliche Anzeige
- **Passwort-Hashing** (SHA-256)
- **Session-Management** (express-session)

## Datenstruktur

### users.json
```json
{
  "users": {
    "user_abc123...": {
      "userId": "user_abc123...",
      "displayName": "FröhlicherElf",
      "password": "sha256_hash_here",
      "createdAt": "2024-12-XX...",
      "lastActive": "2024-12-XX...",
      "avatar": { ... },
      "stats": { ... },
      "stars": { ... }
    }
  }
}
```

### stats.json (Kompatibilität)
Verwendet weiterhin `username` Feld, das jetzt den `displayName` des Benutzers enthält.

## API Endpoints

### Authentication

#### POST /api/auth/register
Registriert einen neuen Benutzer.

**Request:**
```json
{
  "displayName": "MeinName",
  "password": "sicheresPasswort"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Registrierung erfolgreich",
  "user": {
    "userId": "user_abc123...",
    "displayName": "MeinName",
    "stars": { ... }
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "DisplayName bereits vergeben"
}
```

**Validierung:**
- DisplayName: mindestens 3 Zeichen
- Passwort: mindestens 6 Zeichen
- DisplayName muss einzigartig sein

---

#### POST /api/auth/login
Meldet einen Benutzer an.

**Request:**
```json
{
  "displayName": "MeinName",
  "password": "sicheresPasswort"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Anmeldung erfolgreich",
  "user": {
    "userId": "user_abc123...",
    "displayName": "MeinName",
    "stars": { ... },
    "avatar": { ... }
  }
}
```

**Response (Error - 401):**
```json
{
  "error": "Ungültige Anmeldedaten"
}
```

---

#### POST /api/auth/logout
Meldet den aktuellen Benutzer ab.

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Erfolgreich abgemeldet"
}
```

---

#### GET /api/auth/session
Prüft die aktuelle Session.

**Response (Authenticated - 200):**
```json
{
  "authenticated": true,
  "user": {
    "userId": "user_abc123...",
    "displayName": "MeinName",
    "stars": { ... },
    "avatar": { ... }
  }
}
```

**Response (Not Authenticated - 401):**
```json
{
  "authenticated": false
}
```

---

### User Management (Protected Routes)

Alle folgenden Endpoints benötigen eine aktive Session.

#### GET /api/user/profile
Ruft das Profil des aktuell angemeldeten Benutzers ab.

**Response (Success - 200):**
```json
{
  "userId": "user_abc123...",
  "displayName": "MeinName",
  "createdAt": "...",
  "avatar": { ... },
  "stats": { ... },
  "stars": { ... }
}
```

---

#### GET /api/user/stars
Berechnet und gibt die Sterne des aktuell angemeldeten Benutzers zurück.

**Response (Success - 200):**
```json
{
  "total": 1250,
  "breakdown": {
    "gameScore": 500,
    "achievements": 100,
    "consistency": 150,
    ...
  },
  "lastCalculated": "..."
}
```

---

#### POST /api/user/avatar
Aktualisiert den Avatar des Benutzers.

**Request:**
```json
{
  "style": "adventurer",
  "options": { ... }
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Avatar aktualisiert"
}
```

---

#### POST /api/user/displayname
Ändert den DisplayName des Benutzers.

**Request:**
```json
{
  "newDisplayName": "NeuerName"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "DisplayName aktualisiert"
}
```

**Response (Error - 400):**
```json
{
  "error": "DisplayName bereits vergeben"
}
```

**Validierung:**
- Mindestens 3 Zeichen
- Muss einzigartig sein
- Aktualisiert auch stats.json für alle bisherigen Spiele

---

### Game Stats

#### POST /api/stats
Speichert Spielstatistiken. Funktioniert mit und ohne Anmeldung.

**Request:**
```json
{
  "gameName": "santa-snake",
  "username": "FallbackName",
  "score": 150,
  "playTime": 120
}
```

**Verhalten:**
- **Mit Session**: Verwendet userId aus Session, displayName überschreibt username
- **Ohne Session**: Verwendet username aus Request (Legacy-Modus)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Statistik gespeichert"
}
```

---

## DataService Methoden

### Authentication

```javascript
// User-ID generieren
generateUserId() // Returns: 'user_abc123...'

// Passwort hashen
hashPassword(password) // Returns: SHA-256 hash

// Passwort verifizieren
verifyPassword(password, hashedPassword) // Returns: boolean

// DisplayName verfügbar?
isDisplayNameAvailable(displayName, excludeUserId = null) // Returns: boolean

// Benutzer registrieren
registerUser(displayName, password) // Returns: user object (ohne Passwort) oder null

// Benutzer anmelden
loginUser(displayName, password) // Returns: user object (ohne Passwort) oder null
```

### User Management

```javascript
// Benutzer per ID abrufen
getUserProfileById(userId) // Returns: user object (ohne Passwort) oder null

// Benutzer per DisplayName abrufen
getUserProfileByDisplayName(displayName) // Returns: user object (ohne Passwort) oder null

// Profil aktualisieren
updateUserProfile(userId, updates) // Returns: boolean

// Sterne berechnen
calculateUserStars(userId) // Returns: stars object oder null

// Stats nach Spiel aktualisieren
updateUserStats(userId, gameName, score, playTime) // Returns: boolean

// Avatar aktualisieren
updateUserAvatar(userId, avatarData) // Returns: boolean

// DisplayName ändern
updateDisplayName(userId, newDisplayName) // Returns: boolean

// Alle Benutzer nach Sternen sortiert
getAllUsersSortedByStars() // Returns: Array von Benutzern
```

---

## Session Management

Sessions werden mit `express-session` verwaltet:

```javascript
// Session-Konfiguration in server.js
app.use(session({
  secret: 'christmas-advent-calendar-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // In Produktion auf true mit HTTPS
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Tage
  }
}));
```

### Session-Daten
```javascript
req.session.userId       // User ID
req.session.displayName  // Display Name
```

### Protected Route Middleware
```javascript
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }
  next();
};
```

---

## Passwort-Sicherheit

### Aktuelles System
- SHA-256 Hashing
- Keine Salt (vereinfacht)

### Für Produktion empfohlen
- bcrypt oder argon2
- Salt und Pepper
- Key stretching

**Wichtig**: Das aktuelle System ist für einen Adventskalender geeignet, aber für produktive Anwendungen sollte eine stärkere Passwort-Verschlüsselung verwendet werden.

---

## Migration von Alt zu Neu

### Schritte für bestehende Benutzer

1. **Benutzer ohne Account**:
   - Können weiterhin als "Gast" spielen
   - Scores werden in stats.json mit username gespeichert
   - Keine Stars-Berechnung ohne Account

2. **Bestehende localStorage-Benutzer**:
   - Müssen sich neu registrieren
   - Alter username kann als displayName verwendet werden
   - Alte Scores bleiben in stats.json erhalten

3. **Daten-Migration** (optional):
   ```javascript
   // Pseudo-Code für Migration
   for (const username in oldUsers) {
     const userId = generateUserId();
     const defaultPassword = hashPassword('changeme123');
     
     users[userId] = {
       userId,
       displayName: username,
       password: defaultPassword,
       ...oldUsers[username]
     };
   }
   ```

---

## UI Integration

### Login-Seite: `/login.html`
- Tab-basiert: Anmeldung / Registrierung
- Passwort-Stärke-Anzeige
- Gast-Modus verfügbar
- Automatische Weiterleitung bei bestehender Session

### Avatar-Editor Integration
```javascript
// Session prüfen
const checkSession = async () => {
  const response = await fetch('/api/auth/session');
  if (response.ok) {
    const data = await response.json();
    return data.authenticated ? data.user : null;
  }
  return null;
};

// Wenn nicht angemeldet
if (!user) {
  window.location.href = '/login.html';
}
```

### Spiele Integration
```javascript
// Beim Score speichern
const saveScore = async (gameName, score, playTime) => {
  const username = localStorage.getItem('username') || 'Gast';
  
  await fetch('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameName, username, score, playTime })
  });
};
```

**Hinweis**: Session wird automatisch mitgesendet durch Browser-Cookies.

---

## Testen

### 1. Registrierung testen
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"displayName":"TestUser","password":"test1234"}'
```

### 2. Login testen
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"displayName":"TestUser","password":"test1234"}' \
  -c cookies.txt
```

### 3. Session prüfen
```bash
curl http://localhost:3000/api/auth/session -b cookies.txt
```

### 4. Profil abrufen
```bash
curl http://localhost:3000/api/user/profile -b cookies.txt
```

---

## Nächste Schritte

### Kurzfristig (Must-Have)
- [ ] Avatar-Editor auf neue Auth umstellen
- [ ] Kalender-Seite: Login-Button hinzufügen
- [ ] Alle Spiele: Session-Check für automatische Zuordnung

### Mittelfristig (Should-Have)
- [ ] Passwort zurücksetzen (E-Mail?)
- [ ] Profil-Seite mit Statistiken
- [ ] Logout-Button im UI

### Langfristig (Nice-to-Have)
- [ ] E-Mail-Verifizierung
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth (Google, GitHub, etc.)
- [ ] Besseres Passwort-Hashing (bcrypt/argon2)
- [ ] Rate-Limiting für Login-Versuche
- [ ] Account-Löschung
