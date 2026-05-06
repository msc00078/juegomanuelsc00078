import * as Phaser from 'phaser';

export default class LevelUpScene extends Phaser.Scene {
    constructor() {
        super('LevelUpScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        // Fondo Oscurecido
        this.add.rectangle(cx, H / 2, W, H, 0x000000, 0.85);

        this.add.text(cx, H * 0.15, "NÚCLEO OPTIMIZADO", {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '48px', fill: '#00f2ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.22, "SELECCIONA UNA MEJORA DE HARDWARE", {
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px', fill: '#888', letterSpacing: 4
        }).setOrigin(0.5);

        const options = [
            { id: 'hp',    title: "VITALIDAD", desc: "Aumenta la integridad del chasis (+20 HP)", icon: "❤️", color: 0xff0055 },
            { id: 'dmg',   title: "POTENCIA",  desc: "Sobrecarga los sistemas de ataque (+3 Daño)", icon: "⚔️", color: 0xffcc00 },
            { id: 'speed', title: "AGILIDAD",  desc: "Optimiza los servomotores (+10% Vel.)", icon: "⚡", color: 0x00f2ff }
        ];

        const cardW = 220;
        const spacing = 30;
        const totalW = options.length * (cardW + spacing) - spacing;
        const startX = (W - totalW) / 2 + cardW / 2;

        options.forEach((opt, i) => {
            this.createOptionCard(startX + i * (cardW + spacing), H * 0.55, opt);
        });
    }

    createOptionCard(x, y, opt) {
        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 210, 280, 0x0a0a0a, 0.8).setInteractive();
        bg.setStrokeStyle(2, opt.color, 0.4);

        const icon = this.add.text(0, -80, opt.icon, { fontSize: '60px' }).setOrigin(0.5);
        const title = this.add.text(0, -10, opt.title, {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '22px', fill: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const desc = this.add.text(0, 60, opt.desc, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px', fill: '#aaa', align: 'center', wordWrap: { width: 180 }
        }).setOrigin(0.5);

        container.add([bg, icon, title, desc]);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x111111, 1);
            bg.setStrokeStyle(3, opt.color, 1);
            this.tweens.add({ targets: container, scale: 1.05, duration: 200 });
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x0a0a0a, 0.8);
            bg.setStrokeStyle(2, opt.color, 0.4);
            this.tweens.add({ targets: container, scale: 1, duration: 200 });
        });

        bg.on('pointerdown', () => {
            this.applyUpgrade(opt.id);
            this.scene.stop();
            this.scene.resume('MainScene');
        });
    }

    applyUpgrade(id) {
        if (id === 'hp') {
            const max = this.registry.get('playerMaxHp') + 20;
            this.registry.set('playerMaxHp', max);
            this.registry.set('playerHp', this.registry.get('playerHp') + 20);
        } else if (id === 'dmg') {
            this.registry.set('swordDamage', this.registry.get('swordDamage') + 3);
        } else if (id === 'speed') {
            this.registry.set('bonusSpeed', (this.registry.get('bonusSpeed') || 0) + 0.1);
        }
    }
}
