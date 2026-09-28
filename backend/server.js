import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authClient } from './db/database.js';
import stateRouter from './routes/state.js';

const app = express();
const PORT = process.env.PORT || 5000;
const allowed = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',').map(origin => origin.trim()).filter(Boolean);

app.use(cors({ origin: allowed.includes('*') ? true : allowed }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    // Confirms the Supabase Auth service is reachable; not a database query.
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error(`Supabase Auth returned ${response.status}`);
    res.json({ ok: true, service: 'VFS NEXUS API', databaseType: 'Supabase PostgreSQL', authService: 'reachable', time: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ ok: false, authService: 'unreachable', error: error.message });
  }
});

app.use('/api', stateRouter);
app.use((error, _req, res, _next) => {
  console.error('API error:', error);
  res.status(error.status || 500).json({ message: error.status === 400 ? error.message : 'Request failed' });
});
app.listen(PORT, () => console.log(`VFS NEXUS backend running on http://localhost:${PORT}`));
