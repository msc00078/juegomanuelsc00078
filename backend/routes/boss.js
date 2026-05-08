import express from 'express';
import { getBossAction } from '../services/llmService.js';

const router = express.Router();

const VALID_BOSS_TYPES = ['poeta', 'logico', 'glitch'];

function sanitizeGameState(body) {
    const boss_hp = Math.max(0, Math.min(100, Number(body.boss_hp) || 50));
    const player_hp = Math.max(0, Math.min(100, Number(body.player_hp) || 50));
    const distance = Math.max(0, Math.min(2000, Number(body.distance) || 300));
    const boss_phase = Math.max(1, Math.min(3, Number(body.boss_phase) || 1));
    const boss_type = VALID_BOSS_TYPES.includes(body.boss_type) ? body.boss_type : 'poeta';
    return { boss_hp, player_hp, distance, boss_phase, boss_type };
}

router.post('/boss-decision', async (req, res) => {
    try {
        const gameState = sanitizeGameState(req.body);
        const actionData = await getBossAction(gameState);
        res.json(actionData);
    } catch (error) {
        console.error("Error fetching boss decision:", error.message);
        res.status(500).json({ error: "Failed to get boss decision" });
    }
});

router.post('/boss-warmup', (req, res) => {
    const bossType = VALID_BOSS_TYPES.includes(req.body?.boss_type) ? req.body.boss_type : 'poeta';

    res.json({ ok: true, message: 'Warmup iniciado en background' });

    const warmupState = {
        boss_hp: 100,
        player_hp: 100,
        distance: 300,
        boss_phase: 1,
        boss_type: bossType,
    };
    getBossAction(warmupState).then(() => {
        console.log(`[Warmup OK] Modelo precalentado para boss tipo: ${bossType}`);
    }).catch((err) => {
        console.warn('[Warmup FAIL]', err.message);
    });
});

export default router;
