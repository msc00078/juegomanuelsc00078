import * as Phaser from 'phaser';
import { getLeaderboard } from '../supabase';
import { isAdmin } from '../admin';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this._startingGame = false;

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

        this.add.text(this.scale.width / 2, this.scale.height * 0.35, "Simulación Crítica v3.0.0 // Tú no deberías existir.", { 
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
            if (this._startingGame) return;
            this._startingGame = true;
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
            this.registry.set('currentMusicKey', null); // Reset de música para que MainScene la inicie de cero
            
            // Detener la música del menú global (React)
            if (window.stopMenuMusic) window.stopMenuMusic();
            
            this.scene.start('MainScene');
        });

        // Mostrar Leaderboard (Izquierda) — estilo Auth.jsx
        const panelW = 340;
        const panelX = 20;
        const panelY = 40;
        const panelPad = 16;
        const rowH2 = 38;
        const panelH = 56 + (10 * rowH2) + 16; // header + 10 filas + padding
        const leaderPanel = this.add.graphics();
        leaderPanel.fillStyle(0x0a0a0f, 0.7);
        leaderPanel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
        leaderPanel.lineStyle(2, 0xff00e1, 0.2);
        leaderPanel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

        this.add.text(panelX + panelPad, panelY + 16, "RANKING GLOBAL", {
            fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fill: '#ff00e1', fontStyle: 'bold'
        });
        this.add.text(panelX + panelW - panelPad, panelY + 16, "📡 LIVE", {
            fontFamily: 'Inter, sans-serif', fontSize: '12px', fill: '#00f2ff', fontStyle: 'bold'
        }).setOrigin(1, 0);

        const statusText = this.add.text(panelX + panelPad, panelY + 60, "Cargando datos del Núcleo...", {
            fontFamily: 'Inter, sans-serif', fontSize: '14px', fill: '#666'
        });

        getLeaderboard().then(({ data, error }) => {
            if (statusText) statusText.destroy();
            if (error || !data || data.length === 0) {
                this.add.text(panelX + panelPad, panelY + 60, "Aún no hay registros en la simulación.", {
                    fontFamily: 'Inter, sans-serif', fontSize: '14px', fill: '#666'
                });
                return;
            }
            data.slice(0, 10).forEach((player, index) => {
                const rowY = panelY + 56 + (index * rowH2);
                const isFirst = index === 0;

                const rowGfx = this.add.graphics();
                const rowColor = isFirst ? 0xffd700 : 0xffffff;
                rowGfx.fillStyle(0xffffff, isFirst ? 0.05 : 0.02);
                rowGfx.fillRoundedRect(panelX + 4, rowY, panelW - 8, rowH2 - 4, 6);
                if (isFirst) {
                    rowGfx.lineStyle(1, 0xffd700, 0.3);
                    rowGfx.strokeRoundedRect(panelX + 4, rowY, panelW - 8, rowH2 - 4, 6);
                }

                const rankX = panelX + panelPad;
                const nameX = rankX + 40;
                const scoreX = panelX + panelW - panelPad - 80;
                const sectorX = panelX + panelW - panelPad - 5;

                const rankTxt = this.add.text(rankX, rowY + 5, isFirst ? '👑' : `#${index + 1}`, {
                    fontFamily: 'Orbitron, sans-serif', fontSize: isFirst ? '18px' : '14px', fill: isFirst ? '#ffcc00' : '#555', fontStyle: 'bold'
                });

                const name = player.username || 'Sujeto Anónimo';
                const nameTxt = this.add.text(nameX, rowY + 5, name, {
                    fontFamily: 'Inter, sans-serif', fontSize: '14px', fill: '#eee'
                });
                if (nameTxt.width > 140) {
                    nameTxt.setText(name.substring(0, 16) + '...');
                }

                this.add.text(scoreX, rowY + 5, `${(player.high_score || 0).toLocaleString()} PTS`, {
                    fontFamily: 'Inter, sans-serif', fontSize: '13px', fill: '#00f2ff', fontStyle: 'bold'
                }).setOrigin(1, 0);

                this.add.text(sectorX, rowY + 5, `S.${player.max_sector || 1}`, {
                    fontFamily: 'Orbitron, sans-serif', fontSize: '12px', fill: '#ff00e1', fontStyle: 'bold'
                }).setOrigin(1, 0);
            });
        });

        // Mostrar Controles (Derecha) — estilo 2 columnas mejorado
        const cmdPanelH = 40 + (6 * rowH2) + 24;
        const rightPanelX = this.scale.width - panelW - 30;
        const controlPanel = this.add.graphics();
        controlPanel.fillStyle(0x0a0a0f, 0.7);
        controlPanel.fillRoundedRect(rightPanelX, panelY, panelW, cmdPanelH, 12);
        controlPanel.lineStyle(2, 0x00f2ff, 0.2);
        controlPanel.strokeRoundedRect(rightPanelX, panelY, panelW, cmdPanelH, 12);

        this.add.text(rightPanelX + panelPad, panelY + 16, "COMANDOS", {
            fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fill: '#00f2ff', fontStyle: 'bold'
        });

        const controlGroups = [
            [
                ['WASD  🎮', 'Moverse'],
                ['SPACE  ⚔️', 'Atacar'],
                ['SHIFT  ⚡', 'Dash'],
            ],
            [
                ['1-3  🎒', 'Armas'],
                ['I/TAB  📜', 'Inventario'],
                ['ESC/P  ⏸️', 'Pausa'],
            ]
        ];

        let cRowY = panelY + 52;
        controlGroups.forEach((group, gi) => {
            if (gi > 0) {
                const sepY = cRowY - 2;
                this.add.graphics()
                    .lineStyle(1, 0xffffff, 0.05)
                    .lineBetween(rightPanelX + panelPad, sepY, rightPanelX + panelW - panelPad, sepY);
            }
            group.forEach(([key, action], i) => {
                const rowY = cRowY + (i * rowH2);

                const rowGfx = this.add.graphics();
                rowGfx.fillStyle(0xffffff, 0.02);
                rowGfx.fillRoundedRect(rightPanelX + 4, rowY, panelW - 8, rowH2 - 4, 6);

                this.add.text(rightPanelX + panelPad, rowY + 5, key, {
                    fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fill: '#00f2ff', fontStyle: 'bold'
                });
                this.add.text(rightPanelX + panelW - panelPad, rowY + 5, action, {
                    fontFamily: 'Inter, sans-serif', fontSize: '13px', fill: '#aaa'
                }).setOrigin(1, 0);
            });
            cRowY += group.length * rowH2 + 10;
        });

        this.add.text(this.scale.width / 2, this.scale.height * 0.94, "NÉMESIS SAGRADA // CONECTADO AL NÚCLEO", { 
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px', 
            fill: '#444', 
            letterSpacing: 4 
        }).setOrigin(0.5);

        // Botón de Silenciar (esquina inferior derecha)
        const muteContainer = this.add.container(this.scale.width - 20, this.scale.height - 20).setDepth(200);
        const muteBtnBg = this.add.rectangle(0, 0, 100, 36, 0x000000, 0.4)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x555555);
        const muteBtn = this.add.text(0, 0,
            window.isMuted ? '🔇 MUTE' : '🔊 SONIDO',
            { fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fill: '#555' }
        ).setOrigin(0.5);
        muteContainer.add([muteBtnBg, muteBtn]);

        muteBtnBg.on('pointerover', () => { muteBtn.setFill('#00f2ff'); muteBtnBg.setStrokeStyle(1, 0x00f2ff); });
        muteBtnBg.on('pointerout', () => { muteBtn.setFill('#555'); muteBtnBg.setStrokeStyle(1, 0x555555); });
        muteBtnBg.on('pointerdown', () => {
            const muted = window.toggleMute ? window.toggleMute() : false;
            muteBtn.setText(muted ? '🔇 MUTE' : '🔊 SONIDO');
            if (this.sound) this.sound.setMute(muted);
        });

        // Botón DEV (solo admin)
        const user = window.__phaserUser;
        if (isAdmin(user)) {
            const devBtn = this.add.text(20, this.scale.height - 20, '[DEV]', {
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '14px',
                fill: '#333',
                padding: { x: 8, y: 5 }
            }).setOrigin(0, 1).setInteractive({ useHandCursor: true }).setDepth(200);

            devBtn.on('pointerover', () => devBtn.setFill('#00f2ff'));
            devBtn.on('pointerout', () => devBtn.setFill('#333'));
            devBtn.on('pointerdown', () => {
                this.registry.set('user', user);
                this.scene.start('AdminScene');
            });
        }
    }
}
