// SOCKET.IO REAL-TIME PRICE UPDATES - INTEGRATION GUIDE

/** ============================================================================
 * PART 1: FRONTEND SETUP (React/Next.js Client)
 * ============================================================================ */

// 1. Install Socket.IO client (already in package.json)
// npm install socket.io-client

// 2. Create a hook for Socket.IO connection
// pages/hooks/useMarketSocket.js
/*
import { useEffect, useState } from "react";
import io from "socket.io-client";

export function useMarketSocket(marketId, userId) {
  const [socket, setSocket] = useState(null);
  const [price, setPrice] = useState(null);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    // Join market
    newSocket.emit("joinMarket", { marketId, userId });

    // Listen to price updates
    newSocket.on("price:update", (data) => {
      console.log("Price update:", data);
      setPrice(data);
    });

    // Listen to order book updates
    newSocket.on("orderbook:update", (data) => {
      console.log("Order book update:", data);
      setOrderBook(data);
    });

    // Listen to trade events
    newSocket.on("trade:new", (trade) => {
      console.log("New trade:", trade);
      setTrades((prev) => [trade, ...prev].slice(0, 50));
    });

    // Listen to position updates
    newSocket.on("position:update", (position) => {
      console.log("Position update:", position);
      // Update user position state
    });

    // Listen to order fills
    newSocket.on("order:filled", (fill) => {
      console.log("Order filled:", fill);
      // Update user's open orders
    });

    // Listen to market alerts
    newSocket.on("market:alert", (alert) => {
      console.log("Market alert:", alert);
      // Show notification to user
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit("leaveMarket", { marketId, userId });
      newSocket.close();
    };
  }, [marketId, userId]);

  return { socket, price, orderBook, trades };
}
*/

// 3. Use in component
/*
function MarketChart({ marketId, userId }) {
  const { price, orderBook, trades } = useMarketSocket(marketId, userId);

  return (
    <div>
      <h3>Live Price</h3>
      {price && (
        <div>
          <p>Bid: ${price.bid.toFixed(2)}</p>
          <p>Ask: ${price.ask.toFixed(2)}</p>
          <p>Spread: ${price.spread.toFixed(4)}</p>
          <p>Volume: {price.volume}</p>
        </div>
      )}

      <h3>Order Book</h3>
      {orderBook && (
        <div>
          <h4>Bids</h4>
          {orderBook.bids.slice(0, 5).map((bid) => (
            <div key={bid._id}>
              {bid.price} x {bid.quantity}
            </div>
          ))}

          <h4>Asks</h4>
          {orderBook.asks.slice(0, 5).map((ask) => (
            <div key={ask._id}>
              {ask.price} x {ask.quantity}
            </div>
          ))}
        </div>
      )}

      <h3>Recent Trades</h3>
      {trades.slice(0, 10).map((trade) => (
        <div key={trade._id}>
          {trade.price} - {trade.quantity} @ {trade.timestamp}
        </div>
      ))}
    </div>
  );
}
*/

/** ============================================================================
 * PART 2: BACKEND INTEGRATION (Node.js Server)
 * ============================================================================ */

// 1. Update package.json scripts
/*
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "node server.js",
    "lint": "next lint"
  }
*/

// 2. Run the custom server
// npm run dev
// Server will start on http://localhost:3000 with Socket.IO enabled

/** ============================================================================
 * PART 3: MATCHING ENGINE INTEGRATION
 * ============================================================================ */

// In matchingEngine.js, after executing trades:
/*
const priceService = require("../services/priceService");

// After trade is matched
const trade = {
  buyOrderId: buyOrder._id,
  sellOrderId: sellOrder._id,
  price: executionPrice,
  quantity: fillQuantity,
  takerSide: "buy",
  timestamp: new Date(),
};

// Store trade in database
await tradeModel.create(trade);

// Notify price service (real-time broadcast)
priceService.onTradeExecuted(marketId, trade);

// Update user positions and wallets
// ...

// Emit position updates to users
const positionService = require("../services/positionService");
const buyerPosition = await positionService.getPosition(buyOrder.userId, marketId);
const sellerPosition = await positionService.getPosition(sellOrder.userId, marketId);

priceService.onOrderBookChanged(marketId, { lastTrade: trade });
*/

