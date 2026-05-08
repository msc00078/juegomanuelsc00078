import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import corsMiddleware from 'cors';
import bossRoutes from './routes/boss.js';
import scoreRoutes from './routes/score.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.disable('x-powered-by');

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://juegomanuelsc00078.onrender.com',
    'https://juegomanuelsc00078.vercel.app',
];
app.use(corsMiddleware({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origen no permitido por CORS'));
        }
    },
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));

const bossLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Demasiadas peticiones al jefe. Espera un momento.' },
});
const scoreLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Demasiadas peticiones de puntuación.' },
});

app.use('/api/boss-decision', bossLimiter);
app.use('/api/boss-warmup', bossLimiter);
app.use('/api/save-score', scoreLimiter);

app.use('/api', bossRoutes);
app.use('/api', scoreRoutes);

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
