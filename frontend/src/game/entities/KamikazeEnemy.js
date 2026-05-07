import * as Phaser from 'phaser';
import EnemyBase from './base/EnemyBase';

export class KamikazeEnemy extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 10, 250, 0x880088, 15);
    this.name = 'Fragmento Volátil';
    this.contactDamage = 20;
  }

  update(playerSprite) {
    if (this.isDead) return;
    if (!this.sprite?.active) return;
    if (!playerSprite?.active) {
      this.sprite.body?.setVelocity(0);
      return;
    }
    this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed);
    const dist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y
    );
    if (dist < 40) this.explode();
  }

  explode() {
    if (this.isDead) return;
    this.isDead = true;
    this.hp = 0;
    const x = this.sprite.x, y = this.sprite.y;
    this._alphaAura?.destroy();
    this._alphaAuraOuter?.destroy();
    this._alphaCrown?.destroy();
    this._eliteAura?.destroy();
    this.sprite?.destroy();
    this.scene.explodeBomb?.(x, y, 30);
    const idx = this.scene.enemies.indexOf(this);
    if (idx !== -1) this.scene.enemies.splice(idx, 1);
  }
}
