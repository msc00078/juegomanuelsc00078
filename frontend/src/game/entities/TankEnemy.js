import EnemyBase from './base/EnemyBase';

export class TankEnemy extends EnemyBase {
  constructor(scene, x, y) {
    // MUCHA más vida base (250) y más lento
    super(scene, x, y, 250, 45, 0x555555, 45);
    this.name = 'Protector Aumentado';
    this.contactDamage = 12;
  }

  applyVariant(level) {
    super.applyVariant(level);
    // Multiplicador extra de vida para el Tanque
    this.hp = Math.round(this.hp * 1.85);
    this.maxHp = this.hp;
    // El tanque es aún más grande
    this.sprite.setScale(this.currentScale * 1.25);
  }

  _handleSpecialAbilities(playerSprite, time) {
    if (this.isDashing) return;
    // El tanque tiene una embestida pesada
    if (this.tier >= 3 && Math.random() < 0.009 && (!this.lastSpecialTime || time > this.lastSpecialTime + 4500)) {
      this.lastSpecialTime = time;
      this._doCharge(playerSprite);
    }
  }

  _doCharge(playerSprite) {
    if (!this.sprite || !this.sprite.body) return;
    this.isDashing = true;
    this.sprite.setAlpha(0.8);
    const chargeSpeed = this.speed * 2.5;
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y);
    this.sprite.body.setVelocity(Math.cos(angle) * chargeSpeed, Math.sin(angle) * chargeSpeed);
    this.scene.time.delayedCall(800, () => {
      this.isDashing = false;
      this.sprite.setAlpha(1);
    });
  }
}
