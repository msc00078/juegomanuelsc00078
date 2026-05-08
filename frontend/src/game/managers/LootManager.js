import * as Phaser from 'phaser';

export class LootManager {
    constructor(scene) {
        this.scene = scene;
    }

    spawnGold(x, y) {
        const goldCoin = this.scene.add.circle(x, y, 6, 0xffd700);
        this.scene.physics.add.existing(goldCoin);
        this.scene.golds.add(goldCoin);
    }

    spawnHealth(x, y) {
        const heart = this.scene.add.rectangle(x, y, 12, 12, 0xff0000);
        this.scene.physics.add.existing(heart);
        this.scene.hearts.add(heart);
    }

    spawnXp(x, y) {
        const orb = this.scene.add.circle(x, y, 6, 0x00ffff);
        orb.setStrokeStyle(2, 0xffffff);
        this.scene.physics.add.existing(orb);
        this.scene.xpOrbs.add(orb);
        orb.body.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
    }

    gainXp(amount) {
        const combo = this.scene.registry.get('combo') || 0;
        const multiplier = 1 + (combo * 0.05);
        let xp = this.scene.registry.get('runXp') + (amount * multiplier);
        let next = this.scene.registry.get('xpToNext');
        let level = this.scene.registry.get('runLevel');

        if (xp >= next) {
            xp -= next;
            level++;
            next = Math.floor(next * 1.5);
            this.scene.registry.set('runLevel', level);
            this.scene.registry.set('xpToNext', next);
            this.scene.levelUp();
        }
        this.scene.registry.set('runXp', xp);
        this.scene.updateUI();
    }

    updateMagnetism() {
        const { scene } = this;

        scene.xpOrbs.getChildren().forEach(orb => {
            if (orb && orb.active) {
                const dist = Phaser.Math.Distance.Between(orb.x, orb.y, scene.player.sprite.x, scene.player.sprite.y);
                if (dist < 150) {
                    const angle = Phaser.Math.Angle.Between(orb.x, orb.y, scene.player.sprite.x, scene.player.sprite.y);
                    orb.body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
                } else {
                    orb.body.setVelocity(orb.body.velocity.x * 0.95, orb.body.velocity.y * 0.95);
                }
            }
        });

        const relics = scene.registry.get('relics') || [];
        if (relics.includes('iman')) {
            scene.golds.getChildren().forEach(gold => {
                if (gold && gold.active) {
                    const dist = Phaser.Math.Distance.Between(scene.player.sprite.x, scene.player.sprite.y, gold.x, gold.y);
                    if (dist < 200) scene.physics.moveToObject(gold, scene.player.sprite, 300);
                }
            });
        }
    }
}
