import Redis, { RedisOptions } from 'ioredis';
import { config } from './env';

/**
 * Shared Redis connection options for BullMQ.
 */
export const redisConnectionOptions = {
  host: config.redis.host,
  port: config.redis.port,
};

/**
 * Shared IORedis client for rate limiting and utility operations.
 */
export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('connect', () => {
  console.log(`🔌 Connected to Redis at ${config.redis.host}:${config.redis.port}`);
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err?.message || err);
});
