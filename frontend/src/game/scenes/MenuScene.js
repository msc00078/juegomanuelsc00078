import * as Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x1a1a1a);
        this.add.grid(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 64, 64, 0x222222, 1, 0x333333, 1);

        this.add.text(this.scale.width / 2, this.scale.height * 0.22, "NEÓN SAGRADO", { fontSize: '72px', fill: '#ffcc00', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
        this.add.text(this.scale.width / 2, this.scale.height * 0.36, "Un error en el sistema. Tú no deberías existir.", { fontSize: '22px', fill: '#aaffff' }).setOrigin(0.5);

        const playBtn = this.add.rectangle(this.scale.width / 2, this.scale.height * 0.52, 300, 70, 0x0077ff).setInteractive();
        playBtn.setStrokeStyle(4, 0xffffff);
        this.add.text(this.scale.width / 2, this.scale.height * 0.52, "JUGAR", { fontSize: '34px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        const upgradeBtn = this.add.rectangle(this.scale.width / 2, this.scale.height * 0.67, 300, 70, 0x7700ff).setInteractive();
        upgradeBtn.setStrokeStyle(4, 0xffffff);
        this.add.text(this.scale.width / 2, this.scale.height * 0.67, "EL REFUGIO NEÓN", { fontSize: '28px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        // Parpadeo botón
        this.tweens.add({ targets: playBtn, alpha: 0.7, duration: 800, yoyo: true, repeat: -1 });

        playBtn.on('pointerover', () => playBtn.setFillStyle(0x0055cc));
        playBtn.on('pointerout', () => playBtn.setFillStyle(0x0077ff));
        
        upgradeBtn.on('pointerover', () => upgradeBtn.setFillStyle(0x5500aa));
        upgradeBtn.on('pointerout', () => upgradeBtn.setFillStyle(0x7700ff));
        upgradeBtn.on('pointerdown', () => this.scene.start('UpgradeScene'));

        playBtn.on('pointerdown', () => {
            let savedMeta = JSON.parse(localStorage.getItem('metaStats')) || {};
            let meta = {
                hpLevel: savedMeta.hpLevel || 0,
                dmgLevel: savedMeta.dmgLevel || 0,
                speedLevel: savedMeta.speedLevel || 0
            };
            
            // Reiniciar estado global con bonos
            this.registry.set('currentLevel', 1);
            this.registry.set('gold', 0);
            this.registry.set('playerHp', 100 + (meta.hpLevel * 10));
            this.registry.set('playerMaxHp', 100 + (meta.hpLevel * 10));
            this.registry.set('swordDamage', 10 + (meta.dmgLevel * 2));
            this.registry.set('bonusSpeed', meta.speedLevel * 0.05); // +5% por nivel
            
            this.registry.set('hasBow', false);
            this.registry.set('hasBombs', false);
            this.registry.set('equippedWeapon', 1);
            this.registry.set('relics', []);
            
            this.registry.set('runXp', 0);
            this.registry.set('runLevel', 1);
            this.registry.set('xpToNext', 100); // Mundo hostil: XP difícil de ganar
            this.registry.set('combo', 0);
            this.registry.set('maxCombo', 0);
            
            this.registry.set('nextNodeType', 'combat'); // Empezar con combate
            this.scene.start('MainScene');
        });

        this.add.text(this.scale.width / 2, this.scale.height * 0.88, "Los dioses murieron... y ahora venden upgrades.\nWASD/Flechas: Moverse | ESPACIO: Atacar | SHIFT: Dash | 1,2,3: Arma", { fontSize: '14px', fill: '#888', align: 'center' }).setOrigin(0.5);
    }
}
