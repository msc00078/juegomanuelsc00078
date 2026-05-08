import * as Phaser from 'phaser';

export class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
    }

    spawnCrates() {
        const { scene } = this;
        const level = scene.currentLevel;
        const count = 4 + Math.floor(level / 3);

        for (let i = 0; i < count; i++) {
            const rx = Phaser.Math.Between(150, scene.scale.width - 150);
            const ry = Phaser.Math.Between(150, scene.scale.height - 250);

            const obstacle = scene.add.rectangle(rx, ry, 30, 30, 0x5d4037).setStrokeStyle(2, 0x3e2723);
            scene.physics.add.existing(obstacle, true);
            scene.crates.add(obstacle);

            const rand = Math.random();

            if (rand < 0.2) {
                obstacle.isIndestructible = true;
                obstacle.setFillStyle(0x444444);
                obstacle.setStrokeStyle(2, 0xffffff);
            } else if (rand < 0.35) {
                obstacle.doesDamage = true;
                obstacle.setFillStyle(0xcc0000);
                obstacle.setStrokeStyle(2, 0xff00ff);
                obstacle.body.setSize(45, 45);
                obstacle.body.setOffset(-7.5, -7.5);
                if (obstacle.body.updateFromGameObject) obstacle.body.updateFromGameObject();
                scene.tweens.add({
                    targets: obstacle,
                    alpha: 0.6,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }

            if (obstacle.doesDamage) {
                const spike = scene.add.rectangle(rx, ry, 15, 15, 0xffffff, 0.8).setAngle(45);
                obstacle.spike = spike;
            }
        }
    }

    destroyCrate(crate) {
        const { scene } = this;
        if (!crate || !crate.active || crate.isIndestructible) return;
        const x = crate.x;
        const y = crate.y;
        if (crate.spike) crate.spike.destroy();
        crate.destroy();
        scene.createParticles(x, y, 0x5d4037);

        if (Math.random() < 0.4) {
            if (Math.random() < 0.2) scene.spawnHealth(x, y);
            else scene.spawnGold(x, y);
        }
    }
}
