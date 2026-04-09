import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
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
      enum: ["limit", "market"],
      required: true,
    },
    side: { type: String, enum: ["buy", "sell"], default: "buy" },
    outcome: { type: String, enum: ["yes", "no"], default: "yes" },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    filledQty: { type: Number, default: 0 },
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
  { timestamps: true },
);

orderSchema.index({ marketId: 1, outcomeId: 1, side: 1, price: -1, createdAt: 1 });

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);
module.exports = orderModel;
