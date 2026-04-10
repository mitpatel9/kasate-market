/**
 * Market Socket Handler - Real-time price and trade updates
 * Integrates with order book and matching engine
 */

const socketServer = require("./socketServer");
const logger = require("../utils/logger");

// Cache for market prices and data
const marketCache = new Map();

// Calculate current bid/ask prices from order book

function calculatePrices(orderBook) {
    const bids = orderBook.bids || [];
    const asks = orderBook.asks || [];

    const bid = bids.length > 0 ? bids[0].price : 0;
    const ask = asks.length > 0 ? asks[0].price : 1;

    return {
        bid: Math.max(bid, 0), // Ensure non-negative
        ask: Math.min(ask, 1), // Binary market: max price = 1
        spread: Math.min(ask, 1) - Math.max(bid, 0),
    };
}


// Calculate market volume from order book

function calculateVolume(orderBook) {
    const bids = orderBook.bids || [];
    const asks = orderBook.asks || [];

    const bidVolume = bids.reduce((sum, order) => sum + (order.quantity || 0), 0);
    const askVolume = asks.reduce((sum, order) => sum + (order.quantity || 0), 0);

    return bidVolume + askVolume;
}


// Update prices when order book changes
// Called by matching engine after order book update

function onOrderBookUpdate(marketId, orderBook, options = {}) {
    try {
        const prices = calculatePrices(orderBook);
        const volume = calculateVolume(orderBook);

        // Get or create market cache
        if (!marketCache.has(marketId)) {
            marketCache.set(marketId, {
                priceHistory: [],
                trades: [],
            });
        }

        const cache = marketCache.get(marketId);

        // Store price history (last 100)
        cache.priceHistory.push({
            ...prices,
            timestamp: new Date(),
        });
        if (cache.priceHistory.length > 100) {
            cache.priceHistory.shift();
        }

        // Emit real-time price update
        socketServer.emitPrice(marketId, {
            bid: prices.bid,
            ask: prices.ask,
            last: options.lastTrade?.price || (prices.bid + prices.ask) / 2,
            volume,
            spread: prices.spread,
        });

        // Emit order book snapshot
        socketServer.emitOrderBook(marketId, orderBook);

        logger.debug(`[MarketSocket] Order book updated for market ${marketId}`);
    } catch (error) {
        logger.error(`[MarketSocket] Error updating order book: ${error.message}`);
    }
}


// Handle trade execution
// Emits trade event and updates prices

function onTradeExecuted(marketId, trade, orderBook) {
    try {
        // Store trade in cache (last 50)
        if (!marketCache.has(marketId)) {
            marketCache.set(marketId, {
                priceHistory: [],
                trades: [],
            });
        }

        const cache = marketCache.get(marketId);
        cache.trades.push({
            ...trade,
            timestamp: new Date(),
        });

        if (cache.trades.length > 50) {
            cache.trades.shift();
        }

        // Emit trade event with full details
        socketServer.emitTrade(marketId, {
            price: trade.price,
            quantity: trade.quantity,
            side: trade.takerSide,
            buyOrderId: trade.buyOrderId,
            sellOrderId: trade.sellOrderId,
            takerSide: trade.takerSide,
            timestamp: new Date(),
        });

        // Update market prices (last price = trade price)
        const prices = calculatePrices(orderBook);
        socketServer.emitPrice(marketId, {
            bid: prices.bid,
            ask: prices.ask,
            last: trade.price,
            volume: calculateVolume(orderBook),
        });

        logger.info(`[MarketSocket] Trade executed on market ${marketId}: ${trade.quantity} @ ${trade.price}`);
    } catch (error) {
        logger.error(`[MarketSocket] Error handling trade: ${error.message}`);
    }
}


// Emit position update to user
// Called when user's position changes

function onPositionUpdate(userId, marketId, position, currentPrices = {}) {
    try {
        // Calculate unrealized PnL
        const mid = (currentPrices.bid + currentPrices.ask) / 2 || 0.5;
        const yesUnrealized = position.yesShares * (mid - position.avgYesPrice) || 0;
        const noUnrealized = position.noShares * ((1 - mid) - (1 - position.avgNoPrice)) || 0;

        socketServer.emitPosition(userId, {
            marketId,
            yesShares: position.yesShares || 0,
            noShares: position.noShares || 0,
            avgBuyPrice: position.avgBuyPrice,
            avgSellPrice: position.avgSellPrice,
            unrealizedPnL: yesUnrealized + noUnrealized,
            realizedPnL: position.realizedPnL || 0,
            lastUpdate: new Date(),
        });

        logger.debug(`[MarketSocket] Position update sent to user ${userId}`);
    } catch (error) {
        logger.error(`[MarketSocket] Error emitting position: ${error.message}`);
    }
}


// Emit order fill to user
// Called when user's order is partially or fully filled

function onOrderFilled(userId, order, execution) {
    try {
        socketServer.emitOrderFill(userId, order, {
            filledQty: execution.filledQty,
            filledPrice: execution.filledPrice,
            remaining: execution.remaining,
        });

        logger.info(`[MarketSocket] Order fill sent to user ${userId}`);
    } catch (error) {
        logger.error(`[MarketSocket] Error emitting order fill: ${error.message}`);
    }
}

// Get price history for a market

function getPriceHistory(marketId, limit = 50) {
    const cache = marketCache.get(marketId);
    if (!cache || !cache.priceHistory) return [];

    return cache.priceHistory.slice(-limit);
}


// Get recent trades for a market

function getRecentTrades(marketId, limit = 20) {
    const cache = marketCache.get(marketId);
    if (!cache || !cache.trades) return [];

    return cache.trades.slice(-limit);
}

// Clear market cache (on market close or reset)

function clearMarketCache(marketId) {
    marketCache.delete(marketId);
    logger.debug(`[MarketSocket] Market cache cleared for ${marketId}`);
}

// Get current market subscribers

function getMarketSubscribers(marketId) {
    return socketServer.getMarketSubscribers(marketId);
}


// Broadcast volatile market alert
// Called by circuit breaker when volatility exceeds threshold

function emitVolatilityAlert(marketId, alert) {
    try {
        const io = socketServer.getIO();
        io.to(marketId).emit("market:alert", {
            type: "volatility",
            marketId,
            message: alert.message,
            severity: alert.severity, // "info", "warning", "critical"
            currentPrice: alert.currentPrice,
            priceChange: alert.priceChange,
            changePercent: alert.changePercent,
            timestamp: new Date(),
        });

        logger.warn(`[MarketSocket] Volatility alert sent for market ${marketId}`);
    } catch (error) {
        logger.error(`[MarketSocket] Error sending volatility alert: ${error.message}`);
    }
}


// Broadcast market halted alert
// Called by circuit breaker when trading halts

function emitMarketHalted(marketId, reason, resumeTime) {
    try {
        const io = socketServer.getIO();
        io.to(marketId).emit("market:halted", {
            marketId,
            reason,
            resumeTime,
            haltedAt: new Date(),
            estimatedResume: new Date(Date.now() + resumeTime),
        });

        logger.warn(`[MarketSocket] Market halted for ${marketId}: ${reason}`);
    } catch (error) {
        logger.error(`[MarketSocket] Error sending halt alert: ${error.message}`);
    }
}

module.exports = {
    onOrderBookUpdate,
    onTradeExecuted,
    onPositionUpdate,
    onOrderFilled,
    getPriceHistory,
    getRecentTrades,
    clearMarketCache,
    getMarketSubscribers,
    emitVolatilityAlert,
    emitMarketHalted,
};
