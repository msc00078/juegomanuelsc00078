import * as Phaser from 'phaser';

// ─── CLASE BASE ──────────────────────────────────────────────────────────────
export class Enemy {
    constructor(scene, x, y, hp, speed, color, size) {
        this.scene  = scene;
        this.hp     = hp;
        this.maxHp  = hp;
        this.speed  = speed;
        this.color  = color;
        this.size   = size;
        this.isDead = false;
        this.isAlpha = false;
        this.contactDamage = 5; // daño al tocar al jugador (lo sube MainScene)

        this.sprite = scene.add.rectangle(x, y, size, size, color);
        this.sprite.setStrokeStyle(2, 0x000000);

        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0.3);
    }

    /** Aplica escalado gradual y asigna uno de los 20 Rangos Visuales */
    applyVariant(level) {
        // 1. Escalado base de estadísticas (Sigue siendo gradual por nivel individual)
        const statMultiplier = 1 + (level - 1) * 0.12; 
        this.hp = Math.round(this.hp * statMultiplier);
        this.maxHp = this.hp;
        this.contactDamage = Math.round(this.contactDamage * statMultiplier);
        this.speed = Math.round(this.speed * (1 + (level - 1) * 0.02));

        const sizeScale = 1 + (level - 1) * 0.006;
        this.sprite.setScale(sizeScale);
        this.currentScale = sizeScale;

        // 2. Definición de los 20 Rangos (Cada 5 niveles cambia el rango visual)
        const tierIndex = Math.min(Math.floor((level - 1) / 5), 19); 
        this.tier = tierIndex + 1;

        // Tabla de colores Sagrado-Neon para los 20 rangos
        const tierColors = [
            0x004400, 0x008800, 0x00cc00, 0x00ff44, // 1-4 (Verdes)
            0x008888, 0x00cccc, 0x00ffff, 0x0088ff, // 5-8 (Cyans/Azules)
            0x0000ff, 0x4400ff, 0x8800ff, 0xcc00ff, // 9-12 (Azules/Púrpuras)
            0xff00ff, 0xff0088, 0xff0044, 0xff0000, // 13-16 (Magents/Rojos)
            0xff4400, 0xff8800, 0xffcc00, 0xffff00  // 17-20 (Naranjas/Oro)
        ];

        const tierColor = tierColors[tierIndex];
        const strokeThickness = 2 + Math.floor(tierIndex / 4); // El borde crece cada 4 rangos
        
        this.sprite.setStrokeStyle(strokeThickness, tierColor);

        // 3. Efectos según el rango
        if (tierIndex >= 4) { // Rango 5+ (Nivel 21+)
            // Aura del color del rango
            this._eliteAura = this.scene.add.circle(
                this.sprite.x, this.sprite.y, 
                this.size * sizeScale * 0.6, 
                tierColor, 0.15
            );
        }

        if (tierIndex >= 11) { // Rango 12+ (Nivel 56+)
            // Partículas sutiles constantes del color del tier
            if (this.scene.createParticles) {
                this._tierParticleTimer = this.scene.time.addEvent({
                    delay: 1500 - (tierIndex * 50), // Más partículas en niveles más altos
                    callback: () => {
                        if (this.sprite && this.sprite.active && !this.isDead) {
                            this.scene.createParticles(this.sprite.x, this.sprite.y, tierColor);
                        }
                    },
                    loop: true
                });
            }
        }
        
        if (tierIndex === 19) { // Rango 20 (Nivel 96+)
            // Efecto especial para el rango máximo: Brillo blanco extra
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

    /** Convierte este enemigo en Alpha (Diferenciación visual máxima) */
    applyAlpha() {
        this.isAlpha = true;
        // El Alpha multiplica lo que ya tenga por variante
        this.hp     = Math.round(this.hp * 2.5);
        this.maxHp  = this.hp;
        this.contactDamage = Math.round(this.contactDamage * 1.8);
        this.speed  = Math.round(this.speed * 1.1);
        this.xpBonus = 50;

        // Visual: Mucho más grande y con efectos dorados
        const currentScale = this.sprite.scale;
        this.sprite.setScale(currentScale * 1.3);
        this.sprite.setStrokeStyle(5, 0xffd700);

        // Aura dual (interna fija, externa pulsante)
        this._alphaAura = this.scene.add.circle(
            this.sprite.x, this.sprite.y, this.size * this.sprite.scale * 0.8, 0xffd700, 0.3
        );
        this._alphaAuraOuter = this.scene.add.circle(
            this.sprite.x, this.sprite.y, this.size * this.sprite.scale * 1.1, 0xffd700, 0.1
        );
        
        this.scene.tweens.add({
            targets: this._alphaAuraOuter,
            scale: 1.4,
            alpha: 0,
            duration: 1000,
            repeat: -1
        });

        // "Corona" o indicador visual extra (un pequeño rombo encima)
        this._alphaCrown = this.scene.add.rectangle(this.sprite.x, this.sprite.y - 40 * this.sprite.scale, 15, 15, 0xffd700);
        this._alphaCrown.setAngle(45);
        this._alphaCrown.setStrokeStyle(2, 0xffffff);
        this.scene.tweens.add({
            targets: this._alphaCrown,
            y: "-=10",
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update(playerSprite, time) {
        if (this.isDead) return;
        if (!this.sprite || !this.sprite.active) return;
        if (!playerSprite || !playerSprite.active) {
            if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
            return;
        }
        this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed);

        // --- Habilidades Especiales según el Tier ---
        if (this.tier >= 3) { // Desde Rango 3 (Nivel 11+)
            this._handleSpecialAbilities(playerSprite, time);
        }

        // Actualizar posición de auras
        this._updateAuras();

        // Sangrado
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
        // Implementado en subclases o acción genérica
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
        const trailTimer = this.scene.time.addEvent({
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
        this.scene.time.delayedCall(5000, () => {
            this.isBleeding = false;
        });
    }

    takeDamage(amount) {
        if (this.isDead || this.hp <= 0) return;

        this.hp -= amount;
        this.scene.showDamageNumber?.(this.sprite.x, this.sprite.y, amount);

        this.sprite.setFillStyle(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite && this.sprite.active && !this.isDead)
                this.sprite.setFillStyle(this.color);
        });

        this.scene.createParticles?.(this.sprite.x, this.sprite.y, 0xffffff);

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        const x = this.sprite.x;
        const y = this.sprite.y;

        // Destruir visuales
        this._alphaAura?.destroy();
        this._alphaAuraOuter?.destroy();
        this._alphaCrown?.destroy();
        this._eliteAura?.destroy();
        this._tierParticleTimer?.remove();
        this.hpBarGfx?.destroy();
        this.bleedParticles?.destroy();
        this.sprite?.destroy();

        // Loot
        try {
            const rand = Math.random();
            if (rand < 0.2) this.scene.spawnHealth(x, y);
            else this.scene.spawnGold(x, y);

            // XP: Alpha da más
            this.scene.spawnXp(x, y);
            if (this.isAlpha) {
                this.scene.spawnXp(x + 10, y);
                this.scene.spawnXp(x - 10, y);
            }

            const relics = this.scene.registry.get('relics') || [];
            if (relics.includes('vampiro') && Math.random() < 0.05) {
                this.scene.player.hp = Math.min(
                    this.scene.player.hp + 5, this.scene.player.maxHp
                );
                this.scene.updateUI?.();
            }
        } catch (e) {
            console.error('Error en loot:', e);
        }

        // Quitar del array
        const idx = this.scene.enemies.indexOf(this);
        if (idx !== -1) this.scene.enemies.splice(idx, 1);

        this.scene.onEnemyDeath(this);
    }
}

// ─── HELPER: aplicar variante + alpha a cualquier enemigo ────────────────────
export function applyEnemyScaling(enemy, level) {
    enemy.applyVariant(level);
    
    // Probabilidad de Alpha escala con el nivel: 
    // Nivel 1: 1% | Nivel 50: 10% | Nivel 100: 20% (Tope)
    let alphaChance = 0.01 + (level * 0.002);
    if (alphaChance > 0.20) alphaChance = 0.20;

    if (Math.random() < alphaChance) {
        enemy.applyAlpha();
    }
    return enemy;
}

// ─── 1. ESTÁNDAR ─────────────────────────────────────────────────────────────
export class StandardEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 30, 100, 0x004400, 25);
        this.name = 'Ente Glitch';
        this.contactDamage = 5;
    }
}

