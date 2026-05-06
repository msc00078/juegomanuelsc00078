import express from 'express';
import { getBossAction } from '../services/llmService.js';

const router = express.Router();

router.post('/boss-decision', async (req, res) => {
    try {
        const gameState = req.body;
        // gameState expected to have: boss_hp, player_hp, distance, boss_type
        
        const actionData = await getBossAction(gameState);
        
        res.json(actionData);
    } catch (error) {
        console.error("Error fetching boss decision:", error);
        res.status(500).json({ error: "Failed to get boss decision" });
    }
});

/**
 * Endpoint de precalentamiento (warmup).
 * Lanza una llamada ligéra a Groq para despertar el modelo
 * antes de que el jugador llegue al nivel de boss.
 * Responde inmediatamente con {ok: true} sin bloquear al cliente.
 */
router.post('/boss-warmup', (req, res) => {
    const bossType = req.body?.boss_type || 'poeta';

    // Responder al frontend YA para no bloquear nada
    res.json({ ok: true, message: 'Warmup iniciado en background' });

    // Disparar la llamada a Groq en background (fire-and-forget)
    const warmupState = {
        boss_hp: 100,
        player_hp: 100,
        distance: 300,
        boss_phase: 1,
        boss_type: bossType
    };
    getBossAction(warmupState).then(() => {
        console.log(`[Warmup OK] Modelo precalentado para boss tipo: ${bossType}`);
    }).catch((err) => {
        console.warn('[Warmup FAIL]', err.message);
    });
});

export default router;
