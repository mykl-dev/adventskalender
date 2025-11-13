# Avatar System - Dokumentation

## Übersicht

Das Avatar-System ermöglicht es Spielern, beim ersten Besuch einen personalisierten Avatar zu erstellen. Der Avatar wird in einem Cookie gespeichert und auf allen Seiten angezeigt.

## Komponenten

### 1. **avatarManager.js** - Zentrale Logik
- Verwaltet Spielerprofil (Name + Avatar)
- Cookie-Management (1 Jahr Speicherdauer)
- SVG-Rendering für Avatar-Darstellung
- Welcome-Overlay für Erstbesucher
- Avatar-Optionen (Kopfbedeckung, Gesicht, Körper, Schuhe)

**Globale Instanz:**
```javascript
const avatarManager = new AvatarManager();
```

**Wichtige Methoden:**
```javascript
// Profil abrufen
avatarManager.getProfile() // { username, avatar, createdAt, updatedAt }
avatarManager.getUsername() // "MeinName"
avatarManager.getAvatar() // { head: 'santa-hat', face: 'happy', ... }

// Profil speichern
avatarManager.saveProfile({ username: "Max", avatar: {...} })

// Avatar als SVG rendern
avatarManager.renderAvatarSVG(avatar, 100) // Größe in px
```

### 2. **avatar-editor.html** - Editor-Seite
HTML-Struktur für den Avatar-Editor mit:
- Avatar-Vorschau
- Username-Eingabe (2-20 Zeichen)
- Anpassungsoptionen (4 Kategorien)
- Zufalls-Generator Button
- Speichern Button
- Erfolgs-Modal mit Konfetti

### 3. **avatar-editor.js** - Editor-Logik
```javascript
class AvatarEditor {
    // Lädt Optionen aus avatarManager
    // Verwaltet Auswahl und Vorschau
    // Validierung und Speicherung
    // Konfetti-Animation
}
```

### 4. **avatar-editor.css** - Editor-Styles
Responsive Design mit:
- Zweispalten-Layout (Desktop)
- Einspalten-Layout (Mobile)
- Animationen (Pulse, Shake, Pop)
- Konfetti-Effekt
- Modal-Overlay

### 5. **avatar-welcome.css** - Welcome-Overlay
Styles für das Willkommens-Overlay:
- Blur-Hintergrund
- Feature-Liste
- Call-to-Action Button
- Slide-Up Animation

## Avatar-Teile

### Kopfbedeckung (head)
- `santa-hat` - Weihnachtsmannmütze 🎅
- `elf-hat` - Elfenmütze 🧝
- `winter-hat` - Wintermütze 🧢
- `crown` - Krone 👑
- `reindeer-antlers` - Rentiergeweih 🦌

### Gesicht (face)
- `happy` - Fröhlich 😊
- `cool` - Cool 😎
- `wink` - Zwinkernd 😉
- `surprised` - Überrascht 😮

### Körper (body)
- `sweater-red` - Roter Pullover 🧥
- `sweater-green` - Grüner Pullover 👕
- `suit` - Anzug 🤵
- `t-shirt-blue` - Blaues T-Shirt 👔

### Schuhe (feet)
- `boots-black` - Schwarze Stiefel 👢
- `boots-brown` - Braune Stiefel 🥾
- `sneakers` - Turnschuhe 👟
- `slippers` - Hausschuhe 🩴

## Integration

### In index.html
```html
<!-- CSS -->
<link rel="stylesheet" href="avatar-welcome.css">

<!-- JavaScript (vor anderen Scripts!) -->
<script src="avatarManager.js"></script>

<!-- Avatar-Anzeige im Header -->
<div id="playerAvatarDisplay" class="player-avatar-display" onclick="window.location.href='avatar-editor.html'">
    <!-- Wird dynamisch gefüllt -->
</div>
```

### In script.js
```javascript
// Bei Initialisierung
function initPlayerAvatarDisplay() {
    const display = document.getElementById('playerAvatarDisplay');
    if (!display) return;
    
    const profile = avatarManager.getProfile();
    if (profile) {
        display.innerHTML = `
            ${avatarManager.renderAvatarSVG(profile.avatar, 40)}
            <span class="player-name">${profile.username}</span>
        `;
        display.style.display = 'inline-flex';
    } else {
        display.style.display = 'none';
    }
}
```

### In Spielen (stats-manager.js)
```javascript
// Username aus Avatar-Manager verwenden
async saveStats(gameName, score, playTime = 0) {
    const playerName = avatarManager.getUsername(); // Statt Prompt
    // ... rest des Codes
}
```

## Workflow