/** ============================================================================
 * PART 4: ORDER SUBMISSION FLOW (API Endpoint)
 * ============================================================================ */

// In pages/api/order/submit.js:
/*
const priceService = require("../../../services/priceService");
const socketServer = require("../../../sockets/socketServer");
const marketSocket = require("../../../sockets/marketSocket");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { userId, marketId, side, price, quantity } = req.body;

    // 1. Validate order
    // 2. Lock wallet funds
    // 3. Create order in database
    const order = await orderModel.create({
      userId,
      marketId,
      side,
      price,
      quantity,
      status: "OPEN",
    });

    // 4. Add to order book
    orderBook.addOrderToBook(order);

    // 5. Invoke matching engine
    const matchResult = await matchingEngine.matchOrder(order);

    // 6. If trades executed, notify via Socket.IO
    if (matchResult.trades.length > 0) {
      for (const trade of matchResult.trades) {
        priceService.onTradeExecuted(marketId, trade);

        // Send trade notification to both parties
        socketServer.emitTrade(marketId, trade);
      }
    }

    // 7. Update prices in real-time
    priceService.onOrderBookChanged(marketId);

    res.status(200).json({
      orderId: order._id,
      filled: matchResult.totalFilled,
      remaining: matchResult.remaining,
      trades: matchResult.trades,
    });
  } catch (error) {
    console.error("Order submission error:", error);
    res.status(500).json({ error: error.message });
  }
}
*/

/** ============================================================================
 * PART 5: MESSAGE FLOW DIAGRAM
 * ============================================================================ */

/*
User Action                    Socket.IO                  Backend Processing
=============================================================================

1. User Opens Market UI
   ├─ joinMarket event ──────► Socket stores userId + room
   │                          in connectedUsers map
   │
   ├─ Server emits
   │  price:current ◄─────────── Latest price from cache
   │
   └─ Client subscribes to
      real-time updates

2. User Places Order
   ├─ POST /api/order/submit ──► Validate order
   │                            Lock wallet funds
   │                            Create Order in DB
   │                            Add to orderBook
   │                            Invoke matchingEngine
   │
   ├─ Match Engine
   │  executes trades ────────► onTradeExecuted()
   │                            │
   │  Update positions ──────► onPositionUpdate()
   │                            │
   │  Store in DB ───────────► Update Position doc
   │
   ├─ Price Service
   │  emits updates ────────► socketServer.emitTrade()
   │                            socketServer.emitPrice()
   │                            socketServer.emitOrderBook()
   │
   ├─ All subscribers get
   │  real-time updates ◄────── Socket.IO broadcast
   │  - Price change
   │  - Order book change
   │  - Trade executed
   │  - Position updated
   │  - Order filled

3. User Receives Notifications
   ├─ price:update event
   │  price = { bid, ask, last, volume, spread }
   │
   ├─ orderbook:update event
   │  { bids: [...], asks: [...], depth: 20 }
   │
   ├─ trade:new event
   │  { price, quantity, side, takerSide, ... }
   │
   ├─ position:update event
   │  { yesShares, noShares, unrealizedPnL, ... }
   │
   └─ order:filled event
      { orderId, filledQuantity, filledPrice, ... }
*/

/** ============================================================================
 * PART 6: SOCKET.IO EVENTS REFERENCE
 * ============================================================================ */

