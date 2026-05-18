import * as Phaser from 'phaser';

export class CombatManager {
    constructor(scene) {
        this.scene = scene;
    }

    getPlayerDamage() {
        let dmg = Number(this.scene.registry.get('swordDamage'));
        if (isNaN(dmg) || dmg <= 0) dmg = 10;
        const relics = this.scene.registry.get('relics') || [];
        if (relics.includes('berserker') && this.scene.player.hp < (this.scene.player.maxHp * 0.3)) {
            dmg = dmg * 1.5;
        }
        return dmg;
    }

    spawnArrow(x, y, facing, angleOffset = 0) {
        const arrow = this.scene.add.rectangle(x, y, 10, 4, 0xffff00);
        this.scene.physics.add.existing(arrow);
        this.scene.arrows.add(arrow);

        let baseSpeed = 400;
        let angle = 0;
        if (facing === 1) angle = 0;
        else if (facing === -1) angle = Math.PI;
        else if (facing === 2) angle = -Math.PI / 2;
        else if (facing === -2) angle = Math.PI / 2;
        angle += angleOffset;

        arrow.body.setVelocity(Math.cos(angle) * baseSpeed, Math.sin(angle) * baseSpeed);
        arrow.setRotation(angle);
        this.scene.time.delayedCall(1000, () => { if (arrow.active) arrow.destroy() });
    }

    spawnEnemyBomb(x, y, damage = 30) {
        const bomb = this.scene.add.circle(x, y, 12, 0x000000);
        bomb.setStrokeStyle(3, 0xff0000);
        this.scene.tweens.add({ targets: bomb, scale: 1.3, duration: 250, yoyo: true, repeat: 5 });

        this.scene.time.delayedCall(1500, () => {
            if (!bomb.active) return;
            this.scene.createParticles(bomb.x, bomb.y, 0xffaa00);

            const explosion = this.scene.add.circle(bomb.x, bomb.y, 80, 0xff0000, 0.4);
            this.scene.tweens.add({ targets: explosion, alpha: 0, duration: 400, onComplete: () => explosion.destroy() });

            const dist = Phaser.Math.Distance.Between(bomb.x, bomb.y, this.scene.player.sprite.x, this.scene.player.sprite.y);
            if (dist < 90 && !this.scene.gameOver) {
                this.scene.player.takeDamage(damage);
                this.scene.updateUI();
            }
            bomb.destroy();
        });
    }

    spawnBomb(x, y, isSticky = false) {
        const bomb = this.scene.add.circle(x, y, 10, 0x000000);
        bomb.setStrokeStyle(2, 0xff0000);
        this.scene.physics.add.existing(bomb);
        this.scene.tweens.add({ targets: bomb, scale: 1.2, duration: 200, yoyo: true, repeat: 9 });

        if (isSticky) {
            let targets = this.scene.enemies.reduce((acc, e) => {
                if (e.hp > 0 && e.sprite) acc.push(e.sprite);
                return acc;
            }, []);
            if (this.scene.bosses) {
                this.scene.bosses.forEach(b => {
                    if (b.hp > 0) targets.push(b.sprite);
                });
            }

            let closest = this.scene.physics.closest(bomb, targets);
            if (closest) {
                this.scene.time.addEvent({
                    delay: 50,
                    repeat: 40,
                    callback: () => {
                        if (bomb.active && closest.active) {
                            this.scene.physics.moveToObject(bomb, closest, 250);
                        }
                    }
                });
            }
        }

        this.scene.time.delayedCall(2000, () => {
            this.explodeBomb(bomb.x, bomb.y);
            bomb.destroy();
        });
    }

    explodeBomb(x, y) {
        const relics = this.scene.registry.get('relics') || [];
        let radius = relics.includes('polvora') ? 150 : 100;
        const explosion = this.scene.add.circle(x, y, radius, 0xff8800, 0.6);
        this.scene.tweens.add({ targets: explosion, alpha: 0, duration: 300, onComplete: () => explosion.destroy() });
        this.scene.createParticles(x, y, 0xffaa00);
        this.scene.cameras.main.shake(200, 0.01);

        const distToPlayer = Phaser.Math.Distance.Between(x, y, this.scene.player.sprite.x, this.scene.player.sprite.y);
        if (distToPlayer <= radius && !this.scene.player.isInvulnerable) {
            this.scene.player.takeDamage(25);
            this.scene.updateUI();
        }

        if (this.scene.isBossLevel && this.scene.bosses) {
            this.scene.bosses.forEach(boss => {
                if (boss.hp > 0) {
                    const dist = Phaser.Math.Distance.Between(x, y, boss.sprite.x, boss.sprite.y);
                    if (dist <= radius + 50) {
                        boss.takeDamage(50);
                        this.scene.updateUI();
                    }
                }
            });
        }
        this.scene.enemies.forEach(enemy => {
            if (enemy.hp > 0 && enemy.sprite && enemy.sprite.active) {
                const dist = Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y);
                if (dist <= radius + 15) {
                    enemy.takeDamage(50);
                }
            }
        });
    }

    spawnEnemyArrow(ex, ey, px, py) {
        if (this.scene.gameOver) return;
        const arrow = this.scene.add.rectangle(ex, ey, 10, 10, 0xff0000);
        this.scene.physics.add.existing(arrow);
        this.scene.enemyArrows.add(arrow);
        const angle = Phaser.Math.Angle.Between(ex, ey, px, py);
        const speed = 250;
        arrow.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.scene.time.delayedCall(1500, () => { if (arrow.active) arrow.destroy() });
    }

    cycleWeapon() {
        if (this.scene.gameOver) return;
        let current = this.scene.registry.get('equippedWeapon') || 1;
        let next = current + 1;
        if (next > 3) next = 1;
        if (next === 2 && !this.scene.registry.get('hasBow')) next = 3;
        if (next === 3 && !this.scene.registry.get('hasBombs')) next = 1;
        this.scene.player.equipWeapon(next);
    }
}
