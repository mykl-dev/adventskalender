// ========================================
// GLOBALE VARIABLEN
// ========================================
let currentTheme = 'classic';
let calendarData = null;
let testMode = false; // Test-Modus für alle Türchen

// ========================================
// INITIALISIERUNG
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    await loadConfig(); // Lade Konfiguration vom Server
    initSnowfall();
    loadCalendarData();
    setupEventListeners();
    initPlayerAvatarDisplay(); // Zeige Avatar im Header
});

// ========================================
// THEME MANAGEMENT
// ========================================
function initTheme() {
    let savedTheme = 'classic';
    try {
        savedTheme = localStorage.getItem('advent-theme') || 'classic';
    } catch (e) {
        console.warn('LocalStorage nicht verfügbar:', e.message);
    }
    currentTheme = savedTheme;
    applyTheme(currentTheme);
}

function applyTheme(theme) {
    document.body.className = `${theme}-theme`;
    
    // Update Menu Text wenn vorhanden
    const themeMenuText = document.getElementById('themeMenuText');
    if (themeMenuText) {
        const themeName = theme === 'classic' ? 'Klassisch' : 'Modern';
        themeMenuText.textContent = 'Design: ' + themeName;
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'classic' ? 'modern' : 'classic';
    applyTheme(currentTheme);
    try {
        localStorage.setItem('advent-theme', currentTheme);
    } catch (e) {
        console.warn('Konnte Theme nicht speichern:', e.message);
    }
    
    // Animation beim Wechsel
    document.body.style.animation = 'none';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 10);
}

