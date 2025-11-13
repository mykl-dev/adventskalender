/**
 * Vorgefertigte Avatar-Charaktere
 * Professionelle Anime/Comic-Style Avatare zur Auswahl
 */

const AvatarCharacters = {
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&style=circle&backgroundColor=b6e3f4&accessories=prescription02&top=shortHair&hairColor=brown&facialHair=blank&clothingGraphic=skull',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leon&style=circle&backgroundColor=ffdfbf&accessories=sunglasses&top=shortCurly&hairColor=black&clothingType=hoodie&clothingColor=red',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jay&style=circle&backgroundColor=c0aede&accessories=wayfarers&top=winterHat&hairColor=black&clothingType=graphicShirt&clothingGraphic=bear',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah&style=circle&backgroundColor=d1d4f9&accessories=prescription01&top=shortFlat&hairColor=blue&clothingType=collarSweater&clothingColor=black',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&style=circle&backgroundColor=ffd5dc&accessories=blank&top=longHair&hairColor=blonde&clothingType=overall&clothingColor=pink',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&style=circle&backgroundColor=ffdfbf&accessories=blank&top=longHairStraight&hairColor=brown&clothingType=graphicShirt&clothingGraphic=pizza',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&style=circle&backgroundColor=ffd5dc&accessories=blank&top=longHairCurly&hairColor=blonde&clothingType=blazer&clothingColor=pink',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lena&style=circle&backgroundColor=b6e3f4&accessories=blank&top=longHairStraight2&hairColor=auburn&clothingType=hoodie&clothingColor=heather',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Santa&style=circle&backgroundColor=c41e3a&accessories=blank&top=winterHat4&hairColor=gray&facialHair=beardMedium&facialHairColor=gray&clothingType=overall&clothingColor=red',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elfie&style=circle&backgroundColor=00ff00&accessories=blank&top=shortHairShaggy&hairColor=green&clothingType=hoodie&clothingColor=green',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frosty&style=circle&backgroundColor=ffffff&accessories=blank&top=winterHat1&hairColor=white&clothingType=overall&clothingColor=blue',
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
            imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rudolf&style=circle&backgroundColor=8b4513&accessories=blank&top=winterHat3&hairColor=brown&clothingType=graphicShirt&clothingGraphic=bear',
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
        return this.characters.find(char => char.id === id);
    },

    /**
     * Hole alle Charaktere nach Gender
     */
    getCharactersByGender(gender) {
        return this.characters.filter(char => char.gender === gender);
    },

    /**
     * Hole alle verfügbaren Charaktere
     */
    getAllCharacters() {
        return this.characters;
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

        return `
            <div class="character-avatar" style="width: ${size}px; height: ${size}px; position: relative;">
                <img 
                    src="${character.imageUrl}" 
                    alt="${character.name}"
                    style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.2);"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Ccircle cx=%22100%22 cy=%22100%22 r=%2280%22 fill=%22%23${character.style.primary.replace('#', '')}%22/%3E%3Ctext x=%22100%22 y=%22120%22 text-anchor=%22middle%22 font-size=%2260%22 fill=%22white%22%3E${character.name[0]}%3C/text%3E%3C/svg%3E'"
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
