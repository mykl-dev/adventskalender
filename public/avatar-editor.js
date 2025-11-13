/**
 * Avatar Editor Logic
 */

class AvatarEditor {
    constructor() {
        this.currentAvatar = avatarManager.getDefaultAvatar();
        this.currentUsername = '';
        this.currentGender = 'babo';
        this.avatarOptions = avatarManager.getAvatarOptions(this.currentGender);
        this.use3DRenderer = true; // Standard: 3D-Rendering aktiviert
        this.renderer3D = null;
        
        // Lade existierendes Profil falls vorhanden
        const existingProfile = avatarManager.getProfile();
        if (existingProfile) {
            this.currentAvatar = existingProfile.avatar;
            this.currentUsername = existingProfile.username;
            this.currentGender = existingProfile.avatar.gender || 'babo';
            this.avatarOptions = avatarManager.getAvatarOptions(this.currentGender);
        }
        
        this.init();
    }

    init() {
        this.setupScrollBehavior();
        this.renderOptions();
        this.updatePreview();
        this.setupEventListeners();
        this.updateCharCounter();
        
        // Setze Username wenn vorhanden
        const usernameInput = document.getElementById('usernameInput');
        if (this.currentUsername) {
            usernameInput.value = this.currentUsername;
        }
        
        // Setze Gender-Button
        this.updateGenderButtons();
    }
    
