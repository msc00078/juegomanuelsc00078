import EnemyBase from './base/EnemyBase';

export class StandardEnemy extends EnemyBase {
  constructor(scene, x, y) {
    super(scene, x, y, 30, 110, 0x004400, 25);
    this.name = 'Ente Glitch';
    this.contactDamage = 6;
  }

  _handleSpecialAbilities(playerSprite, time) {
    if (this.isDashing) return;

    // Comportamiento de ataque a distancia para Estándar de alto nivel (Rango 5+)
    if (this.tier >= 5 && Math.random() < 0.012 && (!this.lastShotTime || time > this.lastShotTime + 3500)) {
      this.lastShotTime = time;
      this.scene.spawnEnemyArrow?.(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y);
      return;
    }

    super._handleSpecialAbilities?.(playerSprite, time);
  }
}
