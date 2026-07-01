import { AppConfig } from '@procurement/types';

const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://procureflow:procureflow@localhost:5432/procureflow',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-change-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  uploadsDir: process.env.UPLOADS_DIR || './uploads',
  encryptionKey: process.env.ENCRYPTION_KEY || 'dev_encryption_key_change_in_production_32b',
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    from: process.env.SENDGRID_FROM || 'noreply@procureflow.com',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@procureflow.com',
    password: process.env.ADMIN_PASSWORD || 'changeme123',
  },
};

export default config;
