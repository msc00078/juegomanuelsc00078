import { describe, it, expect } from 'vitest';

describe('Frontend Basic Test', () => {
    it('debería confirmar que el entorno de testing funciona', () => {
        const value = 2 + 2;
        expect(value).toBe(4);
    });
});
