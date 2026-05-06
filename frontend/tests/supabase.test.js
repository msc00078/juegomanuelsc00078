import { describe, it, expect, vi } from 'vitest';
import { signUp, signIn, saveRunResult, getLeaderboard } from '../src/game/supabase.js';

// Mock del cliente de supabase
vi.mock('@supabase/supabase-js', () => {
    return {
        createClient: vi.fn(() => ({
            auth: {
                signUp: vi.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }),
                signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }),
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: '123', email: 'test@test.com', user_metadata: { username: 'tester' } } } })
            },
            from: vi.fn(() => ({
                insert: vi.fn().mockResolvedValue({ error: null }),
                upsert: vi.fn().mockResolvedValue({ error: null }),
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({ data: { total_crystals: 10, high_score: 500, max_sector: 5 } })
                    })),
                    order: vi.fn(() => ({
                        limit: vi.fn().mockResolvedValue({ data: [{ username: 'tester', score: 100 }], error: null })
                    }))
                }))
            }))
        }))
    };
});

describe('Supabase Service Tests', () => {
    it('debería hacer signUp correctamente', async () => {
        const { data, error } = await signUp('test@test.com', 'password', 'tester');
        expect(error).toBeUndefined();
        expect(data.user).toBeDefined();
    });

    it('debería hacer signIn correctamente', async () => {
        const { data, error } = await signIn('test@test.com', 'password');
        expect(error).toBeNull();
        expect(data.user).toBeDefined();
    });

    it('debería guardar el resultado de la partida sin errores', async () => {
        // En lugar de probar un console.log inexistente, probamos que la función termine sin lanzar error
        const consoleSpy = vi.spyOn(console, 'error');
        await saveRunResult(1500, 10, 50);
        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('debería obtener la tabla de clasificación', async () => {
        const { data, error } = await getLeaderboard();
        expect(error).toBeNull();
        expect(data.length).toBe(1);
        expect(data[0].score).toBe(100);
    });
});
