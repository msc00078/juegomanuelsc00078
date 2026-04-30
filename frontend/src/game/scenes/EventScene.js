import * as Phaser from 'phaser';

const EVENTS = [
    {
        title: "El Altar de Sangre",
        text: "Encuentras un altar que emana una energía oscura. Una voz susurra: 'Sacrifica tu vitalidad a cambio de poder'.",
        options: [
            { text: "Sacrificar 20 Max HP por +10 Daño", action: (scene) => {
                scene.registry.set('playerMaxHp', Math.max(10, scene.registry.get('playerMaxHp') - 20));
                scene.registry.set('playerHp', Math.min(scene.registry.get('playerHp'), scene.registry.get('playerMaxHp')));
                scene.registry.set('swordDamage', scene.registry.get('swordDamage') + 10);
                return "Tu fuerza aumenta, pero te sientes más débil...";
            }},
            { text: "Marcharte en silencio", action: () => "Decides no tentar al destino." }
        ]
    },
    {
        title: "El Mercader Codicioso",
        text: "Un pequeño duende te ofrece una bolsa misteriosa por 50 monedas de oro.",
        options: [
            { text: "Pagar 50 Oro por el Misterio", action: (scene) => {
                let gold = scene.registry.get('gold');
                if (gold < 50) return "No tienes suficiente oro...";
                scene.registry.set('gold', gold - 50);
                if (Math.random() < 0.5) {
                    scene.registry.set('gold', scene.registry.get('gold') + 150);
                    return "¡Había 150 monedas dentro! ¡Qué suerte!";
                } else {
                    return "La bolsa estaba llena de piedras... Te han timado.";
                }
            }},
            { text: "Ignorarlo", action: () => "Sigues tu camino." }
        ]
    },
    {
        title: "La Fuente de la Vida",
        text: "Una fuente de agua cristalina brilla en el centro de la sala.",
        options: [
            { text: "Beber de la fuente (Cura 40 HP)", action: (scene) => {
                let hp = scene.registry.get('playerHp');
                let max = scene.registry.get('playerMaxHp');
                scene.registry.set('playerHp', Math.min(max, hp + 40));
                return "Te sientes rejuvenecido.";
            }},
            { text: "Llenar tus bolsillos de oro (Gana 30 Oro)", action: (scene) => {
                scene.registry.set('gold', scene.registry.get('gold') + 30);
                return "Recoges unas monedas del fondo de la fuente.";
            }}
        ]
    }
];

export default class EventScene extends Phaser.Scene {
    constructor() {
        super('EventScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        this.add.rectangle(cx, cy, W, H, 0x111122);
        this.add.rectangle(cx, cy, Math.min(700, W * 0.85), H * 0.72, 0x000000, 0.85).setStrokeStyle(2, 0xffffff);

        const event = Phaser.Utils.Array.GetRandom(EVENTS);

        this.add.text(cx, H * 0.20, event.title, {
            fontSize: '32px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.35, event.text, {
            fontSize: '17px', fill: '#fff', align: 'center',
            wordWrap: { width: Math.min(580, W * 0.75) }
        }).setOrigin(0.5);

        event.options.forEach((opt, i) => {
            const btnY = H * 0.56 + (i * H * 0.10);
            const btn = this.add.rectangle(cx, btnY, Math.min(520, W * 0.70), 50, 0x333333).setInteractive();
            const txt = this.add.text(cx, btnY, opt.text, {
                fontSize: '16px', fill: '#fff', align: 'center',
                wordWrap: { width: Math.min(490, W * 0.65) }
            }).setOrigin(0.5);

            btn.on('pointerover', () => btn.setFillStyle(0x555555));
            btn.on('pointerout', () => btn.setFillStyle(0x333333));
            btn.on('pointerdown', () => {
                const result = opt.action(this);
                this.showResult(result);
            });
        });
    }

    showResult(msg) {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        this.children.removeAll();
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.92);
        this.add.text(cx, cy - 60, msg, {
            fontSize: '24px', fill: '#fff', align: 'center',
            wordWrap: { width: Math.min(560, W * 0.75) }
        }).setOrigin(0.5);

        const btn = this.add.rectangle(cx, cy + 100, 220, 55, 0x444444).setInteractive();
        this.add.text(cx, cy + 100, "Continuar", { fontSize: '22px', fill: '#fff' }).setOrigin(0.5);

        btn.on('pointerdown', () => this.scene.start('MainScene'));
    }
}
