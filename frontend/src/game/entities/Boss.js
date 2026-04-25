import * as Phaser from 'phaser';

export class Boss {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.hp = 600; // Un poco más de vida
        this.maxHp = 600;
        this.bossType = type; 
        this.phase = 1;
        this.isDead = false;  // Track if boss is already dead
        
        // Sprite
        this.sprite = scene.add.rectangle(x, y, 70, 70, 0xff0000);
        this.sprite.setStrokeStyle(3, 0x000000);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setImmovable(true);
        
        // Grupo para proyectiles y ataques
        this.attacks = scene.physics.add.group();

        // Efecto visual de aura según fase
        this.aura = scene.add.circle(x, y, 50, 0xff0000, 0.2).setVisible(false);
    }

    takeDamage(amount) {
        if (this.isDead) return;  // Prevent damage if already dead
        if (this.hp <= 0) return;
        
        this.hp -= amount;
        this.scene.showDamageNumber(this.sprite.x, this.sprite.y, amount);
        
        // Ensure hp doesn't go below 0
        if (this.hp < 0) this.hp = 0;
        
        this.sprite.setFillStyle(0xffffff);
        this.scene.time.delayedCall(150, () => {
            if (this.sprite.active) {
                if (this.phase === 1) this.sprite.setFillStyle(0xff0000);
                else if (this.phase === 2) this.sprite.setFillStyle(0xaa0000);
                else this.sprite.setFillStyle(0x440000);
            }
        });

        this.scene.createParticles(this.sprite.x, this.sprite.y, 0xffffff);

        // Cambio de Fases
        const hpPercent = this.hp / this.maxHp;
        if (this.phase === 1 && hpPercent < 0.6) {
            this.enterPhase(2);
        } else if (this.phase === 2 && hpPercent < 0.3) {
            this.enterPhase(3);
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        if (this.isDead) return;  // Prevent multiple death calls
        this.isDead = true;
        
        this.sprite.setActive(false).setVisible(false);
        this.aura.destroy();
        
        // Additional boss death logic can be added here
    }

    enterPhase(newPhase) {
        this.phase = newPhase;
        this.scene.cameras.main.shake(500, 0.02);
        
        if (newPhase === 2) {
            this.aura.setVisible(true).setFillStyle(0xff0000, 0.3);
            this.scene.tweens.add({ targets: this.aura, scale: 1.5, duration: 1000, yoyo: true, repeat: -1 });
            this.scene.bossText.setText("¡ESTO NO HA TERMINADO!");
        } else if (newPhase === 3) {
            this.aura.setFillStyle(0xffffff, 0.5);
            this.sprite.setStrokeStyle(5, 0xffffff);
            this.scene.bossText.setText("¡MUERE, INSECTO!");
        }
    }

    executeAction(action, intensity, playerSprite) {
        if (!this.sprite.active || this.isDead) return;
        
        // La fase aumenta la velocidad y agresividad base
        const phaseMod = 1 + (this.phase * 0.3);
        const speedMult = (0.5 + (intensity * 1.5)) * phaseMod; 

        this.aura.setPosition(this.sprite.x, this.sprite.y);

        if (action === "dash") {
            const dashEvent = this.scene.time.addEvent({
                delay: 50 / phaseMod,
                callback: () => {
                    if(!this.sprite.active || this.isDead) return;
                    let trail = this.scene.add.rectangle(this.sprite.x, this.sprite.y, 70, 70, this.sprite.fillColor, 0.5);
                    this.scene.tweens.add({ targets: trail, alpha: 0, duration: 300, onComplete: () => trail.destroy() });
                },
                repeat: 10
            });

            this.scene.physics.moveToObject(this.sprite, playerSprite, 250 * speedMult);
            this.scene.time.delayedCall(800, () => {
                if(this.sprite.active && !this.isDead) this.sprite.body.setVelocity(0);
                dashEvent.remove();
            });
        } 
        else if (action === "projectile") {
            this.sprite.body.setVelocity(0);
            
            // En fase 3 dispara 3 proyectiles
            const count = this.phase === 3 ? 3 : 1;
            for(let i=0; i<count; i++) {
                const proj = this.scene.add.circle(this.sprite.x, this.sprite.y, 12, 0xffa500);
                proj.setStrokeStyle(2, 0xffffff);
                this.attacks.add(proj);
                
                const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, playerSprite.x, playerSprite.y) + (i*0.2 - 0.2);
                this.scene.physics.velocityFromRotation(angle, 350 * speedMult, proj.body.velocity);
                
                this.scene.time.delayedCall(4000, () => { if (proj.active) proj.destroy(); });
            }
        }
        else if (action === "area") {
            this.sprite.body.setVelocity(0);
            const area = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, 0x8a2be2, 0.6);
            this.attacks.add(area); 
            area.body.setCircle(20);
            area.body.setImmovable(true);

            this.scene.tweens.add({
                targets: area,
                radius: 180 * speedMult, 
                scale: 9 * speedMult,    
                alpha: 0,
                duration: 1500 / phaseMod,
                onComplete: () => area.destroy()
            });
        }
        
        // Fase 3: Probabilidad de invocar un Kamikaze
        if (this.phase === 3 && Math.random() < 0.2) {
            this.scene.spawnKamikazeFromBoss();
        }
    }
}