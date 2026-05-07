export { default as EnemyBase } from './base/EnemyBase';
export { Player } from './Player';
export { Boss } from './Boss';
export { StandardEnemy } from './StandardEnemy';
export { TankEnemy } from './TankEnemy';
export { RangedEnemy } from './RangedEnemy';
export { KamikazeEnemy } from './KamikazeEnemy';
export { SummonerEnemy } from './SummonerEnemy';
export { TeleporterEnemy } from './TeleporterEnemy';
export { HealerEnemy } from './HealerEnemy';
export { GuardianEnemy } from './GuardianEnemy';
export { TrapperEnemy } from './TrapperEnemy';
export { LaserEliteEnemy } from './LaserEliteEnemy';

import EnemyBase from './base/EnemyBase';
export const applyEnemyScaling = EnemyBase.applyScaling;
