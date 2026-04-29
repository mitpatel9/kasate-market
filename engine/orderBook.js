import { redis } from "../redis/redisClient.js";

//key generate for ask and bid
function getBidKey(marketId, outcomeId) {
  return `orderbook:${marketId}:${outcomeId}:bids`;
}

function getAskKey(marketId, outcomeId) {
  return `orderbook:${marketId}:${outcomeId}:asks`;
}

// Add Order
export async function addOrder(order) {
  const { orderId, price, side, marketId, outcomeId } = order;

  const sequence = await redis.incr("global:seq");
  //const score = order.price * 1e8 + timestamp;

  // generate ask and bid key
  const bidKey = getBidKey(marketId, outcomeId);
  const askKey = getAskKey(marketId, outcomeId);

  // Store full order
  await redis.hset(`order:${orderId}`, {
    ...order,
  });

  // Add to orderbook
  if (side === "buy") {
    // Negative price for max heap behavior
    // BUY (bids → highest first, FIFO)
    const score = -(price * 1e8) + sequence;
    await redis.zadd(bidKey,  score,  orderId );
  } else {
    // SELL (asks → lowest first, FIFO)
    const score = price * 1e8 + sequence;
    await redis.zadd(askKey, score,  orderId );
  }
  console.log("order create....")
}

// Get Best Bid (zrange(key, start, stop)
export async function getBestBid(marketId, outcomeId) {
  const bidKey = getBidKey(marketId, outcomeId);
  const res = await redis.zrange(bidKey, 0, 0);
  return res.length ? res[0] : null;
}

// Get Best Ask
export async function getBestAsk(marketId, outcomeId) {
  const askKey = getAskKey(marketId, outcomeId);
  const res = await redis.zrange(askKey, 0, 0);
  return res.length ? res[0] : null;
}

// Remove order
export async function removeOrder(orderId, side, marketId, outcomeId) {
  const bidKey = getBidKey(marketId, outcomeId);
  const askKey = getAskKey(marketId, outcomeId);
  if (side === "buy") {
    await redis.zrem(bidKey, orderId);
  } else {
    await redis.zrem(askKey, orderId);
  }

  await redis.del(`order:${orderId}`);
}
