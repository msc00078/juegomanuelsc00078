import * as Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        // Fondo semi-transparente
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6);
        
        const panel = this.add.rectangle(400, 300, 300, 350, 0x222222).setStrokeStyle(4, 0xffffff);
        
        this.add.text(400, 180, "PAUSA", { fontSize: '42px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        const resumeBtn = this.createButton(400, 280, "RESUMIR", 0x0077ff, () => this.resume());
        const restartBtn = this.createButton(400, 350, "REINTENTAR", 0xaa0000, () => this.restart());
        const menuBtn = this.createButton(400, 420, "MENÚ PRINCIPAL", 0x555555, () => this.goToMenu());

        // Tecla ESC para volver
        this.input.keyboard.on('keydown-ESC', () => this.resume());
        this.input.keyboard.on('keydown-P', () => this.resume());
    }

    createButton(x, y, label, color, callback) {
        const btn = this.add.rectangle(x, y, 220, 50, color).setInteractive();
        this.add.text(x, y, label, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        
        btn.on('pointerover', () => btn.setStrokeStyle(3, 0xffffff));
        btn.on('pointerout', () => btn.setStrokeStyle(0));
        btn.on('pointerdown', () => callback());
        return btn;
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
