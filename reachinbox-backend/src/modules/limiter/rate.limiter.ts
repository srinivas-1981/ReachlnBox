import { redisClient } from '../../config/redis';

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  retryAfterMs?: number;
}

const RATE_LIMIT_LUA_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  local member = ARGV[4]

  local clearBefore = now - window
  -- 1. Remove timestamps older than 1 hour
  redis.call('ZREMRANGEBYSCORE', key, '-inf', clearBefore)

  -- 2. Count timestamps in current rolling hour
  local currentCount = redis.call('ZCARD', key)

  if currentCount < limit then
    -- Allowed: record current timestamp with unique member ID
    redis.call('ZADD', key, now, member)
    redis.call('PEXPIRE', key, window + 10000)
    return { 1, currentCount + 1, 0 }
  else
    -- Limit reached: find oldest member timestamp in current window
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local nextAvailableMs = 1000
    if oldest and #oldest >= 2 then
      local oldestTimestamp = tonumber(oldest[2])
      nextAvailableMs = math.max(1000, (oldestTimestamp + window) - now)
    end
    return { 0, currentCount, nextAvailableMs }
  end
`;

export class RateLimiter {
  private readonly windowMs = 60 * 60 * 1000;

  async checkRateLimit(
    userId: string,
    hourlyLimit: number,
    memberIdentifier: string
  ): Promise<RateLimitResult> {
    const key = `ratelimit:user:${userId}:hourly`;
    const now = Date.now();

    try {
      const result = (await redisClient.eval(
        RATE_LIMIT_LUA_SCRIPT,
        1,
        key,
        now.toString(),
        this.windowMs.toString(),
        hourlyLimit.toString(),
        memberIdentifier
      )) as [number, number, number];

      const allowed = result[0] === 1;
      const currentCount = result[1];
      const retryAfterMs = result[2];

      return {
        allowed,
        currentCount,
        retryAfterMs: allowed ? undefined : retryAfterMs,
      };
    } catch (error: any) {
      console.error(' Redis Rate Limiter error, failing closed to protect inbox:', error?.message || error);

      return { allowed: false, currentCount: 0, retryAfterMs: 5000 };
    }
  }

  async resetUserLimit(userId: string): Promise<void> {
    const key = `ratelimit:user:${userId}:hourly`;
    await redisClient.del(key);
  }
}

export const rateLimiter = new RateLimiter();
