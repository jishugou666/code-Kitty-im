import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || 'im_chat';

async function initDatabase() {
  console.log('===========================================');
  console.log('       IM Chat Database Init Script');
  console.log('===========================================\n');

  console.log(`Database: ${DB_NAME}`);
  console.log(`Host: ${DB_CONFIG.host}:${DB_CONFIG.port}\n`);

  let connection;
  try {
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected successfully.\n');

    console.log(`Dropping database if exists: ${DB_NAME}`);
    await connection.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    console.log('Database dropped.\n');

    console.log(`Creating database: ${DB_NAME}`);
    await connection.query(`CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('Database created.\n');

    console.log(`Using database: ${DB_NAME}`);
    await connection.query(`USE ${DB_NAME}`);

    console.log('Creating tables...');

    await connection.query(`
      CREATE TABLE user (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(100),
        avatar VARCHAR(500),
        email VARCHAR(100),
        phone VARCHAR(20),
        status TINYINT DEFAULT 1 COMMENT '1在线 0离线',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  - user table created');

    await connection.query(`
      CREATE TABLE conversation (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('single', 'group') DEFAULT 'single',
        name VARCHAR(100),
        avatar VARCHAR(500),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  - conversation table created');

    await connection.query(`
      CREATE TABLE conversation_member (
        id INT PRIMARY KEY AUTO_INCREMENT,
        conversation_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('owner', 'admin', 'member') DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_conversation_user (conversation_id, user_id),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  - conversation_member table created');

    await connection.query(`
      CREATE TABLE message (
        id INT PRIMARY KEY AUTO_INCREMENT,
        conversation_id INT NOT NULL,
        sender_id INT NOT NULL,
        type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation_id (conversation_id),
        INDEX idx_sender_id (sender_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  - message table created');

    await connection.query(`
      CREATE TABLE message_read (
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
    `);
    console.log('  - message_read table created');

    await connection.query(`
      CREATE TABLE contact (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        contact_user_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_contact (user_id, contact_user_id),
        INDEX idx_user_id (user_id),
        INDEX idx_contact_user_id (contact_user_id),
        INDEX idx_status (status),
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (contact_user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  - contact table created');

    console.log('\n===========================================');
    console.log('Database initialization completed successfully!');
    console.log('All tables have been created. Database is ready.');
    console.log('===========================================\n');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nPlease make sure:');
    console.error('  1. MySQL server is running');
    console.error('  2. Credentials in .env are correct');
    console.error('  3. MySQL user has permissions to create databases');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

initDatabase();
