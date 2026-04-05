import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
    buyorderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sellorderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    outcomeId: {
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
  },
  { timestamps: true },
);

const tradeModal =
  mongoose.models.trade || mongoose.model("trade", tradeSchema);
module.exports = tradeModal;
