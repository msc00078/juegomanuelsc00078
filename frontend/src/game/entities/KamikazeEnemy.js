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
    const x = this.sprite.x, y = this.sprite.y;
    
    // Llamar a die() asegura que se limpie la barra de HP, auras y se suelte loot
    this.die();
    
    this.scene.explodeBomb?.(x, y);
  }
}
