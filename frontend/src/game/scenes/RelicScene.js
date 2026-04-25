import * as Phaser from 'phaser';

const ALL_RELICS = [
    { id: 'hermes', name: "Botas de Hermes", desc: "+20% Velocidad de movimiento", color: 0x00ffff },
    { id: 'titan', name: "Corazón de Titán", desc: "+50 Max HP, -10% Velocidad", color: 0xff0000 },
    { id: 'vampiro', name: "Vampirismo Menor", desc: "5% de probabilidad de\ncurar 5 HP al matar", color: 0xaa0022 },
    { id: 'berserker', name: "Furia Berserker", desc: "+50% Daño con vida < 30%", color: 0xff5500 },
    { id: 'iman', name: "Imán de Codicia", desc: "Atrae el oro desde lejos", color: 0xffff00 },
    { id: 'espinas', name: "Manto de Espinas", desc: "Daño a enemigos al tocarte", color: 0x44ff44 },
    { id: 'perforante', name: "Flechas Perforantes", desc: "Las flechas atraviesan enemigos", color: 0xaaaaaa },
    { id: 'reloj', name: "Reloj de Arena", desc: "Cooldowns de armas -30%", color: 0x8888ff },
    { id: 'hierro', name: "Piel de Hierro", desc: "Reduce el daño recibido en 2", color: 0x555555 },
    { id: 'polvora', name: "Pólvora Negra", desc: "+50% Radio de explosión", color: 0x111111 },
    { id: 'sniper', name: "Ojo del Francotirador", desc: "Más daño de arco a distancia", color: 0x00aa00 },
    { id: 'vip', name: "Tarjeta VIP", desc: "Tienda 20% más barata", color: 0xffdd00 },
    { id: 'sangrado', name: "Filo Sangrante", desc: "Espada aplica daño en el tiempo", color: 0x880000 },
    { id: 'artemisa', name: "Arco de Artemisa", desc: "Dispara 3 flechas en abanico", color: 0x00ffaa },
    { id: 'pegajosa', name: "Bomba Pegajosa", desc: "Las bombas se pegan a enemigos", color: 0x005500 }
];

export default class RelicScene extends Phaser.Scene {
    constructor() {
        super('RelicScene');
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x221111);
        
        this.add.text(400, 100, "¡RELIQUIA OBTENIDA!", { fontSize: '40px', fill: '#ffcc00', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 160, "Elige un poder para el resto de la partida", { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);

        let ownedRelics = this.registry.get('relics') || [];
        
        // Filtrar reliquias que ya tenemos para no repetirlas
        let availableRelics = ALL_RELICS.filter(r => !ownedRelics.includes(r.id));
        
        // Si ya tenemos todas, dar oro de consolación
        if (availableRelics.length === 0) {
            this.add.text(400, 300, "Ya tienes todas las reliquias.\nObtienes 50 de Oro en su lugar.", { fontSize: '24px', fill: '#aaa', align: 'center' }).setOrigin(0.5);
            this.registry.set('gold', this.registry.get('gold') + 50);
            this.createContinueButton();
            return;
        }

        // Seleccionar hasta 3 aleatorias
        Phaser.Utils.Array.Shuffle(availableRelics);
        let choices = availableRelics.slice(0, Math.min(3, availableRelics.length));

        const startX = 400 - ((choices.length - 1) * 200);
        
        for (let i = 0; i < choices.length; i++) {
            let relic = choices[i];
            this.createRelicCard(startX + (i * 200), 350, relic);
        }
    }

    createRelicCard(x, y, relic) {
        const bg = this.add.rectangle(x, y, 160, 220, 0x442222).setInteractive();
        bg.setStrokeStyle(2, relic.color);
        
        // Icono (círculo de color por ahora)
        this.add.circle(x, y - 60, 25, relic.color);
        
        this.add.text(x, y, relic.name, { fontSize: '18px', fill: '#fff', fontStyle: 'bold', align: 'center', wordWrap: { width: 140 } }).setOrigin(0.5);
        this.add.text(x, y + 50, relic.desc, { fontSize: '14px', fill: '#aaa', align: 'center', wordWrap: { width: 140 } }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x663333);
            this.tweens.add({ targets: bg, y: y - 10, duration: 100 });
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x442222);
            this.tweens.add({ targets: bg, y: y, duration: 100 });
        });
        
        bg.on('pointerdown', () => {
            let owned = this.registry.get('relics') || [];
            owned.push(relic.id);
            this.registry.set('relics', owned);
            
            // Si es vida máxima, aplicarla instantáneamente
            if (relic.id === 'titan') {
                this.registry.set('playerMaxHp', this.registry.get('playerMaxHp') + 50);
                this.registry.set('playerHp', this.registry.get('playerHp') + 50);
            }

            this.scene.start('MainScene'); // Volver directamente al combate (que decidirá el siguiente nodo)
        });
    }

    createContinueButton() {
        const btn = this.add.rectangle(400, 500, 200, 50, 0x444444).setInteractive();
        this.add.text(400, 500, "Continuar", { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);
        
        btn.on('pointerdown', () => {
            this.scene.start('MainScene');
        });
    }
}
