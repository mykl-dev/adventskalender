/**
 * Avatar Editor Konfiguration
 * Definiert verfügbare Styles und Anpassungsoptionen mit Freischaltungs-System
 */

const AvatarEditorConfig = {
    // Verfügbare Avatar-Styles
    styles: {
        adventurer: {
            id: 'adventurer',
            name: 'Adventurer',
            description: 'Comic-Style Abenteurer',
            preview: '/api/avatar-preview/adventurer',
            unlockScore: 0 // Immer verfügbar
        },
        avataaars: {
            id: 'avataaars',
            name: 'Avataaars',
            description: 'Klassischer Avatar-Style',
            preview: '/api/avatar-preview/avataaars',
            unlockScore: 0 // Immer verfügbar
        },
        'adventurer-neutral': {
            id: 'adventurer-neutral',
            name: 'Adventurer Neutral',
            description: 'Gender-neutral Adventurer',
            preview: '/api/avatar-preview/adventurer-neutral',
            unlockScore: 50 // Freischaltung bei 50 Punkten
        },
        'avataaars-neutral': {
            id: 'avataaars-neutral',
            name: 'Avataaars Neutral',
            description: 'Gender-neutral Avataaars',
            preview: '/api/avatar-preview/avataaars-neutral',
            unlockScore: 50 // Freischaltung bei 50 Punkten
        }
    },

    // Anpassungsoptionen für jeden Style
    customizationOptions: {
        // ADVENTURER STYLE
        adventurer: {
            // Basis-Optionen (immer verfügbar)
            basic: {
                eyes: {
                    label: 'Augen',
                    unlockScore: 0,
                    options: [
                        { value: 'variant01', label: 'Standard', preview: '👁️' },
                        { value: 'variant02', label: 'Glücklich', preview: '😊' },
                        { value: 'variant03', label: 'Fokussiert', preview: '😐' },
                        { value: 'variant04', label: 'Überrascht', preview: '😲' },
                        { value: 'variant05', label: 'Müde', preview: '😴' },
                        { value: 'variant06', label: 'Zwinkern', preview: '😉' },
                        { value: 'variant07', label: 'Verliebt', preview: '😍' },
                        { value: 'variant08', label: 'Skeptisch', preview: '🤨' }
                    ]
                },
                mouth: {
                    label: 'Mund',
                    unlockScore: 0,
                    options: [
                        { value: 'variant01', label: 'Lächeln', preview: '😊' },
                        { value: 'variant02', label: 'Grinsen', preview: '😁' },
                        { value: 'variant03', label: 'Neutral', preview: '😐' },
                        { value: 'variant04', label: 'Schmollmund', preview: '😗' },
                        { value: 'variant05', label: 'Breit Lächeln', preview: '😃' },
                        { value: 'variant06', label: 'Zähne zeigen', preview: '😬' }
                    ]
                },
                hair: {
                    label: 'Frisur',
                    unlockScore: 0,
                    options: [
                        { value: 'short01', label: 'Kurz 1', preview: '💇' },
                        { value: 'short02', label: 'Kurz 2', preview: '💇' },
                        { value: 'short03', label: 'Kurz 3', preview: '💇' },
                        { value: 'long01', label: 'Lang 1', preview: '💇‍♀️' },
                        { value: 'long02', label: 'Lang 2', preview: '💇‍♀️' },
                        { value: 'long03', label: 'Lang 3', preview: '💇‍♀️' }
                    ]
                },
                hairColor: {
                    label: 'Haarfarbe',
                    unlockScore: 0,
                    options: [
                        { value: '0e0e0e', label: 'Schwarz', color: '#0e0e0e' },
                        { value: '562306', label: 'Dunkelbraun', color: '#562306' },
                        { value: '6a4e35', label: 'Braun', color: '#6a4e35' },
                        { value: 'ac6511', label: 'Hellbraun', color: '#ac6511' },
                        { value: 'b9a05f', label: 'Blond', color: '#b9a05f' },
                        { value: 'e5d7a3', label: 'Hellblond', color: '#e5d7a3' },
                        { value: 'afafaf', label: 'Grau', color: '#afafaf' },
                        { value: 'ab2a18', label: 'Rot', color: '#ab2a18' }
                    ]
                },
                skinColor: {
                    label: 'Hautfarbe',
                    unlockScore: 0,
                    options: [
                        { value: 'f2d3b1', label: 'Hell', color: '#f2d3b1' },
                        { value: 'ecad80', label: 'Mittel', color: '#ecad80' },
                        { value: '9e5622', label: 'Dunkel', color: '#9e5622' },
                        { value: '763900', label: 'Sehr Dunkel', color: '#763900' }
                    ]
                },
                eyebrows: {
                    label: 'Augenbrauen',
                    unlockScore: 0,
                    options: [
                        { value: 'variant01', label: 'Standard' },
                        { value: 'variant02', label: 'Dick' },
                        { value: 'variant03', label: 'Dünn' },
                        { value: 'variant04', label: 'Buschig' },
                        { value: 'variant05', label: 'Elegant' }
                    ]
                }
            },
            // Fortgeschrittene Optionen (freischaltbar)
            advanced: {
                glasses: {
                    label: 'Brille',
                    unlockScore: 100,
                    options: [
                        { value: '', label: 'Keine' },
                        { value: 'variant01', label: 'Rund' },
                        { value: 'variant02', label: 'Eckig' },
                        { value: 'variant03', label: 'Sonnenbrille' },
                        { value: 'variant04', label: 'Nerd-Brille' },
                        { value: 'variant05', label: 'Cat-Eye' }
                    ]
                },
                earrings: {
                    label: 'Ohrringe',
                    unlockScore: 150,
                    options: [
                        { value: '', label: 'Keine' },
                        { value: 'variant01', label: 'Stecker' },
                        { value: 'variant02', label: 'Creolen' },
                        { value: 'variant03', label: 'Hängend' },
                        { value: 'variant04', label: 'Perlen' }
                    ]
                },
                features: {
                    label: 'Besonderheiten',
                    unlockScore: 200,
                    options: [
                        { value: '', label: 'Keine' },
                        { value: 'birthmark', label: 'Muttermal' },
                        { value: 'blush', label: 'Rouge' },
                        { value: 'freckles', label: 'Sommersprossen' },
                        { value: 'mustache', label: 'Schnurrbart' }
                    ]
                }
            }
        },

        // AVATAAARS STYLE
        avataaars: {
            basic: {
                eyes: {
                    label: 'Augen',
                    unlockScore: 0,
                    options: [
                        { value: 'default', label: 'Standard', preview: '👁️' },
                        { value: 'happy', label: 'Glücklich', preview: '😊' },
                        { value: 'squint', label: 'Zusammengekniffen', preview: '😆' },
                        { value: 'wink', label: 'Zwinkern', preview: '😉' },
                        { value: 'hearts', label: 'Herz-Augen', preview: '😍' },
                        { value: 'surprised', label: 'Überrascht', preview: '😲' },
                        { value: 'cry', label: 'Weinend', preview: '😢' },
                        { value: 'closed', label: 'Geschlossen', preview: '😌' }
                    ]
                },
                mouth: {
                    label: 'Mund',
                    unlockScore: 0,
                    options: [
                        { value: 'default', label: 'Standard', preview: '😊' },
                        { value: 'smile', label: 'Lächeln', preview: '😃' },
                        { value: 'twinkle', label: 'Strahlen', preview: '✨' },
                        { value: 'serious', label: 'Ernst', preview: '😐' },
                        { value: 'tongue', label: 'Zunge raus', preview: '😛' },
                        { value: 'grimace', label: 'Grimasse', preview: '😬' }
                    ]
                },
                top: {
                    label: 'Frisur',
                    unlockScore: 0,
                    options: [
                        { value: 'shortHair', label: 'Kurzhaar' },
                        { value: 'longHair', label: 'Langhaar' },
                        { value: 'bob', label: 'Bob' },
                        { value: 'bun', label: 'Dutt' },
                        { value: 'curly', label: 'Lockig' },
                        { value: 'hat', label: 'Mit Hut' }
                    ]
                },
                hairColor: {
                    label: 'Haarfarbe',
                    unlockScore: 0,
                    options: [
                        { value: '2c1b18', label: 'Schwarz', color: '#2c1b18' },
                        { value: '4a312c', label: 'Dunkelbraun', color: '#4a312c' },
                        { value: '724133', label: 'Braun', color: '#724133' },
                        { value: 'b58143', label: 'Hellbraun', color: '#b58143' },
                        { value: 'd6b370', label: 'Blond', color: '#d6b370' },
                        { value: 'f59797', label: 'Rosa', color: '#f59797' },
                        { value: 'c93305', label: 'Rot', color: '#c93305' }
                    ]
                },
                skinColor: {
                    label: 'Hautfarbe',
                    unlockScore: 0,
                    options: [
                        { value: 'ffdbb4', label: 'Hell', color: '#ffdbb4' },
                        { value: 'edb98a', label: 'Mittel', color: '#edb98a' },
                        { value: 'fd9841', label: 'Gebräunt', color: '#fd9841' },
                        { value: 'd08b5b', label: 'Dunkel', color: '#d08b5b' },
                        { value: 'ae5d29', label: 'Sehr Dunkel', color: '#ae5d29' }
                    ]
                },
                eyebrows: {
                    label: 'Augenbrauen',
                    unlockScore: 0,
                    options: [
                        { value: 'default', label: 'Standard' },
                        { value: 'angry', label: 'Wütend' },
                        { value: 'raisedExcited', label: 'Aufgeregt' },
                        { value: 'sadConcerned', label: 'Besorgt' },
                        { value: 'flatNatural', label: 'Flach' }
                    ]
                }
            },
            advanced: {
                accessories: {
                    label: 'Accessoires',
                    unlockScore: 100,
                    options: [
                        { value: '', label: 'Keine' },
                        { value: 'round', label: 'Runde Brille' },
                        { value: 'sunglasses', label: 'Sonnenbrille' },
                        { value: 'wayfarers', label: 'Wayfarers' },
                        { value: 'prescription01', label: 'Lesebrille' },
                        { value: 'kurt', label: 'Kurt-Style' }
                    ]
                },
                facialHair: {
                    label: 'Gesichtsbehaarung',
                    unlockScore: 150,
                    options: [
                        { value: '', label: 'Keine' },
                        { value: 'beardLight', label: 'Leichter Bart' },
                        { value: 'beardMedium', label: 'Mittelbart' },
                        { value: 'beardMajestic', label: 'Voller Bart' },
                        { value: 'moustacheFancy', label: 'Schnurrbart Fancy' },
                        { value: 'moustacheMagnum', label: 'Magnum Bart' }
                    ]
                },
                clothing: {
                    label: 'Kleidung',
                    unlockScore: 200,
                    options: [
                        { value: 'hoodie', label: 'Hoodie' },
                        { value: 'blazerAndShirt', label: 'Blazer' },
                        { value: 'graphicShirt', label: 'T-Shirt' },
                        { value: 'overall', label: 'Overall' },
                        { value: 'shirtCrewNeck', label: 'Crew-Neck' }
                    ]
                }
            }
        },

        // NEUTRAL STYLES - Vereinfachte Versionen
        'adventurer-neutral': {
            basic: {
                eyes: {
                    label: 'Augen',
                    unlockScore: 0,
                    options: [
                        { value: 'variant01', label: 'Standard', preview: '👁️' },
                        { value: 'variant02', label: 'Glücklich', preview: '😊' },
                        { value: 'variant03', label: 'Fokussiert', preview: '😐' },
                        { value: 'variant04', label: 'Überrascht', preview: '😲' }
                    ]
                },
                mouth: {
                    label: 'Mund',
                    unlockScore: 0,
                    options: [
                        { value: 'variant01', label: 'Lächeln', preview: '😊' },
                        { value: 'variant02', label: 'Grinsen', preview: '😁' },
                        { value: 'variant03', label: 'Neutral', preview: '😐' }
                    ]
                },
                hair: {
                    label: 'Frisur',
                    unlockScore: 0,
                    options: [
                        { value: 'short01', label: 'Kurz 1' },
                        { value: 'short02', label: 'Kurz 2' },
                        { value: 'long01', label: 'Lang 1' }
                    ]
                },
                hairColor: {
                    label: 'Haarfarbe',
                    unlockScore: 0,
                    options: [
                        { value: '0e0e0e', label: 'Schwarz', color: '#0e0e0e' },
                        { value: '562306', label: 'Braun', color: '#562306' },
                        { value: 'b9a05f', label: 'Blond', color: '#b9a05f' }
                    ]
                },
                skinColor: {
                    label: 'Hautfarbe',
                    unlockScore: 0,
                    options: [
                        { value: 'f2d3b1', label: 'Hell', color: '#f2d3b1' },
                        { value: 'ecad80', label: 'Mittel', color: '#ecad80' },
                        { value: '9e5622', label: 'Dunkel', color: '#9e5622' }
                    ]
                }
            },
            advanced: {
                glasses: {
                    label: 'Brille',
                    unlockScore: 100,
                    options: [
                        { value: '', label: 'Keine' },
                        { value: 'variant01', label: 'Rund' },
                        { value: 'variant02', label: 'Eckig' }
                    ]
                }
            }
        },
        'avataaars-neutral': {
            basic: {
                eyes: {
                    label: 'Augen',
                    unlockScore: 0,
                    options: [
                        { value: 'default', label: 'Standard', preview: '👁️' },
                        { value: 'happy', label: 'Glücklich', preview: '😊' },
                        { value: 'wink', label: 'Zwinkern', preview: '😉' }
                    ]
                },
                mouth: {
                    label: 'Mund',
                    unlockScore: 0,
                    options: [
                        { value: 'default', label: 'Standard', preview: '😊' },
                        { value: 'smile', label: 'Lächeln', preview: '😃' },
                        { value: 'serious', label: 'Ernst', preview: '😐' }
                    ]
                },
                top: {
                    label: 'Frisur',
                    unlockScore: 0,
                    options: [
                        { value: 'shortHair', label: 'Kurzhaar' },
                        { value: 'longHair', label: 'Langhaar' },
                        { value: 'hat', label: 'Mit Hut' }
                    ]
                },
                hairColor: {
                    label: 'Haarfarbe',
                    unlockScore: 0,
                    options: [
                        { value: '2c1b18', label: 'Schwarz', color: '#2c1b18' },
                        { value: '724133', label: 'Braun', color: '#724133' },
                        { value: 'd6b370', label: 'Blond', color: '#d6b370' }
                    ]
                },
                skinColor: {
                    label: 'Hautfarbe',
                    unlockScore: 0,
                    options: [
                        { value: 'ffdbb4', label: 'Hell', color: '#ffdbb4' },
                        { value: 'edb98a', label: 'Mittel', color: '#edb98a' },
                        { value: 'd08b5b', label: 'Dunkel', color: '#d08b5b' }
                    ]
                }
            },
            advanced: {
                accessories: {
                    label: 'Accessoires',
                    unlockScore: 100,
                    options: [
                        { value: '', label: 'Keine' },
                        { value: 'round', label: 'Runde Brille' },
                        { value: 'sunglasses', label: 'Sonnenbrille' }
                    ]
                }
            }
        }
    },

    /**
     * Prüft ob eine Option freigeschaltet ist
     */
    isUnlocked(score, unlockScore) {
        return score >= unlockScore;
    },

    /**
     * Hole alle verfügbaren Styles basierend auf Score
     */
    getAvailableStyles(userScore) {
        return Object.values(this.styles).filter(style => 
            this.isUnlocked(userScore, style.unlockScore)
        );
    },

    /**
     * Hole alle Anpassungsoptionen für einen Style basierend auf Score
     */
    getAvailableOptions(styleId, userScore) {
        const styleConfig = this.customizationOptions[styleId];
        if (!styleConfig) return { basic: {}, advanced: {} };

        const available = { basic: {}, advanced: {} };

        // Basis-Optionen prüfen
        if (styleConfig.basic) {
            for (const [key, option] of Object.entries(styleConfig.basic)) {
                if (this.isUnlocked(userScore, option.unlockScore)) {
                    available.basic[key] = option;
                }
            }
        }

        // Fortgeschrittene Optionen prüfen
        if (styleConfig.advanced) {
            for (const [key, option] of Object.entries(styleConfig.advanced)) {
                if (this.isUnlocked(userScore, option.unlockScore)) {
                    available.advanced[key] = option;
                }
            }
        }

        return available;
    },

    /**
     * Hole nächste freischaltbare Features
     */
    getNextUnlocks(styleId, userScore) {
        const styleConfig = this.customizationOptions[styleId];
        if (!styleConfig) return [];

        const locked = [];

        // Alle Optionen durchgehen
        const allOptions = { 
            ...(styleConfig.basic || {}), 
            ...(styleConfig.advanced || {}) 
        };
        for (const [key, option] of Object.entries(allOptions)) {
            if (!this.isUnlocked(userScore, option.unlockScore)) {
                locked.push({
                    key,
                    label: option.label,
                    unlockScore: option.unlockScore,
                    pointsNeeded: option.unlockScore - userScore
                });
            }
        }

        // Sortiere nach benötigten Punkten
        return locked.sort((a, b) => a.pointsNeeded - b.pointsNeeded);
    }
};