### 1. Erstbesuch
1. User öffnet `index.html`
2. `avatarManager` prüft Cookie
3. Cookie nicht gefunden → Welcome-Overlay wird angezeigt
4. User klickt "Avatar erstellen"
5. Weiterleitung zu `avatar-editor.html`

### 2. Avatar-Erstellung
1. User gibt Namen ein (min. 2 Zeichen)
2. User wählt Avatar-Teile aus
3. Optional: "Zufällig generieren" Button
4. User klickt "Speichern"
5. Profil wird in Cookie gespeichert (365 Tage)
6. Erfolgs-Modal mit Konfetti
7. Weiterleitung zurück zu `index.html`

### 3. Wiederholter Besuch
1. User öffnet `index.html`
2. `avatarManager` lädt Profil aus Cookie
3. Kein Welcome-Overlay
4. Avatar wird im Header angezeigt
5. Klick auf Avatar → `avatar-editor.html` zum Bearbeiten

## Cookie-Struktur

```json
{
  "username": "Max Mustermann",
  "avatar": {
    "head": "santa-hat",
    "face": "happy",
    "body": "sweater-red",
    "feet": "boots-black"
  },
  "createdAt": "2024-12-01T10:30:00.000Z",
  "updatedAt": "2024-12-01T10:30:00.000Z"
}
```

**Cookie-Name:** `advent_player_profile`  
**Gültigkeit:** 365 Tage  
**Path:** `/`  
**SameSite:** `Lax`

## Erweiterungen

### Neue Avatar-Teile hinzufügen

**In avatarManager.js:**

1. SVG-Part erstellen:
```javascript
getSVGHead(type) {
    const heads = {
        // ... existing
        'new-hat': `
            <g id="new-hat">
                <!-- SVG Path hier -->
            </g>
        `
    };
}
```

2. Option zur Auswahlliste:
```javascript
getAvatarOptions() {
    return {
        head: [
            // ... existing
            { id: 'new-hat', name: 'Neue Mütze', icon: '🎩' }
        ]
    };
}
```

Fertig! Der Editor zeigt automatisch die neue Option an.

### Neue Kategorie hinzufügen

1. Standard-Avatar erweitern:
```javascript
getDefaultAvatar() {
    return {
        head: 'santa-hat',
        face: 'happy',
        body: 'sweater-red',
        feet: 'boots-black',
        accessory: 'scarf' // NEU
    };
}
```

2. SVG-Methode erstellen:
```javascript
getSVGAccessory(type) { ... }
```

3. In `renderAvatarSVG()` einfügen:
```javascript
${this.getSVGAccessory(parts.accessory)}
```

4. Optionen hinzufügen:
```javascript
getAvatarOptions() {
    return {
        // ... existing
        accessory: [
            { id: 'scarf', name: 'Schal', icon: '🧣' },
            // ...
        ]
    };
}
```

5. In **avatar-editor.html** Kategorie hinzufügen:
```html
<div class="customization-category">
    <h3>🧣 Accessoire</h3>
    <div id="accessoryOptions" class="option-grid"></div>
</div>
```

6. In **avatar-editor.js** rendern:
```javascript
renderOptions() {
    // ... existing
    this.renderOptionCategory('accessory', 'accessoryOptions');
}
```

## Best Practices

1. **Cookie-Prüfung:** Immer `avatarManager.getProfile()` verwenden, nicht direkt auf Cookie zugreifen
2. **Username in Spielen:** `avatarManager.getUsername()` statt Prompt verwenden
3. **SVG-Größe:** Bei Anzeige `renderAvatarSVG()` mit passender Größe aufrufen
4. **Validierung:** Username mindestens 2 Zeichen (bereits implementiert)
5. **Fehlerbehandlung:** Try-catch beim Cookie-Lesen/-Schreiben vorhanden

## Responsive Design

- **Desktop (>1024px):** Zweispalten-Layout, sticky Preview
- **Tablet (768-1024px):** Einspalten-Layout, Preview oben
- **Mobile (<768px):** Kompaktes Grid, vertikale Buttons
- **Klein (<480px):** 2-Spalten-Grid für Optionen

## Animationen

- **Pulse:** Speichern-Button wenn bereit
- **Shake:** Bei Fehler, Random-Button
- **Pop:** Bei Option-Auswahl
- **Scale-Up:** Avatar-Vorschau Update
- **Confetti:** Bei erfolgreichem Speichern
- **Slide-Up:** Modal-Einblendung

## Performance

- **SVG inline:** Keine externen Bild-Requests
- **Cookie statt Server:** Keine API-Calls nötig
- **Lazy Loading:** Welcome-Overlay nur bei Bedarf
- **CSS Animations:** Hardware-beschleunigt

## Browser-Kompatibilität

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile Browser
- ⚠️ Cookies müssen aktiviert sein
