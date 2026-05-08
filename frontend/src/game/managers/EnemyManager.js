export class EnemyManager {
    constructor(scene) {
        this.scene = scene;
    }

    onEnemyDeath(enemy) {
        const { scene } = this;
        scene.lastKillTime = scene.time.now;
        const currentCombo = scene.registry.get('combo') || 0;
        scene.registry.set('combo', currentCombo + 1);

        const points = Math.floor((enemy.maxHp / 10) + (currentCombo * 2));
        scene.score += points;
        scene.registry.set('score', scene.score);

        scene.cameras.main.shake(100, 0.005);
        scene.updateUI();
    }

    drawHealthBar(enemy) {
        const { scene } = this;
        if (!enemy.hpBarGfx) {
            enemy.hpBarGfx = scene.add.graphics().setDepth(50);
        }
        enemy.hpBarGfx.clear();
        if (enemy.hp < enemy.maxHp) {
            const x = enemy.sprite.x - 20;
            const y = enemy.sprite.y - 40;
            enemy.hpBarGfx.fillStyle(0x000000, 0.5);
            enemy.hpBarGfx.fillRect(x, y, 40, 5);
            enemy.hpBarGfx.fillStyle(0xff0000, 1);
            enemy.hpBarGfx.fillRect(x, y, 40 * (enemy.hp / enemy.maxHp), 5);
        }
    }
}
