import Redis, { RedisOptions } from 'ioredis';
import { config, isPlaceholderOrInvalid } from './env';

export interface RedisConnectionConfig {
  url?: string;
  options: RedisOptions;
}

export function getRedisConnectionConfig(): RedisConnectionConfig {
  const isProduction = (process.env.NODE_ENV || 'development') === 'production';
  const redisUrl = process.env.REDIS_URL?.trim();

  if (redisUrl) {
    if (isPlaceholderOrInvalid(redisUrl)) {
      if (isProduction) {
        throw new Error('REDIS_URL is not configured for production. Please configure REDIS_URL in your Render environment variables.');
      }
    } else {
      try {
        const parsed = new URL(redisUrl);
        if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
          throw new Error('Protocol must be redis: or rediss:');
        }
        const isTls = parsed.protocol === 'rediss:';
        return {
          url: redisUrl,
          options: {
            host: parsed.hostname,
            port: parseInt(parsed.port || (isTls ? '6380' : '6379'), 10),
            username: parsed.username || undefined,
            password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
            tls: isTls ? { rejectUnauthorized: false } : undefined,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          },
        };
      } catch (err: any) {
        if (isProduction) {
          throw new Error(`REDIS_URL is invalid: "${redisUrl}". Expected a valid Redis connection string starting with redis:// or rediss://.`);
        }
      }
    }
  }

  const redisHost = process.env.REDIS_HOST?.trim();
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

  if (isProduction) {
    if (!redisHost || isPlaceholderOrInvalid(redisHost) || redisHost === '127.0.0.1' || redisHost === 'localhost') {
      throw new Error('REDIS_URL is not configured for production. Please configure REDIS_URL in your Render environment variables.');
    }
    return {
      url: undefined,
      options: {
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      },
    };
  }

  return {
    url: undefined,
    options: {
      host: redisHost || config.redis.host || '127.0.0.1',
      port: redisPort || config.redis.port || 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    },
  };
}

const resolvedRedis = getRedisConnectionConfig();

export const redisConnectionOptions: any = resolvedRedis.options;

export const redisClient = resolvedRedis.url
  ? new Redis(resolvedRedis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...(resolvedRedis.url.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {}),
    })
  : new Redis(resolvedRedis.options);

redisClient.on('connect', () => {
  console.log(`Connected to Redis at ${redisConnectionOptions.host}:${redisConnectionOptions.port}`);
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err?.message || err);
});
