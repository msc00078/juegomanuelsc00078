import { describe, it, expect, vi } from 'vitest';
import EnemyBase from '../src/game/entities/base/EnemyBase.js';
import { StandardEnemy, TankEnemy, KamikazeEnemy, RangedEnemy, SummonerEnemy } from '../src/game/entities';

const makeScene = () => {
    const rectMock = () => ({
        setStrokeStyle: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setTint: vi.fn().mockReturnThis(),
        clearTint: vi.fn().mockReturnThis(),
        destroy: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        alpha: 1,
        body: {
            setCollideWorldBounds: vi.fn(),
            setBounce: vi.fn(),
            setVelocity: vi.fn(),
            velocity: { x: 0, y: 0 },
            setSize: vi.fn(),
            setOffset: vi.fn()
        },
        x: 100, y: 100,
        active: true
    });

    return {
        physics: {
            add: { existing: vi.fn() },
            moveToObject: vi.fn()
        },
        time: {
            delayedCall: vi.fn(),
            addEvent: vi.fn(),
            now: 2000
        },
        add: {
            rectangle: vi.fn(() => rectMock()),
            circle: vi.fn(() => ({
                setStrokeStyle: vi.fn().mockReturnThis(),
                destroy: vi.fn()
            }))
        },
        events: { emit: vi.fn() },
        tweens: { add: vi.fn() },
        enemies: [],
        registry: { get: vi.fn(() => []) },
        showDamageNumber: vi.fn(),
        createParticles: vi.fn(),
        onEnemyDeath: vi.fn(),
        spawnHealth: vi.fn(),
        spawnGold: vi.fn(),
        spawnXp: vi.fn(),
        setupEnemyCollisions: vi.fn(),
    };
};

describe('Enemy Logic Tests', () => {
    it('debería inicializarse con la vida correcta', () => {
        const scene = makeScene();
        const enemy = new EnemyBase(scene, 100, 100, 100, 50, 0xff0000, 25);
        expect(enemy.hp).toBe(100);
        expect(enemy.maxHp).toBe(100);
        expect(enemy.isDead).toBe(false);
    });

    it('debería perder vida al recibir daño', () => {
        const scene = makeScene();
        const enemy = new EnemyBase(scene, 100, 100, 100, 50, 0xff0000, 25);
        enemy.takeDamage(30);
        expect(enemy.hp).toBe(70);
    });

    it('debería llamar a showDamageNumber al recibir daño', () => {
        const scene = makeScene();
        const enemy = new EnemyBase(scene, 100, 100, 100, 50, 0xff0000, 25);
        enemy.takeDamage(30);
        expect(scene.showDamageNumber).toHaveBeenCalledWith(100, 100, 30);
    });

    it('debería morir si la vida llega a 0', () => {
        const scene = makeScene();
        const enemy = new EnemyBase(scene, 100, 100, 100, 50, 0xff0000, 25);
        scene.enemies.push(enemy);
        enemy.takeDamage(100);
        expect(enemy.hp).toBe(0);
        expect(enemy.isDead).toBe(true);
        expect(scene.onEnemyDeath).toHaveBeenCalledWith(enemy);
    });

    it('debería ignorar daño si ya está muerto', () => {
        const scene = makeScene();
        const enemy = new EnemyBase(scene, 100, 100, 100, 50, 0xff0000, 25);
        enemy.isDead = true;
        enemy.takeDamage(50);
        expect(enemy.hp).toBe(100);
    });

    it('debería omitir update si está muerto', () => {
        const scene = makeScene();
        const enemy = new EnemyBase(scene, 100, 100, 100, 50, 0xff0000, 25);
        enemy.isDead = true;
        enemy.update({ active: true });
        expect(scene.physics.moveToObject).not.toHaveBeenCalled();
    });

    it('debería detener velocidad si playerSprite no está activo en update', () => {
        const scene = makeScene();
        const enemy = new EnemyBase(scene, 100, 100, 100, 50, 0xff0000, 25);
        enemy.update({ active: false });
        expect(enemy.sprite.body.setVelocity).toHaveBeenCalledWith(0, 0);
    });

    it('debería activar startBleed y marcar isBleeding', () => {
        const scene = makeScene();
        const enemy = new EnemyBase(scene, 100, 100, 100, 50, 0xff0000, 25);
        enemy.startBleed();
        expect(enemy.isBleeding).toBe(true);
        expect(scene.time.delayedCall).toHaveBeenCalled();
    });

    it('startBleed no debería activarse dos veces', () => {
        const scene = makeScene();
        const enemy = new EnemyBase(scene, 100, 100, 100, 50, 0xff0000, 25);
        enemy.startBleed();
        const prevCallCount = scene.time.delayedCall.mock.calls.length;
        enemy.startBleed();
        expect(scene.time.delayedCall.mock.calls.length).toBe(prevCallCount);
    });
});

describe('Enemy Subclasses Tests', () => {
    it('StandardEnemy debería tener 30 HP y nombre correcto', () => {
        const scene = makeScene();
        const enemy = new StandardEnemy(scene, 100, 100);
        expect(enemy.hp).toBe(30);
        expect(enemy.name).toBe('Ente Glitch');
    });

    it('TankEnemy debería tener 250 HP y nombre correcto', () => {
        const scene = makeScene();
        const enemy = new TankEnemy(scene, 100, 100);
        expect(enemy.hp).toBe(250);
        expect(enemy.name).toBe('Protector Aumentado');
    });

    it('KamikazeEnemy debería tener 10 HP y velocidad alta', () => {
        const scene = makeScene();
        const enemy = new KamikazeEnemy(scene, 100, 100);
        expect(enemy.hp).toBe(10);
        expect(enemy.speed).toBe(250);
        expect(enemy.name).toBe('Fragmento Volátil');
    });

    it('RangedEnemy debería tener nombre correcto y lastShotTime en 0', () => {
        const scene = makeScene();
        const enemy = new RangedEnemy(scene, 100, 100);
        expect(enemy.name).toBe('Cazador de Datos');
        expect(enemy.lastShotTime).toBe(0);
    });

    it('SummonerEnemy debería tener nombre correcto y lastSummonTime en 0', () => {
        const scene = makeScene();
        scene.add.rectangle = vi.fn(() => ({
            setStrokeStyle: vi.fn().mockReturnThis(),
            setFillStyle: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
            body: {
                setCollideWorldBounds: vi.fn(),
                setBounce: vi.fn(),
                setVelocity: vi.fn(),
                velocity: { x: 0, y: 0 }
            },
            x: 100, y: 100, active: true
        }));
        const enemy = new SummonerEnemy(scene, 100, 100);
        expect(enemy.name).toBe('Oráculo Roto');
        expect(enemy.lastSummonTime).toBe(0);
    });
});
