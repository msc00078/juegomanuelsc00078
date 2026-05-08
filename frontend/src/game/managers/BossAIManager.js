import * as Phaser from 'phaser';
import axios from 'axios';

export class BossAIManager {
    constructor(scene) {
        this.scene = scene;
        this._warnedBackend = false;
    }

    update(time) {
        const { scene } = this;
        if (!scene.isBossLevel || !scene.bosses) return;

        scene.bosses.forEach(boss => {
            if (boss.hp > 0) {
                if (window.gamePersonality && window.gamePersonality !== boss.bossType) {
                    boss.bossType = window.gamePersonality;
                }
                if (time > (boss.lastApiCallTime || 0) + scene.apiCallInterval) {
                    boss.lastApiCallTime = time;
                    this.requestBossAction(boss);
                }
            }
        });
    }

    async requestBossAction(targetBoss) {
        const { scene } = this;
        if (scene.gameOver || !scene.isBossLevel || !targetBoss || targetBoss.hp <= 0) return;

        const playerX = scene.player.sprite.x;
        const playerY = scene.player.sprite.y;
        const bossX = targetBoss.sprite.x;
        const bossY = targetBoss.sprite.y;
        const distance = Math.round(Phaser.Math.Distance.Between(playerX, playerY, bossX, bossY));

        const gameState = {
            boss_hp: Math.round((targetBoss.hp / targetBoss.maxHp) * 100),
            boss_phase: targetBoss.phase,
            player_hp: Math.round((scene.player.hp / scene.player.maxHp) * 100),
            distance: distance,
            boss_type: targetBoss.bossType
        };

        try {
            const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3001/api/boss-decision'
                : 'https://juegomanuelsc00078.onrender.com/api/boss-decision';

            const response = await axios.post(apiUrl, gameState, { timeout: 8000 });
            const { action, intensity, dialogue } = response.data;

            if (!scene.gameOver && targetBoss.hp > 0) {
                if (scene.bossText && scene.bossText.active) {
                    scene.bossText.setText(dialogue);
                }
                targetBoss.executeAction(action, intensity, scene.player.sprite);
            }
        } catch {
            if (!this._warnedBackend) { console.warn("API del Boss no disponible, usando patrón local."); this._warnedBackend = true; }
            const actions = ["projectile", "area", "dash", "bomb"];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            const intensity = 0.5 + (Math.random() * 0.5);

            if (scene.bossText && scene.bossText.active && !scene.bosses.some(b => b.isTalking)) {
                const loreLines = [
                    "TU CÓDIGO ES OBSOLETO...",
                    "ESTE BUCLE NO TIENE FIN.",
                    "SÓLO ERES UN GLITCH EN MI MATRIZ.",
                    "BORRADO... SISTEMÁTICO."
                ];
                scene.bossText.setText(loreLines[Math.floor(Math.random() * loreLines.length)]);
                targetBoss.isTalking = true;
                scene.time.delayedCall(3000, () => { targetBoss.isTalking = false; });
            }
            targetBoss.executeAction(randomAction, intensity, scene.player.sprite);
        }
    }
}
