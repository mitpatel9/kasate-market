const { Server } = require("socket.io");

let io;

function init(server) {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinMarket", (marketId) => {
      socket.join(marketId);
    });
  });
}

function emitOrderBook(marketId, data) {
  io.to(marketId).emit("orderbook:update", data);
}

function emitTrade(marketId, trade) {
  io.to(marketId).emit("trade:new", trade);
}

function emitPosition(userId, position) {
  io.to(userId.toString()).emit("position:update", position);
}

module.exports = {
  init,
  emitOrderBook,
  emitTrade,
  emitPosition,
};