// ─── 2. TANQUE ───────────────────────────────────────────────────────────────
export class TankEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 100, 50, 0x555555, 40);
        this.name = 'Protector Aumentado';
        this.contactDamage = 8;
    }
    die() {
        // Suelta más oro
        if (this.sprite) {
            for (let i = 0; i < 3; i++) {
                this.scene.spawnGold(
                    this.sprite.x + Phaser.Math.Between(-15, 15),
                    this.sprite.y + Phaser.Math.Between(-15, 15)
                );
            }
        }
        super.die();
    }
}

// ─── 3. KAMIKAZE ─────────────────────────────────────────────────────────────
export class KamikazeEnemy extends Enemy {
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
        this.sprite?.destroy();
        this.scene.explodeBomb(x, y, 30);
        const idx = this.scene.enemies.indexOf(this);
        if (idx !== -1) this.scene.enemies.splice(idx, 1);
    }
}

// ─── 4. RANGED ───────────────────────────────────────────────────────────────
export class RangedEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 20, 80, 0xaa5500, 25);
        this.name = 'Cazador de Datos';
        this.lastShotTime = 0;
        this.contactDamage = 4;
    }
    update(playerSprite, time) {
        if (this.isDead) return;
        if (!this.sprite?.active) return;
        if (!playerSprite?.active) {
            this.sprite.body?.setVelocity(0);
            return;
        }
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
        } else if (dist > 300) {
            this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed);
        } else {
            this.sprite.body.setVelocity(0, 0);
        }
        this._updateAuras();
        if (time > this.lastShotTime + 2000 && dist < 400) {
            this.lastShotTime = time;
            this.scene.spawnEnemyArrow(
                this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y
            );
        }
    }
}

