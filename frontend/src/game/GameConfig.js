import * as Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import MapScene from './scenes/MapScene';
import MainScene from './scenes/MainScene';
import ShopScene from './scenes/ShopScene';
import RelicScene from './scenes/RelicScene';
import EventScene from './scenes/EventScene';
import UpgradeScene from './scenes/UpgradeScene';

import InventoryScene from './scenes/InventoryScene';
import PauseScene from './scenes/PauseScene';
import LevelUpScene from './scenes/LevelUpScene';

export const config = {
    type: Phaser.AUTO,
    parent: 'phaser-container',
    scale: {
        mode: Phaser.Scale.RESIZE,   // El canvas se estira al 100% del contenedor padre, siempre
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%',
    },
    backgroundColor: '#35682d',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: [MenuScene, MapScene, MainScene, ShopScene, RelicScene, EventScene, UpgradeScene, InventoryScene, PauseScene, LevelUpScene]
};
