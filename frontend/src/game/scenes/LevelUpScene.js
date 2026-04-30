import * as Phaser from 'phaser';

export default class LevelUpScene extends Phaser.Scene {
    constructor() {
        super('LevelUpScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        this.add.rectangle(cx, H / 2, W, H, 0x000000, 0.75);

        this.add.text(cx, H * 0.14, "¡NIVEL ALCANZADO!", {
            fontSize: '40px', fill: '#00ffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.24, "Elige una mejora para esta partida", {
            fontSize: '20px', fill: '#fff'
        }).setOrigin(0.5);

        const options = [
            { id: 'hp',    title: "VITALIDAD", desc: "+20 HP Máximo",    icon: "❤️",  color: 0xff0000 },
            { id: 'dmg',   title: "FUERZA",    desc: "+3 Daño Base",     icon: "⚔️",  color: 0xaaaaaa },
            { id: 'speed', title: "AGILIDAD",  desc: "+10% Velocidad",   icon: "💨",  color: 0x00ffff }
        ];

        const cardW = 200;
        const totalW = options.length * (cardW + 30) - 30;
        const startX = (W - totalW) / 2 + cardW / 2;

        options.forEach((opt, i) => {
            this.createOptionCard(startX + i * (cardW + 30), H * 0.54, opt);
        });

        // Partículas de celebración
        this.add.particles(cx, H * 0.14, 'squareParticle', {
            speed: 120, scale: { start: 1, end: 0 },
            lifespan: 900, quantity: 20, emitting: false
        }).explode(20);
    }

    createOptionCard(x, y, opt) {
        const bg = this.add.rectangle(x, y, 190, 260, 0x222222).setInteractive();
        bg.setStrokeStyle(4, opt.color);

        this.add.text(x, y - 90, opt.icon, { fontSize: '50px' }).setOrigin(0.5);
        this.add.text(x, y - 30, opt.title, {
            fontSize: '22px', fill: Phaser.Display.Color.IntegerToRGB(opt.color) ? '#' + opt.color.toString(16).padStart(6,'0') : '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(x, y + 35, opt.desc, {
            fontSize: '16px', fill: '#fff', align: 'center', wordWrap: { width: 160 }
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x333333);
            this.tweens.add({ targets: bg, scale: 1.06, duration: 100 });
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(0x222222);
            this.tweens.add({ targets: bg, scale: 1, duration: 100 });
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
