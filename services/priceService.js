const orderBook = require("../engine/orderBook");
const marketSocket = require("./marketSocket");
const socketServer = require("./socketServer");
const logger = require("../utils/logger");

// Track active price streams
const activeStreams = new Map(); // marketId -> intervalId
const streamConfig = {
    updateInterval: 100, // 100ms price update frequency
    maxHistorySize: 1000,
};


// Start real-time price stream for a market
// Continuously monitors order book and emits updates

function startPriceStream(marketId, options = {}) {
    // Prevent duplicate streams
    if (activeStreams.has(marketId)) {
        logger.warn(`[PriceService] Price stream already active for market ${marketId}`);
        return;
    }

    const interval = options.interval || streamConfig.updateInterval;
    let lastPrices = null;

    const streamInterval = setInterval(() => {
        try {
            // Get order book for both outcomes (yes/no)
            const yesBook = orderBook.getBook(marketId, "yes");
            const noBook = orderBook.getBook(marketId, "no");

            // Calculate prices
            const yesPrice = calculatePriceFromBook(yesBook);
            const noPrice = 1 - yesPrice; // Binary market: yes + no = 1

            // Check if price changed
            if (
                !lastPrices ||
                lastPrices.yes !== yesPrice ||
                lastPrices.no !== noPrice
            ) {
                lastPrices = { yes: yesPrice, no: noPrice };

                // Emit update
                socketServer.emitPrice(marketId, {
                    bid: yesBook.bids[0]?.price || yesPrice - 0.01,
                    ask: yesBook.asks[0]?.price || yesPrice + 0.01,
                    last: yesPrice,
                    volume: calculateVolume(yesBook) + calculateVolume(noBook),
                });

                // Emit order book snapshot
                socketServer.emitOrderBook(marketId, {
                    bids: yesBook.bids,
                    asks: yesBook.asks,
                    depth: 20,
                });
            }

            // Check subscribers
            const subscribers = socketServer.getMarketSubscribers(marketId);
            if (subscribers === 0) {
                logger.debug(`[PriceService] No subscribers for market ${marketId}, stopping stream`);
                stopPriceStream(marketId);
            }
        } catch (error) {
            logger.error(`[PriceService] Error in price stream: ${error.message}`);
        }
    }, interval);

    activeStreams.set(marketId, streamInterval);
    logger.info(`[PriceService] Price stream started for market ${marketId} (${interval}ms interval)`);
}

// Stop price stream for a market
function stopPriceStream(marketId) {
    const intervalId = activeStreams.get(marketId);
    if (intervalId) {
        clearInterval(intervalId);
        activeStreams.delete(marketId);
        logger.info(`[PriceService] Price stream stopped for market ${marketId}`);
    }
}


// Calculate mid-price from order book

function calculatePriceFromBook(book) {
    const topBid = book.bids?.[0]?.price || 0;
    const topAsk = book.asks?.[0]?.price || 1;

    // Prevent invalid prices
    const bid = Math.max(0, Math.min(1, topBid));
    const ask = Math.max(0, Math.min(1, topAsk));

    // If spread is very wide or no orders, return midpoint
    if (ask - bid > 0.5 || (bid === 0 && ask === 1)) {
        return 0.5; // Fair value for balanced market
    }

    return (bid + ask) / 2;
}

// Calculate total volume from order book side
function calculateVolume(bookSide = {}) {
    const orders = bookSide.bids?.length
        ? bookSide.bids
        : bookSide.asks || [];
    return orders.reduce((sum, order) => sum + (order.quantity || 0), 0);
}

// Notify price update (called from matching engine)
function onOrderBookChanged(marketId, context) {
    try {
        // Start stream if not already running
        if (!activeStreams.has(marketId)) {
            startPriceStream(marketId);
        }

        // Immediately emit update if order book changed
        const yesBook = orderBook.getBook(marketId, "yes");
        const noBook = orderBook.getBook(marketId, "no");

        marketSocket.onOrderBookUpdate(marketId, yesBook, {
            lastTrade: context?.lastTrade,
        });

        logger.debug(`[PriceService] Order book change detected for market ${marketId}`);
    } catch (error) {
        logger.error(`[PriceService] Error handling order book change: ${error.message}`);
    }
}

// Notify trade execution (called from matching engine)
function onTradeExecuted(marketId, trade) {
    try {
        const yesBook = orderBook.getBook(marketId, "yes");
        marketSocket.onTradeExecuted(marketId, trade, yesBook);

        logger.info(`[PriceService] Trade notification sent for market ${marketId}`);
    } catch (error) {
        logger.error(`[PriceService] Error handling trade execution: ${error.message}`);
    }
}


// Get current price for a market
function getCurrentPrice(marketId) {
    try {
        const yesBook = orderBook.getBook(marketId, "yes");
        const bid = yesBook.bids?.[0]?.price || 0;
        const ask = yesBook.asks?.[0]?.price || 1;
        const mid = calculatePriceFromBook(yesBook);
        const volume = calculateVolume(yesBook) + calculateVolume(orderBook.getBook(marketId, "no"));

        return {
            bid: Math.max(0, Math.min(1, bid)),
            ask: Math.max(0, Math.min(1, ask)),
            mid,
            volume,
            timestamp: new Date(),
        };
    } catch (error) {
        logger.error(`[PriceService] Error getting current price: ${error.message}`);
        return { bid: 0, ask: 1, mid: 0.5, volume: 0 };
    }
}

// Get all active market streams

function getActiveMarkets() {
    return Array.from(activeStreams.keys());
}

// Stop all price streams (shutdown)
function stopAllStreams() {
    for (const [marketId, intervalId] of activeStreams.entries()) {
        clearInterval(intervalId);
    }
    activeStreams.clear();
    logger.info(`[PriceService] All price streams stopped`);
}

module.exports = {
    startPriceStream,
    stopPriceStream,
    onOrderBookChanged,
    onTradeExecuted,
    getCurrentPrice,
    getActiveMarkets,
    stopAllStreams,
};
