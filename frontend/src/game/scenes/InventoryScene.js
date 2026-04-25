import * as Phaser from 'phaser';

export default class InventoryScene extends Phaser.Scene {
    constructor() {
        super('InventoryScene');
    }

    create() {
        // Fondo semi-transparente
        const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setInteractive();
        
        // Panel Central
        const panel = this.add.rectangle(400, 300, 600, 450, 0x111111);
        panel.setStrokeStyle(4, 0x0077ff);

        // Título
        this.add.text(400, 110, "INVENTARIO Y ESTADÍSTICAS", { 
            fontSize: '32px', fill: '#0077ff', fontStyle: 'bold' 
        }).setOrigin(0.5);

        // --- ESTADÍSTICAS ---
        const hp = this.registry.get('playerHp');
        const maxHp = this.registry.get('playerMaxHp');
        const dmg = this.registry.get('swordDamage');
        const gold = this.registry.get('gold');
        const level = this.registry.get('currentLevel');

        const statsX = 200;
        this.add.text(statsX, 180, "ESTADO DEL HÉROE", { fontSize: '20px', fill: '#ffd700', fontStyle: 'bold' });
        this.add.text(statsX, 220, `Vida: ${hp} / ${maxHp}`, { fontSize: '18px', fill: '#fff' });
        this.add.text(statsX, 250, `Daño Espada: ${dmg}`, { fontSize: '18px', fill: '#fff' });
        this.add.text(statsX, 280, `Oro: ${gold}`, { fontSize: '18px', fill: '#fff' });
        this.add.text(statsX, 310, `Nivel Actual: ${level}`, { fontSize: '18px', fill: '#fff' });

        // --- ARMAS ---
        const weaponsX = 500;
        this.add.text(weaponsX, 180, "ARMAS", { fontSize: '20px', fill: '#ffd700', fontStyle: 'bold' });
        
        const equipped = this.registry.get('equippedWeapon') || 1;
        this.createWeaponInfo(weaponsX, 220, "1. Espada", true, equipped === 1);
        this.createWeaponInfo(weaponsX, 250, "2. Arco", this.registry.get('hasBow'), equipped === 2);
        this.createWeaponInfo(weaponsX, 280, "3. Bombas", this.registry.get('hasBombs'), equipped === 3);

        // --- RELIQUIAS ---
        this.add.text(400, 360, "RELIQUIAS COLECTADAS", { fontSize: '20px', fill: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        const relics = this.registry.get('relics') || [];
        
        if (relics.length === 0) {
            this.add.text(400, 400, "No tienes reliquias aún.", { fontSize: '16px', fill: '#777' }).setOrigin(0.5);
        } else {
            relics.forEach((relic, index) => {
                const rx = 400 + (index - (relics.length-1)/2) * 100;
                const rCircle = this.add.circle(rx, 410, 30, 0x333333).setStrokeStyle(2, 0x00ff00);
                this.add.text(rx, 410, relic.substring(0, 3).toUpperCase(), { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);
                
                // Tooltip simple al pasar el mouse
                rCircle.setInteractive();
                const tooltip = this.add.text(rx, 450, relic.toUpperCase(), { fontSize: '12px', fill: '#00ff00', backgroundColor: '#000' }).setOrigin(0.5).setVisible(false);
                rCircle.on('pointerover', () => tooltip.setVisible(true));
                rCircle.on('pointerout', () => tooltip.setVisible(false));
            });
        }

        // Botón Cerrar
        const closeBtn = this.add.rectangle(400, 500, 150, 40, 0x0077ff).setInteractive();
        this.add.text(400, 500, "CERRAR (TAB)", { fontSize: '18px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        
        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x0055cc));
        closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x0077ff));
        closeBtn.on('pointerdown', () => this.closeInventory());

        // Tecla para cerrar
        this.input.keyboard.on('keydown-I', () => this.closeInventory());
        this.input.keyboard.on('keydown-TAB', () => this.closeInventory());
        this.input.keyboard.on('keydown-ESC', () => this.closeInventory());
    }

    createWeaponInfo(x, y, name, unlocked, isEquipped) {
        const color = unlocked ? '#fff' : '#444';
        const txt = this.add.text(x, y, name, { fontSize: '18px', fill: color });
        if (isEquipped) {
            this.add.text(x - 20, y, "▶", { fontSize: '18px', fill: '#00ff00' });
        }
        if (!unlocked) {
            this.add.text(x + 100, y, "(BLOQUEADO)", { fontSize: '12px', fill: '#ff0000' });
        }
    }

    closeInventory() {
        this.scene.stop();
        this.scene.resume('MainScene');
    }
}
