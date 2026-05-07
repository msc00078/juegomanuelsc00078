import * as Phaser from 'phaser';
import EnemyBase from './base/EnemyBase';

export class TrapperEnemy extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 30, 65, 0xcc8800, 24);
    this.name = 'Glitch Trampa';
    this.contactDamage = 4;
    this.lastTrapTime = 0;
    this.trapCooldown = 3000;
    this.sprite.setStrokeStyle(3, 0xffcc00);
  }

  update(playerSprite, time) {
    if (this.isDead) return;
    if (!this.sprite?.active || !playerSprite?.active) return;

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
    } else if (dist > 320) {
      this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed * 0.5);
    } else {
      this.sprite.body.setVelocity(0, 0);
    }

    this._updateAuras();

    if (time > this.lastTrapTime + this.trapCooldown) {
      this.lastTrapTime = time;
      this._placeTrap(playerSprite.x, playerSprite.y);
    }
  }

  _placeTrap(targetX, targetY) {
    if (!this.sprite?.active) return;
    const tx = targetX + (Math.random() - 0.5) * 15;
    const ty = targetY + (Math.random() - 0.5) * 15;

    const trap = this.scene.add.circle(tx, ty, 30, 0xffcc00, 0.35);
    trap.setStrokeStyle(2, 0xff8800);
    this.scene.physics.add.existing(trap, true); 

    this.scene.time.delayedCall(5000, () => { if (trap.active) trap.destroy(); });

    if (this.scene.trapZones) this.scene.trapZones.add(trap);

    this.scene.tweens.add({ targets: trap, alpha: { from: 0, to: 0.35 }, duration: 300 });
  }
}
