export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.maxHp = scene.registry.get('playerMaxHp') || 100;
        this.hp = scene.registry.get('playerHp') || 100;

        this.speed = 200 * (1 + (scene.registry.get('bonusSpeed') || 0));
        const relics = scene.registry.get('relics') || [];
        if (relics.includes('hermes')) this.speed *= 1.2;
        if (relics.includes('titan')) this.speed *= 0.9;
        this._baseSpeed = this.speed;

        this.isAttacking = false;

        this.sprite = scene.add.rectangle(x, y, 30, 30, 0x0077ff);
        this.sprite.setStrokeStyle(2, 0xffffff);
        this.sprite.setAlpha(0.15);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);

        this.heroSprite = scene.add.sprite(x, y, 'heroe1');
        this.heroSprite.setDisplaySize(30, 30);
        this.heroSprite.setDepth(11);

        this.sword = scene.add.rectangle(x, y, 60, 20, 0xffffff);
        scene.physics.add.existing(this.sword);
        this.sword.setVisible(false);
        this.sword.body.enable = false;

        this.inputManager = scene.inputManager;
        this.facing = 1;

        this.lastShotTime = 0;
        this.lastBombTime = 0;
        this.isDashing = false;
        this.isInvulnerable = false;
        this.dashCooldownTime = 0;
        this.dashDuration = 1500;

        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 180;

        this.dashBar = scene.add.rectangle(x, y + 40, 30, 4, 0x00ffff).setDepth(50);
    }

    update(time, delta) {
        if (this.hp <= 0) {
            if (this.dashBar) this.dashBar.setVisible(false);
            return;
        }

        this.heroSprite.setPosition(this.sprite.x, this.sprite.y);

        this.dashBar.setPosition(this.sprite.x, this.sprite.y + 25);
        const dashElapsed = time - (this.dashCooldownTime - 1500);
        const dashPercent = Math.min(1, dashElapsed / 1500);
        this.dashBar.width = 30 * dashPercent;
        if (dashPercent < 1) this.dashBar.setFillStyle(0x555555);
        else this.dashBar.setFillStyle(0x00ffff);

        if (this.isAttacking) {
            this.sprite.body.velocity.x *= 0.5;
            this.sprite.body.velocity.y *= 0.5;
            this.updateSwordPosition();
        } else if (this.isDashing) {
            // dash en progreso, mantener velocidad
        } else {
            const move = this.inputManager.getMovement();

            if (move.x !== 0 || move.y !== 0) {
                if (Math.abs(move.x) > Math.abs(move.y)) {
                    this.facing = move.x > 0 ? 1 : -1;
                } else {
                    this.facing = move.y > 0 ? -2 : 2;
                }
            }

            this.sprite.body.setVelocity(move.x * this.speed, move.y * this.speed);

            const isMoving = move.x !== 0 || move.y !== 0;
            if (isMoving) {
                this.animTimer += delta;
                if (this.animTimer >= this.animSpeed) {
                    this.animTimer = 0;
                    this.animFrame = this.animFrame === 0 ? 1 : 0;
                    this.heroSprite.setTexture(this.animFrame === 0 ? 'heroe1' : 'heroe2');
                }
            } else {
                this.animTimer = 0;
                this.animFrame = 0;
                this.heroSprite.setTexture('heroe1');
            }

            if (this.facing === 1) {
                this.heroSprite.setAngle(90);
            } else if (this.facing === -1) {
                this.heroSprite.setAngle(-90);
            } else if (this.facing === 2) {
                this.heroSprite.setAngle(0);
            } else if (this.facing === -2) {
                this.heroSprite.setAngle(180);
            }

            if (this.inputManager.isActionJustDown('dash') && time > this.dashCooldownTime) {
                this.dash(time);
            }
        }

        if (this.inputManager.isActionJustDown('weapon1')) this.equipWeapon(1);
        if (this.inputManager.isActionJustDown('weapon2') && this.scene.registry.get('hasBow')) this.equipWeapon(2);
        if (this.inputManager.isActionJustDown('weapon3') && this.scene.registry.get('hasBombs')) this.equipWeapon(3);

        if (this.inputManager.isActionJustDown('attack') && !this.isDashing) {
            if (!this.isAttacking) this.attack(time);
        }
    }

    dash(time) {
        if (!time) time = this.scene.time.now;
        this.isDashing = true;
        this.isInvulnerable = true;
        this.dashCooldownTime = time + 1500;

        this.heroSprite.setTint(0x00ffff);

        let vx = 0; let vy = 0;
        const dashSpeed = 600;

        if (this.facing === 1) vx = dashSpeed;
        else if (this.facing === -1) vx = -dashSpeed;
        else if (this.facing === 2) vy = -dashSpeed;
        else if (this.facing === -2) vy = dashSpeed;

        this.sprite.body.setVelocity(vx, vy);

        this.scene.time.addEvent({
            delay: 40,
            repeat: 5,
            callback: () => {
                if (!this.sprite.active) return;
                const trail = this.scene.add.rectangle(this.sprite.x, this.sprite.y, 30, 30, 0x00ffff, 0.4);
                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 0.5,
                    duration: 300,
                    onComplete: () => trail.destroy()
                });
            }
        });

        this.scene.time.delayedCall(250, () => {
            this.isDashing = false;
            this.isInvulnerable = false;
            this.heroSprite.clearTint();
            this.sprite.body.setVelocity(0, 0);
        });
    }

    equipWeapon(num) {
        this.scene.registry.set('equippedWeapon', num);
        this.scene.updateUI();
    }

    updateSwordPosition() {
        if (!this.sword || !this.sword.body) return;
        let sx = this.sprite.x;
        let sy = this.sprite.y;

        if (this.facing === 1) { sx += 42; this.sword.setSize(70, 30); this.sword.body.setSize(70, 30); }
        else if (this.facing === -1) { sx -= 42; this.sword.setSize(70, 30); this.sword.body.setSize(70, 30); }
        else if (this.facing === 2) { sy -= 42; this.sword.setSize(30, 70); this.sword.body.setSize(30, 70); }
        else if (this.facing === -2) { sy += 42; this.sword.setSize(30, 70); this.sword.body.setSize(30, 70); }

        this.sword.setPosition(sx, sy);

        if (this.sword.body) {
            this.sword.body.reset(sx, sy);
            if (this.isAttacking) {
                this.sword.body.enable = true;
            }
        }
    }

    attack(time) {
        if (!time) time = this.scene.time.now;
        const weapon = this.scene.registry.get('equippedWeapon') || 1;
        const relics = this.scene.registry.get('relics') || [];

        let cooldownMod = relics.includes('reloj') ? 0.7 : 1.0;

        if (weapon === 1) {
            this.isAttacking = true;
            this.sword.setVisible(true);
            this.sword.body.enable = true;

            this.updateSwordPosition();
            this.scene.playSFX('sonido_espada');

            this.scene.tweens.add({
                targets: this.sword,
                alpha: 0.2,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    if (this.sword && this.sword.body) {
                        this.isAttacking = false;
                        this.sword.setVisible(false);
                        this.sword.body.enable = false;
                        this.sword.alpha = 1;
                    }
                }
            });
        }
        else if (weapon === 2) {
            if (time < this.lastShotTime + (500 * cooldownMod)) return;
            this.lastShotTime = time;

            if (relics.includes('artemisa')) {
                this.scene.spawnArrow(this.sprite.x, this.sprite.y, this.facing, 0);
                this.scene.spawnArrow(this.sprite.x, this.sprite.y, this.facing, -0.3);
                this.scene.spawnArrow(this.sprite.x, this.sprite.y, this.facing, 0.3);
            } else {
                this.scene.spawnArrow(this.sprite.x, this.sprite.y, this.facing);
            }
            this.scene.playSFX('sonido_arco');
        }
        else if (weapon === 3) {
            if (time < this.lastBombTime + (1500 * cooldownMod)) return;
            this.lastBombTime = time;
            this.scene.spawnBomb(this.sprite.x, this.sprite.y, relics.includes('pegajosa'));
            this.scene.playSFX('sonido_bomba', 0.4);
        }
    }

    takeDamage(amount) {
        if (this.hp <= 0 || this.isInvulnerable) return;

        const relics = this.scene.registry.get('relics') || [];
        if (relics.includes('hierro')) {
            amount = Math.max(1, amount - 2);
        }

        this.hp -= amount;
        this.isInvulnerable = true;

        this.scene.registry.set('hp', this.hp);
        this.scene.updateUI?.();

        this.heroSprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.heroSprite.active && !this.isDashing) this.heroSprite.clearTint();
            this.isInvulnerable = false;
        });

        this.scene.createParticles?.(this.sprite.x, this.sprite.y, 0xff0000);
        this.scene.cameras?.main?.shake(100, 0.01);

        if (this.hp <= 0) {
            this.hp = 0;
            this.sprite.setActive?.(false);
            this.sprite.setVisible?.(false);
            this.heroSprite.setActive?.(false);
            this.heroSprite.setVisible?.(false);
            if (this.sword) this.sword.destroy?.();
            this.scene.endGame?.("¡HAS SIDO BORRADO DEL SISTEMA!");
        }
    }
}
