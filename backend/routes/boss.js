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

export default router;
