import * as Phaser from 'phaser';
import EnemyBase from './base/EnemyBase';

export class RangedEnemy extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 20, 80, 0xaa5500, 25);
    this.name = 'Cazador de Datos';
    this.lastShotTime = 0;
    this.contactDamage = 4;
  }

  update(playerSprite, time) {
    if (this.isDead) return;
    if (!this.sprite?.active) return;
    if (!playerSprite?.active) {
      this.sprite.body?.setVelocity(0);
      return;
    }
    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y
    );
    if (dist < 200) {
      const angle = Phaser.Math.Angle.Between(
        playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y
      );
      this.sprite.body.setVelocity(
        Math.cos(angle) * this.speed, Math.sin(angle) * this.speed
      );
    } else if (dist > 300) {
      this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed);
    } else {
      this.sprite.body.setVelocity(0, 0);
    }
    this._updateAuras();
    if (time > this.lastShotTime + 2000 && dist < 400) {
      this.lastShotTime = time;
      this.scene.spawnEnemyArrow?.(
        this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y
      );
    }
  }
}
