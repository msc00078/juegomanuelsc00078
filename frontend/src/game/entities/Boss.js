import * as Phaser from 'phaser';

export class Boss {
    constructor(scene, x, y, type) {
        this.scene    = scene;
        this.hp       = 600;
        this.maxHp    = 600;
        this.bossType = type;
        this.phase    = 1;
        this.isDead   = false;

        // Posición del jugador predicha (para apuntar mejor)
        this._predictedPlayerX = scene.scale.width  / 2;
        this._predictedPlayerY = scene.scale.height / 2;

        this.sprite = scene.add.rectangle(x, y, 70, 70, 0xff0000);
        this.sprite.setStrokeStyle(3, 0x000000);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setImmovable(false); // El boss puede moverse más libremente

        this.attacks = scene.physics.add.group();

        this.aura = scene.add.circle(x, y, 55, 0xff0000, 0.18).setVisible(false);

        // Loop de movimiento autónomo (entre calls de la API)
        this._startAutonomousLoop();
    }

    /** El boss busca activamente al jugador entre acciones de la IA */
    _startAutonomousLoop() {
        this._autonomousTimer = this.scene.time.addEvent({
            delay: 400,
            loop: true,
            callback: () => {
                if (this.isDead || !this.sprite?.active) return;
                const player = this.scene.player;
                if (!player || !player.sprite?.active) return;

                // Actualizar predicción de posición del jugador
                const px = player.sprite.x + (player.sprite.body?.velocity.x || 0) * 0.25;
                const py = player.sprite.y + (player.sprite.body?.velocity.y || 0) * 0.25;
                this._predictedPlayerX = px;
                this._predictedPlayerY = py;

                // En fase 2+ el boss se mueve hacia el jugador de forma autónoma
                if (this.phase >= 2 && !this._isDashing) {
                    const baseSpeed = 60 + this.phase * 25;
                    this.scene.physics.moveToObject(this.sprite, player.sprite, baseSpeed);
                }

                // Actualizar aura
                if (this.aura?.active) this.aura.setPosition(this.sprite.x, this.sprite.y);
            }
        });
    }

    takeDamage(amount) {
        if (this.isDead || this.hp <= 0) return;

        this.hp -= amount;
        this.scene.showDamageNumber?.(this.sprite.x, this.sprite.y, amount);
        if (this.hp < 0) this.hp = 0;

        this.sprite.setFillStyle?.(0xffffff);
        this.scene.time.delayedCall(150, () => {
            if (this.sprite?.active && !this.isDead) {
                if (this.phase === 1)      this.sprite.setFillStyle?.(0xff0000);
                else if (this.phase === 2) this.sprite.setFillStyle?.(0xaa0000);
                else                       this.sprite.setFillStyle?.(0x440000);
            }
        });

        this.scene.createParticles?.(this.sprite.x, this.sprite.y, 0xffffff);

        // Cambio de fases
        const pct = this.hp / this.maxHp;
        if (this.phase === 1 && pct < 0.6) this.enterPhase(2);
        else if (this.phase === 2 && pct < 0.3) this.enterPhase(3);

        if (this.hp <= 0) { this.hp = 0; this.die(); }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        this._autonomousTimer?.remove(false);
        this.sprite.setActive?.(false);
        this.sprite.setVisible?.(false);
        if (this.sprite.body) this.sprite.body.enable = false;
        this.aura?.destroy();
        this.attacks?.clear?.(true, true);
    }

    enterPhase(newPhase) {
        this.phase = newPhase;
        this.scene.cameras?.main?.shake(600, 0.025);

        if (newPhase === 2) {
            this.aura.setVisible?.(true);
            this.aura.setFillStyle?.(0xff0000, 0.3);
            this.scene.tweens?.add({
                targets: this.aura, scale: 1.6,
                duration: 800, yoyo: true, repeat: -1
            });
            this.scene.bossText?.setText('¡ESTO NO HA TERMINADO!');
            // Reducir intervalo de llamadas a la API para más acción
            if (this.scene.apiCallInterval > 2000) this.scene.apiCallInterval = 2000;
        } else if (newPhase === 3) {
            this.aura.setFillStyle?.(0xffffff, 0.5);
            this.sprite.setStrokeStyle?.(5, 0xffffff);
            this.scene.bossText?.setText('¡MUERE, INSECTO!');
            if (this.scene.apiCallInterval > 1200) this.scene.apiCallInterval = 1200;
            // Invocar 2 kamikazes inmediatamente al entrar en fase 3
            this.scene.spawnKamikazeFromBoss?.();
            this.scene.spawnKamikazeFromBoss?.();
        }
    }

