import { redis } from "../redis/redisClient.js";
import {
  addOrder,
  getBestBid,
  getBestAsk,
  removeOrder,
} from "./orderbook.js";

// Execute trade
async function createTrade(buyOrder, sellOrder, quantity, price) {
  const trade = {
    buyOrderId: buyOrder.id,
    sellOrderId: sellOrder.id,
    price,
    quantity,
    timestamp: Date.now(),
  };

  await redis.lpush("trades", JSON.stringify(trade));

  console.log("TRADE EXECUTED:", trade);
}

// Matching logic
export async function processOrder(order) {
  if (order.side === "buy") {
    await matchBuyOrder(order);
  } else {
    await matchSellOrder(order);
  }
}

// BUY ORDER MATCHING
async function matchBuyOrder(order) {
  while (order.quantity > 0) {
    const bestAskId = await getBestAsk();
    if (!bestAskId) break;

    const bestAsk = await redis.hgetall(`order:${bestAskId}`);

    if (order.price < Number(bestAsk.price)) break;

    const tradeQty = Math.min(order.quantity, bestAsk.quantity);

    await createTrade(order, bestAsk, tradeQty, bestAsk.price);

    order.quantity -= tradeQty;
    bestAsk.quantity -= tradeQty;

    if (bestAsk.quantity <= 0) {
      await removeOrder(bestAsk.id, "sell");
    } else {
      await redis.hset(`order:${bestAsk.id}`, bestAsk);
    }
  }

  if (order.quantity > 0) {
    await addOrder(order);
  }
}

// SELL ORDER MATCHING
async function matchSellOrder(order) {
  while (order.quantity > 0) {
    const bestBidId = await getBestBid();
    if (!bestBidId) break;

    const bestBid = await redis.hgetall(`order:${bestBidId}`);

    if (order.price > Number(bestBid.price)) break;

    const tradeQty = Math.min(order.quantity, bestBid.quantity);

    await createTrade(bestBid, order, tradeQty, bestBid.price);

    order.quantity -= tradeQty;
    bestBid.quantity -= tradeQty;

    if (bestBid.quantity <= 0) {
      await removeOrder(bestBid.id, "buy");
    } else {
      await redis.hset(`order:${bestBid.id}`, bestBid);
    }
  }

  if (order.quantity > 0) {
    await addOrder(order);
  }
}