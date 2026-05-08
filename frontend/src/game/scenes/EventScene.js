import * as Phaser from 'phaser';
import { LoreManager } from '../managers/LoreManager';

const LEGACY_EVENTS = [
  {
    title: "ALTAR DE CODIGO",
    text: "Encuentras un terminal antiguo. Una IA fragmentada susurra: 'Sacrifica integridad estructural a cambio de privilegios'.",
    npc: "Terminal Antiguo",
    options: [
      { text: "BORRAR 20 MAX HP POR +10 DANO", action: (scene) => {
        scene.registry.set('playerMaxHp', Math.max(10, scene.registry.get('playerMaxHp') - 20));
        scene.registry.set('playerHp', Math.min(scene.registry.get('playerHp'), scene.registry.get('playerMaxHp')));
        scene.registry.set('swordDamage', scene.registry.get('swordDamage') + 10);
        return "Tu codigo de ataque se ha optimizado, pero eres mas fragil...";
      }},
      { text: "CERRAR TERMINAL", action: () => "Decides no alterar tu codigo fuente." }
    ]
  },
  {
    title: "CAPSULA DE HIBERNACION",
    text: "Encuentras una capsula de hibernacion parpadeando con la palabra 'RESTORE'.",
    npc: "Capsula de Hibernacion",
    options: [
      { text: "RESTAURAR SISTEMA (CURA 40 HP)", action: (scene) => {
        let hp = scene.registry.get('playerHp');
        let max = scene.registry.get('playerMaxHp');
        scene.registry.set('playerHp', Math.min(max, hp + 40));
        return "Tu sistema ha recuperado integridad.";
      }},
      { text: "EXTRAER COMPONENTES (GANA 30 ORO)", action: (scene) => {
        scene.registry.set('gold', scene.registry.get('gold') + 30);
        return "Has desmantelado la capsula. Oro obtenido.";
      }}
    ]
  }
];

export default class EventScene extends Phaser.Scene {
  constructor() {
    super('EventScene');
    this.currentBoxIndex = 0;
    this.boxes = [];
    this.eventData = null;
    this.dialogueContainer = null;
    this.textObj = null;
    this.typewriterTimer = null;
    this.isTyping = false;
    this.fullText = '';
    this.npcColor = '#00f2ff';
    this.npcName = '';
    this.totalRewards = {};
    this.choiceMade = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    this.totalRewards = {};
    this.choiceMade = false;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050505, 0x050505, 0x0a101a, 0x0a101a, 1);
    bg.fillRect(0, 0, W, H);
    this.add.grid(cx, H / 2, W, H, 64, 64, 0x00f2ff, 0.02, 0x00f2ff, 0.05);

    const storedEvent = this.registry.get('loreEvent');
    if (storedEvent) {
      this.eventData = storedEvent.encounter;
      this.npcData = storedEvent.npc;
      this.npcColor = this.npcData.color || '#00f2ff';
      this.npcName = this.npcData.name || 'Desconocido';
      this.npcId = this.npcData.id || 'unknown';
      this.eventId = this.eventData.id || 'unknown';
      this.boxes = this.eventData.boxes || [];
      this.registry.set('loreEvent', null);
    }

    if (!this.eventData || this.boxes.length === 0) {
      this.showLegacyEvent();
      return;
    }

    this.currentBoxIndex = 0;

