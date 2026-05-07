import * as Phaser from 'phaser';
import EnemyBase from './base/EnemyBase';

export class HealerEnemy extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 40, 70, 0x00cc44, 28);
    this.name = 'Parche de Sistema';
    this.contactDamage = 3;
    this.lastHealTime = 0;
    this.healCooldown = 3500;
    this.healRadius = 160;
    this.healAmount = 8;
    this.sprite.setStrokeStyle(3, 0x00ff88);
  }

  update(playerSprite, time) {
    if (this.isDead) return;
    if (!this.sprite?.active || !playerSprite?.active) return;

    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y
    );
    const fleeAngle = Phaser.Math.Angle.Between(
      playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y
    );
    if (dist < 280) {
      this.sprite.body.setVelocity(
        Math.cos(fleeAngle) * this.speed,
        Math.sin(fleeAngle) * this.speed
      );
    } else {
      this.sprite.body.setVelocity(0, 0);
    }

    this._updateAuras();

    if (time > this.lastHealTime + this.healCooldown) {
      this.lastHealTime = time;
      this._healNearby();
    }
  }

  _healNearby() {
    if (!this.sprite?.active) return;
    let healed = false;
    this.scene.enemies.forEach(e => {
      if (e === this || e.isDead || !e.sprite?.active) return;
      const d = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y, e.sprite.x, e.sprite.y
      );
      if (d < this.healRadius && e.hp < e.maxHp) {
        e.hp = Math.min(e.hp + this.healAmount, e.maxHp);
        healed = true;
        this.scene.createParticles?.(e.sprite.x, e.sprite.y, 0x00ff44);
      }
    });
    if (healed) {
      this.scene.createParticles?.(this.sprite.x, this.sprite.y, 0x00ff88);
    }
  }
}
