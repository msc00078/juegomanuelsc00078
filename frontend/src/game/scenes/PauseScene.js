import * as Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        // Fondo semi-transparente oscurecido
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.75);

        // Panel de Pausa (Glassmorphism)
        const panel = this.add.container(cx, cy);
        const bg = this.add.rectangle(0, 0, 360, 420, 0x050505, 0.9);
        bg.setStrokeStyle(2, 0x00f2ff, 0.4);
        
        const title = this.add.text(0, -150, "SIMULACIÓN EN PAUSA", {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '24px', fill: '#00f2ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        panel.add([bg, title]);

        this.createButton(panel, 0, -50,  "RESUMIR",        0x00f2ff, () => this.resume());
        this.createButton(panel, 0, 40,   "REINTENTAR",     0xff00e1, () => this.restart());
        this.createButton(panel, 0, 130,  "SALIR AL MENÚ", 0x333333, () => this.goToMenu());

        // Botón Silenciar (debajo de los otros)
        const muteLabelInicial = window.isMuted ? '🔇  ACTIVAR SONIDO' : '🔊  SILENCIAR';
        const muteColor = 0xffaa00;
        const muteBtnBg = this.add.rectangle(0, 215, 280, 60, muteColor, 0.1).setInteractive();
        muteBtnBg.setStrokeStyle(1, muteColor, 0.5);
        const muteBtnTxt = this.add.text(0, 215, muteLabelInicial, {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '16px', fill: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);
        panel.add([muteBtnBg, muteBtnTxt]);

        muteBtnBg.on('pointerover', () => { muteBtnBg.setFillStyle(muteColor, 0.3); muteBtnBg.setStrokeStyle(1, muteColor, 1); });
        muteBtnBg.on('pointerout',  () => { muteBtnBg.setFillStyle(muteColor, 0.1); muteBtnBg.setStrokeStyle(1, muteColor, 0.5); });
        muteBtnBg.on('pointerdown', () => {
            const muted = window.toggleMute ? window.toggleMute() : false;
            muteBtnTxt.setText(muted ? '🔇  ACTIVAR SONIDO' : '🔊  SILENCIAR');
            // Silenciar también la música in-game de Phaser
            const mainScene = this.scene.get('MainScene');
            if (mainScene && mainScene.sound) {
                mainScene.sound.setMute(muted);
            }
        });

        // Aumentar tamaño del panel para que quepa el nuevo botón
        bg.height = 530;

        // Scanline decorativa
        const line = this.add.rectangle(0, -bg.height/2, bg.width, 2, 0x00f2ff, 0.2);
        panel.add(line);
        this.tweens.add({
            targets: line,
            y: bg.height/2,
            duration: 3000,
            repeat: -1
        });

        this.input.keyboard.on('keydown-ESC', () => this.resume());
        this.input.keyboard.on('keydown-P',   () => this.resume());
    }

    createButton(container, x, y, label, color, callback) {
        const btnBg = this.add.rectangle(x, y, 280, 60, color, 0.1).setInteractive();
        btnBg.setStrokeStyle(1, color, 0.5);
        
        const btnTxt = this.add.text(x, y, label, { 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '18px', fill: '#fff', fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        container.add([btnBg, btnTxt]);

        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(color, 0.3);
            btnBg.setStrokeStyle(1, color, 1);
            this.tweens.add({ targets: btnBg, scaleX: 1.05, duration: 100 });
        });
        
        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(color, 0.1);
            btnBg.setStrokeStyle(1, color, 0.5);
            this.tweens.add({ targets: btnBg, scaleX: 1, duration: 100 });
        });

        btnBg.on('pointerdown', () => callback());
    }

    resume() {
        this.scene.stop();
        this.scene.resume('MainScene');
    }

    restart() {
        this.scene.stop('MainScene');
        this.scene.stop();
        this.scene.start('MainScene');
    }

    goToMenu() {
        this.scene.stop('MainScene');
        this.scene.stop();
        this.scene.start('MenuScene');
    }
}