/*
CLIENT EMITS (Server receives):
─────────────────────────────
joinMarket(data)
  - data: { marketId, userId }
  - Effect: Subscribe to market price/trade updates

leaveMarket(data)
  - data: { marketId, userId }
  - Effect: Unsubscribe from market

ping()
  - Effect: Heartbeat to check connection

SERVER EMITS (Client receives):
─────────────────────────────

price:current(data)
  - Sent on joinMarket
  - data: { bid, ask, last, spread, volume, timestamp }

price:update(data)
  - Sent when price changes
  - data: { bid, ask, last, spread, volume, timestamp }

orderbook:update(data)
  - Sent when order book changes
  - data: { bids: [...], asks: [...], depth, timestamp }

trade:new(trade)
  - Sent when trade executes
  - trade: { price, quantity, side, takerSide, timestamp }

position:update(position)
  - Sent to user when position changes
  - position: { yesShares, noShares, unrealizedPnL, ... }

order:filled(fill)
  - Sent to order owner
  - fill: { orderId, filledQuantity, filledPrice, status }

market:alert(alert)
  - Sent on volatility/halt
  - alert: { type, severity, message, currentPrice, ... }

market:halted(data)
  - Sent when trading halted
  - data: { reason, resumeTime, estimatedResume }

system:message(data)
  - System broadcast to all users
  - data: { message, timestamp }

pong(data)
  - Response to client ping
  - data: { timestamp }

market:snapshot(snapshot)
  - Complete market data
  - snapshot: { price, orderBook, lastTrades, volume24h }
*/

/** ============================================================================
 * PART 7: TROUBLESHOOTING
 * ============================================================================ */

/*
Issue: Socket.IO not connecting
────────────────────────────────
Solution:
1. Make sure server.js is running (not next dev)
2. Check CORS origin matches frontend URL
3. Verify port 3000 is not blocked by firewall
4. Check browser console for connection errors

Issue: Real-time prices not updating
────────────────────────────────────
Solution:
1. Verify matchingEngine.js calls priceService.onTradeExecuted()
2. Verify orderBook.addOrderToBook() is called for new orders
3. Check that priceService.startPriceStream() starts when users join market
4. Look for errors in server console logs

Issue: Position updates not showing
─────────────────────────────────
Solution:
1. Verify socketServer.emitPosition() is called after trade
2. Make sure user is connected (connected to socket with their userId)
3. Check that position data includes all required fields

Issue: Order book snapshot very large
──────────────────────────────────
Solution:
1. Limit orderbook depth in socketServer.emitOrderBook()
  - Only send top 20 bids/asks instead of all
2. Compress data before sending
3. Throttle updates to 100ms minimum
*/

/** ============================================================================
 * PART 8: PERFORMANCE OPTIMIZATION
 * ============================================================================ */

/*
Update Frequency:
─────────────────
- Price updates: 100ms (10 times per second)
- Order book: On change (100ms minimum)
- Trades: Immediate (< 1ms after execution)
- Positions: 200ms debounced

Connection Settings:
────────────────────
- pingInterval: 25 seconds
- pingTimeout: 60 seconds
- Transports: websocket (primary), polling (fallback)

Memory Usage:
─────────────
- Active streams: 1 per market
- Price history: 100 entries per market (~5KB each)
- Trade history: 50 entries per market (~2KB each)
- Connected users: 1 entry per user (~500 bytes)

Expected for 10,000 concurrent users:
- Memory: ~5-10MB for Socket.IO
- CPU: <5% idle, <20% during active trading
- Network: 1-2 Mbps per 1000 users
*/

/** ============================================================================
 * PART 9: DEPLOYMENT CHECKLIST
 * ============================================================================ */

/*
✅ Frontend Setup
  □ Install socket.io-client
  □ Create useMarketSocket hook
  □ Add price/orderbook/trade components
  □ Set correct Socket.IO server URL for production

✅ Backend Setup
  □ Verify server.js is production-ready
  □ Update CORS origin for production domain
  □ Set NODE_ENV=production in environment
  □ Configure reverse proxy (nginx) for Socket.IO WebSocket upgrade

✅ Integration
  □ Wire matchingEngine to call priceService
  □ Update order API endpoint to emit Socket.IO events
  □ Test end-to-end: Place order → See real-time updates

✅ Monitoring
  □ Add Socket.IO connection metrics
  □ Monitor CPU/memory under load
  □ Set up alerts for disconnections
  □ Log all Socket.IO events in production

✅ Testing
  □ Test with 100 concurrent users
  □ Test rapid order placement (100 orders/second)
  □ Test network disconnection recovery
  □ Test price updates under high volatility
*/
