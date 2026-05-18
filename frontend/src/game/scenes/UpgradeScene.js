import * as Phaser from 'phaser';
import { getCrystals, spendCrystals } from '../supabase';

export default class UpgradeScene extends Phaser.Scene {
    constructor() {
        super('UpgradeScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x050505, 0x050505, 0x0a0a1a, 0x0a0a1a, 1);
        bg.fillRect(0, 0, W, H);

        this.add.grid(cx, H/2, W, H, 64, 64, 0x00f2ff, 0.03, 0x00f2ff, 0.05);

        this.add.text(cx, H * 0.10, "EL REFUGIO NEÓN", {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '48px', fill: '#00f2ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.18, "\"Madre Víscera opera sin anestesia. El dolor es evolución.\"", {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px', fill: '#ff00e1', fontStyle: 'italic'
        }).setOrigin(0.5);

        let stats = JSON.parse(localStorage.getItem('metaStats:v1') || localStorage.getItem('metaStats')) || {
            crystals: 0, hpLevel: 0, dmgLevel: 0, speedLevel: 0
        };

        this.stats = stats;

        const crystalPanel = this.add.graphics();
        crystalPanel.fillStyle(0x000000, 0.6);
        crystalPanel.fillRoundedRect(cx - 200, H * 0.23, 400, 50, 10);
        crystalPanel.lineStyle(1, 0xffcc00, 0.5);
        crystalPanel.strokeRoundedRect(cx - 200, H * 0.23, 400, 50, 10);

        this.crystalsText = this.add.text(cx, H * 0.265, `FRAGMENTOS DE NÚCLEO: ${stats.crystals} 💎`, {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '20px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Guardar referencias para actualización sin restart
        this._rowRefs = [];

        this._rowRefs.push(this.createUpgradeRow(stats, H * 0.44, "INTEGRIDAD BASE", "+10 HP", 'hpLevel', 25, cx));
        this._rowRefs.push(this.createUpgradeRow(stats, H * 0.59, "PROTOCOLOS DE ATAQUE", "+2 DAÑO", 'dmgLevel', 35, cx));
        this._rowRefs.push(this.createUpgradeRow(stats, H * 0.74, "OVERCLOCK MOTOR", "+5% VELOCIDAD", 'speedLevel', 50, cx));

        const backBtnContainer = this.add.container(cx, H * 0.90);
        const backBg = this.add.rectangle(0, 0, 280, 50, 0x00f2ff, 0.1).setInteractive();
        backBg.setStrokeStyle(1, 0x00f2ff, 0.5);
        const backText = this.add.text(0, 0, "< VOLVER AL HANGAR", {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '16px', fill: '#00f2ff', fontStyle: 'bold'
        }).setOrigin(0.5);
        backBtnContainer.add([backBg, backText]);

        backBg.on('pointerover', () => {
            backBg.setFillStyle(0x00f2ff, 0.2);
            this.tweens.add({ targets: backBtnContainer, scaleX: 1.05, scaleY: 1.05, duration: 200 });
        });
        backBg.on('pointerout', () => {
            backBg.setFillStyle(0x00f2ff, 0.1);
            this.tweens.add({ targets: backBtnContainer, scaleX: 1, scaleY: 1, duration: 200 });
        });
        backBg.on('pointerdown', () => this.scene.start('MenuScene'));

        // Sincronizar con Supabase (asíncrono, no bloquea)
        getCrystals().then(supabaseCrystals => {
            if (supabaseCrystals !== null && supabaseCrystals > stats.crystals) {
                stats.crystals = supabaseCrystals;
                localStorage.setItem('metaStats:v1', JSON.stringify(stats));
                this._refreshDisplay();
            }
        });
    }

    _refreshDisplay() {
        this.crystalsText.setText(`FRAGMENTOS DE NÚCLEO: ${this.stats.crystals} 💎`);
        this._rowRefs.forEach(ref => {
            const level = this.stats[ref.key] || 0;
            const cost = (level + 1) * ref.costPerLevel;
            ref.levelTxt.setText(`${ref.effect} // NIVEL ${level}`);
            ref.btnTxt.setText(`MEJORAR (${cost} 💎)`);
        });
    }

    createUpgradeRow(stats, y, label, effect, key, costPerLevel, cx) {
        let level = stats[key] || 0;
        let cost  = (level + 1) * costPerLevel;

        const rowBg = this.add.graphics();
        rowBg.fillStyle(0x000000, 0.4);
        rowBg.fillRoundedRect(cx - 350, y - 35, 700, 70, 8);
        rowBg.lineStyle(1, 0x333333, 1);
        rowBg.strokeRoundedRect(cx - 350, y - 35, 700, 70, 8);

        this.add.text(cx - 330, y - 10, label, {
            fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fill: '#fff', fontStyle: 'bold'
        });
        const levelTxt = this.add.text(cx - 330, y + 12, `${effect} // NIVEL ${level}`, {
            fontFamily: 'Inter, sans-serif', fontSize: '12px', fill: '#888'
        });

        const btn = this.add.container(cx + 200, y);
        const btnBg = this.add.rectangle(0, 0, 240, 44, 0x00f2ff, 0.15).setInteractive();
        btnBg.setStrokeStyle(1, 0x00f2ff, 0.4);
        const btnTxt = this.add.text(0, 0, `MEJORAR (${cost} 💎)`, {
            fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fill: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);
        btn.add([btnBg, btnTxt]);

        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0x00f2ff, 0.3);
            btnBg.setStrokeStyle(1, 0x00f2ff, 1);
        });
        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x00f2ff, 0.15);
            btnBg.setStrokeStyle(1, 0x00f2ff, 0.4);
        });

        btnBg.on('pointerdown', () => {
            const currentLevel = stats[key] || 0;
            const currentCost = (currentLevel + 1) * costPerLevel;
            if (stats.crystals >= currentCost) {
                stats.crystals -= currentCost;
                stats[key]++;
                localStorage.setItem('metaStats:v1', JSON.stringify(stats));
                spendCrystals(currentCost).catch(() => {});
                this._refreshDisplay();
            } else {
                this.cameras.main.shake(200, 0.01);
                const errTxt = this.add.text(cx + 200, y - 40, "RECURSOS INSUFICIENTES", {
                    fontFamily: 'Inter, sans-serif', fontSize: '10px', fill: '#ff0000'
                }).setOrigin(0.5);
                this.time.delayedCall(2000, () => errTxt.destroy());
            }
        });

        return { key, effect, costPerLevel, levelTxt, btnTxt };
    }
}
