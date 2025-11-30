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

    async init() {
        // Prüfe Session beim Backend
        try {
            const response = await fetch('/api/auth/session');
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    // User ist eingeloggt, kein Overlay
                    this.currentAvatar = data.user;
                    return;
                }
            }
        } catch (error) {
            console.error('Fehler beim Prüfen der Session:', error);
        }
        
        // Fallback: Lade Profil aus Cookie
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
     * Rendert Avatar basierend auf Profil (Charakter-Bild oder Custom)
     */
    renderAvatarDisplay(profile = null, size = 100) {
        const currentProfile = profile || this.currentAvatar;
        
        if (!currentProfile) {
            return this.renderAvatarSVG(this.getDefaultAvatar(), size);
        }
        
        // Wenn Charakter-Bild vorhanden (neue Charaktere)
        if (currentProfile.character && currentProfile.character.imageUrl) {
            return `
                <img 
                    src="${currentProfile.character.imageUrl}" 
                    alt="${currentProfile.username}"
                    style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"
                    onerror="this.style.display='none'"
                />
            `;
        }
        
        // Wenn Avatar-URL vorhanden
        if (currentProfile.avatar && currentProfile.avatar.imageUrl) {
            return `
                <img 
                    src="${currentProfile.avatar.imageUrl}" 
                    alt="${currentProfile.username}"
                    style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.2);"
                    onerror="this.style.display='none'"
                />
            `;
        }
        
        // Fallback auf Custom SVG Avatar
        return this.renderAvatarSVG(currentProfile.avatar, size);
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
            gender: 'babo',
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
                <h1>Willkommen beim Adventskalender ${new Date().getFullYear()}!</h1>
                <p class="welcome-text">
                    Schön, dass du hier bist! Bevor wir starten, erstelle deinen persönlichen Avatar.
                    Du kannst ihn individuell gestalten oder einfach einen zufälligen Avatar generieren lassen.
                </p>
                <div class="welcome-features">
                    <div class="feature-item">
                        <span class="feature-icon">🎮</span>
                        <span>Spiele tolle Weihnachtsspiele</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🏆</span>
                        <span>Sammle Punkte und schalte neue Avatar-Features frei</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🎁</span>
                        <span>Öffne jeden Tag ein neues Türchen</span>
                    </div>
                </div>
                <button class="avatar-create-button" onclick="avatarManager.goToAvatarEditor()">
                    🎨 Avatar erstellen!
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
     * Zur Character-Select-Seite navigieren
     */
    goToCharacterSelect() {
        window.location.href = 'character-select.html';
    }

    /**
     * Zur Avatar-Editor-Seite navigieren (Custom Avatar)
     */
    goToAvatarEditor() {
        window.location.href = 'avatar-editor.html';
    }

    /**
     * Avatar-SVG rendern (Legacy)
     */
    renderAvatarSVG(avatar, size = 100) {
        const parts = avatar || this.getDefaultAvatar();
        
        return `
            <svg width="${size}" height="${size}" viewBox="0 0 200 240" preserveAspectRatio="xMidYMid meet" class="avatar-svg">
                <!-- Füße -->
                ${this.getSVGFeet(parts.feet)}
                
                <!-- Körper -->
                ${this.getSVGBody(parts.body)}
                
                <!-- Gesicht -->
                ${this.getSVGFace(parts.face)}
                
                <!-- Kopfbedeckung -->
                ${this.getSVGHead(parts.head)}
            </svg>
        `;
    }
    
    /**
     * Rendert den Avatar mit DiceBear
     */
    renderAvatar3D(containerId, avatar, size = 200, autoAnimate = true) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Container not found:', containerId);
            return null;
        }
        
        // Lade Avatar aus localStorage oder verwende Default
        const savedAvatar = localStorage.getItem('customAvatar');
        let avatarUrl = '/api/avatar-custom/adventurer?seed=default';
        
        if (savedAvatar) {
            try {
                const avatarData = JSON.parse(savedAvatar);
                const params = new URLSearchParams(avatarData.options);
                avatarUrl = `/api/avatar-custom/${avatarData.style}?${params.toString()}`;
            } catch (error) {
                console.error('Error parsing saved avatar:', error);
            }
        }
        
        // Erstelle IMG Element für SVG Avatar
        const img = document.createElement('img');
        img.src = avatarUrl;
        img.className = 'avatar-image';
        img.style.width = `${size}px`;
        img.style.height = `${size}px`;
        img.style.borderRadius = '50%';
        img.alt = 'Avatar';
        
        container.innerHTML = '';
        container.appendChild(img);
        
        return img;
    }

    /**
     * SVG Parts - Kopfbedeckung
     */
    getSVGHead(type) {
        const heads = {
            // BABO Kopfbedeckungen
            'snapback': `
                <g id="snapback">
                    <ellipse cx="100" cy="52" rx="42" ry="10" fill="#1a1a1a"/>
                    <path d="M60 52 Q100 28 140 52" fill="#1a1a1a"/>
                    <rect x="90" y="38" width="20" height="8" fill="#ffd700"/>
                    <path d="M145 52 L155 54 L152 50 Z" fill="#c41e3a"/>
                </g>
            `,
            'hoodie': `
                <g id="hoodie">
                    <path d="M58 52 Q100 25 142 52" fill="#2c2c2c"/>
                    <path d="M70 52 Q100 35 130 52" fill="#1a1a1a"/>
                    <circle cx="100" cy="40" r="3" fill="#888"/>
                </g>
            `,
            'beanie': `
                <g id="beanie">
                    <ellipse cx="100" cy="52" rx="40" ry="8" fill="#c41e3a"/>
                    <path d="M62 52 Q100 20 138 52" fill="#c41e3a"/>
                    <rect x="60" y="48" width="80" height="8" fill="#8b0000"/>
                </g>
            `,
            'cap-cool': `
                <g id="cap-cool">
                    <ellipse cx="100" cy="52" rx="40" ry="10" fill="#000"/>
                    <path d="M62 52 Q100 30 138 52" fill="#000"/>
                    <path d="M135 52 L165 54 Q168 52 165 50 L135 48" fill="#000"/>
                </g>
            `,
            
            // CUTIE Kopfbedeckungen
            'bow-pink': `
                <g id="bow-pink">
                    <ellipse cx="75" cy="45" rx="18" ry="12" fill="#ff69b4"/>
                    <ellipse cx="125" cy="45" rx="18" ry="12" fill="#ff69b4"/>
                    <circle cx="100" cy="48" r="8" fill="#ff1493"/>
                    <ellipse cx="75" cy="45" rx="10" ry="6" fill="#ff1493"/>
                    <ellipse cx="125" cy="45" rx="10" ry="6" fill="#ff1493"/>
                </g>
            `,
            'flower-crown': `
                <g id="flower-crown">
                    <circle cx="75" cy="48" r="8" fill="#ff69b4"/>
                    <circle cx="73" cy="46" r="3" fill="#fff"/>
                    <circle cx="90" cy="45" r="8" fill="#ffd700"/>
                    <circle cx="88" cy="43" r="3" fill="#fff"/>
                    <circle cx="105" cy="44" r="8" fill="#ff69b4"/>
                    <circle cx="103" cy="42" r="3" fill="#fff"/>
                    <circle cx="120" cy="46" r="8" fill="#da70d6"/>
                    <circle cx="118" cy="44" r="3" fill="#fff"/>
                </g>
            `,
            'bunny-ears': `
                <g id="bunny-ears">
                    <ellipse cx="75" cy="28" rx="8" ry="25" fill="#ffb6c1"/>
                    <ellipse cx="75" cy="28" rx="4" ry="18" fill="#ff69b4"/>
                    <ellipse cx="125" cy="28" rx="8" ry="25" fill="#ffb6c1"/>
                    <ellipse cx="125" cy="28" rx="4" ry="18" fill="#ff69b4"/>
                </g>
            `,
            'tiara': `
                <g id="tiara">
                    <path d="M65 52 L75 35 L85 48 L100 28 L115 48 L125 35 L135 52" fill="none" stroke="#ffd700" stroke-width="3"/>
                    <circle cx="75" cy="35" r="5" fill="#ff69b4"/>
                    <circle cx="100" cy="28" r="6" fill="#ff1493"/>
                    <circle cx="125" cy="35" r="5" fill="#ff69b4"/>
                </g>
            `,
            
            // NEUTRAL
            'santa-hat': `
                <g id="santa-hat">
                    <path d="M68 52 Q100 25 132 52" fill="#c41e3a"/>
                    <ellipse cx="100" cy="52" rx="36" ry="8" fill="#fff"/>
                    <circle cx="132" cy="32" r="10" fill="#fff"/>
                    <circle cx="132" cy="32" r="7" fill="#f8f8f8"/>
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
            // BABO Gesichter
            'cool-dude': `
                <g id="cool-dude">
                    <circle cx="100" cy="85" r="42" fill="#ffdbac"/>
                    <rect x="73" y="76" width="22" height="10" rx="3" fill="#1a1a1a"/>
                    <rect x="105" y="76" width="22" height="10" rx="3" fill="#1a1a1a"/>
                    <path d="M95 77 L105 77" stroke="#1a1a1a" stroke-width="2"/>
                    <path d="M86 98 Q100 103 114 98" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                </g>
            `,
            'smirk': `
                <g id="smirk">
                    <circle cx="100" cy="85" r="42" fill="#ffdbac"/>
                    <circle cx="82" cy="78" r="4" fill="#2c1810"/>
                    <circle cx="118" cy="78" r="4" fill="#2c1810"/>
                    <circle cx="80" cy="76" r="1.5" fill="#fff"/>
                    <circle cx="116" cy="76" r="1.5" fill="#fff"/>
                    <path d="M82 96 Q95 102 108 95" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                </g>
            `,
            'tough': `
                <g id="tough">
                    <circle cx="100" cy="85" r="42" fill="#ffdbac"/>
                    <path d="M75 78 L88 78" stroke="#2c1810" stroke-width="3" stroke-linecap="round"/>
                    <path d="M112 78 L125 78" stroke="#2c1810" stroke-width="3" stroke-linecap="round"/>
                    <circle cx="82" cy="80" r="3" fill="#2c1810"/>
                    <circle cx="118" cy="80" r="3" fill="#2c1810"/>
                    <path d="M88 100 L112 100" stroke="#000" stroke-width="2.5" stroke-linecap="round"/>
                </g>
            `,
            'confident': `
                <g id="confident">
                    <circle cx="100" cy="85" r="42" fill="#ffdbac"/>
                    <circle cx="82" cy="78" r="5" fill="#2c1810"/>
                    <circle cx="118" cy="78" r="5" fill="#2c1810"/>
                    <circle cx="80" cy="76" r="2" fill="#fff"/>
                    <circle cx="116" cy="76" r="2" fill="#fff"/>
                    <path d="M85 98 Q100 105 115 98" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                </g>
            `,
            
            // CUTIE Gesichter
            'kawaii': `
                <g id="kawaii">
                    <circle cx="100" cy="85" r="42" fill="#ffe6f0"/>
                    <circle cx="82" cy="78" r="6" fill="#2c1810"/>
                    <circle cx="118" cy="78" r="6" fill="#2c1810"/>
                    <circle cx="79" cy="75" r="2.5" fill="#fff"/>
                    <circle cx="115" cy="75" r="2.5" fill="#fff"/>
                    <path d="M88 98 Q100 108 112 98" stroke="#ff69b4" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                    <circle cx="72" cy="92" r="8" fill="#ffb6c1" opacity="0.6"/>
                    <circle cx="128" cy="92" r="8" fill="#ffb6c1" opacity="0.6"/>
                </g>
            `,
            'sweet-smile': `
                <g id="sweet-smile">
                    <circle cx="100" cy="85" r="42" fill="#ffe6f0"/>
                    <path d="M78 78 Q82 74 86 78" stroke="#2c1810" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                    <path d="M114 78 Q118 74 122 78" stroke="#2c1810" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                    <circle cx="82" cy="80" r="3" fill="#2c1810"/>
                    <circle cx="118" cy="80" r="3" fill="#2c1810"/>
                    <path d="M88 98 Q100 106 112 98" stroke="#ff69b4" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                    <circle cx="70" cy="92" r="6" fill="#ffb6c1" opacity="0.5"/>
                    <circle cx="130" cy="92" r="6" fill="#ffb6c1" opacity="0.5"/>
                </g>
            `,
            'sparkle': `
                <g id="sparkle">
                    <circle cx="100" cy="85" r="42" fill="#ffe6f0"/>
                    <circle cx="82" cy="78" r="7" fill="#2c1810"/>
                    <circle cx="118" cy="78" r="7" fill="#2c1810"/>
                    <circle cx="78" cy="74" r="3" fill="#fff"/>
                    <circle cx="114" cy="74" r="3" fill="#fff"/>
                    <path d="M85 98 Q100 108 115 98" stroke="#ff69b4" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                    <path d="M60 70 L62 75 L67 75 L63 78 L65 83 L60 80 L55 83 L57 78 L53 75 L58 75 Z" fill="#ffd700" opacity="0.8"/>
                    <circle cx="68" cy="92" r="7" fill="#ffb6c1" opacity="0.6"/>
                    <circle cx="132" cy="92" r="7" fill="#ffb6c1" opacity="0.6"/>
                </g>
            `,
            'cute-wink': `
                <g id="cute-wink">
                    <circle cx="100" cy="85" r="42" fill="#ffe6f0"/>
                    <circle cx="82" cy="78" r="6" fill="#2c1810"/>
                    <circle cx="79" cy="75" r="2" fill="#fff"/>
                    <path d="M112 78 Q118 76 124 78" stroke="#2c1810" stroke-width="3" fill="none" stroke-linecap="round"/>
                    <path d="M110 82 Q118 80 126 82" stroke="#2c1810" stroke-width="2" fill="none" stroke-linecap="round"/>
                    <path d="M88 98 Q100 108 112 98" stroke="#ff69b4" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                    <circle cx="70" cy="92" r="7" fill="#ffb6c1" opacity="0.6"/>
                    <circle cx="130" cy="92" r="7" fill="#ffb6c1" opacity="0.6"/>
                </g>
            `
        };
        return faces[type] || faces['kawaii'];
    }

    /**
     * SVG Parts - Körper
     */
    getSVGBody(type) {
        const bodies = {
            // BABO Körper
            'hoodie-black': `
                <g id="hoodie-black">
                    <path d="M52 130 L60 130 L60 200 L140 200 L140 130 L148 130 L148 135 L142 140 L142 205 L58 205 L58 140 L52 135 Z" fill="#1a1a1a"/>
                    <rect x="65" y="135" width="70" height="65" rx="5" fill="#2c2c2c"/>
                    <path d="M100 135 L100 200" stroke="#3a3a3a" stroke-width="3"/>
                    <circle cx="92" cy="155" r="2.5" fill="#666"/>
                    <circle cx="92" cy="170" r="2.5" fill="#666"/>
                    <circle cx="92" cy="185" r="2.5" fill="#666"/>
                    <path d="M70 140 L80 135 L90 140" stroke="#444" stroke-width="2" fill="none"/>
                    <path d="M110 140 L120 135 L130 140" stroke="#444" stroke-width="2" fill="none"/>
                </g>
            `,
            'leather-jacket': `
                <g id="leather-jacket">
                    <path d="M52 132 L60 132 L60 205 L140 205 L140 132 L148 132 L148 137 L142 142 L142 210 L58 210 L58 142 L52 137 Z" fill="#2c2c2c"/>
                    <rect x="65" y="137" width="70" height="68" rx="5" fill="#1a1a1a"/>
                    <path d="M100 137 L100 205" stroke="#000" stroke-width="4"/>
                    <rect x="70" y="142" width="25" height="8" rx="2" fill="#3a3a3a"/>
                    <rect x="105" y="142" width="25" height="8" rx="2" fill="#3a3a3a"/>
                    <path d="M75 152 L77 162 L73 162 Z" fill="#888"/>
                    <path d="M125 152 L127 162 L123 162 Z" fill="#888"/>
                </g>
            `,
            'sporty-shirt': `
                <g id="sporty-shirt">
                    <path d="M52 132 L60 132 L60 205 L140 205 L140 132 L148 132 L148 137 L142 142 L142 210 L58 210 L58 142 L52 137 Z" fill="#c41e3a"/>
                    <rect x="65" y="137" width="70" height="68" rx="5" fill="#fff"/>
                    <path d="M100 137 L85 210" stroke="#c41e3a" stroke-width="35"/>
                    <path d="M100 137 L115 210" stroke="#1a1a1a" stroke-width="35"/>
                    <circle cx="100" cy="170" r="15" fill="#c41e3a"/>
                    <path d="M95 170 L98 175 L105 165" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
            `,
            'street-style': `
                <g id="street-style">
                    <path d="M52 132 L60 132 L60 205 L140 205 L140 132 L148 132 L148 137 L142 142 L142 210 L58 210 L58 142 L52 137 Z" fill="#2c2c2c"/>
                    <rect x="65" y="137" width="70" height="68" rx="5" fill="#ffd700"/>
                    <rect x="70" y="145" width="60" height="25" fill="#1a1a1a"/>
                    <text x="100" y="163" text-anchor="middle" font-size="16" fill="#ffd700" font-weight="bold" font-family="Arial">KING</text>
                </g>
            `,
            
            // CUTIE Körper
            'dress-pink': `
                <g id="dress-pink">
                    <path d="M52 132 L60 132 L55 210 L145 210 L140 132 L148 132 L148 137 L145 215 L55 215 L52 137 Z" fill="#ff69b4"/>
                    <path d="M65 137 Q100 145 135 137" fill="#ff1493"/>
                    <ellipse cx="100" cy="137" rx="35" ry="5" fill="#ff1493"/>
                    <circle cx="80" cy="160" r="6" fill="#fff" opacity="0.6"/>
                    <circle cx="95" cy="175" r="5" fill="#fff" opacity="0.6"/>
                    <circle cx="110" cy="165" r="6" fill="#fff" opacity="0.6"/>
                    <circle cx="120" cy="185" r="5" fill="#fff" opacity="0.6"/>
                </g>
            `,
            'cute-sweater': `
                <g id="cute-sweater">
                    <path d="M52 132 L60 132 L60 205 L140 205 L140 132 L148 132 L148 137 L142 142 L142 210 L58 210 L58 142 L52 137 Z" fill="#ffb6c1"/>
                    <rect x="65" y="137" width="70" height="68" rx="8" fill="#ffb6c1"/>
                    <circle cx="100" cy="170" r="18" fill="#fff"/>
                    <circle cx="95" cy="167" r="3" fill="#ff69b4"/>
                    <circle cx="105" cy="167" r="3" fill="#ff69b4"/>
                    <path d="M95 175 Q100 180 105 175" stroke="#ff69b4" stroke-width="2" fill="none"/>
                    <circle cx="75" cy="155" r="5" fill="#fff" opacity="0.8"/>
                    <circle cx="125" cy="155" r="5" fill="#fff" opacity="0.8"/>
                </g>
            `,
            'unicorn-shirt': `
                <g id="unicorn-shirt">
                    <path d="M52 132 L60 132 L60 205 L140 205 L140 132 L148 132 L148 137 L142 142 L142 210 L58 210 L58 142 L52 137 Z" fill="#da70d6"/>
                    <rect x="65" y="137" width="70" height="68" rx="5" fill="#fff"/>
                    <path d="M85 155 Q100 145 115 155" fill="#da70d6"/>
                    <path d="M90 150 L85 145 L90 148 L95 142 L95 148 L100 140 L100 148 L105 142 L105 148 L110 145 L110 150" fill="#ffd700"/>
                    <circle cx="95" cy="170" r="3" fill="#da70d6"/>
                    <circle cx="105" cy="170" r="3" fill="#da70d6"/>
                    <path d="M95 178 Q100 182 105 178" stroke="#ff69b4" stroke-width="2" fill="none"/>
                </g>
            `,
            'heart-top': `
                <g id="heart-top">
                    <path d="M52 132 L60 132 L60 205 L140 205 L140 132 L148 132 L148 137 L142 142 L142 210 L58 210 L58 142 L52 137 Z" fill="#ff1493"/>
                    <rect x="65" y="137" width="70" height="68" rx="5" fill="#ff69b4"/>
                    <path d="M85 160 Q85 150 92 150 Q100 150 100 160 Q100 150 108 150 Q115 150 115 160 Q115 175 100 185 Q85 175 85 160 Z" fill="#fff"/>
                    <circle cx="75" cy="155" r="4" fill="#fff" opacity="0.7"/>
                    <circle cx="125" cy="155" r="4" fill="#fff" opacity="0.7"/>
                </g>
            `
        };
        return bodies[type] || bodies['hoodie-black'];
    }

    /**
     * SVG Parts - Füße
     */
    getSVGFeet(type) {
        const feet = {
            // BABO Schuhe
            'sneakers-white': `
                <g id="sneakers-white">
                    <ellipse cx="75" cy="218" rx="20" ry="10" fill="#fff"/>
                    <ellipse cx="125" cy="218" rx="20" ry="10" fill="#fff"/>
                    <ellipse cx="75" cy="218" rx="18" ry="8" fill="#f5f5f5"/>
                    <ellipse cx="125" cy="218" rx="18" ry="8" fill="#f5f5f5"/>
                    <path d="M58 218 L92 218" stroke="#1a1a1a" stroke-width="2"/>
                    <path d="M108 218 L142 218" stroke="#1a1a1a" stroke-width="2"/>
                    <circle cx="70" cy="218" r="2" fill="#c41e3a"/>
                    <circle cx="130" cy="218" r="2" fill="#c41e3a"/>
                </g>
            `,
            'sneakers-black': `
                <g id="sneakers-black">
                    <ellipse cx="75" cy="218" rx="20" ry="10" fill="#1a1a1a"/>
                    <ellipse cx="125" cy="218" rx="20" ry="10" fill="#1a1a1a"/>
                    <path d="M58 218 L92 218" stroke="#fff" stroke-width="2"/>
                    <path d="M108 218 L142 218" stroke="#fff" stroke-width="2"/>
                    <path d="M60 222 L90 222" stroke="#3a3a3a" stroke-width="3"/>
                    <path d="M110 222 L140 222" stroke="#3a3a3a" stroke-width="3"/>
                </g>
            `,
            'boots-cool': `
                <g id="boots-cool">
                    <rect x="58" y="210" width="34" height="18" rx="4" fill="#2c2c2c"/>
                    <rect x="108" y="210" width="34" height="18" rx="4" fill="#2c2c2c"/>
                    <rect x="60" y="212" width="30" height="14" rx="3" fill="#1a1a1a"/>
                    <rect x="110" y="212" width="30" height="14" rx="3" fill="#1a1a1a"/>
                    <path d="M65 220 L87 220" stroke="#444" stroke-width="2"/>
                    <path d="M115 220 L137 220" stroke="#444" stroke-width="2"/>
                </g>
            `,
            'jordans': `
                <g id="jordans">
                    <ellipse cx="75" cy="218" rx="20" ry="10" fill="#c41e3a"/>
                    <ellipse cx="125" cy="218" rx="20" ry="10" fill="#c41e3a"/>
                    <ellipse cx="75" cy="216" rx="18" ry="7" fill="#fff"/>
                    <ellipse cx="125" cy="216" rx="18" ry="7" fill="#fff"/>
                    <path d="M60 218 L90 218" stroke="#1a1a1a" stroke-width="2.5"/>
                    <path d="M110 218 L140 218" stroke="#1a1a1a" stroke-width="2.5"/>
                    <circle cx="85" cy="216" r="3" fill="#1a1a1a"/>
                    <circle cx="115" cy="216" r="3" fill="#1a1a1a"/>
                </g>
            `,
            
            // CUTIE Schuhe
            'ballet-shoes': `
                <g id="ballet-shoes">
                    <ellipse cx="75" cy="218" rx="18" ry="9" fill="#ffb6c1"/>
                    <ellipse cx="125" cy="218" rx="18" ry="9" fill="#ffb6c1"/>
                    <ellipse cx="75" cy="217" rx="15" ry="6" fill="#ff69b4"/>
                    <ellipse cx="125" cy="217" rx="15" ry="6" fill="#ff69b4"/>
                    <path d="M62 220 L88 220" stroke="#ff1493" stroke-width="1.5"/>
                    <path d="M112 220 L138 220" stroke="#ff1493" stroke-width="1.5"/>
                </g>
            `,
            'cute-boots': `
                <g id="cute-boots">
                    <rect x="60" y="210" width="30" height="18" rx="5" fill="#ff69b4"/>
                    <rect x="110" y="210" width="30" height="18" rx="5" fill="#ff69b4"/>
                    <ellipse cx="75" cy="210" rx="15" ry="5" fill="#ff1493"/>
                    <ellipse cx="125" cy="210" rx="15" ry="5" fill="#ff1493"/>
                    <circle cx="75" cy="220" r="3" fill="#fff"/>
                    <circle cx="125" cy="220" r="3" fill="#fff"/>
                </g>
            `,
            'sparkle-sneakers': `
                <g id="sparkle-sneakers">
                    <ellipse cx="75" cy="218" rx="20" ry="10" fill="#da70d6"/>
                    <ellipse cx="125" cy="218" rx="20" ry="10" fill="#da70d6"/>
                    <ellipse cx="75" cy="216" rx="17" ry="7" fill="#fff"/>
                    <ellipse cx="125" cy="216" rx="17" ry="7" fill="#fff"/>
                    <path d="M60 218 L90 218" stroke="#ff69b4" stroke-width="2"/>
                    <path d="M110 218 L140 218" stroke="#ff69b4" stroke-width="2"/>
                    <circle cx="68" cy="216" r="2" fill="#ffd700"/>
                    <circle cx="82" cy="216" r="2" fill="#ffd700"/>
                    <circle cx="118" cy="216" r="2" fill="#ffd700"/>
                    <circle cx="132" cy="216" r="2" fill="#ffd700"/>
                </g>
            `,
            'bunny-slippers': `
                <g id="bunny-slippers">
                    <ellipse cx="75" cy="218" rx="22" ry="11" fill="#ffb6c1"/>
                    <ellipse cx="125" cy="218" rx="22" ry="11" fill="#ffb6c1"/>
                    <ellipse cx="75" cy="217" rx="18" ry="8" fill="#ff69b4"/>
                    <ellipse cx="125" cy="217" rx="18" ry="8" fill="#ff69b4"/>
                    <ellipse cx="70" cy="210" rx="4" ry="8" fill="#ffb6c1"/>
                    <ellipse cx="80" cy="210" rx="4" ry="8" fill="#ffb6c1"/>
                    <ellipse cx="120" cy="210" rx="4" ry="8" fill="#ffb6c1"/>
                    <ellipse cx="130" cy="210" rx="4" ry="8" fill="#ffb6c1"/>
                    <circle cx="70" cy="217" r="2" fill="#ff1493"/>
                    <circle cx="120" cy="217" r="2" fill="#ff1493"/>
                </g>
            `
        };
        return feet[type] || feet['sneakers-white'];
    }

    /**
     * Hole Avatar-Optionen (geschlechtsspezifisch)
     */
    getAvatarOptions(gender = 'babo') {
        const baboOptions = {
            head: [
                { id: 'snapback', name: 'Snapback', icon: '🧢' },
                { id: 'hoodie', name: 'Hoodie', icon: '🎽' },
                { id: 'beanie', name: 'Beanie', icon: '�' },
                { id: 'cap-cool', name: 'Cap', icon: '🧢' },
                { id: 'santa-hat', name: 'Santa', icon: '🎅' }
            ],
            face: [
                { id: 'cool-dude', name: 'Cool', icon: '😎' },
                { id: 'smirk', name: 'Smirk', icon: '😏' },
                { id: 'tough', name: 'Tough', icon: '😠' },
                { id: 'confident', name: 'Confident', icon: '�' }
            ],
            body: [
                { id: 'hoodie-black', name: 'Black Hoodie', icon: '🎽' },
                { id: 'leather-jacket', name: 'Leather Jacket', icon: '🧥' },
                { id: 'sporty-shirt', name: 'Sport Shirt', icon: '⚽' },
                { id: 'street-style', name: 'Street Style', icon: '👕' }
            ],
            feet: [
                { id: 'sneakers-white', name: 'White Sneakers', icon: '👟' },
                { id: 'sneakers-black', name: 'Black Sneakers', icon: '�' },
                { id: 'boots-cool', name: 'Boots', icon: '🥾' },
                { id: 'jordans', name: 'Jordans', icon: '�' }
            ]
        };

        const cutieOptions = {
            head: [
                { id: 'bow-pink', name: 'Rosa Schleife', icon: '🎀' },
                { id: 'flower-crown', name: 'Blumenkranz', icon: '🌸' },
                { id: 'bunny-ears', name: 'Hasenohren', icon: '🐰' },
                { id: 'tiara', name: 'Diadem', icon: '👑' },
                { id: 'santa-hat', name: 'Santa', icon: '🎅' }
            ],
            face: [
                { id: 'kawaii', name: 'Kawaii', icon: '🥰' },
                { id: 'sweet-smile', name: 'Sweet', icon: '😊' },
                { id: 'sparkle', name: 'Sparkle', icon: '✨' },
                { id: 'cute-wink', name: 'Wink', icon: '😉' }
            ],
            body: [
                { id: 'dress-pink', name: 'Rosa Kleid', icon: '👗' },
                { id: 'cute-sweater', name: 'Cute Pullover', icon: '🧶' },
                { id: 'unicorn-shirt', name: 'Einhorn Shirt', icon: '�' },
                { id: 'heart-top', name: 'Herz Top', icon: '�' }
            ],
            feet: [
                { id: 'ballet-shoes', name: 'Ballerinas', icon: '🩰' },
                { id: 'cute-boots', name: 'Cute Boots', icon: '👢' },
                { id: 'sparkle-sneakers', name: 'Glitzer Sneakers', icon: '✨' },
                { id: 'bunny-slippers', name: 'Hasen Puschen', icon: '🐰' }
            ]
        };

        return gender === 'cutie' ? cutieOptions : baboOptions;
    }
}

// Globale Instanz erstellen
const avatarManager = new AvatarManager();

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarManager;
}
