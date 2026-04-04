import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'im_chat',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },
  pusher: {
    appId: process.env.PUSHER_APP_ID || '2136881',
    key: process.env.PUSHER_KEY || 'c83b4566e58d78c1dd50',
    secret: process.env.PUSHER_SECRET || 'ed4de7ef1448ce39c28e',
    cluster: process.env.PUSHER_CLUSTER || 'ap1',
    encrypted: process.env.PUSHER_ENCRYPTED !== 'false'
  }
};
