import * as Phaser from 'phaser';

/**
 * Gestor de entrada unificado para Teclado y Móvil.
 * Proporciona una interfaz simple para obtener dirección y acciones.
 */
export class InputManager {
  constructor(scene) {
    this.scene = scene;
    
    // Configuración de Teclado
    if (scene.input.keyboard) {
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
    } else {
      this.cursors = null;
      this.wasd = null;
    }

    this.mobileJoystick = null;
    this.isMobile = !scene.sys.game.device.os.desktop || navigator.maxTouchPoints > 0;
  }

  /** Registra el joystick móvil */
  setMobileJoystick(joystick) {
    this.mobileJoystick = joystick;
  }

  /** Retorna el vector de movimiento {x, y} de -1 a 1 */
  getMovement() {
    let moveX = 0;
    let moveY = 0;

    // Teclado
    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) moveX = -1;
      else if (this.cursors.right.isDown || this.wasd.right.isDown) moveX = 1;
    
      if (this.cursors.up.isDown || this.wasd.up.isDown) moveY = -1;
      else if (this.cursors.down.isDown || this.wasd.down.isDown) moveY = 1;
    }

    // Móvil (Sobrescribe si hay input activo)
    if (this.mobileJoystick && this.mobileJoystick.active) {
      moveX = this.mobileJoystick.vx;
      moveY = this.mobileJoystick.vy;
    } else {
      // Normalizar diagonal en teclado
      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }
    }

    return { x: moveX, y: moveY };
  }

  /** Retorna true si se ha pulsado la acción en este frame */
  isActionJustDown(action) {
    switch (action) {
      case 'attack':
        return (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.space)) || 
               (this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.space));
      case 'dash':
        return this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.shift);
      case 'weapon1':
        return this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.one);
      case 'weapon2':
        return this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.two);
      case 'weapon3':
        return this.wasd && Phaser.Input.Keyboard.JustDown(this.wasd.three);
      default:
        return false;
    }
  }
}
