import * as Phaser from 'phaser';

export class Enemy {
    constructor(scene, x, y, hp, speed, color, size, spriteKey = null) {
        this.scene = scene;
        this.hp = hp;
        this.maxHp = hp;
        this.speed = speed;
        this.color = color;
        this.isDead = false;
        this.spriteKey = spriteKey;
        
        if (spriteKey) {
            this.sprite = scene.add.sprite(x, y, spriteKey);
            this.sprite.setDisplaySize(size, size);
        } else {
            this.sprite = scene.add.rectangle(x, y, size, size, color);
            this.sprite.setStrokeStyle(2, 0x000000);
        }
        
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0.5);
    }

    update(playerSprite) {
        if (this.isDead) return;  // Prevent updates if dead
        if (!this.sprite || !this.sprite.active) return;
        if (!playerSprite || !playerSprite.active) {
            if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
            return;
        }
        this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed);
        
        // Sangrado
        if (this.isBleeding && this.scene.time.now > this.nextBleedTick) {
            this.takeDamage(2);
            this.nextBleedTick = this.scene.time.now + 1000;
        }
    }

    startBleed() {
        if (this.isBleeding) return;
        this.isBleeding = true;
        this.nextBleedTick = this.scene.time.now + 1000;
        
        // Efecto visual: Partículas rojas continuas
        this.bleedParticles = this.scene.add.particles(0, 0, 'squareParticle', {
            speed: { min: -20, max: 20 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            tint: 0x880000,
            follow: this.sprite
        });
        
        this.scene.time.delayedCall(5000, () => {
            this.isBleeding = false;
            if (this.bleedParticles) this.bleedParticles.destroy();
        });
    }

    takeDamage(amount) {
        if (this.isDead) return;  // Prevent damage if already dead
        if (this.hp <= 0) return;
        
        this.hp -= amount;
        this.scene.showDamageNumber(this.sprite.x, this.sprite.y, amount);
        
        this.sprite.setFillStyle(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.sprite && this.sprite.active && !this.isDead) this.sprite.setFillStyle(this.color);
        });

        this.scene.createParticles(this.sprite.x, this.sprite.y, 0xffffff);

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        
        // Guardar posición para el loot antes de destruir el sprite
        const x = this.sprite.x;
        const y = this.sprite.y;

        // Destrucción inmediata para que desaparezca de la pantalla
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.bleedParticles) {
            this.bleedParticles.destroy();
        }

        // Loot y Efectos (con try-catch para que nada detenga la limpieza)
        try {
            const rand = Math.random();
            if (rand < 0.2) this.scene.spawnHealth(x, y);
            else this.scene.spawnGold(x, y);
            
            this.scene.spawnXp(x, y);
            
            const relics = this.scene.registry.get('relics') || [];
            if (relics.includes('vampiro') && Math.random() < 0.05) {
                this.scene.player.hp = Math.min(this.scene.player.hp + 5, this.scene.player.maxHp);
                this.scene.updateUI();
                if (this.scene.player.sprite && this.scene.player.sprite.active) {
                    this.scene.createParticles(this.scene.player.sprite.x, this.scene.player.sprite.y, 0x00ff00);
                }
            }
        } catch (e) { 
            console.error("Error en el loot del enemigo:", e); 
        }
        
        // Eliminación del array de la escena
        const enemyIndex = this.scene.enemies.indexOf(this);
        if (enemyIndex !== -1) {
            this.scene.enemies.splice(enemyIndex, 1);
        }

        // Limpiar barra de vida
        if (this.hpBarGfx) {
            this.hpBarGfx.destroy();
        }
        
        this.scene.onEnemyDeath(this);
    }
}

// 1. Enemigo Estándar (El Slime original)
export class StandardEnemy extends Enemy {
    constructor(scene, x, y) {
        // Ente Glitch: El error más común del sistema
        super(scene, x, y, 30, 100, 0x004400, 25);
        this.name = "Ente Glitch";
    }
}

// 2. Enemigo Tanque (Orco)
export class TankEnemy extends Enemy {
    constructor(scene, x, y) {
        // Protector Aumentado: Mitad humano, mitad algoritmo de defensa
        super(scene, x, y, 100, 50, 0x555555, 40); 
        this.name = "Protector Aumentado";
    }
    
    die() {
        // El tanque suelta más oro
        for(let i=0; i<3; i++) {
            this.scene.spawnGold(this.sprite.x + Phaser.Math.Between(-15, 15), this.sprite.y + Phaser.Math.Between(-15, 15));
        }
        super.die();
    }
}