    /**
     * Setup Scroll-basiertes Verhalten für Avatar-Vorschau
     */
    setupScrollBehavior() {
        const previewSection = document.getElementById('avatarPreviewSection');
        
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const maxScroll = 300; // Ab wann maximale Verkleinerung erreicht ist
            
            // Berechne Skalierung (1.0 bis 0.5)
            const scale = Math.max(0.5, 1 - (scrollY / maxScroll) * 0.5);
            
            // Berechne Position (sticky ab oberen Drittel)
            if (scrollY > 50) {
                previewSection.style.position = 'sticky';
                previewSection.style.top = '2rem';
                previewSection.style.transform = `scale(${scale})`;
                previewSection.style.transformOrigin = 'top center';
            } else {
                previewSection.style.position = 'sticky';
                previewSection.style.top = '2rem';
                previewSection.style.transform = 'scale(1)';
            }
        });
    }
    
    /**
     * Update Gender-Button Status
     */
    updateGenderButtons() {
        document.querySelectorAll('.gender-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.gender === this.currentGender) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * Rendere alle Anpassungsoptionen
     */
    renderOptions() {
        // Kopfbedeckung
        this.renderOptionCategory('head', 'headOptions');
        
        // Gesicht
        this.renderOptionCategory('face', 'faceOptions');
        
        // Körper
        this.renderOptionCategory('body', 'bodyOptions');
        
        // Füße
        this.renderOptionCategory('feet', 'feetOptions');
    }

    /**
     * Rendere eine Kategorie von Optionen
     */
    renderOptionCategory(category, containerId) {
        const container = document.getElementById(containerId);
        const options = this.avatarOptions[category];
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.dataset.category = category;
            button.dataset.value = option.id;
            
            // Aktiv markieren wenn ausgewählt
            if (this.currentAvatar[category] === option.id) {
                button.classList.add('active');
            }
            
            button.innerHTML = `
                <span class="option-icon">${option.icon}</span>
                <span class="option-name">${option.name}</span>
            `;
            
            button.addEventListener('click', () => this.selectOption(category, option.id, button));
            container.appendChild(button);
        });
    }

    /**
     * Option auswählen
     */
    selectOption(category, value, button) {
        // Entferne active von allen Buttons dieser Kategorie
        const container = button.parentElement;
        container.querySelectorAll('.option-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Setze active auf geklickten Button
        button.classList.add('active');
        
        // Update Avatar
        this.currentAvatar[category] = value;
        this.updatePreview();
        
        // Animation
        button.classList.add('selected-animation');
        setTimeout(() => {
            button.classList.remove('selected-animation');
        }, 300);
    }

    /**
     * Update Avatar Vorschau
     */
    updatePreview() {
        const preview = document.getElementById('avatarPreview');
        
        // Versuche 3D-Rendering, fallback auf SVG
        if (typeof Avatar3DRenderer !== 'undefined' && this.use3DRenderer) {
            if (this.renderer3D) {
                this.renderer3D.stopAnimation();
            }
            this.renderer3D = avatarManager.renderAvatar3D('avatarPreview', this.currentAvatar, 200, true);
        } else {
            preview.innerHTML = avatarManager.renderAvatarSVG(this.currentAvatar, 200);
        }
        
        // Animation
        preview.classList.add('update-animation');
        setTimeout(() => {
            preview.classList.remove('update-animation');
        }, 300);
    }

    /**
     * Setup Event Listeners
     */
    setupEventListeners() {
        // Gender Selection
        document.querySelectorAll('.gender-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                this.switchGender(button.dataset.gender);
            });
        });
        
        // Username Input
        const usernameInput = document.getElementById('usernameInput');
        usernameInput.addEventListener('input', (e) => {
            this.currentUsername = e.target.value.trim();
            this.updateCharCounter();
            this.validateForm();
        });

        // Randomize Button
        document.getElementById('randomizeButton').addEventListener('click', () => {
            this.randomizeAvatar();
        });

        // Save Button
        document.getElementById('saveButton').addEventListener('click', () => {
            this.saveAvatar();
        });

        // Continue Button (Modal)
        document.getElementById('continueButton').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Enter-Taste im Username-Input
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.currentUsername.length >= 2) {
                this.saveAvatar();
            }
        });
    }
    
    /**
     * Wechsle Geschlecht
     */
    switchGender(gender) {
        if (this.currentGender === gender) return;
        
        this.currentGender = gender;
        this.currentAvatar.gender = gender;
        this.avatarOptions = avatarManager.getAvatarOptions(gender);
        
        // Setze Standard-Avatar-Teile für neues Geschlecht
        if (gender === 'babo') {
            this.currentAvatar.head = 'snapback';
            this.currentAvatar.face = 'cool-dude';
            this.currentAvatar.body = 'hoodie-black';
            this.currentAvatar.feet = 'sneakers-white';
        } else {
            this.currentAvatar.head = 'bow-pink';
            this.currentAvatar.face = 'kawaii';
            this.currentAvatar.body = 'dress-pink';
            this.currentAvatar.feet = 'ballet-shoes';
        }
        
        // Update UI
        this.updateGenderButtons();
        this.clearAndRerenderOptions();
        this.updatePreview();
        
        // Animation
        const previewCard = document.querySelector('.avatar-preview-card');
        previewCard.classList.add('gender-switch-animation');
        setTimeout(() => {
            previewCard.classList.remove('gender-switch-animation');
        }, 500);
    }
    
    /**
     * Lösche und rendere Optionen neu
     */
    clearAndRerenderOptions() {
        ['headOptions', 'faceOptions', 'bodyOptions', 'feetOptions'].forEach(id => {
            document.getElementById(id).innerHTML = '';
        });
        this.renderOptions();
    }

    /**
     * Update Zeichenzähler
     */
    updateCharCounter() {
        const counter = document.querySelector('.char-counter');
        const usernameInput = document.getElementById('usernameInput');
        counter.textContent = `${usernameInput.value.length}/20`;
    }

    /**
     * Validiere Formular
     */
    validateForm() {
        const saveButton = document.getElementById('saveButton');
        const isValid = this.currentUsername.length >= 2;
        
        saveButton.disabled = !isValid;
        
        if (isValid) {
            saveButton.classList.add('ready');
        } else {
            saveButton.classList.remove('ready');
        }
    }

    /**
     * Zufälligen Avatar generieren
     */
    randomizeAvatar() {
        // Zufällige Option für jede Kategorie (außer gender)
        Object.keys(this.avatarOptions).forEach(category => {
            const options = this.avatarOptions[category];
            const randomOption = options[Math.floor(Math.random() * options.length)];
            this.currentAvatar[category] = randomOption.id;
            
            // Update Button states
            const container = document.getElementById(`${category}Options`);
            if (container) {
                container.querySelectorAll('.option-button').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.value === randomOption.id) {
                        btn.classList.add('active');
                    }
                });
            }
        });
        
        this.updatePreview();
        
        // Shake animation für Randomize Button
        const randomizeBtn = document.getElementById('randomizeButton');
        randomizeBtn.classList.add('shake');
        setTimeout(() => {
            randomizeBtn.classList.remove('shake');
        }, 500);
    }

    /**
     * Avatar speichern
     */
    saveAvatar() {
        if (this.currentUsername.length < 2) {
            this.showError('Bitte gib einen Namen mit mindestens 2 Zeichen ein.');
            return;
        }

        const profile = {
            username: this.currentUsername,
            avatar: this.currentAvatar
        };

        const success = avatarManager.saveProfile(profile);
        
        if (success) {
            this.showSuccessModal();
        } else {
            this.showError('Fehler beim Speichern des Profils. Bitte versuche es erneut.');
        }
    }

    /**
     * Zeige Erfolgs-Modal
     */
    showSuccessModal() {
        const modal = document.getElementById('successModal');
        const finalPreview = document.getElementById('finalAvatarPreview');
        
        // Zeige Avatar im Modal
        finalPreview.innerHTML = `
            <div class="final-avatar-display">
                ${avatarManager.renderAvatarSVG(this.currentAvatar, 150)}
                <p class="final-username">${this.currentUsername}</p>
            </div>
        `;
        
        modal.classList.add('show');
        
        // Confetti Effect (optional)
        this.createConfetti();
    }

    /**
     * Konfetti-Effekt
     */
    createConfetti() {
        const colors = ['#c41e3a', '#2e7d32', '#ffd700', '#4169e1', '#fff'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
                confetti.style.animationDelay = (Math.random() * 0.5) + 's';
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 5000);
            }, i * 30);
        }
    }

    /**
     * Zeige Fehlermeldung
     */
    showError(message) {
        const usernameInput = document.getElementById('usernameInput');
        usernameInput.classList.add('error-shake');
        
        // Erstelle Fehlermeldung wenn nicht vorhanden
        let errorMsg = document.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            usernameInput.parentElement.appendChild(errorMsg);
        }
        
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
        
        setTimeout(() => {
            usernameInput.classList.remove('error-shake');
            errorMsg.classList.remove('show');
        }, 3000);
    }
}

// Initialisiere Editor wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    window.avatarEditor = new AvatarEditor();
});
