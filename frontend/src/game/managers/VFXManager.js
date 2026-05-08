import * as Phaser from 'phaser';

export class VFXManager {
    constructor(scene) {
        this.scene = scene;
    }

    showDamageNumber(x, y, damage) {
        const displayVal = typeof damage === 'number' ? Math.round(damage).toString() : damage;
        const txt = this.scene.add.text(x, y - 20, displayVal, {
            fontSize: '18px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);
        this.scene.tweens.add({
            targets: txt,
            y: y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    showCritEffect(x, y) {
        const txt = this.scene.add.text(x, y - 40, "CRIT!", {
            fontSize: '24px', fill: '#ff0000', fontStyle: 'bold', stroke: '#fff', strokeThickness: 2
        }).setOrigin(0.5);
        this.scene.tweens.add({
            targets: txt,
            scale: 1.5,
            y: y - 80,
            alpha: 0,
            duration: 1000,
            onComplete: () => txt.destroy()
        });
        this.scene.cameras.main.shake(100, 0.01);
    }

    createParticles(x, y, color) {
        let gfx = this.scene.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(0xffffff);
        gfx.fillRect(0, 0, 4, 4);
        gfx.generateTexture('squareParticle', 4, 4);
        const particles = this.scene.add.particles(x, y, 'squareParticle', {
            speed: { min: -100, max: 100 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            tint: color,
            quantity: 5
        });
        this.scene.time.delayedCall(300, () => particles.destroy());
    }

    pushBack(target, source, force) {
        if (!target || !target.body || !source || !source.x) return;
        const angle = Phaser.Math.Angle.Between(source.x, source.y, target.x, target.y);
        const cappedForce = Math.min(force, 1500);
        target.body.setVelocity(Math.cos(angle) * cappedForce, Math.sin(angle) * cappedForce);
    }

    drawVignette(graphicsObj) {
        graphicsObj.clear();
        graphicsObj.fillStyle(0x000000, 0.3);
        graphicsObj.fillRect(0, 0, this.scene.scale.width, 60);
        graphicsObj.fillRect(0, this.scene.scale.height - 60, this.scene.scale.width, 60);
        graphicsObj.setDepth(99).setScrollFactor(0);
    }
}
