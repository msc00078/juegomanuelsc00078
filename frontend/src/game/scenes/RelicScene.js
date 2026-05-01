import * as Phaser from 'phaser';

const ALL_RELICS = [
    { id: 'hermes', name: "Botas de Hermes.exe", desc: "+20% Velocidad de procesamiento", color: 0x00ffff },
    { id: 'titan', name: "Corazón de Kernel", desc: "+50 Max HP, -10% Velocidad. Late como una CPU", color: 0xff0000 },
    { id: 'vampiro', name: "Protocolo Sanguijuela", desc: "5% de probabilidad de\ncurar 5 HP al borrar un Ente", color: 0xaa0022 },
    { id: 'berserker', name: "Furia.dll", desc: "+50% Daño con integridad < 30%", color: 0xff5500 },
    { id: 'iman', name: "Imán de Cripto", desc: "Atrae el oro (datos) desde lejos", color: 0xffff00 },
    { id: 'espinas', name: "Manto de Firewall", desc: "Devuelve daño a los atacantes", color: 0x44ff44 },
    { id: 'perforante', name: "Flechas Perforantes", desc: "Las flechas atraviesan el código enemigo", color: 0xaaaaaa },
    { id: 'reloj', name: "Overclock", desc: "Cooldowns de armas -30%", color: 0x8888ff },
    { id: 'hierro', name: "Carcasa de Titanio", desc: "Reduce el daño recibido en 2", color: 0x555555 },
    { id: 'polvora', name: "Polvora Negativa", desc: "+50% Radio de explosión", color: 0x111111 },
    { id: 'sniper', name: "Ojo del Debugger", desc: "Más daño de arco a distancia", color: 0x00aa00 },
    { id: 'vip', name: "Acceso Root", desc: "Tienda 20% más barata", color: 0xffdd00 },
    { id: 'sangrado', name: "Filo Corrupto", desc: "Espada aplica daño en el tiempo", color: 0x880000 },
    { id: 'artemisa', name: "Matriz de Artemisa", desc: "Dispara 3 flechas en abanico", color: 0x00ffaa },
    { id: 'pegajosa', name: "Glitch Adhesivo", desc: "Las bombas se pegan al objetivo", color: 0x005500 }
];

export default class RelicScene extends Phaser.Scene {
    constructor() {
        super('RelicScene');
        this.currentPage = 0;
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        this.add.rectangle(cx, cy, W, H, 0x221111);

        this.add.text(cx, H * 0.12, "¡RELIQUIA OBTENIDA!", {
            fontSize: '40px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(cx, H * 0.22, "Elige un poder para el resto de la partida", {
            fontSize: '20px', fill: '#fff'
        }).setOrigin(0.5);

        let ownedRelics = this.registry.get('relics') || [];
        let availableRelics = ALL_RELICS.filter(r => !ownedRelics.includes(r.id));

        if (availableRelics.length === 0) {
            this.add.text(cx, cy, "Ya tienes todas las reliquias.\nObtienes 50 de Oro en su lugar.", {
                fontSize: '24px', fill: '#aaa', align: 'center'
            }).setOrigin(0.5);
            this.registry.set('gold', this.registry.get('gold') + 50);
            this.createContinueButton(W, H);
            return;
        }

        // Seleccionar hasta 3 aleatorias
        Phaser.Utils.Array.Shuffle(availableRelics);
        this.choices = availableRelics.slice(0, Math.min(3, availableRelics.length));
        this.currentPage = 0;

        // Contenedor de tarjetas para poder actualizarlas
        this.cardContainer = this.add.container(0, 0);

        this.renderCards(W, H);

        // Flechas de navegación si hay más de una tarjeta que no cabe
        const cardWidth = 200;
        const totalCardsWidth = this.choices.length * cardWidth;

        if (totalCardsWidth > W * 0.85 && this.choices.length > 1) {
            // Navegación izquierda/derecha
            const leftBtn = this.add.text(40, cy, '◀', {
                fontSize: '48px', fill: '#fff'
            }).setOrigin(0.5).setInteractive().setDepth(10);

            const rightBtn = this.add.text(W - 40, cy, '▶', {
                fontSize: '48px', fill: '#fff'
            }).setOrigin(0.5).setInteractive().setDepth(10);

            leftBtn.on('pointerdown', () => {
                this.currentPage = (this.currentPage - 1 + this.choices.length) % this.choices.length;
                this.renderCards(W, H);
            });
            rightBtn.on('pointerdown', () => {
                this.currentPage = (this.currentPage + 1) % this.choices.length;
                this.renderCards(W, H);
            });

            // Swipe táctil
            this.input.on('pointerdown', (p) => { this._swipeStartX = p.x; });
            this.input.on('pointerup', (p) => {
                const dx = p.x - this._swipeStartX;
                if (Math.abs(dx) > 60) {
                    if (dx < 0) {
                        this.currentPage = (this.currentPage + 1) % this.choices.length;
                    } else {
                        this.currentPage = (this.currentPage - 1 + this.choices.length) % this.choices.length;
                    }
                    this.renderCards(W, H);
                }
            });
        }
    }