// 3. Enemigo Kamikaze (Murciélago)
export class KamikazeEnemy extends Enemy {
    constructor(scene, x, y) {
        // Fragmento Volátil: Código corrupto que busca auto-borrarse
        super(scene, x, y, 10, 250, 0x880088, 15);
        this.name = "Fragmento Volátil";
    }

    update(playerSprite) {
        if (this.isDead) return;
        if (!this.sprite || !this.sprite.active) return;
        if (!playerSprite || !playerSprite.active) {
            if (this.sprite.body) this.sprite.body.setVelocity(0);
            return;
        }
        this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed);
        
        // Si está muy cerca del jugador, explota
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y);
        if (dist < 40) {
            this.explode();
        }
    }

    explode() {
        if(this.isDead) return;
        this.isDead = true;
        this.hp = 0;
        
        const x = this.sprite.x;
        const y = this.sprite.y;
        
        // Destrucción inmediata
        if (this.sprite) {
            this.sprite.destroy();
        }

        this.scene.explodeBomb(x, y, 30);
        
        // Eliminar del array
        const enemyIndex = this.scene.enemies.indexOf(this);
        if (enemyIndex !== -1) {
            this.scene.enemies.splice(enemyIndex, 1);
        }
    }
}

// 4. Enemigo A Distancia (Arquero)
export class RangedEnemy extends Enemy {
    constructor(scene, x, y) {
        // Cazador de Datos: Reciclador que dispara ráfagas de código
        super(scene, x, y, 20, 80, 0xaa5500, 25);
        this.name = "Cazador de Datos";
        this.lastShotTime = 0;
    }

    update(playerSprite, time) {
        if (this.isDead) return;
        if (!this.sprite || !this.sprite.active) return;
        if (!playerSprite || !playerSprite.active) {
            if (this.sprite.body) this.sprite.body.setVelocity(0);
            return;
        }
        
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y);
        
        if (dist < 200) {
            // Huir del jugador
            const angle = Phaser.Math.Angle.Between(playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y);
            this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
        } else if (dist > 300) {
            // Acercarse
            this.scene.physics.moveToObject(this.sprite, playerSprite, this.speed);
        } else {
            // Mantenerse y disparar
            this.sprite.body.setVelocity(0, 0);
        }

        // Disparar
        if (time > this.lastShotTime + 2000 && dist < 400) { // Dispara cada 2 segs
            this.lastShotTime = time;
            this.shoot(playerSprite);
        }
    }

    shoot(playerSprite) {
        // Disparar flecha roja al jugador (la gestionará MainScene)
        this.scene.spawnEnemyArrow(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y);
    }
}

// 5. Enemigo Invocador (Nigromante)
export class SummonerEnemy extends Enemy {
    constructor(scene, x, y) {
        // Oráculo Roto: Conciencia fragmentada que replica errores
        super(scene, x, y, 50, 60, 0x00ff00, 30);
        this.name = "Oráculo Roto";
        this.lastSummonTime = 0;
        this.sprite.setStrokeStyle(3, 0xffffff);
    }

    update(playerSprite, time) {
        if (this.isDead) return;
        if (!this.sprite || !this.sprite.active) return;
        if (!playerSprite || !playerSprite.active) return;
        
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y);
        
        // Mantener distancia extrema
        if (dist < 300) {
            const angle = Phaser.Math.Angle.Between(playerSprite.x, playerSprite.y, this.sprite.x, this.sprite.y);
            this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
        } else {
            this.sprite.body.setVelocity(0, 0);
        }

        // Invocar cada 5 segundos
        if (time > this.lastSummonTime + 5000) {
            this.lastSummonTime = time;
            this.summon();
        }
    }

    summon() {
        if (this.scene.enemies.length > 10) return; // Límite de enemigos
        this.scene.createParticles(this.sprite.x, this.sprite.y, 0x00ff00);
        
        // Spawnear un Slime pequeño cerca
        const rx = this.sprite.x + Phaser.Math.Between(-40, 40);
        const ry = this.sprite.y + Phaser.Math.Between(-40, 40);
        
        const minion = new StandardEnemy(this.scene, rx, ry);
        minion.hp = 15; minion.maxHp = 15;
        minion.sprite.setScale(0.7);
        this.scene.enemies.push(minion);
        this.scene.setupEnemyCollisions(minion);
        
        this.scene.tweens.add({
            targets: minion.sprite,
            alpha: { from: 0, to: 1 },
            duration: 500
        });
    }
}