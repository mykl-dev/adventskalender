# 🎄 Adventskalender 2025 - Node.js Webanwendung

Ein interaktiver, animierter Adventskalender mit 24 Türchen, Theme-Switcher (Klassisch/Modern) und kindgerechtem Design.

## ✨ Features

- 🎅 **24 interaktive Türchen** mit verschiedenen Inhaltstypen
- 🎨 **Zwei Themes**: Klassisch (Rot/Grün/Gold) und Modern (Lila/Pink)
- ❄️ **Schneefall-Animation** (dezent im Hintergrund)
- 🎬 **Multimedia-Inhalte**: Videos, Bilder, Witze, Motivationssprüche
- 🔒 **Datumsprüfung**: Türchen öffnen sich nur am jeweiligen Tag (oder später)
- 📱 **Responsive Design**: Funktioniert auf Desktop, Tablet und Smartphone
- ✨ **Animationen**: Smooth Hover-Effekte und Türchen-Öffnen-Animationen

## 📁 Projektstruktur

```
Advent_Calendar/
├── server.js                 # Express.js Backend
├── package.json             # Node.js Abhängigkeiten
├── data/
│   └── calendar-content.json # Inhalte für alle 24 Türchen
└── public/
    ├── index.html           # HTML Hauptdatei
    ├── styles.css           # CSS mit beiden Themes
    └── script.js            # Frontend JavaScript
```

## 🚀 Installation & Start

### 1. Abhängigkeiten installieren

```powershell
cd "f:\Projekte\Test\Advent_Calendar"
npm install
```

### 2. NAS-Server konfigurieren

Öffne `data/calendar-content.json` und ersetze die Platzhalter mit deinen echten NAS-URLs:

```json
{
  "day": 3,
  "type": "video",
  "content": "http://192.168.1.100:8080/videos/weihnacht-tag3.mp4",
  ...
}
```

**Wichtige Hinweise für NAS-Integration:**

#### Option 1: NAS mit HTTP-Server
- Aktiviere den HTTP-/Webserver auf deinem NAS
- Lege Videos/Bilder in einem öffentlich zugänglichen Ordner ab
- Verwende die vollständige URL: `http://NAS-IP:PORT/pfad/zur/datei.mp4`

