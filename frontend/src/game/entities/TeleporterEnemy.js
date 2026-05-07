import * as Phaser from 'phaser';
import EnemyBase from './base/EnemyBase';

export class TeleporterEnemy extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 35, 90, 0x9900cc, 22);
    this.name = 'Fase Corrupta';
    this.contactDamage = 18;
    this.lastTeleportTime = 0;
    this.teleportCooldown = 4500;
    this.sprite.setStrokeStyle(3, 0xdd88ff);
  }

  update(playerSprite, time) {
    if (this.isDead) return;
    if (!this.sprite?.active || !playerSprite?.active) return;

    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y
    );

    if (time > this.lastTeleportTime + this.teleportCooldown && dist > 80) {
      this.lastTeleportTime = time;
      this._teleport(playerSprite);
    } else {
      if (dist < 150) {
        const angle = Phaser.Math.Angle.Between(
          playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y
        );
        this.sprite.body.setVelocity(
          Math.cos(angle) * this.speed, Math.sin(angle) * this.speed
        );
      } else {
        this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed * 0.6);
      }
    }
    this._updateAuras();
  }

  _teleport(playerSprite) {
    if (!this.sprite?.active) return;
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        if (this.isDead || !this.sprite?.active) return;
        const angle = Phaser.Math.Angle.Between(
          playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y
        );
        const offsetX = Math.cos(angle + Math.PI) * 15;
        const offsetY = Math.sin(angle + Math.PI) * 15;
        this.sprite.setPosition(
          Phaser.Math.Clamp(playerSprite.x + offsetX, 20, this.scene.scale.width - 20),
          Phaser.Math.Clamp(playerSprite.y + offsetY, 90, this.scene.scale.height - 20)
        );
        this._updateAuras();
        this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 200 });
        this.scene.createParticles?.(this.sprite.x, this.sprite.y, 0x9900cc);
      }
    });
  }
}
