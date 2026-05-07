import * as Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Boss } from '../entities/Boss';
import { StandardEnemy, TankEnemy, RangedEnemy, KamikazeEnemy, SummonerEnemy,
         TeleporterEnemy, HealerEnemy, GuardianEnemy, TrapperEnemy, LaserEliteEnemy,
         applyEnemyScaling } from '../entities/Enemy';
import { saveRunResult } from '../supabase';
import axios from 'axios';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.lastApiCallTime = 0;
        this.gameOver = false;
        this.isCountdown = true;
        this.apiCallInterval = 3000;
        this.mobileJoystick = null; // {vx, vy, active}
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

        // HUD Dinámico (Glassmorphism)
        this.vignette = this.add.graphics();
        this.drawVignette();

        // Panel Superior Glass
        this.topPanel = this.add.graphics().setDepth(100).setScrollFactor(0);
        this.topPanel.fillStyle(0x050505, 0.75);
        this.topPanel.fillRoundedRect(10, 10, this.scale.width - 20, 70, 12);
        this.topPanel.lineStyle(2, 0x00f2ff, 0.3);
        this.topPanel.strokeRoundedRect(10, 10, this.scale.width - 20, 70, 12);
        
        let nodeLabel = this.nodeType.toUpperCase();
        if (nodeLabel === 'COMBAT') nodeLabel = 'FRAGMENTO DE COMBATE';
        if (nodeLabel === 'ELITE') nodeLabel = 'ANOMALÍA CRÍTICA';
        if (nodeLabel === 'TREASURE') nodeLabel = 'NÚCLEO DE DATOS';
        if (nodeLabel === 'SHOP') nodeLabel = 'MERCADO NEGRO';
        if (nodeLabel === 'EVENT') nodeLabel = 'GLITCH EN LA REALIDAD';
        if (this.isBossLevel) nodeLabel = 'CONCIENCIA ROTA (JEFE)';

        this.levelText = this.add.text(this.scale.width / 2, 35, `SECTOR 0${this.currentLevel} // ${nodeLabel}`, {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '18px', 
            fill: '#00f2ff', 
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);

        // Barra de vida Estilo Premium
        this.hpBarBg = this.add.rectangle(135, 45, 180, 12, 0x111111).setDepth(101).setScrollFactor(0).setOrigin(0, 0.5);
        this.hpBar = this.add.rectangle(135, 45, 180, 12, 0x00ff00).setDepth(102).setScrollFactor(0).setOrigin(0, 0.5);
        this.playerHpText = this.add.text(135, 28, `HP: ${this.player.hp}/${this.player.maxHp}`, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px', fill: '#888', fontWeight: 'bold'
        }).setOrigin(0, 0.5).setDepth(103).setScrollFactor(0);

        // Barra de XP Estilo Premium
        this.xpBarBg = this.add.rectangle(135, 58, 180, 6, 0x111111).setDepth(101).setScrollFactor(0).setOrigin(0, 0.5);
        this.xpBar = this.add.rectangle(135, 58, 180, 6, 0x00f2ff).setDepth(102).setScrollFactor(0).setOrigin(0, 0.5);
        this.runLevelText = this.add.text(135, 72, `PROGRESO LVL.${this.registry.get('runLevel')}`, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px', fill: '#00f2ff', fontWeight: 'bold'
        }).setOrigin(0, 0.5).setDepth(103).setScrollFactor(0);

        this.goldText = this.add.text(this.scale.width - 40, 35, `${this.gold} 💎`, {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '20px', fill: '#ffd700', fontStyle: 'bold'
        }).setOrigin(1, 0.5).setDepth(101).setScrollFactor(0);

        this.scoreText = this.add.text(this.scale.width - 40, 58, `SCORE: ${this.score}`, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px', fill: '#00f2ff', fontWeight: 'bold'
        }).setOrigin(1, 0.5).setDepth(101).setScrollFactor(0);

        this.comboText = this.add.text(this.scale.width - 200, 45, `x${this.registry.get('combo') || 0}`, {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '24px', fill: '#ff00e1', fontStyle: 'bold'
        }).setOrigin(1, 0.5).setDepth(101).setScrollFactor(0);

        // --- GESTIÓN DE MÚSICA IN-GAME ---
        this.handleMusic();

        // Arma HUD
        this.weaponContainer = this.add.container(this.scale.width / 2, this.scale.height - 40).setDepth(101).setScrollFactor(0);
        this.weaponBg = this.add.rectangle(0, 0, 200, 40, 0x00f2ff, 0.1);
        this.weaponBg.setStrokeStyle(1, 0x00f2ff, 0.5);
        this.weaponText = this.add.text(0, 0, "1 - ESPADA", {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '14px', fill: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.weaponContainer.add([this.weaponBg, this.weaponText]);
        
        this.weaponText.setInteractive({ useHandCursor: true });
        this.weaponText.on('pointerdown', () => {
            const hasBow   = this.registry.get('hasBow');
            const hasBombs = this.registry.get('hasBombs');

            // Construir la lista de armas disponibles
            const available = [1];
            if (hasBow)   available.push(2);
            if (hasBombs) available.push(3);

            // Si solo hay una arma, no hacer nada
            if (available.length === 1) return;

            const current = this.registry.get('equippedWeapon') || 1;
            const currentIdx = available.indexOf(current);
            const nextIdx = (currentIdx + 1) % available.length;

            this.player.equipWeapon(available[nextIdx]);
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

        this.lastKillTime = 0;

        if (this.isBossLevel) {
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

        this.physics.add.collider(this.player.sprite, this.crates);

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

        // Daño al jugador por obstáculos peligrosos (Collider para mejor detección física)
        this.physics.add.collider(this.player.sprite, this.crates, (player, obstacle) => {
            if (obstacle.doesDamage && !this.player.isInvulnerable) {
                this.player.takeDamage(10);
                this.updateUI();
                this.pushBack(this.player.sprite, obstacle, 500); // Fuerza aumentada
            }
        });

        // Refuerzo con Overlap para asegurar daño constante si el jugador está sobre el bloque
        this.physics.add.overlap(this.player.sprite, this.crates, (player, obstacle) => {
            if (obstacle.doesDamage && !this.player.isInvulnerable) {
                this.player.takeDamage(1); // Daño menor pero continuo
                this.updateUI();
                this.pushBack(this.player.sprite, obstacle, 100);
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

        const joyY = this.scale.height - 180;
        const base = this.add.circle(130, joyY, 85, 0xffffff, 0.2).setDepth(1000).setScrollFactor(0);
        const stick = this.add.circle(130, joyY, 40, 0x00ffff, 0.5).setDepth(1001).setScrollFactor(0);
        
        const atkY = this.scale.height - 200;
        const attackBtn = this.add.circle(this.scale.width - 120, atkY, 75, 0xff0000, 0.5).setDepth(1000).setScrollFactor(0).setInteractive();
        const attackTxt = this.add.text(this.scale.width - 120, atkY, "ATK", { fontSize: '28px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
        
        attackBtn.on('pointerdown', () => { 
            attackBtn.setAlpha(0.8);
            this.player.attack(); 
        });
        attackBtn.on('pointerup', () => attackBtn.setAlpha(0.5));
        attackBtn.on('pointerout', () => attackBtn.setAlpha(0.5));
        
        const dashY = this.scale.height - 90;
        const dashBtn = this.add.circle(this.scale.width - 250, dashY, 55, 0x00ff00, 0.5).setDepth(1000).setScrollFactor(0).setInteractive();
        const dashTxt = this.add.text(this.scale.width - 250, dashY, "DASH", { fontSize: '22px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
        
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

        const relics = this.registry.get('relics') || [];
        let baseProb = Phaser.Math.Between(30, 70); // Probability between 30 and 70
        if (relics.includes('bypass_key')) baseProb += 25;
        if (baseProb > 95) baseProb = 95; // Cap at 95%

        const escapeBtn = this.add.rectangle(cx + 120, cy + 50, 180, 55, 0x333333).setInteractive().setDepth(201);
        const escapeTxt = this.add.text(cx + 120, cy + 50, `BYPASS (${baseProb}%)`, { fontSize: '18px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(202);

        const cleanup = () => {
            bg.destroy(); title.destroy(); desc.destroy();
            fightBtn.destroy(); fightTxt.destroy();
            escapeBtn.destroy(); escapeTxt.destroy();
        };

        fightBtn.on('pointerover', () => fightBtn.setFillStyle(0xee0000));
        fightBtn.on('pointerout', () => fightBtn.setFillStyle(0xaa0000));

        fightBtn.on('pointerdown', () => {
            fightBtn.disableInteractive();
            escapeBtn.disableInteractive();
            cleanup();
            this.isWaitingForElite = false;
            this.spawnElite();
        });

        escapeBtn.on('pointerover', () => escapeBtn.setFillStyle(0x777777));
        escapeBtn.on('pointerout', () => escapeBtn.setFillStyle(0x555555));

        escapeBtn.on('pointerdown', () => {
            fightBtn.disableInteractive();
            escapeBtn.disableInteractive();
            if (Math.random() * 100 <= baseProb) {
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
        // Un Élite es una anomalía con nivel ligeramente superior (+2) para que sea posible de matar
        const eliteLevel = this.currentLevel + 2;
        let elite = new LaserEliteEnemy(this, this.scale.width / 2, 220);

        // Aplicar escalado de 20 rangos + Alpha asegurado
        applyEnemyScaling(elite, eliteLevel);
        elite.applyAlpha(); 

        // Bonus de estadísticas reducidos significativamente a petición del usuario
        elite.hp = Math.round(elite.hp * 1.2);
        elite.maxHp = elite.hp;
        elite.contactDamage = Math.round(elite.contactDamage * 1.1);
        elite.sprite.setScale(elite.sprite.scaleX * 1.2);

        this.enemies.push(elite);
        this.setupEnemyCollisions(elite);
        
        if (this.bossText) {
            this.bossText.setText("¡ADVERTENCIA: ANOMALÍA CRÍTICA!");
            this.bossText.setFill("#ff00ff");
        }
    }

    spawnNormalEnemies() {
        const level = this.currentLevel;
        // Escalar cantidad de enemigos suavemente: 2 base + 1 cada 2 niveles aprox
        const numEnemies = Math.floor(2 + (level / 2)); 

        for (let i = 0; i < numEnemies; i++) {
            const rx = Phaser.Math.Between(100, this.scale.width  - 100);
            const ry = Phaser.Math.Between(100, this.scale.height - 200);
            const rand = Math.random();
            let enemy;

            if (level < 5) {
                // NIVEL 1-4: Mayormente Glitchers, pero con raros avistamientos
                if (rand < 0.01)      enemy = new RangedEnemy(this, rx, ry);
                else if (rand < 0.02) enemy = new KamikazeEnemy(this, rx, ry);
                else if (rand < 0.03) enemy = new SummonerEnemy(this, rx, ry);
                else if (level >= 3 && rand < 0.2) enemy = new TankEnemy(this, rx, ry);
                else                  enemy = new StandardEnemy(this, rx, ry);
            } 
            else if (level < 12) {
                // NIVEL 5-11: Introducimos Arqueros y Kamikazes, con raros Summoners/Trappers
                if (rand < 0.02)      enemy = new SummonerEnemy(this, rx, ry);
                else if (rand < 0.04) enemy = new TrapperEnemy(this, rx, ry);
                else if (rand < 0.05) enemy = new TeleporterEnemy(this, rx, ry);
                else if (rand < 0.5)  enemy = new StandardEnemy(this, rx, ry);
                else if (rand < 0.7)  enemy = new TankEnemy(this, rx, ry);
                else if (rand < 0.85) enemy = new RangedEnemy(this, rx, ry);
                else                  enemy = new KamikazeEnemy(this, rx, ry);
            } 
            else if (level < 25) {
                // NIVEL 12-24: Introducimos Invocadores y Trampas, con raros Healers/Guardians
                if (rand < 0.02)      enemy = new HealerEnemy(this, rx, ry);
                else if (rand < 0.04) enemy = new GuardianEnemy(this, rx, ry);
                else if (rand < 0.06) enemy = new TeleporterEnemy(this, rx, ry);
                else if (rand < 0.3)  enemy = new StandardEnemy(this, rx, ry);
                else if (rand < 0.5)  enemy = new TankEnemy(this, rx, ry);
                else if (rand < 0.65) enemy = new RangedEnemy(this, rx, ry);
                else if (rand < 0.75) enemy = new KamikazeEnemy(this, rx, ry);
                else if (rand < 0.88) enemy = new SummonerEnemy(this, rx, ry);
                else                  enemy = new TrapperEnemy(this, rx, ry);
            } 
            else if (level < 45) {
                // NIVEL 25-44: El Teletransportador entra en juego, Healer/Guardian raros
                if (rand < 0.03)      enemy = new HealerEnemy(this, rx, ry);
                else if (rand < 0.06) enemy = new GuardianEnemy(this, rx, ry);
                else if (rand < 0.25) enemy = new StandardEnemy(this, rx, ry);
                else if (rand < 0.45) enemy = new TankEnemy(this, rx, ry);
                else if (rand < 0.6)  enemy = new RangedEnemy(this, rx, ry);
                else if (rand < 0.7)  enemy = new KamikazeEnemy(this, rx, ry);
                else if (rand < 0.8)  enemy = new SummonerEnemy(this, rx, ry);
                else if (rand < 0.9)  enemy = new TrapperEnemy(this, rx, ry);
                else                  enemy = new TeleporterEnemy(this, rx, ry);
            } 
            else {
                // NIVEL 45+: Pool completo con Sanadores y Guardianes
                if (rand < 0.15)     enemy = new StandardEnemy(this, rx, ry);
                else if (rand < 0.3) enemy = new TankEnemy(this, rx, ry);
                else if (rand < 0.4) enemy = new RangedEnemy(this, rx, ry);
                else if (rand < 0.5) enemy = new KamikazeEnemy(this, rx, ry);
                else if (rand < 0.6) enemy = new SummonerEnemy(this, rx, ry);
                else if (rand < 0.7) enemy = new TrapperEnemy(this, rx, ry);
                else if (rand < 0.8) enemy = new TeleporterEnemy(this, rx, ry);
                else if (rand < 0.9) enemy = new HealerEnemy(this, rx, ry);
                else                 enemy = new GuardianEnemy(this, rx, ry);
            }

            // Aplicar variante (normal / mejorado / elite) y posible Alpha
            applyEnemyScaling(enemy, level);

            this.enemies.push(enemy);
            this.setupEnemyCollisions(enemy);
        }
    }

    spawnKamikazeFromBoss() {
        if (this.gameOver) return;
        // Spawnea un kamikaze cerca de un boss aleatorio
        const activeBosses = this.bosses.filter(b => b.hp > 0);
        if (activeBosses.length === 0) return;
        
        const b = activeBosses[Math.floor(Math.random() * activeBosses.length)];
        const rx = b.sprite.x + Phaser.Math.Between(-100, 100);
        const ry = b.sprite.y + Phaser.Math.Between(-100, 100);
        
        const k = new KamikazeEnemy(this, rx, ry);
        applyEnemyScaling(k, this.currentLevel);
        this.enemies.push(k);
        this.setupEnemyCollisions(k);
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
                if (dist > 300) dmg += 10;
            }
            if (!relics.includes('perforante')) arrow.destroy();
            enemy.takeDamage(dmg);
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

    spawnEnemyBomb(x, y, damage = 30) {
        const bomb = this.add.circle(x, y, 12, 0x000000);
        bomb.setStrokeStyle(3, 0xff0000);
        this.tweens.add({ targets: bomb, scale: 1.3, duration: 250, yoyo: true, repeat: 5 });

        this.time.delayedCall(1500, () => {
            if (!bomb.active) return;
            this.createParticles(bomb.x, bomb.y, 0xffaa00);
            
            // Explosión visual
            const explosion = this.add.circle(bomb.x, bomb.y, 80, 0xff0000, 0.4);
            this.tweens.add({ targets: explosion, alpha: 0, duration: 400, onComplete: () => explosion.destroy() });

            // Daño al jugador
            const dist = Phaser.Math.Distance.Between(bomb.x, bomb.y, this.player.sprite.x, this.player.sprite.y);
            if (dist < 90 && !this.gameOver) {
                this.player.takeDamage(damage);
                this.updateUI();
            }
            bomb.destroy();
        });
    }

    spawnBomb(x, y, isSticky = false) {
        const bomb = this.add.circle(x, y, 10, 0x000000);
        bomb.setStrokeStyle(2, 0xff0000);
        this.physics.add.existing(bomb); // Necesario para que moveToObject funcione
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

        if (this.isBossLevel && this.bosses) {
            this.bosses.forEach(boss => {
                if (boss.hp > 0) {
                    const dist = Phaser.Math.Distance.Between(x, y, boss.sprite.x, boss.sprite.y);
                    if (dist <= radius + 50) {
                        boss.takeDamage(50);
                        this.updateUI();
                    }
                }
            });
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
        const displayVal = typeof damage === 'number' ? Math.round(damage).toString() : damage;
        const txt = this.add.text(x, y - 20, displayVal, {
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
        const level = this.currentLevel;
        // Más obstáculos conforme sube el nivel
        const count = 4 + Math.floor(level / 3);

        for (let i = 0; i < count; i++) {
            const rx = Phaser.Math.Between(150, this.scale.width - 150);
            const ry = Phaser.Math.Between(150, this.scale.height - 250);
            
            const obstacle = this.crates.create(rx, ry, null);
            obstacle.setSize(30, 30);
            
            const rand = Math.random();
            let color = 0x5d4037; // Madera normal
            let stroke = 0x3e2723;

            if (rand < 0.2) {
                // OBSTÁCULO INDESTRUCTIBLE (Metálico)
                obstacle.isIndestructible = true;
                color = 0x444444;
                stroke = 0xffffff;
            } else if (rand < 0.35) {
                // OBSTÁCULO DAÑINO (Spikes / Error)
                obstacle.doesDamage = true;
                color = 0xcc0000;
                stroke = 0xff00ff;
                // Efecto visual de parpadeo para avisar
                this.tweens.add({
                    targets: obstacle,
                    alpha: 0.6,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }

            const rect = this.add.rectangle(rx, ry, 30, 30, color).setStrokeStyle(2, stroke);
            obstacle.rect = rect;
            
            // Si es dañino, añadir un pequeño indicativo visual extra (un rombo interno)
            if (obstacle.doesDamage) {
                const spike = this.add.rectangle(rx, ry, 15, 15, 0xffffff, 0.8).setAngle(45);
                obstacle.spike = spike;
            }
        }
    }

    destroyCrate(crate) {
        if (!crate || !crate.active || crate.isIndestructible) return;
        const x = crate.x;
        const y = crate.y;
        if (crate.rect) crate.rect.destroy();
        if (crate.spike) crate.spike.destroy();
        crate.destroy();
        this.createParticles(x, y, 0x5d4037);

        // Loot de cajas
        if (Math.random() < 0.4) {
            if (Math.random() < 0.2) this.spawnHealth(x, y);
            else this.spawnGold(x, y);
        }
    }

    spawnKamikazeFromBoss() {
        if (this.gameOver) return;
        // Spawnea un kamikaze cerca de un boss aleatorio activo
        const activeBosses = this.bosses.filter(b => b.hp > 0);
        if (activeBosses.length === 0) return;
        
        const b = activeBosses[Math.floor(Math.random() * activeBosses.length)];
        const rx = b.sprite.x + Phaser.Math.Between(-80, 80);
        const ry = b.sprite.y + Phaser.Math.Between(-80, 80);
        
        const k = new KamikazeEnemy(this, rx, ry);
        applyEnemyScaling(k, this.currentLevel);
        this.enemies.push(k);
        this.setupEnemyCollisions(k);
    }

    checkLevelClear() {
        if (this.portal || this.gameOver || this.isWaitingForElite) return;
        let cleared = false;
        if (this.isBossLevel) {
            if (this.bosses && this.bosses.every(b => b.hp <= 0)) cleared = true;
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
                if (!this.isChangingLevel) {
                    this.isChangingLevel = true;
                    if (this.portal.body) this.portal.body.enable = false; // Desactivar física inmediatamente
                    this.nextLevel();
                }
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
        if (r < 0.02) nextNode = 'combat'; // 2% combate normal
        else if (r < 0.97) nextNode = 'elite'; // 95% elite (PARA TESTEO)
        else if (r < 0.985) nextNode = 'treasure'; // 1.5% tesoro
        else nextNode = 'shop'; // 1% tienda (event removido para testeo)

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
        if (this.playerHpText && this.playerHpText.active) {
            this.playerHpText.setText(`HP: ${Math.floor(this.player.hp)}/${this.player.maxHp}`);
            this.hpBar.width = Math.max(0, 150 * (this.player.hp / this.player.maxHp));
            const percent = this.player.hp / this.player.maxHp;
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

        if (this.goldText && this.goldText.active) this.goldText.setText(`ORO: ${this.gold} 💎`);
        if (this.scoreText && this.scoreText.active) this.scoreText.setText(`SCORE: ${this.score}`);

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

        if (this.isBossLevel && this.bosses && this.bosses.length > 0) {
            const totalHp = this.bosses.reduce((acc, b) => acc + Math.max(0, b.hp), 0);
            const totalMaxHp = this.bosses.reduce((acc, b) => acc + b.maxHp, 0);
            const percent = totalMaxHp > 0 ? totalHp / totalMaxHp : 0;
            
            this.bossHpBar.width = 400 * percent;
            if (totalHp <= 0) {
                this.bossHpContainer.setVisible(false);
            } else {
                this.bossHpContainer.setVisible(true);
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

        if (this.isBossLevel && this.bosses) {
            this.bosses.forEach(boss => {
                if (boss.hp > 0) {
                    // Sincronizar personalidad si es necesario
                    if (window.gamePersonality && window.gamePersonality !== boss.bossType) {
                        boss.bossType = window.gamePersonality;
                    }
                    // Llamar a la IA individualmente (con un pequeño offset para que no todas disparen a la vez)
                    if (time > (boss.lastApiCallTime || 0) + this.apiCallInterval) {
                        boss.lastApiCallTime = time;
                        this.requestBossAction(boss);
                    }
                }
            });
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
        this.lastKillTime = this.time.now;
        const currentCombo = this.registry.get('combo') || 0;
        this.registry.set('combo', currentCombo + 1);
        
        // Puntuación: Vida base muy baja + pequeño bono por combo
        const points = Math.floor((enemy.maxHp / 10) + (currentCombo * 2));
        this.score += points;
        this.registry.set('score', this.score);

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

    async requestBossAction(targetBoss) {
        if (this.gameOver || !this.isBossLevel || !targetBoss || targetBoss.hp <= 0) return;
        
        const playerX = this.player.sprite.x;
        const playerY = this.player.sprite.y;
        const bossX = targetBoss.sprite.x;
        const bossY = targetBoss.sprite.y;
        const distance = Math.round(Phaser.Math.Distance.Between(playerX, playerY, bossX, bossY));

        const gameState = {
            boss_hp: Math.round((targetBoss.hp / targetBoss.maxHp) * 100),
            boss_phase: targetBoss.phase,
            player_hp: Math.round((this.player.hp / this.player.maxHp) * 100),
            distance: distance,
            boss_type: targetBoss.bossType
        };
        
        try {
            // Usamos la URL de render si está disponible, si no localhost (fallback dinámico)
            const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:5000/api/boss-decision'
                : 'https://juegomanuelsc00078.onrender.com/api/boss-decision';

            const response = await axios.post(apiUrl, gameState, { timeout: 8000 });
            const { action, intensity, dialogue } = response.data;
            
            if (!this.gameOver && targetBoss.hp > 0) {
                if (this.bossText && this.bossText.active) {
                    this.bossText.setText(dialogue);
                }
                targetBoss.executeAction(action, intensity, this.player.sprite);
            }
        } catch (error) {
            console.warn("API del Boss falló, usando patrón de respaldo local.");
            // PATRÓN DE RESPALDO (Lógica local)
            const actions = ["projectile", "area", "dash", "bomb"];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            const intensity = 0.5 + (Math.random() * 0.5);
            
            if (this.bossText && this.bossText.active && !this.bosses.some(b => b.isTalking)) {
                const loreLines = [
                    "TU CÓDIGO ES OBSOLETO...",
                    "ESTE BUCLE NO TIENE FIN.",
                    "SÓLO ERES UN GLITCH EN MI MATRIZ.",
                    "BORRADO... SISTEMÁTICO."
                ];
                this.bossText.setText(loreLines[Math.floor(Math.random() * loreLines.length)]);
                targetBoss.isTalking = true;
                this.time.delayedCall(3000, () => { targetBoss.isTalking = false; });
            }
            targetBoss.executeAction(randomAction, intensity, this.player.sprite);
        }
    }

    endGame(message) {
        this.gameOver = true;
        this.physics.pause(); // Pausar solo la física, no la escena completa

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

        const crystalsEarned = Math.floor(this.currentLevel / 3);
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

        // Guardar resultado (El servidor calculará los cristales ganados de forma segura)
        saveRunResult(this.score, this.currentLevel).catch(err => console.error(err));

        // Detener música in-game
        this.sound.stopAll();

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
        // Comprobar si los assets de audio están cargados
        if (!this.cache.audio.exists('game_track1')) {
            console.warn("⚠️ Audio no cargado en caché, omitiendo música.");
            return;
        }

        // Determinar la CATEGORÍA de música necesaria
        const isCritical = this.isBossLevel || this.nodeType === 'elite';
        const currentMusicKey = this.registry.get('currentMusicKey');

        // CASO A: Necesitamos música de JEFE/ELITE
        if (isCritical) {
            if (currentMusicKey !== 'game_boss') {
                this.switchTrack('game_boss');
            }
            return;
        }

        // CASO B: Necesitamos música NORMAL
        // Si ya está sonando una pista normal (1 o 2), no hacemos nada para que siga sonando hasta que acabe
        if (currentMusicKey === 'game_track1' || currentMusicKey === 'game_track2') {
            // Verificar si la música se ha detenido por alguna razón (aunque tenga loop)
            const currentMusic = this.sound.get(currentMusicKey);
            if (!currentMusic || !currentMusic.isPlaying) {
                // Si se detuvo, rotamos a la otra
                const nextTrack = currentMusicKey === 'game_track1' ? 'game_track2' : 'game_track1';
                this.switchTrack(nextTrack);
            }
            return;
        }

        // CASO C: No hay música o venimos de un Boss
        // Elegir una pista normal al azar para empezar
        const randomTrack = Math.random() > 0.5 ? 'game_track1' : 'game_track2';
        this.switchTrack(randomTrack);
    }

    switchTrack(targetTrack) {
        const currentMusicKey = this.registry.get('currentMusicKey');

        // Detener la anterior con fade
        if (currentMusicKey) {
            const currentMusic = this.sound.get(currentMusicKey);
            if (currentMusic) {
                this.tweens.add({
                    targets: currentMusic,
                    volume: 0,
                    duration: 1000,
                    onComplete: () => currentMusic.stop()
                });
            }
        }

        // Iniciar la nueva (sin loop para que podamos detectar cuando termina y rotar)
        const music = this.sound.add(targetTrack, { loop: false, volume: 0 });
        music.play();
        
        // Al terminar la canción, volver a llamar a handleMusic para que rote a la siguiente
        music.once('complete', () => {
            this.handleMusic();
        });

        this.tweens.add({
            targets: music,
            volume: 0.5,
            duration: 1000
        });

        this.registry.set('currentMusicKey', targetTrack);
    }
}
