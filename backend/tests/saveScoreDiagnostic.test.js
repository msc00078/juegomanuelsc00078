/**
 * Diagnóstico de la API save-score en Render.
 * Ejecutar: npm run test:api
 */
import { describe, it, expect } from 'vitest';
import axios from 'axios';

const API_URL = 'https://juegomanuelsc00078.onrender.com/api';
const TIMEOUT_MS = 15000;

describe('Diagnóstico save-score en Render', () => {
    it('Paso 1: verificar que el backend responde (health)', async () => {
        const resp = await axios.post(`${API_URL}/boss-decision`,
            { boss_hp: 50, player_hp: 50, distance: 200, boss_phase: 1, boss_type: 'poeta' },
            { timeout: TIMEOUT_MS }
        );
        console.log(`  ✅ Backend OK: status ${resp.status}`);
        expect(resp.status).toBe(200);
    });

    it('Paso 2: probar save-score sin auth (debe dar 400 o 500)', async () => {
        try {
            await axios.post(`${API_URL}/save-score`,
                { score: 100, sector: 1, userId: 'test' },
                { timeout: 10000 }
            );
            console.log('  ⚠️  Devolvió 200 (puede estar mal)');
        } catch (err) {
            console.log(`  ➡️  Status: ${err.response?.status}`);
            console.log(`  ➡️  Body:   ${JSON.stringify(err.response?.data)}`);
            console.log(`  ➡️  Headers: ${JSON.stringify(err.response?.headers)}`);
            if (err.response?.status === 500) {
                console.log(`  ❌  El error 500 persiste. El RPC de Supabase falla.`);
            } else if (err.response?.status === 400) {
                console.log(`  ✅  400 "Datos incompletos" es esperado sin JWT real.`);
            } else if (err.response?.status === 429) {
                console.log(`  ❌  Rate limit alcanzado. Espera 1 minuto.`);
            }
        }
    });

    it('Paso 3: probar sin enviar p_crystals (como lo haría un player con level < 8)', async () => {
        try {
            const resp = await axios.post(`${API_URL}/save-score`,
                { score: 50, sector: 1, userId: 'diag-test' },
                { timeout: 10000 }
            );
            console.log(`  ➡️  Status: ${resp.status}`);
            console.log(`  ➡️  Body:   ${JSON.stringify(resp.data)}`);
        } catch (err) {
            console.log(`  ➡️  Status: ${err.response?.status}`);
            console.log(`  ➡️  Body:   ${JSON.stringify(err.response?.data)}`);
            if (err.response?.data?.error?.includes?.('function "registrar_fin_partida"')) {
                console.log(`  🔑  DIAGNÓSTICO: El RPC no existe en Supabase. Ejecuta el SQL.`);
            } else if (err.response?.data?.error?.includes?.('column "total_crystals"')) {
                console.log(`  🔑  DIAGNÓSTICO: La columna total_crystals no existe en la tabla profiles.`);
            } else if (err.response?.status === 500) {
                console.log(`  🔑  DIAGNÓSTICO: Error 500 genérico. Posible error de autenticación con Supabase.`);
            }
        }
    });
});
