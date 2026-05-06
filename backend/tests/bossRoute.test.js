import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import bossRoutes from '../routes/boss.js';
import * as llmService from '../services/llmService.js';

// Evita que lance el error de "GROQ_API_KEY is missing"
vi.mock('groq-sdk', () => {
    return { default: class { constructor() {} } };
});

// Crear una app express ligera para testear la ruta
const app = express();
app.use(express.json());
app.use('/api', bossRoutes);

describe('Boss Route Tests', () => {
    it('debería responder con la decisión del boss', async () => {
        // Mock de getBossAction
        vi.spyOn(llmService, 'getBossAction').mockResolvedValue({
            action: 'area',
            intensity: 0.9,
            dialogue: 'Siente mi furia'
        });

        const res = await request(app)
            .post('/api/boss-decision')
            .send({ boss_hp: 100, player_hp: 100, distance: 50, boss_type: 'logico', boss_phase: 1 });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('action', 'area');
        expect(res.body).toHaveProperty('intensity', 0.9);
        expect(res.body).toHaveProperty('dialogue', 'Siente mi furia');
    });

    it('debería manejar errores y devolver status 500', async () => {
        vi.spyOn(llmService, 'getBossAction').mockRejectedValue(new Error('Fatal Error'));

        const res = await request(app)
            .post('/api/boss-decision')
            .send({});

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'Failed to get boss decision');
    });
});
