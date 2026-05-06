/**
 * Test de Diagnóstico de la API del Boss en Tiempo Real
 * 
 * Este test llama REALMENTE a la API de Groq en Render.
 * Ejecutar manualmente con: npm run test:api
 * 
 * Propósito:
 * - Medir el tiempo de respuesta real del servidor
 * - Verificar que el JSON devuelto es válido y coherente
 * - Detectar si el servidor está dormido (cold start)
 */

import { describe, it, expect } from 'vitest';
import axios from 'axios';

const API_URL = 'https://juegomanuelsc00078.onrender.com/api/boss-decision';
const TIMEOUT_MS = 15000; // 15s para dar tiempo al cold start de Render

const BOSS_TYPES = ['poeta', 'logico', 'glitch'];

const testState = (bossHp, playerHp, distance, phase, type) => ({
    boss_hp: bossHp,
    player_hp: playerHp,
    distance,
    boss_phase: phase,
    boss_type: type
});

describe('API Boss - Diagnóstico de Respuesta Real', () => {
    // Aumentar el timeout de Vitest para este test
    it.concurrent.each(BOSS_TYPES)(
        'debería devolver acción coherente para boss tipo "%s"',
        async (bossType) => {
            const inicio = Date.now();

            const state = testState(80, 60, 250, 1, bossType);
            const response = await axios.post(API_URL, state, { timeout: TIMEOUT_MS });

            const ms = Date.now() - inicio;
            console.log(`\n[${bossType.toUpperCase()}] Tiempo de respuesta: ${ms}ms`);
            console.log(`  → action:    ${response.data.action}`);
            console.log(`  → intensity: ${response.data.intensity}`);
            console.log(`  → dialogue:  "${response.data.dialogue}"`);

            // 1. HTTP OK
            expect(response.status).toBe(200);

            // 2. JSON con los campos requeridos
            expect(response.data).toHaveProperty('action');
            expect(response.data).toHaveProperty('intensity');
            expect(response.data).toHaveProperty('dialogue');

            // 3. La acción es una de las tres válidas
            expect(['dash', 'projectile', 'area']).toContain(response.data.action);

            // 4. La intensidad es un número entre 0 y 1
            expect(typeof response.data.intensity).toBe('number');
            expect(response.data.intensity).toBeGreaterThanOrEqual(0.0);
            expect(response.data.intensity).toBeLessThanOrEqual(1.0);

            // 5. El diálogo existe y no está vacío
            expect(typeof response.data.dialogue).toBe('string');
            expect(response.data.dialogue.length).toBeGreaterThan(0);

            // 6. El fallback vacío "..." NO debería aparecer si la API responde bien
            // (Aviso, no fallo: puede ser válido si el modelo decide callar)
            if (response.data.dialogue === '...') {
                console.warn(`  ⚠️  [${bossType}] El diálogo es "...", posiblemente la API respondió con el FALLBACK local.`);
            }
        },
        TIMEOUT_MS
    );

    it('debería responder correctamente en fase 3 (boss casi muerto)', async () => {
        const inicio = Date.now();
        const state = testState(15, 90, 80, 3, 'logico');
        const response = await axios.post(API_URL, state, { timeout: TIMEOUT_MS });
        const ms = Date.now() - inicio;

        console.log(`\n[FASE 3 - Boss al 15% HP] Tiempo: ${ms}ms`);
        console.log(`  → action:    ${response.data.action}`);
        console.log(`  → intensity: ${response.data.intensity}`);
        console.log(`  → dialogue:  "${response.data.dialogue}"`);

        expect(response.status).toBe(200);
        expect(['dash', 'projectile', 'area']).toContain(response.data.action);
        // En fase 3 con boss casi muerto, esperamos alta intensidad
        expect(response.data.intensity).toBeGreaterThanOrEqual(0.5);
    }, TIMEOUT_MS);

    it('debería responder al warmup (estado neutro)', async () => {
        const inicio = Date.now();
        const state = testState(100, 100, 300, 1, 'poeta');
        const response = await axios.post(API_URL, state, { timeout: TIMEOUT_MS });
        const ms = Date.now() - inicio;

        console.log(`\n[WARMUP] Tiempo de respuesta del cold start: ${ms}ms`);
        if (ms > 5000) {
            console.warn(`  ⚠️  La API tardó más de 5s. El servidor estaba dormido (cold start de Render).`);
            console.warn(`       La función de warmup anticipado es CRÍTICA para una buena experiencia.`);
        } else {
            console.log(`  ✅ El servidor responde rápido (<5s). Cold start no es un problema ahora.`);
        }

        expect(response.status).toBe(200);
    }, TIMEOUT_MS);
});
