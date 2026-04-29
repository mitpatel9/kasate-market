import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    matchId: { type: String },
    outcomeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    buyOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sellOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    takerSide: { type: String, enum: ["buy", "sell"] },
    MakerSide: { type: String, enum: ["buy", "sell"] },
    executionType: { type: String, enum: ["limit", "market"] },
    status: {
      type: String,
      enum: ["Executed", "Settled", "cancelled"],
      default: "Executed",
    },
  },
  { timestamps: true },
);

export const tradeModel =
  mongoose.models.trade || mongoose.model("trade", tradeSchema);
