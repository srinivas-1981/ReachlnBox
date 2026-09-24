import { isPlaceholderOrInvalid, validateProductionConfig } from '../config/env';
import { getRedisConnectionConfig } from '../config/redis';
import { getDatabaseUrl } from '../config/db';

async function runTests() {
  console.log('Testing configuration validation...');

  const originalEnv = { ...process.env };

  function resetEnv() {
    process.env = { ...originalEnv };
  }

  if (!isPlaceholderOrInvalid('YOUR_DATABASE_URL')) throw new Error('Failed: should detect YOUR_DATABASE_URL');
  if (!isPlaceholderOrInvalid('YOUR_REDIS_URL')) throw new Error('Failed: should detect YOUR_REDIS_URL');
  if (!isPlaceholderOrInvalid('')) throw new Error('Failed: should detect empty string');
  if (isPlaceholderOrInvalid('postgresql://user:pass@render.com:5432/db')) throw new Error('Failed: valid URL marked invalid');

  resetEnv();
  process.env.NODE_ENV = 'production';
  delete process.env.DATABASE_URL;
  process.env.REDIS_URL = 'redis://default:pass@redis-host:6379';
  let threw = false;
  try {
    validateProductionConfig();
  } catch (err: any) {
    threw = true;
    if (!err.message.includes('DATABASE_URL is not configured for production')) {
      throw new Error(`Unexpected error message: ${err.message}`);
    }
  }
  if (!threw) throw new Error('Production should fail when DATABASE_URL is missing');

  resetEnv();
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'YOUR_DATABASE_URL';
  process.env.REDIS_URL = 'redis://default:pass@redis-host:6379';
  threw = false;
  try {
    validateProductionConfig();
  } catch (err: any) {
    threw = true;
    if (!err.message.includes('DATABASE_URL is not configured for production')) {
      throw new Error(`Unexpected error message: ${err.message}`);
    }
  }
  if (!threw) throw new Error('Production should fail when DATABASE_URL is a placeholder');

  resetEnv();
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'postgresql://user:secret@dpg-abc12345.render.com:5432/reachinbox_db';
  delete process.env.REDIS_URL;
  delete process.env.REDIS_HOST;
  threw = false;
  try {
    validateProductionConfig();
  } catch (err: any) {
    threw = true;
    if (!err.message.includes('REDIS_URL is not configured for production')) {
      throw new Error(`Unexpected error message: ${err.message}`);
    }
  }
  if (!threw) throw new Error('Production should fail when REDIS_URL is missing');

  resetEnv();
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'postgresql://user:secret@dpg-abc12345.render.com:5432/reachinbox_db';
  process.env.REDIS_URL = 'YOUR_REDIS_URL';
  threw = false;
  try {
    validateProductionConfig();
  } catch (err: any) {
    threw = true;
    if (!err.message.includes('REDIS_URL is not configured for production')) {
      throw new Error(`Unexpected error message: ${err.message}`);
    }
  }
  if (!threw) throw new Error('Production should fail when REDIS_URL is a placeholder');

  resetEnv();
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'postgresql://user:secret@dpg-abc12345.render.com:5432/reachinbox_db';
  process.env.REDIS_URL = 'rediss://default:mypassword@red-cu1234.render.com:6379';
  validateProductionConfig();
  const dbUrl = getDatabaseUrl();
  if (dbUrl !== 'postgresql://user:secret@dpg-abc12345.render.com:5432/reachinbox_db') {
    throw new Error(`getDatabaseUrl returned unexpected url: ${dbUrl}`);
  }
  const redisConfig = getRedisConnectionConfig();
  if (redisConfig.options.host !== 'red-cu1234.render.com') {
    throw new Error(`getRedisConnectionConfig returned wrong host: ${redisConfig.options.host}`);
  }
  if (redisConfig.options.password !== 'mypassword') {
    throw new Error('getRedisConnectionConfig failed to extract password');
  }
  if (!redisConfig.options.tls) {
    throw new Error('getRedisConnectionConfig failed to set tls for rediss://');
  }

  resetEnv();
  process.env.NODE_ENV = 'development';
  delete process.env.DATABASE_URL;
  delete process.env.REDIS_URL;
  validateProductionConfig();
  const devDb = getDatabaseUrl();
  if (!devDb.includes('localhost')) throw new Error('Development should fallback to localhost DB');
  const devRedis = getRedisConnectionConfig();
  if (devRedis.options.host !== '127.0.0.1') throw new Error('Development should fallback to 127.0.0.1 Redis');

  resetEnv();
  console.log('All configuration validation tests passed successfully.');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
