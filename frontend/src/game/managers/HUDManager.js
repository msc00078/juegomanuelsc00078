import * as Phaser from 'phaser';

/**
 * Gestor del HUD y la interfaz de usuario durante el juego.
 */
export class HUDManager {
  constructor(scene) {
    this.scene = scene;
    this.create();
  }

  create() {
    const { width, height } = this.scene.scale;

    // Panel Superior Glass
    this.topPanel = this.scene.add.graphics().setDepth(100).setScrollFactor(0);
    this.topPanel.fillStyle(0x050505, 0.75);
    this.topPanel.fillRoundedRect(10, 10, width - 20, 70, 12);
    this.topPanel.lineStyle(2, 0x00f2ff, 0.3);
    this.topPanel.strokeRoundedRect(10, 10, width - 20, 70, 12);
    
    const nodeType = this.scene.registry.get('nextNodeType') || 'combat';
    let nodeLabel = nodeType.toUpperCase();
    if (nodeLabel === 'COMBAT') nodeLabel = 'FRAGMENTO DE COMBATE';
    if (nodeLabel === 'ELITE') nodeLabel = 'ANOMALÍA CRÍTICA';
    if (nodeLabel === 'TREASURE') nodeLabel = 'NÚCLEO DE DATOS';
    if (nodeLabel === 'SHOP') nodeLabel = 'MERCADO NEGRO';
    if (nodeLabel === 'EVENT') nodeLabel = 'GLITCH EN LA REALIDAD';
    if (this.scene.isBossLevel) nodeLabel = 'CONCIENCIA ROTA (JEFE)';

    const currentLevel = this.scene.registry.get('currentLevel') || 1;
    this.levelText = this.scene.add.text(width / 2, 35, `SECTOR 0${currentLevel} // ${nodeLabel}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px', 
      fill: '#00f2ff', 
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0);

    // Barra de vida
    this.hpBarBg = this.scene.add.rectangle(135, 45, 180, 12, 0x111111).setDepth(101).setScrollFactor(0).setOrigin(0, 0.5);
    this.hpBar = this.scene.add.rectangle(135, 45, 180, 12, 0x00ff00).setDepth(102).setScrollFactor(0).setOrigin(0, 0.5);
    this.playerHpText = this.scene.add.text(135, 28, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px', fill: '#888', fontWeight: 'bold'
    }).setOrigin(0, 0.5).setDepth(103).setScrollFactor(0);

    // Barra de XP
    this.xpBarBg = this.scene.add.rectangle(135, 58, 180, 6, 0x111111).setDepth(101).setScrollFactor(0).setOrigin(0, 0.5);
    this.xpBar = this.scene.add.rectangle(135, 58, 180, 6, 0x00f2ff).setDepth(102).setScrollFactor(0).setOrigin(0, 0.5);
    this.runLevelText = this.scene.add.text(135, 72, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px', fill: '#00f2ff', fontWeight: 'bold'
    }).setOrigin(0, 0.5).setDepth(103).setScrollFactor(0);

    this.goldText = this.scene.add.text(width - 40, 35, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px', fill: '#ffd700', fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(101).setScrollFactor(0);

    this.scoreText = this.scene.add.text(width - 40, 58, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px', fill: '#00f2ff', fontWeight: 'bold'
    }).setOrigin(1, 0.5).setDepth(101).setScrollFactor(0);

    this.comboText = this.scene.add.text(width - 200, 45, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '24px', fill: '#ff00e1', fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(101).setScrollFactor(0);

    // Arma HUD
    this.weaponContainer = this.scene.add.container(width / 2, height - 40).setDepth(101).setScrollFactor(0);
    this.weaponBg = this.scene.add.rectangle(0, 0, 200, 40, 0x00f2ff, 0.1);
    this.weaponBg.setStrokeStyle(1, 0x00f2ff, 0.5);
    this.weaponText = this.scene.add.text(0, 0, "", {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px', fill: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.weaponContainer.add([this.weaponBg, this.weaponText]);
    
    this.weaponText.setInteractive({ useHandCursor: true });
    this.weaponText.on('pointerdown', () => this.scene.cycleWeapon?.());

    this.update();
  }

  update() {
    const reg = this.scene.registry;
    const player = this.scene.player;

    if (player) {
      const hpPct = Math.max(0, player.hp / player.maxHp);
      this.hpBar.width = 180 * hpPct;
      this.hpBar.setFillStyle(hpPct > 0.3 ? 0x00ff00 : 0xff0000);
      this.playerHpText.setText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`);
    }

    const xp = reg.get('runXp') || 0;
    const next = reg.get('xpToNext') || 100;
    this.xpBar.width = 180 * (xp / next);
    this.runLevelText.setText(`PROGRESO LVL.${reg.get('runLevel') || 1}`);

    this.goldText.setText(`${reg.get('gold') || 0} 💎`);
    this.scoreText.setText(`SCORE: ${reg.get('score') || 0}`);
    
    const combo = reg.get('combo') || 0;
    this.comboText.setText(combo > 1 ? `x${combo}` : '');

    const weapon = reg.get('equippedWeapon') || 1;
    let wName = "1 - ESPADA";
    if (weapon === 2) wName = "2 - ARCO";
    if (weapon === 3) wName = "3 - BOMBAS";
    this.weaponText.setText(wName);
  }
}
