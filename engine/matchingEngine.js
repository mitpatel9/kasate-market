const mongoose = require("mongoose");

const { getBook, addOrderToBook } = require("./orderBook");
const { createTrade } = require("../services/tradeService");
const { updatePosition } = require("../services/positionService");
const { settleTrade } = require("../services/walletService");

async function matchOrder(incomingOrder) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const book = getBook(
        incomingOrder.marketId,
        incomingOrder.outcomeId
      );

      const isBuy = incomingOrder.side === "buy";
      const oppositeOrders = isBuy ? book.asks : book.bids;

      while (incomingOrder.filledQty < incomingOrder.quantity) {
        if (oppositeOrders.length === 0) break;

        const bestMatch = oppositeOrders[0];

        if (incomingOrder.order_type === "limit") {
          if (isBuy && incomingOrder.price < bestMatch.price) break;
          if (!isBuy && incomingOrder.price > bestMatch.price) break;
        }

        const remainingIncoming =
          incomingOrder.quantity - incomingOrder.filledQty;

        const remainingMatch =
          bestMatch.quantity - bestMatch.filledQty;

        const tradeQty = Math.min(remainingIncoming, remainingMatch);
        const tradePrice = bestMatch.price;
        const totalCost = tradeQty * tradePrice;

        //  SETTLE WALLET
        await settleTrade(
          isBuy ? incomingOrder.userId : bestMatch.userId,
          isBuy ? bestMatch.userId : incomingOrder.userId,
          totalCost,
          session
        );

        //  TRADE
        await createTrade({
          buyOrderId: isBuy ? incomingOrder._id : bestMatch._id,
          sellOrderId: isBuy ? bestMatch._id : incomingOrder._id,
          buyerId: isBuy ? incomingOrder.userId : bestMatch.userId,
          sellerId: isBuy ? bestMatch.userId : incomingOrder.userId,
          marketId: incomingOrder.marketId,
          outcomeId: incomingOrder.outcomeId,
          price: tradePrice,
          quantity: tradeQty,
          takerSide: incomingOrder.side,
        });

        // POSITION
        await updatePosition(
          incomingOrder,
          bestMatch,
          tradeQty,
          tradePrice,
          session
        );

        incomingOrder.filledQty += tradeQty;
        bestMatch.filledQty += tradeQty;

        if (bestMatch.filledQty === bestMatch.quantity) {
          bestMatch.status = "FILLED";
          oppositeOrders.shift();
        }
      }

      if (incomingOrder.filledQty < incomingOrder.quantity) {
        addOrderToBook(incomingOrder);
      }
    });
  } finally {
    session.endSession();
  }

  return incomingOrder;
}

module.exports = { matchOrder };