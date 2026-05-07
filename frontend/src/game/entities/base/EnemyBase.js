import * as Phaser from 'phaser';

/**
 * Clase base para todos los enemigos del juego.
 * Contiene lógica compartida como vida, movimiento, daño y muerte.
 * Cada enemigo concreto extenderá esta clase y sobrescribirá los métodos necesarios.
 */
export default class EnemyBase {
  constructor(scene, x, y, hp, speed, color, size) {
    this.scene = scene;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.color = color;
    this.size = size;
    this.isDead = false;
    this.isAlpha = false;
    this.contactDamage = 5; // daño al tocar al jugador

    this.sprite = scene.add.rectangle(x, y, size, size, color);
    this.sprite.setStrokeStyle(2, 0x000000);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setBounce(0.3);
  }

  /** Aplica la variante (escalado y color) según el nivel del juego */
  applyVariant(level) {
    const statMultiplier = 1 + (level - 1) * 0.12;
    this.hp = Math.round(this.hp * statMultiplier);
    this.maxHp = this.hp;
    this.contactDamage = Math.round(this.contactDamage * statMultiplier);
    this.speed = Math.round(this.speed * (1 + (level - 1) * 0.02));
    const sizeScale = 1 + (level - 1) * 0.006;
    this.sprite.setScale(sizeScale);
    this.currentScale = sizeScale;
    const tierIndex = Math.min(Math.floor((level - 1) / 5), 19);
    this.tier = tierIndex + 1;
    const tierColors = [
      0x004400, 0x008800, 0x00cc00, 0x00ff44,
      0x008888, 0x00cccc, 0x00ffff, 0x0088ff,
      0x0000ff, 0x4400ff, 0x8800ff, 0xcc00ff,
      0xff00ff, 0xff0088, 0xff0044, 0xff0000,
      0xff4400, 0xff8800, 0xffcc00, 0xffff00
    ];
    const tierColor = tierColors[tierIndex];
    const strokeThickness = 2 + Math.floor(tierIndex / 4);
    this.sprite.setStrokeStyle(strokeThickness, tierColor);
    if (tierIndex >= 4) {
      this._eliteAura = this.scene.add.circle(
        this.sprite.x,
        this.sprite.y,
        this.size * sizeScale * 0.6,
        tierColor,
        0.15
      );
    }
    if (tierIndex >= 11 && this.scene.createParticles) {
      this._tierParticleTimer = this.scene.time.addEvent({
        delay: 1500 - tierIndex * 50,
        callback: () => {
          if (this.sprite && this.sprite.active && !this.isDead) {
            this.scene.createParticles(this.sprite.x, this.sprite.y, tierColor);
          }
        },
        loop: true
      });
    }
    if (tierIndex === 19) {
      this.sprite.setStrokeStyle(6, 0xffffff);
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.7,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }
  }

