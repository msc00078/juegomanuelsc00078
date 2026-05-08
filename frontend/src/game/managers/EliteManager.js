import * as Phaser from 'phaser';
import { LaserEliteEnemy, applyEnemyScaling } from '../entities';

export class EliteManager {
    constructor(scene) {
        this.scene = scene;
    }

    showPrompt() {
        const { scene } = this;
        const cx = scene.scale.width / 2;
        const cy = scene.scale.height / 2;
        const bg = scene.add.rectangle(cx, cy, 540, 260, 0x000000, 0.95).setDepth(200).setStrokeStyle(2, 0x00ffff);

        const title = scene.add.text(cx, cy - 90, "ANOMALÍA DETECTADA", { fontSize: '28px', fill: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(201);
        const desc = scene.add.text(cx, cy - 40, "Un Ente Aumentado ha bloqueado el flujo del código.\n¿Intentarás purgarlo o buscarás un bypass?", {
            fontSize: '16px', fill: '#fff', align: 'center'
        }).setOrigin(0.5).setDepth(201);

        const fightBtn = scene.add.rectangle(cx - 120, cy + 50, 180, 55, 0x00ffff).setInteractive().setDepth(201);
        const fightTxt = scene.add.text(cx - 120, cy + 50, "PURGAR ENTE", { fontSize: '18px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5).setDepth(202);

        const relics = scene.registry.get('relics') || [];
        let baseProb = Phaser.Math.Between(30, 70);
        if (relics.includes('bypass_key')) baseProb += 25;
        if (baseProb > 95) baseProb = 95;

        const escapeBtn = scene.add.rectangle(cx + 120, cy + 50, 180, 55, 0x333333).setInteractive().setDepth(201);
        const escapeTxt = scene.add.text(cx + 120, cy + 50, `BYPASS (${baseProb}%)`, { fontSize: '18px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(202);

        const cleanup = () => {
            bg.destroy(); title.destroy(); desc.destroy();
            fightBtn.destroy(); fightTxt.destroy();
            escapeBtn.destroy(); escapeTxt.destroy();
        };

        fightBtn.on('pointerover', () => fightBtn.setFillStyle(0xee0000));
        fightBtn.on('pointerout', () => fightBtn.setFillStyle(0xaa0000));

        fightBtn.on('pointerdown', () => {
            fightBtn.disableInteractive();
            escapeBtn.disableInteractive();
            cleanup();
            scene.isWaitingForElite = false;
            this.spawnElite();
        });

        escapeBtn.on('pointerover', () => escapeBtn.setFillStyle(0x777777));
        escapeBtn.on('pointerout', () => escapeBtn.setFillStyle(0x555555));

        escapeBtn.on('pointerdown', () => {
            fightBtn.disableInteractive();
            escapeBtn.disableInteractive();
            if (Math.random() * 100 <= baseProb) {
                const msg = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 + 80, "¡Escapaste con éxito!", { fontSize: '24px', fill: '#00ff00', backgroundColor: '#000' }).setOrigin(0.5).setDepth(205);
                scene.time.delayedCall(1000, () => {
                    cleanup(); msg.destroy();
                    scene.isWaitingForElite = false;
                    scene.nodeType = 'combat';
                    scene.spawnNormalEnemies();
                });
            } else {
                const msg = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 + 80, "¡Te han atrapado!", { fontSize: '24px', fill: '#ff0000', backgroundColor: '#000' }).setOrigin(0.5).setDepth(205);
                scene.time.delayedCall(1000, () => {
                    cleanup(); msg.destroy();
                    scene.isWaitingForElite = false;
                    this.spawnElite();
                });
            }
        });
    }

    spawnElite() {
        const { scene } = this;
        const eliteLevel = scene.currentLevel + 2;
        let elite = new LaserEliteEnemy(scene, scene.scale.width / 2, 220);

        applyEnemyScaling(elite, eliteLevel);
        elite.applyAlpha();

        elite.hp = Math.round(elite.hp * 1.2);
        elite.maxHp = elite.hp;
        elite.contactDamage = Math.round(elite.contactDamage * 1.1);
        elite.sprite.setScale(elite.sprite.scaleX * 1.2);

        scene.enemies.push(elite);
        scene.setupEnemyCollisions(elite);

        if (scene.bossText && scene.bossText.active) {
            scene.bossText.setText("¡ADVERTENCIA: ANOMALÍA CRÍTICA!");
            scene.bossText.setFill("#ff00ff");
        }
    }
}
