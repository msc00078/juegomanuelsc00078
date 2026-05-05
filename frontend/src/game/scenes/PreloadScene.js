import * as Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Barra de carga
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(W / 2 - 160, H / 2 - 25, 320, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ffff, 1);
            progressBar.fillRect(W / 2 - 150, H / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            this.scene.start('MenuScene');
        });

        // CARGA DE ASSETS (Aquí irán tus sprites)
        // Ejemplo: this.load.image('player', 'assets/player.png');
        // Por ahora cargamos el hero.png que ya tienes
        this.load.image('hero', 'src/assets/hero.png'); 
        
        // Puedes añadir placeholders o generar los tuyos
        // this.load.image('enemy_standard', 'assets/enemy1.png');
        // this.load.image('boss_poeta', 'assets/boss_poeta.png');
    }
}
