export const calculatePrice = (yesShares, noShares, b = 100) => {
  const expYes = Math.exp(yesShares / b);
  const expNo = Math.exp(noShares / b);
  return expYes / (expYes + expNo);
};

export const buyShares = ({ market, type, amount }) => {
  if (type === "YES") {
    market.yesShares += amount;
  } else {
    market.noShares += amount;
  }

  const price = calculatePrice(market.yesShares, market.noShares);

  return {
    updatedMarket: market,
    price,
  };
};