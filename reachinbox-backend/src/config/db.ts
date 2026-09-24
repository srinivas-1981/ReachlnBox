import { Pool } from 'pg';
import { config } from './env';

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

/**
 * Initializes database tables and schemas if they don't exist.
 */
export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('📦 Connected to PostgreSQL database:', config.databaseUrl.replace(/:[^:@]+@/, ':****@'));

    await client.query('BEGIN');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        avatar_url TEXT,
        role VARCHAR(100) DEFAULT 'Growth Lead',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Emails Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        recipient VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        snippet TEXT,
        scheduled_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        delay_seconds INT DEFAULT 5,
        hourly_limit INT DEFAULT 50,
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        starred BOOLEAN DEFAULT FALSE,
        highlight_note TEXT,
        error_message TEXT,
        provider_message_id TEXT,
        attachments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure provider_message_id exists on already-created tables
    await client.query(`
      ALTER TABLE emails ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
    `);

    // 3. Campaigns Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
        start_time TIMESTAMPTZ,
        delay_seconds INT DEFAULT 5,
        hourly_limit INT DEFAULT 50,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Slack Integrations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS slack_integrations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        connected BOOLEAN DEFAULT FALSE,
        workspace_name VARCHAR(255),
        channel_name VARCHAR(255),
        connected_at TIMESTAMPTZ
      );
    `);

    // Seed default user if not exists
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO users (id, name, email, avatar_url, role)
        VALUES (
          'usr_reach_01',
          'Oliver Brown',
          'oliver.brown@domain.io',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          'Growth Lead'
        );
      `);
      console.log('🌱 Seeded default user (Oliver Brown)');
    }

    // Seed Slack integration
    const slackCheck = await client.query('SELECT COUNT(*) FROM slack_integrations');
    if (parseInt(slackCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO slack_integrations (id, user_id, connected, workspace_name, channel_name, connected_at)
        VALUES ('slk_01', 'usr_reach_01', TRUE, 'ReachInbox Growth Team', '#email-alerts', NOW() - INTERVAL '5 day');
      `);
      console.log('🌱 Seeded Slack integration status into PostgreSQL');
    }

    await client.query('COMMIT');
    console.log('✅ PostgreSQL Schema and tables ready');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}
