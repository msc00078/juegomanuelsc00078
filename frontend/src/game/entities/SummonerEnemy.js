import * as Phaser from 'phaser';
import EnemyBase from './base/EnemyBase';
import { StandardEnemy } from './StandardEnemy';

export class SummonerEnemy extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 50, 60, 0x00ff00, 30);
    this.name = 'Oráculo Roto';
    this.lastSummonTime = 0;
    this.contactDamage = 4;
    this.sprite.setStrokeStyle(3, 0xffffff);
  }

  update(playerSprite, time) {
    if (this.isDead) return;
    if (!this.sprite?.active || !playerSprite?.active) return;
    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y
    );
    if (dist < 300) {
      const angle = Phaser.Math.Angle.Between(
        playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y
      );
      this.sprite.body.setVelocity(
        Math.cos(angle) * this.speed, Math.sin(angle) * this.speed
      );
    } else {
      this.sprite.body.setVelocity(0, 0);
    }
    this._updateAuras();
    if (time > this.lastSummonTime + 5000) {
      this.lastSummonTime = time;
      this._summon();
    }
  }

  _summon() {
    if (this.scene.enemies.length > 12) return;
    this.scene.createParticles?.(this.sprite.x, this.sprite.y, 0x00ff00);
    const rx = this.sprite.x + Phaser.Math.Between(-40, 40);
    const ry = this.sprite.y + Phaser.Math.Between(-40, 40);
    const minion = new StandardEnemy(this.scene, rx, ry);
    minion.hp = 15;
    minion.maxHp = 15;
    minion.sprite.setScale(0.7);
    this.scene.enemies.push(minion);
    this.scene.setupEnemyCollisions?.(minion);
    this.scene.tweens.add({ targets: minion.sprite, alpha: { from: 0, to: 1 }, duration: 500 });
  }
}
