import { describe, it, expect, vi } from 'vitest';
import { Player } from '../src/game/entities/Player.js';

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

    const rectMock = () => ({
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
        x: 100, y: 100, active: true, alpha: 1, width: 30
    });

    return {
        physics: { add: { existing: vi.fn() } },
        input: {
            keyboard: {
                createCursorKeys: vi.fn(() => ({
                    up: { isDown: false }, down: { isDown: false },
                    left: { isDown: false }, right: { isDown: false },
                    space: { isDown: false }
                })),
                addKeys: vi.fn(() => ({
                    up: { isDown: false }, down: { isDown: false },
                    left: { isDown: false }, right: { isDown: false },
                    space: { isDown: false }, shift: { isDown: false },
                    one: { isDown: false }, two: { isDown: false }, three: { isDown: false }
                }))
            }
        },
        time: { addEvent: vi.fn(), delayedCall: vi.fn() },
        add: { rectangle: vi.fn(() => rectMock()) },
        tweens: { add: vi.fn() },
        registry: {
            get: vi.fn((key) => registry[key] ?? null),
            set: vi.fn((key, val) => { registry[key] = val; })
        },
        updateUI: vi.fn(),
        endGame: vi.fn()
    };
};

describe('Player Logic Tests', () => {
    it('debería leer maxHp y hp del registry', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        expect(player.maxHp).toBe(100);
        expect(player.hp).toBe(100);
    });

    it('debería calcular la velocidad base correctamente', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        expect(player.speed).toBe(200);
    });

    it('debería aumentar la velocidad con bonusSpeed', () => {
        const scene = makeScene({ bonusSpeed: 0.5 });
        const player = new Player(scene, 100, 100);
        expect(player.speed).toBe(300);
    });

    it('debería aplicar bonus de velocidad de la reliquia hermes', () => {
        const scene = makeScene({ relics: ['hermes'] });
        const player = new Player(scene, 100, 100);
        expect(player.speed).toBeCloseTo(240);
    });

    it('debería aplicar reducción de velocidad de la reliquia titan', () => {
        const scene = makeScene({ relics: ['titan'] });
        const player = new Player(scene, 100, 100);
        expect(player.speed).toBe(180);
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

    it('debería actualizar el registry con la nueva HP', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        player.takeDamage(40);
        expect(scene.registry.set).toHaveBeenCalledWith('hp', 60);
    });

    it('debería llamar a updateUI al recibir daño', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        player.takeDamage(40);
        expect(scene.updateUI).toHaveBeenCalled();
    });

    it('debería ignorar daño si ya es invulnerable', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        player.isInvulnerable = true;
        player.takeDamage(50);
        expect(player.hp).toBe(100);
    });

    it('debería ignorar daño si ya tiene 0 HP', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        player.hp = 0;
        player.takeDamage(10);
        expect(player.hp).toBe(0);
        expect(scene.endGame).not.toHaveBeenCalled();
    });

    it('debería disparar endGame cuando la vida llega a 0', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        player.takeDamage(100);
        expect(player.hp).toBe(0);
        expect(scene.endGame).toHaveBeenCalled();
    });

    it('la vida no debería bajar de 0', () => {
        const scene = makeScene();
        const player = new Player(scene, 100, 100);
        player.takeDamage(9999);
        expect(player.hp).toBe(0);
    });

    it('debería reducir el daño con la reliquia hierro', () => {
        const scene = makeScene({ relics: ['hierro'] });
        const player = new Player(scene, 100, 100);
        player.takeDamage(5);
        expect(player.hp).toBe(97);
    });

    it('la reliquia hierro nunca debería reducir el daño a menos de 1', () => {
        const scene = makeScene({ relics: ['hierro'] });
        const player = new Player(scene, 100, 100);
        player.takeDamage(1);
        expect(player.hp).toBe(99);
    });
});
