import { describe, it, expect, vi } from 'vitest';
import { signUp, signIn, saveRunResult, getLeaderboard } from '../src/game/supabase.js';

const mockCreate = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    getUser: vi.fn()
};
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        auth: {
            signUp: (...args) => mockCreate.signUp(...args),
            signInWithPassword: (...args) => mockCreate.signInWithPassword(...args),
            getUser: (...args) => mockCreate.getUser(...args)
        },
        from: (...args) => mockFrom(...args)
    }))
}));

const makeChain = (selectData = {}, insertError = null, upsertError = null) => ({
    insert: vi.fn().mockResolvedValue({ error: insertError }),
    upsert: vi.fn().mockResolvedValue({ error: upsertError }),
    select: vi.fn(() => ({
        eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: selectData })
        })),
        order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: [{ username: 'top1', high_score: 999 }], error: null })
        }))
    }))
});

describe('Supabase Service Tests', () => {
    it('signUp debería retornar data del usuario sin error', async () => {
        mockCreate.signUp.mockResolvedValueOnce({ data: { user: { id: 'abc' } }, error: null });
        mockFrom.mockReturnValue(makeChain());
        const { data, error } = await signUp('test@test.com', 'pass', 'tester');
        expect(error).toBeUndefined();
        expect(data.user.id).toBe('abc');
    });

    it('signUp debería retornar error si supabase falla', async () => {
        mockCreate.signUp.mockResolvedValueOnce({ data: {}, error: { message: 'Email inválido' } });
        const result = await signUp('bad', 'pass', 'user');
        expect(result.error).toBeDefined();
        expect(result.error.message).toBe('Email inválido');
    });

    it('signIn debería retornar data del usuario', async () => {
        mockCreate.signInWithPassword.mockResolvedValueOnce({ data: { user: { id: 'abc' } }, error: null });
        const { data, error } = await signIn('test@test.com', 'pass');
        expect(error).toBeNull();
        expect(data.user).toBeDefined();
    });

    it('getLeaderboard debería retornar la lista de jugadores', async () => {
        mockFrom.mockReturnValue(makeChain());
        const { data, error } = await getLeaderboard();
        expect(error).toBeNull();
        expect(data[0].username).toBe('top1');
    });

    it('saveRunResult no debería lanzar error con datos válidos', async () => {
        mockCreate.getUser.mockResolvedValueOnce({
            data: { user: { id: 'abc', email: 'test@test.com' } }
        });
        mockFrom.mockReturnValue(makeChain({ total_crystals: 10, high_score: 500, max_sector: 3 }));
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        await saveRunResult(600, 4, 20);
        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('saveRunResult no debería crashear si el usuario no está logueado', async () => {
        mockCreate.getUser.mockResolvedValueOnce({ data: { user: null } });
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        await saveRunResult(100, 1, 5);
        // No debe lanzar error, simplemente hace return
        errorSpy.mockRestore();
    });
});
