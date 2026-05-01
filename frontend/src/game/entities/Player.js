import * as Phaser from 'phaser';

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        // Leer del registro global o usar defecto
        this.maxHp = scene.registry.get('playerMaxHp') || 100;
        this.hp = scene.registry.get('playerHp') || 100;
        
        this.speed = 200 * (1 + (scene.registry.get('bonusSpeed') || 0));
        const relics = scene.registry.get('relics') || [];
        if (relics.includes('hermes')) this.speed *= 1.2;
        if (relics.includes('titan')) this.speed *= 0.9;
        
        this.isAttacking = false;
        
        // Sprite del jugador
        this.sprite = scene.add.rectangle(x, y, 30, 30, 0x0077ff);
        this.sprite.setStrokeStyle(2, 0xffffff);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);

        // Arma (Espada oculta por defecto)
        this.sword = scene.add.rectangle(x, y, 60, 20, 0xffffff); // Espada más grande
        scene.physics.add.existing(this.sword);
        this.sword.setVisible(false);
        this.sword.body.enable = false;

        // Controles
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE
        });

        // Dirección de mirada
        this.facing = 1; 
        
        // Cooldowns y Estados
        this.lastShotTime = 0;
        this.lastBombTime = 0;
        this.isDashing = false;
        this.isInvulnerable = false;
        this.dashCooldownTime = 0;
        this.dashDuration = 1500; // milisegundos de cooldown total

        // UI de Dash
        this.dashBar = scene.add.rectangle(x, y + 40, 30, 4, 0x00ffff).setDepth(50);
    }

    update(time) {
        if (this.hp <= 0) {
            if(this.dashBar) this.dashBar.setVisible(false);
            return;
        }

        // Actualizar barra de Dash
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
            // Mantener velocidad de dash sin cambiar dirección
        } else {
            let moveX = 0;
            let moveY = 0;

            if (this.cursors.left.isDown || this.wasd.left.isDown) moveX = -1;
            else if (this.cursors.right.isDown || this.wasd.right.isDown) moveX = 1;

            if (this.cursors.up.isDown || this.wasd.up.isDown) moveY = -1;
            else if (this.cursors.down.isDown || this.wasd.down.isDown) moveY = 1;
            
            // Sobrescribir con input móvil si está activo
            if (this.scene.mobileJoystick && this.scene.mobileJoystick.active) {
                moveX = this.scene.mobileJoystick.vx;
                moveY = this.scene.mobileJoystick.vy;
            }

            if (moveX !== 0 && moveY !== 0 && (!this.scene.mobileJoystick || !this.scene.mobileJoystick.active)) {
                moveX *= 0.7071;
                moveY *= 0.7071;
            }

            if (moveX !== 0 || moveY !== 0) {
                if (Math.abs(moveX) > Math.abs(moveY)) {
                    this.facing = moveX > 0 ? 1 : -1;
                } else {
                    this.facing = moveY > 0 ? -2 : 2; 
                }
            }

            let vx = moveX * this.speed;
            let vy = moveY * this.speed;

            this.sprite.body.setVelocity(vx, vy);

            // Dash
            if (Phaser.Input.Keyboard.JustDown(this.wasd.shift) && time > this.dashCooldownTime) {
                this.dash(time);
            }
        }

        // Cambiar Arma
        if (Phaser.Input.Keyboard.JustDown(this.wasd.one)) this.equipWeapon(1);
        if (Phaser.Input.Keyboard.JustDown(this.wasd.two) && this.scene.registry.get('hasBow')) this.equipWeapon(2);
        if (Phaser.Input.Keyboard.JustDown(this.wasd.three) && this.scene.registry.get('hasBombs')) this.equipWeapon(3);

        // Atacar
        if ((Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.wasd.space)) && !this.isDashing) {
            if(!this.isAttacking) this.attack(time);
        }
    }

    dash(time) {
        this.isDashing = true;
        this.isInvulnerable = true;
        this.dashCooldownTime = time + 1500; // 1.5s cooldown

        // Efecto visual: Color azul/blanco brillante
        this.sprite.setFillStyle(0x00ffff);

        let vx = 0; let vy = 0;
        const dashSpeed = 600;

        if (this.facing === 1) vx = dashSpeed;
        else if (this.facing === -1) vx = -dashSpeed;
        else if (this.facing === 2) vy = -dashSpeed;
        else if (this.facing === -2) vy = dashSpeed;

        this.sprite.body.setVelocity(vx, vy);

        // Partículas rastro mejoradas
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
            this.sprite.setFillStyle(0x0077ff); // Volver al azul normal
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

        // Offset de 42px desde el centro del jugador + hitbox generoso
        if      (this.facing ===  1) { sx += 42; this.sword.setSize(70, 30); this.sword.body.setSize(70, 30); }  // Derecha
        else if (this.facing === -1) { sx -= 42; this.sword.setSize(70, 30); this.sword.body.setSize(70, 30); }  // Izquierda
        else if (this.facing ===  2) { sy -= 42; this.sword.setSize(30, 70); this.sword.body.setSize(30, 70); }  // Arriba
        else if (this.facing === -2) { sy += 42; this.sword.setSize(30, 70); this.sword.body.setSize(30, 70); }  // Abajo

        this.sword.setPosition(sx, sy);

        // Forzar sincronización del cuerpo de física con la posición visual
        if (this.sword.body) {
            this.sword.body.reset(sx, sy);
            if (this.isAttacking) {
                this.sword.body.enable = true;
            }
        }
    }

    attack(time) {
        const weapon = this.scene.registry.get('equippedWeapon') || 1;
        const relics = this.scene.registry.get('relics') || [];
        
        let cooldownMod = relics.includes('reloj') ? 0.7 : 1.0;

        if (weapon === 1) {
            // ESPADA
            this.isAttacking = true;
            this.sword.setVisible(true);
            this.sword.body.enable = true;

            this.updateSwordPosition();

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
            // ARCO
            if (time < this.lastShotTime + (500 * cooldownMod)) return;
            this.lastShotTime = time;
            
            if (relics.includes('artemisa')) {
                // Triple flecha
                this.scene.spawnArrow(this.sprite.x, this.sprite.y, this.facing, 0);
                this.scene.spawnArrow(this.sprite.x, this.sprite.y, this.facing, -0.3);
                this.scene.spawnArrow(this.sprite.x, this.sprite.y, this.facing, 0.3);
            } else {
                this.scene.spawnArrow(this.sprite.x, this.sprite.y, this.facing);
            }
        }
        else if (weapon === 3) {
            // BOMBAS
            if (time < this.lastBombTime + (1500 * cooldownMod)) return;
            this.lastBombTime = time;
            this.scene.spawnBomb(this.sprite.x, this.sprite.y, relics.includes('pegajosa'));
        }
    }

    takeDamage(amount) {
        if (this.hp <= 0 || this.isInvulnerable) return;
        
        const relics = this.scene.registry.get('relics') || [];
        if (relics.includes('hierro')) {
            amount = Math.max(1, amount - 2);
        }

        this.hp -= amount;
        
        this.sprite.setFillStyle(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite.active && !this.isDashing) this.sprite.setFillStyle(0x0000ff);
        });

        this.scene.createParticles(this.sprite.x, this.sprite.y, 0xff0000);
        this.scene.cameras.main.shake(100, 0.01);

        if (this.hp <= 0) {
            this.hp = 0;
            this.sprite.setActive(false).setVisible(false);
            if (this.sword) this.sword.destroy();
        }
    }
}