    executeAction(action, intensity, playerSprite) {
        if (!this.sprite?.active || this.isDead) return;

        const phaseMod  = 1 + (this.phase * 0.35);
        const speedMult = (0.6 + intensity * 1.4) * phaseMod;

        // Usar posición predicha del jugador para apuntar
        const aimX = this._predictedPlayerX || playerSprite.x;
        const aimY = this._predictedPlayerY || playerSprite.y;

        if (this.aura?.active) this.aura.setPosition(this.sprite.x, this.sprite.y);

        if (action === 'dash') {
            this._doDash(aimX, aimY, speedMult, phaseMod);
        } else if (action === 'projectile') {
            this._doProjectile(aimX, aimY, speedMult, playerSprite);
        } else if (action === 'area') {
            this._doArea(speedMult, phaseMod);
        }

        // Fase 3: invocar kamikaze con probabilidad
        if (this.phase === 3 && Math.random() < 0.25) {
            this.scene.spawnKamikazeFromBoss?.();
        }
    }

    _doDash(aimX, aimY, speedMult, phaseMod) {
        this._isDashing = true;
        const dashSpeed = 300 * speedMult;

        const dashEvent = this.scene.time.addEvent({
            delay: 40 / phaseMod,
            callback: () => {
                if (!this.sprite?.active || this.isDead) return;
                const trail = this.scene.add.rectangle(
                    this.sprite.x, this.sprite.y, 70, 70,
                    this.sprite.fillColor, 0.45
                );
                this.scene.tweens.add({
                    targets: trail, alpha: 0,
                    duration: 250, onComplete: () => trail.destroy()
                });
            },
            repeat: 15
        });

        // Apuntar a donde ESTARÁ el jugador
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y, aimX, aimY
        );
        this.sprite.body.setVelocity(
            Math.cos(angle) * dashSpeed,
            Math.sin(angle) * dashSpeed
        );

        const dashDuration = 600 / phaseMod;
        this.scene.time.delayedCall(dashDuration, () => {
            if (this.sprite?.active && !this.isDead) this.sprite.body.setVelocity(0);
            dashEvent.remove();
            this._isDashing = false;
        });
    }

    _doProjectile(aimX, aimY, speedMult, playerSprite) {
        if (!this.sprite?.active) return;
        this.sprite.body.setVelocity(0);

        // Fase 2 → 2 proyectiles, Fase 3 → 4 proyectiles (ráfaga)
        const count = this.phase === 1 ? 1 : this.phase === 2 ? 2 : 4;
        const spread = this.phase === 3 ? 0.25 : 0.15;

        for (let i = 0; i < count; i++) {
            this.scene.time.delayedCall(i * 120, () => {
                if (this.isDead || !this.sprite?.active) return;

                // Recalcular posición del jugador justo antes de disparar
                const currentAimX = this.scene.player?.sprite?.x ?? aimX;
                const currentAimY = this.scene.player?.sprite?.y ?? aimY;

                const proj = this.scene.add.circle(this.sprite.x, this.sprite.y, 12, 0xffa500);
                proj.setStrokeStyle(2, 0xffffff);
                this.attacks.add(proj);

                const baseAngle = Phaser.Math.Angle.Between(
                    this.sprite.x, this.sprite.y, currentAimX, currentAimY
                );
                const angleOffset = (i - (count - 1) / 2) * spread;
                const projSpeed = 380 * speedMult;

                this.scene.physics.velocityFromRotation(
                    baseAngle + angleOffset, projSpeed, proj.body.velocity
                );
                this.scene.time.delayedCall(3500, () => { if (proj.active) proj.destroy(); });
            });
        }
    }

    _doArea(speedMult, phaseMod) {
        if (!this.sprite?.active) return;
        this.sprite.body.setVelocity(0);

        // En fase 3 lanza 2 ondas de área concéntricas
        const waves = this.phase === 3 ? 2 : 1;
        for (let w = 0; w < waves; w++) {
            this.scene.time.delayedCall(w * 400, () => {
                if (this.isDead || !this.sprite?.active) return;
                const area = this.scene.add.circle(
                    this.sprite.x, this.sprite.y, 20, 0x8a2be2, 0.55
                );
                this.attacks.add(area);
                area.body.setCircle(20);
                area.body.setImmovable(true);

                this.scene.tweens.add({
                    targets: area,
                    scale: 8 * speedMult,
                    alpha: 0,
                    duration: 1200 / phaseMod,
                    onComplete: () => area.destroy()
                });
            });
        }
    }
}