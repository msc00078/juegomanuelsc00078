import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

router.post('/save-score', async (req, res) => {
    const { score, sector, crystalsEarned, userId } = req.body;

    if (score == null || sector == null || !userId) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    const MAX_POINTS_PER_SECTOR = 4000;
    const maxPlausible = sector * MAX_POINTS_PER_SECTOR;

    if (score > maxPlausible) {
        console.warn(`[SECURITY] Intento de hack detectado: User ${userId} envió ${score} puntos en Sector ${sector}`);
        return res.status(403).json({
            error: 'Puntuación anómala detectada. La simulación ha invalidado estos datos.',
            hacker_detected: true
        });
    }

    try {
        const rpcPayload = { p_score: score, p_sector: sector, p_crystals: Math.max(0, Math.floor(crystalsEarned || 0)) };
        const response = await axios.post(
            `${SUPABASE_URL}/rest/v1/rpc/registrar_fin_partida`,
            rpcPayload,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': req.headers.authorization,
                    'Content-Type': 'application/json'
                }
            }
        );

        return res.status(200).json({ message: 'Puntuación validada y guardada.', data: response.data });
    } catch (error) {
        console.error('Error al guardar en Supabase:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Error interno al procesar la puntuación.' });
    }
});

export default router;
