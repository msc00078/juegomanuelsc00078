import { describe, it, expect } from 'vitest';
import { config } from '../src/game/GameConfig.js';

describe('GameConfig Tests', () => {
    it('debería exportar un objeto de configuración válido para Phaser', () => {
        expect(config).toBeDefined();
        expect(typeof config).toBe('object');
    });

    it('debería tener tipo AUTO', () => {
        expect(config.type).toBe('auto'); // Mocked as 'auto' in setup.js
    });

    it('debería tener configuración de escala', () => {
        expect(config.scale).toBeDefined();
        expect(config.scale.mode).toBe('fit');
        expect(config.scale.autoCenter).toBe('center');
        expect(config.scale.width).toBe(1280);
        expect(config.scale.height).toBe(720);
    });

    it('debería tener física arcade configurada', () => {
        expect(config.physics).toBeDefined();
        expect(config.physics.default).toBe('arcade');
    });

    it('debería tener al menos una escena registrada', () => {
        expect(config.scene).toBeDefined();
        expect(Array.isArray(config.scene)).toBe(true);
        expect(config.scene.length).toBeGreaterThan(0);
    });
});
