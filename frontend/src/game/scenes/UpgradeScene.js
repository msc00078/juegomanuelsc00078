import * as Phaser from 'phaser';

export default class UpgradeScene extends Phaser.Scene {
    constructor() {
        super('UpgradeScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        this.add.rectangle(cx, H / 2, W, H, 0x111111);
        this.add.text(cx, H * 0.11, "SANTUARIO DE MEJORAS", {
            fontSize: '40px', fill: '#00ffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        let stats = JSON.parse(localStorage.getItem('metaStats')) || {
            crystals: 0, hpLevel: 0, dmgLevel: 0, speedLevel: 0
        };

        this.stats = stats;
        this.crystalsText = this.add.text(cx, H * 0.20, `Cristales: ${stats.crystals} 💎`, {
            fontSize: '24px', fill: '#ff00ff'
        }).setOrigin(0.5);

        this.createUpgradeRow(stats, H * 0.35, "Vida Base (+10)",  'hpLevel',    10, cx, W);
        this.createUpgradeRow(stats, H * 0.52, "Daño Base (+2)",   'dmgLevel',   15, cx, W);
        this.createUpgradeRow(stats, H * 0.69, "Velocidad (+5%)",  'speedLevel', 20, cx, W);

        const backBtn = this.add.rectangle(cx, H * 0.86, 240, 55, 0x444444).setInteractive();
        this.add.text(cx, H * 0.86, "Volver al Menú", { fontSize: '22px', fill: '#fff' }).setOrigin(0.5);
        backBtn.on('pointerover', () => backBtn.setStrokeStyle(2, 0xffffff));
        backBtn.on('pointerout',  () => backBtn.setStrokeStyle(0));
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    createUpgradeRow(stats, y, label, key, costPerLevel, cx, W) {
        let level = stats[key] || 0;
        let cost  = (level + 1) * costPerLevel;

        this.add.text(cx - W * 0.25, y, `${label}\n(Nivel ${level})`, {
            fontSize: '20px', fill: '#fff'
        }).setOrigin(0, 0.5);

        const btn = this.add.rectangle(cx + W * 0.18, y, 260, 64, 0x333333).setInteractive();
        const btnTxt = this.add.text(cx + W * 0.18, y, `Mejorar (${cost} 💎)`, {
            fontSize: '18px', fill: '#fff'
        }).setOrigin(0.5);

        btn.on('pointerover', () => btn.setStrokeStyle(2, 0xffffff));
        btn.on('pointerout',  () => btn.setStrokeStyle(0));
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
