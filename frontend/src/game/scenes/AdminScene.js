import * as Phaser from 'phaser';
import { isAdmin } from '../admin';

const ALL_RELICS = ['hermes', 'titan', 'hierro', 'berserker', 'espinas', 'sangrado', 'vampirismo',
    'iman', 'sniper', 'perforante', 'polvora', 'bypass_key', 'escudo'];

export default class AdminScene extends Phaser.Scene {
    constructor() {
        super('AdminScene');
    }

    create() {
        const user = this.registry.get('user') || window.__phaserUser;
        if (!isAdmin(user)) {
            this.scene.start('MenuScene');
            return;
        }

        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        this.add.rectangle(cx, H / 2, W, H, 0x000000, 0.85).setDepth(0);

        this.add.text(cx, 25, 'PANEL DE ADMINISTRACION', {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '28px', fill: '#00f2ff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);

        const cols = [
            { x: W * 0.05, w: W * 0.28 },
            { x: W * 0.36, w: W * 0.28 },
            { x: W * 0.67, w: W * 0.28 },
        ];
        const startY = 60;
        const rowH = 34;

        let row = 0;

        // Columna 0: Niveles
        this.addColTitle(cols[0].x, startY, "SALTAR A NIVEL");
        const levelBtns = [1, 5, 10, 15, 20, 25, 30, 40, 50];
        levelBtns.forEach((lvl, i) => {
            row = i;
            this._addBtn(cols[0].x, cols[0].w, startY + (row + 1) * rowH, `Nivel ${lvl}`, () => {
                this._startGame(lvl, lvl % 5 === 0 ? 'boss' : 'combat');
            });
        });

        // Columna 1: Escenas directas + Salas
        this.addColTitle(cols[1].x, startY, "IR A ESCENA");
        const escenas = [
            ['Tienda', 'ShopScene'],
            ['Reliquias', 'RelicScene'],
            ['Mejoras', 'UpgradeScene'],
            ['Evento', 'EventScene'],
        ];
        escenas.forEach(([label, scene], i) => {
            row = i;
            this._addBtn(cols[1].x, cols[1].w, startY + (row + 1) * rowH, label, () => {
                this._goToScene(scene);
            });
        });

        // Salas forzadas
        this.addColTitle(cols[1].x, startY + 6 * rowH, "FORZAR SALA");
        const salas = [
            ['Forzar Boss', 4, 'combat'],
            ['Forzar Elite', 1, 'elite'],
            ['Forzar Tesoro', 1, 'treasure'],
        ];
        salas.forEach(([label, lvl, type], i) => {
            this._addBtn(cols[1].x, cols[1].w, startY + (7 + i) * rowH, label, () => {
                this._startGame(lvl, type);
            });
        });

        // Columna 2: Acciones + Meta
        this.addColTitle(cols[2].x, startY, "ACCIONES");

        const mainScene = this.scene.get('MainScene');

        const actions = [
            ['God Mode', () => {
                if (mainScene?.player) {
                    mainScene.player.hp = 99999;
                    mainScene.player.maxHp = 99999;
                }
                this.registry.set('playerHp', 99999);
                this.registry.set('playerMaxHp', 99999);
            }],
            ['Oro 99999', () => {
                this.registry.set('gold', 99999);
                if (mainScene) mainScene.gold = 99999;
            }],
            ['Dano 999', () => { this.registry.set('swordDamage', 999); }],
            ['Todas armas', () => { this.registry.set('hasBow', true); this.registry.set('hasBombs', true); }],
            ['Todas reliquias', () => {
                this.registry.set('relics', [...ALL_RELICS]);
                if (mainScene?.player) {
                    const relics = this.registry.get('relics') || [];
                    mainScene.player.speed = mainScene.player._baseSpeed ?? 200;
                    if (relics.includes('hermes')) mainScene.player.speed = Math.round(mainScene.player.speed * 1.2);
                    if (relics.includes('titan')) mainScene.player.speed = Math.round(mainScene.player.speed * 0.9);
                }
            }],
            ['HP max', () => { this.registry.set('playerHp', 9999); this.registry.set('playerMaxHp', 9999); }],
        ];
        actions.forEach(([label, cb], i) => {
            row = i;
            this._addBtn(cols[2].x, cols[2].w, startY + (row + 1) * rowH, label, cb);
        });

        // In-game: instakill
        this.addColTitle(cols[2].x, startY + 7 * rowH, "IN-GAME");
        const ingame = [
            ['Insta-kill enemigos', () => { if (mainScene?.enemies) mainScene.enemies.forEach(e => { if (e.hp > 0) { e.takeDamage(99999); } }); }],
            ['Insta-kill boss', () => { if (mainScene?.bosses) mainScene.bosses.forEach(b => { if (b.hp > 0) { b.takeDamage(99999); } }); }],
        ];
        ingame.forEach(([label, cb], i) => {
            this._addBtn(cols[2].x, cols[2].w, startY + (8 + i) * rowH, label, cb);
        });

        // Meta
        this.addColTitle(cols[2].x, startY + 10 * rowH, "META");
        const metaBtns = [
            ['Cristales +500', () => { this._addCrystals(500); }],
            ['Cristales +5000', () => { this._addCrystals(5000); }],
        ];
        metaBtns.forEach(([label, cb], i) => {
            this._addBtn(cols[2].x, cols[2].w, startY + (11 + i) * rowH, label, cb);
        });

        // Boton volver
        const volverY = H - 30;
        this._addBtn(cx - 120, 240, volverY, 'VOLVER AL MENU', () => {
            this.scene.stop('AdminScene');
            this.scene.start('MenuScene');
        });

        this._addBtn(cx + 120, 240, volverY, 'REANUDAR PARTIDA', () => {
            this.scene.stop('AdminScene');
            if (mainScene) {
                mainScene.scene.resume();
            }
        });

        // Feedback toast
        this._feedbackText = this.add.text(cx, H / 2 - 20, '', {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '22px', fill: '#00ff00', fontStyle: 'bold', backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(100).setAlpha(0);
    }

    addColTitle(x, y, text) {
        this.add.text(x, y, text, {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '13px', fill: '#ff00e1', fontStyle: 'bold'
        }).setDepth(1);
    }

    _addBtn(x, w, y, label, callback) {
        const btn = this.add.rectangle(x + w / 2, y, w, 28, 0x222222, 0.8)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x555555).setDepth(1);
        const txt = this.add.text(x + w / 2, y, label, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px', fill: '#ccc'
        }).setOrigin(0.5).setDepth(2);

        btn.on('pointerover', () => { btn.setFillStyle(0x444444); txt.setFill('#fff'); });
        btn.on('pointerout', () => { btn.setFillStyle(0x222222); txt.setFill('#ccc'); });
        btn.on('pointerdown', () => {
            callback();
            this._showFeedback(`${label} ✓`);
        });
    }

    _showFeedback(msg) {
        if (!this._feedbackText) return;
        this._feedbackText.setText(msg).setAlpha(1);
        this.tweens.add({
            targets: this._feedbackText,
            alpha: 0,
            duration: 1500,
            delay: 500,
        });
    }

    _startGame(level, nodeType) {
        this.registry.set('currentLevel', level);
        this.registry.set('nextNodeType', nodeType);
        this.registry.set('playerHp', 100);
        this.registry.set('playerMaxHp', 100);
        this.registry.set('gold', 0);
        this.registry.set('score', 0);
        this.registry.set('swordDamage', 10);
        this.registry.set('hasBow', false);
        this.registry.set('hasBombs', false);
        this.registry.set('equippedWeapon', 1);
        this.registry.set('relics', []);
        this.registry.set('runXp', 0);
        this.registry.set('runLevel', 1);
        this.registry.set('xpToNext', 100);
        this.registry.set('combo', 0);
        this.registry.set('maxCombo', 0);
        this.registry.set('currentMusicKey', null);
        if (window.stopMenuMusic) window.stopMenuMusic();
        this.scene.start('MainScene');
    }

    _goToScene(sceneKey) {
        const mainScene = this.scene.get('MainScene');
        if (mainScene?.scene.isActive()) {
            mainScene.scene.pause();
        }
        this.scene.stop('AdminScene');
        this.scene.start(sceneKey);
    }

    _addCrystals(amount) {
        let meta = JSON.parse(localStorage.getItem('metaStats')) || { crystals: 0, hpLevel: 0, dmgLevel: 0, speedLevel: 0 };
        meta.crystals = (meta.crystals || 0) + amount;
        localStorage.setItem('metaStats', JSON.stringify(meta));
    }
}
