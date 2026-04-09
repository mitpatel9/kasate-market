const { createClient } = require('redis');

let client;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // ms

/**
 * Establishes connection to Redis server
 * Uses environment variable REDIS_URL for connection
 * @example
 * const redis = await getRedis();
 * await redis.set('key', 'value');
 */

async function getRedis() {
    if (!client) {
        // Validate Redis URL is configured
        if (!process.env.REDIS_URL) {
            throw new Error(
                'REDIS_URL environment variable not configured. ' +
                'Add to .env.local: REDIS_URL=redis://localhost:6379'
            );
        }

        try {
            // Initialize Redis client
            client = createClient({
                url: process.env.REDIS_URL,
                // TODO: Add socket timeout configuration
                // socket: { reconnectStrategy: (retries) => retries * 100 }
            });

            // ✅ Error event handler
            client.on('error', (err) => {
                console.error('[Redis Error]:', err.message);
                // TODO: Implement error tracking/alerting (Sentry, DataDog, etc.)
            });

            // TODO: Add these event handlers
            // client.on('connect', () => console.log('[Redis] Connected'));
            // client.on('reconnecting', () => console.log('[Redis] Reconnecting...'));
            // client.on('ready', () => console.log('[Redis] Ready'));

            // ✅ Establish connection
            await client.connect();
            connectionAttempts = 0;
            console.log('[Redis] Successfully connected');

        } catch (error) {
            connectionAttempts++;
            console.error(`[Redis] Connection failed (attempt ${connectionAttempts}):`, error.message);

            // TODO: Implement exponential backoff retry with MAX_RECONNECT_ATTEMPTS
            if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
                console.log(`[Redis] Retrying in ${RECONNECT_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
                client = null; // Reset for retry
                return getRedis(); // Recursive retry
            }

            throw new Error(`Redis connection failed after ${MAX_RECONNECT_ATTEMPTS} attempts: ${error.message}`);
        }
    }

    return client;
}

/**
 * Health check for Redis connection
 * 
 * @async
 * @returns {Promise<boolean>} True if Redis is responsive, false otherwise
 * 
 * TODO: Implement PING command for health verification
 * 
 * @example
 * if (await isRedisHealthy()) {
 *   // Safe to use Redis
 * }
 */
async function isRedisHealthy() {
    try {
        // TODO: Implement PING command
        // const redis = await getRedis();
        // await redis.ping();
        // return true;
        return !!client;
    } catch (error) {
        console.error('[Redis Health Check] Failed:', error.message);
        return false;
    }
}

/**
 * Gracefully disconnect from Redis
 * Call this during application shutdown
 * 
 * @async
 * @returns {Promise<void>}
 * 
 * TODO: Ensure all pending operations are flushed before disconnect
 * 
 * @example
 * // In server shutdown handler
 * await disconnectRedis();
 */
async function disconnectRedis() {
    if (client) {
        try {
            await client.quit();
            client = null;
            console.log('[Redis] Disconnected successfully');
        } catch (error) {
            console.error('[Redis] Error during disconnect:', error.message);
            // Force close if graceful shutdown fails
            if (client) {
                client.disconnect();
                client = null;
            }
        }
    }
}

module.exports = {
    getRedis,
    isRedisHealthy,
    disconnectRedis
};