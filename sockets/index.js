export default function initSockets(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_market", (marketId) => {
      socket.join(marketId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
}