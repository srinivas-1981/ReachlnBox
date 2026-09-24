import { app } from './app';
import { config } from './config/env';
import { initDb, pool } from './config/db';
import { redisClient } from './config/redis';
import { emailQueue } from './modules/queue/email.queue';
import { startEmailWorker } from './modules/queue/email.worker';
import { verifySmtpConnection } from './modules/email/smtp.client';

async function bootstrap() {
  try {
    console.log('🔄 Initializing PostgreSQL database tables and connections...');
    await initDb();
    console.log('🚀 PostgreSQL initialization complete.');

    // Verify SMTP transporter in background
    console.log('🔄 Verifying SMTP transporter...');
    verifySmtpConnection().catch((e) => console.error('SMTP verification warning:', e?.message || e));

    // Start BullMQ Worker
    console.log('🔄 Starting BullMQ email delivery worker...');
    const worker = startEmailWorker();

    const server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 ReachInbox Backend Server running on port ${config.port}`);
      console.log(`📡 Base API URL: http://localhost:${config.port}/api/v1`);
      console.log(`🔐 Google OAuth URL: http://localhost:${config.port}/api/v1/auth/google`);
      console.log(`🔄 Google Callback URI: ${config.google.redirectUri}`);
      console.log(`💻 Frontend URL: ${config.frontendUrl}`);
      console.log(`====================================================`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 ${signal} signal received: closing services gracefully...`);

      // 1. Close HTTP Server
      server.close(() => {
        console.log('✅ HTTP server closed');
      });

      try {
        // 2. Close BullMQ Worker
        console.log('🔄 Closing BullMQ worker...');
        await worker.close();
        console.log('✅ BullMQ worker closed');

        // 3. Close BullMQ Queue
        console.log('🔄 Closing BullMQ queue...');
        await emailQueue.close();
        console.log('✅ BullMQ queue closed');

        // 4. Close Redis client
        console.log('🔄 Closing Redis connection...');
        await redisClient.quit();
        console.log('✅ Redis connection closed');

        // 5. Close PostgreSQL pool
        console.log('🔄 Closing PostgreSQL pool...');
        await pool.end();
        console.log('✅ PostgreSQL pool closed');

        console.log('👋 All services shut down cleanly. Exiting.');
        process.exit(0);
      } catch (shutdownErr: any) {
        console.error('❌ Error during graceful shutdown:', shutdownErr?.message || shutdownErr);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

