import { redis } from "../redis/redisClient.js";
import { add_order } from "../models/orderModel.js";
import { addOrder, getBestBid, getBestAsk, removeOrder } from "./orderBook.js";
import {
  buyerPosition,
  sellerPosition,
  updateUserPosition,
} from "../controllers/positionController.js";

//matching Id Generator
function matchIdGenerator(marketId, outcomeId, userId) {
  return `matchId:${marketId}:${outcomeId}:${userId}`;
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
  let safety = 0;

  while (order.quantity > 0 && safety < 1000) {
    safety++;

    //if not match best ask then break operation
    const bestAskId = await getBestAsk(order.marketId, order.outcomeId);
    console.log("bestASkId buy", bestAskId);
    if (!bestAskId) break;

    const key = `order:${bestAskId}`;
    await redis.watch(key);

    const bestAsk = await redis.hgetall(key);
    console.log("bestAsk  buy", bestAsk);
    if (!bestAsk || !bestAsk.orderId) {
      await redis.unwatch();
      continue;
    }

    const askPrice = Number(bestAsk.price);
    const askQty = Number(bestAsk.quantity);
    console.log("askPrice   askQty  buy", askPrice, askQty);
    if (order.price < askPrice) {
      await redis.unwatch();
      break;
    }

    const tradeQty = Math.min(order.quantity, askQty);
    console.log("tradeQty  buy", tradeQty);
    const multi = redis.multi();

    await createTrade(order, bestAsk, tradeQty, askPrice);

    order.quantity -= tradeQty;
    const remaining = askQty - tradeQty;

    console.log(remaining, "remaining  buy");

    if (remaining <= 0) {
      multi.del(key);
      multi.zrem(
        `orderbook:${order.marketId}:${order.outcomeId}:asks`,
        bestAskId,
      );
    } else {
      multi.hset(key, {
        ...bestAsk,
        quantity: remaining,
      });
    }

    const res = await multi.exec();
    if (!res) continue;
  }

  if (order.quantity > 0) {
    await addOrder(order); // Redis
    // okay await add_order({ ...order, status: "OPEN" }); // MongoDB
  }
}

// SELL ORDER MATCHING
async function matchSellOrder(order) {
  let safety = 0;

  while (order.quantity > 0 && safety < 1000) {
    safety++;

    const bestBidId = await getBestBid(order.marketId, order.outcomeId);
    if (!bestBidId) break;

    const key = `order:${bestBidId}`;

    await redis.watch(key);
    const bestBid = await redis.hgetall(key);

    if (!bestBid || !bestBid.orderId) {
      await redis.unwatch();
      continue;
    }

    const bidPrice = Number(bestBid.price);
    const bidQty = Number(bestBid.quantity);

    if (order.price > bidPrice) {
      await redis.unwatch();
      break;
    }

    const tradeQty = Math.min(order.quantity, bidQty);

    const multi = redis.multi();

    await createTrade(order, bestBid, tradeQty, bidPrice);

    order.quantity -= tradeQty;
    const remaining = bidQty - tradeQty;
    console.log(remaining, "remaining");
    if (remaining <= 0) {
      multi.del(key);
      multi.zrem(
        `orderbook:${order.marketId}:${order.outcomeId}:bids`,
        bestBidId,
      );
    } else {
      multi.hset(key, {
        ...bestBid,
        quantity: remaining,
      });
    }

    const res = await multi.exec();
    if (!res) continue;
  }

  if (order.quantity > 0) {
    await addOrder(order);
  }
}

// Execute trade
async function createTrade(order, askBid, quantity, price) {
  //match Id generate
  const matchId = matchIdGenerator(
    order?.marketId,
    order?.outcomeId,
    order?.userId,
  );

  //trade create
  const trade = {
    marketId: order?.marketId,
    outcomeId: order?.outcomeId,
    matchId: matchId,
    buyOrderId: order.side === "buy" ? order.orderId : askBid.orderId,
    sellOrderId: order.side === "sell" ? order.orderId : askBid.orderId,
    buyerId: order.side === "buy" ? order.userId : askBid.userId,
    sellerId: order.side === "sell" ? order.userId : askBid.userId,
    price: Number(price),
    quantity: quantity,
    takerSide: order.side, // incoming order
    MakerSide: askBid.side, // existing order in book
    executionType: order.order_type,
    status: "Executed",
  };
  // add mongodb database

  // create position
  await updatePositions(trade, order);
  // add ni redis
  await redis.lpush("trades", JSON.stringify(trade));
}

//position
export const updatePositions = async (trade, takerOrder) => {
  const { price, quantity } = trade;
  // outcome side (YES / NO)
  const order_type = takerOrder.outcome;
  console.log("taker order type", order_type);

  //  buyer position find
  let buyerPos = await buyerPosition(trade);

  if (order_type === "yes") {
    const totalCost =
      buyerPos.yesShares * buyerPos.yesAvgPrice + quantity * price;
    console.log("totalCost", totalCost, quantity, price);
    buyerPos.yesShares += quantity;
    buyerPos.yesAvgPrice = totalCost / buyerPos.yesShares;
  } else {
    const totalCost =
      buyerPos.noShares * buyerPos.noAvgPrice + quantity * (100 - price);

    buyerPos.noShares += quantity;
    buyerPos.noAvgPrice = totalCost / buyerPos.noShares;
  }

  // update buyer position
  await updateUserPosition(buyerPos._id, buyerPos);

  let sellerPos = await sellerPosition(trade);

  if (order_type === "yes") {
    // Seller is giving YES → reducing YES OR creating NO

    if (sellerPos.yesShares >= quantity) {
      // Closing YES position → realized PnL
      const pnl = (price - sellerPos.yesAvgPrice) * quantity;

      sellerPos.yesShares -= quantity;
      sellerPos.realizedPnl += pnl;
    } else {
      // Short YES → becomes NO
      const remaining = quantity - sellerPos.yesShares;

      sellerPos.yesShares = 0;

      const totalCost =
        sellerPos.noShares * sellerPos.noAvgPrice + remaining * (100 - price);

      sellerPos.noShares += remaining;
      sellerPos.noAvgPrice = totalCost / sellerPos.noShares;
    }
  } else {
    // Seller selling NO

    if (sellerPos.noShares >= quantity) {
      const pnl = (100 - price - sellerPos.noAvgPrice) * quantity;

      sellerPos.noShares -= quantity;
      sellerPos.realizedPnl += pnl;
    } else {
      const remaining = quantity - sellerPos.noShares;

      sellerPos.noShares = 0;

      const totalCost =
        sellerPos.yesShares * sellerPos.yesAvgPrice + remaining * price;

      sellerPos.yesShares += remaining;
      sellerPos.yesAvgPrice = totalCost / sellerPos.yesShares;
    }
  }

  // update seller position
  await updateUserPosition(sellerPos._id, sellerPos);
};

//other info
// position and trade update,
//Lua scripts
