const books = new Map();

function getKey(marketId, outcomeId) {
  return `${marketId}_${outcomeId}`;
}

function getBook(marketId, outcomeId) {
  const key = getKey(marketId, outcomeId);

  if (!books.has(key)) {
    books.set(key, {
      bids: [],
      asks: [],
    });
  }

  return books.get(key);
}

function sortBids(bids) {
  return bids.sort((a, b) => {
    if (b.price === a.price) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return b.price - a.price;
  });
}

function sortAsks(asks) {
  return asks.sort((a, b) => {
    if (a.price === b.price) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return a.price - b.price;
  });
}

function addOrderToBook(order) {
  const book = getBook(order.marketId, order.outcomeId);

  if (order.side === "buy") {
    book.bids.push(order);
    sortBids(book.bids);
  } else {
    book.asks.push(order);
    sortAsks(book.asks);
  }
}

function removeOrderFromBook(order) {
  const book = getBook(order.marketId, order.outcomeId);

  const list = order.side === "buy" ? book.bids : book.asks;

  const index = list.findIndex(
    (o) => o._id.toString() === order._id.toString()
  );

  if (index !== -1) list.splice(index, 1);
}

module.exports = {
  getBook,
  addOrderToBook,
  removeOrderFromBook,
};