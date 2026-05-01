import * as Phaser from 'phaser';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        this.add.rectangle(cx, H / 2, W, H, 0x080c14);
        this.add.grid(cx, H/2, W, H, 48, 48, 0x0d1020, 1, 0x111833, 1);
        this.add.text(cx, H * 0.08, "DON BYTE", { fontSize: '46px', fill: '#ffd700', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.add.text(cx, H * 0.16, '"Siempre sonríe... demasiado."', { fontSize: '16px', fill: '#ffaa00', fontStyle: 'italic' }).setOrigin(0.5);
        this.goldText = this.add.text(cx, H * 0.24, `Datos (Oro): ${this.registry.get('gold')}`, { fontSize: '22px', fill: '#aaffff' }).setOrigin(0.5);

        const row1Y = H * 0.42;
        const row2Y = H * 0.60;
        const spacing = W * 0.18;

        // Fila 1
        this.createButton(cx - spacing, row1Y, `Nanito Curativo\n(Restaurar HP)\n${this.getPrice(25)} Oro`, 0x006622, () => this.buyHeal());
        this.createButton(cx,           row1Y, `Afilar Byte\n(+Daño)\n${this.getPrice(50)} Oro`,          0x880000, () => this.buyDamage());
        this.createButton(cx + spacing, row1Y, `Implante (+20 HP)\n${this.getPrice(60)} Oro`,              0x770077, () => this.buyMaxHp());

        // Fila 2
        let bowText = this.registry.get('hasBow') ? "Arco.exe\n(Instalado)" : `Arco.exe\n${this.getPrice(90)} Oro`;
        this.createButton(cx - spacing * 0.6, row2Y, bowText, 0x886600, () => this.buyBow());

        let bombText = this.registry.get('hasBombs') ? "Bombas Glítch\n(Instaladas)" : `Bombas Glítch\n${this.getPrice(120)} Oro`;
        this.createButton(cx + spacing * 0.6, row2Y, bombText, 0x006666, () => this.buyBombs());

        const continueBtn = this.add.rectangle(cx, H * 0.82, 240, 55, 0x221100).setInteractive();
        continueBtn.setStrokeStyle(2, 0xffd700);
        this.add.text(cx, H * 0.82, "Salir del mercado >", { fontSize: '20px', fill: '#ffd700' }).setOrigin(0.5);

        continueBtn.on('pointerover', () => continueBtn.setFillStyle(0x666666));
        continueBtn.on('pointerout', () => continueBtn.setFillStyle(0x444444));
        continueBtn.on('pointerdown', () => this.scene.start('MainScene'));
    }

    getPrice(base) {
        const relics = this.registry.get('relics') || [];
        if (relics.includes('vip')) return Math.floor(base * 0.8);
        return base;
    }

    createButton(x, y, text, color, callback) {
        const bg = this.add.rectangle(x, y, 180, 100, color).setInteractive();
        const txt = this.add.text(x, y, text, { fontSize: '16px', fill: '#fff', align: 'center' }).setOrigin(0.5);
        bg.on('pointerover', () => bg.setStrokeStyle(4, 0xffffff));
        bg.on('pointerout', () => bg.setStrokeStyle(0));
        bg.on('pointerdown', () => {
            callback();
            this.tweens.add({ targets: bg, scale: 0.9, duration: 50, yoyo: true });
        });
    }

    updateGoldUI() {
        this.goldText.setText(`Oro disponible: ${this.registry.get('gold')}`);
    }

    buyHeal() {
        let gold = this.registry.get('gold');
        let price = this.getPrice(20);
        let hp = this.registry.get('playerHp');
        let maxHp = this.registry.get('playerMaxHp');
        if (gold >= price && hp < maxHp) {
            this.registry.set('gold', gold - price);
            this.registry.set('playerHp', maxHp);
            this.updateGoldUI();
            this.showFeedback("¡Curado!");
        } else if (hp >= maxHp) {
            this.showFeedback("Vida llena", 0xff0000);
        } else {
            this.showFeedback("Falta Oro", 0xff0000);
        }
    }

    buyDamage() {
        let gold = this.registry.get('gold');
        let price = this.getPrice(40);
        let damage = this.registry.get('swordDamage') || 10;
        if (gold >= price) {
            this.registry.set('gold', gold - price);
            this.registry.set('swordDamage', damage + 5);
            this.updateGoldUI();
            this.showFeedback("¡+5 Daño!");
        } else {
            this.showFeedback("Falta Oro", 0xff0000);
        }
    }

    buyMaxHp() {
        let gold = this.registry.get('gold');
        let price = this.getPrice(50);
        let maxHp = this.registry.get('playerMaxHp');
        if (gold >= price) {
            this.registry.set('gold', gold - price);
            this.registry.set('playerMaxHp', maxHp + 20);
            this.registry.set('playerHp', this.registry.get('playerHp') + 20);
            this.updateGoldUI();
            this.showFeedback("¡+20 Max HP!");
        } else {
            this.showFeedback("Falta Oro", 0xff0000);
        }
    }

    buyBow() {
        let gold = this.registry.get('gold');
        let price = this.getPrice(80);
        if (this.registry.get('hasBow')) return;
        if (gold >= price) {
            this.registry.set('gold', gold - price);
            this.registry.set('hasBow', true);
            this.updateGoldUI();
            this.showFeedback("¡Arco!");
        } else {
            this.showFeedback("Falta Oro", 0xff0000);
        }
    }

    buyBombs() {
        let gold = this.registry.get('gold');
        let price = this.getPrice(100);
        if (this.registry.get('hasBombs')) return;
        if (gold >= price) {
            this.registry.set('gold', gold - price);
            this.registry.set('hasBombs', true);
            this.updateGoldUI();
            this.showFeedback("¡Bombas!");
        } else {
            this.showFeedback("Falta Oro", 0xff0000);
        }
    }

    showFeedback(msg, color = 0x00ff00) {
        const text = this.add.text(this.scale.width / 2, this.scale.height * 0.52, msg, { fontSize: '20px', fill: Phaser.Display.Color.IntegerToColor(color).rgba }).setOrigin(0.5);
        this.tweens.add({ targets: text, y: this.scale.height * 0.40, alpha: 0, duration: 1500, onComplete: () => text.destroy() });
    }
}