  /** Convierte este enemigo a versión Alpha (visual y de stats máxima) */
  applyAlpha() {
    this.isAlpha = true;
    this.hp = Math.round(this.hp * 2.5);
    this.maxHp = this.hp;
    this.contactDamage = Math.round(this.contactDamage * 1.8);
    this.speed = Math.round(this.speed * 1.1);
    const currentScale = this.sprite.scale;
    this.sprite.setScale(currentScale * 1.3);
    this.sprite.setStrokeStyle(5, 0xffd700);
    this._alphaAura = this.scene.add.circle(this.sprite.x, this.sprite.y, this.size * this.sprite.scale * 0.8, 0xffd700, 0.3);
    this._alphaAuraOuter = this.scene.add.circle(this.sprite.x, this.sprite.y, this.size * this.sprite.scale * 1.1, 0xffd700, 0.1);
    this.scene.tweens.add({
      targets: this._alphaAuraOuter,
      scale: 1.4,
      alpha: 0,
      duration: 1000,
      repeat: -1
    });
    this._alphaCrown = this.scene.add.rectangle(this.sprite.x, this.sprite.y - 40 * this.sprite.scale, 15, 15, 0xffd700);
    this._alphaCrown.setAngle(45);
    this._alphaCrown.setStrokeStyle(2, 0xffffff);
    this.scene.tweens.add({
      targets: this._alphaCrown,
      y: '-=10',
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /** Lógica de movimiento básico: perseguir al objetivo */
  chase(target) {
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.x, target.y);
    this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  /** Actualiza al enemigo cada frame */
  update(playerSprite, time) {
    if (this.isDead) return;
    if (!this.sprite || !this.sprite.active) return;
    if (!playerSprite || !playerSprite.active) {
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      return;
    }
    this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed);
    if (this.tier >= 3) this._handleSpecialAbilities(playerSprite, time);
    this._updateAuras();
    if (this.isBleeding && this.scene.time.now > this.nextBleedTick) {
      this.takeDamage(2);
      this.nextBleedTick = this.scene.time.now + 1000;
    }
  }

  _updateAuras() {
    if (this.sprite && this.sprite.active) {
      if (this._alphaAura) this._alphaAura.setPosition(this.sprite.x, this.sprite.y);
      if (this._alphaAuraOuter) this._alphaAuraOuter.setPosition(this.sprite.x, this.sprite.y);
      if (this._alphaCrown) this._alphaCrown.setPosition(this.sprite.x, this.sprite.y - 40 * this.sprite.scale);
      if (this._eliteAura) this._eliteAura.setPosition(this.sprite.x, this.sprite.y);
    }
  }

  _handleSpecialAbilities(playerSprite, time) {
    if (this.isDashing) return;

    // Probabilidad de Dash según el Tier
    // Tier 3: 0.5% cada frame | Tier 20: 2% cada frame aprox
    const dashChance = 0.005 + (this.tier * 0.001);
    const cooldown = 5000 - (this.tier * 100);

    if (Math.random() < dashChance && (!this.lastSpecialTime || time > this.lastSpecialTime + cooldown)) {
      this.lastSpecialTime = time;
      this._doDash(playerSprite);
    }
  }

  _doDash(playerSprite) {
    if (!this.sprite || !this.sprite.body) return;
    this.isDashing = true;

    const dashSpeed = this.speed * 2.5;
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y);

    this.sprite.body.setVelocity(Math.cos(angle) * dashSpeed, Math.sin(angle) * dashSpeed);

    // Estela visual
    this.scene.time.addEvent({
      delay: 50,
      repeat: 5,
      callback: () => {
        if (!this.sprite?.active) return;
        const trail = this.scene.add.rectangle(this.sprite.x, this.sprite.y, this.size * this.sprite.scale, this.size * this.sprite.scale, this.color, 0.4);
        this.scene.tweens.add({ targets: trail, alpha: 0, duration: 200, onComplete: () => trail.destroy() });
      }
    });

    this.scene.time.delayedCall(400, () => {
      this.isDashing = false;
    });
  }

  startBleed() {
    if (this.isBleeding) return;
    this.isBleeding = true;
    this.nextBleedTick = this.scene.time.now + 1000;
    this.scene.time.delayedCall(5000, () => (this.isBleeding = false));
  }

  takeDamage(amount) {
    if (this.isDead || this.hp <= 0) return;
    this.hp -= amount;
    if (this.scene.showDamageNumber) this.scene.showDamageNumber(this.sprite.x, this.sprite.y, amount);
    this.sprite.setFillStyle(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite && this.sprite.active && !this.isDead) this.sprite.setFillStyle(this.color);
    });
    if (this.scene.createParticles) this.scene.createParticles(this.sprite.x, this.sprite.y, 0xffffff);
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    const { x, y } = this.sprite;
    this._alphaAura?.destroy();
    this._alphaAuraOuter?.destroy();
    this._alphaCrown?.destroy();
    this._eliteAura?.destroy();
    this._tierParticleTimer?.remove();
    this.sprite?.destroy();
    if (this.hpBarGfx) {
      this.hpBarGfx.destroy();
      this.hpBarGfx = null;
    }
    // loot
    try {
      const rand = Math.random();
      if (rand < 0.2) this.scene.spawnHealth?.(x, y);
      else this.scene.spawnGold?.(x, y);
      this.scene.spawnXp?.(x, y);
      if (this.isAlpha) {
        this.scene.spawnXp?.(x + 10, y);
        this.scene.spawnXp?.(x - 10, y);
      }
      const relics = this.scene.registry.get('relics') || [];
      if (relics.includes('vampiro') && Math.random() < 0.05) {
        this.scene.player.hp = Math.min(this.scene.player.hp + 5, this.scene.player.maxHp);
        this.scene.updateUI?.();
      }
    } catch (e) {
      console.error('Error en loot:', e);
    }
    const idx = this.scene.enemies.indexOf(this);
    if (idx !== -1) this.scene.enemies.splice(idx, 1);
    this.scene.onEnemyDeath?.(this);
  }

  /** Helper estático para aplicar escalado y variante alpha */
  static applyScaling(enemy, level) {
    enemy.applyVariant(level);
    let alphaChance = 0.01 + (level * 0.002);
    if (alphaChance > 0.20) alphaChance = 0.20;
    if (Math.random() < alphaChance) {
      enemy.applyAlpha();
    }
    return enemy;
  }
}
