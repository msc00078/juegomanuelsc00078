import * as Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        // Fondo de carga
        this.add.rectangle(cx, cy, W, H, 0x050505);

        // Texto de carga
        const loadingText = this.add.text(cx, cy - 50, "INICIALIZANDO NÚCLEO...", {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '24px', fill: '#00f2ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Barra de carga premium
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x111111, 1);
        progressBox.fillRoundedRect(cx - 150, cy - 10, 300, 20, 10);
        progressBox.lineStyle(2, 0x00f2ff, 0.3);
        progressBox.strokeRoundedRect(cx - 150, cy - 10, 300, 20, 10);

        const progressBar = this.add.graphics();

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00f2ff, 1);
            progressBar.fillRoundedRect(cx - 145, cy - 5, 290 * value, 10, 5);
        });

        this.load.on('complete', () => {
            this.scene.start('MenuScene');
        });

        // CARGA DE ASSETS
        this.load.image('hero', 'src/assets/hero.png'); 
        
        // Audio In-Game
        this.load.audio('game_track1', 'assets/audio/game_track1.mp3'); // Data Run
        this.load.audio('game_track2', 'assets/audio/game_track2.mp3'); // Glitch Sector
        this.load.audio('game_boss', 'assets/audio/game_boss.mp3');     // Boss/Elite
    }
}