// ─── 5. INVOCADOR ────────────────────────────────────────────────────────────
export class SummonerEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 50, 60, 0x00ff00, 30);
        this.name = 'Oráculo Roto';
        this.lastSummonTime = 0;
        this.contactDamage = 4;
        this.sprite.setStrokeStyle(3, 0xffffff);
    }
    update(playerSprite, time) {
        if (this.isDead) return;
        if (!this.sprite?.active || !playerSprite?.active) return;
        const dist = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y
        );
        if (dist < 300) {
            const angle = Phaser.Math.Angle.Between(
                playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y
            );
            this.sprite.body.setVelocity(
                Math.cos(angle) * this.speed, Math.sin(angle) * this.speed
            );
        } else {
            this.sprite.body.setVelocity(0, 0);
        }
        this._updateAuras();
        if (time > this.lastSummonTime + 5000) {
            this.lastSummonTime = time;
            this._summon();
        }
    }
    _summon() {
        if (this.scene.enemies.length > 12) return;
        this.scene.createParticles?.(this.sprite.x, this.sprite.y, 0x00ff00);
        const rx = this.sprite.x + Phaser.Math.Between(-40, 40);
        const ry = this.sprite.y + Phaser.Math.Between(-40, 40);
        const minion = new StandardEnemy(this.scene, rx, ry);
        minion.hp = 15; minion.maxHp = 15;
        minion.sprite.setScale(0.7);
        this.scene.enemies.push(minion);
        this.scene.setupEnemyCollisions(minion);
        this.scene.tweens.add({ targets: minion.sprite, alpha: { from: 0, to: 1 }, duration: 500 });
    }
}

// ─── 6. TELETRANSPORTADOR ────────────────────────────────────────────────────
export class TeleporterEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 35, 90, 0x9900cc, 22);
        this.name = 'Fase Corrupta';
        this.contactDamage = 18; // alto daño
        this.lastTeleportTime = 0;
        this.teleportCooldown = 4500; // ms entre teletransportes
        this.sprite.setStrokeStyle(3, 0xdd88ff);
    }

    update(playerSprite, time) {
        if (this.isDead) return;
        if (!this.sprite?.active || !playerSprite?.active) return;

        const dist = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y
        );

        // Si puede teletransportarse y el jugador está lejos
        if (time > this.lastTeleportTime + this.teleportCooldown && dist > 80) {
            this.lastTeleportTime = time;
            this._teleport(playerSprite);
        } else {
            // Comportamiento normal de rango mientras espera
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
        // Flash de salida
        this.scene.tweens.add({
            targets: this.sprite, alpha: 0, duration: 200,
            onComplete: () => {
                if (this.isDead || !this.sprite?.active) return;
                // Aparecer detrás del jugador
                const angle = Phaser.Math.Angle.Between(
                    playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y
                );
                const offsetX = Math.cos(angle + Math.PI) * 45;
                const offsetY = Math.sin(angle + Math.PI) * 45;
                this.sprite.setPosition(
                    Phaser.Math.Clamp(playerSprite.x + offsetX, 20, this.scene.scale.width  - 20),
                    Phaser.Math.Clamp(playerSprite.y + offsetY, 90, this.scene.scale.height - 20)
                );
                this._alphaAura?.setPosition(this.sprite.x, this.sprite.y);
                // Flash de entrada
                this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 200 });
                this.scene.createParticles?.(this.sprite.x, this.sprite.y, 0x9900cc);
            }
        });
    }
}

