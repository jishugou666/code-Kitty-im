import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '../backend/.env' });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || 'im_chat';

const MIGRATIONS = [
  {
    name: 'add_message_read_table',
    up: `
      CREATE TABLE IF NOT EXISTS message_read (
        id INT PRIMARY KEY AUTO_INCREMENT,
        conversation_id INT NOT NULL,
        user_id INT NOT NULL,
        seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_conversation_user (conversation_id, user_id),
        INDEX idx_conversation_id (conversation_id),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
    down: 'DROP TABLE IF EXISTS message_read'
  },
  {
    name: 'add_user_indexes',
    up: `
      ALTER TABLE user ADD INDEX idx_email (email);
      ALTER TABLE user ADD INDEX idx_phone (phone);
    `,
    down: `
      ALTER TABLE user DROP INDEX idx_email;
      ALTER TABLE user DROP INDEX idx_phone;
    `
  }
];

async function createMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getExecutedMigrations(connection) {
  const [rows] = await connection.query('SELECT name FROM migrations');
  return rows.map(row => row.name);
}

async function runMigrations() {
  console.log('===========================================');
  console.log('       IM Chat Database Migration Script');
  console.log('===========================================\n');

  let connection;
  try {
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected successfully.\n');

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    await connection.query(`USE ${DB_NAME}`);

    await createMigrationsTable(connection);
    const executedMigrations = await getExecutedMigrations(connection);

    console.log(`Found ${MIGRATIONS.length} migrations.`);
    console.log(`Already executed: ${executedMigrations.length}\n`);

    for (const migration of MIGRATIONS) {
      if (executedMigrations.includes(migration.name)) {
        console.log(`Skipping: ${migration.name} (already executed)`);
        continue;
      }

      console.log(`Running: ${migration.name}...`);
      await connection.query(migration.up);
      await connection.query('INSERT INTO migrations (name) VALUES (?)', [migration.name]);
      console.log(`Completed: ${migration.name}\n`);
    }

    console.log('===========================================');
    console.log('All migrations completed successfully!');
    console.log('===========================================\n');

  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();
