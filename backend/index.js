import express from 'express';
import cors from 'express';
import dotenv from 'dotenv';
import bossRoutes from './routes/boss.js';
import corsMiddleware from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(corsMiddleware());
app.use(express.json());

app.use('/api', bossRoutes);

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