#### Option 2: NAS-Freigabe als lokaler Ordner
- Mounte die NAS-Freigabe als Netzlaufwerk (z.B. `Z:\`)
- Kopiere Dateien in `public/media/`:
  ```powershell
  mkdir public\media\videos
  mkdir public\media\images
  ```
- Ändere URLs in JSON zu: `/media/videos/weihnacht-tag3.mp4`

#### Option 3: SMB/CIFS mit Node.js
Für fortgeschrittene Benutzer: Verwende `samba-client` npm package.

### 3. Test-Modus konfigurieren (Optional)

**Für Entwicklung/Tests:** Öffne `config.json` und setze:

```json
{
  "testMode": true
}
```

⚠️ **WICHTIG:** Im Test-Modus können **alle Türchen** ohne Datumsrestriktion geöffnet werden!
- ✅ Perfekt zum Testen der Inhalte
- ❌ **Deaktiviere dies für Produktiv-Einsatz mit Kindern!**

Für normale Nutzung (Produktiv):
```json
{
  "testMode": false
}
```

### 4. Server starten

```powershell
npm start
```

Oder für Entwicklung mit Auto-Reload:

```powershell
npm run dev
```

Der Server zeigt beim Start an, ob Test-Modus aktiviert ist:
```
🎄 Adventskalender läuft auf http://localhost:3000
🎅 Frohe Weihnachten!

⚠️  TEST-MODUS AKTIVIERT ⚠️
🔓 Alle Türchen können ohne Datumsrestriktion geöffnet werden!
💡 Zum Deaktivieren: Setze "testMode": false in config.json
```

### 5. Browser öffnen

Öffne deinen Browser und navigiere zu:
```
http://localhost:3000
```

## 🎨 Inhaltstypen

Die `calendar-content.json` unterstützt folgende Inhaltstypen:

### Video
```json
{
  "day": 3,
  "type": "video",
  "content": "http://NAS-SERVER/videos/tag3.mp4",
  "description": "Ein schönes Weihnachtsvideo!",
  "opened": false
}
```

### Bild
```json
{
  "day": 4,
  "type": "image",
  "content": "http://NAS-SERVER/images/tag4.jpg",
  "description": "Winterlandschaft",
  "opened": false
}
```

### Witz
```json
{
  "day": 6,
  "type": "joke",
  "content": "Was sagt der große Stift zum kleinen? Wachs-mal-Stift!",
  "opened": false
}
```

### Motivationsspruch
```json
{
  "day": 5,
  "type": "quote",
  "content": "Glaube an Wunder, Liebe und Glück!",
  "opened": false
}
```

### 🎮 Minispiel (NEU!)
```json
{
  "day": 6,
  "type": "game",
  "content": "snowflake-catcher",
  "description": "Spiel: Fange die Schneeflocken!",
  "opened": false
}
```

**Verfügbare Minispiele:**
- `snowflake-catcher` - Schneeflocken fangen (30 Sekunden Zeit)
- `christmas-memory` - Weihnachts-Memory mit 8 Paaren
- `gift-catcher` - Geschenke mit Weihnachtsmann fangen (Maus/Touch-Steuerung, Reaktionsspiel)
- `gift-stack` - Geschenke stapeln (Geschicklichkeitsspiel mit Schwierigkeitssteigerung)
- `flappy-santa` - Flappy Bird Clone mit Weihnachtsmann (Leertaste/Klick zum Fliegen)
- `santa-run` - Subway Surfer Style Runner (Pfeiltasten/Wischen, Mobile-optimiert)

## 🎯 Funktionsweise

### Datum-Validierung
- Türchen öffnen sich nur im Dezember
- Jedes Türchen ist ab dem entsprechenden Tag verfügbar
- Vergangene Türchen bleiben geöffnet
- Zukünftige Türchen sind gesperrt mit Hinweis

### Theme-Switcher
- Button oben rechts zum Wechseln zwischen Klassisch und Modern
- Einstellung wird im Browser gespeichert (localStorage)
- Beide Themes sind kinderfreundlich gestaltet

### Türchen-Icons
- 🎥 Video
- 😄 Witz
- 💭 Motivationsspruch
- 🖼️ Bild
- 🎁 Standard

## 🎥 Video-Formate für NAS

Empfohlene Video-Formate für beste Kompatibilität:
- **Format**: MP4
- **Codec**: H.264
- **Auflösung**: 1920x1080 oder 1280x720
- **Bitrate**: 2-5 Mbps

### FFmpeg Konvertierung (falls nötig):
```bash
ffmpeg -i input.avi -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k output.mp4
```

## 🔧 Anpassungen

### Port ändern
In `server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Hier ändern
```

Oder beim Start:
```powershell
$env:PORT=8080; npm start
```

### Schneefall-Intensität
In `public/script.js`, Zeile 61:
```javascript
const numberOfFlakes = 50; // Mehr = mehr Schnee
```

### Farben anpassen
Bearbeite `public/styles.css`:
- Klassisches Theme: Zeilen 30-50
- Modernes Theme: Zeilen 55-75

## 📱 Browser-Kompatibilität

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Browser (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### Türchen öffnen sich nicht
- Prüfe die Browser-Console (F12) auf Fehler
- Stelle sicher, dass `calendar-content.json` gültig ist
- Überprüfe, ob der Server läuft

### Videos werden nicht abgespielt
- Prüfe die NAS-URL im Browser direkt
- Stelle sicher, dass CORS aktiviert ist (siehe unten)
- Überprüfe Video-Format (MP4 empfohlen)

### CORS-Fehler bei NAS-Videos
Wenn Videos vom NAS nicht laden, füge CORS-Header hinzu:

**Apache (.htaccess):**
```apache
Header set Access-Control-Allow-Origin "*"
```

**Nginx (nginx.conf):**
```nginx
add_header Access-Control-Allow-Origin *;
```

**Node.js** (wenn du einen eigenen Medien-Server baust):
```javascript
app.use(cors({ origin: '*' }));
```

## 🎁 Inhalte-Ideen

### Videos
- Weihnachtslieder
- Winterlandschaften
- Lustige Weihnachtsclips
- Bastelanleitungen
- Geschichten vorgelesen

### Bilder
- Weihnachtsdekoration
- Schneebilder
- Selbstgemalte Bilder
- Familienfotos
- Weihnachtliche Landschaften

### Witze
- Kinderwitze
- Weihnachtswitze
- Rätsel
- Wortspiele

### Sprüche
- Motivierende Zitate
- Weihnachtsgedichte
- Weisheiten
- Segenswünsche

## 📝 TODO / Erweiterungen

Ideen für weitere Features:

- [ ] Admin-Panel zum einfachen Hochladen von Inhalten
- [ ] Benutzer-Authentifizierung (mehrere Kinder, eigene Kalender)
- [ ] Sound-Effekte beim Öffnen
- [ ] Fortschrittsbalken (wie viele Türchen schon offen)
- [ ] Teilen-Funktion (Inhalte teilen)
- [ ] Dark Mode (zusätzliches drittes Theme)
- [ ] Kalender-Vorschau für Eltern
- [ ] Export/Import von Kalendern

## 📜 Lizenz

MIT License - Frei verwendbar für private und kommerzielle Projekte.

## 🎅 Frohe Weihnachten!

Viel Spaß mit deinem Adventskalender! 🎄✨

---

**Erstellt mit ❤️ für die Weihnachtszeit 2025**
