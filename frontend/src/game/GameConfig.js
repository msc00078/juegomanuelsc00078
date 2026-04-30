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

const isMobile = /Mobi|Android/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
let gameWidth = 800;
const gameHeight = 600;

if (isMobile) {
    const ratio = Math.max(window.innerWidth, window.innerHeight) / Math.min(window.innerWidth, window.innerHeight);
    gameWidth = Math.round(gameHeight * ratio);
}

export const config = {
    type: Phaser.AUTO,
    parent: 'phaser-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameWidth,
        height: gameHeight
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
