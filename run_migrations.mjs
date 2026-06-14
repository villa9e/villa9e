import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';

const MIGRATIONS = [
  '/Users/legacijackson/villa9e/supabase/migrations/060_goal_action_level.sql',
];

async function run() {
  const client = new Client({
    host: 'aws-1-us-west-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.zjhsggnmwvwlhiocmfrn',
    password: 'ThisIsHell@Long2433!',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log('Connected to Supabase');

  for (const path of MIGRATIONS) {
    const sql = readFileSync(path, 'utf8');
    const name = path.split('/').pop();
    console.log(`\nRunning ${name}...`);
    try {
      await client.query(sql);
      console.log(`✓ ${name} applied`);
    } catch (e) {
      console.log(`✗ ${name} error: ${e.message.slice(0, 200)}`);
    }
  }

  await client.end();
  console.log('\nAll done.');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
