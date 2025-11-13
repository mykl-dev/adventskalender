/**
 * Avatar Manager - Handles player avatar creation and management
 */

class AvatarManager {
    constructor() {
        this.cookieName = 'advent_player_profile';
        this.cookieExpireDays = 365;
        this.currentAvatar = null;
        this.init();
    }

    init() {
        // Lade Profil aus Cookie
        this.currentAvatar = this.loadProfile();
        
        // Prüfe ob Profil vorhanden ist
        if (!this.currentAvatar) {
            // Zeige Welcome Overlay nur auf der Hauptseite
            if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
                this.showWelcomeOverlay();
            }
        }
    }

    /**
     * Lade Spielerprofil aus Cookie
     */
    loadProfile() {
        try {
            const cookie = this.getCookie(this.cookieName);
            if (cookie) {
                return JSON.parse(decodeURIComponent(cookie));
            }
        } catch (error) {
            console.error('Fehler beim Laden des Profils:', error);
        }
        return null;
    }

    /**
     * Speichere Spielerprofil in Cookie
     */
    saveProfile(profile) {
        try {
            const profileData = {
                username: profile.username,
                avatar: profile.avatar,
                createdAt: profile.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const cookieValue = encodeURIComponent(JSON.stringify(profileData));
            const expires = new Date();
            expires.setTime(expires.getTime() + (this.cookieExpireDays * 24 * 60 * 60 * 1000));
            
            document.cookie = `${this.cookieName}=${cookieValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
            this.currentAvatar = profileData;
            
            console.log('Profil gespeichert:', profileData);
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern des Profils:', error);
            return false;
        }
    }

    /**
     * Hole Cookie-Wert
     */
    getCookie(name) {
        const nameEQ = name + "=";
        const cookies = document.cookie.split(';');
        
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(nameEQ) === 0) {
                return cookie.substring(nameEQ.length);
            }
        }
        return null;
    }

    /**
     * Hole aktuellen Spielernamen
     */
    getUsername() {
        return this.currentAvatar ? this.currentAvatar.username : 'Spieler';
    }

    /**
     * Hole aktuellen Avatar
     */
    getAvatar() {
        return this.currentAvatar ? this.currentAvatar.avatar : this.getDefaultAvatar();
    }

    /**
     * Hole komplettes Profil
     */
    getProfile() {
        return this.currentAvatar;
    }

    /**
     * Standard-Avatar
     */
    getDefaultAvatar() {
        return {
            head: 'santa-hat',
            face: 'happy',
            body: 'sweater-red',
            feet: 'boots-black'
        };
    }

    /**
     * Zeige Welcome Overlay
     */
    showWelcomeOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'avatar-welcome-overlay';
        overlay.innerHTML = `
            <div class="avatar-welcome-content">
                <div class="welcome-icon">🎄</div>
                <h1>Willkommen beim Adventskalender 2024!</h1>
                <p class="welcome-text">
                    Schön, dass du hier bist! Bevor wir starten, erstelle deinen persönlichen Avatar
                    und gib dir einen Namen. Dein Avatar wird bei allen Spielen angezeigt.
                </p>
                <div class="welcome-features">
                    <div class="feature-item">
                        <span class="feature-icon">🎮</span>
                        <span>Spiele tolle Weihnachtsspiele</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🏆</span>
                        <span>Sammle Punkte und erreiche die Bestenliste</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🎁</span>
                        <span>Öffne jeden Tag ein neues Türchen</span>
                    </div>
                </div>
                <button class="avatar-create-button" onclick="avatarManager.goToAvatarEditor()">
                    ✨ Jetzt Avatar erstellen!
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Animation
        setTimeout(() => {
            overlay.classList.add('show');
        }, 100);
    }

    /**
     * Zur Avatar-Editor-Seite navigieren
     */
    goToAvatarEditor() {
        window.location.href = 'avatar-editor.html';
    }

    /**
     * Avatar-SVG rendern
     */
    renderAvatarSVG(avatar, size = 100) {
        const parts = avatar || this.getDefaultAvatar();
        
        return `
            <svg width="${size}" height="${size}" viewBox="0 0 200 200" class="avatar-svg">
                <!-- Körper -->
                ${this.getSVGBody(parts.body)}
                
                <!-- Gesicht -->
                ${this.getSVGFace(parts.face)}
                
                <!-- Kopfbedeckung -->
                ${this.getSVGHead(parts.head)}
                
                <!-- Füße -->
                ${this.getSVGFeet(parts.feet)}
            </svg>
        `;
    }

    /**
     * SVG Parts - Kopfbedeckung
     */
    getSVGHead(type) {
        const heads = {
            'santa-hat': `
                <g id="santa-hat">
                    <path d="M70 40 Q100 20 130 40" fill="#c41e3a" stroke="#8b0000" stroke-width="2"/>
                    <ellipse cx="100" cy="45" rx="35" ry="8" fill="#fff"/>
                    <circle cx="130" cy="30" r="8" fill="#fff"/>
                </g>
            `,
            'elf-hat': `
                <g id="elf-hat">
                    <path d="M70 45 L100 15 L130 45" fill="#2e7d32" stroke="#1b5e20" stroke-width="2"/>
                    <circle cx="100" cy="15" r="6" fill="#ffd700"/>
                </g>
            `,
            'winter-hat': `
                <g id="winter-hat">
                    <rect x="70" y="35" width="60" height="15" rx="7" fill="#4169e1"/>
                    <ellipse cx="100" cy="50" rx="35" ry="8" fill="#e0e0e0"/>
                    <circle cx="100" cy="20" r="10" fill="#e0e0e0"/>
                </g>
            `,
            'crown': `
                <g id="crown">
                    <path d="M65 45 L75 30 L85 45 L95 30 L105 45 L115 30 L125 45 L135 45" fill="#ffd700" stroke="#daa520" stroke-width="2"/>
                    <circle cx="75" cy="30" r="4" fill="#ff4444"/>
                    <circle cx="95" cy="30" r="4" fill="#ff4444"/>
                    <circle cx="115" cy="30" r="4" fill="#ff4444"/>
                </g>
            `,
            'reindeer-antlers': `
                <g id="reindeer-antlers">
                    <path d="M70 40 L60 30 L55 35 M60 30 L55 25" stroke="#8b4513" stroke-width="3" fill="none"/>
                    <path d="M130 40 L140 30 L145 35 M140 30 L145 25" stroke="#8b4513" stroke-width="3" fill="none"/>
                </g>
            `
        };
        return heads[type] || heads['santa-hat'];
    }

    /**
     * SVG Parts - Gesicht
     */
    getSVGFace(type) {
        const faces = {
            'happy': `
                <g id="happy-face">
                    <circle cx="100" cy="80" r="40" fill="#ffdbac" stroke="#d4a574" stroke-width="2"/>
                    <circle cx="85" cy="75" r="4" fill="#000"/>
                    <circle cx="115" cy="75" r="4" fill="#000"/>
                    <path d="M85 90 Q100 100 115 90" stroke="#000" stroke-width="2" fill="none"/>
                    <circle cx="83" cy="73" r="1.5" fill="#fff"/>
                    <circle cx="113" cy="73" r="1.5" fill="#fff"/>
                </g>
            `,
            'cool': `
                <g id="cool-face">
                    <circle cx="100" cy="80" r="40" fill="#ffdbac" stroke="#d4a574" stroke-width="2"/>
                    <rect x="75" y="70" width="20" height="8" rx="2" fill="#000"/>
                    <rect x="105" y="70" width="20" height="8" rx="2" fill="#000"/>
                    <path d="M88 92 Q100 95 112 92" stroke="#000" stroke-width="2" fill="none"/>
                </g>
            `,
            'wink': `
                <g id="wink-face">
                    <circle cx="100" cy="80" r="40" fill="#ffdbac" stroke="#d4a574" stroke-width="2"/>
                    <circle cx="85" cy="75" r="4" fill="#000"/>
                    <path d="M108 75 Q115 73 122 75" stroke="#000" stroke-width="2" fill="none"/>
                    <path d="M85 90 Q100 100 115 90" stroke="#000" stroke-width="2" fill="none"/>
                </g>
            `,
            'surprised': `
                <g id="surprised-face">
                    <circle cx="100" cy="80" r="40" fill="#ffdbac" stroke="#d4a574" stroke-width="2"/>
                    <circle cx="85" cy="72" r="6" fill="#000"/>
                    <circle cx="115" cy="72" r="6" fill="#000"/>
                    <circle cx="100" cy="92" r="8" fill="#000"/>
                    <circle cx="83" cy="70" r="2" fill="#fff"/>
                    <circle cx="113" cy="70" r="2" fill="#fff"/>
                </g>
            `
        };
        return faces[type] || faces['happy'];
    }

    /**
     * SVG Parts - Körper
     */
    getSVGBody(type) {
        const bodies = {
            'sweater-red': `
                <g id="sweater-red">
                    <rect x="60" y="115" width="80" height="60" rx="10" fill="#c41e3a"/>
                    <path d="M70 130 L130 130" stroke="#fff" stroke-width="3"/>
                    <path d="M70 145 L130 145" stroke="#fff" stroke-width="3"/>
                    <circle cx="80" cy="137" r="3" fill="#2e7d32"/>
                    <circle cx="120" cy="137" r="3" fill="#2e7d32"/>
                </g>
            `,
            'sweater-green': `
                <g id="sweater-green">
                    <rect x="60" y="115" width="80" height="60" rx="10" fill="#2e7d32"/>
                    <path d="M80 125 L85 135 L75 135 Z" fill="#c41e3a"/>
                    <path d="M100 125 L105 135 L95 135 Z" fill="#c41e3a"/>
                    <path d="M120 125 L125 135 L115 135 Z" fill="#c41e3a"/>
                </g>
            `,
            'suit': `
                <g id="suit">
                    <rect x="60" y="115" width="80" height="60" rx="10" fill="#1a1a1a"/>
                    <path d="M100 115 L100 175" stroke="#fff" stroke-width="2"/>
                    <circle cx="95" cy="135" r="3" fill="#ffd700"/>
                    <circle cx="95" cy="150" r="3" fill="#ffd700"/>
                    <circle cx="95" cy="165" r="3" fill="#ffd700"/>
                </g>
            `,
            't-shirt-blue': `
                <g id="t-shirt-blue">
                    <rect x="60" y="115" width="80" height="60" rx="10" fill="#4169e1"/>
                    <circle cx="100" cy="145" r="15" fill="#fff"/>
                    <text x="100" y="152" text-anchor="middle" font-size="16" fill="#4169e1" font-weight="bold">❄</text>
                </g>
            `
        };
        return bodies[type] || bodies['sweater-red'];
    }

    /**
     * SVG Parts - Füße
     */
    getSVGFeet(type) {
        const feet = {
            'boots-black': `
                <g id="boots-black">
                    <ellipse cx="80" cy="180" rx="15" ry="8" fill="#000"/>
                    <ellipse cx="120" cy="180" rx="15" ry="8" fill="#000"/>
                </g>
            `,
            'boots-brown': `
                <g id="boots-brown">
                    <ellipse cx="80" cy="180" rx="15" ry="8" fill="#8b4513"/>
                    <ellipse cx="120" cy="180" rx="15" ry="8" fill="#8b4513"/>
                </g>
            `,
            'sneakers': `
                <g id="sneakers">
                    <ellipse cx="80" cy="180" rx="15" ry="8" fill="#fff"/>
                    <ellipse cx="120" cy="180" rx="15" ry="8" fill="#fff"/>
                    <path d="M65 180 L95 180" stroke="#000" stroke-width="1"/>
                    <path d="M105 180 L135 180" stroke="#000" stroke-width="1"/>
                </g>
            `,
            'slippers': `
                <g id="slippers">
                    <ellipse cx="80" cy="180" rx="15" ry="8" fill="#c41e3a"/>
                    <ellipse cx="120" cy="180" rx="15" ry="8" fill="#c41e3a"/>
                    <ellipse cx="80" cy="180" rx="10" ry="5" fill="#fff"/>
                    <ellipse cx="120" cy="180" rx="10" ry="5" fill="#fff"/>
                </g>
            `
        };
        return feet[type] || feet['boots-black'];
    }

    /**
     * Hole Avatar-Optionen
     */
    getAvatarOptions() {
        return {
            head: [
                { id: 'santa-hat', name: 'Weihnachtsmannmütze', icon: '🎅' },
                { id: 'elf-hat', name: 'Elfenmütze', icon: '🧝' },
                { id: 'winter-hat', name: 'Wintermütze', icon: '🧢' },
                { id: 'crown', name: 'Krone', icon: '👑' },
                { id: 'reindeer-antlers', name: 'Rentiergeweih', icon: '🦌' }
            ],
            face: [
                { id: 'happy', name: 'Fröhlich', icon: '😊' },
                { id: 'cool', name: 'Cool', icon: '😎' },
                { id: 'wink', name: 'Zwinkernd', icon: '😉' },
                { id: 'surprised', name: 'Überrascht', icon: '😮' }
            ],
            body: [
                { id: 'sweater-red', name: 'Roter Pullover', icon: '🧥' },
                { id: 'sweater-green', name: 'Grüner Pullover', icon: '👕' },
                { id: 'suit', name: 'Anzug', icon: '🤵' },
                { id: 't-shirt-blue', name: 'Blaues T-Shirt', icon: '👔' }
            ],
            feet: [
                { id: 'boots-black', name: 'Schwarze Stiefel', icon: '👢' },
                { id: 'boots-brown', name: 'Braune Stiefel', icon: '🥾' },
                { id: 'sneakers', name: 'Turnschuhe', icon: '👟' },
                { id: 'slippers', name: 'Hausschuhe', icon: '🩴' }
            ]
        };
    }
}

// Globale Instanz erstellen
const avatarManager = new AvatarManager();

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarManager;
}
