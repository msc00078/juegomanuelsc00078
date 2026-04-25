import * as Phaser from 'phaser';

export default class LevelUpScene extends Phaser.Scene {
    constructor() {
        super('LevelUpScene');
    }

    create() {
        // Fondo con efecto blur/oscuro
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        
        this.add.text(400, 100, "¡NIVEL ALCANZADO!", { 
            fontSize: '40px', fill: '#00ffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 
        }).setOrigin(0.5);
        this.add.text(400, 150, "Elige una mejora para esta partida", { 
            fontSize: '20px', fill: '#fff' 
        }).setOrigin(0.5);

        const options = [
            { id: 'hp', title: "VITALIDAD", desc: "+20 HP Máximo", icon: "❤️", color: 0xff0000 },
            { id: 'dmg', title: "FUERZA", desc: "+3 Daño Base", icon: "⚔️", color: 0xaaaaaa },
            { id: 'speed', title: "AGILIDAD", desc: "+10% Velocidad", icon: "💨", color: 0x00ffff }
        ];

        options.forEach((opt, i) => {
            this.createOptionCard(200 + (i * 200), 350, opt);
        });

        // Efecto de sonido/partículas de nivel up (visual)
        this.add.particles(400, 100, 'squareParticle', {
            speed: 100,
            scale: { start: 1, end: 0 },
            lifespan: 1000,
            quantity: 20,
            emitting: false
        }).explode(20);
    }

    createOptionCard(x, y, opt) {
        const bg = this.add.rectangle(x, y, 180, 250, 0x222222).setInteractive();
        bg.setStrokeStyle(4, opt.color);
        
        this.add.text(x, y - 80, opt.icon, { fontSize: '50px' }).setOrigin(0.5);
        this.add.text(x, y - 20, opt.title, { fontSize: '22px', fill: opt.color, fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(x, y + 40, opt.desc, { fontSize: '16px', fill: '#fff', align: 'center', wordWrap: { width: 150 } }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x333333);
            this.tweens.add({ targets: bg, scale: 1.05, duration: 100 });
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
            const dmg = this.registry.get('swordDamage') + 3;
            this.registry.set('swordDamage', dmg);
        } else if (id === 'speed') {
            const speed = (this.registry.get('bonusSpeed') || 0) + 0.1;
            this.registry.set('bonusSpeed', speed);
        }
    }
}
