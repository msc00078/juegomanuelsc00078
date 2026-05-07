import * as Phaser from 'phaser';
import { getLeaderboard } from '../supabase';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Iniciar/Asegurar música de menú global
        if (window.playMenuMusic) window.playMenuMusic();

        // Fondo Profundo con Gradiente
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x050505, 0x050505, 0x111111, 0x111111, 1);
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        // Rejilla Dinámica (Grid)
        const grid = this.add.grid(this.scale.width / 2, this.scale.height / 2, this.scale.width * 1.5, this.scale.height * 1.5, 64, 64, 0x00f2ff, 0.03, 0x00f2ff, 0.05);
        this.tweens.add({
            targets: grid,
            alpha: { from: 0.02, to: 0.06 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });

        // Efecto de Scanline
        const scanline = this.add.rectangle(this.scale.width / 2, -100, this.scale.width, 100, 0x00f2ff, 0.05);
        this.tweens.add({
            targets: scanline,
            y: this.scale.height + 100,
            duration: 4000,
            repeat: -1
        });

        // TÍTULO CON GLITCH
        const title = this.add.text(this.scale.width / 2, this.scale.height * 0.22, "NEÓN SAGRADO", { 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '84px', 
            fill: '#fff', 
            fontStyle: 'bold', 
            stroke: '#ff00e1', 
            strokeThickness: 2 
        }).setOrigin(0.5);
        
        // Sombra de glitch
        const titleShadow = this.add.text(this.scale.width / 2 + 3, this.scale.height * 0.22 + 2, "NEÓN SAGRADO", { 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '84px', 
            fill: '#00f2ff', 
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.5).setDepth(-1);

        this.tweens.add({
            targets: titleShadow,
            x: '+=2',
            y: '+=1',
            duration: 50,
            yoyo: true,
            repeat: -1
        });

        this.add.text(this.scale.width / 2, this.scale.height * 0.35, "Simulación Crítica v2.3.0 // Tú no deberías existir.", { 
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px', 
            fill: '#00f2ff',
            letterSpacing: 2
        }).setOrigin(0.5);

        // BOTÓN JUGAR (Glassmorphism)
        const playBtnContainer = this.add.container(this.scale.width / 2, this.scale.height * 0.52);
        const playBg = this.add.rectangle(0, 0, 320, 80, 0x00f2ff, 0.1).setInteractive();
        playBg.setStrokeStyle(2, 0x00f2ff, 0.5);
        const playText = this.add.text(0, 0, "INICIAR PURGA", { 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '32px', 
            fill: '#fff', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);
        playBtnContainer.add([playBg, playText]);

        // BOTÓN UPGRADES
        const upgradeBtnContainer = this.add.container(this.scale.width / 2, this.scale.height * 0.68);
        const upgradeBg = this.add.rectangle(0, 0, 320, 80, 0xff00e1, 0.1).setInteractive();
        upgradeBg.setStrokeStyle(2, 0xff00e1, 0.5);
        const upgradeText = this.add.text(0, 0, "EL REFUGIO", { 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '28px', 
            fill: '#fff', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);
        upgradeBtnContainer.add([upgradeBg, upgradeText]);

        // Interacciones
        playBg.on('pointerover', () => {
            playBg.setFillStyle(0x00f2ff, 0.3);
            playBg.setStrokeStyle(2, 0x00f2ff, 1);
            this.tweens.add({ targets: playBtnContainer, scaleX: 1.05, scaleY: 1.05, duration: 200 });
        });
        playBg.on('pointerout', () => {
            playBg.setFillStyle(0x00f2ff, 0.1);
            playBg.setStrokeStyle(2, 0x00f2ff, 0.5);
            this.tweens.add({ targets: playBtnContainer, scaleX: 1, scaleY: 1, duration: 200 });
        });
        
        upgradeBg.on('pointerover', () => {
            upgradeBg.setFillStyle(0xff00e1, 0.3);
            upgradeBg.setStrokeStyle(2, 0xff00e1, 1);
            this.tweens.add({ targets: upgradeBtnContainer, scaleX: 1.05, scaleY: 1.05, duration: 200 });
        });
        upgradeBg.on('pointerout', () => {
            upgradeBg.setFillStyle(0xff00e1, 0.1);
            upgradeBg.setStrokeStyle(2, 0xff00e1, 0.5);
            this.tweens.add({ targets: upgradeBtnContainer, scaleX: 1, scaleY: 1, duration: 200 });
        });
        upgradeBg.on('pointerdown', () => this.scene.start('UpgradeScene'));



        // Selector de Personalidad del Boss
        const personalities = ['poeta', 'logico', 'glitch'];
        let currentPersonality = personalities.indexOf(window.gamePersonality || 'poeta');
        if (currentPersonality === -1) currentPersonality = 0;
        window.gamePersonality = personalities[currentPersonality];

        const personalityText = this.add.text(this.scale.width / 2, this.scale.height * 0.85, `[ ENTE IA: ${personalities[currentPersonality].toUpperCase()} ]`, { 
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px', 
            fill: '#ffcc00', 
            fontStyle: 'bold',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        personalityText.on('pointerdown', () => {
            currentPersonality = (currentPersonality + 1) % personalities.length;
            window.gamePersonality = personalities[currentPersonality];
            personalityText.setText(`[ ENTE IA: ${personalities[currentPersonality].toUpperCase()} ]`);
        });
        personalityText.on('pointerover', () => personalityText.setFill('#ffffff'));
        personalityText.on('pointerout', () => personalityText.setFill('#ffcc00'));

        playBg.on('pointerdown', () => {
            let savedMeta = JSON.parse(localStorage.getItem('metaStats')) || {};
            let meta = {
                hpLevel: savedMeta.hpLevel || 0,
                dmgLevel: savedMeta.dmgLevel || 0,
                speedLevel: savedMeta.speedLevel || 0
            };
            
            // Reiniciar estado global con bonos (Nerfeados según petición)
            this.registry.set('currentLevel', 1);
            this.registry.set('gold', 0);
            this.registry.set('score', 0);
            this.registry.set('playerHp', 100 + (meta.hpLevel * 5));
            this.registry.set('playerMaxHp', 100 + (meta.hpLevel * 5));
            this.registry.set('swordDamage', 10 + (meta.dmgLevel * 1));
            this.registry.set('bonusSpeed', meta.speedLevel * 0.02); // +2% por nivel (antes 5%)
            
            this.registry.set('hasBow', false);
            this.registry.set('hasBombs', false);
            this.registry.set('equippedWeapon', 1);
            this.registry.set('relics', []);
            
            this.registry.set('runXp', 0);
            this.registry.set('runLevel', 1);
            this.registry.set('xpToNext', 100); // Mundo hostil: XP difícil de ganar
            this.registry.set('combo', 0);
            this.registry.set('maxCombo', 0);
            
            this.registry.set('nextNodeType', 'combat'); // Empezar con combate
            
            // Detener la música del menú global (React)
            if (window.stopMenuMusic) window.stopMenuMusic();
            
            this.scene.start('MainScene');
        });

        // Mostrar Leaderboard (Izquierda)
        const leaderPanel = this.add.graphics();
        leaderPanel.fillStyle(0x000000, 0.4);
        leaderPanel.fillRoundedRect(30, 40, 260, 240, 12);
        leaderPanel.lineStyle(1, 0xff00e1, 0.3);
        leaderPanel.strokeRoundedRect(30, 40, 260, 240, 12);

        this.add.text(45, 55, "LEADERBOARD", { 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '20px', 
            fill: '#ff00e1', 
            fontStyle: 'bold' 
        });
        
        getLeaderboard().then(({ data, error }) => {
            if (!error && data) {
                let yPos = 95;
                data.slice(0, 5).forEach((player, index) => {
                    let color = index === 0 ? '#ffcc00' : '#ffffff';
                    this.add.text(45, yPos, `${index + 1}. ${player.username || 'Anon'}`, { 
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '15px', 
                        fill: color 
                    });
                    this.add.text(280, yPos, `${player.high_score}`, { 
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '15px', 
                        fill: '#00f2ff' 
                    }).setOrigin(1, 0);
                    yPos += 32;
                });
            }
        });

        // Mostrar Controles (Derecha)
        const rightX = this.scale.width - 30;
        const controlPanel = this.add.graphics();
        controlPanel.fillStyle(0x000000, 0.4);
        controlPanel.fillRoundedRect(this.scale.width - 290, 40, 260, 240, 12);
        controlPanel.lineStyle(1, 0x00f2ff, 0.3);
        controlPanel.strokeRoundedRect(this.scale.width - 290, 40, 260, 240, 12);

        this.add.text(rightX - 10, 55, "COMANDOS", { 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '20px', 
            fill: '#00f2ff', 
            fontStyle: 'bold' 
        }).setOrigin(1, 0);
        
        const controls = [
            "WASD / 🕹️ : Moverse",
            "SPACE / ⚔️ : Atacar",
            "SHIFT / ⚡ : Dash",
            "1, 2, 3 / 🎒 : Armas",
            "I - TAB / 📜 : Inv.",
            "ESC - P / ⏸️ : Pausa"
        ];
        
        let cy = 95;
        controls.forEach(ctrl => {
            this.add.text(rightX - 10, cy, ctrl, { 
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px', 
                fill: '#888' 
            }).setOrigin(1, 0);
            cy += 28;
        });

        this.add.text(this.scale.width / 2, this.scale.height * 0.94, "NÉMESIS SAGRADA // CONECTADO AL NÚCLEO", { 
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px', 
            fill: '#444', 
            letterSpacing: 4 
        }).setOrigin(0.5);

        // Botón de Silenciar (esquina inferior derecha)
        const muteBtn = this.add.text(
            this.scale.width - 20, 
            this.scale.height - 20, 
            window.isMuted ? '🔇 MUTE' : '🔊 SONIDO',
            {
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '14px',
                fill: '#555',
                backgroundColor: 'rgba(0,0,0,0.4)',
                padding: { x: 8, y: 5 }
            }
        ).setOrigin(1, 1).setInteractive({ useHandCursor: true }).setDepth(200);

        muteBtn.on('pointerover', () => muteBtn.setFill('#00f2ff'));
        muteBtn.on('pointerout', () => muteBtn.setFill('#555'));
        muteBtn.on('pointerdown', () => {
            const muted = window.toggleMute ? window.toggleMute() : false;
            muteBtn.setText(muted ? '🔇 MUTE' : '🔊 SONIDO');
        });
    }
}
