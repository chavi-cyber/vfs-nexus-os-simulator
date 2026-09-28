import express from 'express';
import { authClient, createUserDb } from '../db/database.js';
import { DEFAULT_FILESYSTEM, DEFAULT_LOGS, DEFAULT_STATE } from '../seed.js';

const router = express.Router();

function defaultPayload() {
  return {
    ...structuredClone(DEFAULT_STATE),
    fileSystem: structuredClone(DEFAULT_FILESYSTEM),
    logs: structuredClone(DEFAULT_LOGS)
  };
}

// Every state operation is authenticated and restricted to the signed-in user.
router.use(async (req, res, next) => {
  const token = /^Bearer (.+)$/i.exec(req.get('authorization') || '')?.[1];
  if (!token) return res.status(401).json({ message: 'Missing access token' });

  try {
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) return res.status(401).json({ message: 'Invalid or expired access token' });
    req.userId = user.id;
    req.db = createUserDb(token);
    next();
  } catch (error) {
    next(error);
  }
});

async function saveState(req, payload) {
  if (!payload || !Array.isArray(payload.fileSystem)) {
    const error = new Error('fileSystem must be an array');
    error.status = 400;
    throw error;
  }
  const { error } = await req.db.from('user_simulator_states').upsert({
    user_id: req.userId,
    state: payload,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

router.get('/state', async (req, res, next) => {
  try {
    const { data, error } = await req.db.from('user_simulator_states')
      .select('state').eq('user_id', req.userId).maybeSingle();
    if (error) throw error;
    if (data) return res.json(data.state);
    const initial = defaultPayload();
    await saveState(req, initial);
    res.json(initial);
  } catch (error) { next(error); }
});

router.put('/state', async (req, res, next) => {
  try {
    await saveState(req, req.body);
    res.json({ ok: true, message: 'State persisted to Supabase' });
  } catch (error) { next(error); }
});

router.post('/reset', async (req, res, next) => {
  try {
    const initial = defaultPayload();
    await saveState(req, initial);
    res.json(initial);
  } catch (error) { next(error); }
});

export default router;
