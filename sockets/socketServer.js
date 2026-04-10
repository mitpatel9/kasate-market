const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io;
const connectedUsers = new Map(); // userId -> { socketId, rooms }
const marketPrices = new Map(); // marketId -> { bid, ask, last, timestamp }

/**
 * Initialize Socket.IO with connection handlers
 * @param {http.Server} server - Express/Next.js server
 */
function init(server) {
  io = new Server(server, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    logger.info(`[Socket] User connected: ${socket.id}`);

    // User subscribes to market
    socket.on("joinMarket", (data) => {
      const { marketId, userId } = data || {};

      if (!marketId) {
        socket.emit("error", { message: "marketId is required" });
        return;
      }

      socket.join(marketId);
      logger.info(`[Socket] User ${userId || "guest"} joined market ${marketId}`);

      // Track user connection
      if (userId) {
        if (!connectedUsers.has(userId)) {
          connectedUsers.set(userId, {
            socketId: socket.id,
            rooms: new Set(),
          });
        }
        connectedUsers.get(userId).rooms.add(marketId);
      }

      // Send current market price immediately
      const price = marketPrices.get(marketId);
      if (price) {
        socket.emit("price:current", price);
      }

      // Notify market subscribers
      socket.emit("market:joined", {
        marketId,
        timestamp: new Date(),
      });
    });

    // User leaves market
    socket.on("leaveMarket", (data) => {
      const { marketId, userId } = data || {};
      socket.leave(marketId);
      logger.info(`[Socket] User ${userId || "guest"} left market ${marketId}`);

      if (userId && connectedUsers.has(userId)) {
        connectedUsers.get(userId).rooms.delete(marketId);
      }
    });

    // User disconnects
    socket.on("disconnect", () => {
      // Anonymous cleanup (socketId-based)
      for (const [userId, userData] of connectedUsers.entries()) {
        if (userData.socketId === socket.id) {
          connectedUsers.delete(userId);
          logger.info(`[Socket] User ${userId} disconnected`);
          break;
        }
      }
      logger.info(`[Socket] User disconnected: ${socket.id}`);
    });

    // Heartbeat/ping for connection health
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date() });
    });
  });

  return io;
}

// Get IO instance

function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call init() first.");
  }
  return io;
}


// Emit real-time price update to market subscribers

function emitPrice(marketId, priceData) {
  if (!io) return;

  const enrichedData = {
    marketId,
    bid: priceData.bid,
    ask: priceData.ask,
    last: priceData.last || (priceData.bid + priceData.ask) / 2,
    spread: priceData.ask - priceData.bid,
    volume: priceData.volume || 0,
    timestamp: new Date(),
  };

  // Store latest price
  marketPrices.set(marketId, enrichedData);

  // Broadcast to all subscribers
  io.to(marketId).emit("price:update", enrichedData);
  logger.debug(`[Socket] Price update sent for market ${marketId}`);
}

// Emit order book snapshot to market subscribers

function emitOrderBook(marketId, data) {
  if (!io) return;

  const orderBookData = {
    marketId,
    bids: (data.bids || []).slice(0, 20), // Top 20 bids
    asks: (data.asks || []).slice(0, 20), // Top 20 asks
    timestamp: new Date(),
    depth: data.depth || 20,
  };

  io.to(marketId).emit("orderbook:update", orderBookData);
  logger.debug(`[Socket] Order book update sent for market ${marketId}`);
}


// Emit new trade to market subscribers

function emitTrade(marketId, trade) {
  if (!io) return;

  const tradeData = {
    marketId,
    price: trade.price,
    quantity: trade.quantity,
    side: trade.side || "buy",
    buyOrderId: trade.buyOrderId,
    sellOrderId: trade.sellOrderId,
    timestamp: trade.timestamp || new Date(),
    takerSide: trade.takerSide,
  };

  io.to(marketId).emit("trade:new", tradeData);
  logger.info(`[Socket] Trade executed on market ${marketId}: ${trade.quantity} @ ${trade.price}`);
}

// Emit position update to user

function emitPosition(userId, position) {
  if (!io) return;

  const userData = connectedUsers.get(userId);
  if (!userData) {
    logger.warn(`[Socket] User ${userId} not connected`);
    return;
  }

  const positionData = {
    userId,
    marketId: position.marketId,
    yesShares: position.yesShares,
    noShares: position.noShares,
    avgBuyPrice: position.avgBuyPrice,
    avgSellPrice: position.avgSellPrice,
    unrealizedPnL: position.unrealizedPnL,
    realizedPnL: position.realizedPnL,
    timestamp: new Date(),
  };

  io.to(userData.socketId).emit("position:update", positionData);
  logger.debug(`[Socket] Position update sent to user ${userId}`);
}

// Emit order fill notification to user

function emitOrderFill(userId, order, execution) {
  if (!io) return;

  const userData = connectedUsers.get(userId);
  if (!userData) return;

  const fillData = {
    orderId: order._id,
    marketId: order.marketId,
    side: order.side,
    filledQuantity: execution.filledQty,
    filledPrice: execution.filledPrice,
    remainingQuantity: execution.remaining,
    status: execution.remaining > 0 ? "PARTIALLY_FILLED" : "FILLED",
    timestamp: new Date(),
  };

  io.to(userData.socketId).emit("order:filled", fillData);
  logger.info(`[Socket] Order fill notification sent to user ${userId}`);
}

// Emit market data snapshot to all subscribers

function emitMarketSnapshot(marketId, snapshot) {
  if (!io) return;

  io.to(marketId).emit("market:snapshot", {
    marketId,
    price: snapshot.price,
    orderBook: snapshot.orderBook,
    lastTrades: snapshot.lastTrades || [],
    volume24h: snapshot.volume24h,
    openInterest: snapshot.openInterest,
    timestamp: new Date(),
  });

  logger.debug(`[Socket] Market snapshot sent for ${marketId}`);
}

// Broadcast to all connected users (admin/system messages)

function broadcastSystem(data) {
  if (!io) return;

  io.emit("system:message", {
    ...data,
    timestamp: new Date(),
  });

  logger.info(`[Socket] System broadcast sent`);
}


// Get connected user count

function getConnectedUsers() {
  return connectedUsers.size;
}

// Get market subscribers count

function getMarketSubscribers(marketId) {
  if (!io) return 0;
  return io.to(marketId).socketsSize || 0;
}

module.exports = {
  init,
  getIO,
  emitPrice,
  emitOrderBook,
  emitTrade,
  emitPosition,
  emitOrderFill,
  emitMarketSnapshot,
  broadcastSystem,
  getConnectedUsers,
  getMarketSubscribers,
};