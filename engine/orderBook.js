import { redis } from "../redis/redisClient.js";

// Keys
const BID_KEY = "orderbook:bids";
const ASK_KEY = "orderbook:asks";

// Add Order
export async function addOrder(order) {
  const { id, price, quantity, side } = order;

  // Store full order
  await redis.hset(`order:${id}`, {
    ...order,
  });

  // Add to orderbook
  if (side === "buy") {
    // Negative price for max heap behavior
    await redis.zadd(BID_KEY, {
      score: -price,
      member: id,
    });
  } else {
    await redis.zadd(ASK_KEY, {
      score: price,
      member: id,
    });
  }
}

// Get Best Bid
export async function getBestBid() {
  const res = await redis.zrange(BID_KEY, 0, 0);
  return res[0];
}

// Get Best Ask
export async function getBestAsk() {
  const res = await redis.zrange(ASK_KEY, 0, 0);
  return res[0];
}

// Remove order
export async function removeOrder(id, side) {
  if (side === "buy") {
    await redis.zrem(BID_KEY, id);
  } else {
    await redis.zrem(ASK_KEY, id);
  }

  await redis.del(`order:${id}`);
}