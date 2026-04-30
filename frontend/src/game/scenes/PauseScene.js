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

        // Fondo semi-transparente
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.65);

        this.add.rectangle(cx, cy, 320, 380, 0x222222).setStrokeStyle(4, 0xffffff);

        this.add.text(cx, cy - 140, "PAUSA", {
            fontSize: '44px', fill: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.createButton(cx, cy - 50,  "RESUMIR",        0x0077ff, () => this.resume());
        this.createButton(cx, cy + 30,  "REINTENTAR",     0xaa0000, () => this.restart());
        this.createButton(cx, cy + 110, "MENÚ PRINCIPAL", 0x555555, () => this.goToMenu());

        this.input.keyboard.on('keydown-ESC', () => this.resume());
        this.input.keyboard.on('keydown-P',   () => this.resume());
    }

    createButton(x, y, label, color, callback) {
        const btn = this.add.rectangle(x, y, 240, 55, color).setInteractive();
        this.add.text(x, y, label, { fontSize: '20px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        btn.on('pointerover', () => btn.setStrokeStyle(3, 0xffffff));
        btn.on('pointerout',  () => btn.setStrokeStyle(0));
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