    const panelW = Math.min(760, W * 0.90);
    const panelH = H * 0.75;
    const panel = this.add.graphics();
    panel.fillStyle(0x050505, 0.9);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 16);
    panel.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.npcColor).color, 0.4);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 16);

    this.panelW = panelW;
    this.panelH = panelH;
    this.cx = cx;
    this.cy = cy;

    this.npcTitleText = this.add.text(cx, cy - panelH / 2 + 45, this.npcData.title || this.npcName, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '32px', fill: this.npcColor, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.npcSubText = this.add.text(cx, cy - panelH / 2 + 90, `// ${this.npcName.toUpperCase()}`, {
      fontFamily: 'Inter, sans-serif', fontSize: '12px', fill: '#00f2ff', fontWeight: 'bold', letterSpacing: 4
    }).setOrigin(0.5);

    this.boxCounterText = this.add.text(cx + panelW / 2 - 40, cy - panelH / 2 + 30, '', {
      fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fill: '#555'
    }).setOrigin(0.5);

    this.speakerText = this.add.text(cx, cy - panelH / 2 + 130, '', {
      fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fill: '#888'
    }).setOrigin(0.5);

    this.textObj = this.add.text(cx, cy + 10, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px', fill: '#fff', align: 'center',
      wordWrap: { width: panelW - 100 },
      lineSpacing: 6
    }).setOrigin(0.5);

    this.continueHint = this.add.text(cx, cy + panelH / 2 - 60, '▼ TOCA PARA CONTINUAR', {
      fontFamily: 'Inter, sans-serif', fontSize: '13px', fill: '#666'
    }).setOrigin(0.5).setAlpha(0);

    this.choiceContainer = this.add.container(cx, 0);

    this.showBox(this.currentBoxIndex);

    this.input.on('pointerdown', () => this.onClick());
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.onClick());
      this.input.keyboard.on('keydown-ENTER', () => this.onClick());
    }
  }

  showBox(index) {
    if (index >= this.boxes.length) {
      this.endEncounter();
      return;
    }

    const box = this.boxes[index];
    this.currentBoxIndex = index;

    this.boxCounterText.setText(`${index + 1}/${this.boxes.length}`);

    const speaker = box.speaker || null;
    if (speaker) {
      this.speakerText.setText(`[${speaker.toUpperCase()}]`).setAlpha(1);
    } else {
      this.speakerText.setText('[NARRADOR]').setAlpha(0.6);
    }

    this.choiceContainer.removeAll(true);
    this.continueHint.setAlpha(0);

    this.typewriteText(box.text, box);
  }

  typewriteText(text, box) {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }

    this.isTyping = true;
    this.fullText = text;
    this.textObj.setText('');
    let charIndex = 0;

    this.typewriterTimer = this.time.addEvent({
      delay: 25,
      callback: () => {
        if (charIndex < this.fullText.length) {
          this.textObj.setText(this.fullText.substring(0, charIndex + 1));
          charIndex++;
        } else {
          this.isTyping = false;
          if (this.typewriterTimer) {
            this.typewriterTimer.destroy();
            this.typewriterTimer = null;
          }
          this.afterTypewrite(box);
        }
      },
      repeat: this.fullText.length - 1
    });
  }

  afterTypewrite(box) {
    if (box.choices && box.choices.length > 0) {
      this.showChoices(box.choices);
    } else {
      if (this.currentBoxIndex < this.boxes.length - 1) {
        this.tweens.add({
          targets: this.continueHint,
          alpha: { from: 0, to: 0.7 },
          duration: 400,
          yoyo: true,
          repeat: -1
        });
      }
    }
  }

  showChoices(choices) {
    this.choiceContainer.removeAll(true);

    const startY = 160;
    choices.forEach((choice, i) => {
      const yPos = startY + i * 70;
      const btnContainer = this.add.container(0, yPos);
      const btnBg = this.add.rectangle(0, 0, 500, 50, 0xffffff, 0.08).setInteractive();
      btnBg.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(this.npcColor).color, 0.6);

      const btnText = this.add.text(0, 0, choice.text, {
        fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fill: '#fff', fontStyle: 'bold'
      }).setOrigin(0.5);

      btnContainer.add([btnBg, btnText]);

      const rewardLabel = choice.rewards ? this.getRewardHint(choice.rewards) : '';
      if (rewardLabel) {
        const hintText = this.add.text(0, 25, rewardLabel, {
          fontFamily: 'Inter, sans-serif', fontSize: '10px', fill: '#ffcc00'
        }).setOrigin(0.5);
        btnContainer.add(hintText);
      }

      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x00f2ff, 0.15);
        btnBg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(this.npcColor).color, 1);
        this.tweens.add({ targets: btnContainer, scale: 1.05, duration: 100 });
      });

      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(0xffffff, 0.08);
        btnBg.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(this.npcColor).color, 0.6);
        this.tweens.add({ targets: btnContainer, scale: 1, duration: 100 });
      });

      btnBg.on('pointerdown', () => this.handleChoice(choice));

      this.choiceContainer.add(btnContainer);
    });
  }

  handleChoice(choice) {
    if (this.choiceMade) return;
    this.choiceMade = true;

    if (choice.rewards) {
      this.applyRewards(choice.rewards);
      this.showRewardFeedback(choice.rewards);
    }

    if (choice.nextBox) {
      const nextIndex = this.boxes.findIndex(b => b.id === choice.nextBox);
      if (nextIndex !== -1) {
        this.choiceContainer.removeAll(true);
        this.showBox(nextIndex);
        this.choiceMade = false;
        return;
      }
    }

    this.choiceContainer.removeAll(true);
    this.showBox(this.currentBoxIndex + 1);
    this.choiceMade = false;
  }

  applyRewards(rewards) {
    if (!rewards) return;
    this.totalRewards = this.totalRewards || {};

    if (rewards.crystals) {
      const meta = JSON.parse(localStorage.getItem('metaStats')) || { crystals: 0, hpLevel: 0, dmgLevel: 0, speedLevel: 0 };
      meta.crystals = (meta.crystals || 0) + rewards.crystals;
      localStorage.setItem('metaStats', JSON.stringify(meta));
      this.totalRewards.crystals = (this.totalRewards.crystals || 0) + rewards.crystals;
    }

    if (rewards.gold) {
      this.registry.set('gold', (this.registry.get('gold') || 0) + rewards.gold);
      this.totalRewards.gold = (this.totalRewards.gold || 0) + rewards.gold;
    }

    if (rewards.hp) {
      const currentHp = this.registry.get('playerHp');
      const maxHp = this.registry.get('playerMaxHp');
      this.registry.set('playerHp', Math.min(maxHp, (currentHp || 100) + rewards.hp));
      this.totalRewards.hp = (this.totalRewards.hp || 0) + rewards.hp;
    }

    if (rewards.maxHp) {
      this.registry.set('playerMaxHp', (this.registry.get('playerMaxHp') || 100) + rewards.maxHp);
      this.registry.set('playerHp', Math.min(
        this.registry.get('playerHp') || 100,
        this.registry.get('playerMaxHp')
      ));
      this.totalRewards.maxHp = (this.totalRewards.maxHp || 0) + rewards.maxHp;
    }

    if (rewards.damage) {
      this.registry.set('swordDamage', (this.registry.get('swordDamage') || 10) + rewards.damage);
      this.totalRewards.damage = (this.totalRewards.damage || 0) + rewards.damage;
    }

    if (rewards.relic) {
      const relics = this.registry.get('relics') || [];
      if (!relics.includes(rewards.relic)) {
        relics.push(rewards.relic);
        this.registry.set('relics', relics);
        this.totalRewards.relic = (this.totalRewards.relic || '') + (this.totalRewards.relic ? ', ' : '') + rewards.relic;
      }
    }

    if (rewards.message) {
      this.totalRewards.message = rewards.message;
    }
  }

  getRewardHint(rewards) {
    const parts = [];
    if (rewards.crystals) parts.push(`+${rewards.crystals} CRISTALES`);
    if (rewards.gold) parts.push(`+${rewards.gold} ORO`);
    if (rewards.hp) parts.push(`+${rewards.hp} HP`);
    if (rewards.maxHp) parts.push(`+${rewards.maxHp} MAX HP`);
    if (rewards.damage) parts.push(`+${rewards.damage} DANO`);
    if (rewards.relic) parts.push(`RELIOUIA: ${rewards.relic}`);
    return parts.length > 0 ? `[${parts.join(' | ')}]` : '';
  }

  showRewardFeedback(rewards) {
    const lines = [];
    if (rewards.crystals) lines.push({ text: `+${rewards.crystals} Cristales Meta`, color: '#ff00ff' });
    if (rewards.gold) lines.push({ text: `+${rewards.gold} Oro`, color: '#ffcc00' });
    if (rewards.hp) lines.push({ text: `+${rewards.hp} HP`, color: '#00ff88' });
    if (rewards.maxHp) lines.push({ text: `+${rewards.maxHp} Max HP`, color: '#00f2ff' });
    if (rewards.damage) lines.push({ text: `+${rewards.damage} Dano`, color: '#ff5555' });
    if (rewards.relic) lines.push({ text: `Reliquia: ${rewards.relic}`, color: '#ffcc00' });
    if (rewards.message) lines.push({ text: rewards.message.substring(0, 50), color: '#ffffff' });

    lines.forEach((line, i) => {
      const txt = this.add.text(this.cx, this.cy - 80 + (i * 35), line.text, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '20px',
        fill: line.color,
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(1500);

      this.tweens.add({
        targets: txt,
        y: txt.y - 100,
        alpha: 0,
        duration: 2500,
        delay: i * 150,
        onComplete: () => txt.destroy()
      });
    });
  }

  onClick() {
    if (this.isTyping) {
      if (this.typewriterTimer) {
        this.typewriterTimer.destroy();
        this.typewriterTimer = null;
      }
      this.isTyping = false;
      this.textObj.setText(this.fullText);
      const box = this.boxes[this.currentBoxIndex];
      this.afterTypewrite(box);
      return;
    }

    if (this.choiceMade) return;

    const currentBox = this.boxes[this.currentBoxIndex];
    if (currentBox && currentBox.choices && currentBox.choices.length > 0) return;

    this.showBox(this.currentBoxIndex + 1);
  }

  endEncounter() {
    if (this.npcId && this.eventId) {
      const manager = new LoreManager(this);
      manager.markEventSeen(this.eventId);
      manager.advanceNpcProgress(this.npcId);
    }

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    this.children.removeAll();

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000000, 0x000000, 0x0a0a0a, 0x0a0a0a, 1);
    bg.fillRect(0, 0, W, H);

    const lines = [];
    if (this.totalRewards.crystals) lines.push(`+${this.totalRewards.crystals} Cristales Meta`);
    if (this.totalRewards.gold) lines.push(`+${this.totalRewards.gold} Oro`);
    if (this.totalRewards.hp) lines.push(`+${this.totalRewards.hp} HP`);
    if (this.totalRewards.maxHp) lines.push(`+${this.totalRewards.maxHp} Vida Maxima`);
    if (this.totalRewards.damage) lines.push(`+${this.totalRewards.damage} Dano`);
    if (this.totalRewards.relic) lines.push(`Reliquia obtenida: ${this.totalRewards.relic}`);

    const summary = lines.length > 0
      ? lines.join('\n')
      : (this.totalRewards.message || 'El encuentro ha terminado.');

    const msgToShow = lines.length > 0 && this.totalRewards.message
      ? `${this.totalRewards.message}\n\n--- RECOMPENSAS ---\n${summary}`
      : summary;

    this.add.text(cx, cy - 110, 'ENCUENTRO COMPLETADO', {
      fontFamily: 'Orbitron, sans-serif', fontSize: '28px', fill: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, cy - 30, msgToShow, {
      fontFamily: 'Inter, sans-serif', fontSize: '18px', fill: '#fff', align: 'center',
      lineSpacing: 8,
      wordWrap: { width: W * 0.8 }
    }).setOrigin(0.5);

    const btnContainer = this.add.container(cx, cy + 100);
    const btnBg = this.add.rectangle(0, 0, 260, 50, 0x00f2ff, 0.1).setInteractive();
    btnBg.setStrokeStyle(1, 0x00f2ff, 0.5);
    const btnTxt = this.add.text(0, 0, 'CONTINUAR >', {
      fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fill: '#00f2ff', fontStyle: 'bold'
    }).setOrigin(0.5);
    btnContainer.add([btnBg, btnTxt]);

    btnBg.on('pointerover', () => { btnBg.setFillStyle(0x00f2ff, 0.3); this.tweens.add({ targets: btnContainer, scale: 1.05, duration: 200 }); });
    btnBg.on('pointerout', () => { btnBg.setFillStyle(0x00f2ff, 0.1); this.tweens.add({ targets: btnContainer, scale: 1, duration: 200 }); });
    btnBg.on('pointerdown', () => this.scene.start('MainScene'));
  }

  showLegacyEvent() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    const event = Phaser.Utils.Array.GetRandom(LEGACY_EVENTS);

    const panelW = Math.min(760, W * 0.90);
    const panelH = H * 0.75;
    const panel = this.add.graphics();
    panel.fillStyle(0x050505, 0.9);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 16);
    panel.lineStyle(2, 0xffcc00, 0.4);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 16);

    this.add.text(cx, cy - panelH / 2 + 50, event.title, {
      fontFamily: 'Orbitron, sans-serif', fontSize: '36px', fill: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5);

    if (event.npc) {
      this.add.text(cx, cy - panelH / 2 + 100, `// ${event.npc.toUpperCase()}`, {
        fontFamily: 'Inter, sans-serif', fontSize: '12px', fill: '#00f2ff', fontWeight: 'bold', letterSpacing: 4
      }).setOrigin(0.5);
    }

    this.add.text(cx, cy - 60, event.text, {
      fontFamily: 'Inter, sans-serif', fontSize: '18px', fill: '#fff', align: 'center', fontStyle: 'italic',
      wordWrap: { width: panelW - 100 }
    }).setOrigin(0.5);

    event.options.forEach((opt, i) => {
      const btnY = cy + 60 + (i * 80);
      this.createLegacyOption(cx, btnY, opt.text, () => {
        const result = opt.action(this);
        this.showLegacyResult(result);
      });
    });
  }

  createLegacyOption(x, y, label, callback) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 500, 55, 0xffffff, 0.05).setInteractive();
    bg.setStrokeStyle(1, 0x00f2ff, 0.4);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Orbitron, sans-serif', fontSize: '15px', fill: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add([bg, txt]);
    bg.on('pointerover', () => {
      bg.setFillStyle(0x00f2ff, 0.15);
      bg.setStrokeStyle(1, 0x00f2ff, 1);
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0xffffff, 0.05);
      bg.setStrokeStyle(1, 0x00f2ff, 0.4);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    bg.on('pointerdown', () => callback());
  }

  showLegacyResult(msg) {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    this.children.removeAll();
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000000, 0x000000, 0x0a0a0a, 0x0a0a0a, 1);
    bg.fillRect(0, 0, W, H);

    this.add.text(cx, cy - 60, msg, {
      fontFamily: 'Inter, sans-serif', fontSize: '24px', fill: '#fff', align: 'center',
      wordWrap: { width: W * 0.8 }
    }).setOrigin(0.5);

    const btnContainer = this.add.container(cx, cy + 120);
    const btnBg = this.add.rectangle(0, 0, 260, 50, 0x00f2ff, 0.1).setInteractive();
    btnBg.setStrokeStyle(1, 0x00f2ff, 0.5);
    const btnTxt = this.add.text(0, 0, 'CONTINUAR >', {
      fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fill: '#00f2ff', fontStyle: 'bold'
    }).setOrigin(0.5);
    btnContainer.add([btnBg, btnTxt]);
    btnBg.on('pointerover', () => { btnBg.setFillStyle(0x00f2ff, 0.3); this.tweens.add({ targets: btnContainer, scale: 1.05, duration: 200 }); });
    btnBg.on('pointerout', () => { btnBg.setFillStyle(0x00f2ff, 0.1); this.tweens.add({ targets: btnContainer, scale: 1, duration: 200 }); });
    btnBg.on('pointerdown', () => this.scene.start('MainScene'));
  }
}
