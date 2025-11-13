/**
 * Vorgefertigte Avatar-Charaktere
 * Professionelle Anime/Comic-Style Avatare zur Auswahl
 */

const AvatarCharacters = {
    /**
     * Hole Avatar-Bild-URL (Server-API)
     * Avatare werden zur Laufzeit mit DiceBear generiert
     */
    getAvatarImageUrl(characterId) {
        return `/api/avatar/${characterId}`;
    },

    /**
     * Generiere SVG Avatar (Fallback - wird nicht mehr benötigt)
     */
    generateAvatarSVG(character) {
        const styles = {
            'babo-cool': {
                skin: '#ffdbac',
                hair: '#3d2817',
                eyes: '#2c1810',
                clothes: '#4169e1',
                accent: '#1a1a1a',
                hat: '#000000'
            },
            'babo-sporty': {
                skin: '#f4c2a0',
                hair: '#1a1a1a',
                eyes: '#2c1810',
                clothes: '#c41e3a',
                accent: '#ffffff',
                hat: '#c41e3a'
            },
            'babo-street': {
                skin: '#ffdbac',
                hair: '#1a1a1a',
                eyes: '#2c1810',
                clothes: '#1a1a1a',
                accent: '#ffd700',
                hat: '#1a1a1a'
            },
            'babo-gamer': {
                skin: '#ffe0bd',
                hair: '#4169e1',
                eyes: '#2c1810',
                clothes: '#1a1a1a',
                accent: '#00ff00',
                hat: '#4169e1'
            },
            'cutie-sweet': {
                skin: '#ffe6f0',
                hair: '#ffd700',
                eyes: '#8b4513',
                clothes: '#ff69b4',
                accent: '#ffb6c1',
                hat: '#ff69b4'
            },
            'cutie-kawaii': {
                skin: '#ffe6f0',
                hair: '#8b4513',
                eyes: '#4169e1',
                clothes: '#ff69b4',
                accent: '#da70d6',
                hat: '#ff69b4'
            },
            'cutie-princess': {
                skin: '#ffe6f0',
                hair: '#ffd700',
                eyes: '#4169e1',
                clothes: '#ff69b4',
                accent: '#ffd700',
                hat: '#ffd700'
            },
            'cutie-sporty': {
                skin: '#ffe6f0',
                hair: '#ff6347',
                eyes: '#2e8b57',
                clothes: '#da70d6',
                accent: '#ffffff',
                hat: '#da70d6'
            },
            'santa': {
                skin: '#ffdbac',
                hair: '#f0f0f0',
                eyes: '#4169e1',
                clothes: '#c41e3a',
                accent: '#ffffff',
                hat: '#c41e3a'
            },
            'elf': {
                skin: '#90ee90',
                hair: '#228b22',
                eyes: '#2c1810',
                clothes: '#00ff00',
                accent: '#c41e3a',
                hat: '#00ff00'
            },
            'snowman': {
                skin: '#ffffff',
                hair: '#ffffff',
                eyes: '#000000',
                clothes: '#4169e1',
                accent: '#ff6347',
                hat: '#1a1a1a'
            },
            'reindeer': {
                skin: '#8b4513',
                hair: '#654321',
                eyes: '#2c1810',
                clothes: '#8b4513',
                accent: '#c41e3a',
                hat: '#8b4513'
            }
        };

        const style = styles[character.id] || styles['babo-cool'];
        
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg-${character.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${character.style.primary};stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:${character.style.secondary};stop-opacity:0.3" />
                    </linearGradient>
                </defs>
                
                <!-- Background Circle -->
                <circle cx="100" cy="100" r="95" fill="url(#bg-${character.id})" />
                <circle cx="100" cy="100" r="95" fill="none" stroke="${character.style.accent}" stroke-width="3" opacity="0.5"/>
                
                <!-- Shadow -->
                <ellipse cx="100" cy="170" rx="40" ry="8" fill="rgba(0,0,0,0.2)" />
                
                <!-- Body -->
                <ellipse cx="100" cy="140" rx="35" ry="45" fill="${style.clothes}" />
                <path d="M 70 130 Q 100 145 130 130" stroke="${style.accent}" stroke-width="3" fill="none" />
                
                <!-- Arms -->
                <ellipse cx="65" cy="130" rx="12" ry="30" fill="${style.clothes}" transform="rotate(-20 65 130)" />
                <ellipse cx="135" cy="130" rx="12" ry="30" fill="${style.clothes}" transform="rotate(20 135 130)" />
                
                <!-- Head -->
                <circle cx="100" cy="90" r="35" fill="${style.skin}" />
                
                <!-- Hair/Hat -->
                ${this.getHatSVG(character.id, style)}
                
                <!-- Face -->
                ${this.getFaceSVG(character.id, style)}
                
                <!-- Neck -->
                <rect x="92" y="118" width="16" height="15" fill="${style.skin}" rx="3" />
            </svg>
        `)}`;
    },

    getHatSVG(id, style) {
        if (id === 'santa') {
            return `
                <path d="M 65 70 Q 100 55 135 70" fill="${style.hat}" />
                <ellipse cx="100" cy="70" rx="40" ry="8" fill="white" />
                <circle cx="135" cy="60" r="8" fill="white" />
            `;
        } else if (id.includes('cutie')) {
            return `
                <ellipse cx="80" cy="65" rx="12" ry="18" fill="${style.hat}" transform="rotate(-30 80 65)" />
                <ellipse cx="120" cy="65" rx="12" ry="18" fill="${style.hat}" transform="rotate(30 120 65)" />
                <circle cx="100" cy="68" r="8" fill="${style.accent}" />
            `;
        } else if (id === 'elf') {
            return `
                <path d="M 65 70 L 80 45 L 95 70 Z" fill="${style.hat}" />
                <path d="M 105 70 L 120 45 L 135 70 Z" fill="${style.hat}" />
                <circle cx="80" cy="45" r="5" fill="white" />
                <circle cx="120" cy="45" r="5" fill="white" />
            `;
        } else if (id === 'snowman') {
            return `
                <rect x="85" y="60" width="30" height="15" fill="${style.hat}" rx="2" />
                <rect x="75" y="72" width="50" height="5" fill="${style.hat}" />
            `;
        } else {
            return `
                <ellipse cx="100" cy="68" rx="38" ry="15" fill="${style.hat}" />
                <path d="M 100 68 Q 130 70 135 80" fill="${style.hat}" />
            `;
        }
    },

    getFaceSVG(id, style) {
        if (id === 'snowman') {
            return `
                <circle cx="88" cy="88" r="4" fill="${style.eyes}" />
                <circle cx="112" cy="88" r="4" fill="${style.eyes}" />
                <circle cx="100" cy="98" r="3" fill="${style.accent}" />
                <path d="M 85 105 Q 100 110 115 105" stroke="${style.eyes}" stroke-width="2" fill="none" stroke-linecap="round" />
            `;
        } else if (id.includes('cutie')) {
            return `
                <circle cx="88" cy="90" r="6" fill="${style.eyes}" />
                <circle cx="112" cy="90" r="6" fill="${style.eyes}" />
                <circle cx="85" cy="88" r="2" fill="white" />
                <circle cx="109" cy="88" r="2" fill="white" />
                <ellipse cx="78" cy="98" rx="8" ry="6" fill="#ffb6c1" opacity="0.5" />
                <ellipse cx="122" cy="98" rx="8" ry="6" fill="#ffb6c1" opacity="0.5" />
                <path d="M 90 105 Q 100 110 110 105" stroke="${style.clothes}" stroke-width="2" fill="none" stroke-linecap="round" />
            `;
        } else if (id.includes('babo') && (id.includes('cool') || id.includes('gamer'))) {
            return `
                <rect x="82" y="86" width="16" height="10" fill="${style.eyes}" rx="2" />
                <rect x="102" y="86" width="16" height="10" fill="${style.eyes}" rx="2" />
                <line x1="98" y1="91" x2="102" y2="91" stroke="${style.eyes}" stroke-width="2" />
                <path d="M 88 105 Q 95 107 100 107" stroke="${style.eyes}" stroke-width="2" fill="none" stroke-linecap="round" />
            `;
        } else {
            return `
                <circle cx="88" cy="90" r="4" fill="${style.eyes}" />
                <circle cx="112" cy="90" r="4" fill="${style.eyes}" />
                <circle cx="86" cy="88" r="2" fill="white" />
                <circle cx="110" cy="88" r="2" fill="white" />
                <path d="M 90 105 Q 100 110 110 105" stroke="${style.eyes}" stroke-width="2" fill="none" stroke-linecap="round" />
            `;
        }
    },

    /**
     * Verfügbare Charakter-Presets
     */
    characters: [
        // MÄNNLICHE CHARAKTERE (Babo Style)
        {
            id: 'babo-cool',
            name: 'Max der Coole',
            gender: 'babo',
            description: 'Cooler Typ mit Snapback und Style',
            imageUrl: 'avatars/babo-cool.svg',
            style: {
                primary: '#4169e1',
                secondary: '#1a1a1a',
                accent: '#ffd700'
            }
        },
        {
            id: 'babo-sporty',
            name: 'Leon der Sportliche',
            gender: 'babo',
            description: 'Sportlicher Typ mit Energie',
            imageUrl: 'avatars/babo-sporty.svg',
            style: {
                primary: '#c41e3a',
                secondary: '#1a1a1a',
                accent: '#ffffff'
            }
        },
        {
            id: 'babo-street',
            name: 'Jay der Streetstyle King',
            gender: 'babo',
            description: 'Urban Style mit Attitude',
            imageUrl: 'avatars/babo-street.svg',
            style: {
                primary: '#1a1a1a',
                secondary: '#ffd700',
                accent: '#c41e3a'
            }
        },
        {
            id: 'babo-gamer',
            name: 'Noah der Gamer',
            gender: 'babo',
            description: 'Gaming Pro mit Headset',
            imageUrl: 'avatars/babo-gamer.svg',
            style: {
                primary: '#667eea',
                secondary: '#1a1a1a',
                accent: '#00ff00'
            }
        },
        
        // WEIBLICHE CHARAKTERE (Cutie Style)
        {
            id: 'cutie-sweet',
            name: 'Mia die Süße',
            gender: 'cutie',
            description: 'Niedlich mit rosa Schleife',
            imageUrl: 'avatars/cutie-sweet.svg',
            style: {
                primary: '#ff69b4',
                secondary: '#ffb6c1',
                accent: '#ffffff'
            }
        },
        {
            id: 'cutie-kawaii',
            name: 'Emma die Kawaii',
            gender: 'cutie',
            description: 'Kawaii-Style mit großen Augen',
            imageUrl: 'avatars/cutie-kawaii.svg',
            style: {
                primary: '#ff69b4',
                secondary: '#da70d6',
                accent: '#fff'
            }
        },
        {
            id: 'cutie-princess',
            name: 'Sophie die Prinzessin',
            gender: 'cutie',
            description: 'Elegante Prinzessin',
            imageUrl: 'avatars/cutie-princess.svg',
            style: {
                primary: '#ff69b4',
                secondary: '#ffd700',
                accent: '#ffffff'
            }
        },
        {
            id: 'cutie-sporty',
            name: 'Lena die Aktive',
            gender: 'cutie',
            description: 'Sportlich und energiegeladen',
            imageUrl: 'avatars/cutie-sporty.svg',
            style: {
                primary: '#da70d6',
                secondary: '#ffffff',
                accent: '#ff69b4'
            }
        },
        
        // WEIHNACHTS-CHARAKTERE
        {
            id: 'santa',
            name: 'Santa Claus',
            gender: 'special',
            description: 'Der Weihnachtsmann himself',
            imageUrl: 'avatars/santa.svg',
            style: {
                primary: '#c41e3a',
                secondary: '#ffffff',
                accent: '#ffd700'
            }
        },
        {
            id: 'elf',
            name: 'Elfie der Helfer',
            gender: 'special',
            description: 'Weihnachtself mit Elfenohren',
            imageUrl: 'avatars/elf.svg',
            style: {
                primary: '#00ff00',
                secondary: '#c41e3a',
                accent: '#ffd700'
            }
        },
        {
            id: 'snowman',
            name: 'Frosty der Schneemann',
            gender: 'special',
            description: 'Freundlicher Schneemann',
            imageUrl: 'avatars/snowman.svg',
            style: {
                primary: '#ffffff',
                secondary: '#4169e1',
                accent: '#ff6347'
            }
        },
        {
            id: 'reindeer',
            name: 'Rudolf das Rentier',
            gender: 'special',
            description: 'Rudolf mit der roten Nase',
            imageUrl: 'avatars/reindeer.svg',
            style: {
                primary: '#8b4513',
                secondary: '#c41e3a',
                accent: '#ffd700'
            }
        }
    ],

    /**
     * Hole Charakter nach ID
     */
    getCharacterById(id) {
        const char = this.characters.find(char => char.id === id);
        if (char && !char.imageUrl) {
            char.imageUrl = this.generateAvatarSVG(char);
        }
        return char;
    },

    /**
     * Hole alle Charaktere nach Gender
     */
    getCharactersByGender(gender) {
        return this.characters.filter(char => char.gender === gender).map(char => {
            if (!char.imageUrl) {
                char.imageUrl = this.generateAvatarSVG(char);
            }
            return char;
        });
    },

    /**
     * Hole alle verfügbaren Charaktere
     */
    getAllCharacters() {
        return this.characters.map(char => {
            if (!char.imageUrl) {
                char.imageUrl = this.generateAvatarSVG(char);
            }
            return char;
        });
    },

    /**
     * Hole Charakter-Kategorien
     */
    getCategories() {
        return [
            {
                id: 'babo',
                name: 'Babo Style',
                icon: '💪',
                description: 'Coole und sportliche Jungs'
            },
            {
                id: 'cutie',
                name: 'Cutie Style',
                icon: '✨',
                description: 'Süße und niedliche Mädchen'
            },
            {
                id: 'special',
                name: 'Weihnachts-Special',
                icon: '🎅',
                description: 'Spezielle Weihnachtscharaktere'
            }
        ];
    },

    /**
     * Generiere zufälligen Charakter
     */
    getRandomCharacter(gender = null) {
        const pool = gender 
            ? this.getCharactersByGender(gender)
            : this.characters;
        
        return pool[Math.floor(Math.random() * pool.length)];
    },

    /**
     * Rendere Charakter-Avatar (mit Fallback)
     */
    renderCharacterAvatar(character, size = 200) {
        if (!character) return '';
        
        // Generiere Avatar wenn noch nicht vorhanden
        if (!character.imageUrl) {
            character.imageUrl = this.generateAvatarSVG(character);
        }

        return `
            <div class="character-avatar" style="width: ${size}px; height: ${size}px; position: relative;">
                <img 
                    src="${character.imageUrl}" 
                    alt="${character.name}"
                    style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.2);"
                />
                <div class="character-badge" style="
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    background: ${character.style.primary};
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                    ${character.name.split(' ')[0]}
                </div>
            </div>
        `;
    },

    /**
     * Rendere Charakter-Karte
     */
    renderCharacterCard(character) {
        return `
            <div class="character-card" data-character-id="${character.id}" style="
                background: linear-gradient(135deg, ${character.style.primary} 0%, ${character.style.secondary} 100%);
                border-radius: 20px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                position: relative;
                overflow: hidden;
            ">
                <div style="position: relative; z-index: 2;">
                    ${this.renderCharacterAvatar(character, 150)}
                    <h3 style="color: white; margin-top: 15px; text-align: center; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                        ${character.name}
                    </h3>
                    <p style="color: rgba(255,255,255,0.9); text-align: center; font-size: 14px; margin-top: 5px;">
                        ${character.description}
                    </p>
                </div>
                <div class="card-shine" style="
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                    transform: rotate(45deg);
                    pointer-events: none;
                "></div>
            </div>
        `;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarCharacters;
}
