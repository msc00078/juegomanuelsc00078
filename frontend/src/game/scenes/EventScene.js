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
        this.add.rectangle(400, 300, 800, 600, 0x111122);
        this.add.rectangle(400, 300, 600, 400, 0x000000, 0.8).setStrokeStyle(2, 0xffffff);

        const event = Phaser.Utils.Array.GetRandom(EVENTS);
        
        this.add.text(400, 150, event.title, { fontSize: '32px', fill: '#ffcc00', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 240, event.text, { fontSize: '18px', fill: '#fff', align: 'center', wordWrap: { width: 500 } }).setOrigin(0.5);

        event.options.forEach((opt, i) => {
            const btn = this.add.rectangle(400, 380 + (i * 60), 450, 40, 0x333333).setInteractive();
            const txt = this.add.text(400, 380 + (i * 60), opt.text, { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);

            btn.on('pointerover', () => btn.setFillStyle(0x555555));
            btn.on('pointerout', () => btn.setFillStyle(0x333333));
            btn.on('pointerdown', () => {
                const result = opt.action(this);
                this.showResult(result);
            });
        });
    }

    showResult(msg) {
        this.children.removeAll();
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9);
        this.add.text(400, 300, msg, { fontSize: '24px', fill: '#fff', align: 'center', wordWrap: { width: 500 } }).setOrigin(0.5);
        
        const btn = this.add.rectangle(400, 450, 200, 50, 0x444444).setInteractive();
        this.add.text(400, 450, "Continuar", { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            this.scene.start('MainScene');
        });
    }
}
