import { describe, it, expect, vi } from 'vitest';
import { Boss } from '../src/game/entities/Boss.js';

const makeScene = () => ({
    physics: {
        add: {
            existing: vi.fn(),
            group: vi.fn(() => ({ add: vi.fn() }))
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
                velocity: { x: 0, y: 0 }
            },
            x: 300, y: 300,
            active: true,
            fillColor: 0xff0000
        })),
        circle: vi.fn(() => ({
            setVisible: vi.fn().mockReturnThis(),
            setFillStyle: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
            body: { setCircle: vi.fn(), setImmovable: vi.fn() }
        }))
    },
    showDamageNumber: vi.fn(),
    createParticles: vi.fn(),
    cameras: { main: { shake: vi.fn() } },
    tweens: { add: vi.fn() },
    bossText: { setText: vi.fn() }
});

describe('Boss Logic Tests', () => {
    it('debería inicializarse con HP correcto y fase 1', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        expect(boss.hp).toBe(600);
        expect(boss.maxHp).toBe(600);
        expect(boss.phase).toBe(1);
        expect(boss.isDead).toBe(false);
        expect(boss.bossType).toBe('logico');
    });

    it('debería perder vida al recibir daño', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.takeDamage(100);
        expect(boss.hp).toBe(500);
        expect(scene.showDamageNumber).toHaveBeenCalledWith(300, 300, 100);
    });

    it('debería entrar en fase 2 cuando la vida cae por debajo del 60%', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.takeDamage(241); // 600 - 241 = 359 = 59.8%
        expect(boss.phase).toBe(2);
    });

    it('debería entrar en fase 3 cuando la vida cae por debajo del 30%', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.phase = 2; // Simular que ya está en fase 2
        boss.hp = 200;
        boss.takeDamage(21); // 200 - 21 = 179 = 29.8%
        expect(boss.phase).toBe(3);
    });

    it('debería morir si la vida llega a 0', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.takeDamage(600);
        expect(boss.hp).toBe(0);
        expect(boss.isDead).toBe(true);
    });

    it('no debería recibir daño si ya está muerto', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.isDead = true;
        boss.takeDamage(100);
        expect(boss.hp).toBe(600); // Sin cambio
    });

    it('no debería morir dos veces (die() idempotente)', () => {
        const scene = makeScene();
        const boss = new Boss(scene, 300, 300, 'logico');
        boss.die();
        boss.die(); // Segunda llamada no debe lanzar error
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
