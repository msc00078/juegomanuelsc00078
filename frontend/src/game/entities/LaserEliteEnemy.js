import * as Phaser from 'phaser';
import EnemyBase from './base/EnemyBase';

export class LaserEliteEnemy extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 180, 60, 0xff00ff, 50);
    this.name = 'Anomalía de Bypass';
    this.lastLaserTime = 0;
    this.laserCooldown = 3000;
    this.isFiringLaser = false;
  }

  update(playerSprite, time) {
    if (!this.sprite?.active || this.isDead) return;
    
    if (this.isFiringLaser) {
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      return;
    }
    
    super.update(playerSprite, time);

    if (time > this.lastLaserTime + this.laserCooldown) {
      this.lastLaserTime = time;
      this._fireLaser(playerSprite);
    }
  }

  _fireLaser(playerSprite) {
    if (!this.sprite?.active || this.isDead) return;
    
    this.isFiringLaser = true;
    this.sprite.setFillStyle(0xffffff);
    
    const lockedAngle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y);
    
    const line = this.scene.add.line(0, 0, this.sprite.x, this.sprite.y, 
      this.sprite.x + Math.cos(lockedAngle) * 1200, 
      this.sprite.y + Math.sin(lockedAngle) * 1200, 
      0xff00ff, 0.3).setOrigin(0).setDepth(50);
    
    this.scene.time.delayedCall(500, () => {
      line.destroy();
      if (!this.sprite?.active || this.isDead) {
        this.isFiringLaser = false;
        return;
      }

      this.scene.createParticles?.(this.sprite.x, this.sprite.y, 0xff00ff);
      
      const laser = this.scene.add.rectangle(
        this.sprite.x + Math.cos(lockedAngle) * 600, 
        this.sprite.y + Math.sin(lockedAngle) * 600, 
        1200, 15, 0xff00ff, 1
      ).setRotation(lockedAngle).setDepth(51);

      this.scene.physics.add.existing(laser, true);
      
      this.scene.physics.add.overlap(this.scene.player.sprite, laser, () => {
        this.scene.player.takeDamage(25);
      });

      this.scene.tweens.add({
        targets: laser,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          laser.destroy();
          this.isFiringLaser = false;
          if (this.sprite?.active && !this.isDead) this.sprite.setFillStyle(this.color);
        }
      });
    });
  }
}
