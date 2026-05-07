import * as Phaser from 'phaser';
import { 
  StandardEnemy, TankEnemy, RangedEnemy, KamikazeEnemy, 
  SummonerEnemy, TeleporterEnemy, HealerEnemy, GuardianEnemy, 
  TrapperEnemy, applyEnemyScaling 
} from '../entities';

/**
 * Gestor de aparición de enemigos según el nivel y tipo de nodo.
 */
export class SpawnManager {
  constructor(scene) {
    this.scene = scene;
  }

  spawnNormalEnemies() {
    const level = this.scene.currentLevel;
    const numEnemies = Math.floor(2 + (level / 2)); 

    for (let i = 0; i < numEnemies; i++) {
      const rx = Phaser.Math.Between(100, this.scene.scale.width - 100);
      const ry = Phaser.Math.Between(100, this.scene.scale.height - 200);
      const rand = Math.random();
      let enemy;

      if (level < 5) {
        if (rand < 0.01)      enemy = new RangedEnemy(this.scene, rx, ry);
        else if (rand < 0.02) enemy = new KamikazeEnemy(this.scene, rx, ry);
        else if (rand < 0.03) enemy = new SummonerEnemy(this.scene, rx, ry);
        else if (level >= 3 && rand < 0.2) enemy = new TankEnemy(this.scene, rx, ry);
        else                  enemy = new StandardEnemy(this.scene, rx, ry);
      } 
      else if (level < 12) {
        if (rand < 0.02)      enemy = new SummonerEnemy(this.scene, rx, ry);
        else if (rand < 0.04) enemy = new TrapperEnemy(this.scene, rx, ry);
        else if (rand < 0.05) enemy = new TeleporterEnemy(this.scene, rx, ry);
        else if (rand < 0.5)  enemy = new StandardEnemy(this.scene, rx, ry);
        else if (rand < 0.7)  enemy = new TankEnemy(this.scene, rx, ry);
        else if (rand < 0.85) enemy = new RangedEnemy(this.scene, rx, ry);
        else                  enemy = new KamikazeEnemy(this.scene, rx, ry);
      } 
      else if (level < 25) {
        if (rand < 0.02)      enemy = new HealerEnemy(this.scene, rx, ry);
        else if (rand < 0.04) enemy = new GuardianEnemy(this.scene, rx, ry);
        else if (rand < 0.06) enemy = new TeleporterEnemy(this.scene, rx, ry);
        else if (rand < 0.3)  enemy = new StandardEnemy(this.scene, rx, ry);
        else if (rand < 0.5)  enemy = new TankEnemy(this.scene, rx, ry);
        else if (rand < 0.65) enemy = new RangedEnemy(this.scene, rx, ry);
        else if (rand < 0.75) enemy = new KamikazeEnemy(this.scene, rx, ry);
        else if (rand < 0.88) enemy = new SummonerEnemy(this.scene, rx, ry);
        else                  enemy = new TrapperEnemy(this.scene, rx, ry);
      } 
      else if (level < 45) {
        if (rand < 0.03)      enemy = new HealerEnemy(this.scene, rx, ry);
        else if (rand < 0.06) enemy = new GuardianEnemy(this.scene, rx, ry);
        else if (rand < 0.25) enemy = new StandardEnemy(this.scene, rx, ry);
        else if (rand < 0.45) enemy = new TankEnemy(this.scene, rx, ry);
        else if (rand < 0.6)  enemy = new RangedEnemy(this.scene, rx, ry);
        else if (rand < 0.7)  enemy = new KamikazeEnemy(this.scene, rx, ry);
        else if (rand < 0.8)  enemy = new SummonerEnemy(this.scene, rx, ry);
        else if (rand < 0.9)  enemy = new TrapperEnemy(this.scene, rx, ry);
        else                  enemy = new TeleporterEnemy(this.scene, rx, ry);
      } 
      else {
        if (rand < 0.15)     enemy = new StandardEnemy(this.scene, rx, ry);
        else if (rand < 0.3) enemy = new TankEnemy(this.scene, rx, ry);
        else if (rand < 0.4) enemy = new RangedEnemy(this.scene, rx, ry);
        else if (rand < 0.5) enemy = new KamikazeEnemy(this.scene, rx, ry);
        else if (rand < 0.6) enemy = new SummonerEnemy(this.scene, rx, ry);
        else if (rand < 0.7) enemy = new TrapperEnemy(this.scene, rx, ry);
        else if (rand < 0.8) enemy = new TeleporterEnemy(this.scene, rx, ry);
        else if (rand < 0.9) enemy = new HealerEnemy(this.scene, rx, ry);
        else                 enemy = new GuardianEnemy(this.scene, rx, ry);
      }

      applyEnemyScaling(enemy, level);
      this.scene.enemies.push(enemy);
      this.scene.setupEnemyCollisions(enemy);
    }
  }

  spawnKamikazeFromBoss() {
    if (this.scene.gameOver) return;
    const activeBosses = this.scene.bosses.filter(b => b.hp > 0);
    if (activeBosses.length === 0) return;
    
    const b = activeBosses[Math.floor(Math.random() * activeBosses.length)];
    const rx = b.sprite.x + Phaser.Math.Between(-100, 100);
    const ry = b.sprite.y + Phaser.Math.Between(-100, 100);
    
    const k = new KamikazeEnemy(this.scene, rx, ry);
    applyEnemyScaling(k, this.scene.currentLevel);
    this.scene.enemies.push(k);
    this.scene.setupEnemyCollisions(k);
  }
}
