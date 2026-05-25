import { query, getConnection } from '../utils/db.js';

const MIGRATION_NAME = 'add_performance_fields';
const MIGRATION_VERSION = '20260525_001';

const COLUMNS_TO_ADD = [
  {
    name: 'performance_score',
    sql: 'ADD COLUMN performance_score DECIMAL(5,2) DEFAULT NULL COMMENT \'表现分(0-100)\''
  },
  {
    name: 'performance_grade',
    sql: 'ADD COLUMN performance_grade VARCHAR(2) DEFAULT NULL COMMENT \'表现等级(S/A/B/C/D)\''
  },
  {
    name: 'performance_title',
    sql: 'ADD COLUMN performance_title VARCHAR(50) DEFAULT NULL COMMENT \'表现称号\''
  },
  {
    name: 'highlights',
    sql: 'ADD COLUMN highlights JSON DEFAULT NULL COMMENT \'高光时刻列表\''
  },
  {
    name: 'performance_details',
    sql: 'ADD COLUMN performance_details JSON DEFAULT NULL COMMENT \'表现分详细拆解\''
  }
];

async function columnExists(tableName, columnName) {
  try {
    const results = await query(
      `SHOW COLUMNS FROM \`${tableName}\` LIKE ?`,
      [columnName]
    );
    return results && results.length > 0;
  } catch (error) {
    console.error(`[Migration] Error checking column ${tableName}.${columnName}:`, error.message);
    return false;
  }
}

async function createMigrationLogTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS migration_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        version VARCHAR(50) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('success','failed') DEFAULT 'success',
        error_message TEXT DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (error) {
    console.error('[Migration] Error creating migration_log table:', error.message);
    throw error;
  }
}

async function isMigrationExecuted(migrationName) {
  try {
    const results = await query(
      'SELECT id FROM migration_log WHERE migration_name = ?',
      [migrationName]
    );
    return results && results.length > 0;
  } catch (error) {
    return false;
  }
}

async function recordMigration(migrationName, version, success = true, errorMessage = null) {
  try {
    await query(
      `INSERT INTO migration_log (migration_name, version, status, error_message) 
       VALUES (?, ?, ?, ?)`,
      [migrationName, version, success ? 'success' : 'failed', errorMessage]
    );
  } catch (error) {
    if (success) {
      console.warn('[Migration] Warning: Could not record successful migration:', error.message);
    }
  }
}

async function runPerformanceMigration() {
  console.log('[Migration] ===========================================');
  console.log(`[Migration] Starting migration: ${MIGRATION_NAME}`);
  console.log(`[Migration] Version: ${MIGRATION_VERSION}`);
  console.log('[Migration] ===========================================');

  try {
    await createMigrationLogTable();

    if (await isMigrationExecuted(MIGRATION_NAME)) {
      console.log(`[Migration] Migration ${MIGRATION_NAME} already executed, skipping`);
      return { success: true, message: 'Already executed', skipped: true };
    }

    let addedColumns = [];
    let skippedColumns = [];

    for (const col of COLUMNS_TO_ADD) {
      const exists = await columnExists('game_match', col.name);
      if (!exists) {
        try {
          await query(`ALTER TABLE game_match ${col.sql}`);
          addedColumns.push(col.name);
          console.log(`[Migration] ✓ Added column: ${col.name}`);
        } catch (error) {
          console.error(`[Migration] ✗ Failed to add column ${col.name}:`, error.message);
          skippedColumns.push({ name: col.name, error: error.message });
        }
      } else {
        skippedColumns.push({ name: col.name, error: 'Column already exists' });
        console.log(`[Migration] ⊘ Column already exists: ${col.name}`);
      }
    }

    if (addedColumns.length > 0 || skippedColumns.every(s => s.error === 'Column already exists')) {
      await recordMigration(MIGRATION_NAME, MIGRATION_VERSION, true);

      console.log('[Migration] ===========================================');
      console.log(`[Migration] Migration completed successfully!`);
      console.log(`[Migration] Added columns: ${addedColumns.join(', ') || 'none (all existed)'}`);
      console.log('[Migration] ===========================================');

      return {
        success: true,
        message: 'Migration completed',
        addedColumns,
        skippedColumns
      };
    } else {
      const errors = skippedColumns.filter(s => s.error !== 'Column already exists');
      await recordMigration(MIGRATION_NAME, MIGRATION_VERSION, false, JSON.stringify(errors));

      throw new Error(`Failed to add columns: ${errors.map(e => e.name).join(', ')}`);
    }
  } catch (error) {
    console.error('[Migration] Migration failed:', error.message);
    await recordMigration(MIGRATION_NAME, MIGRATION_VERSION, false, error.message);
    throw error;
  }
}

export async function runMigrations() {
  try {
    const result = await runPerformanceMigration();
    return result;
  } catch (error) {
    console.error('[Migration] Performance fields migration failed:', error.message);
    return { success: false, message: error.message };
  }
}

export default { runMigrations, runPerformanceMigration };
