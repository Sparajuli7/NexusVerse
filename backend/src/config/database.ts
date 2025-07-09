import mongoose from 'mongoose';
import { Pool } from 'pg';
import { logger } from '@/utils/logger';

// PostgreSQL connection
export const pgPool = new Pool({
  user: process.env.POSTGRES_USER || 'nexusverse',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'nexusverse',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// MongoDB connection
export const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017/nexusverse';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully');

    // Test PostgreSQL connection
    const client = await pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('PostgreSQL connected successfully');

  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const closeDatabaseConnections = async () => {
  try {
    await mongoose.connection.close();
    await pgPool.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabaseConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabaseConnections();
  process.exit(0);
}); 