    renderCards(W, H) {
        this.cardContainer.removeAll(true);

        const cy = H / 2 + 30;
        const cardW = 190;
        const cardH = 240;

        // En pantallas anchas mostrar hasta 3, en estrechas solo 1
        const maxVisible = W > 700 ? this.choices.length : 1;
        const indices = [];

        if (maxVisible === 1) {
            indices.push(this.currentPage);
        } else {
            for (let i = 0; i < this.choices.length; i++) indices.push(i);
        }

        const totalWidth = indices.length * (cardW + 30) - 30;
        const startX = (W - totalWidth) / 2 + cardW / 2;

        indices.forEach((relicIdx, col) => {
            const relic = this.choices[relicIdx];
            const x = startX + col * (cardW + 30);

            const bg = this.add.rectangle(x, cy, cardW, cardH, 0x442222).setInteractive();
            bg.setStrokeStyle(3, relic.color);
            const icon = this.add.circle(x, cy - 80, 28, relic.color);
            const nameT = this.add.text(x, cy - 20, relic.name, {
                fontSize: '17px', fill: '#fff', fontStyle: 'bold', align: 'center',
                wordWrap: { width: cardW - 20 }
            }).setOrigin(0.5);
            const descT = this.add.text(x, cy + 55, relic.desc, {
                fontSize: '13px', fill: '#aaa', align: 'center',
                wordWrap: { width: cardW - 20 }
            }).setOrigin(0.5);

            bg.on('pointerover', () => bg.setFillStyle(0x663333));
            bg.on('pointerout', () => bg.setFillStyle(0x442222));
            bg.on('pointerdown', () => {
                let owned = this.registry.get('relics') || [];
                owned.push(relic.id);
                this.registry.set('relics', owned);
                if (relic.id === 'titan') {
                    this.registry.set('playerMaxHp', this.registry.get('playerMaxHp') + 50);
                    this.registry.set('playerHp', this.registry.get('playerHp') + 50);
                }
                this.scene.start('MainScene');
            });

            this.cardContainer.add([bg, icon, nameT, descT]);
        });

        // Indicador de página si modo 1-a-la-vez
        if (W <= 700 && this.choices.length > 1) {
            const dots = this.choices.map((_, i) => i === this.currentPage ? '●' : '○').join(' ');
            const dotText = this.add.text(W / 2, H * 0.92, dots, {
                fontSize: '20px', fill: '#fff'
            }).setOrigin(0.5);
            this.cardContainer.add(dotText);
        }
    }

    createContinueButton(W, H) {
        const btn = this.add.rectangle(W / 2, H * 0.82, 220, 55, 0x444444).setInteractive();
        this.add.text(W / 2, H * 0.82, "Continuar", { fontSize: '22px', fill: '#fff' }).setOrigin(0.5);
        btn.on('pointerdown', () => this.scene.start('MainScene'));
    }
}
