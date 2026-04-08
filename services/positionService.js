const Position = require("../models/position");

async function updatePosition(orderA, orderB, qty, price) {
  const buyer = orderA.side === "buy" ? orderA : orderB;
  const seller = orderA.side === "sell" ? orderA : orderB;

  // BUYER
  let buyerPos = await Position.findOne({
    user: buyer.userId,
    market: buyer.marketId,
  });

  if (!buyerPos) {
    buyerPos = await Position.create({
      user: buyer.userId,
      market: buyer.marketId,
    });
  }

  if (buyer.outcome === "yes") {
    const totalCost =
      buyerPos.yesAvgPrice * buyerPos.yesShares + price * qty;

    buyerPos.yesShares += qty;
    buyerPos.yesAvgPrice = totalCost / buyerPos.yesShares;
  } else {
    const totalCost =
      buyerPos.noAvgPrice * buyerPos.noShares + price * qty;

    buyerPos.noShares += qty;
    buyerPos.noAvgPrice = totalCost / buyerPos.noShares;
  }

  await buyerPos.save();

  // SELLER (reduce shares)
  let sellerPos = await Position.findOne({
    user: seller.userId,
    market: seller.marketId,
  });

  if (sellerPos) {
    if (seller.outcome === "yes") {
      sellerPos.yesShares -= qty;
    } else {
      sellerPos.noShares -= qty;
    }
    await sellerPos.save();
  }
}

module.exports = { updatePosition };