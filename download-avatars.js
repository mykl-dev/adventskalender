/**
 * Script zum Herunterladen der Avatar-Bilder von DiceBear API
 * Führe dieses Script einmal aus: node download-avatars.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Zielverzeichnis für Avatare
const avatarDir = path.join(__dirname, 'public', 'avatars');

// Erstelle Verzeichnis falls nicht vorhanden
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

// Avatar-Definitionen - verwende einfachere API ohne komplexe Parameter
const avatars = [
    // BABO STYLE
    {
        id: 'babo-cool',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Max&backgroundColor=4169e1'
    },
    {
        id: 'babo-sporty',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Leon&backgroundColor=c41e3a'
    },
    {
        id: 'babo-street',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Jay&backgroundColor=1a1a1a'
    },
    {
        id: 'babo-gamer',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Noah&backgroundColor=667eea'
    },
    
    // CUTIE STYLE
    {
        id: 'cutie-sweet',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mia&backgroundColor=ff69b4'
    },
    {
        id: 'cutie-kawaii',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Emma&backgroundColor=ff69b4'
    },
    {
        id: 'cutie-princess',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sophie&backgroundColor=ffd700'
    },
    {
        id: 'cutie-sporty',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Lena&backgroundColor=da70d6'
    },
    
    // WEIHNACHTS-SPECIAL
    {
        id: 'santa',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Santa&backgroundColor=c41e3a'
    },
    {
        id: 'elf',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Elfie&backgroundColor=00ff00'
    },
    {
        id: 'snowman',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Frosty&backgroundColor=4169e1'
    },
    {
        id: 'reindeer',
        url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Rudolf&backgroundColor=8b4513'
    }
];

// Funktion zum Herunterladen eines Avatars
function downloadAvatar(avatar) {
    return new Promise((resolve, reject) => {
        const filename = `${avatar.id}.svg`;
        const filepath = path.join(avatarDir, filename);
        
        console.log(`Downloading ${avatar.id}...`);
        
        https.get(avatar.url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${avatar.id}: ${response.statusCode}`));
                return;
            }
            
            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✓ Saved ${filename}`);
                resolve();
            });
            
            fileStream.on('error', (err) => {
                fs.unlink(filepath, () => {});
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Download alle Avatare
async function downloadAllAvatars() {
    console.log('Starting avatar download...\n');
    
    for (const avatar of avatars) {
        try {
            await downloadAvatar(avatar);
        } catch (error) {
            console.error(`✗ Error downloading ${avatar.id}:`, error.message);
        }
    }
    
    console.log('\n✓ All avatars downloaded successfully!');
    console.log(`Saved to: ${avatarDir}`);
}

// Starte Download
downloadAllAvatars();
