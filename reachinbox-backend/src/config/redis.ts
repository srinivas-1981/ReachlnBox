import Redis, { RedisOptions } from 'ioredis';
import { config } from './env';

function getRedisOptions(): RedisOptions {
  if (process.env.REDIS_URL) {
    try {
      const parsed = new URL(process.env.REDIS_URL);
      const isTls = parsed.protocol === 'rediss:';
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || (isTls ? '6380' : '6379'), 10),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      };
    } catch {
      return {
        host: config.redis.host,
        port: config.redis.port,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      };
    }
  }

  return {
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

export const redisConnectionOptions: any = getRedisOptions();

export const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...(process.env.REDIS_URL.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {}),
    })
  : new Redis(redisConnectionOptions);

redisClient.on('connect', () => {
  console.log(`Connected to Redis at ${redisConnectionOptions.host}:${redisConnectionOptions.port}`);
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err?.message || err);
});
