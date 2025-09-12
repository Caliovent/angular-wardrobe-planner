import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Create a new pool for the test database using the provided connection string details
const testPool = new Pool({
  user: 'neondb_owner',
  host: 'ep-mute-bush-agyqw247-pooler.c-2.eu-central-1.aws.neon.tech',
  database: 'neondb', // IMPORTANT: Using a dedicated test database
  password: 'npg_D3WORC0hvbtY',
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Required for Neon.tech
  },
});

const schemaSql = fs.readFileSync(path.join(__dirname, '../../schema.sql')).toString();

export const initTestDb = async () => {
    const client = await testPool.connect();
    try {
        // Drop existing public schema and create a new one to ensure a clean state
        await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        // Re-create types and tables
        await client.query(schemaSql);
    } finally {
        client.release();
    }
};

export const clearTestDb = async () => {
    const client = await testPool.connect();
    try {
        // Truncating is faster than dropping and recreating tables
        await client.query('TRUNCATE Users, Items, Images, Links RESTART IDENTITY CASCADE;');
    } finally {
        client.release();
    }
};

export const closeTestPool = async () => {
  await testPool.end();
};

export default testPool;
