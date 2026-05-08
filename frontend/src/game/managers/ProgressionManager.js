export class ProgressionManager {
    constructor(scene) {
        this.scene = scene;
    }

    checkLevelClear() {
        const { scene } = this;
        if (scene.portal || scene.gameOver || scene.isWaitingForElite) return;
        let cleared = false;
        if (scene.isBossLevel) {
            if (scene.bosses && scene.bosses.every(b => b.hp <= 0)) cleared = true;
        } else {
            scene.enemies = scene.enemies.filter(e => e.hp > 0);
            if (scene.enemies.length === 0) cleared = true;
        }

        if (cleared) {
            scene.portal = scene.add.rectangle(scene.scale.width / 2, scene.scale.height / 2, 40, 40, 0x00ffff);
            scene.physics.add.existing(scene.portal);
            let portalMsg = "Al Mapa";
            if (scene.isBossLevel) portalMsg = "Reliquia de Boss";
            else if (scene.nodeType === 'elite') portalMsg = "Coger Reliquia";
            else if (scene.nodeType === 'treasure') portalMsg = "Seguir";

            scene.add.text(scene.scale.width / 2, scene.scale.height / 2 - 50, portalMsg, { fontSize: '18px', fill: '#0ff' }).setOrigin(0.5);
            scene.tweens.add({ targets: scene.portal, angle: 360, duration: 2000, repeat: -1 });
            scene.physics.add.overlap(scene.player.sprite, scene.portal, () => {
                if (!scene.isChangingLevel) {
                    scene.isChangingLevel = true;
                    if (scene.portal.body) scene.portal.body.enable = false;
                    this.nextLevel();
                }
            });
        }
    }

    nextLevel() {
        const { scene } = this;
        const currentLevel = scene.registry.get('currentLevel');
        scene.registry.set('playerHp', scene.player.hp);

        const nextLevelNumber = currentLevel + 1;
        scene.registry.set('currentLevel', nextLevelNumber);

        if (nextLevelNumber % 5 === 0) {
            scene.registry.set('nextNodeType', 'boss');
            if (Math.random() < 0.7) {
                scene.scene.start('ShopScene');
            } else {
                scene.scene.start('RelicScene');
            }
            return;
        }

        const r = Math.random();
        let nextNode;
        if (r < 0.55) nextNode = 'combat';
        else if (r < 0.625) nextNode = 'elite';
        else if (r < 0.70) nextNode = 'treasure';
        else if (r < 0.85) nextNode = 'shop';
        else nextNode = 'event';

        scene.registry.set('nextNodeType', nextNode);

        if (scene.isBossLevel || (scene.nodeType === 'elite' && nextNode !== 'shop' && nextNode !== 'event')) {
            scene.scene.start('RelicScene');
        } else if (nextNode === 'shop') {
            scene.scene.start('ShopScene');
        } else if (nextNode === 'event') {
            scene.scene.start('EventScene');
        } else {
            scene.scene.start('MainScene');
        }
    }
}
