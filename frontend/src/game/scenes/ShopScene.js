import * as Phaser from 'phaser';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        // Fondo coordinado
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x050505, 0x050505, 0x0a101a, 0x0a101a, 1);
        bg.fillRect(0, 0, W, H);
        this.add.grid(cx, H/2, W, H, 64, 64, 0x00f2ff, 0.02, 0x00f2ff, 0.05);

        this.add.text(cx, H * 0.10, "DON BYTE // MERCADO NEGRO", { 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '48px', fill: '#ffcc00', fontStyle: 'bold' 
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.18, '"En el código nada es gratis, pero todo tiene un precio."', { 
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px', fill: '#ffaa00', fontStyle: 'italic' 
        }).setOrigin(0.5);

        // Créditos UI
        const goldPanel = this.add.graphics();
        goldPanel.fillStyle(0x000000, 0.6);
        goldPanel.fillRoundedRect(cx - 150, H * 0.23, 300, 50, 10);
        goldPanel.lineStyle(1, 0x00f2ff, 0.5);
        goldPanel.strokeRoundedRect(cx - 150, H * 0.23, 300, 50, 10);

        this.goldText = this.add.text(cx, H * 0.265, `DATOS ORO: ${this.registry.get('gold')} 💎`, { 
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '20px', fill: '#00f2ff', fontStyle: 'bold' 
        }).setOrigin(0.5);

        const row1Y = H * 0.45;
        const row2Y = H * 0.65;
        const spacing = 220;

        // Fila 1 - Mejoras
        this.createShopItem(cx - spacing, row1Y, "NANITOS", "Restaurar HP", this.getPrice(25), 0x00ff88, () => this.buyHeal());
        this.createShopItem(cx,           row1Y, "PROTOCOLOS", "+5 Daño", this.getPrice(40), 0xff0055, () => this.buyDamage());
        this.createShopItem(cx + spacing, row1Y, "CHASIS", "+20 Max HP", this.getPrice(50), 0x00f2ff, () => this.buyMaxHp());

        // Fila 2 - Armas
        let bowLabel = this.registry.get('hasBow') ? "INSTALADO" : `${this.getPrice(80)} 💎`;
        this.createShopItem(cx - spacing * 0.5, row2Y, "ARCO.EXE", "Ataque Rango", bowLabel, 0xffcc00, () => this.buyBow());

        let bombLabel = this.registry.get('hasBombs') ? "INSTALADO" : `${this.getPrice(100)} 💎`;
        this.createShopItem(cx + spacing * 0.5, row2Y, "BOMBAS.GLITCH", "Explosivos", bombLabel, 0xff00e1, () => this.buyBombs());

        // Botón Salir
        const exitBtn = this.add.container(cx, H * 0.88);
        const exitBg = this.add.rectangle(0, 0, 260, 50, 0x00f2ff, 0.1).setInteractive();
        exitBg.setStrokeStyle(1, 0x00f2ff, 0.5);
        const exitTxt = this.add.text(0, 0, "SALIR AL SECTOR >", { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fill: '#00f2ff', fontStyle: 'bold' 
        }).setOrigin(0.5);
        exitBtn.add([exitBg, exitTxt]);

        exitBg.on('pointerover', () => { exitBg.setFillStyle(0x00f2ff, 0.3); this.tweens.add({ targets: exitBtn, scale: 1.05, duration: 200 }); });
        exitBg.on('pointerout', () => { exitBg.setFillStyle(0x00f2ff, 0.1); this.tweens.add({ targets: exitBtn, scale: 1, duration: 200 }); });
        exitBg.on('pointerdown', () => this.scene.start('MainScene'));

        this.showDialogue("DON BYTE", '"Bienvenido al mercado de datos. Compra algo... o piérdete en el loop."');
    }

    createShopItem(x, y, title, desc, priceLabel, color, callback) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 200, 140, 0x0a0a0a, 0.8).setInteractive();
        bg.setStrokeStyle(1, color, 0.4);

        const titleTxt = this.add.text(0, -40, title, { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fill: '#fff', fontStyle: 'bold' 
        }).setOrigin(0.5);
        const descTxt = this.add.text(0, -10, desc, { 
            fontFamily: 'Inter, sans-serif', fontSize: '12px', fill: '#ffffff' 
        }).setOrigin(0.5);
        const priceTxt = this.add.text(0, 45, typeof priceLabel === 'number' ? `${priceLabel} 💎` : priceLabel, { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '22px', fill: '#ffffff', fontStyle: 'bold',
            stroke: Phaser.Display.Color.IntegerToColor(color).rgba, strokeThickness: 2
        }).setOrigin(0.5);

        container.add([bg, titleTxt, descTxt, priceTxt]);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x111111, 1);
            bg.setStrokeStyle(2, color, 1);
            this.tweens.add({ targets: container, scale: 1.05, duration: 200 });
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(0x0a0a0a, 0.8);
            bg.setStrokeStyle(1, color, 0.4);
            this.tweens.add({ targets: container, scale: 1, duration: 200 });
        });
        bg.on('pointerdown', () => {
            callback();
            this.tweens.add({ targets: container, scale: 0.95, duration: 50, yoyo: true });
        });
    }

    showDialogue(character, message) {
        const cx = this.scale.width / 2;
        const panel = this.add.container(cx, this.scale.height - 80).setDepth(1000);
        const bg = this.add.rectangle(0, 0, this.scale.width * 0.85, 100, 0x050505, 0.95);
        bg.setStrokeStyle(2, 0x00f2ff, 0.6);
        
        const charTxt = this.add.text(-this.scale.width * 0.4, -40, character, { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fill: '#00f2ff', fontStyle: 'bold' 
        });
        const msgTxt = this.add.text(0, 5, message, { 
            fontFamily: 'Inter, sans-serif', fontSize: '16px', fill: '#ffffff', align: 'center', wordWrap: { width: this.scale.width * 0.75 } 
        }).setOrigin(0.5);
        
        panel.add([bg, charTxt, msgTxt]);
        this.input.once('pointerdown', () => panel.destroy());
        this.time.delayedCall(5000, () => { if (panel.active) panel.destroy(); });
    }

    getPrice(base) {
        const relics = this.registry.get('relics') || [];
        if (relics.includes('vip')) return Math.floor(base * 0.8);
        return base;
    }

    updateGoldUI() {
        this.goldText.setText(`DATOS ORO: ${this.registry.get('gold')} 💎`);
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
            this.showFeedback("¡SISTEMAS REPARADOS!");
        } else if (hp >= maxHp) {
            this.showFeedback("INTEGRIDAD AL MÁXIMO", 0xff0000);
        } else {
            this.showFeedback("CRÉDITOS INSUFICIENTES", 0xff0000);
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
            this.showFeedback("¡ATAQUE OPTIMIZADO!");
        } else {
            this.showFeedback("CRÉDITOS INSUFICIENTES", 0xff0000);
        }
    }

    buyMaxHp() {
        let gold = this.registry.get('gold');
        let price = this.getPrice(50);
        let maxHp = this.registry.get('playerMaxHp');
        if (gold >= price) {
            this.registry.set('gold', gold - price);
            this.registry.set('playerMaxHp', maxHp + 10);
            this.registry.set('playerHp', this.registry.get('playerHp') + 10);
            this.updateGoldUI();
            this.showFeedback("¡CHASIS AMPLIADO!");
        } else {
            this.showFeedback("CRÉDITOS INSUFICIENTES", 0xff0000);
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
            this.showFeedback("¡ARCO.EXE INSTALADO!");
            this.scene.restart();
        } else {
            this.showFeedback("CRÉDITOS INSUFICIENTES", 0xff0000);
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
            this.showFeedback("¡BOMBAS.GLITCH CARGADAS!");
            this.scene.restart();
        } else {
            this.showFeedback("CRÉDITOS INSUFICIENTES", 0xff0000);
        }
    }

    showFeedback(msg, color = 0x00ff00) {
        const text = this.add.text(this.scale.width / 2, this.scale.height * 0.52, msg, { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '20px', fill: Phaser.Display.Color.IntegerToColor(color).rgba 
        }).setOrigin(0.5).setDepth(2000);
        this.tweens.add({ targets: text, y: this.scale.height * 0.35, alpha: 0, duration: 1500, onComplete: () => text.destroy() });
    }
}
