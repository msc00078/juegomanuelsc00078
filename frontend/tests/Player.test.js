import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Player } from '../src/game/entities/Player.js';

// Fábrica de mock de escena (se reinicia en cada test para evitar interferencias)
const makeScene = (registryOverrides = {}) => {
    const defaults = {
        playerMaxHp: 100,
        playerHp: 100,
        bonusSpeed: 0,
        relics: [],
        equippedWeapon: 1,
        hp: 100
    };
    const registry = { ...defaults, ...registryOverrides };

    const rectangleMock = () => ({
        setStrokeStyle: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setTint: vi.fn().mockReturnThis(),
        clearTint: vi.fn().mockReturnThis(),
        destroy: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setActive: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setPosition: vi.fn().mockReturnThis(),
        setSize: vi.fn().mockReturnThis(),
        body: {
            setCollideWorldBounds: vi.fn(),
            setBounce: vi.fn(),
            setVelocity: vi.fn(),
            velocity: { x: 0, y: 0 },
            setSize: vi.fn(),
            setOffset: vi.fn(),
            enable: true,
            reset: vi.fn()
        },
        x: 100,
        y: 100,
        active: true,
        alpha: 1,
        width: 30
    });

    return {
        physics: {
            add: {
                existing: vi.fn(),
                sprite: vi.fn(() => rectangleMock())
            }
        },
        input: {
            keyboard: {
                createCursorKeys: vi.fn(() => ({
                    up: { isDown: false },
                    down: { isDown: false },
                    left: { isDown: false },
                    right: { isDown: false },
                    space: { isDown: false }
                })),
                addKeys: vi.fn(() => ({
                    up: { isDown: false },
                    down: { isDown: false },
                    left: { isDown: false },
                    right: { isDown: false },
                    space: { isDown: false },
                    shift: { isDown: false },
                    one: { isDown: false },
                    two: { isDown: false },
                    three: { isDown: false }
                }))
            }
        },
        time: {
            addEvent: vi.fn(),
            delayedCall: vi.fn()
        },
        add: {
            rectangle: vi.fn(() => rectangleMock())
        },
        tweens: { add: vi.fn() },
        registry: {
            get: vi.fn((key) => registry[key] ?? null),
            set: vi.fn((key, val) => { registry[key] = val; })
        },
        updateHealthUI: vi.fn(),
        gameOver: vi.fn()
    };
};

describe('Player Logic Tests', () => {
    it('debería leer los valores del registry de la escena', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        expect(player.maxHp).toBe(100);
        expect(player.hp).toBe(100);
        expect(player.speed).toBe(200);
    });

    it('debería perder vida al recibir daño', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        
        player.takeDamage(40);
        expect(player.hp).toBe(60);
    });

    it('debería quedar invulnerable justo después de recibir daño', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        
        player.takeDamage(10);
        expect(player.isInvulnerable).toBe(true);
    });

    it('debería actualizar el registry y la UI al recibir daño', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        
        player.takeDamage(40);
        expect(scene.registry.set).toHaveBeenCalledWith('hp', 60);
        expect(scene.updateHealthUI).toHaveBeenCalled();
    });

    it('debería ignorar daño si es invulnerable', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        player.isInvulnerable = true;
        
        player.takeDamage(50);
        expect(player.hp).toBe(100); // No baja
    });

    it('debería disparar el game over si la vida cae a 0', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        
        player.takeDamage(100);
        expect(player.hp).toBe(0);
        expect(scene.gameOver).toHaveBeenCalled();
    });

    it('la vida no debería bajar de 0', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        
        player.takeDamage(9999);
        expect(player.hp).toBe(0);
    });
});
