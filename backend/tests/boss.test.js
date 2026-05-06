import { describe, it, expect, vi } from 'vitest';
import { getBossAction } from '../services/llmService.js';

// Mock del groq-sdk
const mockCreate = vi.fn();
vi.mock('groq-sdk', () => {
    const GroqMock = vi.fn();
    GroqMock.prototype.chat = {
        completions: {
            create: (...args) => mockCreate(...args)
        }
    };
    return { default: GroqMock };
});

describe('Boss LLM Service Tests', () => {
    it('debería retornar una acción parseada del mock de Groq', async () => {
        mockCreate.mockResolvedValueOnce({
            choices: [{
                message: {
                    content: JSON.stringify({
                        action: "dash",
                        intensity: 0.8,
                        dialogue: "¡Prueba unitaria superada!"
                    })
                }
            }]
        });

        const gameState = {
            boss_hp: 50,
            player_hp: 80,
            distance: 100,
            boss_type: 'logico',
            boss_phase: 2
        };

        const result = await getBossAction(gameState);
        
        expect(result).toHaveProperty('action');
        expect(result.action).toBe('dash');
        expect(result.intensity).toBe(0.8);
        expect(result.dialogue).toBe('¡Prueba unitaria superada!');
    });

    it('debería retornar la acción de fallback en caso de error de la API', async () => {
        // Simulamos que la API falla
        mockCreate.mockRejectedValueOnce(new Error('API Error Simulator'));

        const gameState = { boss_hp: 10, player_hp: 10, distance: 50, boss_type: 'poeta', boss_phase: 3 };

        const result = await getBossAction(gameState);

        expect(result).toHaveProperty('action', 'projectile');
        expect(result).toHaveProperty('intensity', 0.5);
        expect(result).toHaveProperty('dialogue', '...');
    });
});
