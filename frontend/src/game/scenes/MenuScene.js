import * as Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x1a1a1a);
        this.add.grid(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 64, 64, 0x222222, 1, 0x333333, 1);

        this.add.text(this.scale.width / 2, this.scale.height * 0.22, "AI BOSS ARENA", { fontSize: '72px', fill: '#ffcc00', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
        this.add.text(this.scale.width / 2, this.scale.height * 0.36, "A Roguelite Experience", { fontSize: '28px', fill: '#fff' }).setOrigin(0.5);

        const playBtn = this.add.rectangle(this.scale.width / 2, this.scale.height * 0.52, 300, 70, 0x0077ff).setInteractive();
        playBtn.setStrokeStyle(4, 0xffffff);
        this.add.text(this.scale.width / 2, this.scale.height * 0.52, "JUGAR", { fontSize: '34px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        const upgradeBtn = this.add.rectangle(this.scale.width / 2, this.scale.height * 0.67, 300, 70, 0x7700ff).setInteractive();
        upgradeBtn.setStrokeStyle(4, 0xffffff);
        this.add.text(this.scale.width / 2, this.scale.height * 0.67, "MEJORAS", { fontSize: '34px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

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
            
            // Inicializar XP y Niveles de Run
            this.registry.set('runXp', 0);
            this.registry.set('runLevel', 1);
            this.registry.set('xpToNext', 50);
            this.registry.set('combo', 0);
            this.registry.set('maxCombo', 0);
            
            this.registry.set('nextNodeType', 'combat'); // Empezar con combate
            this.scene.start('MainScene');
        });

        this.add.text(this.scale.width / 2, this.scale.height * 0.88, "Usa WASD/Flechas para moverte y ESPACIO para atacar.\nSHIFT para Dash (I-Frames). Botones 1, 2, 3 cambio arma.", { fontSize: '16px', fill: '#aaa', align: 'center' }).setOrigin(0.5);
    }
}