// ─── 7. SANADOR ──────────────────────────────────────────────────────────────
export class HealerEnemy extends Enemy {
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

        // Siempre mantiene distancia del jugador
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

        // Curar aliados cercanos
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
                // Efecto verde sobre el aliado curado
                this.scene.createParticles?.(e.sprite.x, e.sprite.y, 0x00ff44);
            }
        });
        if (healed) {
            this.scene.createParticles?.(this.sprite.x, this.sprite.y, 0x00ff88);
        }
    }
}

// ─── 8. GUARDIÁN (ESCUDO) ────────────────────────────────────────────────────
export class GuardianEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 120, 40, 0x334455, 45);
        this.name = 'Centinela Blindado';
        this.contactDamage = 10;
        this.sprite.setStrokeStyle(5, 0x88ccff);

        // El escudo frontal es sólo visual (la lógica la maneja MainScene via isShielded)
        this._shieldIndicator = scene.add.rectangle(
            x, y - 30, 50, 8, 0x88ccff, 0.9
        ).setDepth(10);
    }

    update(playerSprite, time) {
        if (this.isDead) return;
        if (!this.sprite?.active || !playerSprite?.active) return;

        // Siempre avanza lentamente hacia el jugador
        this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed);

        // Actualizar el indicador de escudo sobre la cabeza
        if (this._shieldIndicator?.active) {
            this._shieldIndicator.setPosition(this.sprite.x, this.sprite.y - 28);
        }
        this._updateAuras();

        // Calcular si el escudo está activo (jugador está por delante del guardián)
        // "Delante" = el jugador está en la dirección hacia la que avanza el guardián
        const angleToPlayer = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y
        );
        // El guardián mira hacia el jugador siempre → el escudo cubre ese ángulo
        this.isShielded = true;  // Por defecto el escudo está activo
        // Se desactiva si el jugador está "detrás" (ángulo inverso >90°)
        // MainScene usará isShielded para decidir si el daño de la espada penetra
    }

    /** Calcula si el ataque desde attackX,attackY penetra el escudo */
    isHitFromBehind(attackX, attackY, playerX, playerY) {
        if (!this.sprite?.active) return true;
        // Vector guardian → jugador (frente)
        const frontAngle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y, playerX, playerY
        );
        // Vector guardian → atacante
        const attackAngle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y, attackX, attackY
        );
        const diff = Math.abs(Phaser.Math.Angle.Wrap(attackAngle - frontAngle));
        return diff > Math.PI * 0.55; // >99° → por la espalda
    }

    die() {
        this._shieldIndicator?.destroy();
        super.die();
    }
}

// ─── 9. TRAMPERO ─────────────────────────────────────────────────────────────
export class TrapperEnemy extends Enemy {
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

        // Mantiene distancia media, nunca se acerca demasiado
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

        // Colocar trampa
        if (time > this.lastTrapTime + this.trapCooldown) {
            this.lastTrapTime = time;
            this._placeTrap(playerSprite.x, playerSprite.y);
        }
    }

    _placeTrap(targetX, targetY) {
        if (!this.sprite?.active) return;
        // Colocar la trampa ligeramente entre el trampero y el jugador
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y, targetX, targetY
        );
        const tx = this.sprite.x + Math.cos(angle) * 80;
        const ty = this.sprite.y + Math.sin(angle) * 80;

        const trap = this.scene.add.circle(tx, ty, 30, 0xffcc00, 0.35);
        trap.setStrokeStyle(2, 0xff8800);
        this.scene.physics.add.existing(trap, true); // cuerpo estático

        // El slow zone dura 5 segundos
        this.scene.time.delayedCall(5000, () => { if (trap.active) trap.destroy(); });

        // Añadir al grupo de trampas de la escena para que MainScene gestione el slow
        if (this.scene.trapZones) this.scene.trapZones.add(trap);

        // Efecto de aparición
        this.scene.tweens.add({ targets: trap, alpha: { from: 0, to: 0.35 }, duration: 300 });
    }
}