import * as Phaser from 'phaser';

const ALL_RELICS = [
    { id: 'hermes', name: "BOTAS DE HERMES.EXE", desc: "+20% Velocidad de procesamiento", color: 0x00f2ff },
    { id: 'titan', name: "CORAZÓN DE KERNEL", desc: "+50 Max HP, -10% Velocidad. Late como una CPU", color: 0xff0055 },
    { id: 'vampiro', name: "PROTOCOLO SANGUIJUELA", desc: "5% de probabilidad de curar 5 HP al borrar un Ente", color: 0xff00e1 },
    { id: 'berserker', name: "FURIA.DLL", desc: "+50% Daño con integridad < 30%", color: 0xffcc00 },
    { id: 'iman', name: "IMÁN DE CRIPTO", desc: "Atrae el oro (datos) desde lejos", color: 0xffff00 },
    { id: 'espinas', name: "MANTO DE FIREWALL", desc: "Devuelve daño a los atacantes", color: 0x00ff88 },
    { id: 'perforante', name: "FLECHAS PERFORANTES", desc: "Las flechas atraviesan el código enemigo", color: 0xaaaaaa },
    { id: 'reloj', name: "OVERCLOCK", desc: "Cooldowns de armas -30%", color: 0x8888ff },
    { id: 'hierro', name: "CARCASA DE TITANIO", desc: "Reduce el daño recibido en 2", color: 0x555555 },
    { id: 'polvora', name: "POLVORA NEGATIVA", desc: "+50% Radio de explosión", color: 0x333333 },
    { id: 'sniper', name: "OJO DEL DEBUGGER", desc: "Más daño de arco a distancia", color: 0x00aa00 },
    { id: 'vip', name: "ACCESO ROOT", desc: "Tienda 20% más barata", color: 0xffdd00 },
    { id: 'sangrado', name: "FILO CORRUPTO", desc: "Espada aplica daño en el tiempo", color: 0x880000 },
    { id: 'artemisa', name: "MATRIZ DE ARTEMISA", desc: "Dispara 3 flechas en abanico", color: 0x00ffaa },
    { id: 'pegajosa', name: "GLITCH ADHESIVO", desc: "Las bombas se pegan al objetivo", color: 0x005500 },
    { id: 'bypass_key', name: "LLAVE MAESTRA", desc: "+25% Prob. de bypass de Élite", color: 0x00ffcc }
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

        // Fondo coordinado
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x050505, 0x050505, 0x1a0a0a, 0x1a0a0a, 1);
        bg.fillRect(0, 0, W, H);
        this.add.grid(cx, H/2, W, H, 64, 64, 0x00f2ff, 0.02, 0x00f2ff, 0.05);

        this.add.text(cx, H * 0.12, "ANOMALÍA DETECTADA", {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '44px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.20, "SELECCIONA UN ARTEFACTO DE PERSISTENCIA", {
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px', fill: '#888', letterSpacing: 4
        }).setOrigin(0.5);

        let ownedRelics = this.registry.get('relics') || [];
        let availableRelics = ALL_RELICS.filter(r => !ownedRelics.includes(r.id));

        if (availableRelics.length === 0) {
            this.showEmptyState(cx, cy, W, H);
            return;
        }

        Phaser.Utils.Array.Shuffle(availableRelics);
        this.choices = availableRelics.slice(0, Math.min(3, availableRelics.length));
        this.currentPage = 0;

        this.cardContainer = this.add.container(0, 0);
        this.renderCards(W, H);

        if (this.choices.length > 1 && W < 750) {
            this.createNavigation(W, cy);
        }
    }

    showEmptyState(cx, cy, W, H) {
        this.add.text(cx, cy, "CÓDIGO FUENTE COMPLETO.\nOBTIENES 50 💎 DE COMPENSACIÓN.", {
            fontFamily: 'Orbitron, sans-serif', fontSize: '24px', fill: '#aaa', align: 'center'
        }).setOrigin(0.5);
        this.registry.set('gold', this.registry.get('gold') + 50);
        
        const btn = this.add.container(cx, H * 0.85);
        const bBg = this.add.rectangle(0, 0, 240, 50, 0x00f2ff, 0.1).setInteractive();
        bBg.setStrokeStyle(1, 0x00f2ff, 0.5);
        const bTxt = this.add.text(0, 0, "CONTINUAR >", { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fill: '#fff', fontStyle: 'bold' 
        }).setOrigin(0.5);
        btn.add([bBg, bTxt]);
        bBg.on('pointerdown', () => this.scene.start('MainScene'));
    }

    renderCards(W, H) {
        this.cardContainer.removeAll(true);

        const cy = H / 2 + 50;
        const cardW = 210;
        const cardH = 300;

        const maxVisible = W > 750 ? this.choices.length : 1;
        const indices = (maxVisible === 1) ? [this.currentPage] : this.choices.map((_, i) => i);

        const totalWidth = indices.length * (cardW + 30) - 30;
        const startX = (W - totalWidth) / 2 + cardW / 2;

        indices.forEach((relicIdx, col) => {
            const relic = this.choices[relicIdx];
            const x = startX + col * (cardW + 30);

            const container = this.add.container(x, cy);
            const bg = this.add.rectangle(0, 0, cardW, cardH, 0x0a0a0a, 0.9).setInteractive();
            bg.setStrokeStyle(2, relic.color, 0.4);

            const glow = this.add.circle(0, -90, 40, relic.color, 0.15);
            const icon = this.add.circle(0, -90, 30, relic.color).setStrokeStyle(2, 0xffffff);
            
            const nameT = this.add.text(0, -10, relic.name, {
                fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fill: '#fff', fontStyle: 'bold', align: 'center',
                wordWrap: { width: cardW - 30 }
            }).setOrigin(0.5);
            
            const descT = this.add.text(0, 70, relic.desc, {
                fontFamily: 'Inter, sans-serif', fontSize: '13px', fill: '#aaa', align: 'center',
                wordWrap: { width: cardW - 40 }
            }).setOrigin(0.5);

            container.add([bg, glow, icon, nameT, descT]);

            bg.on('pointerover', () => {
                bg.setFillStyle(0x111111, 1);
                bg.setStrokeStyle(3, relic.color, 1);
                this.tweens.add({ targets: container, scale: 1.05, duration: 200 });
            });
            bg.on('pointerout', () => {
                bg.setFillStyle(0x0a0a0a, 0.9);
                bg.setStrokeStyle(2, relic.color, 0.4);
                this.tweens.add({ targets: container, scale: 1, duration: 200 });
            });
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

            this.cardContainer.add(container);
        });

        if (W <= 750 && this.choices.length > 1) {
            const dots = this.choices.map((_, i) => i === this.currentPage ? '●' : '○').join(' ');
            this.add.text(W / 2, H * 0.90, dots, { fontFamily: 'Inter, sans-serif', fontSize: '20px', fill: '#00f2ff' }).setOrigin(0.5);
        }
    }

    createNavigation(W, cy) {
        const left = this.add.text(40, cy, '◀', { fontSize: '48px', fill: '#00f2ff' }).setOrigin(0.5).setInteractive();
        const right = this.add.text(W - 40, cy, '▶', { fontSize: '48px', fill: '#00f2ff' }).setOrigin(0.5).setInteractive();

        left.on('pointerdown', () => { this.currentPage = (this.currentPage - 1 + this.choices.length) % this.choices.length; this.renderCards(this.scale.width, this.scale.height); });
        right.on('pointerdown', () => { this.currentPage = (this.currentPage + 1) % this.choices.length; this.renderCards(this.scale.width, this.scale.height); });
    }
}
