import { describe, it, expect, vi } from 'vitest';
import { Enemy } from '../src/game/entities/Enemy.js';

// Mock de la escena de Phaser para probar lógica pura
const makeScene = () => ({
    physics: {
        add: {
            existing: vi.fn()
        },
        moveToObject: vi.fn()
    },
    time: {
        delayedCall: vi.fn(),
        now: 1000
    },
    add: {
        rectangle: vi.fn(() => ({
            setStrokeStyle: vi.fn(),
            destroy: vi.fn(),
            setTint: vi.fn(),
            clearTint: vi.fn(),
            setFillStyle: vi.fn(),
            setVisible: vi.fn(),
            body: {
                setCollideWorldBounds: vi.fn(),
                setBounce: vi.fn(),
                setVelocity: vi.fn(),
                velocity: { x: 0, y: 0 },
                setSize: vi.fn(),
                setOffset: vi.fn()
            },
            x: 100,
            y: 100,
            active: true
        })),
        circle: vi.fn(() => ({
            setStrokeStyle: vi.fn(),
            destroy: vi.fn()
        })),
        graphics: vi.fn(() => ({
            clear: vi.fn(),
            fillStyle: vi.fn(),
            fillRect: vi.fn(),
            destroy: vi.fn()
        }))
    },
    events: {
        emit: vi.fn()
    },
    player: { x: 200, y: 200 },
    enemies: [],
    registry: { get: vi.fn(() => []) },
    // Estas funciones son opcionales gracias al optional chaining en Enemy.js
    showDamageNumber: vi.fn(),
    createParticles: vi.fn(),
    onEnemyDeath: vi.fn(),
    spawnHealth: vi.fn(),
    spawnGold: vi.fn(),
    spawnXp: vi.fn()
});

describe('Enemy Logic Tests', () => {
    it('debería inicializarse con la vida correcta', () => {
        const scene = makeScene();
        // Constructor: (scene, x, y, hp, speed, color, size)
        const enemy = new Enemy(scene, 100, 100, 100, 50, 0xff0000, 25);
        expect(enemy.hp).toBe(100);
        expect(enemy.maxHp).toBe(100);
        expect(enemy.isDead).toBe(false);
    });

    it('debería perder vida al recibir daño', () => {
        const scene = makeScene();
        const enemy = new Enemy(scene, 100, 100, 100, 50, 0xff0000, 25);
        
        enemy.takeDamage(30);
        expect(enemy.hp).toBe(70);
    });

    it('debería llamar a showDamageNumber al recibir daño', () => {
        const scene = makeScene();
        const enemy = new Enemy(scene, 100, 100, 100, 50, 0xff0000, 25);
        
        enemy.takeDamage(30);
        expect(scene.showDamageNumber).toHaveBeenCalledWith(100, 100, 30);
    });

    it('debería morir si la vida llega a 0 o menos', () => {
        const scene = makeScene();
        scene.enemies = []; // inicialmente vacío, enemy.die() intenta splice
        const enemy = new Enemy(scene, 100, 100, 100, 50, 0xff0000, 25);
        scene.enemies.push(enemy);
        
        enemy.takeDamage(150);
        expect(enemy.hp).toBe(0);
        expect(enemy.isDead).toBe(true);
        expect(scene.onEnemyDeath).toHaveBeenCalledWith(enemy);
    });

    it('debería ignorar daño si ya está muerto', () => {
        const scene = makeScene();
        const enemy = new Enemy(scene, 100, 100, 100, 50, 0xff0000, 25);
        enemy.isDead = true;
        
        enemy.takeDamage(50);
        expect(enemy.hp).toBe(100); // No cambió
    });
});
