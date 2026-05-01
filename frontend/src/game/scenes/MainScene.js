import * as Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Boss } from '../entities/Boss';
import { StandardEnemy, TankEnemy, RangedEnemy, KamikazeEnemy, SummonerEnemy } from '../entities/Enemy';
import axios from 'axios';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.lastApiCallTime = 0;
        this.apiCallInterval = 3000;
        this.gameOver = false;
        this.bossType = "poeta";
        this.isCountdown = true;
    }

    init() {
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

        this.currentLevel = this.registry.get('currentLevel') || 1;
        this.gold = this.registry.get('gold');
        this.gameOver = false;
        this.isBossLevel = (this.currentLevel % 5 === 0);
        this.isCountdown = true;
    }

    create() {
        // Límites del mundo: top=70 (bajo el HUD), bottom=scale.height
        // Los enemigos tienen setCollideWorldBounds(true) → no pueden salir
        this.physics.world.setBounds(0, 70, this.scale.width, this.scale.height - 70);

        this.add.grid(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 32, 32, 0x35682d, 1, 0x22441d, 1);

        this.player = new Player(this, this.scale.width / 2, this.scale.height - 100);

        this.enemies = [];
        this.golds = this.physics.add.group();
        this.hearts = this.physics.add.group();
        this.arrows = this.physics.add.group();
        this.bombs = this.physics.add.group();
        this.enemyArrows = this.physics.add.group();
        this.xpOrbs = this.physics.add.group();
        this.enemySprites = this.physics.add.group();
        this.portal = null;

        this.nodeType = this.registry.get('nextNodeType') || 'combat';

        // HUD Dinámico
        this.vignette = this.add.graphics();
        this.drawVignette();

        this.topPanel = this.add.rectangle(this.scale.width / 2, 30, this.scale.width, 60, 0x000000, 0.6).setDepth(100).setScrollFactor(0);
        
        // Efecto CRT / Scanlines para la inmersión Neón Sagrado
        for (let i = 0; i < this.scale.height; i += 4) {
            this.add.rectangle(this.scale.width/2, i, this.scale.width, 1, 0x000000, 0.1).setScrollFactor(0).setDepth(200);
        }

        let nodeLabel = this.nodeType.toUpperCase();
        if (nodeLabel === 'COMBAT') nodeLabel = 'FRAGMENTO DE COMBATE';
        if (nodeLabel === 'ELITE') nodeLabel = 'ANOMALÍA CRÍTICA';
        if (nodeLabel === 'TREASURE') nodeLabel = 'NÚCLEO DE DATOS';
        if (nodeLabel === 'SHOP') nodeLabel = 'MERCADO NEGRO';
        if (nodeLabel === 'EVENT') nodeLabel = 'GLITCH EN LA REALIDAD';
        if (this.isBossLevel) nodeLabel = 'CONCIENCIA ROTA (JEFE)';

        this.levelText = this.add.text(this.scale.width / 2, 20, `SECTOR 0${this.currentLevel} • ${nodeLabel}`, {
            fontSize: '18px', fill: '#00ffff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);

        // Barra de vida gráfica
        this.hpBarBg = this.add.rectangle(120, 45, 150, 15, 0x333333).setDepth(101).setScrollFactor(0);
        this.hpBar = this.add.rectangle(120, 45, 150, 15, 0x00ff00).setDepth(102).setScrollFactor(0);
        this.playerHpText = this.add.text(120, 25, `HP: ${this.player.hp}/${this.player.maxHp}`, {
            fontSize: '14px', fill: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);

        // Barra de XP gráfica
        this.xpBarBg = this.add.rectangle(120, 62, 150, 8, 0x333333).setDepth(101).setScrollFactor(0);
        this.xpBar = this.add.rectangle(120, 62, 150, 8, 0x00ffff).setDepth(102).setScrollFactor(0);
        this.runLevelText = this.add.text(120, 75, `LVL: ${this.registry.get('runLevel')}`, {
            fontSize: '12px', fill: '#00ffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(103).setScrollFactor(0);

        this.goldText = this.add.text(this.scale.width - 20, 30, `🪙 ${this.gold}`, {
            fontSize: '22px', fill: '#ffd700', fontStyle: 'bold'
        }).setOrigin(1, 0.5).setDepth(101).setScrollFactor(0);

        this.weaponText = this.add.text(this.scale.width / 2, this.scale.height - 30, "1 - ESPADA", {
            fontSize: '18px', fill: '#fff', backgroundColor: '#0077ff', padding: { x: 15, y: 5 }
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        
        this.weaponText.setInteractive({ useHandCursor: true });
        this.weaponText.on('pointerdown', () => {
            let w = this.registry.get('equippedWeapon') || 1;
            w++;
            if (w > 3) w = 1;
            this.registry.set('equippedWeapon', w);
            this.updateUI();
        });

        // Atajos de teclado adicionales
        this.input.keyboard.on('keydown-P', () => this.pauseGame());
        this.input.keyboard.on('keydown-ESC', () => this.pauseGame());

        this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, "", { fontSize: '40px', fill: '#fff', backgroundColor: '#000' }).setOrigin(0.5).setDepth(101);
        this.gameOverText.setVisible(false);

        // Barra de Boss Mejorada (Abajo)
        this.bossHpContainer = this.add.container(this.scale.width / 2, this.scale.height - 40).setVisible(false).setDepth(101).setScrollFactor(0);
        this.bossHpBg = this.add.rectangle(0, 0, 400, 20, 0x330000).setOrigin(0.5);
        this.bossHpBar = this.add.rectangle(-200, 0, 400, 20, 0xff0000).setOrigin(0, 0.5);
        this.bossNameText = this.add.text(0, -25, "JEFE FINAL", { fontSize: '18px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        this.bossHpContainer.add([this.bossHpBg, this.bossHpBar, this.bossNameText]);

        // Combo UI
        this.comboText = this.add.text(this.scale.width - 20, 90, "", { fontSize: '24px', fill: '#ff00ff', fontStyle: 'bold' }).setOrigin(1, 0.5).setDepth(101).setScrollFactor(0);
        this.lastKillTime = 0;

        if (this.isBossLevel) {
            // Boss Intro Cinematic
            this.cameras.main.flash(1000, 255, 0, 0);
            this.cameras.main.shake(1000, 0.02);

            this.boss = new Boss(this, this.scale.width / 2, 180, this.bossType);
            this.bossHpContainer.setVisible(true);
            this.bossNameText.setText(this.bossType.toUpperCase());

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

            this.physics.add.overlap(this.player.sword, this.boss.sprite, () => {
                if (this.player.isAttacking && this.boss.hp > 0) {
                    this.pushBack(this.boss.sprite, this.player.sprite, 100);
                    this.boss.takeDamage(this.getPlayerDamage() / 2);
                    this.updateUI();
                }
            });

            this.physics.add.collider(this.player.sprite, this.boss.sprite, () => {
                if (!this.gameOver) {
                    this.player.takeDamage(10);
                    this.updateUI();
                    this.pushBack(this.player.sprite, this.boss.sprite, 300);
                }
            });

            this.physics.add.overlap(this.player.sprite, this.boss.attacks, (playerSprite, attackObj) => {
                if (!this.gameOver) {
                    this.player.takeDamage(15);
                    this.updateUI();
                    attackObj.destroy();
                }
            });

            this.physics.add.overlap(this.arrows, this.boss.sprite, (bossSprite, arrow) => {
                if (this.boss.hp > 0) {
                    const relics = this.registry.get('relics') || [];
                    if (!relics.includes('perforante')) arrow.destroy();
                    this.boss.takeDamage(10);
                    this.updateUI();
                }
            });

        } else if (this.nodeType === 'elite') {
            this.isWaitingForElite = true;
            this.showElitePrompt();
        } else if (this.nodeType === 'treasure') {
            this.spawnTreasureRoom();
        } else {
            this.spawnNormalEnemies();
        }

        // Inventario Tecla I o TAB
        this.input.keyboard.on('keydown-I', () => this.toggleInventory());
        this.input.keyboard.on('keydown-TAB', () => this.toggleInventory());

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

        this.crates = this.physics.add.staticGroup();
        this.physics.add.collider(this.player.sprite, this.crates);

        // Usar group en lugar de map para que afecte a futuros enemigos
        this.physics.add.collider(this.enemySprites, this.crates);

        this.physics.add.overlap(this.player.sword, this.crates, (sword, crate) => {
            if (this.player.isAttacking) {
                this.destroyCrate(crate);
            }
        });

        this.spawnCrates();
        this.updateUI();
        
        // Mobile Controls
        if (!this.sys.game.device.os.desktop || navigator.maxTouchPoints > 0) {
            this.createMobileControls();
        }

        // Countdown Logic
        this.startLevelCountdown();
    }

    startLevelCountdown() {
        this.isCountdown = true;
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const countText = this.add.text(cx, cy, "3", {
            fontSize: '80px', fill: '#ffff00', fontStyle: 'bold', stroke: '#000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(200);

        this.time.delayedCall(1000, () => {
            countText.setText("2");
            this.time.delayedCall(1000, () => {
                countText.setText("1");
                this.time.delayedCall(1000, () => {
                    countText.setText("¡ACCIÓN!");
                    countText.setFill('#00ff00');
                    this.isCountdown = false;
                    this.time.delayedCall(500, () => countText.destroy());
                });
            });
        });
    }

    createMobileControls() {
        this.input.addPointer(2); // Permitir multi-touch
        
        this.mobileJoystick = { vx: 0, vy: 0, active: false };

        const joyY = this.scale.height - 120;
        const base = this.add.circle(130, joyY, 70, 0xffffff, 0.2).setDepth(1000).setScrollFactor(0);
        const stick = this.add.circle(130, joyY, 35, 0x00ffff, 0.5).setDepth(1001).setScrollFactor(0);
        
        const atkY = this.scale.height - 130;
        const attackBtn = this.add.circle(this.scale.width - 110, atkY, 55, 0xff0000, 0.5).setDepth(1000).setScrollFactor(0).setInteractive();
        const attackTxt = this.add.text(this.scale.width - 110, atkY, "ATK", { fontSize: '22px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
        
        attackBtn.on('pointerdown', () => { 
            attackBtn.setAlpha(0.8);
            this.player.attack(); 
        });
        attackBtn.on('pointerup', () => attackBtn.setAlpha(0.5));
        attackBtn.on('pointerout', () => attackBtn.setAlpha(0.5));
        
        const dashY = this.scale.height - 60;
        const dashBtn = this.add.circle(this.scale.width - 230, dashY, 42, 0x00ff00, 0.5).setDepth(1000).setScrollFactor(0).setInteractive();
        const dashTxt = this.add.text(this.scale.width - 230, dashY, "DASH", { fontSize: '18px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
        
        dashBtn.on('pointerdown', () => { 
            dashBtn.setAlpha(0.8);
            this.player.dash(); 
        });
        dashBtn.on('pointerup', () => dashBtn.setAlpha(0.5));
        dashBtn.on('pointerout', () => dashBtn.setAlpha(0.5));

        this.input.on('pointerdown', (pointer) => {
            // Ignorar clics en la mitad derecha para no interferir con los botones
            if (pointer.x < this.scale.width / 2 && pointer.y > 100) {
                this.mobileJoystick.active = true;
                this.mobileJoystick.pointerId = pointer.id;
                base.setPosition(pointer.x, pointer.y);
                stick.setPosition(pointer.x, pointer.y);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.mobileJoystick.active && pointer.id === this.mobileJoystick.pointerId) {
                const angle = Phaser.Math.Angle.Between(base.x, base.y, pointer.x, pointer.y);
                let dist = Phaser.Math.Distance.Between(base.x, base.y, pointer.x, pointer.y);
                if (dist > 60) dist = 60;
                
                stick.setPosition(base.x + Math.cos(angle) * dist, base.y + Math.sin(angle) * dist);
                
                this.mobileJoystick.vx = (Math.cos(angle) * dist) / 60;
                this.mobileJoystick.vy = (Math.sin(angle) * dist) / 60;
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (this.mobileJoystick.pointerId === pointer.id) {
                this.mobileJoystick.active = false;
                this.mobileJoystick.vx = 0;
                this.mobileJoystick.vy = 0;
                base.setPosition(130, joyY);
                stick.setPosition(130, joyY);
            }
        });
    }

    getPlayerDamage() {
        let dmg = Number(this.registry.get('swordDamage'));
        if (isNaN(dmg) || dmg <= 0) dmg = 10;

        const relics = this.registry.get('relics') || [];
        if (relics.includes('berserker') && this.player.hp < (this.player.maxHp * 0.3)) {
            dmg = dmg * 1.5;
        }
        return dmg;
    }

    showElitePrompt() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;
        const bg = this.add.rectangle(cx, cy, 540, 260, 0x000000, 0.95).setDepth(200).setStrokeStyle(2, 0x00ffff);
        
        const title = this.add.text(cx, cy - 90, "ANOMALÍA DETECTADA", { fontSize: '28px', fill: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(201);
        const desc = this.add.text(cx, cy - 40, "Un Ente Aumentado ha bloqueado el flujo del código.\n¿Intentarás purgarlo o buscarás un bypass?", { 
            fontSize: '16px', fill: '#fff', align: 'center' 
        }).setOrigin(0.5).setDepth(201);

        const fightBtn = this.add.rectangle(cx - 120, cy + 50, 180, 55, 0x00ffff).setInteractive().setDepth(201);
        const fightTxt = this.add.text(cx - 120, cy + 50, "PURGAR ENTE", { fontSize: '18px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5).setDepth(202);

        const escapeBtn = this.add.rectangle(cx + 120, cy + 50, 180, 55, 0x333333).setInteractive().setDepth(201);
        const escapeTxt = this.add.text(cx + 120, cy + 50, "BYPASS (50%)", { fontSize: '18px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(202);

        const cleanup = () => {
            bg.destroy(); title.destroy(); desc.destroy();
            fightBtn.destroy(); fightTxt.destroy();
            escapeBtn.destroy(); escapeTxt.destroy();
        };

        fightBtn.on('pointerover', () => fightBtn.setFillStyle(0xee0000));
        fightBtn.on('pointerout', () => fightBtn.setFillStyle(0xaa0000));

        fightBtn.on('pointerdown', () => {
            cleanup();
            this.isWaitingForElite = false;
            this.spawnElite();
        });

        escapeBtn.on('pointerover', () => escapeBtn.setFillStyle(0x777777));
        escapeBtn.on('pointerout', () => escapeBtn.setFillStyle(0x555555));

        escapeBtn.on('pointerdown', () => {
            if (Math.random() < 0.5) {
                const msg = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, "¡Escapaste con éxito!", { fontSize: '24px', fill: '#00ff00', backgroundColor: '#000' }).setOrigin(0.5).setDepth(205);
                this.time.delayedCall(1000, () => {
                    cleanup(); msg.destroy();
                    this.isWaitingForElite = false;
                    this.nodeType = 'combat';
                    this.spawnNormalEnemies();
                });
            } else {
                const msg = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, "¡Te han atrapado!", { fontSize: '24px', fill: '#ff0000', backgroundColor: '#000' }).setOrigin(0.5).setDepth(205);
                this.time.delayedCall(1000, () => {
                    cleanup(); msg.destroy();
                    this.isWaitingForElite = false;
                    this.spawnElite();
                });
            }
        });
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
        let elite = new TankEnemy(this, this.scale.width / 2, 180);
        elite.hp = 300; elite.maxHp = 300;
        elite.sprite.setScale(1.5);
        elite.color = 0xff0000; elite.sprite.setFillStyle(0xff0000);
        this.enemies.push(elite);
        this.setupEnemyCollisions(elite);
    }

    spawnNormalEnemies() {
        const numEnemies = 2 + this.currentLevel;
        for (let i = 0; i < numEnemies; i++) {
            let rx = Phaser.Math.Between(100, this.scale.width - 100);
            let ry = Phaser.Math.Between(100, this.scale.height - 200);
            let rand = Math.random();
            let enemy;
            if (this.currentLevel < 3) {
                enemy = new StandardEnemy(this, rx, ry);
            } else {
                if (rand < 0.4) enemy = new StandardEnemy(this, rx, ry);
                else if (rand < 0.6) enemy = new TankEnemy(this, rx, ry);
                else if (rand < 0.8) enemy = new RangedEnemy(this, rx, ry);
                else if (rand < 0.9) enemy = new SummonerEnemy(this, rx, ry);
                else enemy = new KamikazeEnemy(this, rx, ry);
            }
            this.enemies.push(enemy);
            this.setupEnemyCollisions(enemy);
        }
    }

    setupEnemyCollisions(enemy) {
        this.enemySprites.add(enemy.sprite);
        const relics = this.registry.get('relics') || [];
        this.physics.add.overlap(this.player.sword, enemy.sprite, () => {
            if (this.player.isAttacking && enemy.hp > 0) {
                this.pushBack(enemy.sprite, this.player.sprite, 200);

                let damage = this.getPlayerDamage();
                let isCrit = Math.random() < 0.15; // 15% crit chance
                if (isCrit) {
                    damage *= 2;
                    this.showCritEffect(enemy.sprite.x, enemy.sprite.y);
                }

                enemy.takeDamage(damage);
                if (relics.includes('sangrado')) {
                    enemy.startBleed();
                }
            }
        });

        this.physics.add.collider(this.player.sprite, enemy.sprite, () => {
            if (!this.gameOver && enemy.hp > 0) {
                if (relics.includes('espinas')) {
                    enemy.takeDamage(10);
                }
                this.player.takeDamage(5);
                this.updateUI();
                this.pushBack(this.player.sprite, enemy.sprite, 300);
            }
        });

        this.physics.add.overlap(this.arrows, enemy.sprite, (enemySprite, arrow) => {
            if (enemy.hp > 0) {
                let dmg = 10;
                if (relics.includes('sniper')) {
                    const dist = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, enemySprite.x, enemySprite.y);
                    if (dist > 300) dmg += 10;
                }
                if (!relics.includes('perforante')) {
                    arrow.destroy();
                }
                enemy.takeDamage(dmg);
                // Remove enemy if it died from this arrow hit
                if (enemy.hp <= 0) {
                    this.enemies = this.enemies.filter(e => e !== enemy);
                }
            }
        });
    }

    spawnArrow(x, y, facing, angleOffset = 0) {
        const arrow = this.add.rectangle(x, y, 10, 4, 0xffff00);
        this.physics.add.existing(arrow);
        this.arrows.add(arrow);

        let baseSpeed = 400;
        let angle = 0;
        if (facing === 1) angle = 0;
        else if (facing === -1) angle = Math.PI;
        else if (facing === 2) angle = -Math.PI / 2;
        else if (facing === -2) angle = Math.PI / 2;
        angle += angleOffset;

        arrow.body.setVelocity(Math.cos(angle) * baseSpeed, Math.sin(angle) * baseSpeed);
        arrow.setRotation(angle);
        this.time.delayedCall(1000, () => { if (arrow.active) arrow.destroy() });
    }

    spawnBomb(x, y, isSticky = false) {
        const bomb = this.add.circle(x, y, 10, 0x000000);
        bomb.setStrokeStyle(2, 0xff0000);
        this.tweens.add({ targets: bomb, scale: 1.2, duration: 200, yoyo: true, repeat: 9 });

        if (isSticky) {
            let targets = this.enemies.filter(e => e.hp > 0).map(e => e.sprite);
            if (this.boss && this.boss.hp > 0) targets.push(this.boss.sprite);
            let closest = this.physics.closest(bomb, targets);
            if (closest) {
                this.physics.moveToObject(bomb, closest, 150);
            }
        }

        this.time.delayedCall(2000, () => {
            this.explodeBomb(bomb.x, bomb.y);
            bomb.destroy();
        });
    }

    explodeBomb(x, y) {
        const relics = this.registry.get('relics') || [];
        let radius = relics.includes('polvora') ? 150 : 100;
        const explosion = this.add.circle(x, y, radius, 0xff8800, 0.6);
        this.tweens.add({ targets: explosion, alpha: 0, duration: 300, onComplete: () => explosion.destroy() });
        this.createParticles(x, y, 0xffaa00);

        if (this.isBossLevel && this.boss && this.boss.hp > 0) {
            const dist = Phaser.Math.Distance.Between(x, y, this.boss.sprite.x, this.boss.sprite.y);
            if (dist <= radius + 50) {
                this.boss.takeDamage(50);
                this.updateUI();
            }
        }
        this.enemies.forEach(enemy => {
            if (enemy.hp > 0 && enemy.sprite && enemy.sprite.active) {
                const dist = Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y);
                if (dist <= radius + 15) {
                    enemy.takeDamage(50);
                }
            }
        });
    }

    spawnEnemyArrow(ex, ey, px, py) {
        if (this.gameOver) return;
        const arrow = this.add.rectangle(ex, ey, 10, 10, 0xff0000);
        this.physics.add.existing(arrow);
        this.enemyArrows.add(arrow);
        const angle = Phaser.Math.Angle.Between(ex, ey, px, py);
        const speed = 250;
        arrow.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.time.delayedCall(1500, () => { if (arrow.active) arrow.destroy() });
    }

    spawnGold(x, y) {
        const goldCoin = this.add.circle(x, y, 6, 0xffd700);
        this.physics.add.existing(goldCoin);
        this.golds.add(goldCoin);
    }

    spawnHealth(x, y) {
        const heart = this.add.rectangle(x, y, 12, 12, 0xff0000);
        this.physics.add.existing(heart);
        this.hearts.add(heart);
    }

    spawnXp(x, y) {
        const orb = this.add.circle(x, y, 6, 0x00ffff);
        orb.setStrokeStyle(2, 0xffffff);
        this.physics.add.existing(orb);
        this.xpOrbs.add(orb);

        // Pequeño impulso inicial aleatorio
        orb.body.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));
    }

    gainXp(amount) {
        const combo = this.registry.get('combo') || 0;
        // Combo da ventaja, pero XP base es pequeña (mundo hostil)
        const multiplier = 1 + (combo * 0.05);
        let xp = this.registry.get('runXp') + (amount * multiplier);
        let next = this.registry.get('xpToNext');
        let level = this.registry.get('runLevel');

        if (xp >= next) {
            xp -= next;
            level++;
            next = Math.floor(next * 1.5); // Escala más agresiva entre niveles
            this.registry.set('runLevel', level);
            this.registry.set('xpToNext', next);
            this.levelUp();
        }
        this.registry.set('runXp', xp);
        this.updateUI();
    }

    levelUp() {
        this.scene.pause();
        this.scene.launch('LevelUpScene');
    }

    showDamageNumber(x, y, damage) {
        const txt = this.add.text(x, y - 20, Math.round(damage).toString(), {
            fontSize: '18px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({
            targets: txt,
            y: y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    showCritEffect(x, y) {
        const txt = this.add.text(x, y - 40, "CRIT!", {
            fontSize: '24px', fill: '#ff0000', fontStyle: 'bold', stroke: '#fff', strokeThickness: 2
        }).setOrigin(0.5);
        this.tweens.add({
            targets: txt,
            scale: 1.5,
            y: y - 80,
            alpha: 0,
            duration: 1000,
            onComplete: () => txt.destroy()
        });
        this.cameras.main.shake(100, 0.01);
    }

    spawnCrates() {
        for (let i = 0; i < 4; i++) {
            const rx = Phaser.Math.Between(150, this.scale.width - 150);
            const ry = Phaser.Math.Between(150, this.scale.height - 200);
            const crate = this.crates.create(rx, ry, null);
            crate.setSize(30, 30);
            const rect = this.add.rectangle(rx, ry, 30, 30, 0x5d4037).setStrokeStyle(2, 0x3e2723);
            crate.rect = rect;
        }
    }

    destroyCrate(crate) {
        if (!crate || !crate.active) return;
        const x = crate.x;
        const y = crate.y;
        if (crate.rect) crate.rect.destroy();
        crate.destroy();
        this.createParticles(x, y, 0x5d4037);

        // Loot de cajas
        if (Math.random() < 0.4) {
            if (Math.random() < 0.2) this.spawnHealth(x, y);
            else this.spawnGold(x, y);
        }
    }

    spawnKamikazeFromBoss() {
        const rx = this.boss.sprite.x + Phaser.Math.Between(-50, 50);
        const ry = this.boss.sprite.y + Phaser.Math.Between(-50, 50);
        const k = new KamikazeEnemy(this, rx, ry);
        this.enemies.push(k);
        this.setupEnemyCollisions(k);
    }

    checkLevelClear() {
        if (this.portal || this.gameOver || this.isWaitingForElite) return;
        let cleared = false;
        if (this.isBossLevel) {
            if (this.boss && this.boss.hp <= 0) cleared = true;
        } else {
            this.enemies = this.enemies.filter(e => e.hp > 0);
            if (this.enemies.length === 0) cleared = true;
        }

        if (cleared) {
            this.portal = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 40, 40, 0x00ffff);
            this.physics.add.existing(this.portal);
            let portalMsg = "Al Mapa";
            if (this.isBossLevel) portalMsg = "Reliquia de Boss";
            else if (this.nodeType === 'elite') portalMsg = "Coger Reliquia";
            else if (this.nodeType === 'treasure') portalMsg = "Seguir";

            this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, portalMsg, { fontSize: '18px', fill: '#0ff' }).setOrigin(0.5);
            this.tweens.add({ targets: this.portal, angle: 360, duration: 2000, repeat: -1 });
            this.physics.add.overlap(this.player.sprite, this.portal, () => {
                this.nextLevel();
            });
        }
    }

    nextLevel() {
        const currentLevel = this.registry.get('currentLevel');
        this.registry.set('playerHp', this.player.hp);

        const nextLevelNumber = currentLevel + 1;
        this.registry.set('currentLevel', nextLevelNumber);

        // El Boss es cada 5 niveles (5, 10, 15...)
        if (nextLevelNumber % 5 === 0) {
            this.registry.set('nextNodeType', 'boss');
            // Antes del boss, siempre ofrecemos una tienda o reliquia si es posible
            if (Math.random() < 0.7) {
                this.scene.start('ShopScene');
            } else {
                this.scene.start('RelicScene');
            }
            return;
        }

        // Probabilidades de sala aumentadas para tienda y eventos
        const r = Math.random();
        let nextNode = 'combat';
        if (r < 0.4) nextNode = 'combat';
        else if (r < 0.55) nextNode = 'elite';
        else if (r < 0.7) nextNode = 'treasure';
        else if (r < 0.85) nextNode = 'shop'; // Aumentado a 15%
        else nextNode = 'event'; // Aumentado a 15%

        this.registry.set('nextNodeType', nextNode);

        if (this.isBossLevel || (this.nodeType === 'elite' && nextNode !== 'shop' && nextNode !== 'event')) {
            this.scene.start('RelicScene');
        } else if (nextNode === 'shop') {
            this.scene.start('ShopScene');
        } else if (nextNode === 'event') {
            this.scene.start('EventScene');
        } else {
            this.scene.start('MainScene');
        }
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
        if (this.player.hp <= 0) this.player.hp = 0;

        // Actualizar HP Bar
        if (this.playerHpText.active) {
            this.playerHpText.setText(`HP: ${this.player.hp}/${this.player.maxHp}`);
            const percent = this.player.hp / this.player.maxHp;
            this.hpBar.width = 150 * percent;
            if (percent < 0.3) this.hpBar.setFillStyle(0xff0000);
            else if (percent < 0.6) this.hpBar.setFillStyle(0xffff00);
            else this.hpBar.setFillStyle(0x00ff00);
        }

        // Actualizar XP Bar
        if (this.xpBar.active) {
            const xp = this.registry.get('runXp');
            const next = this.registry.get('xpToNext');
            const percentXp = xp / next;
            this.xpBar.width = 150 * percentXp;
            this.runLevelText.setText(`LVL: ${this.registry.get('runLevel')}`);
        }

        if (this.goldText.active) this.goldText.setText(`🪙 ${this.gold}`);

        // Combo
        const combo = this.registry.get('combo');
        if (combo > 0) {
            this.comboText.setText(`COMBO x${combo}`);
            this.comboText.setScale(1 + (combo * 0.05));
        } else {
            this.comboText.setText("");
        }

        const w = this.registry.get('equippedWeapon') || 1;
        if (this.weaponText.active) {
            if (w === 1) this.weaponText.setText("1 - ESPADA").setBackgroundColor('#0077ff');
            if (w === 2) this.weaponText.setText("2 - ARCO").setBackgroundColor('#aa7700');
            if (w === 3) this.weaponText.setText("3 - BOMBAS").setBackgroundColor('#555555');
        }

        if (this.isBossLevel && this.boss) {
            const percent = this.boss.hp / this.boss.maxHp;
            this.bossHpBar.width = 400 * percent;
            if (this.boss.hp <= 0) {
                this.bossHpContainer.setVisible(false);
            }
        }

        if (this.player.hp <= 0 && !this.gameOver) {
            this.cameras.main.shake(500, 0.05);
            this.endGame("¡HAS CAÍDO EN COMBATE!");
        }
    }

    drawVignette() {
        this.vignette.clear();
        this.vignette.fillStyle(0x000000, 0.3);
        this.vignette.fillRect(0, 0, this.scale.width, 60); // Arriba
        this.vignette.fillRect(0, this.scale.height - 60, this.scale.width, 60); // Abajo
        this.vignette.setDepth(99).setScrollFactor(0);
    }

    pushBack(target, source, force) {
        if (!target || !target.body || !source || !source.x) return;
        const angle = Phaser.Math.Angle.Between(source.x, source.y, target.x, target.y);
        // Limitar la fuerza máxima para que los límites del mundo puedan detenerlos
        const cappedForce = Math.min(force, 250);
        target.body.setVelocity(Math.cos(angle) * cappedForce, Math.sin(angle) * cappedForce);
    }

    createParticles(x, y, color) {
        let gfx = this.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(0xffffff);
        gfx.fillRect(0, 0, 4, 4);
        gfx.generateTexture('squareParticle', 4, 4);
        const particles = this.add.particles(x, y, 'squareParticle', {
            speed: { min: -100, max: 100 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            tint: color,
            quantity: 5
        });
        this.time.delayedCall(300, () => particles.destroy());
    }

    update(time, delta) {
        if (this.gameOver || this.isCountdown) {
            if (this.player && this.player.sprite && this.player.sprite.body) {
                this.player.sprite.body.setVelocity(0);
            }
            return;
        }
        this.player.update(time);

        // Magnetismo de XP
        this.xpOrbs.getChildren().forEach(orb => {
            if (orb && orb.active) {
                const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.player.sprite.x, this.player.sprite.y);
                if (dist < 150) {
                    const angle = Phaser.Math.Angle.Between(orb.x, orb.y, this.player.sprite.x, this.player.sprite.y);
                    orb.body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
                } else {
                    // Fricción para que no floten para siempre si se alejan
                    orb.body.setVelocity(orb.body.velocity.x * 0.95, orb.body.velocity.y * 0.95);
                }
            }
        });

        // Combo decay (3 segundos)
        if (time > this.lastKillTime + 3000 && this.registry.get('combo') > 0) {
            this.registry.set('combo', 0);
            this.updateUI();
        }

        if (this.isBossLevel && this.boss && this.boss.hp > 0) {
            if (window.gamePersonality && window.gamePersonality !== this.boss.bossType) {
                this.boss.bossType = window.gamePersonality;
            }
            if (time > this.lastApiCallTime + this.apiCallInterval) {
                this.lastApiCallTime = time;
                this.requestBossAction();
            }
        }

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

        const relics = this.registry.get('relics') || [];
        if (relics.includes('iman')) {
            this.golds.getChildren().forEach(gold => {
                if (gold && gold.active) {
                    const dist = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, gold.x, gold.y);
                    if (dist < 200) this.physics.moveToObject(gold, this.player.sprite, 300);
                }
            });
        }
        this.checkLevelClear();
    }

    onEnemyDeath(enemy) {
        this.lastKillTime = this.time.now;
        const currentCombo = this.registry.get('combo') || 0;
        this.registry.set('combo', currentCombo + 1);

        // Efecto visual de combo
        this.cameras.main.shake(100, 0.005);
        this.updateUI();
    }

    drawEnemyHealthBar(enemy) {
        if (!enemy.hpBarGfx) {
            enemy.hpBarGfx = this.add.graphics().setDepth(50);
        }
        enemy.hpBarGfx.clear();
        if (enemy.hp < enemy.maxHp) {
            const x = enemy.sprite.x - 20;
            const y = enemy.sprite.y - 40;
            enemy.hpBarGfx.fillStyle(0x000000, 0.5);
            enemy.hpBarGfx.fillRect(x, y, 40, 5);
            enemy.hpBarGfx.fillStyle(0xff0000, 1);
            enemy.hpBarGfx.fillRect(x, y, 40 * (enemy.hp / enemy.maxHp), 5);
        }
    }

    async requestBossAction() {
        if (this.gameOver || !this.isBossLevel) return;
        const distance = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, this.boss.sprite.x, this.boss.sprite.y);
        const gameState = {
            boss_hp: Math.round((this.boss.hp / this.boss.maxHp) * 100),
            boss_phase: this.boss.phase,
            player_hp: Math.round((this.player.hp / this.player.maxHp) * 100),
            distance: Math.round(distance),
            boss_type: this.boss.bossType
        };
        try {
            const response = await axios.post('https://juegomanuelsc00078.onrender.com/api/boss-decision', gameState);
            const { action, intensity, dialogue } = response.data;
            if (!this.gameOver && this.boss && this.boss.hp > 0) {
                if (this.bossText.active) this.bossText.setText(dialogue);
                this.boss.executeAction(action, intensity, this.player.sprite);
            }
        } catch (error) {
            console.error("Error pidiendo acción al boss:", error);
        }
    }

    endGame(message) {
        this.gameOver = true;

        // Los cristales son escasos en el mundo del Núcleo.
        // Solo 1 cristal por cada 3 niveles completados. Los NPCs raros son la fuente principal.
        let crystalsEarned = Math.floor(this.currentLevel / 3);
        if (crystalsEarned > 0) {
            let meta = JSON.parse(localStorage.getItem('metaStats')) || { crystals: 0 };
            meta.crystals = (meta.crystals || 0) + crystalsEarned;
            localStorage.setItem('metaStats', JSON.stringify(meta));
            message += `\n+${crystalsEarned} 💎 recuperados del caos`;
        }

        if (this.player.sprite.body) this.player.sprite.body.setVelocity(0);
        if (this.boss && this.boss.sprite.body) this.boss.sprite.body.setVelocity(0);
        if (this.gameOverText.active) {
            this.gameOverText.setText(message);
            this.gameOverText.setVisible(true);
        }
        if (this.bossText && this.bossText.active) this.bossText.setVisible(false);
        this.time.delayedCall(3000, () => {
            this.scene.start('MenuScene');
        });
    }
}
