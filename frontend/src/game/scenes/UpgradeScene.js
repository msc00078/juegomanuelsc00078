import * as Phaser from 'phaser';

export default class UpgradeScene extends Phaser.Scene {
    constructor() {
        super('UpgradeScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        this.add.rectangle(cx, H / 2, W, H, 0x080818);
        this.add.grid(cx, H/2, W, H, 64, 64, 0x111133, 1, 0x0a0a22, 1);
        this.add.text(cx, H * 0.08, "EL REFUGIO NEÓN", {
            fontSize: '36px', fill: '#00ffff', fontStyle: 'bold', stroke: '#000022', strokeThickness: 4
        }).setOrigin(0.5);
        this.add.text(cx, H * 0.16, "\"Madre Víscera opera sin anestesia.\nEl dolor es evolución.\"", {
            fontSize: '14px', fill: '#ff6688', align: 'center'
        }).setOrigin(0.5);

        let stats = JSON.parse(localStorage.getItem('metaStats')) || {
            crystals: 0, hpLevel: 0, dmgLevel: 0, speedLevel: 0
        };

        this.stats = stats;
        this.crystalsText = this.add.text(cx, H * 0.26, `Fragmentos de Núcleo: ${stats.crystals} 💎`, {
            fontSize: '22px', fill: '#ff00ff'
        }).setOrigin(0.5);
        this.add.text(cx, H * 0.32, "Los cristales son escasos. Explóralos en Eventos o con NPCs raros.", {
            fontSize: '12px', fill: '#888', align: 'center'
        }).setOrigin(0.5);

        // Coste elevado: la mejora meta es un privilegio, no un derecho
        this.createUpgradeRow(stats, H * 0.44, "Integridad Base (+10 HP)",  'hpLevel',    25, cx, W);
        this.createUpgradeRow(stats, H * 0.59, "Protocolo de Daño (+2)",   'dmgLevel',   35, cx, W);
        this.createUpgradeRow(stats, H * 0.74, "Overclock de Movimiento (+5%)",  'speedLevel', 50, cx, W);

        const backBtn = this.add.rectangle(cx, H * 0.89, 260, 50, 0x220033).setInteractive();
        backBtn.setStrokeStyle(2, 0x7700ff);
        this.add.text(cx, H * 0.89, "< Volver al Hangar", { fontSize: '20px', fill: '#aaaaff' }).setOrigin(0.5);
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
