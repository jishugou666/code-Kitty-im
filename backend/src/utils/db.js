import mysql from 'mysql2/promise';
import config from '../config/index.js';

let pool = null;

export async function getPool() {
  if (!pool) {
    pool = mysql.createPool(config.db);
  }
  return pool;
}

export async function query(sql, params = []) {
  const pool = await getPool();
  const [results] = await pool.execute(sql, params);
  return results;
}

export async function getConnection() {
  const pool = await getPool();
  return pool.getConnection();
}

export async function testConnection() {
  try {
    const pool = await getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
