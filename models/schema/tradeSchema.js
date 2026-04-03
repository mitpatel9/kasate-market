import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
  buyorderId,
  

    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "markets",
      required: true,
    },
    outcomeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "outcomes",
      required: true,
    },
    orderId: { type: String },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    order_type: {
      type: String,
      enum: ["LIMIT", "MARKET"],
      required: true,
    },
    side: { type: String, enum: ["BUY", "SELL"], default: "BUY" },
    outcome: { type: String, enum: ["YES", "NO"], default: "YES" },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    filledQty: { type: Number, default: 0 },
    remaining_quantity: { type: Number, default: 0 },
    lockedAmount: {
      type: Number,
      default: 0,
    },
    timeInForce: {
      type: String,
      enum: ["GTC", "IOC", "EST", "DATE"],
      default: "GTC",
    },
    cancelReason: {
      type: String,
    },
    status: {
      type: String,
      enum: ["OPEN", "PARTIAL", "FILLED", "CANCELLED", "REJECTED"],
      default: "OPEN",
      index: true,
    },
  },
  {
    timestamp: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const tradeModal =
  mongoose.models.trade || mongoose.model("trade", tradeSchema);
module.exports = tradeModal;
