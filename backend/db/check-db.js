import 'dotenv/config';
import { authClient } from './database.js';

// Checks Supabase configuration without opening a local SQLite file.
const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/health`, {
  headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY }
});
if (!response.ok) throw new Error(`Supabase Auth health check failed: ${response.status}`);
console.log('Supabase Auth reachable. To verify user_simulator_states, sign in and call GET /api/state with your access token.');
