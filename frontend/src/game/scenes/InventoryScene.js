import * as Phaser from 'phaser';

export default class InventoryScene extends Phaser.Scene {
    constructor() {
        super('InventoryScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        // Fondo Oscurecido
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.85).setInteractive();

        // Panel Central (Glassmorphism)
        const panelW = Math.min(800, W * 0.85);
        const panelH = H * 0.78;
        const panel = this.add.graphics();
        panel.fillStyle(0x050505, 0.9);
        panel.fillRoundedRect(cx - panelW/2, cy - panelH/2, panelW, panelH, 16);
        panel.lineStyle(2, 0x00f2ff, 0.3);
        panel.strokeRoundedRect(cx - panelW/2, cy - panelH/2, panelW, panelH, 16);

        // Título Glitch
        this.add.text(cx, cy - panelH/2 + 45, "DIAGNÓSTICO DEL SISTEMA", {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '32px', fill: '#00f2ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // --- ESTADÍSTICAS (IZQUIERDA) ---
        const statsX = cx - panelW/2 + 60;
        const statsY = cy - panelH/2 + 120;
        
        this.add.text(statsX, statsY, "ESTADO DEL HARDWARE", { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fill: '#ffcc00', fontWeight: 'bold' 
        });

        const stats = [
            { label: "INTEGRIDAD HP", value: `${this.registry.get('playerHp')} / ${this.registry.get('playerMaxHp')}` },
            { label: "POTENCIA DAÑO", value: `${this.registry.get('swordDamage')}` },
            { label: "CRÉDITOS ORO", value: `${this.registry.get('gold')} 💎` },
            { label: "SECTOR ACTUAL", value: `0${this.registry.get('currentLevel')}` }
        ];

        stats.forEach((s, i) => {
            this.add.text(statsX, statsY + 50 + (i * 45), s.label, { fontFamily: 'Inter, sans-serif', fontSize: '13px', fill: '#888' });
            this.add.text(statsX + 180, statsY + 50 + (i * 45), s.value, { fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fill: '#fff' }).setOrigin(1, 0);
        });

        // --- ARMAS (DERECHA) ---
        const weaponsX = cx + 50;
        this.add.text(weaponsX, statsY, "MÓDULOS DE ARMA", { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fill: '#ffcc00', fontWeight: 'bold' 
        });

        const equipped = this.registry.get('equippedWeapon') || 1;
        this.createWeaponInfo(weaponsX, statsY + 50, "MOD-01 ESPADA", true, equipped === 1);
        this.createWeaponInfo(weaponsX, statsY + 110, "MOD-02 ARCO", this.registry.get('hasBow'), equipped === 2);
        this.createWeaponInfo(weaponsX, statsY + 170, "MOD-03 BOMBAS", this.registry.get('hasBombs'), equipped === 3);

        // --- RELIQUIAS (ABAJO) ---
        const relicsY = cy + panelH/2 - 130;
        this.add.text(cx, relicsY, "RELIQUIAS DETECTADAS", { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fill: '#ff00e1', fontWeight: 'bold' 
        }).setOrigin(0.5);

        const relics = this.registry.get('relics') || [];
        if (relics.length === 0) {
            this.add.text(cx, relicsY + 45, "SIN REGISTROS DE ANOMALÍAS", { 
                fontFamily: 'Inter, sans-serif', fontSize: '14px', fill: '#444' 
            }).setOrigin(0.5);
        } else {
            relics.forEach((relic, index) => {
                const rx = cx + (index - (relics.length - 1) / 2) * 90;
                const rBg = this.add.circle(rx, relicsY + 55, 32, 0x00f2ff, 0.05).setStrokeStyle(1, 0x00f2ff, 0.3).setInteractive();
                this.add.text(rx, relicsY + 55, relic.substring(0, 3).toUpperCase(), { 
                    fontFamily: 'Orbitron, sans-serif', fontSize: '12px', fill: '#00f2ff' 
                }).setOrigin(0.5);

                const tooltip = this.add.text(rx, relicsY + 100, relic.toUpperCase(), { 
                    fontFamily: 'Inter, sans-serif', fontSize: '10px', fill: '#fff', backgroundColor: '#000', padding: { x: 5, y: 2 } 
                }).setOrigin(0.5).setVisible(false).setDepth(100);
                
                rBg.on('pointerover', () => { tooltip.setVisible(true); rBg.setStrokeStyle(2, 0x00f2ff, 1); });
                rBg.on('pointerout',  () => { tooltip.setVisible(false); rBg.setStrokeStyle(1, 0x00f2ff, 0.3); });
            });
        }

        // Botón Cerrar
        const closeContainer = this.add.container(cx, cy + panelH/2 - 35);
        const closeBg = this.add.rectangle(0, 0, 200, 40, 0x00f2ff, 0.1).setInteractive();
        closeBg.setStrokeStyle(1, 0x00f2ff, 0.5);
        const closeText = this.add.text(0, 0, "CERRAR (TAB)", { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fill: '#fff', fontStyle: 'bold' 
        }).setOrigin(0.5);
        closeContainer.add([closeBg, closeText]);
        
        closeBg.on('pointerover', () => { closeBg.setFillStyle(0x00f2ff, 0.3); this.tweens.add({ targets: closeContainer, scale: 1.05, duration: 200 }); });
        closeBg.on('pointerout', () => { closeBg.setFillStyle(0x00f2ff, 0.1); this.tweens.add({ targets: closeContainer, scale: 1, duration: 200 }); });
        closeBg.on('pointerdown', () => this.closeInventory());

        this.input.keyboard.on('keydown-I', () => this.closeInventory());
        this.input.keyboard.on('keydown-TAB', () => this.closeInventory());
        this.input.keyboard.on('keydown-ESC', () => this.closeInventory());
    }

    createWeaponInfo(x, y, name, unlocked, isEquipped) {
        const bg = this.add.rectangle(x, y, 320, 50, 0xffffff, 0.03).setOrigin(0, 0.5);
        if (isEquipped) bg.setStrokeStyle(1, 0x00f2ff, 0.8);
        
        const color = unlocked ? '#fff' : '#444';
        this.add.text(x + 15, y, name, { 
            fontFamily: 'Inter, sans-serif', fontSize: '15px', fill: color, fontWeight: 'bold' 
        }).setOrigin(0, 0.5);

        if (isEquipped) {
            this.add.text(x + 305, y, "ACTIVE", { 
                fontFamily: 'Orbitron, sans-serif', fontSize: '10px', fill: '#00f2ff' 
            }).setOrigin(1, 0.5);
        } else if (!unlocked) {
            this.add.text(x + 305, y, "LOCKED", { 
                fontFamily: 'Orbitron, sans-serif', fontSize: '10px', fill: '#ff0000' 
            }).setOrigin(1, 0.5);
        }
    }

    closeInventory() {
        this.scene.stop();
        this.scene.resume('MainScene');
    }
}
