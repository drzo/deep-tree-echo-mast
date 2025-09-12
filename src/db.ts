import { Pool } from 'pg';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/mastra',
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  await db.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.end();
  process.exit(0);
});