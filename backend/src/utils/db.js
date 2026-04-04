import mysql from 'mysql2/promise';
import config from '../config/index.js';

let pool = null;

export async function getPool() {
  if (!pool) {
    const poolConfig = { ...config.db };
    
    const isProduction = process.env.NODE_ENV === 'production';
    const sslMode = process.env.DB_SSL_MODE;
    const enableSSL = sslMode === 'required' || sslMode === 'true' || isProduction;
    
    if (enableSSL) {
      console.log('启用数据库 SSL/TLS 加密连接');
      poolConfig.ssl = {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      };
    } else {
      console.log('使用非加密数据库连接（仅用于本地开发）');
    }
    
    pool = mysql.createPool(poolConfig);
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