// ========================================
// GEÖFFNETE TÜRCHEN MENÜ
// ========================================
function updateOpenedDoorsMenu() {
    if (!calendarData || !calendarData.doors) return;
    
    const section = document.getElementById('opened-doors-section');
    if (!section) return;
    
    // Im Test-Modus alle Türchen anzeigen, sonst nur geöffnete
    const openedDoors = testMode ? calendarData.doors : calendarData.doors.filter(door => door.opened);
    
    if (openedDoors.length === 0) {
        section.innerHTML = '';
        return;
    }
    
    // Gruppiere nach Typ
    const categories = {
        game: { icon: '🎮', label: 'Spiele', doors: [] },
        video: { icon: '🎥', label: 'Videos', doors: [] },
        quote: { icon: '💭', label: 'Zitate', doors: [] },
        joke: { icon: '😄', label: 'Witze', doors: [] },
        image: { icon: '🖼️', label: 'Bilder', doors: [] }
    };
    
    openedDoors.forEach(door => {
        if (categories[door.type]) {
            categories[door.type].doors.push(door);
        }
    });
    
    // Erstelle Untermenüs
    let html = '';
    Object.keys(categories).forEach(type => {
        const cat = categories[type];
        if (cat.doors.length === 0) return;
        
        const categoryId = `submenu-${type}`;
        html += `
            <div class="menu-submenu-toggle" onclick="toggleSubmenu('${categoryId}')">
                <div class="submenu-toggle-left">
                    <span class="menu-icon">${cat.icon}</span>
                    <span>${cat.label} (${cat.doors.length})</span>
                </div>
                <span class="submenu-toggle-arrow">▶</span>
            </div>
            <div id="${categoryId}" class="menu-submenu">
        `;
        
        cat.doors.sort((a, b) => a.day - b.day).forEach(door => {
            const name = getSubmenuItemName(door);
            html += `
                <div class="menu-submenu-item" onclick="openDoorFromMenu(${door.day})">
                    <span class="submenu-item-day">${door.day}:</span>
                    <span class="submenu-item-name">${name}</span>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    section.innerHTML = html;
}

function getSubmenuItemName(door) {
    if (door.type === 'game') {
        const gameNames = {
            'gift-catcher': 'Gift Catcher',
            'snowflake-catcher': 'Snowflake Catcher',
            'snowball-blaster': 'Snowball Blaster',
            'santa-launcher': 'Santa Launcher',
            'flappy-santa': 'Flappy Santa',
            'bubble-shooter': 'Bubble Shooter',
            'santa-snake': 'Santa Snake',
            'christmas-memory': 'Memory',
            'christmas-match3': 'Match-3',
            'santa-run': 'Santa Run',
            'feeding-elf': 'Feeding Elf',
            'word-search': 'Wörter-Suchrätsel'
        };
        return gameNames[door.content] || door.content;
    }
    return door.description || door.content;
}

function toggleSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    const toggle = submenu.previousElementSibling;
    
    if (!submenu || !toggle) return;
    
    const isActive = submenu.classList.contains('active');
    
    // Schließe alle anderen Untermenüs
    document.querySelectorAll('.menu-submenu').forEach(sm => {
        sm.classList.remove('active');
    });
    document.querySelectorAll('.menu-submenu-toggle').forEach(t => {
        t.classList.remove('active');
    });
    
    // Toggle aktuelles Untermenü
    if (!isActive) {
        submenu.classList.add('active');
        toggle.classList.add('active');
    }
}

function openDoorFromMenu(day) {
    closeMenu();
    setTimeout(() => {
        openDoor(day);
    }, 300);
}

// ========================================
// KONFIGURATION LADEN
// ========================================
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        testMode = config.testMode;
        
        if (testMode) {
            console.log('🔓 Test-Modus aktiv: Alle Türchen können geöffnet werden');
        }
    } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error);
        testMode = false;
    }
}

// ========================================
// SCHNEEFALL ANIMATION
// ========================================
function initSnowfall() {
    const canvas = document.getElementById('snow-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const snowflakes = [];
    const numberOfFlakes = 50; // Leichter Schneefall
    
    class Snowflake {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.radius = Math.random() * 2 + 1; // Klein und dezent
            this.speed = Math.random() * 1 + 0.5;
            this.wind = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.5 + 0.3; // Leicht transparent
        }
        
        update() {
            this.y += this.speed;
            this.x += this.wind;
            
            // Zurücksetzen, wenn Schneeflocke unten ist
            if (this.y > canvas.height) {
                this.y = 0;
                this.x = Math.random() * canvas.width;
            }
            
            // Horizontal wrappen
            if (this.x > canvas.width) {
                this.x = 0;
            } else if (this.x < 0) {
                this.x = canvas.width;
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
        }
    }
    
    // Schneeflocken erstellen
    for (let i = 0; i < numberOfFlakes; i++) {
        snowflakes.push(new Snowflake());
    }
    
    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        snowflakes.forEach(flake => {
            flake.update();
            flake.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Canvas Größe bei Fenster-Resize anpassen
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ========================================
// KALENDER DATEN LADEN
// ========================================
async function loadCalendarData() {
    try {
        const response = await fetch('/api/calendar');
        calendarData = await response.json();
        renderCalendar();
        updateOpenedDoorsMenu(); // Aktualisiere Menü nach Laden
    } catch (error) {
        console.error('Fehler beim Laden der Kalenderdaten:', error);
        showError('Kalender konnte nicht geladen werden.');
    }
}

// ========================================
// KALENDER RENDERN
// ========================================
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    
    // Türchen in zufälliger Reihenfolge (macht es interessanter)
    const days = Array.from({ length: 24 }, (_, i) => i + 1);
    const shuffledDays = shuffleArray([...days]);
    
    shuffledDays.forEach(day => {
        const door = createDoor(day, currentDay, currentMonth);
        grid.appendChild(door);
    });
}

function shuffleArray(array) {
    // Fisher-Yates Shuffle für zufällige Anordnung
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createDoor(day, currentDay, currentMonth) {
    const doorElement = document.createElement('div');
    doorElement.className = 'door';
    doorElement.dataset.day = day;
    
    // Prüfen, ob Türchen geöffnet werden darf (Test-Modus ignoriert Datum)
    const canOpen = testMode || (currentMonth === 12 && currentDay >= day);
    const doorData = calendarData.doors.find(d => d.day === day);
    const isOpened = doorData && doorData.opened;
    
    // Status setzen
    if (isOpened) {
        doorElement.classList.add('opened');
    } else if (!canOpen) {
        doorElement.classList.add('locked');
    }
    
    // Icon basierend auf Inhalt
    let icon = '🎁';
    if (doorData) {
        switch (doorData.type) {
            case 'video':
                icon = '🎥';
                break;
            case 'joke':
                icon = '😄';
                break;
            case 'quote':
                icon = '💭';
                break;
            case 'image':
                icon = '🖼️';
                break;
        }
    }
    
    doorElement.innerHTML = `
        <div class="door-number">${day}</div>
        <div class="door-label">${getDoorLabel(day)}</div>
        <div class="door-icon">${icon}</div>
    `;
    
    // Event Listener
    if (canOpen || isOpened) {
        doorElement.addEventListener('click', () => openDoor(day));
    } else {
        // Im Test-Modus keine Benachrichtigung anzeigen, einfach öffnen
        if (testMode) {
            doorElement.addEventListener('click', () => openDoor(day));
        } else {
            doorElement.addEventListener('click', () => showLockedMessage(day));
        }
    }
    
    return doorElement;
}

function getDoorLabel(day) {
    if (day === 24) return '🎄 Heiligabend';
    if (day === 1) return '1. Advent';
    return `${day}. Dezember`;
}

// ========================================
// TÜRCHEN ÖFFNEN
// ========================================
async function openDoor(day) {
    try {
        const response = await fetch(`/api/door/${day}`);
        const data = await response.json();
        
        // Im Test-Modus Datumsprüfung überspringen
        if (!testMode && !data.canOpen && !data.opened) {
            showLockedMessage(day);
            return;
        }
        
        // Türchen als geöffnet markieren
        const doorElement = document.querySelector(`.door[data-day="${day}"]`);
        if (doorElement && !doorElement.classList.contains('opened')) {
            doorElement.classList.add('opened');
        }
        
        // Kalenderdaten aktualisieren und Menü refreshen
        await loadCalendarData();
        
        // Inhalt im Modal anzeigen
        showModal(data);
        
    } catch (error) {
        console.error('Fehler beim Öffnen des Türchens:', error);
        showError('Türchen konnte nicht geöffnet werden.');
    }
}

// ========================================
// MODAL ANZEIGEN
// ========================================
function showModal(data) {
    const modal = document.getElementById('door-modal');
    const modalBody = document.getElementById('modal-body');
    
    let content = `<h2>🎄 ${data.day}. Dezember 🎄</h2>`;
    
    switch (data.type) {
        case 'video':
            // Prüfe ob es ein Share-Link ist (NAS, Dropbox, etc.) oder direkte Video-URL
            const isShareLink = data.content.includes('share.cgi') || 
                                data.content.includes('dropbox.com') || 
                                data.content.includes('drive.google.com') ||
                                !data.content.match(/\.(mp4|webm|ogg)$/i);
            
            if (isShareLink) {
                content += `
                    <iframe class="content-video" src="${data.content}" 
                            frameborder="0" 
                            allowfullscreen
                            allow="autoplay; fullscreen">
                    </iframe>
                    ${data.description ? `<p class="content-text">${data.description}</p>` : ''}
                `;
            } else {
                content += `
                    <video class="content-video" controls>
                        <source src="${data.content}" type="video/mp4">
                        Dein Browser unterstützt keine Videos.
                    </video>
                    ${data.description ? `<p class="content-text">${data.description}</p>` : ''}
                `;
            }
            break;
            
        case 'image':
            content += `
                <img class="content-image" src="${data.content}" alt="Tag ${data.day}">
                ${data.description ? `<p class="content-text">${data.description}</p>` : ''}
            `;
            break;
            
        case 'joke':
            content += `
                <div class="content-joke">
                    😄<br><br>
                    ${data.content}
                </div>
            `;
            break;
            
        case 'quote':
            content += `
                <div class="content-text">
                    ✨<br><br>
                    "${data.content}"
                </div>
            `;
            break;
            
        case 'game':
            // Liste der Spiele mit eigenen Seiten (Fullscreen für bessere Mobile Experience)
            const fullscreenGames = [
                'snowflake-catcher', 
                'christmas-match3', 
                'santa-launcher',
                'gift-catcher',
                'flappy-santa',
                'santa-run',
                'santa-snake',
                'christmas-memory',
                'feeding-elf',
                'bubble-shooter',
                'word-search',
                'snowball-blaster'
            ];
            
            if (fullscreenGames.includes(data.content)) {
                // Leite direkt zur Spiel-Seite weiter
                window.location.href = `games/${data.content}.html`;
                return; // Modal nicht anzeigen
            }
            
            // Andere Spiele im Modal anzeigen
            content += `<div id="game-container-${data.day}"></div>`;
            break;
    }
    
    modalBody.innerHTML = content;
    modal.classList.add('show');
    
    // Körper scrollen verhindern, wenn Modal offen
    document.body.style.overflow = 'hidden';
    
    // Wenn es ein Spiel ist, initialisiere es
    if (data.type === 'game') {
        initializeGame(data.content, `game-container-${data.day}`);
    }
}

function initializeGame(gameName, containerId) {
    // Warte kurz, bis das Modal vollständig angezeigt wird
    setTimeout(() => {
        switch (gameName) {
            case 'snowflake-catcher':
                new SnowflakeCatcherGame3D(containerId);
                break;
            case 'christmas-memory':
                new ChristmasMemoryGame(containerId);
                break;
            case 'gift-stack':
                new GiftStackGame(containerId);
                break;
            case 'flappy-santa':
                new FlappySantaGame(containerId);
                break;
            case 'santa-run':
                new SantaRunGame(containerId);
                break;
            case 'gift-catcher':
                new GiftCatcherGame(containerId);
                break;
            case 'santa-snake':
                new SantaSnakeGame(containerId);
                break;
            case 'christmas-match3':
                new ChristmasMatch3Game(containerId);
                break;
            case 'santa-launcher':
                new SantaLauncherGame(containerId);
                break;
            default:
                document.getElementById(containerId).innerHTML = `
                    <div class="game-error">
                        <p>❌ Spiel nicht gefunden: ${gameName}</p>
                    </div>
                `;
        }
    }, 100);
}

function closeModal() {
    const modal = document.getElementById('door-modal');
    const modalBody = document.getElementById('modal-body');
    
    // Stoppe alle Videos
    const videos = modalBody.querySelectorAll('video');
    videos.forEach(video => {
        video.pause();
        video.currentTime = 0;
    });
    
    // Entferne alle iframes komplett (stoppt Wiedergabe zuverlässig)
    const iframes = modalBody.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        iframe.remove();
    });
    
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// ========================================
// CUSTOM BENACHRICHTIGUNGEN (statt Alert)
// ========================================
function showNotification(icon, title, message) {
    // Erstelle Overlay
    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    
    // Erstelle Benachrichtigung
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-button">OK</button>
    `;
    
    // Füge zum DOM hinzu
    document.body.appendChild(overlay);
    document.body.appendChild(notification);
    
    // Event Listener für Schließen
    const closeNotification = () => {
        notification.style.animation = 'notificationAppear 0.3s ease-out reverse';
        overlay.style.animation = 'fadeIn 0.2s ease-out reverse';
        
        setTimeout(() => {
            document.body.removeChild(notification);
            document.body.removeChild(overlay);
        }, 300);
    };
    
    notification.querySelector('.notification-button').addEventListener('click', closeNotification);
    overlay.addEventListener('click', closeNotification);
}

function showLockedMessage(day) {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    
    let icon = '🔒';
    let title = 'Türchen gesperrt';
    let message = '';
    
    if (currentMonth !== 12) {
        icon = '🎅';
        title = 'Noch nicht Dezember';
        message = 'Ho ho ho! Der Adventskalender startet am 1. Dezember! 🎄';
    } else {
        message = `Dieses Türchen öffnet sich erst am ${day}. Dezember!<br>Noch etwas Geduld... 🎁`;
    }
    
    showNotification(icon, title, message);
}

function showError(message) {
    showNotification('❌', 'Fehler', message);
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Modal Close Button
    const closeBtn = document.getElementById('modal-close');
    closeBtn.addEventListener('click', closeModal);
    
    // Modal Hintergrund klicken zum Schließen
    const modal = document.getElementById('door-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // ESC-Taste zum Schließen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// ========================================
// PLAYER AVATAR DISPLAY
// ========================================
function initPlayerAvatarDisplay() {
    const display = document.getElementById('playerAvatarDisplay');
    if (!display) return;
    
    // Lade Custom Avatar aus localStorage
    let customAvatar = null;
    try {
        customAvatar = localStorage.getItem('customAvatar');
    } catch (e) {
        console.warn('LocalStorage nicht verfügbar:', e.message);
    }
    
    if (customAvatar) {
        try {
            const avatar = JSON.parse(customAvatar);
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(avatar.options)) {
                if (value !== '') {
                    params.append(key, value);
                }
            }
            const avatarUrl = '/api/avatar-custom/' + avatar.style + '?' + params.toString();
            display.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
        } catch (error) {
            console.error('Fehler beim Laden des Avatars:', error);
        }
    }
}
