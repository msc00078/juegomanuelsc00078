import * as Phaser from 'phaser';
import { Player, Boss, 
         StandardEnemy, TankEnemy, RangedEnemy, KamikazeEnemy, SummonerEnemy,
         TeleporterEnemy, HealerEnemy, GuardianEnemy, TrapperEnemy, LaserEliteEnemy,
         applyEnemyScaling } from '../entities';
import { InputManager } from '../managers/InputManager';
import { HUDManager } from '../managers/HUDManager';
import { SpawnManager } from '../managers/SpawnManager';
import { AudioManager } from '../managers/AudioManager';
import { VFXManager } from '../managers/VFXManager';
import { BossAIManager } from '../managers/BossAIManager';
import { CombatManager } from '../managers/CombatManager';
import { LootManager } from '../managers/LootManager';
import { ProgressionManager } from '../managers/ProgressionManager';
import { ObstacleManager } from '../managers/ObstacleManager';
import { EliteManager } from '../managers/EliteManager';
import { EnemyManager } from '../managers/EnemyManager';
import { MobileControls } from '../ui/MobileControls';
import { saveRunResult } from '../supabase';
import { isAdmin } from '../admin';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.lastApiCallTime = 0;
        this.gameOver = false;
        this.isCountdown = true;
        this.apiCallInterval = 3000;

        this.audioManager = null;
        this.vfxManager = null;
        this.bossAIManager = null;
        this.combatManager = null;
        this.lootManager = null;
        this.progressionManager = null;
        this.obstacleManager = null;
        this.eliteManager = null;
        this.enemyManager = null;
        this.inputManager = null;
        this.hudManager = null;
        this.spawnManager = null;
    }

    init() {
        this.bossType = window.gamePersonality || "poeta";
        const currentLvl = this.registry.get('currentLevel') || 1;
        this.apiCallInterval = Math.max(1200, 4000 - (currentLvl * 60));
        if (this.registry.get('currentLevel') === undefined) {
            this.registry.set('currentLevel', 1);
            this.registry.set('gold', 0);
            this.registry.set('playerHp', 100);
            this.registry.set('playerMaxHp', 100);
            this.registry.set('swordDamage', 10);
            this.registry.set('hasBow', false);
            this.registry.set('hasBombs', false);
            this.registry.set('equippedWeapon', 1);
            this.registry.set('relics', []);
            this.registry.set('runXp', 0);
            this.registry.set('runLevel', 1);
            this.registry.set('xpToNext', 50);
            this.registry.set('combo', 0);
            this.registry.set('maxCombo', 0);
            this.registry.set('score', 0);
        }

        // Reparar posibles NaNs o indefinidos de sesiones anteriores corruptas
        if (isNaN(this.registry.get('playerHp')) || this.registry.get('playerHp') === undefined) this.registry.set('playerHp', 100);
        if (isNaN(this.registry.get('playerMaxHp')) || this.registry.get('playerMaxHp') === undefined) this.registry.set('playerMaxHp', 100);
        if (isNaN(this.registry.get('swordDamage')) || this.registry.get('swordDamage') === undefined) this.registry.set('swordDamage', 10);
        if (isNaN(this.registry.get('gold')) || this.registry.get('gold') === undefined) this.registry.set('gold', 0);
        if (this.registry.get('runLevel') === undefined) this.registry.set('runLevel', 1);
        if (this.registry.get('runXp') === undefined) this.registry.set('runXp', 0);
        if (this.registry.get('xpToNext') === undefined) this.registry.set('xpToNext', 50);
        if (this.registry.get('combo') === undefined) this.registry.set('combo', 0);
        if (this.registry.get('score') === undefined) this.registry.set('score', 0);

        this.currentLevel = this.registry.get('currentLevel') || 1;
        this.gold = this.registry.get('gold');
        this.score = this.registry.get('score');
        this.gameOver = false;
        this.isChangingLevel = false;
        this.isBossLevel = (this.currentLevel % 5 === 0);
        this.isCountdown = true;
        this.nodeType = this.registry.get('nextNodeType') || 'combat';
        
        // Inicializar gestión de música si no existe
        if (!this.registry.get('currentMusicKey')) {
            this.registry.set('currentMusicKey', null);
        }
    }

    create() {
        // Límites del mundo: top=70 (bajo el HUD), bottom=scale.height
        // Los enemigos tienen setCollideWorldBounds(true) → no pueden salir
        this.physics.world.setBounds(0, 70, this.scale.width, this.scale.height - 70);

        this.add.grid(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 32, 32, 0x35682d, 1, 0x22441d, 1);

        // Inicializar Managers de entrada antes que el jugador
        this.inputManager = new InputManager(this);
        this.player = new Player(this, this.scale.width / 2, this.scale.height - 100);

        this.enemies = [];
        this.golds = this.physics.add.group();
        this.hearts = this.physics.add.group();
        this.arrows = this.physics.add.group();
        this.bombs = this.physics.add.group();
        this.enemyArrows = this.physics.add.group();
        this.xpOrbs = this.physics.add.group();
        this.enemySprites = this.physics.add.group();
        this.trapZones = this.physics.add.staticGroup(); // zonas de ralentización del Trampero
        this.crates = this.physics.add.staticGroup(); // Obstáculos
        this.portal = null;

        this.nodeType = this.registry.get('nextNodeType') || 'combat';

        // 1. Inicializar Gestores
        this.hudManager = new HUDManager(this);
        this.spawnManager = new SpawnManager(this);
        this.audioManager = new AudioManager(this);
        this.vfxManager = new VFXManager(this);
        this.bossAIManager = new BossAIManager(this);
        this.combatManager = new CombatManager(this);
        this.lootManager = new LootManager(this);
        this.progressionManager = new ProgressionManager(this);
        this.obstacleManager = new ObstacleManager(this);
        this.eliteManager = new EliteManager(this);
        this.enemyManager = new EnemyManager(this);
        this.mobileControls = new MobileControls(this);
        this.inputManager.setMobileJoystick(this.mobileControls.joystick);

        // 2. Preparar Contenedores de UI que se usarán en el spawn (Boss, etc)
        this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, "", { fontSize: '40px', fill: '#fff', backgroundColor: '#000' }).setOrigin(0.5).setDepth(101);
        this.gameOverText.setVisible(false);

        // Barra de Boss Mejorada (Abajo)
        this.bossHpContainer = this.add.container(this.scale.width / 2, this.scale.height - 40).setVisible(false).setDepth(101).setScrollFactor(0);
        this.bossHpBg = this.add.rectangle(0, 0, 400, 20, 0x330000).setOrigin(0.5);
        this.bossHpBar = this.add.rectangle(-200, 0, 400, 20, 0xff0000).setOrigin(0, 0.5);
        this.bossNameText = this.add.text(0, -25, "JEFE FINAL", { fontSize: '18px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        this.bossHpContainer.add([this.bossHpBg, this.bossHpBar, this.bossNameText]);

        // 3. Spawnear entidades (Ahora tienen sus contenedores listos)
        if (!this.isBossLevel && this.nodeType !== 'elite' && this.nodeType !== 'treasure') {
            this.spawnNormalEnemies();
        } else if (this.isBossLevel) {
            this.spawnBoss();
        } else if (this.nodeType === 'elite') {
            this.isWaitingForElite = true;
            this.showElitePrompt();
        } else if (this.nodeType === 'treasure') {
            this.spawnTreasureRoom();
        }

        // 4. Iniciar Cuenta atrás
        const countdownText = this.add.text(this.scale.width / 2, this.scale.height / 2, "3", {
            fontSize: '120px', fill: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2000);

        let count = 3;
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                count--;
                if (count > 0) {
                    countdownText.setText(count);
                } else if (count === 0) {
                    countdownText.setText("¡ACCIÓN!");
                    countdownText.setFill("#00ff00");
                } else {
                    countdownText.destroy();
                    this.isCountdown = false;
                }
            },
            repeat: 3
        });

        // 5. Atajos de teclado
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-P', () => this.pauseGame());
            this.input.keyboard.on('keydown-ESC', () => this.pauseGame());
            this.input.keyboard.on('keydown-I', () => this.toggleInventory());
            this.input.keyboard.on('keydown-TAB', () => this.toggleInventory());
            this.input.keyboard.on('keydown-BACKTICK', () => {
                if (isAdmin(window.__phaserUser)) {
                    this.scene.pause();
                    this.scene.launch('AdminScene');
                }
            });
        }

        this.lastKillTime = 0;
        
        // Iniciar música de la escena
        this.handleMusic();

        // Colisiones globales de jugador con objetos
        this.physics.add.overlap(this.player.sprite, this.enemyArrows, (playerSprite, arrow) => {
            arrow.destroy();
            if (!this.player.isInvulnerable) {
                this.player.takeDamage(10);
                this.updateUI();
            }
        });

        this.physics.add.overlap(this.player.sprite, this.golds, (playerSprite, goldObj) => {
            goldObj.destroy();
            this.gold += Phaser.Math.Between(5, 15);
            this.registry.set('gold', this.gold);
            this.updateUI();
        });

        this.physics.add.overlap(this.player.sprite, this.hearts, (playerSprite, heartObj) => {
            heartObj.destroy();
            this.player.hp += 20;
            if (this.player.hp > this.player.maxHp) this.player.hp = this.player.maxHp;
            this.updateUI();
            this.createParticles(this.player.sprite.x, this.player.sprite.y, 0x00ff00);
        });

        this.physics.add.overlap(this.player.sprite, this.xpOrbs, (playerSprite, xpOrb) => {
            xpOrb.destroy();
            this.gainXp(10);
        });

        // Usar group en lugar de map para que afecte a futuros enemigos
        this.physics.add.collider(this.enemySprites, this.crates);

        this.physics.add.overlap(this.player.sword, this.crates, (sword, obstacle) => {
            if (this.player.isAttacking) {
                if (obstacle.isIndestructible) {
                    this.showDamageNumber(obstacle.x, obstacle.y, "BLOQ");
                    return;
                }
                this.destroyCrate(obstacle);
            }
        });

        // Colisión de flechas con obstáculos
        this.physics.add.collider(this.arrows, this.crates, (arrow, obstacle) => {
            if (!obstacle.isIndestructible) {
                this.destroyCrate(obstacle);
            }
            arrow.destroy();
        });

        // LOS BLOQUES CANCELAN PROYECTILES ENEMIGOS
        this.physics.add.collider(this.enemyArrows, this.crates, (arrow) => {
            arrow.destroy();
        });

        // Daño al jugador por obstáculos peligrosos (Collider único)
        this.physics.add.collider(this.player.sprite, this.crates, (player, obstacle) => {
            if (obstacle.doesDamage && !this.player.isInvulnerable) {
                this.player.takeDamage(20); 
                this.cameras.main.flash(200, 255, 0, 0);
                this.updateUI();
                this.pushBack(this.player.sprite, obstacle, 1200); 
            }
        });

        // Evento Resume: Cuando volvemos de LevelUpScene, actualizar stats del jugador
        this.events.on('resume', () => {
            this.player.maxHp = this.registry.get('playerMaxHp');
            this.player.hp = this.registry.get('playerHp');
            // La velocidad extra y el daño se leen dinámicamente o se aplican si la lógica lo requiere
            this.updateUI();
        });

        this.spawnCrates();
        this.updateUI();
            }

    getPlayerDamage() {
        return this.combatManager.getPlayerDamage();
    }

    showElitePrompt() {
        this.eliteManager.showPrompt();
    }

    pauseGame() {
        if (this.gameOver) return;
        this.scene.pause();
        this.scene.launch('PauseScene');
    }

    toggleInventory() {
        if (this.gameOver) return;
        this.scene.pause();
        this.scene.launch('InventoryScene');
    }

    spawnElite() {
        this.eliteManager.spawnElite();
    }

    spawnBoss() {
        // Boss Intro Cinematic
        this.cameras.main.flash(1000, 255, 0, 0);
        this.cameras.main.shake(1000, 0.02);

        this.bosses = [];
        
        // Si el nivel es >= 35, hay un 25% de probabilidad de Dual Boss (Más progresivo)
        const isDual = this.currentLevel >= 35 && Math.random() < 0.25;
        
        if (isDual) {
            const b1 = new Boss(this, this.scale.width / 4, 180, this.bossType, this.currentLevel);
            const b2 = new Boss(this, (this.scale.width / 4) * 3, 180, this.bossType, this.currentLevel);
            // Nerf de HP para duales
            b1.hp = Math.round(b1.hp * 0.85); b1.maxHp = b1.hp;
            b2.hp = Math.round(b2.hp * 0.85); b2.maxHp = b2.hp;
            this.bosses.push(b1, b2);
            this.bossNameText.setText(`${this.bossType.toUpperCase()}S (DUAL)`);
        } else {
            const boss = new Boss(this, this.scale.width / 2, 180, this.bossType, this.currentLevel);
            this.bosses.push(boss);
            this.bossNameText.setText(this.bossType.toUpperCase());
        }

        this.bossHpContainer.setVisible(true);

        this.bossText = this.add.text(this.scale.width / 2, 130, "¡PREPÁRATE PARA TU FINAL!", {
            fontSize: '20px', fill: '#ff0000', backgroundColor: '#000', fontStyle: 'bold', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(101);

        this.tweens.add({
            targets: this.bossText,
            alpha: { from: 1, to: 0.3 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.bosses.forEach(boss => {
            this.physics.add.overlap(this.player.sword, boss.sprite, () => {
                if (this.player.isAttacking && boss.hp > 0) {
                    this.pushBack(boss.sprite, this.player.sprite, 100);
                    boss.takeDamage(this.getPlayerDamage() / 2);
                    this.updateUI();
                }
            });

            this.physics.add.collider(this.player.sprite, boss.sprite, () => {
                if (!this.gameOver && boss.hp > 0) {
                    // El daño de contacto del boss escala con su nivel
                    this.player.takeDamage(boss.contactDamage || 15);
                    this.updateUI();
                    this.pushBack(this.player.sprite, boss.sprite, 300);
                }
            });

            this.physics.add.overlap(this.player.sprite, boss.attacks, (playerSprite, attackObj) => {
                if (!this.gameOver && boss.hp > 0) {
                    // El daño del proyectil/área escala
                    this.player.takeDamage(boss.attackDamage || 20);
                    this.updateUI();
                    attackObj.destroy();
                }
            });

            // NUEVO: Los bloques paran los proyectiles/ataques del boss
            // Usamos overlap y comprobamos existencia para evitar crashes en dispositivos móviles
            this.physics.add.overlap(boss.attacks, this.crates, (attackObj) => {
                if (attackObj && attackObj.active) {
                    attackObj.destroy();
                }
            });

            this.physics.add.overlap(this.arrows, boss.sprite, (bossSprite, arrow) => {
                if (boss.hp > 0) {
                    const relics = this.registry.get('relics') || [];
                    if (!relics.includes('perforante')) arrow.destroy();
                    boss.takeDamage(10);
                    this.updateUI();
                }
            });
        });
    }

    spawnNormalEnemies() {
        this.spawnManager.spawnNormalEnemies();
    }

    spawnKamikazeFromBoss() {
        this.spawnManager.spawnKamikazeFromBoss();
    }

    setupEnemyCollisions(enemy) {
        if (!enemy.sprite) return;
        this.enemySprites.add(enemy.sprite);
        const relics = this.registry.get('relics') || [];

        // Colisión espada → enemigo
        this.physics.add.overlap(this.player.sword, enemy.sprite, () => {
            if (!this.player.isAttacking || enemy.hp <= 0) return;

            // Guardián: bloquea el daño frontal
            if (enemy.isShielded && enemy.isHitFromBehind) {
                const fromBehind = enemy.isHitFromBehind(
                    this.player.sprite.x, this.player.sprite.y,
                    this.player.sprite.x, this.player.sprite.y
                );
                if (!fromBehind) {
                    this.showDamageNumber(enemy.sprite.x, enemy.sprite.y - 10, '🛡');
                    return; // daño bloqueado
                }
            }

            this.pushBack(enemy.sprite, this.player.sprite, 200);
            let damage = this.getPlayerDamage();
            const isCrit = Math.random() < 0.15;
            if (isCrit) {
                damage *= 2;
                this.showCritEffect(enemy.sprite.x, enemy.sprite.y);
            }
            enemy.takeDamage(damage);
            if (relics.includes('sangrado')) enemy.startBleed();
        });

        // Colisión cuerpo → jugador (usa contactDamage del enemigo)
        this.physics.add.collider(this.player.sprite, enemy.sprite, () => {
            if (this.gameOver || enemy.hp <= 0) return;
            if (relics.includes('espinas')) enemy.takeDamage(10);
            this.player.takeDamage(enemy.contactDamage ?? 5);
            this.updateUI();
            this.pushBack(this.player.sprite, enemy.sprite, 300);
        });

        // Colisión flecha → enemigo
        this.physics.add.overlap(this.arrows, enemy.sprite, (enemySprite, arrow) => {
            if (enemy.hp <= 0) return;
            let dmg = 10;
            if (relics.includes('sniper')) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.sprite.x, this.player.sprite.y,
                    enemySprite.x, enemySprite.y
                );
                // Reducido de 300 a 200 para que se note más
                if (dist > 200) dmg += 15; 
            }
            if (!relics.includes('perforante')) arrow.destroy();
            enemy.takeDamage(dmg);
        });
    }

    spawnArrow(x, y, facing, angleOffset = 0) {
        this.combatManager.spawnArrow(x, y, facing, angleOffset);
    }

    spawnEnemyBomb(x, y, damage = 30) {
        this.combatManager.spawnEnemyBomb(x, y, damage);
    }

    spawnBomb(x, y, isSticky = false) {
        this.combatManager.spawnBomb(x, y, isSticky);
    }

    explodeBomb(x, y) {
        this.combatManager.explodeBomb(x, y);
    }

    spawnEnemyArrow(ex, ey, px, py) {
        this.combatManager.spawnEnemyArrow(ex, ey, px, py);
    }

    spawnGold(x, y) {
        this.lootManager.spawnGold(x, y);
    }

    spawnHealth(x, y) {
        this.lootManager.spawnHealth(x, y);
    }

    spawnXp(x, y) {
        this.lootManager.spawnXp(x, y);
    }

    gainXp(amount) {
        this.lootManager.gainXp(amount);
    }

    levelUp() {
        this.scene.pause();
        this.scene.launch('LevelUpScene');
    }

    showDamageNumber(x, y, damage) {
        this.vfxManager.showDamageNumber(x, y, damage);
    }

    showCritEffect(x, y) {
        this.vfxManager.showCritEffect(x, y);
    }

    spawnCrates() {
        this.obstacleManager.spawnCrates();
    }

    destroyCrate(crate) {
        this.obstacleManager.destroyCrate(crate);
    }

    checkLevelClear() {
        this.progressionManager.checkLevelClear();
    }

    nextLevel() {
        this.progressionManager.nextLevel();
    }

    spawnTreasureRoom() {
        this.add.text(this.scale.width / 2, 180, "SALA DEL TESORO", { fontSize: '36px', fill: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);

        for (let i = 0; i < 5; i++) {
            const rx = Phaser.Math.Between(this.scale.width / 2 - 200, this.scale.width / 2 + 200);
            const ry = Phaser.Math.Between(250, this.scale.height - 200);
            this.time.delayedCall(i * 200, () => {
                this.spawnGold(rx, ry);
                this.createParticles(rx, ry, 0xffd700);
            });
        }

        if (Math.random() < 0.3) {
            this.spawnHealth(this.scale.width / 2, this.scale.height / 2);
        }
    }

    updateUI() {
        this.hudManager.update();

        // Actualizar barra de vida del Boss (Suma de todos los bosses activos)
        if (this.isBossLevel && this.bosses && this.bossHpBar) {
            let totalHp = 0;
            let totalMaxHp = 0;
            this.bosses.forEach(b => {
                totalHp += Math.max(0, b.hp);
                totalMaxHp += b.maxHp;
            });

            if (totalMaxHp > 0) {
                const percent = totalHp / totalMaxHp;
                this.bossHpBar.width = Math.max(0, 400 * percent);
            }
            
            if (totalHp <= 0 && this.bosses.every(b => b.hp <= 0)) {
                // Pequeño delay para que se vea la barra vacía antes de desaparecer
                this.time.delayedCall(1000, () => {
                    if (this.bossHpContainer) this.bossHpContainer.setVisible(false);
                });
            } else {
                this.bossHpContainer.setVisible(true);
            }
        }

        if (this.player.hp <= 0 && !this.gameOver) {
            this.cameras.main.shake(500, 0.05);
            this.endGame("¡HAS CAÍDO EN COMBATE!");
        }
    }

    cycleWeapon() {
        this.combatManager.cycleWeapon();
    }

    drawVignette() {
        this.vfxManager.drawVignette(this.vignette);
    }

    pushBack(target, source, force) {
        this.vfxManager.pushBack(target, source, force);
    }

    createParticles(x, y, color) {
        this.vfxManager.createParticles(x, y, color);
    }

    update(time, delta) {
        if (this.gameOver || this.isCountdown) {
            if (this.player && this.player.sprite && this.player.sprite.body) {
                this.player.sprite.body.setVelocity(0);
            }
            return;
        }
        this.player.update(time);

        this.lootManager.updateMagnetism();

        // Combo decay (3 segundos)
        if (time > this.lastKillTime + 3000 && this.registry.get('combo') > 0) {
            this.registry.set('combo', 0);
            this.updateUI();
        }

        this.bossAIManager.update(time);

        this.enemies.forEach(enemy => {
            if (enemy.hp > 0 && enemy.sprite && enemy.sprite.active) {
                enemy.update(this.player.sprite, time);
                // Clamp de posición: evita que salgan del mundo por velocidades extremas
                const minY = 80;
                const maxY = this.scale.height - 10;
                const minX = 10;
                const maxX = this.scale.width - 10;
                if (enemy.sprite.y < minY) { enemy.sprite.y = minY; enemy.sprite.body.setVelocityY(0); }
                if (enemy.sprite.y > maxY) { enemy.sprite.y = maxY; enemy.sprite.body.setVelocityY(0); }
                if (enemy.sprite.x < minX) { enemy.sprite.x = minX; enemy.sprite.body.setVelocityX(0); }
                if (enemy.sprite.x > maxX) { enemy.sprite.x = maxX; enemy.sprite.body.setVelocityX(0); }
                // Dibujar mini barra de vida para cada enemigo
                this.drawEnemyHealthBar(enemy);
            }
        });

        // Zonas de trampa del Trampero: ralentizan al jugador
        let inTrap = false;
        this.trapZones.getChildren().forEach(trap => {
            if (!trap.active) return;
            const d = Phaser.Math.Distance.Between(
                this.player.sprite.x, this.player.sprite.y, trap.x, trap.y
            );
            if (d < 35) inTrap = true;
        });
        if (inTrap && !this._inTrap) {
            this._inTrap = true;
            this.player.speed = Math.round(this.player.speed * 0.45);
        } else if (!inTrap && this._inTrap) {
            this._inTrap = false;
            // Restaurar velocidad original
            this.player.speed = this.player._baseSpeed ?? 200;
        }

        this.checkLevelClear();
    }

    onEnemyDeath(enemy) {
        this.enemyManager.onEnemyDeath(enemy);
    }

    drawEnemyHealthBar(enemy) {
        this.enemyManager.drawHealthBar(enemy);
    }

    async requestBossAction(targetBoss) {
        return this.bossAIManager.requestBossAction(targetBoss);
    }

    endGame(message) {
        this.gameOver = true;
        this.physics.pause(); 
        this.playSFX('sonido_gameover', 0.8);

        // Oscurecer fondo
        const overlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.8).setDepth(1000);
        
        // Contenedor Game Over
        const goContainer = this.add.container(this.scale.width / 2, this.scale.height / 2).setDepth(1001);
        
        const box = this.add.rectangle(0, 0, 500, 350, 0x050505, 0.9);
        box.setStrokeStyle(2, 0xff0000, 1);
        
        const title = this.add.text(0, -120, "SYSTEM FAILURE", {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '42px', fill: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5);

        const crystalsEarned = Math.floor(Math.max(0, this.currentLevel - 8) / 12);
        const stats = `SECTOR ALCANZADO: ${this.currentLevel}\nRECURSOS RECUPERADOS: ${crystalsEarned} 💎\nSCORE TOTAL: ${this.score}`;
        
        const statsText = this.add.text(0, 0, stats, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px', fill: '#fff', align: 'center', lineSpacing: 10
        }).setOrigin(0.5);

        const hint = this.add.text(0, 120, "PULSA CUALQUIER TECLA O ESPERA 5s", {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '16px', fill: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5);

        goContainer.add([box, title, statsText, hint]);

        // Guardar resultado y cristales vía backend (Supabase)
        saveRunResult(this.score, this.currentLevel, crystalsEarned).catch(err => console.error(err));
        // Persistencia local como fallback
        let meta = JSON.parse(localStorage.getItem('metaStats')) || { crystals: 0, hpLevel: 0, dmgLevel: 0, speedLevel: 0 };
        meta.crystals = (meta.crystals || 0) + crystalsEarned;
        localStorage.setItem('metaStats', JSON.stringify(meta));

        // Detener música in-game y de menú
        this.sound.stopAll();
        if (window.stopMenuMusic) window.stopMenuMusic();

        // Auto-reinicio tras 5 segundos
        const restartTimer = this.time.delayedCall(5000, () => {
            this.scene.start('MenuScene');
        });

        // Reinicio con cualquier tecla tras un breve cooldown de seguridad (1s)
        this.time.delayedCall(1000, () => {
            this.input.keyboard.once('keydown', () => {
                restartTimer.destroy(); // Cancelar el auto-reinicio si se pulsa una tecla
                this.scene.start('MenuScene');
            });
            this.input.once('pointerdown', () => {
                restartTimer.destroy();
                this.scene.start('MenuScene');
            });
        });
    }

    handleMusic() {
        this.audioManager.handleSceneMusic();
    }

    switchTrack(targetTrack) {
        this.audioManager._switchTrack(targetTrack);
    }

    playSFX(key, volume = 0.6) {
        this.audioManager.playSFX(key, volume);
    }

    shutdown() {
        this.sound.stopAll();
        if (window.stopMenuMusic) window.stopMenuMusic();
    }
}
