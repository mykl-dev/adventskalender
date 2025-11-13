/**
 * Server-seitiger Avatar Generator mit DiceBear
 * Generiert SVG-Avatare zur Laufzeit
 */

import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

// Avatar-Konfigurationen für jeden Charakter
const avatarConfigs = {
    // BABO STYLE - Coole, maskuline Charaktere
    'babo-cool': {
        seed: 'Max-Cool-Style',
        backgroundColor: ['4169e1'],
        eyes: ['variant01', 'variant02', 'variant03'],
        eyebrows: ['variant01', 'variant02'],
        mouth: ['variant01', 'variant02', 'variant03'],
        hairColor: ['2c1810', '4a312c', '724133'],
        skinColor: ['f5d7b1', 'ead9c2']
    },
    'babo-sporty': {
        seed: 'Leon-Sporty-Babo',
        backgroundColor: ['c41e3a'],
        eyes: ['variant04', 'variant05'],
        eyebrows: ['variant03', 'variant04'],
        mouth: ['variant04', 'variant05'],
        hairColor: ['2c1810', '3b2718'],
        skinColor: ['d5aa6f', 'c68642']
    },
    'babo-street': {
        seed: 'Jay-Street-Swag',
        backgroundColor: ['1a1a1a'],
        eyes: ['variant06', 'variant07'],
        eyebrows: ['variant05', 'variant06'],
        mouth: ['variant06', 'variant07'],
        hairColor: ['000000', '2c1810'],
        skinColor: ['a56b46', '8d5524']
    },
    'babo-gamer': {
        seed: 'Noah-Gaming-Pro',
        backgroundColor: ['667eea'],
        eyes: ['variant08', 'variant09'],
        eyebrows: ['variant07', 'variant08'],
        mouth: ['variant08', 'variant09'],
        hairColor: ['6a4e42', '8b6f47'],
        skinColor: ['fce5cd', 'fad4b2']
    },
    
    // CUTIE STYLE - Süße, feminine Charaktere
    'cutie-sweet': {
        seed: 'Mia-Sweet-Girl',
        backgroundColor: ['ff69b4'],
        eyes: ['variant10', 'variant11'],
        eyebrows: ['variant09', 'variant10'],
        mouth: ['variant10', 'variant11'],
        hairColor: ['f59797', 'f0b5b3'],
        skinColor: ['ffe6f0', 'ffd6e8']
    },
    'cutie-kawaii': {
        seed: 'Emma-Kawaii-Chan',
        backgroundColor: ['ff69b4'],
        eyes: ['variant12', 'variant13'],
        eyebrows: ['variant11', 'variant12'],
        mouth: ['variant12', 'variant13'],
        hairColor: ['da70d6', 'ee82ee'],
        skinColor: ['ffe6f0', 'ffd6e8']
    },
    'cutie-princess': {
        seed: 'Sophie-Princess',
        backgroundColor: ['ffd700'],
        eyes: ['variant14', 'variant15'],
        eyebrows: ['variant13', 'variant14'],
        mouth: ['variant14', 'variant15'],
        hairColor: ['ffd700', 'f4d03f'],
        skinColor: ['ffe6f0', 'ffd6e8']
    },
    'cutie-sporty': {
        seed: 'Lena-Sporty-Girl',
        backgroundColor: ['da70d6'],
        eyes: ['variant16', 'variant17'],
        eyebrows: ['variant15', 'variant16'],
        mouth: ['variant16', 'variant17'],
        hairColor: ['ff6347', 'ff7f50'],
        skinColor: ['ffe6f0', 'ffd6e8']
    },
    
    // WEIHNACHTS-SPECIAL
    'santa': {
        seed: 'Santa-Claus-Ho-Ho',
        backgroundColor: ['c41e3a'],
        eyes: ['variant18', 'variant19'],
        eyebrows: ['variant17', 'variant18'],
        mouth: ['variant18', 'variant19'],
        hairColor: ['f0f0f0', 'ffffff'],
        skinColor: ['ffdbac', 'f5d7b1']
    },
    'elf': {
        seed: 'Elfie-Helper-Xmas',
        backgroundColor: ['00ff00'],
        eyes: ['variant20', 'variant21'],
        eyebrows: ['variant19', 'variant20'],
        mouth: ['variant20', 'variant21'],
        hairColor: ['228b22', '32cd32'],
        skinColor: ['90ee90', 'b4f5b4']
    },
    'snowman': {
        seed: 'Frosty-Snow-Man',
        backgroundColor: ['4169e1'],
        eyes: ['variant22', 'variant23'],
        eyebrows: ['variant21', 'variant22'],
        mouth: ['variant22', 'variant23'],
        hairColor: ['ffffff', 'f0f0f0'],
        skinColor: ['ffffff', 'f8f8ff']
    },
    'reindeer': {
        seed: 'Rudolf-Red-Nose',
        backgroundColor: ['8b4513'],
        eyes: ['variant24', 'variant25'],
        eyebrows: ['variant23', 'variant24'],
        mouth: ['variant24', 'variant25'],
        hairColor: ['8b4513', 'a0522d'],
        skinColor: ['d2b48c', 'c19a6b']
    }
};

/**
 * Generiert einen Avatar-SVG-String für einen Charakter
 * @param {string} characterId - Die ID des Charakters (z.B. 'babo-cool')
 * @returns {string} SVG-String des Avatars
 */
function generateAvatar(characterId) {
    const config = avatarConfigs[characterId];
    
    if (!config) {
        throw new Error(`Unknown character ID: ${characterId}`);
    }
    
    const avatar = createAvatar(adventurer, config);
    return avatar.toString();
}

/**
 * Generiert alle Avatare und gibt sie als Objekt zurück
 * @returns {Object} Objekt mit characterId als Key und SVG-String als Value
 */
function generateAllAvatars() {
    const avatars = {};
    
    for (const characterId of Object.keys(avatarConfigs)) {
        avatars[characterId] = generateAvatar(characterId);
    }
    
    return avatars;
}

/**
 * Generiert einen Avatar als Data-URL (für direkte Verwendung in img src)
 * @param {string} characterId - Die ID des Charakters
 * @returns {string} Data-URL des Avatars
 */
function generateAvatarDataUrl(characterId) {
    const svg = generateAvatar(characterId);
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

export {
    generateAvatar,
    generateAllAvatars,
    generateAvatarDataUrl,
    avatarConfigs
};
