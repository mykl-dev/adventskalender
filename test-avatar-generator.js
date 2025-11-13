/**
 * Test-Script für den Avatar-Generator
 * Generiert Test-Avatare und speichert sie als SVG-Dateien
 */

import * as avatarGenerator from './avatarGenerator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test-Verzeichnis erstellen
const testDir = path.join(__dirname, 'test-avatars');
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
}

console.log('🎨 Avatar Generator Test\n');
console.log('Generiere Avatare mit DiceBear...\n');

// Teste alle Charaktere
const characterIds = Object.keys(avatarGenerator.avatarConfigs);
let successCount = 0;
let errorCount = 0;

for (const characterId of characterIds) {
    try {
        const svg = avatarGenerator.generateAvatar(characterId);
        const filepath = path.join(testDir, `${characterId}.svg`);
        fs.writeFileSync(filepath, svg);
        console.log(`✅ ${characterId.padEnd(20)} - Erfolgreich generiert (${svg.length} Bytes)`);
        successCount++;
    } catch (error) {
        console.error(`❌ ${characterId.padEnd(20)} - Fehler: ${error.message}`);
        errorCount++;
    }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Erfolgreich: ${successCount}`);
console.log(`❌ Fehler: ${errorCount}`);
console.log(`📁 Test-Avatare gespeichert in: ${testDir}`);
console.log('='.repeat(60));
