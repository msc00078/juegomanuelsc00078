import { describe, it, expect, vi } from 'vitest';
import { Boss } from '../src/game/entities/Boss.js';

const makeScene = () => ({
    physics: {
        add: {
            existing: vi.fn(),
            group: vi.fn(() => ({ add: vi.fn(), clear: vi.fn() }))
        },
        moveToObject: vi.fn()
    },
    time: {
        delayedCall: vi.fn(),
        addEvent: vi.fn(() => ({ remove: vi.fn() })),
        now: 5000
    },
    add: {
        rectangle: vi.fn(() => ({
            setStrokeStyle: vi.fn().mockReturnThis(),
            setFillStyle: vi.fn().mockReturnThis(),
            setActive: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockReturnThis(),
            body: {
                setCollideWorldBounds: vi.fn(),
                setImmovable: vi.fn(),
                setVelocity: vi.fn(),
                enable: true,
                velocity: { x: 0, y: 0 }
            },
            x: 300, y: 300,
            active: true,
            fillColor: 0xff0000
        })),
        circle: vi.fn(() => ({
            setVisible: vi.fn().mockReturnThis(),
            setFillStyle: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
            active: true,
            body: { setCircle: vi.fn(), setImmovable: vi.fn() }
        }))
    },
    scale: { width: 1280, height: 720 },
    player: { sprite: { x: 640, y: 360, active: true, body: { velocity: { x: 0, y: 0 } } } },
    showDamageNumber: vi.fn(),
    createParticles: vi.fn(),
    cameras: { main: { shake: vi.fn() } },
    tweens: { add: vi.fn() },
    bossText: { setText: vi.fn() },
    apiCallInterval: 3000,
    spawnManager: { spawnKamikazeFromBoss: vi.fn() }
});

describe('Boss Logic Tests', () => {
    it('debería inicializarse con HP correcto y fase 1', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        expect(boss.hp).toBe(513);
        expect(boss.maxHp).toBe(513);
        expect(boss.phase).toBe(1);
        expect(boss.isDead).toBe(false);
        expect(boss.bossType).toBe('logico');
    });

    it('debería perder vida al recibir daño', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.takeDamage(100);
        expect(boss.hp).toBe(413);
        expect(scene.showDamageNumber).toHaveBeenCalledWith(300, 300, 100);
    });

    it('debería entrar en fase 2 cuando la vida cae por debajo del 50%', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.takeDamage(258);
        expect(boss.phase).toBe(2);
    });

    it('debería entrar en fase 3 cuando la vida cae por debajo del 20%', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.phase = 2;
        boss.hp = 100;
        boss.takeDamage(5);
        expect(boss.phase).toBe(3);
    });

    it('debería morir si la vida llega a 0', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.takeDamage(513);
        expect(boss.hp).toBe(0);
        expect(boss.isDead).toBe(true);
    });

    it('no debería recibir daño si ya está muerto', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.isDead = true;
        boss.takeDamage(100);
        expect(boss.hp).toBe(513);
    });

    it('debería entrar en fase 3 cuando la vida cae por debajo del 20%', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.phase = 2;
        boss.hp = 100;
        boss.takeDamage(15);
        expect(boss.phase).toBe(3);
    });

    it('debería morir si la vida llega a 0', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.takeDamage(513);
        expect(boss.hp).toBe(0);
        expect(boss.isDead).toBe(true);
    });

    it('no debería recibir daño si ya está muerto', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.isDead = true;
        boss.takeDamage(100);
        expect(boss.hp).toBe(513);
    });

    it('no debería morir dos veces (die() idempotente)', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.die();
        boss.die();
        expect(boss.isDead).toBe(true);
    });

    it('la vida no debería bajar de 0', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.takeDamage(99999);
        expect(boss.hp).toBe(0);
    });

    it('enterPhase debería cambiar la fase correctamente', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.enterPhase(2);
        expect(boss.phase).toBe(2);
        boss.enterPhase(3);
        expect(boss.phase).toBe(3);
    });
});
