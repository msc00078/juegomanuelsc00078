import * as Phaser from 'phaser';

/**
 * Clase encargada de renderizar y gestionar los controles táctiles en pantalla.
 */
export class MobileControls {
  constructor(scene) {
    this.scene = scene;
    this.joystick = { vx: 0, vy: 0, active: false, pointerId: null };
    
    // Solo crear si es móvil o táctil
    this.isMobile = !scene.sys.game.device.os.desktop || navigator.maxTouchPoints > 0;
    if (this.isMobile) {
      this.create();
    }
  }

  create() {
    this.scene.input.addPointer(2); // Permitir multi-touch
    
    const joyY = this.scene.scale.height - 180;
    const base = this.scene.add.circle(130, joyY, 85, 0xffffff, 0.2).setDepth(1000).setScrollFactor(0);
    const stick = this.scene.add.circle(130, joyY, 40, 0x00ffff, 0.5).setDepth(1001).setScrollFactor(0);
    
    const atkY = this.scene.scale.height - 200;
    const attackBtn = this.scene.add.circle(this.scene.scale.width - 120, atkY, 75, 0xff0000, 0.5).setDepth(1000).setScrollFactor(0).setInteractive();
    this.scene.add.text(this.scene.scale.width - 120, atkY, "ATK", { fontSize: '28px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
    
    attackBtn.on('pointerdown', () => { 
        attackBtn.setAlpha(0.8);
        this.scene.player?.attack(); 
    });
    attackBtn.on('pointerup', () => attackBtn.setAlpha(0.5));
    attackBtn.on('pointerout', () => attackBtn.setAlpha(0.5));
    
    const dashY = this.scene.scale.height - 90;
    const dashBtn = this.scene.add.circle(this.scene.scale.width - 250, dashY, 55, 0x00ff00, 0.5).setDepth(1000).setScrollFactor(0).setInteractive();
    this.scene.add.text(this.scene.scale.width - 250, dashY, "DASH", { fontSize: '22px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
    
    dashBtn.on('pointerdown', () => { 
        dashBtn.setAlpha(0.8);
        this.scene.player?.dash(); 
    });
    dashBtn.on('pointerup', () => dashBtn.setAlpha(0.5));
    dashBtn.on('pointerout', () => dashBtn.setAlpha(0.5));

    this.scene.input.on('pointerdown', (pointer) => {
        if (pointer.x < this.scene.scale.width / 2 && pointer.y > 100) {
            this.joystick.active = true;
            this.joystick.pointerId = pointer.id;
            base.setPosition(pointer.x, pointer.y);
            stick.setPosition(pointer.x, pointer.y);
        }
    });

    this.scene.input.on('pointermove', (pointer) => {
        if (this.joystick.active && pointer.id === this.joystick.pointerId) {
            const angle = Phaser.Math.Angle.Between(base.x, base.y, pointer.x, pointer.y);
            let dist = Phaser.Math.Distance.Between(base.x, base.y, pointer.x, pointer.y);
            if (dist > 60) dist = 60;
            
            stick.setPosition(base.x + Math.cos(angle) * dist, base.y + Math.sin(angle) * dist);
            
            this.joystick.vx = (Math.cos(angle) * dist) / 60;
            this.joystick.vy = (Math.sin(angle) * dist) / 60;
        }
    });

    this.scene.input.on('pointerup', (pointer) => {
        if (this.joystick.pointerId === pointer.id) {
            this.joystick.active = false;
            this.joystick.vx = 0;
            this.joystick.vy = 0;
            base.setPosition(130, joyY);
            stick.setPosition(130, joyY);
        }
    });
  }

  getJoystickData() {
    return this.joystick;
  }
}
