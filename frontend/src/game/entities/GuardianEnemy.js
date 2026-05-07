import * as Phaser from 'phaser';
import EnemyBase from './base/EnemyBase';

export class GuardianEnemy extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 120, 40, 0x334455, 45);
    this.name = 'Centinela Blindado';
    this.contactDamage = 10;
    this.sprite.setStrokeStyle(5, 0x88ccff);

    this._shieldIndicator = scene.add.rectangle(
      x, y - 30, 50, 8, 0x88ccff, 0.9
    ).setDepth(10);
  }

  update(playerSprite, time) {
    if (this.isDead) return;
    if (!this.sprite?.active || !playerSprite?.active) return;

    this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed);

    if (this._shieldIndicator?.active) {
      this._shieldIndicator.setPosition(this.sprite.x, this.sprite.y - 28);
    }
    this._updateAuras();

    this.isShielded = true; 
  }

  isHitFromBehind(attackX, attackY, playerX, playerY) {
    if (!this.sprite?.active) return true;
    const frontAngle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y, playerX, playerY
    );
    const attackAngle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y, attackX, attackY
    );
    const diff = Math.abs(Phaser.Math.Angle.Wrap(attackAngle - frontAngle));
    return diff > Math.PI * 0.55; 
  }

  die() {
    this._shieldIndicator?.destroy();
    super.die();
  }
}
