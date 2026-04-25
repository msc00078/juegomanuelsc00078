import * as Phaser from 'phaser';

export default class UpgradeScene extends Phaser.Scene {
    constructor() {
        super('UpgradeScene');
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x111111);
        this.add.text(400, 80, "SANTUARIO DE MEJORAS", { fontSize: '40px', fill: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5);

        let stats = JSON.parse(localStorage.getItem('metaStats')) || {
            crystals: 0,
            hpLevel: 0,
            dmgLevel: 0,
            speedLevel: 0
        };

        this.crystalsText = this.add.text(400, 140, `Cristales: ${stats.crystals}`, { fontSize: '24px', fill: '#ff00ff' }).setOrigin(0.5);

        // HP Upgrade
        this.createUpgradeRow(stats, 220, "Vida Base (+10)", 'hpLevel', 10);
        
        // DMG Upgrade
        this.createUpgradeRow(stats, 320, "Daño Base (+2)", 'dmgLevel', 15);

        // Speed Upgrade
        this.createUpgradeRow(stats, 420, "Velocidad (+5%)", 'speedLevel', 20);

        // Volver
        const backBtn = this.add.rectangle(400, 530, 200, 50, 0x444444).setInteractive();
        this.add.text(400, 530, "Volver al Menú", { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    createUpgradeRow(stats, y, label, key, costPerLevel) {
        let level = stats[key] || 0;
        let cost = (level + 1) * costPerLevel;

        this.add.text(150, y, `${label}\n(Nivel ${level})`, { fontSize: '20px', fill: '#fff' }).setOrigin(0, 0.5);
        
        const btn = this.add.rectangle(600, y, 250, 60, 0x333333).setInteractive();
        const btnTxt = this.add.text(600, y, `Mejorar (${cost} 💎)`, { fontSize: '18px', fill: '#fff' }).setOrigin(0.5);

        btn.on('pointerover', () => btn.setStrokeStyle(2, 0xffffff));
        btn.on('pointerout', () => btn.setStrokeStyle(0));

        btn.on('pointerdown', () => {
            if (stats.crystals >= cost) {
                stats.crystals -= cost;
                stats[key]++;
                localStorage.setItem('metaStats', JSON.stringify(stats));
                this.scene.restart();
            } else {
                this.cameras.main.shake(200, 0.01);
            }
        });
    }
}
