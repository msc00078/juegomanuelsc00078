import * as Phaser from 'phaser';

export default class MapScene extends Phaser.Scene {
    constructor() {
        super('MapScene');
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x111122);
        
        let level = this.registry.get('currentLevel') || 1;
        this.add.text(400, 100, `MAPA - RUTA AL NIVEL ${level}`, { fontSize: '32px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 150, "Elige tu siguiente destino", { fontSize: '20px', fill: '#aaa' }).setOrigin(0.5);

        // Si es nivel 5, 10, 15... obligar a ir al Boss
        if (level % 5 === 0) {
            this.createNode(400, 300, "SALA DEL BOSS", 0xff0000, 'boss');
            return;
        }

        // Generar 3 opciones aleatorias
        const options = ['combat', 'combat', 'elite', 'shop', 'event']; // 'event' por implementar
        const choices = [];
        for(let i=0; i<3; i++) {
            let type = options[Phaser.Math.Between(0, options.length-1)];
            choices.push(type);
        }

        // Evitar que salgan todo tiendas o todo eventos, forzamos mínimo un combate
        if (!choices.includes('combat') && !choices.includes('elite')) {
            choices[0] = 'combat';
        }

        const xPositions = [200, 400, 600];
        for (let i = 0; i < 3; i++) {
            let type = choices[i];
            let name = "Combate Base";
            let color = 0x555555;
            
            if (type === 'combat') { name = "Combate\n(Monstruos)"; color = 0x55aa55; }
            if (type === 'elite') { name = "Élite\n(Reliquia Asegurada)"; color = 0xaa2222; }
            if (type === 'shop') { name = "Tienda\n(Gastar Oro)"; color = 0xaaaa22; }
            if (type === 'event') { name = "Evento\n(?)"; color = 0x2222aa; }

            this.createNode(xPositions[i], 350, name, color, type);
        }
    }

    createNode(x, y, text, color, type) {
        const bg = this.add.circle(x, y, 60, color).setInteractive();
        const txt = this.add.text(x, y, text, { fontSize: '16px', fill: '#fff', align: 'center' }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setStrokeStyle(4, 0xffffff);
            this.tweens.add({ targets: bg, scale: 1.1, duration: 100 });
        });
        
        bg.on('pointerout', () => {
            bg.setStrokeStyle(0);
            this.tweens.add({ targets: bg, scale: 1, duration: 100 });
        });
        
        bg.on('pointerdown', () => {
            this.registry.set('nextNodeType', type);
            
            // Efecto flash
            this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(500, () => {
                if (type === 'shop') {
                    this.scene.start('ShopScene');
                } else if (type === 'event') {
                    this.scene.start('EventScene'); 
                } else {
                    this.scene.start('MainScene');
                }
            });
        });
    }
}
